/**
 * Usage: node scripts/transport-controls.ts. Deliberately wrong loopback responders and mutated records exercise the
 * same assertions as the candidate cases/reporters. These are harness falsification controls, never product acceptance.
 * Listeners are ephemeral and closed in finally; bounded failures must include their intended diagnostic.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { performance } from "node:perf_hooks";
import { assertErrorResponse, type ResponseData } from "../lib/assertions.ts";
import { assertExecution, assertInventory, inventory, type Execution } from "../lib/inventory.ts";
import {
  assertNormalExit,
  assertStragglerOutcome,
  observeShutdown,
  readAcknowledgment,
  readState,
} from "../lib/lifecycle.ts";
import { buildReport } from "../lib/report.ts";
import { assertOpenApi } from "../lib/openapi.ts";
import {
  assertAdmitted,
  assertEarlyError,
  assertTimeout,
  IDLE_WINDOW,
  openUpload,
  TOTAL_WINDOW,
  within,
  type Upload,
} from "../lib/transport.ts";

let controls = 0;
function rejected(name: string, callback: () => unknown, marker: RegExp) {
  assert.throws(callback, marker, `${name}: intended assertion did not reject`);
  controls += 1;
  console.log(`${name}: intentional rejection confirmed`);
}
async function rejects(name: string, callback: () => Promise<unknown>, marker: RegExp) {
  await assert.rejects(callback, marker, `${name}: intended assertion did not reject`);
  controls += 1;
  console.log(`${name}: intentional rejection confirmed`);
}
const error = (status: number): ResponseData => ({
  status,
  headers: { "content-type": "application/json" },
  body: '{"error":"Deliberately wrong control"}',
});
async function responder(server: Server, check: (upload: Upload) => Promise<void>) {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const upload = openUpload(`http://127.0.0.1:${address.port}`);
  try {
    await check(upload);
  } finally {
    upload.close();
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}
function send(response: import("node:http").ServerResponse, status: number) {
  response.writeHead(status, { "Content-Type": "application/json", "Retry-After": "1" });
  response.end(error(status).body);
}

await responder(
  createServer().on("checkContinue", (_request, response) => send(response, 415)),
  (upload) => assertEarlyError(upload, 415),
);
await responder(
  createServer().on("checkContinue", (_request, response) => response.writeContinue()),
  (upload) => assertAdmitted(upload),
);
await responder(
  createServer().on("checkContinue", (_request, response) => {
    response.writeContinue();
    send(response, 408);
  }),
  (upload) => assertTimeout(upload, { min: 0, max: 3_000 }),
);
console.log(
  "Positive early rejection/admission/readable-timeout controls passed; timeout control uses a test-only window.",
);

rejected("wrong-precedence", () => assertErrorResponse(error(415), 404), /415 !== 404/);
rejected(
  "normalized-alias-accepted",
  () => assertErrorResponse({ ...error(200), body: '{"frameCount":3}' }, 404),
  /200 !== 404/,
);
await responder(
  createServer().on("checkContinue", (_request, response) => {
    response.writeContinue();
    send(response, 503);
  }),
  (upload) => rejects("premature-continue-before-busy", () => assertEarlyError(upload, 503), /received Continue/),
);
await responder(
  createServer().on("checkContinue", (request, response) => {
    request.once("data", () => send(response, 503));
  }),
  (upload) => rejects("busy-rejection-waits-for-body", () => assertEarlyError(upload, 503), /before body transmission/),
);
await responder(
  createServer().on("checkContinue", (_request, response) => send(response, 503)),
  (upload) => rejects("leaked-slot-refuses-next-admission", () => assertAdmitted(upload), /not admitted/),
);
await responder(
  createServer().on("checkContinue", (request, response) => {
    response.writeContinue();
    request.socket.destroy();
  }),
  async (upload) => {
    await rejects(
      "timeout-reset-not-readable",
      () => assertTimeout(upload, IDLE_WINDOW),
      /closed without readable 408/,
    );
  },
);
await responder(
  createServer().on("checkContinue", (_request, response) => {
    response.writeContinue();
    send(response, 408);
  }),
  (upload) =>
    rejects("premature-total-timeout", () => assertTimeout(upload, TOTAL_WINDOW), /outside observation window/),
);
await responder(
  createServer().on("checkContinue", (_request, response) => {
    response.writeContinue();
    send(response, 400);
  }),
  (upload) => rejects("timeout-wrong-status", () => assertTimeout(upload, IDLE_WINDOW), /400 !== 408/),
);

await responder(
  createServer().on("checkContinue", (request, response) => {
    response.writeContinue();
    response.writeHead(200, { "Content-Type": "application/json", "Content-Length": "100" });
    response.flushHeaders();
    setTimeout(() => request.socket.destroy(), 10);
  }),
  (upload) =>
    rejects(
      "unfinished-200-headers-then-reset",
      async () => {
        const closed = await within(upload.closure, 3_000, "Control socket failed to close");
        assertStragglerOutcome(closed, upload.started, upload.started + 8_000);
      },
      /partial success/,
    ),
);

const results: Execution[] = inventory.cases.map((entry) => ({
  ...entry,
  status: "passed",
  expectedStatus: "passed",
  retry: 0,
  retries: 0,
}));
assertInventory(inventory.cases);
assertExecution(inventory.cases, results);
rejected("discovery-missing-case", () => assertInventory(inventory.cases.slice(1)), /inventory mismatch/);
rejected("discovery-duplicate-case", () => assertInventory([...inventory.cases, inventory.cases[0]!]), /duplicates/);
rejected(
  "discovery-renamed-case",
  () => assertInventory(inventory.cases.map((entry, i) => (i ? entry : { ...entry, title: "substitute" }))),
  /inventory mismatch/,
);
rejected("execution-zero-results", () => assertExecution(inventory.cases, []), /inventory mismatch/);
rejected("execution-missing-result", () => assertExecution(inventory.cases, results.slice(1)), /inventory mismatch/);
rejected("execution-duplicate-result", () => assertExecution(inventory.cases, [...results, results[0]!]), /duplicates/);
for (const [name, mutation, marker] of [
  ["skipped", { status: "skipped" }, /did not pass/],
  ["failed", { status: "failed" }, /did not pass/],
  ["timed-out", { status: "timedOut" }, /did not pass/],
  ["interrupted", { status: "interrupted" }, /did not pass/],
  ["expected-failure", { expectedStatus: "failed" }, /expected failure/],
  ["retried", { retry: 1 }, /retries are forbidden/],
  ["configured-retry", { retries: 1 }, /retries are forbidden/],
] as const)
  rejected(
    `execution-${name}`,
    () =>
      assertExecution(
        inventory.cases,
        results.map((entry, i) => (i ? entry : { ...entry, ...mutation })),
      ),
    marker,
  );

const savedEnvironment = { ...process.env };
try {
  Object.assign(process.env, {
    BASE_URL: "http://127.0.0.1:32101",
    API_BASE_URL: "http://127.0.0.1:32102",
    FAULT_CONTROL_URL: "http://127.0.0.1:32103",
    ACCEPTANCE_TARGET_KIND: "local",
    ACCEPTANCE_TARGET_ORIGIN: "http://127.0.0.1:32101",
    ACCEPTANCE_TARGET_ID: "control-only",
    ACCEPTANCE_ALLOW_FAULTS: "1",
    ACCEPTANCE_FAULT_TOKEN: "control-only-token-never-used-on-network",
    ACCEPTANCE_SUITE_REVISION: "c".repeat(40),
  });
  assert.equal(buildReport("passed", false, inventory.cases, results).status, "passed");
  for (const overall of ["failed", "interrupted", "timedout"]) {
    const failed = buildReport(
      overall,
      false,
      inventory.cases,
      results.map((entry, i) => (i ? entry : { ...entry, status: "failed" })),
    );
    assert.equal(failed.status, "failed");
    assert.equal(failed.targetId, "control-only");
    assert.equal(failed.targetOrigin, "http://127.0.0.1:32101");
    assert.equal(failed.targetKind, "local");
    assert.equal(failed.suiteRevision, "c".repeat(40));
    assert.equal(failed.failed, 1);
    controls += 1;
    console.log(`report-${overall}: failed outcome retains validated identity`);
  }
  for (const incomplete of [
    [],
    results.slice(1),
    [...results, results[0]!],
    results.map((entry, i) => (i ? entry : { ...entry, status: "skipped" })),
  ]) {
    assert.equal(buildReport("passed", false, inventory.cases, incomplete).status, "failed");
    controls += 1;
    console.log("report-incomplete: cannot report full success");
  }
  process.env.BASE_URL = "http://secret:invalid@127.0.0.1:32101";
  process.env.ACCEPTANCE_SUITE_REVISION = "invalid-suite";
  const invalid = buildReport("passed", false, inventory.cases, results);
  assert.equal(invalid.status, "failed");
  assert.equal(invalid.targetOrigin, "unknown");
  assert.equal(invalid.suiteRevision, "unrecorded");
  assert.ok(!JSON.stringify(invalid).includes("secret:invalid"));
  controls += 1;
  console.log("report-invalid-binding: rejected without leaking raw identity");
  const discovery = buildReport("passed", true, inventory.cases, []);
  assert.equal(discovery.evidenceKind, "candidate-discovery");
  assert.equal(discovery.passed, 0);
} finally {
  for (const key of Object.keys(process.env)) if (!(key in savedEnvironment)) delete process.env[key];
  Object.assign(process.env, savedEnvironment);
}

const spec = JSON.parse(readFileSync(new URL("../fixtures/openapi.json", import.meta.url), "utf8"));
assertOpenApi(spec);
for (const [name, mutate, marker] of [
  [
    "external-ref",
    (doc: any) => {
      doc.components.schemas.FrameCount.$ref = "https://invalid.test/spec";
    },
    /must be local/,
  ],
  [
    "missing-response",
    (doc: any) => {
      delete doc.paths["/file-upload"].post.responses["413"];
    },
    /deep-equal/,
  ],
  [
    "multipart-body",
    (doc: any) => {
      doc.paths["/file-upload"].post.requestBody.content = { "multipart/form-data": {} };
    },
    /deep-equal/,
  ],
  [
    "extra-success-property",
    (doc: any) => {
      doc.components.schemas.FrameCount.properties.extra = { type: "boolean" };
    },
    /deep-equal/,
  ],
  [
    "head-content",
    (doc: any) => {
      doc.paths["/file-upload"].head.responses["405"].content = {};
    },
    /HEAD response must have no content/,
  ],
  [
    "zero-count",
    (doc: any) => {
      doc.components.schemas.FrameCount.properties.frameCount.minimum = 0;
    },
    /deep-equal/,
  ],
] as const) {
  const copy = structuredClone(spec);
  mutate(copy);
  rejected(`openapi-${name}`, () => assertOpenApi(copy), marker);
}

const initial = {
  schemaVersion: 1,
  kind: "api-lifecycle-state",
  target: {
    project: "mp3-e2e-control",
    service: "api",
    containerId: "a".repeat(64),
    imageId: `sha256:${"b".repeat(64)}`,
  },
  generation: { startedAt: "2026-10-10T10:00:00.123456789Z", restartCount: 0 },
  state: {
    running: true,
    paused: false,
    restarting: false,
    dead: false,
    exitCode: 0,
    oomKilled: false,
    hasError: false,
  },
};
const record = (value: unknown, status = 200): ResponseData => ({
  status,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(value),
});
const parsed = readState(record(initial));
const normal = { ...initial, state: { ...initial.state, running: false } };
assertNormalExit(readState(record(normal), parsed));
const ack = {
  schemaVersion: 1,
  kind: "api-signal-acknowledgment",
  signal: "SIGTERM",
  target: initial.target,
  generation: initial.generation,
};
readAcknowledgment(record(ack, 202), parsed);
rejected(
  "ack-stale-generation",
  () => readAcknowledgment(record({ ...ack, generation: { ...ack.generation, restartCount: 1 } }, 202), parsed),
  /generation changed/,
);
rejected(
  "state-wrong-target",
  () => readState(record({ ...normal, target: { ...initial.target, containerId: "c".repeat(64) } }), parsed),
  /target changed/,
);
rejected(
  "state-stale-generation",
  () =>
    readState(record({ ...normal, generation: { ...initial.generation, startedAt: "2026-10-10T10:01:00Z" } }), parsed),
  /generation changed/,
);
rejected("state-extra-field", () => readState(record({ ...initial, drained: true })), /must be closed/);
for (const [name, mutation] of [
  ["still-running", { running: true }],
  ["forced-137", { exitCode: 137 }],
  ["oom", { oomKilled: true }],
  ["error", { hasError: true }],
  ["paused", { paused: true }],
  ["restarting", { restarting: true }],
  ["dead", { dead: true }],
] as const)
  rejected(
    `normal-exit-${name}`,
    () => assertNormalExit(readState(record({ ...normal, state: { ...normal.state, ...mutation } }))),
    /did not exit normally/,
  );
const start = performance.now();
assertStragglerOutcome({ kind: "closed", at: start + 5_000 }, start, start + 8_000);
rejected(
  "straggler-partial-success",
  () =>
    assertStragglerOutcome(
      { kind: "response", at: start + 10, response: { ...error(200), body: '{"frameCount":1}' } },
      start,
      start + 8_000,
    ),
  /partial success/,
);
rejected(
  "straggler-pre-signal-loss",
  () => assertStragglerOutcome({ kind: "closed", at: start - 1 }, start, start + 8_000),
  /before shutdown/,
);
rejected(
  "straggler-missing-deadline",
  () => assertStragglerOutcome({ kind: "closed", at: start + 9_000 }, start, start + 8_000),
  /missed shutdown deadline/,
);
const observedAt = performance.now();
await observeShutdown(parsed, Promise.resolve({ kind: "closed", at: observedAt + 1 }), observedAt, async () =>
  record(normal),
);
await rejects(
  "no-op-signal-acknowledgment",
  () =>
    observeShutdown(parsed, Promise.resolve({ kind: "closed", at: performance.now() }), performance.now(), async () =>
      record(initial),
    ),
  /Normal exit was not observed/,
);
await rejects(
  "normal-exit-without-socket-closure",
  () => observeShutdown(parsed, new Promise(() => {}), performance.now(), async () => record(normal)),
  /Straggler did not close/,
);
console.log(
  `Verified ${controls} deliberate transport/inventory/specification/lifecycle rejections; positive predicates also passed. No application acceptance executed.`,
);
