# Next iteration: phase instructions and three PR cards

**Execution status, 2026-10-10:** TRANSPORT-BIND merged as `5645b0501ca403750a2d894d6a492afa4b42185b`. Protected-main
run `38048679076` published **v0.2.16**, with r3 still required and transport-v1 registered as the single pending
successor. The [transport record](../validation/transport-binding.md#protected-main-binding-publication) records actual
binding, approval, main acceptance and publication, separately from the 67-case candidate diagnostic.

The three active cards are **RUNTIME-POLICY → FASTIFY → DOCS-CONTRACT**. RUNTIME-POLICY has independently corrected
test-first expectations and a locally passing implementation; required CI, companion review, merge and publication are
pending. A separate dependency-policy change is needed because current policy forbids all runtime dependencies and
admission rejects mixed governance/product changes. The
[version record](../validation/release-lines.md#line-02-protected-main-activation--2026-10-10) preserves verified line
allocation; the [cost evidence](../validation/cloud-cost-bootstrap.md) preserves the dedicated project's USD 75 Run cap
and USD 100 all-service alert budget. No application is deployed. Production application deployment/promotion requires
human intervention under the [execution amendment](roadmap-execution-authorization.md).

Use the [versioned roadmap](../roadmap/README.md) for dependencies and later release envelopes. Role boundaries remain
in the [acceptance](../agents/acceptance-author.md), [implementation](../agents/implementer.md),
[review](../agents/reviewer.md) and [release](../agents/release-operator.md) instructions. The retired lifecycle and
candidate cards remain in the
[exact pre-binding document](https://github.com/brobro10000/mp3-frame-counter/blob/6c28382d71a014351311e63154ef1c8916b8a229/docs/phases/next-iteration.md);
the completed binding card remains in the
[exact binding document](https://github.com/brobro10000/mp3-frame-counter/blob/5645b0501ca403750a2d894d6a492afa4b42185b/docs/phases/next-iteration.md).
This window does not rewrite their dated execution evidence.

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

## PR card 1 — RUNTIME-POLICY: Admit one explicitly pinned framework dependency

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

## PR card 2 — FASTIFY: Migrate transport under the bound compatibility contract

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

## PR card 3 — DOCS-CONTRACT: Independently define the documentation successor

**Outcome:** one candidate-only `docs-v1` contract and complete independent acceptance extension for `/docs/`, the
served OpenAPI specification, meaningful renderer interaction and effective CSP. Existing transport acceptance stays
required. Candidate authoring does not serve documentation, install production tooling or activate this successor.

**Owner:** independent acceptance author, separate from the Fastify/docs product implementer. The coordinator owns
scope, exact-source evidence and Git/companion operations; an independent security reviewer owns DOCS-01 disposition.
Give the author requirements, immutable contracts, independent fixtures and third-party renderer research, not product
implementation, application helpers or a product-derived oracle.

### Prerequisites and sequencing

- Verified protected-main Fastify publication after TRANSPORT-BIND and RUNTIME-POLICY, including actual activation of
  transport-v1, all 67 required external cases and the exact tested source/image pair. Do not start on a local/PR pass.
- Fresh trusted main, no other pending candidate/binding, unchanged genesis and transport contracts, and reviewed
  shutdown source/configuration disposition. Graceful admitted-response drain remains unresolved unless separately
  proved.
- Read the adopted roadmap, assessment/V1 requirements, transport-v1, acceptance-author/reviewer roles, transition guide
  and the preserved lifecycle disposition. Renderer/CSP research is a starting hypothesis, not implementation evidence.
- Resolve DOCS-01 through the isolated experiments below before freezing renderer/CSP expectations. No candidate
  contract may assume undocumented nonce behavior or represent a research version as empirically verified.

### Owned paths and read-only boundary

Tracked changes are limited to `tests/acceptance/**` and the new unique `docs/testing/contracts/docs-v1.md`. Own only
the necessary independent spec/fixtures, additive browser cases, exact inventory, shared predicates, falsification
controls, standalone runner/report integration and contract documentation. Preserve every prior 67 case identity and
assertion, existing fixture bytes/entries/counts/recipes, transport OpenAPI fixture and historical contract. Manifest
revision and appended inventory entries identify the new candidate; do not rewrite prior expectations.

Root package/dependencies/lock, product code, API routes, UI, Docker/NGINX configuration, CI/workflows, policy/release
scripts, infrastructure, registry/genesis and previous contracts are read-only. No root build command, renderer asset,
served specification or production dependency is added. Prefer existing standalone test tooling; justify any necessary
test-only dependency independently and keep its exact pin/lock confined to the acceptance package. No product imports,
private audio, credentials, Docker socket or arbitrary remote test target.

### DOCS-01: Isolated feasibility before expectations are frozen

Use a disposable, task-owned nonproduct scratch directory and an independently constructed small OpenAPI 3.0.3 fixture.
Record pins, acquisition provenance, tool/browser versions, commands, failures and cleanup. Any approved third-party
acquisition is separate from later network-denied generation and same-origin-only rendering. A prototype is neither
product implementation nor a claimed acceptance pass. Keep scratch dependencies/artifacts out of tracked root files.

1. **E1 — Artifact identity:** establish the exact stable renderer/template/CLI arrangement and embedded renderer
   version; inventory/hash generated scripts, styles, fonts, specification and initialization. A CLI's version is not
   its renderer identity. Prefer local assets, external initialization and system fonts; do not select floating
   channels.
2. **E2 — Effective CSP:** exercise initial rendering, a real client interaction and narrow viewport under a strict
   baseline. Inspect dynamic style elements, attributes/CSSOM behavior and violations. Prove fixed hashes or supported
   per-response nonce propagation before choosing either; a static nonce is prohibited. If a narrow docs-scoped style
   exception is necessary, record the exact directive, scope and consequence for independent security and
   owner-authorized design review. A successful prototype never preapproves that exception. No global relaxation,
   blanket unsafe-inline/ unsafe-eval, `bypassCSP` or ignored violations. Keep DOCS-01 open if the design lacks an
   authorized disposition.
3. **E3 — Offline operation:** deny generation network after acquisition and use a fresh browser cache. Resolve only
   approved local references; reject foreign/protocol-relative/data references and unsafe local traversal. Observe zero
   foreign asset/telemetry attempts during load, interaction and page hiding, including requests blocked before sending.
4. **E4 — Sensitivity:** run the missing-renderer, incompatible-CSP, foreign-attempt and wrong-spec controls below
   through the same proposed predicates, with positive counterparts. Preserve the actual intended failure reasons.
5. **E5 — Policy ownership:** freeze a documented API/NGINX response-policy ownership model using isolated header
   fixtures, including intersecting policies, redirects, assets and error paths. Product configuration is not inspected
   or changed by the author. Real two-container header inheritance remains a mandatory later implementation
   verification.

Any infeasible renderer/CSP arrangement returns to this named design gate before test expectations are committed. It
does not justify relaxing the existing upload page or dropping a failing proposed assertion.

### Independent acceptance and controls

Define additive requirements separately from assessment obligations. Preserve raw `POST /file-upload`, both accepted
media types, inclusive 20,971,520 actual bytes, exact positive-integer `{ frameCount }`, error/HEAD/health contracts,
all original fixture oracles and lifecycle limits. Require OpenAPI 3.0.3 semantics, local references and matching served
`GET /docs/openapi.yaml`; YAML transport/Content-Type and `/docs` redirect behavior must be explicit contract decisions.

At the same public origin, require meaningful rendered endpoint/request/response schema text at `GET /docs/` plus an
observable real search or schema-expansion state change. HTTP 200, SSR text, a successful click or URL fragment alone
cannot satisfy interaction. Compare the served specification semantically with the independently reviewed schema,
including media types, closed response shape, statuses/headers, byte-limit notes and HEAD's absent response body.

Install violation/page-error instrumentation before page scripts; use a fresh context with service workers blocked.
Observe complete effective headers/meta policies and relevant CSP/page failures. Guard network before transmission,
including redirects, while leaving allowed same-origin responses real. Require zero foreign attempts even if blocked by
the guard/CSP. Check `/` separately against its preserved policy, plus docs redirects/assets/missing routes; the docs
policy must not weaken upload-page protection. Never retain sensitive headers, uploaded bytes or private inputs.

Actual negative controls must remove/abort the renderer while keeping decorative text, impose incompatible CSP, inject a
foreign script/font/reference attempt, and mutate the served schema. The same assertions used for real docs must reject
each for its intended reason; positives must pass. If hashes/nonces are selected, add mismatched-hash/nonce controls and
the independently defined per-response nonce freshness check. Do not equate a blocked foreign load with compliance.

Preserve exact complete inventories, no filters/only/skips/retries/expected failures, fresh attributed reports, bounded
timeouts and finally cleanup. Discovery and control reports remain distinct from application execution. Any unavailable
browser/control capability under the existing candidate CI interface leaves DOCS-HARNESS open, not permission to modify
CI/root tooling here, silently skip controls or declare an unreachable docs route a useful behavioral red.

### Validation, review and failure signals

Run standalone type/spec/fixture checks, actual browser predicate controls and complete exact discovery with pinned
tools. Compare all previous identities/fixtures against trusted Git objects. Keep malformed, missing, duplicate,
skipped, retried and stale-attribution report controls. Use existing candidate interfaces and the complete 67-case
required transport suite for normal CI; future docs failures stay separate candidate evidence and cannot satisfy a gate.

Report exact source/base/suite tree/manifest/contract/inventory hashes, discovered count, executed case identities,
control outcomes, versions and limits. Local prototype or candidate execution is not CI admission or hosted acceptance.
Independent acceptance/security review must assess DOCS-01 and falsification sensitivity; the companion reviews the
exact complete PR head. Resolve findings and obtain fresh required checks/review before an authorized owner merge.

Mixed paths, changed prior oracles, unresolved CSP exception/nonce assumptions, unavailable mandatory control execution,
foreign attempts, decorative-only rendering, incomplete reports or stale approvals block this candidate. Do not change
the oracle or relax controls to make product output pass. Retain failed evidence and its actual attribution.

### Rollback, release effect and stop

An unmerged candidate can be corrected or withdrawn within its scope. After protected-main admission, retain historical
suite/contract objects; do not delete or mutate the pending candidate or immutable registry to undo it. Any cancellation
or correction requires a separately reviewed supported transition, not an implicit revert workaround.

A clean authorized merge may publish the next allocator-selected v0.2.x artifact release with transport-v1 still
required. Verify actual main admission, candidate identity, 67-case acceptance and publication; do not predict a
version, future squash SHA or approval ID. No docs deployment or production authority is implied.

**Done and stop:** reviewed candidate contract/harness and DOCS-01 disposition, verified actual candidate merge and
publication, preserved transport acceptance and recorded limits. Stop before the later separate actual binding, selected
docs-tool policy allowance, product build/assets/routes/CSP activation or hosted work. Those remain provisional
successors; none is an additional detailed card or implementation authorized by this drafting task.

## Provisional work after the three-card window

Later packages remain outcomes and decision gates: actual docs/CSP binding; selected documentation-tool policy; offline
Redoc and scoped CSP; closed IaC path policy and delivery-policy prerequisites; hosted profiles/trusted launcher;
exact-image registry handoff; reconciliation/backfill with retained original admission authority; account/cost/access
gates; stage acceptance; production candidate and recovery; human production authorization; production smoke and v1.0.0
finalization. Tooling compatibility still precedes extended queue syntax. Stage automation and production human
intervention retain their existing authority boundaries. No later package is an extra detailed card here, and none
becomes an assessment-submission prerequisite.
