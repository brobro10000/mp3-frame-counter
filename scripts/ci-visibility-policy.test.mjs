/**
 * Independently specify the dormant, finite same-run CI split before its policy/readers are implemented.
 * Run pinned Node with `node --test scripts/ci-visibility-policy.test.mjs`. Historical YAML is read from a protected
 * main Git object; future workflow objects, exact job inventories and rejection decisions are authored here.
 * Disposable Git histories prove source-bound publication selection while HEAD points at another layout. All fixture
 * commits are local temporary data removed after each test. No product/frozen suite, Docker, network, credentials,
 * Actions, real worktree Git state or release is changed. Structural passes do not authenticate live leaf job names.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parse, stringify } from "yaml";
import { requireObservedChecks, requireReleaseWorkflow } from "./publish-release-evidence.mjs";
import { verifyImageInspection } from "./release-manifest.mjs";
import { finalizeV1Release, publishRelease } from "./publish-release.mjs";

let subject = {};
try {
  subject = await import("./ci-visibility-policy.mjs");
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
}

const repository = fileURLToPath(new URL("../", import.meta.url));
const legacySource = "2ae305c57c3ccb1ecbc6e7e6f9e8ae6d3894fcbf";
const legacyBytes = execFileSync("git", ["--no-replace-objects", "show", `${legacySource}:.github/workflows/ci.yml`], {
  cwd: repository,
  encoding: "utf8",
  timeout: 30_000,
  maxBuffer: 128 * 1024,
});
const legacyWorkflow = () => parse(legacyBytes);
const permissions = { contents: "read", "pull-requests": "read" };
const futureMandatory = ["validate-foundation", "validate-product", "application-tests", "server-tests"];
const observedFuture = [
  "control-plane",
  "Linter / checks",
  "Linter / tooling-foundation",
  "Linter / tooling-acceptance",
  "Linter / tooling-publication",
  "Linter / tooling-delivery",
  "Base acceptance E2E / validate-product",
  "Application tests / application",
  "Server tests / server",
];
const legacyPolicy = {
  variant: "legacy",
  mandatoryJobs: ["validate-foundation", "validate-product"],
  observedJobs: ["control-plane", "validate-foundation", "validate-product"],
};
const futurePolicy = { variant: "reusable-v1", mandatoryJobs: futureMandatory, observedJobs: observedFuture };

const gateCommand = "node --test scripts/ci-gate.test.mjs scripts/ci-visibility-policy.test.mjs";
// All prior 46 tooling files remain mandatory exactly once; this policy test belongs to the separate gate command.
const shards = {
  foundation: [
    "scripts/github-context.test.mjs",
    "scripts/portability.test.mjs",
    "scripts/phase-policy.test.mjs",
    "scripts/e2e-controller.test.mjs",
    "scripts/mermaid.test.mjs",
    "scripts/runtime-dependency-policy.test.mjs",
    "scripts/docs-tool-policy.test.mjs",
    "scripts/frontend-tool-policy.test.mjs",
  ],
  acceptance: [
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
  ],
  publication: [
    "scripts/release-preparation.test.mjs",
    "scripts/publish-release.test.mjs",
    "scripts/publish-release-finalization.test.mjs",
    "scripts/release-allocation.test.mjs",
    "scripts/release-allocation-publication.test.mjs",
    "scripts/release-allocation-preparation-cli.test.mjs",
    "scripts/publisher-handoff.test.mjs",
    "scripts/same-run-handoff.test.mjs",
    "scripts/publish-release-evidence.test.mjs",
  ],
  delivery: [
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
  ],
};
const toolingFiles = Object.values(shards).flat();

/** A missing implementation/export fails outside every expected rejection, never satisfying a negative control. */
function api(name) {
  assert.equal(typeof subject[name], "function", `Missing independent CI visibility API ${name}`);
  return subject[name];
}

/** Retain the exact historical trusted inline preflight and source checkout; only future lane commands are literal. */
function worker(name, command, timeout = 20) {
  const old = legacyWorkflow().jobs["validate-product"];
  return {
    name,
    "runs-on": "ubuntu-24.04",
    "timeout-minutes": timeout,
    permissions: structuredClone(permissions),
    env: structuredClone(old.env),
    steps: [
      ...structuredClone(old.steps.slice(0, 3)),
      { run: "npm ci" },
      {
        run: command,
        env: {
          GATE_ADMISSION_PATH: "${{ steps.acceptance-preflight.outputs.admission-path }}",
          GATE_ADMISSION_SHA256: "${{ steps.acceptance-preflight.outputs.admission-sha256 }}",
        },
      },
    ],
  };
}

/** Author the finite proposed graph without using any implementation output or editing active CI. */
function futureInput() {
  const workflow = legacyWorkflow();
  const base = structuredClone(workflow.jobs["validate-product"]);
  base.steps.find((step) => step.run === "node scripts/run-ci-phase.mjs").run =
    "node scripts/run-ci-lane.mjs acceptance";
  const checks = structuredClone(workflow.jobs["validate-foundation"]);
  checks.name = "checks";
  checks.steps.find((step) => step.run === "aa-exec --profile=chrome npm run validate").run =
    [
      "npm run format:check",
      "npm run lint:workflows",
      "npm run check:policy",
      "npm run check:portability",
      "aa-exec --profile=chrome npm run check:mermaid",
      "npm run test:gate",
    ].join("\n") + "\n";
  const tooling = worker("tooling-${{ matrix.shard }}", "node scripts/run-tooling-shard.mjs", 20);
  tooling.strategy = { "fail-fast": false, matrix: { shard: Object.keys(shards) } };
  tooling.steps.at(-1).env.CI_TOOLING_SHARD = "${{ matrix.shard }}";
  // Native cloud mock tests run only in delivery; no other runner can supply its provider installations.
  const terraform = structuredClone(checks.steps.find((step) => step.uses?.startsWith("hashicorp/setup-terraform@")));
  const nativeValidation = structuredClone(checks.steps.find((step) => step.run?.startsWith("terraform -chdir=")));
  for (const step of [terraform, nativeValidation]) step.if = "${{ matrix.shard == 'delivery' }}";
  tooling.steps.splice(tooling.steps.length - 1, 0, terraform, nativeValidation);
  const reusableWorkflows = {
    ".github/workflows/linter.yml": {
      name: "Linter",
      on: { workflow_call: {} },
      permissions: { contents: "read" },
      jobs: { checks, tooling },
    },
    ".github/workflows/base-acceptance-e2e.yml": {
      name: "Base acceptance E2E",
      on: {
        workflow_call: {
          outputs: Object.fromEntries(
            Object.keys(base.outputs).map((key) => [key, { value: `\${{ jobs.validate-product.outputs.${key} }}` }]),
          ),
        },
      },
      permissions: { contents: "read" },
      jobs: { "validate-product": base },
    },
    ".github/workflows/application-tests.yml": {
      name: "Application tests",
      on: { workflow_call: {} },
      permissions: { contents: "read" },
      jobs: { application: worker("application", "node scripts/run-ci-lane.mjs application") },
    },
    ".github/workflows/server-tests.yml": {
      name: "Server tests",
      on: { workflow_call: {} },
      permissions: { contents: "read" },
      jobs: { server: worker("server", "node scripts/run-ci-lane.mjs server") },
    },
  };
  for (const [id, name, path] of [
    ["validate-foundation", "Linter", "linter.yml"],
    ["validate-product", "Base acceptance E2E", "base-acceptance-e2e.yml"],
    ["application-tests", "Application tests", "application-tests.yml"],
    ["server-tests", "Server tests", "server-tests.yml"],
  ])
    workflow.jobs[id] = { name, uses: `./.github/workflows/${path}`, permissions: structuredClone(permissions) };
  workflow.jobs["control-plane"].needs = [...futureMandatory];
  return { workflow, reusableWorkflows, toolingFiles: [...toolingFiles], gateCommand };
}

