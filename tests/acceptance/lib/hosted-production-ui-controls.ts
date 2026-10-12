/**
 * Calibrate the actual registered HP-01 consumer against six fresh owned loopback pages, never a hosted destination.
 * Call runHostedProductionUiControls from the fixed owned-control child with Node's module-mock flag enabled. Only the
 * registration module is mocked; the production specification's real callback and response assertions execute intact.
 * Complete frozen CBR receipt, one selection/click, visible count and successful lease/listener cleanup are necessary
 * for every classification. Negative rows require the intended semantic AssertionError, not a setup/transport failure.
 * Public synthetic credentials and closed rows only; no private input, product imports or hosted acceptance claim.
 */
import assert, { AssertionError } from "node:assert/strict";
import { once } from "node:events";
import { createServer, type Server } from "node:http";
import { mock } from "node:test";
import { isDeepStrictEqual } from "node:util";
import { expect, type Browser } from "@playwright/test";
import { fixtureBytes } from "./fixtures.ts";
import { openHostedBrowser, type HostedBrowserLease, type ViewportName } from "./hosted-browser.ts";
import { createOwnedControlTarget, CONTROL_TOKEN } from "./hosted-control-target.ts";
import { hostedFailure, hostedFailureCode } from "./hosted-target.ts";
import type { ControlRow, FailureCode } from "./hosted-types.ts";

const titles = [
  "HP-01 usable UI completes one small known-count upload",
  "HP-02 production docs are genuinely rendered and usable",
  "HP-03 production specification remains available and correct",
];
const modes = [
  "positive",
  "missing-selector",
  "duplicate-selector",
  "default-only",
  "wrong-physical",
  "missing-warnings",
] as const;
type Mode = (typeof modes)[number];
type Hp01 = (fixtures: { hostedBrowser: (viewport: ViewportName) => Promise<HostedBrowserLease> }) => Promise<void>;
const detail = {
  frameCount: 9,
  analysis: { physicalFrameCount: 9, excludedMetadataFrameCount: 0, xing: { status: "absent" }, warnings: [] },
};

/** Capture literal registrations without executing fixtures, importing private input or acquiring any destination. */
async function captureHp01(): Promise<Hp01> {
  const registrations: { title: string; callback: unknown }[] = [];
  let factories = 0;
  const registration = mock.module(new URL("./hosted-fixtures.ts", import.meta.url), {
    exports: {
      createHostedTest(role: unknown) {
        assert.equal(role, "production");
        factories += 1;
        return (title: string, callback: unknown) => {
          assert.equal(typeof callback, "function");
          registrations.push({ title, callback });
        };
      },
    },
  });
  try {
    await import(new URL("../hosted/production/specs/production-smoke.spec.ts", import.meta.url).href);
  } finally {
    registration.restore();
  }
  assert.equal(factories, 1);
  assert.deepEqual(
    registrations.map(({ title }) => title),
    titles,
  );
  return registrations[0].callback as Hp01;
}

/** Fixed synthetic responses preserve displayed nine while independently damaging one required request/body feature. */
function fixtureResponse(mode: Mode): unknown {
  if (mode === "missing-selector" || mode === "duplicate-selector" || mode === "default-only") return { frameCount: 9 };
  if (mode === "wrong-physical") return { frameCount: 9, analysis: { ...detail.analysis, physicalFrameCount: 10 } };
  if (mode === "missing-warnings")
    return {
      frameCount: 9,
      analysis: { physicalFrameCount: 9, excludedMetadataFrameCount: 0, xing: { status: "absent" } },
    };
  return structuredClone(detail);
}

/** Require the exact failed comparison; an unrelated assertion cannot calibrate the owned defect. */
function intendedRefusal(error: unknown, mode: Mode, body: unknown): boolean {
  if (!(error instanceof AssertionError) || error.operator !== "deepStrictEqual") return false;
  if (mode === "missing-selector" || mode === "duplicate-selector")
    return (
      isDeepStrictEqual(error.expected, ["true"]) &&
      isDeepStrictEqual(error.actual, mode === "missing-selector" ? [] : ["true", "true"])
    );
  return isDeepStrictEqual(error.expected, detail) && isDeepStrictEqual(error.actual, body);
}

