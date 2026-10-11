/**
 * Run one closed CI visibility lane without replacing mandatory acceptance or its lifecycle controller.
 * Usage: node scripts/run-ci-lane.mjs acceptance|application|server, from the repository root with pinned Node/npm.
 * Acceptance delegates, without selector arguments, to run-ci-phase.mjs: trusted suite extraction, browser
 * preparation, candidate controls, phase checks, E2E/image identity and cleanup remain that controller's responsibility.
 * Application/server lanes validate trusted admission and phase monotonicity before their real builds and closed unit
 * files. Neither produces acceptance or release evidence; the same-run terminal gate also requires acceptance success.
 * Commands write ignored build/test outputs, may use loopback connections and propagate failures or a 20-minute timeout.
 * There are no skip flags, credentials, cloud calls, Git writes, deployment operations or successful missing-file paths.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { git, repositoryFiles } from "./acceptance-baseline.mjs";
import { readAcceptanceProfileSource } from "./acceptance-profile-source.mjs";
import { runtimeAcceptance } from "./acceptance-runtime.mjs";
import { requireMonotonicPhase, requiredRootScripts } from "./phase-policy.mjs";

import { parse } from "yaml";
import { readBackendSourceCi, requireBackendSourceCi } from "./backend-source-ci.mjs";
import { requireBackendUnitLayout } from "./backend-unit-layout.mjs";

/** Validate exact event-base/admission authority and reject removal of the integrated application's phase boundary. */
export function requireLaneContext(root, env = process.env) {
  const baseRef = env.CI_BASE_REF || undefined;
  if (env.CI === "true" || env.GITHUB_ACTIONS !== undefined)
    assert(baseRef, "CI_BASE_REF must identify the trusted event base");
  if (baseRef) assert(/^[a-f0-9]{40}$/.test(baseRef) && !/^0+$/.test(baseRef), "Invalid trusted base commit");
  const phase = requireMonotonicPhase(repositoryFiles(root), baseRef ? repositoryFiles(root, baseRef) : []);
  assert.equal(phase, "integration", "Split lanes require the integrated application");
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  for (const script of requiredRootScripts(phase))
    assert(typeof pkg.scripts?.[script] === "string" && pkg.scripts[script].trim(), `Missing mandatory ${script}`);
  const selection = runtimeAcceptance(root, env);
  const context = selection.admission?.record.context ?? selection.localSelection;
  readAcceptanceProfileSource(root, {
    selection,
    sourceRevision: context?.sourceRevision ?? git(root, ["--no-replace-objects", "rev-parse", "HEAD"]).trim(),
    baseRevision: context?.baseRevision ?? baseRef ?? null,
  });
}

/** Use actual checkout files with exact committed ancestry; deleting source cannot restore historical ownership. */
function ownedUnitInput(root) {
  const source = git(root, ["--no-replace-objects", "rev-parse", "HEAD"]).trim();
  const committed = readBackendSourceCi(root, source, process.env.CI_BASE_REF || source);
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const linter = parse(readFileSync(join(root, ".github/workflows/linter.yml"), "utf8"));
  const prefix = "node --experimental-vm-modules --test ";
  assert(typeof pkg.scripts?.["test:tooling"] === "string" && pkg.scripts["test:tooling"].startsWith(prefix));
  const deletedPaths = new Set(
    git(root, ["--no-replace-objects", "ls-files", "--deleted", "-z"]).split("\0").filter(Boolean),
  );
  const input = {
    sourceFiles: repositoryFiles(root).filter((path) => !deletedPaths.has(path)),
    ancestorFiles: [committed.sourceFiles, ...committed.ancestorFiles],
    packageScripts: pkg.scripts,
    linterCommands: linter.jobs.checks.steps.at(-1).run,
    toolingFiles: pkg.scripts["test:tooling"].slice(prefix.length).split(" "),
  };
  requireBackendSourceCi(input);
  return { sourceFiles: input.sourceFiles, ancestorFiles: input.ancestorFiles };
}

/** Require every unit file to have an explicit owner; absent, added, symlinked or special files cannot silently pass. */
function requireUnitInventory(root, input) {
  const { unitFiles } = requireBackendUnitLayout(input);
  for (const file of Object.values(unitFiles).flat())
    assert(lstatSync(join(root, file)).isFile(), `Unit test must be a regular file: ${file}`);
}

/** Build once at the pinned root, then run exactly owned units from their application's directory; no shell. */
export function runCiUnitLane(root, lane, input, execute) {
  assert(typeof root === "string" && isAbsolute(root) && resolve(root) === root && !/[\x00-\x1f\x7f]/.test(root));
  assert(["application", "server"].includes(lane), "Unknown unit lane");
  assert.equal(typeof execute, "function", "Unit lane needs an executor");
  const { layout, unitFiles } = requireBackendUnitLayout(input);
  const directory = lane === "server" ? "server" : "frontend";
  const cwd = layout === "localized" ? join(root, directory) : root;
  const files = unitFiles[lane].map((file) => relative(cwd, join(root, file)));
  execute("npm", ["run", `build:${directory}`], { cwd: root });
  execute(process.execPath, ["--test", ...files], { cwd });
}

/** Execute only the declared commands without a shell, inheriting visible logs and preserving failures. */
function run(command, args, root) {
  const result = spawnSync(command, args, { cwd: root, env: process.env, stdio: "inherit", timeout: 20 * 60 * 1000 });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed (status ${result.status})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    assert.equal(process.argv.length, 3, "Supply exactly one known lane; selectors and skip flags are not accepted");
    const lane = process.argv[2];
    assert(["acceptance", "application", "server"].includes(lane), "Unknown CI lane");
    const root = process.cwd();
    if (lane === "acceptance") {
      // The controller derives any lane deduplication from actual admission and its complete committed CI graph.
      run(process.execPath, ["scripts/run-ci-phase.mjs"], root);
    } else {
      requireLaneContext(root);
      const input = ownedUnitInput(root);
      requireUnitInventory(root, input);
      runCiUnitLane(root, lane, input, (command, args, { cwd }) => run(command, args, cwd));
    }
    console.log(`${lane} lane passed; this does not independently establish acceptance, publication or deployment.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
