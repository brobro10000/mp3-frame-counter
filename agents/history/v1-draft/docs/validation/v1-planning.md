# V1 planning validation

Date: **2026-10-09**. Source checkout: merged foundation `143498aae11ad2e874d1c1afa43897d6e6352794` plus the local
planning changes. These results validate planning contracts, not application behavior or phase execution. No commit,
push, PR, GitHub setting, application implementation or infrastructure implementation was produced here.

## Installed capability results

MVP Orchestrator **1.3.0** was read from the installed cache and was not modified or upgraded. The legacy schema-v1
contracts remain supported; the `0.1.0` fields are contract versions, not an application release choice. The custom
planning route contained exactly `project.mvp`, `project.system`, `project.bootstrap` and `project.phase-plan`. Its
fresh direct-validation replay completed successfully. No execution, prompt expansion, readiness or shipping capability
ran, and no phase-completion state was invented.

| Boundary            | Direct validator                                   | Result                                                         |
| ------------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| MVP specification   | `validate-mvp-spec`                                | 0; validated                                                   |
| System invariants   | `validate-invariants`                              | 0; validated                                                   |
| System traceability | `validate-traceability`                            | 0; validated                                                   |
| Bootstrap           | `validate-generated-project`                       | 0; validated                                                   |
| Phase ownership     | `validate-ownership`                               | 0; validated                                                   |
| Router              | `update_state.py` with each observed direct result | 0; all four planning capabilities complete after fresh replay. |

Bootstrap ran in retrofit mode, reviewed the actual target identity and backed up replaced owned content through the
installed renderer. The phase planner applied only its reviewed target identity, then recomputed identical plan bytes
and validated the dependency/ownership graph. Root `AGENTS.md` is the generated planning entrypoint.

The MVP has 12 requirements and 12 acceptance scenarios; all requirements connect through system ownership, invariants,
validators and tasks. There are three sequential phases and one serial implementation owner per phase. Declared future
validation adapters are not present and were not executed; planning validates their identities and mappings only.

## Reproducing the direct planning checks

Resolve `MVP_SKILLS_ROOT` to the installed plugin's `skills` directory in the current environment. It is not a
repository file or a hard-coded personal path. With the plugin's required Python dependencies available, run from
repository root:

```sh
python3 "$MVP_SKILLS_ROOT/define-mvp/scripts/validate_mvp_spec.py" --project-root . --input agents/specs/mvp.md --json
python3 "$MVP_SKILLS_ROOT/specify-system/scripts/validate_invariants.py" --project-root . --json
python3 "$MVP_SKILLS_ROOT/specify-system/scripts/validate_traceability.py" --project-root . --json
python3 "$MVP_SKILLS_ROOT/bootstrap-ai-project/scripts/validate_generated_project.py" --project-root . --context agents/context/bootstrap.json --json
python3 "$MVP_SKILLS_ROOT/plan-mvp-phases/scripts/validate_ownership.py" --project-root . --context agents/context/planning.json --json
```

The exact local request, router plan/state, apply plans and original JSON observations are in ignored
`.mvp-workflow/v1-planning/`. They contain environment-specific root fields and are not portable committed evidence.
This document is a summary, not a verbatim provider output or reusable execution receipt.

## Repository and source checks

`npm ci` succeeded with zero reported vulnerabilities. `npm run validate` passed formatting, actionlint, repository
policy, portability and all 22 existing tests (13 terminal-gate cases and 9 tooling cases). The first attempt
encountered a moved historical file still listed at its former path in Git's index; staging those exact moves resolved
that index mismatch without changing validation code. No application tests or new remote CI run are claimed.

Changed Markdown file links resolve, the 12 V1 IDs are unique, and `git diff --check` passed. Existing source captures
remain unchanged. The V1 brief was copied byte for byte and registered by SHA-256. Twelve prior control-plane files were
preserved exactly under `agents/history/foundation/`, with original modes and hashes in its manifest. Historical
provider result files remain unchanged. Old foundation execution state/delta/prompt were moved out of the active paths
without fabricating V1 state. The local sample still matches its recorded 1,458,172 bytes and checksum.

## Mermaid verification boundary

All three authored diagrams were submitted to the available Mermaid Chart display tool, which returned successful
responses with the exact supplied diagram sources. No local `mmdc` executable is available. The preview was inline and
not exposed as an inspectable MCP Apps tab, so rendered appearance and an independent syntax-check result remain
**unverified**. No unavailable Mermaid validator is represented as having passed. Review the previews and rerun a
supported syntax/render check when an inspectable renderer is available.

## Explicit remaining prerequisites

- MediaInfo is absent from PATH. Its version, MPEG observations and independent sample count remain pending in
  [the sample baseline](sample-baseline.md); no host packages were installed.
- The three executor adapters are future phase deliverables. The installed boundary still requires direct Python
  commands with `--project-root . --json`. The old execution router's stripped-environment limitation remains a Phase 1
  concern; a successful planning-only replay does not resolve it.
- Docker/Compose runtime behavior and base-image versions/digests were not tested or selected during planning.
- Before Phase 3 release work, choose and authorize the non-cloud release target, version policy, access and recovery
  retention. Existing `APP-REL-001`–`006` remain required and unverified.
- The phase-specific GitHub audit still expects an open foundation PR; Phase 1 must update that code. Its old result is
  not a current audit of the merged baseline or these local planning changes.

The next implementation authorization is Phase 1 only. The current plan is reviewable; application readiness, human
phase approval and deployment completion are not claimed.
