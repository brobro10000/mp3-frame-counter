/**
 * Independently specify the stage controller's failure-only encrypted diagnostic integration before implementation.
 * Run pinned Node24 --experimental-vm-modules --test scripts/stage-private-diagnostic-controller.test.mjs.
 * Compile the complete actual controller in a VM, remove only its terminal CLI invocation, and expose the agreed
 * run/main/sealCommandFailure bindings. Synthetic inputs/deploy/verify callbacks replace cloud work; spawn and files
 * are memory-only boundaries. The seal stub proves custody/arguments, not encryption; independent helper tests own
 * cryptographic proof. No Git, network, credential, cloud, real child or filesystem write occurs in these probes.
 * Missing integration is explicit availability red before refusal assertions. No application acceptance is claimed.
 */
import assert from "node:assert/strict";
import { createPublicKey } from "node:crypto";
import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import vm from "node:vm";

const controllerUrl = new URL("./stage-delivery.mjs", import.meta.url);
const root = "/synthetic-stage-controller";
const recipientPath = join(root, "infra/cloud/diagnostics/recipient.json");
const privateDirectory = "/synthetic-private-stage";
const sourceRevision = "a".repeat(40);
const canary = "SYNTHETIC_RAW_PROVIDER_CANARY";
const captureLimit = 60 * 1024;
const publicKey = createPublicKey({
  key: { kty: "RSA", n: Buffer.alloc(384, 0xa5).toString("base64url"), e: "AQAB" },
  format: "jwk",
}).export({ type: "spki", format: "pem" });

