/**
 * Focused local lifecycle checks for the stage launcher. Run pinned Node with
 * `node --experimental-vm-modules --test scripts/stage-acceptance.test.mjs`.
 * The private owned-process helper is extracted for real credential-free Node children; no Git, npm, browser, provider
 * or target executes. A separately isolated module probe mocks admission/selection boundaries to prove that an absent
 * required hosted profile cannot reach installation or authentication. These are implementation lifecycle checks, not
 * independent hosted acceptance or a claim that the complete launcher has executed against a real stage.
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { validateAcceptanceProfiles } from "./acceptance-profiles.mjs";
import { validateHostedAcceptance, validateHostedSuiteResult } from "./hosted-evidence.mjs";
import { runStageAcceptance } from "./stage-acceptance.mjs";

const modulePath = fileURLToPath(new URL("./stage-acceptance.mjs", import.meta.url));
const source = readFileSync(modulePath, "utf8");
const helperSource = source.slice(
  source.indexOf("async function owned("),
  source.indexOf("/** Preserve exact evidence"),
);
assert(helperSource.startsWith("async function owned(") && helperSource.endsWith("\n\n"));
const owned = new Function("spawn", `${helperSource}\nreturn owned;`)(spawn);
const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin` };

test("stage launcher rejects malformed public options with one fixed diagnostic", async () => {
  for (const input of [null, [], {}, { unexpected: "private-sentinel" }]) {
    await assert.rejects(runStageAcceptance(input), (error) => {
      assert.equal(error.code, "ERR_STAGE_ACCEPTANCE");
      assert.equal(error.message, "Stage acceptance failed");
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});

test("owned child receives only explicit environment and discards stdout and stderr", async () => {
  const sentinel = "stage-test-private-sentinel";
  const code = `if (process.env.GITHUB_TOKEN || process.env.STAGE_ACCESS_TOKEN) process.exit(9);
    process.stdout.write('${sentinel}'); process.stderr.write('${sentinel}');`;
  const previous = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = sentinel;
  try {
    const result = await owned(["--eval", code], process.cwd(), env, 5000, new AbortController().signal);
    assert.deepEqual(result, { passed: true, cleanup: true });
    assert(!JSON.stringify(result).includes(sentinel));
  } finally {
    if (previous === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = previous;
  }
});

test("owned child exit failure and deadline cannot become a passing result", async () => {
  assert.deepEqual(await owned(["--eval", "process.exit(7)"], process.cwd(), env, 5000, new AbortController().signal), {
    passed: false,
    cleanup: true,
  });
  const result = await owned(
    ["--eval", "setInterval(() => {}, 1000)"],
    process.cwd(),
    env,
    100,
    new AbortController().signal,
  );
  assert.equal(result.passed, false);
  assert.equal(result.cleanup, true);
});

test("owned child refuses pre-aborted work and excessive diagnostics", async () => {
  const abort = new AbortController();
  abort.abort();
  assert.deepEqual(await owned(["--eval", "process.exit(0)"], process.cwd(), env, 5000, abort.signal), {
    passed: false,
    cleanup: true,
  });
  const result = await owned(
    ["--eval", "process.stdout.write('x'.repeat(1048577)); setInterval(() => {}, 1000)"],
    process.cwd(),
    env,
    5000,
    new AbortController().signal,
  );
  assert.equal(result.passed, false);
  assert.equal(result.cleanup, true);
});

test("inert launcher import and missing required profile cannot install, observe or mint", () => {
  const probe = `
    import assert from 'node:assert/strict';
    import vm from 'node:vm';
    import * as fs from 'node:fs';
    import { tmpdir } from 'node:os';
    import { join } from 'node:path';
    const text=fs.readFileSync(${JSON.stringify(modulePath)},'utf8');
    const root=fs.realpathSync(fs.mkdtempSync(join(tmpdir(),'stage-selection-control-')));
    const counts={git:0,spawn:0,verify:0,projection:0,browser:0,observe:0,mint:0};
    const context=vm.createContext({process,Buffer,TextDecoder,URL,AbortController,structuredClone,setTimeout,clearTimeout});
    const inputContext={schemaVersion:1,repository:'fixture/repository',sourceRevision:'1'.repeat(40),baseRevision:'2'.repeat(40),runId:7,attempt:2,workflow:'.github/workflows/ci.yml',workflowRevision:'1'.repeat(40)};
    const resolution={required:{contractRevision:'docs-v1'},pendingBinding:{contractRevision:'hosted-v1'}};
    const fake={
      './acceptance-admission.mjs':{verifyAcceptanceAdmission(){counts.verify++;return resolution;}},
      './acceptance-profile-source.mjs':{readRequiredAcceptanceProfileProjection(){counts.projection++;return null;}},
      './acceptance-browser-setup.mjs':{prepareAcceptanceBrowser(){counts.browser++;throw Error('unexpected browser');}},
      './hosted-evidence.mjs':{validateHostedAcceptance(){throw Error('unexpected envelope');},validateHostedSuiteResult(){throw Error('unexpected result');}},
      './publish-release-evidence.mjs':{requireOrigin(){}},
    };
    const module=new vm.SourceTextModule(text,{context});
    await module.link(async name=>{
      let exports=fake[name]??await import(name);
      if(name==='node:child_process')exports={...exports,execFileSync(){counts.git++;return Buffer.from('3'.repeat(40)+'\\n');},spawn(){counts.spawn++;throw Error('unexpected child');}};
      const names=Object.keys(exports);return new vm.SyntheticModule(names,function(){for(const n of names)this.setExport(n,exports[n]);},{context});
    });
    try {
      await module.evaluate();assert(Object.values(counts).every(x=>x===0));
      await assert.rejects(module.namespace.runStageAcceptance({root,bundle:{origin:inputContext,acceptanceAdmission:{record:{},sha256:'4'.repeat(64)}},admissionSha256:'4'.repeat(64),currentContext:inputContext,images:{},release:{},observe:async()=>{counts.observe++;},mint:async()=>{counts.mint++;},evidenceDirectory:join(root,'.artifacts/stage')}),e=>e.code==='ERR_STAGE_ACCEPTANCE');
      assert.deepEqual(counts,{git:1,spawn:0,verify:1,projection:1,browser:0,observe:0,mint:0});
      const evidence=JSON.parse(fs.readFileSync(join(root,'.artifacts/stage/stage-acceptance-setup.json')));
      assert.equal(evidence.status,'failed');assert.equal(evidence.phase,'authority');assert.equal(evidence.parentCleanup,'passed');
      assert.equal(fs.existsSync(join(root,'.artifacts/stage/stage-acceptance.json')),false);
      process.stdout.write('required-profile-refusal-confirmed\\n');
    } finally {fs.rmSync(root,{recursive:true,force:true});}
  `;
  const result = spawnSync(process.execPath, ["--experimental-vm-modules", "--input-type=module", "--eval", probe], {
    env,
    encoding: "utf8",
    timeout: 10000,
    maxBuffer: 65536,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "required-profile-refusal-confirmed\n");
});

/** Model the original unequal profiles and actual child cleanup without Git, package, browser or provider effects. */
async function stageCustodyFixture(t) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "stage-custody-control-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const clone = (value) => structuredClone(value);
  const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
  const inventories = Object.fromEntries(
    [
      ["local", 72],
      ["stage", 22],
      ["production", 3],
    ].map(([profile, count]) => [
      profile,
      {
        contractRevision: "hosted-v1",
        cases: Array.from({ length: count }, (_, i) => ({
          file: `${profile}/synthetic.spec.ts`,
          title: `Synthetic ${profile} obligation ${i + 1}`,
        })),
      },
    ]),
  );
  const declarationInput = {
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
  const projection = {
    required: validateAcceptanceProfiles(declarationInput),
    declarationInput,
    profilesSha256: hash(JSON.stringify(declarationInput.metadata)),
    inventorySha256: {
      stage: hash(JSON.stringify(inventories.stage)),
      production: hash(JSON.stringify(inventories.production)),
    },
  };
  const origin = {
    schemaVersion: 1,
    repository: "example/synthetic-stage",
    sourceRevision: "a".repeat(40),
    baseRevision: "e".repeat(40),
    runId: 7001,
    attempt: 1,
    workflow: ".github/workflows/ci.yml",
    workflowRevision: "a".repeat(40),
  };
  const manifest = Buffer.from('{"syntheticFixture":true}\n');
  const baseline = {
    contractRevision: "hosted-v1",
    suiteCommit: "b".repeat(40),
    suiteTree: "c".repeat(40),
    manifestSha256: hash(manifest),
    baselinePublication: "protected-main",
  };
  const images = Object.fromEntries(
    ["api", "frontend"].map((role, index) => [
      role,
      {
        localImageId: `sha256:${String(index + 2).repeat(64)}`,
        archiveSha256: String(index + 4).repeat(64),
        registryDigest: `sha256:${String(index + 6).repeat(64)}`,
      },
    ]),
  );
  const release = { reservationSha256: "8".repeat(64), publicationSha256: "9".repeat(64) };
  const registryDigests = Object.fromEntries(
    Object.entries(images).map(([role, image]) => [role, image.registryDigest]),
  );
  const observation = (minutes) => ({
    environment: "stage",
    origin: "https://stage.invalid",
    resourceId: "synthetic:stage/service",
    revisionId: "stage-revision-1",
    observedAt: new Date(Date.now() - minutes * 60000).toISOString(),
    configurationSha256: "f".repeat(64),
    registryDigests: clone(registryDigests),
  });
  const state = {
    before: observation(2),
    after: observation(1),
    directories: [],
    wrapperInput: null,
    custodyWrites: [],
    custodyWriteFailure: false,
    wrapperMode: "passed",
    observes: 0,
  };
  const credentialCanary = "stage.control.synthetic";
  const options = {
    root,
    bundle: {
      origin: clone(origin),
      acceptanceAdmission: { sha256: "d".repeat(64), record: {} },
      manifest: {
        sourceRevision: origin.sourceRevision,
        reservationSha256: release.reservationSha256,
        artifacts: clone(images),
      },
    },
    admissionSha256: "d".repeat(64),
    currentContext: clone(origin),
    images,
    release,
    observe: async () => clone(++state.observes === 1 ? state.before : state.after),
    mint: async (audience) => {
      assert.equal(audience, state.before.origin);
      return {
        kind: "google-id-token",
        value: credentialCanary,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };
    },
    evidenceDirectory: join(root, ".artifacts/stage"),
  };
  const blobs = [
    ["fixtures/manifest.json", manifest],
    ["scripts/run-stage.ts", Buffer.from("// Synthetic wrapper only.\n")],
  ].map(([path, bytes]) => ({
    path,
    bytes,
    id: createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex"),
  }));
  const context = vm.createContext({
    process,
    Buffer,
    TextDecoder,
    URL,
    AbortController,
    structuredClone,
    setTimeout,
    clearTimeout,
  });
  const fake = {
    "./acceptance-admission.mjs": { verifyAcceptanceAdmission: () => ({ required: clone(baseline) }) },
    "./acceptance-profile-source.mjs": { readRequiredAcceptanceProfileProjection: () => clone(projection) },
    "./acceptance-browser-setup.mjs": {
      prepareAcceptanceBrowser: async ({ suiteRoot }) => {
        state.directories.push(suiteRoot);
        return { status: "passed", cleanup: "confirmed" };
      },
    },
    // Clone only at the VM realm boundary; the real validators still check every original JSON field unchanged.
    "./hosted-evidence.mjs": {
      validateHostedAcceptance: (input) => validateHostedAcceptance(structuredClone(input)),
      validateHostedSuiteResult: (input) => validateHostedSuiteResult(structuredClone(input)),
    },
    "./publish-release-evidence.mjs": { requireOrigin: (original, current) => assert.deepEqual(original, current) },
  };
  const module = new vm.SourceTextModule(source, { context, identifier: modulePath });
  await module.link(async (name) => {
    let exports = fake[name] ?? (await import(name));
    if (name === "node:fs")
      exports = {
        ...exports,
        writeFileSync(path, bytes, settings) {
          if (path === join(options.evidenceDirectory, "stage-acceptance-custody.json")) {
            state.custodyWrites.push({ afterCleanup: state.directories.every((entry) => !existsSync(entry)) });
            if (state.custodyWriteFailure) throw new Error("Synthetic custody-write failure");
          }
          return writeFileSync(path, bytes, settings);
        },
      };
    if (name === "node:child_process")
      exports = {
        ...exports,
        execFileSync(executable, args) {
          assert.equal(executable, "git");
          assert.equal(args[0], "--no-replace-objects");
          if (args[1] === "rev-parse")
            return Buffer.from((args[2].endsWith(":tests/acceptance") ? baseline.suiteTree : "3".repeat(40)) + "\n");
          if (args[1] === "ls-tree")
            return Buffer.from(blobs.map((blob) => `100644 blob ${blob.id}\ttests/acceptance/${blob.path}\0`).join(""));
          if (args[1] === "cat-file") {
            const blob = blobs.find((entry) => entry.id === args[3]);
            assert(blob);
            return blob.bytes;
          }
          throw new Error("Unexpected Git operation");
        },
        spawn(_executable, args, childOptions) {
          if (args[0].endsWith("npm-cli.js"))
            return spawn(process.execPath, ["--eval", "process.exit(0)"], childOptions);
          assert.equal(args.length, 1);
          assert.equal(args[0], join(childOptions.cwd, "scripts/run-stage.ts"));
          state.directories.push(childOptions.env.HOSTED_PRIVATE_DIRECTORY);
          const code = `import {mkdirSync,writeFileSync} from 'node:fs';import {join} from 'node:path';
          if(process.env.GITHUB_TOKEN||process.env.STAGE_ACCESS_TOKEN)process.exit(9);
          let bytes='';for await(const part of process.stdin)bytes+=part;const input=JSON.parse(bytes);
          if(input.profile!=='stage'||input.audience!==input.target.origin)process.exit(8);
          const inventory=${JSON.stringify(inventories.stage.cases)};
          const result={schemaVersion:1,kind:'hosted-suite-result',profile:'stage',launchId:input.launchId,sourceRevision:input.sourceRevision,
            suite:input.suite,inventory,tests:inventory.map(row=>({...row,status:'passed',expectedStatus:'passed',retry:0,retries:0})),status:'passed',cleanup:'passed'};
          mkdirSync('.artifacts',{recursive:true});writeFileSync(join('.artifacts','hosted-stage-result.json'),JSON.stringify(result));
          process.exit(${state.wrapperMode === "exit-failed" ? 7 : 0});`;
          const child = spawn(process.execPath, ["--input-type=module", "--eval", code], childOptions);
          const end = child.stdin.end.bind(child.stdin);
          child.stdin.end = (input, ...rest) => {
            state.wrapperInput = JSON.parse(input.toString());
            return end(input, ...rest);
          };
          return child;
        },
      };
    return new vm.SyntheticModule(
      Object.keys(exports),
      function () {
        for (const key of Object.keys(exports)) this.setExport(key, exports[key]);
      },
      { context },
    );
  });
  await module.evaluate();
  assert.equal(typeof module.namespace.runStageAcceptance, "function", "Missing stage launcher export");
  return { run: module.namespace.runStageAcceptance, options, state, projection, credentialCanary };
}

