/**
 * Credential-scoped Chromium lease for the hosted contract. Call with an issued target and a caller-owned browser.
 * Owns one page/context and bounded CDP callbacks, preserves original responses and returns only sanitized evidence.
 * Imports do no I/O; failures use fixed codes. Call close even after a failed assertion and reject its final latch.
 */
import type { Browser, BrowserContext, CDPSession, Page, Route } from "@playwright/test";
import { hostedFailure, hostedFailureCode, invocationHeaders } from "./hosted-target.ts";
import type { FailureCode, Finalization, HostedTarget } from "./hosted-types.ts";

export type ViewportName = "desktop" | "narrow";
export type BrowserObservation = Readonly<{
  active: boolean;
  overflow: boolean;
  unexpectedClose: boolean;
  metaPolicies: number;
  pageErrors: number;
  consoleErrors: number;
  foreignAttempts: number;
  rendererRequested: boolean;
  csp: readonly Readonly<{ directive: "style-src-elem" | "script-src-elem" | "other"; enforced: boolean }>[];
}>;
export interface HostedBrowserLease {
  readonly page: Page;
  readonly origin: string;
  observation(): BrowserObservation;
  assertClean(): void;
  close(): Promise<Finalization>;
}
type Fault = "paused-deadline" | "cancel-paused" | "cdp" | "cleanup" | "late-callback" | "missing-first-console";
type Paused = { timer: ReturnType<typeof setTimeout>; cancel: () => void };
type PrivateLease = { rootProbe: () => Promise<void> };
const leases = new WeakMap<HostedBrowserLease, PrivateLease>();
const DEADLINE = 5000;
const CAPACITY = 500;
const UPLOAD_ERROR_CLASS = "Failed to load resource: the server responded with a status of 400 (Bad Request)";
type CorrelationRecord = { at: number; timer?: ReturnType<typeof setTimeout> };

/**
 * Correlate only an eligible POST400 response with the fixed resource-status console class at the identical full URL.
 * Each observation is consumed once within five monotonic seconds; duplicate/ambiguous or expired console observations
 * fail. Playwright exposes no console request ID/method: this is finite matching, not native request-identity proof.
 * The private clock/timer options support only the fixed pure control seam below; runtime always uses real time.
 */
function uploadConsoleCorrelation(
  latch: (code: FailureCode) => void,
  now: () => number = () => performance.now(),
  timers = true,
) {
  const response = new Map<string, CorrelationRecord>();
  const console = new Map<string, CorrelationRecord>();
  let closed = false;
  /** Remove an observation and its owned timer without retaining any raw console text. */
  function remove(map: Map<string, CorrelationRecord>, key: string): void {
    clearTimeout(map.get(key)?.timer);
    map.delete(key);
  }
  /** Expired responses confer no allowance; an unmatched expired console event permanently fails the lease. */
  function expire(): void {
    for (const [key, entry] of response) if (now() - entry.at > DEADLINE) remove(response, key);
    for (const [key, entry] of console)
      if (now() - entry.at > DEADLINE) {
        latch("ASSERTION");
        remove(console, key);
      }
  }
  /** Insert one bounded observation or consume one unambiguous opposite observation; never accumulate credits. */
  function observe(kind: "response" | "console", url: string): void {
    if (closed) {
      latch("ASSERTION");
      return;
    }
    expire();
    const key = url + "\0" + UPLOAD_ERROR_CLASS;
    const own = kind === "response" ? response : console;
    const other = kind === "response" ? console : response;
    if (own.has(key)) {
      latch("ASSERTION");
      return;
    }
    if (other.has(key)) {
      remove(other, key);
      return;
    }
    if (response.size + console.size >= CAPACITY) {
      latch("OVERFLOW");
      return;
    }
    const entry: CorrelationRecord = { at: now() };
    own.set(key, entry);
    if (timers) {
      const tick = () => {
        expire();
        // Preserve an inclusive five-second boundary even if a timer fires exactly at its deadline.
        if (own.get(key) === entry) entry.timer = setTimeout(tick, 1);
      };
      entry.timer = setTimeout(tick, DEADLINE);
    }
  }
  return {
    response: (url: string) => observe("response", url),
    console: (url: string) => observe("console", url),
    /** Close after callback drainage; unmatched console rows fail and no observation survives cleanup. */
    finish() {
      expire();
      if (console.size) latch("ASSERTION");
      closed = true;
      for (const key of response.keys()) remove(response, key);
      for (const key of console.keys()) remove(console, key);
    },
  };
}

