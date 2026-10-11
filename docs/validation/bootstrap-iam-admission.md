# Bootstrap IAM admission validation — 2026-10-11

This evidence covers the [two-file classification amendment](../testing/bootstrap-iam-admission.md). PR #36's initial
[run 38099688956](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38099688956) correctly refused the
unclassified bootstrap paths before any head-owned command. This prerequisite preserves that failure and the existing
trusted-base boundary.

## Independent expectations before implementation

An independent author appended 20 groups without changing the original 42,495 test bytes. A different reviewer inspected
the expectations and rehashed all 12 retained records. The focused red run selected 27 groups: 11 passed and 16 failed
on missing classification. Four mixed-change cases remained red before reaching their intended downstream guard; those
guards were not claimed passed. Contract, tests and phase documentation were frozen in
`25660d7c5e480c43cd4e89cf431eb8003752dc14` before root changed the resolver.

## Implemented scope and local verification

The resolver adds exactly two literal entries: bootstrap `main.tf` is governance and its exact `README.md` is
documentation. No Terraform, workflow, required suite, pending binding or release behavior changed.

Pinned Node 24.20.0 ran:

```sh
node --test --test-reporter=tap \
  scripts/acceptance-transitions.test.mjs scripts/acceptance-admission.test.mjs \
  scripts/acceptance-consumers.test.mjs scripts/acceptance-preflight.test.mjs \
  scripts/acceptance-preparation.test.mjs scripts/acceptance-publication.test.mjs
```

All **227 tests passed**, with zero failures, skips or cancellations. This includes descendant/historical replay,
neighboring paths, regular-file enforcement and the reached mixed product/candidate/binding restrictions. Targeted
Prettier, repository policy, tracked-path portability and `git diff --check` passed. No full local product suite or
cloud operation was rerun for this path-only change; normal mandatory CI remains required.

| Retained identity        | SHA-256                                                          |
| ------------------------ | ---------------------------------------------------------------- |
| Independent test source  | f5cae3fec1c4701a8ed1294583c076e28b122b26959d1682dea7f96463b840a9 |
| Two-entry implementation | 7ffcefeb8031cc33526d67a43c6136371430f204a126a4a19ee0d03994ea3f87 |
| Completed local TAP      | f77cf2625b94e7fcf7c8553e6c326ff8e38cedd76f9ed754e0a80153d181b85a |

Private logs are evidence retained by the coordinator, not portable test inputs. This local result does not establish PR
approval, protected-main publication, live IAM correction, remote-state migration or hosted execution. Refresh the
dependent immediately after normal merge; verify prerequisite publication before merging that dependent.
