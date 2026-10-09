---
schema_version: 1
artifact: mvp-spec
producer_plugin: mvp-orchestrator
producer_version: 0.1.0
compatibility_baseline: 0.0.0
status: approved
---

# MVP specification

## Verified facts
| ID | Statement | Source |
| --- | --- | --- |
| FACT-001 | The assessment owner needs a private repository foundation with npm tooling, meaningful CI, protected main and an open foundation PR. | user-confirmed:attached-request-sections-1-8 |
| FACT-002 | This phase excludes the MP3 endpoint, parser, application tests, frontend, database, hosting, merges and automated approvals. | user-confirmed:attached-request-sections-1-8 |

## Users
| ID | Description | Fact IDs |
| --- | --- | --- |
| USR-001 | Assessment owner and eligible independent repository reviewers. | FACT-001 |

## Outcomes
| ID | User IDs | Description | Fact IDs |
| --- | --- | --- | --- |
| OUT-001 | USR-001 | Review a reproducible foundation PR with enforced merge requirements and documented validation evidence. | FACT-001 |

## Requirements
| ID | Outcome IDs | Description | Fact IDs |
| --- | --- | --- | --- |
| REQ-001 | OUT-001 | Provide pinned repository tooling, meaningful CI and a validated source archive workflow restricted to main after validation. | FACT-001 |
| REQ-002 | OUT-001 | Enforce independent approval and exact CI gate requirements on main without bypasses, leaving an open unmerged PR. | FACT-001 |

## Acceptance scenarios
| ID | Requirement IDs | Given | When | Then | Fact IDs |
| --- | --- | --- | --- | --- | --- |
| AC-001 | REQ-001 | The foundation checkout and supported tools. | The documented validations run locally and on the PR revision. | Actual repository checks pass; failure, cancellation, skipping and missing results fail the terminal gate; delivery remains main only. | FACT-001 |
| AC-002 | REQ-002 | The private repository and current foundation PR. | Effective settings, check sources and review status are read from GitHub. | Main has active no-bypass protections and missing independent approval blocks the PR; delivery has not run on main. | FACT-001 |

## Non-goals
| ID | Description | Fact IDs |
| --- | --- | --- |
| NGL-001 | No application behavior, application framework choice, cloud deployment, merge, auto-merge, approval or next phase. | FACT-002 |
