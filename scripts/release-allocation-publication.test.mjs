/**
 * Specify source-bound release publication before VER-01 implementation, independently of its allocation algorithm.
 * Run `node --test scripts/release-allocation-publication.test.mjs` with pinned Node once implementation is available.
 * Disposable Git histories and synthetic archives bind explicit ordinal/line expectations; injected fake APIs record
 * external mutations. The actual bundle CLI uses a fixture-only preparation stub, so no Docker, credentials, registry,
 * real GitHub API or real release is involved. Fixtures clean up their own temporary files. Failing trust checks must
 * preserve existing bytes and remote state; literal schema-1 goldens live in publish-release.test.mjs.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { publicationMaterial, verifyReleaseBundle, verifyReleaseSource } from "./publish-release-evidence.mjs";
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
const policyBytes = (line) =>
  `${JSON.stringify({ schemaVersion: 1, strategy: "global-first-parent-ordinal", line }, null, 2)}\n`;
const policyBinding = (line) => ({
  schemaVersion: 1,
  strategy: "global-first-parent-ordinal",
  line,
  sha256: sha256(policyBytes(line)),
});

/** Independent JSON canonicalization seals fixture records; no production admission/allocation helper supplies trust. */
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
const seal = (record) => ({ record, sha256: sha256(canonical(record)) });

