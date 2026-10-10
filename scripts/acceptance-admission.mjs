/**
 * Create and verify deterministic CI acceptance admission records from exact Git objects and supplied observations.
 *
 * Import createAcceptanceAdmission(root, { context, observedReviews }) to obtain { record, sha256 }. Verify an existing
 * record with verifyAcceptanceAdmission(root, { record, expectedContext, expectedSha256 }); it returns a freshly
 * resolved acceptance decision using the original source/base and observations. Object keys are sorted recursively
 * for the SHA-256 input; array order remains significant. Caller-owned inputs are cloned rather than retained.
 * acceptancePolicyIntroduced(root, sourceRevision) detects historical policy introduction on that exact source's
 * complete first-parent history, including when the registry was subsequently deleted. It never reads working-tree
 * policy; shallow histories cannot establish policy absence and are rejected.
 *
 * This module performs read-only Git queries through the existing baseline/resolver helpers. It has no environment,
 * CLI, file-write, credential or network behavior. Invalid schemas, mismatched contexts/digests, changed source trees
 * and resolver disagreement throw. Context and observations are supplied evidence, not authenticated CI authority:
 * the integration boundary must authenticate the producing workflow/run and the expected original-attempt context.
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { git, resolveAcceptance } from "./acceptance-baseline.mjs";

const commitPattern = /^[a-f0-9]{40}$/;
const digestPattern = /^[a-f0-9]{64}$/;
const contextFields = [
  "repository",
  "eventName",
  "ref",
  "sourceRevision",
  "sourceTree",
  "baseRevision",
  "workflowRevision",
  "toolingRevision",
  "runId",
  "attempt",
];
const recordFields = ["schemaVersion", "kind", "context", "observedReviews", "resolution"];

/** Detect policy history without treating deletion or an older source checkout as permission to change authority. */
export function acceptancePolicyIntroduced(root, sourceRevision) {
  assert(typeof sourceRevision === "string" && commitPattern.test(sourceRevision), "Invalid policy source revision");
  assert.equal(
    git(root, ["--no-replace-objects", "rev-parse", "--is-shallow-repository"]).trim(),
    "false",
    "Acceptance policy detection requires full history",
  );
  assert.equal(
    git(root, ["--no-replace-objects", "cat-file", "-t", sourceRevision]).trim(),
    "commit",
    "Policy source must identify an exact commit",
  );
  return (
    git(root, [
      "--no-replace-objects",
      "rev-list",
      "--first-parent",
      "--full-history",
      "--max-count=1",
      sourceRevision,
      "--",
      "docs/testing/acceptance-transitions.json",
    ]).trim() !== ""
  );
}

/** Validate closed plain records before reading their fields; accessor and hidden properties are not JSON evidence. */
function requireRecord(value, fields, label, optional = []) {
  assert(value && typeof value === "object" && !Array.isArray(value), `Expected ${label} record`);
  assert([Object.prototype, null].includes(Object.getPrototypeOf(value)), `Invalid ${label} prototype`);
  for (const field of Reflect.ownKeys(value)) {
    assert(fields.includes(field), `Unknown ${label} field`);
    const descriptor = Object.getOwnPropertyDescriptor(value, field);
    assert(descriptor.enumerable && Object.hasOwn(descriptor, "value"), `Invalid ${label} property`);
  }
  for (const field of fields) {
    if (!optional.includes(field)) assert(Object.hasOwn(value, field), `Missing ${label} ${field}`);
  }
}

