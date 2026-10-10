# Dedicated project and cost-control bootstrap

This configuration creates a dedicated billed project, five enabled APIs and a **USD 100/month all-service alert
budget** through Terraform. A separate declarative reconciler owns a **USD 75/month Cloud Run spend cap**, shared by
future stage and production in that project. It provisions no application services, public endpoints, registry, workload
federation, storage, credentials or deployment workflow. The dedicated project and cost controls were applied and read
back on 2026-10-10; see the
[live verification record](../../../docs/validation/cloud-cost-bootstrap.md#live-bootstrap-and-readback--2026-10-10).

The owner's [execution amendment](../../../docs/phases/roadmap-execution-authorization.md) authorizes the monthly cost
boundary and IaC direction. Obtain current companion approval and merge this bounded bootstrap before a live apply. This
cost prerequisite follows PLAN-01 independently of GATE-01; it does not alter acceptance policy. Human approval remains
mandatory for every production application deployment. PLAN-01's completed review/merge/publication is recorded in the
[roadmap execution record](../../../docs/validation/roadmap-execution.md). PR #9 subsequently merged and published
v0.1.9 before the live verification recorded below.

## What the controls establish

Cloud Run's cap pauses new usage when estimated gross monthly spend reaches USD 75. Reporting delay, in-flight usage and
continuing fixed costs can cause overage. The USD 25 remainder is planning headroom for registry, logs, state and
enforcement delay. The USD 100 total budget sends notifications; it does not enforce an account-wide invoice ceiling.
The cap automatically resets next month. Both environments share its service-wide limit. These controls do not cover
unrelated projects or subscriptions outside Google Cloud.
[Google spend-cap behavior](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps).

Terraform owns only the project, APIs and alerts-only budget. The JSON template and Node reconciler own the separate
cap. Released Google provider **8.6.0** lacks `spendCap` support; do not invent a provider block or import the cap under
incomplete management. A later provider migration must transfer sole ownership after an independently reviewed plan.
[Released provider resource source](https://raw.githubusercontent.com/hashicorp/terraform-provider-google/v8.6.0/google/services/billingbudgets/resource_billing_budget.go).

The alert budget uses gross project costs and current-spend thresholds of 50%, 75%, 90% and 100%, plus a forecast 100%
threshold. It uses default billing IAM email recipients: Billing Account Administrators and Billing Account Users.
Verify that the intended owner receives those emails; project-only ownership does not receive this budget's alerts. The
cap separately uses the required 50%, 80% and 100% current-spend thresholds, project recipients and one Cloud Run
service scope. [Spend-cap API requirements](https://docs.cloud.google.com/billing/docs/how-to/budget-api-spend-cap).

The pinned provider requires a Pub/Sub topic or monitoring channel if `all_updates_rule` is present, so that block is
omitted from the alerts-only budget. No notification infrastructure is added just to satisfy the schema. Default billing
email delivery is retained; the cap's project-owner notifications remain explicitly required by its REST manifest.
[Released provider notification schema](https://raw.githubusercontent.com/hashicorp/terraform-provider-google/v8.6.0/google/services/billingbudgets/resource_billing_budget.go).

## Files and boundaries

| File                          | Responsibility                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `versions.tf`                 | Terraform 1.13.3 and Google provider 8.6.0 pins; bootstrap and quota-project provider separation. |
| `variables.tf`                | Required private identities and explicit verification of USD billing currency.                    |
| `main.tf`                     | Dedicated project, API dependencies and USD 100 alerts-only budget with destruction safeguards.   |
| `outputs.tf`                  | Private trusted identity handoff; no credentials in Terraform variables or outputs.               |
| `cloud-run-cap.template.json` | Portable fixed USD 75 desired cap; actual project number rendered from trusted output.            |
| `cap-reconciler.mjs`          | Default read-only verification; explicit initial creation after complete absence discovery.       |
| `cap-reconciler.test.mjs`     | Deterministic injected-adapter tests with synthetic identities; no real network or credentials.   |
| `.gitignore`                  | Provider cache, plans, state, private inputs and local overrides remain untracked.                |

`main.tf` enables Service Usage first, then Cloud Billing, Resource Manager, Billing Budgets and Cloud Run. Merely
enabling Run creates no Run service. Service activation may enable platform dependencies. No Compute API or network
management is requested: the project resource's default-network behavior is left at its provider default. Do not enable
Compute or rely on an automatically created network as part of this bootstrap. A future network requirement needs its
own reviewed IaC.
[Project resource behavior](https://raw.githubusercontent.com/hashicorp/terraform-provider-google/v8.6.0/website/docs/r/google_project.html.markdown),
[API resource behavior](https://raw.githubusercontent.com/hashicorp/terraform-provider-google/v8.6.0/website/docs/r/google_project_service.html.markdown).

## Prerequisites before a live plan

- A newly selected dedicated project ID and display name; do not reuse an unrelated project or hardcode personal IDs.
- Active owner-selected billing with verified payment readiness and actual USD currency. The confirmation variable
  records an operator check; it cannot inspect the billing account by itself.
- Project creation and billing-association authority; service enablement/use and ordinary budget administration. Cap
  creation additionally needs the documented spend-cap permission such as `billing.budgets.configureSpendCap`.
- An owner-authorized short-lived credential supplied in memory through `GOOGLE_OAUTH_ACCESS_TOKEN`. Keep it out of
  command arguments, shell history, Terraform variables, logs and files. Do not print or trace the environment.
- Bootstrap API quota and Service Usage readiness. The new project cannot be used for quota before creation; the budget
  provider deliberately uses its quota only after required API enablement. A quota/permission failure is a concrete
  prerequisite to resolve, not permission to alter global CLI configuration.
- Use the checked-in provider lockfile from authorized initialization; Terraform verified the provider's HashiCorp
  signature. It includes `linux_amd64` and `darwin_arm64` package hashes so CI can initialize read-only. When adding an
  operator platform, use reviewed `terraform providers lock -platform=OS_ARCH` output instead of letting CI rewrite
  locks. See the [validation record](../../../docs/validation/cloud-cost-bootstrap.md) for local results and limits.

Google provider authentication accepts the environment access token without placing it in a Terraform input variable.
When the token expires, obtain a new owner-authorized token in memory and retry the read-only plan. Do not add service
account keys or permanent credentials to make bootstrap work.
[Provider authentication and quota configuration](https://raw.githubusercontent.com/hashicorp/terraform-provider-google/v8.6.0/website/docs/guides/provider_reference.html.markdown).

## Reviewed execution sequence

The following commands describe the reproducible operator workflow. The initial run is recorded separately. Run within
the reviewed bootstrap directory using a private operator session. Set `umask 077` before producing private files. Keep
the directory on protected local storage. The checked-in `.gitignore` is a backup control, not encryption.

1. Supply required variables through a private `bootstrap.tfvars`; leave credentials out. Confirm USD currency and
   billing readiness independently. Do not paste private inputs into PRs or review logs.
2. Initialize the pinned provider, verify the downloaded provider checksum/lockfile and review that lockfile. Run
   `terraform fmt -check` and `terraform validate`. Keep initial state local and private; creating a remote state bucket
   before the cost controls would reverse the required bootstrap order.
3. Generate a saved private plan with `terraform plan -var-file=bootstrap.tfvars -out=bootstrap.tfplan`. Review that it
   creates only the dedicated project, five API resources and one alerts-only budget. The project necessarily exists
   before its number can scope the budget; Terraform dependencies enforce project → APIs → alert budget.
4. Apply only the reviewed saved plan. Inspect the resulting project/billing/API/budget state. A partial apply must be
   resolved through refreshed state and another reviewed plan; never create application resources to test readiness.
5. Run `terraform output -json cap_config > cap-config.private.json` under the restrictive umask. The output is private
   deployment metadata. It contains no token. Review the trusted project/account mapping before first cap creation.
6. Run `node cap-reconciler.mjs --config cap-config.private.json` first. Only a complete inventory can establish that
   the cap is missing. A returned `missing` status exits 2 and never authorizes runtime deployment.
7. If initial creation is reviewed and the cap is genuinely absent, run
   `node cap-reconciler.mjs --config cap-config.private.json --create` once. This permits one POST and an independent
   readback. Retain its exact `resourceName` in the private configuration after success. Subsequent checks use that
   exact resource and fail if it disappears. No credentials are written by the reconciler.
8. If creation is uncertain, do not run `--create` again. Use read-only discovery, record the unique observed identity
   and wait for a later read-only check to prove readiness. A converging or enforced cap is never a successful gate. If
   discovery remains empty, resolve the uncertain operation with the provider before explicitly retrying creation.
9. Only `ready` with the expected exact identity, USD 75 amount, scope and `CONFIGURED` output state permits the next
   reviewed registry/state/IAM bootstrap. A later card should migrate local state to a dedicated protected backend,
   checking backup, access, locking and bounded version retention before removing local recovery copies.

The CLI reads only `GOOGLE_OAUTH_ACCESS_TOKEN` for authentication, retains it only in process memory and sends it to
`https://billingbudgets.googleapis.com`. Redirects fail, responses are bounded, requests time out and errors omit raw
response bodies. It does not invoke gcloud, inspect 1Password or save credentials. Exporting an access token in a shell
still makes it available to child processes; use a narrowly scoped private operator process without tracing.

The reconciler never patches an existing object, including a lower USD 50 cap or higher USD 100 cap. Either is reported
as drift requiring an explicit review. It never lifts enforcement, deletes controls or raises limits. If an existing
service-scoped alerts-only budget occupies the target scope, it fails rather than silently converting or replacing it.
Preserve the exact cap identity separately from Terraform state. A deployment identity should have only the read
permissions needed for readiness checks, never the authority to weaken the controls.

The readiness check is point-in-time evidence. It cannot prevent an independently authorized administrator from changing
the cap afterward. Later deployment CI must check the recorded identity immediately before stage work and preserve a
protected cost-management identity separate from stage/production permissions.

## Import, recovery and human-controlled teardown

Import an existing matching **ordinary alert budget** only after declaring the correct scope and reviewing the object:
`terraform import google_billing_budget.application_total billingAccounts/BILLING_ACCOUNT_ID/budgets/BUDGET_ID`. Use
real identities privately and require a following plan with no replacement, deletion or scope change.
[Provider import formats](https://raw.githubusercontent.com/hashicorp/terraform-provider-google/v8.6.0/website/docs/r/billing_budget.html.markdown).

Every managed resource has `prevent_destroy`, and the provider deletion policies are `PREVENT`; API resources also use
`disable_on_destroy = false`. **Ordinary `terraform destroy` is intentionally blocked.** IaC provides a reviewable
resource inventory, not unconditional automatic teardown. Removing a block from configuration can remove Terraform's
lifecycle guard, so retain the provider/state protections and independent plan review as well.

Decommissioning requires a separate owner-reviewed operation: stop application delivery, verify remaining billable
resources, preserve required release/recovery evidence, remove resources in reviewed order and disable billing only when
intended. Change destruction safeguards deliberately in that operation. Do not remove or lift the spend cap while
uncontrolled billable resources remain. An enforced cap may require a specific owner/provider action before deletion;
the reconciler offers no bypass. Do not delete an unrelated billing account or use `terraform state rm` as a teardown
substitute. When abandoning management is truly intended, review that operation and its remaining charges explicitly.

## Validation

Validation results are recorded in the [bootstrap record](../../../docs/validation/cloud-cost-bootstrap.md).
Deterministic tests prove local decision behavior, not current account permission, real API acceptance, cap enforcement
timing or the final invoice. Live observations are recorded separately from these source checks. The integrated tooling
command includes cap tests. Foundation CI adds pinned Terraform 1.13.3 setup, `terraform fmt -check`,
`terraform init -backend=false -input=false -lockfile=readonly` and `terraform validate`, with no cloud credentials,
plan or apply. PR #9 main CI passed these checks and published v0.1.9. The later live drift check exposed an API
default-field normalization: its response omits `ownershipScope`, so explicit `ALL_USERS` caused a repeated no-op plan.
The optional field is now omitted; Google defines unspecified ownership as equivalent to `ALL_USERS`. A refreshed live
plan then returned exit 0 with no changes, without applying another cloud mutation.
[Ownership semantics](https://docs.cloud.google.com/billing/docs/reference/budget/rest/v1/billingAccounts.budgets#OwnershipScope).
