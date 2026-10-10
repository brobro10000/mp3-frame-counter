/**
 * Validate local release-preparation records and supplied future promotion evidence without performing deployment.
 *
 * Imported by prepare-release.mjs and `node --test scripts/release-preparation.test.mjs`. Pure validators accept
 * records, reject missing/failed/mismatched identities and return consistency results only: they do not observe
 * GitHub/providers, confer authorization or turn prepared-local artifacts into deployable releases. Directory
 * verification reads only the exact recorded archives/metadata and streams SHA-256; it never rewrites a reservation.
 * Allocation reads exact Git objects and complete first-parent history, ignoring replacement objects and working
 * edits. The checkout guard additionally requires exact working policy bytes. Invalid selections, incomplete history
 * and conflicting reservations throw; importing this module performs no I/O. Run the allocation/preparation tests
 * with `node --test scripts/release-allocation.test.mjs scripts/release-preparation.test.mjs`.
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream, lstatSync, readFileSync, realpathSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

export const services = ["api", "frontend"];
export const sourceConfigurationPaths = [
  ".dockerignore",
  "compose.yaml",
  "frontend/.dockerignore",
  "frontend/Dockerfile",
  "frontend/entrypoint.sh",
  "frontend/nginx.conf.template",
  "server/Dockerfile",
];
const sha = /^[a-f0-9]{40}$/;
const checksum = /^[a-f0-9]{64}$/;
const imageId = /^sha256:[a-f0-9]{64}$/;
const emptyDiff = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
const requireSha = (value, label) => assert(typeof value === "string" && sha.test(value), `Invalid ${label}`);
const requireHash = (value, label) => assert(typeof value === "string" && checksum.test(value), `Invalid ${label}`);
const requireImage = (value) =>
  assert(typeof value === "string" && imageId.test(value), "Invalid immutable image identity");
const text = (value) => assert(typeof value === "string" && value.length > 0, "Missing evidence identity");

/**
 * Resolve an artifact path without following symlinked directory components, including .artifacts itself.
 * This read-only guard runs before any child directory or export is created. Only an explicitly allowed absent
 * final component may pass; all existing parents must be regular directories inside the actual checkout root.
 */
export function requireArtifactPath(root, path, { allowMissingLeaf = false } = {}) {
  const parts = relative(resolve(root), resolve(root, path)).split(sep);
  assert(
    parts[0] === ".artifacts" && parts.every((part) => part && part !== "." && part !== ".."),
    "Path must be inside this checkout's ignored artifact directory",
  );
  let current = realpathSync(root);
  for (const [index, part] of parts.entries()) {
    current = join(current, part);
    const final = index === parts.length - 1;
    let metadata;
    try {
      metadata = lstatSync(current);
    } catch (error) {
      if (error.code === "ENOENT" && final && allowMissingLeaf) return current;
      throw error;
    }
    assert(!metadata.isSymbolicLink(), "Artifact path components must not be symlinks");
    if (!final) assert(metadata.isDirectory(), "Artifact parent must be a regular directory");
  }
  return current;
}

/** Canonical key ordering makes fingerprints and generated notes independent of JSON input whitespace/key ordering. */
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
export const digest = (value) => createHash("sha256").update(value).digest("hex");

/** Require every planned test, positive test discovery and explicit success with no skip/failure substitutions. */
export function requireAcceptance(result) {
  assert.equal(result?.status, "passed", "Acceptance did not pass");
  assert(Number.isSafeInteger(result.planned) && result.planned > 0, "No mandatory acceptance cases recorded");
  assert.equal(result.passed, result.planned, "Not every mandatory acceptance case passed");
  assert.equal(result.failed, 0, "Acceptance failures remain");
  assert.equal(result.skipped, 0, "Mandatory acceptance cannot be skipped");
}

