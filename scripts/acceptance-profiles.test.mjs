/**
 * Independent parsed-data decisions for the frozen hosted-profile protocol and PROFILE-DECLARATIONS card.
 *
 * Run `node --test scripts/acceptance-profiles.test.mjs`. Synthetic identities describe validator fixtures, not hosted
 * application cases. No application, Git, provider, network, install or source-reader execution is involved. Missing
 * implementation/export is an availability failure checked before negative assertions, never a passing rejection.
 * The tests own their JSON data and check nonmutation, exact output, fresh deep copies and labeled diagnostics.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const moduleUrl = new URL("./acceptance-profiles.mjs", import.meta.url);
const subject = existsSync(moduleUrl) ? await import(moduleUrl.href) : {};
const profiles = ["local", "stage", "production"];
const errorCode = "ERR_ACCEPTANCE_PROFILE_DECLARATION";
const revision = "hosted-fixture-v1";
const first = { file: "local/first.spec.ts", title: "Synthetic retained first identity" };
const second = { file: "local/second.spec.ts", title: "Synthetic retained second identity" };
const added = { file: "local/added.spec.ts", title: "Synthetic added local identity" };
const stageOnly = { file: "stage/probe.spec.ts", title: "Synthetic stage identity" };
const smoke = { file: "production/probe.spec.ts", title: "Synthetic smoke identity" };
const requirementIds = [
  "APP-V1-001",
  "APP-V1-002",
  "APP-V1-003",
  "APP-V1-004",
  "APP-V1-005",
  "APP-V1-006",
  "APP-V1-007",
  "APP-V1-008",
  "APP-V1-009",
  "APP-V1-010",
  "APP-V1-011",
  "APP-V1-012",
  "APP-V1-013",
  "APP-V1-014",
  "APP-V1-015",
  "APP-V1-016",
  "APP-REL-001",
  "APP-REL-002",
  "APP-REL-003",
  "APP-REL-004",
  "APP-REL-005",
  "APP-REL-006",
];

/** Parse independent fixture data once; source byte decoding/parsing belongs to the separate reader tests. */
const parsed = (value) => JSON.parse(JSON.stringify(value));
const mapping = (entry, ...requirements) => ({ case: entry, requirements });
const inventory = (contractRevision, ...cases) => ({ contractRevision, cases });

/** Guard outside every rejection assertion so an absent module/export cannot masquerade as invalid-input handling. */
function predicate() {
  assert.equal(typeof subject.validateAcceptanceProfiles, "function", "Missing PROFILE-DECLARATIONS pure API");
  return subject.validateAcceptanceProfiles;
}

/** Unequal profile sizes, shared cross-profile identity and deliberately unsorted declarations are all intentional. */
function complete() {
  return parsed({
    metadata: {
      schemaVersion: 1,
      contractRevision: revision,
      profiles: {
        local: [
          mapping(first, "APP-V1-003"),
          mapping(second, "APP-V1-001", "APP-REL-005"),
          mapping(added, "APP-V1-010"),
        ],
        stage: [mapping(stageOnly, "APP-V1-014"), mapping(first, "APP-V1-003")],
        production: [mapping(smoke, "APP-REL-005", "APP-V1-015")],
      },
    },
    inventories: {
      local: inventory(revision, second, added, first),
      stage: inventory(revision, first, stageOnly),
      production: inventory(revision, smoke),
    },
    selectedContractRevision: revision,
    predecessorLocalInventory: inventory("docs-v1", first, second),
  });
}

/** Current inventory-bearing legacy suites retain their complete inventory and have no hosted declarations. */
function legacy() {
  return parsed({
    metadata: null,
    inventories: { local: inventory("docs-v1", second, first), stage: null, production: null },
    selectedContractRevision: "docs-v1",
    predecessorLocalInventory: null,
  });
}

