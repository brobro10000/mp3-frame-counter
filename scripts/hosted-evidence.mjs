/**
 * Check parsed hosted suite results and acceptance envelopes against independently supplied expected evidence.
 *
 * Import validateHostedSuiteResult({ result, expected, launchId }) or validateHostedAcceptance({ record, suiteResult,
 * expected, launchId, wrapperOutcome, observations, parentCleanup }). These synchronous functions return fresh deeply
 * frozen copies of valid records, including valid failed/blocked records. They never select a suite or grant authority.
 *
 * Import and calls perform no I/O, inspect no environment or current clock, and never mutate caller data. Every invalid
 * shape, identity or consistency check throws the same sanitized ERR_HOSTED_EVIDENCE TypeError. Callers separately own
 * byte decoding, immutable source/release authenticity, output custody, provider observation and human authorization.
 */
import { isDeepStrictEqual } from "node:util";
import { validateAcceptanceProfiles } from "./acceptance-profiles.mjs";

const profiles = ["stage", "production"];
const statuses = ["passed", "failed", "blocked"];
const cleanups = ["passed", "not-run", "failed"];
const suiteFields = ["commit", "tree", "fixtureManifestSha256", "profilesSha256", "inventorySha256"];
const expectedFields = [
  "profile",
  "sourceRevision",
  "suite",
  "release",
  "images",
  "configurationSha256",
  "target",
  "run",
  "declarationInput",
];
const resultFields = [
  "schemaVersion",
  "kind",
  "profile",
  "launchId",
  "sourceRevision",
  "suite",
  "inventory",
  "tests",
  "status",
  "cleanup",
];
const envelopeFields = [
  "schemaVersion",
  "kind",
  "profile",
  "status",
  "sourceRevision",
  "contractRevision",
  "suite",
  "release",
  "images",
  "configurationSha256",
  "run",
  "target",
  "inventory",
  "tests",
  "cleanup",
];

/** Throw a fixed failure without caller values, nested exceptions, native diagnostics or partial evidence. */
function invalid() {
  throw Object.assign(new TypeError("Invalid hosted evidence"), { code: "ERR_HOSTED_EVIDENCE" });
}

/** Require every named own field and no additional fields on a parsed JSON record; return no mutable projection. */
function record(value, fields) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length !== fields.length ||
    !fields.every((field) => Object.hasOwn(value, field))
  )
    invalid();
}

/** Check exact JSON-data equality, including array order and nested keys, without normalizing either input. */
function equal(actual, expected) {
  if (!isDeepStrictEqual(actual, expected)) invalid();
}

/** Require one literal enumeration member; no string coercion or fallback status is permitted. */
function member(value, allowed) {
  if (!allowed.includes(value)) invalid();
}

/** Reject strings outside a fixed grammar, including trailing line terminators that JavaScript's $ can tolerate. */
function text(value, pattern) {
  if (typeof value !== "string" || value.trim() !== value || !pattern.test(value)) invalid();
}

/** Validate lowercase Git/blob hashes or prefixed image identities without treating their representations as equal. */
function digest(value, kind = "sha256") {
  const patterns = {
    git: /^[a-f0-9]{40}$/u,
    sha256: /^[a-f0-9]{64}$/u,
    image: /^sha256:[a-f0-9]{64}$/u,
  };
  text(value, patterns[kind]);
}

/** Require a safe JSON integer in the caller-specified nonnegative or positive range. */
function integer(value, minimum) {
  if (!Number.isSafeInteger(value) || value < minimum) invalid();
}

/** Validate only the adopted nonsecret identifier grammar; this does not authenticate an observed resource. */
function safeId(value) {
  text(value, /^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,255}$/u);
}

/** Require a canonical HTTPS origin, without credentials, normalization, extra path, query or fragment. */
function origin(value) {
  if (typeof value !== "string") invalid();
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" || value !== parsed.origin) invalid();
}

/** Validate an explicit UTC calendar instant by round-trip only; never read the current time or infer freshness. */
function instant(value) {
  text(value, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u);
  if (new Date(value).toISOString() !== value) invalid();
}

/** Validate the closed expected target independently from observations; null handling belongs to custody validation. */
function target(value) {
  record(value, ["origin", "resourceId", "revisionId"]);
  origin(value.origin);
  safeId(value.resourceId);
  safeId(value.revisionId);
}

