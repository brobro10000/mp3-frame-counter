# Same-run publisher handoff validation — 2026-10-11

This records the first, dormant pure unit of [SAME-RUN-HANDOFF](../deployment/same-run-handoff.md). It checks
consistency between supplied context, direct publisher outputs, projected artifact metadata and actual ZIP bytes.
Authenticated acquisition, original-admission/profile replay and deployment remain separate, unimplemented integration
gates.

## Independent expectations before implementation

A separate author produced 31 test groups using literal unequal identities and an independent STORE writer/bitwise CRC.
The writer reproduces the retained pinned upload-action fixture's exact bytes; its known CRC vector also passes. The
first run passed that one framing group and failed the other thirty at the missing API, with zero skips. Those failures
are availability evidence; the future validator's negative assertions and VM probe had not executed.

Initial log SHA256: `d688415c4f196c8b6835cbdd32844d0d410a9a807000bf5d820664ef09bfed47`. The test remained byte-identical
to its initial snapshot: `2d462533c701ba0f86b98a624f08b4dc6cf9008b6fc0d15e79ad33349abf34d5`. Syntax and owned-file
formatting passed. Independent review found no actionable defect in the complete test/contract boundary; memo SHA256:
`c17c6d327cd03d98d30d22bb490e6142c3397efc728e9077dfcb62b04765ba0b`. Root read the review and source and rehashed all
thirteen author evidence records before freezing the expectations in commit `da89481`.

## Separate implementation and focused execution

Root then implemented only the new helper and registered its independent suite in the existing tooling command. The
helper has no CLI, network or credential acquisition. It accepts only the observed one-file STORE format, verifies the
actual archive hash before inspecting its records, checks CRC and fixed framing, then reuses the existing publisher
receipt and handoff validators. It preserves original validation context while requiring the current publisher attempt.

With pinned Node 24.20.0, `node --test --test-reporter=tap scripts/same-run-handoff.test.mjs` passed all **31 groups**,
with zero failures, skips, cancellations or todo cases. Every refusal group reached its valid counterpart and subsequent
negative rows. The isolated VM probe observed zero ambient-capability attempts and the required bound/hash ordering.
Exact/over-limit payloads, fixed record fields, metadata/context substitutions, stale publisher attempts, input
preservation, frozen detached results and sanitized refusals all executed. The original frozen tests were unchanged.

Implementation SHA256: `f23932f5c897551b0d0ea822a584177a7c676b9aa6684577c29f15088a9247c0`; focused log SHA256:
`00d5b377ad2a36144aaa34eca5b9cb9d2c1ffe2c3b9e75cb39e03c132afe277f`. These are retained diagnostic references, not signed
attestations or external authority. Independent implementation review found no actionable issue; memo SHA256:
`bfdbfcec1025a314c8ac4341fbdc043dfaefdb26cc3260e1fa5f9b0b19421337`. Root read the complete memo and checked its
source/log identities. Full repository/CI checks and companion review remain pending for the integrated source; a local
focused pass is not a publication result.

## Scope limits

Synthetic fully consistent inputs can pass. This pure helper cannot authenticate its caller, retrieve an artifact,
establish expiry/freshness, re-observe release assets, replay the original admission, select required hosted profiles or
verify images/registry/provider identities. Its output confers no deployment authority. The broader phase is incomplete
until those separately reviewed consumers exist. Every production application deployment retains its human gate.
