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
  const env = { ...process.env };
  delete env.NEEDS_JSON;
  assert.equal(spawnSync(process.execPath, ["scripts/ci-gate.mjs"], { env }).status, 1);
});
