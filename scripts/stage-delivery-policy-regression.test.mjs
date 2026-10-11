// Independent regressions for the accepted V1 scaling and immutable-image review findings.
// Uses a copied literal fixture from the frozen policy expectations; no provider or controller is executed.
// Run: node --test scripts/stage-delivery-policy-regression.test.mjs.
import assert from "node:assert/strict";
import test from "node:test";
import { requireStagePlan } from "./stage-delivery-policy.mjs";
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

const check = (value) => requireStagePlan(value, config(), images, revision);

test("automatic scaling and no base-image enrollment accept provider omitted and default forms", () => {
  check(plan(true));
  for (const mode of [undefined, null, "", "AUTOMATIC"])
    for (const count of [undefined, null, 0])
      for (const base of [undefined, null, ""]) {
        const value = plan(true);
        for (const side of ["before", "after"]) {
          const service = value.resource_changes[0].change[side];
          if (mode !== undefined) service.scaling[0].scaling_mode = mode;
          if (count !== undefined) service.scaling[0].manual_instance_count = count;
          for (const container of service.template[0].containers)
            if (base !== undefined) container.base_image_uri = base;
        }
        check(value);
      }
});

test("both observed and planned service reject manual scaling despite preserved min and max", () => {
  check(plan(true));
  for (const side of ["before", "after"])
    for (const addition of [
      { scaling_mode: "MANUAL" },
      { manual_instance_count: 1 },
      { scaling_mode: "MANUAL", manual_instance_count: 100 },
    ]) {
      const value = plan(true);
      Object.assign(value.resource_changes[0].change[side].scaling[0], addition);
      assert.throws(() => check(value), `${side}: ${JSON.stringify(addition)}`);
    }
});

test("both observed and planned containers reject automatic base-image enrollment despite digest pins", () => {
  check(plan(true));
  for (const side of ["before", "after"])
    for (const index of [0, 1]) {
      const value = plan(true);
      value.resource_changes[0].change[side].template[0].containers[index].base_image_uri =
        "us-central1-docker.pkg.dev/synthetic-stage-123/mp3-images/base:stable";
      assert.throws(() => check(value), `${side} container ${index}`);
    }
});

// Cloud Run IAM state uses a fully qualified service name; both accepted representations must name this exact target.
test("stage IAM names accept the trusted full resource on both sides and retain short-name compatibility", () => {
  for (const update of [false, true]) {
    check(plan(update));
    const value = plan(update);
    for (const row of value.resource_changes.slice(1))
      for (const side of ["before", "after"]) row.change[side].name = resource;
    check(value);
  }
});

test("stage IAM names reject coherent foreign full names rather than trusting the final basename", () => {
  check(plan());
  for (const index of [1, 2])
    for (const name of [
      "projects/foreign-project/locations/us-central1/services/mp3-stage",
      "projects/synthetic-stage-123/locations/europe-west1/services/mp3-stage",
      "projects/synthetic-stage-123/locations/us-central1/services/mp3-production",
      `${resource}-other`,
      `${resource}/../mp3-stage`,
      `https://run.googleapis.com/v2/${resource}`,
    ]) {
      const value = plan();
      for (const side of ["before", "after"]) value.resource_changes[index].change[side].name = name;
      assert.deepEqual(value.resource_changes[index].change.before, value.resource_changes[index].change.after);
      assert.throws(() => check(value), `IAM row ${index}: ${name}`);
    }
});

test("stage IAM name changes on either side remain refused by the unchanged membership/no-op guard", () => {
  check(plan());
  for (const index of [1, 2])
    for (const side of ["before", "after"])
      for (const name of [
        "projects/foreign-project/locations/us-central1/services/mp3-stage",
        "projects/synthetic-stage-123/locations/europe-west1/services/mp3-stage",
        "projects/synthetic-stage-123/locations/us-central1/services/mp3-production",
        `${resource}-other`,
      ]) {
        const value = plan();
        value.resource_changes[index].change[side].name = name;
        assert.throws(() => check(value), `IAM row ${index} ${side}: ${name}`);
      }
});
