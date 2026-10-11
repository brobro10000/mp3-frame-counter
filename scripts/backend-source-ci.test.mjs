/**
 * Independent expectations for bounded backend source checks in the existing split CI family.
 * Run `node --test scripts/backend-source-ci.test.mjs` with pinned Node. Synthetic tracked-path/ancestor inventories
 * model exact-source decisions without creating Git history, reading product code, executing application tools or
 * changing workflows. Real package/workflow declarations are read only by the final wiring controls. Missing exports
 * fail before every rejection assertion; callbacks observe command execution and failure propagation without tools.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { parse } from "yaml";

const policyUrl = new URL("./backend-source-ci.mjs", import.meta.url);
const runnerUrl = new URL("./run-backend-source-checks.mjs", import.meta.url);
const policy = existsSync(policyUrl) ? await import(policyUrl.href) : {};
const runner = existsSync(runnerUrl) ? await import(runnerUrl.href) : {};
const prefix = "node --experimental-vm-modules --test ";
const prerequisiteTests = [
  "scripts/backend-contract-policy.test.mjs",
  "scripts/ci-unit-inventory.test.mjs",
  "scripts/backend-source-ci.test.mjs",
];
const historicalTooling = [
  "scripts/github-context.test.mjs",
  "scripts/portability.test.mjs",
  "scripts/phase-policy.test.mjs",
  "scripts/e2e-controller.test.mjs",
  "scripts/mermaid.test.mjs",
  "scripts/runtime-dependency-policy.test.mjs",
  "scripts/docs-tool-policy.test.mjs",
  "scripts/frontend-tool-policy.test.mjs",
  "scripts/acceptance-baseline.test.mjs",
  "scripts/acceptance-admission.test.mjs",
  "scripts/acceptance-bootstrap.test.mjs",
  "scripts/acceptance-preflight.test.mjs",
  "scripts/acceptance-publication.test.mjs",
  "scripts/acceptance-review-http.test.mjs",
  "scripts/acceptance-runtime.test.mjs",
  "scripts/acceptance-transitions.test.mjs",
  "scripts/acceptance-preparation.test.mjs",
  "scripts/acceptance-consumers.test.mjs",
  "scripts/acceptance-browser-setup.test.mjs",
  "scripts/acceptance-profiles.test.mjs",
  "scripts/acceptance-profile-source.test.mjs",
  "scripts/release-preparation.test.mjs",
  "scripts/publish-release.test.mjs",
  "scripts/publish-release-finalization.test.mjs",
  "scripts/release-allocation.test.mjs",
  "scripts/release-allocation-publication.test.mjs",
  "scripts/release-allocation-preparation-cli.test.mjs",
  "scripts/publisher-handoff.test.mjs",
  "scripts/same-run-handoff.test.mjs",
  "scripts/publish-release-evidence.test.mjs",
  "infra/cloud/bootstrap/cap-reconciler.test.mjs",
  "scripts/hosted-evidence.test.mjs",
  "scripts/cloud-access-foundation.test.mjs",
  "scripts/cloud-bootstrap-iam.test.mjs",
  "scripts/cloud-runtime.test.mjs",
  "scripts/stage-delivery-policy.test.mjs",
  "scripts/stage-delivery-policy-regression.test.mjs",
  "scripts/stage-revision.test.mjs",
  "scripts/hosted-health-consumers.test.mjs",
  "scripts/stage-acceptance.test.mjs",
  "scripts/stage-config-log-policy.test.mjs",
  "scripts/stage-command-failure.test.mjs",
  "scripts/production-acceptance.test.mjs",
  "scripts/stage-command-failure-json.test.mjs",
  "scripts/stage-private-diagnostic.test.mjs",
  "scripts/stage-private-diagnostic-controller.test.mjs",
];
const historicalUnits = {
  application: ["tests/unit/frontend-response.test.ts"],
  server: [
    "tests/unit/docs-build.test.ts",
    "tests/unit/docs.test.ts",
    "tests/unit/http.test.ts",
    "tests/unit/mp3.test.ts",
  ],
};
const adoptedUnits = {
  application: [...historicalUnits.application],
  server: ["tests/unit/app.test.ts", ...historicalUnits.server],
};
const historicalChecks =
  [
    "npm run format:check",
    "npm run lint:workflows",
    "npm run check:policy",
    "npm run check:portability",
    "aa-exec --profile=chrome npm run check:mermaid",
    "npm run test:gate",
  ].join("\n") + "\n";
const extendedChecks = historicalChecks + "node scripts/run-backend-source-checks.mjs\n";
const sourceChecks = [
  ["npm", ["run", "typecheck"]],
  ["npm", ["run", "lint:source"]],
  ["npm", ["run", "build:server"]],
  ["npm", ["run", "check:openapi"]],
];
const historicalScripts = {
  typecheck: "tsc --noEmit -p tsconfig.json && tsc --noEmit -p frontend/tsconfig.json",
  "build:server": "tsc -p tsconfig.json && node server/src/build-docs.mjs",
  "test:gate": "node --test scripts/ci-gate.test.mjs scripts/ci-visibility-policy.test.mjs",
};
const adoptedScripts = {
  typecheck:
    "tsc --noEmit -p tsconfig.json && tsc --noEmit -p frontend/tsconfig.json && tsc --noEmit -p tsconfig.tests.json",
  "lint:source": "oxlint --deny-warnings server/src frontend/src tests/unit",
  "build:server": "tsc -p tsconfig.json && node dist/documentation/generate.js && node server/src/build-docs.mjs",
  "check:openapi": "redocly lint --config redocly.yaml dist/openapi.json",
  "test:gate": historicalScripts["test:gate"],
};
const productMarkers = [
  "server/src/app.ts",
  "tests/unit/app.test.ts",
  "server/src/contracts/mp3.ts",
  "server/src/documentation/generate.ts",
];
const prerequisiteMarkers = [
  "scripts/backend-source-ci.mjs",
  "scripts/run-backend-source-checks.mjs",
  ...prerequisiteTests,
];

/** Missing implementations are explicit availability failures, never passing rejection controls. */
function api(name = "requireBackendSourceCi") {
  assert.equal(typeof policy[name], "function", `Missing BACKEND-SOURCE-CI API ${name}`);
  return policy[name];
}