/** Assert a positive availability control first; refusal must preserve every caller-owned input byte. */
function rejects(mutations) {
  const requirePolicy = api("requireCiVisibilityPolicy");
  assert.deepEqual(requirePolicy(futureInput()), futurePolicy);
  for (const [label, mutate] of mutations) {
    const value = futureInput();
    mutate(value);
    const before = structuredClone(value);
    assert.throws(() => requirePolicy(value), label);
    assert.deepEqual(value, before, `${label}: refusal mutated caller input`);
  }
}

/** Commit only disposable literal workflow data, never application source, remote references or credentials. */
function history(t) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "mp3-ci-visibility-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync("git", ["--no-replace-objects", ...args], {
      cwd: root,
      encoding: "utf8",
      timeout: 30_000,
      maxBuffer: 128 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null" },
    }).trim();
  git("init", "--quiet", "--initial-branch=main");
  git("config", "user.name", "Independent CI fixture");
  git("config", "user.email", "ci-fixture@example.invalid");
  const put = (path, bytes) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), bytes);
  };
  const commit = (message) => {
    git("add", "--all");
    git("commit", "--quiet", "-m", message);
    return git("rev-parse", "HEAD");
  };
  put(".github/workflows/ci.yml", legacyBytes);
  put(
    "package.json",
    JSON.stringify({
      scripts: {
        "test:gate": "node --test scripts/ci-gate.test.mjs",
        "test:tooling": `node --experimental-vm-modules --test ${toolingFiles.join(" ")}`,
      },
    }),
  );
  const legacy = commit("Literal historical workflow");
  const future = futureInput();
  put(".github/workflows/ci.yml", stringify(future.workflow));
  for (const [path, value] of Object.entries(future.reusableWorkflows)) put(path, stringify(value));
  put(
    "package.json",
    JSON.stringify({
      scripts: {
        "test:gate": gateCommand,
        "test:tooling": `node --experimental-vm-modules --test ${toolingFiles.join(" ")}`,
      },
    }),
  );
  const split = commit("Literal proposed same-run workflow");
  return { root, git, put, commit, legacy, split };
}

/** Synthetic authenticated-API-shaped records: they are test data and establish no real CI or publication authority. */
function observation(source, names) {
  const origin = {
    schemaVersion: 1,
    repository: "example/private-mp3",
    sourceRevision: source,
    baseRevision: "b".repeat(40),
    runId: 8123,
    attempt: 1,
    workflow: ".github/workflows/ci.yml",
    workflowRevision: source,
  };
  return {
    bundle: { origin, acceptanceAdmission: {} },
    repository: { full_name: origin.repository, private: true, default_branch: "main" },
    branch: { name: "main", protected: true, commit: { sha: source } },
    comparison: { status: "identical" },
    run: {
      id: origin.runId,
      run_attempt: 1,
      head_sha: source,
      head_branch: "main",
      event: "push",
      path: origin.workflow,
      repository: { full_name: origin.repository },
    },
    jobs: names.map((name) => ({
      name,
      head_sha: source,
      run_attempt: 1,
      status: "completed",
      conclusion: "success",
      steps:
        name === "control-plane"
          ? []
          : [{ name: "Validate acceptance admission", status: "completed", conclusion: "success" }],
    })),
  };
}

function observed(value, root = undefined) {
  return requireObservedChecks(
    value.bundle,
    value.repository,
    value.branch,
    value.comparison,
    value.run,
    value.jobs,
    root === undefined ? undefined : { root },
  );
}

test("visibility exports are available outside expected rejection controls", () => {
  for (const name of ["requireCiVisibilityPolicy", "requireCiVisibilityGate", "readCiVisibilityPolicy"]) api(name);
});

test("unchanged legacy workflow remains valid and uses its original two-job gate without mutation", () => {
  const workflow = legacyWorkflow();
  const before = structuredClone(workflow);
  assert.doesNotThrow(() => requireReleaseWorkflow(workflow));
  assert.deepEqual(workflow, before);
  const input = {
    workflow,
    reusableWorkflows: {},
    toolingFiles: [...toolingFiles],
    gateCommand: "node --test scripts/ci-gate.test.mjs",
  };
  const inputBefore = structuredClone(input);
  assert.deepEqual(api("requireCiVisibilityPolicy")(input), legacyPolicy);
  assert.deepEqual(input, inputBefore);
});

test("exact four reusable workflows admit complete46-test four-shard coverage and detached finite layout", () => {
  assert.equal(toolingFiles.length, 46);
  assert.equal(new Set(toolingFiles).size, 46);
  const input = futureInput();
  const before = structuredClone(input);
  const result = api("requireCiVisibilityPolicy")(input);
  assert.deepEqual(result, futurePolicy);
  assert.deepEqual(input, before);
  assert.deepEqual(Object.keys(result).sort(), ["mandatoryJobs", "observedJobs", "variant"]);
  assert.notEqual(result.mandatoryJobs, input.workflow.jobs["control-plane"].needs);
});

test("future graph rejects arbitrary swapped missing mixed remote or moving workflow calls", () =>
  rejects([
    ["other path", (x) => (x.workflow.jobs["server-tests"].uses = "./.github/workflows/other.yml")],
    [
      "remote moving call",
      (x) => (x.workflow.jobs["server-tests"].uses = "example/repo/.github/workflows/server-tests.yml@main"),
    ],
    ["swapped call", (x) => (x.workflow.jobs["server-tests"].uses = "./.github/workflows/application-tests.yml")],
    ["missing job", (x) => delete x.workflow.jobs["application-tests"]],
    ["missing called source", (x) => delete x.reusableWorkflows[".github/workflows/server-tests.yml"]],
    [
      "extra called source",
      (x) =>
        (x.reusableWorkflows[".github/workflows/other.yml"] = structuredClone(
          x.reusableWorkflows[".github/workflows/server-tests.yml"],
        )),
    ],
    ["mixed inline product", (x) => (x.workflow.jobs["validate-product"] = legacyWorkflow().jobs["validate-product"])],
  ]));