/** Explicit expected projection of complete(), independent of the subject's selection or normalization logic. */
function expectedComplete() {
  return parsed({
    schemaVersion: 1,
    kind: "acceptance-profile-declarations",
    mode: "profiles-v1",
    contractRevision: revision,
    profiles: {
      local: {
        inventory: inventory(revision, second, added, first),
        mappings: [
          mapping(second, "APP-REL-005", "APP-V1-001"),
          mapping(added, "APP-V1-010"),
          mapping(first, "APP-V1-003"),
        ],
      },
      stage: {
        inventory: inventory(revision, first, stageOnly),
        mappings: [mapping(first, "APP-V1-003"), mapping(stageOnly, "APP-V1-014")],
      },
      production: {
        inventory: inventory(revision, smoke),
        mappings: [mapping(smoke, "APP-REL-005", "APP-V1-015")],
      },
    },
  });
}

function expectedLegacy() {
  return parsed({
    schemaVersion: 1,
    kind: "acceptance-profile-declarations",
    mode: "legacy-local",
    contractRevision: "docs-v1",
    profiles: {
      local: { inventory: inventory("docs-v1", second, first), mappings: null },
      stage: null,
      production: null,
    },
  });
}

/** Visit only ordinary acyclic fixture data, including array objects; no hostile JavaScript-object protocol is added. */
function references(value, found = new Set()) {
  if (value && typeof value === "object" && !found.has(value)) {
    found.add(value);
    for (const child of Object.values(value)) references(child, found);
  }
  return found;
}

function freeze(value) {
  for (const item of references(value)) Object.freeze(item);
  return value;
}

/** Verify values and caller-owned freeze state, catching an implementation that freezes its input. */
function snapshot(value) {
  return { value: structuredClone(value), frozen: [...references(value)].map((item) => [item, Object.isFrozen(item)]) };
}

function unchanged(value, before, label) {
  assert.deepEqual(value, before.value, `${label}: input values changed`);
  for (const [item, frozen] of before.frozen)
    assert.equal(Object.isFrozen(item), frozen, `${label}: caller-owned freeze state changed`);
}

/** A responsible rejection is synchronous, labeled, nonmutating and never an unrelated TypeError/setup failure. */
function rejectedUnchanged(check, fixture, label, privateValue = undefined) {
  const before = snapshot(fixture);
  assert.throws(
    () => check(fixture),
    (error) => {
      assert.ok(error instanceof TypeError, `${label}: rejection must be a TypeError`);
      assert.equal(error.code, errorCode, `${label}: wrong rejection code`);
      assert.equal(typeof error.message, "string");
      if (privateValue !== undefined) assert.ok(!error.message.includes(privateValue), `${label}: raw value leaked`);
      return true;
    },
    label,
  );
  unchanged(fixture, before, label);
}

/** Every single-fault rejection starts with a fresh passing counterpart and leaves its invalid input untouched. */
function rejected(cases, make = complete, expected = expectedComplete) {
  const check = predicate();
  for (const [label, mutate] of cases) {
    const fixture = make();
    const before = snapshot(fixture);
    assert.deepEqual(check(fixture), expected(), `${label}: valid counterpart`);
    unchanged(fixture, before, `${label}: valid counterpart`);
    mutate(fixture);
    rejectedUnchanged(check, fixture, label);
  }
}

test("the exact public API returns closed complete legacy and profile results synchronously", () => {
  const check = predicate();
  assert.deepEqual(Object.keys(subject), ["validateAcceptanceProfiles"]);
  assert.deepEqual(check(legacy()), expectedLegacy());
  assert.deepEqual(check(complete()), expectedComplete());
});

