# MVP phase order

**Current handoff, 2026-10-10:** the release-only P1–P5 milestone and PR #7 closure are complete; main `92807357`
published v0.1.7. The [versioned roadmap](../roadmap/README.md) and [next three cards](next-iteration.md) now govern
documentation and separately scoped future work. The table below preserves the completed phase sequence; earlier
execution authority does not authorize roadmap implementation.

P0 planning merged in PR #2 at `0c9f538`. The owner subsequently authorized execution of all five phases, required shell
commands and UI work, with unattended progress. See the [execution authorization](execution-authorization.md). PR #1's
merged foundation remains factual history. Each phase still requires its actual dependency checks and evidence;
authorization alone does not establish completion. See [active orchestrator metadata](../../agents/README.md).

| Phase                                                       | Objective                                                                   | Required exit                                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [P1 — Foundation](01-foundation.md)                         | Verify/adapt merged repository tooling, controls and CI boundaries.         | Actual checks and a reviewable adaptation PR/evidence handoff; no product code.       |
| [P2 — Independent acceptance](02-independent-acceptance.md) | Author test-only harness and independently evidenced fixtures.              | Reviewed, recorded executable baseline before product work; no application E2E claim. |
| [P3 — Parser](03-parser.md)                                 | Pure TypeScript physical-frame parser and unit tests.                       | Independent expected counts and sample reconciliation; baseline unchanged.            |
| [P4 — Integrated local product](04-local-end-to-end.md)     | Native API, static UI, two images, Compose/Make and real E2E.               | Independent builds and full applicable external local acceptance.                     |
| [P5 — Repository releases](05-managed-deployment.md)        | Publish exact tested image archives after protected-main CI; no deployment. | Observed tag/private release, verified assets and safe retries, reproducible handoff. |

Old draft phase 1 splits into P1 foundation plus P2 oracle/harness. Old phase 2 maps to P3 parser. Old phase 3 splits
into P4 local integration plus P5 managed release; managed hosting and independent Playwright acceptance are new scope
in that planning revision. SRC-RELEASE-ONLY subsequently deferred hosting and narrowed P5 to repository releases. Exact
former documents remain in `agents/history/v1-draft/`; no migration execution is implied.

Read the selected phase, [MVP](../mvp.md), [decisions/risks](../architecture/decisions.md) and appropriate role before
work. The owner's execution instruction covers advancement after the preceding phase is validated and reviewed. Retain a
reviewable evidence handoff per phase. Locally validated, CI-passed, agent-reviewed, human-reviewed, merged,
candidate-verified, production-approved and deployed are separate states. Never reinterpret a missing prerequisite as
passed or fabricate a human approval.

Provider account and budget questions may remain pending through unrelated local work; they must be resolved before the
corresponding future cloud action. P5 follows the amended release-only criteria; other phase documents retain their
planned exit criteria. The later execution instruction supersedes their P0-only authorization and mandatory pause
wording.

The [V1 closure](../validation/v1-closure.md) records completion of the active P1–P5 scope. PR #3 merged as `60e51fb`,
PR #4 published the unchanged baseline as `a0a56d9`, and PR #5 merged the product as `ce50762b`. Protected-main CI
passed all mandatory checks and published `v0.1.6`; an identical publisher-only retry preserved its verified assets.
Deployment remains deferred. The [execution status](../validation/execution-status.md) preserves the earlier local/PR
evidence and chronology. Later revisions need fresh checks, and the next iteration requires its own bounded plan.
