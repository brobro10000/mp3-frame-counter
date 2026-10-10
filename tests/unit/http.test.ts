/**
 * Exercise the API transport through real loopback HTTP/TCP connections. Run `node --test tests/unit/http.test.ts`.
 * Tests use frozen fixture bytes read-only, bind ephemeral ports and restore/close every connection. Short explicit
 * budgets make timeout/abort/shutdown checks bounded; no product output defines a fixture expectation or success mock.
 */
import assert from "node:assert/strict";
import { once } from "node:events";
import { request } from "node:http";
import type { ClientRequest, IncomingHttpHeaders } from "node:http";
import { connect } from "node:net";
import type { AddressInfo } from "node:net";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";
import type { TestContext } from "node:test";
import { createApiServer, DEFAULT_API_BUDGETS, MAX_UPLOAD_BYTES, parsePort } from "../../server/src/http.ts";
import type { ApiBudgets } from "../../server/src/http.ts";
import { fixtureBytes } from "../acceptance/lib/fixtures.ts";

interface Reply {
  status: number;
  headers: IncomingHttpHeaders;
  body: Buffer;
}

/** Start through the readiness boundary; test teardown owns all sockets even when startup rejects. */
async function start(context: TestContext, budgets: Partial<ApiBudgets> = {}) {
  const service = createApiServer(budgets);
  context.after(() => {
    service.server.closeAllConnections();
    return service.shutdown();
  });
  assert.equal(typeof service.listen, "function", "ApiService.listen readiness boundary must exist");
  await service.listen(0, "127.0.0.1");
  const port = (service.server.address() as AddressInfo).port;
  return { ...service, port };
}

function collectReply(outgoing: ClientRequest): Promise<Reply> {
  return new Promise((resolve, reject) => {
    outgoing.once("error", reject);
    outgoing.once("response", (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.once("error", reject);
      response.once("end", () => {
        resolve({ status: response.statusCode!, headers: response.headers, body: Buffer.concat(chunks) });
      });
    });
  });
}

async function send(
  port: number,
  options: { method?: string; path?: string; headers?: Record<string, string>; body?: Buffer } = {},
): Promise<Reply> {
  const outgoing = request({
    hostname: "127.0.0.1",
    port,
    method: options.method ?? "POST",
    path: options.path ?? "/file-upload",
    headers: options.headers ?? { "Content-Type": "audio/mpeg" },
    agent: false,
    timeout: 5_000,
  });
  outgoing.once("timeout", () => outgoing.destroy(new Error("Test client timed out")));
  const result = collectReply(outgoing);
  outgoing.end(options.body);
  return result;
}

function expectJson(reply: Reply, status: number, expected?: object): void {
  assert.equal(reply.status, status);
  assert.match(reply.headers["content-type"] ?? "", /^application\/json(?:;|$)/);
  assert.equal(reply.headers["cache-control"], "no-store");
  const body = JSON.parse(reply.body.toString("utf8"));
  if (expected) assert.deepEqual(body, expected);
  else {
    assert.deepEqual(Object.keys(body), ["error"]);
    assert.equal(typeof body.error, "string");
    assert.ok(body.error.trim().length > 0);
  }
}

/** Hold an admitted body after Continue; a missing acknowledgment fails within the client deadline. */
async function holdUpload(port: number, length = 1_048_576) {
  const outgoing = request({
    hostname: "127.0.0.1",
    port,
    method: "POST",
    path: "/file-upload",
    headers: { "Content-Type": "audio/mpeg", "Content-Length": String(length), Expect: "100-continue" },
    agent: false,
    timeout: 5_000,
  });
  outgoing.once("timeout", () => outgoing.destroy(new Error("Held upload timed out before completion")));
  const reply = collectReply(outgoing);
  // Expected abort cases await this rejection later; attach a handler immediately to avoid an unhandled rejection.
  void reply.catch(() => {});
  const continued = once(outgoing, "continue");
  outgoing.flushHeaders();
  await Promise.race([
    continued,
    reply.then(() => {
      throw new Error("Held upload received a final response instead of admission");
    }),
  ]);
  return { outgoing, reply };
}

