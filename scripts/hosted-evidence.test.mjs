/**
 * Independent parsed-data expectations for the adopted HOSTED-EVIDENCE contract.
 *
 * Run `node --test scripts/hosted-evidence.test.mjs` with the repository's pinned Node. All identities and rows are
 * synthetic fixtures, not observed application, provider, publication or approval evidence. No target is contacted.
 * The optional purity probe starts one credential-free Node subprocess with isolated VM modules and denied ambient
 * capabilities. Other tests perform in-memory validation only. Missing implementation fails before rejection checks;
 * it is availability red, never proof that an invalid record was correctly refused. Assertions exit nonzero on failure.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { validateAcceptanceProfiles } from "./acceptance-profiles.mjs";

const moduleUrl = new URL("./hosted-evidence.mjs", import.meta.url);
const subject = existsSync(moduleUrl) ? await import(moduleUrl.href) : {};
const errorCode = "ERR_HOSTED_EVIDENCE";
const revision = "synthetic-hosted-v1";
const launchId = "a1".repeat(32);
const profiles = ["stage", "production"];
const clone = (value) => structuredClone(value);
const retained = { file: "local/retained.spec.ts", title: "Synthetic retained local obligation" };
const localAdded = { file: "local/added.spec.ts", title: "Synthetic new local obligation" };
const stageFirst = { file: "stage/alpha.spec.ts", title: "Synthetic stage alpha" };
const stageSecond = { file: "stage/beta.spec.ts", title: "Synthetic stage beta" };
const productionOnly = { file: "production/smoke.spec.ts", title: "Synthetic production smoke" };
let diagnosticMessage;

/** The independent literal maps deliberately differ in order and stage/production size; no subject output builds them. */
function declarations() {
  return clone({
    metadata: {
      schemaVersion: 1,
      contractRevision: revision,
      profiles: {
        local: [
          { case: localAdded, requirements: ["APP-V1-009"] },
          { case: retained, requirements: ["APP-V1-001"] },
        ],
        stage: [
          { case: stageSecond, requirements: ["APP-V1-014", "APP-REL-005"] },
          { case: stageFirst, requirements: ["APP-V1-003"] },
        ],
        production: [{ case: productionOnly, requirements: ["APP-V1-015"] }],
      },
    },
    inventories: {
      local: { contractRevision: revision, cases: [retained, localAdded] },
      stage: { contractRevision: revision, cases: [stageFirst, stageSecond] },
      production: { contractRevision: revision, cases: [productionOnly] },
    },
    selectedContractRevision: revision,
    predecessorLocalInventory: { contractRevision: "synthetic-predecessor-v7", cases: [retained] },
  });
}

function expected(profile = "stage") {
  return {
    profile,
    sourceRevision: "a".repeat(40),
    suite: {
      commit: "b".repeat(40),
      tree: "c".repeat(40),
      fixtureManifestSha256: "d".repeat(64),
      profilesSha256: "e".repeat(64),
      inventorySha256: "f".repeat(64),
    },
    release: { reservationSha256: "1".repeat(64), publicationSha256: "2".repeat(64) },
    images: {
      api: {
        localImageId: `sha256:${"3".repeat(64)}`,
        archiveSha256: "4".repeat(64),
        registryDigest: `sha256:${"5".repeat(64)}`,
      },
      frontend: {
        localImageId: `sha256:${"6".repeat(64)}`,
        archiveSha256: "7".repeat(64),
        registryDigest: `sha256:${"8".repeat(64)}`,
      },
    },
    configurationSha256: "9".repeat(64),
    target: {
      origin: `https://${profile}.invalid`,
      resourceId: "synthetic:resource/one",
      revisionId: "synthetic-revision_1",
    },
    run: { id: "synthetic-run:42", attempt: 2, workflowRevision: "1".repeat(40) },
    declarationInput: declarations(),
  };
}

function executions(inventory) {
  return inventory.map((entry) => ({ ...entry, status: "passed", expectedStatus: "passed", retry: 0, retries: 0 }));
}

function resultFor(value) {
  const inventory = clone(value.declarationInput.inventories[value.profile].cases);
  return {
    schemaVersion: 1,
    kind: "hosted-suite-result",
    profile: value.profile,
    launchId,
    sourceRevision: value.sourceRevision,
    suite: clone(value.suite),
    inventory,
    tests: executions(inventory),
    status: "passed",
    cleanup: "passed",
  };
}

function observation(value, observedAt) {
  return {
    environment: value.profile,
    ...value.target,
    observedAt,
    configurationSha256: value.configurationSha256,
    registryDigests: { api: value.images.api.registryDigest, frontend: value.images.frontend.registryDigest },
  };
}

function suiteInput(profile = "stage") {
  const value = expected(profile);
  return { result: resultFor(value), expected: value, launchId };
}

function envelopeInput(profile = "stage") {
  const value = expected(profile);
  const suiteResult = resultFor(value);
  const observations = {
    before: observation(value, "2000-02-29T12:00:00.000Z"),
    after: observation(value, "2000-02-29T12:00:01.000Z"),
  };
  return {
    record: {
      schemaVersion: 1,
      kind: "hosted-acceptance",
      profile,
      status: "passed",
      sourceRevision: value.sourceRevision,
      contractRevision: revision,
      suite: clone(value.suite),
      release: clone(value.release),
      images: clone(value.images),
      configurationSha256: value.configurationSha256,
      run: clone(value.run),
      target: clone(observations),
      inventory: clone(suiteResult.inventory),
      tests: clone(suiteResult.tests),
      cleanup: "passed",
    },
    suiteResult,
    expected: value,
    launchId,
    wrapperOutcome: "completed",
    observations,
    parentCleanup: "passed",
  };
}

const lanes = [
  { name: "suite", exportName: "validateHostedSuiteResult", make: suiteInput, output: "result" },
  { name: "envelope", exportName: "validateHostedAcceptance", make: envelopeInput, output: "record" },
];

function api(lane) {
  assert.equal(typeof subject[lane.exportName], "function", `Missing HOSTED-EVIDENCE API: ${lane.exportName}`);
  return subject[lane.exportName];
}

function objectPaths(value, path = []) {
  if (value === null || typeof value !== "object") return [];
  return [[path, value], ...Object.entries(value).flatMap(([key, child]) => objectPaths(child, [...path, key]))];
}
const at = (value, path) => path.reduce((item, key) => item[key], value);
function set(value, path, replacement) {
  if (path.length === 0) return replacement;
  at(value, path.slice(0, -1))[path.at(-1)] = replacement;
  return value;
}
function snapshot(value) {
  return {
    value: clone(value),
    objects: objectPaths(value).map(([path, object]) => [path, object, Object.isFrozen(object)]),
  };
}
function unchanged(value, before) {
  assert.deepEqual(value, before.value, "caller values changed");
  for (const [path, object, frozen] of before.objects) {
    assert.strictEqual(at(value, path), object, "caller object replaced");
    assert.equal(Object.isFrozen(object), frozen, "caller freeze state changed");
  }
}
function passing(check, input, outputKey) {
  const before = snapshot(input);
  const output = check(input);
  assert.deepEqual(output, before.value[outputKey]);
  assert.equal(typeof output?.then, "undefined", "API must be synchronous");
  unchanged(input, before);
  return output;
}

