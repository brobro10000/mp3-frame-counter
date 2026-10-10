# Next iteration: phase instructions and three PR cards

**Execution status, 2026-10-10:** DOCS-CONTRACT merged in
[PR #21](https://github.com/brobro10000/mp3-frame-counter/pull/21) as `351d2e5b998f882287c4c5e4bb41427d4ad5c41e`.
Protected-main
[run 38068892955, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38068892955/attempts/1)
passed and published [v0.2.21](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.2.21), release
409075563, at 16:50:08Z. Main reported 46 candidate controls, exact 72-case discovery, 82 unit passes and all 67
required transport cases with scoped cleanup. Candidate controls/discovery are not docs product acceptance. Root
verified eight release metadata assets against GitHub digests; image archives were not downloaded/rehashed. No
deployment occurred.

At that published source, transport-v1 remains required; docs-v1 is the published candidate and no docs binding is yet
merged. **This change proposes DOCS-BIND; its review, merge and publication remain pending.** The
[binding evidence record](../validation/docs-binding.md) separates the actual candidate publication from binding work.
No application documentation routes, root Redoc dependency, product CSP or docs activation have shipped here.

The three active cards are **DOCS-BIND → DOCS-TOOL-POLICY → DOCS-IMPLEMENTATION**. Tool-policy expectation authoring and
implementation wait for actual binding publication; product work also waits for actual tool-policy publication.
[DOCS-HARNESS](../validation/acceptance-browser-setup.md) is complete. Current main records Linux browser preparation
before each candidate and required standalone check; readiness alone does not establish rendering or CSP behavior. The
[version record](../validation/release-lines.md#line-02-protected-main-activation--2026-10-10) preserves allocation;
[cost evidence](../validation/cloud-cost-bootstrap.md) preserves the dedicated USD 75 Run cap and USD 100 project
budget. Production deployment/promotion requires human intervention under the
[execution amendment](roadmap-execution-authorization.md).

The [docs-v1 contract](../testing/contracts/docs-v1.md) and
[independent DOCS-01 disposition](../../tests/acceptance/fixtures/docs/docs-01-disposition.md) record the selected Redoc
CE 2.5.4 arrangement and the coordinator's bounded engineering adoption. The current observation is load, actual
interaction and a retained 200 ms live-document interval, closed before classification. Destructive page hiding/teardown
remains unverified; this scope supersedes that historical planning clause without claiming it passed. The disposition is
automated review evidence under owner delegation, not a separate human selection of CSP exceptions or interval.

Use the [roadmap](../roadmap/README.md) and the [acceptance](../agents/acceptance-author.md),
[implementation](../agents/implementer.md), [review](../agents/reviewer.md) and [release](../agents/release-operator.md)
roles. Completed cards remain in immutable source:

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

## PR card 1 — DOCS-BIND: Bind the actual independently reviewed docs successor

**Status:** candidate publication is verified above; the binding proposed by this change is not merged or published.

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
- Actual independent DOCS-CONTRACT squash merge and publication, with docs-v1 the published candidate, predecessor
  transport-v1, unchanged earlier expectations and complete candidate controls/discovery. No second pending successor.
- Recorded DOCS-01 disposition from the candidate's isolated renderer/CSP experiments and independent security review.
  The [contract](../testing/contracts/docs-v1.md) and
  [disposition](../../tests/acceptance/fixtures/docs/docs-01-disposition.md) select Redoc CE 2.5.4 without a CLI, the
  exact two-edit derivative, docs-only style/image exceptions and NGINX header ownership. This binding changes none of
  those decisions or their finite observation limits; browser availability alone is not renderer/CSP evidence.
- Fresh trusted main, complete history and authenticated review observations. Reconcile any intervening source, review,
  candidate, policy or publication change before binding; do not reuse a planning revision as current evidence.

### Writable scope

Root owns one append to `docs/testing/acceptance-transitions.json`; the evidence writer owns only new
`docs/validation/docs-binding.md`. Exactly these ten additional files may receive targeted current-status
reconciliation: `docs/testing/acceptance-transition.md`, `docs/testing/independence-and-baseline.md`,
`docs/phases/next-iteration.md`, `AGENTS.md`, `docs/roadmap/README.md`, `docs/validation/acceptance-browser-setup.md`,
and the four roles `docs/agents/acceptance-author.md`, `docs/agents/implementer.md`, `docs/agents/reviewer.md`,
`docs/agents/release-operator.md`. The phase writer owns this document; root owns the remaining status paths. These
twelve paths are the entire binding scope. Preserve dated historical evidence; no diagrams or README expansion. An
independent reviewer audits the actual registry/source/review equivalence without editing the binding or suite.

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

The selected root development-only `redoc: "2.5.4"` allowance remains the separate DOCS-TOOL-POLICY prerequisite. This
binding cannot add that allowance or imply it passed. Governance-only policy work must preserve transport selection
while docs-v1 is pending. Root dependency/lock changes, build inputs and generated/served assets are product changes:
after binding they trigger docs-v1 and cannot be introduced as a bypassing tooling-only preparation. Resolve any
unclassifiable prerequisite through separate trusted policy work before implementation. The later complete docs product
PR must pass docs-v1; activation persists for descendants and product reverts. No hosted or production claim follows.

### Rollback and stop

Missing prerequisite evidence, unresolved DOCS-01, stale/mismatched review or trees, mixed paths, conflicting pending
successors, changed frozen bytes or any mandatory failure blocks binding; retain the failure and return to its owner.

Before merge, correct or withdraw this proposal without editing the merged candidate. After admission, do not remove or
rewrite the binding, mutate historical expectations, select an older suite or rewrite tags/assets. Cancellation or
correction needs a separately reviewed transition supported by policy; this card invents no cancellation mechanism.
After docs activation, a product revert must still satisfy docs-v1; preserve evidence and repair forward if needed.

**Done and stop:** the exact candidate is independently bound on protected main, unchanged transport acceptance passes,
docs-v1 remains pending, and the matching software release is verified. Stop before tool-policy implementation, renderer
build/install, docs routes/CSP/product activation, hosting or production. Actual binding publication closes this card
and permits independent tool-policy expectations; no future approval, merge or release is presumed.

## PR card 2 — DOCS-TOOL-POLICY: Admit the selected Redoc build dependency

**Status:** adopted for planning; execution and independent expectation authoring require actual DOCS-BIND publication.
The selected arrangement is root development-only `redoc` exactly `2.5.4`, with no CLI; it is not installed by this
card.

### Outcome and ownership

A separate governance change permits only the selected `redoc` build dependency. It preserves the existing seven
development tools, Fastify runtime admission and ordinary locked dependency constraints. Transport-v1 remains required
and docs-v1 remains the sole pending bound successor. No documentation dependency is installed or declared, and no
renderer, specification, asset, route, CSP or hosted capability is implemented by this PR. Trace APP-V1-009,010,013 and
APP-REL-001–006; documentation is the adopted roadmap extension, not a new assessment duty.

An independent policy-expectation author freezes meaningful decisions before a separate implementer changes policy. Root
coordinates scope, integration, Git, companion review and authorized merge; an independent reviewer checks the actual
selected tool arrangement and governance/product separation. Product and acceptance authors cannot relax gates.

### Publication prerequisites and selected inputs

- Verified Fastify and DOCS-HARNESS main publications, persistent transport-v1 selection, all 67 required external
  cases, exact tested images, fresh Linux browser preparation and recorded cleanup. Local or PR checks alone are
  insufficient.
- Actual independent DOCS-CONTRACT merge/publication with preserved prior oracles and an authorized DOCS-01 disposition:
  isolated artifact, effective-CSP, offline/reference, sensitivity and policy-ownership experiments with retained
  failures.
- Actual DOCS-BIND protected-main publication: authenticated approval, reviewed-tree/squash equivalence, exact candidate
  suite/manifest/contract identities, transport-v1 required and docs-v1 the single pending binding. No intervening
  product activation, additional candidate or changed frozen objects; reconcile any such change before starting this
  card.
- Refresh the selected arrangement against the actual published candidate and the
  [independent disposition](../../tests/acceptance/fixtures/docs/docs-01-disposition.md): embedded Redoc CE `2.5.4`, its
  bounded two-edit derivative and preserved originals/notices/provenance/branding. Do not infer a CLI correspondence.
- The selected pure interface and independent fixture decisions are recorded below. After publication prerequisites,
  freeze reviewed independent expectations and the exact writable file set before implementation. No acquisition or
  renderer experiment belongs here; the selected package/pin does not remain an unresolved research choice.

### Selected admission rule and helper boundary

Export `requireDocsToolPolicy(packageJson, packageLock)` for parsed metadata, returning `undefined` or throwing a
labeled assertion. No I/O, environment selection, input mutation, adapters, installation or renderer execution. Accept
ordinary/null-prototype records and npm-v3 lock metadata. Both root development declarations must either omit `redoc` or
declare exactly `2.5.4`; malformed maps, disagreement, coercion and alternate pin/source syntax fail closed. When
declared, require `packages["node_modules/redoc"]` with matching version, `dev: true`, no `link` field and
`devOptional`, `optional` and `peer` each absent or strictly false. Its resolved URL must be exactly
`https://registry.npmjs.org/redoc/-/redoc-2.5.4.tgz`; integrity must be one canonical SHA-512 token encoding 64 bytes.
Validate SRI syntax, not equality to an observed registry digest. Preserve coherent synthetic SRI fixtures; package-byte
and original/derivative artifact authentication belong to the later product build, not this metadata policy.

Preserve absent/empty legacy declarations. An undeclared top-level installed Redoc record must be ordinary and
explicitly development-only; existing generic rules retain transitive source/version treatment. Other shared transitive
packages may remain production-reachable through Fastify. Do not impose development-only status on the entire dependency
graph.

In `scripts/policy.mjs`, add only `redoc` to the existing seven-tool allowlist and call the helper unconditionally after
the unchanged runtime-policy validator. Preserve root declaration equality, workspaces prohibition, baseline tools,
exact-pin and generic lock checks. The caller still rejects `redoc-cli`, `@redocly/cli`, aliases and every other direct
development name. Existing runtime policy retains Fastify admission and alternate dependency-channel checks on both
roots. Redoc's transitive `@redocly/openapi-core` does not acquire direct-root admission. No generic-policy refactor.

### Proposed exact writable scope

- `scripts/policy.mjs`: only the development-tool allowance and its narrow validation integration.
- New `scripts/docs-tool-policy.mjs` and `scripts/docs-tool-policy.test.mjs`: a small pure parsed-metadata validator and
  independently authored deterministic tests, including real policy-CLI fixtures. Root freezes the interface first.
- `package.json`: only append the new test file to the existing `scripts.test:tooling` command, preserving prior tests.
- New `docs/testing/docs-tool-policy.md` and `docs/validation/docs-tool-policy.md`: frozen policy expectations and
  actual execution/review/publication evidence. Root may update only related current status in
  `docs/phases/next-iteration.md`.

These paths are proposed ownership, not permission to refactor adjacent checks. Any additional path needs explicit scope
review before work. Preserve dependency declarations, package metadata outside that one script, and all lockfile bytes.

### Read-only boundaries and admission

Keep `scripts/runtime-dependency-policy.mjs` and its tests, all other governance/admission/runner/release scripts,
workflow YAML, Node/npm pins, install-hook policy, root/acceptance dependency graphs and generated `agents/**`
unchanged. Preserve all `tests/acceptance/**`, contract/oracle/fixture/inventory bytes, genesis and immutable transition
entries. Product/parser/UI, Docker/NGINX/Compose, generated runtime assets, credentials, cloud/IaC and release assets
are read-only.

The current classifier makes root dependency fields and every root-lock change product inputs; build-only purpose does
not exempt them. Root executable `scripts/**` and unknown package commands are governance. Prefer later product build
helpers/specification inputs within the existing `server/` boundary using the existing product `build` command. This
card does not reclassify paths, add `build:docs`, or exempt executable assets under `docs/`. If the selected arrangement
needs a new path/command privilege, stop for a separately frozen trusted-policy prerequisite before using it.

### Independent expectations, implementation and checks

1. Commit reviewed independent expectations first. Freeze exact `redoc: "2.5.4"` declaration/installed agreement, npm-v3
   record shape, canonical URL, development flags and canonical SHA-512 syntax without fetching packages. Preserve all
   seven existing tools and Fastify rules; allow no arbitrary additional development or runtime package.
2. Establish positive fixtures for the unchanged released package shape and the reviewed docs-tool arrangement, with
   coherent package/lock records and necessary transitive entries. Build fixtures independently; do not copy evolving
   application dependencies into an incompatible synthetic lock. Include no-runtime/Fastify, legacy/transitive Redoc,
   shared-transitive and distinct valid synthetic-SRI positives. Availability/import guards precede rejection
   assertions.
3. Reject independently isolated wrong names, missing/mismatched pins or lock metadata, ranges/tags/aliases/local
   sources, malformed records and alternate root dependency channels. Include valid counterparts and assert intended
   failure attribution; one unrelated invalid field must not make a weak predicate appear effective. Synchronize
   wrong-version graphs so declaration mismatch alone cannot satisfy rejection. Preserve shared-transitive semantics and
   runtime scope.
4. Prove success and rejection do not mutate inputs. Exercise the real `scripts/policy.mjs` CLI in disposable fixtures
   with complete valid prerequisites, proving both admission and rejection through actual wiring. Reuse the existing
   runtime-policy CLI fixture pattern locally, without editing/importing its test module or creating a shared framework.
   Missing imports, tools or timed-out children are setup failures. No install, renderer, network or product-output
   oracle.
5. After the test-first commit and retained meaningful red evidence, implement only the frozen pure helper and narrow
   caller change, including mandatory inclusion of the new test in `test:tooling`. No environment-selected allowances,
   package-script hooks, blanket package prefixes or wildcard escape.
6. Run focused checks with pinned tools, then normal mandatory repository validation. Verify unchanged runtime-policy
   controls, authenticated governance admission, complete pending docs controls/discovery and all 67 required transport
   cases against the exact image pair, zero failures/skips/retries and successful cleanup. Keep setup, pending controls
   and required product acceptance distinct; record actual counts and identities rather than a proposed docs quota.

### Review, release evidence and failure conditions

Record trusted base, test-first and final source identities, expected-decision/red/green results, exact changed paths,
selected-tool provenance and unresolved limits. A policy pass checks declared metadata; it does not authenticate future
downloaded bytes, certify CSP, prove production-image exclusion, or establish documentation rendering.

Independent review checks narrow authority, source/version/channel rejection, complete positives and failure
attribution. Require fresh mandatory CI, resolved conversations and exact-head companion approval before an authorized
owner merge. After merge, verify actual main governance admission, transport required/docs pending selection, browser
preparation, complete required acceptance, exact source/images and allocator-selected v0.2.x publication. Do not
manually create or predict a tag, rewrite release bytes, or treat PR artifacts as publication. No deployment is
performed.

Missing DOCS-01/binding evidence, changed frozen inputs, mixed product paths, broader dependency authority, missing
tests, stale approvals, mandatory failure or an unclassified build prerequisite blocks progression and returns to its
owner.

### Rollback, done and stop

Before merge, correct or withdraw this proposal without changing the independent docs candidate or binding. A later
policy revert must remain separately reviewed and preserve whatever successor is required; after product adoption it
must not strand required builds or enable older-suite fallback. Preserve history and repair forward where necessary.

**Done and stop:** only the reviewed tooling allowance is merged and published with verified governance evidence;
transport-v1 still passes and docs-v1 remains pending. Hand off the actual policy identity and selected package/pin
disposition to the separate docs product card. Root package/lock changes, installation/build/assets/routes/CSP must then
pass docs-v1 and activate it persistently. Stop before that product work, registry delivery, hosting or production.

## PR card 3 — DOCS-IMPLEMENTATION: Serve the bound offline documentation

**Status:** adopted for planning; product work requires actual DOCS-BIND and DOCS-TOOL-POLICY publications. Root assigns
a product implementer and owns integration; the independent candidate author receives no product implementation details.

### Outcome and immutable authority

Serve the reviewed OpenAPI 3.0.3 specification and interactive Redoc CE 2.5.4 through the existing public NGINX origin,
with artifacts packaged in the API image and the exact docs-only CSP. Preserve the static upload UI, raw Fastify upload
contract, pure parser and two independent non-root images. Trace APP-V1-009,010,012,013,015 and APP-REL-001–006. The
[docs-v1 contract](../testing/contracts/docs-v1.md), complete suite/inventory/manifest, predecessor oracles and
registered identities are read-only. Its [disposition](../../tests/acceptance/fixtures/docs/docs-01-disposition.md)
records the finite live-document observation and unverified destructive-teardown boundary. Implement the contract rather
than changing it to fit the source. No hosting or production operation belongs to this card.

### Prerequisites to verify before product work

- Actual DOCS-CONTRACT squash/publication, independent DOCS-01 disposition, exact suite/manifest/contract identities and
  authenticated review evidence. Candidate/PR controls alone are insufficient; refresh facts after intervening changes.
- Actual DOCS-BIND protected-main publication and trusted registry selection: transport-v1 required, docs-v1 the single
  bound pending successor. No changed frozen object, second pending successor or unreviewed product activation.
- Actual DOCS-TOOL-POLICY publication admitting only root devDependency redoc exactly 2.5.4, with no CLI. Preserve the
  seven existing development tools, exact Fastify runtime pin, Node/npm pins, install-hook policy and lock constraints.
- Root reviews the following product-only writable list and the existing build-command admission. Any necessary wider
  permission returns to a separate trusted-policy prerequisite; never edit a classifier/gate to admit this
  implementation.

### Exact proposed product ownership

| Paths                                                                         | Bounded change                                                                                                                                                                 |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| package.json, package-lock.json                                               | Add only direct dev redoc 2.5.4 and its reviewed lock graph; extend existing build to compile then run the builtin generator. Preserve other scripts/pins and runtime Fastify. |
| server/src/build-docs.mjs                                                     | New builtin-only deterministic build helper; fixed package-local/input/output paths, no CLI, installed renderer execution, fetch or environment-selected source.               |
| server/src/docs/openapi.json                                                  | New product-owned OpenAPI 3.0.3 source conforming to the bound semantic contract; no runtime import from acceptance fixtures.                                                  |
| server/src/docs/index.html, server/src/docs/init.js, server/src/docs/docs.css | New document/template inputs, external initialization and fixed system-font styles.                                                                                            |
| server/src/docs/redoc-logo-mini.svg, server/src/docs/provenance.json          | Exact reviewed logo bytes and portable source/hash/license attribution; preserve original acquisition facts.                                                                   |
| server/src/docs.ts, server/src/http.ts                                        | Closed asset/spec routing and narrowly integrated raw-path/method dispatch; preserve upload behavior and lifecycle.                                                            |
| server/Dockerfile                                                             | Offline generation during the existing build stage, packaged outputs, unchanged production dependency separation and non-root runtime.                                         |
| frontend/nginx.conf.template                                                  | Explicit docs proxy locations and sole public header ownership, with bounded error handling and unchanged upload-page policy.                                                  |
| tests/unit/docs.test.ts, tests/unit/docs-build.test.ts                        | Meaningful route/resource and deterministic-transform failure tests; no duplicate generic framework.                                                                           |

The current root .dockerignore includes server/src/** only; placing the generator and inputs there uses the existing
Docker COPY boundary without expanding context or policy. Existing TypeScript output remains dist; generation writes its
bounded artifact set under dist/docs. The generator itself is not copied into dist or the runtime dependency graph.
Resolve the concrete asset-loading design before integration: existing HTTP unit tests import server/src/http.ts
directly, while the image runs compiled dist modules. Check actual build/unit ordering and choose a normal product asset
root that works for both source imports and compiled runtime. A dist-relative assumption can fail source-import tests.
Do not add a test-only bypass, substitute assets, silent missing-file fallback or changes to old tests; runtime
readiness must fail closed when required generated assets are missing. Return an unsupported ordering/path prerequisite
to root. Frontend Dockerfile, Compose, tsconfig, entrypoint, upload UI/parser/tests, root .dockerignore and all
scripts/** stay read-only. Root may separately own concise docs/validation/docs-implementation.md evidence and related
current-phase status at adoption; no broad documentation/diagram regeneration is proposed. Any additional path needs
scope review.

### Deterministic artifact generation

Use existing build as tsc -p tsconfig.json followed by node server/src/build-docs.mjs. Document helper purpose, inputs,
usage, outputs, side effects and failures. No extra build:docs command, root executable helper or runtime
compiler/service. Approved npm acquisition occurs separately with the exact lock and ignore-scripts; generation then
uses local bytes only.

Verify installed Redoc package identity 2.5.4 and original standalone bundle SHA-256
`dcaf76612bc4a3fbcc923a8966dee2f6146a5f32e5ce1b6f02dd60cbbf89500b`. Require exactly one occurrence of
https://cdn.redoc.ly/redoc/logo-mini.svg, replace only that occurrence with /docs/assets/redoc-logo-mini.svg, and remove
only the exact terminal source-map comment. Require the resulting SHA-256
`21ce5beb19818927f12e2db16e1a332e4f0eac5b8538012b6ecd048585b8cdbf`; no other vendor mutation or fallback. Verify the
539-byte logo hash `1dab4315f8de2177b2b2726b29e84a26314c69cd27d692228947c0058793d5a7`.

Retain the original bundle/map, package identity, license and embedded third-party notices with portable provenance in
accessible retained build artifacts; the finite public asset route map must not expose those additional files. Preserve
original map hash `2550d1c2e62c0640b2b4f4f49843433840fc291e001f3edb15ff66470e551476`. Never label that map as matching
the derivative. Preserve desktop-visible Redoc branding/link and the reviewed responsive sidebar behavior; no invented
SVG license grant. Read package files without evaluating them. Keep clean generation output byte-identical.

Generate openapi.yaml deterministically from the product JSON source; JSON syntax is valid YAML under the contract.
Validate the fixed same-document fragment references for containment and resolution without a general resolver or
external loader. No remote specification, font, CDN, worker, search service, telemetry or hidden failed-logo request.
Search is disabled, fonts are system fonts, and initialization is a same-origin external script. Fail on missing inputs,
unexpected edit counts, wrong hashes or unresolved/foreign references; a partial/stale output must not become usable.

### Offline-build verification gate

Recommend the actual API build stage use reviewed BuildKit RUN --network=none npm run build after locked acquisition.
Builder support and existing local/CI compatibility remain an execution prerequisite: confirm them before relying on
that mechanism. Record actual command/source/image/log evidence and successful generation inside the denied stage, with
a bounded inert denial control and working positive counterpart; a warm cache or absent failed fetch is not proof.
Compare two fresh generation output manifests, excluding no content through volatile timestamps. Inspect the runtime
image for generated artifacts, preserved notices/provenance and absence of Redoc/compiler development dependencies. If
compatible denial cannot be established, stop at DOCS-OFFLINE-BUILD and return the concrete prerequisite to root. Do not
transfer the earlier macOS experiment's isolation claim to Linux or silently require a different build framework.

### Public routing, policy and resource preservation

Extend only the docs namespace: /docs redirects 308 to exact relative /docs/; known docs resources support GET/HEAD with
the contract's exact media types, and openapi.yaml has its attachment disposition. HEAD has no body. Unknown contained
paths return readable 404 JSON before method handling; unsupported methods on known resources return 405 JSON with
Allow: GET, HEAD. Queries do not change resource identity. No filesystem traversal, HTML fallback or reflected request
bytes. Use an explicit finite route-to-file map; no runtime generation, package imports or arbitrary static directory.

The current raw dispatch rejects every path except health/upload, and its upload hooks treat non-GET as upload work.
Integrate docs before those upload decisions, with explicit docs handling that never reserves an upload slot or enters
binary collection. Preserve existing health/upload path → method → media/encoding → bounded body order, both raw media
types, inclusive 20971520 actual bytes, two active uploads, response shapes, bounded rejection drain, recovery, socket
budgets, cancellation and five-second shutdown. No retained uploads, body/temp-file logging or new parser dependency.

NGINX remains the sole public security-header owner. Proxy docs to the configurable private API upstream; explicitly
hide upstream CSP/report-only and other duplicated policy headers before setting the exact bound docs policy. Account
for location/add_header inheritance and redirects/errors, including NGINX-originated responses: exactly one enforced
CSP, no meta/report-only policy, no-store, nosniff and no-referrer across the docs namespace. Apply the exact two style
hashes, style-src-attr none, img-src self data and worker-src none only there; preserve every other bound directive
verbatim in meaning. No unsafe-inline/eval, nonce, foreign-origin allowance, ignored violation or upload-page policy
relaxation. Verify GET / retains its exact original policy. Actual two-container response evidence is mandatory; config
text alone cannot establish header inheritance. Preserve proxy streaming/no-store, unavailable/timeout JSON behavior and
health.

Keep the API private and NGINX as the sole published origin. Preserve Compose memory/CPU/PID limits, read-only
filesystems, capability drops and tmpfs budgets. Review bounded artifact reads/streaming and request cleanup within the
existing 256 MiB API/64 MiB frontend envelopes; docs must not introduce per-request unbounded allocation or persistent
storage. No frontend build dependency on API output, third service, database, credentials or infrastructure change.

### Validation, review and completion

1. Retain meaningful unit failures for wrong transform hashes/edit counts/references and route/error/HEAD behavior. Test
   resource interactions only where they expose a concrete regression; preserve existing HTTP/parser tests.
2. Run mandatory formatting/policy/tooling, type/build and unit checks with pinned tools. Build both images
   independently, verify real offline generation, and run the complete bound suite through NGINX using the unchanged
   trusted controller.
3. Root dependency/build/product changes activate docs-v1 under the existing policy. Confirm that actual selection and
   all original 67 transport identities remain included. Use the exact bound discovery/report accounting, currently 72
   cases; no zero/skip/retry/expected-failure or older-suite fallback. Setup and candidate controls are separate
   evidence.
4. Require desktop/narrow meaningful renderer interaction, exact served specification/assets/logo, no foreign attempts,
   enforced-CSP violations or page errors in the bound observation interval, unchanged root protection and owned
   cleanup. The finite interval does not prove destructive-navigation silence, arbitrary protocol blocking or hosted
   behavior.
5. Preserve failures and bind evidence to actual source, contract/suite/manifest, configuration and both tested image
   IDs. Independent review covers artifact provenance, public headers, build/runtime separation and resource/source
   limits. Root owns exact-head companion review, fresh required PR CI, resolved conversations and authorized protected
   merge.
6. Verify actual protected-main admission/activation, Linux browser preparation, complete acceptance, cleanup and
   software publication of those exact tested images. Retain archive/provenance identities; never rebuild a release
   after acceptance. The allocator chooses the actual v0.2.x value. No predicted SHA/tag, manual release, publication
   request or PR pass is publication proof. Record implemented/tested/reviewed/merged/published/deployed states
   separately; remain not deployed.

**Done and stop:** docs-v1 is persistently required, the contract passes locally and on protected main, and the exact
software release is verified. Preserve prior release bytes. Any revert must still satisfy docs-v1; repair forward rather
than deleting a binding, changing tests or relaxing CSP. Stop before registry/hosting/stage work, production promotion
or v1.0.0. Production remains an exact-candidate human gate. Unknown prerequisite, changed frozen inputs, unsupported
build isolation or a mandatory failure returns to its named owner with evidence; this card does not authorize a
workaround.

## Provisional work after the three-card window

Later packages remain outcomes and named gates: closed IaC path/delivery-policy prerequisites; hosted profiles and
trusted launcher; exact-image registry handoff; reconciliation/backfill with original admission authority;
account/cost/access gates; stage acceptance and recovery; production candidate/configuration evidence; human production
authorization; production smoke and v1.0.0 finalization. Tooling compatibility still precedes extended queue syntax.
Stage automation and production human intervention retain their existing authority boundaries. No later package is a
fourth detailed card or an assessment-submission prerequisite. Software publication is independent of deployment.
