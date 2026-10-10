# V1 MP3 frame counter requirements

Status: **execution authorized, 2026-10-09**. Planning PR #2 merged at `0c9f538`, and the owner instructed execution of
P1–P5. Read the [authorization record](phases/execution-authorization.md) and actual phase evidence before inferring
completion. Fixed requirements remain distinct from operational choices and independently reviewed edge behavior.

V1 is the first functional product: select an MP3, upload its raw bytes and display its correct MPEG Version 1 Audio
Layer 3 physical frame count. It also includes an independently reviewed acceptance baseline, reproducible local
operation and automatic GitHub releases of tested images without deployment. The latest owner amendment defers managed
hosting and recovery; see [release requirements](requirements/release-process.md). V1 is neither an orchestrator version
nor a selected semantic release number.

Read the [source register](requirements/README.md), [acceptance contract](testing/acceptance-contract.md),
[architecture](architecture/v1.md), [deployment evaluation](architecture/deployment.md) and
[decision/risk register](architecture/decisions.md) together. The unified brief supersedes the previous no-cloud,
manual-browser-only, three-phase and single-lockfile-without-exception draft choices. Actual merged work and the owner's
review exception remain intact by the user's explicit confirmation.

## Traceable requirements

Product rows remain required for V1. APP-V1-012 is amended to repository releases; APP-V1-014 and hosted portions of
APP-V1-015 are deferred by SRC-RELEASE-ONLY. IDs retain their original subjects and source traceability. AC references
identify the independently frozen external acceptance contract. Planned evidence below describes the required boundary;
the separate status table records actual observations. Original assessment and release IDs continue to apply.

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
| APP-V1-011 | Execute five ordered phases under the owner's unattended execution instruction, with independent review and evidence; preserve foundation history, core controls and owner-only review exception.                  | APP-EVAL-007,008; APP-SUB-001             | Phase/PR evidence and live control audit; P1–P5                |
| APP-V1-012 | Publish automatic versions, tags and private GitHub releases with exact tested image archives; apply amended APP-REL-001–006 without deployment.                                                                   | APP-REL-001–006                           | Actual repository release and retry evidence; P5               |
| APP-V1-013 | Independently authored, reviewed executable black-box baseline precedes product code; implementer cannot weaken baseline or gate logic.                                                                            | APP-EVAL-001,003; unified brief §6        | Recorded suite revision, fixture hash and review before P3; P2 |
| APP-V1-014 | Deferred hosting: preserve the 20 MiB contract through managed TLS ingress; approve provider, access and budget before cloud setup.                                                                                | APP-REL-001,005; unified brief §5         | Dated fit evidence and same full candidate suite; P5           |
| APP-V1-015 | Retain an exact tested image pair and source/configuration identity for release; defer production approval, rollout, hosted smoke and recovery.                                                                    | APP-REL-002–006; unified brief §7         | Release manifest now; hosted verification/rehearsal deferred   |
| APP-V1-016 | Retain simple replaceable transport/parser/frontend/deployment boundaries; add infrastructure only for approved measured needs.                                                                                    | APP-EVAL-005; unified brief §5            | Architecture/source review and evolution trigger record; P3–P5 |

## Current evidence and completion status

Observed locally on 2026-10-09 at clean application revision `2adf71b447bfee9b78e9bdfc2b29566af894d0fe`: **75 unit tests
and 60 of 60 unchanged external acceptance cases passed**, with zero skips and successful cleanup. See the
[P4 narrative and exact report](validation/p4-integration.md). Local verification is distinct from protected-main
publication, managed candidate verification and successful release.

| Requirements       | Current status and evidence                                                                                                                                                        | Remaining boundary                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| APP-V1-001–003     | Locally verified through the real frontend/API, including exact-limit and failure/recovery behavior; [P4](validation/p4-integration.md).                                           | Repeat acceptance at the actual integrated protected-main source; hosted checks are deferred.                     |
| APP-V1-004,005,009 | Independent oracle/format policy and parser verified locally; [P2](validation/p2-acceptance.md), [sample oracle](validation/sample-baseline.md) and [P3](validation/p3-parser.md). | Preserve the frozen policy and provenance during later release validation.                                        |
| APP-V1-006,007     | Independent non-root images and exact two-service local operation verified; [P4](validation/p4-integration.md).                                                                    | Exact CI archive publication remains pending; registry digests and managed configuration are deferred.            |
| APP-V1-008         | Working local Make/setup/test interface and script documentation; [README](../README.md).                                                                                          | Observe the first repository release; provider operations are deferred.                                           |
| APP-V1-010,013     | Independent test-only baseline precedes product code; unit/build/full local E2E and reviewed fail-closed controls exist; [baseline record](testing/independence-and-baseline.md).  | Baseline now bound to the separately merged P2 commit `a0a56d9`; revalidate the reconciled product source in CI.  |
| APP-V1-011         | P1/P2 reviewable handoffs and exact-head CI passed; P3/P4 independently reviewed local results exist; [phase sequence](phases/README.md).                                          | P1/P2 merged; product PR validation/merge and P5 publication remain; agent review is not human approval.          |
| APP-V1-012,014,015 | Release-only P5 pending; [latest amendment](requirements/release-process.md) defers deployment.                                                                                    | Active APP-REL-001–006 require protected-main CI and actual repository publication; hosted criteria are deferred. |
| APP-V1-016         | Parser, transport and frontend boundaries reviewed locally; [P3](validation/p3-parser.md) and [P4](validation/p4-integration.md).                                                  | Verify repository publication; retain hosting choices for future deployment work.                                 |

## Fixed boundaries and limits

No retained uploads, database, object storage, user accounts, history, background jobs, player, drag-and-drop or
percentage progress. No audio decoding, CRC validation, corruption recovery, streaming parser, frontend
framework/bundler, HTTP framework, Kubernetes, Terraform or generalized provider adapter framework. No production npm
dependencies initially. The acceptance harness has its own development dependencies/lockfile; this does not introduce
workspaces.

The complete bounded Buffer and synchronous parser simplify reasoning but constrain concurrent throughput and event-loop
latency. A per-file cap does not cap aggregate memory. P4 selected and measured memory, admission and timeout budgets;
the [integration record](validation/p4-integration.md) states their values and observational limits. Future deployment
must verify them on the chosen host. There is no fabricated throughput promise.

Raw-body upload is our convention, not an assessment-mandated multipart format. Free-format bitrate and unsupported tag
layouts are reviewed r3 first-pass limitations, not exclusions granted by the assessment. P2 recorded the format policy,
sample compatibility and independent review before the local baseline freeze; its evidence does not claim universal MP3
support. The assessment receipt date remains unknown; do not infer its five-day target from this planning date.

## Completion boundary

Follow P1 foundation verification/adaptation → P2 independent acceptance baseline → P3 parser → P4 integrated local
product → P5 repository releases without deployment. The later owner instruction authorizes execution across these
phases. Dependencies and passing tests alone do not authorize an owner review override or establish production approval.

Completion requires applicable AC-01–12 on the exact integrated source, source/configuration checks black-box tests
cannot prove, reconciled supplied-sample evidence, independent image builds, all active release-only APP-REL-001–006
criteria and a reproducible handoff. Observe protected-main CI and the resulting tag/private GitHub release before
claiming automatic release completion. Deployment, candidate verification, production approval and hosted recovery are
deferred. CI success, human review, merge, publication and deployed success remain distinct states.
