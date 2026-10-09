import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { mandatoryJobs } from "./ci-gate.mjs";

const read = (path) => readFileSync(path, "utf8");
const workflow = parse(read(".github/workflows/ci.yml"));
const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const forbidden =
  /(^|\/)(node_modules|\.cache|\.mvp-workflow|\.mvp-orchestrator|\.codex|\.artifacts)(\/|$)|(^|\/)\.env($|\.)|\.(mp3|pem|key)$/i;
assert(!files.some((file) => forbidden.test(file)), "Private inputs or caches must never be tracked");
assert(!files.some((file) => /^(src|app|test|tests)\//.test(file)), "Application implementation is outside this phase");
assert.deepEqual(
  files.filter((file) => /^\.github\/workflows\//.test(file)),
  [".github/workflows/ci.yml"],
);
assert.deepEqual(workflow.on, { pull_request: { branches: ["main"] }, push: { branches: ["main"] } });
assert.deepEqual(workflow.permissions, { contents: "read" });
assert.equal(workflow.concurrency["cancel-in-progress"], "${{ github.event_name == 'pull_request' }}");
const jobs = workflow.jobs;
assert.deepEqual(Object.keys(jobs).sort(), ["control-plane", "deliver-foundation", ...mandatoryJobs].sort());
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
assert.deepEqual(
  validation.steps.filter((step) => step.run).map((step) => step.run),
  ["npm ci", "npm run validate"],
);
const delivery = jobs["deliver-foundation"];
assert.deepEqual(delivery.needs, ["control-plane"]);
assert.equal(delivery.if, "${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}");
assert(delivery.steps.some((step) => step.run === "npm run artifact:foundation"));
for (const job of Object.values(jobs)) {
  assert.equal(job["runs-on"], "ubuntu-24.04");
  assert(job["timeout-minutes"] > 0 && job["timeout-minutes"] <= 10);
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
const pkg = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));
assert.equal(pkg.private, true);
assert.equal(pkg.engines.node, read(".nvmrc").trim());
assert.equal(process.versions.node, pkg.engines.node, "Select the pinned Node runtime");
assert.equal(pkg.packageManager, `npm@${pkg.engines.npm}`);
assert.equal(execFileSync("npm", ["--version"], { encoding: "utf8" }).trim(), pkg.engines.npm);
assert.deepEqual(lock.packages[""].devDependencies, pkg.devDependencies);
assert.equal(pkg.dependencies, undefined);
assert.deepEqual(Object.keys(pkg.devDependencies).sort(), ["prettier", "yaml"]);
for (const version of Object.values(pkg.devDependencies)) assert(/^\d+\.\d+\.\d+$/.test(version));
assert.equal(lock.lockfileVersion, 3);
for (const [path, dependency] of Object.entries(lock.packages)) {
  if (!path) continue;
  assert(dependency.resolved.startsWith("https://registry.npmjs.org/"));
  assert(dependency.integrity.startsWith("sha512-"));
}
const dependabot = parse(read(".github/dependabot.yml"));
assert.deepEqual(dependabot.updates.map((item) => item["package-ecosystem"]).sort(), ["github-actions", "npm"]);
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
const reviews = rules.rules.find((rule) => rule.type === "pull_request").parameters;
assert.equal(reviews.required_approving_review_count, 1);
for (const key of [
  "dismiss_stale_reviews_on_push",
  "require_last_push_approval",
  "required_review_thread_resolution",
]) {
  assert.equal(reviews[key], true);
}
assert.equal(reviews.require_code_owner_review, false);
assert.deepEqual(reviews.allowed_merge_methods, ["squash"]);
// The first discovery run precedes status-check binding. Remote verification rejects an unbound check.
const statusRule = rules.rules.find((rule) => rule.type === "required_status_checks");
if (statusRule) {
  assert.equal(statusRule.parameters.strict_required_status_checks_policy, true);
  assert.equal(statusRule.parameters.required_status_checks.length, 1);
  assert.equal(statusRule.parameters.required_status_checks[0].context, "control-plane");
  assert(Number.isInteger(statusRule.parameters.required_status_checks[0].integration_id));
}
// Canonical orchestrator artifacts are excluded from Prettier; still reject malformed JSON/YAML in CI.
for (const file of files.filter((file) => file.startsWith("agents/"))) {
  if (file.endsWith(".json")) JSON.parse(read(file));
  if (file.endsWith(".yaml")) parse(read(file));
  if (file.endsWith(".md") && read(file).startsWith("---\n")) parse(read(file).split("\n---\n")[0].slice(4));
}
console.log("Repository policy checks passed.");
