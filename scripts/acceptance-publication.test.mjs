/**
 * Independently specify acceptance-admission publication gates before their integration is implemented.
 * Run `node --test scripts/acceptance-publication.test.mjs` with pinned Node after the implementation is available.
 * Disposable committed histories, synthetic archives and an in-memory GitHub API exercise exact original-attempt
 * evidence and immutable legacy retries. Expected admission records are assembled here, without resolver/record helpers.
 * Tests write and remove temporary fixtures only; no application code, Docker, network, credentials or real release runs.
 * Rejection controls require publication to fail before either external mutations or generated provenance writes.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import {
  publicationMaterial,
  requireObservedChecks,
  verifyReleaseBundle,
  verifyReleaseSource,
} from "./publish-release-evidence.mjs";
import { publishRelease } from "./publish-release.mjs";
import {
  archiveIdentity,
  configurationFingerprint,
  createManifest,
  preparationIdentity,
  releaseNotes,
} from "./release-manifest.mjs";

const repository = "example/private-mp3";
const registryPath = "docs/testing/acceptance-transitions.json";
const manifestPath = "tests/acceptance/fixtures/manifest.json";
const assetNames = [
  "SHA256SUMS",
  "api.docker.tar",
  "ci-origin.json",
  "e2e-result.json",
  "frontend.docker.tar",
  "manifest.json",
  "release-notes.md",
  "reservation.json",
];
const configurationPaths = [
  ".dockerignore",
  "compose.yaml",
  "frontend/.dockerignore",
  "frontend/Dockerfile",
  "frontend/entrypoint.sh",
  "frontend/nginx.conf.template",
  "server/Dockerfile",
];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

/** Independent canonical JSON oracle: ordering of object keys is irrelevant; array order remains significant. */
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

/** The test owns both expected record bytes and the independent digest delivered by the trusted product output. */
const seal = (record) => ({ record, sha256: sha256(canonical(record)) });

async function fixture(t, { policy = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), "mp3-admission-publication-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync(
      "git",
      ["-c", "user.name=Independent Publication Fixture", "-c", "user.email=publication@example.invalid", ...args],
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
  put("README.md", "Synthetic publication fixture foundation.\n");
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
  const configurationFiles = Object.fromEntries(
    configurationPaths.map((path) => [path, Buffer.from(`Synthetic ${path}\n`)]),
  );
  for (const [path, bytes] of Object.entries(configurationFiles)) put(path, bytes);
  const product = commit("product after independent genesis");
  let source = product;
  if (policy) {
    json(registryPath, { schemaVersion: 1, transitions: [] });
    source = commit("dormant transition policy");
  }
  const context = {
    schemaVersion: 1,
    repository,
    sourceRevision: source,
    baseRevision: policy ? product : genesisCommit,
    runId: 42001,
    attempt: 1,
    workflow: ".github/workflows/ci.yml",
    workflowRevision: source,
  };
  const admission = policy
    ? seal({
        schemaVersion: 1,
        kind: "ci-acceptance-admission",
        context: {
          repository,
          eventName: "push",
          ref: "refs/heads/main",
          sourceRevision: source,
          sourceTree: git("rev-parse", `${source}^{tree}`),
          baseRevision: product,
          workflowRevision: source,
          toolingRevision: product,
          runId: 42001,
          attempt: 1,
        },
        observedReviews: [],
        resolution: {
          genesis,
          required: genesis,
          candidate: null,
          pendingBinding: null,
          admission: "bootstrap",
          bindingCommit: null,
          activationCommit: null,
          policySha256: sha256(readFileSync(join(root, registryPath))),
        },
      })
    : undefined;
  const report = {
    schemaVersion: 1,
    status: "passed",
    cleanup: "passed",
    targetKind: "local",
    sourceDirty: false,
    trackedDiffSha256: sha256(""),
    sourceRevision: source,
    suiteCommit: genesis.suiteCommit,
    suiteTree: genesis.suiteTree,
    manifestSha256: genesis.manifestSha256,
    contractRevision: "r3",
    baselinePublication: "protected-main",
    configurationSha256: "5".repeat(64),
    project: "mp3-e2e-admission-publication",
    acceptance: { status: "passed", planned: 60, passed: 60, failed: 0, skipped: 0 },
    images: { api: `sha256:${"a".repeat(64)}`, frontend: `sha256:${"b".repeat(64)}` },
    ...(policy ? { acceptanceAdmission: structuredClone(admission) } : {}),
  };
  const directory = join(root, ".artifacts/release-input");
  const generated = join(root, ".artifacts/generated");
  mkdirSync(directory, { recursive: true });
  mkdirSync(generated);
  const archives = {};
  for (const service of ["api", "frontend"]) {
    writeFileSync(join(directory, `${service}.docker.tar`), `Synthetic ${service} archive`);
    archives[service] = await archiveIdentity(join(directory, `${service}.docker.tar`));
  }
  const configuration = configurationFingerprint(configurationFiles);
  const f = { root, directory, generated, git, put, json, commit, genesis, product, context, report, admission };
  f.prepare = (nextReport = f.report, origin = f.context) => {
    const ordinal = Number(git("rev-list", "--first-parent", "--count", origin.sourceRevision));
    const identity = preparationIdentity(nextReport, ordinal, configuration);
    const manifest = createManifest(identity, origin.sourceRevision, archives);
    writeJson(join(directory, "manifest.json"), manifest);
    writeJson(join(directory, "reservation.json"), identity);
    writeJson(join(directory, "ci-origin.json"), origin);
    writeJson(join(directory, "e2e-result.json"), nextReport);
    writeFileSync(join(directory, "release-notes.md"), releaseNotes(manifest));
    writeFileSync(
      join(directory, "SHA256SUMS"),
      ["api", "frontend"].map((service) => `${archives[service].sha256}  ${service}.docker.tar\n`).join(""),
    );
    return { identity, manifest, configuration };
  };
  f.prepared = f.prepare();
  return f;
}

