# P5 — Repository releases without deployment

Status: authorized by the later [release-only owner amendment](../requirements/release-process.md), SRC-RELEASE-ONLY.
The stable filename preserves existing links. This amendment supersedes the phase's original deployment prerequisite.
Trace: APP-V1-012,015,016 and active APP-REL-001–006; APP-V1-014 and hosted APP-V1-015 are deferred.

## Objective and prerequisites

Publish a private GitHub release of the exact frontend/API images tested on protected `main`, with an automatic
version/tag, checksums, source/configuration and acceptance provenance. The release must explicitly say no deployment
occurred. P1/P2 must merge first, the independent owner must bind the unchanged suite to its actual protected-main
commit, and all mandatory checks must pass for the exact integrated source. Local acceptance alone cannot satisfy this.

## Ownership and execution

The independent foundation/gate author owns workflow and publisher logic; root integrates command wiring and current
requirements/status. A separate reviewer checks identities, permissions, retry behavior and actual validation results.
Product implementers cannot change the frozen suite or weaken gates. Read the
[release-only process](../deployment/release-only.md) for the workflow, assets and failure handling, and
[local preparation](../deployment/preparation.md) for its narrower provider-independent boundary. Keep historical
reports and generated planning contracts intact.

## Required exit evidence

Record exact main source, successful mandatory run, unchanged baseline identity, tested image identities, archive
hashes, version/tag and private release URL. Verify all assets before publishing the draft; refuse conflicting existing
content. An identical retry reuses the release without replacing assets. Never rebuild during publication or present a
local prepared manifest as publication evidence. Retain visible failures and prior releases; older runs must not
downgrade which release is marked latest. See [current execution status](../validation/execution-status.md) for observed
boundaries.

## Deferred deployment follow-up

Provider/account/region/budget setup, registry publication, stage/production service creation, managed TLS acceptance,
exact production approval, pair promotion, smoke and recovery remain unexecuted future scope under the
[deployment runbook](../deployment/runbook.md). They do not block this repository release milestone. Publishing a
release does not authorize or trigger them.

No automatic merge, review override, speculative infrastructure, test weakening or fabricated release evidence. A
reviewable PR handoff does not authorize its merge. Read [phase rules](README.md), the
[release-operator role](../agents/release-operator.md) and [reviewer role](../agents/reviewer.md).

## Observed phase completion

The [V1 closure](../validation/v1-closure.md) records the successful main run, `v0.1.6`, all verified release assets and
the identical publisher-only retry observed on 2026-10-10. This satisfies the active release-only exit criteria; the
deferred deployment follow-up above remains separate. Later releases must meet the same controls.
