# Next iteration: phase instructions and three PR cards

**Execution status, 2026-10-10:** PLAN-01 is merged in PR #8 and v0.1.8 is published; see the
[dated execution record](../validation/roadmap-execution.md), which preserves the original documentation-only scope. The
owner authorized [continued execution](roadmap-execution-authorization.md), companion-reviewed merges and automatic
stage delivery. Exactly three active cards remain below: COST-BOOTSTRAP, GATE-01 and VER-01. Production application
deployment/promotion requires human intervention; no deployed state is claimed.

Read the [versioned roadmap](../roadmap/README.md) for current-state evidence, architecture, dependency diagrams,
release envelopes, deployment and named decision gates. This document owns phase operation and exactly three detailed
next PR cards. Use the separate [acceptance](../agents/acceptance-author.md),
[implementation](../agents/implementer.md), [review](../agents/reviewer.md) and [release](../agents/release-operator.md)
role instructions for ownership boundaries.

Trace: APP-V1-009,010,011,013 for independent acceptance and delivery; APP-V1-012,015 and APP-REL-001–006 for exact
tested-image releases; APP-V1-014 and hosted APP-V1-015 remain future deployment work. New roadmap gate identifiers are
planning decisions, not replacement assessment requirements. The historical functional V1 closure remains intact;
semantic `v1.0.0` is reserved for verified production as defined by the roadmap.

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

## PR card 1 — COST-BOOTSTRAP: Codify the dedicated project and monthly controls

**Outcome:** reviewable IaC for one dedicated billed project, minimal APIs and a USD 100 all-service alert budget, plus
a separately owned USD 75 Cloud Run spend-cap manifest/reconciler. Stage and production share that cap. No application
service, registry, workload identity, cloud storage or deployment is introduced by this card.

