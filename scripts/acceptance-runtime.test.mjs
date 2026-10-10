/**
 * Independent runtime acceptance-selection expectations, authored before the shared runtime helper implementation.
 * Run `node --test scripts/acceptance-runtime.test.mjs` with pinned Node once the implementation is available.
 * Temporary Git histories and record-only JSON outside each checkout model trusted CI handoffs and ordinary local use.
 * Expected records are assembled independently; no resolver or admission helper manufactures the expected decisions.
 * Fixture commands affect only disposable local Git repositories. No product, network, credentials or remote Git runs.
 * Failures must reject false CI claims, unsafe record paths, changed suite bytes and unobserved successor bindings.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { runtimeAcceptance } from "./acceptance-runtime.mjs";

const repository = "example/private-mp3";
const registryPath = "docs/testing/acceptance-transitions.json";
const manifestPath = "tests/acceptance/fixtures/manifest.json";
const suiteFile = "tests/acceptance/check.mjs";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

/** Independent canonical JSON oracle used only to model the trusted preflight's externally supplied digest. */
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
  const workspace = realpathSync(mkdtempSync(join(tmpdir(), "mp3-acceptance-runtime-")));
  t.after(() => rmSync(workspace, { recursive: true, force: true }));
  const root = join(workspace, "checkout");
  const outside = join(workspace, "trusted");
  mkdirSync(root);
  mkdirSync(outside, { mode: 0o700 });
  const git = (...args) =>
    execFileSync(
      "git",
      ["-c", "user.name=Independent Runtime Fixture", "-c", "user.email=runtime@example.invalid", ...args],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
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
  put(".gitignore", ".artifacts/\n");
  put("README.md", "Synthetic runtime fixture foundation.\n");
  commit("foundation");
  json("tests/acceptance/package.json", { private: true, scripts: { check: "node check.mjs" } });
  put(suiteFile, "// Independent synthetic suite; never executed.\n");
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
  const registry = { schemaVersion: 1, transitions: [] };
  if (policy) json(registryPath, registry);
  const source = policy ? commit("dormant transition policy") : product;
  const base = policy ? product : genesisCommit;
  const resolution = {
    genesis,
    required: genesis,
    candidate: null,
    pendingBinding: null,
    admission: policy ? "bootstrap" : "legacy",
    bindingCommit: null,
    activationCommit: null,
    policySha256: policy ? sha256(readFileSync(join(root, registryPath))) : null,
  };
  const record = {
    schemaVersion: 1,
    kind: "ci-acceptance-admission",
    context: {
      repository,
      eventName: "push",
      ref: "refs/heads/main",
      sourceRevision: source,
      sourceTree: git("rev-parse", `${source}^{tree}`),
      baseRevision: base,
      workflowRevision: source,
      toolingRevision: base,
      runId: 42001,
      attempt: 1,
    },
    observedReviews: [],
    resolution,
  };
  const recordPath = join(outside, "admission.json");
  const ciEnv = (nextRecord = record) => {
    writeJson(recordPath, nextRecord);
    const context = nextRecord.context;
    return {
      CI: "true",
      CI_BASE_REF: context.baseRevision,
      GITHUB_ACTIONS: "true",
      GITHUB_SERVER_URL: "https://github.com",
      GITHUB_API_URL: "https://api.github.com",
      GITHUB_REPOSITORY: context.repository,
      GITHUB_SHA: context.sourceRevision,
      GITHUB_WORKFLOW_SHA: context.workflowRevision,
      GITHUB_WORKFLOW_REF: `${context.repository}/.github/workflows/ci.yml@${context.ref}`,
      GITHUB_EVENT_NAME: context.eventName,
      GITHUB_REF: context.ref,
      GITHUB_RUN_ID: String(context.runId),
      GITHUB_RUN_ATTEMPT: String(context.attempt),
      GATE_ADMISSION_PATH: recordPath,
      GATE_ADMISSION_SHA256: sha256(canonical(nextRecord)),
    };
  };
  const candidate = () => {
    git("checkout", "--quiet", "-b", "independent-candidate");
    json(manifestPath, { contractRevision: "r4", independentCount: 3 });
    put(suiteFile, "// Independent synthetic successor; never executed.\n");
    const contractPath = "docs/testing/contracts/transport-r4.md";
    put(contractPath, "# Synthetic transport contract r4\n");
    const reviewedHead = commit("independent candidate feature head");
    const reviewedTree = git("rev-parse", `${reviewedHead}^{tree}`);
    git("checkout", "--quiet", "main");
    git("merge", "--squash", "--quiet", "independent-candidate");
    const suiteCommit = commit("actual candidate squash");
    assert.notEqual(suiteCommit, reviewedHead);
    return {
      id: "transport-r4",
      predecessor: "r3",
      contractRevision: "r4",
      contractPath,
      contractSha256: sha256(readFileSync(join(root, contractPath))),
      suiteCommit,
      suiteTree: git("rev-parse", `${suiteCommit}:tests/acceptance`),
      manifestSha256: sha256(readFileSync(join(root, manifestPath))),
      review: {
        repository,
        pullRequest: 12,
        reviewId: 34,
        reviewer: "independent-reviewer",
        reviewedHead,
        reviewedTree,
      },
    };
  };
  return {
    root,
    outside,
    recordPath,
    git,
    put,
    json,
    commit,
    genesis,
    product,
    source,
    base,
    resolution,
    record,
    ciEnv,
    registry,
    candidate,
  };
}