function verify(f, context = f.context, expectedAdmissionSha256 = f.admission?.sha256) {
  return verifyReleaseBundle(f.root, f.directory, context, { expectedAdmissionSha256 });
}

const snapshot = (f) => Object.fromEntries(assetNames.map((name) => [name, readFileSync(join(f.directory, name))]));

/** In-memory API rejects unrecognized requests and records every mutation, including an unexpected one. */
function fakeApi(bundle) {
  const { origin } = bundle;
  const prefix = `/repos/${origin.repository}`;
  const runRoute = `/actions/runs/${origin.runId}/attempts/${origin.attempt}`;
  const state = {
    repository: { full_name: repository, private: true, default_branch: "main" },
    branch: { name: "main", protected: true, commit: { sha: origin.sourceRevision } },
    comparison: { status: "identical" },
    run: {
      id: origin.runId,
      run_attempt: origin.attempt,
      head_sha: origin.sourceRevision,
      head_branch: "main",
      event: "push",
      path: origin.workflow,
      repository: { full_name: repository },
    },
    jobs: ["control-plane", "validate-foundation", "validate-product"].map((name) => ({
      name,
      head_sha: origin.sourceRevision,
      run_attempt: origin.attempt,
      status: "completed",
      conclusion: "success",
      steps:
        name === "control-plane"
          ? []
          : [{ name: "Validate acceptance admission", number: 1, status: "completed", conclusion: "success" }],
    })),
    releases: [],
    assets: [],
    tag: null,
    mutations: [],
    requests: [],
  };
  return {
    state,
    async list(path) {
      state.requests.push({ method: "LIST", path });
      if (path === `${runRoute}/jobs`) return structuredClone(state.jobs);
      if (path === "/releases/42/assets") return structuredClone(state.assets);
      if (path === "/releases") return structuredClone(state.releases);
      throw new Error(`Unexpected collection ${path}`);
    },
    async request(method, path, data) {
      state.requests.push({ method, path });
      assert(path === prefix || path.startsWith(`${prefix}/`), "Unexpected repository");
      const route = path.slice(prefix.length);
      if (method === "GET") {
        if (!route) return structuredClone(state.repository);
        if (route === "/branches/main") return structuredClone(state.branch);
        if (route === runRoute) return structuredClone(state.run);
        if (route === `/compare/${origin.sourceRevision}...${state.branch.commit.sha}`)
          return structuredClone(state.comparison);
        if (route === `/git/ref/tags/v${bundle.manifest.version}`)
          return state.tag ? { object: { type: "commit", sha: state.tag } } : null;
        throw new Error(`Unexpected read ${route}`);
      }
      state.mutations.push({ method, route, data: structuredClone(data) });
      if (method === "POST" && route === "/git/refs") {
        state.tag = data.sha;
        return { object: { type: "commit", sha: data.sha } };
      }
      if (method === "POST" && route === "/releases") {
        state.releases.push({ ...data, id: 42 });
        return structuredClone(state.releases[0]);
      }
      if (method === "POST" && route.startsWith("/releases/42/assets?name=")) {
        const name = new URL(`https://api.github.com${route}`).searchParams.get("name");
        const bytes = readFileSync(data.path);
        const asset = { name, state: "uploaded", size: bytes.length, digest: `sha256:${sha256(bytes)}` };
        state.assets.push(asset);
        return structuredClone(asset);
      }
      if (method === "PATCH" && route === "/releases/42") {
        state.releases[0].draft = data.draft;
        return structuredClone(state.releases[0]);
      }
      throw new Error(`Unexpected mutation ${method} ${route}`);
    },
  };
}

