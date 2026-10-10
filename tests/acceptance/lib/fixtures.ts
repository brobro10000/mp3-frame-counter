/**
 * Build independently specified test bytes and load fixed reviewed expectations. This is a fixture constructor,
 * never a parser: literal header/size pairs and repetition counts define the answer. Imported by checks and E2E.
 * Reads this package's manifest/base64 inputs only; allocates buffers, writes nothing, and throws on unknown IDs.
 */
import { readFileSync } from "node:fs";

export interface Fixture {
  id: string;
  kind: "encoded-audio" | "structural" | "malformed" | "unsupported" | "boundary";
  bytes: number;
  sha256: string;
  status: number;
  frameCount?: number;
  recipe: string;
}

export const manifest = JSON.parse(readFileSync(new URL("../fixtures/manifest.json", import.meta.url), "utf8")) as {
  contractRevision: string;
  fixtures: Fixture[];
};
export const LIMIT = 20_971_520;

// Header fffb9400 is MPEG-1 Layer III, 128 kb/s, 48 kHz: exactly 384 bytes without padding.
function frame(header = "fffb9400", bytes = 384): Buffer {
  const result = Buffer.alloc(bytes);
  Buffer.from(header, "hex").copy(result);
  return result;
}

function repeated(count: number): Buffer {
  return Buffer.alloc(count * 384, frame());
}

function id3(version: number, flags = 0): Buffer {
  // An independently specified TIT2 record contains the Latin-1 string A, with zero frame flags.
  return Buffer.concat([
    Buffer.from([0x49, 0x44, 0x33, version, 0, flags, 0, 0, 0, 12]),
    Buffer.from("544954320000000200000041", "hex"),
  ]);
}

function id3v1(): Buffer {
  const tag = Buffer.alloc(128);
  tag.write("TAG");
  tag.write("Synthetic acceptance fixture", 3, "ascii");
  return tag;
}

export function fixtureBytes(id: string): Buffer {
  if (["tone-cbr", "tone-vbr", "tone-padded"].includes(id)) {
    return Buffer.from(readFileSync(new URL(`../fixtures/${id}.base64`, import.meta.url), "utf8"), "base64");
  }
  switch (id) {
    case "one-frame":
      return frame();
    case "three-frames":
      return repeated(3);
    case "variable-parameters":
      return Buffer.concat([
        frame(),
        frame("fffb9600", 385),
        frame("fffbe4c0", 960),
        frame("fffb1400", 96),
        frame("fffb9001", 417),
        frame("fffb9803", 576),
        frame("fffa9400", 384),
      ]);
    case "payload-sync": {
      const result = repeated(2);
      Buffer.from("fffb9400", "hex").copy(result, 100);
      Buffer.from("fffb9400", "hex").copy(result, 500);
      return result;
    }
    case "id3v23":
      return Buffer.concat([id3(3), repeated(3)]);
    case "id3v24":
      return Buffer.concat([id3(4), repeated(3)]);
    case "id3-large-padding": {
      const tag = id3(4);
      tag[8] = 2;
      tag[9] = 56; // 2 * 128 + 56 = 312 bytes: title record plus 300 zero padding bytes.
      return Buffer.concat([tag, Buffer.alloc(300), repeated(3)]);
    }
    case "id3v1":
      return Buffer.concat([repeated(3), id3v1()]);
    case "both-tags":
      return Buffer.concat([id3(4), repeated(3), id3v1()]);
    case "xing-physical": {
      const result = repeated(2);
      Buffer.from("Xing").copy(result, 36);
      result.writeUInt32BE(1, 40);
      result.writeUInt32BE(999, 44); // Deliberately untrusted metadata total; two complete frames still count as two.
      return result;
    }
    case "above-one-mib":
      return repeated(3_000);
    case "six-mib":
      return repeated(16_384);
    case "exact-limit":
      return Buffer.concat([repeated(54_613), id3v1()]);
    case "over-limit":
      return Buffer.concat([fixtureBytes("exact-limit"), Buffer.from([0])]);
    case "empty":
      return Buffer.alloc(0);
    case "garbage":
      return Buffer.from("This is not an MPEG audio stream.");
    case "truncated-frame":
      return repeated(3).subarray(0, 3 * 384 - 1);
    case "trailing-junk":
      return Buffer.concat([repeated(3), Buffer.from([0])]);
    case "corrupt-middle": {
      const result = repeated(3);
      result[384] = 0;
      return result;
    }
    case "truncated-header":
      return Buffer.from("fffb94", "hex");
    case "metadata-only":
      return id3(4);
    case "tag-out-of-bounds":
      return Buffer.from("49443304000000000100", "hex");
    case "tag-nonsynchsafe":
      return Buffer.concat([Buffer.from("49443304000080000000", "hex"), frame()]);
    case "tag-reserved-flag":
      return Buffer.concat([id3(4, 1), frame()]);
    case "tag-invalid-version": {
      const tag = id3(4);
      tag[3] = 255;
      return Buffer.concat([tag, frame()]);
    }
    case "tag-invalid-revision": {
      const tag = id3(4);
      tag[4] = 255;
      return Buffer.concat([tag, frame()]);
    }
    case "reserved-version":
      return frame("ffeb9400");
    case "reserved-layer":
      return frame("fff99400");
    case "reserved-bitrate":
      return frame("fffbf400");
    case "reserved-sample-rate":
      return frame("fffb9c00");
    case "reserved-emphasis":
      return frame("fffb9402");
    case "mpeg2":
      return frame("fff38400", 192);
    case "mpeg25":
      return frame("ffe38400", 384);
    case "layer2":
      return frame("fffd8400", 384);
    case "layer1":
      return frame("ffff4400", 128);
    case "free-format":
      return Buffer.concat([frame("fffb0400"), frame("fffb0400"), frame("fffb0400")]);
    case "id3v22":
      return Buffer.concat([Buffer.from("494433020000000000085454320000020041", "hex"), frame()]);
    case "id3-revision": {
      const tag = id3(4);
      tag[4] = 1;
      return Buffer.concat([tag, frame()]);
    }
    case "id3-unsynchronised":
      return Buffer.concat([id3(3, 0x80), frame()]);
    case "id3-footer":
      return Buffer.concat([id3(4, 0x10), Buffer.from("3344490400100000000c", "hex"), frame()]);
    case "multiple-id3":
      return Buffer.concat([id3(4), id3(4), frame()]);
    case "appended-id3":
      return Buffer.concat([frame(), id3(4)]);
    case "ape-tag":
      return Buffer.concat([frame(), Buffer.from("APETAGEX"), Buffer.alloc(24)]);
    default:
      throw new Error(`Unknown acceptance fixture: ${id}`);
  }
}

export function fixture(id: string): Fixture {
  const result = manifest.fixtures.find((entry) => entry.id === id);
  if (!result) throw new Error(`Missing acceptance fixture manifest entry: ${id}`);
  return result;
}
