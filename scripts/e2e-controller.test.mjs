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
import { createServer as createSocketServer } from "node:net";
import test from "node:test";
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
