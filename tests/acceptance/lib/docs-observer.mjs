/**
 * Finite Chromium HTTP/CSP observer shared by public docs checks and owned guard calibration. Call before navigation.
 * Inputs are a fresh page/context, exact approved origins and an evidence ID. Installs public CDP blocking/observation
 * without rewriting responses, bounds projections, and fails on overflow/session loss. end() closes observation only;
 * caller owns context/browser cleanup. No teardown, worker, popup or WebSocket coverage is claimed.
 */
import { performance } from "node:perf_hooks";
import assert from "node:assert/strict";

export async function observe(page, context, allowedOrigins, id) {
  const record = {
    id,
    dom: [],
    meta: [],
    issues: [],
    logs: [],
    requests: [],
    failures: [],
    console: [],
    errors: [],
    overflow: false,
    unexpectedClose: false,
    active: true,
  };
  let sequence = 0;
  const text = (value) => String(value ?? "").slice(0, 1200);
  const push = (channel, value) => {
    if (!record.active) return;
    if (record[channel].length >= 500) {
      record.overflow = true;
      return;
    }
    record[channel].push({ sequence: ++sequence, atMonotonicMs: performance.now(), ...value });
  };
  await context.exposeBinding("__docsCsp", (_, event) =>
    push("dom", {
      blockedURL: text(event.blockedURL),
      directive: text(event.directive),
      disposition: text(event.disposition),
    }),
  );
  await context.exposeBinding("__docsMeta", (_, event) =>
    push("meta", {
      policy: text(event.policy),
      content: text(event.content),
    }),
  );
  await context.addInitScript(() => {
    const inspect = (node) => {
      if (!(node instanceof Element)) return;
      const metas = node.matches("meta") ? [node] : [...node.querySelectorAll("meta")];
      for (const meta of metas)
        if (/^content-security-policy(?:-report-only)?$/i.test(meta.httpEquiv))
          globalThis.__docsMeta({ policy: meta.httpEquiv, content: meta.content }).catch(() => {});
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
  });
  await context.addInitScript(() =>
    addEventListener("securitypolicyviolation", (event) => {
      globalThis
        .__docsCsp({
          blockedURL: event.blockedURI,
          directive: event.effectiveDirective,
          disposition: event.disposition,
        })
        .catch(() => {});
    }),
  );
  const cdp = await context.newCDPSession(page);
  const unexpected = () => {
    if (record.active) record.unexpectedClose = true;
  };
  cdp.on("close", unexpected);
  page.on("close", unexpected);
  page.on("crash", unexpected);
  cdp.on("Audits.issueAdded", ({ issue }) => {
    const detail = issue.details?.contentSecurityPolicyIssueDetails;
    if (issue.code !== "ContentSecurityPolicyIssue" || !detail) return;
    push("issues", {
      code: issue.code,
      blockedURL: text(detail.blockedURL),
      directive: text(detail.violatedDirective),
      reportOnly: detail.isReportOnly,
      violationType: text(detail.contentSecurityPolicyViolationType),
    });
  });
  cdp.on("Log.entryAdded", ({ entry }) =>
    push("logs", {
      source: text(entry.source),
      level: text(entry.level),
      text: text(entry.text),
      timestamp: entry.timestamp,
      url: text(entry.url),
    }),
  );
  cdp.on("Network.requestWillBeSent", (event) =>
    push("requests", {
      requestId: text(event.requestId),
      url: text(event.request.url),
      method: text(event.request.method),
      type: text(event.type),
      redirect: event.redirectResponse
        ? { url: text(event.redirectResponse.url), status: event.redirectResponse.status }
        : null,
    }),
  );
  cdp.on("Network.loadingFailed", (event) =>
    push("failures", {
      requestId: text(event.requestId),
      blockedReason: text(event.blockedReason),
      errorText: text(event.errorText),
      canceled: event.canceled === true,
    }),
  );
  page.on("console", (message) => {
    if (message.type() === "error") push("console", { text: text(message.text()) });
  });
  page.on("pageerror", (error) => push("errors", { text: text(error.message) }));
  await cdp.send("Audits.enable");
  await cdp.send("Log.enable");
  await cdp.send("Network.enable");
  const patterns = [
    ...allowedOrigins.map((origin) => ({ urlPattern: origin + "/*", block: false })),
    { urlPattern: "*://*:*/*", block: true },
  ];
  await cdp.send("Network.setBlockedURLs", { urlPatterns: patterns });
  record.patterns = patterns;
  return {
    record,
    async assertAlive() {
      assert.equal(record.unexpectedClose, false, "Observer target/session closed during observation");
      assert.equal(record.overflow, false, "Bounded observation buffer overflowed");
      await cdp.send("Network.enable");
      assert.equal(record.unexpectedClose, false, "Observer session did not remain alive");
    },
    end() {
      record.active = false;
      record.closedAtMonotonicMs = performance.now();
    },
  };
}
