/**
 * Exercise release-only publication with disposable Git/bundle fixtures and an in-memory GitHub API, never real releases.
 * Run `node --test scripts/publish-release.test.mjs` with the pinned Node runtime after npm ci. Temporary fixtures model
 * separately landed acceptance, exact committed product/configuration and prepared archives; tests remove all output.
 * Negative controls cover event/permission gates, ancestry/provisional evidence, artifact tampering, failed jobs,
 * conflicting tags/assets, partial publication and stale latest selection. No Docker, credentials or network are used.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import {
  canBeLatest,
  publicationChecks,
  publicationContext,
  publicationMaterial,
  requireObservedChecks,
  requireOrigin,
  requireReleaseWorkflow,
  verifyReleaseBundle,
  verifyReleaseSource,
} from "./publish-release-evidence.mjs";
import { publishRelease } from "./publish-release.mjs";
import {
  archiveIdentity,
  configurationFingerprint,
  createManifest,
  digest,
  preparationIdentity,
  releaseNotes,
  sourceConfigurationPaths,
} from "./release-manifest.mjs";

const repo = "example/private-mp3";
const contextEnv = (source = "1".repeat(40), base = "2".repeat(40)) => ({
  GITHUB_ACTIONS: "true",
  GITHUB_EVENT_NAME: "push",
  GITHUB_REF: "refs/heads/main",
  GITHUB_SERVER_URL: "https://github.com",
  GITHUB_REPOSITORY: repo,
  GITHUB_SHA: source,
  CI_BASE_REF: base,
  GITHUB_WORKFLOW_SHA: source,
  GITHUB_WORKFLOW_REF: `${repo}/.github/workflows/ci.yml@refs/heads/main`,
  GITHUB_RUN_ID: "1234",
  GITHUB_RUN_ATTEMPT: "1",
});
const writeJson = (path, data) => writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);

async function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "release-publication-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const put = (path, contents) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), contents);
  };
  const commit = (message) => {
    git("add", ".");
    git("-c", "user.name=Release Test", "-c", "user.email=test@example.invalid", "commit", "-qm", message);
    return git("rev-parse", "HEAD");
  };
  git("init", "-q");
  put(".gitignore", ".artifacts/\n");
  commit("foundation");
  put("tests/acceptance/fixtures/manifest.json", '{"fixture":"synthetic"}\n');
  const base = commit("independent acceptance");
  const baseline = {
    schemaVersion: 1,
    suiteCommit: base,
    suiteTree: git("rev-parse", `${base}:tests/acceptance`),
    manifestSha256: digest(readFileSync(join(root, "tests/acceptance/fixtures/manifest.json"))),
    contractRevision: "test-r1",
    publicationStatus: "protected-main",
  };
  put("docs/testing/baseline.json", JSON.stringify(baseline));
  const configFiles = Object.fromEntries(
    sourceConfigurationPaths.map((path) => [path, Buffer.from(`Synthetic ${path}\n`)]),
  );
  for (const [path, bytes] of Object.entries(configFiles)) put(path, bytes);
  const source = commit("product");
  const context = publicationContext(contextEnv(source, base));
  const report = {
    schemaVersion: 1,
    status: "passed",
    cleanup: "passed",
    targetKind: "local",
    sourceDirty: false,
    trackedDiffSha256: digest(""),
    sourceRevision: source,
    suiteCommit: base,
    suiteTree: baseline.suiteTree,
    manifestSha256: baseline.manifestSha256,
    contractRevision: baseline.contractRevision,
    baselinePublication: "protected-main",
    configurationSha256: "5".repeat(64),
    project: "mp3-e2e-synthetic-release",
    acceptance: { status: "passed", planned: 60, passed: 60, failed: 0, skipped: 0 },
    images: { api: `sha256:${"a".repeat(64)}`, frontend: `sha256:${"b".repeat(64)}` },
  };
  const directory = join(root, ".artifacts/release-input");
  mkdirSync(directory, { recursive: true });
  const archives = {};
  for (const service of ["api", "frontend"]) {
    writeFileSync(join(directory, `${service}.docker.tar`), `Synthetic ${service} archive`);
    archives[service] = await archiveIdentity(join(directory, `${service}.docker.tar`));
  }
  const identity = preparationIdentity(report, 3, configurationFingerprint(configFiles));
  const manifest = createManifest(identity, source, archives);
  writeJson(join(directory, "manifest.json"), manifest);
  writeJson(join(directory, "reservation.json"), identity);
  writeJson(join(directory, "ci-origin.json"), context);
  writeJson(join(directory, "e2e-result.json"), report);
  writeFileSync(join(directory, "release-notes.md"), releaseNotes(manifest));
  writeFileSync(
    join(directory, "SHA256SUMS"),
    ["api", "frontend"].map((service) => `${archives[service].sha256}  ${service}.docker.tar\n`).join(""),
  );
  const bundle = await verifyReleaseBundle(root, directory, context);
  return { root, directory, generated: join(root, ".artifacts"), context, bundle, git, commit, baseline };
}

function fakeApi(bundle) {
  const { origin } = bundle;
  const prefix = `/repos/${origin.repository}`;
  const state = {
    repository: { id: 31001, owner: { id: 42002 }, full_name: repo, private: true, default_branch: "main" },
    branch: { name: "main", protected: true, commit: { sha: origin.sourceRevision } },
    comparison: { status: "identical" },
    run: {
      id: origin.runId,
      run_attempt: origin.attempt,
      head_sha: origin.sourceRevision,
      head_branch: "main",
      event: "push",
      path: origin.workflow,
      repository: { full_name: repo },
    },
    jobs: publicationChecks.map((name) => ({
      name,
      head_sha: origin.sourceRevision,
      run_attempt: origin.attempt,
      status: "completed",
      conclusion: "success",
    })),
    releases: [],
    assets: [],
    tag: null,
    mutations: [],
    failAsset: null,
    latest: null,
  };
  return {
    state,
    async list(path) {
      if (path.endsWith("/jobs")) return structuredClone(state.jobs);
      if (path.endsWith("/assets")) return structuredClone(state.assets);
      if (path === "/releases") return structuredClone(state.releases);
      throw new Error(`Unexpected list ${path}`);
    },
    async request(method, path, data) {
      const route = path.slice(prefix.length);
      if (method === "GET") {
        if (!route) return structuredClone(state.repository);
        if (route === "/branches/main") return structuredClone(state.branch);
        if (route.startsWith("/compare/")) return structuredClone(state.comparison);
        if (route.startsWith("/actions/runs/")) return structuredClone(state.run);
        if (route.startsWith("/git/ref/tags/"))
          return state.tag ? { object: { type: "commit", sha: state.tag } } : null;
      }
      state.mutations.push({ method, route, data: structuredClone(data) });
      if (method === "POST" && route === "/git/refs") {
        state.tag = data.sha;
        return { object: { type: "commit", sha: data.sha } };
      }
      if (method === "POST" && route === "/releases") {
        const release = { ...data, id: 42 };
        state.releases.push(release);
        return structuredClone(release);
      }
      if (method === "POST" && route.startsWith("/releases/42/assets?")) {
        const name = new URL(`https://api.github.com${route}`).searchParams.get("name");
        if (state.failAsset === name) throw new Error("Synthetic upload failure");
        const bytes = readFileSync(data.path);
        const asset = {
          id: 91001 + state.assets.length,
          name,
          state: "uploaded",
          size: bytes.length,
          digest: `sha256:${digest(bytes)}`,
        };
        state.assets.push(asset);
        return asset;
      }
      if (method === "PATCH" && route === "/releases/42") {
        state.releases[0].draft = data.draft;
        state.latest = data.make_latest;
        return structuredClone(state.releases[0]);
      }
      throw new Error(`Unexpected ${method} ${route}`);
    },
  };
}

test("publication context rejects PRs, local use, other branches and substituted workflow/source", () => {
  const valid = contextEnv();
  for (const fields of [
    { GITHUB_EVENT_NAME: "pull_request" },
    { GITHUB_ACTIONS: "false" },
    { GITHUB_REF: "refs/heads/feature" },
    { GITHUB_WORKFLOW_SHA: "3".repeat(40) },
    { GITHUB_RUN_ATTEMPT: "0" },
    { CI_BASE_REF: "main" },
  ])
    assert.throws(() => publicationContext({ ...valid, ...fields }));
  const context = publicationContext(valid);
  requireOrigin(context, { ...context, attempt: 2 });
  assert.throws(() => requireOrigin({ ...context, runId: 999 }, context), /another source or workflow run/);
});

test("real Git bundle verification binds protected baseline, full ordinal, source config and archive bytes", async (t) => {
  const f = await fixture(t);
  assert.equal(f.bundle.manifest.version, "0.1.3");
  writeFileSync(join(f.directory, "api.docker.tar"), "Changed archive");
  await assert.rejects(verifyReleaseBundle(f.root, f.directory, f.context), /archive bytes changed/);
  const f2 = await fixture(t);
  const changed = structuredClone(f2.bundle.manifest);
  changed.ordinal = 9;
  writeJson(join(f2.directory, "manifest.json"), changed);
  await assert.rejects(verifyReleaseBundle(f2.root, f2.directory, f2.context), /ordinal/);
});

test("provisional or unlanded acceptance and mismatched checkout remain ineligible", async (t) => {
  const f = await fixture(t);
  assert.throws(
    () => verifyReleaseSource(f.root, { ...f.context, sourceRevision: f.context.baseRevision }),
    /Checkout differs/,
  );
  assert.throws(
    () => verifyReleaseSource(f.root, { ...f.context, baseRevision: f.git("rev-parse", "HEAD~2") }),
    /trusted base/,
  );
  writeJson(join(f.root, "docs/testing/baseline.json"), {
    ...f.baseline,
    publicationStatus: "provisional-local-review",
  });
  const source = f.commit("provisional cannot release");
  assert.throws(() => verifyReleaseSource(f.root, { ...f.context, sourceRevision: source }), /protected-main baseline/);
});

test("downloaded origin/report symlinks and a different producing attempt fail before publication", async (t) => {
  const f = await fixture(t);
  const origin = join(f.directory, "ci-origin.json");
  rmSync(origin);
  symlinkSync(join(f.directory, "manifest.json"), origin);
  await assert.rejects(verifyReleaseBundle(f.root, f.directory, f.context), /regular files/);
  rmSync(origin);
  writeJson(origin, { ...f.context, attempt: 2 });
  await assert.rejects(verifyReleaseBundle(f.root, f.directory, f.context));
});

test("mandatory live job failures, skipped jobs and source substitutions cannot authorize writes", async (t) => {
  const f = await fixture(t);
  for (const conclusion of ["failure", "skipped", "cancelled", null]) {
    const api = fakeApi(f.bundle);
    api.state.jobs[0].conclusion = conclusion;
    await assert.rejects(publishRelease(f.bundle, api, f.generated), /did not succeed/);
    assert.equal(api.state.mutations.length, 0);
  }
  const api = fakeApi(f.bundle);
  api.state.run.head_sha = "f".repeat(40);
  await assert.rejects(publishRelease(f.bundle, api, f.generated));
  assert.equal(api.state.mutations.length, 0);
  api.state.run.head_sha = f.context.sourceRevision;
  api.state.repository.private = false;
  assert.throws(
    () =>
      requireObservedChecks(
        f.bundle,
        api.state.repository,
        api.state.branch,
        api.state.comparison,
        api.state.run,
        api.state.jobs,
      ),
    /private repository/,
  );
  const reused = fakeApi(f.bundle);
  const nextAttempt = { ...f.bundle, origin: { ...f.bundle.origin, attempt: 2 } };
  reused.state.run.run_attempt = 2;
  for (const job of reused.state.jobs) job.run_attempt = 2;
  reused.state.jobs.find(({ name }) => name === "validate-product").run_attempt = 1;
  assert.throws(
    () =>
      requireObservedChecks(
        nextAttempt,
        reused.state.repository,
        reused.state.branch,
        reused.state.comparison,
        reused.state.run,
        reused.state.jobs,
      ),
    /belongs to another attempt.*rerun all jobs/,
  );
});

test("complete release publishes last, records undeployed provenance and reuses identical published bytes", async (t) => {
  const f = await fixture(t);
  const api = fakeApi(f.bundle);
  const result = await publishRelease(f.bundle, api, f.generated);
  assert.equal(result.status, "released-not-deployed");
  assert.equal(result.deployed, false);
  assert.equal(result.tag, "v0.1.3");
  assert.equal(api.state.releases[0].tag_name, "v0.1.3");
  assert.equal(api.state.latest, "true");
  assert.equal(api.state.assets.length, 10);
  assert.equal(api.state.mutations.at(-1).method, "PATCH");
  const record = JSON.parse(readFileSync(join(f.generated, "publication.json")));
  assert.equal(record.deployed, false);
  assert.equal(record.provider, null);
  assert.equal(f.bundle.manifest.status, "prepared-local");
  assert.equal(f.bundle.manifest.versionProvisional, true);
  const count = api.state.mutations.length;
  assert.equal((await publishRelease(f.bundle, api, f.generated)).reused, true);
  assert.equal(api.state.mutations.length, count, "An identical published release must not be mutated");
});

test("partial upload stays draft and same-byte retry uploads missing assets before publishing", async (t) => {
  const f = await fixture(t);
  const api = fakeApi(f.bundle);
  api.state.failAsset = "frontend.docker.tar";
  await assert.rejects(publishRelease(f.bundle, api, f.generated), /Synthetic upload failure/);
  assert.equal(api.state.releases[0].draft, true);
  assert(!api.state.mutations.some(({ method }) => method === "PATCH"));
  const existing = structuredClone(api.state.assets);
  api.state.failAsset = null;
  await publishRelease(f.bundle, api, f.generated);
  for (const asset of existing)
    assert.deepEqual(
      api.state.assets.find(({ name }) => name === asset.name),
      asset,
    );
  assert.equal(api.state.assets.length, 10);
  assert.equal(api.state.releases[0].draft, false);
});

test("conflicting tags, release metadata, changed assets and partial asset states are never overwritten", async (t) => {
  const f = await fixture(t);
  const conflict = fakeApi(f.bundle);
  conflict.state.tag = "e".repeat(40);
  await assert.rejects(publishRelease(f.bundle, conflict, f.generated), /another source/);
  assert.equal(conflict.state.mutations.length, 0);
  for (const change of [{ digest: `sha256:${"f".repeat(64)}` }, { state: "starter" }, { digest: null }]) {
    const api = fakeApi(f.bundle);
    api.state.failAsset = "frontend.docker.tar";
    await assert.rejects(publishRelease(f.bundle, api, f.generated));
    Object.assign(api.state.assets[0], change);
    const count = api.state.mutations.length;
    api.state.failAsset = null;
    await assert.rejects(publishRelease(f.bundle, api, f.generated), /digest|Partial asset/);
    assert.equal(api.state.mutations.length, count);
    assert.equal(api.state.releases[0].draft, true);
  }
  const api = fakeApi(f.bundle);
  await publishRelease(f.bundle, api, f.generated);
  api.state.releases[0].body += " modified";
  const count = api.state.mutations.length;
  await assert.rejects(publishRelease(f.bundle, api, f.generated), /provenance differ/);
  assert.equal(api.state.mutations.length, count);
});

test("historical releases and greater existing ordinals never become latest", async (t) => {
  const f = await fixture(t);
  const api = fakeApi(f.bundle);
  api.state.branch.commit.sha = "d".repeat(40);
  api.state.comparison.status = "ahead";
  await publishRelease(f.bundle, api, f.generated);
  assert.equal(api.state.latest, "false");
  assert.equal(
    canBeLatest(f.bundle, { commit: { sha: f.context.sourceRevision } }, [{ tag_name: "v0.1.20", draft: false }]),
    false,
  );
});

test("workflow policy confines writes/token to main publisher and exact post-gate artifact handoff", () => {
  const workflow = parse(readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8"));
  requireReleaseWorkflow(workflow);
  for (const change of [
    (w) => {
      w.jobs["validate-product"].permissions = { contents: "write" };
    },
    (w) => {
      w.jobs["publish-release"].if = "${{ always() }}";
    },
    (w) => {
      w.jobs["publish-release"].needs = ["validate-product"];
    },
    (w) => {
      w.jobs["publish-release"].concurrency["cancel-in-progress"] = true;
    },
    (w) => {
      w.jobs["publish-release"].steps.find((s) => s.uses?.startsWith("actions/download-artifact@")).with["run-id"] =
        "another";
    },
    (w) => {
      w.jobs["validate-foundation"].steps[0].env = { GITHUB_TOKEN: "${{ github.token }}" };
    },
  ]) {
    const invalid = structuredClone(workflow);
    change(invalid);
    assert.throws(() => requireReleaseWorkflow(invalid));
  }
});

/** Fixed inputs captured before VER-01: hashes bind the complete legacy JSON/notes, including ordering and newlines. */
test("ordinal 6 and 7 publication bytes retain their literal pre-allocation schema-1 goldens", () => {
  const report = {
    schemaVersion: 1,
    trackedDiffSha256: digest(""),
    status: "passed",
    cleanup: "passed",
    targetKind: "local",
    sourceDirty: false,
    sourceRevision: "1".repeat(40),
    suiteCommit: "2".repeat(40),
    suiteTree: "3".repeat(40),
    manifestSha256: "4".repeat(64),
    contractRevision: "r3",
    baselinePublication: "protected-main",
    project: "mp3-e2e-fixed-publication",
    configurationSha256: "5".repeat(64),
    acceptance: { status: "passed", planned: 60, passed: 60, failed: 0, skipped: 0 },
    images: { api: `sha256:${"a".repeat(64)}`, frontend: `sha256:${"b".repeat(64)}` },
  };
  const configuration = configurationFingerprint(
    Object.fromEntries(sourceConfigurationPaths.map((path) => [path, Buffer.from(`Fixed ${path}\n`)])),
  );
  const names = [
    "SHA256SUMS",
    "api.docker.tar",
    "ci-origin.json",
    "e2e-result.json",
    "frontend.docker.tar",
    "manifest.json",
    "release-notes.md",
    "reservation.json",
  ];
  const expected = [
    [
      6,
      "29895c801037d695fdc8e76fa4715abe4e508ac6f21da0c801f830d7df6cd33f",
      "cbcb73e92292c07456e85c740a539fbf197d0d7abde5750d75a05f4a0226a3e6",
      "ecc12417f356faaf6b25aa8e07832af89b4168e7c64dc066fcf3dfac5105a897",
    ],
    [
      7,
      "9454dbdd48e555c762389bf9606eac49dca72e0ae91d98c94df2ba0be6b9be4f",
      "b21a52ba683bc45e2db396aac0d85ceb7f5ea14f297421eecf448d3ca13d95ad",
      "b76566655209e4655e8acea241f11ea2dc6071393e817d466573afa6a8425832",
    ],
  ];
  for (const [ordinal, jsonHash, notesHash, binding] of expected) {
    const identity = preparationIdentity(report, ordinal, configuration);
    const manifest = createManifest(identity, report.sourceRevision, {
      api: { sha256: "6".repeat(64), bytes: 17 },
      frontend: { sha256: "7".repeat(64), bytes: 19 },
    });
    const origin = {
      schemaVersion: 1,
      repository: repo,
      sourceRevision: report.sourceRevision,
      baseRevision: "8".repeat(40),
      runId: 42001,
      attempt: 1,
      workflow: ".github/workflows/ci.yml",
      workflowRevision: report.sourceRevision,
    };
    const material = publicationMaterial({
      manifest,
      origin,
      assets: names.map((name) => ({ name, sha256: digest(name), bytes: Buffer.byteLength(name) })),
    });
    assert.equal(digest(material.json), jsonHash, `Complete JSON bytes changed at ordinal ${ordinal}`);
    assert.equal(digest(material.notes), notesHash, `Complete notes bytes changed at ordinal ${ordinal}`);
    assert.equal(material.binding, binding);
    assert.equal(JSON.parse(material.json).schemaVersion, 1);
    assert.equal(Object.hasOwn(JSON.parse(material.json), "releasePolicy"), false);
    assert.equal(Object.hasOwn(JSON.parse(material.json), "ordinal"), false);
  }
});

