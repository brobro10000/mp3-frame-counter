/**
 * Independent immutable profile-source and real-controller expectations for the frozen hosted-profile protocol r17.
 * Run `node --test scripts/acceptance-profile-source.test.mjs` with pinned Node after implementation is available.
 * Disposable Git histories model independently declared identities; expected resolver states are authored here, not
 * manufactured by the module under test. Inert npm and archive witnesses expose controller ordering without installing
 * packages, launching browsers, running product/acceptance code, contacting a network or invoking Docker.
 * Every rejection checks public availability first, so a missing implementation cannot impersonate intended refusal.
 * r17.1: absent hosted inventories become null and fail declaration validation; absent non-genesis local inventory,
 * nonregular/unreadable bytes, malformed UTF-8/JSON and provenance/context/lineage failures are source errors.
 * r17.3: exact genesis includes immutable historical metadata beyond six core identity fields; it grants no new review.
 * Fixtures write only owned temporary trees, bound child lifetimes and remove all owned files after each test.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { resolveAcceptance } from "./acceptance-baseline.mjs";

const moduleUrl = new URL("./acceptance-profile-source.mjs", import.meta.url);
const subject = existsSync(moduleUrl) ? await import(moduleUrl.href) : {};
const phaseScript = fileURLToPath(new URL("./run-ci-phase.mjs", import.meta.url));
const registryPath = "docs/testing/acceptance-transitions.json";
const manifestPath = "tests/acceptance/fixtures/manifest.json";
const paths = {
  metadata: "tests/acceptance/fixtures/profiles.json",
  local: "tests/acceptance/fixtures/inventory.json",
  stage: "tests/acceptance/fixtures/inventory.stage.json",
  production: "tests/acceptance/fixtures/inventory.production.json",
};
const localCase = { file: "specs/local.spec.ts", title: "L-01 retained local obligation" };
const stageCase = { file: "specs/stage.spec.ts", title: "S-01 managed ingress obligation" };
const productionCase = { file: "specs/production.spec.ts", title: "P-01 harmless production obligation" };
const repository = "fixture/profile-source";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const clone = (value) => structuredClone(value);

/** Availability is an independent assertion, outside every expected rejection. */
function reader() {
  assert.equal(typeof subject.readAcceptanceProfileSource, "function", "Public profile-source reader must exist");
  return subject.readAcceptanceProfileSource;
}

/** Independent canonical JSON for synthetic admission digests, never an oracle imported from production helpers. */
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Require fresh immutable JSON output, including nested arrays and ordinary records. */
function frozen(value) {
  if (value === null || typeof value !== "object") return;
  assert(Object.isFrozen(value), "Every returned container must be frozen");
  for (const child of Object.values(value)) frozen(child);
}

/** Fixed inert declaration data; semantic schema matrices belong to the separate pure-validator expectations. */
function inventory(revision, cases = [localCase]) {
  return { contractRevision: revision, cases: clone(cases) };
}

/** Construct a complete three-profile counterpart whose source authenticity remains the reader's responsibility. */
function profileData(revision, local = [localCase]) {
  const inventories = {
    local: inventory(revision, local),
    stage: inventory(revision, [stageCase]),
    production: inventory(revision, [productionCase]),
  };
  const metadata = {
    schemaVersion: 1,
    contractRevision: revision,
    profiles: Object.fromEntries(
      Object.entries(inventories).map(([name, value]) => [
        name,
        value.cases.map((entry) => ({ case: clone(entry), requirements: ["APP-REL-001", "APP-V1-001"] })),
      ]),
    ),
  };
  return { metadata, inventories };
}

/** Expected pure result is written from the protocol, not obtained from either implementation under test. */
function declarations(revision, profiles = false, local = [localCase]) {
  const data = profileData(revision, local);
  return {
    schemaVersion: 1,
    kind: "acceptance-profile-declarations",
    mode: profiles ? "profiles-v1" : "legacy-local",
    contractRevision: revision,
    profiles: {
      local: { inventory: data.inventories.local, mappings: profiles ? data.metadata.profiles.local : null },
      stage: profiles ? { inventory: data.inventories.stage, mappings: data.metadata.profiles.stage } : null,
      production: profiles
        ? { inventory: data.inventories.production, mappings: data.metadata.profiles.production }
        : null,
    },
  };
}

/**
 * Build a small real, complete Git history and manually declared selection state in a disposable checkout.
 * Methods advance only fixture commits and never query a remote. Malformed declaration bytes remain valid Git blobs,
 * permitting tests to isolate reader checks from the independently existing acceptance resolver.
 */
