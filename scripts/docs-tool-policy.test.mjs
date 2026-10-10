/**
 * Independent DOCS-TOOL-POLICY decisions for parsed metadata and the real repository-policy entrypoint.
 *
 * Run `node --test scripts/docs-tool-policy.test.mjs` with pinned Node/npm. No package installation, renderer, network
 * or product execution is involved. Pure controls preserve caller inputs; disposable CLI fixtures copy governance
 * metadata only, isolate Git configuration/hooks and remove their owned directory after success or failure. Children
 * have finite time/output bounds. Missing helpers, imports, tools and timeouts are setup failures, never rejections.
 * See docs/testing/docs-tool-policy.md for the independently frozen interface and diagnostic boundaries.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const moduleUrl = new URL("./docs-tool-policy.mjs", import.meta.url);
const subject = existsSync(moduleUrl) ? await import(moduleUrl.href) : {};
const repository = fileURLToPath(new URL("../", import.meta.url));
const directPath = "node_modules/redoc";
const selectedVersion = "2.5.4";
const integrity = `sha512-${Buffer.alloc(64, 17).toString("base64")}`;
const otherIntegrity = `sha512-${Buffer.alloc(64, 42).toString("base64")}`;

/** Return the required pure API, failing before a missing export can satisfy any negative assertion. */
function predicate() {
  assert.equal(typeof subject.requireDocsToolPolicy, "function", "Missing DOCS-TOOL-POLICY pure API");
  return subject.requireDocsToolPolicy;
}

/** Create synthetic registry metadata; flags are fixture choices, not claims about installed package bytes. */
function installed(name, version, flags = {}) {
  return {
    version,
    resolved: `https://registry.npmjs.org/${name}/-/${name.split("/").at(-1)}-${version}.tgz`,
    integrity,
    ...flags,
  };
}

/** Build an independent npm-v3 graph; an omitted version leaves Redoc undeclared on both roots. */
function graph(version = undefined) {
  const pkg = { name: "independent-docs-policy-fixture", version: "0.0.0" };
  const lock = { name: pkg.name, version: pkg.version, lockfileVersion: 3, packages: { "": { ...pkg } } };
  if (version !== undefined) {
    pkg.devDependencies = { redoc: version };
    lock.packages[""].devDependencies = { redoc: version };
    lock.packages[directPath] = installed("redoc", version, { dev: true });
  }
  return { pkg, lock };
}

/** Snapshot these acyclic data fixtures, preserving prototypes so mutation cannot hide behind JSON normalization. */
function snapshot(value) {
  if (!value || typeof value !== "object") return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) return value.map(snapshot);
  return Object.assign(
    Object.create(Object.getPrototypeOf(value)),
    Object.fromEntries(Object.entries(value).map(([key, child]) => [key, snapshot(child)])),
  );
}

