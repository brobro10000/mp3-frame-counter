/**
 * Usage: node scripts/docs-controls.mjs. Validate docs-v1 against owned positive/fault fixtures, not the application.
 * The parent starts bounded control/probe children with private package-local run IDs and validates fresh reports.
 * It requests graceful cleanup on timeout, then uses a failed hard-kill fallback. Children read pinned test packages
 * and fixtures, open loopback servers and Chromium, write only .artifacts/docs-controls/<run-id>, and close all owned
 * resources. Any missing control or wrong rejection fails; there are no retries/skips, product calls, install steps
 * or remote assets. --child and --termination-probe are closed internal modes; forced cleanup stays unverified.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { stringify } from "yaml";
import {
  expectedSpec,
  parseYaml,
  assertArtifact,
  assertSpec,
  fragmentReferences,
  checkPublicResponses,
  requestDocs,
  checkServedSpec,
  sha256,
  same,
} from "../lib/docs-contract.mjs";
import { docsFixture, fixtureAssets } from "../lib/docs-fixture.mjs";
import { checkDocsBrowser, assertBrowserResult, checkRootBrowser } from "../lib/docs-browser.mjs";
import { calibrateGuard } from "../lib/docs-calibration.mjs";
import { assertControlReport } from "../lib/docs-control-report.mjs";
import { within } from "../lib/transport.ts";

const faults = [
  ["missing-renderer", "REAL_INTERACTION"],
  ["bad-style-hash", "DOCS_CSP_VALUE"],
  ["style-element", "CSP_VIOLATION"],
  ["style-attribute", "CSP_VIOLATION"],
  ["foreign-script", "FOREIGN_ATTEMPT"],
  ["foreign-font", "FOREIGN_ATTEMPT"],
  ["foreign-reference", "REF_SCOPE"],
  ["wrong-success", "SPEC_SCHEMAS"],
  ["wrong-metadata-property", "SPEC_SCHEMAS"],
  ["wrong-server", "SPEC_SERVERS"],
  ["wrong-security", "SPEC_SECURITY"],
  ["wrong-media", "SPEC_PATHS"],
  ["wrong-limit", "SPEC_PATHS"],
  ["wrong-head", "SPEC_PATHS"],
  ["missing-logo", "LOGO_LOAD"],
  ["wrong-logo", "LOGO_IDENTITY"],
  ["missing-csp", "DOCS_CSP_COUNT"],
  ["duplicate-csp", "DOCS_CSP_COUNT"],
  ["tighter-second", "DOCS_CSP_COUNT"],
  ["looser-second", "DOCS_CSP_COUNT"],
  ["report-only", "DOCS_REPORT_ONLY"],
  ["meta-policy", "META_POLICY"],
  ["late-meta", "META_POLICY"],
  ["missing-header", "DOCS_HEADER"],
  ["late-error", "PAGE_ERROR"],
];
const yamlFaults = [
  ["duplicate", "a: 1\na: 2", "YAML_ERRORS"],
  ["multiple", "a: 1\n---\nb: 2", "YAML_ERRORS"],
  ["tag", "a: !unknown x", "YAML_WARNINGS"],
  ["nonstring", "? [a,b]\n: 1", "YAML_ERRORS"],
  ["version", "%YAML 1.1\n---\na: yes", "YAML_VERSION"],
  ["nonfinite", "a: .inf", "YAML_NONFINITE"],
  ["cycle", "a: &a [*a]", "YAML_CYCLE"],
  [
    "alias-limit",
    "a: &a [0,0]\nb: &b [*a,*a,*a,*a,*a,*a,*a,*a,*a,*a]\nc: [*b,*b,*b,*b,*b,*b,*b,*b,*b,*b]",
    "YAML_ALIASES",
  ],
];
const refFaults = [
  ["external", "other.yaml", "REF_SCOPE"],
  ["traversal", "../outside", "REF_SCOPE"],
  ["foreign", "https://invalid.example/spec", "REF_SCOPE"],
  ["missing", "#/not-found", "REF_MISSING"],
  ["escape", "#/bad~3pointer", "REF_SYNTAX"],
];
const planned = [
  "native-guard-calibration",
  "yaml-serializations",
  ...yamlFaults.map(([id]) => "yaml-" + id),
  ...refFaults.map(([id]) => "ref-" + id),
  "artifact-identity",
  "positive-desktop",
  "positive-narrow",
  "root-positive",
  "root-policy-leak",
  ...faults.map(([id]) => id),
  "report-mutations",
];
const sourceFiles = [
  "scripts/docs-controls.mjs",
  "lib/docs-contract.mjs",
  "lib/docs-browser.mjs",
  "lib/docs-observer.mjs",
  "lib/docs-fixture.mjs",
  "lib/docs-calibration.mjs",
  "lib/docs-control-report.mjs",
  "fixtures/openapi.json",
  "fixtures/inventory.json",
  "fixtures/manifest.json",
  "package.json",
  "package-lock.json",
];
const sourceDigest = sha256(
  sourceFiles.map((name) => name + "\0" + sha256(readFileSync(new URL("../" + name, import.meta.url)))).join("\n"),
);
const probe = process.argv[2] === "--termination-probe";
const child = process.argv[2] === "--child" || probe;
const runId = child ? process.argv[3] : randomUUID();
assert.match(runId, /^[a-f0-9-]{36}$/);
assert.equal(process.argv.length, child ? 4 : 2, "Unexpected control arguments");
const directory = new URL("../.artifacts/docs-controls/" + runId + "/", import.meta.url);
mkdirSync(directory, { recursive: true });
const reportURL = new URL("report.json", directory);
if (!child) {
  const environment = {};
  for (const name of ["HOME", "PATH", "TMPDIR", "TEMP", "TMP", "SystemRoot", "LANG", "CI"])
    if (process.env[name]) environment[name] = process.env[name];
  async function run(mode, identity, destination) {
    mkdirSync(destination, { recursive: true });
    const output = [];
    let bytes = 0,
      budgetExpired = false,
      forced = false,
      ready = false;
    let graceTimer, probeTimer;
    const childProcess = spawn(process.execPath, [fileURLToPath(import.meta.url), mode, identity], {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      env: environment,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe", "ipc"],
    });
    const stop = () => {
      if (budgetExpired) return;
      budgetExpired = true;
      childProcess.kill("SIGTERM");
      graceTimer = setTimeout(() => {
        forced = true;
        try {
          if (process.platform === "win32") childProcess.kill("SIGKILL");
          else process.kill(-childProcess.pid, "SIGKILL");
        } catch {}
      }, 15000);
    };
    const timer = setTimeout(stop, mode === "--termination-probe" ? 30000 : 240000);
    childProcess.on("message", (message) => {
      if (
        mode === "--termination-probe" &&
        message?.kind === "owned-probe-ready" &&
        message.runId === identity &&
        !ready
      ) {
        ready = true;
        probeTimer = setTimeout(stop, 50);
      }
    });
    for (const stream of [childProcess.stdout, childProcess.stderr])
      stream.on("data", (chunk) => {
        bytes += chunk.length;
        if (bytes > 1024 * 1024) stop();
        else output.push(chunk);
      });
    const code = await new Promise((resolve, reject) => {
      childProcess.once("error", reject);
      childProcess.once("close", resolve);
    }).finally(() => {
      clearTimeout(timer);
      clearTimeout(graceTimer);
      clearTimeout(probeTimer);
    });
    const processResult = {
      kind: "candidate-control-process",
      productAcceptance: false,
      code,
      budgetExpired,
      forced,
      ready,
      cleanup: forced ? "unverified" : "reported-by-child",
    };
    writeFileSync(new URL("process.json", destination), JSON.stringify(processResult, null, 2) + "\n");
    writeFileSync(new URL("child.log", destination), Buffer.concat(output));
    process.stdout.write(Buffer.concat(output));
    return processResult;
  }
  const probeId = randomUUID(),
    probeDirectory = new URL("../.artifacts/docs-controls/" + probeId + "/", import.meta.url);
  const stopped = await run("--termination-probe", probeId, probeDirectory);
  assert.equal(stopped.ready, true, "TERMINATION_PROBE_READY");
  assert.equal(stopped.budgetExpired, true, "TERMINATION_PROBE_DEADLINE");
  assert.equal(stopped.forced, false, "TERMINATION_PROBE_FORCED");
  assert.equal(stopped.code, 1, "TERMINATION_PROBE_MUST_FAIL");
  const stoppedReport = JSON.parse(readFileSync(new URL("report.json", probeDirectory), "utf8"));
  assert.equal(stoppedReport.runId, probeId);
  assert.equal(stoppedReport.sourceDigest, sourceDigest);
  assert.equal(stoppedReport.status, "failed");
  assert.equal(stoppedReport.terminationRequested, true);
  assert.equal(stoppedReport.cleanup, "confirmed");
  assert.equal(stoppedReport.browserConnected, false);
  assert.equal(stoppedReport.probePageClosed, true);
  for (const origin of [stoppedReport.probeOrigin, stoppedReport.probeSinkOrigin]) {
    assert.match(origin, /^http:\/\/127\.0\.0\.1:[0-9]+$/);
    await assert.rejects(() => requestDocs(origin, "/"), /ECONNREFUSED/);
  }
  console.log("Owned termination probe: failed as intended; browser/page/servers closed before child exit.");
  const execution = await run("--child", runId, directory);
  assert.equal(execution.budgetExpired, false, "Control child exceeded deadline/output budget");
  assert.equal(execution.code, 0, "Control child failed");
  const report = JSON.parse(readFileSync(reportURL, "utf8"));
  assertControlReport(report, runId, sourceDigest, planned);
  writeFileSync(
    new URL("termination-control.json", directory),
    JSON.stringify({ probeId, ...stopped }, null, 2) + "\n",
  );
  console.log(
    `Fresh docs controls: ${report.cases.length}/${planned.length}; no application acceptance. ${fileURLToPath(reportURL)}`,
  );
} else {
  const report = {
    kind: probe ? "candidate-docs-termination-probe" : "candidate-docs-controls",
    productAcceptance: false,
    runId,
    sourceDigest,
    startedAt: new Date().toISOString(),
    planned,
    cases: [],
    status: "failed",
    cleanup: "unverified",
  };
  let browser, probePage, releaseProbe;
  let terminationRequested = false;
  const activeFixtures = new Set();
  const openFixture = async (fault) => {
    const fixture = await docsFixture(fault);
    activeFixtures.add(fixture);
    return fixture;
  };
  const finishFixture = async (fixture) => {
    await fixture.close();
    activeFixtures.delete(fixture);
  };
  async function cleanupOwned() {
    const outcomes = await Promise.allSettled([
      ...(browser ? [within(browser.close(), 5000, "BROWSER_CLEANUP")] : []),
      ...[...activeFixtures].map((fixture) => finishFixture(fixture)),
    ]);
    const failed = outcomes.find((x) => x.status === "rejected");
    if (failed) throw failed.reason;
  }
  const terminate = () => {
    terminationRequested = true;
    cleanupOwned()
      .catch(() => {})
      .finally(() => releaseProbe?.());
  };
  process.once("SIGTERM", terminate);
  const record = async (id, body) => {
    if (terminationRequested) throw Error("CONTROL_TERMINATED");
    const entry = { id, status: "failed", attempts: 1, skipped: false };
    report.cases.push(entry);
    try {
      entry.evidence = await body();
      entry.status = "passed";
    } catch (error) {
      entry.error = String(error.message).slice(0, 2000);
      throw error;
    }
    console.log(id + ": passed");
  };
  try {
    browser = await chromium.launch({ timeout: 10000, handleSIGTERM: false, handleSIGINT: false, handleSIGHUP: false });
    if (terminationRequested) throw Error("CONTROL_TERMINATED");
    report.browserVersion = browser.version();
    if (probe) {
      const fixture = await openFixture();
      report.probeOrigin = fixture.origin;
      report.probeSinkOrigin = fixture.sinkOrigin;
      const context = await browser.newContext({ serviceWorkers: "block" });
      probePage = await context.newPage();
      await probePage.goto(fixture.origin + "/", { timeout: 5000 });
      const stopped = new Promise((resolve) => {
        releaseProbe = resolve;
      });
      process.send?.({ kind: "owned-probe-ready", runId });
      await stopped;
      throw Error("CONTROL_TERMINATED");
    }
    await record("native-guard-calibration", async () => {
      const value = await calibrateGuard(browser);
      same(value.status, "passed", "GUARD_CALIBRATION");
      same(value.cleanup, "confirmed", "GUARD_CLEANUP");
      return value;
    });
    await record("yaml-serializations", () => {
      for (const bytes of [
        Buffer.from(JSON.stringify(expectedSpec)),
        Buffer.from(stringify(expectedSpec)),
        Buffer.from("# YAML comment\n" + stringify(expectedSpec, { sortMapEntries: true })),
      ])
        assertSpec(parseYaml(bytes));
      const narrative = structuredClone(expectedSpec);
      narrative.info.description = "Harmless metadata";
      narrative.paths["/file-upload"].post.responses["200"].description = "Independent positive frame count";
      assertSpec(narrative);
      const defaults = structuredClone(expectedSpec);
      defaults.servers = [{ url: "/" }];
      defaults.security = [];
      assertSpec(defaults);
      for (const [key, marker] of [
        ["servers", "SPEC_SERVERS"],
        ["security", "SPEC_SECURITY"],
      ]) {
        const invalid = structuredClone(expectedSpec);
        invalid[key] = null;
        assert.throws(() => assertSpec(invalid), new RegExp(marker));
      }
      const alias = parseYaml(Buffer.from("a: &item {value: 1}\nb: *item"));
      same(alias, { a: { value: 1 }, b: { value: 1 } }, "YAML_ALIAS_POSITIVE");
      return { serializations: 3, ordinaryAlias: true, fragments: fragmentReferences(expectedSpec).length };
    });
    for (const [id, text, marker] of yamlFaults)
      await record("yaml-" + id, () => {
        assert.throws(() => parseYaml(Buffer.from(text)), new RegExp(marker));
        return { rejection: marker };
      });
    for (const [id, ref, marker] of refFaults)
      await record("ref-" + id, () => {
        const value = structuredClone(expectedSpec);
        value.components.schemas.FrameCount.$ref = ref;
        assert.throws(() => assertSpec(value), new RegExp(marker));
        return { rejection: marker };
      });
    await record("artifact-identity", () => {
      const a = fixtureAssets(),
        b = fixtureAssets();
      same(
        [...a].map(([p, v]) => [p, sha256(v)]),
        [...b].map(([p, v]) => [p, sha256(v)]),
        "DETERMINISTIC_FIXTURE",
      );
      const source = a.get("/docs/assets/redoc.js");
      const corrupted = Buffer.from(source);
      corrupted[0] ^= 1;
      assert.throws(() => assertArtifact(corrupted, sha256(source)), /ARTIFACT_IDENTITY/);
      return { files: a.size };
    });
    for (const [id, viewport] of [
      ["desktop", { width: 1280, height: 900 }],
      ["narrow", { width: 390, height: 844 }],
    ])
      await record("positive-" + id, async () => {
        const fixture = await openFixture();
        try {
          await checkPublicResponses(fixture.origin);
          await checkServedSpec(fixture.origin);
          const value = await checkDocsBrowser(
            browser,
            fixture.origin,
            viewport,
            fileURLToPath(new URL(id + ".png", directory)),
          );
          writeFileSync(new URL(id + "-observation.json", directory), JSON.stringify(value, null, 2) + "\n");
          assertBrowserResult(value);
          same(fixture.receipts, [], "POSITIVE_RECEIPTS");
          return value;
        } finally {
          await finishFixture(fixture);
        }
      });
    await record("root-positive", async () => {
      const fixture = await openFixture();
      try {
        return await checkRootBrowser(browser, fixture.origin);
      } finally {
        await finishFixture(fixture);
      }
    });
    await record("root-policy-leak", async () => {
      const fixture = await openFixture("root-policy-leak");
      try {
        await assert.rejects(() => checkRootBrowser(browser, fixture.origin), /ROOT_CSP_VALUE/);
        return { rejection: "ROOT_CSP_VALUE" };
      } finally {
        await finishFixture(fixture);
      }
    });
    for (const [fault, marker] of faults)
      await record(fault, async () => {
        const fixture = await openFixture(fault);
        try {
          const value = await checkDocsBrowser(
            browser,
            fixture.origin,
            { width: 1280, height: 900 },
            fileURLToPath(new URL(fault + ".png", directory)),
          );
          writeFileSync(new URL(fault + "-observation.json", directory), JSON.stringify(value, null, 2) + "\n");
          same(value.status, "failed", "WRONG_CONTROL_ACCEPTED");
          same(value.cleanup, "confirmed", "CONTROL_CLEANUP");
          assert.match(value.failures.join(";"), new RegExp(marker));
          same(fixture.receipts, [], "FOREIGN_RECEIPTS");
          if (["bad-style-hash", "tighter-second", "looser-second"].includes(fault))
            assert.ok(
              value.observation.issues.some((i) => !i.reportOnly),
              "EFFECTIVE_CSP_REJECTION",
            );
          if (fault === "late-error")
            assert.ok(
              value.observation.errors.some(
                (e) =>
                  value.screenshotFinishedMs < e.atMonotonicMs - value.startedMonotonicMs &&
                  e.atMonotonicMs - value.startedMonotonicMs < value.classificationMs,
              ),
              "LATE_ERROR_BOUNDARY",
            );
          if (fault === "foreign-reference") same(value.observation.requests, [], "REFERENCE_BEFORE_NAVIGATION");
          if (fault.startsWith("foreign-") && fault !== "foreign-reference")
            assert.ok(
              value.observation.requests.some((r) => r.url.startsWith(fixture.sinkOrigin + "/foreign-")),
              "FOREIGN_ATTRIBUTION",
            );
          return value;
        } finally {
          await finishFixture(fixture);
        }
      });
    await record("report-mutations", () => {
      const good = {
        kind: "candidate-docs-controls",
        productAcceptance: false,
        runId,
        sourceDigest,
        status: "passed",
        cleanup: "confirmed",
        planned: ["one"],
        cases: [{ id: "one", status: "passed", attempts: 1, skipped: false }],
      };
      assertControlReport(good, runId, sourceDigest, ["one"]);
      const mutations = [
        null,
        { ...good, cases: [] },
        { ...good, cases: [...good.cases, ...good.cases] },
        { ...good, status: "failed" },
        { ...good, runId: randomUUID() },
        { ...good, sourceDigest: "stale" },
        { ...good, cases: [{ ...good.cases[0], status: "failed" }] },
        { ...good, cases: [{ ...good.cases[0], attempts: 2 }] },
        { ...good, cases: [{ ...good.cases[0], skipped: true }] },
        { ...good, cleanup: "unverified" },
      ];
      for (const value of mutations)
        assert.throws(() => assertControlReport(value, runId, sourceDigest, ["one"]), /CONTROL_/);
      return { rejections: mutations.length };
    });
    report.status = "passed";
  } catch (error) {
    report.failure = String(error.stack).slice(0, 4000);
    process.exitCode = 1;
  } finally {
    try {
      await cleanupOwned();
      report.browserConnected = browser?.isConnected() ?? false;
      if (probe) report.probePageClosed = probePage?.isClosed() ?? false;
      if (report.browserConnected) throw Error("BROWSER_STILL_CONNECTED");
      report.cleanup = "confirmed";
    } catch (error) {
      report.cleanup = "unverified";
      report.status = "failed";
      report.failure = error.message;
      process.exitCode = 1;
    }
    report.terminationRequested = terminationRequested;
    if (terminationRequested) {
      report.status = "failed";
      process.exitCode = 1;
    }
    process.off("SIGTERM", terminate);
    if (process.connected) process.disconnect();
    report.finishedAt = new Date().toISOString();
    writeFileSync(reportURL, JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
  }
  if (report.status === "passed") assertControlReport(report, runId, sourceDigest, planned);
  else console.error(report.failure);
}