/** Validate all expected identity fields and reuse declaration semantics; return the fresh validated declaration copy. */
function expectedData(value) {
  record(value, expectedFields);
  member(value.profile, profiles);
  digest(value.sourceRevision, "git");
  record(value.suite, suiteFields);
  for (const field of suiteFields)
    digest(value.suite[field], field === "commit" || field === "tree" ? "git" : "sha256");
  record(value.release, ["reservationSha256", "publicationSha256"]);
  digest(value.release.reservationSha256);
  digest(value.release.publicationSha256);
  record(value.images, ["api", "frontend"]);
  for (const role of ["api", "frontend"]) {
    const image = value.images[role];
    record(image, ["localImageId", "archiveSha256", "registryDigest"]);
    digest(image.localImageId, "image");
    digest(image.archiveSha256);
    digest(image.registryDigest, "image");
  }
  digest(value.configurationSha256);
  if (value.target !== null) target(value.target);
  record(value.run, ["id", "attempt", "workflowRevision"]);
  safeId(value.run.id);
  integer(value.run.attempt, 1);
  digest(value.run.workflowRevision, "git");
  const declarations = validateAcceptanceProfiles(value.declarationInput);
  if (declarations.mode !== "profiles-v1") invalid();
  return declarations;
}

/** Encode exact case strings unambiguously; membership in validated declarations supplies their existing grammar. */
function tuple(value) {
  return JSON.stringify([value.file, value.title]);
}

/** Require a complete unique inventory set and valid known execution rows, retaining their original supplied order. */
function evidenceRows(value, completeInventory) {
  if (!Array.isArray(value.inventory) || !Array.isArray(value.tests)) invalid();
  const known = new Set(completeInventory.map(tuple));
  const inventory = new Set();
  for (const entry of value.inventory) {
    record(entry, ["file", "title"]);
    const identity = tuple(entry);
    if (!known.has(identity) || inventory.has(identity)) invalid();
    inventory.add(identity);
  }
  if (inventory.size !== known.size) invalid();
  const executions = new Set();
  for (const row of value.tests) {
    record(row, ["file", "title", "status", "expectedStatus", "retry", "retries"]);
    const identity = tuple(row);
    if (!known.has(identity) || executions.has(identity)) invalid();
    executions.add(identity);
    member(row.status, ["passed", "failed", "skipped", "timedOut", "interrupted"]);
    member(row.expectedStatus, ["passed", "failed", "skipped"]);
    integer(row.retry, 0);
    integer(row.retries, 0);
    if (
      value.status === "passed" &&
      (row.status !== "passed" || row.expectedStatus !== "passed" || row.retry !== 0 || row.retries !== 0)
    )
      invalid();
  }
  member(value.status, statuses);
  member(value.cleanup, cleanups);
  if (value.status === "passed" && (executions.size !== known.size || value.cleanup !== "passed")) invalid();
  if (value.status === "blocked" && executions.size !== 0) invalid();
}

/** Validate a nullable provider observation's closed syntax; nonpassing drift is evidence rather than a parse failure. */
function observation(value) {
  if (value === null) return;
  record(value, [
    "environment",
    "origin",
    "resourceId",
    "revisionId",
    "observedAt",
    "configurationSha256",
    "registryDigests",
  ]);
  member(value.environment, profiles);
  origin(value.origin);
  safeId(value.resourceId);
  safeId(value.revisionId);
  instant(value.observedAt);
  digest(value.configurationSha256);
  record(value.registryDigests, ["api", "frontend"]);
  digest(value.registryDigests.api, "image");
  digest(value.registryDigests.frontend, "image");
}

/** Require each passing observation to match the expected environment, destination, configuration and registry pair. */
function passingObservation(value, expected) {
  if (value === null) invalid();
  equal(value.environment, expected.profile);
  equal(value.configurationSha256, expected.configurationSha256);
  for (const field of ["origin", "resourceId", "revisionId"]) equal(value[field], expected.target[field]);
  for (const role of ["api", "frontend"]) equal(value.registryDigests[role], expected.images[role].registryDigest);
}

