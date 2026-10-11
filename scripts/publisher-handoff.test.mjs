/**
 * Independent PUBLISHER-HANDOFF expectations, authored before the emitter/receipt implementation.
 * Run `node --test scripts/publisher-handoff.test.mjs` with pinned Node after the existing locked tools are installed.
 * Literal synthetic identities establish no GitHub, release or deployment authority. Pure checks exercise both APIs;
 * credential-free receipt subprocesses write disposable fixtures only, deny network/child execution and clean up.
 * A VM subprocess denies ambient I/O/clock access during import and representative pure calls. Missing APIs fail before
 * rejection assertions: availability red is not behavioral refusal evidence. Historical authentication is a later card.
 * Legacy workflow guard mutations use immutable protected Git source 2ae305c, read through bounded read-only Git.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { requireReleaseWorkflow } from "./publish-release-evidence.mjs";

const moduleUrl = new URL("./publisher-handoff.mjs", import.meta.url);
const subject = existsSync(moduleUrl) ? await import(moduleUrl.href) : {};
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
function clone(value) {
  if (Buffer.isBuffer(value)) return Buffer.from(value);
  if (value instanceof DataView)
    return new DataView(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
  if (ArrayBuffer.isView(value)) return new value.constructor(value);
  if (value instanceof ArrayBuffer) return value.slice(0);
  if (Array.isArray(value)) return value.map(clone);
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
  return value;
}
const assetNames = [
  "SHA256SUMS",
  "api.docker.tar",
  "ci-origin.json",
  "e2e-result.json",
  "frontend.docker.tar",
  "manifest.json",
  "publication-notes.md",
  "publication.json",
  "release-notes.md",
  "reservation.json",
];
const assetHashes = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "a"].map((digit) => digit.repeat(64));
const source = "1".repeat(40);
const base = "2".repeat(40);
const tree = "3".repeat(40);
const repository = "example/private-mp3";
const marker = "PUBLISHER_HANDOFF_V1 ";
const artifactDigest = "d".repeat(64);

function input(attempt = 3) {
  return {
    originalContext: {
      repository,
      eventName: "push",
      ref: "refs/heads/main",
      sourceRevision: source,
      sourceTree: tree,
      baseRevision: base,
      workflowRevision: source,
      toolingRevision: base,
      runId: 87001,
      attempt: 1,
    },
    admissionSha256: "b".repeat(64),
    publisherContext: {
      schemaVersion: 1,
      repository,
      sourceRevision: source,
      baseRevision: base,
      runId: 87001,
      attempt,
      workflow: ".github/workflows/ci.yml",
      workflowRevision: source,
    },
    repository: { id: 31001, ownerId: 42002 },
    release: {
      id: 73001,
      version: "0.3.33",
      tag: "v0.3.33",
      reservationSha256: "e".repeat(64),
      publicationSha256: "8".repeat(64),
      publicationBindingSha256: "f".repeat(64),
      assets: assetNames.map((name, index) => ({
        id: 91001 + index,
        name,
        bytes: 201 + index,
        sha256: assetHashes[index],
      })),
    },
  };
}
function record(attempt = 3) {
  return {
    schemaVersion: 1,
    kind: "publisher-handoff",
    status: "released-not-deployed",
    deployed: false,
    ...input(attempt),
  };
}
function receiptInput(attempt = 3) {
  return {
    handoffBytes: Buffer.from(JSON.stringify(record(attempt), null, 2) + "\n"),
    artifactId: 62001,
    artifactSha256: artifactDigest,
  };
}
function expectedReceipt(value = receiptInput()) {
  const r = JSON.parse(Buffer.from(value.handoffBytes).toString("utf8"));
  return {
    schemaVersion: 1,
    kind: "publisher-handoff-receipt",
    repository,
    sourceRevision: source,
    runId: 87001,
    attempt: r.publisherContext.attempt,
    artifactId: value.artifactId,
    artifactName: `publisher-handoff-${source}-87001-${r.publisherContext.attempt}`,
    artifactSha256: value.artifactSha256,
    handoffSha256: sha(value.handoffBytes),
  };
}
function api(name) {
  assert.equal(typeof subject[name], "function", `Missing PUBLISHER-HANDOFF API ${name}; availability red only`);
  return subject[name];
}
function frozen(value) {
  if (value !== null && typeof value === "object") {
    assert(Object.isFrozen(value), "Every returned record/array must be frozen");
    for (const child of Object.values(value)) frozen(child);
  }
}
/** Capture reference identity and property state as well as values; freezing an input is a mutation too. */
function inputState(root) {
  const states = [];
  const seen = new Set();
  const visit = (value) => {
    if (value === null || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    const descriptors = Object.getOwnPropertyDescriptors(value);
    states.push({
      value,
      descriptors,
      keys: Reflect.ownKeys(value),
      prototype: Object.getPrototypeOf(value),
      extensible: Object.isExtensible(value),
      sealed: Object.isSealed(value),
      frozen: Object.isFrozen(value),
    });
    for (const descriptor of Object.values(descriptors))
      if (Object.hasOwn(descriptor, "value")) visit(descriptor.value);
  };
  visit(root);
  return states;
}
function unchangedState(states) {
  for (const before of states) {
    const value = before.value;
    assert.deepEqual(Reflect.ownKeys(value), before.keys, "Input property set changed");
    assert.equal(Object.getPrototypeOf(value), before.prototype, "Input prototype changed");
    assert.equal(Object.isExtensible(value), before.extensible, "Input extensibility changed");
    assert.equal(Object.isSealed(value), before.sealed, "Input sealed state changed");
    assert.equal(Object.isFrozen(value), before.frozen, "Input frozen state changed");
    for (const key of before.keys) {
      const actual = Object.getOwnPropertyDescriptor(value, key);
      const expected = before.descriptors[key];
      assert.deepEqual(Object.keys(actual), Object.keys(expected), "Input descriptor kind changed");
      for (const field of Object.keys(expected))
        assert.equal(actual[field], expected[field], `Input descriptor ${String(key)}/${field} changed`);
    }
  }
}
function detached(value, states) {
  const inputs = new Set(states.map((state) => state.value));
  const visit = (result) => {
    if (result === null || typeof result !== "object") return;
    assert(!inputs.has(result), "Returned object aliases an input object");
    for (const child of Object.values(result)) visit(child);
  };
  visit(value);
}
function passing(name, value, expected) {
  const before = clone(value);
  const states = inputState(value);
  const actual = api(name)(value);
  assert.deepEqual(actual, expected);
  assert.deepEqual(value, before, "Pure call changed its input");
  unchangedState(states);
  detached(actual, states);
  frozen(actual);
  return actual;
}
function refusal(fn, value, label) {
  const before = clone(value);
  const states = inputState(value);
  let error;
  try {
    fn(value);
  } catch (caught) {
    error = caught;
  }
  assert(error instanceof Error, `${label}: expected synchronous refusal`);
  assert.deepEqual(value, before, `${label}: rejected input was mutated`);
  unchangedState(states);
}
function negatives(name, rows, fixture = input) {
  const fn = api(name);
  const valid = fixture();
  assert.doesNotThrow(() => fn(valid), "Valid counterpart must reach the intended API");
  for (const [label, mutate] of rows) {
    let bad = fixture();
    const replacement = mutate(bad);
    if (replacement !== undefined) bad = replacement;
    refusal(fn, bad, label);
  }
}
const containers = [null, [], 1, "record", true];
const integers = [0, -1, 1.1, Number.MAX_SAFE_INTEGER + 1, Infinity, NaN, "1", null];
const hashes = ["", "1".repeat(63), "1".repeat(65), "A".repeat(64), "g".repeat(64), "1".repeat(64) + "\n", null, 12];
const revisions = ["main", "a".repeat(39), "a".repeat(41), "A".repeat(40), "a".repeat(40) + "\n", null, 40];
const objectPaths = [
  [],
  ["originalContext"],
  ["publisherContext"],
  ["repository"],
  ["release"],
  ["release", "assets", 0],
];
const at = (object, path) => path.reduce((value, key) => value[key], object);

// Each expected record is built from independent literals, never from a subject output.
test("handoff returns the exact closed literal record and preserves original attempt on publisher retry", () => {
  for (const attempt of [1, 3]) passing("createPublisherHandoff", input(attempt), record(attempt));
});
test("both APIs return fresh deep-frozen detached output without changing even frozen input", () => {
  const deepFreeze = (value) => {
    if (value && typeof value === "object" && !ArrayBuffer.isView(value)) {
      for (const child of Object.values(value)) deepFreeze(child);
      Object.freeze(value);
    }
    return value;
  };
  const fixture = deepFreeze(input());
  const a = passing("createPublisherHandoff", fixture, record());
  const b = passing("createPublisherHandoff", fixture, record());
  assert.notEqual(a, b);
  assert.notEqual(a.release.assets, b.release.assets);
  assert.notEqual(a.originalContext, fixture.originalContext);
  const r = receiptInput();
  const x = passing("createPublisherReceipt", r, expectedReceipt(r));
  const y = passing("createPublisherReceipt", r, expectedReceipt(r));
  assert.notEqual(x, y);
});
test("mutable inputs retain every reference, descriptor and unfrozen state while both outputs are detached", () => {
  const handoff = input();
  for (const state of inputState(handoff)) assert.equal(state.frozen, false);
  passing("createPublisherHandoff", handoff, record());
  const receipt = receiptInput();
  for (const state of inputState(receipt)) assert.equal(state.frozen, false);
  passing("createPublisherReceipt", receipt, expectedReceipt(receipt));
  const malformedHandoff = input();
  malformedHandoff.release.tag = "wrong";
  refusal(api("createPublisherHandoff"), malformedHandoff, "malformed mutable handoff");
  const malformedReceipt = receiptInput();
  malformedReceipt.artifactId = 0;
  refusal(api("createPublisherReceipt"), malformedReceipt, "malformed mutable receipt");
});
test("handoff closed schema rejects every omitted and unexpected key at every record level", () => {
  const rows = [];
  for (const path of objectPaths) {
    rows.push([
      `extra ${path}`,
      (f) => {
        at(f, path).unexpected = true;
      },
    ]);
    for (const key of Object.keys(at(input(), path)))
      rows.push([
        `missing ${path}/${key}`,
        (f) => {
          delete at(f, path)[key];
        },
      ]);
  }
  negatives("createPublisherHandoff", rows);
});
test("handoff root and nested containers must be records and the asset collection an array", () => {
  negatives("createPublisherHandoff", [
    ...containers.map((bad) => ["root", () => bad]),
    ...objectPaths.slice(1).flatMap((path) =>
      containers.map((bad) => [
        String(path),
        (f) => {
          at(f, path.slice(0, -1))[path.at(-1)] = bad;
        },
      ]),
    ),
    ...[null, {}, "assets", 10].map((bad) => [
      "assets",
      (f) => {
        f.release.assets = bad;
      },
    ]),
  ]);
});
test("handoff never admits authority, credentials, URL, registry or profile selector additions", () => {
  negatives(
    "createPublisherHandoff",
    ["authenticated", "approved", "deployable", "credentials", "url", "profile", "registryDigest"].flatMap((key) =>
      objectPaths.map((path) => [
        `${path}/${key}`,
        (f) => {
          at(f, path)[key] = "synthetic";
        },
      ]),
    ),
  );
});
test("all exact source/base/tree/workflow revisions reject invalid grammar without coercion", () => {
  negatives("createPublisherHandoff", [
    ...["sourceRevision", "sourceTree", "baseRevision", "workflowRevision", "toolingRevision"].flatMap((key) =>
      revisions.map((bad) => [
        `original ${key}`,
        (f) => {
          f.originalContext[key] = bad;
        },
      ]),
    ),
    ...["sourceRevision", "baseRevision", "workflowRevision"].flatMap((key) =>
      revisions.map((bad) => [
        `publisher ${key}`,
        (f) => {
          f.publisherContext[key] = bad;
        },
      ]),
    ),
  ]);
});
test("original admission is push/main and both contexts retain the same exact source boundary", () => {
  negatives("createPublisherHandoff", [
    [
      "PR",
      (f) => {
        f.originalContext.eventName = "pull_request";
      },
    ],
    [
      "other ref",
      (f) => {
        f.originalContext.ref = "refs/heads/feature";
      },
    ],
    [
      "original workflow mismatch",
      (f) => {
        f.originalContext.workflowRevision = base;
      },
    ],
    [
      "original tooling mismatch",
      (f) => {
        f.originalContext.toolingRevision = source;
      },
    ],
    ...["sourceRevision", "baseRevision", "workflowRevision"].map((key) => [
      key,
      (f) => {
        f.publisherContext[key] = "4".repeat(40);
      },
    ]),
    [
      "repo",
      (f) => {
        f.publisherContext.repository = "other/private-mp3";
      },
    ],
    [
      "run",
      (f) => {
        f.publisherContext.runId += 1;
      },
    ],
    [
      "earlier publisher",
      (f) => {
        f.originalContext.attempt = 4;
      },
    ],
    [
      "wrong workflow",
      (f) => {
        f.publisherContext.workflow = ".github/workflows/deploy.yml";
      },
    ],
    [
      "workflow URL",
      (f) => {
        f.publisherContext.workflow = "https://example.invalid/ci.yml";
      },
    ],
    [
      "publisher schema",
      (f) => {
        f.publisherContext.schemaVersion = 2;
      },
    ],
  ]);
});
test("repository names require the existing owner/repository grammar in both contexts", () => {
  negatives(
    "createPublisherHandoff",
    ["", "repo", "a/b/c", "/repo", "a/", "a/b\n", "https://github.com/a/b", null, 2].map((bad) => [
      "repository",
      (f) => {
        f.originalContext.repository = f.publisherContext.repository = bad;
      },
    ]),
  );
});
test("all run, attempt, repository, owner, release and asset identifiers are positive safe integers", () => {
  const paths = [
    ["originalContext", "runId"],
    ["originalContext", "attempt"],
    ["publisherContext", "runId"],
    ["publisherContext", "attempt"],
    ["repository", "id"],
    ["repository", "ownerId"],
    ["release", "id"],
    ["release", "assets", 0, "id"],
    ["release", "assets", 0, "bytes"],
  ];
  negatives(
    "createPublisherHandoff",
    paths.flatMap((path) =>
      integers.map((bad) => [
        String(path),
        (f) => {
          at(f, path.slice(0, -1))[path.at(-1)] = bad;
        },
      ]),
    ),
  );
});
test("SHA256 fields are exact lowercase digests and publication raw hash matches its asset row", () => {
  const paths = [
    ["admissionSha256"],
    ["release", "reservationSha256"],
    ["release", "publicationSha256"],
    ["release", "publicationBindingSha256"],
    ["release", "assets", 0, "sha256"],
  ];
  negatives("createPublisherHandoff", [
    ...paths.flatMap((path) =>
      hashes.map((bad) => [
        String(path),
        (f) => {
          at(f, path.slice(0, -1))[path.at(-1)] = bad;
        },
      ]),
    ),
    [
      "publication row differs",
      (f) => {
        f.release.assets[7].sha256 = "c".repeat(64);
      },
    ],
    [
      "canonical substituted for raw",
      (f) => {
        f.release.publicationSha256 = f.release.publicationBindingSha256;
      },
    ],
  ]);
});
test("version and exact v-prefixed tag follow existing safe numeric release grammar", () => {
  negatives("createPublisherHandoff", [
    ...[
      "latest",
      "v0.3.33",
      "0.03.33",
      "0.3.033",
      "0.3",
      "0.3.33-rc.1",
      "0.3.33+build",
      "0.3.9007199254740992",
      "0.3.33\n",
      null,
    ].map((bad) => [
      "version",
      (f) => {
        f.release.version = bad;
        f.release.tag = `v${bad}`;
      },
    ]),
    ...["0.3.33", "v0.3.34", "v0.3.33\n", null].map((bad) => [
      "tag",
      (f) => {
        f.release.tag = bad;
      },
    ]),
  ]);
});
test("ten exact asset names, distinct observed IDs and ASCII order are mandatory", () => {
  negatives("createPublisherHandoff", [
    [
      "missing",
      (f) => {
        f.release.assets.pop();
      },
    ],
    [
      "extra",
      (f) => {
        f.release.assets.push({ id: 100000, name: "extra.json", bytes: 1, sha256: "c".repeat(64) });
      },
    ],
    [
      "reversed",
      (f) => {
        f.release.assets.reverse();
      },
    ],
    [
      "duplicate name",
      (f) => {
        f.release.assets[1].name = f.release.assets[0].name;
      },
    ],
    [
      "duplicate ID",
      (f) => {
        f.release.assets[1].id = f.release.assets[0].id;
      },
    ],
    [
      "unknown",
      (f) => {
        f.release.assets[0].name = "archive.zip";
      },
    ],
    [
      "path",
      (f) => {
        f.release.assets[0].name = "../SHA256SUMS";
      },
    ],
    [
      "partial state claim",
      (f) => {
        f.release.assets[0].state = "starter";
      },
    ],
  ]);
});
test("valid safe-integer boundaries and distinct raw/canonical digests are preserved", () => {
  const f = input();
  f.originalContext.runId = f.publisherContext.runId = Number.MAX_SAFE_INTEGER;
  f.publisherContext.attempt = Number.MAX_SAFE_INTEGER;
  f.repository.id = f.repository.ownerId = f.release.id = Number.MAX_SAFE_INTEGER;
  f.release.assets[0].id = f.release.assets[0].bytes = Number.MAX_SAFE_INTEGER;
  const expected = {
    schemaVersion: 1,
    kind: "publisher-handoff",
    status: "released-not-deployed",
    deployed: false,
    ...clone(f),
  };
  passing("createPublisherHandoff", f, expected);
  assert.notEqual(expected.release.reservationSha256, expected.release.assets[9].sha256);
  assert.notEqual(expected.release.publicationSha256, expected.release.publicationBindingSha256);
});
test("receipt binds exact raw bytes, uses publisher attempt and accepts Buffer or Uint8Array views", () => {
  for (const attempt of [1, 3]) {
    const f = receiptInput(attempt);
    passing("createPublisherReceipt", f, expectedReceipt(f));
    const padded = Buffer.concat([Buffer.from("prefix"), f.handoffBytes, Buffer.from("suffix")]);
    const view = new Uint8Array(padded.buffer, padded.byteOffset + 6, f.handoffBytes.length);
    passing("createPublisherReceipt", { ...f, handoffBytes: view }, expectedReceipt(f));
  }
});
test("receipt hashes whitespace-sensitive actual bytes rather than canonicalizing JSON", () => {
  const a = receiptInput();
  const b = { ...a, handoffBytes: Buffer.from(JSON.stringify(record())) };
  const x = passing("createPublisherReceipt", a, expectedReceipt(a));
  const y = passing("createPublisherReceipt", b, expectedReceipt(b));
  assert.notEqual(x.handoffSha256, y.handoffSha256);
  assert.notEqual(x.handoffSha256, x.artifactSha256);
});
test("receipt accepts exactly 64KiB valid JSON bytes and rejects one byte more", () => {
  const f = receiptInput();
  const bytes = Buffer.concat([f.handoffBytes, Buffer.alloc(65536 - f.handoffBytes.length, 32)]);
  passing("createPublisherReceipt", { ...f, handoffBytes: bytes }, expectedReceipt({ ...f, handoffBytes: bytes }));
  negatives(
    "createPublisherReceipt",
    [
      [
        "too large",
        (r) => {
          r.handoffBytes = Buffer.concat([bytes, Buffer.from(" ")]);
        },
      ],
    ],
    receiptInput,
  );
});
test("receipt arguments are closed and byte input cannot be strings, arrays or other typed containers", () => {
  negatives(
    "createPublisherReceipt",
    [
      ...containers.map((bad) => ["root", () => bad]),
      ...["handoffBytes", "artifactId", "artifactSha256"].map((key) => [
        key,
        (f) => {
          delete f[key];
        },
      ]),
      ...["handoffSha256", "attempt", "artifactName", "authenticated", "url"].map((key) => [
        key,
        (f) => {
          f[key] = "self-claim";
        },
      ]),
      ...["{}", [], {}, null, new ArrayBuffer(8), new DataView(new ArrayBuffer(8)), new Uint16Array([123])].map(
        (bad) => [
          "bytes",
          (f) => {
            f.handoffBytes = bad;
          },
        ],
      ),
      ...integers.map((bad) => [
        "ID",
        (f) => {
          f.artifactId = bad;
        },
      ]),
      ...hashes.map((bad) => [
        "digest",
        (f) => {
          f.artifactSha256 = bad;
        },
      ]),
    ],
    receiptInput,
  );
});
test("receipt refuses empty/malformed JSON, invalid UTF-8 and BOM without replacement decoding", () => {
  negatives(
    "createPublisherReceipt",
    [
      Buffer.alloc(0),
      Buffer.from("{"),
      Buffer.from("null"),
      Buffer.from("[]"),
      Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), receiptInput().handoffBytes]),
      Buffer.concat([receiptInput().handoffBytes, Buffer.from([0xc0, 0xaf])]),
      Buffer.from('{"kind":"\xc3\x28"}', "latin1"),
    ].map((bad) => [
      "invalid encoded record",
      (f) => {
        f.handoffBytes = bad;
      },
    ]),
    receiptInput,
  );
});
test("receipt validates all handoff semantics instead of trusting a well-formed JSON wrapper", () => {
  const mutations = [
    (r) => {
      r.schemaVersion = 2;
    },
    (r) => {
      r.kind = "other";
    },
    (r) => {
      r.status = "deployed";
    },
    (r) => {
      r.deployed = true;
    },
    (r) => {
      delete r.admissionSha256;
    },
    (r) => {
      r.authenticated = true;
    },
    (r) => {
      r.publisherContext.attempt = 0;
    },
    (r) => {
      r.publisherContext.baseRevision = source;
    },
    (r) => {
      r.repository.ownerId = "42002";
    },
    (r) => {
      r.release.assets.pop();
    },
    (r) => {
      r.release.assets[7].sha256 = "c".repeat(64);
    },
    (r) => {
      r.release.tag = "v0.3.34";
    },
  ];
  negatives(
    "createPublisherReceipt",
    mutations.map((mutate, index) => [
      String(index),
      (f) => {
        const value = record();
        mutate(value);
        f.handoffBytes = Buffer.from(JSON.stringify(value));
      },
    ]),
    receiptInput,
  );
});
test("the local refusal oracle detects false success and mutate-then-throw without swallowing availability errors", () => {
  assert.throws(() => refusal(() => ({}), input(), "success"), assert.AssertionError);
  assert.throws(
    () =>
      refusal(
        (f) => {
          Object.freeze(f.repository);
          throw new Error("refused");
        },
        input(),
        "freeze then throw",
      ),
    assert.AssertionError,
  );
  const aliased = input();
  assert.throws(() => detached({ nested: aliased.release.assets[0] }, inputState(aliased)), assert.AssertionError);
  assert.throws(
    () =>
      refusal(
        (f) => {
          f.release.id = 1;
          throw new Error("refused");
        },
        input(),
        "mutation",
      ),
    assert.AssertionError,
  );
});

