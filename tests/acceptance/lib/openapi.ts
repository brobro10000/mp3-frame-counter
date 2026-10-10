/**
 * Bounded structural contract checks, not a general OpenAPI validator. Checks the reviewed binary operations, closed
 * schemas, status set and strictly local references. Shared by the fixture checker and deliberate mutation controls.
 */
import assert from "node:assert/strict";

export function assertOpenApi(value: unknown): void {
  assert.ok(value && typeof value === "object");
  const doc = value as Record<string, any>;
  assert.equal(doc.openapi, "3.0.3");
  assert.equal(doc.info.version, "transport-v1");
  function references(node: any): void {
    if (!node || typeof node !== "object") return;
    if ("$ref" in node) {
      assert.equal(typeof node.$ref, "string");
      assert.match(node.$ref, /^#\//, "Specification references must be local");
      let resolved: any = doc;
      for (const field of node.$ref.slice(2).split("/"))
        resolved = resolved?.[field.replace(/~1/g, "/").replace(/~0/g, "~")];
      assert.ok(resolved && typeof resolved === "object", "Unresolved local specification reference");
    }
    for (const child of Object.values(node)) references(child);
  }
  references(doc);
  assert.deepEqual(Object.keys(doc.paths).sort(), ["/file-upload", "/healthz"]);
  const upload = doc.paths["/file-upload"].post;
  assert.equal(upload.requestBody.required, true);
  assert.deepEqual(Object.keys(upload.requestBody.content).sort(), ["application/octet-stream", "audio/mpeg"]);
  for (const media of Object.values(upload.requestBody.content) as any[])
    assert.deepEqual(media.schema, { type: "string", format: "binary" });
  assert.equal(upload["x-max-body-bytes"], 20_971_520);
  assert.equal(upload["x-active-upload-limit"], 2);
  assert.deepEqual(Object.keys(upload.responses).sort(), [
    "200",
    "400",
    "404",
    "405",
    "408",
    "413",
    "415",
    "417",
    "500",
    "503",
  ]);
  for (const [status, response] of Object.entries(upload.responses) as [string, any][]) {
    assert.deepEqual(response.content, {
      "application/json": { schema: { $ref: `#/components/schemas/${status === "200" ? "FrameCount" : "Error"}` } },
    });
  }
  const schemas = doc.components.schemas;
  assert.deepEqual(schemas.FrameCount, {
    type: "object",
    additionalProperties: false,
    required: ["frameCount"],
    properties: { frameCount: { type: "integer", minimum: 1 } },
  });
  assert.deepEqual(schemas.Error, {
    type: "object",
    additionalProperties: false,
    required: ["error"],
    properties: { error: { type: "string", minLength: 1 } },
  });
  assert.deepEqual(schemas.Health, {
    type: "object",
    additionalProperties: false,
    required: ["status"],
    properties: { status: { type: "string", enum: ["ok"] } },
  });
  for (const method of ["get", "put", "options", "head"]) {
    assert.deepEqual(doc.paths["/file-upload"][method].responses["405"].headers.Allow.schema.enum, ["POST"]);
  }
  for (const method of ["head", "post"])
    assert.deepEqual(doc.paths["/healthz"][method].responses["405"].headers.Allow.schema.enum, ["GET"]);
  assert.deepEqual(doc.paths["/healthz"].get.responses["200"].content, {
    "application/json": { schema: { $ref: "#/components/schemas/Health" } },
  });
  for (const path of ["/file-upload", "/healthz"]) {
    const head = doc.paths[path].head.responses["405"];
    assert.ok(!Object.hasOwn(head, "content"), "HEAD response must have no content");
    assert.deepEqual(head.headers["Content-Type"].schema, {
      type: "string",
      enum: ["application/json", "application/json; charset=utf-8"],
    });
  }
  assert.deepEqual(upload.responses["503"].headers["Retry-After"].schema, { type: "string", pattern: "^[1-9][0-9]*$" });
  assert.deepEqual(Object.keys(doc["x-controlled-proxy-responses"]).sort(), ["502", "504"]);
}
