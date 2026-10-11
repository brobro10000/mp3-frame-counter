/**
 * Independent expectations for fixed, owner-supervised same-source v1.0.0 finalization through the existing publisher.
 * Run `node --test scripts/publish-release-finalization.test.mjs` with the pinned Node runtime. Synthetic files and an
 * injected in-memory GitHub API model an already verified bundle, actual owner identity and separately authenticated
 * approval/provider evidence. Fixtures are not real acceptance, approval or deployment evidence. No Git, network,
 * credentials, application, cloud or deployment commands run. Temporary files are removed after each test.
 * Missing API is explicit availability red before any refusal assertion; every refusal has a valid counterpart.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import * as publisher from "./publish-release.mjs";
import { publicationChecks, publicationMaterial } from "./publish-release-evidence.mjs";
import { validateAcceptanceProfiles } from "./acceptance-profiles.mjs";
import { validateHostedAcceptance } from "./hosted-evidence.mjs";
import {
  configurationFingerprint,
  createManifest,
  preparationIdentity,
  releaseNotes,
  sourceConfigurationPaths,
} from "./release-manifest.mjs";

const clone = (value) => structuredClone(value);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const repo = "example/synthetic-private-mp3";
const source = "a".repeat(40);
const suiteCommit = "b".repeat(40);
const suiteTree = "c".repeat(40);
const manifestHash = "d".repeat(64);
const registryDigests = { api: `sha256:${"4".repeat(64)}`, frontend: `sha256:${"5".repeat(64)}` };
const ownerId = 42002;
const names = [
  "SHA256SUMS",
  "api.docker.tar",
  "ci-origin.json",
  "e2e-result.json",
  "frontend.docker.tar",
  "manifest.json",
  "publication-notes.md",
  "publication.json",
  "release-notes.md",
  "reservation.json",
];

function subject() {
  assert.equal(typeof publisher.finalizeV1Release, "function", "Missing finalizeV1Release; availability red only");
  return publisher.finalizeV1Release;
}

/** Literal synthetic obligations have the current unequal profile sizes; no finalizer output constructs an oracle. */
function declarations() {
  const inventories = Object.fromEntries(
    [
      ["local", 72],
      ["stage", 22],
      ["production", 3],
    ].map(([profile, count]) => [
      profile,
      {
        contractRevision: "hosted-v1",
        cases: Array.from({ length: count }, (_, index) => ({
          file: `${profile}/synthetic.spec.ts`,
          title: `Synthetic ${profile} obligation ${index + 1}`,
        })),
      },
    ]),
  );
  return {
    metadata: {
      schemaVersion: 1,
      contractRevision: "hosted-v1",
      profiles: Object.fromEntries(
        Object.entries(inventories).map(([profile, inventory]) => [
          profile,
          inventory.cases.map((entry) => ({
            case: clone(entry),
            requirements: [profile === "production" ? "APP-V1-015" : "APP-V1-014"],
          })),
        ]),
      ),
    },
    inventories,
    selectedContractRevision: "hosted-v1",
    predecessorLocalInventory: { contractRevision: "docs-v1", cases: clone(inventories.local.cases) },
  };
}

/** Existing public helpers calibrate fixture grammar only; the new publisher does not create its own expectations. */
function projection() {
  const declarationInput = declarations();
  return {
    required: clone(validateAcceptanceProfiles(declarationInput)),
    declarationInput,
    profilesSha256: hash(json(declarationInput.metadata)),
    inventorySha256: {
      stage: hash(json(declarationInput.inventories.stage)),
      production: hash(json(declarationInput.inventories.production)),
    },
  };
}