test("service-local health, routes, methods, Allow and HEAD match the HTTP contract", async (context) => {
  const { port } = await start(context);
  expectJson(await send(port, { method: "GET", path: "/healthz?probe=1", headers: {} }), 200, { status: "ok" });
  expectJson(await send(port, { path: "/unknown", headers: {} }), 404);
  expectJson(await send(port, { method: "GET", path: "/", headers: {} }), 404);
  for (const [path, method, allow] of [
    ["/file-upload", "GET", "POST"],
    ["/file-upload", "HEAD", "POST"],
    ["/healthz", "POST", "GET"],
    ["/healthz", "HEAD", "GET"],
  ]) {
    const reply = await send(port, { path, method, headers: {} });
    assert.equal(reply.headers.allow, allow);
    if (method === "HEAD") {
      assert.equal(reply.status, 405);
      assert.match(reply.headers["content-type"] ?? "", /^application\/json/);
      assert.equal(reply.body.length, 0);
    } else expectJson(reply, 405);
  }
});

test("accepted MIME parameters, casing, identity encoding and query pathname preserve an exact count", async (context) => {
  const { port } = await start(context);
  for (const type of ["Audio/MPEG; charset=binary", "application/octet-stream"]) {
    expectJson(
      await send(port, {
        path: "/file-upload?source=browser",
        headers: { "Content-Type": type, "Content-Encoding": "Identity" },
        body: fixtureBytes("three-frames"),
      }),
      200,
      { frameCount: 3 },
    );
  }
});

test("unsupported media and encoding fail before parser errors with usable JSON", async (context) => {
  const { port } = await start(context);
  for (const headers of [
    {},
    { "Content-Type": "text/plain" },
    { "Content-Type": "audio/mpeg", "Content-Encoding": "gzip" },
    { "Content-Type": "audio/mpeg", "Content-Encoding": "identity, gzip" },
  ]) {
    expectJson(await send(port, { headers, body: fixtureBytes("one-frame") }), 415);
  }
});

test("policy headers after more than 64 short fields remain visible to MIME and encoding checks", async (context) => {
  const { port } = await start(context);
  const extraHeaders = Object.fromEntries(Array.from({ length: 70 }, (_, index) => [`X-Test-${index}`, "1"]));
  const body = fixtureBytes("one-frame");
  expectJson(
    await send(port, {
      headers: { "Content-Type": "audio/mpeg", ...extraHeaders, "Content-Encoding": "gzip" },
      body,
    }),
    415,
  );
  expectJson(await send(port, { headers: { ...extraHeaders, "Content-Type": "audio/mpeg" }, body }), 200, {
    frameCount: 1,
  });
});

test("empty, malformed and unsupported parser inputs map to the required error kinds", async (context) => {
  const { port } = await start(context);
  for (const [id, status] of [
    ["empty", 400],
    ["truncated-frame", 400],
    ["mpeg2", 415],
  ] as const) {
    expectJson(await send(port, { body: fixtureBytes(id) }), status);
  }
});

test("inclusive exact-size upload succeeds with the independent expected count", async (context) => {
  const { port } = await start(context);
  expectJson(
    await send(port, {
      headers: { "Content-Type": "audio/mpeg", "Content-Length": String(MAX_UPLOAD_BYTES) },
      body: fixtureBytes("exact-limit"),
    }),
    200,
    { frameCount: 54_613 },
  );
});

test("declared oversize rejects before body and remains readable while a full body is being sent", async (context) => {
  const { port } = await start(context);
  const headers = { "Content-Type": "audio/mpeg", "Content-Length": String(MAX_UPLOAD_BYTES + 1) };
  expectJson(await send(port, { headers }), 413);
  expectJson(await send(port, { headers, body: fixtureBytes("over-limit") }), 413);
  expectJson(await send(port, { body: fixtureBytes("one-frame") }), 200, { frameCount: 1 });
});

test("chunked bodies without Content-Length enforce actual-byte limits and recover", async (context) => {
  const { port } = await start(context);
  const headers = { "Content-Type": "audio/mpeg", "Transfer-Encoding": "chunked" };
  expectJson(await send(port, { headers, body: fixtureBytes("exact-limit") }), 200, { frameCount: 54_613 });
  expectJson(await send(port, { headers, body: fixtureBytes("over-limit") }), 413);
  expectJson(await send(port, { headers, body: fixtureBytes("three-frames") }), 200, { frameCount: 3 });
});