/** Check the labeled synchronous refusal and caller state outside assert.throws, so mutation-then-throw is not success. */
function refusal(check, input, label) {
  const before = snapshot(input);
  assert.throws(
    () => check(input),
    (error) => {
      assert.ok(error instanceof TypeError, `${label}: wrong error type`);
      assert.equal(error.code, errorCode, `${label}: unrelated rejection`);
      assert.equal(typeof error.message, "string");
      assert.ok(error.message.length > 0);
      diagnosticMessage ??= error.message;
      assert.equal(error.message, diagnosticMessage, "diagnostic varies with supplied data");
      assert.equal(Object.hasOwn(error, "cause"), false);
      assert.ok(Object.getOwnPropertyNames(error).every((key) => ["code", "message", "stack"].includes(key)));
      assert.equal(error.message.includes("PRIVATE_SYNTHETIC_SENTINEL"), false);
      return true;
    },
    label,
  );
  unchanged(input, before);
}

/** Each negative has a fresh passing counterpart; setup/export failure cannot satisfy a negative assertion. */
function negatives(lane, cases, make = lane.make) {
  const check = api(lane);
  for (const [label, mutate] of cases) {
    let input = make();
    passing(check, input, lane.output);
    input = mutate(input) ?? input;
    refusal(check, input, `${lane.name}: ${label}`);
  }
}

function failedEnvelope() {
  const input = envelopeInput();
  input.suiteResult.status = input.record.status = "failed";
  input.suiteResult.tests = input.suiteResult.tests.slice(0, 1);
  input.suiteResult.tests[0].status = "failed";
  input.record.tests = clone(input.suiteResult.tests);
  return input;
}

function absentEnvelope(wrapperOutcome = "not-run", targetKnown = true) {
  const input = envelopeInput();
  input.suiteResult = null;
  input.wrapperOutcome = wrapperOutcome;
  input.record.status = wrapperOutcome === "not-run" ? "blocked" : "failed";
  input.record.tests = [];
  input.record.cleanup = wrapperOutcome === "not-run" ? "not-run" : "failed";
  input.observations = input.record.target = { before: null, after: null };
  if (!targetKnown) input.expected.target = null;
  return clone(input);
}

test("synthetic declaration counterparts pass the existing public helper with literal unequal identities", () => {
  const input = declarations();
  const before = snapshot(input);
  const value = validateAcceptanceProfiles(input);
  assert.equal(value.mode, "profiles-v1");
  assert.equal(value.contractRevision, revision);
  assert.deepEqual(value.profiles.local.inventory.cases, [retained, localAdded]);
  assert.deepEqual(value.profiles.stage.inventory.cases, [stageFirst, stageSecond]);
  assert.deepEqual(value.profiles.production.inventory.cases, [productionOnly]);
  assert.deepEqual(value.profiles.stage.mappings, [
    { case: stageFirst, requirements: ["APP-V1-003"] },
    { case: stageSecond, requirements: ["APP-REL-005", "APP-V1-014"] },
  ]);
  unchanged(input, before);
});

test("the only two exports synchronously preserve complete unequal stage and production data", () => {
  for (const lane of lanes) {
    const check = api(lane);
    for (const profile of profiles) passing(check, lane.make(profile), lane.output);
  }
  assert.deepEqual(Object.keys(subject).sort(), ["validateHostedAcceptance", "validateHostedSuiteResult"]);
  assert.equal(suiteInput("stage").result.inventory.length, 2);
  assert.equal(suiteInput("production").result.inventory.length, 1);
});

test("valid results are fresh deeply frozen copies with no input aliases, mutation or caller freezing", () => {
  for (const lane of lanes) {
    const check = api(lane);
    const blocked = suiteInput();
    Object.assign(blocked.result, { status: "blocked", tests: [], cleanup: "not-run" });
    const fixtures =
      lane.name === "suite"
        ? [lane.make(), { ...suiteInput(), result: failedEnvelope().suiteResult }, blocked]
        : [lane.make(), failedEnvelope(), absentEnvelope(), absentEnvelope("failed")];
    for (const frozenInput of [false, true])
      for (const fixture of fixtures) {
        const input = clone(fixture);
        if (frozenInput) for (const [, object] of objectPaths(input)) Object.freeze(object);
        const one = passing(check, input, lane.output);
        const two = passing(check, input, lane.output);
        const forbidden = new Set([...objectPaths(input), ...objectPaths(one)].map(([, object]) => object));
        for (const [, object] of objectPaths(one)) assert.equal(Object.isFrozen(object), true);
        for (const [, object] of objectPaths(two)) {
          assert.equal(Object.isFrozen(object), true);
          assert.equal(forbidden.has(object), false, "result reused caller/previous-return object");
        }
        const caller = new Set(objectPaths(input).map(([, object]) => object));
        for (const [, object] of objectPaths(one)) assert.equal(caller.has(object), false);
      }
  }
});

test("all argument and nested record fields are required and closed, including nonselected declarations", () => {
  for (const lane of lanes) {
    const positions = objectPaths(lane.make()).filter(([, value]) => !Array.isArray(value));
    negatives(
      lane,
      positions.flatMap(([path, value]) => [
        [
          `unknown field at ${path.join(".")}`,
          (f) => {
            at(f, path).PRIVATE_SYNTHETIC_SENTINEL = "untrusted";
          },
        ],
        ...Object.keys(value).map((key) => [
          `missing ${[...path, key].join(".")}`,
          (f) => {
            delete at(f, path)[key];
          },
        ]),
      ]),
    );
  }
});

test("ordinary JSON record and array positions reject wrong container types", () => {
  for (const lane of lanes) {
    const positions = objectPaths(lane.make());
    negatives(
      lane,
      positions.flatMap(([path, value]) =>
        (Array.isArray(value) ? [null, {}, false, 1, "array"] : [null, [], false, 1, "record"]).map((bad, index) => [
          `container ${path.join(".")} ${index}`,
          (f) => set(f, path, bad),
        ]),
      ),
    );
  }
});

test("every scalar position rejects wrong JSON types, including row, observation and requirement fields", () => {
  for (const lane of lanes) {
    const positions = objectPaths(lane.make()).flatMap(([path, object]) =>
      Object.entries(object)
        .filter(([, value]) => value !== null && typeof value !== "object")
        .map(([key, value]) => [[...path, key], value]),
    );
    negatives(
      lane,
      positions.flatMap(([path, value]) =>
        (typeof value === "string" ? [null, 1, true, [], {}] : [null, "wrong-type", true, [], {}]).map((bad, index) => [
          `scalar type ${path.join(".")} ${index}`,
          (f) => set(f, path, bad),
        ]),
      ),
    );
  }
});

