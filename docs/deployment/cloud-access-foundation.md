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
