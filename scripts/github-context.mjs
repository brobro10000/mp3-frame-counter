/**
 * Resolve and validate portable inputs for the read-only GitHub audit without contacting GitHub.
 * Imported by verify-github.mjs and tested with `npm run test:tooling`; this module has no command-line side effects.
 * Repository identity comes from the audit caller; protected branches and bypass actors remain versioned policy.
 */

import assert from "node:assert/strict";
import { parseArgs } from "node:util";

/** Parse explicit repository/PR overrides; reject malformed inputs before making any API requests. */
export function parseAuditOptions(args) {
  const { values, tokens } = parseArgs({
    args,
    options: { repo: { type: "string" }, pr: { type: "string" } },
    tokens: true,
    strict: true,
    allowPositionals: false,
  });
  for (const name of ["repo", "pr"]) {
    assert(tokens.filter((token) => token.kind === "option" && token.name === name).length <= 1, `Repeat --${name}`);
  }
  if (values.repo !== undefined) parseRepository(values.repo);
  let prNumber;
  if (values.pr !== undefined) {
    assert(/^[1-9]\d*$/.test(values.pr), "--pr must be a positive pull request number");
    prNumber = Number(values.pr);
    assert(Number.isSafeInteger(prNumber), "--pr must be a safe integer");
  }
  return { repository: values.repo, prNumber };
}

/** Accept an OWNER/REPO slug, keeping URLs, paths and query parameters out of API endpoint construction. */
export function parseRepository(repository) {
  assert(
    typeof repository === "string" && /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/.test(repository),
    "Repository must be an OWNER/REPO slug",
  );
  const [owner, name] = repository.split("/");
  assert(![".", ".."].includes(name), "Repository name must not be a relative path");
  return { repository, owner, name };
}

/** Keep the bounded audit tied to one explicit protected branch shared by both desired rulesets. */
export function getProtectedBranch(coreRules, reviewRules) {
  assert.deepEqual(reviewRules.conditions, coreRules.conditions, "Both rulesets must protect the same branch");
  const refs = coreRules.conditions?.ref_name;
  assert.deepEqual(refs?.exclude, [], "Protected branch exclusions are outside this audit");
  assert(Array.isArray(refs?.include) && refs.include.length === 1, "Configure exactly one protected branch");
  const ref = refs.include[0];
  assert(
    typeof ref === "string" && /^refs\/heads\/[^*?\[\]\\\s~^:]+$/.test(ref),
    "Configure a literal refs/heads/ branch, without patterns or aliases",
  );
  return ref.slice("refs/heads/".length);
}

/** Select one explicit PR or query the current branch; the caller still verifies its base, author, state and SHA. */
export function selectPullRequestPath({ repository, branch, protectedBranch, prNumber }) {
  const { owner } = parseRepository(repository);
  if (prNumber !== undefined) {
    assert(Number.isSafeInteger(prNumber) && prNumber > 0, "PR number must be a positive safe integer");
    return `repos/${repository}/pulls/${prNumber}`;
  }
  assert(typeof branch === "string" && branch.length > 0 && branch !== "HEAD", "Detached checkout: supply --pr NUMBER");
  const query = new URLSearchParams({
    state: "open",
    head: `${owner}:${branch}`,
    base: protectedBranch,
    per_page: "100",
  });
  return `repos/${repository}/pulls?${query}`;
}

/** Require the sole configured review exception and the auditing account to be the actual personal repo owner. */
export function assertOwnerOverride(metadata, viewer, reviewRules) {
  assert.equal(metadata.owner?.type, "User", "This audit requires a personally owned repository");
  const ownerId = metadata.owner.id;
  assert(Number.isSafeInteger(ownerId) && ownerId > 0, "Repository owner must have a valid GitHub user ID");
  assert.deepEqual(
    reviewRules.bypass_actors,
    [{ actor_id: ownerId, actor_type: "User", bypass_mode: "pull_request" }],
    "Configured review bypass must name only the repository owner; adapt desired rules explicitly for a fork",
  );
  assert.equal(viewer.id, ownerId, "Run this audit as the repository owner receiving the review override");
  assert.equal(viewer.login, metadata.owner.login, "Authenticated account must match the repository owner");
}
