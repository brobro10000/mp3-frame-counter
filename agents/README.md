# Orchestrator planning boundary

The current human-readable proposal starts at [docs/mvp.md](../docs/mvp.md) and
[the five-phase plan](../docs/phases/README.md). No active generated MVP/system specification or execution plan is
installed for this proposal. Nothing under `history/` authorizes work.

The installed MVP Orchestrator is **1.3.0**, inspected without upgrade or modification. Its legacy schema-v1 MVP rubric
requires `status: approved`. The unified brief expressly requires human review and forbids promoting proposed decisions
into verified facts. The new contract still needs the reviews recorded in
[decisions](../docs/architecture/decisions.md). Full specification/bootstrap/phase-plan regeneration is therefore
**blocked pending those reviewed inputs**, while the human-readable planning task can finish.

The previous draft's approved-form metadata and its three-phase execution plan were preserved byte for byte in
[history/v1-draft](history/v1-draft/README.md), then removed from active contract-defined paths. The prior generated
project marker was also archived; root `AGENTS.md` is now an authored planning instruction, not a freshly validated
bootstrap output. Exact merged foundation contracts remain in [history/foundation](history/foundation/README.md).
Historical result JSONs in `outputs/` are not current evidence for the unified proposal.

After human review, regenerate supported artifacts in their normal `agents/specs/`, `agents/context/`,
`agents/invariants/`, `agents/validation/` and `agents/execution/` locations through installed planning capabilities.
Validate actual direct results before recording completion. Do not modify schema rules or reuse prior successful
receipts for changed inputs. No schema-v2 migration, model routing, containment or reusable receipt system is proposed.

The installed `execute-mvp-phase/scripts/validate_phase_gate.py` allows direct Python commands and runs declared
validation with a **60-second subprocess timeout**. The separate router replay also restricts the environment. Native
npm/Playwright E2E is not a
compatible direct command. P1 should review a normal CI handoff; a separately reviewed small Python adapter may later
verify genuine completed evidence and propagate failure. It must not force long E2E into 60 seconds, skip tests, weaken
an allowlist or invent an observation. No adapter is written in P0. Application checks remain independently runnable.
