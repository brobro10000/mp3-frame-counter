/**
 * Verify the pure parser against the independently reviewed r3 fixture manifest and narrowly specified edge cases.
 * Run with `node --test server/tests/mp3.test.ts`. This reads portable fixture inputs, writes nothing, and fails on count,
 * classification or input-mutation disagreement. It does not require the ignored private sample or a running service.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, test } from "node:test";
import { Mp3ParseError } from "../src/errors.ts";
import { countMp3Frames } from "../src/mp3.ts";
import { fixtureBytes, manifest } from "../../tests/acceptance/lib/fixtures.ts";

describe("MP3 frame parser", () => {
  for (const entry of manifest.fixtures) {
    // HTTP owns the byte cap; the one-byte-over fixture has no parser-level 413 meaning.
    if (entry.status === 413) continue;
    test(`frozen fixture ${entry.id}`, () => {
      const bytes = fixtureBytes(entry.id);
      assert.equal(bytes.length, entry.bytes);
      assert.equal(createHash("sha256").update(bytes).digest("hex"), entry.sha256);
      if (entry.status === 200) {
        assert.equal(countMp3Frames(bytes), entry.frameCount);
      } else {
        assert.throws(() => countMp3Frames(bytes), {
          name: "Mp3ParseError",
          kind: entry.status === 400 ? "malformed" : "unsupported",
        });
      }
      assert.equal(createHash("sha256").update(bytes).digest("hex"), entry.sha256, "Parser must not mutate input");
    });
  }

  test("a TAG marker exactly 128 bytes before EOF inside a complete frame remains opaque payload", () => {
    const bytes = fixtureBytes("one-frame");
    bytes.write("TAG", bytes.length - 128, "ascii");
    assert.equal(countMp3Frames(bytes), 1);
  });

  test("ID3, footer, APE and TAG marker bytes inside payload do not create metadata boundaries", () => {
    const bytes = fixtureBytes("one-frame");
    bytes.write("ID3", 20, "ascii");
    bytes.write("3DI", 30, "ascii");
    bytes.write("APETAGEX", 40, "ascii");
    bytes.write("TAG", 50, "ascii");
    assert.equal(countMp3Frames(bytes), 1);
  });

  test("an empty supported ID3 header is permitted before a complete frame", () => {
    for (const version of [3, 4]) {
      const header = Buffer.from([0x49, 0x44, 0x33, version, 0, 0, 0, 0, 0, 0]);
      assert.equal(countMp3Frames(Buffer.concat([header, fixtureBytes("one-frame")])), 1);
    }
  });

  test("a trailing ID3v1 record cannot replace the required MPEG frame", () => {
    const tag = Buffer.alloc(128);
    tag.write("TAG");
    assert.throws(() => countMp3Frames(tag), { kind: "malformed" });
    const leading = Buffer.from("49443304000000000000", "hex");
    assert.throws(() => countMp3Frames(Buffer.concat([leading, tag])), { kind: "malformed" });
  });

  test("leading, multiple, short and nonterminal ID3v1 records are unsupported", () => {
    const tag = Buffer.alloc(128);
    tag.write("TAG");
    const frame = fixtureBytes("one-frame");
    for (const bytes of [
      Buffer.concat([tag, frame]),
      Buffer.concat([frame, tag, tag]),
      Buffer.concat([frame, Buffer.from("TAG")]),
      Buffer.concat([frame, tag, Buffer.from([0])]),
    ]) {
      assert.throws(() => countMp3Frames(bytes), { kind: "unsupported" });
    }
  });

  test("unexplained leading bytes never resynchronize to a later valid frame", () => {
    for (const prefix of [Buffer.from([0]), Buffer.from("not audio")]) {
      assert.throws(() => countMp3Frames(Buffer.concat([prefix, fixtureBytes("one-frame")])), { kind: "malformed" });
    }
  });

  test("ID3 headers shorter than ten bytes and every nonsynchsafe size position fail", () => {
    const header = Buffer.from("49443303000000000000", "hex");
    for (let length = 3; length < 10; length += 1) {
      assert.throws(() => countMp3Frames(header.subarray(0, length)), { kind: "malformed" });
    }
    for (let index = 6; index < 10; index += 1) {
      const invalid = Buffer.from(header);
      invalid[index] = 0x80;
      assert.throws(() => countMp3Frames(Buffer.concat([invalid, fixtureBytes("one-frame")])), { kind: "malformed" });
    }
  });

  test("v2.3 and v2.4 distinguish defined unsupported flags from reserved malformed flags", () => {
    for (const [version, defined, reserved] of [
      [3, [0x80, 0x40, 0x20], [0x10, 0x08, 0x04, 0x02, 0x01]],
      [4, [0x80, 0x40, 0x20, 0x10], [0x08, 0x04, 0x02, 0x01]],
    ] as const) {
      for (const [flags, kind] of [
        ...defined.map((value) => [value, "unsupported"] as const),
        ...reserved.map((value) => [value, "malformed"] as const),
      ]) {
        const header = Buffer.from([0x49, 0x44, 0x33, version, 0, flags, 0, 0, 0, 0]);
        assert.throws(() => countMp3Frames(Buffer.concat([header, fixtureBytes("one-frame")])), { kind });
      }
    }
  });

  test("an appended ID3 footer and an APE header are unsupported even without audio", () => {
    for (const marker of ["3DI", "APETAGEX"]) {
      assert.throws(() => countMp3Frames(Buffer.from(marker)), { kind: "unsupported" });
      assert.throws(() => countMp3Frames(Buffer.concat([fixtureBytes("one-frame"), Buffer.from(marker)])), {
        kind: "unsupported",
      });
    }
  });

  test("marker comparison does not treat high-bit bytes as ASCII metadata", () => {
    const bytes = Buffer.from("c9c4b304000000000000", "hex");
    assert.throws(() => countMp3Frames(Buffer.concat([bytes, fixtureBytes("one-frame")])), { kind: "malformed" });
  });

  test("typed parser failures carry a stable kind and useful non-reflective message", () => {
    assert.throws(
      () => countMp3Frames(Buffer.from("PRIVATE INPUT MARKER")),
      (error: unknown) => {
        assert.ok(error instanceof Mp3ParseError);
        assert.equal(error.kind, "malformed");
        assert.ok(error.message.length > 0);
        assert.ok(!error.message.includes("PRIVATE INPUT MARKER"));
        return true;
      },
    );
  });
});

// Owner-defined audio successor: these tests are product regression checks, not a substitute for independent acceptance.
import { analyzeMp3 } from "../src/modules/mp3/analyze.ts";
import { decodeMpegHeader, firstFrameOffset } from "../src/modules/mp3/mpeg.ts";
import { Mp3DomainError } from "../src/modules/mp3/errors.ts";
import { isUploadSuccess } from "../src/contracts/mp3.ts";
import { projectPublicError, isApiError, PUBLIC_ERRORS, isPublicErrorCode } from "../src/contracts/errors.ts";
import { readFileSync } from "node:fs";

/** Build a portable 208-byte 64kbps/44100Hz MPEG-1 frame; expected length is independently fixed in this test. */
function frame(mono = false, crc = false): Buffer {
  const bytes = Buffer.alloc(208);
  bytes.set([0xff, crc ? 0xfa : 0xfb, 0x50, mono ? 0xc0 : 0]);
  return bytes;
}

