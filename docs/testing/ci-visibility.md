# CI visibility migration

**Activation amendment — 2026-10-11:** the source now calls the four named reusable workflows described in the
[CI workflow guide](ci-workflows.md). The terminal gate and publisher require their source-bound worker results.
Admitted split CI assigns host builds/units to application and server workers, while acceptance retains suite controls,
real Docker builds and frozen Playwright E2E. Local and legacy controller execution retains the complete original work.
Protected-main execution and publication must still be observed after the activation merge. The dormant statements and
dated validation below describe the earlier policy prerequisite; they do not select an older workflow for this source.

This policy support is dormant. The active `MVP CI` workflow still runs `validate-foundation`, `validate-product` and
the terminal `control-plane` gate. A separate, reviewed activation PR will introduce the workflow family below after
this policy is present on protected main. No cloud delivery or production permission is granted by the split.

The finite family separates visible domains within the same original workflow run:

| Coordinator caller                       | Local reusable workflow                     | Required executing jobs          |
| ---------------------------------------- | ------------------------------------------- | -------------------------------- |
| `validate-foundation` — Linter           | `.github/workflows/linter.yml`              | `checks` and four tooling shards |
| `validate-product` — Base acceptance E2E | `.github/workflows/base-acceptance-e2e.yml` | One unsharded `validate-product` |
| `application-tests` — Application tests  | `.github/workflows/application-tests.yml`   | `application`                    |
| `server-tests` — Server tests            | `.github/workflows/server-tests.yml`        | `server`                         |

The tooling shards retain all 46 existing files exactly once: foundation 8, acceptance 13, publication 9 and
delivery 16. The independent visibility tests join the separate mandatory gate command, alongside `ci-gate.test.mjs`.
Matrix failure propagation remains enabled. Only the delivery tooling shard installs pinned Terraform 1.13.3 and
initializes the locked providers with backends disabled; those checks neither authenticate to Google nor change
resources.

Every executing validation job preserves the exact trusted-base inline preflight before `npm ci` or head-owned commands.
Required local acceptance remains one 72-case execution with its original image export, admission digest and prepared
bundle on the same runner. Candidate controls cannot replace that execution. The terminal gate runs with `always()` and
requires all four callers to succeed; missing, failed, skipped or extra results are rejected.

`scripts/ci-visibility-policy.mjs` validates the complete parsed family and exposes a bounded, Node-only Git-object
reader for the exact producing source. The reader classifies only the known canonical coordinator shape and reads its
reusable files and package commands from the same commit. Classification does not replace parsed policy checks, trusted
preflight, acceptance or observed successful jobs. There is no caller-selectable layout fallback.

The real GitHub `control-plane` CLI checks its source and workflow identity and uses that reader. Exported historical
two-job APIs and nonterminal test invocations retain their existing behavior. This keeps old evidence replayable while
the reviewed workflow fixes the actual terminal invocation.

The publisher and owner-supervised finalizer forward their explicit repository root to observed-check verification. They
derive the required job names from the original bundle's producing commit, even when working HEAD has another layout.
The future layout requires nine successful, unique original-attempt jobs, including each worker's successful preflight.
The expected nested job names are provisional until the activation PR observes them in real GitHub Actions. Borrowed
historical job names cannot satisfy a future source. Historical direct APIs remain compatible; current CLI publication
supplies its root explicitly.

The original workflow origin, producing attempt, image pair, bundle and immutable reservation remain unchanged.
Publication continues to record the same three logical checks in its established schema. Their live verification now
covers the source-bound expanded workers and four-caller terminal gate; this migration does not reinterpret published
assets or add mutable local paths to evidence. Software releases remain independent of deployment, which is currently
deferred.

Run `npm run test:gate` for the legacy gate plus independently authored visibility controls, and `npm run check:policy`
for the current checked-out family. The controls exercise exact-source Git fixtures, actual gate/publication CLIs and
real publisher/finalizer validators with synthetic GitHub observations. They establish local policy behavior, not a
hosted run, release publication, companion approval or deployment.

## Independent local evidence — 2026-10-11

