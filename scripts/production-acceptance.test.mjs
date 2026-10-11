/**
 * Independently specify the owner-invoked production-smoke bridge before implementation. Run pinned Node with
 * node --experimental-vm-modules --test scripts/production-acceptance.test.mjs. Synthetic stage/approval/provider data
 * exercise existing public validators and isolated effects; they never establish human approval or hosted acceptance.
 * Controlled credential-free Node children replace package installation and wrapper execution. No Git, network,
 * browser, cloud, deployment, frozen-suite mutation or release-byte mutation occurs. Temporary files are removed.
 * Missing runProductionAcceptance is explicit availability red before any negative assertion.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import { validateAcceptanceProfiles } from "./acceptance-profiles.mjs";
import { validateHostedAcceptance, validateHostedSuiteResult } from "./hosted-evidence.mjs";

const moduleUrl = new URL("./production-acceptance.mjs", import.meta.url);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const clone = (value) => structuredClone(value);
const source = "a".repeat(40);
const suiteCommit = "b".repeat(40);
const suiteTree = "c".repeat(40);
const admissionSha256 = "d".repeat(64);
const registryDigests = { api: `sha256:${"4".repeat(64)}`, frontend: `sha256:${"5".repeat(64)}` };
const credentialCanary = "owned.control.synthetic";

function available() {
  assert(existsSync(moduleUrl), "Missing runProductionAcceptance module; availability red only");
  return readFileSync(moduleUrl, "utf8");
}

/** Literal unequal inventories model the existing contract; only the original validators calibrate fixture grammar. */
function declarations() {
  const inventories = Object.fromEntries(
    [
      ["local", 72],
      ["stage", 22],
      ["production", 3],
    ].map(([profile, count]) => [
      profile,
      {
        contractRevision: "hosted-v1",
        cases: Array.from({ length: count }, (_, index) => ({
          file: `${profile}/synthetic.spec.ts`,
          title: `Synthetic ${profile} obligation ${index + 1}`,
        })),
      },
    ]),
  );
  return {
    metadata: {
      schemaVersion: 1,
      contractRevision: "hosted-v1",
      profiles: Object.fromEntries(
        Object.entries(inventories).map(([profile, inventory]) => [
          profile,
          inventory.cases.map((entry) => ({
            case: clone(entry),
            requirements: [profile === "production" ? "APP-V1-015" : "APP-V1-014"],
          })),
        ]),
      ),
    },
    inventories,
    selectedContractRevision: "hosted-v1",
    predecessorLocalInventory: { contractRevision: "docs-v1", cases: clone(inventories.local.cases) },
  };
}

