/**
 * Check local E2E controller boundaries without building or importing the application or acceptance suite.
 * Run `node --test scripts/e2e-controller.test.mjs`. Tests use disposable loopback HTTP listeners and short child
 * processes to prove authentication, port replacement, responsive async execution and failure-visible cleanup.
 * No Docker service, host package, cloud resource or acceptance expectation is changed by these tests.
 */

import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { request } from "node:http";
import { join } from "node:path";
import { connect, createServer as createSocketServer } from "node:net";
import test from "node:test";
import * as controller from "./e2e-controller.mjs";
import {
  command,
  faultServer,
  isolatedCompose,
  loopbackOrigin,
  reserveApplicationPorts,
  withCleanup,
} from "./e2e-controller.mjs";

const fixedPorts = { api: 49152, frontend: 49153 };

const config = () => ({
  name: "ordinary-local-app",
  services: {
    api: {
      user: "10001:10001",
      read_only: true,
      build: { context: process.cwd(), dockerfile: "server/Dockerfile" },
      networks: { default: null },
    },
    frontend: {
      user: "101:101",
      read_only: true,
      build: { context: join(process.cwd(), "frontend") },
      networks: { default: null },
      ports: [{ target: 8080, published: "8080", host_ip: "127.0.0.1" }],
    },
  },
  networks: { default: { name: "ordinary-local-app_default" } },
});

test("isolation replaces inherited fixed ports and image/network names without mutating the source", () => {
  const source = config();
  const isolated = isolatedCompose(source, "mp3-e2e-test-123", process.cwd(), fixedPorts);
  assert.equal(source.services.frontend.ports[0].published, "8080");
  assert.equal(isolated.name, "mp3-e2e-test-123");
  assert.equal(isolated.networks.default.name, "mp3-e2e-test-123_default");
  for (const [name, service] of Object.entries(isolated.services)) {
    assert.equal(service.ports.length, 1);
    assert.equal(service.ports[0].host_ip, "127.0.0.1");
    assert.equal(service.ports[0].published, String(fixedPorts[name]));
    assert.equal(service.ports[0].target, name === "api" ? 3000 : 8080);
    assert.equal(service.image, `mp3-e2e-test-123-${name}:tested`);
  }
});

/** Model the one reviewed root-lock frontend build, without reading any application Dockerfile or building an image. */
const rootFrontendConfig = () => {
  const source = config();
  source.services.frontend.build = { context: process.cwd(), dockerfile: "frontend/Dockerfile" };
  return source;
};

test("root-context frontend admits only its explicit Dockerfile and preserves isolated input and service boundaries", () => {
  const source = rootFrontendConfig();
  const before = structuredClone(source);
  const isolated = isolatedCompose(source, "mp3-e2e-test-123", process.cwd(), fixedPorts);
  assert.deepEqual(source, before);
  assert.deepEqual(Object.keys(isolated.services).sort(), ["api", "frontend"]);
  assert.deepEqual(isolated.services.api.build, { context: process.cwd(), dockerfile: "server/Dockerfile" });
  assert.deepEqual(isolated.services.frontend.build, { context: process.cwd(), dockerfile: "frontend/Dockerfile" });
  assert.deepEqual(isolated.networks, { default: { name: "mp3-e2e-test-123_default" } });
  for (const [name, service] of Object.entries(isolated.services)) {
    assert.equal(service.read_only, true);
    assert.equal(service.user, name === "api" ? "10001:10001" : "101:101");
    assert.equal(service.image, `mp3-e2e-test-123-${name}:tested`);
    assert.deepEqual(service.ports, [
      {
        target: name === "api" ? 3000 : 8080,
        published: String(fixedPorts[name]),
        host_ip: "127.0.0.1",
        protocol: "tcp",
      },
    ]);
  }
});

test("legacy frontend context retains both default and explicit local Dockerfile without input mutation", () => {
  for (const explicit of [false, true]) {
    const source = config();
    if (explicit) source.services.frontend.build.dockerfile = "Dockerfile";
    const before = structuredClone(source);
    const isolated = isolatedCompose(source, "mp3-e2e-test-123", process.cwd(), fixedPorts);
    assert.deepEqual(source, before);
    assert.deepEqual(isolated.services.frontend.build, source.services.frontend.build);
  }
});

test("root-context frontend rejects missing, foreign, absolute and traversing Dockerfile selections", () => {
  for (const dockerfile of [
    undefined,
    "Dockerfile",
    "server/Dockerfile",
    join(process.cwd(), "frontend", "Dockerfile"),
    "../frontend/Dockerfile",
    "frontend/../frontend/Dockerfile",
  ]) {
    const source = rootFrontendConfig();
    if (dockerfile === undefined) delete source.services.frontend.build.dockerfile;
    else source.services.frontend.build.dockerfile = dockerfile;
    const before = structuredClone(source);
    assert.throws(() => isolatedCompose(source, "mp3-e2e-test-123", process.cwd(), fixedPorts));
    assert.deepEqual(source, before);
  }
});

test("legacy frontend context rejects the root-qualified Dockerfile rather than broadening path matching", () => {
  const source = config();
  source.services.frontend.build.dockerfile = "frontend/Dockerfile";
  const before = structuredClone(source);
  assert.throws(() => isolatedCompose(source, "mp3-e2e-test-123", process.cwd(), fixedPorts));
  assert.deepEqual(source, before);
});

test("frontend rejects all contexts outside the two reviewed repository locations", () => {
  for (const context of [join(process.cwd(), ".."), join(process.cwd(), "server"), join(process.cwd(), "other")]) {
    const source = rootFrontendConfig();
    source.services.frontend.build.context = context;
    const before = structuredClone(source);
    assert.throws(() => isolatedCompose(source, "mp3-e2e-test-123", process.cwd(), fixedPorts));
    assert.deepEqual(source, before);
  }
});

