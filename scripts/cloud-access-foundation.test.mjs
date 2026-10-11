/**
 * Purpose: independently check the bounded ACCESS-FOUNDATION configuration before operational use.
 * Usage: node --test scripts/cloud-access-foundation.test.mjs (Node 24.20.0, Terraform 1.13.3, Google 8.6.0).
 * Inputs: only the five reviewed infra/cloud/access files. No private variables, state or credentials are copied.
 * Effects: isolated temporary copies, provider initialization/download, mocked plan-only tests, then recursive cleanup.
 * Failure: missing source/tools, unsupported source syntax, invalid plans, ineffective mutation controls or cleanup fail.
 * Native mocks establish configuration semantics, not real IAM propagation, deletion protection or cloud readiness.
 * ACCESS-BACKEND requires one empty GCS declaration; init -backend=false keeps mocks separate from live state migration.
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
const apis = [
  "iam.googleapis.com",
  "iamcredentials.googleapis.com",
  "sts.googleapis.com",
  "artifactregistry.googleapis.com",
  "storage.googleapis.com",
];
const accounts = [
  "mp3-registry-writer",
  "mp3-stage-deployer",
  "mp3-stage-probe",
  "mp3-stage-runtime",
  "mp3-prod-deployer",
  "mp3-prod-probe",
  "mp3-prod-runtime",
];
const states = ["operations", "stage", "production"];
const outputs = [
  "state_bucket_names",
  "registry_name",
  "registry_uri",
  "service_account_emails",
  "service_account_names",
  "workload_identity_provider",
];
const resourceBlocks = [
  "google_project_service.required",
  "google_storage_bucket.state",
  "google_artifact_registry_repository.images",
  "google_service_account.identity",
  "google_artifact_registry_repository_iam_member.writer",
  "google_artifact_registry_repository_iam_member.deployer_readers",
  "google_storage_bucket_iam_member.stage_state",
  "google_service_account_iam_member.runtime_user",
  "google_service_account_iam_member.stage_probe_minter",
  "google_iam_workload_identity_pool.github",
  "google_iam_workload_identity_pool_provider.github",
  "google_service_account_iam_member.github_federated",
  "google_project_iam_custom_role.stage_cost_read",
  "google_project_iam_member.stage_cost_reader",
];
const githubDefaults = {
  github_repository: "synthetic-owner/synthetic-repository",
  github_repository_id: "123456789",
  github_owner_id: "987654321",
};
const defaults = {
  ...githubDefaults,
  project_id: "synthetic-access-123",
  region: "us-central1",
  registry_id: "mp3-images",
};
const alternate = {
  ...githubDefaults,
  github_repository: "alternate-owner/alternate-repository",
  github_repository_id: "444444444",
  github_owner_id: "555555555",
  project_id: "alternate-access-456",
  region: "europe-west1",
  registry_id: "release-images-2",
};
const sorted = (values) => [...values].sort();
const email = (project, id) => `${id}@${project}.iam.gserviceaccount.com`;
const accountName = (project, id) => `projects/${project}/serviceAccounts/${email(project, id)}`;
const registryName = ({ project_id, region, registry_id }) =>
  `projects/${project_id}/locations/${region}/repositories/${registry_id}`;
const registryUri = ({ project_id, region, registry_id }) => `${region}-docker.pkg.dev/${project_id}/${registry_id}`;
const index = (base, key) => `${base}[${JSON.stringify(key)}]`;
const poolName = (input) =>
  `projects/${input.project_id === defaults.project_id ? "123456789012" : "210987654321"}/locations/global/workloadIdentityPools/mp3-github`;
const providerName = (input) => `${poolName(input)}/providers/github`;
const costRole = (project) => `projects/${project}/roles/mp3StageCostRead`;
const githubCondition = (input) => {
  const value = { ...githubDefaults, ...input };
  return `assertion.repository_id == '${value.github_repository_id}' && assertion.repository_owner_id == '${value.github_owner_id}' && assertion.ref == 'refs/heads/main' && assertion.workflow_ref == '${value.github_repository}/.github/workflows/ci.yml@refs/heads/main' && assertion.event_name == 'push'`;
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

/** Reject executable/credential/backend escape surfaces before provider initialization or any mocked plan. */
function sourceContract(source) {
  const nodes = Object.entries(source)
    .filter(([name]) => name.endsWith(".tf"))
    .flatMap(([file, text]) => body(scan(text)).map((node) => ({ ...node, file })));
  for (const node of nodes) {
    assert.equal(node.kind, "block", "Top-level attributes are outside this root");
    assert(
      ["terraform", "provider", "variable", "locals", "resource", "output"].includes(node.name),
      "Forbidden block",
    );
  }
  assert.equal(nodes.filter((node) => node.name === "terraform").length, 1, "Expected one Terraform block");
  const terraform = one(nodes, "terraform");
  assert.equal(terraform.file, "versions.tf", "Backend declaration belongs in versions.tf");
  const backend = one(terraform.children, "backend", ["gcs"]);
  assert.equal(backend.kind, "block");
  assert.deepEqual(backend.children, [], "Backend configuration must remain empty");
  const visit = (node) => {
    assert(!["provisioner", "connection", "dynamic", "cloud"].includes(node.name), "Forbidden nested block");
    if (node.name === "backend") assert.equal(node, backend, "Backend declaration outside the sole approved position");
    assert(node.name !== "ignore_changes", "Ignored configuration changes are outside the foundation");
    for (const child of node.children ?? []) visit(child);
  };
  nodes.forEach(visit);
  for (const text of Object.values(source)) rejectFileReads(text);
  assert.deepEqual(terraform.children.map((node) => node.name).sort(), [
    "backend",
    "required_providers",
    "required_version",
  ]);
  assert.equal(expression(terraform, "required_version"), '"= 1.13.3"');
  const providers = one(terraform.children, "required_providers");
  assert.equal(providers.children.length, 1);
  const providerObject = attribute(providers, "google").expression;
  assert.equal(providerObject[0].value, "{");
  assert.equal(providerObject.at(-1).value, "}");
  const pinned = { children: body(providerObject.slice(1, -1)) };
  assert.deepEqual(pinned.children.map((node) => node.name).sort(), ["source", "version"]);
  assert.equal(expression(pinned, "source"), '"hashicorp/google"');
  assert(['"8.6.0"', '"= 8.6.0"'].includes(expression(pinned, "version")));
  const configured = nodes.filter((node) => node.name === "provider");
  assert.equal(configured.length, 1);
  const google = one(configured, "provider", ["google"]);
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
  const variables = nodes.filter((node) => node.name === "variable");
  assert.deepEqual(
    sorted(variables.map((node) => node.labels[0])),
    sorted(["project_id", "region", "registry_id", ...Object.keys(githubDefaults)]),
  );
  for (const name of ["project_id", "region", "registry_id", ...Object.keys(githubDefaults)]) {
    const variable = one(variables, "variable", [name]);
    assert.equal(expression(variable, "type"), "string");
    assert(children(variable, "validation").length > 0, `${name} needs validation`);
    if (name === "project_id" || Object.hasOwn(githubDefaults, name))
      assert(!variable.children.some((node) => node.name === "default"));
    else assert.equal(expression(variable, "default"), JSON.stringify(defaults[name]));
  }
  assert.deepEqual(
    sorted(nodes.filter((node) => node.name === "output").map((node) => node.labels[0])),
    sorted(outputs),
  );
  const resources = nodes.filter((node) => node.name === "resource");
  assert.deepEqual(sorted(resources.map((node) => node.labels.join("."))), sorted(resourceBlocks));
  for (const resource of resources) {
    assert(!resource.children.some((node) => node.name === "provider"), "Resource provider overrides forbidden");
    const protectedType = [
      "google_storage_bucket",
      "google_artifact_registry_repository",
      "google_service_account",
    ].includes(resource.labels[0]);
    if (
      protectedType ||
      [
        "google_iam_workload_identity_pool.github",
        "google_iam_workload_identity_pool_provider.github",
        "google_service_account_iam_member.github_federated",
        "google_project_iam_custom_role.stage_cost_read",
        "google_project_iam_member.stage_cost_reader",
      ].includes(resource.labels.join("."))
    ) {
      const lifecycle = one(resource.children, "lifecycle");
      assert.deepEqual(
        lifecycle.children.map((node) => node.name),
        ["prevent_destroy"],
      );
      assert.equal(
        expression(lifecycle, "prevent_destroy"),
        "true",
        `${resource.labels.join(".")} must prevent destroy`,
      );
    }
  }
  const locks = body(scan(source[".terraform.lock.hcl"]));
  assert.equal(locks.length, 1);
  const lock = one(locks, "provider", ["registry.terraform.io/hashicorp/google"]);
  assert.equal(expression(lock, "version"), '"8.6.0"');
  assert(attribute(lock, "hashes").expression.some((token) => /^"h1:[A-Za-z0-9+/=]+"$/.test(token.value)));
  return nodes;
}

