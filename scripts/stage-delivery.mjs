/**
 * Deliver the exact published main-push image pair to an existing authenticated stage service.
 * Usage: node scripts/stage-delivery.mjs verify|push|deploy, in the trusted source checkout and fixed CI job.
 * Inputs are the same-run bundle, independent admission output, closed repository configuration and step-scoped tokens.
 * Verify performs GitHub reads; push transfers existing images; deploy applies only a reviewed existing-service update
 * and runs the frozen stage suite. There is no bootstrap, arbitrary destination, production or rebuild operation.
 * Only sanitized identity evidence enters .artifacts/stage. Credentials, Docker configuration, plans and Terraform
 * state remain in memory/private temporary storage, cleaned on every path. Failures stop progression with fixed errors.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  accessSync,
  appendFileSync,
  constants,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  closeSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { githubApi } from "./publish-release.mjs";
import {
  publicationContext,
  publicationMaterial,
  requireMatchingAsset,
  requireObservedChecks,
  requireReleaseMetadata,
  verifyReleaseBundle,
} from "./publish-release-evidence.mjs";
import { canonical } from "./release-manifest.mjs";
import { readRequiredAcceptanceProfileProjection } from "./acceptance-profile-source.mjs";
import { inspectCap, renderDesiredCap } from "../infra/cloud/bootstrap/cap-reconciler.mjs";
import { parseStageConfig, requireStagePlan, requireStageServingRevision } from "./stage-delivery-policy.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const evidenceDirectory = join(root, ".artifacts", "stage");
const bundleDirectory = join(root, ".artifacts", "release-input");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const roles = ["api", "frontend"];
const interrupted = new AbortController();
let credentials;
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => interrupted.abort());

/** Reject symlink traversal and nonregular or oversized records before reading fixed checkout-owned inputs. */
function file(path, maximum = 2 * 1024 * 1024) {
  const absolute = resolve(path);
  assert(absolute.startsWith(`${root}${sep}`));
  let current = root;
  for (const part of absolute.slice(root.length + 1).split(sep)) {
    current = join(current, part);
    assert(!lstatSync(current).isSymbolicLink());
  }
  const stat = lstatSync(absolute);
  assert(stat.isFile() && stat.size <= maximum);
  const bytes = readFileSync(absolute);
  assert(bytes.length <= maximum);
  return bytes;
}

/** Write only fixed sanitized records, refusing a conflicting record left by another source or partial execution. */
function record(name, value) {
  assert(/^[a-z-]+\.json$/.test(name));
  const bytes = `${JSON.stringify(value, null, 2)}\n`;
  const path = join(evidenceDirectory, name);
  if (existsSync(path)) assert.equal(file(path).toString(), bytes);
  else writeFileSync(path, bytes, { flag: "wx", mode: 0o600 });
}

/** Construct a finite subprocess environment without inherited credentials, proxies, tracing or executable hooks. */
function childEnvironment(home, extra = {}) {
  return {
    PATH: `${dirname(process.execPath)}:/usr/local/bin:/usr/bin:/bin`,
    HOME: home,
    LANG: "C.UTF-8",
    GIT_OPTIONAL_LOCKS: "0",
    CHECKPOINT_DISABLE: "1",
    TF_IN_AUTOMATION: "1",
    ...extra,
  };
}

/** Resolve setup-terraform's executable outside the checkout before removing inherited PATH from children. */
function terraformExecutable() {
  for (const directory of (process.env.PATH ?? "").split(delimiter)) {
    if (!isAbsolute(directory)) continue;
    const candidate = join(directory, "terraform");
    if (!existsSync(candidate)) continue;
    const executable = realpathSync(candidate);
    assert(!executable.startsWith(`${root}${sep}`) && lstatSync(executable).isFile());
    accessSync(executable, constants.X_OK);
    return executable;
  }
  throw new Error("TERRAFORM_UNAVAILABLE");
}

