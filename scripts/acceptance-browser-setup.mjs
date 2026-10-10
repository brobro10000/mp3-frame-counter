/**
 * Prepare the selected standalone acceptance package's pinned Chromium before its browser-dependent controls.
 *
 * Import and await prepareAcceptanceBrowser({ suiteRoot, ci, environment, deadline, signal }) after locked npm ci and
 * acceptance selection. The absolute monotonic deadline is shared across suites. Tests alone may inject run/platform/now;
 * there are no CLI, browser, cache, target, executable or privilege selectors. Importing performs no I/O.
 *
 * Preparation reads contained package metadata, runs the package-local CLI (OS dependencies only on validated Linux CI),
 * and launches/closes an about:blank browser through public Playwright APIs. Installers may access the network/cache and
 * Linux CI system packages. Children receive a minimal environment and bounded output/time; only owned process groups
 * may be terminated. Detached browser cleanup is confirmed only by successful public close and clean probe completion.
 * An active Node permission model fails closed instead of propagating or bypassing its security flags.
 * Failures throw a fixed sanitized Error carrying setupResult; results never establish product acceptance or deployment.
 */

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, sep } from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";

const stageCeilings = { "install-deps": 120000, install: 180000, probe: 20000 };
const probeOutputLimit = 1024;
const installOutputLimit = 64 * 1024;
const cleanupLimit = 10000;
const runtimeKeys = ["TMPDIR", "LANG", "LC_ALL", "XDG_RUNTIME_DIR"];

/** Reject missing/escaping/symlinked package files without executing them; return an ordinary contained absolute path. */
function ordinaryFile(root, path) {
  const parts = path.split("/");
  let current = root;
  for (const [index, part] of parts.entries()) {
    current = join(current, part);
    const stat = lstatSync(current);
    assert(index === parts.length - 1 ? stat.isFile() : stat.isDirectory());
  }
  const child = relative(root, realpathSync(current));
  assert(child && !isAbsolute(child) && child !== ".." && !child.startsWith(`..${sep}`));
  return current;
}

/** Parse bounded ordinary JSON metadata under the extraction; unreadable, oversized or non-object records throw. */
function packageJson(root, path) {
  const file = ordinaryFile(root, path);
  assert(lstatSync(file).size <= 1024 * 1024);
  const value = JSON.parse(readFileSync(file, "utf8"));
  assert(value && typeof value === "object" && !Array.isArray(value));
  return value;
}

/** Verify the selected lock/installed chain and fixed entrypoints, deriving bounded browser identity without launching. */
function installedMetadata(suiteRoot) {
  assert(lstatSync(suiteRoot).isDirectory());
  const root = realpathSync(suiteRoot);
  const pkg = packageJson(root, "package.json");
  const lock = packageJson(root, "package-lock.json");
  const version = pkg.devDependencies?.["@playwright/test"];
  assert(typeof version === "string" && version.length <= 64 && /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version));
  assert.equal(lock.lockfileVersion, 3);
  assert.equal(lock.packages?.[""]?.devDependencies?.["@playwright/test"], version);
  assert.equal(lock.packages[""].name, pkg.name);
  assert.equal(lock.packages[""].version, pkg.version);
  for (const [name, dependency] of [
    ["@playwright/test", "playwright"],
    ["playwright", "playwright-core"],
    ["playwright-core", null],
  ]) {
    const path = `node_modules/${name}`;
    const locked = lock.packages[path];
    const installed = packageJson(root, `${path}/package.json`);
    assert(locked && !locked.link);
    assert.equal(locked.version, version);
    assert.equal(installed.name, name);
    assert.equal(installed.version, version);
    assert(typeof locked.integrity === "string" && /^sha512-[A-Za-z0-9+/]{86}==$/.test(locked.integrity));
    const resolved = new URL(locked.resolved);
    assert(resolved.protocol === "https:" && !resolved.username && !resolved.password);
    if (dependency) {
      assert.equal(locked.dependencies?.[dependency], version);
      assert.equal(installed.dependencies?.[dependency], version);
    }
    assert.equal(installed.bin?.[name === "playwright-core" ? "playwright-core" : "playwright"], "cli.js");
    assert.equal(installed.exports?.["."]?.import, "./index.mjs");
    assert.equal(installed.exports?.["."]?.require, "./index.js");
    for (const file of ["cli.js", "index.mjs", "index.js"]) ordinaryFile(root, `${path}/${file}`);
  }
  const browsers = packageJson(root, "node_modules/playwright-core/browsers.json").browsers;
  assert(Array.isArray(browsers));
  const identities = ["chromium", "chromium-headless-shell"].map((name) => {
    const matches = browsers.filter((browser) => browser?.name === name);
    assert.equal(matches.length, 1);
    const browser = matches[0];
    assert(typeof browser.revision === "string" && /^[1-9]\d{0,31}$/.test(browser.revision));
    assert(typeof browser.browserVersion === "string" && /^\d{1,10}(?:\.\d{1,10}){3}$/.test(browser.browserVersion));
    return browser;
  });
  assert.equal(identities[0].browserVersion, identities[1].browserVersion);
  return {
    playwrightVersion: version,
    chromiumRevision: identities[0].revision,
    headlessShellRevision: identities[1].revision,
    browserVersion: identities[0].browserVersion,
  };
}