/** Require the actual runner's exported execution seam before observing dormant or failing command sequences. */
function executionApi() {
  assert.equal(typeof runner.runBackendSourceChecks, "function", "Missing BACKEND-SOURCE-CI execution API");
  return runner.runBackendSourceChecks;
}

/** Return complete independently selected metadata; no expected value comes from a product parser or CI helper. */
function input(kind = "adopted") {
  const adopted = kind === "adopted";
  const prerequisite = kind !== "historical";
  const toolingFiles = [...historicalTooling, ...(prerequisite ? prerequisiteTests : [])];
  const files = [
    "package.json",
    "tsconfig.json",
    "frontend/tsconfig.json",
    "server/src/http.ts",
    "scripts/run-ci-lane.mjs",
    ...Object.values(adopted ? adoptedUnits : historicalUnits).flat(),
    ...toolingFiles,
    ...(prerequisite ? prerequisiteMarkers.filter((file) => !toolingFiles.includes(file)) : []),
    ...(adopted ? productMarkers.filter((file) => file !== "tests/unit/app.test.ts") : []),
    ...(adopted ? ["tsconfig.tests.json", "redocly.yaml"] : []),
  ];
  return {
    sourceFiles: files,
    ancestorFiles: [],
    packageScripts: {
      ...(adopted ? adoptedScripts : historicalScripts),
      "test:tooling": prefix + toolingFiles.join(" "),
    },
    linterCommands: prerequisite ? extendedChecks : historicalChecks,
    toolingFiles,
  };
}

/** Mutable invalid inputs are snapshotted so mutation followed by a throw cannot satisfy a negative decision. */
function rejected(rows, kind = "adopted") {
  const check = api();
  assert.equal(check(input(kind)).adopted, kind === "adopted", "Valid control must pass before mutations");
  for (const [name, mutate] of rows) {
    const value = input(kind);
    mutate(value);
    const before = structuredClone(value);
    assert.throws(() => check(value), undefined, name);
    assert.deepEqual(value, before, `${name}: invalid input mutated`);
  }
}

/** Freeze valid nested inputs while retaining mutable invalid controls for independent mutation sensitivity. */
function freeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

test("new policy, exact-source reader and execution APIs exist before rejection tests", () => {
  api();
  api("readBackendSourceCi");
  executionApi();
});

test("historical split source retains exactly five units and its original 46 tooling paths", () => {
  const value = input("historical");
  const before = structuredClone(value);
  assert.deepEqual(api()(freeze(value)), { adopted: false, unitFiles: historicalUnits, sourceChecks: [] });
  assert.deepEqual(value, before);
});

test("prerequisite-only source runs the extended tooling union but keeps five product units", () => {
  const value = input("prerequisite");
  assert.deepEqual(api()(freeze(value)), { adopted: false, unitFiles: historicalUnits, sourceChecks: [] });
});

