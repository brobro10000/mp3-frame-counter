/** Independent generated-document business predicates. This is bounded contract validation, not a general OAS tool. */
import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import { errorCatalogue, assertCodedError } from "./backend-audio-errors.mjs";

/** Resolve a contained schema reference against the supplied document; no network or product schema is consulted. */
function resolve(spec, schema) {
  const visited = new Set();
  while (schema?.$ref) {
    const reference = schema.$ref;
    assert.match(reference, /^#\//, "REF_SCOPE");
    assert.ok(!visited.has(reference), "REF_CYCLE");
    visited.add(reference);
    let node = spec;
    for (const part of reference.slice(2).split("/")) {
      const key = part.replace(/~1/g, "/").replace(/~0/g, "~");
      assert.ok(node && Object.hasOwn(node, key), "REF_MISSING");
      node = node[key];
    }
    schema = node;
  }
  return schema;
}

/** Read an explicit finite literal set from enums or equivalent disjoint literal alternatives, without coercion. */
function literals(spec, source) {
  const schema = resolve(spec, source);
  if (Array.isArray(schema?.enum)) return schema.enum;
  const branches = schema?.oneOf ?? schema?.anyOf;
  assert.ok(Array.isArray(branches), "SPEC_SCHEMAS");
  return branches.flatMap((branch) => literals(spec, branch));
}

/** A byte bound must cover every attainable value while remaining a finite safe integer. */
function byteMaximum(schema, attainableMaximum) {
  assert.ok(Number.isSafeInteger(schema.maximum) && schema.maximum >= attainableMaximum, "SPEC_SCHEMAS");
}

/** OAS3 response header names follow HTTP's case-insensitive comparison. */
function responseHeader(response, name) {
  return Object.entries(response.headers ?? {}).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
}

/** Resolve a documented response header schema without accepting mere header-name presence as its semantics. */
function headerSchema(spec, response, name) {
  const header = resolve(spec, responseHeader(response, name));
  assert.ok(header?.schema, "SPEC_HEADERS");
  return resolve(spec, header.schema);
}

/** Interpret the small OAS3 schema subset used by closed DTO examples; return boolean without coercing values. */
export function exampleMatches(spec, source, value) {
  const schema = resolve(spec, source);
  if (!schema || typeof schema !== "object") return false;
  let composed = false;
  for (const keyword of ["oneOf", "anyOf", "allOf"]) {
    if (schema[keyword] === undefined) continue;
    const branches = schema[keyword];
    if (!Array.isArray(branches) || branches.length === 0) return false;
    const matches = branches.filter((item) => exampleMatches(spec, item, value)).length;
    if (keyword === "oneOf" ? matches !== 1 : keyword === "anyOf" ? matches === 0 : matches !== branches.length)
      return false;
    composed = true;
  }
  const finiteEnum = Array.isArray(schema.enum);
  if (schema.enum !== undefined && (!finiteEnum || !schema.enum.some((item) => isDeepStrictEqual(item, value))))
    return false;
  // Enum itself constrains the value; OAS3 does not require a redundant type annotation on literal fields.
  const type = schema.type ?? (finiteEnum ? (Array.isArray(value) ? "array" : typeof value) : undefined);
  if (value === null && schema.type === undefined && finiteEnum) return true;
  if (value === null) return schema.nullable === true;
  if (type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    if ((schema.required ?? []).some((key) => !Object.hasOwn(value, key))) return false;
    if (
      schema.additionalProperties === false &&
      Object.keys(value).some((key) => !Object.hasOwn(schema.properties ?? {}, key))
    )
      return false;
    return Object.entries(value).every(
      ([key, child]) => !schema.properties?.[key] || exampleMatches(spec, schema.properties[key], child),
    );
  }
  if (type === "array")
    return (
      Array.isArray(value) &&
      value.length >= (schema.minItems ?? 0) &&
      (schema.maxItems === undefined || value.length <= schema.maxItems) &&
      (schema.items === undefined || value.every((item) => exampleMatches(spec, schema.items, item)))
    );
  if (type === "integer")
    return (
      Number.isSafeInteger(value) &&
      (schema.minimum === undefined ||
        (schema.exclusiveMinimum === true ? value > schema.minimum : value >= schema.minimum)) &&
      (schema.maximum === undefined ||
        (schema.exclusiveMaximum === true ? value < schema.maximum : value <= schema.maximum))
    );
  if (type === "number")
    return (
      typeof value === "number" &&
      Number.isFinite(value) &&
      (schema.minimum === undefined ||
        (schema.exclusiveMinimum === true ? value > schema.minimum : value >= schema.minimum)) &&
      (schema.maximum === undefined ||
        (schema.exclusiveMaximum === true ? value < schema.maximum : value <= schema.maximum))
    );
  if (type === "boolean") return typeof value === "boolean";
  if (type === "string")
    return (
      typeof value === "string" &&
      value.length >= (schema.minLength ?? 0) &&
      (schema.maxLength === undefined || value.length <= schema.maxLength)
    );
  return composed;
}

/** Require exact default/detail count/closed-object semantics and every independently fixed code/example/status. */
export function assertBackendSpec(spec) {
  const upload = spec.paths?.["/file-upload"]?.post;
  assert.ok(upload, "SPEC_PATHS");
  assert.equal(spec.openapi, "3.0.3", "SPEC_VERSION");
  assert.equal(upload.requestBody?.required, true, "SPEC_PATHS");
  assert.deepEqual(
    Object.keys(upload.requestBody.content).sort(),
    ["application/octet-stream", "audio/mpeg"],
    "SPEC_PATHS",
  );
  for (const media of Object.values(upload.requestBody.content)) {
    const binary = resolve(spec, media.schema);
    assert.equal(binary?.type, "string", "SPEC_PATHS");
    assert.equal(binary?.format, "binary", "SPEC_PATHS");
  }
  assert.equal(upload["x-max-body-bytes"], 20_971_520, "SPEC_PATHS");
  assert.equal(upload["x-active-upload-limit"], 2, "SPEC_PATHS");
  const selector = upload.parameters?.find((parameter) => parameter.in === "query" && parameter.name === "details");
  assert.ok(
    selector &&
      !selector.required &&
      /once|exactly one/i.test(selector.description) &&
      /true/.test(selector.description) &&
      /repeat|duplicate/i.test(selector.description),
    "SPEC_QUERY",
  );
  assert.ok(!Object.keys(spec.paths).some((path) => path.includes("?")), "SPEC_PATHS");
  const success = upload.responses?.["200"]?.content?.["application/json"];
  const schema = resolve(spec, success?.schema);
  const branches = schema?.oneOf ?? schema?.anyOf;
  assert.ok(Array.isArray(branches) && branches.length === 2, "SPEC_SCHEMAS");
  const alternatives = branches.map((item) => resolve(spec, item));
  const simple = alternatives.find((item) => !item.required?.includes("analysis"));
  const detail = alternatives.find((item) => item.required?.includes("analysis"));
  assert.ok(simple && detail, "SPEC_SCHEMAS");
  assert.equal(simple.additionalProperties, false, "SPEC_SCHEMAS");
  assert.deepEqual(Object.keys(simple.properties).sort(), ["frameCount"], "SPEC_SCHEMAS");
  assert.deepEqual(simple.required, ["frameCount"], "SPEC_SCHEMAS");
  for (const item of alternatives) {
    assert.ok(!exampleMatches(spec, item, null), "SPEC_SCHEMAS");
    assert.equal(item.additionalProperties, false, "SPEC_SCHEMAS");
    const count = resolve(spec, item.properties.frameCount);
    assert.equal(count.type, "integer", "SPEC_SCHEMAS");
    assert.ok(!exampleMatches(spec, count, null), "SPEC_SCHEMAS");
    assert.equal(count.minimum, 1, "SPEC_SCHEMAS");
    assert.equal(count.maximum, Number.MAX_SAFE_INTEGER, "SPEC_SCHEMAS");
  }
  assert.deepEqual(Object.keys(detail.properties).sort(), ["analysis", "frameCount"], "SPEC_SCHEMAS");
  assert.deepEqual([...detail.required].sort(), ["analysis", "frameCount"], "SPEC_SCHEMAS");
  const analysis = resolve(spec, detail.properties.analysis);
  assert.ok(!exampleMatches(spec, analysis, null), "SPEC_SCHEMAS");
  assert.equal(analysis.additionalProperties, false, "SPEC_SCHEMAS");
  assert.deepEqual(
    [...analysis.required].sort(),
    ["excludedMetadataFrameCount", "physicalFrameCount", "warnings", "xing"],
    "SPEC_SCHEMAS",
  );
  assert.deepEqual(
    Object.keys(analysis.properties).sort(),
    ["excludedMetadataFrameCount", "physicalFrameCount", "warnings", "xing"],
    "SPEC_SCHEMAS",
  );
  assert.equal(resolve(spec, analysis.properties.warnings).maxItems, 3, "SPEC_SCHEMAS");
  const physical = resolve(spec, analysis.properties.physicalFrameCount);
  assert.equal(physical.type, "integer", "SPEC_SCHEMAS");
  assert.ok(!exampleMatches(spec, physical, null), "SPEC_SCHEMAS");
  assert.equal(physical.minimum, 1, "SPEC_SCHEMAS");
  assert.equal(physical.maximum, Number.MAX_SAFE_INTEGER, "SPEC_SCHEMAS");
  const exclusion = resolve(spec, analysis.properties.excludedMetadataFrameCount);
  if (!(exclusion.type === "integer" && exclusion.minimum === 0 && exclusion.maximum === 1))
    assert.deepEqual(literals(spec, exclusion).sort(), [0, 1], "SPEC_SCHEMAS");
  assert.ok(
    exampleMatches(spec, exclusion, 0) && exampleMatches(spec, exclusion, 1) && !exampleMatches(spec, exclusion, null),
    "SPEC_SCHEMAS",
  );
  const xing = resolve(spec, analysis.properties.xing);
  const xingBranches = (xing.oneOf ?? xing.anyOf)?.map((branch) => resolve(spec, branch));
  assert.equal(xingBranches?.length, 2, "SPEC_SCHEMAS");
  for (const branch of xingBranches) assert.equal(branch.type, "object", "SPEC_SCHEMAS");
  const present = xingBranches.find((branch) => literals(spec, branch.properties.status).includes("present"));
  const absent = xingBranches.find((branch) => literals(spec, branch.properties.status).includes("absent"));
  assert.ok(present && absent, "SPEC_SCHEMAS");
  assert.ok(!exampleMatches(spec, present, null), "SPEC_SCHEMAS");
  assert.ok(!exampleMatches(spec, absent, null), "SPEC_SCHEMAS");
  assert.equal(present.additionalProperties, false, "SPEC_SCHEMAS");
  assert.equal(absent.additionalProperties, false, "SPEC_SCHEMAS");
  assert.deepEqual(Object.keys(absent.properties), ["status"], "SPEC_SCHEMAS");
  assert.deepEqual(absent.required, ["status"], "SPEC_SCHEMAS");
  assert.deepEqual(
    [...present.required].sort(),
    ["flags", "frameLengthBytes", "frameOffsetBytes", "marker", "markerOffsetBytes", "status"],
    "SPEC_SCHEMAS",
  );
  assert.deepEqual(
    Object.keys(present.properties).sort(),
    [
      "declaredAudioFrameCount",
      "declaredMpegStreamByteCount",
      "flags",
      "frameLengthBytes",
      "frameOffsetBytes",
      "marker",
      "markerOffsetBytes",
      "qualityValue",
      "seekTableEntryCount",
      "status",
    ],
    "SPEC_SCHEMAS",
  );
  assert.deepEqual(literals(spec, present.properties.status), ["present"], "SPEC_SCHEMAS");
  assert.deepEqual(literals(spec, absent.properties.status), ["absent"], "SPEC_SCHEMAS");
  assert.ok(exampleMatches(spec, xing, { status: "absent" }), "SPEC_SCHEMAS");
  assert.deepEqual(literals(spec, present.properties.marker).sort(), ["Info", "Xing"], "SPEC_SCHEMAS");
  assert.deepEqual(literals(spec, present.properties.seekTableEntryCount), [100], "SPEC_SCHEMAS");
  for (const marker of ["Info", "Xing"])
    assert.ok(
      exampleMatches(spec, xing, {
        status: "present",
        marker,
        frameOffsetBytes: 0,
        frameLengthBytes: 182,
        markerOffsetBytes: 21,
        flags: 15,
        declaredAudioFrameCount: 15,
        declaredMpegStreamByteCount: 2160,
        seekTableEntryCount: 100,
        qualityValue: 0,
      }),
      "SPEC_SCHEMAS",
    );
  // A successful present carrier leaves at least one audio frame: two minimum 96-byte spans. The largest marker
  // offset is 36. Leading ID3 padding can fill the remaining upload bytes, so these upper endpoints are attainable.
  for (const [field, maximum] of [
    ["frameOffsetBytes", 20_971_520 - 2 * 96],
    ["markerOffsetBytes", 20_971_520 - 2 * 96 + 36],
  ]) {
    const scalar = resolve(spec, present.properties[field]);
    assert.equal(scalar.type, "integer", "SPEC_SCHEMAS");
    assert.ok(!exampleMatches(spec, scalar, null), "SPEC_SCHEMAS");
    assert.equal(scalar.minimum, 0, "SPEC_SCHEMAS");
    byteMaximum(scalar, maximum);
  }
  const length = resolve(spec, present.properties.frameLengthBytes);
  assert.equal(length.type, "integer", "SPEC_SCHEMAS");
  assert.ok(!exampleMatches(spec, length, null), "SPEC_SCHEMAS");
  assert.ok(Number.isSafeInteger(length.minimum) && length.minimum >= 1 && length.minimum <= 96, "SPEC_SCHEMAS");
  // MPEG-1 Layer III's largest complete span is floor(144 * 320000 / 32000) + one padding byte.
  byteMaximum(length, 1_441);
  const flags = resolve(spec, present.properties.flags);
  assert.equal(flags.type, "integer", "SPEC_SCHEMAS");
  assert.ok(!exampleMatches(spec, flags, null), "SPEC_SCHEMAS");
  assert.equal(flags.minimum, 0, "SPEC_SCHEMAS");
  assert.ok(Number.isSafeInteger(flags.maximum) && flags.maximum >= 15 && flags.maximum <= 4294967295, "SPEC_SCHEMAS");
  for (const field of ["declaredAudioFrameCount", "declaredMpegStreamByteCount", "qualityValue"]) {
    const scalar = resolve(spec, present.properties[field]);
    for (const [key, expected] of Object.entries({ type: "integer", minimum: 0, maximum: 4294967295 }))
      assert.equal(scalar[key], expected, "SPEC_SCHEMAS");
    assert.ok(!exampleMatches(spec, scalar, null), "SPEC_SCHEMAS");
  }
  const warnings = resolve(spec, analysis.properties.warnings);
  assert.equal(warnings.type, "array", "SPEC_SCHEMAS");
  assert.ok(!exampleMatches(spec, warnings, null), "SPEC_SCHEMAS");
  const warningItems = resolve(spec, warnings.items);
  const warningBranches = (warningItems.oneOf ?? warningItems.anyOf)?.map((branch) => resolve(spec, branch));
  assert.ok(warningBranches?.length >= 2, "SPEC_SCHEMAS");
  const warningCodes = [];
  for (const branch of warningBranches) {
    assert.equal(branch.type, "object", "SPEC_SCHEMAS");
    assert.ok(!exampleMatches(spec, branch, null), "SPEC_SCHEMAS");
    assert.equal(branch.additionalProperties, false, "SPEC_SCHEMAS");
    const codes = literals(spec, branch.properties.code);
    warningCodes.push(...codes);
    const optional = codes.includes("XING_OPTIONAL_FIELD_TRUNCATED");
    assert.deepEqual([...branch.required].sort(), optional ? ["code", "field"] : ["code"], "SPEC_SCHEMAS");
    assert.deepEqual(Object.keys(branch.properties).sort(), optional ? ["code", "field"] : ["code"], "SPEC_SCHEMAS");
    if (optional)
      assert.deepEqual(
        literals(spec, branch.properties.field).sort(),
        ["declaredAudioFrameCount", "declaredMpegStreamByteCount", "qualityValue", "seekTable"],
        "SPEC_SCHEMAS",
      );
    for (const code of codes) {
      const truncated = code === "XING_OPTIONAL_FIELD_TRUNCATED";
      for (const field of truncated ? literals(spec, branch.properties.field) : [undefined])
        assert.ok(exampleMatches(spec, warningItems, truncated ? { code, field } : { code }), "SPEC_SCHEMAS");
    }
  }
  assert.deepEqual(
    warningCodes.sort(),
    ["XING_DECLARED_FRAME_COUNT_MISMATCH", "XING_DECLARED_STREAM_BYTES_MISMATCH", "XING_OPTIONAL_FIELD_TRUNCATED"],
    "SPEC_SCHEMAS",
  );
  assert.ok(spec.paths["/healthz"]?.get, "SPEC_PATHS");
  for (const [path, methods] of Object.entries(spec.paths))
    if (/^\/healthz?$/.test(path)) {
      const health = resolve(spec, methods.get.responses["200"].content["application/json"].schema);
      assert.equal(health.type, "object", "SPEC_SCHEMAS");
      assert.ok(!exampleMatches(spec, health, null), "SPEC_SCHEMAS");
      assert.equal(health.additionalProperties, false, "SPEC_SCHEMAS");
      assert.deepEqual(health.required, ["status"], "SPEC_SCHEMAS");
      assert.deepEqual(Object.keys(health.properties), ["status"], "SPEC_SCHEMAS");
      const status = resolve(spec, health.properties.status);
      assert.ok(status.type === undefined || status.type === "string", "SPEC_SCHEMAS");
      assert.deepEqual(literals(spec, health.properties.status), ["ok"], "SPEC_SCHEMAS");
      assert.ok(exampleMatches(spec, health, { status: "ok" }), "SPEC_SCHEMAS");
    }

  const examples = Object.values(success.examples ?? {});
  assert.ok(
    examples.some((example) => Object.keys(example.value ?? {}).length === 1 && example.value.frameCount === 6089),
    "SPEC_EXAMPLES",
  );
  const detailed = examples.find((example) => example.value?.analysis);
  assert.ok(detailed, "SPEC_EXAMPLES");
  for (const example of examples) assert.ok(exampleMatches(spec, success.schema, example.value), "SPEC_EXAMPLES");
  assert.equal(
    detailed.value.analysis.physicalFrameCount,
    detailed.value.frameCount + detailed.value.analysis.excludedMetadataFrameCount,
    "SPEC_EXAMPLES",
  );
  const expectedStatuses = ["400", "408", "413", "415", "417", "500", "502", "503", "504"];
  /** Check named coded examples from one real operation, without pretending routing failures occur in a handler. */
  function responseExamples(response, status) {
    assert.ok(response, "SPEC_PATHS");
    const media = response.content?.["application/json"];
    assert.ok(media, "SPEC_SCHEMAS");
    const errorSchema = resolve(spec, media.schema);
    assert.ok(!exampleMatches(spec, errorSchema, null), "SPEC_SCHEMAS");
    assert.ok(!exampleMatches(spec, errorSchema.properties.error, null), "SPEC_SCHEMAS");
    assert.equal(errorSchema.additionalProperties, false, "SPEC_SCHEMAS");
    assert.deepEqual([...errorSchema.required].sort(), ["code", "error"], "SPEC_SCHEMAS");
    assert.deepEqual(Object.keys(errorSchema.properties).sort(), ["code", "error"], "SPEC_SCHEMAS");
    assert.deepEqual(
      literals(spec, errorSchema.properties.code).sort(),
      Object.keys(errorCatalogue).sort(),
      "SPEC_SCHEMAS",
    );
    const seen = new Set();
    for (const example of Object.values(media.examples ?? {})) {
      assert.ok(typeof example.summary === "string" && example.summary.length > 0, "SPEC_EXAMPLES");
      assertCodedError(example.value, Number(status));
      assert.ok(exampleMatches(spec, media.schema, example.value), "SPEC_EXAMPLES");
      seen.add(example.value.code);
    }
    return seen;
  }
  for (const status of expectedStatuses) {
    const seen = responseExamples(upload.responses[status], status);
    const expectedCodes = Object.entries(errorCatalogue)
      .filter(([, entry]) => String(entry[0]) === status)
      .map(([code]) => code);
    for (const code of expectedCodes) assert.ok(seen.has(code), `SPEC_EXAMPLES ${code}`);
  }
  for (const [status, code] of [
    ["404", "ROUTE_NOT_FOUND"],
    ["405", "METHOD_NOT_ALLOWED"],
  ]) {
    const seen = new Set();
    for (const [path, methods] of Object.entries(spec.paths)) {
      if (!["/file-upload", "/health", "/healthz"].includes(path)) continue;
      for (const [method, operation] of Object.entries(methods)) {
        if (method === "head" || !operation.responses?.[status]) continue;
        for (const value of responseExamples(operation.responses[status], status)) seen.add(value);
      }
    }
    assert.ok(seen.has(code), `SPEC_EXAMPLES ${code}`);
  }
  for (const status of ["502", "504"])
    assert.match(upload.responses[status].description, /ingress|proxy/i, "SPEC_PROXY");
  assert.ok(spec.paths["/file-upload"].head?.responses?.["405"], "SPEC_PATHS");
  const delay = headerSchema(spec, upload.responses["503"], "Retry-After");
  if (delay.enum || delay.oneOf || delay.anyOf) {
    const values = literals(spec, delay);
    assert.ok(
      values.length > 0 &&
        values.every(
          (value) => typeof value === "string" && /^[1-9][0-9]*$/.test(value) && exampleMatches(spec, delay, value),
        ),
      "SPEC_HEADERS",
    );
  } else {
    // Preserve the independent fixture's positive-integer delay pattern as well as finite positive literals.
    assert.equal(delay.type, "string", "SPEC_HEADERS");
    assert.equal(delay.pattern, "^[1-9][0-9]*$", "SPEC_HEADERS");
    assert.ok(exampleMatches(spec, delay, "1"), "SPEC_HEADERS");
  }
  for (const [path, methods] of Object.entries(spec.paths))
    for (const [method, operation] of Object.entries(methods)) {
      if (method === "head")
        for (const response of Object.values(operation.responses ?? {}))
          assert.ok(!Object.hasOwn(response, "content"), "SPEC_PATHS");
      if (operation.responses?.["405"]) {
        const allow = headerSchema(spec, operation.responses["405"], "Allow");
        const expected = path === "/file-upload" ? "POST" : /^\/healthz?$/.test(path) ? "GET" : undefined;
        if (expected) {
          assert.deepEqual(literals(spec, allow), [expected], "SPEC_HEADERS");
          assert.ok(exampleMatches(spec, allow, expected), "SPEC_HEADERS");
        }
      }
      assert.ok(!path.includes("*"), "SPEC_PATHS");
    }
}
