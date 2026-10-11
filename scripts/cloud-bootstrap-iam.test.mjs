/**
 * Independently verify the one-role bootstrap IAM correction and preserve its seven original resources.
 * Usage: node --test scripts/cloud-bootstrap-iam.test.mjs with Node 24.20.0 and Terraform 1.13.3.
 * Inputs: four reviewed public Terraform files and their exact lockfile; optionally BOOTSTRAP_IAM_PROVIDER_MIRROR
 * selects an already installed provider mirror. Initialization checks that mirror against the immutable lock.
 * Effects: disposable private source copies, offline provider installation and native mocked plans, then cleanup.
 * No credentials, private variables, state, application, real cloud calls or provider downloads are used.
 * Failure: source drift, unsafe additions, missing tools/mirror, invalid mock plans or cleanup fail the suite.
 * Test-owned binding calibration is separate from actual-source red; mocks do not prove live IAM preservation.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const directory = join(root, "infra/cloud/bootstrap");
const files = ["versions.tf", "variables.tf", "main.tf", "outputs.tf", ".terraform.lock.hcl"];
const originalHashes = {
  "versions.tf": "1f94e41037265aca338d68e4726d3f4b372ccc7a9747ec155b6b00a5d078e38f",
  "variables.tf": "20340d5ad627f42e16d9c8b7692154dce69fde4148e64df505af2426f61e9780",
  "main.tf": "586b5466bc82fd1dfd2799f743cda97020f6d4ea9683ca8fde26dd3098b207f3",
  "outputs.tf": "e837a25ec6f45c40b716b347f9e130766e566d22fe3462b9e05a093441851010",
};
const lockHash = "c18a0c613fac0544034d261e7f234849fa39e6b23e3013e3b2740a706481b4f5";
const bindingName = "google_project_iam_binding.no_project_editors";
const apis = [
  "billingbudgets.googleapis.com",
  "cloudbilling.googleapis.com",
  "cloudresourcemanager.googleapis.com",
  "run.googleapis.com",
];
const canonicalBinding = `
resource "google_project_iam_binding" "no_project_editors" {
  project = google_project.application.project_id
  role = "roles/editor"
  members = []
  depends_on = [google_project_service.bootstrap["cloudresourcemanager.googleapis.com"]]
  lifecycle {
    prevent_destroy = true
  }
}
`;
const defaults = {
  project_id: "synthetic-iam-123",
  project_name: "Synthetic IAM project",
  billing_account_id: "A1B2C3-D4E5F6-A1B2C3",
  billing_currency_confirmed_usd: true,
};
const alternate = {
  project_id: "alternate-iam-456",
  project_name: "Alternate IAM project",
  billing_account_id: "D4E5F6-A1B2C3-D4E5F6",
  billing_currency_confirmed_usd: true,
};
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sorted = (values) => [...values].sort();
const identity = (input) => ({
  number: input.project_id === defaults.project_id ? "123450000001" : "123450000002",
  budget: `billingAccounts/${input.billing_account_id}/budgets/synthetic-budget`,
});

/** Tokenize this bounded HCL subset; quoted/comment decoys cannot impersonate a guard or resource boundary. */
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
    assert(!tail.startsWith("<<"), "Unsupported source heredoc");
    if (tail[0] === "\n") {
      tokens.push({ value: "\n", start: offset, end: ++offset });
      continue;
    }
    const match = /^(?:"(?:\\.|[^"\\])*"|[A-Za-z_][A-Za-z0-9_-]*|[0-9]+(?:\.[0-9]+)?|[^\s])/.exec(tail);
    assert(match, "Unsupported source token");
    const value = match[0];
    assert(value !== '"', "Unterminated source string");
    if (value.startsWith('"')) JSON.parse(value);
    tokens.push({ value, start: offset, end: offset + value.length });
    offset += value.length;
  }
  return tokens;
}

