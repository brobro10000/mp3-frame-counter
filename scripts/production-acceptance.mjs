/**
 * Run only the frozen three-case production smoke suite for an owner-supervised, already-deployed exact candidate.
 * Import runProductionAcceptance({ root, bundle, admissionSha256, currentContext, images, release, stage, approval,
 * operation, productionStartedAt, observe, mint, evidenceDirectory }); import is inert and there is no CLI or deployment.
 * The caller first verifies the original release bundle/publication and independently authenticates the human event,
 * provider reads and recovery/exposure bindings. JSON and matching hashes establish consistency, never human authority.
 * This helper checks complete stage custody and the existing exact approval grammar before child/provider/token effects,
 * replays original admission, extracts the immutable required suite, then runs its fixed production wrapper privately.
 * Original currentContext stays CI authority; the distinct owner-operation identifies only the new production smoke.
 * observe/mint callbacks own provider authenticity and bounded deadlines; mint may return only an origin-bound ID token.
 * Owned installation/browser/wrapper work is bounded and cleaned up. Four fixed nonsecret artifact types survive:
 * setup, original result, validated envelope and original seven-field custody after cleanup. Failures throw
 * ERR_PRODUCTION_ACCEPTANCE with no raw child output, credential, supplied value or cause.
 * No cloud resource, access/traffic, workflow, release, frozen suite or original bundle is modified by this module.
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
const failure = () => Object.assign(new Error("Production acceptance failed"), { code: "ERR_PRODUCTION_ACCEPTANCE" });

/** Require closed own data properties; callbacks are admitted only by the outer explicitly named interface. */
function fields(value, names) {
  assert(value !== null && typeof value === "object" && !Array.isArray(value));
  assert.deepEqual(Reflect.ownKeys(value).sort(), [...names].sort());
  for (const name of names) {
    const descriptor = Object.getOwnPropertyDescriptor(value, name);
    assert(descriptor.enumerable && Object.hasOwn(descriptor, "value"));
  }
}

/** Compare fresh JSON-data projections without changing caller data or treating equal values as authenticated facts. */
function same(actual, expected) {
  assert.deepEqual(structuredClone(actual), structuredClone(expected));
}

/** Admit only canonical lowercase SHA-256 bindings; these are never proof of a human event. */
function digest(value) {
  assert(typeof value === "string" && value.length === 64 && /^[a-f0-9]{64}$/u.test(value));
}

/** Bound the same opaque event/resource grammar used by V1 finalization, without URLs containing query credentials. */
function identity(value) {
  assert(typeof value === "string" && value.trim() === value && /^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,255}$/u.test(value));
}

/** Calendar round trips reject offsets, impossible dates and noncanonical UTC values before comparing their order. */
function instant(value) {
  assert(typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value));
  assert.equal(new Date(value).toISOString(), value);
}

