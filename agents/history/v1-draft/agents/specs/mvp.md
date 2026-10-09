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
| FACT-100 | The assessment owner needs a small browser application that uploads an MP3 and displays its physical frame count, with reproducible review and delivery. | repo:docs/requirements/sources/v1-planning-brief.md#2 |
| FACT-101 | Accessible static HTML UI with minimal JavaScript, duplicate-submission prevention and safe status messages. | repo:docs/requirements/sources/v1-planning-brief.md#3 |
| FACT-102 | TypeScript native node:http API receives raw MP3 bytes at POST /file-upload and returns exact frameCount JSON. | repo:docs/requirements/sources/v1-planning-brief.md#3 |
| FACT-103 | Bound each complete upload Buffer at 20971520 bytes using actual received bytes and clean up interrupted requests. | repo:docs/requirements/sources/v1-planning-brief.md#3 |
| FACT-104 | Use a pure synchronous TypeScript physical MPEG-1 Layer III frame counter without an external result parser. | repo:docs/requirements/sources/v1-planning-brief.md#4 |
| FACT-105 | Validate supported ID3 records and count complete physical MPEG frames with an explicit metadata-frame convention. | repo:docs/requirements/sources/v1-planning-brief.md#4 |
| FACT-106 | Build separate minimal non-root frontend and API images independently using verified pinned base images. | repo:docs/requirements/sources/v1-planning-brief.md#5 |
| FACT-107 | Run exactly two default Compose services with frontend-only loopback publication, healthy API dependency and correct proxying. | repo:docs/requirements/sources/v1-planning-brief.md#5 |
| FACT-108 | Provide the eight specified thin Make targets and reproducible prerequisites, usage and independent-build instructions. | repo:docs/requirements/sources/v1-planning-brief.md#6 |
| FACT-109 | Use MediaInfo only for independent sample verification before parsing and after standalone and integrated results. | repo:docs/requirements/sources/v1-planning-brief.md#7 |
| FACT-110 | Use progressive meaningful checks, built-in Node tests and independent fixtures without requiring the private sample in ordinary CI. | repo:docs/requirements/sources/v1-planning-brief.md#7 |
| FACT-111 | Work through three explicitly authorized reviewed phases while retaining the current owner-only review exception and mandatory core protections. | repo:docs/architecture/v1-decisions.md#precedence-decisions |
| FACT-112 | Validate merged revisions and deliver both images with the existing required automated version, private release, deployment and recovery cycle. | repo:docs/requirements/release-process.md#required-outcomes |
| FACT-113 | V1 excludes streaming parsing, decoding, CRC verification, corruption recovery, other MPEG formats, retained uploads, databases, cloud hosting and a frontend framework. | repo:docs/requirements/sources/v1-planning-brief.md#2 |
| FACT-114 | The user authorized planning documents only; phase implementation and GitHub mutations are separate later requests. | user-confirmed:2026-10-09-plan-and-create-documents |

## Users
| ID | Description | Fact IDs |
| --- | --- | --- |
| USR-101 | Assessment owner using and evaluating the MP3 browser application. | FACT-100 |

## Outcomes
| ID | User IDs | Description | Fact IDs |
| --- | --- | --- | --- |
| OUT-101 | USR-101 | Obtain the correct physical frame count or useful failure from a reproducibly delivered and reviewed application. | FACT-100 |

## Requirements
| ID | Outcome IDs | Description | Fact IDs |
| --- | --- | --- | --- |
| REQ-101 | OUT-101 | Accessible static HTML UI with minimal JavaScript, duplicate-submission prevention and safe status messages. | FACT-100, FACT-101 |
| REQ-102 | OUT-101 | TypeScript native node:http API receives raw MP3 bytes at POST /file-upload and returns exact frameCount JSON. | FACT-100, FACT-102 |
| REQ-103 | OUT-101 | Bound each complete upload Buffer at 20971520 bytes using actual received bytes and clean up interrupted requests. | FACT-100, FACT-103 |
| REQ-104 | OUT-101 | Use a pure synchronous TypeScript physical MPEG-1 Layer III frame counter without an external result parser. | FACT-100, FACT-104 |
| REQ-105 | OUT-101 | Validate supported ID3 records and count complete physical MPEG frames with an explicit metadata-frame convention. | FACT-100, FACT-105 |
| REQ-106 | OUT-101 | Build separate minimal non-root frontend and API images independently using verified pinned base images. | FACT-100, FACT-106 |
| REQ-107 | OUT-101 | Run exactly two default Compose services with frontend-only loopback publication, healthy API dependency and correct proxying. | FACT-100, FACT-107 |
| REQ-108 | OUT-101 | Provide the eight specified thin Make targets and reproducible prerequisites, usage and independent-build instructions. | FACT-100, FACT-108 |
| REQ-109 | OUT-101 | Use MediaInfo only for independent sample verification before parsing and after standalone and integrated results. | FACT-100, FACT-109 |
| REQ-110 | OUT-101 | Use progressive meaningful checks, built-in Node tests and independent fixtures without requiring the private sample in ordinary CI. | FACT-100, FACT-110 |
| REQ-111 | OUT-101 | Work through three explicitly authorized reviewed phases while retaining the current owner-only review exception and mandatory core protections. | FACT-100, FACT-111 |
| REQ-112 | OUT-101 | Validate merged revisions and deliver both images with the existing required automated version, private release, deployment and recovery cycle. | FACT-100, FACT-112 |

