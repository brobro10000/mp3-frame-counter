/**
 * Logical counting model: traverse physical MPEG frames, then classify them.
 *
 * Generic supported layout (not to scale):
 *
 * +----------------+-------------------+-------------------+-----------+
 * | Optional ID3v2 | Optional leading  | MPEG audio frames | Optional  |
 * | outer tag      | Xing/Info carrier | 1, 2, ... N       | ID3v1 tag |
 * +----------------+-------------------+-------------------+-----------+
 * | Count: neither | Physical: +1      | Physical: +N      | Neither   |
 * |                | Audio:    +0      | Audio:    +N      |           |
 * +----------------+-------------------+-------------------+-----------+
 *
 * VERIFIED SAMPLE ONLY: zero-based file bytes; [start, end) excludes end.
 * The private sample identity is recorded in docs/validation/sample-baseline.md.
 *
 * +-------------+--------------------+-----------------------------+
 * | [0, 44)     | [44, 252)          | [252, 1458172)              |
 * | ID3v2.4 tag | Xing-bearing frame | 6,089 complete audio frames |
 * | 44 bytes    | 208 bytes          | 1,457,920 bytes             |
 * +-------------+--------------------+-----------------------------+
 * Skip the outer tag; walk/classify the carrier; walk every audio frame.
 *
 * Byte accounting: 44 + 208 + 1,457,920 = 1,458,172 bytes, exactly EOF.
 * Physical count:   1 + 6,089 = 6,090 complete MPEG frames.
 * Public count:     6,090 - 1 recognized carrier = 6,089 audio frames.
 *
 * Last sample frame: [1458068, 1458172), length 104 bytes. No trailing tag.
 *
 * Count invariant: physicalFrameCount = audioFrameCount + excludedCount.
 * Recognition determines excludedCount; Xing's declared total does not.
 * Invalid/truncated framing is an error, not partial successful counting.
 */
/** @see docs/validation/sample-baseline.md; https://ffmpeg.org/doxygen/7.1/mp3dec_8c_source.html */
import type { AnalysisWarning, XingInspection } from "../../contracts/mp3.ts";
import { Mp3DomainError } from "./errors.ts";
import { decodeMpegHeader, firstFrameOffset, hasMarker } from "./mpeg.ts";
import type { Mp3Analysis } from "./types.ts";
import { inspectXing } from "./xing.ts";
export type { Mp3Analysis } from "./types.ts";

/**
 * Walk actual complete MPEG-1 Layer III boundaries once, without decoding, mutating input, allocating a frame list or
 * performing I/O. Exclude only a recognized leading Xing/Info carrier. Declared totals are bounded diagnostics.
 * Empty/malformed/unsupported framing throws a typed domain error; a complete carrier-only input returns zero audio
 * frames for the route to reject. Running time is O(frames + leading-tag header), auxiliary storage is bounded.
 */
export function analyzeMp3(bytes: Buffer): Mp3Analysis {
  const start = firstFrameOffset(bytes);
  let offset = start;
  let streamEnd = bytes.length;
  let physicalFrameCount = 0;
  let excludedMetadataFrameCount: 0 | 1 = 0;
  let xing: XingInspection = { status: "absent" };
  const warnings: AnalysisWarning[] = [];
  /*
   * Count only complete frames reached by following each validated header's length:
   *
   * current boundary -> decode header -> require complete frame -> physical + 1
   *                            |                                      |
   *                            +-> first frame only: supported        +-> next boundary
   *                                Xing/Info? excluded = 1                = offset + length
   *
   * A rejected header or incomplete frame stops with an error; payload bytes are never scanned for extra frames.
   * A later marker is ordinary frame payload. Only the supported leading carrier can be excluded, exactly once.
   */
  while (offset < bytes.length) {
    if (hasMarker(bytes, offset, "TAG") && bytes.length - offset === 128) {
      streamEnd = offset;
      break;
    }
    if (
      hasMarker(bytes, offset, "ID3") ||
      hasMarker(bytes, offset, "3DI") ||
      hasMarker(bytes, offset, "TAG") ||
      hasMarker(bytes, offset, "APETAGEX")
    ) {
      throw new Mp3DomainError("unsupported-metadata", offset);
    }
    const header = decodeMpegHeader(bytes, offset);
    if (physicalFrameCount === 0) {
      const inspected = inspectXing(bytes, offset, header);
      xing = inspected.xing;
      warnings.push(...inspected.warnings);
      if (xing.status === "present") excludedMetadataFrameCount = 1;
    }
    physicalFrameCount += 1;
    offset += header.frameLengthBytes;
  }
  if (physicalFrameCount === 0) throw new Mp3DomainError("no-audio-frames", start);
  // Public audio count = walked physical frames - recognized leading metadata carrier.
  // Verified sample: 6,090 - 1 = 6,089. Xing's declared count is compared below; it never supplies this result.
  const audioFrameCount = physicalFrameCount - excludedMetadataFrameCount;
  if (xing.status === "present") {
    if (xing.declaredAudioFrameCount !== undefined && xing.declaredAudioFrameCount !== audioFrameCount) {
      warnings.push({ code: "XING_DECLARED_FRAME_COUNT_MISMATCH" });
    }
    if (xing.declaredMpegStreamByteCount !== undefined && xing.declaredMpegStreamByteCount !== streamEnd - start) {
      warnings.push({ code: "XING_DECLARED_STREAM_BYTES_MISMATCH" });
    }
  }
  return { audioFrameCount, physicalFrameCount, excludedMetadataFrameCount, xing, warnings };
}