/** Deep-freeze acyclic input records in place; the caller deliberately retains ownership of these test fixtures. */
function freeze(value) {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Require a responsible labeled rejection and unchanged mutable inputs, including mutation followed by throwing. */
function rejectedUnchanged(check, fixture, reason, label) {
  const before = snapshot(fixture);
  assert.throws(() => check(fixture.pkg, fixture.lock), reason, label);
  assert.deepEqual(fixture, before, `${label}: rejection must preserve input values and prototypes`);
}

/** Prove each fresh counterpart passes before applying its one named fault and checking the responsible boundary. */
function rejected(cases, reason, make = () => graph(selectedVersion)) {
  const check = predicate();
  for (const [label, mutate] of cases) {
    const fixture = make();
    const before = snapshot(fixture);
    assert.equal(check(fixture.pkg, fixture.lock), undefined, `${label}: valid counterpart`);
    assert.deepEqual(fixture, before, `${label}: successful counterpart must preserve inputs`);
    mutate(fixture);
    rejectedUnchanged(check, fixture, reason, label);
  }
}

test("legacy absent/empty maps and ordinary/null-prototype records remain nonmutating positives", () => {
  const check = predicate();
  for (const nullPrototype of [false, true]) {
    for (const [packageMap, lockMap] of [
      [false, false],
      [true, false],
      [false, true],
      [true, true],
    ]) {
      const f = graph();
      if (packageMap) f.pkg.devDependencies = {};
      if (lockMap) f.lock.packages[""].devDependencies = {};
      if (nullPrototype) {
        for (const record of [
          f.pkg,
          f.lock,
          f.lock.packages,
          f.lock.packages[""],
          f.pkg.devDependencies,
          f.lock.packages[""].devDependencies,
        ].filter(Boolean))
          Object.setPrototypeOf(record, null);
      }
      const before = snapshot(f);
      assert.equal(check(freeze(f.pkg), freeze(f.lock)), undefined);
      assert.deepEqual(f, before);
    }
  }
});

test("selected Redoc accepts null records, absent/false flags and distinct canonical synthetic SRI", () => {
  const check = predicate();
  for (const nullPrototype of [false, true]) {
    for (const sri of [integrity, otherIntegrity]) {
      const f = graph(selectedVersion);
      const entry = f.lock.packages[directPath];
      entry.integrity = sri;
      if (nullPrototype) {
        Object.assign(entry, { devOptional: false, optional: false, peer: false });
        for (const record of [
          f.pkg,
          f.lock,
          f.lock.packages,
          f.lock.packages[""],
          f.pkg.devDependencies,
          f.lock.packages[""].devDependencies,
          entry,
        ])
          Object.setPrototypeOf(record, null);
      }
      const before = snapshot(f);
      assert.equal(check(freeze(f.pkg), freeze(f.lock)), undefined);
      assert.deepEqual(f, before);
    }
  }
});

test("normal Redoc metadata and production-reachable shared transitive packages remain permitted", () => {
  const check = predicate();
  const f = graph(selectedVersion);
  Object.assign(f.lock.packages[directPath], {
    engines: { node: ">=20" },
    license: "MIT",
    dependencies: { "synthetic-shared": "^1.0.0" },
    peerDependencies: { "synthetic-peer": ">=1 <3" },
  });
  f.pkg.dependencies = { fastify: "5.12.5" };
  f.lock.packages[""].dependencies = { fastify: "5.12.5" };
  f.lock.packages["node_modules/fastify"] = installed("fastify", "5.12.5", {
    dependencies: { "synthetic-shared": "^1.0.0" },
  });
  f.lock.packages["node_modules/synthetic-shared"] = installed("synthetic-shared", "1.1.0", { dev: false });
  f.lock.packages["node_modules/synthetic-peer"] = installed("synthetic-peer", "1.2.0", { dev: true });
  const before = snapshot(f);
  assert.equal(check(freeze(f.pkg), freeze(f.lock)), undefined);
  assert.deepEqual(f, before);
});

test("undeclared development-transitive Redoc retains generic version/source treatment", () => {
  const check = predicate();
  const f = graph();
  f.pkg.devDependencies = { "synthetic-parent": "1.0.0" };
  f.lock.packages[""].devDependencies = { ...f.pkg.devDependencies };
  f.lock.packages["node_modules/synthetic-parent"] = installed("synthetic-parent", "1.0.0", {
    dev: true,
    dependencies: { redoc: "^2.0.0" },
  });
  f.lock.packages[directPath] = installed("redoc", "2.4.0-next.1", { dev: true });
  const before = snapshot(f);
  assert.equal(check(freeze(f.pkg), freeze(f.lock)), undefined);
  assert.deepEqual(f, before);
});

test("required records and present development maps reject malformed or inherited data", () => {
  const invalid = [undefined, null, false, 1, "metadata", [], new Date(0), Object.create({ redoc: selectedVersion })];
  rejected(
    invalid.flatMap((value, index) => [
      [
        `package ${index}`,
        (f) => {
          f.pkg = value;
        },
      ],
      [
        `lock ${index}`,
        (f) => {
          f.lock = value;
        },
      ],
      [
        `packages ${index}`,
        (f) => {
          f.lock.packages = value;
        },
      ],
      [
        `lock root ${index}`,
        (f) => {
          f.lock.packages[""] = value;
        },
      ],
    ]),
    /DOCS-TOOL-POLICY record/,
  );
  rejected(
    invalid
      .filter((value) => value !== undefined)
      .flatMap((value, index) => [
        [
          `package development map ${index}`,
          (f) => {
            f.pkg.devDependencies = value;
          },
        ],
        [
          `lock development map ${index}`,
          (f) => {
            f.lock.packages[""].devDependencies = value;
          },
        ],
      ]),
    /DOCS-TOOL-POLICY record/,
  );
  rejected(
    [
      [
        "missing lock root",
        (f) => {
          delete f.lock.packages[""];
        },
      ],
    ],
    /DOCS-TOOL-POLICY record/,
  );
});

test("only numeric npm lockfile version three is admitted", () => {
  rejected(
    [undefined, null, "3", 2, 4].map((version) => [
      `schema ${String(version)}`,
      (f) => {
        f.lock.lockfileVersion = version;
      },
    ]),
    /DOCS-TOOL-POLICY lockfileVersion/,
  );
});

test("both own Redoc declarations must agree on the exact selected string", () => {
  rejected(
    [
      [
        "missing package side",
        (f) => {
          delete f.pkg.devDependencies.redoc;
        },
      ],
      [
        "missing lock side",
        (f) => {
          delete f.lock.packages[""].devDependencies.redoc;
        },
      ],
      [
        "different package pin",
        (f) => {
          f.pkg.devDependencies.redoc = "2.5.3";
        },
      ],
      [
        "different lock pin",
        (f) => {
          f.lock.packages[""].devDependencies.redoc = "2.5.3";
        },
      ],
    ],
    /DOCS-TOOL-POLICY declaration/,
  );
});

test("synchronized wrong pins and alternate sources cannot pass by avoiding declaration mismatch", () => {
  rejected(
    [
      "2.5.3",
      "2.6.0",
      "^2.5.4",
      "~2.5.4",
      "latest",
      "2.5.4-beta.1",
      "2.5.4+build.1",
      "v2.5.4",
      "02.5.4",
      "2.5.4\n",
      "npm:redoc@2.5.4",
      "https://registry.npmjs.org/redoc/-/redoc-2.5.4.tgz",
      "file:../redoc",
      "git+https://example.invalid/redoc.git#2.5.4",
      "link:../redoc",
      "workspace:*",
      null,
      false,
      2.5,
      {},
      [],
    ].map((version, index) => [
      `synchronized declaration ${index}`,
      (f) => {
        f.pkg.devDependencies.redoc = f.lock.packages[""].devDependencies.redoc = version;
        f.lock.packages[directPath] = installed("redoc", version, { dev: true });
      },
    ]),
    /DOCS-TOOL-POLICY declaration/,
  );
});

test("direct Redoc requires an ordinary installed record with the selected version", () => {
  rejected(
    [
      [
        "missing installed record",
        (f) => {
          delete f.lock.packages[directPath];
        },
      ],
      ...[null, [], "2.5.4", Object.create({ version: selectedVersion })].map((value, index) => [
        `installed record ${index}`,
        (f) => {
          f.lock.packages[directPath] = value;
        },
      ]),
      [
        "missing installed version",
        (f) => {
          delete f.lock.packages[directPath].version;
        },
      ],
      ...["2.5.3", 2.5, null].map((version) => [
        `installed version ${version}`,
        (f) => {
          f.lock.packages[directPath].version = version;
        },
      ]),
    ],
    /DOCS-TOOL-POLICY installed/,
  );
});

test("installed Redoc must be explicitly development-only, including when undeclared", () => {
  const transitive = () => {
    const f = graph();
    f.lock.packages[directPath] = installed("redoc", "2.4.0", { dev: true });
    return f;
  };
  for (const make of [() => graph(selectedVersion), transitive]) {
    rejected(
      [undefined, false, null, "true", 1].map((dev) => [
        `development flag ${String(dev)}`,
        (f) => {
          if (dev === undefined) delete f.lock.packages[directPath].dev;
          else f.lock.packages[directPath].dev = dev;
        },
      ]),
      /DOCS-TOOL-POLICY dev/,
      make,
    );
  }
  rejected(
    [null, [], Object.create({ dev: true })].map((entry, index) => [
      `transitive record ${index}`,
      (f) => {
        f.lock.packages[directPath] = entry;
      },
    ]),
    /DOCS-TOOL-POLICY installed/,
    transitive,
  );
});

test("direct optional/peer flags must be absent or false and link must be absent even when false", () => {
  rejected(
    [
      ...["devOptional", "optional", "peer"].flatMap((flag) =>
        [undefined, true, null, 0, "false"].map((value) => [
          `${flag}=${String(value)}`,
          (f) => {
            f.lock.packages[directPath][flag] = value;
          },
        ]),
      ),
      ...[undefined, false, true, null].map((value) => [
        `link=${String(value)}`,
        (f) => {
          f.lock.packages[directPath].link = value;
        },
      ]),
    ],
    /DOCS-TOOL-POLICY flags/,
  );
});

test("direct resolution is exactly the selected uncredentialed HTTPS npm tarball URL", () => {
  const canonical = "https://registry.npmjs.org/redoc/-/redoc-2.5.4.tgz";
  rejected(
    [
      undefined,
      null,
      "",
      canonical.replace("https:", "http:"),
      canonical.replace("registry.npmjs.org", "example.invalid"),
      canonical.replaceAll("redoc", "other"),
      canonical.replace("2.5.4", "2.5.3"),
      canonical.replace("https://", "https://fixture:synthetic@"),
      `${canonical}?download=1`,
      `${canonical}#fragment`,
      `${canonical}\n`,
      `${canonical} `,
      "file:./redoc.tgz",
    ].map((resolved, index) => [
      `resolution ${index}`,
      (f) => {
        f.lock.packages[directPath].resolved = resolved;
      },
    ]),
    /DOCS-TOOL-POLICY resolved/,
  );
});

test("integrity is one canonical SHA-512 token with exactly sixty-four decoded bytes", () => {
  const noncanonical = `${integrity.slice(0, -3)}R==`;
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
      `${integrity} ${otherIntegrity}`,
      ` ${integrity}`,
      `${integrity}\n`,
      integrity.slice(0, -2),
      noncanonical,
      `SHA512-${integrity.slice(7)}`,
      `sha512-${"-".repeat(86)}==`,
    ].map((value, index) => [
      `integrity ${index}`,
      (f) => {
        f.lock.packages[directPath].integrity = value;
      },
    ]),
    /DOCS-TOOL-POLICY integrity/,
  );
});