function cliFixture(t) {
  api("createPublisherReceipt");
  const root = mkdtempSync(join(tmpdir(), "publisher-handoff-cli-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const directory = join(root, ".artifacts/publisher-handoff");
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const path = join(directory, "handoff.json");
  const bytes = receiptInput().handoffBytes;
  writeFileSync(path, bytes, { mode: 0o600 });
  const output = join(root, "github-output");
  writeFileSync(output, "", { mode: 0o600 });
  const denied = join(root, "deny-ambient.mjs");
  writeFileSync(
    denied,
    `
    import * as modules from 'node:module';
    import http from 'node:http'; import https from 'node:https'; import net from 'node:net';
    import tls from 'node:tls'; import child from 'node:child_process';
    const deny = () => { throw new Error('Forbidden receipt CLI ambient operation'); };
    globalThis.fetch = deny; globalThis.WebSocket = class { constructor() { deny(); } };
    for (const mod of [http,https,net,tls,child]) for (const key of
      ['request','get','connect','createConnection','exec','execFile','spawn','fork','execSync','execFileSync','spawnSync'])
      if (typeof mod[key] === 'function') mod[key] = deny;
    modules.syncBuiltinESMExports();
  `,
  );
  const env = {
    PATH: dirname(process.execPath),
    LANG: "C.UTF-8",
    GITHUB_ACTIONS: "true",
    GITHUB_EVENT_NAME: "push",
    GITHUB_REF: "refs/heads/main",
    GITHUB_SERVER_URL: "https://github.com",
    GITHUB_REPOSITORY: repository,
    GITHUB_SHA: source,
    CI_BASE_REF: base,
    GITHUB_WORKFLOW_SHA: source,
    GITHUB_WORKFLOW_REF: `${repository}/.github/workflows/ci.yml@refs/heads/main`,
    GITHUB_RUN_ID: "87001",
    GITHUB_RUN_ATTEMPT: "3",
    GITHUB_JOB: "publish-release",
    GITHUB_OUTPUT: output,
    HANDOFF_ARTIFACT_ID: "62001",
    HANDOFF_ARTIFACT_SHA256: artifactDigest,
    HANDOFF_SHA256: sha(bytes),
  };
  const run = (extra = {}, args = []) =>
    spawnSync(process.execPath, ["--import", denied, fileURLToPath(moduleUrl), ...args], {
      cwd: root,
      env: { ...env, ...extra },
      encoding: "utf8",
      timeout: 10000,
      maxBuffer: 256 * 1024,
    });
  const counterpart = run();
  assert.equal(counterpart.error, undefined);
  assert.equal(counterpart.status, 0, `Valid receipt CLI counterpart failed: ${counterpart.stderr}`);
  assert(counterpart.stdout.startsWith(marker));
  writeFileSync(output, "");
  return { root, directory, path, bytes, output, env, run };
}
function assertCLIRefusal(f, extra = {}, args = []) {
  const result = f.run(extra, args);
  assert.equal(result.error, undefined, "CLI test did not reach an ordinary exit");
  assert.notEqual(result.status, 0, "Invalid receipt CLI invocation succeeded");
  assert(!result.stdout.includes(marker), "Rejected invocation emitted an authenticated-receipt candidate");
  assert.equal(readFileSync(f.output, "utf8"), "", "Rejected invocation emitted partial outputs");
}
test("fixed credential-free receipt CLI emits one exact marker and four typed outputs", (t) => {
  const f = cliFixture(t);
  const result = f.run();
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  const lines = result.stdout.trim().split("\n");
  assert.equal(lines.length, 1);
  assert.equal(lines[0], marker + JSON.stringify(expectedReceipt()));
  assert.deepEqual(
    Object.fromEntries(
      readFileSync(f.output, "utf8")
        .trim()
        .split("\n")
        .map((line) => line.split("=")),
    ),
    {
      "handoff-ready": "true",
      "handoff-artifact-id": "62001",
      "handoff-artifact-sha256": artifactDigest,
      "handoff-sha256": sha(f.bytes),
    },
  );
  assert.equal(readFileSync(f.path).equals(f.bytes), true, "Receipt must not rewrite handoff bytes");
});
test("receipt CLI rejects override arguments and malformed/missing upload or hash output bindings", (t) => {
  const f = cliFixture(t);
  assertCLIRefusal(f, {}, ["--profile=production"]);
  for (const [key, values] of Object.entries({
    HANDOFF_ARTIFACT_ID: ["", "0", "1.1", "01", "62001\nhandoff-ready=true", "9007199254740992"],
    HANDOFF_ARTIFACT_SHA256: ["", "d".repeat(63), "D".repeat(64), `sha256:${artifactDigest}`, artifactDigest + "\n"],
    HANDOFF_SHA256: ["", "c".repeat(64), sha(f.bytes) + "\n"],
    GITHUB_OUTPUT: [""],
  }))
    for (const value of values) assertCLIRefusal(f, { [key]: value });
});
test("receipt CLI requires the exact stored publisher context and dedicated main job", (t) => {
  const f = cliFixture(t);
  for (const [key, value] of Object.entries({
    GITHUB_JOB: "validate-product",
    GITHUB_ACTIONS: "false",
    GITHUB_EVENT_NAME: "pull_request",
    GITHUB_REF: "refs/heads/feature",
    GITHUB_SERVER_URL: "https://example.invalid",
    GITHUB_REPOSITORY: "other/repo",
    GITHUB_SHA: "4".repeat(40),
    CI_BASE_REF: "4".repeat(40),
    GITHUB_WORKFLOW_SHA: base,
    GITHUB_WORKFLOW_REF: `${repository}/.github/workflows/other.yml@refs/heads/main`,
    GITHUB_RUN_ID: "87002",
    GITHUB_RUN_ATTEMPT: "1",
  }))
    assertCLIRefusal(f, { [key]: value });
});
test("receipt CLI refuses changed, missing, malformed, oversized or symlinked fixed handoff bytes", (t) => {
  const f = cliFixture(t);
  for (const bytes of [Buffer.from("null"), Buffer.alloc(65537, 32), Buffer.concat([f.bytes, Buffer.from(" ")])]) {
    writeFileSync(f.path, bytes);
    assertCLIRefusal(f);
  }
  rmSync(f.path);
  assertCLIRefusal(f);
  const foreign = join(f.root, "foreign.json");
  writeFileSync(foreign, f.bytes);
  symlinkSync(foreign, f.path);
  assertCLIRefusal(f);
  rmSync(f.path);
  rmSync(f.directory, { recursive: true });
  const external = join(f.root, "external");
  mkdirSync(external);
  writeFileSync(join(external, "handoff.json"), f.bytes);
  symlinkSync(external, f.directory);
  assertCLIRefusal(f);
  const ancestor = cliFixture(t); // Includes a successful actual CLI counterpart before replacing the ancestor.
  const externalArtifacts = join(ancestor.root, "external-artifacts");
  renameSync(join(ancestor.root, ".artifacts"), externalArtifacts);
  symlinkSync(externalArtifacts, join(ancestor.root, ".artifacts"));
  const externalFile = join(externalArtifacts, "publisher-handoff/handoff.json");
  const original = readFileSync(externalFile);
  assertCLIRefusal(ancestor);
  assert.deepEqual(readFileSync(externalFile), original, "Ancestor refusal changed external handoff bytes");
});

function workflow() {
  return parse(
    execFileSync(
      "git",
      ["--no-replace-objects", "show", "2ae305c57c3ccb1ecbc6e7e6f9e8ae6d3894fcbf:.github/workflows/ci.yml"],
      {
        cwd: fileURLToPath(new URL("../", import.meta.url)),
        encoding: "utf8",
        timeout: 30_000,
        maxBuffer: 128 * 1024,
      },
    ),
  );
}
function publisher(w) {
  return w.jobs["publish-release"];
}
function step(w, id) {
  const matches = publisher(w).steps.filter((s) => s.id === id);
  assert.equal(matches.length, 1, `Missing exact historical workflow step ${id}`);
  return matches[0];
}
function workflowCounterpart() {
  const w = workflow();
  requireReleaseWorkflow(w);
  for (const id of ["publish-release", "upload-publisher-handoff", "publisher-handoff-receipt"]) step(w, id);
  return w;
}
test("historical workflow exposes receipt-only job outputs and one exact publisher artifact upload", () => {
  const w = workflowCounterpart();
  const p = publisher(w);
  const publication = step(w, "publish-release");
  const upload = step(w, "upload-publisher-handoff");
  const receipt = step(w, "publisher-handoff-receipt");
  assert.equal(publication.run, "node scripts/publish-release.mjs");
  assert.equal(p.steps.indexOf(upload), p.steps.indexOf(publication) + 1);
  assert.equal(p.steps.indexOf(receipt), p.steps.indexOf(upload) + 1);
  assert.equal(upload.name, "Upload verified publisher handoff");
  assert.equal(upload.uses, "actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9");
  assert.equal(upload.if, "${{ steps.publish-release.outputs.handoff-ready == 'true' }}");
  assert.deepEqual(upload.with, {
    name: "${{ steps.publish-release.outputs.handoff-artifact-name }}",
    path: ".artifacts/publisher-handoff/handoff.json",
    archive: true,
    "compression-level": 0,
    "if-no-files-found": "error",
    overwrite: false,
    "retention-days": 90,
    "include-hidden-files": true,
  });
  assert.equal(receipt.name, "Record verified publisher handoff receipt");
  assert.equal(receipt.run, "node scripts/publisher-handoff.mjs");
  assert.equal(receipt.if, undefined);
  assert.deepEqual(receipt.env, {
    HANDOFF_ARTIFACT_ID: "${{ steps.upload-publisher-handoff.outputs.artifact-id }}",
    HANDOFF_ARTIFACT_SHA256: "${{ steps.upload-publisher-handoff.outputs.artifact-digest }}",
    HANDOFF_SHA256: "${{ steps.publish-release.outputs.handoff-sha256 }}",
  });
  assert.deepEqual(
    p.outputs,
    Object.fromEntries(
      ["handoff-ready", "handoff-artifact-id", "handoff-artifact-sha256", "handoff-sha256"].map((key) => [
        key,
        `\${{ steps.publisher-handoff-receipt.outputs.${key} }}`,
      ]),
    ),
  );
});
test("workflow guard rejects handoff widening, bypasses, token exposure and wrong output custody", () => {
  const valid = workflowCounterpart();
  const mutations = [
    (w) => {
      step(w, "upload-publisher-handoff").with.path = ".artifacts/*";
    },
    (w) => {
      step(w, "upload-publisher-handoff").with.name = "caller-name";
    },
    (w) => {
      step(w, "upload-publisher-handoff").with.overwrite = true;
    },
    (w) => {
      step(w, "upload-publisher-handoff").with.archive = false;
    },
    (w) => {
      step(w, "upload-publisher-handoff").with["retention-days"] = 7;
    },
    (w) => {
      step(w, "upload-publisher-handoff").with["if-no-files-found"] = "warn";
    },
    (w) => {
      step(w, "upload-publisher-handoff").with["include-hidden-files"] = false;
    },
    (w) => {
      step(w, "upload-publisher-handoff").uses = "actions/upload-artifact@main";
    },
    (w) => {
      step(w, "upload-publisher-handoff").if = "${{ always() }}";
    },
    (w) => {
      step(w, "publisher-handoff-receipt").if = "${{ always() }}";
    },
    (w) => {
      step(w, "publisher-handoff-receipt")["continue-on-error"] = true;
    },
    (w) => {
      step(w, "publisher-handoff-receipt").env.GITHUB_TOKEN = "${{ github.token }}";
    },
    (w) => {
      step(w, "publisher-handoff-receipt").env.HANDOFF_SHA256 = "${{ steps.other.outputs.hash }}";
    },
    (w) => {
      step(w, "publisher-handoff-receipt").env.HANDOFF_ARTIFACT_ID = "caller";
    },
    (w) => {
      step(w, "publisher-handoff-receipt").env.HANDOFF_ARTIFACT_SHA256 = "caller";
    },
    (w) => {
      step(w, "publisher-handoff-receipt").run += " --override";
    },
    (w) => {
      publisher(w).outputs["handoff-ready"] = "${{ steps.publish-release.outputs.handoff-ready }}";
    },
    (w) => {
      publisher(w).permissions["id-token"] = "write";
    },
    (w) => {
      publisher(w).steps.reverse();
    },
    (w) => {
      publisher(w).steps.push(clone(step(w, "upload-publisher-handoff")));
    },
    (w) => {
      const u = step(w, "upload-publisher-handoff");
      publisher(w).steps.splice(publisher(w).steps.indexOf(u), 1);
      w.jobs["validate-product"].steps.push(u);
    },
  ];
  for (const [index, mutate] of mutations.entries()) {
    const invalid = clone(valid);
    mutate(invalid);
    assert.throws(() => requireReleaseWorkflow(invalid), `Workflow mutation ${index} must be refused`);
  }
});

test("isolated import and both valid/refused pure APIs perform no ambient I/O or clock reads", () => {
  api("createPublisherHandoff");
  api("createPublisherReceipt");
  const probe = `
    import assert from 'node:assert/strict';
    import vm from 'node:vm';
    import { readFileSync } from 'node:fs';
    import { createRequire, isBuiltin } from 'node:module';
    import { createHash } from 'node:crypto';
    import { fileURLToPath } from 'node:url';
    const require = createRequire(import.meta.url);
    let attempts = 0;
    const deny = () => { attempts++; throw new Error('Forbidden ambient operation'); };
    const context = vm.createContext({ Buffer, Uint8Array, TextDecoder, TextEncoder, URL, URLSearchParams,
      recordDenied: () => { attempts++; }, fixtureJSON: ${JSON.stringify(JSON.stringify(input()))} });
    vm.runInContext(\`
      const record = recordDenied; delete globalThis.recordDenied;
      const deny = () => { record(); throw new Error('Forbidden ambient operation'); };
      const nativeDate = Date;
      globalThis.Date = class extends nativeDate {
        constructor(...args) { if (!args.length) deny(); super(...args); }
        static now() { deny(); }
      };
      Math.random = deny;
      globalThis.structuredClone = value => JSON.parse(JSON.stringify(value));
      globalThis.process = new Proxy({ argv: ['node','/synthetic-import'], execPath:'/synthetic/node',
        env: new Proxy({}, { get:deny, ownKeys:deny, getOwnPropertyDescriptor:deny }) },
        { get(target,key) { if (Object.hasOwn(target,key)) return target[key]; return deny(); } });
      for (const key of ['fetch','WebSocket','XMLHttpRequest','performance','console','setTimeout','setInterval',
        'setImmediate','queueMicrotask','navigator','crypto']) Object.defineProperty(globalThis,key,{get:deny});
    \`, context);
    const cache = new Map();
    const pure = new Set(['node:assert','node:assert/strict','node:path','node:path/posix','node:path/win32','node:url','node:buffer','node:util']);
    async function load(url) {
      if (cache.has(url)) return cache.get(url);
      const source = readFileSync(new URL(url),'utf8');
      const mod = new vm.SourceTextModule(source, { context, identifier:url,
        initializeImportMeta(meta) { meta.url=url; }, importModuleDynamically:deny });
      cache.set(url,mod);
      await mod.link(async (specifier, parent) => {
        if (isBuiltin(specifier)) {
          const name = specifier.startsWith('node:') ? specifier : 'node:' + specifier;
          if (cache.has(name)) return cache.get(name);
          const real = require(name);
          const mapped = pure.has(name) ? real : name === 'node:crypto' ? { ...Object.fromEntries(Object.keys(real).map(k=>[k,deny])), createHash } :
            Object.fromEntries(Object.entries(real).map(([k,v])=>[k,typeof v==='function'?deny: v && typeof v==='object' ? new Proxy({}, {get:deny}) : v]));
          const exports = { ...mapped, default:mapped };
          const synthetic = new vm.SyntheticModule(Object.keys(exports), function(){
            for(const [key,value] of Object.entries(exports)) this.setExport(key,value);
          }, {context});
          cache.set(name,synthetic); return synthetic;
        }
        assert(specifier.startsWith('.'), 'Only local source and built-in dependencies are allowed');
        return load(new URL(specifier,parent.identifier).href);
      });
      return mod;
    }
    const mod = await load(${JSON.stringify(moduleUrl.href)}); await mod.evaluate();
    context.createHandoff = mod.namespace.createPublisherHandoff;
    context.createReceipt = mod.namespace.createPublisherReceipt;
    vm.runInContext(\`
      for (const attempt of [1,3]) {
        const input = JSON.parse(fixtureJSON); input.publisherContext.attempt=attempt;
        const handoff = createHandoff(input);
        const result = createReceipt({handoffBytes:new TextEncoder().encode(JSON.stringify(handoff)),
          artifactId:62001,artifactSha256:'d'.repeat(64)});
        if(result.attempt!==attempt) throw new Error('Wrong pure receipt');
      }
      for (const name of ['handoff','receipt']) {
        let caught=false;
        try {
          if(name==='handoff') { const bad=JSON.parse(fixtureJSON); bad.release.tag='wrong'; createHandoff(bad); }
          else createReceipt({handoffBytes:new Uint8Array([123]),artifactId:62001,artifactSha256:'d'.repeat(64)});
        } catch { caught=true; }
        if(!caught) throw new Error('Malformed pure call accepted');
      }
    \`, context);
    assert.equal(attempts,0,'Import or pure call attempted an ambient capability');
    process.stdout.write('pure publisher APIs: no ambient attempts\\n');
  `;
  const result = spawnSync(process.execPath, ["--experimental-vm-modules", "--input-type=module", "-e", probe], {
    env: { PATH: dirname(process.execPath), LANG: "C.UTF-8" },
    encoding: "utf8",
    timeout: 15000,
    maxBuffer: 256 * 1024,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "pure publisher APIs: no ambient attempts\n");
});