test("stage persists complete original seven-field custody after actual isolated cleanup", async (t) => {
  const f = await stageCustodyFixture(t),
    result = await f.run(f.options);
  assert.equal(result.status, "passed");
  assert.equal(result.tests.length, 22);
  const path = join(f.options.evidenceDirectory, "stage-acceptance-custody.json");
  assert(existsSync(path), "Missing original stage custody artifact");
  const bytes = readFileSync(path),
    stat = lstatSync(path),
    custody = JSON.parse(bytes);
  assert(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 1048576);
  assert.equal(stat.mode & 0o777, 0o600);
  assert.deepEqual(f.state.custodyWrites, [{ afterCleanup: true }]);
  assert.deepEqual(Object.keys(custody).sort(), [
    "expected",
    "launchId",
    "observations",
    "parentCleanup",
    "record",
    "suiteResult",
    "wrapperOutcome",
  ]);
  assert.deepEqual(validateHostedAcceptance(custody), structuredClone(result));
  assert.deepEqual(
    custody.record,
    JSON.parse(readFileSync(join(f.options.evidenceDirectory, "stage-acceptance.json"))),
  );
  assert.deepEqual(
    custody.suiteResult,
    JSON.parse(readFileSync(join(f.options.evidenceDirectory, "stage-suite-result.json"))),
  );
  assert.equal(custody.launchId, f.state.wrapperInput.launchId);
  assert.equal(custody.wrapperOutcome, "completed");
  assert.equal(custody.parentCleanup, "passed");
  assert.deepEqual(custody.observations, { before: f.state.before, after: f.state.after });
  assert.deepEqual(custody.expected, {
    profile: "stage",
    sourceRevision: f.options.bundle.origin.sourceRevision,
    suite: f.state.wrapperInput.suite,
    release: f.options.release,
    images: f.options.images,
    configurationSha256: f.state.before.configurationSha256,
    target: {
      origin: f.state.before.origin,
      resourceId: f.state.before.resourceId,
      revisionId: f.state.before.revisionId,
    },
    run: {
      id: String(f.options.currentContext.runId),
      attempt: f.options.currentContext.attempt,
      workflowRevision: f.options.currentContext.workflowRevision,
    },
    declarationInput: f.projection.declarationInput,
  });
  for (const sensitive of [f.credentialCanary, ...f.state.directories]) assert(!bytes.toString().includes(sensitive));
  for (const mutate of [
    (value) => {
      delete value.launchId;
    },
    (value) => {
      value.launchId = "0".repeat(64);
    },
    (value) => {
      value.suiteResult.tests.pop();
    },
    (value) => {
      value.expected.release.publicationSha256 = "0".repeat(64);
    },
    (value) => {
      value.suiteResult.cleanup = "failed";
    },
    (value) => {
      value.parentCleanup = "failed";
    },
    (value) => {
      value.wrapperOutcome = "failed";
    },
    (value) => {
      value.observations.after.revisionId = "other-revision";
    },
  ]) {
    const changed = structuredClone(custody);
    mutate(changed);
    assert.throws(() => validateHostedAcceptance(changed), { code: "ERR_HOSTED_EVIDENCE" });
  }
});

