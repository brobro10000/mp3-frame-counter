/**
 * Shared external docs contract predicates. Inputs are bounded HTTP bytes/headers and the preserved local OpenAPI
 * fixture; no product source is imported. Used by docs.spec.ts and docs-controls.mjs. Reads the fixture at import,
 * sends only explicitly requested public-origin HTTP(S) traffic, never follows redirects, and rejects any mismatch.
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
export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function assertArtifact(bytes, expected) {
  same(sha256(bytes), expected, "ARTIFACT_IDENTITY");
}
export function requireThat(condition, code) {
  assert.ok(condition, code);
}
export function same(actual, expected, code) {
  assert.deepEqual(actual, expected, code);
}
export const headerValues = (headers, name) => headers.filter((h) => h.name.toLowerCase() === name).map((h) => h.value);
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
export function assertMedia(response, expected) {
  const values = headerValues(response.headers, "content-type");
  same(values.length, 1, "MEDIA_COUNT");
  requireThat(
    new RegExp("^" + expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?:;\\s*charset=utf-8)?$", "i").test(values[0]),
    "MEDIA_TYPE",
  );
}
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
export function fragmentReferences(spec) {
  const refs = [];
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
// Strip annotations only at explicit OpenAPI object locations. Mapping keys (including a schema property named
// description) remain structural. Component schemas are compared intact against the closed independent fixture.
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
