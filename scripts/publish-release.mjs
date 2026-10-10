/**
 * Publish an immutable private GitHub release of the exact main-push acceptance artifacts, without deployment.
 * CI runs `node scripts/publish-release.mjs` in the dedicated contents:write/actions:read publication job, after
 * downloading its producing attempt's artifact to .artifacts/release-input. Requires GitHub's job-scoped GITHUB_TOKEN,
 * exact ordinary main-push context, full clean Git history and successful live mandatory job evidence. No CLI overrides.
 * Verifies local bytes/source/baseline and live private/protected-main ancestry before mutations. Creates an exact tag
 * and a draft release, uploads only missing assets, verifies GitHub's observed SHA-256/size, then publishes last.
 * Retries reuse identical bytes; mismatches or partial assets fail without overwrite/delete. Failures retain draft/tag
 * state for inspection. Historical releases never replace newer latest releases. Writes two ignored provenance files;
 * after verified publication with original admission, writes a fixed private handoff and three Actions output values.
 * Never builds, loads, retags/pushes images, deploys, calls providers or modifies repository controls or credentials.
 */
import assert from "node:assert/strict";
import {
  closeSync,
  constants,
  createReadStream,
  existsSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  canBeLatest,
  publicationContext,
  publicationMaterial,
  requireMatchingAsset,
  requireObservedChecks,
  requireReleaseMetadata,
  verifyReleaseBundle,
} from "./publish-release-evidence.mjs";
import { digest, requireArtifactPath } from "./release-manifest.mjs";
import { createPublisherHandoff } from "./publisher-handoff.mjs";

/** Require a positive observed GitHub identifier without converting strings or trusting caller claims. */
function observedId(value) {
  assert(Number.isSafeInteger(value) && value > 0, "Missing or invalid observed GitHub identity");
}

/** Fixed GitHub origins, no redirects or shell interpolation; error messages omit credentials and response bodies. */
export function githubApi(repository, token) {
  assert(token, "Missing job-scoped GitHub token");
  const prefix = `/repos/${repository}`;
  return {
    async request(method, path, value, upload = false) {
      assert(path.startsWith(`${prefix}/`) || path === prefix);
      const response = await fetch(`https://${upload ? "uploads" : "api"}.github.com${path}`, {
        method,
        redirect: "error",
        signal: AbortSignal.timeout(upload ? 180000 : 30000),
        headers: {
          authorization: `Bearer ${token}`,
          accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2026-03-10",
          ...(value
            ? upload
              ? { "content-type": "application/octet-stream", "content-length": String(value.bytes) }
              : { "content-type": "application/json" }
            : {}),
        },
        ...(value ? { body: upload ? createReadStream(value.path) : JSON.stringify(value) } : {}),
        ...(upload ? { duplex: "half" } : {}),
      });
      if (method === "GET" && response.status === 404) return null;
      assert(response.ok, `GitHub ${method} request failed (${response.status}); existing state was preserved`);
      return response.json();
    },
    async list(path, field) {
      const all = [];
      for (let page = 1; page <= 20; page++) {
        const response = await this.request(
          "GET",
          `${prefix}${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`,
        );
        const items = field ? response?.[field] : response;
        assert(Array.isArray(items), "Missing GitHub collection");
        all.push(...items);
        if (items.length < 100) return all;
      }
      throw new Error("GitHub collection exceeds the bounded publication scan");
    },
  };
}

async function tagCommit(api, prefix, version) {
  let ref = await api.request("GET", `${prefix}/git/ref/tags/${version}`);
  if (!ref) return null;
  let object = ref.object;
  for (let depth = 0; object?.type === "tag" && depth < 5; depth++)
    object = (await api.request("GET", `${prefix}/git/tags/${object.sha}`))?.object;
  assert.equal(object?.type, "commit", "Release tag does not resolve to a commit");
  return object.sha;
}

