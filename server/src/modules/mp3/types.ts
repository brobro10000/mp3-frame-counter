/** Domain aggregates contain no input bytes, decoder, HTTP state or runtime schema dependency. */
import type { AnalysisWarning, XingInspection } from "../../contracts/mp3.ts";

/** One completed boundary walk and its bounded diagnostics; the HTTP layer projects or rejects the result. */
export interface Mp3Analysis {
  /** Independently walked frames, less one recognized leading carrier; zero is a domain-only metadata result. */
  readonly audioFrameCount: number;
  /** Every complete header-derived MPEG frame, including a recognized carrier. */
  readonly physicalFrameCount: number;
  /** A carrier is excluded once regardless of its number of metadata fields. */
  readonly excludedMetadataFrameCount: 0 | 1;
  /** Optional declarations never determine either computed count. */
  readonly xing: XingInspection;
  /** Bounded diagnostics about declarations; valid framing still completes. */
  readonly warnings: readonly AnalysisWarning[];
}

/** Decoded MPEG-1 Layer III header facts at one verified boundary; bitrate and sample-rate units are explicit. */
export interface MpegHeader {
  /** Complete header-derived frame length, including header, optional CRC, side information and payload. */
  readonly frameLengthBytes: number;
  readonly bitrateBitsPerSecond: number;
  readonly sampleRateHz: number;
  readonly paddingBit: number;
  /** Header protection bit only; CRC contents are not verified. */
  readonly hasCrc: boolean;
  readonly mono: boolean;
}