function hosted(profile, bundle, declarationProjection, publicationSha256) {
  const expected = {
    profile,
    sourceRevision: source,
    suite: {
      commit: suiteCommit,
      tree: suiteTree,
      fixtureManifestSha256: manifestHash,
      profilesSha256: declarationProjection.profilesSha256,
      inventorySha256: declarationProjection.inventorySha256[profile],
    },
    release: { reservationSha256: bundle.manifest.reservationSha256, publicationSha256 },
    images: Object.fromEntries(
      ["api", "frontend"].map((role) => [
        role,
        {
          localImageId: bundle.manifest.artifacts[role].localImageId,
          archiveSha256: bundle.manifest.artifacts[role].archiveSha256,
          registryDigest: registryDigests[role],
        },
      ]),
    ),
    configurationSha256: (profile === "stage" ? "6" : "7").repeat(64),
    target: {
      origin: `https://${profile}.invalid`,
      resourceId: `synthetic:${profile}/service`,
      revisionId: `${profile}-revision-1`,
    },
    run:
      profile === "stage"
        ? { id: "stage-run:7001", attempt: 2, workflowRevision: source }
        : { id: "owner-operation:synthetic-v1", attempt: 1, workflowRevision: source },
    declarationInput: clone(declarationProjection.declarationInput),
  };
  const launchId = (profile === "stage" ? "8" : "9").repeat(64);
  const inventory = clone(expected.declarationInput.inventories[profile].cases);
  const tests = inventory.map((entry) => ({
    ...entry,
    status: "passed",
    expectedStatus: "passed",
    retry: 0,
    retries: 0,
  }));
  const suiteResult = {
    schemaVersion: 1,
    kind: "hosted-suite-result",
    profile,
    launchId,
    sourceRevision: source,
    suite: clone(expected.suite),
    inventory,
    tests,
    status: "passed",
    cleanup: "passed",
  };
  const observe = (observedAt) => ({
    environment: profile,
    ...expected.target,
    observedAt,
    configurationSha256: expected.configurationSha256,
    registryDigests: clone(registryDigests),
  });
  const observations = {
    before: observe(profile === "stage" ? "2026-10-11T01:00:00.000Z" : "2026-10-11T03:00:00.000Z"),
    after: observe(profile === "stage" ? "2026-10-11T01:01:00.000Z" : "2026-10-11T03:01:00.000Z"),
  };
  return {
    record: {
      schemaVersion: 1,
      kind: "hosted-acceptance",
      profile,
      status: "passed",
      sourceRevision: source,
      contractRevision: "hosted-v1",
      suite: clone(expected.suite),
      release: clone(expected.release),
      images: clone(expected.images),
      configurationSha256: expected.configurationSha256,
      run: clone(expected.run),
      target: clone(observations),
      inventory: clone(inventory),
      tests: clone(tests),
      cleanup: "passed",
    },
    suiteResult,
    expected,
    launchId,
    wrapperOutcome: "completed",
    observations,
    parentCleanup: "passed",
  };
}

function fixture(t) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "v1-finalization-test-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const generated = join(root, "generated");
  mkdirSync(generated, { mode: 0o700 });
  const origin = {
    schemaVersion: 1,
    repository: repo,
    sourceRevision: source,
    baseRevision: "e".repeat(40),
    runId: 7001,
    attempt: 1,
    workflow: ".github/workflows/ci.yml",
    workflowRevision: source,
  };
  const report = {
    schemaVersion: 1,
    status: "passed",
    cleanup: "passed",
    targetKind: "local",
    sourceDirty: false,
    trackedDiffSha256: hash(""),
    sourceRevision: source,
    suiteCommit,
    suiteTree,
    manifestSha256: manifestHash,
    contractRevision: "hosted-v1",
    baselinePublication: "protected-main",
    configurationSha256: "1".repeat(64),
    project: "mp3-e2e-synthetic-finalization",
    acceptance: { status: "passed", planned: 72, passed: 72, failed: 0, skipped: 0 },
    images: { api: `sha256:${"2".repeat(64)}`, frontend: `sha256:${"3".repeat(64)}` },
  };
  const allocation = {
    sourceRevision: source,
    version: "0.3.41",
    ordinal: 41,
    policy: { schemaVersion: 1, strategy: "global-first-parent-ordinal", line: "0.3", sha256: "f".repeat(64) },
  };
  const identity = preparationIdentity(
    report,
    allocation,
    configurationFingerprint(
      Object.fromEntries(
        sourceConfigurationPaths.map((path) => [path, Buffer.from(`Synthetic configuration ${path}\n`)]),
      ),
    ),
  );
  const archiveBytes = {
    api: Buffer.from("Synthetic API Docker archive\n"),
    frontend: Buffer.from("Synthetic frontend Docker archive\n"),
  };
  const archives = Object.fromEntries(
    Object.entries(archiveBytes).map(([role, bytes]) => [role, { sha256: hash(bytes), bytes: bytes.length }]),
  );
  const manifest = createManifest(identity, source, archives);
  const contents = {
    "api.docker.tar": archiveBytes.api,
    "frontend.docker.tar": archiveBytes.frontend,
    "manifest.json": json(manifest),
    "reservation.json": json(identity),
    "ci-origin.json": json(origin),
    "e2e-result.json": json(report),
    "release-notes.md": releaseNotes(manifest),
    SHA256SUMS: ["api", "frontend"].map((role) => `${archives[role].sha256}  ${role}.docker.tar\n`).join(""),
  };
  const assets = Object.entries(contents)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, bytes]) => {
      const path = join(root, name);
      writeFileSync(path, bytes, { mode: 0o600 });
      return { name, path, bytes: Buffer.byteLength(bytes), sha256: hash(bytes) };
    });
  const bundle = { manifest, origin, assets };
  const material = publicationMaterial(bundle);
  contents["publication.json"] = material.json;
  contents["publication-notes.md"] = material.notes;
  const declarationProjection = projection();
  return {
    root,
    generated,
    bundle,
    contents,
    material,
    projection: declarationProjection,
    stage: hosted("stage", bundle, declarationProjection, hash(material.json)),
    production: hosted("production", bundle, declarationProjection, hash(material.json)),
  };
}

