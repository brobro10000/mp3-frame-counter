/**
 * Independently check the bounded two-container V1 runtime using only pinned credential-free native provider mocks.
 * Usage: node --test scripts/cloud-runtime.test.mjs under Node 24.20.0 and Terraform 1.13.3.
 * The governance package may omit all five runtime files; any partial root fails. Once present, every source/plan
 * expectation is mandatory. Temporary copies contain no real state, backend configuration, credentials or test hooks.
 * Initialization may download the pinned provider; all test runs are plan-only mocks, never cloud operations.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { lstatSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const files = ["versions.tf", "variables.tf", "main.tf", "outputs.tf", ".terraform.lock.hcl"];
const sorted = (values) => [...values].sort();
const variables = [
  "project_id",
  "region",
  "registry_id",
  "environment",
  "api_image",
  "frontend_image",
  "source_revision",
];
const outputs = ["service_name", "service_resource_id", "service_uri", "runtime_service_account", "configured_images"];
const input = (environment = "stage", alternate = false) => {
  const project_id = alternate ? "alternate-runtime-456" : "synthetic-runtime-123";
  const region = alternate ? "europe-west1" : "us-central1";
  const registry_id = alternate ? "release-images-2" : "mp3-images";
  const registry = `${region}-docker.pkg.dev/${project_id}/${registry_id}`;
  return {
    project_id,
    region,
    registry_id,
    environment,
    api_image: `${registry}/api@sha256:${"a".repeat(64)}`,
    frontend_image: `${registry}/frontend@sha256:${"b".repeat(64)}`,
    source_revision: "c".repeat(40),
  };
};
const identities = (value) => {
  const prefix = value.environment === "stage" ? "stage" : "prod";
  const service = `mp3-${value.environment}`;
  const account = (purpose) => `mp3-${prefix}-${purpose}@${value.project_id}.iam.gserviceaccount.com`;
  return {
    service,
    resource: `projects/${value.project_id}/locations/${value.region}/services/${service}`,
    runtime: account("runtime"),
    probe: account("probe"),
    deployer: account("deployer"),
    uri: `https://${service}-synthetic-123.${value.region}.run.app`,
  };
};
/** Small fail-closed scanner for this root's ordinary HCL blocks; Terraform remains the language/plan validator. */
function scan(text) {
  const tokens = [];
  let offset = 0;
  while (offset < text.length) {
    const tail = text.slice(offset);
    const ignored = /^(?:[ \t\r]+|#[^\n]*|\/\/[^\n]*|\/\*[\s\S]*?\*\/)/.exec(tail);
    if (ignored) {
      offset += ignored[0].length;
      continue;
    }
    assert(!tail.startsWith("<<"), "Structural checks do not support heredocs");
    const matched = /^(?:"(?:\\.|[^"\\])*"|[A-Za-z_][A-Za-z0-9_-]*|[0-9]+(?:\.[0-9]+)?|[^\s])/.exec(tail);
    if (tail[0] === "\n") {
      tokens.push({ value: "\n", start: offset, end: ++offset });
      continue;
    }
    assert(matched, "Unsupported HCL token");
    const value = matched[0];
    assert(value !== '"', "Unterminated or unsupported HCL string");
    if (value.startsWith('"')) JSON.parse(value);
    tokens.push({ value, start: offset, end: offset + value.length });
    offset += value.length;
  }
  return tokens;
}

/** Parse only block/attribute boundaries, retaining expression text rather than evaluating or interpreting it. */
function body(tokens) {
  let position = 0;
  const read = (nested = false) => {
    const result = [];
    while (position < tokens.length) {
      if (tokens[position].value === "\n") {
        position++;
        continue;
      }
      if (tokens[position].value === "}") {
        assert(nested, "Unexpected closing block");
        position++;
        return result;
      }
      const name = tokens[position++].value;
      assert.match(name, /^[A-Za-z_][A-Za-z0-9_-]*$/, "Expected a literal block/attribute name");
      if (tokens[position]?.value === "=") {
        position++;
        const expression = [];
        const stack = [];
        while (position < tokens.length) {
          const token = tokens[position];
          if (stack.length === 0 && ["\n", "}"].includes(token.value)) break;
          if (["(", "[", "{"].includes(token.value)) stack.push(token.value);
          if ([")", "]", "}"].includes(token.value)) {
            assert.equal(stack.pop(), { ")": "(", "]": "[", "}": "{" }[token.value], "Unbalanced expression");
          }
          expression.push(token);
          position++;
        }
        assert(expression.length > 0 && stack.length === 0, "Incomplete attribute expression");
        result.push({ kind: "attribute", name, expression });
      } else {
        const labels = [];
        while (tokens[position]?.value.startsWith('"')) labels.push(JSON.parse(tokens[position++].value));
        assert.equal(tokens[position++]?.value, "{", "Unsupported block header");
        result.push({ kind: "block", name, labels, children: read(true) });
      }
    }
    assert(!nested, "Unclosed block");
    return result;
  };
  return read();
}

