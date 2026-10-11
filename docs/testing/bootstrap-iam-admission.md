# Bootstrap IAM path admission amendment — 2026-10-11

Root adopts this narrowly scoped prerequisite under the owner's continued roadmap and minimal-repair authority. PR #36's
first CI run stopped in trusted admission before any head-owned command. The existing bootstrap predates the transition
gate; its Terraform implementation and local README were never classified. Preserve that failed run as correct
fail-closed behavior, not a product or IAM test failure.

## Exact decision

Classify only `infra/cloud/bootstrap/main.tf` as **governance** and only `infra/cloud/bootstrap/README.md` as
**documentation**. This is an explicit two-file reservation, not an infrastructure prefix exemption. Additions, changes
and removals use the same existing path-kind rules; classification is not permission to remove a resource or safeguard.
All neighboring bootstrap paths remain unclassified unless already covered by another exact rule. In particular, this
amendment does not admit provider/variable/output/lock changes, overrides, arbitrary scripts or Terraform JSON.

The original project/API/cost root is operational governance. Its bounded IAM correction changes no application service,
runtime container, upload behavior or required acceptance. The exact bootstrap tests, source review and separately
reviewed live plans continue to constrain its contents; a filename alone cannot establish safe Terraform behavior.
Runtime IaC keeps its existing product classification and activates the bound successor under unchanged rules.

Preserve immutable genesis, frozen suites/contracts, historical bindings and trusted-base execution. Bootstrap
governance must leave the active suite and pending binding unchanged. Mixed product/governance, candidate/governance and
binding/governance proposals remain rejected. The exact Markdown path retains ordinary documentation semantics,
regular-blob enforcement and descendant applicability; it does not conceal executable content in neighboring files.

## Independent expectations and sequence

A separate author appends meaningful temporary-Git-history cases to `scripts/acceptance-transitions.test.mjs` before
implementation. Require literal independent path expectations, both accepted classifications and their unchanged
required/pending identities. Exercise valid counterparts before mixed proposal failures, near-name and executable
neighbors, and regular-file restrictions. Preserve pre-implementation refusals and do not reinterpret an early
unclassified-path failure as proof of the later mixed-change guard.

After independent expectation review/freeze, a different implementer adds only the two exact path cases in
`scripts/acceptance-transitions.mjs`. Run focused transition tests and affected admission/consumer checks, then required
CI and exact-head companion review. After normal owner merge, immediately refresh PR #36 onto that actual base; verified
actual-main publication remains a prerequisite for merging the dependent PR. The head-owned policy must never admit its
own mixed implementation through a trust shortcut. No workflow change, suite edit, admission override, direct approval,
live IAM or deployment belongs here.

This amendment is reviewable and reversible before the dependent implementation lands. Once affected history exists,
future policy changes must preserve historical resolution; do not silently make published sources unverifiable.
