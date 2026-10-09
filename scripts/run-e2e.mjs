/**
 * Build and test the real two-container application against the independently frozen external acceptance suite.
 *
 * Invoke `npm run test:e2e` through `npm run check:phase`; no CLI arguments, caller URLs or test filters are accepted.
 * TRUSTED_ACCEPTANCE_ROOT must name the controller's verified suite checkout outside this repository. Docker and
 * Compose must be running; optional DOCKER_CONFIG is inherited by Docker commands without recording its location.
 * This script rechecks the freeze and extracted suite, builds both clean images, publishes stable OS-selected loopback ports,
 * installs pinned Chromium and runs the complete suite with authenticated, explicitly scoped API fault operations.
 * On Linux CI only, pinned Playwright also installs its required browser OS packages through apt/sudo; local host
 * packages are never implicitly installed. Every stage shares a 1,100-second work budget plus 30-second cleanup.
 *
 * Side effects are scoped containers/network/images, browser installation, temporary Compose JSON and sanitized
 * .artifacts/e2e-result.json plus a per-run evidence copy. Every failure propagates. Signals/deadlines trigger bounded
 * process-group termination, API unpause and project cleanup; failed cleanup cannot become a successful result.
 * No provider resources, production URLs, application bind mounts or Docker socket access are given to the suite.
 */

import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { git, repositoryFiles, suitePath, verifyBaseline } from "./acceptance-baseline.mjs";
import {
  command,
  faultServer,
  isolatedCompose,
  loopbackOrigin,
  reserveApplicationPorts,
  withCleanup,
} from "./e2e-controller.mjs";

