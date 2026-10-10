/**
 * Usage: node scripts/check-discovery.ts. List the entire pinned suite in its own package directory and independently
 * validate its discovery artifact. Writes only discovery.json; never opens a product target or creates a full result.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { assertInventory, CONTRACT } from "../lib/inventory.ts";

const report = new URL("../.artifacts/discovery.json", import.meta.url);
rmSync(report, { force: true });
const child = spawnSync(
  process.execPath,
  [fileURLToPath(new URL("../node_modules/@playwright/test/cli.js", import.meta.url)), "test", "--list"],
  {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    stdio: "inherit",
    env: process.env,
  },
);
if (child.error) throw child.error;
assert.equal(child.status, 0, "Discovery command failed");
const value = JSON.parse(readFileSync(report, "utf8"));
assert.equal(value.status, "passed");
assert.equal(value.contractRevision, CONTRACT);
assert.equal(value.evidenceKind, "candidate-discovery");
assert.equal(value.tests.length, 0);
assertInventory(value.inventory);
console.log(`Exact candidate discovery verified: ${value.inventory.length} identities; no application execution.`);
