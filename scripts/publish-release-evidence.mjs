/**
 * Validate release-only CI provenance and immutable prepared bundles; expose publication policy to focused tests.
 * Imported by the preparation/publication entry points. Inputs are GitHub context, local Git objects and a prepared
 * artifact directory; no provider or GitHub mutations occur here. Reads and hashes exact files, rejects provisional
 * baselines, changed artifacts, stale ordinals, incomplete jobs and non-main contexts. No deployment approval is implied.
 * After policy introduction, callers must supply the independent product-job admission digest; the report's envelope
 * is verified against that digest, its original producing attempt and a fresh source/base resolver decision. Legacy
 * source histories retain their original schemas and bytes. Publication provenance binds the report as a hashed asset.
 * Release allocation independently replays source policy history; schema-2 records additionally bind the selected
 * line, global ordinal and exact policy bytes. Pure material/comparison helpers never establish source authority.
 */
import assert from "node:assert/strict";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { git, verifyBaseline } from "./acceptance-baseline.mjs";
import { acceptancePolicyIntroduced, verifyAcceptanceAdmission } from "./acceptance-admission.mjs";
import { requirePreflightWorkflow } from "./acceptance-preflight.mjs";
import { readCiVisibilityPolicy } from "./ci-visibility-policy.mjs";
import {
  archiveIdentity,
  canonical,
  compareReleaseVersions,
  configurationFingerprint,
  digest,
  localEvidence,
  preparationIdentity,
  requireArtifactPath,
  requireSameReservation,
  resolveReleaseAllocation,
  sourceConfigurationPaths,
  verifyPreparedDirectory,
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
  const allocation = resolveReleaseAllocation(root, context.sourceRevision);
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
    allocation,
    ordinal: allocation.ordinal,
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
  assert.equal(manifest.ordinal, source.allocation.ordinal, "Release ordinal differs from full source history");
  assert.equal(manifest.version, source.allocation.version, "Release version differs from source allocation");
  assert.equal(manifest.schemaVersion, source.allocation.policy === null ? 1 : 2, "Release schema differs from source");
  assert.deepEqual(
    manifest.identity,
    preparationIdentity(report, source.allocation, source.configuration),
    "Reserved identity differs from independently resolved source allocation",
  );
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
export function requireObservedChecks(bundle, repository, branch, comparison, run, jobs, { root } = {}) {
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
  // Read the original producing source, never moving HEAD or a caller-supplied layout selector. The optional root
  // preserves historical direct API calls; current publisher entry points always forward their explicit Git root.
  const checks =
    root === undefined ? publicationChecks : readCiVisibilityPolicy(root, origin.sourceRevision).observedJobs;
  for (const name of checks) {
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
    if (Object.hasOwn(bundle, "acceptanceAdmission") && name !== "control-plane") {
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
  requireSameReservation(manifest, manifest.identity);
  const record = {
    schemaVersion: manifest.schemaVersion,
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
  if (manifest.schemaVersion === 2) {
    record.ordinal = manifest.ordinal;
    record.releasePolicy = structuredClone(manifest.identity.releasePolicy);
  }
  const json = `${JSON.stringify(record, null, 2)}\n`;
  let notes =
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
  if (manifest.schemaVersion === 2) {
    notes +=
      `\nRelease policy line: ${record.releasePolicy.line}\nGlobal ordinal: ${record.ordinal}\n` +
      `Release policy SHA-256: ${record.releasePolicy.sha256}\n`;
  }
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
  if (branch.commit?.sha !== bundle.manifest.sourceRevision) return false;
  try {
    compareReleaseVersions(bundle.manifest.version, bundle.manifest.version);
    for (const release of releases) {
      if (release.draft === true || release.prerelease === true) continue;
      if (typeof release.tag_name !== "string" || !release.tag_name.startsWith("v")) return false;
      if (compareReleaseVersions(release.tag_name.slice(1), bundle.manifest.version) > 0) return false;
    }
    return true;
  } catch {
    return false; // Unrecognized stable metadata cannot authorize replacing latest.
  }
}

/** Keep release credentials confined to the post-gate main job, with exact same-run artifact handoff and no installs. */
export function requireReleaseWorkflow(workflow) {
  requirePreflightWorkflow(workflow);
  assert.deepEqual(workflow.permissions, { contents: "read" });
  assert.equal(workflow.concurrency.group, "mvp-${{ github.event.pull_request.number || github.run_id }}");
  const hasStage = Object.hasOwn(workflow.jobs, "deploy-stage");
  assert.deepEqual(
    Object.keys(workflow.jobs).sort(),
    [
      "control-plane",
      "deliver-foundation",
      "publish-release",
      "validate-foundation",
      "validate-product",
      ...(hasStage ? ["deploy-stage"] : []),
    ].sort(),
    "Only the established jobs and optional bounded stage job are admitted",
  );
  if (hasStage) {
    // Preserve historical reservations; current checkout policy requires the exact masked configuration variant.
    const configurationSource = workflow.jobs["deploy-stage"].env?.STAGE_DEPLOYMENT_CONFIG;
    assert(
      ["${{ vars.STAGE_DEPLOYMENT_CONFIG }}", "${{ secrets.STAGE_DEPLOYMENT_CONFIG }}"].includes(configurationSource),
      "Stage configuration must use one reviewed exact source without fallback",
    );
    // Exact finite job shape keeps source/artifact verification ahead of OIDC and confines each token to its consumer.
    const authentication = (id, accountOutput) => ({
      id,
      uses: "google-github-actions/auth@7c6bc770dae815cd3e89ee6cdf493a5fab2cc093",
      with: {
        project_id: "${{ steps.verify-stage.outputs.project-id }}",
        workload_identity_provider: "${{ steps.verify-stage.outputs.wif-provider }}",
        service_account: `\${{ steps.verify-stage.outputs.${accountOutput} }}`,
        token_format: "access_token",
        access_token_lifetime: "3600s",
        create_credentials_file: false,
        export_environment_variables: false,
      },
    });
    assert.deepEqual(
      workflow.jobs["deploy-stage"],
      {
        name: "deploy-stage",
        needs: ["publish-release", "validate-product"],
        if: "${{ github.event_name == 'push' && github.ref == 'refs/heads/main' && vars.STAGE_DELIVERY_ENABLED == 'true' && vars.STAGE_DEPLOYMENT_CONFIG != '' && needs.validate-product.outputs.release-ready == 'true' && needs.publish-release.outputs.handoff-ready == 'true' }}",
        "runs-on": "ubuntu-24.04",
        "timeout-minutes": 30,
        permissions: { contents: "read", actions: "read", "id-token": "write" },
        concurrency: { group: "deploy-stage", "cancel-in-progress": false },
        env: {
          CI_BASE_REF: "${{ github.event.before }}",
          GATE_ADMISSION_SHA256: "${{ needs.validate-product.outputs.acceptance-admission-sha256 }}",
          STAGE_DEPLOYMENT_CONFIG: configurationSource,
          GIT_OPTIONAL_LOCKS: "0",
        },
        steps: [
          {
            uses: "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
            with: { ref: "${{ github.sha }}", "fetch-depth": 0, "persist-credentials": false },
          },
          {
            uses: "actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1",
            with: { "node-version-file": ".nvmrc", "package-manager-cache": false },
          },
          {
            uses: "hashicorp/setup-terraform@dfe3c3f87815947d99a8997f908cb6525fc44e9e",
            with: { terraform_version: "1.13.3", terraform_wrapper: false },
          },
          {
            uses: "actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c",
            with: { name: "${{ needs.validate-product.outputs.release-artifact }}", path: ".artifacts/release-input" },
          },
          {
            id: "verify-stage",
            run: "node scripts/stage-delivery.mjs verify",
            env: { GITHUB_TOKEN: "${{ github.token }}" },
          },
          authentication("registry-auth", "registry-writer"),
          {
            run: "node scripts/stage-delivery.mjs push",
            env: { REGISTRY_ACCESS_TOKEN: "${{ steps.registry-auth.outputs.access_token }}" },
          },
          authentication("stage-auth", "stage-deployer"),
          {
            run: "node scripts/stage-delivery.mjs deploy",
            env: { STAGE_ACCESS_TOKEN: "${{ steps.stage-auth.outputs.access_token }}" },
          },
          {
            uses: "actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9",
            if: "${{ always() }}",
            with: {
              name: "stage-${{ github.sha }}-${{ github.run_attempt }}",
              path: ".artifacts/stage",
              "if-no-files-found": "ignore",
              "retention-days": 30,
            },
          },
        ],
      },
      "Stage delivery must preserve the reviewed fixed workflow and credential boundary",
    );
  }
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
    ["node scripts/publish-release.mjs", "node scripts/publisher-handoff.mjs"],
  );
  const handoffIds = ["publish-release", "upload-publisher-handoff", "publisher-handoff-receipt"];
  const handoffSteps = handoffIds.map((id) => {
    const matches = publisher.steps.filter((step) => step.id === id);
    assert.equal(matches.length, 1, "Require one exact publisher handoff step");
    return matches[0];
  });
  const [publication, handoffUpload, receipt] = handoffSteps;
  assert.deepEqual(publication, {
    name: "Publish verified private release without deployment",
    id: "publish-release",
    env: { GITHUB_TOKEN: "${{ github.token }}" },
    run: "node scripts/publish-release.mjs",
  });
  assert.equal(publisher.steps.indexOf(handoffUpload), publisher.steps.indexOf(publication) + 1);
  assert.equal(publisher.steps.indexOf(receipt), publisher.steps.indexOf(handoffUpload) + 1);
  assert.equal(publisher.steps.filter((step) => step.uses?.startsWith("actions/upload-artifact@")).length, 1);
  assert.deepEqual(handoffUpload, {
    name: "Upload verified publisher handoff",
    id: "upload-publisher-handoff",
    if: "${{ steps.publish-release.outputs.handoff-ready == 'true' }}",
    uses: "actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9",
    with: {
      name: "${{ steps.publish-release.outputs.handoff-artifact-name }}",
      path: ".artifacts/publisher-handoff/handoff.json",
      archive: true,
      "compression-level": 0,
      "if-no-files-found": "error",
      overwrite: false,
      "retention-days": 90,
      "include-hidden-files": true,
    },
  });
  assert.deepEqual(receipt, {
    name: "Record verified publisher handoff receipt",
    id: "publisher-handoff-receipt",
    run: "node scripts/publisher-handoff.mjs",
    env: {
      HANDOFF_ARTIFACT_ID: "${{ steps.upload-publisher-handoff.outputs.artifact-id }}",
      HANDOFF_ARTIFACT_SHA256: "${{ steps.upload-publisher-handoff.outputs.artifact-digest }}",
      HANDOFF_SHA256: "${{ steps.publish-release.outputs.handoff-sha256 }}",
    },
  });
  assert.deepEqual(
    publisher.outputs,
    Object.fromEntries(
      ["handoff-ready", "handoff-artifact-id", "handoff-artifact-sha256", "handoff-sha256"].map((key) => [
        key,
        `\${{ steps.publisher-handoff-receipt.outputs.${key} }}`,
      ]),
    ),
  );
  for (const [name, job] of Object.entries(workflow.jobs)) {
    if (["validate-foundation", "validate-product"].includes(name))
      assert.deepEqual(job.permissions, { contents: "read", "pull-requests": "read" });
    else if (!["publish-release", "deploy-stage"].includes(name))
      assert.equal(
        job.permissions,
        undefined,
        "Only the reviewed publisher and stage jobs may override default permissions",
      );
    assert.equal(job.env?.GITHUB_TOKEN, undefined, "Do not expose a job-wide publication token");
    assert.equal(job.env?.GATE_REVIEW_TOKEN, undefined, "Do not expose a job-wide review token");
    for (const step of job.steps) {
      if (handoffIds.includes(step.id)) assert.equal(name, "publish-release", "Handoff steps belong only to publisher");
      if (step.env?.GATE_REVIEW_TOKEN !== undefined) {
        assert(["validate-foundation", "validate-product"].includes(name), "Unexpected review credential job");
        assert.equal(step.id, "acceptance-preflight", "Only preflight may receive review credentials");
        assert.equal(step.env.GATE_REVIEW_TOKEN, "${{ github.token }}");
      }
      if (step.env?.GITHUB_TOKEN !== undefined) {
        assert(
          ["publish-release", "deploy-stage"].includes(name),
          "Only publisher or stage verification may receive GitHub credentials",
        );
        assert.equal(
          step.run,
          name === "deploy-stage" ? "node scripts/stage-delivery.mjs verify" : "node scripts/publish-release.mjs",
        );
        assert.equal(step.env.GITHUB_TOKEN, "${{ github.token }}");
      }
    }
  }
  assert.equal(publisher.steps.find((step) => step.run)?.env?.GITHUB_TOKEN, "${{ github.token }}");
}
