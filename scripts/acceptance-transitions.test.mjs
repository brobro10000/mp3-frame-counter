/**
 * Independent GATE-01 decision fixtures, authored before implementation of the transition resolver.
 * Run with pinned Node: node --test scripts/acceptance-transitions.test.mjs after integration.
 * Each test owns a disposable Git repository and synthetic contract/fixture bytes; no network, product execution,
 * credentials, real reviews, tags or releases are used. The observedReviews records are injected test observations,
 * not real authorization. Missing resolver support should fail rather than skipping these tests.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { resolveAcceptance } from "./acceptance-baseline.mjs";

const registryPath = "docs/testing/acceptance-transitions.json";
const baselinePath = "docs/testing/baseline.json";
const suitePath = "tests/acceptance";
const manifestPath = `${suitePath}/fixtures/manifest.json`;
const repository = "example/private-mp3";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "mp3-transition-expectations-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const put = (path, bytes) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), bytes);
  };
  const json = (path, value) => put(path, `${JSON.stringify(value, null, 2)}\n`);
  const commit = (message) => {
    git("add", "--all");
    git(
      "-c",
      "user.name=Independent Gate Fixture",
      "-c",
      "user.email=gate@example.invalid",
      "commit",
      "--quiet",
      "-m",
      message,
    );
    return git("rev-parse", "HEAD");
  };
  git("init", "--quiet", "--initial-branch=main");
  put("README.md", "Synthetic repository; no actual product implementation.\n");
  const foundation = commit("fixture foundation");
  put(`${suitePath}/package.json`, '{"private":true,"scripts":{"check":"node check.mjs"}}\n');
  put(`${suitePath}/check.mjs`, "// Synthetic suite identity only; never executed.\n");
  json(manifestPath, { contractRevision: "r3", independentCount: 3 });
  put("docs/testing/acceptance-contract.md", "# Immutable synthetic genesis contract r3\n");
  const genesisCommit = commit("independent pre-product genesis suite");
  const genesis = {
    schemaVersion: 1,
    contractRevision: "r3",
    suiteCommit: genesisCommit,
    suiteTree: git("rev-parse", `${genesisCommit}:${suitePath}`),
    manifestSha256: hash(readFileSync(join(root, manifestPath))),
    publicationStatus: "protected-main",
  };
  json(baselinePath, genesis);
  put("server/src/parser.ts", "// Synthetic product marker; no parser implementation.\n");
  put("server/Dockerfile", "# Synthetic runtime marker; never built.\n");
  put("compose.yaml", "services: {}\n");
  put("frontend/nginx.conf.template", "# Synthetic transport marker.\n");
  const product = commit("synthetic product follows frozen genesis");
  const registry = { schemaVersion: 1, transitions: [] };
  let serial = 0;
  const bootstrap = () => {
    json(registryPath, registry);
    return commit("introduce dormant empty transition registry");
  };
  const candidate = ({ id = "transport-r4", revision = "r4", predecessor = "r3", mixedPath } = {}) => {
    const parent = git("rev-parse", "HEAD");
    const branch = `reviewed-candidate-${++serial}`;
    git("checkout", "--quiet", "-b", branch);
    json(manifestPath, { contractRevision: revision, independentCount: 3, additionalContract: id });
    put(`${suitePath}/check.mjs`, `// Independent synthetic ${id} suite; never executed.\n`);
    const contractPath = `docs/testing/contracts/${id}.md`;
    put(contractPath, `# Synthetic independent contract ${revision}\n`);
    if (mixedPath) put(mixedPath, "// Candidate must not contain this unrelated executable change.\n");
    const reviewedHead = commit(`reviewed test-only proposal ${id}`);
    const reviewedTree = git("rev-parse", `${reviewedHead}^{tree}`);
    git("checkout", "--quiet", "main");
    git("merge", "--squash", "--quiet", branch);
    const suiteCommit = commit(`actual protected-main squash ${id}`);
    assert.notEqual(suiteCommit, reviewedHead, "Fixture must distinguish reviewed head from actual squash SHA");
    const review = {
      repository,
      pullRequest: serial,
      reviewId: 1000 + serial,
      reviewer: "independent-reviewer",
      reviewedHead,
      reviewedTree,
    };
    const record = {
      id,
      predecessor,
      contractRevision: revision,
      contractPath,
      contractSha256: hash(readFileSync(join(root, contractPath))),
      suiteCommit,
      suiteTree: git("rev-parse", `${suiteCommit}:${suitePath}`),
      manifestSha256: hash(readFileSync(join(root, manifestPath))),
      review,
    };
    const observation = {
      ...review,
      author: "product-owner",
      baseRef: "main",
      merged: true,
      mergeCommit: suiteCommit,
      state: "APPROVED",
    };
    return { parent, record, observation };
  };
  const bind = (value) => {
    registry.transitions.push(structuredClone(value.record));
    json(registryPath, registry);
    return commit(`bind ${value.record.id} after its actual squash`);
  };
  const resolve = (sourceRevision, trustedBase, observedReviews = []) =>
    resolveAcceptance(root, { sourceRevision, trustedBase, observedReviews });
  return { root, git, put, json, commit, foundation, genesis, product, registry, bootstrap, candidate, bind, resolve };
}

function boundFixture(t) {
  const f = fixture(t);
  const bootstrap = f.bootstrap();
  const candidate = f.candidate();
  const binding = f.bind(candidate);
  return { ...f, bootstrapCommit: bootstrap, candidateState: candidate, binding };
}

function requireIdentity(actual, expected) {
  for (const field of ["suiteCommit", "suiteTree", "manifestSha256", "contractRevision"])
    assert.equal(actual?.[field], expected[field], `Resolved ${field} must identify the expected suite`);
}

function reject(f, source, base, observations = []) {
  assert.throws(() => f.resolve(source, base, observations));
}

test("historical r3 resolution retains its immutable pre-product identity", (t) => {
  const f = fixture(t);
  const result = f.resolve(f.product, f.genesis.suiteCommit);
  requireIdentity(result.required, f.genesis);
  assert.equal(result.admission, "legacy");
  assert.equal(result.candidate, null);
  assert.equal(result.pendingBinding, null);
});

test("historical source replay is independent of a later HEAD and changed worktree suite", (t) => {
  const f = boundFixture(t);
  f.put("server/src/parser.ts", "// Later synthetic implementation marker.\n");
  f.commit("activate synthetic successor after binding");
  const result = f.resolve(f.product, f.genesis.suiteCommit);
  requireIdentity(result.required, f.genesis);
  assert.equal(result.admission, "legacy");
});

test("the empty registry bootstrap leaves r3 required and has no pending successor", (t) => {
  const f = fixture(t);
  const source = f.bootstrap();
  const result = f.resolve(source, f.product);
  requireIdentity(result.required, f.genesis);
  assert.equal(result.admission, "bootstrap");
  assert.equal(result.candidate, null);
  assert.equal(result.pendingBinding, null);
  assert.match(result.policySha256, /^[a-f0-9]{64}$/);
});

test("test-only candidate after policy introduction is admitted despite existing product files", (t) => {
  const f = fixture(t);
  const base = f.bootstrap();
  const candidate = f.candidate();
  const result = f.resolve(candidate.record.suiteCommit, base);
  requireIdentity(result.required, f.genesis);
  requireIdentity(result.candidate, candidate.record);
  assert.equal(result.admission, "candidate");
});

test("actual squash binding requires its exact observed review and still selects predecessor acceptance", (t) => {
  const f = boundFixture(t);
  const result = f.resolve(f.binding, f.candidateState.record.suiteCommit, [f.candidateState.observation]);
  requireIdentity(result.required, f.genesis);
  requireIdentity(result.pendingBinding, f.candidateState.record);
  assert.equal(result.admission, "binding");
  assert.equal(result.bindingCommit, f.binding);
  assert.equal(result.activationCommit, null);
});

test("historical committed binding needs no new review fetch but still resolves its actual Git identity", (t) => {
  const f = boundFixture(t);
  f.put("README.md", "Synthetic documentation after binding.\n");
  const source = f.commit("documentation after trusted binding");
  const result = f.resolve(source, f.binding);
  requireIdentity(result.required, f.genesis);
  requireIdentity(result.pendingBinding, f.candidateState.record);
  assert.equal(result.activationCommit, null);
});

test("first product change after binding requires successor and records persistent activation", (t) => {
  const f = boundFixture(t);
  f.put("server/src/parser.ts", "// Synthetic first implementation marker.\n");
  const source = f.commit("first applicable product change");
  const result = f.resolve(source, f.binding);
  requireIdentity(result.required, f.candidateState.record);
  assert.equal(result.admission, "implementation");
  assert.equal(result.bindingCommit, f.binding);
  assert.equal(result.activationCommit, source);
  assert.equal(result.pendingBinding, null);
});

for (const path of ["server/Dockerfile", "compose.yaml", "frontend/nginx.conf.template", "package.json"]) {
  test(`runtime/build/transport input ${path} activates the successor`, (t) => {
    const f = boundFixture(t);
    f.put(
      path,
      path.endsWith(".json") ? '{"private":true,"scripts":{"build":"new-command"}}\n' : "# Changed synthetic input.\n",
    );
    const source = f.commit(`change ${path}`);
    const result = f.resolve(source, f.binding);
    requireIdentity(result.required, f.candidateState.record);
    assert.equal(result.activationCommit, source);
  });
}

test("documentation descendants cannot return to predecessor acceptance", (t) => {
  const f = boundFixture(t);
  f.put("server/src/parser.ts", "// Synthetic successor activation.\n");
  const activation = f.commit("activate successor");
  f.put("README.md", "Documentation descendant of successor activation.\n");
  const source = f.commit("documentation descendant");
  const result = f.resolve(source, activation);
  requireIdentity(result.required, f.candidateState.record);
  assert.equal(result.activationCommit, activation);
});

test("product reverts keep successor applicability", (t) => {
  const f = boundFixture(t);
  f.put("server/src/parser.ts", "// Synthetic successor activation.\n");
  const activation = f.commit("activate successor");
  f.put("server/src/parser.ts", f.git("show", `${f.product}:server/src/parser.ts`) + "\n");
  const source = f.commit("revert synthetic product bytes");
  const result = f.resolve(source, activation);
  requireIdentity(result.required, f.candidateState.record);
  assert.equal(result.activationCommit, activation);
});

test("a new independent successor is admissible only after prior activation", (t) => {
  const f = boundFixture(t);
  f.put("server/src/parser.ts", "// First successor implemented.\n");
  const activation = f.commit("activate first successor");
  const second = f.candidate({ id: "docs-r5", revision: "r5", predecessor: "transport-r4" });
  const result = f.resolve(second.record.suiteCommit, activation);
  requireIdentity(result.required, f.candidateState.record);
  requireIdentity(result.candidate, second.record);
});

test("registry is resolved from exact source, not a later valid registry at HEAD", (t) => {
  const f = boundFixture(t);
  const result = f.resolve(f.bootstrapCommit, f.product);
  requireIdentity(result.required, f.genesis);
  assert.equal(result.admission, "bootstrap");
  assert.equal(result.candidate, null);
});

test("initial bootstrap cannot simultaneously introduce a candidate", (t) => {
  const f = fixture(t);
  f.json(registryPath, f.registry);
  f.json(manifestPath, { contractRevision: "r4", independentCount: 3 });
  f.put("docs/testing/contracts/transport-r4.md", "# Untrusted simultaneous successor\n");
  const source = f.commit("invalid bootstrap and candidate together");
  reject(f, source, f.product);
});

test("candidate admission is disabled before transition support reaches trusted base", (t) => {
  const f = fixture(t);
  const candidate = f.candidate();
  reject(f, candidate.record.suiteCommit, f.product);
});

for (const path of ["server/src/parser.ts", "scripts/run-ci-phase.mjs", ".github/workflows/ci.yml", registryPath]) {
  test(`candidate cannot include ${path}`, (t) => {
    const f = fixture(t);
    const base = f.bootstrap();
    const candidate = f.candidate({ mixedPath: path });
    reject(f, candidate.record.suiteCommit, base);
  });
}

test("product cannot change before the merged candidate is separately bound", (t) => {
  const f = fixture(t);
  f.bootstrap();
  const candidate = f.candidate();
  f.put("server/src/parser.ts", "// Unbound implementation is forbidden.\n");
  const source = f.commit("product before separate binding");
  reject(f, source, candidate.record.suiteCommit);
});

test("a second unbound candidate is rejected", (t) => {
  const f = fixture(t);
  f.bootstrap();
  const first = f.candidate();
  const second = f.candidate({ id: "docs-r5", revision: "r5", predecessor: "transport-r4" });
  reject(f, second.record.suiteCommit, first.record.suiteCommit);
});

test("a second candidate is rejected while a bound successor awaits implementation", (t) => {
  const f = boundFixture(t);
  const second = f.candidate({ id: "docs-r5", revision: "r5", predecessor: "transport-r4" });
  reject(f, second.record.suiteCommit, f.binding);
});

for (const path of ["server/src/parser.ts", `${suitePath}/check.mjs`, "scripts/acceptance-baseline.mjs"]) {
  test(`binding cannot include ${path}`, (t) => {
    const f = fixture(t);
    f.bootstrap();
    const candidate = f.candidate();
    f.put(path, "// Cannot join binding to implementation, suite or gate changes.\n");
    const source = f.bind(candidate);
    reject(f, source, candidate.record.suiteCommit, [candidate.observation]);
  });
}

test("genesis metadata is immutable after transition support", (t) => {
  const f = fixture(t);
  const base = f.bootstrap();
  f.json(baselinePath, { ...f.genesis, contractRevision: "rewritten" });
  const source = f.commit("invalid genesis rewrite");
  reject(f, source, base);
});

test("original r3 contract remains immutable", (t) => {
  const f = fixture(t);
  const base = f.bootstrap();
  f.put("docs/testing/acceptance-contract.md", "# Rewritten old contract\n");
  const source = f.commit("invalid historical contract rewrite");
  reject(f, source, base);
});

test("registry deletion cannot reopen legacy fallback", (t) => {
  const f = fixture(t);
  const base = f.bootstrap();
  rmSync(join(f.root, registryPath));
  const source = f.commit("delete transition policy");
  reject(f, source, base);
});

test("historical binding entry cannot be rewritten", (t) => {
  const f = boundFixture(t);
  f.registry.transitions[0].contractRevision = "silently-weakened";
  f.json(registryPath, f.registry);
  const source = f.commit("rewrite committed transition");
  reject(f, source, f.binding);
});

test("deleting a historical binding is not a supported rollback", (t) => {
  const f = boundFixture(t);
  f.json(registryPath, { schemaVersion: 1, transitions: [] });
  const source = f.commit("delete historical transition");
  reject(f, source, f.binding);
});

for (const mutate of [
  (r) => {
    r.schemaVersion = 99;
  },
  (r) => {
    r.extra = true;
  },
  (r) => {
    r.transitions = {};
  },
]) {
  test(`malformed bootstrap registry is rejected: ${mutate.toString()}`, (t) => {
    const f = fixture(t);
    mutate(f.registry);
    f.json(registryPath, f.registry);
    const source = f.commit("invalid registry schema");
    reject(f, source, f.product);
  });
}

for (const [label, mutation] of [
  [
    "invented suite SHA",
    (v) => {
      v.record.suiteCommit = "f".repeat(40);
    },
  ],
  [
    "feature-only suite SHA",
    (v) => {
      v.record.suiteCommit = v.record.review.reviewedHead;
    },
  ],
  [
    "wrong suite tree",
    (v) => {
      v.record.suiteTree = "e".repeat(40);
    },
  ],
  [
    "wrong fixture digest",
    (v) => {
      v.record.manifestSha256 = "d".repeat(64);
    },
  ],
  [
    "wrong contract digest",
    (v) => {
      v.record.contractSha256 = "c".repeat(64);
    },
  ],
  [
    "unsafe contract path",
    (v) => {
      v.record.contractPath = "../outside.md";
    },
  ],
  [
    "wrong predecessor",
    (v) => {
      v.record.predecessor = "unknown-r2";
    },
  ],
  [
    "unknown entry field",
    (v) => {
      v.record.allowOldSuite = true;
    },
  ],
]) {
  test(`binding rejects ${label}`, (t) => {
    const f = fixture(t);
    f.bootstrap();
    const candidate = f.candidate();
    mutation(candidate);
    const source = f.bind(candidate);
    reject(f, source, candidate.observation.mergeCommit, [candidate.observation]);
  });
}

test("new binding requires observed review evidence", (t) => {
  const f = boundFixture(t);
  reject(f, f.binding, f.candidateState.record.suiteCommit);
});

for (const [field, value] of [
  ["repository", "elsewhere/private-mp3"],
  ["pullRequest", 999],
  ["reviewId", 999],
  ["reviewer", "unrecorded-reviewer"],
  ["reviewedHead", "f".repeat(40)],
  ["reviewedTree", "e".repeat(40)],
  ["baseRef", "not-main"],
  ["merged", false],
  ["mergeCommit", "d".repeat(40)],
  ["state", "DISMISSED"],
  ["state", "CHANGES_REQUESTED"],
]) {
  test(`binding rejects mismatched or ineligible observed review ${field}=${value}`, (t) => {
    const f = boundFixture(t);
    reject(f, f.binding, f.candidateState.record.suiteCommit, [{ ...f.candidateState.observation, [field]: value }]);
  });
}

test("review author cannot approve their own candidate", (t) => {
  const f = boundFixture(t);
  const observation = { ...f.candidateState.observation, author: f.candidateState.record.review.reviewer };
  reject(f, f.binding, f.candidateState.record.suiteCommit, [observation]);
});

test("record and observation agreeing on an invented reviewed tree still fail Git object validation", (t) => {
  const f = fixture(t);
  f.bootstrap();
  const candidate = f.candidate();
  candidate.record.review.reviewedTree = "a".repeat(40);
  candidate.observation.reviewedTree = candidate.record.review.reviewedTree;
  const source = f.bind(candidate);
  reject(f, source, candidate.record.suiteCommit, [candidate.observation]);
});

test("a suite symlink is rejected before extraction or package installation", (t) => {
  const f = fixture(t);
  const base = f.bootstrap();
  f.json(manifestPath, { contractRevision: "r4", independentCount: 3 });
  f.put("docs/testing/contracts/transport-r4.md", "# Synthetic contract r4\n");
  symlinkSync("../../server/src/parser.ts", join(f.root, suitePath, "product-link.ts"));
  const source = f.commit("candidate with unsafe suite symlink");
  reject(f, source, base);
});

test("unknown executable-looking documentation paths fail closed", (t) => {
  const f = boundFixture(t);
  f.put("docs/testing/helper.mjs", "// Must not gain a documentation exemption.\n");
  const source = f.commit("unclassified executable under docs");
  reject(f, source, f.binding);
});

test("a caller cannot select the predecessor when successor is required", (t) => {
  const f = boundFixture(t);
  f.put("server/src/parser.ts", "// Synthetic successor activation.\n");
  const source = f.commit("activate successor");
  assert.throws(() =>
    resolveAcceptance(f.root, {
      sourceRevision: source,
      trustedBase: f.binding,
      observedReviews: [],
      suiteCommit: f.genesis.suiteCommit,
    }),
  );
});

test("trusted base must be an ancestor of the exact source", (t) => {
  const f = boundFixture(t);
  reject(f, f.product, f.binding);
});

// Additional independently specified gaps accepted for r3; existing expectations above remain unchanged.
test("a valid reviewed tree differing from the actual squash tree cannot authorize binding", (t) => {
  const f = fixture(t);
  f.bootstrap();
  const candidate = f.candidate();
  // Replace only this disposable fixture's squash with a different valid test-only tree after review.
  f.git("reset", "--soft", "HEAD^");
  f.put(`${suitePath}/extra-after-review.mjs`, "// Added to the synthetic squash after its recorded review.\n");
  const alteredSquash = f.commit("test-only squash differs from the actual reviewed tree");
  candidate.record.suiteCommit = alteredSquash;
  candidate.record.suiteTree = f.git("rev-parse", `${alteredSquash}:${suitePath}`);
  candidate.observation.mergeCommit = alteredSquash;
  assert.notEqual(f.git("rev-parse", `${alteredSquash}^{tree}`), candidate.record.review.reviewedTree);
  const source = f.bind(candidate);
  reject(f, source, alteredSquash, [candidate.observation]);
});

for (const script of ["check:phase", "test:e2e", "preinstall"]) {
  test(`product change combined with package governance script ${script} is rejected`, (t) => {
    const f = boundFixture(t);
    f.put("server/src/parser.ts", "// Synthetic product change mixed with gate execution change.\n");
    f.json("package.json", { private: true, scripts: { [script]: "node scripts/replacement-gate.mjs" } });
    const source = f.commit(`mixed product and ${script} governance change`);
    reject(f, source, f.binding);
  });
}

/** Seed ordinary npm v3 identities before policy introduction; these packages are never installed or executed. */
function lockedFixture(t, { bind = true } = {}) {
  const f = fixture(t);
  const pkg = {
    name: "synthetic-product",
    version: "0.0.0",
    private: true,
    scripts: { build: "tsc -p tsconfig.json" },
    dependencies: { "fixture-runtime": "^1.0.0" },
    devDependencies: { "fixture-build-tool": "^1.0.0" },
  };
  const entry = (name, version, dev = false) => ({
    version,
    resolved: `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`,
    integrity: `sha512-${Buffer.alloc(64, version === "1.0.0" ? 1 : 2).toString("base64")}`,
    ...(dev ? { dev: true } : {}),
  });
  const lock = {
    name: pkg.name,
    version: pkg.version,
    lockfileVersion: 3,
    requires: true,
    packages: {
      "": {
        name: pkg.name,
        version: pkg.version,
        dependencies: structuredClone(pkg.dependencies),
        devDependencies: structuredClone(pkg.devDependencies),
      },
      "node_modules/fixture-runtime": entry("fixture-runtime", "1.0.0"),
      "node_modules/fixture-build-tool": entry("fixture-build-tool", "1.0.0", true),
    },
  };
  f.json("package.json", pkg);
  f.json("package-lock.json", lock);
  f.commit("synthetic locked product dependencies before transition policy");
  const bootstrapCommit = f.bootstrap();
  const candidateState = f.candidate();
  const binding = bind ? f.bind(candidateState) : null;
  return { ...f, pkg, lock, entry, bootstrapCommit, candidateState, binding };
}

