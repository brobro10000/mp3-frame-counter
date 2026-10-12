/**
 * Independent backend-audio-v1 fixtures and external response matrices. Literal headers/lengths/counts construct the
 * oracle; this file never parses framing, imports product code or acquires a destination. Requests require an origin
 * already authorized by the ordinary controller. Missing fields, physical fallback and malformed counts fail closed.
 */
import assert from "node:assert/strict";
import { expect, type Page } from "@playwright/test";
import { assertFrameResponse, assertErrorResponse, assertJson, type ResponseData } from "./assertions.ts";
import { fixtureBytes } from "./fixtures.ts";
import { rawRequest } from "./http.ts";

export interface XingMetadata {
  status: "present";
  marker: "Xing" | "Info";
  frameOffsetBytes: number;
  frameLengthBytes: number;
  markerOffsetBytes: number;
  flags: number;
  declaredAudioFrameCount?: number;
  declaredMpegStreamByteCount?: number;
  seekTableEntryCount?: 100;
  qualityValue?: number;
}
export type Warning =
  | { code: "XING_DECLARED_FRAME_COUNT_MISMATCH" | "XING_DECLARED_STREAM_BYTES_MISMATCH" }
  | {
      code: "XING_OPTIONAL_FIELD_TRUNCATED";
      field: "declaredAudioFrameCount" | "declaredMpegStreamByteCount" | "seekTable" | "qualityValue";
    };
export interface DetailedResult {
  frameCount: number;
  analysis: {
    physicalFrameCount: number;
    excludedMetadataFrameCount: 0 | 1;
    xing: { status: "absent" } | XingMetadata;
    warnings: Warning[];
  };
}
export interface AudioFixture {
  id: string;
  bytes: Buffer;
  expected?: DetailedResult;
  code?: string;
  status?: number;
}
export const fixtureErrorCodes: Readonly<Record<string, string>> = {
  empty: "UPLOAD_EMPTY",
  garbage: "MP3_INVALID_HEADER",
  "truncated-frame": "MP3_TRUNCATED_FRAME",
  "trailing-junk": "MP3_INVALID_HEADER",
  "corrupt-middle": "MP3_INVALID_HEADER",
  "truncated-header": "MP3_TRUNCATED_FRAME",
  "metadata-only": "MP3_NO_AUDIO_FRAMES",
  "tag-out-of-bounds": "MP3_INVALID_METADATA",
  "tag-nonsynchsafe": "MP3_INVALID_METADATA",
  "tag-reserved-flag": "MP3_INVALID_METADATA",
  "tag-invalid-version": "MP3_INVALID_METADATA",
  "tag-invalid-revision": "MP3_INVALID_METADATA",
  "reserved-version": "MP3_INVALID_HEADER",
  "reserved-layer": "MP3_INVALID_HEADER",
  "reserved-bitrate": "MP3_INVALID_HEADER",
  "reserved-sample-rate": "MP3_INVALID_HEADER",
  "reserved-emphasis": "MP3_INVALID_HEADER",
};
export const audioCountOverrides: Readonly<Record<string, number>> = { "tone-vbr": 15, "xing-physical": 1 };

/** Preserve every historical physical fixture expectation and explicitly select its separate successor audio count. */
export function audioExpected(id: string, physical: number): number {
  return audioCountOverrides[id] ?? physical;
}

/** One literal supported header/size pair; no parser computes fixture lengths or expectations. */
function frame(mono = false, crc = false, length = 384): Buffer {
  const result = Buffer.alloc(length);
  const bitrateByte = length === 96 ? 0x14 : length === 144 ? 0x34 : 0x94;
  Buffer.from([0xff, crc ? 0xfa : 0xfb, bitrateByte, mono ? 0xc0 : 0]).copy(result);
  return result;
}

/** Expected absent-carrier breakdown for an independently constructed physical count. */
export function absentDetail(count: number): DetailedResult {
  return {
    frameCount: count,
    analysis: { physicalFrameCount: count, excludedMetadataFrameCount: 0, xing: { status: "absent" }, warnings: [] },
  };
}