test("frontend root-lock support does not alter the API root and server Dockerfile contract", () => {
  const mutations = [
    (source) => (source.services.api.build.context = join(process.cwd(), "server")),
    (source) => (source.services.api.build.dockerfile = "frontend/Dockerfile"),
    (source) => delete source.services.api.build.dockerfile,
  ];
  for (const mutate of mutations) {
    const source = config();
    mutate(source);
    const before = structuredClone(source);
    assert.throws(() => isolatedCompose(source, "mp3-e2e-test-123", process.cwd(), fixedPorts));
    assert.deepEqual(source, before);
  }
});

test("admitted root-context frontend retains non-root, read-only, network, two-service and build-secret guards", () => {
  // Require the new positive case before treating any subsequent rejection as evidence about its safety guards.
  isolatedCompose(rootFrontendConfig(), "mp3-e2e-test-123", process.cwd(), fixedPorts);
  const mutations = [
    (source) => (source.services.frontend.user = "0:0"),
    (source) => (source.services.frontend.read_only = false),
    (source) => (source.services.frontend.network_mode = "host"),
    (source) => (source.networks.default.external = true),
    (source) => (source.services.extra = structuredClone(source.services.api)),
    (source) => (source.services.frontend.build.additional_contexts = { private: "../private" }),
    (source) => (source.services.frontend.build.ssh = ["default"]),
    (source) => (source.services.frontend.build.secrets = ["private"]),
    (source) => (source.services.frontend.secrets = ["private"]),
    (source) => (source.secrets = { private: { file: "/private" } }),
    (source) => (source.services.frontend.build.dockerfile_inline = "FROM forbidden"),
  ];
  for (const mutate of mutations) {
    const source = rootFrontendConfig();
    mutate(source);
    const before = structuredClone(source);
    assert.throws(() => isolatedCompose(source, "mp3-e2e-test-123", process.cwd(), fixedPorts));
    assert.deepEqual(source, before);
  }
});

test("unsafe mounts, host networking, root identity, external networks and extra services fail before lifecycle", () => {
  const mutations = [
    (value) => (value.services.api.volumes = [{ type: "bind", source: "/var/run/docker.sock", target: "/socket" }]),
    (value) => (value.services.api.network_mode = "host"),
    (value) => (value.services.api.privileged = true),
    (value) => (value.services.api.use_api_socket = true),
    (value) => (value.services.api.user = "0:0"),
    (value) => (value.services.api.user = "00:0"),
    (value) => (value.services.api.build.context = ".."),
    (value) => (value.services.frontend.build.dockerfile = "../server/Dockerfile"),
    (value) => (value.services.api.read_only = false),
    (value) => (value.networks.default.external = true),
    (value) => (value.services.database = structuredClone(value.services.api)),
    (value) => (value.services.api.build.ssh = ["default"]),
  ];
  for (const mutate of mutations) {
    const source = config();
    mutate(source);
    assert.throws(() => isolatedCompose(source, "mp3-e2e-test-123", process.cwd(), fixedPorts));
  }
});

test("Docker endpoint parsing rejects public addresses, aliases, invalid ports and multiple bindings", () => {
  assert.equal(loopbackOrigin("127.0.0.1:49152\n"), "http://127.0.0.1:49152");
  for (const binding of [
    "0.0.0.0:80",
    "localhost:8080",
    "127.0.0.1:0",
    "127.0.0.1:65536",
    "127.0.0.1:80\n127.0.0.1:81",
  ]) {
    assert.throws(() => loopbackOrigin(binding));
  }
});

test("authenticated fault server rejects wrong tokens, browser origins, methods and route ambiguity", async (t) => {
  const token = randomBytes(32).toString("hex");
  const actions = [];
  const server = await faultServer(token, async (action) => {
    actions.push(action);
  });
  t.after(() => server.close());
  const headers = { "x-acceptance-control-token": token };
  const requests = [
    ["/stop", { method: "POST", headers: { "x-acceptance-control-token": "incorrect" } }],
    ["/stop", { method: "POST", headers: { ...headers, origin: "http://127.0.0.1:8080" } }],
    ["/stop", { method: "GET", headers }],
    ["/stop?ignored=true", { method: "POST", headers }],
    ["/stop", { method: "POST", headers, body: "unaccepted body" }],
  ];
  for (const [path, options] of requests) assert.equal((await fetch(`${server.origin}${path}`, options)).status, 403);
  const wrongHost = await new Promise((resolve, reject) => {
    const pending = request(
      `${server.origin}/stop`,
      { method: "POST", headers: { ...headers, host: "localhost" } },
      (response) => {
        response.resume();
        resolve(response.statusCode);
      },
    );
    pending.on("error", reject);
    pending.end();
  });
  assert.equal(wrongHost, 403);
  assert.deepEqual(actions, []);
  for (const action of ["stop", "start", "pause", "resume"]) {
    const response = await fetch(`${server.origin}/${action}`, { method: "POST", headers });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  }
  assert.deepEqual(actions, ["stop", "start", "pause", "resume"]);
});

test("failed control operations return a generic failure without exposing command details", async (t) => {
  const token = randomBytes(32).toString("hex");
  const server = await faultServer(token, async () => {
    throw new Error("sensitive command diagnostic");
  });
  t.after(() => server.close());
  const response = await fetch(`${server.origin}/pause`, {
    method: "POST",
    headers: { "x-acceptance-control-token": token },
  });
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Control operation failed" });
});

test("long child execution leaves the loopback controller responsive and nonzero child exits fail", async (t) => {
  const token = randomBytes(32).toString("hex");
  const server = await faultServer(token, async () => {});
  t.after(() => server.close());
  const child = command(process.execPath, ["-e", "setTimeout(() => process.exit(0), 300)"], { timeoutMs: 2000 });
  const response = await fetch(`${server.origin}/stop`, {
    method: "POST",
    headers: { "x-acceptance-control-token": token },
    signal: AbortSignal.timeout(1000),
  });
  assert.equal(response.status, 200);
  await child;
  await assert.rejects(command(process.execPath, ["-e", "process.exit(7)"], { timeoutMs: 1000 }), /exit 7/);
  await assert.rejects(
    command(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { timeoutMs: 100 }),
    /deadline/,
  );
});

