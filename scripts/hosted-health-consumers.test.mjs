/**
 * Independent governance expectations for the bounded health and reasonless-console successors at delivery consumers.
 * Run pinned Node: node --test scripts/hosted-health-consumers.test.mjs. Actual private consumer functions/selection
 * blocks are evaluated with fixed synthetic admission and source-reader boundaries; no entry point is imported.
 * Existing literal finalization fixture builders and real pure declaration/evidence validators calibrate 72/22/3.
 * No Git, package install, browser, child, network, cloud, credential or release operation runs. Failures distinguish
 * selection/envelope/finalization decisions from hosted acceptance, which remains a separate real execution obligation.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { validateAcceptanceProfiles } from "./acceptance-profiles.mjs";
import { validateHostedAcceptance } from "./hosted-evidence.mjs";

const oldRevision = "hosted-v1";
const nextRevision = "hosted-health-v1";
const reasonlessRevision = "hosted-reasonless-v1";
const approvedRevisions = [oldRevision, nextRevision, reasonlessRevision];
const source = "a".repeat(40);
const suiteCommit = "b".repeat(40);
const suiteTree = "c".repeat(40);
const manifestHash = "d".repeat(64);
const registryDigests = { api: `sha256:${"4".repeat(64)}`, frontend: `sha256:${"5".repeat(64)}` };
const clone = (value) => structuredClone(value);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const text = (name) => readFileSync(new URL(name, import.meta.url), "utf8");

/** Extract an existing private boundary without importing its executable entry point or substituting guard logic. */
function slice(value, begin, end) {
  const first = value.indexOf(begin);
  assert(first >= 0, `Missing source boundary: ${begin}`);
  const last = value.indexOf(end, first + begin.length);
  assert(last > first, `Missing source boundary end: ${end}`);
  return value.slice(first, last);
}

const controllerSource = text("./stage-delivery.mjs");
const launcherSource = text("./stage-acceptance.mjs");
const publisherSource = text("./publish-release.mjs");
const productionSource = text("./production-acceptance.mjs");
const historicalFixtureSource = text("./publish-release-finalization.test.mjs");
const fixtureBuilderSource =
  slice(historicalFixtureSource, "function declarations()", "function fixture(t)") +
  slice(historicalFixtureSource, "function evidence(f)", "/** Separate old/new releases");

/** Reuse historical literal test expectations, replacing only their selected revision value; no consumer output oracle. */
function fixture(contractRevision = oldRevision) {
  const builders = new Function(
    "clone",
    "hash",
    "json",
    "validateAcceptanceProfiles",
    "source",
    "suiteCommit",
    "suiteTree",
    "manifestHash",
    "registryDigests",
    "contractRevision",
    `${fixtureBuilderSource.replaceAll('"hosted-v1"', "contractRevision")}\nreturn { projection, hosted, evidence };`,
  )(
    clone,
    hash,
    json,
    validateAcceptanceProfiles,
    source,
    suiteCommit,
    suiteTree,
    manifestHash,
    registryDigests,
    contractRevision,
  );
  const bundle = {
    origin: { sourceRevision: source, workflowRevision: source, runId: 7001 },
    manifest: {
      sourceRevision: source,
      reservationSha256: "2".repeat(64),
      identity: {
        evidence: {
          contractRevision,
          baselinePublication: "protected-main",
          suiteCommit,
          suiteTree,
          fixtureManifestSha256: manifestHash,
          acceptance: { status: "passed", planned: 72, passed: 72, failed: 0, skipped: 0 },
        },
      },
      artifacts: {
        api: { localImageId: `sha256:${"2".repeat(64)}`, archiveSha256: "3".repeat(64) },
        frontend: { localImageId: `sha256:${"3".repeat(64)}`, archiveSha256: "4".repeat(64) },
      },
    },
  };
  const projection = builders.projection();
  const publicationSha256 = "5".repeat(64);
  const f = {
    bundle,
    projection,
    stage: builders.hosted("stage", bundle, projection, publicationSha256),
    production: builders.hosted("production", bundle, projection, publicationSha256),
  };
  return { ...f, input: builders.evidence(f), publicationSha256 };
}