function fixture(t, { policy = true, genesisInventory = false, historicalGenesisMetadata = false } = {}) {
  const workspace = realpathSync(mkdtempSync(join(tmpdir(), "mp3-profile-source-")));
  t.after(() => rmSync(workspace, { recursive: true, force: true }));
  const root = join(workspace, "checkout");
  mkdirSync(root);
  const rawGit = (...args) =>
    execFileSync(
      "/usr/bin/git",
      ["--no-replace-objects", "-c", "user.name=Profile Fixture", "-c", "user.email=profile@example.invalid", ...args],
      { cwd: root, timeout: 10000, maxBuffer: 4 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] },
    );
  const git = (...args) =>
    rawGit(...args)
      .toString("utf8")
      .trim();
  const put = (path, bytes) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), bytes);
  };
  const json = (path, value) => put(path, `${JSON.stringify(value, null, 2)}\n`);
  const commit = (message) => {
    git("add", "--all");
    git("commit", "--quiet", "-m", message);
    return git("rev-parse", "HEAD");
  };
  git("init", "--quiet", "--initial-branch=main");
  put(".gitignore", ".artifacts/\n");
  put("README.md", "Independent synthetic source fixture.\n");
  json("package.json", {
    private: true,
    scripts: { "test:unit": "node inert.mjs", build: "node inert.mjs", "test:e2e": "node inert.mjs" },
  });
  const foundation = commit("foundation");
  json("tests/acceptance/package.json", { private: true, scripts: { check: "node check.mjs" } });
  put("tests/acceptance/check.mjs", "// Inert fixture marker: no executable test body.\n");
  json(manifestPath, { contractRevision: "r3" });
  if (genesisInventory) json(paths.local, inventory("r3"));
  put("docs/testing/acceptance-contract.md", "# Immutable synthetic genesis contract\n");
  const genesisCommit = commit("independent pre-product suite");
  const genesis = {
    schemaVersion: 1,
    contractRevision: "r3",
    suiteCommit: genesisCommit,
    suiteTree: git("rev-parse", `${genesisCommit}:tests/acceptance`),
    manifestSha256: hash(rawGit("show", `${genesisCommit}:${manifestPath}`)),
    publicationStatus: "protected-main",
    ...(historicalGenesisMetadata
      ? {
          review: {
            kind: "independent-agent",
            coverage: "historical-synthetic-coverage",
            isolation: "historical-synthetic-isolation",
          },
          shippingPrerequisite: "Preserve this synthetic genesis and verify ancestry before shipping.",
        }
      : {}),
  };
  json("docs/testing/baseline.json", genesis);
  put("server/src/parser.ts", "// Inert product marker; never read or executed as application code.\n");
  put("server/Dockerfile", "# Inert phase marker, never built.\n");
  put("compose.yaml", "services: {}\n");
  const product = commit("product after independently frozen genesis");
  const registry = { schemaVersion: 1, transitions: [] };
  if (policy) json(registryPath, registry);
  let source = policy ? commit("dormant policy bootstrap") : product;
  let base = policy ? product : genesisCommit;
  let observations = [];
  let resolution = {
    genesis,
    required: genesis,
    candidate: null,
    pendingBinding: null,
    admission: policy ? "bootstrap" : "legacy",
    bindingCommit: null,
    activationCommit: null,
    policySha256: policy ? hash(rawGit("show", `${source}:${registryPath}`)) : null,
  };
  let counter = 3;
  const current = () => ({ source, base, resolution: clone(resolution), observations: clone(observations) });
  const options = (kind = "local") => {
    if (!policy) return { selection: { baseline: clone(genesis) }, sourceRevision: source, baseRevision: base };
    const selected = clone(resolution);
    let selection;
    if (kind === "ci") {
      const context = {
        repository,
        eventName: "push",
        ref: "refs/heads/main",
        sourceRevision: source,
        sourceTree: git("rev-parse", `${source}^{tree}`),
        baseRevision: base,
        workflowRevision: source,
        toolingRevision: base,
        runId: 701,
        attempt: 1,
      };
      const record = {
        schemaVersion: 1,
        kind: "ci-acceptance-admission",
        context,
        observedReviews: clone(observations),
        resolution: selected,
      };
      selection = {
        baseline: clone(selected.required),
        resolution: selected,
        admission: { record, sha256: hash(canonical(record)) },
      };
    } else {
      selection = {
        baseline: clone(selected.required),
        resolution: selected,
        localSelection: {
          kind: "local-acceptance-resolution",
          sourceRevision: source,
          baseRevision: base,
          resolution: clone(selected),
        },
      };
    }
    return { selection, sourceRevision: source, baseRevision: base };
  };
  const candidate = ({ profiles = false, missingLocal = false, edit = () => {}, local = [localCase] } = {}) => {
    base = source;
    counter += 1;
    const revision = `r${counter}`;
    const id = `profile-${revision}`;
    json(manifestPath, { contractRevision: revision });
    for (const path of Object.values(paths)) rmSync(join(root, path), { recursive: true, force: true });
    if (!missingLocal) json(paths.local, inventory(revision, local));
    if (profiles) {
      const data = profileData(revision, local);
      json(paths.metadata, data.metadata);
      json(paths.stage, data.inventories.stage);
      json(paths.production, data.inventories.production);
    }
    const contractPath = `docs/testing/contracts/${id}.md`;
    put(contractPath, `# Independent synthetic ${revision} contract\n`);
    edit({ revision, id, put, json, root });
    source = commit(`independent ${revision} candidate`);
    const identity = {
      schemaVersion: 1,
      suiteCommit: source,
      suiteTree: git("rev-parse", `${source}:tests/acceptance`),
      manifestSha256: hash(rawGit("show", `${source}:${manifestPath}`)),
      contractRevision: revision,
      publicationStatus: "candidate",
      id,
      predecessor: resolution.required.id ?? genesis.contractRevision,
      contractPath,
      contractSha256: hash(rawGit("show", `${source}:${contractPath}`)),
    };
    resolution = { ...resolution, candidate: identity, admission: "candidate" };
    observations = [];
    return clone(identity);
  };
  const bind = () => {
    base = source;
    const selected = resolution.candidate;
    assert(selected && !resolution.pendingBinding, "Fixture binds exactly one candidate");
    const reviewedTree = git("rev-parse", `${selected.suiteCommit}^{tree}`);
    const reviewedHead = git(
      "commit-tree",
      reviewedTree,
      "-p",
      git("rev-parse", `${selected.suiteCommit}^`),
      "-m",
      "independent reviewed feature identity",
    );
    assert.notEqual(reviewedHead, selected.suiteCommit);
    const { schemaVersion: ignoredSchema, publicationStatus: ignoredStatus, ...entry } = selected;
    entry.review = {
      repository,
      pullRequest: counter,
      reviewId: counter + 100,
      reviewer: "independent-reviewer",
      reviewedHead,
      reviewedTree,
    };
    registry.transitions.push(clone(entry));
    json(registryPath, registry);
    source = commit("separate protected candidate binding");
    observations = [
      {
        ...entry.review,
        author: "fixture-author",
        baseRef: "main",
        merged: true,
        mergeCommit: selected.suiteCommit,
        state: "APPROVED",
      },
    ];
    resolution = {
      ...resolution,
      candidate: null,
      pendingBinding: { schemaVersion: 1, ...entry, publicationStatus: "protected-main" },
      admission: "binding",
      bindingCommit: source,
      activationCommit: null,
      policySha256: hash(rawGit("show", `${source}:${registryPath}`)),
    };
    return clone(resolution.pendingBinding);
  };
  const advance = (kind = "documentation") => {
    base = source;
    if (kind === "implementation")
      put("server/src/parser.ts", `// Inert activation marker ${counter}; never executed.\n`);
    else put("README.md", `Independent documentation descendant ${counter}.\n`);
    source = commit(`subsequent ${kind}`);
    if (kind === "implementation" && resolution.pendingBinding) {
      resolution = {
        ...resolution,
        required: resolution.pendingBinding,
        pendingBinding: null,
        activationCommit: source,
      };
    }
    resolution.admission = kind;
    observations = [];
  };
  const inventoryRequired = () => {
    candidate();
    bind();
    advance("implementation");
  };
  return {
    workspace,
    root,
    git,
    rawGit,
    put,
    json,
    commit,
    genesis,
    foundation,
    product,
    current,
    options,
    candidate,
    bind,
    advance,
    inventoryRequired,
  };
}

