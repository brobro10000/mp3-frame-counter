/**
 * Run the mandatory ordinary CI work for the repository's actual implementation phase.
 *
 * Run `node scripts/run-ci-phase.mjs` from the repository root with pinned Node/npm and Git available. CI_BASE_REF
 * is a trusted GitHub event base SHA in CI; local callers may omit it. CI without that SHA fails closed. The content
 * comparison prevents reverting to an earlier phase after integration and does not accept a phase/skip argument.
 *
 * Acceptance-only work installs and checks its standalone package. Product work requires an independently frozen
 * pre-product baseline, extracts it outside the product tree, installs its locked dependencies and runs its `check`.
 * Parser work additionally runs root test:unit and build; integration additionally runs root test:e2e with the
 * verified TRUSTED_ACCEPTANCE_ROOT. That lifecycle command must start the real app and run the suite's e2e script.
 * The runner removes its temporary suite checkout and propagates missing tools, invalid records and command failures.
 * npm may access the registry; application E2E may build local containers. It never provisions or deploys services.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { repositoryFiles, suitePath, verifyBaseline } from "./acceptance-baseline.mjs";
import { requireMonotonicPhase, requiredRootScripts } from "./phase-policy.mjs";

const root = process.cwd();
let temporary;

/** Execute a real command, inheriting visible logs but preserving a nonzero exit and a bounded wait. */
function run(command, args, cwd = root, env = process.env, options = {}) {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit", timeout: 20 * 60 * 1000, ...options });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed (status ${result.status})`);
  return result;
}

try {
  assert.equal(process.argv.length, 2, "This controller accepts no phase selectors or skip arguments");
  const baseRef = process.env.CI_BASE_REF || undefined;
  if (process.env.CI === "true") assert(baseRef, "CI_BASE_REF must identify the trusted event base");
  if (baseRef) assert(/^[a-f0-9]{40}$/.test(baseRef) && !/^0+$/.test(baseRef), "Invalid trusted base commit");
  const files = repositoryFiles(root);
  const phase = requireMonotonicPhase(files, baseRef ? repositoryFiles(root, baseRef) : []);
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  for (const script of requiredRootScripts(phase)) {
    assert(typeof pkg.scripts?.[script] === "string" && pkg.scripts[script].trim(), `Missing mandatory ${script}`);
  }
  let acceptanceRoot = join(root, suitePath);
  if (["parser", "integration"].includes(phase)) {
    const baseline = verifyBaseline(root, baseRef);
    temporary = mkdtempSync(join(tmpdir(), "mp3-acceptance-"));
    const archive = run("git", ["archive", "--format=tar", baseline.suiteCommit, suitePath], root, process.env, {
      stdio: ["ignore", "pipe", "inherit"],
      maxBuffer: 32 * 1024 * 1024,
    }).stdout;
    run("tar", ["-xf", "-", "-C", temporary], root, process.env, {
      input: archive,
      stdio: ["pipe", "inherit", "inherit"],
    });
    acceptanceRoot = join(temporary, suitePath);
  }
  if (phase !== "foundation") {
    run("npm", ["ci"], acceptanceRoot);
    run("npm", ["run", "check"], acceptanceRoot);
  }
  const env = { ...process.env, TRUSTED_ACCEPTANCE_ROOT: acceptanceRoot };
  for (const script of requiredRootScripts(phase)) run("npm", ["run", script], root, env);
  console.log(`Mandatory ${phase} checks passed. This is not deployment or application acceptance beyond that phase.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (temporary) rmSync(temporary, { recursive: true, force: true });
}
