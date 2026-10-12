/**
 * Exercise the browser's public response contract and its raw-file service through native Fetch on loopback.
 * Run with Node 24: node --test frontend/tests/frontend-response.test.ts. These regression cases were authored after the
 * implementation; they are not frozen acceptance evidence. Pure helpers validate unknown values; service cases own
 * ephemeral loopback servers and exercise request identity, cancellation, body reads, and disabled retries.
 */
import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import type { IncomingMessage, RequestListener } from "node:http";
import { describe, it } from "node:test";
import type { TestContext } from "node:test";
import { analyzeMp3 } from "../src/services/mp3Analysis.ts";
import { parseApiError, parseDetailedAnalysis, parseFrameCount, responseError } from "../src/response.ts";

/** The frozen r2 encoded-VBR wire example supplies expected values independently of any product parser. */
function detailedResponse() {
  return {
    frameCount: 15,
    analysis: {
      physicalFrameCount: 16,
      excludedMetadataFrameCount: 1,
      xing: {
        status: "present",
        marker: "Xing",
        frameOffsetBytes: 0,
        frameLengthBytes: 182,
        markerOffsetBytes: 21,
        flags: 15,
        declaredAudioFrameCount: 15,
        declaredMpegStreamByteCount: 2160,
        seekTableEntryCount: 100,
        qualityValue: 0,
      },
      warnings: [],
    },
  };
}

/** Bind one ephemeral loopback service for real native Fetch; close active connections even when an assertion fails. */
async function localService(context: TestContext, handler: RequestListener): Promise<URL> {
  const server = createServer(handler);
  context.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return new URL(`http://127.0.0.1:${address.port}`);
}