/** Run the actual controller input boundary with counted, inert source/admission readers and finite synthetic CI inputs. */
async function controllerSelection(requiredRevision, projection, pendingRevision) {
  const resolution = {
    required: { contractRevision: requiredRevision },
    ...(pendingRevision ? { pendingBinding: { contractRevision: pendingRevision } } : {}),
  };
  const bundle = {
    origin: { sourceRevision: source, baseRevision: "e".repeat(40) },
    acceptanceAdmission: { record: { resolution }, sha256: "6".repeat(64) },
    manifest: { reservationSha256: "2".repeat(64) },
  };
  const calls = { verified: 0, projection: 0, material: 0 };
  const process = {
    cwd: () => "/synthetic-root",
    env: {
      GIT_OPTIONAL_LOCKS: "0",
      GITHUB_API_URL: "https://api.github.com",
      GITHUB_JOB: "deploy-stage",
      STAGE_DEPLOYMENT_CONFIG: "{}",
      GATE_ADMISSION_SHA256: "6".repeat(64),
    },
  };
  const factory = new Function(
    "assert",
    "realpathSync",
    "process",
    "root",
    "publicationContext",
    "parseStageConfig",
    "verifyReleaseBundle",
    "bundleDirectory",
    "readRequiredAcceptanceProfileProjection",
    "publicationMaterial",
    "sha256",
    "canonical",
    "file",
    "join",
    `${slice(controllerSource, "async function inputs()", "/** Authenticate original checks")}\nreturn inputs;`,
  );
  const run = factory(
    assert,
    (x) => x,
    process,
    "/synthetic-root",
    () => ({ sourceRevision: source }),
    (x) => x,
    async (_root, _directory, _context, options) => {
      calls.verified++;
      assert.equal(options.expectedAdmissionSha256, "6".repeat(64));
      return bundle;
    },
    "/synthetic-root/.artifacts/release-input",
    (_root, options) => {
      calls.projection++;
      assert.equal(options.selection.baseline, resolution.required);
      assert.equal(options.selection.resolution, resolution);
      return projection;
    },
    () => {
      calls.material++;
      return { json: "synthetic publication" };
    },
    hash,
    JSON.stringify,
    () => Buffer.from("synthetic manifest"),
    join,
  );
  let value, error;
  try {
    value = await run();
  } catch (caught) {
    error = caught;
  }
  return { value, error, calls };
}

/** Execute the unchanged launcher authority block up to extraction; downstream installation/authentication is absent. */
function launcherSelection(requiredRevision, projection, pendingRevision, consumerSource = launcherSource) {
  const resolution = {
    required: { contractRevision: requiredRevision },
    ...(pendingRevision ? { pendingBinding: { contractRevision: pendingRevision } } : {}),
  };
  const calls = { admission: 0, projection: 0 };
  const context = {
    repository: "synthetic/repository",
    sourceRevision: source,
    baseRevision: "e".repeat(40),
    workflowRevision: source,
    runId: 7001,
    attempt: 1,
  };
  const factory = new Function(
    "assert",
    "verifyAcceptanceAdmission",
    "readRequiredAcceptanceProfileProjection",
    "root",
    "admission",
    "admissionSha256",
    "context",
    "git",
    "env",
    `${slice(
      consumerSource,
      "    const resolution = verifyAcceptanceAdmission(",
      consumerSource === productionSource
        ? "    assert.equal(baseline.contractRevision"
        : "    assert.equal(bundle.manifest.sourceRevision",
    )}\nreturn { baseline, projection };`,
  );
  let value, error;
  try {
    value = factory(
      assert,
      (_root, options) => {
        calls.admission++;
        assert.equal(options.expectedSha256, "6".repeat(64));
        assert.equal(options.expectedContext.sourceRevision, source);
        return resolution;
      },
      (_root, options) => {
        calls.projection++;
        assert.equal(options.selection.baseline, resolution.required);
        return projection;
      },
      "/synthetic-root",
      { record: {} },
      "6".repeat(64),
      context,
      () => Buffer.from(`${"7".repeat(40)}\n`),
      {},
    );
  } catch (caught) {
    error = caught;
  }
  return { value, error, calls };
}

const envelope = new Function(
  "validateHostedAcceptance",
  `${slice(launcherSource, "function envelope(", "/** Run the single adopted stage profile;")}\nreturn envelope;`,
)(validateHostedAcceptance);
const finalization = new Function(
  "assert",
  "validateAcceptanceProfiles",
  "validateHostedAcceptance",
  "observedId",
  `${slice(publisherSource, "function finalizationFields(", "/**\n * Add fixed same-source v1.0.0")}\nreturn requireFinalizationEvidence;`,
)(assert, validateAcceptanceProfiles, validateHostedAcceptance, (n) => assert(Number.isSafeInteger(n) && n > 0));

/** Evaluate actual pure origin/authority boundaries without importing the runner or introducing any callback effects. */
const requireOriginalOrigin = new Function(
  "assert",
  `${slice(text("./publish-release-evidence.mjs"), "export function requireOrigin(", "/** Verify the closed report envelope").replace("export function", "function")}\nreturn requireOrigin;`,
)(assert);
const productionAuthority = new Function(
  "assert",
  "validateHostedAcceptance",
  "requireOrigin",
  `${slice(productionSource, "function fields(", "/** Refuse symlink ancestry")}\nreturn authority;`,
)(assert, validateHostedAcceptance, requireOriginalOrigin);

