/**
 * Admit the exact browser build tools in parsed package.json and npm-v3 lock records.
 *
 * React/ReactDOM are browser dependencies installed only during development/build; the API runtime remains Fastify-only.
 * Import requireFrontendToolPolicy(packageJson, packageLock); it returns undefined or throws on malformed metadata.
 * This pure helper performs no I/O, installation, environment lookup or mutation. SRI checks validate recorded syntax,
 * not downloaded package bytes. Historical graphs without the direct selection remain readable.
 */
import assert from "node:assert/strict";

const pins = {
  react: "19.3.0",
  "react-dom": "19.3.0",
  "@types/react": "19.3.0",
  "@types/react-dom": "19.3.0",
  vite: "8.3.4",
};

/** Return an ordinary parsed record unchanged; reject null, arrays, primitives and custom prototypes. */
function record(value, label) {
  assert(value !== null && typeof value === "object" && !Array.isArray(value), `${label} must be a record`);
  const prototype = Object.getPrototypeOf(value);
  assert(prototype === Object.prototype || prototype === null, `${label} must have an ordinary prototype`);
  return value;
}

/** Read an optional development map without supplying defaults for present malformed values. */
function development(root, label) {
  return Object.hasOwn(root, "devDependencies") ? record(root.devDependencies, `${label} development map`) : {};
}

/** Require one canonical SHA-512 SRI token encoding sixty-four bytes; no package contents are downloaded here. */
function integrity(value) {
  assert(typeof value === "string" && value.length === 95 && value.startsWith("sha512-"), "Invalid frontend SRI");
  const digest = Buffer.from(value.slice(7), "base64");
  assert(digest.length === 64 && value === `sha512-${digest.toString("base64")}`, "Invalid frontend SRI encoding");
}

/**
 * Require historical absence or the complete reviewed five-tool development selection on both roots.
 *
 * @param {Record<string, unknown>} packageJson Parsed application metadata; inputs remain mutable and unchanged.
 * @param {Record<string, unknown>} packageLock Parsed npm-v3 metadata, including installed-package identities.
 * @returns {void} Undefined on admission; malformed graphs, alternate browser channels and mismatched pins throw.
 * Other development tools, generic transitives and the API runtime stay subject to the existing enclosing policies.
 */
export function requireFrontendToolPolicy(packageJson, packageLock) {
  const pkg = record(packageJson, "Frontend package");
  const lock = record(packageLock, "Frontend lock");
  assert.equal(lock.lockfileVersion, 3, "Frontend lockfileVersion must be numeric 3");
  const packages = record(lock.packages, "Frontend lock packages");
  const root = record(packages[""], "Frontend lock root");
  const declarations = [development(pkg, "Package"), development(root, "Lock root")];
  const selected = declarations.some((map) => Object.keys(pins).some((name) => Object.hasOwn(map, name)));
  for (const [name, version] of Object.entries(pins)) {
    for (const [label, metadata] of [
      ["Package", pkg],
      ["Lock root", root],
    ]) {
      for (const channel of ["dependencies", "optionalDependencies", "peerDependencies"]) {
        if (!Object.hasOwn(metadata, channel)) continue;
        const map = record(metadata[channel], `${label}.${channel}`);
        assert(!Object.hasOwn(map, name), `${name} must remain a browser-only development dependency`);
      }
    }
    if (selected) {
      for (const declaration of declarations) {
        assert(Object.hasOwn(declaration, name), "Frontend selection must be complete on both roots");
        assert.equal(declaration[name], version, `Frontend ${name} must use its exact reviewed pin`);
      }
    }
    const path = `node_modules/${name}`;
    if (!selected && !Object.hasOwn(packages, path)) continue;
    const installed = record(packages[path], `Frontend installed ${name}`);
    assert.equal(installed.dev, true, `${name} installed metadata must be development-only`);
    if (!selected) continue;
    assert.equal(installed.version, version, `${name} installed version must match its reviewed pin`);
    for (const flag of ["optional", "peer", "devOptional"]) {
      if (Object.hasOwn(installed, flag)) assert.equal(installed[flag], false, `Frontend ${flag} must be false`);
    }
    assert(!Object.hasOwn(installed, "link"), "Frontend installed links are forbidden");
    assert.equal(
      installed.resolved,
      `https://registry.npmjs.org/${name}/-/${name.split("/").at(-1)}-${version}.tgz`,
      "Frontend tarball identity must match its reviewed pin",
    );
    integrity(installed.integrity);
  }
}