test("a failed stage wrapper retains original nonpassing custody after cleanup", async (t) => {
  const f = await stageCustodyFixture(t);
  f.state.wrapperMode = "exit-failed";
  await assert.rejects(f.run(f.options), { code: "ERR_STAGE_ACCEPTANCE", message: "Stage acceptance failed" });
  const path = join(f.options.evidenceDirectory, "stage-acceptance-custody.json");
  assert(existsSync(path), "Missing failed stage custody artifact");
  const custody = JSON.parse(readFileSync(path));
  assert.equal(lstatSync(path).mode & 0o777, 0o600);
  assert.equal(validateHostedAcceptance(custody).status, "failed");
  assert.equal(custody.wrapperOutcome, "failed");
  assert.equal(custody.launchId, f.state.wrapperInput.launchId);
  assert.deepEqual(f.state.custodyWrites, [{ afterCleanup: true }]);
  const claimedPass = structuredClone(custody);
  claimedPass.record.status = "passed";
  assert.throws(() => validateHostedAcceptance(claimedPass), { code: "ERR_HOSTED_EVIDENCE" });
});

test("stage custody write failure rejects the helper despite passing execution and cleaned children", async (t) => {
  const f = await stageCustodyFixture(t);
  f.state.custodyWriteFailure = true;
  await assert.rejects(f.run(f.options), { code: "ERR_STAGE_ACCEPTANCE", message: "Stage acceptance failed" });
  assert.deepEqual(f.state.custodyWrites, [{ afterCleanup: true }]);
  assert(!existsSync(join(f.options.evidenceDirectory, "stage-acceptance-custody.json")));
});