async function fixture(t, { line = "0.2", consumer = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "mp3-allocation-publication-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync(
      "git",
      ["-c", "user.name=Independent Allocation Fixture", "-c", "user.email=allocation@example.invalid", ...args],
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
  put("README.md", "Independent allocation fixture.\n");
  if (consumer) {
    for (const name of [
      "publish-release-bundle",
      "publish-release-evidence",
      "release-manifest",
      "acceptance-baseline",
      "phase-policy",
      "acceptance-admission",
      "acceptance-transitions",
      "acceptance-preflight",
      "acceptance-review-observations",
      "acceptance-review-http",
    ])
      put(`scripts/${name}.mjs`, readFileSync(new URL(`./${name}.mjs`, import.meta.url)));
    // This fixture-only stub models completed preparation; Docker and network are never available to it.
    put(
      "scripts/prepare-release.mjs",
      [
        'import { cpSync, mkdirSync, writeFileSync } from "node:fs";',
        'mkdirSync(".artifacts/releases/0.2.6", { recursive: true });',
        'cpSync(".artifacts/expected-prepared", ".artifacts/releases/0.2.6", { recursive: true });',
        'writeFileSync(".artifacts/preparation-called", "exact fixture archives only\\n");',
      ].join("\n") + "\n",
    );
  }
  commit("foundation");
  json("tests/acceptance/package.json", { private: true, scripts: { check: "node check.mjs" } });
  put("tests/acceptance/check.mjs", "// Independent synthetic suite, not executed.\n");
  json(manifestPath, { contractRevision: "r3", independentCount: 3 });
  put("docs/testing/acceptance-contract.md", "# Independent immutable r3 contract\n");
  const suiteCommit = commit("independent pre-product suite");
  const genesis = {
    schemaVersion: 1,
    contractRevision: "r3",
    suiteCommit,
    suiteTree: git("rev-parse", `${suiteCommit}:tests/acceptance`),
    manifestSha256: sha256(readFileSync(join(root, manifestPath))),
    publicationStatus: "protected-main",
  };
  json("docs/testing/baseline.json", genesis);
  put("server/src/parser.ts", "// Synthetic product marker.\n");
  const configurationFiles = Object.fromEntries(
    configurationPaths.map((path) => [path, Buffer.from(`Synthetic ${path}\n`)]),
  );
  for (const [path, bytes] of Object.entries(configurationFiles)) put(path, bytes);
  const product = commit("product after independent genesis");
  json(registryPath, { schemaVersion: 1, transitions: [] });
  const gate = commit("dormant acceptance policy");
  let source = gate;
  let base = product;
  let ordinal = 4;
  if (line) {
    put("release-policy.json", policyBytes("0.1"));
    base = source;
    source = commit("initial 0.1 release policy");
    ordinal = 5;
    if (line !== "0.1") {
      put("release-policy.json", policyBytes(line));
      base = source;
      source = commit("approved next release line");
      ordinal = 6;
    }
  }
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
  const f = { root, directory, generated, git, put, json, commit, genesis, product, gate };
  f.bindSource = (sourceRevision, baseRevision, expectedOrdinal, selectedLine) => {
    f.ordinal = expectedOrdinal;
    f.policy = selectedLine ? policyBinding(selectedLine) : null;
    f.context = {
      schemaVersion: 1,
      repository,
      sourceRevision,
      baseRevision,
      runId: 42001,
      attempt: 1,
      workflow: ".github/workflows/ci.yml",
      workflowRevision: sourceRevision,
    };
    f.admission = seal({
      schemaVersion: 1,
      kind: "ci-acceptance-admission",
      context: {
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
      },
      observedReviews: [],
      resolution: {
        genesis,
        required: genesis,
        candidate: null,
        pendingBinding: null,
        admission: sourceRevision === gate ? "bootstrap" : "governance",
        bindingCommit: null,
        activationCommit: null,
        policySha256: sha256(readFileSync(join(root, registryPath))),
      },
    });
    f.report = {
      schemaVersion: 1,
      status: "passed",
      cleanup: "passed",
      targetKind: "local",
      sourceDirty: false,
      trackedDiffSha256: sha256(""),
      sourceRevision,
      suiteCommit,
      suiteTree: genesis.suiteTree,
      manifestSha256: genesis.manifestSha256,
      contractRevision: "r3",
      baselinePublication: "protected-main",
      configurationSha256: "5".repeat(64),
      project: "mp3-e2e-allocation-publication",
      acceptance: { status: "passed", planned: 60, passed: 60, failed: 0, skipped: 0 },
      images: { api: `sha256:${"a".repeat(64)}`, frontend: `sha256:${"b".repeat(64)}` },
      acceptanceAdmission: structuredClone(f.admission),
    };
  };
  f.bindSource(source, base, ordinal, line);
  f.writePrepared = (identity, manifest, report = f.report, origin = f.context) => {
    writeJson(join(directory, "manifest.json"), manifest);
    writeJson(join(directory, "reservation.json"), identity);
    writeJson(join(directory, "ci-origin.json"), origin);
    writeJson(join(directory, "e2e-result.json"), report);
    writeFileSync(join(directory, "release-notes.md"), releaseNotes(manifest));
    writeFileSync(
      join(directory, "SHA256SUMS"),
      ["api", "frontend"].map((service) => `${archives[service].sha256}  ${service}.docker.tar\n`).join(""),
    );
  };
  f.prepare = () => {
    const legacyIdentity = preparationIdentity(f.report, f.ordinal, configuration);
    const legacyManifest = createManifest(legacyIdentity, f.context.sourceRevision, archives);
    const identity = f.policy
      ? { ...legacyIdentity, version: `${f.policy.line}.${f.ordinal}`, releasePolicy: f.policy }
      : legacyIdentity;
    // New expected allocation is constructed explicitly, never by the implementation's source-policy resolver.
    const manifest = f.policy
      ? {
          ...legacyManifest,
          schemaVersion: 2,
          version: identity.version,
          reservationSha256: sha256(canonical(identity)),
          identity,
        }
      : legacyManifest;
    f.writePrepared(identity, manifest);
    return { identity, manifest };
  };
  f.prepared = f.prepare();
  return f;
}

const verify = (f, context = f.context, expectedAdmissionSha256 = f.admission.sha256) =>
  verifyReleaseBundle(f.root, f.directory, context, { expectedAdmissionSha256 });
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
    failAsset: null,
    latest: null,
    afterUpload: null,
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
        state.releases.unshift({ ...data, id: 42 });
        return structuredClone(state.releases[0]);
      }
      if (method === "POST" && route.startsWith("/releases/42/assets?name=")) {
        const name = new URL(`https://api.github.com${route}`).searchParams.get("name");
        if (state.failAsset === name) throw new Error("Synthetic upload failure");
        const bytes = readFileSync(data.path);
        const asset = { name, state: "uploaded", size: bytes.length, digest: `sha256:${sha256(bytes)}` };
        state.assets.push(asset);
        state.afterUpload?.(name);
        return structuredClone(asset);
      }
      if (method === "PATCH" && route === "/releases/42") {
        state.releases[0].draft = data.draft;
        state.latest = data.make_latest;
        return structuredClone(state.releases[0]);
      }
      throw new Error(`Unexpected mutation ${method} ${route}`);
    },
  };
}

