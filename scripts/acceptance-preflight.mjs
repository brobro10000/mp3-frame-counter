/**
 * Validate trusted preflight wiring and produce an exact CI acceptance admission record before head-owned tooling.
 *
 * Imported use exports requirePreflightWorkflow(workflow) and the existing review collector without I/O. The workflow
 * validator requires the coordinator-bound SHA-256 of the reviewed inline bootstrap; an empty digest fails closed.
 *
 * Direct usage: node /trusted/external/scripts/acceptance-preflight.mjs, with no arguments and cwd GITHUB_WORKSPACE.
 * The CLI requires GitHub Actions CI/event/workflow identity, exact checked-out source/base commits, GITHUB_EVENT_PATH,
 * RUNNER_TEMP and GITHUB_OUTPUT. GATE_REVIEW_TOKEN is captured in memory and removed from this process's environment
 * before Git children run. Only newly appended bindings trigger bounded read-only GitHub review requests through the
 * fixed HTTP adapter. No caller-selected repository root, suite, target URL, phase or credential fallback is accepted.
 *
 * The only new persistent file is record JSON in a fresh mode-0700 directory outside the checkout, with mode 0600.
 * Its path and canonical digest are appended to GITHUB_OUTPUT for later consumers. Failure removes a newly created
 * record directory and emits a fixed diagnostic without credentials, API content or subprocess error details.
 * The coordinator-owned inline bootstrap extracts trusted modules and separately handles legacy introduction; this
 * CLI never imports a module from the checked-out source. CI authority still depends on the authenticated workflow.
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createAcceptanceAdmission } from "./acceptance-admission.mjs";
import { collectBindingObservations } from "./acceptance-review-observations.mjs";
import { createGithubReviewRequest } from "./acceptance-review-http.mjs";

export { collectBindingObservations };

// The coordinator replaces this only after finalizing and reviewing the exact inline workflow bootstrap.
export const preflightScriptSha256 = "";

const baseExpression = "${{ github.event.pull_request.base.sha || github.event.before }}";
const tokenExpression = "${{ github.token }}";
const registryPath = "docs/testing/acceptance-transitions.json";
const revisionPattern = /^[a-f0-9]{40}$/;
const repositoryPattern = /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/;
const digest = (value) => createHash("sha256").update(value).digest("hex");

/** Reject review credentials outside the one preflight step, without changing the separate publisher boundary. */
function noReviewCredential(value) {
  assert(
    !/GATE_REVIEW_TOKEN|github\.token|secrets\.GITHUB_TOKEN|\b(?:GH_TOKEN|GITHUB_TOKEN)\b/i.test(
      JSON.stringify(value ?? {}),
    ),
    "Review credential must remain scoped to the preflight step",
  );
}

/** Require both validation jobs to execute the exact reviewed, strict-shell preflight before head-owned commands. */
export function requirePreflightWorkflow(workflow) {
  assert(workflow && typeof workflow === "object" && !Array.isArray(workflow), "Expected workflow data");
  assert.deepEqual(workflow.permissions, { contents: "read" }, "Workflow-wide permissions must remain read-only");
  noReviewCredential(workflow.env);
  for (const name of ["validate-foundation", "validate-product"]) {
    const job = workflow.jobs?.[name];
    assert(job && typeof job === "object", "Required validation job is missing");
    assert.deepEqual(job.permissions, { contents: "read", "pull-requests": "read" }, "Invalid validation permissions");
    assert.equal(job["continue-on-error"], undefined, "Validation failure cannot be ignored");
    noReviewCredential(job.env);
    assert(Array.isArray(job.steps), "Validation job requires explicit steps");
    const matches = job.steps.filter((step) => step.id === "acceptance-preflight");
    assert.equal(matches.length, 1, "Validation job requires exactly one acceptance preflight");
    const step = matches[0];
    const index = job.steps.indexOf(step);
    assert.equal(step.name, "Validate acceptance admission", "Unexpected preflight step identity");
    assert.equal(step.if, undefined, "Acceptance preflight cannot be conditional");
    assert.equal(step["continue-on-error"], undefined, "Acceptance preflight failure cannot be ignored");
    assert.equal(
      step.shell,
      "bash --noprofile --norc -euo pipefail {0}",
      "Acceptance preflight requires a strict shell",
    );
    assert.deepEqual(
      step.env,
      { CI_BASE_REF: baseExpression, GATE_REVIEW_TOKEN: tokenExpression },
      "Invalid preflight inputs",
    );
    assert(typeof step.run === "string" && step.run.length > 0, "Acceptance preflight requires its reviewed bootstrap");
    assert.equal(digest(step.run), preflightScriptSha256, "Acceptance preflight differs from the reviewed bootstrap");
    assert(
      !job.steps.slice(0, index).some((entry) => entry.run !== undefined),
      "Head-owned commands precede preflight",
    );
    const installations = job.steps.filter((entry) => entry.run === "npm ci");
    assert(
      installations.length > 0 && installations.every((entry) => job.steps.indexOf(entry) > index),
      "Install must follow preflight",
    );
    const checkouts = job.steps.filter(
      (entry) => typeof entry.uses === "string" && entry.uses.startsWith("actions/checkout@"),
    );
    assert.equal(checkouts.length, 1, "Validation requires one checkout");
    assert(job.steps.indexOf(checkouts[0]) < index, "Checkout must precede acceptance preflight");
    assert.equal(checkouts[0].with?.["fetch-depth"], 0, "Acceptance preflight requires complete history");
    assert.equal(checkouts[0].with?.["persist-credentials"], false, "Checkout cannot persist credentials");
    for (const other of job.steps) if (other !== step) noReviewCredential(other);
  }
  return true;
}

