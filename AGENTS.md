# mp3-frame-counter operating contract

## Final submission review and teardown — 2026-10-12

The owner authorized an independent whole-submission review, concise current READMEs/architecture, component JSDoc,
normal companion-reviewed shipment of those changes, closing obsolete PRs and teardown of this application's resources.
Keep the assessed candidate immutable; author documentation/comment changes separately and preserve reproducible external
review evidence. Do not change product behavior, frozen tests, gates or dependencies to obtain a favorable verdict.
Keep accepted F-004 and genuine assessment risks visible. Preserve historical records and unrelated work. Cloud teardown
is limited to the dedicated MP3 project and local application processes; do not close a shared billing account or delete
companion credentials. Future feature or cloud work requires renewed scope.

## Product code freeze after reviewed merge — 2026-10-12

The owner's latest instruction is: "unless upcoming feedback is high risk do not make anymore code changes and just
approve the PR". This amendment takes effect after the
[verified PR #63 merge](docs/validation/backend-audio-refactor.md#product-merge-publication-and-freeze) and
supersedes the earlier "major product changes" freeze wording. Product code is frozen except for owner-authorized
high-risk feedback addressed through review. Minimal documentation may clarify the frozen behavior and
[handoff](docs/handoff/README.md).

Normal required checks and complete companion review remain mandatory. The accepted F-004 P2 checker limitation
remains unfixed and visible in the binding/review evidence and [known gaps](docs/handoff/known-gaps.md). This amendment
does not broaden shipment authorization, resume cloud delivery or claim verified production v1.0.0.

## Release visibility amendment — 2026-10-12

The owner explicitly requested: "open a quick pr to ignore the private repo req." Allow repository release publication
for the intended public or private repository. This narrowly supersedes the private-visibility prerequisite; preserve
repository identity, protected-main ancestry, exact-source mandatory checks, immutable artifacts and production gates.
See [the release requirements amendment](docs/requirements/release-process.md#repository-visibility-amendment--2026-10-12).
Product code remains frozen; this authorization changes only release eligibility and its focused tests/documentation.

## Current shipment and freeze authority — 2026-10-11

The owner subsequently instructed: finish the refactor and documentation, commit/push, obtain companion review, then
merge the PR through normal controls. This supersedes the local-only Git boundary below. Preserve separate governance,
independent candidate, actual binding and product admissions; refresh checks/review after head or base changes. No
bypass, cloud deployment, repository-setting change or production release is authorized by this amendment.

After the final product merge, freeze major product changes and complete a README-discoverable handoff covering local
startup, implemented architecture/network/upload sequence, evaluation evidence, known limits and provisional roadmap
responses. Document observed merged/published status separately from local validation and pending hosted production.

## Current local refactor authority — 2026-10-11

Execute the narrow [backend audio-count amendment](docs/requirements/backend-audio-refactor.md): handwritten computed
Xing/Info-aware audio count, opt-in diagnostics, canonical coded errors/TypeBox DTOs, Fastify factory/hooks, generated
OpenAPI and the existing React service using Ky. This local target supersedes physical-only counts, one-field errors,
Fastify-only runtime and no-new-fields rules below only for this successor work. Schema/runtime packages are exact pins;
Ky, Redocly CLI and source lint remain build tools. Frozen acceptance and generated/history artifacts stay immutable.

Prepare policy and independent successor work separately. Actual reviewed merge/binding is still required before the
normal acceptance/release gate can recognize the product change. Run local verification without pretending that local
passes constitute CI admission. Do not push, merge, publish, deploy or change remote settings under this attachment.
Historical broad merge authority does not widen this bounded local task. Preserve the recent Docker/Make handoff.

## Prior local MVP boundary — 2026-10-11

The owner's latest instruction defers Cloud Run deployment to finish the local assessment MVP quickly. Implement a
minimal React/strict TypeScript frontend against the unchanged upload contract and prepare reproducible source and
image-release handoff instructions. Continue independent companion review and normal owner merges of safe scoped PRs;
do not resume cloud apply, delivery or production deployment. Stage delivery is paused in repository settings.

Retain the working Fastify parser API, offline Redoc, two non-root runtime images, all required acceptance and automatic
software releases. The React tool policy below admits browser build dependencies only; the API runtime stays
Fastify-only. Historical cloud evidence, failures, state and cost controls remain preserved. Deferral does not mean
resources were deleted or that costs are zero.

The production `v1.0.0` finalization gate is unchanged and remains pending while hosting is deferred. Local MVP closure
and submission readiness must not be labeled a verified production release. The local startup handoff will be supplied
in the separately scoped frontend PR. This execution boundary supersedes older cloud-priority instructions for the
current task.

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
- Use only Fastify in the API runtime; React/ReactDOM and Vite are explicitly authorized browser build tools.
- Keep the React upload UI compatible with the current independently required contract; no new API fields or semantics.
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