/** Place compact optional Xing declarations inside a complete frame; no product parser determines fixture offsets. */
function carrier(flags: number, mono = false, crc = false, marker = "Xing"): Buffer {
  const bytes = frame(mono, crc);
  const offset = mono ? 21 : 36;
  bytes.write(marker, offset, "ascii");
  bytes.writeUInt32BE(flags, offset + 4);
  let cursor = offset + 8;
  for (const [flag, length, value] of [
    [1, 4, 1],
    [2, 4, 416],
    [4, 100, 0],
    [8, 4, 0],
  ]) {
    if (flag === undefined || length === undefined || value === undefined || !(flags & flag)) continue;
    if (length === 4) bytes.writeUInt32BE(value, cursor);
    cursor += length;
  }
  return bytes;
}

describe("Audio counting and bounded Xing diagnostics", () => {
  test("all compact flags, both markers, channel modes and verified protection-bit layouts", async (context) => {
    for (const marker of ["Xing", "Info"])
      for (const mono of [false, true])
        for (const crc of [false, true])
          for (let flags = 0; flags <= 15; flags += 1)
            await context.test(`${marker} mono=${mono} crc=${crc} flags=${flags}`, () => {
              const bytes = Buffer.concat([carrier(flags, mono, crc, marker), frame()]);
              const before = createHash("sha256").update(bytes).digest("hex");
              const result = analyzeMp3(bytes);
              assert.equal(result.audioFrameCount, 1);
              assert.equal(result.physicalFrameCount, 2);
              assert.equal(result.excludedMetadataFrameCount, 1);
              assert.equal(result.xing.status, "present");
              assert.deepEqual(result.warnings, []);
              assert.equal(createHash("sha256").update(bytes).digest("hex"), before);
            });
  });

  test("declarations never supply count; complete-frame removal decrements and truncation fails", () => {
    const leading = carrier(3);
    const bytes = Buffer.concat([leading, frame(), frame()]);
    assert.equal(analyzeMp3(bytes).audioFrameCount, 2);
    bytes.writeUInt32BE(0xffff_ffff, 44);
    const altered = analyzeMp3(bytes);
    assert.equal(altered.audioFrameCount, 2);
    assert.deepEqual(altered.warnings, [
      { code: "XING_DECLARED_FRAME_COUNT_MISMATCH" },
      { code: "XING_DECLARED_STREAM_BYTES_MISMATCH" },
    ]);
    assert.equal(analyzeMp3(bytes.subarray(0, bytes.length - 208)).audioFrameCount, 1);
    assert.throws(() => analyzeMp3(bytes.subarray(0, bytes.length - 1)), { reason: "truncated-frame" });
    assert.equal(analyzeMp3(bytes.subarray(208)).audioFrameCount, 2);
  });

  test("wrong and nonleading markers, VBRI and outer ID3 text remain counted; shifted CRC layout fails", () => {
    const ordinary = frame();
    ordinary.write("Xing", 40);
    assert.equal(analyzeMp3(ordinary).audioFrameCount, 1);
    assert.equal(analyzeMp3(Buffer.concat([frame(), carrier(0)])).audioFrameCount, 2);
    const vbri = frame();
    vbri.write("VBRI", 36);
    assert.equal(analyzeMp3(vbri).audioFrameCount, 1);
    const shifted = frame(false, true);
    shifted.write("Xing", 38);
    assert.throws(() => analyzeMp3(shifted), { reason: "unsupported-metadata" });
    assert.throws(() => analyzeMp3(carrier(16)), { reason: "unsupported-metadata" });
    assert.equal(analyzeMp3(carrier(0)).audioFrameCount, 0);
  });

  test("bounded optional-field damage retains carrier exclusion and omits later declarations", () => {
    const short = Buffer.alloc(104);
    short.set([0xff, 0xfb, 0x10, 0]);
    short.write("Xing", 36);
    short.writeUInt32BE(15, 40);
    short.writeUInt32BE(1, 44);
    short.writeUInt32BE(312, 48);
    const result = analyzeMp3(Buffer.concat([short, frame()]));
    assert.equal(result.audioFrameCount, 1);
    assert.equal(result.xing.status, "present");
    if (result.xing.status !== "present") assert.fail("Carrier expected");
    assert.equal(result.xing.seekTableEntryCount, undefined);
    assert.equal(result.xing.qualityValue, undefined);
    assert.deepEqual(result.warnings, [{ code: "XING_OPTIONAL_FIELD_TRUNCATED", field: "seekTable" }]);
    assert(
      isUploadSuccess({
        frameCount: result.audioFrameCount,
        analysis: {
          physicalFrameCount: result.physicalFrameCount,
          excludedMetadataFrameCount: result.excludedMetadataFrameCount,
          xing: result.xing,
          warnings: result.warnings,
        },
      }),
    );
  });

  test("documented byte map arithmetic and outer-tag stream bounds", () => {
    const id3 = Buffer.from("49443304000000000022", "hex");
    const bytes = Buffer.concat([id3, Buffer.alloc(34), carrier(15), frame()]);
    assert.equal(firstFrameOffset(bytes), 44);
    const header = decodeMpegHeader(bytes, 44);
    assert.deepEqual(header, {
      frameLengthBytes: 208,
      bitrateBitsPerSecond: 64000,
      sampleRateHz: 44100,
      paddingBit: 0,
      hasCrc: false,
      mono: false,
    });
    const tag = Buffer.alloc(128);
    tag.write("TAG");
    const result = analyzeMp3(Buffer.concat([bytes, tag]));
    assert.equal(result.audioFrameCount, 1);
    assert.deepEqual(result.warnings, []);
    assert(result.xing.status === "present");
    assert.equal(result.xing.frameOffsetBytes, 44);
    assert.equal(result.xing.markerOffsetBytes, 80);
    assert.equal(result.xing.frameOffsetBytes + result.xing.frameLengthBytes, 252);
    assert.equal(result.xing.seekTableEntryCount, 100);
    assert.equal(result.xing.qualityValue, 0);
  });
});

