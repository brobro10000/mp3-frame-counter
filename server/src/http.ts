/**
 * Fastify transport for the frozen MP3 upload contract. createApiServer returns an unbound service with asynchronous
 * readiness/listen and idempotent bounded shutdown; callers choose the listen address. Requests stay in memory, never
 * enter a file or log, and reach the pure parser only after a complete bounded body. Typed parser failures become safe
 * JSON responses.
 */
import Fastify from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import type { Socket } from "node:net";
import type { Readable } from "node:stream";
import { Mp3ParseError } from "./errors.ts";
import { countMp3Frames } from "./mp3.ts";
import { loadDocs } from "./docs.ts";
import type { DocsResources } from "./docs.ts";

export const MAX_UPLOAD_BYTES = 20_971_520;

export interface ApiBudgets {
  maxActiveUploads: number;
  maxConnections: number;
  bodyTimeoutMs: number;
  inactivityTimeoutMs: number;
  headersTimeoutMs: number;
  shutdownTimeoutMs: number;
  rejectionDrainMs: number;
}

export const DEFAULT_API_BUDGETS: Readonly<ApiBudgets> = Object.freeze({
  maxActiveUploads: 2,
  maxConnections: 64,
  bodyTimeoutMs: 30_000,
  inactivityTimeoutMs: 10_000,
  headersTimeoutMs: 10_000,
  shutdownTimeoutMs: 5_000,
  rejectionDrainMs: 1_000,
});

export interface ApiService {
  server: Server;
  listen(port: number, host: string): Promise<void>;
  shutdown(): Promise<void>;
}

/** PORT is the sole runtime setting; tests use the service readiness boundary to bind ephemeral port zero. */
export function parsePort(value: string | undefined): number {
  if (value === undefined) return 3_000;
  if (!/^[0-9]+$/.test(value)) throw new Error("PORT must be an integer between 1 and 65535.");
  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  return port;
}

/** Emit exactly one JSON object; HEAD keeps the corresponding metadata but has no response body. */
function json(
  request: IncomingMessage,
  response: ServerResponse,
  status: number,
  body: object,
  deferEnd = false,
): void {
  if (response.destroyed || response.writableEnded) return;
  const serialized = JSON.stringify(body);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(serialized),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (deferEnd) {
    if (request.method !== "HEAD") response.write(serialized);
    response.flushHeaders();
  } else response.end(request.method === "HEAD" ? undefined : serialized);
}

/**
 * Flush the rejection before closing. Pause discard after 64 KiB (plus a possible delivered chunk) without retention;
 * bound connection lifetime and never destroy a response merely because the peer is still writing an oversized body.
 */
function rejectBody(
  request: IncomingMessage,
  response: ServerResponse,
  status: number,
  message: string,
  drainMs: number,
): void {
  const socket = request.socket;
  response.setHeader("Connection", "close");
  if (request.complete) {
    json(request, response, status, { error: message });
    return;
  }
  let discarded = 0;
  const discard = (chunk: Buffer) => {
    discarded += chunk.length;
    if (discarded >= 65_536) request.pause();
  };
  request.on("data", discard);
  request.on("error", () => {});
  const finish = () => response.end();
  request.once("end", finish);
  const deadline = setTimeout(() => {
    response.end();
    socket.destroySoon();
  }, drainMs);
  deadline.unref();
  socket.once("close", () => {
    clearTimeout(deadline);
    request.off("data", discard);
    request.off("end", finish);
  });
  // Content-Length makes the full error readable now, while delaying FIN avoids racing a client's pending body write.
  json(request, response, status, { error: message }, true);
  request.resume();
}

/** Fixed transport failures are translated to the closed public error shape, never framework diagnostics. */
class UploadError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface UploadState {
  release(): void;
  read(payload: Readable, done: (error: Error | null, body?: Buffer) => void): void;
}

