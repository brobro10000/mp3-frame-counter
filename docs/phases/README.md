# Proposed phase order

P0 is the current documents/research task and stops for human review. The five future phases below are dependencies, not
authorization. PR #1's merged foundation remains factual history; none of the new phase exits is claimed complete. No
separate execution-state machine is maintained in these documents. Generated metadata is
[blocked pending reviewed inputs](../../agents/README.md).

| Phase                                                       | Objective                                                                               | Required exit                                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [P1 — Foundation](01-foundation.md)                         | Verify/adapt merged repository tooling, controls and CI boundaries.                     | Actual checks and a reviewable adaptation PR/evidence handoff; no product code.       |
| [P2 — Independent acceptance](02-independent-acceptance.md) | Author test-only harness and independently evidenced fixtures.                          | Reviewed, recorded executable baseline before product work; no application E2E claim. |
| [P3 — Parser](03-parser.md)                                 | Pure TypeScript physical-frame parser and unit tests.                                   | Independent expected counts and sample reconciliation; baseline unchanged.            |
| [P4 — Integrated local product](04-local-end-to-end.md)     | Native API, static UI, two images, Compose/Make and real E2E.                           | Independent builds and full applicable external local acceptance.                     |
| [P5 — Managed deployment](05-managed-deployment.md)         | Authorized provider setup, full candidate verification and approved production release. | Actual release/smoke and recovery rehearsal, reproducible handoff.                    |

Old draft phase 1 splits into P1 foundation plus P2 oracle/harness. Old phase 2 maps to P3 parser. Old phase 3 splits
into P4 local integration plus P5 managed release; managed hosting and independent Playwright acceptance are new
required scope. Exact former documents remain in `agents/history/v1-draft/`; no migration execution is implied.

Read the selected phase, [MVP](../mvp.md), [decisions/risks](../architecture/decisions.md) and appropriate role before
work. Each phase needs its own explicit instruction, human review of relevant inputs and a final reviewable PR/evidence
handoff. Locally validated, CI-passed, human-reviewed, merged, candidate-verified, production-approved and deployed are
separate states. Never automatically merge, start the next phase or reinterpret a missing prerequisite as passed.

The next proposed scope is **P1 only**, and this planning run does not authorize it. Provider selection/budget may
remain pending through unrelated local work; it must be resolved before the corresponding P5 cloud action.
