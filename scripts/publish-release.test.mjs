/**
 * Exercise release-only publication with disposable Git/bundle fixtures and an in-memory GitHub API, never real releases.
 * Run `node --test scripts/publish-release.test.mjs` with the pinned Node runtime after npm ci. Temporary fixtures model
 * separately landed acceptance, exact committed product/configuration and prepared archives; tests remove all output.
 * Negative controls cover event/permission gates, ancestry/provisional evidence, artifact tampering, failed jobs,
 * conflicting tags/assets, partial publication and stale latest selection. No Docker, credentials or network are used.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
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
    repository: { full_name: repo, private: true, default_branch: "main" },
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
        const asset = { name, state: "uploaded", size: bytes.length, digest: `sha256:${digest(bytes)}` };
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
