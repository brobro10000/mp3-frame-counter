/**
 * Independent VER-01 allocation and checkout-policy expectations, authored before allocator implementation.
 * Run `node --test scripts/release-allocation.test.mjs` with pinned Node. Temporary Git histories use fixed synthetic
 * identities and no remotes; no Docker, HTTP, credentials, real release or source-repository Git mutation occurs.
 * Expected versions and admission decisions are literal. Missing APIs fail explicitly rather than satisfying a
 * rejection assertion accidentally. The actual policy entrypoint must validate allocation before unrelated files.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import * as release from "./release-manifest.mjs";

const policyPath = "release-policy.json";
const strategy = "global-first-parent-ordinal";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const policy = (line = "0.1") => ({ schemaVersion: 1, strategy, line });
const policyBytes = (line = "0.1") => `${JSON.stringify(policy(line), null, 2)}\n`;

function api(name) {
  assert.equal(typeof release[name], "function", `Missing required VER-01 API: ${name}`);
  return release[name];
}

/** All Git writes are confined to one disposable repository, with global config, hooks and signing disabled. */
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "mp3-release-allocation-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const env = {
    PATH: process.env.PATH,
    HOME: root,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: join(root, "empty-gitconfig"),
    GIT_TERMINAL_PROMPT: "0",
    GIT_AUTHOR_NAME: "Independent Version Fixture",
    GIT_AUTHOR_EMAIL: "version@example.invalid",
    GIT_COMMITTER_NAME: "Independent Version Fixture",
    GIT_COMMITTER_EMAIL: "version@example.invalid",
    GIT_AUTHOR_DATE: "2026-01-01T00:00:00Z",
    GIT_COMMITTER_DATE: "2026-01-01T00:00:00Z",
  };
  const git = (...args) =>
    execFileSync("git", ["-c", "commit.gpgSign=false", "-c", "core.hooksPath=/dev/null", ...args], {
      cwd: root,
      env,
      encoding: "utf8",
      timeout: 10_000,
      maxBuffer: 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const put = (path, bytes) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), bytes);
  };
  let serial = 0;
  const commit = (message = "independent fixture source") => {
    git("add", "--all");
    git("commit", "--quiet", "--allow-empty", "-m", `${++serial}: ${message}`);
    return git("rev-parse", "HEAD");
  };
  const select = (line = "0.1") => {
    put(policyPath, policyBytes(line));
    return commit(`select ${line}`);
  };
  git("init", "--quiet", "--initial-branch=main");
  put("README.md", "Synthetic allocation history; no application or remote.\n");
  const initial = commit("foundation");
  return { root, env, git, put, commit, select, initial };
}

function expected(sourceRevision, version, ordinal, raw = undefined, line = "0.1") {
  return {
    sourceRevision,
    version,
    ordinal,
    policy: raw === undefined ? null : { ...policy(line), sha256: hash(raw) },
  };
}

test("historical ordinals 6 and 7 preserve legacy allocation with no policy", (t) => {
  const resolve = api("resolveReleaseAllocation");
  const f = fixture(t);
  for (let count = 2; count <= 5; count++) f.commit();
  const six = f.commit();
  const seven = f.commit();
  assert.deepEqual(resolve(f.root, six), expected(six, "0.1.6", 6));
  assert.deepEqual(resolve(f.root, seven), expected(seven, "0.1.7", 7));
});

test("initial 0.1 and the activation source itself use the global ordinal without resetting patch", (t) => {
  const resolve = api("resolveReleaseAllocation");
  const f = fixture(t);
  const introduction = f.select();
  assert.deepEqual(resolve(f.root, introduction), expected(introduction, "0.1.2", 2, policyBytes()));
  for (let count = 3; count <= 17; count++) f.commit();
  const activation = f.select("0.2");
  assert.deepEqual(resolve(f.root, activation), expected(activation, "0.2.18", 18, policyBytes("0.2"), "0.2"));
  const skip = f.select("0.10");
  assert.deepEqual(resolve(f.root, skip), expected(skip, "0.10.19", 19, policyBytes("0.10"), "0.10"));
});

