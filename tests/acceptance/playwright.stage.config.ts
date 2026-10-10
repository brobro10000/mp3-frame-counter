/** Fixed full stage inventory; discovery is credential-free and execution uses only the hosted wrapper/fixtures. */
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./hosted/stage/specs",
  testMatch: "**/*.spec.ts",
  outputDir: "./.artifacts/hosted-stage",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 120000,
  globalTimeout: 900000,
  expect: { timeout: 15000 },
  reporter: [["./scripts/hosted-reporter.ts", { profile: "stage" }]],
  use: { browserName: "chromium", serviceWorkers: "block", trace: "off", screenshot: "off", video: "off" },
});
