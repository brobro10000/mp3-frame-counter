/**
 * Verify the acceptance identity in a release-preparation report without exporting images or granting CI authority.
 *
 * Import verifyPreparationAcceptance(root, report, env); it returns the required baseline or throws. The report's
 * committed source may precede the preparation checkout. Legacy reports retain the original genesis/tree/manifest
 * checks. Post-policy local reports require a closed localSelection replayed against its original source and base;
 * CI reports require an admission envelope, exact runner context and independent GATE_ADMISSION_SHA256.
 *
 * Only committed Git objects and supplied evidence are read. There is no environment discovery, network, credential,
 * file-write, Git mutation or command-line behavior, and import performs no I/O. Missing history/policy, substituted
 * identities, malformed evidence, unverifiable bindings and CI/local evidence masquerading fail closed. Successful
 * local replay proves consistency only; the preparation caller retains responsibility for clean passed E2E evidence,
 * source ancestry, exact images and artifact export, while trusted CI authenticates the supplied runner context/hash.
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { git, resolveAcceptance } from "./acceptance-baseline.mjs";
import { acceptancePolicyIntroduced, verifyAcceptanceAdmission } from "./acceptance-admission.mjs";
import { detectPhase } from "./phase-policy.mjs";

const revisionPattern = /^[a-f0-9]{40}$/;
const digestPattern = /^[a-f0-9]{64}$/;

/** Keep the evidence envelope closed, including properties that ordinary JSON would hide or execute while reading. */
function requireRecord(value, fields, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `Missing ${label}`);
  assert([Object.prototype, null].includes(Object.getPrototypeOf(value)), `Invalid ${label} prototype`);
  const keys = Reflect.ownKeys(value);
  assert(
    keys.every((key) => typeof key === "string"),
    `Invalid ${label} key`,
  );
  assert.deepEqual(keys.sort(), [...fields].sort(), `Unexpected ${label} fields`);
  for (const field of fields) {
    const descriptor = Object.getOwnPropertyDescriptor(value, field);
    assert(descriptor.enumerable && Object.hasOwn(descriptor, "value"), `Invalid ${label} property`);
  }
}

/** Check the five report identity claims against the required suite, never a pending or merely candidate successor. */
function requireReportIdentity(report, baseline) {
  for (const field of ["suiteCommit", "suiteTree", "manifestSha256", "contractRevision"]) {
    assert.equal(report[field], baseline[field], `Prepared report differs from required acceptance ${field}`);
  }
  assert.equal(
    report.baselinePublication,
    baseline.publicationStatus,
    "Prepared report differs from required baseline publication",
  );
}

/** Preserve pre-policy source-object checks without consulting the current checkout's suite or freeze record. */
function legacyBaseline(root, report) {
  const sourceRevision = report.sourceRevision;
  const baseline = JSON.parse(
    git(root, ["--no-replace-objects", "show", `${sourceRevision}:docs/testing/baseline.json`]),
  );
  assert.equal(baseline.schemaVersion, 1, "Unsupported source baseline schema");
  for (const field of ["suiteCommit", "suiteTree"]) {
    assert(
      typeof baseline[field] === "string" && revisionPattern.test(baseline[field]),
      "Invalid genesis Git identity",
    );
  }
  assert(
    typeof baseline.manifestSha256 === "string" && digestPattern.test(baseline.manifestSha256),
    "Invalid genesis manifest identity",
  );
  assert(
    typeof baseline.contractRevision === "string" && baseline.contractRevision.length > 0,
    "Missing genesis contract",
  );
  requireReportIdentity(report, baseline);
  git(root, ["--no-replace-objects", "merge-base", "--is-ancestor", baseline.suiteCommit, sourceRevision]);
  const paths = git(root, ["--no-replace-objects", "ls-tree", "-r", "--name-only", "-z", baseline.suiteCommit])
    .split("\0")
    .filter(Boolean);
  assert.equal(detectPhase(paths), "acceptance", "Initial baseline must precede product implementation");
  assert.equal(
    git(root, ["--no-replace-objects", "rev-parse", `${baseline.suiteCommit}:tests/acceptance`]).trim(),
    baseline.suiteTree,
    "Genesis suite differs from its recorded tree",
  );
  assert.equal(
    git(root, ["--no-replace-objects", "rev-parse", `${sourceRevision}:tests/acceptance`]).trim(),
    baseline.suiteTree,
    "Tested legacy source changed frozen suite bytes",
  );
  assert.equal(
    createHash("sha256")
      .update(
        git(
          root,
          ["--no-replace-objects", "show", `${baseline.suiteCommit}:tests/acceptance/fixtures/manifest.json`],
          null,
        ),
      )
      .digest("hex"),
    baseline.manifestSha256,
    "Genesis fixture manifest differs from its recorded hash",
  );
  return baseline;
}

