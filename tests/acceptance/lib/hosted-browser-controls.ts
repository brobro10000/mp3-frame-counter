/**
 * Independent synthetic calibration for the real hosted browser/docs boundary. Call with a caller-owned pinned browser.
 * Starts only fresh numeric-loopback fixtures, uses the public control token and returns fixed control IDs/codes.
 * All owned pages/listeners close in finally; no provider/app calls, file artifacts, raw headers or errors are emitted.
 * The preserved earlier fetch/fulfill failure remains documented design evidence; this tests untouched CDP responses.
 */
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { once } from "node:events";
import type { Browser, Page, Response } from "@playwright/test";
import { createOwnedControlTarget, CONTROL_TOKEN } from "./hosted-control-target.ts";
import { createHostedHttp } from "./hosted-http.ts";
import { hostedFailure, hostedFailureCode } from "./hosted-target.ts";
import { docsFixture } from "./docs-fixture.mjs";
import { sha256 } from "./docs-contract.mjs";
import {
  openHostedBrowser,
  exerciseHostedBrowserFaultControl,
  exerciseOwnedConsoleCorrelation,
  exerciseOwnedMissingConsole,
  type HostedBrowserLease,
} from "./hosted-browser.ts";
import {
  checkHostedDocsBrowser,
  checkHostedDocsResponses,
  checkHostedRootPolicy,
  checkHostedServedSpec,
} from "./hosted-docs.ts";
import type { ControlRow, FailureCode, Finalization } from "./hosted-types.ts";

/** Give browser event delivery a bounded retained window; no condition-dependent polling or retry occurs. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 200));
/** Own the random loopback listener; caller retains responsibility even if startup rejects. */
async function listen(server: Server): Promise<string> {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return `http://127.0.0.1:${address.port}`;
}
/** Close only this owned listener and all its connections, treating any unacknowledged cleanup as failure. */
async function stop(server: Server): Promise<void> {
  server.closeAllConnections();
  await cleanup(new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))));
}
/** Require acknowledged owned cleanup within five seconds and propagate its separate, sanitized failure category. */
async function cleanup(operation: Promise<unknown>): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(hostedFailure("CLEANUP")), 5000);
      }),
    ]);
  } catch {
    throw hostedFailure("CLEANUP");
  } finally {
    clearTimeout(timer);
  }
}
/** Check resource cleanup independently from the intended semantic refusal being calibrated. */
function confirmed(finish: Finalization): void {
  if (finish.cleanup !== "passed") throw hostedFailure("CLEANUP");
}
/** Compare response bytes/status and duplicate security headers without retaining request credentials. */
async function responseIdentity(response: Response | null) {
  assert.ok(response);
  const headers = await response.headersArray();
  return {
    status: response.status(),
    body: sha256(await response.body()),
    csp: headers.filter((h) => h.name.toLowerCase() === "content-security-policy").map((h) => h.value),
    nosniff: headers.filter((h) => h.name.toLowerCase() === "x-content-type-options").map((h) => h.value),
    frame: headers.filter((h) => h.name.toLowerCase() === "x-frame-options").map((h) => h.value),
  };
}
/** Require actual cleanup and an exact fixed failure family; expected refusal never becomes application acceptance. */
function refused(finish: Finalization, code: FailureCode): void {
  assert.equal(finish.cleanup, "passed");
  assert.ok(finish.failures.includes(code));
}
/** Inspect only explicit booleans in the synthetic fixture, not arbitrary page text/headers. */
async function behavior(page: Page) {
  return page.evaluate(() => ({
    external: (globalThis as any).externalRan === true,
    inline: (globalThis as any).inlineRan === true,
    workerRegistered: (globalThis as any).workerRegistered === true,
  }));
}

