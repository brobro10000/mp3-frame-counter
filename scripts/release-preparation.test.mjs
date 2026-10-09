/**
 * Verify local release identity, immutable reuse and future evidence consistency without Docker or provider actions.
 * Run `node --test scripts/release-preparation.test.mjs`; fixtures are synthetic records and disposable archive bytes.
 * Negative cases prove failure/skip rejection, source/config/artifact conflicts, changed reserved bytes and missing
 * exact approval cannot pass. Positive promotion input is only a consistency fixture, never real release authority.
 */

import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  archiveIdentity,
  configurationFingerprint,
  createManifest,
  localEvidence,
  preparationIdentity,
  promotionBinding,
  releaseNotes,
  requireArtifactPath,
  requireSameReservation,
  services,
  sourceConfigurationPaths,
  validatePromotionEvidence,
  verifyImageInspection,
  verifyPreparedDirectory,
  versionForOrdinal,
} from "./release-manifest.mjs";

const report = () => ({
  schemaVersion: 1,
  status: "passed",
  cleanup: "passed",
  targetKind: "local",
  sourceDirty: false,
  trackedDiffSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  acceptance: { status: "passed", planned: 60, passed: 60, failed: 0, skipped: 0 },
  sourceRevision: "1".repeat(40),
  suiteCommit: "2".repeat(40),
  suiteTree: "3".repeat(40),
  manifestSha256: "4".repeat(64),
  configurationSha256: "5".repeat(64),
  contractRevision: "r3",
  baselinePublication: "provisional-local-review",
  project: "mp3-e2e-synthetic-1",
  images: { api: `sha256:${"a".repeat(64)}`, frontend: `sha256:${"b".repeat(64)}` },
});
const sourceConfig = () =>
  configurationFingerprint(
    Object.fromEntries(sourceConfigurationPaths.map((path) => [path, Buffer.from(`Synthetic ${path}\n`)])),
  );
const identity = (value = report()) => preparationIdentity(value, 10, sourceConfig());
const archives = () => ({
  api: { sha256: "c".repeat(64), bytes: 100 },
  frontend: { sha256: "d".repeat(64), bytes: 101 },
});
const manifest = (value = report()) => createManifest(identity(value), "6".repeat(40), archives());

function promotionFixture() {
  const input = report();
  input.baselinePublication = "protected-main";
  const prepared = manifest(input);
  const evidence = {
    source: {
      branch: "main",
      revision: prepared.sourceRevision,
      ordinal: 10,
      runId: "synthetic-ci-1",
      checks: { "control-plane": "success", "validate-foundation": "success", "validate-product": "success" },
    },
    sourceConfigurationSha256: prepared.identity.sourceConfiguration.sha256,
    provider: {
      name: "synthetic",
      account: "test",
      environment: "test",
      region: "test",
      fitVerified: true,
      budgetApproved: true,
      scopedAccessVerified: true,
    },
    candidateConfigurationSha256: "7".repeat(64),
    productionConfigurationSha256: "8".repeat(64),
    configurationDifferencesReviewed: true,
    registryDigests: { api: `sha256:${"e".repeat(64)}`, frontend: `sha256:${"f".repeat(64)}` },
    archiveSha256: { api: prepared.artifacts.api.archiveSha256, frontend: prepared.artifacts.frontend.archiveSha256 },
  };
  evidence.candidate = {
    status: "passed",
    targetKind: "candidate",
    sourceRevision: prepared.sourceRevision,
    suiteCommit: prepared.identity.evidence.suiteCommit,
    fixtureManifestSha256: prepared.identity.evidence.fixtureManifestSha256,
    configurationSha256: evidence.candidateConfigurationSha256,
    registryDigests: structuredClone(evidence.registryDigests),
    acceptance: structuredClone(input.acceptance),
    cleanup: "passed",
    runId: "synthetic-candidate-1",
  };
  evidence.approval = {
    status: "approved",
    actor: "synthetic-owner",
    reference: "synthetic-approval-1",
    releaseBindingSha256: promotionBinding(prepared, evidence),
  };
  return { prepared, evidence };
}

test("only complete clean local acceptance becomes normalized nonsecret preparation evidence", () => {
  const input = report();
  input.extraSensitiveField = "must not enter the manifest";
  const result = localEvidence(input);
  assert.equal(result.sourceRevision, input.sourceRevision);
  assert.equal(result.acceptance.passed, 60);
  assert.equal(result.extraSensitiveField, undefined);
});

