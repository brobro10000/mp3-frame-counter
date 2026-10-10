/**
 * Real docs/root browser predicates, invoked by public specs and owned controls. Inputs are an existing browser,
 * validated origin, viewport and package-local screenshot path. Creates a fresh context, preflights YAML references,
 * observes render/interaction through screenshot plus 200 ms, and rejects policy/errors/foreign attempts. Writes only
 * the requested screenshot; returns bounded evidence even on failure. Caller owns browser, this function closes context.
 * The optional boolean ownedRetainedProbe signals only owned late-fault fixtures after screenshot completion; public
 * specs omit it. It neither changes observations nor bypasses predicates or the retained interval.
 */
import { performance } from "node:perf_hooks";
import { observe } from "./docs-observer.mjs";
import {
  assertHeaders,
  ROOT_POLICY,
  DOCS_POLICY,
  parseYaml,
  assertSpec,
  requireThat,
  same,
  requestDocs,
  LOGO_HASH,
  sha256,
} from "./docs-contract.mjs";
import { within } from "./transport.ts";

export function assertObservation(record) {
  requireThat(!record.active && !record.overflow && !record.unexpectedClose, "OBSERVER_BOUNDARY");
  requireThat(!record.meta.length, "META_POLICY");
  requireThat(!record.errors.length, "PAGE_ERROR");
  requireThat(
    !record.issues.some((i) => !i.reportOnly) && !record.dom.some((i) => i.disposition === "enforce"),
    "CSP_VIOLATION",
  );
  requireThat(!record.console.length, "CONSOLE_ERROR");
}
export async function checkDocsBrowser(browser, origin, viewport, screenshot, ownedRetainedProbe = false) {
  requireThat(typeof ownedRetainedProbe === "boolean", "OWNED_PROBE_INPUT");
  const context = await browser.newContext({ viewport, serviceWorkers: "block" });
  let observer, page;
  const result = {
    kind: "docs-browser-observation",
    status: "failed",
    startedAt: new Date().toISOString(),
    viewport,
    failures: [],
  };
  const start = performance.now();
  result.startedMonotonicMs = start;
  const collect = (check) => {
    try {
      check();
    } catch (error) {
      result.failures.push(String(error.message).slice(0, 1000));
    }
  };
  try {
    page = await context.newPage();
    page.setDefaultTimeout(5000);
    observer = await observe(page, context, [origin], "docs");
    result.observation = observer.record;
    // The same validator used by DC-02 prevents remote reference resolution before page scripts can run.
    const specification = await requestDocs(origin, "/docs/openapi.yaml");
    same(specification.status, 200, "SPEC_STATUS");
    collect(() => assertHeaders(specification.headers));
    assertSpec(parseYaml(specification.body));
    result.references = "admitted-before-navigation";
    const response = await page.goto(origin + "/docs/", { timeout: 10000, waitUntil: "load" });
    same(response?.status(), 200, "DOCUMENT_STATUS");
    const headers = await response.headersArray();
    collect(() => assertHeaders(headers));
    const meta = await page
      .locator('meta[http-equiv="Content-Security-Policy" i],meta[http-equiv="Content-Security-Policy-Report-Only" i]')
      .count();
    collect(() => same(meta, 0, "META_POLICY"));
    const operation = page.locator('[data-section-id="operation/countFrames"]');
    await operation.waitFor({ state: "attached", timeout: 5000 });
    const text = await page.locator("body").innerText();
    for (const required of [
      "/file-upload",
      "/healthz",
      "audio/mpeg",
      "application/octet-stream",
      "frameCount",
      "20971520",
    ])
      requireThat(text.includes(required), "RENDERED_SPEC");
    const response400 = operation.getByRole("button", { name: /^400\b/ }).locator("..");
    result.before = await response400.innerText();
    same(await response400.getByText("error", { exact: true }).count(), 0, "INTERACTION_INITIAL");
    await response400.getByRole("button", { name: /^400\b/ }).click();
    try {
      await response400.getByText("error", { exact: true }).waitFor({ state: "visible", timeout: 3000 });
    } catch {
      throw Error("REAL_INTERACTION");
    }
    result.after = await response400.innerText();
    requireThat(
      result.after !== result.before && result.after.includes("required") && result.after.includes("string"),
      "REAL_INTERACTION",
    );
    const image = await page
      .locator("img")
      .evaluateAll((images) => images.map((i) => ({ src: i.src, complete: i.complete, width: i.naturalWidth })));
    requireThat(
      image.some((i) => i.src === origin + "/docs/assets/redoc-logo-mini.svg" && i.complete && i.width > 0),
      "LOGO_LOAD",
    );
    if (viewport.width > 1000) {
      const link = page.getByRole("link", { name: /API docs by Redocly/ });
      await link.waitFor({ state: "visible" });
    }
    const local = await requestDocs(origin, "/docs/assets/redoc-logo-mini.svg");
    same(local.status, 200, "LOGO_STATUS");
    same(sha256(local.body), LOGO_HASH, "LOGO_IDENTITY");
    same((await page.locator("style").count()) <= 30, true, "STYLE_BOUND");
    result.styles = await page.locator("style").evaluateAll((nodes) =>
      nodes.slice(0, 30).map((s) => ({
        text: s.textContent.slice(0, 20000),
        truncated: s.textContent.length > 20000,
        available: Boolean(s.sheet),
        rules: s.sheet?.cssRules.length ?? 0,
      })),
    );
    collect(() =>
      requireThat(
        result.styles.every((s) => !s.truncated),
        "STYLE_BOUND",
      ),
    );
    collect(() =>
      same(
        result.styles.map((s) => sha256(s.text)),
        [
          "40c220f9ba639b725d125277f3c29891ed358b39545b452834e78a8e93317607",
          "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        ],
        "STYLE_IDENTITIES",
      ),
    );
    collect(() =>
      requireThat(
        result.styles.every((s) => s.available && s.rules > 0),
        "STYLE_RULES",
      ),
    );
  } catch (error) {
    result.failures.push(String(error.message).slice(0, 1000));
  } finally {
    try {
      if (page && observer) {
        await within(page.screenshot({ path: screenshot }), 5000, "SCREENSHOT_DEADLINE");
        result.screenshotFinishedMs = performance.now() - start;
        if (ownedRetainedProbe)
          await within(
            page.evaluate(() => document.dispatchEvent(new Event("docs-control-retained-window"))),
            1000,
            "OWNED_PROBE_SIGNAL",
          );
        await new Promise((resolve) => setTimeout(resolve, 200));
        const finalMeta = await page.locator('meta[http-equiv*="Content-Security-Policy" i]').count();
        collect(() => same(finalMeta, 0, "META_POLICY"));
        await within(observer.assertAlive(), 1000, "OBSERVER_LIVENESS");
        observer.end();
        result.classificationMs = performance.now() - start;
        result.foreign = observer.record.requests.filter(
          (r) => !(r.type === "Image" && r.url.startsWith("data:image/")) && new URL(r.url).origin !== origin,
        );
        collect(() => requireThat(result.foreign.length === 0, "FOREIGN_ATTEMPT"));
        collect(() => assertObservation(observer.record));
        if (result.references === "admitted-before-navigation")
          collect(() =>
            requireThat(
              observer.record.requests.some((r) => r.url === origin + "/docs/assets/redoc.js"),
              "RENDERER_REQUEST",
            ),
          );
      }
    } catch (error) {
      result.failures.push(String(error.message).slice(0, 1000));
    }
    observer?.end();
    try {
      await within(context.close(), 5000, "CONTEXT_CLEANUP");
      result.cleanup = "confirmed";
    } catch (error) {
      result.cleanup = "unverified";
      result.failures.push(error.message);
    }
    result.status = result.failures.length ? "failed" : "passed";
  }
  result.finishedAt = new Date().toISOString();
  return result;
}
export function assertBrowserResult(result) {
  same(result.cleanup, "confirmed", "BROWSER_CLEANUP");
  same(result.status, "passed", result.failures.join(";"));
}
export async function checkRootBrowser(browser, origin) {
  const response = await requestDocs(origin, "/");
  assertHeaders(response.headers, ROOT_POLICY, "ROOT");
  const context = await browser.newContext({ serviceWorkers: "block" });
  let observer;
  try {
    const page = await context.newPage();
    observer = await observe(page, context, [origin], "root");
    const response = await page.goto(origin + "/", { timeout: 10000, waitUntil: "load" });
    assertHeaders(await response.headersArray(), ROOT_POLICY, "ROOT");
    same(await page.locator('meta[http-equiv*="Content-Security-Policy" i]').count(), 0, "ROOT_META_POLICY");
    const result = await page.evaluate(() => {
      const style = document.createElement("style");
      document.head.append(style);
      if (style.sheet) style.sheet.insertRule("body{outline:1px solid red}");
      return Boolean(style.sheet);
    });
    await new Promise((resolve) => setTimeout(resolve, 200));
    await within(observer.assertAlive(), 1000, "ROOT_OBSERVER");
    observer.end();
    same(result, false, "ROOT_EMPTY_STYLE_ALLOWED");
    requireThat(
      observer.record.issues.some((i) => !i.reportOnly && i.directive === "style-src-elem"),
      "ROOT_CSP_ATTRIBUTION",
    );
    requireThat(!observer.record.errors.length, "ROOT_PAGE_ERROR");
    return observer.record;
  } finally {
    observer?.end();
    await within(context.close(), 5000, "ROOT_CLEANUP");
  }
}
