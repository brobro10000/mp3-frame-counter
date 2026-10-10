/**
 * Finite real loopback HTTP controls for the same hosted adapter used by specs. Servers belong to this invocation;
 * tokens are fixed synthetic text, never provider credentials. Counterpart receivers establish real reachability before
 * refusal checks. Every listener/socket is closed, and only fixed sanitized rows leave the control boundary.
 */
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo, Socket } from "node:net";
import { CONTROL_TOKEN, createOwnedControlTarget } from "./hosted-control-target.ts";
import { createHostedHttp } from "./hosted-http.ts";
import { assertFrameResponse } from "./assertions.ts";
import type { ControlRow, FailureCode } from "./hosted-types.ts";
/** Own listeners, bounded bodies and all sockets; fixtures never contact a target outside numeric loopback. */
export async function runHostedHttpControls(): Promise<ControlRow[]> {
  const rows: ControlRow[] = [];
  let foreignReceipts = 0,
    mainReceipts = 0,
    authReceipts = 0;
  let notifyHeld: (() => void) | undefined;
  const sockets = new Set<Socket>();
  const foreign = http.createServer((req, res) => {
    foreignReceipts += 1;
    req.resume();
    res.end("owned");
  });
  const main = http.createServer((req, res) => {
    mainReceipts += 1;
    if (req.headers["x-serverless-authorization"] === `Bearer ${CONTROL_TOKEN}`) authReceipts += 1;
    if (req.url === "/redirect") {
      res.writeHead(302, { Location: foreignOrigin });
      res.end();
      return;
    }
    if (req.url === "/docs") {
      res.writeHead(308, { Location: "/docs/" });
      res.end();
      return;
    }
    if (req.url === "/duplicate") {
      res.writeHead(203, [
        "Content-Security-Policy",
        "default-src 'none'",
        "Content-Security-Policy",
        "script-src 'self'",
        "X-Content-Type-Options",
        "nosniff",
        "X-Content-Type-Options",
        "nosniff",
      ]);
      res.end("exact-owned-bytes");
      return;
    }
    if (req.url === "/oversize") {
      res.end(Buffer.alloc(65537, 65));
      return;
    }
    if (req.url === "/docs-oversize") {
      res.end(Buffer.alloc(2 * 1024 * 1024 + 1, 65));
      return;
    }
    if (req.url === "/held") {
      notifyHeld?.();
      return;
    }
    if (req.url === "/file-upload" && req.headers["content-length"] === "1048576") {
      if (partialSuccess) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end('{"frameCount":1}');
      }
      return;
    }
    let size = 0;
    req.on("data", (part: Buffer) => {
      size += part.length;
      if (size > 20971521) req.destroy();
    });
    req.on("end", () => {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ frameCount: size === 9 ? 9 : 3 }));
    });
  });
  let foreignOrigin = "",
    origin = "",
    partialSuccess = false;
  /** Bind an ephemeral numeric-loopback listener owned solely by this control invocation. */
  const listen = (server: http.Server) =>
    new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => resolve());
    });
  /** Retain each actual socket until its close event so listener closure alone cannot imply completed cleanup. */
  const attach = (server: http.Server) =>
    server.on("connection", (socket) => {
      sockets.add(socket);
      socket.once("close", () => sockets.delete(socket));
    });
  attach(main);
  attach(foreign);
  /** Retain a sanitized assertion outcome without native errors, request headers or credential bytes. */
  const check = async (id: string, fn: () => Promise<void>) => {
    try {
      await fn();
      rows.push({ id, status: "passed", cleanup: "passed", codes: [] });
    } catch {
      rows.push({ id, status: "failed", cleanup: "failed", codes: ["ASSERTION"] });
    }
  };
  /** Require actual adapter cleanup and exactly the expected terminal latches, including successful refusals. */
  const finish = async (adapter: ReturnType<typeof createHostedHttp>, expected: FailureCode[] = []): Promise<void> => {
    const result = await adapter.close();
    assert.equal(result.cleanup, "passed");
    assert.deepEqual([...result.failures].sort(), [...expected].sort());
  };
  try {
    await listen(foreign);
    foreignOrigin = `http://127.0.0.1:${(foreign.address() as AddressInfo).port}`;
    await listen(main);
    origin = `http://127.0.0.1:${(main.address() as AddressInfo).port}`;
    await check("http-real-authenticated-declared-and-chunked", async () => {
      const adapter = createHostedHttp(createOwnedControlTarget(origin));
      try {
        for (const chunked of [false, true]) {
          const before = authReceipts;
          const value = await adapter.request("/file-upload", {
            method: "POST",
            headers: { "Content-Type": "audio/mpeg" },
            body: Buffer.alloc(9),
            chunked,
          });
          assertFrameResponse(value, 9);
          assert.equal(value.sentBytes, 9);
          assert.equal(value.contentLengthSent, !chunked);
          assert.equal(value.transferEncoding, chunked ? "chunked" : undefined);
          assert.equal(authReceipts, before + 1);
        }
      } finally {
        await finish(adapter);
      }
    });
    await check("http-preserves-duplicate-security-headers-and-body", async () => {
      const adapter = createHostedHttp(createOwnedControlTarget(origin));
      try {
        const result = await adapter.docs("/duplicate");
        assert.equal(result.status, 203);
        assert.equal(result.body.toString(), "exact-owned-bytes");
        assert.deepEqual(
          result.headers.filter((row) => row.name.toLowerCase() === "content-security-policy").map((row) => row.value),
          ["default-src 'none'", "script-src 'self'"],
        );
        assert.equal(result.headers.filter((row) => row.name.toLowerCase() === "x-content-type-options").length, 2);
      } finally {
        await finish(adapter);
      }
    });
    await check("http-canonical-redirect-observed-without-following", async () => {
      const adapter = createHostedHttp(createOwnedControlTarget(origin));
      try {
        const before = mainReceipts;
        const result = await adapter.docs("/docs");
        assert.equal(result.status, 308);
        assert.equal(mainReceipts, before + 1);
      } finally {
        await finish(adapter);
      }
    });
    await check("http-foreign-redirect-receiver-stays-unreached", async () => {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(foreignOrigin, (res) => {
          res.resume();
          res.once("end", resolve);
        });
        req.once("error", reject);
      });
      const before = foreignReceipts;
      assert.equal(before, 1);
      const adapter = createHostedHttp(createOwnedControlTarget(origin));
      try {
        await assert.rejects(adapter.docs("/redirect"), { message: "REDIRECT" });
        assert.equal(foreignReceipts, before);
      } finally {
        await finish(adapter, ["REDIRECT"]);
      }
    });
    await check("http-forbidden-paths-and-header-overrides-send-nothing", async () => {
      for (const path of [
        foreignOrigin,
        `//127.0.0.1:${(foreign.address() as AddressInfo).port}/`,
        "/\\foreign",
        "/bad\n",
      ]) {
        const adapter = createHostedHttp(createOwnedControlTarget(origin)),
          before = mainReceipts;
        try {
          await assert.rejects(adapter.request(path));
          assert.equal(mainReceipts, before);
        } finally {
          await finish(adapter, ["HTTP"]);
        }
      }
      for (const header of [
        "Authorization",
        "X-Serverless-Authorization",
        "Host",
        "Content-Length",
        "Transfer-Encoding",
        "Cookie",
      ]) {
        const adapter = createHostedHttp(createOwnedControlTarget(origin)),
          before = mainReceipts;
        try {
          await assert.rejects(
            adapter.request("/file-upload", {
              method: "POST",
              headers: { [header]: "owned-override" },
              body: Buffer.alloc(9),
            }),
            { message: "HTTP" },
          );
          assert.equal(mainReceipts, before);
        } finally {
          await finish(adapter, ["HTTP"]);
        }
      }
    });
    for (const [path, docs] of [
      ["/oversize", false],
      ["/docs-oversize", true],
    ] as const)
      await check(`http-${docs ? "docs" : "json"}-actual-response-bound`, async () => {
        const adapter = createHostedHttp(createOwnedControlTarget(origin));
        try {
          await assert.rejects(docs ? adapter.docs(path) : adapter.request(path), { message: "RESPONSE_BOUND" });
        } finally {
          await finish(adapter, ["RESPONSE_BOUND"]);
        }
      });
    await check("http-abort-observes-incomplete-body-and-recovery", async () => {
      const adapter = createHostedHttp(createOwnedControlTarget(origin));
      try {
        partialSuccess = false;
        await adapter.abortUpload(Buffer.alloc(384));
        assertFrameResponse(await adapter.request("/file-upload", { method: "POST", body: Buffer.alloc(9) }), 9);
      } finally {
        await finish(adapter);
      }
    });
    await check("http-partial-success-is-rejected-before-abort", async () => {
      const adapter = createHostedHttp(createOwnedControlTarget(origin));
      try {
        partialSuccess = true;
        await assert.rejects(adapter.abortUpload(Buffer.alloc(384)), { message: "ASSERTION" });
      } finally {
        partialSuccess = false;
        await finish(adapter, ["ASSERTION"]);
      }
    });
    await check("http-completed-close-refuses-reuse-with-live-latch", async () => {
      const adapter = createHostedHttp(createOwnedControlTarget(origin));
      assertFrameResponse(await adapter.request("/file-upload", { method: "POST", body: Buffer.alloc(9) }), 9);
      assert.deepEqual(await adapter.close(), { cleanup: "passed", failures: [] });
      await assert.rejects(adapter.request("/file-upload"), { message: "HTTP" });
      assert.deepEqual(await adapter.close(), { cleanup: "passed", failures: ["HTTP"] });
    });
    await check("http-close-drains-owned-inflight-and-refuses-reuse", async () => {
      const adapter = createHostedHttp(createOwnedControlTarget(origin));
      const received = new Promise<void>((resolve) => {
        notifyHeld = resolve;
      });
      const pending = adapter.request("/held").then(
        () => false,
        () => true,
      );
      await received;
      const final = await adapter.close();
      assert.equal(await pending, true);
      assert.equal(final.cleanup, "failed");
      assert.ok(final.failures.includes("CLEANUP"));
      await assert.rejects(adapter.request("/file-upload"));
      const afterReuse = await adapter.close();
      assert.equal(afterReuse.cleanup, "failed");
      assert.ok(afterReuse.failures.includes("HTTP"));
      notifyHeld = undefined;
    });
  } finally {
    const owned = [...sockets];
    const drained = Promise.all(owned.map((socket) => new Promise<void>((resolve) => socket.once("close", resolve))));
    for (const socket of owned) socket.destroy();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const cleanup = await Promise.race([
      Promise.all([
        drained,
        ...[main, foreign].map((server) => new Promise<void>((resolve) => server.close(() => resolve()))),
      ]).then(() => true),
      new Promise<false>((resolve) => {
        timeout = setTimeout(() => resolve(false), 5000);
      }),
    ]);
    clearTimeout(timeout);
    const complete = cleanup && sockets.size === 0;
    rows.push({
      id: "http-owned-listener-cleanup",
      status: complete ? "passed" : "failed",
      cleanup: complete ? "passed" : "failed",
      codes: complete ? [] : ["CLEANUP"],
    });
  }
  return rows;
}
