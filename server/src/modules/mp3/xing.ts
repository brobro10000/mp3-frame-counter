/**
 * SAMPLE Xing carrier: [44, 252), 208 bytes total, MPEG-1 stereo, no CRC.
 * All spans use [start, end). The left column is absolute FILE position;
 * the second column is relative to the first MPEG FRAME, not the tag.
 *
 * File span    Frame span   Bytes  Meaning / counting responsibility
 * [44, 48)     [0, 4)          4   MPEG header: decode length and format
 * [48, 80)     [4, 36)        32   Side info: zeros in this sample
 * [80, 84)     [36, 40)        4   Marker: "Xing" ("Info" also recognized)
 * [84, 88)     [40, 44)        4   Flags: 00 00 00 0f, big-endian
 * [88, 92)     [44, 48)        4   Declared frames: 00 00 17 c9 = 6,089
 * [92, 96)     [48, 52)        4   Declared stream bytes: 1,458,128
 * [96, 196)    [52, 152)     100   Seek table: 100 one-byte entries
 * [196, 200)   [152, 156)      4   Stored quality: 0 in this sample
 * [200, 252)   [156, 208)     52   Remaining carrier bytes; opaque here
 *
 * The complete span [44, 252) contributes ONE physical frame and ZERO
 * audio frames after verified Xing/Info recognition. Fields above are
 * not separate frames. A zero-valued quality/side-info byte is not by
 * itself a reason to exclude anything; recognition is structural.
 *
 * Marker is frameStart + 36 = 80 for THIS unprotected stereo layout.
 * Do not assume this offset for mono or unverified CRC/encoder layouts.
 *
 * Xing field cursor starts immediately after its marker and flags.
 * Only fields selected by flags consume bytes, in this order:
 *   0x01 -> 4-byte declared frame count  [diagnostic; never the result]
 *   0x02 -> 4-byte declared stream size [diagnostic; not allocation size]
 *   0x04 -> 100-byte seek table          [bounded metadata; not audio]
 *   0x08 -> 4-byte stored quality        [not an invented percentage]
 * Bounds-check EACH read against the end of this frame, not only EOF.
 * The size/count fields are big-endian unsigned integers, not synchsafe.
 * Missing flags compact the layout; do not reuse these sample offsets.
 *
 * Declared stream bytes here include this carrier, exclude leading ID3:
 * 1,458,128 + 44 = 1,458,172 total file bytes.
 * The optional declaration of 6,089 is compared with our computed count;
 * it never controls loop termination or substitutes for counting.
 */
/** @see docs/validation/sample-baseline.md; https://ffmpeg.org/doxygen/7.1/mp3dec_8c_source.html */
import type { AnalysisWarning, XingInspection } from "../../contracts/mp3.ts";
import { Mp3DomainError } from "./errors.ts";
import { hasMarker } from "./mpeg.ts";
import type { MpegHeader } from "./types.ts";

/** Recognize only the complete leading MPEG-1 carrier; all optional reads are bounded by this frame, never EOF. */
export function inspectXing(
  bytes: Buffer,
  frameOffsetBytes: number,
  header: MpegHeader,
): {
  readonly xing: XingInspection;
  readonly warnings: AnalysisWarning[];
} {
  const end = frameOffsetBytes + header.frameLengthBytes;
  // Verified MPEG-1 Xing placement is header + 32 stereo / 17 mono side-info bytes for either protection bit.
  // FFmpeg n7.1 mp3dec.c uses this convention. A CRC-shifted alternate is deliberately unsupported, not guessed.
  const markerOffsetBytes = frameOffsetBytes + (header.mono ? 21 : 36);
  const markerAt = (offset: number): "Xing" | "Info" | undefined => {
    if (offset + 4 > end) return undefined;
    if (hasMarker(bytes, offset, "Xing")) return "Xing";
    if (hasMarker(bytes, offset, "Info")) return "Info";
    return undefined;
  };
  const marker = markerAt(markerOffsetBytes);
  if (marker === undefined) {
    if (header.hasCrc && markerAt(markerOffsetBytes + 2))
      throw new Mp3DomainError("unsupported-metadata", markerOffsetBytes);
    return { xing: { status: "absent" }, warnings: [] };
  }
  if (markerOffsetBytes + 8 > end) throw new Mp3DomainError("invalid-metadata", markerOffsetBytes);
  const flags = bytes.readUInt32BE(markerOffsetBytes + 4);
  if (flags > 15) throw new Mp3DomainError("unsupported-metadata", markerOffsetBytes + 4);
  const xing: Extract<XingInspection, { status: "present" }> = {
    status: "present",
    marker,
    frameOffsetBytes,
    frameLengthBytes: header.frameLengthBytes,
    markerOffsetBytes,
    flags,
  };
  const warnings: AnalysisWarning[] = [];
  let cursor = markerOffsetBytes + 8;
  /** Read a selected bounded field; first damage omits this and all later selected fields, preserving exclusion. */
  const read = (
    flag: number,
    length: number,
    field: "declaredAudioFrameCount" | "declaredMpegStreamByteCount" | "seekTable" | "qualityValue",
  ): number | undefined => {
    if ((flags & flag) === 0 || warnings.length !== 0) return undefined;
    if (cursor + length > end) {
      warnings.push({ code: "XING_OPTIONAL_FIELD_TRUNCATED", field });
      return undefined;
    }
    const value = length === 100 ? 100 : bytes.readUInt32BE(cursor);
    cursor += length;
    return value;
  };
  const frames = read(1, 4, "declaredAudioFrameCount");
  if (frames !== undefined) xing.declaredAudioFrameCount = frames;
  const size = read(2, 4, "declaredMpegStreamByteCount");
  if (size !== undefined) xing.declaredMpegStreamByteCount = size;
  const seek = read(4, 100, "seekTable");
  if (seek !== undefined) xing.seekTableEntryCount = 100;
  const quality = read(8, 4, "qualityValue");
  if (quality !== undefined) xing.qualityValue = quality;
  return { xing, warnings };
}