test("adopted source assigns all six units and four real source checks without mutating frozen input", () => {
  const value = input();
  const before = structuredClone(value);
  assert.deepEqual(api()(freeze(value)), { adopted: true, unitFiles: adoptedUnits, sourceChecks });
  assert.deepEqual(value, before);
});

test("tracked path ordering does not affect ownership or activation", () => {
  const value = input();
  value.sourceFiles.reverse();
  value.toolingFiles.reverse();
  value.packageScripts["test:tooling"] = prefix + value.toolingFiles.join(" ");
  assert.deepEqual(api()(value), { adopted: true, unitFiles: adoptedUnits, sourceChecks });
});

test("each factory, test, generation and contract marker independently refuses a five-file fallback", () => {
  const check = api();
  assert.equal(check(input("prerequisite")).adopted, false);
  for (const marker of productMarkers) {
    const value = input("prerequisite");
    value.sourceFiles.push(marker);
    const before = structuredClone(value);
    assert.throws(() => check(value), undefined, marker);
    assert.deepEqual(value, before);
  }
});

test("new source scripts cannot be used to hide adoption when factory paths are absent", () => {
  const check = api();
  assert.equal(check(input("prerequisite")).adopted, false);
  for (const name of ["lint:source", "check:openapi", "build:server"]) {
    const value = input("prerequisite");
    value.packageScripts[name] = adoptedScripts[name];
    assert.throws(() => check(value), undefined, name);
  }
});

test("verified ancestry preserves adoption after both factory and factory test are deleted", () => {
  const check = api();
  assert.equal(check(input("prerequisite")).adopted, false);
  for (const marker of productMarkers) {
    const value = input("prerequisite");
    value.ancestorFiles = [["README.md"], [marker], ["scripts/backend-source-ci.mjs"]];
    const before = structuredClone(value);
    assert.throws(() => check(value), undefined, `historical ${marker} cannot be deleted into legacy behavior`);
    assert.deepEqual(value, before);
  }
});

test("prerequisite ancestors alone do not invent product adoption", () => {
  const value = input("prerequisite");
  value.ancestorFiles = [[...prerequisiteMarkers], ["README.md", "server/src/http.ts"]];
  assert.deepEqual(api()(value), { adopted: false, unitFiles: historicalUnits, sourceChecks: [] });
});

test("adopted descendants retain the exact six-file ownership map", () => {
  const value = input();
  value.ancestorFiles = [[...productMarkers], [...prerequisiteMarkers]];
  assert.deepEqual(api()(value), { adopted: true, unitFiles: adoptedUnits, sourceChecks });
});

test("missing duplicated extra or differently spelled unit paths fail without changing inventories", () => {
  rejected([
    ["factory test removed", (x) => x.sourceFiles.splice(x.sourceFiles.indexOf("tests/unit/app.test.ts"), 1)],
    ["prior backend test removed", (x) => x.sourceFiles.splice(x.sourceFiles.indexOf("tests/unit/http.test.ts"), 1)],
    [
      "browser test removed",
      (x) => x.sourceFiles.splice(x.sourceFiles.indexOf("tests/unit/frontend-response.test.ts"), 1),
    ],
    ["unit duplicated", (x) => x.sourceFiles.push("tests/unit/app.test.ts")],
    ["unknown extra unit", (x) => x.sourceFiles.push("tests/unit/alternate.test.ts")],
    [
      "wrong extension",
      (x) => (x.sourceFiles[x.sourceFiles.indexOf("tests/unit/app.test.ts")] = "tests/unit/app.test.js"),
    ],
    [
      "normalized alias",
      (x) => (x.sourceFiles[x.sourceFiles.indexOf("tests/unit/app.test.ts")] = "tests/unit/../unit/app.test.ts"),
    ],
  ]);
});

