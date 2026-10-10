/**
 * Resolve immutable acceptance authority from exact Git commits, without consulting the index or working tree.
 *
 * Import resolveAcceptance(root, { sourceRevision, trustedBase, observedReviews }) through acceptance-baseline.mjs.
 * Both revisions are full commit IDs. The optional observations are independently collected approval/merge records,
 * required only for bindings absent from trustedBase. This module does not fetch reviews, install or execute suites,
 * write files, move refs or contact services. Invalid history, paths, identities and observations throw before use.
 *
 * Replay trusted first-parent history, then evaluate the complete source delta as one proposed admission. This keeps
 * requirements persistent across descendants/reverts and prevents splitting mixed changes across a PR's commits.
 * Callers must execute this policy from the trusted base and separately establish that base's protected-main identity.
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { detectPhase } from "./phase-policy.mjs";

const registryPath = "docs/testing/acceptance-transitions.json";
const baselinePath = "docs/testing/baseline.json";
const genesisContractPath = "docs/testing/acceptance-contract.md";
const suitePath = "tests/acceptance";
const manifestPath = `${suitePath}/fixtures/manifest.json`;
const sha1 = /^[a-f0-9]{40}$/;
const sha256 = /^[a-f0-9]{64}$/;
const identifier = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const contractPattern = /^docs\/testing\/contracts\/([a-zA-Z0-9][a-zA-Z0-9._-]*)\.md$/;
const reviewFields = ["repository", "pullRequest", "reviewId", "reviewer", "reviewedHead", "reviewedTree"];
const recordFields = [
  "id",
  "predecessor",
  "contractRevision",
  "contractPath",
  "contractSha256",
  "suiteCommit",
  "suiteTree",
  "manifestSha256",
  "review",
];
const observationFields = [...reviewFields, "author", "baseRef", "merged", "mergeCommit", "state"];
const digest = (value) => createHash("sha256").update(value).digest("hex");

/** Require an ordinary, closed data record; selectors and hidden extension fields never alter admission. */
function record(value, fields, label, optional = []) {
  assert(value && typeof value === "object" && !Array.isArray(value), `Expected ${label} record`);
  assert([Object.prototype, null].includes(Object.getPrototypeOf(value)), `Invalid ${label} prototype`);
  assert(
    Reflect.ownKeys(value).every((field) => fields.includes(field)),
    `Unknown ${label} field`,
  );
  for (const field of fields.filter((name) => !optional.includes(name))) {
    assert(Object.hasOwn(value, field), `Missing ${label} ${field}`);
  }
}

/** Validate review metadata before it can be compared with an independent GitHub observation. */
function reviewIdentity(value) {
  record(value, reviewFields, "review");
  assert(/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(value.repository), "Invalid repository");
  for (const field of ["pullRequest", "reviewId"]) {
    assert(Number.isSafeInteger(value[field]) && value[field] > 0, `Invalid ${field}`);
  }
  assert(typeof value.reviewer === "string" && /^[A-Za-z0-9][A-Za-z0-9-]*$/.test(value.reviewer), "Invalid reviewer");
  assert(sha1.test(value.reviewedHead) && sha1.test(value.reviewedTree), "Invalid reviewed Git identity");
}

/** Parse the append-only registry's closed schema before considering any transition. */
function parseRegistry(raw) {
  const value = JSON.parse(raw);
  record(value, ["schemaVersion", "transitions"], "registry");
  assert.equal(value.schemaVersion, 1, "Unsupported acceptance transition schema");
  assert(Array.isArray(value.transitions), "Expected transition array");
  const ids = new Set();
  const revisions = new Set();
  for (const entry of value.transitions) {
    record(entry, recordFields, "transition");
    for (const field of ["id", "predecessor", "contractRevision"]) {
      assert(typeof entry[field] === "string" && identifier.test(entry[field]), `Invalid transition ${field}`);
    }
    assert.equal(
      entry.contractPath,
      `docs/testing/contracts/${entry.id}.md`,
      "Contract path must identify its transition",
    );
    for (const field of ["suiteCommit", "suiteTree"]) assert(sha1.test(entry[field]), `Invalid ${field}`);
    for (const field of ["manifestSha256", "contractSha256"]) assert(sha256.test(entry[field]), `Invalid ${field}`);
    reviewIdentity(entry.review);
    assert(!ids.has(entry.id) && !revisions.has(entry.contractRevision), "Duplicate transition identity");
    ids.add(entry.id);
    revisions.add(entry.contractRevision);
  }
  return value;
}