/** Check supplied stage/approval consistency before any child or callback; external human authentication is mandatory. */
function authority({
  bundle,
  admissionSha256,
  currentContext,
  images,
  release,
  stage,
  approval,
  operation,
  productionStartedAt,
}) {
  requireOrigin(bundle.origin, currentContext);
  assert.equal(bundle.origin.schemaVersion, 1);
  assert.equal(bundle.origin.workflow, ".github/workflows/ci.yml");
  assert.equal(bundle.origin.workflowRevision, bundle.origin.sourceRevision);
  assert.equal(bundle.manifest.sourceRevision, bundle.origin.sourceRevision);
  digest(admissionSha256);
  assert.equal(bundle.acceptanceAdmission.sha256, admissionSha256);
  fields(release, ["reservationSha256", "publicationSha256"]);
  for (const value of Object.values(release)) digest(value);
  assert.equal(release.reservationSha256, bundle.manifest.reservationSha256);
  fields(images, ["api", "frontend"]);
  for (const role of ["api", "frontend"]) {
    fields(images[role], ["localImageId", "archiveSha256", "registryDigest"]);
    for (const field of ["localImageId", "archiveSha256"])
      assert.equal(images[role][field], bundle.manifest.artifacts[role][field]);
  }
  const evidence = bundle.manifest.identity.evidence;
  assert(["hosted-v1", "hosted-health-v1", "hosted-reasonless-v1"].includes(evidence.contractRevision));
  assert.equal(evidence.baselinePublication, "protected-main");
  same(evidence.acceptance, { status: "passed", planned: 72, passed: 72, failed: 0, skipped: 0 });
  const validated = validateHostedAcceptance(stage);
  assert.equal(validated.profile, "stage");
  assert.equal(validated.status, "passed");
  assert.equal(validated.inventory.length, 22);
  assert.equal(validated.tests.length, 22);
  assert.equal(validated.sourceRevision, bundle.origin.sourceRevision);
  assert.equal(validated.run.workflowRevision, bundle.origin.sourceRevision);
  assert.equal(validated.contractRevision, evidence.contractRevision);
  same(validated.release, release);
  same(validated.images, images);
  for (const [field, value] of Object.entries({
    commit: evidence.suiteCommit,
    tree: evidence.suiteTree,
    fixtureManifestSha256: evidence.fixtureManifestSha256,
  }))
    assert.equal(validated.suite[field], value);

  fields(operation, ["id", "attempt", "sourceRevision"]);
  identity(operation.id);
  assert(operation.id.startsWith("owner-operation:"));
  assert.notEqual(operation.id, String(bundle.origin.runId));
  assert(Number.isSafeInteger(operation.attempt) && operation.attempt > 0);
  assert.equal(operation.sourceRevision, bundle.origin.sourceRevision);
  fields(approval, ["reference", "sha256", "occurredAt", "candidate"]);
  identity(approval.reference);
  digest(approval.sha256);
  instant(approval.occurredAt);
  fields(approval.candidate, [
    "sourceRevision",
    "registryDigests",
    "stageConfigurationSha256",
    "productionConfigurationSha256",
    "productionResourceId",
    "exposureSha256",
    "recoverySha256",
  ]);
  assert.equal(approval.candidate.sourceRevision, bundle.origin.sourceRevision);
  same(
    approval.candidate.registryDigests,
    Object.fromEntries(["api", "frontend"].map((role) => [role, images[role].registryDigest])),
  );
  assert.equal(approval.candidate.stageConfigurationSha256, validated.configurationSha256);
  for (const field of ["stageConfigurationSha256", "productionConfigurationSha256", "exposureSha256", "recoverySha256"])
    digest(approval.candidate[field]);
  identity(approval.candidate.productionResourceId);
  instant(productionStartedAt);
  assert(validated.target.after.observedAt < approval.occurredAt);
  assert(approval.occurredAt < productionStartedAt);
  assert(Date.parse(productionStartedAt) <= Date.now());
  return validated;
}

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
  return validateHostedAcceptance(
    structuredClone({
      record: {
        schemaVersion: 1,
        kind: "hosted-acceptance",
        profile: "production",
        status,
        sourceRevision: expected.sourceRevision,
        contractRevision: expected.declarationInput.selectedContractRevision,
        suite: expected.suite,
        release: expected.release,
        images: expected.images,
        configurationSha256: expected.configurationSha256,
        run: expected.run,
        target: observations,
        inventory: result?.inventory ?? expected.declarationInput.inventories.production.cases,
        tests: result?.tests ?? [],
        cleanup,
      },
      suiteResult: result,
      expected,
      launchId,
      wrapperOutcome,
      observations,
      parentCleanup,
    }),
  );
}