test("real source typechecks lint generation and OpenAPI semantics cannot become placeholders", () => {
  rejected([
    ["test TypeScript omitted", (x) => (x.packageScripts.typecheck = historicalScripts.typecheck)],
    ["browser TypeScript omitted", (x) => (x.packageScripts.typecheck = "tsc --noEmit -p tsconfig.json")],
    ["backend TypeScript omitted", (x) => (x.packageScripts.typecheck = "tsc --noEmit -p frontend/tsconfig.json")],
    ["emitting compile substituted", (x) => (x.packageScripts.typecheck = "tsc -p tsconfig.json")],
    ["test TypeScript config absent", (x) => x.sourceFiles.splice(x.sourceFiles.indexOf("tsconfig.tests.json"), 1)],
    ["formatter substituted for lint", (x) => (x.packageScripts["lint:source"] = "prettier --check server/src")],
    [
      "warning failures disabled",
      (x) => (x.packageScripts["lint:source"] = "oxlint server/src frontend/src tests/unit"),
    ],
    [
      "test source omitted from lint",
      (x) => (x.packageScripts["lint:source"] = "oxlint --deny-warnings server/src frontend/src"),
    ],
    ["lint error swallowed", (x) => (x.packageScripts["lint:source"] += " || true")],
    ["generated spec omitted", (x) => (x.packageScripts["build:server"] = historicalScripts["build:server"])],
    ["semantic lint replaced with parse", (x) => (x.packageScripts["check:openapi"] = "node scripts/check-refs.mjs")],
    ["semantic error swallowed", (x) => (x.packageScripts["check:openapi"] += " || true")],
    ["validator config absent", (x) => x.sourceFiles.splice(x.sourceFiles.indexOf("redocly.yaml"), 1)],
  ]);
});

test("Linter preserves prior checks and runs one unsuppressed source-check command", () => {
  rejected([
    ["source command omitted", (x) => (x.linterCommands = historicalChecks)],
    [
      "source command swallowed",
      (x) => (x.linterCommands = extendedChecks.replace("checks.mjs\n", "checks.mjs || true\n")),
    ],
    ["source command duplicated", (x) => (x.linterCommands += "node scripts/run-backend-source-checks.mjs\n")],
    ["prior gate omitted", (x) => (x.linterCommands = extendedChecks.replace("npm run test:gate\n", ""))],
    [
      "source command receives a skip flag",
      (x) => (x.linterCommands = extendedChecks.replace("checks.mjs\n", "checks.mjs --skip\n")),
    ],
  ]);
});

test("all three new prerequisite tests execute exactly once beside every historical tooling test", () => {
  const rows = prerequisiteTests.map((file) => [
    `missing ${file}`,
    (x) => {
      x.toolingFiles = x.toolingFiles.filter((entry) => entry !== file);
      x.packageScripts["test:tooling"] = prefix + x.toolingFiles.join(" ");
    },
  ]);
  rejected([
    ...rows,
    [
      "new test duplicated",
      (x) => {
        x.toolingFiles.push(prerequisiteTests[2]);
        x.packageScripts["test:tooling"] = prefix + x.toolingFiles.join(" ");
      },
    ],
    [
      "old test removed",
      (x) => {
        x.toolingFiles.shift();
        x.packageScripts["test:tooling"] = prefix + x.toolingFiles.join(" ");
      },
    ],
    [
      "unknown tooling test added",
      (x) => {
        x.toolingFiles.push("scripts/alternative.test.mjs");
        x.packageScripts["test:tooling"] = prefix + x.toolingFiles.join(" ");
      },
    ],
    ["package lies about inventory", (x) => (x.packageScripts["test:tooling"] = prefix + historicalTooling.join(" "))],
    ["native tests replaced with no-op", (x) => (x.packageScripts["test:tooling"] = "node -e 'process.exit(0)'")],
  ]);
});

test("deleting prerequisite markers cannot select the historical tooling union after introduction", () => {
  const check = api();
  assert.equal(check(input("historical")).adopted, false);
  const value = input("historical");
  value.ancestorFiles = [[...prerequisiteMarkers]];
  assert.throws(() => check(value));
});

test("malformed inventories and caller-selected adoption flags cannot create historical fallback", () => {
  rejected([
    ["missing ancestry", (x) => delete x.ancestorFiles],
    ["ancestry boolean", (x) => (x.ancestorFiles = false)],
    ["ancestor list is not a path list", (x) => (x.ancestorFiles = ["server/src/app.ts"])],
    ["nonstring ancestor path", (x) => (x.ancestorFiles = [[1]])],
    ["duplicate ancestor path", (x) => (x.ancestorFiles = [["server/src/app.ts", "server/src/app.ts"]])],
    ["moving-reference surrogate", (x) => (x.ancestorFiles = [{ source: "HEAD" }])],
    ["malformed source list", (x) => (x.sourceFiles = {})],
    ["caller says not adopted", (x) => (x.adopted = false)],
    ["caller selects legacy units", (x) => (x.unitFiles = historicalUnits)],
    ["absolute path", (x) => x.sourceFiles.push("/server/src/app.ts")],
    ["parent traversal", (x) => x.sourceFiles.push("server/../server/src/app.ts")],
  ]);
});