test("matching root dependency and lock migration activates the bound successor", (t) => {
  const f = lockedFixture(t);
  f.pkg.dependencies["fixture-runtime"] = "^2.0.0";
  f.lock.packages[""].dependencies["fixture-runtime"] = "^2.0.0";
  f.lock.packages["node_modules/fixture-runtime"] = f.entry("fixture-runtime", "2.0.0");
  f.json("package.json", f.pkg);
  f.json("package-lock.json", f.lock);
  const source = f.commit("runtime dependency migration includes its corresponding lock");
  const result = f.resolve(source, f.binding);
  requireIdentity(result.required, f.candidateState.record);
  assert.equal(result.admission, "implementation");
  assert.equal(result.activationCommit, source);
});

for (const [name, dev] of [
  ["fixture-runtime", false],
  ["fixture-build-tool", true],
]) {
  test(`lock-only resolution change for ${name} activates successor acceptance`, (t) => {
    const f = lockedFixture(t);
    f.lock.packages[`node_modules/${name}`] = f.entry(name, "1.0.1", dev);
    f.json("package-lock.json", f.lock);
    const source = f.commit(`lock-only resolution change for ${name}`);
    const result = f.resolve(source, f.binding);
    requireIdentity(result.required, f.candidateState.record);
    assert.equal(result.activationCommit, source);
  });
}