test("fixed versions, hosted kinds and profiles have no local/control/discovery fallback", () => {
  for (const lane of lanes) {
    negatives(lane, [
      ...[0, 2, -1, 1.5, "1", null, true].map((bad) => [
        `schema ${bad}`,
        (f) => {
          f[lane.output].schemaVersion = bad;
        },
      ]),
      ...["local-e2e", "docs-controls", "hosted-controls", "discovery", "hosted-suite-input", null, 1].map((bad) => [
        `kind ${bad}`,
        (f) => {
          f[lane.output].kind = bad;
        },
      ]),
      ...["local", "candidate", "Stage", "stage\n", "", null, 1].map((bad) => [
        `profile ${bad}`,
        (f) => {
          f.expected.profile = f[lane.output].profile = bad;
        },
      ]),
    ]);
  }
});

test("every source, suite, release, image, configuration and run identity is compared against expected", () => {
  const suitePaths = [["profile"], ["sourceRevision"], ...Object.keys(expected().suite).map((key) => ["suite", key])];
  const envelopePaths = [
    ...suitePaths,
    ["contractRevision"],
    ["configurationSha256"],
    ...Object.keys(expected().release).map((key) => ["release", key]),
    ...["api", "frontend"].flatMap((role) => Object.keys(expected().images[role]).map((key) => ["images", role, key])),
    ...Object.keys(expected().run).map((key) => ["run", key]),
  ];
  for (const [lane, paths] of [
    [lanes[0], suitePaths],
    [lanes[1], envelopePaths],
  ]) {
    negatives(
      lane,
      paths.map((path) => [
        `identity ${path.join(".")}`,
        (f) => {
          const old = at(f[lane.output], path);
          const replacement =
            typeof old === "number"
              ? old + 1
              : path[0] === "profile"
                ? "production"
                : /^[a-f0-9]{40,64}$/.test(old)
                  ? "0".repeat(old.length)
                  : old.startsWith("sha256:")
                    ? `sha256:${"0".repeat(64)}`
                    : `${old}-changed`;
          set(f[lane.output], path, replacement);
        },
      ]),
    );
  }
});

test("source-owned expected identities require their exact scalar grammars even when record values agree", () => {
  const scalarPaths = [
    ["sourceRevision"],
    ["configurationSha256"],
    ...Object.keys(expected().suite).map((key) => ["suite", key]),
    ...Object.keys(expected().release).map((key) => ["release", key]),
    ...["api", "frontend"].flatMap((role) => Object.keys(expected().images[role]).map((key) => ["images", role, key])),
    ...Object.keys(expected().run).map((key) => ["run", key]),
  ];
  for (const lane of lanes) {
    negatives(
      lane,
      scalarPaths.flatMap((path) => {
        const old = at(lane.make().expected, path);
        const values =
          typeof old === "number"
            ? [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "2", null, false]
            : [null, false, 1, [], {}, "", ` ${old}`, `${old}\n`, "PRIVATE_SYNTHETIC_SENTINEL forbidden"];
        if (typeof old === "string" && /^(?:sha256:)?[a-f0-9]{40,64}$/.test(old)) {
          values.push(old + "0", old.slice(1));
          if (old.toUpperCase() !== old) values.push(old.toUpperCase());
        }
        return values.map((bad, index) => [
          `scalar ${path.join(".")} ${index}`,
          (f) => {
            set(f.expected, path, bad);
            if (path[0] in f[lane.output]) set(f[lane.output], path, clone(bad));
            if (lane.name === "envelope" && ["sourceRevision", "suite"].includes(path[0]))
              set(f.suiteResult, path, clone(bad));
          },
        ]);
      }),
    );
  }
});

test("launch identity is exact, required and never an envelope extension or a run-id substitute", () => {
  for (const lane of lanes)
    negatives(lane, [
      ...[null, 1, "", "A".repeat(64), "a".repeat(63), "a".repeat(65), `${launchId}\n`].map((bad) => [
        `launch grammar ${bad}`,
        (f) => {
          f.launchId = bad;
          (f.result ?? f.suiteResult).launchId = bad;
        },
      ]),
      [
        "stale result launch",
        (f) => {
          (f.result ?? f.suiteResult).launchId = "b".repeat(64);
        },
      ],
      [
        "different original launch",
        (f) => {
          f.launchId = "c".repeat(64);
        },
      ],
    ]);
  negatives(lanes[1], [
    [
      "envelope launch extension",
      (f) => {
        f.record.launchId = launchId;
      },
    ],
    [
      "launch substituted for producing run",
      (f) => {
        f.record.run.id = launchId;
      },
    ],
  ]);
});

test("API/frontend roles and local/archive/registry representations cannot be swapped or conflated", () => {
  negatives(lanes[1], [
    [
      "image roles swapped",
      (f) => {
        [f.record.images.api, f.record.images.frontend] = [f.record.images.frontend, f.record.images.api];
      },
    ],
    [
      "same-content assertion replaces registry identity",
      (f) => {
        f.record.images.api.registryDigest = f.record.images.api.localImageId;
      },
    ],
    [
      "archive receives prefixed digest",
      (f) => {
        f.expected.images.api.archiveSha256 = f.record.images.api.archiveSha256 = f.expected.images.api.localImageId;
      },
    ],
    [
      "local image loses prefix",
      (f) => {
        f.expected.images.api.localImageId = f.record.images.api.localImageId = "3".repeat(64);
      },
    ],
    [
      "registry loses prefix",
      (f) => {
        f.expected.images.frontend.registryDigest = f.record.images.frontend.registryDigest = "8".repeat(64);
      },
    ],
    [
      "publication and reservation swapped",
      (f) => {
        [f.record.release.publicationSha256, f.record.release.reservationSha256] = [
          f.record.release.reservationSha256,
          f.record.release.publicationSha256,
        ];
      },
    ],
  ]);
});

test("the existing declaration rules reject legacy absence, malformed maps and predecessor loss", () => {
  const cases = [
    [
      "legacy absence",
      (f) => {
        const d = f.expected.declarationInput;
        d.metadata = d.inventories.stage = d.inventories.production = d.predecessorLocalInventory = null;
      },
    ],
    [
      "missing metadata",
      (f) => {
        f.expected.declarationInput.metadata = null;
      },
    ],
    [
      "missing predecessor",
      (f) => {
        f.expected.declarationInput.predecessorLocalInventory = null;
      },
    ],
    [
      "missing nonselected production inventory",
      (f) => {
        f.expected.declarationInput.inventories.production = null;
      },
    ],
    [
      "unknown requirement",
      (f) => {
        f.expected.declarationInput.metadata.profiles.stage[0].requirements = ["PRIVATE_SYNTHETIC_SENTINEL"];
      },
    ],
    [
      "duplicate requirement",
      (f) => {
        f.expected.declarationInput.metadata.profiles.local[0].requirements = ["APP-V1-001", "APP-V1-001"];
      },
    ],
    [
      "missing map",
      (f) => {
        f.expected.declarationInput.metadata.profiles.stage.pop();
      },
    ],
    [
      "equal-count map substitution",
      (f) => {
        f.expected.declarationInput.metadata.profiles.stage[0].case.title += " changed";
      },
    ],
    [
      "selected revision mismatch",
      (f) => {
        f.expected.declarationInput.selectedContractRevision = "other-v1";
      },
    ],
    [
      "metadata revision mismatch",
      (f) => {
        f.expected.declarationInput.metadata.contractRevision = "other-v1";
      },
    ],
    [
      "nonselected revision mismatch",
      (f) => {
        f.expected.declarationInput.inventories.production.contractRevision = "other-v1";
      },
    ],
    [
      "unpreserved predecessor",
      (f) => {
        f.expected.declarationInput.predecessorLocalInventory.cases.push(clone(stageFirst));
      },
    ],
    [
      "coherently omitted local predecessor",
      (f) => {
        const d = f.expected.declarationInput;
        d.inventories.local.cases.shift();
        d.metadata.profiles.local.pop();
      },
    ],
    [
      "invalid predecessor revision",
      (f) => {
        f.expected.declarationInput.predecessorLocalInventory.contractRevision = "invalid/revision";
      },
    ],
  ];
  for (const lane of lanes) negatives(lane, cases);
});