function evidence(f) {
  const recovery = {
    kind: "first-deployment-withdrawal",
    demonstratedAt: "2026-10-11T01:30:00.000Z",
    resourceId: f.stage.expected.target.resourceId,
    revisionId: f.stage.expected.target.revisionId,
    configurationSha256: f.stage.expected.configurationSha256,
    registryDigests: clone(registryDigests),
    evidenceSha256: "a1".repeat(32),
  };
  return {
    projection: clone(f.projection),
    stage: clone(f.stage),
    production: clone(f.production),
    approval: {
      reference: "human-event:synthetic-only",
      sha256: "b1".repeat(32),
      occurredAt: "2026-10-11T02:00:00.000Z",
      candidate: {
        sourceRevision: source,
        registryDigests: clone(registryDigests),
        stageConfigurationSha256: f.stage.expected.configurationSha256,
        productionConfigurationSha256: f.production.expected.configurationSha256,
        productionResourceId: f.production.expected.target.resourceId,
        exposureSha256: "c1".repeat(32),
        recoverySha256: recovery.evidenceSha256,
      },
    },
    recovery,
    operation: {
      id: "owner-operation:synthetic-v1",
      attempt: 1,
      sourceRevision: source,
      finalizedAt: "2026-10-11T04:00:00.000Z",
    },
    productionStartedAt: "2026-10-11T02:30:00.000Z",
  };
}

/** Separate old/new releases and raw uploaded bytes expose accidental mutation, false retry success and wrong IDs. */
function fakeApi(f) {
  const prefix = `/repos/${repo}`;
  const original = {
    id: 51001,
    tag_name: `v${f.bundle.manifest.version}`,
    name: f.bundle.manifest.version,
    target_commitish: source,
    body: f.material.notes,
    draft: false,
    prerelease: false,
  };
  const assets = names.map((name, index) => ({
    id: 61001 + index,
    name,
    state: "uploaded",
    size: Buffer.byteLength(f.contents[name]),
    digest: `sha256:${hash(f.contents[name])}`,
  }));
  const state = {
    actor: { id: ownerId, login: "synthetic-owner" },
    repository: { id: 31001, owner: { id: ownerId }, full_name: repo, private: true, default_branch: "main" },
    branch: { name: "main", protected: true, commit: { sha: source } },
    comparison: { status: "identical" },
    run: {
      id: f.bundle.origin.runId,
      run_attempt: 1,
      head_sha: source,
      head_branch: "main",
      event: "push",
      path: ".github/workflows/ci.yml",
      repository: { full_name: repo },
    },
    jobs: publicationChecks.map((name) => ({
      name,
      head_sha: source,
      run_attempt: 1,
      status: "completed",
      conclusion: "success",
      steps: [{ name: "Validate acceptance admission", status: "completed", conclusion: "success" }],
    })),
    releases: [original],
    tags: { [original.tag_name]: source },
    assets: { [original.id]: assets },
    bytes: Object.fromEntries(assets.map((asset) => [asset.id, Buffer.from(f.contents[asset.name])])),
    calls: [],
    mutations: [],
    failAsset: null,
    corruptUpload: null,
  };
  const originalSnapshot = () => ({
    release: clone(state.releases.find((item) => item.id === original.id)),
    tag: state.tags[original.tag_name],
    assets: clone(state.assets[original.id]),
    bytes: state.assets[original.id].map((asset) => hash(state.bytes[asset.id])),
  });
  const api = {
    async list(path, field) {
      state.calls.push(["LIST", path]);
      if (path === "/releases") return clone(state.releases);
      if (path === `/actions/runs/${f.bundle.origin.runId}/attempts/1/jobs` && field === "jobs")
        return clone(state.jobs);
      const match = /^\/releases\/(\d+)\/assets$/.exec(path);
      if (match) return clone(state.assets[match[1]] ?? []);
      throw new Error(`Unexpected synthetic API list: ${path}`);
    },
    async request(method, path, value, upload = false) {
      state.calls.push([method, path]);
      if (method === "GET") {
        if (path === "/user") return clone(state.actor);
        if (path === prefix) return clone(state.repository);
        if (path === `${prefix}/branches/main`) return clone(state.branch);
        if (path.startsWith(`${prefix}/compare/`)) return clone(state.comparison);
        if (path === `${prefix}/actions/runs/${f.bundle.origin.runId}/attempts/1`) return clone(state.run);
        if (path.startsWith(`${prefix}/git/ref/tags/`)) {
          const tag = path.slice(`${prefix}/git/ref/tags/`.length);
          return state.tags[tag] ? { object: { type: "commit", sha: state.tags[tag] } } : null;
        }
      }
      state.mutations.push([method, path, clone(value), upload]);
      if (method === "POST" && path === `${prefix}/git/refs`) {
        assert(!state.tags[value.ref.slice(10)], "Ref overwrite attempted");
        state.tags[value.ref.slice(10)] = value.sha;
        return { object: { type: "commit", sha: value.sha } };
      }
      if (method === "POST" && path === `${prefix}/releases`) {
        assert.equal(value.draft, true, "Must create a draft");
        assert.equal(value.make_latest, "false", "Must not publish early");
        const release = { id: 52001, ...value };
        state.releases.push(release);
        state.assets[release.id] = [];
        return clone(release);
      }
      const asset = new RegExp(`^${prefix}/releases/(\\d+)/assets\\?name=(.+)$`).exec(path);
      if (method === "POST" && upload && asset) {
        const id = Number(asset[1]),
          name = decodeURIComponent(asset[2]);
        assert.equal(state.releases.find((item) => item.id === id)?.draft, true, "Upload to published release");
        if (name === state.failAsset) throw new Error("Synthetic upload failure");
        const bytes = readFileSync(value.path);
        assert.equal(hash(bytes), value.sha256, "Upload descriptor must identify actual supplied bytes");
        assert.equal(bytes.length, value.bytes);
        const observed = {
          id: 62001 + state.assets[id].length,
          name,
          state: "uploaded",
          size: bytes.length,
          digest: `sha256:${hash(bytes)}`,
        };
        if (state.corruptUpload) state.corruptUpload(observed);
        state.assets[id].push(observed);
        state.bytes[observed.id] = bytes;
        return clone(observed);
      }
      const release = new RegExp(`^${prefix}/releases/(\\d+)$`).exec(path);
      if (method === "PATCH" && release) {
        const found = state.releases.find((item) => item.id === Number(release[1]));
        Object.assign(found, value);
        return clone(found);
      }
      throw new Error(`Unexpected synthetic API request: ${method} ${path}`);
    },
  };
  return { api, state, originalSnapshot };
}

