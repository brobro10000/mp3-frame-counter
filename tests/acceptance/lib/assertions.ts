/**
 * Shared external response assertions for real HTTP acceptance and intentional negative controls.
 * Inputs are status, headers and response bytes, never product code. Throws AssertionError on contract mismatch;
 * has no network, filesystem or mutation side effects. Import these functions rather than duplicating checks.
 */
import assert from "node:assert/strict";

export interface ResponseData {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: string;
}

export function assertJson(response: ResponseData): unknown {
  assert.match(String(response.headers["content-type"]), /^application\/json(?:\s*;\s*charset=utf-8)?$/i);
  return JSON.parse(response.body);
}

export function assertFrameResponse(response: ResponseData, expected: number): void {
  assert.equal(response.status, 200);
  assert.ok(Number.isSafeInteger(expected) && expected > 0);
  assert.deepEqual(assertJson(response), { frameCount: expected });
}

export function assertErrorResponse(response: ResponseData, status: number): void {
  assert.equal(response.status, status);
  const value = assertJson(response) as Record<string, unknown>;
  assert.ok(value !== null && typeof value === "object" && !Array.isArray(value));
  assert.deepEqual(Object.keys(value), ["error"]);
  assert.equal(typeof value.error, "string");
  assert.ok((value.error as string).trim().length > 0);
  assert.doesNotMatch(value.error as string, /\bat .*\.(?:[cm]?[jt]s):\d|\/Users\/|\/home\//);
}