test("future event permission and caller environment extensions fail closed", () =>
  rejects([
    ["independent push", (x) => (x.reusableWorkflows[".github/workflows/server-tests.yml"].on.push = {})],
    ["manual event", (x) => (x.workflow.on.workflow_dispatch = {})],
    [
      "arbitrary input",
      (x) =>
        (x.reusableWorkflows[".github/workflows/server-tests.yml"].on.workflow_call.inputs = {
          command: { type: "string" },
        }),
    ],
    ["write permission", (x) => (x.workflow.jobs["server-tests"].permissions.contents = "write")],
    [
      "OIDC permission",
      (x) => (x.reusableWorkflows[".github/workflows/server-tests.yml"].jobs.server.permissions["id-token"] = "write"),
    ],
    ["secret inheritance", (x) => (x.workflow.jobs["application-tests"].secrets = "inherit")],
    ["caller env", (x) => (x.workflow.jobs["application-tests"].env = { NODE_OPTIONS: "--import=untrusted" })],
    ["conditional lane", (x) => (x.workflow.jobs["server-tests"].if = "${{ false }}")],
  ]));

test("every executing worker requires unchanged trusted preflight before installation or head-owned commands", () => {
  const mutations = [];
  for (const [path, names] of [
    [".github/workflows/linter.yml", ["checks", "tooling"]],
    [".github/workflows/base-acceptance-e2e.yml", ["validate-product"]],
    [".github/workflows/application-tests.yml", ["application"]],
    [".github/workflows/server-tests.yml", ["server"]],
  ])
    for (const name of names) {
      mutations.push([
        `${path}/${name} missing preflight`,
        (x) => {
          const job = x.reusableWorkflows[path].jobs[name];
          job.steps = job.steps.filter((step) => step.id !== "acceptance-preflight");
        },
      ]);
      mutations.push([
        `${path}/${name} early command`,
        (x) => x.reusableWorkflows[path].jobs[name].steps.splice(2, 0, { run: "node scripts/untrusted.mjs" }),
      ]);
      mutations.push([
        `${path}/${name} untrusted replacement`,
        (x) => {
          x.reusableWorkflows[path].jobs[name].steps.find((step) => step.id === "acceptance-preflight").run =
            "node scripts/acceptance-preflight.mjs";
        },
      ]);
    }
  rejects(mutations);
});

test("tooling matrix is exactly four unsuppressed lanes with complete unique approved test inventory", () =>
  rejects([
    ["omitted file", (x) => x.toolingFiles.pop()],
    ["duplicate file", (x) => x.toolingFiles.push(x.toolingFiles[0])],
    ["unknown file", (x) => x.toolingFiles.push("scripts/unreviewed.test.mjs")],
    [
      "missing shard",
      (x) => x.reusableWorkflows[".github/workflows/linter.yml"].jobs.tooling.strategy.matrix.shard.pop(),
    ],
    [
      "duplicate shard",
      (x) => x.reusableWorkflows[".github/workflows/linter.yml"].jobs.tooling.strategy.matrix.shard.push("foundation"),
    ],
    [
      "empty shard",
      (x) => x.reusableWorkflows[".github/workflows/linter.yml"].jobs.tooling.strategy.matrix.shard.push(""),
    ],
    [
      "failure suppression",
      (x) => (x.reusableWorkflows[".github/workflows/linter.yml"].jobs.tooling["continue-on-error"] = true),
    ],
    [
      "fast fail cancels remaining evidence",
      (x) => (x.reusableWorkflows[".github/workflows/linter.yml"].jobs.tooling.strategy["fail-fast"] = true),
    ],
  ]));

test("future linter cannot omit either gate test or replace the complete gate command", () =>
  rejects([
    ["missing visibility gate", (x) => (x.gateCommand = "node --test scripts/ci-gate.test.mjs")],
    ["missing original gate", (x) => (x.gateCommand = "node --test scripts/ci-visibility-policy.test.mjs")],
    ["arbitrary gate file", (x) => (x.gateCommand += " scripts/unreviewed.test.mjs")],
    [
      "missing linter gate invocation",
      (x) => {
        const step = x.reusableWorkflows[".github/workflows/linter.yml"].jobs.checks.steps.find((entry) =>
          entry.run?.includes("npm run test:gate"),
        );
        step.run = step.run.replace("npm run test:gate\n", "");
      },
    ],
  ]));

test("delivery shard alone installs exact pinned Terraform and initializes native providers without credentials", () =>
  rejects([
    [
      "missing Terraform setup",
      (x) => {
        const job = x.reusableWorkflows[".github/workflows/linter.yml"].jobs.tooling;
        job.steps = job.steps.filter((step) => !step.uses?.startsWith("hashicorp/setup-terraform@"));
      },
    ],
    [
      "moving Terraform version",
      (x) => {
        x.reusableWorkflows[".github/workflows/linter.yml"].jobs.tooling.steps.find((step) =>
          step.uses?.startsWith("hashicorp/setup-terraform@"),
        ).with.terraform_version = "latest";
      },
    ],
    [
      "missing provider initialization",
      (x) => {
        const job = x.reusableWorkflows[".github/workflows/linter.yml"].jobs.tooling;
        job.steps = job.steps.filter((step) => !step.run?.startsWith("terraform -chdir="));
      },
    ],
    [
      "remote backend enabled",
      (x) => {
        const step = x.reusableWorkflows[".github/workflows/linter.yml"].jobs.tooling.steps.find((entry) =>
          entry.run?.startsWith("terraform -chdir="),
        );
        step.run = step.run.replaceAll("-backend=false", "-backend=true");
      },
    ],
    [
      "unbounded shard setup",
      (x) => {
        delete x.reusableWorkflows[".github/workflows/linter.yml"].jobs.tooling.steps.find((step) =>
          step.uses?.startsWith("hashicorp/setup-terraform@"),
        ).if;
      },
    ],
    [
      "credentials injected",
      (x) => {
        x.reusableWorkflows[".github/workflows/linter.yml"].jobs.tooling.steps.find((entry) =>
          entry.run?.startsWith("terraform -chdir="),
        ).env = { GOOGLE_APPLICATION_CREDENTIALS: "private-provider-credentials" };
      },
    ],
  ]));

