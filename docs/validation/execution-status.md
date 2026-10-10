# MVP execution status

Observed on 2026-10-09 under the owner's [P1–P5 execution instruction](../phases/execution-authorization.md). The local
product is verified. **The latest owner instruction requires releases without deployment.** P1/P2 are now merged on
protected main and the independent baseline is bound to P2’s actual commit. Product PR verification/merge and the first
automatic GitHub release remain outstanding; deployment is deferred. See the
[scope amendment](../requirements/release-process.md).

| Phase                     | Observed outcome                                                                                                                                                                                          | Remaining boundary                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| P1 foundation             | Implemented and independently reviewed; exact-head mandatory CI passed for [PR #3](https://github.com/brobro10000/mp3-frame-counter/pull/3), source `445e374`.                                            | PR #3 merged as `60e51fb7da24155bfe3f15e91cbe33884047e574`.                                                                         |
| P2 independent acceptance | Reviewed test-only suite preceded product source: 46 fixtures, 60 cases, independent oracle; exact-head CI passed for [PR #4](https://github.com/brobro10000/mp3-frame-counter/pull/4), source `28c2a9c`. | PR #4 merged as `a0a56d94e5457101cd043b6055ab084782c3e16f`; unchanged suite independently bound to that SHA.                        |
| P3 parser                 | Pure parser independently reviewed, 56 unit cases and source/compiled private sample comparison passed.                                                                                                   | Historical local evidence remains distinct from current-head shipping CI and human review.                                          |
| P4 local integration      | Clean `2adf71b447bfee9b78e9bdfc2b29566af894d0fe` passed 75 unit cases, all 60 external cases and cleanup; two AMD64 images, resource/lifecycle checks and browser/sample checks passed.                   | Revalidate the actual integrated main revision after baseline publication. Hosted observations are deferred.                        |
| P5 repository release     | Deployment preflight and reviewed local preparation executed: exact tested images exported as provisional 0.1.10; checksums and unchanged retry passed.                                                   | Observe protected-main CI and its automatic GitHub release. Provider setup, rollout, hosted verification and recovery are deferred. |

Detailed evidence: [P1](p1-foundation.md), [P2](p2-acceptance.md), [sample oracle](sample-baseline.md),
[P3](p3-parser.md), [P4 integration](p4-integration.md), [exact P4 result](artifacts/p4-local-acceptance.json) and
[P5 local preparation](p5-preparation.md), plus [deployment preflight](deployment-preflight.md). Historical handoffs
record what was known when authored; this status and subsequent evidence appendices identify later outcomes without
erasing failed observations.

## Verified local boundary

The final P4 run used the unchanged frozen suite at `28c2a9c548f872dac54d9395a8ca0ed852f82240`. The report records clean
application source, exact local image IDs, suite tree, fixture manifest and isolated local configuration. It reports 60
planned/passed, zero failed/skipped and successful scoped cleanup. Local image IDs are not registry digests.

Reviewers found issues in the actual implementation and controller; their owners corrected late-header truncation,
implicit Docker socket delegation, unstable restart ports and stopped-upstream error classification. The final passing
run followed those repairs. Independent agent reviews are advisory and are not human GitHub approvals.

The local demo runs at `http://127.0.0.1:8080` after `make up`. Both service health checks passed after rebuilding the
latest source, and `make validate-sample` again returned the independent physical-frame expectation of 6,090. A fresh
clone uses the permitted fixtures; private assessment audio is never a CI prerequisite.

## Remaining execution sequence

1. Validate the reconciled PR #5 revision against trusted main `a0a56d9`. P1/P2 are merged and the independent owner has
   bound the unchanged acceptance suite to its actual P2 squash commit; all ancestry and byte-integrity guards remain.
2. Merge the reviewed application/release scope only after its mandatory checks pass and the owner's review decision. On
   the resulting protected-main push, run all mandatory checks and export the exact tested images on the acceptance
   runner. Record the successful publisher run, release URL and verified assets; configuration and local tests alone do
   not establish publication.
3. Keep deployment deferred. If resumed later, complete provider fit/access/budget, registry identity, stage acceptance,
   exact production approval, hosted smoke and authorized recovery under the separate runbook.

The earlier PR #5 failure at `4364fa0` correctly rejected P2's then-provisional branch baseline absent from main
`0c9f538`. That historical failure is preserved. PR #3 and #4 subsequently merged on 2026-10-10 UTC (2026-10-09 local).
The current reconciliation replays all eleven product/evidence commits onto P2's squash commit. `git range-diff` reports
identical patches, and the rebased tree at `f94ded51f1cd06df4953a66eae748972e9838c2f` exactly matches pre-rebase
`7ad43e4`. Only independently owned baseline metadata and current status prose change after that replay. Frozen tests,
application, release scripts and gates retain their bytes. This task updates PR #5 and marks it ready for review; it
does not merge it, invoke a review override, publish a tag/release or deploy.

The [release-only process](../deployment/release-only.md) separates configured automation from the first observed
publication. The [deployment runbook](../deployment/runbook.md) retains deferred operational criteria and does not
represent an operating stage/production pipeline.

## Release-only implementation validation

The reviewed publisher and scope amendment are implemented at `dab51daeda4a2217c038fb2d067c194b526aa148`.
[Release-only validation](release-only.md) records passing 16/16 Mermaid renders, 82 gate/tooling tests, 75 application
unit tests and a fresh clean-source 60/60 external acceptance run with successful cleanup. Those historical results used
the provisional local SHA. The equivalent suite is now separately merged and bound to protected main; rerun current-head
CI against that identity. No actual GitHub release or deployment has been observed, and agent review is not human
approval.
