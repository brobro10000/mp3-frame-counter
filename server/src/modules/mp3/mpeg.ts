/**
 * Supported leading ID3v2 tag: metadata outside the MPEG frame sequence.
 * Offsets here are relative to the beginning of the tag.
 *
 * Range      Bytes  Meaning                  Sample bytes / interpretation
 * [0, 3)       3   Identifier               49 44 33 = "ID3"
 * [3, 4)       1   Major version            04 = version 2.4
 * [4, 5)       1   Revision                 00
 * [5, 6)       1   Flags                    00 = supported flags-zero form
 * [6, 10)      4   Synchsafe body size       00 00 00 22 = 34 bytes
 * [10, 44)    34   Sample tag body           Metadata/padding; opaque here
 *
 * Size bytes contain seven data bits each, not eight:
 *
 *       byte 6     byte 7     byte 8     byte 9
 *     0aaaaaaa   0bbbbbbb   0ccccccc   0ddddddd
 *        |          |          |          |
 *      bits       bits       bits       bits
 *      27..21     20..14       13..7       6..0
 *
 * Validate every leading bit is zero BEFORE using the size bytes.
 * bodyBytes = b6 * (2 ** 21) + b7 * (2 ** 14) + b8 * (2 ** 7) + b9.
 * For flags zero: first MPEG byte = tagStart + 10 + bodyBytes.
 * Sample: 0 + 10 + 34 = byte 44. None of these bytes is an MPEG frame.
 *
 * ID3's internal metadata records may also be named "frames"; those are
 * NOT MPEG audio frames and are not included in this application's count.
 */

/**
 * MPEG header: four bytes at the CURRENT frame boundary (32 bits total).
 * Byte indexes below are relative to that frame. Bits run 7 -> 0.
 *
 * +----------+-------------+-------------+--------------+
 * | byte +0  | byte +1     | byte +2     | byte +3      |
 * +----------+-------------+-------------+--------------+
 * | 11111111 | 111 VV LL P | BBBB SS D U | CC XX K O EE |
 * +----------+-------------+-------------+--------------+
 *
 * 11111111 + 111 = 11-bit sync; it must occur at the walked boundary.
 * VV = version: 11 is MPEG-1.       LL = layer: 01 is Layer III.
 * P  = protection: 0 has CRC; 1 has no CRC. CRC is not validated here.
 * BBBB = bitrate table index.      SS = sample-rate table index.
 * D  = frame padding bit.          U  = private bit; not a count.
 * CC = channel mode: 11 mono, otherwise two channels.
 * XX = mode extension.             K = copyright. O = original.
 * EE = emphasis; preserve reserved-value validation.
 *
 * Sample FF FB 50 00:
 * 11111111 | 111 11 01 1 | 0101 00 0 0 | 00 00 0 0 00
 * MPEG-1, Layer III, no CRC, 64,000 bits/s, 44,100 Hz, no padding.
 *
 * Normal MPEG-1 Layer III frame (not to scale):
 * +---------+-------------+---------------------+------------------------+
 * | Header  | Optional    | Side information    | Main-data/ancillary    |
 * | 4 bytes | CRC 2 bytes | 17 mono / 32 stereo | remainder; opaque here |
 * +---------+-------------+---------------------+------------------------+
 * <------------- ONE complete header-derived physical frame ------------>
 *
 * Layer III main data can use a bit reservoir across frame boundaries.
 * This parser counts framing; it does not decode or assign each payload
 * byte to a standalone audio sample. No payload sync scanning is needed.
 *
 * L = floor(144 * bitrateBitsPerSecond / sampleRateHz) + paddingBit.
 * MPEG-1 Layer III has 1,152 samples/channel/frame; 1,152 / 8 = 144.
 * L already includes header, CRC when present, side info and remainder.
 * Do NOT add header or CRC bytes again. VBR requires recalculating L
 * from EACH frame's header, not dividing file size by the first frame.
 *
 * Sample first L = floor(144 * 64000 / 44100) + 0 = 208 bytes.
 * Frame span [44, 252); next frame starts at 44 + 208 = 252.
 */
/** @see docs/validation/sample-baseline.md; https://ffmpeg.org/doxygen/7.1/mp3dec_8c_source.html */
import { Mp3DomainError } from "./errors.ts";
import type { MpegHeader } from "./types.ts";

