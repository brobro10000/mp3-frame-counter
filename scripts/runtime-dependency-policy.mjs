/**
 * Validate the narrowly permitted runtime dependency in parsed package.json and npm-v3 lock metadata.
 *
 * This pure policy accepts no runtime dependency or one canonical stable Fastify pin with matching production metadata.
 * It reads only its arguments, never mutates them, and performs no I/O or acceptance selection. Integrity checks
 * validate recorded SRI syntax, not downloaded package contents; the caller retains development and transitive checks.
 */
import assert from "node:assert/strict";

/**
 * Require a parsed JSON record with an ordinary or null prototype, returning the original value without mutation.
 * The label identifies the checked boundary in thrown assertions; arrays, primitives and custom prototypes fail.
 */
function requireRecord(value, label) {
  assert(value !== null && typeof value === "object" && !Array.isArray(value), `${label} must be a record`);
  const prototype = Object.getPrototypeOf(value);
  assert(prototype === Object.prototype || prototype === null, `${label} must have an ordinary prototype`);
  return value;
}

/**
 * Check an ordinary package or lock-root record for alternate dependency channels, returning undefined on success.
 * Present map channels must be empty ordinary records and both bundle aliases must be empty arrays; otherwise throw.
 */
function requireEmptyChannels(root, label) {
  for (const field of ["optionalDependencies", "peerDependencies", "peerDependenciesMeta", "overrides"]) {
    if (!Object.hasOwn(root, field)) continue;
    const value = requireRecord(root[field], `${label}.${field}`);
    assert.equal(Object.keys(value).length, 0, `${label}.${field} must be empty`);
  }
  for (const field of ["bundleDependencies", "bundledDependencies"]) {
    if (!Object.hasOwn(root, field)) continue;
    assert(Array.isArray(root[field]) && root[field].length === 0, `${label}.${field} must be an empty array`);
  }
}

/**
 * Read the direct runtime declaration from an ordinary root record and return its Fastify version or undefined.
 * Missing and empty maps compare equivalently without rewriting inputs; any other name, shape or pin syntax throws.
 */
function runtimeVersion(root, label) {
  if (!Object.hasOwn(root, "dependencies")) return undefined;
  const dependencies = requireRecord(root.dependencies, `${label}.dependencies`);
  const names = Object.keys(dependencies);
  if (names.length === 0) return undefined;
  assert(names.length === 1 && names[0] === "fastify", `${label} may declare only Fastify as a runtime dependency`);
  const version = dependencies.fastify;
  assert.equal(typeof version, "string", `${label} Fastify version must be a string`);
  const match = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.exec(version);
  assert(match && match[0] === version, `${label} Fastify version must be a canonical stable X.Y.Z pin`);
  assert(
    match.slice(1).every((component) => Number.isSafeInteger(Number(component))),
    `${label} Fastify version components must be safe integers`,
  );
  return version;
}

/**
 * Require one canonical SHA-512 SRI string decoding to 64 bytes, returning undefined or throwing on invalid metadata.
 * Exact re-encoding rejects permissive base64 decoding, padding variants and additional tokens. It does not authenticate
 * downloaded package bytes.
 */
function requireIntegrity(integrity) {
  assert(
    typeof integrity === "string" && integrity.length === 95 && integrity.startsWith("sha512-"),
    "Direct Fastify integrity must be one canonical SHA-512 token",
  );
  const digest = Buffer.from(integrity.slice(7), "base64");
  assert(
    digest.length === 64 && integrity === `sha512-${digest.toString("base64")}`,
    "Direct Fastify integrity must encode exactly 64 bytes in canonical base64",
  );
}

/**
 * Enforce direct runtime admission for parsed package and lock inputs, returning undefined for an admitted graph.
 * Throw on malformed records, declaration disagreement, alternate channels or invalid installed Fastify metadata.
 * Inputs remain unchanged on success and failure; this helper performs no I/O, installation or environment lookup.
 */
export function requireRuntimeDependencyPolicy(packageJson, packageLock) {
  const pkg = requireRecord(packageJson, "Package metadata");
  const lock = requireRecord(packageLock, "Lock metadata");
  assert.equal(lock.lockfileVersion, 3, "Runtime dependency policy requires npm lockfile version 3");
  const packages = requireRecord(lock.packages, "Lock packages");
  const root = requireRecord(packages[""], "Lock root");
  requireEmptyChannels(pkg, "Package");
  requireEmptyChannels(root, "Lock root");
  const version = runtimeVersion(pkg, "Package");
  assert.equal(version, runtimeVersion(root, "Lock root"), "Package and lock-root runtime declarations must agree");
  const installedPath = "node_modules/fastify";
  if (version === undefined) {
    if (Object.hasOwn(packages, installedPath)) {
      const installed = requireRecord(packages[installedPath], "Installed Fastify");
      assert.equal(installed.dev, true, "Undeclared installed Fastify must be development-only");
    }
    return;
  }
  const installed = requireRecord(packages[installedPath], "Installed Fastify");
  assert.equal(installed.version, version, "Installed Fastify version must match its direct pin");
  for (const flag of ["dev", "devOptional", "optional", "peer"]) {
    if (Object.hasOwn(installed, flag)) assert.equal(installed[flag], false, `Direct Fastify ${flag} must be false`);
  }
  assert(!Object.hasOwn(installed, "link"), "Direct Fastify must not be a link");
  assert.equal(
    installed.resolved,
    `https://registry.npmjs.org/fastify/-/fastify-${version}.tgz`,
    "Direct Fastify must resolve to its exact canonical npm tarball URL",
  );
  requireIntegrity(installed.integrity);
}
