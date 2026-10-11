/**
 * Independent SAME-RUN-HANDOFF expectations, authored before implementation from the adopted closed API and ZIP format.
 * Run `node --test scripts/same-run-handoff.test.mjs` with pinned Node 24.20.0; no cloud credentials or live artifacts.
 * Literal handoffs, a test-owned STORE writer and known CRC vectors supply expectations, never production builders.
 * Effects: in-memory fixtures and one credential-free VM subprocess; no extraction, network, Git or persistent state.
 * Missing module/API is availability red before behavioral assertions. Every negative has a valid counterpart first.
 * Synthetic consistency is not authentication, original-admission replay, artifact freshness or deployment authority.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname } from "node:path";
import test from "node:test";

const moduleUrl = new URL("./same-run-handoff.mjs", import.meta.url);
const subject = existsSync(moduleUrl) ? await import(moduleUrl.href) : {};
const source = "1".repeat(40);
const base = "2".repeat(40);
const tree = "3".repeat(40);
const repository = "example/private-mp3";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const names = [
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

/** Independent bitwise IEEE CRC32, including the standard initial/final XOR; no production CRC utility is imported. */
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function handoff(attempt = 3, originalAttempt = 1) {
  return {
    schemaVersion: 1,
    kind: "publisher-handoff",
    status: "released-not-deployed",
    deployed: false,
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
      attempt: originalAttempt,
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
      reservationSha256: "c".repeat(64),
      publicationSha256: "8".repeat(64),
      publicationBindingSha256: "d".repeat(64),
      assets: names.map((name, index) => ({
        id: 91001 + index,
        name,
        bytes: 201 + index,
        sha256: (index + 1).toString(16).repeat(64),
      })),
    },
  };
}