test("lock-only product resolution cannot land between candidate and binding", (t) => {
  const f = lockedFixture(t, { bind: false });
  f.lock.packages["node_modules/fixture-runtime"] = f.entry("fixture-runtime", "1.0.1");
  f.json("package-lock.json", f.lock);
  const source = f.commit("runtime lock update while independent candidate remains unbound");
  reject(f, source, f.candidateState.record.suiteCommit);
});

test("lock-only activation persists through documentation and dependency reverts", (t) => {
  const f = lockedFixture(t);
  const original = structuredClone(f.lock);
  f.lock.packages["node_modules/fixture-runtime"] = f.entry("fixture-runtime", "1.0.1");
  f.json("package-lock.json", f.lock);
  const activation = f.commit("activate successor with changed locked package");
  f.json("package-lock.json", original);
  f.put("README.md", "Synthetic dependency revert does not revert required acceptance.\n");
  const source = f.commit("revert locked dependency with documentation");
  const result = f.resolve(source, activation);
  requireIdentity(result.required, f.candidateState.record);
  assert.equal(result.activationCommit, activation);
});

for (const script of ["check:phase", "preinstall", "unclassified-command"]) {
  test(`locked product resolution mixed with ${script} governance is rejected`, (t) => {
    const f = lockedFixture(t);
    f.lock.packages["node_modules/fixture-runtime"] = f.entry("fixture-runtime", "1.0.1");
    f.pkg.scripts[script] = "node scripts/replacement-gate.mjs";
    f.json("package.json", f.pkg);
    f.json("package-lock.json", f.lock);
    const source = f.commit(`locked product change mixed with ${script}`);
    reject(f, source, f.binding);
  });
}

