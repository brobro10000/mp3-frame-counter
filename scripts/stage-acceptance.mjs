/**
 * Run the required frozen hosted stage suite against a controller-observed, authenticated stage destination.
 * Import runStageAcceptance({ root, bundle, admissionSha256, currentContext, images, release, observe, mint,
 * evidenceDirectory }); import is inert. The controller authenticates publication/provider observations and supplies
 * the independent product digest. This module replays original admission, installs the isolated locked suite/browser,
 * then mints only for the observed origin and passes bounded private stdin to the fixed stage wrapper. It never deploys.
 * Calls may use read-only Git, npm/browser downloads and the authorized external stage through the frozen suite.
 * Four fixed nonsecret artifact types survive: setup, original result, validated envelope and original custody.
 * Custody retains the original seven validator inputs after cleanup; owned temporary files are removed.
 * Failure throws ERR_STAGE_ACCEPTANCE after retaining available evidence, never raw child output or credential text.
 */
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { verifyAcceptanceAdmission } from "./acceptance-admission.mjs";
import { prepareAcceptanceBrowser } from "./acceptance-browser-setup.mjs";
import { readRequiredAcceptanceProfileProjection } from "./acceptance-profile-source.mjs";
import { validateHostedAcceptance, validateHostedSuiteResult } from "./hosted-evidence.mjs";
import { requireOrigin } from "./publish-release-evidence.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const failure = () => Object.assign(new Error("Stage acceptance failed"), { code: "ERR_STAGE_ACCEPTANCE" });

/** Refuse symlink ancestry and require an existing ordinary directory; return its canonical absolute identity. */
function directory(path) {
  assert(isAbsolute(path) && resolve(path) === path && realpathSync(path) === path);
  for (let cursor = path; ; cursor = dirname(cursor)) {
    assert(lstatSync(cursor).isDirectory() && !lstatSync(cursor).isSymbolicLink());
    if (cursor === dirname(cursor)) return path;
  }
}