function fixture(t) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "production-acceptance-control-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const originalPath = join(root, "synthetic-original-release.bin");
  const originalBytes = Buffer.from("Unchanged synthetic original release bytes\n");
  writeFileSync(originalPath, originalBytes);
  const manifestBytes = Buffer.from('{"syntheticFixtureIdentity":true}\n');
  const fixtureManifestSha256 = hash(manifestBytes);
  const declarationInput = declarations();
  const projection = {
    required: validateAcceptanceProfiles(declarationInput),
    declarationInput,
    profilesSha256: hash(json(declarationInput.metadata)),
    inventorySha256: {
      stage: hash(json(declarationInput.inventories.stage)),
      production: hash(json(declarationInput.inventories.production)),
    },
  };
  const origin = {
    schemaVersion: 1,
    repository: "example/synthetic-private-mp3",
    sourceRevision: source,
    baseRevision: "e".repeat(40),
    runId: 7001,
    attempt: 1,
    workflow: ".github/workflows/ci.yml",
    workflowRevision: source,
  };
  const images = Object.fromEntries(
    ["api", "frontend"].map((role, index) => [
      role,
      {
        localImageId: `sha256:${String(index + 2).repeat(64)}`,
        archiveSha256: hash(originalBytes),
        registryDigest: registryDigests[role],
      },
    ]),
  );
  const release = { reservationSha256: "6".repeat(64), publicationSha256: "7".repeat(64) };
  const bundle = {
    origin: clone(origin),
    acceptanceAdmission: { sha256: admissionSha256, record: { syntheticAdmissionBoundary: true } },
    manifest: {
      sourceRevision: source,
      reservationSha256: release.reservationSha256,
      artifacts: clone(images),
      identity: {
        evidence: {
          contractRevision: "hosted-v1",
          baselinePublication: "protected-main",
          suiteCommit,
          suiteTree,
          fixtureManifestSha256,
          acceptance: { status: "passed", planned: 72, passed: 72, failed: 0, skipped: 0 },
        },
      },
    },
    assets: [
      {
        name: "synthetic-original-release.bin",
        path: originalPath,
        bytes: originalBytes.length,
        sha256: hash(originalBytes),
      },
    ],
  };
  const instant = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString();
  const stageConfig = "8".repeat(64),
    productionConfig = "9".repeat(64);
  const suite = {
    commit: suiteCommit,
    tree: suiteTree,
    fixtureManifestSha256,
    profilesSha256: projection.profilesSha256,
    inventorySha256: projection.inventorySha256.stage,
  };
  const stageExpected = {
    profile: "stage",
    sourceRevision: source,
    suite,
    release: clone(release),
    images: clone(images),
    configurationSha256: stageConfig,
    target: { origin: "https://stage.invalid", resourceId: "synthetic:stage/service", revisionId: "stage-revision-1" },
    run: { id: "stage-run:7001", attempt: 1, workflowRevision: source },
    declarationInput: clone(declarationInput),
  };
  const observation = (profile, observedAt) => ({
    environment: profile,
    origin: `https://${profile}.invalid`,
    resourceId: `synthetic:${profile}/service`,
    revisionId: `${profile}-revision-1`,
    observedAt,
    configurationSha256: profile === "stage" ? stageConfig : productionConfig,
    registryDigests: clone(registryDigests),
  });
  const stageInventory = clone(declarationInput.inventories.stage.cases);
  const executions = (inventory) =>
    inventory.map((entry) => ({
      ...entry,
      status: "passed",
      expectedStatus: "passed",
      retry: 0,
      retries: 0,
    }));
  const stageResult = {
    schemaVersion: 1,
    kind: "hosted-suite-result",
    profile: "stage",
    launchId: "1".repeat(64),
    sourceRevision: source,
    suite: clone(suite),
    inventory: stageInventory,
    tests: executions(stageInventory),
    status: "passed",
    cleanup: "passed",
  };
  const stageObservations = { before: observation("stage", instant(60)), after: observation("stage", instant(59)) };
  const stage = {
    expected: stageExpected,
    suiteResult: stageResult,
    launchId: stageResult.launchId,
    wrapperOutcome: "completed",
    parentCleanup: "passed",
    observations: stageObservations,
    record: {
      schemaVersion: 1,
      kind: "hosted-acceptance",
      profile: "stage",
      status: "passed",
      sourceRevision: source,
      contractRevision: "hosted-v1",
      suite: clone(suite),
      release: clone(release),
      images: clone(images),
      configurationSha256: stageConfig,
      run: clone(stageExpected.run),
      target: clone(stageObservations),
      inventory: clone(stageInventory),
      tests: executions(stageInventory),
      cleanup: "passed",
    },
  };
  assert.equal(validateHostedAcceptance(stage).tests.length, 22);
  const state = {
    admissionReject: false,
    missingProjection: false,
    installFailure: false,
    wrapperMode: "passed",
    credential: {
      kind: "google-id-token",
      value: credentialCanary,
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    },
    before: observation("production", instant(30)),
    after: observation("production", instant(20)),
    originalPath,
    originalBytes,
    suiteDirectories: [],
    privateDirectories: [],
  };
  const effects = {
    git: 0,
    admission: 0,
    projection: 0,
    install: 0,
    browser: 0,
    observe: 0,
    mint: 0,
    wrapper: 0,
    network: 0,
  };
  const options = {
    root,
    bundle,
    admissionSha256,
    currentContext: clone(origin),
    images,
    release,
    stage,
    approval: {
      reference: "human-event:synthetic-only",
      sha256: "a1".repeat(32),
      occurredAt: instant(50),
      candidate: {
        sourceRevision: source,
        registryDigests: clone(registryDigests),
        stageConfigurationSha256: stageConfig,
        productionConfigurationSha256: productionConfig,
        productionResourceId: "synthetic:production/service",
        exposureSha256: "b1".repeat(32),
        recoverySha256: "c1".repeat(32),
      },
    },
    operation: { id: "owner-operation:synthetic-v1", attempt: 1, sourceRevision: source },
    productionStartedAt: instant(40),
    observe: async () => {
      effects.observe++;
      return clone(effects.observe === 1 ? state.before : state.after);
    },
    mint: async (audience) => {
      effects.mint++;
      assert.equal(audience, state.before.origin);
      return clone(state.credential);
    },
    evidenceDirectory: join(root, ".artifacts/production"),
  };
  return { options, projection, state, effects, manifestBytes, executions };
}

