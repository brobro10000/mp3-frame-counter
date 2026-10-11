/**
 * Reviewed case identity and full-run predicates shared by discovery, reporting and falsification controls.
 * Reads only the local inventory; rejects incomplete/duplicate identities and any nonstandard execution outcome.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

export const inventory = JSON.parse(readFileSync(new URL("../fixtures/inventory.json", import.meta.url), "utf8")) as {
  contractRevision: string;
  cases: { file: string; title: string }[];
};
export const CONTRACT = "hosted-reasonless-v1";
export const identity = (entry: { file: string; title: string }) => `${entry.file} :: ${entry.title}`;
export interface Execution {
  file: string;
  title: string;
  status: string;
  expectedStatus: string;
  retry: number;
  retries: number;
}

export function assertInventory(cases: { file: string; title: string }[]): void {
  assert.equal(inventory.contractRevision, CONTRACT, "Inventory contract mismatch");
  const expected = inventory.cases.map(identity);
  const actual = cases.map(identity);
  assert.ok(expected.length > 0, "Reviewed inventory is empty");
  assert.equal(new Set(expected).size, expected.length, "Reviewed inventory contains duplicates");
  assert.equal(new Set(actual).size, actual.length, "Discovered inventory contains duplicates");
  assert.deepEqual([...actual].sort(), [...expected].sort(), "Exact mandatory inventory mismatch");
}

export function assertExecution(planned: { file: string; title: string }[], results: Execution[]): void {
  assertInventory(planned);
  assertInventory(results);
  for (const result of results) {
    assert.equal(result.status, "passed", `${result.title}: mandatory case did not pass`);
    assert.equal(result.expectedStatus, "passed", `${result.title}: expected failure/skip is forbidden`);
    assert.equal(result.retry, 0, `${result.title}: retries are forbidden`);
    assert.equal(result.retries, 0, `${result.title}: configured retries are forbidden`);
  }
}