test("lifecycle failure always cleans up and a cleanup failure can never turn into success", async () => {
  let cleaned = 0;
  await assert.rejects(
    withCleanup(
      async () => {
        throw new Error("suite failed");
      },
      async () => {
        cleaned++;
      },
    ),
    /suite failed/,
  );
  assert.equal(cleaned, 1);
  await assert.rejects(
    withCleanup(
      async () => "passed",
      async () => {
        throw new Error("cleanup failed");
      },
    ),
    /cleanup failed/,
  );
  await assert.rejects(
    withCleanup(
      async () => {
        throw new Error("suite failed");
      },
      async () => {
        throw new Error("cleanup failed");
      },
    ),
    (error) => error instanceof AggregateError && error.errors.length === 2,
  );
});

test("signal cancellation terminates child execution and still runs lifecycle cleanup", async () => {
  const abort = new AbortController();
  let cleaned = false;
  const pending = withCleanup(
    () => command(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { timeoutMs: 2000, signal: abort.signal }),
    async () => {
      cleaned = true;
    },
  );
  abort.abort();
  await assert.rejects(pending, /interrupted/);
  assert.equal(cleaned, true);
});

test("stable publication requires two distinct valid reserved ports", () => {
  for (const ports of [
    undefined,
    {},
    { api: 0, frontend: 49153 },
    { api: 49152, frontend: 49152 },
    { api: 49152, frontend: 65536 },
    { api: "49152", frontend: 49153 },
  ]) {
    assert.throws(() => isolatedCompose(config(), "mp3-e2e-test-123", process.cwd(), ports));
  }
});

async function bindProbe(port) {
  const server = createSocketServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port, exclusive: true }, resolve);
  });
  return server;
}