let sourceCache;
function sourceFiles() {
  if (sourceCache instanceof Error) throw sourceCache;
  if (sourceCache) return structuredClone(sourceCache);
  try {
    const directory = join(root, "infra/cloud/access");
    const sourceNames = readdirSync(directory).filter((name) =>
      /(?:\.tf(?:\.json)?|\.terraform\.lock\.hcl)$/.test(name),
    );
    assert.deepEqual(sorted(sourceNames), sorted(files), "Access root must contain exactly five source files");
    sourceCache = Object.fromEntries(
      files.map((file) => {
        const path = join(directory, file);
        const entry = lstatSync(path);
        assert(entry.isFile() && entry.size <= 256 * 1024, `${file} must be a bounded regular source file`);
        return [file, readFileSync(path, "utf8")];
      }),
    );
  } catch (cause) {
    sourceCache = new Error("ACCESS-FOUNDATION source unavailable or outside the five-file boundary", { cause });
    sourceCache.code = "ERR_ACCESS_FOUNDATION_SOURCE";
    throw sourceCache;
  }
  return structuredClone(sourceCache);
}

let scratch;
function workspace() {
  if (!scratch) {
    scratch = mkdtempSync(join(tmpdir(), "cloud-access-tests-"));
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

/** Override only computed identity fields, never configured account IDs, IAM grants, safety flags or input validation. */
function mockIdentities(input) {
  return [
    ...accounts.map((id) => [
      index("google_service_account.identity", id),
      {
        email: email(input.project_id, id),
        name: accountName(input.project_id, id),
        member: `serviceAccount:${email(input.project_id, id)}`,
      },
    ]),
    ["google_artifact_registry_repository.images", { name: registryName(input), registry_uri: registryUri(input) }],
    ["google_iam_workload_identity_pool.github", { name: poolName(input) }],
    ["google_iam_workload_identity_pool_provider.github", { name: providerName(input) }],
    ["google_project_iam_custom_role.stage_cost_read", { name: costRole(input.project_id) }],
  ]
    .map(
      ([target, values]) => `override_resource {
    target = ${target}
    override_during = plan
    values = ${JSON.stringify(values)}
  }`,
    )
    .join("\n");
}

function runBlock(name, variables, rejectedVariable) {
  const input = { ...defaults, ...variables };
  return `run "${name}" {
    command = plan
    variables {
      ${Object.entries({ ...githubDefaults, ...variables })
        .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
        .join("\n")}
    }
    ${rejectedVariable ? `expect_failures = [var.${rejectedVariable}]` : mockIdentities(input)}
  }`;
}

/** Plan only isolated source copies; no state, variables, test hooks or .terraform directory are copied from checkout. */
function mocked(source, runs, verbose = true) {
  sourceContract(source);
  const directory = mkdtempSync(join(workspace(), "case-"));
  try {
    for (const [name, text] of Object.entries(source)) writeFileSync(join(directory, name), text, { mode: 0o600 });
    writeFileSync(
      join(directory, "foundation.tftest.hcl"),
      `mock_provider "google" { override_during = plan }\n${runs.join("\n")}`,
      { mode: 0o600 },
    );
    terraform(directory, ["init", "-backend=false", "-input=false", "-no-color", "-lockfile=readonly"]);
    const records = terraform(directory, ["test", "-json", ...(verbose ? ["-verbose"] : [])])
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    assert(!records.some((record) => record.type === "diagnostic" && record.diagnostic.severity === "error"));
    const summary = records.filter((record) => record.type === "test_summary");
    assert.equal(summary.length, 1);
    assert.equal(summary[0].test_summary.status, "pass");
    assert.equal(summary[0].test_summary.passed, runs.length);
    assert.equal(summary[0].test_summary.failed, 0);
    assert.equal(summary[0].test_summary.errored, 0);
    assert.equal(summary[0].test_summary.skipped, 0);
    return records
      .filter((record) => record.type === "test_plan")
      .map((record) => ({ name: record["@testrun"], plan: record.test_plan }));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function resources(plan) {
  assert(Array.isArray(plan.resource_changes), "Missing complete resource changes");
  const pairs = plan.resource_changes.map((row) => {
    assert.equal(row.mode, "managed");
    assert.equal(row.provider_name, "registry.terraform.io/hashicorp/google");
    assert.equal(row.type, row.address.split(".")[0]);
    assert.deepEqual(row.change.actions, ["create"]);
    assert.equal(row.change.before, null);
    return [row.address, row.change.after];
  });
  const result = new Map(pairs);
  assert.equal(result.size, pairs.length, "Duplicate planned address");
  const expected = [
    ...apis.map((api) => index("google_project_service.required", api)),
    ...states.map((state) => index("google_storage_bucket.state", state)),
    "google_artifact_registry_repository.images",
    ...accounts.map((id) => index("google_service_account.identity", id)),
    "google_artifact_registry_repository_iam_member.writer",
    ...["stage", "production"].map((stage) =>
      index("google_artifact_registry_repository_iam_member.deployer_readers", stage),
    ),
    "google_storage_bucket_iam_member.stage_state",
    ...["stage", "production"].map((stage) => index("google_service_account_iam_member.runtime_user", stage)),
    "google_service_account_iam_member.stage_probe_minter",
    "google_iam_workload_identity_pool.github",
    "google_iam_workload_identity_pool_provider.github",
    ...["mp3-registry-writer", "mp3-stage-deployer"].map((id) =>
      index("google_service_account_iam_member.github_federated", id),
    ),
    "google_project_iam_custom_role.stage_cost_read",
    "google_project_iam_member.stage_cost_reader",
  ];
  assert.equal(expected.length, 29);
  assert.deepEqual(sorted(result.keys()), sorted(expected), "Unexpected/missing managed instance");
  return result;
}

function apiContract(plan, input) {
  const rows = resources(plan);
  for (const api of apis) {
    const value = rows.get(index("google_project_service.required", api));
    assert.equal(value.project, input.project_id);
    assert.equal(value.service, api);
    assert.equal(value.disable_on_destroy, false);
    assert.equal(value.disable_dependent_services, false);
  }
}
function bucketContract(plan, input) {
  const rows = resources(plan);
  for (const state of states) {
    const value = rows.get(index("google_storage_bucket.state", state));
    assert.equal(value.project, input.project_id);
    assert.equal(value.name, `${input.project_id}-tf-${state}`);
    assert.equal(value.location.toLowerCase(), input.region);
    assert.equal(value.storage_class, "STANDARD");
    assert.equal(value.uniform_bucket_level_access, true);
    assert.equal(value.public_access_prevention, "enforced");
    assert.equal(value.force_destroy, false);
    assert.equal(value.deletion_policy, "PREVENT");
    assert.deepEqual(value.versioning, [{ enabled: true }]);
    assert.equal(value.soft_delete_policy.length, 1);
    assert.equal(value.soft_delete_policy[0].retention_duration_seconds, 604800);
    assert(!(value.retention_policy ?? []).some((rule) => rule.is_locked === true), "Retention lock not selected");
    assert(
      !(value.lifecycle_rule ?? []).some((rule) => rule.action.some((action) => action.type === "Delete")),
      "Expiry not selected",
    );
  }
}
function registryContract(plan, input) {
  const value = resources(plan).get("google_artifact_registry_repository.images");
  assert.equal(value.project, input.project_id);
  assert.equal(value.location, input.region);
  assert.equal(value.repository_id, input.registry_id);
  assert.equal(value.format, "DOCKER");
  assert.equal(value.mode, "STANDARD_REPOSITORY");
  assert.equal(value.deletion_policy, "PREVENT");
  assert.equal(value.cleanup_policy_dry_run, true);
  assert(!(value.cleanup_policies ?? []).some((policy) => policy.action === "DELETE"));
  assert.deepEqual(value.docker_config, [], "Docker configuration must remain omitted for mutable default tags");
  assert.equal(value.vulnerability_scanning_config.length, 1);
  assert.equal(value.vulnerability_scanning_config[0].enablement_config, "DISABLED");
}
function identityContract(plan, input) {
  const rows = resources(plan);
  for (const id of accounts) {
    const value = rows.get(index("google_service_account.identity", id));
    assert.equal(value.project, input.project_id);
    assert.equal(value.account_id, id);
    assert.equal(value.deletion_policy, "PREVENT");
    assert.notEqual(value.disabled, true);
    assert.notEqual(value.create_ignore_already_exists, true);
  }
}
function iamContract(plan, input) {
  const rows = resources(plan);
  const member = (id) => `serviceAccount:${email(input.project_id, id)}`;
  const repositoryGrant = (address, role, id) => {
    const value = rows.get(address);
    assert.equal(value.project, input.project_id);
    assert.equal(value.location, input.region);
    assert.equal(value.repository, input.registry_id);
    assert.equal(value.role, role);
    assert.equal(value.member, member(id));
    assert.deepEqual(value.condition ?? [], []);
  };
  repositoryGrant(
    "google_artifact_registry_repository_iam_member.writer",
    "roles/artifactregistry.writer",
    "mp3-registry-writer",
  );
  for (const [stage, prefix] of [
    ["stage", "stage"],
    ["production", "prod"],
  ]) {
    repositoryGrant(
      index("google_artifact_registry_repository_iam_member.deployer_readers", stage),
      "roles/artifactregistry.reader",
      `mp3-${prefix}-deployer`,
    );
    const value = rows.get(index("google_service_account_iam_member.runtime_user", stage));
    assert.equal(value.service_account_id, accountName(input.project_id, `mp3-${prefix}-runtime`));
    assert.equal(value.role, "roles/iam.serviceAccountUser");
    assert.equal(value.member, member(`mp3-${prefix}-deployer`));
    assert.deepEqual(value.condition ?? [], []);
  }
  const state = rows.get("google_storage_bucket_iam_member.stage_state");
  assert.equal(state.bucket, `${input.project_id}-tf-stage`);
  assert.equal(state.role, "roles/storage.objectAdmin");
  assert.equal(state.member, member("mp3-stage-deployer"));
  assert.deepEqual(state.condition ?? [], []);
  const mint = rows.get("google_service_account_iam_member.stage_probe_minter");
  assert.equal(mint.service_account_id, accountName(input.project_id, "mp3-stage-probe"));
  assert.equal(mint.role, "roles/iam.serviceAccountOpenIdTokenCreator");
  assert.equal(mint.member, member("mp3-stage-deployer"));
  assert.deepEqual(mint.condition ?? [], []);
}
function outputContract(plan, input) {
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
    state_bucket_names: Object.fromEntries(states.map((state) => [state, `${input.project_id}-tf-${state}`])),
    registry_name: registryName(input),
    registry_uri: registryUri(input),
    service_account_emails: Object.fromEntries(accounts.map((id) => [id, email(input.project_id, id)])),
    service_account_names: Object.fromEntries(accounts.map((id) => [id, accountName(input.project_id, id)])),
    workload_identity_provider: providerName(input),
  });
}
/** Check the six adopted additive instances without weakening any pre-existing IAM or protection predicate. */
function federationValues(rows, input) {
  const value = { ...githubDefaults, ...input };
  const pool = rows.get("google_iam_workload_identity_pool.github");
  assert.equal(pool.project, value.project_id);
  assert.equal(pool.workload_identity_pool_id, "mp3-github");
  assert.equal(pool.disabled, false);
  const provider = rows.get("google_iam_workload_identity_pool_provider.github");
  assert.equal(provider.project, value.project_id);
  assert.equal(provider.workload_identity_pool_id, "mp3-github");
  assert.equal(provider.workload_identity_pool_provider_id, "github");
  assert.equal(provider.disabled, false);
  assert.deepEqual(provider.attribute_mapping, {
    "google.subject": "assertion.sub",
    "attribute.repository_id": "assertion.repository_id",
  });
  assert.equal(provider.attribute_condition, githubCondition(value));
  assert.equal(provider.oidc.length, 1);
  assert.equal(provider.oidc[0].issuer_uri, "https://token.actions.githubusercontent.com");
  assert.deepEqual(provider.oidc[0].allowed_audiences ?? [], []);
  for (const name of ["aws", "saml", "x509"]) assert.deepEqual(provider[name] ?? [], []);
  for (const id of ["mp3-registry-writer", "mp3-stage-deployer"]) {
    const grant = rows.get(index("google_service_account_iam_member.github_federated", id));
    assert.equal(grant.service_account_id, accountName(value.project_id, id));
    assert.equal(grant.role, "roles/iam.workloadIdentityUser");
    assert.equal(
      grant.member,
      `principalSet://iam.googleapis.com/${poolName(value)}/attribute.repository_id/${value.github_repository_id}`,
    );
    assert.deepEqual(grant.condition ?? [], []);
  }
  const role = rows.get("google_project_iam_custom_role.stage_cost_read");
  assert.equal(role.project, value.project_id);
  assert.equal(role.role_id, "mp3StageCostRead");
  assert.equal(role.stage, "GA");
  assert.deepEqual(
    sorted(role.permissions),
    sorted([
      "resourcemanager.projects.get",
      "billing.resourcebudgets.read",
      "serviceusage.services.use",
      "run.operations.get",
    ]),
  );
  const grant = rows.get("google_project_iam_member.stage_cost_reader");
  assert.equal(grant.project, value.project_id);
  assert.equal(grant.role, costRole(value.project_id));
  assert.equal(grant.member, `serviceAccount:${email(value.project_id, "mp3-stage-deployer")}`);
  assert.deepEqual(grant.condition ?? [], []);
}
function federationContract(plan, input) {
  federationValues(resources(plan), input);
}
const checks = [
  apiContract,
  bucketContract,
  registryContract,
  identityContract,
  iamContract,
  federationContract,
  outputContract,
];
function complete(plan, input) {
  for (const check of checks) check(plan, input);
}

let planned;
function positivePlans() {
  if (planned instanceof Error) throw planned;
  if (!planned) {
    try {
      planned = mocked(sourceFiles(), [
        runBlock("defaults", { project_id: defaults.project_id }),
        runBlock("alternate", alternate),
      ]);
      assert.deepEqual(
        planned.map((run) => run.name),
        ["defaults", "alternate"],
      );
    } catch (error) {
      planned = error;
      throw error;
    }
  }
  return planned;
}

/** Change a real source attribute in an isolated copy, preserving valid HCL and all unrelated source bytes. */
function mutateAttribute(source, address, path, replacement) {
  const [type, name] = address.split(".");
  let owner;
  for (const [file, text] of Object.entries(source).filter(([file]) => file.endsWith(".tf"))) {
    const found = body(scan(text)).find(
      (node) => node.name === "resource" && JSON.stringify(node.labels) === JSON.stringify([type, name]),
    );
    if (found) {
      assert(!owner);
      owner = { file, node: found };
    }
  }
  assert(owner, `Missing mutation target ${address}`);
  for (const block of path.slice(0, -1)) owner.node = one(owner.node.children, block);
  const tokens = attribute(owner.node, path.at(-1)).expression;
  const original = source[owner.file];
  const changed = original.slice(0, tokens[0].start) + replacement + original.slice(tokens.at(-1).end);
  assert.notEqual(changed, original, "Mutation must change actual source");
  return { ...source, [owner.file]: changed };
}

test("pinned Node and Terraform are available without loading cloud configuration", () => {
  assert.equal(process.versions.node, "24.20.0");
  assert.equal(JSON.parse(terraform(root, ["version", "-json"])).terraform_version, "1.13.3");
});
test("small structural scanner ignores comments/quoted decoys and refuses unsupported or unbalanced syntax", () => {
  const fixture =
    'resource "google_storage_bucket" "state" {\n description = "prevent_destroy = true }"\n # lifecycle { prevent_destroy = true }\n lifecycle { prevent_destroy = false }\n}\n';
  const node = one(body(scan(fixture)), "resource", ["google_storage_bucket", "state"]);
  assert.equal(expression(one(node.children, "lifecycle"), "prevent_destroy"), "false");
  for (const bad of ['resource "x" "y" {', "x = [1, 2)", "x = <<EOF\ntext\nEOF", 'resource "x" "y" { x = "bad\n }'])
    assert.throws(() => body(scan(bad)));
});
test("structural file guard refuses file hash reads while preserving pure string hashing", () => {
  for (const name of ["md5", "sha1", "sha256", "sha512", "base64sha256", "base64sha512"])
    assert.doesNotThrow(() => rejectFileReads(`locals { digest = ${name}("synthetic-content") }`));
  for (const name of ["filemd5", "filesha1", "filesha256", "filesha512", "filebase64sha256", "filebase64sha512"])
    assert.throws(() => rejectFileReads(`locals { digest = ${name}("/forbidden") }`), {
      code: "ERR_ASSERTION",
      message: "File-reading functions forbidden",
    });
});
test("only the five source files, pinned provider, explicit input surface and literal lifecycle guards are admitted", () => {
  sourceContract(sourceFiles());
});
test("backend controls require the sole empty GCS block in versions.tf before initialization", () => {
  // Literal contract fixture: this exercises the amended guard before the backend source implementation exists.
  // Only in-memory source copies change; none of these structural controls invokes Terraform or initializes state.
  const settings = `required_version = "= 1.13.3"
required_providers {
  google = {
    source = "hashicorp/google"
    version = "8.6.0"
  }
}`;
  const provider = `provider "google" {
  project = var.project_id
  billing_project = var.project_id
  region = var.region
  user_project_override = true
}`;
  const versions = (declaration) => `terraform {\n${settings}\n${declaration}\n}\n${provider}\n`;
  const valid = { ...sourceFiles(), "versions.tf": versions('backend "gcs" {}') };
  assert.doesNotThrow(() => sourceContract(valid), "Valid empty backend counterpart must pass first");
  for (const [label, declaration] of [
    ["absent", ""],
    ["wrong type", 'backend "local" {}'],
    ["missing label", "backend {}"],
    ["additional label", 'backend "gcs" "extra" {}'],
    ["attribute instead of block", "backend = {}"],
    ["duplicate", 'backend "gcs" {}\nbackend "gcs" {}'],
    ["bucket", 'backend "gcs" { bucket = "synthetic-bucket" }'],
    ["prefix", 'backend "gcs" { prefix = "synthetic-prefix" }'],
    ["credential", 'backend "gcs" { credentials = "synthetic-not-a-token" }'],
    ["unknown argument", 'backend "gcs" { unexpected = false }'],
    ["nested content", 'backend "gcs" { nested {} }'],
    ["nested in other block", 'locals { backend "gcs" {} }'],
  ])
    assert.throws(
      () => sourceContract({ ...valid, "versions.tf": versions(declaration) }),
      { code: "ERR_ASSERTION" },
      label,
    );
  for (const addition of ['backend "gcs" {}', 'locals { backend "gcs" {} }', 'terraform { backend "gcs" {} }'])
    assert.throws(() => sourceContract({ ...valid, "main.tf": `${valid["main.tf"]}\n${addition}\n` }), {
      code: "ERR_ASSERTION",
    });
  assert.throws(
    () =>
      sourceContract({
        ...valid,
        "versions.tf": `${provider}\n`,
        "main.tf": `${valid["main.tf"]}\nterraform {\n${settings}\nbackend "gcs" {}\n}\n`,
      }),
    { code: "ERR_ASSERTION" },
    "Moving the otherwise valid Terraform block into another existing source file must fail",
  );
});
for (const [label, check] of [
  ["exact resource and API boundary", apiContract],
  ["state privacy, recovery and deletion protections", bucketContract],
  ["regional Docker registry and nondeleting cleanup", registryContract],
  ["seven protected dedicated identities", identityContract],
  ["exact narrow non-authoritative IAM tuples", iamContract],
  ["closed nonsecret identity outputs", outputContract],
  ["main-push-only federation and stage-principal project read/usage authority", federationContract],
]) {
  test(`mocked default and alternate inputs preserve ${label}`, () => {
    const plans = positivePlans();
    check(plans[0].plan, defaults);
    check(plans[1].plan, alternate);
  });
}
test("registry default normalization has a valid omitted-block counterpart and refuses explicit overrides", () => {
  // This corrective contract was adopted after real-provider readback; only these isolated fixture copies change.
  const source = sourceFiles();
  const valid = {
    ...source,
    "main.tf": source["main.tf"].replace(/\n\s*docker_config\s*\{\s*immutable_tags\s*=\s*false\s*\}\n/g, "\n"),
  };
  const header = 'resource "google_artifact_registry_repository" "images" {';
  assert.equal(valid["main.tf"].split(header).length, 2, "Controls require one literal registry fixture target");
  const plans = mocked(valid, [runBlock("omitted_registry_default", { project_id: defaults.project_id })]);
  assert.equal(plans.length, 1);
  complete(plans[0].plan, defaults);
  for (const [label, declaration, value] of [
    ["explicit_false", "docker_config { immutable_tags = false }", false],
    ["explicit_true", "docker_config { immutable_tags = true }", true],
    ["empty_block", "docker_config {}", null],
  ]) {
    const changed = {
      ...valid,
      "main.tf": valid["main.tf"].replace(header, `${header}\n  ${declaration}`),
    };
    assert.notEqual(changed["main.tf"], valid["main.tf"]);
    const rejected = mocked(changed, [runBlock(label, { project_id: defaults.project_id })]);
    assert.equal(rejected.length, 1, `${label} must reach a successful real mock plan`);
    assert.deepEqual(resources(rejected[0].plan).get("google_artifact_registry_repository.images").docker_config, [
      { immutable_tags: value },
    ]);
    assert.throws(
      () => registryContract(rejected[0].plan, defaults),
      (error) =>
        error.code === "ERR_ASSERTION" &&
        error.message.startsWith("Docker configuration must remain omitted for mutable default tags"),
      `${label} must fail the amended Docker-configuration oracle`,
    );
  }
  for (const ignored of ["[docker_config]", "all"]) {
    const changed = mutateAttribute(
      valid,
      "google_artifact_registry_repository.images",
      ["lifecycle", "prevent_destroy"],
      `true\n    ignore_changes = ${ignored}`,
    );
    assert.throws(() => sourceContract(changed), {
      code: "ERR_ASSERTION",
      message: "Ignored configuration changes are outside the foundation",
    });
  }
});
test("ordinary short and maximum project/repository identifiers have valid counterparts", () => {
  const inputs = [
    { project_id: "abcde1", region: "us-west1", registry_id: "r" },
    { project_id: `a${"b".repeat(28)}1`, region: "asia-northeast1", registry_id: `r${"a".repeat(61)}1` },
  ];
  const plans = mocked(
    sourceFiles(),
    inputs.map((input, i) => runBlock(`boundary_${i}`, input)),
  );
  assert.equal(plans.length, inputs.length);
  plans.forEach((run, i) => complete(run.plan, inputs[i]));
});
test("invalid required project, region and repository values fail their own variable validation", () => {
  const invalid = {
    project_id: [
      "",
      " ",
      "abcde",
      "1abcde",
      "Upper-project",
      "abcde-",
      "a".repeat(31),
      "bad/project",
      "bad project",
      "bad\nproject",
      null,
    ],
    region: ["", " ", "US-CENTRAL1", "us/central1", "us central1", "us-central1-a", "us-central1\n", null],
    registry_id: ["", " ", "Upper", "1repo", "repo-", "bad/repo", "bad repo", "repo\t", "a".repeat(64), null],
    github_repository_id: ["", "0", "-1", "1.5", "123 ", "123\n", "owner/repo", null],
    github_owner_id: ["", "0", "-1", "1.5", " 123", "123\n", "owner", null],
    github_repository: ["", "owner", "owner/repo/extra", "owner/repo ", "owner/repo\n", "owner'quote/repo", null],
  };
  const runs = Object.entries(invalid).flatMap(([key, values]) =>
    values.map((value, i) => runBlock(`invalid_${key}_${i}`, { project_id: defaults.project_id, [key]: value }, key)),
  );
  assert.deepEqual(mocked(sourceFiles(), runs, false), []);
});
for (const [label, address, path, replacement, check] of [
  ["bucket force deletion", "google_storage_bucket.state", ["force_destroy"], "true", bucketContract],
  [
    "zero-day soft deletion",
    "google_storage_bucket.state",
    ["soft_delete_policy", "retention_duration_seconds"],
    "0",
    bucketContract,
  ],
  [
    "destructive registry cleanup",
    "google_artifact_registry_repository.images",
    ["cleanup_policy_dry_run"],
    "false",
    registryContract,
  ],
  [
    "general Token Creator escalation",
    "google_service_account_iam_member.stage_probe_minter",
    ["role"],
    '"roles/iam.serviceAccountTokenCreator"',
    iamContract,
  ],
  ["public state access", "google_storage_bucket_iam_member.stage_state", ["member"], '"allUsers"', iamContract],
  [
    "unrestricted federation",
    "google_iam_workload_identity_pool_provider.github",
    ["attribute_condition"],
    '"true"',
    federationContract,
  ],
  [
    "cost write escalation",
    "google_project_iam_custom_role.stage_cost_read",
    ["permissions"],
    '["resourcemanager.projects.get", "billing.resourcebudgets.read", "serviceusage.services.use", "run.operations.get", "billing.budgets.update"]',
    federationContract,
  ],
  [
    "production cost authority",
    "google_project_iam_member.stage_cost_reader",
    ["member"],
    '"serviceAccount:mp3-prod-deployer@${var.project_id}.iam.gserviceaccount.com"',
    federationContract,
  ],
]) {
  test(`configuration mutation control rejects ${label} after a successful mock plan`, () => {
    complete(positivePlans()[0].plan, defaults);
    const changed = mutateAttribute(sourceFiles(), address, path, replacement);
    const plans = mocked(changed, [runBlock("unsafe_mutation", { project_id: defaults.project_id })]);
    assert.equal(plans.length, 1, "Negative control must reach a successful real mock plan");
    assert.throws(() => check(plans[0].plan, defaults), { code: "ERR_ASSERTION" });
  });
}
test("configuration controls reject missing literal protection and additional scope before initialization", () => {
  const source = sourceFiles();
  sourceContract(source);
  for (const address of [
    "google_storage_bucket.state",
    "google_artifact_registry_repository.images",
    "google_service_account.identity",
  ])
    assert.throws(() => sourceContract(mutateAttribute(source, address, ["lifecycle", "prevent_destroy"], "false")), {
      code: "ERR_ASSERTION",
    });
  for (const addition of [
    'resource "google_project_iam_member" "extra" {\n project = var.project_id\n role = "roles/owner"\n member = "allUsers"\n}\n',
    'resource "google_service_account_key" "extra" {\n service_account_id = "forbidden"\n}\n',
    'module "extra" { source = "./forbidden" }\n',
    'data "external" "extra" { program = ["false"] }\n',
    'provider "google" { alias = "unmocked" }\n',
    'provider "external" {}\n',
    'terraform { backend "gcs" { bucket = "forbidden" } }\n',
    'locals { forbidden = file("/forbidden") }\n',
    'locals { forbidden = filemd5("/forbidden") }\n',
    'locals { forbidden = filesha1("/forbidden") }\n',
    'locals { forbidden = filesha256("/forbidden") }\n',
    'locals { forbidden = filesha512("/forbidden") }\n',
    'locals { forbidden = filebase64sha256("/forbidden") }\n',
    'locals { forbidden = filebase64sha512("/forbidden") }\n',
  ])
    assert.throws(() => sourceContract({ ...source, "main.tf": source["main.tf"] + addition }), {
      code: "ERR_ASSERTION",
    });
});
test("plan oracle rejects hidden instances, missing identities, crossed IAM targets and unsafe output additions", () => {
  const original = positivePlans()[0].plan;
  complete(original, defaults);
  const mutations = [
    (plan) =>
      plan.resource_changes.push({
        ...structuredClone(plan.resource_changes[0]),
        address: "google_cloud_run_v2_service.hidden",
        type: "google_cloud_run_v2_service",
      }),
    (plan) => plan.resource_changes.pop(),
    (plan) => plan.resource_changes.push(structuredClone(plan.resource_changes[0])),
    (plan) => {
      plan.resource_changes.find(
        (row) => row.address === "google_storage_bucket_iam_member.stage_state",
      ).change.after.bucket = `${defaults.project_id}-tf-production`;
    },
    (plan) => {
      plan.resource_changes.find(
        (row) => row.address === index("google_service_account_iam_member.runtime_user", "stage"),
      ).change.after.service_account_id = accountName(defaults.project_id, "mp3-prod-runtime");
    },
    (plan) => {
      plan.resource_changes.find(
        (row) => row.address === "google_service_account_iam_member.stage_probe_minter",
      ).change.after.member = `serviceAccount:${email(defaults.project_id, "mp3-prod-deployer")}`;
    },
    (plan) => {
      plan.output_changes.token = {
        actions: ["create"],
        after: "forbidden",
        after_unknown: false,
        after_sensitive: false,
      };
    },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(original);
    mutate(copy);
    assert.throws(() => complete(copy, defaults), { code: "ERR_ASSERTION" });
  }
});

test("federation oracle has a literal valid counterpart and rejects each trust restriction or privilege change", () => {
  const rows = new Map([
    [
      "google_iam_workload_identity_pool.github",
      { project: defaults.project_id, workload_identity_pool_id: "mp3-github", disabled: false },
    ],
    [
      "google_iam_workload_identity_pool_provider.github",
      {
        project: defaults.project_id,
        workload_identity_pool_id: "mp3-github",
        workload_identity_pool_provider_id: "github",
        disabled: false,
        attribute_mapping: { "google.subject": "assertion.sub", "attribute.repository_id": "assertion.repository_id" },
        attribute_condition:
          "assertion.repository_id == '123456789' && assertion.repository_owner_id == '987654321' && assertion.ref == 'refs/heads/main' && assertion.workflow_ref == 'synthetic-owner/synthetic-repository/.github/workflows/ci.yml@refs/heads/main' && assertion.event_name == 'push'",
        oidc: [{ issuer_uri: "https://token.actions.githubusercontent.com", allowed_audiences: [] }],
      },
    ],
    [
      index("google_service_account_iam_member.github_federated", "mp3-registry-writer"),
      {
        service_account_id:
          "projects/synthetic-access-123/serviceAccounts/mp3-registry-writer@synthetic-access-123.iam.gserviceaccount.com",
        role: "roles/iam.workloadIdentityUser",
        member:
          "principalSet://iam.googleapis.com/projects/123456789012/locations/global/workloadIdentityPools/mp3-github/attribute.repository_id/123456789",
      },
    ],
    [
      index("google_service_account_iam_member.github_federated", "mp3-stage-deployer"),
      {
        service_account_id:
          "projects/synthetic-access-123/serviceAccounts/mp3-stage-deployer@synthetic-access-123.iam.gserviceaccount.com",
        role: "roles/iam.workloadIdentityUser",
        member:
          "principalSet://iam.googleapis.com/projects/123456789012/locations/global/workloadIdentityPools/mp3-github/attribute.repository_id/123456789",
      },
    ],
    [
      "google_project_iam_custom_role.stage_cost_read",
      {
        project: defaults.project_id,
        role_id: "mp3StageCostRead",
        stage: "GA",
        permissions: [
          "resourcemanager.projects.get",
          "billing.resourcebudgets.read",
          "serviceusage.services.use",
          "run.operations.get",
        ],
      },
    ],
    [
      "google_project_iam_member.stage_cost_reader",
      {
        project: defaults.project_id,
        role: "projects/synthetic-access-123/roles/mp3StageCostRead",
        member: "serviceAccount:mp3-stage-deployer@synthetic-access-123.iam.gserviceaccount.com",
      },
    ],
  ]);
  federationValues(rows, defaults);
  const provider = "google_iam_workload_identity_pool_provider.github";
  const mutations = [
    ...["repository_id", "repository_owner_id", "ref", "workflow_ref", "event_name"].map((claim) => (copy) => {
      copy.get(provider).attribute_condition = copy
        .get(provider)
        .attribute_condition.split(" && ")
        .filter((part) => !part.startsWith(`assertion.${claim} ==`))
        .join(" && ");
    }),
    (copy) => {
      copy.get(provider).attribute_condition = copy.get(provider).attribute_condition.replaceAll(" && ", " || ");
    },
    (copy) => {
      copy.get(provider).oidc[0].issuer_uri = "https://foreign.invalid";
    },
    (copy) => {
      copy.get(provider).oidc[0].allowed_audiences = ["arbitrary"];
    },
    (copy) => {
      copy.get(index("google_service_account_iam_member.github_federated", "mp3-stage-deployer")).service_account_id =
        accountName(defaults.project_id, "mp3-prod-deployer");
    },
    (copy) => {
      copy.get(index("google_service_account_iam_member.github_federated", "mp3-registry-writer")).role =
        "roles/iam.serviceAccountTokenCreator";
    },
    ...[
      "resourcemanager.projects.get",
      "billing.resourcebudgets.read",
      "serviceusage.services.use",
      "run.operations.get",
    ].map((permission) => (copy) => {
      const role = copy.get("google_project_iam_custom_role.stage_cost_read");
      role.permissions = role.permissions.filter((value) => value !== permission);
    }),
    ...[
      "billing.budgets.update",
      "run.operations.list",
      "run.services.update",
      "run.routes.invoke",
      "run.operations.get",
    ].map((permission) => (copy) => {
      copy.get("google_project_iam_custom_role.stage_cost_read").permissions.push(permission);
    }),
    ...["mp3-prod-deployer", "mp3-prod-probe", "mp3-prod-runtime"].map((principal) => (copy) => {
      copy.get("google_project_iam_member.stage_cost_reader").member =
        `serviceAccount:${email(defaults.project_id, principal)}`;
    }),
    ...["roles/run.admin", "roles/editor", "roles/owner"].map((role) => (copy) => {
      copy.get("google_project_iam_member.stage_cost_reader").role = role;
    }),
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(rows);
    mutate(copy);
    assert.throws(() => federationValues(copy, defaults), { code: "ERR_ASSERTION" });
  }
});