test("stable latest selection compares numeric lines and fails closed on malformed stable metadata", () => {
  const sourceRevision = "1".repeat(40);
  const branch = { commit: { sha: sourceRevision } };
  const bundle = (version, ordinal) => ({ manifest: { sourceRevision, version, ordinal } });
  const release = (tag_name, extra = {}) => ({ tag_name, draft: false, prerelease: false, ...extra });
  for (const [version, ordinal, other, expected] of [
    ["0.1.20", 20, "v0.2.18", false],
    ["0.2.18", 18, "v0.1.20", true],
    ["0.2.18", 18, "v0.10.19", false],
    ["0.10.19", 19, "v0.2.200", true],
    ["0.2.18", 18, "v0.2.19", false],
    ["0.2.18", 18, "v0.2.18", true],
    ["0.10.19", 19, "v1.0.0", false],
  ])
    assert.equal(canBeLatest(bundle(version, ordinal), branch, [release(other)]), expected, `${version} vs ${other}`);
  for (const invalid of [
    "latest",
    "0.2.18",
    "v0.02.18",
    "v0.2.018",
    "v0.2.19-rc.1",
    "v0.2.19+build",
    "v0.2.9007199254740992",
    "v0.2",
    "v0.-2.3",
    null,
  ]) {
    assert.equal(canBeLatest(bundle("0.2.18", 18), branch, [release(invalid)]), false, `Unsafe stable tag ${invalid}`);
  }
  for (const ignored of [release("invalid", { draft: true }), release("v1.0.0", { prerelease: true })]) {
    assert.equal(canBeLatest(bundle("0.2.18", 18), branch, [ignored]), true);
  }
  assert.equal(canBeLatest(bundle("0.2.18", 18), { commit: { sha: "2".repeat(40) } }, []), false);
});

