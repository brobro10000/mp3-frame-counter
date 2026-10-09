---
schema_version: 1
producer_plugin: mvp-orchestrator
producer_version: 0.1.0
compatibility_baseline: 0.0.0
status: approved
artifact: system-spec
system:
  id: SYS-03
  title: MP3 MVP application and verified delivery
  source_mvp: agents/specs/mvp.md
  requirement_ids:
  - REQ-101
  - REQ-102
  - REQ-103
  - REQ-104
  - REQ-105
  - REQ-106
  - REQ-107
  - REQ-108
  - REQ-109
  - REQ-110
  - REQ-111
  - REQ-112
  - REQ-113
  - REQ-114
  - REQ-115
  - REQ-116
verified_facts:
- id: SFACT-101
  statement: 'APP-V1-001: Static HTML/minimal JavaScript: labeled file input, exact Analyze MP3 action, accessible pending/result/error,
    safe text, no duplicate pending submission and retry after any outcome.'
  source: repo:docs/mvp.md
- id: SFACT-102
  statement: 'APP-V1-002: TypeScript API with native node:http; raw POST /file-upload accepts audio/mpeg and application/octet-stream,
    returns exactly a positive integer frameCount in JSON.'
  source: repo:docs/mvp.md
- id: SFACT-103
  statement: 'APP-V1-003: Inclusive 20,971,520-byte limit enforced on actual received bytes; bounded whole-buffer collection,
    abort/oversize cleanup and usable errors.'
  source: repo:docs/mvp.md
- id: SFACT-104
  statement: 'APP-V1-004: Pure synchronous TypeScript parser walks complete MPEG-1 Layer III frames, using each header''s
    bitrate/sample rate/padding; no npm/external parser, duration estimate or sync scanning through payload/corruption.'
  source: repo:docs/mvp.md
- id: SFACT-105
  statement: 'APP-V1-005: Count complete metadata-bearing MPEG frames; exclude supported separate ID3 records; explicitly
    document supported tag forms and first-pass limitations.'
  source: repo:docs/mvp.md
- id: SFACT-106
  statement: 'APP-V1-006: Independently buildable non-root frontend NGINX and API Node LTS images, pinned verified bases
    and minimal contents.'
  source: repo:docs/mvp.md
- id: SFACT-107
  statement: 'APP-V1-007: Exactly two default Compose application services; frontend loopback origin only, private API,
    per-service health, bounded startup, aligned proxy and API behavior.'
  source: repo:docs/mvp.md
- id: SFACT-108
  statement: 'APP-V1-008: Thin Make commands and clear setup/test instructions; ordinary users need no private plugin.
    Each script documents its purpose and operation.'
  source: repo:docs/mvp.md
- id: SFACT-109
  statement: 'APP-V1-009: MediaInfo evidence establishes/reconciles independent physical-frame expectations; private assessment
    bytes remain untracked and are not a CI dependency.'
  source: repo:docs/mvp.md
- id: SFACT-110
  statement: 'APP-V1-010: Built-in Node unit tests and real fail-closed CI, with separate locked Playwright acceptance
    package as an explicit dependency-boundary exception.'
  source: repo:docs/mvp.md
- id: SFACT-111
  statement: 'APP-V1-011: Execute P1 through P5 in dependency order under the owner''s 2026-10-09 unattended instruction,
    preserving independent review, evidence and repository core protections.'
  source: repo:docs/phases/execution-authorization.md
- id: SFACT-112
  statement: 'APP-V1-012: Amended from local delivery to managed release; retain all six first-MVP release requirements,
    including automatic versions, tags/private releases and recovery.'
  source: repo:docs/mvp.md
- id: SFACT-113
  statement: 'APP-V1-013: Independently authored, reviewed executable black-box baseline precedes product code; implementer
    cannot weaken baseline or gate logic.'
  source: repo:docs/mvp.md
- id: SFACT-114
  statement: 'APP-V1-014: Preserve the 20 MiB contract through managed TLS ingress, frontend and private API; approve
    provider, access and budget before cloud setup.'
  source: repo:docs/mvp.md
- id: SFACT-115
  statement: 'APP-V1-015: Promote an exact verified compatible artifact pair after explicit production approval; bind
    configuration, smoke and prior-good recovery/first-release abort.'
  source: repo:docs/mvp.md
- id: SFACT-116
  statement: 'APP-V1-016: Retain simple replaceable transport/parser/frontend/deployment boundaries; add infrastructure
    only for approved measured needs.'
  source: repo:docs/mvp.md
components:
- id: CMP-01
  name: Browser UI
  responsibility: 'Static HTML/minimal JavaScript: labeled file input, exact Analyze MP3 action, accessible pending/result/error,
    safe text, no duplicate pending submission and retry after any outcome.'
  requirement_ids:
  - REQ-101
  fact_ids:
  - SFACT-101
