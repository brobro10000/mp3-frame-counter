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

// These two named build commands are product inputs, specified before the narrow classifier amendment. Arbitrary
// build-prefixed commands remain governance; a naming convention cannot silently enlarge trusted executable scope.
for (const script of ["build:server", "build:frontend"]) {
  test(`separately reviewed ${script} command is a product input without admitting arbitrary build commands`, (t) => {
    const f = boundFixture(t);
    f.put("frontend/src/main.tsx", "// Synthetic browser build input; never executed.\n");
    f.json("package.json", { private: true, scripts: { [script]: "node synthetic-build.mjs" } });
    const source = f.commit(`bounded product and ${script} command`);
    const result = f.resolve(source, f.binding);
    assert.equal(result.admission, "implementation");
    requireIdentity(result.required, f.candidateState.record);
    assert.equal(result.activationCommit, source);
    f.put("frontend/src/main.tsx", "// Another synthetic browser input.\n");
    f.json("package.json", {
      private: true,
      scripts: { [script]: "node synthetic-build.mjs", "build:unreviewed": "node replacement-gate.mjs" },
    });
    const mixed = f.commit("unreviewed command cannot join the bounded product change");
    reject(f, mixed, source);
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

// These literal reservations are independent expectations, not imported classifier output. Synthetic file contents
// exercise admission only; no Terraform is interpreted and no provider or application is invoked.
const hostedAccessPaths = [
  "infra/cloud/access/versions.tf",
  "infra/cloud/access/variables.tf",
  "infra/cloud/access/main.tf",
  "infra/cloud/access/outputs.tf",
  "infra/cloud/access/.terraform.lock.hcl",
];
const hostedRuntimePaths = [
  "infra/cloud/runtime/versions.tf",
  "infra/cloud/runtime/variables.tf",
  "infra/cloud/runtime/main.tf",
  "infra/cloud/runtime/outputs.tf",
  "infra/cloud/runtime/.terraform.lock.hcl",
];

test("hosted IaC paths: dormant governance preserves genesis and an existing pending binding", (t) => {
  const f = fixture(t);
  const legacy = f.resolve(f.product, f.genesis.suiteCommit);
  requireIdentity(legacy.required, f.genesis);
  assert.equal(legacy.admission, "legacy");
  const bootstrap = f.bootstrap();
  assert.equal(f.resolve(bootstrap, f.product).admission, "bootstrap");
  f.put("scripts/hosted-policy.mjs", "// Synthetic dormant governance marker; never executed.\n");
  const governance = f.commit("ordinary governance needs no IaC or successor files");
  const dormant = f.resolve(governance, bootstrap);
  assert.equal(dormant.admission, "governance");
  requireIdentity(dormant.required, f.genesis);
  assert.equal(dormant.candidate, null);
  assert.equal(dormant.pendingBinding, null);
  assert.equal(dormant.activationCommit, null);
  const candidate = f.candidate();
  const binding = f.bind(candidate);
  const admitted = f.resolve(binding, candidate.record.suiteCommit, [candidate.observation]);
  assert.equal(admitted.admission, "binding");
  f.put("scripts/hosted-policy.mjs", "// Updated dormant governance marker; never executed.\n");
  const source = f.commit("governance preserves pending successor");
  const pending = f.resolve(source, binding);
  assert.equal(pending.admission, "governance");
  requireIdentity(pending.required, f.genesis);
  requireIdentity(pending.pendingBinding, candidate.record);
  assert.equal(pending.candidate, null);
  assert.equal(pending.bindingCommit, binding);
  assert.equal(pending.activationCommit, null);
});

test("hosted IaC paths: each access literal adds and changes governance without activating a pending suite", (t) => {
  for (const path of hostedAccessPaths) {
    const f = boundFixture(t);
    assert.equal(
      f.resolve(f.binding, f.candidateState.record.suiteCommit, [f.candidateState.observation]).admission,
      "binding",
    );
    let base = f.binding;
    for (const change of ["addition", "change"]) {
      f.put(path, `# Synthetic access ${change}; never interpreted.\n`);
      const source = f.commit(`${change} exact access path ${path}`);
      const result = f.resolve(source, base);
      assert.equal(result.admission, "governance", path);
      requireIdentity(result.required, f.genesis);
      requireIdentity(result.pendingBinding, f.candidateState.record);
      assert.equal(result.candidate, null);
      assert.equal(result.bindingCommit, f.binding);
      assert.equal(result.activationCommit, null);
      base = source;
    }
  }
});

test("hosted IaC paths: each runtime literal activates once and preserves required acceptance on descendants", (t) => {
  for (const path of hostedRuntimePaths) {
    const f = boundFixture(t);
    assert.equal(
      f.resolve(f.binding, f.candidateState.record.suiteCommit, [f.candidateState.observation]).admission,
      "binding",
    );
    f.put(path, "# Synthetic initial runtime configuration; never interpreted.\n");
    const activation = f.commit(`add exact runtime path ${path}`);
    let result = f.resolve(activation, f.binding);
    assert.equal(result.admission, "implementation", path);
    requireIdentity(result.required, f.candidateState.record);
    assert.equal(result.pendingBinding, null);
    assert.equal(result.candidate, null);
    assert.equal(result.bindingCommit, f.binding);
    assert.equal(result.activationCommit, activation);
    f.put(path, "# Synthetic changed runtime configuration; never interpreted.\n");
    const changed = f.commit(`change exact runtime path ${path}`);
    result = f.resolve(changed, activation);
    assert.equal(result.admission, "implementation", path);
    requireIdentity(result.required, f.candidateState.record);
    assert.equal(result.activationCommit, activation);
    assert.equal(result.pendingBinding, null);
    f.put("README.md", "Documentation after runtime activation.\n");
    const descendant = f.commit("runtime successor persists through documentation");
    result = f.resolve(descendant, changed);
    assert.equal(result.admission, "documentation");
    requireIdentity(result.required, f.candidateState.record);
    assert.equal(result.activationCommit, activation);

    const ordinary = fixture(t);
    const base = ordinary.bootstrap();
    assert.equal(ordinary.resolve(base, ordinary.product).admission, "bootstrap");
    ordinary.put(path, "# Synthetic runtime input without a pending successor.\n");
    const source = ordinary.commit("runtime change still requires the current full suite");
    result = ordinary.resolve(source, base);
    assert.equal(result.admission, "implementation", path);
    requireIdentity(result.required, ordinary.genesis);
    assert.equal(result.pendingBinding, null);
    assert.equal(result.activationCommit, null);
  }
});

test("hosted IaC paths: mixed runtime and governance is refused while access may accompany governance", (t) => {
  const allowed = boundFixture(t);
  allowed.put(hostedAccessPaths[2], "# Synthetic access policy.\n");
  allowed.put("scripts/hosted-policy.mjs", "// Synthetic governance only.\n");
  allowed.put("docs/deployment/hosted-policy.md", "# Synthetic policy explanation\n");
  const source = allowed.commit("access plus governance and documentation");
  const result = allowed.resolve(source, allowed.binding);
  assert.equal(result.admission, "governance");
  requireIdentity(result.required, allowed.genesis);
  requireIdentity(result.pendingBinding, allowed.candidateState.record);
  assert.equal(result.activationCommit, null);
  for (const governancePath of [hostedAccessPaths[2], "scripts/hosted-policy.mjs", ".github/workflows/ci.yml"]) {
    const f = boundFixture(t);
    f.put(hostedRuntimePaths[2], "# Synthetic runtime input cannot change admission authority.\n");
    f.put(governancePath, "# Synthetic governance must remain separate.\n");
    const mixed = f.commit("forbidden runtime and governance mixture");
    reject(f, mixed, f.binding);
  }
});

test("hosted IaC paths: candidate and binding boundaries remain separate from either IaC class", (t) => {
  const unbound = fixture(t);
  const base = unbound.bootstrap();
  const candidate = unbound.candidate();
  const current = unbound.resolve(candidate.record.suiteCommit, base);
  assert.equal(current.admission, "candidate");
  requireIdentity(current.required, unbound.genesis);
  requireIdentity(current.candidate, candidate.record);
  unbound.put(hostedRuntimePaths[2], "# Runtime cannot precede separate binding.\n");
  const earlyRuntime = unbound.commit("runtime before candidate binding");
  reject(unbound, earlyRuntime, candidate.record.suiteCommit);
  for (const path of [hostedAccessPaths[2], hostedRuntimePaths[2]]) {
    const mixedCandidate = fixture(t);
    const candidateBase = mixedCandidate.bootstrap();
    assert.equal(mixedCandidate.resolve(candidateBase, mixedCandidate.product).admission, "bootstrap");
    const proposed = mixedCandidate.candidate({ mixedPath: path });
    reject(mixedCandidate, proposed.record.suiteCommit, candidateBase);
    const mixedBinding = fixture(t);
    mixedBinding.bootstrap();
    const independent = mixedBinding.candidate();
    mixedBinding.put(path, "# IaC cannot accompany binding authority.\n");
    const binding = mixedBinding.bind(independent);
    reject(mixedBinding, binding, independent.record.suiteCommit, [independent.observation]);
  }
  const pending = boundFixture(t);
  pending.put(hostedAccessPaths[2], "# Access may change while one successor remains pending.\n");
  const access = pending.commit("access leaves the existing pending slot occupied");
  requireIdentity(pending.resolve(access, pending.binding).pendingBinding, pending.candidateState.record);
  const second = pending.candidate({ id: "docs-r5", revision: "r5", predecessor: "transport-r4" });
  reject(pending, second.record.suiteCommit, access);
  const rewritten = boundFixture(t);
  rewritten.put(hostedAccessPaths[2], "# Access cannot conceal a registry rewrite.\n");
  rewritten.registry.transitions[0].review.reviewId += 1;
  rewritten.json(registryPath, rewritten.registry);
  const rewrite = rewritten.commit("access with a rewritten historical binding");
  reject(rewritten, rewrite, rewritten.binding);
});

test("hosted IaC paths: neighboring filenames and directories remain unclassified", (t) => {
  for (const path of [
    "infra/cloud/access/backend.tf",
    "infra/cloud/access/Main.tf",
    "infra/cloud/access/main.tf.json",
    "infra/cloud/access/.terraform.lock.hcl.backup",
    "infra/cloud/access/modules/main.tf",
    "infra/cloud/runtime/terraform.tfvars",
    "infra/cloud/runtime/terraform.tfstate",
    "infra/cloud/runtime/deploy.mjs",
    "infra/cloud/runtime/config.yaml",
    "infra/cloud/runtime/other.hcl",
    "infra/cloud/Runtime/main.tf",
    "infra/cloud/stage/main.tf",
    "infra/cloud/main.tf",
    "infra/cloud-access/main.tf",
  ]) {
    const f = fixture(t);
    const base = f.bootstrap();
    assert.equal(f.resolve(base, f.product).admission, "bootstrap");
    f.put(path, "# Unknown input cannot acquire path authority.\n");
    const source = f.commit(`unknown path ${path}`);
    reject(f, source, base);
  }
});

test("hosted IaC paths: historical replay ignores later files but rejects unknown history and missing objects", (t) => {
  const f = fixture(t);
  const legacy = f.resolve(f.product, f.genesis.suiteCommit);
  requireIdentity(legacy.required, f.genesis);
  assert.equal(legacy.admission, "legacy");
  const bootstrap = f.bootstrap();
  const dormant = f.resolve(bootstrap, f.product);
  assert.equal(dormant.admission, "bootstrap");
  for (const path of [...hostedAccessPaths, ...hostedRuntimePaths]) f.put(path, "# Later fixture input.\n");
  f.commit("later mixed IaC history must not replace an earlier selected source");
  f.json(manifestPath, { contractRevision: "uncommitted-wrong-suite" });
  f.json(registryPath, { schemaVersion: 99 });
  assert.deepEqual(f.resolve(f.product, f.genesis.suiteCommit), legacy);
  assert.deepEqual(f.resolve(bootstrap, f.product), dormant);
  reject(f, "f".repeat(40), f.product);
  reject(f, f.product, "e".repeat(40));

  const unknown = fixture(t);
  const known = unknown.bootstrap();
  assert.equal(unknown.resolve(known, unknown.product).admission, "bootstrap");
  unknown.put("infra/cloud/access/unapproved.tf", "# Never an approved path.\n");
  const unknownBase = unknown.commit("unknown IaC in committed history");
  unknown.put("README.md", "Documentation does not authorize unknown history.\n");
  const descendant = unknown.commit("documentation after unclassified history");
  reject(unknown, unknownBase, unknownBase);
  reject(unknown, descendant, unknownBase);
});

// Bootstrap predates GATE-01. These independent literals reserve only the root-adopted IAM and Markdown paths.
const bootstrapIamPath = "infra/cloud/bootstrap/main.tf";
const bootstrapReadmePath = "infra/cloud/bootstrap/README.md";

function bootstrapIamPendingFixture(t, existingPath) {
  const f = fixture(t);
  let predecessor = f.product;
  if (existingPath) {
    f.put(existingPath, "# Synthetic bootstrap file already present before transition policy.\n");
    predecessor = f.commit("historical bootstrap precedes transition admission");
  }
  const base = f.bootstrap();
  assert.equal(f.resolve(base, predecessor).admission, "bootstrap");
  const candidate = f.candidate({ id: "hosted-v1", revision: "hosted-v1" });
  const binding = f.bind(candidate);
  const before = f.resolve(binding, candidate.record.suiteCommit, [candidate.observation]);
  assert.equal(before.admission, "binding");
  requireIdentity(before.required, f.genesis);
  requireIdentity(before.pendingBinding, candidate.record);
  assert.equal(before.activationCommit, null);
  return { ...f, candidateState: candidate, binding, before };
}

function requireBootstrapPending(result, f, kind) {
  assert.equal(result.admission, kind);
  assert.deepEqual(result.required, f.before.required);
  assert.deepEqual(result.pendingBinding, f.before.pendingBinding);
  assert.equal(result.candidate, null);
  assert.equal(result.bindingCommit, f.binding);
  assert.equal(result.activationCommit, null);
  assert.equal(result.policySha256, f.before.policySha256);
}

for (const [path, kind] of [
  [bootstrapIamPath, "governance"],
  [bootstrapReadmePath, "documentation"],
]) {
  for (const operation of ["addition", "change", "removal"]) {
    test(`bootstrap IAM paths: exact ${path} ${operation} is ${kind} and preserves pending hosted identity`, (t) => {
      const f = bootstrapIamPendingFixture(t, operation === "addition" ? undefined : path);
      if (operation === "removal") rmSync(join(f.root, path));
      else f.put(path, `# Synthetic bootstrap ${operation}; never executed or applied.\n`);
      const source = f.commit(`${operation} the exact reserved bootstrap path`);
      if (operation !== "removal") assert.match(f.git("ls-tree", source, "--", path), /^100644 blob /);
      else assert.equal(f.git("ls-tree", source, "--", path), "");
      requireBootstrapPending(f.resolve(source, f.binding), f, kind);
      // Once admitted, trusted history must preserve the same identities on ordinary documentation descendants.
      f.put("README.md", `Synthetic documentation after bootstrap ${operation}.\n`);
      const descendant = f.commit("documentation cannot activate the pending hosted successor");
      requireBootstrapPending(f.resolve(descendant, source), f, "documentation");
    });
  }
  test(`bootstrap IAM paths: exact ${path} needs no pending successor`, (t) => {
    const f = fixture(t);
    const base = f.bootstrap();
    const before = f.resolve(base, f.product);
    f.put(path, "# Synthetic standalone bootstrap change.\n");
    const source = f.commit("reserved bootstrap path without a candidate");
    const result = f.resolve(source, base);
    assert.equal(result.admission, kind);
    assert.deepEqual(result.required, before.required);
    assert.equal(result.pendingBinding, null);
    assert.equal(result.candidate, null);
    assert.equal(result.bindingCommit, null);
    assert.equal(result.activationCommit, null);
  });
}

test("bootstrap IAM paths: the exact pair may accompany other governance without activating hosted acceptance", (t) => {
  const f = bootstrapIamPendingFixture(t);
  f.put(bootstrapIamPath, "# Synthetic operational IAM governance.\n");
  f.put(bootstrapReadmePath, "# Synthetic governance explanation\n");
  f.put("scripts/iam-expectations.mjs", "// Synthetic test/governance marker; never executed.\n");
  const source = f.commit("bootstrap governance with its documentation and independent expectations");
  requireBootstrapPending(f.resolve(source, f.binding), f, "governance");
});

test("bootstrap IAM paths: exact README may accompany product and cannot suppress normal hosted activation", (t) => {
  const f = bootstrapIamPendingFixture(t);
  f.put("server/src/parser.ts", "// Synthetic product input alone is a valid implementation.\n");
  const product = f.commit("valid product counterpart");
  const valid = f.resolve(product, f.binding);
  assert.equal(valid.admission, "implementation");
  requireIdentity(valid.required, f.candidateState.record);
  f.put(bootstrapReadmePath, "# Documentation may accompany a product proposal\n");
  const source = f.commit("documentation remains ordinary documentation beside product");
  const result = f.resolve(source, f.binding);
  assert.equal(result.admission, "implementation");
  assert.deepEqual(result.required, valid.required);
  assert.equal(result.pendingBinding, null);
  assert.equal(result.candidate, null);
  assert.equal(result.bindingCommit, f.binding);
  assert.equal(result.activationCommit, source);
});

test("bootstrap IAM paths: exact README may accompany a separately reviewed binding", (t) => {
  const f = fixture(t);
  const base = f.bootstrap();
  const candidate = f.candidate({ id: "hosted-v1", revision: "hosted-v1" });
  assert.equal(f.resolve(candidate.record.suiteCommit, base).admission, "candidate");
  f.put(bootstrapReadmePath, "# Documentation accompanying the independent binding\n");
  const binding = f.bind(candidate);
  const result = f.resolve(binding, candidate.record.suiteCommit, [candidate.observation]);
  assert.equal(result.admission, "binding");
  requireIdentity(result.required, f.genesis);
  requireIdentity(result.pendingBinding, candidate.record);
  assert.equal(result.candidate, null);
  assert.equal(result.bindingCommit, binding);
  assert.equal(result.activationCommit, null);
});

test("bootstrap IAM paths: main.tf mixed with product reaches the existing separate-admission refusal", (t) => {
  for (const productPath of ["server/src/parser.ts", "infra/cloud/runtime/main.tf"]) {
    const f = bootstrapIamPendingFixture(t);
    f.put(productPath, "# Synthetic product-only counterpart; never executed.\n");
    const product = f.commit("valid product-only counterpart");
    const valid = f.resolve(product, f.binding);
    assert.equal(valid.admission, "implementation");
    requireIdentity(valid.required, f.candidateState.record);
    f.put(bootstrapIamPath, "# Governance cannot join the same proposed product delta.\n");
    const mixed = f.commit("product and bootstrap IAM governance in one proposed delta");
    assert.throws(() => f.resolve(mixed, f.binding), /Product and governance changes require separate admission/);
  }
});

for (const path of [bootstrapIamPath, bootstrapReadmePath]) {
  test(`bootstrap IAM paths: ${path} cannot join an independent suite candidate`, (t) => {
    const f = fixture(t);
    const base = f.bootstrap();
    const candidate = f.candidate({ id: "hosted-v1", revision: "hosted-v1" });
    const valid = f.resolve(candidate.record.suiteCommit, base);
    assert.equal(valid.admission, "candidate");
    requireIdentity(valid.candidate, candidate.record);
    f.put(path, "# Unrelated path cannot join the suite-and-contract-only proposal.\n");
    const mixed = f.commit("candidate plus unrelated bootstrap path");
    assert.throws(() => f.resolve(mixed, base), /Candidate must contain only suite and contract changes/);
  });
}

test("bootstrap IAM paths: main.tf mixed with binding reaches the existing separate-binding refusal", (t) => {
  const f = bootstrapIamPendingFixture(t);
  f.put(bootstrapIamPath, "# Bootstrap governance cannot join binding authority.\n");
  const mixed = f.commit("binding and bootstrap governance in one proposed delta");
  assert.throws(
    () => f.resolve(mixed, f.candidateState.record.suiteCommit, [f.candidateState.observation]),
    /Binding must be separate from suite, product and gate changes/,
  );
});

test("bootstrap IAM paths: governance after an unbound candidate preserves that candidate without activating it", (t) => {
  const f = fixture(t);
  const base = f.bootstrap();
  const candidate = f.candidate({ id: "hosted-v1", revision: "hosted-v1" });
  const before = f.resolve(candidate.record.suiteCommit, base);
  assert.equal(before.admission, "candidate");
  f.put(bootstrapIamPath, "# Independent governance while the reviewed suite still awaits binding.\n");
  const source = f.commit("governance leaves an unbound candidate unchanged");
  const result = f.resolve(source, candidate.record.suiteCommit);
  assert.equal(result.admission, "governance");
  assert.deepEqual(result.required, before.required);
  assert.deepEqual(result.candidate, before.candidate);
  assert.equal(result.pendingBinding, null);
  assert.equal(result.activationCommit, null);
  f.put("server/src/parser.ts", "// Product must still wait for separate binding.\n");
  const product = f.commit("product still cannot precede candidate binding");
  assert.throws(() => f.resolve(product, source), /Product cannot change before candidate binding/);
});

test("bootstrap IAM paths: adjacent filenames and executable extensions remain unclassified", (t) => {
  for (const path of [
    "infra/cloud/bootstrap/versions.tf",
    "infra/cloud/bootstrap/variables.tf",
    "infra/cloud/bootstrap/outputs.tf",
    "infra/cloud/bootstrap/.terraform.lock.hcl",
    "infra/cloud/bootstrap/backend.tf",
    "infra/cloud/bootstrap/override.tf",
    "infra/cloud/bootstrap/main.tf.json",
    "infra/cloud/bootstrap/main.tf.backup",
    "infra/cloud/bootstrap/Main.tf",
    "infra/cloud/bootstrap/README.mjs",
    "infra/cloud/bootstrap/README.md.mjs",
    "infra/cloud/bootstrap/readme.md",
    "infra/cloud/bootstrap/modules/main.tf",
    "infra/cloud/bootstrap/modules/README.md",
    "infra/cloud/bootstrap-extra/main.tf",
    "infra/cloud/Bootstrap/README.md",
  ]) {
    const f = fixture(t);
    const base = f.bootstrap();
    f.put("README.md", "A valid ordinary documentation counterpart.\n");
    const documentation = f.commit("known documentation remains admitted");
    assert.equal(f.resolve(documentation, base).admission, "documentation");
    f.put(path, "# Near-name paths do not inherit either exact reservation.\n");
    const source = f.commit("unclassified bootstrap neighbor");
    assert.throws(() => f.resolve(source, documentation), /Unclassified acceptance admission path:/);
  }
});

test("bootstrap IAM paths: changing or removing a historical neighboring file remains unclassified", (t) => {
  for (const operation of ["change", "removal"]) {
    const f = fixture(t);
    const path = "infra/cloud/bootstrap/variables.tf";
    f.put(path, "# Existing pre-policy file is not a new path reservation.\n");
    const historical = f.commit("historical unclassified bootstrap neighbor");
    const base = f.bootstrap();
    assert.equal(f.resolve(base, historical).admission, "bootstrap");
    if (operation === "removal") rmSync(join(f.root, path));
    else f.put(path, "# Changed unknown neighbor.\n");
    const source = f.commit(`${operation} unclassified historical neighbor`);
    assert.throws(() => f.resolve(source, base), /Unclassified acceptance admission path:/);
  }
});

test("bootstrap IAM paths: both exact paths reject symlinks before path-kind admission", (t) => {
  for (const path of [bootstrapIamPath, bootstrapReadmePath]) {
    const f = fixture(t);
    const base = f.bootstrap();
    f.put("README.md", "Valid regular documentation control.\n");
    const regular = f.commit("regular blob counterpart");
    assert.match(f.git("ls-tree", regular, "--", "README.md"), /^100644 blob /);
    assert.equal(f.resolve(regular, base).admission, "documentation");
    mkdirSync(dirname(join(f.root, path)), { recursive: true });
    symlinkSync("../../../README.md", join(f.root, path));
    const source = f.commit("reserved bootstrap path is a nonregular Git blob");
    assert.match(f.git("ls-tree", source, "--", path), /^120000 blob /);
    assert.throws(() => f.resolve(source, regular), /Requires regular file:/);
  }
});

test("bootstrap IAM paths: later reserved files cannot substitute for an earlier historical selection", (t) => {
  const f = fixture(t);
  const base = f.bootstrap();
  const before = f.resolve(base, f.product);
  f.put(bootstrapIamPath, "# Later operational file.\n");
  f.put(bootstrapReadmePath, "# Later operational documentation\n");
  f.commit("later working HEAD is not selected historical authority");
  f.json(manifestPath, { contractRevision: "uncommitted-wrong-suite" });
  assert.deepEqual(f.resolve(base, f.product), before);
});

// Independent r5 backend-product admission amendment, frozen before the classifier implementation. These literals
// reserve only the reviewed product inputs; no product command or synthetic smoke script is executed by this fixture.
const backendProductAdmissionScripts = {
  "test:server": "npm run build:server && cd server && node --test tests/*.test.ts",
  "test:frontend": "npm run build:frontend && cd frontend && node --test tests/*.test.ts",
  "lint:source": "oxlint --deny-warnings server/src server/tests frontend/src frontend/tests",
  "check:openapi": "redocly lint --config redocly.yaml dist/openapi.json",
};
const backendProductAdmissionPaths = [".oxlintrc.json", "redocly.yaml", "scripts/smoke-local.mjs"];

function putBackendProductAdmissionInputs(f, scripts = backendProductAdmissionScripts) {
  f.put(".oxlintrc.json", '{"options":{"denyWarnings":true}}\n');
  f.put("redocly.yaml", "extends: [recommended]\n");
  f.put("scripts/smoke-local.mjs", "// Synthetic local smoke input; never executed.\n");
  f.json("package.json", { private: true, scripts });
}

test("backend product admission r5: exact lint and OpenAPI configs activate required successor acceptance", (t) => {
  for (const path of backendProductAdmissionPaths.slice(0, 2)) {
    const f = boundFixture(t);
    f.put(path, path.endsWith(".json") ? '{"synthetic":true}\n' : "synthetic: true\n");
    const source = f.commit(`reviewed product config ${path}`);
    const result = f.resolve(source, f.binding);
    assert.equal(result.admission, "implementation");
    requireIdentity(result.required, f.candidateState.record);
    assert.equal(result.activationCommit, source);
  }
});

test("backend product admission r5: config neighbors remain unclassified and reserved inputs require regular blobs", (t) => {
  for (const path of [
    "oxlintrc.json",
    ".oxlintrc.yaml",
    ".oxlintrc.json.mjs",
    "redocly.yml",
    "Redocly.yaml",
    "redocly.json",
  ]) {
    const f = boundFixture(t);
    f.put(path, "Synthetic neighboring input must not inherit the exact reservation.\n");
    const source = f.commit(`unreviewed config neighbor ${path}`);
    assert.throws(() => f.resolve(source, f.binding), /Unclassified acceptance admission path:/);
  }
  for (const path of backendProductAdmissionPaths) {
    const f = boundFixture(t);
    mkdirSync(dirname(join(f.root, path)), { recursive: true });
    symlinkSync(path.startsWith("scripts/") ? "../README.md" : "README.md", join(f.root, path));
    const source = f.commit(`nonregular reserved input ${path}`);
    assert.throws(() => f.resolve(source, f.binding), /Requires regular file:/);
  }
});

test("backend product admission r5: four exact application check commands are product inputs", (t) => {
  for (const [name, command] of Object.entries(backendProductAdmissionScripts)) {
    const f = boundFixture(t);
    f.json("package.json", { private: true, scripts: { [name]: command } });
    const source = f.commit(`exact product command ${name}`);
    const result = f.resolve(source, f.binding);
    assert.equal(result.admission, "implementation");
    requireIdentity(result.required, f.candidateState.record);
    assert.equal(result.activationCommit, source);
  }
});

test("backend product admission r5: reserved command names cannot admit altered executable values", (t) => {
  for (const [name, command] of Object.entries(backendProductAdmissionScripts)) {
    const f = boundFixture(t);
    f.put("server/src/parser.ts", "// Synthetic product counterpart; never executed.\n");
    f.json("package.json", { private: true, scripts: { [name]: `${command} && node scripts/replacement-gate.mjs` } });
    const source = f.commit(`unreviewed executable value for ${name}`);
    assert.throws(() => f.resolve(source, f.binding), /Product and governance changes require separate admission/);
  }
});

test("backend product admission r5: local smoke is an exact product path while neighboring scripts stay governance", (t) => {
  const f = boundFixture(t);
  f.put("scripts/smoke-local.mjs", "// Synthetic changed audio-count local smoke input; never executed.\n");
  const activation = f.commit("reviewed local smoke product input");
  const result = f.resolve(activation, f.binding);
  assert.equal(result.admission, "implementation");
  requireIdentity(result.required, f.candidateState.record);
  assert.equal(result.activationCommit, activation);
  for (const path of ["scripts/smoke-local-extra.mjs", "scripts/smoke-local.test.mjs", "scripts/check-openapi.mjs"]) {
    f.put("server/src/parser.ts", `// Synthetic product counterpart for ${path}.\n`);
    f.put(path, "// A neighboring executable remains a governance input.\n");
    const source = f.commit(`neighbor script cannot join product ${path}`);
    assert.throws(() => f.resolve(source, activation), /Product and governance changes require separate admission/);
    f.git("reset", "--hard", activation);
  }
});

test("backend product admission r5: reviewed product inputs cannot join governance command or workflow changes", (t) => {
  for (const name of ["validate", "test:tooling", "preinstall", "check:unreviewed"]) {
    const f = boundFixture(t);
    putBackendProductAdmissionInputs(f, {
      ...backendProductAdmissionScripts,
      [name]: "node scripts/replacement-gate.mjs",
    });
    const source = f.commit(`product inputs mixed with governance command ${name}`);
    assert.throws(() => f.resolve(source, f.binding), /Product and governance changes require separate admission/);
  }
  for (const path of [".github/workflows/ci.yml", "scripts/run-ci-lane.mjs", "Makefile"]) {
    const f = boundFixture(t);
    putBackendProductAdmissionInputs(f);
    f.put(path, "# Synthetic governance counterpart.\n");
    const source = f.commit(`product inputs mixed with governance path ${path}`);
    assert.throws(() => f.resolve(source, f.binding), /Product and governance changes require separate admission/);
  }
});

test("backend product admission r5: exact product reservations do not enter candidate or binding lanes", (t) => {
  for (const path of backendProductAdmissionPaths) {
    const f = fixture(t);
    const base = f.bootstrap();
    const candidate = f.candidate({ mixedPath: path });
    assert.throws(
      () => f.resolve(candidate.record.suiteCommit, base),
      /Candidate must contain only suite and contract/,
    );
  }
  const f = fixture(t);
  f.bootstrap();
  const candidate = f.candidate();
  putBackendProductAdmissionInputs(f);
  const source = f.bind(candidate);
  assert.throws(
    () => f.resolve(source, candidate.record.suiteCommit, [candidate.observation]),
    /Product and governance changes require separate admission/,
  );
});

test("backend product admission r5: product removal retains activation and later files cannot rewrite historical selection", (t) => {
  const f = boundFixture(t);
  const before = f.resolve(f.product, f.genesis.suiteCommit);
  putBackendProductAdmissionInputs(f);
  const activation = f.commit("activate exact backend product reservations");
  requireIdentity(f.resolve(activation, f.binding).required, f.candidateState.record);
  for (const path of backendProductAdmissionPaths) rmSync(join(f.root, path));
  f.json("package.json", { private: true, scripts: {} });
  const removal = f.commit("remove reviewed product inputs without downgrading acceptance");
  const result = f.resolve(removal, activation);
  assert.equal(result.admission, "implementation");
  assert.equal(result.activationCommit, activation);
  requireIdentity(result.required, f.candidateState.record);
  assert.deepEqual(f.resolve(f.product, f.genesis.suiteCommit), before);
  const legacy = fixture(t);
  putBackendProductAdmissionInputs(legacy);
  const historical = legacy.commit("historical pre-policy product metadata");
  const policy = legacy.bootstrap();
  const replay = legacy.resolve(policy, historical);
  assert.equal(replay.admission, "bootstrap");
  requireIdentity(replay.required, legacy.genesis);
});