/** Reserve one upload lifecycle; collection and every terminal event share one idempotent release operation. */
function createUploadState(
  request: FastifyRequest,
  reply: FastifyReply,
  budgets: ApiBudgets,
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

  /** Stop only collection; a completed body retains its admission slot until the route finishes counting. */
  const stopReading = (): void => {
    clearTimeout(bodyDeadline);
    clearTimeout(idleDeadline);
    payload?.off("data", onData);
    payload?.off("end", onEnd);
  };
  /** Release admission once and discard request-owned storage, including Fastify's body reference. */
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
  /** Settle Fastify's parser once, including disconnected clients, so no continuation or buffer stays abandoned. */
  const finishReading = (error: Error | null, body?: Buffer): void => {
    if (readSettled) return;
    readSettled = true;
    stopReading();
    if (error) release();
    const done = parserDone;
    parserDone = undefined;
    done?.(error, body);
  };
  /** Disconnection settles any pending parser before cleanup; a later response close cannot release twice. */
  const onAbort = (): void => {
    finishReading(new UploadError(400, "The upload did not complete."));
    release();
  };
  /** Count actual bytes before copying into the single allocation and refresh only the inactivity deadline. */
  const onData = (chunk: Buffer): void => {
    if (released || readSettled) return;
    if (chunk.length > MAX_UPLOAD_BYTES - received) {
      finishReading(new UploadError(413, "The upload exceeds the 20 MiB limit."));
      return;
    }
    if (!buffer || chunk.length > buffer.length - received) {
      finishReading(new UploadError(400, "The request body does not match its declared length."));
      return;
    }
    chunk.copy(buffer, received);
    received += chunk.length;
    idleDeadline?.refresh();
  };
  /** Pass only a complete nonempty initialized view to the Fastify route; parser failures use its error handler. */
  const onEnd = (): void => {
    if (released || readSettled) return;
    if (!raw.complete) {
      finishReading(new UploadError(400, "The upload did not complete."));
    } else if (received === 0) {
      finishReading(new UploadError(400, "Choose a nonempty MP3 file."));
    } else {
      // The route receives only initialized bytes, as a view with no second whole-upload allocation.
      finishReading(null, buffer!.subarray(0, received));
    }
  };
  raw.once("aborted", onAbort);
  raw.on("error", onAbort);
  // Late errors after release/rejection must not become unhandled stream errors.
  raw.on("error", () => {});
  reply.raw.once("close", onAbort);

  return {
    release,
    /** Attach collection after admission and acknowledge Continue only when allocation and deadlines are ready. */
    read(stream, done): void {
      if (released) {
        done(new UploadError(400, "The upload did not complete."));
        return;
      }
      payload = stream;
      parserDone = done;
      payload.on("data", onData);
      payload.once("end", onEnd);
      bodyDeadline = setTimeout(
        () => finishReading(new UploadError(408, "The upload did not finish within the time limit.")),
        budgets.bodyTimeoutMs,
      );
      idleDeadline = setTimeout(
        () => finishReading(new UploadError(408, "The upload stopped sending data.")),
        budgets.inactivityTimeoutMs,
      );
      bodyDeadline.unref();
      idleDeadline.unref();
      try {
        // Allocate only after admission, before Continue; tiny chunks cannot create an unbounded object list.
        buffer = Buffer.allocUnsafe(declaredLength ?? MAX_UPLOAD_BYTES);
        if (expectContinue) reply.raw.writeContinue();
        payload.resume();
      } catch {
        finishReading(new UploadError(500, "The MP3 could not be analyzed. Please try again."));
      }
    },
  };
}

