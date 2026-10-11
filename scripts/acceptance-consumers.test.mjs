/**
 * Independent integration expectations for real phase/E2E CLI consumers and the release-workflow handoff validator.
 * Run `node --test scripts/acceptance-consumers.test.mjs` with pinned Node after consumer fixes are available.
 * Temporary Git histories use real archives and replacement refs. Synthetic npm records requests and materializes inert
 * package-local browser fixtures; synthetic Docker fails at its first boundary. The parent disables network entry
 * points. Sanitized browser children intentionally receive no NODE_OPTIONS and run only fixture-owned inert programs.
 * No real package/browser installation, network, apt, Docker or account environment is used. Fixtures always clean up.
 * These controls establish consumer selection/provenance behavior, never application acceptance or deployment.
 * Legacy workflow guard mutations use immutable protected Git source 2ae305c, read through bounded read-only Git.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parse } from "yaml";
import { requireReleaseWorkflow } from "./publish-release-evidence.mjs";

const repository = "example/private-mp3";
const registryPath = "docs/testing/acceptance-transitions.json";
const manifestPath = "tests/acceptance/fixtures/manifest.json";
const markerPath = "tests/acceptance/check.mjs";
const requiredMarker = "// REQUIRED synthetic suite; never executed.\n";
const candidateMarker = "// CANDIDATE synthetic suite; never executed.\n";
const replacementMarker = "// REPLACEMENT unreviewed suite; never executed.\n";
const phaseScript = fileURLToPath(new URL("./run-ci-phase.mjs", import.meta.url));
const e2eScript = fileURLToPath(new URL("./run-e2e.mjs", import.meta.url));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const browserVersion = "156.0.8078.4";

/** Independent synthetic lock; fake npm never downloads these declared packages or authenticates registry bytes. */
function browserPackage() {
  const pkg = {
    name: "synthetic-consumer-suite",
    version: "1.0.0",
    private: true,
    scripts: { check: "node check.mjs" },
    devDependencies: { "@playwright/test": "1.64.0" },
  };
  const packages = { "": { ...pkg } };
  for (const [name, child] of [
    ["@playwright/test", "playwright"],
    ["playwright", "playwright-core"],
    ["playwright-core", null],
  ]) {
    packages[`node_modules/${name}`] = {
      version: "1.64.0",
      resolved: `https://registry.npmjs.org/${name}/-/${name.split("/").at(-1)}-1.64.0.tgz`,
      integrity: `sha512-${Buffer.alloc(64, 7).toString("base64")}`,
      dev: true,
      ...(child ? { dependencies: { [child]: "1.64.0" } } : {}),
    };
  }
  return { pkg, lock: { name: pkg.name, version: pkg.version, lockfileVersion: 3, requires: true, packages } };
}

/** Serialized into fake npm, this writes inert package-local commands with fixture paths embedded, never env selectors. */
function materializeBrowserFixture(root, log, marker, failure, observedVersion) {
  const { mkdirSync, writeFileSync, readFileSync } = require("node:fs");
  const { dirname, join } = require("node:path");
  const put = (path, bytes) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), bytes);
  };
  const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
  for (const name of ["@playwright/test", "playwright", "playwright-core"]) {
    const entry = lock.packages[`node_modules/${name}`];
    put(
      `node_modules/${name}/package.json`,
      JSON.stringify({
        name,
        version: entry.version,
        main: "index.js",
        ...(entry.dependencies ? { dependencies: entry.dependencies } : {}),
        exports: {
          ".": { import: "./index.mjs", require: "./index.js", default: "./index.js" },
          "./package.json": "./package.json",
        },
        bin: { [name === "playwright-core" ? "playwright-core" : "playwright"]: "cli.js" },
      }),
    );
  }
  put(
    "node_modules/playwright-core/browsers.json",
    JSON.stringify({
      browsers: [
        { name: "chromium", revision: "1248", browserVersion: observedVersion, installByDefault: true },
        { name: "chromium-headless-shell", revision: "1248", browserVersion: observedVersion, installByDefault: true },
      ],
    }),
  );
  const prefix = `
const {appendFileSync}=require("node:fs");
const write=(name,extra={})=>appendFileSync(${JSON.stringify(log)},JSON.stringify({command:"browser",args:[name],cwd:process.cwd(),marker:${JSON.stringify(marker)},...extra})+"\\n");
const failure=${JSON.stringify(failure)};
const selected=${JSON.stringify(marker)}.includes(failure?.marker??"NEVER");
`;
  const cli = `${prefix}
write(process.argv[2],{args:process.argv.slice(2),env:process.env});
if(selected&&failure.stage===process.argv[2])process.exit(23);
`;
  for (const name of ["@playwright/test", "playwright", "playwright-core"]) put(`node_modules/${name}/cli.js`, cli);
  put(
    "node_modules/playwright/index.js",
    `${prefix}
const page={url:()=>"about:blank",goto:async url=>{if(url!=="about:blank")throw Error("Foreign target");},close:async()=>write("page-close")};
const context={newPage:async()=>page,close:async()=>write("context-close")};
exports.chromium={launch:async options=>{
  write("launch",{options:options??{},env:process.env});
  if(selected&&failure.stage==="probe")throw Error("Synthetic probe rejection");
  return{version:()=>${JSON.stringify(observedVersion)},newContext:async()=>context,newPage:async()=>page,close:async()=>write("browser-close")};
}};
`,
  );
  put("node_modules/playwright/index.mjs", 'import api from "./index.js"; export const chromium=api.chromium;\n');
  for (const [name, target] of [
    ["@playwright/test", "../../playwright"],
    ["playwright-core", "../playwright"],
  ]) {
    put(`node_modules/${name}/index.js`, `module.exports=require(${JSON.stringify(`${target}/index.js`)});\n`);
    put(`node_modules/${name}/index.mjs`, `export {chromium} from ${JSON.stringify(`${target}/index.mjs`)};\n`);
  }
}

