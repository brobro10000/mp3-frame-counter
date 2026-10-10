/**
 * External AC-01–AC-12 contract tests against the controller's explicit local/candidate target. Run with npm run e2e;
 * npm run check only discovers these cases. Fixtures and expectations are independent of product implementation.
 * Sends real uploads, opens Chromium, and temporarily stops/pauses the authorized nonproduction API through its
 * isolated controller. finally blocks restore service state; assertions, network faults and missing inputs fail.
 */
import assert from "node:assert/strict";
import { expect, type Page } from "@playwright/test";
import { test } from "../lib/browser.ts";
import { assertErrorResponse, assertFrameResponse, assertJson } from "../lib/assertions.ts";
import { fixture, fixtureBytes, manifest } from "../lib/fixtures.ts";
import { abortUpload, rawRequest } from "../lib/http.ts";
import { target } from "../lib/target.ts";

let destination: ReturnType<typeof target>;
test.beforeAll(() => {
  destination = target();
});

function upload(id: string, contentType = "audio/mpeg", extraHeaders: Record<string, string> = {}) {
  return rawRequest(`${destination.base}/file-upload`, {
    method: "POST",
    headers: { "Content-Type": contentType, ...extraHeaders },
    body: fixtureBytes(id),
  });
}

async function select(page: Page, id: string) {
  await page.locator('input[type="file"]').setInputFiles({
    name: `${id}.mp3`,
    mimeType: "audio/mpeg",
    buffer: fixtureBytes(id),
  });
}

function accessibleMessage(page: Page) {
  return page.getByRole("status").or(page.getByRole("alert"));
}

async function expectCount(page: Page, count: number) {
  await expect(accessibleMessage(page).filter({ hasText: new RegExp(`\\b${count}\\b`) })).toBeVisible();
}

async function control(action: "stop" | "start" | "pause" | "resume") {
  const response = await rawRequest(`${destination.control}/${action}`, {
    method: "POST",
    timeout: 60_000,
    headers: { "X-Acceptance-Control-Token": process.env.ACCEPTANCE_FAULT_TOKEN! },
  });
  expect(response.status).toBe(200);
}

async function healthy() {
  await expect
    .poll(
      async () => {
        try {
          return (await rawRequest(`${destination.api}/healthz`, { timeout: 3000 })).status;
        } catch {
          return 0;
        }
      },
      { timeout: 60_000, intervals: [100, 250, 500, 1000] },
    )
    .toBe(200);
}

test("AC-01 accessible upload controls and explicit action", async ({ page }) => {
  let submissions = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/file-upload") submissions += 1;
  });
  await page.goto(destination.base);
  await expect(page.locator('input[type="file"]')).toHaveAccessibleName(/\S/);
  await expect(page.getByRole("button", { name: "Analyze MP3", exact: true })).toBeVisible();
  expect(await accessibleMessage(page).count()).toBeGreaterThan(0);
  await select(page, "tone-cbr");
  expect(submissions).toBe(0);
});

for (const id of ["tone-cbr", "tone-vbr", "tone-padded"]) {
  for (const mime of ["audio/mpeg", "application/octet-stream"]) {
    test(`AC-02 ${id} exact independent count with ${mime}`, async () => {
      assertFrameResponse(await upload(id, mime), fixture(id).frameCount!);
    });
  }
}

test("AC-02 MIME case/parameters, identity encoding and irrelevant extension", async ({ page }) => {
  assertFrameResponse(await upload("tone-cbr", "AuDiO/MpEg; charset=binary", { "Content-Encoding": "identity" }), 9);
  await page.goto(destination.base);
  await page.locator('input[type="file"]').setInputFiles({
    name: "valid-audio.bin",
    mimeType: "application/octet-stream",
    buffer: fixtureBytes("tone-padded"),
  });
  await page.getByRole("button", { name: "Analyze MP3", exact: true }).click();
  await expectCount(page, 21);
});

test("AC-03 real browser file upload traverses the public frontend", async ({ page }) => {
  await page.goto(destination.base);
  await select(page, "tone-vbr");
  const responsePromise = page.waitForResponse((response) => new URL(response.url()).pathname === "/file-upload");
  await page.getByRole("button", { name: "Analyze MP3", exact: true }).click();
  const response = await responsePromise;
  const request = response.request();
  expect(new URL(request.url()).origin).toBe(destination.base);
  expect(request.method()).toBe("POST");
  expect(request.headers()["content-type"]).toBe("audio/mpeg");
  assert.deepEqual(request.postDataBuffer(), fixtureBytes("tone-vbr"));
  assertFrameResponse({ status: response.status(), headers: response.headers(), body: await response.text() }, 16);
  await expectCount(page, 16);
});

