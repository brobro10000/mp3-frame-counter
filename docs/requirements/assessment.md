# Formalized assessment requirements

Baseline: **2026-10-09**. Source: [SRC-ASSESSMENT](sources/assessment.html), titled **Technical Assessment: MP3 File
Analysis App**. Source locations below refer to its visible section headings and named bullets.
[SRC-FOUNDATION](sources/foundation-request.txt), section 1, independently confirms the future application scope but
authorizes only repository foundation work.

This registry distinguishes explicit **must** requirements from **evaluation criteria**, **submission expectations**,
**optional guidance** and a **time target**. Acceptance evidence describes how to verify the source requirement; it does
not select a framework, upload encoding or unprovided limits. The application is merged and the release-only V1
milestone is [verified](../validation/v1-closure.md), including protected-main acceptance and actual publication/retry.
The evidence below records observations, not a certification, evaluator score or external submission.

The active [release-only amendment](release-process.md), SRC-RELEASE-ONLY, requires repository releases under
`APP-REL-001` through `APP-REL-006` and defers deployment. It supersedes the earlier deploy-before-release instruction.
Read both registries when planning or auditing that MVP; later amendments do not change the preserved assessment source.

**Current submission candidate — 2026-10-11 UTC:**
[v0.3.37](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.3.37) at
`07c020c40f4a0238da937b82f24e4ef50cb37824` uses Fastify, raw-body uploads, a 20 MiB limit, Node unit tests, independent
Playwright acceptance, offline Redoc/OpenAPI and separate containers. Existing
[main CI 38103007563, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38103007563/attempts/1)
passed 120 units and all 72 required docs-v1 local cases with cleanup. Hosted-v1 is bound but pending; no application
deployment is established. The [submission tradeoffs](../architecture/decisions.md#submission-tradeoffs--2026-10-11-utc)
map the implementation to evaluation criteria. Historical native-HTTP planning and the observations below retain their
original sources and counts; they do not describe a new test run. Refreshed [README commands](../../README.md) still
require a final clean-checkout walkthrough. Evaluator access, receipt/deadline and external submission are unverified.

The historical [P4 integration record](../validation/p4-integration.md) binds local evidence to clean revision
`2adf71b447bfee9b78e9bdfc2b29566af894d0fe`. P2 subsequently merged separately as `a0a56d9`, and the unchanged acceptance
suite is bound to that protected-main commit. Product PR CI at `3e7e21d` passed 75 unit tests and all 60 external cases;
[run 38012435332](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38012435332) records that result. PR #5
subsequently merged at `ce50762b`; exact main CI repeated those checks and published `v0.1.6`. The
[V1 closure](../validation/v1-closure.md) records assets, an identical publisher retry and remaining limits; the
[execution status](../validation/execution-status.md) preserves chronology. Deployment remains deferred.

## Current backend amendment and handoff — 2026-10-11

The [owner amendment](backend-audio-refactor.md) preserves the assessment source and exact default JSON shape, while
selecting computed audio count and canonical coded errors for this successor. Its identified sample result is 6089 audio
= 6090 physical minus one supported Xing carrier; the employer's numeric oracle remains unconfirmed. Historical counts
below retain their original physical convention and dated evidence.

Use the [criterion-by-criterion handoff](../handoff/evaluation.md) for current TypeScript/Fastify/TypeBox/React source,
localized unit tests, independent acceptance, error handling, measured resource limits and approach. The
[known gaps](../handoff/known-gaps.md) map remaining uncertainty to provisional follow-up. Local proof is in the
[verification record](../validation/backend-audio-refactor.md); successor binding, merge and publication must be
recorded separately before this target is declared shipped. Major product work freezes after its reviewed merge. Hosting
and production v1.0.0 remain deferred, independent of local assessment handoff.

## Objective and scope

Build a TypeScript API that accepts an MP3 file and returns its correct frame count. The assessment also evaluates
learning and applying unfamiliar knowledge, TypeScript competency, and the candidate's own coding style and choices.

| ID            | Scope statement                                                                                                       | Source                                                  |
| ------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| APP-SCOPE-001 | MPEG Version 1 Audio Layer 3 is the supported format. Handling other MPEG formats is explicitly outside the exercise. | API Specification: supported-format bullet and warning. |

The source repeats the JSON-response introduction and places the out-of-scope warning inside a block labelled JSON.
These are formatting artifacts: there is one JSON response contract, and the warning describes scope rather than a
response body. The original HTML remains unchanged for comparison.

## Mandatory requirements

| ID          | Requirement                                                                                                                                             | Source location                                                       | Acceptance evidence to record                                                                                                                              | Status / current evidence                                                                                                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| APP-REQ-001 | Implement the application in TypeScript.                                                                                                                | Requirements: use TypeScript.                                         | Application source and a passing TypeScript validation/build command.                                                                                      | Verified: native [TypeScript API](../../server/src/http.ts), strict build and main CI at the [released source](../validation/v1-closure.md).                                                                                                     |
| APP-REQ-002 | Host `POST /file-upload` and accept an MP3 file upload.                                                                                                 | API Specification: endpoint bullet.                                   | An HTTP integration test uploads a compatible MP3 to the exact method and path.                                                                            | Verified: [native endpoint](../../server/src/http.ts) and full frontend/HTTP acceptance passed on released main; [closure](../validation/v1-closure.md).                                                                                         |
| APP-REQ-003 | Correctly count frames in MPEG Version 1 Audio Layer 3 files, including the supplied sample.                                                            | API Specification: supported-format bullet; Objective: sample.        | Supported-format fixtures and the supplied sample agree with independently established expected counts.                                                    | Verified within the reviewed r3 scope: independent fixtures pass on released main. Historical supplied-sample upload agrees with the independent [6,090 physical-frame oracle](../validation/sample-baseline.md); private bytes stay outside CI. |
| APP-REQ-004 | Parse the MP3 file to logically count its frames.                                                                                                       | Requirements: parse and logically count.                              | Parser implementation and tests demonstrate counting from MP3 structure.                                                                                   | Verified: [header-by-header parser](../../server/src/mp3.ts), independently expected fixtures and 56 parser cases passed on released main; [closure](../validation/v1-closure.md).                                                               |
| APP-REQ-005 | Do not use an NPM package to parse MP3 frame data directly. Packages for other purposes, such as generic utilities or an HTTP framework, are permitted. | Requirements: NPM restriction and permission.                         | Review application dependencies and parser calls for direct third-party MP3 frame parsing. Optional external verification is separate from implementation. | Verified by [parser source](../../server/src/mp3.ts), dependency review and exact-head companion review; no runtime parser package. See [closure](../validation/v1-closure.md).                                                                  |
| APP-REQ-006 | Return JSON with correct response headers and the shape `{ "frameCount": <number> }`, where the numeric value is the correct frame count.               | API Specification: response example and note; Requirements: response. | HTTP tests verify JSON headers, response shape, numeric value and agreement with the fixture's reference count.                                            | Verified: [HTTP unit tests](../../tests/unit/http.test.ts) and released-main external acceptance check headers, exact shape and independent counts; [closure](../validation/v1-closure.md).                                                      |

## Evaluation criteria

These are explicitly assessed qualities. The source gives no scoring weights, code-coverage threshold, throughput
target, memory budget or maximum supported file size. The evidence column names useful verification, not extra
assessment mandates.

| ID           | Evaluated criterion                                                                       | Source location                      | Evidence to record                                                                                          | Status / current evidence                                                                                                                                                                                                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| APP-EVAL-001 | Meet the requirements, determine frame counts correctly and handle errors appropriately.  | Evaluation Criteria: Correctness.    | Traceability to mandatory requirements, passing correctness tests and error-case results.                   | Evidence: 75 unit and 60 external cases passed on released main; [closure](../validation/v1-closure.md). Hosted verification stays deferred.                                                                                                                                                          |
| APP-EVAL-002 | Keep code well-organized, readable and maintainable.                                      | Evaluation Criteria: Code Quality.   | Review of module responsibilities, naming, readability and documentation.                                   | Local evidence: separated parser, HTTP and frontend responsibilities plus independent [parser](../validation/p3-parser.md), [API](../validation/p4-api.md) and [frontend](../validation/p4-frontend.md) review.                                                                                       |
| APP-EVAL-003 | Follow TypeScript good practices and use its features effectively.                        | Evaluation Criteria: Code Quality.   | TypeScript configuration, application type checks and code review.                                          | Local evidence: strict [TypeScript configuration](../../tsconfig.json), passing compilation and reviewed parser/API types; [P3](../validation/p3-parser.md) and [P4](../validation/p4-integration.md).                                                                                                |
| APP-EVAL-004 | Include standardized tooling for formatting, linting, testing and related quality checks. | Evaluation Criteria: Code Quality.   | Documented repeatable commands and their results.                                                           | Evidence: formatting, workflow lint, policy, portability, 16 diagram renders, unit/build/acceptance and release publication/retry passed; [closure](../validation/v1-closure.md).                                                                                                                     |
| APP-EVAL-005 | Handle errors appropriately and gracefully, with useful messages to the user.             | Evaluation Criteria: Error Handling. | Documented error contract and tests for agreed error cases and useful messages.                             | Local evidence: reviewed [r3 error contract](../testing/acceptance-contract.md) and [real browser/HTTP failure and recovery cases](../validation/p4-integration.md).                                                                                                                                  |
| APP-EVAL-006 | Handle large files scalably and optimize performance.                                     | Evaluation Criteria: Scalability.    | Documented design tradeoffs and reproducible large-file time/resource observations against declared inputs. | Locally measured: 20 MiB actual-byte cap, two admitted buffers, third-request 503, ten exact-limit successes, bounded measured memory and no observed OOM/persistence; [resource evidence](../validation/p4-integration.md). Managed-host measurements are deferred; no general throughput guarantee. |
| APP-EVAL-007 | Use Git effectively.                                                                      | Evaluation Criteria: Approach.       | Reviewable commits and PR history for the completed solution.                                               | Evidence: ordered commits, separately reviewed/merged P1/P2 PRs and reviewed product PR #5 merge, followed by immutable release; [progression](../validation/execution-status.md).                                                                                                                    |
| APP-EVAL-008 | Show evidence of a structured approach.                                                   | Evaluation Criteria: Approach.       | Requirement-linked plans, implementation steps, test evidence and recorded decisions.                       | Evidence: stable IDs, independent baseline before product, phase handoffs and verified active P1–P5 completion; [closure](../validation/v1-closure.md). Generated plugin completion is not claimed.                                                                                                   |

## Submission expectations and timeframe

| ID           | Expectation                                                      | Source location | Acceptance evidence to record                                                               | Status                                                                                                                                                                                                                                                                                                   |
| ------------ | ---------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| APP-SUB-001  | Provide the solution as a Git repository.                        | Submission.     | The submitted repository contains the completed solution.                                   | Published candidate and existing CI are identified above. Evaluator access and actual external submission remain unverified.                                                                                                                                                                             |
| APP-SUB-002  | Include clear instructions for running the application.          | Submission.     | A reviewer can follow documented setup and run commands.                                    | [README](../../README.md#run-locally) gives Docker setup, launch, health checks and logs. Local source startup and the received v0.3.57 walkthrough were verified on 2026-10-11; CI/publication and platform installation evidence remain separately scoped.                                             |
| APP-SUB-003  | Include an example of how to test the application.               | Submission.     | A runnable documented test/upload example and its expected response or verification method. | [Local handoff](../deployment/local-handoff.md#optional-known-count-fixture) decodes and uploads the committed fixture with independent expectation 9. The received v0.3.57 API/browser smoke passed on 2026-10-11; [fixture provenance](../../tests/acceptance/fixtures/README.md) supplies the oracle. |
| APP-TIME-001 | Aim to complete the assessment within five days of receiving it. | Timeframe.      | Record the actual receipt date and resulting target date if supplied.                       | Target only; receipt date and deadline are unknown. Do not infer them from this import date.                                                                                                                                                                                                             |

## Guidance and permissions

| ID            | Guidance                                                                                                                                        | Source location | Interpretation for future work                                                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| APP-GUIDE-001 | A tool such as `mediainfo` may be used to verify results.                                                                                       | Tips.           | Optional independent verification aid, not a required dependency or a replacement for the parser. Record tool/version and method if used.                                                |
| APP-GUIDE-002 | Test the final solution before submission.                                                                                                      | Tips.           | Retain results for the final submitted revision. Local application evidence exists; revalidate the merged identity before final submission; hosted checks apply when deployment resumes. |
| APP-GUIDE-003 | Prioritize a working solution within the allotted time. Brief comments about future improvements may be left for interview discussion.          | Tips.           | Avoid unnecessary scope expansion; improvement comments are optional.                                                                                                                    |
| APP-GUIDE-004 | AI assistance is permitted, but the submission is the candidate's own work and should reflect their style; they must understand and explain it. | Tips.           | Keep the solution understandable to its author and record decisions they can explain. This is not a ban on AI assistance.                                                                |

## Supplied sample

`APP-ASSET-001` identifies [the local assessment sample](samples/README.md). Its bytes and identity are recorded, and
its independent physical-frame expectation is **6,090**. The [P2 oracle record](../validation/sample-baseline.md)
reconciles 6,089 independently demuxed audio packets with one complete Xing-bearing MPEG frame before product code
existed. [P3 parser checks](../validation/p3-parser.md) and [P4 public upload](../validation/p4-integration.md) agree.
The private bytes remain ignored and are not a CI dependency. Never populate expected results from the implementation
under test and present them as independent evidence.

## Source-open decisions and current resolutions

These details are not fixed by the original source. The stable IDs and original unspecified details remain below;
current decisions and evidence are recorded separately. An unresolved managed-host question does not erase a verified
local decision.

| ID           | Unspecified detail                                                                                                                                                                                                    | Related IDs                                         | Current resolution / evidence                                                                                                                                                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| APP-OPEN-001 | Upload encoding and field name, such as multipart versus a raw request body.                                                                                                                                          | APP-REQ-002, APP-SUB-003                            | Resolved locally: raw request body, no multipart field; [r3 contract](../testing/acceptance-contract.md).                                                                                                                                                        |
| APP-OPEN-002 | Error status codes and response shape for missing, invalid, malformed, truncated or unsupported files. Other MPEG support remains out of scope.                                                                       | APP-EVAL-005, APP-SCOPE-001                         | Resolved: reviewed r3 status/JSON and error precedence; [contract](../testing/acceptance-contract.md), [P4 results](../validation/p4-integration.md).                                                                                                            |
| APP-OPEN-003 | File-size limits, concurrency, resource budgets and measurable performance targets.                                                                                                                                   | APP-EVAL-006                                        | Resolved locally: inclusive 20 MiB, admission/resource/time budgets and [measured behavior](../validation/p4-integration.md). Managed-host verification is deferred; no unsupported performance target.                                                          |
| APP-OPEN-004 | HTTP framework, application test framework, execution/hosting arrangement and application commands.                                                                                                                   | APP-REQ-001, APP-REQ-002, APP-EVAL-004, APP-SUB-002 | Implemented: Fastify, Node unit tests, standalone Playwright, offline Redoc/OpenAPI, two containers and Make commands; [current decisions](../architecture/decisions.md#submission-tradeoffs--2026-10-11-utc). Hosted delivery remains separate from submission. |
| APP-OPEN-005 | Independently verified sample frame count and the reference method used to establish it.                                                                                                                              | APP-REQ-003, APP-REQ-006, APP-ASSET-001             | Resolved independently before product code: [6,090 physical frames and oracle method](../validation/sample-baseline.md); P3/P4 comparisons passed.                                                                                                               |
| APP-OPEN-006 | Actual assessment receipt date and the corresponding five-day target date.                                                                                                                                            | APP-TIME-001                                        | Still unknown; no receipt date or deadline has been inferred.                                                                                                                                                                                                    |
| APP-OPEN-007 | Parser treatment of metadata, trailing data and incomplete/corrupt frames, and the fixture cases needed to verify those choices. The source does not prescribe a parser architecture or individual metadata variants. | APP-REQ-003, APP-REQ-004, APP-EVAL-005              | Resolved for r3: [reviewed metadata, truncation and unsupported-format policy](../testing/acceptance-contract.md), fixed fixtures and [P3 parser evidence](../validation/p3-parser.md).                                                                          |

The latest [release amendment](release-process.md), SRC-RELEASE-ONLY, requires repository releases without deployment.
Hosted verification is deferred; it is not an original assessment requirement or a current release prerequisite.

## Updating evidence

Replace pending status with links to the relevant implementation and tests as work is completed. Mark a requirement
verified only after recording the command, actual result and tested revision. An evaluation criterion can remain
partially evidenced; a plan, source capture, passing foundation CI or retained historical orchestrator report is not
proof that the application meets it. Preserve IDs and source provenance when revising this registry.

## Local owner successor target — 2026-10-11

The records above describe the released physical-count contract. The [new owner amendment](backend-audio-refactor.md)
adopts computed audio counts, optional diagnostics and coded errors; it does not rewrite the external assignment or
historical results. Its local implementation awaits reviewed policy/candidate adoption and actual suite binding.