/** Parse only structural boundaries and retain expressions; Terraform, not this scanner, evaluates HCL. */
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
      const start = position;
      const name = tokens[position++].value;
      assert.match(name, /^[A-Za-z_][A-Za-z0-9_-]*$/, "Expected literal block or attribute name");
      if (tokens[position]?.value === "=") {
        position++;
        const expression = [];
        const stack = [];
        while (position < tokens.length) {
          const token = tokens[position];
          if (!stack.length && ["\n", "}"].includes(token.value)) break;
          if (["(", "[", "{"].includes(token.value)) stack.push(token.value);
          if ([")", "]", "}"].includes(token.value))
            assert.equal(stack.pop(), { ")": "(", "]": "[", "}": "{" }[token.value], "Unbalanced expression");
          expression.push(token);
          position++;
        }
        assert(expression.length && !stack.length, "Incomplete expression");
        result.push({ kind: "attribute", name, expression, tokens: tokens.slice(start, position) });
      } else {
        const labels = [];
        while (tokens[position]?.value.startsWith('"')) labels.push(JSON.parse(tokens[position++].value));
        assert.equal(tokens[position++]?.value, "{", "Unsupported block header");
        const children = read(true);
        result.push({ kind: "block", name, labels, children, tokens: tokens.slice(start, position) });
      }
    }
    assert(!nested, "Unclosed block");
    return result;
  };
  return read();
}
const canonical = (tokens) => tokens.filter((token) => token.value !== "\n").map((token) => token.value);
const fingerprint = (tokens) => sha(JSON.stringify(canonical(tokens)));
function expression(node, name) {
  const found = node.children.filter((child) => child.kind === "attribute" && child.name === name);
  assert.equal(found.length, 1, `Binding needs exactly one ${name}`);
  return canonical(found[0].expression).join("");
}

/** Read only the closed regular public source set; local state, tfvars, caches and cap files are never copied. */
function sourceFiles() {
  const names = readdirSync(directory).filter((name) => /(?:\.tf(?:\.json)?|\.terraform\.lock\.hcl)$/.test(name));
  assert.deepEqual(sorted(names), sorted(files), "Bootstrap has exactly five public Terraform source files");
  return Object.fromEntries(
    files.map((file) => {
      const path = join(directory, file);
      const stat = lstatSync(path);
      assert(stat.isFile() && stat.size <= 256 * 1024, "Source must be a bounded regular file");
      return [file, readFileSync(path, "utf8")];
    }),
  );
}

/** Preserve original code tokens and bytes of the lock; allow only the one independently specified new binding. */
function sourceContract(source, requireBinding = true) {
  assert.deepEqual(sorted(Object.keys(source)), sorted(files), "Closed source file set");
  assert.equal(sha(source[".terraform.lock.hcl"]), lockHash, "Original provider lock is immutable");
  for (const file of ["versions.tf", "variables.tf", "outputs.tf"])
    assert.equal(fingerprint(scan(source[file])), originalHashes[file], `Original ${file} tokens are immutable`);
  const nodes = body(scan(source["main.tf"]));
  assert(
    nodes.every((node) => node.kind === "block" && node.name === "resource"),
    "Only resource blocks in main",
  );
  const binding = nodes.filter((node) => node.labels.join(".") === bindingName);
  assert.equal(binding.length, requireBinding ? 1 : 0, "Exactly one no_project_editors binding is required");
  const original = nodes.filter((node) => node.labels.join(".") !== bindingName);
  assert.equal(
    fingerprint(original.flatMap((node) => node.tokens)),
    originalHashes["main.tf"],
    "Original seven resources are immutable",
  );
  if (!requireBinding) return;
  const node = binding[0];
  assert.deepEqual(
    sorted(node.children.map((child) => `${child.kind}:${child.name}`)),
    ["attribute:depends_on", "attribute:members", "attribute:project", "attribute:role", "block:lifecycle"],
    "Binding has no conditions, provider overrides or executable additions",
  );
  assert.equal(
    expression(node, "project"),
    "google_project.application.project_id",
    "Binding targets the owned project reference",
  );
  assert.equal(expression(node, "role"), '"roles/editor"', "Binding removes only project Editor");
  assert.equal(expression(node, "members"), "[]", "Binding has a literal empty member set");
  assert.equal(
    expression(node, "depends_on"),
    '[google_project_service.bootstrap["cloudresourcemanager.googleapis.com"]]',
    "Binding waits for the existing Resource Manager API",
  );
  const lifecycle = node.children.find((child) => child.kind === "block");
  assert.deepEqual(lifecycle.labels, []);
  assert.deepEqual(
    lifecycle.children.map((child) => `${child.kind}:${child.name}`),
    ["attribute:prevent_destroy"],
    "Binding has only its destruction guard",
  );
  assert.equal(expression(lifecycle, "prevent_destroy"), "true", "Binding must literally prevent destroy");
}