/** Enforce the result/wrapper status matrix and exact cleanup lattice without promoting missing or failed evidence. */
function custody(input) {
  const { record: value, suiteResult, wrapperOutcome, parentCleanup, expected } = input;
  member(wrapperOutcome, ["not-run", "completed", "failed"]);
  member(parentCleanup, cleanups);
  if (expected.target === null && (suiteResult !== null || wrapperOutcome !== "not-run" || value.status === "passed"))
    invalid();
  if (suiteResult === null) {
    if (wrapperOutcome === "completed" || value.status === "passed" || value.tests.length !== 0) invalid();
  } else {
    if (wrapperOutcome === "not-run") invalid();
    const allowed = {
      passed: ["passed", "failed"],
      failed: ["failed"],
      blocked: ["blocked", "failed"],
    };
    member(value.status, allowed[suiteResult.status]);
  }
  if (wrapperOutcome === "failed" && value.status !== "failed") invalid();
  if (parentCleanup !== "passed" && value.status === "passed") invalid();
  const childCleanup =
    suiteResult === null ? (wrapperOutcome === "not-run" ? "not-run" : "failed") : suiteResult.cleanup;
  equal(value.cleanup, cleanups[Math.max(cleanups.indexOf(childCleanup), cleanups.indexOf(parentCleanup))]);
}

/** Recursively copy and freeze validated JSON data; caller objects and previous returned objects are never reused. */
function frozenCopy(value) {
  if (value === null || typeof value !== "object") return value;
  const copy = Array.isArray(value)
    ? value.map(frozenCopy)
    : Object.fromEntries(Object.entries(value).map(([key, child]) => [key, frozenCopy(child)]));
  return Object.freeze(copy);
}

/**
 * Validate one original suite result against expected declarations and a launch ID. Return its fresh frozen copy,
 * preserving nonpassing rows; all shape, identity and declaration failures become ERR_HOSTED_EVIDENCE. No I/O occurs.
 */
export function validateHostedSuiteResult(input) {
  try {
    record(input, ["result", "expected", "launchId"]);
    const declarations = expectedData(input.expected);
    digest(input.launchId);
    if (input.expected.target === null) invalid();
    const value = input.result;
    record(value, resultFields);
    equal(value.schemaVersion, 1);
    equal(value.kind, "hosted-suite-result");
    equal(value.launchId, input.launchId);
    for (const field of ["profile", "sourceRevision", "suite"]) equal(value[field], input.expected[field]);
    evidenceRows(value, declarations.profiles[input.expected.profile].inventory.cases);
    return frozenCopy(value);
  } catch {
    invalid();
  }
}

/**
 * Validate a hosted envelope against its original result, expected identities and independent lifecycle/observations.
 * Return only a fresh frozen copy of the supplied envelope; validation is consistency, never approval or eligibility.
 * Missing output stays absent, failures stay nonpassing, and every invalid input throws ERR_HOSTED_EVIDENCE without I/O.
 */
export function validateHostedAcceptance(input) {
  try {
    record(input, ["record", "suiteResult", "expected", "launchId", "wrapperOutcome", "observations", "parentCleanup"]);
    const declarations = expectedData(input.expected);
    const completeInventory = declarations.profiles[input.expected.profile].inventory.cases;
    digest(input.launchId);
    const value = input.record;
    record(value, envelopeFields);
    equal(value.schemaVersion, 1);
    equal(value.kind, "hosted-acceptance");
    equal(value.contractRevision, declarations.contractRevision);
    for (const field of ["profile", "sourceRevision", "suite", "release", "images", "configurationSha256", "run"])
      equal(value[field], input.expected[field]);
    evidenceRows(value, completeInventory);
    if (input.suiteResult !== null) {
      const original = validateHostedSuiteResult({
        result: input.suiteResult,
        expected: input.expected,
        launchId: input.launchId,
      });
      equal(value.inventory, original.inventory);
      equal(value.tests, original.tests);
    }
    custody(input);
    record(input.observations, ["before", "after"]);
    observation(input.observations.before);
    observation(input.observations.after);
    equal(value.target, input.observations);
    if (value.status === "passed") {
      passingObservation(input.observations.before, input.expected);
      passingObservation(input.observations.after, input.expected);
      if (input.observations.after.observedAt < input.observations.before.observedAt) invalid();
    }
    return frozenCopy(value);
  } catch {
    invalid();
  }
}