test("required acceptance and same-run image export cannot be replaced by candidate controls or another worker", () =>
  rejects([
    [
      "candidate as required",
      (x) => {
        x.reusableWorkflows[".github/workflows/base-acceptance-e2e.yml"].jobs["validate-product"].steps.find(
          (step) => step.run === "node scripts/run-ci-lane.mjs acceptance",
        ).run = "npm run test:acceptance:harness";
      },
    ],
    [
      "sharded frozen E2E",
      (x) =>
        (x.reusableWorkflows[".github/workflows/base-acceptance-e2e.yml"].jobs["validate-product"].strategy = {
          matrix: { shard: [1, 2] },
        }),
    ],
    [
      "missing image export",
      (x) => {
        const job = x.reusableWorkflows[".github/workflows/base-acceptance-e2e.yml"].jobs["validate-product"];
        job.steps = job.steps.filter((step) => step.id !== "release-bundle");
      },
    ],
    [
      "export on unrelated runner",
      (x) => {
        const base = x.reusableWorkflows[".github/workflows/base-acceptance-e2e.yml"].jobs["validate-product"];
        const at = base.steps.findIndex((step) => step.id === "release-bundle");
        x.reusableWorkflows[".github/workflows/server-tests.yml"].jobs.server.steps.push(base.steps.splice(at, 1)[0]);
      },
    ],
    [
      "foreign artifact",
      (x) =>
        (x.workflow.jobs["publish-release"].steps.find((step) =>
          step.uses?.startsWith("actions/download-artifact@"),
        ).with.name = "arbitrary-images"),
    ],
    [
      "foreign admission digest",
      (x) =>
        (x.workflow.jobs["publish-release"].env.GATE_ADMISSION_SHA256 = "${{ needs.server-tests.outputs.admission }}"),
    ],
  ]));

test("control-plane retains exact always-on unsuppressed gate and all four direct dependencies", () =>
  rejects([
    [
      "removed application gate",
      (x) => (x.workflow.jobs["control-plane"].needs = futureMandatory.filter((name) => name !== "application-tests")),
    ],
    ["conditional gate", (x) => (x.workflow.jobs["control-plane"].if = "${{ success() }}")],
    ["gate suppression", (x) => (x.workflow.jobs["control-plane"]["continue-on-error"] = true)],
    ["gate command replacement", (x) => (x.workflow.jobs["control-plane"].steps.at(-1).run = "true")],
  ]));

test("finite gate refuses skipped failed absent extra or malformed future results and keeps legacy behavior", () => {
  const requireGate = api("requireCiVisibilityGate");
  for (const policy of [legacyPolicy, futurePolicy]) {
    const needs = Object.fromEntries(policy.mandatoryJobs.map((name) => [name, { result: "success" }]));
    assert.doesNotThrow(() => requireGate(policy, needs));
    for (const name of policy.mandatoryJobs)
      for (const result of ["failure", "skipped", "cancelled", "neutral", "pending", ""]) {
        assert.throws(() => requireGate(policy, { ...needs, [name]: { result } }));
      }
    const missing = structuredClone(needs);
    delete missing[policy.mandatoryJobs[0]];
    for (const bad of [missing, { ...needs, extra: { result: "success" } }, null, [], {}]) {
      assert.throws(() => requireGate(policy, bad));
    }
  }
  assert.throws(() => requireGate({ ...futurePolicy, variant: "arbitrary" }, {}));
});

test("source reader selects exact original Git objects while working HEAD contains the other layout", (t) => {
  const read = api("readCiVisibilityPolicy");
  const fixture = history(t);
  assert.deepEqual(read(fixture.root, fixture.legacy), legacyPolicy);
  assert.deepEqual(read(fixture.root, fixture.split), futurePolicy);
  fixture.git("checkout", "--quiet", "--detach", fixture.legacy);
  assert.deepEqual(read(fixture.root, fixture.split), futurePolicy);
  for (const ref of ["HEAD", "main", "", fixture.split.toUpperCase(), "0".repeat(40), "f".repeat(40)]) {
    assert.throws(() => read(fixture.root, ref));
  }
});

test("source reader rejects missing or ambiguous mixed canonical workflow identity rather than falling back", (t) => {
  const read = api("readCiVisibilityPolicy");
  const fixture = history(t);
  assert.deepEqual(read(fixture.root, fixture.split), futurePolicy);
  fixture.git("rm", "--quiet", ".github/workflows/server-tests.yml");
  const missing = fixture.commit("Missing reusable source");
  assert.throws(() => read(fixture.root, missing));
  fixture.git("checkout", "--quiet", "--detach", fixture.split);
  const mixed = futureInput().workflow;
  mixed.jobs["server-tests"].uses = "./.github/workflows/unreviewed.yml";
  fixture.put(".github/workflows/ci.yml", stringify(mixed));
  assert.throws(() => read(fixture.root, fixture.commit("Unknown reusable identity")));
});

test("publisher reads future leaf checks from original source and accepts one successful same-run attempt", (t) => {
  const fixture = history(t);
  const value = observation(fixture.split, observedFuture);
  const before = structuredClone(value);
  assert.doesNotThrow(() => observed(value, fixture.root));
  assert.deepEqual(value, before);
  fixture.git("checkout", "--quiet", "--detach", fixture.legacy);
  assert.doesNotThrow(() => observed(value, fixture.root));
});

test("publisher cannot borrow old successful job names for a future source even with same run metadata", (t) => {
  const fixture = history(t);
  const legacy = observation(fixture.legacy, legacyPolicy.observedJobs);
  assert.doesNotThrow(() => observed(legacy, fixture.root));
  assert.throws(() => observed(observation(fixture.split, legacyPolicy.observedJobs), fixture.root));
});

test("publisher rejects failed skipped duplicate missing or stale-source future leaf checks and preflight", (t) => {
  const fixture = history(t);
  const make = () => observation(fixture.split, observedFuture);
  assert.doesNotThrow(() => observed(make(), fixture.root));
  const mutations = [
    (x) => x.jobs.pop(),
    (x) => x.jobs.push(structuredClone(x.jobs[1])),
    (x) => (x.jobs[2].conclusion = "skipped"),
    (x) => (x.jobs[3].conclusion = "failure"),
    (x) => (x.jobs[4].head_sha = fixture.legacy),
    (x) => (x.jobs[5].run_attempt = 2),
    (x) => (x.jobs[6].steps = []),
    (x) => (x.jobs[7].steps[0].conclusion = "failure"),
    (x) => x.run.id++,
    (x) => (x.run.path = ".github/workflows/server-tests.yml"),
    (x) => (x.run.head_sha = fixture.legacy),
  ];
  for (const mutate of mutations) {
    const value = make();
    mutate(value);
    assert.throws(() => observed(value, fixture.root));
  }
});

test("legacy observed checks remain original-source bound when moving HEAD is future and without new API options", (t) => {
  const fixture = history(t);
  const value = observation(fixture.legacy, legacyPolicy.observedJobs);
  assert.doesNotThrow(() => observed(value));
  assert.doesNotThrow(() => observed(value, fixture.root));
  value.run.id++;
  assert.throws(() => observed(value, fixture.root));
});

