/**
 * Independent pure admission-record expectations, authored before the record helper implementation.
 * Run with pinned Node: node --test scripts/acceptance-admission.test.mjs after implementation is available.
 * Disposable Git histories and injected synthetic observations exercise consistency, never live review authority.
 * No fixture package or product code runs; no GitHub, Docker, credentials or remote Git operations occur.
 * Shell bootstrap execution and authenticated producing-run provenance are separate integration boundaries.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { createAcceptanceAdmission, verifyAcceptanceAdmission } from "./acceptance-admission.mjs";
import { resolveAcceptance } from "./acceptance-baseline.mjs";

const repository = "example/private-mp3";
const registryPath = "docs/testing/acceptance-transitions.json";
const manifestPath = "tests/acceptance/fixtures/manifest.json";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Independent canonical JSON oracle: object key order is irrelevant, while array order remains significant. */
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

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "mp3-admission-expectations-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync(
      "git",
      ["-c", "user.name=Independent Admission Fixture", "-c", "user.email=admission@example.invalid", ...args],
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
  put("README.md", "Synthetic admission fixture foundation.\n");
  commit("foundation");
  json("tests/acceptance/package.json", { private: true, scripts: { check: "node check.mjs" } });
  put("tests/acceptance/check.mjs", "// Independent synthetic suite; never executed.\n");
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
  json(registryPath, registry);
  const bootstrap = commit("dormant transition policy");
  const context = (sourceRevision = bootstrap, baseRevision = product, extra = {}) => ({
    repository,
    eventName: "push",
    ref: "refs/heads/main",
    sourceRevision,
    sourceTree: git("rev-parse", `${sourceRevision}^{tree}`),
    baseRevision,
    workflowRevision: sourceRevision,
    toolingRevision: baseRevision,
    runId: 42001,
    attempt: 1,
    ...extra,
  });
  const bound = () => {
    git("checkout", "--quiet", "-b", "independent-candidate");
    json(manifestPath, { contractRevision: "r4", independentCount: 3, additionalContract: "transport-r4" });
    put("tests/acceptance/check.mjs", "// Independent synthetic transport successor; never executed.\n");
    const contractPath = "docs/testing/contracts/transport-r4.md";
    put(contractPath, "# Synthetic transport contract r4\n");
    const reviewedHead = commit("reviewed independent candidate");
    const reviewedTree = git("rev-parse", `${reviewedHead}^{tree}`);
    git("checkout", "--quiet", "main");
    git("merge", "--squash", "--quiet", "independent-candidate");
    const suiteCommit = commit("actual candidate squash");
    assert.notEqual(suiteCommit, reviewedHead);
    const review = {
      repository,
      pullRequest: 12,
      reviewId: 34,
      reviewer: "independent-reviewer",
      reviewedHead,
      reviewedTree,
    };
    const entry = {
      id: "transport-r4",
      predecessor: "r3",
      contractRevision: "r4",
      contractPath,
      contractSha256: sha256(readFileSync(join(root, contractPath))),
      suiteCommit,
      suiteTree: git("rev-parse", `${suiteCommit}:tests/acceptance`),
      manifestSha256: sha256(readFileSync(join(root, manifestPath))),
      review,
    };
    const observation = {
      ...review,
      author: "product-owner",
      baseRef: "main",
      merged: true,
      mergeCommit: suiteCommit,
      state: "APPROVED",
    };
    registry.transitions.push(entry);
    json(registryPath, registry);
    const binding = commit("bind actual independently reviewed squash");
    return { entry, observation, binding, candidate: suiteCommit };
  };
  return { root, git, put, json, commit, genesis, product, bootstrap, registry, context, bound };
}

function verify(f, value, expectedContext = value.record.context) {
  return verifyAcceptanceAdmission(f.root, {
    record: value.record,
    expectedContext,
    expectedSha256: value.sha256,
  });
}

function rehashed(record) {
  return { record, sha256: sha256(canonical(record)) };
}

test("main-push bootstrap record has the closed canonical shape and resolves the exact required suite", (t) => {
  const f = fixture(t);
  const context = f.context();
  const value = createAcceptanceAdmission(f.root, { context });
  assert.deepEqual(Object.keys(value).sort(), ["record", "sha256"]);
  assert.deepEqual(Object.keys(value.record).sort(), [
    "context",
    "kind",
    "observedReviews",
    "resolution",
    "schemaVersion",
  ]);
  assert.equal(value.record.schemaVersion, 1);
  assert.equal(value.record.kind, "ci-acceptance-admission");
  assert.deepEqual(value.record.context, context);
  assert.deepEqual(value.record.observedReviews, []);
  assert.equal(value.sha256, sha256(canonical(value.record)));
  const expected = resolveAcceptance(f.root, {
    sourceRevision: context.sourceRevision,
    trustedBase: context.baseRevision,
  });
  assert.deepEqual(value.record.resolution, expected);
  assert.deepEqual(verify(f, value, context), expected);
  assert.equal(expected.admission, "bootstrap");
  assert.equal(expected.required.suiteCommit, f.genesis.suiteCommit);
});