/** Interpret only explicit positive decimal run identities; whitespace, coercion and default attempts are rejected. */
function positiveInteger(value) {
  assert(typeof value === "string" && /^[1-9]\d*$/.test(value), "Invalid CI numeric identity");
  const number = Number(value);
  assert(Number.isSafeInteger(number), "CI numeric identity exceeds the supported range");
  return number;
}

/** Require absolute, single-line runner paths before resolving their actual filesystem identities. */
function runnerPath(value) {
  assert(typeof value === "string" && isAbsolute(value) && !/[\x00-\x1f\x7f]/.test(value), "Invalid runner path");
  return realpathSync(value);
}

/** Use path-component ancestry rather than string prefixes when excluding checkout-controlled storage. */
function inside(root, path) {
  const child = relative(root, path);
  return child === "" || (!child.startsWith(`..${sep}`) && child !== ".." && !isAbsolute(child));
}

/** Read an optional registry as committed regular-file bytes, never from the index or working tree. */
function registryAt(git, revision) {
  const entries = git(["ls-tree", "-z", revision, "--", registryPath]).split("\0").filter(Boolean);
  if (entries.length === 0) return null;
  assert.equal(entries.length, 1, "Ambiguous acceptance registry");
  assert(
    /^100(?:644|755) blob [a-f0-9]{40}\tdocs\/testing\/acceptance-transitions\.json$/.test(entries[0]),
    "Registry must be a regular file",
  );
  const registry = JSON.parse(git(["show", `${revision}:${registryPath}`]));
  assert(registry && typeof registry === "object" && !Array.isArray(registry), "Invalid registry record");
  assert.deepEqual(Object.keys(registry).sort(), ["schemaVersion", "transitions"], "Unknown registry fields");
  assert.equal(registry.schemaVersion, 1, "Unsupported registry schema");
  assert(Array.isArray(registry.transitions), "Registry must contain transitions");
  return registry;
}

