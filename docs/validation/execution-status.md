# MVP execution status and project progression

**Later roadmap progression — 2026-10-10:** [PR #19/v0.2.19](fastify-transport.md#protected-main-completion) released
Fastify and activated the independently bound transport-v1 suite. Main run `38054409309` passed 82 unit tests and 67
external cases. The [roadmap](../roadmap/README.md) and [three-card window](../phases/next-iteration.md) track
subsequent work. No application service is deployed; human intervention remains required for production. The P1–P5
observations below preserve the original release-only milestone rather than describing the latest source.

Observed on **2026-10-10, America/New_York**, after product merge and first repository publication. P1/P2 are merged,
the unchanged independent baseline remains bound to `a0a56d94e5457101cd043b6055ab084782c3e16f`, and PR #5 merged as
`ce50762b404e6b37ee10171fabd98db9aa06b265`. Protected-main CI published `v0.1.6`; an identical publisher retry passed.
The [V1 closure](v1-closure.md) binds all active phase/release criteria to exact evidence. **Deployment remains
deferred**.

## Historical V1 application verification

[Main run 38023037504, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38023037504/attempts/1)
passed foundation, product and `control-plane` at `ce50762b`. It recorded **75 application unit tests, 60/60
browser/HTTP acceptance cases, 16/16 Mermaid renders and 82 gate/tooling tests**, plus formatting, workflow lint,
policy, portability, TypeScript build and successful cleanup. It exported the exact tested images and published
[release v0.1.6](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.1.6). Foundation-only delivery
correctly skipped. Attempt 2 repeated only publication, reusing the original tested bundle and ten unchanged release
assets.

Earlier [PR CI at `3e7e21d`](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38012435332) and
[final PR CI at `8f41b9f`](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38013938169) remain distinct
pre-merge observations. The closure evidence does not certify a later revision or a hosted service.

| Phase                     | Observed outcome                                                                                                                                                                                           | Continuing boundary                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| P1 foundation             | Adaptation and independent review completed; [PR #3](https://github.com/brobro10000/mp3-frame-counter/pull/3) merged as `60e51fb`.                                                                         | Preserve protections and mandatory checks.                                         |
| P2 independent acceptance | Test-only authorship/oracle preceded product source: 46 fixtures, 60 cases, reviewed r3 contract. [PR #4](https://github.com/brobro10000/mp3-frame-counter/pull/4) merged unchanged baseline as `a0a56d9`. | Independently review future baseline amendments.                                   |
| P3 parser                 | Pure TypeScript physical-frame parser, independent sample reconciliation and 56 parser unit cases passed.                                                                                                  | Preserve format scope and count semantics.                                         |
| P4 local integration      | Native API, frontend and separate non-root images passed all 60 external cases on released main. Total 75 unit cases comprise 56 parser and 19 HTTP cases.                                                 | Hosted verification and universal throughput claims remain outside observed scope. |
| P5 repository release     | Main-only exact-image publication produced `v0.1.6`; ten assets verified and actual identical publisher retry succeeded; [closure](v1-closure.md).                                                         | Preserve released bytes, verify each later release and keep deployment deferred.   |

## Project progression

The historical events through diagram maintenance occurred on October 9 in America/New_York; some GitHub timestamps are
October 10 UTC. Companion approval, product merge and first publication below occurred October 10 locally. Commit IDs
distinguish original evidence, protected-main squash identities and the reconciled product branch.

| Step                                | Verified progression and evidence                                                                                                                                                                                                                                                                                           |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository foundation               | [PR #1](https://github.com/brobro10000/mp3-frame-counter/pull/1) merged as `143498a`. Original tooling/source delivery and later owner-only review exception are recorded in [foundation evidence](../validation.md) and [controls](../repository-controls.md).                                                             |
| Unified planning                    | [PR #2](https://github.com/brobro10000/mp3-frame-counter/pull/2) merged as `0c9f538`. The owner then authorized ordered P1–P5 execution; [authorization](../phases/execution-authorization.md).                                                                                                                             |
| Independent foundation and baseline | P1 adaptation and P2's original test-only source `28c2a9c` were independently reviewed before parser/API/UI work. Local product work initially used that provisional baseline; this did not satisfy shipping ancestry.                                                                                                      |
| Parser and local integration        | Original parser source `f7ad2f5` and clean P4 source `2adf71b` passed their recorded checks. P4 passed all 60 external cases, resource/lifecycle checks and private-sample comparison; [P3](p3-parser.md), [P4](p4-integration.md).                                                                                         |
| Local artifact preparation          | Original preparation source `b99b292` exported the exact P4 images as provisional `0.1.10`; archive verification and identical reuse passed. This was local preparation, not a GitHub release; [P5 evidence](p5-preparation.md).                                                                                            |
| Release-only amendment              | The owner deferred deployment. Publisher source `dab51da` and [release-only tests](release-only.md) implemented exact tested-image publication without provider operations.                                                                                                                                                 |
| Separate prerequisite merges        | PR #3 merged as `60e51fb` and PR #4 as `a0a56d9`. The independent acceptance author bound the unchanged suite to P2's real protected-main commit. The earlier product CI failure at `4364fa0` correctly rejected the provisional baseline absent from main.                                                                 |
| Product reconciliation              | Eleven product/evidence commits were replayed onto P2's squash commit with identical patches. Tree `f94ded5` matched pre-rebase `7ad43e4`; `3f16c36` then bound the baseline metadata and updated status. [Run 38010664820](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38010664820) passed mandatory CI. |
| Diagram maintenance                 | All 16 diagrams gained mandatory rendering. Three implemented views gained source references; the live [sync probe](mermaid.md#controlled-sync-probe) produced bot commit `407f084`. Its placeholder was restored manually, and the complete corrected head `3e7e21d` passed PR CI.                                         |
| Companion review and product merge  | On October 10, `brobro1000` supplied [automated approval](https://github.com/brobro10000/mp3-frame-counter/pull/5#pullrequestreview-5477487545) for `8f41b9f`. The owner merged PR #5 as `ce50762b`; this is not a human review claim.                                                                                      |
| First publication and retry         | Main run `38023037504` published `v0.1.6` at 00:11:49 EDT. A publisher-only retry completed at 00:14:34 EDT with the same release/tag/assets; [exact evidence](artifacts/v1-release-closure.json).                                                                                                                          |

Historical reports retain the exact SHAs and results used at the time. Rebase equivalents are `f7ad2f5` → `839325b`
(parser), `2adf71b` → `3a191f8` (P4 proxy repair), `b99b292` → `66abdff` (preparation) and `dab51da` → `7556810`
(publisher). Those mappings explain history; they do not rewrite tested artifact identities or make old results evidence
for an arbitrary new head. Squashed/replayed commit identity differs from source and suite identity.

## Preserved local evidence

The original P4 run used the unchanged frozen suite at `28c2a9c548f872dac54d9395a8ca0ed852f82240`. Its
[exact report](artifacts/p4-local-acceptance.json) records clean application source, tested local image IDs, suite tree,
fixture manifest and isolated configuration: 60 planned/passed, zero failed/skipped and successful scoped cleanup. Local
image IDs are not a claim of registry publication.

Review found and corrected late-header truncation, implicit Docker socket delegation, unstable restart ports and
stopped-upstream error classification before the final passing run. The local sample check returned **6,090 physical
frames** from the unchanged 1,458,172-byte input; [oracle evidence](sample-baseline.md) explains MediaInfo's 6,089 audio
frames plus one complete Xing-bearing frame. Private sample bytes remain ignored and never gate ordinary CI.

[Release-only validation](release-only.md) preserves its original 16 renders, 82 tooling/gate tests, 75 application unit
tests and clean-source 60/60 acceptance run. The later protected-main baseline binding and passing PR CI supplement that
historical evidence; they do not retroactively change its provisional local inputs.

## Next iteration boundary

1. Review and merge the V1 closure PR through the existing controls. Its documentation does not merge itself or
   authorize an override. A separate plan should define the next iteration using the
   [closure carryovers](v1-closure.md).
2. Continue the existing automatic release cycle: each eligible protected-main push runs mandatory checks and publishes
   the exact accepted images. This includes documentation-only merges while the application is present. Failed checks
   block publication; rerun only an already-reserved release's publisher with its original bundle.
3. Keep deployment deferred. If explicitly resumed, complete provider fit/access/budget, registry identity, stage
   acceptance, exact production approval, hosted smoke and authorized recovery under the separate runbook.

Use the [release-only process](../deployment/release-only.md) for active publication and the
[deployment runbook](../deployment/runbook.md) only for deferred hosting. The optional read-only GitHub helper has an
[application-main audit limitation](../repository-controls.md#application-release-audit-limitation); verify actual
publisher results and assets directly rather than interpreting its foundation-delivery assertion as release failure.