test("source verification and schema-2 bundle bind the explicit global ordinal and committed policy bytes", async (t) => {
  const f = await fixture(t);
  const before = snapshot(f);
  const source = verifyReleaseSource(f.root, f.context, {
    admission: f.admission,
    expectedAdmissionSha256: f.admission.sha256,
  });
  assert.deepEqual(source.allocation, {
    sourceRevision: f.context.sourceRevision,
    version: "0.2.6",
    ordinal: 6,
    policy: f.policy,
  });
  const bundle = await verify(f);
  assert.equal(bundle.manifest.schemaVersion, 2);
  assert.equal(bundle.manifest.version, "0.2.6");
  assert.equal(bundle.manifest.ordinal, 6);
  assert.deepEqual(bundle.manifest.identity.releasePolicy, f.policy);
  assert.equal(Object.hasOwn(bundle.manifest, "releasePolicy"), false, "The reservation alone owns the policy binding");
  assert.deepEqual(bundle.acceptanceAdmission, f.admission);
  assert.deepEqual(snapshot(f), before, "Verification cannot rewrite the original prepared bytes");
  const material = publicationMaterial(bundle);
  const record = JSON.parse(material.json);
  assert.equal(record.schemaVersion, 2);
  assert.deepEqual(Object.keys(record).slice(-2), ["ordinal", "releasePolicy"]);
  assert.equal(record.ordinal, 6);
  assert.deepEqual(record.releasePolicy, f.policy);
  assert.equal(record.version, "0.2.6");
  assert.equal(record.tag, "v0.2.6");
  assert.deepEqual(record.ci, f.context);
  assert.equal(material.binding, sha256(canonical(record)));
  assert.deepEqual(publicationMaterial(bundle), material);
  for (const notes of [material.notes, readFileSync(join(f.directory, "release-notes.md"), "utf8")]) {
    assert(notes.includes(f.policy.line), "Notes must identify the approved line");
    assert(notes.includes(String(f.ordinal)), "Notes must identify the global ordinal");
    assert(notes.includes(f.policy.sha256), "Notes must bind the exact committed policy bytes");
  }
});

test("self-consistent reservation edits cannot substitute policy, schema, source or allocation authority", async (t) => {
  const f = await fixture(t);
  const pristine = structuredClone(f.prepared);
  const controls = [
    (i, m) => {
      i.releasePolicy.sha256 = "9".repeat(64);
    },
    (i, m) => {
      i.releasePolicy.line = "0.3";
      i.version = m.version = "0.3.6";
    },
    (i, m) => {
      i.ordinal = m.ordinal = 7;
      i.version = m.version = "0.2.7";
    },
    (i, m) => {
      delete i.releasePolicy;
      m.schemaVersion = 1;
      i.version = m.version = "0.1.6";
    },
    (i, m) => {
      delete i.releasePolicy;
    },
    (i, m) => {
      m.schemaVersion = 1;
    },
    (i, m) => {
      m.schemaVersion = 3;
    },
    (i, m) => {
      m.releasePolicy = structuredClone(i.releasePolicy);
    },
    (i, m) => {
      i.evidence.sourceRevision = m.sourceRevision = "d".repeat(40);
    },
  ];
  for (const change of controls) {
    const { identity, manifest } = structuredClone(pristine);
    change(identity, manifest);
    manifest.identity = identity;
    manifest.reservationSha256 = sha256(canonical(identity));
    f.writePrepared(identity, manifest);
    const bytes = snapshot(f);
    await assert.rejects(verify(f), `Self-consistent tampering escaped source verification: ${change}`);
    assert.deepEqual(snapshot(f), bytes);
  }
  f.writePrepared(pristine.identity, pristine.manifest);
  assert.equal((await verify(f)).manifest.version, "0.2.6", "Negative fixtures did not damage the original source");
});

test("deleting an introduced release policy cannot publish a manufactured schema-1 fallback", async (t) => {
  const f = await fixture(t);
  const prior = f.context.sourceRevision;
  rmSync(join(f.root, "release-policy.json"));
  const deleted = f.commit("delete release policy");
  f.bindSource(deleted, prior, 7, null);
  f.prepare();
  assert.throws(() =>
    verifyReleaseSource(f.root, f.context, {
      admission: f.admission,
      expectedAdmissionSha256: f.admission.sha256,
    }),
  );
  await assert.rejects(verify(f));
});

