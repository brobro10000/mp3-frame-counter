# Next iteration: phase instructions and three PR cards

**Current state, 2026-10-10:** HOSTED-BIND is merged and published as
[v0.3.29](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.3.29), from exact main source
`62e4cd456fcafab54a1ac4080805f2ebfa51d853`. DOCS-IMPLEMENTATION shipped in v0.2.24; docs-v1 remains required for
descendants and reverts, with hosted-v1 bound and pending a genuine product change. This dated amendment supersedes
earlier pending-docs statements in entrypoint/role guidance; those statements describe preceding work. No application
service is deployed.

<a id="pr-card-3--profile-declarations-validate-immutable-acceptance-profile-declarations"></a>

PR #26's PROFILE-DECLARATIONS implementation merged at `fd0f35bca1289319ce909a4aff785251c0cd1583` after corrected-head
CI and exact-head companion approval. Its
[bounded card](https://github.com/brobro10000/mp3-frame-counter/blob/32ae32080a40c7ab1fddccc9d585af8f73aee802/docs/phases/next-iteration.md#pr-card-3--profile-declarations-validate-immutable-acceptance-profile-declarations)
remains in its immutable source. Main run 38084476141 passed and published v0.2.26; the
[completion evidence](#profile-declarations-protected-main-completion) verifies that prerequisite. The direct dependent
was immediately reconciled onto actual merged main while publication was verified in parallel.

The next three-card window is **HOSTED-EVIDENCE**, **HOSTED-SOURCE-PROJECTION** and **ACCESS-FOUNDATION**. The binding
merged as PR #29 at `62e4cd456fcafab54a1ac4080805f2ebfa51d853` and published v0.3.29. Parallel authoring of dormant
helpers and the separate access root may proceed; their required prerequisite publications must be verified before
merge. Later launcher, image transfer, federation, runtime IaC and workflow changes stay provisional.

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

## PR card 1 — HOSTED-EVIDENCE: Validate separate hosted results and envelopes

**Outcome:** dormant pure validation of the existing HostedSuiteResultV1 and HostedAcceptanceV1, against independently
authenticated expected values. A valid failed/blocked record stays nonpassing. No resolver, source reader, launcher,
provider operation or release/deployment gate is replaced or activated.

**Prerequisites and order:** actual PR27/v0.3.27 publication and the independently reviewed exact API contract authored
in the dependent branch for `docs/deployment/hosted-evidence.md`. Independent synthetic expectations and implementation
may proceed while HOSTED-CONTRACT and HOSTED-BIND validate. Reconcile onto actual protected main and verify HOSTED-BIND
publication before merging this dependent. Pending/candidate identities cannot authorize real hosted execution.

**Exclusive ownership:** an independent author writes only `scripts/hosted-evidence.test.mjs`; after those expectations
are reviewed and frozen, a separate implementer writes only `scripts/hosted-evidence.mjs`. Root adds that exact test
file to `package.json`'s existing tooling command, owns the API document, narrowly related phase/roadmap/README pointers
and `docs/validation/hosted-evidence.md`. No package dependency or lockfile update. All suite/contract/registry,
product, existing gate/reader, workflow, publisher, preparation, retry and infrastructure files remain read-only.

**Independent expectations first:** literal synthetic unequal profile inventories, complete passing stage/production,
partial failed and empty blocked records, all closed fields/types/identities, exact inventory and original row custody,
unknown/duplicate/skipped/retried rows, swapped image roles/digest representations, declaration/predecessor mismatches,
missing outputs, wrapper/status matrix, exact cleanup aggregation, missing/drifted/reversed observations and stale
launch identity. Verify fresh frozen copies, immutability, deterministic sanitized rejection and no I/O. Preserve red
evidence and use valid positive counterparts; do not create expected hashes from the implementation being tested.

**Validation and review:** focused independent tests, full tooling/gate/policy/format/portability checks and normal
mandatory CI with unchanged required product acceptance plus any separately resolved pending controls. Independent
expectation and implementation review, then fresh exact-head Docker companion approval before normal owner merge.

**Rollback and release:** ordinary 0.3 software publication; no deployment. A coherent revert of unused dormant helpers
may restore their prior absence, but cannot remove binding history, lower the release line or reinterpret old artifacts.

**Done and stop:** exact validators and all consumers in this card agree with the adopted closed contract; current CI
and actual-main publication are verified. Stop before adding a trusted launcher, registering cloud resources, wiring
automatic stage delivery or performing any production operation.

## PR card 2 — HOSTED-SOURCE-PROJECTION: Retain required declaration bytes for hosted consumers

**Outcome:** one additive export in the existing immutable source reader supplies original declaration inputs and raw
hashes for the already selected required suite. It neither selects a different suite nor authenticates publisher or
provider facts. The existing reader's public result and legacy behavior remain unchanged.

**Prerequisites and order:** adopt this bounded interface, retain the existing profile/lineage contract, and preserve
HOSTED-EVIDENCE's parsed-data expectations. Independent tests and disjoint reader implementation may proceed while the
preceding cards validate. Reconcile onto actual main and verify both preceding publications before this card merges. A
candidate or pending hosted suite never substitutes for a required hosted suite.

**Selected API:** `readRequiredAcceptanceProfileProjection(root, { selection, sourceRevision, baseRevision })` returns
explicit null for a successfully validated legacy/null required declaration. Otherwise it returns a fresh deeply frozen
closed object containing `required` (the existing normalized required profile result), `declarationInput` (original
metadata, all three inventories, selected contract revision and actual predecessor-local inventory), `profilesSha256`
and `inventorySha256: { stage, production }`. Hash exact original regular blob bytes before strict parsing; preserve
original input order and the predecessor's own revision. There is no profile, role, path, ref or older-suite override.
The future hosted caller must reject null before execution. Malformed data/context throws the existing sanitized source
or declaration error, never an ineligible-success fallback.

**Owned paths and independence:** an independent author extends `scripts/acceptance-profile-source.test.mjs` before a
separate implementer changes `scripts/acceptance-profile-source.mjs`. Explicitly amend only the existing sole-export
assertion to admit this additive API; preserve all other established expected decisions. Root owns narrow protocol/API
and phase/validation documentation. No package/dependency, runtime/admission/resolver, suite/registry, release consumer,
workflow, credential, infrastructure or deployment change belongs here.

**Required implementation:** factor one private validated read behind both public exports. Preserve the single existing
resolution/catalog/suite/lineage pass and atomically validate all selected roles. Retain original decoded values and raw
hashes in its private immutable-read cache; project only required. Do not call the public reader then walk history again
or reconstruct original inputs from normalized mappings. Import has no I/O; calls retain bounded, replacement-disabled,
read-only Git-object access and have no provider, execution or write side effect.

**Independent expectations:** activated required profiles with differently revised predecessor; semantic equality with
different raw whitespace/order and corresponding distinct hashes; complete input/output preservation; valid legacy/null
required even beside a hosted candidate; candidate/pending/working-copy/replacement-object substitution refusal; lineage
and profile downgrade refusal; strict UTF-8/JSON/regular-blob checks; atomic failure for any selected-role defect;
unchanged old reader behavior; fresh frozen results and import purity. Use valid counterparts and retain actual red
before code.

**Original-context boundary:** historical replay uses existing `verifyAcceptanceAdmission` with independently
authenticated original publisher context and external admission digest. Current hosted-run variables cannot impersonate
the original CI run. `runtimeAcceptance` is tied to actual HEAD/current CI context and is not a historical-release
shortcut. This card adds no publisher handoff or new authority; the later launcher must establish that prerequisite
separately.

**Validation/review:** focused independent source-reader tests, full tooling and repository checks, normal mandatory CI,
independent exact-diff review and fresh companion approval. Revalidate actual protected-main publication after owner
merge.

**Rollback and stop:** ordinary 0.3 artifact release, without deployment. A coherent unused-export revert must preserve
existing reader behavior and immutable history. Stop before the launcher, registry transfer, environment setup or any
production operation. Later hosted eligibility still requires actual successor activation and authenticated release
data.

## PR card 3 — ACCESS-FOUNDATION: Prepare protected state, registry and scoped identities

**Outcome:** a source-reviewed, reusable access root for the dedicated project, with no application service or automated
cloud entrypoint. Follow the exact [resource and operational contract](../deployment/cloud-access-foundation.md). This
is a disjoint infrastructure domain; it does not change the application or activate hosted acceptance.

**Prerequisites/order:** existing cost bootstrap and HOSTED-DELIVERY-POLICY reservations; reviewed independent
configuration expectations before Terraform implementation. Author and review this independent domain while helper PRs
validate. Its source prerequisites are the published cost bootstrap and delivery-policy reservation; dormant helper
publication is not needed for these access-only resources. Reconcile onto actual main before merge. Fresh cost readback,
private saved-plan review and observed resource identities are additional prerequisites to live use after merge.

**Owned paths:** only the five reserved `infra/cloud/access/` files, independent
`scripts/cloud-access-foundation.test.mjs`, its `package.json` test registration, narrow existing CI validation wiring
and matching `scripts/policy.mjs` assertions, this contract, `docs/validation/cloud-access-foundation.md` and focused
entrypoint/phase/roadmap documentation. Root owns shared CI/package/policy and Git operations. An independent author
owns tests; a separate implementer owns Terraform files after expectations are reviewed and frozen.

**Exact scope:** Terraform 1.13.3/google 8.6.0; five additional APIs, three protected state buckets, one regional Docker
registry, seven fixed service identities and seven resource-scoped IAM members. All project/region input is explicit or
validated; no secrets. Start with private local state; a later reviewed same-file backend amendment migrates it after
actual bucket creation/readback. Retain both Terraform and provider destruction guards. No expiry rules, public access,
project-level IAM, keys, broad token creator, WIF, runtime resources or cost-control mutation.

**Independent expectations first:** credential-free mocked-provider plans assert complete resource scope, role/principal
and target tuples, bucket/registry protection, no runtime permissions and safe outputs. Positive fixtures use synthetic
identities; invalid inputs and isolated negative controls prove that dangerous IAM/protection/extra-resource changes
fail. Preserve actual missing-source red. Distinguish configuration behavior, structural lifecycle checks and real
provider behavior; mocks cannot prove IAM propagation or live deployment.

**Validation/review:** pinned format, read-only locked initialization, schema validation and focused mock tests; full
mandatory tooling/policy checks and unchanged product acceptance. Independent expectation and implementation review,
then fresh exact-head companion approval before owner merge. Verify actual protected-main artifact publication. CI gains
no cloud credential, new required job, permission, deployment trigger or acceptance-classification exception.

**Authorized operational follow-through:** after publication, root reads back the USD 75 shared Run cap and USD 100
all-service alert budget, reviews the exact private create-only plan and applies only the adopted resources. Reject
unexpected existing resources/actions. Verify actual identities/IAM and a no-change plan; retain restricted state and
recovery copies. These operations remain separate evidence from source tests. Every production application deployment
still needs actual human intervention for its exact candidate.

**Rollback and stop:** before apply, coherent source revert; afterward retain state, costs and destruction guards until
reviewed decommissioning. Do not force destroy or abandon management. Stop before federation activation, remote-state
migration, first service creation, image transfer or application deployment. Those follow-up packages require their own
bounded source review and operational checks.

## Provisional work after the three-card window

Expand only when prerequisite evidence exists: trusted launcher execution and coherent promotion-consumer migration;
exact tested-image registry transfer; publication reconciliation/backfill before handoff expiry; narrowly scoped
access-root remote-state migration and federation/service IAM; runtime pair/configuration IaC; active post-publisher
stage workflow and observed stage acceptance/recovery; production gate/finalization support. These packages remain
provisional, with no guessed PRs/SHAs.

Use sibling/stacked branches for disjoint authoring, then reconcile actual squash ancestry and obtain fresh
checks/review for each main-target PR. Serialize shared policy, bindings, Git operations and environment changes. A
dependency's pending CI does not stop independent authoring; it does stop claiming that dependency verified or merging
work that requires it.

Before billable setup, read back the dedicated USD 75 shared Cloud Run cap and USD 100 project alert budget. Before
hosting, prove scoped federation/invocation, exact registry content and real ingress/resource behavior. Every production
application deployment requires human intervention for its exact candidate; do not operate the owner dispatch to
impersonate that gate. Production identity/smoke and additive same-source/image finalization precede `v1.0.0`.
