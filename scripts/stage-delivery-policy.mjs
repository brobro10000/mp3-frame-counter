/**
 * Constrain automated stage inputs and saved Terraform updates to the reviewed, existing authenticated service.
 * Import parseStageConfig(parsedJSON), requireStagePlan(plan, config, images, sourceRevision), or
 * requireStageServingRevision(service, resourceId). All are pure:
 * no environment, network, credentials, Terraform execution or caller mutation. Invalid data throws synchronously.
 * A passing plan permits only a source/image update or a genuine no-op; live identity, cost and approval remain
 * controller duties. Initial creation and every production deployment are outside this automatic boundary.
 */
import assert from "node:assert/strict";

const sorted = (values) => [...values].sort();
function closed(value, fields) {
  assert(value && typeof value === "object" && !Array.isArray(value));
  assert.deepEqual(sorted(Object.keys(value)), sorted(fields));
}
function text(value, pattern) {
  assert(typeof value === "string" && value.length <= 4096 && pattern.exec(value)?.[0] === value);
}
function empty(value) {
  assert(value === undefined || value === null || (Array.isArray(value) && value.length === 0));
}
function singleton(value) {
  assert(Array.isArray(value) && value.length === 1);
  return value[0];
}
function origin(value) {
  const parsed = new URL(value);
  assert.equal(value, parsed.origin);
  assert.equal(parsed.protocol, "https:");
  assert(parsed.hostname.startsWith("mp3-stage-") && parsed.hostname.endsWith(".run.app"));
}

/** Bind a short observed traffic name to the full readiness ID within the trusted stage service namespace. */
export function requireStageServingRevision(service, resourceId) {
  text(resourceId, /^projects\/[a-z][a-z0-9-]+\/locations\/[a-z0-9-]+\/services\/mp3-stage$/);
  assert.equal(service.name, resourceId);
  const revisionId = service.latestReadyRevision;
  assert.equal(revisionId, service.latestCreatedRevision);
  assert(typeof revisionId === "string" && revisionId.startsWith(`${resourceId}/revisions/`));
  const revisionName = revisionId.slice(`${resourceId}/revisions/`.length);
  text(revisionName, /^mp3-stage-[a-z0-9-]+$/);
  const traffic = singleton(service.trafficStatuses);
  // Cloud Run returns traffic's revision name, while latestReadyRevision contains the complete resource path.
  assert.equal(traffic.revision, revisionName);
  assert.equal(traffic.type, "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST");
  assert.equal(traffic.percent, 100);
  assert([undefined, ""].includes(traffic.tag));
  return revisionId;
}

/** Accept only the fixed dedicated project, stage backend, main-push provider and two distinct retained cost controls. */
export function parseStageConfig(value) {
  closed(value, [
    "schemaVersion",
    "projectId",
    "projectNumber",
    "region",
    "registryId",
    "workloadIdentityProvider",
    "stageStateBucket",
    "stageStatePrefix",
    "cap",
    "alertBudget",
  ]);
  assert.equal(value.schemaVersion, 1);
  text(value.projectId, /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/);
  text(value.projectNumber, /^[1-9][0-9]{0,19}$/);
  text(value.region, /^[a-z]+(-[a-z]+)+[0-9]+$/);
  text(value.registryId, /^[a-z]([a-z0-9-]{0,61}[a-z0-9])?$/);
  assert.equal(
    value.workloadIdentityProvider,
    `projects/${value.projectNumber}/locations/global/workloadIdentityPools/mp3-github/providers/github`,
  );
  assert.equal(value.stageStateBucket, `${value.projectId}-tf-stage`);
  assert.equal(value.stageStatePrefix, "runtime");
  closed(value.cap, [
    "schemaVersion",
    "billingAccountId",
    "projectNumber",
    "quotaProjectId",
    "currencyCode",
    "resourceName",
  ]);
  assert.equal(value.cap.schemaVersion, 1);
  text(value.cap.billingAccountId, /^[A-F0-9]{6}-[A-F0-9]{6}-[A-F0-9]{6}$/);
  assert.equal(value.cap.projectNumber, value.projectNumber);
  assert.equal(value.cap.quotaProjectId, value.projectId);
  assert.equal(value.cap.currencyCode, "USD");
  const budget = new RegExp(`^billingAccounts/${value.cap.billingAccountId}/budgets/[A-Za-z0-9-]{1,128}$`);
  text(value.cap.resourceName, budget);
  text(value.alertBudget, budget);
  assert.notEqual(value.alertBudget, value.cap.resourceName);
  return structuredClone(value);
}

