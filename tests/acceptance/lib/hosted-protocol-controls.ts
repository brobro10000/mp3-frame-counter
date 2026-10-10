/**
 * Owned falsification controls for hosted protocol/report/private-file boundaries. Uses synthetic identities/tokens,
 * disposable copied helper source and inert child processes only. Shared production predicates must accept complete
 * controls and reject isolated faults; fixed rows contain no supplied values, credentials or native diagnostics.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { createOwnedControlTarget, CONTROL_TOKEN } from "./hosted-control-target.ts";
import { invocationHeaders, parseHostedInput } from "./hosted-target.ts";
import { assertHostedInventory, hostedInventory } from "./hosted-inventory.ts";
import { buildHostedResult, requireHostedFinalization, requireHostedRows } from "./hosted-report.ts";
import type { ControlRow, Execution, HostedRows, HostedSuiteInputV1, Profile, PublicInput } from "./hosted-types.ts";
/** Construct complete synthetic HTTPS input independent of a provider or real credential. */
function synthetic(role: Profile = "stage"): HostedSuiteInputV1 {
  const value = structuredClone(createOwnedControlTarget("http://127.0.0.1:1", role).publicInput);
  return {
    ...value,
    target: { ...value.target, origin: "https://owned-control.invalid" },
    audience: "https://owned-control.invalid",
    credential: {
      kind: "google-id-token",
      value: CONTROL_TOKEN,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    },
  };
}
/** Serialize only owned synthetic control inputs for the real parser boundary. */
const encode = (value: unknown) => Buffer.from(JSON.stringify(value));
/** Compute reference Git object bytes for this disposable literal fixture, without invoking Git or target code. */
function referenceTree(path: string): Buffer {
  const entries = readdirSync(path)
    .map((name) => {
      const child = join(path, name),
        directory = statSync(child).isDirectory();
      const bytes = directory ? referenceTree(child) : readFileSync(child);
      const id = directory ? bytes : createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest();
      return {
        sort: Buffer.from(name + (directory ? "/" : "")),
        bytes: Buffer.concat([Buffer.from(`${directory ? "40000" : "100644"} ${name}\0`), id]),
      };
    })
    .sort((a, b) => Buffer.compare(a.sort, b.sort));
  const body = Buffer.concat(entries.map((entry) => entry.bytes));
  return createHash("sha1").update(`tree ${body.length}\0`).update(body).digest();
}
/** Exercise real receive/load against a copied helper and isolated private file; it proves no provider authority. */
function privateFileControls(): void {
  const scratch = realpathSync(mkdtempSync(join(tmpdir(), "hosted-protocol-owned-")));
  try {
    const suite = join(scratch, "repo/tests/acceptance"),
      privateDirectory = join(scratch, "private");
    mkdirSync(join(suite, "lib"), { recursive: true });
    mkdirSync(join(suite, "fixtures"));
    mkdirSync(privateDirectory, { mode: 0o700 });
    chmodSync(privateDirectory, 0o700);
    writeFileSync(join(suite, "lib/hosted-target.ts"), readFileSync(new URL("./hosted-target.ts", import.meta.url)));
    for (const name of ["manifest.json", "profiles.json", "inventory.stage.json"])
      writeFileSync(join(suite, "fixtures", name), readFileSync(new URL(`../fixtures/${name}`, import.meta.url)));
    const input = synthetic();
    input.suite.tree = referenceTree(suite).toString("hex");
    const digest = (name: string) =>
      createHash("sha256")
        .update(readFileSync(join(suite, "fixtures", name)))
        .digest("hex");
    input.suite.fixtureManifestSha256 = digest("manifest.json");
    input.suite.profilesSha256 = digest("profiles.json");
    input.suite.inventorySha256 = digest("inventory.stage.json");
    const script = join(scratch, "probe.mjs");
    writeFileSync(
      script,
      `
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,statSync,utimesSync,unlinkSync,symlinkSync} from 'node:fs';
import {receiveHostedInput,loadHostedTarget,removeHostedInput,parseHostedInput} from ${JSON.stringify(pathToFileURL(join(suite, "lib/hosted-target.ts")).href)};
const target=await receiveHostedInput('stage',process.stdin);
const path=process.env.HOSTED_PRIVATE_DIRECTORY+'/input.json';
const initial=statSync(path).mtimeMs;
const original=JSON.parse(readFileSync(path,'utf8'));
const write=(value,clock)=>{writeFileSync(path,JSON.stringify(value),{mode:0o600});utimesSync(path,clock/1000,clock/1000);};
const boundary=structuredClone(original);boundary.credential.expiresAt=new Date(Math.round(initial)+990000).toISOString();
write(boundary,Math.round(initial));
await new Promise(done=>setTimeout(done,60));
assert.equal((await loadHostedTarget('stage')).publicInput.launchId,target.publicInput.launchId);
write(boundary,Date.now()+60000);await assert.rejects(loadHostedTarget('stage'),error=>error.code==='ENVIRONMENT');
const expired=structuredClone(original),old=Date.now()-1000000;expired.target.observedAt=new Date(old-1000).toISOString();expired.credential.expiresAt=new Date(old+990000).toISOString();
parseHostedInput(Buffer.from(JSON.stringify(expired)),'stage',old);
write(expired,old);await assert.rejects(loadHostedTarget('stage'),error=>error.code==='INPUT');
write(original,Math.round(initial));
const metadata=${JSON.stringify(join(suite, "fixtures/manifest.json"))};const bytes=readFileSync(metadata);writeFileSync(metadata,Buffer.concat([bytes,Buffer.from(' ')]));
await assert.rejects(loadHostedTarget('stage'),error=>error.code==='IDENTITY');writeFileSync(metadata,bytes);
assert.equal((await removeHostedInput()).cleanup,'passed');
writeFileSync(path+'.owned',JSON.stringify(original),{mode:0o600});symlinkSync(path+'.owned',path);
await assert.rejects(loadHostedTarget('stage'),error=>error.code==='ENVIRONMENT');unlinkSync(path);unlinkSync(path+'.owned');
process.stdout.write('owned-private-controls-passed');
`,
    );
    const result = spawnSync(process.execPath, [script], {
      input: encode(input),
      encoding: "utf8",
      timeout: 15000,
      maxBuffer: 65536,
      env: {
        PATH: `${dirname(process.execPath)}:/usr/bin:/bin`,
        HOME: scratch,
        HOSTED_PRIVATE_DIRECTORY: privateDirectory,
        NODE_V8_COVERAGE: undefined,
      },
    });
    assert.equal(result.status, 0);
    assert.equal(result.stdout, "owned-private-controls-passed");
    assert.equal(existsSync(join(privateDirectory, "input.json")), false);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
    assert.equal(existsSync(scratch), false);
  }
}
/** Run only finite synthetic protocol controls; returned rows are candidate evidence, never hosted acceptance. */
export async function runHostedProtocolControls(): Promise<ControlRow[]> {
  const rows: ControlRow[] = [];
  /** Preserve one sanitized outcome per planned control; assertion text and fixture values never enter reports. */
  const check = async (id: string, run: () => unknown) => {
    try {
      await run();
      rows.push({ id, status: "passed", cleanup: "passed", codes: [] });
    } catch {
      rows.push({ id, status: "failed", cleanup: "failed", codes: ["ASSERTION"] });
    }
  };
  await check("protocol-valid-roles-and-exact-expiry", () => {
    for (const role of ["stage", "production"] as const) {
      const input = synthetic(role),
        now = Date.now();
      input.credential.expiresAt = new Date(now + 990000).toISOString();
      assert.deepEqual(parseHostedInput(encode(input), role, now), input);
      assert.throws(() => parseHostedInput(encode(input), role, now + 1), { message: "INPUT" });
    }
  });
  const mutations: ((input: any) => void)[] = [
    (v) => (v.extra = true),
    (v) => (v.profile = "production"),
    (v) => (v.suite.tree = "bad"),
    (v) => (v.suite.extra = 1),
    (v) => (v.target.environment = "production"),
    (v) => (v.target.origin = "http://owned-control.invalid"),
    (v) => (v.target.origin += "/path"),
    (v) => (v.audience = "https://other.invalid"),
    (v) => (v.target.registryDigests.api = "sha256:bad"),
    (v) => (v.credential.value = "token\n"),
    (v) => (v.credential.value = "x".repeat(16385)),
    (v) => (v.credential.extra = true),
    (v) => (v.credential.expiresAt = new Date().toISOString()),
    (v) => (v.target.observedAt = "2026-02-30T00:00:00.000Z"),
    (v) => (v.sourceRevision = "f".repeat(39)),
  ];
  for (const [index, mutate] of mutations.entries())
    await check(`protocol-isolated-input-${index + 1}`, () => {
      const input = synthetic();
      parseHostedInput(encode(input), "stage", Date.now());
      mutate(input);
      assert.throws(() => parseHostedInput(encode(input), "stage", Date.now()), { message: "INPUT" });
    });
  await check("protocol-encoding-and-byte-bounds", () => {
    const valid = encode(synthetic());
    parseHostedInput(valid, "stage", Date.now());
    for (const bytes of [
      Buffer.concat([Buffer.from([239, 187, 191]), valid]),
      Buffer.from([0xff]),
      Buffer.concat([valid, Buffer.from("{}")]),
      Buffer.alloc(65537, 32),
    ])
      assert.throws(() => parseHostedInput(bytes, "stage", Date.now()), { message: "INPUT" });
  });
  await check("protocol-immutable-secret-free-handle", () => {
    const target = createOwnedControlTarget("http://127.0.0.1:1");
    assert.equal(JSON.stringify(target).includes(CONTROL_TOKEN), false);
    assert.throws(() => {
      target.publicInput.target.origin = "http://127.0.0.1:2";
    });
    const headers = {
      Authorization: "old",
      "X-Serverless-Authorization": "old",
      Cookie: "old",
      Accept: "application/json",
    };
    const projected = invocationHeaders(target, "http://127.0.0.1:1/file-upload", headers);
    assert.deepEqual(headers, {
      Authorization: "old",
      "X-Serverless-Authorization": "old",
      Cookie: "old",
      Accept: "application/json",
    });
    assert.deepEqual(projected, {
      Accept: "application/json",
      "X-Serverless-Authorization": `Bearer ${CONTROL_TOKEN}`,
    });
    assert.throws(() => invocationHeaders(target, "http://127.0.0.1:2/", {}), { message: "FOREIGN_ATTEMPT" });
    assert.throws(() => invocationHeaders({ publicInput: target.publicInput } as any, "http://127.0.0.1:1/", {}), {
      message: "IDENTITY",
    });
  });
  await check("protocol-real-private-file-clock-and-tree", privateFileControls);
  for (const role of ["stage", "production"] as const)
    await check(`protocol-complete-report-${role}`, () => {
      const { credential, ...input } = synthetic(role);
      void credential;
      const inventory = hostedInventory(role),
        tests: Execution[] = inventory.map((row) => ({
          ...row,
          status: "passed",
          expectedStatus: "passed",
          retry: 0,
          retries: 0,
        }));
      const clean = { cleanup: "passed" as const, failures: [] };
      const report: HostedRows = {
        schemaVersion: 1,
        kind: "hosted-suite-rows",
        profile: role,
        launchId: input.launchId,
        sourceRevision: input.sourceRevision,
        suite: input.suite,
        inventory,
        tests,
        status: "passed",
        finalizations: inventory.map((row) => ({ case: row, ...clean })),
      };
      requireHostedRows(report, input);
      assert.equal(buildHostedResult(input, tests, clean, "passed").status, "passed");
      for (const mutate of [
        (v: HostedRows) => {
          v.tests.pop();
        },
        (v: HostedRows) => {
          v.tests.push(v.tests[0]);
        },
        (v: HostedRows) => {
          v.tests[0].status = "skipped";
        },
        (v: HostedRows) => {
          v.tests[0].expectedStatus = "failed";
        },
        (v: HostedRows) => {
          v.tests[0].retry = 1;
        },
        (v: HostedRows) => {
          v.tests[0].retries = 1;
        },
        (v: HostedRows) => {
          v.finalizations.pop();
        },
        (v: HostedRows) => {
          v.finalizations[0].failures = ["FOREIGN_ATTEMPT"];
        },
        (v: HostedRows) => {
          v.finalizations[0].cleanup = "failed";
        },
        (v: HostedRows) => {
          v.launchId = "b".repeat(64);
        },
        (v: HostedRows) => {
          v.suite.tree = "a".repeat(40);
        },
        (v: HostedRows) => {
          v.tests[0].title = "unknown";
        },
      ]) {
        const bad = structuredClone(report);
        mutate(bad);
        assert.throws(() => requireHostedRows(bad, input));
      }
      assert.throws(() => assertHostedInventory(role, inventory.slice(1)));
      assert.throws(() => assertHostedInventory(role, [...inventory, inventory[0]]));
      assert.throws(() => requireHostedFinalization({ cleanup: "passed", failures: [], extra: true }));
      assert.throws(() => requireHostedFinalization({ cleanup: "passed", failures: ["CLEANUP", "CLEANUP"] }));
      assert.throws(() => buildHostedResult(input, tests, { cleanup: "failed", failures: ["CLEANUP"] }, "passed"));
      assert.throws(() => buildHostedResult(input, tests, clean, "blocked"));
      assert.equal(buildHostedResult(input, tests.slice(0, 1), clean, "failed").status, "failed");
      assert.equal(buildHostedResult(input, [], clean, "blocked").status, "blocked");
    });
  return rows;
}
