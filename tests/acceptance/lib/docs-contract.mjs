/**
 * Shared external docs contract predicates. Inputs are bounded HTTP bytes/headers and the preserved local OpenAPI
 * fixture; no product source is imported. Used by docs.spec.ts and docs-controls.mjs. Reads the fixture at import,
 * sends only explicitly requested public-origin HTTP(S) traffic, never follows redirects, and rejects any mismatch.
 * @see ../../../docs/testing/contracts/docs-v1.md
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import { parseDocument } from "yaml";

export const DOCS_POLICY =
  "default-src 'none'; script-src 'self'; style-src 'self' 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=' 'sha256-QMIg+bpjm3JdElJ388KYke01izlUW0UoNOeKjpMxdgc='; style-src-attr 'none'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; worker-src 'none'";
export const ROOT_POLICY =
  "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";
export const ORIGINAL_HASH = "dcaf76612bc4a3fbcc923a8966dee2f6146a5f32e5ce1b6f02dd60cbbf89500b";
export const DERIVED_HASH = "21ce5beb19818927f12e2db16e1a332e4f0eac5b8538012b6ecd048585b8cdbf";
export const LOGO_HASH = "1dab4315f8de2177b2b2726b29e84a26314c69cd27d692228947c0058793d5a7";
export const expectedSpec = JSON.parse(readFileSync(new URL("../fixtures/openapi.json", import.meta.url), "utf8"));
export const resources = [
  ["/docs/", "text/html"],
  ["/docs/openapi.yaml", "application/yaml"],
  ["/docs/assets/redoc.js", "application/javascript"],
  ["/docs/assets/init.js", "application/javascript"],
  ["/docs/assets/docs.css", "text/css"],
  ["/docs/assets/redoc-logo-mini.svg", "image/svg+xml"],
];
/** Return lowercase SHA-256 hex for Node crypto-compatible input bytes; no input mutation or I/O. */
export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
/** Require bytes to match an expected SHA-256 hex digest; return nothing or throw ARTIFACT_IDENTITY. */
export function assertArtifact(bytes, expected) {
  same(sha256(bytes), expected, "ARTIFACT_IDENTITY");
}
/** Assert a truthy condition, using code as the failure message; return nothing on success. */
export function requireThat(condition, code) {
  assert.ok(condition, code);
}
/** Assert deep strict equality without mutation, using code as the failure message; return nothing on success. */
export function same(actual, expected, code) {
  assert.deepEqual(actual, expected, code);
}
/** Collect raw header values without combining duplicates; name must already be lowercase. Returns a new array. */
export const headerValues = (headers, name) => headers.filter((h) => h.name.toLowerCase() === name).map((h) => h.value);
/**
 * Normalize a CSP string for the fixed contract comparison without interpreting it as a general CSP validator.
 * Returns a new directive map with sorted values; folds directive names and self/none keywords only. Throws on a
 * duplicate directive, preserving hashes, other token case and repeated values so mismatches remain observable.
 */
export function policyTokens(policy) {
  const result = {};
  for (const item of policy
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean)) {
    const [rawName, ...values] = item.split(/\s+/);
    const name = rawName.toLowerCase();
    requireThat(!Object.hasOwn(result, name), "CSP_DUPLICATE_DIRECTIVE");
    result[name] = values.map((value) => (/^'(?:self|none)'$/i.test(value) ? value.toLowerCase() : value)).sort();
  }
  return result;
}
/**
 * Require one enforced policy, no report-only policy, and exactly one no-store/nosniff/no-referrer header each.
 * @param headers - Raw name/value entries preserving duplicates, as returned by requestDocs or Playwright.
 * @param policy - Expected CSP, defaulting to the docs policy; comparison ignores directive/token order.
 * @param prefix - Failure-message namespace, default DOCS; root callers supply ROOT with ROOT_POLICY.
 * @returns Nothing on success; throws on missing, duplicate or mismatched headers without mutating input.
 */
export function assertHeaders(headers, policy = DOCS_POLICY, prefix = "DOCS") {
  const csp = headerValues(headers, "content-security-policy");
  same(csp.length, 1, prefix + "_CSP_COUNT");
  same(policyTokens(csp[0]), policyTokens(policy), prefix + "_CSP_VALUE");
  same(headerValues(headers, "content-security-policy-report-only"), [], prefix + "_REPORT_ONLY");
  for (const [name, value] of [
    ["cache-control", "no-store"],
    ["x-content-type-options", "nosniff"],
    ["referrer-policy", "no-referrer"],
  ])
    same(headerValues(headers, name), [value], prefix + "_HEADER");
}
/**
 * Require one Content-Type matching expected, case-insensitively, with only an optional UTF-8 charset suffix.
 * response uses raw header entries; expected is a literal media type. Returns nothing or throws a MEDIA assertion.
 */
