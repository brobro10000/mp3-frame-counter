---
schema_version: 1
producer_plugin: mvp-orchestrator
producer_version: 0.1.0
compatibility_baseline: 0.0.0
status: approved
artifact: system-spec
system:
  id: SYS-02
  title: MP3 application V1 planned system
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
verified_facts:
- id: SFACT-101
  statement: Accessible static HTML UI with minimal JavaScript, duplicate-submission prevention and safe status
    messages.
  source: repo:docs/requirements/sources/v1-planning-brief.md#3
- id: SFACT-102
  statement: TypeScript native node:http API receives raw MP3 bytes at POST /file-upload and returns exact frameCount
    JSON.
  source: repo:docs/requirements/sources/v1-planning-brief.md#3
- id: SFACT-103
  statement: Bound each complete upload Buffer at 20971520 bytes using actual received bytes and clean up interrupted
    requests.
  source: repo:docs/requirements/sources/v1-planning-brief.md#3
- id: SFACT-104
  statement: Use a pure synchronous TypeScript physical MPEG-1 Layer III frame counter without an external result
    parser.
  source: repo:docs/requirements/sources/v1-planning-brief.md#4
- id: SFACT-105
  statement: Validate supported ID3 records and count complete physical MPEG frames with an explicit metadata-frame
    convention.
  source: repo:docs/requirements/sources/v1-planning-brief.md#4
- id: SFACT-106
  statement: Build separate minimal non-root frontend and API images independently using verified pinned base images.
  source: repo:docs/requirements/sources/v1-planning-brief.md#5
- id: SFACT-107
  statement: Run exactly two default Compose services with frontend-only loopback publication, healthy API dependency
    and correct proxying.
  source: repo:docs/requirements/sources/v1-planning-brief.md#5
- id: SFACT-108
  statement: Provide the eight specified thin Make targets and reproducible prerequisites, usage and independent-build
    instructions.
  source: repo:docs/requirements/sources/v1-planning-brief.md#6
- id: SFACT-109
  statement: Use MediaInfo only for independent sample verification before parsing and after standalone and integrated
    results.
  source: repo:docs/requirements/sources/v1-planning-brief.md#7
- id: SFACT-110
  statement: Use progressive meaningful checks, built-in Node tests and independent fixtures without requiring the
    private sample in ordinary CI.
  source: repo:docs/requirements/sources/v1-planning-brief.md#7
- id: SFACT-111
  statement: Work through three explicitly authorized reviewed phases while retaining the current owner-only review
    exception and mandatory core protections.
  source: repo:docs/repository-controls.md#effective-policy
- id: SFACT-112
  statement: Validate merged revisions and deliver both images with the existing required automated version, private
    release, deployment and recovery cycle.
  source: repo:docs/requirements/release-process.md#required-outcomes
components:
- id: CMP-01
  name: Browser UI
  responsibility: Select an MP3, submit raw bytes through the single origin and display accessible results.
  requirement_ids:
  - REQ-101
  fact_ids:
  - SFACT-101
- id: CMP-02
  name: Frontend container
  responsibility: Serve static assets and proxy uploads with matching limits and JSON errors.
  requirement_ids:
  - REQ-106
  - REQ-107
  fact_ids:
  - SFACT-106
  - SFACT-107
- id: CMP-03
  name: Native HTTP API
  responsibility: Validate routes and bounded upload bytes, call the parser and return the response contract.
  requirement_ids:
  - REQ-102
  - REQ-103
  - REQ-107
  fact_ids:
  - SFACT-102
  - SFACT-103
  - SFACT-107
- id: CMP-04
  name: In-process parser
  responsibility: Validate physical MPEG frames and tags independently of HTTP and external parsers.
  requirement_ids:
  - REQ-104
  - REQ-105
  fact_ids:
  - SFACT-104
  - SFACT-105
- id: CMP-05
  name: Developer validation
  responsibility: Provide thin commands, independent MediaInfo evidence and meaningful built-in tests.
  requirement_ids:
  - REQ-108
  - REQ-109
  - REQ-110
  fact_ids:
  - SFACT-108
  - SFACT-109
  - SFACT-110
- id: CMP-06
  name: Delivery workflow
  responsibility: Preserve reviewed phase boundaries and gated main delivery with the required release cycle.
  requirement_ids:
  - REQ-111
  - REQ-112
  fact_ids:
  - SFACT-111
  - SFACT-112