test("declarations retain predecessor revision and accept changed valid mapping/revision supplied by the caller", () => {
  for (const lane of lanes) {
    const f = lane.make();
    f.expected.declarationInput.metadata.profiles.stage[0].requirements = ["APP-V1-016"];
    f.expected.declarationInput.predecessorLocalInventory.contractRevision = "independent-old-r99";
    passing(api(lane), f, lane.output);
  }
});

test("coherently malformed case identities still fail the reused declaration grammar", () => {
  for (const lane of lanes)
    negatives(lane, [
      ...[
        null,
        1,
        false,
        "",
        "../escape.spec.ts",
        "/absolute.spec.ts",
        "case.spec.js",
        "x//case.spec.ts",
        "case spec.ts",
      ].map((bad) => [
        `coherent case file ${bad}`,
        (f) => {
          const d = f.expected.declarationInput;
          d.inventories.stage.cases[0].file = d.metadata.profiles.stage[1].case.file = bad;
          f[lane.output].inventory[0].file = f[lane.output].tests[0].file = bad;
          if (lane.name === "envelope") f.suiteResult.inventory[0].file = f.suiteResult.tests[0].file = bad;
        },
      ]),
      ...[null, 1, false, "", " leading", "trailing ", "control\u0000title"].map((bad) => [
        `coherent case title ${bad}`,
        (f) => {
          const d = f.expected.declarationInput;
          d.inventories.stage.cases[0].title = d.metadata.profiles.stage[1].case.title = bad;
          f[lane.output].inventory[0].title = f[lane.output].tests[0].title = bad;
          if (lane.name === "envelope") f.suiteResult.inventory[0].title = f.suiteResult.tests[0].title = bad;
        },
      ]),
    ]);
});

test("complete inventory compares tuple sets without assuming order or hardcoded local/stage/production counts", () => {
  for (const lane of lanes) {
    const f = lane.make();
    f[lane.output].inventory.reverse();
    f[lane.output].tests.reverse();
    if (lane.name === "envelope") {
      f.suiteResult.inventory.reverse();
      f.suiteResult.tests.reverse();
    }
    passing(api(lane), f, lane.output);
    for (const profile of profiles) {
      const input = lane.make(profile);
      const d = input.expected.declarationInput;
      for (const [name, size] of [
        ["local", 73],
        ["stage", 23],
        ["production", 4],
      ]) {
        const cases = Array.from({ length: size }, (_, i) => ({
          file: `${name}/synthetic-${i}.spec.ts`,
          title: `Synthetic ${name} ${i}`,
        }));
        if (name === "local") cases[0] = clone(retained);
        d.inventories[name].cases = cases;
        d.metadata.profiles[name] = cases.map((entry) => ({ case: clone(entry), requirements: ["APP-V1-001"] }));
      }
      const result = resultFor(input.expected);
      if (lane.name === "suite") input.result = result;
      else {
        input.suiteResult = result;
        input.record.inventory = clone(result.inventory);
        input.record.tests = clone(result.tests);
      }
      passing(api(lane), input, lane.output);
    }
  }
});

test("complete inventory refuses omissions, extras, duplicates and same-count tuple substitution even on failure", () => {
  for (const lane of lanes)
    negatives(lane, [
      [
        "missing tuple",
        (f) => {
          f[lane.output].inventory.pop();
        },
      ],
      [
        "extra tuple",
        (f) => {
          f[lane.output].inventory.push(clone(productionOnly));
        },
      ],
      [
        "duplicate tuple",
        (f) => {
          f[lane.output].inventory[1] = clone(f[lane.output].inventory[0]);
        },
      ],
      [
        "same count replacement",
        (f) => {
          f[lane.output].inventory[0].title += " changed";
        },
      ],
      [
        "failed missing inventory",
        (f) => {
          f[lane.output].status = "failed";
          f[lane.output].tests = [];
          f[lane.output].inventory.pop();
        },
      ],
      [
        "blocked missing inventory",
        (f) => {
          f[lane.output].status = "blocked";
          f[lane.output].tests = [];
          f[lane.output].inventory = [];
        },
      ],
    ]);
});

test("passing executions require every unique known tuple, correct statuses and zero retry values", () => {
  for (const lane of lanes)
    negatives(lane, [
      [
        "missing execution",
        (f) => {
          f[lane.output].tests.pop();
        },
      ],
      [
        "extra unknown execution",
        (f) => {
          f[lane.output].tests.push({ ...f[lane.output].tests[0], ...productionOnly });
        },
      ],
      [
        "duplicate execution",
        (f) => {
          f[lane.output].tests[1] = clone(f[lane.output].tests[0]);
        },
      ],
      [
        "same-count row replacement",
        (f) => {
          f[lane.output].tests[0].title += " changed";
        },
      ],
      ...["failed", "skipped", "timedOut", "interrupted"].map((status) => [
        `actual ${status}`,
        (f) => {
          f[lane.output].tests[0].status = status;
        },
      ]),
      ...["failed", "skipped"].map((status) => [
        `expected ${status}`,
        (f) => {
          f[lane.output].tests[0].expectedStatus = status;
        },
      ]),
      ...["retry", "retries"].map((key) => [
        `nonzero ${key}`,
        (f) => {
          f[lane.output].tests[0][key] = 1;
        },
      ]),
      ...["failed", "not-run"].map((cleanup) => [
        `cleanup ${cleanup}`,
        (f) => {
          f[lane.output].cleanup = cleanup;
        },
      ]),
    ]);
});