The independent acceptance author specified the literal graph, expectations and rejection decisions before the separate
implementation lane changed the relevant helper or consumer. Actual pre-implementation results were retained:

| Authored control stage                                      | Actual result                             | Raw log SHA-256                                                    |
| ----------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| Initial finite policy/source-reader controls                | 18 groups: 2 pass, 16 fail, 0 skip        | `f685d84c8f601af7bbeedfe0dc1ee68a19a03efa1637b4862dbcd50c68c01040` |
| Real publisher/finalizer/CLI wiring controls                | 25 groups: 7 pass, 18 fail, 0 skip        | `8a69c48dac1772d97ed216c0fcc1d75c104796e5ed6787b15cf63ae01b9cd37b` |
| Actual future terminal-gate CLI controls                    | 4 selected groups: 0 pass, 4 fail, 0 skip | `797923b95e911787f05143b790ee7643587501a8623742f9f473846f1539d09e` |
| Independently reproduced execution/setup review regressions | 4 selected groups: 0 pass, 4 fail, 0 skip | `66500240c446e54b4a642742eda950dc0acf913575c8e7de5edeb9ed2dba6fe0` |
| Actual stage verifier source-root forwarding controls       | 2 selected groups: 0 pass, 2 fail, 0 skip | `4bf359c8bb765aa3bae2d0cb22a672c54cf079b7cb7f24d0321c5d24d5d5e82a` |

Initial missing exports were availability failures, never successful negative controls. Later wiring and terminal-gate
controls included successful historical counterparts before testing future-source acceptance and legacy-check refusal.
The initial gate-inclusive expectation file had SHA-256
`64c52f97c311747f9251b68789a367050765ff1479c789129af8bc73e26d63cc`. Independent review then reproduced admission of
conditional acceptance, substituted setup actions and moving native tools; separately authored controls preceded their
fixes. All workers now require the known checkout/Node prefix and preflight position, and linter/acceptance steps are
closed and ordered. Required acceptance is unconditional. The stage verifier also forwards its explicit source root. The
final 35-case frozen expectation file has SHA-256 `42c5c57bbed41073b9a74b50835cbf0cf9e0e907a5c9586eb2121de62d852a48`;
the implementation lane did not edit it.

After implementation, affected historical CLI fixtures revealed a missing source-workflow prerequisite and an old
blanket subprocess denial. The independent author added the protected historical YAML to their disposable Git commit and
allowed only the reader's three exact, bounded Git-object queries. Every other subprocess/network denial, existing
assertion and version 6/7 golden body remained unchanged. This repaired fixture has SHA-256
`2c23b80657565725eb32ba7a6ceb3bee82eaf45b032b81516b04f24bc615aa90`; it adds no production bypass.

Retained green runs distinguish the initial migration from the final independently reviewed adapters:

| Actual command scope                                                               | Result                   | Raw log SHA-256                                                    |
| ---------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| Initial gate/visibility implementation before the added review regressions         | 49 pass, 0 fail, 0 skip  | `7d622013415156498cce8a819c3040f1bbc4f2f0357c4bb6bf11ebe41d52120a` |
| Six affected gate, preflight, publication and finalization test files              | 143 pass, 0 fail, 0 skip | `095d20331cea2f165c000926f28b5d0eb863087196e37889046647acbb91a5a4` |
| Final `node --test scripts/ci-gate.test.mjs scripts/ci-visibility-policy.test.mjs` | 55 pass, 0 fail, 0 skip  | `f706626a50a4b2e6086f830ecba5ee1d5ea2baea43d7aaa019de5483607d2c41` |

The complete 46-file tooling command was also attempted with pinned Node 24.20.0 and the existing locked provider
mirror. Its local driver reached its 300-second bound before a suite summary; the retained incomplete log has SHA-256
`c4cf9bca1220a3401b4edaa5f4710a30d2b8a7b0c89088e4a227f4c104bad65e`. This establishes no full-suite pass or failure. The
required exact-head CI must execute the complete tooling suite within its existing workflow budget.

