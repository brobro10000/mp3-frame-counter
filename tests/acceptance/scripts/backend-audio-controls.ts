/**
 * Usage: node scripts/backend-audio-controls.ts from the standalone acceptance package. Verify literal successor byte
 * recipes, frozen physical identities, count/detail/error/OpenAPI sensitivity and complete72/22/3 identity declarations.
 * Reads independent fixtures only and writes sanitized candidate-control evidence under .artifacts; no product target,
 * imports, network, decoder, credentials, successful HTTP stub or acceptance execution is involved.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  audioFixtures,
  encodedVbrDetail,
  absentDetail,
  assertDetailedFrameResponse,
  assertAudioUiText,
  hasUiQuantity,
} from "../lib/backend-audio-contract.ts";
import { assertFrameResponse, assertErrorResponse, type ResponseData } from "../lib/assertions.ts";
import { errorCatalogue, errorDto } from "../lib/backend-audio-errors.mjs";
import { assertBackendSpec, exampleMatches } from "../lib/backend-audio-openapi.mjs";
import { fixture, fixtureBytes } from "../lib/fixtures.ts";
import { inventory } from "../lib/inventory.ts";

let negativeControls = 0;
const response = (value: unknown, status = 200): ResponseData => ({
  status,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(value),
});

/** A refusal must originate in the contract predicate, never a missing import/API or fixture/tool setup exception. */
function rejected(name: string, action: () => void): void {
  assert.throws(action, assert.AssertionError, `${name}: no semantic rejection`);
  negativeControls += 1;
}

/** Change one owned negative-control leaf after checking each intermediate value is an object. */
function alter(value: unknown, path: readonly string[], next: unknown, remove = false): void {
  assert.ok(path.length > 0);
  let parent = value;
  for (const key of path.slice(0, -1)) {
    assert.ok(parent !== null && typeof parent === "object");
    parent = Reflect.get(parent, key);
  }
  assert.ok(parent !== null && typeof parent === "object");
  const key = path.at(-1);
  assert.ok(key !== undefined);
  if (remove) Reflect.deleteProperty(parent, key);
  else Reflect.set(parent, key, next);
}

const frozen = JSON.parse(readFileSync(new URL("../fixtures/backend-audio.json", import.meta.url), "utf8"));
const recipes = audioFixtures();
assert.equal(frozen.contractRevision, "backend-audio-v1");
assert.equal(new Set(recipes.map((entry) => entry.id)).size, recipes.length);
assert.deepEqual(
  recipes.map((entry) => ({
    id: entry.id,
    bytes: entry.bytes.length,
    sha256: createHash("sha256").update(entry.bytes).digest("hex"),
    expected: entry.expected ?? null,
    status: entry.status ?? 200,
    code: entry.code ?? null,
  })),
  frozen.fixtures,
);
assert.deepEqual(frozen.audioCountOverrides, { "tone-vbr": 15, "xing-physical": 1 });
assert.equal(fixture("tone-vbr").frameCount, 16);
assert.equal(fixture("xing-physical").frameCount, 2);
assert.equal(fixture("tone-cbr").frameCount, 9);
assert.equal(fixture("tone-padded").frameCount, 21);
const encoded = fixtureBytes("tone-vbr");
assert.equal(encoded.length, 2160);
assert.equal(encoded.subarray(21, 25).toString(), "Xing");
assert.equal(encoded.readUInt32BE(25), 15);
assert.equal(encoded.readUInt32BE(29), 15);
assert.equal(encoded.readUInt32BE(33), 2160);
assert.equal(encoded.readUInt32BE(137), 0);
assert.equal(Math.floor((144 * 64_000) / 44_100), 208);
assert.equal(44 + 208 + 1_457_920, 1_458_172);
assert.equal(6_090 - 1, 6_089);
assert.equal(10 + 34, 44);
assert.equal(36 + 4 + 4 + 4 + 4 + 100 + 4 + 52, 208);
assert.equal(54_613 * 384 + 128, 20_971_520);

assertFrameResponse(response({ frameCount: 15 }), 15);
assertDetailedFrameResponse(response(encodedVbrDetail), encodedVbrDetail);
assertDetailedFrameResponse(response(absentDetail(9)), absentDetail(9));
for (const text of [
  "15 audio frames\n16 - 1 = 15",
  "Audio frames: 15\nPhysical frames: 16\nExcluded metadata frames: 1\n16 physical frames - 1 excluded frame = 15 audio frames",
  "Audio frame count\n15\n16 physical frames − excluded metadata frames 1 = audio frames 15",
])
  assertAudioUiText(text, encodedVbrDetail);
assert.ok(hasUiQuantity("Physical frames\n16 frames", /^Physical frames$/i, 16));
assert.ok(hasUiQuantity("Declared MPEG-stream bytes: 2,160 bytes", /^Declared MPEG.stream bytes$/i, 2160));
assert.ok(!hasUiQuantity("Declared MPEG-stream bytes: 12,160 bytes", /^Declared MPEG.stream bytes$/i, 2160));
for (const text of [
  "Audio frames: 16\n16 - 1 = 15",
  "Audio frames: 15\n16 - 0 = 15",
  "Audio frames: 15\n16 - 1 = 16",
  "Audio frames: 15\n16 1 15",
  "Declared audio frames: 15\n16 - 1 = 15",
  "Audio frames: 15.5\n16 - 1 = 15",
])
  rejected("invalid semantic UI text", () => assertAudioUiText(text, encodedVbrDetail));
for (const value of [0, -1, 1.5, null, "15", 16, Number.MAX_SAFE_INTEGER + 1])
  rejected(`invalid audio count ${String(value)}`, () => assertFrameResponse(response({ frameCount: value }), 15));
for (const [path, next, remove] of [
  [["analysis"], undefined, true],
  [["frameCount"], 16],
  [["analysis", "physicalFrameCount"], 15],
  [["analysis", "excludedMetadataFrameCount"], 0],
  [["analysis", "excludedMetadataFrameCount"], null],
  [["analysis", "xing", "markerOffsetBytes"], 23],
  [["analysis", "xing", "seekTableEntryCount"], 99],
  [["analysis", "xing", "qualityValue"], null],
  [["analysis", "xing", "payload"], "internal"],
  [["analysis", "warnings"], [{ code: "UNKNOWN" }]],
  [["statusCode"], 200],
] as const) {
  const value = structuredClone(encodedVbrDetail);
  alter(value, path, next, remove);
  rejected("invalid detailed DTO", () => assertDetailedFrameResponse(response(value), encodedVbrDetail));
}
for (const [code, entry] of Object.entries(errorCatalogue)) {
  const status = Number(entry[0]);
  const dto = errorDto(code);
  assertErrorResponse(response(dto, status), status, code);
  rejected(`${code} legacy error`, () => assertErrorResponse(response({ error: dto.error }, status), status, code));
  rejected(`${code} wrong status mapping`, () =>
    assertErrorResponse(response(dto, status === 400 ? 415 : 400), status === 400 ? 415 : 400),
  );
  rejected(`${code} native message`, () =>
    assertErrorResponse(response({ ...dto, error: "FST_ERR_INTERNAL /private/file" }, status), status),
  );
}
const spec = JSON.parse(readFileSync(new URL("../fixtures/backend-audio-openapi.json", import.meta.url), "utf8"));
assertBackendSpec(spec);
const routingElsewhere = structuredClone(spec);
routingElsewhere.paths["/healthz"].get.responses["404"] = routingElsewhere.paths["/file-upload"].post.responses["404"];
delete routingElsewhere.paths["/file-upload"].post.responses["404"];
delete routingElsewhere.paths["/file-upload"].post.responses["405"];
assertBackendSpec(routingElsewhere);
const equivalentLiterals = structuredClone(spec);
const equivalentAnalysis = equivalentLiterals.components.schemas.FrameDetail.properties.analysis;
equivalentAnalysis.properties.excludedMetadataFrameCount = { type: "integer", minimum: 0, maximum: 1 };
equivalentAnalysis.properties.xing.oneOf[1].properties.marker = {
  anyOf: [
    { type: "string", enum: ["Info"] },
    { type: "string", enum: ["Xing"] },
  ],
};
assertBackendSpec(equivalentLiterals);

/** Safe byte maxima describe reachable spans, with no requirement to choose MAX_SAFE_INTEGER. */
const presentPath = [
  "components",
  "schemas",
  "FrameDetail",
  "properties",
  "analysis",
  "properties",
  "xing",
  "oneOf",
  "1",
  "properties",
];
const byteEndpoints = {
  frameOffsetBytes: 20_971_520 - 2 * 96,
  markerOffsetBytes: 20_971_520 - 2 * 96 + 36,
  frameLengthBytes: 1_441,
};
assert.equal(Math.floor((144 * 320_000) / 32_000) + 1, 1_441);
assert.equal(Math.floor((144 * 32_000) / 48_000), 96);
for (const endpointKind of ["upload-cap", "attainable-endpoint"] as const) {
  const equivalentBytes = structuredClone(spec);
  for (const [field, endpoint] of Object.entries(byteEndpoints))
    alter(equivalentBytes, [...presentPath, field, "maximum"], endpointKind === "upload-cap" ? 20_971_520 : endpoint);
  assertBackendSpec(equivalentBytes);
}
for (const [field, endpoint] of Object.entries(byteEndpoints))
  for (const [name, maximum] of [
    ["too small", endpoint - 1],
    ["unsafe", Number.MAX_SAFE_INTEGER + 1],
    ["infinite", Infinity],
    ["not-a-number", NaN],
    ["fractional", endpoint + 0.5],
    ["coerced", String(endpoint)],
    ["negative", -1],
    ["missing", undefined],
  ] as const) {
    const invalidBound = structuredClone(spec);
    alter(invalidBound, [...presentPath, field, "maximum"], maximum, maximum === undefined);
    rejected(`${field} ${name} maximum`, () => assertBackendSpec(invalidBound));
  }