/** Establish runner/event/Git identity before using the narrowly scoped review credential or producing evidence. */
async function main() {
  const token = process.env.GATE_REVIEW_TOKEN;
  delete process.env.GATE_REVIEW_TOKEN;
  assert.equal(process.argv.length, 2, "Preflight accepts no arguments");
  assert.equal(process.env.CI, "true", "Preflight requires CI");
  assert.equal(process.env.GITHUB_ACTIONS, "true", "Preflight requires GitHub Actions");
  assert.equal(process.env.GITHUB_SERVER_URL, "https://github.com", "Unsupported GitHub server");
  assert.equal(process.env.GITHUB_API_URL, "https://api.github.com", "Unsupported GitHub API");
  const root = runnerPath(process.env.GITHUB_WORKSPACE);
  assert(statSync(root).isDirectory(), "Workspace must be a directory");
  assert.equal(realpathSync(process.cwd()), root, "Preflight cwd must be GITHUB_WORKSPACE");
  assert(!inside(root, realpathSync(fileURLToPath(import.meta.url))), "Preflight must execute outside the checkout");
  const temporaryRoot = runnerPath(process.env.RUNNER_TEMP);
  assert(statSync(temporaryRoot).isDirectory() && !inside(root, temporaryRoot), "Runner temp must be outside checkout");
  const outputPath = runnerPath(process.env.GITHUB_OUTPUT);
  assert(!inside(root, outputPath) && lstatSync(outputPath).isFile(), "Invalid runner output destination");
  const eventPath = runnerPath(process.env.GITHUB_EVENT_PATH);
  assert(!inside(root, eventPath) && lstatSync(eventPath).isFile(), "Invalid GitHub event source");
  const repository = process.env.GITHUB_REPOSITORY;
  assert(typeof repository === "string" && repositoryPattern.test(repository), "Invalid CI repository");
  const sourceRevision = process.env.GITHUB_SHA;
  const baseRevision = process.env.CI_BASE_REF;
  assert(typeof sourceRevision === "string" && revisionPattern.test(sourceRevision), "Invalid CI source revision");
  assert(typeof baseRevision === "string" && revisionPattern.test(baseRevision), "Invalid CI base revision");
  const eventName = process.env.GITHUB_EVENT_NAME;
  const ref = process.env.GITHUB_REF;
  assert.equal(process.env.GITHUB_WORKFLOW_SHA, sourceRevision, "Workflow revision differs from source");
  assert.equal(
    process.env.GITHUB_WORKFLOW_REF,
    `${repository}/.github/workflows/ci.yml@${ref}`,
    "Unexpected workflow identity",
  );
  const event = JSON.parse(readFileSync(eventPath, "utf8"));
  assert.equal(event.repository?.full_name, repository, "Event repository differs from CI repository");
  if (eventName === "push") {
    assert.equal(ref, "refs/heads/main", "Push preflight requires main");
    assert.equal(event.ref, ref, "Push event ref mismatch");
    assert.equal(event.before, baseRevision, "Push event base mismatch");
    assert.equal(event.after, sourceRevision, "Push event source mismatch");
  } else {
    assert.equal(eventName, "pull_request", "Unsupported CI event");
    const match = typeof ref === "string" && /^refs\/pull\/([1-9]\d*)\/merge$/.exec(ref);
    assert(match && Number.isSafeInteger(Number(match[1])), "Invalid PR merge ref");
    assert.equal(event.number, Number(match[1]), "PR event number mismatch");
    assert.equal(event.pull_request?.base?.sha, baseRevision, "PR event base mismatch");
    assert.equal(event.pull_request.base.ref, "main", "PR must target main");
    assert(
      typeof event.pull_request.head?.sha === "string" && revisionPattern.test(event.pull_request.head.sha),
      "Invalid PR head identity",
    );
  }
  const git = (args) =>
    execFileSync("git", ["--no-replace-objects", ...args], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 32 * 1024 * 1024,
    });
  assert.equal(
    realpathSync(git(["rev-parse", "--show-toplevel"]).trim()),
    root,
    "Checkout root differs from workspace",
  );
  assert.equal(git(["rev-parse", "HEAD"]).trim(), sourceRevision, "Checkout does not identify the CI source");
  for (const revision of [sourceRevision, baseRevision]) {
    assert.equal(git(["cat-file", "-t", revision]).trim(), "commit", "CI revision must identify a commit");
  }
  const ancestors = git(["rev-list", "--first-parent", sourceRevision]).trim().split("\n");
  assert(ancestors.includes(baseRevision), "CI base must be a first-parent source ancestor");
  if (eventName === "pull_request") {
    const parents = git(["rev-list", "--parents", "-n", "1", sourceRevision]).trim().split(" ").slice(1);
    assert.deepEqual(
      parents,
      [baseRevision, event.pull_request.head.sha],
      "Source is not the exact synthetic PR merge",
    );
  }
  const context = {
    repository,
    eventName,
    ref,
    sourceRevision,
    sourceTree: git(["rev-parse", `${sourceRevision}^{tree}`]).trim(),
    baseRevision,
    workflowRevision: process.env.GITHUB_WORKFLOW_SHA,
    toolingRevision: baseRevision,
    runId: positiveInteger(process.env.GITHUB_RUN_ID),
    attempt: positiveInteger(process.env.GITHUB_RUN_ATTEMPT),
  };
  const baseRegistry = registryAt(git, baseRevision);
  const sourceRegistry = registryAt(git, sourceRevision);
  assert(!baseRegistry || sourceRegistry, "Acceptance registry cannot disappear after trusted introduction");
  const previous = baseRegistry?.transitions ?? [];
  const current = sourceRegistry?.transitions ?? [];
  assert(current.length >= previous.length, "Historical acceptance bindings cannot be removed");
  assert.deepEqual(current.slice(0, previous.length), previous, "Historical acceptance bindings cannot be rewritten");
  assert(current.length <= previous.length + 1, "Only one acceptance binding may be appended");
  if (!baseRegistry) assert.equal(current.length, 0, "Bootstrap requires an empty acceptance registry");
  const added = current.slice(previous.length);
  const observedReviews =
    added.length === 0
      ? []
      : await collectBindingObservations(added, {
          repository,
          request: createGithubReviewRequest({ repository, token }),
        });
  const admission = createAcceptanceAdmission(root, { context, observedReviews });
  let temporary;
  let complete = false;
  try {
    temporary = mkdtempSync(join(temporaryRoot, "acceptance-admission-"));
    chmodSync(temporary, 0o700);
    const recordPath = join(temporary, "admission.json");
    writeFileSync(recordPath, `${JSON.stringify(admission.record, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    const output = openSync(outputPath, constants.O_WRONLY | constants.O_APPEND | constants.O_NOFOLLOW);
    try {
      assert(fstatSync(output).isFile(), "Runner output must be a regular file");
      writeFileSync(output, `admission-path=${recordPath}\nadmission-sha256=${admission.sha256}\n`);
    } finally {
      closeSync(output);
    }
    complete = true;
  } finally {
    if (temporary && !complete) rmSync(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(() => {
    console.error("Acceptance admission preflight failed; no valid admission output was produced.");
    process.exitCode = 1;
  });
}
