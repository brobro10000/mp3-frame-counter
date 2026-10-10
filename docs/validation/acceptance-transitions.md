# GATE-01 implementation evidence

## Scope and state — 2026-10-10

This change implements dormant acceptance succession after the owner-authorized roadmap. The registry is empty and r3
remains required. No successor test suite, product behavior, allocator, deployment or production approval is introduced.
Read the [transition guide](../testing/acceptance-transition.md) and
[GATE-01 card](../phases/next-iteration.md#pr-card-1--gate-01-admit-independently-reviewed-successor-suites).

The independent gate/acceptance author specified temporary Git-history decisions and expected records before the
implementer changed each corresponding boundary. Root coordinated commits and consumer integration; a separate agent
re-reviewed critical fixes. These are automated engineering reviews, not human approvals. Exact-head companion review,
protected merge and post-merge publication remain pending until recorded with actual GitHub evidence.

## Focused observations

Using pinned Node 24.20.0 and npm 11.19.0, actual focused runs established:

- Resolver and legacy-baseline tests: 93 passing cases after the exact `release-policy.json` governance reservation.
  Other root/infrastructure JSON remains unknown; mixed product/governance proposals fail. This only reserves the
  roadmap's known path and does not implement or activate a version policy.
- Preflight/bootstrap/review collection: 80 passing cases. Independent regressions first reproduced inherited startup
  code execution, missing workflow environment restrictions, wrong event/API admission and malformed package scripts.
  Both workflow copies now clear startup variables before Bash, check the same event origin and retain strict scripts.
- Runtime/admission/publication selection: 30 passing cases. Records remain tied to original source/base/run/attempt;
  local selection cannot impersonate CI. Legacy reports with unexpected admission claims are rejected.
- Original-source preparation plus release regressions: 42 passing cases across two focused commands. A newer tooling
  checkout cannot change an older report's required suite. Candidate/binding releases retain their predecessor; an
  activated successor persists. Legacy reservation bytes and retry checks remain unchanged.
- Actual consumer CLI regressions plus legacy baseline/publisher checks: 20 passing cases. Synthetic commands stop
  before real Docker/network operations. The initial regression extracted replacement-ref bytes and accepted missing
  admission mappings; corrected extraction, verification and preparation disable replacement refs, and workflow policy
  requires the exact preflight path/digest handoff. Candidate failure remains separate failure evidence and blocks
  product commands; temporary suites are removed.

These groups overlap and must not be summed as unique coverage. The preserved initial failures are tooling regressions,
not a product TDD claim. An earlier full tooling run passed 289 cases before the final preparation, reservation and
consumer cases were added. Final full validation and unchanged r3 application integration are pending below.

Local red/fixed logs remain in ignored `.artifacts/gate-*.log`; they contain no cloud credentials or application
uploads. No tests under `tests/acceptance/`, genesis `baseline.json`, original r3 contract or generated orchestrator
artifact was modified. No cloud call is needed by ordinary local selection or synthetic tooling tests.

## Trust and remaining boundaries

Trusted-base preflight precedes head-owned installs/commands, emits a canonical record outside the checkout and supplies
its digest independently to the existing same-run publisher. Initial introduction runs only the old trusted baseline
verifier and closed inline bootstrap, requiring an empty registry. Historical policy deletion cannot reopen fallback.
Workflow replacement itself still depends on exact-head review and repository controls.

The release artifact schema remains unchanged: the E2E report binds the new admission, while existing normalized
manifest/reservation identities retain historical compatibility. Future backfill needs retained independent digest
provenance; a digest copied solely from its own bundle is insufficient. Hosted profile mappings, new path classes,
release-line allocation and any cloud delivery remain separate reviewed work.
