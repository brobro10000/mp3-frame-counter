/**
 * Candidate transport preservation cases TC-01–07. All probes use existing explicit nonproduction origins and fixtures.
 * Timing cases exercise real configured deadlines; lifecycle uses only reviewed state/SIGTERM with finally restoration.
 */
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { test } from "@playwright/test";
import { assertErrorResponse, assertFrameResponse, assertJson } from "../lib/assertions.ts";
import { fixtureBytes } from "../lib/fixtures.ts";
import { rawRequest } from "../lib/http.ts";
import { control, observeShutdown, readAcknowledgment, readState } from "../lib/lifecycle.ts";
import { target } from "../lib/target.ts";
import {
  assertAdmitted,
  assertEarlyError,
  assertTimeout,
  assertUploadCount,
  delay,
  EARLY_MS,
  IDLE_WINDOW,
  openUpload,
  TOTAL_WINDOW,
  within,
  type Upload,
} from "../lib/transport.ts";

let destination: ReturnType<typeof target>;
test.beforeAll(() => {
  destination = target();
});
const bytes = fixtureBytes("three-frames");

async function recovery() {
  // Two simultaneous admissions detect a leaked slot; one later successful request alone would not.
  const held: Upload[] = [];
  try {
    for (let index = 0; index < 2; index += 1) {
      const upload = openUpload(destination.api, { length: bytes.length });
      held.push(upload);
      await assertAdmitted(upload);
    }
    for (const upload of held) {
      upload.end(bytes);
      await assertUploadCount(upload, 3);
    }
  } finally {
    for (const upload of held) upload.close();
  }
}
async function restored() {
  const deadline = performance.now() + 60_000;
  while (performance.now() < deadline) {
    try {
      const response = await rawRequest(`${destination.api}/healthz`, { timeout: 1_000 });
      if (response.status === 200) {
        assert.deepEqual(assertJson(response), { status: "ok" });
        return;
      }
    } catch {
      /* Startup may briefly refuse connections; the fixed deadline remains authoritative. */
    }
    await delay(100);
  }
  throw new Error("Restored API did not become healthy");
}

test("TC-01 direct API error precedence", async () => {
  for (const [path, method, headers, status, allow] of [
    ["/unknown-api-route", "PUT", { "Content-Type": "text/plain" }, 404, undefined],
    ["/file-upload", "PUT", { "Content-Type": "text/plain" }, 405, "POST"],
    ["/healthz", "POST", { "Content-Type": "text/plain" }, 405, "GET"],
    ["/file-upload", "POST", { "Content-Type": "text/plain" }, 415, undefined],
    ["/file-upload", "POST", { "Content-Type": "audio/mpeg", "Content-Encoding": "gzip" }, 415, undefined],
  ] as const) {
    const response = await rawRequest(`${destination.api}${path}`, { method, headers, body: Buffer.alloc(0) });
    assertErrorResponse(response, status);
    if (allow) assert.equal(response.headers.allow, allow);
  }
});

test("TC-02 exact paths and encoding normalization", async () => {
  for (const path of ["/file-upload/", "/FILE-UPLOAD", "/%66ile-upload"]) {
    assertErrorResponse(
      await rawRequest(`${destination.api}${path}`, {
        method: "POST",
        headers: { "Content-Type": "audio/mpeg" },
        body: bytes,
      }),
      404,
    );
  }
  assertFrameResponse(
    await rawRequest(`${destination.api}/file-upload`, {
      method: "POST",
      headers: { "Content-Type": "audio/mpeg", "Content-Encoding": "IDENTITY" },
      body: bytes,
    }),
    3,
  );
  assertErrorResponse(
    await rawRequest(`${destination.api}/file-upload`, {
      method: "POST",
      headers: { "Content-Type": "audio/mpeg", "Content-Encoding": "identity, identity" },
      body: bytes,
    }),
    415,
  );
});

test("TC-03 Expect validates before body admission", async () => {
  for (const [options, status, allow] of [
    [{ path: "/unknown-api-route", method: "PUT", headers: { "Content-Type": "text/plain" } }, 404, undefined],
    [{ method: "PUT", headers: { "Content-Type": "text/plain" } }, 405, "POST"],
    [{ headers: { "Content-Type": "text/plain" } }, 415, undefined],
    [{ headers: { "Content-Encoding": "gzip" } }, 415, undefined],
    [{ length: 20_971_521 }, 413, undefined],
    [{ expectation: "unsupported-expectation" }, 417, undefined],
  ] as const) {
    const upload = openUpload(destination.api, options);
    try {
      await assertEarlyError(upload, status, allow);
    } finally {
      upload.close();
    }
  }
  await recovery();
});