for (const annotationKind of ["inline-description", "local-reference"] as const) {
  const equivalentBinary = structuredClone(spec);
  equivalentBinary.components.schemas.BinaryUpload = { type: "string", format: "binary", description: "Raw bytes." };
  for (const media of Object.values(equivalentBinary.paths["/file-upload"].post.requestBody.content)) {
    assert.ok(media !== null && typeof media === "object");
    const schema =
      annotationKind === "inline-description"
        ? { type: "string", format: "binary", title: "Raw upload", description: "The raw uploaded file bytes." }
        : { $ref: "#/components/schemas/BinaryUpload" };
    Reflect.set(media, "schema", schema);
  }
  assertBackendSpec(equivalentBinary);
}
for (const [name, schema] of [
  ["wrong binary type", { type: "object", format: "binary", description: "Raw bytes." }],
  ["wrong binary format", { type: "string", format: "byte", description: "Raw bytes." }],
  ["external binary reference", { $ref: "https://invalid.example/BinaryUpload" }],
  ["missing binary reference", { $ref: "#/components/schemas/AbsentBinaryUpload" }],
] as const) {
  const invalidBinary = structuredClone(spec);
  alter(invalidBinary, ["paths", "/file-upload", "post", "requestBody", "content", "audio/mpeg", "schema"], schema);
  rejected(name, () => assertBackendSpec(invalidBinary));
}
for (const casing of ["lowercase", "uppercase"] as const) {
  const equivalentHeaders = structuredClone(spec);
  for (const methods of Object.values(equivalentHeaders.paths)) {
    assert.ok(methods !== null && typeof methods === "object");
    for (const operation of Object.values(methods)) {
      assert.ok(operation !== null && typeof operation === "object");
      const responses = Reflect.get(operation, "responses");
      if (!responses || typeof responses !== "object") continue;
      for (const response of Object.values(responses)) {
        assert.ok(response !== null && typeof response === "object");
        const headers = Reflect.get(response, "headers");
        if (!headers || typeof headers !== "object") continue;
        Reflect.set(
          response,
          "headers",
          Object.fromEntries(
            Object.entries(headers).map(([key, value]) => [
              casing === "lowercase" ? key.toLowerCase() : key.toUpperCase(),
              value,
            ]),
          ),
        );
      }
    }
  }
  assertBackendSpec(equivalentHeaders);
}
for (const [name, path, value] of [
  ["misnamed Allow", ["paths", "/file-upload", "get", "responses", "405", "headers"], { Allowance: {} }],
  ["misnamed Retry-After", ["paths", "/file-upload", "post", "responses", "503", "headers"], { RetryAfter: {} }],
  [
    "restricted default count maximum",
    ["components", "schemas", "FrameCount", "properties", "frameCount", "maximum"],
    20_971_520,
  ],
  [
    "restricted detailed count maximum",
    ["components", "schemas", "FrameDetail", "properties", "frameCount", "maximum"],
    20_971_520,
  ],
  [
    "restricted physical count maximum",
    ["components", "schemas", "FrameDetail", "properties", "analysis", "properties", "physicalFrameCount", "maximum"],
    20_971_520,
  ],
] as const) {
  const invalid = structuredClone(spec);
  alter(invalid, path, value);
  rejected(name, () => assertBackendSpec(invalid));
}
for (const field of ["declaredAudioFrameCount", "declaredMpegStreamByteCount", "qualityValue"]) {
  const invalidDeclaration = structuredClone(spec);
  alter(invalidDeclaration, [...presentPath, field, "maximum"], 20_971_520);
  rejected(`${field} restricted uint32 maximum`, () => assertBackendSpec(invalidDeclaration));
}
for (const status of ["404", "405"]) {
  const missingRouting = structuredClone(spec);
  for (const methods of Object.values(missingRouting.paths)) {
    assert.ok(methods !== null && typeof methods === "object");
    for (const operation of Object.values(methods)) {
      assert.ok(operation !== null && typeof operation === "object");
      const responses = Reflect.get(operation, "responses");
      if (responses !== null && typeof responses === "object") Reflect.deleteProperty(responses, status);
    }
  }
  rejected(`missing appropriate routing ${status} examples`, () => assertBackendSpec(missingRouting));
}
const uploadPath = ["paths", "/file-upload", "post"];
const schemaPath = ["components", "schemas"];
const samplePath = [...uploadPath, "responses", "200", "content", "application/json"];
for (const [name, path, next, remove] of [
  ["no detailed branch", [...samplePath, "schema", "oneOf"], [{ $ref: "#/components/schemas/FrameCount" }]],
  ["closed-default accepts analysis", [...schemaPath, "FrameCount", "additionalProperties"], true],
  ["invalid count schema", [...schemaPath, "FrameCount", "properties", "frameCount", "minimum"], 0],
  ["extra leaked detail", [...schemaPath, "FrameDetail", "properties", "internal"], { type: "string" }],
  [
    "unbounded warnings",
    [...schemaPath, "FrameDetail", "properties", "analysis", "properties", "warnings", "maxItems"],
    undefined,
    true,
  ],
  ["error-only schema", [...schemaPath, "Error", "properties", "code"], undefined, true],
  ["missing standard502", [...uploadPath, "responses", "502"], undefined, true],
  ["missing health route", ["paths", "/healthz"], undefined, true],
  [
    "unsafe offset schema",
    [
      ...schemaPath,
      "FrameDetail",
      "properties",
      "analysis",
      "properties",
      "xing",
      "oneOf",
      "1",
      "properties",
      "frameOffsetBytes",
      "type",
    ],
    "number",
  ],
  [
    "missing error examples",
    [...uploadPath, "responses", "415", "content", "application/json", "examples"],
    undefined,
    true,
  ],
  [
    "wrong example code/status",
    [...uploadPath, "responses", "413", "content", "application/json", "examples", "upload_too_large", "value", "code"],
    "SERVICE_BUSY",
  ],
  ["HEAD content", ["paths", "/file-upload", "head", "responses", "405", "content"], {}],
  ["missing Allow", ["paths", "/file-upload", "get", "responses", "405", "headers"], undefined, true],
  ["missing RetryAfter", [...uploadPath, "responses", "503", "headers"], undefined, true],
  ["coerced query rule", [...uploadPath, "parameters", "0", "description"], "Boolean true selects details."],
] as const) {
  const value = structuredClone(spec);
  alter(value, path, next, remove);
  rejected(name, () => assertBackendSpec(value));
}

/** Reject omissions and incorrect header literals found by the independent frozen-contract audit. */
for (const [name, path, next, remove] of [
  ["optional detailed count", [...schemaPath, "FrameDetail", "required"], ["analysis"]],
  [
    "optional absent carrier status",
    [...schemaPath, "FrameDetail", "properties", "analysis", "properties", "xing", "oneOf", "0", "required"],
    [],
  ],
  ["unrestricted error code", [...schemaPath, "Error", "properties", "code", "enum"], undefined, true],
  ["missing upload HEAD", ["paths", "/file-upload", "head"], undefined, true],
  [
    "wrong upload Allow value",
    ["paths", "/file-upload", "get", "responses", "405", "headers", "Allow", "schema"],
    { type: "string", enum: ["incorrect"] },
  ],
  [
    "wrong health Allow value",
    ["paths", "/healthz", "post", "responses", "405", "headers", "Allow", "schema"],
    { type: "string", enum: ["POST"] },
  ],
  [
    "invalid Retry-After value",
    [...uploadPath, "responses", "503", "headers", "Retry-After", "schema"],
    { type: "string", enum: ["incorrect"] },
  ],
  [
    "zero Retry-After value",
    [...uploadPath, "responses", "503", "headers", "Retry-After", "schema"],
    { type: "string", enum: ["0"] },
  ],
] as const) {
  const invalid = structuredClone(spec);
  alter(invalid, path, next, remove);
  rejected(name, () => assertBackendSpec(invalid));
}
const missingHeads = structuredClone(spec);
for (const methods of Object.values(missingHeads.paths)) {
  assert.ok(methods !== null && typeof methods === "object");
  Reflect.deleteProperty(methods, "head");
}
rejected("all HEAD operations missing", () => assertBackendSpec(missingHeads));

const literalHeaders = structuredClone(spec);
for (const [path, methods] of Object.entries(literalHeaders.paths)) {
  assert.ok(methods !== null && typeof methods === "object");
  for (const operation of Object.values(methods)) {
    assert.ok(operation !== null && typeof operation === "object");
    const responses = Reflect.get(operation, "responses");
    if (!responses || typeof responses !== "object") continue;
    for (const [status, response] of Object.entries(responses)) {
      assert.ok(response !== null && typeof response === "object");
      const headers = Reflect.get(response, "headers");
      if (!headers || typeof headers !== "object") continue;
      const name = status === "405" ? "Allow" : status === "503" ? "Retry-After" : undefined;
      if (name && Object.hasOwn(headers, name))
        Reflect.set(headers, name, {
          schema: { enum: name === "Allow" ? [path === "/file-upload" ? "POST" : "GET"] : ["1", "60"] },
        });
    }
  }
}
assertBackendSpec(literalHeaders);
const simple = { $ref: "#/components/schemas/FrameCount" };
assert.ok(exampleMatches(spec, simple, { frameCount: 1 }));
assert.ok(!exampleMatches(spec, simple, { frameCount: 1, analysis: {} }));

