/**
 * Usage: node scripts/check-discovery.ts. List the entire pinned suite in its own package directory and independently
 * validate its discovery artifact and both fixed hosted profiles. Writes discovery-only JSON; never reads credentials,
 * opens a product target or creates an execution result. Rejects specs outside the three reviewed directories.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertInventory, CONTRACT } from "../lib/inventory.ts";
import { assertHostedInventory } from "../lib/hosted-inventory.ts";

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

// These literal profiles are not caller selectors: every invocation must discover both complete hosted inventories.
for (const role of ["stage", "production"] as const) {
  const destination = new URL(`../.artifacts/hosted-${role}-discovery.json`, import.meta.url);
  rmSync(destination, { force: true });
  const listed = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL("../node_modules/@playwright/test/cli.js", import.meta.url)),
      "test",
      "--config",
      `playwright.${role}.config.ts`,
      "--list",
    ],
    {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      stdio: "inherit",
      timeout: 60_000,
      env: Object.fromEntries(
        ["PATH", "HOME", "TMPDIR", "CI", "LANG", "LC_ALL"]
          .filter((key) => process.env[key] !== undefined)
          .map((key) => [key, process.env[key]]),
      ),
    },
  );
  assert.ok(!listed.error && listed.status === 0, "Hosted discovery command failed");
  const discovered = JSON.parse(readFileSync(destination, "utf8"));
  assert.deepEqual(
    Object.keys(discovered).sort(),
    ["schemaVersion", "kind", "contractRevision", "profile", "status", "inventory", "tests"].sort(),
  );
  assert.equal(discovered.schemaVersion, 1);
  assert.equal(discovered.kind, "hosted-suite-discovery");
  assert.equal(discovered.contractRevision, CONTRACT);
  assert.equal(discovered.profile, role);
  assert.equal(discovered.status, "passed");
  assert.deepEqual(discovered.tests, []);
  assertHostedInventory(role, discovered.inventory);
  console.log(`Exact ${role} discovery verified: ${discovered.inventory.length} identities; no hosted execution.`);
}

// Hosted discovery has validated the complete declaration shape; also bind its local mapping to actual local discovery.
const declarations = JSON.parse(readFileSync(new URL("../fixtures/profiles.json", import.meta.url), "utf8"));
assertInventory(declarations.profiles.local.map((mapping: { case: { file: string; title: string } }) => mapping.case));

/** Reject unowned executable spec paths; package-generated caches are the only excluded top-level directories. */
function checkSpecPaths(directory: string, prefix = ""): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!prefix && ["node_modules", ".artifacts", "test-results", "playwright-report"].includes(entry.name)) continue;
    assert.ok(!entry.isSymbolicLink(), "Acceptance source symlink is forbidden");
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) checkSpecPaths(join(directory, entry.name), path);
    else if (/\.spec\.(?:[cm]?[jt]sx?)$/i.test(entry.name)) {
      assert.ok(
        path.endsWith(".spec.ts") &&
          ["specs/", "hosted/stage/specs/", "hosted/production/specs/"].some((root) => path.startsWith(root)),
        "Executable spec is outside reviewed discovery directories",
      );
    }
  }
}
checkSpecPaths(fileURLToPath(new URL("..", import.meta.url)));