const root = process.cwd();
const project = `mp3-e2e-${process.pid}-${randomBytes(6).toString("hex")}`;
const token = randomBytes(32).toString("hex");
const abort = new AbortController();
const started = Date.now();
const deadline = started + 1_100_000; // Reserve thirty seconds for cleanup inside the outer twenty-minute limit.
const report = {
  schemaVersion: 1,
  project,
  status: "failed",
  targetKind: "local",
  cleanup: "not-started",
  acceptance: { status: "blocked", planned: null, passed: 0, failed: 0, skipped: 0 },
};
let temporary;
let compose;
let reservations;
let fault;
let apiId;
let apiOrigin;
let suiteRoot;
let lifecycleError;
let logs = "";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const sanitize = (value) =>
  String(value)
    .replaceAll(token, "[redacted]")
    .replaceAll(root, "[repository]")
    .replaceAll(suiteRoot ?? "\0", "[acceptance]")
    .replaceAll(temporary ?? "\0", "[temporary]")
    .replace(/\/(?:Users|home)\/[^\s"'<>():]+/g, "[local-path]");
const output = (chunk) => {
  logs += chunk;
  const lines = logs.split("\n");
  logs = lines.pop();
  for (const line of lines) console.log(sanitize(line));
};
const signal = () => abort.abort();
process.on("SIGINT", signal);
process.on("SIGTERM", signal);

/** Run asynchronous work so the host fault server remains responsive while Chromium is executing. */
async function run(executable, args, options = {}) {
  const timeoutMs = Math.min(options.timeoutMs ?? 30_000, deadline - Date.now());
  assert(timeoutMs > 0, "E2E lifecycle exhausted the outer phase deadline");
  return command(executable, args, { cwd: root, signal: abort.signal, ...options, timeoutMs });
}

/** Inspect only a known container and require Compose's exact ownership labels before any operation. */
async function inspect(id, service, cleanup = false) {
  assert(/^[a-f0-9]{64}$/.test(id), "Expected an exact Docker container identity");
  const invoke = cleanup ? command : run;
  const [container] = JSON.parse(await invoke("docker", ["inspect", id], { timeoutMs: 5000 }));
  assert.equal(container.Id, id);
  assert.equal(container.Config.Labels["com.docker.compose.project"], project, "Container project identity changed");
  assert.equal(container.Config.Labels["com.docker.compose.service"], service, "Container service identity changed");
  if (report.images?.[service]) assert.equal(container.Image, report.images[service], "Tested image identity changed");
  return container;
}

/** Poll actual JSON health with a bounded request; static health alone never counts as acceptance. */
async function healthy(origin, timeoutMs = 30_000) {
  const until = Math.min(Date.now() + timeoutMs, deadline);
  while (Date.now() < until) {
    if (abort.signal.aborted) throw new Error("E2E lifecycle interrupted");
    try {
      const response = await fetch(`${origin}/healthz`, { signal: AbortSignal.timeout(1500), redirect: "error" });
      if (response.status === 200 && JSON.stringify(await response.json()) === '{"status":"ok"}') return;
    } catch {
      /* Readiness is retried only inside the explicit deadline. */
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  }
  throw new Error("Service health did not become ready within its deadline");
}

/** Operate on the same owned API container so stop/start cannot quietly replace the tested image or network address. */
async function control(action) {
  let container = await inspect(apiId, "api");
  if (container.State.Paused && action !== "pause") await run("docker", ["unpause", apiId]);
  if (action === "stop") await run("docker", ["stop", "--time", "5", apiId]);
  if (action === "start") await run("docker", ["start", apiId]);
  if (action === "pause" && !container.State.Paused) await run("docker", ["pause", apiId]);
  if (action === "resume" && !container.State.Running) await run("docker", ["start", apiId]);
  container = await inspect(apiId, "api");
  if (action === "stop") assert.equal(container.State.Running, false, "API did not stop");
  else if (action === "pause") assert.equal(container.State.Paused, true, "API did not pause");
  else {
    assert.equal(container.State.Running, true, "API did not resume");
    assert.equal(container.State.Paused, false, "API remained paused");
    assert.equal(
      loopbackOrigin(await run("docker", [...compose, "port", "api", "3000"])),
      apiOrigin,
      "API publication changed after a controlled fault",
    );
    await healthy(apiOrigin);
  }
}

/** Compare every extracted source byte/path to the recorded tree while excluding only package-generated outputs. */
function verifyExtracted(baseline) {
  assert(process.env.TRUSTED_ACCEPTANCE_ROOT, "Run npm run check:phase to supply the isolated frozen acceptance suite");
  suiteRoot = realpathSync(process.env.TRUSTED_ACCEPTANCE_ROOT);
  const relation = relative(realpathSync(root), suiteRoot);
  assert(relation.startsWith("../") || relation === "..", "Acceptance checkout must be outside the product tree");
  const expected = repositoryFiles(root, baseline.suiteCommit).filter((file) => file.startsWith(`${suitePath}/`));
  const discovered = [];
  const ignored = new Set(["node_modules", ".artifacts", "test-results", "playwright-report"]);
  const walk = (directory, prefix = "") => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!prefix && ignored.has(entry.name)) continue;
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      assert(!entry.isSymbolicLink(), "Acceptance source cannot contain symlinks");
      if (entry.isDirectory()) walk(join(directory, entry.name), path);
      else {
        assert(entry.isFile(), "Unexpected acceptance file type");
        discovered.push(`${suitePath}/${path}`);
      }
    }
  };
  walk(suiteRoot);
  assert.deepEqual(discovered.sort(), expected.sort(), "Extracted acceptance paths differ from the frozen tree");
  for (const file of expected) {
    const path = join(suiteRoot, file.slice(suitePath.length + 1));
    assert(lstatSync(path).isFile());
    assert.equal(
      hash(readFileSync(path)),
      hash(git(root, ["show", `${baseline.suiteCommit}:${file}`], null)),
      "Extracted acceptance source differs from its frozen identity",
    );
  }
}