## Acceptance scenarios
| ID | Requirement IDs | Given | When | Then | Fact IDs |
| --- | --- | --- | --- | --- | --- |
| AC-101 | REQ-101 | The relevant phase is authorized and its declared prerequisites are satisfied. | The documented independent checks for that requirement execute. | Browser submission succeeds or displays an accessible useful failure without duplicate requests. | FACT-100, FACT-101 |
| AC-102 | REQ-102 | The relevant phase is authorized and its declared prerequisites are satisfied. | The documented independent checks for that requirement execute. | HTTP tests prove supported MIME types, routes, methods, error JSON and exact successful status, headers and body. | FACT-100, FACT-102 |
| AC-103 | REQ-103 | The relevant phase is authorized and its declared prerequisites are satisfied. | The documented independent checks for that requirement execute. | Exact-limit inputs are accepted when valid; over-limit and interrupted requests produce the documented behavior. | FACT-100, FACT-103 |
| AC-104 | REQ-104 | The relevant phase is authorized and its declared prerequisites are satisfied. | The documented independent checks for that requirement execute. | Independent known-count fixtures prove per-frame bitrate/padding arithmetic, strict bounds and rejection behavior. | FACT-100, FACT-104 |
| AC-105 | REQ-105 | The relevant phase is authorized and its declared prerequisites are satisfied. | The documented independent checks for that requirement execute. | Tag and metadata tests pass and the supplied sample count is independently reconciled without a sample-specific offset. | FACT-100, FACT-105 |
| AC-106 | REQ-106 | The relevant phase is authorized and its declared prerequisites are satisfied. | The documented independent checks for that requirement execute. | Each image builds from a clean context without its sibling or host build artifacts and meets runtime-content checks. | FACT-100, FACT-106 |
| AC-107 | REQ-107 | The relevant phase is authorized and its declared prerequisites are satisfied. | The documented independent checks for that requirement execute. | Both services become healthy and frontend-origin uploads and JSON failures satisfy matching proxy and API limits. | FACT-100, FACT-107 |
| AC-108 | REQ-108 | The relevant phase is authorized and its declared prerequisites are satisfied. | The documented independent checks for that requirement execute. | Implemented targets work with quoted paths, propagate failures and restrict cleanup to this Compose project. | FACT-100, FACT-108 |
| AC-109 | REQ-109 | The relevant phase is authorized and its declared prerequisites are satisfied. | The documented independent checks for that requirement execute. | Record actual sample identity, tool version, commands, MPEG format and count; missing results block sample acceptance. | FACT-100, FACT-109 |
| AC-110 | REQ-110 | The relevant phase is authorized and its declared prerequisites are satisfied. | The documented independent checks for that requirement execute. | The authorized phase runs real formatting, lint, typecheck, tests or builds as applicable and records actual results. | FACT-100, FACT-110 |
| AC-111 | REQ-111 | The relevant phase is authorized and its declared prerequisites are satisfied. | The documented independent checks for that requirement execute. | Each phase has its own scoped evidence and review boundary; no automatic phase advancement or invented approval occurs. | FACT-100, FACT-111 |
| AC-112 | REQ-112 | The relevant phase is authorized and its declared prerequisites are satisfied. | The documented independent checks for that requirement execute. | All APP-REL-001 through APP-REL-006 have real evidence; unresolved target decisions and artifact-only delivery cannot establish completion. | FACT-100, FACT-112 |

## Non-goals
| ID | Description | Fact IDs |
| --- | --- | --- |
| NGL-101 | V1 excludes streaming parsing, decoding, CRC verification, corruption recovery, other MPEG formats, retained uploads, databases, cloud hosting and a frontend framework. | FACT-113 |
| NGL-102 | This planning task does not implement application or infrastructure files, execute phases or mutate GitHub. | FACT-114 |