/** Validate and select only the nonsecret fields that identify a clean, complete local application test. */
export function localEvidence(report) {
  assert.equal(report?.schemaVersion, 1);
  assert.equal(report.status, "passed", "Local E2E did not pass");
  assert.equal(report.cleanup, "passed", "Local E2E cleanup did not pass");
  assert.equal(report.targetKind, "local", "Preparation requires a local tested pair");
  assert.equal(report.sourceDirty, false, "Tested source must be a clean Git revision");
  assert.equal(report.trackedDiffSha256, emptyDiff, "Tested source has uncommitted changes");
  assert(!report.controlFailures || (Array.isArray(report.controlFailures) && report.controlFailures.length === 0));
  requireAcceptance(report.acceptance);
  for (const field of ["sourceRevision", "suiteCommit", "suiteTree"]) requireSha(report[field], field);
  for (const field of ["manifestSha256", "configurationSha256"]) requireHash(report[field], field);
  text(report.contractRevision);
  text(report.baselinePublication);
  assert(/^mp3-e2e-[a-z0-9-]+$/.test(report.project), "Invalid local evidence run identity");
  assert.deepEqual(Object.keys(report.images ?? {}).sort(), services);
  for (const service of services) requireImage(report.images[service]);
  assert.notEqual(report.images.api, report.images.frontend, "Record the independently built image pair");
  return {
    sourceRevision: report.sourceRevision,
    suiteCommit: report.suiteCommit,
    suiteTree: report.suiteTree,
    fixtureManifestSha256: report.manifestSha256,
    contractRevision: report.contractRevision,
    baselinePublication: report.baselinePublication,
    runId: report.project,
    localAcceptanceConfigurationSha256: report.configurationSha256,
    acceptance: {
      status: "passed",
      planned: report.acceptance.planned,
      passed: report.acceptance.passed,
      failed: 0,
      skipped: 0,
    },
    images: { api: report.images.api, frontend: report.images.frontend },
  };
}

/** An ordinal is a version preview only; its protected-main eligibility must later be independently established. */
export function versionForOrdinal(ordinal) {
  assert(Number.isSafeInteger(ordinal) && ordinal > 0, "First-parent source ordinal must be a positive safe integer");
  return `0.1.${ordinal}`;
}

const releasePolicyPath = "release-policy.json";
const releaseStrategy = "global-first-parent-ordinal";
const ordinaryObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function requireFields(value, fields, label) {
  assert(ordinaryObject(value), `Invalid ${label}`);
  assert.deepEqual(Object.keys(value).sort(), [...fields].sort(), `Invalid ${label} fields`);
}

function releaseLineMinor(line) {
  const match = typeof line === "string" && /^0\.([1-9][0-9]*)$/.exec(line);
  assert(match && match[0] === line, "Invalid release policy line");
  const minor = Number(match[1]);
  assert(Number.isSafeInteger(minor), "Unsafe release policy minor");
  return minor;
}

function requireReleasePolicy(policy, bound = false) {
  requireFields(policy, ["schemaVersion", "strategy", "line", ...(bound ? ["sha256"] : [])], "release policy");
  assert.equal(policy.schemaVersion, 1, "Unsupported release policy schema");
  assert.equal(policy.strategy, releaseStrategy, "Unsupported release policy strategy");
  if (bound) requireHash(policy.sha256, "release policy digest");
  return releaseLineMinor(policy.line);
}

function releaseGit(root, ...args) {
  return execFileSync("git", ["--no-replace-objects", ...args], {
    cwd: root,
    env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_TERMINAL_PROMPT: "0" },
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 16 * 1024 * 1024,
    timeout: 30_000,
  });
}

/** Read only the exact root entry; a symlink/tree establishes presence but is never followed as a policy. */
function committedReleasePolicy(root, revision) {
  const entry = releaseGit(root, "ls-tree", "-z", revision, "--", releasePolicyPath).toString("utf8");
  if (entry === "") return null;
  const match = /^(\d{6}) (blob|tree|commit) ([a-f0-9]{40})\trelease-policy\.json\0$/.exec(entry);
  assert(match, "Unreadable release policy tree entry");
  if (match[2] !== "blob" || !["100644", "100755"].includes(match[1])) return { ordinary: false };
  return { ordinary: true, bytes: releaseGit(root, "cat-file", "blob", match[3]) };
}

