/**
 * Independent DOCS-HARNESS expectations for pinned browser preparation, sanitized authority and bounded cleanup.
 * Run with pinned Node: `node --test scripts/acceptance-browser-setup.test.mjs`.
 * Disposable package metadata and inert Node programs replace package installation and Chromium. Injected adapters
 * make policy decisions deterministic; the two detached-child controls exercise real process lifetime without a
 * browser, network, apt, Docker or a real browser cache. Each fixture removes only resources it created.
 * Missing implementation is explicit interface-red, never a successful negative rejection or application acceptance.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import test from "node:test";

const helperUrl = new URL("./acceptance-browser-setup.mjs", import.meta.url);
const implementation = existsSync(helperUrl) ? await import(helperUrl.href) : {};
const fixedPath = [
  dirname(process.execPath),
  "/usr/local/sbin",
  "/usr/local/bin",
  "/usr/sbin",
  "/usr/bin",
  "/sbin",
  "/bin",
].join(":");
const version = "1.64.0";
const browserVersion = "156.0.8078.4";
const metadata = {
  playwrightVersion: version,
  chromiumRevision: "1248",
  headlessShellRevision: "1248",
  browserVersion,
};
const readiness = {
  schemaVersion: 1,
  kind: "acceptance-browser-readiness",
  browserVersion,
  closed: true,
  status: "passed",
};
const resultFields = [
  "schemaVersion",
  "kind",
  "productAcceptance",
  "status",
  "platform",
  "ci",
  "metadata",
  "steps",
  "cleanup",
  "failure",
];

/** Require the real export before any rejection assertion, so absent code cannot satisfy negative expectations. */
function setup() {
  assert.equal(typeof implementation.prepareAcceptanceBrowser, "function", "DOCS-HARNESS helper export is absent");
  return implementation.prepareAcceptanceBrowser;
}

/** Generate ordinary synthetic npm metadata; no bytes are fetched and its integrity is not a registry attestation. */
function graph(selectedVersion = version) {
  const pkg = {
    name: "synthetic-browser-suite",
    version: "1.0.0",
    private: true,
    devDependencies: { "@playwright/test": selectedVersion },
  };
  const packages = { "": { ...pkg } };
  const installed = {};
  for (const [name, dependency] of [
    ["@playwright/test", "playwright"],
    ["playwright", "playwright-core"],
    ["playwright-core", null],
  ]) {
    const dependencies = dependency ? { [dependency]: selectedVersion } : undefined;
    packages[`node_modules/${name}`] = {
      version: selectedVersion,
      resolved: `https://registry.npmjs.org/${name}/-/${name.split("/").at(-1)}-${selectedVersion}.tgz`,
      integrity: `sha512-${Buffer.alloc(64, 7).toString("base64")}`,
      dev: true,
      ...(dependencies ? { dependencies } : {}),
    };
    installed[name] = {
      name,
      version: selectedVersion,
      main: "index.js",
      exports: {
        ".": { import: "./index.mjs", require: "./index.js", default: "./index.js" },
        "./package.json": "./package.json",
      },
      bin: { [name === "playwright-core" ? "playwright-core" : "playwright"]: "cli.js" },
      ...(dependencies ? { dependencies } : {}),
    };
  }
  return {
    pkg,
    lock: { name: pkg.name, version: pkg.version, lockfileVersion: 3, requires: true, packages },
    installed,
  };
}

