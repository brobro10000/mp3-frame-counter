# Next iteration: phase instructions and three PR cards

**Execution status, 2026-10-10:** PLAN-01, COST-BOOTSTRAP, GATE-01 and VER-01 are merged; v0.1.12 is published. The
[version release and retry evidence](../validation/release-lines.md#protected-main-publication-and-retry) verifies
source-bound allocation, unchanged original admission and released bytes. The registry remains empty and r3 remains
required. The dedicated project's USD 75 Run cap and USD 100 all-service alert budget retain their
[cost evidence](../validation/cloud-cost-bootstrap.md). The owner authorized
[continued execution](roadmap-execution-authorization.md), companion-reviewed merges and automatic stage delivery. The
three active cards are LINE-02, TR-LIFECYCLE and TRANSPORT-CONTRACT. No application is deployed; production application
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

## PR card 1 — LINE-02: Activate the approved v0.2 release line

**Outcome:** the first source-bound v0.2.x publication using VER-01's shared allocator, without changing product
behavior or activating a successor suite. The global first-parent ordinal remains the patch component.

**Prerequisites:** GATE-01 and VER-01 merged with successful exact-source publication and immutable retry evidence;
fresh protected main; the owner's adopted roadmap/version policy. Do not combine activation with allocator changes.

### Owned scope and read-only boundaries

Change only the approved minor-line field in root `release-policy.json` from `0.1` to `0.2` and targeted current-policy
notes in release/roadmap documentation. Product, tests, dependencies, workflow, publisher implementation, acceptance
registry/genesis, existing tags/assets and infrastructure remain read-only. Persist the verified VER completion and
rotate this three-card window, including the observed lifecycle prerequisite and its dependency diagram. An unexpected
allocator defect returns to a separate repair card before activation.

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
TR-LIFECYCLE implementation, the independent transport successor, Fastify migration, docs/CSP activation or hosted work.
Expand the next card only with current prerequisite evidence.

## PR card 2 — TR-LIFECYCLE: Observe shutdown independently of forced cleanup

**Outcome:** bounded signal and lifecycle observations for the isolated API container, distinguishing Docker
acknowledgment, an observed stopping boundary, admitted-response completion and process exit. A control response alone
never proves graceful drain. Trace APP-V1-003,007,010,013,015 and APP-EVAL-005,006.

**Reason:** the [dated diagnostic](../validation/lifecycle-controller.md) observed the existing `/stop` return 200
around 5,191 ms while the container exited 137. Its five-second forced-stop cutoff overlaps the application's intended
shutdown deadline. This establishes an observation gap, not a product defect diagnosis. Preserve r3 outage/recovery
semantics and all failed evidence.

**Prerequisites:** verified VER-01 publication/retry and LINE-02 publication; fresh main, unchanged r3 and no pending
successor. Independent controller/security expectations precede implementation. The trusted classifier already admits
these script paths as governance; do not change classification or mix this work with a product change.

### Owned scope and immutable boundaries

Own only `scripts/e2e-controller.mjs`, `scripts/run-e2e.mjs`, independent additions to
`scripts/e2e-controller.test.mjs`, narrow `docs/testing/lifecycle-controller.md`, the diagnostic validation record and
necessary current phase links. Retain existing tests. Root owns integration and broad checks.

Product/parser/UI, `tests/acceptance/**`, genesis/transition registry, gate logic, release tooling, dependencies,
workflows and Compose/Docker configuration are read-only. Preserve existing invocation, report/provenance semantics,
outer budgets and stop/start/pause/resume behavior. No cloud call, Docker socket in acceptance, application test hook,
arbitrary command adapter or caller-selected target/signal/timeout is permitted.

### Required control contract

Freeze names and closed schemas in independent expectations before coding. Recommended additions are authenticated,
bodyless POST `/signal-term` and `/state` on the existing loopback controller:

- Keep the existing random token and constant-time comparison. Require loopback peer/listener, exact Host and route,
  absent Origin/transfer encoding, and absent or literal-zero Content-Length. Reject encoded/query paths, other methods,
  bodies, duplicate/truncated security headers and aliases before Docker callbacks. Keep errors bounded and sanitized.
- Revalidate the fixed API container ID, exact run/project/service and tested image. Bind readback to a validated
  process generation using start identity/restart count. Missing, malformed or substituted identity fails closed.
- `/signal-term` sends only SIGTERM through a bounded asynchronous no-shell command. Return daemon acknowledgment;
  neither wait for exit nor install a coincident forced-stop timer. Reject paused/stopped/restarting/dead containers and
  duplicate signals to a generation. Failed/uncertain delivery is not acknowledged or automatically repeated.
- `/state` performs one bounded inspection, projecting only schema/target/image/generation and lifecycle fields needed
  for running/paused/restarting/dead, exit code, OOM and a boolean error flag. Never expose raw inspect JSON,
  Config/Env, paths, raw errors or tokens. Running with exit zero is not successful exit; stopped zero/no-OOM/no-error
  is an observed normal exit. Exit 137 remains abnormal without claiming which actor caused it.
- Validate callback results before returning a small closed response. Serialize with existing actions and preserve the
  bounded busy behavior; reads may retry only within the caller's fixed budget. No token enters arguments or logs.

### Independent tests and falsification before implementation

Use injected observations/commands and disposable loopback listeners, without Docker or product imports. Specify valid
fixed-target actions; authentication/framing rejection before effects; malformed/substituted identity and generation;
paused/stopped/duplicate signals; uncertain timeout/nonzero delivery; closed field projection; normal versus abnormal
exit; concurrent busy/cancellation/overflow handling; and compatibility of original actions. Preserve existing tests and
capture actual failing expectations before adapter changes. Keep cleanup and work errors separately visible.

Falsification must reject a no-op acknowledgment, premature reset of the held response, missing application deadline,
force-stop/137 masquerading as normal exit and stale generation. These controls test observation sensitivity, not
product acceptance. A helper pass cannot replace the full unchanged r3 report.

### Actual validation and evidence boundary

Run focused tests, relevant policy/format checks, unchanged r3 integration and mandatory CI. Separately diagnose the
exact tested images in a fresh owned project with reserved loopback ports, bounded work and finally cleanup:

1. Admit one incomplete known-count upload; 100 Continue establishes admission only. Signal through the new operation.
2. Establish an independently justified stopping transition while that original connection remains live. A validated
   stopping-503 or supported listener-closure observation may qualify; the previous Docker Desktop reset does not
   qualify by assumption. Neither daemon acknowledgment nor a sleep proves handler entry.
3. Only then complete the original fixture and require its exact full response, followed by observed normal exit.
4. In a separate restored run, leave an admitted straggler incomplete and observe socket closure/normal exit before
   forced cleanup. Allow a justified eight-second diagnostic window beyond the configured five-second intent; report
   measured tolerance rather than claiming an exact five-second bound.
5. Preserve failure before bounded cleanup. Forced cleanup is never successful deadline evidence. Verify owned resource
   absence and retain source/image/generation, observation timing, response, exit/OOM/error and cleanup results without
   secrets. Never overwrite full acceptance with diagnostic output.

If no trustworthy stopping predicate emerges, record drain as unresolved operational evidence and obtain an independent
coordinator/reviewer disposition before candidate authoring. Do not weaken the predicate to get a pass. Any discovered
product defect becomes a separate implementation finding; this controller card cannot repair it.

### Review, rollback, release effect and stop

Require independent controller/security review and exact-head companion approval, then owner merge and observed main
release. Review authentication before effects, narrow Docker authority, identity rechecks, uncertain delivery, secret
exclusion and diagnostic/report separation. Before any successor depends on these operations, an ordinary reviewed
revert may remove the additions while preserving old controls and history. After binding, coordinate recovery and repair
forward without silently removing required capabilities.

**Done and stop:** verified control capability, independent negative controls, unchanged r3, actual diagnostic record
and protected-main v0.2.x release. Hand off a justified drain predicate or explicit unresolved operational disposition;
stop before successor authoring/binding, Fastify, docs/CSP, hosting or a product fix. No deployment is implied.

## PR card 3 — TRANSPORT-CONTRACT: Author the independent transport successor

**Outcome:** an independently reviewed candidate suite and OpenAPI 3.0.3 contract for the Fastify migration. Candidate
controls are evidence of the test harness; r3 still gates the application until a separately reviewed binding and
corresponding implementation. This card does not ship Fastify or documentation routes.

**Prerequisites:** GATE-01 and VER-01 verified on protected main; LINE-02's first v0.2.x release verified; fresh trusted
base and no pending candidate/binding; TR-LIFECYCLE capability, observed main release and lifecycle disposition
verified. Read the [succession guide](../testing/acceptance-transition.md), existing r3 contract, requirement IDs and
the current transport before defining new expectations. The acceptance author remains independent of the future product
implementer.

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
   connection cleanup and externally provable lifecycle behavior using TR-LIFECYCLE's reviewed predicate. Retain
   unresolved graceful-drain guarantees as explicit operational evidence. Map existing tests before adding cases; do not
   duplicate assertions solely to raise a count or bless a framework default.
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