test("an invalid initial higher line never establishes approval or restores legacy fallback", (t) => {
  const resolve = api("resolveReleaseAllocation");
  const f = fixture(t);
  const invalid = f.select("0.2");
  rmSync(join(f.root, policyPath));
  const removed = f.commit("remove invalid first policy");
  const repeated = f.select("0.2");
  for (const source of [invalid, removed, repeated]) assert.throws(() => resolve(f.root, source));
  const repaired = f.select("0.1");
  assert.deepEqual(resolve(f.root, repaired), expected(repaired, "0.1.5", 5, policyBytes()));
  assert.deepEqual(resolve(f.root, f.initial), expected(f.initial, "0.1.1", 1));
});

test("an initially malformed record still permanently ends legacy fallback", (t) => {
  const resolve = api("resolveReleaseAllocation");
  const f = fixture(t);
  f.put(policyPath, "{broken");
  const broken = f.commit("initial malformed policy");
  rmSync(join(f.root, policyPath));
  const deleted = f.commit("remove malformed policy");
  assert.throws(() => resolve(f.root, broken));
  assert.throws(() => resolve(f.root, deleted));
  const repaired = f.select();
  assert.deepEqual(resolve(f.root, repaired), expected(repaired, "0.1.4", 4, policyBytes()));
});

for (const failure of ["deletion", "downgrade"]) {
  test(`${failure} rejects the bad source while restoration preserves the earlier high-water line`, (t) => {
    const resolve = api("resolveReleaseAllocation");
    const f = fixture(t);
    f.select();
    f.select("0.2");
    if (failure === "deletion") rmSync(join(f.root, policyPath));
    else f.put(policyPath, policyBytes("0.1"));
    const bad = f.commit(failure);
    assert.throws(() => resolve(f.root, bad));
    const restored = f.select("0.2");
    assert.deepEqual(resolve(f.root, restored), expected(restored, "0.2.5", 5, policyBytes("0.2"), "0.2"));
    assert.throws(() => resolve(f.root, bad), "Repair must not rehabilitate the earlier bad source");
  });
}

const invalidData = [
  ["malformed JSON", '{"schemaVersion":1,'],
  ["duplicate plain key", '{"schemaVersion":1,"strategy":"global-first-parent-ordinal","line":"0.2","line":"0.9"}'],
  [
    "duplicate escaped key",
    '{"schemaVersion":1,"strategy":"global-first-parent-ordinal","line":"0.2","l\\u0069ne":"0.9"}',
  ],
  [
    "ambiguous future schema",
    '{"schemaVersion":1,"schemaVersion":2,"strategy":"global-first-parent-ordinal","line":"0.9"}',
  ],
  ["unknown field", JSON.stringify({ ...policy("0.9"), approved: true })],
  ["missing schema", JSON.stringify({ strategy, line: "0.9" })],
  ["missing strategy", JSON.stringify({ schemaVersion: 1, line: "0.9" })],
  ["missing line", JSON.stringify({ schemaVersion: 1, strategy })],
  ["string schema", JSON.stringify({ ...policy("0.9"), schemaVersion: "1" })],
  ["fractional schema", JSON.stringify({ ...policy("0.9"), schemaVersion: 1.5 })],
  ["numeric strategy", JSON.stringify({ ...policy("0.9"), strategy: 2 })],
  ["numeric line", JSON.stringify({ ...policy(), line: 2 })],
  ["array", JSON.stringify([policy("0.9")])],
  ["null", "null"],
];

for (const [label, raw] of invalidData) {
  test(`${label} cannot raise high-water or prevent a valid supported-policy repair`, (t) => {
    const resolve = api("resolveReleaseAllocation");
    const f = fixture(t);
    f.select();
    f.select("0.2");
    f.put(policyPath, raw);
    const bad = f.commit(label);
    assert.throws(() => resolve(f.root, bad));
    const restored = f.select("0.2");
    assert.deepEqual(resolve(f.root, restored), expected(restored, "0.2.5", 5, policyBytes("0.2"), "0.2"));
  });
}