/** Collect only tiny controlled transport-test bytes, without importing a parser or an acceptance oracle. */
async function receivedBytes(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    assert.ok(Buffer.isBuffer(chunk));
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/** A tiny raw File exercises transport identity; these wire tests do not claim that its bytes form an MP3. */
function uploadFile(): File {
  return new File([new Uint8Array([0xff, 0xfb, 0x50, 0, 0x11, 0x22])], "transport-test.mp3", { type: "audio/mpeg" });
}

/** Register one native test for each typed table row, preserving its name and assertions. */
function each<Case>(cases: readonly Case[], name: (value: Case) => string, verify: (value: Case) => void): void {
  for (const value of cases) it(name(value), () => verify(value));
}

describe("response service", () => {
  describe("parseFrameCount", () => {
    each(
      [1, 9, 16, 21, Number.MAX_SAFE_INTEGER],
      (frameCount) => `accept the exact success object with frameCount ${frameCount}`,
      (frameCount) => {
        assert.equal(parseFrameCount({ frameCount }), frameCount);
      },
    );

    const invalidResponses: Array<[string, unknown]> = [
      ["missing response", undefined],
      ["null response", null],
      ["array response", [{ frameCount: 9 }]],
      ["empty object", {}],
      ["wrong property", { count: 9 }],
      ["extra success property", { frameCount: 9, duration: 1 }],
      ["success mixed with error", { frameCount: 9, error: "Invalid MP3" }],
      ["zero frames", { frameCount: 0 }],
      ["negative zero frames", { frameCount: -0 }],
      ["negative frames", { frameCount: -9 }],
      ["fractional frames", { frameCount: 9.5 }],
      ["NaN frames", { frameCount: Number.NaN }],
      ["positive infinite frames", { frameCount: Number.POSITIVE_INFINITY }],
      ["negative infinite frames", { frameCount: Number.NEGATIVE_INFINITY }],
      ["unsafe integer frames", { frameCount: Number.MAX_SAFE_INTEGER + 1 }],
      ["string frames", { frameCount: "9" }],
      ["boolean frames", { frameCount: true }],
      ["null frames", { frameCount: null }],
      ["missing frames", { frameCount: undefined }],
      ["nested frames", { frameCount: { value: 9 } }],
      ["array frames", { frameCount: [9] }],
      ["raw JSON string", '{"frameCount":9}'],
      ["malformed JSON string", '{"frameCount":'],
      ["blank string", "   "],
      ["number response", 9],
      ["boolean response", true],
    ];

    each(
      invalidResponses,
      ([description]) => `reject ${description} as a frame count`,
      ([, value]) => {
        assert.equal(parseFrameCount(value), undefined);
      },
    );

    it("require frameCount to be the response object's own success property", () => {
      assert.equal(parseFrameCount(Object.create({ frameCount: 9 })), undefined);
    });
  });

  describe("responseError", () => {
    it("preserve a useful service error", () => {
      assert.equal(responseError({ error: "Unsupported MPEG version." }), "Unsupported MPEG version.");
    });

    it("trim only surrounding whitespace from a service error", () => {
      assert.equal(
        responseError({ error: " \n Upload failed:  retry this file.\t " }),
        "Upload failed:  retry this file.",
      );
    });

    it("preserve markup-shaped service errors as literal text", () => {
      // This helper returns text only. Browser acceptance separately checks the renderer's safe text presentation.
      const error = "<img src=x onerror=\"throw new Error('unexpected')\"><script>alert(1)</script>";
      assert.equal(responseError({ error }), error);
      assert.equal(parseFrameCount({ error }), undefined);
    });

    it("retain useful error text when the error response includes other metadata", () => {
      assert.equal(responseError({ error: "Invalid MP3", statusCode: 400 }), "Invalid MP3");
    });

    const invalidErrors: Array<[string, unknown]> = [
      ["missing response", undefined],
      ["null response", null],
      ["array response", [{ error: "Upload failed" }]],
      ["missing error property", { frameCount: 9 }],
      ["empty object", {}],
      ["empty error", { error: "" }],
      ["blank error", { error: " \t\n " }],
      ["null error", { error: null }],
      ["missing error value", { error: undefined }],
      ["numeric error", { error: 400 }],
      ["boolean error", { error: false }],
      ["object error", { error: { message: "Upload failed" } }],
      ["array error", { error: ["Upload failed"] }],
      ["raw JSON string", '{"error":"Upload failed"}'],
      ["malformed JSON string", '{"error":'],
      ["raw service error string", "Upload failed"],
      ["blank response string", "  "],
    ];

    each(
      invalidErrors,
      ([description]) => `leave fallback handling to the caller for ${description}`,
      ([, value]) => {
        assert.equal(responseError(value), undefined);
      },
    );

    it("reject an inherited service error", () => {
      assert.equal(responseError(Object.create({ error: "Upload failed" })), undefined);
    });
  });
});

describe("detailed response boundary", () => {
  it("accept the complete independent encoded-VBR wire example including zero stored quality", () => {
    const value = detailedResponse();
    assert.deepEqual(parseDetailedAnalysis(value), value);
    assert.equal(parseFrameCount(value), undefined);
  });

  it("accept equal measured counts with no leading carrier and no warnings", () => {
    const value = {
      frameCount: 9,
      analysis: { physicalFrameCount: 9, excludedMetadataFrameCount: 0, xing: { status: "absent" }, warnings: [] },
    };
    assert.deepEqual(parseDetailedAnalysis(value), value);
  });

  it("reject default responses where details were requested", () => {
    assert.equal(parseDetailedAnalysis({ frameCount: 15 }), undefined);
  });

  it("reject invalid counts, inconsistent equations and unexpected internal fields", () => {
    const cases: unknown[] = [
      { ...detailedResponse(), frameCount: 0 },
      { ...detailedResponse(), frameCount: Number.NaN },
      { ...detailedResponse(), frameCount: 15.5 },
      { ...detailedResponse(), frameCount: Number.MAX_SAFE_INTEGER + 1 },
      { ...detailedResponse(), privateBuffer: "never public" },
    ];
    for (const physicalFrameCount of [15, Number.POSITIVE_INFINITY, 16.5, Number.MAX_SAFE_INTEGER + 1]) {
      const value = detailedResponse();
      value.analysis.physicalFrameCount = physicalFrameCount;
      cases.push(value);
    }
    const inconsistentCarrier = detailedResponse();
    inconsistentCarrier.analysis.excludedMetadataFrameCount = 0;
    inconsistentCarrier.analysis.physicalFrameCount = 15;
    cases.push(inconsistentCarrier);
    for (const value of cases) assert.equal(parseDetailedAnalysis(value), undefined);
  });

  it("reject invalid carrier byte boundaries and flags", () => {
    for (const markerOffsetBytes of [20, 22, 200, -1, 21.5]) {
      const value = detailedResponse();
      value.analysis.xing.markerOffsetBytes = markerOffsetBytes;
      assert.equal(parseDetailedAnalysis(value), undefined);
    }
    const unknownFlags = detailedResponse();
    unknownFlags.analysis.xing.flags = 16;
    assert.equal(parseDetailedAnalysis(unknownFlags), undefined);
  });

  it("accept bounded declaration warnings while rejecting repeated or unbounded warnings", () => {
    const value = detailedResponse();
    const mismatch = { code: "XING_DECLARED_FRAME_COUNT_MISMATCH" };
    value.analysis.xing.declaredAudioFrameCount = 999;
    const warned = { ...value, analysis: { ...value.analysis, warnings: [mismatch] } };
    assert.deepEqual(parseDetailedAnalysis(warned), warned);
    for (const warnings of [[mismatch, mismatch], Array(4).fill(mismatch), [{ code: "PRIVATE_WARNING" }]]) {
      assert.equal(parseDetailedAnalysis({ ...value, analysis: { ...value.analysis, warnings } }), undefined);
    }
  });

  it("validate error catalogue codes, statuses and intentional messages together", () => {
    const value = { code: "UPLOAD_TOO_LARGE", error: "The upload exceeds the 20 MiB (20,971,520-byte) limit." };
    assert.deepEqual(parseApiError(value, 413), value);
    assert.equal(parseApiError(value, 400), undefined);
    assert.equal(parseApiError({ ...value, code: "UNKNOWN_ERROR" }, 413), undefined);
    assert.equal(parseApiError({ ...value, error: "Private native error at /tmp/input.mp3" }, 413), undefined);
    assert.equal(parseApiError({ ...value, stack: "private" }, 413), undefined);
    assert.equal(parseApiError({ error: value.error }, 413), undefined);
  });
});

describe("raw upload service", () => {
  it("send one raw File with details=true and preserve Fetch policy through Ky", async (context) => {
    const file = uploadFile();
    let requests = 0;
    const fetch = globalThis.fetch;
    context.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      assert.ok(input instanceof Request);
      assert.equal(input.credentials, "omit");
      assert.equal(input.cache, "no-store");
      assert.equal(input.redirect, "error");
      assert.equal(input.keepalive, false);
      return fetch(input, init);
    });
    const baseUrl = await localService(context, async (request, response) => {
      requests += 1;
      assert.equal(request.method, "POST");
      assert.equal(request.url, "/file-upload?details=true");
      assert.equal(request.headers["content-type"], "audio/mpeg");
      assert.deepEqual(await receivedBytes(request), Buffer.from(await file.arrayBuffer()));
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(detailedResponse()));
    });
    const outcome = await analyzeMp3(file, new AbortController().signal, { baseUrl });
    assert.equal(outcome.kind, "success");
    if (outcome.kind === "success") {
      assert.equal(outcome.frameCount, 15);
      assert.deepEqual(outcome.analysis, detailedResponse().analysis);
    }
    assert.equal(requests, 1);
  });

  it("return a validated server code without automatically retrying a busy response, then recover on a new action", async (context) => {
    let requests = 0;
    const baseUrl = await localService(context, (_request, response) => {
      requests += 1;
      response.writeHead(requests === 1 ? 503 : 200, { "Content-Type": "application/json", "Retry-After": "0" });
      response.end(
        JSON.stringify(
          requests === 1
            ? { code: "SERVICE_BUSY", error: "The service is busy. Please try again shortly." }
            : detailedResponse(),
        ),
      );
    });
    const first = await analyzeMp3(uploadFile(), new AbortController().signal, { baseUrl });
    assert.deepEqual(first, {
      kind: "error",
      reason: "server",
      code: "SERVICE_BUSY",
      message: "Error: The service is busy. Please try again shortly.",
    });
    assert.equal(requests, 1);
    assert.equal((await analyzeMp3(uploadFile(), new AbortController().signal, { baseUrl })).kind, "success");
    assert.equal(requests, 2);
  });

  it("reject unknown codes, wrong code/status pairs and invented server messages", async (context) => {
    for (const body of [
      { code: "UNTRUSTED_CODE", error: "Private error" },
      { code: "UPLOAD_TOO_LARGE", error: "The upload exceeds the 20 MiB (20,971,520-byte) limit." },
      { code: "MP3_INVALID_HEADER", error: "Private error at /tmp/upload.mp3" },
    ]) {
      const baseUrl = await localService(context, (_request, response) => {
        response.writeHead(400, { "Content-Type": "application/json" });
        response.end(JSON.stringify(body));
      });
      const outcome = await analyzeMp3(uploadFile(), new AbortController().signal, { baseUrl });
      assert.equal(outcome.kind, "error");
      if (outcome.kind === "error") assert.equal(outcome.reason, "invalid-response");
      assert.doesNotMatch(JSON.stringify(outcome), /Private|UNTRUSTED|\/tmp\//);
    }
  });

  it("preserve legacy error text literally and recover from a non-JSON proxy body", async (context) => {
    let requests = 0;
    const markup = '<img src=x onerror="unexpected()"> Invalid MP3';
    const baseUrl = await localService(context, (_request, response) => {
      requests += 1;
      response.writeHead(502, { "Content-Type": requests === 1 ? "application/json" : "text/html" });
      response.end(requests === 1 ? JSON.stringify({ error: markup }) : "<h1>Unavailable</h1>");
    });
    assert.deepEqual(await analyzeMp3(uploadFile(), new AbortController().signal, { baseUrl }), {
      kind: "error",
      reason: "legacy-server",
      message: `Error: ${markup}`,
    });
    const outcome = await analyzeMp3(uploadFile(), new AbortController().signal, { baseUrl });
    assert.equal(outcome.kind, "error");
    if (outcome.kind === "error") assert.equal(outcome.reason, "invalid-response");
    assert.doesNotMatch(JSON.stringify(outcome), /<h1>/);
  });

  it("reject a default body or unexpected success status where the detailed 200 response was requested", async (context) => {
    for (const [status, body] of [
      [200, { frameCount: 15 }],
      [201, detailedResponse()],
    ] as const) {
      const baseUrl = await localService(context, (_request, response) => {
        response.writeHead(status, { "Content-Type": "application/json" });
        response.end(JSON.stringify(body));
      });
      const outcome = await analyzeMp3(uploadFile(), new AbortController().signal, { baseUrl });
      assert.equal(outcome.kind, "error");
      if (outcome.kind === "error") assert.equal(outcome.reason, "invalid-response");
    }
  });

  it("keep the caller deadline effective after response headers while the body is stalled", async (context) => {
    let acknowledgeHeaders: () => void = () => {
      throw new Error("Headers promise was not initialized");
    };
    const headers = new Promise<void>((resolve) => {
      acknowledgeHeaders = resolve;
    });
    const baseUrl = await localService(context, (_request, response) => {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.write('{"frameCount":15,');
      acknowledgeHeaders();
    });
    const controller = new AbortController();
    const pending = analyzeMp3(uploadFile(), controller.signal, { baseUrl });
    await headers;
    const deadline = setTimeout(() => controller.abort(new DOMException("Controlled deadline", "TimeoutError")), 25);
    try {
      assert.deepEqual(await pending, {
        kind: "error",
        reason: "timeout",
        message: "The analysis timed out. Please try again.",
      });
    } finally {
      clearTimeout(deadline);
    }
  });

  it("return intentional cancellation after headers instead of a stale success or invalid-response error", async (context) => {
    let acknowledgeHeaders: () => void = () => {
      throw new Error("Headers promise was not initialized");
    };
    const headers = new Promise<void>((resolve) => {
      acknowledgeHeaders = resolve;
    });
    const baseUrl = await localService(context, (_request, response) => {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.write('{"frameCount":15,');
      acknowledgeHeaders();
    });
    const controller = new AbortController();
    const pending = analyzeMp3(uploadFile(), controller.signal, { baseUrl });
    await headers;
    controller.abort();
    assert.deepEqual(await pending, { kind: "error", reason: "cancelled", message: "The analysis was cancelled." });
  });

  it("never follow a redirect that could replay the uploaded body", async (context) => {
    let requests = 0;
    const baseUrl = await localService(context, (_request, response) => {
      requests += 1;
      response.writeHead(307, { Location: "/replay-target" });
      response.end();
    });
    const outcome = await analyzeMp3(uploadFile(), new AbortController().signal, { baseUrl });
    assert.equal(outcome.kind, "error");
    if (outcome.kind === "error") assert.equal(outcome.reason, "network");
    assert.equal(requests, 1);
  });

  it("report a network failure without replaying a disconnected upload", async (context) => {
    let requests = 0;
    const baseUrl = await localService(context, (request) => {
      requests += 1;
      request.socket.destroy();
    });
    const outcome = await analyzeMp3(uploadFile(), new AbortController().signal, { baseUrl });
    assert.equal(outcome.kind, "error");
    if (outcome.kind === "error") assert.equal(outcome.reason, "network");
    assert.equal(requests, 1);
  });
});
