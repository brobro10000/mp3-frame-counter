/**
 * Verify the pure parser against the independently reviewed r3 fixture manifest and narrowly specified edge cases.
 * Run with `node --test tests/unit/mp3.test.ts`. This reads portable fixture inputs, writes nothing, and fails on count,
 * classification or input-mutation disagreement. It does not require the ignored private sample or a running service.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, test } from "node:test";
import { Mp3ParseError } from "../../server/src/errors.ts";
import { countMp3Frames } from "../../server/src/mp3.ts";
import { fixtureBytes, manifest } from "../acceptance/lib/fixtures.ts";

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