test("GATE admission and independent original-attempt evidence remain mandatory on both manifest schemas", async (t) => {
  for (const line of [null, "0.2"]) {
    const f = await fixture(t, { line });
    const bundle = await verify(f, { ...f.context, attempt: 2 });
    assert.equal(bundle.manifest.schemaVersion, line ? 2 : 1);
    assert.equal(bundle.origin.attempt, 1, "Publisher retry must retain the original producing attempt");
    assert.deepEqual(bundle.acceptanceAdmission, f.admission);
    await assert.rejects(verifyReleaseBundle(f.root, f.directory, f.context));
    await assert.rejects(verify(f, f.context, "0".repeat(64)));
    for (const update of [
      { sourceRevision: "f".repeat(40) },
      { baseRevision: f.genesis.suiteCommit },
      { runId: 42002 },
      { workflowRevision: f.genesis.suiteCommit },
      { repository: "other/private-mp3" },
    ])
      await assert.rejects(verify(f, { ...f.context, ...update }));
    const report = structuredClone(f.report);
    delete report.acceptanceAdmission;
    f.writePrepared(f.prepared.identity, f.prepared.manifest, report);
    await assert.rejects(verify(f));
    report.acceptanceAdmission = structuredClone(f.admission);
    report.acceptanceAdmission.record.context.attempt = 2;
    report.acceptanceAdmission = seal(report.acceptanceAdmission.record);
    f.writePrepared(f.prepared.identity, f.prepared.manifest, report);
    await assert.rejects(verify(f), "A report cannot substitute a digest for the product's original output");
    f.writePrepared(f.prepared.identity, f.prepared.manifest);
    const api = fakeApi(bundle);
    api.state.jobs.find(({ name }) => name === "validate-product").run_attempt = 2;
    await assert.rejects(publishRelease(bundle, api, f.generated), /attempt/);
    assert.equal(api.state.mutations.length, 0);
    const missingPreflight = fakeApi(bundle);
    missingPreflight.state.jobs.find(({ name }) => name === "validate-foundation").steps = [];
    await assert.rejects(publishRelease(bundle, missingPreflight, f.generated), /preflight/);
    assert.equal(missingPreflight.state.mutations.length, 0);
  }
});

test("schema-2 complete publication retains ten assets and original bytes on a later publisher retry", async (t) => {
  const f = await fixture(t);
  const original = snapshot(f);
  const bundle = await verify(f);
  const api = fakeApi(bundle);
  const first = await publishRelease(bundle, api, f.generated);
  assert.equal(first.tag, "v0.2.6");
  assert.equal(first.version, "0.2.6");
  assert.equal(api.state.latest, "true");
  assert.equal(api.state.assets.length, 10);
  assert.equal(api.state.mutations.at(-1).method, "PATCH");
  const assets = structuredClone(api.state.assets);
  const json = readFileSync(join(f.generated, "publication.json"));
  const notes = readFileSync(join(f.generated, "publication-notes.md"));
  const mutationCount = api.state.mutations.length;
  const retryBundle = await verify(f, { ...f.context, attempt: 2 });
  const retry = await publishRelease(retryBundle, api, f.generated);
  assert.equal(retry.reused, true);
  assert.equal(retry.releaseId, first.releaseId);
  assert.equal(api.state.mutations.length, mutationCount);
  assert.deepEqual(api.state.assets, assets);
  assert.deepEqual(readFileSync(join(f.generated, "publication.json")), json);
  assert.deepEqual(readFileSync(join(f.generated, "publication-notes.md")), notes);
  assert.deepEqual(snapshot(f), original);
  assert(api.state.requests.some(({ path }) => path === "/actions/runs/42001/attempts/1/jobs"));
  assert(!api.state.requests.some(({ path }) => path.includes("/attempts/2")));
});

test("schema-2 partial publication uploads only missing original assets and refuses conflict overwrite", async (t) => {
  const f = await fixture(t);
  const bundle = await verify(f);
  const api = fakeApi(bundle);
  api.state.failAsset = "frontend.docker.tar";
  await assert.rejects(publishRelease(bundle, api, f.generated), /Synthetic upload failure/);
  assert.equal(api.state.releases[0].draft, true);
  const originalAssets = structuredClone(api.state.assets);
  const beforeRetry = api.state.mutations.length;
  api.state.failAsset = null;
  await publishRelease(bundle, api, f.generated);
  for (const original of originalAssets) {
    assert.deepEqual(
      api.state.assets.find(({ name }) => name === original.name),
      original,
    );
    assert(!api.state.mutations.slice(beforeRetry).some(({ route }) => route.endsWith(`?name=${original.name}`)));
  }
  assert.equal(api.state.assets.length, 10);
  const conflict = fakeApi(bundle);
  conflict.state.failAsset = "frontend.docker.tar";
  await assert.rejects(publishRelease(bundle, conflict, f.generated));
  conflict.state.assets[0].digest = `sha256:${"0".repeat(64)}`;
  conflict.state.failAsset = null;
  const count = conflict.state.mutations.length;
  await assert.rejects(publishRelease(bundle, conflict, f.generated), /digest/);
  assert.equal(conflict.state.mutations.length, count);
  assert.equal(conflict.state.releases[0].draft, true);
});