function expectedRecord(f, input, state) {
  return {
    schemaVersion: 1,
    kind: "v1-finalization",
    version: "1.0.0",
    sourceRevision: source,
    original: {
      version: f.bundle.manifest.version,
      tag: `v${f.bundle.manifest.version}`,
      releaseId: 51001,
      repository: { id: 31001, ownerId },
      ci: clone(f.bundle.origin),
      reservationSha256: f.bundle.manifest.reservationSha256,
      publicationSha256: hash(f.material.json),
      assets: state.assets[51001].map(({ id, name, size, digest }) => ({
        id,
        name,
        bytes: size,
        sha256: digest.slice(7),
      })),
    },
    owner: { id: ownerId },
    operation: clone(input.operation),
    approval: clone(input.approval),
    recovery: clone(input.recovery),
    productionStartedAt: input.productionStartedAt,
    stage: clone(input.stage.record),
    production: clone(input.production.record),
  };
}

async function pass(t, tweak = () => {}) {
  const finalize = subject();
  const f = fixture(t),
    input = evidence(f),
    remote = fakeApi(f);
  tweak(f, input, remote.state);
  const before = clone({ bundle: f.bundle, input }),
    original = remote.originalSnapshot();
  const result = await finalize(f.bundle, input, remote.api, f.generated);
  assert.deepEqual({ bundle: f.bundle, input }, before, "Caller evidence changed");
  assert.deepEqual(remote.originalSnapshot(), original, "Original release changed");
  return { f, input, ...remote, result };
}

/** Run a complete valid counterpart first; an unrelated fixture failure must never masquerade as a refusal. */
async function refusals(t, cases) {
  const finalize = subject();
  await pass(t);
  for (const [label, mutate] of cases) {
    const f = fixture(t),
      input = evidence(f),
      remote = fakeApi(f);
    mutate(f, input, remote.state);
    const original = remote.originalSnapshot();
    await assert.rejects(() => finalize(f.bundle, input, remote.api, f.generated), undefined, label);
    assert.deepEqual(remote.state.mutations, [], `${label}: refusal must precede GitHub writes`);
    assert.deepEqual(remote.originalSnapshot(), original, `${label}: original release changed`);
  }
}

test("synthetic 72/22/3 fixtures independently satisfy existing declaration and hosted schemas", (t) => {
  const f = fixture(t),
    input = evidence(f);
  assert.equal(validateAcceptanceProfiles(input.projection.declarationInput).profiles.local.inventory.cases.length, 72);
  assert.equal(validateHostedAcceptance(input.stage).tests.length, 22);
  assert.equal(validateHostedAcceptance(input.production).tests.length, 3);
  assert.equal(f.bundle.manifest.schemaVersion, 2);
  assert.equal(f.bundle.manifest.version, "0.3.41");
  assert.equal(JSON.parse(f.contents["publication.json"]).deployed, false);
  assert.equal(input.production.expected.run.id.startsWith("owner-operation:"), true);
  assert.notEqual(input.production.expected.run.id, String(f.bundle.origin.runId));
});

