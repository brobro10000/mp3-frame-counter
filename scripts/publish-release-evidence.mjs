/**
 * Validate release-only CI provenance and immutable prepared bundles; expose publication policy to focused tests.
 * Imported by the preparation/publication entry points. Inputs are GitHub context, local Git objects and a prepared
 * artifact directory; no provider or GitHub mutations occur here. Reads and hashes exact files, rejects provisional
 * baselines, changed artifacts, stale ordinals, incomplete jobs and non-main contexts. No deployment approval is implied.
 * After policy introduction, callers must supply the independent product-job admission digest; the report's envelope
 * is verified against that digest, its original producing attempt and a fresh source/base resolver decision. Legacy
 * source histories retain their original schemas and bytes. Publication provenance binds the report as a hashed asset.
 */
import assert from "node:assert/strict";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { git, verifyBaseline } from "./acceptance-baseline.mjs";
import { acceptancePolicyIntroduced, verifyAcceptanceAdmission } from "./acceptance-admission.mjs";
import { requirePreflightWorkflow } from "./acceptance-preflight.mjs";
import {
  archiveIdentity,
  canonical,
  configurationFingerprint,
  digest,
  localEvidence,
  requireArtifactPath,
  sourceConfigurationPaths,
  verifyPreparedDirectory,
  versionForOrdinal,
} from "./release-manifest.mjs";

export const preparedAssetNames = [
  "SHA256SUMS",
  "api.docker.tar",
  "ci-origin.json",
  "e2e-result.json",
  "frontend.docker.tar",
  "manifest.json",
  "release-notes.md",
  "reservation.json",
];
export const publicationChecks = ["control-plane", "validate-foundation", "validate-product"];
const sha = /^[a-f0-9]{40}$/;

/** Accept only the ordinary main-push workflow; these fields are claims until checked against GitHub's API. */
export function publicationContext(env) {
  assert.equal(env.GITHUB_ACTIONS, "true", "Publication requires GitHub Actions");
  assert.equal(env.GITHUB_EVENT_NAME, "push", "Only main pushes may prepare or publish releases");
  assert.equal(env.GITHUB_REF, "refs/heads/main");
  assert.equal(env.GITHUB_SERVER_URL, "https://github.com");
  assert(/^[\w.-]+\/[\w.-]+$/.test(env.GITHUB_REPOSITORY ?? ""));
  assert(sha.test(env.GITHUB_SHA ?? "") && sha.test(env.CI_BASE_REF ?? ""), "Missing exact source/base commit");
  assert.equal(env.GITHUB_WORKFLOW_SHA, env.GITHUB_SHA, "Workflow must come from the tested main commit");
  assert.equal(env.GITHUB_WORKFLOW_REF, `${env.GITHUB_REPOSITORY}/.github/workflows/ci.yml@refs/heads/main`);
  for (const field of ["GITHUB_RUN_ID", "GITHUB_RUN_ATTEMPT"])
    assert(/^[1-9]\d*$/.test(env[field] ?? "") && Number.isSafeInteger(Number(env[field])), `Invalid ${field}`);
  return {
    schemaVersion: 1,
    repository: env.GITHUB_REPOSITORY,
    sourceRevision: env.GITHUB_SHA,
    baseRevision: env.CI_BASE_REF,
    runId: Number(env.GITHUB_RUN_ID),
    attempt: Number(env.GITHUB_RUN_ATTEMPT),
    workflow: ".github/workflows/ci.yml",
    workflowRevision: env.GITHUB_WORKFLOW_SHA,
  };
}

export function requireOrigin(origin, context) {
  assert.deepEqual(Object.keys(origin).sort(), Object.keys(context).sort(), "Unexpected CI origin fields");
  assert(Number.isSafeInteger(origin.attempt) && origin.attempt > 0 && origin.attempt <= context.attempt);
  assert.deepEqual(
    { ...origin, attempt: context.attempt },
    context,
    "Artifact belongs to another source or workflow run",
  );
}

