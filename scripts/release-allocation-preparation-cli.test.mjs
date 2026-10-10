/**
 * Follow up VER-01's preparation adapter with actual-CLI integration checks, authored after that adapter was added.
 * Run `node --test scripts/release-allocation-preparation-cli.test.mjs` with pinned Node. Each disposable Git fixture
 * copies the real preparation modules and supplies synthetic passed reports plus a logging fake Docker executable.
 * Expected versions, ordinals, policy bindings and acceptance decisions are independently specified fixture data.
 * Tests cover rejection before Docker/export, historical-source allocation and immutable complete/incomplete retries.
 * One fixture-only call-site mutation substitutes preparation HEAD to prove the historical-source oracle catches it.
 * Only temporary repositories/artifacts are written and removed; no real Docker, credentials, network or releases run.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import test from "node:test";

const policyPath = "release-policy.json";
const registryPath = "docs/testing/acceptance-transitions.json";
const fixtureManifest = "tests/acceptance/fixtures/manifest.json";
const configurationPaths = [
  ".dockerignore",
  "compose.yaml",
  "frontend/.dockerignore",
  "frontend/Dockerfile",
  "frontend/entrypoint.sh",
  "frontend/nginx.conf.template",
  "server/Dockerfile",
];
const preparedNames = [
  "SHA256SUMS",
  "api.docker.tar",
  "frontend.docker.tar",
  "manifest.json",
  "release-notes.md",
  "reservation.json",
];
const images = { api: `sha256:${"a".repeat(64)}`, frontend: `sha256:${"b".repeat(64)}` };
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const serialized = (value) => `${JSON.stringify(value, null, 2)}\n`;
const policyBytes = (line) => serialized({ schemaVersion: 1, strategy: "global-first-parent-ordinal", line });
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

/** Histories contain six explicit first-parent commits; all commands use isolated noninteractive local Git settings. */
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "mp3-preparation-cli-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const env = {
    PATH: process.env.PATH,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: join(root, ".artifacts/empty-gitconfig"),
    GIT_TERMINAL_PROMPT: "0",
    GIT_AUTHOR_NAME: "Independent Preparation CLI",
    GIT_AUTHOR_EMAIL: "preparation@example.invalid",
    GIT_COMMITTER_NAME: "Independent Preparation CLI",
    GIT_COMMITTER_EMAIL: "preparation@example.invalid",
    GIT_AUTHOR_DATE: "2026-01-01T00:00:00Z",
    GIT_COMMITTER_DATE: "2026-01-01T00:00:00Z",
  };
  const git = (...args) =>
    execFileSync("git", ["-c", "commit.gpgSign=false", "-c", "core.hooksPath=/dev/null", ...args], {
      cwd: root,
      env,
      encoding: "utf8",
      timeout: 10000,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const put = (path, bytes) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), bytes);
  };
  const json = (path, value) => put(path, serialized(value));
  const commit = (message) => {
    git("add", "--all");
    git("commit", "--quiet", "-m", message);
    return git("rev-parse", "HEAD");
  };
  git("init", "--quiet", "--initial-branch=main");
  put(".gitignore", ".artifacts/\n");
  put("README.md", "Independent actual preparation CLI fixture.\n");
  for (const name of [
    "prepare-release",
    "release-manifest",
    "acceptance-preparation",
    "acceptance-admission",
    "acceptance-baseline",
    "acceptance-transitions",
    "phase-policy",
  ])
    put(`scripts/${name}.mjs`, readFileSync(new URL(`./${name}.mjs`, import.meta.url)));
  commit("foundation and preparation tooling");
  json("tests/acceptance/package.json", { private: true, scripts: { check: "node check.mjs" } });
  put("tests/acceptance/check.mjs", "// Independent synthetic acceptance; never executed.\n");
  json(fixtureManifest, { contractRevision: "r3", independentCount: 3 });
  put("docs/testing/acceptance-contract.md", "# Immutable independent synthetic r3 contract\n");
  const suite = commit("independent pre-product acceptance");
  const genesis = {
    schemaVersion: 1,
    suiteCommit: suite,
    suiteTree: git("rev-parse", `${suite}:tests/acceptance`),
    manifestSha256: sha256(readFileSync(join(root, fixtureManifest))),
    contractRevision: "r3",
    publicationStatus: "protected-main",
  };
  json("docs/testing/baseline.json", genesis);
  put("server/src/parser.ts", "// Synthetic product marker.\n");
  for (const path of configurationPaths) put(path, `Original source ${path}\n`);
  const product = commit("product after independent genesis");
  json(registryPath, { schemaVersion: 1, transitions: [] });
  const gate = commit("dormant acceptance transitions");
  put(policyPath, policyBytes("0.1"));
  const one = commit("introduce 0.1 policy");
  put(policyPath, policyBytes("0.2"));
  const two = commit("activate 0.2 policy");
  const directory = (version) => join(root, ".artifacts/releases", version);
  const bin = join(root, ".artifacts/bin");
  mkdirSync(bin, { recursive: true });
  const dockerLog = join(root, ".artifacts/docker-calls.jsonl");
  // The only executable named docker on the child PATH implements two exact fixture operations; all others fail.
  put(
    ".artifacts/bin/docker",
    [
      `#!${process.execPath}`,
      'const fs = require("node:fs");',
      "const args = process.argv.slice(2);",
      'fs.appendFileSync(process.env.FIXTURE_DOCKER_LOG, JSON.stringify(args) + "\\n");',
      'if (args.length === 3 && args[0] === "image" && args[1] === "inspect") {',
      '  console.log(JSON.stringify([{ Id: args[2], Os: "linux", Architecture: "amd64" }]));',
      '} else if (args.length === 5 && args[0] === "image" && args[1] === "save" && args[2] === "--output") {',
      '  fs.writeFileSync(args[3], "Exact synthetic archive " + args[4] + "\\n", { flag: "wx" });',
      '} else { console.error("Unexpected fixture Docker command"); process.exitCode = 99; }',
    ].join("\n") + "\n",
  );
  chmodSync(join(bin, "docker"), 0o700);
  const calls = () =>
    existsSync(dockerLog)
      ? readFileSync(dockerLog, "utf8")
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line))
      : [];
  const clearCalls = () => rmSync(dockerLog, { force: true });
  const report = (sourceRevision, baseRevision) => ({
    schemaVersion: 1,
    status: "passed",
    cleanup: "passed",
    targetKind: "local",
    sourceDirty: false,
    trackedDiffSha256: sha256(""),
    sourceRevision,
    suiteCommit: suite,
    suiteTree: genesis.suiteTree,
    manifestSha256: genesis.manifestSha256,
    contractRevision: "r3",
    baselinePublication: "protected-main",
    configurationSha256: "5".repeat(64),
    project: "mp3-e2e-preparation-cli",
    acceptance: { status: "passed", planned: 3, passed: 3, failed: 0, skipped: 0 },
    images,
    ...(sourceRevision === product
      ? {}
      : {
          localSelection: {
            kind: "local-acceptance-resolution",
            sourceRevision,
            baseRevision,
            resolution: {
              genesis,
              required: genesis,
              candidate: null,
              pendingBinding: null,
              admission: sourceRevision === gate ? "bootstrap" : "governance",
              bindingCommit: null,
              activationCommit: null,
              policySha256: sha256(readFileSync(join(root, registryPath))),
            },
          },
        }),
  });
  const run = (input) => {
    json(".artifacts/e2e-result.json", input);
    return spawnSync(process.execPath, ["scripts/prepare-release.mjs"], {
      cwd: root,
      env: { ...env, PATH: `${bin}${delimiter}${env.PATH}`, FIXTURE_DOCKER_LOG: dockerLog },
      encoding: "utf8",
      timeout: 15000,
    });
  };
  return { root, git, put, commit, product, suite, gate, one, two, report, directory, run, calls, clearCalls };
}

