/**
 * Independent bounded schema/docs/client dependency-policy expectations. Run with the pinned Node runtime:
 * `node --test scripts/backend-contract-policy.test.mjs`. Pure synthetic npm-v3 metadata defines decisions before the
 * implementation exists. No install/network/Git/application I/O occurs; missing APIs fail before rejection assertions.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const moduleUrl = new URL("./backend-contract-policy.mjs", import.meta.url);
const subject = existsSync(moduleUrl) ? await import(moduleUrl.href) : {};
const runtime = {
  fastify: "5.12.5",
  typebox: "1.3.36",
  "@fastify/type-provider-typebox": "6.2.0",
  "@fastify/swagger": "9.9.2",
};
const development = { ky: "2.2.0", "@redocly/cli": "2.62.1", oxlint: "1.87.0" };
const integrity = `sha512-${Buffer.alloc(64, 17).toString("base64")}`;

/** Require the pure API before valid or invalid inputs; an absent implementation is not a valid negative control. */
function predicate() {
  assert.equal(typeof subject.requireBackendContractPolicy, "function", "Missing BACKEND-CONTRACT-POLICY pure API");
  return subject.requireBackendContractPolicy;
}

/** Construct reviewed direct metadata only; synthetic integrity proves structure, never a downloaded-package hash. */
function graph(selected = true, devTools = {}) {
  const pkg = { name: "independent-backend-policy", version: "0.0.0", dependencies: selected ? { ...runtime } : {} };
  const lock = { lockfileVersion: 3, packages: { "": { ...pkg, dependencies: { ...pkg.dependencies } } } };
  pkg.devDependencies = { ...devTools };
  lock.packages[""].devDependencies = { ...devTools };
  for (const [name, version] of [...Object.entries(pkg.dependencies), ...Object.entries(devTools)]) {
    lock.packages[`node_modules/${name}`] = {
      version,
      resolved: `https://registry.npmjs.org/${name}/-/${name.split("/").at(-1)}-${version}.tgz`,
      integrity,
      ...(Object.hasOwn(devTools, name) ? { dev: true } : {}),
    };
  }
  return { pkg, lock };
}

/** Preserve values and prototypes without freezing invalid input; no cyclic/accessor input is supplied. */
function snapshot(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(snapshot);
  return Object.assign(
    Object.create(Object.getPrototypeOf(value)),
    Object.fromEntries(Object.entries(value).map(([key, child]) => [key, snapshot(child)])),
  );
}

/** Prove each invalid input rejects without normalization/mutation. API existence is checked before this table. */
function rejected(cases, make = () => graph()) {
  const check = predicate();
  for (const [name, mutate] of cases) {
    const { pkg, lock } = make();
    mutate(pkg, lock);
    const before = snapshot([pkg, lock]);
    assert.throws(() => check(pkg, lock), undefined, name);
    assert.deepEqual([pkg, lock], before, `${name}: rejection mutated inputs`);
  }
}

/** Freeze valid metadata recursively; accidental mutation cannot be hidden by comparing mutated inputs. */
function freeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

test("historical empty and Fastify-only graphs preserve admission", () => {
  const check = predicate();
  for (const fastify of [false, true]) {
    const { pkg, lock } = graph(false);
    if (fastify) {
      const full = graph();
      pkg.dependencies.fastify = runtime.fastify;
      lock.packages[""].dependencies.fastify = runtime.fastify;
      lock.packages["node_modules/fastify"] = full.lock.packages["node_modules/fastify"];
    }
    const before = snapshot([pkg, lock]);
    assert.equal(check(freeze(pkg), freeze(lock)), undefined);
    assert.deepEqual([pkg, lock], before);
  }
});

test("exact four-runtime selection accepts canonical production metadata unchanged", () => {
  const check = predicate();
  const { pkg, lock } = graph();
  for (const name of Object.keys(runtime))
    Object.assign(lock.packages[`node_modules/${name}`], {
      dev: false,
      devOptional: false,
      optional: false,
      peer: false,
    });
  const before = snapshot([pkg, lock]);
  assert.equal(check(freeze(pkg), freeze(lock)), undefined);
  assert.deepEqual([pkg, lock], before);
});

test("null-prototype metadata is ordinary data and remains unmodified", () => {
  const check = predicate();
  const { pkg, lock } = graph();
  for (const record of [pkg, pkg.dependencies, lock, lock.packages, ...Object.values(lock.packages)])
    Object.setPrototypeOf(record, null);
  const before = snapshot([pkg, lock]);
  assert.equal(check(freeze(pkg), freeze(lock)), undefined);
  assert.deepEqual([pkg, lock], before);
});

test("new runtime selection is all-or-none; Fastify-only remains the historical alternative", () => {
  rejected(
    Object.keys(runtime).flatMap((name) => [
      [`package missing ${name}`, (pkg) => delete pkg.dependencies[name]],
      [`lock root missing ${name}`, (_pkg, lock) => delete lock.packages[""].dependencies[name]],
      [
        `both roots missing ${name}`,
        (pkg, lock) => {
          delete pkg.dependencies[name];
          delete lock.packages[""].dependencies[name];
        },
      ],
    ]),
  );
});

test("new graph pins are exact stable reviewed strings in every declaration", () => {
  rejected(
    Object.keys(runtime).flatMap((name) =>
      [undefined, 1, "^1.0.0", "1.0.0", "1.0.0-beta", "file:../x", "npm:x@1.0.0"].map((version) => [
        `${name}: ${String(version)}`,
        (pkg, lock) => {
          pkg.dependencies[name] = version;
          lock.packages[""].dependencies[name] = version;
          lock.packages[`node_modules/${name}`].version = version;
        },
      ]),
    ),
  );
});