function expectLocal(f, result, sourceRevision = f.source, baseRevision = f.base, resolution = f.resolution) {
  assert.deepEqual(Object.keys(result).sort(), ["baseline", "localSelection", "resolution"]);
  assert.deepEqual(result.baseline, resolution.required);
  assert.deepEqual(result.resolution, resolution);
  assert.deepEqual(result.localSelection, {
    kind: "local-acceptance-resolution",
    sourceRevision,
    baseRevision,
    resolution,
  });
  assert.equal(Object.hasOwn(result, "admission"), false);
}

test("pre-policy runtime retains baseline-only legacy behavior without inventing CI admission", (t) => {
  const f = fixture(t, { policy: false });
  for (const env of [{}, { CI_BASE_REF: f.base }, { CI: "true", CI_BASE_REF: f.base }]) {
    assert.deepEqual(runtimeAcceptance(f.root, env), { baseline: f.genesis });
  }
  f.put(suiteFile, "// Unauthorized legacy suite edit.\n");
  assert.throws(() => runtimeAcceptance(f.root, { CI_BASE_REF: f.base }));
});

test("post-policy CI accepts record-only trusted push and exact synthetic-merge PR evidence", (t) => {
  const f = fixture(t);
  const env = f.ciEnv();
  const before = readFileSync(f.recordPath);
  const result = runtimeAcceptance(f.root, env);
  assert.deepEqual(Object.keys(result).sort(), ["admission", "baseline", "resolution"]);
  assert.deepEqual(result, {
    baseline: f.genesis,
    resolution: f.resolution,
    admission: { record: f.record, sha256: env.GATE_ADMISSION_SHA256 },
  });
  assert.deepEqual(readFileSync(f.recordPath), before);

  f.git("checkout", "--quiet", "-b", "documentation-proposal");
  f.put("README.md", "Synthetic proposed documentation.\n");
  const featureHead = f.commit("documentation proposal");
  const tree = f.git("rev-parse", `${featureHead}^{tree}`);
  const merge = f.git("commit-tree", tree, "-p", f.source, "-p", featureHead, "-m", "synthetic PR merge");
  f.git("checkout", "--quiet", "--detach", merge);
  const record = structuredClone(f.record);
  Object.assign(record.context, {
    eventName: "pull_request",
    ref: "refs/pull/17/merge",
    sourceRevision: merge,
    sourceTree: tree,
    baseRevision: f.source,
    workflowRevision: merge,
    toolingRevision: f.source,
  });
  record.resolution.admission = "documentation";
  const prEnv = f.ciEnv(record);
  assert.deepEqual(runtimeAcceptance(f.root, prEnv), {
    baseline: f.genesis,
    resolution: record.resolution,
    admission: { record, sha256: prEnv.GATE_ADMISSION_SHA256 },
  });
});