test("fixed v1.0.0 copies all ten original bytes and adds exact distinct owner finalization provenance", async (t) => {
  const { f, input, state, result } = await pass(t);
  assert.deepEqual(Object.keys(result).sort(), [
    "assets",
    "finalizationSha256",
    "releaseId",
    "reused",
    "sourceRevision",
    "status",
    "tag",
    "version",
  ]);
  assert.equal(result.status, "finalized");
  assert.equal(result.version, "1.0.0");
  assert.equal(result.tag, "v1.0.0");
  assert.equal(result.sourceRevision, source);
  assert.equal(result.releaseId, 52001);
  assert.equal(result.reused, false);
  const observed = state.assets[52001];
  assert.deepEqual(observed.map((asset) => asset.name).sort(), [...names, "finalization.json"].sort());
  for (const name of names) {
    const old = state.assets[51001].find((asset) => asset.name === name),
      fresh = observed.find((asset) => asset.name === name);
    assert.notEqual(fresh.id, old.id);
    assert.deepEqual(state.bytes[fresh.id], state.bytes[old.id]);
  }
  const final = observed.find((asset) => asset.name === "finalization.json");
  assert.deepEqual(JSON.parse(state.bytes[final.id]), expectedRecord(f, input, state));
  assert.equal(result.finalizationSha256, hash(state.bytes[final.id]));
  assert.deepEqual(
    result.assets,
    [...observed]
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
      .map(({ id, name, size, digest }) => ({ id, name, bytes: size, sha256: digest.slice(7) })),
  );
  const release = state.releases.find((item) => item.id === 52001);
  assert.equal(release.draft, false);
  assert.equal(release.target_commitish, source);
  assert.equal(release.prerelease, false);
  assert.match(release.body, /0\.3\.41/);
  assert.match(release.body, /finalization\.json/);
  assert.match(release.body, /unchanged|historical/i);
  assert(state.calls.some(([method, path]) => method === "GET" && path === "/user"));
  assert.equal(state.mutations.at(-1)[0], "PATCH", "Publication must be the last mutation");
  assert.equal(state.mutations.at(-1)[1], `/repos/${repo}/releases/52001`);
});

test("successful immutable retry is read-only and keeps the original owner operation time and bytes", async (t) => {
  const { f, input, api, state, result } = await pass(t);
  const bytes = state.bytes[state.assets[52001].find((asset) => asset.name === "finalization.json").id];
  state.mutations.length = 0;
  const again = await subject()(f.bundle, input, api, f.generated);
  assert.deepEqual(again, { ...result, reused: true });
  assert.deepEqual(state.mutations, []);
  assert.deepEqual(state.bytes[state.assets[52001].find((asset) => asset.name === "finalization.json").id], bytes);
});

test("both bounded recovery kinds accept evidence bound to stage or production, never an arbitrary resource", async (t) => {
  await pass(t, (_f, input) => {
    input.recovery.kind = "prior-revision";
    input.recovery.revisionId = "stage-prior-good";
  });
  await pass(t, (_f, input) => {
    input.recovery.resourceId = input.production.expected.target.resourceId;
    input.recovery.revisionId = input.production.expected.target.revisionId;
    input.recovery.configurationSha256 = input.production.expected.configurationSha256;
    input.recovery.demonstratedAt = "2026-10-11T03:30:00.000Z";
  });
});

test("owner identity, private repository, protected ancestry and original producing checks precede writes", async (t) => {
  await refusals(t, [
    [
      "another actor",
      (_f, _e, s) => {
        s.actor.id++;
      },
    ],
    [
      "string actor identity",
      (_f, _e, s) => {
        s.actor.id = String(ownerId);
      },
    ],
    [
      "missing owner",
      (_f, _e, s) => {
        delete s.repository.owner.id;
      },
    ],
    [
      "wrong repository",
      (_f, _e, s) => {
        s.repository.full_name = "other/repository";
      },
    ],
    [
      "public repository",
      (_f, _e, s) => {
        s.repository.private = false;
      },
    ],
    [
      "unprotected main",
      (_f, _e, s) => {
        s.branch.protected = false;
      },
    ],
    [
      "divergent source",
      (_f, _e, s) => {
        s.comparison.status = "diverged";
      },
    ],
    [
      "different producing source",
      (_f, _e, s) => {
        s.run.head_sha = "0".repeat(40);
      },
    ],
    [
      "different producing attempt",
      (_f, _e, s) => {
        s.run.run_attempt = 2;
      },
    ],
    [
      "failed mandatory check",
      (_f, _e, s) => {
        s.jobs[0].conclusion = "failure";
      },
    ],
    [
      "missing mandatory check",
      (_f, _e, s) => {
        s.jobs.pop();
      },
    ],
  ]);
});

test("closed fixed operation and evidence fields cannot select another version or impersonate original CI", async (t) => {
  await refusals(t, [
    ...["projection", "stage", "production", "approval", "recovery", "operation", "productionStartedAt"].map((key) => [
      `missing ${key}`,
      (_f, e) => {
        delete e[key];
      },
    ]),
    [
      "arbitrary version",
      (_f, e) => {
        e.version = "2.0.0";
      },
    ],
    [
      "CI impersonation",
      (_f, e) => {
        e.operation.id = "7001";
        e.production.expected.run.id = "7001";
        e.production.record.run.id = "7001";
      },
    ],
    [
      "operation source",
      (_f, e) => {
        e.operation.sourceRevision = "0".repeat(40);
      },
    ],
    [
      "unsafe operation attempt",
      (_f, e) => {
        e.operation.attempt = 0;
      },
    ],
    [
      "different production run",
      (_f, e) => {
        e.production.expected.run.attempt++;
        e.production.record.run.attempt++;
      },
    ],
    [
      "unknown operation field",
      (_f, e) => {
        e.operation.authorized = true;
      },
    ],
    [
      "missing finalization instant",
      (_f, e) => {
        delete e.operation.finalizedAt;
      },
    ],
  ]);
});

