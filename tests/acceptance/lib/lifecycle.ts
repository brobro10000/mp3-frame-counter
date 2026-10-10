/**
 * Closed lifecycle readback predicates and bounded straggler observation. Uses only the reviewed fixed controller
 * routes, current target inputs and opaque identity/generation. A daemon acknowledgment never certifies graceful drain.
 */
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { assertJson, type ResponseData } from "./assertions.ts";
import { rawRequest } from "./http.ts";
import { delay, SHUTDOWN_MS, within, type Outcome } from "./transport.ts";

export interface Identity {
  target: { project: string; service: string; containerId: string; imageId: string };
  generation: { startedAt: string; restartCount: number };
}
export interface State extends Identity {
  schemaVersion: number;
  kind: string;
  state: {
    running: boolean;
    paused: boolean;
    restarting: boolean;
    dead: boolean;
    exitCode: number;
    oomKilled: boolean;
    hasError: boolean;
  };
}
function keys(value: unknown, expected: string[]): asserts value is Record<string, unknown> {
  assert.ok(value !== null && typeof value === "object" && !Array.isArray(value), "Lifecycle record required");
  assert.deepEqual(Object.keys(value).sort(), expected.sort(), "Lifecycle record must be closed");
}
function identity(value: Record<string, unknown>): asserts value is Record<string, unknown> & Identity {
  keys(value.target, ["project", "service", "containerId", "imageId"]);
  for (const field of ["project", "service", "containerId", "imageId"])
    assert.equal(typeof value.target[field], "string");
  assert.match(String(value.target.project), /^mp3-e2e-[a-z0-9-]+$/);
  assert.ok(String(value.target.project).length <= 128);
  assert.equal(value.target.service, "api");
  assert.match(String(value.target.containerId), /^[a-f0-9]{64}$/);
  assert.match(String(value.target.imageId), /^sha256:[a-f0-9]{64}$/);
  keys(value.generation, ["startedAt", "restartCount"]);
  assert.equal(typeof value.generation.startedAt, "string");
  assert.match(value.generation.startedAt as string, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,9})?Z$/);
  assert.ok(
    Number.isFinite(Date.parse(value.generation.startedAt as string)) &&
      !String(value.generation.startedAt).startsWith("0001-"),
  );
  assert.ok(Number.isSafeInteger(value.generation.restartCount) && Number(value.generation.restartCount) >= 0);
}
export function assertSameIdentity(value: Identity, expected: Identity): void {
  assert.deepEqual(value.target, expected.target, "Lifecycle target changed");
  assert.deepEqual(value.generation, expected.generation, "Lifecycle generation changed");
}
export function readState(response: ResponseData, expected?: Identity): State {
  assert.equal(response.status, 200);
  assert.ok(Buffer.byteLength(response.body) <= 4096, "Lifecycle response too large");
  const value = assertJson(response);
  keys(value, ["schemaVersion", "kind", "target", "generation", "state"]);
  assert.equal(value.schemaVersion, 1);
  assert.equal(value.kind, "api-lifecycle-state");
  identity(value);
  keys(value.state, ["running", "paused", "restarting", "dead", "exitCode", "oomKilled", "hasError"]);
  for (const field of ["running", "paused", "restarting", "dead", "oomKilled", "hasError"])
    assert.equal(typeof value.state[field], "boolean");
  assert.ok(
    Number.isInteger(value.state.exitCode) && Number(value.state.exitCode) >= 0 && Number(value.state.exitCode) <= 255,
  );
  if (expected) assertSameIdentity(value, expected);
  return value as unknown as State;
}
export function readAcknowledgment(response: ResponseData, expected: Identity): Identity {
  assert.equal(response.status, 202);
  assert.ok(Buffer.byteLength(response.body) <= 4096, "Lifecycle acknowledgment too large");
  const value = assertJson(response);
  keys(value, ["schemaVersion", "kind", "target", "generation", "signal"]);
  assert.equal(value.schemaVersion, 1);
  assert.equal(value.kind, "api-signal-acknowledgment");
  assert.equal(value.signal, "SIGTERM");
  identity(value);
  assertSameIdentity(value, expected);
  return value;
}
export function assertNormalExit(value: State): void {
  assert.deepEqual(
    value.state,
    {
      running: false,
      paused: false,
      restarting: false,
      dead: false,
      exitCode: 0,
      oomKilled: false,
      hasError: false,
    },
    "API did not exit normally",
  );
}
export async function control(
  origin: string,
  action: "state" | "signal-term" | "start",
  timeout = 6_000,
): Promise<ResponseData> {
  return rawRequest(`${origin}/${action}`, {
    method: "POST",
    timeout,
    headers: { "X-Acceptance-Control-Token": process.env.ACCEPTANCE_FAULT_TOKEN! },
  });
}
export function assertStragglerOutcome(outcome: Outcome, started: number, deadline: number): void {
  assert.ok(outcome.at >= started, "Straggler ended before shutdown was requested");
  assert.ok(outcome.at <= deadline, "Straggler missed shutdown deadline");
  if (outcome.kind === "response")
    assert.notEqual(outcome.response.status, 200, "Unfinished upload produced partial success");
}
/**
 * Observe an unfinished upload's actual socket-closure promise (openUpload().closure), using the monotonic
 * performance.now() timestamp taken when SIGTERM was requested and the previously validated target/generation.
 * Poll the supplied bounded state-read callback within the remaining shutdown window; only 409 reads are retried.
 * Resolve only for timely closure without partial success and normal exit of that same identity. Reject missing/late
 * closure, invalid readback, changed identity, abnormal exit or deadline expiry; this does not certify graceful drain.
 * Observation timeouts do not cancel underlying work. The caller owns socket cleanup and service restoration in finally.
 */
export async function observeShutdown(
  initial: Identity,
  outcome: Promise<Outcome>,
  started: number,
  state: () => Promise<ResponseData>,
): Promise<void> {
  const deadline = started + SHUTDOWN_MS;
  const closed = within(outcome, deadline - performance.now(), "Straggler did not close before shutdown deadline");
  // Observe closure and process state together; keep every rejection handled until Promise.all reports it.
  const exited = (async () => {
    while (performance.now() < deadline) {
      const response = await within(state(), deadline - performance.now(), "Lifecycle state deadline expired");
      if (response.status === 409) {
        await delay(100);
        continue;
      }
      const value = readState(response, initial);
      if (!value.state.running) {
        assertNormalExit(value);
        return;
      }
      await delay(100);
    }
    throw new Error("Normal exit was not observed before shutdown deadline");
  })();
  const [result] = await Promise.all([closed, exited]);
  assertStragglerOutcome(result, started, deadline);
}
