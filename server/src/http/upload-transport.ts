/** Preserve raw path/Expect behavior and own one bounded in-memory collector per admitted upload. */
import type { FastifyInstance, FastifyRequest, FastifyReply, FastifyServerOptions } from "fastify";
import { createServer, IncomingMessage } from "node:http";
import type { ServerResponse } from "node:http";
import type { Socket } from "node:net";
import type { Readable } from "node:stream";
import { MAX_UPLOAD_BYTES } from "../contracts/mp3.ts";
import type { PublicErrorCode } from "../contracts/errors.ts";
import type { DocsResources } from "../docs.ts";
import type { ApiBudgets } from "./config.ts";
import { rejectRawBody, sendPublicError, UploadError } from "./errors.ts";
import { createShutdownController } from "./lifecycle.ts";
import type { ShutdownController } from "./lifecycle.ts";

interface UploadState {
  release(): void;
  cancel(): void;
  read(payload: Readable, done: (error: Error | null, body?: Buffer) => void): void;
}

/** One API instance owns its collectors, sockets, verified docs and shutdown controller through this boundary. */
export interface UploadTransport {
  readonly budgets: Readonly<ApiBudgets>;
  readonly serverFactory: NonNullable<FastifyServerOptions["serverFactory"]>;
  readonly lifecycle: ShutdownController;
  /** Set the finite verified resource map before production listening; request paths never select disk files. */
  setDocs(resources: DocsResources): void;
  /** Whether shutdown has synchronously stopped new upload admission. */
  isStopping(): boolean;
  /** Validate relevant headers and reserve a slot before body allocation; return false after an early reply. */
  admit(request: FastifyRequest, reply: FastifyReply): boolean;
  /** Collect the original stream once using the previously reserved slot. */
  read(request: FastifyRequest, payload: Readable, done: (error: Error | null, body?: Buffer) => void): void;
  /** Release request storage/timers and its slot once across all terminal paths. */
  release(request: FastifyRequest): void;
  /** Release first and then send a closed catalogue error through the appropriate normal/native writer. */
  reject(request: FastifyRequest, reply: FastifyReply, code: PublicErrorCode): void;
}

/** Reserve one lifecycle, with collection, parsing, response and abort paths sharing an idempotent release. */
function createUploadState(
  request: FastifyRequest,
  reply: FastifyReply,
  budgets: Readonly<ApiBudgets>,
  declaredLength: number | undefined,
  expectContinue: boolean,
  releaseAdmission: () => void,
): UploadState {
  const raw = request.raw;
  let buffer: Buffer | undefined;
  let received = 0;
  let released = false;
  let readSettled = false;
  let payload: Readable | undefined;
  let parserDone: ((error: Error | null, body?: Buffer) => void) | undefined;
  let bodyDeadline: NodeJS.Timeout | undefined;
  let idleDeadline: NodeJS.Timeout | undefined;

  /** Stop collection only; completed bytes retain admission until the route has finished producing its reply. */
  const stopReading = (): void => {
    clearTimeout(bodyDeadline);
    clearTimeout(idleDeadline);
    payload?.off("data", onData);
    payload?.off("end", onEnd);
  };
  /** Discard the collector and Fastify body references and restore capacity exactly once. */
  const release = (): void => {
    if (released) return;
    released = true;
    stopReading();
    buffer = undefined;
    request.body = undefined;
    raw.off("aborted", onAbort);
    raw.off("error", onAbort);
    reply.raw.off("close", onAbort);
    releaseAdmission();
  };
  /** Settle the custom parser once so an aborted request retains no pending continuation or buffer. */
  const finishReading = (error: Error | null, body?: Buffer): void => {
    if (readSettled) return;
    readSettled = true;
    stopReading();
    if (error) release();
    const done = parserDone;
    parserDone = undefined;
    done?.(error, body);
  };
  /** An already disconnected client cannot receive JSON, but still needs parser settlement and slot cleanup. */
  const onAbort = (): void => {
    finishReading(new UploadError("UPLOAD_INCOMPLETE"));
    release();
  };
  /** Check real received bytes before copying; only data refreshes the independent inactivity deadline. */
  const onData = (chunk: Buffer): void => {
    if (released || readSettled) return;
    if (!Buffer.isBuffer(chunk)) {
      finishReading(new UploadError("INTERNAL_ERROR"));
      return;
    }
    if (chunk.length > MAX_UPLOAD_BYTES - received) {
      finishReading(new UploadError("UPLOAD_TOO_LARGE"));
      return;
    }
    if (!buffer || chunk.length > buffer.length - received) {
      finishReading(new UploadError("UPLOAD_INCOMPLETE"));
      return;
    }
    chunk.copy(buffer, received);
    received += chunk.length;
    idleDeadline?.refresh();
  };
  /** Deliver a complete initialized view; native framing checks remain active while injection has no HTTP parser. */
  const onEnd = (): void => {
    if (released || readSettled) return;
    if (
      (raw instanceof IncomingMessage && !raw.complete) ||
      (declaredLength !== undefined && received !== declaredLength)
    ) {
      finishReading(new UploadError("UPLOAD_INCOMPLETE"));
    } else if (received === 0) {
      finishReading(new UploadError("UPLOAD_EMPTY"));
    } else if (!buffer) {
      finishReading(new UploadError("INTERNAL_ERROR"));
    } else {
      finishReading(null, buffer.subarray(0, received));
    }
  };
  raw.once("aborted", onAbort);
  raw.on("error", onAbort);
  // Late native errors following release/rejection must not become unhandled stream errors.
  raw.on("error", () => {});
  reply.raw.once("close", onAbort);
  return {
    release,
    cancel: onAbort,
    read(stream, done): void {
      if (released) {
        done(new UploadError("UPLOAD_INCOMPLETE"));
        return;
      }
      payload = stream;
      parserDone = done;
      payload.on("data", onData);
      payload.once("end", onEnd);
      bodyDeadline = setTimeout(() => finishReading(new UploadError("UPLOAD_TIMEOUT")), budgets.bodyTimeoutMs);
      idleDeadline = setTimeout(
        () => finishReading(new UploadError("UPLOAD_IDLE_TIMEOUT")),
        budgets.inactivityTimeoutMs,
      );
      bodyDeadline.unref();
      idleDeadline.unref();
      try {
        // Admission, one allocation and both deadlines precede Continue; no chunk array or second whole-file copy.
        buffer = Buffer.allocUnsafe(declaredLength ?? MAX_UPLOAD_BYTES);
        if (expectContinue) reply.raw.writeContinue();
        payload.resume();
      } catch {
        finishReading(new UploadError("INTERNAL_ERROR"));
      }
    },
  };
}

