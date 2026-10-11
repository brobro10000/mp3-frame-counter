/**
 * Run one closed CI visibility lane without replacing mandatory acceptance or its lifecycle controller.
 * Usage: node scripts/run-ci-lane.mjs acceptance|application|server, from the repository root with pinned Node/npm.
 * Acceptance delegates, without selector arguments, to unchanged run-ci-phase.mjs: trusted suite extraction, browser
 * preparation, candidate controls, phase checks, E2E/image identity and cleanup remain that controller's responsibility.
 * Application/server lanes validate trusted admission and phase monotonicity before their real builds and closed unit
 * files. Neither produces acceptance or release evidence; the same-run terminal gate also requires acceptance success.
 * Commands write ignored build/test outputs, may use loopback connections and propagate failures or a 20-minute timeout.
 * There are no skip flags, credentials, cloud calls, Git writes, deployment operations or successful missing-file paths.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { git, repositoryFiles } from "./acceptance-baseline.mjs";
import { readAcceptanceProfileSource } from "./acceptance-profile-source.mjs";
import { runtimeAcceptance } from "./acceptance-runtime.mjs";
import { requireMonotonicPhase, requiredRootScripts } from "./phase-policy.mjs";

const unitFiles = Object.freeze({
  application: Object.freeze(["tests/unit/frontend-response.test.ts"]),
  server: Object.freeze([
    "tests/unit/docs-build.test.ts",
    "tests/unit/docs.test.ts",
    "tests/unit/http.test.ts",
    "tests/unit/mp3.test.ts",
  ]),
});

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

/** Require every unit file to have an explicit owner; absent, added, symlinked or special files cannot silently pass. */
function requireUnitInventory(root) {
  const directory = join(root, "tests/unit");
  assert.deepEqual(
    readdirSync(directory)
      .filter((file) => /\.test\.ts$/.test(file))
      .map((file) => `tests/unit/${file}`)
      .sort(),
    Object.values(unitFiles).flat().sort(),
    "Unit inventory changed; independently assign every new file to a lane",
  );
  for (const file of Object.values(unitFiles).flat())
    assert(lstatSync(join(root, file)).isFile(), `Unit test must be a regular file: ${file}`);
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
      // Preserve the complete original controller, including intentional repeated units/builds and teardown.
      run(process.execPath, ["scripts/run-ci-phase.mjs"], root);
    } else {
      requireLaneContext(root);
      requireUnitInventory(root);
      run("npm", ["run", `build:${lane === "application" ? "frontend" : "server"}`], root);
      run(process.execPath, ["--test", ...unitFiles[lane]], root);
    }
    console.log(`${lane} lane passed; this does not independently establish acceptance, publication or deployment.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