test("failed and blocked suite results preserve truthful nonpassing rows and supported status/retry values", () => {
  const check = api(lanes[0]);
  for (const status of ["passed", "failed", "skipped", "timedOut", "interrupted"]) {
    for (const expectedStatus of ["passed", "failed", "skipped"]) {
      const f = suiteInput();
      f.result.status = "failed";
      f.result.tests = f.result.tests.slice(0, 1);
      Object.assign(f.result.tests[0], {
        status,
        expectedStatus,
        retry: Number.MAX_SAFE_INTEGER,
        retries: Number.MAX_SAFE_INTEGER,
      });
      passing(check, f, "result");
    }
  }
  for (const status of ["failed", "blocked"])
    for (const cleanup of ["passed", "failed", "not-run"]) {
      const f = suiteInput();
      Object.assign(f.result, { status, cleanup, tests: [] });
      passing(check, f, "result");
    }
});

test("nonpassing suite rows still reject unknown/duplicate tuples, unsupported statuses and unsafe retries", () => {
  const make = () => {
    const f = suiteInput();
    f.result.status = "failed";
    return f;
  };
  negatives(
    lanes[0],
    [
      [
        "unknown tuple",
        (f) => {
          f.result.tests[0].title += " unknown";
        },
      ],
      [
        "known tuple from a different profile",
        (f) => {
          Object.assign(f.result.tests[0], productionOnly);
        },
      ],
      [
        "duplicate tuple",
        (f) => {
          f.result.tests.push(clone(f.result.tests[0]));
        },
      ],
      [
        "blocked with rows",
        (f) => {
          f.result.status = "blocked";
        },
      ],
      ...["status", "expectedStatus"].flatMap((key) =>
        [null, true, 1, "", "not-run", "PASSED", "passed\n"].map((bad) => [
          `row ${key} ${bad}`,
          (f) => {
            f.result.tests[0][key] = bad;
          },
        ]),
      ),
      ...["retry", "retries"].flatMap((key) =>
        [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, "0", null, true].map((bad) => [
          `row ${key} ${bad}`,
          (f) => {
            f.result.tests[0][key] = bad;
          },
        ]),
      ),
      ...["skipped", "timedOut", "interrupted", null, 1].map((bad) => [
        `suite status ${bad}`,
        (f) => {
          f.result.status = bad;
        },
      ]),
      ...["skipped", "complete", null, true].map((bad) => [
        `suite cleanup ${bad}`,
        (f) => {
          f.result.cleanup = bad;
        },
      ]),
    ],
    make,
  );
});

test("failed envelopes reject coherently copied malformed rows rather than accepting copy equality alone", () => {
  const cases = [
    [
      "unknown tuple",
      (rows) => {
        rows[0].title += " unknown";
      },
    ],
    [
      "duplicate tuple",
      (rows) => {
        rows.push(clone(rows[0]));
      },
    ],
    ...["status", "expectedStatus"].map((key) => [
      `unsupported ${key}`,
      (rows) => {
        rows[0][key] = "not-run";
      },
    ]),
    ...["retry", "retries"].flatMap((key) =>
      [-1, 0.5, Number.MAX_SAFE_INTEGER + 1].map((bad) => [
        `unsafe ${key} ${bad}`,
        (rows) => {
          rows[0][key] = bad;
        },
      ]),
    ),
  ];
  negatives(
    lanes[1],
    cases.map(([label, mutateRows]) => [
      label,
      (f) => {
        mutateRows(f.suiteResult.tests);
        f.record.tests = clone(f.suiteResult.tests);
      },
    ]),
    failedEnvelope,
  );
});

test("production failure custody uses its own selected tuples rather than a union of declared profiles", () => {
  const f = envelopeInput("production");
  f.suiteResult.status = f.record.status = "failed";
  f.suiteResult.tests[0].status = "failed";
  f.record.tests = clone(f.suiteResult.tests);
  passing(api(lanes[1]), f, "record");
  const suite = { result: clone(f.suiteResult), expected: clone(f.expected), launchId };
  passing(api(lanes[0]), suite, "result");
  Object.assign(suite.result.tests[0], stageFirst);
  refusal(api(lanes[0]), suite, "production cannot accept known stage execution");
  Object.assign(f.suiteResult.tests[0], stageFirst);
  f.record.tests = clone(f.suiteResult.tests);
  refusal(api(lanes[1]), f, "coherent production envelope cannot accept stage execution");
});

test("envelopes retain original result arrays and every execution field, including order and failure state", () => {
  const cases = [
    [
      "inventory reordered",
      (f) => {
        f.record.inventory.reverse();
      },
    ],
    [
      "tests reordered",
      (f) => {
        f.record.tests.reverse();
      },
    ],
    [
      "stale result profile",
      (f) => {
        f.suiteResult.profile = "production";
      },
    ],
    [
      "stale result source",
      (f) => {
        f.suiteResult.sourceRevision = "0".repeat(40);
      },
    ],
    [
      "stale result suite",
      (f) => {
        f.suiteResult.suite.tree = "0".repeat(40);
      },
    ],
  ];
  negatives(lanes[1], cases);
  negatives(
    lanes[1],
    [
      [
        "failed row promoted",
        (f) => {
          f.record.tests[0].status = "passed";
        },
      ],
      [
        "failed row expected status rewritten",
        (f) => {
          f.record.tests[0].expectedStatus = "failed";
        },
      ],
      [
        "retry rewritten",
        (f) => {
          f.record.tests[0].retry = 1;
        },
      ],
      [
        "configured retries rewritten",
        (f) => {
          f.record.tests[0].retries = 1;
        },
      ],
      [
        "failed row omitted",
        (f) => {
          f.record.tests = [];
        },
      ],
      [
        "missing row fabricated",
        (f) => {
          f.record.tests.push(executions([stageSecond])[0]);
        },
      ],
      [
        "original result replaced by passing invention",
        (f) => {
          f.suiteResult.tests[0].status = "passed";
        },
      ],
    ],
    failedEnvelope,
  );
});

/** Literal adopted matrix; wrapper failure and parent cleanup override result status independently. */
const statusMatrix = [
  ["passed", "completed", ["passed", "failed"]],
  ["failed", "completed", ["failed"]],
  ["blocked", "completed", ["blocked", "failed"]],
  [null, "not-run", ["blocked", "failed"]],
  [null, "failed", ["failed"]],
  [null, "completed", []],
  ["passed", "failed", ["failed"]],
  ["failed", "failed", ["failed"]],
  ["blocked", "failed", ["failed"]],
  ["passed", "not-run", []],
  ["failed", "not-run", []],
  ["blocked", "not-run", []],
];

test("every original-result/wrapper/envelope-status combination follows the conservative matrix", () => {
  const check = api(lanes[1]);
  passing(check, envelopeInput(), "record");
  for (const [childStatus, wrapperOutcome, allowed] of statusMatrix)
    for (const status of ["passed", "failed", "blocked"]) {
      const f = childStatus === null ? absentEnvelope(wrapperOutcome) : envelopeInput();
      f.wrapperOutcome = wrapperOutcome;
      f.record.status = status;
      if (childStatus !== null) {
        f.suiteResult.status = childStatus;
        if (childStatus === "blocked") f.suiteResult.tests = f.record.tests = [];
      }
      if (allowed.includes(status)) passing(check, f, "record");
      else refusal(check, f, `matrix ${childStatus}/${wrapperOutcome}/${status}`);
    }
});

