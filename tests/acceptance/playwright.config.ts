/**
 * Independent Chromium acceptance configuration. No webServer/product import or success mock is configured.
 * Discovery works before a product exists; actual execution requires target() validation in the launcher/tests.
 * Fixed timeouts, no retries, no exclusive tests and the result reporter make failures/skips visible.
 */
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./specs",
  outputDir: "./.artifacts/playwright",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 120_000,
  globalTimeout: 600_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["./scripts/reporter.ts"]],
  use: { browserName: "chromium", serviceWorkers: "block", trace: "off", screenshot: "off", video: "off" },
});