test("failed, cancelled, skipped, missing and zero-case local results fail closed", () => {
  const mutations = [
    (value) => (value.status = "failed"),
    (value) => (value.cleanup = "failed"),
    (value) => delete value.acceptance,
    (value) => (value.acceptance.status = "cancelled"),
    (value) => (value.acceptance.skipped = 1),
    (value) => (value.acceptance.failed = 1),
    (value) => (value.acceptance.passed = 59),
    (value) => (value.acceptance.planned = 0),
    (value) => delete value.acceptance.failed,
  ];
  for (const mutate of mutations) {
    const value = report();
    mutate(value);
    assert.throws(() => localEvidence(value));
  }
});

test("dirty or unrecorded source and malformed immutable images cannot be prepared", () => {
  for (const mutate of [
    (value) => (value.sourceDirty = true),
    (value) => (value.trackedDiffSha256 = "0".repeat(64)),
    (value) => (value.sourceRevision = "HEAD"),
    (value) => (value.images.api = "api:latest"),
  ]) {
    const value = report();
    mutate(value);
    assert.throws(() => localEvidence(value));
  }
});

test("local Docker inspection binds tested IDs to the reviewed platform", () => {
  const id = report().images.api;
  assert.doesNotThrow(() => verifyImageInspection(id, { Id: id, Os: "linux", Architecture: "amd64" }));
  assert.throws(() => verifyImageInspection(id, { Id: report().images.frontend, Os: "linux", Architecture: "amd64" }));
  assert.throws(() => verifyImageInspection(id, { Id: id, Os: "linux", Architecture: "arm64" }));
});

test("version previews reject unsafe ordinals and a stale reserved ordinal", () => {
  assert.equal(versionForOrdinal(10), "0.1.10");
  for (const value of [0, -1, 1.5, "10", Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => versionForOrdinal(value));
  const existing = manifest();
  existing.version = "0.1.9";
  assert.throws(() => requireSameReservation(existing, identity()), /ordinal/);
});

test("source configuration fingerprint changes with committed bytes and rejects inconsistent fingerprints", () => {
  const files = Object.fromEntries(sourceConfigurationPaths.map((path) => [path, Buffer.from(path)]));
  const original = configurationFingerprint(files);
  files["compose.yaml"] = Buffer.from("altered deployment configuration");
  assert.notEqual(configurationFingerprint(files).sha256, original.sha256);
  original.sha256 = "0".repeat(64);
  assert.throws(() => preparationIdentity(report(), 10, original), /configuration changed/);
});

test("prepared manifests and deterministic notes explicitly preserve local-only unknown deployment identities", () => {
  const value = manifest();
  assert.equal(value.status, "prepared-local");
  assert.equal(value.deployable, false);
  assert.equal(value.versionProvisional, true);
  assert.equal(value.artifacts.api.registryDigest, null);
  assert.equal(value.providerConfigurationSha256, null);
  assert.equal(value.productionApproval, null);
  assert.equal(releaseNotes(value), releaseNotes(structuredClone(value)));
  assert.match(releaseNotes(value), /no tag, hosted release or deployment/);
});

test("unchanged reservation can be verified by later tooling without rewriting its original provenance", () => {
  const existing = manifest();
  assert.doesNotThrow(() => requireSameReservation(existing, identity()));
  assert.equal(existing.preparationRevision, "6".repeat(40));
});

test("reserved versions reject changed source, images, local config, source config and publication claims", () => {
  for (const mutate of [
    (value) => (value.sourceRevision = "9".repeat(40)),
    (value) => (value.images.api = `sha256:${"9".repeat(64)}`),
    (value) => (value.configurationSha256 = "9".repeat(64)),
  ]) {
    const input = report();
    mutate(input);
    assert.throws(() => requireSameReservation(manifest(), identity(input)));
  }
  const existing = manifest();
  existing.providerConfigurationSha256 = "9".repeat(64);
  assert.throws(() => requireSameReservation(existing, identity()), /metadata changed/);
});

test("real reserved archive bytes and checksum sidecars are verified without overwriting tampering", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "release-preparation-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const savedArchives = {};
  for (const service of services) {
    writeFileSync(join(directory, `${service}.docker.tar`), `Synthetic ${service} archive bytes`);
    savedArchives[service] = await archiveIdentity(join(directory, `${service}.docker.tar`));
  }
  const expected = identity();
  const saved = createManifest(expected, "6".repeat(40), savedArchives);
  writeFileSync(join(directory, "manifest.json"), JSON.stringify(saved));
  writeFileSync(join(directory, "reservation.json"), JSON.stringify(expected));
  writeFileSync(join(directory, "release-notes.md"), releaseNotes(saved));
  writeFileSync(
    join(directory, "SHA256SUMS"),
    services.map((service) => `${savedArchives[service].sha256}  ${service}.docker.tar`).join("\n") + "\n",
  );
  assert.deepEqual(await verifyPreparedDirectory(directory, expected), saved);
  writeFileSync(join(directory, "api.docker.tar"), "Changed archive bytes");
  await assert.rejects(verifyPreparedDirectory(directory, expected), /archive bytes changed/);
});

