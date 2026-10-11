/**
 * Make the terminal control-plane check succeed only when every mandatory validation job has succeeded.
 *
 * CI runs `node scripts/ci-gate.mjs` with NEEDS_JSON containing GitHub Actions' serialized `needs` object.
 * The GitHub control-plane job derives its finite dependency set from the exact source/workflow Git identity, without
 * installing packages or accepting a caller-selected variant. Nonterminal CLI tests and exported APIs retain the
 * original two-job behavior. Read-only Git object selection establishes layout, never acceptance or publication.
 * Missing, extra, malformed or unsuccessful results produce a nonzero exit so skipped jobs cannot allow a merge.
 * Importing this module exposes the dependency list and validation function without running the command-line gate.
 */

import assert from "node:assert/strict";
import { readCiVisibilityPolicy, requireCiVisibilityGate } from "./ci-visibility-policy.mjs";

// Keep this list aligned with the workflow's gate dependencies; policy.mjs checks that relationship.
export const mandatoryJobs = ["validate-foundation", "validate-product"];

/**
 * Require an exact dependency set and an explicit "success" result for each job.
 * @param {unknown} needs Parsed GitHub Actions dependency results.
 * @throws {Error} When the input is incomplete, unexpected or contains any result other than success.
 */
export function requireSuccess(needs) {
  if (!needs || typeof needs !== "object" || Array.isArray(needs)) throw new Error("Missing dependency results");
  const names = Object.keys(needs).sort();
  if (JSON.stringify(names) !== JSON.stringify([...mandatoryJobs].sort())) {
    throw new Error("Missing or unexpected mandatory dependency");
  }
  for (const name of mandatoryJobs) {
    if (needs[name]?.result !== "success") throw new Error(`${name} did not succeed`);
  }
}

if (import.meta.main) {
  // Reject absent or invalid environment data through the same nonzero exit as an unsuccessful dependency.
  try {
    const needs = JSON.parse(process.env.NEEDS_JSON ?? "null");
    if (process.env.GITHUB_ACTIONS === "true" && process.env.GITHUB_JOB === "control-plane") {
      const env = process.env;
      assert.equal(env.CI_VISIBILITY_VARIANT, undefined, "Caller-selected CI layouts are forbidden");
      assert.equal(env.GITHUB_SERVER_URL, "https://github.com");
      assert(/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(env.GITHUB_REPOSITORY ?? ""));
      assert.equal(env.GITHUB_WORKFLOW_SHA, env.GITHUB_SHA, "Workflow differs from the exact CI source");
      assert.equal(
        env.GITHUB_WORKFLOW_REF,
        `${env.GITHUB_REPOSITORY}/.github/workflows/ci.yml@${env.GITHUB_REF}`,
        "Unknown terminal workflow identity",
      );
      if (env.GITHUB_EVENT_NAME === "push") assert.equal(env.GITHUB_REF, "refs/heads/main");
      else {
        assert.equal(env.GITHUB_EVENT_NAME, "pull_request");
        assert(/^refs\/pull\/[1-9]\d*\/merge$/.test(env.GITHUB_REF ?? ""));
      }
      requireCiVisibilityGate(readCiVisibilityPolicy(process.cwd(), env.GITHUB_SHA), needs);
    } else requireSuccess(needs);
    console.log("Every mandatory validation succeeded.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
