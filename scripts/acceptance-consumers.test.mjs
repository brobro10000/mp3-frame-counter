/**
 * Independent integration expectations for real phase/E2E CLI consumers and the release-workflow handoff validator.
 * Run `node --test scripts/acceptance-consumers.test.mjs` with pinned Node after consumer fixes are available.
 * Temporary Git histories use real archives and replacement refs. Synthetic npm only records requests; synthetic Docker
 * fails at its first boundary. Node network entry points are disabled, no real package installation or Docker runs,
 * and no account environment is inherited. Fixtures are removed even when an assertion fails.
 * These controls establish consumer selection/provenance behavior, never application acceptance or deployment.
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

function fixture(t, { policy = true } = {}) {
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
    scripts: { "test:unit": "node unused.mjs", build: "node unused.mjs", "test:e2e": "node unused.mjs" },
  });
  put("README.md", "Synthetic consumer fixture.\n");
  commit("foundation");
  json("tests/acceptance/package.json", { private: true, scripts: { check: "node check.mjs" } });
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
  put("server/Dockerfile", "# Synthetic runtime marker; never built.\n");
  put("compose.yaml", "services: {}\n");
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
    put(markerPath, candidateMarker);
    put("docs/testing/contracts/transport-r4.md", "# Independent candidate contract\n");
    const revision = commit("independent candidate only");
    env.CI_BASE_REF = source;
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

test("workflow policy requires exact independent admission path and digest handoff to both consumers", () => {
  const workflow = parse(readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8"));
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
