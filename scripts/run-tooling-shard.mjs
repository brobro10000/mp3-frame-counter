/**
 * Execute one exact tooling shard from the independently reviewed CI visibility policy, preserving all 46 files.
 * Usage: CI_TOOLING_SHARD=foundation|acceptance|publication|delivery node scripts/run-tooling-shard.mjs, with no args.
 * Run at the repository root after npm ci. Trusted admission, actual source/base and phase monotonicity are checked
 * before tests; the root test:tooling inventory must still equal the full closed policy union exactly once.
 * Delivery additionally requires pinned Terraform 1.13.3 and its provider fixtures, installed by its own workflow.
 * Foundation installs its own pinned Mermaid browser; GitHub's Ubuntu runner executes those tests through its
 * Chrome AppArmor profile. Neither shard relies on a different worker's tools or browser cache.
 * Tests may create disposable histories/fixtures or ignored local outputs; ordinary test cleanup remains mandatory.
 * Unknown shards, extra args, omitted/added/duplicate files, missing tools and test failures fail the whole worker.
 * This runner does not write GitHub state, invoke cloud credentials, provision resources or publish/deploy software.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { selectCiToolingShards } from "./ci-visibility-policy.mjs";
import { requireLaneContext } from "./run-ci-lane.mjs";

try {
  assert.equal(process.argv.length, 2, "Tooling shards accept no caller arguments or skip flags");
  const shard = process.env.CI_TOOLING_SHARD;
  const root = process.cwd();
  requireLaneContext(root);
  const prefix = "node --experimental-vm-modules --test ";
  const command = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts?.["test:tooling"];
  assert(typeof command === "string" && command.startsWith(prefix), "Missing canonical tooling inventory");
  const declared = command.slice(prefix.length).split(" ");
  const ciToolingShards = selectCiToolingShards(declared);
  assert(Object.hasOwn(ciToolingShards, shard), "Unknown or absent CI_TOOLING_SHARD");
  const files = Object.values(ciToolingShards).flat();
  assert.equal(new Set(files).size, files.length, "Tooling policy contains duplicate files");
  assert.deepEqual([...declared].sort(), [...files].sort(), "Tooling inventory differs from the reviewed full union");
  for (const file of files)
    assert(lstatSync(join(root, file)).isFile(), `Tooling test must be a regular file: ${file}`);
  if (shard === "delivery") {
    const result = spawnSync("terraform", ["version", "-json"], {
      cwd: root,
      encoding: "utf8",
      timeout: 30000,
    });
    if (result.error) throw result.error;
    assert.equal(result.status, 0, "Delivery tooling requires its own Terraform installation");
    assert.equal(JSON.parse(result.stdout).terraform_version, "1.13.3", "Unexpected delivery Terraform version");
  }
  if (shard === "foundation") {
    const installation = spawnSync("npm", ["run", "mermaid:install"], {
      cwd: root,
      env: process.env,
      stdio: "inherit",
      timeout: 360000,
    });
    if (installation.error) throw installation.error;
    assert.equal(installation.status, 0, "Foundation tooling requires its own pinned Mermaid browser");
  }
  const chromeProfile = shard === "foundation" && process.env.GITHUB_ACTIONS === "true";
  const commandName = chromeProfile ? "aa-exec" : process.execPath;
  const args = [
    ...(chromeProfile ? ["--profile=chrome", process.execPath] : []),
    "--experimental-vm-modules",
    "--test",
    ...ciToolingShards[shard],
  ];
  const result = spawnSync(commandName, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    timeout: 20 * 60 * 1000,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `Tooling ${shard} failed (status ${result.status})`);
  console.log(
    `Tooling ${shard} passed ${ciToolingShards[shard].length} required files; this is not product acceptance.`,
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
