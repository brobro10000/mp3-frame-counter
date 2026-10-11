# Bounded V1 delivery

Adopted by the coordinator on 2026-10-11 under the owner's instruction to prioritize an acceptable MVP and reach V1.
This amendment narrows the extended roadmap's implementation scope. Historical plans and deferred work remain retained.

## Completion boundary

V1 consists of the existing MP3 application and same-origin API documentation, reproducible two-container deployment,
automatic stage delivery after successful software publication, passing real hosted stage acceptance, an exact
human-approved production deployment, production smoke and a demonstrated recovery procedure. Keep the current upload
contract, all local acceptance and the frozen hosted suite. No new product features belong on this path.

Required sequence:

1. Finish the reviewed IAM correction and protected access-state migration; verify unchanged cost controls.
2. Add the smallest scoped federation, Cloud Run IaC and direct dependent stage job that use the existing identities,
   registry and state buckets. Validate the actual stage service and all 22 frozen stage cases.
3. Present the exact verified candidate to the owner. After human approval, deploy the same two image digests to
   production, run the three frozen production smoke cases, prove recovery and finalize the same source as v1.0.0.

Production application deployment remains a human gate, including authenticated or no-traffic candidates. A manual
owner-invoked operation is acceptable for V1 if an enforced private-repository environment gate is unavailable; describe
that limitation accurately. Stage credentials must have no production mutation or invocation authority. The bounded
project operation-read exception below is not service-level isolation. Do not represent readiness as deployment.

## Reuse existing delivery evidence

Use a job directly dependent on successful `publish-release` and `validate-product` in the existing main-push workflow.
Download the complete same-run prepared bundle using the pinned artifact action and the trusted product output name.
Check out the exact source with full history. Reuse `verifyReleaseBundle` and the independently transported original
admission digest, then compare its asset identities with the published release selected by the verified manifest.
Release failure blocks stage; stage failure preserves the software release and blocks promotion.

Transfer the exact tested images from their verified Docker archives without rebuilding. Record the registry digests,
source and applied configuration. Use existing required-suite selection and isolated extraction for hosted execution.
Read the destination and revision from the configured provider resource, validate identity before and after tests, and
send short-lived credentials only to that origin. Preserve cleanup and exact frozen inventories. Failed or incomplete
checks block promotion. Retain the previous good revision and serialize deployment/recovery.

The same-run workflow, protected main and GitHub artifact service supply acquisition authority for this bounded path. No
arbitrary URL, tag, artifact run or alternate acceptance suite may be selected by PR input. The tokenless metadata
replay module and generalized authenticated handoff adapter are deferred; do not implement parallel evidence
authorities. The existing publisher and handoff utilities remain available and their historical records remain
unchanged.

The ordinary CI publisher remains the software-release writer. A narrow exception permits the authenticated numeric
repository owner to call `finalizeV1Release(bundle, evidence, api, generatedDirectory)` from the existing publisher for
fixed same-source `v1.0.0`, after supervised production completion. The caller must first verify the original bundle
with its independent admission digest, resolve the required hosted profile projection from that source, and authenticate
the human approval, provider observations and demonstrated recovery. Hashes bind these supplied facts; they cannot
establish approval. The finalizer also observes the actual owner identity, original successful checks, protected-main
ancestry, published candidate tag and ten exact SHA-256/size identities, and rehashes the local bytes before writes.

Supply the closed `{projection, stage, production, approval, recovery, operation, productionStartedAt}` evidence record.
Both hosted inputs use the existing `validateHostedAcceptance` shape with their original suite results, launch IDs,
wrapper outcomes, observations and cleanup. Require all 72 local, 22 stage and three production cases. The approval
binds source, registry pair, both configurations, production resource, exposure and recovery evidence; stage precedes
approval, approval precedes production deployment, and smoke/recovery precede finalization. The distinct owner operation
retains its original `finalizedAt` on retries. Every production deployment still needs its own human event, including
authenticated and no-traffic candidates.

Finalization copies the ten original asset bytes unchanged and adds only `finalization.json`. Historical 0.x manifests,
checksums and notes retain their original meaning; the additive record carries the V1 evidence. The existing draft,
upload-only-missing, observed digest/size verification and publish-last mechanics apply. Conflicts fail before GitHub
writes, identical retries are read-only, and metadata publication failure is retried without redeployment. This exported
API performs no provider, image or deployment operations and adds no CLI override or automatic production job.

### Owner-supervised production smoke bridge

Import `runProductionAcceptance` from [scripts/production-acceptance.mjs](../../scripts/production-acceptance.mjs) only
after the owner has approved the exact candidate and a separately authorized operation has deployed it. Supply the
closed
`{root, bundle, admissionSha256, currentContext, images, release, stage, approval, operation, productionStartedAt, observe, mint, evidenceDirectory}`
interface. `currentContext` remains the original verified publisher CI identity. `operation` is exactly
`{id, attempt, sourceRevision}`, with a distinct `owner-operation:` ID; the finalization instant is supplied later to
the finalizer.

The caller must independently verify original bundle/publication custody and authenticate the human event, provider
reads and exposure/recovery bindings. An approval-shaped JSON object or matching hashes cannot establish authorization.
Pass the full stage custody input accepted by `validateHostedAcceptance`, including its original result and lifecycle
facts. The helper requires all 72 local and 22 stage obligations, resolves the original required frozen source, compares
the observed production resource/configuration/image pair to the approved candidate, and runs only its three-case
production wrapper. Provider and token callbacks must have bounded deadlines and authenticate the intended origin.