/** Supply literal original CI, complete stage custody and owner-operation claims; these never prove a human event. */
function productionAuthorityInput(f) {
  const bundle = clone(f.bundle);
  bundle.origin = {
    schemaVersion: 1,
    repository: "synthetic/private-mp3",
    sourceRevision: source,
    baseRevision: "e".repeat(40),
    runId: 7001,
    attempt: 1,
    workflow: ".github/workflows/ci.yml",
    workflowRevision: source,
  };
  const admissionSha256 = "d".repeat(64);
  bundle.acceptanceAdmission = { sha256: admissionSha256 };
  const { id, attempt, sourceRevision } = f.input.operation;
  return {
    bundle,
    admissionSha256,
    currentContext: clone(bundle.origin),
    images: clone(f.stage.expected.images),
    release: clone(f.stage.expected.release),
    stage: clone(f.stage),
    approval: clone(f.input.approval),
    operation: { id, attempt, sourceRevision },
    productionStartedAt: f.input.productionStartedAt,
  };
}

/** Check real schema calibration before each consumer decision so unrelated fixture defects cannot create false red. */
function calibrated(contractRevision) {
  const f = fixture(contractRevision);
  const profiles = validateAcceptanceProfiles(f.projection.declarationInput);
  assert.deepEqual(
    ["local", "stage", "production"].map((p) => profiles.profiles[p].inventory.cases.length),
    [72, 22, 3],
  );
  assert.equal(validateHostedAcceptance(f.input.stage).tests.length, 22);
  assert.equal(validateHostedAcceptance(f.input.production).tests.length, 3);
  return f;
}

test("historical and successor literal fixtures preserve the 72/22/3 declaration and report matrix", () => {
  for (const revision of [...approvedRevisions, "unapproved-hosted-v9"]) calibrated(revision);
});

for (const revision of approvedRevisions) {
  test(`stage controller accepts only required ${revision} selection`, async () => {
    const { projection } = calibrated(revision);
    const result = await controllerSelection(revision, projection);
    assert.ifError(result.error);
    assert.equal(result.value.bundle.acceptanceAdmission.record.resolution.required.contractRevision, revision);
    assert.deepEqual(result.calls, { verified: 1, projection: 1, material: 1 });
  });
  test(`stage launcher permits required ${revision} before isolated extraction`, () => {
    const { projection } = calibrated(revision);
    const result = launcherSelection(revision, projection);
    assert.ifError(result.error);
    assert.equal(result.value.baseline.contractRevision, revision);
    assert.deepEqual(result.calls, { admission: 1, projection: 1 });
  });
  test(`stage envelope retains exact ${revision} and unchanged original result bytes`, () => {
    const { stage } = calibrated(revision);
    const before = json(stage);
    const record = envelope(
      stage.expected,
      stage.observations,
      stage.suiteResult,
      stage.launchId,
      "completed",
      "passed",
      "passed",
    );
    assert.deepEqual(record, stage.record);
    assert.equal(json(stage), before);
    const wrong = clone(stage.expected);
    wrong.declarationInput.selectedContractRevision = revision === oldRevision ? nextRevision : oldRevision;
    assert.throws(() =>
      envelope(wrong, stage.observations, stage.suiteResult, stage.launchId, "completed", "passed", "passed"),
    );
  });
  test(`V1 finalization preserves exact ${revision} report identities without changing caller bytes`, () => {
    const f = calibrated(revision),
      before = json({ bundle: f.bundle, input: f.input });
    assert.deepEqual(finalization(f.bundle, f.input, f.publicationSha256), {
      stage: f.input.stage.record,
      production: f.input.production.record,
    });
    assert.equal(json({ bundle: f.bundle, input: f.input }), before);
  });
  test(`production launcher permits required ${revision} before isolated extraction`, () => {
    const { projection } = calibrated(revision);
    const result = launcherSelection(revision, projection, undefined, productionSource);
    assert.ifError(result.error);
    assert.equal(result.value.baseline.contractRevision, revision);
    assert.deepEqual(result.calls, { admission: 1, projection: 1 });
  });
  test(`production authority retains complete ${revision} source-bound stage custody before effects`, () => {
    const input = productionAuthorityInput(calibrated(revision));
    const before = json(input);
    assert.deepEqual(productionAuthority(input), validateHostedAcceptance(input.stage));
    assert.equal(json(input), before);
  });
}