test("a valid prefix never yields partial success; abort releases admission for the next upload", async (context) => {
  const { port, server } = await start(context, { maxActiveUploads: 1 });
  const abortObserved = new Promise<void>((resolve) =>
    server.once("checkContinue", (incoming) => incoming.once("aborted", resolve)),
  );
  const { outgoing, reply } = await holdUpload(port);
  let responded = false;
  outgoing.on("response", () => {
    responded = true;
  });
  outgoing.write(fixtureBytes("three-frames"));
  // Deliberate incomplete-request observation, not a wait used to manufacture a successful service response.
  await delay(60);
  assert.equal(responded, false);
  outgoing.destroy();
  await assert.rejects(reply);
  await abortObserved;
  expectJson(await send(port, { body: fixtureBytes("one-frame") }), 200, { frameCount: 1 });
});

test("admission allows two active bodies and returns 503 for a third", async (context) => {
  const { port } = await start(context);
  const first = await holdUpload(port);
  const second = await holdUpload(port);
  context.after(() => {
    first.outgoing.destroy();
    second.outgoing.destroy();
  });
  const reply = await send(port, { body: fixtureBytes("one-frame") });
  expectJson(reply, 503);
  assert.equal(reply.headers["retry-after"], "1");
  first.outgoing.destroy();
  second.outgoing.destroy();
});

test("body inactivity returns JSON408 and releases admission", async (context) => {
  const { port } = await start(context, { maxActiveUploads: 1, inactivityTimeoutMs: 80, bodyTimeoutMs: 1_000 });
  const { outgoing, reply } = await holdUpload(port);
  outgoing.write(fixtureBytes("one-frame"));
  expectJson(await reply, 408);
  expectJson(await send(port, { body: fixtureBytes("one-frame") }), 200, { frameCount: 1 });
});

test("the complete-body deadline is absolute even while bytes continue arriving", async (context) => {
  const { port } = await start(context, { bodyTimeoutMs: 120, inactivityTimeoutMs: 1_000 });
  const { outgoing, reply } = await holdUpload(port);
  const drip = setInterval(() => outgoing.write(Buffer.from([0])), 20);
  try {
    expectJson(await reply, 408);
  } finally {
    clearInterval(drip);
    outgoing.destroy();
  }
});

test("shutdown drains an admitted complete upload and is idempotent", async (context) => {
  const { port, shutdown } = await start(context);
  const body = fixtureBytes("one-frame");
  const { outgoing, reply } = await holdUpload(port, body.length);
  outgoing.write(body.subarray(0, 4));
  const closing = shutdown();
  assert.equal(shutdown(), closing);
  outgoing.end(body.subarray(4));
  expectJson(await reply, 200, { frameCount: 1 });
  await closing;
});

test("shutdown force-closes an incomplete upload within its bounded deadline", async (context) => {
  const { port, shutdown } = await start(context, { shutdownTimeoutMs: 80 });
  const { outgoing, reply } = await holdUpload(port);
  outgoing.write(fixtureBytes("one-frame"));
  const started = performance.now();
  await shutdown();
  await assert.rejects(reply);
  assert.ok(performance.now() - started < 1_000);
});

test("the connection cap rejects an additional socket while admitted sockets remain usable", async (context) => {
  const { port, server } = await start(context, { maxConnections: 2 });
  const accepted = new Promise<void>((resolve) => {
    let count = 0;
    server.on("connection", () => {
      count += 1;
      if (count === 2) resolve();
    });
  });
  const first = connect(port, "127.0.0.1");
  const second = connect(port, "127.0.0.1");
  context.after(() => {
    first.destroy();
    second.destroy();
  });
  await Promise.all([once(first, "connect"), once(second, "connect")]);
  await accepted;
  assert.equal(
    await new Promise((resolve, reject) =>
      server.getConnections((error, count) => (error ? reject(error) : resolve(count))),
    ),
    2,
  );
  const third = connect(port, "127.0.0.1");
  context.after(() => third.destroy());
  await once(third, "close");
  assert.equal(first.destroyed, false);
  assert.equal(second.destroyed, false);
});

test("incomplete headers are closed by the bounded native header deadline", async (context) => {
  const { port } = await start(context, { headersTimeoutMs: 60, inactivityTimeoutMs: 1_000 });
  const socket = connect(port, "127.0.0.1");
  context.after(() => socket.destroy());
  const chunks: Buffer[] = [];
  socket.on("data", (chunk) => chunks.push(chunk));
  await once(socket, "connect");
  socket.write("POST /file-upload HTTP/1.1\r\nHost: localhost\r\n");
  await once(socket, "close");
  assert.match(Buffer.concat(chunks).toString("ascii"), /^HTTP\/1\.1 408/);
});