/** Every finite literal field can omit a redundant type while retaining its exact value set. */
const enumOnly = structuredClone(spec);
function omitLiteralTypes(schema: unknown): void {
  assert.ok(schema !== null && typeof schema === "object");
  if (Array.isArray(Reflect.get(schema, "enum"))) Reflect.deleteProperty(schema, "type");
  const properties = Reflect.get(schema, "properties");
  if (properties && typeof properties === "object")
    for (const child of Object.values(properties)) omitLiteralTypes(child);
  const items = Reflect.get(schema, "items");
  if (items) omitLiteralTypes(items);
  for (const keyword of ["oneOf", "anyOf", "allOf"]) {
    const branches = Reflect.get(schema, keyword);
    if (Array.isArray(branches)) for (const child of branches) omitLiteralTypes(child);
  }
}
for (const schema of Object.values(enumOnly.components.schemas)) omitLiteralTypes(schema);
assertBackendSpec(enumOnly);
for (const methods of Object.values(enumOnly.paths)) {
  assert.ok(methods !== null && typeof methods === "object");
  for (const operation of Object.values(methods)) {
    assert.ok(operation !== null && typeof operation === "object");
    const responses = Reflect.get(operation, "responses");
    if (!responses || typeof responses !== "object") continue;
    for (const response of Object.values(responses)) {
      assert.ok(response !== null && typeof response === "object");
      const content = Reflect.get(response, "content");
      if (!content || typeof content !== "object") continue;
      const media = Reflect.get(content, "application/json");
      if (!media || typeof media !== "object") continue;
      const examples = Reflect.get(media, "examples");
      if (!examples || typeof examples !== "object") continue;
      for (const example of Object.values(examples)) {
        assert.ok(example !== null && typeof example === "object");
        assert.ok(exampleMatches(enumOnly, Reflect.get(media, "schema"), Reflect.get(example, "value")));
      }
    }
  }
}
const enumSchema = { enum: [0, 1] };
const markerSchema = { enum: ["Xing", "Info"] };
for (const [schema, value] of [
  [enumSchema, 0],
  [enumSchema, 1],
  [markerSchema, "Xing"],
  [markerSchema, "Info"],
  [{ enum: [true, false] }, false],
  [{ enum: [null] }, null],
  [{ enum: [{ value: 1 }] }, { value: 1 }],
  [{ enum: [[0, 1]] }, [0, 1]],
  [{ oneOf: [{ enum: ["Xing"] }, { enum: ["Info"] }] }, "Info"],
  [{ anyOf: [{ enum: ["Info"] }, { enum: ["Info"] }] }, "Info"],
  [{ allOf: [markerSchema, { enum: ["Info"] }] }, "Info"],
  [{ type: "integer", anyOf: [enumSchema], maximum: 1 }, 1],
  [{ type: "array", items: enumSchema, maxItems: 0 }, []],
] as const)
  assert.ok(exampleMatches(spec, schema, value));
for (const [name, schema, value] of [
  ["enum wrong integer", enumSchema, 2],
  ["enum integer string", enumSchema, "1"],
  ["enum integer boolean", enumSchema, false],
  ["enum integer fraction", enumSchema, 0.5],
  ["enum integer null", enumSchema, null],
  ["enum integer missing", enumSchema, undefined],
  ["enum integer NaN", enumSchema, NaN],
  ["enum integer infinite", enumSchema, Infinity],
  ["enum marker wrong case", markerSchema, "xing"],
  ["enum marker unknown", markerSchema, "VBRI"],
  ["enum marker wrong type", markerSchema, 1],
  ["enum contradictory explicit type", { type: "number", enum: ["Info"] }, "Info"],
  ["enum structural mismatch", { enum: [{ value: 1 }] }, { value: "1" }],
  ["enum array mismatch", { enum: [[0, 1]] }, [1, 0]],
  ["ambiguous oneOf literal", { oneOf: [{ enum: ["Info"] }, { enum: ["Info"] }] }, "Info"],
  ["unmatched anyOf literal", { anyOf: [{ enum: ["Info"] }, { enum: ["Xing"] }] }, "VBRI"],
  ["unmatched allOf literal", { allOf: [markerSchema, { enum: ["Info"] }] }, "Xing"],
  ["composition sibling enum", { enum: ["Xing"], anyOf: [markerSchema] }, "Info"],
  ["composition sibling type", { type: "integer", oneOf: [markerSchema] }, "Info"],
  ["composition sibling maximum", { type: "integer", anyOf: [enumSchema], maximum: 0 }, 1],
  ["composition sibling minLength", { type: "string", allOf: [markerSchema], minLength: 5 }, "Info"],
  ["composition sibling maxLength", { type: "string", anyOf: [markerSchema], maxLength: 3 }, "Info"],
  ["zero array maximum", { type: "array", items: enumSchema, maxItems: 0 }, [1]],
  ["array minimum", { type: "array", items: enumSchema, minItems: 1 }, []],
] as const)
  rejected(name, () => assert.ok(exampleMatches(spec, schema, value)));

const chained = structuredClone(enumOnly);
chained.components.schemas.LiteralExclusion = { enum: [0, 1] };
chained.components.schemas.LiteralExclusionAlias = { $ref: "#/components/schemas/LiteralExclusion" };
chained.components.schemas.FrameDetail.properties.analysis.properties.excludedMetadataFrameCount = {
  $ref: "#/components/schemas/LiteralExclusionAlias",
};
assertBackendSpec(chained);
for (const [name, reference] of [
  ["cyclic literal reference", "#/components/schemas/LiteralExclusionAlias"],
  ["external literal reference", "https://invalid.example/LiteralExclusion"],
  ["missing literal reference", "#/components/schemas/MissingLiteralExclusion"],
] as const) {
  const invalidReference = structuredClone(chained);
  invalidReference.components.schemas.LiteralExclusionAlias = { $ref: reference };
  rejected(name, () => assertBackendSpec(invalidReference));
}
assert.equal(inventory.cases.length, 72);
for (const [role, count] of [
  ["stage", 22],
  ["production", 3],
] as const) {
  const declaration = JSON.parse(readFileSync(new URL(`../fixtures/inventory.${role}.json`, import.meta.url), "utf8"));
  assert.equal(declaration.cases.length, count);
  assert.equal(declaration.contractRevision, "backend-audio-v1");
}

/** Preserve every independently observed missing refusal in one red calibration, without promoting setup failures. */
const correction5Results: { name: string; status: "rejected" | "missing-refusal"; message?: string }[] = [];
function correction5Rejected(name: string, action: () => void): void {
  try {
    rejected(name, action);
    correction5Results.push({ name, status: "rejected" });
  } catch (error) {
    if (!(error instanceof assert.AssertionError)) throw error;
    correction5Results.push({ name, status: "missing-refusal", message: error.message });
  }
}

/** JSON catalogue membership must not coerce non-string codes when no exact expectedCode argument is supplied. */
assertErrorResponse(response(errorDto("UPLOAD_EMPTY"), 400), 400);
for (const [name, code] of [
  ["null", null],
  ["boolean", true],
  ["number", 400],
  ["object", {}],
  ["empty array", []],
  ["singleton catalogue array", ["UPLOAD_EMPTY"]],
] as const)
  correction5Rejected(`non-string error code ${name}`, () =>
    assertErrorResponse(response({ code, error: "Choose a nonempty MP3 file." }, 400), 400),
  );

/** Required counts and present carrier numbers must remain non-null, including the admitted integer exclusion range. */
for (const [name, path, schema] of [
  ["default count", [...schemaPath, "FrameCount", "properties", "frameCount"]],
  ["detailed count", [...schemaPath, "FrameDetail", "properties", "frameCount"]],
  ["physical count", [...schemaPath, "FrameDetail", "properties", "analysis", "properties", "physicalFrameCount"]],
  [
    "excluded count range",
    [...schemaPath, "FrameDetail", "properties", "analysis", "properties", "excludedMetadataFrameCount"],
    { type: "integer", minimum: 0, maximum: 1 },
  ],
  ...[
    "frameOffsetBytes",
    "frameLengthBytes",
    "markerOffsetBytes",
    "flags",
    "declaredAudioFrameCount",
    "declaredMpegStreamByteCount",
    "qualityValue",
  ].map((field) => [field, [...presentPath, field]]),
  ["seekTableEntryCount", [...presentPath, "seekTableEntryCount"], { type: "integer", enum: [100, null] }],
] as const) {
  const nullable = structuredClone(spec);
  const nullablePath = path as readonly string[];
  if (schema) alter(nullable, nullablePath, schema);
  alter(nullable, [...nullablePath, "nullable"], true);
  correction5Rejected(`nullable ${name}`, () => assertBackendSpec(nullable));
}
const correction5Failures = correction5Results.filter((entry) => entry.status === "missing-refusal");
if (correction5Failures.length) console.error("CORRECTION5", JSON.stringify(correction5Results));
assert.deepEqual(correction5Failures, [], "CORRECTION5 missing semantic refusals");

/** Inspect an owned fixture schema before mutation; missing setup paths fail before any rejection is counted. */
function controlSchemaAt(document: unknown, path: readonly string[]): Record<string, unknown> {
  let schema = document;
  for (const key of path) {
    assert.ok(schema !== null && typeof schema === "object");
    schema = Reflect.get(schema, key);
  }
  assert.ok(schema !== null && typeof schema === "object" && !Array.isArray(schema));
  return schema as Record<string, unknown>;
}

