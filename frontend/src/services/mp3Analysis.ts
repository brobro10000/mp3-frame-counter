/** Submit one raw file to the existing API and narrow its JSON; no React state, persistence or lifecycle ownership. */
import type { AnalysisOutcome } from "../types/analysis.ts";
import { parseFrameCount, responseError } from "./response.ts";

/** The hook supplies cancellation and catches transport failures; this service preserves response-specific errors. */
export async function analyzeMp3(file: File, signal: AbortSignal): Promise<AnalysisOutcome> {
  const response = await fetch("/file-upload", {
    method: "POST",
    headers: { "Content-Type": "audio/mpeg" },
    body: file,
    cache: "no-store",
    credentials: "omit",
    redirect: "error",
    signal,
  });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { kind: "error", message: "Unable to read the service response. Please try again." };
  }
  if (!response.ok) {
    const detail = responseError(payload);
    return {
      kind: "error",
      message: detail ? `Error: ${detail}` : "Unable to analyze this file. Please try again.",
    };
  }
  const frameCount = parseFrameCount(payload);
  return frameCount === undefined
    ? { kind: "error", message: "Unable to read a valid frame count. Please try again." }
    : { kind: "success", frameCount };
}