test("100-continue is sent only after admission and header validation", async (context) => {
  const { port } = await start(context);
  const outgoing = request({
    hostname: "127.0.0.1",
    port,
    method: "POST",
    path: "/file-upload",
    agent: false,
    headers: { Expect: "100-continue", "Content-Type": "audio/mpeg", "Content-Length": String(MAX_UPLOAD_BYTES + 1) },
  });
  let continued = false;
  outgoing.on("continue", () => {
    continued = true;
  });
  const reply = collectReply(outgoing);
  outgoing.flushHeaders();
  expectJson(await reply, 413);
  assert.equal(continued, false);
});

test("runtime configuration and factory budgets fail closed on invalid values", () => {
  assert.equal(parsePort(undefined), 3_000);
  assert.equal(parsePort("8080"), 8_080);
  for (const value of ["", "0", "-1", "65536", "3000junk", " 3000", "3e3"]) assert.throws(() => parsePort(value));
  for (const value of [0, -1, NaN, 1.5]) assert.throws(() => createApiServer({ maxActiveUploads: value }));
  assert.throws(() => createApiServer({ maxConnections: 1 }));
  assert.equal(DEFAULT_API_BUDGETS.maxActiveUploads, 2);
  assert.equal(DEFAULT_API_BUDGETS.maxConnections, 64);
});

test("the real process entrypoint rejects an invalid PORT without reflecting its value", async () => {
  const child = spawn(process.execPath, ["server/src/index.ts"], {
    env: { ...process.env, PORT: "PRIVATE INVALID VALUE" },
  });
  let stderr = "";
  child.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });
  const [code] = await once(child, "exit");
  assert.equal(code, 1);
  assert.match(stderr, /configuration is invalid/);
  assert.ok(!stderr.includes("PRIVATE INVALID VALUE"));
});

/** Request admission without transmitting a body; any Continue or incomplete response fails the observation. */
async function refuseBeforeBody(
  port: number,
  options: { method?: string; path?: string; headers?: Record<string, string> } = {},
): Promise<Reply> {
  const outgoing = request({
    hostname: "127.0.0.1",
    port,
    method: options.method ?? "POST",
    path: options.path ?? "/file-upload",
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": "1024",
      Expect: "100-continue",
      ...options.headers,
    },
    agent: false,
    timeout: 2_000,
  });
  let continued = false;
  outgoing.on("continue", () => {
    continued = true;
  });
  outgoing.once("timeout", () => outgoing.destroy(new Error("Early refusal did not finish")));
  try {
    const reply = collectReply(outgoing);
    outgoing.flushHeaders();
    const result = await reply;
    assert.equal(continued, false, "The server must refuse before acknowledging or receiving body bytes");
    return result;
  } finally {
    outgoing.destroy();
  }
}

test("readiness rejects an occupied port without opening another listener", { timeout: 5_000 }, async (context) => {
  const occupied = await start(context);
  const service = createApiServer();
  context.after(() => {
    service.server.closeAllConnections();
    return service.shutdown();
  });
  assert.equal(typeof service.listen, "function", "ApiService.listen readiness boundary must exist");
  await assert.rejects(service.listen(occupied.port, "127.0.0.1"), { code: "EADDRINUSE" });
  assert.equal(service.server.listening, false);
  assert.equal(service.server.address(), null);
  expectJson(await send(occupied.port, { body: fixtureBytes("one-frame") }), 200, { frameCount: 1 });
});

test("shutdown before readiness prevents a later listener", { timeout: 5_000 }, async (context) => {
  const service = createApiServer();
  context.after(() => {
    service.server.closeAllConnections();
    return service.shutdown();
  });
  assert.equal(typeof service.listen, "function", "ApiService.listen readiness boundary must exist");
  const closing = service.shutdown();
  assert.equal(service.shutdown(), closing);
  await closing;
  await assert.rejects(service.listen(0, "127.0.0.1"), Error);
  assert.equal(service.server.listening, false);
  assert.equal(service.server.address(), null);
});

test(
  "shutdown racing readiness settles both operations with no surviving listener",
  { timeout: 5_000 },
  async (context) => {
    const service = createApiServer();
    context.after(() => {
      service.server.closeAllConnections();
      return service.shutdown();
    });
    assert.equal(typeof service.listen, "function", "ApiService.listen readiness boundary must exist");
    const starting = service.listen(0, "127.0.0.1");
    const closing = service.shutdown();
    const [startup, shutdown] = await Promise.allSettled([starting, closing]);
    assert.equal(shutdown.status, "fulfilled");
    if (startup.status === "rejected") assert.ok(startup.reason instanceof Error);
    assert.equal(service.server.listening, false);
    assert.equal(service.server.address(), null);
    assert.equal(service.shutdown(), closing);
  },
);