/** Run the one frozen production smoke profile; the external owner caller authenticates the human/provider facts. */
export async function runProductionAcceptance(options) {
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
    fields(options, [
      "root",
      "bundle",
      "admissionSha256",
      "currentContext",
      "images",
      "release",
      "stage",
      "approval",
      "operation",
      "productionStartedAt",
      "observe",
      "mint",
      "evidenceDirectory",
    ]);
    const { root: rootPath, evidenceDirectory, observe, mint } = options;
    assert(typeof observe === "function" && typeof mint === "function");
    // Snapshot the supplied evidence before the first await; callbacks cannot change the approved candidate in flight.
    const {
      bundle,
      admissionSha256,
      currentContext,
      images,
      release,
      stage,
      approval,
      operation,
      productionStartedAt,
    } = structuredClone(
      Object.fromEntries(
        [
          "bundle",
          "admissionSha256",
          "currentContext",
          "images",
          "release",
          "stage",
          "approval",
          "operation",
          "productionStartedAt",
        ].map((name) => [name, options[name]]),
      ),
    );
    const stageRecord = authority({
      bundle,
      admissionSha256,
      currentContext,
      images,
      release,
      stage,
      approval,
      operation,
      productionStartedAt,
    });
    const root = directory(rootPath);
    assert(isAbsolute(evidenceDirectory));
    const subpath = relative(join(root, ".artifacts"), evidenceDirectory);
    assert(subpath && !isAbsolute(subpath) && subpath !== ".." && !subpath.startsWith("../"));
    assert.equal(resolve(evidenceDirectory), evidenceDirectory);
    let evidenceParent = root;
    for (const part of relative(root, evidenceDirectory).split("/")) {
      evidenceParent = join(evidenceParent, part);
      try {
        mkdirSync(evidenceParent, { mode: 0o700 });
      } catch (error) {
        assert.equal(error.code, "EEXIST");
      }
      directory(evidenceParent);
    }
    evidence = directory(evidenceDirectory);
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
    assert.equal(baseline.contractRevision, bundle.manifest.identity.evidence.contractRevision);
    for (const [profile, count] of [
      ["local", 72],
      ["stage", 22],
      ["production", 3],
    ])
      assert.equal(projection.required.profiles[profile].inventory.cases.length, count);
    same(stage.expected.declarationInput, projection.declarationInput);
    same(stageRecord.suite, {
      commit: baseline.suiteCommit,
      tree: baseline.suiteTree,
      fixtureManifestSha256: baseline.manifestSha256,
      profilesSha256: projection.profilesSha256,
      inventorySha256: projection.inventorySha256.stage,
    });
    assert(!abort.signal.aborted);
    phase = "target-observation";
    const before = structuredClone(await observe());
    const observedExpected = {
      profile: "production",
      sourceRevision: context.sourceRevision,
      suite: {
        commit: baseline.suiteCommit,
        tree: baseline.suiteTree,
        fixtureManifestSha256: baseline.manifestSha256,
        profilesSha256: projection.profilesSha256,
        inventorySha256: projection.inventorySha256.production,
      },
      release: structuredClone(release),
      images: structuredClone(images),
      configurationSha256: approval.candidate.productionConfigurationSha256,
      target: {
        origin: before.origin,
        resourceId: approval.candidate.productionResourceId,
        revisionId: before.revisionId,
      },
      run: { id: operation.id, attempt: operation.attempt, workflowRevision: context.sourceRevision },
      declarationInput: projection.declarationInput,
    };
    // Validate syntax and the exact approved production identity before any installation or audience-bound token.
    envelope(observedExpected, { before, after: null }, null, launchId, "not-run", "passed", "blocked");
    assert.equal(before.environment, "production");
    assert.equal(before.resourceId, approval.candidate.productionResourceId);
    assert.equal(before.configurationSha256, approval.candidate.productionConfigurationSha256);
    for (const role of ["api", "frontend"]) assert.equal(before.registryDigests[role], images[role].registryDigest);
    assert(productionStartedAt <= before.observedAt && Date.parse(before.observedAt) <= Date.now());
    assert(!abort.signal.aborted);
    expected = observedExpected;
    observations.before = before;
    temporary = mkdtempSync(join(realpathSync(tmpdir()), "mp3-production-suite-"));
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
    phase = "credential";
    const credential = structuredClone(await mint(before.origin));
    fields(credential, ["kind", "value", "expiresAt"]);
    assert.equal(credential.kind, "google-id-token");
    assert(
      typeof credential.value === "string" &&
        Buffer.byteLength(credential.value) <= 16384 &&
        /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(credential.value),
    );
    instant(credential.expiresAt);
    assert(Date.parse(credential.expiresAt) >= Date.now() + 990000);
    privateRoot = mkdtempSync(join(realpathSync(tmpdir()), "mp3-production-input-"));
    const input = Buffer.from(
      JSON.stringify({
        schemaVersion: 1,
        kind: "hosted-suite-input",
        profile: "production",
        launchId,
        sourceRevision: context.sourceRevision,
        suite: expected.suite,
        target: before,
        audience: before.origin,
        credential,
      }),
    );
    assert(input.length <= 65536 && !abort.signal.aborted);
    phase = "production-wrapper";
    wrapperOutcome = "failed";
    const outcome = await owned(
      [join(suiteRoot, "scripts/run-production.ts")],
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
      const file = join(suiteRoot, ".artifacts/hosted-production-result.json"),
        stat = lstatSync(file);
      assert(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 1048576);
      result = validateHostedSuiteResult(
        structuredClone({
          result: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(file))),
          expected,
          launchId,
        }),
      );
    } catch {
      wrapperOutcome = "failed";
    }
    phase = "final-observation";
    const after = structuredClone(await observe());
    envelope(expected, { before, after }, result, launchId, wrapperOutcome, parentCleanup, "failed");
    observations.after = after;
    assert(Date.parse(after.observedAt) <= Date.now());
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
      save("production-acceptance-setup.json", {
        schemaVersion: 1,
        kind: "production-acceptance-setup",
        status: succeeded ? "passed" : "failed",
        phase,
        browser: setup,
        parentCleanup,
      });
      if (result) save("production-suite-result.json", result);
      if (validated) {
        save("production-acceptance.json", validated);
        save("production-acceptance-custody.json", {
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
    /* Evidence failure is failed smoke, never a pass or raw diagnostic. */
  }
  throw failure();
}
