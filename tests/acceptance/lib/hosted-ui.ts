/**
 * Shared complete HS-01 predicate for the real stage lease and owned UI controls. Receives one already-authorized
 * browser lease, selects frozen CBR bytes and observes 500 ms without invoking the action before one real upload.
 * This finite absence observation does not establish causality for arbitrarily delayed uploads. No target/credential
 * input, context, routing or disk artifact is exposed. Request/body/count/control mismatches throw; the caller retains
 * lease cleanup and final-latch ownership. Imports have no browser, target or environment side effects.
 */
import assert from "node:assert/strict";
import { expect, type Request } from "@playwright/test";
import { assertFrameResponse } from "./assertions.ts";
import { fixtureBytes } from "./fixtures.ts";
import type { HostedBrowserLease } from "./hosted-browser.ts";

/** Run the exact HS-01 selection/action checks with a continuously retained attempt listener and fixed 500 ms window. */
export async function checkHostedExplicitUpload(lease: HostedBrowserLease): Promise<void> {
  const { page, origin } = lease;
  let submissions = 0;
  const countSubmission = (request: Request) => {
    if (new URL(request.url()).pathname === "/file-upload") submissions += 1;
  };
  // Count attempts without retaining raw requests or replacing any lease observer; keep this through the final check.
  page.on("request", countSubmission);
  try {
    await page.goto(origin);
    const input = page.locator('input[type="file"]');
    const button = page.getByRole("button", { name: "Analyze MP3", exact: true });
    const message = page.getByRole("status").or(page.getByRole("alert"));
    await expect(input).toHaveAccessibleName(/\S/);
    await expect(button).toBeVisible();
    expect(await message.count()).toBeGreaterThan(0);
    await input.setInputFiles({ name: "tone-cbr.mp3", mimeType: "audio/mpeg", buffer: fixtureBytes("tone-cbr") });
    // Deliberately observe absence before the action; this is a fixed negative-observation window, not a success wait.
    await page.waitForTimeout(500);
    assert.equal(submissions, 0, "Selection-only upload attempt");
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
    await expect(message.filter({ hasText: /\b9\b/ })).toBeVisible();
    await expect(button).toBeEnabled();
    await expect(input).toBeEnabled();
    assert.equal(submissions, 1);
  } finally {
    page.off("request", countSubmission);
  }
}
