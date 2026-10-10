/**
 * Validate the selected documentation build tool in parsed package.json and npm-v3 lock metadata.
 *
 * Import requireDocsToolPolicy(packageJson, packageLock); it returns undefined or throws a labeled assertion. Only
 * direct development Redoc 2.5.4 is admitted here. The caller owns other tool names, runtime/alternate channels and
 * generic transitive metadata. This module reads only its arguments, performs no I/O or environment lookup, executes
 * no package code and never mutates inputs. Integrity checks validate SRI syntax, not downloaded package contents.
 * Labels distinguish record, lockfileVersion, declaration, installed, dev, flags, resolved and integrity failures.
 */
import assert from "node:assert/strict";

const selectedVersion = "2.5.4";
const installedPath = "node_modules/redoc";
const selectedTarball = "https://registry.npmjs.org/redoc/-/redoc-2.5.4.tgz";

/**
 * Return an ordinary or null-prototype parsed record without mutation; reject other values with the supplied label.
 * Callers choose the record or installed boundary so malformed metadata cannot be mistaken for a different rejection.
 */
function requireRecord(value, label) {
  assert(value !== null && typeof value === "object" && !Array.isArray(value), `${label} must be a record`);
  const prototype = Object.getPrototypeOf(value);
  assert(prototype === Object.prototype || prototype === null, `${label} must have an ordinary prototype`);
  return value;
}

/**
 * Read an own Redoc development declaration from a validated root and return its presence and value without mutation.
 * Absent maps yield an absent declaration; present malformed maps throw at the record boundary, including undefined.
 */
function developmentDeclaration(root, label) {
  if (!Object.hasOwn(root, "devDependencies")) return { present: false, value: undefined };
  const dependencies = requireRecord(root.devDependencies, `DOCS-TOOL-POLICY record ${label}.devDependencies`);
  const present = Object.hasOwn(dependencies, "redoc");
  return { present, value: present ? dependencies.redoc : undefined };
}

/**
 * Require one canonical SHA-512 SRI token encoding exactly 64 bytes; return undefined or throw an integrity assertion.
 * Exact re-encoding rejects permissive base64 variants and extra tokens without authenticating any downloaded bytes.
 */
function requireIntegrity(integrity) {
  assert(
    typeof integrity === "string" && integrity.length === 95 && integrity.startsWith("sha512-"),
    "DOCS-TOOL-POLICY integrity must be one canonical SHA-512 token",
  );
  const digest = Buffer.from(integrity.slice(7), "base64");
  assert(
    digest.length === 64 && integrity === `sha512-${digest.toString("base64")}`,
    "DOCS-TOOL-POLICY integrity must encode exactly 64 bytes in canonical base64",
  );
}

/**
 * Validate parsed package/lock metadata for the exact direct development tool, returning undefined on success.
 * Throw labeled assertions for malformed records, declaration disagreement or invalid selected installed metadata.
 * Undeclared installed Redoc must be development-only; its transitive version/source remain the caller's responsibility.
 * Inputs are unchanged on success and failure; no installation, renderer execution, environment lookup or I/O occurs.
 */
export function requireDocsToolPolicy(packageJson, packageLock) {
  const pkg = requireRecord(packageJson, "DOCS-TOOL-POLICY record package");
  const lock = requireRecord(packageLock, "DOCS-TOOL-POLICY record lock");
  assert.equal(lock.lockfileVersion, 3, "DOCS-TOOL-POLICY lockfileVersion must be numeric 3");
  const packages = requireRecord(lock.packages, "DOCS-TOOL-POLICY record packages");
  const root = requireRecord(packages[""], "DOCS-TOOL-POLICY record lock root");
  const packageDeclaration = developmentDeclaration(pkg, "package");
  const lockDeclaration = developmentDeclaration(root, "lock root");
  assert.equal(
    packageDeclaration.present,
    lockDeclaration.present,
    "DOCS-TOOL-POLICY declaration must be present on both roots or absent on both",
  );
  if (packageDeclaration.present) {
    assert.equal(packageDeclaration.value, lockDeclaration.value, "DOCS-TOOL-POLICY declaration values must agree");
    assert.equal(
      packageDeclaration.value,
      selectedVersion,
      "DOCS-TOOL-POLICY declaration must be exactly the string 2.5.4",
    );
  } else if (!Object.hasOwn(packages, installedPath)) {
    return;
  }
  assert(Object.hasOwn(packages, installedPath), "DOCS-TOOL-POLICY installed Redoc record is required");
  const installed = requireRecord(packages[installedPath], "DOCS-TOOL-POLICY installed Redoc");
  if (packageDeclaration.present) {
    assert.equal(installed.version, selectedVersion, "DOCS-TOOL-POLICY installed version must be exactly 2.5.4");
  }
  assert.equal(installed.dev, true, "DOCS-TOOL-POLICY dev must be strictly true for installed Redoc");
  if (!packageDeclaration.present) return;
  for (const flag of ["devOptional", "optional", "peer"]) {
    if (Object.hasOwn(installed, flag)) {
      assert.equal(installed[flag], false, `DOCS-TOOL-POLICY flags ${flag} must be absent or strictly false`);
    }
  }
  assert(!Object.hasOwn(installed, "link"), "DOCS-TOOL-POLICY flags link must be absent");
  assert.equal(installed.resolved, selectedTarball, "DOCS-TOOL-POLICY resolved must be the exact selected npm tarball");
  requireIntegrity(installed.integrity);
}
