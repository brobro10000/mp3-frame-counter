# P5 — Managed deployment and release

Status: execution authorized by the [later owner instruction](execution-authorization.md); original phase criteria
follow. Trace: APP-V1-012,014,015,016; APP-REL-001–006; R-04,06,07,08,11.

## Objective

Implement the approved provider path and exercise candidate verification, exact-release approval, promotion/smoke and
recovery.

## Prerequisites

Separate P5 authorization and reviewed P4 handoff; provider fit, account, region, budget and scoped authentication
approval before cloud-specific work. Resolve undocumented ingress behavior via authoritative evidence or explicitly
authorized bounded candidate probes. Production approval remains a later exact-release gate.

## Owned paths and read-only dependencies

Minimal provider configuration, ordinary documented deployment scripts/Make wrappers, trusted release workflows, runbook
and sanitized release evidence. Provider resource changes only within explicit approved scope. No generic adapter
platform, product redesign or acceptance baseline edits.

Read-only inputs: Approved image pair, contract/suite revision/fixture hash, versioning and retention decisions,
repository controls and release requirements. Candidate and production environment bindings must remain distinct.

## Proposed commands, not P0 observations

Future `make deploy-candidate`, `make verify-candidate`, trusted external acceptance including exact 20 MiB; after
separate exact-release approval, `make promote RELEASE_ID=...` and small smoke. Authorized candidate recovery rehearsal
and explicit `make rollback RELEASE_ID=...` or first-release abort only within approved scope.

## Acceptance evidence and human review

Actual provider fit/resource/buffering review, candidate URL and paired identities, full applicable unchanged suite,
source/configuration bindings, exact approval, production identities/smoke, automatic version/tag/private release after
success and observed recovery rehearsal. Keep failures visible and artifacts recoverable.

Review focus: All APP-REL-001–006, least privilege, no racing deploy paths, no rebuild masquerading as promotion,
non-atomic pair ordering/overlap, manual approval limitations, controlled probes and scoped cleanup/spend controls.

## Non-goals and stop conditions

Stop if account/budget/fit, candidate acceptance, identity or approval is missing. No production action from planning
approval or PR review exception. No public exposure beyond authorized scope, automatic merge, speculative services or
test weakening. End with release/PR evidence handoff and explicit remaining limitations.

Read [phase rules](README.md) and the [release-operator role](../agents/release-operator.md) and
[reviewer](../agents/reviewer.md). A reviewable PR handoff does not authorize its merge; locally validated, CI-passed,
reviewed, merged and deployed remain distinct states.