/** Encode JSON data canonically, rejecting cycles and values that JSON would silently omit or transform. */
function canonical(value, ancestors = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    assert(Number.isFinite(value), "Admission JSON numbers must be finite");
    return JSON.stringify(value);
  }
  assert(value && typeof value === "object", "Admission evidence must contain only JSON data");
  assert(!ancestors.has(value), "Admission evidence must not contain cycles");
  ancestors.add(value);
  let encoded;
  if (Array.isArray(value)) {
    assert.equal(Object.getPrototypeOf(value), Array.prototype, "Invalid admission array prototype");
    assert.equal(
      Reflect.ownKeys(value).length,
      value.length + 1,
      "Admission arrays cannot have extra or missing fields",
    );
    const entries = [];
    for (let index = 0; index < value.length; index++) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      assert(descriptor?.enumerable && Object.hasOwn(descriptor, "value"), "Invalid admission array entry");
      entries.push(canonical(descriptor.value, ancestors));
    }
    encoded = `[${entries.join(",")}]`;
  } else {
    const keys = Reflect.ownKeys(value);
    assert(
      keys.every((key) => typeof key === "string"),
      "Admission JSON keys must be strings",
    );
    requireRecord(value, keys, "admission JSON");
    encoded = `{${keys
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key], ancestors)}`)
      .join(",")}}`;
  }
  ancestors.delete(value);
  return encoded;
}

/** Validate before cloning so non-JSON values, accessors and hidden fields cannot disappear during the copy. */
function clone(value) {
  canonical(value);
  return structuredClone(value);
}

/** Require an explicit CI identity without providing event, revision, run or attempt defaults. */
function requireContext(context) {
  requireRecord(context, contextFields, "admission context");
  assert(
    typeof context.repository === "string" &&
      /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(context.repository),
    "Admission repository must be an OWNER/REPO slug",
  );
  if (context.eventName === "push") {
    assert.equal(context.ref, "refs/heads/main", "Push admission requires protected main");
  } else {
    assert.equal(context.eventName, "pull_request", "Unsupported admission event");
    const match = typeof context.ref === "string" && /^refs\/pull\/([1-9]\d*)\/merge$/.exec(context.ref);
    assert(match && Number.isSafeInteger(Number(match[1])), "PR admission requires an exact synthetic merge ref");
  }
  for (const field of ["sourceRevision", "sourceTree", "baseRevision", "workflowRevision", "toolingRevision"]) {
    assert(typeof context[field] === "string" && commitPattern.test(context[field]), `Invalid admission ${field}`);
  }
  assert.equal(context.workflowRevision, context.sourceRevision, "Workflow revision must identify the source");
  assert.equal(
    context.toolingRevision,
    context.baseRevision,
    "Tooling revision must identify the original trusted base",
  );
  for (const field of ["runId", "attempt"]) {
    assert(Number.isSafeInteger(context[field]) && context[field] > 0, `Invalid admission ${field}`);
  }
}

/** Create consistency evidence using committed source bytes and the exact supplied source/base review boundary. */
export function createAcceptanceAdmission(root, options) {
  requireRecord(options, ["context", "observedReviews"], "admission creation options", ["observedReviews"]);
  const context = clone(options.context);
  const observedReviews = clone(options.observedReviews === undefined ? [] : options.observedReviews);
  requireContext(context);
  assert(Array.isArray(observedReviews), "Admission observations must be an array");
  for (const observation of observedReviews) {
    assert.equal(observation?.repository, context.repository, "Admission observation repository differs from context");
  }
  const actualTree = git(root, ["--no-replace-objects", "rev-parse", `${context.sourceRevision}^{tree}`]).trim();
  assert.equal(context.sourceTree, actualTree, "Admission source tree differs from its exact committed source");
  const resolution = resolveAcceptance(root, {
    sourceRevision: context.sourceRevision,
    trustedBase: context.baseRevision,
    observedReviews,
  });
  const record = clone({ schemaVersion: 1, kind: "ci-acceptance-admission", context, observedReviews, resolution });
  return { record, sha256: createHash("sha256").update(canonical(record), "utf8").digest("hex") };
}

/** Verify original-attempt identity, canonical digest and every resolver field without promoting source to base. */
export function verifyAcceptanceAdmission(root, options) {
  requireRecord(options, ["record", "expectedContext", "expectedSha256"], "admission verification options");
  assert(
    typeof options.expectedSha256 === "string" && digestPattern.test(options.expectedSha256),
    "Invalid admission digest",
  );
  const record = clone(options.record);
  const expectedContext = clone(options.expectedContext);
  requireRecord(record, recordFields, "admission");
  assert.equal(record.schemaVersion, 1, "Unsupported admission record schema");
  assert.equal(record.kind, "ci-acceptance-admission", "Only CI acceptance admission records are supported");
  requireContext(expectedContext);
  requireContext(record.context);
  assert.deepEqual(record.context, expectedContext, "Admission context differs from the original producing context");
  assert.equal(
    createHash("sha256").update(canonical(record), "utf8").digest("hex"),
    options.expectedSha256,
    "Admission digest differs from canonical record bytes",
  );
  const fresh = createAcceptanceAdmission(root, { context: record.context, observedReviews: record.observedReviews });
  assert.deepEqual(
    record.resolution,
    fresh.record.resolution,
    "Admission differs from fresh original-source resolution",
  );
  return fresh.record.resolution;
}