/** Execute the public module in an isolated dependency boundary; no implementation-private helper is extracted. */
async function load(f) {
  const text = available();
  const context = vm.createContext({
    process,
    Buffer,
    TextDecoder,
    URL,
    AbortController,
    structuredClone,
    setTimeout,
    clearTimeout,
    fetch() {
      f.effects.network++;
      throw new Error("Unexpected network");
    },
  });
  const baseline = {
    contractRevision: "hosted-v1",
    suiteCommit,
    suiteTree,
    manifestSha256: hash(f.manifestBytes),
    baselinePublication: "protected-main",
  };
  const blobs = [
    ["fixtures/manifest.json", f.manifestBytes],
    ["scripts/run-production.ts", Buffer.from("// Synthetic immutable wrapper boundary; never executed.\n")],
  ].map(([path, bytes]) => ({
    path,
    bytes,
    id: createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex"),
  }));
  const fake = {
    "./acceptance-admission.mjs": {
      verifyAcceptanceAdmission() {
        f.effects.admission++;
        if (f.state.admissionReject) throw new Error("Synthetic invalid admission");
        return { required: clone(baseline) };
      },
    },
    "./acceptance-profile-source.mjs": {
      readRequiredAcceptanceProfileProjection() {
        f.effects.projection++;
        return f.state.missingProjection ? null : clone(f.projection);
      },
    },
    "./acceptance-browser-setup.mjs": {
      prepareAcceptanceBrowser: async ({ suiteRoot }) => {
        f.effects.browser++;
        f.state.suiteDirectories.push(suiteRoot);
        return { cleanup: "confirmed", status: "passed" };
      },
    },
    "./hosted-evidence.mjs": { validateHostedAcceptance, validateHostedSuiteResult },
    "./publish-release-evidence.mjs": {
      requireOrigin(origin, current) {
        assert.deepEqual(origin, current);
      },
    },
  };
  const controlledSpawn = (_executable, args, options) => {
    const install = args.some((arg) => typeof arg === "string" && arg.endsWith("npm-cli.js"));
    if (install) {
      f.effects.install++;
      return spawn(
        process.execPath,
        [
          "--eval",
          `if(process.env.GITHUB_TOKEN||process.env.PRODUCTION_ACCESS_TOKEN)process.exit(9);process.exit(${f.state.installFailure ? 7 : 0});`,
        ],
        options,
      );
    }
    assert.equal(args.length, 1);
    assert.equal(args[0], join(options.cwd, "scripts/run-production.ts"), "Only the fixed production wrapper may run");
    f.effects.wrapper++;
    f.state.privateDirectories.push(options.env.HOSTED_PRIVATE_DIRECTORY);
    const cases = f.projection.declarationInput.inventories.production.cases;
    const code = `
      import {mkdirSync,writeFileSync} from 'node:fs';import {join} from 'node:path';
      if(process.env.GITHUB_TOKEN||process.env.PRODUCTION_ACCESS_TOKEN)process.exit(9);
      let bytes='';for await(const part of process.stdin)bytes+=part;
      const input=JSON.parse(bytes);if(input.profile!=='production'||input.audience!==input.target.origin)process.exit(8);
      const cases=${JSON.stringify(cases)},mode=${JSON.stringify(f.state.wrapperMode)};
      const result={schemaVersion:1,kind:'hosted-suite-result',profile:'production',launchId:input.launchId,sourceRevision:input.sourceRevision,suite:input.suite,inventory:cases,tests:cases.map(e=>({...e,status:'passed',expectedStatus:'passed',retry:0,retries:0})),status:'passed',cleanup:'passed'};
      if(mode==='missing-case')result.tests.pop();if(mode==='wrong-launch')result.launchId='0'.repeat(64);
      if(mode==='wrong-source')result.sourceRevision='0'.repeat(40);if(mode==='wrong-suite')result.suite.tree='0'.repeat(40);
      if(mode==='skipped')result.tests[0].status='skipped';if(mode==='retry')result.tests[0].retries=1;
      if(mode==='cleanup-failed')result.cleanup='failed';
      if(mode!=='absent'){mkdirSync('.artifacts',{recursive:true});writeFileSync(join('.artifacts','hosted-production-result.json'),JSON.stringify(result));}
      process.exit(mode==='exit-failed'?7:0);
    `;
    return spawn(process.execPath, ["--input-type=module", "--eval", code], options);
  };
  const module = new vm.SourceTextModule(text, { context, identifier: fileURLToPath(moduleUrl) });
  await module.link(async (name) => {
    let exports = fake[name] ?? (await import(name));
    if (name === "node:child_process")
      exports = {
        ...exports,
        spawn: controlledSpawn,
        execFileSync(executable, args) {
          f.effects.git++;
          assert.equal(executable, "git");
          assert.equal(args[0], "--no-replace-objects");
          if (args[1] === "rev-parse")
            return Buffer.from(args[2].endsWith(":tests/acceptance") ? `${suiteTree}\n` : `${"3".repeat(40)}\n`);
          if (args[1] === "ls-tree")
            return Buffer.from(blobs.map((b) => `100644 blob ${b.id}\ttests/acceptance/${b.path}\0`).join(""));
          if (args[1] === "cat-file") {
            const blob = blobs.find((b) => b.id === args[3]);
            assert(blob);
            return blob.bytes;
          }
          throw new Error("Unexpected Git command");
        },
      };
    const names = Object.keys(exports);
    return new vm.SyntheticModule(
      names,
      function () {
        for (const name of names) this.setExport(name, exports[name]);
      },
      { context },
    );
  });
  await module.evaluate();
  assert.equal(typeof module.namespace.runProductionAcceptance, "function", "Missing runProductionAcceptance export");
  return module.namespace.runProductionAcceptance;
}

