# Next iteration: phase instructions and three PR cards

**Execution status, 2026-10-10:** RUNTIME-POLICY merged as `3e1851eaddb558f6c38eedc88334605212a7a153`. Protected-main
run `38050747378` published **v0.2.17** with unchanged r3 acceptance and transport-v1 still bound and pending. The
[runtime-policy completion](../validation/runtime-dependency-policy.md#protected-main-completion) records actual review,
approval, merge, main checks and publication. The dependency policy permits the planned exact Fastify pin; Fastify is
not installed in the published application.

The three active cards are **FASTIFY → DOCS-HARNESS → DOCS-CONTRACT**. Internal Fastify startup/ownership expectations
were committed before transport implementation; see the [migration record](../validation/fastify-transport.md). A
separate browser-preparation prerequisite is needed before candidate browser controls: the current runner installs
Chromium only after standalone `check` commands. A warm local cache or the separate Mermaid browser cannot establish
fresh-runner readiness. The
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
The completed runtime-policy card remains in the
[exact policy document](https://github.com/brobro10000/mp3-frame-counter/blob/3e1851eaddb558f6c38eedc88334605212a7a153/docs/phases/next-iteration.md).
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

## PR card 1 — FASTIFY: Migrate transport under the bound compatibility contract

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
No hosted deployment or semantic v1.0.0 is claimed. Stop before the separate DOCS-HARNESS prerequisite, docs/CSP
successor and runtime docs routes.

## PR card 2 — DOCS-HARNESS: Prepare the pinned browser before standalone acceptance checks

**Outcome:** the trusted phase runner prepares each extracted suite's pinned Chromium before its `check` command,
including candidate/pending and required-suite branches. Fresh Linux CI proves basic browser launch availability.
Candidate controls remain separate from product acceptance; no docs behavior or renderer/CSP design is implemented.

**Owner:** coordinator assigns an independent harness-expectation author before a separate governance implementer. Root
owns integration, exact-head companion review and Git operations. Neither role edits product or frozen acceptance.

### Prerequisites and exact base

- Refresh protected main, open work and actual source/run/release evidence when this card starts. Do not reuse a
  planning SHA or predict a release version.
- Fastify must already have a verified protected-main publication with transport-v1 persistently active, all 67 required
  external cases and exact tested images. RUNTIME-POLICY and TRANSPORT-BIND alone are insufficient.
- No pending docs candidate/binding. Read the transition guide, phase runner, browser lifecycle boundaries and adopted
  DOCS-CONTRACT requirements. Establish the actual selected suite's locked Playwright identity from trusted objects.
- Freeze the minimal helper/caller interface and independent decisions below before implementation. This is a separate
  governance prerequisite; do not combine its new runner privilege with candidate or application changes.

### Owned paths and read-only boundary

Own the narrow preparation integration in `scripts/run-ci-phase.mjs`; if needed, one documented
`scripts/acceptance-browser-setup.mjs` helper and focused `scripts/acceptance-browser-setup.test.mjs`. Extend existing
`scripts/acceptance-consumers.test.mjs` only for meaningful real-runner integration expectations. Root may add those
tests to `package.json`'s `test:tooling` command and record the harness contract/validation in targeted Markdown guides.
Keep any additional path need explicit and separately reviewed before editing.

Product/parser/UI/Docker/NGINX, `tests/acceptance/**`, all fixture/oracle/contracts/inventories, baseline/registry,
dependency declarations and lockfiles, workflow YAML, release/version/admission policy, generated evidence and cloud
resources are read-only. Preserve the existing root E2E lifecycle controller and its browser setup unless a concrete
unavoidable conflict is independently established; do not refactor it merely to remove repeated cached setup.

### Required implementation boundary

1. Keep trusted admission, exact Git extraction and candidate/required selection unchanged. For each selected
   extraction, execute `npm ci`, fixed browser preparation, then its existing complete `npm run check`. Apply this to
   the candidate/pending branch and the required branch; after activation, controls must not lose their setup.
2. Invoke the extracted package's installed, locked `@playwright/test/cli.js` with the pinned Node executable and fixed
   arguments. On validated Linux CI only, run `install-deps chromium`; then run `install chromium` on supported CI/local
   hosts. Do not select a browser/version from caller flags, PATH utilities, environment download-host overrides,
   arbitrary URLs, global binaries or a presumed prepopulated cache. Do not introduce a second version allocator.
3. Use an explicit minimal environment for setup/readiness commands: necessary PATH/HOME/temp/locale/runtime values and
   validated CI state only. Do not pass GitHub tokens, admission files/digests, arbitrary Node injection or npm/browser
   configuration overrides. Specify exact allowed keys in the reviewed helper contract; report no private paths.
4. Linux CI OS-package installation belongs to this visible governance runner. Local execution never invokes
   `install-deps`, apt or sudo; missing local OS prerequisites fail with an actionable, sanitized explanation. Do not
   hide privileged installation in candidate control scripts or install hooks.
5. Establish basic availability with a bounded fixed benign browser launch/close probe associated with that extraction,
   using no product URL or docs predicate. An empty/about:blank page is sufficient; accept no caller target, and perform
   no intentional network request from the probe. Preserve sandbox/security defaults unless an independently reviewed
   platform necessity is demonstrated. Successful download alone is not successful launch.
6. Bound dependency setup, browser acquisition and launch independently, propagate nonzero exit/signal/timeout, and
   clean up browser processes and temporary suite directories on every path. Use the existing 120-second Linux-deps and
   180-second browser-install limits as starting maxima plus a short launch limit; freeze aggregate behavior before
   implementation and measure fit inside the unchanged 30-minute product job. No silent deadline extension or skip.
7. Keep acquisition network separate from future offline fixture evaluation. Record actual selected suite identity,
   pinned package/browser metadata, commands, setup/readiness outcome, timings and cleanup without secrets. Candidate
   evidence remains `productAcceptance: false`; setup/readiness is not application acceptance or DOCS-01 evidence.
   Repeated cached setup in the later unchanged E2E controller is acceptable and must be described truthfully.

### Independent expectations before implementation

Use deterministic disposable source/extraction fixtures and bounded fake subprocess adapters; do not contact a package
registry, run apt, alter a real cache or launch a real browser in unit controls. Commit independently reviewed expected
decisions before implementing the helper or changing the runner.

- Require exact command order and fixed package-local paths for candidate, pending and required selections, including
  the later state where the same suite is required. The actual phase-runner integration must be exercised, not only an
  isolated helper. No candidate setup/check may become required product acceptance.
- Cover Linux CI versus local Linux/macOS behavior, locked identity/path validation, absent CLI/metadata, and rejection
  of arbitrary destination/version/cache assumptions. Verify the subprocess environment excludes sensitive/injection
  fields and local execution never performs OS installation.
- Prove failed install-deps, acquisition, launch, malformed result, timeout and signal stop later commands. Preserve
  failure attribution and cleanup for each failure point, including a candidate failure before required checks and
  successful readiness followed by a failing standalone `check`.
- Preserve exact extraction/admission behavior, full required command sequence and immutable inputs. Include a
  sensitivity control that would fail if setup moved after `check` or were omitted from either selection branch.

### Validation, review and failure signals

Run focused deterministic harness/consumer tests, affected policy/tooling checks and normal mandatory CI against the
final source. Obtain actual fresh Ubuntu CI evidence of package-local installation and the benign launch probe before
standalone checks; do not substitute a warm developer cache or the separate Mermaid job's Chrome. Retain failed runs and
actual setup logs, bounded timings, package/browser identity and cleanup. Existing 67-case required transport E2E must
still pass against the exact final images with unchanged inventories and zero skips/retries.

This card does not need a docs candidate to validate basic setup. Deterministic branch fixtures cover candidate/pending
ordering until a real candidate exists. Real missing-renderer, incompatible-CSP, foreign-attempt and wrong-spec controls
remain DOCS-CONTRACT work; do not author or freeze them here, or claim that launch availability proves them.

Independent review covers command authority, minimal environment, platform branching, process cleanup and evidence
separation. Companion approval must cover the actual final head. Any hidden privileged installation, skipped branch,
alternate browser/destination, weakened admission, changed frozen bytes, stale review or missing fresh Linux launch
evidence blocks completion. A required workflow/dependency/lifecycle change beyond this boundary returns to explicit
scope review; it must not be smuggled into a test fixture.

### Rollback, release effect and stop

Before the docs candidate depends on this capability, a reviewed governance revert may restore the prior runner while
keeping DOCS-HARNESS open. After docs acceptance depends on browser controls, recovery must preserve a usable required
harness; do not use rollback to skip controls or select an older contract. Preserve historical evidence and repair
forward when a simple revert would strand active acceptance.

An authorized merge produces only the allocator-selected normal v0.2.x software release. Verify protected-main CI,
unchanged required transport admission and exact-source publication; neither local readiness nor PR CI is publication.

**Done and stop:** reviewed harness support is merged, fresh Linux readiness and unchanged complete transport acceptance
are observed, and protected-main publication is verified. DOCS-CONTRACT may then begin its separate independent
candidate and DOCS-01 experiments. Stop before candidate authoring, docs binding/tool-policy/product routes/CSP, cloud
delivery or production. The next window is FASTIFY, DOCS-HARNESS and DOCS-CONTRACT; later work remains provisional.

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
- Verified DOCS-HARNESS publication with fresh Linux package-local browser launch before both candidate/pending and
  required-suite checks. Browser availability does not establish renderer/CSP or predicate sensitivity.
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