/** Frozen r2 requires these response domains to exclude null; literal-constrained scalar coverage already remains above. */
const nonNullResponseSchemas = [
  ["default response object", [...schemaPath, "FrameCount"]],
  ["detailed response object", [...schemaPath, "FrameDetail"]],
  ["analysis object", [...schemaPath, "FrameDetail", "properties", "analysis"]],
  ["absent Xing object", [...schemaPath, "FrameDetail", "properties", "analysis", "properties", "xing", "oneOf", "0"]],
  ["present Xing object", [...schemaPath, "FrameDetail", "properties", "analysis", "properties", "xing", "oneOf", "1"]],
  ["warnings array", [...schemaPath, "FrameDetail", "properties", "analysis", "properties", "warnings"]],
  [
    "mismatch warning object",
    [...schemaPath, "FrameDetail", "properties", "analysis", "properties", "warnings", "items", "oneOf", "0"],
  ],
  [
    "truncated-field warning object",
    [...schemaPath, "FrameDetail", "properties", "analysis", "properties", "warnings", "items", "oneOf", "1"],
  ],
  ["coded error response object", [...schemaPath, "Error"]],
  ["required error message", [...schemaPath, "Error", "properties", "error"]],
  ["health response object", [...schemaPath, "Health"]],
] as const;

/** Harmless annotations and contained aliases retain the same non-null response domain and must remain admitted. */
for (const [name, path] of nonNullResponseSchemas) {
  const annotated = structuredClone(spec);
  const target = controlSchemaAt(annotated, path);
  target.title = name;
  target.description = "Independent non-null response contract annotation.";
  target.nullable = false;
  assertBackendSpec(annotated);

  const referenced = structuredClone(spec);
  referenced.components.schemas.AnnotatedResponseAlias = structuredClone(target);
  alter(referenced, path, { $ref: "#/components/schemas/AnnotatedResponseAlias" });
  assertBackendSpec(referenced);
}

/** Nullable is harmless when finite enum membership or non-null composition branches still refuse null. */
const literalAnnotations = structuredClone(spec);
function annotateNonNullLiterals(schema: unknown): void {
  assert.ok(schema !== null && typeof schema === "object");
  const values = Reflect.get(schema, "enum");
  if (Array.isArray(values)) {
    assert.ok(!values.includes(null));
    Reflect.set(schema, "nullable", true);
    assert.ok(!exampleMatches(literalAnnotations, schema, null));
  }
  const properties = Reflect.get(schema, "properties");
  if (properties && typeof properties === "object")
    for (const child of Object.values(properties)) annotateNonNullLiterals(child);
  const items = Reflect.get(schema, "items");
  if (items) annotateNonNullLiterals(items);
  for (const keyword of ["oneOf", "anyOf", "allOf"]) {
    const branches = Reflect.get(schema, keyword);
    if (Array.isArray(branches)) for (const child of branches) annotateNonNullLiterals(child);
  }
}
for (const schema of Object.values(literalAnnotations.components.schemas)) annotateNonNullLiterals(schema);
assertBackendSpec(literalAnnotations);
const compositionAnnotations = structuredClone(spec);
for (const path of [
  [...samplePath, "schema"],
  [...schemaPath, "FrameDetail", "properties", "analysis", "properties", "xing"],
  [...schemaPath, "FrameDetail", "properties", "analysis", "properties", "warnings", "items"],
]) {
  const target = controlSchemaAt(compositionAnnotations, path);
  target.type = "object";
  target.nullable = true;
  assert.ok(!exampleMatches(compositionAnnotations, target, null));
}
assertBackendSpec(compositionAnnotations);

/** Collect every F-001 missing refusal before failing; only semantic assertion rejection can satisfy each control. */
const correction6Results: { name: string; status: "rejected" | "missing-refusal"; message?: string }[] = [];
function correction6Rejected(name: string, action: () => void): void {
  try {
    rejected(name, action);
    correction6Results.push({ name, status: "rejected" });
  } catch (error) {
    if (!(error instanceof assert.AssertionError)) throw error;
    correction6Results.push({ name, status: "missing-refusal", message: error.message });
  }
}
for (const [name, path] of nonNullResponseSchemas) {
  const direct = structuredClone(spec);
  controlSchemaAt(direct, path).nullable = true;
  correction6Rejected(`nullable direct ${name}`, () => assertBackendSpec(direct));

  const referenced = structuredClone(spec);
  const target = structuredClone(controlSchemaAt(referenced, path));
  target.nullable = true;
  referenced.components.schemas.NullableResponseAlias = target;
  alter(referenced, path, { $ref: "#/components/schemas/NullableResponseAlias" });
  correction6Rejected(`nullable referenced ${name}`, () => assertBackendSpec(referenced));
}
const correction6Failures = correction6Results.filter((entry) => entry.status === "missing-refusal");
if (correction6Failures.length) console.error("CORRECTION6", JSON.stringify(correction6Results));
assert.deepEqual(correction6Failures, [], "CORRECTION6 missing semantic refusals");

/** Independent tagged object controls exercise branches omitted by the fixture's present/empty-warning example. */
const mismatchRecipe = recipes.find((entry) => entry.id === "removed-final-frame");
const truncatedRecipe = recipes.find((entry) => entry.id === "bounded-seek");
assert.ok(mismatchRecipe?.expected);
assert.ok(truncatedRecipe?.expected);
assert.deepEqual(mismatchRecipe.expected.analysis.warnings, [
  { code: "XING_DECLARED_FRAME_COUNT_MISMATCH" },
  { code: "XING_DECLARED_STREAM_BYTES_MISMATCH" },
]);
assert.deepEqual(truncatedRecipe.expected.analysis.warnings, [
  { code: "XING_OPTIONAL_FIELD_TRUNCATED", field: "seekTable" },
]);
const taggedAnalysisPath = [...schemaPath, "FrameDetail", "properties", "analysis", "properties"];
const taggedObjectSchemas = [
  ["absent Xing", [...taggedAnalysisPath, "xing", "oneOf", "0"], absentDetail(9).analysis.xing],
  ["present Xing", [...taggedAnalysisPath, "xing", "oneOf", "1"], encodedVbrDetail.analysis.xing],
  [
    "mismatch warning",
    [...taggedAnalysisPath, "warnings", "items", "oneOf", "0"],
    mismatchRecipe.expected.analysis.warnings[0],
  ],
  [
    "truncated-field warning",
    [...taggedAnalysisPath, "warnings", "items", "oneOf", "1"],
    truncatedRecipe.expected.analysis.warnings[0],
  ],
] as const;

/** Positive DTO examples independently prove absent Xing and both nonempty warning alternatives remain representable. */
const taggedExamples = structuredClone(spec);
const taggedSuccess = controlSchemaAt(taggedExamples, samplePath);
const taggedSuccessExamples = controlSchemaAt(taggedExamples, [...samplePath, "examples"]);
for (const [name, value] of [
  ["ownedAbsentXing", absentDetail(9)],
  ["ownedMismatchWarnings", mismatchRecipe.expected],
  ["ownedTruncatedWarning", truncatedRecipe.expected],
] as const) {
  assert.ok(exampleMatches(taggedExamples, taggedSuccess.schema, value));
  taggedSuccessExamples[name] = {
    summary: "Independent valid tagged object counterpart.",
    value: structuredClone(value),
  };
}
assertBackendSpec(taggedExamples);
for (const [name, path, value] of taggedObjectSchemas) {
  const baseline = controlSchemaAt(spec, path);
  assert.equal(baseline.type, "object");
  assert.ok(exampleMatches(spec, baseline, value));
  for (const nonObject of [0, "absent", [], null]) assert.ok(!exampleMatches(spec, baseline, nonObject));

  const annotated = structuredClone(taggedExamples);
  const target = controlSchemaAt(annotated, path);
  target.title = name;
  target.description = "Independent tagged object domain annotation.";
  assertBackendSpec(annotated);
  const referenced = structuredClone(taggedExamples);
  referenced.components.schemas.TaggedObjectAlias = structuredClone(target);
  alter(referenced, path, { $ref: "#/components/schemas/TaggedObjectAlias" });
  assertBackendSpec(referenced);
}

/** Both typeless and object-annotated warning unions retain valid nonempty warning examples through local aliases. */
const warningUnionPath = [...taggedAnalysisPath, "warnings", "items"];
assert.equal(controlSchemaAt(taggedExamples, warningUnionPath).type, undefined);
for (const annotation of ["typeless", "object"] as const)
  for (const representation of ["direct", "referenced"] as const) {
    const annotated = structuredClone(taggedExamples);
    const union = controlSchemaAt(annotated, warningUnionPath);
    if (annotation === "object") {
      union.type = "object";
      union.nullable = true;
      assert.ok(!exampleMatches(annotated, union, null));
    }
    union.description = "Equivalent tagged warning union with non-null object composition branches.";
    if (representation === "referenced") {
      annotated.components.schemas.AnnotatedWarningUnionAlias = structuredClone(union);
      alter(annotated, warningUnionPath, { $ref: "#/components/schemas/AnnotatedWarningUnionAlias" });
    }
    assertBackendSpec(annotated);
  }

/** A valid absent-detail counterpart leaves the present branch unexercised, isolating its structural obligation. */
const presentUnexercised = structuredClone(spec);
const absentCounterpart = controlSchemaAt(presentUnexercised, [...samplePath, "examples", "detailedCount"]);
assert.equal(
  controlSchemaAt(presentUnexercised, [...samplePath, "examples", "detailedCount", "value", "analysis", "xing"]).status,
  "present",
);
absentCounterpart.summary = "Independent absent carrier counterpart leaves present Xing unexercised.";
absentCounterpart.value = absentDetail(9);
assertBackendSpec(presentUnexercised);