/** Confirm existing resolver validity without using its output to construct the expected reader result. */
function requireFixture(f) {
  const { source, base, resolution, observations } = f.current();
  assert.deepEqual(
    resolveAcceptance(f.root, { sourceRevision: source, trustedBase: base, observedReviews: observations }),
    resolution,
  );
}

/** Rejections cannot be missing-import failures; preserve caller data and require the designated sanitized boundary. */
function rejected(f, options, code = "ERR_ACCEPTANCE_PROFILE_SOURCE") {
  const read = reader();
  const before = clone(options);
  assert.throws(
    () => read(f.root, options),
    (error) => error instanceof TypeError && error.code === code && !error.message.includes("sensitive-fixture-value"),
  );
  assert.deepEqual(options, before, "Rejected selection/context input must remain unchanged");
}

/**
 * Write a record-only synthetic CI handoff outside the checkout using independently declared context/resolution.
 * The environment matches that original push context exactly; observed reviews are retained for new binding fixtures.
 * This models the trusted workflow handoff for consistency tests, not authenticated GitHub observations or CI authority.
 */
function ciEnvironment(f) {
  const { admission } = f.options("ci").selection;
  const { context } = admission.record;
  assert.notEqual(context.sourceRevision, context.baseRevision, "CI counterpart must exercise original distinct base");
  const directory = join(f.workspace, "trusted-ci");
  mkdirSync(directory, { mode: 0o700 });
  const path = join(directory, "admission.json");
  const eventPath = join(directory, "event.json");
  writeFileSync(path, `${JSON.stringify(admission.record, null, 2)}\n`, { mode: 0o600 });
  writeFileSync(
    eventPath,
    `${JSON.stringify({ repository: { full_name: context.repository }, ref: context.ref, before: context.baseRevision, after: context.sourceRevision })}\n`,
    { mode: 0o600 },
  );
  return {
    CI: "true",
    CI_BASE_REF: context.baseRevision,
    GITHUB_ACTIONS: "true",
    GITHUB_SERVER_URL: "https://github.com",
    GITHUB_API_URL: "https://api.github.com",
    GITHUB_REPOSITORY: context.repository,
    GITHUB_EVENT_NAME: context.eventName,
    GITHUB_EVENT_PATH: eventPath,
    GITHUB_REF: context.ref,
    GITHUB_SHA: context.sourceRevision,
    GITHUB_WORKFLOW_SHA: context.workflowRevision,
    GITHUB_WORKFLOW_REF: `${context.repository}/.github/workflows/ci.yml@${context.ref}`,
    GITHUB_RUN_ID: String(context.runId),
    GITHUB_RUN_ATTEMPT: String(context.attempt),
    GATE_ADMISSION_PATH: path,
    GATE_ADMISSION_SHA256: admission.sha256,
  };
}