const packageName = /^(?:@[A-Za-z0-9][A-Za-z0-9._-]*\/)?[A-Za-z0-9][A-Za-z0-9._-]*$/;
const dependencyFields = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];

/** Require dependency maps to describe registry/remote inputs rather than executable local paths or workspaces. */
function requireDependencySources(value, root = false) {
  assert(value && typeof value === "object" && !Array.isArray(value), "Invalid package metadata");
  if (root) assert(!Object.hasOwn(value, "workspaces"), "Root workspace installation is unsupported");
  for (const field of dependencyFields) {
    if (value[field] === undefined) continue;
    const declarations = value[field];
    assert(declarations && typeof declarations === "object" && !Array.isArray(declarations), `Invalid ${field}`);
    for (const [name, source] of Object.entries(declarations)) {
      assert(packageName.test(name), "Invalid dependency package name");
      assert(typeof source === "string" && source.length > 0 && source.trim() === source, "Invalid dependency source");
      assert(!/[\x00-\x1f\x7f\\]/.test(source), "Unsafe dependency source");
      assert(
        !/^(?:git\+)?(?:file|link|workspace)\s*:/i.test(source),
        "Local and workspace dependencies are unsupported",
      );
      assert(!/^(?:[./]|~[\/\\]|[A-Za-z]:[\/\\])/.test(source), "Local dependency paths are unsupported");
    }
  }
}

/** Validate a committed npm v3 graph before treating every lock change, including dev tooling, as product input. */
function requireRootLock(raw, packageRaw) {
  assert(raw, "Root package lock cannot be deleted");
  const lock = JSON.parse(raw);
  const pkg = JSON.parse(packageRaw);
  assert(lock && typeof lock === "object" && !Array.isArray(lock), "Invalid root package lock");
  assert.equal(lock.lockfileVersion, 3, "Only npm v3 root lock graphs are supported");
  assert(lock.packages && typeof lock.packages === "object" && !Array.isArray(lock.packages), "Missing lock packages");
  assert(Object.hasOwn(lock.packages, ""), "Root lock package metadata is required");
  requireDependencySources(pkg, true);
  const root = lock.packages[""];
  requireDependencySources(root, true);
  for (const field of ["name", "version"]) {
    assert.equal(lock[field], pkg[field], `Root lock ${field} differs from package`);
    assert.equal(root[field], pkg[field], `Root lock package ${field} differs from package`);
  }
  for (const field of dependencyFields) {
    assert.deepEqual(root[field] ?? {}, pkg[field] ?? {}, `Root lock ${field} differs from package`);
  }
  for (const [path, entry] of Object.entries(lock.packages)) {
    requireDependencySources(entry, path === "");
    assert(!Object.hasOwn(entry, "link"), "Local package links are unsupported");
    if (path === "") continue;
    const segments = path.split("/node_modules/");
    assert(segments[0].startsWith("node_modules/"), "Locked package must be inside node_modules");
    segments[0] = segments[0].slice("node_modules/".length);
    assert(
      segments.every((segment) => packageName.test(segment)),
      "Unsafe locked package path",
    );
    assert(typeof entry.version === "string" && entry.version.length > 0, "Locked package version is required");
    if (entry.resolved !== undefined) {
      assert(
        typeof entry.resolved === "string" && !/[\x00-\x20\x7f\\]/.test(entry.resolved),
        "Invalid locked resolution",
      );
      const source = new URL(entry.resolved);
      assert(
        ["https:", "http:", "git:", "git+https:", "git+http:", "ssh:", "git+ssh:"].includes(source.protocol) &&
          source.hostname,
        "Locked resolution must identify a remote package source",
      );
    } else assert.equal(entry.inBundle, true, "Non-bundled locked package requires a remote resolution");
  }
}

