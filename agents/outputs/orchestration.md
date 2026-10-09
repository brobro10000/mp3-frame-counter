# MVP Workflow Execution

- Workflow: `WF-FOUNDATION`
- Release: `0.1.0`
- Goal: `custom`
- Target mode: `empty`
- Status: `blocked`
- Current capability: `phase.execution`

## Tasks

| # | Capability | Skill | Invocation | State |
| ---: | --- | --- | --- | --- |
| 1 | `project.mvp` | `define-mvp` | `implicit` | `recorded` |
| 2 | `project.system` | `specify-system` | `implicit` | `recorded` |
| 3 | `project.bootstrap` | `bootstrap-ai-project` | `implicit` | `recorded` |
| 4 | `project.phase-plan` | `plan-mvp-phases` | `implicit` | `recorded` |
| 5 | `phase.prompt` | `expand-phase-prompt` | `explicit` | `recorded` |
| 6 | `phase.execution` | `execute-mvp-phase` | `explicit` | `current` |
| 7 | `project.validation` | `validate-ai-project` | `implicit` | `pending` |

## Resume

Resolve the bounded blocker, rerun the current specialized skill, and submit a new direct result.

Blocker codes: `provider-environment-unavailable`.
