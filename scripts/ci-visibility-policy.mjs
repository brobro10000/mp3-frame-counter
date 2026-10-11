/**
 * Admit one finite same-run CI visibility layout while preserving the original two-job workflow and release evidence.
 * Import requireCiVisibilityPolicy(parsedInputs) or requireCiVisibilityGate(layout, needs); neither performs I/O or
 * mutates its inputs. readCiVisibilityPolicy(root, sourceRevision) reads bounded regular files from that exact Git
 * commit using Git only; it never reads moving HEAD, installs packages, executes workflows or writes evidence.
 * Source classification selects known job identities, not successful validation. Publication must also observe each
 * original-attempt job and its trusted preflight; parsed policy validation remains a mandatory original-source check.
 * Unknown calls, mixed layouts, missing inputs, incomplete test coverage or unsuccessful dependencies throw.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { requirePreflightWorkflow } from "./acceptance-preflight.mjs";
import { requireReleaseWorkflow } from "./publish-release-evidence.mjs";

const legacyMandatory = ["validate-foundation", "validate-product"];
const futureMandatory = [...legacyMandatory, "application-tests", "server-tests"];
const calls = {
  "validate-foundation": { name: "Linter", path: ".github/workflows/linter.yml" },
  "validate-product": { name: "Base acceptance E2E", path: ".github/workflows/base-acceptance-e2e.yml" },
  "application-tests": { name: "Application tests", path: ".github/workflows/application-tests.yml" },
  "server-tests": { name: "Server tests", path: ".github/workflows/server-tests.yml" },
};
const permissions = { contents: "read", "pull-requests": "read" };
const baseExpression = "${{ github.event.pull_request.base.sha || github.event.before }}";
const gateCommand = "node --test scripts/ci-gate.test.mjs scripts/ci-visibility-policy.test.mjs";
const legacyGateCommand = "node --test scripts/ci-gate.test.mjs";
const admissionEnv = {
  GATE_ADMISSION_PATH: "${{ steps.acceptance-preflight.outputs.admission-path }}",
  GATE_ADMISSION_SHA256: "${{ steps.acceptance-preflight.outputs.admission-sha256 }}",
};
const checksCommand =
  [
    "npm run format:check",
    "npm run lint:workflows",
    "npm run check:policy",
    "npm run check:portability",
    "aa-exec --profile=chrome npm run check:mermaid",
    "npm run test:gate",
  ].join("\n") + "\n";
const cloudValidation =
  [
    "terraform -chdir=infra/cloud/bootstrap fmt -check",
    "terraform -chdir=infra/cloud/bootstrap init -backend=false -input=false -lockfile=readonly",
    "terraform -chdir=infra/cloud/bootstrap validate -no-color",
    "terraform -chdir=infra/cloud/access fmt -check",
    "terraform -chdir=infra/cloud/access init -backend=false -input=false -lockfile=readonly",
    "terraform -chdir=infra/cloud/access validate -no-color",
  ].join("\n") + "\n";

// This reviewed union is unchanged by visibility migration; the new policy tests belong to test:gate instead.
export const ciToolingShards = Object.freeze({
  foundation: Object.freeze([
    "scripts/github-context.test.mjs",
    "scripts/portability.test.mjs",
    "scripts/phase-policy.test.mjs",
    "scripts/e2e-controller.test.mjs",
    "scripts/mermaid.test.mjs",
    "scripts/runtime-dependency-policy.test.mjs",
    "scripts/docs-tool-policy.test.mjs",
    "scripts/frontend-tool-policy.test.mjs",
  ]),
  acceptance: Object.freeze([
    "scripts/acceptance-baseline.test.mjs",
    "scripts/acceptance-admission.test.mjs",
    "scripts/acceptance-bootstrap.test.mjs",
    "scripts/acceptance-preflight.test.mjs",
    "scripts/acceptance-publication.test.mjs",
    "scripts/acceptance-review-http.test.mjs",
    "scripts/acceptance-runtime.test.mjs",
    "scripts/acceptance-transitions.test.mjs",
    "scripts/acceptance-preparation.test.mjs",
    "scripts/acceptance-consumers.test.mjs",
    "scripts/acceptance-browser-setup.test.mjs",
    "scripts/acceptance-profiles.test.mjs",
    "scripts/acceptance-profile-source.test.mjs",
  ]),
  publication: Object.freeze([
    "scripts/release-preparation.test.mjs",
    "scripts/publish-release.test.mjs",
    "scripts/publish-release-finalization.test.mjs",
    "scripts/release-allocation.test.mjs",
    "scripts/release-allocation-publication.test.mjs",
    "scripts/release-allocation-preparation-cli.test.mjs",
    "scripts/publisher-handoff.test.mjs",
    "scripts/same-run-handoff.test.mjs",
    "scripts/publish-release-evidence.test.mjs",
  ]),
  delivery: Object.freeze([
    "infra/cloud/bootstrap/cap-reconciler.test.mjs",
    "scripts/hosted-evidence.test.mjs",
    "scripts/cloud-access-foundation.test.mjs",
    "scripts/cloud-bootstrap-iam.test.mjs",
    "scripts/cloud-runtime.test.mjs",
    "scripts/stage-delivery-policy.test.mjs",
    "scripts/stage-delivery-policy-regression.test.mjs",
    "scripts/stage-revision.test.mjs",
    "scripts/hosted-health-consumers.test.mjs",
    "scripts/stage-acceptance.test.mjs",
    "scripts/stage-config-log-policy.test.mjs",
    "scripts/stage-command-failure.test.mjs",
    "scripts/production-acceptance.test.mjs",
    "scripts/stage-command-failure-json.test.mjs",
    "scripts/stage-private-diagnostic.test.mjs",
    "scripts/stage-private-diagnostic-controller.test.mjs",
  ]),
});

const backendPrerequisiteTests = [
  "scripts/backend-contract-policy.test.mjs",
  "scripts/ci-unit-inventory.test.mjs",
  "scripts/backend-source-ci.test.mjs",
];

/** Select only the complete historical or complete successor union, preserving four shard/job identities. */
export function selectCiToolingShards(files) {
  assert(Array.isArray(files) && files.every((value) => typeof value === "string"), "Missing tooling inventory");
  const selected = files.some((file) => backendPrerequisiteTests.includes(file));
  const result = selected
    ? { ...ciToolingShards, foundation: [...ciToolingShards.foundation, ...backendPrerequisiteTests] }
    : ciToolingShards;
  assert.deepEqual([...files].sort(), Object.values(result).flat().sort(), "Tooling coverage differs");
  return result;
}