test("image handoff still refuses substituted independently tested image IDs without rebuilding or normalizing", () => {
  const image = `sha256:${"a".repeat(64)}`;
  const inspected = { Id: image, Os: "linux", Architecture: "amd64" };
  assert.doesNotThrow(() => verifyImageInspection(image, inspected));
  assert.throws(() => verifyImageInspection(`sha256:${"b".repeat(64)}`, inspected));
});

/**
 * Reuse the independently authored finalizer's synthetic bundle/custody/API fixtures, preserving all real validators.
 * This test-only module seam changes its literal source SHA and exports three existing fixture functions. Its original
 * test registration is replaced with an inert callback only for that exact module URL; no publisher decision is mocked.
 */
async function publicationFixture(t, source) {
  const fixtureUrl = new URL(`./publish-release-finalization.test.mjs?ci-visibility-source=${source}`, import.meta.url);
  const original = readFileSync(new URL("./publish-release-finalization.test.mjs", import.meta.url), "utf8");
  const literal = 'const source = "a".repeat(40);';
  assert.equal(original.split(literal).length, 2, "Existing test fixture source seam must be unique");
  const hook = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === "node:test" && context.parentURL === fixtureUrl.href)
        return { url: "data:text/javascript,export default function fixtureOnlyTest(){}", shortCircuit: true };
      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (url === fixtureUrl.href)
        return {
          format: "module",
          source:
            original.replace(literal, `const source = ${JSON.stringify(source)};`) +
            "\nexport { fixture, evidence, fakeApi };\n",
          shortCircuit: true,
        };
      return nextLoad(url, context);
    },
  });
  let helpers;
  try {
    helpers = await import(fixtureUrl.href);
  } finally {
    hook.deregister();
  }
  for (const name of ["fixture", "evidence", "fakeApi"]) assert.equal(typeof helpers[name], "function");
  const value = helpers.fixture(t);
  return { ...value, input: helpers.evidence(value), remote: helpers.fakeApi(value) };
}

function useJobs(value, names) {
  value.remote.state.jobs = observation(value.bundle.origin.sourceRevision, names).jobs;
}

test("actual publisher accepts original-source future leaves and rejects unavailable or omitted root authority", async (t) => {
  const h = history(t);
  const legacy = await publicationFixture(t, h.legacy);
  const legacyResult = await publishRelease(legacy.bundle, legacy.remote.api, legacy.generated);
  assert.equal(legacyResult.reused, true, "Historical public API remains compatible without new arguments");
  const future = await publicationFixture(t, h.split);
  useJobs(future, observedFuture);
  h.git("checkout", "--quiet", "--detach", h.legacy);
  const before = future.remote.originalSnapshot();
  const result = await publishRelease(future.bundle, future.remote.api, future.generated, { root: h.root });
  assert.equal(result.reused, true);
  assert.equal(result.sourceRevision, h.split);
  assert.deepEqual(future.remote.originalSnapshot(), before);
  assert.deepEqual(future.remote.state.mutations, []);
  for (const options of [undefined, { root: future.root }, { root: join(h.root, "missing-root") }]) {
    const refused = await publicationFixture(t, h.split);
    useJobs(refused, observedFuture);
    await assert.rejects(() => publishRelease(refused.bundle, refused.remote.api, refused.generated, options));
    assert.deepEqual(refused.remote.state.mutations, []);
    assert.deepEqual(readdirSync(refused.generated), []);
  }
});

test("actual publisher refuses a future origin borrowing legacy jobs before local records or API mutations", async (t) => {
  const h = history(t);
  const valid = await publicationFixture(t, h.legacy);
  assert.equal((await publishRelease(valid.bundle, valid.remote.api, valid.generated, { root: h.root })).reused, true);
  const future = await publicationFixture(t, h.split);
  await assert.rejects(() => publishRelease(future.bundle, future.remote.api, future.generated, { root: h.root }));
  assert.deepEqual(future.remote.state.mutations, []);
  assert.deepEqual(readdirSync(future.generated), []);
});

test("actual finalizer accepts exact future leaves with separate root and preserves immutable evidence shape", async (t) => {
  const h = history(t);
  const legacy = await publicationFixture(t, h.legacy);
  assert.equal(
    (await finalizeV1Release(legacy.bundle, legacy.input, legacy.remote.api, legacy.generated)).version,
    "1.0.0",
  );
  const future = await publicationFixture(t, h.split);
  useJobs(future, observedFuture);
  const beforeInput = structuredClone(future.input);
  const original = future.remote.originalSnapshot();
  h.git("checkout", "--quiet", "--detach", h.legacy);
  const result = await finalizeV1Release(future.bundle, future.input, future.remote.api, future.generated, {
    root: h.root,
  });
  assert.equal(result.version, "1.0.0");
  assert.equal(result.sourceRevision, h.split);
  assert.deepEqual(future.input, beforeInput);
  assert.deepEqual(future.remote.originalSnapshot(), original);
  for (const options of [undefined, { root: future.root }]) {
    const refused = await publicationFixture(t, h.split);
    useJobs(refused, observedFuture);
    await assert.rejects(() =>
      finalizeV1Release(refused.bundle, refused.input, refused.remote.api, refused.generated, options),
    );
    assert.deepEqual(refused.remote.state.mutations, []);
    assert.deepEqual(readdirSync(refused.generated), []);
  }
});

test("actual finalizer refuses future-source legacy jobs before records, tags, assets or release mutation", async (t) => {
  const h = history(t);
  const valid = await publicationFixture(t, h.legacy);
  assert.equal(
    (await finalizeV1Release(valid.bundle, valid.input, valid.remote.api, valid.generated, { root: h.root })).version,
    "1.0.0",
  );
  const future = await publicationFixture(t, h.split);
  await assert.rejects(() =>
    finalizeV1Release(future.bundle, future.input, future.remote.api, future.generated, { root: h.root }),
  );
  assert.deepEqual(future.remote.state.mutations, []);
  assert.deepEqual(readdirSync(future.generated), []);
});

/**
 * Run the real CLI in a fixture Git root with a closed fetch-only GitHub substitute. The sole validator seam is
 * verifyReleaseBundle returning the already independently constructed synthetic bundle after checking exact CLI context.
 * Observed checks, source reader, publication API, local records and every publication decision remain real. Child I/O
 * forbids network and external commands except bounded read-only Git object queries; no real CI identity is claimed.
 */