/** Independent canonical JSON oracle for the fixture's synthetic trusted preflight output. */
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fixture(
  t,
  { policy = true, browserFailure = null, productPhase = "integration", expireAfterCandidate = false } = {},
) {
  const workspace = realpathSync(mkdtempSync(join(tmpdir(), "mp3-acceptance-consumers-")));
  t.after(() => rmSync(workspace, { recursive: true, force: true }));
  const root = join(workspace, "checkout");
  const bin = join(workspace, "bin");
  const temporary = join(workspace, "temporary");
  const home = join(workspace, "home");
  for (const path of [root, bin, temporary, home]) mkdirSync(path);
  const log = join(workspace, "commands.jsonl");
  const blocker = join(workspace, "deny-network.cjs");
  writeFileSync(
    blocker,
    `
const deny = () => { throw new Error("Synthetic consumer environment denies network"); };
globalThis.fetch = deny;
for (const name of ["node:http", "node:https"]) {
  const api = require(name); api.request = deny; api.get = deny;
}
const net = require("node:net"); net.connect = deny; net.createConnection = deny;
require("node:tls").connect = deny;
require("node:dgram").createSocket = deny;
require("node:module").syncBuiltinESMExports();
${
  expireAfterCandidate
    ? `
// Test-only monotonic clock: expire only after the candidate check has actually begun. No production env knob exists.
const fs=require("node:fs");
Object.defineProperty(require("node:perf_hooks").performance,"now",{value:()=>{
  const rows=fs.existsSync(${JSON.stringify(log)})?fs.readFileSync(${JSON.stringify(log)},"utf8").trim().split("\\n").filter(Boolean).map(JSON.parse):[];
  return rows.some(c=>c.command==="npm"&&c.args.join(" ")==="run check"&&c.marker?.includes("CANDIDATE"))?361001:1000;
}});
`
    : ""
}
`,
  );
  const env = {
    PATH: `${bin}:${dirname(process.execPath)}:/usr/bin:/bin`,
    HOME: home,
    TMPDIR: temporary,
    LANG: "C",
    CI: "false",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_ALLOW_PROTOCOL: "file",
    GIT_TERMINAL_PROMPT: "0",
    NODE_OPTIONS: `--require=${JSON.stringify(blocker)}`,
    CONSUMER_COMMAND_LOG: log,
  };
  writeFileSync(
    join(bin, "npm"),
    `#!${process.execPath}
const { appendFileSync, existsSync, readFileSync } = require("node:fs");
const { join } = require("node:path");
const args = process.argv.slice(2);
const marker = existsSync(join(process.cwd(), "check.mjs"))
  ? readFileSync(join(process.cwd(), "check.mjs"), "utf8") : null;
const trustedRoot = process.env.TRUSTED_ACCEPTANCE_ROOT;
const trustedMarker = trustedRoot ? readFileSync(join(trustedRoot, "check.mjs"), "utf8") : null;
appendFileSync(process.env.CONSUMER_COMMAND_LOG,
  JSON.stringify({ command: "npm", args, cwd: process.cwd(), marker, trustedRoot, trustedMarker }) + "\\n");
if(args[0]==="ci"&&process.env.CONSUMER_FAIL_FIRST_CI==="1")process.exit(29);
if (args[0] === "ci" && marker) {
  const failure=${JSON.stringify(browserFailure)};
  if(failure?.stage==="npm-ci"&&marker.includes(failure.marker))process.exit(23);
  (${materializeBrowserFixture.toString()})(process.cwd(), ${JSON.stringify(log)}, marker,
    ${JSON.stringify(browserFailure)}, ${JSON.stringify(browserVersion)});
}
if (args[0] === "run" && args[1] === "check" && marker?.includes("CANDIDATE")
  && process.env.CONSUMER_FAIL_CANDIDATE === "1") process.exit(23);
`,
    { mode: 0o755 },
  );
  writeFileSync(
    join(bin, "docker"),
    `#!${process.execPath}
const { appendFileSync } = require("node:fs");
appendFileSync(process.env.CONSUMER_COMMAND_LOG,
  JSON.stringify({ command: "docker", args: process.argv.slice(2), cwd: process.cwd() }) + "\\n");
console.error("Synthetic Docker boundary reached; no Docker operation performed");
process.exit(47);
`,
    { mode: 0o755 },
  );
  const rawGit = (...args) =>
    execFileSync("git", args, {
      cwd: root,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 10000,
    });
  const git = (...args) =>
    rawGit(...args)
      .toString("utf8")
      .trim();
  const put = (path, bytes) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), bytes);
  };
  const json = (path, value) => put(path, `${JSON.stringify(value, null, 2)}\n`);
  const commit = (message) => {
    git("add", "--all");
    git(
      "-c",
      "user.name=Independent Consumer Fixture",
      "-c",
      "user.email=consumer@example.invalid",
      "commit",
      "--quiet",
      "-m",
      message,
    );
    return git("rev-parse", "HEAD");
  };
  git("init", "--quiet", "--initial-branch=main");
  put(".gitignore", ".artifacts/\n");
  json("package.json", {
    private: true,
    scripts: {
      "test:unit": "node unused.mjs",
      build: "node unused.mjs",
      "test:e2e": "node unused.mjs",
      "test:gate": "node --test scripts/ci-gate.test.mjs",
    },
  });
  // Historical CI fixtures retain their real committed workflow; missing source policy cannot authorize a fallback.
  put(".github/workflows/ci.yml", dedupSource(".github/workflows/ci.yml", "2ae305c57c3ccb1ecbc6e7e6f9e8ae6d3894fcbf"));
  put("README.md", "Synthetic consumer fixture.\n");
  commit("foundation");
  const browser = browserPackage();
  json("tests/acceptance/package.json", browser.pkg);
  json("tests/acceptance/package-lock.json", browser.lock);
  put(markerPath, requiredMarker);
  json(manifestPath, { contractRevision: "r3", independentCount: 3 });
  put("docs/testing/acceptance-contract.md", "# Immutable synthetic r3 contract\n");
  const genesisCommit = commit("independent pre-product suite");
  const genesis = {
    schemaVersion: 1,
    contractRevision: "r3",
    suiteCommit: genesisCommit,
    suiteTree: git("rev-parse", `${genesisCommit}:tests/acceptance`),
    manifestSha256: sha256(readFileSync(join(root, manifestPath))),
    publicationStatus: "protected-main",
  };
  json("docs/testing/baseline.json", genesis);
  put("server/src/parser.ts", "// Synthetic product marker; never executed.\n");
  if (productPhase === "integration") {
    put("server/Dockerfile", "# Synthetic runtime marker; never built.\n");
    put("compose.yaml", "services: {}\n");
  }
  const product = commit("product after independent genesis");
  if (policy) json(registryPath, { schemaVersion: 1, transitions: [] });
  const source = policy ? commit("dormant transition policy") : product;
  env.CI_BASE_REF = policy ? product : genesisCommit;
  const commands = () =>
    existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse) : [];
  const invoke = (script, extra = {}) =>
    spawnSync(process.execPath, [script], {
      cwd: root,
      env: { ...env, ...extra },
      encoding: "utf8",
      timeout: 20000,
      maxBuffer: 2 * 1024 * 1024,
    });
  const candidate = () => {
    json(manifestPath, { contractRevision: "r4", independentCount: 3 });
    // A non-genesis synthetic suite declares its complete inert local inventory; no test body is executed here.
    json("tests/acceptance/fixtures/inventory.json", {
      contractRevision: "r4",
      cases: [{ file: "specs/synthetic.spec.ts", title: "Independent synthetic consumer case" }],
    });
    put(markerPath, candidateMarker);
    put("docs/testing/contracts/transport-r4.md", "# Independent candidate contract\n");
    const revision = commit("independent candidate only");
    env.CI_BASE_REF = source;
    return revision;
  };
  const bind = (suiteCommit) => {
    const reviewedTree = git("rev-parse", `${suiteCommit}^{tree}`);
    const reviewedHead = git(
      "-c",
      "user.name=Independent Consumer Fixture",
      "-c",
      "user.email=consumer@example.invalid",
      "commit-tree",
      reviewedTree,
      "-p",
      source,
      "-m",
      "Synthetic feature head before squash",
    );
    const entry = {
      id: "transport-r4",
      predecessor: "r3",
      contractRevision: "r4",
      contractPath: "docs/testing/contracts/transport-r4.md",
      contractSha256: sha256(readFileSync(join(root, "docs/testing/contracts/transport-r4.md"))),
      suiteCommit,
      suiteTree: git("rev-parse", `${suiteCommit}:tests/acceptance`),
      manifestSha256: sha256(readFileSync(join(root, manifestPath))),
      review: { repository, pullRequest: 3, reviewId: 7, reviewer: "independent-fixture", reviewedHead, reviewedTree },
    };
    json(registryPath, { schemaVersion: 1, transitions: [entry] });
    const revision = commit("Synthetic historical binding; never external approval");
    env.CI_BASE_REF = revision;
    return { revision, entry };
  };
  const activate = (binding) => {
    put("server/src/parser.ts", "// Changed synthetic product marker; never executed.\n");
    const revision = commit("Synthetic first successor implementation");
    env.CI_BASE_REF = binding.revision;
    return revision;
  };
  const extractRequired = () => {
    const suiteRoot = join(workspace, "required-suite");
    mkdirSync(suiteRoot);
    const files = git(
      "--no-replace-objects",
      "ls-tree",
      "-r",
      "--name-only",
      genesisCommit,
      "--",
      "tests/acceptance",
    ).split("\n");
    for (const path of files) {
      const destination = join(suiteRoot, path.slice("tests/acceptance/".length));
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, rawGit("--no-replace-objects", "show", `${genesisCommit}:${path}`));
    }
    return suiteRoot;
  };
  const ci = () => {
    const resolution = {
      genesis,
      required: genesis,
      candidate: null,
      pendingBinding: null,
      admission: "bootstrap",
      bindingCommit: null,
      activationCommit: null,
      policySha256: sha256(readFileSync(join(root, registryPath))),
    };
    const record = {
      schemaVersion: 1,
      kind: "ci-acceptance-admission",
      context: {
        repository,
        eventName: "push",
        ref: "refs/heads/main",
        sourceRevision: source,
        sourceTree: git("--no-replace-objects", "rev-parse", `${source}^{tree}`),
        baseRevision: product,
        workflowRevision: source,
        toolingRevision: product,
        runId: 42001,
        attempt: 1,
      },
      observedReviews: [],
      resolution,
    };
    const path = join(workspace, "admission.json");
    writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`);
    const digest = sha256(canonical(record));
    return {
      admission: { record, sha256: digest },
      env: {
        CI: "true",
        CI_BASE_REF: product,
        GITHUB_ACTIONS: "true",
        GITHUB_SERVER_URL: "https://github.com",
        GITHUB_API_URL: "https://api.github.com",
        GITHUB_REPOSITORY: repository,
        GITHUB_SHA: source,
        GITHUB_WORKFLOW_SHA: source,
        GITHUB_WORKFLOW_REF: `${repository}/.github/workflows/ci.yml@refs/heads/main`,
        GITHUB_EVENT_NAME: "push",
        GITHUB_REF: "refs/heads/main",
        GITHUB_RUN_ID: "42001",
        GITHUB_RUN_ATTEMPT: "1",
        GATE_ADMISSION_PATH: path,
        GATE_ADMISSION_SHA256: digest,
      },
    };
  };
  return {
    root,
    temporary,
    env,
    commands,
    invoke,
    git,
    put,
    commit,
    genesis,
    product,
    source,
    candidate,
    bind,
    activate,
    extractRequired,
    ci,
  };
}

function requireSuccess(result) {
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
}

function readReport(f) {
  return JSON.parse(readFileSync(join(f.root, ".artifacts/e2e-result.json"), "utf8"));
}

test("phase consumer isolates candidate controls from the required suite and ignores replacement-ref bytes", (t) => {
  const f = fixture(t);
  const candidate = f.candidate();
  requireSuccess(f.invoke(phaseScript));
  const commands = f.commands();
  const checks = commands.filter(({ command, args }) => command === "npm" && args.join(" ") === "run check");
  assert.deepEqual(checks.map(({ marker }) => marker).sort(), [candidateMarker, requiredMarker].sort());
  assert.notEqual(checks[0].cwd, checks[1].cwd);
  for (const check of checks) {
    assert(relative(f.root, check.cwd).startsWith(".."), "Both checked suites must be outside the checkout");
    assert.equal(existsSync(check.cwd), false, "Temporary checkouts must be removed");
  }
  const e2e = commands.filter(({ command, args }) => command === "npm" && args.join(" ") === "run test:e2e");
  assert.equal(e2e.length, 1);
  assert.equal(e2e[0].trustedMarker, requiredMarker);
  const candidateEvidence = JSON.parse(readFileSync(join(f.root, ".artifacts/acceptance-candidate.json"), "utf8"));
  assert.equal(candidateEvidence.kind, "candidate-harness-controls");
  assert.equal(candidateEvidence.suiteCommit, candidate);
  assert.equal(candidateEvidence.status, "passed");
  assert.equal(candidateEvidence.productAcceptance, false);
  assert.deepEqual(readdirSync(f.temporary), []);

  const replaced = fixture(t);
  replaced.git("checkout", "--quiet", "-b", "unreviewed-replacement", replaced.genesis.suiteCommit);
  replaced.put(markerPath, replacementMarker);
  const substitute = replaced.commit("unreviewed replacement object");
  replaced.git("checkout", "--quiet", "main");
  replaced.git("replace", replaced.genesis.suiteCommit, substitute);
  assert.equal(replaced.git("show", `${replaced.genesis.suiteCommit}:${markerPath}`), replacementMarker.trim());
  assert.equal(
    replaced.git("--no-replace-objects", "show", `${replaced.genesis.suiteCommit}:${markerPath}`),
    requiredMarker.trim(),
  );
  requireSuccess(replaced.invoke(phaseScript));
  const replacedE2e = replaced.commands().find(({ args }) => args.join(" ") === "run test:e2e");
  assert.equal(replacedE2e.trustedMarker, requiredMarker, "Extraction must use the admitted original object");
  const result = replaced.invoke(e2eScript, { TRUSTED_ACCEPTANCE_ROOT: replaced.extractRequired() });
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  assert.equal(
    replaced.commands().filter(({ command }) => command === "docker").length,
    1,
    "Original extracted bytes must pass verification and reach the synthetic Docker boundary",
  );
  assert.equal(readReport(replaced).suiteTree, replaced.genesis.suiteTree);
});

test("failed candidate controls remain failure evidence and cannot run product acceptance; extraction is cleaned", (t) => {
  const f = fixture(t);
  f.candidate();
  const result = f.invoke(phaseScript, { CONSUMER_FAIL_CANDIDATE: "1" });
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  const evidence = JSON.parse(readFileSync(join(f.root, ".artifacts/acceptance-candidate.json"), "utf8"));
  assert.equal(evidence.kind, "candidate-harness-controls");
  assert.equal(evidence.status, "failed");
  assert.equal(evidence.productAcceptance, false);
  assert(f.commands().some(({ args, marker }) => args.join(" ") === "run check" && marker === candidateMarker));
  assert(
    f.commands().every(({ cwd }) => cwd !== f.root),
    "Product scripts must not run after candidate failure",
  );
  assert.equal(existsSync(join(f.root, ".artifacts/e2e-result.json")), false);
  assert.deepEqual(readdirSync(f.temporary), []);
});

test("E2E pre-Docker failures retain only the correct legacy, local or CI selection fields", (t) => {
  for (const kind of ["legacy", "local", "ci"]) {
    const f = fixture(t, { policy: kind !== "legacy" });
    const ci = kind === "ci" ? f.ci() : undefined;
    const result = f.invoke(e2eScript, { TRUSTED_ACCEPTANCE_ROOT: f.extractRequired(), ...ci?.env });
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0, "Synthetic Docker failure cannot pass E2E");
    assert.equal(f.commands().filter(({ command }) => command === "docker").length, 1);
    const report = readReport(f);
    assert.equal(report.status, "failed");
    assert.equal(report.cleanup, "passed");
    assert.equal(report.acceptance.status, "blocked");
    assert.equal(report.sourceRevision, f.source);
    assert.equal(report.suiteCommit, f.genesis.suiteCommit);
    assert.equal(report.suiteTree, f.genesis.suiteTree);
    assert.equal(report.manifestSha256, f.genesis.manifestSha256);
    assert.equal(Object.hasOwn(report, "acceptanceAdmission"), kind === "ci");
    assert.equal(Object.hasOwn(report, "localSelection"), kind === "local");
    if (kind === "ci") assert.deepEqual(report.acceptanceAdmission, ci.admission);
    if (kind === "local") {
      assert.equal(report.localSelection.kind, "local-acceptance-resolution");
      assert.equal(report.localSelection.sourceRevision, f.source);
      assert.equal(report.localSelection.baseRevision, f.product);
      assert.deepEqual(report.localSelection.resolution.required, f.genesis);
    }
    assert.deepEqual(readdirSync(f.temporary), []);
  }
});

test("historical workflow policy requires exact independent admission path and digest handoff to both consumers", () => {
  const workflow = parse(
    execFileSync(
      "git",
      ["--no-replace-objects", "show", "2ae305c57c3ccb1ecbc6e7e6f9e8ae6d3894fcbf:.github/workflows/ci.yml"],
      {
        cwd: fileURLToPath(new URL("../", import.meta.url)),
        encoding: "utf8",
        timeout: 30_000,
        maxBuffer: 128 * 1024,
      },
    ),
  );
  requireReleaseWorkflow(workflow);
  for (const command of ["node scripts/run-ci-phase.mjs", "node scripts/publish-release-bundle.mjs"]) {
    for (const mutate of [
      (step) => delete step.env,
      (step) => delete step.env.GATE_ADMISSION_PATH,
      (step) => delete step.env.GATE_ADMISSION_SHA256,
      (step) => (step.env.GATE_ADMISSION_PATH = ".artifacts/admission.json"),
      (step) => (step.env.GATE_ADMISSION_SHA256 = "${{ steps.release-bundle.outputs.admission-sha256 }}"),
      (step) => (step.env.GITHUB_SHA = "0".repeat(40)),
    ]) {
      const invalid = structuredClone(workflow);
      mutate(invalid.jobs["validate-product"].steps.find((step) => step.run === command));
      assert.throws(() => requireReleaseWorkflow(invalid), `Untrusted or absent consumer handoff: ${command}`);
    }
  }
});

/** Assert operation order at one extraction; a successful fake check cannot conceal missing or late preparation. */
function requireBrowserOrder(commands, marker, { ci = false } = {}) {
  const selected = commands.filter((c) => c.marker === marker);
  const sequence = selected.map((c) => (c.command === "npm" ? `npm ${c.args.join(" ")}` : c.args[0]));
  assert.equal(sequence[0], "npm ci");
  assert.equal(sequence.at(-1), "npm run check");
  const preparation = sequence.filter((name) => ["install-deps", "install", "launch", "browser-close"].includes(name));
  assert.deepEqual(
    preparation,
    ci ? ["install-deps", "install", "launch", "browser-close"] : ["install", "launch", "browser-close"],
  );
  assert(sequence.indexOf("browser-close") < sequence.indexOf("npm run check"));
  const cwd = selected[0].cwd;
  assert(selected.every((c) => c.cwd === cwd));
  assert.equal(existsSync(cwd), false, "Selected extraction is removed only after its setup/check work ends");
}

/** Read the frozen setup-only evidence schema; these synthetic records are never real CI or product acceptance. */
function browserEvidence(f) {
  const value = JSON.parse(readFileSync(join(f.root, ".artifacts/acceptance-browser-setup.json"), "utf8"));
  assert.deepEqual(Object.keys(value).sort(), [
    "entries",
    "kind",
    "productAcceptance",
    "schemaVersion",
    "sourceRevision",
  ]);
  assert.equal(value.schemaVersion, 1);
  assert.equal(value.kind, "acceptance-browser-preparation");
  assert.equal(value.productAcceptance, false);
  assert.equal(value.sourceRevision, f.git("rev-parse", "HEAD"));
  for (const entry of value.entries) {
    assert.deepEqual(Object.keys(entry).sort(), ["manifestSha256", "result", "role", "suiteCommit", "suiteTree"]);
    assert(["candidate", "pending", "required"].includes(entry.role));
    assert.equal(entry.suiteTree, f.git("--no-replace-objects", "rev-parse", `${entry.suiteCommit}:tests/acceptance`));
    const raw = f.git("--no-replace-objects", "show", `${entry.suiteCommit}:${manifestPath}`);
    assert.equal(entry.manifestSha256, sha256(`${raw}\n`));
    assert.equal(entry.result.kind, "acceptance-browser-setup");
    assert.equal(entry.result.productAcceptance, false);
    assert(["passed", "failed"].includes(entry.result.status));
  }
  return value;
}

test("real phase runner prepares candidate then required suites before checks and root scripts", (t) => {
  const f = fixture(t);
  const candidate = f.candidate();
  requireSuccess(f.invoke(phaseScript));
  const commands = f.commands();
  requireBrowserOrder(commands, candidateMarker);
  requireBrowserOrder(commands, requiredMarker);
  const rootStart = commands.findIndex((c) => c.cwd === f.root);
  assert(rootStart > commands.findLastIndex((c) => c.command === "browser"));
  assert.deepEqual(
    commands.slice(rootStart).map((c) => c.args),
    [
      ["run", "test:unit"],
      ["run", "build"],
      ["run", "test:e2e"],
    ],
  );
  const evidence = browserEvidence(f);
  assert.deepEqual(
    evidence.entries.map((e) => [e.role, e.suiteCommit]),
    [
      ["candidate", candidate],
      ["required", f.genesis.suiteCommit],
    ],
  );
  assert(evidence.entries.every((e) => e.result.status === "passed"));
  assert.deepEqual(readdirSync(f.temporary), []);
});

test("real phase runner preserves pending setup and prepares only the successor after activation", (t) => {
  for (const activated of [false, true]) {
    const f = fixture(t);
    const candidate = f.candidate();
    const binding = f.bind(candidate);
    if (activated) f.activate(binding);
    requireSuccess(f.invoke(phaseScript));
    requireBrowserOrder(f.commands(), candidateMarker);
    if (!activated) requireBrowserOrder(f.commands(), requiredMarker);
    else assert(!f.commands().some((c) => c.marker === requiredMarker));
    const evidence = browserEvidence(f);
    assert.deepEqual(
      evidence.entries.map((e) => [e.role, e.suiteCommit]),
      activated
        ? [["required", candidate]]
        : [
            ["pending", candidate],
            ["required", f.genesis.suiteCommit],
          ],
    );
    const rootE2E = f.commands().find((c) => c.command === "npm" && c.args.join(" ") === "run test:e2e");
    assert.equal(rootE2E.trustedMarker, activated ? candidateMarker : requiredMarker);
    assert.deepEqual(readdirSync(f.temporary), []);
  }
});

test("parser phase also prepares its selected required suite without inventing an E2E command", (t) => {
  const f = fixture(t, { productPhase: "parser" });
  requireSuccess(f.invoke(phaseScript));
  requireBrowserOrder(f.commands(), requiredMarker);
  assert.deepEqual(
    f
      .commands()
      .filter((c) => c.cwd === f.root)
      .map((c) => c.args),
    [
      ["run", "test:unit"],
      ["run", "build"],
    ],
  );
  assert.deepEqual(
    browserEvidence(f).entries.map((e) => e.role),
    ["required"],
  );
});

test("validated CI reaches the Linux-only OS setup branch through the real consumer context", (t) => {
  const f = fixture(t);
  const ci = f.ci();
  requireSuccess(f.invoke(phaseScript, ci.env));
  requireBrowserOrder(f.commands(), requiredMarker, { ci: process.platform === "linux" });
  const evidence = browserEvidence(f);
  assert.equal(evidence.entries[0].result.ci, true);
  const installs = f.commands().filter((c) => c.command === "browser");
  assert(
    installs.every(
      (c) => !c.env || (!Object.hasOwn(c.env, "GATE_ADMISSION_PATH") && !Object.hasOwn(c.env, "GITHUB_SHA")),
    ),
  );
});

test("candidate and required install/probe failures stop later checks and retain only attempted setup evidence", (t) => {
  for (const marker of ["CANDIDATE", "REQUIRED"])
    for (const stage of ["install", "probe"]) {
      const f = fixture(t, { browserFailure: { marker, stage } });
      if (marker === "CANDIDATE") f.candidate();
      const result = f.invoke(phaseScript);
      assert.equal(result.error, undefined);
      assert.notEqual(result.status, 0, "Injected setup failure must reach the real runner");
      assert(!f.commands().some((c) => c.command === "npm" && c.args.join(" ") === "run check"));
      assert(!f.commands().some((c) => c.cwd === f.root));
      const evidence = browserEvidence(f);
      assert.equal(evidence.entries.length, 1);
      assert.equal(evidence.entries[0].role, marker === "CANDIDATE" ? "candidate" : "required");
      assert.equal(evidence.entries[0].result.status, "failed");
      if (marker === "CANDIDATE") {
        const candidate = JSON.parse(readFileSync(join(f.root, ".artifacts/acceptance-candidate.json"), "utf8"));
        assert.equal(candidate.status, "failed");
        assert.equal(candidate.productAcceptance, false);
      }
      assert.deepEqual(readdirSync(f.temporary), []);
    }
});

test("successful readiness cannot conceal a later standalone check failure", (t) => {
  const f = fixture(t);
  f.candidate();
  const result = f.invoke(phaseScript, { CONSUMER_FAIL_CANDIDATE: "1" });
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  requireBrowserOrder(f.commands(), candidateMarker);
  assert(!f.commands().some((c) => c.marker === requiredMarker || c.cwd === f.root));
  const evidence = browserEvidence(f);
  assert.equal(evidence.entries.length, 1);
  assert.equal(evidence.entries[0].result.status, "passed");
  assert.deepEqual(readdirSync(f.temporary), []);
});

test("actual runner shares the first preparation deadline through intervening candidate checks", (t) => {
  const f = fixture(t, { expireAfterCandidate: true });
  f.candidate();
  const result = f.invoke(phaseScript);
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0, "A fresh per-suite deadline would wrongly pass");
  requireBrowserOrder(f.commands(), candidateMarker);
  assert(
    !f
      .commands()
      .some((c) => c.marker === requiredMarker && (c.command === "browser" || c.args.join(" ") === "run check")),
  );
  assert(!f.commands().some((c) => c.cwd === f.root));
  const evidence = browserEvidence(f);
  assert.deepEqual(
    evidence.entries.map((e) => e.role),
    ["candidate", "required"],
  );
  assert.equal(evidence.entries[0].result.status, "passed");
  assert.equal(evidence.entries[1].result.failure.code, "deadline");
  assert.deepEqual(readdirSync(f.temporary), []);
});

test("npm failure before setup creates no invented browser evidence for that extraction", (t) => {
  const f = fixture(t, { browserFailure: { marker: "REQUIRED", stage: "npm-ci" } });
  f.candidate();
  const result = f.invoke(phaseScript);
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  requireBrowserOrder(f.commands(), candidateMarker);
  assert(!f.commands().some((c) => c.marker === requiredMarker && c.command === "browser"));
  assert.deepEqual(
    browserEvidence(f).entries.map((e) => e.role),
    ["candidate"],
  );
  assert.deepEqual(readdirSync(f.temporary), []);
});

test("a same-source rerun clears old passing browser evidence before its first npm failure", (t) => {
  const f = fixture(t);
  requireSuccess(f.invoke(phaseScript));
  const prior = browserEvidence(f);
  assert.equal(prior.entries.length, 1);
  assert.equal(prior.entries[0].result.status, "passed");
  const commandCount = f.commands().length;
  const result = f.invoke(phaseScript, { CONSUMER_FAIL_FIRST_CI: "1" });
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  assert.equal(f.git("rev-parse", "HEAD"), prior.sourceRevision, "The failing rerun must use the exact same source");
  const attempted = f.commands().slice(commandCount);
  assert.equal(attempted.length, 1);
  assert.equal(attempted[0].command, "npm");
  assert.deepEqual(attempted[0].args, ["ci"]);
  const current = browserEvidence(f);
  assert.deepEqual(
    current.entries,
    [],
    "A pre-setup failure must replace stale passing evidence with a fresh empty record",
  );
  assert.deepEqual(readdirSync(f.temporary), []);
});

test("historical foundation and acceptance phases gain no browser installation privilege", (t) => {
  for (const phase of ["foundation", "acceptance"]) {
    const f = fixture(t);
    const revision = phase === "acceptance" ? f.genesis.suiteCommit : f.git("rev-parse", `${f.genesis.suiteCommit}^`);
    f.git("checkout", "--quiet", "--detach", revision);
    f.env.CI_BASE_REF = revision;
    requireSuccess(f.invoke(phaseScript));
    assert(!f.commands().some((c) => c.command === "browser"));
    assert.equal(existsSync(join(f.root, ".artifacts/acceptance-browser-setup.json")), false);
    if (phase === "acceptance")
      assert.deepEqual(
        f.commands().map((c) => c.args),
        [["ci"], ["run", "check"]],
      );
    else assert.deepEqual(f.commands(), []);
  }
});

/**
 * Independent deduplication inputs are immutable reviewed workflow bytes, not expected resolver output. These owned
 * histories and inert commands establish authority and consumer ordering only; they do not execute application tests.
 */
const dedupSourceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const dedupSourceRevision = "c91b4ea3805c7825563e974588681ee8a86c5dbc";
const dedupSnapshotBytes = readFileSync(new URL("./fixtures/ci-dedup-inputs.mjs", import.meta.url));
assert.equal(sha256(dedupSnapshotBytes), "0647ed71b0a194a1bba5b4f45f0f1d830ce3243819327b935091446bb4dfbd5d");
const { ciDedupInputs } = await import("./fixtures/ci-dedup-inputs.mjs");
assert.equal(ciDedupInputs.schemaVersion, 1);
assert.equal(ciDedupInputs.sourceRevision, dedupSourceRevision);
const dedupWorkflowPaths = [
  ".github/workflows/ci.yml",
  ".github/workflows/linter.yml",
  ".github/workflows/base-acceptance-e2e.yml",
  ".github/workflows/application-tests.yml",
  ".github/workflows/server-tests.yml",
];
const { resolveAcceptance: resolveDedupFixtureAcceptance } = await import("./acceptance-baseline.mjs");
const { stringify: stringifyDedupYaml } = await import("yaml");

function dedupSource(path, revision = dedupSourceRevision) {
  if (revision === dedupSourceRevision) {
    if (path === "package.json") return JSON.stringify({ scripts: ciDedupInputs.packageScripts });
    assert(Object.hasOwn(ciDedupInputs.workflows, path), "Unknown immutable deduplication workflow input");
    return ciDedupInputs.workflows[path];
  }
  assert.equal(revision, "2ae305c57c3ccb1ecbc6e7e6f9e8ae6d3894fcbf");
  assert.equal(path, ".github/workflows/ci.yml");
  return execFileSync("git", ["--no-replace-objects", "show", `${revision}:${path}`], {
    cwd: dedupSourceRoot,
    encoding: "utf8",
    timeout: 10000,
    maxBuffer: 256 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function dedupFixture(t, { legacy = false } = {}) {
  const f = fixture(t);
  const paths = legacy ? dedupWorkflowPaths.slice(0, 1) : dedupWorkflowPaths;
  for (const path of paths) {
    f.put(path, dedupSource(path, legacy ? "2ae305c57c3ccb1ecbc6e7e6f9e8ae6d3894fcbf" : dedupSourceRevision));
  }
  const pkg = JSON.parse(readFileSync(join(f.root, "package.json"), "utf8"));
  const reviewed = JSON.parse(dedupSource("package.json"));
  // Keep product declarations unchanged; only independent gate/tool inventory inputs enter this governance commit.
  pkg.scripts["test:gate"] = reviewed.scripts["test:gate"];
  pkg.scripts["test:tooling"] = reviewed.scripts["test:tooling"];
  f.put("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
  f.visibilityRevision = f.commit("Synthetic reviewed CI family input; no actual CI authority");
  return f;
}

function dedupAdmission(f, baseRevision = f.product) {
  const original = f.ci();
  const sourceRevision = f.git("--no-replace-objects", "rev-parse", "HEAD");
  const record = structuredClone(original.admission.record);
  Object.assign(record.context, {
    sourceRevision,
    sourceTree: f.git("--no-replace-objects", "rev-parse", `${sourceRevision}^{tree}`),
    baseRevision,
    workflowRevision: sourceRevision,
    toolingRevision: baseRevision,
  });
  // Reuse the original validator to construct synthetic admission, never the proposed command-plan oracle.
  record.resolution = resolveDedupFixtureAcceptance(f.root, { sourceRevision, trustedBase: baseRevision });
  writeFileSync(original.env.GATE_ADMISSION_PATH, `${JSON.stringify(record, null, 2)}\n`);
  return {
    ...original.env,
    CI_BASE_REF: baseRevision,
    GITHUB_SHA: sourceRevision,
    GITHUB_WORKFLOW_SHA: sourceRevision,
    GITHUB_JOB: "validate-product",
    GATE_ADMISSION_SHA256: sha256(canonical(record)),
  };
}

function dedupProbe(f, mode = "resolve") {
  const path = join(f.root, ".artifacts/dedup-probe.mjs");
  f.put(
    ".artifacts/dedup-probe.mjs",
    `import assert from "node:assert/strict";
const subject = await import(${JSON.stringify(new URL("./run-ci-phase.mjs", import.meta.url).href)});
assert.equal(typeof subject.resolvePhaseExecution, "function", "The real phase resolver export must exist");
${
  mode === "import"
    ? 'console.log("DEDUP_IMPORT_INERT");'
    : `const plan = subject.resolvePhaseExecution(process.cwd(), process.env);
assert(!(plan instanceof Promise), "Phase resolution remains synchronous");
assert.deepEqual(Object.keys(plan).sort(), ["phase", "rootScripts", "selection"]);
console.log("DEDUP_PLAN=" + JSON.stringify(plan));`
}
`,
  );
  return path;
}

function dedupPlan(f, env = {}) {
  const result = f.invoke(dedupProbe(f), env);
  requireSuccess(result);
  const line = result.stdout.split("\n").find((value) => value.startsWith("DEDUP_PLAN="));
  assert(line, "The actual synchronous resolver must return its closed plan");
  return JSON.parse(line.slice("DEDUP_PLAN=".length));
}

function dedupRootScripts(f) {
  return f
    .commands()
    .filter((c) => c.command === "npm" && c.cwd === f.root)
    .map((c) => c.args.join(" "));
}

function dedupRefusal(f, env) {
  const result = f.invoke(phaseScript, env);
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0, "Invalid deduplication authority must refuse, not run a successful fallback");
  assert.deepEqual(f.commands(), [], "Refusal must precede installation, browser setup and product commands");
  assert.deepEqual(readdirSync(f.temporary), []);
}

test("dedup: the synchronous phase resolver is available and importing it has no command or setup effects", (t) => {
  const f = dedupFixture(t);
  requireSuccess(f.invoke(dedupProbe(f, "import")));
  assert.deepEqual(f.commands(), []);
  assert.deepEqual(readdirSync(f.temporary), []);
  assert.equal(existsSync(join(f.root, ".artifacts/acceptance-browser-setup.json")), false);
  const plan = dedupPlan(f);
  assert.equal(plan.phase, "integration");
  assert.deepEqual(plan.rootScripts, ["test:unit", "build", "test:e2e"]);
  assert.equal(plan.selection.localSelection.kind, "local-acceptance-resolution");
  assert.equal(plan.selection.admission, undefined);
  assert.deepEqual(f.commands(), [], "Resolution reads authority without running acceptance");
});

test("dedup: admitted split CI runs only root E2E after the original required-suite browser controls", (t) => {
  const f = dedupFixture(t);
  const env = dedupAdmission(f);
  requireSuccess(f.invoke(phaseScript, env));
  assert.deepEqual(dedupRootScripts(f), ["run test:e2e"]);
  requireBrowserOrder(f.commands(), requiredMarker, { ci: process.platform === "linux" });
  const requiredCheck = f.commands().findIndex((c) => c.command === "npm" && c.args.join(" ") === "run check");
  const e2e = f.commands().findIndex((c) => c.command === "npm" && c.cwd === f.root);
  assert(requiredCheck < e2e);
  assert.equal(f.commands()[e2e].trustedMarker, requiredMarker);
  assert.deepEqual(readdirSync(f.temporary), []);
  const plan = dedupPlan(f, env);
  assert.deepEqual(plan.rootScripts, ["test:e2e"]);
  assert.equal(plan.selection.admission.record.context.sourceRevision, env.GITHUB_SHA);
  assert.equal(plan.selection.admission.sha256, env.GATE_ADMISSION_SHA256);
});

test("dedup: local split and admitted legacy CI retain all root units, host builds and E2E", (t) => {
  for (const legacy of [false, true]) {
    const f = dedupFixture(t, { legacy });
    const env = legacy ? dedupAdmission(f) : { CI_VISIBILITY_VARIANT: "reusable-v1", CI_SKIP_UNIT_BUILD: "true" };
    if (legacy) delete env.GITHUB_JOB;
    requireSuccess(f.invoke(phaseScript, env));
    assert.deepEqual(dedupRootScripts(f), ["run test:unit", "run build", "run test:e2e"]);
    const plan = dedupPlan(f, env);
    assert.deepEqual(plan.rootScripts, ["test:unit", "build", "test:e2e"]);
    assert.equal(Boolean(plan.selection.admission), legacy);
  }
});

test("dedup: wrong or absent reusable acceptance job identity refuses before any child work", (t) => {
  const available = dedupFixture(t);
  requireSuccess(available.invoke(phaseScript, dedupAdmission(available)));
  for (const job of [undefined, "application", "server", "control-plane"]) {
    const f = dedupFixture(t);
    const env = dedupAdmission(f);
    if (job === undefined) delete env.GITHUB_JOB;
    else env.GITHUB_JOB = job;
    dedupRefusal(f, env);
  }
});

test("dedup: committed application and server ownership must pass the full graph, not its layout classifier", (t) => {
  const available = dedupFixture(t);
  requireSuccess(available.invoke(phaseScript, dedupAdmission(available)));
  for (const mutation of ["application-caller", "server-caller", "application-command", "server-condition", "gate"]) {
    const f = dedupFixture(t);
    if (mutation.endsWith("caller")) {
      const workflow = parse(readFileSync(join(f.root, dedupWorkflowPaths[0]), "utf8"));
      delete workflow.jobs[mutation === "application-caller" ? "application-tests" : "server-tests"];
      f.put(dedupWorkflowPaths[0], stringifyDedupYaml(workflow));
    } else if (mutation === "gate") {
      const pkg = JSON.parse(readFileSync(join(f.root, "package.json"), "utf8"));
      pkg.scripts["test:gate"] = "node --test scripts/ci-gate.test.mjs";
      f.put("package.json", `${JSON.stringify(pkg)}\n`);
    } else {
      const path = mutation === "application-command" ? dedupWorkflowPaths[3] : dedupWorkflowPaths[4];
      const workflow = parse(readFileSync(join(f.root, path), "utf8"));
      const job = workflow.jobs[mutation === "application-command" ? "application" : "server"];
      if (mutation === "application-command") job.steps.at(-1).run = "echo skipped frontend units";
      else job.if = "false";
      f.put(path, stringifyDedupYaml(workflow));
    }
    f.commit(`Synthetic invalid ownership ${mutation}`);
    dedupRefusal(f, dedupAdmission(f));
  }
});

test("dedup: deleted or malformed committed inputs and missing original declarations cannot omit mandatory work", (t) => {
  const available = dedupFixture(t);
  requireSuccess(available.invoke(phaseScript, dedupAdmission(available)));
  for (const mutation of ["missing-worker", "malformed-worker", "tooling", "test:unit", "build", "test:e2e"]) {
    const f = dedupFixture(t);
    if (mutation === "missing-worker") rmSync(join(f.root, dedupWorkflowPaths[4]));
    else if (mutation === "malformed-worker") f.put(dedupWorkflowPaths[3], "jobs: [unterminated\n");
    else {
      const pkg = JSON.parse(readFileSync(join(f.root, "package.json"), "utf8"));
      if (mutation === "tooling")
        pkg.scripts["test:tooling"] = "node --experimental-vm-modules --test scripts/phase-policy.test.mjs";
      else delete pkg.scripts[mutation];
      f.put("package.json", `${JSON.stringify(pkg)}\n`);
    }
    f.commit(`Synthetic invalid committed input ${mutation}`);
    dedupRefusal(f, dedupAdmission(f, f.visibilityRevision));
  }
});

test("dedup: admission source, workflow and run mismatches refuse; working-tree layout bluff cannot select commands", (t) => {
  const available = dedupFixture(t);
  requireSuccess(available.invoke(phaseScript, dedupAdmission(available)));
  for (const [field, value] of [
    ["GITHUB_SHA", "a".repeat(40)],
    ["GITHUB_WORKFLOW_SHA", "a".repeat(40)],
    ["GITHUB_RUN_ID", "42002"],
    ["GATE_ADMISSION_SHA256", "a".repeat(64)],
  ]) {
    const f = dedupFixture(t);
    dedupRefusal(f, { ...dedupAdmission(f), [field]: value });
  }
  const legacy = dedupFixture(t, { legacy: true });
  const env = dedupAdmission(legacy);
  for (const path of dedupWorkflowPaths) legacy.put(path, dedupSource(path));
  requireSuccess(legacy.invoke(phaseScript, env));
  assert.deepEqual(dedupRootScripts(legacy), ["run test:unit", "run build", "run test:e2e"]);
});

test("dedup: optimized candidate controls stay separate and precede required-suite E2E; selectors remain forbidden", (t) => {
  const f = dedupFixture(t);
  const candidate = f.candidate();
  const env = dedupAdmission(f, f.visibilityRevision);
  requireSuccess(f.invoke(phaseScript, env));
  assert.deepEqual(dedupRootScripts(f), ["run test:e2e"]);
  requireBrowserOrder(f.commands(), candidateMarker, { ci: process.platform === "linux" });
  requireBrowserOrder(f.commands(), requiredMarker, { ci: process.platform === "linux" });
  const checks = f.commands().filter((c) => c.command === "npm" && c.args.join(" ") === "run check");
  assert.deepEqual(
    checks.map((c) => c.marker),
    [candidateMarker, requiredMarker],
  );
  const evidence = JSON.parse(readFileSync(join(f.root, ".artifacts/acceptance-candidate.json"), "utf8"));
  assert.equal(evidence.suiteCommit, candidate);
  assert.equal(evidence.productAcceptance, false);
  assert.equal(f.commands().find((c) => c.cwd === f.root).trustedMarker, requiredMarker);
  const rejected = dedupFixture(t);
  const result = spawnSync(process.execPath, [phaseScript, "--skip-unit-build"], {
    cwd: rejected.root,
    env: { ...rejected.env, ...dedupAdmission(rejected) },
    encoding: "utf8",
    timeout: 20000,
    maxBuffer: 2 * 1024 * 1024,
  });
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  assert.deepEqual(rejected.commands(), []);
});
