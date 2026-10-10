# Hosted delivery policy and 0.3 line: execution record

Dated 2026-10-10. This records the
[bounded governance card](../phases/next-iteration.md#pr-card-1--hosted-delivery-policy--line-03-open-the-hosted-delivery-release-envelope)
and [finite delivery boundary](../deployment/hosted-delivery-policy.md). It is neither hosted acceptance nor deployment
approval. Parent PR #26 remains in main-target verification at this checkpoint; its actual publication is a
prerequisite.

## Scope and independent expectations

Root adopted ten exact future IaC filenames: five access/governance and five runtime/product. The classifier remains a
path boundary, not a content-level Terraform/IAM verifier. Runtime changes activate a bound successor; access changes do
not. Unknown paths, mixed product/governance, candidate-only and binding-only restrictions remain enforced. Root also
selects the roadmap's existing source-bound 0.3 policy using only `release-policy.json`; allocator behavior, global
ordinal, legacy retries and ordinary-major-one refusal do not change. No resources or workflow privileges exist because
these filenames or release line are admitted.

An independent author appended seven groups to `scripts/acceptance-transitions.test.mjs`, without reading a new
implementation. A separate reviewer inspected the expectations and actual retained red. Root read the complete diff/log
and review, then compared the original committed 31,129-byte prefix byte-for-byte. Test-only commit `bcce8fb` precedes
classifier implementation. Frozen test SHA-256 is `e4e8331a911cdc663fcd75446084dafa9ed6e2c1aedc1c4ffd63a58b678717c4`;
review-memo SHA-256 is `6cf2537affa34b7d4649d1f1fba684ee467f20de157b739ffe08a9d3dbcfef3d`.

Pinned Node 24.20.0 command:

```sh
node --test --test-name-pattern='^hosted IaC paths:' scripts/acceptance-transitions.test.mjs
```

Actual pre-implementation result: seven groups, three passed and four failed, zero skips/cancellations. The four
failures are the existing unknown-path error for the intended access/runtime literals, not fixture/import setup. Tables
stop at the first red entry, so this does not prove all ten add/change rows or all later negative assertions executed.
Final complete green was subsequently verified. Retained red-log SHA-256 is
`90511310ab9fa7cbdc879659d026446a616c9d8e75a9a464f5af152b6e01247e`. Local ignored diagnostics are not release assets.

A separate implementer added thirteen classifier lines: the ten literal paths and one boundary comment, with no
admission-logic rewrite. All seven focused groups passed, including every unconditional add/change row and later
negative branch. An independent implementation reviewer found no P1–P3 defect. Root read the complete diff, focused log
and review and rehashed the seven handoff records. Source SHA-256 is
`c0ca4fa727021e3687f5f8dadf2b7ab38178528a3d661051e4c2e9d6d798e555`; implementation-review SHA-256 is
`fb051ed8cac86df33e3385675b5d21fff7236a2536de1902ee0f276356fe2c85`.

Root then ran the entire `scripts/acceptance-transitions.test.mjs` with pinned Node 24.20.0: all 94 tests passed, zero
failures/skips/cancellations. Raw-log SHA-256 is `b5ce1d86056bc1e51216f89c4bf93e1b33a43a38fc4f3fd2df37bfbcaef18d0c`. The
original frozen test hash is unchanged.

## Existing version-policy regression evidence

Root ran the three existing allocation, allocation-publication and allocation-preparation-CLI test files with pinned
Node 24.20.0. All 59 tests passed, with zero skips/cancellations. The run covers source-bound allocation, prior line
activation, historical replay, original retry bytes, missing/deleted/malformed policy, numeric ordering, delayed
old-line publication and major-one refusal. Raw-log SHA-256 is
`1647d9179e777b996d13ef156275f949deedc80dc545f2bbdd3d392f26a7d0e3`. These isolated fixtures do not publish a real tag or
establish the actual new line's main release. Exact committed-source policy and mandatory CI remain final checks.

## Adapter feasibility evidence

An independent deployment-design lane tested synthetic credentials with owned loopback HTTP fixtures only. Existing Node
24.20.0, npm 11.19.0, Playwright 1.64.0 and Chromium 156.0.8078.4 were used without installation. The first
fetch/fulfill probe passed 12 of 14 groups: stdin/private-file transport, sanitization and cleanup passed, but duplicate
security-header fidelity failed and the combined CSP/worker result was not diagnostically complete. That adapter was not
adopted. No original failed record was overwritten.

The separate CDP probe preserved request-header injection per hop and continued actual responses without rewriting. Its
final 26 checks passed against a direct-browser baseline, with exact duplicate-header arrays, effective CSP,
authentication controls, foreign/redirect/frame/popup/WebSocket confinement and a real unblocked-worker counterpart. All
owned listeners/browser/temp files were cleaned and the sentinel scan found no persisted synthetic token. Four recorded
diagnostic iterations distinguish incorrect worker/popup accounting from actual security behavior; no zero-network or
response-fidelity condition was relaxed. Root read the complete final source/result/report and rehashed all 13 retained
records.

Final prototype source SHA-256 is `be11bd4f96a8827b093a6557b93e58874626139fed9250391723f5d9c1ca392e`; result SHA-256 is
`fb9c89e80268c4ab26494d0f6584ea1b055a8f9de7ea03e83a63d21b55da263f`; report SHA-256 is
`ca12f8a370d6971e562b04bf056f72148153a0f49798c824ba8f8f4840dfdc26`. The fixed one-page mechanism refuses unowned popups
and all WebSockets; it does not claim arbitrary popup/OOPIF support. A separate reviewer read the final mechanism, all
retained probe checksums and installed protocol/debugging sources. Root read the full 90-line review and adopted the
bounded candidate interface with mandatory integration controls. Review SHA-256 is
`090d3e0e58d39f4e11c8c308888d1a68d9b3066dc72b2d8ed95d2eadfde4b35f`.

The review requires terminal guard/CDP failure latching and draining through cleanup, forbidden-attempt visibility,
Node-parent protocol-log suppression, complete upload/docs predicates, and Linux/HTTPS compatibility before freeze. Its
finite limits include the observational 418 body hash and lack of arbitrary browser-egress proof. No Linux, HTTPS, real
token audience, Google IAM, hosted application or deployment was exercised by the probe. Feasibility does not close
ACCESS-01, HOST-01 or LAUNCH-01.

## Remaining completion gates

The classifier and bounded adapter design are independently reviewed; focused/full transition regressions pass. Run
final repository checks, then reconcile actual parent publication and obtain fresh main-target CI/companion approval.
Normal owner merge and verified actual-main software publication complete this card. Frozen acceptance, registry,
product, dependencies, workflows, publisher and cloud bootstrap remain unchanged; every production application candidate
continues to require human intervention.

Independent documentation/interface review found one P3: two old current-state pointer blocks in the roadmap still
called docs-v1 pending and named an obsolete card window. Root corrected those mutable pointers to the verified
docs-v1/current-window state while preserving dated evidence. Original review SHA-256 is
`337470cb8d03879ba193f530ececb9f8e2c650be27be47968e72c8a58ec515a1`. All 20 gate tests, workflow lint, exact-source
policy, tracked formatting and portability checks passed at the governance implementation checkpoint. Main-target checks
and companion review remain pending.

## Parent merge and immediate dependent reconciliation

PR #26 merged as `fd0f35bca1289319ce909a4aff785251c0cd1583` at 20:37:33Z after corrected-head CI
[38083384724](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38083384724) and the
[automated companion approval](https://github.com/brobro10000/mp3-frame-counter/pull/26#pullrequestreview-5480724617) on
exact head `80e1850224bf3638a0fd4d96fcbedf64a582e9dc`. Owner identity was brobro10000; all three required jobs passed,
all threads were resolved, and the normal protected merge used no bypass. The dependent policy branch is reconciled with
this actual main as first parent; its earlier test-first history is retained as the second parent. Conflict resolution
preserves the parent's corrected comments and evidence, and retains this card's reviewed three-card window. Main run
38084476141 has started; publication remains pending at this checkpoint. Fresh dependent checks and companion review are
still required. This follows the owner's direction to merge ready layers and immediately update dependents.

## Companion recovery-instruction correction

Exact-head PR run [38084595643](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38084595643) passed for
`fc4f0a208faab94138b9927c34f46000901eadf3`: 545 tooling tests, 20 gates, 120 units, all 72 required local cases with
cleanup and 19 Mermaid renders. Docker companion run `20261010T204624-a808f085` reviewed all 14 changed paths and
returned one P3: the new card incorrectly made publication the cutoff for preserving an admitted release line. The
existing allocator and version policy require retaining 0.3 after merge, including failed or absent publication. Root
corrected only that recovery wording; executable code and expectations are unchanged. Review report SHA-256 is
`bac5eab589f1c4c8e67af07d9ddf476fb1c46663f916cba66cdc1012a7f7470b`, verified against its execution receipt. No approval
was posted. Fresh required checks and companion review apply to the correction.

Parent PR #26 has now completed main run 38084476141 and published v0.2.26, release 409195020. Root rehashed all eight
metadata assets, verified source/admission/image consistency and read the independent main-CI audit; image archives were
not downloaded or rehashed. This supersedes the earlier pending-publication checkpoint without changing deployment
state.

## Companion current-status correction

PR run [38085416755, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38085416755) passed for
`744773327bdb104c09eed0228fdd3d8f68989fbb`: 545 tooling tests, 20 gates, 120 units, all 72 required local cases with
cleanup and 19 Mermaid renders. Docker companion run `20261010T205821-25c7d411` found one P3: the appended parent
completion checkpoint had not updated separate mutable README, roadmap and phase pointers. Root corrected all identified
current pointers, the active card's base instructions and linked a consolidated
[parent completion record](../phases/next-iteration.md#profile-declarations-protected-main-completion). Historical
checkpoints remain preserved. Review report SHA256 is
`8a024317f5486c9d0236a11770ee54116bb85dc2e0e630773d431ab4db7d9f80`, verified against its execution receipt. No approval
was posted. This documentation-only correction needs fresh checks and companion review; no executable code, expected
decision, release policy, cloud resource or deployment state changed.