/** Require explicit positive decimal runner identities rather than coercing missing, fractional or unsafe values. */
function positiveInteger(value) {
  assert(typeof value === "string" && /^[1-9]\d*$/.test(value), "Invalid CI run identity");
  const number = Number(value);
  assert(Number.isSafeInteger(number), "CI run identity exceeds the supported range");
  return number;
}

/** Bind a CI report to the independent runner identity and digest while replaying its original source/base decision. */
function ciResolution(root, report, env) {
  assert.equal(env.CI, "true", "CI preparation requires CI");
  assert.equal(env.GITHUB_ACTIONS, "true", "CI preparation requires GitHub Actions");
  assert.equal(env.GITHUB_SERVER_URL, "https://github.com", "Unsupported GitHub server");
  assert.equal(env.GITHUB_API_URL, "https://api.github.com", "Unsupported GitHub API");
  assert.equal(env.GITHUB_SHA, report.sourceRevision, "CI source differs from the original tested source");
  assert.equal(env.GITHUB_WORKFLOW_SHA, report.sourceRevision, "CI workflow differs from the original tested source");
  assert.equal(
    env.GITHUB_WORKFLOW_REF,
    `${env.GITHUB_REPOSITORY}/.github/workflows/ci.yml@${env.GITHUB_REF}`,
    "Unexpected CI workflow identity",
  );
  assert(typeof env.CI_BASE_REF === "string" && revisionPattern.test(env.CI_BASE_REF), "Missing exact CI base");
  assert(
    typeof env.GATE_ADMISSION_SHA256 === "string" && digestPattern.test(env.GATE_ADMISSION_SHA256),
    "Missing independent CI admission digest",
  );
  assert.equal(report.localSelection, undefined, "CI preparation cannot consume local selection evidence");
  const admission = report.acceptanceAdmission;
  requireRecord(admission, ["record", "sha256"], "CI admission envelope");
  assert.equal(admission.sha256, env.GATE_ADMISSION_SHA256, "CI admission differs from independent runner digest");
  const expectedContext = {
    repository: env.GITHUB_REPOSITORY,
    eventName: env.GITHUB_EVENT_NAME,
    ref: env.GITHUB_REF,
    sourceRevision: report.sourceRevision,
    sourceTree: git(root, ["--no-replace-objects", "rev-parse", `${report.sourceRevision}^{tree}`]).trim(),
    baseRevision: env.CI_BASE_REF,
    workflowRevision: env.GITHUB_WORKFLOW_SHA,
    toolingRevision: env.CI_BASE_REF,
    runId: positiveInteger(env.GITHUB_RUN_ID),
    attempt: positiveInteger(env.GITHUB_RUN_ATTEMPT),
  };
  return verifyAcceptanceAdmission(root, {
    record: admission.record,
    expectedContext,
    expectedSha256: env.GATE_ADMISSION_SHA256,
  });
}

/** Replay a local report's exact selection; callers cannot inject observations or substitute a newer trusted base. */
function localResolution(root, report, env) {
  assert(env.CI === undefined || env.CI === "false", "Unsupported local CI indicator");
  assert.equal(env.GATE_ADMISSION_PATH, undefined, "Local preparation cannot consume CI admission records");
  assert.equal(env.GATE_ADMISSION_SHA256, undefined, "Local preparation cannot consume CI admission digests");
  assert.equal(report.acceptanceAdmission, undefined, "Local preparation cannot claim CI admission");
  const selection = report.localSelection;
  requireRecord(selection, ["kind", "sourceRevision", "baseRevision", "resolution"], "local acceptance selection");
  assert.equal(selection.kind, "local-acceptance-resolution", "Unexpected local acceptance selection kind");
  assert.equal(selection.sourceRevision, report.sourceRevision, "Local selection differs from tested source");
  const resolution = resolveAcceptance(root, {
    sourceRevision: selection.sourceRevision,
    trustedBase: selection.baseRevision,
  });
  assert.deepEqual(selection.resolution, resolution, "Local selection differs from original source/base resolution");
  return resolution;
}

/** Return required acceptance for the original report; current preparation HEAD never selects the report's authority. */
export function verifyPreparationAcceptance(root, report, env) {
  assert(report && typeof report === "object" && !Array.isArray(report), "Expected preparation report");
  assert(env && typeof env === "object" && !Array.isArray(env), "Expected explicit preparation environment");
  const introduced = acceptancePolicyIntroduced(root, report.sourceRevision);
  if (!introduced) {
    assert.equal(report.localSelection, undefined, "Legacy preparation cannot claim local selection evidence");
    assert.equal(report.acceptanceAdmission, undefined, "Legacy preparation cannot claim CI admission");
    return legacyBaseline(root, report);
  }
  const resolution =
    env.CI === "true" || env.GITHUB_ACTIONS !== undefined
      ? ciResolution(root, report, env)
      : localResolution(root, report, env);
  assert(resolution.policySha256 !== null, "Introduced acceptance policy is missing from the tested source");
  requireReportIdentity(report, resolution.required);
  return resolution.required;
}
