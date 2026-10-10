/**
 * Provide the independently reviewed safety boundaries used by the local E2E lifecycle controller.
 *
 * Imported by run-e2e.mjs and exercised by `node --test scripts/e2e-controller.test.mjs`. Compose input is resolved
 * JSON; the returned configuration owns exactly two isolated application services with stable, OS-selected loopback ports.
 * The authenticated fault server binds loopback and invokes only a caller-supplied scoped action. Async commands
 * have deadlines, bounded output and process-group cancellation. Failures throw and cleanup failures stay visible.
 * createApiLifecycle accepts fixed API identities and a privately injected bounded Docker runner. It reads only that
 * container and sends only SIGTERM; projected state and daemon acknowledgments never assert application shutdown.
 * Failed or uncertain signal delivery permanently disables further signals for that instance while preserving reads.
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

/** Validate closed data records before serialization; getters, hidden fields and custom JSON behavior are forbidden. */
function closedRecord(value, keys) {
  assert(value && typeof value === "object" && !Array.isArray(value), "Expected a lifecycle record");
  assert([Object.prototype, null].includes(Object.getPrototypeOf(value)), "Unexpected lifecycle record prototype");
  assert.deepEqual(Reflect.ownKeys(value).sort(), [...keys].sort(), "Unexpected lifecycle record fields");
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    assert(descriptor.enumerable && Object.hasOwn(descriptor, "value"), "Expected plain lifecycle data");
  }
}

function requireTarget(target) {
  closedRecord(target, ["project", "service", "containerId", "imageId"]);
  assert(
    typeof target.project === "string" && target.project.length <= 128 && /^mp3-e2e-[a-z0-9-]+$/.test(target.project),
    "Invalid lifecycle project identity",
  );
  assert.equal(target.service, "api", "Lifecycle authority is limited to the API");
  assert(
    typeof target.containerId === "string" && /^[a-f0-9]{64}$/.test(target.containerId),
    "Expected an exact Docker container identity",
  );
  assert(
    typeof target.imageId === "string" && /^sha256:[a-f0-9]{64}$/.test(target.imageId),
    "Expected an immutable tested image identity",
  );
}

/** Preserve Docker's nanosecond timestamp bytes while rejecting invalid calendar dates and its zero-time sentinel. */
function requireGeneration(generation) {
  closedRecord(generation, ["startedAt", "restartCount"]);
  const value = generation.startedAt;
  const match = typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.exec(value);
  assert(match && match[0] === value && !value.startsWith("0000-"), "Invalid Docker start timestamp");
  assert(!/^0001-01-01T00:00:00(?:\.0{1,9})?Z$/.test(value), "Docker start timestamp is zero");
  const instant = new Date(value);
  assert(
    Number.isFinite(instant.getTime()) && instant.toISOString().slice(0, 19) === value.slice(0, 19),
    "Invalid Docker start calendar time",
  );
  assert(Number.isSafeInteger(generation.restartCount) && generation.restartCount >= 0, "Invalid Docker restart count");
}

function requireLifecycleState(state) {
  const booleans = ["running", "paused", "restarting", "dead", "oomKilled", "hasError"];
  closedRecord(state, [...booleans, "exitCode"]);
  for (const key of booleans) assert.equal(typeof state[key], "boolean", "Invalid Docker lifecycle flag");
  assert(Number.isInteger(state.exitCode) && state.exitCode >= 0 && state.exitCode <= 255, "Invalid Docker exit code");
}

function requireLifecycleResponse(value, action) {
  const state = action === "state";
  closedRecord(value, ["schemaVersion", "kind", "target", "generation", state ? "state" : "signal"]);
  assert.equal(value.schemaVersion, 1, "Unsupported lifecycle response schema");
  assert.equal(value.kind, state ? "api-lifecycle-state" : "api-signal-acknowledgment");
  requireTarget(value.target);
  requireGeneration(value.generation);
  if (state) requireLifecycleState(value.state);
  else assert.equal(value.signal, "SIGTERM", "Unexpected lifecycle signal");
}

function boundedStdout(value, bytes) {
  assert(typeof value === "string" && Buffer.byteLength(value, "utf8") <= bytes, "Invalid bounded Docker output");
  return value;
}

/**
 * Observe one fixed owned API container and acknowledge one SIGTERM attempt per observed process generation.
 * The injected runner must enforce the private five-second command deadline, cancellation and no-shell invocation.
 * Inspection projects validated data only. Signal errors after attempting delivery latch the instance permanently;
 * reads remain possible, and neither an acknowledgment nor a running exit-zero observation proves graceful exit.
 */
