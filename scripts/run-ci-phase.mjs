/**
 * Run the mandatory ordinary CI work for the repository's actual implementation phase.
 *
 * Run `node scripts/run-ci-phase.mjs` from the repository root with pinned Node/npm and Git available. CI_BASE_REF
 * is a trusted GitHub event base SHA in CI; local callers may omit it. CI without that SHA fails closed. The content
 * comparison prevents reverting to an earlier phase after integration and does not accept a phase/skip argument.
 *
 * Acceptance-only work installs and checks its standalone package. Product work requires an independently frozen
 * pre-product genesis or admitted successor, extracts it outside the product tree and runs its locked `check`.
 * A pending candidate runs separate discovery/oracle/negative controls and writes candidate-only evidence; it cannot
 * satisfy required product acceptance. Post-policy CI uses the trusted preflight record/digest; local runs claim no CI.
 * Immutable declarations for every selected role are checked before extraction or installation. They cannot select
 * hosted execution or replace original admission authority; malformed declarations fail before suite code runs.
 * Each selected product-phase extraction prepares its pinned browser after npm ci and before check, sharing one
 * 360-second deadline. Sanitized attempted setup evidence is written even on failure; readiness is not acceptance.
 * Parser work additionally runs root test:unit and build; local/legacy integration also runs root test:e2e with the
 * verified TRUSTED_ACCEPTANCE_ROOT. Only admitted CI with the complete committed reusable graph and acceptance job
 * identity delegates units/builds to its mandatory application/server lanes. Its original E2E lifecycle remains whole.
 * The runner removes its temporary suite checkout and propagates missing tools, invalid records and command failures.
 * npm may access the registry; application E2E may build local containers. It never provisions or deploys services.
 */

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { git, repositoryFiles, suitePath } from "./acceptance-baseline.mjs";
import { prepareAcceptanceBrowser } from "./acceptance-browser-setup.mjs";
import { readAcceptanceProfileSource } from "./acceptance-profile-source.mjs";
import { runtimeAcceptance } from "./acceptance-runtime.mjs";
import { requireMonotonicPhase, requiredRootScripts } from "./phase-policy.mjs";

const root = process.cwd();
const temporary = [];
let preparation;

