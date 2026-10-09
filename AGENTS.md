# mp3-frame-counter operating contract

## Current review-policy amendment

The owner's explicit request on 2026-10-09 authorizes a PR-only approval override for `brobro10000` alone.
`docs/repository-controls.md` and its two ruleset files supersede the original no-bypass review policy retained in
the historical `agents/` planning and evidence artifacts. Core CI, PR, conversation and branch rules have no bypass.
Agents must not exercise the owner's override, merge, approve or enable auto-merge without a new explicit instruction.

## Verified intent

Prepare the repository foundation and maintain a central, source-backed reference for the future TypeScript MP3
assessment. Requirements capture and sample organization do not authorize application implementation.

## Primary users

- Assessment owner and independent repository reviewers

## Desired outcomes

- An open foundation PR with reproducible tooling, meaningful CI and enforced main merge requirements.
- A central requirements registry with stable IDs and preserved source material for all future work.

## Constraints

- Current scope includes foundation maintenance, requirements documentation and local sample organization.
  Do not start an application phase without explicit user authorization.
- Configure only the authorized owner review override; do not merge, approve, enable auto-merge or bypass core controls.
- Use npm tooling; no application framework or application test framework is selected.
- Run npm ci and npm run validate; report actual results and validate the current PR revision.
- Never commit secrets, MP3 inputs, local caches or private orchestrator implementation files.
- Keep tracked paths repository-relative; discover checkout roots and tool locations at runtime. Do not commit
  personal home directories, local tool-install paths, editor state or raw machine-specific validation output.
  Run `npm run check:portability`; document any privacy redaction without changing historical results or their hashes.
- Keep the supplied local sample at `docs/requirements/samples/assessment-sample.mp3`, ignored by Git.
  Preserve its bytes and the checksum recorded in `docs/requirements/samples/README.md`.
- Use existing authentication; never print credentials or add administration credentials to CI.
- Review workflows, permissions, protection and dependency changes as sensitive repository controls.
- Wrap prose and comments at approximately 120 characters; preserve deterministic generated files.

## Authority and workflow

- Read `docs/requirements/README.md` and `docs/requirements/assessment.md` before planning future work.
  The assessment registry is the normalized application contract; its preserved source and explicit later user
  decisions resolve transcription errors or amendments. Do not turn open decisions or optional tips into mandates.
- Cite applicable stable requirement IDs and source sections in plans, tasks, tests and PR descriptions. Link
  implementation and test evidence back to those IDs; mark items verified only from actual results for a named revision.
- Preserve source files under `docs/requirements/sources/` byte for byte. Record provenance and supersession for new
  versions, keep requirement IDs stable, and report source ambiguities instead of silently inventing behavior.
- Treat `agents/specs/mvp.md` and `agents/specs/system.md` as the original foundation-phase contracts, not the complete
  application specification. Their generated plans and outputs remain historical; current requirements and the review
  amendment above supersede conflicting historical scope/policy statements. Do not rewrite historical validation
  outcomes. Explicitly authorized privacy redactions must identify changed fields and retain original/sanitized
  checksums, with no claim that redacted copies are verbatim outputs or freshly validated evidence.
- Treat `agents/architecture/`, if generated later, as generated views; do not hand-edit them or silently replace
  approved architecture decisions.
- Keep changes bounded to verified requirements and stop rather than inventing missing product facts.
- Run deterministic validation for the affected boundary and report commands actually executed.
- Preserve unrelated repository content and obtain explicit authority before destructive or external side effects.