test("CI selection requires complete authentic context and actual HEAD, never just matching record claims", (t) => {
  const f = fixture(t);
  const env = f.ciEnv();
  for (const field of [
    "CI_BASE_REF",
    "GITHUB_ACTIONS",
    "GITHUB_SERVER_URL",
    "GITHUB_API_URL",
    "GITHUB_REPOSITORY",
    "GITHUB_SHA",
    "GITHUB_WORKFLOW_SHA",
    "GITHUB_WORKFLOW_REF",
    "GITHUB_EVENT_NAME",
    "GITHUB_REF",
    "GITHUB_RUN_ID",
    "GITHUB_RUN_ATTEMPT",
  ]) {
    const missing = { ...env };
    delete missing[field];
    assert.throws(() => runtimeAcceptance(f.root, missing), field);
  }
  for (const fields of [
    { GITHUB_ACTIONS: "false" },
    { GITHUB_SERVER_URL: "https://github.example.invalid" },
    { GITHUB_API_URL: "https://api.example.invalid" },
    { GITHUB_REPOSITORY: "other/private-mp3" },
    { GITHUB_SHA: f.product },
    { GITHUB_WORKFLOW_SHA: f.product },
    { GITHUB_WORKFLOW_REF: `${repository}/.github/workflows/other.yml@refs/heads/main` },
    { GITHUB_REF: "refs/heads/other" },
    { GITHUB_EVENT_NAME: "workflow_dispatch" },
    { CI_BASE_REF: f.genesis.suiteCommit },
    { GITHUB_RUN_ID: "42002" },
    { GITHUB_RUN_ATTEMPT: "2" },
    { GITHUB_RUN_ID: "0" },
    { GITHUB_RUN_ATTEMPT: "1.5" },
  ])
    assert.throws(() => runtimeAcceptance(f.root, { ...env, ...fields }));

  const record = structuredClone(f.record);
  Object.assign(record.context, {
    sourceRevision: f.product,
    sourceTree: f.git("rev-parse", `${f.product}^{tree}`),
    baseRevision: f.genesis.suiteCommit,
    workflowRevision: f.product,
    toolingRevision: f.genesis.suiteCommit,
  });
  record.resolution.admission = "legacy";
  record.resolution.policySha256 = null;
  assert.throws(() => runtimeAcceptance(f.root, f.ciEnv(record)), "Older record cannot stand in for actual HEAD");
});

test("CI rejects absent, tampered, in-checkout and symlinked record inputs without trusting embedded hashes", (t) => {
  const f = fixture(t);
  const env = f.ciEnv();
  for (const field of ["GATE_ADMISSION_PATH", "GATE_ADMISSION_SHA256"]) {
    const missing = { ...env };
    delete missing[field];
    assert.throws(() => runtimeAcceptance(f.root, missing));
  }
  for (const value of ["", "bad", "0".repeat(64)]) {
    assert.throws(() => runtimeAcceptance(f.root, { ...env, GATE_ADMISSION_SHA256: value }));
  }
  for (const value of [null, [], {}, { record: f.record, sha256: env.GATE_ADMISSION_SHA256 }]) {
    writeJson(f.recordPath, value);
    assert.throws(() => runtimeAcceptance(f.root, env));
  }
  writeFileSync(f.recordPath, "{not JSON");
  assert.throws(() => runtimeAcceptance(f.root, env));
  const tampered = structuredClone(f.record);
  tampered.resolution.admission = "documentation";
  writeJson(f.recordPath, tampered);
  assert.throws(() => runtimeAcceptance(f.root, env));
  assert.throws(() => runtimeAcceptance(f.root, { ...env, GATE_ADMISSION_SHA256: sha256(canonical(tampered)) }));
  const embedded = { ...f.record, sha256: env.GATE_ADMISSION_SHA256 };
  writeJson(f.recordPath, embedded);
  assert.throws(() => runtimeAcceptance(f.root, { ...env, GATE_ADMISSION_SHA256: undefined }));

  f.ciEnv();
  f.json(".artifacts/admission.json", f.record);
  assert.throws(() =>
    runtimeAcceptance(f.root, { ...env, GATE_ADMISSION_PATH: join(f.root, ".artifacts/admission.json") }),
  );
  assert.throws(() => runtimeAcceptance(f.root, { ...env, GATE_ADMISSION_PATH: join(f.outside, "missing.json") }));
  symlinkSync(f.recordPath, join(f.outside, "linked.json"));
  assert.throws(() => runtimeAcceptance(f.root, { ...env, GATE_ADMISSION_PATH: join(f.outside, "linked.json") }));
  symlinkSync(f.outside, join(f.outside, "linked-directory"), "dir");
  assert.throws(() =>
    runtimeAcceptance(f.root, { ...env, GATE_ADMISSION_PATH: join(f.outside, "linked-directory/admission.json") }),
  );
});