/** Verify the closed report envelope using an independent digest and the original main-push producing context. */
function releaseAdmission(root, context, admission, expectedAdmissionSha256) {
  assert(admission && typeof admission === "object" && !Array.isArray(admission), "Missing acceptance admission");
  assert([Object.prototype, null].includes(Object.getPrototypeOf(admission)), "Invalid admission envelope prototype");
  assert.deepEqual(Reflect.ownKeys(admission).sort(), ["record", "sha256"], "Unexpected admission envelope fields");
  for (const field of ["record", "sha256"]) {
    const descriptor = Object.getOwnPropertyDescriptor(admission, field);
    assert(descriptor.enumerable && Object.hasOwn(descriptor, "value"), "Invalid admission envelope property");
  }
  assert(
    typeof expectedAdmissionSha256 === "string" && /^[a-f0-9]{64}$/.test(expectedAdmissionSha256),
    "Missing independent acceptance admission digest",
  );
  assert.equal(admission.sha256, expectedAdmissionSha256, "Admission differs from the independent product digest");
  assert.equal(context.schemaVersion, 1, "Unsupported release context schema");
  assert.equal(context.workflow, ".github/workflows/ci.yml", "Unexpected producing workflow");
  const expectedContext = {
    repository: context.repository,
    eventName: "push",
    ref: "refs/heads/main",
    sourceRevision: context.sourceRevision,
    sourceTree: git(root, ["--no-replace-objects", "rev-parse", `${context.sourceRevision}^{tree}`]).trim(),
    baseRevision: context.baseRevision,
    workflowRevision: context.workflowRevision,
    toolingRevision: context.baseRevision,
    runId: context.runId,
    attempt: context.attempt,
  };
  const resolution = verifyAcceptanceAdmission(root, {
    record: admission.record,
    expectedContext,
    expectedSha256: expectedAdmissionSha256,
  });
  assert(resolution.policySha256 !== null, "Introduced acceptance policy is missing from the source");
  return { baseline: resolution.required, acceptanceAdmission: structuredClone(admission) };
}

/** Check full-history source and required-suite identity before accepting downloaded or locally prepared bytes. */
export function verifyReleaseSource(root, context, { admission, expectedAdmissionSha256 } = {}) {
  assert.equal(git(root, ["rev-parse", "--is-shallow-repository"]).trim(), "false", "Full history is required");
  assert.equal(git(root, ["status", "--porcelain"]).trim(), "", "Release checkout must be clean");
  assert.equal(
    git(root, ["rev-parse", "HEAD"]).trim(),
    context.sourceRevision,
    "Checkout differs from tested main source",
  );
  git(root, ["merge-base", "--is-ancestor", context.baseRevision, context.sourceRevision]);
  const introduced = acceptancePolicyIntroduced(root, context.sourceRevision);
  if (!introduced) assert.equal(admission, undefined, "Legacy source cannot carry acceptance admission evidence");
  const accepted = introduced
    ? releaseAdmission(root, context, admission, expectedAdmissionSha256)
    : { baseline: verifyBaseline(root, context.baseRevision) };
  const { baseline } = accepted;
  assert.equal(
    baseline.publicationStatus,
    "protected-main",
    "Release requires a separately landed protected-main baseline",
  );
  return {
    ...accepted,
    ordinal: Number(git(root, ["rev-list", "--first-parent", "--count", context.sourceRevision]).trim()),
    configuration: configurationFingerprint(
      Object.fromEntries(
        sourceConfigurationPaths.map((path) => [path, git(root, ["show", `${context.sourceRevision}:${path}`], null)]),
      ),
    ),
  };
}