/** PUBLISHER-HANDOFF additions retain every earlier assertion and both historical publication byte goldens. */
test("publisher handoff metadata retains exact observed repository/asset IDs and raw versus canonical hashes", async (t) => {
  const f = await fixture(t);
  const api = fakeApi(f.bundle);
  const result = await publishRelease(f.bundle, api, f.generated);
  assert.deepEqual(
    Object.keys(result).sort(),
    [
      "status",
      "deployed",
      "version",
      "tag",
      "reused",
      "releaseId",
      "sourceRevision",
      "publicationBindingSha256",
      "repository",
      "reservationSha256",
      "publicationSha256",
      "assets",
    ].sort(),
  );
  assert.deepEqual(result.repository, { id: 31001, ownerId: 42002 });
  assert.equal(result.reservationSha256, f.bundle.manifest.reservationSha256);
  assert.equal(result.publicationSha256, digest(readFileSync(join(f.generated, "publication.json"))));
  assert.notEqual(result.publicationSha256, result.publicationBindingSha256);
  const expectedNames = [
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
  assert.deepEqual(
    result.assets.map((asset) => asset.name),
    expectedNames,
  );
  for (const asset of result.assets) {
    const observed = api.state.assets.find(({ name }) => name === asset.name);
    assert.deepEqual(asset, {
      id: observed.id,
      name: observed.name,
      bytes: observed.size,
      sha256: observed.digest.slice(7),
    });
  }
  const bytes = Object.fromEntries([
    ...f.bundle.assets.map(({ name, path }) => [name, readFileSync(path)]),
    ...["publication.json", "publication-notes.md"].map((name) => [name, readFileSync(join(f.generated, name))]),
  ]);
  const before = structuredClone(api.state.assets);
  const mutationCount = api.state.mutations.length;
  const again = await publishRelease(f.bundle, api, f.generated);
  assert.deepEqual(again, { ...result, reused: true });
  assert.deepEqual(api.state.assets, before);
  assert.equal(api.state.mutations.length, mutationCount);
  for (const [name, original] of Object.entries(bytes)) {
    const path = f.bundle.assets.find((asset) => asset.name === name)?.path ?? join(f.generated, name);
    assert.deepEqual(readFileSync(path), original, `Retry changed ${name}`);
  }
  assert.equal(api.state.assets.length, 10);
  assert.equal(
    existsSync(join(f.generated, "publisher-handoff/handoff.json")),
    false,
    "The three-argument publication API alone cannot retrofit a handoff onto legacy fixtures",
  );
});

test("publisher refuses invalid observed metadata rather than minting handoff identities from input claims", async (t) => {
  const f = await fixture(t);
  for (const change of [
    (api) => {
      delete api.state.repository.id;
    },
    (api) => {
      api.state.repository.id = "31001";
    },
    (api) => {
      api.state.repository.owner.id = 0;
    },
  ]) {
    const api = fakeApi(f.bundle);
    change(api);
    await assert.rejects(publishRelease(f.bundle, api, f.generated));
    assert.equal(existsSync(join(f.generated, "publisher-handoff/handoff.json")), false);
  }
  for (const change of [
    (assets) => {
      delete assets[0].id;
    },
    (assets) => {
      assets[0].id = "91001";
    },
    (assets) => {
      assets[0].id = Number.MAX_SAFE_INTEGER + 1;
    },
    (assets) => {
      assets[1].id = assets[0].id;
    },
  ]) {
    const api = fakeApi(f.bundle);
    api.state.failAsset = "frontend.docker.tar";
    await assert.rejects(publishRelease(f.bundle, api, f.generated), /Synthetic upload failure/);
    change(api.state.assets);
    api.state.failAsset = null;
    await assert.rejects(publishRelease(f.bundle, api, f.generated));
    assert.equal(api.state.releases[0].draft, true);
  }
});

/** Isolate the actual publisher CLI; only bundle verification is replaced by a named synthetic fixture boundary. */
async function handoffPublisherCLI(t) {
  assert(
    existsSync(new URL("./publisher-handoff.mjs", import.meta.url)),
    "Missing publisher handoff implementation; availability red only",
  );
  const f = await fixture(t);
  const context = {
    repository: repo,
    eventName: "push",
    ref: "refs/heads/main",
    sourceRevision: f.context.sourceRevision,
    sourceTree: f.git("rev-parse", "HEAD^{tree}"),
    baseRevision: f.context.baseRevision,
    workflowRevision: f.context.sourceRevision,
    toolingRevision: f.context.baseRevision,
    runId: 1234,
    attempt: 1,
  };
  const admission = {
    record: {
      schemaVersion: 1,
      kind: "ci-acceptance-admission",
      context,
      observedReviews: [],
      resolution: { syntheticBoundaryOnly: true },
    },
    sha256: "b".repeat(64),
  };
  // The real verification API has independent original-digest tests. This fixture substitutes only its successful
  // return; it cannot certify resolver/admission validity and is never passed off as real verified release evidence.
  const bundle = { ...f.bundle, acceptanceAdmission: admission };
  const statePath = join(f.root, ".artifacts/fake-api.json");
  const output = join(f.root, ".artifacts/github-output");
  const preload = join(f.root, ".artifacts/publisher-preload.mjs");
  const evidenceUrl = new URL("./publish-release-evidence.mjs", import.meta.url).href;
  const scriptUrl = new URL("./publish-release.mjs", import.meta.url);
  const intercepted = `export * from ${JSON.stringify(evidenceUrl)};
    export async function verifyReleaseBundle(root,directory,options,extra) {
      if(root!==${JSON.stringify(f.root)} || directory!=='.artifacts/release-input' ||
        extra?.expectedAdmissionSha256!==${JSON.stringify(admission.sha256)}) throw new Error('Wrong independent digest handoff');
      return ${JSON.stringify(bundle)};
    }`;
  writeFileSync(
    preload,
    `
    import assert from 'node:assert/strict';
    import { readFileSync, writeFileSync } from 'node:fs';
    import { registerHooks, syncBuiltinESMExports } from 'node:module';
    import http from 'node:http'; import https from 'node:https'; import net from 'node:net';
    import tls from 'node:tls'; import child from 'node:child_process';
    const deny=()=>{throw new Error('Forbidden synthetic publisher network or subprocess');};
    for(const mod of [http,https,net,tls,child]) for(const key of ['request','get','connect','createConnection',
      'exec','execFile','spawn','fork','execSync','execFileSync','spawnSync']) if(typeof mod[key]==='function') mod[key]=deny;
    syncBuiltinESMExports();
    registerHooks({ resolve(specifier,context,next) {
      if(specifier==='./publish-release-evidence.mjs' && context.parentURL===${JSON.stringify(scriptUrl.href)})
        return {url:'data:text/javascript,'+encodeURIComponent(${JSON.stringify(intercepted)}),shortCircuit:true};
      return next(specifier,context);
    }});
    const path=${JSON.stringify(statePath)}; const state=JSON.parse(readFileSync(path,'utf8'));
    const save=()=>writeFileSync(path,JSON.stringify(state));
    globalThis.fetch=async(url,options)=>{
      const u=new URL(url); assert(['api.github.com','uploads.github.com'].includes(u.hostname));
      assert.equal(options.redirect,'error');
      assert.equal(options.headers.authorization,'Bearer synthetic-not-a-credential');
      const route=u.pathname.slice(${JSON.stringify(`/repos/${repo}`)}.length);
      const respond=value=>({ok:true,status:200,json:async()=>structuredClone(value)});
      if(options.method==='GET') {
        if(route==='') return respond(state.repository);
        if(route==='/branches/main') return respond(state.branch);
        if(route.startsWith('/compare/')) return respond(state.comparison);
        if(route.endsWith('/jobs')) return respond({jobs:state.jobs});
        if(route.startsWith('/actions/runs/')) return respond(state.run);
        if(route==='/releases') return respond(state.releases);
        if(route.endsWith('/assets')) return respond(state.assets);
        if(route.startsWith('/git/ref/tags/')) return state.tag?respond({object:{type:'commit',sha:state.tag}}):{ok:false,status:404};
      }
      const value=u.hostname==='uploads.github.com'?null:JSON.parse(options.body);
      if(options.method==='POST' && route==='/git/refs') {state.tag=value.sha; save();return respond({object:{type:'commit',sha:state.tag}});}
      if(options.method==='POST' && route==='/releases') {state.releases=[{...value,id:42}];save();return respond(state.releases[0]);}
      if(options.method==='POST' && route==='/releases/42/assets') {
        const name=u.searchParams.get('name');
        if(state.failAsset===name) throw new Error('Synthetic upload failure');
        const chunks=[];for await(const chunk of options.body)chunks.push(chunk);
        const bytes=Buffer.concat(chunks);const {createHash}=await import('node:crypto');
        const asset={id:91001+state.assets.length,name,state:'uploaded',size:bytes.length,
          digest:'sha256:'+createHash('sha256').update(bytes).digest('hex')};state.assets.push(asset);save();return respond(asset);
      }
      if(options.method==='PATCH' && route==='/releases/42') {
        if(state.failFinal) throw new Error('Synthetic final publication failure');
        state.releases[0].draft=value.draft;save();return respond(state.releases[0]);
      }
      throw new Error('Unexpected synthetic API operation');
    };
  `,
  );
  const state = fakeApi(bundle).state;
  for (const job of state.jobs)
    job.steps = [{ name: "Validate acceptance admission", status: "completed", conclusion: "success" }];
  const env = {
    PATH: dirname(process.execPath),
    LANG: "C.UTF-8",
    ...contextEnv(f.context.sourceRevision, f.context.baseRevision),
    GITHUB_RUN_ATTEMPT: "3",
    GITHUB_JOB: "publish-release",
    GITHUB_TOKEN: "synthetic-not-a-credential",
    GATE_ADMISSION_SHA256: admission.sha256,
    GITHUB_OUTPUT: output,
  };
  const execute = (overrides = {}) =>
    spawnSync(process.execPath, ["--import", preload, fileURLToPath(scriptUrl)], {
      cwd: f.root,
      env: { ...env, ...overrides },
      encoding: "utf8",
      timeout: 15000,
      maxBuffer: 512 * 1024,
    });
  const run = (stateValue = state, overrides = {}) => {
    writeJson(statePath, stateValue);
    writeFileSync(output, "");
    return execute(overrides);
  };
  return {
    ...f,
    bundle,
    context,
    state,
    statePath,
    output,
    run,
    execute,
    handoff: join(f.generated, "publisher-handoff/handoff.json"),
  };
}

test("publisher CLI emits exact handoff/outputs only after verified publication and preserves same-byte retries", async (t) => {
  const f = await handoffPublisherCLI(t);
  const result = f.run();
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  const bytes = readFileSync(f.handoff);
  assert.equal(lstatSync(f.handoff).mode & 0o777, 0o600);
  assert.equal(lstatSync(dirname(f.handoff)).mode & 0o777, 0o700);
  const handoff = JSON.parse(bytes);
  assert.deepEqual(handoff.originalContext, f.context);
  assert.equal(handoff.admissionSha256, "b".repeat(64));
  assert.equal(handoff.publisherContext.attempt, 3);
  assert.equal(handoff.originalContext.attempt, 1);
  assert.equal(handoff.release.publicationSha256, digest(readFileSync(join(f.generated, "publication.json"))));
  assert.deepEqual(handoff.repository, { id: 31001, ownerId: 42002 });
  assert.equal(handoff.release.assets.length, 10);
  assert.equal(bytes.toString(), JSON.stringify(handoff, null, 2) + "\n");
  assert.deepEqual(
    Object.fromEntries(
      readFileSync(f.output, "utf8")
        .trim()
        .split("\n")
        .map((line) => line.split("=")),
    ),
    {
      "handoff-ready": "true",
      "handoff-sha256": digest(bytes),
      "handoff-artifact-name": `publisher-handoff-${f.context.sourceRevision}-1234-3`,
    },
  );
  const state = JSON.parse(readFileSync(f.statePath));
  assert.equal(state.releases[0].draft, false);
  const retry = f.run(state);
  assert.equal(retry.status, 0, retry.stderr);
  assert.deepEqual(readFileSync(f.handoff), bytes);
  assert.deepEqual(JSON.parse(readFileSync(f.statePath)).assets, state.assets);
  writeFileSync(f.handoff, Buffer.concat([bytes, Buffer.from(" ")]));
  const conflict = f.run(state);
  assert.notEqual(conflict.status, 0);
  assert.equal(readFileSync(f.output, "utf8"), "");
  assert.deepEqual(
    readFileSync(f.handoff),
    Buffer.concat([bytes, Buffer.from(" ")]),
    "Conflicting retry was overwritten",
  );
});

test("publisher CLI retains no handoff-ready or handoff file after admission/tag/upload/final-publication failure", async (t) => {
  for (const kind of ["admission", "job", "tag", "upload", "final"]) {
    const f = await handoffPublisherCLI(t);
    const counterpart = f.run();
    assert.equal(counterpart.status, 0, `Valid publisher counterpart failed: ${counterpart.stderr}`);
    rmSync(dirname(f.handoff), { recursive: true });
    const state = structuredClone(f.state);
    const env = {};
    if (kind === "admission") env.GATE_ADMISSION_SHA256 = "c".repeat(64);
    if (kind === "job") state.jobs[0].conclusion = "failure";
    if (kind === "tag") state.tag = "e".repeat(40);
    if (kind === "upload") state.failAsset = "frontend.docker.tar";
    if (kind === "final") state.failFinal = true;
    const result = f.run(state, env);
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0, `${kind} unexpectedly succeeded`);
    assert.equal(existsSync(f.handoff), false, `${kind} wrote premature handoff`);
    assert.equal(readFileSync(f.output, "utf8"), "", `${kind} emitted premature readiness`);
    if (["upload", "final"].includes(kind)) assert.equal(JSON.parse(readFileSync(f.statePath)).releases[0].draft, true);
  }
});