export function assertMedia(response, expected) {
  const values = headerValues(response.headers, "content-type");
  same(values.length, 1, "MEDIA_COUNT");
  requireThat(
    new RegExp("^" + expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?:;\\s*charset=utf-8)?$", "i").test(values[0]),
    "MEDIA_TYPE",
  );
}
/**
 * Check the expected status and JSON media type, then a closed error object with a nonempty string under 1024 chars.
 * @param response - requestDocs result with raw headers and a Buffer body.
 * @param status - Required HTTP error status.
 * @param head - When true, require an empty body instead of parsing JSON; defaults false.
 * @returns Nothing on success; malformed JSON or any shape/status/media mismatch throws. Input is not mutated.
 */
export function assertError(response, status, head = false) {
  same(response.status, status, "ROUTE_STATUS");
  assertMedia(response, "application/json");
  if (head) same(response.body.length, 0, "HEAD_BODY");
  else {
    const value = JSON.parse(response.body.toString("utf8"));
    same(Object.keys(value), ["error"], "ERROR_SHAPE");
    requireThat(
      typeof value.error === "string" && value.error.length > 0 && value.error.length < 1024,
      "ERROR_MESSAGE",
    );
  }
}
/**
 * Parse 1..262144 UTF-8 bytes using strict YAML 1.2 core rules into a plain object suitable for the bounded predicates.
 * Rejects parser warnings/errors, duplicate/non-string keys, custom tags, multiple documents, nonfinite/non-JSON
 * values, cycles, excessive aliases, depth over 64 or more than 50000 visited nodes. Ordinary shared aliases may remain.
 * Returns the parsed object without external resolution; throws a YAML refusal or parser error, never a partial value.
 */
export function parseYaml(bytes) {
  requireThat(bytes.length > 0 && bytes.length <= 262144, "YAML_SIZE");
  const doc = parseDocument(bytes.toString("utf8"), {
    version: "1.2",
    schema: "core",
    strict: true,
    uniqueKeys: true,
    stringKeys: true,
    merge: false,
    resolveKnownTags: false,
    customTags: [],
    prettyErrors: false,
  });
  same(doc.errors, [], "YAML_ERRORS");
  same(doc.warnings, [], "YAML_WARNINGS");
  same(doc.directives.yaml.version, "1.2", "YAML_VERSION");
  let value;
  try {
    value = doc.toJS({ maxAliasCount: 100 });
  } catch {
    throw Error("YAML_ALIASES");
  }
  const ancestors = new Set();
  let nodes = 0;
  /**
   * Validate one parsed subtree, counting visits and tracking only current ancestors so shared acyclic aliases work.
   * Throws on complexity, type or cycle violations; mutates validation counters, not the parsed object.
   */
  function json(node, depth = 0) {
    requireThat(++nodes <= 50000 && depth <= 64, "YAML_COMPLEXITY");
    if (node === null || ["string", "boolean"].includes(typeof node)) return;
    if (typeof node === "number") {
      requireThat(Number.isFinite(node), "YAML_NONFINITE");
      return;
    }
    requireThat(
      typeof node === "object" && (Array.isArray(node) || Object.getPrototypeOf(node) === Object.prototype),
      "YAML_JSON",
    );
    requireThat(!ancestors.has(node), "YAML_CYCLE");
    ancestors.add(node);
    for (const item of Object.values(node)) json(item, depth + 1);
    ancestors.delete(node);
  }
  json(value);
  requireThat(value && !Array.isArray(value) && typeof value === "object", "YAML_OBJECT");
  return value;
}
/**
 * Inspect an already bounded, acyclic JSON object and resolve every $ref through its own properties only.
 * Returns reference strings in traversal order, including duplicates. Throws for non-fragment references, invalid
 * pointer escapes, missing targets or non-object targets. Does not fetch, follow references recursively or mutate input.
 */
