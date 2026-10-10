/**
 * Independent RUNTIME-POLICY expectations for direct dependency admission and the actual repository-policy entrypoint.
 *
 * Run `node --test scripts/runtime-dependency-policy.test.mjs` with the pinned Node/npm runtime. Synthetic parsed JSON
 * defines decisions before implementation; missing exports fail outside rejection assertions. CLI fixtures copy only
 * governance metadata into disposable, isolated Git histories and execute the real policy script without installation,
 * network, product code or source-repository Git mutation. Child failures are bounded; cleanup always removes fixtures.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const moduleUrl = new URL("./runtime-dependency-policy.mjs", import.meta.url);
const subject = existsSync(moduleUrl) ? await import(moduleUrl.href) : {};
const repository = fileURLToPath(new URL("../", import.meta.url));
const integrity = `sha512-${Buffer.alloc(64, 17).toString("base64")}`;
const directPath = "node_modules/fastify";

/** Require the API before supplying either valid or invalid data; import absence is never an expected rejection. */
function predicate() {
  assert.equal(typeof subject.requireRuntimeDependencyPolicy, "function", "Missing RUNTIME-POLICY pure API");
  return subject.requireRuntimeDependencyPolicy;
}

/** Construct a minimal npm-v3 metadata graph; versions and hashes are synthetic, never package recommendations. */
function graph(version = undefined) {
  const pkg = { name: "independent-policy-fixture", version: "0.0.0" };
  const lock = { name: pkg.name, version: pkg.version, lockfileVersion: 3, packages: { "": { ...pkg } } };
  if (version !== undefined) {
    pkg.dependencies = { fastify: version };
    lock.packages[""].dependencies = { fastify: version };
    lock.packages[directPath] = {
      version,
      resolved: `https://registry.npmjs.org/fastify/-/fastify-${version}.tgz`,
      integrity,
    };
  }
  return { pkg, lock };
}

/** Copy fixture values without freezing or normalizing their types/prototypes; no cyclic or accessor inputs are used. */
function snapshot(value) {
  if (!value || typeof value !== "object") return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) return value.map(snapshot);
  return Object.assign(
    Object.create(Object.getPrototypeOf(value)),
    Object.fromEntries(Object.entries(value).map(([key, child]) => [key, snapshot(child)])),
  );
}

/** Invalid inputs remain mutable: mutation followed by a throw must fail rather than masquerade as valid rejection. */
function rejectedUnchanged(check, pkg, lock, label) {
  const before = snapshot([pkg, lock]);
  assert.throws(() => check(pkg, lock), undefined, label);
  assert.deepEqual([pkg, lock], before, `${label}: rejection must preserve input values and prototypes`);
}

/** Assert a labeled table of independently supplied mutations; every case starts from a fresh valid graph. */
function rejected(cases, make = () => graph("5.0.0")) {
  const check = predicate();
  for (const [label, mutate] of cases) {
    const { pkg, lock } = make();
    mutate(pkg, lock);
    rejectedUnchanged(check, pkg, lock, label);
  }
}