/** JSON.parse validates grammar; a separate token walk rejects duplicate decoded keys before interpreting values. */
function uniquePolicyJSON(bytes) {
  const source = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  const value = JSON.parse(source);
  const tokens = source.match(/"(?:[^"\\]|\\[\s\S])*"|[^\s{}\[\]:,]+|[{}\[\]:,]/g);
  let index = 0;
  const visit = () => {
    const token = tokens[index++];
    if (token === "{") {
      const keys = new Set();
      while (tokens[index] !== "}") {
        const key = JSON.parse(tokens[index++]);
        assert(!keys.has(key), "Duplicate release policy JSON key");
        keys.add(key);
        index++; // Colon; grammar has already been validated.
        visit();
        if (tokens[index] !== ",") break;
        index++;
      }
      index++;
    } else if (token === "[") {
      while (tokens[index] !== "]") {
        visit();
        if (tokens[index] !== ",") break;
        index++;
      }
      index++;
    }
  };
  visit();
  assert.equal(index, tokens.length, "Invalid release policy JSON tokens");
  return value;
}

/**
 * Resolve a source's line and global ordinal by replaying its complete first-parent history, without writes/network.
 * Invalid policy data is repairable, but its presence ends legacy fallback. Unsupported declared contracts remain
 * ancestry barriers. Git integrity errors escape immediately and cannot be mistaken for absent/repairable policy.
 */
export function resolveReleaseAllocation(root, sourceRevision) {
  requireSha(sourceRevision, "release source revision");
  assert.equal(sourceRevision.length, 40, "Release source revision must be exact");
  assert.equal(releaseGit(root, "cat-file", "-t", sourceRevision).toString().trim(), "commit");
  assert.equal(
    releaseGit(root, "rev-parse", "--is-shallow-repository").toString().trim(),
    "false",
    "Release allocation requires complete source history",
  );
  const history = releaseGit(root, "rev-list", "--first-parent", "--reverse", sourceRevision)
    .toString()
    .trim()
    .split("\n");
  assert(history.length > 0 && history.at(-1) === sourceRevision, "Invalid release source history");
  let introduced = false;
  let highestMinor = null;
  let policy = null;
  for (const [index, revision] of history.entries()) {
    const headers = releaseGit(root, "cat-file", "commit", revision).toString().split("\n\n", 1)[0].split("\n");
    const firstParent = headers.find((line) => line.startsWith("parent "))?.slice(7);
    assert.equal(firstParent, history[index - 1], "Release source history differs from immutable commit parents");
    const entry = committedReleasePolicy(root, revision);
    policy = null;
    if (entry === null) continue;
    introduced = true;
    if (!entry.ordinary) continue;
    let value;
    try {
      value = uniquePolicyJSON(entry.bytes);
    } catch {
      continue;
    }
    if (ordinaryObject(value)) {
      assert(
        !(Number.isInteger(value.schemaVersion) && value.schemaVersion !== 1),
        "Unsupported release policy schema in source history",
      );
      assert(
        !(typeof value.strategy === "string" && value.strategy !== releaseStrategy),
        "Unsupported release policy strategy in source history",
      );
    }
    let minor;
    try {
      minor = requireReleasePolicy(value);
    } catch {
      continue;
    }
    if (highestMinor === null ? minor !== 1 : minor < highestMinor) continue;
    highestMinor = minor;
    policy = { schemaVersion: 1, strategy: releaseStrategy, line: value.line, sha256: digest(entry.bytes) };
  }
  assert(!introduced || policy !== null, "Invalid release policy selection at source revision");
  const ordinal = history.length;
  versionForOrdinal(ordinal);
  return { sourceRevision, version: `${policy?.line ?? "0.1"}.${ordinal}`, ordinal, policy };
}

