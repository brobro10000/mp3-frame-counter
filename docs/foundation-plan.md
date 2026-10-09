# Foundation phase and decisions

Only `phase-01-repository-foundation` is authorized. Its branch is `codex/phase-01-repository-foundation`, based on
`main`, with one open PR as the stopping point.

The sequence below records the original setup. The owner's 2026-10-09 amendment now permits only `brobro10000` to
override approval requirements during PR merges. The current two-ruleset policy is documented in
[repository controls](repository-controls.md); the original no-bypass policy remains in historical planning artifacts.

1. Inspect the local project, GitHub identity, private repository support and installed orchestrator.
2. Establish `main` with one documentation-only bootstrap commit, then activate no-bypass review protection.
3. Use the installed orchestrator's definition, system, bootstrap, bounded planning and prompt contracts.
4. Implement pinned repository tooling, validation, main-only source delivery and versioned merge policy.
5. Validate locally; push the branch and open the PR; observe the real check name and GitHub integration.
6. Bind that exact check, inspect effective controls and current-revision CI, and leave the PR blocked for review.

The initial bootstrap exception is `59de7232f8f905f55f07be6308a1617a4ef76db9`. It changed only README.md. The active
ruleset was created before publishing any implementation work. There are no additional direct-main commits.

## Decisions

- Use npm with exact development dependencies and a lockfile. JavaScript scripts provide repository tooling for this
  future TypeScript project; they are not application scaffolding. Defer HTTP and application test frameworks.
- Use GitHub-hosted Ubuntu 24.04 runners, read-only validation permissions and SHA-pinned official Actions.
- Use one validation job and one unique terminal gate. The gate runs with `always()` and requires explicit success for
  every mandatory dependency. Negative tests execute the actual gate process with synthetic result inputs.
- Keep delivery in the same workflow after the terminal gate, restricted to `push` on `refs/heads/main`.
- Use a seven-day GitHub Actions source artifact. No hosting, cloud credentials, containers or public releases.
- Keep administrative mutation out of CI. A local read-only verification script checks actual effective GitHub state.
- Keep CODEOWNERS and code-owner enforcement deferred until a verified independent owner and review arrangement exist.
  The one-review rule remains active with the owner's explicitly authorized PR-only exception.
- Preserve historical orchestrator-generated artifacts. Schema-v1 artifacts are sufficient; no architecture migration,
  advanced receipts, automation, plugin upgrade or private implementation vendoring is needed.

## Acceptance and evidence boundaries

Local `npm ci` and `npm run validate` must succeed. `npm run verify:github` must observe the current PR revision,
successful bound gate, active merge protections, review-required status and skipped PR delivery. Neither local negative
tests nor a green CI run prove that force-push or deletion attempts were performed: no destructive checks are
authorized. Remote evidence is read from GitHub's effective rules and PR state.

The current audit also verifies the exact owner's PR-only review exception and the absence of bypass actors on core
rules. GitHub can continue to report an unapproved PR as blocked until the owner explicitly selects the override.

The installed `execute-mvp-phase` accepts direct Python validators, so `scripts/validate_phase.py` adapts the actual npm
validation and read-only GitHub audit into its result envelope. It is used locally, requires the existing gh
authentication, and is never required by normal CI. Its output does not claim main delivery or application readiness.

The workflow ends with an open PR. The owner override is configured but not exercised. No merge, auto-merge, approval,
reviewer invitation, account change or application phase follows. A later human merge requires either the ordinary
review requirements or the owner's explicit override, with all core requirements satisfied in either case.