test("controller refuses pending, unbound, unknown and mismatched required projection before publication material", async () => {
  const old = calibrated(oldRevision).projection,
    successor = calibrated(nextRevision).projection;
  const unknown = calibrated("unapproved-hosted-v9").projection;
  for (const [required, projection, pending] of [
    ["docs-v1", null, nextRevision],
    ["docs-v1", successor, nextRevision],
    [nextRevision, null, nextRevision],
    ["unapproved-hosted-v9", unknown],
    [oldRevision, successor],
    [nextRevision, old],
    [reasonlessRevision, null, reasonlessRevision],
    [reasonlessRevision, successor],
    [nextRevision, calibrated(reasonlessRevision).projection, reasonlessRevision],
  ]) {
    const result = await controllerSelection(required, projection, pending);
    assert(result.error, `Controller accepted ${required} with ${projection?.required.contractRevision ?? "null"}`);
    assert.equal(result.calls.material, 0);
  }
  assert.ifError((await controllerSelection(oldRevision, old, nextRevision)).error);
});

test("launcher refuses pending, unbound, unknown and mismatched required projection before extraction", () => {
  const old = calibrated(oldRevision).projection,
    successor = calibrated(nextRevision).projection;
  const unknown = calibrated("unapproved-hosted-v9").projection;
  for (const [required, projection, pending] of [
    ["docs-v1", null, nextRevision],
    ["docs-v1", successor, nextRevision],
    [nextRevision, null, nextRevision],
    ["unapproved-hosted-v9", unknown],
    [oldRevision, successor],
    [nextRevision, old],
    [reasonlessRevision, null, reasonlessRevision],
    [reasonlessRevision, successor],
    [nextRevision, calibrated(reasonlessRevision).projection, reasonlessRevision],
  ])
    assert(
      launcherSelection(required, projection, pending).error,
      `Launcher accepted ${required} with ${projection?.required.contractRevision ?? "null"}`,
    );
  assert.ifError(launcherSelection(oldRevision, old, nextRevision).error);
});

test("finalizer rejects unknown revisions, declaration/manifest mismatch and a non-required baseline", () => {
  for (const revision of [...approvedRevisions, "unapproved-hosted-v9"]) {
    const f = calibrated(revision);
    if (revision === "unapproved-hosted-v9") assert.throws(() => finalization(f.bundle, f.input, f.publicationSha256));
    else {
      for (const bad of [
        ...approvedRevisions.filter((entry) => entry !== revision),
        "docs-v1",
        "unapproved-hosted-v9",
      ]) {
        const bundle = clone(f.bundle);
        bundle.manifest.identity.evidence.contractRevision = bad;
        assert.throws(() => finalization(bundle, f.input, f.publicationSha256));
      }
      const bundle = clone(f.bundle);
      bundle.manifest.identity.evidence.baselinePublication = "candidate";
      assert.throws(() => finalization(bundle, f.input, f.publicationSha256));
      for (const profile of ["stage", "production"]) {
        const input = clone(f.input);
        input[profile].record.contractRevision = revision === oldRevision ? nextRevision : oldRevision;
        assert.throws(() => finalization(f.bundle, input, f.publicationSha256));
      }
    }
  }
});

test("production selection refuses pending-only, unknown and revision-mismatched projections", () => {
  const current = calibrated(nextRevision).projection;
  const future = calibrated(reasonlessRevision).projection;
  const unknown = calibrated("unapproved-hosted-v9").projection;
  for (const [required, projection, pending] of [
    ["docs-v1", future, reasonlessRevision],
    [reasonlessRevision, null, reasonlessRevision],
    [reasonlessRevision, current],
    [nextRevision, future, reasonlessRevision],
    ["unapproved-hosted-v9", unknown],
  ])
    assert(launcherSelection(required, projection, pending, productionSource).error);
  assert.ifError(launcherSelection(nextRevision, current, reasonlessRevision, productionSource).error);
});

test("production authority rejects unknown, stale, mixed and incomplete original stage custody", () => {
  const unknown = productionAuthorityInput(calibrated("unapproved-hosted-v9"));
  assert.throws(() => productionAuthority(unknown));
  const controls = [
    (input) => {
      input.stage = clone(calibrated(nextRevision).stage);
    },
    (input) => {
      const stale = "0".repeat(40);
      input.stage.record.sourceRevision =
        input.stage.expected.sourceRevision =
        input.stage.suiteResult.sourceRevision =
          stale;
      assert.equal(validateHostedAcceptance(input.stage).sourceRevision, stale);
    },
    (input) => {
      input.stage.record.run.workflowRevision = input.stage.expected.run.workflowRevision = "0".repeat(40);
      assert.equal(validateHostedAcceptance(input.stage).run.workflowRevision, "0".repeat(40));
    },
    (input) => {
      input.bundle.manifest.identity.evidence.baselinePublication = "candidate";
    },
    (input) => {
      input.stage.record.tests.pop();
    },
    (input) => {
      input.stage.parentCleanup = "failed";
    },
    (input) => {
      input.currentContext.sourceRevision = "0".repeat(40);
    },
  ];
  for (const change of controls) {
    const input = productionAuthorityInput(calibrated(reasonlessRevision));
    change(input);
    assert.throws(() => productionAuthority(input));
  }
});