/** Copy only usable runtime values and construct trusted utility PATH; invalid required HOME throws without mutation. */
function childEnvironment(environment, ci) {
  const usable = (value) => typeof value === "string" && value.length > 0 && !/[\x00-\x1f\x7f]/.test(value);
  assert(usable(environment.HOME) && isAbsolute(environment.HOME));
  const env = {
    PATH: [
      dirname(process.execPath),
      "/usr/local/sbin",
      "/usr/local/bin",
      "/usr/sbin",
      "/usr/bin",
      "/sbin",
      "/bin",
    ].join(":"),
    HOME: environment.HOME,
  };
  for (const key of runtimeKeys) if (usable(environment[key])) env[key] = environment[key];
  env.CI = String(ci);
  return env;
}

/**
 * Execute only inside the fixed probe child. Inputs are verified module URL and bounded internal timers; launch/close
 * uses public APIs and about:blank only. Failure exits nonzero without diagnostics; the hard timer permits exit hooks
 * to attempt detached cleanup but emits no close proof. Signals request normal bounded failure, never successful output.
 */
async function readinessProbe(moduleUrl, hardTimeoutMs, launchTimeoutMs) {
  let failed = false;
  let browser;
  let context;
  let page;
  let browserVersion;
  const hardDeadline = performance.now() + hardTimeoutMs;
  let timer = setTimeout(() => process.exit(1), hardTimeoutMs);
  const interrupt = () => {
    failed = true;
    clearTimeout(timer);
    timer = setTimeout(() => process.exit(1), Math.max(1, Math.min(1000, hardDeadline - performance.now())));
  };
  process.once("SIGTERM", interrupt);
  process.once("SIGINT", interrupt);
  try {
    const { chromium } = await import(moduleUrl);
    if (failed) throw Error("Interrupted");
    browser = await chromium.launch({ timeout: launchTimeoutMs });
    context = await browser.newContext();
    page = await context.newPage();
    await page.goto("about:blank");
    browserVersion = browser.version();
  } catch {
    failed = true;
  } finally {
    for (const resource of [page, context, browser]) {
      try {
        if (resource) await resource.close();
      } catch {
        failed = true;
      }
    }
  }
  if (failed || !browser) process.exit(1);
  const record = {
    schemaVersion: 1,
    kind: "acceptance-browser-readiness",
    browserVersion,
    closed: true,
    status: "passed",
  };
  process.stdout.write(`${JSON.stringify(record)}\n`, () => {
    clearTimeout(timer);
    process.exit(0);
  });
}

/**
 * Spawn one detached owned command with bounded streams/timers. A first failure requests SIGTERM, then SIGKILL within
 * ten seconds; uncertainty is returned, never hidden. Only this child's group is targeted, never a detached browser
 * group or ambient processes. A clean group exit alone does not establish browser cleanup; the caller checks close proof.
 */
