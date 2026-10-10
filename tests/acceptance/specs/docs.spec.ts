/**
 * Additive public-origin docs-v1 cases. Existing target binding authorizes the requests; no product implementation
 * imports or fixture server are used. Browser helpers own fresh contexts and package-local screenshots; failures
 * propagate to the full mandatory inventory reporter. Execute only through the ordinary complete e2e launcher.
 */
import { test } from "@playwright/test";
import { target } from "../lib/target.ts";
import { checkPublicResponses, checkServedSpec } from "../lib/docs-contract.mjs";
import { checkDocsBrowser, assertBrowserResult, checkRootBrowser } from "../lib/docs-browser.mjs";

test("DC-01 public docs routes methods assets and policy ownership", async () => {
  await checkPublicResponses(target().base);
});
test("DC-02 served YAML preserves independent transport semantics and local references", async () => {
  await checkServedSpec(target().base);
});
for (const [name, viewport] of [
  ["desktop", { width: 1280, height: 900 }],
  ["narrow", { width: 390, height: 844 }],
] as const)
  test(`DC-03 ${name} actual Redoc response expansion under effective CSP`, async ({ browser }, info) => {
    const result = await checkDocsBrowser(browser, target().base, viewport, info.outputPath("docs.png"));
    await info.attach("docs-observation", { body: JSON.stringify(result, null, 2), contentType: "application/json" });
    assertBrowserResult(result);
  });
test("DC-04 upload page retains its original effective style protection", async ({ browser }) => {
  await checkRootBrowser(browser, target().base);
});