export const encodedVbrDetail: DetailedResult = {
  frameCount: 15,
  analysis: {
    physicalFrameCount: 16,
    excludedMetadataFrameCount: 1,
    xing: {
      status: "present",
      marker: "Xing",
      frameOffsetBytes: 0,
      frameLengthBytes: 182,
      markerOffsetBytes: 21,
      flags: 15,
      declaredAudioFrameCount: 15,
      declaredMpegStreamByteCount: 2160,
      seekTableEntryCount: 100,
      qualityValue: 0,
    },
    warnings: [],
  },
};

/** Construct a complete carrier and two literal audio frames. Optional fields use flags, never sample offsets. */
function carrier(id: string, mono = false, crc = false, marker: "Xing" | "Info" = "Xing", flags = 15): AudioFixture {
  const bytes = Buffer.concat([frame(mono, crc), frame(), frame()]);
  const position = mono ? 21 : 36;
  bytes.write(marker, position);
  bytes.writeUInt32BE(flags, position + 4);
  const metadata: XingMetadata = {
    status: "present",
    marker,
    frameOffsetBytes: 0,
    frameLengthBytes: 384,
    markerOffsetBytes: position,
    flags,
  };
  let cursor = position + 8;
  if (flags & 1) {
    bytes.writeUInt32BE(2, cursor);
    cursor += 4;
    metadata.declaredAudioFrameCount = 2;
  }
  if (flags & 2) {
    bytes.writeUInt32BE(bytes.length, cursor);
    cursor += 4;
    metadata.declaredMpegStreamByteCount = bytes.length;
  }
  if (flags & 4) {
    bytes.fill(7, cursor, cursor + 100);
    cursor += 100;
    metadata.seekTableEntryCount = 100;
  }
  if (flags & 8) {
    bytes.writeUInt32BE(0, cursor);
    metadata.qualityValue = 0;
  }
  return {
    id,
    bytes,
    expected: {
      frameCount: 2,
      analysis: { physicalFrameCount: 3, excludedMetadataFrameCount: 1, xing: metadata, warnings: [] },
    },
  };
}