/** Create a clearly synthetic positive fixture without editing or supplying implementation to the actual checkout. */
function calibratedSource() {
  const source = sourceFiles();
  const tokens = scan(source["main.tf"]);
  const bindings = body(tokens).filter((node) => node.labels.join(".") === bindingName);
  assert(bindings.length <= 1);
  if (bindings.length) {
    const owned = bindings[0].tokens;
    source["main.tf"] = source["main.tf"].slice(0, owned[0].start) + source["main.tf"].slice(owned.at(-1).end);
  }
  sourceContract(source, false);
  source["main.tf"] += canonicalBinding;
  sourceContract(source);
  return source;
}

let scratch;
/** Make isolated HOME and Terraform CLI configuration; only a verified installed provider mirror can be used. */
function workspace() {
  if (!scratch) {
    scratch = mkdtempSync(join(tmpdir(), "bootstrap-iam-tests-"));
    mkdirSync(join(scratch, "home"), { mode: 0o700 });
    writeFileSync(join(scratch, "terraform.rc"), "disable_checkpoint = true\n", { mode: 0o600 });
  }
  return scratch;
}
after(() => {
  if (scratch) {
    rmSync(scratch, { recursive: true, force: true });
    assert.equal(existsSync(scratch), false, "Disposable fixture cleanup failed");
  }
});

