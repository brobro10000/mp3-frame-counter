/**
 * Check that repository files preserve CI, dependency, baseline and repository-control policy across MVP phases.
 *
 * Run `npm run check:policy` from the repository root after `npm ci`, using the pinned Node/npm versions.
 * Assertions inspect workflow structure, gate dependencies, delivery restrictions, dependency pins and both rulesets.
 * A mismatch exits nonzero; this script reads local files and tool versions without changing repository settings.
 * It validates the declared policy, while verify-github.mjs separately audits enforcement on GitHub.
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { mandatoryJobs } from "./ci-gate.mjs";
import { detectPhase, requiredRootScripts } from "./phase-policy.mjs";
import { requireReleaseWorkflow } from "./publish-release-evidence.mjs";
import { requireReleasePolicyCheckout } from "./release-manifest.mjs";
import { requireRuntimeDependencyPolicy } from "./runtime-dependency-policy.mjs";
import { requireDocsToolPolicy } from "./docs-tool-policy.mjs";

// Validate the actual source and working policy before inspecting unrelated repository files.
const githubSource = process.env.GITHUB_ACTIONS === "true" ? process.env.GITHUB_SHA : undefined;
if (process.env.GITHUB_ACTIONS === "true") assert(githubSource, "Missing GITHUB_SHA release source revision");
requireReleasePolicyCheckout(process.cwd(), githubSource);

const read = (path) => readFileSync(path, "utf8");
const workflow = parse(read(".github/workflows/ci.yml"));
// Keep private inputs and generated caches out of source control; reviewed acceptance fixtures have their own scope.
const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const forbidden =
  /(^|\/)(node_modules|\.cache|\.mvp-workflow|\.mvp-orchestrator|\.codex|\.artifacts|\.terraform)(\/|$)|(^|\/)\.env($|\.)|\.(mp3|pem|key|tfplan|private\.json)$|\.tfstate($|\.)|\.tfvars($|\.)/i;
assert(
  !files.some((file) => forbidden.test(file) && !/^tests\/acceptance\/fixtures\/[a-z0-9_.-]+\.mp3$/.test(file)),
  "Private inputs or caches must never be tracked",
);
const phase = detectPhase(files);
assert.deepEqual(
  files.filter((file) => /^\.github\/workflows\//.test(file)),
  [".github/workflows/ci.yml"],
);
assert.deepEqual(workflow.on, { pull_request: { branches: ["main"] }, push: { branches: ["main"] } });
assert.deepEqual(workflow.permissions, { contents: "read" });
assert.equal(workflow.concurrency["cancel-in-progress"], "${{ github.event_name == 'pull_request' }}");
// The terminal gate must cover every mandatory job and still run when an upstream dependency fails or skips.
const jobs = workflow.jobs;
assert.deepEqual(
  Object.keys(jobs).sort(),
  ["control-plane", "deliver-foundation", "publish-release", ...mandatoryJobs].sort(),
);
requireReleaseWorkflow(workflow);
const gate = jobs["control-plane"];
assert.equal(gate.name, "control-plane");
assert.equal(gate.if, "${{ always() }}");
assert.deepEqual(gate.needs, mandatoryJobs);
assert.equal(gate.strategy, undefined);
assert(
  gate.steps.some((step) => step.run === "node scripts/ci-gate.mjs" && step.env?.NEEDS_JSON === "${{ toJSON(needs) }}"),
);
const validation = jobs["validate-foundation"];
assert.equal(validation.if, undefined);
const cloudValidation =
  [
    "terraform -chdir=infra/cloud/bootstrap fmt -check",
    "terraform -chdir=infra/cloud/bootstrap init -backend=false -input=false -lockfile=readonly",
    "terraform -chdir=infra/cloud/bootstrap validate -no-color",
    "terraform -chdir=infra/cloud/access fmt -check",
    "terraform -chdir=infra/cloud/access init -backend=false -input=false -lockfile=readonly",
    "terraform -chdir=infra/cloud/access validate -no-color",
  ].join("\n") + "\n";
assert.deepEqual(
  validation.steps.filter((step) => step.run).map((step) => step.run),
  [
    validation.steps.find((step) => step.id === "acceptance-preflight").run,
    "npm ci",
    cloudValidation,
    "npm run mermaid:install",
    "aa-exec --profile=chrome npm run validate",
  ],
);
// Both cloud roots require credential-free schema checks; access tests use mocked plans without cloud mutations.
assert.equal(validation.env, undefined);
const terraformSetup = validation.steps.find((step) => step.uses?.startsWith("hashicorp/setup-terraform@"));
assert.equal(terraformSetup?.uses, "hashicorp/setup-terraform@dfe3c3f87815947d99a8997f908cb6525fc44e9e");
assert.deepEqual(terraformSetup.with, { terraform_version: "1.13.3", terraform_wrapper: false });
assert.equal(terraformSetup.if, undefined);
assert.equal(terraformSetup.env, undefined);
const terraformValidation = validation.steps.find((step) => step.run === cloudValidation);
assert.equal(terraformValidation.if, undefined);
assert.equal(terraformValidation.env, undefined);
const product = jobs["validate-product"];
assert.equal(product.if, undefined, "Phase validation itself must never be skipped");
assert.deepEqual(
  product.steps.filter((step) => step.run).map((step) => step.run),
  [
    product.steps.find((step) => step.id === "acceptance-preflight").run,
    "npm ci",
    "node scripts/run-ci-phase.mjs",
    "node scripts/publish-release-bundle.mjs",
  ],
);
assert.equal(product.steps.find((step) => step.uses?.startsWith("actions/checkout@"))?.with?.["fetch-depth"], 0);
assert.equal(product.env?.CI_BASE_REF, "${{ github.event.pull_request.base.sha || github.event.before }}");
const delivery = jobs["deliver-foundation"];
assert.deepEqual(delivery.needs, ["control-plane", "validate-product"]);
assert.equal(
  delivery.if,
  "${{ github.event_name == 'push' && github.ref == 'refs/heads/main' && needs.validate-product.outputs.release-ready != 'true' }}",
);
assert(delivery.steps.some((step) => step.run === "npm run artifact:foundation"));
// Enforce bounded hosted jobs and immutable Actions; the separately checked publisher alone receives write permission.
for (const [name, job] of Object.entries(jobs)) {
  assert.equal(job["runs-on"], "ubuntu-24.04");
  assert(job["timeout-minutes"] > 0 && job["timeout-minutes"] <= (name === "validate-product" ? 30 : 10));
  if (!["publish-release", "validate-foundation", "validate-product"].includes(name))
    assert.equal(job.permissions, undefined);
  assert.equal(job["continue-on-error"], undefined);
  assert.equal(job.strategy, undefined);
  for (const step of job.steps) {
    assert.equal(step["continue-on-error"], undefined);
    if (step.uses) assert(/^[\w-]+\/[\w-]+@[a-f0-9]{40}$/.test(step.uses), "Actions need immutable SHA pins");
    if (step.uses?.startsWith("actions/checkout@")) assert.equal(step.with?.["persist-credentials"], false);
    if (step.run) {
      assert(!step.run.includes("${{"), "Pass event data through environment variables");
      assert(!/\|\|\s*true|gh\s+pr\s+(review|merge)/.test(step.run), "No suppression or approval automation");
    }
  }
}
assert(!read(".github/workflows/ci.yml").includes("secrets."), "No secrets in foundation workflows");
const upload = delivery.steps.find((step) => step.uses?.startsWith("actions/upload-artifact@"));
assert.equal(upload?.with?.["retention-days"], 7);
assert.equal(upload.with["if-no-files-found"], "error");
assert.equal(upload.with.name, "foundation-${{ github.sha }}");
assert.equal(upload.with.path, ".artifacts/*");
assert.equal(upload.with["include-hidden-files"], true);
// Ensure local validation and CI use the same exact tooling and integrity-checked npm dependency graph.
const pkg = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));
assert.equal(pkg.scripts["check:portability"], "node scripts/check-portability.mjs");
assert(pkg.scripts.validate.split(/\s*&&\s*/).includes("npm run check:portability"));
assert.equal(pkg.scripts["check:mermaid"], "node scripts/check-mermaid.mjs");
assert.equal(pkg.scripts["mermaid:install"], "puppeteer browsers install chrome@155.0.8059.39");
assert(pkg.scripts.validate.split(/\s*&&\s*/).includes("npm run check:mermaid"));
assert(pkg.scripts["test:tooling"].split(/\s+/).includes("scripts/mermaid.test.mjs"));
assert(pkg.scripts["test:tooling"].split(/\s+/).includes("infra/cloud/bootstrap/cap-reconciler.test.mjs"));
assert(pkg.scripts["test:tooling"].split(/\s+/).includes("scripts/cloud-access-foundation.test.mjs"));
assert(pkg.scripts["test:tooling"].split(/\s+/).includes("scripts/cloud-bootstrap-iam.test.mjs"));
assert(
  pkg.scripts["test:tooling"].split(/\s+/).includes("scripts/docs-tool-policy.test.mjs"),
  "Missing mandatory docs-tool-policy tests",
);
for (const path of files.filter((file) => /^scripts\/acceptance-.*\.test\.mjs$/.test(file)))
  assert(pkg.scripts["test:tooling"].split(/\s+/).includes(path), `Missing mandatory gate tests: ${path}`);
