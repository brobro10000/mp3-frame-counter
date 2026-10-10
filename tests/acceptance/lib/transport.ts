/**
 * Bounded HTTP/1.1 probes for the private API. Header-only Expect requests expose admission before any body is sent.
 * Outcome promises always settle as data, avoiding unhandled rejections during held uploads. Only explicit cleanup
 * destroys client sockets; elapsed observations use the monotonic clock. No application imports or parser exists.
 */
import assert from "node:assert/strict";
import http from "node:http";
import https from "node:https";
import { performance } from "node:perf_hooks";
import { assertErrorResponse, assertFrameResponse, type ResponseData } from "./assertions.ts";

export const EARLY_MS = 3_000;
export const IDLE_WINDOW = { min: 8_000, max: 15_000 };
export const TOTAL_WINDOW = { min: 25_000, max: 38_000 };
export const SHUTDOWN_MS = 8_000;
export type Outcome = { kind: "response"; response: ResponseData; at: number } | { kind: "closed"; at: number };
export type First = { kind: "continue"; at: number } | Outcome;

export async function within<T>(promise: Promise<T>, milliseconds: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), Math.max(1, milliseconds));
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}
export const delay = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export function openUpload(
  origin: string,
  options: {
    path?: string;
    method?: string;
    headers?: Record<string, string>;
    length?: number;
    expectation?: string;
  } = {},
) {
  const started = performance.now();
  let firstResolve!: (value: First) => void;
  let outcomeResolve!: (value: Outcome) => void;
  let closureResolve!: (value: Outcome) => void;
  const closure = new Promise<Outcome>((resolve) => {
    closureResolve = resolve;
  });
  let observedResponse: ResponseData | undefined;
  const first = new Promise<First>((resolve) => {
    firstResolve = resolve;
  });
  const outcome = new Promise<Outcome>((resolve) => {
    outcomeResolve = resolve;
  });
  let settled = false;
  let continued = false;
  let sentBytes = 0;
  let complete = false;
  const parsed = new URL(options.path ?? "/file-upload", origin);
  const request = (parsed.protocol === "https:" ? https : http).request(parsed, {
    method: options.method ?? "POST",
    agent: false,
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(options.length ?? 1152),
      Expect: options.expectation ?? "100-continue",
      ...options.headers,
    },
  });
  function finish(value: Outcome) {
    if (settled) return;
    settled = true;
    firstResolve(value);
    outcomeResolve(value);
  }
  request.on("socket", (socket) =>
    socket.once("close", () => {
      const at = performance.now();
      closureResolve(observedResponse ? { kind: "response", response: observedResponse, at } : { kind: "closed", at });
    }),
  );
  request.on("continue", () => {
    continued = true;
    firstResolve({ kind: "continue", at: performance.now() });
  });
  request.on("response", (response) => {
    observedResponse = { status: response.statusCode ?? 0, headers: response.headers, body: "" };
    const chunks: Buffer[] = [];
    let bytes = 0;
    response.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > 64 * 1024) response.destroy();
      else chunks.push(chunk);
    });
    response.on("error", () => finish({ kind: "closed", at: performance.now() }));
    response.on("end", () => {
      complete = true;
      finish({
        kind: "response",
        response: {
          status: response.statusCode ?? 0,
          headers: response.headers,
          body: Buffer.concat(chunks).toString("utf8"),
        },
        at: performance.now(),
      });
    });
  });
  request.on("error", () => {
    if (!complete) finish({ kind: "closed", at: performance.now() });
  });
  request.on("close", () => {
    if (!complete) finish({ kind: "closed", at: performance.now() });
  });
  request.flushHeaders();
  return {
    first,
    outcome,
    closure,
    started,
    get continued() {
      return continued;
    },
    get sentBytes() {
      return sentBytes;
    },
    get settled() {
      return settled;
    },
    write(bytes: Buffer) {
      assert.ok(!settled, "Upload already ended");
      sentBytes += bytes.length;
      request.write(bytes);
    },
    end(bytes: Buffer) {
      assert.ok(!settled, "Upload already ended");
      sentBytes += bytes.length;
      request.end(bytes);
    },
    close() {
      request.destroy();
    },
  };
}
export type Upload = ReturnType<typeof openUpload>;

export async function assertAdmitted(upload: Upload): Promise<void> {
  const first = await within(upload.first, EARLY_MS, "Admission did not arrive before body transmission");
  assert.equal(first.kind, "continue", "Upload was not admitted with 100 Continue");
  assert.equal(upload.sentBytes, 0, "Admission must precede all body bytes");
  assert.ok(!upload.settled, "Admitted upload already ended");
}
export async function assertEarlyError(upload: Upload, status: number, allow?: string): Promise<void> {
  const first = await within(upload.first, EARLY_MS, "Early rejection did not arrive before body transmission");
  assert.equal(first.kind, "response", "Rejected request received Continue or closed without readable error");
  assert.equal(upload.continued, false, "Rejected request received Continue");
  assert.equal(upload.sentBytes, 0, "Early rejection must precede all body bytes");
  if (first.kind !== "response") throw new Error("No complete early response");
  assertErrorResponse(first.response, status);
  if (allow) assert.equal(first.response.headers.allow, allow);
  if (status === 503) assert.match(String(first.response.headers["retry-after"]), /^[1-9]\d*$/);
}
export async function assertUploadCount(upload: Upload, expected: number): Promise<void> {
  const result = await within(upload.outcome, EARLY_MS, "Completed upload response missing");
  assert.equal(result.kind, "response", "Completed upload closed without response");
  if (result.kind === "response") assertFrameResponse(result.response, expected);
}
export async function assertTimeout(upload: Upload, window: { min: number; max: number }): Promise<void> {
  const result = await within(
    upload.outcome,
    window.max - (performance.now() - upload.started),
    "Body deadline missing",
  );
  assert.equal(result.kind, "response", "Body deadline closed without readable 408");
  if (result.kind !== "response") throw new Error("No complete timeout response");
  assertErrorResponse(result.response, 408);
  const elapsed = result.at - upload.started;
  assert.ok(elapsed >= window.min && elapsed <= window.max, `Body deadline outside observation window: ${elapsed} ms`);
}