/** Build inert package-local programs, optionally owning one detached child to expose group-only cleanup assumptions. */
function fixture(t, { mode = "normal", selectedVersion = version } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "mp3-browser-setup-")));
  const suiteRoot = join(root, "suite");
  const home = join(root, "home");
  const temporary = join(root, "temporary");
  for (const path of [suiteRoot, home, temporary]) mkdirSync(path);
  const log = join(root, "calls.jsonl");
  const childFile = join(root, "owned-child.json");
  const exitFile = join(root, "probe-exit.json");
  const put = (path, value) => {
    mkdirSync(dirname(join(suiteRoot, path)), { recursive: true });
    writeFileSync(join(suiteRoot, path), value);
  };
  const json = (path, value) => put(path, `${JSON.stringify(value, null, 2)}\n`);
  const change = (path, fn) => {
    const value = JSON.parse(readFileSync(join(suiteRoot, path), "utf8"));
    fn(value);
    json(path, value);
  };
  const { pkg, lock, installed } = graph(selectedVersion);
  json("package.json", pkg);
  json("package-lock.json", lock);
  for (const [name, value] of Object.entries(installed)) json(`node_modules/${name}/package.json`, value);
  json("node_modules/playwright-core/browsers.json", {
    browsers: [
      { name: "chromium", revision: "1248", browserVersion, installByDefault: true },
      { name: "chromium-headless-shell", revision: "1248", browserVersion, installByDefault: true },
      { name: "ffmpeg", revision: "1013", installByDefault: true },
    ],
  });
  const cli = `
const { appendFileSync } = require("node:fs");
appendFileSync(${JSON.stringify(log)}, JSON.stringify({kind:"cli",args:process.argv.slice(2),cwd:process.cwd(),env:process.env})+"\\n");
`;
  for (const name of Object.keys(installed)) put(`node_modules/${name}/cli.js`, cli);
  const moduleSource = `
const { appendFileSync, writeFileSync } = require("node:fs");
const { spawn } = require("node:child_process");
const log = value => appendFileSync(${JSON.stringify(log)}, JSON.stringify(value)+"\\n");
const mode = ${JSON.stringify(mode)};
let child;
const page = { url:()=>"about:blank", goto:async url=>{if(url!=="about:blank")throw Error("Unexpected target");}, close:async()=>log({kind:"page-close"}) };
const context = { newPage:async()=>page, close:async()=>log({kind:"context-close"}) };
exports.chromium = { launch:async options=>{
  log({kind:"launch",options:options??{},env:process.env});
  if(mode!=="normal") {
    child=spawn(process.execPath,["-e","setInterval(()=>{},1000)"],{detached:true,stdio:"ignore"});
    child.unref();
    writeFileSync(${JSON.stringify(childFile)},JSON.stringify({pid:child.pid}));
    process.on("exit",code=>{
      writeFileSync(${JSON.stringify(exitFile)},JSON.stringify({code}));
      try { process.kill(-child.pid,"SIGKILL"); } catch {}
    });
  }
  return {
    version:()=>${JSON.stringify(browserVersion)}, newContext:async()=>context, newPage:async()=>page,
    close:async()=>{
      log({kind:"browser-close"});
      if(mode==="hanging-close") {setInterval(()=>{},1000);return new Promise(()=>{});}
      if(mode==="blocked-close") {while(true){} }
    }
  };
} };
`;
  put("node_modules/playwright/index.js", moduleSource);
  put("node_modules/playwright/index.mjs", 'import api from "./index.js"; export const chromium = api.chromium;\n');
  for (const [name, target] of [
    ["@playwright/test", "../../playwright"],
    ["playwright-core", "../playwright"],
  ]) {
    put(`node_modules/${name}/index.js`, `module.exports = require(${JSON.stringify(`${target}/index.js`)});\n`);
    put(`node_modules/${name}/index.mjs`, `export { chromium } from ${JSON.stringify(`${target}/index.mjs`)};\n`);
  }
  const environment = {
    PATH: `${join(root, "untrusted-bin")}:/untrusted`,
    HOME: home,
    TMPDIR: temporary,
    LANG: "C",
    LC_ALL: "C",
    XDG_RUNTIME_DIR: temporary,
    CI: "untrusted",
    GITHUB_TOKEN: "synthetic-private-token",
    GH_TOKEN: "synthetic-gh-token",
    GATE_REVIEW_TOKEN: "synthetic-review-token",
    GITHUB_SHA: "f".repeat(40),
    GATE_ADMISSION_PATH: "/synthetic/private/admission.json",
    GATE_ADMISSION_SHA256: "f".repeat(64),
    NODE_OPTIONS: "--require=/must-not-load",
    NODE_PATH: "/must-not-load",
    npm_config_registry: "https://invalid.example",
    npm_config_cache: "/must-not-use",
    PLAYWRIGHT_BROWSERS_PATH: "/must-not-use",
    PLAYWRIGHT_DOWNLOAD_HOST: "https://invalid.example",
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "1",
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: "/must-not-use",
    XDG_CACHE_HOME: "/must-not-use",
    HTTPS_PROXY: "https://synthetic:secret@invalid.example",
    BASE_URL: "https://invalid.example",
    CONSUMER_COMMAND_LOG: "/must-not-use",
    __CF_USER_TEXT_ENCODING: "caller-value-must-not-copy",
  };
  const calls = () =>
    existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse) : [];
  const childPid = () => (existsSync(childFile) ? JSON.parse(readFileSync(childFile, "utf8")).pid : undefined);
  let childExited = false;
  t.after(async () => {
    const pid = childPid();
    if (!childExited && Number.isSafeInteger(pid) && pid > 1) {
      try {
        process.kill(-pid, "SIGKILL");
      } catch (error) {
        if (error.code !== "ESRCH") throw error;
      }
      await awaitOwnedExit(pid);
    }
    rmSync(root, { recursive: true, force: true });
  });
  return {
    root,
    suiteRoot,
    environment,
    put,
    json,
    change,
    calls,
    childPid,
    exitFile,
    markChildExited: () => {
      childExited = true;
    },
  };
}

