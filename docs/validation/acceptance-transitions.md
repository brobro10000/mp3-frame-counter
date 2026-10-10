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

## Integrated local verification — 2026-10-10

After rebasing onto PR #10's protected-main merge `cdfd37be7d2f99a20df90b8bb1b42097f7a242ce`, clean source
`2921e31f4e83d91eff3fda8a1c4bfd063abed306` passed:

- `npm run validate`: formatting, actionlint 1.7.12, policy/portability, 19/19 Mermaid renders, 20/20 terminal-gate
  tests and 304/304 tooling tests, with no failures or skips.
- `CI_BASE_REF=<exact main base> npm run check:phase`: standalone r3 harness controls, 75/75 unit tests, TypeScript
  build, both real application containers and 60/60 browser/HTTP acceptance cases; scoped cleanup passed.
- The first local export refused native ARM images at the existing `linux/amd64` guard before reservation/export. This
  expected platform limitation was retained, not suppressed. Repeating the complete phase with
  `DOCKER_DEFAULT_PLATFORM=linux/amd64` passed all 75 unit and 60 acceptance cases on the intended image platform.
- `npm run prepare:release` exported the exact tested AMD64 image IDs. A second invocation reported `reused: true`;
  SHA-256 comparison of every prepared file confirmed unchanged bytes. The local preview is `0.1.34`, derived from the
  feature history; it is not the future squash release version, a tag, publication or deployment.

The local report records `sourceDirty: false`, required genesis commit `a0a56d94e5457101cd043b6055ab084782c3e16f`,
`localSelection.kind: local-acceptance-resolution` and no CI admission. Reservation SHA-256 is
`af6666227841c9fa877164450ab3c19af1251dd42012c60db716399542b88b4a`. The later documentation amendment does not relabel
these runs as tests of a newer source. CI will verify the actual PR merge source and trusted bootstrap separately.

PR #10's [main run 38035910679](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38035910679) passed and
published [v0.1.10](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.1.10), with ten assets targeting
the base above. Its companion
[automated approval](https://github.com/brobro10000/mp3-frame-counter/pull/10#pullrequestreview-5478201971) covered
exact head `3b1bf0b7a49b7eb6b543d71dcda355318b1efaff`; owner `brobro10000` merged without bypass. This predecessor
release is observed metadata; its archive bytes were not downloaded or rehashed here. GATE-01 publication remains
pending.

## First companion review and documentation correction — 2026-10-10

[PR #11 CI run 38036374535](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38036374535) passed for head
`de938711baf7afd0588d793f108f10ea117e74b4`, including both trusted bootstrap steps. Companion run
`20261010T080456-e4b70f4a` reviewed all 39 changed paths and returned `request_changes`: the roadmap retained an undated
claim that bootstrap declarations were unapplied, and the runbook linked to the retired COST-BOOTSTRAP card. No blocking
runtime defect was identified; that is a review result, not a guarantee of correctness.

The correction links the completed bootstrap observations consistently, preserves mandatory live cap rechecks and
replaces the runbook's stale CI-pending wording with its dated successful run. It adds no fourth active card. The
original report and receipt remain in the companion's durable records; no approval was published for that head.
Formatting and changed-link checks passed locally. Fresh CI and exact-head companion review remain required for this
documentation correction, followed by actual main publication and publisher-only retry verification.