test("approval binds the exact pair, source, configurations, production resource, exposure and recovery", async (t) => {
  await refusals(t, [
    [
      "Boolean approval",
      (_f, e) => {
        e.approval = { approved: true };
      },
    ],
    [
      "missing human reference",
      (_f, e) => {
        e.approval.reference = "";
      },
    ],
    [
      "invalid human event hash",
      (_f, e) => {
        e.approval.sha256 = "not-a-hash";
      },
    ],
    [
      "extra approval field",
      (_f, e) => {
        e.approval.override = true;
      },
    ],
    [
      "different approved source",
      (_f, e) => {
        e.approval.candidate.sourceRevision = "0".repeat(40);
      },
    ],
    [
      "different approved pair",
      (_f, e) => {
        e.approval.candidate.registryDigests.api = `sha256:${"0".repeat(64)}`;
      },
    ],
    [
      "different stage configuration",
      (_f, e) => {
        e.approval.candidate.stageConfigurationSha256 = "0".repeat(64);
      },
    ],
    [
      "different production configuration",
      (_f, e) => {
        e.approval.candidate.productionConfigurationSha256 = "0".repeat(64);
      },
    ],
    [
      "different destination",
      (_f, e) => {
        e.approval.candidate.productionResourceId = "synthetic:other/service";
      },
    ],
    [
      "missing exposure binding",
      (_f, e) => {
        delete e.approval.candidate.exposureSha256;
      },
    ],
    [
      "different recovery evidence",
      (_f, e) => {
        e.approval.candidate.recoverySha256 = "0".repeat(64);
      },
    ],
  ]);
});

test("real UTC ordering places stage before approval, approval before deployment, and observations before finalization", async (t) => {
  await refusals(t, [
    [
      "approval precedes stage",
      (_f, e) => {
        e.approval.occurredAt = "2026-10-11T00:00:00.000Z";
      },
    ],
    [
      "approval after deployment",
      (_f, e) => {
        e.approval.occurredAt = "2026-10-11T02:31:00.000Z";
      },
    ],
    [
      "approval equal deployment",
      (_f, e) => {
        e.approval.occurredAt = e.productionStartedAt;
      },
    ],
    [
      "smoke before deployment",
      (_f, e) => {
        e.productionStartedAt = "2026-10-11T03:00:01.000Z";
      },
    ],
    [
      "finalization before smoke",
      (_f, e) => {
        e.operation.finalizedAt = "2026-10-11T03:00:30.000Z";
      },
    ],
    [
      "future recovery",
      (_f, e) => {
        e.recovery.demonstratedAt = "2026-10-11T04:00:01.000Z";
      },
    ],
    [
      "impossible date",
      (_f, e) => {
        e.approval.occurredAt = "2026-02-30T02:00:00.000Z";
      },
    ],
    [
      "noncanonical offset",
      (_f, e) => {
        e.operation.finalizedAt = "2026-10-11T04:00:00+00:00";
      },
    ],
  ]);
});

test("recovery is demonstrated with a supported kind, corresponding configuration/pair and retained identity", async (t) => {
  await refusals(t, [
    [
      "unsupported recovery",
      (_f, e) => {
        e.recovery.kind = "planned-only";
      },
    ],
    [
      "unrelated resource",
      (_f, e) => {
        e.recovery.resourceId = "synthetic:other/service";
      },
    ],
    [
      "unrelated configuration",
      (_f, e) => {
        e.recovery.configurationSha256 = "0".repeat(64);
      },
    ],
    [
      "unrelated digest",
      (_f, e) => {
        e.recovery.registryDigests.frontend = `sha256:${"0".repeat(64)}`;
      },
    ],
    [
      "missing revision",
      (_f, e) => {
        delete e.recovery.revisionId;
      },
    ],
    [
      "missing evidence hash",
      (_f, e) => {
        delete e.recovery.evidenceSha256;
      },
    ],
    [
      "extra recovery field",
      (_f, e) => {
        e.recovery.passed = true;
      },
    ],
  ]);
});

