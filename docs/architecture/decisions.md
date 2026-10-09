# Decisions, proposals and blockers

Status: unified plan with execution authorized on **2026-10-09**; see the
[later instruction](../phases/execution-authorization.md). Evidence labels mean: **observed** from actual inspection;
**documented** in supplied/official sources; **proposed** for future review; **blocked** pending the named input. None
means deployed or human-approved code. See [source precedence](../requirements/README.md).

## Reconciliation and decision register

| ID     | Status                       | Decision / rationale                                                                                                                                                                                                                        | Source and affected work                                  |
| ------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| DEC-01 | Observed + user-confirmed    | The repository exists and PR #1 merged at 143498a. The brief's claim that nothing earlier executed is false here. Preserve foundation and adapt it; no new bootstrap exception.                                                             | Git inspection; user's confirmation to reconcile; P1      |
| DEC-02 | User-confirmed               | Preserve owner-only PR review override and separate core no-bypass ruleset. GitHub does not allow self-approval. No agent approval, merge or override without an explicit instruction.                                                      | User confirmation; repository-controls.md; APP-V1-011     |
| DEC-03 | Documented scope             | Unified brief supersedes no-cloud and manual-browser-only decisions. V1 now requires managed candidate deployment and independent executable browser/HTTP acceptance.                                                                       | SRC-UNIFIED-BRIEF §§2,5–7; APP-V1-012–015                 |
| DEC-04 | Documented scope             | P1–P5 replace the old three-phase draft; P2 reviewed test-only baseline precedes parser/API/UI/runtime containers. Existing foundation is not product code.                                                                                 | Unified §§6,10; APP-V1-011,013                            |
| DEC-05 | Documented scope             | Preserve native HTTP, pure TypeScript whole-buffer parsing, exact 20 MiB, static frontend and independent images. Separate acceptance lockfile is expressly permitted.                                                                      | Unified §§2–4,6; APP-V1-001–010                           |
| DEC-06 | Documented scope             | Preserve APP-REL-001–006 and supplement them with exact-release production approval, managed candidate E2E and compatible-pair recovery.                                                                                                    | Release amendment + unified §7; APP-V1-012,015            |
| DEC-07 | Observed metadata validation | Fresh schema-v1 specifications and control-plane metadata were generated from the authorized scope and validated. Metadata approval describes implementation authority and reviewed contracts, not phase completion or production approval. | agents/README.md; active metadata; P1 ordinary-CI handoff |
| DEC-08 | Reviewed local freeze        | Independent acceptance author and reviewers resolved r3 HTTP/error/tag/free-format policy and sample compatibility before product code. The recorded executable suite is frozen locally; protected-main publication remains pending.        | acceptance-contract.md; p2-acceptance.md; APP-V1-002–005  |
| DEC-09 | Documented rejection         | Current Vercel container Functions inherit a 4.5 MB payload limit; Supabase hosted function topology requires a runtime/image departure. Neither fits unchanged V1.                                                                         | Dated provider comparison; APP-V1-014                     |
| DEC-10 | Conditional proposal         | Render frontend web service + private API per environment is preferred for further fit review. Ingress semantics, account/region/permissions and budget are unverified.                                                                     | deployment.md; P5 pre-implementation/provisioning gate    |
| DEC-11 | Implemented and reviewed     | Trusted-baseline and fail-closed CI controls are implemented and independently reviewed. P4 ran the full unchanged local suite; shipping CI still requires the separately merged test-only baseline on its trusted base.                    | independence-and-baseline.md; P1/P2/P4 evidence           |
| DEC-12 | Proposed, approval gate      | Serialize release operations, API-first compatible rollout and frontend-first restoration; preserve identities and first-release safe abort. Explicit owner approval still needed for the exact production release.                         | runbook.md; P5                                            |

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
[baseline.json](../testing/baseline.json); its protected-main publication is still pending.

The reviewed local controller owns bounded isolated stop/start/pause/resume operations, and the
[P4 integration record](../validation/p4-integration.md) records 60 of 60 unchanged acceptance cases passing at clean
revision `2adf71b447bfee9b78e9bdfc2b29566af894d0fe`. Managed candidate fault access remains unverified.

Provider fit/access/budget is a separate P5 gate and does not block independent requirements, foundation or local work.
Local resource/admission/timeout budgets were selected and measured before P4 completion; see its integration record.
Managed-host verification remains required. Deployment budgets and production approval cannot be inferred from the
user's acceptance of a planning revision.

