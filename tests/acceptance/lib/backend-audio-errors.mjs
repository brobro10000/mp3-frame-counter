/** Independent closed public catalogue expectations; no application imports, I/O or input mutation. */
import assert from "node:assert/strict";

export const errorCatalogue = {
  UPLOAD_EMPTY: [400, "Choose a nonempty MP3 file."],
  UPLOAD_INCOMPLETE: [400, "The upload did not complete. Please try again."],
  REQUEST_INVALID: [400, "The request does not match the upload API contract."],
  MP3_INVALID_HEADER: [400, "The MP3 contains an invalid frame header."],
  MP3_TRUNCATED_FRAME: [400, "The MP3 ends before a complete frame."],
  MP3_INVALID_METADATA: [400, "The MP3 contains malformed metadata."],
  MP3_NO_AUDIO_FRAMES: [400, "The file contains no complete MPEG-1 Layer III audio frames."],
  ROUTE_NOT_FOUND: [404, "The requested API resource does not exist."],
  METHOD_NOT_ALLOWED: [405, "This method is not allowed for the requested resource."],
  UPLOAD_TIMEOUT: [408, "The upload did not finish within the time limit."],
  UPLOAD_IDLE_TIMEOUT: [408, "The upload stopped sending data."],
  UPLOAD_TOO_LARGE: [413, "The upload exceeds the 20 MiB (20,971,520-byte) limit."],
  UNSUPPORTED_MEDIA_TYPE: [415, "Upload raw MP3 bytes using audio/mpeg or application/octet-stream."],
  UNSUPPORTED_CONTENT_ENCODING: [415, "Encoded request bodies are not supported."],
  MP3_UNSUPPORTED_FORMAT: [415, "Only supported MPEG-1 Layer III encoding is accepted."],
  MP3_UNSUPPORTED_METADATA: [415, "This MP3 metadata layout is not supported."],
  EXPECTATION_FAILED: [417, "The request expectation is not supported."],
  INTERNAL_ERROR: [500, "The MP3 could not be analyzed. Please try again."],
  SERVICE_BUSY: [503, "The service is busy. Please try again shortly."],
  UPSTREAM_UNAVAILABLE: [502, "Analysis service is unavailable. Please try again."],
  UPSTREAM_TIMEOUT: [504, "Analysis service timed out. Please try again."],
};

/** Check parsed error shape, independent code/status/message parity and safe bounded text; throws on mismatch. */
export function assertCodedError(value, status, expectedCode, contextual = false) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), "ERROR_SHAPE");
  assert.deepEqual(Object.keys(value).sort(), ["code", "error"], "ERROR_SHAPE");
  assert.ok(Object.hasOwn(errorCatalogue, value.code), "ERROR_CODE");
  if (expectedCode !== undefined) assert.equal(value.code, expectedCode, "ERROR_CODE");
  assert.equal(errorCatalogue[value.code][0], status, "ERROR_STATUS_CODE");
  const variants = {
    ROUTE_NOT_FOUND: ["Documentation resource not found", "The requested documentation resource does not exist."],
    METHOD_NOT_ALLOWED: [
      "Documentation method not allowed",
      "This method is not allowed for the requested documentation resource.",
    ],
    UPSTREAM_UNAVAILABLE: ["Documentation service is unavailable. Please try again."],
    UPSTREAM_TIMEOUT: ["Documentation service timed out. Please try again."],
  };
  const messages = [errorCatalogue[value.code][1], ...(contextual ? (variants[value.code] ?? []) : [])];
  assert.ok(messages.includes(value.error), "ERROR_MESSAGE");
}

/** Return the independent default DTO for an exact known code; used only by owned harness controls. */
export function errorDto(code) {
  assert.ok(Object.hasOwn(errorCatalogue, code));
  return { code, error: errorCatalogue[code][1] };
}