/** Configure transport without listening; callers must await listen before issuing requests and await shutdown. */
export function createApiServer(overrides: Partial<ApiBudgets> = {}): ApiService {
  const budgets = { ...DEFAULT_API_BUDGETS, ...overrides };
  for (const value of Object.values(budgets)) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error("API budgets must be positive safe integers.");
  }
  if (budgets.maxActiveUploads > budgets.maxConnections) {
    throw new Error("The upload budget cannot exceed the connection budget.");
  }

  let activeUploads = 0;
  let stopping = false;
  let startupPromise: Promise<void> | undefined;
  let shutdownPromise: Promise<void> | undefined;
  let docs: DocsResources | undefined;
  const sockets = new Set<Socket>();
  const continued = new WeakSet<IncomingMessage>();
  const uploads = new WeakMap<IncomingMessage, UploadState>();
  const app = Fastify({
    logger: false,
    exposeHeadRoutes: false,
    bodyLimit: MAX_UPLOAD_BYTES,
    return503OnClosing: false,
    forceCloseConnections: "idle",
    serverFactory(handler) {
      /** Preserve raw pathname/method precedence before router normalization; successful requests enter Fastify. */
      const dispatch = (request: IncomingMessage, response: ServerResponse): void => {
        request.socket.setTimeout(0);
        const pathname = (request.url ?? "").split("?", 1)[0];
        if (pathname === "/docs" || pathname?.startsWith("/docs/")) {
          response.setHeader("Referrer-Policy", "no-referrer");
          const resource = docs?.get(pathname);
          if (pathname !== "/docs" && !resource) {
            rejectBody(
              request,
              response,
              404,
              "The requested documentation resource does not exist.",
              budgets.rejectionDrainMs,
            );
          } else if (request.method !== "GET" && request.method !== "HEAD") {
            response.setHeader("Allow", "GET, HEAD");
            rejectBody(
              request,
              response,
              405,
              "Use GET or HEAD for documentation resources.",
              budgets.rejectionDrainMs,
            );
          } else {
            // Documentation never enters upload hooks or body collection, including GET/HEAD with a declared body.
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
          rejectBody(request, response, 404, "The requested API route does not exist.", budgets.rejectionDrainMs);
          return;
        }
        const allowed = pathname === "/healthz" ? "GET" : "POST";
        if (request.method !== allowed) {
          response.setHeader("Allow", allowed);
          rejectBody(
            request,
            response,
            405,
            "This method is not allowed for the requested API route.",
            budgets.rejectionDrainMs,
          );
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
      // Node truncates exposed headers at a count limit; retain every field within the strict byte cap.
      server.maxHeadersCount = 0;
      server.setTimeout(budgets.inactivityTimeoutMs, (socket) => socket.destroy());
      server.on("checkContinue", (request, response) => {
        continued.add(request);
        dispatch(request, response);
      });
      server.on("checkExpectation", (request, response) => {
        const pathname = (request.url ?? "").split("?", 1)[0];
        if (pathname === "/docs" || pathname?.startsWith("/docs/")) {
          dispatch(request, response);
          return;
        }
        rejectBody(request, response, 417, "The request expectation is not supported.", budgets.rejectionDrainMs);
      });
      server.on("connection", (socket) => {
        sockets.add(socket);
        socket.once("close", () => sockets.delete(socket));
      });
      return server;
    },
  });

  /** Incomplete requests need the existing readable bounded drain, with Fastify explicitly yielding the response. */
  const reject = (request: FastifyRequest, reply: FastifyReply, status: number, message: string): void => {
    uploads.get(request.raw)?.release();
    reply.hijack();
    rejectBody(request.raw, reply.raw, status, message, budgets.rejectionDrainMs);
  };
  // Header validation and admission run before the custom parser can allocate or consume upload bytes.
  app.addHook("onRequest", (request, reply, done) => {
    if (request.raw.method === "GET") {
      if (request.headers["transfer-encoding"] || Number(request.headers["content-length"] ?? 0) > 0) {
        reply.header("Connection", "close");
      }
      request.raw.on("error", () => {});
      done();
      return;
    }
    const mediaType = request.headers["content-type"]?.split(";", 1)[0]?.trim().toLowerCase();
    if (mediaType !== "audio/mpeg" && mediaType !== "application/octet-stream") {
      reject(request, reply, 415, "Upload raw MP3 bytes with audio/mpeg or application/octet-stream content type.");
      return;
    }
    const encoding = request.headers["content-encoding"]?.trim().toLowerCase();
    if (encoding !== undefined && encoding !== "identity") {
      reject(request, reply, 415, "Encoded request bodies are not supported.");
      return;
    }
    const lengthHeader = request.headers["content-length"];
    const declaredLength = lengthHeader === undefined ? undefined : Number(lengthHeader);
    if (declaredLength !== undefined && declaredLength > MAX_UPLOAD_BYTES) {
      reject(request, reply, 413, "The upload exceeds the 20 MiB limit.");
      return;
    }
    if (stopping || activeUploads >= budgets.maxActiveUploads) {
      reply.raw.setHeader("Retry-After", "1");
      reject(request, reply, 503, "The service is busy. Please try again shortly.");
      return;
    }
    activeUploads += 1;
    uploads.set(
      request.raw,
      createUploadState(request, reply, budgets, declaredLength, continued.has(request.raw), () => {
        activeUploads -= 1;
      }),
    );
    done();
  });

  app.removeAllContentTypeParsers();
  app.addContentTypeParser("*", (request, payload, done) => {
    const state = uploads.get(request.raw);
    if (!state) {
      done(new UploadError(500, "The MP3 could not be analyzed. Please try again."));
      return;
    }
    state.read(payload, done);
  });
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof UploadError) reject(request, reply, error.status, error.message);
    else if (error instanceof Mp3ParseError) {
      reject(request, reply, error.kind === "malformed" ? 400 : 415, error.message);
    } else reject(request, reply, 500, "The MP3 could not be analyzed. Please try again.");
  });
  app.setNotFoundHandler((request, reply) => {
    reject(request, reply, 404, "The requested API route does not exist.");
  });
  app.addHook("onResponse", (request, _reply, done) => {
    uploads.get(request.raw)?.release();
    done();
  });
  app.get("/healthz", (_request, reply) => {
    return reply
      .header("Content-Type", "application/json; charset=utf-8")
      .header("Cache-Control", "no-store")
      .header("X-Content-Type-Options", "nosniff")
      .send({ status: "ok" });
  });
  app.post<{ Body: Buffer | undefined }>("/file-upload", (request, reply) => {
    try {
      if (!request.body || request.body.length === 0) throw new UploadError(400, "Choose a nonempty MP3 file.");
      const frameCount = countMp3Frames(request.body);
      return reply
        .header("Content-Type", "application/json; charset=utf-8")
        .header("Cache-Control", "no-store")
        .header("X-Content-Type-Options", "nosniff")
        .send({ frameCount });
    } finally {
      uploads.get(request.raw)?.release();
    }
  });

  return {
    server: app.server,
    /** Load the finite docs set before binding, propagating failures and refusing startup once shutdown begins. */
    listen(port, host): Promise<void> {
      if (stopping) return Promise.reject(new Error("The API has begun shutdown and cannot start listening."));
      if (startupPromise) return Promise.reject(new Error("API startup has already been requested."));
      startupPromise = (async () => {
        await app.ready();
        docs = await loadDocs();
        if (stopping) throw new Error("The API shut down before readiness completed.");
        await app.listen({ port, host });
      })();
      return startupPromise;
    },
    /** Stop admission synchronously, preserve admitted work and force-close stragglers within the socket budget. */
    shutdown(): Promise<void> {
      if (shutdownPromise) return shutdownPromise;
      stopping = true;
      shutdownPromise = (async () => {
        const deadline = setTimeout(() => {
          for (const socket of sockets) socket.destroy();
        }, budgets.shutdownTimeoutMs);
        deadline.unref();
        try {
          // Finish or reject pending readiness before closing; it cannot open a late listener after shutdown resolves.
          await startupPromise?.catch(() => {});
          await app.close();
        } finally {
          clearTimeout(deadline);
        }
      })();
      return shutdownPromise;
    },
  };
}
