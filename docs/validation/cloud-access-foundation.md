# Cloud access foundation verification

Dated 2026-10-10. The [bounded contract](../deployment/cloud-access-foundation.md) prepares access infrastructure under
[the active card](../phases/next-iteration.md#pr-card-3--access-foundation-prepare-protected-state-registry-and-scoped-identities).
Independent executable expectations are reviewed and frozen before a different implementer writes Terraform.
Implementation checks, CI, companion approval, merge/publication and live plan/apply/readback remain pending. No new
cloud resource or application deployment is claimed.

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
