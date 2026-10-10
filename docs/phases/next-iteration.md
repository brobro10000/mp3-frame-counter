# Next iteration: phase instructions and three PR cards

**Later authority:** [continued execution](roadmap-execution-authorization.md) is now authorized. The documentation-only
stop points below describe PLAN-01's original authoring scope. Continue successive cards after their prerequisite
evidence and companion-reviewed merges; production deployment/promotion requires human intervention.

Documentation scope authorized on **2026-10-10** by the owner's instruction to persist the approved roadmap. This
document implements PLAN-01's planning deliverable; it does not execute GATE-01 or VER-01. Commit, push, PR creation,
merge, publication, account setup and deployment are outside this documentation task. Authoring permission does not
establish that reviews, checks, merges or future decision gates passed.

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
7. Hand off at the card's stop point. Expand subsequent work only after its prerequisite evidence exists. The current
   documentation authorization does not authorize execution of the two future implementation cards below.

Keep raw `POST /file-upload`, its exact JSON success shape, inclusive **20,971,520-byte** limit, r3 format/error
semantics and pure TypeScript physical-frame parser unchanged throughout these three cards. Preserve original captures,
private sample handling, frozen suite bytes, dated reports and historical generated orchestrator artifacts.

## PR card 1 — PLAN-01: Persist the roadmap and reconcile active guidance

**Outcome:** one navigable documentation set separates the released assessment application, historical closure, future
architecture and production-V1 gates.

**Base and prerequisites:** refresh main, recorded by the planning inspection as
`92807357b6eb74f2915b9b05701889fd70d292c0`; retain dated evidence and unrelated work. The owner has authorized
documentation authoring. GitHub writes and implementation remain outside this task.

### Owned documentation

- `docs/roadmap/README.md`: state, architecture, versions, dependencies, deployment, decision gates and source evidence.
- `docs/phases/next-iteration.md`: these cards and phase operating instructions.
- `docs/roadmap/diagrams/`: three planned Mermaid sources, each with scope/reference frontmatter; one editable copy.
- The existing four `docs/agents/` role documents: bounded ownership and future handoff instructions.
- Targeted dated amendments and links in `docs/phases/README.md`, `docs/testing/independence-and-baseline.md`,
  `docs/architecture/decisions.md`, `docs/architecture/deployment.md` and `docs/deployment/runbook.md`.
- Only necessary entrypoint pointers in root `README.md`, `AGENTS.md` and `docs/requirements/README.md`.

**Read-only:** product/test code, dependencies, workflows, infrastructure, baseline JSON, original requirement captures,
historical validation records and generated `agents/**` artifacts. Keep the three implemented architecture diagrams and
`.mermaidignore` unchanged.

### Authoring sequence

1. Preserve historical wording and add dated current-state amendments instead of rewriting prior observations.
2. Persist the roadmap, separate phase instructions and separate role instructions; keep later work provisional.
3. Attribute actionlint's `queue: max` incompatibility to the **previous Codex reproduction**, without claiming a new
   reproduction in this documentation task.
4. Link planned diagrams instead of duplicating their editable bodies. Label proposed deployment explicitly.
5. Trace existing APP requirement IDs; keep new roadmap decisions distinct from the original assessment.

### Validation and review

Inspect the complete documentation diff, internal references, evidence labels, dependency order and path portability.
Use installed formatting and Mermaid tooling only. Existing checkers discover Git-tracked files: validate untracked new
documents explicitly, or use later authorized staging before claiming full checker coverage. Record actual validation
results without inventing application, deployment or generated-plan evidence.

Companion review targets the actual documentation diff and exact reviewed tree. If no PR exists, retain the local
reviewable diff and leave exact-PR companion review pending; do not create a PR or pretend the existing PR review covers
new content. Reject contradictions about current hosting, immutable evidence, identity or prerequisite order.
Architecture adoption grants no billing, deployment or merge authority.

### Rollback, release effect and stop

Rollback is a documentation revert that preserves history. A later authorized merge can produce another ordinary v0.1.x
artifact release under existing CI; writing these files does not publish one.

**Done:** a bounded documentation-only diff with truthful check coverage and review handoff. **Stop before** GATE-01,
GitHub writes, implementation, provisioning and deployment. Remaining review/merge evidence stays pending until it
exists.

## PR card 2 — GATE-01: Admit independently reviewed successor suites

**Outcome:** backward-compatible acceptance transition support, dormant on merge, with r3 still active.

**Prerequisites:** PLAN-01 adopted; independent gate-design and expected-decision review; explicit authority for this
trust-policy change. Record the exact trusted base before implementation. This card is future work, not executed by the
current documentation task.

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
PR. **Stop before** adding successor tests or activating a new contract. Merge requires its own authority; the current
documentation task must not execute any part of this card.

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
publication tests. This documentation task does not create `release-policy.json` or edit the named scripts.

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
**Stop before** line activation, Fastify implementation or production-finalization work. Execution of this card is
outside the current documentation task.

## Provisional work after the three-card window

Use the [roadmap](../roadmap/README.md) for the remaining ordered packages: line activation; independent transport suite
and binding; Fastify; independent docs/CSP suite and binding; offline Redoc; hosted profiles and trusted launcher;
registry handoff; reconciliation/backfill; account/cost/access gates; stage verification; production candidate, recovery
and first-launch authority; production smoke and finalization. Queue-tooling compatibility precedes any live
`queue: max` syntax. Keep later v1.x/V2 evolution separate from the assessment submission deadline.

Do not expand these into additional detailed PR cards yet. Human-readable planning continues even when the installed
orchestrator cannot consume the new architecture. Preserve its active generated plan and historical evidence; any future
generated-plan migration requires separately approved bounded inputs and truthful direct validation.
