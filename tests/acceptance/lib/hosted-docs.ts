import { checkBackendRedocExamples } from "./backend-audio-redoc.mjs";
/**
 * Hosted docs-v1 predicates through explicitly owned authenticated HTTP/browser adapters. No destination or credential
 * lookup occurs here. Pure frozen contract predicates remain unchanged; native failures become fixed ASSERTION codes.
 * Browser checks always close their lease and classify its terminal latch after cleanup, including late callbacks.
 */
import {
  assertArtifact,
  assertError,
  assertHeaders,
  assertMedia,
  assertSpec,
  DERIVED_HASH,
  headerValues,
  LOGO_HASH,
  parseYaml,
  requireThat,
  resources,
  ROOT_POLICY,
  same,
  sha256,
} from "./docs-contract.mjs";
import type { HostedHttp } from "./hosted-http.ts";
import { exerciseRootStyleRefusal, type HostedBrowserLease, type ViewportName } from "./hosted-browser.ts";
import { hostedFailure } from "./hosted-target.ts";

/** Exercise the complete frozen public route/HEAD/method/query/error matrix with the authenticated HTTP adapter. */
export async function checkHostedDocsResponses(http: HostedHttp): Promise<void> {
  try {
    const root = await http.docs("/");
    same(root.status, 200, "ROOT_STATUS");
    assertHeaders(root.headers, ROOT_POLICY, "ROOT");
    for (const method of ["GET", "HEAD"] as const) {
      const redir = await http.docs("/docs", method);
      same(redir.status, 308, "REDIRECT_STATUS");
      same(headerValues(redir.headers, "location"), ["/docs/"], "REDIRECT_LOCATION");
      assertHeaders(redir.headers);
      if (method === "HEAD") same(redir.body.length, 0, "HEAD_BODY");
      for (const [path, media] of resources) {
        const res = await http.docs(path, method);
        same(res.status, 200, "ROUTE_STATUS");
        assertHeaders(res.headers);
        assertMedia(res, media);
        if (method === "HEAD") same(res.body.length, 0, "HEAD_BODY");
        if (path.endsWith(".yaml"))
          same(
            headerValues(res.headers, "content-disposition"),
            ['attachment; filename="openapi.yaml"'],
            "YAML_DOWNLOAD",
          );
        if (method === "GET" && path.endsWith("/redoc.js")) assertArtifact(res.body, DERIVED_HASH);
        if (method === "GET" && path.endsWith(".svg")) assertArtifact(res.body, LOGO_HASH);
      }
      const missing = await http.docs("/docs/not-a-resource", method);
      assertHeaders(missing.headers);
      assertError(missing, 404, method === "HEAD");
    }
    for (const path of ["/docs", ...resources.map(([path]) => path)])
      for (const method of ["POST", "PUT", "PATCH", "OPTIONS", "DELETE"] as const) {
        const res = await http.docs(path, method);
        assertHeaders(res.headers);
        assertError(res, 405);
        same(headerValues(res.headers, "allow"), ["GET, HEAD"], "METHOD_ALLOW");
      }
    const missing = await http.docs("/docs/not-a-resource", "POST");
    assertError(missing, 404);
    assertHeaders(missing.headers);
    const query = await http.docs("/docs/?retained=1");
    same(query.status, 200, "QUERY_IDENTITY");
    assertHeaders(query.headers);
  } catch {
    throw hostedFailure("ASSERTION");
  }
}

/** Fetch only the fixed YAML route, apply its raw-header/download and strict semantic predicates, return admitted data. */
export async function checkHostedServedSpec(http: HostedHttp): Promise<unknown> {
  try {
    const res = await http.docs("/docs/openapi.yaml");
    same(res.status, 200, "SPEC_STATUS");
    assertHeaders(res.headers);
    assertMedia(res, "application/yaml");
    same(headerValues(res.headers, "content-disposition"), ['attachment; filename="openapi.yaml"'], "YAML_DOWNLOAD");
    const spec = parseYaml(res.body);
    assertSpec(spec);
    return spec;
  } catch {
    throw hostedFailure("ASSERTION");
  }
}