export function fragmentReferences(spec) {
  const refs = [];
  /** Walk contained JSON values, resolving each reference against spec and appending it; invalid references throw. */
  function walk(node) {
    if (!node || typeof node !== "object") return;
    for (const [key, value] of Object.entries(node)) {
      if (key !== "$ref") {
        walk(value);
        continue;
      }
      requireThat(typeof value === "string" && value.startsWith("#/"), "REF_SCOPE");
      let target = spec;
      for (const part of value.slice(2).split("/")) {
        requireThat(!/~(?![01])/u.test(part), "REF_SYNTAX");
        const field = part.replace(/~1/g, "/").replace(/~0/g, "~");
        requireThat(target && typeof target === "object" && Object.hasOwn(target, field), "REF_MISSING");
        target = target[field];
      }
      requireThat(target && typeof target === "object", "REF_TARGET");
      refs.push(value);
    }
  }
  walk(spec);
  return refs;
}
/**
 * Return copied path/operation containers with only supported narrative fields removed for semantic comparison.
 * Mapping keys remain structural, including properties named description. Nested schemas are retained intact and
 * input is not mutated; malformed path/operation structures can throw. This is not general OpenAPI normalization.
 */
function pathsWithoutNarrative(paths) {
  return Object.fromEntries(
    Object.entries(paths).map(([path, methods]) => [
      path,
      Object.fromEntries(
        Object.entries(methods).map(([method, operation]) => {
          const copy = { ...operation };
          delete copy.description;
          delete copy.summary;
          delete copy.externalDocs;
          if (copy.responses)
            copy.responses = Object.fromEntries(
              Object.entries(copy.responses).map(([status, response]) => {
                const value = { ...response };
                delete value.description;
                return [status, value];
              }),
            );
          if (copy.requestBody) {
            copy.requestBody = { ...copy.requestBody };
            delete copy.requestBody.description;
          }
          return [method, copy];
        }),
      ),
    ]),
  );
}
/**
 * Compare a bounded, acyclic parsed specification with the independent transport fixture's selected semantics.
 * Requires local references, OpenAPI 3.0.3, default same-origin servers/no global auth, intact closed components,
 * normalized operation structure, the inclusive limit note and transport/proxy metadata. Returns nothing or throws;
 * no mutation/I/O occurs, and unrelated OpenAPI metadata is not comprehensively validated.
 * @see ../../../docs/testing/contracts/docs-v1.md
 */
export function assertSpec(spec) {
  fragmentReferences(spec);
  same(Object.hasOwn(spec, "servers") ? spec.servers : [{ url: "/" }], [{ url: "/" }], "SPEC_SERVERS");
  same(Object.hasOwn(spec, "security") ? spec.security : [], [], "SPEC_SECURITY");
  same(spec.openapi, "3.0.3", "SPEC_VERSION");
  same(spec.components, expectedSpec.components, "SPEC_SCHEMAS");
  same(pathsWithoutNarrative(spec.paths), pathsWithoutNarrative(expectedSpec.paths), "SPEC_PATHS");
  requireThat(
    typeof spec.paths["/file-upload"].post.description === "string" &&
      /inclusive 20971520-byte/.test(spec.paths["/file-upload"].post.description),
    "SPEC_LIMIT_NOTE",
  );
  for (const key of ["x-transport-requirements", "x-controlled-proxy-responses"])
    same(spec[key], expectedSpec[key], "SPEC_TRANSPORT");
}
/**
 * Send one bodyless HTTP(S) request without following redirects or pooling its connection.
 * @param origin - Canonical origin only, with no path/trailing slash; invalid URL/origin throws synchronously.
 * @param path - Slash-prefixed, non-protocol-relative path, optionally with a query; invalid prefix throws synchronously.
 * @param method - Method passed to Node, default GET; callers choose the contract's fixed route/method probes.
 * @returns A Promise of status, duplicate-preserving raw name/value headers and a Buffer body, for any HTTP status.
 * Request errors, aborted responses, bodies over 2 MiB or the absolute five-second deadline reject. The helper owns
 * the request/timer, destroys the request on size/deadline refusal and clears the timer on response end/request close.
 */