/** Injected API permits deterministic publication-failure tests; the CLI always uses real authenticated GitHub. */
export async function publishRelease(bundle, api, generatedDirectory) {
  const { manifest, origin } = bundle;
  const tag = `v${manifest.version}`;
  const prefix = `/repos/${origin.repository}`;
  const [repository, branch, run, jobs] = await Promise.all([
    api.request("GET", prefix),
    api.request("GET", `${prefix}/branches/main`),
    api.request("GET", `${prefix}/actions/runs/${origin.runId}/attempts/${origin.attempt}`),
    api.list(`/actions/runs/${origin.runId}/attempts/${origin.attempt}/jobs`, "jobs"),
  ]);
  const comparison = await api.request("GET", `${prefix}/compare/${origin.sourceRevision}...${branch?.commit?.sha}`);
  requireObservedChecks(bundle, repository, branch, comparison, run, jobs);
  observedId(repository.id);
  observedId(repository.owner?.id);
  const material = publicationMaterial(bundle);
  const assets = [...bundle.assets];
  for (const [name, content] of [
    ["publication.json", material.json],
    ["publication-notes.md", material.notes],
  ]) {
    const path = join(generatedDirectory, name);
    if (existsSync(path)) {
      assert(lstatSync(path).isFile(), "Publication record must be a regular file");
      assert.equal(readFileSync(path, "utf8"), content, "Conflicting generated publication record");
    } else writeFileSync(path, content, { flag: "wx", mode: 0o600 });
    assets.push({ name, path, sha256: digest(content), bytes: Buffer.byteLength(content) });
  }
  const releases = await api.list("/releases");
  const matches = releases.filter((release) => release.tag_name === tag);
  assert(matches.length <= 1, "Ambiguous release version");
  let release = matches[0];
  if (release) requireReleaseMetadata(release, bundle, material.notes);
  const existingTag = await tagCommit(api, prefix, tag);
  assert(
    !existingTag || existingTag === manifest.sourceRevision,
    "Existing tag identifies another source; refusing overwrite",
  );
  if (release && !release.draft) assert(existingTag, "Published release is missing its source tag");
  if (!existingTag)
    await api.request("POST", `${prefix}/git/refs`, {
      ref: `refs/tags/${tag}`,
      sha: manifest.sourceRevision,
    });
  if (!release)
    release = await api.request("POST", `${prefix}/releases`, {
      tag_name: tag,
      target_commitish: manifest.sourceRevision,
      name: manifest.version,
      body: material.notes,
      draft: true,
      prerelease: false,
      make_latest: "false",
      generate_release_notes: false,
    });
  requireReleaseMetadata(release, bundle, material.notes);
  async function verifyAssets(allowUpload) {
    const observed = await api.list(`/releases/${release.id}/assets`);
    for (const asset of observed) observedId(asset.id);
    const observedIds = new Set(observed.map((asset) => asset.id));
    assert.equal(observedIds.size, observed.length, "Duplicate observed release asset IDs");
    assert(new Set(observed.map((asset) => asset.name)).size === observed.length, "Duplicate release assets");
    assert(
      observed.every((asset) => assets.some((expected) => expected.name === asset.name)),
      "Unexpected release assets",
    );
    const verified = [];
    for (const expected of assets) {
      let actual = observed.find((asset) => asset.name === expected.name);
      if (!actual) {
        assert(allowUpload && release.draft, "Published release is incomplete; refusing to modify it");
        actual = await api.request(
          "POST",
          `${prefix}/releases/${release.id}/assets?name=${encodeURIComponent(expected.name)}`,
          expected,
          true,
        );
        observedId(actual?.id);
        assert(!observedIds.has(actual.id), "Uploaded asset reused an observed asset ID");
        observedIds.add(actual.id);
      }
      requireMatchingAsset(actual, expected);
      verified.push({ id: actual.id, name: actual.name, bytes: actual.size, sha256: expected.sha256 });
    }
    return verified.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
  }
  await verifyAssets(true);
  const verifiedAssets = await verifyAssets(false);
  assert.equal(await tagCommit(api, prefix, tag), manifest.sourceRevision, "Release tag changed");
  const reused = !release.draft;
  const releaseId = release.id;
  if (release.draft) {
    const [currentBranch, currentReleases] = await Promise.all([
      api.request("GET", `${prefix}/branches/main`),
      api.list("/releases"),
    ]);
    assert.equal(currentBranch.protected, true);
    const currentComparison = await api.request(
      "GET",
      `${prefix}/compare/${origin.sourceRevision}...${currentBranch.commit.sha}`,
    );
    assert(["ahead", "identical"].includes(currentComparison?.status), "Main ancestry changed before publication");
    release = await api.request("PATCH", `${prefix}/releases/${release.id}`, {
      draft: false,
      make_latest: canBeLatest(bundle, currentBranch, currentReleases) ? "true" : "false",
    });
    requireReleaseMetadata(release, bundle, material.notes);
    assert.equal(release.id, releaseId, "Published release identity changed");
    assert.equal(release.draft, false, "Release publication did not complete");
  }
  return {
    status: "released-not-deployed",
    deployed: false,
    version: manifest.version,
    tag,
    reused,
    releaseId: release.id,
    sourceRevision: manifest.sourceRevision,
    publicationBindingSha256: material.binding,
    repository: { id: repository.id, ownerId: repository.owner.id },
    reservationSha256: manifest.reservationSha256,
    publicationSha256: digest(material.json),
    assets: verifiedAssets,
  };
}