function successful(result) {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

/** Expected source configuration comes from literal fixture inputs, not the implementation's configuration helper. */
function expectPrepared(f, result, { source, preparation, version, ordinal, line }) {
  const output = successful(result);
  assert.equal(output.status, "prepared-local");
  assert.equal(output.deployable, false);
  assert.equal(output.version, version);
  assert.equal(output.sourceRevision, source);
  assert.equal(output.preparationRevision, preparation);
  assert.equal(output.directory, `.artifacts/releases/${version}`);
  const saved = JSON.parse(readFileSync(join(f.directory(version), "manifest.json")));
  assert.equal(saved.schemaVersion, line ? 2 : 1);
  assert.equal(saved.version, version);
  assert.equal(saved.ordinal, ordinal);
  assert.equal(saved.sourceRevision, source);
  assert.equal(saved.preparationRevision, preparation);
  if (line)
    assert.deepEqual(saved.identity.releasePolicy, {
      schemaVersion: 1,
      strategy: "global-first-parent-ordinal",
      line,
      sha256: sha256(policyBytes(line)),
    });
  else assert.equal(Object.hasOwn(saved.identity, "releasePolicy"), false);
  const files = configurationPaths.map((path) => ({ path, sha256: sha256(`Original source ${path}\n`) }));
  assert.deepEqual(saved.identity.sourceConfiguration, { sha256: sha256(canonical(files)), files });
  assert.equal(saved.identity.evidence.sourceRevision, source);
  assert.deepEqual(readdirSync(f.directory(version)).sort(), preparedNames);
  return { output, saved };
}

function snapshot(directory) {
  return Object.fromEntries(
    readdirSync(directory)
      .sort()
      .map((name) => [
        name,
        {
          sha256: sha256(readFileSync(join(directory, name))),
          modified: statSync(join(directory, name)).mtimeMs,
        },
      ]),
  );
}

test("actual preparation rejects invalid source policy before Docker and reservation side effects", (t) => {
  for (const invalid of ["malformed", "deleted", "downgraded"]) {
    const f = fixture(t);
    if (invalid === "malformed") f.put(policyPath, '{"schemaVersion":1,');
    else if (invalid === "deleted") rmSync(join(f.root, policyPath));
    else f.put(policyPath, policyBytes("0.1"));
    const source = f.commit(`invalid source policy: ${invalid}`);
    const result = f.run(f.report(source, f.two));
    assert.notEqual(result.status, 0, `${invalid} unexpectedly prepared`);
    assert.match(result.stderr, /policy|release.*line|downgrad|JSON/i);
    assert.deepEqual(f.calls(), [], "Invalid allocation must fail before even inspecting Docker images");
    assert.equal(existsSync(join(f.root, ".artifacts/releases")), false, "No reservation may precede valid allocation");
  }
});

test("actual preparation selects the report source across legacy and newer policy HEADs; mutation control fails", (t) => {
  const f = fixture(t);
  f.put(policyPath, policyBytes("0.10"));
  f.commit("later approved line");
  f.put("compose.yaml", "Different later configuration; must not enter the old report's reservation.\n");
  const preparation = f.commit("later product configuration");
  const cases = [
    { source: f.product, base: f.suite, version: "0.1.3", ordinal: 3, line: null },
    { source: f.one, base: f.gate, version: "0.1.5", ordinal: 5, line: "0.1" },
    { source: f.two, base: f.one, version: "0.2.6", ordinal: 6, line: "0.2" },
  ];
  for (const expected of cases) {
    f.clearCalls();
    const observed = expectPrepared(f, f.run(f.report(expected.source, expected.base)), { ...expected, preparation });
    assert.equal(observed.output.reused, false);
    assert.deepEqual(
      f
        .calls()
        .filter((args) => args[1] === "inspect")
        .map((args) => args[2]),
      [images.api, images.frontend],
    );
    assert.deepEqual(
      f
        .calls()
        .filter((args) => args[1] === "save")
        .map((args) => args[4]),
      [images.api, images.frontend],
    );
  }
  // Mutate only the disposable copied adapter. This deliberately wrong caller must fail the same positive oracle.
  const path = "scripts/prepare-release.mjs";
  const original = readFileSync(join(f.root, path), "utf8");
  const selectedSource = "resolveReleaseAllocation(root, evidence.sourceRevision)";
  assert(original.includes(selectedSource), "Update the explicit fixture mutation if this call-site interface changes");
  f.put(path, original.replace(selectedSource, "resolveReleaseAllocation(root, preparationRevision)"));
  const mutatedPreparation = f.commit("deliberately substitute preparation HEAD in fixture only");
  f.clearCalls();
  const wrong = f.run(f.report(f.two, f.one));
  assert.notEqual(wrong.status, 0, "HEAD substitution must not create a report-source reservation");
  assert.match(wrong.stderr, /source/i);
  assert.throws(() => expectPrepared(f, wrong, { ...cases[2], preparation: mutatedPreparation }));
  assert.deepEqual(f.calls(), [], "The source mismatch must be rejected before Docker");
});

test("actual legacy and schema-2 retries preserve original bytes and never re-export missing reserved archives", (t) => {
  for (const schema of [1, 2]) {
    const f = fixture(t);
    const expected =
      schema === 1
        ? { source: f.product, base: f.suite, version: "0.1.3", ordinal: 3, line: null }
        : { source: f.two, base: f.one, version: "0.2.6", ordinal: 6, line: "0.2" };
    const report = f.report(expected.source, expected.base);
    const first = expectPrepared(f, f.run(report), { ...expected, preparation: f.two });
    assert.equal(first.output.reused, false);
    const directory = f.directory(expected.version);
    const original = snapshot(directory);
    f.put("README.md", "Later reviewed preparation checkout.\n");
    const later = f.commit("later preparation revision");
    f.clearCalls();
    const retry = expectPrepared(f, f.run(report), { ...expected, preparation: f.two });
    assert.equal(retry.output.reused, true);
    assert.equal(retry.output.verifiedByRevision, later);
    assert.deepEqual(
      f.calls().filter((args) => args[1] === "save"),
      [],
    );
    assert.deepEqual(snapshot(directory), original, "Complete retries preserve every byte and modification timestamp");
    rmSync(join(directory, "api.docker.tar"));
    const remaining = snapshot(directory);
    f.clearCalls();
    const incomplete = f.run(report);
    assert.notEqual(incomplete.status, 0);
    assert.deepEqual(
      f.calls().filter((args) => args[1] === "save"),
      [],
      "Reserved content must never be reconstructed",
    );
    assert.equal(existsSync(join(directory, "api.docker.tar")), false);
    assert.deepEqual(snapshot(directory), remaining);
  }
});