test("both modes return fresh deeply frozen data without freezing, aliasing or mutating caller inputs", () => {
  const check = predicate();
  for (const [make, expected] of [
    [legacy, expectedLegacy],
    [complete, expectedComplete],
  ]) {
    for (const frozenInput of [false, true]) {
      const input = make();
      if (frozenInput) freeze(input);
      const before = snapshot(input);
      const one = check(input);
      const two = check(input);
      assert.deepEqual(one, expected());
      assert.deepEqual(two, expected());
      unchanged(input, before, "successful immutable copy");
      const inputRefs = references(input);
      const firstRefs = references(one);
      for (const item of firstRefs) {
        assert.ok(Object.isFrozen(item), "Every nested result record and array must be frozen");
        assert.ok(!inputRefs.has(item), "Result must not alias input objects");
      }
      for (const item of references(two)) {
        assert.ok(Object.isFrozen(item));
        assert.ok(!inputRefs.has(item) && !firstRefs.has(item), "Each invocation requires a fresh deep copy");
      }
      assert.throws(() => one.profiles.local.inventory.cases.push(first), TypeError);
      assert.throws(() => {
        one.profiles.local.inventory.cases[0].title = "changed";
      }, TypeError);
      if (!frozenInput) {
        input.inventories.local.cases[0].title = "caller changed its own record";
        assert.deepEqual(one, expected(), "Later caller edits cannot alter an earlier result");
      }
    }
  }
});

test("declaration/key order is irrelevant while inventory order and code-point requirement order are retained", () => {
  const check = predicate();
  const input = complete();
  for (const profile of profiles) {
    input.metadata.profiles[profile].reverse();
    for (const entry of input.metadata.profiles[profile]) entry.requirements.reverse();
  }
  input.predecessorLocalInventory.cases.reverse();
  input.metadata = { profiles: input.metadata.profiles, contractRevision: revision, schemaVersion: 1 };
  input.inventories = {
    production: input.inventories.production,
    local: input.inventories.local,
    stage: input.inventories.stage,
  };
  assert.deepEqual(check(input), expectedComplete());
  input.inventories.local.cases.reverse();
  const expected = expectedComplete();
  expected.profiles.local.inventory.cases.reverse();
  expected.profiles.local.mappings.reverse();
  assert.deepEqual(check(input), expected);
});

test("all stable requirement IDs and valid revision grammar are accepted without an invented fixed contract name", () => {
  const check = predicate();
  for (const selected of ["v1", "9", "Host_9.V1-2"]) {
    const input = complete();
    input.selectedContractRevision = input.metadata.contractRevision = selected;
    for (const profile of profiles) input.inventories[profile].contractRevision = selected;
    input.predecessorLocalInventory.contractRevision = "Different_Predecessor.2";
    input.metadata.profiles.production[0].requirements = [...requirementIds].reverse();
    const output = check(input);
    assert.equal(output.contractRevision, selected);
    assert.deepEqual(output.profiles.production.mappings[0].requirements, [
      "APP-REL-001",
      "APP-REL-002",
      "APP-REL-003",
      "APP-REL-004",
      "APP-REL-005",
      "APP-REL-006",
      "APP-V1-001",
      "APP-V1-002",
      "APP-V1-003",
      "APP-V1-004",
      "APP-V1-005",
      "APP-V1-006",
      "APP-V1-007",
      "APP-V1-008",
      "APP-V1-009",
      "APP-V1-010",
      "APP-V1-011",
      "APP-V1-012",
      "APP-V1-013",
      "APP-V1-014",
      "APP-V1-015",
      "APP-V1-016",
    ]);
  }
});

test("case identities preserve tuple distinctions, Unicode and inert titles without interpreting paths or commands", () => {
  const check = predicate();
  const input = complete();
  const cases = [
    { file: "a.spec.ts", title: "same title" },
    { file: "b.spec.ts", title: "same title" },
    { file: "a.spec.ts", title: "different title" },
    { file: "A_1.v2-3.spec.ts", title: "Caf\u00e9" },
    { file: "A_1.v2-3.spec.ts", title: "Cafe\u0301" },
    { file: "nested/dir/probe.spec.ts", title: "literal :: curl https://example.invalid/$TOKEN" },
  ];
  input.inventories.stage.cases = parsed(cases);
  input.metadata.profiles.stage = parsed(cases.map((entry) => mapping(entry, "APP-V1-014")));
  assert.deepEqual(check(input).profiles.stage.inventory.cases, cases);
});