test("the negative-input oracle rejects mutation-then-throw and unrelated diagnostic failures", () => {
  const reason = /DOCS-TOOL-POLICY declaration/;
  rejectedUnchanged(
    () => {
      throw new Error("DOCS-TOOL-POLICY declaration: owned clean rejection");
    },
    graph(selectedVersion),
    reason,
    "clean rejection control",
  );
  for (const side of ["package", "lock"]) {
    assert.throws(
      () =>
        rejectedUnchanged(
          (pkg, lock) => {
            if (side === "package") pkg.devDependencies.redoc = "2.6.0";
            else lock.packages[directPath].version = "2.6.0";
            throw new Error("DOCS-TOOL-POLICY declaration: owned mutation then rejection");
          },
          graph(selectedVersion),
          reason,
          `${side} mutation control`,
        ),
      /rejection must preserve input values and prototypes/,
    );
  }
  assert.throws(
    () =>
      rejectedUnchanged(
        () => {
          throw new Error("unrelated setup fault");
        },
        graph(selectedVersion),
        reason,
        "wrong reason control",
      ),
    assert.AssertionError,
  );
});

/**
 * Build the local-copy equivalent of runtime-dependency-policy.test.mjs's policyFixture; never import its test module.
 * Copy governance metadata only, clone the caller's package, remove evolving runtime/Redoc declarations, then create
 * coherent synthetic lock entries. Options choose only the frozen Redoc/Fastify arrangements. Fixture Git has isolated
 * config, disabled hooks/signing and a synthetic identity. Setup/I/O failures throw; t.after owns recursive cleanup.
 * Returned save writes only this fixture, and run executes the absolute real policy CLI with bounded time/output.
 */
