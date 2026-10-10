# Cost bootstrap validation — 2026-10-10

The [bounded bootstrap](../../infra/cloud/bootstrap/README.md) is now integrated as source under
`infra/cloud/bootstrap/`, following [PLAN-01's PR #8 merge](roadmap-execution.md). This record separates its earlier
scratch verification from integrated checks and cloud execution. The integration changes infrastructure declarations,
deterministic tooling tests, documentation and credential-free validation wiring; it changes no application behavior,
frozen acceptance or live cloud state. No dedicated application project or cost control has been created.

## Integrated source status

- Terraform is pinned to 1.13.3 and Google provider 8.6.0. The coordinator initialized the provider and retained the
  generated lockfile after Terraform verified its HashiCorp signature.
- `npm run test:tooling` now includes the cap tests. The foundation workflow adds pinned Terraform setup, formatting,
  `init -backend=false -input=false -lockfile=readonly` and provider validation. These jobs receive no cloud credentials
  and run no plan or apply; their integrated CI result is pending.
- The reviewed scratch source and its results below support the implementation handoff. They do not establish a pass for
  a future PR head. Record final integrated commands, actual CI run, current companion approval and merge before calling
  this card complete.
- Cloud prerequisites remain: private dedicated identity selection, billing/payment/currency and permission checks,
  reviewed plan, guarded apply, exact cap identity retention and observed readiness. Live bootstrap is a separately
  reviewed next operation after this scoped PR merges.

The coordinator subsequently ran initialization, formatting and provider validation at the integrated path; those checks
passed. The integrated cap suite passed **21/21**. Actionlint and policy checks passed before a later tightening of
local-state exclusion patterns; broad validation against the final staged scope and actual CI remain pending. The setup
action is pinned to v4.0.1 commit `dfe3c3f87815947d99a8997f908cb6525fc44e9e`, with Terraform 1.13.3 and the wrapper
disabled. These local observations do not claim a successful GitHub run.

A read-only billing metadata check reported the selected account open with currency USD. It did not create or link an
application project and does not prove payment-method readiness, recipient delivery, all permissions or live cap
support. Private account identifiers are intentionally omitted from this record.

After explicitly staging all 18 scoped files, the coordinator ran `npm run validate` with pinned Node 24.20.0 and npm
11.19.0. Formatting, actionlint, repository policy, portability and all 19 Mermaid renders passed, followed by 20 gate
tests and 83 tooling tests (including the 21 cap cases), with no failures or skips. The final local checks cover the
tightened private-state exclusions. GitHub CI and exact-head companion review remain the next gates; these local checks
do not replace unchanged product acceptance in CI or live cost-control verification.

## Earlier scratch checks

The source was first authored and reviewed in an ignored scratch directory. During those checks no tracked files,
credentials, cloud resources, Git state or account configuration were changed. Public official documentation/source
reads verified provider/API contracts. The following results belong to that scratch source, not a hosted environment.

| Check                    | Actual result                                                                                                                                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Installed Terraform      | `terraform version -json`: 1.13.3, darwin_arm64; configuration pins that exact version.                                                                                                                                     |
| Terraform formatting     | Initial `terraform fmt -check -diff` detected one alignment difference in `main.tf`; `terraform fmt` corrected it; final check passed.                                                                                      |
| Terraform validation     | Initial check stopped on a missing provider. After the coordinator installed pinned Google 8.6.0 and the notification-block correction below, `terraform validate -no-color` passed: `Success! The configuration is valid.` |
| Cap tests                | `node --test cap-reconciler.test.mjs` with Node 24.20.0: **21 passed, 0 failed, 0 skipped** after the correction below.                                                                                                     |
| Explicit-file formatting | Installed repository Prettier checked the README, manifest and both scripts successfully; no ignored-file omission was treated as coverage.                                                                                 |
| Portability scan         | No personal filesystem paths or account/email identifiers found in draft files. Test-only synthetic account/project identifiers are intentional fixtures.                                                                   |
| Cloud plan/apply         | Not performed; no credentials read, APIs called, resources created, billing linked or application deployed.                                                                                                                 |

The coordinator caught a mismatch with the official response example: `inputState` is mandatory when creating the cap,
but documented GET/create responses can omit it while returning `outputState`. A focused test was added before the fix;
it failed with `CAP_LIFTED_OR_UNKNOWN`. The corrected reader permits an absent input field, still requires
`outputState: CONFIGURED` and no active reconciliation, and rejects any explicit lifted/unknown input. The complete
21-test run then passed. This is local response-contract evidence, not an observed live API response.
[Official API response examples](https://docs.cloud.google.com/billing/docs/how-to/budget-api-spend-cap).

The independent scratch audit identified a provider schema restriction: `all_updates_rule` requires a monitoring channel
or Pub/Sub topic, even when only recipient flags are set. The coordinator reproduced the validation failure against
installed Google 8.6.0. The block was removed instead of adding notification resources. The USD 100 alert budget retains
default billing IAM recipients; the separate USD 75 cap still explicitly requires project-owner notifications. After
this correction, Terraform formatting and actual provider validation passed. No reconciler code or tests changed in this
correction, so its prior 21/21 result remains applicable.

Tests cover initial read-only absence, one explicit creation with readback, adoption and exact recorded identity,
deleted identity refusal, full pagination, duplicate scope, incomplete discovery, permission/transport failures, amount
drift in both directions, enforcement/lifting/convergence, scope/credits/notification weakening, supported API defaults,
uncertain-create recovery without a second POST, origin/method/body restrictions, credential-safe errors and bounded
HTTP response size.

The Google provider's tagged **v8.6.0** source/docs were read for the project, API and alert-budget fields used here.
The released budget implementation has no `spend_cap` field. Actual local provider validation now passes for the
Terraform configuration. Review of the coordinator-generated provider lockfile, a refreshed live plan, permission/quota
checks and cap readback remain prerequisites before apply or application provisioning.
[Budget implementation](https://raw.githubusercontent.com/hashicorp/terraform-provider-google/v8.6.0/google/services/billingbudgets/resource_billing_budget.go),
[budget schema](https://raw.githubusercontent.com/hashicorp/terraform-provider-google/v8.6.0/website/docs/r/billing_budget.html.markdown),
[project schema](https://raw.githubusercontent.com/hashicorp/terraform-provider-google/v8.6.0/website/docs/r/google_project.html.markdown),
[API schema](https://raw.githubusercontent.com/hashicorp/terraform-provider-google/v8.6.0/website/docs/r/google_project_service.html.markdown).

After the notification correction, the independent scratch reviewer reported no remaining actionable findings in the
reviewed critical boundaries. That reviewer performed no local tests or cloud actions; the installed-provider result
above is the implementer's/coordinator's evidence. This audit does not replace exact-head companion review of the
integrated PR or real provider verification. Cost-control readiness remains a prerequisite to paid runtime work, and
production application deployment remains a separate human decision.
