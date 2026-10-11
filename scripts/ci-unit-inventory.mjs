/** Pure closed unit ownership: every product test belongs to exactly one visible CI lane. No I/O or mutation. */
import assert from "node:assert/strict";

export const unitFiles = Object.freeze({
  application: Object.freeze(["tests/unit/frontend-response.test.ts"]),
  server: Object.freeze([
    "tests/unit/app.test.ts",
    "tests/unit/docs-build.test.ts",
    "tests/unit/docs.test.ts",
    "tests/unit/http.test.ts",
    "tests/unit/mp3.test.ts",
  ]),
});

/** Require the complete exact path list, independent of ordering; malformed/duplicate/missing/unknown paths throw. */
export function requireUnitInventory(files) {
  assert(
    Array.isArray(files) && files.every((file) => typeof file === "string"),
    "Unit inventory must be a string list",
  );
  assert.deepEqual(
    [...files].sort(),
    Object.values(unitFiles).flat().sort(),
    "Every unit file needs one declared CI lane",
  );
}
