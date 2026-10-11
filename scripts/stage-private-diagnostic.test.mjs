/**
 * Independently specify failure-only encrypted Terraform diagnostics before implementation.
 * Run pinned Node 24.20.0 with --experimental-vm-modules --test scripts/stage-private-diagnostic.test.mjs.
 * Inputs are synthetic messages and one RSA-3072 private pair generated only in memory. Independent Node crypto
 * decrypts the closed record and authenticates exact ordered metadata. A public-only synthetic RSA-4096 key checks
 * the supported modulus boundary, not a second private-key round trip. No cloud data, private key or credential is
 * persisted. The helper must remain free of I/O, environment reads and caller mutation; import availability is
 * asserted before expected rejections. Missing availability is red, never proof that invalid inputs are refused.
 */
import assert from "node:assert/strict";
import {
  constants,
  createDecipheriv,
  createHash,
  createPublicKey,
  generateKeyPairSync,
  privateDecrypt,
} from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const moduleUrl = new URL("./stage-private-diagnostic.mjs", import.meta.url);
const operations = ["terraform-init", "terraform-plan", "terraform-show", "terraform-apply"];
const marker = "SYNTHETIC_PRIVATE_DIAGNOSTIC_CANARY";
const fields = [
  "schemaVersion",
  "kind",
  "algorithm",
  "operation",
  "exitCode",
  "context",
  "publicKeySha256",
  "encryptedKey",
  "iv",
  "tag",
  "ciphertext",
];
let ephemeral;