function cliPublication(h, f) {
  const directory = join(h.root, ".artifacts");
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const bundlePath = join(directory, "synthetic-bundle.json");
  const statePath = join(directory, "synthetic-api.json");
  const callsPath = join(directory, "synthetic-fetch-calls.json");
  const outputPath = join(directory, "synthetic-actions-output");
  const preloadPath = join(directory, "synthetic-cli-preload.mjs");
  writeFileSync(bundlePath, JSON.stringify(f.bundle), { mode: 0o600 });
  writeFileSync(statePath, JSON.stringify(f.remote.state), { mode: 0o600 });
  writeFileSync(outputPath, "", { mode: 0o600 });
  const publisherUrl = new URL("./publish-release.mjs", import.meta.url);
  const evidenceUrl = new URL("./publish-release-evidence.mjs", import.meta.url);
  const wrapper = `
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
export * from ${JSON.stringify(evidenceUrl.href)};
export async function verifyReleaseBundle(root, directory, context) {
  assert.equal(root, ${JSON.stringify(h.root)});
  assert.equal(directory, '.artifacts/release-input');
  const bundle = JSON.parse(readFileSync(${JSON.stringify(bundlePath)}, 'utf8'));
  assert.deepEqual(context, bundle.origin);
  return bundle;
}
`;
  const preload = `
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { registerHooks, syncBuiltinESMExports } from 'node:module';
import child from 'node:child_process';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
const actualGit = child.execFileSync;
child.execFileSync = (command, args, options) => {
  assert.equal(command, 'git', 'Only source-bound read-only Git is allowed');
  assert(Array.isArray(args));
  const verbs = args.filter((value) => !value.startsWith('-'));
  assert(['show', 'ls-tree', 'cat-file', 'rev-parse'].includes(verbs[0]));
  assert.equal(options.cwd, ${JSON.stringify(h.root)});
  assert(Number.isInteger(options.timeout) && options.timeout > 0 && options.timeout <= 30000);
  return actualGit(command, args, options);
};
const denied = () => { throw new Error('Forbidden synthetic CLI external effect'); };
for (const name of ['exec','execSync','execFile','spawn','spawnSync','fork']) child[name] = denied;
http.request = http.get = https.request = https.get = net.connect = net.createConnection = tls.connect = denied;
net.Socket.prototype.connect = denied;
syncBuiltinESMExports();
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === './publish-release-evidence.mjs' && context.parentURL === ${JSON.stringify(publisherUrl.href)})
      return { url: ${JSON.stringify(`data:text/javascript,${encodeURIComponent(wrapper)}`)}, shortCircuit: true };
    return nextResolve(specifier, context);
  }
});
const state = JSON.parse(readFileSync(${JSON.stringify(statePath)}, 'utf8'));
const calls = [];
const prefix = '/repos/' + state.repository.full_name;
globalThis.fetch = async (url, options) => {
  const target = new URL(url);
  assert.equal(target.origin, 'https://api.github.com');
  assert.equal(options.redirect, 'error');
  assert.equal(options.method, 'GET', 'Published identical fixture needs no remote mutation');
  calls.push([options.method, target.pathname]);
  writeFileSync(${JSON.stringify(callsPath)}, JSON.stringify(calls), { mode: 0o600 });
  const path = target.pathname;
  let value;
  if (path === prefix) value = state.repository;
  else if (path === prefix + '/branches/main') value = state.branch;
  else if (path.startsWith(prefix + '/compare/')) value = state.comparison;
  else if (path === prefix + '/actions/runs/' + state.run.id + '/attempts/1') value = state.run;
  else if (path === prefix + '/actions/runs/' + state.run.id + '/attempts/1/jobs') value = { jobs: state.jobs };
  else if (path === prefix + '/releases') value = state.releases;
  else if (path.startsWith(prefix + '/releases/') && path.endsWith('/assets')) {
    const releaseId = path.slice((prefix + '/releases/').length, -'/assets'.length);
    value = state.assets[releaseId];
  } else if (path.startsWith(prefix + '/git/ref/tags/')) {
    const tag = path.slice((prefix + '/git/ref/tags/').length);
    value = state.tags[tag] ? { object: { type: 'commit', sha: state.tags[tag] } } : null;
  } else throw new Error('Unexpected synthetic read-only GitHub path');
  return new Response(JSON.stringify(value), { status: value === null ? 404 : 200,
    headers: { 'content-type': 'application/json' } });
};
`;
  writeFileSync(preloadPath, preload, { mode: 0o600 });
  const origin = f.bundle.origin;
  const result = spawnSync(process.execPath, ["--import", preloadPath, fileURLToPath(publisherUrl)], {
    cwd: h.root,
    encoding: "utf8",
    timeout: 20_000,
    maxBuffer: 512 * 1024,
    env: {
      PATH: `${dirname(process.execPath)}:/usr/bin:/bin`,
      LANG: "C",
      GITHUB_ACTIONS: "true",
      GITHUB_EVENT_NAME: "push",
      GITHUB_REF: "refs/heads/main",
      GITHUB_SERVER_URL: "https://github.com",
      GITHUB_REPOSITORY: origin.repository,
      GITHUB_SHA: origin.sourceRevision,
      CI_BASE_REF: origin.baseRevision,
      GITHUB_WORKFLOW_SHA: origin.workflowRevision,
      GITHUB_WORKFLOW_REF: `${origin.repository}/.github/workflows/ci.yml@refs/heads/main`,
      GITHUB_RUN_ID: String(origin.runId),
      GITHUB_RUN_ATTEMPT: String(origin.attempt),
      GITHUB_JOB: "publish-release",
      GITHUB_TOKEN: "synthetic-noncredential",
      GITHUB_OUTPUT: outputPath,
    },
  });
  assert.equal(result.error, undefined, "The actual CLI must start and exit within its bounded lifecycle");
  assert.equal(result.signal, null);
  assert(existsSync(callsPath), `Actual CLI must reach synthetic observed evidence: ${result.stderr}`);
  const calls = JSON.parse(readFileSync(callsPath, "utf8"));
  assert(
    calls.some(([, path]) => path.endsWith("/jobs")),
    "Real CLI must observe the original run's jobs",
  );
  assert(
    calls.every(([method]) => method === "GET"),
    "Read-only reused fixture never mutates GitHub",
  );
  return { ...result, directory, outputPath };
}

test("actual publication CLI supplies its Git root for future original-source job selection", async (t) => {
  const h = history(t);
  const old = await publicationFixture(t, h.legacy);
  const legacy = cliPublication(h, old);
  assert.equal(legacy.status, 0, `Historical CLI availability control: ${legacy.stderr}`);
  rmSync(join(h.root, ".artifacts"), { recursive: true, force: true });
  const future = await publicationFixture(t, h.split);
  useJobs(future, observedFuture);
  h.git("checkout", "--quiet", "--detach", h.legacy);
  const result = cliPublication(h, future);
  assert.equal(result.status, 0, `Actual future CLI must select original source: ${result.stderr}`);
  assert.equal(JSON.parse(result.stdout).sourceRevision, h.split);
});