/** Collect all semantic refusals; validated fixture mutation/setup stays outside the checked predicate invocation. */
const taggedDomainResults: { name: string; status: "rejected" | "missing-refusal"; message?: string }[] = [];
function taggedDomainRejected(name: string, action: () => void): void {
  try {
    rejected(name, action);
    taggedDomainResults.push({ name, status: "rejected" });
  } catch (error) {
    if (!(error instanceof assert.AssertionError)) throw error;
    taggedDomainResults.push({ name, status: "missing-refusal", message: error.message });
  }
}
for (const [name, path] of taggedObjectSchemas)
  for (const damage of ["integer type", "missing type"] as const)
    for (const representation of ["direct", "referenced"] as const) {
      // Keep the original sparse examples: augmenting them here would hide the structural predicate's missing checks.
      const invalid = structuredClone(name === "present Xing" ? presentUnexercised : spec);
      const target = controlSchemaAt(invalid, path);
      assert.equal(target.type, "object");
      if (damage === "integer type") target.type = "integer";
      else {
        assert.ok(Reflect.deleteProperty(target, "type"));
        assert.ok(!Object.hasOwn(target, "type"));
      }
      if (representation === "referenced") {
        invalid.components.schemas.DamagedTaggedObjectAlias = structuredClone(target);
        alter(invalid, path, { $ref: "#/components/schemas/DamagedTaggedObjectAlias" });
      }
      taggedDomainRejected(`${representation} ${name} ${damage}`, () => assertBackendSpec(invalid));
    }
for (const representation of ["direct", "referenced"] as const) {
  const invalid = structuredClone(spec);
  assert.deepEqual(
    controlSchemaAt(invalid, [...samplePath, "examples", "detailedCount", "value", "analysis"]).warnings,
    [],
  );
  const union = controlSchemaAt(invalid, warningUnionPath);
  assert.equal(union.type, undefined);
  union.type = "integer";
  if (representation === "referenced") {
    invalid.components.schemas.DamagedWarningUnionAlias = structuredClone(union);
    alter(invalid, warningUnionPath, { $ref: "#/components/schemas/DamagedWarningUnionAlias" });
  }
  taggedDomainRejected(`${representation} warning union integer type`, () => assertBackendSpec(invalid));
}

/** Unexercised tagged literals must admit their valid string values, not only list them in a contradictory enum. */
for (const [name, path, literal] of [
  ["absent status", [...taggedAnalysisPath, "xing", "oneOf", "0", "properties", "status"], "absent"],
  [
    "mismatch warning code",
    [...taggedAnalysisPath, "warnings", "items", "oneOf", "0", "properties", "code"],
    "XING_DECLARED_FRAME_COUNT_MISMATCH",
  ],
  [
    "truncated warning field",
    [...taggedAnalysisPath, "warnings", "items", "oneOf", "1", "properties", "field"],
    "seekTable",
  ],
] as const) {
  const baseline = controlSchemaAt(spec, path);
  assert.equal(baseline.type, "string");
  assert.ok(Array.isArray(baseline.enum) && baseline.enum.includes(literal));
  assert.ok(exampleMatches(spec, baseline, literal));
  for (const representation of ["direct", "referenced"] as const) {
    const invalid = structuredClone(spec);
    const target = controlSchemaAt(invalid, path);
    target.type = "integer";
    if (representation === "referenced") {
      invalid.components.schemas.ContradictoryTaggedLiteralAlias = structuredClone(target);
      alter(invalid, path, { $ref: "#/components/schemas/ContradictoryTaggedLiteralAlias" });
    }
    assert.ok(!exampleMatches(invalid, controlSchemaAt(invalid, path), literal));
    taggedDomainRejected(`${representation} ${name} contradictory integer type`, () => assertBackendSpec(invalid));
  }
}

/** A code's DTO determines field presence even when a schema partitions its warning literals into separate branches. */
const frameMismatchCode = "XING_DECLARED_FRAME_COUNT_MISMATCH";
const streamMismatchCode = "XING_DECLARED_STREAM_BYTES_MISMATCH";
const optionalFieldCode = "XING_OPTIONAL_FIELD_TRUNCATED";
const partitionedWarnings = structuredClone(taggedExamples);
const partitionedItems = controlSchemaAt(partitionedWarnings, warningUnionPath);
const codeOnlyBranch = controlSchemaAt(partitionedWarnings, [...warningUnionPath, "oneOf", "0"]);
const fieldBranch = controlSchemaAt(partitionedWarnings, [...warningUnionPath, "oneOf", "1"]);
assert.deepEqual(codeOnlyBranch.required, ["code"]);
assert.deepEqual(fieldBranch.required, ["code", "field"]);
const frameOnlyBranch = structuredClone(codeOnlyBranch);
const streamOnlyBranch = structuredClone(codeOnlyBranch);
controlSchemaAt(frameOnlyBranch, ["properties", "code"]).enum = [frameMismatchCode];
controlSchemaAt(streamOnlyBranch, ["properties", "code"]).enum = [streamMismatchCode];
partitionedItems.oneOf = [frameOnlyBranch, streamOnlyBranch, structuredClone(fieldBranch)];
for (const representation of ["direct", "referenced"] as const) {
  const positive = structuredClone(partitionedWarnings);
  if (representation === "referenced") {
    positive.components.schemas.PartitionedWarningUnionAlias = structuredClone(
      controlSchemaAt(positive, warningUnionPath),
    );
    alter(positive, warningUnionPath, { $ref: "#/components/schemas/PartitionedWarningUnionAlias" });
  }
  assertBackendSpec(positive);
}

/** Prove the misplaced code requires an invalid field while the valid code-only DTO fails, before counting refusal. */
const validFrameMismatch = { code: frameMismatchCode };
const invalidFrameMismatch = { code: frameMismatchCode, field: "seekTable" };
const originalWarningUnion = controlSchemaAt(spec, warningUnionPath);
assert.ok(exampleMatches(spec, originalWarningUnion, validFrameMismatch));
assert.ok(!exampleMatches(spec, originalWarningUnion, invalidFrameMismatch));
for (const representation of ["direct", "referenced"] as const) {
  const invalid = structuredClone(spec);
  controlSchemaAt(invalid, [...warningUnionPath, "oneOf", "0", "properties", "code"]).enum = [streamMismatchCode];
  controlSchemaAt(invalid, [...warningUnionPath, "oneOf", "1", "properties", "code"]).enum = [
    frameMismatchCode,
    optionalFieldCode,
  ];
  assert.deepEqual(
    controlSchemaAt(invalid, [...samplePath, "examples", "detailedCount", "value", "analysis"]).warnings,
    [],
  );
  if (representation === "referenced") {
    invalid.components.schemas.MisgroupedWarningUnionAlias = structuredClone(
      controlSchemaAt(invalid, warningUnionPath),
    );
    alter(invalid, warningUnionPath, { $ref: "#/components/schemas/MisgroupedWarningUnionAlias" });
  }
  const union = controlSchemaAt(invalid, warningUnionPath);
  assert.ok(!exampleMatches(invalid, union, validFrameMismatch));
  assert.ok(exampleMatches(invalid, union, invalidFrameMismatch));
  taggedDomainRejected(`${representation} misgrouped mismatch code requires field`, () => assertBackendSpec(invalid));
}

/** Frozen stereo recipes provide valid whole-Xing witnesses for both markers with a selected 100-entry seek table. */
const presentLiteralExamples = structuredClone(taggedExamples);
const wholeXingPath = [...taggedAnalysisPath, "xing"];
const presentLiteralExampleMap = controlSchemaAt(presentLiteralExamples, [...samplePath, "examples"]);
for (const [id, marker] of [
  ["Xing-stereo-plain", "Xing"],
  ["Info-stereo-plain", "Info"],
] as const) {
  const recipe = recipes.find((entry) => entry.id === id);
  assert.ok(recipe?.expected);
  const xing = recipe.expected.analysis.xing;
  assert.ok(xing.status === "present");
  assert.equal(xing.marker, marker);
  assert.equal(xing.flags, 15);
  assert.equal(xing.seekTableEntryCount, 100);
  assert.equal(xing.frameOffsetBytes, 0);
  assert.equal(xing.frameLengthBytes, 384);
  assert.equal(xing.markerOffsetBytes, 36);
  assert.ok(exampleMatches(presentLiteralExamples, controlSchemaAt(presentLiteralExamples, wholeXingPath), xing));
  presentLiteralExampleMap[`ownedPresent${marker}`] = {
    summary: "Independent complete carrier with all selected optional fields.",
    value: structuredClone(recipe.expected),
  };
}
assertBackendSpec(presentLiteralExamples);

/** A valid absent example isolates contradictory present literal types from incidental success-example coverage. */
for (const [field, wrongType, literals] of [
  ["status", "integer", ["present"]],
  ["marker", "integer", ["Info", "Xing"]],
  ["seekTableEntryCount", "string", [100]],
] as const) {
  const path = [...presentPath, field];
  const baseline = controlSchemaAt(presentUnexercised, path);
  assert.equal(baseline.type, field === "seekTableEntryCount" ? "integer" : "string");
  assert.ok(Array.isArray(baseline.enum));
  assert.deepEqual([...baseline.enum].sort(), [...literals].sort());
  for (const literal of literals) assert.ok(exampleMatches(presentUnexercised, baseline, literal));
  for (const representation of ["direct", "referenced"] as const) {
    const invalid = structuredClone(presentUnexercised);
    const target = controlSchemaAt(invalid, path);
    target.type = wrongType;
    if (representation === "referenced") {
      invalid.components.schemas.DamagedPresentLiteralAlias = structuredClone(target);
      alter(invalid, path, { $ref: "#/components/schemas/DamagedPresentLiteralAlias" });
    }
    for (const literal of literals) assert.ok(!exampleMatches(invalid, controlSchemaAt(invalid, path), literal));
    taggedDomainRejected(`${representation} present ${field} contradictory ${wrongType} type`, () =>
      assertBackendSpec(invalid),
    );
  }
}