/** Close only the owned listener/connections with a finite bound, even after callback or fixture failures. */
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

/** Execute the exact production callback; prove fixture behavior before accepting either success or semantic refusal. */
export async function runHostedProductionUiControls(browser: Browser): Promise<ControlRow[]> {
  const callback = await captureHp01();
  const rows: ControlRow[] = [];
  for (const mode of modes) {
    const codes = new Set<FailureCode>();
    let cleanup: ControlRow["cleanup"] = "passed";
    let lease: HostedBrowserLease | undefined;
    let leaseAcquisitions = 0;
    const expectedBody = fixtureBytes("tone-cbr");
    const body = fixtureResponse(mode);
    const uploadPath =
      mode === "missing-selector"
        ? "/file-upload"
        : mode === "duplicate-selector"
          ? "/file-upload?details=true&details=true"
          : "/file-upload?details=true";
    let uploads = 0;
    let completeUploads = 0;
    let validReceipt = false;
    let fixtureFault = false;
    const server = createServer((request, response) => {
      request.on("error", () => {
        fixtureFault = true;
      });
      if (request.headers["x-serverless-authorization"] !== `Bearer ${CONTROL_TOKEN}`) {
        fixtureFault = true;
        request.resume();
        response.writeHead(401).end();
        return;
      }
      if (request.url?.startsWith("/file-upload") && request.method === "POST") {
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
            request.url === uploadPath &&
            request.headers["content-type"] === "audio/mpeg" &&
            length === expectedBody.length &&
            Buffer.concat(chunks).equals(expectedBody);
          response.writeHead(validReceipt ? 200 : 400, { "Content-Type": "application/json" });
          response.end(
            validReceipt ? JSON.stringify(body) : '{"code":"UPLOAD_EMPTY","error":"Choose a nonempty MP3 file."}',
          );
        });
        return;
      }
      request.resume();
      if (request.url === "/") {
        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        response.end(
          '<!doctype html><title>Owned production UI control</title><link rel="icon" href="/icon.svg">' +
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
globalThis.fixtureState = { selected: 0, clicked: 0, completed: 0 };
input.addEventListener('change', () => { globalThis.fixtureState.selected += 1; });
button.addEventListener('click', async () => {
  globalThis.fixtureState.clicked += 1;
  const response = await fetch(${JSON.stringify(uploadPath)}, {
    method: 'POST', headers: { 'Content-Type': 'audio/mpeg' }, body: input.files[0]
  });
  const value = await response.json();
  status.textContent = value.frameCount + ' frames';
  globalThis.fixtureState.completed += 1;
});
`);
      } else if (request.url === "/icon.svg") {
        response.writeHead(200, { "Content-Type": "image/svg+xml" });
        response.end('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>');
      } else {
        fixtureFault = true;
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
      lease = await openHostedBrowser(
        browser,
        createOwnedControlTarget(`http://127.0.0.1:${address.port}`, "production"),
        "desktop",
      );
      let returned = false;
      let consumerError: unknown;
      try {
        await callback({
          hostedBrowser: async (viewport) => {
            assert.equal(viewport, "desktop");
            leaseAcquisitions += 1;
            assert.equal(leaseAcquisitions, 1);
            return lease!;
          },
        });
        returned = true;
      } catch (error) {
        consumerError = error;
      }
      // Every counterpart completes and renders its upload before classification, including early assertion failures.
      await expect(lease.page.getByRole("status")).toHaveText("9 frames");
      assert.equal(leaseAcquisitions, 1);
      assert.equal(uploads, 1);
      assert.equal(completeUploads, 1);
      assert.equal(validReceipt, true);
      assert.equal(fixtureFault, false);
      assert.deepEqual(await lease.page.evaluate(() => (globalThis as any).fixtureState), {
        selected: 1,
        clicked: 1,
        completed: 1,
      });
      if (mode === "positive") {
        if (!returned) throw consumerError;
      } else {
        assert.equal(returned, false, "Production UI accepted the owned defect");
        assert.ok(intendedRefusal(consumerError, mode, body), "Production UI refused for an unrelated reason");
      }
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
      id: `production-ui-details-${mode}`,
      status: codes.size ? "failed" : "passed",
      cleanup,
      codes: [...codes],
    });
  }
  return rows;
}
