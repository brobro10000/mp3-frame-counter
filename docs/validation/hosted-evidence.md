# Dormant hosted evidence validation

## Scope and current status

This 2026-10-10 record covers HOSTED-EVIDENCE under the
[adopted parsed-data contract](../deployment/hosted-evidence.md). Independent expectations and the implementation are
reviewed, and all 38 focused groups pass. Full integration checks, companion approval, merge and publication are
pending. No hosted service or deployment is established.

The change owns two new scripts and their explicit `test:tooling` registration. The existing declaration validator is
reused. Acceptance source, resolver, immutable bindings, workflow permissions, release preparation/publication/retries,
dependencies and infrastructure remain outside this card. The helper validates supplied evidence consistency; the later
trusted launcher must authenticate source, release, image transfer, provider observations and execution authority.

## Expectations before implementation

The test author defined literal synthetic inventories and expected records independently of a helper implementation. The
source deliberately uses unequal profile lengths and also exercises larger inventories; current 72/22/3 counts cannot
substitute for complete identity sets. Existing declaration validation checks those synthetic fixtures.

An independent reviewer read the complete original expectations and found three bounded issues:

- The denied-capability probe covered successful stage calls but omitted failed, blocked, absent and rejection paths.
- Envelope copy-mismatch tests could conceal missing validation of identically malformed original and copied rows.
- The probe unnecessarily refused the deterministic `node:assert/strict` builtin.

The author corrected those issues before any helper existed. The reviewer verified that every byte outside the two
approved edit regions remained unchanged and found no remaining actionable issue. Root read both versions, checked the
corrections and evidence hashes, and froze the corrected tests in commit `d8133f1` before assigning implementation to a
different agent. This is automated independent review, not human approval.

| Evidence                                     | Observed result                                                                                |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Frozen test SHA-256                          | `a022338080de7f3f5f9ddd4b6be63c48c08006531e4122b070d50138638fdcec`                             |
| Adopted contract SHA-256 at freeze           | `67767d9197625b62098c34ca5e087629c0d686fd9fd70ae98945e8f575762044`                             |
| Corrective review SHA-256                    | `1cd003a0d8dd2cd18f36646eafcd76b233ad45b0bd295611df78a301e0437de8`                             |
| Pinned Node syntax and configured formatting | Passed for the frozen test file                                                                |
| Focused run before implementation            | 38 groups: one existing-fixture pass, 37 explicit missing-API failures, no skips/cancellations |
| Availability-red log SHA-256                 | `aab8c25186b64e2de5383c25691a219b4a49cc777fe0c05fec7c171df153722f`                             |

That initial failure establishes missing implementation only: no new-helper positive, rejection or purity assertion ran.
Earlier expectation drafts and their availability failures remain retained. Local record hashes identify diagnostic
bytes; they are neither signed attestations nor passing hosted acceptance.

The first implementation run passed 37 groups and failed the root-null fixture. Independent inspection found a harness
defect: `mutate(input) ?? input` restored the valid original when the intended replacement was explicitly null. The
independent author changed only that sentinel to distinguish undefined from null; the reviewer reproduced the prior
whole-file hash by reversing those two lines. No fixture or expected decision changed. Commit `3734cfb` records this
post-implementation-discovery correction, with test SHA-256
`ac19cf397f19f349e8e7b96fa84048cd56f54db4071f20676da69ee1b380f9d1`. The helper remained byte-identical during the
correction. The preserved first-run log SHA-256 is `5dfa15f9d8ef0fd45b685bcff3055847e804dd654d2e794de7147a53282b57d2`;
corrective review SHA-256 is `bc19169dd78dac4cc1cc1cd4a0ad17e01371d0d6a136c999624c1b054f970983`.

## Required verification and limits

Implementation must pass the independently frozen expectations for complete and partial results, closed schemas,
identity roles, original array custody, the conservative status matrix, cleanup precedence, observation drift, real
calendar syntax, sanitized errors, caller immutability and fresh deeply frozen copies. The credential-free VM probe
checks representative successful and failed calls with ambient capabilities denied; it is a regression check, not a
hostile-code sandbox or a proof of every possible execution path.

The unchanged helper SHA-256 is `39f150aecb4f869ca17ae83cca2f87f08e1629a330a19038f4b23aed7eee2782`. Its independent
static review found no actionable finding; review SHA-256 is
`db018aa593077790c4bef72b977334dd7b47eec14d63c82fa135fd3b368c4a64`. Pinned Node 24.20.0 syntax, explicit-file formatting
and the corrected focused run passed: 38/38 groups, zero failures/skips/cancellations.

Root ran `npm run validate` with pinned Node 24.20.0: all 583 tooling tests, 20 gate tests, 19 Mermaid renders,
formatting, workflow lint, policy and portability checks passed. Validation log SHA-256 is
`350ecdd7a0fdf2046a0878f9d5703ec5f457867ffc1d874de2d8ddfaf4f6a4c4`. No product or hosted acceptance was rerun locally
for this dormant helper.

Exact-head CI, companion review, actual protected-main publication and the prerequisite hosted binding remain pending.
Their results will be recorded when observed. No record accepted by this pure API alone grants promotion or production
authority. Every production application deployment continues to require human intervention for the exact candidate.