test("a provisional baseline and missing mandatory protected-main checks block promotion consistency", () => {
  const { prepared, evidence } = promotionFixture();
  assert.throws(() => validatePromotionEvidence(manifest(), evidence), /Provisional baseline/);
  for (const result of ["skipped", "cancelled", "failed", undefined]) {
    const changed = structuredClone(evidence);
    if (result === undefined) delete changed.source.checks["validate-product"];
    else changed.source.checks["validate-product"] = result;
    assert.throws(() => validatePromotionEvidence(prepared, changed));
  }
});

test("candidate configuration, archive identity, planned suite and stale ordinal changes are rejected", () => {
  const { prepared, evidence } = promotionFixture();
  for (const mutate of [
    (value) => (value.source.ordinal = 9),
    (value) => (value.archiveSha256.api = "0".repeat(64)),
    (value) => (value.sourceConfigurationSha256 = "0".repeat(64)),
    (value) => (value.candidate.configurationSha256 = "0".repeat(64)),
    (value) => (value.candidate.acceptance.skipped = 1),
    (value) => (value.registryDigests.api = "api:latest"),
  ]) {
    const changed = structuredClone(evidence);
    mutate(changed);
    assert.throws(() => validatePromotionEvidence(prepared, changed));
  }
});

test("missing approval or a configuration change after approval cannot match the exact release", () => {
  const { prepared, evidence } = promotionFixture();
  const missing = structuredClone(evidence);
  delete missing.approval;
  assert.throws(() => validatePromotionEvidence(prepared, missing), /approval is missing/);
  evidence.productionConfigurationSha256 = "9".repeat(64);
  assert.throws(() => validatePromotionEvidence(prepared, evidence), /exact release/);
});

test("a complete synthetic supplied evidence set validates consistency without changing prepared-local status", () => {
  const { prepared, evidence } = promotionFixture();
  assert.equal(validatePromotionEvidence(prepared, evidence), true);
  // A separately observed published OCI index can have the same digest as the recorded local Docker identity.
  for (const service of services) evidence.registryDigests[service] = prepared.artifacts[service].localImageId;
  evidence.candidate.registryDigests = structuredClone(evidence.registryDigests);
  evidence.approval.releaseBindingSha256 = promotionBinding(prepared, evidence);
  assert.equal(validatePromotionEvidence(prepared, evidence), true);
  for (const service of services) assert.equal(prepared.artifacts[service].registryDigest, null);
  assert.equal(prepared.status, "prepared-local");
  assert.equal(prepared.deployable, false);
});

test("symlinked artifact, release and report parents fail before creating anything in their in-repo target", (t) => {
  const root = mkdtempSync(join(tmpdir(), "release-path-safety-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const docs = join(root, "docs");
  mkdirSync(docs);
  writeFileSync(join(docs, "report.json"), "{}");
  const artifacts = join(root, ".artifacts");
  symlinkSync(docs, artifacts, "dir");
  assert.throws(() => {
    const parent = requireArtifactPath(root, ".artifacts/releases", { allowMissingLeaf: true });
    mkdirSync(parent, { recursive: true });
  }, /must not be symlinks/);
  assert.equal(existsSync(join(docs, "releases")), false);
  rmSync(artifacts);
  mkdirSync(artifacts);
  symlinkSync(docs, join(artifacts, "releases"), "dir");
  assert.throws(() => {
    const parent = requireArtifactPath(root, ".artifacts/releases", { allowMissingLeaf: true });
    mkdirSync(join(parent, "0.1.10"), { recursive: true });
  }, /must not be symlinks/);
  assert.equal(existsSync(join(docs, "0.1.10")), false);
  symlinkSync(docs, join(artifacts, "reports"), "dir");
  assert.throws(() => requireArtifactPath(root, ".artifacts/reports/report.json"), /must not be symlinks/);
  rmSync(join(artifacts, "releases"));
  const safe = requireArtifactPath(root, ".artifacts/releases", { allowMissingLeaf: true });
  assert.equal(existsSync(safe), false, "The path check itself must not create directories");
});
