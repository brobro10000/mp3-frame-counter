/**
 * Exercise the real offline docs generator with isolated copies of its fixed inputs and installed Redoc artifacts.
 * Run after locked acquisition with `node --test tests/unit/docs-build.test.ts`; no installs, renderer execution or
 * network are needed. Each child has a 20-second/one-MiB bound, and test teardown removes only its owned temporary root.
 * Mutations never touch active dist output, original package bytes, acceptance fixtures or another test's inputs.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";
import type { TestContext } from "node:test";

const repository = fileURLToPath(new URL("../../", import.meta.url));
const input = "server/src/docs/";
const vendor = "node_modules/redoc/";
const originalPath = `${vendor}bundles/redoc.standalone.js`;
const originalHash = "dcaf76612bc4a3fbcc923a8966dee2f6146a5f32e5ce1b6f02dd60cbbf89500b";
const derivativeHash = "21ce5beb19818927f12e2db16e1a332e4f0eac5b8538012b6ecd048585b8cdbf";
const logoHash = "1dab4315f8de2177b2b2726b29e84a26314c69cd27d692228947c0058793d5a7";
const foreignLogo = "https://cdn.redoc.ly/redoc/logo-mini.svg";

/** Return a byte buffer's SHA-256 without filesystem access or mutation. */
function digest(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Copy only the generator and its exact inputs into an owned temporary root and register unconditional teardown.
 * Return fixed file/output paths and a bounded child runner; setup failures propagate and no root dist files are used.
 */
function fixture(context: TestContext) {
  const root = mkdtempSync(join(tmpdir(), "mp3-docs-build-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  for (const relative of [
    "server/src/build-docs.mjs",
    ...["openapi.json", "index.html", "init.js", "docs.css", "redoc-logo-mini.svg", "provenance.json"].map(
      (name) => `${input}${name}`,
    ),
    ...[
      "package.json",
      "LICENSE",
      "bundles/redoc.standalone.js",
      "bundles/redoc.standalone.js.map",
      "bundles/redoc.standalone.js.LICENSE.txt",
    ].map((name) => `${vendor}${name}`),
  ]) {
    mkdirSync(dirname(join(root, relative)), { recursive: true });
    copyFileSync(join(repository, relative), join(root, relative));
  }
  /** Execute only the copied generator from a different cwd; absence, timeout and signal are not policy rejections. */
  const run = (args: string[] = []) =>
    spawnSync(process.execPath, [join(root, "server/src/build-docs.mjs"), ...args], {
      cwd: tmpdir(),
      env: { PATH: dirname(process.execPath), LANG: "C.UTF-8" },
      encoding: "utf8",
      timeout: 20_000,
      maxBuffer: 1024 * 1024,
    });
  return { root, output: join(root, "dist/docs"), run };
}

/** Require a real successful child and generator completion marker; setup errors and signals fail the test. */
function passing(result: ReturnType<typeof spawnSync>): void {
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(String(result.stdout), /Offline documentation artifacts generated and verified\./);
}

/** Require the named failed build, removed stale output and no surviving owned staging directory. */
function failing(f: ReturnType<typeof fixture>, reason: RegExp, args: string[] = []): void {
  const result = f.run(args);
  assert.equal(result.error, undefined, "Generator must start and finish within its bound");
  assert.equal(result.signal, null);
  assert.equal(result.status, 1);
  assert.match(String(result.stderr), /Documentation generation failed:/);
  assert.match(String(result.stderr), reason);
  assert.equal(existsSync(f.output), false, "Failed generation must invalidate stale output");
  assert.deepEqual(readdirSync(join(f.root, "dist")), [], "Failed generation must remove owned staging output");
}

/** Return all generated relative file names recursively; unexpected filesystem entries fail instead of disappearing. */
function files(root: string, prefix = ""): string[] {
  return readdirSync(join(root, prefix), { withFileTypes: true })
    .flatMap((entry) => {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) return files(root, relative);
      assert(entry.isFile(), "Generated output must contain only regular files/directories");
      return [relative];
    })
    .sort();
}