- id: CMP-02
  name: Static NGINX frontend
  responsibility: Independently buildable non-root frontend NGINX and API Node LTS images, pinned verified bases and minimal
    contents.; Exactly two default Compose application services; frontend loopback origin only, private API, per-service
    health, bounded startup, aligned proxy and API behavior.
  requirement_ids:
  - REQ-106
  - REQ-107
  fact_ids:
  - SFACT-106
  - SFACT-107
- id: CMP-03
  name: Native HTTP API
  responsibility: TypeScript API with native node:http; raw POST /file-upload accepts audio/mpeg and application/octet-stream,
    returns exactly a positive integer frameCount in JSON.; Inclusive 20,971,520-byte limit enforced on actual received
    bytes; bounded whole-buffer collection, abort/oversize cleanup and usable errors.
  requirement_ids:
  - REQ-102
  - REQ-103
  fact_ids:
  - SFACT-102
  - SFACT-103
- id: CMP-04
  name: Pure TypeScript parser
  responsibility: Pure synchronous TypeScript parser walks complete MPEG-1 Layer III frames, using each header's bitrate/sample
    rate/padding; no npm/external parser, duration estimate or sync scanning through payload/corruption.; Count complete
    metadata-bearing MPEG frames; exclude supported separate ID3 records; explicitly document supported tag forms and
    first-pass limitations.; Retain simple replaceable transport/parser/frontend/deployment boundaries; add infrastructure
    only for approved measured needs.
  requirement_ids:
  - REQ-104
  - REQ-105
  - REQ-116
  fact_ids:
  - SFACT-104
  - SFACT-105
  - SFACT-116
- id: CMP-05
  name: Independent acceptance and validation
  responsibility: Thin Make commands and clear setup/test instructions; ordinary users need no private plugin. Each script
    documents its purpose and operation.; MediaInfo evidence establishes/reconciles independent physical-frame expectations;
    private assessment bytes remain untracked and are not a CI dependency.; Built-in Node unit tests and real fail-closed
    CI, with separate locked Playwright acceptance package as an explicit dependency-boundary exception.; Independently
    authored, reviewed executable black-box baseline precedes product code; implementer cannot weaken baseline or gate
    logic.
  requirement_ids:
  - REQ-108
  - REQ-109
  - REQ-110
  - REQ-113
  fact_ids:
  - SFACT-108
  - SFACT-109
  - SFACT-110
  - SFACT-113
- id: CMP-06
  name: Repository and managed release
  responsibility: Execute P1 through P5 in dependency order under the owner's 2026-10-09 unattended instruction, preserving
    independent review, evidence and repository core protections.; Amended from local delivery to managed release; retain
    all six first-MVP release requirements, including automatic versions, tags/private releases and recovery.; Preserve
    the 20 MiB contract through managed TLS ingress, frontend and private API; approve provider, access and budget before
    cloud setup.; Promote an exact verified compatible artifact pair after explicit production approval; bind configuration,
    smoke and prior-good recovery/first-release abort.
  requirement_ids:
  - REQ-111
  - REQ-112
  - REQ-114
  - REQ-115
  fact_ids:
  - SFACT-111
  - SFACT-112
  - SFACT-114
  - SFACT-115
contracts:
- id: CON-01
  provider_component_id: CMP-01
  consumer_component_id: CMP-02
  statement: Browser submits a raw file through relative /file-upload on the frontend origin and renders status with safe
    text.
  requirement_ids:
  - REQ-101
  - REQ-102
  - REQ-107
  fact_ids:
  - SFACT-101
  - SFACT-102
  - SFACT-107
- id: CON-02
  provider_component_id: CMP-02
  consumer_component_id: CMP-03
  statement: Frontend forwards binary bytes and API status/JSON with a configurable private upstream and matching inclusive
    20971520-byte limit.
  requirement_ids:
  - REQ-102
  - REQ-103
  - REQ-107
  fact_ids:
  - SFACT-102
  - SFACT-103
  - SFACT-107
- id: CON-03
  provider_component_id: CMP-03
  consumer_component_id: CMP-04
  statement: API invokes the pure synchronous physical-frame counter only with the complete bounded Buffer; malformed
    input never returns a partial count.
  requirement_ids:
  - REQ-102
  - REQ-103
  - REQ-104
  - REQ-105
  fact_ids:
  - SFACT-102
  - SFACT-103
  - SFACT-104
  - SFACT-105
- id: CON-04
  provider_component_id: CMP-05
  consumer_component_id: CMP-04
  statement: Reviewed independent fixture counts and suite expectations precede product implementation and cannot be changed
    by product implementers.
  requirement_ids:
  - REQ-104
  - REQ-105
  - REQ-109
  - REQ-110
  - REQ-113
  fact_ids:
  - SFACT-104
  - SFACT-105
  - SFACT-109
  - SFACT-110
  - SFACT-113
