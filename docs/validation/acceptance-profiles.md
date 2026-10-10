# Acceptance profile declaration validation

**In progress, 2026-10-10.** This records PROFILE-DECLARATIONS under the
[adopted protocol](../testing/hosted-profile-policy.md) and
[bounded card](../phases/next-iteration.md#pr-card-3--profile-declarations-validate-immutable-acceptance-profile-declarations).
The owner authorized stacked PRs and parallel domain work. This branch starts from protocol PR #25 head
`0e5e5ee1f4b7c5a06da3519c52e329cc1b6d541e`; its parent has not yet merged or published. Dependent publication requires
that actual result, reconciliation to its protected-main source and fresh CI/companion approval.

## Frozen expected-decision boundary

The pure validator interface and declaration semantics are specified in the protocol; the card fixes
`readAcceptanceProfileSource(root, { selection, sourceRevision, baseRevision })`. It validates all selected roles before
extraction, installation or standalone execution. The existing runtime selection and original CI/local source/base
authority remain unchanged. A consistency replay does not authenticate a caller-created CI record.

The reader's closed result has required/candidate/pending keys, using null for an absent role or the exact authenticated
historical genesis without inventories. Explicit null base is permitted only for the pre-policy local call whose
original optional base was omitted. It is never a post-policy or CI fallback. No role, profile, URL or path selector is
accepted. Current complete local acceptance and publication formats remain unchanged.

Clarified error attribution: absent stage/production blobs established from a valid Git tree become explicit null; the
pure validator then enforces atomic presence and raises `ERR_ACCEPTANCE_PROFILE_DECLARATION`. Missing local inventory
outside exact genesis, unreadable/nonregular blobs, invalid UTF-8/JSON and provenance/context/lineage errors raise
`ERR_ACCEPTANCE_PROFILE_SOURCE`. Valid decoded/parsed values with invalid declared schema retain the pure validator's
error. This distinguishes failures without relaxing a rejection.

## Ownership and status

- Independent author one owns `scripts/acceptance-profiles.test.mjs`, with no helper implementation access.
- Independent author two owns `scripts/acceptance-profile-source.test.mjs` and only the inert r4 local-inventory fixture
  addition in `scripts/acceptance-consumers.test.mjs`, preserving its existing expected outcomes.
- A separate reviewer checks those expectations before root commits their frozen test-first checkpoint.
- Separate implementation then owns the two new modules. Root integrates the controller, the two explicit `test:tooling`
  entries, scoped documentation, Git operations and final checks.

At this checkpoint tests are being authored; implementation has not started. No test pass, meaningful behavior red, CI
success, companion approval, merge or publication is claimed. Missing implementation is availability evidence, not a
successful negative control. Later entries will record actual revisions, commands, failures and results.

No frozen acceptance suite, contract, registry, product, dependency, workflow or infrastructure changes belong here. No
hosted execution is enabled, and every production application deployment remains a human gate.

## Independent expectations and stack reconciliation — 2026-10-10

Protocol PR #25 received automated companion approval from `brobro1000` for head
`0e5e5ee1f4b7c5a06da3519c52e329cc1b6d541e`, review
[5480520934](https://github.com/brobro10000/mp3-frame-counter/pull/25#pullrequestreview-5480520934), companion run
`20261010T192306-7d4d1f9b`. Owner `brobro10000` merged normally at `0a691a1856d8b742975cc2eb310032b800eb41ea`; its tree
equals the reviewed tree. Main run
[38080236553](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38080236553), attempt 1, is still pending at
this checkpoint. Dependent publication requires its verified result.

Independent authors supplied pure and immutable-source/controller expectations. Separate reviewers identified and
resolved four coverage gaps before implementation: coherently empty hosted declarations, legacy schema validation, real
CI controller wiring and the historically omitted local base. Root inspected the changes and both exact-hash review
memos. No implementation existed at freeze commit `2d81cebea2fdcb0feedd36d20763ce9972489461`.

| Frozen test input                            | SHA-256                                                            |
| -------------------------------------------- | ------------------------------------------------------------------ |
| `scripts/acceptance-profiles.test.mjs`       | `e374c23776d7e29a0db7a58279dc553cdaff803fac54eb85c725ed10e8c6fa2e` |
| `scripts/acceptance-profile-source.test.mjs` | `b83f7d2f36a39fb25983b74dfcb38dc6250c056b66f93f77916acb87ae0f8236` |
| Narrow existing consumer fixture             | `0062f1fe484a59f23496fca356e878bfd4009cb581a2bdb15bd7601f8bccec50` |

Root ran `node --test scripts/acceptance-profiles.test.mjs scripts/acceptance-profile-source.test.mjs` with pinned Node
24.20.0 against those bytes. The result was 48 groups: one existing-resolver fixture-validity pass, 47 missing-API
failures and zero skips/cancellations. The retained local raw log has SHA-256
`390304429830d1a6a3ef3bf26be493c4daf1f81e08902d34e0c5bb7f7fb0c330`. This is availability red, not successful semantic
negative-control evidence. The pure and source expectation-review memos have SHA-256
`0b83136c9de368bac347fb523b7ccb8abc8bd5609fe7e9e946eaa5a1c2233213` and
`f0e718b24a84ed1b55ccb44d1482c8d8ad644acf4a49613f98174bacd5fba679`, respectively; they record automated static review,
not test execution or authenticated CI. These ignored local records are not published release assets.

The stack was reconciled by merge `ce693020aab31978d6969cd052a42024e3f9729c`, with actual main as its first parent and
the independent-test checkpoint as its second parent. This preserves test-first history and the resolver's trusted-base
ancestry without rewriting published branch history. Implementation ownership is disjoint: one subagent owns the pure
module, another owns the immutable reader, and root owns controller/test-command integration and final verification.
Frozen tests remain read-only to implementers. Draft PR #26 must target actual main and obtain fresh mandatory CI and
exact-head companion approval before any owner merge.

## Historical baseline compatibility correction

During reader construction, the implementer identified that the original immutable baseline retains historical `review`
and `shippingPrerequisite` fields. The internal design memo had incorrectly summarized genesis as only six fields. The
adopted protocol requires the complete immutable identity and does not impose that new closed schema. Root inspected the
actual baseline and resolver and retained every original byte. The reader must compare the entire genesis with the
immutable source baseline, validate its core identity and preserve historical metadata without treating it as authority
for a new successor binding.

The independent author added three compatibility groups, and the independent reviewer checked the narrow delta and
reconstructed the preceding test hash to confirm preservation. Amended source-test SHA-256 is
`f7f67b83446a2793bf1fb8791120d808dd69bae0c3c46f2c476d5b82d2e37a95` (29 groups); review-memo SHA-256 is
`5dacf503e9e63718414fc908c805a0fa6602d1ff947246abbe43692e3908322a`. Test-only commit
`72fc23bb09163b74f761af168b30898d1d0d919e` precedes resuming the affected reader portion. These are post-discovery
regressions: an unexecuted reader draft briefly contained the proposed compatibility handling before the pause. This
amendment is not evidence that its cases preceded every draft byte. No new behavioral red is claimed for the amendment.
All earlier expectations remain; no frozen acceptance, baseline, contract or registry was edited.

## Protocol publication prerequisite completed

The [phase completion](../phases/next-iteration.md#hosted-profile-policy-protected-main-completion) supersedes the
pending protocol-publication checkpoint above. Main run 38080236553, attempt 1, passed and published v0.2.25, release
409162811, from `0a691a1856d8b742975cc2eb310032b800eb41ea`. Root separately verified CI/admission and eight downloaded
metadata assets; no image archive or deployment was involved. The current declaration implementation still needs its own
checks, review, merge and publication.

## Independent implementation review and retained regressions

The pure helper passed its 22 independent groups with Node 24.20.0. Root inspected the complete module and rehashed the
captured inputs and outputs. Its reviewed SHA-256 is `6513eb6aa7da090c6e8e83eb1d33490c54bc3b97136b5a1919660f23f718d556`.
A separate static review found no actionable issue in that helper, the controller integration or the two explicit test
registrations; its memo SHA-256 is `3cb49cc785fd4b9b2452d1ed6b30a67268be340ef16551ce15c5df0de91c5602`.

The initial reader passed all 29 then-existing source/controller groups. Its intended negative name filter did not
exclude the five controller groups; the recorded result is the complete 29-group run, not a direct-reader-only run. The
implementer disclosed that execution-boundary mistake and root inspected/rehashed the full log. Separately, root's 85
existing consumer/runtime/browser/lifecycle/phase regressions passed. A local read of the actual repository selected all
72 docs-v1 inventory entries, legacy-local mode and no candidate/pending role. Those checks preceded the following
reader corrections and are not substitutes for final corrected-source checks.

Independent static reader review identified one P2: a present hosted inventory containing JSON null could masquerade as
an absent file when metadata was absent. Root also resolved an explicit contract ambiguity: the predecessor inventory
must name its own authenticated predecessor revision, even when that predecessor is no longer a selected role. This
r17.4 clarification is not retroactively represented as a second defect in the earlier specification.

An independent author added seven focused groups, with separate independent review and unchanged prior assertions. The
null-presence run observed two passes and three meaningful `Missing expected exception` failures; the predecessor run
observed one pass and one such failure. All counters were unskipped and uncancelled. The red logs have SHA-256
`3a7e1bedbff87b813d84bfed133f9a492f20c9be102f87ea1daf185a37b4ace3` and
`9a24a62b916441ce6b0078a29f0506eee60b3d22a6fcdcbea2fc792c5105a14a`. These post-discovery regressions demonstrate the
previous reader accepted the malformed states; they are distinct from the original missing-API red.

The full source test now has 36 groups and SHA-256 `678ed1a584a9e684e2b0131fe0341ab0ced678a0c559a9f36c6d1c6740291f5c`.
Review memo SHA-256 is `43d9925b9edfae605881770b259108a74ef94e8afad278f900b3716a7df4a970`; test-only correction commit
`5cc11062bfa33751ee24219734bd7df664a8a632` precedes the implementation fix. Final corrected-reader validation and
companion review remain pending at this checkpoint.

## Corrected implementation checkpoint

The separate implementer corrected only the immutable reader. Present hosted files can no longer become absence by
containing JSON null; strict decoding still precedes declaration checks. The immediate predecessor inventory is checked
against its own authenticated revision. Reader SHA-256 is
`235c386fc03ecfde0c71c54b6c86e6db6d13f347c232e241a957e2759799c131`. All seven focused regressions passed on Node
24.20.0, without skips or cancellations. Root read the complete log and verified all nine handoff hashes; green-log
SHA-256 is `8c86ec6c6e28b96c9ae0f6cc8c0165dae5e4279b7dcde9191b6514b5c02636bd`.

Independent static review completed the full reader coverage, including the part paused at the revision ambiguity, and
found no remaining actionable issue within that boundary. Root read and rehashed its memo,
`5b6d2ba6196682fe87ed3c9642f29a4edb845d2e8e6d980cb7d202a81c74ea9a`. These are automated source/log reviews; they do not
replace the final source/consumer run or the Docker companion's exact-head review.

Root then ran `node --test scripts/acceptance-profile-source.test.mjs scripts/acceptance-consumers.test.mjs` with Node
24.20.0 against the corrected reader: all 50 groups passed (36 source/controller and 14 existing consumer groups), with
zero skips, cancellations or failures. Raw-log SHA-256 is
`e79740a0de92eb32db683a3420f5793334c11e1de16cac49c676329dd5916b59`. This includes the real local/CI controller
boundaries using isolated inert commands; it is not a Docker application or hosted acceptance run. Workflow lint and all
20 terminal gate tests also passed. Main-target CI and exact-head companion approval remain separate prerequisites.

The tracked-file portability check initially rejected two intentional synthetic Windows-path literals in the pure tests.
The independent author changed only their representation to a slash-join expression with identical resulting bytes. Root
reversed exactly those two substitutions and reconstructed the original frozen hash; no expectation, assertion or
checker changed. Final pure-test SHA-256 is `e1aeec7dfdeecad50c8114362c1a375f6e04f2bdda1b7b4697c58dd443ded1db`. Root
captured a fresh pinned 22-group run because the author's rerun had no retained raw log: all 22 passed, without skips or
cancellations. Its raw-log SHA-256 is `883a4d3c4610594cc4264efc4720f38d97fb4cd1c1b0e70a77470683bb192105`.