test("later publisher retry retains original context and all ten assets while using its actual new attempt", async (t) => {
  const f = await handoffPublisherCLI(t);
  const first = f.run();
  assert.equal(first.status, 0, first.stderr);
  const original = JSON.parse(readFileSync(f.handoff));
  const state = JSON.parse(readFileSync(f.statePath));
  const releaseBytes = ["publication.json", "publication-notes.md"].map((name) =>
    readFileSync(join(f.generated, name)),
  );
  rmSync(dirname(f.handoff), { recursive: true }); // Model a fresh publisher job's private workspace, not artifact deletion.
  const retry = f.run(state, { GITHUB_RUN_ATTEMPT: "4" });
  assert.equal(retry.status, 0, retry.stderr);
  const later = JSON.parse(readFileSync(f.handoff));
  assert.deepEqual(later.originalContext, original.originalContext);
  assert.equal(later.admissionSha256, original.admissionSha256);
  assert.deepEqual(later.release, original.release);
  assert.equal(later.publisherContext.attempt, 4);
  assert(
    readFileSync(f.output, "utf8").includes(
      `handoff-artifact-name=publisher-handoff-${f.context.sourceRevision}-1234-4\n`,
    ),
  );
  assert.deepEqual(JSON.parse(readFileSync(f.statePath)).assets, state.assets);
  for (const [index, name] of ["publication.json", "publication-notes.md"].entries())
    assert.deepEqual(readFileSync(join(f.generated, name)), releaseBytes[index]);
});