describe("Documentation generation", () => {
  test("generation is deterministic, bounded and preserves exact original notices separately from public assets", (context) => {
    const f = fixture(context);
    passing(f.run());
    assert.deepEqual(
      files(f.output),
      [
        "assets/docs.css",
        "assets/init.js",
        "assets/redoc-logo-mini.svg",
        "assets/redoc.js",
        "index.html",
        "openapi.yaml",
        "retained/LICENSE",
        "retained/generation.json",
        "retained/provenance.json",
        "retained/redoc-package.json",
        "retained/redoc.standalone.js",
        "retained/redoc.standalone.js.LICENSE.txt",
        "retained/redoc.standalone.js.map",
      ].sort(),
    );
    const before = Object.fromEntries(files(f.output).map((path) => [path, readFileSync(join(f.output, path))]));
    assert.equal(digest(before["assets/redoc.js"]!), derivativeHash);
    assert.equal(digest(before["retained/redoc.standalone.js"]!), originalHash);
    assert.equal(digest(before["assets/redoc-logo-mini.svg"]!), logoHash);
    assert(!before["assets/redoc.js"]!.includes(Buffer.from(foreignLogo)));
    assert(!before["assets/redoc.js"]!.includes(Buffer.from("\n//# sourceMappingURL=redoc.standalone.js.map")));
    for (const [source, retained] of [
      ["LICENSE", "LICENSE"],
      ["package.json", "redoc-package.json"],
      ["bundles/redoc.standalone.js", "redoc.standalone.js"],
      ["bundles/redoc.standalone.js.map", "redoc.standalone.js.map"],
      ["bundles/redoc.standalone.js.LICENSE.txt", "redoc.standalone.js.LICENSE.txt"],
    ])
      assert.deepEqual(before[`retained/${retained}`], readFileSync(join(f.root, vendor, source!)));
    assert.deepEqual(
      JSON.parse(before["openapi.yaml"]!.toString()),
      JSON.parse(readFileSync(join(f.root, input, "openapi.json"), "utf8")),
    );
    const manifest = JSON.parse(before["retained/generation.json"]!.toString());
    assert.equal(manifest.schemaVersion, 1);
    assert.deepEqual(
      manifest.artifacts.map((entry: { path: string }) => entry.path),
      Object.keys(before)
        .filter((path) => path !== "retained/generation.json")
        .sort(),
    );
    for (const entry of manifest.artifacts) {
      assert.equal(entry.bytes, before[entry.path]!.length);
      assert.equal(entry.sha256, digest(before[entry.path]!));
    }
    assert(Object.values(before).reduce((total, bytes) => total + bytes.length, 0) <= 16 * 1024 * 1024);
    writeFileSync(join(f.output, "stale.txt"), "must not survive replacement");
    passing(f.run());
    assert.deepEqual(
      Object.fromEntries(files(f.output).map((path) => [path, readFileSync(join(f.output, path))])),
      before,
    );
  });

  test("each artifact mutation fails for its intended boundary and invalidates an earlier successful output", async (context) => {
    const cases = [
      {
        name: "wrong original bytes",
        path: originalPath,
        change: (bytes: Buffer) => Buffer.concat([Buffer.from(" "), bytes]),
        reason: /Docs renderer original hash mismatch/,
      },
      {
        name: "missing logo edit",
        path: originalPath,
        change: (bytes: Buffer) => Buffer.from(bytes.toString().replace(foreignLogo, "/missing-logo.svg")),
        reason: /exactly one selected logo URL/,
      },
      {
        name: "duplicate logo edit",
        path: originalPath,
        change: (bytes: Buffer) => Buffer.concat([bytes, Buffer.from(foreignLogo)]),
        reason: /exactly one selected logo URL/,
      },
      {
        name: "changed map trailer",
        path: originalPath,
        change: (bytes: Buffer) => Buffer.concat([bytes, Buffer.from("\n")]),
        reason: /selected terminal source-map comment/,
      },
      {
        name: "wrong original map",
        path: `${vendor}bundles/redoc.standalone.js.map`,
        change: (bytes: Buffer) => Buffer.concat([bytes, Buffer.from(" ")]),
        reason: /Docs source-map hash mismatch/,
      },
      {
        name: "wrong license",
        path: `${vendor}LICENSE`,
        change: (bytes: Buffer) => Buffer.concat([bytes, Buffer.from("\n")]),
        reason: /Docs license hash mismatch/,
      },
      {
        name: "wrong notices",
        path: `${vendor}bundles/redoc.standalone.js.LICENSE.txt`,
        change: (bytes: Buffer) => Buffer.concat([bytes, Buffer.from("\n")]),
        reason: /Docs notices hash mismatch/,
      },
      {
        name: "changed same-length logo",
        path: `${input}redoc-logo-mini.svg`,
        change: (bytes: Buffer) => {
          const result = Buffer.from(bytes);
          result[0] ^= 1;
          return result;
        },
        reason: /Docs logo hash mismatch/,
      },
      {
        name: "oversized HTML",
        path: `${input}index.html`,
        change: () => Buffer.alloc(256 * 1024 + 1, 32),
        reason: /Docs input .*index\.html exceeds its file bound/,
      },
      {
        name: "invalid UTF-8 CSS",
        path: `${input}docs.css`,
        change: () => Buffer.from([255]),
        reason: /Docs input CSS must be valid UTF-8/,
      },
      {
        name: "wrong package version",
        path: `${vendor}package.json`,
        change: (bytes: Buffer) => {
          const value = JSON.parse(bytes.toString());
          value.version = "2.5.3";
          return Buffer.from(JSON.stringify(value));
        },
        reason: /Docs package identity mismatch/,
      },
      {
        name: "wrong provenance",
        path: `${input}provenance.json`,
        change: (bytes: Buffer) => {
          const value = JSON.parse(bytes.toString());
          value.renderer.derivativeSha256 = "0".repeat(64);
          return Buffer.from(JSON.stringify(value));
        },
        reason: /Docs provenance renderer derivativeSha256 mismatch/,
      },
    ];
    for (const entry of cases)
      await context.test(entry.name, (child) => {
        const f = fixture(child);
        passing(f.run());
        const path = join(f.root, entry.path);
        const original = readFileSync(path);
        writeFileSync(path, entry.change(original));
        failing(f, entry.reason);
        writeFileSync(path, original);
        passing(f.run());
      });
  });

  test("specification references stay contained and resolved, including valid escaped own-property pointers", async (context) => {
    for (const [name, reference, reason] of [
      ["foreign", "https://example.invalid/schema.json#/Error", /Docs reference must be a local JSON pointer/],
      ["missing", "#/components/schemas/Missing", /Docs reference does not resolve/],
      ["inherited", "#/components/schemas/constructor", /Docs reference does not resolve/],
      ["bad pointer escape", "#/components/schemas/Error~2", /invalid JSON pointer escaping/],
      ["bad URI escape", "#/components/schemas/%ZZ", /invalid URI escaping/],
    ] as const)
      await context.test(name, (child) => {
        const f = fixture(child);
        passing(f.run());
        const path = join(f.root, input, "openapi.json");
        const spec = JSON.parse(readFileSync(path, "utf8"));
        spec["x-build-reference"] = { $ref: reference };
        writeFileSync(path, JSON.stringify(spec));
        failing(f, reason);
      });
    const f = fixture(context);
    const path = join(f.root, input, "openapi.json");
    const spec = JSON.parse(readFileSync(path, "utf8"));
    spec.components.schemas["own/name~value"] = { type: "string" };
    spec["x-build-reference"] = { $ref: "#/components/schemas/own~1name~0value" };
    writeFileSync(path, JSON.stringify(spec));
    passing(f.run());
  });

  test("missing required input and unexpected CLI arguments cannot retain stale successful output", (context) => {
    const f = fixture(context);
    passing(f.run());
    rmSync(join(f.root, input, "init.js"));
    failing(f, /ENOENT.*init\.js/);
    copyFileSync(join(repository, input, "init.js"), join(f.root, input, "init.js"));
    passing(f.run());
    failing(f, /Docs generator accepts no arguments/, ["--output=elsewhere"]);
  });
});