/** Full image references are role-specific immutable registry identities, never tags or foreign registries. */
function imagePair(images, config) {
  closed(images, ["api", "frontend"]);
  for (const role of ["api", "frontend"]) {
    const prefix = `${config.region}-docker.pkg.dev/${config.projectId}/${config.registryId}/${role}@`;
    assert(typeof images[role] === "string" && images[role].startsWith(prefix));
    text(images[role].slice(prefix.length), /^sha256:[a-f0-9]{64}$/);
  }
}

/** Validate material service settings on both sides; source/image changes cannot conceal runtime or access changes. */
function service(value, config, images, source) {
  assert(value && typeof value === "object");
  text(source, /^[a-f0-9]{40}$/);
  imagePair(images, config);
  assert.equal(value.project, config.projectId);
  assert.equal(value.location, config.region);
  assert.equal(value.name, "mp3-stage");
  assert.equal(value.id, `projects/${config.projectId}/locations/${config.region}/services/mp3-stage`);
  origin(value.uri);
  assert.equal(value.deletion_protection, true);
  assert.equal(value.ingress, "INGRESS_TRAFFIC_ALL");
  assert.equal(value.invoker_iam_disabled, false);
  assert.equal(value.default_uri_disabled, false);
  assert.deepEqual(value.labels, { application: "mp3-frame-counter", environment: "stage", source_revision: source });
  assert.deepEqual(value.annotations ?? {}, {});
  for (const key of ["custom_audiences", "build_config", "multi_region_settings", "binary_authorization"])
    empty(value[key]);
  const scaling = singleton(value.scaling);
  assert.equal(scaling.max_instance_count, 1);
  assert([undefined, null, "", "AUTOMATIC"].includes(scaling.scaling_mode));
  assert([undefined, null, 0].includes(scaling.manual_instance_count));
  assert([undefined, null, 0].includes(scaling.min_instance_count));
  const template = singleton(value.template);
  assert.equal(template.service_account, `mp3-stage-runtime@${config.projectId}.iam.gserviceaccount.com`);
  assert.equal(template.execution_environment, "EXECUTION_ENVIRONMENT_GEN2");
  assert.equal(template.timeout, "60s");
  assert.equal(template.max_instance_request_concurrency, 2);
  assert.deepEqual(template.labels ?? {}, {});
  assert.deepEqual(template.annotations ?? {}, {});
  const instances = singleton(template.scaling);
  assert.equal(instances.min_instance_count, 0);
  assert.equal(instances.max_instance_count, 1);
  for (const key of ["volumes", "vpc_access", "node_selector", "sandboxes", "workload_identity_config"])
    empty(template[key]);
  assert(Array.isArray(template.containers) && template.containers.length === 2);
  assert.deepEqual(sorted(template.containers.map((row) => row.name)), ["api", "frontend"]);
  for (const role of ["api", "frontend"]) {
    const container = template.containers.find((row) => row.name === role);
    assert.equal(container.image, images[role]);
    assert([undefined, null, ""].includes(container.base_image_uri));
    for (const key of ["command", "args", "volume_mounts", "liveness_probe", "readiness_probe"]) empty(container[key]);
    const resources = singleton(container.resources);
    assert.deepEqual(resources.limits, { cpu: "1", memory: "512Mi" });
    assert.equal(resources.cpu_idle, true);
    assert.equal(resources.startup_cpu_boost, false);
    assert.deepEqual(container.depends_on ?? [], role === "frontend" ? ["api"] : []);
    assert.deepEqual(container.ports ?? [], role === "frontend" ? [{ name: "http1", container_port: 8080 }] : []);
    const env = (container.env ?? []).map((entry) => {
      empty(entry.value_source);
      return { name: entry.name, value: entry.value };
    });
    assert.deepEqual(env, role === "frontend" ? [{ name: "API_UPSTREAM", value: "127.0.0.1:3000" }] : []);
    const probe = singleton(container.startup_probe);
    assert.equal(probe.period_seconds, 10);
    assert.equal(probe.timeout_seconds, 2);
    assert.equal(probe.failure_threshold, 6);
    const http = singleton(probe.http_get);
    assert.equal(http.path, "/healthz");
    assert.equal(http.port, role === "api" ? 3000 : 8080);
    empty(http.http_headers);
    empty(probe.tcp_socket);
    empty(probe.grpc);
  }
  const traffic = singleton(value.traffic);
  assert.equal(traffic.type, "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST");
  assert.equal(traffic.percent, 100);
  assert([undefined, null, ""].includes(traffic.tag));
  assert([undefined, null, ""].includes(traffic.revision));
}