test("the selected contract is required and arguments never accept profile, path or authority overrides", () => {
  const check = predicate();
  assert.deepEqual(check(complete()), expectedComplete());
  for (const value of [undefined, null, true, 1, "{}", [], "stage"])
    rejectedUnchanged(check, value, "invalid argument record");
  rejected([
    [
      "profile selector",
      (f) => {
        f.profile = "production";
      },
    ],
    [
      "environment selector",
      (f) => {
        f.environment = { ACCEPTANCE_PROFILE: "stage" };
      },
    ],
    [
      "source path",
      (f) => {
        f.root = "/untrusted/source";
      },
    ],
    [
      "arbitrary URL",
      (f) => {
        f.url = "https://example.invalid";
      },
    ],
    [
      "unknown argument",
      (f) => {
        f.additional = null;
      },
    ],
  ]);
});

const records = [
  ["arguments", (f) => f],
  ["inventories", (f) => f.inventories],
  ["metadata", (f) => f.metadata],
  ["profiles", (f) => f.metadata.profiles],
  ["predecessor inventory", (f) => f.predecessorLocalInventory],
  ["predecessor case", (f) => f.predecessorLocalInventory.cases[0]],
  ...profiles.flatMap((profile) => [
    [`${profile} inventory`, (f) => f.inventories[profile]],
    [`${profile} inventory case`, (f) => f.inventories[profile].cases[0]],
    [`${profile} mapping`, (f) => f.metadata.profiles[profile][0]],
    [`${profile} mapping case`, (f) => f.metadata.profiles[profile][0].case],
  ]),
];

test("every record is closed and every displayed field must be present, including explicit absence fields", () => {
  const cases = [];
  for (const [label, select] of records) {
    cases.push([
      `${label} unknown field`,
      (f) => {
        select(f).unexpected = "unreviewed value";
      },
    ]);
    for (const field of Object.keys(select(complete())))
      cases.push([
        `${label} omitted ${field}`,
        (f) => {
          delete select(f)[field];
        },
      ]);
  }
  rejected(cases);
  rejected(
    Object.keys(legacy()).map((field) => [
      `legacy omitted ${field}`,
      (f) => {
        delete f[field];
      },
    ]),
    legacy,
    expectedLegacy,
  );
});

test("record-valued positions reject null, arrays and primitives rather than coercing them", () => {
  const positions = [
    [
      "inventories",
      (f, value) => {
        f.inventories = value;
      },
    ],
    [
      "metadata",
      (f, value) => {
        f.metadata = value;
      },
    ],
    [
      "profiles",
      (f, value) => {
        f.metadata.profiles = value;
      },
    ],
    [
      "predecessor inventory",
      (f, value) => {
        f.predecessorLocalInventory = value;
      },
    ],
    [
      "predecessor case",
      (f, value) => {
        f.predecessorLocalInventory.cases[0] = value;
      },
    ],
    ...profiles.flatMap((profile) => [
      [
        `${profile} inventory`,
        (f, value) => {
          f.inventories[profile] = value;
        },
      ],
      [
        `${profile} inventory case`,
        (f, value) => {
          f.inventories[profile].cases[0] = value;
        },
      ],
      [
        `${profile} mapping`,
        (f, value) => {
          f.metadata.profiles[profile][0] = value;
        },
      ],
      [
        `${profile} mapping case`,
        (f, value) => {
          f.metadata.profiles[profile][0].case = value;
        },
      ],
    ]),
  ];
  rejected(
    positions.flatMap(([label, replace]) =>
      [null, undefined, [], "record", 1, false].map((value, index) => [
        `${label} wrong type ${index}`,
        (f) => replace(f, value),
      ]),
    ),
  );
});

