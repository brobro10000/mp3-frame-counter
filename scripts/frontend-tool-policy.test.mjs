/**
 * Independent narrow browser-tool admission decisions, specified before the policy implementation.
 *
 * Run `node --test scripts/frontend-tool-policy.test.mjs`. Synthetic npm-v3 records establish expected decisions;
 * missing exports fail explicitly, and invalid inputs remain mutable to expose mutation followed by rejection.
 * No dependency is installed, no repository Git state is changed, and no acceptance binding is claimed.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const moduleUrl = new URL("./frontend-tool-policy.mjs", import.meta.url);
const subject = existsSync(moduleUrl) ? await import(moduleUrl.href) : {};
const pins = {
  react: "19.3.0",
  "react-dom": "19.3.0",
  "@types/react": "19.3.0",
  "@types/react-dom": "19.3.0",
  vite: "8.3.4",
};
const integrity = `sha512-${Buffer.alloc(64, 17).toString("base64")}`;

/** Require the pure API before any rejection assertion, so a missing implementation is never an expected refusal. */
function predicate() {
  assert.equal(typeof subject.requireFrontendToolPolicy, "function", "Missing FRONTEND-TOOL-POLICY pure API");
  return subject.requireFrontendToolPolicy;
}

/** Produce a minimal historical or complete selected graph with canonical direct tarball metadata. */
function graph(selected = true) {
  const pkg = { name: "independent-browser-policy", version: "0.0.0" };
  const lock = { lockfileVersion: 3, packages: { "": { ...pkg } } };
  if (!selected) return { pkg, lock };
  pkg.devDependencies = { ...pins };
  lock.packages[""].devDependencies = { ...pins };
  for (const [name, version] of Object.entries(pins)) {
    lock.packages[`node_modules/${name}`] = {
      version,
      dev: true,
      resolved: `https://registry.npmjs.org/${name}/-/${name.split("/").at(-1)}-${version}.tgz`,
      integrity,
    };
  }
  return { pkg, lock };
}

/** Preserve prototypes and values without freezing invalid records; tests contain no cyclic or accessor values. */
function snapshot(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(snapshot);
  return Object.assign(
    Object.create(Object.getPrototypeOf(value)),
    Object.fromEntries(Object.entries(value).map(([key, child]) => [key, snapshot(child)])),
  );
}

/** Assert each invalid fixture rejects without normalizing or modifying caller inputs. */
function rejected(cases) {
  const check = predicate();
  for (const [label, mutate] of cases) {
    const { pkg, lock } = graph();
    mutate(pkg, lock);
    const before = snapshot([pkg, lock]);
    assert.throws(() => check(pkg, lock), undefined, label);
    assert.deepEqual([pkg, lock], before, `${label}: rejection mutated input`);
  }
}

test("historical graphs without direct browser tools remain admitted without mutation", () => {
  const check = predicate();
  for (const emptyMaps of [false, true]) {
    const { pkg, lock } = graph(false);
    if (emptyMaps) {
      pkg.devDependencies = {};
      lock.packages[""].devDependencies = {};
    }
    const before = snapshot([pkg, lock]);
    assert.equal(check(pkg, lock), undefined);
    assert.deepEqual([pkg, lock], before);
  }
});

test("the complete five-tool selection is development-only and accepts matching explicit false flags", () => {
  const check = predicate();
  const { pkg, lock } = graph();
  pkg.dependencies = { fastify: "5.12.5" };
  lock.packages[""].dependencies = { fastify: "5.12.5" };
  for (const name of Object.keys(pins)) {
    Object.assign(lock.packages[`node_modules/${name}`], { optional: false, peer: false, devOptional: false });
  }
  const before = snapshot([pkg, lock]);
  assert.equal(check(pkg, lock), undefined);
  assert.deepEqual([pkg, lock], before);
});

test("historical development transitive React metadata does not become a direct frontend selection", () => {
  const check = predicate();
  const { pkg, lock } = graph(false);
  lock.packages["node_modules/react"] = { version: "18.0.0", dev: true, peer: true };
  const before = snapshot([pkg, lock]);
  assert.equal(check(pkg, lock), undefined);
  assert.deepEqual([pkg, lock], before);
});

test("direct browser selection is all-or-none on both package and lock roots", () => {
  rejected(
    Object.keys(pins).flatMap((name) => [
      [
        `package missing ${name}`,
        (pkg) => {
          delete pkg.devDependencies[name];
        },
      ],
      [
        `lock root missing ${name}`,
        (_pkg, lock) => {
          delete lock.packages[""].devDependencies[name];
        },
      ],
      [
        `both roots missing only ${name}`,
        (pkg, lock) => {
          delete pkg.devDependencies[name];
          delete lock.packages[""].devDependencies[name];
        },
      ],
    ]),
  );
});