Separately, [React PR #57 CI attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38143010268)
tested head `94a63df5f2327ff7f46d5548733e310a8722c963` against base `f763976b5b5cc8d0187bcf802da7c9b496b82218`. Product
checks passed all 174 unit tests and 72 external acceptance cases. Foundation tooling reported 901 of 903 passing; its
two failures came from the historical stage-configuration fixture copying current `package.json` while retaining an old
lock. This was a fixture dependency-parity failure, with no product acceptance failure in that run.

The independent author reproduced that fixture failure, tested a temporary matching-lock correction, and restored the
original React test bytes. In this governance scope the fixture now copies the actual imported visibility helper and
matching root lock. Its unchanged assertions still enforce dependency parity. The repaired fixture has SHA-256
`272bead032b23a78af305b2feaea7a5499bdd72a7b0ac15175aec8826acb89a7`; the original React fixture was restored to
`664bfb73ee29fa52043ed57a3374ceed37737cdcf62660e4f3cc84ff1bdae429`.

| Independent fixture control                                       | Actual result          | Raw log SHA-256                                                    |
| ----------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------ |
| Original unchanged React stage-configuration fixture              | 5 pass, 2 fail, 0 skip | `0d1c7df359f0f711773d858b715198ea31a5f66393a4628c35802fc8a7e13f42` |
| Temporary lock-only React diagnostic, original restored afterward | 7 pass, 0 fail, 0 skip | `c8f46a62d9cb0b5e13d9be756a08580acfe577a938618e077c20b18367611391` |
| Final coherent copied-module/package-lock fixture                 | 7 pass, 0 fail, 0 skip | `d6aec5eb565477118e082ea76ed965a7fa9bd34e5d7539c05fd7f8c05d436dc0` |

These results distinguish local policy evidence from the separate observed React CI failure. The active coordinator and
trusted inline bootstrap were unchanged; reusable activation and actual nested-job observations remain a separate PR
prerequisite. No complete-suite success, release publication or deployment is claimed here.

The first [PR #58 full CI run](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38144351575) tested head
`2780be746038203a5e6fc8205e2314a76ec8ce6f` against the same protected base. All 55 gate cases and product acceptance
passed; tooling reported 901 of 903 passing. Its two failures were a closed allocation fixture missing the newly
imported visibility helper, and the new full-inventory check preceding the existing specific missing-docs-test
diagnostic. The fixture prerequisite and check order were corrected while preserving the original assertions and strict
inventory. This failed run remains evidence; a fresh exact-head run is required before merge.

Independent fixture review also reproduced four activation compatibility failures before correction: two disposable
metadata fixtures omitted the actual called workflow files, and two preflight fixtures expected inline caller steps.
Only fixture inputs and closed caller-to-leaf lookup changed; all existing test bodies/assertions and bootstrap command
bytes remained unchanged. The four files then passed 128 checks with current legacy inputs and 128 with prepared
reusable inputs. The latter diagnostic redirects only the five workflow-file reads in those fixture constructors; it
does not alter validators, commands, Git history or working workflows. Its raw log SHA-256 is
`bf5afbc5ce55161bd385e647bf5b24113acfb8f08788a3e86d4a70603a86f37a`. This proves local fixture compatibility, not live
Actions job identity or workflow activation.

Four existing legacy publication/consumer controls now pin workflow bytes from protected source
`2ae305c57c3ccb1ecbc6e7e6f9e8ae6d3894fcbf`, which are identical to this PR's trusted base workflow. Their assertions and
mutations remain intact. Before correction, a prepared-workflow diagnostic reported 12 failures and two passes; after
correction all 14 selected cases passed. The complete four-file run passed 68 checks without skips; its raw log SHA-256
is `ac8db8c572d64e7a3a07f32720f6a6bd7fe58f9152f285a9e2536a062499dbcf`. These controls test the historical guard; the
separately authored visibility suite tests the new finite family. Pinning historical inputs does not waive current
workflow policy or observed source-bound jobs.

See [acceptance admission](acceptance-transition.md), [release-only policy](../deployment/release-only.md),
[deployment runbook](../deployment/runbook.md) and [current execution window](../phases/next-iteration.md).