/** Verify immutable bundle bytes against the original admission and an independently supplied product-job digest. */
export async function verifyReleaseBundle(root, directory, context, { expectedAdmissionSha256 } = {}) {
  const path = requireArtifactPath(root, directory);
  assert.deepEqual(readdirSync(path).sort(), preparedAssetNames, "Unexpected or missing prepared release assets");
  for (const name of preparedAssetNames)
    assert(lstatSync(join(path, name)).isFile(), "Release assets must be regular files");
  const origin = JSON.parse(readFileSync(join(path, "ci-origin.json"), "utf8"));
  requireOrigin(origin, context);
  const report = JSON.parse(readFileSync(join(path, "e2e-result.json"), "utf8"));
  const source = verifyReleaseSource(root, origin, { admission: report.acceptanceAdmission, expectedAdmissionSha256 });
  const initial = JSON.parse(readFileSync(join(path, "manifest.json"), "utf8"));
  const manifest = await verifyPreparedDirectory(path, initial.identity);
  assert.equal(manifest.sourceRevision, context.sourceRevision);
  assert.equal(manifest.platform, "linux/amd64", "Release requires the tested Linux AMD64 image pair");
  assert.equal(manifest.preparationRevision, context.sourceRevision, "CI must prepare the exact tested source");
  assert.equal(manifest.ordinal, source.ordinal, "Release ordinal differs from full source history");
  assert.equal(manifest.version, versionForOrdinal(source.ordinal));
  assert.deepEqual(manifest.identity.sourceConfiguration, source.configuration, "Source configuration differs");
  assert.deepEqual(localEvidence(report), manifest.identity.evidence, "Archived E2E evidence differs from preparation");
  const evidence = manifest.identity.evidence;
  assert.equal(evidence.baselinePublication, "protected-main");
  assert.equal(evidence.suiteCommit, source.baseline.suiteCommit);
  assert.equal(evidence.suiteTree, source.baseline.suiteTree);
  assert.equal(evidence.fixtureManifestSha256, source.baseline.manifestSha256);
  assert.equal(evidence.contractRevision, source.baseline.contractRevision);
  const assets = [];
  for (const name of preparedAssetNames)
    assets.push({ name, path: join(path, name), ...(await archiveIdentity(join(path, name))) });
  return {
    manifest,
    origin,
    assets,
    ...(source.acceptanceAdmission ? { acceptanceAdmission: source.acceptanceAdmission } : {}),
  };
}

/** Validate live API evidence for the original producing attempt, including successful jobs reused on a later retry. */
export function requireObservedChecks(bundle, repository, branch, comparison, run, jobs) {
  const { origin } = bundle;
  assert.equal(repository.full_name, origin.repository);
  assert.equal(repository.private, true, "Publication requires the intended private repository");
  assert.equal(repository.default_branch, "main");
  assert.equal(branch.name, "main");
  assert.equal(branch.protected, true, "Main must remain protected");
  assert(sha.test(branch.commit?.sha ?? ""));
  assert(["identical", "ahead"].includes(comparison.status), "Tested source is not an ancestor of protected main");
  assert.equal(run.id, origin.runId);
  assert.equal(run.run_attempt, origin.attempt);
  assert.equal(run.head_sha, origin.sourceRevision);
  assert.equal(run.head_branch, "main");
  assert.equal(run.event, "push");
  assert.equal(run.path, origin.workflow);
  assert.equal(run.repository?.full_name, origin.repository);
  for (const name of publicationChecks) {
    const matches = jobs.filter((job) => job.name === name);
    assert.equal(matches.length, 1, `Missing or ambiguous mandatory job ${name}`);
    assert.equal(matches[0].head_sha, origin.sourceRevision);
    assert.equal(
      matches[0].run_attempt,
      origin.attempt,
      `Mandatory ${name} belongs to another attempt; require all checks in the producing attempt. ` +
        "If no remote version was reserved, rerun all jobs; never replace a reserved version with rebuilt bytes.",
    );
    assert.equal(matches[0].status, "completed");
    assert.equal(matches[0].conclusion, "success", `Mandatory ${name} did not succeed`);
    if (Object.hasOwn(bundle, "acceptanceAdmission") && ["validate-foundation", "validate-product"].includes(name)) {
      assert(Array.isArray(matches[0].steps), `Missing acceptance preflight evidence for ${name}`);
      const preflights = matches[0].steps.filter((step) => step.name === "Validate acceptance admission");
      assert.equal(preflights.length, 1, `Missing or ambiguous acceptance preflight for ${name}`);
      assert.equal(preflights[0].status, "completed", `Acceptance preflight for ${name} did not complete`);
      assert.equal(preflights[0].conclusion, "success", `Acceptance preflight for ${name} did not succeed`);
    }
  }
}