for (const declared of [
  { ...policy("0.9"), schemaVersion: 2 },
  { ...policy("0.9"), strategy: "future-counter" },
]) {
  test(`unsupported declared ${declared.schemaVersion === 2 ? "schema" : "strategy"} blocks descendant interpretation`, (t) => {
    const resolve = api("resolveReleaseAllocation");
    const f = fixture(t);
    const known = f.select();
    f.put(policyPath, JSON.stringify(declared));
    const unsupported = f.commit("future policy contract");
    const restored = f.select("0.1");
    assert.throws(() => resolve(f.root, unsupported));
    assert.throws(() => resolve(f.root, restored), "Old tooling cannot ignore a declared future contract");
    assert.deepEqual(resolve(f.root, known), expected(known, "0.1.2", 2, policyBytes()));
  });
}

test("a unique future declaration remains a barrier even when other policy fields are invalid", (t) => {
  const resolve = api("resolveReleaseAllocation");
  for (const declaration of [
    { schemaVersion: 2, line: null },
    { strategy: "future-counter", schemaVersion: "wrong", extra: true },
  ]) {
    const f = fixture(t);
    f.select();
    f.put(policyPath, JSON.stringify(declaration));
    f.commit("unsupported declaration with malformed remaining fields");
    const restored = f.select();
    assert.throws(() => resolve(f.root, restored));
  }
});

test("unsafe line forms and ordinary major-1 allocation are rejected", (t) => {
  const resolve = api("resolveReleaseAllocation");
  const values = [
    "0.0",
    "0.01",
    "0.-1",
    "0.1.0",
    "0.2-rc",
    "0.2+meta",
    "1.0",
    "2.0",
    "0.9007199254740992",
    " 0.2",
    "0.2\n",
  ];
  for (const line of values) {
    const f = fixture(t);
    f.select();
    const bad = f.select(line);
    assert.throws(() => resolve(f.root, bad), `Unsafe release line ${JSON.stringify(line)}`);
  }
});

test("policy bytes are hashed exactly and neither later HEAD nor working edits select an older source's line", (t) => {
  const resolve = api("resolveReleaseAllocation");
  const f = fixture(t);
  const old = f.select();
  const later = f.select("0.2");
  const compact = `${JSON.stringify(policy("0.2"))}\n`;
  f.put(policyPath, compact);
  const formatted = f.commit("same policy with different exact bytes");
  f.put(policyPath, policyBytes("0.9"));
  assert.deepEqual(resolve(f.root, old), expected(old, "0.1.2", 2, policyBytes()));
  assert.deepEqual(resolve(f.root, later), expected(later, "0.2.3", 3, policyBytes("0.2"), "0.2"));
  assert.deepEqual(resolve(f.root, formatted), expected(formatted, "0.2.4", 4, compact, "0.2"));
  assert.notEqual(resolve(f.root, later).policy.sha256, resolve(f.root, formatted).policy.sha256);
});

test("side-branch commits do not inflate main's ordinal or activate an unmerged policy", (t) => {
  const resolve = api("resolveReleaseAllocation");
  const f = fixture(t);
  f.select();
  f.git("checkout", "--quiet", "-b", "side");
  f.select("0.9");
  f.commit("second side commit");
  f.git("checkout", "--quiet", "main");
  const main = f.commit("main only");
  assert.deepEqual(resolve(f.root, main), expected(main, "0.1.3", 3, policyBytes()));
  f.git("merge", "--quiet", "--no-ff", "side", "-m", "synthetic merge");
  const merged = f.git("rev-parse", "HEAD");
  assert.deepEqual(resolve(f.root, merged), expected(merged, "0.9.4", 4, policyBytes("0.9"), "0.9"));
});

test("a side branch cannot supply the missing first-parent initial 0.1 adoption", (t) => {
  const resolve = api("resolveReleaseAllocation");
  const f = fixture(t);
  f.git("checkout", "--quiet", "-b", "side");
  f.select();
  f.select("0.2");
  f.git("checkout", "--quiet", "main");
  const main = f.commit("still legacy on main");
  assert.deepEqual(resolve(f.root, main), expected(main, "0.1.2", 2));
  f.git("merge", "--quiet", "--no-ff", "side", "-m", "first appearance is 0.2");
  assert.throws(() => resolve(f.root, f.git("rev-parse", "HEAD")));
});

