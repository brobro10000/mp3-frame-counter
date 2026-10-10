# Cloud access foundation — bounded contract

Adopted 2026-10-10 under the owner’s IaC and continued-roadmap authorization. This source-only package prepares a
reusable access root; it creates no Cloud Run service or application deployment. Live application resources, federation
and environment updates remain separate packages. The existing cost bootstrap remains independently owned.

## Inputs and resource boundary

Pin Terraform 1.13.3 and `hashicorp/google` 8.6.0. Use only the five reserved files in `infra/cloud/access/`:
`versions.tf`, `variables.tf`, `main.tf`, `outputs.tf` and `.terraform.lock.hcl`. Initially use private local state
because a GCS backend cannot create its own absent bucket. A later reviewed amendment migrates this same root to a
protected operations bucket after actual creation and readback. Do not add a hidden backend override.

Require `project_id` explicitly; default `region` to `us-central1` and `registry_id` to `mp3-images`. Validate ordinary
Google project/region/repository identifiers and reject empty, whitespace, slash or control-containing values. Configure
provider project and billing project explicitly. All resource project fields use the supplied dedicated project. No
credential, billing-account, role, principal, arbitrary API or production-approval input belongs in this root.

Create only these resources:

- Five additional APIs: IAM, IAM Credentials, STS, Artifact Registry and Storage. Preserve them on destroy and never
  disable dependents. The cost bootstrap already owns Service Usage, Budget, Billing, Resource Manager and Run APIs.
- Three STANDARD state buckets named `<project_id>-tf-operations`, `<project_id>-tf-stage` and
  `<project_id>-tf-production` in the selected region. Require uniform access, enforced public-access prevention,
  versioning, seven-day soft delete, `force_destroy = false`, provider PREVENT and Terraform `prevent_destroy`. No
  retention lock or deletion/expiry lifecycle rule is selected before recovery requirements are reviewed.
- One regional STANDARD_REPOSITORY Docker registry using `registry_id`. Require provider PREVENT and `prevent_destroy`,
  dry-run cleanup with no deletion rules, mutable tags, and explicitly disabled vulnerability scanning. Deployment will
  use digests; a repository or tag alone proves no image provenance.
- Seven service accounts with fixed project-scoped IDs: `mp3-registry-writer`, `mp3-stage-deployer`, `mp3-stage-probe`,
  `mp3-stage-runtime`, `mp3-prod-deployer`, `mp3-prod-probe` and `mp3-prod-runtime`. Require PREVENT and
  `prevent_destroy`. No service-account keys or extra runtime API roles.
- Non-authoritative repository IAM: writer only for the registry-writer identity; reader only for stage and production
  deployers. Non-authoritative stage-bucket Object Admin only for the stage deployer; no automated access to operations
  or production state. Service Account User only from each deployer onto its corresponding runtime account.
- OpenID Token Creator only from stage deployer onto stage probe. Do not use general Token Creator. Actual Run viewer
  and invoker grants wait for the stage service to exist; mint permission alone cannot invoke a service.

Expose only resource names, registry URI and service-account email/name mappings. No token-producing data sources,
credentials, secrets, billing/cost mutations, authoritative IAM, project-level IAM, public principals, workload identity
pool/provider/grants, modules, provisioners, external programs or runtime resources are allowed. Federation will be
added only after its exact reviewed workflow, numeric repository/owner and environment claim contract exists. Production
identities receive no external impersonation grant in this package.

## Validation and operations

Independent tests precede implementation and use Terraform’s mocked Google provider in isolated temporary copies with
synthetic project inputs. They must check planned scope, state protections, IAM targets/roles, exact identities, safe
outputs and invalid inputs without cloud credentials or API calls. Include negative controls for dangerous protection,
IAM or resource-scope changes. Test results establish configuration semantics, not real IAM propagation or provider
behavior. Preserve failed evidence and separately run pinned formatting, initialization and validation.

Root owns `package.json`, narrow CI validation wiring and policy assertions needed to run these checks. Keep required
jobs, permissions, release triggers, admission classification, acceptance bytes and product configuration unchanged.
Normal exact-head companion review, mandatory CI and actual-main release verification precede operational use.