/** Compare only canonical stable numeric versions; comparison does not authorize selection of a release line. */
export function compareReleaseVersions(left, right) {
  const components = (value) => {
    const match = typeof value === "string" && /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.exec(value);
    assert(match && match[0] === value, "Invalid stable release version");
    const parts = match.slice(1).map(Number);
    assert(parts.every(Number.isSafeInteger), "Unsafe stable release version");
    return parts;
  };
  const a = components(left);
  const b = components(right);
  for (let index = 0; index < a.length; index++) {
    if (a[index] !== b[index]) return a[index] < b[index] ? -1 : 1;
  }
  return 0;
}

/** Validate HEAD allocation and only the policy path's working presence/type/bytes; unrelated dirty files are allowed. */
export function requireReleasePolicyCheckout(root, expectedSourceRevision = undefined) {
  const sourceRevision = releaseGit(root, "rev-parse", "HEAD").toString().trim();
  if (expectedSourceRevision !== undefined) {
    requireSha(expectedSourceRevision, "expected release source revision");
    assert.equal(sourceRevision, expectedSourceRevision, "Release source revision differs from checked-out HEAD");
  }
  const allocation = resolveReleaseAllocation(root, sourceRevision);
  const committed = committedReleasePolicy(root, sourceRevision);
  const path = join(root, releasePolicyPath);
  const working = lstatSync(path, { throwIfNoEntry: false });
  if (committed === null) assert.equal(working, undefined, "Unexpected working release policy");
  else {
    assert(working?.isFile(), "Working release policy must be an ordinary file");
    assert.deepEqual(readFileSync(path), committed.bytes, "Working release policy differs from source revision");
  }
  return allocation;
}

/** Supplied allocations establish consistency only; callers must independently resolve their source's Git history. */
function requireAllocation(allocation, sourceRevision) {
  requireFields(allocation, ["sourceRevision", "version", "ordinal", "policy"], "release allocation");
  requireSha(allocation.sourceRevision, "allocation source revision");
  assert.equal(allocation.sourceRevision, sourceRevision, "Release allocation source changed");
  versionForOrdinal(allocation.ordinal);
  if (allocation.policy !== null) requireReleasePolicy(allocation.policy, true);
  assert.equal(
    allocation.version,
    `${allocation.policy?.line ?? "0.1"}.${allocation.ordinal}`,
    "Release allocation version changed",
  );
}

function requireIdentityVersion(identity) {
  versionForOrdinal(identity.ordinal);
  const bound = Object.hasOwn(identity, "releasePolicy");
  if (bound) requireReleasePolicy(identity.releasePolicy, true);
  assert.equal(
    identity.version,
    `${bound ? identity.releasePolicy.line : "0.1"}.${identity.ordinal}`,
    "Stale version ordinal or policy",
  );
  return bound ? 2 : 1;
}

/** Verify observed local Docker IDs and platform; registry publication still requires separate observed evidence. */
export function verifyImageInspection(expected, inspected) {
  requireImage(expected);
  assert.equal(inspected?.Id, expected, "Local Docker image does not match the tested image");
  assert.equal(inspected.Os, "linux", "Expected Linux runtime image");
  assert.equal(inspected.Architecture, "amd64", "Expected the reviewed linux/amd64 platform");
}

/** Bind exact committed configuration file bytes without embedding host paths or claiming cloud configuration. */
export function configurationFingerprint(files) {
  assert.deepEqual(Object.keys(files).sort(), sourceConfigurationPaths);
  const entries = sourceConfigurationPaths.map((path) => ({ path, sha256: digest(files[path]) }));
  return { sha256: digest(canonical(entries)), files: entries };
}

