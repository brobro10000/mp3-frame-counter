/**
 * Exercise the browser's public response contract independently of transport and rendering.
 * Run with Node 24: node --test tests/unit/frontend-response.test.ts. These regression cases were authored after the
 * implementation; they are not frozen acceptance evidence. The helpers take unknown values and perform no I/O.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseFrameCount, responseError } from "../../frontend/src/response.ts";

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