const BITRATES_KBPS = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320] as const;
const SAMPLE_RATES_HZ = [44_100, 48_000, 32_000] as const;

/** Compare a bounded literal at this exact byte position; never scan opaque frame payload for sync. */
export function hasMarker(bytes: Buffer, offset: number, marker: string): boolean {
  if (offset < 0 || bytes.length - offset < marker.length) return false;
  for (let index = 0; index < marker.length; index += 1) {
    if (bytes.readUInt8(offset + index) !== marker.charCodeAt(index)) return false;
  }
  return true;
}

/**
 * Return the first frame's absolute byte offset after one supported, flag-zero leading ID3v2.3/2.4 tag, or zero.
 * Reject malformed size/flags with Mp3DomainError without interpreting or allocating the opaque tag body.
 */
export function firstFrameOffset(bytes: Buffer): number {
  if (!hasMarker(bytes, 0, "ID3")) return 0;
  if (bytes.length < 10) throw new Mp3DomainError("invalid-metadata", 0);
  const version = bytes.readUInt8(3);
  const revision = bytes.readUInt8(4);
  const flags = bytes.readUInt8(5);
  if (version === 0xff || revision === 0xff) throw new Mp3DomainError("invalid-metadata", 0);
  if ((version !== 3 && version !== 4) || revision !== 0) throw new Mp3DomainError("unsupported-metadata", 0);
  const reservedMask = version === 3 ? 0x1f : 0x0f;
  if ((flags & reservedMask) !== 0) throw new Mp3DomainError("invalid-metadata", 0);
  let bodySize = 0;
  for (let index = 6; index < 10; index += 1) {
    const value = bytes.readUInt8(index);
    if ((value & 0x80) !== 0) throw new Mp3DomainError("invalid-metadata", 0);
    bodySize = bodySize * 128 + value;
  }
  if (bodySize > bytes.length - 10) throw new Mp3DomainError("invalid-metadata", 0);
  if (flags !== 0) throw new Mp3DomainError("unsupported-metadata", 0);
  return 10 + bodySize;
}

/**
 * Decode at an in-range, absolute byte offset reached by the boundary walk and require the complete frame.
 * Return header facts with explicit byte/bitrate/sample-rate units; invalid or unsupported input throws Mp3DomainError.
 */
export function decodeMpegHeader(bytes: Buffer, offset: number): MpegHeader {
  const remaining = bytes.length - offset;
  if (remaining < 4) {
    const reason = remaining > 0 && bytes.readUInt8(offset) !== 0xff ? "invalid-header" : "truncated-frame";
    throw new Mp3DomainError(reason, offset);
  }
  const first = bytes.readUInt8(offset);
  const second = bytes.readUInt8(offset + 1);
  const third = bytes.readUInt8(offset + 2);
  const fourth = bytes.readUInt8(offset + 3);
  if (first !== 0xff || (second & 0xe0) !== 0xe0) throw new Mp3DomainError("invalid-header", offset);
  const version = (second >> 3) & 3;
  const layer = (second >> 1) & 3;
  const bitrateIndex = third >> 4;
  const rateIndex = (third >> 2) & 3;
  if (version === 1 || layer === 0 || bitrateIndex === 15 || rateIndex === 3 || (fourth & 3) === 2) {
    throw new Mp3DomainError("invalid-header", offset);
  }
  if (version !== 3 || layer !== 1 || bitrateIndex === 0) throw new Mp3DomainError("unsupported-format", offset);
  const bitrateKbps = BITRATES_KBPS[bitrateIndex];
  const sampleRateHz = SAMPLE_RATES_HZ[rateIndex];
  if (bitrateKbps === undefined || sampleRateHz === undefined) throw new Mp3DomainError("invalid-header", offset);
  const bitrateBitsPerSecond = bitrateKbps * 1_000;
  const paddingBit = (third >> 1) & 1;
  // 1,152 samples/channel / 8 bits per byte gives 144. Length already includes header and optional CRC.
  const frameLengthBytes = Math.floor((144 * bitrateBitsPerSecond) / sampleRateHz) + paddingBit;
  if (frameLengthBytes > remaining) throw new Mp3DomainError("truncated-frame", offset);
  return {
    frameLengthBytes,
    bitrateBitsPerSecond,
    sampleRateHz,
    paddingBit,
    hasCrc: (second & 1) === 0,
    mono: fourth >> 6 === 3,
  };
}
