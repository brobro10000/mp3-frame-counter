/**
 * Admit the independently specified stable schema/docs/client graph without changing historical Fastify-only policy.
 * Pure parsed npm-v3 metadata check: no install, I/O, normalization or input mutation. SRI validates syntax only.
 */
import assert from "node:assert/strict";
import { requireRuntimeDependencyPolicy } from "./runtime-dependency-policy.mjs";

const runtime = {
  fastify: "5.12.5",
  typebox: "1.3.36",
  "@fastify/type-provider-typebox": "6.2.0",
  "@fastify/swagger": "9.9.2",
};
const development = { ky: "2.2.0", "@redocly/cli": "2.62.1", oxlint: "1.87.0" };

/** Return ordinary/null-prototype metadata unchanged; malformed shapes fail before dependency admission. */
function record(value) {
  assert(value !== null && typeof value === "object" && !Array.isArray(value), "Backend policy needs records");
  assert([Object.prototype, null].includes(Object.getPrototypeOf(value)), "Backend policy needs ordinary records");
  return value;
}

/** Treat absent declarations as empty without mutating input; present maps must be ordinary records. */
function declarations(root, key) {
  return Object.hasOwn(root, key) ? record(root[key]) : {};
}

/** Verify direct pin/source/SRI and production/build placement; no downloaded bytes are authenticated here. */
function installed(packages, name, version, dev) {
  const entry = record(packages[`node_modules/${name}`]);
  assert.equal(entry.version, version, `Wrong ${name} installed version`);
  assert.equal(entry.resolved, `https://registry.npmjs.org/${name}/-/${name.split("/").at(-1)}-${version}.tgz`);
  assert.equal(typeof entry.integrity, "string");
  const digest = Buffer.from(entry.integrity.slice(7), "base64");
  assert(digest.length === 64 && entry.integrity === `sha512-${digest.toString("base64")}`, "Invalid SHA512 integrity");
  if (dev) assert.equal(entry.dev, true, `${name} must be development-only`);
  else if (Object.hasOwn(entry, "dev")) assert.equal(entry.dev, false);
  for (const flag of ["devOptional", "optional", "peer", "link", "inBundle"]) {
    if (Object.hasOwn(entry, flag)) assert.equal(entry[flag], false, `Invalid direct ${name} ${flag}`);
  }
}

/** Require legacy absence/Fastify or the complete four-runtime selection, with optional exact dev-only Ky/Redocly. */
export function requireBackendContractPolicy(packageJson, packageLock) {
  const pkg = record(packageJson);
  const lock = record(packageLock);
  assert.equal(lock.lockfileVersion, 3);
  const packages = record(lock.packages);
  const root = record(packages[""]);
  const maps = [declarations(pkg, "dependencies"), declarations(root, "dependencies")];
  const selected = maps.some((map) =>
    Object.keys(runtime).some((name) => name !== "fastify" && Object.hasOwn(map, name)),
  );
  if (!selected) requireRuntimeDependencyPolicy(pkg, lock);
  else {
    for (const metadata of [pkg, root]) {
      for (const key of [
        "optionalDependencies",
        "peerDependencies",
        "peerDependenciesMeta",
        "overrides",
        "bundleDependencies",
        "bundledDependencies",
      ]) {
        assert(!Object.hasOwn(metadata, key), "Alternate dependency channels are closed");
      }
    }
    for (const map of maps) {
      assert.deepEqual(Object.keys(map).sort(), Object.keys(runtime).sort(), "Incomplete or extra runtime selection");
      for (const [name, version] of Object.entries(runtime)) assert.equal(map[name], version, `Wrong ${name} pin`);
    }
    for (const [name, version] of Object.entries(runtime)) installed(packages, name, version, false);
  }
  const tools = [declarations(pkg, "devDependencies"), declarations(root, "devDependencies")];
  for (const [name, version] of Object.entries(development)) {
    if (!tools.some((map) => Object.hasOwn(map, name))) continue;
    for (const map of tools) assert.equal(map[name], version, `Unreviewed development tool: wrong ${name} pin`);
    installed(packages, name, version, true);
  }
}
