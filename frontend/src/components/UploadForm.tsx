/** Render the existing submit-only file form; validation and asynchronous state remain in the upload hook. */
import { useRef } from "react";
import type { FormEvent } from "react";

interface UploadFormProps {
  readonly pending: boolean;
  readonly hasSelectedFile: boolean;
  readonly onSelectFile: (file: File | undefined) => void;
  readonly onAnalyze: () => Promise<void>;
}

/** Native form semantics preserve keyboard submit, missing-file focus and disabled controls while pending. */
export function UploadForm({ pending, hasSelectedFile, onSelectFile, onAnalyze }: UploadFormProps) {
  const input = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!hasSelectedFile) input.current?.focus();
    void onAnalyze();
  }

  return (
    <>
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
          onChange={(event) => onSelectFile(event.target.files?.[0])}
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
    </>
  );
}
