# Cloud attempt and final teardown

The submission runs locally with [two Docker containers](local-handoff.md). Cloud hosting is outside the employer's
assessment requirements. The owner abandoned the hosted track to prioritize the working application and a reproducible
handoff, then explicitly authorized removal of the application's resources.

## What was built and why it stopped

The checked-in Terraform is retained as infrastructure work, not a requirement for running the application:

| Area                                               | Implemented work                                                                                                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Bootstrap](../../infra/cloud/bootstrap/README.md) | Dedicated project, enabled APIs, USD 100 notification budget and separate USD 75 Cloud Run spend cap. The total budget is not a hard invoice ceiling. |
| [Access](../../infra/cloud/access/main.tf)         | Scoped service accounts, GitHub federation, Artifact Registry and separate Terraform state buckets.                                                   |
| [Runtime](../../infra/cloud/runtime/main.tf)       | Cloud Run NGINX ingress with an API sidecar, immutable image inputs, startup/resource settings and authenticated access.                              |
| [Delivery](v1-delivery.md)                         | Same-run release handoff, stage deployment and hosted test collection; production required human approval.                                            |

An authenticated stage existed and served bounded diagnostic requests. Complete hosted acceptance did not pass:
IAM/operation convergence and ingress/browser-observer cases remained unresolved. Historical failures are retained in
[the delivery record](v1-delivery.md); a successful health check did not establish production readiness. There was no
verified production application deployment or production `v1.0.0` closure. The local application and software release
pipeline remain usable without those resources.

PR #55's independent hosted-browser calibration was closed without merge for this final local submission. Its branch and
review history remain available; closing it does not adopt its contract or imply that the hosted problem was fixed.

## Teardown boundary

The final operation targets only the dedicated MP3 project: stage, registry, state buckets, deployment identities and
other project resources. Before shutdown, preserve private Terraform state and inspect the project identity/labels.
Automatic stage delivery remains disabled. Stop only this application's local containers and preview/proxy processes;
preserve release assets, source, unrelated workloads and the companion reviewer's credential volumes.

Terraform deliberately has `prevent_destroy` and provider deletion safeguards. Ordinary `terraform destroy` is not a
supported teardown path. The explicit project decommission uses the provider's project shutdown operation after
unlinking project billing; it does not weaken the checked-in safeguards or pretend that deleting state deletes
resources. State backups describe the pre-shutdown resources and must not be applied unchanged to recreate the project.

[Google's project shutdown guidance](https://docs.cloud.google.com/resource-manager/docs/delete-restore-projects)
explains the recoverable deletion period.
[Disabling project billing](https://docs.cloud.google.com/billing/docs/how-to/modify-project) stops billable services;
charges already incurred can still appear later. The shared billing account is outside this application teardown. This
operation cannot certify a zero historical invoice.

## Final observed result

On **2026-10-12 UTC**, after local application checks completed:

- Verified the dedicated Terraform project identity, application labels and three private state backup hashes.
- Confirmed automatic stage delivery was disabled and no GitHub runs were active or queued.
- Unlinked this project's billing; independent readback returned `billingEnabled: false`.
- Requested project shutdown; independent readback returned `lifecycleState: DELETE_REQUESTED`.
- Removed the isolated acceptance containers/network and stopped the two application Cloud Run proxies and local Redoc
  preview. No application listener remained on ports 8080, 18080, 18083, 18084 or 18177; no Docker container was running
  at the final check.

This is a verified shutdown request and billing unlink, not a claim that the recoverable project has already been
permanently purged. Earlier charges can still arrive. Private state backups, source/releases, inert local build caches
and the companion reviewer's credential volumes were retained. The shared billing account was not closed. The owner
holds the operation/readback records in the external `mp3-independent-review/evidence/` bundle.
