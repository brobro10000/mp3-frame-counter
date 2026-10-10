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

import { mandatoryJobs } from "./ci-gate.mjs";

const passing = Object.fromEntries(mandatoryJobs.map((name) => [name, { result: "success" }]));
const cases = [
  ["all mandatory jobs succeed", passing, 0],
  ...mandatoryJobs.flatMap((name) =>
    ["failure", "cancelled", "skipped", "pending", "neutral", ""].map((result) => [
      `${name}: ${result || "empty result"}`,
      { ...passing, [name]: { result } },
      1,
    ]),
  ),
  ...mandatoryJobs.map((missing) => [
    `missing ${missing}`,
    Object.fromEntries(Object.entries(passing).filter(([name]) => name !== missing)),
    1,
  ]),
  ["missing result", { ...passing, "validate-product": {} }, 1],
  ["null", null, 1],
  ["unexpected job", { ...passing, extra: { result: "success" } }, 1],
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