test("actual publication CLI rejects future-source borrowed legacy checks before publication records", async (t) => {
  const h = history(t);
  const old = await publicationFixture(t, h.legacy);
  const valid = cliPublication(h, old);
  assert.equal(valid.status, 0, `Historical CLI availability control: ${valid.stderr}`);
  rmSync(join(h.root, ".artifacts"), { recursive: true, force: true });
  const future = await publicationFixture(t, h.split);
  const result = cliPublication(h, future);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Release publication failed:/u);
  assert.equal(result.stdout, "");
  assert.equal(readFileSync(result.outputPath, "utf8"), "");
  assert(!readdirSync(result.directory).includes("publication.json"));
  assert(!readdirSync(result.directory).includes("publication-notes.md"));
});

/**
 * The actual terminal job must select its exact workflow/source Git objects. The historical exported two-job API and
 * nonterminal tooling-test CLI remain compatible; only GITHUB_ACTIONS/control-plane activates this source authority.
 * The workflow policy fixes that terminal invocation. These synthetic child contexts do not authenticate real Actions.
 */
function terminalGate(h, source, needs, overrides = {}) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL("./ci-gate.mjs", import.meta.url))], {
    cwd: h.root,
    encoding: "utf8",
    timeout: 10_000,
    maxBuffer: 128 * 1024,
    env: {
      PATH: `${dirname(process.execPath)}:/usr/bin:/bin`,
      LANG: "C",
      GITHUB_ACTIONS: "true",
      GITHUB_JOB: "control-plane",
      GITHUB_REPOSITORY: "example/private-mp3",
      GITHUB_EVENT_NAME: "push",
      GITHUB_REF: "refs/heads/main",
      GITHUB_SERVER_URL: "https://github.com",
      GITHUB_SHA: source,
      GITHUB_WORKFLOW_SHA: source,
      GITHUB_WORKFLOW_REF: "example/private-mp3/.github/workflows/ci.yml@refs/heads/main",
      NEEDS_JSON: JSON.stringify(needs),
      ...overrides,
    },
  });
  assert.equal(result.error, undefined, "Actual terminal gate starts and exits within its bounded lifecycle");
  assert.equal(result.signal, null);
  return result;
}

const passingNeeds = (names) => Object.fromEntries(names.map((name) => [name, { result: "success" }]));

function legacyTerminalControl(h) {
  const result = terminalGate(h, h.legacy, passingNeeds(legacyPolicy.mandatoryJobs));
  assert.equal(result.status, 0, `Historical terminal CLI availability control: ${result.stderr}`);
  assert.match(result.stdout, /Every mandatory validation succeeded/u);
}

test("actual terminal gate accepts four future callers from exact source while working HEAD is legacy", (t) => {
  const h = history(t);
  legacyTerminalControl(h);
  h.git("checkout", "--quiet", "--detach", h.legacy);
  const result = terminalGate(h, h.split, passingNeeds(futureMandatory));
  assert.equal(result.status, 0, `Future source requires all four callers: ${result.stderr}`);
  assert.match(result.stdout, /Every mandatory validation succeeded/u);
});

test("actual terminal gate cannot satisfy a future source with only the old two caller results", (t) => {
  const h = history(t);
  legacyTerminalControl(h);
  const result = terminalGate(h, h.split, passingNeeds(legacyPolicy.mandatoryJobs));
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.notEqual(result.stderr, "");
});

test("actual terminal gate refuses each missing or skipped future caller without suppressing the gate", (t) => {
  const h = history(t);
  legacyTerminalControl(h);
  const valid = terminalGate(h, h.split, passingNeeds(futureMandatory));
  assert.equal(valid.status, 0, `Positive future terminal control: ${valid.stderr}`);
  for (const name of futureMandatory) {
    const missing = passingNeeds(futureMandatory);
    delete missing[name];
    for (const needs of [missing, { ...passingNeeds(futureMandatory), [name]: { result: "skipped" } }]) {
      const result = terminalGate(h, h.split, needs);
      assert.equal(result.status, 1, `${name}: ${JSON.stringify(needs)}`);
      assert.equal(result.stdout, "");
    }
  }
});

test("actual terminal gate rejects caller-selected layout and invalid or mismatched source identity", (t) => {
  const h = history(t);
  legacyTerminalControl(h);
  const needs = passingNeeds(legacyPolicy.mandatoryJobs);
  for (const [label, source, overrides] of [
    ["legacy selector", h.split, { CI_VISIBILITY_VARIANT: "legacy" }],
    ["future selector", h.legacy, { CI_VISIBILITY_VARIANT: "reusable-v1" }],
    ["missing exact source", "", {}],
    ["moving source reference", "HEAD", {}],
    ["absent Git object", "f".repeat(40), {}],
    ["workflow source mismatch", h.legacy, { GITHUB_WORKFLOW_SHA: h.split }],
    [
      "foreign workflow identity",
      h.legacy,
      { GITHUB_WORKFLOW_REF: "example/private-mp3/.github/workflows/other.yml@refs/heads/main" },
    ],
  ]) {
    const result = terminalGate(h, source, needs, overrides);
    assert.equal(result.status, 1, label);
    assert.equal(result.stdout, "", label);
    assert.notEqual(result.stderr, "", label);
  }
});

test("review regression: required full acceptance invocation is unconditional and cannot ignore failure", () =>
  rejects([
    [
      "conditional acceptance",
      (x) => {
        x.reusableWorkflows[".github/workflows/base-acceptance-e2e.yml"].jobs["validate-product"].steps.find(
          (step) => step.run === "node scripts/run-ci-lane.mjs acceptance",
        ).if = "${{ false }}";
      },
    ],
    [
      "suppressed acceptance failure",
      (x) => {
        x.reusableWorkflows[".github/workflows/base-acceptance-e2e.yml"].jobs["validate-product"].steps.find(
          (step) => step.run === "node scripts/run-ci-lane.mjs acceptance",
        )["continue-on-error"] = true;
      },
    ],
  ]));

test("review regression: every worker retains only the exact known checkout and Node setup before preflight", () => {
  const mutations = [];
  for (const [path, names] of [
    [".github/workflows/linter.yml", ["checks", "tooling"]],
    [".github/workflows/base-acceptance-e2e.yml", ["validate-product"]],
    [".github/workflows/application-tests.yml", ["application"]],
    [".github/workflows/server-tests.yml", ["server"]],
  ])
    for (const name of names) {
      mutations.push([
        `${path}/${name} unreviewed Node action`,
        (x) => {
          x.reusableWorkflows[path].jobs[name].steps[1].uses = `example/unreviewed@${"a".repeat(40)}`;
        },
      ]);
      mutations.push([
        `${path}/${name} unreviewed checkout pin`,
        (x) => {
          x.reusableWorkflows[path].jobs[name].steps[0].uses = `actions/checkout@${"a".repeat(40)}`;
        },
      ]);
      mutations.push([
        `${path}/${name} substituted checkout source`,
        (x) => {
          x.reusableWorkflows[path].jobs[name].steps[0].with.ref = "refs/heads/main";
        },
      ]);
      mutations.push([
        `${path}/${name} substituted Node selection`,
        (x) => {
          x.reusableWorkflows[path].jobs[name].steps[1].with["node-version-file"] = "unreviewed.nvmrc";
        },
      ]);
    }
  rejects(mutations);
});

