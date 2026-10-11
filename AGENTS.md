# mp3-frame-counter operating contract

## Verified intent

Maintain the verified V1 MP3 browser application and automated GitHub releases; scope subsequent iterations separately.
Read docs/requirements/release-process.md and the later docs/phases/roadmap-execution-authorization.md amendment.

The owner authorized continued roadmap execution on 2026-10-10, including scoped PRs, companion reviews, clean merges
and automatic stage delivery. Follow docs/phases/roadmap-execution-authorization.md and bounded cards in
docs/phases/next-iteration.md. Production deployment/promotion requires human intervention for the exact candidate.

The owner's latest priority is the bounded production V1 in docs/deployment/v1-delivery.md. Reuse existing release
verification and hosted acceptance; defer generalized delivery frameworks and optional hardening. The three current
completion cards supersede earlier next-step ordering without weakening required checks or the human production gate.

## Primary users

- Assessment owner using and evaluating the application

## Desired outcomes

- Accurate physical MPEG-1 Layer III frame counts and useful accessible errors.
- Independent acceptance, reproducible local containers and releases of exact tested images without deployment.

## Constraints

- Owner authorized execution of P1 through P5 and required shell/UI actions on 2026-10-09; read docs/phases/execution-authorization.md.
- Read docs/requirements/README.md, docs/mvp.md, docs/architecture/decisions.md and docs/phases/README.md before work.
- Read docs/validation/execution-status.md for current progression and dated evidence; local/PR passes are not publication.
- Read docs/validation/v1-closure.md for the verified V1 release and carryover limits before planning later work.
- PR #7 closure merged at 92807357 and published v0.1.7; prior P1–P5 authority is not new iteration scope.
- Read docs/roadmap/README.md and docs/phases/next-iteration.md for the next bounded work and named decision gates.
- Preserve dated handoff results and original captures; update current status with exact revision/run evidence when it changes.
- The planning baseline is merged at 0c9f538; preserve original foundation and source/archive bytes.
- Follow phase dependencies and independent evidence; do not fabricate human review, oracle, tests or deployment results.
- Read the role in docs/agents before work; acceptance and CI gate authors remain independent of product implementers.
- P2 executable baseline and independent review precede product code; implementers cannot modify frozen tests or gates.
- Preserve raw uploads, the inclusive 20971520-byte limit and pure physical-frame parser with the released Fastify transport.
- Fastify shipped in PR #19/v0.2.19; offline Redoc/OpenAPI shipped in PR #24/v0.2.24 with required docs-v1 acceptance.
- Use separate non-root NGINX frontend and Node API images, one browser origin and configurable private upstream.
- No retained uploads, runtime parser library, database, object storage, accounts or speculative infrastructure.
- Use only the approved exact Fastify runtime dependency; its adoption does not authorize unrelated frameworks.
- Use one root application npm lockfile and one standalone acceptance lockfile; no workspaces.
- Apply the active release-only criteria in APP-REL-001 through APP-REL-006; hosted criteria are deferred.
- Local release preparation archives exact tested images only; never treat its provisional version or manifest as deployed.
- Verify protected-main CI, exact artifacts and GitHub publication before declaring a repository release complete.
- Provider fit, charges, production approval and hosted checks apply only when deployment is explicitly resumed.
- Preserve core no-bypass GitHub controls and owner-only review exception; no fabricated approvals or silent control changes.
- Do not merge, exercise an owner review override or enable auto-merge without explicit instruction.
- Exact-release production approval applies only when deployment is explicitly resumed.
- Keep tracked paths portable; never commit secrets, personal system details, MP3 inputs, caches or private plugin implementation.
- Preserve the ignored sample identity; ordinary CI cannot require private sample bytes or local MediaInfo.
- Document every script purpose, inputs, usage, side effects and failure behavior; quote paths and propagate errors.
- Normal development and application use must not require private plugins or Codex.
- Wrap prose/comments at approximately 120 characters; preserve meaningful generated and machine formatting.

## Authority and workflow

- Treat `agents/specs/mvp.md` as the baseline for product scope and acceptance behavior. The later owner amendment in
  `docs/requirements/release-process.md` supersedes its deployment-before-release criteria for this milestone.
- Treat `agents/specs/system.md` as the authority for system boundaries, immutable architecture decisions,
  invariants, failure behavior, and validation. Treat `agents/architecture/` as generated views; never edit those
  views or substitute an active technology decision during phase work.
- The roadmap is the later human-readable planning amendment for future architecture. Preserve generated `agents/**`
  snapshots; ordinary CI remains authoritative for execution evidence. Regeneration needs a separately scoped migration.
- Keep exactly three detailed next PR cards; later work stays provisional. GATE-01 precedes successor suites,
  VER-01 precedes release-line activation, and compatible tooling precedes live extended-queue syntax.
- Preserve immutable r3 genesis evidence. Review docs/testing/acceptance-transition.md and the current state in
  docs/phases/next-iteration.md. PR #24/v0.2.24 activated the bound docs-v1 suite: all 72 local cases remain required for
  descendants and reverts. PR #25/v0.2.25 published the dormant hosted-profile protocol. Candidate controls, declaration
  validation and software publication do not establish hosted execution or application deployment.
- Use the current three-card window as the source of active scope rather than historical next-step prose. Keep
  independent acceptance/governance expectations separate from their implementation, and preserve actual main ancestry
  when reconciling stacked PRs. Refresh checks and companion review after head/base changes; merge in dependency order.
- Merge approved PRs promptly after checks and prerequisites pass; immediately update direct dependents onto actual
  merged main and refresh their checks/review. Avoid accumulating completed stack layers.
- Apply stacked PRs and disjoint subagent domains throughout the remaining version progression to v1. Parallel authoring
  does not remove prerequisite publication, immutable binding or every production deployment's human gate.
- Keep changes bounded to verified requirements and stop rather than inventing missing product facts.
- Run deterministic validation for the affected boundary and report commands actually executed.
- Run `npm run check:mermaid` for diagram changes; all tracked Markdown Mermaid fences and standalone diagrams must render.
- Mermaid account widgets and GitHub diagram-sync checks are not parser evidence; see docs/validation/mermaid.md.
- Keep implemented source-linked diagrams canonical in docs/architecture/diagrams/; maintain their frontmatter references.
- Keep planned diagrams canonical in docs/roadmap/diagrams/ and link them from prose. Label future behavior explicitly.
- Limit automatic Mermaid rewriting to the three files opted in by .mermaidignore; preserve requirements and history.
- Review bot diagram commits against source and require fresh CI; do not duplicate their bodies in Markdown.
- Preserve registered original captures; rendering derivatives must link their originals and record any storage mapping.
- Preserve unrelated repository content and obtain explicit authority before destructive or external side effects.