test("new-policy publication verifies the independently specified canonical bootstrap admission", async (t) => {
  const f = await fixture(t);
  const before = snapshot(f);
  const source = verifyReleaseSource(f.root, f.context, {
    admission: f.admission,
    expectedAdmissionSha256: f.admission.sha256,
  });
  assert.deepEqual(source.baseline, f.genesis);
  assert.equal(source.ordinal, 4);
  const bundle = await verify(f);
  assert.deepEqual(Object.keys(bundle).sort(), ["acceptanceAdmission", "assets", "manifest", "origin"]);
  assert.deepEqual(bundle.acceptanceAdmission, f.admission);
  assert.equal(bundle.manifest.version, "0.1.4");
  assert.deepEqual(snapshot(f), before);
  const api = fakeApi(bundle);
  const result = await publishRelease(bundle, api, f.generated);
  assert.equal(result.status, "released-not-deployed");
  assert.equal(result.deployed, false);
  assert.equal(api.state.releases[0].draft, false);
  assert.equal(api.state.assets.length, 10);
});

test("legacy three-argument verification retains schema-1 identity, all bytes and immutable retry", async (t) => {
  const f = await fixture(t, { policy: false });
  const expectedIdentity = {
    version: "0.1.3",
    ordinal: 3,
    platform: "linux/amd64",
    evidence: {
      sourceRevision: f.context.sourceRevision,
      suiteCommit: f.genesis.suiteCommit,
      suiteTree: f.genesis.suiteTree,
      fixtureManifestSha256: f.genesis.manifestSha256,
      contractRevision: "r3",
      baselinePublication: "protected-main",
      runId: "mp3-e2e-admission-publication",
      localAcceptanceConfigurationSha256: "5".repeat(64),
      acceptance: { status: "passed", planned: 60, passed: 60, failed: 0, skipped: 0 },
      images: { api: `sha256:${"a".repeat(64)}`, frontend: `sha256:${"b".repeat(64)}` },
    },
    sourceConfiguration: f.prepared.configuration,
  };
  const before = snapshot(f);
  assert.deepEqual(JSON.parse(before["reservation.json"]), expectedIdentity);
  const bundle = await verifyReleaseBundle(f.root, f.directory, f.context);
  assert.deepEqual(Object.keys(bundle).sort(), ["assets", "manifest", "origin"]);
  assert.deepEqual(bundle.manifest.identity, expectedIdentity);
  assert.equal(bundle.manifest.schemaVersion, 1);
  assert.deepEqual(verifyReleaseSource(f.root, f.context).baseline, f.genesis);
  const material = publicationMaterial(bundle);
  assert.equal(Object.hasOwn(JSON.parse(material.json), "acceptanceAdmission"), false);
  const api = fakeApi(bundle);
  for (const job of api.state.jobs) delete job.steps;
  await publishRelease(bundle, api, f.generated);
  api.state.mutations.length = 0;
  const retryBundle = await verifyReleaseBundle(f.root, f.directory, { ...f.context, attempt: 2 });
  const retried = await publishRelease(retryBundle, api, f.generated);
  assert.equal(retried.reused, true);
  assert.deepEqual(api.state.mutations, []);
  assert.deepEqual(snapshot(f), before);
  assert.deepEqual(publicationMaterial(retryBundle), material);
  assert.equal(readFileSync(join(f.generated, "publication.json"), "utf8"), material.json);

  const postPolicy = await fixture(t);
  for (const admission of [null, {}, postPolicy.admission]) {
    writeJson(join(f.directory, "e2e-result.json"), { ...f.report, acceptanceAdmission: admission });
    await assert.rejects(
      verifyReleaseBundle(f.root, f.directory, f.context),
      "A legacy source cannot silently discard a report's admission claim",
    );
  }
});