function available() {
  const source = readFileSync(controllerUrl, "utf8");
  assert.match(
    source,
    /import\s*\{\s*sealStageDiagnostic\s*\}\s*from\s*["']\.\/stage-private-diagnostic\.mjs["']/u,
    "Missing sealStageDiagnostic controller import; availability red only",
  );
  assert.match(source, /function sealCommandFailure\(/u, "Missing agreed caller integration; availability red only");
  const terminal = source.lastIndexOf("\nmain().catch(");
  assert(terminal > 0, "Terminal CLI seam must match the actual controller");
  return (
    source.slice(0, terminal) +
    `
    export { run, main, sealCommandFailure };
    export function configureProbe(probe) {
      inputs = async () => probe.inputs();
      deploy = async (values, directory) => probe.deploy(values, directory, run);
      push = async (values, directory) => probe.deploy(values, directory, run);
      verify = async () => probe.verify();
    }
  `
  );
}

async function fixture(scenario = {}) {
  const source = available();
  const events = [],
    reads = [],
    seals = [],
    classifications = [],
    writes = new Map();
  const files = new Map();
  if (!scenario.missingRecipient)
    files.set(recipientPath, Buffer.from(scenario.recipient ?? JSON.stringify({ schemaVersion: 1, publicKey })));
  const directories = new Set([
    root,
    "/synthetic-private",
    join(root, "infra"),
    join(root, "infra/cloud"),
    join(root, "infra/cloud/diagnostics"),
  ]);
  const fakeProcess = {
    version: process.version,
    execPath: process.execPath,
    argv: ["node", join(root, "scripts/stage-delivery.mjs"), scenario.command ?? "deploy"],
    env: {
      GITHUB_TOKEN: "synthetic-github-token",
      REGISTRY_ACCESS_TOKEN: "synthetic-registry-token",
      STAGE_ACCESS_TOKEN: "synthetic-stage-token",
      STAGE_DIAGNOSTIC_PUBLIC_KEY: "ENVIRONMENT_KEY_MUST_NEVER_SELECT_RECIPIENT",
      GITHUB_SHA: "b".repeat(40),
      GITHUB_RUN_ID: "9999",
      GITHUB_RUN_ATTEMPT: "9999",
    },
    once() {},
    kill() {
      events.push("kill-owned-group");
    },
    cwd: () => root,
  };
  const fakeFs = {
    constants: {},
    existsSync: (path) => files.has(path) || directories.has(path),
    realpathSync: (path) => path,
    lstatSync(path) {
      if (!files.has(path) && !directories.has(path)) throw new Error("Synthetic missing path");
      return {
        isSymbolicLink: () => path === scenario.symlink,
        isFile: () => files.has(path),
        isDirectory: () => directories.has(path),
        size: path === recipientPath && scenario.oversizeStat ? 12289 : (files.get(path)?.length ?? 0),
      };
    },
    mkdirSync(path) {
      directories.add(path);
    },
    mkdtempSync() {
      directories.add(privateDirectory);
      events.push("private-created");
      return privateDirectory;
    },
    readFileSync(path) {
      reads.push(path);
      assert(files.has(path), "Only fixed in-memory files may be read");
      return Buffer.from(files.get(path));
    },
    writeFileSync(path, value, options) {
      events.push(`write:${path.split("/").at(-1)}`);
      assert.equal(options.flag, "wx");
      assert.equal(options.mode, 0o600);
      files.set(path, Buffer.from(value));
      writes.set(path.split("/").at(-1), JSON.parse(value));
    },
    rmSync(path) {
      assert.equal(path, privateDirectory);
      events.push("private-cleanup");
      if (scenario.cleanupFailure) throw new Error(canary);
      directories.delete(path);
    },
  };
  for (const name of ["accessSync", "appendFileSync", "openSync", "closeSync"])
    fakeFs[name] = () => {
      throw new Error("Unexpected synthetic filesystem effect");
    };
  const spawn = (_executable, _args, options) => {
    events.push("spawn");
    assert.equal(options.detached, true);
    assert.deepEqual([...options.stdio], ["pipe", "pipe", "pipe"]);
    const child = new EventEmitter();
    child.pid = 7001;
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.stdin = new EventEmitter();
    child.stdin.end = () =>
      queueMicrotask(() => {
        for (const bytes of scenario.stdoutChunks ?? [Buffer.from(`${canary}:stdout`)])
          child.stdout.emit("data", bytes);
        for (const bytes of scenario.stderrChunks ?? [Buffer.from(`${canary}:stderr`)])
          child.stderr.emit("data", bytes);
        if (scenario.spawnFailure) child.emit("error", new Error(canary));
        child.emit("close", scenario.spawnFailure ? null : (scenario.exitCode ?? 1));
      });
    return child;
  };
  const deny = () => {
    events.push("forbidden-effect");
    throw new Error("Unexpected external effect");
  };
  const mocks = {
    "node:fs": fakeFs,
    "node:child_process": { spawn },
    "node:os": { tmpdir: () => "/synthetic-private" },
    "./publish-release.mjs": { githubApi: deny },
    "./publish-release-evidence.mjs": Object.fromEntries(
      [
        "publicationContext",
        "publicationMaterial",
        "requireMatchingAsset",
        "requireObservedChecks",
        "requireReleaseMetadata",
        "verifyReleaseBundle",
      ].map((name) => [name, deny]),
    ),
    "./release-manifest.mjs": { canonical: JSON.stringify },
    "./acceptance-profile-source.mjs": { readRequiredAcceptanceProfileProjection: deny },
    "../infra/cloud/bootstrap/cap-reconciler.mjs": { inspectCap: deny, renderDesiredCap: deny },
    "./stage-delivery-policy.mjs": {
      parseStageConfig: deny,
      requireStagePlan: deny,
      requireStageServingRevision: deny,
    },
    "./stage-command-failure.mjs": {
      stageCommandFailure(operation, exitCode, stderr, stdout) {
        classifications.push({ operation, exitCode, stderr, stdout });
        return { operation, exitCode, permission: null };
      },
    },
    "./stage-private-diagnostic.mjs": {
      sealStageDiagnostic(options) {
        seals.push(structuredClone(options));
        if (scenario.cryptoFailure || options.publicKey !== publicKey) throw new Error(canary);
        return {
          schemaVersion: 1,
          kind: "encrypted-stage-command-diagnostic",
          algorithm: "RSA-OAEP-256+A256GCM",
          operation: options.operation,
          exitCode: options.exitCode,
          context: structuredClone(options.context),
          publicKeySha256: "1".repeat(64),
          encryptedKey: "eA==",
          iv: "eA==",
          tag: "eA==",
          ciphertext: "eA==",
        };
      },
    },
  };
  const context = vm.createContext({
    process: fakeProcess,
    Buffer,
    URL,
    TextDecoder,
    TextEncoder,
    AbortController,
    structuredClone,
    setTimeout,
    clearTimeout,
    fetch: deny,
    console: { log: deny, error: deny, warn: deny },
  });
  const module = new vm.SourceTextModule(source, {
    context,
    identifier: controllerUrl.href,
    initializeImportMeta(meta) {
      meta.url = new URL("scripts/stage-delivery.mjs", `file://${root}/`).href;
    },
  });
  await module.link(async (name) => {
    const exports = mocks[name] ?? (name.startsWith("node:") ? await import(name) : null);
    assert(exports, "Unexpected controller dependency");
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
  assert.deepEqual(events, [], "Removing terminal invocation must leave the controller inert");
  assert.deepEqual(reads, []);
  const values = { context: { sourceRevision, runId: 7001, attempt: 3 } };
  module.namespace.configureProbe({
    async inputs() {
      events.push("verified-inputs");
      if (scenario.inputsFailure) throw new Error(canary);
      return values;
    },
    async deploy(received, directory, run) {
      assert.equal(received, values);
      assert.equal(directory, privateDirectory);
      await run("synthetic-terraform", ["synthetic-fixed-command"], {
        cwd: directory,
        env: {},
        timeout: 1000,
        ...(scenario.nonTerraform ? {} : { operation: scenario.operation ?? "terraform-apply" }),
      });
      return { schemaVersion: 1, kind: "synthetic-completion-only" };
    },
    async verify() {
      events.push("synthetic-verify");
    },
  });
  return { main: module.namespace.main, events, reads, seals, classifications, writes };
}

async function failed(f) {
  await assert.rejects(f.main(), (error) => error.message === "STAGE_DELIVERY_FAILED");
  assert(!f.events.includes("forbidden-effect"));
  for (const record of f.writes.values()) assert(!JSON.stringify(record).includes(canary));
}

function retained(f, operation, exitCode) {
  assert.deepEqual(f.writes.get("command-failure.json"), { operation, exitCode, permission: null });
  assert.equal(f.writes.get("private-command-failure.json").kind, "encrypted-stage-command-diagnostic");
  assert.deepEqual(f.writes.get("deploy-outcome.json"), { command: "deploy", status: "failed", cleanup: "passed" });
  const cleaned = f.events.indexOf("private-cleanup");
  assert(cleaned >= 0);
  for (const name of ["private-command-failure.json", "command-failure.json"])
    assert(f.events.indexOf(`write:${name}`) > cleaned, "Diagnostic retention requires completed private cleanup");
}

test("verified context and fixed checkout recipient bind each failed Terraform operation after cleanup", async () => {
  for (const operation of ["terraform-init", "terraform-plan", "terraform-show", "terraform-apply"]) {
    const exitCode = operation === "terraform-init" ? 255 : 1;
    const recipient = JSON.stringify({ schemaVersion: 1, publicKey }).padEnd(12288, " ");
    const f = await fixture({ operation, exitCode, recipient });
    await failed(f);
    retained(f, operation, exitCode);
    assert.deepEqual(f.reads, [recipientPath]);
    assert.equal(f.seals.length, 1);
    assert.deepEqual(f.seals[0], {
      publicKey,
      operation,
      exitCode,
      context: { sourceRevision, runId: 7001, runAttempt: 3 },
      stdout: `${canary}:stdout`,
      stderr: `${canary}:stderr`,
      stdoutTruncated: false,
      stderrTruncated: false,
    });
    assert(f.events.indexOf("verified-inputs") < f.events.indexOf("spawn"));
    assert.deepEqual([...f.writes.keys()].sort(), [
      "command-failure.json",
      "deploy-outcome.json",
      "private-command-failure.json",
    ]);
  }
});

test("failure capture preserves stdout tail stderr head and truthful independent truncation flags", async () => {
  const stdout = Buffer.concat([
    Buffer.from("discarded-stdout-prefix"),
    Buffer.alloc(captureLimit, 111),
    Buffer.from(`${canary}:tail`),
  ]);
  const stderr = Buffer.concat([
    Buffer.from(`${canary}:head`),
    Buffer.alloc(captureLimit, 101),
    Buffer.from("discarded-stderr-suffix"),
  ]);
  for (const streams of [
    { stdout, stderr },
    { stdout: Buffer.alloc(captureLimit, 111), stderr: Buffer.alloc(captureLimit, 101) },
    { stdout: Buffer.from(""), stderr: Buffer.from("") },
    { stdout, stderr: Buffer.from("short-stderr") },
    { stdout: Buffer.from("short-stdout"), stderr },
  ]) {
    const f = await fixture({
      stdoutChunks: [streams.stdout.subarray(0, 13), streams.stdout.subarray(13)],
      stderrChunks: [streams.stderr.subarray(0, 17), streams.stderr.subarray(17)],
    });
    await failed(f);
    retained(f, "terraform-apply", 1);
    assert.equal(
      f.seals[0].stdout,
      streams.stdout.subarray(Math.max(0, streams.stdout.length - captureLimit)).toString("utf8"),
    );
    assert.equal(f.seals[0].stderr, streams.stderr.subarray(0, captureLimit).toString("utf8"));
    assert.equal(f.seals[0].stdoutTruncated, streams.stdout.length > captureLimit);
    assert.equal(f.seals[0].stderrTruncated, streams.stderr.length > captureLimit);
  }
});

test("success nonTerraform spawn-null and unverified inputs produce no encrypted artifact", async () => {
  for (const scenario of [{ exitCode: 0 }, { nonTerraform: true }, { spawnFailure: true }, { inputsFailure: true }]) {
    const f = await fixture(scenario);
    if (scenario.exitCode === 0) await f.main();
    else await failed(f);
    assert.equal(f.seals.length, 0);
    assert.deepEqual(f.reads, []);
    assert(!f.writes.has("private-command-failure.json"));
    if (scenario.spawnFailure)
      assert.deepEqual(f.writes.get("command-failure.json"), {
        operation: "terraform-apply",
        exitCode: null,
        permission: null,
      });
    if (scenario.inputsFailure) assert(!f.events.includes("spawn"));
  }
});

test("missing malformed substituted oversized or symlink recipient cannot reach sealing or leak raw text", async () => {
  const scenarios = [
    { missingRecipient: true },
    { recipient: "{" },
    { recipient: JSON.stringify({ schemaVersion: 2, publicKey }) },
    { recipient: JSON.stringify({ schemaVersion: 1, publicKey, extra: canary }) },
    { recipient: JSON.stringify({ publicKey }) },
    { recipient: JSON.stringify({ schemaVersion: 1 }) },
    { recipient: JSON.stringify({ schemaVersion: 1, publicKey: 123 }) },
    { recipient: JSON.stringify({ schemaVersion: 1, publicKey: "" }) },
    { recipient: JSON.stringify({ schemaVersion: 1, publicKey: "x".repeat(8193) }) },
    { oversizeStat: true },
    ...[join(root, "infra"), join(root, "infra/cloud"), join(root, "infra/cloud/diagnostics"), recipientPath].map(
      (symlink) => ({ symlink }),
    ),
  ];
  for (const scenario of scenarios) {
    const f = await fixture(scenario);
    await failed(f);
    assert.equal(f.seals.length, 0);
    assert(!f.writes.has("private-command-failure.json"));
    assert.deepEqual(f.writes.get("command-failure.json"), {
      operation: "terraform-apply",
      exitCode: 1,
      permission: null,
    });
    if (scenario.symlink || scenario.oversizeStat) assert.deepEqual(f.reads, []);
  }
});

test("bad public key or crypto exception preserves the independent closed command failure", async () => {
  for (const scenario of [
    { recipient: JSON.stringify({ schemaVersion: 1, publicKey: "synthetic-bad-public-key" }) },
    { cryptoFailure: true },
  ]) {
    const f = await fixture(scenario);
    await failed(f);
    assert.equal(f.seals.length, 1);
    assert(!f.writes.has("private-command-failure.json"));
    assert.deepEqual(f.writes.get("command-failure.json"), {
      operation: "terraform-apply",
      exitCode: 1,
      permission: null,
    });
    assert.deepEqual(f.writes.get("deploy-outcome.json"), { command: "deploy", status: "failed", cleanup: "passed" });
  }
});

test("failed private cleanup prohibits encrypted and closed diagnostic retention", async () => {
  const f = await fixture({ cleanupFailure: true });
  await failed(f);
  assert.equal(f.seals.length, 1);
  assert(!f.writes.has("private-command-failure.json"));
  assert(!f.writes.has("command-failure.json"));
  assert.deepEqual([...f.writes.keys()], ["deploy-outcome.json"]);
  assert.deepEqual(f.writes.get("deploy-outcome.json"), { command: "deploy", status: "failed", cleanup: "failed" });
});
