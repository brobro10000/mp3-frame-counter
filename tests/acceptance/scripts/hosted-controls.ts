/**
 * Usage: node scripts/hosted-controls.ts. The parent admits no target/private input and starts one fixed control child
 * with a minimal environment, 360-second deadline and 1 MiB discarded-output bound. It requests graceful owned cleanup,
 * then marks any forced/missing reaping as failure. Only the exact planned synthetic control set can pass; partial
 * failures remain explicit. Internal --child accepts a fresh run identity, never a target, command or credential.
 * Child controls own loopback fixtures and pinned Chromium. Evidence is candidate calibration, never hosted acceptance.
 */
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import type { Browser } from "@playwright/test";
import type { ControlRow, FailureCode } from "../lib/hosted-types.ts";
const root = fileURLToPath(new URL("..", import.meta.url));
const planned = [
  "protocol-valid-roles-and-exact-expiry",
  ...Array.from({ length: 15 }, (_, index) => `protocol-isolated-input-${index + 1}`),
  "protocol-encoding-and-byte-bounds",
  "protocol-immutable-secret-free-handle",
  "protocol-real-private-file-clock-and-tree",
  "protocol-complete-report-stage",
  "protocol-complete-report-production",
  "http-real-authenticated-declared-and-chunked",
  "http-preserves-duplicate-security-headers-and-body",
  "http-canonical-redirect-observed-without-following",
  "http-foreign-redirect-receiver-stays-unreached",
  "http-forbidden-paths-and-header-overrides-send-nothing",
  "http-json-actual-response-bound",
  "http-docs-actual-response-bound",
  "http-abort-observes-incomplete-body-and-recovery",
  "http-partial-success-is-rejected-before-abort",
  "http-completed-close-refuses-reuse-with-live-latch",
  "http-close-drains-owned-inflight-and-refuses-reuse",
  "http-owned-listener-cleanup",
  "browser-authenticated-header-replacement",
  "browser-absent-credential-positive-counterpart",
  "browser-untouched-security-headers/strict",
  "browser-untouched-security-headers/reverse",
  "browser-missing-csp-negative-counterpart",
  "browser-original-non-success-body",
  ...["navigation", "fetch"].flatMap((mode) =>
    ["/redirect-same", "/redirect-foreign"].map((path) => `browser-no-${mode}${path}`),
  ),
  ...["navigation", "fetch", "popup", "iframe"].map((mode) => `browser-foreign-${mode}`),
  "browser-unknown-popup-ownership",
  "browser-owned-same-origin-frame",
  ...["service", "dedicated", "shared"].map((kind) => `browser-worker-refusal-${kind}`),
  "browser-service-worker-live-counterpart",
  "browser-websocket-refusal",
  "browser-websocket-live-counterpart",
  ...["actual400", "wrong-path", "wrong-status", "uncorrelated", "extra"].map(
    (kind) => `browser-upload-console-${kind}`,
  ),
  "browser-bounded-observer-overflow",
  "browser-cancel-paused-during-cleanup",
  ...["paused-deadline", "cdp", "cleanup", "late-callback"].map((fault) => `browser-real-latch-${fault}`),
  ...[
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
  ].map((fault) => `browser-docs-${fault}`),
  "browser-console-correlation-response-first",
  "browser-console-correlation-console-first",
  "browser-console-correlation-inclusive-window",
  "browser-console-correlation-mixed-query",
  "browser-console-correlation-stale-response",
  "browser-console-correlation-stale-console",
  "browser-console-correlation-extra-console",
  "browser-console-correlation-ambiguous-response",
  "browser-console-correlation-ambiguous-console",
  "browser-console-correlation-unused-response",
  "browser-console-correlation-actual-mixed-query",
  "browser-token-free-control-evidence",
  "browser-fixture-cleanup",
  "ui-explicit-action-counterpart",
  "ui-delayed-selection-refused",
];
const failureCodes: FailureCode[] = [
  "INPUT",
  "IDENTITY",
  "ENVIRONMENT",
  "HTTP",
  "TLS",
  "RESPONSE_BOUND",
  "FOREIGN_ATTEMPT",
  "REDIRECT",
  "UNOWNED_PAGE",
  "WORKER",
  "WEBSOCKET",
  "CDP",
  "PAUSED_TIMEOUT",
  "OBSERVER",
  "ASSERTION",
  "OVERFLOW",
  "CLEANUP",
];
const sourceNames = [
  "lib/hosted-types.ts",
  "lib/hosted-target.ts",
  "lib/hosted-http.ts",
  "lib/hosted-inventory.ts",
  "lib/hosted-report.ts",
  "lib/hosted-fixtures.ts",
  "lib/hosted-control-target.ts",
  "lib/hosted-protocol-controls.ts",
  "lib/hosted-http-controls.ts",
  "lib/hosted-browser.ts",
  "lib/hosted-docs.ts",
  "lib/hosted-browser-controls.ts",
  "lib/hosted-ui.ts",
  "lib/hosted-ui-controls.ts",
  "scripts/hosted-controls.ts",
  "scripts/hosted-reporter.ts",
  "scripts/run-stage.ts",
  "scripts/run-production.ts",
  "playwright.stage.config.ts",
  "playwright.production.config.ts",
  "lib/assertions.ts",
  "lib/fixtures.ts",
  "lib/docs-contract.mjs",
  "lib/docs-fixture.mjs",
  "lib/backend-audio-contract.ts",
  "lib/backend-audio-errors.mjs",
  "lib/backend-audio-openapi.mjs",
  "lib/backend-audio-redoc.mjs",
  "fixtures/docs/provenance.json",
  "fixtures/openapi.json",
  "fixtures/backend-audio-openapi.json",
  "fixtures/backend-audio.json",
  "fixtures/profiles.json",
  "fixtures/inventory.stage.json",
  "fixtures/inventory.production.json",
  "fixtures/manifest.json",
  "package.json",
  "package-lock.json",
];
type Source = { path: string; sha256: string };
type ControlReport = {
  schemaVersion: 1;
  kind: "hosted-candidate-controls";
  productAcceptance: false;
  runId: string;
  sourceDigest: string;
  sources: Source[];
  planned: string[];
  controls: ControlRow[];
  status: "passed" | "failed";
  cleanup: "passed" | "failed";
  terminationRequested: boolean;
  failures: FailureCode[];
};
/** Refuse startup/debug inheritance before importing browser code; never pass a caller-selected runtime or target. */
function environment(): NodeJS.ProcessEnv {
  if (
    process.execArgv.length ||
    process.permission ||
    [
      "NODE_OPTIONS",
      "NODE_V8_COVERAGE",
      "DEBUG",
      "DEBUG_FILE",
      "PWDEBUG",
      "PLAYWRIGHT_DEBUG",
      "PLAYWRIGHT_DEBUG_FILE",
      "NODE_DEBUG",
      "NODE_DEBUG_NATIVE",
    ].some((key) => process.env[key]) ||
    !process.env.HOME ||
    !isAbsolute(process.env.HOME)
  )
    throw new Error("ENVIRONMENT");
  const env: NodeJS.ProcessEnv = {
    HOME: process.env.HOME,
    PATH: `${dirname(process.execPath)}:/usr/bin:/bin`,
    LANG: "en_US.UTF-8",
    LC_ALL: "en_US.UTF-8",
    TZ: "UTC",
  };
  if (process.env.TMPDIR && isAbsolute(process.env.TMPDIR)) env.TMPDIR = process.env.TMPDIR;
  return env;
}
/** Snapshot fixed source inputs so the parent can reject stale or substituted child records. */
function identities(): { sources: Source[]; sourceDigest: string } {
  const sources = sourceNames.map((path) => ({
    path,
    sha256: createHash("sha256")
      .update(readFileSync(new URL(`../${path}`, import.meta.url)))
      .digest("hex"),
  }));
  return {
    sources,
    sourceDigest: createHash("sha256")
      .update(sources.map(({ path, sha256 }) => `${path}\0${sha256}`).join("\n"))
      .digest("hex"),
  };
}
/** Validate only known unique control rows; partial failures are retained, but omitted/extra controls never pass. */
function checkedRows(value: unknown): ControlRow[] {
  if (!Array.isArray(value) || value.length > planned.length) throw new Error("IDENTITY");
  const seen = new Set<string>();
  for (const row of value) {
    if (
      !row ||
      Object.keys(row).sort().join() !== "cleanup,codes,id,status" ||
      !planned.includes(row.id) ||
      seen.has(row.id) ||
      !["passed", "failed"].includes(row.status) ||
      !["passed", "failed"].includes(row.cleanup) ||
      !Array.isArray(row.codes) ||
      new Set(row.codes).size !== row.codes.length ||
      row.codes.some((code: FailureCode) => !failureCodes.includes(code)) ||
      (row.status === "passed" && (row.cleanup !== "passed" || row.codes.length))
    )
      throw new Error("IDENTITY");
    seen.add(row.id);
  }
  return structuredClone(value);
}
/** Run the fixed owned groups; on interruption close Chromium and retain failed partial evidence while fixtures unwind. */
async function child(runId: string, directory: URL): Promise<void> {
  const report: ControlReport = {
    schemaVersion: 1,
    kind: "hosted-candidate-controls",
    productAcceptance: false,
    runId,
    ...identities(),
    planned,
    controls: [],
    status: "failed",
    cleanup: "passed",
    terminationRequested: false,
    failures: [],
  };
  let browser: Browser | undefined;
  let closing: Promise<void> | undefined;
  /** Close the caller-owned browser once; a rejected close remains an explicit cleanup failure. */
  const closeBrowser = () => {
    if (!browser) return Promise.resolve();
    return (closing ??= (async () => {
      try {
        await browser!.close();
        if (browser!.isConnected()) throw new Error("CLEANUP");
      } catch {
        report.cleanup = "failed";
        report.failures.push("CLEANUP");
      }
    })());
  };
  /** Do not restart any deadline: request owned cleanup and let each bounded fixture finally complete. */
  const interrupt = () => {
    report.terminationRequested = true;
    void closeBrowser();
  };
  process.on("SIGTERM", interrupt);
  process.on("SIGINT", interrupt);
  try {
    const { runHostedProtocolControls } = await import("../lib/hosted-protocol-controls.ts");
    const { runHostedHttpControls } = await import("../lib/hosted-http-controls.ts");
    const { runHostedBrowserControls } = await import("../lib/hosted-browser-controls.ts");
    const { runHostedUiControls } = await import("../lib/hosted-ui-controls.ts");
    report.controls.push(...(await runHostedProtocolControls()));
    if (!report.terminationRequested) report.controls.push(...(await runHostedHttpControls()));
    if (!report.terminationRequested) {
      const { chromium } = await import("@playwright/test");
      browser = await chromium.launch();
      if (!report.terminationRequested) report.controls.push(...(await runHostedBrowserControls(browser)));
      if (!report.terminationRequested) report.controls.push(...(await runHostedUiControls(browser)));
    }
  } catch {
    report.failures.push("ASSERTION");
  } finally {
    await closeBrowser();
    process.off("SIGTERM", interrupt);
    process.off("SIGINT", interrupt);
    report.failures = [...new Set(report.failures)];
    const rows = checkedRows(report.controls);
    if (rows.some((row) => row.cleanup !== "passed")) report.cleanup = "failed";
    if (
      rows.length === planned.length &&
      rows.every((row) => row.status === "passed") &&
      report.cleanup === "passed" &&
      !report.terminationRequested &&
      !report.failures.length
    )
      report.status = "passed";
    writeFileSync(new URL("child-report.json", directory), JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
    process.exitCode = report.status === "passed" ? 0 : 1;
  }
}
/** Own one child, discard bounded output and retain whether graceful cleanup or a failed forced fallback was observed. */
async function parent(runId: string, directory: URL, env: NodeJS.ProcessEnv): Promise<void> {
  const expected = identities();
  const processResult = await new Promise<{
    code: number | null;
    reaped: boolean;
    forced: boolean;
    stopped: boolean;
    bytes: number;
    failures: FailureCode[];
  }>((resolve) => {
    let done = false,
      bytes = 0,
      forced = false,
      stopped = false;
    let killTimer: ReturnType<typeof setTimeout> | undefined, finalTimer: ReturnType<typeof setTimeout> | undefined;
    const failures = new Set<FailureCode>();
    const owned = spawn(process.execPath, [fileURLToPath(import.meta.url), "--child", runId], {
      cwd: root,
      env: { ...env, NODE_V8_COVERAGE: undefined },
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    /** Resolve once and detach only owned handles; missing reaping is a failed observation, never cleanup proof. */
    const finish = (code: number | null, reaped: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(deadline);
      clearTimeout(killTimer);
      clearTimeout(finalTimer);
      process.off("SIGTERM", interrupt);
      process.off("SIGINT", interrupt);
      if (!reaped) {
        owned.stdout.destroy();
        owned.stderr.destroy();
        owned.unref();
      }
      resolve({ code, reaped, forced, stopped, bytes, failures: [...failures] });
    };
    /** Gracefully signal the child first, then force only its group; forced cleanup is explicitly unverified/failed. */
    const stop = (code: FailureCode) => {
      failures.add(code);
      if (stopped) return;
      stopped = true;
      try {
        owned.kill("SIGTERM");
      } catch {
        failures.add("CLEANUP");
      }
      killTimer = setTimeout(() => {
        forced = true;
        failures.add("CLEANUP");
        try {
          if (owned.pid) process.kill(-owned.pid, "SIGKILL");
        } catch {
          failures.add("CLEANUP");
        }
      }, 25000);
      finalTimer = setTimeout(() => {
        failures.add("CLEANUP");
        finish(null, false);
      }, 30000);
    };
    const interrupt = () => stop("ASSERTION");
    process.on("SIGTERM", interrupt);
    process.on("SIGINT", interrupt);
    const deadline = setTimeout(() => stop("ASSERTION"), 360000);
    for (const stream of [owned.stdout, owned.stderr])
      stream.on("data", (part: Buffer) => {
        bytes += part.length;
        if (bytes > 1048576) stop("OVERFLOW");
      });
    owned.once("error", () => {
      failures.add("ENVIRONMENT");
      finish(null, !owned.pid);
    });
    owned.once("close", (code, signal) => {
      if (signal) failures.add("CLEANUP");
      finish(code, true);
    });
  });
  writeFileSync(new URL("process.json", directory), JSON.stringify(processResult, null, 2) + "\n", { mode: 0o600 });
  let report: ControlReport | undefined;
  try {
    const file = new URL("child-report.json", directory),
      stat = lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 2097152) throw new Error("IDENTITY");
    const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(file)));
    if (
      Object.keys(value).sort().join() !==
        "cleanup,controls,failures,kind,planned,productAcceptance,runId,schemaVersion,sourceDigest,sources,status,terminationRequested" ||
      value.schemaVersion !== 1 ||
      value.kind !== "hosted-candidate-controls" ||
      value.productAcceptance !== false ||
      value.runId !== runId ||
      value.sourceDigest !== expected.sourceDigest ||
      !isDeepStrictEqual(value.sources, expected.sources) ||
      !isDeepStrictEqual(value.planned, planned) ||
      !["passed", "failed"].includes(value.status) ||
      !["passed", "failed"].includes(value.cleanup) ||
      typeof value.terminationRequested !== "boolean" ||
      !Array.isArray(value.failures) ||
      value.failures.some((code: FailureCode) => !failureCodes.includes(code)) ||
      new Set(value.failures).size !== value.failures.length
    )
      throw new Error("IDENTITY");
    checkedRows(value.controls);
    report = value;
  } catch {
    /* Missing/invalid child evidence remains an explicit failed parent record. */
  }
  const pass =
    !!report &&
    report.status === "passed" &&
    report.controls.length === planned.length &&
    report.controls.every((row) => row.status === "passed") &&
    report.cleanup === "passed" &&
    !report.failures.length &&
    !report.terminationRequested &&
    processResult.code === 0 &&
    processResult.reaped &&
    !processResult.forced &&
    !processResult.stopped &&
    !processResult.failures.length;
  const final = report ?? {
    schemaVersion: 1,
    kind: "hosted-candidate-controls",
    productAcceptance: false,
    runId,
    ...expected,
    planned,
    controls: [],
    status: "failed",
    cleanup: "failed",
    terminationRequested: processResult.stopped,
    failures: ["IDENTITY"],
  };
  if (!pass) {
    final.status = "failed";
    if (!processResult.reaped || processResult.forced || processResult.failures.includes("CLEANUP"))
      final.cleanup = "failed";
    final.failures = [...new Set([...final.failures, ...processResult.failures])];
  }
  writeFileSync(new URL("report.json", directory), JSON.stringify(final, null, 2) + "\n", { mode: 0o600 });
  console.log(
    `Hosted owned controls: ${final.controls.filter((row) => row.status === "passed").length}/${planned.length}; status ${pass ? "passed" : "failed"}.`,
  );
  if (!pass) process.exitCode = 1;
}
/** Admit only the public fixed entrypoint or its closed internal child form, with a fresh package-local evidence path. */
async function main(): Promise<void> {
  const mode = process.argv[2];
  const isChild = mode === "--child";
  if (process.argv.length !== (isChild ? 4 : 2)) throw new Error("INPUT");
  const runId = isChild ? process.argv[3] : randomUUID();
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(runId)) throw new Error("INPUT");
  const env = environment();
  process.env = env;
  const directory = new URL(`../.artifacts/hosted-controls/${runId}/`, import.meta.url);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  if (isChild) await child(runId, directory);
  else await parent(runId, directory, env);
}
main().catch(() => {
  console.error("Hosted owned controls failed");
  process.exitCode = 1;
});
