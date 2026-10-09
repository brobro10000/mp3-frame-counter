/**
 * Audit GitHub's live repository controls and passing CI for the checked-out revision using read-only requests.
 *
 * Run `npm run verify:github` from the repository root with Git and an authenticated GitHub CLI on PATH.
 * GitHub CLI supplies repository context. A revision matching protected-branch HEAD audits its push CI; otherwise
 * the checked-out branch selects its open PR. Override PR selection with
 * `npm run verify:github -- --repo OWNER/REPO --pr NUMBER`; --pr also supports a detached checkout.
 * Run as the personal repository owner with administrative read access; local HEAD must match passing remote CI.
 * Both desired rulesets supply the protected branch. Their configured review exception must name the actual owner;
 * explicitly adapt that versioned configuration before auditing a fork. This script never grants an exception.
 * Compare both effective rulesets with their versioned JSON, then verify check provenance and the owner's override.
 * Success prints a JSON snapshot; any unmet assertion exits nonzero. No settings, reviews or merges are changed.
 * Review state is reported, not assumed unapproved. A main audit requires actual successful foundation delivery;
 * a PR audit requires delivery to remain skipped. No local-only revision is accepted as remotely validated.
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  assertOwnerOverride,
  getProtectedBranch,
  parseAuditOptions,
  parseRepository,
  selectPullRequestPath,
} from "./github-context.mjs";

// Read-only administrative audit. Never apply settings from a PR-controlled workflow.
const options = parseAuditOptions(process.argv.slice(2));
const repository =
  options.repository ??
  JSON.parse(execFileSync("gh", ["repo", "view", "--json", "nameWithOwner"], { encoding: "utf8" })).nameWithOwner;
const { owner, name } = parseRepository(repository);
const api = (path) => JSON.parse(execFileSync("gh", ["api", path], { encoding: "utf8" }));
const expected = JSON.parse(readFileSync("docs/main-ruleset.json", "utf8"));
const expectedReviews = JSON.parse(readFileSync("docs/review-ruleset.json", "utf8"));
const protectedBranch = getProtectedBranch(expected, expectedReviews);
const viewer = api("user");
const metadata = api(`repos/${repository}`);
assert.equal(metadata.full_name.toLowerCase(), repository.toLowerCase());
assertOwnerOverride(metadata, viewer, expectedReviews);
assert.equal(metadata.private, true);
assert.equal(metadata.default_branch, protectedBranch);
assert.equal(metadata.permissions.admin, true, "Administrative read access is needed to audit all protections");
for (const [key, value] of Object.entries({
  allow_squash_merge: true,
  allow_merge_commit: false,
  allow_rebase_merge: false,
  allow_auto_merge: false,
  delete_branch_on_merge: true,
}))
  assert.equal(metadata[key], value, key);
// Read effective branch rules as well as the ruleset definition, so configured but inactive rules cannot pass.
const summaries = api(`repos/${repository}/rulesets?includes_parents=true&per_page=100`);
const matches = summaries.filter((rule) => rule.name === expected.name && rule.enforcement === "active");
assert.equal(matches.length, 1, "Expected one active foundation ruleset");
const ruleset = api(`repos/${repository}/rulesets/${matches[0].id}`);
assert.deepEqual(ruleset.bypass_actors, []);
assert.equal(ruleset.current_user_can_bypass, "never");
assert.deepEqual(ruleset.conditions, expected.conditions);
// The exception names one user and applies only to the separate approval ruleset during PR merges.
const reviewMatches = summaries.filter((rule) => rule.name === expectedReviews.name && rule.enforcement === "active");
assert.equal(reviewMatches.length, 1, "Expected one active review-only ruleset");
const reviewRuleset = api(`repos/${repository}/rulesets/${reviewMatches[0].id}`);
assert.deepEqual(reviewRuleset.bypass_actors, [
  { actor_id: viewer.id, actor_type: "User", bypass_mode: "pull_request" },
]);
assert.deepEqual(reviewRuleset.bypass_actors, expectedReviews.bypass_actors);
assert.equal(reviewRuleset.current_user_can_bypass, "pull_requests_only");
assert.deepEqual(reviewRuleset.conditions, expectedReviews.conditions);
assert.deepEqual(
  reviewRuleset.rules.map((rule) => rule.type),
  ["pull_request"],
);
const effective = api(`repos/${repository}/rules/branches/${encodeURIComponent(protectedBranch)}`);
assert.deepEqual(
  [...new Set(effective.map((rule) => rule.ruleset_id))].sort((a, b) => a - b),
  [ruleset.id, reviewRuleset.id].sort((a, b) => a - b),
  "An additional protected-branch ruleset could prevent the intended owner override",
);
// Classic protection also combines with rulesets; reject an unseen approval gate in this bounded foundation.
const classicProtection = JSON.parse(
  execFileSync(
    "gh",
    [
      "api",
      "graphql",
      "-f",
      "query=query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) { branchProtectionRules { totalCount } } }",
      "-f",
      `owner=${owner}`,
      "-f",
      `name=${name}`,
    ],
    { encoding: "utf8" },
  ),
);
assert.equal(classicProtection.data.repository.branchProtectionRules.totalCount, 0);
assert(!effective.some((rule) => rule.type === "update"), "Blanket update restriction is not the intended policy");
const expectedStatus = expected.rules.find((rule) => rule.type === "required_status_checks");
assert(expectedStatus, "CI source has not yet been observed and bound");
for (const desired of expected.rules) {
  const live = effective.find((rule) => rule.type === desired.type && rule.ruleset_id === ruleset.id);
  assert(live, `Missing effective ${desired.type}`);
  for (const [key, value] of Object.entries(desired.parameters ?? {}))
    assert.deepEqual(live.parameters[key], value, key);
}
for (const desired of expectedReviews.rules) {
  const live = effective.find((rule) => rule.type === desired.type && rule.ruleset_id === reviewRuleset.id);
  assert(live, `Missing effective review rule: ${desired.type}`);
  for (const [key, value] of Object.entries(desired.parameters ?? {}))
    assert.deepEqual(live.parameters[key], value, key);
}
const permissions = api(`repos/${repository}/actions/permissions`);
assert.equal(permissions.enabled, true);
assert.equal(permissions.sha_pinning_required, true);
const token = api(`repos/${repository}/actions/permissions/workflow`);
assert.deepEqual(token, { default_workflow_permissions: "read", can_approve_pull_request_reviews: false });
// Match local HEAD to either the protected branch or an explicit open PR; never validate an older revision.
const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const protectedHead = api(`repos/${repository}/branches/${encodeURIComponent(protectedBranch)}`).commit.sha;
const mode = options.prNumber === undefined && head === protectedHead ? "protected-branch" : "pull-request";
let pr;
let review;
if (mode === "pull-request") {
  const branch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
  const selected = api(selectPullRequestPath({ repository, branch, protectedBranch, prNumber: options.prNumber }));
  if (options.prNumber === undefined) {
    assert.equal(selected.length, 1, "Expected one open PR for this checkout, or HEAD matching protected-branch HEAD");
    pr = api(`repos/${repository}/pulls/${selected[0].number}`);
  } else {
    pr = selected;
  }
  assert.equal(pr.state, "open", "PR audit requires an open PR; audit the merged protected-branch revision instead");
  assert.equal(pr.base.ref, protectedBranch, "PR must target the configured protected branch");
  assert.equal(pr.base.repo.full_name, metadata.full_name, "PR must belong to the selected repository");
  assert.equal(pr.head.sha, head, "PR must match the current local revision");
  assert.equal(pr.merged, false);
  assert.equal(pr.auto_merge, null);
  review = JSON.parse(
    execFileSync(
      "gh",
      ["pr", "view", String(pr.number), "--repo", repository, "--json", "reviewDecision,mergeStateStatus,isDraft"],
      { encoding: "utf8" },
    ),
  );
}
// A green check counts only for this revision and the GitHub App observed when the requirement was configured.
const checks = api(`repos/${repository}/commits/${head}/check-runs?filter=latest&per_page=100`).check_runs;
const required = expectedStatus.parameters.required_status_checks[0];
const gate = checks.find((check) => check.name === required.context && check.app.id === required.integration_id);
assert.equal(gate?.head_sha, head, "Required check must identify the audited revision");
assert.equal(gate?.conclusion, "success", "Current revision must have a successful gate from its bound integration");
const event = mode === "protected-branch" ? "push" : "pull_request";
const runs = api(
  `repos/${repository}/actions/workflows/ci.yml/runs?event=${event}&head_sha=${head}&per_page=100`,
).workflow_runs;
const [run] = runs;
assert.equal(run?.conclusion, "success", "Latest CI workflow for this revision must have succeeded");
const jobs = api(`repos/${repository}/actions/runs/${run.id}/jobs?per_page=100`).jobs;
assert.equal(jobs.find((job) => job.name === "control-plane")?.conclusion, "success");
assert.equal(jobs.find((job) => job.name === "validate-foundation")?.conclusion, "success");
// Product validation is mandatory once its reviewed workflow exists at the audited revision.
const auditedWorkflow = execFileSync("git", ["show", `${head}:.github/workflows/ci.yml`], { encoding: "utf8" });
if (/^  validate-product:/m.test(auditedWorkflow)) {
  assert.equal(jobs.find((job) => job.name === "validate-product")?.conclusion, "success");
}
const delivery = jobs.find((job) => job.name === "deliver-foundation")?.conclusion;
assert.equal(delivery, mode === "protected-branch" ? "success" : "skipped");
console.log(
  JSON.stringify(
    {
      status: "validated",
      repository,
      protectedBranch,
      mode,
      pr: pr?.html_url ?? null,
      head,
      ruleset: ruleset.id,
      reviewRuleset: reviewRuleset.id,
      reviewOverride: { login: viewer.login, mode: reviewRuleset.current_user_can_bypass },
      check: required.context,
      integration: gate.app.slug,
      integration_id: gate.app.id,
      run: run.html_url,
      reviewDecision: review?.reviewDecision ?? null,
      mergeStateStatus: review?.mergeStateStatus ?? null,
      delivery,
    },
    null,
    2,
  ),
);
