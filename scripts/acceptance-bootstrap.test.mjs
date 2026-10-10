/**
 * Independent shell-preflight expectations, authored before the trusted workflow launcher implementation.
 * Run with pinned Node: node --test scripts/acceptance-bootstrap.test.mjs after the workflow is wired.
 * The actual workflow command runs in disposable Git histories with synthetic credentials and no remote Git.
 * Genuine bootstrap cases use the immutable pre-policy verifier; a separate fake CLI tests extraction isolation only.
 * Child environments omit host credentials, and a test-owned preload rejects Node HTTP and socket operations.
 * Failures remain fatal; these fixtures establish local boundary behavior, not authenticated GitHub admission.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, isAbsolute, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parse } from "yaml";

const project = fileURLToPath(new URL("../", import.meta.url));
const legacyRevision = "533ddca81153b189d9f53cfc7cc81f24b9421231";
const repository = "example/private-mp3";
const registryPath = "docs/testing/acceptance-transitions.json";
const manifestPath = "tests/acceptance/fixtures/manifest.json";
const baselinePath = "docs/testing/baseline.json";
const validationJobs = ["validate-foundation", "validate-product"];
const syntheticToken = "synthetic-review-token-for-shell-boundary-only";
const trustedNames = [
  "acceptance-preflight.mjs",
  "acceptance-admission.mjs",
  "acceptance-transitions.mjs",
  "acceptance-review-observations.mjs",
  "acceptance-review-http.mjs",
  "acceptance-baseline.mjs",
  "phase-policy.mjs",
];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** This oracle is deliberately independent of the admission implementation and any JSON file whitespace. */
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