/** Minimal real phase invocation: fake npm fails at its first logged boundary; Git archive is separately witnessed. */
function controller(f, extra = {}) {
  const bin = join(f.workspace, "bin");
  const temporary = join(f.workspace, "temporary");
  const home = join(f.workspace, "home");
  for (const path of [bin, temporary, home]) mkdirSync(path, { recursive: true });
  const log = join(f.workspace, "commands.jsonl");
  const npm = `#!${process.execPath}\nrequire('node:fs').appendFileSync(${JSON.stringify(log)},JSON.stringify({command:'npm',args:process.argv.slice(2),cwd:process.cwd(),basePresent:Object.hasOwn(process.env,'CI_BASE_REF')})+'\\n');process.exit(23);\n`;
  writeFileSync(join(bin, "npm"), npm, { mode: 0o755 });
  writeFileSync(
    join(bin, "git"),
    `#!${process.execPath}\nconst a=process.argv.slice(2);if(a.includes('archive'))require('node:fs').appendFileSync(${JSON.stringify(log)},JSON.stringify({command:'archive'})+'\\n');const r=require('node:child_process').spawnSync('/usr/bin/git',a,{stdio:'inherit'});process.exit(r.status??1);\n`,
    { mode: 0o755 },
  );
  const deny = join(f.workspace, "deny-network.cjs");
  writeFileSync(
    deny,
    `const no=()=>{throw Error('Fixture denies network');};globalThis.fetch=no;for(const n of ['node:http','node:https']){const m=require(n);m.request=no;m.get=no;}const net=require('node:net');net.connect=no;net.createConnection=no;require('node:tls').connect=no;require('node:dgram').createSocket=no;require('node:module').syncBuiltinESMExports();\n`,
  );
  const env = {
    PATH: `${bin}:${dirname(process.execPath)}:/usr/bin:/bin`,
    HOME: home,
    TMPDIR: temporary,
    LANG: "C",
    CI: "false",
    CI_BASE_REF: f.current().base,
    NODE_OPTIONS: `--require ${deny}`,
    ...extra,
  };
  // Undefined fixture overrides mean genuinely absent environment keys, never the literal string "undefined".
  for (const key of Object.keys(env)) if (env[key] === undefined) delete env[key];
  const result = spawnSync(process.execPath, [phaseScript], {
    cwd: f.root,
    env,
    encoding: "utf8",
    timeout: 20000,
    maxBuffer: 1024 * 1024,
  });
  assert.equal(result.error, undefined, "Fixture start/timeout is not an expected policy rejection");
  assert.equal(result.signal, null, "A killed child is not an expected policy rejection");
  const commands = existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse) : [];
  assert.deepEqual(readdirSync(temporary), [], "Controller must remove all owned extractions");
  return { ...result, commands };
}

test("profile source exposes the sole reader without a profile selector API", () => {
  reader();
  assert.deepEqual(Object.keys(subject), ["readAcceptanceProfileSource"]);
});

test("independent fixture states agree with the existing resolver through candidate, binding and activation", (t) => {
  const f = fixture(t);
  requireFixture(f);
  f.candidate();
  requireFixture(f);
  f.bind();
  requireFixture(f);
  f.advance();
  requireFixture(f);
  f.advance("implementation");
  requireFixture(f);
  f.candidate({ profiles: true });
  requireFixture(f);
});

test("exact genesis absence preserves pre-policy local null-base and introduced-policy behavior", (t) => {
  const read = reader();
  for (const policy of [false, true]) {
    const f = fixture(t, { policy });
    const options = f.options();
    assert.deepEqual(read(f.root, options), { required: null, candidate: null, pending: null });
    if (!policy) {
      options.baseRevision = null;
      const result = read(f.root, options);
      assert.deepEqual(result, { required: null, candidate: null, pending: null });
      frozen(result);
    } else rejected(f, { ...options, baseRevision: null });
  }
});

test("immutable historical genesis metadata remains compatible with legacy, local and CI selections", (t) => {
  const read = reader();
  for (const policy of [false, true]) {
    for (const genesisInventory of [false, true]) {
      const f = fixture(t, { policy, genesisInventory, historicalGenesisMetadata: true });
      requireFixture(f);
      const expected = { required: genesisInventory ? declarations("r3") : null, candidate: null, pending: null };
      for (const kind of policy ? ["local", "ci"] : ["local"]) {
        const options = f.options(kind);
        const before = clone(options);
        assert.deepEqual(read(f.root, options), expected);
        assert.deepEqual(options, before, "Historical metadata must not be stripped or rewritten");
      }
      if (!policy) assert.deepEqual(read(f.root, { ...f.options(), baseRevision: null }), expected);
    }
  }
});

test("descendants retain entire historical genesis without treating its review as successor-binding authority", (t) => {
  const read = reader();
  const f = fixture(t, { historicalGenesisMetadata: true });
  f.inventoryRequired();
  requireFixture(f);
  for (const kind of ["local", "ci"]) {
    const options = f.options(kind);
    const before = clone(options);
    assert.deepEqual(options.selection.resolution.genesis, f.genesis);
    assert.deepEqual(read(f.root, options), { required: declarations("r4"), candidate: null, pending: null });
    assert.deepEqual(options, before);
  }
  f.candidate({ profiles: true });
  f.bind();
  requireFixture(f);
  const valid = f.options("ci");
  assert.deepEqual(read(f.root, valid), {
    required: declarations("r4"),
    candidate: null,
    pending: declarations("r5", true),
  });
  const missingCurrentReview = clone(valid);
  missingCurrentReview.selection.admission.record.observedReviews = [];
  missingCurrentReview.selection.admission.sha256 = hash(canonical(missingCurrentReview.selection.admission.record));
  rejected(f, missingCurrentReview);
});

test("self-consistent copied genesis metadata changes still fail the immutable baseline comparison", (t) => {
  const read = reader();
  for (const kind of ["legacy", "local", "ci"]) {
    const f = fixture(t, { policy: kind !== "legacy", historicalGenesisMetadata: true });
    if (kind !== "legacy") f.inventoryRequired();
    requireFixture(f);
    const valid = f.options(kind);
    assert.deepEqual(read(f.root, valid), {
      required: kind === "legacy" ? null : declarations("r4"),
      candidate: null,
      pending: null,
    });
    for (const edit of [
      (genesis) => {
        genesis.review.kind = "invented-review-authority";
      },
      (genesis) => {
        genesis.review.coverage = "different-historical-coverage";
      },
      (genesis) => {
        delete genesis.review;
      },
      (genesis) => {
        genesis.shippingPrerequisite = "Different immutable shipping requirement.";
      },
      (genesis) => {
        delete genesis.shippingPrerequisite;
      },
    ]) {
      const changed = clone(valid);
      // Change every copied genesis consistently; caller-envelope disagreement must not be the only rejection reason.
      const copies =
        kind === "legacy"
          ? [changed.selection.baseline]
          : [
              changed.selection.resolution.genesis,
              changed.selection.localSelection?.resolution.genesis,
              changed.selection.admission?.record.resolution.genesis,
            ].filter(Boolean);
      for (const genesis of new Set(copies)) edit(genesis);
      if (kind === "ci") changed.selection.admission.sha256 = hash(canonical(changed.selection.admission.record));
      rejected(f, changed);
    }
  }
});