/** Freeze the whole input to expose mutation while preserving null-prototype records used in positive cases. */
function freeze(value) {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

test("legacy absent and empty runtime declarations remain equivalent without rewriting inputs", () => {
  const check = predicate();
  for (const packageEmpty of [false, true]) {
    for (const lockEmpty of [false, true]) {
      const { pkg, lock } = graph();
      if (packageEmpty) pkg.dependencies = {};
      if (lockEmpty) lock.packages[""].dependencies = {};
      const before = JSON.stringify([pkg, lock]);
      assert.equal(check(freeze(pkg), freeze(lock)), undefined);
      assert.equal(JSON.stringify([pkg, lock]), before);
    }
  }
});

test("ordinary null-prototype records and canonical stable safe-integer pins are accepted", () => {
  const check = predicate();
  for (const version of ["0.0.0", "5.0.0", "9007199254740991.0.0", "0.9007199254740991.9007199254740991"]) {
    const { pkg, lock } = graph(version);
    for (const value of [pkg, pkg.dependencies, lock, lock.packages, lock.packages[""], lock.packages[""].dependencies])
      Object.setPrototypeOf(value, null);
    Object.setPrototypeOf(lock.packages[directPath], null);
    const before = JSON.stringify([pkg, lock]);
    assert.equal(check(freeze(pkg), freeze(lock)), undefined, version);
    assert.equal(JSON.stringify([pkg, lock]), before);
  }
});

test("normal production metadata permits explicit false flags and legitimate transitive ranges", () => {
  const check = predicate();
  const { pkg, lock } = graph("5.0.0");
  Object.assign(lock.packages[directPath], {
    dev: false,
    devOptional: false,
    optional: false,
    peer: false,
    license: "MIT",
    engines: { node: ">=20" },
    dependencies: { "synthetic-transitive": "^2.0.0" },
  });
  lock.packages["node_modules/synthetic-transitive"] = {
    version: "2.1.0",
    resolved: "https://registry.npmjs.org/synthetic-transitive/-/synthetic-transitive-2.1.0.tgz",
    integrity,
    dependencies: { "synthetic-leaf": ">=1 <3" },
  };
  assert.equal(check(freeze(pkg), freeze(lock)), undefined);
});

test("development-only transitive Fastify is allowed without imposing direct-pin syntax", () => {
  const check = predicate();
  const { pkg, lock } = graph();
  lock.packages[directPath] = {
    dev: true,
    version: "5.0.0-next.1",
    resolved: "https://registry.npmjs.org/fastify/-/fastify-5.0.0-next.1.tgz",
    integrity,
    dependencies: { "synthetic-transitive": "^2.0.0" },
  };
  assert.equal(check(freeze(pkg), freeze(lock)), undefined);
});

test("alternate declaration channels may be absent or explicitly empty in both root records", () => {
  const check = predicate();
  for (const version of [undefined, "5.0.0"]) {
    const { pkg, lock } = graph(version);
    for (const root of [pkg, lock.packages[""]]) {
      for (const key of ["optionalDependencies", "peerDependencies", "peerDependenciesMeta", "overrides"])
        root[key] = Object.create(null);
      root.bundleDependencies = [];
      root.bundledDependencies = [];
    }
    assert.equal(check(freeze(pkg), freeze(lock)), undefined);
  }
});

test("malformed package, lock, packages and lock-root records fail closed", () => {
  const check = predicate();
  for (const invalid of [undefined, null, false, 3, "metadata", [], new Date(0), Object.create({ inherited: true })]) {
    const { pkg, lock } = graph();
    rejectedUnchanged(check, invalid, lock, "malformed package");
    rejectedUnchanged(check, pkg, invalid, "malformed lock");
    rejectedUnchanged(check, pkg, { ...lock, packages: invalid }, "malformed packages map");
    rejectedUnchanged(check, pkg, { ...lock, packages: { "": invalid } }, "malformed lock root");
  }
  rejected([
    ["missing root", (_pkg, lock) => delete lock.packages[""]],
    ...[undefined, null, "3", 2, 4].map((version) => [
      `lock schema ${String(version)}`,
      (_pkg, lock) => (lock.lockfileVersion = version),
    ]),
  ]);
});

test("runtime maps reject malformed types and inherited declarations", () => {
  rejected(
    [null, false, 1, "fastify", [], Object.create({ fastify: "5.0.0" })].flatMap((value, index) => [
      [`package map ${index}`, (pkg) => (pkg.dependencies = value)],
      [`lock-root map ${index}`, (_pkg, lock) => (lock.packages[""].dependencies = value)],
    ]),
  );
});

test("only lowercase Fastify may be a direct runtime key, alone", () => {
  rejected(
    ["express", "mp3-parser", "music-metadata", "@fixture/parser", "Fastify", "fastify "].flatMap((name) => [
      [
        `unknown only ${name}`,
        (pkg, lock) => {
          pkg.dependencies = lock.packages[""].dependencies = { [name]: "5.0.0" };
        },
      ],
      [
        `second dependency ${name}`,
        (pkg, lock) => {
          pkg.dependencies[name] = lock.packages[""].dependencies[name] = "5.0.0";
        },
      ],
    ]),
  );
});

test("complete sole-package graphs reject forbidden names without an orphan Fastify or lock mismatch", () => {
  const check = predicate();
  for (const name of ["express", "mp3-parser", "music-metadata", "@fixture/parser"]) {
    const { pkg, lock } = graph();
    pkg.dependencies = { [name]: "5.0.0" };
    lock.packages[""].dependencies = { [name]: "5.0.0" };
    lock.packages[`node_modules/${name}`] = {
      version: "5.0.0",
      resolved: `https://registry.npmjs.org/${name}/-/${name.split("/").at(-1)}-5.0.0.tgz`,
      integrity,
    };
    rejectedUnchanged(check, pkg, lock, `complete forbidden graph: ${name}`);
  }
});

test("direct pins reject noncanonical syntax, unstable versions and unsafe integers", () => {
  rejected(
    [
      "^5.0.0",
      "~5.0.0",
      "*",
      "latest",
      ">=5.0.0",
      "5.0.0 || 6.0.0",
      "v5.0.0",
      "=5.0.0",
      "5",
      "5.0",
      "05.0.0",
      "5.00.0",
      "5.0.00",
      "-5.0.0",
      "+5.0.0",
      "5.0.0-beta.1",
      "5.0.0+build.1",
      " 5.0.0",
      "5.0.0 ",
      "5.0.0\n",
      "5.0.0\r\n",
      "5.0.0\t",
      "5.0.0\0",
      "５.0.0",
      "9007199254740992.0.0",
      "0.9007199254740992.0",
      "0.0.9007199254740992",
      "1e1.0.0",
      "",
      null,
      false,
      5,
      {},
      [],
    ].map((version, index) => [
      `invalid pin ${index}`,
      (pkg, lock) => {
        pkg.dependencies.fastify = lock.packages[""].dependencies.fastify = version;
      },
    ]),
  );
});

test("alternate source and alias syntax cannot masquerade as a direct pin", () => {
  rejected(
    [
      "npm:fastify@5.0.0",
      "npm:mp3-parser@5.0.0",
      "https://registry.npmjs.org/fastify/-/fastify-5.0.0.tgz",
      "git+https://github.com/fixture/fastify.git#v5",
      "git@github.com:fixture/fastify.git",
      "github:fixture/fastify",
      "file:../fastify",
      "link:../fastify",
      "workspace:*",
      "../fastify",
      "/tmp/fastify",
      ["C:", "fixture", "fastify"].join("\\"),
    ].map((version) => [
      version,
      (pkg, lock) => {
        pkg.dependencies.fastify = lock.packages[""].dependencies.fastify = version;
      },
    ]),
  );
});

test("synchronized invalid-version graphs require syntax validation rather than declaration mismatch", () => {
  const check = predicate();
  for (const version of [
    "^5.0.0",
    "~5.0.0",
    "*",
    "latest",
    ">=5.0.0",
    "5.0.0 || 6.0.0",
    "v5.0.0",
    "=5.0.0",
    "5",
    "5.0",
    "05.0.0",
    "5.00.0",
    "5.0.00",
    "-5.0.0",
    "+5.0.0",
    "5.0.0-beta.1",
    "5.0.0+build.1",
    " 5.0.0",
    "5.0.0 ",
    "5.0.0\n",
    "5.0.0\r\n",
    "5.0.0\t",
    "5.0.0\0",
    "５.0.0",
    "9007199254740992.0.0",
    "0.9007199254740992.0",
    "0.0.9007199254740992",
    "1e1.0.0",
    "",
  ]) {
    const { pkg, lock } = graph(version);
    rejectedUnchanged(check, pkg, lock, `synchronized invalid pin: ${JSON.stringify(version)}`);
  }
});

test("synchronized alias and source graphs cannot evade direct source restrictions", () => {
  const check = predicate();
  for (const version of [
    "npm:fastify@5.0.0",
    "npm:mp3-parser@5.0.0",
    "https://registry.npmjs.org/fastify/-/fastify-5.0.0.tgz",
    "git+https://github.com/fixture/fastify.git#v5",
    "git@github.com:fixture/fastify.git",
    "github:fixture/fastify",
    "file:../fastify",
    "link:../fastify",
    "workspace:*",
    "../fastify",
    "/tmp/fastify",
    ["C:", "fixture", "fastify"].join("\\"),
  ]) {
    const { pkg, lock } = graph(version);
    rejectedUnchanged(check, pkg, lock, `synchronized alternate source: ${version}`);
  }
});

test("negative-input control distinguishes clean rejection from mutation followed by rejection", () => {
  const clean = graph("5.0.0");
  rejectedUnchanged(
    () => {
      throw new Error("Synthetic rejection");
    },
    clean.pkg,
    clean.lock,
    "clean control",
  );
  for (const side of ["package", "lock"]) {
    const { pkg, lock } = graph("5.0.0");
    assert.throws(
      () =>
        rejectedUnchanged(
          (inputPackage, inputLock) => {
            if (side === "package") inputPackage.dependencies.fastify = "6.0.0";
            else inputLock.packages[directPath].version = "6.0.0";
            throw new Error("Synthetic mutation then rejection");
          },
          pkg,
          lock,
          `${side} mutation control`,
        ),
      /rejection must preserve input values and prototypes/,
    );
  }
});

test("package and lock-root declarations agree after absence/empty normalization only", () => {
  rejected([
    ["missing lock declaration", (_pkg, lock) => delete lock.packages[""].dependencies],
    ["empty lock declaration", (_pkg, lock) => (lock.packages[""].dependencies = {})],
    ["missing package declaration", (pkg) => delete pkg.dependencies],
    ["different exact pin", (_pkg, lock) => (lock.packages[""].dependencies.fastify = "5.0.1")],
    ["extra lock dependency", (_pkg, lock) => (lock.packages[""].dependencies.other = "1.0.0")],
    ["wrong lock key", (_pkg, lock) => (lock.packages[""].dependencies = { Fastify: "5.0.0" })],
  ]);
});

test("direct dependency requires the matching ordinary installed Fastify record", () => {
  rejected([
    ["missing installed record", (_pkg, lock) => delete lock.packages[directPath]],
    ...[null, [], "5.0.0", Object.create({ version: "5.0.0" })].map((value, index) => [
      `malformed installed ${index}`,
      (_pkg, lock) => (lock.packages[directPath] = value),
    ]),
    ["different installed version", (_pkg, lock) => (lock.packages[directPath].version = "5.0.1")],
    ["missing installed version", (_pkg, lock) => delete lock.packages[directPath].version],
    ["numeric installed version", (_pkg, lock) => (lock.packages[directPath].version = 5)],
  ]);
});

test("direct Fastify cannot be dev-only, optional-only, peer-only or a link", () => {
  rejected([
    ...["dev", "devOptional", "optional", "peer"].flatMap((flag) =>
      [true, null, 0, "false"].map((value) => [
        `${flag}=${String(value)}`,
        (_pkg, lock) => {
          lock.packages[directPath][flag] = value;
        },
      ]),
    ),
    ...[true, false, null].map((value) => [
      `link=${String(value)}`,
      (_pkg, lock) => {
        lock.packages[directPath].link = value;
      },
    ]),
  ]);
});

test("undeclared installed Fastify requires an explicit development-only identity", () => {
  rejected(
    [undefined, false, null, "true", 1].map((dev) => [
      `orphan dev=${String(dev)}`,
      (_pkg, lock) => {
        lock.packages[directPath] = {
          ...graph("5.0.0").lock.packages[directPath],
          ...(dev === undefined ? {} : { dev }),
        };
      },
    ]),
    () => graph(),
  );
});

test("direct tarball resolution is the exact uncredentialed npm package/version URL", () => {
  rejected(
    [
      undefined,
      null,
      "",
      "http://registry.npmjs.org/fastify/-/fastify-5.0.0.tgz",
      "https://registry.example.invalid/fastify/-/fastify-5.0.0.tgz",
      "https://registry.npmjs.org/other/-/other-5.0.0.tgz",
      "https://registry.npmjs.org/fastify/-/fastify-5.0.1.tgz",
      "https://user:synthetic@registry.npmjs.org/fastify/-/fastify-5.0.0.tgz",
      "https://registry.npmjs.org/fastify/-/fastify-5.0.0.tgz?download=1",
      "https://registry.npmjs.org/fastify/-/fastify-5.0.0.tgz#fragment",
      "https://registry.npmjs.org/fastify/-/fastify-5.0.0.tgz\n",
      "file:./fastify.tgz",
    ].map((resolved, index) => [
      `resolution ${index}`,
      (_pkg, lock) => {
        lock.packages[directPath].resolved = resolved;
      },
    ]),
  );
});

test("direct integrity is one canonical SHA-512 token with exactly 64 decoded bytes", () => {
  const noncanonical = `${integrity.slice(0, -3)}R==`; // Same decoded last byte with nonzero discarded padding bits.
  assert.equal(Buffer.from(noncanonical.slice(7), "base64").length, 64);
  assert.equal(Buffer.from(noncanonical.slice(7), "base64").toString("base64"), integrity.slice(7));
  rejected(
    [
      undefined,
      null,
      1,
      "",
      "sha512-",
      `sha256-${Buffer.alloc(32).toString("base64")}`,
      `sha512-${Buffer.alloc(63).toString("base64")}`,
      `sha512-${Buffer.alloc(65).toString("base64")}`,
      `${integrity} ${integrity}`,
      ` ${integrity}`,
      `${integrity}\n`,
      integrity.slice(0, -2),
      noncanonical,
      `SHA512-${integrity.slice(7)}`,
      `${integrity}?option`,
      `sha512-${"-".repeat(86)}==`,
    ].map((value, index) => [
      `integrity ${index}`,
      (_pkg, lock) => {
        lock.packages[directPath].integrity = value;
      },
    ]),
  );
});

test("root alternate map channels cannot add runtime packages or malformed empty aliases", () => {
  for (const version of [undefined, "5.0.0"])
    rejected(
      ["optionalDependencies", "peerDependencies", "peerDependenciesMeta", "overrides"].flatMap((field) =>
        ["package", "lock"].flatMap((side) =>
          [{ "mp3-parser": "1.0.0" }, null, false, [], "", Object.create({ inherited: true })].map((value, index) => [
            `${side}.${field} ${index}`,
            (pkg, lock) => ((side === "package" ? pkg : lock.packages[""])[field] = value),
          ]),
        ),
      ),
      () => graph(version),
    );
});

test("both bundle spellings reject nonempty or malformed arrays on package and lock roots", () => {
  for (const version of [undefined, "5.0.0"])
    rejected(
      ["bundleDependencies", "bundledDependencies"].flatMap((field) =>
        ["package", "lock"].flatMap((side) =>
          [["mp3-parser"], {}, null, false, true, ""].map((value, index) => [
            `${side}.${field} ${index}`,
            (pkg, lock) => ((side === "package" ? pkg : lock.packages[""])[field] = value),
          ]),
        ),
      ),
      () => graph(version),
    );
});

/**
 * Build a disposable CLI fixture from copied package metadata; optional synthetic input isolates changing source data.
 * The caller's record remains owned by the caller. No product/acceptance code or executable hooks are copied.
 */
function policyFixture(t, sourcePackage = JSON.parse(readFileSync(join(repository, "package.json"), "utf8"))) {
  const root = mkdtempSync(join(tmpdir(), "mp3-runtime-policy-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const env = {
    PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH}`,
    HOME: root,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: join(root, "empty-gitconfig"),
    GIT_TERMINAL_PROMPT: "0",
    GIT_AUTHOR_NAME: "Independent Runtime Fixture",
    GIT_AUTHOR_EMAIL: "runtime@example.invalid",
    GIT_COMMITTER_NAME: "Independent Runtime Fixture",
    GIT_COMMITTER_EMAIL: "runtime@example.invalid",
    GIT_AUTHOR_DATE: "2026-01-01T00:00:00Z",
    GIT_COMMITTER_DATE: "2026-01-01T00:00:00Z",
  };
  const put = (path, value) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
  };
  const git = (...args) =>
    execFileSync("git", ["-c", "commit.gpgSign=false", "-c", "core.hooksPath=/dev/null", ...args], {
      cwd: root,
      env,
      encoding: "utf8",
      timeout: 10_000,
      maxBuffer: 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  for (const path of [
    ".github/workflows/ci.yml",
    ".github/dependabot.yml",
    "docs/main-ruleset.json",
    "docs/review-ruleset.json",
    ".nvmrc",
  ])
    put(path, readFileSync(join(repository, path), "utf8"));
  const pkg = snapshot(sourcePackage);
  const lock = {
    name: pkg.name,
    version: pkg.version,
    lockfileVersion: 3,
    packages: {
      "": { name: pkg.name, version: pkg.version, devDependencies: { ...pkg.devDependencies } },
    },
  };
  for (const [name, version] of Object.entries(pkg.devDependencies)) {
    const basename = name.split("/").at(-1);
    lock.packages[`node_modules/${name}`] = {
      version,
      resolved: `https://registry.npmjs.org/${name}/-/${basename}-${version}.tgz`,
      integrity,
      dev: true,
    };
  }
  const save = () => {
    put("package.json", pkg);
    put("package-lock.json", lock);
  };
  save();
  put("release-policy.json", { schemaVersion: 1, strategy: "global-first-parent-ordinal", line: "0.1" });
  git("init", "--quiet", "--initial-branch=main");
  git("add", "--all");
  git("commit", "--quiet", "-m", "Independent governance fixture with initial release line");
  const run = () =>
    spawnSync(process.execPath, [fileURLToPath(new URL("./policy.mjs", import.meta.url))], {
      cwd: root,
      env,
      encoding: "utf8",
      timeout: 20_000,
      maxBuffer: 1024 * 1024,
    });
  return { pkg, lock, save, run };
}

