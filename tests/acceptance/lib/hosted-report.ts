/**
 * Closed sanitized hosted reporter/result predicates. Explicit calls read only fixed reviewed inventories. They never
 * authenticate provider observations or turn candidate controls into application evidence. Invalid shapes, unknown
 * tuples and incomplete passing results throw a fixed diagnostic; failed known subsets remain truthfully incomplete.
 */
import { isDeepStrictEqual } from "node:util";
import {
  assertHostedExecution,
  assertHostedInventory,
  hostedInventory,
  requireHostedExecutions,
} from "./hosted-inventory.ts";
import { hostedFailure, parseHostedInput } from "./hosted-target.ts";
import type {
  CaseRef,
  Execution,
  FailureCode,
  Finalization,
  HostedRows,
  HostedSuiteResultV1,
  Profile,
  PublicInput,
} from "./hosted-types.ts";
const failureCodes: FailureCode[] = [
  "INPUT",
  "IDENTITY",
  "ENVIRONMENT",
  "HTTP",
  "TLS",
  "RESPONSE_BOUND",
  "FOREIGN_ATTEMPT",
  "REDIRECT",
  "UNOWNED_PAGE",
  "WORKER",
  "WEBSOCKET",
  "CDP",
  "PAUSED_TIMEOUT",
  "OBSERVER",
  "ASSERTION",
  "OVERFLOW",
  "CLEANUP",
];
/** Reject missing, additional or non-JSON-shaped record fields with a fixed identity diagnostic. */
function closed(value: unknown, keys: string[]): asserts value is Record<string, any> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype ||
    Object.keys(value).length !== keys.length ||
    !keys.every((k) => Object.hasOwn(value, k))
  )
    throw hostedFailure("IDENTITY");
}
/** Validate exact finalization data, including unique fixed codes; never serialize caller errors or headers. */
export function requireHostedFinalization(value: unknown): Finalization {
  closed(value, ["cleanup", "failures"]);
  if (
    !["passed", "failed"].includes(value.cleanup) ||
    !Array.isArray(value.failures) ||
    value.failures.some((code: unknown) => !failureCodes.includes(code as FailureCode)) ||
    new Set(value.failures).size !== value.failures.length
  )
    throw hostedFailure("IDENTITY");
  return { cleanup: value.cleanup, failures: [...value.failures] };
}
/** Reuse syntax validation on a credential-free public record; synthetic validation credentials confer no authority. */
function requirePublic(input: PublicInput): void {
  closed(input, ["schemaVersion", "kind", "profile", "launchId", "sourceRevision", "suite", "target", "audience"]);
  parseHostedInput(
    Buffer.from(
      JSON.stringify({
        ...input,
        credential: {
          kind: "google-id-token",
          value: "report.validation.synthetic",
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
      }),
    ),
    input.profile,
    Date.now(),
  );
}
/** Require intermediate report identity and complete per-case finalization before a wrapper may accept its pass. */
export function requireHostedRows(value: unknown, input: PublicInput): HostedRows {
  requirePublic(input);
  closed(value, [
    "schemaVersion",
    "kind",
    "profile",
    "launchId",
    "sourceRevision",
    "suite",
    "inventory",
    "tests",
    "status",
    "finalizations",
  ]);
  if (
    value.schemaVersion !== 1 ||
    value.kind !== "hosted-suite-rows" ||
    value.profile !== input.profile ||
    value.launchId !== input.launchId ||
    value.sourceRevision !== input.sourceRevision ||
    !isDeepStrictEqual(value.suite, input.suite) ||
    !["passed", "failed"].includes(value.status)
  )
    throw hostedFailure("IDENTITY");
  assertHostedInventory(input.profile, value.inventory);
  const tests = requireHostedExecutions(input.profile, value.tests);
  if (!Array.isArray(value.finalizations)) throw hostedFailure("IDENTITY");
  const known = new Set(hostedInventory(input.profile).map((row) => JSON.stringify([row.file, row.title]))),
    seen = new Set<string>();
  for (const record of value.finalizations) {
    closed(record, ["case", "cleanup", "failures"]);
    closed(record.case, ["file", "title"]);
    const key = JSON.stringify([record.case.file, record.case.title]);
    if (
      !known.has(key) ||
      seen.has(key) ||
      !tests.some((row) => row.file === record.case.file && row.title === record.case.title)
    )
      throw hostedFailure("IDENTITY");
    seen.add(key);
    requireHostedFinalization({ cleanup: record.cleanup, failures: record.failures });
  }
  if (value.status === "passed") {
    assertHostedExecution(input.profile, value.inventory, tests);
    if (
      seen.size !== known.size ||
      value.finalizations.some((row: any) => row.cleanup !== "passed" || row.failures.length)
    )
      throw hostedFailure("IDENTITY");
  }
  return structuredClone(value) as HostedRows;
}
/** Build the policy's result from verified public identity and real rows; cleanup failure can never produce a pass. */
export function buildHostedResult(
  input: PublicInput,
  rows: readonly Execution[],
  finish: Finalization,
  outcome: "passed" | "failed" | "blocked",
): HostedSuiteResultV1 {
  requirePublic(input);
  const final = requireHostedFinalization(finish);
  if (!["passed", "failed", "blocked"].includes(outcome)) throw hostedFailure("IDENTITY");
  const tests = requireHostedExecutions(input.profile, rows),
    inventory = hostedInventory(input.profile);
  if (outcome === "blocked" && tests.length) throw hostedFailure("IDENTITY");
  if (outcome === "passed") {
    assertHostedExecution(input.profile, inventory, tests);
    if (final.cleanup !== "passed" || final.failures.length) throw hostedFailure("IDENTITY");
  }
  return {
    schemaVersion: 1,
    kind: "hosted-suite-result",
    profile: input.profile,
    launchId: input.launchId,
    sourceRevision: input.sourceRevision,
    suite: structuredClone(input.suite),
    inventory,
    tests,
    status: outcome,
    cleanup: final.cleanup,
  };
}
