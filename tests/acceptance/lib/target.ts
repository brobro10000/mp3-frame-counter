/**
 * Validate the controller's explicit nonproduction target binding before tests can send boundary/fault requests.
 * Reads nonsecret ACCEPTANCE_* and URL environment inputs; returns validated origins or throws. No defaults,
 * network lookup, subprocesses or production mode exist. Used by the E2E launcher and test suite.
 */
import assert from "node:assert/strict";

function origin(name: string): string {
  const raw = process.env[name];
  assert.ok(raw, `${name} is required`);
  const value = new URL(raw);
  assert.ok(["http:", "https:"].includes(value.protocol), `${name} must use HTTP(S)`);
  assert.ok(!value.username && !value.password && !value.search && !value.hash);
  assert.equal(value.pathname, "/", `${name} must be an origin without a path`);
  return value.origin;
}

function internal(value: string): boolean {
  const hostname = new URL(value).hostname;
  return (
    ["127.0.0.1", "localhost", "[::1]", "api", "fault-control", "acceptance-control", "host.docker.internal"].includes(
      hostname,
    ) || hostname.endsWith(".internal")
  );
}

function endpoint(value: string): string {
  const url = new URL(value);
  const host = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ? "loopback" : url.hostname;
  return `${url.protocol}//${host}:${url.port || (url.protocol === "https:" ? "443" : "80")}`;
}

export function target() {
  const base = origin("BASE_URL");
  const api = origin("API_BASE_URL");
  const control = origin("FAULT_CONTROL_URL");
  assert.ok(
    endpoint(control) !== endpoint(base) && endpoint(control) !== endpoint(api),
    "Fault controller must be a distinct endpoint from both product services",
  );
  const kind = process.env.ACCEPTANCE_TARGET_KIND;
  assert.ok(kind === "local" || kind === "candidate", "Explicit local or candidate target kind is required");
  assert.equal(origin("ACCEPTANCE_TARGET_ORIGIN"), base, "Target origin must bind the exact BASE_URL origin");
  if (kind === "local") {
    assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(new URL(base).hostname), "Local frontend must be loopback");
  } else {
    assert.equal(new URL(base).protocol, "https:", "Managed candidate frontend must use HTTPS");
  }
  assert.ok(internal(api) && internal(control), "Diagnostics and fault controls must remain on an isolated network");
  assert.equal(process.env.ACCEPTANCE_ALLOW_FAULTS, "1", "Explicit fault authorization is required");
  const token = process.env.ACCEPTANCE_FAULT_TOKEN;
  assert.ok(
    token && token.length >= 32 && !/\s/.test(token),
    "A random fault token of at least 32 characters is required",
  );
  const id = process.env.ACCEPTANCE_TARGET_ID;
  assert.ok(id && /^[A-Za-z0-9_.:-]{1,160}$/.test(id), "Sanitized nonempty target identity is required");
  return { base, api, control, kind, id };
}

export function suiteRevision(): string {
  const revision = process.env.ACCEPTANCE_SUITE_REVISION ?? "unrecorded";
  assert.ok(
    revision === "unrecorded" || /^[a-f0-9]{40}$/.test(revision),
    "ACCEPTANCE_SUITE_REVISION must be a full lowercase commit SHA or unrecorded",
  );
  return revision;
}
