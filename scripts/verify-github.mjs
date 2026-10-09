/**
 * Audit GitHub's live repository controls and the current foundation PR using read-only requests.
 *
 * Run `npm run verify:github` from the repository root with Git and an authenticated GitHub CLI on PATH.
 * The account needs access to repository settings; local HEAD must match the pushed PR revision with passing CI.
 * Compare both effective rulesets with their versioned JSON, then verify check provenance and the owner's override.
 * Success prints a JSON snapshot; any unmet assertion exits nonzero. No settings, reviews or merges are changed.
 * This audit intentionally expects an open, unapproved foundation PR and no main delivery run; reassess after merge.
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Read-only administrative audit. Never apply settings from a PR-controlled workflow.
const repository = "brobro10000/mp3-frame-counter";
const api = (path) => JSON.parse(execFileSync("gh", ["api", path], { encoding: "utf8" }));
const expected = JSON.parse(readFileSync("docs/main-ruleset.json", "utf8"));
const expectedReviews = JSON.parse(readFileSync("docs/review-ruleset.json", "utf8"));
const viewer = api("user");
assert.equal(viewer.login, "brobro10000", "Run this audit as the account receiving the review override");
assert.equal(viewer.id, 82611798);
const metadata = api(`repos/${repository}`);
assert.equal(metadata.full_name, repository);
assert.equal(metadata.private, true);
assert.equal(metadata.default_branch, "main");
assert.equal(metadata.permissions.admin, true, "Administrative read access is needed to audit all protections");
for (const [key, value] of Object.entries({
  allow_squash_merge: true,
  allow_merge_commit: false,
  allow_rebase_merge: false,
  allow_auto_merge: false,
  delete_branch_on_merge: true,
}))
  assert.equal(metadata[key], value, key);
// Read effective main-branch rules as well as the ruleset definition, so configured but inactive rules cannot pass.
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
const effective = api(`repos/${repository}/rules/branches/main`);
assert.deepEqual(
  [...new Set(effective.map((rule) => rule.ruleset_id))].sort((a, b) => a - b),
  [ruleset.id, reviewRuleset.id].sort((a, b) => a - b),
  "An additional main ruleset could prevent the intended owner override",
);
// Classic protection also combines with rulesets; reject an unseen approval gate in this bounded foundation.
const classicProtection = JSON.parse(
  execFileSync(
    "gh",
    [
      "api",
      "graphql",
      "-f",
      'query=query { repository(owner: "brobro10000", name: "mp3-frame-counter") { branchProtectionRules { totalCount } } }',
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
// Bind the audit to this checkout and the actual GitHub PR author, rather than Git commit author metadata.
const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const prs = api(`repos/${repository}/pulls?state=open&head=brobro10000:codex/phase-01-repository-foundation&base=main`);
assert.equal(prs.length, 1);
const pr = api(`repos/${repository}/pulls/${prs[0].number}`);
assert.equal(pr.head.sha, head, "PR must match the current local revision");
assert.equal(pr.user.login, "brobro10000");
assert.equal(pr.merged, false);
assert.equal(pr.auto_merge, null);
const review = JSON.parse(
  execFileSync(
    "gh",
    ["pr", "view", String(pr.number), "--repo", repository, "--json", "reviewDecision,mergeStateStatus,isDraft"],
    { encoding: "utf8" },
  ),
);
assert.equal(review.isDraft, false, "Use review requirements, not draft state, as the blocker");
assert.equal(review.reviewDecision, "REVIEW_REQUIRED");
assert.equal(review.mergeStateStatus, "BLOCKED");
// A green check counts only for this revision and the GitHub App observed when the requirement was configured.
const checks = api(`repos/${repository}/commits/${head}/check-runs?per_page=100`).check_runs;
const required = expectedStatus.parameters.required_status_checks[0];
const gate = checks.find((check) => check.name === required.context && check.app.id === required.integration_id);
assert.equal(gate?.conclusion, "success", "Current revision must have a successful gate from its bound integration");
const runs = api(
  `repos/${repository}/actions/workflows/ci.yml/runs?event=pull_request&head_sha=${head}&per_page=100`,
).workflow_runs;
const run = runs.find((item) => item.conclusion === "success");
assert(run, "No successful CI workflow for this PR revision");
const jobs = api(`repos/${repository}/actions/runs/${run.id}/jobs?per_page=100`).jobs;
assert.equal(jobs.find((job) => job.name === "control-plane")?.conclusion, "success");
assert.equal(jobs.find((job) => job.name === "validate-foundation")?.conclusion, "success");
assert.equal(jobs.find((job) => job.name === "deliver-foundation")?.conclusion, "skipped");
// Keep "delivery configured" distinct from "delivery executed" while the foundation PR remains unmerged.
const mainRuns = api(
  `repos/${repository}/actions/workflows/ci.yml/runs?event=push&branch=main&per_page=100`,
).workflow_runs;
assert.equal(mainRuns.length, 0, "Foundation delivery status must be reassessed after a main push");
console.log(
  JSON.stringify(
    {
      status: "validated",
      repository,
      pr: pr.html_url,
      head,
      ruleset: ruleset.id,
      reviewRuleset: reviewRuleset.id,
      reviewOverride: { login: viewer.login, mode: reviewRuleset.current_user_can_bypass },
      check: required.context,
      integration: gate.app.slug,
      integration_id: gate.app.id,
      run: run.html_url,
      reviewDecision: review.reviewDecision,
      mergeStateStatus: review.mergeStateStatus,
      delivery: "configured; not executed on main",
    },
    null,
    2,
  ),
);