/** Read the actual reviewed command; a missing step must fail a negative case rather than count as rejection. */
function workflowRun(jobName) {
  const workflow = parse(readFileSync(join(project, ".github/workflows/ci.yml"), "utf8"));
  const steps = workflow.jobs[jobName].steps.filter((step) => step.id === "acceptance-preflight");
  assert.equal(steps.length, 1, `${jobName} must define its actual acceptance-preflight command`);
  assert.equal(typeof steps[0].run, "string");
  assert(steps[0].run.length > 0);
  return steps[0].run;
}

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), "mp3-bootstrap-expectations-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const root = join(directory, "checkout");
  const runner = join(directory, "runner-temp");
  const home = join(directory, "home");
  for (const path of [root, runner, home]) mkdirSync(path, { recursive: true });
  const environment = {
    PATH: [dirname(process.execPath), "/usr/bin", "/bin", "/usr/sbin", "/sbin"].join(delimiter),
    HOME: home,
    TMPDIR: directory,
    LANG: "C",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
  };
  const git = (...args) =>
    execFileSync(
      "git",
      [
        "-c",
        "user.name=Independent Bootstrap Fixture",
        "-c",
        "user.email=bootstrap@example.invalid",
        "-c",
        "commit.gpgsign=false",
        "-c",
        "core.hooksPath=/dev/null",
        ...args,
      ],
      { cwd: root, env: environment, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ).trim();
  const put = (path, bytes) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), bytes);
  };
  const json = (path, value) => put(path, `${JSON.stringify(value, null, 2)}\n`);
  const commit = (message) => {
    git("add", "--all");
    git("commit", "--quiet", "-m", message);
    return git("rev-parse", "HEAD");
  };
  git("init", "--quiet", "--initial-branch=main");
  put("README.md", "Synthetic shell-preflight foundation.\n");
  for (const name of ["acceptance-baseline.mjs", "phase-policy.mjs"]) {
    put(
      `scripts/${name}`,
      execFileSync("git", ["show", `${legacyRevision}:scripts/${name}`], {
        cwd: project,
        env: environment,
        stdio: ["ignore", "pipe", "pipe"],
      }),
    );
  }
  const rootPackage = {
    private: true,
    type: "module",
    scripts: { "test:tooling": "node --test scripts/phase-policy.test.mjs" },
  };
  json("package.json", rootPackage);
  commit("foundation with actual immutable legacy verifier");
  json("tests/acceptance/package.json", { private: true, scripts: { check: "node check.mjs" } });
  put("tests/acceptance/check.mjs", "// Independent synthetic acceptance suite; never executed.\n");
  json(manifestPath, { contractRevision: "r3", independentCount: 3 });
  put("docs/testing/acceptance-contract.md", "# Immutable synthetic r3 contract\n");
  const genesisCommit = commit("independent pre-product genesis");
  const genesis = {
    schemaVersion: 1,
    contractRevision: "r3",
    suiteCommit: genesisCommit,
    suiteTree: git("rev-parse", `${genesisCommit}:tests/acceptance`),
    manifestSha256: sha256(readFileSync(join(root, manifestPath))),
    publicationStatus: "protected-main",
  };
  json(baselinePath, genesis);
  put("server/src/parser.ts", "// Synthetic product marker; never executed.\n");
  put("server/Dockerfile", "# Synthetic image marker; never built.\n");
  put("compose.yaml", "services: {}\n");
  const product = commit("product after immutable acceptance genesis");
  const poisonHead = () => {
    for (const name of trustedNames) {
      put(
        `scripts/${name}`,
        'import { writeFileSync } from "node:fs";\n' +
          'import { join } from "node:path";\n' +
          'writeFileSync(join(process.env.RUNNER_TEMP, "head-script-ran"), "untrusted head executed");\n' +
          'throw new Error("Untrusted proposed module executed");\n',
      );
    }
  };
  const bootstrap = () => {
    json(registryPath, { schemaVersion: 1, transitions: [] });
    put("docs/testing/acceptance-transition.md", "# Synthetic dormant transition proposal\n");
    json("package.json", {
      ...rootPackage,
      scripts: { "test:tooling": "node --test scripts/phase-policy.test.mjs scripts/acceptance-bootstrap.test.mjs" },
    });
    poisonHead();
    return commit("governance-only dormant policy with untrusted proposed modules");
  };
  const networkGuard = join(directory, "deny-network.mjs");
  writeFileSync(
    networkGuard,
    'import http from "node:http";\nimport https from "node:https";\nimport net from "node:net";\n' +
      'const deny = () => { throw new Error("Network is forbidden in shell-boundary fixtures"); };\n' +
      "globalThis.fetch = deny;\nhttp.request = deny;\nhttp.get = deny;\n" +
      "https.request = deny;\nhttps.get = deny;\nnet.Socket.prototype.connect = deny;\n",
  );
  return { root, runner, environment, networkGuard, git, put, json, commit, genesis, product, bootstrap, poisonHead };
}

function execute(f, jobName, changes = {}, eventChanges = {}) {
  const run = workflowRun(jobName);
  const output = join(f.runner, `outputs-${jobName}`);
  const eventPath = join(f.runner, `event-${jobName}.json`);
  writeFileSync(output, "");
  const sourceRevision = f.git("rev-parse", "HEAD");
  const env = {
    ...f.environment,
    NODE_OPTIONS: `--import=${f.networkGuard}`,
    GITHUB_WORKSPACE: f.root,
    RUNNER_TEMP: f.runner,
    GITHUB_OUTPUT: output,
    GITHUB_SHA: sourceRevision,
    GITHUB_REPOSITORY: repository,
    GITHUB_EVENT_NAME: "push",
    GITHUB_EVENT_PATH: eventPath,
    GITHUB_REF: "refs/heads/main",
    GITHUB_WORKFLOW_REF: `${repository}/.github/workflows/ci.yml@${changes.GITHUB_REF ?? "refs/heads/main"}`,
    GITHUB_WORKFLOW_SHA: changes.GITHUB_SHA ?? sourceRevision,
    GITHUB_ACTIONS: "true",
    CI: "true",
    GITHUB_SERVER_URL: "https://github.com",
    GITHUB_RUN_ID: "42001",
    GITHUB_RUN_ATTEMPT: "1",
    CI_BASE_REF: f.product,
    GATE_REVIEW_TOKEN: syntheticToken,
    ...changes,
  };
  for (const key of Object.keys(env)) if (env[key] === undefined) delete env[key];
  const event = {
    repository: { full_name: repository },
    ...(env.GITHUB_EVENT_NAME === "pull_request"
      ? {
          number: Number(env.GITHUB_REF.split("/")[2]),
          pull_request: {
            base: { ref: "main", sha: env.CI_BASE_REF },
            head: { sha: f.git("rev-parse", `${sourceRevision}^2`) },
          },
        }
      : { before: env.CI_BASE_REF, after: env.GITHUB_SHA }),
    ...eventChanges,
  };
  writeFileSync(eventPath, `${JSON.stringify(event)}\n`);
  const result = spawnSync("bash", ["--noprofile", "--norc", "-euo", "pipefail", "-c", run], {
    cwd: f.root,
    env,
    encoding: "utf8",
    timeout: 15000,
    maxBuffer: 1024 * 1024,
  });
  assert.equal(result.error, undefined, `Preflight launch failed: ${result.error?.message}`);
  assert.equal(result.signal, null, "Preflight must finish with an explicit success or rejection");
  assert(!`${result.stdout}${result.stderr}`.includes(syntheticToken), "Preflight diagnostics exposed its token");
  assert(!existsSync(join(f.runner, "head-script-ran")), "The trusted step executed proposed JavaScript");
  return { ...result, output: readFileSync(output, "utf8"), env };
}