/** Construct the source/artifact reservation identity, excluding the tooling revision so unchanged retries can reuse it. */
export function preparationIdentity(report, allocation, sourceConfiguration) {
  const evidence = localEvidence(report);
  const legacy = typeof allocation === "number";
  if (!legacy) requireAllocation(allocation, evidence.sourceRevision);
  const ordinal = legacy ? allocation : allocation.ordinal;
  const version = legacy ? versionForOrdinal(ordinal) : allocation.version;
  requireHash(sourceConfiguration?.sha256, "source configuration fingerprint");
  assert.deepEqual(
    sourceConfiguration.files?.map((entry) => entry.path),
    sourceConfigurationPaths,
  );
  for (const entry of sourceConfiguration.files) requireHash(entry.sha256, "source configuration file hash");
  assert.equal(
    sourceConfiguration.sha256,
    digest(canonical(sourceConfiguration.files)),
    "Source configuration changed",
  );
  const identity = { version, ordinal, platform: "linux/amd64", evidence, sourceConfiguration };
  if (!legacy && allocation.policy !== null) identity.releasePolicy = structuredClone(allocation.policy);
  return identity;
}

/** Record exported bytes as prepared locally; unknown registry/provider/approval values never acquire defaults. */
export function createManifest(identity, preparationRevision, archives) {
  requireSha(preparationRevision, "preparation revision");
  const schemaVersion = requireIdentityVersion(identity);
  const artifacts = {};
  for (const service of services) {
    requireHash(archives[service]?.sha256, "archive checksum");
    assert(
      Number.isSafeInteger(archives[service].bytes) && archives[service].bytes > 0,
      "Empty or missing image archive",
    );
    artifacts[service] = {
      localImageId: identity.evidence.images[service],
      archiveFile: `${service}.docker.tar`,
      archiveSha256: archives[service].sha256,
      archiveBytes: archives[service].bytes,
      registryDigest: null,
    };
  }
  return {
    schemaVersion,
    status: "prepared-local",
    deployable: false,
    versionProvisional: true,
    version: identity.version,
    ordinal: identity.ordinal,
    platform: identity.platform,
    sourceRevision: identity.evidence.sourceRevision,
    preparationRevision,
    reservationSha256: digest(canonical(identity)),
    identity,
    artifacts,
    providerConfigurationSha256: null,
    provider: null,
    candidate: null,
    productionApproval: null,
    missingGates: [
      "protected-main-source-and-CI",
      "protected-main-acceptance-baseline",
      "provider-account-budget-fit-and-scoped-access",
      "observed-registry-digests",
      "full-candidate-acceptance",
      "exact-production-approval",
      "deployed-smoke-and-recovery",
    ],
  };
}

/** Reject a reserved version rebound to different source, suite, images, test configuration or source configuration. */
export function requireSameReservation(existing, identity) {
  assert.equal(existing?.schemaVersion, requireIdentityVersion(identity));
  assert.equal(existing.status, "prepared-local");
  assert.equal(existing.deployable, false);
  assert.equal(existing.versionProvisional, true);
  assert.equal(existing.version, identity.version, "Stale reserved version ordinal");
  assert.equal(existing.ordinal, identity.ordinal, "Reserved source ordinal changed");
  assert.equal(existing.sourceRevision, identity.evidence.sourceRevision, "Reserved source changed");
  assert.equal(existing.platform, identity.platform, "Reserved platform changed");
  requireSha(existing.preparationRevision, "original preparation revision");
  assert.equal(existing.reservationSha256, digest(canonical(identity)), "Conflicting reserved release identity");
  assert.deepEqual(existing.identity, identity, "Reserved source, image or configuration changed");
  for (const service of services) {
    const artifact = existing.artifacts?.[service];
    assert.equal(artifact?.localImageId, identity.evidence.images[service], "Reserved tested image changed");
    assert.equal(artifact.archiveFile, `${service}.docker.tar`);
    requireHash(artifact.archiveSha256, "reserved archive checksum");
    assert(Number.isSafeInteger(artifact.archiveBytes) && artifact.archiveBytes > 0);
    assert.equal(artifact.registryDigest, null, "Local preparation cannot assert registry publication");
  }
  const archives = Object.fromEntries(
    services.map((service) => [
      service,
      {
        sha256: existing.artifacts[service].archiveSha256,
        bytes: existing.artifacts[service].archiveBytes,
      },
    ]),
  );
  assert.deepEqual(
    existing,
    createManifest(identity, existing.preparationRevision, archives),
    "Reserved manifest metadata changed",
  );
}

