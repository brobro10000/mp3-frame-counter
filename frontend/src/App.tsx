/** One upload screen with local state, raw submit-only requests and safely narrowed frame-count responses. */
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { parseFrameCount, responseError } from "./response.ts";

const MAX_UPLOAD_BYTES = 20_971_520;
const REQUEST_TIMEOUT_MS = 45_000;

/** Mutually exclusive states keep a pending request or a validated success separate from retryable errors. */
type AnalysisState =
  | { readonly kind: "idle"; readonly message: string }
  | { readonly kind: "pending" }
  | { readonly kind: "success"; readonly frameCount: number }
  | { readonly kind: "error"; readonly message: string };

/** One admitted request owns its abort deadline; its generation rejects stale asynchronous completions. */
interface ActiveRequest {
  readonly id: number;
  readonly controller: AbortController;
  readonly deadline: ReturnType<typeof setTimeout>;
}

/** Preserve the existing live-region copy and singular/plural result without guessing from file metadata. */
function statusMessage(state: AnalysisState): string {
  if (state.kind === "pending") return "Analyzing your MP3…";
  if (state.kind === "success") return `${state.frameCount} ${state.frameCount === 1 ? "frame" : "frames"}`;
  return state.message;
}

/**
 * Submit one selected File only on a form event. The server remains authoritative for received bytes and counts.
 * A synchronous request ref prevents duplicates; all terminal paths clear their deadline and restore the controls.
 * Selection changes and unmount abort the request and invalidate stale results. Nothing enters browser storage.
 */
export function App() {
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [state, setState] = useState<AnalysisState>({
    kind: "idle",
    message: "Choose a file, then select Analyze MP3.",
  });
  const input = useRef<HTMLInputElement>(null);
  const activeRequest = useRef<ActiveRequest | undefined>(undefined);
  const generation = useRef(0);
  const pending = state.kind === "pending";

  useEffect(
    () => () => {
      const active = activeRequest.current;
      activeRequest.current = undefined;
      generation.current += 1;
      if (active) {
        clearTimeout(active.deadline);
        active.controller.abort();
      }
    },
    [],
  );

  /** Reset the previous result when selection changes; file selection alone never uploads. */
  function selectFile(file: File | undefined): void {
    const active = activeRequest.current;
    activeRequest.current = undefined;
    generation.current += 1;
    if (active) {
      clearTimeout(active.deadline);
      active.controller.abort();
    }
    setSelectedFile(file);
    setState({
      kind: "idle",
      message: file ? "Ready when you are. Select Analyze MP3 to begin." : "Choose a file to begin.",
    });
  }

  /** Send the selected raw bytes once; response JSON stays unknown until it satisfies the existing API contract. */
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (activeRequest.current) return;
    if (!selectedFile) {
      setState({ kind: "error", message: "Choose an MP3 file before starting an analysis." });
      input.current?.focus();
      return;
    }
    if (selectedFile.size > MAX_UPLOAD_BYTES) {
      setState({
        kind: "error",
        message: "This file is too large. Choose an MP3 of 20 MiB (20,971,520 bytes) or less.",
      });
      return;
    }

    const file = selectedFile;
    const controller = new AbortController();
    const id = ++generation.current;
    const deadline = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    activeRequest.current = { id, controller, deadline };
    setState({ kind: "pending" });
    const current = () => activeRequest.current?.id === id && generation.current === id;
    try {
      const response = await fetch("/file-upload", {
        method: "POST",
        headers: { "Content-Type": "audio/mpeg" },
        body: file,
        cache: "no-store",
        credentials: "omit",
        redirect: "error",
        signal: controller.signal,
      });
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        if (current()) setState({ kind: "error", message: "Unable to read the service response. Please try again." });
        return;
      }
      if (!current()) return;
      if (!response.ok) {
        const detail = responseError(payload);
        setState({
          kind: "error",
          message: detail ? `Error: ${detail}` : "Unable to analyze this file. Please try again.",
        });
        return;
      }
      const frameCount = parseFrameCount(payload);
      setState(
        frameCount === undefined
          ? { kind: "error", message: "Unable to read a valid frame count. Please try again." }
          : { kind: "success", frameCount },
      );
    } catch {
      if (current())
        setState({
          kind: "error",
          message: controller.signal.aborted
            ? "The analysis timed out. Please try again."
            : "Unable to reach the service. Check your connection and try again.",
        });
    } finally {
      clearTimeout(deadline);
      if (current()) activeRequest.current = undefined;
    }
  }

  return (
    <div className="page">
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="MP3 frame counter home">
          <span className="mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
          Frame counter
          <span className="wordmark-dot" aria-hidden="true">
            .
          </span>
        </a>
        <span className="header-note">A closer look at your audio</span>
      </header>

      <main>
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">
            <span aria-hidden="true" /> MP3 ANALYSIS
          </p>
          <h1 id="page-title">
            Every frame,
            <br />
            <em>accounted for.</em>
          </h1>
          <p className="intro-copy">
            Choose an MP3 and find its exact physical frame count. One file, one clear result.
          </p>
          <div className="format-note">
            <span className="note-line" aria-hidden="true" />
            <p>
              For MPEG-1 Layer III audio.
              <br />
              Your upload is processed without being saved.
            </p>
          </div>
        </section>

        <section className="analysis-card" aria-labelledby="card-title">
          <div className="card-heading">
            <span className="step-number" aria-hidden="true">
              01 /
            </span>
            <h2 id="card-title">Start with your file</h2>
          </div>
          <form id="analysis-form" noValidate onSubmit={submit} aria-busy={pending ? true : undefined}>
            <label htmlFor="mp3-file">MP3 file</label>
            <input
              ref={input}
              id="mp3-file"
              name="mp3"
              type="file"
              accept="audio/mpeg,.mp3"
              aria-describedby="file-help"
              disabled={pending}
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
            <p className="field-help" id="file-help">
              Up to 20 MiB (20,971,520 bytes). MPEG-1 Layer III only.
            </p>
            <button id="analyze-button" type="submit" disabled={pending}>
              <span>Analyze MP3</span>
              <span className="button-symbol" aria-hidden="true">
                ↗
              </span>
            </button>
          </form>
          <section className="result" aria-labelledby="result-title">
            <h3 id="result-title">YOUR RESULT</h3>
            <p id="analysis-status" role="status" aria-live="polite" aria-atomic="true" data-state={state.kind}>
              {statusMessage(state)}
            </p>
          </section>
        </section>
      </main>

      <footer>
        <span>Small details. Exact counts.</span>
        <span>MP3 frame counter</span>
      </footer>
    </div>
  );
}