function sanitized(error) {
  assert.equal(error.code, "ERR_PRODUCTION_ACCEPTANCE");
  assert.equal(error.message, "Production acceptance failed");
  assert.equal(error.cause, undefined);
  assert(!JSON.stringify(error).includes(credentialCanary));
  return true;
}

function noExternalEffects(f) {
  for (const field of ["install", "browser", "observe", "mint", "wrapper", "network"])
    assert.equal(f.effects[field], 0, `${field} preceded valid authority`);
}

test("public import is inert and malformed options fail with one fixed production diagnostic", async (t) => {
  const f = fixture(t),
    run = await load(f);
  assert(Object.values(f.effects).every((value) => value === 0));
  for (const options of [null, [], {}, { unexpected: "synthetic-private-sentinel" }])
    await assert.rejects(run(options), sanitized);
  noExternalEffects(f);
});

test("valid original admission and complete stage authority reach the isolated installer without changing release bytes", async (t) => {
  const f = fixture(t),
    run = await load(f);
  f.state.installFailure = true;
  await assert.rejects(run(f.options), sanitized);
  assert.equal(f.effects.admission, 1);
  assert.equal(f.effects.projection, 1);
  assert.equal(f.effects.install, 1);
  assert.equal(f.effects.observe, 1);
  for (const field of ["browser", "mint", "wrapper", "network"]) assert.equal(f.effects[field], 0);
  assert.deepEqual(readFileSync(f.state.originalPath), f.state.originalBytes);
});

test("missing failed incomplete or substituted stage custody cannot reach child provider or credential effects", async (t) => {
  const mutations = [
    (f) => {
      f.options.stage = null;
    },
    (f) => {
      f.options.stage = f.options.stage.record;
    },
    (f) => {
      f.options.stage.record.status = "failed";
    },
    (f) => {
      f.options.stage.suiteResult = null;
    },
    (f) => {
      f.options.stage.record.tests.pop();
      f.options.stage.suiteResult.tests.pop();
    },
    (f) => {
      f.options.stage.record.tests[0].status = "skipped";
      f.options.stage.suiteResult.tests[0].status = "skipped";
    },
    (f) => {
      f.options.stage.parentCleanup = "failed";
    },
    (f) => {
      f.options.stage.wrapperOutcome = "not-run";
    },
    (f) => {
      f.options.stage.observations.after = f.options.stage.record.target.after = null;
    },
    (f) => {
      f.options.stage.expected.sourceRevision =
        f.options.stage.record.sourceRevision =
        f.options.stage.suiteResult.sourceRevision =
          "0".repeat(40);
    },
    (f) => {
      for (const p of [f.options.stage.expected, f.options.stage.record, f.options.stage.suiteResult])
        p.suite.commit = "0".repeat(40);
    },
    (f) => {
      f.options.stage.expected.release.publicationSha256 = f.options.stage.record.release.publicationSha256 =
        "0".repeat(64);
    },
    (f) => {
      f.options.stage.expected.images.api.archiveSha256 = f.options.stage.record.images.api.archiveSha256 = "0".repeat(
        64,
      );
    },
    (f) => {
      f.options.stage.expected.declarationInput.metadata.profiles.stage.pop();
    },
  ];
  for (const mutate of mutations) {
    const f = fixture(t),
      run = await load(f);
    mutate(f);
    await assert.rejects(run(f.options), sanitized);
    noExternalEffects(f);
  }
});

