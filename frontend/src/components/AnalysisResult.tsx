/** Present narrowed analysis state as literal text in the existing accessible live region. */
import type { AnalysisWarning, XingInspection } from "../../../server/src/contracts/mp3.ts";
import type { AnalysisState } from "../types/analysis.ts";

/** Preserve the existing pending copy and singular/plural count without guessing from file metadata. */
function statusMessage(state: AnalysisState): string {
  if (state.kind === "pending") return "Analyzing your MP3…";
  if (state.kind === "success") return `${state.frameCount} audio ${state.frameCount === 1 ? "frame" : "frames"}`;
  return state.message;
}

/** Explain bounded diagnostics using fixed copy; absent optional declarations are never displayed as zero. */
function warningMessage(warning: AnalysisWarning): string {
  switch (warning.code) {
    case "XING_DECLARED_FRAME_COUNT_MISMATCH":
      return "The declared audio frame total differs from the measured audio count.";
    case "XING_DECLARED_STREAM_BYTES_MISMATCH":
      return "The declared MPEG stream byte total differs from the measured MPEG region.";
    case "XING_OPTIONAL_FIELD_TRUNCATED": {
      const field = {
        declaredAudioFrameCount: "declared audio frame total",
        declaredMpegStreamByteCount: "declared MPEG stream byte total",
        seekTable: "seek table",
        qualityValue: "stored quality value",
      }[warning.field];
      return `The carrier's ${field} is incomplete; it and later selected fields are unavailable.`;
    }
  }
}

/** Show server-inspected carrier fields as text; offsets use absolute zero-based file bytes, with no local decoding. */
function XingDetails({ xing }: { readonly xing: XingInspection }) {
  if (xing.status === "absent") return <p>No leading Xing/Info carrier was detected.</p>;
  return (
    <dl className="metadata-list">
      <div>
        <dt>Carrier marker</dt>
        <dd>{xing.marker}</dd>
      </div>
      <div>
        <dt>Carrier frame offset</dt>
        <dd>{xing.frameOffsetBytes} bytes from file start</dd>
      </div>
      <div>
        <dt>Carrier frame size</dt>
        <dd>{xing.frameLengthBytes} bytes</dd>
      </div>
      <div>
        <dt>Marker offset</dt>
        <dd>{xing.markerOffsetBytes} bytes from file start</dd>
      </div>
      <div>
        <dt>Flags</dt>
        <dd>0x{xing.flags.toString(16).padStart(2, "0")}</dd>
      </div>
      <div>
        <dt>Declared audio frames</dt>
        <dd>{xing.declaredAudioFrameCount ?? "Not present"}</dd>
      </div>
      <div>
        <dt>Declared MPEG stream bytes</dt>
        <dd>
          {xing.declaredMpegStreamByteCount === undefined ? "Not present" : `${xing.declaredMpegStreamByteCount} bytes`}
        </dd>
      </div>
      <div>
        <dt>Seek table</dt>
        <dd>{xing.seekTableEntryCount === undefined ? "Not present" : `${xing.seekTableEntryCount} entries`}</dd>
      </div>
      <div>
        <dt>Stored quality value</dt>
        <dd>{xing.qualityValue ?? "Not present"}</dd>
      </div>
    </dl>
  );
}

/**
 * Announce only the brief state/count; the measured equation and bounded metadata remain outside the live region.
 */
export function AnalysisResult({ state }: { readonly state: AnalysisState }) {
  return (
    <section className="result" aria-labelledby="result-title">
      <h3 id="result-title">YOUR RESULT</h3>
      <p id="analysis-status" role="status" aria-live="polite" aria-atomic="true" data-state={state.kind}>
        {statusMessage(state)}
      </p>
      {state.kind === "success" ? (
        <div className="analysis-details">
          <p className="count-equation">
            {state.analysis.physicalFrameCount} physical {state.analysis.physicalFrameCount === 1 ? "frame" : "frames"}
            {" - "}
            {state.analysis.excludedMetadataFrameCount} excluded metadata{" "}
            {state.analysis.excludedMetadataFrameCount === 1 ? "frame" : "frames"}
            {" = "}
            {state.frameCount} audio {state.frameCount === 1 ? "frame" : "frames"}
          </p>
          <p>The server walked every complete frame. Declarations below are metadata, not measured totals.</p>
          <h4>Carrier metadata</h4>
          <XingDetails xing={state.analysis.xing} />
          {state.analysis.warnings.length ? (
            <ul className="analysis-warnings" aria-label="Metadata warnings">
              {state.analysis.warnings.map((warning) => (
                <li key={warning.code}>{warningMessage(warning)}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
