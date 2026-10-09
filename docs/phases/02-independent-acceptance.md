# P2 — Independent acceptance baseline

Status: proposed future phase, **not authorized by P0**. Trace: APP-V1-002–005,009,010,013; AC-01–12 design; R-01,02,03.

## Objective

Create and review a test-only executable contract with independent oracle evidence before any product implementation.

## Prerequisites

Separate P2 authorization and reviewed P1 handoff; freeze acceptance-contract decisions with actual human review;
authorized MediaInfo/browser/tool availability and fixture redistribution rights. No parser/API/UI/runtime-image source
may precede this baseline.

## Owned paths and read-only dependencies

`tests/acceptance/` package/lockfile, specs, fixture manifest and licensed inputs/recipes, optional runner Dockerfile,
test-only negative controls; `docs/testing/` and observed oracle evidence. Narrow harness CI/tooling changes require
reviewer ownership and explicit review separate from product work.

Read-only inputs: Requirements, primary format sources, approved contract, foundation policy and supplied ignored
sample. Product implementation sources are excluded from the acceptance-author context.

## Proposed commands, not P0 observations

Proposed `mediainfo --Version`, full JSON and Audio FrameCount commands with quoted FILE; standalone harness
type/lint/fixture checks; targeted wrong-count/shape negative controls. Future `make e2e-check` only when implemented
under this phase; no real application E2E pass before an app exists.

## Acceptance evidence and human review

Tool/version/command/sample hash and reviewed physical-count reconciliation; fixture license/provenance, three distinct
counts, exact-limit construction; observed negative controls; suite commit and manifest hash with review record before
P3. Separately report application acceptance not run/blocked.

Review focus: Independence, AC-01–12 coverage, actual-byte/no-Content-Length behavior, genuine assertions, portable
fixtures and no hidden product imports. The runner context includes only acceptance files and no Docker socket; it is
not a default third service.

## Non-goals and stop conditions

No production parser, HTTP/UI stub, runtime app Dockerfiles/Compose, cloud services or success mocks. Missing
oracle/tool or unresolved contract blocks freeze. Stop at a reviewed, recorded test-only baseline and reviewable PR;
never advance automatically.

Read [phase rules](README.md) and the [acceptance-author role](../agents/acceptance-author.md) and
[reviewer](../agents/reviewer.md). A reviewable PR handoff does not authorize its merge; locally validated, CI-passed,
reviewed, merged and deployed remain distinct states.
