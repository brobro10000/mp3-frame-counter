/**
 * Verify an explicit local MP3 upload through the frontend, optionally checking the independently recorded sample.
 * Usage: BASE_URL=http://127.0.0.1:8080 FILE=relative/path EXPECTED=9 node scripts/smoke-local.mjs
 * SAMPLE_BASELINE=1 instead checks the private sample's fixed hash/size and independent 6089-audio-frame expectation.
 * Reads at most 20 MiB, sends raw bytes once to a loopback origin, rejects redirects and checks exact JSON/status.
 * No file contents, paths, filenames or credentials are logged; no files/settings are written. Errors exit nonzero.
 * This small check does not replace the complete frozen acceptance suite or authorize production requests.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { open } from "node:fs/promises";

try {
  assert.equal(process.argv.length, 2, "Use the documented environment inputs; no command arguments are supported");
  const base = new URL(process.env.BASE_URL || "http://127.0.0.1:8080");
  assert(["http:", "https:"].includes(base.protocol));
  assert(["127.0.0.1", "localhost", "[::1]"].includes(base.hostname), "Only a local loopback frontend is permitted");
  assert(!base.username && !base.password && !base.search && !base.hash && base.pathname === "/");
  const sample = process.env.SAMPLE_BASELINE === "1";
  const file = process.env.FILE || (sample ? "docs/requirements/samples/assessment-sample.mp3" : undefined);
  assert(file, "FILE must identify the local input");
  const expected = sample ? 6089 : Number(process.env.EXPECTED);
  assert(Number.isSafeInteger(expected) && expected > 0, "EXPECTED must be an independent positive frame count");
  const handle = await open(file, "r");
  let bytes;
  try {
    const stat = await handle.stat();
    assert(
      stat.isFile() && stat.size > 0 && stat.size <= 20_971_520,
      "Input must be a regular file of 1–20971520 bytes",
    );
    bytes = Buffer.alloc(stat.size);
    let offset = 0;
    while (offset < bytes.length) {
      const { bytesRead } = await handle.read(bytes, offset, bytes.length - offset, offset);
      assert(bytesRead > 0, "Input changed during read");
      offset += bytesRead;
    }
    const probe = Buffer.alloc(1);
    assert.equal((await handle.read(probe, 0, 1, offset)).bytesRead, 0, "Input changed during read");
  } finally {
    await handle.close();
  }
  if (sample) {
    assert.equal(bytes.length, 1_458_172, "Sample size differs from the independent baseline");
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      "97707a18a58ba75122b1668f5ed738f090121343432d9172a6409ddfa4fc5ab3",
      "Sample hash differs from the independent baseline",
    );
  }
  const response = await fetch(new URL("/file-upload", base), {
    method: "POST",
    headers: { "Content-Type": "audio/mpeg" },
    body: bytes,
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  assert.equal(response.status, 200, "Local frontend upload did not succeed");
  assert.match(response.headers.get("content-type") || "", /^application\/json(?:;|$)/i);
  assert.deepEqual(await response.json(), { frameCount: expected });
  console.log(
    JSON.stringify({ status: "passed", target: "local-frontend", bytes: bytes.length, frameCount: expected }),
  );
} catch (error) {
  // Filesystem error messages can contain private input paths; expose only controlled assertion messages.
  console.error(
    error instanceof assert.AssertionError ? error.message : "Local smoke failed; verify input and frontend readiness.",
  );
  process.exitCode = 1;
}
