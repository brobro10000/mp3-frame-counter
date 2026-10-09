# mp3-frame-counter operating contract

## Verified intent

Plan V1: a small MP3 browser application with a TypeScript frame counter and independent frontend/API containers.

## Primary users

- Assessment owner using and evaluating the application

## Desired outcomes

- Reviewed planning documents and traceable contracts for three separately authorized phases.
- A correct MP3 count with reproducible local operation and the required first-MVP release cycle.

## Constraints

- Current authorization is planning only; do not implement application or infrastructure files or mutate GitHub.
- Read docs/requirements/README.md, docs/mvp.md and docs/architecture/v1.md before working.
- Use docs/architecture/v1-decisions.md to reconcile the supplied brief with prior user decisions.
- Read docs/phases/README.md and the selected phase; agents/execution/mvp-plan.yaml is the canonical phase plan.
- Explicitly load docs/agents/implementer.md or docs/agents/reviewer.md for the role being performed.
- Phase 1 is next; every phase requires explicit authorization and stops before the next phase or a merge.
- Preserve the owner-only PR review override in docs/repository-controls.md; core rules have no bypass.
- Never approve, merge, exercise an override or enable auto-merge without an explicit instruction.
- Keep APP-REL-001 through APP-REL-006 required for V1; unresolved release-target choices block completion.
- Preserve stable APP IDs and link implementation and actual validation evidence to tested revisions.
- Use native Node HTTP, a bounded 20 MiB Buffer, pure TypeScript parsing and no runtime external audio parser.
- Keep separate frontend/API containers and local loopback exposure; no cloud hosting is selected.
- Use npm and one lockfile, built-in Node tests and thin Make wrappers; document each script purpose and usage.
- Run npm ci and npm run validate with pinned tools; future checks must exist and execute real work.
- Keep tracked paths portable; never commit secrets, MP3 inputs, host output, caches or private plugin code.
- Preserve the ignored local sample at docs/requirements/samples/assessment-sample.mp3 and its recorded hash.
- Preserve source captures byte for byte and historical evidence under agents/history/foundation and agents/outputs.
- Planning validation is not application, phase execution, human approval, release or deployment evidence.
- Do not install host packages or change accounts implicitly; report missing tools and concrete prerequisites.
- Wrap prose/comments at approximately 120 characters; preserve deterministic generated formatting.

## Authority and workflow

- Treat `agents/specs/mvp.md` as the authority for product scope and acceptance behavior.
- Treat `agents/specs/system.md` as the authority for system boundaries, immutable architecture decisions,
  invariants, failure behavior, and validation. Treat `agents/architecture/` as generated views; never edit those
  views or substitute an active technology decision during phase work.
- Keep changes bounded to verified requirements and stop rather than inventing missing product facts.
- Run deterministic validation for the affected boundary and report commands actually executed.
- Preserve unrelated repository content and obtain explicit authority before destructive or external side effects.
