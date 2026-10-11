/**
 * Independently specify the one allowed masked stage-configuration slot and historical workflow compatibility.
 * Run with pinned Node after unchanged npm ci: node --test scripts/stage-config-log-policy.test.mjs.
 * Historical YAML comes from its immutable Git object; publisher checks are pure. Actual checkout-policy/verify CLI
 * checks run only in disposable local clones with denied network/subprocess boundaries for missing configuration.
 * No real checkout, remote, credential, provider, frozen acceptance or historical object is changed.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parse, stringify } from "yaml";
import { requireReleaseWorkflow } from "./publish-release-evidence.mjs";

const root = realpathSync(fileURLToPath(new URL("../", import.meta.url)));
const history = "2fddb44f65ebcf137d64d54232a3c7237b8bb4a5";
const secretSlot = "${{ secrets.STAGE_DEPLOYMENT_CONFIG }}";
const variableSlot = "${{ vars.STAGE_DEPLOYMENT_CONFIG }}";
const stageCondition =
  "${{ github.event_name == 'push' && github.ref == 'refs/heads/main' && vars.STAGE_DELIVERY_ENABLED == 'true' && vars.STAGE_DEPLOYMENT_CONFIG != '' && needs.validate-product.outputs.release-ready == 'true' && needs.publish-release.outputs.handoff-ready == 'true' }}";
const historicalBytes = execFileSync("git", ["--no-replace-objects", "show", `${history}:.github/workflows/ci.yml`], {
  cwd: root,
});
const historicalDigest = createHash("sha256").update(historicalBytes).digest("hex");

/** Keep all adopted controls unchanged; the sole proposed difference is the exact stage job's JSON input slot. */
function workflow(slot = secretSlot) {
  const value = parse(historicalBytes.toString("utf8"));
  assert.equal(value.jobs["deploy-stage"].env.STAGE_DEPLOYMENT_CONFIG, variableSlot);
  value.jobs["deploy-stage"].env.STAGE_DEPLOYMENT_CONFIG = slot;
  return value;
}

/** A refusal requires positive availability first; unavailable migration support is never a passing negative test. */
function refuses(cases) {
  assert.doesNotThrow(() => requireReleaseWorkflow(workflow()));
  for (const [label, mutate] of cases) {
    const value = workflow();
    mutate(value, value.jobs["deploy-stage"]);
    const before = structuredClone(value);
    assert.throws(() => requireReleaseWorkflow(value), label);
    assert.deepEqual(value, before, `${label}: refusal rewrote the workflow`);
  }
}

/** Preserve actual history and tooling; all Git writes and checkout overlays are confined to the temporary clone. */
function fixture(t) {
  const temporary = realpathSync(mkdtempSync(join(tmpdir(), "stage-config-log-policy-")));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  const checkout = join(temporary, "checkout");
  const home = join(temporary, "home");
  mkdirSync(home);
  const env = {
    PATH: `${dirname(process.execPath)}:/usr/local/bin:/usr/bin:/bin`,
    HOME: home,
    LANG: "C.UTF-8",
    GIT_OPTIONAL_LOCKS: "0",
  };
  execFileSync("git", ["clone", "--shared", "--quiet", "--no-checkout", root, checkout], { env });
  execFileSync("git", ["checkout", "--detach", "--quiet", history], { cwd: checkout, env });
  for (const path of [
    "scripts/policy.mjs",
    "scripts/publish-release-evidence.mjs",
    "scripts/stage-delivery.mjs",
    "scripts/stage-command-failure.mjs",
    ".github/workflows/ci.yml",
    "package.json",
  ])
    copyFileSync(join(root, path), join(checkout, path));
  symlinkSync(join(root, "node_modules"), join(checkout, "node_modules"), "dir");
  const policy = (value) => {
    writeFileSync(join(checkout, ".github/workflows/ci.yml"), stringify(value));
    return spawnSync(process.execPath, ["scripts/policy.mjs"], {
      cwd: checkout,
      env,
      encoding: "utf8",
      timeout: 30_000,
    });
  };
  return { checkout, temporary, env, policy };
}

test("historical variable-source and release-only workflows remain byte-preserving publisher inputs", () => {
  const bytesBefore = Buffer.from(historicalBytes);
  const value = parse(historicalBytes.toString("utf8"));
  const before = structuredClone(value);
  assert.doesNotThrow(() => requireReleaseWorkflow(value));
  assert.deepEqual(value, before);
  delete value.jobs["deploy-stage"];
  assert.doesNotThrow(() => requireReleaseWorkflow(value));
  assert.deepEqual(historicalBytes, bytesBefore);
  assert.equal(createHash("sha256").update(historicalBytes).digest("hex"), historicalDigest);
});

test("publisher admits the one exact masked JSON slot without changing any historical stage control", () => {
  const value = workflow();
  const before = structuredClone(value);
  assert.equal(value.jobs["deploy-stage"].if, stageCondition);
  assert.doesNotThrow(() => requireReleaseWorkflow(value));
  assert.deepEqual(value, before);
  const reverted = structuredClone(value);
  reverted.jobs["deploy-stage"].env.STAGE_DEPLOYMENT_CONFIG = variableSlot;
  assert.deepEqual(reverted, parse(historicalBytes.toString("utf8")), "Only the one configuration source may change");
});

