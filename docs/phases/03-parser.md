# P3 — Pure parser

Status: proposed future phase, **not authorized by P0**. Trace: APP-V1-004,005,009,010,013,016; R-01,02,11.

## Objective

Implement the TypeScript physical MPEG-1 Layer III frame counter and small typed failures against independent
expectations.

## Prerequisites

Separate P3 authorization, reviewed P2 baseline commit/fixture hash and resolved tag/header/counting policy. Verify
baseline review predates parser work.

## Owned paths and read-only dependencies

`server/src/` parser/error modules, app parser unit tests and minimal application TypeScript/build tooling; observed
sample reconciliation and phase documentation. No `server/Dockerfile` yet. Acceptance and gate paths remain read-only to
the product implementer.

Read-only inputs: Frozen acceptance package/fixtures/counts, primary format decisions, immutable source captures and
requirements. Any baseline or gate amendment needs a distinct reviewed change.

## Proposed commands, not P0 observations

Planned application typecheck/build and built-in Node parser unit tests; known-count cases from reviewed independent
fixtures; authorized sample validation/reconciliation. Commands must exist and execute real work before they can be
reported as passed.

## Acceptance evidence and human review

CBR/VBR/padding/tag/header-like payload counts, malformed/truncated/unsupported failures, complete metadata-frame
convention, no external parser dependency and actual supplied-sample agreement or explicit blocker. Preserve failures
and baseline identity.

Review focus: Pure deterministic parser boundary, safe offset/header/length checks, exact end handling and meaningful
tests, with no duration estimate, metadata-total oracle or corruption resync. Review residual assessment limitations
honestly.

## Non-goals and stop conditions

No API, browser UI, runtime containers, Compose, provider code, deployment or acceptance fixture edits. A count
disagreement returns to independent oracle review rather than changing expected values. Stop at parser PR/evidence
handoff.

Read [phase rules](README.md) and the [implementer role](../agents/implementer.md) and
[reviewer](../agents/reviewer.md). A reviewable PR handoff does not authorize its merge; locally validated, CI-passed,
reviewed, merged and deployed remain distinct states.
