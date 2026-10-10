# Next iteration: phase instructions and three PR cards

**Current state, 2026-10-10:** DOCS-IMPLEMENTATION is merged and published as
[v0.2.24](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.2.24). The exact main source is
`71e2cab6cdcac67675929563ed12db9d07ce227f`; docs-v1 is now required for descendants and reverts. This dated amendment
supersedes earlier pending-docs statements in the entrypoint/role guidance; those statements describe the preceding
work. No application service is deployed.

The three-card window retains completed **DOCS-IMPLEMENTATION**, current **HOSTED-PROFILE-POLICY** and next
**PROFILE-DECLARATIONS**. The hosted protocol has been independently reviewed; the coordinator adopts its five decisions
under the owner's roadmap authority. Its documentation PR still needs exact-head companion review, required CI, merge
and verified publication. Independent expectations for the next card may proceed in parallel under the amendment below;
dependent publication must follow the actual predecessor publication.

Software releases remain independent of deployment. The [cost evidence](../validation/cloud-cost-bootstrap.md) preserves
the USD 75 shared Run cap and USD 100 project alert budget. Every production application deployment, including
authenticated candidates, requires human intervention under the
[execution amendment](roadmap-execution-authorization.md).

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

## PR card 1 — DOCS-IMPLEMENTATION: Serve the bound offline documentation

**Status:** completed in PR #24/v0.2.24; see the protected-main completion above. The retained instructions below
describe the implemented scope and its safeguards. Read [implementation evidence](../validation/docs-implementation.md).

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

| Paths                                                                         | Bounded change                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| package.json, package-lock.json                                               | Add only direct dev redoc 2.5.4 and its reviewed lock graph; extend existing build to compile then run the builtin generator. Prefix test:unit with npm run build; preserve all other scripts/pins and runtime Fastify. |
| server/src/build-docs.mjs                                                     | New builtin-only deterministic build helper; fixed package-local/input/output paths, no CLI, installed renderer execution, fetch or environment-selected source.                                                        |
| server/src/docs/openapi.json                                                  | New product-owned OpenAPI 3.0.3 source conforming to the bound semantic contract; no runtime import from acceptance fixtures.                                                                                           |
| server/src/docs/index.html, server/src/docs/init.js, server/src/docs/docs.css | New document/template inputs, external initialization and fixed system-font styles.                                                                                                                                     |
| server/src/docs/redoc-logo-mini.svg, server/src/docs/provenance.json          | Exact reviewed logo bytes and portable source/hash/license attribution; preserve original acquisition facts.                                                                                                            |
| server/src/docs.ts, server/src/http.ts                                        | Closed asset/spec routing and narrowly integrated raw-path/method dispatch; preserve upload behavior and lifecycle.                                                                                                     |
| server/Dockerfile                                                             | Offline generation during the existing build stage, packaged outputs, unchanged production dependency separation and non-root runtime.                                                                                  |
| frontend/nginx.conf.template                                                  | Explicit docs proxy locations and sole public header ownership, with bounded error handling and unchanged upload-page policy.                                                                                           |
| tests/unit/docs.test.ts, tests/unit/docs-build.test.ts                        | Meaningful route/resource and deterministic-transform failure tests; no duplicate generic framework.                                                                                                                    |