/** Required health status remains representable under valid string constraints, never contradictory composition. */
const healthObjectPath = [...schemaPath, "Health"];
const healthStatusPath = [...healthObjectPath, "properties", "status"];
const healthStatusBaseline = controlSchemaAt(spec, healthStatusPath);
assert.equal(healthStatusBaseline.type, "string");
assert.deepEqual(healthStatusBaseline.enum, ["ok"]);
assert.ok(exampleMatches(spec, controlSchemaAt(spec, healthObjectPath), { status: "ok" }));
for (const representation of ["direct", "referenced"] as const) {
  const positive = structuredClone(spec);
  const constrained = controlSchemaAt(positive, healthStatusPath);
  constrained.allOf = [{ type: "string", minLength: 2, maxLength: 2 }];
  if (representation === "referenced") {
    positive.components.schemas.ConstrainedHealthStatusAlias = structuredClone(constrained);
    alter(positive, healthStatusPath, { $ref: "#/components/schemas/ConstrainedHealthStatusAlias" });
  }
  assert.ok(exampleMatches(positive, controlSchemaAt(positive, healthObjectPath), { status: "ok" }));
  assertBackendSpec(positive);

  const invalid = structuredClone(spec);
  const contradictory = controlSchemaAt(invalid, healthStatusPath);
  assert.equal(contradictory.type, "string");
  assert.deepEqual(contradictory.enum, ["ok"]);
  contradictory.allOf = [{ type: "integer" }];
  if (representation === "referenced") {
    invalid.components.schemas.ContradictoryHealthStatusAlias = structuredClone(contradictory);
    alter(invalid, healthStatusPath, { $ref: "#/components/schemas/ContradictoryHealthStatusAlias" });
  }
  assert.ok(!exampleMatches(invalid, controlSchemaAt(invalid, healthObjectPath), { status: "ok" }));
  taggedDomainRejected(`${representation} health status contradictory integer composition`, () =>
    assertBackendSpec(invalid),
  );
}
const taggedDomainFailures = taggedDomainResults.filter((entry) => entry.status === "missing-refusal");
if (taggedDomainFailures.length) console.error("TAGGED_OBJECT_DOMAINS", JSON.stringify(taggedDomainResults));
assert.deepEqual(taggedDomainFailures, [], "TAGGED_OBJECT_DOMAINS missing semantic refusals");

/** The exclusion domain must admit both 0 and 1, independently of which value a success example happens to exercise. */
const correction9ExclusionPath = [
  ...schemaPath,
  "FrameDetail",
  "properties",
  "analysis",
  "properties",
  "excludedMetadataFrameCount",
];
const correction9DetailPath = [...schemaPath, "FrameDetail"];
const correction9Baseline = controlSchemaAt(spec, correction9ExclusionPath);
assert.equal(correction9Baseline.type, "integer");
assert.deepEqual(correction9Baseline.enum, [0, 1]);
for (const value of [0, 1]) assert.ok(exampleMatches(spec, correction9Baseline, value));

/** Enum without redundant bounds, exact integer bounds, contained aliases and compatible composition preserve both DTOs. */
for (const [name, schema] of [
  ["literal enum", { type: "integer", enum: [0, 1] }],
  ["bounded range", { type: "integer", minimum: 0, maximum: 1 }],
  ["bounded composition", { type: "integer", enum: [0, 1], allOf: [{ type: "integer", minimum: 0, maximum: 1 }] }],
] as const)
  for (const representation of ["direct", "referenced"] as const) {
    const positive = structuredClone(taggedExamples);
    if (representation === "direct") alter(positive, correction9ExclusionPath, structuredClone(schema));
    else {
      positive.components.schemas.CompatibleExclusionAlias = structuredClone(schema);
      alter(positive, correction9ExclusionPath, { $ref: "#/components/schemas/CompatibleExclusionAlias" });
    }
    const scalar = controlSchemaAt(positive, correction9ExclusionPath);
    for (const value of [0, 1])
      assert.ok(exampleMatches(positive, scalar, value), `${name} ${representation} ${value}`);
    for (const dto of [absentDetail(9), encodedVbrDetail])
      assert.ok(exampleMatches(positive, controlSchemaAt(positive, correction9DetailPath), dto));
    assertBackendSpec(positive);
  }

/** Collect every missing exclusion refusal; fixture and semantic-damage preconditions stay outside counted checks. */
const correction9Results: { name: string; status: "rejected" | "missing-refusal"; message?: string }[] = [];
function correction9Rejected(name: string, action: () => void): void {
  try {
    rejected(name, action);
    correction9Results.push({ name, status: "rejected" });
  } catch (error) {
    if (!(error instanceof assert.AssertionError)) throw error;
    correction9Results.push({ name, status: "missing-refusal", message: error.message });
  }
}
for (const refusedValue of [0, 1] as const)
  for (const constraint of ["bound", "allOf"] as const)
    for (const representation of ["direct", "referenced"] as const) {
      // Keep a valid example with the other value, so incidental example rejection cannot mask this domain omission.
      const invalid = structuredClone(refusedValue === 0 ? spec : presentUnexercised);
      const target = controlSchemaAt(invalid, correction9ExclusionPath);
      assert.equal(target.type, "integer");
      assert.deepEqual(target.enum, [0, 1]);
      const boundName = refusedValue === 0 ? "minimum" : "maximum";
      const retainedValue = refusedValue === 0 ? 1 : 0;
      if (constraint === "bound") target[boundName] = retainedValue;
      else target.allOf = [{ type: "integer", [boundName]: retainedValue }];
      if (representation === "referenced") {
        invalid.components.schemas.RestrictiveExclusionAlias = structuredClone(target);
        alter(invalid, correction9ExclusionPath, { $ref: "#/components/schemas/RestrictiveExclusionAlias" });
      }
      const scalar = controlSchemaAt(invalid, correction9ExclusionPath);
      assert.ok(!exampleMatches(invalid, scalar, refusedValue));
      assert.ok(exampleMatches(invalid, scalar, retainedValue));
      const exampleValue = controlSchemaAt(invalid, [...samplePath, "examples", "detailedCount", "value"]);
      assert.equal(
        controlSchemaAt(invalid, [...samplePath, "examples", "detailedCount", "value", "analysis"])
          .excludedMetadataFrameCount,
        retainedValue,
      );
      assert.ok(exampleMatches(invalid, controlSchemaAt(invalid, correction9DetailPath), exampleValue));
      correction9Rejected(`${representation} exclusion rejects ${refusedValue} through ${constraint}`, () =>
        assertBackendSpec(invalid),
      );
    }
const correction9Failures = correction9Results.filter((entry) => entry.status === "missing-refusal");
if (correction9Failures.length) console.error("EXCLUSION_DOMAIN", JSON.stringify(correction9Results));
assert.deepEqual(correction9Failures, [], "EXCLUSION_DOMAIN missing semantic refusals");

/**
 * OAS 3.0.3 exclusive numeric limits remove equality when the respective boolean flag is true.
 * Primary semantics: https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.2
 * These fixed endpoint controls retain valid opposite-value DTO examples; no general schema vocabulary is added.
 */
const correction10Results: { name: string; status: "rejected" | "missing-refusal"; message?: string }[] = [];
function correction10Rejected(name: string, action: () => void): void {
  try {
    rejected(name, action);
    correction10Results.push({ name, status: "rejected" });
  } catch (error) {
    if (!(error instanceof assert.AssertionError)) throw error;
    correction10Results.push({ name, status: "missing-refusal", message: error.message });
  }
}

/** Both numeric matcher branches keep inclusive endpoints and valid values beyond an exclusive endpoint. */
for (const type of ["integer", "number"] as const) {
  const inclusive = { type, minimum: 0, maximum: 1, exclusiveMinimum: false, exclusiveMaximum: false };
  const outside = { type, minimum: -1, maximum: 2, exclusiveMinimum: true, exclusiveMaximum: true };
  for (const value of [0, 1]) {
    assert.ok(exampleMatches(spec, inclusive, value));
    assert.ok(exampleMatches(spec, outside, value));
  }
  const lower = { type, minimum: 0, exclusiveMinimum: true };
  const upper = { type, maximum: 1, exclusiveMaximum: true };
  assert.ok(exampleMatches(spec, lower, 1));
  assert.ok(exampleMatches(spec, upper, 0));
  if (type === "number") {
    assert.ok(exampleMatches(spec, lower, 0.5));
    assert.ok(exampleMatches(spec, upper, 0.5));
  }
  correction10Rejected(`matcher ${type} exclusive lower endpoint 0`, () => assert.ok(exampleMatches(spec, lower, 0)));
  correction10Rejected(`matcher ${type} exclusive upper endpoint 1`, () => assert.ok(exampleMatches(spec, upper, 1)));
}

/** Valid false flags and exclusive limits outside the literal domain preserve both exclusion DTOs and local aliases. */
for (const [name, limits] of [
  ["inclusive false", { minimum: 0, maximum: 1, exclusiveMinimum: false, exclusiveMaximum: false }],
  ["exclusive outside", { minimum: -1, maximum: 2, exclusiveMinimum: true, exclusiveMaximum: true }],
] as const)
  for (const placement of ["direct", "allOf"] as const)
    for (const representation of ["direct", "referenced"] as const) {
      const positive = structuredClone(taggedExamples);
      const scalar: Record<string, unknown> = { type: "integer", enum: [0, 1] };
      if (placement === "direct") Object.assign(scalar, limits);
      else scalar.allOf = [{ type: "integer", ...limits }];
      if (representation === "direct") alter(positive, correction9ExclusionPath, scalar);
      else {
        positive.components.schemas.CompatibleExclusiveExclusionAlias = scalar;
        alter(positive, correction9ExclusionPath, { $ref: "#/components/schemas/CompatibleExclusiveExclusionAlias" });
      }
      const schema = controlSchemaAt(positive, correction9ExclusionPath);
      for (const value of [0, 1])
        assert.ok(exampleMatches(positive, schema, value), `${name} ${placement} ${representation}`);
      for (const dto of [absentDetail(9), encodedVbrDetail])
        assert.ok(exampleMatches(positive, controlSchemaAt(positive, correction9DetailPath), dto));
      assertBackendSpec(positive);
    }

