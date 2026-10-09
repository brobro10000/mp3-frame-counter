/**
 * Count complete physical MPEG-1 Layer III frames under acceptance contract r3. Call countMp3Frames with a complete
 * Buffer after transport size validation. The function is synchronous, never mutates its input, performs no I/O and
 * throws Mp3ParseError on malformed or unsupported bytes. It neither decodes audio nor validates payload/CRC content.
 */
import { Mp3ParseError } from "./errors.ts";

const BITRATES_KBPS = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320] as const;
const SAMPLE_RATES_HZ = [44_100, 48_000, 32_000] as const;

/** Compare literal bytes without decoding or scanning ahead into a frame's opaque payload. */
function hasMarker(bytes: Buffer, offset: number, marker: string): boolean {
  if (bytes.length - offset < marker.length) return false;
  for (let index = 0; index < marker.length; index += 1) {
    if (bytes[offset + index] !== marker.charCodeAt(index)) return false;
  }
  return true;
}

/** Validate and skip the single permitted leading ID3v2 tag; its metadata body is opaque. */
function firstFrameOffset(bytes: Buffer): number {
  if (!hasMarker(bytes, 0, "ID3")) return 0;
  if (bytes.length < 10) throw new Mp3ParseError("malformed", "The ID3 header is incomplete.");

  const version = bytes[3]!;
  const revision = bytes[4]!;
  const flags = bytes[5]!;
  if (version === 0xff || revision === 0xff) {
    throw new Mp3ParseError("malformed", "The ID3 version or revision is invalid.");
  }
  if ((version !== 3 && version !== 4) || revision !== 0) {
    throw new Mp3ParseError("unsupported", "Only ID3v2.3.0 and ID3v2.4.0 tags are supported.");
  }

  const reservedMask = version === 3 ? 0x1f : 0x0f;
  if ((flags & reservedMask) !== 0) {
    throw new Mp3ParseError("malformed", "The ID3 header contains reserved flag bits.");
  }
  let bodySize = 0;
  for (let index = 6; index < 10; index += 1) {
    const sizeByte = bytes[index]!;
    if ((sizeByte & 0x80) !== 0) {
      throw new Mp3ParseError("malformed", "The ID3 size is not synchsafe.");
    }
    bodySize = bodySize * 128 + sizeByte;
  }
  if (bodySize > bytes.length - 10) {
    throw new Mp3ParseError("malformed", "The ID3 tag extends beyond the supplied bytes.");
  }
  if (flags !== 0) {
    throw new Mp3ParseError("unsupported", "ID3 tag flags and footers are not supported.");
  }
  return 10 + bodySize;
}

/** Read a supported header at exactly this boundary and require all header-derived frame bytes. */
function frameLength(bytes: Buffer, offset: number): number {
  const remaining = bytes.length - offset;
  if (remaining < 4) throw new Mp3ParseError("malformed", "An MPEG frame header is incomplete.");
  const first = bytes[offset]!;
  const second = bytes[offset + 1]!;
  const third = bytes[offset + 2]!;
  const fourth = bytes[offset + 3]!;
  if (first !== 0xff || (second & 0xe0) !== 0xe0) {
    throw new Mp3ParseError("malformed", "Expected an MPEG frame at the next frame boundary.");
  }

  const version = (second >> 3) & 0x03;
  const layer = (second >> 1) & 0x03;
  const bitrateIndex = third >> 4;
  const sampleRateIndex = (third >> 2) & 0x03;
  const emphasis = fourth & 0x03;
  if (version === 1 || layer === 0 || bitrateIndex === 15 || sampleRateIndex === 3 || emphasis === 2) {
    throw new Mp3ParseError("malformed", "The MPEG header contains a reserved field value.");
  }
  if (version !== 3 || layer !== 1) {
    throw new Mp3ParseError("unsupported", "Only MPEG-1 Layer III audio is supported.");
  }
  if (bitrateIndex === 0) {
    throw new Mp3ParseError("unsupported", "Free-format MPEG audio is not supported.");
  }

  const bitrate = BITRATES_KBPS[bitrateIndex]! * 1_000;
  const sampleRate = SAMPLE_RATES_HZ[sampleRateIndex]!;
  const padding = (third >> 1) & 1;
  const length = Math.floor((144 * bitrate) / sampleRate) + padding;
  if (length > remaining) throw new Mp3ParseError("malformed", "An MPEG frame is incomplete.");
  return length;
}

export function countMp3Frames(bytes: Buffer): number {
  let offset = firstFrameOffset(bytes);
  let count = 0;
  while (offset < bytes.length) {
    // A trailing TAG is metadata only when it begins at the next walked boundary. Its marker inside a payload is data.
    if (hasMarker(bytes, offset, "TAG") && bytes.length - offset === 128) {
      offset = bytes.length;
      break;
    }
    if (
      hasMarker(bytes, offset, "ID3") ||
      hasMarker(bytes, offset, "3DI") ||
      hasMarker(bytes, offset, "TAG") ||
      hasMarker(bytes, offset, "APETAGEX")
    ) {
      throw new Mp3ParseError("unsupported", "Additional or unsupported metadata appears at a frame boundary.");
    }
    offset += frameLength(bytes, offset);
    count += 1;
  }
  if (count === 0) throw new Mp3ParseError("malformed", "The input contains no complete MPEG-1 Layer III frame.");
  return count;
}