test("source selectors and missing commit objects cannot replace an exact source SHA", (t) => {
  const resolve = api("resolveReleaseAllocation");
  const f = fixture(t);
  for (const source of [
    undefined,
    null,
    1,
    "HEAD",
    "main",
    f.initial.slice(0, 8),
    f.initial.toUpperCase(),
    `${f.initial}^{commit}`,
    "f".repeat(40),
    "0".repeat(40),
  ])
    assert.throws(() => resolve(f.root, source));
});

test("Git replacement objects cannot change the source's policy or first-parent count", (t) => {
  const resolve = api("resolveReleaseAllocation");
  const f = fixture(t);
  const source = f.select();
  f.select("0.9");
  const replacement = f.git("commit-tree", f.git("rev-parse", "HEAD^{tree}"), "-m", "unrelated replacement root");
  f.git("replace", source, replacement);
  assert.deepEqual(resolve(f.root, source), expected(source, "0.1.2", 2, policyBytes()));
});

test("shallow source history fails instead of producing a smaller ordinal", (t) => {
  const resolve = api("resolveReleaseAllocation");
  const f = fixture(t);
  const source = f.select();
  f.put(".git/shallow", `${source}\n`);
  assert.throws(() => resolve(f.root, source));
});

for (const missing of ["ancestor", "policy blob"]) {
  test(`missing ${missing} is an integrity failure, not legacy fallback or a repairable value`, (t) => {
    const resolve = api("resolveReleaseAllocation");
    const f = fixture(t);
    const source = f.select();
    const object = missing === "ancestor" ? f.initial : f.git("rev-parse", `${source}:${policyPath}`);
    rmSync(join(f.root, ".git", "objects", object.slice(0, 2), object.slice(2)));
    assert.throws(() => resolve(f.root, source));
  });
}

for (const mode of ["symlink", "tree"]) {
  test(`committed policy ${mode} cannot be read as an ordinary root policy blob`, (t) => {
    const resolve = api("resolveReleaseAllocation");
    const f = fixture(t);
    f.select();
    rmSync(join(f.root, policyPath));
    if (mode === "symlink") {
      f.put("alternate-policy.json", policyBytes());
      symlinkSync("alternate-policy.json", join(f.root, policyPath));
    } else f.put(`${policyPath}/nested.json`, policyBytes());
    const bad = f.commit(`policy ${mode}`);
    assert.throws(() => resolve(f.root, bad));
    rmSync(join(f.root, policyPath), { recursive: true, force: true });
    const restored = f.select();
    assert.deepEqual(resolve(f.root, restored), expected(restored, "0.1.4", 4, policyBytes()));
  });

  test(`initial policy ${mode} establishes presence without authorizing any line`, (t) => {
    const resolve = api("resolveReleaseAllocation");
    const f = fixture(t);
    if (mode === "symlink") {
      f.put("alternate-policy.json", policyBytes());
      symlinkSync("alternate-policy.json", join(f.root, policyPath));
    } else f.put(`${policyPath}/nested.json`, policyBytes());
    const bad = f.commit(`initial ${mode} policy`);
    rmSync(join(f.root, policyPath), { recursive: true, force: true });
    const removed = f.commit("remove invalid policy entry");
    assert.throws(() => resolve(f.root, bad));
    assert.throws(() => resolve(f.root, removed));
    const restored = f.select();
    assert.deepEqual(resolve(f.root, restored), expected(restored, "0.1.4", 4, policyBytes()));
  });
}

test("stable version comparison is numeric and can protect future finalized 1.0.0", () => {
  const compare = api("compareReleaseVersions");
  for (const [left, right, answer] of [
    ["0.2.10", "0.1.99", 1],
    ["0.10.12", "0.2.99", 1],
    ["0.2.9", "0.2.10", -1],
    ["1.0.0", "0.10.999", 1],
    ["0.0.0", "0.0.0", 0],
    ["0.2.18", "0.2.18", 0],
  ]) {
    assert.equal(compare(left, right), answer);
    assert.equal(compare(right, left), answer === 0 ? 0 : -answer);
  }
});

