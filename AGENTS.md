# mp3-frame-counter operating contract

## Current review-policy amendment

The owner's explicit request on 2026-10-09 authorizes a PR-only approval override for `brobro10000` alone.
`docs/repository-controls.md` and its two ruleset files supersede the original no-bypass review policy retained in
the historical `agents/` planning and evidence artifacts. Core CI, PR, conversation and branch rules have no bypass.
Agents must not exercise the owner's override, merge, approve or enable auto-merge without a new explicit instruction.

## Verified intent

Prepare only the repository foundation for a future TypeScript MP3 assessment.

## Primary users

- Assessment owner and independent repository reviewers

## Desired outcomes

- An open foundation PR with reproducible tooling, meaningful CI and enforced main merge requirements.

## Constraints

- Implement only phase-01-repository-foundation; do not start future application phases.
- Configure only the authorized owner review override; do not merge, approve, enable auto-merge or bypass core controls.
- Use npm tooling; no application framework or application test framework is selected.
- Run npm ci and npm run validate; report actual results and validate the current PR revision.
- Never commit secrets, MP3 inputs, local caches or private orchestrator implementation files.
- Use existing authentication; never print credentials or add administration credentials to CI.
- Review workflows, permissions, protection and dependency changes as sensitive repository controls.
- Wrap prose and comments at approximately 120 characters; preserve deterministic generated files.

## Authority and workflow

- Treat `agents/specs/mvp.md` as the authority for product scope and acceptance behavior.
- Treat `agents/specs/system.md` as the authority for system boundaries, immutable architecture decisions,
  invariants, failure behavior, and validation. Treat `agents/architecture/` as generated views; never edit those
  views or substitute an active technology decision during phase work.
- Keep changes bounded to verified requirements and stop rather than inventing missing product facts.
- Run deterministic validation for the affected boundary and report commands actually executed.
- Preserve unrelated repository content and obtain explicit authority before destructive or external side effects.
