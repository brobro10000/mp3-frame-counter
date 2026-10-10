/**
 * Build the fixed offline API reference after TypeScript compilation: node server/src/build-docs.mjs (no arguments).
 * Read only package-local Redoc 2.5.4 and the sibling docs inputs using Node builtins; never execute renderer/package
 * code, fetch content or select paths through environment variables. Verify the reviewed original/map/logo identities,
 * make exactly two vendor edits, validate contained specification references and retain original licenses/provenance.
 * Replace dist/docs only after a complete bounded staging tree is ready. A failed build removes old/partial docs output
 * and its owned staging tree, emits a diagnostic and exits nonzero; compiled application files are left untouched.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = realpathSync(fileURLToPath(new URL("../../", import.meta.url)));
const dist = join(root, "dist");
const output = join(dist, "docs");
const packagePath = "node_modules/redoc/";
const inputPath = "server/src/docs/";
const originalHash = "dcaf76612bc4a3fbcc923a8966dee2f6146a5f32e5ce1b6f02dd60cbbf89500b";
const derivativeHash = "21ce5beb19818927f12e2db16e1a332e4f0eac5b8538012b6ecd048585b8cdbf";
const mapHash = "2550d1c2e62c0640b2b4f4f49843433840fc291e001f3edb15ff66470e551476";
const logoHash = "1dab4315f8de2177b2b2726b29e84a26314c69cd27d692228947c0058793d5a7";
const licenseHash = "d3026d549cf68ab7355bcfa85877bf8f845b3334a7efbfdc63936432fb34ff0e";
const noticesHash = "eed602ec32e00b2b9df1984fbcc26a687b1b3193ec01961389c4b8439e6edf73";
const foreignLogo = "https://cdn.redoc.ly/redoc/logo-mini.svg";
const localLogo = "/docs/assets/redoc-logo-mini.svg";
const mapComment = "\n//# sourceMappingURL=redoc.standalone.js.map";
const textLimit = 256 * 1024;
const rendererLimit = 2 * 1024 * 1024;
const totalLimit = 16 * 1024 * 1024;

/** Return the SHA-256 identity of supplied bytes without changing them or reading any external state. */
function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Decode supplied UTF-8 bytes without replacement characters; invalid encoding throws the named input assertion. */
function utf8(bytes, label) {
  const value = bytes.toString("utf8");
  assert(Buffer.from(value, "utf8").equals(bytes), `Docs input ${label} must be valid UTF-8`);
  return value;
}

/**
 * Read one fixed root-relative input, rejecting symlinked parents, nonregular/empty files and the explicit byte bound.
 * Allocate at most limit+1 bytes and close the descriptor on every outcome; I/O errors propagate to build cleanup.
 */
function readInput(relativePath, limit) {
  const path = join(root, relativePath);
  let parent = root;
  for (const component of relativePath.split("/").slice(0, -1)) {
    parent = join(parent, component);
    const info = lstatSync(parent);
    assert(info.isDirectory() && !info.isSymbolicLink(), `Docs input ${relativePath} has an unsafe parent`);
  }
  const descriptor = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const info = fstatSync(descriptor);
    assert(info.isFile() && info.size > 0 && info.size <= limit, `Docs input ${relativePath} exceeds its file bound`);
    const buffer = Buffer.alloc(limit + 1);
    let used = 0;
    while (used < buffer.length) {
      const count = readSync(descriptor, buffer, used, buffer.length - used, null);
      if (count === 0) break;
      used += count;
    }
    assert(used > 0 && used <= limit, `Docs input ${relativePath} exceeds its read bound`);
    return Buffer.from(buffer.subarray(0, used));
  } finally {
    closeSync(descriptor);
  }
}

/**
 * Verify and localize the supplied original bundle, returning new derivative bytes. The only edits replace one logo
 * URL and remove the exact terminal map comment; wrong edit counts, original bytes or resulting bytes throw.
 */