test("publisher rejects missing substituted fallback and extra stage configuration secret slots", () => {
  refuses([
    ["missing configuration", (_w, job) => delete job.env.STAGE_DEPLOYMENT_CONFIG],
    ["empty configuration selector", (_w, job) => (job.env.STAGE_DEPLOYMENT_CONFIG = "")],
    ["alternate secret", (_w, job) => (job.env.STAGE_DEPLOYMENT_CONFIG = "${{ secrets.STAGE_CONFIG }}")],
    [
      "case-altered selector",
      (_w, job) => (job.env.STAGE_DEPLOYMENT_CONFIG = "${{ secrets.stage_deployment_config }}"),
    ],
    ["bracket selector", (_w, job) => (job.env.STAGE_DEPLOYMENT_CONFIG = "${{ secrets['STAGE_DEPLOYMENT_CONFIG'] }}")],
    [
      "variable fallback",
      (_w, job) =>
        (job.env.STAGE_DEPLOYMENT_CONFIG = "${{ secrets.STAGE_DEPLOYMENT_CONFIG || vars.STAGE_DEPLOYMENT_CONFIG }}"),
    ],
    ["unreviewed context", (_w, job) => (job.env.STAGE_DEPLOYMENT_CONFIG = "${{ inputs.config }}")],
    ["extra secret env", (_w, job) => (job.env.OTHER_CONFIG = secretSlot)],
    ["step-local override", (_w, job) => (job.steps[4].env.STAGE_DEPLOYMENT_CONFIG = secretSlot)],
    ["static cloud key", (_w, job) => (job.steps[5].with.credentials_json = "${{ secrets.GOOGLE_KEY }}")],
  ]);
});

test("masked configuration cannot weaken readiness dependencies permissions verification or bounded delivery", () => {
  const conditions = [
    "github.event_name == 'push'",
    "github.ref == 'refs/heads/main'",
    "vars.STAGE_DELIVERY_ENABLED == 'true'",
    "vars.STAGE_DEPLOYMENT_CONFIG != ''",
    "needs.validate-product.outputs.release-ready == 'true'",
    "needs.publish-release.outputs.handoff-ready == 'true'",
  ];
  refuses([
    ...conditions.map((term) => [`missing readiness ${term}`, (_w, job) => (job.if = job.if.replace(term, "true"))]),
    [
      "secret context in readiness",
      (_w, job) => (job.if = job.if.replace("vars.STAGE_DEPLOYMENT_CONFIG", "secrets.STAGE_DEPLOYMENT_CONFIG")),
    ],
    ["missing product dependency", (_w, job) => (job.needs = ["publish-release"])],
    ["missing publisher dependency", (_w, job) => (job.needs = ["validate-product"])],
    ["extra write permission", (_w, job) => (job.permissions.contents = "write")],
    ["no OIDC permission", (_w, job) => delete job.permissions["id-token"]],
    ["cancel active stage", (_w, job) => (job.concurrency["cancel-in-progress"] = true)],
    ["different serialization", (_w, job) => (job.concurrency.group = "per-run-${{ github.run_id }}")],
    ["unbounded timeout", (_w, job) => delete job["timeout-minutes"]],
    ["credential action before verifier", (_w, job) => ([job.steps[4], job.steps[5]] = [job.steps[5], job.steps[4]])],
    ["skipped verifier", (_w, job) => (job.steps[4].if = "${{ false }}")],
    ["verifier ignores failure", (_w, job) => (job.steps[4].run += " || true")],
    ["configuration printing", (_w, job) => job.steps.push({ run: "printenv STAGE_DEPLOYMENT_CONFIG" })],
    ["extra deployment", (_w, job) => job.steps.push(structuredClone(job.steps[8]))],
  ]);
});

test("actual checkout policy permits exactly the masked stage job env slot", (t) => {
  const f = fixture(t);
  const result = f.policy(workflow());
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, `Actual policy rejected the exact new slot:\n${result.stderr}`);
});

