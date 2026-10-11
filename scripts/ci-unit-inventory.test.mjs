/**
 * Independent bounded unit-lane ownership expectations. Run `node --test scripts/ci-unit-inventory.test.mjs` with pinned
 * Node. Pure synthetic path lists establish the exact six-file inventory before extraction/wiring; no product imports,
 * filesystem enumeration, Git state, workflow edits, installation or acceptance execution occur.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const moduleUrl = new URL("./ci-unit-inventory.mjs", import.meta.url);
const subject = existsSync(moduleUrl) ? await import(moduleUrl.href) : {};
const expected = {
  application: ["tests/unit/frontend-response.test.ts"],
  server: [
    "tests/unit/app.test.ts",
    "tests/unit/docs-build.test.ts",
    "tests/unit/docs.test.ts",
    "tests/unit/http.test.ts",
    "tests/unit/mp3.test.ts",
  ],
};
const all = Object.values(expected).flat();

/** API absence must fail outside every rejection assertion, never masquerade as a closed-inventory refusal. */
function predicate() {
  assert.equal(typeof subject.requireUnitInventory, "function", "Missing CI-UNIT-INVENTORY pure API");
  return subject.requireUnitInventory;
}

test("fixed exported map assigns only app factory and prior backend tests to server", () => {
  predicate();
  assert.deepEqual(subject.unitFiles, expected);
  assert.ok(Object.isFrozen(subject.unitFiles));
  for (const values of Object.values(subject.unitFiles)) assert.ok(Object.isFrozen(values));
});

test("exact sorted unsorted and frozen path lists are valid without mutation", () => {
  const check = predicate();
  for (const files of [[...all], [...all].sort(), [...all].reverse(), Object.freeze([...all])]) {
    const before = [...files];
    assert.equal(check(files), undefined);
    assert.deepEqual(files, before);
  }
});

test("missing duplicated extra and zero-file inventories fail closed unchanged", () => {
  const check = predicate();
  for (const files of [[], all.slice(1), [...all, all[0]], [...all, "tests/unit/analysis.test.ts"]]) {
    const before = [...files];
    assert.throws(() => check(files));
    assert.deepEqual(files, before);
  }
});

test("unknown nonunit outside-directory and differently spelled paths cannot replace a lane member", () => {
  const check = predicate();
  for (const substitute of [
    "tests/unit/app.ts",
    "tests/unit/app.test.js",
    "tests/unit/App.test.ts",
    "app.test.ts",
    "tests/acceptance/app.test.ts",
    "tests/unit/../unit/app.test.ts",
    "tests/unit/app.test.ts ",
    "/tests/unit/app.test.ts",
  ]) {
    const files = [substitute, ...all.slice(1)];
    const before = [...files];
    assert.throws(() => check(files));
    assert.deepEqual(files, before);
  }
});

test("malformed list and nonstring elements reject without normalization", () => {
  const check = predicate();
  for (const value of [undefined, null, false, "tests/unit/app.test.ts", {}, new Set(all), new Date(0)])
    assert.throws(() => check(value));
  for (const entry of [null, 1, {}, [all[0]], new String(all[0])]) {
    const files = [entry, ...all.slice(1)];
    const before = structuredClone(files);
    assert.throws(() => check(files));
    assert.deepEqual(files, before);
  }
});

test("app factory is mandatory once the candidate inventory is selected; no extra parser lane is invented", () => {
  const check = predicate();
  assert.throws(() => check(all.filter((file) => file !== "tests/unit/app.test.ts")));
  assert.throws(() => check([...all, "tests/unit/mp3-analysis.test.ts"]));
  assert.equal(subject.unitFiles.server.filter((file) => file === "tests/unit/app.test.ts").length, 1);
  assert.deepEqual(subject.unitFiles.application, ["tests/unit/frontend-response.test.ts"]);
});
