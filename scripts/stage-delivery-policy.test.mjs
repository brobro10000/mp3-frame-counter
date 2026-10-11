// Independent parsed stage config and existing-only plan expectations; literals only, no provider or subprocess.
// Run: node --test scripts/stage-delivery-policy.test.mjs. Missing implementation is availability red.
// No actual cloud identity or credential is supplied.
import assert from "node:assert/strict";
import test from "node:test";
let api;
try {
  api = await import("./stage-delivery-policy.mjs");
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND" || !error.message.includes("stage-delivery-policy.mjs")) throw error;
}
const revision = "c".repeat(40);
const registry = "us-central1-docker.pkg.dev/synthetic-stage-123/mp3-images";
const images = {
  api: `${registry}/api@sha256:${"a".repeat(64)}`,
  frontend: `${registry}/frontend@sha256:${"b".repeat(64)}`,
};
const resource = "projects/synthetic-stage-123/locations/us-central1/services/mp3-stage";
const uri = "https://mp3-stage-123456789012.us-central1.run.app";
const runtime = "mp3-stage-runtime@synthetic-stage-123.iam.gserviceaccount.com";
function config() {
  return JSON.parse(`{
 "schemaVersion":1,"projectId":"synthetic-stage-123","projectNumber":"123456789012","region":"us-central1",
    "registryId":"mp3-images","stageStateBucket":"synthetic-stage-123-tf-stage","stageStatePrefix":"runtime",
    "workloadIdentityProvider":"projects/123456789012/locations/global/workloadIdentityPools/mp3-github/providers/github",
    "cap":{"schemaVersion":1,"billingAccountId":"ABCDEF-123456-ABCDEF","projectNumber":"123456789012", "quotaProjectId":"synthetic-stage-123","currencyCode":"USD",
      "resourceName":"billingAccounts/ABCDEF-123456-ABCDEF/budgets/synthetic-cap"}, "alertBudget":"billingAccounts/ABCDEF-123456-ABCDEF/budgets/synthetic-alert"}`);
}
// Keep the literal parsed plan fixture compact and separate from its refusal matrices.
// prettier-ignore
function plan(update = false) {
  const value = JSON.parse(`{
 "format_version":"1.2","terraform_version":"1.13.3","complete":true,"applyable":false,"errored":false, "resource_drift":[],"resource_changes":[
      {"address":"google_cloud_run_v2_service.application","mode":"managed","type":"google_cloud_run_v2_service",
       "provider_name":"registry.terraform.io/hashicorp/google","change":{"actions":["no-op"],"after":{
        "id":"${resource}","uri":"${uri}","project":"synthetic-stage-123","location":"us-central1","name":"mp3-stage",
        "deletion_protection":true,"ingress":"INGRESS_TRAFFIC_ALL","invoker_iam_disabled":false,"default_uri_disabled":false,
        "labels":{"application":"mp3-frame-counter","environment":"stage","source_revision":"${revision}"}, "scaling":[{"min_instance_count":0,"max_instance_count":1}],"template":[{
          "service_account":"${runtime}","execution_environment":"EXECUTION_ENVIRONMENT_GEN2","timeout":"60s",
          "max_instance_request_concurrency":2,"scaling":[{"min_instance_count":0,"max_instance_count":1}],"containers":[
            {"name":"api","image":"${images.api}","resources":[{"limits":{"cpu":"1","memory":"512Mi"},
              "cpu_idle":true,"startup_cpu_boost":false}],"startup_probe":[{"period_seconds":10,"timeout_seconds":2, "failure_threshold":6,"http_get":[{"path":"/healthz","port":3000}]}]},
            {"name":"frontend","image":"${images.frontend}","resources":[{"limits":{"cpu":"1","memory":"512Mi"},
              "cpu_idle":true,"startup_cpu_boost":false}],"startup_probe":[{"period_seconds":10,"timeout_seconds":2,
              "failure_threshold":6,"http_get":[{"path":"/healthz","port":8080}]}],"depends_on":["api"],
              "env":[{"name":"API_UPSTREAM","value":"127.0.0.1:3000"}],"ports":[{"name":"http1","container_port":8080}]}]}],
        "traffic":[{"type":"TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST","percent":100}]}}}, {"address":"google_cloud_run_v2_service_iam_member.probe_invoker","mode":"managed",
       "type":"google_cloud_run_v2_service_iam_member","provider_name":"registry.terraform.io/hashicorp/google",
       "change":{"actions":["no-op"],"after":{"project":"synthetic-stage-123","location":"us-central1","name":"mp3-stage",
       "role":"roles/run.invoker","member":"serviceAccount:mp3-stage-probe@synthetic-stage-123.iam.gserviceaccount.com"}}},
      {"address":"google_cloud_run_v2_service_iam_member.stage_admin[0]","mode":"managed", "type":"google_cloud_run_v2_service_iam_member","provider_name":"registry.terraform.io/hashicorp/google",
       "change":{"actions":["no-op"],"after":{"project":"synthetic-stage-123","location":"us-central1","name":"mp3-stage",
       "role":"roles/run.admin","member":"serviceAccount:mp3-stage-deployer@synthetic-stage-123.iam.gserviceaccount.com"}}} ],"output_changes":{}}`);
  for (const { change } of value.resource_changes) {
    Object.assign(change, {before: structuredClone(change.after), after_unknown: {}, before_sensitive: {}, after_sensitive: {}});
  }
  const outputs = {service_name: "mp3-stage", service_resource_id: resource, service_uri: uri,
    runtime_service_account: runtime, configured_images: images};
  for (const [key, after] of Object.entries(outputs)) {
    value.output_changes[key] = {actions:["no-op"], before:structuredClone(after), after:structuredClone(after),
      after_unknown:false, before_sensitive:false, after_sensitive:false};
  }
  if (update) {
    value.applyable = true;
    const change = value.resource_changes[0].change;
    change.actions = ["update"];
    change.before.labels.source_revision = "f".repeat(40);
    change.before.template[0].containers.forEach((container, i) => {
      container.image = `${registry}/${container.name}@sha256:${(i ? "e" : "d").repeat(64)}`;
      value.output_changes.configured_images.before[container.name] = container.image;
    });
    value.output_changes.configured_images.actions = ["update"];
  }
  return value;
}
function available(name) {
  assert.equal(typeof api?.[name], "function", `Missing implemented ${name}`);
  return api[name];
}
function set(value, path, replacement) {
  const parts = path.split(".");
  const key = parts.pop();
  let target = value;
  for (const part of parts) target = target[part];
  target[key] = replacement;
}
function refuseConfig(cases) {
  const parse = available("parseStageConfig");
  assert.deepEqual(parse(config()), config());
  for (const [path, value] of cases) {
    const bad = config();
    set(bad, path, value);
    const before = structuredClone(bad);
    assert.throws(() => parse(bad), path);
    assert.deepEqual(bad, before);
  }
}
function refusePlans(cases) {
  const check = available("requireStagePlan");
  check(plan(true), config(), images, revision);
  for (const [path, value] of cases) {
    const bad = plan(true);
    set(bad, path, value);
    const before = structuredClone(bad);
    assert.throws(() => check(bad, config(), images, revision), path);
    assert.deepEqual(bad, before);
  }
}
const after = "resource_changes.0.change.after",
  before = "resource_changes.0.change.before";
