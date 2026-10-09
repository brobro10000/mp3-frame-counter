# P1 foundation adaptation evidence

Observed on 2026-10-09 against merged planning commit `0c9f53879c233d6650a504e5a8caa9d5bcadbaa2` and the local P1
adaptation described below. The user authorized execution of P1–P5 in the current conversation. This record is P1
handoff evidence, not a claim that acceptance, application CI or deployment has executed.

## Current repository and remote controls

The updated `npm run verify:github` passed for the exact protected-branch revision above. Its read-only audit confirmed
private `brobro10000/mp3-frame-counter`, default branch `main`, both effective rulesets and their configured controls:

- `main-pull-request-controls` (24803567): no bypass actor; current owner cannot bypass it.
- `main-review-approval` (24804693): owner `brobro10000` alone may bypass reviews during PR merges.
- Strict `control-plane` check binding to GitHub Actions integration 15368, squash-only merges, required conversations,
  no force pushes or deletion, read-only workflow permissions and Actions approval permission disabled.
- Successful current-revision foundation CI and actual main delivery in
  [run 37989067057](https://github.com/brobro10000/mp3-frame-counter/actions/runs/37989067057).

The audit now accepts either the exact protected-branch HEAD and its latest push run, or an exact open-PR revision and
its latest PR run. It reports current review state without assuming that a PR is unapproved or authored by the owner.
Main requires successful delivery; PRs require skipped delivery. A local-only revision cannot pass the remote audit. No
settings, reviews, merge permissions or external resources were changed by this adaptation.

## Ordinary CI and baseline ownership

The stable terminal gate now requires successful `validate-foundation` and `validate-product`. Both jobs always run;
missing, skipped, cancelled, failed or malformed results fail the gate. The secretless workflow still uses read-only
permissions, immutable Action pins, ephemeral checkout credentials and no `pull_request_target` event.

`run-ci-phase.mjs` derives the phase from actual acceptance, source and runtime files, including canonical
`server/src/`, `server/Dockerfile` and `frontend/` paths. In CI it requires the trusted GitHub event's base SHA and
rejects any decrease from that base's detected phase. It accepts no phase or skip argument. Foundation checks cannot be
relabeled as E2E. The controller executes these additional checks as artifacts appear:

| Detected content           | Mandatory work                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------- |
| Foundation only            | Foundation policy and terminal checks; no product claim.                           |
| Acceptance suite           | Standalone `npm ci` and `npm run check` in the acceptance package.                 |
| Parser/application source  | Verified frozen suite, isolated suite install/check, root `test:unit` and `build`. |
| API/UI/runtime integration | All previous checks plus root `test:e2e` using the isolated trusted suite.         |

Before any product work, `docs/testing/baseline.json` must contain `schemaVersion: 1`, reviewed `contractRevision`, full
`suiteCommit`, `suiteTree` and `manifestSha256`. Because main permits squash merges only, merge a separate test-only P2
PR first and freeze its actual merged main commit SHA before shipping product work. Create the freeze record after that
merge; the baseline commit cannot contain its own SHA. A local feature-branch test-only commit is a provisional review
artifact, not a production freeze. Any local product validation using that provisional identity must explicitly state
that it awaits the protected-main freeze. Squashing a combined baseline/product PR would remove the original test-only
commit from main ancestry and must fail the unchanged ancestor check.

The verifier requires the frozen commit to be an ancestor of HEAD and contain acceptance files without product source.
When a trusted base SHA is supplied, the frozen commit must already be its ancestor too. This rejects a feature-only
baseline before a product PR can pass CI and later fail after a squash merge. Local checks that omit the base SHA may
verify a provisional baseline but do not establish a protected-main production freeze. Every current suite path and byte
must match the frozen tree. Its fixture manifest is `tests/acceptance/fixtures/manifest.json`. Preserve this strict
verification for main CI; do not replace an unavailable ancestor with an arbitrary branch, tag or fetch-only reference.

For product validation, the controller extracts only the frozen suite into a temporary directory outside the product
checkout and installs its locked package independently. It passes `TRUSTED_ACCEPTANCE_ROOT` to the root E2E lifecycle
command. That reviewer-owned lifecycle command must launch the real app and invoke the suite's `e2e` script against a
validated local URL; it remains a P4 implementation and review dependency. No product script or test runner exists at
this P1 handoff, and no application test is reported as passed.

Once a freeze record exists on the trusted base, a product PR cannot change it. This initial verifier intentionally
rejects baseline amendments; a future justified amendment needs a separately reviewed extension of that process and new
evidence. It must never be silently combined with a product fix to relax expected behavior.

These controls are repository checks and independent agent ownership safeguards. They do not create a separate human
reviewer or make PR-owned workflow code tamper-proof against the sole administrator. Workflow, gate and acceptance
changes require focused independent review. The owner's explicit review exception remains limited to the separate review
ruleset and does not bypass required CI.

## Focused checks observed

Using the repository-pinned Node 24.20.0 and npm 11.19.0:

- 37 focused Node tests passed: terminal-gate subprocess results, portable GitHub-context/owner checks, portability,
  phase selection/downgrade checks and baseline verification against disposable real Git repositories.
- Baseline negative tests rejected changed fixture metadata, extra tests, mismatched tree/manifest identities,
  post-product initial baselines and altered trusted-base freeze records.
- After ancestry hardening, all six focused baseline tests passed. A real temporary Git regression rejected a local
  baseline contained in product HEAD but absent from the trusted base, accepted it after the trusted base included it,
  and kept the local provisional-check distinction explicit.
- `node scripts/policy.mjs`, `node scripts/actionlint.mjs` and `node scripts/run-ci-phase.mjs` passed at foundation
  scope.
- Targeted Prettier formatting passed for the changed scripts and workflow.
- The live read-only GitHub audit passed as recorded above. This verifies the already merged revision, not remote CI for
  the uncommitted adaptation.

Every added script documents its purpose, inputs, invocation, side effects and failure behavior. No packages were
installed by the P1 author, no application or acceptance files were created, and no Git changes were staged or committed
by this author. Root integration owns package script wiring and the subsequent full pinned validation.

## Private orchestrator boundary

Ordinary CI uses committed public tooling and never requires the installed private plugin. The historical Python adapter
remains local-only; its inherited-tool environment and the plugin's direct-validator 60-second outer timeout are still
distinct from ordinary CI. No new adapter, replayed completion result or claimed plugin validation was introduced.
Generated planning metadata and fresh direct plugin validation are separate root-owned work.

P1 ends with this reviewable handoff. P2 must independently author, check and review the executable baseline before P3
product work. P4 must provide real local image and E2E evidence, and P5 must provide actual authorized candidate,
release and recovery evidence. Passing these P1 checks does not satisfy those later gates.

## Root integration and independent review

Full pinned `npm run validate` passed after package wiring and staging the P1 scope: formatting, workflow lint, policy,
portability and all 37 gate/tooling tests passed. Root reran the eight phase/baseline tests after reviewing the
canonical `server/src/` correction. Two independent agent reviews checked generated metadata and foundation changes. The
four metadata findings and squash-only baseline sequencing finding were corrected before this handoff. This is agent
review, not an eligible GitHub human approval.

Fresh installed plugin validators passed for MVP, invariants, traceability, generated bootstrap, phase ownership and
control-plane structure. Bootstrap publication preserved a verified ignored backup. These results establish the active
planning metadata only; ordinary CI remains the explicit executor for application commands. Raw machine-local logs are
ignored under `.mvp-workflow/execution/` and are not committed as portable evidence.