async function closeProbe(server) {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

test("OS-selected loopback reservations are unique, held until release and released idempotently", async (t) => {
  const reservation = await reserveApplicationPorts();
  t.after(() => reservation.release());
  assert.notEqual(reservation.ports.api, reservation.ports.frontend);
  for (const port of Object.values(reservation.ports)) {
    await assert.rejects(bindProbe(port), (error) => error.code === "EADDRINUSE");
  }
  await reservation.release();
  await reservation.release();
  for (const port of Object.values(reservation.ports)) {
    const probe = await bindProbe(port);
    assert.equal(probe.address().address, "127.0.0.1");
    assert.equal(probe.address().port, port);
    await closeProbe(probe);
  }
});

test("pre-start lifecycle failure releases both reserved host ports", async () => {
  const reservation = await reserveApplicationPorts();
  await assert.rejects(
    withCleanup(async () => {
      throw new Error("build failed before startup");
    }, reservation.release),
    /build failed before startup/,
  );
  for (const port of Object.values(reservation.ports)) {
    const probe = await bindProbe(port);
    await closeProbe(probe);
  }
});

// Independent TR-r1 expectations: synthetic Docker observations and loopback HTTP only. These tests do not supply
// a graceful-drain verdict; that requires the separately reviewed diagnostic and actual application observations.
const lifecycleTarget = {
  project: "mp3-e2e-lifecycle-expectations",
  service: "api",
  containerId: "a".repeat(64),
  imageId: `sha256:${"b".repeat(64)}`,
};
const generationA = { startedAt: "2026-10-10T09:00:00.123456789Z", restartCount: 0 };
const generationB = { startedAt: "2026-10-10T09:01:00.987654321Z", restartCount: 1 };
const runningState = {
  running: true,
  paused: false,
  restarting: false,
  dead: false,
  exitCode: 0,
  oomKilled: false,
  hasError: false,
};

function dockerRecord(generation = generationA) {
  return {
    Id: lifecycleTarget.containerId,
    Image: lifecycleTarget.imageId,
    RestartCount: generation.restartCount,
    Config: {
      Labels: {
        "com.docker.compose.project": lifecycleTarget.project,
        "com.docker.compose.service": "api",
      },
      Env: ["SYNTHETIC_SECRET=must-not-escape"],
    },
    State: {
      Running: true,
      Paused: false,
      Restarting: false,
      Dead: false,
      ExitCode: 0,
      OOMKilled: false,
      Error: "",
      StartedAt: generation.startedAt,
      Pid: 12345,
    },
    Mounts: [{ Source: "/synthetic/private/path" }],
  };
}

function stateResponse(generation = generationA, state = runningState) {
  return {
    schemaVersion: 1,
    kind: "api-lifecycle-state",
    target: { ...lifecycleTarget },
    generation: { ...generation },
    state: { ...state },
  };
}

function signalResponse(generation = generationA) {
  return {
    schemaVersion: 1,
    kind: "api-signal-acknowledgment",
    signal: "SIGTERM",
    target: { ...lifecycleTarget },
    generation: { ...generation },
  };
}

function lifecycleFactory() {
  assert.equal(typeof controller.createApiLifecycle, "function", "TR-r1 requires createApiLifecycle export");
  return controller.createApiLifecycle;
}

function lifecycleOptions(runDocker) {
  return {
    project: lifecycleTarget.project,
    containerId: lifecycleTarget.containerId,
    imageId: lifecycleTarget.imageId,
    runDocker,
  };
}

function deferred() {
  let resolve;
  const promise = new Promise((settle) => (resolve = settle));
  return { promise, resolve };
}

async function controlRequest(origin, token, path, options = {}) {
  return fetch(`${origin}${path}`, {
    method: "POST",
    headers: { "x-acceptance-control-token": token, ...options.headers },
    signal: AbortSignal.timeout(2000),
    ...options,
  });
}

/** Preserve duplicate/raw header bytes; a parser close is permitted, but timeout and callback effects are not. */
async function rawControl(origin, lines, method = "POST", path = "/state", body = "") {
  const port = Number(new URL(origin).port);
  return new Promise((resolve, reject) => {
    const socket = connect({ host: "127.0.0.1", port });
    let bytes = "";
    let failure;
    socket.setTimeout(2000, () => {
      failure = new Error("Raw controller request did not terminate within its test deadline");
      socket.destroy();
    });
    socket.on("connect", () => socket.write(`${method} ${path} HTTP/1.1\r\n${lines.join("\r\n")}\r\n\r\n${body}`));
    socket.on("data", (chunk) => {
      bytes += chunk.toString();
      if (Buffer.byteLength(bytes) > 16 * 1024) {
        failure = new Error("Unexpectedly large control response");
        socket.destroy();
      }
    });
    socket.on("error", (error) => {
      if (error.code !== "ECONNRESET") failure = error;
    });
    socket.on("close", () => {
      if (failure) reject(failure);
      else resolve({ status: Number(/^HTTP\/1\.1 (\d+)/.exec(bytes)?.[1]) || null, bytes });
    });
  });
}

test("TR constructor refuses caller target ambiguity before invoking Docker", () => {
  const create = lifecycleFactory();
  let calls = 0;
  const valid = lifecycleOptions(async () => calls++);
  for (const [key, values] of Object.entries({
    project: ["other-project", "mp3-e2e-", "mp3-e2e-x/../y", "mp3-e2e-" + "x".repeat(121), null],
    containerId: ["a".repeat(63), "A".repeat(64), "--help", null],
    imageId: ["b".repeat(64), "sha256:" + "B".repeat(64), "image:latest", null],
    runDocker: [undefined, "docker", {}],
  })) {
    for (const value of values) assert.throws(() => create({ ...valid, [key]: value }), `${key}: ${value}`);
  }
  assert.equal(calls, 0);
  assert.doesNotThrow(() => create({ ...valid, project: "mp3-e2e-" + "x".repeat(120) }));
});

test("TR state inspects only the fixed ID and returns the exact safe projection", async () => {
  const create = lifecycleFactory();
  const calls = [];
  const lifecycle = create(
    lifecycleOptions(async (args) => {
      calls.push(args);
      return JSON.stringify([dockerRecord()]);
    }),
  );
  const result = await lifecycle.state();
  assert.deepEqual(calls, [["inspect", lifecycleTarget.containerId]]);
  assert.deepEqual(result, stateResponse());
  assert.doesNotMatch(JSON.stringify(result), /SYNTHETIC_SECRET|must-not-escape|private|Mounts|Pid|Config|Labels/);
  result.target.containerId = "c".repeat(64);
  result.generation.startedAt = generationB.startedAt;
  assert.deepEqual(await lifecycle.state(), stateResponse(), "Returned values cannot replace factory authority");
});

test("TR inspect rejects malformed, absent, multiple or substituted container identities", async () => {
  const create = lifecycleFactory();
  const observations = ["not json", "null", "{}", "[]", JSON.stringify([dockerRecord(), dockerRecord()])];
  for (const change of [
    (value) => {
      value.Id = "c".repeat(64);
    },
    (value) => {
      value.Image = `sha256:${"d".repeat(64)}`;
    },
    (value) => {
      value.Config.Labels["com.docker.compose.project"] = "mp3-e2e-unrelated";
    },
    (value) => {
      value.Config.Labels["com.docker.compose.service"] = "frontend";
    },
    (value) => {
      delete value.Config;
    },
    (value) => {
      delete value.Config.Labels;
    },
    (value) => {
      delete value.State;
    },
  ]) {
    const value = dockerRecord();
    change(value);
    observations.push(JSON.stringify([value]));
  }
  for (const observation of observations) {
    const calls = [];
    const lifecycle = create(
      lifecycleOptions(async (args) => {
        calls.push(args);
        return observation;
      }),
    );
    await assert.rejects(lifecycle.state());
    await assert.rejects(lifecycle.signalTerm());
    assert(
      calls.every((args) => args[0] === "inspect"),
      "Bad identities must never reach kill",
    );
  }
});

test("TR state and generation require complete typed nonzero UTC Docker observations", async () => {
  const create = lifecycleFactory();
  const mutations = [];
  for (const key of ["Running", "Paused", "Restarting", "Dead", "OOMKilled"]) {
    mutations.push((value) => {
      delete value.State[key];
    });
    mutations.push((value) => {
      value.State[key] = "false";
    });
  }
  for (const value of [-1, 256, 0.5, "0", null])
    mutations.push((record) => {
      record.State.ExitCode = value;
    });
  mutations.push((value) => {
    delete value.State.ExitCode;
  });
  for (const value of [null, false, {}])
    mutations.push((record) => {
      record.State.Error = value;
    });
  mutations.push((value) => {
    delete value.State.Error;
  });
  for (const value of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, "0", null]) {
    mutations.push((record) => {
      record.RestartCount = value;
    });
  }
  mutations.push((value) => {
    delete value.RestartCount;
  });
  for (const value of [
    "0001-01-01T00:00:00Z",
    "2026-02-30T09:00:00Z",
    "2026-10-10T25:00:00Z",
    "2026-10-10T09:00:00+00:00",
    "2026-10-10",
    "",
    null,
  ])
    mutations.push((record) => {
      record.State.StartedAt = value;
    });
  mutations.push((value) => {
    delete value.State.StartedAt;
  });
  for (const mutate of mutations) {
    const value = dockerRecord();
    mutate(value);
    const lifecycle = create(lifecycleOptions(async () => JSON.stringify([value])));
    await assert.rejects(lifecycle.state());
  }
  for (const startedAt of ["2026-10-10T09:00:00Z", "2026-10-10T09:00:00.001Z", generationA.startedAt]) {
    const generation = { startedAt, restartCount: 0 };
    const lifecycle = create(lifecycleOptions(async () => JSON.stringify([dockerRecord(generation)])));
    assert.deepEqual((await lifecycle.state()).generation, generation, "Timestamp bytes must survive projection");
  }
});

