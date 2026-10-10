# DOCS-BIND candidate publication evidence

## Status — 2026-10-10

This change proposes the separate binding of the published `docs-v1` candidate. Its own binding CI, exact-head approval,
merge and protected-main publication are pending. It adds no product capability. The candidate was published by
[PR #21](https://github.com/brobro10000/mp3-frame-counter/pull/21); that publication did not bind or activate docs-v1.

The [transition policy](../testing/acceptance-transition.md#separate-candidate-binding-and-implementation) requires the
actual candidate squash and reviewed-tree equivalence below. A binding-only merge continues to require `transport-v1`;
the next product-affecting change must pass the bound `docs-v1` successor, which then persists for descendants and
reverts. Root build-tool policy remains separate governance work; product dependencies, packaging, routes and CSP must
not be admitted by this binding. No docs implementation, hosted acceptance or deployment is established here.

## Candidate authorship, review and source

Automated acceptance author `transport_author` authored the candidate independently of product and illustrative-preview
source. Automated reviewer `gate_design` supplied the independent DOCS-01 security/scope disposition; the portable
[disposition](../../tests/acceptance/fixtures/docs/docs-01-disposition.md) separately attributes the E1/E3 offline
review and its limits. This document condenses retained evidence; its writer is not claiming a new independent review.

The candidate preserves all 67 preceding case identities/assertions, 46 original fixture entries, the transport OpenAPI
bytes, 26 preceding lock records and 23 untouched suite files. Five new external docs cases produce 72 discovered
identities. Its 26 changed paths contain only the candidate suite and unique contract.

| Identity                                              | Recorded value                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| Candidate / predecessor                               | `docs-v1` / `transport-v1`                                         |
| Reviewed head                                         | `3ab053816b242ded9fcd522eda08b18dac225277`                         |
| Approved and merged full tree                         | `88431a72ffc1ee448ad2cd22ef22a7d6d33e3cfe`                         |
| Actual protected-main squash / candidate suite commit | `351d2e5b998f882287c4c5e4bb41427d4ad5c41e`                         |
| Sole squash parent                                    | `c39de309867d63fc04fe1d12647680b34ee178d5`                         |
| Acceptance suite tree                                 | `f4704be065e181cff1257e1a8a641ada23124aa0`                         |
| Fixture manifest SHA-256                              | `b787342ba7464b9bb0c3b47fe4a401d9bcc32b3c3d0c0828bfa0008487c75e26` |
| Contract path                                         | `docs/testing/contracts/docs-v1.md`                                |
| Contract SHA-256                                      | `ca7d43af62d51a6a2eb051ce7681fc91def92b73f42a9768863e222b53955e44` |
| Inventory SHA-256                                     | `98681c1811ed3b54cf8c2994e9a24a4b2afd6a8e0f8c575d9db63cf095afc7f4` |

The actual
[submitted approval 5479914516](https://github.com/brobro10000/mp3-frame-counter/pull/21#pullrequestreview-5479914516)
by `brobro1000` names that exact reviewed head, at `2026-10-10T16:43:44Z`. PR #21 merged at `16:44:38Z`; captured Git
objects establish the
[squash](https://github.com/brobro10000/mp3-frame-counter/commit/351d2e5b998f882287c4c5e4bb41427d4ad5c41e) parent and
full-tree equivalence, rather than treating the PR head as the published suite commit.

Companion run `20261010T163719-f548ab13` approved all 26 paths, with documentation Pass, no findings and no required
human intervention. Its report SHA-256 is `d0903298355d41e96daf68a916c5ecda55f9e9833574104fbd2f44523f1789a0`; its
collected snapshot is `2f0f99443fb91f12d19fe6a1858ac5ce060ec28e168ddba54f19b7805093e65e`. That local review result and
the submitted GitHub approval are separate records. The later binding must establish its own authenticated admission and
approval.

## Preserved scope decisions and corrections

The [contract opening](../testing/contracts/docs-v1.md) and
[independent disposition](../../tests/acceptance/fixtures/docs/docs-01-disposition.md#scope-amendment-and-authority)
explicitly record that the earlier card's page-hiding expectation was narrowed before freeze to finite live-document
observation. Coordinator R4/R7 adopted the independent recommendation under the owner's ongoing roadmap delegation;
there was no separate human choice of the CSP hashes, data-image permission or interval. Destructive teardown remains
unverified. The retained document includes real interaction, screenshot completion and a final 200 ms live interval; its
claims exclude post-closure activity, unrelated targets, workers/popups, WebSockets and universal protocol coverage.

Historical strict-style, data-image, CDN-logo and teardown-attribution failures remain failures. The portable
disposition states which original scratch/source bytes were unavailable to later reviewers; hashes alone do not make
them portable. Current pinned controls are reproducible separately from that historical evidence and from product
acceptance.

The first [PR CI run 38064379151](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38064379151) failed
`LATE_ERROR_BOUNDARY`. R8 replaced click-relative fault timing with an owned post-screenshot signal, while retaining the
same public predicates and final observation window. Companion `20261010T154855-43a86624` later returned incomplete with
no code findings because authority/disposition/publication evidence was insufficiently accessible. After that closure,
`20261010T161533-be230450` requested the mandatory P3 F-001 helper-documentation correction. Seven files received
comments only; the retained structural comparison and independent accuracy review found no executable change. Those
reports are preserved as issued. Fresh CI and the final approval above apply prospectively to the corrected head.

## Actual CI results

[Final PR CI 38068031958, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38068031958/attempts/1)
passed on synthetic merge `fee08a85060e6baad0d536446743c238ebbc794b`, with the actual base/head parents and the reviewed
full tree.
[Protected-main CI 38068892955, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38068892955/attempts/1)
then passed on the actual squash. Main product, foundation, control-plane and publication jobs succeeded;
`deliver-foundation` was intentionally skipped. This job skip is separate from test execution, which had no skipped
cases.

| Main evidence                                     | Observed result                                      |
| ------------------------------------------------- | ---------------------------------------------------- |
| Candidate owned controls                          | 46/46; not product acceptance                        |
| Candidate exact discovery                         | 72 identities; no application execution              |
| Required transport discovery / external execution | 67 identities / 67 passed, zero failures or skips    |
| Product unit tests                                | 82/82, zero failures, cancellations, skips or todo   |
| Tooling tests                                     | 459/459, zero failures, cancellations, skips or todo |
| Gate tests                                        | 20/20, zero failures, cancellations, skips or todo   |
| Mermaid                                           | 19/19 rendered                                       |

Formatting, repository policy, portability and Terraform validation passed. The main runner used Ubuntu 24.04, Node
24.20.0, npm 11.19.0 and Playwright 1.64.0 with Chromium 156.0.8078.4. Candidate browser preparation preceded its check;
fixed install-deps/install/probe steps and cleanup passed. That does not prove a fresh browser download. The termination
probe failed intentionally and reported owned browser/page/server closure before child exit; late-meta and late-error
controls passed. Required application acceptance reported scoped cleanup. Neither establishes an independent OS process
inventory. Raw CI control JSON/events were not downloaded, so no per-control event timestamps are asserted.

Required application acceptance remained suite commit `6c28382d71a014351311e63154ef1c8916b8a229`, suite tree
`d905d3123623f74b029a94c61ca850e553af2c32`, contract `transport-v1`, fixture manifest SHA-256
`674bb8a49e895b283d828e965f3cd4c6e1567f9b38ec25fdf44dfe452085e3cc`. It was not the new 72-case candidate.

## Release, admission and image provenance

The actual [v0.2.21 release](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.2.21), ID `409075563`, was
published at `2026-10-10T16:50:08Z`, with tag/source equal to the candidate squash. `publication.json` records
`release-only-provenance`, `deployed: false` and deferred deployment for `linux/amd64`. The earlier preparation manifest
retains `prepared-local`, non-deployable and provisional-version fields; publication does not rewrite its history.

The captured release report's admission context names repository `brobro10000/mp3-frame-counter`, event `push`, ref
`refs/heads/main`, the source/full tree above, base/tooling revision `c39de309867d63fc04fe1d12647680b34ee178d5`, source
workflow revision and producing run `38068892955`, attempt `1`. The product preflight and publisher logs independently
carry the same admission SHA-256 as that metadata: `54f727d6abdc63e67bb0521e7bc17f46a2bfc1f945562b124dc4574815c50fb9`.

Root's bounded metadata verification matched that context/digest and source-local resolution: admission `candidate`,
required `transport-v1`, candidate `docs-v1`, and `pendingBinding: null`. Existing binding
`5645b0501ca403750a2d894d6a492afa4b42185b` and activation `f4fb747df8890511edde7878064bb9af79823138` still refer to
transport. Source-local consistency alone does not confer CI authority; the independently captured producing-job and
publisher handoff supply that context. The CI auditor did not download admission bytes; root's separate release capture
contains the admission envelope in `e2e-result.json`.

The release report, preparation identity and publication metadata agree on the same-source tested local image IDs:

| Image    | Local image ID                                                            |
| -------- | ------------------------------------------------------------------------- |
| API      | `sha256:9b7cd7da2895c10f2640a847c847e89b95a2640a5f4f49911a9e32c68032e072` |
| Frontend | `sha256:ce4a639a5fb203b874bb327bd71a1c3daa39414cc020037da29ccea4e72f5145` |

Source configuration SHA-256 is `04fe79151163af7c03dd2721d62371d56a484d6914bae21c16f1d0768933b287`; local acceptance
configuration SHA-256 is `a7a56f1aeee25bc7774ab9b4896f06f9eb1a25c30839c1d2ee9b23d4b7fd8a67`. Registry digests are null.
No image archive was downloaded or independently rehashed in this metadata audit. Archive hashes in `SHA256SUMS` remain
metadata claims, not new image-byte verification, registry transfer or deployment proof.

Root downloaded and rehashed exactly eight metadata assets against the captured GitHub asset digests, with zero
archives:

| Asset                  | SHA-256                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `SHA256SUMS`           | `add3e85337b6c246bc103021bb03f391d7cbcdfdd3f4217261b79d793c349bba` |
| `ci-origin.json`       | `ef0a464bd0f3faa06be2c8eac5cc90f48a81bd7ad01a815f8db57b69bfe29c7f` |
| `e2e-result.json`      | `b53183b5c75a02a3d58e958fb774f1b4a3792f4886d257dac5cc50fc48903b6d` |
| `manifest.json`        | `29519c5b4d43c1022746862af76dc8b04b3ba4f88bd5d9d9e4cdf59f16e6f0c8` |
| `publication-notes.md` | `7e6f85df7a14089190e3a27cf56a107727ac8ff84a95057a7eb0048f0c5993e4` |
| `publication.json`     | `784585a652e9eea6122aa386e4e4e83dde3f911b38f1ffcc3301fdaf2941ace0` |
| `release-notes.md`     | `92621a1fed99a28bacc9ff7c9bf8ef9461c6d2b6f2f3817cf43d0a10681a8331` |
| `reservation.json`     | `15e6803c031b7f6a6b67f058c9f93f0c520fd1c17ec78d92e2487d6f9b720016` |

## Evidence custody and pending binding checks

The ignored local evidence groups are `.artifacts/docs-contract-merge-identity/`,
`.artifacts/docs-contract-documented-pr-ci/`, `.artifacts/docs-contract-main-ci/` and
`.artifacts/docs-contract-main-publication/`; these names are not portable links to unavailable files. Root rehashed the
main audit's nine raw records and checked its 25 cited log records. Its `verification.json` SHA-256 is
`27c511c9c1c12c17f8960651b82b75b5b2da122335f710bd9ef89222a5634c84`. The separate release metadata verification SHA-256
is `a7c321090bb699dc9fab1a0a17488de54b76fa58e3b8abe4b5f0b9db44ab388a`. Durable PR, review, commit, run and release links
above identify the corresponding repository evidence without claiming every original scratch record is published.

This documentary pass performed no new test, product run, review, acquisition or publication. The proposed registry
binding must independently pass trusted-base admission using the actual squash and current decisive exact-head approval,
then receive its own review, merge, main CI and publication. Until those events are verified, this record must not be
read as DOCS-BIND completion or authorization to claim docs product acceptance.

## Local binding validation — 2026-10-10

After the documentary handoff, the coordinator collected five bounded authenticated GitHub GET responses at 17:00:26Z.
The existing collector verified the merged candidate, exact review/head/tree, distinct author and complete review
history; approval 5479914516 remained the current decisive approval. These are local observations for a resolver
diagnostic, not trusted CI admission or this binding's own approval.

Pinned Node 24.20.0 ran the existing transition, admission, preflight, review-HTTP and consumer tests: **196 passed**,
zero failures/skips/cancellations. `npm run validate` passed formatting, workflow lint, policy, portability, **19
diagrams, 20 gate tests and 459 tooling tests**, with no failures/skips/cancellations. The new evidence file was staged
before the tracked-file checks. Prettier's ignore rules preserve `AGENTS.md` and agent-role formatting; new prose there
was manually wrapped. A separate readback checked 130 relative file-link targets, exactly three active cards, the
unchanged previous transition and no changed product, suite, contract, workflow or executable paths.

The focused log SHA-256 is `3fd05653f08fcc12242466abb340d798c1e590f504c7394645087051a43fc2f2`; the complete validation
log is `e4db3a0c80ce5f596b77ef8dbed427fb00087c907239d06661607cb22feb1abf`. These local checks do not rerun image-bound
application acceptance or establish protected-main publication. Final PR/main CI, exact-head companion review and actual
binding publication remain required.
