# Next iteration: phase instructions and three PR cards

## Current local-MVP execution window — 2026-10-11

The owner superseded the cloud-first priority with the minimal React/TypeScript browser migration and a reproducible
local release handoff. The bounded work is:

1. Adopt the separately reviewed browser-tool policy; preserve the Fastify-only API runtime and required acceptance.
2. Compile typed React components into the existing NGINX image, preserving the raw API, UI behavior and strict CSP.
3. Verify local browser/API/docs and exact-image startup, document the handoff and verify normal software publication.

Review and normally merge safe open PRs in parallel, reconciling dependents onto actual main. Cloud delivery is paused;
no apply, stage rollout or production deployment belongs to this window. The production v1.0.0 gate remains unchanged.
Read the [local handoff](../deployment/local-handoff.md) and
[dated deferral](../deployment/v1-delivery.md#local-mvp-handoff-and-cloud-pause--2026-10-11). Older windows below are
historical; they do not restart deferred cloud work.

**Current priority, 2026-10-11:** the owner narrowed delivery to an acceptable production V1. Follow the
[bounded scope](../deployment/v1-delivery.md) and the three completion cards at the end. Earlier ordering below records
progression and is superseded where it would add nonessential framework work before V1.

**Earlier state, 2026-10-11:** SAME-RUN-HANDOFF published
[v0.3.35](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.3.35) from main
`bcdda0505e42120201e7377888dda44a05fb39a3` after passing main CI. Docs-v1 remains required and hosted-v1 remains bound
and pending. No application service is deployed. The initial access resources exist, but failed IAM/default readbacks
still require the reviewed corrections and remote-state verification. The current three-card window below supersedes
older next-step wording while retaining the dated progression evidence.

<a id="pr-card-3--profile-declarations-validate-immutable-acceptance-profile-declarations"></a>

PR #26's PROFILE-DECLARATIONS implementation merged at `fd0f35bca1289319ce909a4aff785251c0cd1583` after corrected-head
CI and exact-head companion approval. Its
[bounded card](https://github.com/brobro10000/mp3-frame-counter/blob/32ae32080a40c7ab1fddccc9d585af8f73aee802/docs/phases/next-iteration.md#pr-card-3--profile-declarations-validate-immutable-acceptance-profile-declarations)
remains in its immutable source. Main run 38084476141 passed and published v0.2.26; the
[completion evidence](#profile-declarations-protected-main-completion) verifies that prerequisite. The direct dependent
was immediately reconciled onto actual merged main while publication was verified in parallel.

The next three-card window is **BOOTSTRAP-IAM-ADMISSION**, **ACCESS-IAM-DEFAULTS** and operational **ACCESS-BACKEND**,
in that prerequisite order. The pure SAME-RUN-HANDOFF unit merged as PR #35; the corrective IAM PR was immediately
reconciled onto actual main and encountered the closed path-classification gate described below. PUBLISHER-HANDOFF
merged as PR #33 at `781b334230d956485abbc508fcfe5de2b2684305`; its actual main publication and new producer artifact
are verified below. PR #34 was immediately reconciled onto that main, passed fresh checks and companion review, then
merged at `40d9ae09e2ddf17c52b160094622537e0a28c683` on 2026-10-11 at 00:30:07Z. Its
[main run 38098635997](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38098635997) passed and published
[v0.3.34](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.3.34). Its operational migration remains
pending. The IAM correction belongs to local bootstrap so remote-state trust does not create a backend dependency cycle.
Authenticated acquisition/replay, launcher, registry, federation and runtime delivery remain separate future scope.

Merge an approved PR as soon as its required checks and prerequisites pass. Immediately reconcile and retarget its
direct dependents onto the actual merged main, then refresh their checks and companion review. Avoid accumulating
completed layers; keep parallel work limited to independent domains and necessary prerequisites. Refresh the PR base
metadata to `main` before pushing the reconciled head, even when its base branch already has that name. Verify its base
SHA matches actual main so a fresh CI event cannot retain an older base with a newer merge parent.

Software releases remain independent of deployment. The [cost evidence](../validation/cloud-cost-bootstrap.md) preserves
the USD 75 shared Run cap and USD 100 project alert budget. Every production application deployment, including
authenticated candidates, requires human intervention under the
[execution amendment](roadmap-execution-authorization.md).

### PROFILE-DECLARATIONS protected-main completion

[PR #26](https://github.com/brobro10000/mp3-frame-counter/pull/26) merged normally at **20:37:33Z** as
`fd0f35bca1289319ce909a4aff785251c0cd1583`. Its sole parent is `0a691a1856d8b742975cc2eb310032b800eb41ea`; tree
`d260f17572a4a520610cb33b5b31a12f31efc1ea` equals the reviewed head tree. Companion `brobro1000` posted
[automated approval 5480724617](https://github.com/brobro10000/mp3-frame-counter/pull/26#pullrequestreview-5480724617)
for exact head `80e1850224bf3638a0fd4d96fcbedf64a582e9dc`. Owner `brobro10000` merged after all required checks and
resolved conversations, without bypass.

[Main run 38084476141, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38084476141) passed 538
tooling tests, 20 gate tests, 19 Mermaid renders, 120 units and all 72 required external cases with scoped cleanup.
Release **409195020**, **v0.2.26**, was published at **20:43:27Z** with ten assets and `deployed: false`. Root verified
the original admission/source/base/run, suite, image and configuration identities and rehashed all eight metadata
assets. The two image archives were compared as metadata only; neither was downloaded or rehashed.

Root read and rehashed the independent main-CI audit and its records. Audit SHA256 is
`c24dd2f5b2fc8bd5288e3990721283e6ddbb9b5e93daf8bad81d2c39060ad8f1`; metadata-verification SHA256 is
`e4dd9cf473e98cded8b2e1ad3488566b6a283619ae66c458f0c5b33d095bf46a`. These retained local records support the linked
publication; they are not signed attestations or deployment evidence. The declarations prerequisite is complete.

<a id="pr-card-2--hosted-profile-policy-settle-the-reviewed-profile-protocol"></a>

### HOSTED-PROFILE-POLICY protected-main completion

[PR #25](https://github.com/brobro10000/mp3-frame-counter/pull/25) merged normally at **19:32:51Z** as
`0a691a1856d8b742975cc2eb310032b800eb41ea`, with sole parent `71e2cab6cdcac67675929563ed12db9d07ce227f` and tree
`bc4e59b04520a28e63a4fc4b6e29ad103bcbfd49`, identical to reviewed head `0e5e5ee1f4b7c5a06da3519c52e329cc1b6d541e`.
Required PR run 38079272847 passed. Companion run `20261010T192306-7d4d1f9b` produced
[automated approval 5480520934](https://github.com/brobro10000/mp3-frame-counter/pull/25#pullrequestreview-5480520934)
as `brobro1000`; owner `brobro10000` merged without a bypass.

[Main run 38080236553, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38080236553) passed all
three mandatory jobs and publication. It passed 120 units, all 72 required external cases and scoped cleanup; the 46
docs controls and complete 72-case discovery remained separate evidence. Foundation passed 480 tooling tests, 20 gate
tests and 19 Mermaid renders. The original admission digest agreed across product, control and publisher:
`f836b3e2aeb85346c19e9b0b8eb55fc5d6bed26e684dc29cf8858f89b9144d74`. Root replayed the captured record against its
original source/base/run context: documentation admission, docs-v1 required, no candidate or pending binding.

Release **409162811**, **v0.2.25**, was published at **19:38:32Z**, with ten assets and `deployed: false`. Exact tested
Docker IDs are API `sha256:35efd68c1931606fc1c671aa3595799fbd4e10bbc26773ed07564080bcda2cf6` and frontend
`sha256:43c880a222b3fc3e9d78ad28233ae1c334222441164539aaab1908c10f934788`; these are not registry digests. Root rehashed
all eight downloaded metadata assets and verified source/run, reservation, configuration, image and acceptance
consistency. Image archive checksums/sizes were compared as metadata only; no archive was downloaded or rehashed.

Root read the independent CI audit, rehashed its six private records and matched all 92 exact log citations. Audit
SHA-256 is `9ac477380eaafa5aa4f7c39e41bd6db1b4e0789749ae1d28ea7886ecd7a3d8ee`; root metadata verification is
`46b28bc41e036ca0d048dcd08f7d10c77af0a70010b7d02472034312f5c88d1b`. Those local diagnostic records are not release
assets or signed attestations. This completes the protocol prerequisite, not hosted execution or deployment.

### DOCS-IMPLEMENTATION protected-main completion

[PR #24](https://github.com/brobro10000/mp3-frame-counter/pull/24) merged normally at **19:00:58Z**. Its sole parent is
`2ca5a0b2e2eb2c9aa9160e950ec905bae24a1892`, and tree `b76aed90de1b6d004a76c836d88f969f36d4485b` equals reviewed head
`155caf019c4745732a39c19846886d6ae39e6e9b`.
[Automated companion approval 5480402558](https://github.com/brobro10000/mp3-frame-counter/pull/24#pullrequestreview-5480402558)
was posted by `brobro1000` after the original offline-evidence gap was corrected and freshly reviewed. PR run
38077108281, attempt 1, passed; it is separate from the actual protected-main run below.

[Main run 38078105743, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38078105743) passed
foundation, product, control-plane and publication. It ran 120 units and all 72 required docs-v1 external cases,
including five docs cases, with successful scoped cleanup. The 46 standalone controls and 72 discovered identities are
separate non-acceptance evidence. Foundation passed 480 tooling tests, 20 gate tests and 19 Mermaid renders. Trusted
preflight preceded installation; original admission SHA-256
`7eb4137671fe24a32f7820b53da37bba5ec52c7bfc41d0c167a1b520f4a496aa` agrees across product, control and publisher.
Downloaded admission/resolver parity establishes implementation admission, docs-v1 required and no candidate/pending
binding. Publication produced release **409146805** at **19:06:16Z**, with `deployed: false`.

The exact tested Docker image IDs are API `sha256:62103c086e2b610eddb21c5aaa0d82469a7801efe687e09f9ed5480d5e73f99d` and
frontend `sha256:59b45f70469fb1475bdba65d9a53618cd0cdec960966ff9ceb0afabfafd7c827`. These are not registry digests. Root
verified all eight downloaded metadata assets against their published SHA-256 and size, source/run/base context,
complete local acceptance, reservation, configuration and image identities. The two image archives were not downloaded
or rehashed; their checksums and sizes were compared as metadata only. This verification made no retry, deployment or
new product execution claim.

An independent audit retained 17 hashed private records and 61 exact log citations. Root read the audit, rehashed all
records and matched the citations plus four checkout lines. Audit SHA-256 is
`b7e6a9b407d3674371db3bd405fc41c7bfadc9b9bcc626e6ba6f4335ede33395`; root metadata-verification SHA-256 is
`a6c7c2661eff0873511da537f8a1e312e731123744605d8633d996dda0b74924`. These local record hashes are references, not a
substitute for the linked source/run and published artifacts. Historical
[implementation evidence](../validation/docs-implementation.md) and
[offline records](../validation/docs-offline-build-records.md) remain unchanged.

The [docs-v1 contract](../testing/contracts/docs-v1.md) and
[independent DOCS-01 disposition](../../tests/acceptance/fixtures/docs/docs-01-disposition.md) record the selected Redoc
CE 2.5.4 arrangement and the coordinator's bounded engineering adoption. The current observation is load, actual
interaction and a retained 200 ms live-document interval, closed before classification. Destructive page hiding/teardown
remains unverified; this scope supersedes that historical planning clause without claiming it passed. The disposition is
automated review evidence under owner delegation, not a separate human selection of CSP exceptions or interval.

Use the [roadmap](../roadmap/README.md) and the [acceptance](../agents/acceptance-author.md),
[implementation](../agents/implementer.md), [review](../agents/reviewer.md) and [release](../agents/release-operator.md)
roles. Completed cards remain in immutable source:

- [DOCS-TOOL-POLICY card](https://github.com/brobro10000/mp3-frame-counter/blob/71e2cab6cdcac67675929563ed12db9d07ce227f/docs/phases/next-iteration.md#pr-card-1--docs-tool-policy-admit-the-selected-redoc-build-dependency).

- [DOCS-BIND card](https://github.com/brobro10000/mp3-frame-counter/blob/cfafcbe3e0bd33af2c95ccd9b4aee4f0c07960e6/docs/phases/next-iteration.md#pr-card-1--docs-bind-bind-the-actual-independently-reviewed-docs-successor).
- [DOCS-HARNESS card](https://github.com/brobro10000/mp3-frame-counter/blob/351d2e5b998f882287c4c5e4bb41427d4ad5c41e/docs/phases/next-iteration.md#pr-card-1--docs-harness-prepare-the-pinned-browser-before-standalone-acceptance-checks).
- [DOCS-CONTRACT card](https://github.com/brobro10000/mp3-frame-counter/blob/351d2e5b998f882287c4c5e4bb41427d4ad5c41e/docs/phases/next-iteration.md#pr-card-2--docs-contract-independently-define-the-documentation-successor).
- [Lifecycle and transport candidate cards](https://github.com/brobro10000/mp3-frame-counter/blob/6c28382d71a014351311e63154ef1c8916b8a229/docs/phases/next-iteration.md),
  [transport binding](https://github.com/brobro10000/mp3-frame-counter/blob/5645b0501ca403750a2d894d6a492afa4b42185b/docs/phases/next-iteration.md),
  [runtime policy](https://github.com/brobro10000/mp3-frame-counter/blob/3e1851eaddb558f6c38eedc88334605212a7a153/docs/phases/next-iteration.md)
  and
  [Fastify implementation](https://github.com/brobro10000/mp3-frame-counter/blob/f4fb747df8890511edde7878064bb9af79823138/docs/phases/next-iteration.md).

Trace APP-V1-009,010,011,013 for independent acceptance/delivery and APP-V1-012,015/APP-REL-001–006 for exact image
releases. Hosted APP-V1-014,015 remain future work. Roadmap gate IDs do not replace assessment requirements. Preserve
historical closure, source captures and dated evidence; semantic v1.0.0 requires verified production.

## Phase operating instructions

**Parallel delivery amendment — 2026-10-10:** the owner requested beginning the next phase while the preceding PR is
being verified and reviewed. Prepare independent, bounded next-card work in an isolated worktree from an exact recorded
revision when its working contract is stable. Keep writable paths disjoint and preserve acceptance-author independence.
Record predecessor checks/publication as pending until actually observed; reconcile the draft to the actual
protected-main source before dependent publication. This supersedes the earlier wait-before-authoring sequence,
including historical card entry wording. It grants no permission to invent prerequisite evidence or satisfy the
production human gate.

The owner additionally requested stacked PRs and parallel domain work. Use a dependency stack of isolated branches: a
dependent draft PR targets its predecessor branch while separate agents own disjoint domains. Current CI and companion
collection support `main` targets only; do not claim those gates ran on a stacked draft. After the parent merges,
reconcile against its actual squash, retarget the dependent PR to `main`, and require fresh exact-head CI and companion
review before merging. Never merge a dependent PR into an unprotected feature branch as a substitute for protected-main
review. Changes to the parent's shared contract pause dependent work until reviewed and reconciled.

The owner's subsequent instruction applies this stacked, parallel workflow throughout the remaining version progression
to verified v1.0.0. Use as many independent agent lanes as have useful, bounded work within available capacity. Separate
acceptance authoring, product implementation, delivery/infrastructure and independent review by file ownership and
stable contracts. Prepare later domains while earlier PRs validate; serialize Git operations, actual suite binding,
dependency-sensitive merges and environment mutations. Concurrency never substitutes for prerequisite evidence or the
human gate on every production application deployment.

1. Refresh exact main, open work, applicable requirements and evidence before each card. Record the inspected source; an
   old clean tree or successful run does not establish the state of a new revision.
2. Keep only the next three cards fully detailed. Later packages remain provisional outcomes, dependencies and named
   decision gates until they enter this window.
3. Give each card one owner and explicit writable paths. Serialize shared scripts, acceptance transitions, version
   policy and external environment operations; coordinate disjoint work through documented handoffs.
4. Establish independent expected behavior before implementation. Preserve failed evidence and distinguish candidate
   harness controls from actual application acceptance.
5. Run focused checks first, followed by required integration checks against the final source. Report commands actually
   run and their coverage; a checker that skipped untracked files is not evidence for those files.
6. Record source, suite, configuration, image identities and CI attempt where relevant. Implemented, tested, reviewed,
   merged, published and deployed are separate states. Automated review is not human review.
7. Hand off at the card's stop point. Expand subsequent work only after its prerequisite evidence exists. Apply the
   execution amendment within each bounded card; review/merge authority never substitutes for production approval.

Keep raw `POST /file-upload`, its exact JSON success shape, inclusive **20,971,520-byte** limit, r3 format/error
semantics and pure TypeScript physical-frame parser unchanged throughout these three cards. Preserve original captures,
private sample handling, frozen suite bytes, dated reports and historical generated orchestrator artifacts.

<a id="pr-card-1--hosted-delivery-policy--line-03-open-the-hosted-delivery-release-envelope"></a>

### HOSTED-DELIVERY-POLICY / LINE-03 protected-main completion

[PR #27](https://github.com/brobro10000/mp3-frame-counter/pull/27) merged normally at **21:21:51Z**, as
`a98a434570a934831c64a64d3231950f27574b43`, with sole parent `fd0f35bca1289319ce909a4aff785251c0cd1583`. Its full tree
`8d4cd91b79dbfcbe15bc167b30f117190e1196dd` equals reviewed head `ca59a5b78f359c26c5e5d2dfabc8f2d55c1b076d`. Companion
`brobro1000` posted
[automated approval 5480848659](https://github.com/brobro10000/mp3-frame-counter/pull/27#pullrequestreview-5480848659);
owner `brobro10000` merged after all required checks, without bypass. The
[completed card](https://github.com/brobro10000/mp3-frame-counter/blob/a98a434570a934831c64a64d3231950f27574b43/docs/phases/next-iteration.md#pr-card-1--hosted-delivery-policy--line-03-open-the-hosted-delivery-release-envelope)
remains in its immutable source. The direct candidate was immediately reconciled onto this actual main as first parent
and retargeted to main; its fresh required checks passed separately in run 38087369669.

[Main run 38087336311, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38087336311) passed the
three mandatory jobs and publication. Release **409216997**, **v0.3.27**, published at **21:29:15Z** with ten assets and
`deployed: false`. Root verified original source/base/run/admission, required docs-v1, complete 72-case local
acceptance, source/configuration/image identities and all eight metadata asset hashes. Archive hashes/sizes were
compared only as metadata; no image archive was downloaded or rehashed. Root verification SHA256 is
`a9cbf23376f839b2ceeb4a94d1c0d611a662fec07c9ffcd2e5da88e87ccaebca`. No hosted execution or application resource exists
from this publication. The admitted 0.3 line must be retained even if a later release needs recovery.

The independent main-CI audit verified 545 tooling tests, 20 gate tests, 19 Mermaid renders, 120 units and all 72
external cases with cleanup. Root read the complete memo and verified its 18 record hashes and 225 exact citations.
Audit SHA256: `b491c482cdf707b9ee430ce49d704007153736037a1ba16ed1f4f200667e3047`. This audit did not download release
assets; the separate root verification above covers metadata bytes and original admission replay.

<a id="pr-card-2--hosted-contract-independently-define-the-complete-hosted-successor"></a>

### HOSTED-CONTRACT protected-main completion

[PR #28](https://github.com/brobro10000/mp3-frame-counter/pull/28) merged normally at 21:58:06Z on 2026-10-10 as
`4c2733ea2efa469b8e4718d8763b234ab92876e4`, with sole parent `a98a434570a934831c64a64d3231950f27574b43`. Its full
repository tree `1a86e1f81226228d3661f33bc70bb38a33653b52` equals reviewed head
`711e96c0900e8d88d1c0bb20a6164d37668b3e0e`. Companion `brobro1000` posted
[automated approval 5480947557](https://github.com/brobro10000/mp3-frame-counter/pull/28#pullrequestreview-5480947557)
after final [PR CI 38088858589](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38088858589) passed. Owner
`brobro10000` merged without bypass. The dependent binding and helper branches were immediately reconciled onto that
actual squash as first parent. The
[completed candidate card](https://github.com/brobro10000/mp3-frame-counter/blob/4c2733ea2efa469b8e4718d8763b234ab92876e4/docs/phases/next-iteration.md#pr-card-2--hosted-contract-independently-define-the-complete-hosted-successor)
remains in its immutable source.

[Protected-main run 38089629269, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38089629269)
passed and published [v0.3.28](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.3.28), release
**409233189**, at **22:04:43Z**, with ten assets and `deployed: false`. Root verified original
source/base/run/admission, required docs-v1 and candidate hosted-v1, complete 72-case local acceptance,
image/configuration identities and all eight metadata asset hashes. The two image archives were compared as metadata
only; neither was downloaded or rehashed. Verification SHA256:
`551d91feff5d1a9d932c22e74fefed3aa03cdcd6547d2f94d178aefcb31c2978`. The
[binding record](../validation/hosted-binding.md) retains the exact candidate identities and validation limits. No
candidate merge or control pass establishes hosted application acceptance.

<a id="pr-card-2--hosted-bind-bind-the-actual-reviewed-candidate"></a>
<a id="pr-card-3--hosted-bind-bind-the-actual-reviewed-candidate"></a>

<a id="hosted-bind-prerequisite-completion--2026-10-10"></a>

### HOSTED-BIND protected-main completion

[PR #29](https://github.com/brobro10000/mp3-frame-counter/pull/29) merged normally at **22:25:18Z** on 2026-10-10 as
`62e4cd456fcafab54a1ac4080805f2ebfa51d853`, with sole parent `4c2733ea2efa469b8e4718d8763b234ab92876e4` and tree
`572b54d2427eb7b3bfe2b8ac96aab7c6da200856`, identical to the reviewed head. Companion run `20261010T221531-5e9e5da3`
produced
[automated approval 5481012150](https://github.com/brobro10000/mp3-frame-counter/pull/29#pullrequestreview-5481012150)
for `0f4a85a5c423c03af368e34da9c758ae19c3f487`; all mandatory checks passed in PR run 38090256159. Owner `brobro10000`
merged without bypass. PR #30 was immediately reconciled onto this actual squash as first parent, retargeted to main and
pushed for fresh CI; inherited source bytes were preserved.

The
[completed binding scope](https://github.com/brobro10000/mp3-frame-counter/blob/62e4cd456fcafab54a1ac4080805f2ebfa51d853/docs/phases/next-iteration.md#pr-card-1--hosted-bind-bind-the-actual-reviewed-candidate)
and [binding identities](../validation/hosted-binding.md) remain available.
[Main run 38091357730, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38091357730) passed and
published [v0.3.29](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.3.29), release **409245406**, at
**22:32:21Z** with ten assets and `deployed: false`. Root verified original source/base/run/admission, required docs-v1,
pending hosted-v1, all 72 required local cases, source/configuration/image identities and all eight metadata hashes. The
two image archives were compared as metadata only; neither was downloaded or rehashed. Verification SHA-256:
`42801b1aadeb82ee20083517349ec0b1050dad532d524c1040c51d7b6940cb1c`. Hosted-v1 remains pending until a genuine product
change; no application deployment is established.

Root read the independent main-CI audit, rehashed its 18 records and matched all 230 exact log citations. The original
run passed 545 tooling tests, 20 gate tests, 19 Mermaid renders, 120 units and 72 required local cases with cleanup.
Pending hosted controls passed 95/95 with separate 72/22/3 discovery. Audit SHA-256:
`8df2520ac44e4a7b1c85249ae4b2ba9faa15bfef2d0356127fedd23748fe74fb`. This audit downloaded no release assets; root's
separate verification above covers the eight metadata assets and original admission replay. Original job-output
admission SHA-256 `60c6e8a052e89a3c9e19ae73f5808453b5b92faed606037efaec48108b8b2c3e` agrees across product, control and
publisher. These retained local diagnostic hashes are not signed attestations.

<a id="pr-card-3--hosted-evidence-validate-separate-hosted-results-and-envelopes"></a>

### HOSTED-EVIDENCE protected-main completion

[PR #30](https://github.com/brobro10000/mp3-frame-counter/pull/30) merged at **22:53:36Z** as
`bccea9eb285e467f98b028f4d7f5a895ec83ebd7`, sole parent `62e4cd456fcafab54a1ac4080805f2ebfa51d853`, tree
`9e7bf6491ecef7cd2bdfcbcaddec887ea163b36c`, equal to reviewed head `f408e3f09f8c7da83c86eb68907f11a69e0a44e4`. Companion
run `20261010T224711-e8ea7e4b` posted
[automated approval 5481096891](https://github.com/brobro10000/mp3-frame-counter/pull/30#pullrequestreview-5481096891);
owner `brobro10000` merged normally after all required checks. PR #31 was immediately reconciled onto actual main.

[Main CI 38093092935, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38093092935) passed: 583
tooling tests, 20 gate tests, 19 Mermaid renders, 120 units and all 72 required local cases with cleanup. Original
admission digest `bbe1e7faae434433436d078db80089182d9cf16c46b17e3791370574fe8b563e` agrees across producer, control and
publisher. Hosted-v1 controls/discovery remain separate from acceptance.

[v0.3.30](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.3.30), release **409257045**, published at
**23:00:37Z** with ten assets and `deployed: false`. Root verified original context/admission, required docs-v1, pending
hosted-v1, configuration/image/reservation identities and all eight metadata hashes. Archives were metadata-only; none
were downloaded. Verification SHA256: `11da07a45055c209b6cffdb48fcdbf4408309efd9d748dd79c162ab4f922449c`. Root read the
independent audit, rehashed 18 records and matched 233 citations; audit SHA256:
`d1a72a97b758f5c0d21bd7271b2ac1bc733762511a789fade62d672cfa791303`. These are local diagnostic hashes, not signed
attestations. The
[completed card](https://github.com/brobro10000/mp3-frame-counter/blob/bccea9eb285e467f98b028f4d7f5a895ec83ebd7/docs/phases/next-iteration.md#pr-card-2--hosted-evidence-validate-separate-hosted-results-and-envelopes)
remains in its immutable source. No hosted deployment is established.

<a id="pr-card-1--hosted-source-projection-retain-required-declaration-bytes-for-hosted-consumers"></a>
<a id="pr-card-2--access-foundation-prepare-protected-state-registry-and-scoped-identities"></a>
<a id="pr-card-3--access-foundation-prepare-protected-state-registry-and-scoped-identities"></a>

### Source projection and access foundation protected-main completion

[PR #31](https://github.com/brobro10000/mp3-frame-counter/pull/31) merged at `2289a80f6a0f35bab819d7057ac3b2029f09c10f`.
[Main run 38093943514](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38093943514) passed and published
v0.3.31 with ten assets and `deployed: false`. It passed 602 tooling tests, 20 gate tests, 19 Mermaid renders, 120 units
and 72 required external cases with cleanup. Pending hosted controls and discovery did not execute hosted acceptance.

[PR #32](https://github.com/brobro10000/mp3-frame-counter/pull/32) merged at `30ad90cdb27be67e5bfb01197e9b3a40a81e1904`
after
[automated companion approval](https://github.com/brobro10000/mp3-frame-counter/pull/32#pullrequestreview-5481173589) on
`655c5c31aabf7b12df698177d1edb241adf7edfc`. Its tree equals the reviewed head; its sole parent is actual main #31.
[Main run 38094906874, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38094906874) passed 621
tooling tests, 20 gate tests, 19 Mermaid renders, 120 units and 72 required external cases with cleanup. The 95 hosted
controls and 72/22/3 discovery remain separate from hosted execution. Release
[v0.3.32](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.3.32), ID 409269633, published at 23:32:11Z
with ten assets and `deployed: false`.

Root verified each original admission/source/base/run, suite, configuration and image identity and rehashed eight
metadata assets per release. Image archives were compared as metadata only. Root also read the independent main audits,
rehashed their retained records and matched their exact log citations. Main-32 audit SHA256:
`d90245d62d6df0fdc3bb9402ef2ea089da8f217988f18936d06d90ff6fbeb206`; root metadata verification:
`d8d8ac65c898ff59fa7e68234c3a2b52eca4f9fedc963689051abb26f12a3e50`. Source publication is complete; access creation and
real provider readback remain separate operational evidence. The original bounded cards remain in
[main #32](https://github.com/brobro10000/mp3-frame-counter/blob/30ad90cdb27be67e5bfb01197e9b3a40a81e1904/docs/phases/next-iteration.md).

<a id="pr-card-3--publisher-handoff-emit-an-authenticated-publisher-receipt"></a>

<a id="pr-card-1--publisher-handoff-emit-an-authenticated-publisher-receipt"></a>

### PUBLISHER-HANDOFF protected-main completion

[PR #33](https://github.com/brobro10000/mp3-frame-counter/pull/33) merged at **2026-10-11 00:16:26Z** as
`781b334230d956485abbc508fcfe5de2b2684305`, sole parent `30ad90cdb27be67e5bfb01197e9b3a40a81e1904`, tree
`9001a9048c69fc137db0bc35f635bb7638695869`, identical to reviewed head `64e30f081a8d076d0afc88ee4383ae334c7dbfea`.
Companion `brobro1000` posted
[automated approval 5481299949](https://github.com/brobro10000/mp3-frame-counter/pull/33#pullrequestreview-5481299949)
after a clean complete review. Owner `brobro10000` merged normally with passing checks and no unresolved conversations.
[PR run 38096791531, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38096791531) passed 655
tooling tests, twenty gate tests, nineteen Mermaid renders, 120 units and all 72 required external cases with cleanup.
Root rehashed the independent audit's nineteen records and matched 195 exact log citations. Audit SHA256:
`4ab446d0667097e759dc21aa91345967ed8ad0765775523b0a69df76ecf4d52c`. The earlier bot-superseded run remains cancelled.

[Main run 38097867539, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38097867539) passed
validation and publication at **00:23:20Z**, including 655 tooling tests, twenty gate tests, nineteen Mermaid renders,
120 units and all 72 required cases with scoped cleanup. Release **409290121**, **v0.3.33**, published at **00:23:15Z**
with ten assets and `deployed: false`. Root verified source/base/run/admission, required docs-v1, pending hosted-v1,
configuration/image metadata and all eight downloaded metadata assets. Original admission SHA256 is
`0c1f78be7e4d2e906516de59c83aea7f7488a92ad6a5440f5e0560a205617cf3`; metadata-verification SHA256 is
`6c3c6c851e0d0732f6948d3c6c8909f3a9a9ef18484b8b16277fa8938120f102`. Neither Docker image archive was downloaded.

The publisher's upload and receipt steps succeeded. Actions artifact **11686528154**, **3,558 bytes**, has archive
SHA256 `922b4bdb0f1da1376b40e67609e94d578f36354a292a5ad6012ba914a4bd8f34`, raw handoff SHA256
`c6269a29611b2de805707d4795ed5fad0e8581e18bfdc8357c7ec1f6f648dbcf`, and observed expiry **2027-01-09T00:16:29Z**. Root
downloaded that exact artifact through authenticated GitHub CLI, checked both hashes, fixed STORE framing/CRC and the
new pure reader, then matched its original/publisher contexts and all ten asset IDs, names, sizes and hashes to the
verified release. Cross-binding record SHA256: `9f30fbfea4c6808888f9bca28274c066a63583515f97f9110f4aa6f533a8b60a`. This
establishes an observed live producer and archive compatibility; it does not implement the future CI acquisition/replay
adapter or prove hosted delivery.

The completed source
[card](https://github.com/brobro10000/mp3-frame-counter/blob/781b334230d956485abbc508fcfe5de2b2684305/docs/phases/next-iteration.md#pr-card-1--publisher-handoff-emit-an-authenticated-publisher-receipt)
and [implementation evidence](../validation/publisher-handoff.md) preserve its bounded history. The software release
remains independent of deployment; no application service or production candidate was deployed.

<a id="pr-card-2--access-backend-protect-access-state-in-its-operations-bucket"></a>

<a id="pr-card-3--same-run-handoff-validate-the-direct-publisher-delivery-input"></a>

### SAME-RUN-HANDOFF merge and successor window

PR #35 merged at `bcdda0505e42120201e7377888dda44a05fb39a3` on 2026-10-11 at 00:47:40Z after
[exact-head CI](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38098686170) passed and the companion
[approved the exact head](https://github.com/brobro10000/mp3-frame-counter/pull/35#pullrequestreview-5481378768). All
688 tooling groups, 120 units and 72 required local cases passed; 31 new validator groups were individually observed.
The first companion snapshot preceded finished CI and remained incomplete; the fresh review used completed evidence.
[Actual-main run 38099632751](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38099632751) then passed and
published [v0.3.35](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.3.35), release 409304154, at
00:55:39Z. Eight small metadata files were rehashed and original admission replayed against that source; neither Docker
archive was downloaded by this audit. The
[completed pure-unit card](https://github.com/brobro10000/mp3-frame-counter/blob/bcdda0505e42120201e7377888dda44a05fb39a3/docs/phases/next-iteration.md#pr-card-3--same-run-handoff-validate-direct-publisher-artifact-consistency)
remains in that immutable source. Authenticated acquisition/replay and hosted execution are still unimplemented.

### Bootstrap admission prerequisite merge

PR #37 merged at `72081b34b4e591691f2171cb4de893313f469a8b` on 2026-10-11 at 01:21:33Z after
[run 38100736309](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38100736309) passed and the companion
[approved its exact head](https://github.com/brobro10000/mp3-frame-counter/pull/37#pullrequestreview-5481468739). All
708 tooling tests, 120 units and 72 required local cases passed. PR #36 was immediately reconciled onto this actual
main. Its main run 38101567859 passed and published v0.3.36. The original failed admission run remains historical
evidence. PR #36 then passed fresh CI and companion review and merged at `07c020c40f4a0238da937b82f24e4ef50cb37824` on
2026-10-11 at 01:47:24Z. The V1 branch immediately refreshed to that actual main. Main run 38103007563 passed and
published v0.3.37 at 01:53:59Z; no live IAM change or state migration is established by either merge.

## Current V1 completion window — 2026-10-11

The owner's [V1 priority amendment](../deployment/v1-delivery.md) supersedes the extended next-card ordering. Earlier
cards remain available in Git history. PR #37 is published as v0.3.36; PR #36 is published as v0.3.37. The working
application already passes its required local acceptance. No hosted stage or production result is claimed.

## PR card 1 — Finish IAM and protected state

**Outcome:** remove only the reviewed inherited Editor grant, preserve unrelated policies/cost controls, and move the
existing access state into its protected backend with verified parity, locking and a normal no-change plan.

**Scope:** PR #36 companion approval, owner merge and actual publication are complete. Apply only its independently
reviewed saved plan, read back policies and verify the local bootstrap's eight resources. Then complete state-only
migration for the unchanged 23-resource access root. Root owns cloud mutations; a separate reviewer checks the saved
plan. Preserve original failures and recovery copies. No application or production deployment occurs here.

**Exit:** actual IAM preservation and no drift, protected access-state parity/locking and 23 no-op resources. Failed or
ambiguous operations remain stopped until their actual state is known. Advance direct dependents immediately after
merge.

## PR card 2 — Deliver the MVP automatically to stage

**Outcome:** an eligible published main release automatically deploys its exact tested image pair to authenticated
stage, and the frozen hosted stage suite records 22 passing cases with stable observed identity and cleanup.

**Scope:** one governance/setup PR and its directly dependent runtime PR reuse the existing release verifier, isolated
suite extraction and hosted protocol. Existing admission requires this product/governance separation. Add only the
required scoped federation/access grants, two-container runtime IaC, dependent workflow job, registry transfer, provider
identity binding and launcher. Write independent expectations before implementation, preserve frozen suites, and keep
stage identities unable to deploy production. Use same-run bundle provenance and compare the actual release assets; no
generalized metadata acquisition/replay framework. Keep software publication independent of stage.

**Validation:** focused credential-free tests, normal mandatory CI, exact-head companion review, actual-main
publication, reviewed IaC application and real stage acceptance. Check inclusive 20 MiB ingress, docs/CSP and immutable
image identity through the existing suite. Demonstrate a recoverable prior revision or first-deployment withdrawal.
Failed stage blocks promotion and preserves the release. Root serializes integration and cloud changes; agents own
disjoint test/source paths.

**Exit:** one real successful automatic stage run with source, suite, release, configuration and both digest identities.
Produce an exact candidate for human review. Stop before any production application deployment.

## PR card 3 — Human-approved production and v1.0.0

**Outcome:** deploy the verified stage image pair to production after the owner's exact approval, pass all three frozen
production smoke cases, retain recovery evidence and finalize v1.0.0 on the same source and artifacts.

**Scope:** a small owner-invoked production operation or supported environment gate, the production IaC configuration,
identity/smoke/recovery checks and additive finalization through the existing release authority. No automatic production
promotion and no new features. Ordinary v0.x releases remain immutable. No image rebuild, version reinterpretation or
new acceptance oracle. A finalization-only failure leaves healthy production intact and permits metadata retry.

**Validation and stop:** independently review the candidate and operation, obtain human approval, observe actual
provider convergence and passing smoke, verify recovery and publish finalization provenance. If approval is pending,
present the candidate and stop production work while completing other unblocked V1 tasks. Declare V1 complete only after
these observations; capture deferred work separately for the next iteration.

### ACCESS-IAM-DEFAULTS publication — 2026-10-11

[PR #36](https://github.com/brobro10000/mp3-frame-counter/pull/36) merged at `07c020c40f4a0238da937b82f24e4ef50cb37824`
after exact-head automated companion approval and required checks.
[Main run 38103007563](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38103007563), attempt 1, passed 720
tooling checks, 120 units and all 72 required local cases with cleanup. Release
[v0.3.37](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.3.37), ID 409332421, published at 01:53:59Z.
Root verified source/base, original admission, release identities and all eight metadata asset hashes. Image archives
were not downloaded or rehashed. Docs-v1 remains required; hosted-v1 remains pending. Publication authorizes the
reviewed prerequisite operation; it is not evidence of an IAM apply, stage deployment or hosted acceptance.

### IAM operation completion — 2026-10-11

The reviewed saved plan from v0.3.37 applied successfully. Twenty fixed API readbacks verified that only the reviewed
unconditional project Editor binding was removed; unrelated IAM and the USD 75 Cloud Run cap / USD 100 all-service alert
budget were preserved. The resulting eight-resource bootstrap plan has eight no-op actions and two unchanged outputs.
The provider normalized the empty Editor members set from null to an empty list during refresh.

The original follow-up failure (local Python CA lookup) and subsequent normalization refusal remain retained in private
operator evidence. Apply was not retried. Verification used the system CA bundle and a narrow empty-set normalization.
The completed private review digest is `44c6262de0a00cbdef42b90a63ec3567c17b3f2bff8b01a674bbf183933761ab`. Access-state
migration and all hosted application execution remain pending.

## Bounded local backend refactor — 2026-10-11

The [owner amendment](../requirements/backend-audio-refactor.md) temporarily defines local work: independently establish
contract/policy expectations, extract factory/transport/parser, then integrate generated docs and existing React/proxy
consumers. Stop before remote writes and resume the actual successor review/binding sequence later. This overrides the
earlier physical-only/Fastify-only wording only for the named local target. Cloud phases stay deferred.
