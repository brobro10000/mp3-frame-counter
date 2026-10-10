# Next iteration: phase instructions and three PR cards

**Execution status, 2026-10-10:** PLAN-01 and COST-BOOTSTRAP are merged; v0.1.10 is published. The dedicated project,
USD 75 Run cap and USD 100 all-service alert budget have been read back; see
[cost evidence](../validation/cloud-cost-bootstrap.md). The owner authorized
[continued execution](roadmap-execution-authorization.md), companion-reviewed merges and automatic stage delivery. The
three active cards below are GATE-01, VER-01 and LINE-02. GATE-01 is in progress; no successor is active. Production
application deployment/promotion requires human intervention, and no deployed application is claimed.

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

## PR card 1 — GATE-01: Admit independently reviewed successor suites

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

## PR card 2 — VER-01: Support source-bound release lines

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

## PR card 3 — LINE-02: Activate the approved v0.2 release line

**Outcome:** the first source-bound v0.2.x publication using VER-01's shared allocator, without changing product
behavior or activating a successor suite. The global first-parent ordinal remains the patch component.

**Prerequisites:** GATE-01 and VER-01 merged with successful exact-source publication and immutable retry evidence;
fresh protected main; the owner's adopted roadmap/version policy. Do not combine activation with allocator changes.

### Owned scope and read-only boundaries

Change only the approved minor-line field in root `release-policy.json` from `0.1` to `0.2` and targeted current-policy
notes in release/roadmap documentation. Product, tests, dependencies, workflow, publisher implementation, acceptance
registry/genesis, existing tags/assets and infrastructure remain read-only. An unexpected allocator defect returns to a
separate repair card before activation.

### Required behavior and validation

1. Read the reviewed policy at exact base; verify VER-01 is implemented and its first main release is published.
2. Apply only the minor-line change. The source merge itself allocates `0.2.<global source ordinal>`; do not reset
   patch, guess a future squash SHA, edit package version or allocate an ordinary `1.*` release.
3. Run policy/format and existing allocation/preparation/publication tests, then normal required CI and unchanged r3
   acceptance. Existing numeric-latest tests must cover delayed old-line runs. Create no tags during local validation.
4. Obtain exact-head companion approval, merge as owner through required checks and verify the actual main source,
   version, release assets and latest selection. Failed publication remains a failed activation outcome until repaired
   through the same immutable publisher; never overwrite a reservation with different bytes.

### Review, rollback and stop

The release reviewer checks the small policy diff, numeric ordering and historical identity compatibility. Companion
approval and merge authority come from the execution amendment; production deployment remains separately gated. Before
publication, rollback is a coherent source revert accepted by the allocator's monotonicity rules. After any v0.2 tag
exists, repair forward without deleting tags or downgrading the line. A revert that violates monotonicity is not a
recovery mechanism.

**Done and stop:** actual first v0.2.x publication is verified and historical releases remain verifiable. Stop before
the independent transport successor, Fastify migration, docs/CSP activation or any hosted deployment. Expand the next
card only with current prerequisite evidence.

## Provisional work after the three-card window

Use the [roadmap](../roadmap/README.md) for the remaining ordered packages: independent transport suite and binding;
Fastify; independent docs/CSP suite and binding; offline Redoc; hosted profiles and trusted launcher; registry handoff;
reconciliation/backfill; account/cost/access gates; stage verification; production candidate, recovery and first-launch
authority; production smoke and finalization. Queue-tooling compatibility precedes any live `queue: max` syntax. Keep
later v1.x/V2 evolution separate from the assessment submission deadline.

Do not expand these into additional detailed PR cards yet. Human-readable planning continues even when the installed
orchestrator cannot consume the new architecture. Preserve its active generated plan and historical evidence; any future
generated-plan migration requires separately approved bounded inputs and truthful direct validation.