/** Publication is release-only. Preserve prepared-local records and bind their exact bytes in a separate statement. */
export function publicationMaterial(bundle) {
  const { manifest, origin, assets } = bundle;
  const record = {
    schemaVersion: 1,
    status: "release-only-provenance",
    deployed: false,
    deploymentDeferred: true,
    version: manifest.version,
    tag: `v${manifest.version}`,
    sourceRevision: manifest.sourceRevision,
    platform: manifest.platform,
    ci: origin,
    mandatoryChecks: Object.fromEntries(publicationChecks.map((name) => [name, "success"])),
    suiteCommit: manifest.identity.evidence.suiteCommit,
    suiteTree: manifest.identity.evidence.suiteTree,
    fixtureManifestSha256: manifest.identity.evidence.fixtureManifestSha256,
    localAcceptanceConfigurationSha256: manifest.identity.evidence.localAcceptanceConfigurationSha256,
    sourceConfigurationSha256: manifest.identity.sourceConfiguration.sha256,
    images: manifest.artifacts,
    provider: null,
    assets: assets.map(({ name, sha256, bytes }) => ({ name, sha256, bytes })),
  };
  const json = `${JSON.stringify(record, null, 2)}\n`;
  const notes =
    `# ${manifest.version} — release only\n\n` +
    `Not deployed. Deployment and recovery are deferred; this release publishes tested local container artifacts.\n\n` +
    `Source: ${manifest.sourceRevision}\nPlatform: ${manifest.platform}\n` +
    `Acceptance: ${manifest.identity.evidence.acceptance.passed}/${manifest.identity.evidence.acceptance.planned} passed.\n` +
    `Suite: ${record.suiteCommit}\nFixture manifest SHA-256: ${record.fixtureManifestSha256}\n` +
    `Source configuration SHA-256: ${record.sourceConfigurationSha256}\n` +
    `Local acceptance configuration SHA-256: ${record.localAcceptanceConfigurationSha256}\n` +
    `Workflow: https://github.com/${origin.repository}/actions/runs/${origin.runId}/attempts/${origin.attempt}\n` +
    `Publication record SHA-256: ${digest(json)}\n\n` +
    `Verify SHA256SUMS before loading either Docker archive. The preparation manifest retains its historical ` +
    `prepared-local status; publication.json records release-only provenance. No registry image or service was deployed.\n`;
  return { json, notes, binding: digest(canonical(record)) };
}

export function requireReleaseMetadata(release, bundle, notes) {
  assert.equal(release.tag_name, `v${bundle.manifest.version}`, "Release tag differs");
  assert.equal(release.target_commitish, bundle.manifest.sourceRevision, "Release source differs");
  assert.equal(release.name, bundle.manifest.version, "Release name differs");
  assert.equal(release.body, notes, "Existing release notes/provenance differ; refusing overwrite");
  assert.equal(release.prerelease, false);
  assert.equal(typeof release.draft, "boolean");
  assert(Number.isSafeInteger(release.id) && release.id > 0);
}

export function requireMatchingAsset(actual, expected) {
  assert.equal(actual.name, expected.name);
  assert.equal(actual.state, "uploaded", "Partial asset remains; preserve the draft for inspection");
  assert.equal(actual.size, expected.bytes, "Existing asset size differs; refusing overwrite");
  assert.equal(actual.digest, `sha256:${expected.sha256}`, "Existing asset digest differs or is missing");
}

export function canBeLatest(bundle, branch, releases) {
  return (
    branch.commit?.sha === bundle.manifest.sourceRevision &&
    !releases.some(
      (release) =>
        !release.draft &&
        /^v0\.1\.[1-9]\d*$/.test(release.tag_name) &&
        Number(release.tag_name.slice(5)) > bundle.manifest.ordinal,
    )
  );
}

