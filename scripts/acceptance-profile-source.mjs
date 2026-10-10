/**
 * Validate dormant acceptance declarations from the immutable suites selected by the existing runtime authority.
 *
 * Import readAcceptanceProfileSource(root, { selection, sourceRevision, baseRevision }) after runtimeAcceptance succeeds.
 * Pass that unchanged selection and its original exact source/base; only an originally omitted pre-policy local base
 * may be null. The synchronous result has deeply frozen required/candidate/pending declarations or explicit nulls.
 * readRequiredAcceptanceProfileProjection takes the same arguments and returns only required profiles-v1 declarations,
 * their original parsed inputs and exact blob hashes, or null for validated legacy/null required declarations. Both
 * exports share one private validated read and validate every selected role before returning fresh frozen data.
 * CI admission and local resolution are replayed for consistency; this does not authenticate the supplied evidence.
 *
 * Import has no I/O. Calls read replacement-disabled Git objects, never working declarations, suite code, credentials
 * or remote services. They do not write evidence or select a hosted target. Invalid context, provenance, lineage or
 * encoded bytes throw a sanitized ERR_ACCEPTANCE_PROFILE_SOURCE TypeError; parsed declaration errors retain the pure
 * validator's ERR_ACCEPTANCE_PROFILE_DECLARATION boundary. No partial result or fallback is returned after failure.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { acceptancePolicyIntroduced, verifyAcceptanceAdmission } from "./acceptance-admission.mjs";
import { resolveAcceptance } from "./acceptance-baseline.mjs";
import { validateAcceptanceProfiles } from "./acceptance-profiles.mjs";
import { detectPhase } from "./phase-policy.mjs";

const revisionPattern = /^[a-f0-9]{40}$/;
const digestPattern = /^[a-f0-9]{64}$/;
const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const baselinePath = "docs/testing/baseline.json";
const registryPath = "docs/testing/acceptance-transitions.json";
const genesisContractPath = "docs/testing/acceptance-contract.md";
const suitePath = "tests/acceptance";
const manifestPath = `${suitePath}/fixtures/manifest.json`;
const declarationPaths = {
  metadata: `${suitePath}/fixtures/profiles.json`,
  local: `${suitePath}/fixtures/inventory.json`,
  stage: `${suitePath}/fixtures/inventory.stage.json`,
  production: `${suitePath}/fixtures/inventory.production.json`,
};
const identityFields = [
  "id",
  "predecessor",
  "contractRevision",
  "contractPath",
  "contractSha256",
  "suiteCommit",
  "suiteTree",
  "manifestSha256",
];
const reviewFields = ["repository", "pullRequest", "reviewId", "reviewer", "reviewedHead", "reviewedTree"];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Require closed plain data records before any caller field can select a validation path. */
function record(value, fields) {
  assert(value && typeof value === "object" && !Array.isArray(value));
  assert([Object.prototype, null].includes(Object.getPrototypeOf(value)));
  assert.equal(Reflect.ownKeys(value).length, fields.length);
  for (const key of fields) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    assert(descriptor?.enumerable && Object.hasOwn(descriptor, "value"));
  }
}

/** Strict decoding keeps malformed bytes and BOMs distinct from successfully parsed invalid declarations. */
function json(raw) {
  assert(!(raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf));
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw));
}

/** Reject declaration facts requiring immutable presence or predecessor identity, which parsed values cannot supply. */
function invalidDeclaration() {
  const failure = new TypeError("Invalid acceptance profile declaration");
  failure.code = "ERR_ACCEPTANCE_PROFILE_DECLARATION";
  throw failure;
}