test("post-policy selection requires full history and cannot hide policy introduction by deleting it", (t) => {
  const f = fixture(t);
  const env = f.ciEnv();
  f.put(".git/shallow", `${f.product}\n`);
  assert.throws(() => runtimeAcceptance(f.root, { CI_BASE_REF: f.base }));
  assert.throws(() => runtimeAcceptance(f.root, env));
  rmSync(join(f.root, ".git/shallow"));
  rmSync(join(f.root, registryPath));
  const deleted = f.commit("invalid policy deletion");
  assert.throws(() => runtimeAcceptance(f.root, { CI_BASE_REF: f.source }));
  const record = structuredClone(f.record);
  Object.assign(record.context, {
    sourceRevision: deleted,
    sourceTree: f.git("rev-parse", `${deleted}^{tree}`),
    baseRevision: f.source,
    workflowRevision: deleted,
    toolingRevision: f.source,
  });
  record.resolution.admission = "legacy";
  record.resolution.policySha256 = null;
  assert.throws(() => runtimeAcceptance(f.root, f.ciEnv(record)));
});

test("local selection uses explicit or merge-base authority and permits dirty product without CI claims", (t) => {
  const f = fixture(t);
  expectLocal(f, runtimeAcceptance(f.root, { CI_BASE_REF: f.base }));
  f.git("update-ref", "refs/remotes/origin/main", f.product);
  expectLocal(f, runtimeAcceptance(f.root, {}));
  f.git("update-ref", "refs/remotes/origin/main", f.source);
  f.put("README.md", "Synthetic descendant documentation.\n");
  const descendant = f.commit("ordinary post-policy history");
  const resolution = { ...f.resolution, admission: "documentation" };
  expectLocal(f, runtimeAcceptance(f.root, {}), descendant, f.source, resolution);
  f.put("server/src/parser.ts", "// Locally edited product; never executed.\n");
  expectLocal(f, runtimeAcceptance(f.root, {}), descendant, f.source, resolution);
  expectLocal(f, runtimeAcceptance(f.root, { CI: "false", CI_BASE_REF: f.source }), descendant, f.source, resolution);
});

test("local selection refuses CI record inputs or an invented fallback trusted base", (t) => {
  const f = fixture(t);
  const env = f.ciEnv();
  for (const claims of [
    { GATE_ADMISSION_PATH: env.GATE_ADMISSION_PATH },
    { GATE_ADMISSION_SHA256: env.GATE_ADMISSION_SHA256 },
    { GATE_ADMISSION_PATH: env.GATE_ADMISSION_PATH, GATE_ADMISSION_SHA256: env.GATE_ADMISSION_SHA256 },
  ])
    assert.throws(() => runtimeAcceptance(f.root, { CI_BASE_REF: f.base, ...claims }));
  assert.throws(() => runtimeAcceptance(f.root, {}), "No origin/main or explicit base exists");
  assert.throws(() => runtimeAcceptance(f.root, { CI_BASE_REF: "missing-base" }));
});

test("runtime compares current suite bytes to exact HEAD and rejects a new binding without observed review", (t) => {
  const f = fixture(t);
  const env = f.ciEnv();
  const original = readFileSync(join(f.root, suiteFile));
  for (const mutate of [
    () => f.put(suiteFile, "// Changed acceptance source.\n"),
    () => rmSync(join(f.root, suiteFile)),
    () => f.put("tests/acceptance/unreviewed.mjs", "// Added acceptance source.\n"),
    () => {
      rmSync(join(f.root, suiteFile));
      symlinkSync(f.recordPath, join(f.root, suiteFile));
    },
  ]) {
    mutate();
    assert.throws(() => runtimeAcceptance(f.root, { CI_BASE_REF: f.base }));
    assert.throws(() => runtimeAcceptance(f.root, env));
    rmSync(join(f.root, suiteFile), { force: true });
    rmSync(join(f.root, "tests/acceptance/unreviewed.mjs"), { force: true });
    f.put(suiteFile, original);
  }
  const entry = f.candidate();
  const selection = runtimeAcceptance(f.root, { CI_BASE_REF: f.source });
  assert.deepEqual(selection.baseline, f.genesis, "Candidate source is not the required product suite yet");
  assert.equal(selection.resolution.admission, "candidate");
  assert.equal(selection.resolution.candidate.suiteTree, entry.suiteTree);
  assert.equal(Object.hasOwn(selection, "admission"), false);
  f.registry.transitions.push(entry);
  f.json(registryPath, f.registry);
  f.commit("new binding with no runtime observation authority");
  assert.throws(() => runtimeAcceptance(f.root, { CI_BASE_REF: entry.suiteCommit }));
});
