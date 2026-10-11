/**
 * Select closed application-unit ownership from verified path inventories, retaining historical replay.
 * Pure metadata validation: no I/O, Git, tool execution, mutation or acceptance-binding authority.
 * Localized test paths activate permanent directory ownership; preparing this helper alone remains dormant.
 */
import assert from "node:assert/strict";
import { unitFiles } from "./ci-unit-inventory.mjs";

const localizedUnits = {
  application: ["frontend/tests/frontend-response.test.ts"],
  server: [
    "server/tests/app.test.ts",
    "server/tests/docs-build.test.ts",
    "server/tests/docs.test.ts",
    "server/tests/http.test.ts",
    "server/tests/mp3.test.ts",
  ],
};
const adoptedMarkers = [
  "server/src/app.ts",
  "tests/unit/app.test.ts",
  "server/src/contracts/mp3.ts",
  "server/src/documentation/generate.ts",
];

/** Reject aliases, repeated paths and malformed inventories instead of normalizing their ownership. */
function paths(value) {
  assert(Array.isArray(value), "Unit layout requires path inventories");
  for (const path of value) {
    assert(typeof path === "string" && path.length > 0 && !/[\x00-\x1f\x7f\\]/.test(path));
    assert(!path.startsWith("/") && path.split("/").every((part) => part && part !== "." && part !== ".."));
  }
  assert.equal(new Set(value).size, value.length, "Unit paths cannot repeat");
  return value;
}

/** Return fresh literal ownership; current/ancestral localized markers prohibit deletion or old-layout fallback. */
export function requireBackendUnitLayout(input) {
  assert(input && typeof input === "object" && !Array.isArray(input), "Unit layout requires a record");
  assert([Object.prototype, null].includes(Object.getPrototypeOf(input)));
  assert.deepEqual(Reflect.ownKeys(input).sort(), ["ancestorFiles", "sourceFiles"]);
  const sourceFiles = paths(input.sourceFiles);
  assert(Array.isArray(input.ancestorFiles), "Unit layout requires explicit ancestry");
  const ancestry = input.ancestorFiles.map(paths);
  const historyHas = (markers) =>
    [sourceFiles, ...ancestry].some((files) => markers.some((marker) => files.includes(marker)));
  const layout = historyHas(Object.values(localizedUnits).flat())
    ? "localized"
    : historyHas(adoptedMarkers)
      ? "adopted"
      : "historical";
  const selected =
    layout === "localized"
      ? localizedUnits
      : layout === "adopted"
        ? unitFiles
        : { ...unitFiles, server: unitFiles.server.filter((path) => path !== "tests/unit/app.test.ts") };
  const actual = sourceFiles.filter((path) =>
    /^(?:tests\/unit|server\/tests|frontend\/tests)\/.*\.(?:test|spec)\.[cm]?[jt]sx?$/.test(path),
  );
  assert.deepEqual([...actual].sort(), Object.values(selected).flat().sort(), "Unit ownership changed");
  return { layout, unitFiles: structuredClone(selected) };
}
