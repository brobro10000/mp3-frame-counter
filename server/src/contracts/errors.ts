/** Browser-safe public failures. The catalogue owns codes, statuses, fixed safe messages and recovery guidance. */
import { Type } from "typebox";
import type { Static } from "typebox";
import { Check } from "typebox/value";

/** Fixed application/controlled-ingress failures; native protocol and disconnected sockets may have no JSON body. */
export const PUBLIC_ERRORS = {
  UPLOAD_EMPTY: {
    status: 400,
    message: "Choose a nonempty MP3 file.",
    action: "Select a nonempty MP3.",
    layer: "transport",
  },
  UPLOAD_INCOMPLETE: {
    status: 400,
    message: "The upload did not complete. Please try again.",
    action: "Retry the upload.",
    layer: "transport",
  },
  REQUEST_INVALID: {
    status: 400,
    message: "The request does not match the upload API contract.",
    action: "Check the raw upload request.",
    layer: "transport",
  },
  MP3_INVALID_HEADER: {
    status: 400,
    message: "The MP3 contains an invalid frame header.",
    action: "Choose a valid MP3.",
    layer: "parser",
  },
  MP3_TRUNCATED_FRAME: {
    status: 400,
    message: "The MP3 ends before a complete frame.",
    action: "Choose a complete MP3.",
    layer: "parser",
  },
  MP3_INVALID_METADATA: {
    status: 400,
    message: "The MP3 contains malformed metadata.",
    action: "Choose an MP3 with valid metadata.",
    layer: "parser",
  },
  MP3_NO_AUDIO_FRAMES: {
    status: 400,
    message: "The file contains no complete MPEG-1 Layer III audio frames.",
    action: "Choose an MP3 containing audio frames.",
    layer: "parser",
  },
  ROUTE_NOT_FOUND: {
    status: 404,
    message: "The requested API resource does not exist.",
    action: "Check the request path.",
    layer: "routing",
  },
  METHOD_NOT_ALLOWED: {
    status: 405,
    message: "This method is not allowed for the requested resource.",
    action: "Use the method listed in Allow.",
    allowHeader: true,
    layer: "routing",
  },
  UPLOAD_TIMEOUT: {
    status: 408,
    message: "The upload did not finish within the time limit.",
    action: "Retry on a stable connection.",
    layer: "transport",
  },
  UPLOAD_IDLE_TIMEOUT: {
    status: 408,
    message: "The upload stopped sending data.",
    action: "Retry on a stable connection.",
    layer: "transport",
  },
  UPLOAD_TOO_LARGE: {
    status: 413,
    message: "The upload exceeds the 20 MiB (20,971,520-byte) limit.",
    action: "Choose a file of 20 MiB or less.",
    layer: "transport/proxy",
  },
  UNSUPPORTED_MEDIA_TYPE: {
    status: 415,
    message: "Upload raw MP3 bytes using audio/mpeg or application/octet-stream.",
    action: "Send raw bytes with an accepted media type.",
    layer: "transport",
  },
  UNSUPPORTED_CONTENT_ENCODING: {
    status: 415,
    message: "Encoded request bodies are not supported.",
    action: "Send uncompressed raw bytes.",
    layer: "transport",
  },
  MP3_UNSUPPORTED_FORMAT: {
    status: 415,
    message: "Only supported MPEG-1 Layer III encoding is accepted.",
    action: "Choose supported MPEG-1 Layer III audio.",
    layer: "parser",
  },
  MP3_UNSUPPORTED_METADATA: {
    status: 415,
    message: "This MP3 metadata layout is not supported.",
    action: "Choose a supported metadata layout.",
    layer: "parser",
  },
  EXPECTATION_FAILED: {
    status: 417,
    message: "The request expectation is not supported.",
    action: "Omit Expect or use 100-continue.",
    layer: "transport",
  },
  INTERNAL_ERROR: {
    status: 500,
    message: "The MP3 could not be analyzed. Please try again.",
    action: "Retry; report a repeated failure.",
    layer: "application",
  },
  SERVICE_BUSY: {
    status: 503,
    message: "The service is busy. Please try again shortly.",
    action: "Retry after the advertised delay.",
    headers: { "Retry-After": "1" },
    layer: "transport",
  },
  UPSTREAM_UNAVAILABLE: {
    status: 502,
    message: "Analysis service is unavailable. Please try again.",
    documentationMessage: "API documentation is unavailable. Please try again.",
    action: "Retry when the API is available.",
    layer: "proxy",
  },
  UPSTREAM_TIMEOUT: {
    status: 504,
    message: "Analysis service timed out. Please try again.",
    documentationMessage: "API documentation timed out. Please try again.",
    action: "Retry when the API responds.",
    layer: "proxy",
  },
} as const;

/** Stable catalogue identity; private exceptions and client-only failures are never server codes. */
export type PublicErrorCode = keyof typeof PUBLIC_ERRORS;

/** Narrow only an own catalogue key, without trusting an arbitrary thrown object's code. */
export function isPublicErrorCode(value: unknown): value is PublicErrorCode {
  return typeof value === "string" && Object.hasOwn(PUBLIC_ERRORS, value);
}

const publicCodes = Object.keys(PUBLIC_ERRORS).filter(isPublicErrorCode);
/** Closed JSON failure body; code/status/message consistency is additionally checked at the client boundary. */
export const ApiErrorSchema = Type.Object(
  {
    code: Type.Enum(publicCodes, { description: "Stable public error classification." }),
    error: Type.String({
      minLength: 1,
      maxLength: 200,
      description: "Safe, actionable text; never private exception data.",
    }),
  },
  { $id: "ApiError", additionalProperties: false },
);
export type ApiError = Static<typeof ApiErrorSchema>;

/** Return the catalogue's HTTP status for a trusted key; performs no I/O or exception-message matching. */
export function publicErrorStatus(code: PublicErrorCode): number {
  return PUBLIC_ERRORS[code].status;
}

/** Project a trusted key to exactly two safe fields, with explicit documentation-context wording where defined. */
export function projectPublicError(code: PublicErrorCode, context?: "documentation"): ApiError {
  const entry = PUBLIC_ERRORS[code];
  const message =
    context === "documentation" && "documentationMessage" in entry ? entry.documentationMessage : entry.message;
  return { code, error: message };
}

/** Interpret untrusted JSON without generated code; reject unknown codes, status mismatches and invented messages. */
export function isApiError(value: unknown, status: number): value is ApiError {
  if (!Check(ApiErrorSchema, value) || !Object.hasOwn(value, "code") || !Object.hasOwn(value, "error")) return false;
  if (!isPublicErrorCode(value.code) || publicErrorStatus(value.code) !== status) return false;
  const entry = PUBLIC_ERRORS[value.code];
  return (
    value.error === entry.message || ("documentationMessage" in entry && value.error === entry.documentationMessage)
  );
}

/** All supported error statuses use the same closed schema; operation examples are derived from the catalogue. */
export const ERROR_RESPONSES = Object.fromEntries(publicCodes.map((code) => [publicErrorStatus(code), ApiErrorSchema]));
