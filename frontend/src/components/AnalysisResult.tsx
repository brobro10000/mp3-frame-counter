/** Present narrowed analysis state as literal text in the existing accessible live region. */
import type { AnalysisState } from "../types/analysis.ts";

/** Preserve the existing pending copy and singular/plural count without guessing from file metadata. */
function statusMessage(state: AnalysisState): string {
  if (state.kind === "pending") return "Analyzing your MP3…";
  if (state.kind === "success") return `${state.frameCount} ${state.frameCount === 1 ? "frame" : "frames"}`;
  return state.message;
}

export function AnalysisResult({ state }: { readonly state: AnalysisState }) {
  return (
    <section className="result" aria-labelledby="result-title">
      <h3 id="result-title">YOUR RESULT</h3>
      <p id="analysis-status" role="status" aria-live="polite" aria-atomic="true" data-state={state.kind}>
        {statusMessage(state)}
      </p>
    </section>
  );
}
