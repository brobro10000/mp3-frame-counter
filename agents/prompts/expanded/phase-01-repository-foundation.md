---
schema_version: 1
release_version: "0.1.0"
phase_id: "phase-01-repository-foundation"
source_fingerprint: "sha256:3ef1cac553ae91a4c156afe1e0e082140975c519d945c215f900e92daece6e50"
---

# Expanded MVP phase prompt

## Release objective

Repository foundation only; stop with an open independently reviewable PR.

## Phase objective

Repository foundation, CI/CD foundation, and enforced pull-request controls.

## Authority

The attached user request authorizes scoped files, repository settings, working branch and PR creation; it prohibits merge and application work.

## Compatibility baseline

0.0.0

## Available capabilities

- `phase.execution`
- `phase.prompt`
- `project.bootstrap`
- `project.mvp`
- `project.phase-plan`
- `project.readiness`
- `project.system`
- `project.validation`
- `workflow.orchestration`

## Deferred capabilities

- `orchestration.journal-resume`
- `orchestration.fingerprints-invalidation`
- `repository.gitnexus`
- `agents.orchestration`
- `repository.ship-pr`
- `orchestration.receipts-cas`
- `orchestration.single-flight-invalidation`
- `orchestration.live-evidence`

## Invariants

- `INV-FOUNDATION-01`

## Acceptance criteria

- Local validation and current revision CI succeed with a fail-closed terminal gate.
- Read-only GitHub verification confirms effective main protections and missing approval blocks the PR.
- Main-only source archive delivery is configured and has not executed before merge.

## Stop conditions

- Stop with the foundation PR open; do not merge or advance to application work.
- Report unavailable protections or reviewer prerequisites without weakening controls.

## Canonical tasks and dependencies

- `TASK-FOUNDATION-01` requires no task dependencies

## Owned paths

- `.editorconfig`
- `.github`
- `.gitignore`
- `.npmrc`
- `.nvmrc`
- `.prettierignore`
- `.prettierrc.json`
- `README.md`
- `docs`
- `package-lock.json`
- `package.json`
- `scripts`

## Direct validation

- `python3 scripts/validate_phase.py --project-root . --json`

## Current verified facts

- The user authorized foundation-only implementation and an open PR. (source: user-confirmed:attached-request)
- GitHub accepted an active main ruleset with no bypass actors before implementation publication. (source: github:brobro10000/mp3-frame-counter/rules/24803567)

## Active decisions

- `DEC-01`: Use npm for tooling and a single terminal control-plane CI gate; defer application frameworks.

## Changed paths

- `README.md`
- `.gitignore`
- `.editorconfig`
- `.nvmrc`
- `.npmrc`
- `package.json`
- `package-lock.json`
- `.prettierrc.json`
- `.prettierignore`
- `.github`
- `scripts`
- `docs`

## Validation notes

- Local checks do not prove GitHub enforcement; separately inspect current remote state.
- The bounded phase ends before merge, so main delivery execution remains pending.
