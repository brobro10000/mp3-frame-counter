/**
 * Exercise Mermaid discovery, fail-closed CLI behavior, source/output boundaries and actual pinned SVG rendering.
 * Run `node --test scripts/mermaid.test.mjs` after `npm ci` and `npm run mermaid:install` with the pinned Node runtime.
 * Tests create disposable local Git repositories and temporary SVG output, launch sandboxed Chrome, then remove them.
 * They do not edit this repository's diagrams, stage project changes or contact diagram-supplied external services.
 * A missing browser, incorrectly accepted negative control, missing tracked diagram or boundary regression fails.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";
import {
  diagramsInFile,
  discoverDiagrams,
  packageAssetRequest,
  prepareOutputDirectory,
  renderDiagrams,
} from "./check-mermaid.mjs";

const cli = fileURLToPath(new URL("./check-mermaid.mjs", import.meta.url));
async function fixture(t, files = {}) {
  const root = await mkdtemp(join(tmpdir(), "mermaid-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  execFileSync("git", ["init", "-q"], { cwd: root });
  for (const [file, source] of Object.entries(files)) {
    await mkdir(dirname(join(root, file)), { recursive: true });
    await writeFile(join(root, file), source);
    execFileSync("git", ["add", "--", file], { cwd: root });
  }
  return realpath(root);
}

test("CommonMark discovery covers quoted, list, tilde and longer fences with original line locations", () => {
  const source = [
    "# Diagrams",
    "",
    "> ~~~mermaid",
    "> graph TD",
    "> A-->B",
    "> ~~~",
    "",
    "- Item",
    "",
    "  ````MERMAID title",
    "  sequenceDiagram",
    "  A->>B: Hi",
    "  ````",
    "",
    "````text",
    "```mermaid",
    "not a real nested fence",
    "```",
    "````",
  ].join("\n");
  const diagrams = diagramsInFile("nested.md", source);
  assert.deepEqual(
    diagrams.map(({ line }) => line),
    [4, 11],
  );
  assert.equal(diagrams[0].source, "graph TD\nA-->B\n");
  assert.equal(diagrams[1].source, "sequenceDiagram\nA->>B: Hi\n");
});

test("Git discovery includes archived Markdown and standalone files but ignores untracked inputs", async (t) => {
  const root = await fixture(t, {
    "docs/first.md": "```mermaid\ngraph TD\nA-->B\n```\n",
    "agents/history/old.markdown": "~~~mermaid\nsequenceDiagram\nA->>B: Hi\n~~~\n",
    "docs/direct.mmd": "graph TD\nA-->B\n",
    "docs/other.MERMAID": "graph LR\nC-->D\n",
    "original.txt": "```mermaid\nmalformed historical capture\n```\n",
  });
  await writeFile(join(root, "untracked.md"), "```mermaid\nmalformed\n```\n");
  assert.deepEqual(
    (await discoverDiagrams(root)).map(({ file }) => file),
    ["agents/history/old.markdown", "docs/direct.mmd", "docs/first.md", "docs/other.MERMAID"],
  );
});

test("zero discovery, missing tracked source and empty diagrams fail instead of silently passing", async (t) => {
  const root = await fixture(t, { "README.md": "No diagrams yet.\n" });
  await assert.rejects(discoverDiagrams(root), /No tracked Mermaid/);
  await rm(join(root, "README.md"));
  await assert.rejects(discoverDiagrams(root), /ENOENT/);
  await assert.rejects(renderDiagrams([], root), /No Mermaid diagrams/);
});

test("source symlinks and redirected artifact parents are rejected before target writes", async (t) => {
  const root = await fixture(t, { "docs/source.md": "```mermaid\ngraph TD\nA-->B\n```\n" });
  await symlink(join(root, "docs/source.md"), join(root, "linked.md"));
  execFileSync("git", ["add", "linked.md"], { cwd: root });
  await assert.rejects(discoverDiagrams(root), /unsafe source path/);
  await symlink(join(root, "docs"), join(root, ".artifacts"));
  await assert.rejects(prepareOutputDirectory(root), /real directories/);
  await assert.rejects(readFile(join(root, "docs/mermaid/result.json")), /ENOENT/);
});

test("asset boundary denies remote URLs, source files and symlink escapes", async (t) => {
  const root = await fixture(t, { "asset/index.js": "export {};", "secret.txt": "private" });
  const assets = join(root, "asset");
  await symlink(join(root, "secret.txt"), join(assets, "escape.js"));
  assert(await packageAssetRequest(pathToFileURL(join(assets, "index.js")).href, assets));
  assert(await packageAssetRequest(`https://mermaid-cli-intercept.invalid${join(assets, "index.js")}`, assets));
  assert.equal(await packageAssetRequest("https://example.com/image.svg", assets), false);
  const remoteFile = pathToFileURL(join(assets, "index.js"));
  remoteFile.hostname = "remote-server";
  assert.equal(await packageAssetRequest(remoteFile.href, assets), false);
  assert.equal(await packageAssetRequest(pathToFileURL(join(root, "secret.txt")).href, assets), false);
  assert.equal(await packageAssetRequest(pathToFileURL(join(assets, "escape.js")).href, assets), false);
  assert.equal(await packageAssetRequest(pathToFileURL(root).href, assets), false);
});

test("real renderer emits SVG and rejects syntax, invalid sequence activation, semicolon notes and empty input", async (t) => {
  const root = await fixture(t);
  const output = await prepareOutputDirectory(root);
  const sources = [
    "flowchart LR\nA[Start] --> B[Done]",
    "sequenceDiagram\nA->>+B: Begin\nB-->>-A: Done",
    "flowchart TD\nA -->",
    "sequenceDiagram\nparticipant Alice\ndeactivate Alice",
    "sequenceDiagram\nNote over A: Discard bodies; no retention",
    "",
    'flowchart LR\nA@{ img: "https://example.com/remote.png", label: "External" }',
  ];
  const report = await renderDiagrams(
    sources.map((source, index) => ({ file: `case-${index}.md`, line: 3, source })),
    output,
  );
  assert.equal(report.passed, false);
  assert.equal(report.discovered, 7);
  assert.equal(report.rendered, 2);
  assert.deepEqual(
    report.results.map(({ passed }) => passed),
    [true, true, false, false, false, false, false],
  );
  assert.match(report.results[2].error, /Parse error|Syntax error/i);
  assert.match(report.results[3].error, /inactive participant/i);
  assert.match(report.results[4].error, /Parse error|Syntax error/i);
  assert.match(report.results[5].error, /Empty Mermaid/);
  assert.match(report.results[6].error, /outside installed renderer assets/);
  for (const result of report.results.filter(({ passed }) => passed)) {
    assert.match(await readFile(join(output, result.svg), "utf8"), /<svg/);
  }
  assert.deepEqual(JSON.parse(await readFile(join(output, "result.json"), "utf8")), report);
});

test("CLI returns nonzero with source diagnostics for a malformed tracked standalone diagram", async (t) => {
  const root = await fixture(t, { "bad.mmd": "sequenceDiagram\nparticipant A\ndeactivate A\n" });
  const result = spawnSync(process.execPath, [cli], { cwd: root, encoding: "utf8", timeout: 60000 });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /FAIL bad\.mmd:1/);
  assert.match(result.stdout, /inactive participant/i);
  assert.match(result.stderr, /One or more Mermaid diagrams failed/);
});

test("CLI rejects zero discovery and arguments that would narrow mandatory coverage", async (t) => {
  const root = await fixture(t);
  const empty = spawnSync(process.execPath, [cli], { cwd: root, encoding: "utf8", timeout: 30000 });
  assert.equal(empty.status, 1);
  assert.match(empty.stderr, /No tracked Mermaid/);
  const filtered = spawnSync(process.execPath, [cli, "--skip-archives"], {
    cwd: root,
    encoding: "utf8",
    timeout: 30000,
  });
  assert.equal(filtered.status, 1);
  assert.match(filtered.stderr, /no paths, filters or skip options/);
});
