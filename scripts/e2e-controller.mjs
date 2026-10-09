/**
 * Provide the independently reviewed safety boundaries used by the local E2E lifecycle controller.
 *
 * Imported by run-e2e.mjs and exercised by `node --test scripts/e2e-controller.test.mjs`. Compose input is resolved
 * JSON; the returned configuration owns exactly two isolated application services with stable, OS-selected loopback ports.
 * The authenticated fault server binds loopback and invokes only a caller-supplied scoped action. Async commands
 * have deadlines, bounded output and process-group cancellation. Failures throw and cleanup failures stay visible.
 * No function provisions cloud resources or treats controller tests as product acceptance.
 */

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { createServer as createSocketServer } from "node:net";
import { join, resolve } from "node:path";

/** Reject unsafe service configuration before publishing only the two controller-owned diagnostic endpoints. */
export function isolatedCompose(input, project, root, ports) {
  assert.deepEqual(Object.keys(ports ?? {}).sort(), ["api", "frontend"], "Supply both independently reserved ports");
  for (const port of Object.values(ports))
    assert(Number.isInteger(port) && port > 0 && port <= 65535, "Invalid reserved port");
  assert.notEqual(ports.api, ports.frontend, "Application endpoints require distinct reserved ports");
  assert(typeof root === "string" && root.length > 0, "Repository build root is required");
  assert(/^mp3-e2e-[a-z0-9-]+$/.test(project), "Invalid isolated project identity");
  const config = structuredClone(input);
  assert.deepEqual(Object.keys(config.services ?? {}).sort(), ["api", "frontend"], "Exactly two services required");
  for (const key of ["volumes", "secrets", "configs", "include"]) {
    assert(!config[key] || Object.keys(config[key]).length === 0, `Unexpected top-level ${key}`);
    delete config[key];
  }
  assert.deepEqual(Object.keys(config.networks ?? { default: {} }), ["default"], "Only a private default network");
  assert(!config.networks?.default?.external, "External networks cannot belong to this test lifecycle");
  assert([undefined, "bridge"].includes(config.networks?.default?.driver), "Only bridge networking is supported");
  config.name = project;
  config.networks = { default: { name: `${project}_default` } };
  for (const [name, service] of Object.entries(config.services)) {
    assert(service.build && typeof service.build === "object", `${name} must build from its independent context`);
    const context = name === "api" ? root : join(root, "frontend");
    assert.equal(
      resolve(service.build.context),
      resolve(context),
      `${name}: build context escaped its owned directory`,
    );
    const dockerfile = name === "api" ? "server/Dockerfile" : "Dockerfile";
    assert.equal(service.build.dockerfile ?? "Dockerfile", dockerfile, `${name}: unexpected Dockerfile`);
    assert.equal(service.build.dockerfile_inline, undefined, "Use the reviewed independently built Dockerfile");
    assert(service.scale === undefined || service.scale === 1, "Exactly one container per service");
    assert(service.deploy?.replicas === undefined || service.deploy.replicas === 1, "Exactly one replica per service");
    assert([undefined, "replicated"].includes(service.deploy?.mode), "No global or job deployment mode");
    assert(service.read_only === true, `${name} root filesystem must be read-only`);
    assert(service.user && /^[1-9]\d*(?::[0-9]+)?$/.test(String(service.user)), `${name} must declare a non-root user`);
    for (const key of ["volumes", "volumes_from", "devices", "secrets", "configs", "cap_add", "extra_hosts"]) {
      assert(!service[key] || Object.keys(service[key]).length === 0, `${name}: forbidden ${key}`);
    }
    for (const key of [
      "privileged",
      "use_api_socket",
      "network_mode",
      "pid",
      "ipc",
      "container_name",
      "profiles",
      "extends",
    ]) {
      assert(service[key] === undefined || service[key] === false, `${name}: forbidden ${key}`);
    }
    for (const key of ["ssh", "secrets", "additional_contexts", "entitlements", "extra_hosts"]) {
      assert(!service.build[key] || Object.keys(service.build[key]).length === 0, `${name}: forbidden build ${key}`);
    }
    assert(service.build.network !== "host", "Build must not use host networking");
    assert.deepEqual(Object.keys(service.networks ?? { default: {} }), ["default"], "Unexpected service network");
    assert(!service.networks?.default?.ipv4_address && !service.networks?.default?.ipv6_address, "No static addresses");
    service.networks = { default: null };
    service.image = `${project}-${name}:tested`;
    service.ports = [
      { target: name === "api" ? 3000 : 8080, published: String(ports[name]), host_ip: "127.0.0.1", protocol: "tcp" },
    ];
  }
  return config;
}

/**
 * Reserve two distinct OS-selected loopback ports until the controller is immediately ready for Compose up.
 * This function accepts no caller port selection. Release is idempotent, including after partial setup failure.
 * Releasing before Docker binds creates an unavoidable race: an occupied port must fail startup, never be stolen.
 */
