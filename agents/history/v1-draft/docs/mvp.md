# MP3 Frame Counter V1

Status: planning documents for review; no application phase is authorized or implemented by this planning pass. V1 names
the first functional MVP, not an application release number or the orchestrator version.

## Sources and precedence

Read the [central registry](requirements/README.md), [assessment](requirements/assessment.md),
[release requirements](requirements/release-process.md) and preserved
[V1 planning brief](requirements/sources/v1-planning-brief.md). The user authorized creating these planning documents on
2026-10-09. Supplied-document instructions describe the requested plan; they do not independently authorize execution.

The merged foundation is commit `143498aae11ad2e874d1c1afa43897d6e6352794`, from
[PR #1](https://github.com/brobro10000/mp3-frame-counter/pull/1). Its repository setup is reused, not recreated. The
[reconciliation record](architecture/v1-decisions.md) explains how this plan preserves the owner's review override, the
required release cycle and historical evidence while adopting the new application choices.

## Product and boundaries

A person selects an MP3 in a browser, uploads it and sees its physical MPEG-1 Layer III frame count or a useful error.
The API and parser use TypeScript; the UI uses static HTML and minimal browser JavaScript. There is no database,
retained upload, background processing or runtime external audio parser.

Two independently built containers run under local Docker Compose: an unprivileged NGINX frontend and a native Node
`node:http` API. The API buffers at most **20 MiB = 20,971,520 bytes**, then calls a pure synchronous parser. This
bounds each request body but does not establish a total memory or concurrency bound. Do not claim production-scale
performance.

Excluded: streaming parsing, audio decoding, CRC verification, corruption recovery, other MPEG versions/layers,
authentication, cloud hosting, Kubernetes, Terraform, queues, workers, React, a frontend bundler, live reload and
additional default runtime services. Free-format bitrate and unsupported tag layouts are V1 limitations, not exclusions
granted by the assessment. Record and review their compatibility impact before claiming assessment completeness.

## V1 requirement registry

These choices derive from `SRC-V1-BRIEF` and resolve or refine assessment decisions. Every row remains **planned**.
Implementation and verification evidence must be added for the actual tested revision; planning validation is separate.

| ID         | Required behavior or constraint                                                                                                                         | Source section                             | Acceptance and phase                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| APP-V1-001 | Accessible static UI with labelled file input, Analyze button, pending text and result/error area; prevent duplicate submissions and use `textContent`. | §3                                         | Manual browser checks, including network/non-JSON failures; Phase 3.                                                                      |
| APP-V1-002 | Native `node:http` API, raw upload body and exact success response; no HTTP framework or production npm dependencies initially.                         | §§2–3                                      | Typecheck/build and HTTP tests of method, path, MIME handling, status, headers and response; Phase 3.                                     |
| APP-V1-003 | Collect a bounded complete upload, enforcing actual bytes and cleaning up interrupted requests.                                                         | §3                                         | Exact-limit, over-limit, no-Content-Length and aborted-upload tests; usable 413 response; Phase 3.                                        |
| APP-V1-004 | Pure synchronous TypeScript physical frame counter with per-frame header validation and no third-party result calculation.                              | §§2, 4                                     | Known-count fixtures, bitrate/padding changes, payload sync patterns, invalid/reserved fields and truncation tests; Phase 2.              |
| APP-V1-005 | Validate and skip supported leading ID3v2 and recognized trailing ID3v1, with explicit metadata-frame counting conventions.                             | §4                                         | Tag-size/version/footer fixtures, documented supported layouts and independently reconciled sample count; Phase 2.                        |
| APP-V1-006 | Independently build static frontend and multi-stage non-root API images with pinned, verified base images and minimal contents.                         | §5                                         | Clean-context builds of each image, runtime content/user/startup checks and recorded real digests; Phase 3.                               |
| APP-V1-007 | Exactly two default Compose services, frontend-only loopback publication, health dependency and correct upload proxy behavior.                          | §5                                         | Health checks and frontend-origin upload/error tests, including valid input above 1 MiB, boundary agreement and unavailable API; Phase 3. |
| APP-V1-008 | Thin Make interface, reproducible local instructions and independent container-build commands.                                                          | §6                                         | Run every implemented target, verify failure propagation, bounded startup and paths containing spaces; Phase 3.                           |
| APP-V1-009 | Independently inspect the identified sample using MediaInfo before parser work and reconcile again after parsing/integration.                           | §7                                         | Real tool version, commands, format/count output, sample hash and explicit discrepancy resolution; Phases 1, 2 and 3.                     |
| APP-V1-010 | Meaningful progressive checks using Node's built-in test runner and self-contained synthetic fixtures.                                                  | §7                                         | Phase-specific checks execute real tests; no dummy builds, external sample requirement in ordinary CI or invented passes; all phases.     |
| APP-V1-011 | Three sequential phases, each requiring explicit authorization, scoped PR review and separate local/CI/review/merge evidence.                           | §§8, 10–12, reconciled with current policy | Phase reports trace requirements and stop before the next phase; all phases.                                                              |
| APP-V1-012 | Protected-main validation and separate commit-addressed API/frontend image delivery with Compose/Make instructions.                                     | §11, reconciled with APP-REL-001–006       | Main-only delivery, integrity metadata, least permissions and required release/recovery evidence; Phase 3.                                |

Original `APP-REQ-001`–`006`, applicable `APP-EVAL-*`, `APP-SUB-*` and all `APP-REL-001`–`006` remain required. The
orchestrator's `REQ-101`–`112` map to these V1 rows in order; they do not reuse historical foundation `REQ-001`/`002`.
Detailed source mappings are in [the architecture decision record](architecture/v1-decisions.md).

## HTTP and browser contract

The browser sends the selected `File` to relative `/file-upload` with `Content-Type: audio/mpeg`. Do not use FormData,
multipart parsing or the Docker service hostname in browser code. Raw-body upload is our convention, not a format
specified by the original assessment.

| Service  | Route               | Contract                                                                                   |
| -------- | ------------------- | ------------------------------------------------------------------------------------------ |
| Frontend | `GET /`             | HTML and static assets.                                                                    |
| Frontend | `POST /file-upload` | Proxy to `http://api:3000/file-upload`, preserving the path, API status and JSON.          |
| API      | `POST /file-upload` | Accept `audio/mpeg` or `application/octet-stream`, validate bytes, return the count.       |
| Both     | `GET /healthz`      | Lightweight health response for that service, using a real command available in its image. |

Success is HTTP 200 with `Content-Type: application/json` and exactly `{ "frameCount": <number> }`.
Application-generated errors use `{ "error": "Readable message" }`:

| Status | Meaning                                                         |
| ------ | --------------------------------------------------------------- |
| 400    | Empty/malformed MP3 or truncated frame.                         |
| 413    | Body exceeds 20,971,520 bytes.                                  |
| 415    | Unsupported media type, content encoding or MPEG version/layer. |
| 404    | Unknown route.                                                  |
| 405    | Unsupported method on a known route; include `Allow`.           |
| 500    | Unexpected failure; never expose a stack trace.                 |

Enforce both declared and actual body size. Accept bodies of exactly the limit if their contents are otherwise valid;
stop accumulation when the next bytes would exceed it. Handle client aborts/incomplete bodies without a partial count,
leaked state or unhandled rejection. A connected oversized client must receive a usable 413 response. Frontend checks
are advisory; the server remains authoritative.

## Parser contract

Use `countMp3Frames(bytes: Buffer): number` or an equivalent pure function with a small typed error mechanism. No parser
class hierarchy, framework dependency, decoding, corruption resynchronization or payload sync counting.

1. Safely identify supported leading ID3v2 and trailing ID3v1 records. Validate tag sizes and bounds; research and test
   version-specific header/footer rules before selecting the exact supported-layout set.
2. At each audio offset, validate the four-byte header, MPEG-1 Layer III identity and supported bitrate/sample-rate
   fields. Free-format and invalid/reserved encodings require explicit handling, not guessed frame lengths.
3. Compute `floor(144 * bitrateBitsPerSecond / sampleRateHz) + paddingBit` for that frame, require it to fit completely,
   count it and advance exactly that many bytes. Read bitrate and padding again for every frame, supporting ordinary CBR
   and VBR inputs.
4. End exactly at the validated audio-region boundary. Reject zero frames, unexpected bytes and incomplete frames.

Count complete physical MPEG frames, including metadata-bearing MPEG frames such as Xing/Info when structurally valid;
separate ID3 records do not count. Never trust a Xing/VBRI count as the application's answer or estimate from duration
or file size. Compare this convention with actual MediaInfo output before claiming sample correctness; never add a
sample-specific offset. See [the sample baseline](validation/sample-baseline.md).

## Runtime packaging and developer interface

See [architecture and diagrams](architecture/v1.md) for packaging, proxy and trust boundaries. Keep one npm lockfile for
API/development tools, with no workspace manager. Base-image versions/digests are implementation-time verification
items; none are invented here.

The future Makefile must provide `help`, `up`, `down`, `logs`, `ps`, `check`, `smoke FILE="..."` and
`validate-sample FILE="..."`. It is a thin wrapper that quotes paths, propagates failure and never installs host
packages. `up` builds/starts both services, waits for health with a bounded timeout and prints the URL only on success.
`down` affects only this Compose project, with no global prune. `check` runs real checks available at that phase.

Running needs Docker, Compose and Make; source checks need the pinned Node/npm; independent sample verification needs
MediaInfo. Document `docker compose build api` and `docker compose build frontend` separately. Those commands and Make
targets are planned, not available in the foundation checkout.

## Release completion and open choices

Local Compose is the chosen runtime topology. Cloud hosting and public releases remain outside this brief. The existing
release amendment still requires an authorized deployment target, automatic versions/tags and private repository
releases, immutable artifacts, deployed checks and rehearsed recovery. Short-lived image archives alone do not satisfy
that amendment. Before Phase 3 release implementation, decide how a non-cloud target is operated and how the automated
pipeline can reach it, together with version policy, permissions and recovery retention. Do not silently treat an
ephemeral CI smoke run as the final deployment target.

Other open choices: exact supported ID3 layouts and compatibility limitations, non-identity content-encoding handling
details, bounded request/startup/proxy timeouts, Node/NGINX image pins and the independent sample count. Resolve only
what the next authorized phase needs; record rationale and affected IDs. The assessment receipt date remains unset.

## Phases and next authorization

1. [Foundation and baseline](phases/01-foundation-and-baseline.md): reuse the merged foundation, refresh obsolete audit
   assumptions, establish the actual MediaInfo baseline and make the bounded execution adapter reviewable.
2. [Standalone parser](phases/02-parser.md): TypeScript frame counter, independent fixtures and sample reconciliation.
3. [End-to-end and containers](phases/03-end-to-end-and-containers.md): API, static UI, two images, proxy, Compose,
   Makefile, integration evidence and the required release cycle.

The next prompt should authorize **Phase 1 only**, following [the phase entrypoint](phases/README.md). Application and
infrastructure files, commits, PRs, repository administration and deployments are not part of this planning pass.
