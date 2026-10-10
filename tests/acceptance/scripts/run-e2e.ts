/**
 * Usage: npm run e2e with the README's existing nonproduction target binding. Run the complete pinned suite without
 * filters; remove stale result first and require a fresh exact passed inventory. Writes ignored reports; failures exit
 * nonzero. Discovery output cannot satisfy this launcher or establish application acceptance.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { assertExecution, CONTRACT } from "../lib/inventory.ts";
import { target, suiteRevision } from "../lib/target.ts";

const binding = target();
const revision = suiteRevision();
if (process.argv.length !== 2) throw new Error("Full acceptance does not permit test filters or additional arguments");
const report = new URL("../.artifacts/result.json", import.meta.url);
rmSync(report, { force: true });
const result = spawnSync(
  process.execPath,
  [fileURLToPath(new URL("../node_modules/@playwright/test/cli.js", import.meta.url)), "test"],
  {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    stdio: "inherit",
    env: process.env,
  },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
const value = JSON.parse(readFileSync(report, "utf8"));
assert.equal(value.evidenceKind, "application-execution");
assert.equal(value.status, "passed");
assert.equal(value.contractRevision, CONTRACT);
assert.equal(value.suiteRevision, revision);
assert.equal(value.targetKind, binding.kind);
assert.equal(value.targetId, binding.id);
assert.equal(value.targetOrigin, binding.base);
assertExecution(value.inventory, value.tests);
