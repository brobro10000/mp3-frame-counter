/** Translate trusted domain/framework failures and write the same closed public error on normal and raw paths. */
import Fastify from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import { IncomingMessage } from "node:http";
import type { ServerResponse } from "node:http";
import { projectPublicError, publicErrorStatus } from "../contracts/errors.ts";
import type { ApiError, PublicErrorCode } from "../contracts/errors.ts";
import { Mp3DomainError } from "../modules/mp3/errors.ts";

/** An application-owned transport failure carries only a trusted catalogue key, never arbitrary HTTP metadata. */
export class UploadError extends Error {
  readonly publicCode: PublicErrorCode;

  constructor(code: PublicErrorCode) {
    super(code);
    this.name = "UploadError";
    this.publicCode = code;
  }
}

/** Schema validation uses this identity so unrelated thrown code/status objects cannot impersonate safe failures. */
export class RequestValidationError extends Error {
  constructor() {
    super("REQUEST_INVALID");
    this.name = "RequestValidationError";
  }
}

/** Map known instance identities to catalogue keys; every unknown exception remains a safe internal failure. */
export function classifyError(error: unknown): PublicErrorCode {
  if (error instanceof UploadError) return error.publicCode;
  if (error instanceof RequestValidationError) return "REQUEST_INVALID";
  if (error instanceof Mp3DomainError) {
    switch (error.reason) {
      case "invalid-header":
        return "MP3_INVALID_HEADER";
      case "truncated-frame":
        return "MP3_TRUNCATED_FRAME";
      case "invalid-metadata":
        return "MP3_INVALID_METADATA";
      case "unsupported-format":
        return "MP3_UNSUPPORTED_FORMAT";
      case "unsupported-metadata":
        return "MP3_UNSUPPORTED_METADATA";
      case "no-audio-frames":
        return "MP3_NO_AUDIO_FRAMES";
    }
  }
  if (error instanceof Fastify.errorCodes.FST_ERR_CTP_BODY_TOO_LARGE) return "UPLOAD_TOO_LARGE";
  if (error instanceof Fastify.errorCodes.FST_ERR_CTP_INVALID_CONTENT_LENGTH) return "UPLOAD_INCOMPLETE";
  if (error instanceof Fastify.errorCodes.FST_ERR_CTP_INVALID_MEDIA_TYPE) return "UNSUPPORTED_MEDIA_TYPE";
  return "INTERNAL_ERROR";
}

/** Set common API headers before normal serialization; CSP remains owned by the same-origin ingress. */
export function apiHeaders(reply: FastifyReply): FastifyReply {
  return reply
    .header("Content-Type", "application/json; charset=utf-8")
    .header("Cache-Control", "no-store")
    .header("X-Content-Type-Options", "nosniff");
}

/** Emit one closed DTO with an accurate length; HEAD retains metadata and omits bytes. Raw paths bypass serializers. */
function writeRawError(
  request: IncomingMessage,
  response: ServerResponse,
  status: number,
  body: ApiError,
  deferEnd = false,
): void {
  if (response.destroyed || response.writableEnded || response.headersSent) return;
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
 * Make native early errors readable before FIN while draining at most 64 KiB plus one delivered chunk.
 * The deadline bounds connection lifetime; discarded bytes are never retained and already closed peers get no reply.
 */
export function rejectRawBody(
  request: IncomingMessage,
  response: ServerResponse,
  code: PublicErrorCode,
  drainMs: number,
  context?: "documentation",
): void {
  if (response.destroyed || response.writableEnded || response.headersSent) return;
  const body = projectPublicError(code, context);
  const status = publicErrorStatus(code);
  const socket = request.socket;
  response.setHeader("Connection", "close");
  if (request.complete) {
    writeRawError(request, response, status, body);
    return;
  }
  let discarded = 0;
  const discard = (chunk: Buffer): void => {
    discarded += chunk.length;
    if (discarded >= 65_536) request.pause();
  };
  request.on("data", discard);
  request.on("error", () => {});
  const finish = (): void => {
    response.end();
  };
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
  writeRawError(request, response, status, body, true);
  request.resume();
}

/**
 * Project an error once. Native requests retain bounded raw rejection; injection has no native framing/socket drain.
 * Callers release upload state first. A complete normal request uses the registered error response serializer.
 */
export function sendPublicError(
  request: FastifyRequest,
  reply: FastifyReply,
  code: PublicErrorCode,
  drainMs: number,
): void {
  if (reply.raw.destroyed || reply.raw.writableEnded || reply.raw.headersSent || reply.sent) return;
  if (code === "SERVICE_BUSY") {
    reply.header("Retry-After", "1");
    // Hijacking skips Fastify's header flush, so the native early writer also needs the raw header.
    reply.raw.setHeader("Retry-After", "1");
  }
  if (request.raw instanceof IncomingMessage && !request.raw.complete) {
    reply.hijack();
    rejectRawBody(request.raw, reply.raw, code, drainMs);
    return;
  }
  const body = projectPublicError(code);
  if (request.raw.method === "HEAD") {
    // Injection uses Fastify directly; its not-found route does not apply native HEAD body suppression.
    apiHeaders(reply)
      .code(publicErrorStatus(code))
      .header("Content-Length", Buffer.byteLength(JSON.stringify(body)))
      .send();
    return;
  }
  // An explicitly selected error serializer avoids trying an error DTO against an active success serializer.
  apiHeaders(reply).code(publicErrorStatus(code)).send(body);
}