/** Fresh portable fixtures establish marker/channel/CRC, all16 flag combinations, bounds and decisive mutations. */
export function audioFixtures(): AudioFixture[] {
  const result: AudioFixture[] = [];
  for (const mono of [false, true])
    for (const crc of [false, true])
      for (const marker of ["Xing", "Info"] as const)
        result.push(carrier(`${marker}-${mono ? "mono" : "stereo"}-${crc ? "crc" : "plain"}`, mono, crc, marker));
  for (let flags = 0; flags <= 15; flags += 1) result.push(carrier(`flags-${flags}`, false, false, "Xing", flags));
  const tampered = carrier("tampered-count");
  tampered.bytes.writeUInt32BE(0xffffffff, 44);
  tampered.expected!.analysis.xing = {
    ...(tampered.expected!.analysis.xing as XingMetadata),
    declaredAudioFrameCount: 0xffffffff,
  };
  tampered.expected!.analysis.warnings = [{ code: "XING_DECLARED_FRAME_COUNT_MISMATCH" }];
  result.push(tampered);
  const zero = carrier("zero-declaration");
  zero.bytes.writeUInt32BE(0, 44);
  (zero.expected!.analysis.xing as XingMetadata).declaredAudioFrameCount = 0;
  zero.expected!.analysis.warnings = [{ code: "XING_DECLARED_FRAME_COUNT_MISMATCH" }];
  result.push(zero);
  const removed = carrier("removed-final-frame");
  removed.bytes = removed.bytes.subarray(0, 768);
  removed.expected!.frameCount = 1;
  removed.expected!.analysis.physicalFrameCount = 2;
  removed.expected!.analysis.warnings = [
    { code: "XING_DECLARED_FRAME_COUNT_MISMATCH" },
    { code: "XING_DECLARED_STREAM_BYTES_MISMATCH" },
  ];
  result.push(removed);
  const truncated = carrier("truncated-final-frame");
  result.push({ id: truncated.id, bytes: truncated.bytes.subarray(0, 1151), status: 400, code: "MP3_TRUNCATED_FRAME" });
  const tag = Buffer.from("49443304000000000022" + "00".repeat(34), "hex");
  const tagged = carrier("leading-44-byte-tag");
  tagged.bytes = Buffer.concat([tag, tagged.bytes]);
  (tagged.expected!.analysis.xing as XingMetadata).frameOffsetBytes = 44;
  (tagged.expected!.analysis.xing as XingMetadata).markerOffsetBytes = 80;
  result.push(tagged);
  const trailing = carrier("both-outer-tags");
  const suffix = Buffer.alloc(128);
  suffix.write("TAG");
  trailing.bytes = Buffer.concat([tag, trailing.bytes, suffix]);
  (trailing.expected!.analysis.xing as XingMetadata).frameOffsetBytes = 44;
  (trailing.expected!.analysis.xing as XingMetadata).markerOffsetBytes = 80;
  result.push(trailing);
  const noCarrier = carrier("removed-carrier");
  result.push({ id: noCarrier.id, bytes: noCarrier.bytes.subarray(384), expected: absentDetail(2) });
  const carrierOnly = carrier("carrier-only");
  result.push({
    id: carrierOnly.id,
    bytes: carrierOnly.bytes.subarray(0, 384),
    status: 400,
    code: "MP3_NO_AUDIO_FRAMES",
  });
  for (const [id, offset, marker] of [
    ["wrong-position", 80, "Xing"],
    ["vbri", 36, "VBRI"],
  ] as const) {
    const bytes = frame();
    bytes.write(marker, offset);
    result.push({ id, bytes, expected: absentDetail(1) });
  }
  const later = carrier("later-marker");
  result.push({ id: later.id, bytes: Buffer.concat([frame(), later.bytes]), expected: absentDetail(4) });
  const tagMarker = Buffer.from(tag);
  tagMarker.write("Xing", 10);
  result.push({ id: "id3-marker", bytes: Buffer.concat([tagMarker, frame()]), expected: absentDetail(1) });
  for (const mono of [false, true]) {
    const bytes = Buffer.concat([frame(mono, true), frame()]);
    bytes.write("Xing", mono ? 23 : 38);
    bytes.writeUInt32BE(0, mono ? 27 : 42);
    result.push({ id: `shifted-crc-${mono}`, bytes, status: 415, code: "MP3_UNSUPPORTED_METADATA" });
  }
  const unknown = carrier("unknown-flags", false, false, "Xing", 16);
  result.push({ id: unknown.id, bytes: unknown.bytes, status: 415, code: "MP3_UNSUPPORTED_METADATA" });
  for (const [id, length, flags, field] of [
    ["bounded-seek", 96, 15, "seekTable"],
    ["bounded-quality", 144, 12, "qualityValue"],
  ] as const) {
    const bytes = Buffer.concat([frame(false, false, length), frame()]);
    bytes.write("Xing", 36);
    bytes.writeUInt32BE(flags, 40);
    const xing: XingMetadata = {
      status: "present",
      marker: "Xing",
      frameOffsetBytes: 0,
      frameLengthBytes: length,
      markerOffsetBytes: 36,
      flags,
    };
    if (flags === 15) {
      bytes.writeUInt32BE(1, 44);
      bytes.writeUInt32BE(bytes.length, 48);
      xing.declaredAudioFrameCount = 1;
      xing.declaredMpegStreamByteCount = bytes.length;
    } else {
      bytes.fill(7, 44, 144);
      xing.seekTableEntryCount = 100;
    }
    result.push({
      id,
      bytes,
      expected: {
        frameCount: 1,
        analysis: {
          physicalFrameCount: 2,
          excludedMetadataFrameCount: 1,
          xing,
          warnings: [{ code: "XING_OPTIONAL_FIELD_TRUNCATED", field }],
        },
      },
    });
  }
  return result;
}

/** Exact independent detail equality plus count invariants; rejects stripped/default-only or leaked domain fields. */
export function assertDetailedFrameResponse(response: ResponseData, expected: DetailedResult): void {
  assert.equal(response.status, 200);
  assert.ok(Number.isSafeInteger(expected.frameCount) && expected.frameCount > 0);
  assert.equal(
    expected.analysis.physicalFrameCount,
    expected.frameCount + expected.analysis.excludedMetadataFrameCount,
  );
  assert.deepEqual(assertJson(response), expected);
}