test("pull-request context binds the actual synthetic merge commit and tree", (t) => {
  const f = fixture(t);
  f.git("checkout", "--quiet", "-b", "proposed-documentation");
  f.put("README.md", "Synthetic proposed documentation.\n");
  const featureHead = f.commit("proposed documentation");
  const tree = f.git("rev-parse", `${featureHead}^{tree}`);
  const merge = f.git("commit-tree", tree, "-p", f.bootstrap, "-p", featureHead, "-m", "synthetic PR merge");
  f.git("checkout", "--quiet", "--detach", merge);
  const context = f.context(merge, f.bootstrap, { eventName: "pull_request", ref: "refs/pull/17/merge" });
  const value = createAcceptanceAdmission(f.root, { context });
  assert.equal(value.record.context.sourceRevision, merge);
  assert.notEqual(merge, featureHead);
  assert.equal(value.record.context.sourceTree, tree);
  assert.deepEqual(verify(f, value, context), value.record.resolution);
  assert.equal(value.record.resolution.required.suiteCommit, f.genesis.suiteCommit);
});

test("canonical original-attempt retries are deterministic and do not alias mutable caller inputs", (t) => {
  const f = fixture(t);
  const bound = f.bound();
  const context = f.context(bound.binding, bound.candidate);
  const observedReviews = [structuredClone(bound.observation)];
  const first = createAcceptanceAdmission(f.root, { context, observedReviews });
  const reorderedContext = Object.fromEntries(Object.entries(context).reverse());
  const reorderedReview = Object.fromEntries(Object.entries(bound.observation).reverse());
  const second = createAcceptanceAdmission(f.root, { context: reorderedContext, observedReviews: [reorderedReview] });
  assert.equal(canonical(first.record), canonical(second.record));
  assert.equal(first.sha256, second.sha256);
  const originalBytes = canonical(first.record);
  context.attempt = 99;
  observedReviews[0].state = "CHANGES_REQUESTED";
  assert.equal(canonical(first.record), originalBytes, "Completed admission bytes cannot follow caller mutations");
  assert.equal(sha256(originalBytes), first.sha256);
});

test("new binding creation requires its exact review observations and preserves predecessor acceptance", (t) => {
  const f = fixture(t);
  const bound = f.bound();
  const context = f.context(bound.binding, bound.candidate);
  assert.throws(() => createAcceptanceAdmission(f.root, { context }));
  const value = createAcceptanceAdmission(f.root, { context, observedReviews: [bound.observation] });
  assert.equal(value.record.resolution.admission, "binding");
  assert.equal(value.record.resolution.required.suiteCommit, f.genesis.suiteCommit);
  assert.equal(value.record.resolution.pendingBinding.suiteCommit, bound.entry.suiteCommit);
  assert.deepEqual(value.record.observedReviews, [bound.observation]);
  assert.deepEqual(verify(f, value, context), value.record.resolution);
});

test("invalid or ambiguous new-binding observations cannot become a consistent admission record", (t) => {
  const f = fixture(t);
  const bound = f.bound();
  const context = f.context(bound.binding, bound.candidate);
  for (const change of [
    { state: "CHANGES_REQUESTED" },
    { author: bound.observation.reviewer },
    { repository: "other/private-mp3" },
    { reviewedTree: "9".repeat(40) },
    { merged: false },
  ]) {
    assert.throws(() =>
      createAcceptanceAdmission(f.root, { context, observedReviews: [{ ...bound.observation, ...change }] }),
    );
  }
  assert.throws(() =>
    createAcceptanceAdmission(f.root, { context, observedReviews: [bound.observation, bound.observation] }),
  );
});

test("historically admitted binding activates successor without inventing another review observation", (t) => {
  const f = fixture(t);
  const bound = f.bound();
  f.put("server/src/parser.ts", "// Synthetic implementation after admitted binding.\n");
  const source = f.commit("activate independently bound successor");
  const context = f.context(source, bound.binding);
  const value = createAcceptanceAdmission(f.root, { context });
  assert.deepEqual(value.record.observedReviews, []);
  assert.equal(value.record.resolution.activationCommit, source);
  assert.equal(value.record.resolution.required.suiteCommit, bound.entry.suiteCommit);
  assert.deepEqual(verify(f, value, context), value.record.resolution);
});

test("closed schemas reject hidden record fields, caller-supplied decisions and trust overrides", (t) => {
  const f = fixture(t);
  const context = f.context();
  const value = createAcceptanceAdmission(f.root, { context });
  for (const addition of [
    { trusted: true },
    { resolution: value.record.resolution },
    { sourceRevision: f.bootstrap },
  ]) {
    assert.throws(() => createAcceptanceAdmission(f.root, { context, ...addition }));
  }
  for (const field of ["authority", "token", "selectedSuite"]) {
    const record = structuredClone(value.record);
    record[field] = "untrusted-override";
    assert.throws(() => verify(f, rehashed(record), context));
  }
  for (const field of ["context", "observedReviews", "resolution", "kind"]) {
    const record = structuredClone(value.record);
    delete record[field];
    assert.throws(() => verify(f, rehashed(record), context));
  }
  assert.throws(() =>
    verifyAcceptanceAdmission(f.root, {
      record: value.record,
      expectedContext: context,
      expectedSha256: value.sha256,
      trusted: true,
    }),
  );
});

