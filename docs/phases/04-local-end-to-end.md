# P4 — Integrated local product

Status: execution authorized by the [later owner instruction](execution-authorization.md); original phase criteria
follow. Trace: APP-V1-001–010,013,016; AC-01–12; R-03,05,11.

## Objective

Add native API, static browser UI, independent runtime images and two-service local operation; satisfy real
public-ingress acceptance.

## Prerequisites

Separate P4 authorization, reviewed parser handoff, frozen acceptance baseline and verified build/runtime prerequisites.
Select reviewed memory/admission/time budgets and actual maintained image pins/platform before builds.

## Owned paths and read-only dependencies

`server/src/` HTTP/lifecycle modules, app unit/integration tests, `server/Dockerfile`, `frontend/`, root Compose/Make
and minimal build documentation. CI/gate additions have reviewer-owned scope and cannot weaken the baseline. No provider
setup/configuration.

Read-only inputs: Approved parser/contract, independent acceptance suite/fixtures/thresholds, release and architecture
requirements. Product implementer cannot change acceptance tests or gate logic to pass.

## Proposed commands, not P0 observations

Future `make check`, independent clean API and frontend builds, `make up`, `make e2e BASE_URL=<validated-local-origin>`,
reviewed sample smoke, bounded stop/restart and scoped `make down`. Host/CI lifecycle cleanup runs on failure as well as
success.

## Acceptance evidence and human review

Both clean independent builds; image contents/non-root/entrypoint review; actual AC-01–12 local outcomes through
frontend ingress; separately labeled API diagnostics; observed size/abort/proxy recovery and resource/shutdown behavior.
Mandatory real E2E is now part of the stable terminal gate.

Review focus: Exact-limit valid uploads and usable +1/chunked 413; one origin, no retention/logging, tmp paths,
duplicate/retry UI, binary/status preservation and fail-closed CI. No earlier-phase selector may bypass required E2E.

## Non-goals and stop conditions

No cloud resources, candidate deployment, production approval or automated merge. Missing mandatory evidence blocks
acceptance; no fixture/gate relaxation. Stop with a reviewable integrated-product PR and reproducible local evidence.

Read [phase rules](README.md) and the [implementer role](../agents/implementer.md) and
[reviewer](../agents/reviewer.md). A reviewable PR handoff does not authorize its merge; locally validated, CI-passed,
reviewed, merged and deployed remain distinct states.