test("inventory-bearing genesis and later legacy required suites return fresh frozen complete local declarations", (t) => {
  const read = reader();
  const genesis = fixture(t, { policy: false, genesisInventory: true });
  assert.deepEqual(read(genesis.root, genesis.options()), {
    required: declarations("r3"),
    candidate: null,
    pending: null,
  });
  const f = fixture(t);
  f.inventoryRequired();
  requireFixture(f);
  const options = f.options();
  const before = clone(options);
  const a = read(f.root, options);
  const b = read(f.root, options);
  assert.deepEqual(a, { required: declarations("r4"), candidate: null, pending: null });
  assert.deepEqual(a, b);
  assert.notEqual(a, b);
  assert.notEqual(a.required, b.required);
  assert.deepEqual(options, before);
  frozen(a);
  frozen(b);
});

test("candidate, authenticated binding and activated profile requirements retain their distinct roles", (t) => {
  const read = reader();
  const f = fixture(t);
  f.inventoryRequired();
  f.candidate({ profiles: true });
  requireFixture(f);
  assert.deepEqual(read(f.root, f.options()), {
    required: declarations("r4"),
    candidate: declarations("r5", true),
    pending: null,
  });
  f.bind();
  requireFixture(f);
  assert.deepEqual(read(f.root, f.options("ci")), {
    required: declarations("r4"),
    candidate: null,
    pending: declarations("r5", true),
  });
  rejected(f, f.options(), "ERR_ACCEPTANCE_PROFILE_SOURCE");
  f.advance();
  assert.deepEqual(read(f.root, f.options()), {
    required: declarations("r4"),
    candidate: null,
    pending: declarations("r5", true),
  });
  f.advance("implementation");
  assert.deepEqual(read(f.root, f.options()), { required: declarations("r5", true), candidate: null, pending: null });
});

test("closed options reject omitted, undefined, extra and selector fields before granting any fallback", (t) => {
  reader();
  const f = fixture(t);
  const valid = f.options();
  for (const field of ["selection", "sourceRevision", "baseRevision"]) {
    const missing = clone(valid);
    delete missing[field];
    rejected(f, missing);
    rejected(f, { ...clone(valid), [field]: undefined });
  }
  for (const field of ["role", "profile", "metadataPath", "environment"])
    rejected(f, { ...clone(valid), [field]: "sensitive-fixture-value" });
  for (const value of [null, [], "main", 1]) rejected(f, value);
  for (const key of ["sourceRevision", "baseRevision"]) {
    for (const value of ["HEAD", "main", "a".repeat(39), "A".repeat(40), "sensitive-fixture-value"])
      rejected(f, { ...clone(valid), [key]: value });
  }
});

test("original local source and base must agree, with no source-as-base or missing-object substitution", (t) => {
  const read = reader();
  const f = fixture(t);
  f.inventoryRequired();
  const valid = f.options();
  assert.deepEqual(read(f.root, valid).required, declarations("r4"));
  rejected(f, { ...clone(valid), sourceRevision: f.product });
  rejected(f, { ...clone(valid), baseRevision: valid.sourceRevision });
  rejected(f, { ...clone(valid), baseRevision: f.foundation });
  rejected(f, { ...clone(valid), sourceRevision: "f".repeat(40) });
  rejected(f, { ...clone(valid), baseRevision: "e".repeat(40) });
  for (const field of ["sourceRevision", "baseRevision", "kind"]) {
    const changed = clone(valid);
    changed.selection.localSelection[field] = "sensitive-fixture-value";
    rejected(f, changed);
  }
});

test("CI preserves the original producing context and digest rather than accepting self-consistent invented claims", (t) => {
  const read = reader();
  const f = fixture(t);
  f.inventoryRequired();
  f.candidate({ profiles: true });
  f.bind();
  const valid = f.options("ci");
  assert.equal(read(f.root, valid).pending.mode, "profiles-v1");
  for (const field of ["sourceRevision", "baseRevision", "sourceTree", "workflowRevision", "toolingRevision"]) {
    const changed = clone(valid);
    changed.selection.admission.record.context[field] = f.product;
    changed.selection.admission.sha256 = hash(canonical(changed.selection.admission.record));
    rejected(f, changed);
  }
  const digest = clone(valid);
  digest.selection.admission.sha256 = "0".repeat(64);
  rejected(f, digest);
  const stale = clone(valid);
  stale.selection.admission.record.resolution.required = clone(f.genesis);
  stale.selection.admission.sha256 = hash(canonical(stale.selection.admission.record));
  rejected(f, stale);
  const extra = clone(valid);
  extra.selection.admission.record.context.profile = "production";
  rejected(f, extra);
});

test("new-binding review observations remain mandatory and stale or self approvals cannot be supplied by the reader", (t) => {
  const read = reader();
  const f = fixture(t);
  f.candidate();
  f.bind();
  const valid = f.options("ci");
  assert.equal(read(f.root, valid).pending.contractRevision, "r4");
  for (const edit of [
    (r) => {
      r.observedReviews = [];
    },
    (r) => {
      r.observedReviews[0].state = "CHANGES_REQUESTED";
    },
    (r) => {
      r.observedReviews[0].mergeCommit = f.product;
    },
    (r) => {
      r.observedReviews[0].author = r.observedReviews[0].reviewer;
    },
  ]) {
    const changed = clone(valid);
    edit(changed.selection.admission.record);
    changed.selection.admission.sha256 = hash(canonical(changed.selection.admission.record));
    rejected(f, changed);
  }
});