test("all nine child/parent cleanup combinations require the exact dominant aggregate", () => {
  const check = api(lanes[1]);
  const matrix = [
    ["passed", "passed", "passed"],
    ["passed", "failed", "failed"],
    ["passed", "not-run", "not-run"],
    ["failed", "passed", "failed"],
    ["failed", "failed", "failed"],
    ["failed", "not-run", "failed"],
    ["not-run", "passed", "not-run"],
    ["not-run", "failed", "failed"],
    ["not-run", "not-run", "not-run"],
  ];
  for (const [child, parent, aggregate] of matrix) {
    const f = failedEnvelope();
    f.suiteResult.cleanup = child;
    f.parentCleanup = parent;
    f.record.cleanup = aggregate;
    passing(check, f, "record");
    for (const wrong of ["passed", "failed", "not-run"].filter((x) => x !== aggregate)) {
      const invalid = clone(f);
      invalid.record.cleanup = wrong;
      refusal(check, invalid, `cleanup ${child}/${parent}/${wrong}`);
    }
  }
});

test("absent-result cleanup distinguishes nonexecution from unverified failed-wrapper cleanup", () => {
  const check = api(lanes[1]);
  for (const [wrapper, parent, aggregate] of [
    ["not-run", "passed", "not-run"],
    ["not-run", "failed", "failed"],
    ["not-run", "not-run", "not-run"],
    ["failed", "passed", "failed"],
    ["failed", "failed", "failed"],
    ["failed", "not-run", "failed"],
  ]) {
    const f = absentEnvelope(wrapper);
    f.parentCleanup = parent;
    f.record.cleanup = aggregate;
    passing(check, f, "record");
    for (const wrong of ["passed", "failed", "not-run"].filter((x) => x !== aggregate)) {
      const bad = clone(f);
      bad.record.cleanup = wrong;
      refusal(check, bad, `absent cleanup ${wrapper}/${parent}/${wrong}`);
    }
  }
});

test("parent failure and nonexecution cannot pass even with a complete passing child", () => {
  for (const parentCleanup of ["failed", "not-run"]) {
    const f = envelopeInput();
    f.parentCleanup = f.record.cleanup = parentCleanup;
    f.record.status = "failed";
    passing(api(lanes[1]), f, "record");
    f.record.status = "passed";
    refusal(api(lanes[1]), f, `parent ${parentCleanup}`);
  }
  negatives(lanes[1], [
    ...["skipped", "timedOut", "interrupted", "FAILED", "failed\n"].map((x) => [
      `envelope status enum ${x}`,
      (f) => {
        f.record.status = x;
      },
    ]),
    ...["passed", "success", "", null, 1].map((x) => [
      `wrapper enum ${x}`,
      (f) => {
        f.wrapperOutcome = x;
      },
    ]),
    ...["completed", "", null, false].map((x) => [
      `parent cleanup enum ${x}`,
      (f) => {
        f.parentCleanup = x;
      },
    ]),
  ]);
});

test("null expected target is only valid before wrapper execution with absent result and nonpassing envelope", () => {
  const check = api(lanes[1]);
  for (const status of ["blocked", "failed"]) {
    const f = absentEnvelope("not-run", false);
    f.record.status = status;
    passing(check, f, "record");
  }
  negatives(lanes[0], [
    [
      "null expected target",
      (f) => {
        f.expected.target = null;
      },
    ],
  ]);
  negatives(
    lanes[1],
    [
      [
        "passing envelope",
        (f) => {
          f.record.status = "passed";
        },
      ],
      [
        "failed wrapper has no known target",
        (f) => {
          f.wrapperOutcome = "failed";
          f.record.status = f.record.cleanup = "failed";
        },
      ],
      [
        "result present before target approval",
        (f) => {
          f.suiteResult = suiteInput().result;
        },
      ],
    ],
    () => absentEnvelope("not-run", false),
  );
});

test("absent output cannot be replaced by fabricated rows, a result-like value or completed custody", () => {
  negatives(
    lanes[1],
    [
      [
        "fabricated passing execution",
        (f) => {
          f.record.tests = executions(f.record.inventory);
        },
      ],
      [
        "completed wrapper without output",
        (f) => {
          f.wrapperOutcome = "completed";
        },
      ],
      ...[{}, [], false, "missing"].map((bad) => [
        `not explicit null ${bad}`,
        (f) => {
          f.suiteResult = bad;
        },
      ]),
      [
        "absent output erases inventory",
        (f) => {
          f.record.inventory = [];
        },
      ],
    ],
    absentEnvelope,
  );
});

test("nonpassing envelopes preserve valid drift, missing reads, reversed time and partial actual execution", () => {
  const check = api(lanes[1]);
  for (const mutate of [
    (f) => {
      f.observations = { before: null, after: null };
    },
    (f) => {
      f.observations.after = null;
    },
    (f) => {
      f.observations.before = null;
    },
    (f) => {
      f.observations.after.observedAt = "1999-12-31T23:59:59.999Z";
    },
    (f) => {
      f.observations.after.origin = "https://drift.invalid";
    },
    (f) => {
      f.observations.after.resourceId = "other-resource";
    },
    (f) => {
      f.observations.after.revisionId = "other-revision";
    },
    (f) => {
      f.observations.after.environment = "production";
    },
    (f) => {
      f.observations.after.configurationSha256 = "0".repeat(64);
    },
    (f) => {
      f.observations.after.registryDigests.api = `sha256:${"0".repeat(64)}`;
    },
  ]) {
    const f = failedEnvelope();
    mutate(f);
    f.record.target = clone(f.observations);
    passing(check, f, "record");
    const changed = clone(f);
    changed.record.target = clone(envelopeInput().observations);
    refusal(check, changed, "rewritten actual failed observation");
  }
  const conservative = envelopeInput();
  conservative.record.status = "failed";
  passing(check, conservative, "record");
});

test("passing envelopes require complete stable observations equal to the independent approved target", () => {
  const cases = [
    [
      "missing before",
      (f) => {
        f.observations.before = null;
      },
    ],
    [
      "missing after",
      (f) => {
        f.observations.after = null;
      },
    ],
    [
      "reversed timestamp",
      (f) => {
        f.observations.after.observedAt = "2000-02-29T11:59:59.999Z";
      },
    ],
    ...["before", "after"].flatMap((side) => [
      [
        `${side} origin drift`,
        (f) => {
          f.observations[side].origin = "https://different.invalid";
        },
      ],
      [
        `${side} resource drift`,
        (f) => {
          f.observations[side].resourceId += "-different";
        },
      ],
      [
        `${side} revision drift`,
        (f) => {
          f.observations[side].revisionId += "-different";
        },
      ],
      [
        `${side} wrong profile`,
        (f) => {
          f.observations[side].environment = "production";
        },
      ],
      [
        `${side} wrong configuration`,
        (f) => {
          f.observations[side].configurationSha256 = "0".repeat(64);
        },
      ],
      ...["api", "frontend"].map((role) => [
        `${side} ${role} digest drift`,
        (f) => {
          f.observations[side].registryDigests[role] = `sha256:${"0".repeat(64)}`;
        },
      ]),
    ]),
    [
      "stable but independently wrong target",
      (f) => {
        for (const side of ["before", "after"]) f.observations[side].revisionId = "wrong-but-stable";
      },
    ],
  ];
  negatives(
    lanes[1],
    cases.map(([label, mutate]) => [
      label,
      (f) => {
        mutate(f);
        f.record.target = clone(f.observations);
      },
    ]),
  );
  const equal = envelopeInput();
  equal.observations.after.observedAt = equal.observations.before.observedAt;
  equal.record.target = clone(equal.observations);
  passing(api(lanes[1]), equal, "record");
});