test("literal fixtures distinguish genuine no-op from update without implementation output", () => {
  const noOp = plan(),
    update = plan(true);
  assert.deepEqual([noOp.resource_changes.length, Object.keys(noOp.output_changes).length], [3, 5]);
  assert(noOp.resource_changes.every((r) => JSON.stringify(r.change.before) === JSON.stringify(r.change.after)));
  assert.equal(noOp.applyable, false);
  assert.equal(update.applyable, true);
  assert.notDeepEqual(update.resource_changes[0].change.before, update.resource_changes[0].change.after);
});
test("configuration returns a detached normalized copy without changing mutable input", () => {
  const parse = available("parseStageConfig"),
    value = config(),
    original = structuredClone(value),
    result = parse(value);
  assert.deepEqual(result, original);
  assert.notEqual(result, value);
  assert.notEqual(result.cap, value.cap);
  assert.deepEqual(value, original);
  assert.equal(Object.isFrozen(value), false);
  assert.equal(Object.isFrozen(value.cap), false);
  assert.notEqual(parse(value), result);
});
test("configuration is closed at root and cap and rejects missing required fields or wrong containers", () => {
  const parse = available("parseStageConfig");
  parse(config());
  for (const path of ["", "cap"])
    for (const field of Object.keys(path ? config().cap : config())) {
      const bad = config();
      delete (path ? bad.cap : bad)[field];
      assert.throws(() => parse(bad), `${path}.${field}`);
    }
  for (const path of ["", "cap"]) {
    const bad = config();
    (path ? bad.cap : bad).token = "synthetic-not-credential";
    assert.throws(() => parse(bad));
  }
  for (const bad of [null, [], "config"]) assert.throws(() => parse(bad));
  refuseConfig([
    ["cap", null],
    ["schemaVersion", 2],
    ["cap.schemaVersion", 2],
    ["target", "https://foreign.invalid"],
  ]);
});
test("configuration validates finite exact identifiers without selectors, control text or foreign scopes", () => {
  const paths =
    "projectId projectNumber region registryId workloadIdentityProvider stageStateBucket stageStatePrefix alertBudget cap.billingAccountId cap.projectNumber cap.quotaProjectId cap.currencyCode cap.resourceName".split(
      " ",
    );
  const good = config();
  const get = (path) => path.split(".").reduce((v, k) => v[k], good);
  refuseConfig(
    paths.flatMap((path) => [
      [path, ""],
      [path, null],
      [path, get(path) + "\n"],
      [path, "x".repeat(4097)],
    ]),
  );
  refuseConfig([
    ["projectId", "bad/project"],
    ["projectNumber", "0"],
    ["region", "us-central1-a"],
    ["registryId", "Upper"],
    ["stageStatePrefix", "runtime/production"],
    ["cap.currencyCode", "EUR"],
  ]);
});
test("WIF, state and both distinct cost identities must bind the same explicit project and billing account", () => {
  refuseConfig([
    ["workloadIdentityProvider", config().workloadIdentityProvider.replace("123456789012", "999999999999")],
    ["workloadIdentityProvider", config().workloadIdentityProvider.replace("/github", "/other")],
    ["stageStateBucket", "foreign-project-tf-stage"],
    ["stageStateBucket", "synthetic-stage-123-tf-production"],
    ["cap.projectNumber", "999999999999"],
    ["cap.quotaProjectId", "foreign-project"],
    ["cap.resourceName", "billingAccounts/111111-222222-333333/budgets/cap"],
    ["alertBudget", config().cap.resourceName],
    ["alertBudget", "billingAccounts/111111-222222-333333/budgets/alert"],
  ]);
});
test("existing service no-op and update are valid and never mutate caller plans or identities", () => {
  const check = available("requireStagePlan");
  for (const update of [false, true]) {
    const value = plan(update),
      c = config(),
      i = structuredClone(images),
      snapshot = structuredClone({ value, c, i });
    check(value, c, i, revision);
    assert.deepEqual({ value, c, i }, snapshot);
  }
});
test("plan flags, drift and action boundary exclude initial create, import, replacement, delete and IAM changes", () => {
  refusePlans([
    ["terraform_version", "1.14.0"],
    ["complete", false],
    ["errored", true],
    ["applyable", false],
    ["resource_drift", [{ address: "google_cloud_run_v2_service.application" }]],
    ["resource_changes", []],
    ["resource_changes.0.change.actions", ["create"]],
    ["resource_changes.0.change.actions", ["delete", "create"]],
    ["resource_changes.0.change.actions", ["delete"]],
    ["resource_changes.0.change.before", null],
    ["resource_changes.0.change.importing", { id: resource }],
    ["resource_changes.1.change.actions", ["update"]],
    ["resource_changes.2.change.actions", ["create"]],
    ["resource_changes.0.provider_name", "foreign/provider"],
    ["resource_changes.0.change.after_unknown", { template: [{ containers: [{ image: true }] }] }],
  ]);
  const check = available("requireStagePlan");
  for (const changed of [true, false]) {
    const bad = plan();
    if (changed) bad.applyable = true;
    else bad.output_changes.service_name.after = "different";
    assert.throws(() => check(bad, config(), images, revision));
  }
  for (const extra of [
    plan(true).resource_changes[0],
    { ...plan(true).resource_changes[1], address: "google_project_iam_member.owner" },
  ]) {
    const bad = plan(true);
    bad.resource_changes.push(extra);
    assert.throws(() => check(bad, config(), images, revision));
  }
});
test("before and after retain existing stage identity, authenticated invocation and exact image/source binding", () => {
  const bad = [
    ["project", "foreign-project"],
    ["location", "europe-west1"],
    ["name", "mp3-production"],
    ["invoker_iam_disabled", true],
    ["template.0.service_account", "default@foreign.iam.gserviceaccount.com"],
  ];
  refusePlans([
    ...[before, after].flatMap((prefix) => bad.map(([path, value]) => [`${prefix}.${path}`, value])),
    [`${after}.id`, "projects/foreign-project/locations/us-central1/services/mp3-stage"],
    [`${after}.labels.source_revision`, "d".repeat(40)],
    [`${after}.template.0.containers.0.image`, `${registry}/api:latest`],
    [`${after}.template.0.containers.1.image`, images.api],
    ["resource_changes.1.change.after.member", "allUsers"],
    ["resource_changes.1.change.after.role", "roles/run.admin"],
    [
      "resource_changes.2.change.after.member",
      "serviceAccount:mp3-prod-deployer@synthetic-stage-123.iam.gserviceaccount.com",
    ],
  ]);
  const check = available("requireStagePlan");
  for (const supplied of [
    { ...images, api: `${registry}/api:latest` },
    { ...images, frontend: images.frontend.replace("synthetic-stage-123", "foreign-project") },
    { ...images, extra: images.api },
  ])
    assert.throws(() => check(plan(true), config(), supplied, revision));
  for (const source of ["", "c".repeat(39), revision + "\n"])
    assert.throws(() => check(plan(true), config(), images, source));
});
test("planned runtime preserves protections, cost limits, same-origin topology and complete traffic", () => {
  refusePlans([
    [`${after}.deletion_protection`, false],
    [`${after}.default_uri_disabled`, true],
    [`${after}.scaling.0.max_instance_count`, 2],
    [`${after}.template.0.timeout`, "3600s"],
    [`${after}.template.0.max_instance_request_concurrency`, 80],
    [`${after}.template.0.scaling.0.min_instance_count`, 1],
    [`${after}.template.0.containers.0.resources.0.limits.cpu`, "2"],
    [`${after}.template.0.containers.1.resources.0.limits.memory`, "1Gi"],
    [`${after}.template.0.containers.0.resources.0.startup_cpu_boost`, true],
    [`${after}.template.0.containers.1.env.0.value`, "foreign.invalid:3000"],
    [`${after}.traffic.0.percent`, 50],
    [`${after}.template.0.containers.0.command`, ["sh", "-c", "unreviewed"]],
    [`${after}.template.0.volumes`, [{ name: "secret" }]],
  ]);
});
test("exact five outputs match known nonsensitive service, runtime and image identities", () => {
  refusePlans([
    ["output_changes", {}],
    ["output_changes.service_uri.after", "https://foreign.invalid"],
    ["output_changes.service_name.after", "mp3-production"],
    ["output_changes.service_resource_id.after", "foreign"],
    ["output_changes.runtime_service_account.after", "foreign"],
    ["output_changes.configured_images.after.api", images.frontend],
    ["output_changes.service_uri.after_sensitive", true],
    ["output_changes.service_uri.after_unknown", true],
    [
      "output_changes.extra",
      { actions: ["no-op"], before: "extra", after: "extra", after_sensitive: false, after_unknown: false },
    ],
  ]);
});