test("the actual exported source runner invokes all four validated commands sequentially", () => {
  api();
  const calls = [];
  assert.equal(
    executionApi()(input(), (command, args) => {
      calls.push([command, [...args]]);
    }),
    undefined,
  );
  assert.deepEqual(calls, sourceChecks);
});

test("source execution is dormant for historical and prerequisite-only application trees", () => {
  api();
  for (const kind of ["historical", "prerequisite"]) {
    const calls = [];
    assert.equal(
      executionApi()(input(kind), (command, args) => {
        calls.push([command, args]);
      }),
      undefined,
    );
    assert.deepEqual(calls, []);
  }
});

test("source execution stops and propagates each tool failure before later commands", () => {
  api();
  const execute = executionApi();
  for (let failure = 0; failure < sourceChecks.length; failure += 1) {
    const calls = [];
    const expected = new Error(`Controlled tool failure ${failure}`);
    assert.throws(
      () =>
        execute(input(), (command, args) => {
          calls.push([command, [...args]]);
          if (calls.length - 1 === failure) throw expected;
        }),
      (error) => error === expected,
    );
    assert.deepEqual(calls, sourceChecks.slice(0, failure + 1));
  }
});

test("invalid source metadata cannot run a tool before policy validation", () => {
  api();
  const execute = executionApi();
  const value = input();
  value.packageScripts["lint:source"] = "node -e 'process.exit(0)'";
  const calls = [];
  assert.throws(() =>
    execute(value, (command, args) => {
      calls.push([command, args]);
    }),
  );
  assert.deepEqual(calls, []);
});

test("actual root tooling declaration includes the new prerequisite tests exactly once", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.ok(pkg.scripts["test:tooling"].startsWith(prefix));
  const files = pkg.scripts["test:tooling"].slice(prefix.length).split(" ");
  assert.deepEqual([...files].sort(), [...historicalTooling, ...prerequisiteTests].sort());
});

test("actual Linter runs the source checker after install while existing separate lanes remain", () => {
  const linter = parse(readFileSync(new URL("../.github/workflows/linter.yml", import.meta.url), "utf8"));
  const checks = linter.jobs.checks;
  assert.deepEqual(Object.keys(linter.jobs).sort(), ["checks", "tooling"]);
  assert.deepEqual(checks.steps[3], { run: "npm ci" });
  assert.deepEqual(checks.steps.at(-1), { run: extendedChecks });
  for (const [file, name, lane] of [
    ["server-tests.yml", "server", "server"],
    ["application-tests.yml", "application", "application"],
  ]) {
    const workflow = parse(readFileSync(new URL(`../.github/workflows/${file}`, import.meta.url), "utf8"));
    assert.deepEqual(Object.keys(workflow.jobs), [name]);
    assert.equal(workflow.jobs[name].steps.at(-1).run, `node scripts/run-ci-lane.mjs ${lane}`);
  }
});

/**
 * Append-only owner amendment: localize backend/frontend units without changing the preceding 22 expectations.
 * The original 19,833-byte prefix retains SHA-256 636bae7c8126aa6e5d0f9fd7043db180379779e12fe90cc7c27ec0ba956523fd.
 * Synthetic path histories are inventories only, never fabricated Git objects or acceptance activation authority.
 */
const localizedPolicyUrl = new URL("./backend-unit-layout.mjs", import.meta.url);
const localizedSubject = existsSync(localizedPolicyUrl) ? await import(localizedPolicyUrl.href) : {};
const unitLaneSubject = await import(new URL("./run-ci-lane.mjs", import.meta.url).href);
const localizedUnits = {
  application: ["frontend/tests/frontend-response.test.ts"],
  server: [
    "server/tests/app.test.ts",
    "server/tests/docs-build.test.ts",
    "server/tests/docs.test.ts",
    "server/tests/http.test.ts",
    "server/tests/mp3.test.ts",
  ],
};
const localizedLint = "oxlint --deny-warnings server/src server/tests frontend/src frontend/tests";
const syntheticUnitRoot = "/synthetic/mp3-unit-locality";

/** API absence is a setup failure before every negative decision and execution observation. */
function unitLayoutApi() {
  assert.equal(typeof localizedSubject.requireBackendUnitLayout, "function", "Missing BACKEND-UNIT-PATHS pure API");
  return localizedSubject.requireBackendUnitLayout;
}

