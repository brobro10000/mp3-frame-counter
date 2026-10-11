/** Typed parser reasons without transport status or public-message policy. */
import { Mp3ParseError } from "../../errors.ts";

export type Mp3FailureReason =
  | "invalid-header"
  | "truncated-frame"
  | "invalid-metadata"
  | "unsupported-format"
  | "unsupported-metadata"
  | "no-audio-frames";

/** Non-mutating domain failure; offset is the absolute zero-based byte boundary, when known. */
export class Mp3DomainError extends Mp3ParseError {
  readonly reason: Mp3FailureReason;
  readonly offsetBytes: number | undefined;

  constructor(reason: Mp3FailureReason, offsetBytes?: number) {
    super(reason === "unsupported-format" || reason === "unsupported-metadata" ? "unsupported" : "malformed", reason);
    this.reason = reason;
    this.offsetBytes = offsetBytes;
  }
}