/** Bound a browser observation operation without persisting native Playwright errors or screenshot bytes. */
async function finite<T>(operation: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(hostedFailure("ASSERTION")), ms);
      }),
    ]);
  } catch {
    throw hostedFailure("ASSERTION");
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Require genuine docs rendering, exact local logo/style identities and a real 400-schema expansion at one fixed
 * viewport. Retain screenshot+200ms observation, then close and classify the lease; any partial check fails.
 */
export async function checkHostedDocsBrowser(
  lease: HostedBrowserLease,
  http: HostedHttp,
  viewport: ViewportName,
): Promise<void> {
  const page = lease.page;
  let failed = false;
  try {
    requireThat(viewport === "desktop" || viewport === "narrow", "VIEWPORT_NAME");
    same(
      page.viewportSize(),
      viewport === "desktop" ? { width: 1280, height: 900 } : { width: 390, height: 844 },
      "ACTUAL_VIEWPORT",
    );
    await checkHostedServedSpec(http); // Reject remote/incorrect references before executing the document.
    const response = await page.goto(lease.origin + "/docs/", { timeout: 10000, waitUntil: "load" });
    same(response?.status(), 200, "DOCUMENT_STATUS");
    assertHeaders(await response!.headersArray());
    same(await page.locator('meta[http-equiv*="Content-Security-Policy" i]').count(), 0, "META_POLICY");
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
    const before = await response400.innerText();
    same(await response400.getByText("error", { exact: true }).count(), 0, "INTERACTION_INITIAL");
    await response400.getByRole("button", { name: /^400\b/ }).click();
    await response400.getByText("error", { exact: true }).waitFor({ state: "visible", timeout: 3000 });
    const after = await response400.innerText();
    requireThat(after !== before && after.includes("required") && after.includes("string"), "REAL_INTERACTION");
    const sampledSpec = parseYaml((await http.docs("/docs/openapi.yaml")).body);
    await finite(checkBackendRedocExamples(page, sampledSpec), 15000);
    const images = await page.locator("img").evaluateAll((nodes) =>
      nodes.map((node) => {
        const i = node as HTMLImageElement;
        return {
          src: i.src,
          complete: i.complete,
          width: i.naturalWidth,
        };
      }),
    );
    requireThat(
      images.some((i) => i.src === lease.origin + "/docs/assets/redoc-logo-mini.svg" && i.complete && i.width > 0),
      "LOGO_LOAD",
    );
    if (viewport === "desktop")
      await page.getByRole("link", { name: /API docs by Redocly/ }).waitFor({ state: "visible" });
    const local = await http.docs("/docs/assets/redoc-logo-mini.svg");
    same(local.status, 200, "LOGO_STATUS");
    same(sha256(local.body), LOGO_HASH, "LOGO_IDENTITY");
    requireThat((await page.locator("style").count()) <= 30, "STYLE_BOUND");
    const styles = await page.locator("style").evaluateAll((nodes) =>
      nodes.slice(0, 30).map((node) => {
        const s = node as HTMLStyleElement;
        return {
          text: (s.textContent ?? "").slice(0, 20000),
          truncated: (s.textContent ?? "").length > 20000,
          available: Boolean(s.sheet),
          rules: s.sheet?.cssRules.length ?? 0,
        };
      }),
    );
    requireThat(
      styles.every((s) => !s.truncated),
      "STYLE_BOUND",
    );
    same(
      styles.map((s) => sha256(s.text)),
      [
        "40c220f9ba639b725d125277f3c29891ed358b39545b452834e78a8e93317607",
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      ],
      "STYLE_IDENTITIES",
    );
    requireThat(
      styles.every((s) => s.available && s.rules > 0),
      "STYLE_RULES",
    );
  } catch {
    failed = true;
  } finally {
    try {
      await finite(page.screenshot(), 5000); // Intentionally discard bytes, never write a screenshot artifact.
      await new Promise((resolve) => setTimeout(resolve, 200));
      same(await finite(page.locator('meta[http-equiv*="Content-Security-Policy" i]').count(), 1000), 0, "META_POLICY");
      lease.assertClean();
    } catch {
      failed = true;
    }
    const finalization = await lease.close();
    const observation = lease.observation();
    if (
      finalization.cleanup !== "passed" ||
      finalization.failures.length ||
      observation.active ||
      observation.overflow ||
      observation.unexpectedClose ||
      observation.metaPolicies ||
      observation.pageErrors ||
      observation.consoleErrors ||
      observation.foreignAttempts ||
      !observation.rendererRequested ||
      observation.csp.some((event) => event.enforced)
    )
      failed = true;
  }
  if (failed) throw hostedFailure("ASSERTION");
}

/** Verify root raw headers and the fixed effective inline-style refusal, then classify after actual lease cleanup. */
export async function checkHostedRootPolicy(lease: HostedBrowserLease, http: HostedHttp): Promise<void> {
  let failed = false;
  try {
    const root = await http.docs("/");
    same(root.status, 200, "ROOT_STATUS");
    assertHeaders(root.headers, ROOT_POLICY, "ROOT");
    const response = await lease.page.goto(lease.origin + "/", { timeout: 10000, waitUntil: "load" });
    same(response?.status(), 200, "ROOT_STATUS");
    assertHeaders(await response!.headersArray(), ROOT_POLICY, "ROOT");
    same(await lease.page.locator('meta[http-equiv*="Content-Security-Policy" i]').count(), 0, "META_POLICY");
    await exerciseRootStyleRefusal(lease);
  } catch {
    failed = true;
  } finally {
    const finish = await lease.close();
    const observed = lease.observation();
    if (
      finish.cleanup !== "passed" ||
      finish.failures.length ||
      observed.active ||
      observed.overflow ||
      observed.unexpectedClose ||
      observed.metaPolicies ||
      observed.pageErrors ||
      observed.consoleErrors ||
      observed.foreignAttempts ||
      !observed.csp.length ||
      observed.csp.some((event) => event.directive !== "style-src-elem" || !event.enforced)
    )
      failed = true;
  }
  if (failed) throw hostedFailure("ASSERTION");
}