/** Bound, stop and reap a fixed child/process group; output is returned only in memory and never printed. */
async function run(executable, args, { cwd = root, env, input, timeout = 120000, codes = [0] } = {}) {
  assert(!interrupted.signal.aborted);
  return await new Promise((resolveRun, reject) => {
    const child = spawn(executable, args, { cwd, env, detached: true, stdio: ["pipe", "pipe", "pipe"] });
    const chunks = [];
    let bytes = 0;
    let failed = false;
    let escalation;
    const kill = (signal) => {
      if (child.pid)
        try {
          process.kill(-child.pid, signal);
        } catch (error) {
          if (error.code !== "ESRCH") failed = true;
        }
    };
    const stop = () => {
      failed = true;
      kill("SIGTERM");
      escalation ??= setTimeout(() => kill("SIGKILL"), 2000);
    };
    const timer = setTimeout(stop, timeout);
    interrupted.signal.addEventListener("abort", stop, { once: true });
    for (const stream of [child.stdout, child.stderr])
      stream.on("data", (chunk) => {
        bytes += chunk.length;
        if (bytes > 16 * 1024 * 1024) stop();
        else if (stream === child.stdout) chunks.push(chunk);
      });
    child.stdin.on("error", stop);
    child.once("error", () => {
      failed = true;
    });
    child.once("close", (code) => {
      kill("SIGKILL");
      clearTimeout(timer);
      clearTimeout(escalation);
      interrupted.signal.removeEventListener("abort", stop);
      if (failed || !codes.includes(code)) reject(new Error("STAGE_COMMAND_FAILED"));
      else resolveRun({ code, stdout: Buffer.concat(chunks).toString("utf8") });
    });
    child.stdin.end(input);
  });
}

