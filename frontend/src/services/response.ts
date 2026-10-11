/** Narrow untrusted API JSON before rendering a count or a text-only, retryable error. */
import { isApiError } from "../../../server/src/contracts/errors.ts";
import type { ApiError } from "../../../server/src/contracts/errors.ts";
import { isUploadSuccess } from "../../../server/src/contracts/mp3.ts";
import type { DetailedFrameCountResponse } from "../../../server/src/contracts/mp3.ts";

/** Accept only the existing success contract: one positive, safe integer named frameCount. */
export function parseFrameCount(value: unknown): number | undefined {
  return isUploadSuccess(value) && !("analysis" in value) ? value.frameCount : undefined;
}

/** Validate the requested detailed response with interpreted trusted schemas and measured-count invariants. */
export function parseDetailedAnalysis(value: unknown): DetailedFrameCountResponse | undefined {
  return isUploadSuccess(value) && "analysis" in value ? value : undefined;
}

/** Accept only a catalogue code, intentional safe message and its matching HTTP status; never trust raw JSON codes. */
export function parseApiError(value: unknown, status: number): ApiError | undefined {
  return isApiError(value, status) ? value : undefined;
}

/** A code-bearing body must pass the canonical guard rather than falling back to the older error-only contract. */
export function hasResponseCode(value: unknown): boolean {
  return typeof value === "object" && value !== null && Object.hasOwn(value, "code");
}

/** Read a service's useful error string; empty or malformed JSON keeps the screen's existing fallback message. */
export function responseError(value: unknown): string | undefined {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !Object.hasOwn(value, "error") ||
    !("error" in value)
  )
    return undefined;
  if (typeof value.error !== "string") return undefined;
  return value.error.trim() || undefined;
}
