# Versioned roadmap to verified production

**Current priority — 2026-10-11:** the owner has paused Cloud Run delivery to finish the local React/TypeScript MVP and
assessment handoff. The existing automatic software publisher remains active; stage delivery is disabled. Use the
[local handoff](../deployment/local-handoff.md) and
[dated delivery amendment](../deployment/v1-delivery.md#local-mvp-handoff-and-cloud-pause--2026-10-11). Production
v1.0.0 remains gated and deferred. The progression and observations below retain their dated historical scope.

**Later execution authority, 2026-10-10:** the owner authorized continued implementation, companion-reviewed merges and
automatic stage delivery. [The execution amendment](../phases/roadmap-execution-authorization.md) supersedes the
documentation-only restrictions below. Production deployment/promotion retains a human approval gate; the planning
snapshot and its verification claims remain historical.

Status, 2026-10-10: **HOSTED-BIND is published as
[v0.3.29](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.3.29)**. Docs-v1 remains required with all 72
local cases; hosted-v1 is bound and pending a genuine product change. Offline Redoc shipped in v0.2.24; the profile
protocol and immutable declaration reader shipped in v0.2.25 and v0.2.26. The independently authored hosted successor
and its binding merged and published after passing main CI. Candidate controls and binding do not establish hosting.

The next [three-card window](../phases/next-iteration.md) is **HOSTED-EVIDENCE**, **HOSTED-SOURCE-PROJECTION** and
**ACCESS-FOUNDATION**. HOSTED-BIND published in v0.3.29. The binding records actual reviewed merge identities; separate
dormant helpers validate hosted evidence and retain original required declaration bytes. The
[pure evidence validator](../deployment/hosted-evidence.md) has passed its local independent tests;
[PR/main verification](../validation/hosted-evidence.md) remains separate. The
[binding record](../validation/hosted-binding.md) separates prerequisite evidence from pending checks. Later launcher,
image transfer, federation, remote-state migration, runtime IaC and workflow changes remain provisional. The
[access-foundation contract](../deployment/cloud-access-foundation.md) separately bounds protected state, registry and
identity source plus its post-review operational checks. Merge approved PRs promptly, then immediately reconcile
dependents onto actual main and refresh checks/review. Disjoint agent lanes continue toward v1; every production
application deployment retains human intervention.

The [execution record](../validation/roadmap-execution.md),
[gate record](../validation/acceptance-transitions.md#protected-main-publication-and-retry) and
[version record](../validation/release-lines.md#protected-main-publication-and-retry) preserve earlier publication and
retry evidence. Line 0.3 is active. The [cost record](../validation/cloud-cost-bootstrap.md) records the dedicated
project's USD 75 Cloud Run cap and USD 100 all-service alert budget. No application service is deployed.

This roadmap preserves the working assessment submission, evolves the application through bounded v0.x releases, and
reserves **v1.0.0 for the first verified production deployment**. It is a human-readable planning amendment, not an
executable orchestrator plan or evidence that future capabilities exist.

Use the [three next PR cards and phase instructions](../phases/next-iteration.md) for bounded work. Responsibilities
remain in the existing [acceptance](../agents/acceptance-author.md), [implementation](../agents/implementer.md),
[review](../agents/reviewer.md) and [release/deployment](../agents/release-operator.md) roles. Start from
[central requirements](../requirements/README.md) and the [historical V1 closure](../validation/v1-closure.md).

## Execution update — 2026-10-10

PLAN-01 merged as `533ddca81153b189d9f53cfc7cc81f24b9421231` after exact-head automated companion approval. Main
[run 38031562926](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38031562926) passed all required jobs
and publication; [v0.1.8](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.1.8) has ten assets. Their
bytes were not independently downloaded or rehashed for this update. See the
[execution record](../validation/roadmap-execution.md) for exact head, review and timestamps.

The [cost bootstrap](../../infra/cloud/bootstrap/README.md) merged in PR #9 at
`a21108cf2982eb973fa9b4502007084bbd450d08`; main run
[38033869422](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38033869422) passed and published v0.1.9.
The reviewed saved Terraform plan created the project, APIs and alert budget; the separate cap was created once and
verified by recorded identity. The [validation record](../validation/cloud-cost-bootstrap.md) distinguishes readback
from untested notification delivery or enforcement timing. A later readback correction removes a default-field drift
without changing budget ownership.

GATE-01 merged in [PR #11](https://github.com/brobro10000/mp3-frame-counter/pull/11) as
`bb8f9fd3cae2c5663af9fa9f891472363bf0abcd` after a clean 41-file companion review and published automated approval.
[Main run 38038218010](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38038218010) published v0.1.11; a
publisher-only retry retained all assets and the original admission digest. The
[completion evidence](../validation/acceptance-transitions.md#protected-main-publication-and-retry) distinguishes eight
independently hashed metadata assets from metadata-only archive verification.

VER-01 merged in [PR #12](https://github.com/brobro10000/mp3-frame-counter/pull/12) as
`cc2d9c80e7b04edd56d3109a55c3ed2e638cbf2b` after exact-head companion approval. Main run `38041021204` published
v0.1.12; its publisher-only retry retained schema-2 policy binding, all ten assets and original admission. The
[completion record](../validation/release-lines.md#protected-main-publication-and-retry) preserves exact identities and
limits. LINE-02 merged as `48ecf8a5e93246c1c3c59de818ac0a5502c71223`; main run `38042465334` published v0.2.13 and
selected it as latest. This activates 0.2 without a product change. The
[shutdown diagnostic](../validation/lifecycle-controller.md) requires TR-LIFECYCLE before independent transport
authoring: existing forced-stop success does not establish graceful drain. No successor or application deployment is
active. The original assessment snapshot below remains historical and does not change with this progression.

### Transport progression amendment — 2026-10-10

TR-LIFECYCLE merged as `c4487bcbc969475e33f76f41995716e5c26d738c`; main run `38044909552` published v0.2.14.
TRANSPORT-CONTRACT merged as `6c28382d71a014351311e63154ef1c8916b8a229`; main run `38047498564` published v0.2.15.
[Actual completion evidence](../validation/transport-binding.md) supersedes the earlier next-step wording above. The
candidate preserves the original 60 cases and adds seven independently authored transport cases, with a local OpenAPI
3.0.3 contract fixture. This does not serve documentation or introduce Fastify.

Bind that actual candidate before the separate RUNTIME-POLICY governance PR, then implement Fastify as the next product
change. Current `scripts/policy.mjs` forbids every runtime dependency; combining its relaxation with Fastify would mix
governance and product. The narrow policy admits one exact stable Fastify pin and ordinary registry lock metadata while
preserving alternate-channel restrictions and the MP3-parser-package prohibition. The detailed card freezes expectations
before implementation; neither this roadmap nor the binding changes executable policy or dependencies.

Graceful admitted-response completion remains operationally unresolved. The candidate proves bounded unfinished-upload
closure and normal exit, and preserves a required fresh shutdown source/configuration review for the migration.

### Actual binding amendment — 2026-10-10

TRANSPORT-BIND merged as `5645b0501ca403750a2d894d6a492afa4b42185b`; main run `38048679076` published v0.2.16. The
[completion record](../validation/transport-binding.md#protected-main-binding-publication) verifies actual binding-only
admission, unchanged required r3, pending transport-v1 and no activation. The earlier instruction to bind the candidate
is complete. RUNTIME-POLICY precedes Fastify; the documentation/CSP candidate may begin only after the migrated
application has activated and passed transport-v1 on protected main.

Later prerequisites remain provisional: selected documentation-tool permission before adding renderer dependencies;
closed IaC path classes before cloud configuration changes; and a reviewed delivery-policy extension before automatic
stage jobs or human-triggered production operations. They do not expand the current runtime-policy scope.

### Runtime policy and browser prerequisite amendment — 2026-10-10

RUNTIME-POLICY merged as `3e1851eaddb558f6c38eedc88334605212a7a153`; main run `38050747378` published v0.2.17. The
[completion record](../validation/runtime-dependency-policy.md#protected-main-completion) preserves corrected
independent test-first evidence, exact-head automated approval and unchanged r3/pending transport selection. The earlier
runtime-policy prerequisite is complete. No framework installation or transport migration is established by that
release.

Read-only controller inspection identified DOCS-HARNESS before docs candidate authoring: candidate/pending and required
`npm run check` commands precede the current E2E browser installation. The separate Mermaid job uses another browser.
The selected default is a bounded governance prerequisite that prepares the extracted suite's pinned browser and proves
basic launch on fresh Linux CI before both check branches. This capability is proposed, not executed. It does not prove
Redoc rendering, CSP feasibility or the sensitivity of future browser predicates; those remain DOCS-01/DOCS-CONTRACT.

### Verified Fastify activation amendment — 2026-10-10

PR #19 merged as `f4fb747df8890511edde7878064bb9af79823138`; main run `38054409309`, attempt 1, published v0.2.19. The
[completion record](../validation/fastify-transport.md#protected-main-completion) supersedes earlier transport
prerequisite wording: the bound transport-v1 suite is active and required, and no successor is pending. Fastify 5.12.5
owns upload parsing and route execution while preserving the physical parser, public contract and two-image topology.
The original native-transport planning assessment below remains historical. Operational admitted-response drain is still
not proved by the bounded shutdown cases; docs/CSP and hosted verification remain separate prerequisites.

## Original planning assessment and evidence boundary

At the original planning inspection on **2026-10-10**, protected main was `92807357b6eb74f2915b9b05701889fd70d292c0`.
The inspected local HEAD was `b0766d0d3fb6bbc68204a4277b2f2f662ba3ca3f`; both have tree
`75ca67424947dadd83108fc733e3110ba2a98e10`. The checkout was clean before PLAN-01 authoring. No application tests were
rerun to construct this plan; CI observations below refer to existing runs.

| Area                  | Status                           | Evidence and implication                                                                                                                                                                     |
| --------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product               | Implemented                      | Pure TypeScript physical-frame parser, native Node HTTP API, static browser UI, bounded raw uploads, JSON errors and recovery.                                                               |
| Resources             | Implemented                      | Two active uploads, inclusive 20 MiB actual-byte limit, bounded connections, body/idle/header deadlines, abort cleanup and graceful shutdown. Preserve these during migration.               |
| Docker                | Implemented                      | Independently built non-root NGINX and API images. Compose exposes only the frontend; API communication stays private.                                                                       |
| Current CI            | Observed passing                 | Main run 38025736992, attempt 1, passed foundation, product, control-plane and publication jobs. Existing logs report 75 unit tests and 60 passing external cases.                           |
| Repository release    | Observed published               | v0.1.7, release ID 408661902, targets current main and contains ten assets. Published by github-actions[bot] at 2026-10-10T04:58:24Z. Archives were not downloaded or rehashed for planning. |
| Review/merge          | Observed                         | PR #7 merged; no open PRs at refresh. brobro1000 approved its exact head through the automated companion.                                                                                    |
| Controls              | Observed                         | Core rules prohibit bypass; a separate review ruleset retains the owner's PR-only exception. Normal work uses companion approval and required checks.                                        |
| Acceptance genesis    | Implemented; historical evidence | Contract r3 and the immutable commit/tree/manifest below precede the original product.                                                                                                       |
| Sample oracle         | Recorded evidence                | 6,090 physical frames versus MediaInfo's 6,089 audio frames, explained by a complete Xing-bearing frame. No new sample measurement is claimed.                                               |
| Acceptance succession | Blocked prerequisite             | Current verification and preparation reject changed suite bytes and post-product baselines. GATE-01 must precede successor tests.                                                            |
| Version allocation    | Implemented limitation           | Only 0.1 plus the global first-parent source ordinal is allocated. VER-01 must precede another minor line.                                                                                   |
| Extended queue        | Blocked technical option         | Prior Codex review reproduced actionlint 1.7.12 rejecting queue: max. The latest published release at inspection was still 1.7.12; no compatible upgrade was verified.                       |
| Fastify/OpenAPI/Redoc | Proposed                         | Target changes, not shipped capabilities.                                                                                                                                                    |
| Hosting               | Unverified                       | No verified stage, production, registry handoff, hosted acceptance or recovery exists.                                                                                                       |
| Older recommendations | Superseded for future planning   | Render remains an alternative; Cloud Run is the conditional lead. Historical V1 closure remains a release-only milestone, not deployed 1.0.0.                                                |

Observed GitHub evidence:
[main source](https://github.com/brobro10000/mp3-frame-counter/commit/92807357b6eb74f2915b9b05701889fd70d292c0),
[main CI](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38025736992),
[v0.1.7](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.1.7) and
[review 5477667669](https://github.com/brobro10000/mp3-frame-counter/pull/7#pullrequestreview-5477667669). The review
targets `b0766d0d3fb6bbc68204a4277b2f2f662ba3ca3f` and identifies itself as automated.

The unchanged [genesis record](../testing/baseline.json) binds:

- Suite commit: `a0a56d94e5457101cd043b6055ab084782c3e16f`.
- Suite tree: `b789ffe426f4d0a303144338923748c9cdf424cf`.
- Fixture manifest SHA-256: `2f56db4641f9e5c09b34c2bc0c630e85a46a010025c634375b110a35e2cb120a`.
- Contract: `r3`.

Preserve v0.1.6, source `ce50762b404e6b37ee10171fabd98db9aa06b265`, and its dated publication/retry evidence. PR #7 is
no longer an open predecessor. Older handoff wording that asks to merge it is historical and superseded for current work
by this observed state.

### Assessment submission is a separate track

Use v0.1.7 as the current reproducible submission snapshot. Fastify, cloud setup and this extended roadmap are not
assessment submission prerequisites. Preserve explainable TypeScript, repository/setup instructions, the supplied sample
reconciliation and disclosed format/resource limits. The receipt timestamp, deadline and external submission remain
unverified; do not derive them from Git history. Resolve assessment-critical defects separately from optional portfolio
growth. See APP-SUB-001, APP-SUB-002, APP-SUB-003 and APP-TIME-001 in the
[assessment requirements](../requirements/assessment.md).

## Architecture and interface decisions

| Boundary         | Selected direction                                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Parser           | Retain the pure synchronous TypeScript parser and reviewed r3 limitations. No parser package, decoding, duration estimate or sample-specific correction.               |
| Upload           | Preserve raw POST /file-upload, audio/mpeg and application/octet-stream, inclusive 20,971,520-byte limit and exactly one positive-integer frameCount field on success. |
| Errors/resources | Preserve r3 JSON errors, method/HEAD behavior, actual-byte enforcement, controlled proxy failures, admission before buffering, cancellation and shutdown.              |
| Transport        | Incrementally replace native HTTP with Fastify after independently bound transport-conformance tests. No parser rewrite.                                               |
| Specification    | OpenAPI 3.0.3 first; review the binary-upload specification before implementation. Rendering is not runtime conformance.                                               |
| Reference routes | Add GET /docs/, GET /docs/openapi.yaml and same-origin assets, packaged in the API image and proxied by NGINX. These routes do not exist yet.                          |
| Frontend         | Retain static HTML/minimal JavaScript through production V1.                                                                                                           |
| Packaging        | Two independently buildable images and one browser origin. Redoc adds build artifacts, not a runtime service.                                                          |
| State            | No database, accounts, retained uploads, object storage or background jobs.                                                                                            |
| Identity         | Preserve existing health/upload JSON; bind releases through image, configuration and trusted deployment evidence.                                                      |

Fastify defaults must be compared with current body limits, custom binary parsing, automatic HEAD behavior, content
types, 408/413/415/503 handling, precedence and lifecycle controls. Preserve supported physical-frame/tag semantics.
[Fastify content-type parsing](https://fastify.dev/docs/latest/Reference/ContentTypeParser/) supports the transport
direction; only independent conformance establishes compatibility.

The generated system specification remains the snapshot for the shipped architecture. This dated human-readable
amendment selects future direction without rewriting generated contracts or claiming their validators cover it. Native
HTTP and the no-framework boundary remain current implementation facts until separately scoped migration.

### Redoc and effective CSP

Adopt build-generated, entirely same-origin Redoc Community Edition assets. DOCS-CONTRACT precedes serving them:

- Pin the actual supported CLI/renderer versions, lockfile and local assets when the package enters detailed planning.
- Resolve specification references locally; disable external fonts, CDN assets, telemetry and remote references.
  Approved dependency acquisition may use a network; subsequent generation and deployed rendering use local inputs.
- Prefer a supported custom template, external initialization and exact fixed-content hashes where appropriate.
- Scope the effective policy to `/docs/` and its required redirects/assets. Preserve the upload page's CSP.
- Resolve DOCS-01 if dynamic styles require a per-response nonce or a narrowly reviewed style exception. No baked-in
  nonce, global relaxation, implicit unsafe-inline/unsafe-eval, CSP bypass or ignored violations.
- Assign one effective-policy owner across API/NGINX; verify duplicate policies and security-header inheritance.

Independent browser acceptance must prove meaningful endpoint/schema text and a client-side interaction, a correct
published specification, no relevant page/CSP errors, no attempted foreign asset requests, and unchanged `/` protection.
Capture policy violations before navigation; block outside-origin traffic and still require real rendering. Negative
controls remove the renderer, break CSP or inject an external dependency to prove detection. HTTP 200 or an SSR shell
alone is insufficient. Apply full checks locally and on stage; production smoke checks rendering and spec availability.

Primary references, inspected 2026-10-10: [Redocly build-docs](https://redocly.com/docs/cli/commands/build-docs) and
[NGINX header inheritance](https://nginx.org/en/docs/http/ngx_http_headers_module.html).

### Conditional Cloud Run topology and cost

Cloud Run is the lead subject to COST-01, ACCESS-01 and HOST-01. Use separate stage and production services, each
revision containing the compatible NGINX ingress container and API sidecar. NGINX listens on the configured ingress port
and forwards to `127.0.0.1:3000`; local Compose retains `api:3000`. Deploy tested `linux/amd64` images by digest. Use
startup probes for the actual pair and map resource/security settings explicitly; Compose settings do not automatically
transfer to a managed platform. No third documentation service or hosted Docker daemon is proposed.

The documented HTTP/1 request ceiling is 32 MiB, above the application's 20 MiB boundary. This is documented fit, not
observed ingress fidelity, JSON behavior or absence of provider buffering.
[Container contract](https://docs.cloud.google.com/run/docs/container-contract),
[quotas](https://docs.cloud.google.com/run/quotas).

Provisional defaults for authorized measurement: second-generation execution, request-based billing, one vCPU and 512
MiB per container, concurrency two, minimum instances zero, service/revision maximum instances one and startup CPU boost
disabled. Nominal active-pair capacity is two vCPUs and one GiB. Platform concurrency includes UI/docs requests and can
queue/reject before API admission; retain local overload evidence and characterize hosted behavior.
[CPU configuration](https://docs.cloud.google.com/run/docs/configuring/services/cpu),
[memory configuration](https://docs.cloud.google.com/run/docs/configuring/services/memory-limits).

Keep stage and prelaunch production authenticated. A tagged/no-traffic URL is not inherently private. After production
is public, ACCESS-01 must establish an approved candidate exposure/protection model before later automated promotions.
Service maximums do not fully bound tagged candidates; retain revision limits and budget old/new revision overlap.
Maximums may be exceeded briefly and do not cap spending.
[Traffic migration](https://docs.cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration),
[maximum instances](https://docs.cloud.google.com/run/docs/configuring/max-instances).

The cost target is allowance-covered operation, conditional on actual eligibility. Cloud Run requires a billing account;
ongoing allowances, expiring credits and a no-card/no-charge plan are different. Shared billing-account usage, registry
retention, both containers/environments, CI/browser minutes, egress, logs and cold starts belong in the estimate. The
later [execution amendment](../phases/roadmap-execution-authorization.md#monthly-cost-boundary) records billing
activation authority and the owner's USD 100 monthly budget: create the dedicated project, then verify a shared USD 75
Cloud Run spend cap and a USD 100 all-service alert budget before billable application resources. Reporting delay and
ancillary costs mean this is not a guaranteed USD 100 invoice ceiling. Preserve enforcement; never raise or lift the cap
automatically. Use no keep-alive traffic and retain live/prior-good/candidate artifacts needed for recovery.
[Free-tier eligibility](https://docs.cloud.google.com/free/docs/free-cloud-features),
[Cloud Run pricing](https://cloud.google.com/run/pricing),
[spend-cap limits](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps).

COST-BOOTSTRAP implements that prerequisite in [bounded IaC](../../infra/cloud/bootstrap/README.md), separately from the
application and acceptance migration. Terraform owns the dedicated project, APIs and USD 100 alert budget; the fixed USD
75 cap uses a narrowly scoped REST reconciler while pinned provider 8.6.0 lacks native cap support. Initial state stays
private/local until a reviewed backend migration. The reviewed apply and exact-identity cap readback are recorded in
[bootstrap validation](../validation/cloud-cost-bootstrap.md). Repeat the actual cap identity, scope, amount and
readiness check before adding billable application resources; the prior observation is not a standing readiness claim.

Retain the [historical paid Render proposal](../architecture/deployment.md) as an alternative. Vercel Functions'
documented 4.5 MB limit fails the unchanged upload path. A future Vercel frontend needs separately verified routing to
an external API; do not reduce uploads or insert a function-sized proxy. Supabase adds no necessary V1 component.
Available connectors do not establish current account authorization; earlier account observations remain dated.
[Vercel function limits](https://vercel.com/docs/functions/limitations).

## Version progression and dependencies

Release envelopes describe milestones, not promises that every release on a line contains every capability. Stable
work-package IDs survive version/date changes. Only the [next three cards](../phases/next-iteration.md) are detailed.

| Envelope            | Work and required exit                                                                                                                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Remaining v0.1.x    | PLAN-01, COST-BOOTSTRAP, GATE-01 and VER-01 are merged and verified. LINE-02 is verified and activates 0.2. Preserve product behavior and artifact releases.                                                                                                                                            |
| v0.2.x              | Approved line activation; TR-LIFECYCLE observations/disposition; independent OpenAPI/transport successor and merge binding; narrow runtime-dependency policy; Fastify; separate docs/CSP successor and binding; offline Redoc. Exit: unchanged upload contract and verified docs through local ingress. |
| v0.3.x              | Hosted profiles/trusted launcher, exact-image registry handoff, publication reconciliation/backfill and narrow release-audit maintenance. Exit: reproducible delivery inputs, not a deployment claim.                                                                                                   |
| v0.4.x              | Approved account/cost/access, scoped identities, stage/production definitions, actual stage deployment and acceptance.                                                                                                                                                                                  |
| Later v0.x          | Production-intended candidate, recovery rehearsal, finalization support and exact first-launch authorization.                                                                                                                                                                                           |
| v1.0.0              | Authorized first public launch, verified production identity and smoke; additive finalization of the same source/image pair.                                                                                                                                                                            |
| v1.x                | Compatible fixes, usability, maintenance and measured reliability/performance improvements.                                                                                                                                                                                                             |
| V2 capability track | Triggered richer UI, processing, service cadence or history/authentication needs. SemVer 2.0.0 requires a justified breaking public contract.                                                                                                                                                           |

Mandatory edges:

1. PLAN-01 → COST-BOOTSTRAP review/merge → reviewed private project/API/budget apply → verified live cap → billable
   application resources. This cost branch is independent of GATE-01 and introduces no application deployment.
2. PLAN-01 → GATE-01 → independent successor-suite PR → actual merged binding → corresponding implementation.
3. VER-01 → separate line activation → first actual v0.2.x publication → TR-LIFECYCLE capability and operational
   disposition → independent transport authoring. No graceful-drain pass is inferred from forced stop.
4. Actual transport binding → separate RUNTIME-POLICY governance migration → Fastify product migration.
5. Verified Fastify transport activation → DOCS-HARNESS browser preparation → DOCS-CONTRACT and independent browser
   acceptance → actual docs binding → Redoc serving/CSP activation.
6. QUEUE-TOOL → QUEUE-WORKFLOW, only after compatible validation is demonstrated.
7. Hosted contracts/launcher plus registry provenance and cost/access approval → stage setup/deployment.
8. Stage acceptance plus production-intended configuration verified in nonproduction and human approval → production
   application deployment; approved exposure follows actual production identity checks.
9. Production identity and smoke → v1.0.0 finalization.

Canonical planned diagram: [dependency order](diagrams/dependencies.mmd). These new planning diagrams are excluded from
automatic source-sync by the existing `.mermaidignore`; that does not exempt them from rendering validation. The three
implemented views remain canonical in [architecture diagrams](../architecture/diagrams/README.md).

### Acceptance succession

Use one pending successor at a time. Preserve genesis JSON and historical suite objects permanently. GATE-01 leaves all
current acceptance bytes unchanged. It changes future admission and every affected evidence consumer coherently.

| Step                  | Checks and publication                                                                                                                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gate transition       | Dormant compatible readers/admission; untouched r3 remains required.                                                                                                                                                                         |
| Candidate PR          | Independently reviewed test/contract-only changes. Active acceptance still tests the product; candidate discovery, oracle and negative controls pass separately. Future-behavior failures are candidate evidence, never released acceptance. |
| Binding PR            | Actual protected-main squash SHA, suite tree, fixture hash, predecessor and reviewed tree. Validate the actual parent diff as test/contract-only; existing product files do not invalidate succession.                                       |
| Implementation PR     | Binding reserves the next product-affecting change. Its successor is mandatory regardless of labels, caller arguments or release metadata.                                                                                                   |
| Merged implementation | Revalidate exact source/images; successor requirements persist for descendants, including docs changes and product reverts. Only passing required evidence supports a new contract claim.                                                    |

Introduce transport, docs and hosted successors separately. Candidate/binding-only merges may release unchanged behavior
under the old contract. Persistent applicability cannot be inferred only from the latest PR's changed paths. A shared
resolver supplies identities/applicability to CI, isolated extraction, E2E, preparation and publication; candidate
evidence cannot authorize its own promotion to required-product evidence.

Execute admission preflight from trusted-base code before head-owned tooling. Bootstrap only with the legacy r3 checks
and an empty transition registry; no successor can be admitted until the new preflight exists on trusted main. Policy
deletion after introduction cannot reopen that fallback. Workflow changes still depend on independent exact-head review
and GitHub controls; an internal preflight does not make a head-owned workflow tamper-proof.

Hosted requirement/profile mappings are reviewed contract data: local requirements gate PR/main CI, stage requirements
gate promotion and production smoke gates finalization. No arbitrary filters or URLs, and no local pass substituting for
an unexecuted hosted requirement. See [transition diagram](diagrams/acceptance-transition.mmd) and
[current freeze policy](../testing/independence-and-baseline.md).

### Source-bound version policy

The implemented preproduction rule is `0.<approved minor>.<global tested-source first-parent ordinal>`. For example,
ordinal 18 on line 0.2 becomes 0.2.18. Patch numbers do not reset. Preserve historical mappings without mutable counters
or an unknown future squash-SHA anchor. The root package version remains a separate tooling identity.

- VER-01 introduces policy on line 0.1. A later approved activation changes the line and can itself publish its first
  artifact release; a roadmap table never activates a version.
- Read policy from the exact tested source, not moving main or preparation HEAD. Bind policy digest, line and ordinal
  into new reservation evidence; all preparation, bundle, publication and retry readers agree.
- Preserve historical manifest/reservation bytes, notes and retries. Missing policy is valid only before migration;
  deletion after introduction fails. Reject downgrade, ambiguous overrides and ordinary 1.x/prerelease allocation.
- Compare numeric versions. Delayed jobs retain their source's line; older sources cannot replace newer releases as
  latest. Keep current protected-main/source and conflict checks.
- Finalization uses the same publisher in a distinct narrowly authorized mode after production evidence. Do not publish
  premature 1.0.0 or 1.0.0-rc, rebuild images, modify source to display a version or redeploy on metadata retries.

### Queue compatibility and reconciliation

Default: retain supported workflow syntax and plan bounded reconciliation/backfill. The prior cached-binary rejection
was **reproduced by Codex**, not reported by the owner and not rerun for this documentation task. Official latest
release metadata inspected on 2026-10-10 still identifies
[actionlint 1.7.12](https://github.com/rhysd/actionlint/releases/tag/v1.7.12).

QUEUE-TOOL must select a demonstrated compatible pin or a narrowly reviewed alternative, update required checksums/cache
handling, lint every introduced workflow and test valid/invalid queue values and forbidden cancellation. Do not silence
diagnostics or omit a workflow. QUEUE-WORKFLOW follows its merge and updates the publisher's exact workflow
expectations.

Record an auditable outcome for every eligible merged source. Reconcile missing/canceled publication before the current
seven-day handoff expiry, using original run/bundle evidence. If no identity was reserved, a complete original-source
rerun may create a coherent producing attempt. A reserved identity with unavailable original bytes is blocked recovery,
not permission to rebuild over it. Stage may deliberately coalesce superseded releases but must record them as untested
or not deployed, as applicable.

Extended queues allow up to 100 pending entries, reject cancel-in-progress: true and do not guarantee commit order. Keep
overflow reporting, reconciliation, original-attempt checks and latest protection after adoption.
[GitHub concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).

## Stage-to-production delivery

### Verification surfaces

| Profile               | Required evidence                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Local full            | Existing browser/HTTP behavior, independent counts, boundaries, controlled Docker faults, cleanup and exact image identity.                                                                |
| Stage functional      | Real HTTPS UI/API/docs; independent counts; media/errors; above 1 MiB, around 6 MiB, exact 20 MiB and over-limit uploads; approved non-Content-Length cases; CSP and environment identity. |
| Controlled resilience | Authorized nonproduction faults only. Docker pause/stop stays local where no safe hosted equivalent exists.                                                                                |
| Production smoke      | Active revision/digests, UI/docs/spec availability and a small known-count upload. No stress or outage injection.                                                                          |

Keep the local Compose controller local. A separate trusted hosted launcher resolves provider destinations, validates
environment/host/redirects before credentials, records target identity before/after tests and rejects PR-supplied URLs.
Profiles preserve requirement mappings and disclose managed-ingress limitations; missing mandatory evidence blocks its
gate. Never include private audio, sensitive headers or secret-bearing traces in artifacts.

### Ordered process

1. Scoped PR passes applicable acceptance and companion exact-head review. Merge only when separately authorized.
2. Validate actual merged source, build two images and run required local acceptance against that exact pair.
3. Publish the software artifact release through the existing writer with same-run provenance, independently of hosting.
4. Transfer tested image content to the registry without rebuilding. Distinguish archive hashes, Docker image IDs and
   OCI manifest digests; bind all three.
5. Deploy both digests as one stage revision; verify startup, configuration and environment identity.
6. Hold the stage target stable and run mandatory acceptance. Unexplained identity changes invalidate evidence.
7. Verify the same images with production-intended configuration in nonproduction. Record environment-specific
   differences, the intended access policy and recovery evidence without deploying the application to production.
8. Obtain human approval binding source, images, configuration, acceptance, production service, exposure and recovery
   policy. This gate precedes every production application deployment, including an authenticated candidate.
9. Deploy the approved pair to production, initially authenticated. Verify actual configuration and identity, then apply
   the human-approved access/traffic changes, verify convergence and run production smoke. Changed inputs invalidate
   approval and require a new human decision.
10. Finalize v1.0.0 additively on the same source/artifacts. Preserve candidate manifests and original not-deployed
    facts.

Use a dependent/reusable CI path consuming verified publisher output. Do not assume a GITHUB_TOKEN-created release
starts an independent release-event deployment workflow. Future finalization must explicitly extend the existing
publisher's trusted invocation boundary rather than forge an ordinary push context.
[GitHub triggers](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

Record source/software/contract, suite tree/fixture hash, image identities, nonsecret configuration, CI attempts,
review/approval identity, stage/production IDs, observations and prior-good release in compact artifacts. No database or
orchestration service is needed. See the [deployment diagram](diagrams/deployment.mmd).

### Recovery

- Incomplete registry upload: retry the same content; do not deploy an incomplete pair.
- Readiness or stage-test failure: retain the software release, block promotion and preserve failed candidate evidence.
- Stale production evidence: revalidate affected inputs before exposure.
- Runtime failure after exposure: restore the previous known-good revision; first launch instead withdraws exposure.
- Finalization-only failure: leave healthy production running and retry metadata without redeployment.
- Serialize promotion/rollback and verify resulting state. Retain live/prior-good/candidate digests and evidence.

Co-deployment binds both containers to one revision, but traffic updates are not instantaneous and old/new revisions can
overlap. Require compatibility and observed convergence. Do not cancel a partially applied operation or equate future
image rollback with data rollback. Rehearse recovery before first launch; a written runbook is not execution evidence.
The historical [Render runbook](../deployment/runbook.md) is not the selected Cloud Run pair-switch procedure.

## Provisional v1.x and V2 evolution

These tracks are independent of the assessment deadline and do not authorize scaffolding or infrastructure.

| Trigger                                  | Provisional response                                   | Required evidence before adoption                                                       |
| ---------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Compatible defects or usability issues   | Focused v1.x fixes and accessibility improvements      | Independent regression, unchanged public contract, release and recovery evidence.       |
| Real client-state/routing complexity     | React + TypeScript + Vite                              | Concrete UI need, measured benefit, accessibility/browser parity and rollback.          |
| Measured memory/event-loop pressure      | Tune budgets first, then evaluate streaming or workers | Agreed load/latency targets, independent parser/HTTP tests and resource measurements.   |
| Diverging traffic/release cadence        | Separate deployment units or releases                  | Compatibility matrix, ingress preservation, cost and rollout/recovery proof.            |
| Approved history or multi-user need      | Evaluate PostgreSQL/managed data or authentication     | Retention/access/deletion policy, independent tests, migrations and data recovery.      |
| Changed hosting economics or constraints | Reevaluate providers, including a Vercel frontend      | Full 20 MiB path, one-origin/routing decision, artifact identity and hosted acceptance. |

A V2 capability label does not force SemVer 2.0.0. Breaking wire behavior requires an explicit versioned contract;
compatible internal changes remain on v1.x. No speculative Kubernetes or generalized provider framework. The later
execution amendment requests infrastructure as code: plan narrowly scoped Terraform configuration for dedicated cloud
resources, protected state, reproducible setup and guarded teardown as part of hosted delivery.

## Decision gates and responsibility

| Gate          | Default and current boundary                                                                                                         | Owner / blocked work                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| POLICY-01     | PLAN-01 merged in PR #8; continued bounded implementation and clean reviewed merges are authorized by the execution amendment.       | Owner + coordinator; preserve card scope and prerequisites. |
| GATE-REVIEW   | GATE-01 verified; PR #24/v0.2.24 activated docs-v1 with 72 required local cases. No successor is yet bound.                          | Independent gate reviewer + owner; later transitions.       |
| VERSION-01    | Source-bound minor plus global ordinal implemented and verified; 0.2 activation and first publication verified.                      | Release reviewer + owner; line changes.                     |
| DOCS-01       | Redoc CE 2.5.4 and scoped CSP shipped in v0.2.24 under docs-v1; preserve its finite observation limits.                              | Acceptance author + security reviewer; future docs changes. |
| QUEUE-01      | Reconciliation/backfill first; no compatible extended-queue linter verified.                                                         | Release/tooling owner; QUEUE-WORKFLOW only.                 |
| COST-01       | Billing/IaC authorized; dedicated project, USD 75 Run cap and USD 100 alert budget verified. Recheck before billable app operations. | Owner + deployment operator; paid resources/hosting.        |
| ACCESS-01     | Dedicated resources, short-lived federation, environment identities and authenticated prelaunch access.                              | Owner + deployment operator; setup/exposure.                |
| HOST-01       | Prove real ingress, lifecycle, headroom, retention and configured controls.                                                          | Acceptance author + deployment operator; stage exit.        |
| LAUNCH-01     | Human approval before production application deployment, binding exact candidate, exposure and tested recovery.                      | Owner; production deployment and exposure.                  |
| SUBMISSION-01 | Preserve v0.1.7 handoff; confirm actual deadline/submission separately.                                                              | Owner; external assessment submission only.                 |

The coordinator owns scope/integration and serialized Git operations; independent acceptance authors own expectations;
the companion reviews; GitHub controls merge eligibility; the existing publisher owns tags/assets/finalization; the
deployment operator consumes verified artifacts. Keep these responsibilities separate without introducing another bot or
version writer. Reviewers identify automated review honestly. See the [role documents](../agents/reviewer.md).

The owner facilitates OAuth, MFA/passkeys/CAPTCHA, terms, billing consent, identity conflicts and each production
deployment/promotion. First public exposure must also be included in that exact-candidate approval. Use the owner's
GitHub or Google identity, never brobro1000 as cloud owner. No secrets in chat, URLs, logs or tracked files. Plan
supported connector/API/CLI setup as: verify identity/scope, obtain account/cost consent, select dedicated resources,
establish registry and least-privilege identities, configure stage, verify routing/limits, configure production without
accidental exposure, and verify bindings. Record resource IDs, ownership, cleanup and recovery so setup is
repeatable/idempotent. No unrelated project reuse or account-wide changes.

Prefer short-lived repository/branch/environment-bound federation; separate bootstrap administrator permissions from
routine deployment and PR jobs. Bootstrap administrator access is recorded in
[cost validation](../validation/cloud-cost-bootstrap.md); deployment federation and environment identities remain
unconfigured and unverified. If an enforced private-repository environment review gate is unavailable, explicitly use an
owner-invoked operation bound to the exact release and disclose that manual process limitation; do not label it an
enforced independent approval.
[Google deployment federation](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines).

## Requirement traceability and orchestrator boundary

| Work                               | Existing requirement trace                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| PLAN-01 and bounded progression    | APP-V1-008,011,016; APP-EVAL-007,008; APP-SUB-001–003.                                                                                           |
| COST-BOOTSTRAP                     | Hosted prerequisites for APP-V1-014,015 and APP-REL-001–006 under the later billing/IaC/monthly-budget amendment; no new assessment requirement. |
| GATE-01 and successor suites       | APP-V1-009,010,013; APP-EVAL-001,003,004; release evidence under APP-REL-001–006.                                                                |
| VER-01 and publication reliability | APP-V1-012,015; APP-REL-001–006, preserving the active release-only amendment.                                                                   |
| Fastify/OpenAPI/Redoc              | APP-V1-001–005,008,016 retained; framework/spec/docs additions are this later roadmap direction, not original assessment mandates.               |
| Hosted profiles and delivery       | Deferred APP-V1-014 and hosted APP-V1-015; hosted portions of APP-REL-001–006 resume only under scoped authority.                                |

The installed MVP Orchestrator 1.3.0 phase planner supports one validated bounded plan, not a native multi-release
roadmap. Its existing approved inputs do not describe the target architecture. Preserve generated `agents/**` plans,
specifications, fingerprints and outputs; do not fabricate approved inputs, completed phases or validation results. The
[ordinary-CI handoff](../../agents/README.md) remains applicable: npm, Docker and Playwright operate independently of
Codex and the private plugin, whose direct Python executor has a separate timeout/command boundary.

Future generated-plan migration requires its own bounded milestone, inspected installed contracts, exact input/output
scope, recoverable migration and direct validation. A blocked generated operation never blocks this Markdown roadmap.
Only human-readable documents and diagram sources were persisted by PLAN-01. It is now merged; the
[active three-card window](../phases/next-iteration.md) covers actual hosted binding and two dormant evidence/source
helpers. Fastify, offline Redoc/docs-v1 activation, the hosted-profile protocol and declaration reader are published. PR
#27 opened line 0.3; PR #28 merged the independent candidate. GATE-01 and VER-01 publication/retries remain verified;
each successor still requires independent authoring, actual merge binding and corresponding implementation evidence.
None of these milestones establishes application hosting.

## PLAN-01 local verification — 2026-10-10

This original authoring record is preserved. Its pending GitHub review/merge statements were later resolved by the
[PR #8 execution record](../validation/roadmap-execution.md); they are not current restrictions on authorized work.

The documentation handoff contains exactly three detailed next PR cards. Using the installed Node 24.20.0 runtime and
repository tools, all 16 tracked Mermaid diagrams rendered successfully; explicit-file validation also rendered the
three new roadmap diagrams. These diagrams describe planned behavior, not observed deployment.

The documentation check verified 148 local links and eight diagram metadata references, confined changes to the 17
authorized documentation files, and confirmed an unchanged Git index. Scoped formatting checks and `git diff --check`
passed. The new role sections were formatted separately because the repository formatter excludes `agents/` paths; their
historical prefixes were preserved. An independent local documentation review found no substantive issues.

No product tests were rerun, and no GitHub state, product code, workflows, infrastructure or frozen evidence changed.
Exact-PR companion review remains pending until a separately authorized PR exists. PLAN-01 stops here, before GATE-01
implementation, committing, publishing or deploying.
