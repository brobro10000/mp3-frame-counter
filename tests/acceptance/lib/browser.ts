/**
 * Browser fixture enforcing same-origin network confinement before any fixture can leave the approved frontend.
 * Every real request is forwarded once with redirect following disabled, and its actual response is relayed unchanged.
 * Foreign origins and redirects abort and fail the case; service workers are disabled in configuration. This forwarding
 * guard does not invent successful responses. Page-level deliberate fault routes must use fallback for real traffic.
 * Inputs are target environment bindings; effects are real network requests and Chromium routing, with no disk writes.
 */
import assert from "node:assert/strict";
import { test as base } from "@playwright/test";
import { target } from "./target.ts";

export const test = base.extend({
  context: async ({ context }, use) => {
    const approved = target().base;
    const violations: string[] = [];
    await context.route("**/*", async (route) => {
      if (new URL(route.request().url()).origin !== approved) {
        violations.push("Browser attempted a foreign-origin request");
        await route.abort("blockedbyclient");
        return;
      }
      try {
        // Plain route.continue cannot enforce this: browser routing does not intercept every redirect-chain request.
        const response = await route.fetch({ maxRedirects: 0, timeout: 70_000 });
        if (response.status() >= 300 && response.status() < 400) {
          violations.push("Browser received a redirect response before following it");
          await route.abort("blockedbyclient");
          return;
        }
        await route.fulfill({ response });
      } catch {
        await route.abort("failed");
      }
    });
    try {
      await use(context);
    } finally {
      assert.deepEqual(violations, [], "Browser same-origin confinement failed");
    }
  },
});