/** Stream an existing regular archive into SHA-256; reject symlinks rather than following them outside the release. */
export async function archiveIdentity(path) {
  const metadata = lstatSync(path);
  assert(metadata.isFile() && metadata.size > 0, "Expected a nonempty regular image archive");
  const hasher = createHash("sha256");
  for await (const chunk of createReadStream(path)) hasher.update(chunk);
  return { sha256: hasher.digest("hex"), bytes: metadata.size };
}

/** Generate reproducible local notes from immutable identities; no timestamps, credentials or invented deployment. */
export function releaseNotes(manifest) {
  if (manifest.schemaVersion === 2 && manifest.identity.releasePolicy) {
    const policy = manifest.identity.releasePolicy;
    return (
      releaseNotes({ ...manifest, schemaVersion: 1 }) +
      `\nRelease policy line: ${policy.line}\nGlobal ordinal: ${manifest.ordinal}\n` +
      `Release policy SHA-256: ${policy.sha256}\n`
    );
  }
  return (
    `# ${manifest.version} — local preparation\n\n` +
    `Provisional version; no tag, hosted release or deployment has been created.\n\n` +
    `Tested source: ${manifest.sourceRevision}\nPreparation tooling: ${manifest.preparationRevision}\n` +
    `Acceptance suite: ${manifest.identity.evidence.suiteCommit}\n` +
    `Acceptance: ${manifest.identity.evidence.acceptance.passed}/${manifest.identity.evidence.acceptance.planned} passed.\n` +
    `Platform: ${manifest.platform}\nSource configuration SHA-256: ${manifest.identity.sourceConfiguration.sha256}\n\n` +
    services
      .map(
        (service) =>
          `- ${service}: ${manifest.artifacts[service].localImageId}; archive SHA-256 ${manifest.artifacts[service].archiveSha256}`,
      )
      .join("\n") +
    "\n\nRegistry digests and provider configuration are unknown. Protected-main, candidate, exact approval, deployed smoke and recovery gates remain required.\n"
  );
}

/** Reuse only unchanged complete bytes; never silently repair, re-export or overwrite a conflicted reservation. */
export async function verifyPreparedDirectory(directory, identity) {
  assert(lstatSync(directory).isDirectory() && !lstatSync(directory).isSymbolicLink());
  for (const name of ["manifest.json", "reservation.json", "SHA256SUMS", "release-notes.md"]) {
    assert(lstatSync(join(directory, name)).isFile(), "Reserved metadata must be a regular file");
  }
  const manifest = JSON.parse(readFileSync(join(directory, "manifest.json"), "utf8"));
  requireSameReservation(manifest, identity);
  assert.deepEqual(JSON.parse(readFileSync(join(directory, "reservation.json"), "utf8")), identity);
  for (const service of services) {
    const actual = await archiveIdentity(join(directory, manifest.artifacts[service].archiveFile));
    assert.equal(actual.sha256, manifest.artifacts[service].archiveSha256, "Reserved archive bytes changed");
    assert.equal(actual.bytes, manifest.artifacts[service].archiveBytes, "Reserved archive size changed");
  }
  const sums =
    services.map((service) => `${manifest.artifacts[service].archiveSha256}  ${service}.docker.tar`).join("\n") + "\n";
  assert.equal(readFileSync(join(directory, "SHA256SUMS"), "utf8"), sums, "Reserved archive checksum record changed");
  assert.equal(
    readFileSync(join(directory, "release-notes.md"), "utf8"),
    releaseNotes(manifest),
    "Reserved notes changed",
  );
  return manifest;
}