export async function reserveApplicationPorts() {
  const servers = [];
  const ports = {};
  let releasing;
  const release = () =>
    (releasing ??= Promise.all(
      servers.map(
        (server) =>
          new Promise((resolveClose, reject) => {
            if (!server.listening) {
              resolveClose();
              return;
            }
            server.close((error) => (error ? reject(error) : resolveClose()));
          }),
      ),
    ));
  try {
    for (const name of ["api", "frontend"]) {
      const server = createSocketServer((socket) => socket.destroy());
      servers.push(server);
      await new Promise((resolveListen, reject) => {
        server.once("error", reject);
        server.listen({ port: 0, host: "127.0.0.1", exclusive: true }, resolveListen);
      });
      const address = server.address();
      assert.equal(address.address, "127.0.0.1");
      ports[name] = address.port;
    }
    assert.notEqual(ports.api, ports.frontend);
    return { ports: Object.freeze(ports), release };
  } catch (error) {
    await release();
    throw error;
  }
}

/** Parse only a Docker-reported IPv4 loopback binding; arbitrary caller targets are never accepted. */
export function loopbackOrigin(binding) {
  const match = /^127\.0\.0\.1:([1-9]\d{0,4})$/.exec(binding.trim());
  assert(match && Number(match[1]) <= 65535, "Docker must publish one IPv4 loopback endpoint");
  return `http://${match[0]}`;
}

/** Compare fixed-size token digests in constant time and reject browser, framing, host and route ambiguity. */
export function authorizedControl(request, token, port) {
  const supplied = request.headers["x-acceptance-control-token"];
  const digest = (value) => createHash("sha256").update(value).digest();
  const equal = timingSafeEqual(digest(typeof supplied === "string" ? supplied : ""), digest(token));
  return Boolean(
    equal &&
    request.method === "POST" &&
    /^\/(?:stop|start|pause|resume)$/.test(request.url ?? "") &&
    request.headers.host === `127.0.0.1:${port}` &&
    request.headers.origin === undefined &&
    request.headers["transfer-encoding"] === undefined &&
    (request.headers["content-length"] === undefined || request.headers["content-length"] === "0") &&
    request.socket.remoteAddress === "127.0.0.1",
  );
}

/** Start a loopback-only authenticated operation endpoint; unauthorized requests never reach the action callback. */
export async function faultServer(token, action) {
  assert(/^[a-f0-9]{64}$/.test(token), "Use a freshly generated 256-bit controller token");
  let busy = false;
  const server = createServer({ maxHeaderSize: 4096 }, async (request, response) => {
    const finish = (status, body) => {
      response.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
      response.end(JSON.stringify(body));
    };
    if (!authorizedControl(request, token, server.address().port)) {
      finish(403, { error: "Unauthorized control request" });
      request.resume();
      return;
    }
    if (busy) {
      finish(409, { error: "Control operation in progress" });
      return;
    }
    busy = true;
    try {
      await action(request.url.slice(1));
      finish(200, { status: "ok" });
    } catch {
      finish(500, { error: "Control operation failed" });
    } finally {
      busy = false;
    }
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  server.maxHeadersCount = 16;
  server.on("clientError", (_error, socket) => socket.destroy());
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      }),
  };
}

/** Run without a shell; timeout/cancellation terminates the complete spawned process group on macOS/Linux. */
export async function command(executable, args, { cwd, env = process.env, timeoutMs = 30_000, signal, onOutput } = {}) {
  assert(timeoutMs > 0 && Number.isFinite(timeoutMs), "A positive command deadline is required");
  if (signal?.aborted) throw new Error("E2E lifecycle interrupted");
  return await new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd, env, detached: true, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let outputBytes = 0;
    let failure;
    let escalation;
    const stop = (message) => {
      failure ??= new Error(message);
      if (!child.pid) return;
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch (error) {
        if (error.code !== "ESRCH") failure = error;
      }
      escalation ??= setTimeout(() => {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch (error) {
          if (error.code !== "ESRCH") failure = error;
        }
      }, 2000);
    };
    const abort = () => stop("E2E lifecycle interrupted");
    const timer = setTimeout(() => stop(`${executable} exceeded its bounded command deadline`), timeoutMs);
    signal?.addEventListener("abort", abort, { once: true });
    for (const stream of [child.stdout, child.stderr])
      stream.on("data", (chunk) => {
        outputBytes += chunk.length;
        if (outputBytes > 16 * 1024 * 1024) {
          stop("Command output exceeded the evidence limit");
          return;
        }
        const value = chunk.toString();
        if (stream === child.stdout) stdout += value;
        onOutput?.(value);
      });
    child.once("error", (error) => {
      failure = error;
    });
    child.once("close", (code) => {
      // The group can outlive npm itself; terminate any remaining owned descendants before reporting completion.
      if (child.pid) {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch (error) {
          if (error.code !== "ESRCH") failure = error;
        }
      }
      clearTimeout(timer);
      clearTimeout(escalation);
      signal?.removeEventListener("abort", abort);
      if (failure) reject(failure);
      else if (code !== 0) reject(new Error(`${executable} failed with exit ${code}`));
      else resolve(stdout.trim());
    });
  });
}

/** Always run cleanup; preserve both errors when work and recovery fail instead of masking either outcome. */
export async function withCleanup(work, cleanup) {
  let result;
  let failure;
  try {
    result = await work();
  } catch (error) {
    failure = error;
  }
  try {
    await cleanup();
  } catch (error) {
    failure = failure ? new AggregateError([failure, error], "E2E work and cleanup failed") : error;
  }
  if (failure) throw failure;
  return result;
}