/** Literal classic ZIP framing independently matches the adopted pinned writer, including its signed descriptor. */
function archive(payload, { time = 0, date = 0x5d4a } = {}) {
  const bytes = Buffer.from(payload);
  const crc = crc32(bytes);
  const local = Buffer.alloc(42);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(8, 6);
  local.writeUInt16LE(time, 10);
  local.writeUInt16LE(date, 12);
  local.writeUInt16LE(12, 26);
  local.write("handoff.json", 30, "ascii");
  const descriptor = Buffer.alloc(16);
  descriptor.writeUInt32LE(0x08074b50, 0);
  descriptor.writeUInt32LE(crc, 4);
  descriptor.writeUInt32LE(bytes.length, 8);
  descriptor.writeUInt32LE(bytes.length, 12);
  const central = Buffer.alloc(58);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(0x032d, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(8, 8);
  central.writeUInt16LE(time, 12);
  central.writeUInt16LE(date, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(bytes.length, 20);
  central.writeUInt32LE(bytes.length, 24);
  central.writeUInt16LE(12, 28);
  central.writeUInt32LE(0x81800020, 38);
  central.write("handoff.json", 46, "ascii");
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(58, 12);
  end.writeUInt32LE(42 + bytes.length + 16, 16);
  return Buffer.concat([local, bytes, descriptor, central, end]);
}
const serialize = (value) => Buffer.from(JSON.stringify(value, null, 2) + "\n");
const artifactName = (attempt = 3) => `publisher-handoff-${source}-87001-${attempt}`;

function fixture(attempt = 3, originalAttempt = 1) {
  const payload = serialize(handoff(attempt, originalAttempt));
  const zip = archive(payload);
  return {
    context: {
      repository,
      repositoryId: 31001,
      repositoryOwnerId: 42002,
      eventName: "push",
      ref: "refs/heads/main",
      sourceRevision: source,
      baseRevision: base,
      workflowRevision: source,
      runId: 87001,
      attempt,
    },
    publisher: {
      result: "success",
      outputs: {
        "handoff-ready": "true",
        "handoff-artifact-id": "62001",
        "handoff-artifact-sha256": sha(zip),
        "handoff-sha256": sha(payload),
      },
    },
    artifact: {
      id: 62001,
      name: artifactName(attempt),
      sizeInBytes: zip.length,
      digest: `sha256:${sha(zip)}`,
      expired: false,
      workflowRun: {
        id: 87001,
        repositoryId: 31001,
        headRepositoryId: 31001,
        headBranch: "main",
        headSha: source,
      },
    },
    archiveBytes: zip,
  };
}

function expected(input, record = handoff()) {
  return {
    schemaVersion: 1,
    kind: "same-run-publisher-handoff",
    handoff: record,
    receipt: {
      schemaVersion: 1,
      kind: "publisher-handoff-receipt",
      repository,
      sourceRevision: source,
      runId: 87001,
      attempt: record.publisherContext.attempt,
      artifactId: 62001,
      artifactName: artifactName(record.publisherContext.attempt),
      artifactSha256: sha(input.archiveBytes),
      handoffSha256: sha(Buffer.from(input.archiveBytes).subarray(42, input.archiveBytes.length - 96)),
    },
  };
}

/** Bind actual altered bytes to both external archive identities so ZIP controls reach framing, not SHA mismatch. */
function bindArchive(input, bytes) {
  input.archiveBytes = bytes;
  input.artifact.sizeInBytes = bytes.byteLength;
  input.artifact.digest = `sha256:${sha(bytes)}`;
  input.publisher.outputs["handoff-artifact-sha256"] = sha(bytes);
}
function bindPayload(input, bytes, bindRawHash = true) {
  bindArchive(input, archive(bytes));
  if (bindRawHash) input.publisher.outputs["handoff-sha256"] = sha(bytes);
}
function changeHandoff(input, mutate, bindRawHash = true) {
  const record = JSON.parse(Buffer.from(input.archiveBytes).subarray(42, input.archiveBytes.length - 96));
  const replacement = mutate(record);
  bindPayload(input, serialize(replacement === undefined ? record : replacement), bindRawHash);
}
const at = (value, path) => path.reduce((current, key) => current[key], value);
function set(value, path, replacement) {
  if (!path.length) return replacement;
  at(value, path.slice(0, -1))[path.at(-1)] = replacement;
}
function api() {
  assert.equal(
    typeof subject.validateSameRunPublisherHandoff,
    "function",
    "Missing SAME-RUN-HANDOFF API validateSameRunPublisherHandoff; availability red only",
  );
  return subject.validateSameRunPublisherHandoff;
}

/** Observe all mutable input descriptors/references: freezing inputs is also a prohibited mutation. */
function state(value, records = []) {
  if (!value || typeof value !== "object" || records.some((record) => record.value === value)) return records;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  records.push({
    value,
    descriptors,
    keys: Reflect.ownKeys(value),
    prototype: Object.getPrototypeOf(value),
    extensible: Object.isExtensible(value),
    sealed: Object.isSealed(value),
    frozen: Object.isFrozen(value),
  });
  for (const descriptor of Object.values(descriptors))
    if (Object.hasOwn(descriptor, "value")) state(descriptor.value, records);
  return records;
}
function unchanged(records) {
  for (const before of records) {
    assert.deepEqual(Reflect.ownKeys(before.value), before.keys);
    assert.equal(Object.getPrototypeOf(before.value), before.prototype);
    assert.equal(Object.isExtensible(before.value), before.extensible);
    assert.equal(Object.isSealed(before.value), before.sealed);
    assert.equal(Object.isFrozen(before.value), before.frozen);
    for (const key of before.keys) {
      const actual = Object.getOwnPropertyDescriptor(before.value, key);
      assert.deepEqual(Object.keys(actual), Object.keys(before.descriptors[key]));
      for (const field of Object.keys(actual)) assert.equal(actual[field], before.descriptors[key][field]);
    }
  }
}
function frozenDetached(value, inputs) {
  if (!value || typeof value !== "object") return;
  assert(Object.isFrozen(value), "Returned nested record/array is mutable");
  assert(!inputs.some((record) => record.value === value), "Returned record aliases mutable input");
  for (const child of Object.values(value)) frozenDetached(child, inputs);
}
function passing(input = fixture(), wanted = expected(input)) {
  const before = state(input);
  const output = api()(input);
  assert.deepEqual(output, wanted);
  unchanged(before);
  frozenDetached(output, before);
  return output;
}
function refusal(fn, input, label) {
  const before = state(input);
  let caught;
  try {
    fn(input);
  } catch (error) {
    caught = error;
  }
  assert(caught instanceof TypeError, `${label}: expected a synchronous TypeError`);
  assert.equal(caught.message, "ERR_SAME_RUN_HANDOFF", label);
  assert.equal(caught.code, "ERR_SAME_RUN_HANDOFF", label);
  assert.equal(Object.hasOwn(caught, "cause"), false, `${label}: refusal must not expose a cause`);
  unchanged(before);
}
function negatives(rows, make = fixture) {
  const fn = api();
  passing(make());
  for (const [label, mutate] of rows) {
    let input = make();
    const replacement = mutate(input);
    if (replacement !== undefined) input = replacement;
    refusal(fn, input, label);
  }
}
const containers = [null, [], false, 1, "record"];
const integers = [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, Infinity, NaN, "1", null, true];
const hashes = ["", "a".repeat(63), "a".repeat(65), "A".repeat(64), "g".repeat(64), "a".repeat(64) + "\n", null, 1];
const revisions = ["main", "a".repeat(39), "a".repeat(41), "A".repeat(40), "z".repeat(40), source + "\n", null, 1];
const envelopePaths = [
  [],
  ["context"],
  ["publisher"],
  ["publisher", "outputs"],
  ["artifact"],
  ["artifact", "workflowRun"],
];
const handoffPaths = [
  [],
  ["originalContext"],
  ["publisherContext"],
  ["repository"],
  ["release"],
  ["release", "assets", 0],
];

test("independent CRC and literal STORE framing match known vectors and the retained pinned writer", () => {
  assert.equal(crc32(Buffer.from("123456789")), 0xcbf43926);
  assert.equal(crc32(Buffer.alloc(0)), 0);
  const bytes = archive(Buffer.from('{"kind":"synthetic-zip-framing-fixture","schemaVersion":1}\n'));
  assert.equal(bytes.length, 197);
  assert.equal(sha(bytes), "5c9d40765123bf36cf06610410e8762ae9acc243c3666b592e3cb1bc4bc2e01e");
});
test("same-attempt and earlier original validation return exact distinct handoff and receipt identities", () => {
  for (const [attempt, original] of [
    [1, 1],
    [3, 1],
    [3, 3],
  ]) {
    const input = fixture(attempt, original);
    const result = passing(input, expected(input, handoff(attempt, original)));
    assert.equal(result.handoff.originalContext.attempt, original);
    assert.equal(result.handoff.originalContext.sourceTree, tree);
    assert.equal(result.handoff.originalContext.toolingRevision, base);
    assert.equal(result.handoff.admissionSha256, "b".repeat(64));
    assert.notEqual(result.receipt.artifactSha256, result.receipt.handoffSha256);
    assert.notEqual(result.handoff.release.publicationSha256, result.handoff.release.publicationBindingSha256);
    assert.notEqual(result.handoff.release.reservationSha256, result.handoff.release.assets[9].sha256);
  }
});
test("mutable and frozen input produce fresh deeply frozen detached outputs with unchanged descriptors", () => {
  for (const freeze of [false, true]) {
    const input = fixture();
    if (freeze) {
      const freezeRecords = (value) => {
        if (!value || typeof value !== "object" || ArrayBuffer.isView(value)) return;
        for (const child of Object.values(value)) freezeRecords(child);
        Object.freeze(value);
      };
      freezeRecords(input);
    }
    const first = passing(input);
    const firstState = state(first);
    const second = passing(input);
    frozenDetached(second, firstState);
  }
});
test("Buffer and Uint8Array subviews hash only their bounded bytes and preserve unrelated backing bytes", () => {
  for (const buffer of [false, true]) {
    const input = fixture();
    const backing = Buffer.concat([Buffer.from("prefix"), input.archiveBytes, Buffer.from("suffix")]);
    const before = Buffer.from(backing);
    input.archiveBytes = buffer
      ? backing.subarray(6, backing.length - 6)
      : new Uint8Array(backing.buffer, backing.byteOffset + 6, backing.length - 12);
    passing(input);
    assert.deepEqual(backing, before);
  }
});
test("equivalent raw JSON whitespace and matching DOS timestamps are preserved without clock interpretation", () => {
  for (const [time, date] of [
    [0, 0],
    [0xffff, 0xffff],
  ]) {
    const input = fixture();
    const payload = Buffer.from(" \r\n" + JSON.stringify(handoff()) + " \n\t");
    bindArchive(input, archive(payload, { time, date }));
    input.publisher.outputs["handoff-sha256"] = sha(payload);
    passing(input);
  }
});
test("positive safe integer upper bounds are supported without imposing smaller identifier limits", () => {
  const input = fixture();
  const record = handoff();
  input.context.repositoryId = record.repository.id = Number.MAX_SAFE_INTEGER;
  input.context.repositoryOwnerId = record.repository.ownerId = Number.MAX_SAFE_INTEGER - 1;
  input.artifact.workflowRun.repositoryId = input.artifact.workflowRun.headRepositoryId = Number.MAX_SAFE_INTEGER;
  record.release.id = Number.MAX_SAFE_INTEGER - 2;
  record.release.assets[0].id = Number.MAX_SAFE_INTEGER - 3;
  record.release.assets[0].bytes = Number.MAX_SAFE_INTEGER;
  bindPayload(input, serialize(record));
  input.artifact.id = Number.MAX_SAFE_INTEGER - 4;
  input.publisher.outputs["handoff-artifact-id"] = String(input.artifact.id);
  const wanted = expected(input, record);
  wanted.receipt.artifactId = input.artifact.id;
  passing(input, wanted);
});
test("every envelope record rejects missing or extra keys and wrong containers", () => {
  const rows = [];
  for (const path of envelopePaths) {
    for (const key of Object.keys(at(fixture(), path)))
      rows.push([
        `missing ${path}.${key}`,
        (x) => {
          delete at(x, path)[key];
        },
      ]);
    rows.push([
      `extra ${path}`,
      (x) => {
        at(x, path).authenticated = true;
      },
    ]);
    for (const bad of containers) rows.push([`container ${path}/${JSON.stringify(bad)}`, (x) => set(x, path, bad)]);
  }
  negatives(rows);
});
test("context integer identities and revisions enforce exact safe numeric and lowercase grammars", () => {
  const rows = [];
  for (const key of ["repositoryId", "repositoryOwnerId", "runId", "attempt"])
    for (const value of integers)
      rows.push([
        `${key}/${value}`,
        (x) => {
          x.context[key] = value;
        },
      ]);
  for (const key of ["sourceRevision", "baseRevision", "workflowRevision"])
    for (const value of revisions)
      rows.push([
        `${key}/${value}`,
        (x) => {
          x.context[key] = value;
        },
      ]);
  negatives(rows);
});
test("trusted context is push/main with exact repository, source, base, workflow and run custody", () => {
  const rows = [];
  for (const value of ["", "owner", "owner/repo/extra", "/repo", "owner/", "owner/repo\n", null, 1])
    rows.push([
      `repository/${value}`,
      (x) => {
        x.context.repository = value;
      },
    ]);
  for (const [key, value] of [
    ["repository", "another/repository"],
    ["repositoryId", 31002],
    ["repositoryOwnerId", 42003],
    ["eventName", "pull_request"],
    ["eventName", "workflow_dispatch"],
    ["eventName", null],
    ["ref", "refs/heads/feature"],
    ["ref", "main"],
    ["ref", null],
    ["runId", 87002],
    ["sourceRevision", "4".repeat(40)],
    ["baseRevision", "5".repeat(40)],
    ["workflowRevision", base],
  ])
    rows.push([
      `context/${key}/${value}`,
      (x) => {
        x.context[key] = value;
      },
    ]);
  negatives(rows);
});
test("publisher success and exact ready string are both required without coercion or fallback", () => {
  const rows = [];
  for (const result of ["failure", "skipped", "cancelled", "neutral", "", true, null])
    rows.push([
      `result/${result}`,
      (x) => {
        x.publisher.result = result;
      },
    ]);
  for (const ready of ["false", "True", "true\n", "1", true, 1, null])
    rows.push([
      `ready/${ready}`,
      (x) => {
        x.publisher.outputs["handoff-ready"] = ready;
      },
    ]);
  negatives(rows);
});
test("caller-provided extraction, receipts, job selectors, URLs and deployment authority are not accepted inputs", () => {
  negatives(
    ["handoff", "receipt", "job", "url", "profile", "authenticated", "deployable"].map((key) => [
      key,
      (x) => {
        x[key] = key === "handoff" ? handoff() : "synthetic-untrusted-claim";
      },
    ]),
  );
});
test("publisher artifact locator uses canonical decimal and two independent lowercase hash strings", () => {
  const rows = [];
  for (const id of [
    "",
    "0",
    "-1",
    "01",
    "+62001",
    " 62001",
    "62001\n",
    "6.2001e4",
    "62001.0",
    "9007199254740992",
    62001,
    null,
  ])
    rows.push([
      `artifact id/${id}`,
      (x) => {
        x.publisher.outputs["handoff-artifact-id"] = id;
      },
    ]);
  for (const key of ["handoff-artifact-sha256", "handoff-sha256"])
    for (const value of hashes)
      rows.push([
        `${key}/${value}`,
        (x) => {
          x.publisher.outputs[key] = value;
        },
      ]);
  negatives(rows);
});
test("artifact metadata cannot substitute names, IDs, run, head repository, size, expiry or digest", () => {
  const rows = [];
  for (const path of [
    ["id"],
    ["sizeInBytes"],
    ["workflowRun", "id"],
    ["workflowRun", "repositoryId"],
    ["workflowRun", "headRepositoryId"],
  ])
    for (const value of integers)
      rows.push([
        `artifact/${path}/${value}`,
        (x) => {
          set(x.artifact, path, value);
        },
      ]);
  for (const [path, value] of [
    [["id"], 62002],
    [["name"], artifactName(2)],
    [["name"], "other"],
    [["name"], null],
    [["sizeInBytes"], 262145],
    [["sizeInBytes"], 1],
    [["expired"], true],
    [["expired"], "false"],
    [["expired"], null],
    [["digest"], "sha256:" + "e".repeat(64)],
    [["digest"], "SHA256:" + "e".repeat(64)],
    [["digest"], null],
    [["workflowRun", "id"], 87002],
    [["workflowRun", "repositoryId"], 31002],
    [["workflowRun", "headRepositoryId"], 31002],
    [["workflowRun", "headBranch"], "feature"],
    [["workflowRun", "headBranch"], null],
    [["workflowRun", "headSha"], base],
    [["workflowRun", "headSha"], null],
  ])
    rows.push([
      `metadata/${path}/${value}`,
      (x) => {
        set(x.artifact, path, value);
      },
    ]);
  negatives(rows);
});
test("actual archive SHA matches both external identities and JSON SHA cannot replace ZIP identity", () => {
  negatives([
    [
      "metadata digest only",
      (x) => {
        x.artifact.digest = "sha256:" + "f".repeat(64);
      },
    ],
    [
      "needs digest only",
      (x) => {
        x.publisher.outputs["handoff-artifact-sha256"] = "f".repeat(64);
      },
    ],
    [
      "both external digests wrong",
      (x) => {
        x.artifact.digest = "sha256:" + "f".repeat(64);
        x.publisher.outputs["handoff-artifact-sha256"] = "f".repeat(64);
      },
    ],
    [
      "both external digests use raw JSON SHA",
      (x) => {
        const hash = x.publisher.outputs["handoff-sha256"];
        x.artifact.digest = `sha256:${hash}`;
        x.publisher.outputs["handoff-artifact-sha256"] = hash;
      },
    ],
    [
      "changed archive bytes",
      (x) => {
        x.archiveBytes[42] ^= 1;
      },
    ],
  ]);
});
test("coherent altered handoff and its ZIP cannot override unchanged external raw JSON identity", () => {
  negatives([
    [
      "changed admission",
      (x) =>
        changeHandoff(
          x,
          (r) => {
            r.admissionSha256 = "e".repeat(64);
          },
          false,
        ),
    ],
    [
      "changed source tree",
      (x) =>
        changeHandoff(
          x,
          (r) => {
            r.originalContext.sourceTree = "e".repeat(40);
          },
          false,
        ),
    ],
    [
      "changed release",
      (x) =>
        changeHandoff(
          x,
          (r) => {
            r.release.id++;
          },
          false,
        ),
    ],
    ["changed whitespace", (x) => bindPayload(x, Buffer.from(JSON.stringify(handoff())), false)],
    [
      "ZIP hash used as raw JSON identity",
      (x) => {
        x.publisher.outputs["handoff-sha256"] = sha(x.archiveBytes);
      },
    ],
  ]);
});
test("publisher attempt is exactly current while original attempt may only be earlier or equal", () => {
  negatives([
    [
      "older publisher with current artifact name",
      (x) =>
        changeHandoff(x, (r) => {
          r.publisherContext.attempt = 2;
        }),
    ],
    [
      "older publisher with matching stale name",
      (x) => {
        changeHandoff(x, (r) => {
          r.publisherContext.attempt = 2;
        });
        x.artifact.name = artifactName(2);
      },
    ],
    [
      "future publisher",
      (x) =>
        changeHandoff(x, (r) => {
          r.publisherContext.attempt = 4;
        }),
    ],
    [
      "future original",
      (x) =>
        changeHandoff(x, (r) => {
          r.originalContext.attempt = 4;
        }),
    ],
    [
      "stage-only later rerun",
      (x) => {
        x.context.attempt = 4;
      },
    ],
  ]);
});
test("handoff overlapping fields remain bound even when its internal original and publisher are coherently changed", () => {
  const rows = [];
  for (const [key, value] of [
    ["repository", "another/repository"],
    ["runId", 87002],
    ["sourceRevision", "4".repeat(40)],
    ["baseRevision", "5".repeat(40)],
  ]) {
    rows.push([
      `coherent inner ${key}`,
      (x) =>
        changeHandoff(x, (r) => {
          r.originalContext[key] = value;
          r.publisherContext[key] = value;
          if (key === "sourceRevision") {
            r.originalContext.workflowRevision = value;
            r.publisherContext.workflowRevision = value;
          }
          if (key === "baseRevision") r.originalContext.toolingRevision = value;
        }),
    ]);
  }
  for (const key of ["id", "ownerId"])
    rows.push([
      `observed repository ${key}`,
      (x) =>
        changeHandoff(x, (r) => {
          r.repository[key]++;
        }),
    ]);
  rows.push([
    "other workflow",
    (x) =>
      changeHandoff(x, (r) => {
        r.publisherContext.workflow = ".github/workflows/other.yml";
      }),
  ]);
  negatives(rows);
});
test("every embedded handoff record retains its exact schema rather than trusting extracted JSON", () => {
  const rows = [];
  for (const path of handoffPaths) {
    for (const key of Object.keys(at(handoff(), path)))
      rows.push([
        `missing inner ${path}.${key}`,
        (x) =>
          changeHandoff(x, (r) => {
            delete at(r, path)[key];
          }),
      ]);
    rows.push([
      `extra inner ${path}`,
      (x) =>
        changeHandoff(x, (r) => {
          at(r, path).approved = true;
        }),
    ]);
    for (const value of containers)
      rows.push([
        `inner container ${path}/${JSON.stringify(value)}`,
        (x) => changeHandoff(x, (r) => set(r, path, value)),
      ]);
  }
  negatives(rows);
});
test("embedded fixed markers, safe identities and raw/canonical publication identities remain validated", () => {
  const rows = [];
  for (const [path, value] of [
    [["schemaVersion"], 2],
    [["kind"], "trusted-handoff"],
    [["status"], "deployed"],
    [["deployed"], true],
    [["publisherContext", "schemaVersion"], 2],
    [["originalContext", "eventName"], "pull_request"],
    [["originalContext", "ref"], "refs/heads/other"],
    [["originalContext", "toolingRevision"], source],
    [["originalContext", "workflowRevision"], base],
    [["publisherContext", "workflowRevision"], base],
    [["release", "version"], "0.03.33"],
    [["release", "tag"], "v0.3.34"],
    [["release", "assets"], null],
  ])
    rows.push([
      `embedded ${path}`,
      (x) =>
        changeHandoff(x, (r) => {
          set(r, path, value);
        }),
    ]);
  for (const path of [
    ["repository", "id"],
    ["repository", "ownerId"],
    ["release", "id"],
    ["release", "assets", 0, "id"],
    ["release", "assets", 0, "bytes"],
    ["originalContext", "attempt"],
    ["publisherContext", "attempt"],
  ])
    for (const value of integers)
      rows.push([
        `inner integer ${path}/${value}`,
        (x) =>
          changeHandoff(x, (r) => {
            set(r, path, value);
          }),
      ]);
  for (const path of [
    ["admissionSha256"],
    ["release", "reservationSha256"],
    ["release", "publicationSha256"],
    ["release", "publicationBindingSha256"],
    ["release", "assets", 0, "sha256"],
  ])
    for (const value of hashes)
      rows.push([
        `inner hash ${path}/${value}`,
        (x) =>
          changeHandoff(x, (r) => {
            set(r, path, value);
          }),
      ]);
  for (const value of revisions)
    rows.push([
      `tree grammar/${value}`,
      (x) =>
        changeHandoff(x, (r) => {
          r.originalContext.sourceTree = value;
        }),
    ]);
  negatives(rows);
});
test("release asset inventory remains exactly ten sorted unique names and IDs with raw publication equality", () => {
  negatives([
    [
      "missing asset",
      (x) =>
        changeHandoff(x, (r) => {
          r.release.assets.pop();
        }),
    ],
    [
      "extra asset",
      (x) =>
        changeHandoff(x, (r) => {
          r.release.assets.push({ id: 99001, name: "extra", bytes: 1, sha256: "e".repeat(64) });
        }),
    ],
    [
      "duplicate name",
      (x) =>
        changeHandoff(x, (r) => {
          r.release.assets[1].name = r.release.assets[0].name;
        }),
    ],
    [
      "duplicate id",
      (x) =>
        changeHandoff(x, (r) => {
          r.release.assets[1].id = r.release.assets[0].id;
        }),
    ],
    [
      "wrong case",
      (x) =>
        changeHandoff(x, (r) => {
          r.release.assets[0].name = "sha256sums";
        }),
    ],
    [
      "unsorted",
      (x) =>
        changeHandoff(x, (r) => {
          r.release.assets.reverse();
        }),
    ],
    [
      "publication raw mismatch",
      (x) =>
        changeHandoff(x, (r) => {
          r.release.publicationSha256 = "e".repeat(64);
        }),
    ],
  ]);
});
test("archive input is a bounded nonempty byte view rather than an arbitrary container or caller extraction", () => {
  negatives([
    ...[
      null,
      "zip",
      [],
      {},
      new ArrayBuffer(8),
      new DataView(new ArrayBuffer(8)),
      new Uint16Array(8),
      Buffer.alloc(0),
    ].map((value) => [
      "wrong archive type",
      (x) => {
        x.archiveBytes = value;
      },
    ]),
    ["outer limit exact malformed", (x) => bindArchive(x, Buffer.alloc(262144))],
    ["outer limit exceeded", (x) => bindArchive(x, Buffer.alloc(262145))],
  ]);
});
test("plaintext boundary accepts exactly 65536 bytes and refuses 65537 despite valid framing and external hashes", () => {
  for (const length of [65535, 65536]) {
    const input = fixture();
    const text = serialize(handoff());
    bindPayload(input, Buffer.concat([text, Buffer.alloc(length - text.length, 0x20)]));
    assert.equal(input.archiveBytes.length, length + 138);
    passing(input);
  }
  negatives([
    [
      "65537 plaintext bytes",
      (x) => {
        const text = serialize(handoff());
        bindPayload(x, Buffer.concat([text, Buffer.alloc(65537 - text.length, 0x20)]));
      },
    ],
    ["empty plaintext", (x) => bindPayload(x, Buffer.alloc(0))],
  ]);
});
test("raw handoff uses strict UTF-8 without BOM and must parse as exactly one valid JSON object", () => {
  negatives([
    ["UTF-8 BOM", (x) => bindPayload(x, Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), serialize(handoff())]))],
    ["invalid continuation", (x) => bindPayload(x, Buffer.concat([serialize(handoff()), Buffer.from([0xc0, 0xaf])]))],
    ["truncated UTF-8", (x) => bindPayload(x, Buffer.concat([serialize(handoff()), Buffer.from([0xe2, 0x82])]))],
    ["UTF-16 bytes", (x) => bindPayload(x, Buffer.from(JSON.stringify(handoff()), "utf16le"))],
    ["unclosed JSON", (x) => bindPayload(x, Buffer.from("{"))],
    ["trailing JSON", (x) => bindPayload(x, Buffer.concat([serialize(handoff()), Buffer.from("{}")]))],
    ["whitespace only", (x) => bindPayload(x, Buffer.from(" \n\t"))],
  ]);
});

