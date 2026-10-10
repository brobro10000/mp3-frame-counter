/**
 * Owned native HTTP guard calibration. Called by docs-controls with its pinned Chromium instance; starts two ephemeral
 * loopback servers and exercises direct/302/two-hop/live-beacon positive, CSP-only and guard-only paths. Requires real
 * receipts or attributed zero receipts, returns bounded evidence, and closes contexts/servers in finally. No remote
 * endpoint or product route is used, no responses are intercepted/rewritten, and this function does not own the browser.
 */
import assert from "node:assert/strict";
import http from "node:http";
import { performance } from "node:perf_hooks";
import { observe } from "./docs-observer.mjs";
export async function calibrateGuard(browser) {
  const result = {
    kind: "candidate-guard-controls",
    productAcceptance: false,
    contract: "docs-v1",
    startedAt: new Date().toISOString(),
    scenarios: [],
    planned: ["positive", "csp", "blocker"].flatMap((mode) =>
      ["direct", "redirect", "nested", "beacon"].map((kind) => mode + "-" + kind),
    ),
  };
  const receipts = [],
    redirects = [];
  let origin, sinkOrigin;
  function within(promise, ms, label) {
    let timer;
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(Error(label)), ms);
      }),
    ]).finally(() => clearTimeout(timer));
  }
  const sink = http.createServer((req, res) => {
    receipts.push({ url: req.url, method: req.method });
    req.resume();
    res.writeHead(200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    });
    res.end("owned destination receipt");
  });
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, origin);
    if (url.pathname.startsWith("/redirect/") || url.pathname.startsWith("/nested/")) {
      const token = url.pathname.split("/").at(-1);
      const location = url.pathname.startsWith("/nested/")
        ? origin + "/redirect/" + token
        : sinkOrigin + "/receipt/" + token;
      redirects.push({ url: url.href, location, status: 302 });
      res.writeHead(302, { Location: location, "Cache-Control": "no-store" });
      res.end();
      return;
    }
    const token = url.searchParams.get("token"),
      kind = url.searchParams.get("kind");
    if (url.pathname === "/cal.js") {
      const target = ["redirect", "nested"].includes(kind)
        ? origin + "/" + kind + "/" + token
        : sinkOrigin + "/receipt/" + token;
      res.writeHead(200, { "Content-Type": "application/javascript", "Cache-Control": "no-store" });
      res.end(
        `document.querySelector('button').onclick=()=>{${
          kind === "beacon"
            ? `window.beaconResult=navigator.sendBeacon(${JSON.stringify(target)},'owned');window.calDone=true;`
            : `fetch(${JSON.stringify(target)},{mode:'no-cors',cache:'no-store'}).catch(()=>{}).finally(()=>window.calDone=true);`
        }};window.calReady=true;`,
      );
      return;
    }
    const allow = url.searchParams.get("mode") === "csp" ? "" : " " + sinkOrigin;
    res.writeHead(200, {
      "Content-Type": "text/html",
      "Cache-Control": "no-store",
      "Content-Security-Policy": `default-src 'none'; script-src 'self'; connect-src 'self'${allow}; base-uri 'none'; object-src 'none'`,
    });
    res.end(
      `<!doctype html><html><body><button>Run owned probe</button><script src="/cal.js?token=${token}&kind=${kind}"></script></body></html>`,
    );
  });
  async function listen(target) {
    await within(
      new Promise((resolve, reject) => {
        target.once("error", reject);
        target.listen(0, "127.0.0.1", resolve);
      }),
      5000,
      "server readiness",
    );
    return "http://127.0.0.1:" + target.address().port;
  }
  async function close(target) {
    target.closeAllConnections();
    await within(new Promise((resolve) => target.close(resolve)), 5000, "server cleanup");
  }
  try {
    sinkOrigin = await listen(sink);
    origin = await listen(server);
    result.origins = { origin, sinkOrigin };
    result.browserVersion = browser.version();
    for (const mode of ["positive", "csp", "blocker"])
      for (const kind of ["direct", "redirect", "nested", "beacon"]) {
        const id = mode + "-" + kind,
          destination = sinkOrigin + "/receipt/" + id,
          started = performance.now();
        const record = { id, status: "failed", receipts: [] };
        result.scenarios.push(record);
        const context = await browser.newContext({ serviceWorkers: "block" });
        let observer;
        try {
          const page = await context.newPage();
          observer = await observe(page, context, mode === "blocker" ? [origin] : [origin, sinkOrigin], id);
          record.observation = observer.record;
          const cspAttributed = () => {
            const violations = [
              ...observer.record.issues.filter((v) => v.reportOnly === false),
              ...observer.record.dom.filter((v) => v.disposition === "enforce"),
            ];
            return violations.some(
              (v) =>
                v.directive === "connect-src" &&
                (v.blockedURL === destination ||
                  (["redirect", "nested"].includes(kind) &&
                    v.blockedURL === origin + "/" + kind + "/" + id &&
                    redirects.some((r) => r.location === destination) &&
                    observer.record.logs.some(
                      (l) =>
                        l.source === "security" &&
                        l.level === "error" &&
                        l.text.includes(destination) &&
                        l.text.includes("connect-src"),
                    ))),
            );
          };
          const blockAttributed = () =>
            observer.record.requests.some(
              (request) =>
                request.url === destination &&
                observer.record.failures.some(
                  (f) => f.requestId === request.requestId && f.blockedReason === "inspector",
                ),
            );
          await page.goto(origin + "/cal?mode=" + mode + "&kind=" + kind + "&token=" + id, { timeout: 5000 });
          await page.waitForFunction(() => window.calReady === true, {}, { timeout: 5000 });
          await page.getByRole("button", { name: "Run owned probe", exact: true }).click({ timeout: 5000 });
          await page.waitForFunction(() => window.calDone === true, {}, { timeout: 5000 });
          const deadline = performance.now() + 2000;
          while (performance.now() < deadline) {
            const ready =
              mode === "positive"
                ? receipts.some((r) => r.url === "/receipt/" + id)
                : mode === "csp"
                  ? cspAttributed()
                  : blockAttributed();
            if (ready) break;
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
          await new Promise((resolve) => setTimeout(resolve, 200));
          await within(observer.assertAlive(), 1000, "session alive check");
          observer.end();
          record.receipts = receipts.filter((r) => r.url === "/receipt/" + id);
          record.redirects = redirects.filter((r) => r.url.includes(id));
          if (mode === "positive")
            assert.equal(record.receipts.length, 1, "Native permitted destination receipt missing or duplicate");
          else {
            assert.equal(record.receipts.length, 0, "A denied request reached the owned destination");
            assert(mode === "csp" ? cspAttributed() : blockAttributed(), "Intended rejection attribution missing");
          }
          assert.equal(observer.record.errors.length, 0, "Probe produced a page error");
          record.status = "passed";
        } finally {
          observer?.end();
          await within(context.close(), 5000, "context cleanup");
          record.durationMs = Math.round(performance.now() - started);
          record.cleanup = "confirmed";
        }
      }
    assert.deepEqual(
      result.scenarios.map((s) => s.id),
      result.planned,
      "Full calibration inventory did not execute",
    );
    result.status = "passed";
  } catch (error) {
    result.status = "failed";
    result.failure = error.message;
  } finally {
    try {
      const outcomes = await Promise.allSettled([close(server), close(sink)]);
      const failed = outcomes.find((x) => x.status === "rejected");
      if (failed) throw failed.reason;
      result.cleanup = "confirmed";
    } catch (error) {
      result.cleanup = "unverified";
      result.cleanupError = error.message;
    }
    result.finishedAt = new Date().toISOString();
  }
  return result;
}
