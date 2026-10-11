/**
 * Select the finite backend source checks and unit ownership without weakening historical CI or acceptance admission.
 * The pure checker consumes independently read paths and scripts; the exact-source adapter reads Git objects only.
 * Neither installs tools, changes Git, selects an acceptance suite, accesses credentials or writes release evidence.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { parse } from "yaml";
import { ciToolingShards } from "./ci-visibility-policy.mjs";
import { requireBackendUnitLayout } from "./backend-unit-layout.mjs";

const productMarkers = ["server/src/app.ts", "server/src/contracts/mp3.ts", "server/src/documentation/generate.ts"];
const unitMarkers = [
  "tests/unit/app.test.ts",
  "frontend/tests/frontend-response.test.ts",
  "server/tests/app.test.ts",
  "server/tests/docs-build.test.ts",
  "server/tests/docs.test.ts",
  "server/tests/http.test.ts",
  "server/tests/mp3.test.ts",
];
const prerequisiteTests = [
  "scripts/backend-contract-policy.test.mjs",
  "scripts/ci-unit-inventory.test.mjs",
  "scripts/backend-source-ci.test.mjs",
];
const prerequisiteMarkers = [
  "scripts/backend-source-ci.mjs",
  "scripts/run-backend-source-checks.mjs",
  ...prerequisiteTests,
];
const historicalChecks =
  [
    "npm run format:check",
    "npm run lint:workflows",
    "npm run check:policy",
    "npm run check:portability",
    "aa-exec --profile=chrome npm run check:mermaid",
    "npm run test:gate",
  ].join("\n") + "\n";
const sourceScripts = {
  typecheck:
    "tsc --noEmit -p tsconfig.json && tsc --noEmit -p frontend/tsconfig.json && tsc --noEmit -p tsconfig.tests.json",
  "lint:source": "oxlint --deny-warnings server/src frontend/src tests/unit",
  "build:server": "tsc -p tsconfig.json && node dist/documentation/generate.js && node server/src/build-docs.mjs",
  "check:openapi": "redocly lint --config redocly.yaml dist/openapi.json",
};
const toolingPrefix = "node --experimental-vm-modules --test ";

/** Require ordinary metadata, without invoking custom prototypes or mutating caller inputs. */
function record(value) {
  assert(value !== null && typeof value === "object" && !Array.isArray(value), "Source CI needs records");
  assert([Object.prototype, null].includes(Object.getPrototypeOf(value)), "Source CI needs ordinary records");
  return value;
}

/** Require unique canonical relative paths; traversal, aliases, controls and malformed inventories fail closed. */
function paths(value) {
  assert(Array.isArray(value), "Source CI needs path arrays");
  for (const path of value) {
    assert(typeof path === "string" && path.length > 0 && !/[\x00-\x1f\x7f\\]/.test(path));
    assert(!path.startsWith("/") && path.split("/").every((part) => part && part !== "." && part !== ".."));
  }
  assert.equal(new Set(value).size, value.length, "Source CI paths cannot repeat");
  return value;
}

/**
 * Validate exact source checks, finite test inventories and persistent adoption. Returns a fresh plan; no I/O/mutation.
 * Ancestor inventories must be obtained from verified exact first-parent Git objects, not a caller's adoption flag.
 * Historical/prerequisite sources keep five units; factory adoption persists through descendant source deletions.
 */
