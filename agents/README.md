# Active orchestrator and ordinary CI boundary

The owner authorized P1–P5 execution after planning PR #2 merged. Read
[the execution instruction](../docs/phases/execution-authorization.md) and [phase sequence](../docs/phases/README.md).
Fresh schema-v1 specifications, invariant/validation mappings, bootstrap context and five-phase plan now occupy their
contract-defined active paths. Nothing under `history/` authorizes current work.

Installed MVP Orchestrator **1.3.0** validated the MVP, system invariants and traceability, generated bootstrap, phase
ownership and complete control-plane structure. Schema-v1 `status: approved` represents the owner's implementation
instruction and reviewed contract, never a claim that acceptance, deployment or production approval has happened.
Original archives and historical output JSON remain unchanged. No schema-v2 migration or private plugin source is added.

## Execution handoff

The installed phase executor only accepts direct Python validators with a 60-second outer timeout. Application npm,
Playwright, image builds and managed deployment use the repository's ordinary committed commands and CI. This is an
explicit execution handoff: do not pretend the plugin executed these commands, generate a fake completed execution
state, replay old outputs, weaken its allowlist or shorten real E2E into a false pass.

`agents/execution/mvp-plan.yaml` records dependencies, requirements, independent owners and declared checks. Real phase
outcomes are recorded in `docs/validation/` and actual CI runs. Metadata validation is distinct from phase completion.
The current metadata is a pre-execution control-plane snapshot; no completed-phase plugin claim has been recorded.
The later [release-only owner amendment](../docs/requirements/release-process.md) supersedes its managed-deployment
completion requirement for this milestone. Preserve this generated snapshot and consult the amended human requirements
and P5 document; do not fabricate regenerated or completed plugin evidence.

P2 must establish independently authored fixtures and an executable suite before product code. Under squash-only
merges, the production freeze must identify the separately merged acceptance-only commit on `main`; a feature-branch
commit that will disappear after squash is insufficient. Product implementers cannot edit the frozen baseline or gate.

Normal development, CI and application use require neither Codex nor this private plugin. Keep raw plugin output with
machine-local roots in ignored `.mvp-workflow/`; retain only portable, truthful evidence summaries in the repository.

## V1 closure and later iterations

The [V1 closure record](../docs/validation/v1-closure.md) records actual P1–P5 release-only completion and the remaining
boundaries. The generated control-plane snapshot stays historical; no completed plugin result is implied. Consult that
record and the central requirements before separately planning the next iteration, after the closure PR review/merge.