function keyPair() {
  ephemeral ??= generateKeyPairSync("rsa", {
    modulusLength: 3072,
    publicExponent: 65537,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return ephemeral;
}

function available() {
  assert(existsSync(moduleUrl), "Missing sealStageDiagnostic module; availability red only");
  return readFileSync(moduleUrl, "utf8");
}

async function load() {
  available();
  const module = await import(moduleUrl.href);
  assert.equal(typeof module.sealStageDiagnostic, "function", "Missing sealStageDiagnostic public export");
  return module.sealStageDiagnostic;
}

function input() {
  return {
    publicKey: keyPair().publicKey,
    operation: "terraform-apply",
    exitCode: 1,
    context: { sourceRevision: "a".repeat(40), runId: 7001, runAttempt: 1 },
    stdout: `${marker}\nSynthetic URL https://diagnostic.invalid/private-id\nUnicode: α🙂\n`,
    stderr: `${marker}\nSynthetic token: synthetic.token.canary\r\nError: synthetic private identifier\n`,
    stdoutTruncated: true,
    stderrTruncated: false,
  };
}

function digest(publicKey) {
  return createHash("sha256")
    .update(createPublicKey(publicKey).export({ type: "spki", format: "der" }))
    .digest("hex");
}

/** The public contract fixes this serialization order, independently of a helper's object construction. */
function metadata(record) {
  return {
    schemaVersion: record.schemaVersion,
    kind: record.kind,
    algorithm: record.algorithm,
    operation: record.operation,
    exitCode: record.exitCode,
    context: {
      sourceRevision: record.context.sourceRevision,
      runId: record.context.runId,
      runAttempt: record.context.runAttempt,
    },
    publicKeySha256: record.publicKeySha256,
  };
}

function binary(value) {
  assert.equal(typeof value, "string");
  assert.match(value, /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u);
  assert(value.length > 0);
  const decoded = Buffer.from(value, "base64");
  assert.equal(decoded.toString("base64"), value, "Crypto bytes must use canonical base64");
  return decoded;
}

function plaintext(record, privateKey = keyPair().privateKey, aad = metadata(record)) {
  const key = privateDecrypt(
    { key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    binary(record.encryptedKey),
  );
  assert.equal(key.length, 32);
  const decipher = createDecipheriv("aes-256-gcm", key, binary(record.iv));
  decipher.setAAD(Buffer.from(JSON.stringify(aad), "utf8"));
  decipher.setAuthTag(binary(record.tag));
  const bytes = Buffer.concat([decipher.update(binary(record.ciphertext)), decipher.final()]);
  key.fill(0);
  const result = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  assert.deepEqual(Object.keys(result).sort(), ["stdout", "stderr", "stdoutTruncated", "stderrTruncated"].sort());
  return result;
}

function closed(record, options, modulusBytes = 384) {
  assert.deepEqual(Reflect.ownKeys(record).sort(), [...fields].sort());
  assert.equal(record.schemaVersion, 1);
  assert.equal(record.kind, "encrypted-stage-command-diagnostic");
  assert.equal(record.algorithm, "RSA-OAEP-256+A256GCM");
  assert.equal(record.operation, options.operation);
  assert.equal(record.exitCode, options.exitCode);
  assert.deepEqual(record.context, options.context);
  assert.deepEqual(Object.keys(record.context).sort(), ["sourceRevision", "runId", "runAttempt"].sort());
  assert.equal(record.publicKeySha256, digest(options.publicKey));
  assert.equal(binary(record.encryptedKey).length, modulusBytes);
  assert.equal(binary(record.iv).length, 12);
  assert.equal(binary(record.tag).length, 16);
  assert(binary(record.ciphertext).length > 0);
  const text = JSON.stringify(record);
  for (const canary of [marker, "synthetic.token.canary", "https://diagnostic.invalid/private-id", "PRIVATE KEY"])
    assert(!text.includes(canary), "Returned record must contain no plaintext or private material");
}

function sanitized(error) {
  assert(error instanceof Error);
  assert.equal(error.code, "ERR_STAGE_PRIVATE_DIAGNOSTIC");
  assert.equal(error.message, "Stage private diagnostic failed");
  assert.equal(error.cause, undefined);
  for (const canary of [marker, "synthetic.token.canary", "private-id", "PRIVATE KEY"])
    assert(!JSON.stringify(error).includes(canary));
  return true;
}

function publicOnlyRsa(bits) {
  const modulus = Buffer.alloc(bits / 8, 0xa5);
  return createPublicKey({
    key: { kty: "RSA", n: modulus.toString("base64url"), e: "AQAB" },
    format: "jwk",
  }).export({ type: "spki", format: "pem" });
}

test("public import is inert and sealing reads no environment or I/O", async () => {
  const source = available();
  const effects = { entropy: 0, io: 0, environment: 0 };
  const forbidden = () => {
    effects.io++;
    throw new Error("Unexpected diagnostic side effect");
  };
  const processBoundary = { version: process.version };
  Object.defineProperty(processBoundary, "env", {
    get() {
      effects.environment++;
      throw new Error("Unexpected environment read");
    },
  });
  const context = vm.createContext({
    Buffer,
    TextEncoder,
    TextDecoder,
    structuredClone,
    process: processBoundary,
    fetch: forbidden,
    console: { log: forbidden, error: forbidden, warn: forbidden },
  });
  const module = new vm.SourceTextModule(source, { context, identifier: moduleUrl.href });
  await module.link(async (name) => {
    assert(["node:crypto", "node:assert/strict"].includes(name), "Diagnostic dependencies must stay pure");
    const exports = { ...(await import(name)) };
    if (name === "node:crypto") {
      for (const entropy of ["randomBytes", "randomFill", "randomFillSync", "randomInt", "randomUUID", "publicEncrypt"])
        if (typeof exports[entropy] === "function") {
          const original = exports[entropy];
          exports[entropy] = (...args) => {
            effects.entropy++;
            return original(...args);
          };
        }
      if (exports.default) exports.default = { ...exports.default, ...exports };
    }
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
  assert.equal(typeof module.namespace.sealStageDiagnostic, "function");
  assert.deepEqual(effects, { entropy: 0, io: 0, environment: 0 });
  context.seal = module.namespace.sealStageDiagnostic;
  context.optionsJSON = JSON.stringify({ ...input(), exitCode: 0 });
  assert.throws(() => vm.runInContext("seal(JSON.parse(optionsJSON))", context));
  assert.deepEqual(effects, { entropy: 0, io: 0, environment: 0 }, "Malformed authority must precede crypto work");
  const options = input();
  context.optionsJSON = JSON.stringify(options);
  const record = JSON.parse(JSON.stringify(vm.runInContext("seal(JSON.parse(optionsJSON))", context)));
  closed(record, options);
  assert.equal(plaintext(record).stderr, options.stderr);
  assert.equal(effects.io, 0);
  assert.equal(effects.environment, 0);
});

test("independent OAEP SHA256 and AES256 GCM decrypt exact text and flags for all fixed failure operations", async () => {
  const seal = await load();
  for (const operation of operations) {
    const options = { ...input(), operation, exitCode: operation === "terraform-init" ? 255 : 1 };
    const record = seal(options);
    closed(record, options);
    assert.deepEqual(plaintext(record), {
      stdout: options.stdout,
      stderr: options.stderr,
      stdoutTruncated: options.stdoutTruncated,
      stderrTruncated: options.stderrTruncated,
    });
  }
});

test("same failed retry receives fresh encryption and leaves caller data unchanged", async () => {
  const seal = await load();
  const options = input();
  Object.freeze(options.context);
  Object.freeze(options);
  const original = JSON.stringify(options);
  const first = seal(options),
    second = seal(options);
  assert.notEqual(first.iv, second.iv);
  assert.notEqual(first.ciphertext, second.ciphertext);
  assert.notEqual(first.encryptedKey, second.encryptedKey);
  assert.equal(first.publicKeySha256, second.publicKeySha256);
  assert.deepEqual(plaintext(first), plaintext(second));
  assert.equal(JSON.stringify(options), original);
});

test("metadata AAD and every encrypted component reject independent tampering", async () => {
  const seal = await load();
  const record = seal(input());
  const mutations = [
    (r) => {
      r.schemaVersion = 2;
    },
    (r) => {
      r.kind = "substituted-diagnostic";
    },
    (r) => {
      r.algorithm = "substituted-algorithm";
    },
    (r) => {
      r.operation = "terraform-plan";
    },
    (r) => {
      r.exitCode = 2;
    },
    (r) => {
      r.context.sourceRevision = "b".repeat(40);
    },
    (r) => {
      r.context.runId++;
    },
    (r) => {
      r.context.runAttempt++;
    },
    (r) => {
      r.publicKeySha256 = "0".repeat(64);
    },
    ...["encryptedKey", "iv", "tag", "ciphertext"].map((field) => (r) => {
      const bytes = binary(r[field]);
      bytes[0] ^= 1;
      r[field] = bytes.toString("base64");
    }),
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(record);
    mutate(changed);
    assert.throws(() => plaintext(changed));
  }
  const reordered = { ...metadata(record) };
  delete reordered.schemaVersion;
  reordered.schemaVersion = record.schemaVersion;
  assert.throws(() => plaintext(record, keyPair().privateKey, reordered), "AAD serialization order is contractual");
});

test("public-only RSA4096 recipient is supported and refuses the different RSA3072 private key", async () => {
  const seal = await load();
  const options = { ...input(), publicKey: publicOnlyRsa(4096) };
  const record = seal(options);
  closed(record, options, 512);
  assert.throws(() => plaintext(record), "A different recipient key must not recover the encrypted stream");
});

test("closed options and context refuse inherited extra symbol and accessor fields without evaluating accessors", async () => {
  const seal = await load();
  const valid = input();
  const invalid = [null, [], {}, Object.create(valid), { ...valid, extra: marker }];
  for (const name of Object.keys(valid)) {
    const missing = { ...valid };
    delete missing[name];
    invalid.push(missing);
  }
  const symbol = { ...valid, [Symbol("unreviewed")]: marker };
  invalid.push(symbol);
  invalid.push({ ...valid, context: { ...valid.context, extra: marker } });
  invalid.push({ ...valid, context: Object.create(valid.context) });
  for (const name of Object.keys(valid.context)) {
    const missing = { ...valid.context };
    delete missing[name];
    invalid.push({ ...valid, context: missing });
  }
  let accessorEffects = 0;
  const getter = () => {
    accessorEffects++;
    return marker;
  };
  const accessor = { ...valid };
  Object.defineProperty(accessor, "stdout", { get: getter, enumerable: true });
  invalid.push(accessor);
  const nested = { ...valid.context };
  Object.defineProperty(nested, "sourceRevision", { get: getter, enumerable: true });
  invalid.push({ ...valid, context: nested });
  const hidden = { ...valid };
  Object.defineProperty(hidden, "privateExtra", { value: marker });
  invalid.push(hidden);
  for (const options of invalid) assert.throws(() => seal(options), sanitized);
  assert.equal(accessorEffects, 0);
});

test("only bounded SPKI RSA3072 or RSA4096 public PEM is admitted", async () => {
  const seal = await load();
  const pair = keyPair();
  const ec = createPublicKey({
    key: {
      kty: "EC",
      crv: "P-256",
      x: Buffer.from("6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296", "hex").toString("base64url"),
      y: Buffer.from("4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5", "hex").toString("base64url"),
    },
    format: "jwk",
  }).export({ type: "spki", format: "pem" });
  const invalid = [
    undefined,
    null,
    1,
    false,
    Buffer.from(pair.publicKey),
    new String(pair.publicKey),
    "",
    marker,
    pair.privateKey,
    ec,
    publicOnlyRsa(2048),
    publicOnlyRsa(1024),
    publicOnlyRsa(5120),
    createPublicKey(pair.publicKey).export({ type: "pkcs1", format: "pem" }),
    pair.publicKey + pair.publicKey,
    pair.publicKey.padEnd(8193, " "),
  ];
  for (const publicKey of invalid) assert.throws(() => seal({ ...input(), publicKey }), sanitized);
  const bounded = { ...input(), publicKey: pair.publicKey.padEnd(8192, " ") };
  const record = seal(bounded);
  closed(record, bounded);
  assert.equal(plaintext(record).stdout, bounded.stdout);
});

test("stream UTF8 boundaries preserve complete or explicitly truncated text and reject invalid stream types", async () => {
  const seal = await load();
  for (const options of [
    { ...input(), stdout: "", stderr: "", stdoutTruncated: false, stderrTruncated: false },
    { ...input(), stdout: "a".repeat(65536), stderr: "🙂".repeat(16384), stdoutTruncated: true, stderrTruncated: true },
  ]) {
    const record = seal(options);
    assert.deepEqual(plaintext(record), {
      stdout: options.stdout,
      stderr: options.stderr,
      stdoutTruncated: options.stdoutTruncated,
      stderrTruncated: options.stderrTruncated,
    });
  }
  for (const field of ["stdout", "stderr"])
    for (const value of [
      undefined,
      null,
      false,
      1,
      Buffer.from(marker),
      new String(marker),
      "a".repeat(65537),
      "🙂".repeat(16385),
    ])
      assert.throws(() => seal({ ...input(), [field]: value }), sanitized);
  for (const field of ["stdoutTruncated", "stderrTruncated"])
    for (const value of [undefined, null, 0, 1, "true", new Boolean(false)])
      assert.throws(() => seal({ ...input(), [field]: value }), sanitized);
});

test("only fixed failure exits and exact lowercase source positive run identities reach sealing", async () => {
  const seal = await load();
  for (const operation of [
    undefined,
    null,
    "",
    "terraform-destroy",
    "terraform-APPLY",
    marker,
    new String("terraform-apply"),
  ])
    assert.throws(() => seal({ ...input(), operation }), sanitized);
  for (const exitCode of [undefined, null, 0, -1, 256, 1.5, NaN, Infinity, "1", "SIGTERM", 1n])
    assert.throws(() => seal({ ...input(), exitCode }), sanitized);
  for (const sourceRevision of [
    undefined,
    null,
    "A".repeat(40),
    "a".repeat(39),
    "a".repeat(41),
    "g".repeat(40),
    marker,
  ])
    assert.throws(() => seal({ ...input(), context: { ...input().context, sourceRevision } }), sanitized);
  for (const field of ["runId", "runAttempt"])
    for (const value of [undefined, null, 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, "1", 1n])
      assert.throws(() => seal({ ...input(), context: { ...input().context, [field]: value } }), sanitized);
  const maximum = {
    ...input(),
    context: { sourceRevision: "a".repeat(40), runId: Number.MAX_SAFE_INTEGER, runAttempt: Number.MAX_SAFE_INTEGER },
  };
  closed(seal(maximum), maximum);
});