/** A deterministic adapter records intent only; it never spawns a command or derives success from production output. */
function adapters({ platform = "linux", clock = 1000, outcome = () => ({}) } = {}) {
  const calls = [];
  let time = clock;
  return {
    calls,
    advance: (ms) => {
      time += ms;
    },
    value: {
      platform,
      now: () => time,
      run: async (call) => {
        calls.push(structuredClone({ ...call, signal: undefined }));
        return {
          exitCode: 0,
          signal: null,
          stdout: call.name === "probe" ? JSON.stringify(readiness) : "",
          timedOut: false,
          aborted: false,
          cleanup: "confirmed",
          ...(await outcome(call, calls.length)),
        };
      },
    },
  };
}

/** Closed result checks forbid raw environment/path/output fields while allowing independently measured durations. */
function record(result, { passed, ci = false, platform = "linux", verifiedMetadata = true } = {}) {
  assert.deepEqual(Object.keys(result).sort(), [...resultFields].sort());
  assert.equal(result.schemaVersion, 1);
  assert.equal(result.kind, "acceptance-browser-setup");
  assert.equal(result.productAcceptance, false);
  assert.equal(result.status, passed ? "passed" : "failed");
  assert.equal(result.ci, ci);
  assert.equal(result.platform, platform);
  if (verifiedMetadata === "either") {
    if (result.metadata !== null) assert.deepEqual(result.metadata, metadata);
  } else assert.deepEqual(result.metadata, verifiedMetadata ? metadata : null);
  assert(Array.isArray(result.steps));
  for (const step of result.steps) {
    assert.deepEqual(Object.keys(step).sort(), ["durationMs", "name", "status"]);
    assert(["install-deps", "install", "probe"].includes(step.name));
    assert(["passed", "failed"].includes(step.status));
    assert(Number.isFinite(step.durationMs) && step.durationMs >= 0);
  }
  assert(["not-started", "confirmed", "unverified"].includes(result.cleanup));
  if (passed) {
    assert.equal(result.failure, null);
    assert.equal(result.cleanup, "confirmed");
  } else {
    assert.deepEqual(Object.keys(result.failure).sort(), ["code", "stage"]);
    assert(["input", "metadata", "install-deps", "install", "probe"].includes(result.failure.stage));
    assert(
      [
        "metadata",
        "platform",
        "authority",
        "deadline",
        "command",
        "timeout",
        "abort",
        "output",
        "readiness",
        "cleanup",
      ].includes(result.failure.code),
    );
  }
}

/** Capture only the declared failure contract; asserting export availability is the caller's separate prerequisite. */
async function rejected(fn, f, options, injected, expected = {}) {
  const before = structuredClone(f.environment);
  let caught;
  try {
    await fn({ suiteRoot: f.suiteRoot, ci: false, environment: f.environment, deadline: 361000, ...options }, injected);
  } catch (error) {
    caught = error;
  }
  assert(caught instanceof Error, "Invalid setup must reject");
  record(caught.setupResult, { passed: false, verifiedMetadata: "either", ...expected });
  assert.deepEqual(f.environment, before, "Failure must not mutate caller environment");
  for (const secret of [f.root, "synthetic-private-token", "synthetic-gh-token", "must-not-load", "invalid.example"]) {
    assert(
      !`${caught.message}${JSON.stringify(caught.setupResult)}`.includes(secret),
      "Failure leaks raw input/output",
    );
  }
  return caught.setupResult;
}

test("DOCS-HARNESS exports the frozen preparation interface", () => {
  setup();
});

test("validated Linux CI uses package-local commands in fixed order and a closed sanitized result", async (t) => {
  const fn = setup();
  const f = fixture(t);
  const a = adapters();
  const before = structuredClone(f.environment);
  const result = await fn({ suiteRoot: f.suiteRoot, ci: true, environment: f.environment, deadline: 361000 }, a.value);
  record(result, { passed: true, ci: true });
  assert.deepEqual(
    a.calls.map((c) => c.name),
    ["install-deps", "install", "probe"],
  );
  for (const [i, args] of [
    [0, ["install-deps", "chromium"]],
    [1, ["install", "chromium"]],
  ]) {
    assert.deepEqual(a.calls[i].args, [join(f.suiteRoot, "node_modules/@playwright/test/cli.js"), ...args]);
  }
  for (const call of a.calls) {
    assert.equal(call.executable, process.execPath);
    assert.equal(call.cwd, f.suiteRoot);
  }
  assert.deepEqual(
    a.calls.map((c) => c.timeoutMs),
    [120000, 180000, 20000],
  );
  assert.deepEqual(f.environment, before);
});

