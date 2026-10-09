/**
 * Native HTTP transport for the frozen MP3 upload contract. createApiServer returns an unbound server and an idempotent
 * bounded shutdown operation; callers choose the listen address. Requests stay in memory, never enter a file or log,
 * and reach the pure parser only after a complete bounded body. Typed parser failures become safe JSON responses.
 */
import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import type { Socket } from "node:net";
import { Mp3ParseError } from "./errors.ts";
import { countMp3Frames } from "./mp3.ts";

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
  shutdown(): Promise<void>;
}

/** PORT is the sole runtime setting; tests can separately bind the returned server to ephemeral port zero. */
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
  let shutdownPromise: Promise<void> | undefined;
  const sockets = new Set<Socket>();

  const handle = (request: IncomingMessage, response: ServerResponse, expectContinue = false): void => {
    // Own body timing below; socket timeouts remain enabled before headers and after responses.
    request.socket.setTimeout(0);
    const reject = (status: number, message: string) => {
      rejectBody(request, response, status, message, budgets.rejectionDrainMs);
    };
    const pathname = (request.url ?? "").split("?", 1)[0];
    if (pathname !== "/file-upload" && pathname !== "/healthz") {
      reject(404, "The requested API route does not exist.");
      return;
    }
    const allowed = pathname === "/healthz" ? "GET" : "POST";
    if (request.method !== allowed) {
      response.setHeader("Allow", allowed);
      reject(405, "This method is not allowed for the requested API route.");
      return;
    }
    if (pathname === "/healthz") {
      // A health request with a body is still bounded and its connection is not reused.
      if (request.headers["transfer-encoding"] || Number(request.headers["content-length"] ?? 0) > 0) {
        response.setHeader("Connection", "close");
      }
      request.on("error", () => {});
      json(request, response, 200, { status: "ok" });
      return;
    }
    const mediaType = request.headers["content-type"]?.split(";", 1)[0]?.trim().toLowerCase();
    if (mediaType !== "audio/mpeg" && mediaType !== "application/octet-stream") {
      reject(415, "Upload raw MP3 bytes with audio/mpeg or application/octet-stream content type.");
      return;
    }
    const encoding = request.headers["content-encoding"]?.trim().toLowerCase();
    if (encoding !== undefined && encoding !== "identity") {
      reject(415, "Encoded request bodies are not supported.");
      return;
    }

    const lengthHeader = request.headers["content-length"];
    const declaredLength = lengthHeader === undefined ? undefined : Number(lengthHeader);
    if (declaredLength !== undefined && declaredLength > MAX_UPLOAD_BYTES) {
      reject(413, "The upload exceeds the 20 MiB limit.");
      return;
    }
    if (stopping || activeUploads >= budgets.maxActiveUploads) {
      response.setHeader("Retry-After", "1");
      reject(503, "The service is busy. Please try again shortly.");
      return;
    }

    activeUploads += 1;
    let buffer: Buffer | undefined;
    let received = 0;
    let settled = false;
    let bodyDeadline: NodeJS.Timeout | undefined;
    let idleDeadline: NodeJS.Timeout | undefined;
    const release = (): boolean => {
      if (settled) return false;
      settled = true;
      activeUploads -= 1;
      buffer = undefined;
      clearTimeout(bodyDeadline);
      clearTimeout(idleDeadline);
      request.off("data", onData);
      request.off("end", onEnd);
      request.off("aborted", onAbort);
      response.off("close", onAbort);
      return true;
    };
    const fail = (status: number, message: string): void => {
      if (release()) reject(status, message);
    };
    const onAbort = (): void => {
      release();
    };
    const onData = (chunk: Buffer): void => {
      if (settled) return;
      if (chunk.length > MAX_UPLOAD_BYTES - received) {
        fail(413, "The upload exceeds the 20 MiB limit.");
        return;
      }
      if (!buffer || chunk.length > buffer.length - received) {
        fail(400, "The request body does not match its declared length.");
        return;
      }
      chunk.copy(buffer, received);
      received += chunk.length;
      idleDeadline?.refresh();
    };
    const onEnd = (): void => {
      if (settled) return;
      if (!request.complete) {
        fail(400, "The upload did not complete.");
        return;
      }
      if (received === 0) {
        fail(400, "Choose a nonempty MP3 file.");
        return;
      }
      try {
        // This is a view of only initialized received bytes, never an additional whole-upload copy.
        const frameCount = countMp3Frames(buffer!.subarray(0, received));
        release();
        json(request, response, 200, { frameCount });
      } catch (error) {
        if (error instanceof Mp3ParseError) {
          fail(error.kind === "malformed" ? 400 : 415, error.message);
        } else {
          fail(500, "The MP3 could not be analyzed. Please try again.");
        }
      }
    };

    request.once("aborted", onAbort);
    request.on("error", onAbort);
    response.once("close", onAbort);
    request.on("data", onData);
    request.once("end", onEnd);
    bodyDeadline = setTimeout(
      () => fail(408, "The upload did not finish within the time limit."),
      budgets.bodyTimeoutMs,
    );
    idleDeadline = setTimeout(() => fail(408, "The upload stopped sending data."), budgets.inactivityTimeoutMs);
    bodyDeadline.unref();
    idleDeadline.unref();
    try {
      // One bounded buffer avoids an unbounded count of tiny chunk objects. Unused capacity is never parsed or sent.
      buffer = Buffer.allocUnsafe(declaredLength ?? MAX_UPLOAD_BYTES);
      if (expectContinue) response.writeContinue();
    } catch {
      fail(500, "The MP3 could not be analyzed. Please try again.");
    }
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
    handle,
  );
  server.maxConnections = budgets.maxConnections;
  // Node truncates exposed headers at a count limit; retain every field within the strict byte cap for policy checks.
  server.maxHeadersCount = 0;
  server.setTimeout(budgets.inactivityTimeoutMs, (socket) => socket.destroy());
  server.on("checkContinue", (request, response) => handle(request, response, true));
  server.on("checkExpectation", (request, response) => {
    rejectBody(request, response, 417, "The request expectation is not supported.", budgets.rejectionDrainMs);
  });
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.once("close", () => sockets.delete(socket));
  });

  return {
    server,
    shutdown(): Promise<void> {
      if (shutdownPromise) return shutdownPromise;
      stopping = true;
      shutdownPromise = new Promise((resolve, reject) => {
        const deadline = setTimeout(() => {
          for (const socket of sockets) socket.destroy();
        }, budgets.shutdownTimeoutMs);
        deadline.unref();
        server.close((error) => {
          clearTimeout(deadline);
          if (error && (error as NodeJS.ErrnoException).code !== "ERR_SERVER_NOT_RUNNING") reject(error);
          else resolve();
        });
      });
      return shutdownPromise;
    },
  };
}