The current root .dockerignore includes server/src/** only; placing the generator and inputs there uses the existing
Docker COPY boundary without expanding context or policy. Existing TypeScript output remains dist; generation writes its
bounded artifact set under dist/docs. The generator itself is not copied into dist or the runtime dependency graph. The
reviewed normal asset-loading design uses the same dist/docs output from source and compiled module layouts. Existing
phase ordering runs units before its standalone build, so root explicitly admits the narrow product-script change
`test:unit = npm run build && node --test tests/unit/*.test.ts`. Keep that phase order and all old tests unchanged; its
second build is acceptable deterministic work. Load real assets during asynchronous readiness before listening; missing
assets fail closed. No test-only bypass, substitute assets, environment selector or missing-file fallback. Frontend
Dockerfile, Compose, tsconfig, entrypoint, upload UI/parser/tests, root .dockerignore and all scripts/** stay read-only.
Root may separately own concise docs/validation/docs-implementation.md evidence and related current-phase status at
adoption; no broad documentation/diagram regeneration is proposed. Any additional path needs scope review.

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

## PR card 2 — HOSTED-PROFILE-POLICY: Settle the reviewed profile protocol

**Status:** documentation authoring and independent compatibility review started in parallel under the owner's later
instruction above. The draft began from reviewed PR #24 head `155caf019c4745732a39c19846886d6ae39e6e9b` and was
reconciled to its actual squash `71e2cab6cdcac67675929563ed12db9d07ce227f`, whose tree is identical. Main validation and
publication are now verified above. The five protocol decisions are adopted in the
[reviewed policy](../testing/hosted-profile-policy.md); its own publication remains pending. This card establishes the
protocol needed before executable profile support and independent hosted-suite authoring; it creates neither. Current
consumers require one complete inventory, and the future promotion reader assumes equal local and candidate counts. A
new metadata validator alone would not resolve those incompatible assumptions.

### Outcome, prerequisites and ownership

Publish one compact, independently reviewed protocol decision for local, stage and production profiles. Close the five
finite decisions below, name each consumer's responsibility and hand off exact executable scope to the next card. Trace
APP-V1-009,010,013–015 and APP-REL-001–006; hosted evidence remains additional roadmap scope, not a retrospective
assessment requirement. Ordinary software releases continue independently of deployment.

Verify DOCS-IMPLEMENTATION main activation/publication and its complete 72-case docs-v1 local gate before completing
this card for dependent publication. The owner's parallel-authoring amendment permits the bounded protocol draft and
review while that verification runs. Refresh exact source, required suite, image and publication evidence; local or PR
passes cannot satisfy the release prerequisite. Preserve actual binding/tool-policy evidence and all frozen
suite/contract/registry/genesis bytes.

An independent policy designer owns new `docs/testing/hosted-profile-policy.md`. A separate reviewer checks its
decisions and consumer compatibility before root adopts them. Root owns only related `docs/phases/next-iteration.md`
card/status updates and Git/review integration. These two documentation paths are the entire scope. All executables,
dependencies, workflows, product/configuration, infrastructure, acceptance suites/contracts, registry and historical
evidence are read-only. Do not put this planning document under the frozen successor `contracts/` namespace.

### Required decisions and recommended defaults

1. **Metadata schema:** select one fixed file inside a future independently reviewed successor tree; recommend
   `tests/acceptance/fixtures/profiles.json`. Define a closed, versioned JSON shape containing only
   local/stage/production profile IDs and requirement/case identity references. Reject unknown versions/fields,
   commands, URLs, credentials and arbitrary paths. Specify every field/type and omission rule. The existing suite-tree
   binding authenticates these future bytes; prefer no registry schema extension. Do not add the file or invent actual
   cases in the current suite.
2. **Inventory ownership:** recommend retaining `fixtures/inventory.json` as the complete local inventory, with separate
   exact complete hosted inventories in the successor. Decide their fixed locations and relationship, including how
   candidate discovery verifies every declared inventory without application execution. Preserve every predecessor local
   obligation; ordinary local execution remains unfiltered. Counts alone do not prove identity or completeness.
3. **Pure validation interface:** freeze exact export, parsed arguments, result and rejection boundaries after the two
   preceding decisions. Inputs include the reviewed metadata, complete inventories and selected contract revision;
   output validates declarations only. No environment, process, filesystem or network authority belongs to the helper.
   Define how its source-reading caller obtains bytes from the resolver-selected immutable suite, with no override path
   or substitution from product-owned metadata. This card writes the contract, not an unused helper.
4. **Consumer/evidence compatibility:** preserve legacy complete-local commands, reports, software preparation,
   publication and retry bytes. Missing profile metadata means existing full local behavior, never zero tests or hosted
   capability. Specify the first consumer that needs the new protocol and a separately versioned hosted report binding
   profile, complete inventory identity, suite/contract, source, image pair and target observations. Replace the future
   equal-count premise only in a later reviewed consumer change; do not relabel an existing local result as hosted.
5. **Requirement mapping:** assign local, stage-functional and non-destructive production-smoke responsibilities at the
   contract level without authoring cases. Docker pause/stop and private diagnostic controls stay local unless a
   separate safe nonproduction equivalent is approved. Full stage behavior and production smoke have distinct complete
   inventories; an unexecuted mandatory hosted requirement is not satisfied by local evidence. Name remaining hosted
   lifecycle observations for the independent successor author.

Independent review and root adoption must close all five decisions before this card is complete. The linked decision
record closes these defaults; changes require a transparent amendment and affected-consumer review. Resolve concrete
contract ambiguity here; do not defer the same ambiguity to a future helper author. If provider/authentication knowledge
is required, name that separate dependency and stop at its interface instead of expanding into a launcher or cloud
environment.

### Preserved authority and inspected consumer boundaries

Ordinary PR/main application acceptance always selects local. Candidate/pending controls and discovery remain
`productAcceptance: false`. Profile metadata describes obligations; it cannot authorize destinations, credentials,
faults, deployment or production. No environment variable, caller-selected profile or arbitrary URL grants that
permission. Keep the existing local Compose controller, exact-source/two-image evidence and immutable historical
publication/retry records intact.

Verify the design against these existing boundaries, using exact source identities from the card's refreshed base:

- `acceptance-transitions.mjs` already authenticates the whole suite tree; `acceptance-runtime.mjs` binds selection and
  admission without a hosted profile selector. No registry change is implied by adding reviewed metadata.
- `run-ci-phase.mjs` runs fixed candidate/pending checks separately from required application acceptance. `run-e2e.mjs`
  supplies a local target, owns Compose/fault infrastructure and requires the full unfiltered local result.
- Acceptance inventory/report helpers require complete identity accounting and zero skips/retries. The syntactic
  `candidate` target still requires private diagnostics/fault authorization and has no production mode; it is not a
  trusted authenticated hosted launcher.
- `release-manifest.mjs` uses local evidence for publication. Its future supplied-record promotion check requires equal
  local/candidate counts and observes neither deployment nor human approval; this is a concrete compatibility gap.

Stage and production execution remain unavailable to current consumers. Trusted destination/authentication, browser and
HTTP credential scoping, registry handoff, IaC path admission, delivery workflow permissions and hosted launcher
execution are separate later cards. Automatic stage delivery stays authorized; every production application deployment,
including an authenticated candidate, retains exact-candidate human intervention under LAUNCH-01. COST-01, ACCESS-01 and
HOST-01 retain their separate gates. No cloud resources or credentials are created by this card.

### Validation, review, release and stop

This documentation card has no implementation red/green claim. Check schema examples and decision tables against actual
consumer interfaces, ensure every field has one owner, preserve legacy behavior and report all unresolved facts. Run
normal scoped documentation validation, exact-head companion review, mandatory CI and authorized owner merge. Verify the
actual protected-main documentation release; do not predict a version or treat that publication as hosted capability.

The handoff identifies a bounded executable prerequisite only where current consumers need it. Its future independently
written tests must cover legacy compatibility, valid dormant metadata, malformed/unknown shapes, incomplete or duplicate
inventory references, source substitution and inability of a caller profile to weaken local execution. Review and freeze
those expectations, retain actual red, then implement in that later card. Hosted suite authoring and actual binding are
also separate; this paragraph authorizes none of those writes now.

**Done and stop:** the reviewed document resolves all five protocol decisions, preserves full local acceptance and names
exact next-card ownership. An unchosen inventory/report rule blocks completion. Stop before executable support,
successor authoring/binding, registry/IaC/workflows, provider operations or production. A documentation correction can
revert this proposal before dependent implementation; after adoption, amend the decision transparently and coordinate
consumers rather than reinterpret historical evidence or weaken a required suite.

## PR card 3 — PROFILE-DECLARATIONS: Validate immutable acceptance profile declarations

**Status:** next, with independent expectations permitted in parallel with the protocol PR. No implementation or test
result is claimed. The protocol must complete its actual protected-main publication before this dependent PR publishes.

### Outcome and prerequisites

Implement the adopted [hosted profile protocol](../testing/hosted-profile-policy.md) as a pure validator, an immutable
source reader and one real declaration-checking call in the existing CI phase controller. Current docs-v1 remains
required and all ordinary application acceptance stays full local. This adds no hosted cases, launcher or deployment.
Trace APP-V1-009,010,013–015 and APP-REL-001–006.

Pin the actual trusted base and verified DOCS-IMPLEMENTATION source/publication. Freeze independently reviewed expected
decisions before implementation. Reconcile work begun in parallel to the protocol's actual merged tree; any substantive
protocol revision pauses dependent work and requires new expected-decision review. Preserve failed evidence.

### Exact ownership and preserved inputs

Independent gate authors own `scripts/acceptance-profiles.test.mjs`, `scripts/acceptance-profile-source.test.mjs` and
only the synthetic r4 local-inventory addition in `scripts/acceptance-consumers.test.mjs`, preserving existing expected
outcomes. That non-genesis fixture must carry a complete inert inventory under the new declaration rule. A separate
implementer owns `scripts/acceptance-profiles.mjs` and `scripts/acceptance-profile-source.mjs`. Root owns the bounded
integration in `scripts/run-ci-phase.mjs` and only the two new explicit test entries in `package.json`'s `test:tooling`
command. These seven executable paths are the whole scope; root may update this phase document and append actual
validation in new `docs/validation/acceptance-profiles.md`. No other script, package field, lockfile, workflow, product,
container, infrastructure, generated record, acceptance suite, contract, registry entry or genesis byte changes. A
concrete additional path requires root scope review first.

Use the protocol's exact pure export, arguments, closed result, immutable copy and labeled rejection. The source reader
owns strict decoding and standard JSON parsing, fixed paths, exact Git blobs, suite/manifest/contract checks and
predecessor lineage through the authenticated registry digest. Preserve the narrow exact-genesis exception for its
historical missing inventory. Do not invent historical cases or introduce a custom JSON parser. The reader's export
signature is `readAcceptanceProfileSource(root, { selection, sourceRevision, baseRevision })`, returning the closed
`{ required, candidate, pending }` declaration-result map, with null for an absent role or exact genesis passthrough.
Validate every present role once before any suite extraction, install or standalone check. Options are closed and
required; no caller role/profile selector is allowed. Receive the unchanged `runtimeAcceptance` selection and original
source/base context. Replay its existing CI admission verification or local exact-source/base resolver for consistency;
this does not create new CI authority. Preserve source/base/run context and observed reviews. Reject forged/stale
selection, unknown options and missing context; source-reader failures have code `ERR_ACCEPTANCE_PROFILE_SOURCE`, while
the pure declaration helper's labeled TypeError propagates. Before registry introduction, authenticate exact genesis
through the already verified baseline plus immutable baseline/contract objects. Review these expected decisions before
writing tests; never substitute the source for its original trusted base.

### Test-first sequence and focused checks

1. Independently specify positive legacy inventory, exact historical genesis, complete dormant three-profile data,
   metadata order invariance, one case tracing multiple requirements and immutable fresh output. Parse fixtures as
   source-owned JSON. Include valid counterparts so a rejection cannot pass for an unrelated setup failure.
2. Cover every schema version/type/field/omission rule, duplicate tuples/requirement IDs, unequal exact sets, missing
   predecessor cases, incorrect revisions, malformed UTF-8/JSON, partial metadata presence and profile-lineage deletion.
   Inventory absence outside authenticated genesis must fail. Current inventory-bearing legacy suites remain accepted.
3. Use independent disposable Git-history fixtures for exact source/base and registry digest, candidate versus
   required/pending identity, full predecessor traversal, missing objects, symlinks, unsafe extraction/substitution,
   forged/stale selected identities and prior-profile downgrade. No real GitHub or application/network target is needed.
4. Verify the controller invokes declaration checks for all selected roles before standalone checks, retains original
   admission context and never makes hosted execution or a weaker local selection available via caller/environment. Keep
   controls, discovery and product acceptance distinct. Test real wiring through a bounded isolated fixture; do not make
   missing imports or timed-out children count as intended rejection.
5. Review and commit the independent expectations first. Retain meaningful red against missing implementation, then
   implement the exact boundary and the two mandatory test registrations without editing those frozen expectations.
6. Run focused tests, the existing acceptance consumer/controller regressions, then normal mandatory validation once
   against the final source. Required CI still runs all 72 local docs-v1 cases and unchanged unit behavior. New tooling
   counts must come from actual results. Neither valid declarations nor passing local acceptance proves hosted success.

### Review, release, rollback and stop

Independent review checks authority, path/lineage authenticity, exact inventories, genesis compatibility and controller
ordering. Root integrates the actual diff, fresh required checks, resolved conversations and exact-head companion
approval before the authorized owner merge. Verify actual protected-main governance admission, persistent docs-v1,
complete local acceptance, exact image pair and the allocator-selected normal release. No predicted tag, hosted report,
registry operation or publication retry is introduced.

A missing object, incomplete lineage, unknown declaration or controller integration failure blocks this card; never fall
back to an older suite or bypass validation. Before a profile-bearing successor exists, revert dormant support as one
coherent reviewed change. Once later suites depend on it, preserve readable evidence and repair forward.

**Done and stop:** required/candidate/pending declarations are validated from immutable selected bytes, historical
behavior and local reports remain unchanged, and actual main publication is verified. Stop before independently
authoring the hosted successor, changing discovery/reporting, binding it, implementing promotion/finalization readers,
launcher/registry/IaC/workflows or operating hosted targets. Expand those later packages only at their own gates.

## Provisional work after the three-card window

Later packages remain outcomes and named gates: independent hosted successor and actual binding; closed IaC
path/delivery-policy prerequisites; trusted hosted launcher; exact-image registry handoff; reconciliation/backfill with
original admission authority; account/cost/access gates; stage acceptance and recovery; production
candidate/configuration evidence; human production authorization; production smoke and v1.0.0 finalization. Tooling
compatibility still precedes extended queue syntax. Stage automation and production human intervention retain their
existing authority boundaries. No later package is a fourth detailed card or an assessment-submission prerequisite.
Software publication is independent of deployment.
