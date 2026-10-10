/**
 * Independent credential and HTTP boundary expectations for the trusted acceptance review reader.
 * Run with pinned Node: node --test scripts/acceptance-review-http.test.mjs after implementation is available.
 * Every response and token is synthetic; injected fetch functions prevent network, account or Git operations.
 * Tests exercise observable trust boundaries without prescribing the adapter's diagnostic wording or JSON consumers.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createGithubReviewRequest } from "./acceptance-review-http.mjs";

const repository = "example/private-mp3";
const prefix = `/repos/${repository}`;
const token = "synthetic-review-token-not-a-credential";
const privateDetail = "synthetic-untrusted-server-detail";
const maxBytes = 1024 * 1024;

function sanitized(error) {
  assert(error instanceof Error);
  assert.equal(typeof error.message, "string");
  assert(error.message.length > 0);
  const diagnostic = [String(error), error.stack, JSON.stringify(error), String(error.cause ?? "")].join("\n");
  assert(!diagnostic.includes(token), "An adapter failure must not expose its credential");
  assert(!diagnostic.includes(privateDetail), "An adapter failure must not expose untrusted response details");
  return true;
}

async function rejectedBeforeFetch({ repo = repository, suppliedToken = token, method = "GET", path = prefix }) {
  let calls = 0;
  await assert.rejects(async () => {
    const request = createGithubReviewRequest({
      repository: repo,
      token: suppliedToken,
      fetchImpl: async () => {
        calls += 1;
        return new Response("{}");
      },
    });
    await request(method, path);
  }, sanitized);
  assert.equal(calls, 0, "An unsafe request must fail before any credential-bearing fetch");
}

test("valid review reads return parsed JSON at the fixed GitHub origin with bounded request options", async () => {
  const calls = [];
  const value = { id: 101, nested: { state: "APPROVED" }, observations: [1, 2] };
  const request = createGithubReviewRequest({
    repository,
    token,
    fetchImpl: async (input, options) => {
      calls.push({ url: new URL(input), options });
      return new Response(JSON.stringify(value));
    },
  });
  for (const path of [
    prefix,
    `${prefix}/pulls/7`,
    `${prefix}/pulls/7/reviews/101`,
    `${prefix}/git/commits/${"a".repeat(40)}`,
  ]) {
    assert.deepEqual(await request("GET", path), value);
  }
  assert.equal(calls.length, 4);
  for (const { url, options } of calls) {
    assert.equal(url.origin, "https://api.github.com");
    assert.equal(url.username, "");
    assert.equal(url.password, "");
    assert.equal(url.search, "");
    assert(!url.href.includes(token));
    assert.equal(options.method, "GET");
    assert.equal(options.redirect, "error");
    assert(options.signal instanceof AbortSignal);
    assert.equal(options.body, undefined);
    assert.equal(new Headers(options.headers).get("authorization"), `Bearer ${token}`);
  }
});

test("mutation and unsupported methods fail before authenticated fetch", async () => {
  for (const method of ["POST", "PATCH", "PUT", "DELETE", "HEAD", "get", undefined]) {
    // Pass an explicit nondefault call for undefined rather than allowing the helper's default to substitute GET.
    if (method === undefined) {
      let calls = 0;
      const request = createGithubReviewRequest({
        repository,
        token,
        fetchImpl: async () => {
          calls += 1;
          return new Response("{}");
        },
      });
      await assert.rejects(async () => request(undefined, prefix), sanitized);
      assert.equal(calls, 0);
    } else await rejectedBeforeFetch({ method });
  }
});

test("malformed repository identities cannot redirect credential scope", async () => {
  for (const repo of [
    "",
    "example",
    "example/private-mp3/extra",
    "../private-mp3",
    "example/..",
    "example:443/private-mp3",
  ]) {
    await rejectedBeforeFetch({ repo });
  }
});

test("absolute, cross-repository and traversal paths fail before authenticated fetch", async () => {
  for (const path of [
    `https://api.github.com${prefix}`,
    "https://untrusted.invalid/repos/example/private-mp3",
    "//untrusted.invalid/repos/example/private-mp3",
    "/repos/example/other/pulls/7",
    `${prefix}-other/pulls/7`,
    `${prefix}/../../../other/private-mp3`,
    `${prefix}/%2e%2e/%2e%2e/other/private-mp3`,
    `${prefix}\\..\\other\\pulls\\7`,
    `${prefix}/pulls/7#ignored-fragment`,
  ]) {
    await rejectedBeforeFetch({ path });
  }
});

test("credentials cannot appear in a requested URL or credential query", async () => {
  for (const path of [
    `https://${token}@api.github.com${prefix}`,
    `${prefix}/pulls/7?access_token=${token}`,
    `${prefix}/pulls/7?token=${token}`,
    `${prefix}/pulls/7?client_secret=${token}`,
  ]) {
    await rejectedBeforeFetch({ path });
  }
});

test("missing or header-unsafe caller credentials are rejected without a request", async () => {
  for (const suppliedToken of ["", null, 0, "synthetic\r\nInjected: header"]) {
    await rejectedBeforeFetch({ suppliedToken });
  }
});

test("import and request creation do not obtain credentials from global environment", async () => {
  const originalEnvironment = process.env;
  const reads = [];
  const syntheticEnvironment = {
    GITHUB_TOKEN: "synthetic-environment-token",
    GH_TOKEN: "synthetic-environment-token",
    GATE_REVIEW_TOKEN: "synthetic-environment-token",
  };
  let calls = 0;
  process.env = new Proxy(syntheticEnvironment, {
    get(target, key) {
      if (Object.hasOwn(target, key)) reads.push(String(key));
      return Reflect.get(target, key);
    },
    has(target, key) {
      if (Object.hasOwn(target, key)) reads.push(String(key));
      return Reflect.has(target, key);
    },
    ownKeys(target) {
      reads.push("environment-enumeration");
      return Reflect.ownKeys(target);
    },
  });
  try {
    const fresh = await import(
      new URL("./acceptance-review-http.mjs?independent-environment-boundary", import.meta.url)
    );
    await assert.rejects(async () => {
      const request = fresh.createGithubReviewRequest({
        repository,
        token: undefined,
        fetchImpl: async () => {
          calls += 1;
          return new Response("{}");
        },
      });
      await request("GET", prefix);
    }, sanitized);
  } finally {
    process.env = originalEnvironment;
  }
  assert.deepEqual(reads, [], "The helper must use only its explicitly supplied token");
  assert.equal(calls, 0);
});

test("HTTP rejection and redirect responses cannot become successful JSON or expose their bodies", async () => {
  for (const status of [301, 302, 401, 403, 404, 429, 500]) {
    const request = createGithubReviewRequest({
      repository,
      token,
      fetchImpl: async () => new Response(`${privateDetail} ${token}`, { status }),
    });
    await assert.rejects(request("GET", prefix), sanitized);
  }
});

test("transport failures discard credential-bearing exception messages and causes", async () => {
  const request = createGithubReviewRequest({
    repository,
    token,
    fetchImpl: async () => {
      throw new Error(`${privateDetail} ${token}`, { cause: new Error(`${token} transport internals`) });
    },
  });
  await assert.rejects(request("GET", prefix), sanitized);
});

test("malformed successful response JSON fails with sanitized diagnostics", async () => {
  const request = createGithubReviewRequest({
    repository,
    token,
    fetchImpl: async () => new Response(`{"malformed": ${privateDetail} ${token}`),
  });
  await assert.rejects(request("GET", prefix), sanitized);
});

test("the 1 MiB response boundary is inclusive for a complete valid JSON document", async () => {
  const body = `{"value":"${"a".repeat(maxBytes - 12)}"}`;
  assert.equal(Buffer.byteLength(body), maxBytes);
  const request = createGithubReviewRequest({ repository, token, fetchImpl: async () => new Response(body) });
  assert.equal((await request("GET", prefix)).value.length, maxBytes - 12);
});

test("oversized streamed responses stop before consuming an unbounded body despite a false length header", async () => {
  let pulled = 0;
  let canceled = false;
  const stream = new ReadableStream({
    pull(controller) {
      pulled += 1;
      controller.enqueue(new Uint8Array(600_000).fill(120));
      if (pulled === 20) controller.close();
    },
    cancel() {
      canceled = true;
    },
  });
  const request = createGithubReviewRequest({
    repository,
    token,
    fetchImpl: async () => new Response(stream, { headers: { "content-length": "1" } }),
  });
  await assert.rejects(request("GET", prefix), sanitized);
  assert(pulled <= 4, "The adapter must bound actual bytes while reading, allowing limited stream prefetch");
  assert.equal(canceled, true, "Stop and cancel the response stream when its byte budget is exceeded");
});

test("same-repository review history accepts fixed bounded pagination parameters", async () => {
  const path = `${prefix}/pulls/7/reviews?per_page=100&page=2`;
  const calls = [];
  const value = [{ id: 101, state: "APPROVED" }];
  const request = createGithubReviewRequest({
    repository,
    token,
    fetchImpl: async (input, options) => {
      calls.push({ url: new URL(input), options });
      return new Response(JSON.stringify(value));
    },
  });
  assert.deepEqual(await request("GET", path), value);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.href, `https://api.github.com${path}`);
  assert.equal(calls[0].options.method, "GET");
  assert.equal(calls[0].options.redirect, "error");
});
