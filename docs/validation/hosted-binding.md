# HOSTED-BIND proposal and verification evidence

**Proposal status — 2026-10-10:** PR28's actual candidate identity, exact approval, final PR CI and protected-main
publication are verified below. This change appends its binding; this binding's own CI, review, merge and publication
remain pending. No hosted execution, activation or deployment is established.

The [transition policy](../testing/acceptance-transition.md#separate-candidate-binding-and-implementation) separates
candidate authoring, actual squash binding and product activation. A binding-only merge continues to require docs-v1 and
its 72 local cases. Once bound, hosted-v1 becomes pending for the next genuine product-affecting change; a
governance-only helper does not activate it. Hosted checks still need the trusted launcher and real environments, and
every production application deployment requires human intervention for the exact candidate.

## Actual candidate and review identity

[PR28](https://github.com/brobro10000/mp3-frame-counter/pull/28) merged on `2026-10-10T21:58:06Z`, authored by
`brobro10000` and targeting main. Its actual protected-main squash has one parent and the same full tree as the exact
reviewed feature head. The feature head is not substituted for the suite commit.

| Identity                               | Verified value                             |
| -------------------------------------- | ------------------------------------------ |
| Candidate / predecessor                | `hosted-v1` / `docs-v1`                    |
| Actual candidate squash / suite commit | `4c2733ea2efa469b8e4718d8763b234ab92876e4` |
| Sole squash parent                     | `a98a434570a934831c64a64d3231950f27574b43` |
| Reviewed feature head                  | `711e96c0900e8d88d1c0bb20a6164d37668b3e0e` |
| Reviewed and merged full tree          | `1a86e1f81226228d3661f33bc70bb38a33653b52` |
| Candidate acceptance suite tree        | `343fc6c3d7abadcba2605ed1fb31b0f6ec4f883a` |

The authenticated
[approval 5480947557](https://github.com/brobro10000/mp3-frame-counter/pull/28#pullrequestreview-5480947557) is APPROVED
by distinct reviewer `brobro1000` at `2026-10-10T21:57:38Z` and names that exact feature head. The exact endpoint agrees
with the complete history: one short page containing one review, with no later decisive review on any head. The existing
review collector accepted replay of the retained authenticated responses. This is automated companion approval, not
human approval for deployment; the future binding PR must obtain its own fresh review.

The [squash](https://github.com/brobro10000/mp3-frame-counter/commit/4c2733ea2efa469b8e4718d8763b234ab92876e4) changes
exactly 51 candidate-only paths: `tests/acceptance/**` and the new
[hosted-v1 contract](../testing/contracts/hosted-v1.md). All 91 suite files and that contract are regular Git blobs. No
registry, product, workflow, gate or prior contract change is hidden in the candidate merge.

## Immutable metadata and predecessor preservation

Hashes below were recomputed from the actual squash's Git blobs with replacement objects disabled. The final suite tree
includes README and the retained calibration package; the smaller control-input digest cannot replace that tree.

| Candidate blob                                        | SHA-256                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `docs/testing/contracts/hosted-v1.md`                 | `892e2f11bbae0d291a1ae82340acfc40a94f68fed265ce811e7565f623396949` |
| `tests/acceptance/fixtures/manifest.json`             | `130e728e0cf43282b6a4d16108dcc8c3a44bd4e4e8030d7828ddfa00df8f0ae4` |
| `tests/acceptance/fixtures/profiles.json`             | `8a6d8f6a6dc270ea818befde5df7bff8d9790328184496ea59ccfbb235b54bd1` |
| `tests/acceptance/fixtures/inventory.json`            | `e000044ee3bb6c466876e586c7692ad899c75898a5e0d0d532e1cf9efc65b4b5` |
| `tests/acceptance/fixtures/inventory.stage.json`      | `6fa02ec1314d031964a4613bc8b3a535ff3617259642394f0204f7d122a6e5fc` |
| `tests/acceptance/fixtures/inventory.production.json` | `3910f814f74999ffa376a891db7fb93b14888513d98707fe13772fb9277045ba` |

The existing pure declaration validator accepts the closed metadata and complete mappings for **72 local, 22 stage and
three production identities**. These counts describe declarations, not hosted executions. The actual docs-v1 predecessor
is suite commit `351d2e5b998f882287c4c5e4bb41427d4ad5c41e`, tree `f4704be065e181cff1257e1a8a641ada23124aa0`; its local
inventory SHA-256 is `98681c1811ed3b54cf8c2994e9a24a4b2afd6a8e0f8c575d9db63cf095afc7f4`. Its own docs-v1 revision is
preserved when checking successor containment.

All 72 predecessor file/title tuples are identical in order. The existing acceptance, docs and transport spec files are
byte-identical, and manifest data differs only in contractRevision. The registry, baseline and prior contracts remain
unchanged against the candidate's sole parent. Candidate runner/discovery changes are visible in the 51-path diff; this
is not a claim that every standalone helper is unchanged.

The unchanged resolver, using the actual candidate source and actual parent as trusted base, selects docs-v1 required,
hosted-v1 candidate and no pending binding. The reconciled preparation commit `bf3953baf5f89560029cb68f16d4dd24e1c865ae`
has actual candidate main as its first parent and exactly the same tree; resolving that source against candidate main
preserves the same selection with documentation admission. Existing binding/activation fields still describe docs-v1
history, not hosted-v1 activation.

The proposed registry entry has exactly nine fields: id, predecessor, contractRevision, contractPath, contractSha256,
suiteCommit, suiteTree, manifestSha256 and review. The first eight use the immutable values above; review contains only
repository `brobro10000/mp3-frame-counter`, pullRequest `28`, reviewId `5480947557`, reviewer `brobro1000`, and the
reviewedHead/reviewedTree above. Profile hashes, CI run IDs and publication status belong in evidence rather than new
registry fields. Prior entries must remain unchanged.

## Final candidate PR CI

The retained independent audit reports
[run 38088858589, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38088858589/attempts/1)
successful at `2026-10-10T21:51:21Z`. Actual synthetic checkout `0eda2894ecb9b618e942d1f43595a0e2aa404762` has the
actual base and reviewed head as its ordered parents, and the same full tree shown above. All three mandatory job
checkout logs agree.

Foundation `114320962194`, product `114320962401` and control-plane `114321942847` succeeded. Foundation delivery and
publication were intentionally skipped for this PR. The run retained no downloadable artifacts. Both validation jobs ran
trusted-base preflight before head-owned installation; product's logged admission digest
`b2b75542435032f1c593e495209b75958d9f273b6d68cefba4d6e1c23d6bc1f6` matches the terminal gate's product output. The audit
did not have original admission bytes or the foundation digest, so this is a logged handoff verification, not an
independent canonical rehash of those unavailable records.

| PR check                         | Observed result                                                     |
| -------------------------------- | ------------------------------------------------------------------- |
| Tooling / gate tests             | 545 passed / 20 passed; zero failures, cancellations, skips or todo |
| Mermaid                          | 19/19 rendered                                                      |
| Product unit tests               | 120 passed; zero failures, cancellations, skips or todo             |
| Candidate hosted controls        | 95/95 passed; synthetic controls, not hosted application acceptance |
| Candidate discovery              | Local 72, stage 22, production three; no hosted execution           |
| Required docs-v1 application E2E | 72 passed; scoped cleanup passed                                    |

Formatting, workflow lint, policy, portability, builds and credential-free Terraform validation passed. Candidate and
required suites separately completed Linux browser preparation and scoped cleanup. Each checked 46 fixtures, 52
transport/inventory/specification/lifecycle controls and 46 docs controls. Log parsing matched the same 72 local
identities across candidate discovery, required discovery and actual execution: 60 acceptance, five docs and seven
transport. Hosted individual control rows were not downloaded; their 95-control aggregate and 22/3 discovery totals are
logged. Scoped cleanup is a harness assertion, not an independent process/socket census.

Earlier failures remain distinct. Run `38088739171` was cancelled. Run `38088758854` failed both trusted preflights
after a bot added a release-diagram timestamp edit outside the candidate-only paths; installation/controller steps were
skipped. That path-classification explanation is supported inference because the preflight suppresses the underlying
exception text. The final corrected head and run above supersede neither history nor missing evidence.

## Retained synthetic calibration and limits

The [portable calibration record](../../tests/acceptance/fixtures/hosted-calibration/README.md) preserves original JSON
bytes, source mappings and inert diagnostic source, including the failed detector-readiness attempt. It separately
records 15 normal-TLS adapter checks, 60 repeated browser controls, a normal 95-control run and a 15-assertion
interruption diagnostic. The latter proves an observed failed partial aggregate and finite owned-resource cleanup; its
interrupted control failures are not successful semantic negative controls.

Those records establish neither hosted-wrapper lifecycle nor Google IAM/audience/provider identity. The TLS result does
not embed a source/run/container identity; its documented retained-record join must not be rewritten as one. No
application target, registry transfer, image-archive rehash, stage acceptance or production authorization is implied.

## Candidate protected-main publication

[Main run 38089629269, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38089629269/attempts/1)
passed on actual source `4c2733ea2efa469b8e4718d8763b234ab92876e4`. The publisher completed successfully and published
[v0.3.28](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.3.28), release `409233189`, at
`2026-10-10T22:04:43Z`, with ten assets. The tag and release target both identify that actual source. Publication keeps
`deployed: false`; preparation remains provisional and non-deployable.

Root independently captured the successful publisher log and all eight bounded metadata assets. Original admission
SHA-256 `5eb155d89b0e648d9d6f0f119f5186a024e63d25bd51a61e89cf3d6cbd3cc84a` comes from that producing handoff, not solely
the record being verified. Replay used the original main-push source/tree, actual sole parent as base/tooling, source
workflow revision and run/attempt: admission candidate, docs-v1 required, hosted-v1 candidate, no pending binding. The
complete 72-case passing local report, cleanup, suite, source/configuration/image identities, immutable reservation and
all eight asset hashes/sizes agree. Both image archives were compared as metadata only; neither was downloaded or
rehashed. Registry digests remain null.

Metadata-verification SHA-256 is `551d91feff5d1a9d932c22e74fefed3aa03cdcd6547d2f94d178aefcb31c2978`. This read-only
audit performed no publication retry, image rebuild, transfer, application execution or deployment.

## Pending completion evidence

| Gate                                                                | Status in this draft                                                            |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Candidate protected-main run `38089629269` and software publication | Verified above; v0.3.28 remains release-only                                    |
| Registry append                                                     | Present in this proposal; prior two entries and frozen bytes preserved          |
| Binding PR identity and exact checks                                | Pending; no PR number, head, synthetic checkout or passing result assigned here |
| Binding companion approval and owner merge                          | Pending; candidate approval does not authorize the binding head                 |
| Binding protected-main admission and publication                    | Pending; no binding/activation/source or release identity fabricated            |

The candidate publication prerequisite is verified. A successful binding must separately show binding admission, docs-v1
required, hosted-v1 pending, no candidate and no hosted activation, with the actual binding source and authenticated
review observation. Original publisher provenance and existing release bytes remain unchanged.

This document condenses retained audits, without rerunning their commands during authoring. Identity-audit SHA-256 is
`8be9a8aaa580c554af279983096d7741ed11ff01f106640c2a692cc91b9ffacf`; final PR CI-audit SHA-256 is
`5edc3d8aed392b72078570fd54717e03a15f4cc43f13af0cf03a24980dcde38a`. Their raw local captures are not added as release
assets or signed attestations. Root owns subsequent publication evidence and completion amendments; this draft does not
mark HOSTED-BIND complete.

## Local binding check

Pinned Node 24.20.0 resolved proposal commit `159fba46d93796134d0010c460303e041f86ce15` against actual candidate main,
using the retained authenticated review observation. It returned binding admission, docs-v1 required, hosted-v1 pending
and no candidate. The prior registry entries are unchanged, and the suite, baseline and contracts have no diff.
Formatting, policy, portability and `git diff --check` passed. This local replay supplies no GitHub Actions authority;
normal mandatory PR checks must validate the final proposal independently. No local application test was repeated for
this registry/documentation-only change.