export function requestDocs(origin, path, method = "GET") {
  const base = new URL(origin);
  requireThat(base.origin === origin && ["http:", "https:"].includes(base.protocol), "PUBLIC_ORIGIN");
  requireThat(path.startsWith("/") && !path.startsWith("//"), "PUBLIC_PATH");
  return new Promise((resolve, reject) => {
    let timer;
    const send = base.protocol === "https:" ? https.request : http.request;
    const req = send(origin + path, { method, agent: false }, (res) => {
      const parts = [];
      let total = 0;
      res.on("data", (chunk) => {
        total += chunk.length;
        if (total > 2 * 1024 * 1024) req.destroy(Error("RESPONSE_SIZE"));
        else parts.push(chunk);
      });
      res.once("error", reject);
      res.once("end", () => {
        clearTimeout(timer);
        resolve({
          status: res.statusCode,
          headers: res.rawHeaders.reduce(
            (all, value, i, a) => (i % 2 ? all : [...all, { name: value, value: a[i + 1] }]),
            [],
          ),
          body: Buffer.concat(parts),
        });
      });
      res.once("aborted", () => reject(Error("RESPONSE_ABORTED")));
    });
    timer = setTimeout(() => req.destroy(Error("RESPONSE_DEADLINE")), 5000);
    req.once("error", reject);
    req.once("close", () => clearTimeout(timer));
    req.end();
  });
}
/**
 * Exercise the fixed public root/docs route, method, redirect, media, header, artifact and unknown-path matrix.
 * origin must be a canonical authorized public or owned-fixture origin. Sends bodyless requests sequentially through
 * requestDocs, which owns their connections; returns nothing on success and rejects at the first transport/assertion
 * failure. Does not start a server, inspect product configuration or validate all methods accepted by HTTP.
 */
export async function checkPublicResponses(origin) {
  const root = await requestDocs(origin, "/");
  same(root.status, 200, "ROOT_STATUS");
  assertHeaders(root.headers, ROOT_POLICY, "ROOT");
  for (const method of ["GET", "HEAD"]) {
    const redir = await requestDocs(origin, "/docs", method);
    same(redir.status, 308, "REDIRECT_STATUS");
    same(headerValues(redir.headers, "location"), ["/docs/"], "REDIRECT_LOCATION");
    assertHeaders(redir.headers);
    if (method === "HEAD") same(redir.body.length, 0, "HEAD_BODY");
    for (const [path, media] of resources) {
      const res = await requestDocs(origin, path, method);
      same(res.status, 200, "ROUTE_STATUS");
      assertHeaders(res.headers);
      assertMedia(res, media);
      if (method === "HEAD") same(res.body.length, 0, "HEAD_BODY");
      if (path.endsWith(".yaml"))
        same(
          headerValues(res.headers, "content-disposition"),
          ['attachment; filename="openapi.yaml"'],
          "YAML_DOWNLOAD",
        );
      if (method === "GET" && path.endsWith("/redoc.js")) assertArtifact(res.body, DERIVED_HASH);
      if (method === "GET" && path.endsWith(".svg")) assertArtifact(res.body, LOGO_HASH);
    }
    const missing = await requestDocs(origin, "/docs/not-a-resource", method);
    assertHeaders(missing.headers);
    assertError(missing, 404, method === "HEAD");
  }
  for (const path of ["/docs", ...resources.map(([path]) => path)])
    for (const method of ["POST", "PUT", "PATCH", "OPTIONS", "DELETE"]) {
      const res = await requestDocs(origin, path, method);
      assertHeaders(res.headers);
      assertError(res, 405);
      same(headerValues(res.headers, "allow"), ["GET, HEAD"], "METHOD_ALLOW");
    }
  const missing = await requestDocs(origin, "/docs/not-a-resource", "POST");
  assertError(missing, 404);
  assertHeaders(missing.headers);
  const query = await requestDocs(origin, "/docs/?retained=1");
  same(query.status, 200, "QUERY_IDENTITY");
  assertHeaders(query.headers);
}
/**
 * Fetch the public YAML document from a canonical authorized origin, check its status/headers/download disposition,
 * then parse and compare its semantics through the shared predicates. Returns the admitted parsed object; rejects
 * transport, parsing or contract failures. requestDocs owns the connection; no reference fetch or source mutation occurs.
 */
export async function checkServedSpec(origin) {
  const res = await requestDocs(origin, "/docs/openapi.yaml");
  same(res.status, 200, "SPEC_STATUS");
  assertHeaders(res.headers);
  assertMedia(res, "application/yaml");
  same(headerValues(res.headers, "content-disposition"), ['attachment; filename="openapi.yaml"'], "YAML_DOWNLOAD");
  const spec = parseYaml(res.body);
  assertSpec(spec);
  return spec;
}