/** Bound replacement-disabled Git reads, using no inherited credentials, Git overrides, shell or writable index. */
function git(root, env, args) {
  return execFileSync("git", ["--no-replace-objects", ...args], {
    cwd: root,
    env,
    timeout: 30000,
    maxBuffer: 32 * 1048576,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/** Extract only regular immutable suite blobs and retain their hashes for a second check after package preparation. */
function extract(root, suiteRoot, baseline, env) {
  assert.equal(
    git(root, env, ["rev-parse", `${baseline.suiteCommit}:tests/acceptance`])
      .toString()
      .trim(),
    baseline.suiteTree,
  );
  const entries = git(root, env, ["ls-tree", "-rz", baseline.suiteCommit, "--", "tests/acceptance"])
    .toString()
    .split("\0")
    .filter(Boolean);
  const files = [];
  let total = 0;
  for (const entry of entries) {
    const match = /^100644 blob ([a-f0-9]{40})\ttests\/acceptance\/(.+)$/.exec(entry);
    assert(match && !match[2].split("/").some((part) => !part || part === "." || part === ".."));
    const bytes = git(root, env, ["cat-file", "blob", match[1]]);
    total += bytes.length;
    assert(total <= 64 * 1048576);
    assert.equal(createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex"), match[1]);
    const path = join(suiteRoot, match[2]);
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    writeFileSync(path, bytes, { flag: "wx", mode: 0o600 });
    files.push({ path, sha256: sha256(bytes) });
  }
  assert(files.length > 0);
  assert.equal(sha256(readFileSync(join(suiteRoot, "fixtures/manifest.json"))), baseline.manifestSha256);
  return files;
}

/** Execute one fixed Node command with bounded discarded output and graceful wrapper cleanup before forced termination. */
async function owned(args, cwd, env, timeoutMs, signal, input) {
  return new Promise((done) => {
    let child,
      ended = false,
      stopping = false,
      forced = false,
      bytes = 0,
      killTimer,
      finalTimer;
    const group = (sig) => {
      if (!child?.pid) return false;
      try {
        process.kill(-child.pid, sig);
        return true;
      } catch (error) {
        return error.code !== "ESRCH";
      }
    };
    const finish = (exitCode, cleanup) => {
      if (ended) return;
      ended = true;
      for (const timer of [deadline, killTimer, finalTimer]) clearTimeout(timer);
      signal.removeEventListener("abort", stop);
      child?.stdin?.destroy();
      child?.stdout?.destroy();
      child?.stderr?.destroy();
      child?.unref();
      done({ passed: exitCode === 0 && !stopping, cleanup });
    };
    const stop = () => {
      if (ended || stopping) return;
      stopping = true;
      group("SIGTERM");
      killTimer = setTimeout(() => {
        forced = true;
        group("SIGKILL");
      }, 35000);
      finalTimer = setTimeout(() => finish(null, false), 40000);
    };
    const deadline = setTimeout(stop, timeoutMs);
    if (signal.aborted) {
      finish(null, true);
      return;
    }
    signal.addEventListener("abort", stop, { once: true });
    try {
      child = spawn(process.execPath, args, { cwd, env, detached: true, stdio: ["pipe", "pipe", "pipe"] });
      for (const stream of [child.stdout, child.stderr])
        stream.on("data", (chunk) => {
          bytes += chunk.length;
          if (bytes > 1048576) stop();
        });
      child.once("error", () => finish(null, !child.pid));
      child.once("close", (code) => {
        const alive = group(0);
        if (alive) group("SIGKILL");
        finish(code, !alive && !forced);
      });
      child.stdin.on("error", stop);
      child.stdin.end(input);
    } catch {
      finish(null, !child?.pid);
    }
  });
}

/** Preserve exact evidence custody/status semantics, including absent results and failed parent cleanup. */
function envelope(expected, observations, result, launchId, wrapperOutcome, parentCleanup, status) {
  const childCleanup = result?.cleanup ?? (wrapperOutcome === "not-run" ? "not-run" : "failed");
  const levels = ["passed", "not-run", "failed"];
  const cleanup = levels[Math.max(levels.indexOf(childCleanup), levels.indexOf(parentCleanup))];
  return validateHostedAcceptance({
    record: {
      schemaVersion: 1,
      kind: "hosted-acceptance",
      profile: "stage",
      status,
      sourceRevision: expected.sourceRevision,
      contractRevision: expected.declarationInput.selectedContractRevision,
      suite: expected.suite,
      release: expected.release,
      images: expected.images,
      configurationSha256: expected.configurationSha256,
      run: expected.run,
      target: observations,
      inventory: result?.inventory ?? expected.declarationInput.inventories.stage.cases,
      tests: result?.tests ?? [],
      cleanup,
    },
    suiteResult: result,
    expected,
    launchId,
    wrapperOutcome,
    observations,
    parentCleanup,
  });
}

/** Run the single adopted stage profile; caller callbacks own provider authenticity, deadlines and source checks. */
export async function runStageAcceptance(options) {
  let evidence,
    temporary,
    privateRoot,
    expected,
    setup = null,
    result = null,
    validated;
  let phase = "authority",
    wrapperOutcome = "not-run",
    parentCleanup = "passed",
    succeeded = false;
  const observations = { before: null, after: null },
    abort = new AbortController();
  const interrupt = () => abort.abort();
  const launchId = randomBytes(32).toString("hex");
  process.on("SIGINT", interrupt);
  process.on("SIGTERM", interrupt);
  try {
    assert.equal(process.version, "v24.20.0");
    assert(options && typeof options === "object" && !Array.isArray(options));
    assert.deepEqual(
      Object.keys(options).sort(),
      [
        "root",
        "bundle",
        "admissionSha256",
        "currentContext",
        "images",
        "release",
        "observe",
        "mint",
        "evidenceDirectory",
      ].sort(),
    );
    const { bundle, admissionSha256, currentContext, images, release, observe, mint } = options;
    assert(typeof observe === "function" && typeof mint === "function");
    const root = directory(options.root);
    assert(isAbsolute(options.evidenceDirectory));
    const subpath = relative(join(root, ".artifacts"), options.evidenceDirectory);
    assert(subpath && !isAbsolute(subpath) && subpath !== ".." && !subpath.startsWith("../"));
    assert.equal(resolve(options.evidenceDirectory), options.evidenceDirectory);
    let evidenceParent = root;
    for (const part of relative(root, options.evidenceDirectory).split("/")) {
      evidenceParent = join(evidenceParent, part);
      try {
        mkdirSync(evidenceParent, { mode: 0o700 });
      } catch (error) {
        assert.equal(error.code, "EEXIST");
      }
      directory(evidenceParent);
    }
    evidence = directory(options.evidenceDirectory);
    requireOrigin(bundle.origin, currentContext);
    assert.equal(bundle.origin.schemaVersion, 1);
    assert.equal(bundle.origin.workflow, ".github/workflows/ci.yml");
    assert.equal(bundle.acceptanceAdmission.sha256, admissionSha256);
    const context = bundle.origin,
      admission = bundle.acceptanceAdmission;
    const env = {
      PATH: `${dirname(process.execPath)}:/usr/local/bin:/usr/bin:/bin`,
      LANG: "en_US.UTF-8",
      LC_ALL: "en_US.UTF-8",
      TZ: "UTC",
      GIT_OPTIONAL_LOCKS: "0",
    };
    const resolution = verifyAcceptanceAdmission(root, {
      record: admission.record,
      expectedSha256: admissionSha256,
      expectedContext: {
        repository: context.repository,
        eventName: "push",
        ref: "refs/heads/main",
        sourceRevision: context.sourceRevision,
        sourceTree: git(root, env, ["rev-parse", `${context.sourceRevision}^{tree}`])
          .toString()
          .trim(),
        baseRevision: context.baseRevision,
        workflowRevision: context.workflowRevision,
        toolingRevision: context.baseRevision,
        runId: context.runId,
        attempt: context.attempt,
      },
    });
    const baseline = resolution.required;
    const projection = readRequiredAcceptanceProfileProjection(root, {
      selection: { baseline, resolution, admission },
      sourceRevision: context.sourceRevision,
      baseRevision: context.baseRevision,
    });
    assert(
      projection &&
        ["hosted-v1", "hosted-health-v1", "hosted-reasonless-v1"].includes(baseline.contractRevision) &&
        projection.required.contractRevision === baseline.contractRevision,
    );
    assert.equal(bundle.manifest.sourceRevision, context.sourceRevision);
    assert.equal(release.reservationSha256, bundle.manifest.reservationSha256);
    for (const role of ["api", "frontend"])
      for (const field of ["localImageId", "archiveSha256"])
        assert.equal(images[role][field], bundle.manifest.artifacts[role][field]);
    temporary = mkdtempSync(join(realpathSync(tmpdir()), "mp3-stage-suite-"));
    const suiteRoot = join(temporary, "tests/acceptance"),
      home = join(temporary, "home");
    mkdirSync(home, { mode: 0o700 });
    Object.assign(env, { HOME: home, TMPDIR: realpathSync(tmpdir()), CI: "true" });
    phase = "suite-extraction";
    const files = extract(root, suiteRoot, baseline, env);
    phase = "suite-install";
    const install = await owned(
      [
        join(dirname(process.execPath), "../lib/node_modules/npm/bin/npm-cli.js"),
        "ci",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
      ],
      suiteRoot,
      { ...env, npm_config_userconfig: "/dev/null", npm_config_cache: join(temporary, "npm-cache") },
      180000,
      abort.signal,
    );
    if (!install.cleanup) parentCleanup = "failed";
    assert(install.passed && install.cleanup && !abort.signal.aborted);
    phase = "browser-preparation";
    try {
      setup = await prepareAcceptanceBrowser({
        suiteRoot,
        ci: true,
        environment: env,
        deadline: performance.now() + 360000,
        signal: abort.signal,
      });
    } catch (error) {
      setup = error.setupResult ?? null;
      if (setup?.cleanup !== "confirmed") parentCleanup = "failed";
      throw failure();
    }
    for (const file of files) assert.equal(sha256(readFileSync(file.path)), file.sha256);
    assert(!abort.signal.aborted);
    phase = "target-observation";
    const before = structuredClone(await observe());
    const observedExpected = {
      profile: "stage",
      sourceRevision: context.sourceRevision,
      suite: {
        commit: baseline.suiteCommit,
        tree: baseline.suiteTree,
        fixtureManifestSha256: baseline.manifestSha256,
        profilesSha256: projection.profilesSha256,
        inventorySha256: projection.inventorySha256.stage,
      },
      release: structuredClone(release),
      images: structuredClone(images),
      configurationSha256: before.configurationSha256,
      target: { origin: before.origin, resourceId: before.resourceId, revisionId: before.revisionId },
      run: {
        id: String(currentContext.runId),
        attempt: currentContext.attempt,
        workflowRevision: currentContext.workflowRevision,
      },
      declarationInput: projection.declarationInput,
    };
    // Validate observation syntax before adopting it into evidence or requesting its audience-bound token.
    envelope(observedExpected, { before, after: null }, null, launchId, "not-run", "passed", "blocked");
    expected = observedExpected;
    assert.equal(before.environment, "stage");
    for (const role of ["api", "frontend"]) assert.equal(before.registryDigests[role], images[role].registryDigest);
    assert(Date.parse(before.observedAt) <= Date.now());
    observations.before = before;
    phase = "credential";
    const credential = await mint(before.origin);
    assert.deepEqual(Object.keys(credential).sort(), ["kind", "value", "expiresAt"].sort());
    assert.equal(credential.kind, "google-id-token");
    assert(
      typeof credential.value === "string" &&
        Buffer.byteLength(credential.value) <= 16384 &&
        /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(credential.value),
    );
    assert(
      new Date(credential.expiresAt).toISOString() === credential.expiresAt &&
        Date.parse(credential.expiresAt) >= Date.now() + 990000,
    );
    privateRoot = mkdtempSync(join(realpathSync(tmpdir()), "mp3-stage-input-"));
    const input = Buffer.from(
      JSON.stringify({
        schemaVersion: 1,
        kind: "hosted-suite-input",
        profile: "stage",
        launchId,
        sourceRevision: context.sourceRevision,
        suite: expected.suite,
        target: before,
        audience: before.origin,
        credential,
      }),
    );
    assert(input.length <= 65536 && !abort.signal.aborted);
    phase = "stage-wrapper";
    wrapperOutcome = "failed";
    const outcome = await owned(
      [join(suiteRoot, "scripts/run-stage.ts")],
      suiteRoot,
      { ...env, HOSTED_PRIVATE_DIRECTORY: privateRoot },
      900000,
      abort.signal,
      input,
    );
    input.fill(0);
    wrapperOutcome = outcome.passed ? "completed" : "failed";
    if (!outcome.cleanup) parentCleanup = "failed";
    try {
      const file = join(suiteRoot, ".artifacts/hosted-stage-result.json"),
        stat = lstatSync(file);
      assert(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 1048576);
      result = validateHostedSuiteResult({
        result: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(file))),
        expected,
        launchId,
      });
    } catch {
      wrapperOutcome = "failed";
    }
    phase = "final-observation";
    const after = structuredClone(await observe());
    envelope(expected, { before, after }, result, launchId, wrapperOutcome, parentCleanup, "failed");
    observations.after = after;
    // Passing validation independently compares both observations to exact target/configuration/image identities.
    succeeded = result?.status === "passed" && wrapperOutcome === "completed" && !abort.signal.aborted;
  } catch {
    succeeded = false;
  } finally {
    for (const path of [privateRoot, temporary])
      if (path)
        try {
          rmSync(path, { recursive: true, force: true });
        } catch {
          parentCleanup = "failed";
        }
    process.off("SIGINT", interrupt);
    process.off("SIGTERM", interrupt);
    if (parentCleanup !== "passed") succeeded = false;
  }
  try {
    if (expected) {
      const status = succeeded
        ? "passed"
        : result?.status === "blocked" && wrapperOutcome !== "failed"
          ? "blocked"
          : "failed";
      try {
        validated = envelope(expected, observations, result, launchId, wrapperOutcome, parentCleanup, status);
      } catch {
        succeeded = false;
        validated = envelope(expected, observations, result, launchId, wrapperOutcome, parentCleanup, "failed");
      }
    }
    if (evidence) {
      const save = (name, value) => {
        const bytes = Buffer.from(JSON.stringify(value, null, 2) + "\n");
        assert(bytes.length <= 1048576);
        writeFileSync(join(evidence, name), bytes, { flag: "wx", mode: 0o600 });
      };
      save("stage-acceptance-setup.json", {
        schemaVersion: 1,
        kind: "stage-acceptance-setup",
        status: succeeded ? "passed" : "failed",
        phase,
        browser: setup,
        parentCleanup,
      });
      if (result) save("stage-suite-result.json", result);
      if (validated) {
        save("stage-acceptance.json", validated);
        save("stage-acceptance-custody.json", {
          record: validated,
          suiteResult: result,
          expected,
          launchId,
          wrapperOutcome,
          observations,
          parentCleanup,
        });
      }
    }
    if (succeeded && validated?.status === "passed") return validated;
  } catch {
    /* Evidence failure is a failed stage, never a pass or raw diagnostic. */
  }
  throw failure();
}
