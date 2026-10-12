/**
 * Verify the application factory through Fastify injection and isolated source imports, without binding a port.
 * Frozen fixture bytes are read-only; real framing/Expect/drain/deadline guarantees remain in http.test.ts.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import { describe, test } from "node:test";
import type { TestContext } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createApp } from "../src/app.ts";
import type { AppOptions } from "../src/app.ts";
import { Type } from "typebox";
import { projectPublicError } from "../src/contracts/errors.ts";
import { analyzeMp3 } from "../src/modules/mp3/analyze.ts";
import { fixtureBytes } from "../../tests/acceptance/lib/fixtures.ts";

const repository = fileURLToPath(new URL("../../", import.meta.url));

/** Construct and register unconditional cleanup; assertions may use ready/inject but never listen. */
function application(context: TestContext, options: AppOptions = {}) {
  const app = createApp(options);
  context.after(() => app.close());
  return app;
}

/** Send one fixture as raw bytes through the real scoped admission/parser/route/serializer chain. */
function upload(app: ReturnType<typeof createApp>, url = "/file-upload", fixture = "three-frames") {
  return app.inject({ method: "POST", url, headers: { "content-type": "audio/mpeg" }, payload: fixtureBytes(fixture) });
}

describe("unbound API application", () => {
  test("construction/ready generate both real operations without a listener or process hooks", async (context) => {
    const signals = [process.listenerCount("SIGINT"), process.listenerCount("SIGTERM")];
    const timeoutCount = process.getActiveResourcesInfo().filter((name) => name === "Timeout").length;
    const app = application(context);
    assert.equal(app.server.listening, false);
    assert.equal(app.server.address(), null);
    assert.deepEqual([process.listenerCount("SIGINT"), process.listenerCount("SIGTERM")], signals);
    assert.equal(process.getActiveResourcesInfo().filter((name) => name === "Timeout").length, timeoutCount);
    await app.ready();
    const specification = app.swagger();
    assert("openapi" in specification);
    assert.equal(specification.openapi, "3.0.3");
    assert.equal(specification.paths?.["/file-upload"]?.post?.operationId, "countFrames");
    assert.equal(specification.paths?.["/healthz"]?.get?.operationId, "serviceHealth");
    assert.equal(app.server.listening, false);
    assert.equal(app.server.address(), null);
  });

  test("normal source construction/ready/injection works without any packaged docs assets", async (context) => {
    const directory = await mkdtemp(join(tmpdir(), "mp3-unbound-app-"));
    context.after(() => rm(directory, { recursive: true, force: true }));
    await cp(join(repository, "server/src"), join(directory, "server/src"), { recursive: true });
    await symlink(join(repository, "node_modules"), join(directory, "node_modules"), "dir");
    await writeFile(join(directory, "package.json"), '{"type":"module"}\n');
    const moduleUrl = pathToFileURL(join(directory, "server/src/app.ts")).href;
    const code = [
      'import assert from "node:assert/strict";',
      "import { createApp } from " + JSON.stringify(moduleUrl) + ";",
      "const app = createApp();",
      "try {",
      "  await app.ready();",
      "  const response = await app.inject({ method: 'GET', url: '/healthz' });",
      "  assert.equal(response.statusCode, 200);",
      "  assert.deepEqual(response.json(), { status: 'ok' });",
      "  assert.equal(app.server.listening, false);",
      "  assert.equal(app.server.address(), null);",
      "} finally { await app.close(); }",
    ].join("\n");
    const result = spawnSync(process.execPath, ["--input-type=module", "--eval", code], {
      cwd: tmpdir(),
      encoding: "utf8",
      timeout: 10_000,
      maxBuffer: 32_768,
    });
    assert.equal(result.error, undefined);
    assert.equal(result.signal, null);
    assert.equal(result.status, 0, result.stderr);
  });

  test("the default serializer returns exactly the walked count; raw MIME parameters remain accepted", async (context) => {
    const app = application(context);
    const response = await app.inject({
      method: "POST",
      url: "/file-upload?unrelated=true",
      headers: { "content-type": "Audio/MPEG; charset=binary", "content-encoding": "Identity" },
      payload: fixtureBytes("three-frames"),
    });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { frameCount: 3 });
    assert.equal(response.headers["cache-control"], "no-store");
    assert.equal(response.headers["x-content-type-options"], "nosniff");
  });

  test("controlled route, method, media, encoding and parser failures retain their exact safe identities", async (context) => {
    const app = application(context);
    for (const [fixture, code] of [
      ["empty", "UPLOAD_EMPTY"],
      ["garbage", "MP3_INVALID_HEADER"],
      ["truncated-frame", "MP3_TRUNCATED_FRAME"],
      ["tag-nonsynchsafe", "MP3_INVALID_METADATA"],
      ["metadata-only", "MP3_NO_AUDIO_FRAMES"],
      ["mpeg2", "MP3_UNSUPPORTED_FORMAT"],
      ["id3v22", "MP3_UNSUPPORTED_METADATA"],
    ] as const) {
      const response = await upload(app, "/file-upload", fixture);
      assert.equal(response.statusCode, code.startsWith("MP3_UNSUPPORTED") ? 415 : 400);
      assert.deepEqual(response.json(), projectPublicError(code));
    }
    for (const [headers, code] of [
      [{ "content-type": "application/json" }, "UNSUPPORTED_MEDIA_TYPE"],
      [{ "content-type": "audio/mpeg", "content-encoding": "gzip" }, "UNSUPPORTED_CONTENT_ENCODING"],
    ] as const) {
      const response = await app.inject({ method: "POST", url: "/file-upload", headers, payload: "PRIVATE" });
      assert.equal(response.statusCode, 415);
      assert.deepEqual(response.json(), projectPublicError(code));
    }
    const unknown = await app.inject({ method: "POST", url: "/%66ile-upload", payload: "PRIVATE" });
    assert.equal(unknown.statusCode, 404);
    assert.deepEqual(unknown.json(), projectPublicError("ROUTE_NOT_FOUND"));
    const method = await app.inject({ method: "PUT", url: "/file-upload", payload: "PRIVATE" });
    assert.equal(method.statusCode, 405);
    assert.equal(method.headers.allow, "POST");
    assert.deepEqual(method.json(), projectPublicError("METHOD_NOT_ALLOWED"));
    const head = await app.inject({ method: "HEAD", url: "/file-upload" });
    assert.equal(head.statusCode, 405);
    assert.equal(head.headers.allow, "POST");
    assert.equal(head.body, "");
  });

  test("detailed closed-union serialization retains all carrier fields and bounded warnings", async (context) => {
    const app = application(context);
    const response = await upload(app, "/file-upload?details=true", "xing-physical");
    assert.equal(response.statusCode, 200, response.body);
    assert.deepEqual(response.json(), {
      frameCount: 1,
      analysis: {
        physicalFrameCount: 2,
        excludedMetadataFrameCount: 1,
        xing: {
          status: "present",
          marker: "Xing",
          frameOffsetBytes: 0,
          frameLengthBytes: 384,
          markerOffsetBytes: 36,
          flags: 1,
          declaredAudioFrameCount: 999,
        },
        warnings: [{ code: "XING_DECLARED_FRAME_COUNT_MISMATCH" }],
      },
    });
  });

  test("detailed serialization preserves zero quality and every selected optional field", async (context) => {
    const app = application(context);
    const carrier = fixtureBytes("one-frame");
    Buffer.from("Xing").copy(carrier, 36);
    carrier.writeUInt32BE(15, 40);
    carrier.writeUInt32BE(1, 44);
    carrier.writeUInt32BE(768, 48);
    carrier.fill(0, 52, 152);
    carrier.writeUInt32BE(0, 152);
    const response = await app.inject({
      method: "POST",
      url: "/file-upload?details=true",
      headers: { "content-type": "application/octet-stream" },
      payload: Buffer.concat([carrier, fixtureBytes("one-frame")]),
    });
    assert.equal(response.statusCode, 200, response.body);
    assert.deepEqual(response.json(), {
      frameCount: 1,
      analysis: {
        physicalFrameCount: 2,
        excludedMetadataFrameCount: 1,
        xing: {
          status: "present",
          marker: "Xing",
          frameOffsetBytes: 0,
          frameLengthBytes: 384,
          markerOffsetBytes: 36,
          flags: 15,
          declaredAudioFrameCount: 1,
          declaredMpegStreamByteCount: 768,
          seekTableEntryCount: 100,
          qualityValue: 0,
        },
        warnings: [],
      },
    });
  });

  test("details opts in only for one exact decoded true value, with unknown query options ignored", async (context) => {
    const app = application(context);
    for (const [query, detailed] of [
      ["", false],
      ["?details=true", true],
      ["?%64etails=tr%75e&unrelated=1", true],
      ["?details=True", false],
      ["?details=1", false],
      ["?details=", false],
      ["?details=false", false],
      ["?details=true&details=true", false],
      ["?details=true&%64etails=true", false],
    ] as const) {
      const response = await upload(app, "/file-upload" + query);
      assert.equal(response.statusCode, 200, response.body);
      assert.deepEqual(
        response.json(),
        detailed
          ? {
              frameCount: 3,
              analysis: {
                physicalFrameCount: 3,
                excludedMetadataFrameCount: 0,
                xing: { status: "absent" },
                warnings: [],
              },
            }
          : { frameCount: 3 },
      );
    }
  });

  test("analysis runs once and explicit projection prevents private fields from entering either representation", async (context) => {
    let calls = 0;
    const app = application(context, {
      analyze(bytes) {
        calls += 1;
        assert.deepEqual(bytes, fixtureBytes("three-frames"));
        return Object.assign(analyzeMp3(bytes), { privateContext: "PRIVATE" });
      },
    });
    for (const url of ["/file-upload", "/file-upload?details=true"]) {
      const response = await upload(app, url);
      assert.equal(response.statusCode, 200);
      assert.ok(!response.body.includes("PRIVATE"));
      assert.ok(!response.body.includes("privateContext"));
    }
    assert.equal(calls, 2);
  });

  test("invalid analyzer counts/invariants fail safely for default and detail before serialization", async (context) => {
    const invalid = [
      ["audioFrameCount", undefined],
      ["audioFrameCount", NaN],
      ["audioFrameCount", Infinity],
      ["audioFrameCount", -1],
      ["audioFrameCount", 1.5],
      ["audioFrameCount", Number.MAX_SAFE_INTEGER + 1],
      ["physicalFrameCount", 2],
      ["physicalFrameCount", NaN],
      ["excludedMetadataFrameCount", 1],
    ] as const;
    for (const [field, value] of invalid) {
      const app = application(context, {
        analyze(bytes) {
          const result = analyzeMp3(bytes);
          Object.defineProperty(result, field, { value });
          return result;
        },
      });
      for (const url of ["/file-upload", "/file-upload?details=true"]) {
        const response = await upload(app, url, "one-frame");
        assert.equal(response.statusCode, 500, response.body);
        assert.deepEqual(response.json(), projectPublicError("INTERNAL_ERROR"));
      }
    }
  });

  test("unknown thrown code/status/messages cannot impersonate a controlled public error", async (context) => {
    const app = application(context, {
      analyze() {
        throw Object.assign(new Error("PRIVATE NATIVE ERROR"), { statusCode: 400, code: "UPLOAD_EMPTY" });
      },
    });
    const response = await upload(app);
    assert.equal(response.statusCode, 500);
    assert.deepEqual(response.json(), projectPublicError("INTERNAL_ERROR"));
    assert.ok(!response.body.includes("PRIVATE"));
  });

  test("a genuine controlled schema validation failure uses the trusted formatter identity and releases admission", async (context) => {
    const app = application(context, { budgets: { maxActiveUploads: 1 } });
    app.addHook("onRoute", (route) => {
      if (route.url === "/file-upload") {
        route.schema = {
          ...route.schema,
          querystring: Type.Object({ requiredProbe: Type.String() }, { additionalProperties: true }),
        };
      }
    });
    const invalid = await upload(app);
    assert.equal(invalid.statusCode, 400);
    assert.deepEqual(invalid.json(), projectPublicError("REQUEST_INVALID"));
    const recovered = await upload(app, "/file-upload?requiredProbe=valid");
    assert.equal(recovered.statusCode, 200);
    assert.deepEqual(recovered.json(), { frameCount: 3 });
  });

  test(
    "two factories have independent admission and health remains outside the upload collector",
    { timeout: 5_000 },
    async (context) => {
      const first = application(context, { budgets: { maxActiveUploads: 1 } });
      const second = application(context, { budgets: { maxActiveUploads: 1 } });
      let admitted: (() => void) | undefined;
      const entered = new Promise<void>((resolve) => {
        admitted = resolve;
      });
      first.addHook("preParsing", (_request, _reply, payload, done) => {
        admitted?.();
        done(null, payload);
      });
      const stream = new PassThrough();
      context.after(() => stream.destroy());
      const pending = first.inject({
        method: "POST",
        url: "/file-upload",
        headers: { "content-type": "audio/mpeg", "content-length": "384" },
        payload: stream,
      });
      await entered;
      try {
        const busy = await upload(first, "/file-upload", "one-frame");
        assert.equal(busy.statusCode, 503);
        assert.equal(busy.headers["retry-after"], "1");
        assert.deepEqual(busy.json(), projectPublicError("SERVICE_BUSY"));
        assert.equal((await first.inject({ method: "GET", url: "/healthz" })).statusCode, 200);
        assert.deepEqual((await upload(second, "/file-upload", "one-frame")).json(), { frameCount: 1 });
      } finally {
        stream.end(fixtureBytes("one-frame"));
      }
      const completed = await pending;
      assert.equal(completed.statusCode, 200);
      assert.deepEqual(completed.json(), { frameCount: 1 });
      assert.deepEqual((await upload(first, "/file-upload", "one-frame")).json(), { frameCount: 1 });
    },
  );
});

/** Invalid zero diagnostics are internal failures; only a coherent complete carrier produces no-audio input error. */
test("invalid zero diagnostics do not masquerade as a safe client error", async () => {
  const app = createApp({
    analyze: () => ({
      audioFrameCount: 0,
      physicalFrameCount: 7,
      excludedMetadataFrameCount: 0,
      xing: { status: "absent" },
      warnings: [],
    }),
  });
  try {
    const result = await app.inject({
      method: "POST",
      url: "/file-upload",
      headers: { "content-type": "audio/mpeg" },
      payload: Buffer.from([0xff, 0xfb, 0x50, 0]),
    });
    assert.equal(result.statusCode, 500);
    assert.equal(result.json().code, "INTERNAL_ERROR");
  } finally {
    await app.close();
  }
});