test("local Linux and macOS never install OS packages and use a constructed minimal environment", async (t) => {
  const fn = setup();
  for (const platform of ["linux", "darwin"]) {
    const f = fixture(t);
    const a = adapters({ platform });
    const result = await fn(
      { suiteRoot: f.suiteRoot, ci: false, environment: f.environment, deadline: 361000 },
      a.value,
    );
    record(result, { passed: true, platform });
    assert.deepEqual(
      a.calls.map((c) => c.name),
      ["install", "probe"],
    );
    for (const call of a.calls)
      assert.deepEqual(call.env, {
        PATH: fixedPath,
        HOME: f.environment.HOME,
        TMPDIR: f.environment.TMPDIR,
        LANG: "C",
        LC_ALL: "C",
        XDG_RUNTIME_DIR: f.environment.XDG_RUNTIME_DIR,
        CI: "false",
      });
  }
});

test("optional environment fields may be absent and the validated CI boolean wins over inherited values", async (t) => {
  const fn = setup();
  const f = fixture(t);
  const a = adapters();
  f.environment = { HOME: f.environment.HOME, CI: "false", PATH: "/poison", GITHUB_TOKEN: "synthetic-private-token" };
  await fn({ suiteRoot: f.suiteRoot, ci: true, environment: f.environment, deadline: 361000 }, a.value);
  for (const call of a.calls) assert.deepEqual(call.env, { HOME: f.environment.HOME, PATH: fixedPath, CI: "true" });
});

test("supported CI authority and absolute extraction are mandatory before any process", async (t) => {
  const fn = setup();
  for (const options of [
    { ci: "true" },
    { ci: undefined },
    { suiteRoot: "relative-suite" },
    { environment: null },
    { deadline: NaN },
  ]) {
    const f = fixture(t);
    const a = adapters();
    const invalidCi = Object.hasOwn(options, "ci") && typeof options.ci !== "boolean";
    const result = await rejected(fn, f, options, a.value, { verifiedMetadata: false, ci: invalidCi ? null : false });
    if (invalidCi) assert.equal(result.failure.code, "authority");
    assert.equal(a.calls.length, 0);
  }
});

test("unsupported platform fails before subprocesses", async (t) => {
  const fn = setup();
  const f = fixture(t);
  const a = adapters({ platform: "win32" });
  let caught;
  try {
    await fn({ suiteRoot: f.suiteRoot, ci: false, environment: f.environment, deadline: 361000 }, a.value);
  } catch (error) {
    caught = error;
  }
  assert(caught instanceof Error);
  assert.equal(caught.setupResult.status, "failed");
  assert.equal(caught.setupResult.platform, null);
  assert.equal(caught.setupResult.failure.code, "platform");
  assert.equal(a.calls.length, 0);
});

test("every installed package version and chain link must match the selected lock", async (t) => {
  const fn = setup();
  const changes = [
    ["package.json", (p) => (p.devDependencies["@playwright/test"] = "1.65.0")],
    ["package-lock.json", (p) => (p.packages[""].devDependencies["@playwright/test"] = "1.65.0")],
    ...["@playwright/test", "playwright", "playwright-core"].map((name) => [
      `node_modules/${name}/package.json`,
      (p) => (p.version = "1.65.0"),
    ]),
    ["node_modules/@playwright/test/package.json", (p) => (p.dependencies.playwright = "1.65.0")],
    ["node_modules/playwright/package.json", (p) => (p.dependencies["playwright-core"] = "1.65.0")],
    ["package-lock.json", (p) => (p.packages["node_modules/playwright"].dependencies["playwright-core"] = "1.65.0")],
  ];
  for (const [path, change] of changes) {
    const f = fixture(t);
    const a = adapters();
    f.change(path, change);
    const result = await rejected(fn, f, {}, a.value, { verifiedMetadata: false });
    assert.equal(result.failure.code, "metadata");
    assert.equal(result.cleanup, "not-started");
    assert.equal(a.calls.length, 0);
  }
});