test("review regression: no additional pinned action executes before the trusted linter or acceptance preflight", () =>
  rejects([
    ...[
      [".github/workflows/linter.yml", "checks"],
      [".github/workflows/base-acceptance-e2e.yml", "validate-product"],
    ].map(([path, name]) => [
      `${path}/${name} additional action`,
      (x) => {
        x.reusableWorkflows[path].jobs[name].steps.splice(2, 0, { uses: `example/unreviewed@${"a".repeat(40)}` });
      },
    ]),
  ]));

test("review regression: linter and delivery native setup preserve exact Terraform and credential-free init", () => {
  const mutations = [];
  for (const name of ["checks", "tooling"]) {
    const job = (x) => x.reusableWorkflows[".github/workflows/linter.yml"].jobs[name];
    const setup = (x) => job(x).steps.find((step) => step.uses?.startsWith("hashicorp/setup-terraform@"));
    const initialize = (x) => job(x).steps.find((step) => step.run?.startsWith("terraform -chdir="));
    mutations.push([`${name} moving native version`, (x) => (setup(x).with.terraform_version = "latest")]);
    mutations.push([
      `${name} unknown setup pin`,
      (x) => (setup(x).uses = `hashicorp/setup-terraform@${"b".repeat(40)}`),
    ]);
    mutations.push([`${name} wrapper enabled`, (x) => (setup(x).with.terraform_wrapper = true)]);
    mutations.push([`${name} missing setup`, (x) => (job(x).steps = job(x).steps.filter((step) => step !== setup(x)))]);
    mutations.push([
      `${name} mutable provider lock`,
      (x) => (initialize(x).run = initialize(x).run.replaceAll("-lockfile=readonly", "-lockfile=update")),
    ]);
    mutations.push([
      `${name} interactive init`,
      (x) => (initialize(x).run = initialize(x).run.replaceAll("-input=false", "-input=true")),
    ]);
    mutations.push([
      `${name} credential injection`,
      (x) => (initialize(x).env = { GOOGLE_APPLICATION_CREDENTIALS: "unreviewed-native-input" }),
    ]);
    mutations.push([`${name} skipped setup`, (x) => (setup(x).if = "${{ false }}")]);
    mutations.push([`${name} skipped init`, (x) => (initialize(x).if = "${{ false }}")]);
  }
  rejects(mutations);
});

/**
 * Compile the unchanged complete stage verify function only, with explicitly synthetic read-only GitHub observations.
 * Real requireObservedChecks validates its actual forwarded arguments and immediately throws a named stop on success.
 * The remaining stage function cannot run: no credentials, provider, deployment, file output or hosted admission is
 * exercised. This is consumer-wiring evidence only and does not claim that a synthetic context authenticates Actions.
 */
async function stageVerifyBoundary(h, value) {
  const { compileFunction } = await import("node:vm");
  const source = readFileSync(new URL("./stage-delivery.mjs", import.meta.url), "utf8");
  const startMarker = "async function verify(values) {";
  const endMarker = "/** Check the earlier fixed record against freshly verified bytes";
  assert.equal(source.split(startMarker).length, 2, "Actual stage verifier source boundary must be unique");
  assert.equal(source.split(endMarker).length, 2);
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert(end > start);
  const stop = new Error("Synthetic stage observed-check boundary complete");
  const calls = [];
  const origin = value.bundle.origin;
  const prefix = `/repos/${origin.repository}`;
  const api = {
    async request(method, path) {
      assert.equal(method, "GET", "Only synthetic read-only observations are permitted");
      calls.push(path);
      if (path === prefix) return value.repository;
      if (path === `${prefix}/branches/main`) return value.branch;
      if (path === `${prefix}/actions/runs/${origin.runId}/attempts/${origin.attempt}`) return value.run;
      if (path === `${prefix}/compare/${origin.sourceRevision}...${value.branch.commit.sha}`) return value.comparison;
      if (path === `${prefix}/releases/tags/v0.1.1` || path === `${prefix}/git/ref/tags/v0.1.1`) return null;
      throw new Error("Unexpected synthetic stage observation");
    },
    async list(path, field) {
      assert.equal(path, `/actions/runs/${origin.runId}/attempts/${origin.attempt}/jobs`);
      assert.equal(field, "jobs");
      calls.push(path);
      return value.jobs;
    },
  };
  const run = compileFunction(`return (${source.slice(start, end)});`, [
    "root",
    "credentials",
    "githubApi",
    "requireObservedChecks",
    "assert",
  ])(
    h.root,
    { github: "synthetic-noncredential" },
    (repository, token) => {
      assert.equal(repository, origin.repository);
      assert.equal(token, "synthetic-noncredential");
      return api;
    },
    (...args) => {
      requireObservedChecks(...args);
      throw stop;
    },
    assert,
  );
  return {
    stop,
    calls,
    execute: () =>
      run({
        context: { ...origin },
        config: {},
        bundle: { ...value.bundle, manifest: { version: "0.1.1" } },
        material: {},
        identity: {},
      }),
  };
}

test("actual stage verifier forwards its Git root for future original-source observed checks", async (t) => {
  const h = history(t);
  const old = await stageVerifyBoundary(h, observation(h.legacy, legacyPolicy.observedJobs));
  await assert.rejects(old.execute, (error) => error === old.stop, "Legacy actual verifier availability");
  const future = await stageVerifyBoundary(h, observation(h.split, observedFuture));
  h.git("checkout", "--quiet", "--detach", h.legacy);
  await assert.rejects(
    future.execute,
    (error) => error === future.stop,
    "Future exact-source check completes before stop",
  );
  assert(future.calls.some((path) => path.endsWith("/jobs")));
});

test("actual stage verifier cannot borrow successful legacy job names for a future source", async (t) => {
  const h = history(t);
  const old = await stageVerifyBoundary(h, observation(h.legacy, legacyPolicy.observedJobs));
  await assert.rejects(old.execute, (error) => error === old.stop, "Legacy actual verifier availability");
  const future = await stageVerifyBoundary(h, observation(h.split, legacyPolicy.observedJobs));
  await assert.rejects(future.execute, (error) => error !== future.stop && /mandatory job/u.test(error.message));
});