for (const id of [
  "one-frame",
  "three-frames",
  "variable-parameters",
  "payload-sync",
  "id3v23",
  "id3v24",
  "id3-large-padding",
  "id3v1",
  "both-tags",
  "xing-physical",
]) {
  test(`AC-04 physical framing ${id}`, async () => {
    assertFrameResponse(await upload(id), fixture(id).frameCount!);
  });
}

for (const entry of manifest.fixtures.filter((entry) => entry.kind === "malformed")) {
  test(`AC-05 malformed ${entry.id} is 400 without partial count`, async () => {
    assertErrorResponse(await upload(entry.id), 400);
  });
}

for (const entry of manifest.fixtures.filter((entry) => entry.kind === "unsupported")) {
  test(`AC-06 unsupported ${entry.id} is 415`, async () => {
    assertErrorResponse(await upload(entry.id), 415);
  });
}

test("AC-06 unsupported and absent MIME plus unsupported encoding are isolated 415 errors", async () => {
  assertErrorResponse(await upload("tone-cbr", "text/plain"), 415);
  assertErrorResponse(
    await rawRequest(`${destination.base}/file-upload`, {
      method: "POST",
      body: fixtureBytes("tone-cbr"),
    }),
    415,
  );
  assertErrorResponse(await upload("tone-cbr", "audio/mpeg", { "Content-Encoding": "gzip" }), 415);
});

for (const id of ["above-one-mib", "six-mib"]) {
  test(`AC-07 complete ingress accepts ${id}`, async () => {
    assertFrameResponse(await upload(id), fixture(id).frameCount!);
  });
}

test("AC-08 exact 20 MiB succeeds and one byte over returns readable 413", async () => {
  assertFrameResponse(await upload("exact-limit"), 54_613);
  assertErrorResponse(await upload("over-limit"), 413);
  assertFrameResponse(await upload("tone-cbr"), 9);
});

test("AC-09 actual-byte limit on a chunked body without Content-Length", async () => {
  const response = await rawRequest(`${destination.base}/file-upload`, {
    method: "POST",
    headers: { "Content-Type": "audio/mpeg" },
    body: fixtureBytes("over-limit"),
    chunked: true,
  });
  expect(response.contentLengthSent).toBe(false);
  expect(response.transferEncoding).toBe("chunked");
  expect(response.sentBytes).toBe(20_971_521);
  assertErrorResponse(response, 413);
  assertFrameResponse(await upload("tone-vbr"), 16);
});

test("AC-09 valid chunked body remains accepted without Content-Length", async () => {
  const response = await rawRequest(`${destination.base}/file-upload`, {
    method: "POST",
    headers: { "Content-Type": "audio/mpeg" },
    body: fixtureBytes("tone-padded"),
    chunked: true,
  });
  expect(response.contentLengthSent).toBe(false);
  assertFrameResponse(response, 21);
});

test("AC-10 both service-local health paths and API routes/methods", async () => {
  for (const origin of [destination.base, destination.api]) {
    const response = await rawRequest(`${origin}/healthz`);
    expect(response.status).toBe(200);
    assert.deepEqual(assertJson(response), { status: "ok" });
  }
  assertErrorResponse(await rawRequest(`${destination.api}/unknown-api-route`), 404);
  for (const method of ["GET", "PUT", "OPTIONS"]) {
    const response = await rawRequest(`${destination.base}/file-upload`, { method });
    assertErrorResponse(response, 405);
    expect(response.headers.allow).toBe("POST");
  }
  const healthMethod = await rawRequest(`${destination.api}/healthz`, { method: "POST" });
  assertErrorResponse(healthMethod, 405);
  expect(healthMethod.headers.allow).toBe("GET");
  for (const [url, allow] of [
    [`${destination.base}/file-upload`, "POST"],
    [`${destination.api}/healthz`, "GET"],
  ]) {
    const response = await rawRequest(url, { method: "HEAD" });
    expect(response.status).toBe(405);
    expect(response.headers.allow).toBe(allow);
    expect(response.headers["content-type"]).toMatch(/^application\/json/);
    expect(response.body).toBe("");
  }
  assertFrameResponse(
    await rawRequest(`${destination.base}/file-upload?source=acceptance`, {
      method: "POST",
      headers: { "Content-Type": "audio/mpeg" },
      body: fixtureBytes("tone-cbr"),
    }),
    9,
  );
});