for (const kind of ["malformed", "unsupported-version", "missing-packages", "deleted"]) {
  test(`root lock ${kind} fails closed instead of preserving predecessor acceptance`, (t) => {
    const f = lockedFixture(t);
    if (kind === "malformed") f.put("package-lock.json", "{invalid lock\n");
    else if (kind === "deleted") rmSync(join(f.root, "package-lock.json"));
    else {
      if (kind === "unsupported-version") f.lock.lockfileVersion = 2;
      if (kind === "missing-packages") delete f.lock.packages;
      f.json("package-lock.json", f.lock);
    }
    const source = f.commit(`unusable root lock ${kind}`);
    reject(f, source, f.binding);
  });
}

for (const kind of [
  "file-resolution",
  "file-dependency",
  "link",
  "outside-node-modules",
  "path-traversal",
  "workspace",
]) {
  test(`root lock ${kind} install source cannot conceal an unclassified local executable`, (t) => {
    const f = lockedFixture(t);
    const item = f.lock.packages["node_modules/fixture-runtime"];
    if (kind === "file-resolution") item.resolved = "file:../local-runtime";
    if (kind === "file-dependency") {
      f.pkg.dependencies["fixture-runtime"] = "file:../local-runtime";
      f.lock.packages[""].dependencies["fixture-runtime"] = "file:../local-runtime";
      f.json("package.json", f.pkg);
    }
    if (kind === "link") {
      f.lock.packages["node_modules/fixture-runtime"] = { resolved: "local-runtime", link: true };
    }
    if (kind === "outside-node-modules") f.lock.packages["local-runtime"] = { version: "1.0.0" };
    if (kind === "path-traversal") f.lock.packages["node_modules/../../scripts"] = { version: "1.0.0" };
    if (kind === "workspace") {
      f.pkg.dependencies["fixture-runtime"] = "workspace:*";
      f.lock.packages[""].dependencies["fixture-runtime"] = "workspace:*";
      f.json("package.json", f.pkg);
    }
    f.json("package-lock.json", f.lock);
    const source = f.commit(`unapproved local installation path ${kind}`);
    reject(f, source, f.binding);
  });
}

