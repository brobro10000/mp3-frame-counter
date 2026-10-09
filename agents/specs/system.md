---
schema_version: 1
artifact: system-spec
producer_plugin: mvp-orchestrator
producer_version: 0.1.0
compatibility_baseline: 0.0.0
status: approved
system:
  id: SYS-01
  title: Repository foundation
  source_mvp: agents/specs/mvp.md
  requirement_ids: &id001
  - REQ-001
  - REQ-002
verified_facts:
- id: SFACT-001
  statement: The authorized foundation consists of repository files, GitHub validation, main-only source delivery and
    repository-specific merge rules.
  source: user-confirmed:attached-request-sections-3-8
components:
- id: CMP-01
  name: Repository controls
  responsibility: Validate foundation files and enforce the approved merge policy.
  requirement_ids: *id001
  fact_ids:
  - SFACT-001
contracts:
- id: CON-01
  provider_component_id: CMP-01
  consumer_component_id: CMP-01
  statement: Run the same local and CI validations; deliver only after main validation; retain independent review.
  requirement_ids: *id001
  fact_ids:
  - SFACT-001
failure_modes:
- id: FAIL-01
  condition: A required validation or effective merge control is absent or failing.
  requirement_ids: *id001
  invariant_ids:
  - INV-FOUNDATION-01
  validator_ids:
  - VAL-FOUNDATION-01
  response: Stop advancement, report the observed limitation and preserve review requirements.
  fact_ids:
  - SFACT-001
---
# System specification