test("locked metadata determines the version rather than a second hardcoded Playwright allocator", async (t) => {
  const fn = setup();
  const f = fixture(t, { selectedVersion: "1.65.0" });
  const a = adapters();
  const result = await fn({ suiteRoot: f.suiteRoot, ci: false, environment: f.environment, deadline: 361000 }, a.value);
  assert.equal(result.status, "passed");
  assert.equal(result.metadata.playwrightVersion, "1.65.0");
});

test("missing, malformed and escaping installed paths cannot execute", async (t) => {
  const fn = setup();
  for (const mutate of [
    (f) => rmSync(join(f.suiteRoot, "node_modules/@playwright/test/cli.js")),
    (f) => f.put("node_modules/playwright-core/browsers.json", "{"),
    (f) => rmSync(join(f.suiteRoot, "node_modules/playwright/package.json")),
    (f) => {
      const path = join(f.suiteRoot, "node_modules/@playwright/test/cli.js");
      rmSync(path);
      symlinkSync(join(f.root, "external-cli.js"), path);
      writeFileSync(join(f.root, "external-cli.js"), "throw Error('Must not execute');");
    },
    (f) => {
      const path = join(f.suiteRoot, "node_modules/playwright/index.mjs");
      rmSync(path);
      symlinkSync(join(f.root, "external-module.mjs"), path);
      writeFileSync(join(f.root, "external-module.mjs"), "throw Error('Must not execute');");
    },
  ]) {
    const f = fixture(t);
    const a = adapters();
    mutate(f);
    await rejected(fn, f, {}, a.value, { verifiedMetadata: false });
    assert.equal(a.calls.length, 0);
  }
});

test("Chromium and headless-shell identity must be present, unique and coherent", async (t) => {
  const fn = setup();
  for (const mutate of [
    (p) => (p.browsers = p.browsers.filter((b) => b.name !== "chromium")),
    (p) => (p.browsers = p.browsers.filter((b) => b.name !== "chromium-headless-shell")),
    (p) => p.browsers.push({ ...p.browsers[0] }),
    (p) => (p.browsers[0].revision = "../outside"),
    (p) => (p.browsers[1].browserVersion = "155.0.0.1"),
  ]) {
    const f = fixture(t);
    const a = adapters();
    f.change("node_modules/playwright-core/browsers.json", mutate);
    await rejected(fn, f, {}, a.value, { verifiedMetadata: false });
    assert.equal(a.calls.length, 0);
  }
});

test("failed commands at each stage prevent all subsequent steps and retain bounded attribution", async (t) => {
  const fn = setup();
  for (const name of ["install-deps", "install", "probe"]) {
    const f = fixture(t);
    const a = adapters({
      outcome: (c) => (c.name === name ? { exitCode: 23, stdout: `${f.root} synthetic-private-token` } : {}),
    });
    const result = await rejected(fn, f, { ci: true }, a.value, { ci: true });
    assert.equal(result.failure.stage, name);
    assert.equal(result.failure.code, "command");
    assert.equal(a.calls.at(-1).name, name);
    assert.equal(result.steps.at(-1).status, "failed");
  }
});

test("signal, timeout, abort and uncertain cleanup can never become readiness", async (t) => {
  const fn = setup();
  for (const failure of [
    { signal: "SIGTERM", exitCode: null },
    { timedOut: true, exitCode: null },
    { aborted: true, exitCode: null },
    { cleanup: "unverified" },
  ]) {
    const f = fixture(t);
    const a = adapters({ outcome: (c) => (c.name === "install" ? failure : {}) });
    const result = await rejected(fn, f, {}, a.value);
    assert.equal(a.calls.length, 1);
    assert.equal(result.failure.stage, "install");
    if (failure.cleanup) assert.equal(result.cleanup, "unverified");
  }
});

test("malformed adapter outcomes and thrown diagnostics fail with a sanitized record", async (t) => {
  const fn = setup();
  for (const value of [null, {}, { exitCode: "0" }, { exitCode: 0, cleanup: "invented" }]) {
    const f = fixture(t);
    const a = adapters();
    a.value.run = async (call) => {
      a.calls.push(call);
      return value;
    };
    await rejected(fn, f, {}, a.value);
    assert.equal(a.calls.length, 1);
  }
  const f = fixture(t);
  const a = adapters();
  a.value.run = async () => {
    throw Error(`${f.root}: synthetic-private-token https://invalid.example`);
  };
  await rejected(fn, f, {}, a.value);
});