function outputs(value) {
  const entries = value
    .trim()
    .split("\n")
    .map((line) => {
      const at = line.indexOf("=");
      assert(at > 0, "Admission outputs must each contain a name and value");
      return [line.slice(0, at), line.slice(at + 1)];
    });
  assert.deepEqual(entries.map(([key]) => key).sort(), ["admission-path", "admission-sha256"]);
  return Object.fromEntries(entries);
}

function requireBootstrapRecord(f, value) {
  assert.equal(value.status, 0, `Genuine legacy bootstrap failed: ${value.stderr}`);
  const emitted = outputs(value.output);
  const path = emitted["admission-path"];
  assert(isAbsolute(path), "The emitted record path must not depend on a later step's working directory");
  assert(lstatSync(path).isFile(), "The admission record must be a regular file");
  const fromCheckout = relative(realpathSync(f.root), realpathSync(path));
  assert(fromCheckout.startsWith(`..${sep}`) || isAbsolute(fromCheckout), "Record bytes must live outside checkout");
  const fromRunner = relative(realpathSync(f.runner), realpathSync(path));
  assert(fromRunner && !fromRunner.startsWith(`..${sep}`) && !isAbsolute(fromRunner));
  const record = JSON.parse(readFileSync(path, "utf8"));
  assert.deepEqual(record, {
    schemaVersion: 1,
    kind: "ci-acceptance-admission",
    context: {
      repository,
      eventName: value.env.GITHUB_EVENT_NAME,
      ref: value.env.GITHUB_REF,
      sourceRevision: value.env.GITHUB_SHA,
      sourceTree: f.git("rev-parse", `${value.env.GITHUB_SHA}^{tree}`),
      baseRevision: value.env.CI_BASE_REF,
      workflowRevision: value.env.GITHUB_SHA,
      toolingRevision: value.env.CI_BASE_REF,
      runId: Number(value.env.GITHUB_RUN_ID),
      attempt: Number(value.env.GITHUB_RUN_ATTEMPT),
    },
    observedReviews: [],
    resolution: {
      genesis: f.genesis,
      required: f.genesis,
      candidate: null,
      pendingBinding: null,
      admission: "bootstrap",
      bindingCommit: null,
      activationCommit: null,
      policySha256: sha256(readFileSync(join(f.root, registryPath))),
    },
  });
  assert.equal(emitted["admission-sha256"], sha256(canonical(record)));
}

function requireRejected(f, changes = {}, eventChanges = {}) {
  for (const job of validationJobs) {
    const value = execute(f, job, changes, eventChanges);
    assert.notEqual(value.status, 0, `${job} admitted a forbidden bootstrap change`);
    assert.equal(value.output.trim(), "", "A rejected preflight must not emit successful admission outputs");
  }
}