test("policy introduction makes missing, malformed and tampered report admissions fatal", async (t) => {
  const f = await fixture(t);
  const malformed = [
    undefined,
    null,
    {},
    { record: f.admission.record },
    { sha256: f.admission.sha256 },
    { ...structuredClone(f.admission), extra: true },
    { ...structuredClone(f.admission), sha256: "0".repeat(64) },
  ];
  const tampered = structuredClone(f.admission);
  tampered.record.resolution.admission = "documentation";
  malformed.push(tampered);
  for (const admission of malformed) {
    const report = structuredClone(f.report);
    if (admission === undefined) delete report.acceptanceAdmission;
    else report.acceptanceAdmission = admission;
    writeJson(join(f.directory, "e2e-result.json"), report);
    await assert.rejects(verify(f));
    assert.throws(() =>
      verifyReleaseSource(f.root, f.context, { admission, expectedAdmissionSha256: f.admission.sha256 }),
    );
  }
});

test("report hashes cannot replace the independently supplied product admission digest", async (t) => {
  const f = await fixture(t);
  await assert.rejects(verifyReleaseBundle(f.root, f.directory, f.context));
  assert.throws(() => verifyReleaseSource(f.root, f.context, { admission: f.admission }));
  for (const expectedAdmissionSha256 of [null, "", "bad", "0".repeat(64)]) {
    await assert.rejects(verifyReleaseBundle(f.root, f.directory, f.context, { expectedAdmissionSha256 }));
    assert.throws(() => verifyReleaseSource(f.root, f.context, { admission: f.admission, expectedAdmissionSha256 }));
  }
});

test("admission context must match exact source, tree, base, workflow, repository, run and attempt", async (t) => {
  const f = await fixture(t);
  const changes = [
    { repository: "other/private-mp3" },
    { eventName: "pull_request", ref: "refs/pull/12/merge" },
    { ref: "refs/heads/other" },
    { sourceRevision: f.product, workflowRevision: f.product },
    { sourceTree: f.git("rev-parse", `${f.product}^{tree}`) },
    { baseRevision: f.genesis.suiteCommit, toolingRevision: f.genesis.suiteCommit },
    { workflowRevision: f.product },
    { toolingRevision: f.genesis.suiteCommit },
    { runId: 42002 },
    { attempt: 2 },
  ];
  for (const fields of changes) {
    const record = structuredClone(f.admission.record);
    Object.assign(record.context, fields);
    const changed = seal(record);
    writeJson(join(f.directory, "e2e-result.json"), { ...f.report, acceptanceAdmission: changed });
    await assert.rejects(verify(f, f.context, changed.sha256));
    assert.throws(() =>
      verifyReleaseSource(f.root, f.context, { admission: changed, expectedAdmissionSha256: changed.sha256 }),
    );
  }
});

test("deleting an introduced transition policy cannot reopen legacy publication", async (t) => {
  const f = await fixture(t);
  const original = f.context.sourceRevision;
  rmSync(join(f.root, registryPath));
  const source = f.commit("invalid policy deletion");
  const context = { ...f.context, sourceRevision: source, workflowRevision: source, baseRevision: original };
  const report = { ...f.report, sourceRevision: source };
  delete report.acceptanceAdmission;
  f.prepare(report, context);
  assert.throws(() => verifyReleaseSource(f.root, context));
  await assert.rejects(verifyReleaseBundle(f.root, f.directory, context));
});