/**
 * Fixed synthetic-only matcher seam, with no live lease/credential access or runtime selector. Runs bounded monotonic
 * observations through the same matcher used above and returns only terminal codes. Its URLs are numeric loopback.
 */
export function exerciseOwnedConsoleCorrelation(
  events: readonly { kind: "response" | "console"; url: string; at: number }[],
  finishAt: number,
): readonly FailureCode[] {
  if (events.length > 20 || !Number.isFinite(finishAt) || finishAt < 0 || finishAt > 20000)
    throw hostedFailure("INPUT");
  let time = 0;
  const codes = new Set<FailureCode>();
  const matcher = uploadConsoleCorrelation(
    (code) => codes.add(code),
    () => time,
    false,
  );
  for (const event of events) {
    const url = new URL(event.url);
    if (
      !["response", "console"].includes(event.kind) ||
      !Number.isFinite(event.at) ||
      event.at < time ||
      event.at > finishAt ||
      url.origin !== "http://127.0.0.1:1" ||
      url.href !== event.url
    )
      throw hostedFailure("INPUT");
    time = event.at;
    matcher[event.kind](event.url);
  }
  time = finishAt;
  matcher.finish();
  return Object.freeze([...codes]);
}

/** Bound an owned operation, convert native errors to one fixed code and always clear its deadline timer. */
async function bounded<T>(operation: Promise<T>, code: FailureCode, ms = DEADLINE): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(hostedFailure(code)), ms);
      }),
    ]);
  } catch {
    throw hostedFailure(code);
  } finally {
    clearTimeout(timer);
  }
}

/** Return the ordinary lease; no caller-selectable origin, fault, logger or security exception is accepted. */
export async function openHostedBrowser(
  browser: Browser,
  target: HostedTarget,
  viewport: ViewportName,
): Promise<HostedBrowserLease> {
  return createLease(browser, target, viewport);
}

/**
 * Build the same guarded lease for runtime and fixed synthetic controls. The private fault option is never selected by
 * runtime input. Context/observer setup failures close the owned context before returning one sanitized failure.
 */
