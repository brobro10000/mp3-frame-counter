# P4 integrated local acceptance

Observed on 2026-10-09. The integrated application at clean commit `2adf71b447bfee9b78e9bdfc2b29566af894d0fe` passed the
complete independent acceptance suite. This establishes local P4 behavior; protected-main baseline publication and
managed release remain separate unmet gates.

Trace: APP-V1-001–010,013,016; AC-01–12. See the exact [sanitized result](artifacts/p4-local-acceptance.json),
[API evidence](p4-api.md), [frontend evidence](p4-frontend.md) and [independent controller evidence](p4-controller.md).

## Exact inputs and results

The controller extracted the original independently authored suite outside the product checkout. Its source and expected
outcomes were unchanged throughout implementation and repair:

- Suite commit: `28c2a9c548f872dac54d9395a8ca0ed852f82240`.
- Suite tree: `b789ffe426f4d0a303144338923748c9cdf424cf`.
- Fixture manifest: `2f56db4641f9e5c09b34c2bc0c630e85a46a010025c634375b110a35e2cb120a`.
- Contract: r3; 46 fixed fixtures and 60 external cases.
- Publication status: provisional local review; separate acceptance merge still required for shipping CI.

Using pinned Node 24.20.0/npm 11.19.0 and Docker's `linux/amd64` platform:

```sh
npm run validate
node scripts/run-ci-phase.mjs
```

Foundation validation passed formatting, actionlint, policy, portability and **49 gate/tooling tests**. The phase
controller passed frozen harness checks, **75 parser/API unit tests**, TypeScript compilation, clean independent image
builds, **60 of 60 real acceptance cases**, and scoped container/network cleanup. There were zero failed or skipped
acceptance cases. Chromium execution took 14.3 seconds; the complete integration lifecycle took 32.981 seconds. These
local timings are observations, not a performance guarantee.

The successful run used these exact locally built image identities:

| Component | Local image ID                                                            |
| --------- | ------------------------------------------------------------------------- |
| API       | `sha256:f720d77ebf4690fbb96092e4eea1fe32201ac22a5e713eb88acf68ff49534634` |
| Frontend  | `sha256:d1b001b4f683d82177e65e20241b6b92ba47f1deb681f89d35a4ca69aabfa424` |

These are local image IDs, not evidence of a published registry digest or managed deployment. The result records actual
source, clean-worktree state, suite, configuration and container identities. The local configuration hash includes the
isolated test configuration; it does not identify a future cloud environment.

Acceptance traversed the actual NGINX frontend and native API. It covered accessible explicit upload, raw bytes, exact
independent counts, tags and malformed/unsupported formats, uploads above 1 MiB and 6 MiB, exact 20 MiB, readable +1 and
chunked 413, route/method/HEAD semantics, pending/duplicate/retry behavior, safe error rendering, incomplete-upload
abort, actual stopped-API 502, actual paused-API 504 and successful recovery. Fault operations targeted only the test's
own API.

## Repairs and independent review

The first full run passed 58/60 and exposed changing Docker host ports after stop/start. A separate owned probe verified
that Docker reassigned an ephemeral published port on the same container. The independent controller author replaced
that mapping with OS-selected ports reserved through build, then published explicitly. A collision fails startup; no
caller chooses ports or displaces another process.

The next clean run at `ff0d770` passed 59/60. A stopped API could time out while connecting to its cached address and
produce 504. The frontend author observed actual NGINX connection timing and corrected locally generated failures:
unestablished connections return 502; an established connection that stalls still returns 504. Three focused stopped
cycles, pause/recovery and active-upload shutdown passed before the final full run. Earlier failed reports remain in
ignored per-run artifacts and their causes are preserved in the controller/frontend evidence.

Independent product review found and corrected silent Node header truncation: all policy headers within the 8 KiB cap
are now retained, with a real late-header regression. Independent controller review found and corrected implicit
`use_api_socket` delegation. Reviewers `review_unified_coverage` and `planning_pr_evidence` returned advisory PASS after
repairs and matching source hashes. Those are agent reviews, not GitHub human approvals.

## Resource, retention and shutdown observations

A separate default two-service Compose instance exercised the same API code and limits. Two almost-complete 20 MiB
uploads occupied both admission slots; a third upload received 503. Both held requests were aborted, then ten complete
exact-limit uploads returned 54,613 frames each.

| Observation                      | API                                 | Frontend                          |
| -------------------------------- | ----------------------------------- | --------------------------------- |
| Configured memory limit          | 256 MiB                             | 64 MiB                            |
| Observed cgroup peak after probe | 170,319,872 bytes (about 162.4 MiB) | 13,996,032 bytes (about 13.3 MiB) |
| OOM events/kills                 | 0                                   | 0                                 |
| Persistent filesystem changes    | None                                | None                              |
| Files in temporary mount         | None                                | NGINX configuration and PID only  |
| Runtime identity                 | UID/GID 1000                        | UID/GID 101                       |

The resource probe preceded the final proxy-only correction. It used Linux AMD64 containers on the local Docker runtime;
these measurements include cgroup overhead and are not a universal RSS or throughput bound. Source review additionally
established the two-buffer cap, actual-byte checks, no persistent upload paths and no runtime parsing package.

An idle API container handled SIGTERM and exited 0 in 157 milliseconds, retained the same image/container on restart,
returned healthy and accepted the private sample again. API unit checks separately exercised admitted-request draining
and forced closure of an incomplete body. The final frontend repair was tested with an active incomplete upload: SIGQUIT
exited 0 in 5.200 seconds without OOM or partial success, inside the seven-second Compose grace.

`make validate-sample` sent the unchanged 1,458,172-byte private sample through the public local frontend and returned
exactly **6,090** frames. Its identity was rechecked against the independent oracle. No private bytes entered Git or CI.
An additional real browser upload displayed the permitted tone fixture's exact count of 9 at desktop and mobile widths.

## Remaining boundaries

PRs #3 and #4 have passing exact-head CI but await separately authorized merges. Product shipping CI intentionally fails
until the separately merged test-only baseline is bound to its actual protected-main SHA. The local baseline does not
substitute for that condition. Revalidate the integrated merged revision after completing the required merge sequence.

No Render account, paid resource, registry publication, candidate deployment, production approval, application release
or managed recovery is established by this document. All APP-REL-001–006 remain required for MVP completion. See
[deployment preflight](deployment-preflight.md) and the [release runbook](../deployment/runbook.md).