/** Classify package commands individually: install hooks and unknown commands remain governance inputs. */
function packageKinds(before, after) {
  const oldPackage = before ? JSON.parse(before) : {};
  const newPackage = after ? JSON.parse(after) : {};
  for (const pkg of [oldPackage, newPackage]) {
    requireDependencySources(pkg, true);
    if (pkg.scripts !== undefined) {
      assert(pkg.scripts && typeof pkg.scripts === "object" && !Array.isArray(pkg.scripts), "Invalid package scripts");
      assert(
        Object.values(pkg.scripts).every((value) => typeof value === "string"),
        "Invalid package command",
      );
    }
  }
  const kinds = new Set();
  const oldScripts = oldPackage.scripts ?? {};
  const newScripts = newPackage.scripts ?? {};
  for (const name of new Set([...Object.keys(oldScripts), ...Object.keys(newScripts)])) {
    if (oldScripts[name] !== newScripts[name]) {
      kinds.add(["build", "typecheck", "test:unit", "start", "dev"].includes(name) ? "product" : "governance");
    }
  }
  const { scripts: ignoredOld, ...oldFields } = oldPackage;
  const { scripts: ignoredNew, ...newFields } = newPackage;
  if (!deepEqual(oldFields, newFields)) kinds.add("product");
  return kinds;
}

/** Compare parsed records without making object-key ordering part of a transition's immutable identity. */
function deepEqual(left, right) {
  try {
    assert.deepEqual(left, right);
    return true;
  } catch {
    return false;
  }
}

/** Keep documentation exemptions non-executable and classify all supported build/runtime inputs explicitly. */
function pathKind(path) {
  if (path.startsWith(`${suitePath}/`)) return "suite";
  if (contractPattern.test(path)) return "contract";
  if (path === registryPath) return "registry";
  if (path === baselinePath || path === genesisContractPath) return "immutable";
  // Reserve only these runtime/product and access/governance filenames; neighboring IaC paths remain unclassified.
  if (
    [
      "infra/cloud/runtime/versions.tf",
      "infra/cloud/runtime/variables.tf",
      "infra/cloud/runtime/main.tf",
      "infra/cloud/runtime/outputs.tf",
      "infra/cloud/runtime/.terraform.lock.hcl",
    ].includes(path) ||
    /^(?:server|frontend|public|src|app|docker|tests\/unit)\//.test(path) ||
    /^(?:compose(?:\.[\w-]+)?\.ya?ml|docker-compose(?:\.[\w-]+)?\.ya?ml|Dockerfile(?:\.[\w-]+)?|\.dockerignore|tsconfig(?:\.[\w-]+)?\.json)$/.test(
      path,
    )
  )
    return "product";
  if (
    /^scripts\/[^\0]+\.(?:mjs|js|ts|py|sh)$/.test(path) ||
    /^\.github\/(?:workflows\/[^/]+\.ya?ml|dependabot\.ya?ml)$/.test(path) ||
    [
      "Makefile",
      ".npmrc",
      ".nvmrc",
      ".gitignore",
      ".prettierignore",
      ".prettierrc.json",
      ".editorconfig",
      ".mermaidignore",
      "docs/main-ruleset.json",
      "docs/review-ruleset.json",
      "release-policy.json",
      "infra/cloud/access/versions.tf",
      "infra/cloud/access/variables.tf",
      "infra/cloud/access/main.tf",
      "infra/cloud/access/outputs.tf",
      "infra/cloud/access/.terraform.lock.hcl",
    ].includes(path)
  )
    return "governance";
  if (
    /^(?:README|AGENTS|LICENSE|CHANGELOG)\.md$/.test(path) ||
    /^\.github\/pull_request_template\.md$/.test(path) ||
    /^(?:docs|agents)\/(?:[^/]+\/)*[^/]+\.(?:md|mmd|txt)$/.test(path) ||
    /^docs\/validation\/artifacts\/[A-Za-z0-9._-]+\.json$/.test(path)
  )
    return "documentation";
  throw new Error(`Unclassified acceptance admission path: ${path}`);
}