test("TR inspect enforces the inclusive 1 MiB UTF-8 bound before projecting unknown fields", async () => {
  const create = lifecycleFactory();
  const record = dockerRecord();
  record.ignored = "";
  const overhead = Buffer.byteLength(JSON.stringify([record]));
  record.ignored = "x".repeat(1024 * 1024 - overhead);
  const exact = JSON.stringify([record]);
  assert.equal(Buffer.byteLength(exact), 1024 * 1024);
  assert.deepEqual(await create(lifecycleOptions(async () => exact)).state(), stateResponse());
  for (const oversized of [exact + " ", exact.replace(/x(?=x)/, "é")]) {
    assert.equal(Buffer.byteLength(oversized), 1024 * 1024 + 1);
    await assert.rejects(create(lifecycleOptions(async () => oversized)).state());
  }
  for (const notStdout of [undefined, {}, Buffer.from(exact)]) {
    await assert.rejects(create(lifecycleOptions(async () => notStdout)).state());
  }
});

test("TR readback preserves abnormal and running states without inventing a graceful verdict", async () => {
  const create = lifecycleFactory();
  for (const [stateChange, expectedChange] of [
    [{}, {}],
    [{ Running: false }, { running: false }],
    [
      { Running: false, ExitCode: 137 },
      { running: false, exitCode: 137 },
    ],
    [
      { Running: false, OOMKilled: true },
      { running: false, oomKilled: true },
    ],
    [
      { Running: false, Error: "SYNTHETIC_SECRET=diagnostic" },
      { running: false, hasError: true },
    ],
    [{ Paused: true }, { paused: true }],
    [{ Restarting: true }, { restarting: true }],
    [{ Dead: true }, { dead: true }],
  ]) {
    const record = dockerRecord();
    Object.assign(record.State, stateChange);
    const result = await create(lifecycleOptions(async () => JSON.stringify([record]))).state();
    assert.deepEqual(result, stateResponse(generationA, { ...runningState, ...expectedChange }));
    assert.doesNotMatch(JSON.stringify(result), /SYNTHETIC_SECRET|graceful|drained|deadline|verdict/);
  }
});

test("TR signal uses exact fixed commands and permits a fast normal exit after daemon acknowledgment", async () => {
  const create = lifecycleFactory();
  for (const exitsBeforeReadback of [false, true]) {
    const calls = [];
    const record = dockerRecord();
    const lifecycle = create(
      lifecycleOptions(async (args) => {
        calls.push(args);
        if (args[0] === "kill") {
          record.State.Running = !exitsBeforeReadback;
          return `\n ${lifecycleTarget.containerId}\n`;
        }
        return JSON.stringify([record]);
      }),
    );
    assert.deepEqual(await lifecycle.signalTerm(), signalResponse());
    assert.deepEqual(calls, [
      ["inspect", lifecycleTarget.containerId],
      ["kill", "--signal", "SIGTERM", lifecycleTarget.containerId],
      ["inspect", lifecycleTarget.containerId],
    ]);
    assert.equal((await lifecycle.state()).state.running, !exitsBeforeReadback);
  }
});

test("TR signal refuses stopped, paused, restarting or dead preflight without a mutation", async () => {
  const create = lifecycleFactory();
  for (const stateChange of [{ Running: false }, { Paused: true }, { Restarting: true }, { Dead: true }]) {
    const record = dockerRecord();
    Object.assign(record.State, stateChange);
    const calls = [];
    const lifecycle = create(
      lifecycleOptions(async (args) => {
        calls.push(args);
        return JSON.stringify([record]);
      }),
    );
    await assert.rejects(lifecycle.signalTerm());
    assert(calls.every((args) => args[0] === "inspect"));
  }
});

test("TR successful attempts cannot repeat a generation but a restored new generation remains usable", async () => {
  const create = lifecycleFactory();
  let record = dockerRecord();
  let kills = 0;
  const lifecycle = create(
    lifecycleOptions(async (args) => {
      if (args[0] === "kill") {
        kills++;
        return lifecycleTarget.containerId;
      }
      return JSON.stringify([record]);
    }),
  );
  assert.deepEqual(await lifecycle.signalTerm(), signalResponse());
  await assert.rejects(lifecycle.signalTerm());
  assert.equal(kills, 1);
  // Simulate the independently owned old-action restore; the factory exposes no restart operation of its own.
  record = dockerRecord(generationB);
  assert.deepEqual(await lifecycle.state(), stateResponse(generationB));
  assert.deepEqual(await lifecycle.signalTerm(), signalResponse(generationB));
  assert.equal(kills, 2);
  record = dockerRecord(generationA);
  await assert.rejects(lifecycle.signalTerm(), "Returning an old generation cannot erase its prior attempt");
  assert.equal(kills, 2);
});

test("TR failed, canceled or timed-out signal latches uncertainty across future generations", async () => {
  const create = lifecycleFactory();
  for (const cause of [
    new Error("timeout"),
    new Error("nonzero Docker exit"),
    new DOMException("canceled", "AbortError"),
  ]) {
    let record = dockerRecord();
    let kills = 0;
    const lifecycle = create(
      lifecycleOptions(async (args) => {
        if (args[0] === "kill") {
          kills++;
          throw cause;
        }
        return JSON.stringify([record]);
      }),
    );
    await assert.rejects(lifecycle.signalTerm());
    record = dockerRecord(generationB);
    assert.deepEqual(
      await lifecycle.state(),
      stateResponse(generationB),
      "Readback remains available after uncertainty",
    );
    await assert.rejects(lifecycle.signalTerm());
    assert.equal(kills, 1, "An old start/resume cannot clear controller-wide uncertainty");
  }
});