/** Reject malformed or accessor-bearing records before inspecting their closed data fields. */
function record(value, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be a record`);
  assert([Object.prototype, null].includes(Object.getPrototypeOf(value)), `${label} must have an ordinary prototype`);
  assert(
    Object.values(Object.getOwnPropertyDescriptors(value)).every((entry) => Object.hasOwn(entry, "value")),
    `${label} must contain data fields`,
  );
  return value;
}

/** Require the complete finite field set; extension fields cannot introduce inputs, credentials or skip paths. */
function closed(value, keys, label) {
  record(value, label);
  assert.deepEqual(Reflect.ownKeys(value).sort(), [...keys].sort(), `Unexpected ${label} fields`);
}

/** Return fresh arrays so callers cannot mutate a module's selected mandatory or observed job identities. */
function layout(variant) {
  assert(["legacy", "reusable-v1"].includes(variant), "Unknown CI visibility layout");
  return {
    variant,
    mandatoryJobs: [...(variant === "legacy" ? legacyMandatory : futureMandatory)],
    observedJobs:
      variant === "legacy"
        ? ["control-plane", ...legacyMandatory]
        : [
            "control-plane",
            "Linter / checks",
            ...Object.keys(ciToolingShards).map((name) => `Linter / tooling-${name}`),
            "Base acceptance E2E / validate-product",
            "Application tests / application",
            "Server tests / server",
          ],
  };
}

/** Validate preflight with the original validator, without expanding the trusted bootstrap's import closure. */
function workerPreflight(checks, worker) {
  for (const job of [checks, worker]) {
    assert(Array.isArray(job.steps), "Worker requires explicit steps");
    assert.deepEqual(job.steps[0], {
      uses: "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
      with: { "persist-credentials": false, "fetch-depth": 0 },
    });
    assert.deepEqual(job.steps[1], {
      uses: "actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1",
      with: { "node-version-file": ".nvmrc", "package-manager-cache": false },
    });
    // A pinned unfamiliar action still executes code. Only the reviewed two-action prefix may precede preflight.
    closed(job.steps[2], ["name", "id", "shell", "env", "run"], "Trusted preflight step");
    assert.equal(job.steps[2].id, "acceptance-preflight");
  }
  requirePreflightWorkflow({
    permissions: { contents: "read" },
    jobs: { "validate-foundation": checks, "validate-product": worker },
  });
}

/** Keep executing workers bounded, read-only and unsuppressed; only tooling admits its exact four-value matrix. */
function workerHeader(job, name, matrix = false) {
  closed(
    job,
    ["name", "runs-on", "timeout-minutes", "permissions", "env", "steps", ...(matrix ? ["strategy"] : [])],
    `${name} worker`,
  );
  assert.equal(job.name, name);
  assert.equal(job["runs-on"], "ubuntu-24.04");
  assert(Number.isSafeInteger(job["timeout-minutes"]) && job["timeout-minutes"] > 0 && job["timeout-minutes"] <= 20);
  assert.deepEqual(job.permissions, permissions);
  assert.deepEqual(job.env, { CI_BASE_REF: baseExpression });
}

/** Require the one reviewed command immediately after install, with admission inputs from that worker's preflight. */
function laneSteps(job, command, extraEnv = {}) {
  const tooling = command === "node scripts/run-tooling-shard.mjs";
  assert.equal(job.steps.length, tooling ? 7 : 5, "Lane requires its exact setup, preflight, install and command");
  assert.deepEqual(job.steps[3], { run: "npm ci" });
  if (tooling) {
    // Provider-backed mock tests are confined to delivery; separate runners cannot supply its native tools.
    const condition = "${{ matrix.shard == 'delivery' }}";
    assert.deepEqual(job.steps[4], {
      uses: "hashicorp/setup-terraform@dfe3c3f87815947d99a8997f908cb6525fc44e9e",
      with: { terraform_version: "1.13.3", terraform_wrapper: false },
      if: condition,
    });
    assert.deepEqual(job.steps[5], {
      name: "Validate cloud foundations without credentials",
      run: cloudValidation,
      if: condition,
    });
  }
  assert.deepEqual(job.steps.at(-1), { run: command, env: { ...admissionEnv, ...extraEnv } });
}

/** Require full test inventory exactly once; sorting copies preserves the caller's manifest ordering and bytes. */
function toolingInventory(files) {
  return selectCiToolingShards(files);
}

/** Validate a parsed complete workflow family. This admits structure, never live execution or publication authority. */
export function requireCiVisibilityPolicy(input) {
  closed(input, ["workflow", "reusableWorkflows", "toolingFiles", "gateCommand"], "CI visibility input");
  const { workflow, reusableWorkflows, toolingFiles } = input;
  record(workflow, "Coordinator workflow");
  record(workflow.jobs, "Coordinator jobs");
  record(reusableWorkflows, "Reusable workflows");
  const called = Object.values(workflow.jobs).some((job) => Object.hasOwn(record(job, "Coordinator job"), "uses"));
  if (!called) {
    closed(reusableWorkflows, [], "Legacy reusable workflows");
    assert([legacyGateCommand, gateCommand].includes(input.gateCommand), "Unknown legacy gate command");
    requireReleaseWorkflow(workflow);
    assert.deepEqual(workflow.jobs["control-plane"].needs, legacyMandatory);
    return layout("legacy");
  }
  const toolingSelection = toolingInventory(toolingFiles);
  const selectedChecksCommand =
    checksCommand + (toolingSelection === ciToolingShards ? "" : "node scripts/run-backend-source-checks.mjs\n");
  assert.equal(input.gateCommand, gateCommand, "Both gate test files remain mandatory");
  closed(workflow, ["name", "on", "permissions", "concurrency", "jobs"], "Coordinator workflow");
  assert.equal(workflow.name, "MVP CI");
  assert.deepEqual(workflow.on, { pull_request: { branches: ["main"] }, push: { branches: ["main"] } });
  assert.deepEqual(workflow.permissions, { contents: "read" });
  assert.deepEqual(workflow.concurrency, {
    group: "mvp-${{ github.event.pull_request.number || github.run_id }}",
    "cancel-in-progress": "${{ github.event_name == 'pull_request' }}",
  });
  const hasStage = Object.hasOwn(workflow.jobs, "deploy-stage");
  closed(
    workflow.jobs,
    [
      ...futureMandatory,
      "control-plane",
      "deliver-foundation",
      "publish-release",
      ...(hasStage ? ["deploy-stage"] : []),
    ],
    "Coordinator jobs",
  );
  closed(
    reusableWorkflows,
    Object.values(calls).map((entry) => entry.path),
    "Reusable workflows",
  );
  for (const [id, { name, path }] of Object.entries(calls)) {
    assert.deepEqual(workflow.jobs[id], { name, uses: `./${path}`, permissions });
    const calledWorkflow = reusableWorkflows[path];
    closed(calledWorkflow, ["name", "on", "permissions", "jobs"], `${name} workflow`);
    assert.equal(calledWorkflow.name, name);
    assert.deepEqual(calledWorkflow.permissions, { contents: "read" });
    if (id !== "validate-product") assert.deepEqual(calledWorkflow.on, { workflow_call: {} });
  }
  const linter = reusableWorkflows[calls["validate-foundation"].path];
  const base = reusableWorkflows[calls["validate-product"].path];
  const application = reusableWorkflows[calls["application-tests"].path];
  const server = reusableWorkflows[calls["server-tests"].path];
  closed(linter.jobs, ["checks", "tooling"], "Linter jobs");
  closed(base.jobs, ["validate-product"], "Base acceptance jobs");
  closed(application.jobs, ["application"], "Application jobs");
  closed(server.jobs, ["server"], "Server jobs");
  const checks = linter.jobs.checks;
  const product = base.jobs["validate-product"];
  closed(checks, ["name", "runs-on", "timeout-minutes", "permissions", "steps"], "Linter checks worker");
  assert.equal(checks.name, "checks");
  assert.equal(checks.if, undefined);
  assert.equal(checks.strategy, undefined);
  assert.equal(checks["continue-on-error"], undefined);
  assert.equal(checks["runs-on"], "ubuntu-24.04");
  assert.equal(checks["timeout-minutes"], 10);
  workerPreflight(checks, product);
  assert.equal(checks.steps.length, 8, "Linter requires its exact reviewed setup and validation steps");
  assert.deepEqual(checks.steps[3], { run: "npm ci" });
  assert.deepEqual(checks.steps[4], {
    uses: "hashicorp/setup-terraform@dfe3c3f87815947d99a8997f908cb6525fc44e9e",
    with: { terraform_version: "1.13.3", terraform_wrapper: false },
  });
  assert.deepEqual(checks.steps[5], {
    name: "Validate cloud foundations without credentials",
    run: cloudValidation,
  });
  assert.deepEqual(checks.steps[6], { run: "npm run mermaid:install" });
  assert.deepEqual(checks.steps[7], { run: selectedChecksCommand });
  assert.deepEqual(
    checks.steps.filter((step) => step.run !== undefined).map((step) => step.run),
    [
      checks.steps.find((step) => step.id === "acceptance-preflight").run,
      "npm ci",
      cloudValidation,
      "npm run mermaid:install",
      selectedChecksCommand,
    ],
  );
  const tooling = linter.jobs.tooling;
  workerHeader(tooling, "tooling-${{ matrix.shard }}", true);
  assert.deepEqual(tooling.strategy, { "fail-fast": false, matrix: { shard: Object.keys(ciToolingShards) } });
  laneSteps(tooling, "node scripts/run-tooling-shard.mjs", { CI_TOOLING_SHARD: "${{ matrix.shard }}" });
  for (const [job, name, command] of [
    [tooling, "tooling-${{ matrix.shard }}", "node scripts/run-tooling-shard.mjs"],
    [application.jobs.application, "application", "node scripts/run-ci-lane.mjs application"],
    [server.jobs.server, "server", "node scripts/run-ci-lane.mjs server"],
  ]) {
    if (job !== tooling) {
      workerHeader(job, name);
      laneSteps(job, command);
    }
    workerPreflight(checks, job);
  }
  closed(
    product,
    ["name", "runs-on", "timeout-minutes", "permissions", "env", "outputs", "steps"],
    "Required acceptance worker",
  );
  assert.equal(product.steps.length, 7, "Required acceptance and same-run export retain their exact steps");
  assert.deepEqual(product.steps[3], { run: "npm ci" });
  // Acceptance cannot be skipped or suppressed even when the worker itself and its preflight are unconditional.
  assert.deepEqual(product.steps[4], { run: "node scripts/run-ci-lane.mjs acceptance", env: admissionEnv });
  assert.deepEqual(product.steps[5], {
    id: "release-bundle",
    if: "${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}",
    run: "node scripts/publish-release-bundle.mjs",
    env: admissionEnv,
  });
  assert.deepEqual(product.steps[6], {
    uses: "actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9",
    if: "${{ steps.release-bundle.outputs.ready == 'true' }}",
    with: {
      name: "${{ steps.release-bundle.outputs.artifact-name }}",
      path: "${{ steps.release-bundle.outputs.directory }}",
      "compression-level": 0,
      "if-no-files-found": "error",
      "retention-days": 7,
    },
  });
  assert.equal(product.strategy, undefined, "Required acceptance remains one unsharded producing runner");
  assert.equal(product.if, undefined);
  assert.equal(product["continue-on-error"], undefined);
  assert.equal(product.name, "validate-product");
  assert.equal(product["runs-on"], "ubuntu-24.04");
  assert.equal(product["timeout-minutes"], 30);
  assert.deepEqual(base.on, {
    workflow_call: {
      outputs: Object.fromEntries(
        ["release-ready", "release-artifact", "acceptance-admission-sha256"].map((key) => [
          key,
          { value: `\${{ jobs.validate-product.outputs.${key} }}` },
        ]),
      ),
    },
  });
  assert.deepEqual(workflow.jobs["control-plane"].needs, futureMandatory);
  assert.equal(workflow.jobs["control-plane"].if, "${{ always() }}");
  assert.equal(workflow.jobs["control-plane"]["continue-on-error"], undefined);
  assert.equal(workflow.jobs["control-plane"].strategy, undefined);
  assert.deepEqual(workflow.jobs["control-plane"].steps.at(-1), {
    name: "Require every mandatory result to succeed",
    env: { NEEDS_JSON: "${{ toJSON(needs) }}" },
    run: "node scripts/ci-gate.mjs",
  });
  // Reuse the closed existing publisher/stage/byte-custody validator only after validating the new worker boundary.
  // Normalization is local data: neither the caller's source nor its future command/graph is rewritten.
  const legacy = structuredClone(workflow);
  delete legacy.jobs["application-tests"];
  delete legacy.jobs["server-tests"];
  legacy.jobs["control-plane"].needs = [...legacyMandatory];
  legacy.jobs["validate-foundation"] = structuredClone(checks);
  legacy.jobs["validate-product"] = structuredClone(product);
  const acceptance = legacy.jobs["validate-product"].steps.filter(
    (step) => step.run === "node scripts/run-ci-lane.mjs acceptance",
  );
  assert.equal(acceptance.length, 1, "Require exactly one required acceptance command");
  acceptance[0].run = "node scripts/run-ci-phase.mjs";
  requireReleaseWorkflow(legacy);
  return layout("reusable-v1");
}

/** Accept only a complete known layout and success for every exact direct dependency; skipped work is failure. */
export function requireCiVisibilityGate(policy, needs) {
  closed(policy, ["variant", "mandatoryJobs", "observedJobs"], "CI gate layout");
  assert.deepEqual(policy, layout(policy.variant), "CI gate layout differs from the finite policy");
  closed(needs, policy.mandatoryJobs, "Mandatory dependency results");
  for (const name of policy.mandatoryJobs) {
    record(needs[name], "Dependency result");
    assert.equal(needs[name].result, "success", `${name} did not succeed`);
  }
}

/** Read one bounded regular committed object, never working files or a caller-selected moving Git ref. */
function sourceFile(root, revision, path) {
  const git = (...args) =>
    execFileSync("git", ["--no-replace-objects", ...args], {
      cwd: root,
      encoding: "utf8",
      timeout: 30_000,
      maxBuffer: 256 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  assert.equal(git("cat-file", "-t", revision).trim(), "commit", "CI source must be a commit");
  assert(
    new RegExp(`^100(?:644|755) blob [a-f0-9]{40}\\t${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n?$`).test(
      git("ls-tree", revision, "--", path),
    ),
    "CI source input must be a regular committed file",
  );
  return git("show", `${revision}:${path}`);
}

/** Classify only canonical top-level job blocks, not arbitrary YAML, quoted aliases or text inside commands. */
function coordinatorJobs(source) {
  assert(typeof source === "string" && !source.includes("\r"), "Noncanonical CI source");
  const start = /^jobs:\s*$/gm;
  const matches = [...source.matchAll(start)];
  assert.equal(matches.length, 1, "Missing or ambiguous coordinator jobs");
  const body = source.slice(matches[0].index + matches[0][0].length);
  assert(!/^\S/m.test(body), "Coordinator jobs must be the final top-level field");
  const entries = [...body.matchAll(/^  ([a-z][a-z0-9-]*):\s*$/gm)];
  assert(entries.length > 0, "Missing coordinator jobs");
  const result = {};
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    assert(!Object.hasOwn(result, entry[1]), "Duplicate coordinator job");
    result[entry[1]] = body.slice(entry.index + entry[0].length, entries[index + 1]?.index ?? body.length);
  }
  return result;
}

/**
 * Select exact source-bound job identities without importing YAML into installation-free gates or publishers.
 * The classifier is deliberately narrower than YAML: full parsed-graph/preflight validation must still pass for the
 * tested source. Reusable files must exist at that same commit, and future gate/tooling commands stay source-bound.
 */
export function readCiVisibilityPolicy(root, sourceRevision) {
  assert(typeof root === "string" && root.length > 0, "CI source repository is required");
  assert(/^[a-f0-9]{40}$/.test(sourceRevision ?? "") && !/^0+$/.test(sourceRevision), "Invalid exact CI source");
  const jobs = coordinatorJobs(sourceFile(root, sourceRevision, ".github/workflows/ci.yml"));
  const hasCalls = Object.values(jobs).some((body) => /^    uses:/m.test(body));
  const variant = hasCalls ? "reusable-v1" : "legacy";
  const policy = layout(variant);
  assert.deepEqual(
    Object.keys(jobs).sort(),
    [
      ...policy.mandatoryJobs,
      "control-plane",
      "deliver-foundation",
      "publish-release",
      ...(Object.hasOwn(jobs, "deploy-stage") ? ["deploy-stage"] : []),
    ].sort(),
    "Unknown or mixed source CI graph",
  );
  if (variant === "legacy") return policy;
  for (const [id, { name, path }] of Object.entries(calls)) {
    const body = jobs[id];
    assert.equal([...body.matchAll(/^    uses: (.*)$/gm)].length, 1, "Missing or ambiguous local workflow call");
    assert(body.includes(`    uses: ./${path}\n`), "Unknown source workflow call");
    assert(body.includes(`    name: ${name}\n`), "Unexpected source workflow name");
    sourceFile(root, sourceRevision, path);
  }
  const pkg = JSON.parse(sourceFile(root, sourceRevision, "package.json"));
  record(pkg.scripts, "Source package scripts");
  assert.equal(pkg.scripts["test:gate"], gateCommand, "Future source requires both gate tests");
  const command = pkg.scripts["test:tooling"];
  assert(typeof command === "string" && command.startsWith("node --experimental-vm-modules --test "));
  toolingInventory(command.slice("node --experimental-vm-modules --test ".length).split(" "));
  return policy;
}