test("actual checkout policy rejects legacy or extra secret references anywhere", (t) => {
  const f = fixture(t);
  const positive = f.policy(workflow());
  assert.equal(positive.status, 0, `Positive policy counterpart unavailable:\n${positive.stderr}`);
  const mutations = [
    ["legacy variable in current checkout", (_w, job) => (job.env.STAGE_DEPLOYMENT_CONFIG = variableSlot)],
    ["missing current slot", (_w, job) => delete job.env.STAGE_DEPLOYMENT_CONFIG],
    [
      "renamed slot",
      (_w, job) => {
        job.env.OTHER_CONFIG = secretSlot;
        delete job.env.STAGE_DEPLOYMENT_CONFIG;
      },
    ],
    ["alternate secret", (_w, job) => (job.env.STAGE_DEPLOYMENT_CONFIG = "${{ secrets.OTHER_CONFIG }}")],
    [
      "fallback to variable",
      (_w, job) =>
        (job.env.STAGE_DEPLOYMENT_CONFIG = "${{ secrets.STAGE_DEPLOYMENT_CONFIG || vars.STAGE_DEPLOYMENT_CONFIG }}"),
    ],
    ["duplicate allowed secret globally", (w) => (w.env = { COPY: secretSlot })],
    ["different secret globally", (w) => (w.env = { COPY: "${{ secrets.OTHER_CONFIG }}" })],
    ["bracket secret globally", (w) => (w.env = { COPY: "${{ secrets['OTHER_CONFIG'] }}" })],
    ["case-altered secret context", (w) => (w.env = { COPY: "${{ SECRETS.OTHER_CONFIG }}" })],
    ["secret in workflow name", (w) => (w.name = "${{ secrets.OTHER_CONFIG }}")],
    ["secret in another job", (w) => (w.jobs["validate-product"].env.EXTRA = secretSlot)],
    ["secret in another step", (w) => (w.jobs["validate-foundation"].steps[1].env = { EXTRA: secretSlot })],
    ["whole secrets context", (w) => (w.env = { COPY: "${{ toJSON(secrets) }}" })],
    ["uppercase whole secrets context", (w) => (w.env = { COPY: "${{ toJSON(SECRETS) }}" })],
    ["whole secrets context in workflow name", (w) => (w.name = "${{ toJSON(secrets) }}")],
    ["uppercase whole secrets context in run name", (w) => (w["run-name"] = "${{ toJSON(SECRETS) }}")],
  ];
  const unexpectedlyAccepted = [];
  for (const [label, mutate] of mutations) {
    const value = workflow();
    mutate(value, value.jobs["deploy-stage"]);
    const result = f.policy(value);
    assert.equal(result.error, undefined, label);
    if (result.status === 0) unexpectedlyAccepted.push(label);
    else assert.equal(result.status, 1, `${label}: rejection must be a completed policy refusal`);
  }
  assert.deepEqual(unexpectedlyAccepted, [], "Actual checkout policy must reject every extra secret reference");
});

test("missing empty or malformed masked configuration fails verify with only sanitized evidence before any I/O", (t) => {
  const f = fixture(t);
  const invoked = join(f.temporary, "forbidden-io.txt");
  const preload = join(f.temporary, "deny-io.mjs");
  writeFileSync(
    preload,
    `
    import { appendFileSync } from 'node:fs'; import { syncBuiltinESMExports } from 'node:module';
    import child from 'node:child_process'; import http from 'node:http'; import https from 'node:https';
    import net from 'node:net'; import tls from 'node:tls';
    const deny = () => { appendFileSync(${JSON.stringify(invoked)}, 'forbidden\\n'); throw new Error('DENIED'); };
    globalThis.fetch = deny;
    for (const module of [child,http,https,net,tls]) for (const name of
      ['request','get','connect','createConnection','exec','execFile','spawn','fork','execSync','execFileSync','spawnSync'])
      if (typeof module[name] === 'function') module[name] = deny;
    syncBuiltinESMExports();
  `,
  );
  const marker = "synthetic-configuration-must-not-appear-in-logs";
  for (const configuration of [undefined, "", marker]) {
    const env = {
      ...f.env,
      GITHUB_ACTIONS: "true",
      GITHUB_EVENT_NAME: "push",
      GITHUB_REF: "refs/heads/main",
      GITHUB_SERVER_URL: "https://github.com",
      GITHUB_API_URL: "https://api.github.com",
      GITHUB_REPOSITORY: "synthetic-owner/synthetic-project",
      GITHUB_SHA: history,
      CI_BASE_REF: "a".repeat(40),
      GITHUB_WORKFLOW_SHA: history,
      GITHUB_WORKFLOW_REF: "synthetic-owner/synthetic-project/.github/workflows/ci.yml@refs/heads/main",
      GITHUB_RUN_ID: "1234",
      GITHUB_RUN_ATTEMPT: "1",
      GITHUB_JOB: "deploy-stage",
      ...(configuration === undefined ? {} : { STAGE_DEPLOYMENT_CONFIG: configuration }),
    };
    const result = spawnSync(process.execPath, ["--import", preload, "scripts/stage-delivery.mjs", "verify"], {
      cwd: f.checkout,
      env,
      encoding: "utf8",
      timeout: 10_000,
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr, "STAGE_DELIVERY_FAILED; retained sanitized stage evidence.\n");
    assert.ok(!`${result.stdout}${result.stderr}`.includes(marker));
    assert.deepEqual(readdirSync(join(f.checkout, ".artifacts/stage")), ["verify-outcome.json"]);
    assert.deepEqual(JSON.parse(readFileSync(join(f.checkout, ".artifacts/stage/verify-outcome.json"), "utf8")), {
      command: "verify",
      status: "failed",
      cleanup: "passed",
    });
    assert.ok(!readdirSync(f.temporary).includes("forbidden-io.txt"), "Configuration rejection must precede all I/O");
  }
});