test("HTTPS origin syntax is enforced for expected target and all observations even when nonpassing", () => {
  const invalid = [
    "http://stage.invalid",
    "https://user:secret@stage.invalid",
    "https://stage.invalid/path",
    "https://stage.invalid?query",
    "https://stage.invalid#fragment",
    "https://STAGE.invalid",
    "https://stage.invalid:443",
    " https://stage.invalid",
    "https://stage.invalid\n",
    "PRIVATE_SYNTHETIC_SENTINEL",
    null,
    1,
    false,
  ];
  for (const lane of lanes)
    negatives(
      lane,
      invalid.map((bad) => [
        `expected origin ${bad}`,
        (f) => {
          f.expected.target.origin = bad;
        },
      ]),
    );
  negatives(
    lanes[1],
    ["before", "after"].flatMap((side) =>
      invalid.map((bad) => [
        `failed ${side} origin ${bad}`,
        (f) => {
          f.observations[side].origin = bad;
          f.record.target = clone(f.observations);
        },
      ]),
    ),
    failedEnvelope,
  );
});

test("SafeId and real millisecond UTC syntax are enforced even for failed observations", () => {
  const invalidIds = ["", "_bad", "has space", "id?query", "id#fragment", "x".repeat(257), "id\n", "é", null, 1];
  for (const lane of lanes)
    negatives(lane, [
      ...["resourceId", "revisionId"].flatMap((key) =>
        invalidIds.map((bad) => [
          `expected ${key} ${bad}`,
          (f) => {
            f.expected.target[key] = bad;
          },
        ]),
      ),
      ...invalidIds.map((bad) => [
        `expected run id ${bad}`,
        (f) => {
          f.expected.run.id = bad;
          if (lane.name === "envelope") f.record.run.id = bad;
        },
      ]),
    ]);
  const invalidTimes = [
    "2001-02-29T12:00:00.000Z",
    "2000-02-30T12:00:00.000Z",
    "2000-13-01T00:00:00.000Z",
    "2000-01-01T24:00:00.000Z",
    "2000-01-01T00:00:60.000Z",
    "2000-01-01T00:00:00Z",
    "2000-01-01T00:00:00.000+00:00",
    "2000-01-01t00:00:00.000z",
    "2000-01-01T00:00:00.000Z\n",
    null,
    1,
  ];
  negatives(
    lanes[1],
    ["before", "after"].flatMap((side) => [
      ...["resourceId", "revisionId"].flatMap((key) =>
        invalidIds.map((bad) => [
          `failed ${side} ${key}`,
          (f) => {
            f.observations[side][key] = bad;
            f.record.target = clone(f.observations);
          },
        ]),
      ),
      ...invalidTimes.map((bad) => [
        `failed ${side} UTC ${bad}`,
        (f) => {
          f.observations[side].observedAt = bad;
          f.record.target = clone(f.observations);
        },
      ]),
    ]),
    failedEnvelope,
  );
});

test("safe identifier and integer boundaries are valid without current-clock or unadopted freshness rules", () => {
  const f = envelopeInput();
  f.expected.run.attempt = f.record.run.attempt = Number.MAX_SAFE_INTEGER;
  f.expected.run.id = f.record.run.id = "R" + "x".repeat(255);
  f.expected.target.resourceId = "R._:/-";
  f.expected.target.revisionId = "x".repeat(256);
  for (const side of ["before", "after"]) {
    f.observations[side].resourceId = f.expected.target.resourceId;
    f.observations[side].revisionId = f.expected.target.revisionId;
  }
  f.record.target = clone(f.observations);
  passing(api(lanes[1]), f, "record");
});

test("malformed observation values cannot hide behind a failed envelope or agree-by-copy", () => {
  negatives(
    lanes[1],
    ["before", "after"].flatMap((side) => [
      ...["local", null, 1, "stage\n"].map((bad) => [
        `failed environment ${side}`,
        (f) => {
          f.observations[side].environment = bad;
          f.record.target = clone(f.observations);
        },
      ]),
      ...["configurationSha256", "api", "frontend"].map((key) => [
        `failed digest ${side}/${key}`,
        (f) => {
          if (key === "configurationSha256") f.observations[side][key] = "A".repeat(64);
          else f.observations[side].registryDigests[key] = "a".repeat(64);
          f.record.target = clone(f.observations);
        },
      ]),
    ]),
    failedEnvelope,
  );
});

test("unknown authority, selection, reason and count fields are rejected rather than trusted", () => {
  for (const lane of lanes)
    negatives(
      lane,
      [
        "approval",
        "authorized",
        "deployable",
        "override",
        "reason",
        "planned",
        "passed",
        "selector",
        "url",
        "credentials",
      ].flatMap((key) => [
        [
          `argument ${key}`,
          (f) => {
            f[key] = true;
          },
        ],
        [
          `expected ${key}`,
          (f) => {
            f.expected[key] = true;
          },
        ],
        [
          `result ${key}`,
          (f) => {
            f[lane.output][key] = true;
          },
        ],
      ]),
    );
});

test("all rejection paths use one fixed sanitized diagnostic, including reused declaration failures", () => {
  for (const lane of lanes)
    negatives(lane, [
      [
        "secret value",
        (f) => {
          f[lane.output].kind = "PRIVATE_SYNTHETIC_SENTINEL: credential=value";
        },
      ],
      [
        "secret key",
        (f) => {
          f.expected["PRIVATE_SYNTHETIC_SENTINEL: header=value"] = true;
        },
      ],
      [
        "nested helper failure",
        (f) => {
          f.expected.declarationInput.metadata.contractRevision = "PRIVATE_SYNTHETIC_SENTINEL/invalid";
        },
      ],
    ]);
});

test("the refusal oracle rejects mutation-then-throw, wrong labels, native errors and asynchronous refusal", async () => {
  api(lanes[0]);
  const input = suiteInput();
  const goodError = () =>
    Object.assign(new TypeError(diagnosticMessage ?? "Synthetic fixed diagnostic"), { code: errorCode });
  assert.throws(
    () =>
      refusal(
        (f) => {
          f.expected.profile = "production";
          throw goodError();
        },
        clone(input),
        "mutation",
      ),
    assert.AssertionError,
  );
  assert.throws(
    () =>
      refusal(
        () => {
          throw new TypeError("unrelated native diagnostic");
        },
        clone(input),
        "native",
      ),
    assert.AssertionError,
  );
  assert.throws(
    () =>
      refusal(
        () => {
          throw Object.assign(new TypeError("wrong"), { code: "OTHER" });
        },
        clone(input),
        "label",
      ),
    assert.AssertionError,
  );
  assert.throws(() => refusal(() => Promise.resolve({}), clone(input), "async"), assert.AssertionError);
});