const children = (node, name) => node.children.filter((child) => child.kind === "block" && child.name === name);
function attribute(node, name) {
  const found = node.children.filter((child) => child.kind === "attribute" && child.name === name);
  assert.equal(found.length, 1, `Expected exactly one ${name} attribute`);
  return found[0];
}
const expression = (node, name) =>
  attribute(node, name)
    .expression.map((token) => token.value)
    .join("");
function one(nodes, name, labels = []) {
  const found = nodes.filter((node) => node.name === name && JSON.stringify(node.labels) === JSON.stringify(labels));
  assert.equal(found.length, 1, `Expected one ${name} ${labels.join(" ")}`);
  return found[0];
}

/** Refuse local file contents and file-derived hashes before initialization; in-memory hash functions remain pure. */
function rejectFileReads(text) {
  assert(
    !/\b(?:file|filebase64|fileexists|fileset|templatefile|pathexpand|filemd5|filesha1|filesha256|filesha512|filebase64sha256|filebase64sha512)\s*\(/.test(
      text,
    ),
    "File-reading functions forbidden",
  );
}

/** Require the application's literal destroy guard even when all other runtime plan fields are valid. */
function requireApplicationProtection(application) {
  const lifecycle = one(application.children, "lifecycle");
  assert.deepEqual(
    lifecycle.children.map((node) => node.name),
    ["prevent_destroy"],
  );
  assert.equal(expression(lifecycle, "prevent_destroy"), "true");
}
/** Reuse the access test's bounded ordinary-HCL scanner; do not introduce a second configuration language. */
function sourceContract(source) {
  assert.deepEqual(sorted(Object.keys(source)), sorted(files));
  const nodes = Object.entries(source)
    .filter(([file]) => file.endsWith(".tf"))
    .flatMap(([file, text]) => body(scan(text)).map((node) => ({ ...node, file })));
  for (const node of nodes) {
    assert.equal(node.kind, "block");
    assert(["terraform", "provider", "variable", "locals", "resource", "output"].includes(node.name));
  }
  for (const text of Object.values(source)) rejectFileReads(text);
  const tf = one(nodes, "terraform");
  assert.equal(nodes.filter((node) => node.name === "terraform").length, 1);
  assert.equal(tf.file, "versions.tf");
  assert.deepEqual(sorted(tf.children.map((node) => node.name)), ["backend", "required_providers", "required_version"]);
  assert.equal(expression(tf, "required_version"), '"= 1.13.3"');
  const backend = one(tf.children, "backend", ["gcs"]);
  assert.deepEqual(backend.children, []);
  const providers = one(tf.children, "required_providers");
  assert.equal(providers.children.length, 1);
  const providerObject = attribute(providers, "google").expression;
  assert.equal(providerObject[0].value, "{");
  assert.equal(providerObject.at(-1).value, "}");
  const pinned = { children: body(providerObject.slice(1, -1)) };
  assert.deepEqual(sorted(pinned.children.map((node) => node.name)), ["source", "version"]);
  assert.equal(expression(pinned, "source"), '"hashicorp/google"');
  assert(['"8.6.0"', '"= 8.6.0"'].includes(expression(pinned, "version")));
  assert.equal(nodes.filter((node) => node.name === "provider").length, 1);
  const google = one(nodes, "provider", ["google"]);
  assert(
    google.children.every((node) =>
      ["project", "billing_project", "region", "user_project_override"].includes(node.name),
    ),
  );
  assert.equal(expression(google, "project"), "var.project_id");
  assert.equal(expression(google, "billing_project"), "var.project_id");
  if (google.children.some((node) => node.name === "region")) assert.equal(expression(google, "region"), "var.region");
  if (google.children.some((node) => node.name === "user_project_override"))
    assert.equal(expression(google, "user_project_override"), "true");
  assert.deepEqual(
    sorted(nodes.filter((node) => node.name === "variable").map((node) => node.labels[0])),
    sorted(variables),
  );
  for (const name of variables) {
    const variable = one(nodes, "variable", [name]);
    assert.equal(expression(variable, "type"), "string");
    assert(children(variable, "validation").length > 0);
    if (["region", "registry_id"].includes(name))
      assert.equal(expression(variable, "default"), JSON.stringify(input()[name]));
    else assert(!variable.children.some((node) => node.name === "default"));
  }
  assert.deepEqual(
    sorted(nodes.filter((node) => node.name === "output").map((node) => node.labels[0])),
    sorted(outputs),
  );
  const resources = nodes.filter((node) => node.name === "resource");
  assert.deepEqual(sorted(resources.map((node) => node.labels.join("."))), [
    "google_cloud_run_v2_service.application",
    "google_cloud_run_v2_service_iam_member.probe_invoker",
    "google_cloud_run_v2_service_iam_member.stage_admin",
  ]);
  requireApplicationProtection(one(resources, "resource", ["google_cloud_run_v2_service", "application"]));
  const forbidden = new Set(["provisioner", "connection", "dynamic", "cloud", "ignore_changes"]);
  const visit = (node) => {
    assert(!forbidden.has(node.name), "Runtime source escape forbidden");
    if (node.name === "backend") assert.equal(node, backend);
    if (node.name === "lifecycle") {
      assert.deepEqual(
        node.children.map((child) => child.name),
        ["prevent_destroy"],
      );
      assert.equal(expression(node, "prevent_destroy"), "true");
    }
    for (const child of node.children ?? []) visit(child);
  };
  nodes.forEach(visit);
  for (const resource of resources) assert(!resource.children.some((node) => node.name === "provider"));
  assert.equal(
    source[".terraform.lock.hcl"],
    readFileSync(join(root, "infra/cloud/access/.terraform.lock.hcl"), "utf8"),
    "Runtime reuses the exact approved access provider lock",
  );
  const locks = body(scan(source[".terraform.lock.hcl"]));
  assert.equal(locks.length, 1);
  const lock = one(locks, "provider", ["registry.terraform.io/hashicorp/google"]);
  assert.equal(expression(lock, "version"), '"8.6.0"');
  assert(attribute(lock, "hashes").expression.some((token) => /^"h1:[A-Za-z0-9+/=]+"$/.test(token.value)));
}
function sourceNames(names) {
  const recognized = names.filter((name) => /(?:\.tf(?:\.json)?|\.terraform\.lock\.hcl)$/.test(name));
  if (!recognized.length) return "dormant";
  assert.deepEqual(sorted(recognized), sorted(files), "Partial or additional runtime source is forbidden");
  return "present";
}
function sourceFiles() {
  const directory = join(root, "infra/cloud/runtime");
  let names;
  try {
    names = readdirSync(directory);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
  if (sourceNames(names) === "dormant") return null;
  return Object.fromEntries(
    files.map((file) => {
      const path = join(directory, file),
        stat = lstatSync(path);
      assert(stat.isFile() && stat.size <= 256 * 1024, "Runtime source must be a bounded regular file");
      return [file, readFileSync(path, "utf8")];
    }),
  );
}
let scratch;
function workspace() {
  if (!scratch) {
    scratch = mkdtempSync(join(tmpdir(), "cloud-runtime-tests-"));
    for (const name of ["home", "cache"]) mkdirSync(join(scratch, name), { mode: 0o700 });
    writeFileSync(join(scratch, "terraform.rc"), "disable_checkpoint = true\n", { mode: 0o600 });
  }
  return scratch;
}
after(() => {
  if (scratch) rmSync(scratch, { recursive: true, force: true });
});

/** Use a fresh environment: no cloud/ADC, TF_VAR, CLI arguments, CLI credentials, proxies or caller configuration. */
function terraform(directory, args) {
  const temporary = workspace();
  return execFileSync("terraform", args, {
    cwd: directory,
    encoding: "utf8",
    timeout: 180_000,
    maxBuffer: 48 * 1024 * 1024,
    env: {
      PATH: process.env.PATH,
      HOME: join(temporary, "home"),
      TMPDIR: temporary,
      TF_CLI_CONFIG_FILE: join(temporary, "terraform.rc"),
      TF_PLUGIN_CACHE_DIR: join(temporary, "cache"),
      TF_IN_AUTOMATION: "1",
      CHECKPOINT_DISABLE: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/** Only computed service identity is overridden; images, IAM, limits, traffic and safety settings remain real plans. */
function runBlock(name, value, rejected) {
  const id = identities(value);
  return `run "${name}" {
    command = plan
    variables {
${Object.entries(value)
  .map(([key, val]) => `${key} = ${JSON.stringify(val)}`)
  .join("\n")}
}
    ${
      rejected
        ? `expect_failures = [var.${rejected}]`
        : `override_resource {
      target = google_cloud_run_v2_service.application
      override_during = plan
      values = ${JSON.stringify({ id: id.resource, uri: id.uri })}
    }`
    }
  }`;
}
function mocked(source, runs, verbose = true) {
  sourceContract(source);
  const directory = mkdtempSync(join(workspace(), "case-"));
  try {
    for (const [name, text] of Object.entries(source)) writeFileSync(join(directory, name), text, { mode: 0o600 });
    writeFileSync(
      join(directory, "runtime.tftest.hcl"),
      `mock_provider "google" { override_during = plan }\n${runs.join("\n")}`,
      { mode: 0o600 },
    );
    terraform(directory, ["init", "-backend=false", "-input=false", "-no-color", "-lockfile=readonly"]);
    const records = terraform(directory, ["test", "-json", ...(verbose ? ["-verbose"] : [])])
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    assert(!records.some((record) => record.type === "diagnostic" && record.diagnostic.severity === "error"));
    const summaries = records.filter((record) => record.type === "test_summary");
    assert.equal(summaries.length, 1);
    assert.deepEqual(summaries[0].test_summary, {
      status: "pass",
      passed: runs.length,
      failed: 0,
      errored: 0,
      skipped: 0,
    });
    return records.filter((record) => record.type === "test_plan").map((record) => record.test_plan);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
/** Independent plan oracle: one service, one corresponding probe grant, and a stage-only service-scoped admin grant. */
function complete(plan, value) {
  const id = identities(value);
  assert(Array.isArray(plan.resource_changes));
  const rows = new Map(
    plan.resource_changes.map((row) => {
      assert.equal(row.mode, "managed");
      assert.equal(row.provider_name, "registry.terraform.io/hashicorp/google");
      assert.equal(row.type, row.address.split(".")[0]);
      assert.deepEqual(row.change.actions, ["create"]);
      assert.equal(row.change.before, null);
      return [row.address, row.change.after];
    }),
  );
  assert.equal(rows.size, plan.resource_changes.length);
  assert.deepEqual(
    sorted(rows.keys()),
    sorted([
      "google_cloud_run_v2_service.application",
      "google_cloud_run_v2_service_iam_member.probe_invoker",
      ...(value.environment === "stage" ? ["google_cloud_run_v2_service_iam_member.stage_admin[0]"] : []),
    ]),
  );
  const service = rows.get("google_cloud_run_v2_service.application");
  assert.equal(service.project, value.project_id);
  assert.equal(service.location, value.region);
  assert.equal(service.name, id.service);
  assert.equal(service.deletion_protection, true);
  assert.equal(service.ingress, "INGRESS_TRAFFIC_ALL");
  assert.equal(service.invoker_iam_disabled, false);
  assert.equal(service.default_uri_disabled, false);
  assert.deepEqual(service.labels, {
    application: "mp3-frame-counter",
    environment: value.environment,
    source_revision: value.source_revision,
  });
  assert.deepEqual(service.custom_audiences ?? [], []);
  assert.deepEqual(service.annotations ?? {}, {});
  for (const name of ["build_config", "multi_region_settings", "binary_authorization"])
    assert.deepEqual(service[name] ?? [], []);
  assert.equal(service.scaling.length, 1);
  assert.equal(service.scaling[0].max_instance_count, 1);
  assert([null, 0].includes(service.scaling[0].min_instance_count));
  assert.equal(service.template.length, 1);
  const template = service.template[0];
  assert.equal(template.service_account, id.runtime);
  assert.deepEqual(template.annotations ?? {}, {});
  assert.deepEqual(template.labels ?? {}, {});
  assert.equal(template.execution_environment, "EXECUTION_ENVIRONMENT_GEN2");
  assert.equal(template.timeout, "60s");
  assert.equal(template.max_instance_request_concurrency, 2);
  assert.equal(template.scaling.length, 1);
  assert.equal(template.scaling[0].min_instance_count, 0);
  assert.equal(template.scaling[0].max_instance_count, 1);
  for (const name of ["volumes", "vpc_access", "node_selector", "sandboxes", "workload_identity_config"])
    assert.deepEqual(template[name] ?? [], []);
  assert.equal(template.containers.length, 2);
  assert.deepEqual(sorted(template.containers.map((container) => container.name)), ["api", "frontend"]);
  for (const name of ["api", "frontend"]) {
    const container = template.containers.find((row) => row.name === name);
    assert.equal(container.image, value[`${name}_image`]);
    for (const key of ["command", "args", "volume_mounts", "liveness_probe", "readiness_probe"])
      assert.deepEqual(container[key] ?? [], []);
    assert.equal(container.resources.length, 1);
    assert.deepEqual(container.resources[0].limits, { cpu: "1", memory: "512Mi" });
    assert.equal(container.resources[0].cpu_idle, true);
    assert.equal(container.resources[0].startup_cpu_boost, false);
    assert.deepEqual(container.depends_on ?? [], name === "frontend" ? ["api"] : []);
    assert.deepEqual(
      (container.env ?? []).map((entry) => ({
        name: entry.name,
        value: entry.value,
        value_source: entry.value_source ?? [],
      })),
      name === "frontend" ? [{ name: "API_UPSTREAM", value: "127.0.0.1:3000", value_source: [] }] : [],
    );
    assert.deepEqual(container.ports ?? [], name === "frontend" ? [{ name: "http1", container_port: 8080 }] : []);
    assert.equal(container.startup_probe.length, 1);
    const probe = container.startup_probe[0];
    assert.equal(probe.period_seconds, 10);
    assert.equal(probe.timeout_seconds, 2);
    assert.equal(probe.failure_threshold, 6);
    assert.equal(probe.http_get.length, 1);
    assert.equal(probe.http_get[0].path, "/healthz");
    assert.equal(probe.http_get[0].port, name === "api" ? 3000 : 8080);
    assert.deepEqual(probe.http_get[0].http_headers ?? [], []);
    for (const key of ["tcp_socket", "grpc"]) assert.deepEqual(probe[key] ?? [], []);
  }
  assert.equal(service.traffic.length, 1);
  assert.equal(service.traffic[0].type, "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST");
  assert.equal(service.traffic[0].percent, 100);
  assert.equal(service.traffic[0].tag ?? null, null);
  assert.equal(service.traffic[0].revision ?? null, null);
  for (const [address, role, account] of [
    ["google_cloud_run_v2_service_iam_member.probe_invoker", "roles/run.invoker", id.probe],
    ...(value.environment === "stage"
      ? [["google_cloud_run_v2_service_iam_member.stage_admin[0]", "roles/run.admin", id.deployer]]
      : []),
  ]) {
    const grant = rows.get(address);
    assert.equal(grant.project, value.project_id);
    assert.equal(grant.location, value.region);
    assert.equal(grant.name, id.service);
    assert.equal(grant.role, role);
    assert.equal(grant.member, `serviceAccount:${account}`);
    assert.deepEqual(grant.condition ?? [], []);
  }
  assert.deepEqual(sorted(Object.keys(plan.output_changes)), sorted(outputs));
  const actual = Object.fromEntries(
    Object.entries(plan.output_changes).map(([key, change]) => {
      assert.deepEqual(change.actions, ["create"]);
      assert.equal(change.after_unknown, false);
      assert.equal(change.after_sensitive, false);
      return [key, change.after];
    }),
  );
  assert.deepEqual(actual, {
    service_name: id.service,
    service_resource_id: id.resource,
    service_uri: id.uri,
    runtime_service_account: id.runtime,
    configured_images: { api: value.api_image, frontend: value.frontend_image },
  });
}
/** Literal synthetic plan for oracle calibration; no provider, application or implementation output is used. */
function fixture(value) {
  const id = identities(value);
  const probe = (port) => [
    { period_seconds: 10, timeout_seconds: 2, failure_threshold: 6, http_get: [{ path: "/healthz", port }] },
  ];
  const limits = [{ limits: { cpu: "1", memory: "512Mi" }, cpu_idle: true, startup_cpu_boost: false }];
  const service = {
    project: value.project_id,
    location: value.region,
    name: id.service,
    deletion_protection: true,
    ingress: "INGRESS_TRAFFIC_ALL",
    invoker_iam_disabled: false,
    default_uri_disabled: false,
    labels: {
      application: "mp3-frame-counter",
      environment: value.environment,
      source_revision: value.source_revision,
    },
    scaling: [{ max_instance_count: 1, min_instance_count: 0 }],
    template: [
      {
        service_account: id.runtime,
        execution_environment: "EXECUTION_ENVIRONMENT_GEN2",
        timeout: "60s",
        max_instance_request_concurrency: 2,
        scaling: [{ min_instance_count: 0, max_instance_count: 1 }],
        containers: [
          { name: "api", image: value.api_image, resources: structuredClone(limits), startup_probe: probe(3000) },
          {
            name: "frontend",
            image: value.frontend_image,
            resources: structuredClone(limits),
            startup_probe: probe(8080),
            depends_on: ["api"],
            env: [{ name: "API_UPSTREAM", value: "127.0.0.1:3000" }],
            ports: [{ name: "http1", container_port: 8080 }],
          },
        ],
      },
    ],
    traffic: [{ type: "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST", percent: 100 }],
  };
  const grant = (role, account) => ({
    project: value.project_id,
    location: value.region,
    name: id.service,
    role,
    member: `serviceAccount:${account}`,
  });
  const rows = [
    ["google_cloud_run_v2_service.application", service],
    ["google_cloud_run_v2_service_iam_member.probe_invoker", grant("roles/run.invoker", id.probe)],
    ...(value.environment === "stage"
      ? [["google_cloud_run_v2_service_iam_member.stage_admin[0]", grant("roles/run.admin", id.deployer)]]
      : []),
  ];
  return {
    resource_changes: rows.map(([address, after]) => ({
      address,
      type: address.split(".")[0],
      mode: "managed",
      provider_name: "registry.terraform.io/hashicorp/google",
      change: { actions: ["create"], before: null, after },
    })),
    output_changes: Object.fromEntries(
      Object.entries({
        service_name: id.service,
        service_resource_id: id.resource,
        service_uri: id.uri,
        runtime_service_account: id.runtime,
        configured_images: { api: value.api_image, frontend: value.frontend_image },
      }).map(([key, after]) => [key, { actions: ["create"], after, after_unknown: false, after_sensitive: false }]),
    ),
  };
}
test("runtime application requires its destroy guard and rejects a removed or false guard", () => {
  const declaration =
    'resource "google_cloud_run_v2_service" "application" {\n lifecycle { prevent_destroy = true }\n}';
  const application = (text) => one(body(scan(text)), "resource", ["google_cloud_run_v2_service", "application"]);
  requireApplicationProtection(application(declaration));
  for (const changed of [
    declaration.replace("lifecycle { prevent_destroy = true }", ""),
    declaration.replace("prevent_destroy = true", "prevent_destroy = false"),
  ]) {
    assert.notEqual(changed, declaration);
    assert.throws(() => requireApplicationProtection(application(changed)), { code: "ERR_ASSERTION" });
  }
});
test("runtime scope permits all five absent but refuses every partial or extra source root", () => {
  assert.equal(sourceNames([]), "dormant");
  assert.equal(sourceNames(files), "present");
  for (const missing of files)
    assert.throws(() => sourceNames(files.filter((name) => name !== missing)), { code: "ERR_ASSERTION" });
  for (const extra of ["override.tf", "unsafe.tf.json"])
    assert.throws(() => sourceNames([...files, extra]), { code: "ERR_ASSERTION" });
});
test("independent stage/production plan counterparts reject image, ingress, IAM, cost and execution escapes", () => {
  for (const value of [input(), input("production", true)]) {
    const original = fixture(value);
    complete(original, value);
    const mutations = [
      (plan) => {
        plan.resource_changes[0].change.after.template[0].containers[0].image =
          value.api_image.split("@")[0] + ":latest";
      },
      (plan) => {
        plan.resource_changes[0].change.after.invoker_iam_disabled = true;
      },
      (plan) => {
        plan.resource_changes[0].change.after.deletion_protection = false;
      },
      (plan) => {
        plan.resource_changes[0].change.after.template[0].containers[1].env[0].value = "foreign.invalid:3000";
      },
      (plan) => {
        plan.resource_changes[0].change.after.template[0].containers[0].ports = [
          { name: "http1", container_port: 3000 },
        ];
      },
      (plan) => {
        plan.resource_changes[0].change.after.template[0].containers[0].resources[0].startup_cpu_boost = true;
      },
      (plan) => {
        plan.resource_changes[0].change.after.template[0].max_instance_request_concurrency = 80;
      },
      (plan) => {
        plan.resource_changes[0].change.after.scaling[0].max_instance_count = 2;
      },
      (plan) => {
        plan.resource_changes[0].change.after.template[0].service_account = "default@foreign.iam.gserviceaccount.com";
      },
      (plan) => {
        plan.resource_changes[1].change.after.member = "allUsers";
      },
      (plan) => {
        plan.resource_changes[1].change.after.role = "roles/run.admin";
      },
      (plan) => {
        plan.resource_changes[0].change.after.traffic[0].percent = 50;
      },
      (plan) => {
        plan.resource_changes.push(structuredClone(fixture(input()).resource_changes[2]));
      },
      (plan) => {
        plan.output_changes.secret = {
          actions: ["create"],
          after: "forbidden",
          after_unknown: false,
          after_sensitive: false,
        };
      },
    ];
    for (const mutate of mutations) {
      const changed = structuredClone(original);
      mutate(changed);
      assert.throws(() => complete(changed, value), { code: "ERR_ASSERTION" });
    }
  }
});
let source, sourceError;
try {
  source = sourceFiles();
} catch (error) {
  sourceError = error;
}
if (source === null) {
  test("runtime implementation is dormant: all five files are absent, no native plan or deployment is claimed", () => {
    assert.equal(sourceFiles(), null);
  });
} else {
  test("complete runtime source has the pinned closed interface and no executable or credential escapes", () => {
    if (sourceError) throw sourceError;
    assert.equal(process.versions.node, "24.20.0");
    assert.equal(JSON.parse(terraform(root, ["version", "-json"])).terraform_version, "1.13.3");
    sourceContract(source);
    for (const addition of [
      'resource "google_project_iam_member" "extra" { role = "roles/run.admin" }',
      'data "external" "extra" { program = ["false"] }',
      'module "extra" { source = "./forbidden" }',
      'locals { value = file("/forbidden") }',
      'terraform { backend "gcs" { bucket = "forbidden" } }',
      'provider "google" { alias = "unmocked" }',
    ])
      assert.throws(() => sourceContract({ ...source, "main.tf": `${source["main.tf"]}\n${addition}\n` }), {
        code: "ERR_ASSERTION",
      });
  });
  test("native mocked stage and production plans enforce exact resources, limits, images, IAM and outputs", () => {
    if (sourceError) throw sourceError;
    const values = [input(), input("production", true)];
    const plans = mocked(
      source,
      values.map((value, i) => runBlock(`valid_${i}`, value)),
    );
    assert.equal(plans.length, 2);
    plans.forEach((plan, i) => complete(plan, values[i]));
    const changed = { ...source, "main.tf": source["main.tf"].replace('"roles/run.invoker"', '"roles/run.admin"') };
    assert.notEqual(changed["main.tf"], source["main.tf"], "Mutation must change a real source role");
    const wrong = mocked(changed, [runBlock("unsafe_service_role", input())]);
    assert.equal(wrong.length, 1, "Control must reach a successful native mocked plan");
    assert.throws(() => complete(wrong[0], input()), { code: "ERR_ASSERTION" });
  });
  test("native mocked variables reject foreign images, tags, environment and malformed source identities", () => {
    if (sourceError) throw sourceError;
    const valid = input();
    const invalid = {
      environment: ["", "prod", "development", null],
      source_revision: ["", "A".repeat(40), "c".repeat(39), "c".repeat(40) + "\n", null],
      api_image: [
        valid.api_image.split("@")[0] + ":latest",
        valid.api_image.replace("/api@", "/frontend@"),
        valid.api_image.replace(valid.project_id, "foreign-project"),
        null,
      ],
      frontend_image: [
        valid.frontend_image.split("@")[0] + ":latest",
        valid.frontend_image.replace("/frontend@", "/api@"),
        valid.frontend_image + "\n",
        null,
      ],
    };
    const runs = Object.entries(invalid).flatMap(([key, values]) =>
      values.map((value, i) => runBlock(`invalid_${key}_${i}`, { ...valid, [key]: value }, key)),
    );
    assert.deepEqual(mocked(source, runs, false), []);
  });
}