test("both actual workflow commands produce genuine bootstrap evidence without executing proposed modules", (t) => {
  for (const eventName of ["push", "pull_request"]) {
    const f = fixture(t);
    const proposal = f.bootstrap();
    if (eventName === "pull_request") {
      const tree = f.git("rev-parse", `${proposal}^{tree}`);
      const merge = f.git("commit-tree", tree, "-p", f.product, "-p", proposal, "-m", "synthetic PR merge");
      f.git("checkout", "--quiet", "--detach", merge);
    }
    for (const job of validationJobs) {
      const value = execute(f, job, {
        GITHUB_EVENT_NAME: eventName,
        GITHUB_REF: eventName === "push" ? "refs/heads/main" : "refs/pull/17/merge",
      });
      requireBootstrapRecord(f, value);
    }
  }
});

test("legacy bootstrap rejects frozen suite, genesis metadata and original contract changes", (t) => {
  for (const mutate of [
    (f) => f.put("tests/acceptance/check.mjs", "// Altered frozen suite.\n"),
    (f) => f.put("tests/acceptance/extra.mjs", "// Newly hidden acceptance behavior.\n"),
    (f) => f.json(manifestPath, { contractRevision: "r4", independentCount: 30 }),
    (f) => f.json(baselinePath, { ...f.genesis, contractRevision: "r4" }),
    (f) => f.put("docs/testing/acceptance-contract.md", "# Rewritten genesis contract\n"),
  ]) {
    const f = fixture(t);
    f.bootstrap();
    mutate(f);
    f.commit("forbidden immutable evidence change");
    requireRejected(f);
  }
});

test("bootstrap governance exemptions cannot conceal product or unclassified executable changes", (t) => {
  for (const mutate of [
    (f) => f.put("server/src/parser.ts", "// Unreviewed product migration.\n"),
    (f) => f.put("compose.yaml", "services: { api: { image: altered } }\n"),
    (f) => f.json("package.json", { private: true, type: "module", dependencies: { fastify: "5.0.0" } }),
    (f) => f.put("docs/hidden.mjs", "throw new Error('Executable content is not prose');\n"),
    (f) => f.json("unclassified-settings.json", { enableRuntimeChange: true }),
  ]) {
    const f = fixture(t);
    f.bootstrap();
    mutate(f);
    f.commit("forbidden mixed bootstrap proposal");
    requireRejected(f);
  }
});

test("bootstrap requires a newly introduced closed empty schema-1 registry", (t) => {
  for (const registry of [
    null,
    { schemaVersion: 2, transitions: [] },
    { schemaVersion: 1, transitions: [{ id: "invented-successor" }] },
    { schemaVersion: 1, transitions: [], trusted: true },
    { schemaVersion: 1, transitions: null },
    { schemaVersion: 1 },
  ]) {
    const f = fixture(t);
    f.bootstrap();
    if (registry === null) rmSync(join(f.root, registryPath));
    else f.json(registryPath, registry);
    f.commit("invalid bootstrap registry");
    requireRejected(f);
  }
});

test("moving, missing, nonexistent and nonancestor trusted bases cannot authorize bootstrap", (t) => {
  const f = fixture(t);
  f.bootstrap();
  const orphan = f.git("commit-tree", f.git("rev-parse", `${f.product}^{tree}`), "-m", "unrelated base object");
  for (const base of ["main", undefined, "", "9".repeat(40), orphan]) requireRejected(f, { CI_BASE_REF: base });
});