test("readiness requires exactly one closed matching record and a clean process result", async (t) => {
  const fn = setup();
  const invalid = [
    "",
    "download complete",
    "{}",
    JSON.stringify({ ...readiness, closed: false }),
    JSON.stringify({ ...readiness, browserVersion: "155.0.0.1" }),
    JSON.stringify({ ...readiness, extra: true }),
    `${JSON.stringify(readiness)}\n${JSON.stringify(readiness)}`,
    `${JSON.stringify(readiness)}\nextra`,
    JSON.stringify({ ...readiness, status: "failed" }),
    " ".repeat(1025) + JSON.stringify(readiness),
  ];
  for (const stdout of invalid) {
    const f = fixture(t);
    const a = adapters({ outcome: (c) => (c.name === "probe" ? { stdout } : {}) });
    const result = await rejected(fn, f, {}, a.value);
    assert.equal(result.failure.stage, "probe");
    assert(["readiness", "output"].includes(result.failure.code));
    assert.equal(result.cleanup, "unverified", "Absent valid close evidence cannot prove detached cleanup");
  }
});

test("probe output limit is inclusive and counts UTF-8 bytes rather than JavaScript characters", async (t) => {
  const fn = setup();
  const raw = JSON.stringify(readiness);
  const good = fixture(t);
  const a = adapters({
    outcome: (c) => (c.name === "probe" ? { stdout: raw + " ".repeat(1024 - Buffer.byteLength(raw)) } : {}),
  });
  record(await fn({ suiteRoot: good.suiteRoot, ci: false, environment: good.environment, deadline: 361000 }, a.value), {
    passed: true,
  });
  const bad = fixture(t);
  const b = adapters({ outcome: (c) => (c.name === "probe" ? { stdout: raw + "\u2003".repeat(350) } : {}) });
  const result = await rejected(fn, bad, {}, b.value);
  assert.equal(result.failure.code, "output");
});

test("shared monotonic deadline expires across setup calls instead of granting each suite a fresh budget", async (t) => {
  const fn = setup();
  const first = fixture(t);
  const second = fixture(t);
  const a = adapters();
  await fn({ suiteRoot: first.suiteRoot, ci: false, environment: first.environment, deadline: 361000 }, a.value);
  a.advance(361000);
  a.calls.length = 0;
  const result = await rejected(fn, second, {}, a.value);
  assert.equal(result.failure.code, "deadline");
  assert.equal(a.calls.length, 0);
});

test("remaining time bounds every stage and insufficient internal probe margin stops before launch", async (t) => {
  const fn = setup();
  const f = fixture(t);
  const a = adapters();
  a.value.run = async (call) => {
    a.calls.push(call);
    a.advance(85000);
    return { exitCode: 0, signal: null, stdout: "", timedOut: false, aborted: false, cleanup: "confirmed" };
  };
  const result = await rejected(fn, f, { deadline: 91000 }, a.value);
  assert.equal(a.calls[0].timeoutMs, 90000);
  assert.equal(a.calls.length, 1);
  assert.equal(result.failure.code, "deadline");
});

test("an already-aborted signal performs no process work", async (t) => {
  const fn = setup();
  const f = fixture(t);
  const a = adapters();
  const controller = new AbortController();
  controller.abort();
  const result = await rejected(fn, f, { signal: controller.signal }, a.value);
  assert.equal(result.failure.code, "abort");
  assert.equal(a.calls.length, 0);
});

test("abort during preparation reaches the adapter and blocks subsequent commands", async (t) => {
  const fn = setup();
  const f = fixture(t);
  const a = adapters();
  const controller = new AbortController();
  a.value.run = async (call) => {
    a.calls.push(call);
    assert.equal(call.signal, controller.signal);
    controller.abort();
    return { exitCode: 0, signal: null, stdout: "", timedOut: false, aborted: false, cleanup: "confirmed" };
  };
  await rejected(fn, f, { signal: controller.signal }, a.value);
  assert.equal(a.calls.length, 1);
});

test("real inert package programs prove sanitized launch/close ordering without browser or installer work", async (t) => {
  const fn = setup();
  const f = fixture(t);
  const result = await fn({
    suiteRoot: f.suiteRoot,
    ci: false,
    environment: f.environment,
    deadline: performance.now() + 30000,
  });
  record(result, { passed: true, platform: process.platform });
  const calls = f.calls();
  assert.deepEqual(calls[0].args, ["install", "chromium"]);
  assert(calls.findIndex((c) => c.kind === "launch") > 0);
  assert.equal(calls.at(-1).kind, "browser-close");
  const launch = calls.find((c) => c.kind === "launch");
  assert(
    Object.keys(launch.options).every((key) => key === "timeout"),
    "Probe cannot introduce sandbox/launch overrides",
  );
  for (const call of calls.filter((c) => c.env))
    requireActualChildEnvironment(call.env, {
      PATH: fixedPath,
      HOME: f.environment.HOME,
      TMPDIR: f.environment.TMPDIR,
      LANG: "C",
      LC_ALL: "C",
      XDG_RUNTIME_DIR: f.environment.XDG_RUNTIME_DIR,
      CI: "false",
    });
});