test("delayed old-line and changed-during-upload releases publish without displacing newer latest", async (t) => {
  for (const scenario of ["delayed-line", "new-stable", "malformed-stable", "main-moved"]) {
    const f = await fixture(t, { line: scenario === "delayed-line" ? "0.1" : "0.2" });
    const bundle = await verify(f);
    const api = fakeApi(bundle);
    if (scenario === "delayed-line")
      api.state.releases.push({
        id: 99,
        tag_name: "v0.2.6",
        draft: false,
        prerelease: false,
      });
    api.state.afterUpload = (name) => {
      if (name !== "frontend.docker.tar") return;
      if (scenario === "new-stable" || scenario === "malformed-stable")
        api.state.releases.push({
          id: 99,
          tag_name: scenario === "new-stable" ? "v0.10.7" : "unexpected-release",
          draft: false,
          prerelease: false,
        });
      if (scenario === "main-moved") {
        api.state.branch.commit.sha = "e".repeat(40);
        api.state.comparison.status = "ahead";
      }
    };
    await publishRelease(bundle, api, f.generated);
    assert.equal(api.state.latest, "false", scenario);
    assert.equal(api.state.releases[0].draft, false);
  }
});

test("actual bundle CLI selects the allocation directory instead of recomputing a legacy 0.1 version", async (t) => {
  const f = await fixture(t, { consumer: true });
  const expectedPrepared = join(f.root, ".artifacts/expected-prepared");
  mkdirSync(expectedPrepared);
  for (const name of assetNames.filter((name) => !["ci-origin.json", "e2e-result.json"].includes(name))) {
    writeFileSync(join(expectedPrepared, name), readFileSync(join(f.directory, name)));
  }
  writeJson(join(f.root, ".artifacts/e2e-result.json"), f.report);
  const output = join(f.root, ".artifacts/github-output");
  const env = {
    PATH: process.env.PATH,
    CI: "true",
    GITHUB_ACTIONS: "true",
    GITHUB_EVENT_NAME: "push",
    GITHUB_REF: "refs/heads/main",
    GITHUB_SERVER_URL: "https://github.com",
    GITHUB_API_URL: "https://api.github.com",
    GITHUB_REPOSITORY: repository,
    GITHUB_SHA: f.context.sourceRevision,
    CI_BASE_REF: f.context.baseRevision,
    GITHUB_WORKFLOW_SHA: f.context.sourceRevision,
    GITHUB_WORKFLOW_REF: `${repository}/.github/workflows/ci.yml@refs/heads/main`,
    GITHUB_RUN_ID: "42001",
    GITHUB_RUN_ATTEMPT: "1",
    GATE_ADMISSION_SHA256: f.admission.sha256,
    GITHUB_OUTPUT: output,
  };
  const child = spawnSync(process.execPath, ["scripts/publish-release-bundle.mjs"], {
    cwd: f.root,
    env,
    encoding: "utf8",
    timeout: 15000,
  });
  assert.equal(child.status, 0, `${child.stdout}\n${child.stderr}`);
  assert.equal(
    readFileSync(output, "utf8"),
    [
      "ready=true",
      "version=0.2.6",
      "directory=.artifacts/releases/0.2.6",
      `artifact-name=release-${f.context.sourceRevision}-42001-1`,
      "",
    ].join("\n"),
  );
  assert.equal(readFileSync(join(f.root, ".artifacts/preparation-called"), "utf8"), "exact fixture archives only\n");
  const bundle = await verifyReleaseBundle(f.root, ".artifacts/releases/0.2.6", f.context, {
    expectedAdmissionSha256: f.admission.sha256,
  });
  assert.equal(bundle.manifest.version, "0.2.6");
  assert.equal(bundle.origin.attempt, 1);
});
