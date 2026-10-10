# Next iteration: phase instructions and three PR cards

**Execution status, 2026-10-10:** FASTIFY merged in PR #19 as `f4fb747df8890511edde7878064bb9af79823138`. Protected-main
run `38054409309` passed 82 unit tests and all 67 external transport cases and published **v0.2.19**. transport-v1 is
required, activated by this actual implementation; no candidate or binding remains pending. The
[completion record](../validation/fastify-transport.md#protected-main-completion) preserves exact review, source,
images, admission and release evidence, with verification limits.

The three active cards are **DOCS-HARNESS → DOCS-CONTRACT → DOCS-BIND**. A separate browser-preparation prerequisite is
needed before candidate browser controls: the current runner installs Chromium only after standalone `check` commands. A
warm local cache or the separate Mermaid browser cannot establish fresh-runner readiness. The
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
The completed Fastify card remains in the
[exact migration document](https://github.com/brobro10000/mp3-frame-counter/blob/f4fb747df8890511edde7878064bb9af79823138/docs/phases/next-iteration.md).
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

## PR card 1 — DOCS-HARNESS: Prepare the pinned browser before standalone acceptance checks

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

1. Keep trusted admission, exact Git extraction and candidate/required selection unchanged. Only parser/integration
   phases prepare browsers, after `runtimeAcceptance` validates the original context. For each selected extraction,
   execute `npm ci`, fixed browser preparation, then its existing complete `npm run check`. Apply this to candidate,
   pending and required selections, including after activation. Preserve historical pre-product phase behavior.
2. Invoke the extracted package's installed, locked `@playwright/test/cli.js` with the pinned Node executable and fixed
   arguments. On validated Linux CI only, run `install-deps chromium`; then run `install chromium` on supported CI/local
   hosts. Do not select a browser/version from caller flags, PATH utilities, environment download-host overrides,
   arbitrary URLs, global binaries or a presumed prepopulated cache. Do not introduce a second version allocator.
3. Use an explicit minimal environment for setup/readiness commands: necessary PATH/HOME/temp/locale/runtime values and
   validated CI state only. Do not pass GitHub tokens, admission files/digests, arbitrary Node injection or npm/browser
   configuration overrides. Construct PATH from the pinned Node directory and fixed system directories. The
   [helper contract](../testing/acceptance-browser-setup.md) fixes allowed keys and evidence; report no private paths.
4. Linux CI OS-package installation belongs to this visible governance runner. Local execution never invokes
   `install-deps`, apt or sudo; missing local OS prerequisites fail with an actionable, sanitized explanation. Do not
   hide privileged installation in candidate control scripts or install hooks.
5. Establish basic availability with a bounded fixed benign browser launch/close probe associated with that extraction,
   using no product URL or docs predicate. An empty/about:blank page is sufficient; accept no caller target, and perform
   no intentional network request from the probe. Preserve sandbox/security defaults unless an independently reviewed
   platform necessity is demonstrated. Successful download alone is not successful launch.
6. Use one shared 360-second preparation deadline across selections, with ceilings of 120 seconds for Linux
   dependencies, 180 seconds for acquisition and 20 seconds for the probe. Retain at most ten seconds of first-failure
   cleanup and the unchanged 30-minute job. The probe's 15-second normal-exit deadline leaves five seconds under its
   parent; adapt to remaining time or fail before spawning. Playwright launches detached browser processes: killing the
   Node group alone does not prove browser cleanup. Missing completed close or forced termination is unverified cleanup
   and failure.
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
delivery or production. The active window is DOCS-HARNESS, DOCS-CONTRACT and DOCS-BIND; later work remains provisional.

## PR card 2 — DOCS-CONTRACT: Independently define the documentation successor

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
publication, preserved transport acceptance and recorded limits. Hand off actual merge/review identities to the separate
DOCS-BIND card; do not append the binding in this candidate PR. Selected docs-tool policy, product build/assets/routes,
CSP activation and hosted work remain outside this card.

## PR card 3 — DOCS-BIND: Bind the actual independently reviewed docs successor

### Outcome and owner

The coordinator appends one actual `docs-v1` binding, with predecessor `transport-v1`, under the existing
single-successor policy. An independent reviewer verifies identity and admission; root owns Git, companion review and
authorized merge. The binding-only merge keeps transport-v1 required and reserves the next product-affecting change for
docs-v1. It adds no served documentation, renderer assets, tool allowance, CSP configuration or deployment. Trace
APP-V1-009,010,013 and APP-REL-001–006; docs behavior comes from the separately reviewed roadmap successor, not new
assessment obligations.

### Prerequisites

- Verified protected-main Fastify activation/publication: transport-v1 persistently required, complete bound inventory
  (currently 67 cases), exact source/image evidence and cleanup. Local or PR success is insufficient.
- Verified DOCS-HARNESS main publication and fresh Linux package-local browser readiness before standalone checks.
- Actual independent DOCS-CONTRACT squash merge and publication, with docs-v1 the sole pending candidate, predecessor
  transport-v1, unchanged earlier expectations and complete candidate controls/discovery. No second pending successor.
- Recorded DOCS-01 disposition from the candidate's isolated renderer/CSP experiments and independent security review.
  Renderer/CLI/template identities, effective-policy ownership and any authorized narrow exception must be resolved by
  that work; this card cannot choose them. Research versions, assumed nonce support or browser availability are not
  proof.
- Fresh trusted main, complete history and authenticated review observations. Reconcile any intervening source, review,
  candidate, policy or publication change before binding; do not reuse a planning revision as current evidence.

### Writable scope

Own only one append to `docs/testing/acceptance-transitions.json` and a narrowly scoped
`docs/validation/docs-binding.md` evidence record. Root may update current-status references in
`docs/testing/acceptance-transition.md` and `docs/phases/next-iteration.md` without rewriting dated evidence. Freeze the
exact changed-path set before editing; additional paths need explicit scope review.

### Read-only boundaries

Preserve genesis, the existing transport registry entry, all historical suite/contract objects, all
`tests/acceptance/**` and `docs/testing/contracts/**`. Product/parser/UI, Docker/NGINX/Compose, root package and
lockfile, policy/admission/runner scripts, workflows, release allocation/publication, generated artifacts and cloud
resources are read-only. No candidate repair, new tests, browser setup change, root tooling installation or product
activation here.

### Binding procedure and evidence

1. Inspect the candidate's actual protected-main squash commit and parent diff. The diff must contain only the admitted
   acceptance paths and unique docs contract; existing unchanged product files in its full tree are not disqualifying.
2. Verify the complete Git tree of the exact approved head equals the squash tree. Record the actual suite subtree,
   fixture-manifest SHA-256 and contract path/hash from that squash. Do not substitute the PR head for `suiteCommit`,
   predict a squash SHA, or copy transport's candidate identities into the new entry.
3. Authenticate the same-repository merged PR, squash, reviewed head/tree and actual submitted approval by a reviewer
   other than the author. Bounded complete review history must establish the recorded approval is still that reviewer's
   current decisive decision; later rejection, dismissal or replacement cannot silently reuse the old review ID.
4. Append the existing closed-schema fields only: actual suite commit/tree, manifest hash, contract revision/id,
   predecessor, contract path/hash and review repository/PR/review ID/reviewer/head/tree. Preserve the transport entry.
5. Use trusted-base admission with the original source/base/run/attempt. Expect binding admission, transport-v1 required
   and docs-v1 pending; no docs activation. Preserve actual observations and the independently supplied admission
   digest. A local resolver result or fabricated review object is not authenticated CI admission.

### Tests, review and publication

Run existing focused resolver/admission/review/consumer checks, formatting and required repository validation against
the final scoped source. Existing controls must reject missing/stale observations, wrong trees/identities, mixed product
paths and conflicting pending successors; do not change predicates to make this binding pass.

CI must retain separate pinned-browser candidate/pending checks, meaningful positive/negative controls and exact
complete candidate discovery. Record the actual discovered count and identities; invent no docs case quota. Execute the
complete required transport suite against the exact image pair with zero failures, skips or retries and passed cleanup.
Candidate controls or future docs behavior failures cannot satisfy required product acceptance.

Independent review checks the actual squash-parent scope, reviewed-tree equivalence, immutable predecessor, DOCS-01
record and selection across consumers. Obtain fresh companion approval of the final binding head, successful mandatory
checks and resolved conversations before an authorized owner merge; distinguish automated approval from human review.
After merge, verify actual protected-main admission, required/pending selection, original digest, CI attempt, full
required acceptance, tested image identities and allocator-selected v0.2.x release/tag/assets. Record hashes and
download limits; PR artifacts and a publication request alone do not establish publication. Preserve failures and
historical captures.

### Separate tool-policy and product work

The selected docs-tool allowance remains a separately scoped governance prerequisite wherever existing root policy would
reject it. This binding cannot add that allowance or imply it passed. Governance-only policy work must preserve
transport selection while docs-v1 is pending. Root dependency/lock changes, build inputs and generated/served assets are
product changes: after binding they trigger docs-v1 and cannot be introduced as a bypassing tooling-only preparation.
Resolve any unclassifiable prerequisite through separate trusted policy work before implementation. The later complete
docs product PR must pass docs-v1; activation persists for descendants and product reverts. No hosted or production
claim follows.

### Rollback and stop

Missing prerequisite evidence, unresolved DOCS-01, stale/mismatched review or trees, mixed paths, conflicting pending
successors, changed frozen bytes or any mandatory failure blocks binding; retain the failure and return to its owner.

Before merge, correct or withdraw this proposal without editing the merged candidate. After admission, do not remove or
rewrite the binding, mutate historical expectations, select an older suite or rewrite tags/assets. Cancellation or
correction needs a separately reviewed transition supported by policy; this card invents no cancellation mechanism.
After docs activation, a product revert must still satisfy docs-v1; preserve evidence and repair forward if needed.

**Done and stop:** the exact candidate is independently bound on protected main, unchanged transport acceptance passes,
docs-v1 remains pending, and the matching software release is verified. Stop before tool-policy implementation, renderer
build/install, docs routes/CSP/product activation, hosting or production. Execution begins only after actual prior
prerequisites are available; unresolved DOCS-01/tool-policy facts remain explicit gates, never assumed completion.

## Provisional work after the three-card window

Later packages remain outcomes and decision gates: selected documentation-tool policy; offline Redoc and scoped CSP;
closed IaC path policy and delivery-policy prerequisites; hosted profiles/trusted launcher; exact-image registry
handoff; reconciliation/backfill with retained original admission authority; account/cost/access gates; stage
acceptance; production candidate and recovery; human production authorization; production smoke and v1.0.0 finalization.
Tooling compatibility still precedes extended queue syntax. Stage automation and production human intervention retain
their existing authority boundaries. No later package is an extra detailed card here, and none becomes an
assessment-submission prerequisite.