describe("Canonical wire guards and controlled ingress catalogue parity", () => {
  test("reject unsafe counts, inherited data, extra properties and missing compact metadata", () => {
    for (const count of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
      assert(!isUploadSuccess({ frameCount: count }));
    assert(!isUploadSuccess({ frameCount: 1, private: "secret" }));
    assert(!isUploadSuccess(Object.create({ frameCount: 1 })));
    assert(
      !isUploadSuccess({
        frameCount: 1,
        analysis: {
          physicalFrameCount: 2,
          excludedMetadataFrameCount: 1,
          xing: {
            status: "present",
            marker: "Xing",
            frameOffsetBytes: 0,
            frameLengthBytes: 208,
            markerOffsetBytes: 36,
            flags: 1,
          },
          warnings: [],
        },
      }),
    );
    assert.throws(() => analyzeMp3(Buffer.from([0])), Mp3DomainError);
  });

  test("every literal controlled NGINX error is exact catalogue code/status/message, including docs variants", () => {
    const text = readFileSync(new URL("../../frontend/nginx.conf.template", import.meta.url), "utf8");
    const matches = [...text.matchAll(/return (\d+) '({"code":.*?})';/g)];
    assert.equal(matches.length, 8);
    for (const match of matches) {
      assert(match[1] && match[2]);
      assert(isApiError(JSON.parse(match[2]), Number(match[1])));
    }
    for (const code of Object.keys(PUBLIC_ERRORS).filter(isPublicErrorCode)) {
      assert(isApiError(projectPublicError(code), PUBLIC_ERRORS[code].status));
      assert(!isApiError({ ...projectPublicError(code), code: "untrusted" }, PUBLIC_ERRORS[code].status));
    }
  });
});
