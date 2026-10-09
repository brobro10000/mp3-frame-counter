# Formalized assessment requirements

Baseline: **2026-10-09**. Source: [SRC-ASSESSMENT](sources/assessment.html), titled **Technical Assessment: MP3 File
Analysis App**. Source locations below refer to its visible section headings and named bullets.
[SRC-FOUNDATION](sources/foundation-request.txt), section 1, independently confirms the future application scope but
authorizes only repository foundation work.

This registry distinguishes explicit **must** requirements from **evaluation criteria**, **submission expectations**,
**optional guidance** and a **time target**. Acceptance evidence describes how to verify the source requirement; it does
not select a framework, upload encoding or unprovided limits. No application behavior is implemented yet.

The later [first application MVP release amendment](release-process.md) adds mandatory deployment and release-process
criteria under `APP-REL-001` through `APP-REL-006`. Read both registries when planning or auditing that MVP; those added
requirements do not change the preserved assessment source.

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

| ID          | Requirement                                                                                                                                             | Source location                                                       | Acceptance evidence to record                                                                                                                              | Status / current evidence                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| APP-REQ-001 | Implement the application in TypeScript.                                                                                                                | Requirements: use TypeScript.                                         | Application source and a passing TypeScript validation/build command.                                                                                      | Not implemented. Existing JavaScript scripts are foundation tooling. |
| APP-REQ-002 | Host `POST /file-upload` and accept an MP3 file upload.                                                                                                 | API Specification: endpoint bullet.                                   | An HTTP integration test uploads a compatible MP3 to the exact method and path.                                                                            | Not implemented.                                                     |
| APP-REQ-003 | Correctly count frames in MPEG Version 1 Audio Layer 3 files, including the supplied sample.                                                            | API Specification: supported-format bullet; Objective: sample.        | Supported-format fixtures and the supplied sample agree with independently established expected counts.                                                    | Not implemented; the sample's expected count is not supplied.        |
| APP-REQ-004 | Parse the MP3 file to logically count its frames.                                                                                                       | Requirements: parse and logically count.                              | Parser implementation and tests demonstrate counting from MP3 structure.                                                                                   | Not implemented.                                                     |
| APP-REQ-005 | Do not use an NPM package to parse MP3 frame data directly. Packages for other purposes, such as generic utilities or an HTTP framework, are permitted. | Requirements: NPM restriction and permission.                         | Review application dependencies and parser calls for direct third-party MP3 frame parsing. Optional external verification is separate from implementation. | Not implemented; no application dependencies selected.               |
| APP-REQ-006 | Return JSON with correct response headers and the shape `{ "frameCount": <number> }`, where the numeric value is the correct frame count.               | API Specification: response example and note; Requirements: response. | HTTP tests verify JSON headers, response shape, numeric value and agreement with the fixture's reference count.                                            | Not implemented.                                                     |

## Evaluation criteria

These are explicitly assessed qualities. The source gives no scoring weights, code-coverage threshold, throughput
target, memory budget or maximum supported file size. The evidence column names useful verification, not extra
assessment mandates.

| ID           | Evaluated criterion                                                                       | Source location                      | Evidence to record                                                                                          | Status / current evidence                                                                                                |
| ------------ | ----------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| APP-EVAL-001 | Meet the requirements, determine frame counts correctly and handle errors appropriately.  | Evaluation Criteria: Correctness.    | Traceability to mandatory requirements, passing correctness tests and error-case results.                   | Application evidence pending.                                                                                            |
| APP-EVAL-002 | Keep code well-organized, readable and maintainable.                                      | Evaluation Criteria: Code Quality.   | Review of module responsibilities, naming, readability and documentation.                                   | Application evidence pending.                                                                                            |
| APP-EVAL-003 | Follow TypeScript good practices and use its features effectively.                        | Evaluation Criteria: Code Quality.   | TypeScript configuration, application type checks and code review.                                          | Application evidence pending.                                                                                            |
| APP-EVAL-004 | Include standardized tooling for formatting, linting, testing and related quality checks. | Evaluation Criteria: Code Quality.   | Documented repeatable commands and their results.                                                           | Partial: foundation formatting, workflow linting and gate tests exist in `package.json`; application tooling is pending. |
| APP-EVAL-005 | Handle errors appropriately and gracefully, with useful messages to the user.             | Evaluation Criteria: Error Handling. | Documented error contract and tests for agreed error cases and useful messages.                             | Pending decisions and application implementation.                                                                        |
| APP-EVAL-006 | Handle large files scalably and optimize performance.                                     | Evaluation Criteria: Scalability.    | Documented design tradeoffs and reproducible large-file time/resource observations against declared inputs. | Unverified; no size or performance target supplied.                                                                      |
| APP-EVAL-007 | Use Git effectively.                                                                      | Evaluation Criteria: Approach.       | Reviewable commits and PR history for the completed solution.                                               | Partial: a foundation branch and PR exist; application work is pending.                                                  |
| APP-EVAL-008 | Show evidence of a structured approach.                                                   | Evaluation Criteria: Approach.       | Requirement-linked plans, implementation steps, test evidence and recorded decisions.                       | Partial: foundation planning and this requirements registry exist.                                                       |

