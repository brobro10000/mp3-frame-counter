# Release and recovery runbook

**Current execution update, 2026-10-10:** [PR #8 completed PLAN-01](../validation/roadmap-execution.md); PR #9
subsequently merged and published v0.1.9. The dedicated project and monthly cost controls have passed live readback. The
owner authorized [continued roadmap execution](../phases/roadmap-execution-authorization.md), IaC, billing setup and
automatic stage delivery. Every production application deployment/promotion still requires human approval of its exact
candidate. Software releases continue independently of deployment; no stage or production deployment is currently
established.

The [source-bound version policy](version-policy.md) supersedes the original fixed-`0.1` allocator described below for
sources containing an admitted policy. VER-01 introduces line `0.1`; a separate activation is required for `0.2`. Legacy
source identities and byte-for-byte retries remain intact. The original deployment-before-release wording below is
historical: software releases continue independently under the current release-only authority.

## Stage configuration and log privacy

**Operating amendment, 2026-10-11:** store the existing closed stage JSON in the repository Actions secret
`STAGE_DEPLOYMENT_CONFIG`. The stage job reads that exact secret as its sole configuration input, so Actions registers
masking before printing step environments. The existing nonempty repository variable remains only a readiness condition;
its value does not supply deployed configuration, and there is no variable fallback. Validate the secret's configuration
before enabling delivery. Missing or malformed configuration fails verification before cloud authentication.

The billing account ID identifies an account; it does not grant billing access. It previously appeared because the
entire configuration was a job-wide variable, which Actions renders unmasked. Keep identifiers out of routine logs even
when they are not credentials. The delivery controller retains sanitized outcomes and configuration hashes, without
printing provider bodies or configuration values. Cloud credentials still use scoped, short-lived federation; this
configuration secret contains no cloud key and changes no IAM, cost limit or production authority.

Failed Terraform initialization, planning, plan reading or application may retain a closed `command-failure.json` record
after private temporary storage is successfully removed. It contains only the fixed operation name, exit code and
`run.operations.get` when a complete standard provider error explicitly denies that permission. Raw provider text stays
in bounded memory; truncated text cannot establish a denial. This diagnostic does not authorize a permission change or
establish a successful deployment. Retain the failed outcome and investigate before changing access.

The pinned Google provider 8.6.0 wraps operation-poll errors with `error while retrieving operation` and then
`Error waiting for Updating Service`. Recognize that exact wrapper as well as bare 403 and structured code-7 errors; all
still require the complete literal permission denial. See the
[pinned operation waiter](https://raw.githubusercontent.com/hashicorp/terraform-provider-google/v8.6.0/google/tpgresource/common_operation.go).
Synthetic wrapper coverage establishes diagnostic compatibility, not the cause of a historical deployment failure.

The current checkout policy permits only this one exact secret reference. Historical release verification still admits
the original variable-backed workflow without rewriting its bytes or reservations. This change protects future output;
existing logs retain their original content. See
[GitHub's variable masking behavior](https://docs.github.com/en/actions/concepts/workflows-and-actions/variables) and
[Actions secret usage](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

## Dedicated project and cost-control prerequisite

Use the [bounded bootstrap](../../infra/cloud/bootstrap/README.md) and its
[completed COST-BOOTSTRAP evidence](../validation/cloud-cost-bootstrap.md) before billable application resources. Its
source creates one dedicated project, required APIs and a USD 100 monthly all-service alert budget, then a separately
owned USD 75 monthly Cloud Run spend cap shared by stage/production. Project creation must precede its scoped budget.
Initial Terraform state remains ignored and private on the operator machine until a reviewed backend migration after
live cost-control verification.

The initial reviewed apply created seven Terraform resources. The separate cap was created once and verified again using
its recorded identity: USD 75, one project, Cloud Run only, `CONFIGURED` and no pending reconciliation. The USD 100
all-service monthly alert budget and active billing association were independently read back. Before each later runtime
setup/deployment, repeat the exact-identity cap check; these observations are point-in-time evidence. Missing, lifted,
enforced, ambiguous or unready cap state blocks runtime setup. Never automatically raise, lift or delete the cap. See
[bootstrap validation](../validation/cloud-cost-bootstrap.md) for source-check coverage and remaining prerequisites.

The USD 100 alert budget uses default billing IAM emails; the owner's recipient-eligible billing role was verified, but
actual threshold-email delivery has not been observed. The USD 75 cap additionally requires project-owner notifications.
Preserve USD 25 headroom for registry, logs, state and enforcement delay, but do not represent this as a strict invoice
ceiling: reporting lag, in-flight charges and ancillary services can exceed it. Ordinary Terraform destruction is
intentionally blocked; teardown requires a separate reviewed operation preserving cost controls until remaining paid
resources are accounted for. No release workflow receives bootstrap cost-admin permissions.

## Roadmap deployment direction

**Planning supersession, 2026-10-10:** follow the
[roadmap's stage-to-production design](../roadmap/README.md#stage-to-production-delivery) for the conditional Cloud Run
path. It uses one revision containing both images per environment, human approval before production application
deployment, authenticated production identity verification, approved exposure, authority, observed smoke and additive
v1.0.0 finalization. The Render-specific ordering below remains historical alternative guidance; it is not the Cloud Run
pair-switch procedure. Ordinary v0.x artifact publication continues without deployment. No provider commands or
finalization workflow are implemented by this documentation amendment.

The cost-bootstrap foundation checks use pinned Terraform formatting, backend-disabled lockfile-read-only provider
initialization and validation without credentials, plan or apply. These checks passed in
[PR #9's main run](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38033869422); see the
[dated validation record](../validation/cloud-cost-bootstrap.md). Hosted delivery workflows, registry handoff, stage
acceptance and production approval/promotion remain later work.

## Historical Render procedure and release-only baseline

The remaining sections preserve the earlier Render-oriented procedure and its original release-only restrictions. Apply
the current execution amendment and Cloud Run roadmap above where they supersede that history. In particular, current
GitHub software publication does not wait for deployment, normal reviews use the automated companion, and production
application deployment always retains the owner's human gate.

**Original future deployment procedure:** the later [release-only amendment](../requirements/release-process.md) defers
these provider, candidate and production actions. Use the [release-only process](release-only.md) for current GitHub
releases. Publishing a repository release does not execute this runbook or establish hosted verification.

Status: **local application verified; managed release pending**, supporting APP-REL-001–006 and APP-V1-012,014,015. The
[P4 evidence](../validation/p4-integration.md) records actual local execution. Provider deployment, promotion and
recovery commands/workflows do not yet exist. The [provider evaluation](../architecture/deployment.md) and
[acceptance baseline](../testing/independence-and-baseline.md) are prerequisites, not proof of release readiness.

## Setup and release gates

Before cloud-specific work, approve provider fit, exact account/environment/region, budget, resource/time limits,
candidate access, credentials and recovery policy. Verify actual API permissions and GitHub plan capabilities; never
assume GitHub OIDC is supported by the provider. Use least-privilege supported credentials in trusted release steps. PR
jobs receive no deploy/admin secrets and never execute untrusted code in privileged pull_request_target contexts.

Use one authoritative protected-main release path. Gate or disable competing provider Git auto-production only in a
separately authorized setup action. Serialize promotions and rollbacks; do not cancel an operation after it may have
updated one service. A newer release cannot race an older retry into replacing production.

GitHub
[environment documentation](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
(read 2026-10-09) restricts required-reviewer gates for private repositories on Free/Pro/Team. The actual account's
entitlement has not been verified. If an enforced environment reviewer gate is unavailable, use an explicitly recorded
owner approval and an owner-invoked trusted release operation bound to RELEASE_ID. This is a **manual process gate**,
not equivalent to an enforced independent reviewer. Scope credentials accordingly and report the limitation. The PR
review override does not authorize production promotion, agent merging or automatic approval.

The local preparation policy uses preview versions `0.1.<first-parent ordinal of the tested source commit>` and requires
complete Git history. The protected linear-main equivalent advances only for an eligible, validated application release;
gaps for non-release commits are allowed. A branch preview is provisional and cannot be published as a successful
release. Reserve identity deterministically and reject reuse with different bytes. Publish a `v<version>` tag and
private repository release only after deployed verification. The root package's tooling version is not the application
release identity. Public package publication is unnecessary.

## Compact release manifest

Retain one JSON/CI artifact per release, not a database. The [local manifest](preparation.md) now binds tested source,
suite, local configuration, image IDs and exported archive checksums; provider and approval fields remain unknown. The
complete managed record still requires: unique release/version ID, source SHA, suite baseline SHA, fixture manifest
hash, frontend/API immutable digests, provider service/deployment IDs, build platform, environment and nonsecret
configuration revision/hash, approved production differences, candidate URL/verification run, production approval
actor/time/reference bound to that identity, production run/smoke, prior known-good manifest and outcome/recovery
evidence. Unknown values stay unknown and block the corresponding gate. No secret values or hashes of low-entropy
secrets. Source SHA alone does not identify tested binaries.

Keep current and previous known-good artifacts and enough evidence for the approved recovery window. Registry retention
must preserve the exact digests required for repulls; do not assume the provider stores old images. Candidate cleanup
may remove only explicitly identified abandoned resources, after evidence retention and without touching production or
prior-good artifacts. Approve retention duration/TTL and cost thresholds during P5 setup.

## Ordered operation

1. Validate the scoped PR with the stable fail-closed gate. From P4 onward build both images and run the trusted suite
   through local frontend ingress. Host/CI owns startup, bounded readiness and cleanup even on failure. Failed,
   cancelled, unexpectedly skipped or missing mandatory dependencies block release.
2. Obtain human review or the explicitly invoked owner review exception, then merge through core protections only when
   separately instructed. Agents never enable auto-merge. Validate the actual merged SHA rather than a stale PR build.
3. Build or identify the merged frontend/API pair by immutable digests. Record exact output identities, build platform
   and configuration. Verify independent image builds and retain artifacts needed for recovery.
4. Deploy the pair to the identified candidate environment only. API first, then frontend with a candidate-only private
   upstream. Await bounded service health/deployment readiness; no candidate route may silently reach production.
5. Resolve BASE_URL from trusted provider output, validate allowed host/scheme/redirect destinations before attaching
   protected headers, and run the same independent functional baseline through the real public ingress, including
   uploads above 1 MiB, around 6 MiB, exact 20 MiB, +1 and actual-byte cases. Execute approved fault cases only in
   controlled targets. Provider readiness, a login page, direct API success or a tiny upload is not full acceptance.
6. Bind evidence to source, suite, fixtures, both artifacts, configuration and environment. Review production-intended
   configuration differences; validate equivalent intended routing in a nonproduction context. Request explicit
   production approval for that exact release manifest. Any artifact/configuration change invalidates affected evidence.
7. Promote the tested immutable pair without rebuilding. For the proposed Render path, update production API to the
   approved digest, verify readiness/compatibility, then update frontend to its digest and production-only upstream. No
   atomic pair switch is assumed. Both old/new frontend and API combinations must preserve the V1 HTTP contract during
   overlap; if not, stop for an approved maintenance/switch design. A provider rebuild creates a new candidate requiring
   verification before exposure, even if its source SHA matches.
8. Confirm deployed identities/configuration, UI availability and one small independent known-count upload. Production
   smoke excludes boundary/stress and destructive fault tests. On success record the new known-good release, publish its
   successful version/tag/release notes and link the actual workflow/deployment evidence.
9. On failure, stop further promotion, preserve evidence and follow the approved recovery branch below. Do not report
   partial rollout or a pending smoke as deployed success. Show failure through the release workflow/provider status
   visible to the owner; notification integrations are not created by this plan.

Candidate-access credentials remain only in the trusted runner. Never put them in URLs, images, frontend assets,
screenshots, browser traces or published artifacts. Reject unexpected redirects before forwarding authorization. Keep
logs to request outcome/status/timing and release identity; omit raw audio, user filenames and sensitive headers.

## Partial failure, rollback and first-release abort

For an existing production pair, retain old API/frontend compatibility throughout overlap. If API rollout fails, leave
or restore its prior digest and do not advance frontend. If API succeeds but frontend fails, halt the sequence, restore
frontend if it changed, then restore the prior API. For a complete release that fails smoke, restore the previous
frontend then API under the approved compatibility policy, validate actual deployment IDs and run recovery smoke. Record
both services' before/after identities; one service rollback is not pair recovery. If any restore fails, stop, withdraw
affected exposure where authorized and report the unresolved state. Do not automatically retry indefinitely.

Render documents per-service replacement, health gating and SIGTERM/draining, with a default 30-second shutdown delay;
these are not transactional guarantees across services. Reconcile application request deadlines with the configured
provider drain window. See [deploy lifecycle](https://render.com/docs/deploys) and
[rollback semantics](https://render.com/docs/rollbacks), read 2026-10-09.

The first production release has no previous known-good pair. On failure, stop the new service or withdraw the new
public route using the approved provider procedure, keep its evidence/artifacts, verify that the failed app is no longer
publicly exposed, and leave it explicitly unreleased. Do not name this a successful rollback to a nonexistent version. A
recovery rehearsal in an authorized candidate environment must precede first-MVP completion, with observed before/after
identities and checks. A written runbook alone does not satisfy APP-REL-006.

## Local and future Make interface

The local targets through `validate-sample` are implemented and exercised in P4. The cloud targets remain requirements
for P5 and are **not working commands today**. Make delegates to versioned npm/Compose/test/provider commands, documents
prerequisites, quotes paths and propagates nonzero exits. It never installs host tools implicitly and is not a security
boundary.

`make prepare-release` is also implemented locally. It verifies a passed clean-source report and exports its exact
retained images without rebuilding, with deterministic preview version, manifest and archive checksums. It never deploys
or publishes; see the [preparation guide](preparation.md) and [execution evidence](../validation/p5-preparation.md).

| Target                                        | Planned contract                                                                                     |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| make help                                     | List commands, prerequisites and environment boundaries.                                             |
| make up                                       | Build/start both local app containers, await health with timeout, print loopback URL; never deploy.  |
| make down                                     | Remove only this Compose project's resources; no global prune.                                       |
| make logs / make ps                           | Inspect the two local services.                                                                      |
| make check                                    | Real phase-appropriate formatting, lint, type, unit and build checks.                                |
| make e2e-check                                | Harness/fixture/negative-control checks, never application acceptance.                               |
| make e2e                                      | Build an isolated local pair and run the complete frozen suite with owned fault control and cleanup. |
| make smoke FILE="..." EXPECTED=...            | Loopback frontend upload with an independently known count; cannot target production.                |
| make validate-sample                          | Verify the ignored sample identity and local upload against the recorded independent count of 6,090. |
| make deploy-candidate / make verify-candidate | Explicit provider/environment/release identity, readiness and full candidate suite.                  |
| make promote RELEASE_ID=...                   | Only exact tested and approved pair/configuration; no ambiguous latest.                              |
| make rollback RELEASE_ID=...                  | Explicit prior-good pair/environment, approved recovery and verification.                            |