test("array-valued positions require nonempty arrays with valid members", () => {
  const arrays = [
    ["predecessor cases", (f) => f.predecessorLocalInventory, "cases"],
    ...profiles.flatMap((profile) => [
      [`${profile} cases`, (f) => f.inventories[profile], "cases"],
      [`${profile} mappings`, (f) => f.metadata.profiles, profile],
      [`${profile} requirements`, (f) => f.metadata.profiles[profile][0], "requirements"],
    ]),
  ];
  rejected(
    arrays.flatMap(([label, select, key]) =>
      [null, undefined, {}, "[]", 1, false, []].map((value, index) => [
        `${label} invalid array ${index}`,
        (f) => {
          select(f)[key] = value;
        },
      ]),
    ),
  );
});

test("hosted inventories and mappings cannot both be empty even when their exact sets agree", () => {
  rejected(
    ["stage", "production"].map((profile) => [
      `${profile} coherently empty inventory and mappings`,
      (f) => {
        f.inventories[profile].cases = [];
        f.metadata.profiles[profile] = [];
      },
    ]),
  );
});

test("only numeric schema version one is accepted, with no unsupported-version fallback", () => {
  rejected(
    [0, 2, -1, 1.5, "1", null, undefined, true, {}, [], NaN, Infinity, -Infinity].map((value, index) => [
      `schema version ${index}`,
      (f) => {
        f.metadata.schemaVersion = value;
      },
    ]),
  );
});

test("every revision has the closed grammar and selected metadata/inventory revisions agree exactly", () => {
  const revisions = [
    [
      "selected",
      (f, value) => {
        f.selectedContractRevision = value;
      },
    ],
    [
      "metadata",
      (f, value) => {
        f.metadata.contractRevision = value;
      },
    ],
    [
      "predecessor",
      (f, value) => {
        f.predecessorLocalInventory.contractRevision = value;
      },
    ],
    ...profiles.map((profile) => [
      profile,
      (f, value) => {
        f.inventories[profile].contractRevision = value;
      },
    ]),
  ];
  rejected(
    revisions.flatMap(([label, replace]) =>
      [undefined, null, 1, false, {}, [], "", " bad", "bad ", "-bad", "bad/name", "bad\nname", "révision"].map(
        (value, index) => [`${label} invalid revision ${index}`, (f) => replace(f, value)],
      ),
    ),
  );
  rejected(
    revisions
      .filter(([label]) => label !== "predecessor")
      .map(([label, replace]) => [`${label} mismatched revision`, (f) => replace(f, "different-v1")]),
  );
  rejected(
    [
      [
        "legacy selected revision mismatch",
        (f) => {
          f.selectedContractRevision = "different-v1";
        },
      ],
    ],
    legacy,
    expectedLegacy,
  );
});

test("matching invalid revisions cannot pass merely because all selected declarations agree", () => {
  rejected(
    [null, 1, false, "", "-bad", " bad", "bad ", "bad/name", "bad\nname", "révision"].map((value, index) => [
      `coherent invalid revision ${index}`,
      (f) => {
        f.selectedContractRevision = f.metadata.contractRevision = value;
        for (const profile of profiles) f.inventories[profile].contractRevision = value;
      },
    ]),
  );
});

test("all three profiles are atomic and missing metadata means only explicit complete local legacy behavior", () => {
  rejected([
    [
      "absent metadata with hosted inventories",
      (f) => {
        f.metadata = null;
      },
    ],
    [
      "absent predecessor",
      (f) => {
        f.predecessorLocalInventory = null;
      },
    ],
    [
      "unknown profile",
      (f) => {
        f.metadata.profiles.preview = f.metadata.profiles.stage;
      },
    ],
    [
      "disabled stage",
      (f) => {
        f.metadata.profiles.stage = false;
      },
    ],
    [
      "hosted inventory path override",
      (f) => {
        f.inventories.path = "other.json";
      },
    ],
  ]);
  rejected(
    [
      [
        "legacy stage inventory",
        (f) => {
          f.inventories.stage = inventory("docs-v1", stageOnly);
        },
      ],
      [
        "legacy production inventory",
        (f) => {
          f.inventories.production = inventory("docs-v1", smoke);
        },
      ],
      [
        "legacy predecessor is not null",
        (f) => {
          f.predecessorLocalInventory = inventory("r3", first);
        },
      ],
      [
        "legacy undefined metadata",
        (f) => {
          f.metadata = undefined;
        },
      ],
      [
        "legacy undefined predecessor",
        (f) => {
          f.predecessorLocalInventory = undefined;
        },
      ],
      [
        "legacy undefined stage",
        (f) => {
          f.inventories.stage = undefined;
        },
      ],
      [
        "legacy undefined production",
        (f) => {
          f.inventories.production = undefined;
        },
      ],
      [
        "legacy missing local",
        (f) => {
          f.inventories.local = null;
        },
      ],
      [
        "legacy empty local",
        (f) => {
          f.inventories.local.cases = [];
        },
      ],
    ],
    legacy,
    expectedLegacy,
  );
});

