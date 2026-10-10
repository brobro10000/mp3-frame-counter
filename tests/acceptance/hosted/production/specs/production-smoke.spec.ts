/**
 * Three literal hosted-v1 production smoke cases consume only the fixed production wrapper's approved adapters.
 * Run with e2e:production after the external exact-candidate human gate; this suite cannot supply that approval.
 * Exercise one small known-count UI upload, real desktop docs interaction and the published specification. No large,
 * malformed, boundary, concurrency or outage upload is sent. Docs interaction expands documented schema only.
 * Missing/unusable behavior, adapter faults and cleanup latches fail; imports/discovery do not acquire a target.
 */
import assert from "node:assert/strict";
import { expect } from "@playwright/test";
import { assertFrameResponse } from "../../../lib/assertions.ts";
import { fixtureBytes } from "../../../lib/fixtures.ts";
import { createHostedTest } from "../../../lib/hosted-fixtures.ts";
import { checkHostedDocsBrowser, checkHostedServedSpec } from "../../../lib/hosted-docs.ts";

const test = createHostedTest("production");

test("HP-01 usable UI completes one small known-count upload", async ({ hostedBrowser }) => {
  const lease = await hostedBrowser("desktop");
  const { page, origin } = lease;
  await page.goto(origin);
  const input = page.locator('input[type="file"]');
  const button = page.getByRole("button", { name: "Analyze MP3", exact: true });
  await expect(input).toHaveAccessibleName(/\S/);
  await expect(button).toBeVisible();
  await input.setInputFiles({ name: "tone-cbr.mp3", mimeType: "audio/mpeg", buffer: fixtureBytes("tone-cbr") });
  const [response] = await Promise.all([
    page.waitForResponse((candidate) => new URL(candidate.url()).pathname === "/file-upload"),
    button.click(),
  ]);
  const request = response.request();
  assert.equal(new URL(response.url()).origin, origin);
  assert.equal(new URL(request.url()).origin, origin);
  assert.equal(request.method(), "POST");
  assert.equal(await request.headerValue("content-type"), "audio/mpeg");
  assert.deepEqual(request.postDataBuffer(), fixtureBytes("tone-cbr"));
  assertFrameResponse(
    {
      status: response.status(),
      headers: { "content-type": (await response.headerValue("content-type")) ?? undefined },
      body: await response.text(),
    },
    9,
  );
  await expect(page.getByRole("status").or(page.getByRole("alert")).filter({ hasText: /\b9\b/ })).toBeVisible();
  await expect(button).toBeEnabled();
  await expect(input).toBeEnabled();
  // The fixture closes this lease and inspects its final latch; an early clean snapshot is not completion evidence.
});

test("HP-02 production docs are genuinely rendered and usable", async ({ hostedBrowser, hostedHttp }) => {
  await checkHostedDocsBrowser(await hostedBrowser("desktop"), hostedHttp, "desktop");
});

test("HP-03 production specification remains available and correct", async ({ hostedHttp }) => {
  await checkHostedServedSpec(hostedHttp);
});
