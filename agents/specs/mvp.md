---
schema_version: 1
producer_plugin: mvp-orchestrator
producer_version: 0.1.0
compatibility_baseline: 0.0.0
status: approved
artifact: mvp-spec
---

# MVP specification

## Verified facts
| ID | Statement | Source |
| --- | --- | --- |
| FACT-100 | The assessment owner needs a browser MP3 physical-frame counter with reproducible independent verification and managed release. | repo:docs/mvp.md |
| FACT-101 | APP-V1-001: Static HTML/minimal JavaScript: labeled file input, exact Analyze MP3 action, accessible pending/result/error, safe text, no duplicate pending submission and retry after any outcome. | repo:docs/mvp.md#APP-V1-001 |
| FACT-102 | APP-V1-002: TypeScript API with native node:http; raw POST /file-upload accepts audio/mpeg and application/octet-stream, returns exactly a positive integer frameCount in JSON. | repo:docs/mvp.md#APP-V1-002 |
| FACT-103 | APP-V1-003: Inclusive 20,971,520-byte limit enforced on actual received bytes; bounded whole-buffer collection, abort/oversize cleanup and usable errors. | repo:docs/mvp.md#APP-V1-003 |
| FACT-104 | APP-V1-004: Pure synchronous TypeScript parser walks complete MPEG-1 Layer III frames, using each header's bitrate/sample rate/padding; no npm/external parser, duration estimate or sync scanning through payload/corruption. | repo:docs/mvp.md#APP-V1-004 |
| FACT-105 | APP-V1-005: Count complete metadata-bearing MPEG frames; exclude supported separate ID3 records; explicitly document supported tag forms and first-pass limitations. | repo:docs/mvp.md#APP-V1-005 |
| FACT-106 | APP-V1-006: Independently buildable non-root frontend NGINX and API Node LTS images, pinned verified bases and minimal contents. | repo:docs/mvp.md#APP-V1-006 |
| FACT-107 | APP-V1-007: Exactly two default Compose application services; frontend loopback origin only, private API, per-service health, bounded startup, aligned proxy and API behavior. | repo:docs/mvp.md#APP-V1-007 |
| FACT-108 | APP-V1-008: Thin Make commands and clear setup/test instructions; ordinary users need no private plugin. Each script documents its purpose and operation. | repo:docs/mvp.md#APP-V1-008 |
| FACT-109 | APP-V1-009: MediaInfo evidence establishes/reconciles independent physical-frame expectations; private assessment bytes remain untracked and are not a CI dependency. | repo:docs/mvp.md#APP-V1-009 |
| FACT-110 | APP-V1-010: Built-in Node unit tests and real fail-closed CI, with separate locked Playwright acceptance package as an explicit dependency-boundary exception. | repo:docs/mvp.md#APP-V1-010 |
| FACT-111 | APP-V1-011: Execute P1 through P5 in dependency order under the owner's 2026-10-09 unattended instruction, preserving independent review, evidence and repository core protections. | repo:docs/phases/execution-authorization.md |
| FACT-112 | APP-V1-012: Amended from local delivery to managed release; retain all six first-MVP release requirements, including automatic versions, tags/private releases and recovery. | repo:docs/mvp.md#APP-V1-012 |
| FACT-113 | APP-V1-013: Independently authored, reviewed executable black-box baseline precedes product code; implementer cannot weaken baseline or gate logic. | repo:docs/mvp.md#APP-V1-013 |
| FACT-114 | APP-V1-014: Preserve the 20 MiB contract through managed TLS ingress, frontend and private API; approve provider, access and budget before cloud setup. | repo:docs/mvp.md#APP-V1-014 |
| FACT-115 | APP-V1-015: Promote an exact verified compatible artifact pair after explicit production approval; bind configuration, smoke and prior-good recovery/first-release abort. | repo:docs/mvp.md#APP-V1-015 |
| FACT-116 | APP-V1-016: Retain simple replaceable transport/parser/frontend/deployment boundaries; add infrastructure only for approved measured needs. | repo:docs/mvp.md#APP-V1-016 |
| FACT-117 | No retained uploads, external runtime parser, decoder, frontend framework, database, accounts, background jobs or speculative infrastructure. | repo:docs/mvp.md#fixed-boundaries-and-limits |