test("legacy local applies shared closed inventory/case shapes, types, revision grammar and unique tuples", () => {
  const legacyRecords = [
    ["inventory map", (f) => f.inventories],
    ["local inventory", (f) => f.inventories.local],
    ["local case", (f) => f.inventories.local.cases[0]],
  ];
  rejected(
    [
      ...legacyRecords.flatMap(([label, select]) => [
        [
          `legacy ${label} unknown field`,
          (f) => {
            select(f).unexpected = "unreviewed";
          },
        ],
        ...Object.keys(select(legacy())).map((field) => [
          `legacy ${label} missing ${field}`,
          (f) => {
            delete select(f)[field];
          },
        ]),
      ]),
      [
        "legacy malformed local inventory",
        (f) => {
          f.inventories.local = [];
        },
      ],
      [
        "legacy malformed cases array",
        (f) => {
          f.inventories.local.cases = {};
        },
      ],
      [
        "legacy null case",
        (f) => {
          f.inventories.local.cases[0] = null;
        },
      ],
      [
        "legacy array case",
        (f) => {
          f.inventories.local.cases[0] = [];
        },
      ],
      [
        "legacy non-string file",
        (f) => {
          f.inventories.local.cases[0].file = 42;
        },
      ],
      [
        "legacy traversal file",
        (f) => {
          f.inventories.local.cases[0].file = "../escape.spec.ts";
        },
      ],
      [
        "legacy non-string title",
        (f) => {
          f.inventories.local.cases[0].title = false;
        },
      ],
      [
        "legacy untrimmed title",
        (f) => {
          f.inventories.local.cases[0].title = " leading";
        },
      ],
      [
        "legacy control character title",
        (f) => {
          f.inventories.local.cases[0].title = "inside\u0000title";
        },
      ],
      [
        "legacy duplicate tuple",
        (f) => {
          f.inventories.local.cases.push(parsed(f.inventories.local.cases[0]));
        },
      ],
      ...["invalid/revision", null].map((value, index) => [
        `legacy coherently invalid revision ${index}`,
        (f) => {
          f.selectedContractRevision = f.inventories.local.contractRevision = value;
        },
      ]),
    ],
    legacy,
    expectedLegacy,
  );
});