test("both actual hosted profiles require complete zero-retry passing rows and cleanup; no synthetic count substitution", async (t) => {
  const cases = [];
  for (const profile of ["stage", "production"]) {
    const row = (change) => (_f, e) => {
      change(e[profile].suiteResult.tests[0]);
      e[profile].record.tests = clone(e[profile].suiteResult.tests);
    };
    cases.push(
      [
        `${profile} skipped`,
        row((value) => {
          value.status = "skipped";
        }),
      ],
      [
        `${profile} expected failure`,
        row((value) => {
          value.expectedStatus = "failed";
        }),
      ],
      [
        `${profile} retried`,
        row((value) => {
          value.retry = value.retries = 1;
        }),
      ],
      [
        `${profile} missing row`,
        (_f, e) => {
          e[profile].suiteResult.tests.pop();
          e[profile].record.tests.pop();
        },
      ],
      [
        `${profile} duplicate row`,
        (_f, e) => {
          e[profile].suiteResult.tests[1] = clone(e[profile].suiteResult.tests[0]);
          e[profile].record.tests = clone(e[profile].suiteResult.tests);
        },
      ],
      [
        `${profile} missing result`,
        (_f, e) => {
          e[profile].suiteResult = null;
        },
      ],
      [
        `${profile} wrapper failure`,
        (_f, e) => {
          e[profile].wrapperOutcome = "failed";
          e[profile].record.status = "failed";
        },
      ],
      [
        `${profile} parent cleanup`,
        (_f, e) => {
          e[profile].parentCleanup = "failed";
          e[profile].record.cleanup = "failed";
          e[profile].record.status = "failed";
        },
      ],
      [
        `${profile} valid conservative failure`,
        (_f, e) => {
          e[profile].record.status = "failed";
        },
      ],
      [
        `${profile} discovery kind`,
        (_f, e) => {
          e[profile].suiteResult.kind = "hosted-discovery";
        },
      ],
      [
        `${profile} stale launch`,
        (_f, e) => {
          e[profile].suiteResult.launchId = "0".repeat(64);
        },
      ],
    );
  }
  await refusals(t, cases);
});

test("required hosted projection and source suite identities bind all independently supplied expected records", async (t) => {
  await refusals(t, [
    [
      "null required projection",
      (_f, e) => {
        e.projection = null;
      },
    ],
    [
      "legacy required projection",
      (_f, e) => {
        e.projection.required.mode = "legacy-local";
      },
    ],
    [
      "candidate replacement",
      (_f, e) => {
        e.projection.candidate = e.projection.required;
        delete e.projection.required;
      },
    ],
    [
      "wrong contract",
      (_f, e) => {
        e.projection.required.contractRevision = "docs-v1";
      },
    ],
    [
      "wrong declaration digest",
      (_f, e) => {
        e.projection.profilesSha256 = "0".repeat(64);
      },
    ],
    [
      "wrong production inventory digest",
      (_f, e) => {
        e.projection.inventorySha256.production = "0".repeat(64);
      },
    ],
    [
      "detached declaration tuple",
      (_f, e) => {
        e.stage.expected.declarationInput.inventories.stage.cases[0].title = "Invented obligation";
      },
    ],
    [
      "coherent wrong suite",
      (_f, e) => {
        for (const part of [e.stage.expected, e.stage.record, e.stage.suiteResult]) part.suite.commit = "0".repeat(40);
      },
    ],
    [
      "coherent wrong source",
      (_f, e) => {
        for (const part of [e.production.expected, e.production.record, e.production.suiteResult])
          part.sourceRevision = "0".repeat(40);
      },
    ],
    [
      "coherent wrong publication",
      (_f, e) => {
        e.stage.expected.release.publicationSha256 = e.stage.record.release.publicationSha256 = "0".repeat(64);
      },
    ],
    [
      "coherent wrong archive",
      (_f, e) => {
        e.stage.expected.images.api.archiveSha256 = e.stage.record.images.api.archiveSha256 = "0".repeat(64);
      },
    ],
    [
      "coherent wrong local image",
      (_f, e) => {
        e.production.expected.images.frontend.localImageId =
          e.production.record.images.frontend.localImageId = `sha256:${"0".repeat(64)}`;
      },
    ],
  ]);
});

test("passing self-selected smaller inventories cannot replace the fixed 22 stage or three production obligations", async (t) => {
  await refusals(
    t,
    ["stage", "production"].map((profile) => [
      `smaller ${profile}`,
      (_f, e) => {
        const declaration = e.projection.declarationInput;
        declaration.inventories[profile].cases.pop();
        declaration.metadata.profiles[profile].pop();
        e.projection.required = clone(validateAcceptanceProfiles(declaration));
        for (const selected of ["stage", "production"]) e[selected].expected.declarationInput = clone(declaration);
        for (const value of [e[profile].suiteResult, e[profile].record]) {
          value.inventory.pop();
          value.tests.pop();
        }
        assert.equal(
          validateHostedAcceptance(e[profile]).status,
          "passed",
          "Counterexample must pass generic hosted semantics",
        );
      },
    ]),
  );
});

