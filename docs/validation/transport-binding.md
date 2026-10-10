# Transport candidate and proposed binding evidence

**Completion amendment — 2026-10-10:** PR #16 merged the actual binding and published v0.2.16. **r3 remains required**;
transport-v1 is the single pending successor for the next product change. The candidate's 67-case local diagnostic does
not replace current required acceptance. The earlier proposed-binding wording below is dated history, resolved by the
[protected-main binding record](#protected-main-binding-publication). No application deployment is established here.

Read the [transition policy](../testing/acceptance-transition.md),
[transport contract](../testing/contracts/transport-v1.md) and
[lifecycle disposition](lifecycle-controller.md#independent-disposition). Earlier failures and release history remain in
the [lifecycle record](lifecycle-controller.md) and [release-line record](release-lines.md).

## TR-LIFECYCLE publication prerequisite

[Main run 38044909552](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38044909552), attempt 1, tested
`c4487bcbc969475e33f76f41995716e5c26d738c` after PR #14. Foundation, product and control-plane jobs succeeded; publisher
job `114192825097` succeeded. [v0.2.14](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.2.14), release
`408872110`, was published at 10:29:52Z with ten assets and its tag at that exact source. The schema-2 metadata binds
line `0.2`, global ordinal 14 and policy SHA-256 `adc4302307bf061584deec3fc56ffe6661467c443d54742c46eb20d139c337ce`.

The published report records 60/60 required r3 cases, zero failures/skips and passed cleanup. Original admission digest
is `68ec90e0d15a3cb197f0bd5d95df1f7d222aa66ac06d0bb5909aec2232563cef`. Required suite commit is
`a0a56d94e5457101cd043b6055ab084782c3e16f`, tree `b789ffe426f4d0a303144338923748c9cdf424cf`, with manifest SHA-256
`2f56db4641f9e5c09b34c2bc0c630e85a46a010025c634375b110a35e2cb120a`. Candidate and pending binding were both absent.

Published AMD64 image IDs are API `sha256:333e644b4f0d8824149b635462c0f24eb697b27b85f0a9158f99a5908e5cb27c` and frontend
`sha256:f0a81cac492d8db004629388c5640b23f96929974cb9e116a1db5510160737b9`. These differ from the earlier local image
pair used in the candidate diagnostic below. Eight downloaded metadata assets matched captured GitHub digests; neither
Docker archive was downloaded or rehashed. This establishes software publication with `deployed: false`.

Source: ignored `.artifacts/lifecycle-main-publication/observations.json`, captured at 10:31:04Z, its `raw/`
run/job/tag/release observations and eight `metadata/` files. Documentation authoring made no new API request or retry.

## Independent candidate and preserved corrections

The author handoff records 18 candidate paths, preserving the original acceptance spec, all 46 fixture entries and
recipes, standalone lockfile and 60 original case identities. The manifest changes only its contract revision. Seven
additions cover precedence, exact paths/encoding, early Expect validation, admission/capacity recovery, idle and total
deadlines, and unfinished-upload closure with normal SIGTERM exit. The OpenAPI fixture is local contract data; no
documentation endpoint or Fastify implementation is introduced.

Independent engineering review corrected failed-run attribution and an inconsistent HEAD response schema before the
initial candidate commit `54a692bc807220cf0c519444d27de1bbb1583f8c`. The author also retained an initial mistaken
root-working-directory discovery invocation that imported root tooling tests and was terminated. Its partial output is
not acceptance evidence. Correct standalone discovery and subsequent checks are separate; the accidental output was not
used as a product oracle. These limits remain recorded in the author handoff and coordinator ledger.

Companion run `20261010T105142-5bc30886` reviewed all 18 paths at that initial commit and completed at 10:57:19Z with
**request_changes**. F-001 was a mandatory P3 documentation finding: `within`, `openUpload` and `observeShutdown` lacked
consequential caller obligations, timeout/cancellation distinctions and cleanup/observation requirements. No
demonstrated runtime blocker was identified. This local review was not published to GitHub. Its review SHA-256 is
`9b928d24435e0ff72aeac6eed92b3678b58e729afcb7ae3ca652dcce3e96dada`; snapshot SHA-256 is
`47b5585f51445e2a905339e60637dc311e5a924c95c2f98b0f882e933dd7dd2b`.

Correction `fa77fbc081b5cc2939b12802bccb2cb15f2dc5a8` adds three JSDoc blocks across two helper files. The coordinator
verified that removing exactly those comments restores the preceding file bytes. The attempted TypeScript printer
comparison stopped because that API was unavailable; it is not a successful verification claim. Fresh diagnostic, CI and
companion review followed the comment correction. The original requested-change review remains preserved.

Sources: ignored `.artifacts/transport-author-handoff.md`, `.artifacts/transport-ledger.md`, and companion run
`20261010T105142-5bc30886` files `review.json` and `runner-receipt.json`. Neither companion review executed target code
or independently verified the local diagnostic bytes absent from its captured bundle.

## Corrected candidate diagnostic

The separate local diagnostic extracted the committed corrected suite and ran all 67 cases against a previously tested
AMD64 image pair without a build or pull. The [diagnostic report](artifacts/transport-candidate-diagnostic.json) retains
`kind: candidate-only-diagnostic`, `productAcceptance: false`, passed cleanup and these original identities:

| Identity                          | Value                                                                     |
| --------------------------------- | ------------------------------------------------------------------------- |
| Trusted base                      | `c4487bcbc969475e33f76f41995716e5c26d738c`                                |
| Candidate revision tested locally | `fa77fbc081b5cc2939b12802bccb2cb15f2dc5a8`                                |
| Candidate full tree               | `4758bc423b1d4b7209e7e986ef2a2801a5dd53a8`                                |
| Candidate suite tree              | `d905d3123623f74b029a94c61ca850e553af2c32`                                |
| Manifest SHA-256                  | `674bb8a49e895b283d828e965f3cd4c6e1567f9b38ec25fdf44dfe452085e3cc`        |
| Contract SHA-256                  | `485e76e0aa2f4edd512a60bfcbe462cff460e9ecdc3a5b1284547fa4e58148c0`        |
| Inventory SHA-256                 | `d88d2875a26c614d801e3a396a6096f284096139543a1a901091fd27c2b93555`        |
| Product source                    | `495d95710a36ed9b63d76b43381e2f0ac811deb2`                                |
| Product report SHA-256            | `e46836744acda2d319d6f907bc972ccfcb7c28097c7229f07f240db42b03521d`        |
| Local API image ID                | `sha256:c165bb6b8e14194c0eb9bc807ac78e62ccd9c8722ca1b82dcd2670e73b314013` |
| Local frontend image ID           | `sha256:86366189ac874d86402f8a45b6760a42c125420bd6ee8cd66393637c208f0598` |

The [suite result](artifacts/transport-candidate-suite-result.json) records `evidenceKind: application-execution`,
exactly 67 unique file/title identities and 67 matching outcomes with actual/expected status passed and retry/retries
zero. Nothing failed or skipped. Whole-suite duration was 61,177 ms; total diagnostic duration was 76,135 ms. Bounds
were 120 seconds for the suite, 300 seconds for work and 30 seconds for cleanup. Product/configuration Git-object
identities and lifecycle target/generations remain in the report. The coordinator's ledger separately records empty
owned-container/network queries after cleanup.

The promoted files are byte-identical copies of ignored `.artifacts/transport-probe-2a801205e698/result.json` and
`suite-result.json`, respectively; the installed formatter made no changes. Their SHA-256 hashes remain
`25757c8b79d4431a26a4c82fd937c6b0ec29e58602b9d1e794959c8ac8ce9fa3` and
`26cb11ca4c93d50be896561e171495ce3da123c1e00804291efbe94f742c5111`. Before persistence, every JSON string/key was
scanned for personal paths, credential material and email addresses; no match required redaction. These are portable
copies of local operator evidence, not previously uploaded CI artifacts, signed attestations or release authorization.

## Corrected PR checks, approval and actual merge

[PR run 38046851058](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38046851058), attempt 1, tested
synthetic merge `dfe5cc500a1e29d21f2c431ef4d00b94249b2f64`, combining corrected head
`fa77fbc081b5cc2939b12802bccb2cb15f2dc5a8` with base `c4487bcbc969475e33f76f41995716e5c26d738c`. It passed 398 tooling,
20 terminal-gate and 75 unit cases, 19/19 Mermaid renders, 52 deliberate candidate rejections plus positive predicates,
and exact discovery of 67 candidate cases. Required product acceptance separately passed all 60 r3 cases with cleanup.
The control-plane step reported all mandatory validation successful at 11:02:41Z. Product admission digest was
`d3da7b23ae7e00092fc7b02d25bf72218094cee35cab0f6dacf905b48c452dfc`.

Fresh companion run `20261010T110342-411ae4c9` completed at 11:09:48Z, reviewed all 18 paths at the corrected head,
returned `approve` without findings and passed its documentation gate. Review SHA-256 is
`58a3ece2fd1b90332d034789e05d5bf9e13e4dc6f0f30d79347be1e9aec6569e`; snapshot SHA-256 is
`d841fdf5c201d6f537c445c8000f7236ffda061186ffc59014c68d9f0463d5fd`. Its
[automated approval](https://github.com/brobro10000/mp3-frame-counter/pull/15#pullrequestreview-5478731574) was
published as `brobro1000` and verified at 11:10:21Z against that head and base. This is automated companion review, not
human review.

The owner `brobro10000` merged [PR #15](https://github.com/brobro10000/mp3-frame-counter/pull/15) at 11:10:53Z as
`6c28382d71a014351311e63154ef1c8916b8a229`. Its full tree `4758bc423b1d4b7209e7e986ef2a2801a5dd53a8` equals the reviewed
head's tree. The local diagnostic retains its actual pre-merge candidate SHA; it is not relabeled as a test of the
squash commit or the later CI image pair.

Sources: ignored `.artifacts/transport-final-pr-ci.log`, SHA-256
`68eecd0cb979dc2a38770f09849ffa74c3436bd27f2b4225714f3390af18883c`; companion run `20261010T110342-411ae4c9`
`review.json`/`runner-receipt.json` and its publish receipt `transport-final-publish.log`; coordinator merge readback.

## Protected-main candidate publication

[Main run 38047498564](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38047498564), attempt 1, succeeded
at the actual squash source. It again passed 398 tooling, 20 terminal-gate, 75 unit and 60 required r3 external cases,
all 19 Mermaid renders, candidate controls and exact 67-case discovery. Candidate discovery/controls do not execute the
candidate's 67 cases against the application. Publisher job `114200346368` succeeded and published
[v0.2.15](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.2.15), release `408893845`, at 11:14:12Z. All
ten assets and the tag identify `6c28382d71a014351311e63154ef1c8916b8a229`. Schema-2 metadata retains line `0.2`, global
ordinal 15 and the policy hash recorded above.

Original admission digest is `0eec78487136c1009145a09f437a68c9cc7930a500f81d5063c85949eb927334`. Its resolution
identifies `transport-v1` as the candidate at that actual squash, with the suite/manifest/contract hashes above and
predecessor `r3`; pending binding, binding commit and activation commit are null. Required acceptance remains the
unchanged genesis identity. The release report records passed cleanup and `sourceDirty: false`.

The published AMD64 API image ID is `sha256:7ef8f1e5471d465cf7853f351c5ab1feccd031c195dde459b324426a925b4085`; frontend
is `sha256:78f29c513ecd75233d33cc74bd342fa33a72976dfa4097f8a73a25ae30f7ebae`. These images passed required r3 in CI; the
local 67-case diagnostic used the different image pair above. Eight metadata assets were downloaded by the coordinator
and independently hashed against GitHub digests; this documentation pass rechecked those saved bytes and all matched.
Docker archives were observed only through metadata, not downloaded or rehashed. No additional publisher-only retry was
performed for this candidate; prior release retry evidence remains separately recorded.

Sources: ignored `.artifacts/transport-main-publication/observations.json`, captured at 11:15:02Z, its `raw/` and
`metadata/` files, and `.artifacts/transport-main-ci.log`, SHA-256
`f76134f190c5992fb4b1349ae8ba64b09fe2c14336d70d1f15c0553eec678527`. Metadata publication states `deployed: false`.

## Proposed binding and retained limits

This record supports a separate proposed binding of the actual merged candidate and exact approved tree. It does not
claim that binding admission, companion approval of the binding, its merge/publication or successor activation has
occurred. Authenticated review observations and trusted-base admission must validate the registry change. Binding alone
does not replace r3; the next admitted product change requires the successor under the existing transition policy.

Graceful admitted-response completion remains operationally unresolved. TC-07's bounded unfinished-upload closure and
normal exit do not prove successful graceful drain. Preserve the
[earlier failed diagnostics and bounded disposition](lifecycle-controller.md); require fresh independent shutdown
source/configuration review during migration. Stronger drain claims require separate independently reviewed observable
predicates and controls. No deployed stage, production or v1.0.0 completion claim follows from candidate publication or
this proposed binding.

## Protected-main binding publication

[PR #16](https://github.com/brobro10000/mp3-frame-counter/pull/16) head `a8f765aebe493412e154cd09f430706c902a7789`
received independent identity and documentation audits without findings. The local committed resolver selected binding
admission, required r3 and pending transport-v1 using authenticated read-only GitHub observations; missing observations
were rejected. That diagnostic did not confer CI authority. Existing focused resolver/admission/review/consumer tests
passed 116/116, with no failures or skips. Formatting, policy, portability, links, scope and 19 Mermaid renders passed.

[PR run 38048053691](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38048053691), attempt 1, passed
against synthetic merge `67b05f25e7acfb7723274f5bedbf9053753877af`. Its actual trusted preflight authenticated the
candidate review; CI passed 398 tooling, 20 terminal-gate, 75 unit and 60 required r3 external cases with cleanup, 19
Mermaid renders and separate candidate controls/discovery. Original product admission digest was
`38ad2523eed83f58476f5eb406fef18ca78ee25184cf035a3ad654188bb935ee`.

Companion run `20261010T112421-95ad4c0e` completed at 11:29:51Z, reviewing all ten changed paths with `approve`, no
findings and a passing documentation gate. Review SHA-256 is
`4ff9c5078f17ca221cc9dbaf116e74c8765f070344521a74acbe184586593178`; snapshot SHA-256 is
`7a5f44fbea7a0e64e51cdb15790398233b33b344282928ab66b382daa8f1b4a1`. Its
[automated approval](https://github.com/brobro10000/mp3-frame-counter/pull/16#pullrequestreview-5478785832) by
`brobro1000` was verified at 11:30:41Z. Fresh owner, exact-head, protection and required-check readback preceded the
ordinary squash merge by `brobro10000` at 11:30:54Z: `5645b0501ca403750a2d894d6a492afa4b42185b`. No bypass was used.

[Main run 38048679076](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38048679076), attempt 1, passed
required validation and publisher job `114203754786`. It published
[v0.2.16](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.2.16), release `408905986`, at 11:34:37Z,
with ten assets and the tag at that exact squash. Original admission digest is
`7ef1973d59e1ca64a7be7f90050ca355589c855f0fad4a74efe5b825c059a6da`. The published report contains the actual PR #15
approval observation and resolves required r3, no candidate, pending transport-v1, binding commit `5645b050…` and no
activation. All 60 required cases and cleanup passed. The unchanged policy makes the next product-affecting change
activate that successor; existing persistent-applicability tests cover implementation and descendants.

Published image IDs are API `sha256:9395bab7815eb755f4271e55c536ed9c45f01b7d705965740c738669d1874e66` and frontend
`sha256:ef0cd505f69456ba1fb3c4c380b7baf696fa4a993fa77c60de500e23826aba7a`. Eight metadata assets were downloaded and
rehashed against GitHub digests, all matching. Neither archive was downloaded or rehashed; no extra publisher retry was
needed for unchanged publisher code. These are software release observations with `deployed: false`.

Sources: ignored `.artifacts/transport-binding-main-publication/observations.json`, its `metadata/` and captured
publisher logs; `.artifacts/transport-binding-pr-ci.log`, `.artifacts/transport-binding-main-ci.log`, the local binding
diagnostic/observations and companion report/receipt. Preserve the candidate JSON reports unchanged. The next bounded
work is governance-only RUNTIME-POLICY, then Fastify under the bound successor; no new contract or framework is
activated by this completion record.