test("TR malformed or oversized kill acknowledgments cannot authorize retry on another generation", async () => {
  const create = lifecycleFactory();
  for (const acknowledgment of [
    "",
    "c".repeat(64),
    lifecycleTarget.containerId + "\nextra",
    null,
    " ".repeat(1025 - lifecycleTarget.containerId.length) + lifecycleTarget.containerId,
  ]) {
    let record = dockerRecord();
    let kills = 0;
    const lifecycle = create(
      lifecycleOptions(async (args) => {
        if (args[0] === "kill") {
          kills++;
          return acknowledgment;
        }
        return JSON.stringify([record]);
      }),
    );
    await assert.rejects(lifecycle.signalTerm());
    record = dockerRecord(generationB);
    await assert.rejects(lifecycle.signalTerm());
    assert.equal(kills, 1);
    assert.deepEqual(await lifecycle.state(), stateResponse(generationB));
  }
  const exact = " ".repeat(1024 - lifecycleTarget.containerId.length) + lifecycleTarget.containerId;
  const lifecycle = create(
    lifecycleOptions(async (args) => (args[0] === "kill" ? exact : JSON.stringify([dockerRecord()]))),
  );
  assert.deepEqual(await lifecycle.signalTerm(), signalResponse(), "The 1 KiB acknowledgment bound is inclusive");
});

test("TR post-signal inspect failure or A-to-B race permanently blocks further signal attempts", async () => {
  const create = lifecycleFactory();
  for (const failure of ["throw", "malformed", "target", "generation"]) {
    let afterKill = false;
    let diagnose = false;
    let kills = 0;
    const lifecycle = create(
      lifecycleOptions(async (args) => {
        if (args[0] === "kill") {
          afterKill = true;
          kills++;
          return lifecycleTarget.containerId;
        }
        if (diagnose) return JSON.stringify([dockerRecord(generationB)]);
        if (!afterKill) return JSON.stringify([dockerRecord()]);
        if (failure === "throw") throw new Error("inspect canceled after successful kill");
        if (failure === "malformed") return "[]";
        const changed = dockerRecord(failure === "generation" ? generationB : generationA);
        if (failure === "target") changed.Image = `sha256:${"c".repeat(64)}`;
        return JSON.stringify([changed]);
      }),
    );
    await assert.rejects(lifecycle.signalTerm());
    diagnose = true;
    assert.deepEqual(await lifecycle.state(), stateResponse(generationB));
    await assert.rejects(lifecycle.signalTerm());
    assert.equal(kills, 1, "A detected inspect/kill race must not signal the replacement generation");
  }
});

test("TR direct overlapping signal calls cannot bypass the ledger while inspection or kill is pending", async () => {
  const create = lifecycleFactory();
  for (const blockedOperation of ["inspect", "kill"]) {
    const entered = deferred();
    const release = deferred();
    let blocked = false;
    const calls = [];
    const lifecycle = create(
      lifecycleOptions(async (args) => {
        calls.push(args);
        if (args[0] === blockedOperation && !blocked) {
          blocked = true;
          entered.resolve();
          await release.promise;
        }
        return args[0] === "kill" ? lifecycleTarget.containerId : JSON.stringify([dockerRecord()]);
      }),
    );
    const first = lifecycle.signalTerm();
    await entered.promise;
    const count = calls.length;
    try {
      await assert.rejects(lifecycle.signalTerm());
      assert.equal(calls.length, count, "Overlap must not issue another inspect or kill");
    } finally {
      release.resolve();
      await first;
    }
    assert.equal(calls.filter((args) => args[0] === "kill").length, 1);
  }
});

test("TR HTTP returns exact state-200 and signal-202 schemas while old response bytes stay unchanged", async (t) => {
  const token = randomBytes(32).toString("hex");
  const actions = [];
  const server = await faultServer(token, async (action) => {
    actions.push(action);
    if (action === "state") return stateResponse();
    if (action === "signal-term") return signalResponse();
    return { ignoredOldCallbackValue: "SYNTHETIC_SECRET" };
  });
  t.after(() => server.close());
  for (const [path, status, expected] of [
    ["/state", 200, stateResponse()],
    ["/signal-term", 202, signalResponse()],
  ]) {
    const response = await controlRequest(server.origin, token, path);
    assert.equal(response.status, status);
    assert.match(response.headers.get("content-type"), /^application\/json/);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.text();
    assert.deepEqual(JSON.parse(body), expected);
    assert(Buffer.byteLength(body) <= 4096);
  }
  for (const action of ["stop", "start", "pause", "resume"]) {
    const response = await controlRequest(server.origin, token, `/${action}`);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), '{"status":"ok"}');
  }
  assert.deepEqual(actions, ["state", "signal-term", "stop", "start", "pause", "resume"]);
});