test("stage workflow revision must match the original release before provider child or credential effects", async (t) => {
  const f = fixture(t),
    run = await load(f);
  f.options.stage.expected.run.workflowRevision = f.options.stage.record.run.workflowRevision = "0".repeat(40);
  assert.equal(validateHostedAcceptance(f.options.stage).run.workflowRevision, "0".repeat(40));
  await assert.rejects(run(f.options), sanitized);
  noExternalEffects(f);
});

test("original admission and required complete three-case projection cannot be replaced by a pending or smaller suite", async (t) => {
  const mutations = [
    (f) => {
      f.state.admissionReject = true;
    },
    (f) => {
      f.state.missingProjection = true;
    },
    (f) => {
      f.options.admissionSha256 = "0".repeat(64);
    },
    (f) => {
      f.options.bundle.manifest.sourceRevision = "0".repeat(40);
    },
    (f) => {
      f.options.release.reservationSha256 = "0".repeat(64);
    },
    (f) => {
      f.projection.declarationInput.inventories.production.cases.pop();
      f.projection.declarationInput.metadata.profiles.production.pop();
      f.projection.required = validateAcceptanceProfiles(f.projection.declarationInput);
    },
  ];
  for (const mutate of mutations) {
    const f = fixture(t),
      run = await load(f);
    mutate(f);
    await assert.rejects(run(f.options), sanitized);
    noExternalEffects(f);
  }
});

test("approval candidate owner operation and UTC ordering bind before installation or credentials", async (t) => {
  const mutations = [
    (f) => {
      f.options.approval = { approved: true };
    },
    (f) => {
      f.options.approval.reference = "";
    },
    (f) => {
      f.options.approval.sha256 = "not-a-hash";
    },
    (f) => {
      f.options.approval.override = true;
    },
    (f) => {
      f.options.approval.candidate.sourceRevision = "0".repeat(40);
    },
    (f) => {
      f.options.approval.candidate.registryDigests.api = `sha256:${"0".repeat(64)}`;
    },
    (f) => {
      f.options.approval.candidate.stageConfigurationSha256 = "0".repeat(64);
    },
    (f) => {
      delete f.options.approval.candidate.productionResourceId;
    },
    (f) => {
      f.options.approval.candidate.productionConfigurationSha256 = "not-a-hash";
    },
    (f) => {
      delete f.options.approval.candidate.exposureSha256;
    },
    (f) => {
      f.options.approval.candidate.recoverySha256 = "not-a-hash";
    },
    (f) => {
      f.options.operation.id = "7001";
    },
    (f) => {
      f.options.operation.sourceRevision = "0".repeat(40);
    },
    (f) => {
      f.options.operation.attempt = 0;
    },
    (f) => {
      f.options.operation.authorized = true;
    },
    (f) => {
      f.options.operation.finalizedAt = new Date().toISOString();
    },
    (f) => {
      f.options.approval.occurredAt = f.options.stage.observations.after.observedAt;
    },
    (f) => {
      f.options.productionStartedAt = f.options.approval.occurredAt;
    },
    (f) => {
      f.options.approval.occurredAt = "2026-02-30T02:00:00.000Z";
    },
    (f) => {
      f.options.productionStartedAt = "2026-10-11T04:00:00+00:00";
    },
  ];
  for (const mutate of mutations) {
    const f = fixture(t),
      run = await load(f);
    mutate(f);
    await assert.rejects(run(f.options), sanitized);
    noExternalEffects(f);
  }
});