export function createApiLifecycle({ project, containerId, imageId, runDocker }) {
  const target = { project, service: "api", containerId, imageId };
  requireTarget(target);
  assert.equal(typeof runDocker, "function", "A bounded private Docker runner is required");
  const attempted = new Set();
  let signaling = false;
  let uncertain = false;
  const state = async () => {
    const records = JSON.parse(boundedStdout(await runDocker(["inspect", containerId]), 1024 * 1024));
    assert(Array.isArray(records) && records.length === 1, "Expected exactly one inspected container");
    const container = records[0];
    assert(container && typeof container === "object" && !Array.isArray(container), "Invalid container inspection");
    assert.equal(container.Id, containerId, "Container identity changed");
    assert.equal(container.Image, imageId, "Tested image identity changed");
    assert.equal(container.Config?.Labels?.["com.docker.compose.project"], project, "Container project changed");
    assert.equal(container.Config?.Labels?.["com.docker.compose.service"], "api", "Container service changed");
    assert(container.State && typeof container.State === "object", "Missing container lifecycle state");
    assert.equal(typeof container.State.Error, "string", "Invalid Docker error observation");
    const result = {
      schemaVersion: 1,
      kind: "api-lifecycle-state",
      target: { ...target },
      generation: { startedAt: container.State.StartedAt, restartCount: container.RestartCount },
      state: {
        running: container.State.Running,
        paused: container.State.Paused,
        restarting: container.State.Restarting,
        dead: container.State.Dead,
        exitCode: container.State.ExitCode,
        oomKilled: container.State.OOMKilled,
        hasError: container.State.Error.length > 0,
      },
    };
    requireLifecycleResponse(result, "state");
    return result;
  };
  const signalTerm = async () => {
    assert(!signaling, "A lifecycle signal is already in progress");
    assert(!uncertain, "Previous signal delivery is unresolved");
    signaling = true;
    try {
      const before = await state();
      assert(
        before.state.running && !before.state.paused && !before.state.restarting && !before.state.dead,
        "API is not eligible for signaling",
      );
      const generation = JSON.stringify(before.generation);
      assert(!attempted.has(generation), "This process generation already has a signal attempt");
      attempted.add(generation);
      try {
        const acknowledgment = boundedStdout(await runDocker(["kill", "--signal", "SIGTERM", containerId]), 1024);
        assert.equal(acknowledgment.trim(), containerId, "Unexpected Docker signal acknowledgment");
        const after = await state();
        assert.deepEqual(after.target, before.target, "Signal target changed during delivery");
        assert.deepEqual(after.generation, before.generation, "Process generation changed during signal delivery");
        return {
          schemaVersion: 1,
          kind: "api-signal-acknowledgment",
          signal: "SIGTERM",
          target: { ...before.target },
          generation: { ...before.generation },
        };
      } catch (error) {
        uncertain = true;
        throw error;
      }
    } finally {
      signaling = false;
    }
  };
  return { state, signalTerm };
}

/** Compare fixed-size token digests in constant time and reject browser, framing, host and route ambiguity. */
export function authorizedControl(request, token, port) {
  const supplied = request.headers["x-acceptance-control-token"];
  const digest = (value) => createHash("sha256").update(value).digest();
  const equal = timingSafeEqual(digest(typeof supplied === "string" ? supplied : ""), digest(token));
  const raw = request.rawHeaders;
  if (!Array.isArray(raw) || raw.length % 2 !== 0 || raw.length > 32) return false;
  const counts = new Map();
  for (let index = 0; index < raw.length; index += 2) {
    if (typeof raw[index] !== "string" || typeof raw[index + 1] !== "string") return false;
    const name = raw[index].toLowerCase();
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return Boolean(
    equal &&
    counts.get("host") === 1 &&
    counts.get("x-acceptance-control-token") === 1 &&
    !counts.has("origin") &&
    !counts.has("transfer-encoding") &&
    (counts.get("content-length") ?? 0) <= 1 &&
    request.method === "POST" &&
    /^\/(?:stop|start|pause|resume|state|signal-term)$/.test(request.url ?? "") &&
    request.headers.host === `127.0.0.1:${port}` &&
    request.headers.origin === undefined &&
    request.headers["transfer-encoding"] === undefined &&
    (request.headers["content-length"] === undefined || request.headers["content-length"] === "0") &&
    request.socket.remoteAddress === "127.0.0.1",
  );
}

/** Start a loopback-only authenticated operation endpoint; unauthorized requests never reach the action callback. */
export async function faultServer(token, action) {
  assert(typeof token === "string" && /^[a-f0-9]{64}$/.test(token), "Use a freshly generated 256-bit controller token");
  let busy = false;
  const server = createServer({ maxHeaderSize: 4096 }, async (request, response) => {
    const finish = (status, body) => {
      const json = JSON.stringify(body);
      assert(Buffer.byteLength(json, "utf8") <= 4096, "Control response exceeded its byte limit");
      response.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
      response.end(json);
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
      const operation = request.url.slice(1);
      const result = await action(operation);
      if (operation === "state" || operation === "signal-term") {
        requireLifecycleResponse(result, operation);
        finish(operation === "state" ? 200 : 202, result);
      } else finish(200, { status: "ok" });
    } catch {
      finish(500, { error: "Control operation failed" });
    } finally {
      busy = false;
    }
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  // Keep every parsed field visible; authorization applies the sixteen-field limit before any callback.
  server.maxHeadersCount = 0;
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