test("publisher CLI refuses fixed handoff file or directory symlinks without touching external bytes", async (t) => {
  const directoryBytes = (directory) =>
    Object.fromEntries(
      readdirSync(directory, { withFileTypes: true }).map((entry) => [
        entry.name,
        entry.isDirectory() ? directoryBytes(join(directory, entry.name)) : readFileSync(join(directory, entry.name)),
      ]),
    );
  for (const kind of ["file", "directory", "ancestor"]) {
    const f = await handoffPublisherCLI(t);
    const first = f.run();
    assert.equal(first.status, 0, first.stderr);
    const state = JSON.parse(readFileSync(f.statePath));
    const bytes = readFileSync(f.handoff);
    const foreign = join(f.root, "foreign");
    if (kind === "ancestor") {
      // Prepare legitimate matching state/output/preload/bundle bytes before relocation. execute() itself does not
      // rewrite harness files, so byte changes can only come from the actual publisher or its intercepted API.
      writeJson(f.statePath, state);
      writeFileSync(f.output, "");
      const original = directoryBytes(f.generated);
      renameSync(f.generated, foreign);
      symlinkSync(foreign, f.generated);
      const result = f.execute();
      assert.equal(result.error, undefined);
      assert.notEqual(result.status, 0);
      assert(!result.stdout.includes("PUBLISHER_HANDOFF_V1 "));
      assert.equal(readFileSync(f.output, "utf8"), "");
      assert.deepEqual(directoryBytes(foreign), original, "Ancestor refusal changed external fixture bytes");
      continue;
    }
    mkdirSync(foreign);
    const external = join(foreign, "handoff.json");
    writeFileSync(external, bytes);
    rmSync(dirname(f.handoff), { recursive: true });
    if (kind === "directory") symlinkSync(foreign, dirname(f.handoff));
    else {
      mkdirSync(dirname(f.handoff));
      symlinkSync(external, f.handoff);
    }
    const result = f.run(state);
    assert.notEqual(result.status, 0);
    assert.equal(readFileSync(f.output, "utf8"), "");
    assert.deepEqual(readFileSync(external), bytes);
  }
});