async function createLease(
  browser: Browser,
  target: HostedTarget,
  viewport: ViewportName,
  fault?: Fault,
): Promise<HostedBrowserLease> {
  const origin = target.publicInput.target.origin;
  invocationHeaders(target, origin, {}); // Validate issuance before allocating browser resources.
  if (viewport !== "desktop" && viewport !== "narrow") throw hostedFailure("INPUT");
  let context: BrowserContext | undefined;
  let page: Page;
  let cdp: CDPSession;
  let closing = false;
  let closed = false;
  let closePromise: Promise<Finalization> | undefined;
  const failures = new Set<FailureCode>();
  const callbacks = new Set<Promise<void>>();
  const paused = new Map<string, Paused>();
  const counts = { events: 0, meta: 0, page: 0, console: 0, foreign: 0 };
  const csp: { directive: "style-src-elem" | "script-src-elem" | "other"; enforced: boolean }[] = [];
  let rendererRequested = false;
  let unexpectedClose = false;
  let rootWindow = false;
  let rootUsed = false;
  let rootDom = 0;
  let rootAudit = 0;
  let rootConsole = 0;
  let faultUsed = false;
  const uploadConsole = uploadConsoleCorrelation(latch);

  /** Permanently retain a fixed code; no exception, request URL, header or page text enters the latch. */
  function latch(code: FailureCode): void {
    failures.add(code);
  }
  /** Bound all event observations, including ignored ordinary events, so overflow cannot silently lose evidence. */
  function event(): boolean {
    if (++counts.events > CAPACITY) {
      latch("OVERFLOW");
      return false;
    }
    return true;
  }
  /** Validate the exact private target identity before every credential-bearing hop. */
  function approved(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.origin === origin && !parsed.username && !parsed.password;
    } catch {
      return false;
    }
  }
  /** Retain a tracked callback through close; capacity/error failures are terminal and never emitted as raw text. */
  function track(operation: () => Promise<void>): void {
    if (callbacks.size >= CAPACITY) {
      latch("OVERFLOW");
      return;
    }
    const task = Promise.resolve()
      .then(operation)
      .catch((error) => latch(hostedFailureCode(error, "CDP")));
    callbacks.add(task);
    void task.then(() => callbacks.delete(task));
  }
  /** Route abort is itself observed; an unsuccessful block is not a successful credential-boundary check. */
  async function abort(route: Route): Promise<void> {
    try {
      await bounded(route.abort("blockedbyclient"), "CDP");
    } catch {
      latch("CDP");
    }
  }
  /** Map only a finite CSP directive/disposition, admitting the one fixed root probe while its own window is open. */
  function policyEvent(directive: unknown, enforced: boolean, channel: "dom" | "audit", inline: boolean): void {
    if (!event()) return;
    const name = directive === "style-src-elem" || directive === "script-src-elem" ? directive : "other";
    csp.push({ directive: name, enforced });
    if (rootWindow && enforced && name === "style-src-elem" && inline) {
      if (channel === "dom" && ++rootDom === 1) return;
      if (channel === "audit" && ++rootAudit === 1) return;
    }
    latch("ASSERTION");
  }
  /** Send only a fixed CDP operation; a refused command permanently fails the lease, with no native error output. */
  async function send(method: "Fetch.failRequest" | "Fetch.continueRequest" | "Fetch.continueResponse", data: any) {
    try {
      if (fault === "cdp" && !faultUsed && method === "Fetch.continueRequest") {
        faultUsed = true;
        throw hostedFailure("CDP");
      }
      await bounded(cdp.send(method, data), "CDP");
    } catch {
      latch("CDP");
      throw hostedFailure("CDP");
    }
  }
  /** Cancel a paused request using its real CDP ID; callers must retain the callback until the command settles. */
  async function cancel(id: string): Promise<void> {
    await send("Fetch.failRequest", { requestId: id, errorReason: "BlockedByClient" });
  }
  /** Sanitize an immutable observation; terminal status remains in close's separate finalization. */
  function observation(): BrowserObservation {
    return Object.freeze({
      active: !closed,
      overflow: failures.has("OVERFLOW"),
      unexpectedClose,
      metaPolicies: counts.meta,
      pageErrors: counts.page,
      consoleErrors: counts.console,
      foreignAttempts: counts.foreign,
      rendererRequested,
      csp: Object.freeze(csp.map((item) => Object.freeze({ ...item }))),
    });
  }
  /** Drain every owned callback after stopping admission, including callbacks that finish during context close. */
  async function close(): Promise<Finalization> {
    if (closePromise) return closePromise;
    closePromise = (async () => {
      closing = true;
      let cleanup: "passed" | "failed" = "passed";
      try {
        await bounded(
          (async () => {
            for (const item of paused.values()) item.cancel();
            // A stuck callback must not prevent actual context cleanup from beginning within this same bound.
            await Promise.all([
              context!.close(),
              (async () => {
                while (callbacks.size) await Promise.all([...callbacks]);
              })(),
            ]);
            // Include callbacks delivered during the acknowledged close before classifying the terminal latch.
            while (callbacks.size) await Promise.all([...callbacks]);
            if (fault === "cleanup") throw hostedFailure("CLEANUP");
          })(),
          "CLEANUP",
        );
      } catch {
        cleanup = "failed";
        latch("CLEANUP");
      } finally {
        uploadConsole.finish();
        for (const item of paused.values()) clearTimeout(item.timer);
        paused.clear();
        closed = true;
      }
      return Object.freeze({ cleanup, failures: Object.freeze([...failures]) });
    })();
    return closePromise;
  }

  try {
    context = await bounded(
      browser.newContext({
        viewport: viewport === "desktop" ? { width: 1280, height: 900 } : { width: 390, height: 844 },
        serviceWorkers: "block",
        acceptDownloads: false,
      }),
      "CLEANUP",
    );
    const owned = new WeakSet<Page>();
    await context.route("**/*", (route) => {
      track(async () => {
        if (!event()) {
          await abort(route);
          return;
        }
        if (closing) {
          await abort(route);
          return;
        }
        if (!approved(route.request().url())) {
          counts.foreign++;
          latch("FOREIGN_ATTEMPT");
          await abort(route);
          return;
        }
        let owner: Page;
        try {
          owner = route.request().frame().page();
        } catch {
          latch("UNOWNED_PAGE");
          await abort(route);
          return;
        }
        if (!owned.has(owner)) {
          latch("UNOWNED_PAGE");
          await abort(route);
          return;
        }
        await bounded(route.continue(), "CDP");
      });
    });
    await context.routeWebSocket("**/*", (socket) => {
      event();
      latch("WEBSOCKET");
      try {
        socket.close({ code: 1008, reason: "HOSTED_REFUSAL" });
      } catch {
        latch("CDP");
      }
    });
    context.on("page", (other) => {
      if (page && other !== page) {
        event();
        latch("UNOWNED_PAGE");
        track(() => other.close());
      }
    });
    context.on("serviceworker", () => {
      event();
      latch("WORKER");
    });
    await context.exposeBinding("__hostedPolicy", (_, value: unknown) => {
      if (!value || typeof value !== "object") {
        latch("OBSERVER");
        return;
      }
      const data = value as Record<string, unknown>;
      if (data.kind === "meta") {
        if (event()) counts.meta++;
        latch("ASSERTION");
      } else if (data.kind === "worker") {
        event();
        latch("WORKER");
      } else if (data.kind === "csp") policyEvent(data.directive, data.enforced === true, "dom", data.inline === true);
      else latch("OBSERVER");
    });
    await context.addInitScript(() => {
      const report = (data: unknown) => {
        void (globalThis as any).__hostedPolicy(data).catch(() => {});
      };
      addEventListener("securitypolicyviolation", (e) =>
        report({
          kind: "csp",
          directive: e.effectiveDirective,
          enforced: e.disposition === "enforce",
          inline: e.blockedURI === "inline",
        }),
      );
      const inspect = (node: Node) => {
        if (!(node instanceof Element)) return;
        for (const meta of node.matches("meta") ? [node] : [...node.querySelectorAll("meta")])
          if (/^content-security-policy(?:-report-only)?$/i.test((meta as HTMLMetaElement).httpEquiv))
            report({ kind: "meta" });
      };
      new MutationObserver((records) => {
        for (const record of records) {
          if (record.type === "attributes") inspect(record.target);
          else for (const node of record.addedNodes) inspect(node);
        }
      }).observe(document, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["http-equiv", "content"],
      });
      for (const name of ["Worker", "SharedWorker"] as const) {
        if (name in globalThis)
          Object.defineProperty(globalThis, name, {
            value: function () {
              report({ kind: "worker" });
              throw new Error("HOSTED_WORKER_REFUSAL");
            },
          });
      }
      if (navigator.serviceWorker) {
        const blocked = navigator.serviceWorker.register.bind(navigator.serviceWorker);
        navigator.serviceWorker.register = (...args) => {
          report({ kind: "worker" });
          return blocked(...args);
        };
      }
    });
    page = await bounded(context.newPage(), "CDP");
    owned.add(page);
    page.setDefaultTimeout(DEADLINE);
    page.setDefaultNavigationTimeout(10000);
    page.on("pageerror", () => {
      if (event()) counts.page++;
      latch("ASSERTION");
    });
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      if (!event()) return;
      // Inspect only transient text. A fixed inline-style refusal is the sole root-probe console exception.
      const text = message.text();
      if (
        rootWindow &&
        /^Applying inline style violates the following Content Security Policy directive/.test(text) &&
        /The action has been blocked\.?$/.test(text) &&
        ++rootConsole === 1
      )
        return;
      counts.console++;
      if (
        text === UPLOAD_ERROR_CLASS &&
        approved(message.location().url) &&
        new URL(message.location().url).pathname === "/file-upload"
      ) {
        if (fault === "missing-first-console" && !faultUsed) {
          faultUsed = true; // Control-only calibration: retain the count while deliberately dropping one observation.
        } else uploadConsole.console(new URL(message.location().url).href);
      } else latch("ASSERTION");
    });
    page.on("worker", () => {
      event();
      latch("WORKER");
    });
    const lost = () => {
      if (!closing) {
        unexpectedClose = true;
        latch("OBSERVER");
      }
    };
    page.on("close", lost);
    page.on("crash", () => {
      unexpectedClose = true;
      latch("OBSERVER");
    });
    cdp = await bounded(context.newCDPSession(page), "CDP");
    cdp.on("close", lost);
    cdp.on("Audits.issueAdded", ({ issue }) => {
      const detail = issue.details?.contentSecurityPolicyIssueDetails;
      if (issue.code === "ContentSecurityPolicyIssue" && detail)
        policyEvent(
          detail.violatedDirective,
          !detail.isReportOnly,
          "audit",
          detail.contentSecurityPolicyViolationType === "kInlineViolation",
        );
    });
    cdp.on("Network.requestWillBeSent", (e) => {
      if (!event()) return;
      if (e.type === "Image" && e.request.url.startsWith("data:image/")) return;
      if (!approved(e.request.url)) {
        counts.foreign++;
        latch("FOREIGN_ATTEMPT");
      }
      if (e.request.url === origin + "/docs/assets/redoc.js") rendererRequested = true;
    });
    cdp.on("Fetch.requestPaused", (e) => {
      if (!event()) {
        track(() => cancel(e.requestId));
        return;
      }
      if (paused.has(e.requestId)) {
        latch("CDP");
        track(() => cancel(e.requestId));
        return;
      }
      let release!: () => void;
      const held = new Promise<void>((resolve) => {
        release = resolve;
      });
      let cancelled = false;
      const item: Paused = {
        timer: setTimeout(() => {
          latch("PAUSED_TIMEOUT");
          item.cancel();
        }, DEADLINE),
        cancel: () => {
          if (cancelled) return;
          cancelled = true;
          track(async () => {
            try {
              await cancel(e.requestId);
            } finally {
              release();
            }
          });
        },
      };
      paused.set(e.requestId, item);
      track(async () => {
        try {
          if (closing) {
            item.cancel();
            await held;
            return;
          }
          if (!approved(e.request.url)) {
            counts.foreign++;
            latch("FOREIGN_ATTEMPT");
            await cancel(e.requestId);
            return;
          }
          const responseStage = e.responseStatusCode !== undefined || e.responseErrorReason !== undefined;
          if (responseStage) {
            if (
              e.responseStatusCode === 400 &&
              e.request.method === "POST" &&
              new URL(e.request.url).pathname === "/file-upload"
            )
              uploadConsole.response(new URL(e.request.url).href);
            if (
              e.responseStatusCode &&
              e.responseStatusCode >= 300 &&
              e.responseStatusCode < 400 &&
              e.responseHeaders?.some((h) => h.name.toLowerCase() === "location")
            ) {
              latch("REDIRECT");
              await cancel(e.requestId);
            } else if (e.responseErrorReason) {
              latch("HTTP");
              await cancel(e.requestId);
            } else await send("Fetch.continueResponse", { requestId: e.requestId });
          } else {
            if ((fault === "paused-deadline" || fault === "cancel-paused") && !faultUsed) {
              faultUsed = true;
              await held;
              return;
            }
            const headers = invocationHeaders(target, e.request.url, e.request.headers);
            await send("Fetch.continueRequest", {
              requestId: e.requestId,
              headers: Object.entries(headers).map(([name, value]) => ({ name, value })),
              interceptResponse: true,
            });
          }
        } catch (error) {
          latch(hostedFailureCode(error, "CDP"));
          if (!cancelled) item.cancel();
        } finally {
          clearTimeout(item.timer);
          paused.delete(e.requestId);
        }
      });
    });
    await bounded(cdp.send("Audits.enable"), "CDP");
    await bounded(cdp.send("Network.enable"), "CDP");
    await bounded(cdp.send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] }), "CDP");

    const lease: HostedBrowserLease = Object.freeze({
      page,
      origin,
      observation,
      assertClean() {
        if (failures.size) throw hostedFailure([...failures][0]);
      },
      close,
    });
    leases.set(lease, {
      rootProbe: async () => {
        if (rootUsed || closing || failures.size || page.url() !== origin + "/") throw hostedFailure("ASSERTION");
        rootUsed = true;
        rootWindow = true;
        try {
          const refused = await bounded(
            page.evaluate(() => {
              const sentinel = document.createElement("div");
              sentinel.id = "hosted-root-policy-sentinel";
              document.body.append(sentinel);
              const before = getComputedStyle(sentinel).outlineWidth;
              const style = document.createElement("style");
              document.head.append(style);
              if (style.sheet) style.sheet.insertRule("#hosted-root-policy-sentinel{outline:7px solid red}");
              return !style.sheet && getComputedStyle(sentinel).outlineWidth === before;
            }),
            "ASSERTION",
          );
          await new Promise((resolve) => setTimeout(resolve, 200));
          await bounded(cdp.send("Network.enable"), "OBSERVER", 1000);
          if (!refused || rootDom !== 1 || rootAudit !== 1 || rootConsole !== 1) latch("ASSERTION");
        } catch {
          latch("ASSERTION");
        } finally {
          rootWindow = false;
        }
        lease.assertClean();
      },
    });
    if (fault === "late-callback") {
      track(async () => {
        while (!closing) await new Promise((resolve) => setTimeout(resolve, 1));
        latch("CDP");
      });
    }
    return lease;
  } catch {
    latch("CDP");
    const finish = context ? await close() : undefined;
    throw hostedFailure(finish?.cleanup === "failed" ? "CLEANUP" : "CDP");
  }
}

