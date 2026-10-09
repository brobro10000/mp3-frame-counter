/**
 * Exercise baseline protection against real temporary Git repositories rather than mocked verification calls.
 * Run `node --test scripts/acceptance-baseline.test.mjs`; Git must be on PATH. Every case creates and removes a
 * disposable local repository with synthetic fixture metadata. No application, network or private sample is used.
 * The assertions prove incorrect identities, changed tests and unreviewed freeze records fail before suite execution.
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { baselinePath, git, manifestPath, verifyBaseline } from "./acceptance-baseline.mjs";

function fixture(t, withProduct = false) {
  const root = mkdtempSync(join(tmpdir(), "mp3-baseline-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, ["init", "--quiet"]);
  const put = (path, content) => {
    const location = join(root, path);
    mkdirSync(join(location, ".."), { recursive: true });
    writeFileSync(location, content);
  };
  const commit = () => {
    git(root, ["add", "."]);
    git(root, [
      "-c",
      "user.name=Baseline Test",
      "-c",
      "user.email=baseline@example.invalid",
      "commit",
      "--quiet",
      "-m",
      "test baseline",
    ]);
    return git(root, ["rev-parse", "HEAD"]).trim();
  };
  put("README.md", "Synthetic foundation before acceptance.\n");
  const foundationCommit = commit();
  put("tests/acceptance/package.json", '{"private":true}\n');
  put(manifestPath, '{"fixture":"independent synthetic fixture"}\n');
  if (withProduct) put("server/src/parser.ts", "export const product = true;\n");
  const suiteCommit = commit();
  const record = {
    schemaVersion: 1,
    contractRevision: "r1",
    suiteCommit,
    suiteTree: git(root, ["rev-parse", `${suiteCommit}:tests/acceptance`]).trim(),
    manifestSha256: createHash("sha256")
      .update(readFileSync(join(root, manifestPath)))
      .digest("hex"),
  };
  const freeze = () => put(baselinePath, `${JSON.stringify(record, null, 2)}\n`);
  freeze();
  return { root, record, put, commit, freeze, foundationCommit };
}

test("an independently committed acceptance suite passes exact-byte verification", (t) => {
  const { root, record, commit, put } = fixture(t);
  const base = commit();
  put("server/src/parser.ts", "export const product = true;\n");
  commit();
  assert.deepEqual(verifyBaseline(root, base), record);
});

test("a feature-only baseline fails trusted-base CI even when product HEAD contains it", (t) => {
  const { root, record, commit, put, foundationCommit } = fixture(t);
  put("server/src/parser.ts", "export const product = true;\n");
  commit();
  assert.deepEqual(verifyBaseline(root), record, "Local provisional checks can use the reviewed local ancestor");
  assert.throws(() => verifyBaseline(root, foundationCommit), /already be an ancestor of the trusted base/);
  assert.deepEqual(verifyBaseline(root, record.suiteCommit), record, "A separately landed suite is a trusted ancestor");
});

test("changed expected counts or extra acceptance files fail the frozen identity", (t) => {
  const { root, put } = fixture(t);
  put(manifestPath, '{"fixture":"implementation-derived answer"}\n');
  assert.throws(() => verifyBaseline(root), /Acceptance baseline changed/);
  put("tests/acceptance/extra.ts", "// A new unreviewed test.\n");
  assert.throws(() => verifyBaseline(root), /Acceptance file set changed/);
});

test("manifest and tree identities are checked against the actual Git object", (t) => {
  const { root, record, freeze } = fixture(t);
  record.manifestSha256 = "0".repeat(64);
  freeze();
  assert.throws(() => verifyBaseline(root), /Fixture manifest/);
  record.suiteTree = "0".repeat(40);
  freeze();
  assert.throws(() => verifyBaseline(root));
});

test("a baseline authored after product code is not accepted as an independent initial baseline", (t) => {
  const { root } = fixture(t, true);
  assert.throws(() => verifyBaseline(root), /precede product/);
});

test("a product branch cannot rewrite the trusted base's freeze record", (t) => {
  const { root, record, freeze, commit } = fixture(t);
  const base = commit();
  record.contractRevision = "silently weakened";
  freeze();
  assert.throws(() => verifyBaseline(root, base), /separate reviewed test-only change/);
});
