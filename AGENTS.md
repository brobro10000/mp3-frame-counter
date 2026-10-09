# mp3-frame-counter operating contract

## Verified intent

Implement and verify the MP3 browser application and automated managed release in five ordered phases.

## Primary users

- Assessment owner using and evaluating the application

## Desired outcomes

- Accurate physical MPEG-1 Layer III frame counts and useful accessible errors.
- Independent acceptance, reproducible local containers and verified automated managed delivery.

## Constraints

- Owner authorized execution of P1 through P5 and required shell/UI actions on 2026-10-09; read docs/phases/execution-authorization.md.
- Read docs/requirements/README.md, docs/mvp.md, docs/architecture/decisions.md and docs/phases/README.md before work.
- The planning baseline is merged at 0c9f538; preserve original foundation and source/archive bytes.
- Follow phase dependencies and independent evidence; do not fabricate human review, oracle, tests or deployment results.
- Read the role in docs/agents before work; acceptance and CI gate authors remain independent of product implementers.
- P2 executable baseline and independent review precede product code; implementers cannot modify frozen tests or gates.
- Use native node:http, raw uploads, inclusive 20971520 actual-byte limit and pure synchronous physical-frame counting.
- Use separate non-root NGINX frontend and Node API images, one browser origin and configurable private upstream.
- No retained uploads, runtime parser library, database, object storage, accounts, frameworks or speculative infrastructure.
- Use one root application npm lockfile and one standalone acceptance lockfile; no workspaces.
- Keep APP-REL-001 through APP-REL-006 required for first MVP; automated deployment and recovery require actual evidence.
- Verify account, provider fit, charges, artifacts and production checks before declaring the release complete.
- Preserve core no-bypass GitHub controls and owner-only review exception; no fabricated approvals or silent control changes.
- Do not merge, exercise an owner review override or enable auto-merge without explicit instruction; production approval binds the tested release identity.
- Keep tracked paths portable; never commit secrets, personal system details, MP3 inputs, caches or private plugin implementation.
- Preserve the ignored sample identity; ordinary CI cannot require private sample bytes or local MediaInfo.
- Document every script purpose, inputs, usage, side effects and failure behavior; quote paths and propagate errors.
- Normal development and application use must not require private plugins or Codex.
- Wrap prose/comments at approximately 120 characters; preserve meaningful generated and machine formatting.

## Authority and workflow

- Treat `agents/specs/mvp.md` as the authority for product scope and acceptance behavior.
- Treat `agents/specs/system.md` as the authority for system boundaries, immutable architecture decisions,
  invariants, failure behavior, and validation. Treat `agents/architecture/` as generated views; never edit those
  views or substitute an active technology decision during phase work.
- Keep changes bounded to verified requirements and stop rather than inventing missing product facts.
- Run deterministic validation for the affected boundary and report commands actually executed.
- Preserve unrelated repository content and obtain explicit authority before destructive or external side effects.