/** Execute bounded Terraform with no inherited auth, ADC, TF_VAR, proxies, caller CLI configuration or cloud state. */
function terraform(cwd, args) {
  const temp = workspace();
  return execFileSync("terraform", args, {
    cwd,
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 48 * 1024 * 1024,
    env: {
      PATH: process.env.PATH,
      HOME: join(temp, "home"),
      TMPDIR: temp,
      TF_CLI_CONFIG_FILE: join(temp, "terraform.rc"),
      TF_IN_AUTOMATION: "1",
      CHECKPOINT_DISABLE: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/** Select an existing filesystem mirror, and configure no registry/network installation fallback. */
function mirror() {
  const path = process.env.BOOTSTRAP_IAM_PROVIDER_MIRROR || join(directory, ".terraform/providers");
  assert(existsSync(path) && lstatSync(path).isDirectory(), "An installed Google provider mirror is required");
  const selected = realpathSync(path);
  writeFileSync(
    join(workspace(), "terraform.rc"),
    `disable_checkpoint = true
provider_installation {
  filesystem_mirror {
    path = ${JSON.stringify(selected)}
    include = ["registry.terraform.io/hashicorp/google"]
  }
}
`,
    { mode: 0o600 },
  );
}

/** Mock both declared aliases; override only the project's computed number and budget's computed resource ID. */
function runBlock(name, input) {
  const ids = identity(input);
  return `run "${name}" {
  command = plan
  variables {
${Object.entries(input)
  .map(([key, value]) => `    ${key} = ${JSON.stringify(value)}`)
  .join("\n")}
  }
  override_resource {
    target = google_project.application
    override_during = plan
    values = { number = ${JSON.stringify(ids.number)} }
  }
  override_resource {
    target = google_billing_budget.application_total
    override_during = plan
    values = { id = ${JSON.stringify(ids.budget)} }
  }
}`;
}

/** Plan isolated admitted sources with native mocks, require every declared run, and always delete its fixture. */
function mocked(source) {
  sourceContract(source);
  mirror();
  const fixture = mkdtempSync(join(workspace(), "case-"));
  try {
    for (const [file, text] of Object.entries(source)) writeFileSync(join(fixture, file), text, { mode: 0o600 });
    writeFileSync(
      join(fixture, "bootstrap.tftest.hcl"),
      `mock_provider "google" {
  override_during = plan
}
mock_provider "google" {
  alias = "budget"
  override_during = plan
}
${runBlock("default_project", defaults)}
${runBlock("alternate_project", alternate)}
`,
      { mode: 0o600 },
    );
    terraform(fixture, ["init", "-backend=false", "-input=false", "-no-color", "-lockfile=readonly"]);
    assert.equal(sha(readFileSync(join(fixture, ".terraform.lock.hcl"))), lockHash);
    const records = terraform(fixture, ["test", "-json", "-verbose"])
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    assert(!records.some((row) => row.type === "diagnostic" && row.diagnostic.severity === "error"));
    const summary = records.filter((row) => row.type === "test_summary");
    assert.equal(summary.length, 1);
    assert.deepEqual(summary[0].test_summary, { status: "pass", passed: 2, failed: 0, errored: 0, skipped: 0 });
    const plans = records
      .filter((row) => row.type === "test_plan")
      .map((row) => ({ name: row["@testrun"], plan: row.test_plan }));
    assert.deepEqual(
      plans.map((row) => row.name),
      ["default_project", "alternate_project"],
    );
    return plans;
  } finally {
    rmSync(fixture, { recursive: true, force: true });
    assert.equal(existsSync(fixture), false);
  }
}

/** Independent semantic oracle for the complete literal eight-resource, two-sensitive-output mock plan. */
function planContract(plan, input) {
  const expected = [
    "google_project.application",
    "google_project_service.service_usage",
    ...apis.map((api) => `google_project_service.bootstrap[${JSON.stringify(api)}]`),
    "google_billing_budget.application_total",
    bindingName,
  ];
  assert.equal(expected.length, 8);
  assert.deepEqual(
    sorted(plan.resource_changes.map((row) => row.address)),
    sorted(expected),
    "Exactly eight managed addresses",
  );
  const rows = new Map(
    plan.resource_changes.map((row) => {
      assert.equal(row.mode, "managed");
      assert.equal(row.provider_name, "registry.terraform.io/hashicorp/google");
      assert.deepEqual(row.change.actions, ["create"]);
      assert.equal(row.change.before, null);
      return [row.address, row.change.after];
    }),
  );
  const project = rows.get("google_project.application");
  assert.equal(project.project_id, input.project_id);
  assert.equal(project.name, input.project_name);
  assert.equal(project.billing_account, input.billing_account_id);
  assert.equal(project.deletion_policy, "PREVENT");
  assert.deepEqual(project.labels, { application: "mp3-frame-counter", managed_by: "terraform" });
  for (const [address, service] of [
    ["google_project_service.service_usage", "serviceusage.googleapis.com"],
    ...apis.map((api) => [`google_project_service.bootstrap[${JSON.stringify(api)}]`, api]),
  ]) {
    const value = rows.get(address);
    assert.equal(value.project, input.project_id);
    assert.equal(value.service, service);
    assert.equal(value.disable_on_destroy, false);
    assert.equal(value.disable_dependent_services, false);
    assert.equal(value.deletion_policy, "PREVENT");
  }
  const budget = rows.get("google_billing_budget.application_total");
  assert.equal(budget.billing_account, input.billing_account_id);
  assert.equal(budget.display_name, "mp3-application-monthly-100-alert");
  assert.equal(budget.deletion_policy, "PREVENT");
  assert.equal(budget.budget_filter.length, 1);
  const filter = budget.budget_filter[0];
  assert.deepEqual(filter.projects, [`projects/${identity(input).number}`]);
  assert.equal(filter.calendar_period, "MONTH");
  assert.equal(filter.credit_types_treatment, "EXCLUDE_ALL_CREDITS");
  assert.deepEqual(filter.services ?? [], []);
  assert.deepEqual(budget.amount, [
    { last_period_amount: null, specified_amount: [{ currency_code: "USD", units: "100", nanos: 0 }] },
  ]);
  assert.deepEqual(sorted(budget.threshold_rules.map((row) => `${row.spend_basis}:${row.threshold_percent}`)), [
    "CURRENT_SPEND:0.5",
    "CURRENT_SPEND:0.75",
    "CURRENT_SPEND:0.9",
    "CURRENT_SPEND:1",
    "FORECASTED_SPEND:1",
  ]);
  assert.deepEqual(budget.all_updates_rule ?? [], []);
  const binding = rows.get(bindingName);
  assert.equal(binding.project, input.project_id);
  assert.equal(binding.role, "roles/editor");
  assert.deepEqual(binding.members, []);
  assert.deepEqual(binding.condition ?? [], []);
  assert.deepEqual(sorted(Object.keys(plan.output_changes)), ["alerts_budget_resource_name", "cap_config"]);
  for (const change of Object.values(plan.output_changes)) {
    assert.deepEqual(change.actions, ["create"]);
    assert.equal(change.after_unknown, false);
    assert.equal(change.after_sensitive, true);
  }
  assert.equal(plan.output_changes.alerts_budget_resource_name.after, identity(input).budget);
  assert.deepEqual(plan.output_changes.cap_config.after, {
    schemaVersion: 1,
    billingAccountId: input.billing_account_id,
    projectNumber: identity(input).number,
    quotaProjectId: input.project_id,
    currencyCode: "USD",
  });
}
let calibration;
function calibratedPlans() {
  if (!calibration) calibration = mocked(calibratedSource());
  calibration.forEach((row, index) => planContract(row.plan, [defaults, alternate][index]));
  return calibration;
}

/** Replace one unique literal in disposable source; a missing or redundant control cannot silently succeed. */
function replace(source, file, before, after) {
  assert.notEqual(before, after);
  assert.equal(source[file].split(before).length, 2, "Mutation target must occur exactly once");
  return { ...source, [file]: source[file].replace(before, after) };
}
/** Mutate only the test-owned binding, never an identically worded original protection. */
function replaceBinding(source, before, after) {
  assert.equal(canonicalBinding.split(before).length, 2, "Binding mutation target must be unique");
  return replace(source, "main.tf", canonicalBinding, canonicalBinding.replace(before, after));
}
function refused(source, pattern) {
  assert.throws(
    () => sourceContract(source),
    (error) => error.code === "ERR_ASSERTION" && pattern.test(error.message),
  );
}

test("pinned tools run with isolated Terraform environment", () => {
  assert.equal(process.versions.node, "24.20.0");
  assert.equal(JSON.parse(terraform(workspace(), ["version", "-json"])).terraform_version, "1.13.3");
});
test("structural scanner distinguishes quoted/comment decoys and rejects unbalanced unsupported syntax", () => {
  const node = body(
    scan(
      'resource "test" "fixture" {\n value = "} prevent_destroy = true"\n # decoy\n lifecycle {\n prevent_destroy = false\n }\n}\n',
    ),
  )[0];
  assert.equal(
    expression(
      node.children.find((child) => child.kind === "block"),
      "prevent_destroy",
    ),
    "false",
  );
  for (const text of ['resource "a" "b" {', "value = [1,2)", "value = <<EOF\ntext\nEOF", 'value = "unterminated'])
    assert.throws(() => body(scan(text)));
});
test("canonical synthetic binding calibrates both Google mock aliases and two portable targets", () => {
  const plans = calibratedPlans();
  assert.equal(plans.length, 2);
});
test("actual source adds exactly the literal protected empty Editor binding", () => {
  sourceContract(sourceFiles());
});
test("actual source plans eight resources and two original sensitive outputs for both project targets", () => {
  const plans = mocked(sourceFiles());
  plans.forEach((row, index) => planContract(row.plan, [defaults, alternate][index]));
});
test("comments and formatting do not change frozen original resource semantics", () => {
  const source = calibratedSource();
  source["main.tf"] = "# New source purpose, with resource and backend decoys in this comment.\n" + source["main.tf"];
  source["versions.tf"] += "\n# Provider pins stay unchanged.\n";
  sourceContract(source);
});
test("binding controls reject another role, nonempty members, wrong reference and changed API dependency", () => {
  const source = calibratedSource();
  sourceContract(source);
  for (const [before, after, pattern] of [
    ['role = "roles/editor"', 'role = "roles/owner"', /only project Editor/],
    ["members = []", 'members = ["serviceAccount:synthetic@example.invalid"]', /literal empty member set/],
    ["project = google_project.application.project_id", "project = var.project_id", /owned project reference/],
    ["project = google_project.application.project_id", 'project = "synthetic-iam-123"', /owned project reference/],
    [
      'depends_on = [google_project_service.bootstrap["cloudresourcemanager.googleapis.com"]]',
      "depends_on = [google_project_service.service_usage]",
      /existing Resource Manager API/,
    ],
  ])
    refused(replace(source, "main.tf", before, after), pattern);
});
test("binding controls reject missing or false literal protection and all additional children", () => {
  const source = calibratedSource();
  sourceContract(source);
  refused(
    replaceBinding(source, "    prevent_destroy = true\n", "    prevent_destroy = false\n"),
    /literally prevent destroy/,
  );
  refused(replaceBinding(source, "    prevent_destroy = true\n", ""), /only its destruction guard/);
  for (const extra of [
    'condition {\n title = "conditional"\n expression = "true"\n}\n',
    "provider = google.budget\n",
    "count = 0\n",
    'provisioner "local-exec" {\n command = "false"\n}\n',
    'connection {\n host = "invalid"\n}\n',
  ])
    refused(
      replace(source, "main.tf", '  role = "roles/editor"\n', `  role = "roles/editor"\n${extra}`),
      /no conditions, provider overrides or executable additions/,
    );
});
test("extra managed scope or full project policy is rejected before provider initialization", () => {
  const source = calibratedSource();
  sourceContract(source);
  for (const extra of [
    'resource "google_project_iam_policy" "broad" {\n project = "synthetic"\n policy_data = "{}"\n}\n',
    'resource "google_project_iam_member" "extra" {\n project = "synthetic"\n role = "roles/owner"\n member = "allUsers"\n}\n',
    'resource "google_service_account_key" "extra" {\n service_account_id = "synthetic"\n}\n',
  ])
    refused({ ...source, "main.tf": source["main.tf"] + extra }, /Original seven resources are immutable/);
  refused({ ...source, "main.tf": source["main.tf"] + canonicalBinding }, /Exactly one/);
});
test("hidden backends, providers, modules, data and file execution escape the closed scope and are refused", () => {
  const source = calibratedSource();
  sourceContract(source);
  for (const extra of [
    'terraform {\n backend "gcs" {\n bucket = "forbidden"\n }\n}\n',
    'provider "google" {\n alias = "unmocked"\n}\n',
    'provider "external" {}\n',
    'module "extra" {\n source = "./forbidden"\n}\n',
    'data "external" "extra" {\n program = ["false"]\n}\n',
    'locals {\n secret = file("/forbidden")\n}\n',
  ])
    refused({ ...source, "main.tf": source["main.tf"] + extra }, /Only resource blocks/);
  refused(
    { ...source, "versions.tf": source["versions.tf"] + 'terraform { backend "gcs" { bucket = "forbidden" } }\n' },
    /Original versions.tf tokens/,
  );
  refused(replace(source, "main.tf", "members = []", 'members = [file("/forbidden")]'), /literal empty member set/);
  refused({ ...source, "override.tf": 'provider "google" {}' }, /Closed source file set/);
});
test("original budget, APIs, pins, variables and output expressions cannot drift in this IAM amendment", () => {
  const source = calibratedSource();
  sourceContract(source);
  for (const [file, before, after, pattern] of [
    ["main.tf", 'units         = "100"', 'units         = "101"', /Original seven resources/],
    [
      "main.tf",
      'credit_types_treatment = "EXCLUDE_ALL_CREDITS"',
      'credit_types_treatment = "INCLUDE_ALL_CREDITS"',
      /Original seven resources/,
    ],
    ["main.tf", "for_each = [0.5, 0.75, 0.9, 1.0]", "for_each = [0.5, 1.0]", /Original seven resources/],
    ["versions.tf", 'version = "8.6.0"', 'version = "8.7.0"', /Original versions.tf tokens/],
    [
      "versions.tf",
      'alias                 = "budget"',
      'alias                 = "other"',
      /Original versions.tf tokens/,
    ],
    ["variables.tf", "type        = bool", "type        = string", /Original variables.tf tokens/],
    [
      "outputs.tf",
      "value       = google_billing_budget.application_total.id",
      'value       = "invented"',
      /Original outputs.tf tokens/,
    ],
  ])
    refused(replace(source, file, before, after), pattern);
  refused({ ...source, ".terraform.lock.hcl": source[".terraform.lock.hcl"] + "\n" }, /Original provider lock/);
});
test("independent complete plan oracle rejects extra scope and altered IAM, cost, API and output values", () => {
  const good = calibratedPlans()[0].plan;
  planContract(good, defaults);
  const changes = [
    (plan) => {
      plan.resource_changes.push(structuredClone(plan.resource_changes[0]));
    },
    (plan) => {
      plan.resource_changes.find((row) => row.address === bindingName).change.after.role = "roles/owner";
    },
    (plan) => {
      plan.resource_changes.find((row) => row.address === bindingName).change.after.members = ["allUsers"];
    },
    (plan) => {
      plan.resource_changes.find((row) => row.address === bindingName).change.after.project = alternate.project_id;
    },
    (plan) => {
      plan.resource_changes.find((row) => row.address === bindingName).change.after.condition = [
        { title: "x", expression: "true" },
      ];
    },
    (plan) => {
      plan.resource_changes.find(
        (row) => row.address === "google_billing_budget.application_total",
      ).change.after.amount[0].specified_amount[0].units = "101";
    },
    (plan) => {
      plan.resource_changes.find(
        (row) => row.address === "google_project_service.service_usage",
      ).change.after.disable_on_destroy = true;
    },
    (plan) => {
      plan.output_changes.cap_config.after_sensitive = false;
    },
    (plan) => {
      plan.output_changes.cap_config.after.projectNumber = "123450000002";
    },
  ];
  for (const change of changes) {
    const plan = structuredClone(good);
    change(plan);
    assert.throws(() => planContract(plan, defaults), { code: "ERR_ASSERTION" });
  }
});