test("TC-04 two slots reject early and release after abort completion and error", async () => {
  const held: Upload[] = [];
  let anchorTimer: ReturnType<typeof setInterval> | undefined;
  let anchorOffset = 0;
  const open = (length = bytes.length) => {
    const upload = openUpload(destination.api, { length });
    held.push(upload);
    return upload;
  };
  try {
    const anchor = open();
    await assertAdmitted(anchor);
    // Keep the occupied comparison slot active while cancellation/recovery propagates.
    anchorTimer = setInterval(() => {
      if (!anchor.settled) anchor.write(bytes.subarray(anchorOffset, ++anchorOffset));
    }, 2_000);
    const aborted = open();
    await assertAdmitted(aborted);
    const busy = open();
    await assertEarlyError(busy, 503);
    busy.close();
    aborted.close();
    // Retry only explicit readable busy errors while the peer processes cancellation; no guessed abort sleep.
    const deadline = performance.now() + EARLY_MS;
    let released: Upload | undefined;
    while (performance.now() < deadline) {
      const probe = open();
      const first = await within(probe.first, deadline - performance.now(), "Aborted slot was not released");
      if (first.kind === "continue") {
        await assertAdmitted(probe);
        released = probe;
        break;
      }
      await assertEarlyError(probe, 503);
      probe.close();
      await delay(50);
    }
    assert.ok(released, "Aborted slot was not released");
    released.end(bytes);
    await assertUploadCount(released, 3);
    const invalidBytes = fixtureBytes("garbage");
    const invalid = open(invalidBytes.length);
    await assertAdmitted(invalid);
    invalid.end(invalidBytes);
    const outcome = await within(invalid.outcome, EARLY_MS, "Invalid upload response missing");
    assert.equal(outcome.kind, "response");
    if (outcome.kind === "response") assertErrorResponse(outcome.response, 400);
    const afterError = open();
    await assertAdmitted(afterError);
    afterError.end(bytes);
    await assertUploadCount(afterError, 3);
    clearInterval(anchorTimer);
    anchor.end(bytes.subarray(anchorOffset));
    await assertUploadCount(anchor, 3);
  } finally {
    clearInterval(anchorTimer);
    for (const upload of held) upload.close();
  }
  await recovery();
});

test("TC-05 idle body deadline is readable and releases capacity", async () => {
  const upload = openUpload(destination.api);
  try {
    await assertAdmitted(upload);
    await assertTimeout(upload, IDLE_WINDOW);
  } finally {
    upload.close();
  }
  await recovery();
});

test("TC-06 active body reaches total deadline and releases capacity", async () => {
  const upload = openUpload(destination.api);
  let timer: ReturnType<typeof setInterval> | undefined;
  try {
    await assertAdmitted(upload);
    let offset = 0;
    // Valid-prefix bytes every two seconds keep activity comfortably inside the ten-second idle interval.
    timer = setInterval(() => {
      if (!upload.settled) upload.write(bytes.subarray(offset, ++offset));
    }, 2_000);
    await assertTimeout(upload, TOTAL_WINDOW);
  } finally {
    clearInterval(timer);
    upload.close();
  }
  await recovery();
});

test("TC-07 unfinished upload closes and SIGTERM exits normally", async () => {
  const initial = readState(await control(destination.control, "state"));
  assert.deepEqual(initial.state, {
    running: true,
    paused: false,
    restarting: false,
    dead: false,
    exitCode: 0,
    oomKilled: false,
    hasError: false,
  });
  const upload = openUpload(destination.api);
  let failure: unknown;
  try {
    await assertAdmitted(upload);
    const started = performance.now();
    readAcknowledgment(await control(destination.control, "signal-term"), initial);
    await observeShutdown(initial, upload.closure, started, () => control(destination.control, "state"));
  } catch (error) {
    failure = error;
  } finally {
    upload.close();
    try {
      const response = await control(destination.control, "start", 60_000);
      assert.equal(response.status, 200);
      assert.deepEqual(assertJson(response), { status: "ok" });
      await restored();
    } catch (error) {
      throw new AggregateError(failure ? [failure, error] : [error], "Shutdown observation/restoration failed");
    }
  }
  if (failure) throw failure;
  await recovery();
});