test("exact inventory sets reject omissions, extras, equal-count substitutions and duplicate tuples for each profile", () => {
  rejected(
    profiles.flatMap((profile) => [
      [
        `${profile} missing mapping`,
        (f) => {
          f.metadata.profiles[profile].pop();
        },
      ],
      [
        `${profile} extra inventory`,
        (f) => {
          f.inventories[profile].cases.push({ file: "extra.spec.ts", title: "Extra" });
        },
      ],
      [
        `${profile} extra mapping`,
        (f) => {
          f.metadata.profiles[profile].push(mapping({ file: "extra.spec.ts", title: "Extra" }, "APP-V1-001"));
        },
      ],
      [
        `${profile} same-count title substitution`,
        (f) => {
          f.metadata.profiles[profile][0].case.title += " changed";
        },
      ],
      [
        `${profile} same-count file substitution`,
        (f) => {
          f.metadata.profiles[profile][0].case.file = "different.spec.ts";
        },
      ],
      [
        `${profile} case-folded title substitution`,
        (f) => {
          f.metadata.profiles[profile][0].case.title = f.metadata.profiles[profile][0].case.title.toUpperCase();
        },
      ],
      [
        `${profile} case-folded file substitution`,
        (f) => {
          const entry = f.metadata.profiles[profile][0].case;
          entry.file = entry.file[0].toUpperCase() + entry.file.slice(1);
        },
      ],
      [
        `${profile} duplicate inventory tuple`,
        (f) => {
          f.inventories[profile].cases.push(parsed(f.inventories[profile].cases[0]));
        },
      ],
      [
        `${profile} duplicate mapping tuple`,
        (f) => {
          f.metadata.profiles[profile].push(parsed(f.metadata.profiles[profile][0]));
        },
      ],
      [
        `${profile} duplicate both sides`,
        (f) => {
          f.inventories[profile].cases.push(parsed(f.inventories[profile].cases[0]));
          f.metadata.profiles[profile].push(parsed(f.metadata.profiles[profile][0]));
        },
      ],
    ]),
  );
});

test("predecessor preservation is tuple containment, with no count-only or declaration-owned substitute", () => {
  rejected([
    [
      "missing retained first case",
      (f) => {
        f.inventories.local.cases = f.inventories.local.cases.filter((entry) => entry.title !== first.title);
        f.metadata.profiles.local = f.metadata.profiles.local.filter((entry) => entry.case.title !== first.title);
      },
    ],
    [
      "same-count replacement loses predecessor",
      (f) => {
        f.inventories.local.cases.at(-1).title = "Replacement";
        f.metadata.profiles.local[0].case.title = "Replacement";
      },
    ],
    [
      "unknown predecessor tuple",
      (f) => {
        f.predecessorLocalInventory.cases.push({ file: "unpreserved.spec.ts", title: "Unpreserved" });
      },
    ],
    [
      "duplicate predecessor tuple",
      (f) => {
        f.predecessorLocalInventory.cases.push(parsed(first));
      },
    ],
    [
      "predecessor identity override in metadata",
      (f) => {
        f.metadata.predecessorLocalInventory = inventory("older-v1", second);
      },
    ],
  ]);
});

test("case file and title grammar applies equally to inventory, predecessor and mapping references", () => {
  const caseRecords = records.filter(([label]) => label.endsWith(" case"));
  const invalidFiles = [
    undefined,
    null,
    1,
    false,
    {},
    [],
    "",
    "/absolute.spec.ts",
    "../escape.spec.ts",
    "dir/../escape.spec.ts",
    "./a.spec.ts",
    "a//b.spec.ts",
    "a\\b.spec.ts",
    ["C:", "a.spec.ts"].join("/"),
    "https://example.invalid/a.spec.ts",
    "a.spec.ts?x",
    "a.spec.ts#x",
    "a.spec.js",
    "a.ts",
    ".spec.ts",
    "a spec.ts",
    "é.spec.ts",
  ];
  const invalidTitles = [
    undefined,
    null,
    1,
    false,
    {},
    [],
    "",
    " leading",
    "trailing ",
    "\u00a0trimmed",
    "trimmed\ufeff",
    ...Array.from({ length: 32 }, (_, code) => `inside${String.fromCharCode(code)}title`),
    "inside\u007ftitle",
  ];
  rejected(
    caseRecords.flatMap(([label, select]) => [
      ...invalidFiles.map((value, index) => [
        `${label} invalid file ${index}`,
        (f) => {
          select(f).file = value;
        },
      ]),
      ...invalidTitles.map((value, index) => [
        `${label} invalid title ${index}`,
        (f) => {
          select(f).title = value;
        },
      ]),
    ]),
  );
});