/** Create dormant instance-local state and a native server factory; sockets/timers appear only on actual operations. */
export function createUploadTransport(budgets: Readonly<ApiBudgets>): UploadTransport {
  let activeUploads = 0;
  let stopping = false;
  let docs: DocsResources | undefined;
  const sockets = new Set<Socket>();
  const continued = new WeakSet<IncomingMessage>();
  const uploads = new WeakMap<IncomingMessage, UploadState>();
  const activeStates = new Set<UploadState>();
  const lifecycle = createShutdownController(
    sockets,
    budgets.shutdownTimeoutMs,
    () => {
      stopping = true;
    },
    () => {
      for (const state of activeStates) state.cancel();
    },
  );
  const release = (request: FastifyRequest): void => {
    uploads.get(request.raw)?.release();
  };
  const reject = (request: FastifyRequest, reply: FastifyReply, code: PublicErrorCode): void => {
    release(request);
    sendPublicError(request, reply, code, budgets.rejectionDrainMs);
  };
  return {
    budgets,
    lifecycle,
    setDocs(resources): void {
      docs = resources;
    },
    isStopping: () => stopping,
    release,
    reject,
    admit(request, reply): boolean {
      const mediaType = request.headers["content-type"]?.split(";", 1)[0]?.trim().toLowerCase();
      if (mediaType !== "audio/mpeg" && mediaType !== "application/octet-stream") {
        reject(request, reply, "UNSUPPORTED_MEDIA_TYPE");
        return false;
      }
      const encoding = request.headers["content-encoding"]?.trim().toLowerCase();
      if (encoding !== undefined && encoding !== "identity") {
        reject(request, reply, "UNSUPPORTED_CONTENT_ENCODING");
        return false;
      }
      const lengthHeader = request.headers["content-length"];
      const declaredLength = lengthHeader === undefined ? undefined : Number(lengthHeader);
      if (declaredLength !== undefined && (!Number.isSafeInteger(declaredLength) || declaredLength < 0)) {
        reject(request, reply, "REQUEST_INVALID");
        return false;
      }
      if (declaredLength !== undefined && declaredLength > MAX_UPLOAD_BYTES) {
        reject(request, reply, "UPLOAD_TOO_LARGE");
        return false;
      }
      if (stopping || activeUploads >= budgets.maxActiveUploads) {
        reject(request, reply, "SERVICE_BUSY");
        return false;
      }
      activeUploads += 1;
      const state = createUploadState(request, reply, budgets, declaredLength, continued.has(request.raw), () => {
        activeUploads -= 1;
        activeStates.delete(state);
      });
      uploads.set(request.raw, state);
      activeStates.add(state);
      return true;
    },
    read(request, payload, done): void {
      const state = uploads.get(request.raw);
      if (!state) {
        done(new UploadError("INTERNAL_ERROR"));
        return;
      }
      state.read(payload, done);
    },
    serverFactory(handler) {
      /** Raw path spelling and route/method precedence are checked before native router normalization. */
      const dispatch = (request: IncomingMessage, response: ServerResponse): void => {
        request.socket.setTimeout(0);
        const pathname = (request.url ?? "").split("?", 1)[0];
        if (pathname === "/docs" || pathname?.startsWith("/docs/")) {
          response.setHeader("Referrer-Policy", "no-referrer");
          const resource = docs?.get(pathname);
          if (pathname !== "/docs" && !resource) {
            rejectRawBody(request, response, "ROUTE_NOT_FOUND", budgets.rejectionDrainMs, "documentation");
          } else if (request.method !== "GET" && request.method !== "HEAD") {
            response.setHeader("Allow", "GET, HEAD");
            rejectRawBody(request, response, "METHOD_NOT_ALLOWED", budgets.rejectionDrainMs, "documentation");
          } else {
            // Docs never enter upload hooks or collection, even with a declared body or saturated upload admission.
            request.on("error", () => {});
            if (request.headers["transfer-encoding"] || Number(request.headers["content-length"] ?? 0) > 0) {
              response.setHeader("Connection", "close");
            }
            response.setHeader("Cache-Control", "no-store");
            response.setHeader("X-Content-Type-Options", "nosniff");
            if (pathname === "/docs") {
              response.writeHead(308, { Location: "/docs/", "Content-Length": "0" });
              response.end();
            } else if (resource) {
              response.setHeader("Content-Type", resource.contentType);
              response.setHeader("Content-Length", resource.body.length);
              if (resource.contentDisposition) response.setHeader("Content-Disposition", resource.contentDisposition);
              response.writeHead(200);
              response.end(request.method === "HEAD" ? undefined : resource.body);
            }
          }
          return;
        }
        if (pathname !== "/file-upload" && pathname !== "/healthz") {
          rejectRawBody(request, response, "ROUTE_NOT_FOUND", budgets.rejectionDrainMs);
          return;
        }
        const allowed = pathname === "/healthz" ? "GET" : "POST";
        if (request.method !== allowed) {
          response.setHeader("Allow", allowed);
          rejectRawBody(request, response, "METHOD_NOT_ALLOWED", budgets.rejectionDrainMs);
          return;
        }
        handler(request, response);
      };
      const server = createServer(
        {
          requestTimeout: 0,
          headersTimeout: budgets.headersTimeoutMs,
          connectionsCheckingInterval: Math.min(1_000, budgets.headersTimeoutMs),
          keepAliveTimeout: 5_000,
          maxHeaderSize: 8_192,
          highWaterMark: 65_536,
        },
        dispatch,
      );
      server.maxConnections = budgets.maxConnections;
      // Keep every field within the native strict byte cap; Node otherwise truncates exposed headers by count.
      server.maxHeadersCount = 0;
      server.setTimeout(budgets.inactivityTimeoutMs, (socket) => socket.destroy());
      server.on("checkContinue", (request, response) => {
        continued.add(request);
        dispatch(request, response);
      });
      server.on("checkExpectation", (request, response) => {
        const pathname = (request.url ?? "").split("?", 1)[0];
        if (pathname === "/docs" || pathname?.startsWith("/docs/")) dispatch(request, response);
        else rejectRawBody(request, response, "EXPECTATION_FAILED", budgets.rejectionDrainMs);
      });
      server.on("connection", (socket) => {
        sockets.add(socket);
        socket.once("close", () => sockets.delete(socket));
      });
      return server;
    },
  };
}

/** Install upload-only admission, one raw collector and terminal cleanup before the MP3 routes in this scope. */
export function registerUploadTransport(app: FastifyInstance, transport: UploadTransport): void {
  app.addHook("onRequest", (request, reply, done) => {
    if (transport.admit(request, reply)) done();
  });
  app.removeAllContentTypeParsers();
  app.addContentTypeParser("*", (request, payload, done) => transport.read(request, payload, done));
  app.addHook("onResponse", (request, _reply, done) => {
    transport.release(request);
    done();
  });
  app.addHook("onRequestAbort", (request, done) => {
    transport.release(request);
    done();
  });
  app.addHook("onTimeout", (request, _reply, done) => {
    transport.release(request);
    done();
  });
}