/** Account only for Darwin's runtime-generated key; adapter-visible input stays the original exact seven-key policy. */
function requireActualChildEnvironment(actual, expected) {
  const supplied = { ...actual };
  if (process.platform === "darwin" && Object.hasOwn(supplied, "__CF_USER_TEXT_ENCODING")) {
    assert.match(supplied.__CF_USER_TEXT_ENCODING, /^0x[0-9A-Fa-f]+:0x[0-9A-Fa-f]+:0x[0-9A-Fa-f]+$/);
    delete supplied.__CF_USER_TEXT_ENCODING;
  }
  assert.deepEqual(supplied, expected);
}

/** Run one fixture-owned driver with explicit host state; never mutate the test runner's real environment. */
function inertHost(f, source, { coverage, permission = false } = {}) {
  const script = join(f.root, "host-driver.mjs");
  writeFileSync(script, source);
  const permissionArgs = permission
    ? ["--permission", `--allow-fs-read=${dirname(fileURLToPath(helperUrl))}`, `--allow-fs-read=${f.root}`]
    : [];
  return spawnSync(process.execPath, [...permissionArgs, script], {
    cwd: f.root,
    env: {
      PATH: fixedPath,
      HOME: f.environment.HOME,
      TMPDIR: f.environment.TMPDIR,
      LANG: "C",
      CI: "false",
      // An own undefined key prevents the test driver's parent from adding unrelated ambient coverage configuration.
      NODE_V8_COVERAGE: coverage,
    },
    encoding: "utf8",
    timeout: 10000,
    maxBuffer: 1024 * 1024,
  });
}

test("real pinned-Node setup children suppress host NODE_V8_COVERAGE despite spawn normalization", (t) => {
  setup();
  const f = fixture(t);
  const coverage = join(f.root, "owned-coverage");
  mkdirSync(coverage);
  const host = inertHost(
    f,
    `
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {performance} from "node:perf_hooks";
import * as module from ${JSON.stringify(helperUrl.href)};
assert.equal(typeof module.prepareAcceptanceBrowser,"function","Missing helper cannot satisfy this regression");
assert.equal(process.env.NODE_V8_COVERAGE,${JSON.stringify(coverage)});
const control=spawnSync(process.execPath,["-e","process.stdout.write(JSON.stringify({coverage:process.env.NODE_V8_COVERAGE}))"],{
  env:{PATH:${JSON.stringify(fixedPath)},HOME:${JSON.stringify(f.environment.HOME)}},encoding:"utf8",timeout:3000,maxBuffer:4096,
});
assert.equal(control.error,undefined); assert.equal(control.status,0);
assert.equal(JSON.parse(control.stdout).coverage,process.env.NODE_V8_COVERAGE,"Pinned Node must actually demonstrate the inheritance hazard");
const result=await module.prepareAcceptanceBrowser({
  suiteRoot:${JSON.stringify(f.suiteRoot)},ci:false,environment:${JSON.stringify(f.environment)},deadline:performance.now()+20000,
});
process.stdout.write(JSON.stringify({positiveControl:true,result}));
`,
    { coverage },
  );
  assert.equal(host.error, undefined);
  assert.equal(host.status, 0, `${host.stdout}\n${host.stderr}`);
  const outcome = JSON.parse(host.stdout);
  assert.equal(outcome.positiveControl, true);
  record(outcome.result, { passed: true, platform: process.platform });
  const observed = f.calls().filter((call) => call.env);
  assert(observed.some((call) => call.kind === "cli") && observed.some((call) => call.kind === "launch"));
  for (const call of observed) {
    assert.equal(
      Object.hasOwn(call.env, "NODE_V8_COVERAGE"),
      false,
      "Host coverage must not enter an actual setup child",
    );
    requireActualChildEnvironment(call.env, {
      PATH: fixedPath,
      HOME: f.environment.HOME,
      TMPDIR: f.environment.TMPDIR,
      LANG: "C",
      LC_ALL: "C",
      XDG_RUNTIME_DIR: f.environment.XDG_RUNTIME_DIR,
      CI: "false",
    });
  }
});