- id: CON-05
  provider_component_id: CMP-06
  consumer_component_id: CMP-02
  statement: Verify the immutable image pair through candidate ingress before the production release; actual access and
    release evidence are mandatory.
  requirement_ids:
  - REQ-106
  - REQ-112
  - REQ-114
  - REQ-115
  fact_ids:
  - SFACT-106
  - SFACT-112
  - SFACT-114
  - SFACT-115
failure_modes:
- id: FAIL-01
  condition: P1 required evidence is absent, invalid or failing.
  requirement_ids:
  - REQ-108
  - REQ-110
  - REQ-111
  - REQ-113
  invariant_ids:
  - INV-V1-08
  - INV-V1-10
  - INV-V1-11
  - INV-V1-13
  validator_ids:
  - VAL-V1-01
  response: Block P1 completion and dependent operations; preserve failures and resolve the actual prerequisite without
    weakening checks.
  fact_ids:
  - SFACT-108
  - SFACT-110
  - SFACT-111
  - SFACT-113
- id: FAIL-02
  condition: P2 required evidence is absent, invalid or failing.
  requirement_ids:
  - REQ-104
  - REQ-105
  - REQ-109
  - REQ-110
  - REQ-113
  invariant_ids:
  - INV-V1-04
  - INV-V1-05
  - INV-V1-09
  - INV-V1-10
  - INV-V1-13
  validator_ids:
  - VAL-V1-02
  response: Block P2 completion and dependent operations; preserve failures and resolve the actual prerequisite without
    weakening checks.
  fact_ids:
  - SFACT-104
  - SFACT-105
  - SFACT-109
  - SFACT-110
  - SFACT-113
- id: FAIL-03
  condition: P3 required evidence is absent, invalid or failing.
  requirement_ids:
  - REQ-104
  - REQ-105
  - REQ-109
  - REQ-110
  - REQ-116
  - REQ-113
  invariant_ids:
  - INV-V1-04
  - INV-V1-05
  - INV-V1-09
  - INV-V1-10
  - INV-V1-16
  - INV-V1-13
  validator_ids:
  - VAL-V1-03
  response: Block P3 completion and dependent operations; preserve failures and resolve the actual prerequisite without
    weakening checks.
  fact_ids:
  - SFACT-104
  - SFACT-105
  - SFACT-109
  - SFACT-110
  - SFACT-116
  - SFACT-113
- id: FAIL-04
  condition: P4 required evidence is absent, invalid or failing.
  requirement_ids:
  - REQ-101
  - REQ-102
  - REQ-103
  - REQ-106
  - REQ-107
  - REQ-108
  - REQ-109
  - REQ-110
  - REQ-113
  - REQ-116
  invariant_ids:
  - INV-V1-01
  - INV-V1-02
  - INV-V1-03
  - INV-V1-06
  - INV-V1-07
  - INV-V1-08
  - INV-V1-09
  - INV-V1-10
  - INV-V1-13
  - INV-V1-16
  validator_ids:
  - VAL-V1-04
  response: Block P4 completion and dependent operations; preserve failures and resolve the actual prerequisite without
    weakening checks.
  fact_ids:
  - SFACT-101
  - SFACT-102
  - SFACT-103
  - SFACT-106
  - SFACT-107
  - SFACT-108
  - SFACT-109
  - SFACT-110
  - SFACT-113
  - SFACT-116
- id: FAIL-05
  condition: P5 required evidence is absent, invalid or failing.
  requirement_ids:
  - REQ-101
  - REQ-102
  - REQ-103
  - REQ-106
  - REQ-107
  - REQ-108
  - REQ-109
  - REQ-110
  - REQ-112
  - REQ-113
  - REQ-114
  - REQ-115
  - REQ-116
  invariant_ids:
  - INV-V1-01
  - INV-V1-02
  - INV-V1-03
  - INV-V1-06
  - INV-V1-07
  - INV-V1-08
  - INV-V1-09
  - INV-V1-10
  - INV-V1-12
  - INV-V1-13
  - INV-V1-14
  - INV-V1-15
  - INV-V1-16
  validator_ids:
  - VAL-V1-05
  response: Block P5 completion and dependent operations; preserve failures and resolve the actual prerequisite without
    weakening checks.
  fact_ids:
  - SFACT-101
  - SFACT-102
  - SFACT-103
  - SFACT-106
  - SFACT-107
  - SFACT-108
  - SFACT-109
  - SFACT-110
  - SFACT-112
  - SFACT-113
  - SFACT-114
  - SFACT-115
  - SFACT-116
---
# System specification
