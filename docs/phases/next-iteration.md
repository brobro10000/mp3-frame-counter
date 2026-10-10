# Next iteration: phase instructions and three PR cards

**Execution status, 2026-10-10:** PLAN-01, COST-BOOTSTRAP, GATE-01, VER-01, LINE-02, TR-LIFECYCLE and TRANSPORT-CONTRACT
are merged. Protected-main run `38047498564` published **v0.2.15** from `6c28382d71a014351311e63154ef1c8916b8a229`. The
[transport record](../validation/transport-binding.md) separates published r3 acceptance from the independently authored
67-case candidate diagnostic. This change proposes the actual transport-v1 binding; its review, merge and publication
remain pending. r3 still gates unchanged application behavior.

The three active cards are **TRANSPORT-BIND → RUNTIME-POLICY → FASTIFY**. A separate dependency-policy change is needed
because current policy forbids all runtime dependencies and admission rejects mixed governance/product changes. The
[version record](../validation/release-lines.md#line-02-protected-main-activation--2026-10-10) preserves verified line
allocation; the [cost evidence](../validation/cloud-cost-bootstrap.md) preserves the dedicated project's USD 75 Run cap
and USD 100 all-service alert budget. No application is deployed. Production application deployment/promotion requires
human intervention under the [execution amendment](roadmap-execution-authorization.md).

Use the [versioned roadmap](../roadmap/README.md) for dependencies and later release envelopes. Role boundaries remain
in the [acceptance](../agents/acceptance-author.md), [implementation](../agents/implementer.md),
[review](../agents/reviewer.md) and [release](../agents/release-operator.md) instructions. The retired lifecycle and
candidate cards remain in the
[exact pre-binding document](https://github.com/brobro10000/mp3-frame-counter/blob/6c28382d71a014351311e63154ef1c8916b8a229/docs/phases/next-iteration.md);
this window does not rewrite their dated execution evidence.

Trace: APP-V1-009,010,011,013 for independent acceptance and delivery; APP-V1-012,015 and APP-REL-001–006 for exact
image releases. APP-V1-014 and hosted APP-V1-015 remain future work. Roadmap gate IDs are planning decisions, not
replacement assessment requirements. Preserve the historical functional V1 closure; semantic v1.0.0 requires verified
production.

## Phase operating instructions

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

## PR card 1 — TRANSPORT-BIND: Bind the actual independently reviewed successor

**Outcome:** register the merged transport-v1 candidate as the single pending successor. r3 still gates unchanged
application behavior; the next product-affecting change must pass transport-v1. Binding ships neither Fastify nor
documentation routes. Trace APP-V1-009,010,013 and APP-REL-001–006; added TC-01–07 remain later compatibility decisions.

**Prerequisites:** TR-LIFECYCLE's verified capability, publication and explicit unresolved-drain disposition; the final
TRANSPORT-CONTRACT candidate-only protected-main squash, independent exact-head approval, required main CI and release.
Verify candidate discovery, oracle/negative controls and its separately labeled complete product diagnostic without
substituting them for r3 required acceptance. Refresh trusted main and establish that this is the only pending
candidate. The current candidate describes 67 identities; use the actual reviewed merged inventory and evidence, not a
prediction.

### Ownership, writable paths and immutable boundaries

Root coordinates Git and appends one record to `docs/testing/acceptance-transitions.json`. Independent acceptance/gate
review owns the identity audit; the companion independently reviews the exact final PR head. Narrow
evidence/current-state updates may use `docs/testing/acceptance-transition.md`, `docs/roadmap/README.md`,
`docs/phases/next-iteration.md` and `docs/validation/transport-binding.md`. Reuse an equivalent validation record if one
exists at execution time.

All `tests/acceptance/**`, `docs/testing/contracts/transport-v1.md`, genesis and prior registry records are immutable.
Product, root dependencies/lock, controller, gate/release scripts, workflows, version policy and infrastructure are
read-only. The trusted classifier already permits a registry-plus-documentation binding; no classifier change belongs
here. This record cannot waive a failed candidate, alter its oracle or introduce another pending successor.

### Independent checks before recording the binding

1. Resolve the actual merged candidate commit and its single protected-main parent. Independently inspect the parent
   diff: only the admitted suite and unique contract may have changed. Preserve original r3 suite objects and genesis.
2. Derive suite tree, fixture-manifest SHA-256, contract SHA-256 and revision from that committed candidate. Confirm the
   complete candidate squash tree equals the independently reviewed feature-head tree; suite tree is a different object.
3. Obtain real repository/PR/review IDs, reviewer, reviewed head and reviewed tree. Trusted preflight must authenticate
   the same-repository merge and the reviewer's current decisive approval for that head. Reject self-review, stale or
   superseded approval, dismissed reviews, incomplete history and invented observations.
4. Prepare the append-only record against these independently checked values. Verify actual resolver output selects
   binding admission, required predecessor r3, the intended pending successor and no activation commit. Preserve the
   original source/base/context and authenticated observations; source-equals-base is not an admission shortcut.
5. Preserve the lifecycle distinction in binding evidence: TC-07 verifies bounded unfinished-upload closure and normal
   same-generation exit. Graceful completion of an admitted response after a stopping boundary remains unresolved; the
   migration still requires fresh independent shutdown source/configuration review and operational disposition.

### Validation, review and failure signals

Run focused existing resolver/admission/review-consumer tests, relevant policy/format checks and mandatory CI with
unchanged required r3. Candidate controls remain separate evidence. Independently review every recorded identity and
verify preflight, isolated extraction, preparation and publication agree about the required versus pending suite. Local
selection is diagnostic only and cannot fabricate authenticated admission or the independent preflight digest.

Mismatch, mixed scope, a second pending candidate, unavailable reviewed objects, stale approval, missing mandatory
evidence or consumers that disagree blocks merge. A discovered gate defect or merged-candidate correction requires a
separate reviewed repair; do not alter the candidate or widen gate policy inside this binding.

Require clean exact-head companion approval, then merge as the owner under the existing controls. Observe protected-main
admission, r3 acceptance, exact source/image evidence and normal v0.2.x software publication. Record the actual binding
commit and release; neither PR checks nor the candidate diagnostic establishes main publication.

### Rollback, release effect and stop

Discard an unmerged proposal if needed. Once merged, the registry is append-only: there is no implicit cancellation,
replacement or removal to evade the successor. Preserve all history; an unusable pending binding needs separately
reviewed recovery policy. No deployment is implied by its ordinary v0.2.x release.

**Done and stop:** actual binding, independent approval, mandatory main checks and release are verified. Demonstrate
that the next product change requires transport-v1. Proceed only to the separate governance-only RUNTIME-POLICY card; do
not introduce Fastify, alter the bound suite or begin docs/CSP/hosted work in this PR.

## PR card 2 — RUNTIME-POLICY: Admit one explicitly pinned framework dependency

**Outcome:** replace the blanket prohibition on root runtime dependencies with the frozen narrow Fastify policy, without
installing or declaring Fastify. Current dependency-free product behavior and r3 required acceptance remain unchanged,
with transport-v1 still pending. Trace APP-V1-009,010,013; preserve the assessment's MP3-parser-package ban.

**Prerequisites:** actual TRANSPORT-BIND main publication and trusted resolver evidence; the same single pending
transport successor; no intervening product-affecting change. Adopt the selected runtime-policy decisions in the tracked
policy documentation as part of this PR. This separate change is necessary because acceptance admission rejects mixed
product/governance changes and `policy.mjs` currently requires absent root runtime dependencies.

### Ownership, writable paths and immutable boundaries

An independent expectation author first owns new `scripts/runtime-dependency-policy.test.mjs`. A separate implementer
owns `scripts/runtime-dependency-policy.mjs` and the narrow call/wiring in `scripts/policy.mjs`. Root owns the sole
`package.json` change: add the focused test to `scripts.test:tooling`, without touching any other script or metadata.
Narrow documentation may use `docs/testing/runtime-dependency-policy.md` and current roadmap/card/evidence pointers.

Root dependency declarations, all other package fields and the complete root lockfile remain byte-unchanged. All
acceptance source/contract/registry/genesis, product, controller, release allocation/publication, workflows, required
jobs/permissions, phase monotonicity, pinned tooling, existing development allowlist and infrastructure are read-only.
No new gate path class, suite selector, policy bypass or dependency is permitted.

### Frozen predicate and independent tests first

Export `requireRuntimeDependencyPolicy(packageJson, packageLock)`, returning undefined on success or throwing. It
accepts parsed ordinary JSON, performs no I/O or mutation and grants no GitHub or acceptance authority. Keep surrounding
policy checks intact; call it where the blanket runtime-dependency prohibition currently sits.

- Accept absent or empty direct runtime maps, including any absent/empty package versus lock-root combination. Reject
  malformed declarations. Normalize only for comparison; never rewrite historical inputs.
- Otherwise allow exactly lowercase `fastify` with a stable exact `X.Y.Z`: canonical nonnegative decimal components
  within safe integer bounds. Refuse ranges, tags, prefixes, aliases, URL/Git/local/workspace sources, prerelease/build
  suffixes and other packages, including any MP3 parser package or Fastify plus another direct dependency.
- Require ordinary npm-v3 package metadata and package/lock-root parity. Direct Fastify must have the matching normal
  production `node_modules/fastify` version and canonical npm tarball URL. Refuse links and dev/optional-only
  identities. Require one canonical SHA-512 SRI token decoding to 64 bytes. This validates metadata, not downloaded
  tarball bytes.
- Optional/peer/peerMeta/override root channels permit absent or empty ordinary maps only; bundle/bundled fields permit
  absent or empty arrays only. Null and false are not empty aliases. Preserve workspace/development prohibitions.
- Keep existing generic transitive registry/integrity checks. Do not invent a transitive package-name allowlist or apply
  direct exact-pin syntax to transitive ranges. MP3-parser absence still requires independent dependency/source review;
  this predicate cannot prove package contents, provenance or complete graph reachability.

Before implementation, commit independently reviewed positive/negative expectations and preserve their meaningful red
result. Cover current legacy absence; all empty-map combinations; a valid synthetic exact pin/normal lock; legitimate
transitive ranges; malformed metadata; unknown/runtime-parser keys; every unsupported version/source class; package/root
and installed-version disagreement; wrong URL/package/production identity; malformed/noncanonical integrity and wrong
decoded length; alternate-channel bypasses; and input immutability. Synthetic pins are not production recommendations.

Exercise the actual `policy.mjs` wiring with a complete controlled positive fixture and a forbidden-dependency negative
fixture, so missing files/modules or unrelated setup errors cannot satisfy the rejection. Preserve existing development
policy checks. Reuse existing admission fixtures for governance versus product classification; add only a meaningful
missing pending-binding interaction. Never introduce a test-only CLI exemption or real registry/install dependency.

### Validation, review and failure signals

Run focused predicate/wiring tests first, then normal tooling, policy/format and mandatory CI against the final source.
Resolve admission as governance-only; verify transport-v1 remains pending and r3 remains required. Root lock or runtime
map changes, changed development permissions, newly accepted unsupported source forms, missing test wiring or accidental
successor activation block merge. Any mixed-scope need returns to a separately bounded prerequisite.

Require independent policy/security review and clean exact-head companion approval. After owner merge, verify actual
main admission, current r3 acceptance and v0.2.x publication. Do not infer that permitting Fastify has installed it,
verified its selected version, exercised its runtime or proved the successor against a migrated application.

### Rollback, release effect and stop

Before runtime introduction, a coherent governance-only revert may restore the old prohibition; it cannot remove the
pending binding. Once runtime dependencies are introduced, reverting policy alone would reject that product state:
repair forward or coordinate a reviewed compatible product recovery, without rewriting releases or weakening acceptance.

**Done and stop:** the narrow policy, independent expectations, unchanged current dependency graph, pending successor,
actual main checks and ordinary v0.2.x release are verified. Stop before runtime installation or transport edits in this
PR. Hand off to FASTIFY with the exact trusted base and bound transport identities.

## PR card 3 — FASTIFY: Migrate transport under the bound compatibility contract

**Outcome:** Fastify owns upload parsing/route execution while preserving the reviewed raw HTTP and browser contracts,
resource bounds, pure parser and two-image topology. A wrapper that merely forwards the unchanged native handler does
not establish this migration. Trace APP-V1-001–005,007–010,013,015 and transport-v1 TC-01–07.

**Prerequisites:** actual TRANSPORT-BIND and RUNTIME-POLICY main releases and their evidence; fresh main with the exact
single pending transport-v1 successor and no intervening product change. Verify the trusted resolver requires that suite
for this implementation. Revalidate the production pin/lock provenance and compatibility before installation. Prior
bounded research recommends Fastify 5.12.5; it is not an installed/tested version or a version-specific policy
exception.

### Ownership, writable paths and immutable boundaries

The product implementer owns `server/src/http.ts`, `server/src/index.ts`, narrowly needed transport modules under
`server/src/`, transport-focused `tests/unit/**`, the root Fastify declaration and resulting npm lock graph, and
necessary `server/Dockerfile` production-dependency packaging. Record the exact file set before editing. Root
coordinates only related architecture/testing/validation Markdown and existing canonical implemented Mermaid sources if
their displayed transport changes. Keep changes small and reuse existing paths.

Parser implementation/format semantics and its existing independent unit expectations, all `tests/acceptance/**`, the
bound transport contract, registry/genesis, root policy/governance scripts, `test:tooling` wiring, workflows, release
allocator/publisher, phase rules and generated `agents/**` remain read-only. Preserve frontend/UI/NGINX and Compose
topology/configuration. No new runtime dependency beyond the approved exact Fastify declaration; no docs/Redoc plugin,
multipart upload, API/health response expansion, database, storage, worker or cloud work.

### Independent expectations and implementation sequence

1. Inspect the actual bound suite and its independent fixture/inventory identities before code changes. Its external
   expectations already precede implementation and cannot be edited for a pass. Specify focused internal startup,
   admission, exactly-once release and shutdown expectations from that contract before implementing new control flow.
   Meaningful unit tests belong to product scope; new or relaxed external expectations require separate acceptance work.
2. Select a small internal asynchronous readiness/startup boundary so routes/parsers exist before listening. Preserve
   bootstrap-owned SIGTERM/SIGINT and idempotent shutdown. Record the selected internal interface and why it preserves
   existing use; the planning preflight intentionally did not freeze a particular method signature.
3. Remove framework eager JSON/text body handling for uploads. Use ordered admission before buffering and a bounded
   stream collector, enforcing actual bytes, idle/total deadlines, cancellation and one terminal release operation.
   Fastify's default limit or hook ordering alone is not evidence. Preserve two active uploads, existing
   connection/header bounds, 20 MiB actual-byte enforcement and no second whole-upload copy or retained/logged body.
4. Integrate Expect/continue exactly once with the framework request lifecycle. Invalid/busy requests must reject before
   Continue or body transmission; unsupported expectations retain readable 417. Preserve raw pathname/method/media
   precedence, case/encoding decisions, query behavior, explicit HEAD/Allow/empty-body semantics and closed JSON errors.
   Review any narrow raw-response bridge for timer/connection ownership and double-send prevention.
5. Keep successful upload execution in the Fastify content-parser/route path and call the unchanged pure parser.
   Preserve JSON content types and exact success/error/health objects. Do not expose framework default error schemas,
   automatic HEAD behavior or router normalization contrary to transport-v1.
6. Preserve stop-admission and the independent five-second forced-socket intent while awaiting framework shutdown. Avoid
   immediate forced destruction of active work or a framework closing response that bypasses the contract. Independently
   review raw-server settings, timer ownership, allocation/retention and shutdown configuration. Passing TC-07
   establishes bounded straggler closure/normal exit, not graceful admitted-response completion.
7. Package the exact production dependency graph in the API image, preserving non-root execution, resource/security
   settings and independently buildable frontend/API images. Verify pinned Node 24.20.0, TypeScript 7 compilation and
   actual linux/amd64 execution. Reassess measured memory headroom; do not silently widen existing resource budgets.

### Validation, independent review and failure signals

Run focused unit/type/build and dependency-policy checks first. Execute the unchanged bound transport-v1 suite through
the normal trusted controller against the final exact image pair, with complete inventory, zero skips/retries and
recorded cleanup. Current candidate expectations are 67 cases; use the actual bound inventory as authority. Retain any
failed runs. Rerun affected checks after fixes, then complete normal mandatory CI and renderer checks for changed
diagrams.

An independent reviewer checks changed transport/dependency/source/configuration behavior, especially pre-buffering
admission, actual-byte enforcement, bounded aggregate resources, safe errors, dependency contents and shutdown. Preserve
the explicit unresolved-drain disposition. Any future drain-pass claim requires a justified stopping boundary before
completing the held body, its exact complete response and normal exit; acknowledgment/reset/sleep is insufficient.

Missing/mixed admission, package-policy disagreement, unsupported pin/provenance, any mandatory successor failure,
changed frozen evidence, resource expansion, skipped lifecycle restoration or stale review blocks merge. A framework or
controller limitation requiring governance changes becomes a separate reviewed prerequisite; never repair the gate or
acceptance from the product PR. Companion approval must cover the exact final head after all fixes and diagram changes.

After owner merge, verify protected-main admission, persistent transport-v1 selection, full acceptance against the
actual source/image pair and normal v0.2.x publication. Preparation/publication must retain the original CI admission,
run/attempt and exact tested image evidence. Neither local success nor a PR artifact is the published release.

### Rollback, release effect and stop

Before merge, correct or discard the implementation without editing the bound successor. After activation, every
descendant and product revert still requires transport-v1. A reviewed revert may restore compatible native behavior and
dependencies only if it passes that same successor; no r3 selector, binding deletion, tag rewrite or asset replacement.
Preserve failed evidence and repair forward if a simple compatible revert is unavailable.

**Done and stop:** Fastify is implemented, independently reviewed, merged, verified under the persistently required
transport-v1 contract and published as v0.2.x with exact image evidence. Record any remaining operational proof limits.
No hosted deployment or semantic v1.0.0 is claimed. Stop before the separate docs/CSP successor and runtime docs routes.

## Provisional work after the three-card window

Later packages remain outcomes and decision gates: independent docs/CSP contract and binding; offline Redoc and scoped
CSP; hosted profiles/trusted launcher; exact-image registry handoff; reconciliation/backfill with retained original
admission authority; account/cost/access gates; stage acceptance; production candidate and recovery; human production
authorization; production smoke and v1.0.0 finalization. Tooling compatibility still precedes extended queue syntax.
Stage automation and production human intervention retain their existing authority boundaries. No later package is an
extra detailed card here, and none becomes an assessment-submission prerequisite.
