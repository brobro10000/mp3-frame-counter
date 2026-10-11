# ACCESS-IAM-DEFAULTS: remove inherited project Editor access

Adopted by the coordinator under the owner's IaC and roadmap authority, 2026-10-11. This narrow corrective prerequisite
addresses a failed access-foundation readback before remote state is trusted. It does not grant deployment authority.

## Observed problem and selected ownership

The initial access root created its declared 23 resources. Its independent API audit found the dedicated project's
default Compute account in an unconditional `roles/editor` binding. Default bucket convenience bindings can give that
project role access to operations and production state. The audit's failure remains recorded; there is no evidence
attributing creation of the grant to a particular operation because no pre-apply project-policy snapshot exists.

Keep the correction in the existing **local bootstrap root**, which owns the project and Resource Manager API. Putting
it in the access root would create a cycle: its newly declared remote backend needs trusted bucket access before the IAM
correction could be evaluated. Do not remove a backend temporarily, create an untracked override or migrate first.
Bootstrap grows from seven managed resources to eight; access remains exactly 23 resources with five outputs.

Add exactly one `google_project_iam_binding.no_project_editors` in `infra/cloud/bootstrap/main.tf`:

- `project = google_project.application.project_id`
- `role = "roles/editor"`
- `members = []`
- `depends_on = [google_project_service.bootstrap["cloudresourcemanager.googleapis.com"]]`
- `lifecycle { prevent_destroy = true }`

Use the existing default Google provider. No condition, provider override, arbitrary role/member variable, service
account rename, broad project policy or additional grant belongs in this amendment. Preserve the seven original
resources, variables, two sensitive outputs, provider separation/pins/lockfile and all deletion protections. The USD 100
alert remains on the budget-provider alias; the separate USD 75 Run cap retains its REST owner and exact identity.

Pinned provider 8.6.0 supports an empty members set and preserves the binding's identity when the role is absent on
readback. This supplies refresh/plan drift detection, not continuous enforcement. Its default-account DEPRIVILEGE
resource is unsuitable here: the observed display name differs from its recognized names. Do not rename an account or
use that create-only mechanism as a workaround. Preserve unrelated owner and Google service-agent bindings.

## Independent expectations and bounded source scope

A separate author writes `scripts/cloud-bootstrap-iam.test.mjs` before implementation. Copy only the four bootstrap
Terraform files and reviewed lockfile into fresh temporary fixtures; never copy private variables, state, credentials or
caches. Use native Google mocks for both default and budget aliases, synthetic identities and pinned Terraform
1.13.3/Google 8.6.0. Permit a verified provider cache as a read-only installation input, never live credentials.

Require exactly eight planned addresses: the project, Service Usage, four existing API instances, unchanged alert budget
and sole empty Editor binding. Verify both original sensitive outputs and their identity expressions. Require the
binding's planned project/role/empty members/no condition; independently inspect source for the literal target,
destruction safeguard and Resource Manager dependency. A second valid synthetic project proves portable selection.

Keep literal budget amount, gross-cost scope, thresholds, API flags and project safeguards. Negative controls must
reject extra resources/full project policy, another role, nonempty members, a condition, wrong target/reference,
missing/false protection, a hidden backend and executable source escapes. Each mutation belongs only in a disposable
fixture, has a passing counterpart and must fail at the intended guard. Bootstrap legitimately uses two provider
configurations and a fixed dynamic budget-threshold block; do not apply an incompatible access-root parser unchanged.
Preserve availability/behavioral reds truthfully and review expectations before separate implementation.

Root owns the one source addition, purpose comment, explicit tooling registration, mandatory policy inclusion and narrow
README/phase/validation prose. No existing cap/access tests, workflows, dependencies, product or frozen acceptance
evidence may change. Focused tests, unchanged relevant cap/access checks and mandatory CI precede companion approval and
owner merge. A mock proves source/plan decisions, not preservation of live IAM or convergence.

## Separate saved-plan operation after publication

Use the published source and existing **local** bootstrap state. Refresh the dedicated project's actual IAM policy:
Editor must contain only the known default Compute identity without a condition. Verify all unrelated owner/service
agent tuples and seven scoped access grants against retained observations. Record stable identifiers privately.

Refresh the global Run-service inventory and Compute API status. Prior reads found no Run services and disabled Compute.
Root accepts that bounded inventory for this newly created dedicated project; it does **not** prove no Compute instances
or other consumers exist, and does not authorize enabling APIs merely for discovery. Changed workload or policy evidence
stops the narrow operation for reassessment. Recheck the exact USD 75 cap/USD 100 alert and billing readiness
immediately before the plan/apply sequence; no changed cost identity or limit is allowed.

An independently reviewed saved plan may create only the empty Editor binding; the original seven managed resources must
be no-op. Apply only those reviewed bytes. Independently re-read the entire project policy, prove Editor absence and
exact preservation of unrelated tuples, verify scoped resource grants, then require a bootstrap no-change plan. Preserve
every failed plan/readback. The separate registry-default amendment must also converge before access-state migration;
this correction does not itself migrate state, configure federation or deploy a service.

Removing this declaration does not restore Editor. Recovery preserves evidence and local state; any regrant requires a
new explicit owner decision and review. Do not automatically restore a broad privilege or remove safeguards to make a
rollback pass. Normal source review/merge and actual IAM mutation remain separately evidenced steps.
