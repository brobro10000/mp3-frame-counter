/**
 * Specify the bounded automatic-stage workflow guard independently of its implementation. Run with pinned Node:
 * `node --test scripts/publish-release-evidence.test.mjs`. Read the current CI YAML only to retain its existing trusted
 * preflight/publisher contract; construct the proposed stage job from literal adopted expectations, never helper output.
 * All mutations are in-memory objects. No Actions, provider, credentials, deployment, subprocess or network is used.
 * Historical workflows without stage remain valid; a present stage job must preserve exact source/artifact custody,
 * gates and credential confinement. Each negative group first validates its positive counterpart, so an unavailable
 * stage guard is reported as a positive-availability failure rather than counted as successful rejection coverage.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parse } from "yaml";
import { requireReleaseWorkflow } from "./publish-release-evidence.mjs";

const stageCondition =
  "${{ github.event_name == 'push' && github.ref == 'refs/heads/main' && vars.STAGE_DELIVERY_ENABLED == 'true' && vars.STAGE_DEPLOYMENT_CONFIG != '' && needs.validate-product.outputs.release-ready == 'true' && needs.publish-release.outputs.handoff-ready == 'true' }}";
const authAction = "google-github-actions/auth@7c6bc770dae815cd3e89ee6cdf493a5fab2cc093";

/** Remove only the optional stage job to exercise historical replay against the unchanged mandatory/publisher jobs. */
function historicalWorkflow() {
  const workflow = parse(readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8"));
  delete workflow.jobs["deploy-stage"];
  return workflow;
}

/** Literal source-reviewed WIF inputs; verification precedes either credential action and emits finite identities. */
function authentication(id, accountOutput) {
  return {
    id,
    uses: authAction,
    with: {
      project_id: "${{ steps.verify-stage.outputs.project-id }}",
      workload_identity_provider: "${{ steps.verify-stage.outputs.wif-provider }}",
      service_account: `\${{ steps.verify-stage.outputs.${accountOutput} }}`,
      token_format: "access_token",
      access_token_lifetime: "3600s",
      create_credentials_file: false,
      export_environment_variables: false,
    },
  };
}

/** The exact adopted stage interface is independent of any current deploy-stage YAML or validator implementation. */
function stageWorkflow() {
  const workflow = historicalWorkflow();
  workflow.jobs["deploy-stage"] = {
    name: "deploy-stage",
    needs: ["publish-release", "validate-product"],
    if: stageCondition,
    "runs-on": "ubuntu-24.04",
    "timeout-minutes": 30,
    permissions: { contents: "read", actions: "read", "id-token": "write" },
    concurrency: { group: "deploy-stage", "cancel-in-progress": false },
    env: {
      CI_BASE_REF: "${{ github.event.before }}",
      GATE_ADMISSION_SHA256: "${{ needs.validate-product.outputs.acceptance-admission-sha256 }}",
      STAGE_DEPLOYMENT_CONFIG: "${{ vars.STAGE_DEPLOYMENT_CONFIG }}",
      GIT_OPTIONAL_LOCKS: "0",
    },
    steps: [
      {
        uses: "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
        with: { ref: "${{ github.sha }}", "fetch-depth": 0, "persist-credentials": false },
      },
      {
        uses: "actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1",
        with: { "node-version-file": ".nvmrc", "package-manager-cache": false },
      },
      {
        uses: "hashicorp/setup-terraform@dfe3c3f87815947d99a8997f908cb6525fc44e9e",
        with: { terraform_version: "1.13.3", terraform_wrapper: false },
      },
      {
        uses: "actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c",
        with: {
          name: "${{ needs.validate-product.outputs.release-artifact }}",
          path: ".artifacts/release-input",
        },
      },
      {
        id: "verify-stage",
        run: "node scripts/stage-delivery.mjs verify",
        env: { GITHUB_TOKEN: "${{ github.token }}" },
      },
      authentication("registry-auth", "registry-writer"),
      {
        run: "node scripts/stage-delivery.mjs push",
        env: { REGISTRY_ACCESS_TOKEN: "${{ steps.registry-auth.outputs.access_token }}" },
      },
      authentication("stage-auth", "stage-deployer"),
      {
        run: "node scripts/stage-delivery.mjs deploy",
        env: { STAGE_ACCESS_TOKEN: "${{ steps.stage-auth.outputs.access_token }}" },
      },
      {
        uses: "actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9",
        if: "${{ always() }}",
        with: {
          name: "stage-${{ github.sha }}-${{ github.run_attempt }}",
          path: ".artifacts/stage",
          "if-no-files-found": "ignore",
          "retention-days": 30,
        },
      },
    ],
  };
  return workflow;
}

/** Validate a real positive counterpart, then require each independently named single mutation to be rejected. */
function refuses(factory, cases) {
  const valid = factory();
  assert.doesNotThrow(() => requireReleaseWorkflow(valid), "The valid workflow counterpart must be accepted first");
  for (const [description, mutate] of cases) {
    const invalid = structuredClone(valid);
    mutate(invalid, invalid.jobs["deploy-stage"]);
    assert.throws(() => requireReleaseWorkflow(invalid), description);
  }
}

test("stage workflow guard retains historical release-only workflows", () => {
  assert.doesNotThrow(() => requireReleaseWorkflow(historicalWorkflow()));
});

test("stage workflow guard accepts the exact authorized direct stage job", () => {
  const workflow = stageWorkflow();
  const before = structuredClone(workflow);
  assert.doesNotThrow(() => requireReleaseWorkflow(workflow));
  assert.deepEqual(workflow, before, "Workflow validation must not rewrite its authority inputs");
});

test("stage workflow guard preserves mandatory preflight and publisher refusal decisions", () => {
  refuses(historicalWorkflow, [
    ["Required product job cannot disappear", (w) => delete w.jobs["validate-product"]],
    ["Required foundation job cannot disappear", (w) => delete w.jobs["validate-foundation"]],
    [
      "Product preflight cannot move after install",
      (w) => {
        const steps = w.jobs["validate-product"].steps;
        const index = steps.findIndex((s) => s.id === "acceptance-preflight");
        steps.push(...steps.splice(index, 1));
      },
    ],
    ["Publisher still needs control-plane", (w) => (w.jobs["publish-release"].needs = ["validate-product"])],
    ["Publisher still requires main push", (w) => (w.jobs["publish-release"].if = "${{ always() }}")],
    [
      "Publisher digest must remain independently transported",
      (w) => (w.jobs["publish-release"].env.GATE_ADMISSION_SHA256 = "${{ steps.bundle.outputs.digest }}"),
    ],
    [
      "Publisher receipt outputs cannot be self-reported by publication",
      (w) =>
        (w.jobs["publish-release"].outputs["handoff-ready"] = "${{ steps.publish-release.outputs.handoff-ready }}"),
    ],
  ]);
});

test("stage workflow guard requires every eligibility term and direct successful dependencies", () => {
  const terms = [
    "github.event_name == 'push'",
    "github.ref == 'refs/heads/main'",
    "vars.STAGE_DELIVERY_ENABLED == 'true'",
    "vars.STAGE_DEPLOYMENT_CONFIG != ''",
    "needs.validate-product.outputs.release-ready == 'true'",
    "needs.publish-release.outputs.handoff-ready == 'true'",
  ];
  refuses(stageWorkflow, [
    ...terms.map((term) => [`Cannot remove ${term}`, (_w, s) => (s.if = s.if.replace(term, "true"))]),
    ["No always override", (_w, s) => (s.if = "${{ always() }}")],
    ["No omitted publisher dependency", (_w, s) => (s.needs = ["validate-product"])],
    ["No omitted product dependency", (_w, s) => (s.needs = ["publish-release"])],
    ["No substituted control dependency", (_w, s) => (s.needs = ["control-plane", "validate-product"])],
    ["No ignored stage failure", (_w, s) => (s["continue-on-error"] = true)],
    ["No cancellation of active delivery", (_w, s) => (s.concurrency["cancel-in-progress"] = true)],
    ["No per-run concurrency bypass", (_w, s) => (s.concurrency.group = "stage-${{ github.run_id }}")],
    ["No unbounded job", (_w, s) => delete s["timeout-minutes"]],
    ["No larger execution budget", (_w, s) => (s["timeout-minutes"] = 60)],
  ]);
});

test("stage workflow guard confines OIDC permissions and refuses production jobs", () => {
  refuses(stageWorkflow, [
    ["No stage repository writes", (_w, s) => (s.permissions.contents = "write")],
    ["No stage Actions writes", (_w, s) => (s.permissions.actions = "write")],
    ["No extra stage permission", (_w, s) => (s.permissions.packages = "write")],
    ["Required stage OIDC permission cannot disappear", (_w, s) => delete s.permissions["id-token"]],
    ["No workflow-wide OIDC", (w) => (w.permissions["id-token"] = "write")],
    ["No publisher OIDC", (w) => (w.jobs["publish-release"].permissions["id-token"] = "write")],
    ["No unknown OIDC job", (w) => (w.jobs["other-cloud-job"] = { permissions: { "id-token": "write" }, steps: [] })],
    ["No production deployment job", (w) => (w.jobs["deploy-production"] = { steps: [] })],
  ]);
});

test("stage workflow guard binds pinned checkout, artifact and original admission before authentication", () => {
  refuses(stageWorkflow, [
    ["No moving checkout revision", (_w, s) => (s.steps[0].with.ref = "main")],
    ["No shallow checkout", (_w, s) => (s.steps[0].with["fetch-depth"] = 1)],
    ["No persisted checkout credential", (_w, s) => (s.steps[0].with["persist-credentials"] = true)],
    ["No other-run artifact", (_w, s) => (s.steps[3].with["run-id"] = "123")],
    ["No caller artifact", (_w, s) => (s.steps[3].with.name = "${{ inputs.artifact }}")],
    ["No alternate artifact destination", (_w, s) => (s.steps[3].with.path = ".")],
    ["No reconstructed digest", (_w, s) => (s.env.GATE_ADMISSION_SHA256 = "${{ steps.verify-stage.outputs.digest }}")],
    ["No alternate original base", (_w, s) => (s.env.CI_BASE_REF = "${{ github.sha }}")],
    ["No caller configuration", (_w, s) => (s.env.STAGE_DEPLOYMENT_CONFIG = "${{ inputs.config }}")],
    ["No authentication before verification", (_w, s) => ([s.steps[4], s.steps[5]] = [s.steps[5], s.steps[4]])],
    ["No authentication before checkout", (_w, s) => ([s.steps[0], s.steps[5]] = [s.steps[5], s.steps[0]])],
    ...[0, 1, 2, 3, 5, 7, 9].map((index) => [
      `No mutable action at step ${index}`,
      (_w, s) => (s.steps[index].uses = s.steps[index].uses.replace(/@[a-f0-9]{40}$/, "@main")),
    ]),
  ]);
});

test("stage workflow guard confines verified WIF identity and each short-lived token to its command", () => {
  refuses(stageWorkflow, [
    ["No job-wide GitHub token", (_w, s) => (s.env.GITHUB_TOKEN = "${{ github.token }}")],
    ["No job-wide cloud token", (_w, s) => (s.env.STAGE_ACCESS_TOKEN = "${{ steps.stage-auth.outputs.access_token }}")],
    ["No GitHub token in push", (_w, s) => (s.steps[6].env.GITHUB_TOKEN = "${{ github.token }}")],
    ["No GitHub token in deploy", (_w, s) => (s.steps[8].env.GITHUB_TOKEN = "${{ github.token }}")],
    ["No cloud token in verification", (_w, s) => (s.steps[4].env.STAGE_ACCESS_TOKEN = "caller")],
    [
      "No deploy token in push",
      (_w, s) => (s.steps[6].env.REGISTRY_ACCESS_TOKEN = "${{ steps.stage-auth.outputs.access_token }}"),
    ],
    [
      "No registry token in deploy",
      (_w, s) => (s.steps[8].env.STAGE_ACCESS_TOKEN = "${{ steps.registry-auth.outputs.access_token }}"),
    ],
    ["No static secret credential", (_w, s) => (s.steps[5].with.credentials_json = "${{ secrets.GOOGLE_KEY }}")],
    ["No secret-backed configuration", (_w, s) => (s.env.STAGE_DEPLOYMENT_CONFIG = "${{ secrets.STAGE_CONFIG }}")],
    [
      "No unverified WIF provider",
      (_w, s) => (s.steps[5].with.workload_identity_provider = "${{ vars.OTHER_PROVIDER }}"),
    ],
    ["No unverified project", (_w, s) => (s.steps[7].with.project_id = "${{ vars.OTHER_PROJECT }}")],
    ["No production service account", (_w, s) => (s.steps[7].with.service_account = "${{ vars.PRODUCTION_ACCOUNT }}")],
    [
      "No swapped registry account",
      (_w, s) => (s.steps[5].with.service_account = "${{ steps.verify-stage.outputs.stage-deployer }}"),
    ],
    ["No credential file", (_w, s) => (s.steps[5].with.create_credentials_file = true)],
    ["No exported cloud environment", (_w, s) => (s.steps[7].with.export_environment_variables = true)],
    ["No longer credential lifetime", (_w, s) => (s.steps[7].with.access_token_lifetime = "43200s")],
  ]);
});

test("stage workflow guard requires fixed commands, failure propagation and bounded evidence upload", () => {
  refuses(stageWorkflow, [
    ["No omitted verification", (_w, s) => s.steps.splice(4, 1)],
    ["No repeated deployment", (_w, s) => s.steps.splice(9, 0, structuredClone(s.steps[8]))],
    ["No extra shell command", (_w, s) => s.steps.push({ run: "echo unreviewed" })],
    ["No alternate target argument", (_w, s) => (s.steps[8].run += " --production")],
    ["No shell failure suppression", (_w, s) => (s.steps[4].run += " || true")],
    ["No conditional verification", (_w, s) => (s.steps[4].if = "${{ false }}")],
    ["No ignored verification failure", (_w, s) => (s.steps[4]["continue-on-error"] = true)],
    ["No deploy after failed push", (_w, s) => (s.steps[8].if = "${{ always() }}")],
    ["No ignored deployment failure", (_w, s) => (s.steps[8]["continue-on-error"] = true)],
    ["Always retain failed stage evidence", (_w, s) => delete s.steps[9].if],
    ["No workspace/credential artifact", (_w, s) => (s.steps[9].with.path = ".")],
    ["No ambiguous artifact identity", (_w, s) => (s.steps[9].with.name = "stage")],
    ["No indefinite evidence retention", (_w, s) => (s.steps[9].with["retention-days"] = 90)],
  ]);
});
