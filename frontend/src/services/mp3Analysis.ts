/** Submit one raw file to the existing API and narrow its JSON; no React state, persistence or lifecycle ownership. */
import ky from "ky";
import type { AnalysisFailure, AnalysisOutcome } from "../types/analysis.ts";
import { hasResponseCode, parseApiError, parseDetailedAnalysis, responseError } from "./response.ts";

/** Optional controlled origin allows native Node tests to exercise real Fetch without changing the upload contract. */
interface AnalysisRequestOptions {
  /** Resolve the fixed upload path against an explicit local origin; browsers normally use the current origin. */
  readonly baseUrl?: URL;
}

/** Preserve caller-owned abort reasons across headers and body reads; native transport details never reach the UI. */
function transportFailure(signal: AbortSignal, invalidResponse = false): AnalysisFailure {
  if (signal.aborted) {
    const timeout = signal.reason instanceof DOMException && signal.reason.name === "TimeoutError";
    return {
      kind: "error",
      reason: timeout ? "timeout" : "cancelled",
      message: timeout ? "The analysis timed out. Please try again." : "The analysis was cancelled.",
    };
  }
  return invalidResponse
    ? { kind: "error", reason: "invalid-response", message: "Unable to read the service response. Please try again." }
    : {
        kind: "error",
        reason: "network",
        message: "Unable to reach the service. Check your connection and try again.",
      };
}

/**
 * Upload the original File once and consume its response once; no replay, persistence or browser MP3 parsing occurs.
 * The hook owns the total deadline, including body consumption. Ky's retries and separate timeout are disabled.
 * Return validated detailed data or a safe typed failure; baseUrl is only needed by controlled local Node tests.
 */
export async function analyzeMp3(
  file: File,
  signal: AbortSignal,
  options: AnalysisRequestOptions = {},
): Promise<AnalysisOutcome> {
  let response: Response;
  try {
    response = await ky.post("/file-upload?details=true", {
      baseUrl: options.baseUrl,
      headers: { "Content-Type": "audio/mpeg" },
      body: file,
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal,
      retry: { limit: 0 },
      timeout: false,
      totalTimeout: false,
      keepalive: false,
      throwHttpErrors: false,
    });
  } catch {
    return transportFailure(signal);
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    return transportFailure(signal, error instanceof SyntaxError);
  }
  if (signal.aborted) return transportFailure(signal);
  if (!response.ok) {
    const error = parseApiError(payload, response.status);
    if (error) return { kind: "error", reason: "server", code: error.code, message: `Error: ${error.error}` };
    if (hasResponseCode(payload)) return transportFailure(signal, true);
    const detail = responseError(payload);
    return {
      kind: "error",
      reason: detail ? "legacy-server" : "invalid-response",
      message: detail ? `Error: ${detail}` : "Unable to analyze this file. Please try again.",
    };
  }
  if (response.status !== 200) return transportFailure(signal, true);
  const result = parseDetailedAnalysis(payload);
  return result === undefined
    ? { kind: "error", reason: "invalid-response", message: "Unable to read a valid analysis. Please try again." }
    : { kind: "success", frameCount: result.frameCount, analysis: result.analysis };
}