/** A successful real CLI control is mandatory before interpreting any subsequent rejection from that fixture. */
function passing(result) {
  assert.equal(result.error, undefined, "Policy subprocess must start and terminate within its bound");
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /Repository policy checks passed\./);
}

/** Reject only an executing policy process; missing files/imports/tool setup cannot satisfy a negative observation. */
function failing(result, reason = undefined) {
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.stderr, /ENOENT|ERR_MODULE_NOT_FOUND|MODULE_NOT_FOUND|Select the pinned Node runtime/);
  if (reason) assert.match(result.stderr, reason);
}

test("actual policy CLI accepts a complete dependency-free governance fixture", (t) => {
  passing(policyFixture(t).run());
});

test("dependency-free CLI fixture is isolated from source runtime declarations without changing source metadata", (t) => {
  const sourcePackage = JSON.parse(readFileSync(join(repository, "package.json"), "utf8"));
  sourcePackage.dependencies = { fastify: "5.0.0" };
  const before = snapshot(sourcePackage);
  const f = policyFixture(t, sourcePackage);
  try {
    passing(f.run());
    const expectedPackage = snapshot(before);
    delete expectedPackage.dependencies;
    assert.deepEqual(f.pkg, expectedPackage, "Synthetic fixture preserves every non-runtime package field");
    assert.equal(f.lock.packages[""].dependencies, undefined);
    assert.equal(f.lock.packages[directPath], undefined);
    assert.deepEqual(f.lock.packages[""].devDependencies, before.devDependencies);
  } finally {
    assert.deepEqual(sourcePackage, before, "Fixture construction and CLI execution must not mutate source metadata");
  }
});