/** Exclude exactly the required endpoint while keeping the reported opposite-value example valid in every shape. */
for (const refusedValue of [0, 1] as const)
  for (const placement of ["direct", "allOf"] as const)
    for (const representation of ["direct", "referenced"] as const) {
      const invalid = structuredClone(refusedValue === 0 ? spec : presentUnexercised);
      const target = controlSchemaAt(invalid, correction9ExclusionPath);
      assert.equal(target.type, "integer");
      assert.deepEqual(target.enum, [0, 1]);
      const boundName = refusedValue === 0 ? "minimum" : "maximum";
      const exclusiveName = refusedValue === 0 ? "exclusiveMinimum" : "exclusiveMaximum";
      const retainedValue = refusedValue === 0 ? 1 : 0;
      if (placement === "direct") {
        target[boundName] = refusedValue;
        target[exclusiveName] = true;
      } else target.allOf = [{ type: "integer", [boundName]: refusedValue, [exclusiveName]: true }];
      if (representation === "referenced") {
        invalid.components.schemas.RestrictiveExclusiveExclusionAlias = structuredClone(target);
        alter(invalid, correction9ExclusionPath, { $ref: "#/components/schemas/RestrictiveExclusiveExclusionAlias" });
      }
      assert.ok(exampleMatches(invalid, controlSchemaAt(invalid, correction9ExclusionPath), retainedValue));
      const exampleValue = controlSchemaAt(invalid, [...samplePath, "examples", "detailedCount", "value"]);
      assert.equal(
        controlSchemaAt(invalid, [...samplePath, "examples", "detailedCount", "value", "analysis"])
          .excludedMetadataFrameCount,
        retainedValue,
      );
      assert.ok(exampleMatches(invalid, controlSchemaAt(invalid, correction9DetailPath), exampleValue));
      const side = refusedValue === 0 ? "lower" : "upper";
      correction10Rejected(`schema ${placement}/${representation} exclusive ${side} endpoint ${refusedValue}`, () =>
        assertBackendSpec(invalid),
      );
    }
const correction10Failures = correction10Results.filter((entry) => entry.status === "missing-refusal");
if (correction10Failures.length) console.error("EXCLUSIVE_ENDPOINTS", JSON.stringify(correction10Results));
assert.deepEqual(correction10Failures, [], "EXCLUSIVE_ENDPOINTS missing semantic refusals");

/** Optional uint32 declarations and stored quality must admit 0 and 4294967295 through their effective schemas. */
const correction11Uint32Maximum = 4_294_967_295;
const correction11Fields = ["declaredAudioFrameCount", "declaredMpegStreamByteCount", "qualityValue"] as const;
const correction11TamperedRecipe = recipes.find((entry) => entry.id === "tampered-count");
const correction11ZeroRecipe = recipes.find((entry) => entry.id === "zero-declaration");
assert.ok(correction11TamperedRecipe?.expected);
assert.ok(correction11ZeroRecipe?.expected);
const correction11TamperedXing = correction11TamperedRecipe.expected.analysis.xing;
const correction11ZeroXing = correction11ZeroRecipe.expected.analysis.xing;
assert.ok(correction11TamperedXing.status === "present");
assert.ok(correction11ZeroXing.status === "present");
assert.equal(correction11TamperedXing.declaredAudioFrameCount, correction11Uint32Maximum);
assert.equal(correction11ZeroXing.declaredAudioFrameCount, 0);
for (const field of correction11Fields) {
  const baseline = controlSchemaAt(spec, [...presentPath, field]);
  assert.equal(baseline.type, "integer");
  assert.equal(baseline.minimum, 0);
  assert.equal(baseline.maximum, correction11Uint32Maximum);
  for (const value of [0, 1, correction11Uint32Maximum]) assert.ok(exampleMatches(spec, baseline, value));
}

/** Explicit inclusive limits preserve both endpoints, present/absent DTOs, local aliases and allOf intersections. */
for (const field of correction11Fields)
  for (const placement of ["direct", "allOf"] as const)
    for (const representation of ["direct", "referenced"] as const) {
      const positive = structuredClone(taggedExamples);
      const path = [...presentPath, field];
      const target = controlSchemaAt(positive, path);
      const limits = {
        type: "integer",
        minimum: 0,
        maximum: correction11Uint32Maximum,
        exclusiveMinimum: false,
        exclusiveMaximum: false,
      };
      if (placement === "direct") Object.assign(target, limits);
      else target.allOf = [limits];
      if (representation === "referenced") {
        positive.components.schemas.InclusiveUint32EndpointAlias = structuredClone(target);
        alter(positive, path, { $ref: "#/components/schemas/InclusiveUint32EndpointAlias" });
      }
      const scalar = controlSchemaAt(positive, path);
      for (const value of [0, correction11Uint32Maximum])
        assert.ok(
          exampleMatches(positive, scalar, value),
          `${field} ${placement}/${representation} inclusive ${value}`,
        );
      for (const dto of [absentDetail(9), encodedVbrDetail])
        assert.ok(exampleMatches(positive, controlSchemaAt(positive, correction9DetailPath), dto));
      assertBackendSpec(positive);
    }

/** Collect every missing uint32 refusal; setup and endpoint-damage checks cannot satisfy the tested predicate. */
const correction11Results: { name: string; status: "rejected" | "missing-refusal"; message?: string }[] = [];
function correction11Rejected(name: string, action: () => void): void {
  try {
    rejected(name, action);
    correction11Results.push({ name, status: "rejected" });
  } catch (error) {
    if (!(error instanceof assert.AssertionError)) throw error;
    correction11Results.push({ name, status: "missing-refusal", message: error.message });
  }
}

/** Keep a valid absent example and interior scalar witness while excluding exactly one required uint32 endpoint. */
for (const field of correction11Fields)
  for (const refusedValue of [0, correction11Uint32Maximum])
    for (const placement of ["direct", "allOf"] as const)
      for (const representation of ["direct", "referenced"] as const) {
        const invalid = structuredClone(presentUnexercised);
        const path = [...presentPath, field];
        const target = controlSchemaAt(invalid, path);
        const boundName = refusedValue === 0 ? "minimum" : "maximum";
        const exclusiveName = refusedValue === 0 ? "exclusiveMinimum" : "exclusiveMaximum";
        const otherEndpoint = refusedValue === 0 ? correction11Uint32Maximum : 0;
        assert.equal(target.type, "integer");
        assert.equal(target.minimum, 0);
        assert.equal(target.maximum, correction11Uint32Maximum);
        if (placement === "direct") target[exclusiveName] = true;
        else target.allOf = [{ type: "integer", [boundName]: refusedValue, [exclusiveName]: true }];
        if (representation === "referenced") {
          invalid.components.schemas.RestrictiveUint32EndpointAlias = structuredClone(target);
          alter(invalid, path, { $ref: "#/components/schemas/RestrictiveUint32EndpointAlias" });
        }
        const scalar = controlSchemaAt(invalid, path);
        assert.ok(!exampleMatches(invalid, scalar, refusedValue));
        for (const value of [1, otherEndpoint]) assert.ok(exampleMatches(invalid, scalar, value));
        const exampleValue = controlSchemaAt(invalid, [...samplePath, "examples", "detailedCount", "value"]);
        assert.deepEqual(exampleValue, absentDetail(9));
        assert.ok(exampleMatches(invalid, controlSchemaAt(invalid, correction9DetailPath), exampleValue));
        correction11Rejected(`${field} ${placement}/${representation} exclusive endpoint ${refusedValue}`, () =>
          assertBackendSpec(invalid),
        );
      }
const correction11Failures = correction11Results.filter((entry) => entry.status === "missing-refusal");
if (correction11Failures.length) console.error("UINT32_ENDPOINTS", JSON.stringify(correction11Results));
assert.deepEqual(correction11Failures, [], "UINT32_ENDPOINTS missing semantic refusals");

/** Supported flags and reachable frame spans must fit effective schemas, even when named examples omit those values. */
const correction12FlagValues = Array.from({ length: 16 }, (_, value) => value);
const correction12UploadMaximum = 20_971_520;
const correction12FrameMinimum = 96;
const correction12FrameMaximum = Math.floor((144 * 320_000) / 32_000) + 1;
const correction12FrameOffsetMaximum = correction12UploadMaximum - 2 * correction12FrameMinimum;
const correction12MarkerOffsetMaximum = correction12FrameOffsetMaximum + 36;
assert.equal(correction12FrameMaximum, 1_441);
assert.equal(correction12FrameOffsetMaximum, 20_971_328);
assert.equal(correction12MarkerOffsetMaximum, 20_971_364);
const correction12Domains = [
  ["flags", 0, 15, correction12FlagValues],
  ["frameLengthBytes", correction12FrameMinimum, correction12FrameMaximum, [96, 1_441]],
  ["frameOffsetBytes", 0, correction12FrameOffsetMaximum, [0, 20_971_328]],
  ["markerOffsetBytes", 0, correction12MarkerOffsetMaximum, [20_971_364]],
] as const;
for (const flags of correction12FlagValues) {
  const recipe = recipes.find((entry) => entry.id === `flags-${flags}`);
  assert.ok(recipe?.expected);
  const xing = recipe.expected.analysis.xing;
  assert.ok(xing.status === "present");
  assert.equal(xing.flags, flags);
}
const correction12BoundedSeek = recipes.find((entry) => entry.id === "bounded-seek");
assert.ok(correction12BoundedSeek?.expected);
const correction12BoundedXing = correction12BoundedSeek.expected.analysis.xing;
assert.ok(correction12BoundedXing.status === "present");
assert.equal(correction12BoundedXing.frameLengthBytes, correction12FrameMinimum);

