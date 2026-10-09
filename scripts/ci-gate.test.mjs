/**
 * Verify the terminal gate's actual exit behavior before relying on it as a required GitHub check.
 *
 * Run `npm run test:gate` from the repository root. Node's built-in test runner starts the gate in a fresh process
 * for each synthetic dependency result, checking environment parsing and exit codes as well as success handling.
 * These tests do not create GitHub runs, cancel real jobs or exercise application behavior.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

const cases = [
  ["success", { "validate-foundation": { result: "success" } }, 0],
  ...["failure", "cancelled", "skipped", "pending", "neutral", ""].map((result) => [
    result || "empty result",
    { "validate-foundation": { result } },
    1,
  ]),
  ["missing job", {}, 1],
  ["missing result", { "validate-foundation": {} }, 1],
  ["null", null, 1],
  ["unexpected job", { "validate-foundation": { result: "success" }, extra: { result: "success" } }, 1],
];

// Exercise the CLI rather than just the exported function so a broken process exit cannot go unnoticed.
for (const [label, needs, status] of cases) {
  test(`terminal gate: ${label}`, () => {
    const child = spawnSync(process.execPath, ["scripts/ci-gate.mjs"], {
      env: { ...process.env, NEEDS_JSON: JSON.stringify(needs) },
      encoding: "utf8",
    });
    assert.equal(child.status, status, child.stderr);
  });
}

test("terminal gate: malformed input", () => {
  const child = spawnSync(process.execPath, ["scripts/ci-gate.mjs"], {
    env: { ...process.env, NEEDS_JSON: "{" },
  });
  assert.equal(child.status, 1);
});

test("terminal gate: absent environment", () => {
  // Explicitly remove a value inherited from CI or the developer's shell to test the missing-input path.
  const env = { ...process.env };
  delete env.NEEDS_JSON;
  assert.equal(spawnSync(process.execPath, ["scripts/ci-gate.mjs"], { env }).status, 1);
});
