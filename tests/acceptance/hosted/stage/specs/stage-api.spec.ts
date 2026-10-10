/**
 * The fifteen hosted-v1 public API cases use only the stage fixture's authenticated HTTP adapter and frozen bytes.
 * Run through the fixed e2e:stage wrapper; discovery registers literal titles without loading a target or credentials.
 * Expected counts, sizes and errors come from the reviewed contract, never product output. Bodies send real uploads,
 * including large/chunked input and one deliberate abort; they never call private health or fault-controller routes.
 * Assertions and adapter failures propagate. The automatic fixture drains resources and enforces finalization.
 */
import assert from "node:assert/strict";
import { assertErrorResponse, assertFrameResponse, assertJson } from "../../../lib/assertions.ts";
import { fixtureBytes } from "../../../lib/fixtures.ts";
import { createHostedTest } from "../../../lib/hosted-fixtures.ts";
import type { HostedHttp } from "../../../lib/hosted-http.ts";

const test = createHostedTest("stage");

/** Send one frozen fixture to the fixed public upload route; adapter/network rejection propagates without retries. */
function upload(http: HostedHttp, id: string, contentType = "audio/mpeg", extraHeaders: Record<string, string> = {}) {
  return http.request("/file-upload", {
    method: "POST",
    headers: { "Content-Type": contentType, ...extraHeaders },
    body: fixtureBytes(id),
  });
}

/**
 * Witness a complete declared-length boundary upload against literal contract size/count inputs. Fixture drift,
 * omitted framing, short transmission, bad JSON or a wrong answer fails; this helper has only adapter network effects.
 */
async function declaredUpload(http: HostedHttp, id: string, bytes: number, count: number): Promise<void> {
  const body = fixtureBytes(id);
  assert.equal(body.length, bytes);
  const response = await http.request("/file-upload", {
    method: "POST",
    headers: { "Content-Type": "audio/mpeg" },
    body,
  });
  assert.equal(response.contentLengthSent, true);
  assert.equal(response.sentBytes, bytes);
  assertFrameResponse(response, count);
}

test("HS-03 CBR count and accepted media survive managed ingress", async ({ hostedHttp }) => {
  for (const media of [
    "audio/mpeg",
    "application/octet-stream",
    "Audio/MPEG; charset=binary",
    "Application/Octet-Stream; charset=binary",
  ]) {
    assertFrameResponse(await upload(hostedHttp, "tone-cbr", media), 9);
  }
});

test("HS-04 VBR physical count survives managed ingress", async ({ hostedHttp }) => {
  for (const media of ["audio/mpeg", "application/octet-stream"]) {
    assertFrameResponse(await upload(hostedHttp, "tone-vbr", media), 16);
  }
});

test("HS-05 padded physical count survives managed ingress", async ({ hostedHttp }) => {
  for (const media of ["audio/mpeg", "application/octet-stream"]) {
    assertFrameResponse(await upload(hostedHttp, "tone-padded", media), 21);
  }
});

test("HS-06 Xing-bearing physical frames remain counted", async ({ hostedHttp }) => {
  assertFrameResponse(await upload(hostedHttp, "xing-physical"), 2);
});

test("HS-07 malformed and unsupported uploads retain readable JSON errors", async ({ hostedHttp }) => {
  assertErrorResponse(await upload(hostedHttp, "empty"), 400);
  assertErrorResponse(await upload(hostedHttp, "truncated-frame"), 400);
  assertErrorResponse(await upload(hostedHttp, "mpeg2"), 415);
});

test("HS-08 unsupported media and encoding remain isolated errors", async ({ hostedHttp }) => {
  assertErrorResponse(
    await hostedHttp.request("/file-upload", { method: "POST", body: fixtureBytes("tone-cbr") }),
    415,
  );
  assertErrorResponse(await upload(hostedHttp, "tone-cbr", "text/plain"), 415);
  for (const encoding of ["gzip", "identity, identity"]) {
    assertErrorResponse(await upload(hostedHttp, "tone-cbr", "audio/mpeg", { "Content-Encoding": encoding }), 415);
  }
  assertFrameResponse(await upload(hostedHttp, "tone-cbr", "audio/mpeg", { "Content-Encoding": "IDENTITY" }), 9);
});