function runOwned({ name, executable, args, cwd, env, timeoutMs, signal }) {
  return new Promise((resolve) => {
    const limit = name === "probe" ? probeOutputLimit : installOutputLimit;
    let child;
    let stdout = Buffer.alloc(0);
    let bytes = 0;
    let timedOut = false;
    let aborted = false;
    let stopping = false;
    let forced = false;
    let settled = false;
    let exitCode = null;
    let exitSignal = null;
    let timeout;
    let killTimer;
    let cleanupTimer;

    // Check or signal exactly the created group. Any error other than absence remains an uncertain cleanup outcome.
    const group = (action) => {
      if (!child?.pid) return false;
      try {
        process.kill(-child.pid, action);
        return true;
      } catch (error) {
        return error.code !== "ESRCH";
      }
    };
    // Resolve once, releasing listeners and streams even if an unresponsive child cannot be proven removed.
    const finish = (cleanup) => {
      if (settled) return;
      settled = true;
      for (const timer of [timeout, killTimer, cleanupTimer]) clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      child?.stdout?.destroy();
      child?.stderr?.destroy();
      child?.unref();
      resolve({ exitCode, signal: exitSignal, stdout: stdout.toString("utf8"), timedOut, aborted, cleanup });
    };
    // Arm cleanup only once across all concurrent failure events, preserving the single ten-second allowance.
    const stop = () => {
      if (settled || stopping) return;
      stopping = true;
      group("SIGTERM");
      killTimer = setTimeout(() => {
        forced = true;
        group("SIGKILL");
      }, 2000);
      cleanupTimer = setTimeout(() => finish("unverified"), cleanupLimit);
    };
    const abort = () => {
      aborted = true;
      stop();
    };
    if (signal?.aborted) {
      aborted = true;
      finish("confirmed");
      return;
    }
    try {
      // Node otherwise copies host coverage even with explicit env. Its own undefined key is omitted from envPairs.
      child = spawn(executable, args, {
        cwd,
        env: { ...env, NODE_V8_COVERAGE: undefined },
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch {
      finish("confirmed");
      return;
    }
    signal?.addEventListener("abort", abort, { once: true });
    timeout = setTimeout(() => {
      timedOut = true;
      stop();
    }, timeoutMs);
    // Count both streams, retaining only bounded stdout; a bounded sentinel also exposes stderr overflow to the caller.
    const capture = (chunk, retain) => {
      bytes += chunk.length;
      if (bytes > limit) {
        stdout = Buffer.alloc(limit + 1, 32);
        stop();
      } else if (retain) stdout = Buffer.concat([stdout, chunk]);
    };
    child.stdout.on("data", (chunk) => capture(chunk, true));
    child.stderr.on("data", (chunk) => capture(chunk, false));
    child.once("error", () => {
      if (child.pid) stop();
      else finish("confirmed");
    });
    child.once("exit", (code, childSignal) => {
      exitCode = code;
      exitSignal = childSignal;
      if (code !== 0 || childSignal || group(0)) stop();
    });
    child.once("close", () => {
      if (group(0)) stop();
      else finish(forced || stopping ? "unverified" : "confirmed");
    });
    if (signal?.aborted) abort();
  });
}

/** Accept only the exact bounded matching close record; arbitrary output and schema additions cannot prove readiness. */
function closedReadiness(stdout, metadata) {
  try {
    const value = JSON.parse(stdout);
    return (
      value &&
      Object.keys(value).sort().join(",") === "browserVersion,closed,kind,schemaVersion,status" &&
      value.schemaVersion === 1 &&
      value.kind === "acceptance-browser-readiness" &&
      value.browserVersion === metadata.browserVersion &&
      value.closed === true &&
      value.status === "passed"
    );
  } catch {
    return false;
  }
}

/** Throw only a fixed diagnostic and the closed setup record; private inputs and subprocess diagnostics never escape. */
function fail(result, stage, code) {
  result.status = "failed";
  result.failure = { stage, code };
  const error = new Error("Acceptance browser preparation failed.");
  error.setupResult = result;
  throw error;
}

/**
 * Validate authority/metadata, then prepare the browser within the caller's shared deadline. Only test adapters can
 * replace execution/platform/clock. Return closed sanitized evidence or throw with its failed partial setupResult.
 */
export async function prepareAcceptanceBrowser(options, adapters = {}) {
  const platform = adapters?.platform ?? process.platform;
  const result = {
    schemaVersion: 1,
    kind: "acceptance-browser-setup",
    productAcceptance: false,
    status: "failed",
    platform: ["linux", "darwin"].includes(platform) ? platform : null,
    ci: typeof options?.ci === "boolean" ? options.ci : null,
    metadata: null,
    steps: [],
    cleanup: "not-started",
    failure: null,
  };
  let stage = "input";
  let exceptionCode = "authority";
  try {
    assert(options && typeof options === "object" && !Array.isArray(options));
    assert(adapters && typeof adapters === "object" && !Array.isArray(adapters));
    assert(Object.keys(adapters).every((key) => ["run", "platform", "now"].includes(key)));
    if (result.ci === null) fail(result, stage, "authority");
    if (result.platform === null) fail(result, stage, "platform");
    if (process.permission !== undefined) fail(result, stage, "authority");
    const { suiteRoot, ci, environment, deadline, signal } = options;
    assert(typeof suiteRoot === "string" && isAbsolute(suiteRoot) && !/[\x00-\x1f\x7f]/.test(suiteRoot));
    assert(environment && typeof environment === "object" && !Array.isArray(environment));
    assert(Number.isFinite(deadline));
    assert(signal === undefined || signal instanceof AbortSignal);
    const run = adapters.run ?? runOwned;
    const now = adapters.now ?? (() => performance.now());
    assert(typeof run === "function" && typeof now === "function");
    const env = childEnvironment(environment, ci);
    assert(Number.isFinite(now()));
    stage = "metadata";
    exceptionCode = "metadata";
    result.metadata = installedMetadata(suiteRoot);
    const stages = platform === "linux" && ci ? ["install-deps", "install", "probe"] : ["install", "probe"];
    for (const name of stages) {
      stage = name;
      exceptionCode = "command";
      if (signal?.aborted) fail(result, stage, "abort");
      const started = now();
      assert(Number.isFinite(started));
      const timeoutMs = Math.floor(Math.min(stageCeilings[name], deadline - started));
      if (timeoutMs <= (name === "probe" ? 5000 : 0)) fail(result, stage, "deadline");
      const args =
        name === "probe"
          ? [
              "--input-type=module",
              "--eval",
              `await (${readinessProbe.toString()})(${JSON.stringify(pathToFileURL(join(suiteRoot, "node_modules/playwright/index.mjs")).href)},${Math.min(15000, timeoutMs - 5000)},${Math.min(10000, timeoutMs - 5000)});`,
            ]
          : [join(suiteRoot, "node_modules/@playwright/test/cli.js"), name, "chromium"];
      const step = { name, status: "failed", durationMs: 0 };
      result.steps.push(step);
      result.cleanup = "unverified";
      let outcome;
      try {
        outcome = await run({ name, executable: process.execPath, args, cwd: suiteRoot, env, timeoutMs, signal });
      } finally {
        const ended = now();
        if (Number.isFinite(ended)) step.durationMs = Math.max(0, ended - started);
      }
      assert(outcome && typeof outcome === "object");
      assert(outcome.exitCode === null || Number.isInteger(outcome.exitCode));
      assert(outcome.signal === null || typeof outcome.signal === "string");
      assert(typeof outcome.stdout === "string");
      assert(typeof outcome.timedOut === "boolean" && typeof outcome.aborted === "boolean");
      assert(["confirmed", "unverified"].includes(outcome.cleanup));
      const withinOutput =
        Buffer.byteLength(outcome.stdout) <= (name === "probe" ? probeOutputLimit : installOutputLimit);
      const ready = name !== "probe" || (withinOutput && closedReadiness(outcome.stdout, result.metadata));
      result.cleanup = ready ? outcome.cleanup : "unverified";
      if (signal?.aborted || outcome.aborted) fail(result, stage, "abort");
      if (outcome.timedOut) fail(result, stage, "timeout");
      if (!withinOutput) fail(result, stage, "output");
      if (outcome.exitCode !== 0 || outcome.signal !== null) fail(result, stage, "command");
      if (!ready) fail(result, stage, "readiness");
      if (outcome.cleanup !== "confirmed") fail(result, stage, "cleanup");
      if (now() >= deadline) fail(result, stage, "deadline");
      step.status = "passed";
    }
    result.status = "passed";
    return result;
  } catch (error) {
    if (error?.setupResult === result) throw error;
    fail(result, stage, exceptionCode);
  }
}