test("TR HTTP validates closed callback schemas and never returns unexpected or oversized data", async (t) => {
  const token = randomBytes(32).toString("hex");
  let result;
  const server = await faultServer(token, async () => result);
  t.after(() => server.close());
  const invalidStates = [undefined, null, {}, signalResponse(), { ...stateResponse(), secret: "SYNTHETIC_SECRET" }];
  for (const mutate of [
    (value) => {
      value.schemaVersion = 2;
    },
    (value) => {
      value.target.secret = "SYNTHETIC_SECRET";
    },
    (value) => {
      value.target.containerId = "short";
    },
    (value) => {
      value.target.service = "frontend";
    },
    (value) => {
      value.generation.secret = "SYNTHETIC_SECRET";
    },
    (value) => {
      value.generation.startedAt = "0001-01-01T00:00:00Z";
    },
    (value) => {
      value.generation.restartCount = -1;
    },
    (value) => {
      value.state.running = "false";
    },
    (value) => {
      delete value.state.dead;
    },
    (value) => {
      value.state.exitCode = 256;
    },
    (value) => {
      value.state.error = "SYNTHETIC_SECRET";
    },
    (value) => {
      value.target.project = "mp3-e2e-" + "SYNTHETIC_SECRET".repeat(400);
    },
  ]) {
    const value = stateResponse();
    mutate(value);
    invalidStates.push(value);
  }
  const invalidSignals = [
    {},
    stateResponse(),
    { ...signalResponse(), signal: "SIGKILL" },
    { ...signalResponse(), graceful: true },
    { ...signalResponse(), target: { ...lifecycleTarget, secret: "SYNTHETIC_SECRET" } },
    { ...signalResponse(), target: { ...lifecycleTarget, imageId: "image:latest" } },
    { ...signalResponse(), generation: { ...generationA, startedAt: "not-a-timestamp" } },
    { ...signalResponse(), generation: { ...generationA, restartCount: "0" } },
    { ...signalResponse(), generation: { ...generationA, extra: "SYNTHETIC_SECRET" } },
  ];
  for (const [path, values] of [
    ["/state", invalidStates],
    ["/signal-term", invalidSignals],
  ]) {
    for (const value of values) {
      result = value;
      const response = await controlRequest(server.origin, token, path);
      assert.equal(response.status, 500);
      const body = await response.text();
      assert.equal(body, '{"error":"Control operation failed"}');
      assert.doesNotMatch(body, /SYNTHETIC_SECRET|SIGKILL|graceful/);
    }
  }
});

test("TR new HTTP routes reject wrong authority, browser requests and caller parameters before effects", async (t) => {
  const token = randomBytes(32).toString("hex");
  const calls = [];
  const server = await faultServer(token, async (action) => {
    calls.push(action);
    return stateResponse();
  });
  t.after(() => server.close());
  for (const path of ["/state", "/signal-term"]) {
    const headers = { "x-acceptance-control-token": token };
    for (const [actualPath, options] of [
      [path, { headers: {} }],
      [path, { headers: { "x-acceptance-control-token": "wrong" } }],
      [path, { headers: { ...headers, Origin: "https://example.invalid" } }],
      [path, { method: "GET" }],
      [path, { method: "PUT" }],
      [path, { body: "SIGKILL" }],
      [`${path}?container=${"c".repeat(64)}`, {}],
      [`${path}/`, {}],
      [path.replace("s", "%73"), {}],
    ]) {
      const response = await controlRequest(server.origin, token, actualPath, options);
      assert.equal(response.status, 403);
      await response.arrayBuffer();
    }
  }
  assert.deepEqual(calls, []);
});

test("TR raw duplicate Host, token or framing headers cannot reach any control callback", async (t) => {
  const token = randomBytes(32).toString("hex");
  let calls = 0;
  const server = await faultServer(token, async () => {
    calls++;
    return stateResponse();
  });
  t.after(() => server.close());
  const host = `Host: ${new URL(server.origin).host}`;
  const auth = `X-Acceptance-Control-Token: ${token}`;
  for (const path of ["/stop", "/state", "/signal-term"]) {
    for (const extra of [
      [host],
      ["host: attacker.invalid"],
      [auth],
      [`x-acceptance-control-token: ${token}`],
      ["Content-Length: 0", "Content-Length: 0"],
      ["Content-Length: 00"],
      ["Transfer-Encoding: chunked", "Content-Length: 0"],
      ["Origin: https://example.invalid", "Origin: https://another.invalid"],
    ]) {
      const response = await rawControl(server.origin, [host, auth, ...extra, "Connection: close"], "POST", path);
      assert(response.status === 403 || response.status === null, `Unexpected status ${response.status}`);
      assert.equal(calls, 0, "Duplicate security/framing headers must never be silently normalized");
    }
  }
});

test("TR the 16-field ceiling is explicit and a late Origin cannot disappear through truncation", async (t) => {
  const token = randomBytes(32).toString("hex");
  const calls = [];
  const server = await faultServer(token, async (action) => {
    calls.push(action);
    return stateResponse();
  });
  t.after(() => server.close());
  const lines = [
    `Host: ${new URL(server.origin).host}`,
    `X-Acceptance-Control-Token: ${token}`,
    "Content-Length: 0",
    "Connection: close",
    ...Array.from({ length: 12 }, (_, i) => `X-Filler-${i}: value`),
  ];
  assert.equal(lines.length, 16);
  for (const extra of ["X-Seventeenth: ignored", "Origin: https://example.invalid"]) {
    for (const path of ["/stop", "/state", "/signal-term"]) {
      const response = await rawControl(server.origin, [...lines, extra], "POST", path);
      assert(response.status === 403 || response.status === null);
      assert.deepEqual(calls, [], "The late field must remain visible to authorization");
    }
  }
  const exact = await rawControl(server.origin, lines, "POST", "/state");
  assert.equal(exact.status, 200);
  assert.deepEqual(calls, ["state"]);
});

test("TR loopback authority and the existing parser byte ceiling remain enforced", async (t) => {
  const token = randomBytes(32).toString("hex");
  let calls = 0;
  const server = await faultServer(token, async () => {
    calls++;
    return stateResponse();
  });
  t.after(() => server.close());
  const host = new URL(server.origin).host;
  for (const lines of [
    [`Host: localhost:${new URL(server.origin).port}`, `X-Acceptance-Control-Token: ${token}`, "Connection: close"],
    [`Host: ${host}`, `X-Acceptance-Control-Token: ${token}`, "X-Large: " + "x".repeat(4096), "Connection: close"],
  ]) {
    const result = await rawControl(server.origin, lines, "POST", "/state");
    assert(result.status === 403 || result.status === null);
  }
  assert.equal(calls, 0);
  for (const remoteAddress of ["192.0.2.1", "::1", "::ffff:127.0.0.1"]) {
    assert.equal(
      controller.authorizedControl(
        {
          method: "POST",
          url: "/state",
          socket: { remoteAddress },
          headers: { host, "x-acceptance-control-token": token },
          rawHeaders: ["Host", host, "X-Acceptance-Control-Token", token],
        },
        token,
        Number(new URL(server.origin).port),
      ),
      false,
    );
  }
});