contracts:
- id: CON-01
  provider_component_id: CMP-01
  consumer_component_id: CMP-02
  statement: Browser uses relative /file-upload with raw File bytes and audio/mpeg, never multipart or the Docker
    api hostname.
  requirement_ids:
  - REQ-101
  - REQ-102
  fact_ids:
  - SFACT-101
  - SFACT-102
- id: CON-02
  provider_component_id: CMP-02
  consumer_component_id: CMP-03
  statement: Frontend forwards the exact upload path via HTTP/1.1 without full-body request buffering; preserve
    API status and JSON and use JSON proxy errors.
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
  statement: API accepts audio/mpeg or application/octet-stream, enforces 20971520 actual bytes, and invokes a pure
    synchronous counter on a complete Buffer. Success is HTTP 200 application/json with exactly frameCount; errors
    follow docs/mvp.md.
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
  statement: Independent MediaInfo observations and synthetic known counts validate the same sample under the physical-frame
    convention outside runtime handling.
  requirement_ids:
  - REQ-104
  - REQ-105
  - REQ-109
  - REQ-110
  fact_ids:
  - SFACT-104
  - SFACT-105
  - SFACT-109
  - SFACT-110
- id: CON-05
  provider_component_id: CMP-06
  consumer_component_id: CMP-02
  statement: After required merged-revision validation, independently built image artifacts retain commit/version
    integrity; release-target selection and authorization precede automated deployment and verified private release
    publication.
  requirement_ids:
  - REQ-106
  - REQ-111
  - REQ-112
  fact_ids:
  - SFACT-106
  - SFACT-111
  - SFACT-112
- id: CON-06
  provider_component_id: CMP-05
  consumer_component_id: CMP-06
  statement: Each separately authorized phase supplies real validation evidence for a scoped review; neither an
    agent report nor artifact retention establishes human approval or deployed release acceptance.
  requirement_ids:
  - REQ-108
  - REQ-110
  - REQ-111
  - REQ-112
  fact_ids:
  - SFACT-108
  - SFACT-110
  - SFACT-111
  - SFACT-112
failure_modes:
- id: FAIL-01
  condition: Sample tool, bytes or independent count evidence is unavailable.
  requirement_ids:
  - REQ-109
  invariant_ids:
  - INV-V1-09
  validator_ids:
  - VAL-V1-01
  response: Block sample acceptance and Phase 2 until Phase 1 evidence is established; preserve real observations.
  fact_ids:
  - SFACT-109
- id: FAIL-02
  condition: Malformed, unsupported or incomplete MP3 or unreconciled sample count.
  requirement_ids:
  - REQ-104
  - REQ-105
  - REQ-109
  invariant_ids:
  - INV-V1-04
  - INV-V1-05
  - INV-V1-09
  validator_ids:
  - VAL-V1-02
  response: Reject unsupported inputs with typed errors and block parser acceptance on unresolved reference differences.
  fact_ids:
  - SFACT-104
  - SFACT-105
  - SFACT-109
- id: FAIL-03
  condition: Upload exceeds the byte limit, is interrupted or fails the transport contract.
  requirement_ids:
  - REQ-102
  - REQ-103
  invariant_ids:
  - INV-V1-02
  - INV-V1-03
  validator_ids:
  - VAL-V1-03
  response: Return the documented error where the connection permits and discard incomplete state without a partial
    count.
  fact_ids:
  - SFACT-102
  - SFACT-103
- id: FAIL-04
  condition: Container build, health check, proxy error fidelity or independent packaging fails.
  requirement_ids:
  - REQ-106
  - REQ-107
  - REQ-108
  invariant_ids:
  - INV-V1-06
  - INV-V1-07
  - INV-V1-08
  validator_ids:
  - VAL-V1-03
  response: Fail integration and clean up this Compose project; do not report successful startup or delivery.
  fact_ids:
  - SFACT-106
  - SFACT-107
  - SFACT-108
- id: FAIL-05
  condition: Required checks fail or a release target, authorization or recovery proof is missing.
  requirement_ids:
  - REQ-110
  - REQ-111
  - REQ-112
  invariant_ids:
  - INV-V1-10
  - INV-V1-11
  - INV-V1-12
  validator_ids:
  - VAL-V1-03
  response: Block successful release and V1 completion, preserve core protections and report the precise unmet criterion.
  fact_ids:
  - SFACT-110
  - SFACT-111
  - SFACT-112
---
# System specification