/** Resolve required/candidate identities; callers cannot select a suite or reset historical activation. */
export function resolveAcceptance(root, options) {
  record(options, ["sourceRevision", "trustedBase", "observedReviews"], "resolver options", ["observedReviews"]);
  const { sourceRevision, trustedBase, observedReviews = [] } = options;
  assert(sha1.test(sourceRevision) && sha1.test(trustedBase), "Acceptance resolution requires full commit IDs");
  assert(Array.isArray(observedReviews), "Expected review observations");
  for (const observation of observedReviews) {
    record(observation, observationFields, "observation");
    reviewIdentity(Object.fromEntries(reviewFields.map((field) => [field, observation[field]])));
    assert(typeof observation.author === "string" && observation.author.length > 0, "Invalid observed author");
  }
  const git = (args, encoding = "utf8") =>
    execFileSync("git", ["--no-replace-objects", ...args], {
      cwd: root,
      encoding,
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  const read = (revision, path) => git(["show", `${revision}:${path}`], null);
  const snapshots = new Map();
  const snapshot = (revision) => {
    if (!snapshots.has(revision)) {
      const files = new Map(
        git(["ls-tree", "-r", "-z", "--full-tree", revision])
          .split("\0")
          .filter(Boolean)
          .map((line) => {
            const tab = line.indexOf("\t");
            const [mode, type, oid] = line.slice(0, tab).split(" ");
            return [line.slice(tab + 1), { mode, type, oid }];
          }),
      );
      snapshots.set(revision, files);
    }
    return snapshots.get(revision);
  };
  const regular = (revision, path) => {
    const entry = snapshot(revision).get(path);
    assert(entry?.type === "blob" && ["100644", "100755"].includes(entry.mode), `Requires regular file: ${path}`);
    return read(revision, path);
  };
  const suiteIdentity = (revision) => {
    const files = snapshot(revision);
    assert(
      [...files.keys()].some((path) => path.startsWith(`${suitePath}/`)),
      "Acceptance suite is missing",
    );
    for (const [path, entry] of files)
      if (path.startsWith(`${suitePath}/`)) {
        assert(entry.type === "blob" && ["100644", "100755"].includes(entry.mode), `Unsafe acceptance file: ${path}`);
      }
    const manifest = regular(revision, manifestPath);
    const contractRevision = JSON.parse(manifest).contractRevision;
    assert(
      typeof contractRevision === "string" && identifier.test(contractRevision),
      "Invalid manifest contract revision",
    );
    return {
      schemaVersion: 1,
      suiteCommit: revision,
      suiteTree: git(["rev-parse", `${revision}:${suitePath}`]).trim(),
      manifestSha256: digest(manifest),
      contractRevision,
      publicationStatus: "protected-main",
    };
  };
  for (const revision of [sourceRevision, trustedBase]) {
    assert.equal(git(["cat-file", "-t", revision]).trim(), "commit", "Revision must identify a commit");
  }
  const history = git(["rev-list", "--first-parent", "--reverse", sourceRevision]).trim().split("\n");
  const baseIndex = history.indexOf(trustedBase);
  assert(baseIndex !== -1, "Trusted base must be a first-parent ancestor of the exact source");
  const genesisRaw = regular(sourceRevision, baselinePath);
  const genesis = JSON.parse(genesisRaw);
  assert.equal(genesis.schemaVersion, 1, "Unsupported acceptance baseline schema");
  assert(sha1.test(genesis.suiteCommit) && sha1.test(genesis.suiteTree), "Invalid genesis Git identity");
  assert(sha256.test(genesis.manifestSha256), "Invalid genesis manifest identity");
  assert.equal(genesis.publicationStatus, "protected-main", "Genesis must be bound to protected main");
  const genesisIndex = history.indexOf(genesis.suiteCommit);
  assert(genesisIndex !== -1 && genesisIndex <= baseIndex, "Genesis must precede source and trusted base");
  assert.equal(detectPhase([...snapshot(genesis.suiteCommit).keys()]), "acceptance", "Genesis must precede product");
  const actualGenesis = suiteIdentity(genesis.suiteCommit);
  for (const field of ["suiteTree", "manifestSha256", "contractRevision"]) {
    assert.equal(genesis[field], actualGenesis[field], `Invalid genesis ${field}`);
  }
  const contractRaw = regular(genesis.suiteCommit, genesisContractPath);
  const state = {
    genesis,
    required: genesis,
    candidate: null,
    pendingBinding: null,
    admission: "legacy",
    bindingCommit: null,
    activationCommit: null,
    policySha256: null,
  };
  let entries = [];
  let introduced = false;
  let baselineSeen = false;
  const frozenContracts = new Map();
  const identityIds = new Set([genesis.contractRevision]);
  const contractRevisions = new Set([genesis.contractRevision]);

  /** Apply one trusted commit or the complete proposed delta; all comparisons use committed object bytes. */
  const advance = (revision, parent, proposed) => {
    const files = snapshot(revision);
    if (files.has(baselinePath)) {
      assert.deepEqual(regular(revision, baselinePath), genesisRaw, "Genesis baseline metadata is immutable");
      baselineSeen = true;
    } else assert(!baselineSeen, "Genesis baseline cannot be deleted");
    assert.deepEqual(regular(revision, genesisContractPath), contractRaw, "Original genesis contract is immutable");
    for (const [path, raw] of frozenContracts) {
      assert.deepEqual(regular(revision, path), raw, `Historical successor contract is immutable: ${path}`);
    }
    const suite = suiteIdentity(revision);
    const hasRegistry = files.has(registryPath);
    if (!hasRegistry) {
      assert(!introduced, "Acceptance transition policy cannot be deleted");
      assert.equal(suite.suiteTree, genesis.suiteTree, "Legacy acceptance suite is frozen");
      return;
    }
    const registryRaw = regular(revision, registryPath);
    const registry = parseRegistry(registryRaw);
    const previous = parent ? snapshot(parent) : new Map();
    const changed = [...new Set([...previous.keys(), ...files.keys()])].filter(
      (path) => !deepEqual(previous.get(path), files.get(path)),
    );
    const kinds = new Set();
    for (const path of changed) {
      assert(!/[\x00-\x1f\x7f\\]/.test(path), "Unsafe admission path");
      if (files.has(path)) regular(revision, path);
      if (path === "package.json") {
        for (const kind of packageKinds(
          previous.has(path) ? read(parent, path) : null,
          files.has(path) ? read(revision, path) : null,
        ))
          kinds.add(kind);
        if (files.has("package-lock.json")) {
          requireRootLock(regular(revision, "package-lock.json"), regular(revision, path));
        }
      } else if (path === "package-lock.json") {
        assert(files.has(path), "Root package lock cannot be deleted");
        requireRootLock(regular(revision, path), regular(revision, "package.json"));
        kinds.add("product");
      } else kinds.add(pathKind(path));
    }
    assert(!kinds.has("immutable"), "Genesis metadata and contract paths are immutable");
    state.policySha256 = digest(registryRaw);
    if (!introduced) {
      assert.equal(registry.transitions.length, 0, "Bootstrap requires an empty transition registry");
      assert.equal(suite.suiteTree, genesis.suiteTree, "Bootstrap cannot introduce a candidate");
      assert(
        [...kinds].every((kind) => ["registry", "governance", "documentation"].includes(kind)),
        "Bootstrap cannot include product or acceptance changes",
      );
      introduced = true;
      state.admission = "bootstrap";
      return;
    }
    assert(registry.transitions.length >= entries.length, "Historical bindings cannot be removed");
    assert.deepEqual(registry.transitions.slice(0, entries.length), entries, "Historical bindings cannot be rewritten");
    assert(registry.transitions.length <= entries.length + 1, "Only one successor can be bound at a time");
    assert(
      !(kinds.has("product") && (kinds.has("governance") || kinds.has("registry"))),
      "Product and governance changes require separate admission",
    );
    if (registry.transitions.length > entries.length) {
      assert(
        [...kinds].every((kind) => ["registry", "documentation"].includes(kind)),
        "Binding must be separate from suite, product and gate changes",
      );
      assert(state.candidate && !state.pendingBinding, "Binding requires one prior independent candidate");
      const entry = registry.transitions.at(-1);
      for (const field of recordFields.filter((field) => field !== "review")) {
        assert.equal(entry[field], state.candidate[field], `Binding differs from merged candidate ${field}`);
      }
      assert.equal(
        git(["rev-parse", `${entry.suiteCommit}^{tree}`]).trim(),
        entry.review.reviewedTree,
        "Reviewed tree must equal the actual squash tree",
      );
      assert.equal(
        git(["rev-list", "--parents", "-n", "1", entry.suiteCommit]).trim().split(" ").length,
        2,
        "Actual candidate squash must have exactly one parent",
      );
      assert.notEqual(entry.review.reviewedHead, entry.suiteCommit, "Bind the actual squash, not a feature-only head");
      assert(history.indexOf(entry.suiteCommit) < history.indexOf(revision), "Candidate must precede its binding");
      if (proposed) {
        assert(history.indexOf(entry.suiteCommit) <= baseIndex, "Candidate must already exist on the trusted base");
        const matches = observedReviews.filter((observation) =>
          reviewFields.every((field) => observation[field] === entry.review[field]),
        );
        assert.equal(matches.length, 1, "New binding requires exactly one matching observed review");
        const observation = matches[0];
        assert.equal(observation.baseRef, "main", "Review must target protected main");
        assert.equal(observation.merged, true, "Candidate must actually be merged");
        assert.equal(observation.mergeCommit, entry.suiteCommit, "Observed squash identity mismatch");
        assert.equal(observation.state, "APPROVED", "Candidate review must remain approved");
        assert.notEqual(
          observation.author.toLowerCase(),
          observation.reviewer.toLowerCase(),
          "Candidate author cannot self-approve",
        );
      }
      entries = registry.transitions;
      state.pendingBinding = { schemaVersion: 1, ...entry, publicationStatus: "protected-main" };
      state.candidate = null;
      state.bindingCommit = revision;
      state.activationCommit = null;
      state.admission = "binding";
      return;
    }
    if (kinds.has("suite") || kinds.has("contract")) {
      assert(
        [...kinds].every((kind) => ["suite", "contract"].includes(kind)),
        "Candidate must contain only suite and contract changes",
      );
      assert(!state.candidate && !state.pendingBinding, "Only one pending successor is allowed");
      assert(kinds.has("suite") && kinds.has("contract"), "Candidate needs both a new contract and suite");
      if (proposed)
        assert(snapshot(trustedBase).has(registryPath), "Candidate admission requires policy on trusted base");
      const contracts = changed.filter((path) => contractPattern.test(path));
      assert.equal(contracts.length, 1, "Candidate must introduce exactly one successor contract");
      const contractPath = contracts[0];
      assert(!previous.has(contractPath) && files.has(contractPath), "Candidate contract must be new");
      const id = contractPattern.exec(contractPath)[1];
      assert(!identityIds.has(id) && !contractRevisions.has(suite.contractRevision), "Successor identity must be new");
      const raw = regular(revision, contractPath);
      state.candidate = {
        ...suite,
        publicationStatus: "candidate",
        id,
        predecessor: state.required.id ?? genesis.contractRevision,
        contractPath,
        contractSha256: digest(raw),
      };
      frozenContracts.set(contractPath, raw);
      identityIds.add(id);
      contractRevisions.add(suite.contractRevision);
      state.admission = "candidate";
      return;
    }
    assert.equal(
      suite.suiteTree,
      (state.candidate ?? state.pendingBinding ?? state.required).suiteTree,
      "Acceptance suite changed outside candidate admission",
    );
    if (kinds.has("product")) {
      assert(!state.candidate, "Product cannot change before candidate binding");
      if (state.pendingBinding) {
        state.required = state.pendingBinding;
        state.pendingBinding = null;
        state.activationCommit = revision;
      }
      state.admission = "implementation";
    } else state.admission = kinds.has("governance") ? "governance" : "documentation";
  };
  for (let index = genesisIndex; index <= baseIndex; index++) advance(history[index], history[index - 1], false);
  if (sourceRevision !== trustedBase) advance(sourceRevision, trustedBase, true);
  return state;
}
