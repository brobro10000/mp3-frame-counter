/**
 * Shared external response assertions for real HTTP acceptance and intentional negative controls.
 * Inputs are status, headers and response bytes, never product code. Throws AssertionError on contract mismatch;
 * has no network, filesystem or mutation side effects. Import these functions rather than duplicating checks.
 */
import assert from "node:assert/strict";
import { assertCodedError } from "./backend-audio-errors.mjs";

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

/** Verify exact controlled code/status/message using the independent catalogue; never accept a legacy envelope. */
export function assertErrorResponse(response: ResponseData, status: number, code?: string): void {
  assert.equal(response.status, status);
  assertCodedError(assertJson(response), status, code);
}