/** Read one bounded regular committed input; working workflow edits cannot select a smaller execution plan. */
function committedSource(root, revision, path) {
  const read = (...args) =>
    execFileSync("git", ["--no-replace-objects", ...args], {
      cwd: root,
      encoding: "utf8",
      timeout: 30_000,
      maxBuffer: 256 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert(
    new RegExp(`^100(?:644|755) blob [a-f0-9]{40}\\t${escaped}\\n?$`).test(read("ls-tree", revision, "--", path)),
    "CI execution input must be a regular committed file",
  );
  return read("show", `${revision}:${path}`);
}

/**
 * Resolve actual phase and admission once, using read-only Git without acceptance commands or setup effects.
 * No caller supplies phase, layout or skips.
 * Only full source-bound policy plus genuine CI admission may assign host units/builds to the other mandatory lanes.
 * Lazy parsing keeps installation-free historical imports free of YAML and additional policy module initialization.
 */
export function resolvePhaseExecution(root, env = process.env) {
  assert(env && typeof env === "object" && !Array.isArray(env), "Phase execution requires an environment");
  const baseRef = env.CI_BASE_REF || undefined;
  if (env.CI === "true") assert(baseRef, "CI_BASE_REF must identify the trusted event base");
  if (baseRef) assert(/^[a-f0-9]{40}$/.test(baseRef) && !/^0+$/.test(baseRef), "Invalid trusted base commit");
  const phase = requireMonotonicPhase(repositoryFiles(root), baseRef ? repositoryFiles(root, baseRef) : []);
  const rootScripts = requiredRootScripts(phase);
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  for (const script of rootScripts)
    assert(typeof pkg.scripts?.[script] === "string" && pkg.scripts[script].trim(), `Missing mandatory ${script}`);
  let selection;
  if (["parser", "integration"].includes(phase)) {
    selection = runtimeAcceptance(root, env);
    const context = selection.admission?.record.context ?? selection.localSelection;
    readAcceptanceProfileSource(root, {
      selection,
      sourceRevision: context?.sourceRevision ?? git(root, ["--no-replace-objects", "rev-parse", "HEAD"]).trim(),
      baseRevision: context?.baseRevision ?? baseRef ?? null,
    });
    if (phase === "integration" && selection.admission) {
      const revision = selection.admission.record.context.sourceRevision;
      const require = createRequire(import.meta.url);
      const { parse } = require("yaml");
      const { requireCiVisibilityPolicy } = require("./ci-visibility-policy.mjs");
      const workflow = parse(committedSource(root, revision, ".github/workflows/ci.yml"));
      const sourcePkg = JSON.parse(committedSource(root, revision, "package.json"));
      for (const script of rootScripts)
        assert(
          typeof sourcePkg.scripts?.[script] === "string" && sourcePkg.scripts[script].trim(),
          `Missing committed mandatory ${script}`,
        );
      const reusableWorkflows = {};
      if (Object.values(workflow.jobs ?? {}).some((job) => job && Object.hasOwn(job, "uses"))) {
        for (const path of [
          ".github/workflows/linter.yml",
          ".github/workflows/base-acceptance-e2e.yml",
          ".github/workflows/application-tests.yml",
          ".github/workflows/server-tests.yml",
        ])
          reusableWorkflows[path] = parse(committedSource(root, revision, path));
      }
      const toolingCommand = sourcePkg.scripts?.["test:tooling"];
      const prefix = "node --experimental-vm-modules --test ";
      const policy = requireCiVisibilityPolicy({
        workflow,
        reusableWorkflows,
        toolingFiles:
          typeof toolingCommand === "string" && toolingCommand.startsWith(prefix)
            ? toolingCommand.slice(prefix.length).split(" ")
            : [],
        gateCommand: sourcePkg.scripts?.["test:gate"],
      });
      if (policy.variant === "reusable-v1") {
        assert.equal(env.GITHUB_JOB, "validate-product", "Reusable acceptance requires its exact CI job identity");
        return { phase, selection, rootScripts: ["test:e2e"] };
      }
    }
  }
  return { phase, selection, rootScripts };
}

/** Execute a real command, inheriting visible logs but preserving a nonzero exit and a bounded wait. */
function run(command, args, cwd = root, env = process.env, options = {}) {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit", timeout: 20 * 60 * 1000, ...options });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed (status ${result.status})`);
  return result;
}

/** Persist the current source-bound setup record, including its initial empty state; filesystem failures propagate. */
function writePreparationEvidence() {
  mkdirSync(join(root, ".artifacts"), { recursive: true });
  writeFileSync(
    join(root, ".artifacts/acceptance-browser-setup.json"),
    `${JSON.stringify(preparation.evidence, null, 2)}\n`,
  );
}

/**
 * Prepare one already-selected extraction using original validated authority and the shared deadline. Forward signals
 * only while async preparation is active, then remove listeners. Persist its exact attempted identity/result before
 * propagating any failure; pre-setup npm errors never call this helper or invent readiness evidence.
 */
async function prepareSelected(suiteRoot, baseline, role) {
  preparation.deadline ??= performance.now() + 360000;
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  process.on("SIGINT", interrupt);
  process.on("SIGTERM", interrupt);
  let result;
  try {
    result = await prepareAcceptanceBrowser({
      suiteRoot,
      ci: preparation.ci,
      environment: process.env,
      deadline: preparation.deadline,
      signal: controller.signal,
    });
  } catch (error) {
    result = error.setupResult;
    throw error;
  } finally {
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", interrupt);
    if (result) {
      const entry = {
        role,
        suiteCommit: baseline.suiteCommit,
        suiteTree: baseline.suiteTree,
        manifestSha256: baseline.manifestSha256,
        result,
      };
      preparation.evidence.entries.push(entry);
      writePreparationEvidence();
      console.log(`Acceptance browser preparation: ${JSON.stringify(entry)}`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    assert.equal(process.argv.length, 2, "This controller accepts no phase selectors or skip arguments");
    const { phase, selection, rootScripts } = resolvePhaseExecution(root, process.env);
    let acceptanceRoot = join(root, suitePath);
    let requiredBaseline;
    if (["parser", "integration"].includes(phase)) {
      requiredBaseline = selection.baseline;
      preparation = {
        ci: process.env.CI === "true",
        deadline: null,
        evidence: {
          schemaVersion: 1,
          kind: "acceptance-browser-preparation",
          productAcceptance: false,
          sourceRevision: git(root, ["--no-replace-objects", "rev-parse", "HEAD"]).trim(),
          entries: [],
        },
      };
      writePreparationEvidence();
      const extract = (baseline) => {
        const directory = mkdtempSync(join(tmpdir(), "mp3-acceptance-"));
        temporary.push(directory);
        const archive = run(
          "git",
          ["--no-replace-objects", "archive", "--format=tar", baseline.suiteCommit, suitePath],
          root,
          process.env,
          {
            stdio: ["ignore", "pipe", "inherit"],
            maxBuffer: 32 * 1024 * 1024,
          },
        ).stdout;
        run("tar", ["-xf", "-", "-C", directory], root, process.env, {
          input: archive,
          stdio: ["pipe", "inherit", "inherit"],
        });
        return join(directory, suitePath);
      };
      acceptanceRoot = extract(selection.baseline);
      const candidate = selection.resolution?.candidate ?? selection.resolution?.pendingBinding;
      if (candidate) {
        // Candidate discovery/oracle/negative controls are separate from required product acceptance.
        const candidateRoot = extract(candidate);
        const evidence = {
          schemaVersion: 1,
          kind: "candidate-harness-controls",
          sourceRevision: git(root, ["rev-parse", "HEAD"]).trim(),
          suiteCommit: candidate.suiteCommit,
          suiteTree: candidate.suiteTree,
          status: "failed",
          productAcceptance: false,
        };
        try {
          run("npm", ["ci"], candidateRoot);
          await prepareSelected(candidateRoot, candidate, selection.resolution.candidate ? "candidate" : "pending");
          run("npm", ["run", "check"], candidateRoot);
          evidence.status = "passed";
        } finally {
          mkdirSync(join(root, ".artifacts"), { recursive: true });
          writeFileSync(join(root, ".artifacts/acceptance-candidate.json"), `${JSON.stringify(evidence, null, 2)}\n`);
        }
      }
    }
    if (phase !== "foundation") {
      run("npm", ["ci"], acceptanceRoot);
      if (requiredBaseline) await prepareSelected(acceptanceRoot, requiredBaseline, "required");
      run("npm", ["run", "check"], acceptanceRoot);
    }
    const env = { ...process.env, TRUSTED_ACCEPTANCE_ROOT: acceptanceRoot };
    for (const script of rootScripts) run("npm", ["run", script], root, env);
    console.log(
      `Mandatory ${phase} checks passed. This is not deployment or application acceptance beyond that phase.`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    for (const directory of temporary) rmSync(directory, { recursive: true, force: true });
  }
}
