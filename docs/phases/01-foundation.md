# P1 — Verify and adapt the foundation

Status: execution authorized by the [later owner instruction](execution-authorization.md); original phase criteria
follow. Trace: APP-V1-008,010,011,013; R-03,06,09,10.

## Objective

Reuse merged PR #1 and make the foundation ready for acceptance-first work without adding product implementation.

## Prerequisites

Separate P1 authorization; reviewed P0 scope and source reconciliation; verify repository identity/default branch and
current controls before any later mutation. The existing foundation is input, not proof the new P1 exit passed.

## Owned paths and read-only dependencies

`AGENTS.md`, `README.md`, foundation documentation; existing `scripts/`, root development-tooling files and `.github/`
only for reviewed foundation adaptation. Supported `agents/` planning metadata only after required inputs are actually
reviewed. Keep canonical generated paths contract-defined.

Read-only inputs: Original source captures, historical archives/results, requirements, proposed acceptance/architecture
and current ruleset intent. Preserve existing owner-only review exception and core controls.

## Proposed commands, not P0 observations

Read-only Git/GitHub identity/rules/check inspection; existing pinned `npm run validate`; revise/re-run
`npm run verify:github` after removing its obsolete open-foundation-PR assumption. Dependency installation or settings
changes require the scope of the later P1 authorization; none ran in P0.

## Acceptance evidence and human review

Actual pinned-tool validation; live required-check/app identity and two-ruleset audit; documented test/workflow
ownership and trusted-baseline design; reviewed ordinary-CI/plugin handoff. The current control-plane check is
historical evidence to verify live, not a guessed new name.

Review focus: Fail-closed gate, least privilege, no new bypass, no future E2E phase downgrade, private-repo reviewer
limitations, narrow changes to foundation-only policy assertions. Review the direct Python/60-second plugin boundary
before any adapter proposal.

## Non-goals and stop conditions

No fixture generation, acceptance suite, parser/API/UI, runtime containers, managed resources, release execution or
merging. Stop with a reviewable adaptation PR/evidence handoff; unresolved input blocks its operation, not unrelated
documentation. Do not start P2.

Read [phase rules](README.md) and the relevant [role instructions](../agents/reviewer.md). A reviewable PR handoff does
not authorize its merge; locally validated, CI-passed, reviewed, merged and deployed remain distinct states.