/** Reuse frozen successful responses in both published forms; this adds witnesses rather than new expected outputs. */
for (const recipe of recipes)
  if (recipe.expected)
    for (const dto of [{ frameCount: recipe.expected.frameCount }, recipe.expected])
      assert.ok(exampleMatches(spec, controlSchemaAt(spec, [...samplePath, "schema"]), dto), recipe.id);
for (const [field, minimum, , values] of correction12Domains) {
  const baseline = controlSchemaAt(spec, [...presentPath, field]);
  assert.equal(baseline.type, "integer");
  assert.equal(baseline.minimum, minimum);
  for (const value of values) assert.ok(exampleMatches(spec, baseline, value));
}

/** Exact inclusive maxima and permitted looser byte maxima retain required values through aliases and allOf. */
for (const [field, minimum, maximum, values] of correction12Domains)
  for (const maximumKind of field === "flags" ? ["inclusive"] : ["inclusive", "upload-cap", "safe-integer"])
    for (const placement of ["direct", "allOf"] as const)
      for (const representation of ["direct", "referenced"] as const) {
        const positive = structuredClone(taggedExamples);
        const path = [...presentPath, field];
        const target = controlSchemaAt(positive, path);
        const limits: Record<string, unknown> = {
          type: "integer",
          minimum,
          maximum:
            maximumKind === "inclusive"
              ? maximum
              : maximumKind === "upload-cap"
                ? correction12UploadMaximum
                : Number.MAX_SAFE_INTEGER,
          exclusiveMinimum: false,
          exclusiveMaximum: maximumKind !== "inclusive",
        };
        if (field === "flags") limits.enum = correction12FlagValues;
        if (placement === "direct") Object.assign(target, limits);
        else target.allOf = [limits];
        if (representation === "referenced") {
          positive.components.schemas.CompatibleSupportedScalarAlias = structuredClone(target);
          alter(positive, path, { $ref: "#/components/schemas/CompatibleSupportedScalarAlias" });
        }
        for (const value of values)
          assert.ok(
            exampleMatches(positive, controlSchemaAt(positive, path), value),
            `${field} ${maximumKind} ${placement}/${representation} ${value}`,
          );
        for (const dto of [absentDetail(9), encodedVbrDetail])
          assert.ok(exampleMatches(positive, controlSchemaAt(positive, correction9DetailPath), dto));
        assertBackendSpec(positive);
      }

/** Collect all omitted-domain refusals; matcher damage and valid retained examples remain independent preconditions. */
const correction12Results: { name: string; status: "rejected" | "missing-refusal"; message?: string }[] = [];
function correction12Rejected(name: string, action: () => void): void {
  try {
    rejected(name, action);
    correction12Results.push({ name, status: "rejected" });
  } catch (error) {
    if (!(error instanceof assert.AssertionError)) throw error;
    correction12Results.push({ name, status: "missing-refusal", message: error.message });
  }
}

/** Omit each flags value or one reachable byte endpoint while the valid absent-detail example remains unaffected. */
for (const [field, minimum, maximum, values] of correction12Domains)
  for (const refusedValue of values)
    for (const placement of ["direct", "allOf"] as const)
      for (const representation of ["direct", "referenced"] as const) {
        const invalid = structuredClone(presentUnexercised);
        const path = [...presentPath, field];
        const target = controlSchemaAt(invalid, path);
        const limits: Record<string, unknown> = { type: "integer" };
        if (field === "flags" && refusedValue > 0 && refusedValue < 15)
          limits.enum = correction12FlagValues.filter((value) => value !== refusedValue);
        else {
          const boundName = refusedValue === minimum ? "minimum" : "maximum";
          const exclusiveName = refusedValue === minimum ? "exclusiveMinimum" : "exclusiveMaximum";
          limits[boundName] = refusedValue;
          limits[exclusiveName] = true;
        }
        if (placement === "direct") Object.assign(target, limits);
        else target.allOf = [limits];
        if (representation === "referenced") {
          invalid.components.schemas.RestrictiveSupportedScalarAlias = structuredClone(target);
          alter(invalid, path, { $ref: "#/components/schemas/RestrictiveSupportedScalarAlias" });
        }
        const scalar = controlSchemaAt(invalid, path);
        assert.ok(!exampleMatches(invalid, scalar, refusedValue));
        const retainedValues =
          field === "flags"
            ? correction12FlagValues.filter((value) => value !== refusedValue)
            : [refusedValue === minimum ? maximum : minimum];
        for (const value of retainedValues) assert.ok(exampleMatches(invalid, scalar, value));
        const exampleValue = controlSchemaAt(invalid, [...samplePath, "examples", "detailedCount", "value"]);
        assert.deepEqual(exampleValue, absentDetail(9));
        assert.ok(exampleMatches(invalid, controlSchemaAt(invalid, correction9DetailPath), exampleValue));
        correction12Rejected(`${field} ${placement}/${representation} omits supported value ${refusedValue}`, () =>
          assertBackendSpec(invalid),
        );
      }

/** Frozen audio and physical count-one responses expose restrictive minima masked by the named 6089/6090 examples. */
const correction12AudioOne = recipes.find((entry) => entry.id === "removed-final-frame");
const correction12PhysicalOne = recipes.find((entry) => entry.id === "wrong-position");
assert.ok(correction12AudioOne?.expected);
assert.ok(correction12PhysicalOne?.expected);
assert.equal(correction12AudioOne.expected.frameCount, 1);
assert.equal(correction12PhysicalOne.expected.analysis.physicalFrameCount, 1);
const correction12CountDomains = [
  [
    "default frameCount",
    [...schemaPath, "FrameCount", "properties", "frameCount"],
    { frameCount: correction12AudioOne.expected.frameCount },
    "defaultCount",
  ],
  [
    "detailed frameCount",
    [...schemaPath, "FrameDetail", "properties", "frameCount"],
    correction12AudioOne.expected,
    "detailedCount",
  ],
  [
    "physicalFrameCount",
    [...taggedAnalysisPath, "physicalFrameCount"],
    correction12PhysicalOne.expected,
    "detailedCount",
  ],
] as const;
for (const [name, path, witness, exampleName] of correction12CountDomains)
  for (const placement of ["direct", "allOf"] as const)
    for (const representation of ["direct", "referenced"] as const) {
      const positive = structuredClone(spec);
      const target = controlSchemaAt(positive, path);
      assert.equal(target.type, "integer");
      assert.equal(target.minimum, 1);
      assert.equal(target.maximum, Number.MAX_SAFE_INTEGER);
      const inclusive = { type: "integer", minimum: 1, exclusiveMinimum: false };
      if (placement === "direct") Object.assign(target, inclusive);
      else target.allOf = [inclusive];
      if (representation === "referenced") {
        positive.components.schemas.InclusiveCountOneAlias = structuredClone(target);
        alter(positive, path, { $ref: "#/components/schemas/InclusiveCountOneAlias" });
      }
      assert.ok(exampleMatches(positive, controlSchemaAt(positive, path), 1));
      assert.ok(exampleMatches(positive, controlSchemaAt(positive, [...samplePath, "schema"]), witness));
      assertBackendSpec(positive);

      const invalid = structuredClone(spec);
      const restrictive = controlSchemaAt(invalid, path);
      const exclusive = { type: "integer", minimum: 1, exclusiveMinimum: true };
      if (placement === "direct") Object.assign(restrictive, exclusive);
      else restrictive.allOf = [exclusive];
      if (representation === "referenced") {
        invalid.components.schemas.RestrictiveCountOneAlias = structuredClone(restrictive);
        alter(invalid, path, { $ref: "#/components/schemas/RestrictiveCountOneAlias" });
      }
      assert.ok(!exampleMatches(invalid, controlSchemaAt(invalid, path), 1));
      assert.ok(!exampleMatches(invalid, controlSchemaAt(invalid, [...samplePath, "schema"]), witness));
      const retainedExample = controlSchemaAt(invalid, [...samplePath, "examples", exampleName, "value"]);
      assert.ok(exampleMatches(invalid, controlSchemaAt(invalid, [...samplePath, "schema"]), retainedExample));
      correction12Rejected(`${name} ${placement}/${representation} exclusive minimum 1`, () =>
        assertBackendSpec(invalid),
      );
    }
const correction12Failures = correction12Results.filter((entry) => entry.status === "missing-refusal");
if (correction12Failures.length) console.error("SUPPORTED_NUMERIC_DOMAINS", JSON.stringify(correction12Results));
assert.deepEqual(correction12Failures, [], "SUPPORTED_NUMERIC_DOMAINS missing semantic refusals");

mkdirSync(new URL("../.artifacts/", import.meta.url), { recursive: true });
const report = {
  schemaVersion: 1,
  evidenceKind: "candidate-controls",
  contractRevision: "backend-audio-v1",
  status: "passed",
  structuralRecipes: recipes.length,
  negativeControls,
  productAcceptance: false,
  hostedAcceptance: false,
  audioManifestSha256: createHash("sha256")
    .update(readFileSync(new URL("../fixtures/backend-audio.json", import.meta.url)))
    .digest("hex"),
};
writeFileSync(
  new URL("../.artifacts/backend-audio-controls.json", import.meta.url),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report));