/** Perform only the fixed, attributable root inline-style probe; a wrong/used/closed lease or extra issue fails. */
export async function exerciseRootStyleRefusal(lease: HostedBrowserLease): Promise<void> {
  const internal = leases.get(lease);
  if (!internal) throw hostedFailure("IDENTITY");
  await internal.rootProbe();
}

/**
 * Control-only fault seam. Requires the fixed synthetic loopback credential, never a provider token; no wrapper calls
 * this export. Exercises the actual deadline/CDP/cleanup/drain paths and returns their sanitized finalization.
 */
export async function exerciseHostedBrowserFaultControl(
  browser: Browser,
  target: HostedTarget,
  fault: Fault,
): Promise<Finalization> {
  if (
    !["paused-deadline", "cancel-paused", "cdp", "cleanup", "late-callback"].includes(fault) ||
    invocationHeaders(target, target.publicInput.target.origin, {})["X-Serverless-Authorization"] !==
      "Bearer owned.control.synthetic"
  )
    throw hostedFailure("INPUT");
  const lease = await createLease(browser, target, "desktop", fault);
  try {
    if (fault === "cancel-paused") {
      const navigation = lease.page.goto(lease.origin + "/blank").catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 100));
      await lease.close();
      await navigation;
    } else if (fault !== "late-callback") await lease.page.goto(lease.origin + "/blank").catch(() => {});
  } finally {
    return await lease.close();
  }
}