try {
  await withCleanup(
    async () => {
      assert.equal(process.argv.length, 2, "E2E accepts no filters, phase selectors or target overrides");
      const baseline = verifyBaseline(root, process.env.CI_BASE_REF || undefined);
      verifyExtracted(baseline);
      Object.assign(report, {
        sourceRevision: git(root, ["rev-parse", "HEAD"]).trim(),
        sourceDirty: Boolean(git(root, ["status", "--porcelain"])),
        trackedDiffSha256: hash(git(root, ["diff", "HEAD", "--binary"], null)),
        suiteCommit: baseline.suiteCommit,
        suiteTree: baseline.suiteTree,
        manifestSha256: baseline.manifestSha256,
        contractRevision: baseline.contractRevision,
        baselinePublication:
          baseline.publicationStatus ??
          (process.env.CI_BASE_REF ? "trusted-base-ancestor-verified" : "local-ancestor-only"),
      });
      temporary = mkdtempSync(join(tmpdir(), "mp3-e2e-"));
      const emptyEnv = join(temporary, "empty.env");
      writeFileSync(emptyEnv, "");
      const resolved = JSON.parse(
        await run("docker", [
          "compose",
          "--project-name",
          project,
          "--env-file",
          emptyEnv,
          "-f",
          "compose.yaml",
          "config",
          "--format",
          "json",
        ]),
      );
      reservations = await reserveApplicationPorts();
      const config = isolatedCompose(resolved, project, root, reservations.ports);
      for (const service of Object.values(config.services)) {
        assert.equal(
          realpathSync(service.build.context),
          resolve(service.build.context),
          "Build context must not escape through symlinks",
        );
      }
      const configPath = join(temporary, "compose.json");
      writeFileSync(configPath, JSON.stringify(config));
      report.configurationSha256 = hash(JSON.stringify(config));
      compose = [
        "compose",
        "--project-name",
        project,
        "--project-directory",
        root,
        "--env-file",
        emptyEnv,
        "-f",
        configPath,
      ];
      await run("docker", [...compose, "config", "--quiet"]);
      await run("docker", [...compose, "build", "--no-cache", "api", "frontend"], {
        timeoutMs: 600_000,
        onOutput: output,
      });
      // Keep both selected ports reserved through the build, then release immediately before Docker binds them.
      // If another process wins this narrow race, Compose must fail; never retry with new targets or remove its owner.
      await reservations.release();
      await run("docker", [...compose, "up", "--detach", "--no-build", "--wait", "--wait-timeout", "60"], {
        timeoutMs: 70_000,
        onOutput: output,
      });
      apiId = await run("docker", [...compose, "ps", "--all", "--quiet", "api"]);
      const frontendId = await run("docker", [...compose, "ps", "--all", "--quiet", "frontend"]);
      const api = await inspect(apiId, "api");
      const frontend = await inspect(frontendId, "frontend");
      report.images = { api: api.Image, frontend: frontend.Image };
      report.containers = { api: apiId, frontend: frontendId };
      const baseOrigin = loopbackOrigin(await run("docker", [...compose, "port", "frontend", "8080"]));
      apiOrigin = loopbackOrigin(await run("docker", [...compose, "port", "api", "3000"]));
      assert.equal(baseOrigin, `http://127.0.0.1:${reservations.ports.frontend}`, "Frontend binding changed");
      assert.equal(apiOrigin, `http://127.0.0.1:${reservations.ports.api}`, "API binding changed");
      await Promise.all([healthy(baseOrigin), healthy(apiOrigin)]);
      fault = await faultServer(token, async (action) => {
        try {
          await control(action);
        } catch (error) {
          report.controlFailures ??= [];
          report.controlFailures.push({ action, reason: sanitize(error.message) });
          throw error;
        }
      });
      const suiteEnv = Object.fromEntries(
        ["PATH", "HOME", "TMPDIR", "CI", "LANG", "LC_ALL", "XDG_RUNTIME_DIR"]
          .filter((key) => process.env[key] !== undefined)
          .map((key) => [key, process.env[key]]),
      );
      Object.assign(suiteEnv, {
        BASE_URL: baseOrigin,
        API_BASE_URL: apiOrigin,
        FAULT_CONTROL_URL: fault.origin,
        ACCEPTANCE_TARGET_KIND: "local",
        ACCEPTANCE_TARGET_ORIGIN: baseOrigin,
        ACCEPTANCE_TARGET_ID: project,
        ACCEPTANCE_ALLOW_FAULTS: "1",
        ACCEPTANCE_FAULT_TOKEN: token,
        ACCEPTANCE_SUITE_REVISION: baseline.suiteCommit,
      });
      if (process.env.CI === "true" && process.platform === "linux") {
        await run(
          process.execPath,
          [join(suiteRoot, "node_modules", "@playwright", "test", "cli.js"), "install-deps", "chromium"],
          { cwd: suiteRoot, env: suiteEnv, timeoutMs: 120_000, onOutput: output },
        );
      }
      await run("npm", ["run", "browser:install"], {
        cwd: suiteRoot,
        env: suiteEnv,
        timeoutMs: 180_000,
        onOutput: output,
      });
      rmSync(join(suiteRoot, ".artifacts", "result.json"), { force: true });
      let suiteFailure;
      try {
        await run("npm", ["run", "e2e"], { cwd: suiteRoot, env: suiteEnv, timeoutMs: 660_000, onOutput: output });
      } catch (error) {
        suiteFailure = error;
      }
      const result = JSON.parse(readFileSync(join(suiteRoot, ".artifacts", "result.json"), "utf8"));
      assert.equal(result.suiteRevision, baseline.suiteCommit);
      assert.equal(result.manifestSha256, baseline.manifestSha256);
      assert.equal(result.contractRevision, baseline.contractRevision);
      assert.equal(result.targetId, project);
      assert.equal(result.targetKind, "local");
      assert.equal(result.targetOrigin, baseOrigin);
      report.acceptance = {
        planned: result.planned,
        passed: result.passed,
        failed: result.failed,
        skipped: result.skipped,
        status: result.status,
      };
      if (suiteFailure) throw suiteFailure;
      assert(result.planned > 0 && Number.isSafeInteger(result.planned), "No acceptance tests ran");
      assert.equal(result.passed, result.planned);
      assert.equal(result.failed, 0);
      assert.equal(result.skipped, 0);
      assert.equal(result.status, "passed");
      report.status = "passed";
    },
    async () => {
      abort.abort();
      const errors = [];
      const cleanupStarted = Date.now();
      const cleanupRun = (args) =>
        command("docker", args, { cwd: root, timeoutMs: Math.max(1, 30_000 - (Date.now() - cleanupStarted)) });
      try {
        if (reservations) await reservations.release();
      } catch (error) {
        errors.push(error);
      }
      try {
        if (fault) await fault.close();
      } catch (error) {
        errors.push(error);
      }
      if (apiId) {
        try {
          if ((await inspect(apiId, "api", true)).State.Paused) await cleanupRun(["unpause", apiId]);
        } catch (error) {
          errors.push(error);
        }
      }
      if (compose) {
        try {
          await cleanupRun([...compose, "down", "--timeout", "5", "--remove-orphans"]);
          const remaining = await cleanupRun([
            "ps",
            "--all",
            "--quiet",
            "--filter",
            `label=com.docker.compose.project=${project}`,
          ]);
          assert.equal(remaining, "", "Owned containers remained after cleanup");
        } catch (error) {
          errors.push(error);
        }
      }
      report.cleanup = errors.length ? "failed" : "passed";
      if (errors.length) throw new AggregateError(errors, "Scoped E2E cleanup failed");
    },
  );
} catch (error) {
  lifecycleError = error;
  report.status = "failed";
  report.failure = sanitize(error.message);
  console.error(sanitize(error.message));
  process.exitCode = 1;
} finally {
  report.durationMs = Date.now() - started;
  mkdirSync(resolve(root, ".artifacts"), { recursive: true });
  const evidence = `${JSON.stringify(report, null, 2)}\n`;
  writeFileSync(join(root, ".artifacts", `${project}.json`), evidence);
  writeFileSync(join(root, ".artifacts", "e2e-result.json"), evidence);
  if (logs) console.log(sanitize(logs));
  if (temporary) rmSync(temporary, { recursive: true, force: true });
  process.removeListener("SIGINT", signal);
  process.removeListener("SIGTERM", signal);
  if (!lifecycleError) console.log("Full frozen local acceptance passed; scoped cleanup passed.");
}