/** The real lane must export its bounded command seam; no substitute executor supplies a product expectation. */
function unitLaneApi() {
  unitLayoutApi();
  assert.equal(typeof unitLaneSubject.runCiUnitLane, "function", "Missing BACKEND-UNIT-PATHS lane execution API");
  return unitLaneSubject.runCiUnitLane;
}

/** Supply independently named unit paths plus ordinary source/acceptance paths, without reading application files. */
function unitLayoutInput(layout = "localized") {
  const selected = layout === "localized" ? localizedUnits : layout === "adopted" ? adoptedUnits : historicalUnits;
  return {
    sourceFiles: [
      "package.json",
      "server/src/http.ts",
      "frontend/src/App.tsx",
      "tests/acceptance/check.mjs",
      "tests/acceptance/fixtures/manifest.json",
      ...Object.values(selected).flat(),
      ...(layout === "historical" ? [] : ["server/src/app.ts"]),
    ],
    ancestorFiles: [],
  };
}

/** Validate the positive control first and ensure every rejected amendment leaves caller inventories unchanged. */
function rejectedUnitLayouts(rows, layout = "localized") {
  const check = unitLayoutApi();
  assert.equal(check(unitLayoutInput(layout)).layout, layout);
  for (const [name, mutate] of rows) {
    const value = unitLayoutInput(layout);
    mutate(value);
    const before = structuredClone(value);
    assert.throws(() => check(value), undefined, name);
    assert.deepEqual(value, before, `${name}: inventory changed during rejection`);
  }
}

/** Closed native commands build from the existing root package, then execute units from their application's cwd. */
function expectedUnitCalls(layout, lane) {
  const selected = layout === "localized" ? localizedUnits : layout === "adopted" ? adoptedUnits : historicalUnits;
  const directory = lane === "server" ? "server" : "frontend";
  const relative =
    lane === "server"
      ? [
          "tests/app.test.ts",
          "tests/docs-build.test.ts",
          "tests/docs.test.ts",
          "tests/http.test.ts",
          "tests/mp3.test.ts",
        ]
      : ["tests/frontend-response.test.ts"];
  return [
    ["npm", ["run", `build:${directory}`], { cwd: syntheticUnitRoot }],
    [
      process.execPath,
      ["--test", ...(layout === "localized" ? relative : selected[lane])],
      { cwd: layout === "localized" ? `${syntheticUnitRoot}/${directory}` : syntheticUnitRoot },
    ],
  ];
}

test("unit locality amendment APIs exist before rejection or command controls", () => {
  unitLayoutApi();
  unitLaneApi();
});

test("unit locality retains historical five and adopted six old-path ownership before migration", () => {
  const check = unitLayoutApi();
  for (const [layout, expectedUnits] of [
    ["historical", historicalUnits],
    ["adopted", adoptedUnits],
  ]) {
    const value = unitLayoutInput(layout);
    const before = structuredClone(value);
    assert.deepEqual(check(freeze(value)), { layout, unitFiles: expectedUnits });
    assert.deepEqual(value, before);
  }
});

test("unit locality assigns exactly five backend files and one frontend file to application directories", () => {
  const value = unitLayoutInput();
  const before = structuredClone(value);
  assert.deepEqual(unitLayoutApi()(freeze(value)), { layout: "localized", unitFiles: localizedUnits });
  assert.deepEqual(value, before);
});

test("unit locality ordering and nonunit acceptance inventories do not change ownership", () => {
  const value = unitLayoutInput();
  value.sourceFiles.reverse();
  value.sourceFiles.push("tests/acceptance/behavior.test.ts");
  assert.deepEqual(unitLayoutApi()(value), { layout: "localized", unitFiles: localizedUnits });
});

test("locality helper preparation remains dormant before any localized unit path exists", () => {
  const check = unitLayoutApi();
  for (const [layout, expectedUnits] of [
    ["historical", historicalUnits],
    ["adopted", adoptedUnits],
  ]) {
    const value = unitLayoutInput(layout);
    value.sourceFiles.push("scripts/backend-unit-layout.mjs");
    value.ancestorFiles = [["scripts/backend-unit-layout.mjs"]];
    assert.deepEqual(check(value), { layout, unitFiles: expectedUnits });
  }
});

test("each localized path is a migration marker that refuses a partial mixed old layout", () => {
  const check = unitLayoutApi();
  assert.equal(check(unitLayoutInput("adopted")).layout, "adopted");
  const old = Object.values(adoptedUnits).flat();
  const local = Object.values(localizedUnits).flat();
  for (let i = 0; i < local.length; i += 1) {
    const value = unitLayoutInput("adopted");
    value.sourceFiles[value.sourceFiles.indexOf(old[i])] = local[i];
    const before = structuredClone(value);
    assert.throws(() => check(value), undefined, local[i]);
    assert.deepEqual(value, before);
  }
});