test("an actual Node permission model refuses before metadata and any setup adapter operation", (t) => {
  setup();
  const f = fixture(t);
  const missing = join(f.root, "metadata-must-not-be-read");
  const host = inertHost(
    f,
    `
import assert from "node:assert/strict";
import {performance} from "node:perf_hooks";
import * as module from ${JSON.stringify(helperUrl.href)};
assert.equal(typeof module.prepareAcceptanceBrowser,"function","Missing helper is not permission refusal");
assert.equal(typeof process.permission,"object");
assert.equal(process.permission.has("fs.read",${JSON.stringify(f.root)}),true,"Driver must be able to read fixture metadata");
assert.equal(process.permission.has("child"),false,"Test must not disable the permission boundary");
const outcomes=[];
for(const suiteRoot of ${JSON.stringify([f.suiteRoot, missing])}) {
  let calls=0;
  const adapters={run:async command=>{
    calls++;
    return{exitCode:0,signal:null,stdout:command.name==="probe"?${JSON.stringify(JSON.stringify(readiness))}:"",timedOut:false,aborted:false,cleanup:"confirmed"};
  }};
  try {
    const result=await module.prepareAcceptanceBrowser({suiteRoot,ci:false,environment:${JSON.stringify(f.environment)},deadline:performance.now()+20000},adapters);
    outcomes.push({status:"returned",result,calls});
  } catch(error) {
    assert(error instanceof Error); assert(error.setupResult,"Import or fixture errors are not declared authority refusal");
    outcomes.push({status:"rejected",result:error.setupResult,calls});
  }
}
process.stdout.write(JSON.stringify({active:true,outcomes}));
`,
    { permission: true },
  );
  assert.equal(host.error, undefined);
  assert.equal(host.status, 0, `${host.stdout}\n${host.stderr}`);
  const evidence = JSON.parse(host.stdout);
  assert.equal(evidence.active, true);
  assert.equal(evidence.outcomes.length, 2);
  for (const outcome of evidence.outcomes) {
    assert.equal(
      outcome.status,
      "rejected",
      "Active permission model must fail even with valid metadata and inert adapters",
    );
    record(outcome.result, { passed: false, platform: process.platform, verifiedMetadata: false });
    assert.deepEqual(outcome.result.failure, { stage: "input", code: "authority" });
    assert.equal(outcome.result.cleanup, "not-started");
    assert.deepEqual(outcome.result.steps, []);
    assert.equal(outcome.calls, 0);
  }
  assert.deepEqual(f.calls(), []);
});

/** Check only an exact PID created and recorded by this fixture; never enumerate or target ambient host processes. */
async function awaitOwnedExit(pid) {
  const until = performance.now() + 3000;
  while (performance.now() < until) {
    try {
      process.kill(pid, 0);
    } catch (error) {
      if (error.code === "ESRCH") return;
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.fail("Fixture-owned detached child did not exit after its parent's normal-exit cleanup hook");
}

test(
  "inert detached browser with hanging close exits through the internal normal-exit deadline",
  { timeout: 25000 },
  async (t) => {
    const fn = setup();
    const f = fixture(t, { mode: "hanging-close" });
    const result = await rejected(fn, f, { deadline: performance.now() + 9000 }, undefined, {
      platform: process.platform,
    });
    assert.equal(result.cleanup, "unverified", "An attempted exit hook is not completed public close evidence");
    assert(existsSync(f.exitFile), "The normal-exit hook must run before a parent SIGKILL fallback");
    assert.notEqual(JSON.parse(readFileSync(f.exitFile, "utf8")).code, 0);
    assert(Number.isSafeInteger(f.childPid()));
    await awaitOwnedExit(f.childPid());
    f.markChildExited();
  },
);

test(
  "a blocked probe exposes detached-child survival and reports cleanup-unverified on forced termination",
  { timeout: 30000 },
  async (t) => {
    const fn = setup();
    const f = fixture(t, { mode: "blocked-close" });
    const result = await rejected(fn, f, { deadline: performance.now() + 8000 }, undefined, {
      platform: process.platform,
    });
    assert.equal(result.cleanup, "unverified");
    assert(!existsSync(f.exitFile), "SIGKILL must not be mistaken for normal exit");
    assert(Number.isSafeInteger(f.childPid()));
    assert.doesNotThrow(() => process.kill(f.childPid(), 0), "Separate child survives Node-group termination");
    // Fixture teardown explicitly kills this exact owned group; production must not infer that it was already gone.
  },
);