// Reserve only the adopted roadmap's policy path. GATE classifies it; VER-01 will validate schema and allocation.
test("standalone root release policy addition is governance and leaves current acceptance unchanged", (t) => {
  const f = fixture(t);
  const base = f.bootstrap();
  f.json("release-policy.json", { schemaVersion: 1, strategy: "global-first-parent-ordinal", line: "0.1" });
  const source = f.commit("standalone release policy introduction");
  const result = f.resolve(source, base);
  assert.equal(result.admission, "governance");
  requireIdentity(result.required, f.genesis);
  assert.equal(result.candidate, null);
  assert.equal(result.pendingBinding, null);
  assert.equal(result.activationCommit, null);
});

test("standalone root release policy change remains governance rather than product activation", (t) => {
  const f = fixture(t);
  f.bootstrap();
  f.json("release-policy.json", { schemaVersion: 1, strategy: "global-first-parent-ordinal", line: "0.1" });
  const base = f.commit("existing exact root release policy path");
  f.json("release-policy.json", { schemaVersion: 1, strategy: "global-first-parent-ordinal", line: "0.2" });
  const source = f.commit("standalone release line selection");
  const result = f.resolve(source, base);
  assert.equal(result.admission, "governance");
  requireIdentity(result.required, f.genesis);
  assert.equal(result.activationCommit, null);
});

test("release policy addition or change cannot be mixed with product-affecting implementation", (t) => {
  for (const existing of [false, true]) {
    const f = fixture(t);
    let base = f.bootstrap();
    if (existing) {
      f.json("release-policy.json", { schemaVersion: 1, strategy: "global-first-parent-ordinal", line: "0.1" });
      base = f.commit("existing release policy before mixed proposal");
    }
    f.json("release-policy.json", {
      schemaVersion: 1,
      strategy: "global-first-parent-ordinal",
      line: existing ? "0.2" : "0.1",
    });
    f.put("server/src/parser.ts", "// Product change cannot select its own release governance.\n");
    const source = f.commit("forbidden mixed release policy and product change");
    reject(f, source, base);
  }
});

test("the exact release policy reservation does not admit arbitrary root or infrastructure JSON", (t) => {
  for (const path of ["another-policy.json", "infra/release-policy.json"]) {
    const f = fixture(t);
    const base = f.bootstrap();
    f.json(path, { schemaVersion: 1, strategy: "global-first-parent-ordinal", line: "0.1" });
    const source = f.commit("unclassified JSON policy remains forbidden");
    reject(f, source, base);
  }
});