/** Change literal header fields and refresh only outer authority; these controls must reach the archive parser. */
function zipMutations(rows) {
  negatives(
    rows.map(([label, mutate]) => [
      label,
      (input) => {
        const bytes = Buffer.from(input.archiveBytes);
        const offsets = { descriptor: bytes.length - 96, central: bytes.length - 80, end: bytes.length - 22 };
        const replacement = mutate(bytes, offsets);
        bindArchive(input, replacement === undefined ? bytes : replacement);
      },
    ]),
  );
}
test("local header has exact signature, version, flags, STORE method, zero CRC/sizes and literal filename", () => {
  const rows = [];
  for (const [offset, width, values] of [
    [0, 4, [0, 0x04034b51]],
    [4, 2, [0, 10, 45]],
    [6, 2, [0, 1, 9, 0x808]],
    [8, 2, [8, 99]],
    [14, 4, [1]],
    [18, 4, [1, 0xffffffff]],
    [22, 4, [1, 0xffffffff]],
    [26, 2, [0, 11, 13]],
    [28, 2, [1]],
  ])
    for (const value of values)
      rows.push([
        `local ${offset}/${value}`,
        (b) => {
          b[width === 2 ? "writeUInt16LE" : "writeUInt32LE"](value, offset);
        },
      ]);
  for (const name of ["../evil.json", "Handoff.json", "/andoff.json", "handoff.jso/"])
    rows.push([
      `local name ${name}`,
      (b) => {
        b.fill(0, 30, 42);
        b.write(name, 30, "ascii");
      },
    ]);
  zipMutations(rows);
});
test("descriptor requires its signature, actual CRC and both exact nonzero plaintext sizes", () => {
  const rows = [];
  for (const [offset, value] of [
    [0, 0],
    [0, 0x08074b51],
    [4, 0],
    [8, 0],
    [8, 1],
    [8, 0xffffffff],
    [12, 0],
    [12, 1],
    [12, 0xffffffff],
  ])
    rows.push([
      `descriptor ${offset}/${value}`,
      (b, p) => {
        b.writeUInt32LE(value, p.descriptor + offset);
      },
    ]);
  rows.push([
    "coherently wrong descriptor and central CRC",
    (b, p) => {
      b.writeUInt32LE(0x12345678, p.descriptor + 4);
      b.writeUInt32LE(0x12345678, p.central + 16);
    },
  ]);
  rows.push([
    "unsigned twelve-byte descriptor",
    (b, p) => Buffer.concat([b.subarray(0, p.descriptor), b.subarray(p.descriptor + 4)]),
  ]);
  zipMutations(rows);
});
test("central directory enforces exact versions, matching flags/method/time/date and descriptor integrity", () => {
  const rows = [];
  for (const [offset, width, values] of [
    [0, 4, [0]],
    [4, 2, [20, 0x0314]],
    [6, 2, [10, 45]],
    [8, 2, [0, 9, 0x808]],
    [10, 2, [8]],
    [12, 2, [1]],
    [14, 2, [1]],
    [16, 4, [0]],
    [20, 4, [0, 1, 0xffffffff]],
    [24, 4, [0, 1, 0xffffffff]],
  ])
    for (const value of values)
      rows.push([
        `central ${offset}/${value}`,
        (b, p) => {
          b[width === 2 ? "writeUInt16LE" : "writeUInt32LE"](value, p.central + offset);
        },
      ]);
  rows.push([
    "coherent compression claim",
    (b, p) => {
      b.writeUInt16LE(8, 8);
      b.writeUInt16LE(8, p.central + 10);
    },
  ]);
  rows.push([
    "coherent encryption flags",
    (b, p) => {
      b.writeUInt16LE(9, 6);
      b.writeUInt16LE(9, p.central + 8);
    },
  ]);
  zipMutations(rows);
});
test("central entry permits only one regular 0600 file with no extras, comments, disks or alternate name", () => {
  const rows = [];
  for (const [offset, width, values] of [
    [28, 2, [0, 11, 13]],
    [30, 2, [1]],
    [32, 2, [1]],
    [34, 2, [1]],
    [36, 2, [1]],
    [38, 4, [0, 0x81a40020, 0xa1800020, 0x41800010]],
    [42, 4, [1, 42, 0xffffffff]],
  ])
    for (const value of values)
      rows.push([
        `central metadata ${offset}/${value}`,
        (b, p) => {
          b[width === 2 ? "writeUInt16LE" : "writeUInt32LE"](value, p.central + offset);
        },
      ]);
  rows.push([
    "central filename mismatch",
    (b, p) => {
      b[p.central + 46] = 0x48;
    },
  ]);
  rows.push([
    "coherent traversal filename",
    (b, p) => {
      b.write("../evil.json", 30, "ascii");
      b.write("../evil.json", p.central + 46, "ascii");
    },
  ]);
  zipMutations(rows);
});
test("EOCD is single disk and entry with exact 58-byte directory, offset and no comment", () => {
  const rows = [];
  for (const [offset, width, values] of [
    [0, 4, [0, 0x06064b50]],
    [4, 2, [1]],
    [6, 2, [1]],
    [8, 2, [0, 2, 0xffff]],
    [10, 2, [0, 2, 0xffff]],
    [12, 4, [0, 57, 59, 0xffffffff]],
    [16, 4, [0, 42, 0xffffffff]],
    [20, 2, [1, 0xffff]],
  ])
    for (const value of values)
      rows.push([
        `end ${offset}/${value}`,
        (b, p) => {
          b[width === 2 ? "writeUInt16LE" : "writeUInt32LE"](value, p.end + offset);
        },
      ]);
  zipMutations(rows);
});
test("truncations at each record boundary, overlaps, prepended/trailing bytes and extra entries fail closed", () => {
  zipMutations([
    ...[0, 1, 4, 29, 30, 41, 42].map((length) => [`prefix truncation ${length}`, (b) => b.subarray(0, length)]),
    ...[1, 21, 22, 23, 79, 80, 81, 95, 96, 97].map((remove) => [
      `tail truncation ${remove}`,
      (b) => b.subarray(0, b.length - remove),
    ]),
    ["one prepended byte", (b) => Buffer.concat([Buffer.from([0]), b])],
    ["one trailing byte", (b) => Buffer.concat([b, Buffer.from([0])])],
    ["second archive", (b) => Buffer.concat([b, b])],
    [
      "extra local record before central",
      (b, p) => Buffer.concat([b.subarray(0, p.central), b.subarray(0, 42), b.subarray(p.central)]),
    ],
    [
      "extra central entry",
      (b, p) => Buffer.concat([b.subarray(0, p.end), b.subarray(p.central, p.end), b.subarray(p.end)]),
    ],
    ["missing descriptor overlap", (b, p) => Buffer.concat([b.subarray(0, p.descriptor), b.subarray(p.central)])],
    [
      "ZIP64 locator",
      (b, p) =>
        Buffer.concat([
          b.subarray(0, p.end),
          Buffer.from("504b060700000000000000000000000001000000", "hex"),
          b.subarray(p.end),
        ]),
    ],
  ]);
});
test("refusals stay sanitized and never freeze or otherwise mutate malformed caller data", () => {
  negatives([
    [
      "secret-like extra field",
      (x) => {
        x.publisher.outputs.secret = "SYNTHETIC_DO_NOT_ECHO";
      },
    ],
    ["secret-like malformed JSON", (x) => bindPayload(x, Buffer.from('{"SYNTHETIC_DO_NOT_ECHO":'))],
    ["native ZIP bounds error", (x) => bindArchive(x, Buffer.from([0x50]))],
    [
      "inner schema error",
      (x) =>
        changeHandoff(x, (r) => {
          r.release.assets[0].bytes = -1;
        }),
    ],
  ]);
});

