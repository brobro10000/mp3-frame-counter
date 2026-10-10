/** Fixed non-destructive production smoke inventory; this configuration grants no deployment or human authority. */
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./hosted/production/specs",
  testMatch: "**/*.spec.ts",
  outputDir: "./.artifacts/hosted-production",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 120000,
  globalTimeout: 900000,
  expect: { timeout: 15000 },
  reporter: [["./scripts/hosted-reporter.ts", { profile: "production" }]],
  use: { browserName: "chromium", serviceWorkers: "block", trace: "off", screenshot: "off", video: "off" },
});