## Compact risk register

| Risk                                                                | Impact                                            | Owner role                   | Mitigation                                                                                                                              | Resolve by                                  |
| ------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| R-01 Oracle unavailable or MediaInfo convention differs             | False expected counts and misleading correctness  | Acceptance author + reviewer | Obtain authorized tool/sample evidence; reconcile physical metadata frames; freeze independent manifest.                                | P2 baseline, then P3 sample reconciliation  |
| R-02 Restricted ID3/free-format subset misses assessment input      | Assessment gap despite passing selected fixtures  | Acceptance author + owner    | Review sample and primary formats; approve explicit limitation or amend contract before tests freeze.                                   | P2                                          |
| R-03 Suite or gate changed by product implementation                | Green CI without contract compliance              | Reviewer + foundation owner  | Trusted baseline ref and controller; separately reviewed test/workflow amendments; fail closed on skips/missing results.                | P1/P2 design, enforced from P4              |
| R-04 Ingress rejects/buffers 20 MiB or obscures JSON                | Hosted contract failure, possible retention       | Release operator             | Authoritative provider fit assessment, authorized full candidate probes and configuration/operational review; reject incompatible host. | Before P5 provider acceptance               |
| R-05 Concurrent buffers or synchronous parser exhaust resources     | Memory failures, slow requests, unhealthy service | Implementer                  | Select admission/resource/timeout budgets from measurements; verify cleanup and shutdown; avoid unsupported throughput claims.          | P4, recheck P5                              |
| R-06 No independent eligible human/private environment gate         | Process approval weaker than claimed              | Repository owner             | Preserve explicit owner exception; record manual production approval limitation; verify available GitHub protection plan.               | P1 review audit, P5 release setup           |
| R-07 Partial pair promotion or missing prior artifacts              | Mixed versions or failed recovery                 | Release operator             | Compatibility during overlap, ordered stop/restore, retained digests, candidate rehearsal and first-release abort.                      | P5 before completion                        |
| R-08 Unknown cloud account/budget/credential permissions            | Unauthorized spend or exposure                    | Repository owner             | Read-only eligibility review, explicit budget/region and scoped credentials; one candidate slot, no speculative services.               | Before P5 cloud setup                       |
| R-09 Old metadata/readiness results reused as current               | Unauthorized execution or false approval          | Planning/reviewer role       | Archive/invalidate old authority; regenerate only after reviewed inputs; fresh direct validation with truthful status.                  | P0 boundary / next approved planning update |
| R-10 npm/E2E does not fit plugin's direct Python/60-second boundary | Fake or truncated validation                      | Foundation owner             | Review ordinary CI handoff or bounded evidence adapter separately; no allowlist edits or fabricated receipts.                           | P1 integration decision; P4 execution       |
| R-11 Secrets, private samples or host paths leak                    | Nonportable CI or disclosure                      | All roles                    | Portable paths, ignored private input, source/hash checks, redacted logs and restricted evidence artifacts.                             | Every phase                                 |

## Execution sequencing

The owner has authorized P1–P5 and unattended advancement after each dependency is validated and independently reviewed.
This supersedes the earlier P0-only and per-phase permission wording. Agent review does not become human approval.
DEC-07 was resolved through fresh schema-v1 inputs and installed direct validators; no archived execution plan was
reused. DEC-08 was resolved by independent acceptance authorship/review before the local freeze. P1/P2 exact-head CI
passed and P3/P4 were reviewed and locally validated. Separate merges, final trusted-main baseline binding and the
managed release remain outstanding.

The phase scope remains narrow even though all phases are authorized:

Verify the merged repository/branch and live control identities; preserve the two-ruleset owner exception. Reuse pinned
foundation tooling and meaningful checks. Adapt the obsolete open-foundation-PR audit and plan phase-aware CI/ownership
boundaries without making future E2E optional. Resolve the plugin/ordinary-CI handoff and review required planning
inputs before regenerated metadata. Produce a reviewable foundation-adaptation evidence handoff before P2. No parser,
HTTP/UI, test suite, fixture generation, runtime containers or cloud setup belongs to P1 itself. Cloud account creation,
budget and exact-release evidence remain separate unresolved prerequisites until observed.