test("mixed authority envelopes and inconsistent baseline or copied resolution fields are rejected", (t) => {
  const read = reader();
  const f = fixture(t);
  f.inventoryRequired();
  const valid = f.options();
  assert.equal(read(f.root, valid).required.contractRevision, "r4");
  const mixed = clone(valid);
  mixed.selection.admission = f.options("ci").selection.admission;
  rejected(f, mixed);
  const stripped = clone(valid);
  delete stripped.selection.localSelection;
  rejected(f, stripped);
  const old = clone(valid);
  old.selection.baseline = clone(f.genesis);
  rejected(f, old);
  const mismatch = clone(valid);
  mismatch.selection.localSelection.resolution.required = clone(f.genesis);
  rejected(f, mismatch);
  const extra = clone(valid);
  extra.selection.trusted = true;
  rejected(f, extra);
  const legacy = {
    selection: { baseline: clone(f.genesis) },
    sourceRevision: valid.sourceRevision,
    baseRevision: valid.baseRevision,
  };
  rejected(f, legacy);
});

test("all selected identity fields and registry digest remain bound, not merely matching IDs", (t) => {
  const read = reader();
  const f = fixture(t);
  f.inventoryRequired();
  f.candidate();
  const valid = f.options();
  assert.equal(read(f.root, valid).candidate.contractRevision, "r5");
  for (const [field, value] of Object.entries({
    suiteCommit: f.product,
    suiteTree: "a".repeat(40),
    manifestSha256: "b".repeat(64),
    contractSha256: "c".repeat(64),
    contractRevision: "forged",
    contractPath: "docs/testing/contracts/other.md",
    predecessor: "absent",
    publicationStatus: "protected-main",
  })) {
    const changed = clone(valid);
    changed.selection.resolution.candidate[field] = value;
    changed.selection.localSelection.resolution.candidate[field] = value;
    rejected(f, changed);
  }
  const policy = clone(valid);
  policy.selection.resolution.policySha256 = "0".repeat(64);
  policy.selection.localSelection.resolution.policySha256 = "0".repeat(64);
  rejected(f, policy);
});

test("a forged older required identity still present in the catalog cannot evade persistent applicability", (t) => {
  const read = reader();
  const f = fixture(t);
  f.inventoryRequired();
  const old = clone(f.current().resolution.required);
  f.candidate({ profiles: true });
  f.bind();
  f.advance("implementation");
  const valid = f.options();
  assert.equal(read(f.root, valid).required.mode, "profiles-v1");
  const changed = clone(valid);
  changed.selection.baseline = clone(old);
  changed.selection.resolution.required = clone(old);
  changed.selection.localSelection.resolution.required = clone(old);
  rejected(f, changed);
});

test("working metadata and replacement refs cannot substitute for selected immutable suite bytes", (t) => {
  const read = reader();
  const f = fixture(t);
  f.inventoryRequired();
  const valid = f.options();
  const expected = read(f.root, valid);
  f.put(paths.local, "sensitive-fixture-value");
  f.put(registryPath, "{}");
  f.put(paths.metadata, "{not JSON}");
  assert.deepEqual(read(f.root, valid), expected, "Reader must not consume dirty checkout declarations");
  f.git("reset", "--hard", valid.sourceRevision);
  f.git("checkout", "--quiet", "--detach", valid.selection.baseline.suiteCommit);
  f.json(paths.local, inventory("r4", [{ file: "specs/replacement.spec.ts", title: "Unreviewed replacement" }]));
  const replacement = f.commit("unreviewed replacement tree");
  f.git("checkout", "--quiet", "--detach", valid.sourceRevision);
  f.git("replace", valid.selection.baseline.suiteCommit, replacement);
  const visible = execFileSync("/usr/bin/git", ["show", `${valid.selection.baseline.suiteCommit}:${paths.local}`], {
    cwd: f.root,
    encoding: "utf8",
  });
  assert.match(visible, /Unreviewed replacement/);
  assert.deepEqual(read(f.root, valid), expected);
});

test("missing immutable objects and nonregular fixed-path entries are source failures, never absence", (t) => {
  reader();
  for (const kind of ["symlink", "tree", "missing-object"]) {
    const f = fixture(t);
    f.candidate({
      edit: ({ root, put }) => {
        if (kind === "symlink") {
          rmSync(join(root, paths.local));
          symlinkSync("outside-sensitive-fixture-value", join(root, paths.local));
        }
        if (kind === "tree") {
          rmSync(join(root, paths.local));
          put(`${paths.local}/nested`, "inert");
        }
      },
    });
    const options = f.options();
    if (kind === "missing-object") {
      const object = f.git("rev-parse", `${options.selection.resolution.candidate.suiteCommit}:${paths.local}`);
      rmSync(join(f.root, ".git", "objects", object.slice(0, 2), object.slice(2)));
    }
    rejected(f, options);
  }
});

test("malformed UTF-8, BOM, trailing data and malformed JSON are source errors despite valid Git identities", (t) => {
  reader();
  for (const bytes of [
    Buffer.from([0xc3, 0x28]),
    Buffer.from([0xef, 0xbb, 0xbf, 0x7b, 0x7d]),
    Buffer.from("{} trailing"),
    Buffer.from("{broken"),
  ]) {
    const f = fixture(t);
    f.candidate({ edit: ({ put }) => put(paths.local, bytes) });
    requireFixture(f);
    rejected(f, f.options());
  }
});