test("CI context rejects unsupported events, refs, identities, attempts and undeclared fields", (t) => {
  const f = fixture(t);
  const context = f.context();
  for (const change of [
    { repository: "example/private-mp3/../../other" },
    { eventName: "local" },
    { eventName: "workflow_dispatch" },
    { ref: "refs/heads/preview" },
    { eventName: "pull_request", ref: "refs/heads/main" },
    { eventName: "pull_request", ref: "refs/pull/0/merge" },
    { runId: 0 },
    { runId: "42001" },
    { runId: Number.MAX_SAFE_INTEGER + 1 },
    { attempt: 0 },
    { sourceRevision: "main" },
    { sourceTree: "0".repeat(40) },
    { baseRevision: "HEAD^" },
    { workflowRevision: context.baseRevision },
    { toolingRevision: context.sourceRevision },
    { trusted: true },
  ]) {
    assert.throws(() => createAcceptanceAdmission(f.root, { context: { ...context, ...change } }));
  }
  for (const field of Object.keys(context)) {
    const incomplete = { ...context };
    delete incomplete[field];
    assert.throws(() => createAcceptanceAdmission(f.root, { context: incomplete }));
  }
});

test("verification requires every expected context field to match the original producing context", (t) => {
  const f = fixture(t);
  const context = f.context();
  const value = createAcceptanceAdmission(f.root, { context });
  for (const change of [
    { repository: "other/private-mp3" },
    { eventName: "pull_request", ref: "refs/pull/17/merge" },
    { sourceRevision: f.product, sourceTree: f.git("rev-parse", `${f.product}^{tree}`), workflowRevision: f.product },
    { sourceTree: "9".repeat(40) },
    { baseRevision: f.genesis.suiteCommit, toolingRevision: f.genesis.suiteCommit },
    { workflowRevision: f.product },
    { toolingRevision: f.bootstrap },
    { runId: context.runId + 1 },
    { attempt: context.attempt + 1 },
  ]) {
    assert.throws(() => verify(f, value, { ...context, ...change }));
  }
  assert.deepEqual(verify(f, value, context), value.record.resolution, "Original-attempt replay remains usable");
});

test("digest checks and fresh resolver parity reject rehashed policy or required-decision tampering", (t) => {
  const f = fixture(t);
  const bound = f.bound();
  f.put("server/src/parser.ts", "// Synthetic successor implementation.\n");
  const source = f.commit("activate successor for tamper controls");
  const context = f.context(source, bound.binding);
  const value = createAcceptanceAdmission(f.root, { context });
  assert.throws(() => verify(f, { record: value.record, sha256: "0".repeat(64) }, context));
  for (const mutate of [
    (record) => {
      record.resolution.policySha256 = "0".repeat(64);
    },
    (record) => {
      record.resolution.required = structuredClone(f.genesis);
    },
    (record) => {
      record.resolution.activationCommit = null;
    },
    (record) => {
      record.resolution.admission = "documentation";
    },
    (record) => {
      record.resolution.extraTrust = true;
    },
  ]) {
    const record = structuredClone(value.record);
    mutate(record);
    assert.throws(() => verify(f, rehashed(record), context));
  }
});

test("local validation results cannot masquerade as CI admission records", (t) => {
  const f = fixture(t);
  const context = f.context();
  const value = createAcceptanceAdmission(f.root, { context });
  const record = { ...structuredClone(value.record), kind: "local-validation" };
  assert.throws(() => verify(f, rehashed(record), context));
  const unsupported = { ...structuredClone(value.record), schemaVersion: 2 };
  assert.throws(() => verify(f, rehashed(unsupported), context));
  assert.throws(() =>
    createAcceptanceAdmission(f.root, { context: { sourceRevision: f.bootstrap, baseRevision: f.product } }),
  );
});

test("historical admission bytes remain tied to their original source despite later HEAD and worktree changes", (t) => {
  const f = fixture(t);
  const context = f.context();
  const first = createAcceptanceAdmission(f.root, { context });
  const original = canonical(first.record);
  const bound = f.bound();
  f.put("server/src/parser.ts", "// Later synthetic successor implementation.\n");
  f.commit("later implementation after old recorded source");
  f.put(registryPath, "uncommitted policy bytes must never select historical acceptance\n");
  const replay = createAcceptanceAdmission(f.root, { context });
  assert.equal(canonical(replay.record), original);
  assert.equal(replay.sha256, first.sha256);
  assert.deepEqual(verify(f, first, context), first.record.resolution);
  assert.equal(first.record.resolution.required.suiteCommit, f.genesis.suiteCommit);
  assert.notEqual(first.record.resolution.required.suiteCommit, bound.entry.suiteCommit);
});