/** Read a bounded JSON body from one internally selected Google API, without redirects or provider-body errors. */
async function google(config, token, origin, path, body) {
  assert(
    [
      "https://run.googleapis.com",
      "https://cloudresourcemanager.googleapis.com",
      "https://billingbudgets.googleapis.com",
      "https://iamcredentials.googleapis.com",
    ].includes(origin),
  );
  assert(path.startsWith("/") && !/[?#\\]/.test(path));
  const response = await fetch(`${origin}${path}`, {
    method: body === undefined ? "GET" : "POST",
    redirect: "error",
    signal: AbortSignal.any([interrupted.signal, AbortSignal.timeout(30000)]),
    headers: {
      authorization: `Bearer ${token}`,
      "x-goog-user-project": config.projectId,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  assert(response.ok);
  const chunks = [];
  let size = 0;
  const reader = response.body.getReader();
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      assert(size <= 2 * 1024 * 1024);
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
}

/** Reverify fixed source/bundle/configuration for every command; pending profiles never authorize stage acceptance. */
async function inputs() {
  assert.equal(realpathSync(process.cwd()), root);
  assert.equal(process.env.GIT_OPTIONAL_LOCKS, "0");
  const context = publicationContext(process.env);
  assert.equal(process.env.GITHUB_API_URL, "https://api.github.com");
  assert.equal(process.env.GITHUB_JOB, "deploy-stage");
  const raw = process.env.STAGE_DEPLOYMENT_CONFIG;
  assert(typeof raw === "string" && raw.length <= 16384);
  const config = parseStageConfig(JSON.parse(raw));
  const admissionSha256 = process.env.GATE_ADMISSION_SHA256;
  const bundle = await verifyReleaseBundle(root, bundleDirectory, context, {
    expectedAdmissionSha256: admissionSha256,
  });
  const admission = bundle.acceptanceAdmission;
  const resolution = admission.record.resolution;
  const projection = readRequiredAcceptanceProfileProjection(root, {
    sourceRevision: bundle.origin.sourceRevision,
    baseRevision: bundle.origin.baseRevision,
    selection: { baseline: resolution.required, resolution, admission },
  });
  assert(
    projection &&
      ["hosted-v1", "hosted-health-v1"].includes(resolution.required.contractRevision) &&
      projection.required.contractRevision === resolution.required.contractRevision,
  );
  const material = publicationMaterial(bundle);
  const identity = {
    schemaVersion: 1,
    context,
    configSha256: sha256(canonical(config)),
    admissionSha256,
    manifestSha256: sha256(file(join(bundleDirectory, "manifest.json"))),
    reservationSha256: bundle.manifest.reservationSha256,
    publicationSha256: sha256(material.json),
  };
  return { config, context, bundle, material, identity };
}

/** Authenticate original checks plus this attempt's publisher and exact tag/assets before granting step outputs. */
async function verify(values) {
  const { context, config, bundle, material, identity } = values;
  const api = githubApi(context.repository, credentials.github);
  const prefix = `/repos/${context.repository}`;
  const [repository, branch, original, jobs, current, currentJobs, release, tag] = await Promise.all([
    api.request("GET", prefix),
    api.request("GET", `${prefix}/branches/main`),
    api.request("GET", `${prefix}/actions/runs/${context.runId}/attempts/${bundle.origin.attempt}`),
    api.list(`/actions/runs/${context.runId}/attempts/${bundle.origin.attempt}/jobs`, "jobs"),
    api.request("GET", `${prefix}/actions/runs/${context.runId}/attempts/${context.attempt}`),
    api.list(`/actions/runs/${context.runId}/attempts/${context.attempt}/jobs`, "jobs"),
    api.request("GET", `${prefix}/releases/tags/v${bundle.manifest.version}`),
    api.request("GET", `${prefix}/git/ref/tags/v${bundle.manifest.version}`),
  ]);
  const comparison = await api.request("GET", `${prefix}/compare/${context.sourceRevision}...${branch?.commit?.sha}`);
  requireObservedChecks(bundle, repository, branch, comparison, original, jobs);
  assert.equal(branch.commit.sha, context.sourceRevision, "A delayed source cannot overwrite newer stage");
  for (const [key, value] of Object.entries({
    id: context.runId,
    run_attempt: context.attempt,
    head_sha: context.sourceRevision,
    event: "push",
    head_branch: "main",
    path: context.workflow,
  }))
    assert.equal(current[key], value);
  assert.equal(current.repository.full_name, context.repository);
  const publishers = currentJobs.filter((job) => job.name === "publish-release");
  assert.equal(publishers.length, 1);
  const publisher = publishers[0];
  for (const [key, value] of Object.entries({
    head_sha: context.sourceRevision,
    run_attempt: context.attempt,
    status: "completed",
    conclusion: "success",
  }))
    assert.equal(publisher[key], value);
  for (const name of [
    "Publish verified private release without deployment",
    "Upload verified publisher handoff",
    "Record verified publisher handoff receipt",
  ]) {
    const steps = publisher.steps.filter((step) => step.name === name);
    assert.equal(steps.length, 1);
    assert.equal(steps[0].status, "completed");
    assert.equal(steps[0].conclusion, "success");
  }
  requireReleaseMetadata(release, bundle, material.notes);
  assert.equal(release.draft, false);
  let object = tag?.object;
  for (let i = 0; object?.type === "tag" && i < 5; i++)
    object = (await api.request("GET", `${prefix}/git/tags/${object.sha}`)).object;
  assert.equal(object?.type, "commit");
  assert.equal(object.sha, context.sourceRevision);
  const expected = [
    ...bundle.assets,
    ...[
      ["publication.json", material.json],
      ["publication-notes.md", material.notes],
    ].map(([name, text]) => ({ name, sha256: sha256(text), bytes: Buffer.byteLength(text) })),
  ];
  const assets = await api.list(`/releases/${release.id}/assets`);
  assert.equal(assets.length, 10);
  for (const asset of expected) {
    const matches = assets.filter((item) => item.name === asset.name);
    assert.equal(matches.length, 1);
    requireMatchingAsset(matches[0], asset);
  }
  record("verified.json", {
    ...identity,
    releaseId: release.id,
    publisherJobId: publisher.id,
    tag: release.tag_name,
    assetIdentities: expected.map(({ name, sha256: hash, bytes }) => ({ name, sha256: hash, bytes })),
  });
  const outputs = {
    "project-id": config.projectId,
    "wif-provider": config.workloadIdentityProvider,
    "registry-writer": `mp3-registry-writer@${config.projectId}.iam.gserviceaccount.com`,
    "stage-deployer": `mp3-stage-deployer@${config.projectId}.iam.gserviceaccount.com`,
  };
  assert(process.env.GITHUB_OUTPUT && !/[\r\n]/.test(process.env.GITHUB_OUTPUT));
  const fd = openSync(process.env.GITHUB_OUTPUT, constants.O_WRONLY | constants.O_APPEND | constants.O_NOFOLLOW);
  try {
    appendFileSync(
      fd,
      Object.entries(outputs)
        .map(([key, value]) => `${key}=${value}\n`)
        .join(""),
    );
  } finally {
    closeSync(fd);
  }
}

/** Check the earlier fixed record against freshly verified bytes rather than trusting an editable path or version. */
function verified(values) {
  const previous = JSON.parse(file(join(evidenceDirectory, "verified.json")));
  for (const [key, value] of Object.entries(values.identity)) assert.deepEqual(previous[key], value);
  assert(Number.isSafeInteger(previous.releaseId) && previous.releaseId > 0);
  return previous;
}

/** Transfer existing AMD64 image archives; private Docker login receives only stdin and is always removed. */
async function push(values, privateDirectory) {
  const previous = verified(values);
  const { config, bundle } = values;
  const token = credentials.registry;
  assert(typeof token === "string" && token.length > 20);
  const home = join(privateDirectory, "docker");
  mkdirSync(home, { mode: 0o700 });
  const env = childEnvironment(privateDirectory, { DOCKER_CONFIG: home });
  const host = `${config.region}-docker.pkg.dev`;
  const images = {};
  await run("docker", ["login", "--username", "oauth2accesstoken", "--password-stdin", host], { env, input: token });
  for (const role of roles) {
    const artifact = bundle.manifest.artifacts[role];
    await run("docker", ["load", "--input", join(bundleDirectory, `${role}.docker.tar`)], { env });
    const inspected = JSON.parse((await run("docker", ["image", "inspect", artifact.localImageId], { env })).stdout);
    assert.equal(inspected.length, 1);
    assert.equal(inspected[0].Id, artifact.localImageId);
    assert.equal(inspected[0].Os, "linux");
    assert.equal(inspected[0].Architecture, "amd64");
    const image = `${host}/${config.projectId}/${config.registryId}/${role}`;
    const tag = `${image}:source-${bundle.origin.sourceRevision}-image-${artifact.localImageId.slice(7)}`;
    await run("docker", ["tag", artifact.localImageId, tag], { env });
    await run("docker", ["push", tag], { env, timeout: 300000 });
    const manifest = JSON.parse((await run("docker", ["manifest", "inspect", "--verbose", tag], { env })).stdout);
    assert(!Array.isArray(manifest));
    const body = manifest.SchemaV2Manifest ?? manifest.OCIManifest;
    assert.equal(body?.schemaVersion, 2);
    assert.equal(body.config?.digest, artifact.localImageId);
    assert.equal(manifest.Descriptor?.platform?.os, "linux");
    assert.equal(manifest.Descriptor?.platform?.architecture, "amd64");
    assert(/^sha256:[a-f0-9]{64}$/.test(manifest.Descriptor.digest));
    images[role] = {
      localImageId: artifact.localImageId,
      archiveSha256: artifact.archiveSha256,
      registryDigest: manifest.Descriptor.digest,
    };
  }
  record("images.json", { ...values.identity, releaseId: previous.releaseId, images });
}

/** Verify the exact project's existing $75 cap and $100 all-service alert; never mutate cost controls. */
async function costReady(config, token) {
  const [project, cap, alert] = await Promise.all([
    google(config, token, "https://cloudresourcemanager.googleapis.com", `/v3/projects/${config.projectId}`),
    google(config, token, "https://billingbudgets.googleapis.com", `/v1/${config.cap.resourceName}`),
    google(config, token, "https://billingbudgets.googleapis.com", `/v1/${config.alertBudget}`),
  ]);
  assert.equal(project.name, `projects/${config.projectNumber}`);
  assert.equal(project.projectId, config.projectId);
  assert.equal(project.state, "ACTIVE");
  inspectCap(
    config.cap,
    renderDesiredCap(config.cap, JSON.parse(file(join(root, "infra/cloud/bootstrap/cloud-run-cap.template.json")))),
    cap,
  );
  assert.equal(alert.name, config.alertBudget);
  assert(!alert.spendCap);
  assert.equal(alert.displayName, "mp3-application-monthly-100-alert");
  assert([undefined, "ALL_USERS", "OWNERSHIP_SCOPE_UNSPECIFIED"].includes(alert.ownershipScope));
  assert.deepEqual(alert.budgetFilter, {
    projects: [`projects/${config.projectNumber}`],
    calendarPeriod: "MONTH",
    creditTypesTreatment: "EXCLUDE_ALL_CREDITS",
  });
  assert.deepEqual({ nanos: 0, ...alert.amount?.specifiedAmount }, { currencyCode: "USD", units: "100", nanos: 0 });
  const thresholds = alert.thresholdRules.map((rule) => [rule.thresholdPercent, rule.spendBasis ?? "CURRENT_SPEND"]);
  assert.deepEqual(Object.keys(alert.amount), ["specifiedAmount"]);
  assert.deepEqual(
    thresholds.sort(),
    [
      [0.5, "CURRENT_SPEND"],
      [0.75, "CURRENT_SPEND"],
      [0.9, "CURRENT_SPEND"],
      [1, "CURRENT_SPEND"],
      [1, "FORECASTED_SPEND"],
    ].sort(),
  );
  assert([undefined, false].includes(alert.notificationsRule?.disableDefaultIamRecipients));
  assert([undefined, false].includes(alert.notificationsRule?.enableProjectLevelRecipients));
  for (const name of ["monitoringNotificationChannels", "pubsubTopic", "schemaVersion"])
    assert(
      [undefined, ""].includes(alert.notificationsRule?.[name]) ||
        JSON.stringify(alert.notificationsRule?.[name]) === "[]",
    );
  return { cap: "ready", alert: "ready", checkedAt: new Date().toISOString() };
}

/** Project the complete approved application configuration from real Cloud Run responses, with documented defaults. */
function configuration(value, config) {
  assert.equal(value.serviceAccount, `mp3-stage-runtime@${config.projectId}.iam.gserviceaccount.com`);
  assert.equal(value.executionEnvironment, "EXECUTION_ENVIRONMENT_GEN2");
  assert.equal(value.timeout, "60s");
  assert.equal(value.maxInstanceRequestConcurrency, 2);
  assert.equal(value.scaling?.minInstanceCount ?? 0, 0);
  assert.equal(value.scaling?.maxInstanceCount, 1);
  assert.equal(value.sessionAffinity ?? false, false);
  for (const field of ["volumes", "vpcAccess", "nodeSelector", "encryptionKey", "annotations", "serviceMesh"])
    assert(
      value[field] === undefined || JSON.stringify(value[field]) === "[]" || JSON.stringify(value[field]) === "{}",
    );
  assert.equal(value.containers.length, 2);
  const containers = roles.map((role) => {
    const matches = value.containers.filter((container) => container.name === role);
    assert.equal(matches.length, 1);
    const container = matches[0];
    assert([undefined, ""].includes(container.baseImageUri));
    assert(
      new RegExp(
        `^${config.region}-docker[.]pkg[.]dev/${config.projectId}/${config.registryId}/${role}@sha256:[a-f0-9]{64}$`,
      ).test(container.image),
    );
    assert.deepEqual(container.resources?.limits, { cpu: "1", memory: "512Mi" });
    assert.equal(container.resources.cpuIdle, true);
    assert.equal(container.resources.startupCpuBoost ?? false, false);
    assert.deepEqual(container.dependsOn ?? [], role === "frontend" ? ["api"] : []);
    assert.deepEqual(container.ports ?? [], role === "frontend" ? [{ name: "http1", containerPort: 8080 }] : []);
    assert.deepEqual(
      container.env ?? [],
      role === "frontend" ? [{ name: "API_UPSTREAM", value: "127.0.0.1:3000" }] : [],
    );
    for (const field of ["command", "args", "volumeMounts", "livenessProbe", "readinessProbe"])
      assert(container[field] === undefined || JSON.stringify(container[field]) === "[]");
    const probe = container.startupProbe;
    assert.equal(probe.periodSeconds, 10);
    assert.equal(probe.timeoutSeconds, 2);
    assert.equal(probe.failureThreshold, 6);
    assert.equal(probe.initialDelaySeconds ?? 0, 0);
    assert.deepEqual(probe.httpGet, { path: "/healthz", port: role === "api" ? 3000 : 8080 });
    assert(!probe.tcpSocket && !probe.grpc);
    return { name: role, image: container.image };
  });
  return {
    serviceAccount: value.serviceAccount,
    executionEnvironment: value.executionEnvironment,
    timeout: value.timeout,
    concurrency: value.maxInstanceRequestConcurrency,
    maximumInstances: 1,
    containers,
  };
}

/** Observe exact stage/IAM/revision/full traffic, returning only the closed suite target and hashed configuration. */
async function observe(config, token, expectedImages, expectedSource) {
  const resourceId = `projects/${config.projectId}/locations/${config.region}/services/mp3-stage`;
  const [service, iam] = await Promise.all([
    google(config, token, "https://run.googleapis.com", `/v2/${resourceId}`),
    google(config, token, "https://run.googleapis.com", `/v2/${resourceId}:getIamPolicy`),
  ]);
  assert.equal(service.name, resourceId);
  assert.equal(service.reconciling ?? false, false);
  assert.equal(service.terminalCondition?.state, "CONDITION_SUCCEEDED");
  assert(/^[1-9][0-9]*$/.test(service.generation));
  assert.equal(service.generation, service.observedGeneration);
  assert.equal(service.ingress, "INGRESS_TRAFFIC_ALL");
  assert.equal(service.invokerIamDisabled ?? false, false);
  assert.equal(service.defaultUriDisabled ?? false, false);
  assert.equal(service.iapEnabled ?? false, false);
  assert.equal(service.sshEnabled ?? false, false);
  assert.equal(service.scaling?.minInstanceCount ?? 0, 0);
  assert.equal(service.scaling?.maxInstanceCount, 1);
  assert([undefined, "AUTOMATIC", "SCALING_MODE_UNSPECIFIED"].includes(service.scaling?.scalingMode));
  assert.equal(service.scaling?.manualInstanceCount ?? 0, 0);
  assert.equal(service.labels?.application, "mp3-frame-counter");
  assert.equal(service.labels?.environment, "stage");
  assert(/^[a-f0-9]{40}$/.test(service.labels.source_revision));
  if (expectedSource) assert.equal(service.labels.source_revision, expectedSource);
  for (const field of ["customAudiences", "buildConfig", "multiRegionSettings", "binaryAuthorization", "annotations"])
    assert(
      service[field] === undefined ||
        JSON.stringify(service[field]) === "[]" ||
        JSON.stringify(service[field]) === "{}",
    );
  assert.equal(typeof iam.etag, "string");
  assert.equal(iam.bindings.length, 2);
  for (const [role, account] of [
    ["roles/run.invoker", "probe"],
    ["roles/run.admin", "deployer"],
  ]) {
    const bindings = iam.bindings.filter((binding) => binding.role === role);
    assert.equal(bindings.length, 1);
    assert(!bindings[0].condition);
    assert.deepEqual(bindings[0].members, [
      `serviceAccount:mp3-stage-${account}@${config.projectId}.iam.gserviceaccount.com`,
    ]);
  }
  const projected = configuration(service.template, config);
  const revisionId = requireStageServingRevision(service, resourceId);
  const revision = await google(config, token, "https://run.googleapis.com", `/v2/${revisionId}`);
  assert.equal(revision.name, revisionId);
  assert.equal(revision.reconciling ?? false, false);
  assert(
    revision.conditions?.some((condition) => condition.type === "Ready" && condition.state === "CONDITION_SUCCEEDED"),
  );
  assert.deepEqual(configuration(revision, config), projected);
  const registryDigests = Object.fromEntries(
    projected.containers.map(({ name, image }) => [name, image.split("@")[1]]),
  );
  if (expectedImages)
    for (const role of roles) assert.equal(registryDigests[role], expectedImages[role].registryDigest);
  const url = new URL(service.uri);
  assert.equal(url.protocol, "https:");
  assert.equal(url.origin, service.uri);
  assert(!url.username && !url.password && !url.port);
  assert(url.hostname.endsWith(".run.app"));
  return {
    environment: "stage",
    origin: url.origin,
    resourceId,
    revisionId,
    observedAt: new Date().toISOString(),
    configurationSha256: sha256(
      canonical({
        ...projected,
        sourceRevision: service.labels.source_revision,
        ingress: service.ingress,
        authenticated: true,
      }),
    ),
    registryDigests,
  };
}

/** Update only the existing stage root from a checked saved plan; credentials/state never enter evidence storage. */
async function deploy(values, privateDirectory) {
  const previous = verified(values);
  const { config, bundle, identity } = values;
  const transferred = JSON.parse(file(join(evidenceDirectory, "images.json")));
  assert.equal(transferred.releaseId, previous.releaseId);
  for (const [key, value] of Object.entries(identity)) assert.deepEqual(transferred[key], value);
  assert.deepEqual(Object.keys(transferred.images).sort(), roles);
  const images = transferred.images;
  for (const role of roles) {
    assert.equal(images[role].localImageId, bundle.manifest.artifacts[role].localImageId);
    assert.equal(images[role].archiveSha256, bundle.manifest.artifacts[role].archiveSha256);
    assert(/^sha256:[a-f0-9]{64}$/.test(images[role].registryDigest));
  }
  const token = credentials.stage;
  assert(typeof token === "string" && token.length > 20);
  record("cost-before.json", await costReady(config, token));
  const before = await observe(config, token);
  record("previous-stage.json", before);
  const tf = join(privateDirectory, "runtime");
  mkdirSync(tf, { mode: 0o700 });
  for (const name of ["versions.tf", "variables.tf", "main.tf", "outputs.tf", ".terraform.lock.hcl"])
    writeFileSync(join(tf, name), file(join(root, "infra/cloud/runtime", name)), { flag: "wx", mode: 0o600 });
  writeFileSync(join(privateDirectory, "terraform.rc"), "disable_checkpoint = true\n", { flag: "wx", mode: 0o600 });
  const env = childEnvironment(privateDirectory, {
    GOOGLE_OAUTH_ACCESS_TOKEN: token,
    TF_CLI_CONFIG_FILE: join(privateDirectory, "terraform.rc"),
  });
  const terraform = terraformExecutable();
  const version = JSON.parse((await run(terraform, ["version", "-json"], { cwd: tf, env })).stdout);
  assert.equal(version.terraform_version, "1.13.3");
  const imageRefs = Object.fromEntries(
    roles.map((role) => [
      role,
      `${config.region}-docker.pkg.dev/${config.projectId}/${config.registryId}/${role}@${images[role].registryDigest}`,
    ]),
  );
  writeFileSync(
    join(tf, "inputs.json"),
    JSON.stringify({
      project_id: config.projectId,
      region: config.region,
      registry_id: config.registryId,
      environment: "stage",
      source_revision: bundle.origin.sourceRevision,
      api_image: imageRefs.api,
      frontend_image: imageRefs.frontend,
    }),
    { flag: "wx", mode: 0o600 },
  );
  await run(
    terraform,
    [
      "init",
      "-input=false",
      "-no-color",
      "-lockfile=readonly",
      `-backend-config=bucket=${config.stageStateBucket}`,
      `-backend-config=prefix=${config.stageStatePrefix}`,
    ],
    { cwd: tf, env },
  );
  const planned = await run(
    terraform,
    [
      "plan",
      "-input=false",
      "-no-color",
      "-lock-timeout=60s",
      "-detailed-exitcode",
      "-var-file=inputs.json",
      "-out=stage.tfplan",
    ],
    { cwd: tf, env, codes: [0, 2], timeout: 180000 },
  );
  const plan = JSON.parse((await run(terraform, ["show", "-json", "stage.tfplan"], { cwd: tf, env })).stdout);
  requireStagePlan(plan, config, imageRefs, bundle.origin.sourceRevision);
  assert.equal(planned.code === 2, plan.applyable);
  if (planned.code === 2)
    await run(terraform, ["apply", "-input=false", "-no-color", "-lock-timeout=60s", "stage.tfplan"], {
      cwd: tf,
      env,
      timeout: 300000,
    });
  record("plan.json", { status: "applied-or-no-change", changed: planned.code === 2, sha256: sha256(canonical(plan)) });
  const observed = () => observe(config, token, images, bundle.origin.sourceRevision);
  record("candidate.json", await observed());
  const mint = async (origin) => {
    assert.equal(origin, (await observed()).origin);
    const response = await google(
      config,
      token,
      "https://iamcredentials.googleapis.com",
      `/v1/projects/-/serviceAccounts/mp3-stage-probe@${config.projectId}.iam.gserviceaccount.com:generateIdToken`,
      { audience: origin, includeEmail: true },
    );
    assert(
      typeof response.token === "string" &&
        response.token.length <= 16384 &&
        /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(response.token),
    );
    const claims = JSON.parse(Buffer.from(response.token.split(".")[1], "base64url"));
    assert.equal(claims.aud, origin);
    assert(Number.isSafeInteger(claims.exp));
    assert.equal(claims.email, `mp3-stage-probe@${config.projectId}.iam.gserviceaccount.com`);
    return { kind: "google-id-token", value: response.token, expiresAt: new Date(claims.exp * 1000).toISOString() };
  };
  const { runStageAcceptance } = await import("./stage-acceptance.mjs");
  await runStageAcceptance({
    root,
    bundle,
    admissionSha256: identity.admissionSha256,
    currentContext: values.context,
    images,
    release: { reservationSha256: identity.reservationSha256, publicationSha256: identity.publicationSha256 },
    observe: observed,
    mint,
    evidenceDirectory,
  });
  record("cost-after.json", await costReady(config, token));
  return { ...identity, status: "stage-verified", target: await observed() };
}

/** Execute one fixed command; cleanup failures prohibit success and expose no provider text or credential material. */
async function main() {
  // Capture step credentials before existing Git helpers run, then prevent inheritance into their subprocesses.
  credentials = {
    github: process.env.GITHUB_TOKEN,
    registry: process.env.REGISTRY_ACCESS_TOKEN,
    stage: process.env.STAGE_ACCESS_TOKEN,
  };
  for (const name of ["GITHUB_TOKEN", "REGISTRY_ACCESS_TOKEN", "STAGE_ACCESS_TOKEN"]) delete process.env[name];
  const command = process.argv[2];
  assert.equal(process.argv.length, 3);
  assert(["verify", "push", "deploy"].includes(command));
  assert.equal(realpathSync(root), root);
  for (const path of [join(root, ".artifacts"), evidenceDirectory]) {
    if (!existsSync(path)) mkdirSync(path, { mode: 0o700 });
    assert(lstatSync(path).isDirectory() && !lstatSync(path).isSymbolicLink());
  }
  let privateDirectory;
  let failure;
  let completed;
  let cleanup = "passed";
  try {
    const values = await inputs();
    if (command === "verify") await verify(values);
    else {
      privateDirectory = mkdtempSync(join(realpathSync(tmpdir()), "mp3-stage-"));
      completed = await (command === "push" ? push : deploy)(values, privateDirectory);
    }
  } catch {
    failure = true;
  } finally {
    if (privateDirectory)
      try {
        rmSync(privateDirectory, { recursive: true, force: true });
        assert(!existsSync(privateDirectory));
      } catch {
        failure = true;
        cleanup = "failed";
      }
  }
  if (!failure && command === "deploy")
    try {
      record("complete.json", completed);
    } catch {
      failure = true;
    }
  record(`${command}-outcome.json`, { command, status: failure ? "failed" : "passed", cleanup });
  assert(!failure, "STAGE_DELIVERY_FAILED");
}
main().catch(() => {
  console.error("STAGE_DELIVERY_FAILED; retained sanitized stage evidence.");
  process.exitCode = 1;
});
