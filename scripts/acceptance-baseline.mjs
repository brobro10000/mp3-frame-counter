/**
 * Verify the independently authored acceptance baseline before application CI can use it.
 *
 * `verifyBaseline(root, baseRef)` reads docs/testing/baseline.json, Git objects and current suite files. The freeze
 * record names a pre-product ancestor commit, its exact suite tree and the fixture manifest SHA-256. A trusted base
 * freeze record cannot be replaced by a product change. The current suite must match every frozen byte and path.
 * Squash-only merges require a separate test-only P2 PR to merge first; freeze its actual merged main commit SHA
 * before shipping product work. A feature-branch test-only commit is a provisional review artifact, not a production
 * freeze: a combined squash would remove that commit from main ancestry. With baseRef supplied, the baseline must
 * already be an ancestor of that trusted base as well as HEAD. Omitting baseRef permits provisional local checks
 * only; it does not establish a protected-main production freeze. Never weaken either ancestor check for this.
 * This module is read-only, prints no credentials and throws on missing, malformed, changed or unverifiable evidence.
 * The caller may then extract the verified commit into an isolated temporary checkout for npm ci and execution.
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { detectPhase } from "./phase-policy.mjs";

export const baselinePath = "docs/testing/baseline.json";
export const suitePath = "tests/acceptance";
export const manifestPath = `${suitePath}/fixtures/manifest.json`;
const digest = (value) => createHash("sha256").update(value).digest("hex");

/** Read bounded Git metadata with explicit argv; failure remains fatal rather than becoming an empty result. */
export function git(root, args, encoding = "utf8") {
  return execFileSync("git", args, { cwd: root, encoding, maxBuffer: 32 * 1024 * 1024 });
}

/** List a committed tree or current nonignored files; use NUL delimiters so spaces remain meaningful. */
export function repositoryFiles(root, ref) {
  const args = ref
    ? ["ls-tree", "-r", "--name-only", "-z", ref]
    : ["ls-files", "--cached", "--others", "--exclude-standard", "-z"];
  return [...new Set(git(root, args).split("\0").filter(Boolean))].sort();
}

/** Validate the immutable suite identity and return the freeze record for an isolated CI checkout. */
export function verifyBaseline(root, baseRef) {
  const raw = readFileSync(join(root, baselinePath));
  const baseline = JSON.parse(raw);
  assert.equal(baseline.schemaVersion, 1, "Unsupported acceptance baseline schema");
  assert.equal(typeof baseline.contractRevision, "string");
  assert(baseline.contractRevision.length > 0, "Record the reviewed contract revision");
  assert(/^[a-f0-9]{40}$/.test(baseline.suiteCommit), "Record the full reviewed suite commit");
  assert(/^[a-f0-9]{40}$/.test(baseline.suiteTree), "Record the reviewed suite tree");
  assert(/^[a-f0-9]{64}$/.test(baseline.manifestSha256), "Record the fixture manifest SHA-256");
  git(root, ["merge-base", "--is-ancestor", baseline.suiteCommit, "HEAD"]);
  if (baseRef) {
    assert.doesNotThrow(
      () => git(root, ["merge-base", "--is-ancestor", baseline.suiteCommit, baseRef]),
      "Acceptance baseline must already be an ancestor of the trusted base; merge the test-only P2 PR first",
    );
  }
  const baselineFiles = repositoryFiles(root, baseline.suiteCommit);
  assert.equal(detectPhase(baselineFiles), "acceptance", "Acceptance baseline must precede product implementation");
  assert.equal(git(root, ["rev-parse", `${baseline.suiteCommit}:${suitePath}`]).trim(), baseline.suiteTree);
  const manifest = git(root, ["show", `${baseline.suiteCommit}:${manifestPath}`], null);
  assert.equal(digest(manifest), baseline.manifestSha256, "Fixture manifest does not match its reviewed identity");
  if (baseRef && repositoryFiles(root, baseRef).includes(baselinePath)) {
    const trusted = git(root, ["show", `${baseRef}:${baselinePath}`], null);
    assert.deepEqual(raw, trusted, "Baseline amendment requires a separate reviewed test-only change");
  }
  const expectedFiles = baselineFiles.filter((file) => file.startsWith(`${suitePath}/`));
  const currentFiles = repositoryFiles(root).filter((file) => file.startsWith(`${suitePath}/`));
  assert.deepEqual(currentFiles, expectedFiles, "Acceptance file set changed after baseline freeze");
  for (const file of expectedFiles) {
    assert(lstatSync(join(root, file)).isFile(), `Acceptance baseline requires a regular file: ${file}`);
    assert.equal(
      digest(readFileSync(join(root, file))),
      digest(git(root, ["show", `${baseline.suiteCommit}:${file}`], null)),
      `Acceptance baseline changed: ${file}`,
    );
  }
  return baseline;
}
