/**
 * Seal bounded failed Terraform streams for the owner's public-only RSA recipient; import is inert.
 * Import sealStageDiagnostic({ publicKey, operation, exitCode, context, stdout, stderr, stdoutTruncated,
 * stderrTruncated }). Only the four fixed Terraform operations, failed exits 1–255 and exact source/run identities
 * are admitted. Public SPKI PEM is limited to 8192 UTF-8 bytes and RSA-3072/4096; each primitive stream is at most
 * 65536 UTF-8 bytes. Truncation flags describe captured bytes and never establish complete diagnostic evidence.
 * Fresh AES-256-GCM encrypts the exact streams/flags; RSA-OAEP-SHA256 wraps its key. Ordered metadata is authenticated
 * as additional data, and SHA-256 identifies canonical DER SPKI. The returned closed record contains no plaintext.
 * Pure apart from crypto entropy: no logging, I/O, environment, subprocess, network, private-key input or mutation.
 * Temporary key/plaintext buffers are cleared. Invalid input or crypto failure throws only the fixed sanitized error.
 */
import assert from "node:assert/strict";
import { constants, createCipheriv, createHash, createPublicKey, publicEncrypt, randomBytes } from "node:crypto";

const operations = new Set(["terraform-init", "terraform-plan", "terraform-show", "terraform-apply"]);

/** Reject inherited, hidden, extra, symbol or accessor fields without invoking an input getter. */
function closed(value, names) {
  assert(value !== null && typeof value === "object" && !Array.isArray(value));
  assert([Object.prototype, null].includes(Object.getPrototypeOf(value)));
  assert.deepEqual(Reflect.ownKeys(value).sort(), [...names].sort());
  for (const name of names) {
    const descriptor = Object.getOwnPropertyDescriptor(value, name);
    assert(descriptor.enumerable && Object.hasOwn(descriptor, "value"));
  }
}

/** Encrypt one admitted failure; JSON key order is part of the independently decryptable AAD contract. */
export function sealStageDiagnostic(input) {
  let key, plaintext;
  try {
    closed(input, [
      "publicKey",
      "operation",
      "exitCode",
      "context",
      "stdout",
      "stderr",
      "stdoutTruncated",
      "stderrTruncated",
    ]);
    closed(input.context, ["sourceRevision", "runId", "runAttempt"]);
    assert(typeof input.operation === "string" && operations.has(input.operation));
    assert(Number.isInteger(input.exitCode) && input.exitCode >= 1 && input.exitCode <= 255);
    const { sourceRevision, runId, runAttempt } = input.context;
    assert(
      typeof sourceRevision === "string" && sourceRevision.length === 40 && /^[a-f0-9]{40}$/u.test(sourceRevision),
    );
    for (const value of [runId, runAttempt]) assert(Number.isSafeInteger(value) && value > 0);
    for (const name of ["stdout", "stderr"])
      assert(typeof input[name] === "string" && Buffer.byteLength(input[name], "utf8") <= 65_536);
    for (const name of ["stdoutTruncated", "stderrTruncated"]) assert(typeof input[name] === "boolean");

    assert(typeof input.publicKey === "string" && Buffer.byteLength(input.publicKey, "utf8") <= 8192);
    const pem = input.publicKey.trim();
    assert(/^-----BEGIN PUBLIC KEY-----\r?\n(?:[A-Za-z0-9+/=]+\r?\n)+-----END PUBLIC KEY-----$/u.test(pem));
    const recipient = createPublicKey({ key: pem, format: "pem", type: "spki" });
    assert.equal(recipient.asymmetricKeyType, "rsa");
    assert([3072, 4096].includes(recipient.asymmetricKeyDetails?.modulusLength));
    const publicKeySha256 = createHash("sha256")
      .update(recipient.export({ type: "spki", format: "der" }))
      .digest("hex");
    const metadata = {
      schemaVersion: 1,
      kind: "encrypted-stage-command-diagnostic",
      algorithm: "RSA-OAEP-256+A256GCM",
      operation: input.operation,
      exitCode: input.exitCode,
      context: { sourceRevision, runId, runAttempt },
      publicKeySha256,
    };
    plaintext = Buffer.from(
      JSON.stringify({
        stdout: input.stdout,
        stderr: input.stderr,
        stdoutTruncated: input.stdoutTruncated,
        stderrTruncated: input.stderrTruncated,
      }),
      "utf8",
    );
    key = randomBytes(32);
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
    cipher.setAAD(Buffer.from(JSON.stringify(metadata), "utf8"));
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const encryptedKey = publicEncrypt(
      { key: recipient, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
      key,
    );
    return {
      ...metadata,
      encryptedKey: encryptedKey.toString("base64"),
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      ciphertext: ciphertext.toString("base64"),
    };
  } catch {
    throw Object.assign(new Error("Stage private diagnostic failed"), { code: "ERR_STAGE_PRIVATE_DIAGNOSTIC" });
  } finally {
    key?.fill(0);
    plaintext?.fill(0);
  }
}