/** Run real default/detail uploads for independently known structural and original encoded fixtures in both media. */
export async function checkAudioMatrix(origin: string): Promise<void> {
  for (const input of [
    ...audioFixtures(),
    { id: "encoded-vbr", bytes: fixtureBytes("tone-vbr"), expected: encodedVbrDetail },
  ])
    for (const media of ["audio/mpeg", "application/octet-stream"]) {
      const request = { method: "POST", headers: { "Content-Type": media }, body: input.bytes };
      const plain = await rawRequest(`${origin}/file-upload`, request);
      const detailed = await rawRequest(`${origin}/file-upload?details=true`, request);
      if (input.expected) {
        assertFrameResponse(plain, input.expected.frameCount);
        assertDetailedFrameResponse(detailed, input.expected);
      } else {
        assertErrorResponse(plain, input.status!, input.code);
        assertErrorResponse(detailed, input.status!, input.code);
      }
    }
}

/** Decoded unique exacttrue selects detail; repeats/other values/unknown query data retain exact default shape. */
export async function checkAudioQueryMatrix(origin: string): Promise<void> {
  const input = audioFixtures()[0]!;
  const request = { method: "POST", headers: { "Content-Type": "audio/mpeg" }, body: input.bytes };
  for (const query of ["details=true", "source=acceptance&details=true", "details=true&x=1", "%64etails=%74rue"])
    assertDetailedFrameResponse(await rawRequest(`${origin}/file-upload?${query}`, request), input.expected!);
  for (const query of [
    "",
    "details",
    "details=",
    "details=false",
    "details=True",
    "details=1",
    "Details=true",
    "details=true&details=true",
    "details=false&details=true",
    "details=true&%64etails=true",
    "source=acceptance",
  ])
    assertFrameResponse(await rawRequest(`${origin}/file-upload?${query}`, request), 2);
}

/** Match one whole integer with optional ordinary comma grouping, excluding fractions and digit substrings. */
function uiNumber(value: number): string {
  const grouped = String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return "(?<![0-9,.])(?:" + value + "|" + grouped + ")(?![0-9,.])";
}

/** Require adjacent visible label/value text in either order; element type, colon, line break and units may differ. */
export function hasUiQuantity(text: string, label: RegExp, value: number): boolean {
  const name = label.source.replace(/^\^|\$$/g, "");
  const amount = uiNumber(value);
  return new RegExp("(?:" + name + ")\\s*(?:[:=−–—-]\\s*)?" + amount + "|" + amount + "\\s+(?:" + name + ")", "i").test(
    text,
  );
}

/** Assert the labeled audio result and exact equation in visible text, permitting explanatory operand labels. */
export function assertAudioUiText(text: string, expected: DetailedResult): void {
  assert.ok(
    hasUiQuantity(text, /(?<!declared\s+)audio (?:frames?|frame count|count)/i, expected.frameCount),
    "UI_AUDIO_COUNT",
  );
  const gap = "[^0-9=−-]{0,80}";
  const equation =
    uiNumber(expected.analysis.physicalFrameCount) +
    gap +
    "[−-]" +
    gap +
    uiNumber(expected.analysis.excludedMetadataFrameCount) +
    gap +
    "=" +
    gap +
    uiNumber(expected.frameCount);
  assert.match(text, new RegExp(equation, "i"), "UI_COUNT_EQUATION");
}

/** Observe visible semantic count/equation text, without prescribing heading, card, table or disclosure markup. */
export async function expectAudioUi(page: Page, expected: DetailedResult): Promise<void> {
  await expect
    .poll(async () => {
      try {
        assertAudioUiText(await page.locator("body").innerText(), expected);
        return true;
      } catch (error) {
        if (!(error instanceof assert.AssertionError)) throw error;
        return false;
      }
    })
    .toBe(true);
}