test("HS-09 public upload paths and methods retain their contract", async ({ hostedHttp }) => {
  assertFrameResponse(await upload(hostedHttp, "tone-cbr"), 9);
  assertFrameResponse(
    await hostedHttp.request("/file-upload?source=acceptance", {
      method: "POST",
      headers: { "Content-Type": "audio/mpeg" },
      body: fixtureBytes("tone-cbr"),
    }),
    9,
  );
  for (const path of ["/file-upload/", "/FILE-UPLOAD", "/%66ile-upload"]) {
    assertErrorResponse(
      await hostedHttp.request(path, {
        method: "POST",
        headers: { "Content-Type": "audio/mpeg" },
        body: fixtureBytes("tone-cbr"),
      }),
      404,
    );
  }
  for (const method of ["GET", "PUT", "OPTIONS"] as const) {
    const response = await hostedHttp.request("/file-upload", { method });
    assertErrorResponse(response, 405);
    assert.equal(response.headers.allow, "POST");
  }
  const head = await hostedHttp.request("/file-upload", { method: "HEAD" });
  assert.equal(head.status, 405);
  assert.equal(head.headers.allow, "POST");
  assert.match(String(head.headers["content-type"]), /^application\/json(?:\s*;\s*charset=utf-8)?$/i);
  assert.equal(head.body, "");
});

test("HS-10 upload above one MiB retains its complete count", async ({ hostedHttp }) => {
  await declaredUpload(hostedHttp, "above-one-mib", 1_152_000, 3_000);
});

test("HS-11 six MiB upload retains its complete count", async ({ hostedHttp }) => {
  await declaredUpload(hostedHttp, "six-mib", 6_291_456, 16_384);
});

test("HS-12 exact twenty MiB upload is accepted", async ({ hostedHttp }) => {
  await declaredUpload(hostedHttp, "exact-limit", 20_971_520, 54_613);
});

test("HS-13 one byte over the limit yields readable error and recovery", async ({ hostedHttp }) => {
  const body = fixtureBytes("over-limit");
  assert.equal(body.length, 20_971_521);
  const response = await hostedHttp.request("/file-upload", {
    method: "POST",
    headers: { "Content-Type": "audio/mpeg" },
    body,
  });
  assert.equal(response.contentLengthSent, true);
  assertErrorResponse(response, 413);
  assertFrameResponse(await upload(hostedHttp, "tone-cbr"), 9);
});

test("HS-14 valid upload without Content-Length is accepted", async ({ hostedHttp }) => {
  const body = fixtureBytes("tone-cbr");
  const response = await hostedHttp.request("/file-upload", {
    method: "POST",
    headers: { "Content-Type": "audio/mpeg" },
    body,
    chunked: true,
  });
  assert.equal(response.contentLengthSent, false);
  assert.equal(response.transferEncoding, "chunked");
  assert.equal(response.sentBytes, body.length);
  assertFrameResponse(response, 9);
});

test("HS-15 actual-byte limit survives upload without Content-Length", async ({ hostedHttp }) => {
  const body = fixtureBytes("over-limit");
  assert.equal(body.length, 20_971_521);
  const response = await hostedHttp.request("/file-upload", {
    method: "POST",
    headers: { "Content-Type": "audio/mpeg" },
    body,
    chunked: true,
  });
  assert.equal(response.contentLengthSent, false);
  assert.equal(response.transferEncoding, "chunked");
  assert.equal(response.sentBytes, 20_971_521);
  assertErrorResponse(response, 413);
  assertFrameResponse(await upload(hostedHttp, "tone-cbr"), 9);
});

test("HS-16 externally aborted upload permits later complete upload", async ({ hostedHttp }) => {
  // The adapter witnesses the actual incomplete-request abort and rejects partial 200 during its fixed 500 ms window.
  await hostedHttp.abortUpload(fixtureBytes("three-frames"));
  assertFrameResponse(await upload(hostedHttp, "tone-cbr"), 9);
});

test("HS-17 public frontend health remains service-local", async ({ hostedHttp }) => {
  const response = await hostedHttp.request("/healthz");
  assert.equal(response.status, 200);
  assert.deepEqual(assertJson(response), { status: "ok" });
});