function localizeRenderer(original) {
  const source = utf8(original, "renderer");
  assert.equal(source.split(foreignLogo).length - 1, 1, "Docs renderer must contain exactly one selected logo URL");
  assert(
    source.endsWith(mapComment) && source.split(mapComment).length - 1 === 1,
    "Docs renderer must contain exactly the selected terminal source-map comment",
  );
  assert.equal(sha256(original), originalHash, "Docs renderer original hash mismatch");
  const derivative = Buffer.from(source.slice(0, -mapComment.length).replace(foreignLogo, localLogo), "utf8");
  assert.equal(sha256(derivative), derivativeHash, "Docs renderer derivative hash mismatch");
  return derivative;
}

/**
 * Resolve a supplied same-document JSON pointer using only own properties of the parsed specification. Return the
 * referenced value; malformed escaping, a foreign reference or a missing segment throws without external resolution.
 */
function resolveReference(specification, reference) {
  assert(typeof reference === "string" && reference.startsWith("#/"), "Docs reference must be a local JSON pointer");
  let pointer;
  try {
    pointer = decodeURIComponent(reference.slice(1));
  } catch {
    assert.fail("Docs reference contains invalid URI escaping");
  }
  let value = specification;
  for (const encoded of pointer.slice(1).split("/")) {
    assert(!/~(?:[^01]|$)/.test(encoded), "Docs reference contains invalid JSON pointer escaping");
    const key = encoded.replaceAll("~1", "/").replaceAll("~0", "~");
    assert(value !== null && typeof value === "object" && Object.hasOwn(value, key), "Docs reference does not resolve");
    value = value[key];
  }
  return value;
}

/**
 * Parse bounded product JSON and check every contained reference without importing an acceptance oracle or renderer.
 * Return deterministic JSON-syntax YAML. Excessive depth/work, nonfinite numbers, wrong version and bad references fail.
 * This is a fixed-input containment check, not a general OpenAPI semantic validator or a network-capable resolver.
 */
function specificationBytes(input) {
  const specification = JSON.parse(utf8(input, "specification"));
  assert(specification?.openapi === "3.0.3", "Docs specification must use OpenAPI 3.0.3");
  let visited = 0;
  /** Walk the finite parsed JSON tree and validate reference values; return undefined or throw at the owned boundary. */
  function visit(value, depth) {
    assert(depth <= 64 && ++visited <= 20_000, "Docs specification exceeds its traversal bound");
    if (typeof value === "number") assert(Number.isFinite(value), "Docs specification contains a nonfinite number");
    if (value === null || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (key === "$ref") resolveReference(specification, child);
      visit(child, depth + 1);
    }
  }
  visit(specification, 0);
  const bytes = Buffer.from(`${JSON.stringify(specification, null, 2)}\n`, "utf8");
  assert(bytes.length <= textLimit, "Docs specification output exceeds its byte bound");
  return bytes;
}

/**
 * Check portable provenance against the fixed renderer/logo decisions; return undefined without modifying the record.
 * Missing or contradictory package, artifact or original acquisition identity throws before any output is published.
 */
function requireProvenance(bytes) {
  const record = JSON.parse(utf8(bytes, "provenance"));
  assert.equal(record.schemaVersion, 1, "Docs provenance schema mismatch");
  assert.equal(record.contract, "docs-v1", "Docs provenance contract mismatch");
  for (const [field, expected] of Object.entries({
    name: "redoc",
    version: "2.5.4",
    packageUrl: "https://registry.npmjs.org/redoc/-/redoc-2.5.4.tgz",
    license: "MIT",
    originalSha256: originalHash,
    derivativeSha256: derivativeHash,
    sourceMapSha256: mapHash,
    licenseSha256: licenseHash,
    noticesSha256: noticesHash,
  }))
    assert.equal(record.renderer?.[field], expected, `Docs provenance renderer ${field} mismatch`);
  assert.equal(record.logoAcquisition?.url, foreignLogo, "Docs provenance logo source mismatch");
  assert.equal(record.logoAcquisition?.bytes, 539, "Docs provenance logo size mismatch");
  assert.equal(record.logoAcquisition?.sha256, logoHash, "Docs provenance logo identity mismatch");
}

/**
 * Read and validate all fixed inputs, returning a closed output map of relative names to byte buffers. No writes occur.
 * Missing inputs, unexpected package identity, wrong pinned hashes, unsafe references or oversized output throw.
 */
