/** Narrow untrusted API JSON before rendering a count or a text-only, retryable error. */

/** Accept only the existing success contract: one positive, safe integer named frameCount. */
export function parseFrameCount(value: unknown): number | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const keys = Object.keys(value);
  if (keys.length !== 1 || keys[0] !== "frameCount" || !("frameCount" in value)) return undefined;
  const count = value.frameCount;
  return typeof count === "number" && Number.isSafeInteger(count) && count > 0 ? count : undefined;
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