test("isolated import/calls deny I/O and clock access while reusing the existing declaration helper", () => {
  api(lanes[0]);
  api(lanes[1]);
  const failed = failedEnvelope();
  const blocked = envelopeInput();
  blocked.suiteResult.status = blocked.record.status = "blocked";
  blocked.suiteResult.tests = blocked.record.tests = [];
  blocked.suiteResult.cleanup = blocked.record.cleanup = "not-run";
  const envelopes = [
    envelopeInput(),
    envelopeInput("production"),
    failed,
    blocked,
    absentEnvelope(),
    absentEnvelope("not-run", false),
    absentEnvelope("failed"),
  ];
  const suites = envelopes
    .filter((input) => input.suiteResult !== null)
    .map((input) => ({ result: input.suiteResult, expected: input.expected, launchId: input.launchId }));
  const malformedSuite = suiteInput();
  malformedSuite.expected.declarationInput.metadata.contractRevision = "PRIVATE_SYNTHETIC_SENTINEL/invalid";
  const malformedEnvelope = failedEnvelope();
  malformedEnvelope.suiteResult.tests[0].retry = -1;
  malformedEnvelope.record.tests = clone(malformedEnvelope.suiteResult.tests);
  const probe = `
    import assert from 'node:assert/strict';
    import * as strictAssertions from 'node:assert/strict';
    import vm from 'node:vm';
    import { isDeepStrictEqual } from 'node:util';
    const suites = ${JSON.stringify(suites)};
    const envelopes = ${JSON.stringify(envelopes)};
    const malformed = ${JSON.stringify([
      ["validateHostedSuiteResult", malformedSuite],
      ["validateHostedAcceptance", malformedEnvelope],
    ])};
    const helperSource = ${JSON.stringify(readFileSync(moduleUrl, "utf8"))};
    const declarationSource = ${JSON.stringify(readFileSync(new URL("./acceptance-profiles.mjs", import.meta.url), "utf8"))};
    let ambientAttempts = 0;
    const denied = () => { ambientAttempts++; throw new Error('Forbidden ambient capability'); };
    const context = vm.createContext({ URL, recordDeniedAttempt: () => { ambientAttempts++; } });
    const inContext = (value) => vm.runInContext('JSON.parse(' + JSON.stringify(JSON.stringify(value)) + ')', context);
    // Keep plain fixture records in the subject's realm, including JSON-data clones, so prototype comparisons do not
    // create an artificial failure in otherwise pure validators that use deterministic structural equality.
    context.structuredClone = inContext;
    vm.runInContext(\`
      const recordAttempt = recordDeniedAttempt;
      delete globalThis.recordDeniedAttempt;
      const deny = () => { recordAttempt(); throw new Error('Forbidden ambient capability'); };
      const NativeDate = Date;
      globalThis.Date = class extends NativeDate {
        constructor(...args) { if (!args.length) deny(); super(...args); }
        static now() { deny(); }
      };
      Math.random = deny;
      for (const key of ['process','fetch','WebSocket','XMLHttpRequest','performance','console',
        'setTimeout','setInterval','setImmediate','queueMicrotask','navigator','crypto'])
        Object.defineProperty(globalThis, key, { get: deny });
    \`, context);
    const declaration = new vm.SourceTextModule(declarationSource, { context, importModuleDynamically: denied });
    await declaration.link(denied); await declaration.evaluate();
    let calls = 0;
    const dependency = new vm.SyntheticModule(['validateAcceptanceProfiles'], function () {
      this.setExport('validateAcceptanceProfiles', (value) => {
        calls++; return declaration.namespace.validateAcceptanceProfiles(value);
      });
    }, { context });
    const helper = new vm.SourceTextModule(helperSource, { context, importModuleDynamically: denied });
    const pureBuiltins = {
      'node:assert/strict': strictAssertions,
      'node:url': { URL, URLSearchParams },
      'node:util': { isDeepStrictEqual },
    };
    await helper.link((specifier) => {
      if (pureBuiltins[specifier]) {
        const exports = pureBuiltins[specifier];
        return new vm.SyntheticModule(Object.keys(exports), function () {
          for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
        }, { context });
      }
      assert.equal(new URL(specifier, ${JSON.stringify(moduleUrl.href)}).href,
        ${JSON.stringify(new URL("./acceptance-profiles.mjs", import.meta.url).href)}, 'Only pure dependencies are allowed');
      return dependency;
    });
    await helper.evaluate();
    for (const [name, fixtures, outputKey] of [
      ['validateHostedSuiteResult', suites, 'result'],
      ['validateHostedAcceptance', envelopes, 'record'],
    ]) {
      for (const fixture of fixtures) {
        const previous = calls;
        const args = inContext(fixture);
        const output = helper.namespace[name](args);
        assert.deepEqual(JSON.parse(JSON.stringify(output)), fixture[outputKey]);
        assert.ok(calls > previous, name + ' must reuse declarations');
        assert.deepEqual(JSON.parse(JSON.stringify(args)), fixture, 'purity fixture changed');
      }
    }
    let fixedMessage;
    const RealmTypeError = vm.runInContext('TypeError', context);
    for (const [name, fixture] of malformed) {
      const args = inContext(fixture);
      assert.throws(() => helper.namespace[name](args), (error) => {
        assert.ok(error instanceof RealmTypeError, 'malformed input must have a labeled TypeError');
        assert.equal(error.code, 'ERR_HOSTED_EVIDENCE');
        assert.equal(typeof error.message, 'string');
        assert.ok(error.message.length > 0);
        fixedMessage ??= error.message;
        assert.equal(error.message, fixedMessage);
        assert.equal(error.message.includes('PRIVATE_SYNTHETIC_SENTINEL'), false);
        assert.equal(Object.hasOwn(error, 'cause'), false);
        return true;
      });
      assert.deepEqual(JSON.parse(JSON.stringify(args)), fixture, 'rejected purity fixture changed');
    }
    await Promise.resolve();
    assert.equal(ambientAttempts, 0, 'Caught capability errors cannot hide an attempted ambient read');
    process.stdout.write('pure-import-and-calls-passed\\n');
  `;
  const child = spawnSync(process.execPath, ["--experimental-vm-modules", "--input-type=module", "--eval", probe], {
    env: {},
    encoding: "utf8",
    timeout: 10000,
    maxBuffer: 128 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(child.error, undefined);
  assert.equal(child.status, 0, `purity probe failed: ${child.stderr}`);
  assert.equal(child.stdout, "pure-import-and-calls-passed\n");
});
