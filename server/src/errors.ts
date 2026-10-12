/**
 * Transport-independent parser failures for the frozen MP3 framing contract. Consumers can distinguish malformed
 * supported bytes from an unsupported format without inspecting messages. Import this module; it performs no I/O.
 */
export type Mp3ParseErrorKind = "malformed" | "unsupported";

/** Legacy parser error boundary: classification is stable; messages remain internal until mapped to a public code. */
export class Mp3ParseError extends Error {
  readonly kind: Mp3ParseErrorKind;

  constructor(kind: Mp3ParseErrorKind, message: string) {
    super(message);
    this.name = "Mp3ParseError";
    this.kind = kind;
  }
}