/** Ignore only computed observation fields; an unknown execution, image or identity field cannot authorize apply. */
function knownConfiguration(unknown) {
  assert(unknown && typeof unknown === "object" && !Array.isArray(unknown));
  const computed = new Set([
    "etag",
    "uid",
    "generation",
    "observed_generation",
    "create_time",
    "update_time",
    "delete_time",
    "expire_time",
    "creator",
    "last_modifier",
    "reconciling",
    "conditions",
    "terminal_condition",
    "latest_ready_revision",
    "latest_created_revision",
    "traffic_statuses",
    "effective_labels",
    "terraform_labels",
  ]);
  function containsUnknown(value) {
    return value === true || (value && typeof value === "object" && Object.values(value).some(containsUnknown));
  }
  for (const [key, value] of Object.entries(unknown)) assert(computed.has(key) || !containsUnknown(value));
}

/** Require exactly the existing service and its two unchanged grants; automation cannot bootstrap or broaden IAM. */
export function requireStagePlan(plan, input, images, sourceRevision) {
  const config = parseStageConfig(input);
  imagePair(images, config);
  text(sourceRevision, /^[a-f0-9]{40}$/);
  assert.equal(plan.terraform_version, "1.13.3");
  assert.equal(plan.complete, true);
  assert.equal(plan.errored, false);
  empty(plan.resource_drift);
  const expectedAddresses = [
    "google_cloud_run_v2_service.application",
    "google_cloud_run_v2_service_iam_member.probe_invoker",
    "google_cloud_run_v2_service_iam_member.stage_admin[0]",
  ];
  assert(Array.isArray(plan.resource_changes));
  assert.deepEqual(sorted(plan.resource_changes.map((row) => row.address)), sorted(expectedAddresses));
  let changed = false,
    active;
  for (const row of plan.resource_changes) {
    assert.equal(row.mode, "managed");
    assert.equal(row.provider_name, "registry.terraform.io/hashicorp/google");
    assert.equal(row.type, row.address.split(".")[0]);
    assert(!row.previous_address && !row.change.importing);
    empty(row.change.replace_paths);
    const { change } = row;
    assert(change.before && change.after);
    knownConfiguration(change.after_unknown ?? {});
    if (row.address === expectedAddresses[0]) {
      assert(change.actions.length === 1 && ["no-op", "update"].includes(change.actions[0]));
      changed = change.actions[0] === "update";
      const oldImages = Object.fromEntries(singleton(change.before.template).containers.map((c) => [c.name, c.image]));
      service(change.before, config, oldImages, change.before.labels?.source_revision);
      service(change.after, config, images, sourceRevision);
      assert.equal(change.before.uri, change.after.uri);
      active = change.after;
    } else {
      assert.deepEqual(change.actions, ["no-op"]);
      assert.deepEqual(change.before, change.after);
      const probe = row.address === expectedAddresses[1];
      const grant = change.after;
      assert.equal(grant.project, config.projectId);
      assert.equal(grant.location, config.region);
      // Terraform's IAM member readback uses the full service name; older fixtures use its short name.
      assert(
        ["mp3-stage", `projects/${config.projectId}/locations/${config.region}/services/mp3-stage`].includes(
          grant.name,
        ),
      );
      assert.equal(grant.role, probe ? "roles/run.invoker" : "roles/run.admin");
      assert.equal(
        grant.member,
        `serviceAccount:mp3-stage-${probe ? "probe" : "deployer"}@${config.projectId}.iam.gserviceaccount.com`,
      );
      empty(grant.condition);
    }
    if (change.actions[0] === "no-op") assert.deepEqual(change.before, change.after);
  }
  assert.equal(plan.applyable, changed);
  const outputs = {
    service_name: "mp3-stage",
    service_resource_id: active.id,
    service_uri: active.uri,
    runtime_service_account: `mp3-stage-runtime@${config.projectId}.iam.gserviceaccount.com`,
    configured_images: images,
  };
  closed(plan.output_changes, Object.keys(outputs));
  for (const [name, expected] of Object.entries(outputs)) {
    const change = plan.output_changes[name];
    assert.equal(change.after_unknown, false);
    assert.equal(change.after_sensitive, false);
    assert.equal(change.before_sensitive, false);
    assert.deepEqual(change.after, expected);
    assert(
      change.actions.length === 1 &&
        ["no-op", ...(changed && name === "configured_images" ? ["update"] : [])].includes(change.actions[0]),
    );
    if (change.actions[0] === "no-op") assert.deepEqual(change.before, change.after);
  }
}
