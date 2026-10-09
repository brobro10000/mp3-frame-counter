# Phase 3: end-to-end application and independent containers

Canonical ID: `phase-03-v1-integration-containers`. Status: planned; depends on accepted Phase 2 and explicit Phase 3
authorization. The release-target decision below must be resolved before implementing its delivery integration.

## Objective and prerequisites

Expose the verified parser through the native HTTP API and static UI, independently package both services and prove the
complete flow through the frontend origin. Read the MVP, architecture, implementer role and accepted parser evidence.
Verify Docker/Compose/Make availability and maintained Node/NGINX image versions/digests during implementation.

Trace: `APP-V1-001`–`003`, `006`–`012`; `APP-REQ-001`–`006`; `APP-SUB-002`/`003`; all `APP-REL-001`–`006`.

## Owned paths and deliverables

One serial task, `TASK-V1-03`, owned by the implementer role, to avoid overlapping API/build/CI writers. Planned writes:
`server/`, `frontend/`, `tests/`, `scripts/`, `tsconfig.json`, `Makefile`, `compose.yaml`, `.dockerignore`,
`package.json`, `package-lock.json`, `.github/workflows/ci.yml`, `README.md`, `docs/mvp.md`, relevant
requirements/validation documentation and phase evidence. Fixed decisions in the system contract remain outside this
implementation task's write authority.

- Implement raw upload routes, typed error mapping, actual-byte enforcement, interrupted-request cleanup and `/healthz`.
- Add the accessible minimal UI with duplicate-submission prevention and network/non-JSON error handling.
- Implement the two Dockerfiles and independent build contexts, non-root runtimes, verified immutable image pins,
  graceful API shutdown, real health checks and Compose's healthy-API dependency.
- Configure matching proxy/API limits, upstream HTTP/1.1, disabled request buffering, tmpfs temporary paths and JSON
  proxy errors without masking API errors. Publish only the frontend on loopback by default.
- Add the eight Make targets and reproducible instructions. Test quoted sample paths, bounded startup, propagated
  failures, project-only teardown and independent `api`/`frontend` builds.
- Add real API and Compose smoke checks to required CI; always clean up containers. PR jobs have no release credentials.
- Deliver separate commit-addressed image archives and instructions only after validating the merged revision.

## Required release work and decision gate

The brief's artifact-only workflow does not discharge the existing release amendment. Before this portion starts, record
an authorized **non-cloud** deployment target and operator/access model, automatic version policy, private tag/ release
publication rules, artifact retention and recovery procedure. Do not assume a hosted CI runner is the permanent target,
expose the local unauthenticated service publicly, or introduce a new credential/account as an implicit choice.

Implement `APP-REL-001`–`006`: gated automatic release execution, exact artifact identity, automatic versions and
private releases, deployed health/upload checks, failure visibility, retry/concurrency behavior and rehearsed recovery.
Version assignment may precede deployment; successful release publication follows verification. Retain a usable prior
known-good artifact and define first-deployment recovery. Do not overwrite a published version with different bytes.

External execution, including merges, release publication, deployment or a recovery rehearsal, needs the relevant
authorization. Prepare and validate the concrete implementation before any required approval step. If the target remains
unresolved, report the integration work achieved and keep release criteria pending; do not mark V1 complete or silently
move those criteria to a later MVP.

## Acceptance and validation

Run the expanded source checks and built-in Node tests for valid, empty, malformed, unsupported and oversized requests;
actual limits without Content-Length; client interruption; route/method/error contracts and exact success JSON.

Build `api` and `frontend` independently from clean contexts. Run Compose checks for both healthy services, HTML,
successful uploads, a known-valid file above 1 MiB, exact/over-limit bodies, preserved API errors and unavailable API
JSON errors. Use independently generated fixtures. Verify the supplied sample through the frontend and reconcile its
count again. Manually verify accessible UI states, duplicate-submission handling and unexpected-response behavior.

Execute and document all Make targets after they exist. Record image digests, revisions, commands, CI jobs and actual
results. The planned executor adapter is `python3 scripts/validate_v1_integration.py --project-root . --json`; it is
currently a declaration, not an implemented or passing command. Its later fixed checks must cover real application and
container behavior, with release evidence reported separately from PR validation.

## Human review and stop conditions

Review transport cleanup, MIME/encoding rules, physical counts, proxy status fidelity, loopback binding, non-root image
contents, dependency/image integrity, CI permissions and artifact/recovery provenance. Confirm deployment retention
outlives the recovery requirement rather than inheriting seven days without justification.

End implementation with a scoped PR and evidence report. After separately authorized merge/deployment, audit observed
main delivery and all release requirements. Stop on unresolved target/access, sample discrepancy, image/proxy failure,
missing real evidence or an unapproved change to fixed architecture. No automatic next MVP or public/cloud deployment.
