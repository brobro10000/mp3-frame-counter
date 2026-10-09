/**
 * Check repository/PR selection and owner-only review policy without network calls or repository mutations.
 * Run `npm run test:tooling` or `node --test scripts/github-context.test.mjs` from the repository root.
 * Synthetic GitHub records exercise portable names and fail-closed behavior for ambiguous or unsafe inputs.
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  assertOwnerOverride,
  getProtectedBranch,
  parseAuditOptions,
  parseRepository,
  selectPullRequestPath,
} from "./github-context.mjs";

test("audit options default to checkout context and support explicit repository/PR overrides", () => {
  assert.deepEqual(parseAuditOptions([]), { repository: undefined, prNumber: undefined });
  assert.deepEqual(parseAuditOptions(["--repo", "example-owner/.github", "--pr", "42"]), {
    repository: "example-owner/.github",
    prNumber: 42,
  });
  assert.deepEqual(parseRepository("example-owner/reusable-tools"), {
    repository: "example-owner/reusable-tools",
    owner: "example-owner",
    name: "reusable-tools",
  });
});

test("audit options reject malformed slugs, ambiguous flags and invalid PR numbers", () => {
  for (const repository of [
    "",
    "owner",
    "owner/repo/extra",
    "https://github.com/owner/repo",
    "owner/..",
    "owner/r?q=x",
  ]) {
    assert.throws(() => parseAuditOptions(["--repo", repository]), /Repository/);
  }
  for (const number of ["0", "-1", "1.5", "1e2", "not-a-number", "9007199254740992"]) {
    assert.throws(() => parseAuditOptions(["--pr", number]));
  }
  assert.throws(() => parseAuditOptions(["--pr", "1", "--pr", "2"]), /Repeat --pr/);
  assert.throws(() => parseAuditOptions(["--unknown"]));
  assert.throws(() => parseAuditOptions(["unexpected-positional"]));
});

test("protected branch comes from both desired rulesets and rejects broad or mismatched targets", () => {
  const desired = { conditions: { ref_name: { include: ["refs/heads/release/foundation"], exclude: [] } } };
  assert.equal(getProtectedBranch(desired, structuredClone(desired)), "release/foundation");
  for (const include of [[], ["refs/heads/a", "refs/heads/b"], ["~DEFAULT_BRANCH"], ["refs/heads/release/*"]]) {
    const broad = { conditions: { ref_name: { include, exclude: [] } } };
    assert.throws(() => getProtectedBranch(broad, structuredClone(broad)));
  }
  const other = { conditions: { ref_name: { include: ["refs/heads/other"], exclude: [] } } };
  assert.throws(() => getProtectedBranch(desired, other), /same branch/);
  const excluded = { conditions: { ref_name: { include: ["refs/heads/trunk"], exclude: ["refs/heads/other"] } } };
  assert.throws(() => getProtectedBranch(excluded, structuredClone(excluded)), /exclusions/);
});

test("PR selection uses the checkout branch and safely encodes branch names", () => {
  const path = selectPullRequestPath({
    repository: "example-owner/reusable-tools",
    branch: "feature/audit+portable",
    protectedBranch: "release/foundation",
  });
  const [endpoint, query] = path.split("?");
  assert.equal(endpoint, "repos/example-owner/reusable-tools/pulls");
  assert.deepEqual(Object.fromEntries(new URLSearchParams(query)), {
    state: "open",
    head: "example-owner:feature/audit+portable",
    base: "release/foundation",
    per_page: "100",
  });
});

test("an explicit PR works in a detached checkout; an implicit selection fails closed", () => {
  const context = { repository: "example-owner/reusable-tools", branch: "", protectedBranch: "trunk" };
  assert.equal(selectPullRequestPath({ ...context, prNumber: 17 }), "repos/example-owner/reusable-tools/pulls/17");
  assert.throws(() => selectPullRequestPath(context), /Detached checkout: supply --pr/);
});

test("review exception accepts only the configured personal owner and that owner's authenticated account", () => {
  const metadata = { owner: { id: 1234, type: "User", login: "example-owner" } };
  const viewer = { id: 1234, login: "example-owner" };
  const desired = { bypass_actors: [{ actor_id: 1234, actor_type: "User", bypass_mode: "pull_request" }] };
  assert.doesNotThrow(() => assertOwnerOverride(metadata, viewer, desired));
  assert.throws(
    () => assertOwnerOverride(metadata, { id: 5678, login: "different-admin" }, desired),
    /repository owner/,
  );
  assert.throws(
    () => assertOwnerOverride({ owner: { ...metadata.owner, type: "Organization" } }, viewer, desired),
    /personally owned/,
  );
  for (const actors of [
    [],
    [{ actor_id: 5678, actor_type: "User", bypass_mode: "pull_request" }],
    [{ actor_id: 1234, actor_type: "RepositoryRole", bypass_mode: "pull_request" }],
    [{ actor_id: 1234, actor_type: "User", bypass_mode: "always" }],
    [...desired.bypass_actors, { actor_id: 5678, actor_type: "User", bypass_mode: "pull_request" }],
  ]) {
    assert.throws(() => assertOwnerOverride(metadata, viewer, { bypass_actors: actors }), /only the repository owner/);
  }
});
