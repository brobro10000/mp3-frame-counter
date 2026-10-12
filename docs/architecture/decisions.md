# Decisions, proposals and blockers

**Current submission scope — 2026-10-12:** the implemented architecture is [v1.md](v1.md): React/TypeScript,
Fastify/TypeBox, handwritten audio counting and two local containers. PR #66 bound the successor and PR #63 activated
it. Cloud delivery was stopped for the local assessment; see [its final disposition](../deployment/decommission.md).
Earlier execution and future-tense decisions below retain their dated historical scope. They authorize no new work.

**Historical execution amendment — 2026-10-10 local time:** the owner resumed the smallest verified V1 and submission
path after roadmap construction. Retain shipped Fastify, OpenAPI and offline Redoc. Complete existing stage work under
normal companion review, protected merges and cost controls; every production application deployment remains gated by
human approval. Submission handoff is independently useful before hosting. Historical future-tense proposals below
retain their original dates.

## Submission tradeoffs — 2026-10-11 UTC

This dated table records the shipped physical-count implementation. Apply the
[current local framework/audio amendment](#dec-16--local-fastify-factory-and-module-boundaries-2026-10-11) to the local
successor; preserve the table and its observations under their original count convention.

This amendment explains the implemented application at published source `07c020c40f4a0238da937b82f24e4ef50cb37824`
([v0.3.37](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.3.37)). Existing
[main CI 38103007563, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38103007563/attempts/1)
passed 120 unit tests and 72 required local cases; this documentation update does not claim a new walkthrough. The
[requirements registry](../requirements/assessment.md) preserves the original assessment and historical evidence.

| Implemented choice                                    | Assessment mapping and reason                                                                                                                                                                            | Tradeoff / evidence boundary                                                                                                                                                                                                                                                |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pure TypeScript physical-frame parser                 | APP-REQ-001/003/004/005/006, APP-EVAL-001/003: walk frame boundaries without an MP3 parsing package; count complete Xing/Info/VBRI-bearing frames and exclude supported ID3 tags.                        | MPEG-1 Layer III and the reviewed metadata subset only; no decoding, CRC validation or corruption recovery. [Parser](../../server/src/mp3.ts), [r3 contract](../testing/acceptance-contract.md) and independent [oracle](../validation/sample-baseline.md).                 |
| Bounded whole-body buffering and synchronous counting | APP-EVAL-006: admit at most two uploads before allocating; enforce the inclusive 20 MiB actual-byte cap and upload deadlines. One request-owned buffer avoids an unbounded chunk list.                   | Simpler ownership and cleanup, but memory scales with the admitted cap and counting occupies the event loop. [Transport](../../server/src/http.ts) and [local resource observations](../validation/p4-integration.md) do not prove universal throughput or hosted capacity. |
| Fastify transport with explicit raw-body/error rules  | APP-EVAL-002/003/005: retain framework routing with typed parser errors and predictable JSON; preserve existing HTTP precedence and cleanup.                                                             | Some low-level request handling remains to preserve the independently reviewed contract. [Migration evidence](../validation/fastify-transport.md#protected-main-completion) records the bounded change; the parser remains independent.                                     |
| Static UI, offline Redoc and two non-root containers  | APP-SUB-002, APP-EVAL-002/005: one browser origin, private API upstream and locally packaged documentation; no database or retained uploads.                                                             | Minimal UI and no upload history/accounts. [Compose](../../compose.yaml) and [docs completion](../phases/next-iteration.md#docs-implementation-protected-main-completion) establish the local topology; they do not prove managed hosting.                                  |
| Pinned tools and independently frozen acceptance      | APP-EVAL-004/007/008, APP-SUB-003: repeatable commands, separate oracle authorship and source-bound suite selection. The committed nine-frame fixture replaces a private-file dependency in the handoff. | Full governance tooling needs more setup than running Docker. [README](../../README.md) separates those paths; final clean-source verification and evaluator access remain pending.                                                                                         |

Assessment submission does not require Cloud Run, production rollout or a `1.0.0` tag. Optional streaming, workers or a
richer UI need an observed requirement or bottleneck before replacing this bounded design. Preserve all dated decisions
below; their earlier native-HTTP or proposed-hosting descriptions record the state at those milestones.

## DEC-15 — Fastify transport implementation amendment, 2026-10-10

The [roadmap execution authorization](../phases/roadmap-execution-authorization.md) permits the bounded Fastify
migration following actual transport binding and RUNTIME-POLICY publication. This revision introduces exact Fastify
5.12.5 with ordered admission, a custom bounded stream parser and the unchanged physical-frame parser inside the same
API container. A narrow raw refusal bridge preserves pathname/method/Expect precedence; successful uploads execute
through Fastify. The upload contract, resource limits, frontend, proxy and two-image topology remain unchanged. The
independent bound transport-v1 suite is required by this product change and descendants; its expectations cannot be
relaxed here.

Read the [migration completion](../validation/fastify-transport.md#protected-main-completion) for PR #19's exact-head
automated approval, protected-main acceptance and v0.2.19 publication. This is not deployment or graceful-drain proof.
Packaging adds only the locked production graph; docs/Redoc and hosted delivery remain separate cards. Preserve
DEC-05/DEC-14 and the generated system specification as historical contracts; this dated amendment records the adopted
architecture change.

## DEC-14 — Versioned roadmap planning amendment, 2026-10-10

The owner adopted the [versioned roadmap](../roadmap/README.md) for PLAN-01 documentation. PR #7 merged at `92807357`
and published v0.1.7. The native-HTTP product and release-only automation remain implemented; Fastify, OpenAPI 3.0.3,
offline Redoc/CSP and conditional Cloud Run stage/production are future work. This planning direction supersedes
DEC-05's native-HTTP-only future boundary and DEC-10's preferred Render topology, without retroactively changing either
decision's history or permitting implementation. DEC-13 still governs current releases without hosting.

GATE-01 must precede independent successor suites, VER-01 must precede line activation, and compatible queue tooling
must precede live queue syntax. The roadmap selects reconciliation/backfill until compatibility is demonstrated. Use the
[next three cards](../phases/next-iteration.md) and named cost/access/launch gates. Preserve generated system contracts
and historical validation; this amendment is not regenerated plugin approval or a deployment claim.

## Historical P1–P5 decision context

Status: unified plan with execution authorized on **2026-10-09**; see the
[later instruction](../phases/execution-authorization.md). Evidence labels mean: **observed** from actual inspection;
**documented** in supplied/official sources; **proposed** for future review; **blocked** pending the named input. None
means deployed or human-approved code. See [source precedence](../requirements/README.md).

## Reconciliation and decision register

| ID     | Status                              | Decision / rationale                                                                                                                                                                                                                          | Source and affected work                                  |
| ------ | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| DEC-01 | Observed + user-confirmed           | The repository exists and PR #1 merged at 143498a. The brief's claim that nothing earlier executed is false here. Preserve foundation and adapt it; no new bootstrap exception.                                                               | Git inspection; user's confirmation to reconcile; P1      |
| DEC-02 | User-confirmed                      | Preserve owner-only PR review override and separate core no-bypass ruleset. GitHub does not allow self-approval. No agent approval, merge or override without an explicit instruction.                                                        | User confirmation; repository-controls.md; APP-V1-011     |
| DEC-03 | Historical scope; amended by DEC-13 | Unified brief supersedes no-cloud and manual-browser-only decisions. That planning revision required managed candidate deployment and independent browser/HTTP acceptance; DEC-13 later deferred deployment.                                  | SRC-UNIFIED-BRIEF §§2,5–7; APP-V1-012–015                 |
| DEC-04 | Documented scope                    | P1–P5 replace the old three-phase draft; P2 reviewed test-only baseline precedes parser/API/UI/runtime containers. Existing foundation is not product code.                                                                                   | Unified §§6,10; APP-V1-011,013                            |
| DEC-05 | Documented scope                    | Preserve native HTTP, pure TypeScript whole-buffer parsing, exact 20 MiB, static frontend and independent images. Separate acceptance lockfile is expressly permitted.                                                                        | Unified §§2–4,6; APP-V1-001–010                           |
| DEC-06 | Historical scope; amended by DEC-13 | The unified plan added production approval, managed candidate E2E and pair recovery to APP-REL-001–006; DEC-13 retains repository releases and defers those hosted criteria.                                                                  | Release amendment + unified §7; APP-V1-012,015            |
| DEC-07 | Observed metadata validation        | Fresh schema-v1 specifications and control-plane metadata were generated from the authorized scope and validated. Metadata approval describes implementation authority and reviewed contracts, not phase completion or production approval.   | agents/README.md; active metadata; P1 ordinary-CI handoff |
| DEC-08 | Reviewed local freeze               | Independent acceptance author and reviewers resolved r3 HTTP/error/tag/free-format policy and sample compatibility before product code. The unchanged executable suite is now separately merged and bound to protected-main commit `a0a56d9`. | acceptance-contract.md; p2-acceptance.md; APP-V1-002–005  |
| DEC-09 | Documented rejection                | Current Vercel container Functions inherit a 4.5 MB payload limit; Supabase hosted function topology requires a runtime/image departure. Neither fits unchanged V1.                                                                           | Dated provider comparison; APP-V1-014                     |
| DEC-10 | Deferred conditional proposal       | Render frontend web service + private API per environment is preferred for further fit review. Ingress semantics, account/region/permissions and budget are unverified.                                                                       | deployment.md; gate before future provisioning            |
| DEC-11 | Implemented and reviewed            | Trusted-baseline and fail-closed CI controls are implemented and independently reviewed. P4 ran the full unchanged local suite; shipping CI still requires the separately merged test-only baseline on its trusted base.                      | independence-and-baseline.md; P1/P2/P4 evidence           |
| DEC-12 | Deferred deployment approval gate   | Serialize release operations, API-first compatible rollout and frontend-first restoration; preserve identities and first-release safe abort. Explicit owner approval still needed for the exact production release.                           | runbook.md; future deployment                             |

## DEC-13 — Release-only milestone (2026-10-09 owner amendment)

On 2026-10-09 the owner instructed: releases without deployment.
[SRC-RELEASE-ONLY](../requirements/sources/release-only-request.txt) supersedes the hosted-release scope of DEC-03/06
and defers DEC-10/12 provider actions. The unchanged application and independent acceptance contract still apply. P5 now
publishes the exact tested images as a versioned private GitHub release after protected-main CI. Provider setup,
stage/production rollout, hosted verification and recovery are future work, not current merge/release gates. No merge,
review override or deployment authority follows from this amendment.

Earlier decisions and risk rows retain the original managed-deployment plan; apply their cloud criteria only when that
work resumes. Read the [amended release requirements](../requirements/release-process.md) for the current completion
gate.

Source captures stay byte-for-byte immutable. Prior foundation evidence remains in `agents/history/foundation/` and
`agents/outputs/`. The old V1 draft is checksummed in `agents/history/v1-draft/`; its approved-form fields and
validation results do not apply to this proposal. No schema-v2 architecture migration or alternate execution-state
machine is introduced. `docs/mvp.md` is the current human-readable scope reference. Fresh generated metadata was
validated; [agents/README.md](../../agents/README.md) records the explicit ordinary-CI execution handoff and why no
plugin phase-completion result is claimed.

## Decisions resolved before the local executable baseline freeze

The independent acceptance author and reviewers resolved DEC-08 under the owner's implementation instruction: exact
health/Allow/header behavior; unsupported-layout and malformed-input classification; isolated-fault precedence; explicit
ID3 forms, reserved MPEG header policy and permitted parameter changes; sample compatibility and physical-frame
convention; permitted fixtures with three distinct counts and a valid exact-limit recipe. The
[P2 record](../validation/p2-acceptance.md) and [oracle](../validation/sample-baseline.md) preserve the observations and
advisory agent review. No human approval is implied. The suite identity is recorded in
[baseline.json](../testing/baseline.json); its unchanged suite is now bound to the actual P2 protected-main commit.

The reviewed local controller owns bounded isolated stop/start/pause/resume operations, and the
[P4 integration record](../validation/p4-integration.md) records 60 of 60 unchanged acceptance cases passing at clean
revision `2adf71b447bfee9b78e9bdfc2b29566af894d0fe`. Managed candidate fault access remains unverified.

Provider fit/access/budget is a future deployment gate and does not block the active release-only P5 milestone. Local
resource/admission/timeout budgets were selected and measured before P4 completion; see its integration record.
Managed-host verification remains required before any future deployment. Deployment budgets and production approval
cannot be inferred from the user's acceptance of a planning revision.

## Compact risk register

These risks retain their original planning identities. The [V1 closure](../validation/v1-closure.md) records resolved
release-only criteria and remaining boundaries. R-06 now has an eligible automated GitHub reviewer (`brobro1000`);
independent human review and future production approval are still separate, and the owner exception remains configured.

| Risk                                                                | Impact                                            | Owner role                   | Mitigation                                                                                                                              | Resolve by                                                   |
| ------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| R-01 Oracle unavailable or MediaInfo convention differs             | False expected counts and misleading correctness  | Acceptance author + reviewer | Obtain authorized tool/sample evidence; reconcile physical metadata frames; freeze independent manifest.                                | P2 baseline, then P3 sample reconciliation                   |
| R-02 Restricted ID3/free-format subset misses assessment input      | Assessment gap despite passing selected fixtures  | Acceptance author + owner    | Review sample and primary formats; approve explicit limitation or amend contract before tests freeze.                                   | P2                                                           |
| R-03 Suite or gate changed by product implementation                | Green CI without contract compliance              | Reviewer + foundation owner  | Trusted baseline ref and controller; separately reviewed test/workflow amendments; fail closed on skips/missing results.                | P1/P2 design, enforced from P4                               |
| R-04 Ingress rejects/buffers 20 MiB or obscures JSON                | Hosted contract failure, possible retention       | Release operator             | Authoritative provider fit assessment, authorized full candidate probes and configuration/operational review; reject incompatible host. | Before future provider acceptance                            |
| R-05 Concurrent buffers or synchronous parser exhaust resources     | Memory failures, slow requests, unhealthy service | Implementer                  | Select admission/resource/timeout budgets from measurements; verify cleanup and shutdown; avoid unsupported throughput claims.          | P4, recheck on a future managed host                         |
| R-06 No independent eligible human/private environment gate         | Process approval weaker than claimed              | Repository owner             | Preserve explicit owner exception; record manual production approval limitation; verify available GitHub protection plan.               | P1 review audit; production approval when deployment resumes |
| R-07 Partial pair promotion or missing prior artifacts              | Mixed versions or failed recovery                 | Release operator             | Compatibility during overlap, ordered stop/restore, retained digests, candidate rehearsal and first-release abort.                      | Before future hosted deployment completion                   |
| R-08 Unknown cloud account/budget/credential permissions            | Unauthorized spend or exposure                    | Repository owner             | Read-only eligibility review, explicit budget/region and scoped credentials; one candidate slot, no speculative services.               | Before future cloud setup                                    |
| R-09 Old metadata/readiness results reused as current               | Unauthorized execution or false approval          | Planning/reviewer role       | Archive/invalidate old authority; regenerate only after reviewed inputs; fresh direct validation with truthful status.                  | P0 boundary / next approved planning update                  |
| R-10 npm/E2E does not fit plugin's direct Python/60-second boundary | Fake or truncated validation                      | Foundation owner             | Review ordinary CI handoff or bounded evidence adapter separately; no allowlist edits or fabricated receipts.                           | P1 integration decision; P4 execution                        |
| R-11 Secrets, private samples or host paths leak                    | Nonportable CI or disclosure                      | All roles                    | Portable paths, ignored private input, source/hash checks, redacted logs and restricted evidence artifacts.                             | Every phase                                                  |

## Execution sequencing

The owner has authorized P1–P5 and unattended advancement after each dependency is validated and independently reviewed.
This supersedes the earlier P0-only and per-phase permission wording. Agent review does not become human approval.
DEC-07 was resolved through fresh schema-v1 inputs and installed direct validators; no archived execution plan was
reused. DEC-08 was resolved by independent acceptance authorship/review before the local freeze. P1/P2 exact-head CI
passed and P3/P4 were reviewed and locally validated. P1/P2 are now separately merged and the unchanged baseline bound
to protected main. Product PR CI at `3e7e21d` passed all mandatory checks in
[run 38012435332](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38012435332). Subsequently, PR #5 merged
at `ce50762b`, main validation published `v0.1.6`, and an identical publisher retry passed. The
[V1 closure](../validation/v1-closure.md) records those exact observations; deployment stays deferred under DEC-13.

The completed P1 work followed this narrow scope; it remains the boundary for any future foundation-only change:

Verify the merged repository/branch and live control identities; preserve the two-ruleset owner exception. Reuse pinned
foundation tooling and meaningful checks. Adapt the obsolete open-foundation-PR audit and plan phase-aware CI/ownership
boundaries without making future E2E optional. Resolve the plugin/ordinary-CI handoff and review required planning
inputs before regenerated metadata. Produce a reviewable foundation-adaptation evidence handoff before P2. No parser,
HTTP/UI, test suite, fixture generation, runtime containers or cloud setup belongs to P1 itself. Cloud account creation,
budget and exact hosted-release evidence remain deferred prerequisites for future deployment.

## Protected-main publication after P1/P2 merges

PR #3 merged as `60e51fb7da24155bfe3f15e91cbe33884047e574` and PR #4 as `a0a56d94e5457101cd043b6055ab084782c3e16f`. The
independent acceptance author verified that P2's suite tree, manifest hash and contract r3 are identical to the earlier
reviewed local baseline, with no product source in the P2 commit, and bound [baseline.json](../testing/baseline.json) to
that actual protected-main SHA. This resolves the pending publication portion of DEC-08/11; it changes no acceptance
expectation or gate. Earlier execution notes retain their historical scope. PR #5's product/release patches were
replayed unchanged onto main, followed by the independent baseline binding and source-linked diagram setup. The
reconciled product passed PR CI. PR #5 subsequently merged at `ce50762b`; its protected-main run published `v0.1.6` and
an identical publisher retry preserved all assets. See [V1 closure](../validation/v1-closure.md) and
[current progression](../validation/execution-status.md). Deployment remains deferred under DEC-13.

## Backend audio-count amendment — 2026-10-11

The [owner target](../requirements/backend-audio-refactor.md) keeps the two-container topology and handwritten parser.
Fastify construction, scoped transport and lifecycle are separated; shared TypeBox DTOs/catalogue drive serializers,
browser validation and dynamic Swagger generation. Ky is browser-only; Redocly/Oxlint are build tools. The old
physical-count/Fastify-only rows remain historical decisions, superseded narrowly for the subsequently bound
backend-audio successor. [Responsibility map and verification](../validation/backend-audio-refactor.md).

## DEC-16 — Local Fastify factory and module boundaries, 2026-10-11

Retain the already adopted Fastify 5.12.5 framework. The local `createApp()` constructs a genuine Fastify instance with
shared TypeBox schemas, dynamic Swagger registered before feature plugins, a scoped MP3 upload plugin and a sibling
health plugin. Fastify owns successful API routing, ordered hooks, response serialization and close hooks. Factory
construction remains independent of listening, documentation assets, signal handlers and live deadlines, making the same
application usable by injection tests and the build-only OpenAPI generator.

Separate the small responsibilities already present in the implementation: the composition root and production facade;
instance-local upload admission, raw collection and terminal release; route projection and canonical failure mapping;
pure MPEG/Xing boundary analysis; and browser-safe schemas/error catalogue. The native server adapter preserves early
raw-path/method/Expect refusals and serves only verified finite docs resources. Incomplete native errors may use a
bounded drain writer after release; complete replies use Fastify serializers. This retained low-level behavior does not
justify another framework or move parser logic into transport hooks.

The tradeoff remains one bounded whole-body Buffer and synchronous analysis in one Node process: simple ownership and no
retained uploads, with aggregate memory and event-loop throughput limited by admission and the 20 MiB cap. The parser
now distinguishes computed audio frames from physical frames and excludes only the supported leading Xing/Info carrier;
declared totals remain diagnostics. This narrowly supersedes historical physical-count decisions without rewriting their
evidence or the frozen original suite.

See the [current responsibility map](v1.md#current-local-fastify-architecture--2026-10-11) and source-linked
[runtime/upload diagrams](diagrams/README.md). Same-factory schema generation is a source property; current Redoc
rendering, examples, CSP, local tests and independently bound successor acceptance need their own recorded observations.
This decision records the authorized local architecture, not a new protected-main release or hosted completion.