export function requireBackendSourceCi(input) {
  record(input);
  assert.deepEqual(Object.keys(input).sort(), [
    "ancestorFiles",
    "linterCommands",
    "packageScripts",
    "sourceFiles",
    "toolingFiles",
  ]);
  const sourceFiles = paths(input.sourceFiles);
  assert(Array.isArray(input.ancestorFiles), "Source CI needs explicit ancestor inventories");
  const ancestors = input.ancestorFiles.map(paths);
  const scripts = record(input.packageScripts);
  assert(
    Object.values(scripts).every((value) => typeof value === "string"),
    "Package scripts must be commands",
  );
  const historyHas = (markers) =>
    [sourceFiles, ...ancestors].some((files) => markers.some((path) => files.includes(path)));
  const ownership = requireBackendUnitLayout({ sourceFiles, ancestorFiles: ancestors });
  const adopted =
    ownership.layout !== "historical" ||
    historyHas(productMarkers) ||
    Object.hasOwn(scripts, "lint:source") ||
    Object.hasOwn(scripts, "check:openapi") ||
    scripts["build:server"]?.includes("dist/documentation/generate.js");
  const prerequisite = adopted || historyHas(prerequisiteMarkers);
  if (prerequisite) {
    for (const file of prerequisiteMarkers)
      assert(sourceFiles.includes(file), `Missing source CI prerequisite: ${file}`);
  }
  const expectedTooling = [...Object.values(ciToolingShards).flat(), ...(prerequisite ? prerequisiteTests : [])];
  const toolingFiles = paths(input.toolingFiles);
  assert.deepEqual([...toolingFiles].sort(), expectedTooling.sort(), "Source CI tooling coverage differs");
  assert(typeof scripts["test:tooling"] === "string" && scripts["test:tooling"].startsWith(toolingPrefix));
  assert.deepEqual(scripts["test:tooling"].slice(toolingPrefix.length).split(" ").sort(), [...toolingFiles].sort());
  assert.equal(
    input.linterCommands,
    historicalChecks + (prerequisite ? "node scripts/run-backend-source-checks.mjs\n" : ""),
  );
  if (adopted) {
    if (ownership.layout === "localized")
      assert(sourceFiles.includes("scripts/backend-unit-layout.mjs"), "Missing localized unit helper");
    for (const file of [...productMarkers, "tsconfig.tests.json", "redocly.yaml"])
      assert(sourceFiles.includes(file), `Missing adopted backend source: ${file}`);
    for (const [name, command] of Object.entries(sourceScripts))
      assert.equal(
        scripts[name],
        name === "lint:source" && ownership.layout === "localized"
          ? "oxlint --deny-warnings server/src server/tests frontend/src frontend/tests"
          : command,
        `Invalid ${name}`,
      );
  }
  const selected = ownership.unitFiles;
  return {
    adopted: Boolean(adopted),
    unitFiles: structuredClone(selected),
    sourceChecks: adopted
      ? ["typecheck", "lint:source", "build:server", "check:openapi"].map((name) => ["npm", ["run", name]])
      : [],
  };
}

/**
 * Read current and relevant ancestral inventories from explicit commit objects with bounded Git commands.
 * Returns the pure checker's input, not acceptance authority. The source and base must exist on one first-parent chain.
 * No working files, moving refs, installations, tool execution, network or mutations are consulted here.
 */
export function readBackendSourceCi(root, sourceRevision, baseRevision) {
  assert(typeof root === "string" && root.length > 0);
  const git = (...args) =>
    execFileSync("git", ["--no-replace-objects", ...args], {
      cwd: root,
      encoding: "utf8",
      timeout: 30_000,
      maxBuffer: 8 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  for (const revision of [sourceRevision, baseRevision]) {
    assert(/^[a-f0-9]{40}$/.test(revision ?? "") && !/^0+$/.test(revision), "Require exact source/base commits");
    assert.equal(git("cat-file", "-t", revision).trim(), "commit");
  }
  assert(
    git("rev-list", "--first-parent", sourceRevision).trim().split("\n").includes(baseRevision),
    "Base must be first-parent ancestry",
  );
  const filesAt = (revision) => git("ls-tree", "-r", "--name-only", "-z", revision).split("\0").filter(Boolean);
  const read = (revision, path) => {
    const entry = git("ls-tree", revision, "--", path);
    assert(/^(100644|100755) blob [a-f0-9]{40}\t/.test(entry), `Require regular committed ${path}`);
    return git("show", `${revision}:${path}`);
  };
  const relevant = git(
    "log",
    "--first-parent",
    "--format=%H",
    sourceRevision,
    "--",
    ...productMarkers,
    ...unitMarkers,
    "scripts/backend-unit-layout.mjs",
    ...prerequisiteMarkers,
  )
    .trim()
    .split("\n")
    .filter(Boolean);
  const sourceFiles = filesAt(sourceRevision);
  const ancestorFiles = relevant
    .filter((revision) => revision !== sourceRevision)
    .map((revision) => {
      const files = filesAt(revision);
      for (const marker of [
        ...productMarkers,
        ...unitMarkers,
        "scripts/backend-unit-layout.mjs",
        ...prerequisiteMarkers,
      ])
        if (files.includes(marker)) read(revision, marker);
      return files;
    });
  const packageScripts = JSON.parse(read(sourceRevision, "package.json")).scripts;
  const workflow = parse(read(sourceRevision, ".github/workflows/linter.yml"));
  const linterCommands = workflow.jobs?.checks?.steps?.at(-1)?.run;
  const command = packageScripts?.["test:tooling"];
  assert(typeof command === "string" && command.startsWith(toolingPrefix), "Require source-bound tooling command");
  const toolingFiles = command.slice(toolingPrefix.length).split(" ");
  const input = { sourceFiles, ancestorFiles, packageScripts, linterCommands, toolingFiles };
  const selection = requireBackendSourceCi(input);
  for (const path of [
    ...Object.values(selection.unitFiles).flat(),
    ...toolingFiles,
    ...(selection.adopted ? [...productMarkers, "tsconfig.tests.json", "redocly.yaml"] : []),
    ...prerequisiteMarkers.filter((path) => sourceFiles.includes(path)),
    ...["scripts/backend-unit-layout.mjs"].filter((path) => sourceFiles.includes(path)),
  ])
    read(sourceRevision, path);
  return input;
}