test("isolated import and representative valid/refused calls deny ambient capabilities and enforce hash-before-parse", () => {
  api();
  const cases = [fixture(1, 1), fixture(3, 1), fixture()];
  cases[2].publisher.result = "failure";
  const malformed = fixture();
  bindPayload(malformed, Buffer.from("{"));
  cases.push(malformed);
  const hashMismatch = fixture();
  hashMismatch.publisher.outputs["handoff-artifact-sha256"] = "f".repeat(64);
  hashMismatch.artifact.digest = "sha256:" + "f".repeat(64);
  cases.push(hashMismatch);
  const oversize = fixture();
  bindArchive(oversize, Buffer.alloc(262145));
  cases.push(oversize);
  const plaintextOversize = fixture();
  bindPayload(plaintextOversize, Buffer.alloc(65537, 0x20));
  cases.push(plaintextOversize);
  const wire = cases.map(({ archiveBytes, ...value }, index) => ({
    value,
    archive: index >= 5 ? null : Buffer.from(archiveBytes).toString("base64"),
    prefix: index === 6 ? Buffer.from(archiveBytes).subarray(0, 42).toString("base64") : null,
    suffix: index === 6 ? Buffer.from(archiveBytes).subarray(-96).toString("base64") : null,
  }));
  const probe = `
    import assert from 'node:assert/strict';
    import vm from 'node:vm';
    import { readFileSync } from 'node:fs';
    import { createRequire, isBuiltin } from 'node:module';
    import { createHash } from 'node:crypto';
    import { crc32 } from 'node:zlib';
    const require = createRequire(import.meta.url);
    let attempts = 0, hashes = 0, crcs = 0, parses = 0;
    const deny = () => { attempts++; throw new Error('Forbidden ambient capability'); };
    const context = vm.createContext({ Buffer, Uint8Array, TextDecoder, TextEncoder, URL, URLSearchParams, structuredClone,
      recordDenied: () => { attempts++; }, recordParse: () => { parses++; } });
    vm.runInContext(\`
      const record = recordDenied, parsed = recordParse;
      delete globalThis.recordDenied; delete globalThis.recordParse;
      const deny = () => { record(); throw new Error('Forbidden ambient capability'); };
      const parse = JSON.parse; JSON.parse = (...args) => { parsed(); return parse(...args); };
      const nativeDate = Date;
      globalThis.Date = class extends nativeDate {
        constructor(...args) { if (!args.length) deny(); super(...args); }
        static now() { deny(); }
      };
      Math.random = deny;
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
          let mapped = pure.has(name) ? real : Object.fromEntries(Object.entries(real).map(([k,v])=>
            [k,typeof v==='function'?deny: v && typeof v==='object' ? new Proxy({}, {get:deny}) : v]));
          if (name === 'node:crypto') mapped = { ...mapped, createHash: (...args) => { hashes++; return createHash(...args); } };
          if (name === 'node:zlib') mapped = { ...mapped, crc32: (...args) => { crcs++; return crc32(...args); } };
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
    context.validate = mod.namespace.validateSameRunPublisherHandoff;
    const fixtures = ${JSON.stringify(wire)};
    for (let i=0;i<fixtures.length;i++) {
      context.fixtureText=JSON.stringify(fixtures[i].value); context.archiveText=fixtures[i].archive;
      context.prefixText=fixtures[i].prefix; context.suffixText=fixtures[i].suffix;
      vm.runInContext('globalThis.input=JSON.parse(fixtureText); input.archiveBytes=prefixText!==null ? new Uint8Array(Buffer.concat([Buffer.from(prefixText,"base64"), Buffer.alloc(65537,32), Buffer.from(suffixText,"base64")])) : archiveText===null ? new Uint8Array(262145) : new Uint8Array(Buffer.from(archiveText,"base64"));',context);
      hashes=0; crcs=0; parses=0;
      context.shouldPass=i<2;
      vm.runInContext(\`
        {
        let caught;
        try {
          const value = validate(input);
          if (!shouldPass || value.kind!=='same-run-publisher-handoff') throw new Error('Unexpected result');
          if (value.handoff.originalContext.attempt!==1) throw new Error('Original attempt changed');
        } catch(error) { caught=error; }
        if (shouldPass && caught) throw caught;
        if (!shouldPass && (!caught || caught.name!=='TypeError' || caught.message!=='ERR_SAME_RUN_HANDOFF' ||
          caught.code!=='ERR_SAME_RUN_HANDOFF' || Object.hasOwn(caught,'cause'))) throw new Error('Wrong refusal');
        }
      \`,context);
      if (i===4) { assert(hashes>0,'Actual ZIP must be hashed'); assert.equal(crcs,0); assert.equal(parses,0); }
      if (i>=5) { assert.equal(hashes,0,'Archive/plaintext bounds precede hashing'); assert.equal(crcs,0); assert.equal(parses,0); }
    }
    assert.equal(attempts,0,'Import or call attempted an ambient capability');
    process.stdout.write('same-run validator: no ambient attempts; hash/bound order observed\\n');
  `;
  const result = spawnSync(process.execPath, ["--experimental-vm-modules", "--input-type=module", "-e", probe], {
    env: { PATH: dirname(process.execPath), LANG: "C.UTF-8" },
    encoding: "utf8",
    timeout: 15000,
    maxBuffer: 256 * 1024,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "same-run validator: no ambient attempts; hash/bound order observed\n");
});