test("TR one HTTP serialization boundary covers old and new operations without waiting for exit", async (t) => {
  const token = randomBytes(32).toString("hex");
  const entered = deferred();
  const release = deferred();
  let calls = 0;
  const server = await faultServer(token, async (action) => {
    calls++;
    if (action === "stop") {
      entered.resolve();
      await release.promise;
    }
    return action === "signal-term" ? signalResponse() : stateResponse();
  });
  t.after(() => server.close());
  const held = controlRequest(server.origin, token, "/stop");
  await entered.promise;
  try {
    for (const path of ["/state", "/signal-term", "/start"]) {
      const response = await controlRequest(server.origin, token, path);
      assert.equal(response.status, 409);
      assert.deepEqual(await response.json(), { error: "Control operation in progress" });
    }
    assert.equal(calls, 1);
  } finally {
    release.resolve();
    await held;
  }
  const state = await controlRequest(server.origin, token, "/state");
  assert.equal(state.status, 200);
  assert.deepEqual(await state.json(), stateResponse());
});

test("TR signal callback exceptions are sanitized and release the HTTP busy gate", async (t) => {
  const token = randomBytes(32).toString("hex");
  const server = await faultServer(token, async (action) => {
    if (action === "signal-term") throw new Error(`SYNTHETIC_SECRET ${token} /synthetic/private Docker stderr`);
    return stateResponse();
  });
  t.after(() => server.close());
  const failed = await controlRequest(server.origin, token, "/signal-term");
  assert.equal(failed.status, 500);
  assert.equal(await failed.text(), '{"error":"Control operation failed"}');
  const later = await controlRequest(server.origin, token, "/state");
  assert.equal(later.status, 200);
  assert.deepEqual(await later.json(), stateResponse());
});

test("TR a pending signal callback also blocks old mutations and state reads", async (t) => {
  const token = randomBytes(32).toString("hex");
  const entered = deferred();
  const release = deferred();
  const calls = [];
  const server = await faultServer(token, async (action) => {
    calls.push(action);
    if (action === "signal-term") {
      entered.resolve();
      await release.promise;
      return signalResponse();
    }
    return stateResponse();
  });
  t.after(() => server.close());
  const held = controlRequest(server.origin, token, "/signal-term");
  try {
    await Promise.race([
      entered.promise,
      held.then((response) => {
        assert.equal(response.status, 202, "Valid signal must reach its pending callback");
        assert.fail("Signal response arrived before the held callback was released");
      }),
    ]);
    for (const path of ["/stop", "/start", "/state", "/signal-term"]) {
      const response = await controlRequest(server.origin, token, path);
      assert.equal(response.status, 409);
      assert.deepEqual(await response.json(), { error: "Control operation in progress" });
    }
    assert.deepEqual(calls, ["signal-term"]);
  } finally {
    release.resolve();
    await held;
  }
  const state = await controlRequest(server.origin, token, "/state");
  assert.equal(state.status, 200);
  assert.deepEqual(await state.json(), stateResponse());
});

// Independent TR-r2 expectations exercise the actual command helper with disposable Node children. Whitespace must
// reach the lifecycle adapter intact so its raw UTF-8 limits cannot be bypassed by an intermediate normalization.
test("TR-r2 command retains default and explicit-false trimmed output compatibility", async () => {
  const stdout = "\u2003 \r\nknown-output\n\t\u00a0";
  for (const options of [{}, { preserveStdout: false }]) {
    const result = await command(process.execPath, ["-e", "process.stdout.write(process.argv[1])", stdout], {
      timeoutMs: 2000,
      ...options,
    });
    assert.equal(result, "known-output", "Existing command callers retain whitespace trimming");
  }
});

test("TR-r2 command preserves exact raw output when explicitly requested", async () => {
  const stdout = "\u2003 \r\nknown-output\n\t\u00a0";
  const result = await command(process.execPath, ["-e", "process.stdout.write(process.argv[1])", stdout], {
    timeoutMs: 2000,
    preserveStdout: true,
  });
  assert.equal(result, stdout, "Preserve leading and trailing multibyte whitespace before byte validation");
  assert.equal(Buffer.byteLength(result, "utf8"), Buffer.byteLength(stdout, "utf8"));
});

test("TR-r2 command-backed oversized signal output rejects and latches across generations", async () => {
  const create = lifecycleFactory();
  const oversized = "\u2003".repeat(321) + lifecycleTarget.containerId;
  assert.equal(oversized.trim(), lifecycleTarget.containerId);
  assert(Buffer.byteLength(oversized, "utf8") > 1024 && oversized.length < 1024);
  let record = dockerRecord();
  let kills = 0;
  const lifecycle = create(
    lifecycleOptions(async (args) => {
      const isKill = args[0] === "kill";
      if (isKill) kills++;
      const stdout = isKill ? oversized : JSON.stringify([record]);
      return command(process.execPath, ["-e", "process.stdout.write(process.argv[1])", stdout], {
        timeoutMs: 2000,
        preserveStdout: true,
      });
    }),
  );
  await assert.rejects(lifecycle.signalTerm(), "Raw oversized acknowledgment must not become an accepted trimmed ID");
  record = dockerRecord(generationB);
  await assert.rejects(lifecycle.signalTerm(), "Uncertain first delivery blocks a replacement generation too");
  assert.equal(kills, 1, "The byte-limit failure must not allow another signal attempt");
  assert.deepEqual(await lifecycle.state(), stateResponse(generationB), "Readback remains available after uncertainty");
});