test("a later publication retry reuses the original admission and original producing jobs", async (t) => {
  const f = await fixture(t);
  const before = snapshot(f);
  const retryContext = { ...f.context, attempt: 3 };
  const bundle = await verify(f, retryContext);
  assert.equal(bundle.origin.attempt, 1);
  assert.equal(bundle.acceptanceAdmission.record.context.attempt, 1);
  const api = fakeApi(bundle);
  await publishRelease(bundle, api, f.generated);
  assert(api.state.requests.some(({ path }) => path === `/repos/${repository}/actions/runs/42001/attempts/1`));
  assert(api.state.requests.some(({ path }) => path === "/actions/runs/42001/attempts/1/jobs"));
  assert(api.state.requests.every(({ path }) => !path.includes("/attempts/3")));
  assert.deepEqual(snapshot(f), before);
  const record = structuredClone(f.admission.record);
  record.context.attempt = 3;
  const substituted = seal(record);
  writeJson(join(f.directory, "e2e-result.json"), { ...f.report, acceptanceAdmission: substituted });
  await assert.rejects(verify(f, retryContext, substituted.sha256));
});

test("prepared acceptance must equal the required suite, even when report and manifest agree", async (t) => {
  const f = await fixture(t);
  for (const fields of [
    { suiteCommit: f.product },
    { suiteTree: "1".repeat(40) },
    { manifestSha256: "1".repeat(64) },
    { contractRevision: "r4" },
  ]) {
    f.prepare({ ...f.report, ...fields });
    await assert.rejects(verify(f));
  }
});

test("a correctly hashed but invented admission decision must fail resolver parity", async (t) => {
  const f = await fixture(t);
  for (const fields of [
    { admission: "documentation" },
    { policySha256: "0".repeat(64) },
    { activationCommit: f.context.sourceRevision },
    { required: { ...f.genesis, suiteCommit: f.product } },
    { candidate: { ...f.genesis, contractRevision: "r4" } },
  ]) {
    const record = structuredClone(f.admission.record);
    Object.assign(record.resolution, fields);
    const changed = seal(record);
    writeJson(join(f.directory, "e2e-result.json"), { ...f.report, acceptanceAdmission: changed });
    await assert.rejects(verify(f, f.context, changed.sha256));
    assert.throws(() =>
      verifyReleaseSource(f.root, f.context, { admission: changed, expectedAdmissionSha256: changed.sha256 }),
    );
  }
});

test("each original foundation/product preflight must succeed exactly once before any publication writes", async (t) => {
  const f = await fixture(t);
  const bundle = await verify(f);
  const mutations = [
    (job) => delete job.steps,
    (job) => (job.steps = []),
    (job) => (job.steps[0].conclusion = "skipped"),
    (job) => (job.steps[0].conclusion = "failure"),
    (job) => (job.steps[0].status = "in_progress"),
    (job) => (job.steps[0].name = "Validate acceptance admission elsewhere"),
    (job) => job.steps.push({ ...job.steps[0], number: 2 }),
    (job) => (job.run_attempt = 2),
  ];
  for (const name of ["validate-foundation", "validate-product"]) {
    for (const mutate of mutations) {
      const api = fakeApi(bundle);
      mutate(api.state.jobs.find((job) => job.name === name));
      const { repository: repo, branch, comparison, run, jobs } = api.state;
      assert.throws(() => requireObservedChecks(bundle, repo, branch, comparison, run, jobs));
      await assert.rejects(publishRelease(bundle, api, f.generated));
      assert.deepEqual(api.state.mutations, []);
      assert.equal(existsSync(join(f.generated, "publication.json")), false);
      assert.equal(existsSync(join(f.generated, "publication-notes.md")), false);
    }
  }
  const api = fakeApi(bundle);
  api.state.run.run_attempt = 2;
  await assert.rejects(publishRelease(bundle, api, f.generated));
  assert.deepEqual(api.state.mutations, []);
  assert.equal(existsSync(join(f.generated, "publication.json")), false);
  assert.equal(existsSync(join(f.generated, "publication-notes.md")), false);
});