/** Observe one label-associated value in rendered text; nearby unlabeled numbers cannot substitute for it. */
async function summaryValue(page: Page, label: RegExp, value: number): Promise<void> {
  await expect.poll(async () => hasUiQuantity(await page.locator("body").innerText(), label, value)).toBe(true);
}

/** Real portable present/absent/mismatch/bounded-field and zero-audio UI observations; no success is mocked. */
export async function checkAudioUiMatrix(page: Page, origin: string): Promise<void> {
  for (const id of [
    "Xing-stereo-plain",
    "Info-mono-crc",
    "flags-0",
    "removed-carrier",
    "tampered-count",
    "bounded-seek",
    "carrier-only",
  ]) {
    const input = audioFixtures().find((entry) => entry.id === id)!;
    await page.goto(origin);
    let attempts = 0;
    const observe = (request: { url(): string }) => {
      if (new URL(request.url()).pathname === "/file-upload") attempts += 1;
    };
    page.on("request", observe);
    try {
      await page
        .locator('input[type="file"]')
        .setInputFiles({ name: `${id}.mp3`, mimeType: "audio/mpeg", buffer: input.bytes });
      assert.equal(attempts, 0);
      const button = page.getByRole("button", { name: "Analyze MP3", exact: true });
      const [response] = await Promise.all([
        page.waitForResponse((value) => new URL(value.url()).pathname === "/file-upload"),
        button.click(),
      ]);
      assert.deepEqual(new URL(response.request().url()).searchParams.getAll("details"), ["true"]);
      assert.deepEqual(response.request().postDataBuffer(), input.bytes);
      const data = { status: response.status(), headers: response.headers(), body: await response.text() };
      if (input.expected) {
        assertDetailedFrameResponse(data, input.expected);
        await expectAudioUi(page, input.expected);
        await summaryValue(page, /^Physical (?:MPEG )?frames?$/i, input.expected.analysis.physicalFrameCount);
        await summaryValue(
          page,
          /^Excluded (?:(?:Xing\/Info|metadata) )?frames?$/i,
          input.expected.analysis.excludedMetadataFrameCount,
        );
        if (input.expected.analysis.xing.status === "present") {
          const xing = input.expected.analysis.xing;
          const declaredFrames = /^Declared audio frames?$/i;
          const declaredBytes = /^Declared MPEG.stream bytes$/i;
          const visible = await page.locator("body").innerText();
          const needsDisclosure =
            (xing.declaredAudioFrameCount !== undefined &&
              !hasUiQuantity(visible, declaredFrames, xing.declaredAudioFrameCount)) ||
            (xing.declaredMpegStreamByteCount !== undefined &&
              !hasUiQuantity(visible, declaredBytes, xing.declaredMpegStreamByteCount)) ||
            (id === "flags-0" && !/not present|absent|not declared|missing/i.test(visible));
          if (needsDisclosure) {
            const toggle = page
              .getByRole("button", { name: /metadata|Xing|Info/i })
              .or(page.locator("summary").filter({ hasText: /metadata|Xing|Info/i }));
            if (await toggle.count()) await toggle.first().click();
          }
          if (xing.declaredAudioFrameCount !== undefined)
            await summaryValue(page, declaredFrames, xing.declaredAudioFrameCount);
          if (xing.declaredMpegStreamByteCount !== undefined)
            await summaryValue(page, declaredBytes, xing.declaredMpegStreamByteCount);
          if (id === "flags-0")
            await expect(page.getByText(/not present|absent|not declared|missing/i).first()).toBeVisible();
          if (id === "tampered-count")
            await expect(page.getByText(/mismatch|differ|does not match/i).first()).toBeVisible();
          if (id === "bounded-seek")
            await expect(page.getByText(/truncat|damag|incomplete|unavailable/i).first()).toBeVisible();
        }
      } else {
        assertErrorResponse(data, input.status!, input.code);
        await expect(
          page
            .getByRole("status")
            .or(page.getByRole("alert"))
            .filter({ hasText: /no.*audio|no.*complete|contains no/i }),
        ).toBeVisible();
      }
      await expect(button).toBeEnabled();
      assert.equal(attempts, 1, "One action must send exactly one request");
    } finally {
      page.off("request", observe);
    }
  }
}