test("standard JSON effective members are accepted without inventing duplicate-key detection", (t) => {
  const read = reader();
  const f = fixture(t);
  f.candidate({
    edit: ({ revision, put }) =>
      put(
        paths.local,
        `{"contractRevision":"unused","contractRevision":"${revision}","cases":${JSON.stringify([localCase])}}\n`,
      ),
  });
  requireFixture(f);
  assert.deepEqual(read(f.root, f.options()).candidate, declarations("r4"));
});

test("only the exact genesis identity may omit its local inventory; caller resemblance grants no exception", (t) => {
  const read = reader();
  const good = fixture(t);
  assert.equal(read(good.root, good.options()).required, null);
  const f = fixture(t);
  f.candidate({ missingLocal: true });
  requireFixture(f);
  rejected(f, f.options());
  const forged = good.options();
  forged.selection.baseline.suiteCommit = good.product;
  rejected(good, forged);
});

test("atomic hosted presence and parsed declaration errors propagate the distinct declaration error", (t) => {
  reader();
  for (const missing of ["stage", "production"]) {
    const f = fixture(t);
    f.inventoryRequired();
    f.candidate({ profiles: true, edit: ({ root }) => rmSync(join(root, paths[missing])) });
    requireFixture(f);
    rejected(f, f.options(), "ERR_ACCEPTANCE_PROFILE_DECLARATION");
  }
  const orphan = fixture(t);
  orphan.candidate({ edit: ({ revision, json }) => json(paths.stage, inventory(revision, [stageCase])) });
  rejected(orphan, orphan.options(), "ERR_ACCEPTANCE_PROFILE_DECLARATION");
  const malformed = fixture(t);
  malformed.candidate({ edit: ({ json }) => json(paths.local, null) });
  rejected(malformed, malformed.options(), "ERR_ACCEPTANCE_PROFILE_DECLARATION");
});

test("hosted null-presence boundary: genuinely absent hosted files retain legacy candidate behavior", (t) => {
  const read = reader();
  const f = fixture(t);
  f.candidate();
  requireFixture(f);
  assert.deepEqual(read(f.root, f.options()), { required: null, candidate: declarations("r4"), pending: null });
});

for (const hosted of [["stage"], ["production"], ["stage", "production"]]) {
  test(`hosted null-presence boundary: present JSON null in ${hosted.join(" and ")} is not absence`, (t) => {
    reader();
    const f = fixture(t);
    f.candidate({
      edit: ({ json }) => {
        for (const name of hosted) json(paths[name], null);
      },
    });
    requireFixture(f);
    rejected(f, f.options(), "ERR_ACCEPTANCE_PROFILE_DECLARATION");
  });
}

test("hosted null-presence boundary: malformed hosted bytes retain source-decoding errors", (t) => {
  reader();
  for (const name of ["stage", "production"]) {
    for (const bytes of [Buffer.from([0xc3, 0x28]), Buffer.from("{broken")]) {
      const f = fixture(t);
      f.candidate({ edit: ({ put }) => put(paths[name], bytes) });
      requireFixture(f);
      rejected(f, f.options(), "ERR_ACCEPTANCE_PROFILE_SOURCE");
    }
  }
});

test("profile predecessor containment uses the immutable immediate predecessor, never the working inventory", (t) => {
  reader();
  const f = fixture(t);
  f.inventoryRequired();
  f.candidate({ profiles: true, local: [{ file: "specs/new.spec.ts", title: "New case cannot erase predecessor" }] });
  requireFixture(f);
  f.json(paths.local, inventory("r5", [localCase]));
  rejected(f, f.options(), "ERR_ACCEPTANCE_PROFILE_DECLARATION");
  const noPredecessor = fixture(t);
  noPredecessor.candidate({ profiles: true });
  requireFixture(noPredecessor);
  rejected(noPredecessor, noPredecessor.options());
});

for (const mismatch of [false, true]) {
  const outcome = mismatch
    ? "nonselected predecessor revision mismatch is rejected"
    : "predecessor own revision may differ from current";
  test(`predecessor revision boundary: ${outcome}`, (t) => {
    const read = reader();
    const f = fixture(t);
    f.candidate({
      edit: ({ revision, json }) => json(paths.local, inventory(mismatch ? "another-valid-r4" : revision)),
    });
    f.bind();
    f.advance("implementation");
    f.candidate({ profiles: true });
    f.bind();
    f.advance("implementation");
    requireFixture(f);
    const options = f.options();
    assert.equal(options.selection.resolution.required.contractRevision, "r5");
    assert.equal(options.selection.resolution.required.predecessor, "profile-r4");
    assert.equal(options.selection.resolution.candidate, null);
    assert.equal(options.selection.resolution.pendingBinding, null);
    // Historical r4 is no longer a selected role; only its authenticated predecessor identity supplies its revision.
    if (mismatch) rejected(f, options, "ERR_ACCEPTANCE_PROFILE_DECLARATION");
    else
      assert.deepEqual(read(f.root, options), { required: declarations("r5", true), candidate: null, pending: null });
  });
}

test("profile metadata cannot disappear after a profile-bearing predecessor anywhere on established lineage", (t) => {
  const read = reader();
  const f = fixture(t);
  f.inventoryRequired();
  f.candidate({ profiles: true });
  f.bind();
  f.advance("implementation");
  assert.equal(read(f.root, f.options()).required.mode, "profiles-v1");
  f.candidate();
  requireFixture(f);
  rejected(f, f.options());
  // Model trusted old history that did not yet check profiles: a grandparent declaration still forbids downgrade.
  f.bind();
  f.advance("implementation");
  f.candidate();
  f.bind();
  f.advance("implementation");
  requireFixture(f);
  rejected(f, f.options());
});

