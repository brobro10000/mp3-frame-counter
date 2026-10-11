/**
 * Focused local lifecycle checks for the stage launcher. Run pinned Node with `node --test` on this file.
 * The private owned-process helper is extracted for real credential-free Node children; no Git, npm, browser, provider
 * or target executes. A separately isolated module probe mocks admission/selection boundaries to prove that an absent
 * required hosted profile cannot reach installation or authentication. These are implementation lifecycle checks, not
 * independent hosted acceptance or a claim that the complete launcher has executed against a real stage.
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
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