**Base and prerequisites:** PLAN-01 is merged as `533ddca81153b189d9f53cfc7cc81f24b9421231`; refresh exact main before
integration. The owner authorized billing activation, IaC and the monthly cost boundary in the
[execution amendment](roadmap-execution-authorization.md#monthly-cost-boundary). Independent scratch review and
[local validation](../validation/cloud-cost-bootstrap.md) precede integration. This card follows PLAN-01 independently
of GATE-01; serialize shared workflow edits with gate work.

### Owned implementation scope

- `infra/cloud/bootstrap/`: Terraform 1.13.3, Google provider 8.6.0 and reviewed provider lockfile; private inputs and
  state exclusions; project/API/alert-budget declarations; outputs, cap template, reconciler, tests and operating guide.
- `package.json`: add deterministic cap tests to the existing tooling command.
- `.github/workflows/ci.yml`: pinned Terraform setup, formatting, backend-disabled lockfile-read-only initialization and
  provider validation in foundation CI. Preserve required job names and release permissions; grant no cloud credentials.
- `scripts/policy.mjs`: require the pinned validation-only workflow and cap-test inclusion; reject tracked Terraform
  caches, state, private inputs, saved plans and `*.private.json` identity records.
- Targeted roadmap/phase/deployment pointers and `docs/validation/cloud-cost-bootstrap.md` plus the
  [dated execution record](../validation/roadmap-execution.md).

**Read-only/non-goals:** product source, frozen acceptance and genesis evidence, parser/upload behavior, application
images, release allocation, historical releases, generated orchestrator artifacts, hosted test profiles and live cloud
state. No credential creation, live plan/apply, application provisioning or production operation in the PR itself.

### Required behavior and order

1. Require operator-selected private project/account inputs and verified USD billing currency. Pin Terraform/provider
   versions and retain the provider lockfile; never embed personal identities, secrets or host paths.
2. Terraform creates the dedicated project before API activation and its scoped alerts-only budget. Initial state is
   local, ignored and private until a later reviewed backend migration after cost-control verification.
3. Keep fixed USD 100 all-service monthly gross-cost alerts at 50/75/90/100% current spend and forecast 100%. Use
   default billing IAM email recipients and verify the owner receives them. Add no Pub/Sub/channel infrastructure merely
   to satisfy the provider schema.
4. The separate declarative REST reconciler owns exactly one USD 75/month Cloud Run cap for the dedicated project.
   Default checks are read-only. Explicit initial creation requires complete absence discovery, one POST and observed
   readback. Persist the exact cap resource identity privately after creation.
5. Reject missing recorded controls, ambiguity, incomplete discovery, changed scope/amount, unsafe destinations,
   permission failures, unknown/lifted/enforced state and unfinished reconciliation. Resolve uncertain creation through
   read-only discovery; never automatically repeat creation, lift/delete a cap or increase a limit.
6. Keep tokens in process memory, use the fixed Google API origin with redirect refusal, and sanitize errors. Future
   stage/production identities cannot administer cost controls. `prevent_destroy` and provider `PREVENT` safeguards make
   teardown a separate human-controlled operation.

The cap pauses new Run usage. Reporting lag, in-flight costs and ancillary services still allow overages; the USD 25
reserve and all-service alerts are not an enforced invoice ceiling. If cap support or permission is unavailable, stop
before billable application resources instead of silently substituting an alert budget.

### Validation and review

Run deterministic injected-adapter tests without cloud credentials, scoped formatting and portability checks, pinned
Terraform formatting and provider validation. CI initializes with `-backend=false -input=false -lockfile=readonly` and
performs no plan, apply, authentication or resource access. Preserve full mandatory product acceptance for the eventual
merge. Local source checks do not prove billing readiness, real API permissions, spend enforcement or a deployment.

Require independent critical-boundary review and exact-head companion review; fix supported findings and repeat review
for changed heads. The [validation record](../validation/cloud-cost-bootstrap.md) must distinguish earlier scratch
results, final integrated checks and actual CI results.

### Rollback, release effect and stop

Before apply, rollback is a source revert. A normal reviewed merge may publish another v0.1.x software release without
deployment. Live resources, if later created, require the documented guarded decommissioning procedure; ordinary
`terraform destroy` is intentionally blocked and a source revert must not remove live protection.

**Done:** bounded source merged after current companion approval and required checks. **Stop before live apply.** The
coordinator can then perform the already-authorized, separately reviewed private plan for project/API/cost controls,
verify actual billing and cap readiness, and record that evidence before any billable application resource. Later
registry, backend, IAM, stage and production work remains outside this card; every production app deployment needs a
human decision.

## PR card 2 — GATE-01: Admit independently reviewed successor suites

**Outcome:** backward-compatible acceptance transition support, dormant on merge, with r3 still active.

**Prerequisites:** PLAN-01 adopted; independent gate-design and expected-decision review; explicit authority for this
trust-policy change. Record the exact trusted base before implementation. Continued execution is authorized, but this
card is not completed by roadmap adoption or cost-control work.

### Owned implementation scope

- Acceptance selection/extraction: `scripts/acceptance-baseline.mjs`, `scripts/run-ci-phase.mjs`, `scripts/run-e2e.mjs`.
- Evidence consumers: `scripts/prepare-release.mjs`, `scripts/release-manifest.mjs`,
  `scripts/publish-release-evidence.mjs`.
- Trusted preflight wiring: `.github/workflows/ci.yml`, `scripts/policy.mjs`.
- Existing focused tooling tests: `scripts/acceptance-baseline.test.mjs`, `scripts/release-preparation.test.mjs`,
  `scripts/publish-release.test.mjs`; directly affected phase-policy tests where necessary.
- New `docs/testing/acceptance-transitions.json` and `docs/testing/acceptance-transition.md`; narrow independence and
  acceptance-role documentation updates.

**Read-only:** `tests/acceptance/**`, genesis `docs/testing/baseline.json`, original r3 contract/evidence, product code,
version allocation, queue syntax, phase monotonicity, mandatory job set and the E2E lifecycle controller. Review the
whole compatibility boundary together; do not leave CI and publisher interpreting different suite identities.

### Required transition behavior

Use the roadmap's **single pending successor** process. The genesis freeze remains immutable; a separate transition
registry records successor identity, predecessor and applicability. Resolve authority from exact source/base Git objects
and independently reviewed merge evidence, not caller-selected labels or a mutable branch tip.

1. Add dormant support and compatible readers without modifying r3 source or expectation bytes.
2. A later candidate suite PR admits only the closed test/contract path class. Existing active acceptance still gates
   the application; candidate discovery, oracle and negative controls remain a distinct evidence role. Visible
   future-behavior failures cannot masquerade as product acceptance.
3. A separate binding PR records the actual protected-main squash commit, suite tree, manifest hash, predecessor and
   reviewed tree. Check the merged parent diff is test/contract-only; a successor can exist after product code exists.
4. Binding reserves the next product-affecting change. That implementation must pass the successor; no old-suite
   selection through a label, argument or release-metadata edit. Allow only one pending successor.
5. After actual implementation merge, revalidate source/image identity and require the successor on all descendants,
   including documentation changes and product reverts. Applicability cannot reset on each PR's changed paths.

Candidate and binding-only merges can release unchanged behavior under the previous contract. Introduce transport, docs
and hosted successors separately. Reviewed hosted profile mappings distinguish local PR/main acceptance, stage promotion
acceptance and production-finalization smoke; unexecuted hosted requirements cannot become local passes.

Treat runtime, build and transport configuration changes as product-affecting. Unknown paths fail closed; documentation
exemptions must not hide executable changes. Reject mixed implementation/policy/test admissions. One shared resolver
must supply identity and applicability to CI, isolated extraction, E2E reporting, preparation and publication.

### Trusted-base bootstrap

Execute admission preflight from trusted-base code before head-owned tooling. Bootstrap the first transition merge
through existing r3 verification with an **empty transition registry**. Keep successor admission disabled until the new
preflight exists on the trusted base. After policy introduction, missing/deleted policy cannot reopen the legacy
fallback. Preserve required job names, phase monotonicity and release permissions.

Internal preflight does not make a replaced workflow tamper-proof. Workflow/governance changes require independent
exact-head review and existing GitHub controls as well as automated checks.

### Independent tests before implementation

An independent author specifies temporary Git-history fixture expectations before gate implementation.

Positive cases:

- Historical r3 replay and unchanged retries retain their existing identities and semantics.
- Candidate controls work in a repository that already contains product code.
- Binding uses the actual reviewed squash result; binding-only publication retains the old contract.
- The first applicable implementation and every descendant require the successor.
- CI, preparation and publication resolve the same identity/applicability and distinguish candidate evidence.

Negative cases:

- Unauthorized suite/manifest edits, mixed product/test proposals, invented or nonancestor SHAs and stale reviews.
- A second pending successor, unsafe extraction paths, policy downgrade and deleted-policy fallback.
- Old-suite selection, candidate evidence reported as application acceptance, skipped or missing mandatory tests.
- Stale source/image/run evidence and documentation exceptions that conceal product-affecting changes.

Run focused tooling tests first, then affected workflow/policy checks and the unchanged full r3 product acceptance. All
evidence consumers must agree before merge; no half-migrated publisher is acceptable.

### Review, rollback, release effect and stop

Require an independent acceptance/gate reviewer plus exact-head companion review. Product implementers cannot author
their own expected gate decisions or approve a weakening exception. Record policy authority separately from review.

This remains v0.1.x and adds no product capability. Before any successor binding, revert dormant support coherently if
needed. After activation, recovery must preserve readable evidence and a coherent policy across all consumers.

**Done:** transition support merged and actual post-merge checks establish readiness for a future independent successor
PR. **Stop before** adding successor tests or activating a new contract. Use the execution amendment's review/merge
path; its authority does not waive independent expectations or any required check.

## PR card 3 — VER-01: Support source-bound release lines

**Outcome:** deterministic allocation beyond v0.1 that preserves historical identities and immutable retries.

**Prerequisites:** PLAN-01's version policy adopted; GATE-01 updates to shared evidence readers completed and verified;
fresh trusted main. Keep this sequential after GATE-01 to avoid concurrent incompatible edits to release consumers.

### Owned implementation scope

- New root `release-policy.json`, initially selecting line `0.1` and the global first-parent-ordinal strategy.
- `scripts/release-manifest.mjs`, `scripts/prepare-release.mjs`, `scripts/publish-release-bundle.mjs`,
  `scripts/publish-release-evidence.mjs`.
- Existing `scripts/release-preparation.test.mjs` and `scripts/publish-release.test.mjs`.
- Narrow current-policy sections in release requirements, preparation and release-only documentation.

Keep the publisher entrypoint unchanged unless a necessary allocator-interface change requires it.

**Read-only/non-goals:** package version, product, acceptance source, historical release assets, workflow triggers,
queue syntax, cloud resources and deployment-finalization implementation. Do not rewrite tags or perform live
publication tests. Keep this implementation separate from the cost-bootstrap and acceptance-migration cards.

### Required allocation behavior

Retain one writer and allocate **`0.<approved minor>.<global tested-source first-parent ordinal>`**. Ordinal 18 on line
`0.2` therefore produces `0.2.18`; patch values do not reset. The policy comes from the exact tested source, never
moving main or the release-preparation checkout's HEAD.

- Make preparation, bundle naming, reservation validation, publication and latest-version selection use the same
  authority. Bind policy digest, selected line and ordinal into new reservation evidence.
- Accept missing policy only for pre-migration history; deletion after policy introduction fails closed.
- Preserve legacy decoding, published manifest/reservation bytes and byte-for-byte reuse of historical reservations.
- Reject downgrade, ambiguity, ordinary `1.*` or prerelease allocation. Compare versions numerically.
- Delayed runs retain their tested source's line and cannot displace a newer release as latest.
- Initially select `0.1`. Activate `0.2` in a separate reviewed change; that activation merge can produce the first
  release in the new line. Do not activate it in this PR.
- Reserve future `1.0.0` finalization for the same publisher implementation with a separately checked operation; this
  card does not implement that operation or claim production evidence.

### Independent tests before implementation

Independently specify historical ordinal 6/7 replay, unchanged legacy schema-1 retries, source-policy disagreement,
absent/deleted/malformed policy, `0.1 → 0.2`, downgrade rejection, numeric ordering, delayed old-line jobs, concurrent
distinct sources, interrupted upload recovery, immutable reservation conflicts and premature `1.0.0` refusal.

Run focused preparation/publication tests, complete tooling tests, policy/format checks and normal mandatory CI with
unchanged product acceptance. Use deterministic fixtures and no real tags.

### Review, rollback, release effect and stop

Require release-policy review and exact-head companion review. Owner adoption of the version rule is distinct from
publication authority. All release consumers must agree before the card completes.

The migration produces an ordinary v0.1.x release only after an authorized merge. Before any new-line publication,
revert coherently if necessary. Once new-line tags exist, repair forward without deleting or reinterpreting published
versions or reservations.

**Done:** release consumers agree, historical releases remain verifiable, and a later line-activation PR is possible.
**Stop before** line activation, Fastify implementation or production-finalization work. Continued authority applies
only within this card's scope and prerequisites.

## Provisional work after the three-card window

Use the [roadmap](../roadmap/README.md) for the remaining ordered packages: line activation; independent transport suite
and binding; Fastify; independent docs/CSP suite and binding; offline Redoc; hosted profiles and trusted launcher;
registry handoff; reconciliation/backfill; account/cost/access gates; stage verification; production candidate, recovery
and first-launch authority; production smoke and finalization. Queue-tooling compatibility precedes any live
`queue: max` syntax. Keep later v1.x/V2 evolution separate from the assessment submission deadline.

Do not expand these into additional detailed PR cards yet. Human-readable planning continues even when the installed
orchestrator cannot consume the new architecture. Preserve its active generated plan and historical evidence; any future
generated-plan migration requires separately approved bounded inputs and truthful direct validation.