The helper performs no deployment, IAM, exposure, traffic, provisioning or GitHub write. It returns the validated
production envelope and retains only `production-acceptance-setup.json`, `production-suite-result.json` and
`production-acceptance.json` under the caller's owned `.artifacts` directory. Preserve those original result/custody
facts when preparing finalization evidence; do not reconstruct a passing result from an inventory. Missing, failed,
drifting or unclean execution blocks finalization. Scoped local bridge tests are not hosted smoke or a human event.

## Explicit deferrals

Defer reusable acquisition/replay infrastructure, automatic publication backfill, expanded queue syntax, additional
release-line milestones and optional platform abstractions. The partial metadata-replay tests are preserved as
unreviewed, uncalibrated work outside the V1 branch; they are not release evidence. Compatible maintenance and future
hardening can resume after V1. Do not defer an observed defect, secret handling, required acceptance, cost readiness,
exact image identity, recoverability or the human production decision merely to obtain a passing status.

## Delivery practice

Keep three detailed cards only. Merge a clean approved PR promptly after its required checks and prerequisites pass,
then immediately refresh its dependents onto actual merged main. Use disjoint agents for independent expectations,
implementation and review. Combine delivery plumbing into one governance/setup PR and one directly dependent runtime PR,
preserving the existing product/governance admission boundary. Run meaningful focused checks and required CI; do not
repeat already current checks without a change or unresolved failure. Claim each implemented, published and deployed
state only from observed evidence.

## Bounded service IAM amendment

The runtime root may own the service's two additive IAM memberships: its corresponding probe's `roles/run.invoker`, and,
only for stage, the stage deployer's service-scoped `roles/run.admin`. This explicit exception supersedes the
runtime-IAM exclusion in the earlier hosted-delivery policy. It permits no public principal, project-wide Run grant,
federation or cost policy in runtime. Owner credentials create the initial service and memberships in dependency order;
subsequent automation must target that existing stage service/state and preserve authenticated invocation. Production
has no automated stage membership. Independent source/plan expectations must enforce the exact roles and identities.

Federation stays in the existing access root, restricted to numeric repository/owner identities, protected main and the
exact main-push workflow. Only registry-writer and stage-deployer identities receive federation membership. A dedicated
project custom role may grant stage `resourcemanager.projects.get`, `billing.resourcebudgets.read` and required quota
usage via `serviceusage.services.use`; it cannot change budgets, billing or the cap. This permits reading single-project
budgets in the dedicated project, not per-budget IAM isolation. The delivery code reads only the two retained cost
identities. No billing-account viewer/admin role or production federation belongs in V1.

### Observed operation-poll correction — 2026-10-11

The [main PR #49 run](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38127133310) published its software
release but failed stage application. Private authenticated decryption of its exact-source diagnostic established a
complete native provider 403 denying `run.operations.get` on the expected project/region operation. The service had
advanced to generation 7; hosted acceptance had not run. Preserve that failure and reconcile observed state before
retry.

Append only `run.operations.get` to the existing project custom role and retain its three cost/read/usage permissions,
resource identity and stage-deployer binding. Google supports this permission in custom roles and identifies it as
deployment-status read authority; the pinned provider polls the separate project/region operation resource. See
[supported permissions](https://docs.cloud.google.com/iam/docs/custom-roles-permissions-support),
[deployment permissions](https://docs.cloud.google.com/run/docs/reference/iam/roles#deployment_permissions) and the
[pinned waiter](https://raw.githubusercontent.com/hashicorp/terraform-provider-google/v8.6.0/google/services/cloudrunv2/cloud_run_v2_operation.go).

This project grant permits reading known operations anywhere in the shared project, including production operations.
Their [response](https://docs.cloud.google.com/run/docs/reference/rest/v2/projects.locations.operations) can contain
metadata, errors or the updated resource configuration. It adds no operation listing/deletion, production service
mutation, IAM write or invocation. Do not describe it as stage-service-only read isolation or invent an unverified IAM
condition. Review and apply the exact IaC change, read back the role and unchanged cost controls, and require a fresh
automatic stage run with all 22 frozen cases before claiming delivery is repaired.

## Cloud Run public health compatibility — 2026-10-11

The real authenticated stage serves the UI, documentation and known-count upload, while the provider rejects public
`/healthz` before the request reaches NGINX. Google documents reserved ending-z paths and recommends avoiding them in
[Cloud Run's known issues](https://docs.cloud.google.com/run/docs/known-issues#reserved-url-paths). Internal container
probes and local `/healthz` behavior remain valid; those observations do not pass the frozen public HS-17 case.

The delivery consumers support exactly the historical `hosted-v1` and proposed `hosted-health-v1` revisions, with exact
required admission/declaration/report equality and unchanged 72/22/3 inventories. This compatibility adds no successor
binding or activation. Independently author and review the narrow successor, bind its actual protected-main merge, then
add the frontend-local `/health` alias as the activating product change. Preserve the original contract, suite Git
objects and failed hosted evidence. A candidate or pending binding cannot satisfy stage acceptance or finalization.
