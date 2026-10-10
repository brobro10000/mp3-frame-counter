/**
 * Validate parsed acceptance-profile declarations without selecting tests, execution targets or evidence authority.
 *
 * Import `validateAcceptanceProfiles` and supply metadata, all fixed inventories, the resolver-selected revision and
 * the selected predecessor's local inventory. Explicit null represents only the documented legacy absences. The
 * result is a fresh, deeply frozen JSON-data copy; inventory order is retained and requirement IDs are sorted.
 *
 * Importing or calling this module performs no I/O and never mutates caller data. Invalid declarations synchronously
 * throw a sanitized TypeError labeled ERR_ACCEPTANCE_PROFILE_DECLARATION. Byte decoding, Git authenticity, discovery,
 * test execution and deployment authorization remain the caller's separate responsibilities.
 */

const profileNames = ["local", "stage", "production"];
const requirementIds = new Set([
  ...Array.from({ length: 16 }, (_, index) => `APP-V1-${String(index + 1).padStart(3, "0")}`),
  ...Array.from({ length: 6 }, (_, index) => `APP-REL-${String(index + 1).padStart(3, "0")}`),
]);

/** Use a fixed diagnostic so neither untrusted field names nor supplied values can leak through a rejection. */
function invalid() {
  throw Object.assign(new TypeError("Invalid acceptance profile declaration"), {
    code: "ERR_ACCEPTANCE_PROFILE_DECLARATION",
  });
}

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

function nonemptyArray(value) {
  if (!Array.isArray(value) || value.length === 0) invalid();
}

/** Reject trailing line terminators too: JavaScript's `$` anchor alone can match just before one. */
function identifier(value) {
  if (typeof value !== "string" || value.trim() !== value || !/^[A-Za-z0-9][A-Za-z0-9_.-]*$/u.test(value)) invalid();
}

/**
 * Copy a closed { file, title } tuple: file uses nonempty identifier path components ending in .spec.ts; title is
 * nonempty, trimmed and control-free. Preserve exact strings without path normalization. Invalid input throws the
 * fixed ERR_ACCEPTANCE_PROFILE_DECLARATION TypeError; the supplied record is never mutated.
 */
function caseReference(value) {
  record(value, ["file", "title"]);
  if (typeof value.file !== "string" || !value.file.endsWith(".spec.ts")) invalid();
  for (const component of value.file.split("/")) identifier(component);
  if (
    typeof value.title !== "string" ||
    value.title.length === 0 ||
    value.title.trim() !== value.title ||
    /[\u0000-\u001f\u007f]/u.test(value.title)
  )
    invalid();
  return { file: value.file, title: value.title };
}

/** JSON tuple encoding preserves both exact strings without ambiguous separator concatenation or normalization. */
function tuple(value) {
  return JSON.stringify([value.file, value.title]);
}

/**
 * Copy a closed revision/cases inventory in supplied order, requiring a valid revision and nonempty unique tuples.
 * When selectedRevision is supplied, require exact equality; omission validates the predecessor's own revision syntax.
 * Invalid shape, revision or duplicate identity throws ERR_ACCEPTANCE_PROFILE_DECLARATION without returning a partial copy.
 */
function inventory(value, selectedRevision) {
  record(value, ["contractRevision", "cases"]);
  identifier(value.contractRevision);
  if (selectedRevision !== undefined && value.contractRevision !== selectedRevision) invalid();
  nonemptyArray(value.cases);
  const identities = new Set();
  const cases = [];
  for (const supplied of value.cases) {
    const entry = caseReference(supplied);
    const identity = tuple(entry);
    if (identities.has(identity)) invalid();
    identities.add(identity);
    cases.push(entry);
  }
  return { contractRevision: value.contractRevision, cases };
}

/**
 * Copy nonempty case-to-requirement mappings for an already validated completeInventory. Require exactly its tuple set,
 * one mapping per case, and unique nonempty allowlisted requirement IDs. Return fresh records in inventory order with
 * requirement IDs sorted; any mismatch throws ERR_ACCEPTANCE_PROFILE_DECLARATION without mutating either input.
 */
function mappings(value, completeInventory) {
  nonemptyArray(value);
  const byIdentity = new Map();
  for (const supplied of value) {
    record(supplied, ["case", "requirements"]);
    const entry = caseReference(supplied.case);
    const identity = tuple(entry);
    if (byIdentity.has(identity)) invalid();
    nonemptyArray(supplied.requirements);
    const requirements = new Set();
    for (const requirement of supplied.requirements) {
      if (!requirementIds.has(requirement) || requirements.has(requirement)) invalid();
      requirements.add(requirement);
    }
    byIdentity.set(identity, { case: entry, requirements: [...requirements].sort() });
  }
  if (byIdentity.size !== completeInventory.cases.length) invalid();
  return completeInventory.cases.map((entry) => {
    const mapping = byIdentity.get(tuple(entry));
    if (!mapping) invalid();
    return mapping;
  });
}

/** Freeze only newly constructed result records/arrays; no caller-owned object reaches this function. */
function freeze(value) {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Validate the complete declaration atomically; success describes data, never permission to select a profile. */
export function validateAcceptanceProfiles(input) {
  record(input, ["metadata", "inventories", "selectedContractRevision", "predecessorLocalInventory"]);
  record(input.inventories, profileNames);
  identifier(input.selectedContractRevision);
  const local = inventory(input.inventories.local, input.selectedContractRevision);
  const profiles = { local: { inventory: local, mappings: null }, stage: null, production: null };

  if (input.metadata === null) {
    if (
      input.inventories.stage !== null ||
      input.inventories.production !== null ||
      input.predecessorLocalInventory !== null
    )
      invalid();
  } else {
    record(input.metadata, ["schemaVersion", "contractRevision", "profiles"]);
    if (input.metadata.schemaVersion !== 1) invalid();
    identifier(input.metadata.contractRevision);
    if (input.metadata.contractRevision !== input.selectedContractRevision) invalid();
    record(input.metadata.profiles, profileNames);
    const predecessor = inventory(input.predecessorLocalInventory);
    const localIdentities = new Set(local.cases.map(tuple));
    if (predecessor.cases.some((entry) => !localIdentities.has(tuple(entry)))) invalid();

    for (const profile of profileNames) {
      const completeInventory =
        profile === "local" ? local : inventory(input.inventories[profile], input.selectedContractRevision);
      profiles[profile] = {
        inventory: completeInventory,
        mappings: mappings(input.metadata.profiles[profile], completeInventory),
      };
    }
  }

  return freeze({
    schemaVersion: 1,
    kind: "acceptance-profile-declarations",
    mode: input.metadata === null ? "legacy-local" : "profiles-v1",
    contractRevision: input.selectedContractRevision,
    profiles,
  });
}