## Users
| ID | Description | Fact IDs |
| --- | --- | --- |
| USR-101 | Assessment owner using and evaluating the application. | FACT-100 |

## Outcomes
| ID | User IDs | Description | Fact IDs |
| --- | --- | --- | --- |
| OUT-101 | USR-101 | Obtain an accurate physical frame count or useful error through a reproducible reviewed application and verified managed release. | FACT-100 |

## Requirements
| ID | Outcome IDs | Description | Fact IDs |
| --- | --- | --- | --- |
| REQ-101 | OUT-101 | APP-V1-001: Static HTML/minimal JavaScript: labeled file input, exact Analyze MP3 action, accessible pending/result/error, safe text, no duplicate pending submission and retry after any outcome. | FACT-100, FACT-101 |
| REQ-102 | OUT-101 | APP-V1-002: TypeScript API with native node:http; raw POST /file-upload accepts audio/mpeg and application/octet-stream, returns exactly a positive integer frameCount in JSON. | FACT-100, FACT-102 |
| REQ-103 | OUT-101 | APP-V1-003: Inclusive 20,971,520-byte limit enforced on actual received bytes; bounded whole-buffer collection, abort/oversize cleanup and usable errors. | FACT-100, FACT-103 |
| REQ-104 | OUT-101 | APP-V1-004: Pure synchronous TypeScript parser walks complete MPEG-1 Layer III frames, using each header's bitrate/sample rate/padding; no npm/external parser, duration estimate or sync scanning through payload/corruption. | FACT-100, FACT-104 |
| REQ-105 | OUT-101 | APP-V1-005: Count complete metadata-bearing MPEG frames; exclude supported separate ID3 records; explicitly document supported tag forms and first-pass limitations. | FACT-100, FACT-105 |
| REQ-106 | OUT-101 | APP-V1-006: Independently buildable non-root frontend NGINX and API Node LTS images, pinned verified bases and minimal contents. | FACT-100, FACT-106 |
| REQ-107 | OUT-101 | APP-V1-007: Exactly two default Compose application services; frontend loopback origin only, private API, per-service health, bounded startup, aligned proxy and API behavior. | FACT-100, FACT-107 |
| REQ-108 | OUT-101 | APP-V1-008: Thin Make commands and clear setup/test instructions; ordinary users need no private plugin. Each script documents its purpose and operation. | FACT-100, FACT-108 |
| REQ-109 | OUT-101 | APP-V1-009: MediaInfo evidence establishes/reconciles independent physical-frame expectations; private assessment bytes remain untracked and are not a CI dependency. | FACT-100, FACT-109 |
| REQ-110 | OUT-101 | APP-V1-010: Built-in Node unit tests and real fail-closed CI, with separate locked Playwright acceptance package as an explicit dependency-boundary exception. | FACT-100, FACT-110 |
| REQ-111 | OUT-101 | APP-V1-011: Execute P1 through P5 in dependency order under the owner's 2026-10-09 unattended instruction, preserving independent review, evidence and repository core protections. | FACT-100, FACT-111 |
| REQ-112 | OUT-101 | APP-V1-012: Amended from local delivery to managed release; retain all six first-MVP release requirements, including automatic versions, tags/private releases and recovery. | FACT-100, FACT-112 |
| REQ-113 | OUT-101 | APP-V1-013: Independently authored, reviewed executable black-box baseline precedes product code; implementer cannot weaken baseline or gate logic. | FACT-100, FACT-113 |
| REQ-114 | OUT-101 | APP-V1-014: Preserve the 20 MiB contract through managed TLS ingress, frontend and private API; approve provider, access and budget before cloud setup. | FACT-100, FACT-114 |
| REQ-115 | OUT-101 | APP-V1-015: Promote an exact verified compatible artifact pair after explicit production approval; bind configuration, smoke and prior-good recovery/first-release abort. | FACT-100, FACT-115 |
| REQ-116 | OUT-101 | APP-V1-016: Retain simple replaceable transport/parser/frontend/deployment boundaries; add infrastructure only for approved measured needs. | FACT-100, FACT-116 |

