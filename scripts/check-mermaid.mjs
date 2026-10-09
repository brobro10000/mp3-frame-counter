/**
 * Discover and render every Git-tracked Markdown Mermaid fence and .mmd/.mermaid file, including archived documents.
 * Run `npm run mermaid:install` once after `npm ci`, then `npm run check:mermaid` from the repository root; no filters.
 * CommonMark discovery preserves source locations; the pinned official Mermaid CLI renders SVG through pinned Chrome.
 * Reads working-tree bytes for tracked paths. Writes only ignored .artifacts/mermaid SVGs and a result.json report,
 * replacing that owned output directory, and uses Puppeteer's temporary browser profile. Never rewrites source files.
 * Browser requests are restricted to installed package assets; sandboxing stays enabled. Each render has a 30s limit.
 * Missing tools/browser, unsafe paths, zero diagrams, parse/render failures or cleanup failures exit nonzero.
 * This validates rendering with the locked local toolchain, not GitHub's independently updated Markdown renderer.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import MarkdownIt from "markdown-it";
import puppeteer, { PUPPETEER_REVISIONS } from "puppeteer";
import { renderMermaid } from "@mermaid-js/mermaid-cli";

const markdown = new MarkdownIt("commonmark");
const markdownExtension = /\.(md|markdown|mdown|mkdn|mkd)$/i;
const diagramExtension = /\.(mmd|mermaid)$/i;
const digest = (value) => createHash("sha256").update(value).digest("hex");
const contained = (root, path) => {
  const pathFromRoot = relative(root, path);
  return (
    pathFromRoot !== "" && pathFromRoot !== ".." && !isAbsolute(pathFromRoot) && !pathFromRoot.startsWith(`..${sep}`)
  );
};

// Parse Markdown rather than matching lines: fenced code inside lists/quotes and longer/tilde fences is still code.
export function diagramsInFile(file, source) {
  if (diagramExtension.test(file)) return [{ file, line: 1, source }];
  if (!markdownExtension.test(file)) return [];
  return markdown
    .parse(source, {})
    .filter((token) => token.type === "fence" && token.info.trim().split(/\s+/)[0].toLowerCase() === "mermaid")
    .map((token) => ({ file, line: token.map[0] + 2, source: token.content }));
}

export async function discoverDiagrams(root) {
  const canonicalRoot = await realpath(root);
  const files = execFileSync("git", ["ls-files", "-z"], { cwd: canonicalRoot, encoding: "utf8" })
    .split("\0")
    .filter((file) => markdownExtension.test(file) || diagramExtension.test(file))
    .sort();
  const diagrams = [];
  for (const file of files) {
    const path = join(canonicalRoot, file);
    assert(
      (await lstat(path)).isFile() && contained(canonicalRoot, await realpath(path)),
      `${file}: unsafe source path`,
    );
    diagrams.push(...diagramsInFile(file, await readFile(path, "utf8")));
  }
  assert(diagrams.length > 0, "No tracked Mermaid diagrams discovered; refusing an empty validation pass");
  return diagrams;
}

// Check output parents before deletion/creation so a symlink cannot redirect generated files into source or elsewhere.
export async function prepareOutputDirectory(root) {
  let path = await realpath(root);
  for (const part of [".artifacts", "mermaid"]) {
    path = join(path, part);
    try {
      assert((await lstat(path)).isDirectory(), "Mermaid artifact directories must be real directories, not symlinks");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await mkdir(path);
    }
  }
  await rm(path, { recursive: true });
  await mkdir(path);
  return path;
}

// Official CLI assets use an intercepted .invalid origin, never a real web server. Resolve symlinks before permitting.
export async function packageAssetRequest(url, assetRoot) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "file:" && parsed.origin !== "https://mermaid-cli-intercept.invalid") return false;
    if (parsed.username || parsed.password || (parsed.protocol === "file:" && parsed.hostname)) return false;
    const file = fileURLToPath(new URL(`file://${parsed.pathname}`));
    return contained(assetRoot, await realpath(file));
  } catch {
    return false;
  }
}

function diagnostic(error) {
  // Browser exception stacks contain machine paths; retain Mermaid's useful message and diagram-relative lines only.
  return String(error.message ?? error)
    .split(/\n\s+at |\nObject\./)[0]
    .replaceAll(/file:\/\/\S+|https:\/\/mermaid-cli-intercept\.invalid\S+/g, "<renderer asset>")
    .slice(0, 2000);
}

export async function renderDiagrams(diagrams, outputDirectory) {
  assert(diagrams.length > 0, "No Mermaid diagrams supplied; refusing an empty validation pass");
  const results = [];
  const browser = await puppeteer.launch({ browser: "chrome", headless: true, timeout: 30000, protocolTimeout: 30000 });
  try {
    assert.equal(await browser.version(), `Chrome/${PUPPETEER_REVISIONS.chrome}`, "Install the pinned Mermaid Chrome");
    const assetRoot = await realpath(
      resolve(dirname(fileURLToPath(import.meta.resolve("@mermaid-js/mermaid-cli"))), "../../.."),
    );
    for (const [index, diagram] of diagrams.entries()) {
      const record = { file: diagram.file, line: diagram.line, sourceSha256: digest(diagram.source), passed: false };
      let timer;
      let blockedRequest = false;
      const pages = [];
      try {
        assert(diagram.source.trim(), "Empty Mermaid diagram");
        // Adapt only newPage, the official renderMermaid API's browser dependency, to apply policy before navigation.
        const localBrowser = {
          async newPage() {
            const page = await browser.newPage();
            pages.push(page);
            await page.setRequestInterception(true);
            page.on("request", async (request) => {
              if (await packageAssetRequest(request.url(), assetRoot)) {
                // The CLI's own interceptor responds to its virtual origin; only the initial file navigation needs us.
                if (request.url().startsWith("file:")) await request.continue({}, 0);
              } else {
                blockedRequest = true;
                await request.abort("blockedbyclient", 1);
              }
            });
            return page;
          },
        };
        const { data } = await Promise.race([
          renderMermaid(localBrowser, diagram.source, "svg", {
            viewport: { width: 1600, height: 1000, deviceScaleFactor: 1 },
            fontEmbed: false,
            mermaidConfig: {
              securityLevel: "strict",
              deterministicIds: true,
              deterministicIDSeed: record.sourceSha256,
            },
          }),
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error("Mermaid render exceeded 30 seconds")), 30000);
          }),
        ]);
        assert(!blockedRequest, "Diagram requested a resource outside installed renderer assets");
        assert(Buffer.from(data).toString("utf8").includes("<svg"), "Renderer did not produce SVG");
        record.svg = `${String(index + 1).padStart(3, "0")}-${record.sourceSha256.slice(0, 12)}.svg`;
        await writeFile(join(outputDirectory, record.svg), data, { flag: "wx" });
        record.passed = true;
      } catch (error) {
        record.error = blockedRequest
          ? "Diagram requested a resource outside installed renderer assets"
          : diagnostic(error);
      } finally {
        clearTimeout(timer);
        await Promise.all(pages.filter((page) => !page.isClosed()).map((page) => page.close()));
      }
      results.push(record);
    }
  } finally {
    await browser.close();
  }
  const report = {
    passed: results.every((result) => result.passed),
    discovered: diagrams.length,
    rendered: results.filter((result) => result.passed).length,
    chrome: PUPPETEER_REVISIONS.chrome,
    results,
  };
  await writeFile(join(outputDirectory, "result.json"), `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  return report;
}

export async function checkMermaid(root) {
  const outputDirectory = await prepareOutputDirectory(root);
  const diagrams = await discoverDiagrams(root);
  const report = await renderDiagrams(diagrams, outputDirectory);
  for (const result of report.results) {
    console.log(
      `${result.passed ? "PASS" : "FAIL"} ${result.file}:${result.line}${result.error ? `\n${result.error}` : ""}`,
    );
  }
  console.log(`Mermaid: ${report.rendered}/${report.discovered} rendered; SVGs and result.json in .artifacts/mermaid/`);
  assert(report.passed, "One or more Mermaid diagrams failed to render");
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    assert.equal(process.argv.length, 2, "check:mermaid accepts no paths, filters or skip options");
    const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
    await checkMermaid(root);
  } catch (error) {
    console.error(`Mermaid validation failed: ${diagnostic(error)}`);
    process.exitCode = 1;
  }
}
