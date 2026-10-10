# Cloud access foundation verification

Dated 2026-10-10. The [bounded contract](../deployment/cloud-access-foundation.md) prepares access infrastructure under
[the active card](../phases/next-iteration.md#pr-card-3--access-foundation-prepare-protected-state-registry-and-scoped-identities).
Independent executable expectations are reviewed and frozen before a different implementer writes Terraform. Initial
implementation checks passed as recorded below; CI, companion approval, merge/publication and live plan/apply/readback
remain pending. No new cloud resource or application deployment is claimed.

## Contract review

Root adopted contract SHA-256 `55af5bc0bb3d4d801c6a73b68115311aac344ee11915e44386f7217e25c6a444` and read the complete
separate architecture review, SHA-256 `55948e21f83d90bfd14702423dcbf9ae3916145fcddcb7f5588ce6d372aa56f5`. That review
found no actionable material defect within the source boundary. It verified pinned provider support, scoped IAM targets,
initial private local state and later reviewed GCS migration against primary documentation. It performed no provider
execution, cloud/account/private-state read or tracked source change.

The initial scope has five APIs, three state buckets, one registry, seven identities and seven resource-scoped IAM
members. Federation, Run service access and application revisions are absent. The owner’s setup authority does not
replace source review, fresh USD 75 Run-cap/USD 100 alert-budget checks, exact saved-plan review and actual no-drift
readback. The alert budget does not guarantee an invoice ceiling. Every production application deployment remains
human-controlled, including authenticated or no-traffic candidates.

Mock plans must use deterministic computed identity fixtures without overriding configured protections or IAM values.
They cannot prove live propagation, global name availability or actual provider behavior. Terraform lifecycle
`prevent_destroy` needs separately identified coverage; its mere absence from mock plan JSON is not evidence of failure.
Provider PREVENT and Terraform lifecycle guards are distinct, and neither blocks every privileged direct cloud action.
Retained local diagnostic hashes identify observations; they are not signed provider attestations.

## Independent expectations and preserved failure

The original test SHA-256 was `852c6ee6ad30adae95c0a87da50eaeb7de174bc1d558c1e5ccc2e3fd53ec1e37`. One initial run on
pinned Node 24.20.0/Terraform 1.13.3 had 18 groups: two tool/scanner passes and 16 missing-source failures, no skips.
The access root was absent; this proves API availability failure, not successful foundation behavior. Original log
SHA-256: `0e833a1fabebbe07f74fa6eb7c306bbb6df21aa923e4c602a7849be11aa310e9`.

Independent review identified six omitted Terraform filesystem-hash functions in the test guard. Before freeze, the
author extended the explicit denial and added matching negative controls plus valid pure string-hash counterparts. All
resource, IAM, protection and output expectations remained unchanged. The original source/red log were preserved. Syntax
and formatting passed; the selected scanner/guard run passed **2/2**. There was no second full missing-source run. Final
test SHA-256: `d71ead0c8eee3e42f33113c0e44b349c5cef9b7570b20dd44c7de2e23c7465ee` (19 groups).

The independent reviewer verified the bounded correction and found no remaining actionable expectation issues. Review
memo SHA-256: `d1716d10bd6f92c49bc5e75a052f76f0d89875a9f1b9d77db8fe4c9ee6c2bd7d`. Root read the full original tests,
complete correction diff, review and handoff, and rehashed all 16 final author records. A separate single-account native
mock feasibility probe passed; it does not establish this foundation's behavior. Full configuration and mutation-control
checks remain pending until implementation. No cloud credentials, private state or actual provider resource was used.

## Implementation and integration

A separate implementer added only the five reserved Terraform files after independent expectations were frozen in
`ea4d1e4`. The first complete focused run passed **19/19**, with no failed, skipped, cancelled or todo groups, against
unchanged test SHA-256 `d71ead0c8eee3e42f33113c0e44b349c5cef9b7570b20dd44c7de2e23c7465ee`. Complete log SHA-256:
`ae411072fd04be6223c149b1f9227cc13c8a88bde964e19df0b005d769251a04`. This includes successful mocked plans before five
unsafe-configuration mutation controls reject them. No source correction was needed to obtain the pass.

Installed Terraform 1.13.3 formatting, backend-disabled readonly initialization and validation passed. Google 8.6.0
provider lock generation verified signed packages for Darwin ARM64 and Linux AMD64. Root read the handoff and complete
focused result, and rehashed all 17 source/implementation records. Implementation handoff SHA-256:
`c38b639a6911fee14edebde3f33a5bdb9f448b5a7e66cf656d79935990da0435`.

The existing foundation CI job now validates both Terraform roots without cloud credentials or backend access. The
ordinary tooling command includes the independent mocked access tests; repository policy requires both integrations.
Required jobs, permissions, trusted preflight, release triggers and acceptance selection are unchanged.

Independent implementation review identified missing portable exclusions for access-root state, private variable files,
plans and provider caches. Root added narrowly scoped patterns to the existing root `.gitignore`; nine representative
private/cache paths are ignored and all five source/lock files remain eligible for tracking. The Terraform
implementation and frozen tests are unchanged by this correction. Full repository validation and final review remain
pending.

## Complete local validation

Pinned Node 24.20.0 `npm run validate` exited zero with **564 tooling tests**, **20 gate tests** and **19/19 Mermaid
renders**, plus formatting, workflow lint, repository policy and portability checks. Tooling includes the 19 access
expectation groups. This run used the implementation/integration tree based on `ea4d1e4` and actual main `62e4cd4`; it
excludes changes still on the separate hosted-evidence/source-projection branches. Complete log SHA-256:
`a74afe103105db072e5d10cee6623d8bea61f24af02be5859455061b20c3751d`. The final evidence text receives an explicit format
check. Remote CI, companion approval, actual-main publication and live plan/apply remain pending.

## Actual-main reconciliation and preflight refusal

At head `5edfe5b`, [PR CI 38093294194](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38093294194) passed
the mandatory checks. After PR #31 merged as `2289a80f6a0f35bab819d7057ac3b2029f09c10f`, root immediately reconciled
this branch onto that actual first parent without changing access configuration or independent tests.
[Run 38093965059](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38093965059) then refused admission
before any head-owned command: its PR event still named base `bccea9e`, while synthetic merge `19ff47f` had parents
`2289a80` and `a4ab428`. The mismatch was confirmed through GitHub commit/PR metadata; no guard was changed.

Explicitly updating the PR base to `main` refreshed GitHub's base SHA to `2289a80`, even though the branch name was
already `main`. This documentation commit creates a fresh synchronize event after that correction; the failed event is
preserved rather than retried with its stale payload. Failed log SHA-256:
`1ddfb37efb2a1f995c87b6e0423ee53ee5708f42968a7901c67e036b07d8769c`. Fresh CI and exact-head companion review remain
required before merge. No cloud action occurred.