assert.equal(pkg.private, true);
assert.equal(pkg.engines.node, read(".nvmrc").trim());
assert.equal(process.versions.node, pkg.engines.node, "Select the pinned Node runtime");
assert.equal(pkg.packageManager, `npm@${pkg.engines.npm}`);
assert.equal(execFileSync("npm", ["--version"], { encoding: "utf8" }).trim(), pkg.engines.npm);
assert.deepEqual(lock.packages[""].devDependencies, pkg.devDependencies);
requireRuntimeDependencyPolicy(pkg, lock);
requireDocsToolPolicy(pkg, lock);
assert.equal(pkg.workspaces, undefined, "Use one root package plus the isolated acceptance exception");
const allowedDevelopmentTools = new Set([
  "prettier",
  "yaml",
  "typescript",
  "@types/node",
  "@mermaid-js/mermaid-cli",
  "puppeteer",
  "markdown-it",
  "redoc",
]);
assert(
  Object.keys(pkg.devDependencies).every((name) => allowedDevelopmentTools.has(name)),
  "Unreviewed development tool",
);
assert(pkg.devDependencies.prettier && pkg.devDependencies.yaml);
for (const script of requiredRootScripts(phase)) assert(pkg.scripts[script], `Missing mandatory ${script}`);
if (phase !== "foundation") {
  assert(files.includes("tests/acceptance/package.json"), "Acceptance requires its standalone package");
  assert(files.includes("tests/acceptance/package-lock.json"), "Acceptance requires its own pinned lockfile");
}
if (["parser", "integration"].includes(phase)) {
  assert(files.includes("docs/testing/baseline.json"), "Freeze the independent suite before product code");
}
for (const version of Object.values(pkg.devDependencies)) assert(/^\d+\.\d+\.\d+$/.test(version));
assert.equal(lock.lockfileVersion, 3);
for (const [path, dependency] of Object.entries(lock.packages)) {
  if (!path) continue;
  assert(dependency.resolved.startsWith("https://registry.npmjs.org/"));
  assert(dependency.integrity.startsWith("sha512-"));
}
const dependabot = parse(read(".github/dependabot.yml"));
assert.deepEqual(dependabot.updates.map((item) => item["package-ecosystem"]).sort(), ["github-actions", "npm"]);
// Validate the versioned administrative intent without treating this file as proof of active remote protection.
const rules = JSON.parse(read("docs/main-ruleset.json"));
assert.equal(rules.enforcement, "active");
assert.deepEqual(rules.bypass_actors, []);
assert.deepEqual(rules.conditions.ref_name, { include: ["refs/heads/main"], exclude: [] });
assert(!rules.rules.some((rule) => rule.type === "update"), "A blanket update restriction blocks legitimate merges");
for (const type of ["deletion", "non_fast_forward", "required_linear_history", "pull_request"]) {
  assert(
    rules.rules.some((rule) => rule.type === type),
    `Missing ${type}`,
  );
}
// Keep the PR, conversation and CI requirements outside the owner's review-only exception.
const corePullRequest = rules.rules.find((rule) => rule.type === "pull_request").parameters;
assert.equal(corePullRequest.required_approving_review_count, 0);
assert.equal(corePullRequest.require_last_push_approval, false);
assert.equal(corePullRequest.dismiss_stale_reviews_on_push, false);
assert.equal(corePullRequest.require_extra_approval_for_unattributed_changes, false);
assert.equal(corePullRequest.require_code_owner_review, false);
assert.deepEqual(corePullRequest.required_reviewers, []);
assert.equal(corePullRequest.required_review_thread_resolution, true);
assert.deepEqual(corePullRequest.allowed_merge_methods, ["squash"]);
const reviewRules = JSON.parse(read("docs/review-ruleset.json"));
assert.equal(reviewRules.name, "main-review-approval");
assert.equal(reviewRules.target, "branch");
assert.equal(reviewRules.enforcement, "active");
assert.deepEqual(reviewRules.conditions, rules.conditions);
assert.equal(reviewRules.bypass_actors.length, 1, "Exactly one owner review exception is permitted");
const [reviewActor] = reviewRules.bypass_actors;
assert.equal(reviewActor.actor_type, "User");
assert.equal(reviewActor.bypass_mode, "pull_request");
assert(Number.isSafeInteger(reviewActor.actor_id) && reviewActor.actor_id > 0);
assert.deepEqual(Object.keys(reviewActor).sort(), ["actor_id", "actor_type", "bypass_mode"]);
// The authenticated read-only audit checks this configured ID against the actual repository owner's ID.
assert.deepEqual(
  reviewRules.rules.map((rule) => rule.type),
  ["pull_request"],
);
const reviews = reviewRules.rules[0].parameters;
assert.equal(reviews.required_approving_review_count, 1);
for (const key of [
  "dismiss_stale_reviews_on_push",
  "require_last_push_approval",
  "required_review_thread_resolution",
]) {
  assert.equal(reviews[key], true);
}
assert.equal(reviews.require_code_owner_review, false);
assert.deepEqual(reviews.required_reviewers, []);
assert.equal(reviews.require_extra_approval_for_unattributed_changes, true);
assert.deepEqual(reviews.allowed_merge_methods, ["squash"]);
const statusRule = rules.rules.find((rule) => rule.type === "required_status_checks");
assert(statusRule, "The required gate must be bound to its observed integration");
assert.equal(statusRule.parameters.strict_required_status_checks_policy, true);
assert.equal(statusRule.parameters.required_status_checks.length, 1);
assert.equal(statusRule.parameters.required_status_checks[0].context, "control-plane");
assert(Number.isInteger(statusRule.parameters.required_status_checks[0].integration_id));
// Historical orchestrator artifacts are excluded from Prettier; still reject malformed JSON/YAML in CI.
for (const file of files.filter((file) => file.startsWith("agents/"))) {
  if (file.endsWith(".json")) JSON.parse(read(file));
  if (file.endsWith(".yaml")) parse(read(file));
  if (file.endsWith(".md") && read(file).startsWith("---\n")) parse(read(file).split("\n---\n")[0].slice(4));
}
console.log("Repository policy checks passed.");
