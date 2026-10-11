/**
 * Calibrate the actual HS-01 predicate against two fresh owned loopback pages and public synthetic credentials.
 * Call runHostedUiControls with a caller-owned pinned browser. The manual-button counterpart must pass; the fixture
 * with a 100 ms selection-triggered upload and a no-op button must fail the exact selection-only assertion.
 * Both fixtures prove real complete CBR request receipt, count availability and visible rendering before classification.
 * Only closed control rows escape; no request/header/exception data or artifacts are emitted. Every owned listener and
 * lease closes even after refusal/setup failure. This is candidate calibration, never hosted application acceptance.
 */
import assert, { AssertionError } from "node:assert/strict";
import { absentDetail } from "./backend-audio-contract.ts";
import { once } from "node:events";
import { createServer, type Server } from "node:http";
import { expect, type Browser } from "@playwright/test";
import { fixtureBytes } from "./fixtures.ts";
import { openHostedBrowser, type HostedBrowserLease } from "./hosted-browser.ts";
import { createOwnedControlTarget, CONTROL_TOKEN } from "./hosted-control-target.ts";
import { hostedFailure, hostedFailureCode } from "./hosted-target.ts";
import type { ControlRow, FailureCode } from "./hosted-types.ts";
import { checkHostedExplicitUpload } from "./hosted-ui.ts";

/** Close this fixture's listener/connections under a five-second bound; unacknowledged cleanup rejects. */
async function stop(server: Server): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    server.closeAllConnections();
    await Promise.race([
      new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(hostedFailure("CLEANUP")), 5_000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** Run the fixed passing counterpart first, then require semantic refusal with independent fixture receipt evidence. */
export async function runHostedUiControls(browser: Browser): Promise<ControlRow[]> {
  const rows: ControlRow[] = [];
  for (const mode of ["manual", "delayed-selection"] as const) {
    const codes = new Set<FailureCode>();
    let cleanup: ControlRow["cleanup"] = "passed";
    let lease: HostedBrowserLease | undefined;
    const expectedBody = fixtureBytes("tone-cbr");
    let uploads = 0;
    let completeUploads = 0;
    let validReceipt = false;
    let fixtureFault = false;
    const server = createServer((request, response) => {
      request.on("error", () => {
        fixtureFault = true;
      });
      if (request.headers["x-serverless-authorization"] !== `Bearer ${CONTROL_TOKEN}`) {
        request.resume();
        response.writeHead(401).end();
        return;
      }
      if (request.url === "/file-upload?details=true" && request.method === "POST") {
        uploads += 1;
        const chunks: Buffer[] = [];
        let length = 0;
        request.on("data", (chunk: Buffer) => {
          length += chunk.length;
          if (length <= expectedBody.length) chunks.push(chunk);
        });
        request.on("end", () => {
          completeUploads += 1;
          validReceipt =
            request.headers["content-type"] === "audio/mpeg" &&
            length === expectedBody.length &&
            Buffer.concat(chunks).equals(expectedBody);
          response.writeHead(validReceipt ? 200 : 400, { "Content-Type": "application/json" });
          response.end(
            validReceipt
              ? JSON.stringify(absentDetail(9))
              : '{"code":"UPLOAD_EMPTY","error":"Choose a nonempty MP3 file."}',
          );
        });
        return;
      }
      request.resume();
      if (request.url === "/") {
        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        response.end(
          '<!doctype html><title>Owned UI control</title><link rel="icon" href="/icon.svg">' +
            '<label for="file">MP3 file</label><input id="file" type="file">' +
            '<button type="button">Analyze MP3</button><p role="status">Choose an MP3</p>' +
            '<script src="/fixture.js"></script>',
        );
      } else if (request.url === "/fixture.js") {
        response.writeHead(200, { "Content-Type": "application/javascript" });
        response.end(`
const input = document.querySelector('input');
const button = document.querySelector('button');
const status = document.querySelector('[role="status"]');
globalThis.fixtureState = { selected: 0, clicked: 0, completed: 0, timerFired: false };
async function upload() {
  const response = await fetch('/file-upload?details=true', {
    method: 'POST', headers: { 'Content-Type': 'audio/mpeg' }, body: input.files[0]
  });
  const value = await response.json();
  status.textContent = value.frameCount + ' frames';
  globalThis.fixtureState.completed += 1;
}
input.addEventListener('change', () => {
  globalThis.fixtureState.selected += 1;
  if (${mode === "delayed-selection"}) setTimeout(() => {
    globalThis.fixtureState.timerFired = true;
    upload();
  }, 100);
});
button.addEventListener('click', () => {
  globalThis.fixtureState.clicked += 1;
  if (${mode === "manual"}) upload();
});
`);
      } else if (request.url === "/icon.svg") {
        response.writeHead(200, { "Content-Type": "image/svg+xml" });
        response.end('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>');
      } else {
        response.writeHead(404).end();
      }
    });
    server.requestTimeout = 5_000;
    server.headersTimeout = 5_000;
    try {
      server.listen(0, "127.0.0.1");
      await once(server, "listening");
      const address = server.address();
      assert.ok(address && typeof address !== "string");
      lease = await openHostedBrowser(browser, createOwnedControlTarget(`http://127.0.0.1:${address.port}`), "desktop");
      if (mode === "manual") {
        await checkHostedExplicitUpload(lease);
      } else {
        await assert.rejects(
          checkHostedExplicitUpload(lease),
          (error: unknown) =>
            error instanceof AssertionError &&
            error.operator === "strictEqual" &&
            error.actual === 1 &&
            error.expected === 0 &&
            error.message.startsWith("Selection-only upload attempt"),
        );
      }
      // A missing setup/response cannot satisfy the intended rejection: both counterparts complete the actual upload.
      await expect(lease.page.getByRole("status")).toHaveText("9 frames");
      assert.equal(uploads, 1);
      assert.equal(completeUploads, 1);
      assert.equal(validReceipt, true);
      assert.equal(fixtureFault, false);
      const state = await lease.page.evaluate(() => (globalThis as any).fixtureState);
      assert.deepEqual(state, {
        selected: 1,
        clicked: mode === "manual" ? 1 : 0,
        completed: 1,
        timerFired: mode === "delayed-selection",
      });
    } catch (error) {
      codes.add(hostedFailureCode(error));
    } finally {
      if (lease) {
        try {
          const finish = await lease.close();
          for (const code of finish.failures) codes.add(code);
          if (finish.cleanup !== "passed") throw hostedFailure("CLEANUP");
        } catch {
          cleanup = "failed";
          codes.add("CLEANUP");
        }
      }
      try {
        await stop(server);
      } catch {
        cleanup = "failed";
        codes.add("CLEANUP");
      }
    }
    rows.push({
      id: mode === "manual" ? "ui-explicit-action-counterpart" : "ui-delayed-selection-refused",
      status: codes.size ? "failed" : "passed",
      cleanup,
      codes: [...codes],
    });
  }
  return rows;
}
