# MVP execution status

Observed on 2026-10-09 under the owner's [P1–P5 execution instruction](../phases/execution-authorization.md). The local
product is verified. **The latest owner instruction requires releases without deployment.** Protected-main acceptance
baseline publication and the first automatic GitHub release remain outstanding; deployment is deferred. See the
[scope amendment](../requirements/release-process.md).

| Phase                     | Observed outcome                                                                                                                                                                                          | Remaining boundary                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| P1 foundation             | Implemented and independently reviewed; exact-head mandatory CI passed for [PR #3](https://github.com/brobro10000/mp3-frame-counter/pull/3), source `445e374`.                                            | Separate merge/owner-override instruction; no merge performed.                                                                      |
| P2 independent acceptance | Reviewed test-only suite preceded product source: 46 fixtures, 60 cases, independent oracle; exact-head CI passed for [PR #4](https://github.com/brobro10000/mp3-frame-counter/pull/4), source `28c2a9c`. | Separate test-only merge and binding to its actual protected-main squash SHA.                                                       |
| P3 parser                 | Pure parser independently reviewed, 56 unit cases and source/compiled private sample comparison passed.                                                                                                   | Provisional local baseline remains distinct from shipping approval.                                                                 |
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

1. Obtain explicit instruction for the owner review override/merges, then land P1 and the separate P2 test-only scope
   through unchanged core controls. Update the later PR against each actual main revision and rerun required checks.
2. Have the independent baseline owner record P2's actual merged main SHA with unchanged suite tree/fixture manifest.
   Rebase or replay the product scope without refreezing expectations from implementation results. Validate the actual
   integrated source in CI; the current trusted-base check intentionally rejects the provisional branch-only baseline.
3. Merge the reviewed application/release scope only after its mandatory checks pass. On the resulting protected-main
   push, run all mandatory checks and export the exact tested images on the acceptance runner. The publisher verifies
   the same-run bundle, source and checks before completing its tag/private release. Record the actual release URL and
   verified asset identities; configuration and local tests alone do not establish this observation.
4. Keep deployment deferred. If resumed later, complete provider fit/access/budget, registry identity, stage acceptance,
   exact production approval, hosted smoke and authorized recovery under the separate runbook.

Fresh read-only merge audit on 2026-10-09: PR #3 at `445e374` and PR #4 at `28c2a9c` have passing mandatory checks and
remain review-blocked. PR #4 must be refreshed/rechecked after PR #3 lands. PR #5 at `4364fa0` remains draft, and its
product/control-plane failures correctly reject the provisional baseline absent from protected main `0c9f538`. These
observations do not certify later edited heads. No merge, review override, tag, published release or deployment was
performed during this release-only amendment.

The [release-only process](../deployment/release-only.md) separates configured automation from the first observed
publication. The [deployment runbook](../deployment/runbook.md) retains deferred operational criteria and does not
represent an operating stage/production pipeline.