test("actual policy wiring accepts the allowed pin and rejects a synchronized forbidden runtime graph", (t) => {
  const f = policyFixture(t);
  passing(f.run());
  const allowed = graph("5.0.0");
  f.pkg.dependencies = { ...allowed.pkg.dependencies };
  f.lock.packages[""].dependencies = { ...allowed.pkg.dependencies };
  f.lock.packages[directPath] = allowed.lock.packages[directPath];
  f.save();
  passing(f.run());
  predicate(); // A missing pure helper cannot make the forbidden dependency appear to be tested successfully.
  f.pkg.dependencies["mp3-parser"] = f.lock.packages[""].dependencies["mp3-parser"] = "1.0.0";
  f.lock.packages["node_modules/mp3-parser"] = {
    version: "1.0.0",
    resolved: "https://registry.npmjs.org/mp3-parser/-/mp3-parser-1.0.0.tgz",
    integrity,
  };
  f.save();
  failing(f.run());
});

test("actual policy preserves the development allowlist and exact-pin checks", (t) => {
  const f = policyFixture(t);
  passing(f.run());
  f.pkg.devDependencies["unreviewed-tool"] = f.lock.packages[""].devDependencies["unreviewed-tool"] = "1.0.0";
  f.save();
  failing(f.run(), /Unreviewed development tool/);
  delete f.pkg.devDependencies["unreviewed-tool"];
  delete f.lock.packages[""].devDependencies["unreviewed-tool"];
  f.pkg.devDependencies.prettier = f.lock.packages[""].devDependencies.prettier = "^3.0.0";
  f.save();
  failing(f.run());
});

test("actual policy retains root workspace and generic transitive source/integrity prohibitions", (t) => {
  const f = policyFixture(t);
  passing(f.run());
  f.pkg.workspaces = [];
  f.save();
  failing(f.run(), /Use one root package/);
  delete f.pkg.workspaces;
  const entry = f.lock.packages["node_modules/prettier"];
  const original = { ...entry };
  entry.resolved = "https://registry.example.invalid/prettier.tgz";
  f.save();
  failing(f.run());
  Object.assign(entry, original, { integrity: "sha256-synthetic" });
  f.save();
  failing(f.run());
});