test("package/lock/direct version agreement is mandatory", () => {
  rejected(
    Object.keys(runtime).flatMap((name) => [
      [
        `lock declaration ${name}`,
        (_pkg, lock) => {
          lock.packages[""].dependencies[name] = "99.0.0";
        },
      ],
      [
        `installed version ${name}`,
        (_pkg, lock) => {
          lock.packages[`node_modules/${name}`].version = "99.0.0";
        },
      ],
      [
        `missing package ${name}`,
        (_pkg, lock) => {
          delete lock.packages[`node_modules/${name}`];
        },
      ],
    ]),
  );
});

test("canonical npm tarballs and valid SHA512 integrity are required for new direct runtimes", () => {
  rejected(
    Object.keys(runtime).flatMap((name) => [
      ...[undefined, "file:../x", "https://example.test/pkg.tgz", "https://registry.npmjs.org/x/-/x-1.0.0.tgz"].map(
        (resolved) => [
          `${name} source ${String(resolved)}`,
          (_pkg, lock) => {
            lock.packages[`node_modules/${name}`].resolved = resolved;
          },
        ],
      ),
      ...[undefined, "", "sha512-bad", "sha1-YWJj", 42].map((value) => [
        `${name} integrity ${String(value)}`,
        (_pkg, lock) => {
          lock.packages[`node_modules/${name}`].integrity = value;
        },
      ]),
    ]),
  );
});

test("production direct records cannot become dev optional peer links or local sources", () => {
  rejected(
    Object.keys(runtime).flatMap((name) =>
      ["dev", "devOptional", "optional", "peer", "link", "inBundle"].map((flag) => [
        `${name} ${flag}`,
        (_pkg, lock) => {
          lock.packages[`node_modules/${name}`][flag] = true;
        },
      ]),
    ),
  );
});

test("no extra direct runtime package or legacy TypeBox alias is admitted", () => {
  rejected(
    [
      "@sinclair/typebox",
      "ky",
      "react",
      "@redocly/cli",
      "mp3-parser",
      "music-metadata",
      "express",
      "fastify-plugin",
      "oxlint",
    ].map((name) => [
      `extra runtime ${name}`,
      (pkg, lock) => {
        pkg.dependencies[name] = "1.0.0";
        lock.packages[""].dependencies[name] = "1.0.0";
      },
    ]),
  );
});

test("alternate dependency channels stay closed on package and lock roots", () => {
  rejected(
    [
      "optionalDependencies",
      "peerDependencies",
      "peerDependenciesMeta",
      "overrides",
      "bundleDependencies",
      "bundledDependencies",
    ].flatMap((channel) =>
      [true, false].map((inLock) => [
        `${channel} ${inLock}`,
        (pkg, lock) => {
          (inLock ? lock.packages[""] : pkg)[channel] = channel.includes("undle") ? ["typebox"] : { typebox: "1.3.36" };
        },
      ]),
    ),
  );
});

test("each optional selected frontend/doc tool is an exact development-only pin", () => {
  const check = predicate();
  for (const devTools of [
    {},
    { ky: development.ky },
    { "@redocly/cli": development["@redocly/cli"] },
    { oxlint: development.oxlint },
    development,
  ]) {
    const { pkg, lock } = graph(true, devTools);
    assert.equal(check(freeze(pkg), freeze(lock)), undefined);
  }
});

test("optional selected development tools require root agreement canonical sources and dev flags", () => {
  rejected(
    Object.keys(development).flatMap((name) => [
      [
        `package pin ${name}`,
        (pkg) => {
          pkg.devDependencies[name] = "1.0.0";
        },
      ],
      [
        `lock declaration ${name}`,
        (_pkg, lock) => {
          delete lock.packages[""].devDependencies[name];
        },
      ],
      [
        `installed version ${name}`,
        (_pkg, lock) => {
          lock.packages[`node_modules/${name}`].version = "1.0.0";
        },
      ],
      [
        `production metadata ${name}`,
        (_pkg, lock) => {
          delete lock.packages[`node_modules/${name}`].dev;
        },
      ],
      [
        `local source ${name}`,
        (_pkg, lock) => {
          lock.packages[`node_modules/${name}`].resolved = "file:../x";
        },
      ],
      [
        `missing integrity ${name}`,
        (_pkg, lock) => {
          delete lock.packages[`node_modules/${name}`].integrity;
        },
      ],
    ]),
    () => graph(true, development),
  );
});

test("malformed input records reject before widening a dependency policy", () => {
  const check = predicate();
  for (const bad of [null, [], "metadata", false, new Date(0), Object.create({ inherited: true })]) {
    const { pkg, lock } = graph();
    assert.throws(() => check(bad, lock));
    assert.throws(() => check(pkg, bad));
  }
  rejected([
    [
      "wrong lock version",
      (_pkg, lock) => {
        lock.lockfileVersion = 2;
      },
    ],
    [
      "missing root",
      (_pkg, lock) => {
        delete lock.packages[""];
      },
    ],
    [
      "array dependency map",
      (pkg) => {
        pkg.dependencies = [];
      },
    ],
    [
      "inherited dependency map",
      (pkg) => {
        pkg.dependencies = Object.create(runtime);
      },
    ],
  ]);
});

test("unrelated established development tooling does not imply a new runtime selection", () => {
  const check = predicate();
  const { pkg, lock } = graph(false);
  pkg.devDependencies = { prettier: "3.9.9", typescript: "7.0.2", redoc: "2.5.4" };
  lock.packages[""].devDependencies = { ...pkg.devDependencies };
  assert.equal(check(freeze(pkg), freeze(lock)), undefined);
});