test("AC-11 pending state prevents duplicates and later input retries after API error", async ({ page }) => {
  await page.goto(destination.base);
  let release!: () => void;
  let intercepted!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const seen = new Promise<void>((resolve) => {
    intercepted = resolve;
  });
  let submissions = 0;
  await page.route("**/file-upload", async (route) => {
    submissions += 1;
    intercepted();
    await held;
    await route.fallback(); // Continue through the same-origin guard, preserving the real request/response.
  });
  await select(page, "tone-cbr");
  const button = page.getByRole("button", { name: "Analyze MP3", exact: true });
  await button.click();
  try {
    await seen;
    await expect(button).toBeDisabled();
    await expect(accessibleMessage(page).filter({ hasText: /analyz|upload|pending|process/i })).toBeVisible();
    await button.evaluate((element: HTMLButtonElement) => element.click());
    expect(submissions).toBe(1);
  } finally {
    release();
  }
  await expectCount(page, 9);
  expect(submissions).toBe(1);
  await page.unroute("**/file-upload");
  await expect(button).toBeEnabled();
  await select(page, "garbage");
  await button.click();
  await expect(
    accessibleMessage(page).filter({ hasText: /error|invalid|mpeg|unsupported|unable|failed/i }),
  ).toBeVisible();
  await expect(button).toBeEnabled();
  await select(page, "tone-padded");
  await button.click();
  await expectCount(page, 21);
});

test("AC-11 non-JSON/network errors recover and error text never becomes markup", async ({ page }) => {
  await page.goto(destination.base);
  const button = page.getByRole("button", { name: "Analyze MP3", exact: true });
  for (const mode of ["non-json", "network", "markup"] as const) {
    await page.route("**/file-upload", async (route) => {
      if (mode === "network") await route.abort("connectionreset");
      else if (mode === "non-json")
        await route.fulfill({ status: 502, contentType: "text/html", body: "<h1>Unavailable</h1>" });
      else
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            error: '<img src=x onerror="window.acceptanceInjected=true"> Invalid MP3',
          }),
        });
    });
    await select(page, "tone-cbr");
    await button.click();
    await expect(
      accessibleMessage(page).filter({ hasText: /error|invalid|unavailable|network|unable|failed/i }),
    ).toBeVisible();
    await expect(button).toBeEnabled();
    expect(await page.locator("img").count()).toBe(0);
    expect(
      await page.evaluate(() => (window as Window & { acceptanceInjected?: boolean }).acceptanceInjected),
    ).toBeUndefined();
    await page.unroute("**/file-upload");
    await select(page, "tone-vbr");
    await button.click();
    await expectCount(page, 16);
  }
});

test("AC-12 incomplete upload abort has no partial success and subsequent upload works", async () => {
  await abortUpload(`${destination.base}/file-upload`, fixtureBytes("three-frames"));
  await healthy();
  assertFrameResponse(await upload("tone-padded"), 21);
});

test("AC-12 controlled API outage yields 502 and real browser recovery", async ({ page }) => {
  await page.goto(destination.base);
  try {
    await control("stop");
    assertErrorResponse(await upload("tone-cbr"), 502);
    // Frontend health is intentionally service-local and remains healthy when its upstream is unavailable.
    expect((await rawRequest(`${destination.base}/healthz`)).status).toBe(200);
    await select(page, "tone-cbr");
    await page.getByRole("button", { name: "Analyze MP3", exact: true }).click();
    await expect(
      accessibleMessage(page).filter({ hasText: /error|unavailable|upstream|unable|failed/i }),
    ).toBeVisible();
  } finally {
    await control("start");
    await healthy();
  }
  await expect(page.getByRole("button", { name: "Analyze MP3", exact: true })).toBeEnabled();
  await select(page, "tone-vbr");
  await page.getByRole("button", { name: "Analyze MP3", exact: true }).click();
  await expectCount(page, 16);
});

test("AC-12 controlled API timeout yields 504 and subsequent upload works", async () => {
  try {
    await control("pause");
    assertErrorResponse(await upload("tone-cbr"), 504);
  } finally {
    await control("resume");
    await healthy();
  }
  assertFrameResponse(await upload("tone-cbr"), 9);
});
