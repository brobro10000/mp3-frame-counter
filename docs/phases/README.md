# MVP phase order

P0 planning merged in PR #2 at `0c9f538`. The owner subsequently authorized execution of all five phases, required shell
commands and UI work, with unattended progress. See the [execution authorization](execution-authorization.md). PR #1's
merged foundation remains factual history. Each phase still requires its actual dependency checks and evidence;
authorization alone does not establish completion. See [active orchestrator metadata](../../agents/README.md).

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
work. The owner's execution instruction covers advancement after the preceding phase is validated and reviewed. Retain a
reviewable evidence handoff per phase. Locally validated, CI-passed, agent-reviewed, human-reviewed, merged,
candidate-verified, production-approved and deployed are separate states. Never reinterpret a missing prerequisite as
passed or fabricate a human approval.

Provider account and budget questions may remain pending through unrelated local work; they must be resolved before the
corresponding P5 cloud action. Each phase document retains its original planned exit criteria; its P0-only authorization
and mandatory pause wording is superseded by the later execution instruction.

The [execution status](../validation/execution-status.md) now records reviewed P1/P2 handoffs and passing local P3/P4
results, including the complete 60-case acceptance run at clean `2adf71b`. Separate baseline publication and managed
release remain outstanding. Phase authorization and local acceptance do not mark P5 or the complete MVP finished.