function collectArtifacts() {
  const packageBytes = readInput(`${packagePath}package.json`, textLimit);
  const metadata = JSON.parse(utf8(packageBytes, "Redoc package"));
  assert(
    metadata.name === "redoc" && metadata.version === "2.5.4" && metadata.license === "MIT",
    "Docs package identity mismatch",
  );
  const original = readInput(`${packagePath}bundles/redoc.standalone.js`, rendererLimit);
  const derivative = localizeRenderer(original);
  const map = readInput(`${packagePath}bundles/redoc.standalone.js.map`, 8 * 1024 * 1024);
  assert.equal(sha256(map), mapHash, "Docs source-map hash mismatch");
  const license = readInput(`${packagePath}LICENSE`, 64 * 1024);
  assert.equal(sha256(license), licenseHash, "Docs license hash mismatch");
  const notices = readInput(`${packagePath}bundles/redoc.standalone.js.LICENSE.txt`, 64 * 1024);
  assert.equal(sha256(notices), noticesHash, "Docs notices hash mismatch");
  const logo = readInput(`${inputPath}redoc-logo-mini.svg`, 64 * 1024);
  assert.equal(logo.length, 539, "Docs logo size mismatch");
  assert.equal(sha256(logo), logoHash, "Docs logo hash mismatch");
  const provenance = readInput(`${inputPath}provenance.json`, textLimit);
  requireProvenance(provenance);
  const html = readInput(`${inputPath}index.html`, textLimit);
  const init = readInput(`${inputPath}init.js`, textLimit);
  const css = readInput(`${inputPath}docs.css`, textLimit);
  for (const [label, bytes] of [
    ["HTML", html],
    ["initialization", init],
    ["CSS", css],
    ["logo", logo],
  ])
    utf8(bytes, label);
  assert(/^<!doctype html>/i.test(utf8(html, "HTML")), "Docs HTML must start with a doctype");
  const artifacts = new Map([
    ["index.html", html],
    ["openapi.yaml", specificationBytes(readInput(`${inputPath}openapi.json`, textLimit))],
    ["assets/redoc.js", derivative],
    ["assets/init.js", init],
    ["assets/docs.css", css],
    ["assets/redoc-logo-mini.svg", logo],
    ["retained/redoc.standalone.js", original],
    ["retained/redoc.standalone.js.map", map],
    ["retained/redoc.standalone.js.LICENSE.txt", notices],
    ["retained/LICENSE", license],
    ["retained/redoc-package.json", packageBytes],
    ["retained/provenance.json", provenance],
  ]);
  const manifest = {
    schemaVersion: 1,
    renderer: "redoc@2.5.4",
    artifacts: [...artifacts]
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([path, bytes]) => ({ path, bytes: bytes.length, sha256: sha256(bytes) })),
  };
  artifacts.set("retained/generation.json", Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8"));
  assert(
    [...artifacts.values()].reduce((total, bytes) => total + bytes.length, 0) <= totalLimit,
    "Docs output exceeds its total byte bound",
  );
  return artifacts;
}

let staging;
let outputOwned = false;
try {
  mkdirSync(dist, { recursive: true });
  const info = lstatSync(dist);
  assert(info.isDirectory() && !info.isSymbolicLink(), "Docs output parent must be a real directory");
  outputOwned = true;
  rmSync(output, { recursive: true, force: true });
  assert.equal(process.argv.length, 2, "Docs generator accepts no arguments");
  staging = mkdtempSync(join(dist, ".docs-build-"));
  const artifacts = collectArtifacts();
  for (const [relativePath, bytes] of artifacts) {
    const path = join(staging, relativePath);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, bytes, { flag: "wx", mode: 0o644 });
  }
  renameSync(staging, output);
  staging = undefined;
  console.log("Offline documentation artifacts generated and verified.");
} catch (error) {
  if (outputOwned) rmSync(output, { recursive: true, force: true });
  console.error(`Documentation generation failed: ${error instanceof Error ? error.message : "unknown failure"}`);
  process.exitCode = 1;
} finally {
  if (staging) rmSync(staging, { recursive: true, force: true });
}