test("validly shaped target drift and cross-profile registry-pair substitutions cannot finalize", async (t) => {
  await refusals(t, [
    [
      "observed revision drift",
      (_f, e) => {
        e.production.observations.after.revisionId = "other-revision";
        e.production.record.target.after.revisionId = "other-revision";
      },
    ],
    [
      "missing post-read",
      (_f, e) => {
        e.stage.observations.after = e.stage.record.target.after = null;
      },
    ],
    [
      "coherent production digest substitution",
      (_f, e) => {
        const changed = `sha256:${"0".repeat(64)}`;
        e.production.expected.images.api.registryDigest = e.production.record.images.api.registryDigest = changed;
        for (const when of ["before", "after"])
          e.production.observations[when].registryDigests.api = e.production.record.target[when].registryDigests.api =
            changed;
      },
    ],
  ]);
});

test("candidate release must be already published, exactly sourced and contain only the ten verified identities", async (t) => {
  await refusals(t, [
    [
      "candidate missing",
      (_f, _e, s) => {
        s.releases = [];
      },
    ],
    [
      "candidate draft",
      (_f, _e, s) => {
        s.releases[0].draft = true;
      },
    ],
    [
      "candidate wrong source",
      (_f, _e, s) => {
        s.releases[0].target_commitish = "0".repeat(40);
      },
    ],
    [
      "candidate tag conflict",
      (f, _e, s) => {
        s.tags[`v${f.bundle.manifest.version}`] = "0".repeat(40);
      },
    ],
    [
      "candidate publication changed",
      (_f, _e, s) => {
        s.assets[51001].find((asset) => asset.name === "publication.json").digest = `sha256:${"0".repeat(64)}`;
      },
    ],
    [
      "candidate missing asset",
      (_f, _e, s) => {
        s.assets[51001].pop();
      },
    ],
    [
      "candidate extra asset",
      (_f, _e, s) => {
        s.assets[51001].push({
          id: 69999,
          name: "surprise.txt",
          state: "uploaded",
          size: 1,
          digest: `sha256:${"0".repeat(64)}`,
        });
        s.bytes[69999] = Buffer.from("x");
      },
    ],
    [
      "candidate duplicate ID",
      (_f, _e, s) => {
        s.assets[51001][1].id = s.assets[51001][0].id;
      },
    ],
    [
      "candidate invalid ID",
      (_f, _e, s) => {
        s.assets[51001][0].id = 0;
        s.bytes[0] = Buffer.from("x");
      },
    ],
    [
      "candidate changed notes",
      (_f, _e, s) => {
        s.releases[0].body += "altered";
      },
    ],
    [
      "changed local archive",
      (f) => {
        writeFileSync(f.bundle.assets.find((asset) => asset.name === "api.docker.tar").path, "changed archive");
      },
    ],
  ]);
});

test("conflicting v1 tag and published incomplete release are refused without overwrite or repair", async (t) => {
  await refusals(t, [
    [
      "conflicting v1 source",
      (_f, _e, s) => {
        s.tags["v1.0.0"] = "0".repeat(40);
      },
    ],
  ]);
  const { f, input, api, state } = await pass(t);
  state.assets[52001].pop();
  state.mutations.length = 0;
  await assert.rejects(() => subject()(f.bundle, input, api, f.generated));
  assert.deepEqual(state.mutations, [], "Must not repair an already published partial v1 release");
});

test("mid-upload failure retains a draft, then identical retry uploads only missing bytes and publishes last", async (t) => {
  const finalize = subject();
  const f = fixture(t),
    input = evidence(f),
    { api, state, originalSnapshot } = fakeApi(f);
  const original = originalSnapshot();
  state.failAsset = "publication.json";
  await assert.rejects(() => finalize(f.bundle, input, api, f.generated));
  assert.equal(state.releases.find((item) => item.id === 52001).draft, true);
  assert(!state.mutations.some(([method]) => method === "PATCH"));
  assert.deepEqual(originalSnapshot(), original);
  const retained = clone(state.assets[52001]);
  assert(retained.length > 0);
  state.failAsset = null;
  state.mutations.length = 0;
  await finalize(f.bundle, input, api, f.generated);
  assert.deepEqual(state.assets[52001].slice(0, retained.length), retained);
  const uploadedNames = state.mutations.filter(([, , , upload]) => upload).map(([, , value]) => value.name);
  assert.equal(uploadedNames.length, 11 - retained.length);
  for (const asset of retained) assert(!uploadedNames.includes(asset.name));
  assert.equal(state.mutations.at(-1)[0], "PATCH");
  assert.deepEqual(originalSnapshot(), original);
});

test("incorrect observed upload identity prevents publication and never deletes or rewrites existing assets", async (t) => {
  const finalize = subject();
  await pass(t);
  for (const mutate of [
    (asset) => {
      asset.digest = `sha256:${"0".repeat(64)}`;
    },
    (asset) => {
      asset.id = 0;
    },
  ]) {
    const f = fixture(t),
      input = evidence(f),
      { api, state } = fakeApi(f);
    state.corruptUpload = mutate;
    await assert.rejects(() => finalize(f.bundle, input, api, f.generated));
    assert(!state.mutations.some(([method]) => method === "PATCH" || method === "DELETE"));
  }
});