test("coherent invalid tuple values fail grammar even when mapping, inventory and predecessor sets still agree", () => {
  const badFields = [
    [
      "file",
      [
        null,
        1,
        false,
        "",
        "/a.spec.ts",
        "../a.spec.ts",
        "dir/../a.spec.ts",
        "./a.spec.ts",
        "a//b.spec.ts",
        "a\\b.spec.ts",
        ["C:", "a.spec.ts"].join("/"),
        "a.spec.ts?x",
        "a.spec.ts#x",
        "a.spec.js",
        "a.ts",
        ".spec.ts",
        "a spec.ts",
        "é.spec.ts",
      ],
    ],
    [
      "title",
      [
        null,
        1,
        false,
        "",
        " leading",
        "trailing ",
        "\u00a0trimmed",
        "trimmed\ufeff",
        ...Array.from({ length: 32 }, (_, code) => `inside${String.fromCharCode(code)}title`),
        "inside\u007ftitle",
      ],
    ],
  ];
  rejected(
    badFields.flatMap(([field, values]) =>
      values.map((value, index) => [
        `coherent invalid ${field} ${index}`,
        (f) => {
          f.inventories.local.cases.at(-1)[field] = value;
          f.metadata.profiles.local[0].case[field] = value;
          f.predecessorLocalInventory.cases[0][field] = value;
        },
      ]),
    ),
  );
});

test("requirement references reject unknown families/ranges/types, duplicates and added authority fields", () => {
  const invalid = [
    undefined,
    null,
    1,
    false,
    {},
    [],
    "",
    "APP-V1-000",
    "APP-V1-017",
    "APP-REL-000",
    "APP-REL-007",
    "APP-V1-1",
    "APP-V2-001",
    "app-v1-001",
    " APP-V1-001",
    "APP-V1-001 ",
    "APP-V1-001\n",
    "https://example.invalid",
  ];
  rejected(
    profiles.flatMap((profile) => [
      ...invalid.map((value, index) => [
        `${profile} invalid requirement ${index}`,
        (f) => {
          f.metadata.profiles[profile][0].requirements = [value];
        },
      ]),
      [
        `${profile} duplicate requirement`,
        (f) => {
          f.metadata.profiles[profile][0].requirements = ["APP-V1-001", "APP-V1-001"];
        },
      ],
      ...["command", "url", "credentials", "environment", "inventoryPath", "allowFaults", "deployable"].map((field) => [
        `${profile} forbidden authority ${field}`,
        (f) => {
          f.metadata.profiles[profile][0][field] = "unreviewed";
        },
      ]),
    ]),
  );
});

test("rejection diagnostics never echo raw supplied values", () => {
  const check = predicate();
  const marker = "PRIVATE_DECLARATION_VALUE_7b6d41";
  for (const mutate of [
    (f) => {
      f.selectedContractRevision = `https://example.invalid/${marker}`;
    },
    (f) => {
      f.metadata.profiles.stage[0].requirements = [marker];
    },
    (f) => {
      f.metadata.profiles.local[0].case.title = marker;
    },
    (f) => {
      f.metadata.credentials = marker;
    },
  ]) {
    const input = complete();
    assert.deepEqual(check(input), expectedComplete());
    mutate(input);
    rejectedUnchanged(check, input, "sanitized diagnostic", marker);
  }
});

test("the rejection oracle refuses mutation-then-throw, wrong labels and unrelated setup errors", () => {
  predicate();
  const ownedError = () => Object.assign(new TypeError("Owned declaration rejection"), { code: errorCode });
  rejectedUnchanged(
    () => {
      throw ownedError();
    },
    complete(),
    "owned clean rejection",
  );
  for (const bad of [
    (input) => {
      input.metadata.contractRevision = "mutated";
      throw ownedError();
    },
    (input) => {
      Object.freeze(input.metadata);
      throw ownedError();
    },
    () => {
      throw new TypeError("Unrelated setup failure");
    },
    () => {
      throw Object.assign(new Error("Wrong error type"), { code: errorCode });
    },
    () => undefined,
  ])
    assert.throws(() => rejectedUnchanged(bad, complete(), "owned faulty rejection"), assert.AssertionError);
});