test("raw refusal preserves precedence before Continue or body transmission", { timeout: 10_000 }, async (context) => {
  const { port } = await start(context);
  for (const [options, status] of [
    [{ path: "/%66ile-upload", headers: { "Content-Type": "text/plain" } }, 404],
    [{ method: "PUT", headers: { "Content-Type": "text/plain" } }, 405],
    [{ headers: { "Content-Type": "text/plain" } }, 415],
    [{ headers: { "Content-Encoding": "gzip" } }, 415],
    [{ headers: { Expect: "unsupported-expectation" } }, 417],
  ] as const) {
    const reply = await refuseBeforeBody(port, options);
    expectJson(reply, status);
    if (status === 405) assert.equal(reply.headers.allow, "POST");
  }
});

test(
  "busy admission refuses Expect before body and preserves both held uploads",
  { timeout: 5_000 },
  async (context) => {
    const { port } = await start(context);
    const body = fixtureBytes("one-frame");
    const first = await holdUpload(port, body.length);
    const held = [first];
    try {
      const second = await holdUpload(port, body.length);
      held.push(second);
      const reply = await refuseBeforeBody(port);
      expectJson(reply, 503);
      assert.equal(reply.headers["retry-after"], "1");
      first.outgoing.end(body);
      second.outgoing.end(body);
      expectJson(await first.reply, 200, { frameCount: 1 });
      expectJson(await second.reply, 200, { frameCount: 1 });
    } finally {
      for (const upload of held) upload.outgoing.destroy();
    }
  },
);

test(
  "success, parser failure and abort release exactly one slot beside an active anchor",
  { timeout: 5_000 },
  async (context) => {
    const { port, server } = await start(context);
    const body = fixtureBytes("one-frame");
    const anchor = await holdUpload(port, body.length);
    const held: Awaited<ReturnType<typeof holdUpload>>[] = [anchor];
    try {
      expectJson(await send(port, { body }), 200, { frameCount: 1 });
      expectJson(await send(port, { body: fixtureBytes("truncated-frame") }), 400);
      const received = once(server, "checkContinue", { signal: AbortSignal.timeout(1_000) });
      void received.catch(() => {});
      const canceled = await holdUpload(port);
      held.push(canceled);
      const [incoming] = await received;
      const aborted = once(incoming, "aborted", { signal: AbortSignal.timeout(1_000) });
      canceled.outgoing.destroy();
      await Promise.all([assert.rejects(canceled.reply), aborted]);
      const replacement = await holdUpload(port, body.length);
      held.push(replacement);
      expectJson(await refuseBeforeBody(port), 503);
      anchor.outgoing.end(body);
      replacement.outgoing.end(body);
      expectJson(await anchor.reply, 200, { frameCount: 1 });
      expectJson(await replacement.reply, 200, { frameCount: 1 });
    } finally {
      for (const upload of held) upload.outgoing.destroy();
    }
  },
);

test(
  "timeout followed by connection close neither leaks nor over-releases admission",
  { timeout: 5_000 },
  async (context) => {
    const { port } = await start(context, { inactivityTimeoutMs: 250, bodyTimeoutMs: 2_000 });
    const expired = await holdUpload(port);
    const held: Awaited<ReturnType<typeof holdUpload>>[] = [expired];
    try {
      expired.outgoing.write(fixtureBytes("one-frame"));
      expectJson(await expired.reply, 408);
      if (!expired.outgoing.closed) {
        const closed = once(expired.outgoing, "close", { signal: AbortSignal.timeout(1_000) });
        expired.outgoing.destroy();
        await closed;
      }
      const body = fixtureBytes("one-frame");
      const first = await holdUpload(port, body.length);
      held.push(first);
      const second = await holdUpload(port, body.length);
      held.push(second);
      expectJson(await refuseBeforeBody(port), 503);
      first.outgoing.end(body);
      second.outgoing.end(body);
      expectJson(await first.reply, 200, { frameCount: 1 });
      expectJson(await second.reply, 200, { frameCount: 1 });
    } finally {
      for (const upload of held) upload.outgoing.destroy();
    }
  },
);