function policyFixture(
  t,
  { docs = false, runtime = false } = {},
  sourcePackage = JSON.parse(readFileSync(join(repository, "package.json"), "utf8")),
) {
  const root = mkdtempSync(join(tmpdir(), "mp3-docs-policy-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const env = {
    PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH}`,
    HOME: root,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: join(root, "empty-gitconfig"),
    GIT_TERMINAL_PROMPT: "0",
    GIT_AUTHOR_NAME: "Independent Docs Fixture",
    GIT_AUTHOR_EMAIL: "docs@example.invalid",
    GIT_COMMITTER_NAME: "Independent Docs Fixture",
    GIT_COMMITTER_EMAIL: "docs@example.invalid",
    GIT_AUTHOR_DATE: "2026-01-01T00:00:00Z",
    GIT_COMMITTER_DATE: "2026-01-01T00:00:00Z",
  };
  /** Serialize text or metadata under the owned fixture; parent directories are created and write failures propagate. */
  const put = (path, value) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
  };
  /** Run fixed local Git setup in the fixture, bounded to ten seconds/one MiB; failure aborts fixture construction. */
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
  const before = snapshot(sourcePackage);
  const pkg = snapshot(sourcePackage);
  delete pkg.dependencies;
  delete pkg.devDependencies.redoc;
  if (docs) pkg.devDependencies.redoc = selectedVersion;
  if (runtime) pkg.dependencies = { fastify: "5.12.5" };
  const lock = {
    name: pkg.name,
    version: pkg.version,
    lockfileVersion: 3,
    packages: { "": { name: pkg.name, version: pkg.version, devDependencies: { ...pkg.devDependencies } } },
  };
  for (const [name, version] of Object.entries(pkg.devDependencies))
    lock.packages[`node_modules/${name}`] = installed(name, version, { dev: true });
  if (runtime) {
    lock.packages[""].dependencies = { ...pkg.dependencies };
    lock.packages["node_modules/fastify"] = installed("fastify", "5.12.5");
  }
  /** Persist current fixture records only; no source metadata or source-repository Git state is modified. */
  const save = () => {
    put("package.json", pkg);
    put("package-lock.json", lock);
  };
  save();
  put("release-policy.json", { schemaVersion: 1, strategy: "global-first-parent-ordinal", line: "0.1" });
  git("init", "--quiet", "--initial-branch=main");
  git("add", "--all");
  git("commit", "--quiet", "-m", "Independent documentation policy fixture");
  assert.deepEqual(sourcePackage, before, "Fixture construction must preserve source metadata");
  /** Return the real CLI process result; spawn errors/timeouts/signals remain setup failures for the caller to reject. */
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

/** Require actual exit-zero policy execution and its success marker, never a missing or timed-out process. */
function passing(result) {
  assert.equal(result.error, undefined, "Policy subprocess must start and terminate within its bound");
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /Repository policy checks passed\./);
}

/** Require a started, nonsignaled nonzero CLI result with the intended assertion; setup failures never count. */
function failing(result, reason) {
  assert.equal(result.error, undefined, "Policy subprocess must start and terminate within its bound");
  assert.equal(result.signal, null);
  assert.equal(typeof result.status, "number");
  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.stderr, /ENOENT|ERR_MODULE_NOT_FOUND|MODULE_NOT_FOUND|Select the pinned Node runtime/);
  assert.match(result.stderr, /AssertionError/);
  assert.match(result.stderr, reason);
}

/** Exercise one real negative after a passing counterpart, restore both records, and require success again. */
function cliRejected(f, mutate, reason) {
  predicate();
  passing(f.run());
  const before = snapshot({ pkg: f.pkg, lock: f.lock });
  try {
    mutate(f);
    f.save();
    failing(f.run(), reason);
  } finally {
    for (const key of Object.keys(f.pkg)) delete f.pkg[key];
    for (const key of Object.keys(f.lock)) delete f.lock[key];
    Object.assign(f.pkg, before.pkg);
    Object.assign(f.lock, before.lock);
    f.save();
  }
  passing(f.run());
}

test("actual CLI accepts legacy and selected Redoc metadata with no runtime or allowed Fastify", (t) => {
  for (const options of [{}, { runtime: true }, { docs: true }, { docs: true, runtime: true }])
    passing(policyFixture(t, options).run());
});

test("actual CLI accepts undeclared transitive Redoc and a shared production-reachable transitive record", (t) => {
  const transitive = policyFixture(t);
  passing(transitive.run());
  transitive.lock.packages["node_modules/prettier"].dependencies = { redoc: "^2.0.0" };
  transitive.lock.packages[directPath] = installed("redoc", "2.4.0-next.1", { dev: true });
  transitive.save();
  passing(transitive.run());
  const shared = policyFixture(t, { docs: true, runtime: true });
  passing(shared.run());
  for (const name of ["redoc", "fastify"])
    shared.lock.packages[`node_modules/${name}`].dependencies = { "synthetic-shared": "^1.0.0" };
  shared.lock.packages["node_modules/synthetic-shared"] = installed("synthetic-shared", "1.1.0", { dev: false });
  shared.lock.packages[directPath].integrity = otherIntegrity;
  shared.save();
  passing(shared.run());
});

test("actual CLI invokes selected-tool metadata validation rather than only adding an allowlist name", (t) => {
  const f = policyFixture(t, { docs: true, runtime: true });
  cliRejected(
    f,
    (value) => {
      value.pkg.devDependencies.redoc = value.lock.packages[""].devDependencies.redoc = "2.5.3";
      value.lock.packages[directPath] = installed("redoc", "2.5.3", { dev: true });
    },
    /DOCS-TOOL-POLICY declaration/,
  );
  cliRejected(
    f,
    (value) => {
      value.lock.packages[directPath].dev = false;
    },
    /DOCS-TOOL-POLICY dev/,
  );
  cliRejected(
    f,
    (value) => {
      value.lock.packages[directPath].integrity = "sha512-synthetic";
    },
    /DOCS-TOOL-POLICY integrity/,
  );
  const transitive = policyFixture(t);
  transitive.lock.packages["node_modules/prettier"].dependencies = { redoc: "^2.0.0" };
  transitive.lock.packages[directPath] = installed("redoc", "2.4.0", { dev: true });
  transitive.save();
  cliRejected(
    transitive,
    (value) => {
      value.lock.packages[directPath].dev = false;
    },
    /DOCS-TOOL-POLICY dev/,
  );
});

test("actual CLI rejects complete extra or renamed tool graphs, both CLIs and aliases at its allowlist", (t) => {
  const f = policyFixture(t, { docs: true });
  for (const name of [
    "unreviewed-tool",
    "Redoc",
    "redoc-cli",
    "@redocly/cli",
    "@redocly/openapi-core",
    "docs-renderer",
  ]) {
    cliRejected(
      f,
      (value) => {
        delete value.pkg.devDependencies.redoc;
        delete value.lock.packages[""].devDependencies.redoc;
        delete value.lock.packages[directPath];
        const pin = name === "docs-renderer" ? "npm:redoc@2.5.4" : selectedVersion;
        value.pkg.devDependencies[name] = value.lock.packages[""].devDependencies[name] = pin;
        value.lock.packages[`node_modules/${name}`] = installed(
          name === "docs-renderer" ? "redoc" : name,
          selectedVersion,
          { dev: true },
        );
      },
      /Unreviewed development tool/,
    );
  }
  cliRejected(
    f,
    (value) => {
      value.pkg.devDependencies["unreviewed-tool"] = value.lock.packages[""].devDependencies["unreviewed-tool"] =
        "1.0.0";
      value.lock.packages["node_modules/unreviewed-tool"] = installed("unreviewed-tool", "1.0.0", { dev: true });
    },
    /Unreviewed development tool/,
  );
});

test("actual CLI keeps runtime Redoc and each alternate root channel under unchanged runtime policy", (t) => {
  const f = policyFixture(t, { docs: true, runtime: true });
  cliRejected(
    f,
    (value) => {
      value.pkg.dependencies.redoc = value.lock.packages[""].dependencies.redoc = selectedVersion;
      value.lock.packages[directPath].dev = false;
    },
    /Package may declare only Fastify as a runtime dependency/,
  );
  for (const side of ["Package", "Lock root"]) {
    for (const field of [
      "optionalDependencies",
      "peerDependencies",
      "peerDependenciesMeta",
      "overrides",
      "bundleDependencies",
      "bundledDependencies",
    ]) {
      cliRejected(
        f,
        (value) => {
          const root = side === "Package" ? value.pkg : value.lock.packages[""];
          root[field] =
            field === "peerDependenciesMeta"
              ? { redoc: { optional: true } }
              : field === "bundleDependencies" || field === "bundledDependencies"
                ? ["redoc"]
                : { redoc: selectedVersion };
        },
        new RegExp(`${side}\\.${field} must be (?:an empty array|empty)`),
      );
    }
  }
});

test("actual CLI preserves old pin, workspace and unrelated transitive registry/integrity checks", (t) => {
  const f = policyFixture(t, { docs: true, runtime: true });
  cliRejected(
    f,
    (value) => {
      value.pkg.devDependencies.prettier = value.lock.packages[""].devDependencies.prettier = "^3.9.9";
    },
    /test\(version\)/,
  );
  cliRejected(
    f,
    (value) => {
      value.pkg.workspaces = [];
    },
    /Use one root package/,
  );
  f.lock.packages[directPath].dependencies = { "synthetic-leaf": "^1.0.0" };
  f.lock.packages["node_modules/synthetic-leaf"] = installed("synthetic-leaf", "1.0.0", { dev: true });
  f.save();
  cliRejected(
    f,
    (value) => {
      value.lock.packages["node_modules/synthetic-leaf"].resolved = "https://example.invalid/synthetic-leaf.tgz";
    },
    /dependency\.resolved\.startsWith/,
  );
  cliRejected(
    f,
    (value) => {
      value.lock.packages["node_modules/synthetic-leaf"].integrity = "sha256-synthetic";
    },
    /dependency\.integrity\.startsWith/,
  );
});

test("actual CLI requires the new tooling-test entry alongside existing mandatory tests", (t) => {
  const f = policyFixture(t, { docs: true });
  cliRejected(
    f,
    (value) => {
      const command = value.pkg.scripts["test:tooling"].split(/\s+/);
      assert(command.includes("scripts/docs-tool-policy.test.mjs"), "The passing counterpart must include this test");
      value.pkg.scripts["test:tooling"] = command
        .filter((part) => part !== "scripts/docs-tool-policy.test.mjs")
        .join(" ");
    },
    /Missing mandatory docs-tool-policy tests/,
  );
});