test("localized ancestor paths retain migration after all localized units are removed", () => {
  rejectedUnitLayouts([
    [
      "all migrated files deleted",
      (value) => {
        value.ancestorFiles = [unitLayoutInput().sourceFiles];
        value.sourceFiles = value.sourceFiles.filter((path) => !Object.values(localizedUnits).flat().includes(path));
      },
    ],
  ]);
});

test("localized ancestor markers forbid both old-five and old-six descendant downgrades", () => {
  const check = unitLayoutApi();
  for (const layout of ["historical", "adopted"]) {
    assert.equal(check(unitLayoutInput(layout)).layout, layout);
    for (const marker of Object.values(localizedUnits).flat()) {
      const value = unitLayoutInput(layout);
      value.ancestorFiles = [[marker]];
      const before = structuredClone(value);
      assert.throws(() => check(value), undefined, `${layout}: ${marker}`);
      assert.deepEqual(value, before);
    }
  }
});

test("pre-migration factory ancestry preserves old-six obligation without inventing locality", () => {
  const check = unitLayoutApi();
  const value = unitLayoutInput("adopted");
  value.sourceFiles = value.sourceFiles.filter((path) => path !== "server/src/app.ts");
  value.ancestorFiles = [["server/src/app.ts"]];
  assert.deepEqual(check(value), { layout: "adopted", unitFiles: adoptedUnits });
  value.sourceFiles = value.sourceFiles.filter((path) => path !== "tests/unit/app.test.ts");
  assert.throws(() => check(value));
});

test("localized missing duplicate extra and old-root unit files fail closed without normalization", () => {
  const all = Object.values(localizedUnits).flat();
  rejectedUnitLayouts([
    ...all.map((file) => [
      `missing ${file}`,
      (value) => {
        value.sourceFiles = value.sourceFiles.filter((path) => path !== file);
      },
    ]),
    ["duplicate migrated unit", (value) => value.sourceFiles.push(all[0])],
    ["extra backend unit", (value) => value.sourceFiles.push("server/tests/extra.test.ts")],
    ["extra browser unit", (value) => value.sourceFiles.push("frontend/tests/extra.test.ts")],
    ["retained old frontend path", (value) => value.sourceFiles.push(historicalUnits.application[0])],
    ["retained old backend path", (value) => value.sourceFiles.push(historicalUnits.server[0])],
    ["nested backend unit", (value) => value.sourceFiles.push("server/tests/nested/extra.spec.ts")],
    ["alternate backend extension", (value) => value.sourceFiles.push("server/tests/extra.test.js")],
  ]);
});

test("locality metadata is closed and rejects malformed traversal aliases and caller layout selectors", () => {
  rejectedUnitLayouts([
    ["missing ancestry", (value) => delete value.ancestorFiles],
    ["boolean ancestry", (value) => (value.ancestorFiles = false)],
    ["ancestor is not a path list", (value) => (value.ancestorFiles = ["server/tests/app.test.ts"])],
    ["malformed ancestor path", (value) => (value.ancestorFiles = [[1]])],
    [
      "duplicate ancestor path",
      (value) => (value.ancestorFiles = [["server/tests/app.test.ts", "server/tests/app.test.ts"]]),
    ],
    ["absolute path", (value) => value.sourceFiles.push("/server/tests/app.test.ts")],
    ["traversal alias", (value) => value.sourceFiles.push("server/tests/../tests/app.test.ts")],
    ["Windows alias", (value) => value.sourceFiles.push("server\\tests\\app.test.ts")],
    ["caller chooses layout", (value) => (value.layout = "historical")],
    ["caller chooses ownership", (value) => (value.unitFiles = historicalUnits)],
  ]);
});

test("unit locality returns fresh maps without retaining caller arrays or a prior returned map", () => {
  const check = unitLayoutApi();
  const value = unitLayoutInput();
  const before = structuredClone(value);
  const first = check(value);
  const second = check(value);
  assert.notEqual(first.unitFiles, second.unitFiles);
  assert.notEqual(first.unitFiles.server, second.unitFiles.server);
  assert.deepEqual(second, { layout: "localized", unitFiles: localizedUnits });
  assert.deepEqual(value, before);
});