## Submission expectations and timeframe

| ID           | Expectation                                                      | Source location | Acceptance evidence to record                                                               | Status                                                                                       |
| ------------ | ---------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| APP-SUB-001  | Provide the solution as a Git repository.                        | Submission.     | The submitted repository contains the completed solution.                                   | Partial: repository exists; application is not implemented.                                  |
| APP-SUB-002  | Include clear instructions for running the application.          | Submission.     | A reviewer can follow documented setup and run commands.                                    | Pending; current README commands cover foundation tooling only.                              |
| APP-SUB-003  | Include an example of how to test the application.               | Submission.     | A runnable documented test/upload example and its expected response or verification method. | Pending.                                                                                     |
| APP-TIME-001 | Aim to complete the assessment within five days of receiving it. | Timeframe.      | Record the actual receipt date and resulting target date if supplied.                       | Target only; receipt date and deadline are unknown. Do not infer them from this import date. |

## Guidance and permissions

| ID            | Guidance                                                                                                                                        | Source location | Interpretation for future work                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| APP-GUIDE-001 | A tool such as `mediainfo` may be used to verify results.                                                                                       | Tips.           | Optional independent verification aid, not a required dependency or a replacement for the parser. Record tool/version and method if used. |
| APP-GUIDE-002 | Test the final solution before submission.                                                                                                      | Tips.           | Retain results for the final submitted revision. Current foundation tests do not verify the future application.                           |
| APP-GUIDE-003 | Prioritize a working solution within the allotted time. Brief comments about future improvements may be left for interview discussion.          | Tips.           | Avoid unnecessary scope expansion; improvement comments are optional.                                                                     |
| APP-GUIDE-004 | AI assistance is permitted, but the submission is the candidate's own work and should reflect their style; they must understand and explain it. | Tips.           | Keep the solution understandable to its author and record decisions they can explain. This is not a ban on AI assistance.                 |

## Supplied sample

`APP-ASSET-001` identifies [the local assessment sample](samples/README.md). Its bytes and identity are recorded, but
its correct frame count is **unknown**. Moving or identifying the MP3 does not establish parser correctness. Do not
populate expected test results from the implementation under test and present them as independent evidence.

## Open decisions

These details are not fixed by the source. Resolve them in an authorized implementation phase, with rationale and
affected IDs. They are not prerequisites for preserving this requirements baseline.

| ID           | Unspecified detail                                                                                                                                                                                                    | Related IDs                                         |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| APP-OPEN-001 | Upload encoding and field name, such as multipart versus a raw request body.                                                                                                                                          | APP-REQ-002, APP-SUB-003                            |
| APP-OPEN-002 | Error status codes and response shape for missing, invalid, malformed, truncated or unsupported files. Other MPEG support remains out of scope.                                                                       | APP-EVAL-005, APP-SCOPE-001                         |
| APP-OPEN-003 | File-size limits, concurrency, resource budgets and measurable performance targets.                                                                                                                                   | APP-EVAL-006                                        |
| APP-OPEN-004 | HTTP framework, application test framework, execution/hosting arrangement and application commands.                                                                                                                   | APP-REQ-001, APP-REQ-002, APP-EVAL-004, APP-SUB-002 |
| APP-OPEN-005 | Independently verified sample frame count and the reference method used to establish it.                                                                                                                              | APP-REQ-003, APP-REQ-006, APP-ASSET-001             |
| APP-OPEN-006 | Actual assessment receipt date and the corresponding five-day target date.                                                                                                                                            | APP-TIME-001                                        |
| APP-OPEN-007 | Parser treatment of metadata, trailing data and incomplete/corrupt frames, and the fixture cases needed to verify those choices. The source does not prescribe a parser architecture or individual metadata variants. | APP-REQ-003, APP-REQ-004, APP-EVAL-005              |

Deployment is required by `APP-REL-001` through `APP-REL-006`; `APP-OPEN-004` leaves the hosting choice open, not
whether the first application MVP includes deployment.

## Updating evidence

Replace pending status with links to the relevant implementation and tests as work is completed. Mark a requirement
verified only after recording the command, actual result and tested revision. An evaluation criterion can remain
partially evidenced; a plan, source capture, passing foundation CI or retained historical orchestrator report is not
proof that the application meets it. Preserve IDs and source provenance when revising this registry.