/** Keep release credentials confined to the post-gate main job, with exact same-run artifact handoff and no installs. */
export function requireReleaseWorkflow(workflow) {
  requirePreflightWorkflow(workflow);
  assert.deepEqual(workflow.permissions, { contents: "read" });
  assert.equal(workflow.concurrency.group, "mvp-${{ github.event.pull_request.number || github.run_id }}");
  const product = workflow.jobs["validate-product"];
  const mainOnly = "${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}";
  for (const command of ["node scripts/run-ci-phase.mjs", "node scripts/publish-release-bundle.mjs"]) {
    const consumers = product.steps.filter((step) => step.run === command);
    assert.equal(consumers.length, 1, "Require exactly one acceptance consumer command");
    assert.deepEqual(
      consumers[0].env,
      {
        GATE_ADMISSION_PATH: "${{ steps.acceptance-preflight.outputs.admission-path }}",
        GATE_ADMISSION_SHA256: "${{ steps.acceptance-preflight.outputs.admission-sha256 }}",
      },
      "Consumer admission must come directly from the trusted preflight",
    );
  }
  const bundle = product.steps.find((step) => step.id === "release-bundle");
  assert.equal(bundle?.if, mainOnly);
  assert.equal(bundle.run, "node scripts/publish-release-bundle.mjs");
  assert.deepEqual(product.outputs, {
    "release-ready": "${{ steps.release-bundle.outputs.ready }}",
    "release-artifact": "${{ steps.release-bundle.outputs.artifact-name }}",
    "acceptance-admission-sha256": "${{ steps.acceptance-preflight.outputs.admission-sha256 }}",
  });
  const upload = product.steps.find((step) => step.uses?.startsWith("actions/upload-artifact@"));
  assert.equal(upload?.if, "${{ steps.release-bundle.outputs.ready == 'true' }}");
  assert.deepEqual(upload.with, {
    name: "${{ steps.release-bundle.outputs.artifact-name }}",
    path: "${{ steps.release-bundle.outputs.directory }}",
    "compression-level": 0,
    "if-no-files-found": "error",
    "retention-days": 7,
  });
  const publisher = workflow.jobs["publish-release"];
  assert.deepEqual(publisher.needs, ["control-plane", "validate-product"]);
  assert.equal(
    publisher.if,
    "${{ github.event_name == 'push' && github.ref == 'refs/heads/main' && needs.validate-product.outputs.release-ready == 'true' }}",
  );
  assert.deepEqual(publisher.permissions, { contents: "write", actions: "read" });
  assert.deepEqual(publisher.concurrency, { group: "publish-release-main", "cancel-in-progress": false });
  assert.deepEqual(publisher.env, {
    CI_BASE_REF: "${{ github.event.before }}",
    GATE_ADMISSION_SHA256: "${{ needs.validate-product.outputs.acceptance-admission-sha256 }}",
  });
  assert.equal(publisher.steps.find((step) => step.uses?.startsWith("actions/checkout@"))?.with?.["fetch-depth"], 0);
  const download = publisher.steps.find((step) => step.uses?.startsWith("actions/download-artifact@"));
  assert.deepEqual(download?.with, {
    name: "${{ needs.validate-product.outputs.release-artifact }}",
    path: ".artifacts/release-input",
  });
  assert.deepEqual(
    publisher.steps.filter((step) => step.run).map((step) => step.run),
    ["node scripts/publish-release.mjs"],
  );
  for (const [name, job] of Object.entries(workflow.jobs)) {
    if (["validate-foundation", "validate-product"].includes(name))
      assert.deepEqual(job.permissions, { contents: "read", "pull-requests": "read" });
    else if (name !== "publish-release")
      assert.equal(job.permissions, undefined, "Only publisher may override read-only permissions");
    assert.equal(job.env?.GITHUB_TOKEN, undefined, "Do not expose a job-wide publication token");
    assert.equal(job.env?.GATE_REVIEW_TOKEN, undefined, "Do not expose a job-wide review token");
    for (const step of job.steps) {
      if (step.env?.GATE_REVIEW_TOKEN !== undefined) {
        assert(["validate-foundation", "validate-product"].includes(name), "Unexpected review credential job");
        assert.equal(step.id, "acceptance-preflight", "Only preflight may receive review credentials");
        assert.equal(step.env.GATE_REVIEW_TOKEN, "${{ github.token }}");
      }
      if (step.env?.GITHUB_TOKEN !== undefined) {
        assert.equal(name, "publish-release", "PR validators must not receive publication credentials");
        assert.equal(step.run, "node scripts/publish-release.mjs");
        assert.equal(step.env.GITHUB_TOKEN, "${{ github.token }}");
      }
    }
  }
  assert.equal(publisher.steps.find((step) => step.run)?.env?.GITHUB_TOKEN, "${{ github.token }}");
}
