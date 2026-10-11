/** Browser outcomes use trusted wire types without importing any server transport or parser implementation. */
import type { PublicErrorCode } from "../../../server/src/contracts/errors.ts";
import type { DetailedFrameCountResponse } from "../../../server/src/contracts/mp3.ts";

/** Local failures describe browser/input behavior; they are never invented API error codes. */
export type ClientFailureReason = "input" | "network" | "timeout" | "cancelled" | "invalid-response" | "legacy-server";

/** Validated server errors carry their catalogue code; local and legacy failures carry a separate reason. */
export type AnalysisFailure =
  | { readonly kind: "error"; readonly reason: ClientFailureReason; readonly message: string }
  | { readonly kind: "error"; readonly reason: "server"; readonly code: PublicErrorCode; readonly message: string };

/** Mutually exclusive states keep validated server measurements separate from pending work and retryable errors. */
export type AnalysisState =
  | { readonly kind: "idle"; readonly message: string }
  | { readonly kind: "pending" }
  | {
      readonly kind: "success";
      /** Positive audio-frame count measured by the server, never calculated from browser metadata. */
      readonly frameCount: number;
      /** Validated physical/carrier diagnostics supplied by the same upload response. */
      readonly analysis: DetailedFrameCountResponse["analysis"];
    }
  | AnalysisFailure;

/** The request service returns a terminal outcome; selection and request lifecycle belong to the hook. */
export type AnalysisOutcome = Extract<AnalysisState, { readonly kind: "success" | "error" }>;