/** Read Git only, suppressing raw process diagnostics that could include checkout paths or untrusted names. */
function objects(root) {
  const query = (args) =>
    execFileSync("git", ["--no-replace-objects", ...args], {
      cwd: root,
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  const text = (args) => query(args).toString("utf8").trim();
  const snapshots = new Map();
  const commit = (revision) => {
    assert(typeof revision === "string" && revisionPattern.test(revision));
    assert.equal(text(["cat-file", "-t", revision]), "commit");
  };
  const snapshot = (revision) => {
    if (!snapshots.has(revision)) {
      commit(revision);
      const listing = new TextDecoder("utf-8", { fatal: true }).decode(
        query(["ls-tree", "-r", "-t", "-z", "--full-tree", revision]),
      );
      const entries = new Map();
      for (const line of listing.split("\0").filter(Boolean)) {
        const tab = line.indexOf("\t");
        assert(tab > 0);
        const match = /^(\d{6}) (blob|tree|commit) ([a-f0-9]{40})$/.exec(line.slice(0, tab));
        assert(match);
        const path = line.slice(tab + 1);
        assert(!entries.has(path));
        entries.set(path, { mode: match[1], type: match[2], oid: match[3] });
      }
      snapshots.set(revision, entries);
    }
    return snapshots.get(revision);
  };
  const entry = (revision, path, optional = false) => {
    const found = snapshot(revision).get(path);
    if (!found && optional) return null;
    assert(found?.type === "blob" && ["100644", "100755"].includes(found.mode));
    return found;
  };
  const blob = (revision, path) => query(["cat-file", "blob", entry(revision, path).oid]);
  const ancestor = (before, after) => query(["merge-base", "--is-ancestor", before, after]);
  return { commit, snapshot, entry, blob, ancestor };
}

/** Check the unchanged existing transition schema without granting a registry any new selection authority. */
function transition(value, candidate = false) {
  record(value, candidate ? [...identityFields, "schemaVersion", "publicationStatus"] : [...identityFields, "review"]);
  for (const field of ["id", "predecessor", "contractRevision"])
    assert(typeof value[field] === "string" && identifierPattern.test(value[field]));
  assert.equal(value.contractPath, `docs/testing/contracts/${value.id}.md`);
  for (const field of ["suiteCommit", "suiteTree"])
    assert(typeof value[field] === "string" && revisionPattern.test(value[field]));
  for (const field of ["manifestSha256", "contractSha256"])
    assert(typeof value[field] === "string" && digestPattern.test(value[field]));
  if (candidate) {
    assert.equal(value.schemaVersion, 1);
    assert.equal(value.publicationStatus, "candidate");
    return;
  }
  const review = value.review;
  record(review, reviewFields);
  assert(
    typeof review.repository === "string" &&
      /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(review.repository),
  );
  assert(typeof review.reviewer === "string" && /^[A-Za-z0-9][A-Za-z0-9-]*$/.test(review.reviewer));
  for (const field of ["pullRequest", "reviewId"]) assert(Number.isSafeInteger(review[field]) && review[field] > 0);
  for (const field of ["reviewedHead", "reviewedTree"])
    assert(typeof review[field] === "string" && revisionPattern.test(review[field]));
}

/** Replay only the original runtime variant; caller-supplied copies cannot resurrect an older applicable suite. */
function selectionResolution(root, options, source) {
  const { selection, sourceRevision, baseRevision } = options;
  assert(selection && typeof selection === "object" && !Array.isArray(selection));
  const introduced = acceptancePolicyIntroduced(root, sourceRevision);
  if (!introduced) {
    record(selection, ["baseline"]);
    const genesis = json(source.blob(sourceRevision, baselinePath));
    assert.deepEqual(selection.baseline, genesis);
    return { genesis, required: genesis, candidate: null, pendingBinding: null, policySha256: null };
  }
  assert(baseRevision !== null);
  let fresh;
  if (Object.hasOwn(selection, "admission")) {
    record(selection, ["baseline", "resolution", "admission"]);
    record(selection.admission, ["record", "sha256"]);
    const context = selection.admission.record?.context;
    assert.equal(context?.sourceRevision, sourceRevision);
    assert.equal(context?.baseRevision, baseRevision);
    fresh = verifyAcceptanceAdmission(root, {
      record: selection.admission.record,
      expectedContext: context,
      expectedSha256: selection.admission.sha256,
    });
  } else {
    record(selection, ["baseline", "resolution", "localSelection"]);
    const local = selection.localSelection;
    record(local, ["kind", "sourceRevision", "baseRevision", "resolution"]);
    assert.equal(local.kind, "local-acceptance-resolution");
    assert.equal(local.sourceRevision, sourceRevision);
    assert.equal(local.baseRevision, baseRevision);
    fresh = resolveAcceptance(root, { sourceRevision, trustedBase: baseRevision });
    assert.deepEqual(local.resolution, fresh);
  }
  assert(fresh.policySha256 !== null);
  assert.deepEqual(selection.resolution, fresh);
  assert.deepEqual(selection.baseline, fresh.required);
  return fresh;
}

/** Bind the historical baseline as a complete immutable object while retaining its original descriptive metadata. */
function genesisIdentity(source, sourceRevision, baseRevision, genesis) {
  // The original freeze carries historical review prose too; compare all bytes' parsed fields without reinterpreting it.
  assert.deepEqual(genesis, json(source.blob(sourceRevision, baselinePath)));
  assert.equal(genesis.schemaVersion, 1);
  assert.equal(genesis.publicationStatus, "protected-main");
  assert(typeof genesis.contractRevision === "string" && identifierPattern.test(genesis.contractRevision));
  for (const field of ["suiteCommit", "suiteTree"])
    assert(typeof genesis[field] === "string" && revisionPattern.test(genesis[field]));
  assert(typeof genesis.manifestSha256 === "string" && digestPattern.test(genesis.manifestSha256));
  source.commit(genesis.suiteCommit);
  source.ancestor(genesis.suiteCommit, sourceRevision);
  if (baseRevision !== null) source.ancestor(genesis.suiteCommit, baseRevision);
  assert.equal(detectPhase([...source.snapshot(genesis.suiteCommit).keys()]), "acceptance");
  assert.deepEqual(
    source.blob(sourceRevision, genesisContractPath),
    source.blob(genesis.suiteCommit, genesisContractPath),
  );
}

/** Build only the replayed catalog; insertion order rejects missing, duplicate, cyclic and later predecessors. */
function catalogFor(source, sourceRevision, resolution) {
  const genesis = resolution.genesis;
  const catalog = new Map([[genesis.contractRevision, genesis]]);
  const revisions = new Set([genesis.contractRevision]);
  const append = (identity) => {
    assert(!catalog.has(identity.id) && !revisions.has(identity.contractRevision));
    assert(catalog.has(identity.predecessor));
    catalog.set(identity.id, identity);
    revisions.add(identity.contractRevision);
  };
  if (resolution.policySha256 !== null) {
    const raw = source.blob(sourceRevision, registryPath);
    assert.equal(hash(raw), resolution.policySha256);
    const registry = json(raw);
    record(registry, ["schemaVersion", "transitions"]);
    assert.equal(registry.schemaVersion, 1);
    assert(Array.isArray(registry.transitions));
    for (const entry of registry.transitions) {
      transition(entry);
      append({ schemaVersion: 1, ...entry, publicationStatus: "protected-main" });
    }
    if (resolution.candidate !== null) {
      transition(resolution.candidate, true);
      append(resolution.candidate);
    }
  }
  for (const selected of [resolution.required, resolution.candidate, resolution.pendingBinding]) {
    if (selected === null) continue;
    assert.deepEqual(selected, catalog.get(selected.id ?? genesis.contractRevision));
  }
  return catalog;
}

/** Authenticate every visited suite before reading declaration bytes, sharing immutable reads within this call only. */
function suiteReader(source, sourceRevision, genesis) {
  const verified = new Map();
  return (identity) => {
    if (verified.has(identity)) return verified.get(identity);
    source.commit(identity.suiteCommit);
    source.ancestor(identity.suiteCommit, sourceRevision);
    const snapshot = source.snapshot(identity.suiteCommit);
    const tree = snapshot.get(suitePath);
    assert(tree?.type === "tree" && tree.mode === "040000" && tree.oid === identity.suiteTree);
    for (const [path, entry] of snapshot) {
      if (!path.startsWith(`${suitePath}/`) || entry.type === "tree") continue;
      assert(entry.type === "blob" && ["100644", "100755"].includes(entry.mode));
    }
    const manifest = source.blob(identity.suiteCommit, manifestPath);
    assert.equal(hash(manifest), identity.manifestSha256);
    assert.equal(json(manifest).contractRevision, identity.contractRevision);
    const contract = source.blob(
      identity.suiteCommit,
      identity === genesis ? genesisContractPath : identity.contractPath,
    );
    if (identity !== genesis) assert.equal(hash(contract), identity.contractSha256);
    const present = Object.fromEntries(
      Object.entries(declarationPaths).map(([name, path]) => [
        name,
        source.entry(identity.suiteCommit, path, true) !== null,
      ]),
    );
    // Capture each original blob once: its parsed value and pre-parse hash belong to this same immutable read.
    // Historical inventories may be absent, but every present blob must remain readable and valid JSON.
    const declarations = Object.fromEntries(
      Object.entries(declarationPaths).map(([name, path]) => {
        if (!present[name]) return [name, { value: null, sha256: null }];
        const raw = source.blob(identity.suiteCommit, path);
        const sha256 = hash(raw);
        return [name, { value: json(raw), sha256 }];
      }),
    );
    const read = (name) => declarations[name].value;
    const sha256 = (name) => declarations[name].sha256;
    const result = { present, read, sha256 };
    verified.set(identity, result);
    return result;
  };
}

/** Follow the authenticated complete lineage; historic presence checks do not invent or require old inventories. */
function declarationsFor(identity, genesis, catalog, readSuite, source) {
  if (identity === null) return null;
  const lineage = [];
  const seen = new Set();
  let current = identity;
  while (true) {
    assert(!seen.has(current));
    seen.add(current);
    lineage.push({ identity: current, suite: readSuite(current) });
    if (current === genesis) break;
    const predecessor = catalog.get(current.predecessor);
    assert(predecessor);
    source.ancestor(predecessor.suiteCommit, current.suiteCommit);
    current = predecessor;
  }
  const { suite } = lineage[0];
  if (identity === genesis && Object.values(suite.present).every((present) => !present)) return null;
  assert(suite.present.local);
  if (!suite.present.metadata && (suite.present.stage || suite.present.production)) invalidDeclaration();
  if (!suite.present.metadata) assert(lineage.slice(1).every((entry) => !entry.suite.present.metadata));
  const predecessor = lineage[1]?.suite;
  if (suite.present.metadata) assert(predecessor?.present.local);
  const predecessorLocalInventory = suite.present.metadata ? predecessor.read("local") : null;
  if (suite.present.metadata && predecessorLocalInventory?.contractRevision !== lineage[1].identity.contractRevision)
    invalidDeclaration();
  const declarationInput = {
    metadata: suite.read("metadata"),
    inventories: { local: suite.read("local"), stage: suite.read("stage"), production: suite.read("production") },
    selectedContractRevision: identity.contractRevision,
    predecessorLocalInventory,
  };
  return { declarations: validateAcceptanceProfiles(declarationInput), declarationInput, suite };
}

/** Keep normalized declarations and original inputs private until every selected role passes the same validated read. */
function readValidatedSource(root, options) {
  try {
    assert(typeof root === "string" && root.length > 0 && !/[\x00-\x1f\x7f]/.test(root));
    record(options, ["selection", "sourceRevision", "baseRevision"]);
    const { sourceRevision, baseRevision } = options;
    const source = objects(root);
    source.commit(sourceRevision);
    if (baseRevision !== null) source.commit(baseRevision);
    const resolution = selectionResolution(root, options, source);
    const genesis = resolution.genesis;
    genesisIdentity(source, sourceRevision, baseRevision, genesis);
    const catalog = catalogFor(source, sourceRevision, resolution);
    const readSuite = suiteReader(source, sourceRevision, genesis);
    return {
      required: declarationsFor(
        catalog.get(resolution.required.id ?? genesis.contractRevision),
        genesis,
        catalog,
        readSuite,
        source,
      ),
      candidate: declarationsFor(resolution.candidate, genesis, catalog, readSuite, source),
      pending: declarationsFor(
        resolution.pendingBinding === null ? null : catalog.get(resolution.pendingBinding.id),
        genesis,
        catalog,
        readSuite,
        source,
      ),
    };
  } catch (error) {
    if (error instanceof TypeError && error.code === "ERR_ACCEPTANCE_PROFILE_DECLARATION") throw error;
    const failure = new TypeError("Acceptance profile source is invalid or unverifiable");
    failure.code = "ERR_ACCEPTANCE_PROFILE_SOURCE";
    throw failure;
  }
}

/** Preserve the existing closed role result, including legacy declarations and exact-genesis null compatibility. */
export function readAcceptanceProfileSource(root, options) {
  const roles = readValidatedSource(root, options);
  return Object.freeze({
    required: roles.required?.declarations ?? null,
    candidate: roles.candidate?.declarations ?? null,
    pending: roles.pending?.declarations ?? null,
  });
}

/** Copy validated parsed data in original order, freezing only new containers without exposing private cache aliases. */
function frozenCopy(value) {
  if (value === null || typeof value !== "object") return value;
  const copy = Array.isArray(value)
    ? value.map(frozenCopy)
    : Object.fromEntries(Object.entries(value).map(([key, child]) => [key, frozenCopy(child)]));
  return Object.freeze(copy);
}

/**
 * Project required hosted declarations from the same closed original-context options accepted by the existing reader.
 * All selected roles must validate before legacy/null eligibility is considered. Candidate/pending declarations never
 * substitute for required. Original input order, predecessor revision and exact Git-byte hashes survive independently
 * of normalized mappings. The fresh frozen result supplies consistency evidence, not publisher or hosted authority.
 */
export function readRequiredAcceptanceProfileProjection(root, options) {
  const { required } = readValidatedSource(root, options);
  if (required === null || required.declarations.mode !== "profiles-v1") return null;
  return frozenCopy({
    required: required.declarations,
    declarationInput: required.declarationInput,
    profilesSha256: required.suite.sha256("metadata"),
    inventorySha256: {
      stage: required.suite.sha256("stage"),
      production: required.suite.sha256("production"),
    },
  });
}