test("each selected tool requires its exact reviewed stable string pin and canonical source", () => {
  rejected(
    Object.keys(pins).flatMap((name) =>
      [
        undefined,
        19.3,
        "^19.3.0",
        "19.3.1",
        "19.3.0-beta",
        "file:../x",
        "npm:x@19.3.0",
        "https://example.com/tool.tgz",
      ].map((value) => [
        `${name} declaration ${String(value)}`,
        (pkg, lock) => {
          pkg.devDependencies[name] = value;
          lock.packages[""].devDependencies[name] = value;
          lock.packages[`node_modules/${name}`].version = value;
          lock.packages[`node_modules/${name}`].resolved =
            `https://registry.npmjs.org/${name}/-/${name.split("/").at(-1)}-${value}.tgz`;
        },
      ]),
    ),
  );
});

test("package and lock-root selected pins must agree", () => {
  rejected(
    Object.keys(pins).map((name) => [
      `${name} root disagreement`,
      (_pkg, lock) => {
        lock.packages[""].devDependencies[name] = "19.3.1";
      },
    ]),
  );
});

test("selected browser tools cannot use production or alternate root channels", () => {
  rejected(
    Object.keys(pins).flatMap((name) =>
      ["dependencies", "optionalDependencies", "peerDependencies"].flatMap((channel) => [
        [
          `package ${name} in ${channel}`,
          (pkg) => {
            pkg[channel] = { [name]: pins[name] };
          },
        ],
        [
          `lock root ${name} in ${channel}`,
          (_pkg, lock) => {
            lock.packages[""][channel] = { [name]: pins[name] };
          },
        ],
      ]),
    ),
  );
});

test("selected installed metadata requires matching version and strict development status", () => {
  rejected(
    Object.keys(pins).flatMap((name) => [
      [
        `missing installed ${name}`,
        (_pkg, lock) => {
          delete lock.packages[`node_modules/${name}`];
        },
      ],
      [
        `installed version ${name}`,
        (_pkg, lock) => {
          lock.packages[`node_modules/${name}`].version = "1.0.0";
        },
      ],
      ...[undefined, false, "true", 1].map((value) => [
        `${name} dev ${String(value)}`,
        (_pkg, lock) => {
          lock.packages[`node_modules/${name}`].dev = value;
        },
      ]),
    ]),
  );
});

test("optional, peer, devOptional and link flags cannot alter direct admission", () => {
  rejected(
    Object.keys(pins).flatMap((name) => [
      ...["optional", "peer", "devOptional"].flatMap((flag) =>
        [true, 0, "false", null].map((value) => [
          `${name} ${flag} ${String(value)}`,
          (_pkg, lock) => {
            lock.packages[`node_modules/${name}`][flag] = value;
          },
        ]),
      ),
      [
        `${name} link`,
        (_pkg, lock) => {
          lock.packages[`node_modules/${name}`].link = false;
        },
      ],
    ]),
  );
});

test("installed tarballs must be exact npm-registry identities rather than aliases or alternate hosts", () => {
  rejected(
    Object.keys(pins).flatMap((name) =>
      [
        "https://example.com/package.tgz",
        "http://registry.npmjs.org/package.tgz",
        "file:../package",
        "https://registry.npmjs.org/react/-/react-1.0.0.tgz",
      ].map((resolved) => [
        `${name} resolved ${resolved}`,
        (_pkg, lock) => {
          lock.packages[`node_modules/${name}`].resolved = resolved;
        },
      ]),
    ),
  );
});

test("direct integrity must be one canonical SHA-512 token encoding exactly sixty-four bytes", () => {
  rejected(
    Object.keys(pins).flatMap((name) =>
      [
        undefined,
        "sha512-bad",
        `sha256-${Buffer.alloc(32).toString("base64")}`,
        `${integrity} ${integrity}`,
        integrity.slice(0, -2),
      ].map((value) => [
        `${name} integrity ${String(value)}`,
        (_pkg, lock) => {
          lock.packages[`node_modules/${name}`].integrity = value;
        },
      ]),
    ),
  );
});

test("malformed records and non-v3 locks fail without mutation", () => {
  rejected([
    [
      "lock version",
      (_pkg, lock) => {
        lock.lockfileVersion = "3";
      },
    ],
    [
      "package development map",
      (pkg) => {
        pkg.devDependencies = [];
      },
    ],
    [
      "lock development map",
      (_pkg, lock) => {
        lock.packages[""].devDependencies = null;
      },
    ],
    [
      "installed record",
      (_pkg, lock) => {
        lock.packages["node_modules/react"] = [];
      },
    ],
    [
      "lock packages",
      (_pkg, lock) => {
        lock.packages = [];
      },
    ],
    [
      "lock root",
      (_pkg, lock) => {
        lock.packages[""] = null;
      },
    ],
  ]);
});