/** Bind the already verified original admission to bundle and publisher identities; never resolve a second authority. */
function handoffInput(bundle, context, expectedAdmissionSha256, result) {
  const { manifest, origin, acceptanceAdmission } = bundle;
  assert(/^[a-f0-9]{64}$/.test(expectedAdmissionSha256 ?? "") && expectedAdmissionSha256.length === 64);
  assert.equal(acceptanceAdmission.sha256, expectedAdmissionSha256, "Independent product admission digest differs");
  const original = acceptanceAdmission.record.context;
  assert.deepEqual(
    {
      schemaVersion: 1,
      repository: original.repository,
      sourceRevision: original.sourceRevision,
      baseRevision: original.baseRevision,
      runId: original.runId,
      attempt: original.attempt,
      workflow: ".github/workflows/ci.yml",
      workflowRevision: original.workflowRevision,
    },
    origin,
    "Original admission context differs from verified bundle origin",
  );
  // sourceTree was checked against the exact Git object by verifyReleaseBundle; no new resolver/source walk is needed.
  assert.equal(original.sourceRevision, manifest.sourceRevision);
  assert.equal(result.sourceRevision, manifest.sourceRevision);
  assert.equal(result.version, manifest.version);
  assert.equal(result.tag, `v${manifest.version}`);
  assert.equal(result.reservationSha256, manifest.reservationSha256);
  assert.equal(result.status, "released-not-deployed");
  assert.equal(result.deployed, false);
  return {
    originalContext: original,
    admissionSha256: expectedAdmissionSha256,
    publisherContext: context,
    repository: result.repository,
    release: {
      id: result.releaseId,
      version: result.version,
      tag: result.tag,
      reservationSha256: result.reservationSha256,
      publicationSha256: result.publicationSha256,
      publicationBindingSha256: result.publicationBindingSha256,
      assets: result.assets,
    },
  };
}

/** Exclusively create the fixed owned handoff, or reuse identical private bytes; never overwrite a conflict/symlink. */
function persistHandoff(root, handoff) {
  const directory = requireArtifactPath(root, ".artifacts/publisher-handoff", { allowMissingLeaf: true });
  try {
    mkdirSync(directory, { mode: 0o700 });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  const stat = lstatSync(directory);
  assert(stat.isDirectory() && !stat.isSymbolicLink() && stat.uid === process.getuid());
  assert.equal(stat.mode & 0o777, 0o700, "Handoff directory must remain private");
  const path = requireArtifactPath(root, ".artifacts/publisher-handoff/handoff.json", { allowMissingLeaf: true });
  const bytes = Buffer.from(`${JSON.stringify(handoff, null, 2)}\n`);
  assert(bytes.length <= 64 * 1024, "Handoff exceeds the receipt bound");
  let fd;
  let created = false;
  try {
    fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    created = true;
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  }
  try {
    const file = fstatSync(fd);
    assert(file.isFile() && file.uid === process.getuid());
    assert.equal(file.mode & 0o777, 0o600, "Handoff file must remain private");
    if (created) writeFileSync(fd, bytes);
    else {
      assert.equal(file.size, bytes.length, "Conflicting publisher handoff");
      assert(readFileSync(fd).equals(bytes), "Conflicting publisher handoff");
    }
  } finally {
    closeSync(fd);
  }
  return digest(bytes);
}

/** Append validated handoff locators to the existing owned Actions output channel only after successful file creation. */
function outputHandoff(handoff, sha256) {
  assert(typeof process.env.GITHUB_OUTPUT === "string" && process.env.GITHUB_OUTPUT.length > 0);
  const fd = openSync(process.env.GITHUB_OUTPUT, constants.O_WRONLY | constants.O_APPEND | constants.O_NOFOLLOW);
  try {
    const stat = fstatSync(fd);
    assert(stat.isFile() && stat.uid === process.getuid());
    const { sourceRevision, runId, attempt } = handoff.publisherContext;
    writeFileSync(
      fd,
      `handoff-ready=true\nhandoff-sha256=${sha256}\n` +
        `handoff-artifact-name=publisher-handoff-${sourceRevision}-${runId}-${attempt}\n`,
    );
  } finally {
    closeSync(fd);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    assert.equal(process.argv.length, 2, "Release publication accepts no overrides");
    assert.equal(process.env.GITHUB_JOB, "publish-release", "Use the dedicated release publication job");
    const context = publicationContext(process.env);
    const root = process.cwd();
    const bundle = await verifyReleaseBundle(root, ".artifacts/release-input", context, {
      expectedAdmissionSha256: process.env.GATE_ADMISSION_SHA256,
    });
    const directory = requireArtifactPath(root, ".artifacts");
    const result = await publishRelease(bundle, githubApi(context.repository, process.env.GITHUB_TOKEN), directory);
    if (bundle.acceptanceAdmission) {
      const handoff = createPublisherHandoff(handoffInput(bundle, context, process.env.GATE_ADMISSION_SHA256, result));
      const sha256 = persistHandoff(root, handoff);
      outputHandoff(handoff, sha256);
    }
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Release publication failed: ${String(error.message).replaceAll(process.cwd(), "[repository]")}`);
    process.exitCode = 1;
  }
}