## Acceptance scenarios
| ID | Requirement IDs | Given | When | Then | Fact IDs |
| --- | --- | --- | --- | --- | --- |
| AC-101 | REQ-101 | The phase prerequisites and independent baseline are established. | The requirement-specific tests and operational verification run. | APP-V1-001 has passing applicable evidence under docs/phases and the acceptance contract. | FACT-100, FACT-101 |
| AC-102 | REQ-102 | The phase prerequisites and independent baseline are established. | The requirement-specific tests and operational verification run. | APP-V1-002 has passing applicable evidence under docs/phases and the acceptance contract. | FACT-100, FACT-102 |
| AC-103 | REQ-103 | The phase prerequisites and independent baseline are established. | The requirement-specific tests and operational verification run. | APP-V1-003 has passing applicable evidence under docs/phases and the acceptance contract. | FACT-100, FACT-103 |
| AC-104 | REQ-104 | The phase prerequisites and independent baseline are established. | The requirement-specific tests and operational verification run. | APP-V1-004 has passing applicable evidence under docs/phases and the acceptance contract. | FACT-100, FACT-104 |
| AC-105 | REQ-105 | The phase prerequisites and independent baseline are established. | The requirement-specific tests and operational verification run. | APP-V1-005 has passing applicable evidence under docs/phases and the acceptance contract. | FACT-100, FACT-105 |
| AC-106 | REQ-106 | The phase prerequisites and independent baseline are established. | The requirement-specific tests and operational verification run. | APP-V1-006 has passing applicable evidence under docs/phases and the acceptance contract. | FACT-100, FACT-106 |
| AC-107 | REQ-107 | The phase prerequisites and independent baseline are established. | The requirement-specific tests and operational verification run. | APP-V1-007 has passing applicable evidence under docs/phases and the acceptance contract. | FACT-100, FACT-107 |
| AC-108 | REQ-108 | The phase prerequisites and independent baseline are established. | The requirement-specific tests and operational verification run. | APP-V1-008 has passing applicable evidence under docs/phases and the acceptance contract. | FACT-100, FACT-108 |
| AC-109 | REQ-109 | The phase prerequisites and independent baseline are established. | The requirement-specific tests and operational verification run. | APP-V1-009 has passing applicable evidence under docs/phases and the acceptance contract. | FACT-100, FACT-109 |
| AC-110 | REQ-110 | The phase prerequisites and independent baseline are established. | The requirement-specific tests and operational verification run. | APP-V1-010 has passing applicable evidence under docs/phases and the acceptance contract. | FACT-100, FACT-110 |
| AC-111 | REQ-111 | The phase prerequisites and independent baseline are established. | The requirement-specific tests and operational verification run. | APP-V1-011 has passing applicable evidence under docs/phases and the acceptance contract. | FACT-100, FACT-111 |
| AC-112 | REQ-112 | The phase prerequisites and independent baseline are established. | The requirement-specific tests and operational verification run. | APP-V1-012 has passing applicable evidence under docs/phases and the acceptance contract. | FACT-100, FACT-112 |
| AC-113 | REQ-113 | The phase prerequisites and independent baseline are established. | The requirement-specific tests and operational verification run. | APP-V1-013 has passing applicable evidence under docs/phases and the acceptance contract. | FACT-100, FACT-113 |
| AC-114 | REQ-114 | The phase prerequisites and independent baseline are established. | The requirement-specific tests and operational verification run. | APP-V1-014 has passing applicable evidence under docs/phases and the acceptance contract. | FACT-100, FACT-114 |
| AC-115 | REQ-115 | The phase prerequisites and independent baseline are established. | The requirement-specific tests and operational verification run. | APP-V1-015 has passing applicable evidence under docs/phases and the acceptance contract. | FACT-100, FACT-115 |
| AC-116 | REQ-116 | The phase prerequisites and independent baseline are established. | The requirement-specific tests and operational verification run. | APP-V1-016 has passing applicable evidence under docs/phases and the acceptance contract. | FACT-100, FACT-116 |

## Non-goals
| ID | Description | Fact IDs |
| --- | --- | --- |
| NGL-101 | No retained uploads, external runtime parser, decoder, frontend framework, database, accounts, background jobs or speculative infrastructure. | FACT-117 |