After merge, root may review an actual private plan under existing owner setup authority and apply only these resources
following fresh dedicated USD 75 shared Run-cap and USD 100 project-budget readback. Registry and state costs remain
outside the Run cap; the alerts are not an invoice ceiling. Keep state, variables, plans and cloud identifiers private.
Require actual resource/IAM readback and a no-change plan. An existing unrelated resource or unexpected action blocks
apply. Do not remove protections to make teardown pass: planned teardown needs an explicitly reviewed retention and
protection amendment. Do not create a production service or run an application candidate to finish this package.

## Protected GCS backend amendment — 2026-10-10

The separate ACCESS-BACKEND package selects one empty `backend "gcs" {}` directly inside the existing Terraform block in
`versions.tf`. This supersedes the initial local-backend source choice only after the amendment is independently tested,
reviewed and published. The remaining four files, 23 resources, IAM grants, outputs, provider pins and destruction
safeguards stay unchanged. No bucket, prefix, credential or backend override is committed.

An independent test author first amends the existing source guard to require exactly that empty block in that file and
position, with one literal `gcs` label. Every other backend occurrence remains forbidden. Preserve all prior resource,
IAM, lifecycle and native mocked-plan expectations. Add valid-counterpart refusal controls for absence, duplication,
another backend type, relocation, nonempty bucket/prefix/credentials/unknown arguments and nested content. Freeze the
reviewed amendment before a separate implementer changes `versions.tf`. Existing credential-free CI continues using
`init -backend=false` and isolated native mock tests; it must not initialize a real backend.

A GCS backend requires its bucket to exist. First setup therefore uses the published initial access root from PR #32 and
private local state, with current cost controls and a reviewed create-only plan. Do not initialize a new empty GCS state
owner to bypass that order. After actual resource/IAM readback, the published backend amendment may be copied into the
same owned working directory, retaining its existing state and protected backup.

Root supplies only the trusted operations bucket and an unused access-state prefix through a private backend-config
file. Confirm exact bucket protections, operator access and absence of unrelated destination state before migrating. Use
short-lived external authentication and `terraform init -migrate-state -lockfile=readonly` with that private config; do
not place credentials in backend options, automatically force-copy, or apply from two state owners. Verify matching
state lineage and all resources, explain any serial change, observe the stored object/version and backend locking, and
require a refreshed no-change plan before treating migration as complete. Retain private recovery copies. An uncertain
migration stops further apply until both local and remote state have been reconciled.

This package authorizes no new resource, grant, workflow, production operation or runtime deployment. Backend source
tests prove the declaration and preserved mock semantics; only the later recorded migration/readback proves live state
custody. Ordinary destruction and lock removal remain outside this amendment.

## Provider default normalization amendment — 2026-10-10

The first authorized access apply created all 23 planned instances. Its immediate readback plan proposed only adding
`docker_config { immutable_tags = false }` back to the registry. Provider 8.6.0 omits the empty false configuration in
its API request and flattens an absent response to an empty list. This recorded failed no-change check is not ignored.

The bounded correction omits the entire optional `docker_config` block and retains the provider/API default of mutable
tags. Do not use an empty block, `ignore_changes`, a provider upgrade or immutable tags to conceal the difference. An
independent author must amend the plan oracle to require an empty Docker-configuration list and add meaningful refusal
controls for explicit overrides before a separate implementer removes the three source lines. Preserve the original
expectation and observed failure, all IAM/deletion safeguards and the exact 23-resource/five-output boundary.

This extends ACCESS-BACKEND's source scope to `main.tf` only for that default normalization. Before remote migration,
verify the actual API omits or reports false immutable tags and a fresh reviewed plan has no resource actions. If the
correction needs any provider mutation, stop and review its exact plan separately. Terraform's original private state
and the failed readback remain retained. Backend migration, locking and production deployment remain separate gates.

## Additional operational gate: default project identities

The initial authenticated resource/IAM readback matched all seven declared direct IAM grants and all resource identity,
protection and output checks. Its project-IAM check failed because the default Compute identity has a broad Editor
grant, alongside additional Google service-agent roles. No pre-apply project-IAM snapshot establishes their provenance.
The Editor role can inherit bucket access through Google's project-editor convenience bindings.

**ACCESS-IAM-DEFAULTS** must reconcile exact default identities and workload dependencies before remote-state migration
or automated deployment credentials become trusted. Prefer a separately reviewed IaC correction; preserve owner access,
necessary service agents and the seven declared resource-scoped grants. Do not delete accounts, enable unrelated APIs,
remove unknown bindings or treat a current failed audit as passed. This remains outside the
backend/default-normalization source amendment and does not require a product change.