test("source identity must match the event payload, exact checkout and unmodified tracked tree", (t) => {
  const f = fixture(t);
  const source = f.bootstrap();
  const sameTree = f.git("commit-tree", f.git("rev-parse", `${source}^{tree}`), "-p", f.product, "-m", "other SHA");
  requireRejected(f, { GITHUB_SHA: sameTree });
  requireRejected(f, { GITHUB_SHA: "main" });
  requireRejected(f, {}, { before: "9".repeat(40) });
  requireRejected(f, {}, { after: "9".repeat(40) });
  const pr = fixture(t);
  const proposal = pr.bootstrap();
  const merge = pr.git(
    "commit-tree",
    pr.git("rev-parse", `${proposal}^{tree}`),
    "-p",
    pr.product,
    "-p",
    proposal,
    "-m",
    "synthetic PR merge",
  );
  pr.git("checkout", "--quiet", "--detach", merge);
  requireRejected(
    pr,
    { GITHUB_EVENT_NAME: "pull_request", GITHUB_REF: "refs/pull/17/merge" },
    { pull_request: { base: { ref: "main", sha: "9".repeat(40) }, head: { sha: proposal } } },
  );
  requireRejected(
    pr,
    { GITHUB_EVENT_NAME: "pull_request", GITHUB_REF: "refs/pull/17/merge" },
    { pull_request: { base: { ref: "unprotected-branch", sha: pr.product }, head: { sha: proposal } } },
  );
  f.put("server/src/parser.ts", "// Dirty working-tree product change outside the recorded source.\n");
  requireRejected(f, { GITHUB_SHA: source });
});

/** Install fake trusted files only for shell extraction boundaries, never for genuine bootstrap evidence. */
function installIsolationBase(f, omitted) {
  f.json(registryPath, { schemaVersion: 1, transitions: [] });
  for (const name of trustedNames) {
    if (name === omitted) {
      rmSync(join(f.root, "scripts", name), { force: true });
      continue;
    }
    f.put(`scripts/${name}`, "// Fake trusted isolation fixture; not an acceptance implementation.\n");
  }
  if (omitted !== "acceptance-preflight.mjs") {
    f.put(
      "scripts/acceptance-preflight.mjs",
      'import { writeFileSync, appendFileSync } from "node:fs";\n' +
        'import { join } from "node:path";\n' +
        'writeFileSync(join(process.env.RUNNER_TEMP, "trusted-isolation-ran"), "boundary fixture only");\n' +
        'const path = join(process.env.RUNNER_TEMP, "isolation-only.json");\n' +
        "writeFileSync(path, JSON.stringify({ isolationFixture: true }));\n" +
        'appendFileSync(process.env.GITHUB_OUTPUT, `admission-path=${path}\\nadmission-sha256=${"0".repeat(64)}\\n`);\n',
    );
  }
  return f.commit("fake trusted modules for extraction boundary only");
}

test("policy already present on the base forbids bootstrap fallback when any trusted module is missing", (t) => {
  for (const omitted of trustedNames) {
    const f = fixture(t);
    const base = installIsolationBase(f, omitted);
    f.poisonHead();
    f.put("README.md", "Proposed documentation with untrusted module replacements.\n");
    f.commit("proposed repair cannot execute before trusted admission");
    requireRejected(f, { CI_BASE_REF: base });
    assert(!existsSync(join(f.runner, "trusted-isolation-ran")), "All trusted modules must be present before entry");
  }
});

test("normal-base extraction executes its trusted CLI and never poisoned head modules (isolation only)", (t) => {
  const f = fixture(t);
  const base = installIsolationBase(f);
  f.poisonHead();
  f.put("README.md", "Proposed documentation with poisoned scripts.\n");
  f.commit("untrusted proposed source");
  for (const job of validationJobs) {
    rmSync(join(f.runner, "trusted-isolation-ran"), { force: true });
    const value = execute(f, job, { CI_BASE_REF: base });
    assert.equal(value.status, 0, `Trusted CLI isolation failed: ${value.stderr}`);
    assert.equal(readFileSync(join(f.runner, "trusted-isolation-ran"), "utf8"), "boundary fixture only");
    const emitted = outputs(value.output);
    assert.deepEqual(JSON.parse(readFileSync(emitted["admission-path"], "utf8")), { isolationFixture: true });
    assert.equal(emitted["admission-sha256"], "0".repeat(64));
    // Deliberately do not use requireBootstrapRecord: fake CLI output is not consistent admission evidence.
  }
});