test("production observation must match the approved destination and exact pair before minting", async (t) => {
  const mutations = [
    (f) => {
      f.state.before.environment = "stage";
    },
    (f) => {
      f.state.before.origin = "https://production.invalid/path";
    },
    (f) => {
      f.state.before.origin = "http://production.invalid";
    },
    (f) => {
      f.state.before.resourceId = "synthetic:other/service";
    },
    (f) => {
      f.state.before.configurationSha256 = "0".repeat(64);
    },
    (f) => {
      f.state.before.registryDigests.frontend = `sha256:${"0".repeat(64)}`;
    },
    (f) => {
      f.state.before.observedAt = new Date(Date.now() + 60_000).toISOString();
    },
    (f) => {
      f.state.before.observedAt = f.options.approval.occurredAt;
    },
  ];
  for (const mutate of mutations) {
    const f = fixture(t),
      run = await load(f);
    mutate(f);
    await assert.rejects(run(f.options), sanitized);
    assert.equal(f.effects.observe, 1);
    assert.equal(f.effects.mint, 0);
    assert.equal(f.effects.wrapper, 0);
    assert.equal(f.effects.network, 0);
  }
});

test("closed audience-bound credential admission refuses malformed stale or extra credential material", async (t) => {
  const mutations = [
    (f) => {
      f.state.credential.kind = "access-token";
    },
    (f) => {
      f.state.credential.value = "synthetic-private-token";
    },
    (f) => {
      f.state.credential.value = "a".repeat(16_385);
    },
    (f) => {
      f.state.credential.expiresAt = new Date(Date.now() + 30_000).toISOString();
    },
    (f) => {
      f.state.credential.expiresAt = "2026-02-30T02:00:00.000Z";
    },
    (f) => {
      f.state.credential.audience = "https://other.invalid";
    },
  ];
  for (const mutate of mutations) {
    const f = fixture(t),
      run = await load(f);
    mutate(f);
    await assert.rejects(run(f.options), sanitized);
    assert.equal(f.effects.observe, 1);
    assert.equal(f.effects.mint, 1);
    assert.equal(f.effects.wrapper, 0);
  }
});

test("isolated three-case result preserves owner run custody observations cleanup and original bytes", async (t) => {
  const f = fixture(t),
    run = await load(f);
  const before = clone(f.options.bundle),
    result = await run(f.options);
  assert.equal(result.status, "passed");
  assert.equal(result.profile, "production");
  assert.equal(result.tests.length, 3);
  assert.deepEqual(result.run, { id: "owner-operation:synthetic-v1", attempt: 1, workflowRevision: source });
  assert.deepEqual(result.target, { before: f.state.before, after: f.state.after });
  assert.equal(result.cleanup, "passed");
  assert.equal(f.effects.observe, 2);
  assert.equal(f.effects.mint, 1);
  assert.equal(f.effects.wrapper, 1);
  assert.equal(f.effects.network, 0);
  assert.deepEqual(f.options.bundle, before);
  assert.deepEqual(readFileSync(f.state.originalPath), f.state.originalBytes);
  for (const path of [...f.state.suiteDirectories, ...f.state.privateDirectories]) assert(!existsSync(path));
  const records = ["production-acceptance-setup.json", "production-suite-result.json", "production-acceptance.json"];
  for (const name of records)
    assert(!readFileSync(join(f.options.evidenceDirectory, name), "utf8").includes(credentialCanary));
});

test("missing partial stale skipped retried or unclean wrapper results and provider drift never become smoke passes", async (t) => {
  const modes = [
    "absent",
    "missing-case",
    "wrong-launch",
    "wrong-source",
    "wrong-suite",
    "skipped",
    "retry",
    "cleanup-failed",
    "exit-failed",
  ];
  for (const wrapperMode of modes) {
    const f = fixture(t),
      run = await load(f);
    f.state.wrapperMode = wrapperMode;
    await assert.rejects(run(f.options), sanitized);
    assert.equal(f.effects.wrapper, 1);
    assert.equal(f.effects.observe, 2);
    for (const path of [...f.state.suiteDirectories, ...f.state.privateDirectories]) assert(!existsSync(path));
  }
  for (const mutate of [
    (f) => {
      f.state.after.revisionId = "other-revision";
    },
    (f) => {
      f.state.after.configurationSha256 = "0".repeat(64);
    },
    (f) => {
      f.state.after.registryDigests.api = `sha256:${"0".repeat(64)}`;
    },
    (f) => {
      f.state.after.observedAt = f.options.productionStartedAt;
    },
  ]) {
    const f = fixture(t),
      run = await load(f);
    mutate(f);
    await assert.rejects(run(f.options), sanitized);
    assert.equal(f.effects.wrapper, 1);
    assert.equal(f.effects.observe, 2);
  }
});
