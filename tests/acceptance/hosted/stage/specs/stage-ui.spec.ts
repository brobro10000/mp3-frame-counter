/**
 * Two hosted-v1 stage UI cases select frozen files and exercise the real public upload action in an owned browser.
 * Use the fixed e2e:stage wrapper. Imports only register cases; the fixture acquires the approved target at execution.
 * The lease handles authentication/confinement; these cases inspect only synthetic upload bytes and response semantics,
 * never credentials, contexts or routing. Assertions fail on unusable controls, wrong responses or failed recovery.
 * Automatic fixture cleanup drains callbacks and enforces the terminal latch even after the assertions have passed.
 */
import assert from "node:assert/strict";
import { expect, type Page, type Response } from "@playwright/test";
import { assertErrorResponse } from "../../../lib/assertions.ts";
import { fixtureBytes } from "../../../lib/fixtures.ts";
import { createHostedTest } from "../../../lib/hosted-fixtures.ts";
import { checkHostedExplicitUpload } from "../../../lib/hosted-ui.ts";
import { absentDetail, assertDetailedFrameResponse } from "../../../lib/backend-audio-contract.ts";

const test = createHostedTest("stage");

/** Select a named frozen synthetic file in the live control; missing controls or file selection errors reject. */
async function select(page: Page, id: string): Promise<void> {
  await page.locator('input[type="file"]').setInputFiles({
    name: `${id}.mp3`,
    mimeType: "audio/mpeg",
    buffer: fixtureBytes(id),
  });
}

/** Locate accessible status/error output without depending on product markup or reading implementation selectors. */
function accessibleMessage(page: Page) {
  return page.getByRole("status").or(page.getByRole("alert"));
}

/**
 * Click the exact action and await its real upload response. Verify approved origin, raw selected bytes and media;
 * return only the response's contract fields. A missing response, wrong request or browser failure rejects.
 */
async function submit(page: Page, origin: string, id: string) {
  const [response] = await Promise.all([
    page.waitForResponse((candidate: Response) => new URL(candidate.url()).pathname === "/file-upload"),
    page.getByRole("button", { name: "Analyze MP3", exact: true }).click(),
  ]);
  const request = response.request();
  assert.equal(new URL(response.url()).origin, origin);
  assert.equal(new URL(request.url()).origin, origin);
  assert.equal(request.method(), "POST");
  assert.deepEqual(new URL(request.url()).searchParams.getAll("details"), ["true"]);
  assert.equal(await request.headerValue("content-type"), "audio/mpeg");
  assert.deepEqual(request.postDataBuffer(), fixtureBytes(id));
  return {
    status: response.status(),
    headers: { "content-type": (await response.headerValue("content-type")) ?? undefined },
    body: await response.text(),
  };
}

test("HS-01 accessible UI completes a real small MP3 upload", async ({ hostedBrowser }) => {
  await checkHostedExplicitUpload(await hostedBrowser("desktop"));
});

test("HS-02 upload error permits a subsequent valid browser upload", async ({ hostedBrowser }) => {
  const lease = await hostedBrowser("desktop");
  const { page, origin } = lease;
  await page.goto(origin);
  const button = page.getByRole("button", { name: "Analyze MP3", exact: true });
  await expect(page.locator('input[type="file"]')).toHaveAccessibleName(/\S/);
  await select(page, "garbage");
  assertErrorResponse(await submit(page, origin, "garbage"), 400);
  await expect(
    accessibleMessage(page).filter({ hasText: /error|invalid|mpeg|unsupported|unable|failed/i }),
  ).toBeVisible();
  await expect(button).toBeEnabled();
  await expect(page.locator('input[type="file"]')).toBeEnabled();
  await select(page, "tone-cbr");
  assertDetailedFrameResponse(await submit(page, origin, "tone-cbr"), absentDetail(9));
  await expect(accessibleMessage(page).filter({ hasText: /\b9\b/ })).toBeVisible();
  await expect(button).toBeEnabled();
  await expect(page.locator('input[type="file"]')).toBeEnabled();
});