/**
 * Fixed actual-plumbing calibration for the missing-console counterexample. Only an owned synthetic handle can enter.
 * Deliberately drop the first qualifying console correlation, retain both counts, and perform the distinct POST/GET
 * queries. Returns safe response statuses and finalization; runtime wrappers have no route to this constructor.
 */
export async function exerciseOwnedMissingConsole(
  browser: Browser,
  target: HostedTarget,
): Promise<{
  finish: Finalization;
  observedConsole: number;
  postStatus: number;
  getStatus: number;
}> {
  if (
    invocationHeaders(target, target.publicInput.target.origin, {})["X-Serverless-Authorization"] !==
    "Bearer owned.control.synthetic"
  )
    throw hostedFailure("INPUT");
  const lease = await createLease(browser, target, "desktop", "missing-first-console");
  let postStatus = 0,
    getStatus = 0;
  try {
    await lease.page.goto(lease.origin + "/blank");
    [postStatus, getStatus] = await lease.page.evaluate(async () => {
      const post = await fetch("/file-upload?correlation=post", { method: "POST", body: "bad" });
      const get = await fetch("/file-upload?correlation=get");
      return [post.status, get.status];
    });
    await new Promise((resolve) => setTimeout(resolve, 200));
  } finally {
    const finish = await lease.close();
    if (postStatus !== 400 || getStatus !== 400 || lease.observation().consoleErrors !== 2)
      throw hostedFailure("ASSERTION");
    return { finish, observedConsole: lease.observation().consoleErrors, postStatus, getStatus };
  }
}
