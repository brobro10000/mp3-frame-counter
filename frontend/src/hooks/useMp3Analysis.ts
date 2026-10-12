/** Own file selection, upload admission and request lifetime without coupling API data to presentation. */
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { MAX_UPLOAD_BYTES } from "../../../server/src/contracts/mp3.ts";
import { analyzeMp3 } from "../services/mp3Analysis.ts";
import type { AnalysisState } from "../types/analysis.ts";

const REQUEST_TIMEOUT_MS = 45_000;

/** One admitted request owns its deadline; its generation rejects stale asynchronous completions. */
interface ActiveRequest {
  readonly id: number;
  readonly controller: AbortController;
  readonly deadline: ReturnType<typeof setTimeout>;
}

/** Invalidate before aborting so selection changes and unmount cannot publish an older request's outcome. */
function cancelRequest(activeRequest: RefObject<ActiveRequest | undefined>, generation: RefObject<number>): void {
  const active = activeRequest.current;
  activeRequest.current = undefined;
  generation.current += 1;
  if (active) {
    clearTimeout(active.deadline);
    active.controller.abort();
  }
}

/**
 * Selection never uploads. An explicit analyze call admits one request synchronously, with advisory byte feedback.
 * Every terminal path clears its deadline; selection/unmount also abort and invalidate stale completions.
 * The server remains authoritative for received bytes and counts. No filename, upload or result enters storage.
 */
export function useMp3Analysis() {
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [state, setState] = useState<AnalysisState>({
    kind: "idle",
    message: "Choose a file, then select Analyze MP3.",
  });
  const activeRequest = useRef<ActiveRequest | undefined>(undefined);
  const generation = useRef(0);

  useEffect(() => () => cancelRequest(activeRequest, generation), [activeRequest, generation]);

  /** Reset the prior result and cancel any admitted request when the user selects another file. */
  function selectFile(file: File | undefined): void {
    cancelRequest(activeRequest, generation);
    setSelectedFile(file);
    setState({
      kind: "idle",
      message: file ? "Ready when you are. Select Analyze MP3 to begin." : "Choose a file to begin.",
    });
  }

  /** Send the selected File once; asynchronous outcomes affect state only while this generation remains active. */
  async function analyze(): Promise<void> {
    if (activeRequest.current) return;
    if (!selectedFile) {
      setState({ kind: "error", reason: "input", message: "Choose an MP3 file before starting an analysis." });
      return;
    }
    if (selectedFile.size > MAX_UPLOAD_BYTES) {
      setState({
        kind: "error",
        reason: "input",
        message: "This file is too large. Choose an MP3 of 20 MiB (20,971,520 bytes) or less.",
      });
      return;
    }

    const file = selectedFile;
    const controller = new AbortController();
    const id = ++generation.current;
    const deadline = setTimeout(
      () => controller.abort(new DOMException("The analysis deadline elapsed.", "TimeoutError")),
      REQUEST_TIMEOUT_MS,
    );
    activeRequest.current = { id, controller, deadline };
    setState({ kind: "pending" });
    const current = () => activeRequest.current?.id === id && generation.current === id;
    try {
      const outcome = await analyzeMp3(file, controller.signal);
      if (current()) setState(outcome);
    } catch {
      if (current())
        setState({
          kind: "error",
          reason: controller.signal.aborted ? "timeout" : "network",
          message: controller.signal.aborted
            ? "The analysis timed out. Please try again."
            : "Unable to reach the service. Check your connection and try again.",
        });
    } finally {
      clearTimeout(deadline);
      if (current()) activeRequest.current = undefined;
    }
  }

  return { state, pending: state.kind === "pending", hasSelectedFile: selectedFile !== undefined, selectFile, analyze };
}
