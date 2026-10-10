# Next iteration: phase instructions and three PR cards

**Execution status, 2026-10-10:** PLAN-01, COST-BOOTSTRAP and GATE-01 are merged; v0.1.11 is published. The
[gate release and retry evidence](../validation/acceptance-transitions.md#protected-main-publication-and-retry) verifies
unchanged original admission and released bytes. The registry remains empty and r3 remains required. The dedicated
project's USD 75 Run cap and USD 100 all-service alert budget retain their
[cost evidence](../validation/cloud-cost-bootstrap.md). The owner authorized
[continued execution](roadmap-execution-authorization.md), companion-reviewed merges and automatic stage delivery. The
three active cards are VER-01, LINE-02 and TRANSPORT-CONTRACT. No application is deployed; production application
deployment/promotion still requires human intervention. Read the [versioned roadmap](../roadmap/README.md) for
current-state evidence, architecture, dependency diagrams, release envelopes, deployment and named decision gates. This
document owns phase operation and exactly three detailed next PR cards. Use the separate
[acceptance](../agents/acceptance-author.md), [implementation](../agents/implementer.md),
[review](../agents/reviewer.md) and [release](../agents/release-operator.md) role instructions for ownership boundaries.

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

## PR card 1 — VER-01: Support source-bound release lines

**Outcome:** deterministic allocation beyond v0.1 that preserves historical identities and immutable retries.

**Prerequisites:** PLAN-01's version policy adopted; GATE-01 updates to shared evidence readers completed and verified;
fresh trusted main. Keep this sequential after GATE-01 to avoid concurrent incompatible edits to release consumers.

### Owned implementation scope

- New root `release-policy.json`, initially selecting line `0.1` and the global first-parent-ordinal strategy.
- `scripts/release-manifest.mjs`, `scripts/prepare-release.mjs`, `scripts/publish-release-bundle.mjs`,
  `scripts/publish-release-evidence.mjs`.
- Existing `scripts/release-preparation.test.mjs` and `scripts/publish-release.test.mjs`.
- Narrow current-policy sections in release requirements, preparation and release-only documentation.

Keep the publisher entrypoint unchanged unless a necessary allocator-interface change requires it. The independent
version-design review also scopes an actual-source check in `scripts/policy.mjs` and registration of the new allocation
tooling tests. Validate the checked-out policy before merge; fixture success alone cannot admit a malformed real policy.

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

The migration produces an ordinary v0.1.x release only after an authorized merge. Unmerged proposals may be discarded.
Once policy is introduced into protected-main history, recovery must preserve its valid policy and admitted line;
implementation-only rollback cannot delete policy. Repair forward without reinterpreting versions or reservations.

**Done:** release consumers agree, historical releases remain verifiable, and a later line-activation PR is possible.
**Stop before** line activation, Fastify implementation or production-finalization work. Continued authority applies
only within this card's scope and prerequisites.

## PR card 2 — LINE-02: Activate the approved v0.2 release line

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
approval and merge authority come from the execution amendment; production deployment remains separately gated. An
unmerged activation may be discarded. Once the activation is merged, the admitted `0.2` high-water mark applies even if
publication failed. Repair forward while retaining that line; reverting to `0.1` is rejected. Never delete tags or
reinterpret an existing reservation.

**Done and stop:** actual first v0.2.x publication is verified and historical releases remain verifiable. Stop before
the independent transport successor, Fastify migration, docs/CSP activation or any hosted deployment. Expand the next
card only with current prerequisite evidence.

## PR card 3 — TRANSPORT-CONTRACT: Author the independent transport successor

**Outcome:** an independently reviewed candidate suite and OpenAPI 3.0.3 contract for the Fastify migration. Candidate
controls are evidence of the test harness; r3 still gates the application until a separately reviewed binding and
corresponding implementation. This card does not ship Fastify or documentation routes.

**Prerequisites:** GATE-01 and VER-01 verified on protected main; LINE-02's first v0.2.x release verified; fresh trusted
base and no pending candidate/binding. Read the [succession guide](../testing/acceptance-transition.md), existing r3
contract, requirement IDs and the current transport before defining new expectations. The acceptance author remains
independent of the future product implementer.

### Owned scope and immutable boundaries

The acceptance author owns only `tests/acceptance/**` and one new `docs/testing/contracts/transport-v1.md`. Defer other
requirement/phase documentation to a separate documentation or binding PR, as candidate admission rejects mixed paths.
Retain r3 cases and original oracle/fixture bytes; add independent transport cases and a locally resolved OpenAPI
fixture within the suite. Use the existing standalone acceptance package and pinned tools. Root application code, root
dependency lockfile, release/gate implementation, transition registry, genesis baseline, original contracts/evidence,
Docker runtime configuration and cloud resources are read-only. Any necessary gate defect requires a separate repair
before this candidate can proceed.

### Required contract and independent expectations

1. Describe raw `POST /file-upload`, both accepted media types, inclusive 20,971,520-byte actual-body limit, exact
   positive-integer success object and r3 JSON errors in OpenAPI 3.0.3. Preserve parser scope and physical-frame
   counting. Keep docs serving/Redoc/CSP behavior for a separate later successor.
2. Exercise current transport invariants externally: content-type parameters and rejection, unsupported methods and HEAD
   behavior, Allow headers, byte/count limits, admission before buffering, error precedence, cancellation, deadlines,
   connection cleanup and graceful shutdown. Map existing tests before adding cases; do not duplicate assertions solely
   to raise a count or bless a framework default.
3. Preserve known-count independent fixtures, useful controlled error cases and no private sample dependency. The
   candidate must detect a missing or skipped mandatory case and incorrect frame/error responses. Add narrowly scoped
   negative controls proving new assertions detect their intended regression.
4. Keep candidate discovery/oracle/negative-control results separate from application acceptance. Future-behavior
   failures remain visible candidate evidence; they must not be relabeled passed or replace the active r3 report.
5. Record the contract ID, requirement mapping, actual expected discovery count and fixture provenance. The later
   binding PR records this candidate's actual protected-main squash/tree/manifest and exact independent approval; this
   authoring PR cannot invent those future identities.

### Validation, review and failure signals

Run the existing standalone harness controls and the independent negative controls against deterministic fixtures.
Confirm the untouched required r3 suite passes against the actual existing application through the normal CI controller.
Run affected format/policy checks and required PR CI. A candidate path mixture, missing oracle, skipped case, changed
baseline, missing old case or source-selected acceptance shortcut blocks merge. Expected future-behavior failures are
reported separately with their reason and cannot satisfy release acceptance.

Require acceptance/gate review and exact-head companion review. The future transport implementer may explain current
behavior but cannot author the oracle or weaken expectations to fit Fastify. Preserve failed evidence and resolve
material protocol ambiguity against assessment/r3 requirements before binding.

### Rollback, release effect and stop

An authorized merge may publish unchanged application behavior under r3 on the active v0.2 line. Preserve the candidate
objects and review evidence. Correct candidate tests before their authoring PR merges. The current gate admits no
replacement while a merged candidate is pending; any later correction requires separately reviewed gate/recovery work
before it can proceed. Never rewrite published history or amend the genesis record.

**Done and stop:** candidate-only merge and its harness/current-r3 checks are verified. Stop before registry binding,
Fastify implementation, docs/CSP behavior or hosted work. Expand the binding card only after the actual candidate merge
and independent review identities exist.

## Provisional work after the three-card window

Use the [roadmap](../roadmap/README.md) for the remaining ordered packages: actual transport binding; Fastify;
independent docs/CSP suite and binding; offline Redoc; hosted profiles and trusted launcher; registry handoff;
reconciliation/backfill; account/cost/access gates; stage verification; production candidate, recovery and first-launch
authority; production smoke and finalization. Queue-tooling compatibility precedes any live `queue: max` syntax. Keep
later v1.x/V2 evolution separate from the assessment submission deadline.

Do not expand these into additional detailed PR cards yet. Human-readable planning continues even when the installed
orchestrator cannot consume the new architecture. Preserve its active generated plan and historical evidence; any future
generated-plan migration requires separately approved bounded inputs and truthful direct validation.