test("actual exported lane builds at root then runs localized units from each application cwd", () => {
  const execute = unitLaneApi();
  for (const lane of ["application", "server"]) {
    const calls = [];
    assert.equal(
      execute(syntheticUnitRoot, lane, unitLayoutInput(), (command, args, options) => {
        calls.push([command, [...args], { ...options }]);
      }),
      undefined,
    );
    assert.deepEqual(calls, expectedUnitCalls("localized", lane));
  }
});

test("actual exported lane retains old-five and old-six root-relative replay commands", () => {
  const execute = unitLaneApi();
  for (const layout of ["historical", "adopted"]) {
    for (const lane of ["application", "server"]) {
      const calls = [];
      execute(syntheticUnitRoot, lane, unitLayoutInput(layout), (command, args, options) => {
        calls.push([command, [...args], { ...options }]);
      });
      assert.deepEqual(calls, expectedUnitCalls(layout, lane));
    }
  }
});

test("unit lane build and native-test failures propagate and prevent every later command", () => {
  const execute = unitLaneApi();
  for (const lane of ["application", "server"]) {
    for (const failure of [0, 1]) {
      const calls = [];
      const expectedError = new Error(`Controlled ${lane} command ${failure} failure`);
      assert.throws(
        () =>
          execute(syntheticUnitRoot, lane, unitLayoutInput(), (command, args, options) => {
            calls.push([command, [...args], { ...options }]);
            if (calls.length - 1 === failure) throw expectedError;
          }),
        (error) => error === expectedError,
      );
      assert.deepEqual(calls, expectedUnitCalls("localized", lane).slice(0, failure + 1));
    }
  }
});

test("invalid unit layouts and acceptance or unknown selectors cannot execute a unit lane", () => {
  const execute = unitLaneApi();
  const invalid = unitLayoutInput();
  invalid.sourceFiles.push("tests/unit/app.test.ts");
  const calls = [];
  for (const [root, lane, value] of [
    [syntheticUnitRoot, "server", invalid],
    [syntheticUnitRoot, "acceptance", unitLayoutInput()],
    [syntheticUnitRoot, "parser", unitLayoutInput()],
    ["relative/root", "application", unitLayoutInput()],
  ])
    assert.throws(() => execute(root, lane, value, (...args) => calls.push(args)));
  assert.deepEqual(calls, []);
});

test("source CI localized amendment selects localized ownership and preserves the four real checks", () => {
  unitLayoutApi();
  const value = input();
  value.sourceFiles = value.sourceFiles.filter((path) => !Object.values(adoptedUnits).flat().includes(path));
  value.sourceFiles.push(...Object.values(localizedUnits).flat());
  value.sourceFiles.push("scripts/backend-unit-layout.mjs");
  value.packageScripts["lint:source"] = localizedLint;
  assert.deepEqual(api()(freeze(value)), { adopted: true, unitFiles: localizedUnits, sourceChecks });
});

test("source CI localized amendment rejects stale lint roots and ancestry-based path downgrade", () => {
  unitLayoutApi();
  const value = input();
  value.ancestorFiles = [unitLayoutInput().sourceFiles];
  assert.throws(() => api()(value));
  const localized = input();
  localized.sourceFiles = localized.sourceFiles.filter((path) => !Object.values(adoptedUnits).flat().includes(path));
  localized.sourceFiles.push(...Object.values(localizedUnits).flat());
  localized.sourceFiles.push("scripts/backend-unit-layout.mjs");
  localized.packageScripts["lint:source"] = localizedLint;
  assert.deepEqual(api()(localized), { adopted: true, unitFiles: localizedUnits, sourceChecks });
  localized.packageScripts["lint:source"] = adoptedScripts["lint:source"];
  assert.throws(() => api()(localized));
  localized.packageScripts["lint:source"] = localizedLint;
  localized.sourceFiles = localized.sourceFiles.filter((path) => path !== "scripts/backend-unit-layout.mjs");
  assert.throws(() => api()(localized));
});

test("unit locality keeps required acceptance delegated through its existing native lane command", () => {
  const workflow = parse(
    readFileSync(new URL("../.github/workflows/base-acceptance-e2e.yml", import.meta.url), "utf8"),
  );
  const steps = workflow.jobs["validate-product"].steps;
  const commands = steps.filter((step) => step.run === "node scripts/run-ci-lane.mjs acceptance");
  assert.equal(commands.length, 1);
  assert.equal(commands[0].if, undefined);
  assert.equal(commands[0]["continue-on-error"], undefined);
  assert(steps.findIndex((step) => step.run === "npm ci") < steps.indexOf(commands[0]));
});
