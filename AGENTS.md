# MP3 frame counter operating contract

## Current authority

- Current authorization is P0 planning documents and read-only research only. Stop for human review after this task.
- Read `docs/requirements/README.md`, `docs/mvp.md`, `docs/architecture/decisions.md` and `docs/phases/README.md` first.
- The unified brief supersedes the earlier three-phase, no-cloud and manual-browser-only draft. Plans remain proposed.
- PR #1 is merged at `143498a`; preserve that foundation. Do not recreate the repository or invent test-first history.
- Each P1–P5 phase needs separate authorization and ends at a reviewable PR/evidence handoff. Never advance implicitly.
- There is no active generated execution plan. Superseded contracts are archived under `agents/history/`.
- Read `agents/README.md` before using the installed orchestrator. Do not execute archived plans or fabricate approvals.

## Requirements and roles

- Cross-reference stable APP requirement IDs, AC-01–AC-12 and actual tested revisions in future work.
- Read the selected phase document and its role in `docs/agents/`: acceptance-author, implementer, reviewer or release-
  operator.
- P2 must establish an independently authored, reviewed test-only baseline before parser, API, UI or runtime images.
- Implementers may read the baseline but cannot alter its tests, fixtures, counts, thresholds or gate logic to pass.
- Proposed test contracts and Markdown roles do not prove executable tests, enforced access or independent human review.
- Preserve TypeScript/native node:http, raw uploads, the inclusive 20,971,520-byte bound and pure physical-frame
  counting.
- Preserve separate static NGINX/frontend and Node/API images, one browser origin and no retained uploads or runtime
  parser dependency.
- Use one application npm lockfile plus the expressly allowed standalone acceptance package/lockfile; no workspace
  platform.
- Keep APP-REL-001–006 in the first functional MVP, including versions/releases, candidate tests and verified recovery.
- Managed hosting must pass provider-fit, account, budget and exact-release approval gates before the relevant external
  actions.

## Repository and evidence discipline

- Preserve the owner-only review override in `docs/repository-controls.md`; the separate core ruleset has no bypass.
- GitHub self-approval is not available. Never approve, merge, exercise an override or enable auto-merge without
  explicit instruction.
- Production approval is separate from PR review and binds the tested release pair and configuration.
- Keep tracked paths portable. Never commit secrets, host output, MP3 inputs, caches or private plugin implementation.
- Preserve original source captures and historical evidence byte for byte. The ignored sample is not a CI prerequisite.
- Document every future script's purpose, inputs, usage, side effects and failure behavior. Quote paths and propagate
  failure.
- Distinguish observed, documented, proposed and blocked evidence. Do not present foundation checks as application
  acceptance.
- During P0 use existing nonmutating checks only: no dependency installs, application/tests/adapters/configuration or
  service changes.
- Normal application operation must not require Codex or the private orchestrator.
- Wrap prose/comments at approximately 120 characters; preserve meaningful machine and generated formatting.
