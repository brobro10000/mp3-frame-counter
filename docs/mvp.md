# V1 MP3 frame counter requirements

Status: **proposed plan for human review, 2026-10-09**. Fixed user requirements below are distinguished from proposed
edge behavior and operational choices. P0 creates documents only. PR #1's foundation is already merged at `143498a`; no
parser, API, browser application, acceptance suite or managed deployment exists.

V1 is the first functional product: select an MP3, upload its raw bytes and display its correct MPEG Version 1 Audio
Layer 3 physical frame count. It also includes an independently reviewed acceptance baseline, reproducible local
operation and the first managed release with verified recovery. V1 is neither an orchestrator version nor a selected
semantic release number.

Read the [source register](requirements/README.md), [acceptance contract](testing/acceptance-contract.md),
[architecture](architecture/v1.md), [deployment evaluation](architecture/deployment.md) and
[decision/risk register](architecture/decisions.md) together. The unified brief supersedes the previous no-cloud,
manual-browser-only, three-phase and single-lockfile-without-exception draft choices. Actual merged work and the owner's
review exception remain intact by the user's explicit confirmation.

## Traceable requirements

All rows are required for V1, with implementation/evidence **pending**. IDs retain their original subject; amended
choices and added requirements are explicit. AC references are proposed external observations, not existing tests.
Original assessment and release IDs continue to apply.

| ID         | V1 requirement                                                                                                                                                                                                     | Assessment/release trace                  | Planned evidence / phase                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | -------------------------------------------------------------- |
| APP-V1-001 | Static HTML/minimal JavaScript: labeled file input, exact Analyze MP3 action, accessible pending/result/error, safe text, no duplicate pending submission and retry after any outcome.                             | APP-REQ-002; APP-EVAL-002,005             | AC-01,03,11,12; P4/P5                                          |
| APP-V1-002 | TypeScript API with native node:http; raw POST /file-upload accepts audio/mpeg and application/octet-stream, returns exactly a positive integer frameCount in JSON.                                                | APP-REQ-001,002,006; APP-OPEN-001,004     | AC-02,03,05,06,10; P4/P5                                       |
| APP-V1-003 | Inclusive 20,971,520-byte limit enforced on actual received bytes; bounded whole-buffer collection, abort/oversize cleanup and usable errors.                                                                      | APP-EVAL-005,006; APP-OPEN-002,003        | AC-07,08,09,12 plus source/resource review; P4/P5              |
| APP-V1-004 | Pure synchronous TypeScript parser walks complete MPEG-1 Layer III frames, using each header's bitrate/sample rate/padding; no npm/external parser, duration estimate or sync scanning through payload/corruption. | APP-SCOPE-001; APP-REQ-003,004,005        | AC-02,04,05,06; independent unit evidence; P3                  |
| APP-V1-005 | Count complete metadata-bearing MPEG frames; exclude supported separate ID3 records; explicitly document supported tag forms and first-pass limitations.                                                           | APP-REQ-003; APP-OPEN-005,007             | Reviewed format policy and oracle; AC-04–06; P2/P3             |
| APP-V1-006 | Independently buildable non-root frontend NGINX and API Node LTS images, pinned verified bases and minimal contents.                                                                                               | APP-SUB-002; APP-REL-001,004              | Clean independent builds and image inspection; P4              |
| APP-V1-007 | Exactly two default Compose application services; frontend loopback origin only, private API, per-service health, bounded startup, aligned proxy and API behavior.                                                 | APP-REQ-002,006; APP-EVAL-005             | AC-01–12 through public frontend; P4                           |
| APP-V1-008 | Thin Make commands and clear setup/test instructions; ordinary users need no private plugin. Each script documents its purpose and operation.                                                                      | APP-EVAL-004; APP-SUB-002,003             | Reproducible reviewer handoff; P1–P5                           |
| APP-V1-009 | MediaInfo evidence establishes/reconciles independent physical-frame expectations; private assessment bytes remain untracked and are not a CI dependency.                                                          | APP-ASSET-001; APP-REQ-003; APP-GUIDE-001 | Reviewed fixture provenance, hashes and sample evidence; P2/P3 |
| APP-V1-010 | Built-in Node unit tests and real fail-closed CI, with separate locked Playwright acceptance package as an explicit dependency-boundary exception.                                                                 | APP-EVAL-001,003,004; APP-GUIDE-002       | Harness evidence P2; parser P3; real mandatory E2E P4/P5       |
| APP-V1-011 | Amended from three to five separately authorized future phases, each stopping for review; preserve actual foundation history and owner-only PR review exception.                                                   | APP-EVAL-007,008; APP-SUB-001             | Phase/PR evidence and live control audit; P1–P5                |
| APP-V1-012 | Amended from local delivery to managed release; retain all six first-MVP release requirements, including automatic versions, tags/private releases and recovery.                                                   | APP-REL-001–006                           | Actual complete release and recovery evidence; P5              |
| APP-V1-013 | Independently authored, reviewed executable black-box baseline precedes product code; implementer cannot weaken baseline or gate logic.                                                                            | APP-EVAL-001,003; unified brief §6        | Recorded suite revision, fixture hash and review before P3; P2 |
| APP-V1-014 | Preserve the 20 MiB contract through managed TLS ingress, frontend and private API; approve provider, access and budget before cloud setup.                                                                        | APP-REL-001,005; unified brief §5         | Dated fit evidence and same full candidate suite; P5           |
| APP-V1-015 | Promote an exact verified compatible artifact pair after explicit production approval; bind configuration, smoke and prior-good recovery/first-release abort.                                                      | APP-REL-002–006; unified brief §7         | Release manifest and actual verification/rehearsal; P5         |
| APP-V1-016 | Retain simple replaceable transport/parser/frontend/deployment boundaries; add infrastructure only for approved measured needs.                                                                                    | APP-EVAL-005; unified brief §5            | Architecture/source review and evolution trigger record; P3–P5 |

## Fixed boundaries and limits

No retained uploads, database, object storage, user accounts, history, background jobs, player, drag-and-drop or
percentage progress. No audio decoding, CRC validation, corruption recovery, streaming parser, frontend
framework/bundler, HTTP framework, Kubernetes, Terraform or generalized provider adapter framework. No production npm
dependencies initially. The acceptance harness has its own development dependencies/lockfile; this does not introduce
workspaces.

The complete bounded Buffer and synchronous parser simplify reasoning but constrain concurrent throughput and event-loop
latency. A per-file cap does not cap aggregate memory. P4 must choose and measure memory, admission and timeout budgets;
P5 must verify them on the chosen host. There is no fabricated throughput promise.

Raw-body upload is our convention, not an assessment-mandated multipart format. Free-format bitrate and unsupported tag
layouts are proposed first-pass limitations, not exclusions granted by the assessment. Review residual assessment risk
before freezing P2 expectations. The assessment receipt date remains unknown; do not infer its five-day target from this
planning date.

## Completion boundary

Follow P1 foundation verification/adaptation → P2 independent acceptance baseline → P3 parser → P4 integrated local
product → P5 managed deployment. P0 ends at human review. Dependencies do not authorize execution or merging.

Completion requires applicable AC-01–12 locally and on an identified nonproduction candidate, the source/configuration
checks black-box tests cannot prove, reconciled supplied-sample evidence, independent image builds, all APP-REL-001–006
evidence and a reproducible handoff. CI success, human review, merge, candidate verification, production approval and
deployed success are distinct states. No current row is verified by this document.