/** Bind supplied future registry identities and candidate/production configuration to one exact approval fingerprint. */
export function promotionBinding(manifest, evidence) {
  return digest(
    canonical({
      reservationSha256: manifest.reservationSha256,
      artifacts: manifest.artifacts,
      registryDigests: evidence.registryDigests,
      candidateConfigurationSha256: evidence.candidateConfigurationSha256,
      productionConfigurationSha256: evidence.productionConfigurationSha256,
      provider: evidence.provider,
    }),
  );
}

/**
 * Check supplied future promotion evidence for consistency only. No network observation, authority or action occurs.
 * This validator cannot approve the current provisional baseline; there is deliberately no CLI promotion operation.
 */
export function validatePromotionEvidence(manifest, evidence) {
  requireSameReservation(manifest, manifest.identity);
  assert.equal(
    manifest.identity.evidence.baselinePublication,
    "protected-main",
    "Provisional baseline cannot be promoted",
  );
  assert.equal(evidence?.source?.branch, "main");
  assert.equal(evidence.source.revision, manifest.sourceRevision);
  assert.equal(evidence.source.ordinal, manifest.ordinal, "Stale protected-main ordinal");
  assert.equal(
    evidence.sourceConfigurationSha256,
    manifest.identity.sourceConfiguration.sha256,
    "Source configuration changed",
  );
  const checks = ["control-plane", "validate-foundation", "validate-product"];
  assert.deepEqual(Object.keys(evidence.source.checks ?? {}).sort(), checks);
  for (const check of checks)
    assert.equal(evidence.source.checks[check], "success", `Mandatory ${check} did not succeed`);
  text(evidence.source.runId);
  for (const key of ["name", "account", "environment", "region"]) text(evidence.provider?.[key]);
  for (const key of ["fitVerified", "budgetApproved", "scopedAccessVerified"])
    assert.equal(evidence.provider[key], true);
  for (const field of ["candidateConfigurationSha256", "productionConfigurationSha256"])
    requireHash(evidence[field], field);
  assert.equal(evidence.configurationDifferencesReviewed, true);
  assert.deepEqual(Object.keys(evidence.registryDigests ?? {}).sort(), services);
  for (const service of services) {
    requireImage(evidence.registryDigests[service]);
    assert.equal(
      evidence.archiveSha256?.[service],
      manifest.artifacts[service].archiveSha256,
      "Artifact bytes changed",
    );
  }
  assert.equal(evidence.candidate?.status, "passed");
  assert.equal(evidence.candidate.targetKind, "candidate");
  assert.equal(evidence.candidate.sourceRevision, manifest.sourceRevision);
  assert.equal(evidence.candidate.suiteCommit, manifest.identity.evidence.suiteCommit);
  assert.equal(evidence.candidate.fixtureManifestSha256, manifest.identity.evidence.fixtureManifestSha256);
  assert.equal(evidence.candidate.configurationSha256, evidence.candidateConfigurationSha256);
  assert.deepEqual(evidence.candidate.registryDigests, evidence.registryDigests);
  requireAcceptance(evidence.candidate.acceptance);
  assert.equal(evidence.candidate.acceptance.planned, manifest.identity.evidence.acceptance.planned);
  assert.equal(evidence.candidate.cleanup, "passed");
  text(evidence.candidate.runId);
  assert.equal(evidence.approval?.status, "approved", "Exact production approval is missing");
  text(evidence.approval.actor);
  text(evidence.approval.reference);
  assert.equal(
    evidence.approval.releaseBindingSha256,
    promotionBinding(manifest, evidence),
    "Approval does not bind this exact release",
  );
  return true;
}