/** Run complete owned browser controls sequentially; rows report safe failures and cleanup independently. */
export async function runHostedBrowserControls(browser: Browser): Promise<ControlRow[]> {
  const rows: ControlRow[] = [];
  const servers: Server[] = [];
  let foreignCount = 0,
    foreignToken = 0,
    upgrades = 0,
    workerRequests = 0,
    protectedCalls = 0;
  let observedExpectedHeader = 0,
    observedAuthorization = 0;
  let mixedPostReceipts = 0,
    mixedGetReceipts = 0;
  let origin = "",
    foreign = "";
  const security = ["default-src 'self'; script-src 'self'", "script-src 'none'; img-src 'none'; object-src 'none'"];
  const strictBody =
    '<!doctype html><title>Owned strict fixture</title><script src="/allowed.js"></script>' +
    "<script>globalThis.inlineRan=true</script>";

  /** Preserve each intended semantic failure independently, never serializing native exceptions or token values. */
  async function control(id: string, action: () => Promise<void>): Promise<void> {
    try {
      await action();
      rows.push({ id, status: "passed", cleanup: "passed", codes: [] });
    } catch (error) {
      const code = hostedFailureCode(error);
      rows.push({ id, status: "failed", cleanup: code === "CLEANUP" ? "failed" : "passed", codes: [code] });
    }
  }
  /** New owned lease for every destructive condition; always observe cleanup even when its predicate throws. */
  async function leaseCase(action: (lease: HostedBrowserLease) => Promise<void>): Promise<void> {
    const lease = await openHostedBrowser(browser, createOwnedControlTarget(origin), "desktop");
    try {
      await action(lease);
    } finally {
      confirmed(await lease.close());
    }
  }
  try {
    const sink = createServer((req, res) => {
      foreignCount++;
      if (req.headers["x-serverless-authorization"] === `Bearer ${CONTROL_TOKEN}`) foreignToken++;
      req.resume();
      res.writeHead(200, { "Content-Type": "text/html", "Access-Control-Allow-Origin": "*" });
      res.end("<!doctype html><title>Owned foreign sink</title>");
    });
    sink.on("upgrade", (_req, socket) => {
      upgrades++;
      socket.destroy();
    });
    servers.push(sink);
    foreign = await listen(sink);
    const server = createServer((req, res) => {
      req.resume();
      const path = new URL(req.url ?? "/", origin).pathname;
      if (req.headers["x-serverless-authorization"] === `Bearer ${CONTROL_TOKEN}`) observedExpectedHeader++;
      if (req.headers.authorization) observedAuthorization++;
      if (path === "/protected") {
        protectedCalls++;
        res.writeHead(req.headers["x-serverless-authorization"] === `Bearer ${CONTROL_TOKEN}` ? 200 : 401, {
          "Content-Type": "text/html",
        });
        res.end("<!doctype html><p>Protected fixture</p>");
        return;
      }
      if (path === "/redirect-same" || path === "/redirect-foreign") {
        res.writeHead(302, { Location: path === "/redirect-same" ? "/protected" : foreign + "/redirect-receiver" });
        res.end();
        return;
      }
      if (path === "/file-upload" || path === "/wrong-path") {
        if (req.method === "POST" && req.url === "/file-upload?correlation=post") mixedPostReceipts++;
        if (req.method === "GET" && req.url === "/file-upload?correlation=get") mixedGetReceipts++;
        const status = req.url?.includes("status=401") ? 401 : 400;
        const body = '{"error":"Owned malformed upload"}';
        if (req.url?.includes("reason=empty")) {
          // Node's ServerResponse supplies a default reason for an empty string. This owned HTTP fixture instead sends
          // an intact reasonless status line, letting Chromium/CDP expose the native console class without fulfillment.
          assert.ok(res.socket);
          res.socket.end(
            `HTTP/1.1 ${status} \r\nContent-Type: application/json\r\n` +
              `Content-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`,
          );
        } else {
          if (req.url?.includes("reason=near-miss"))
            res.writeHead(status, "Bad Request!", { "Content-Type": "application/json" });
          else res.writeHead(status, { "Content-Type": "application/json" });
          res.end(body);
        }
        return;
      }
      if (path === "/allowed.js") {
        res.writeHead(200, { "Content-Type": "application/javascript" });
        res.end("globalThis.externalRan=true");
        return;
      }
      if (path === "/sw.js") {
        workerRequests++;
        res.writeHead(200, { "Content-Type": "application/javascript" });
        res.end("self.addEventListener('fetch',()=>{})");
        return;
      }
      if (path === "/blank" || path === "/") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<!doctype html><title>Owned blank</title>");
        return;
      }
      if (path === "/teapot") {
        res.writeHead(418, { "Content-Type": "text/plain" });
        res.end("actual-teapot");
        return;
      }
      const policies = path === "/reverse" ? [...security].reverse() : security;
      res.writeHead(200, [
        "Content-Type",
        "text/html",
        "X-Content-Type-Options",
        "nosniff",
        "X-Content-Type-Options",
        "nosniff",
        "X-Frame-Options",
        "DENY",
        "X-Frame-Options",
        "DENY",
        ...(path === "/missing-csp" ? [] : policies.flatMap((value) => ["Content-Security-Policy", value])),
      ]);
      res.end(strictBody);
    });
    servers.push(server);
    origin = await listen(server);

    await control("browser-authenticated-header-replacement", () =>
      leaseCase(async (lease) => {
        await lease.page.goto(origin + "/blank");
        const before = observedExpectedHeader;
        const status = await lease.page.evaluate(
          async () =>
            (
              await fetch("/protected", {
                headers: { Authorization: "caller-untrusted", "X-Serverless-Authorization": "caller-untrusted" },
              })
            ).status,
        );
        assert.equal(status, 200);
        assert.equal(observedExpectedHeader, before + 1);
        assert.equal(observedAuthorization, 0);
        const finish = await lease.close();
        assert.deepEqual(finish, { cleanup: "passed", failures: [] });
      }),
    );
    await control("browser-absent-credential-positive-counterpart", async () => {
      const context = await browser.newContext();
      try {
        const page = await context.newPage();
        assert.equal((await page.goto(origin + "/protected"))?.status(), 401);
      } finally {
        await cleanup(context.close());
      }
    });
    for (const path of ["/strict", "/reverse"]) {
      await control("browser-untouched-security-headers" + path, () =>
        leaseCase(async (lease) => {
          const direct = await browser.newContext();
          try {
            const page = await direct.newPage();
            const original = await responseIdentity(await page.goto(origin + path));
            assert.deepEqual(original.csp, path === "/reverse" ? [...security].reverse() : security);
            assert.deepEqual(original.nosniff, ["nosniff", "nosniff"]);
            assert.deepEqual(original.frame, ["DENY", "DENY"]);
            assert.equal(original.body, sha256(strictBody));
            assert.deepEqual(await responseIdentity(await lease.page.goto(origin + path)), original);
            assert.deepEqual(await behavior(page), { external: false, inline: false, workerRegistered: false });
            assert.deepEqual(await behavior(lease.page), await behavior(page));
            refused(await lease.close(), "ASSERTION"); // Both effective policies forbid the fixture's deliberate scripts.
          } finally {
            await cleanup(direct.close());
          }
        }),
      );
    }
    await control("browser-missing-csp-negative-counterpart", async () => {
      const context = await browser.newContext();
      try {
        const page = await context.newPage();
        await page.goto(origin + "/missing-csp");
        assert.deepEqual(await behavior(page), { external: true, inline: true, workerRegistered: false });
      } finally {
        await cleanup(context.close());
      }
    });
    await control("browser-original-non-success-body", () =>
      leaseCase(async (lease) => {
        const identity = await responseIdentity(await lease.page.goto(origin + "/teapot"));
        assert.equal(identity.status, 418);
        assert.equal(identity.body, sha256("actual-teapot"));
      }),
    );
    for (const mode of ["navigation", "fetch"] as const)
      for (const path of ["/redirect-same", "/redirect-foreign"]) {
        await control(`browser-no-${mode}${path}`, () =>
          leaseCase(async (lease) => {
            const before = [foreignCount, foreignToken, protectedCalls];
            if (mode === "navigation") await assert.rejects(() => lease.page.goto(origin + path));
            else {
              await lease.page.goto(origin + "/blank");
              const failed = await lease.page.evaluate(async (path) => {
                try {
                  await fetch(path);
                  return false;
                } catch {
                  return true;
                }
              }, path);
              assert.equal(failed, true);
            }
            refused(await lease.close(), "REDIRECT");
            assert.deepEqual([foreignCount, foreignToken, protectedCalls], before);
          }),
        );
      }
    for (const mode of ["navigation", "fetch", "popup", "iframe"] as const) {
      await control("browser-foreign-" + mode, () =>
        leaseCase(async (lease) => {
          const before = [foreignCount, foreignToken];
          if (mode === "navigation") await assert.rejects(() => lease.page.goto(foreign + "/navigation"));
          else {
            await lease.page.goto(origin + "/blank");
            await lease.page.evaluate(
              async ({ mode, foreign }) => {
                if (mode === "fetch") {
                  try {
                    await fetch(foreign + "/fetch");
                  } catch {}
                }
                if (mode === "popup") window.open(foreign + "/popup");
                if (mode === "iframe") {
                  const frame = document.createElement("iframe");
                  frame.src = foreign + "/iframe";
                  document.body.append(frame);
                }
              },
              { mode, foreign },
            );
            await settle();
          }
          const finish = await lease.close();
          assert.ok(
            finish.failures.includes("FOREIGN_ATTEMPT") ||
              (mode === "popup" && finish.failures.includes("UNOWNED_PAGE")),
          );
          assert.deepEqual([foreignCount, foreignToken], before);
        }),
      );
    }
    await control("browser-unknown-popup-ownership", () =>
      leaseCase(async (lease) => {
        await lease.page.goto(origin + "/blank");
        const before = protectedCalls;
        await lease.page.evaluate(() => window.open("/protected"));
        await settle();
        refused(await lease.close(), "UNOWNED_PAGE");
        assert.equal(protectedCalls, before);
      }),
    );
    await control("browser-owned-same-origin-frame", () =>
      leaseCase(async (lease) => {
        await lease.page.goto(origin + "/blank");
        const before = protectedCalls;
        await lease.page.evaluate(() => {
          const frame = document.createElement("iframe");
          frame.src = "/protected";
          document.body.append(frame);
        });
        await lease.page.frameLocator("iframe").getByText("Protected fixture").waitFor();
        assert.equal(protectedCalls, before + 1);
        assert.deepEqual(await lease.close(), { cleanup: "passed", failures: [] });
      }),
    );
    for (const kind of ["service", "dedicated", "shared"] as const) {
      await control("browser-worker-refusal-" + kind, () =>
        leaseCase(async (lease) => {
          await lease.page.goto(origin + "/blank");
          const before = workerRequests;
          await lease.page.evaluate(async (kind) => {
            try {
              if (kind === "service") await navigator.serviceWorker.register("/sw.js");
              if (kind === "dedicated") new Worker("/sw.js");
              if (kind === "shared") new SharedWorker("/sw.js");
            } catch {}
          }, kind);
          await settle();
          refused(await lease.close(), "WORKER");
          assert.equal(workerRequests, before);
        }),
      );
    }
    await control("browser-service-worker-live-counterpart", async () => {
      const context = await browser.newContext({ serviceWorkers: "allow" });
      try {
        const page = await context.newPage();
        await page.goto(origin + "/blank");
        const before = workerRequests;
        const actual = await page.evaluate(async () => {
          const registration = await navigator.serviceWorker.register("/sw.js");
          const actual = Boolean(registration && registration.scope);
          await registration.unregister();
          return actual;
        });
        assert.equal(actual, true);
        assert.equal(workerRequests, before + 1);
      } finally {
        await cleanup(context.close());
      }
    });
    await control("browser-websocket-refusal", () =>
      leaseCase(async (lease) => {
        await lease.page.goto(origin + "/blank");
        const before = upgrades;
        await lease.page.evaluate(
          (url) => {
            const socket = new WebSocket(url);
            socket.onerror = () => {};
          },
          foreign.replace("http:", "ws:") + "/socket",
        );
        await settle();
        refused(await lease.close(), "WEBSOCKET");
        assert.equal(upgrades, before);
      }),
    );
    await control("browser-websocket-live-counterpart", async () => {
      const context = await browser.newContext();
      try {
        const page = await context.newPage();
        await page.goto(origin + "/blank");
        const before = upgrades;
        await page.evaluate(
          (url) =>
            new Promise<void>((resolve) => {
              const socket = new WebSocket(url);
              socket.onerror = () => resolve();
            }),
          foreign.replace("http:", "ws:") + "/socket",
        );
        assert.equal(upgrades, before + 1);
      } finally {
        await cleanup(context.close());
      }
    });
    for (const kind of ["actual400", "wrong-path", "wrong-status", "uncorrelated", "extra"] as const) {
      await control("browser-upload-console-" + kind, () =>
        leaseCase(async (lease) => {
          await lease.page.goto(origin + "/blank");
          await lease.page.evaluate(async (kind) => {
            if (kind !== "uncorrelated")
              await fetch(
                kind === "wrong-path"
                  ? "/wrong-path"
                  : kind === "wrong-status"
                    ? "/file-upload?status=401"
                    : "/file-upload",
                { method: "POST", body: "bad" },
              );
            if (kind === "uncorrelated" || kind === "extra")
              console.error("Failed to load resource: the server responded with a status of 400 (Bad Request)");
          }, kind);
          await settle();
          const finish = await lease.close();
          assert.ok(lease.observation().consoleErrors >= 1);
          if (kind === "actual400") assert.deepEqual(finish, { cleanup: "passed", failures: [] });
          else refused(finish, "ASSERTION");
        }),
      );
    }
    await control("browser-reasonless-native-counterpart", async () => {
      const context = await browser.newContext();
      try {
        const page = await context.newPage();
        const path = "/file-upload?reason=empty&case=native";
        const messages: { exact: boolean; location: boolean }[] = [];
        page.on("console", (message) => {
          if (message.type() === "error")
            messages.push({
              exact: message.text() === "Failed to load resource: the server responded with a status of 400 ()",
              location: message.location().url === origin + path,
            });
        });
        await page.goto(origin + "/blank");
        const actual = await page.evaluate(async (path) => {
          const response = await fetch(path, { method: "POST", body: "bad" });
          return {
            status: response.status,
            statusText: response.statusText,
            body: await response.text(),
            media: response.headers.get("content-type"),
          };
        }, path);
        await settle();
        assert.deepEqual(actual, {
          status: 400,
          statusText: "",
          body: '{"error":"Owned malformed upload"}',
          media: "application/json",
        });
        assert.deepEqual(messages, [{ exact: true, location: true }]);
      } finally {
        await cleanup(context.close());
      }
    });
    // These independently authored controls exercise native response/console delivery. Exact text is an assertion,
    // never a synthetic positive; every negative retains actual cleanup and the original finite matcher controls.
    for (const kind of [
      "actual400",
      "wrong-path",
      "wrong-status",
      "wrong-method",
      "near-miss",
      "uncorrelated",
      "extra",
    ] as const) {
      await control("browser-reasonless-console-" + kind, () =>
        leaseCase(async (lease) => {
          await lease.page.goto(origin + "/blank");
          const expected = "Failed to load resource: the server responded with a status of 400 ()";
          let exactConsole = 0;
          const observe = (message: import("@playwright/test").ConsoleMessage) => {
            if (message.type() === "error" && message.text() === expected) exactConsole++;
          };
          lease.page.on("console", observe);
          try {
            const result = await lease.page.evaluate(async (kind) => {
              let result: { status: number; statusText: string; body: string; media: string | null } | null = null;
              if (kind !== "uncorrelated") {
                const response = await fetch(
                  kind === "wrong-path"
                    ? "/wrong-path?reason=empty"
                    : kind === "wrong-status"
                      ? "/file-upload?reason=empty&status=401"
                      : kind === "near-miss"
                        ? "/file-upload?reason=near-miss"
                        : "/file-upload?reason=empty&case=" + kind,
                  kind === "wrong-method" ? { method: "GET" } : { method: "POST", body: "bad" },
                );
                result = {
                  status: response.status,
                  statusText: response.statusText,
                  body: await response.text(),
                  media: response.headers.get("content-type"),
                };
              }
              if (kind === "uncorrelated" || kind === "extra")
                console.error("Failed to load resource: the server responded with a status of 400 ()");
              return result;
            }, kind);
            await settle();
            const finish = await lease.close();
            if (result) {
              assert.equal(result.status, kind === "wrong-status" ? 401 : 400);
              assert.equal(result.body, '{"error":"Owned malformed upload"}');
              assert.equal(result.media, "application/json");
              assert.equal(result.statusText, kind === "near-miss" ? "Bad Request!" : "");
            }
            assert.equal(exactConsole, kind === "wrong-status" || kind === "near-miss" ? 0 : kind === "extra" ? 2 : 1);
            if (kind === "actual400") assert.deepEqual(finish, { cleanup: "passed", failures: [] });
            else refused(finish, "ASSERTION");
          } finally {
            lease.page.off("console", observe);
          }
        }),
      );
    }
    const urlA = "http://127.0.0.1:1/file-upload?case=a";
    const urlB = "http://127.0.0.1:1/file-upload?case=b";
    type MatchEvent = { kind: "response" | "console"; url: string; at: number };
    const matchControls: { id: string; events: MatchEvent[]; finishAt: number; pass: boolean }[] = [
      {
        id: "response-first",
        events: [
          { kind: "response", url: urlA, at: 0 },
          { kind: "console", url: urlA, at: 1 },
        ],
        finishAt: 2,
        pass: true,
      },
      {
        id: "console-first",
        events: [
          { kind: "console", url: urlA, at: 0 },
          { kind: "response", url: urlA, at: 1 },
        ],
        finishAt: 2,
        pass: true,
      },
      {
        id: "inclusive-window",
        events: [
          { kind: "response", url: urlA, at: 0 },
          { kind: "console", url: urlA, at: 5000 },
        ],
        finishAt: 5001,
        pass: true,
      },
      {
        id: "mixed-query",
        events: [
          { kind: "response", url: urlA, at: 0 },
          { kind: "console", url: urlB, at: 1 },
        ],
        finishAt: 2,
        pass: false,
      },
      {
        id: "stale-response",
        events: [
          { kind: "response", url: urlA, at: 0 },
          { kind: "console", url: urlA, at: 5001 },
        ],
        finishAt: 5002,
        pass: false,
      },
      {
        id: "stale-console",
        events: [
          { kind: "console", url: urlA, at: 0 },
          { kind: "response", url: urlA, at: 5001 },
        ],
        finishAt: 5002,
        pass: false,
      },
      {
        id: "extra-console",
        events: [
          { kind: "response", url: urlA, at: 0 },
          { kind: "console", url: urlA, at: 1 },
          { kind: "console", url: urlA, at: 2 },
        ],
        finishAt: 3,
        pass: false,
      },
      {
        id: "ambiguous-response",
        events: [
          { kind: "response", url: urlA, at: 0 },
          { kind: "response", url: urlA, at: 1 },
          { kind: "console", url: urlA, at: 2 },
        ],
        finishAt: 3,
        pass: false,
      },
      {
        id: "ambiguous-console",
        events: [
          { kind: "console", url: urlA, at: 0 },
          { kind: "console", url: urlA, at: 1 },
          { kind: "response", url: urlA, at: 2 },
        ],
        finishAt: 3,
        pass: false,
      },
      { id: "unused-response", events: [{ kind: "response", url: urlA, at: 0 }], finishAt: 5001, pass: true },
    ];
    for (const item of matchControls)
      await control("browser-console-correlation-" + item.id, async () => {
        const codes = exerciseOwnedConsoleCorrelation(item.events, item.finishAt);
        if (item.pass) assert.deepEqual(codes, []);
        else assert.ok(codes.includes("ASSERTION"));
      });
    await control("browser-console-correlation-actual-mixed-query", async () => {
      const before = [mixedPostReceipts, mixedGetReceipts];
      const result = await exerciseOwnedMissingConsole(browser, createOwnedControlTarget(origin));
      assert.equal(result.postStatus, 400);
      assert.equal(result.getStatus, 400);
      assert.equal(result.observedConsole, 2);
      assert.deepEqual([mixedPostReceipts, mixedGetReceipts], [before[0] + 1, before[1] + 1]);
      refused(result.finish, "ASSERTION");
    });
    await control("browser-bounded-observer-overflow", () =>
      leaseCase(async (lease) => {
        await lease.page.goto(origin + "/blank");
        await lease.page.evaluate(() => {
          for (let i = 0; i < 510; i++) console.error("owned overflow sentinel");
        });
        refused(await lease.close(), "OVERFLOW");
        assert.equal(lease.observation().overflow, true);
      }),
    );
    await control("browser-cancel-paused-during-cleanup", async () => {
      const before = observedExpectedHeader;
      const started = Date.now();
      const finish = await exerciseHostedBrowserFaultControl(
        browser,
        createOwnedControlTarget(origin),
        "cancel-paused",
      );
      assert.equal(finish.cleanup, "passed");
      assert.equal(finish.failures.includes("PAUSED_TIMEOUT"), false);
      assert.equal(observedExpectedHeader, before);
      assert.ok(Date.now() - started < 5000);
    });
    for (const fault of ["paused-deadline", "cdp", "cleanup", "late-callback"] as const) {
      await control("browser-real-latch-" + fault, async () => {
        const finish = await exerciseHostedBrowserFaultControl(browser, createOwnedControlTarget(origin), fault);
        if (fault === "cleanup") {
          assert.equal(finish.cleanup, "failed");
          assert.ok(finish.failures.includes("CLEANUP"));
        } else refused(finish, fault === "paused-deadline" ? "PAUSED_TIMEOUT" : "CDP");
      });
    }

    for (const fault of [
      "positive",
      "positive-narrow",
      "wrong-viewport",
      "root-positive",
      "root-policy-leak",
      "missing-renderer",
      "bad-style-hash",
      "foreign-script",
      "wrong-success",
      "missing-logo",
      "wrong-logo",
      "meta-policy",
      "late-meta",
      "late-error",
    ]) {
      await control("browser-docs-" + fault, async () => {
        const fixture = await docsFixture(
          ["positive-narrow", "root-positive", "wrong-viewport"].includes(fault) ? "positive" : fault,
        );
        let lease: HostedBrowserLease | undefined;
        const http = createHostedHttp(createOwnedControlTarget(fixture.origin));
        try {
          const viewport = fault === "positive-narrow" ? "narrow" : "desktop";
          lease = await openHostedBrowser(browser, createOwnedControlTarget(fixture.origin), viewport);
          if (fault === "late-meta" || fault === "late-error") {
            const screenshot = lease.page.screenshot.bind(lease.page);
            lease.page.screenshot = async (options) => {
              const bytes = await screenshot(options);
              await lease!.page.evaluate(() => document.dispatchEvent(new Event("docs-control-retained-window")));
              return bytes;
            };
          }
          const action = fault.startsWith("root-")
            ? () => checkHostedRootPolicy(lease!, http)
            : () => checkHostedDocsBrowser(lease!, http, fault === "wrong-viewport" ? "narrow" : viewport);
          if (["positive", "positive-narrow", "root-positive"].includes(fault)) {
            await checkHostedDocsResponses(http);
            await checkHostedServedSpec(http);
            await action();
          } else await assert.rejects(action, (error) => hostedFailureCode(error) === "ASSERTION");
          assert.equal(fixture.receipts.length, 0);
          if (fault === "late-meta") assert.ok(lease.observation().metaPolicies > 0);
          if (fault === "late-error") assert.ok(lease.observation().pageErrors > 0);
        } finally {
          const outcomes = await Promise.allSettled([
            lease ? lease.close().then(confirmed) : Promise.resolve(),
            http.close().then(confirmed),
            cleanup(fixture.close()),
          ]);
          if (outcomes.some((outcome) => outcome.status === "rejected")) throw hostedFailure("CLEANUP");
        }
      });
    }
    await control("browser-token-free-control-evidence", async () => {
      assert.equal(JSON.stringify(rows).includes(CONTROL_TOKEN), false);
      assert.equal(JSON.stringify(rows).toLowerCase().includes("x-serverless-authorization"), false);
    });
  } finally {
    const outcomes = await Promise.allSettled(servers.map(stop));
    if (outcomes.some((outcome) => outcome.status === "rejected"))
      rows.push({ id: "browser-fixture-cleanup", status: "failed", cleanup: "failed", codes: ["CLEANUP"] });
    else rows.push({ id: "browser-fixture-cleanup", status: "passed", cleanup: "passed", codes: [] });
  }
  return rows;
}