test("invalid lineage and immutable contract/registry identity changes cannot be relabeled as trusted local selection", (t) => {
  reader();
  const f = fixture(t);
  f.inventoryRequired();
  f.candidate();
  const valid = f.options();
  for (const predecessor of ["missing", "profile-r5", "profile-r6"]) {
    const bad = clone(valid);
    bad.selection.resolution.candidate.predecessor = predecessor;
    bad.selection.localSelection.resolution.candidate.predecessor = predecessor;
    rejected(f, bad);
  }
  const old = clone(valid);
  old.selection.resolution.required.review.reviewedTree = "d".repeat(40);
  old.selection.localSelection.resolution.required.review.reviewedTree = "d".repeat(40);
  old.selection.baseline.review.reviewedTree = "d".repeat(40);
  rejected(f, old);
});

test("real controller validates the required role before extraction or npm and does not accept profile environment weakening", (t) => {
  reader();
  const valid = fixture(t);
  valid.inventoryRequired();
  requireFixture(valid);
  const positive = controller(valid);
  assert.notEqual(positive.status, 0);
  assert.match(positive.stderr, /npm ci failed \(status 23\)/);
  assert.deepEqual(
    positive.commands.map((x) => x.command),
    ["archive", "npm"],
  );
  const invalid = fixture(t);
  invalid.candidate({ edit: ({ put }) => put(paths.local, "{malformed") });
  invalid.bind();
  invalid.advance("implementation");
  requireFixture(invalid);
  const negative = controller(invalid, { ACCEPTANCE_PROFILE: "stage", ACCEPTANCE_PROFILE_SOURCE: valid.root });
  assert.equal(negative.status, 1);
  assert.deepEqual(negative.commands, []);
  assert.doesNotMatch(negative.stderr, /ERR_MODULE_NOT_FOUND|Cannot find module|npm ci failed|timed out/);
});

test("real controller validates candidate and pending declarations before either selected suite is extracted or installed", (t) => {
  reader();
  for (const pending of [false, true]) {
    const control = fixture(t);
    control.inventoryRequired();
    control.candidate();
    if (pending) {
      control.bind();
      control.advance();
    }
    requireFixture(control);
    const positive = controller(control);
    assert.notEqual(positive.status, 0);
    assert.match(positive.stderr, /npm ci failed \(status 23\)/);
    assert.deepEqual(
      positive.commands.map((entry) => entry.command),
      ["archive", "archive", "npm"],
    );
    const f = fixture(t);
    f.inventoryRequired();
    f.candidate({ edit: ({ put }) => put(paths.local, "{malformed") });
    if (pending) {
      f.bind();
      f.advance();
    }
    requireFixture(f);
    const result = controller(f);
    assert.equal(result.status, 1);
    assert.deepEqual(result.commands, []);
    assert.doesNotMatch(result.stderr, /ERR_MODULE_NOT_FOUND|Cannot find module|npm ci failed|timed out/);
  }
});

test("real controller preserves exact no-inventory genesis compatibility at the first inert npm boundary", (t) => {
  reader();
  for (const policy of [false, true]) {
    const f = fixture(t, { policy });
    const result = controller(f);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /npm ci failed \(status 23\)/);
    assert.deepEqual(
      result.commands.map((x) => x.command),
      ["archive", "npm"],
    );
  }
});

test("real CI controller validates every selected role using the original external admission before extraction or npm", (t) => {
  reader();
  for (const role of ["required", "candidate", "pending"]) {
    for (const malformed of [false, true]) {
      const f = fixture(t);
      f.inventoryRequired();
      f.candidate({
        edit: ({ put }) => {
          if (malformed) put(paths.local, "{malformed");
        },
      });
      if (role !== "candidate") f.bind();
      if (role === "required") f.advance("implementation");
      requireFixture(f);
      const env = ciEnvironment(f);
      const original = readFileSync(env.GATE_ADMISSION_PATH);
      const record = JSON.parse(original);
      if (role === "pending")
        assert.equal(record.observedReviews.length, 1, "New binding retains its review observation");
      const result = controller(f, env);
      assert.deepEqual(
        readFileSync(env.GATE_ADMISSION_PATH),
        original,
        "Controller must not rewrite trusted record bytes",
      );
      if (malformed) {
        assert.equal(result.status, 1);
        assert.deepEqual(result.commands, [], `Malformed ${role} CI declaration must block both extractions and npm`);
        assert.doesNotMatch(result.stderr, /ERR_MODULE_NOT_FOUND|Cannot find module|npm ci failed|timed out/);
      } else {
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /npm ci failed \(status 23\)/);
        assert.deepEqual(
          result.commands.map((entry) => entry.command),
          role === "required" ? ["archive", "npm"] : ["archive", "archive", "npm"],
        );
        assert.equal(result.commands.find((entry) => entry.command === "npm").basePresent, true);
      }
    }
  }
});

test("ordinary pre-policy local controller preserves a genuinely omitted base at the inert npm boundary", (t) => {
  reader();
  const f = fixture(t, { policy: false });
  const result = controller(f, { CI_BASE_REF: undefined });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /npm ci failed \(status 23\)/);
  assert.deepEqual(
    result.commands.map((entry) => entry.command),
    ["archive", "npm"],
  );
  assert.equal(
    result.commands.find((entry) => entry.command === "npm").basePresent,
    false,
    "The real child environment must omit CI_BASE_REF rather than supply an empty or fabricated base",
  );
});
