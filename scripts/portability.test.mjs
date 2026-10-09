/**
 * Exercise the portability guard against leaked paths and a real temporary Git checkout.
 * Run through `npm run test:tooling`. Synthetic home paths are assembled at runtime so the test source itself
 * stays portable. A temporary checkout confirms tracked reports are rejected, ignored local files are excluded,
 * and diagnostics do not echo private contents. All temporary files are removed after each integration case.
 */

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { findLocalPaths } from "./check-portability.mjs";

const unixHome = ["", "Users", "private-fixture", "checkout"].join("/");
const linuxHome = ["", "home", "private-fixture", "checkout"].join("/");
const windowsHome = ["C:", "Users", "private-fixture", "checkout"].join("\\");

test("portability guard rejects home paths, JSON escaping, local file URLs and machine-specific installs", () => {
  for (const value of [
    unixHome,
    linuxHome,
    windowsHome,
    ["D:", "workspace", "repo"].join("/"),
    ["", "var", "folders", "fixture", "cache"].join("/"),
    ["", "opt", "homebrew", "bin", "node"].join("/"),
  ]) {
    assert(findLocalPaths(value).length > 0);
    assert(findLocalPaths(JSON.stringify({ location: value })).length > 0);
  }
  assert(findLocalPaths(JSON.stringify({ root: unixHome }).replaceAll("/", "\\/")).length > 0);
  assert(findLocalPaths(["file:", unixHome].join("//")).length > 0);
});

test("portability guard permits relative paths, environment placeholders and web URLs", () => {
  const content = [
    "docs/requirements/assessment.md",
    "../samples/fixture.mp3",
    ".",
    "$HOME/tool",
    "${PROJECT_ROOT}/docs",
    "https://example.test/home/fixture",
    "https://example.test/Users/fixture",
    "https://example.test/file:guide",
  ].join("\n");
  assert.deepEqual(findLocalPaths(content), []);
  assert.equal(findLocalPaths(`safe\n${unixHome}`)[0].line, 2);
});

test("CLI scans tracked files in a relocated checkout and redacts diagnostics", () => {
  const directory = mkdtempSync(join(tmpdir(), "portable checkout "));
  try {
    mkdirSync(join(directory, "scripts"));
    copyFileSync(new URL("./check-portability.mjs", import.meta.url), join(directory, "scripts/check-portability.mjs"));
    execFileSync("git", ["init", "--quiet", directory]);
    writeFileSync(join(directory, ".gitignore"), "local-only.json\n");
    writeFileSync(join(directory, "local-only.json"), JSON.stringify({ root: unixHome }));
    writeFileSync(join(directory, "report.json"), JSON.stringify({ root: unixHome }));
    execFileSync("git", ["add", "."], { cwd: directory });
    const run = () =>
      spawnSync(process.execPath, [join(directory, "scripts/check-portability.mjs")], {
        cwd: tmpdir(),
        encoding: "utf8",
      });
    const failed = run();
    assert.equal(failed.status, 1);
    assert.match(failed.stderr, /report\.json:1: user home directory/);
    assert(!failed.stderr.includes("private-fixture"));
    assert(!failed.stderr.includes("local-only.json"));
    writeFileSync(join(directory, "report.json"), JSON.stringify({ root: "." }));
    const passed = run();
    assert.equal(passed.status, 0, passed.stderr);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