test("comparison refuses coercion, aliases, unsafe components and prerelease/build forms", () => {
  const compare = api("compareReleaseVersions");
  for (const value of [
    null,
    undefined,
    1,
    "v0.2.1",
    "0.2",
    "0.02.1",
    "0.-2.1",
    "0.2.1-rc",
    "0.2.1+x",
    "0.2.9007199254740992",
    " 0.2.1",
    "0.2.1\n",
  ]) {
    assert.throws(() => compare(value, "0.2.1"));
    assert.throws(() => compare("0.2.1", value));
  }
});

test("checkout policy validation accepts exact legacy/policy HEAD and unrelated dirty files", (t) => {
  const check = api("requireReleasePolicyCheckout");
  const f = fixture(t);
  assert.deepEqual(check(f.root), expected(f.initial, "0.1.1", 1));
  const source = f.select();
  f.put("README.md", "Unrelated working documentation edit.\n");
  assert.deepEqual(check(f.root, source), expected(source, "0.1.2", 2, policyBytes()));
  assert.deepEqual(check(f.root), expected(source, "0.1.2", 2, policyBytes()));
});

test("an untracked root policy cannot be silently ignored by actual-source validation", (t) => {
  const check = api("requireReleasePolicyCheckout");
  const f = fixture(t);
  f.put(policyPath, policyBytes());
  assert.throws(() => check(f.root));
});

for (const changed of ["bytes", "deletion", "symlink", "directory"]) {
  test(`working policy ${changed} mismatch fails without imposing a global clean-tree rule`, (t) => {
    const check = api("requireReleasePolicyCheckout");
    const f = fixture(t);
    f.select();
    if (changed === "bytes") f.put(policyPath, `${JSON.stringify(policy())}\n`);
    else {
      rmSync(join(f.root, policyPath));
      if (changed === "symlink") {
        f.put("same-bytes.json", policyBytes());
        symlinkSync("same-bytes.json", join(f.root, policyPath));
      } else if (changed === "directory") mkdirSync(join(f.root, policyPath));
    }
    assert.throws(() => check(f.root));
  });
}

test("an expected CI source must be exact current HEAD, not an older otherwise valid source", (t) => {
  const check = api("requireReleasePolicyCheckout");
  const f = fixture(t);
  f.select();
  for (const source of [f.initial, "HEAD", "f".repeat(40), null, ""]) assert.throws(() => check(f.root, source));
});

for (const scenario of ["invalid committed policy", "mismatched CI source", "missing CI source"]) {
  test(`actual policy entrypoint rejects ${scenario} before unrelated repository-file checks`, (t) => {
    const f = fixture(t);
    if (scenario === "invalid committed policy") {
      f.put(policyPath, '{"schemaVersion":1,');
      f.commit("invalid committed policy");
    } else f.select();
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("./policy.mjs", import.meta.url))], {
      cwd: f.root,
      env: {
        ...f.env,
        CI: "true",
        GITHUB_ACTIONS: "true",
        ...(scenario === "missing CI source"
          ? {}
          : { GITHUB_SHA: scenario === "mismatched CI source" ? f.initial : f.git("rev-parse", "HEAD") }),
      },
      encoding: "utf8",
      timeout: 10_000,
      maxBuffer: 1024 * 1024,
    });
    assert.equal(result.error, undefined, "The actual policy process must execute");
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(
      result.stderr,
      /ENOENT|ERR_MODULE_NOT_FOUND|MODULE_NOT_FOUND/,
      "Allocation must fail before unrelated fixture-file checks",
    );
    assert.match(
      result.stderr,
      /(?:Error|AssertionError|SyntaxError)[^\n]*(?:policy|allocation|source|revision|JSON|GITHUB_SHA)/i,
    );
    assert.equal(
      readFileSync(join(f.root, policyPath), "utf8"),
      scenario === "invalid committed policy" ? '{"schemaVersion":1,' : policyBytes(),
    );
  });
}
