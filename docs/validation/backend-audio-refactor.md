# Backend audio-count refactor — local evidence, 2026-10-11

This is a local, unpublished implementation of the [owner amendment](../requirements/backend-audio-refactor.md), based
on `93a7098c027b214b9b392b0f1408660097dd32f3`. It is not a merged release, an activated acceptance contract, a hosted
deployment or production V1. The original assessment, physical-frame fixtures and historical evidence remain intact. The
[instruction capture](../requirements/sources/backend-refactor-owner-prompt.md) is preserved verbatim.

## Reviewable changes and prerequisite order

Three separate local worktrees hold the product change, independent successor authoring, and dependency/CI
prerequisites. Their branch names are `codex/backend-audio-refactor`, `codex/backend-audio-contract` and
`codex/backend-schema-policy`. No repository commit, staging, push, PR creation, review submission, merge, publication,
repository-setting change or cloud action was performed in this task. The original application checkout's unrelated
documentation edits were preserved.

The active frozen contract still requires physical counts and exact `{error}` failures. The base runtime policy admits
only Fastify; the independently specified dependency and source-CI migration is now included in the local product diff.
Working-tree policy validation passes, but **normal acceptance admission remains blocked by the unbound successor**. A
local candidate run does not replace its required review, test-only merge and actual protected-main binding.

The handoff order is independently reviewed dependency/source-check policy; reviewed candidate suite; binding of its
actual merged commit/tree; product integration and refreshed required CI. Apply the source-bound version policy with a
separately adopted release line before publishing these observable count/error changes. Do not fabricate a suite SHA,
reuse deferred PR #55, rewrite earlier tags or activate cloud delivery.

## Responsibilities and lifecycle

| Boundary       | Files and purpose                                                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Process        | `server/src/index.ts` retains configuration, signals and process exit; no process behavior moves into imports.                                                                               |
| Construction   | [app.ts](../../server/src/app.ts) constructs an independent, unbound Fastify instance.                                                                                                       |
| Lifecycle      | `server/src/http.ts` is a compatibility facade; `http/lifecycle.ts` owns sockets, startup and one-time shutdown.                                                                             |
| Transport      | `http/upload-transport.ts` preserves exact raw paths, admission, original body collection, deadlines, Expect and draining.                                                                   |
| Failures       | `http/errors.ts` maps verified domain/framework identities and unknown failures to the fixed public catalogue.                                                                               |
| Contracts      | [contracts/mp3.ts](../../server/src/contracts/mp3.ts) and [errors.ts](../../server/src/contracts/errors.ts) own TypeBox DTOs, inferred types, interpreted invariants and safe public errors. |
| Feature        | `modules/mp3/routes.ts` normalizes options, analyzes once, projects known fields and selects the response.                                                                                   |
| Parser         | `modules/mp3/analyze.ts`, `mpeg.ts` and `xing.ts` walk framing, skip supported tags and inspect one eligible carrier.                                                                        |
| Documentation  | `documentation/openapi.ts` registers dynamic Swagger; `generate.ts` exports the same ready app without listening.                                                                            |
| Offline assets | Existing `build-docs.mjs`, `docs.ts` and reviewed Redoc initialization retain finite, hash-verified packaging/loading.                                                                       |
| Browser        | Existing `services/mp3Analysis.ts` owns Ky; `useMp3Analysis` owns deadline/cancellation/state; components render validated values.                                                           |
| Ingress        | `frontend/nginx.conf.template` preserves streaming and raw URI behavior, with parity-tested fixed coded errors.                                                                              |

Construction validates budgets, registers canonical schemas and root failure/header policy, then registers Swagger
before feature routes. An encapsulated upload plugin installs `onRequest` admission and the single bounded custom body
parser. Health and finite docs dispatch remain outside upload admission. The handler normalizes `details`, analyzes once
and projects/checks the selected DTO before Fastify's schema serializer. Raw rejection/docs dispatch explicitly bypass
that serializer and use the same closed public error projector. There is no empty hook added for decoration.

Production startup verifies packaged docs before binding. OpenAPI generation constructs the same app, awaits readiness,
exports Swagger and closes without requiring those assets. Shutdown stops admission immediately; response, rejection,
abort, timeout and close converge on idempotent release of storage, slots, listeners and timers. Constructing two apps
does not share counters, start timers, listen, perform network I/O or install signal handlers.

## Counting and response contract

The default is exactly `{ "frameCount": 6089 }` for the identified private sample. Exactly one decoded query value
`details=true` enables diagnostics; absent, repeated or other values select default, and unrelated options are ignored.
The detailed sample is:

```json
{
  "frameCount": 6089,
  "analysis": {
    "physicalFrameCount": 6090,
    "excludedMetadataFrameCount": 1,
    "xing": {
      "status": "present",
      "marker": "Xing",
      "frameOffsetBytes": 44,
      "frameLengthBytes": 208,
      "markerOffsetBytes": 80,
      "flags": 15,
      "declaredAudioFrameCount": 6089,
      "declaredMpegStreamByteCount": 1458128,
      "seekTableEntryCount": 100,
      "qualityValue": 0
    },
    "warnings": []
  }
}
```

Counts are safe integers; success requires positive audio count and
`physicalFrameCount = frameCount + excludedMetadataFrameCount`. Exclusion is zero or one. A carrier-only domain result
is zero audio and becomes `400 MP3_NO_AUDIO_FRAMES`; inconsistent server output becomes safe `500 INTERNAL_ERROR`.
Missing optional declarations stay absent, never fabricated zeroes. Truncation/mismatch warnings are bounded and
ordered. Schemas are closed; default/detail alternatives remain distinct and detailed fields survive actual
serialization.

The [actual loop](../../server/src/modules/mp3/analyze.ts) performs these steps, with metadata declarations excluded
from all count/offset decisions:

```ts
const header = decodeMpegHeader(bytes, offset);
if (physicalFrameCount === 0) {
  const inspected = inspectXing(bytes, offset, header);
  xing = inspected.xing;
  warnings.push(...inspected.warnings);
  if (xing.status === "present") excludedMetadataFrameCount = 1;
}
physicalFrameCount += 1;
offset += header.frameLengthBytes;
// After walking every complete boundary, including any carrier:
const audioFrameCount = physicalFrameCount - excludedMetadataFrameCount;
```

Header length is `floor(144 * bitrateBitsPerSecond / sampleRateHz) + paddingBit`. This already includes header, CRC,
side information and opaque remainder. There is no duration estimate, payload sync search, unconditional subtraction,
resynchronization, decoder, metadata package or runtime MediaInfo/FFmpeg call.

Canonical inline ASCII maps live beside their owning code: whole file/counting in
[analyze.ts](../../server/src/modules/mp3/analyze.ts), ID3 synchsafe/header/frame maps in
[mpeg.ts](../../server/src/modules/mp3/mpeg.ts), and bounded Xing fields in
[xing.ts](../../server/src/modules/mp3/xing.ts). The request/release lifecycle map is in `app.ts`. Additional maps
beside the actual loop and subtraction explain complete-boundary traversal and `6090 - 1 = 6089`. Maps use decimal,
zero-based half-open ranges and distinguish absolute file offsets from relative frame/tag offsets. Unit fixtures verify
the byte facts and calculation; no comment parser/generator was added.

The sample identity was checked before analysis: 1,458,172 bytes, SHA-256
`97707a18a58ba75122b1668f5ed738f090121343432d9172a6409ddfa4fc5ab3`. Its 44-byte ID3 tag, 208-byte carrier and 1,457,920
audio bytes account for EOF. Actual local analysis gave 6,090 physical, one excluded and 6,089 audio, flags 15, quality
0 and no warnings. This task did not rerun MediaInfo or FFprobe; their dated, versioned observations remain in
[sample-baseline.md](sample-baseline.md).

## Errors, OpenAPI and browser boundary

The [21-entry public catalogue](../../server/src/contracts/errors.ts) owns code, status, safe message, action and layer;
generated OpenAPI derives its standard response examples from that data. Errors are exactly `{code,error}`; no stack,
native framework code, body, filename, private path or cause is exposed. For example:

```json
{
  "code": "UPLOAD_TOO_LARGE",
  "error": "The upload exceeds the 20 MiB (20,971,520-byte) limit."
}
```

Known domain/framework identities map explicitly; unknown failures become `INTERNAL_ERROR`. Raw/proxy errors preserve
JSON content type, no-store, nosniff, applicable `Allow`/`Retry-After`, Content-Length and bodyless HEAD. Fixed NGINX
413/502/504 messages are parity-tested; docs proxy errors use explicit catalogue context variants. Native protocol
rejection, arbitrary static 404s and disconnected clients are outside the application's JSON guarantee.

Dynamic Swagger exports OpenAPI 3.0.3 from the same app. A narrow cloned docs projection converts incompatible schema
metadata without changing runtime schemas. The binary body has both accepted media types, the exact `details` rule,
default/detail examples and standard 400/408/413/415/417/500/503/502/504 responses. Actual raw 405/HEAD behavior is
modeled on real paths; no fake successful operation or wildcard route was registered. `Allow` and `Retry-After` are
documented. The previous hand-maintained `server/src/docs/openapi.json` is removed. The supported upload keeps the
`countFrames` anchor and appears before separately tagged method rejections. Curl examples show raw default and detailed
requests. Literal fields have explicit primitive types in the cloned documentation projection.

Same-origin health descriptions distinguish NGINX's `/health` and `/healthz` responses from private Fastify `/healthz`.
They do not imply API or analysis readiness. Upload-like aliases can receive a coded routing 404 before matching;
unrelated frontend paths can return an NGINX HTML 404. A read-only source/artifact audit found no discrepancy between
these descriptions and the actual route, transport and proxy code.

Redoc stays at 2.5.4, packaged entirely same-origin with existing CSP/asset hashes and no unsafe-eval/inline relaxation.
The Redocly semantic validator permits unsupported-method operations to document only 405; it does not invent a 2xx
response to satisfy a style rule. Fresh generation without `dist/docs` or `dist/openapi.json` succeeded twice and
produced identical spec bytes; packaging subsequently restored the offline assets.

Ky posts the raw File once, disables retries/body replay, omits credentials, rejects redirects and reads the body once.
The hook's 45-second AbortController deadline includes body consumption; intentional cancel, timeout, network,
invalid-response and validated server-error outcomes remain separate. Browser-safe interpreted guards need no generated
code. React renders server audio/physical/excluded counts, equation and labeled diagnostics as text; metadata remains
outside the brief live status. The browser neither parses MPEG nor computes the authoritative count.

## Executed local verification

Pinned Node **24.20.0**, npm **11.19.0**, TypeScript **7.0.2**, Fastify **5.12.5**, TypeBox **1.3.36**, TypeBox provider
**6.2.0**, Swagger **9.9.2**, Ky **2.2.0**, Redoc **2.5.4**, Redocly CLI **2.62.1**, Oxlint **1.87.0** and Prettier
**3.9.9** were used. Exact peer/engine/exports were inspected before installation. TypeScript-ESLint's inspected peers
excluded installed TypeScript 7, so the narrow native TypeScript/TSX Oxlint path was used instead of forcing
incompatible peers. Source lint is separate from workflow lint. The root lock and existing independent acceptance lock
remain separate.

| Command/check                                                           | Observed result                                                                                                                    |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `npm run test:unit`                                                     | 269 server and 70 frontend tests pass with zero failures, cancellations or skips, from their respective application directories.   |
| `npm run typecheck`                                                     | Server, frontend and the added unit-test tsconfig all pass strict compilation.                                                     |
| `npm run lint:source`                                                   | Real TypeScript/TSX lint passes; an ignored explicit-any negative control failed as expected and was removed.                      |
| `npm run check:openapi`                                                 | Generated OpenAPI passes semantic validation with zero warnings.                                                                   |
| Explicit-file Prettier and `git diff --check`                           | Changed and new implementation files checked, including files omitted by Git-tracked discovery.                                    |
| `npm run check:mermaid`                                                 | All 19 tracked Mermaid sources render with pinned Chrome 155.0.8059.39.                                                            |
| Independent API/frontend `docker build --no-cache`                      | Both builds pass separately from the root context, preserving non-root two-container startup.                                      |
| Independent candidate harness `npm --prefix tests/acceptance run check` | Fixtures/oracles/negative controls and exact 72 local / 22 stage / 3 production discovery pass; discovery is not hosted execution. |
| Candidate application HTTP/browser run                                  | All 72 final cases pass in run `mp3-e2e-45286-140fd7c71318`, without retries, failures or skips; docs/UI/sample and cleanup pass.  |
| `npm run check:policy` under the local migration                        | Passes; current working policy does not substitute for actual successor review, merge or binding.                                  |
| `npm run test:tooling`                                                  | All 972 tests pass with zero failures, cancellations or skips; Terraform tests use mock-only local provider inputs.                |

Detailed command logs, spec determinism, parser measurements, screenshots and scoped container cleanup are ignored local
evidence under `.artifacts/backend-refactor/`; they are not committed CI artifacts or published release evidence. The
final unit log is `final-unit-docs.log`, tooling is `final-full-tooling.log`, source validation uses the `final-*.log`
files, and Mermaid output is `mermaid.log` plus `.artifacts/mermaid/result.json`. Check log filenames in the local
directory when reproducing.

Explicit working-file portability scanned all 484 present tracked/new files with zero findings. The ordinary tracked
checker encountered the unstaged deletion of the previous manual OpenAPI file; the explicit scan includes new files and
omits deleted paths without staging, restoring obsolete source or altering the scanner. Formatting checked every
changed/new supported file with the configured ignore rules. Three final formatting warnings were corrected; rebuilt
browser assets remained byte-identical to all three compiled files in the tested frontend image, recorded in
`frontend-format-equivalence.json`. No additional product behavior changed after the final container run.

The interrupted candidate run `mp3-e2e-52170-77a22690d311` is retained as **failed/incomplete**, not passed. It found a
persisting non-JSON fault mock and presentation/server-annotation predicates beyond the written requirements. An
independent author assessed these harness defects before any correction; audio-count/error expectations and frozen r2
semantics remain unchanged. Cancellation prevented aggregate totals, so counts are unknown rather than invented. Its
owned containers and network were removed and cleanup verified.

Two subsequent complete runs also remain failed evidence: `mp3-e2e-24299-cd9f030bca58` passed 68 of 72 cases, and
`mp3-e2e-36430-b07acca558cb` passed 69 of 72. Neither skipped tests. The latter passed the full upload, count, metadata,
recovery and controlled Docker fault cases; its three failures reached an overly exact query-description predicate in
the documentation checker. Documentation wording and missing upload-limit annotations were corrected. Independent
harness corrections preserve earlier bytes and failures, retain the written r2 semantics and add rejection controls for
the permitted equivalent presentation/schema forms. Final verification first checks actual generated OpenAPI and
desktop/narrow Redoc before running all 72 cases against one identified image pair. Two further preflight failures are
retained: run `mp3-e2e-50994` failed the limit-note predicate; run `mp3-e2e-68771` exposed an unnecessary operation-ID
rename. Neither started the 72-case suite. Wording was corrected and the compatible `countFrames` anchor restored.

Run `mp3-e2e-923-3fb41d9bbcea` passed all 72 independent cases with no failures or skips, including actual deadlines,
graceful shutdown and controlled Docker faults. Its auxiliary screenshot helper subsequently failed because Playwright
did not expose native File request bytes; this wrapper failure remains recorded independently of the passing suite. The
corrected helper records unavailable protocol bytes honestly and requires equality when exposed.

Separate supplemental run `mp3-e2e-65111-0aac9f03ecdf` passed without rebuilding or rerunning acceptance. It used the
same tested API image `sha256:24ab399c763d8ebc6227926f7a331e089d857b1796f60ab91b0d32b1d294e8dc` and frontend image
`sha256:916d78fd02d38a20781fc28874f9f87d5a00056284cf0a0959ded22ba8b932b5`. Actual default/detail HTTP sample responses
were 6089 audio / 6090 physical / one excluded carrier. Captured desktop/narrow Redoc and VBR UI screenshots show
meaningful schema/example rendering, one upload and 15 = 16 - 1; no enforced CSP, page or foreign-asset errors occurred.
Both runs verified scoped cleanup. These results precede the final documentation clarification build.

**Final source verification:** run `mp3-e2e-45286-140fd7c71318` passed all 72 cases and the corrected supplemental
checks against fresh API image `sha256:c45db271b683bb9698c5b223b9416dda726ed4f225b8ff2d907f534de994b751` and the
unchanged frontend image above. Frontend reuse is explicitly tied to its earlier independent no-cache build and
unchanged inputs. The run contains 72 records with no retries or skips; actual idle/total deadlines were 10/30 seconds,
and admitted SIGTERM response/exit completed in 5.9 seconds. Container users were 1000:1000 and 101:101, both initially
healthy. Desktop/narrow Redoc schema interaction, named examples, curl samples, typed literal fields and scoped CSP
passed. The identified sample's exact HTTP default/detail bodies and VBR UI observation also passed. Owned containers
and network were removed and independently checked absent.

The final ignored directory contains `local-result.json`, `candidate-result.json`, `sample-default.json`,
`sample-detail.json`, `redoc-desktop.png`, `redoc-narrow.png` and `upload-vbr.png`. The candidate source digest is
`9e453cf192ed84352ffa55a04b3adad6f4647f09391e122332b18eb3ee4f67f2`, unchanged before/after execution; the selected
contract digest is `5e42ee2d789d03e8510e58c486f643ed105e60202d61e1eb91e9a126d3698b7e`. Revision fields remain explicitly
unrecorded; these content identities do not invent a committed suite or trusted release binding.

The owner's local server was rebuilt through `FRONTEND_PORT=18084 make up`. Both Compose services became healthy, the
bounded HTTP ping succeeded, and the served specification was checked for `countFrames`, the public health alias and
separate method-rejection tags. The ordinary default command remains portable and requires no Terraform or cloud login.

The prerequisite's initial full tooling command observed 936 of 953 tests passing, with 17 failures and no skips.
Fourteen failures exposed governance-only/historical CLI compatibility regressions; three lacked the local Google
provider mirror required for mock-only Terraform tests. The compatibility fixes subsequently passed all 69 affected
dependency/docs/stage-policy controls. Selecting an existing local provider mirror passed all 12 bootstrap-IAM controls
without credentials, cloud access or provisioning. The final complete run passed all 972 tests after application-test
localization, including independently specified source-CI controls. These later results do not erase initial failures.
The existing stage-policy fixture gained only the current dependency-helper overlay needed for its historical replay;
assertions and historical workflow bytes remain unchanged.

## Bounded resource measurements and evaluation

The actual byte ceiling remains inclusive 20,971,520, default admission two uploads and default connections 64. One
bounded collector owns each admitted Buffer; analysis makes no whole-file copy or retained per-frame list. Real socket
tests cover exact/over-limit declared and streamed bytes, deadlines, Expect ordering, readable rejection, shutdown,
abort and subsequent recovery. These finite checks do not prove absence of every possible leak.

A warm-process comparison used the parser blob at the exact base above and this analyzer on the same unchanged inputs:
10 warmups, 30 alternating-order measurements per parser, pinned Node, medians recorded in
`.artifacts/backend-refactor/parser-comparison.json`. The sample changed from 0.200 ms to 0.284 ms; an exact 20 MiB
synthetic input containing 201,649 complete frames changed from 3.059 ms to 8.382 ms (2.74 times). The analyzer now
produces validated per-header metadata and aggregate diagnostics instead of returning only lengths/counts. The measured
increase is explicitly recorded, not hidden as a performance improvement. Observed between-call RSS was unchanged on the
large fixture; this is not a peak-memory profile, cold-start or transport benchmark. Whole-body buffering and
synchronous counting still constrain concurrency; throughput and hosted behavior are not claimed.

| Assessment criterion | Concrete implementation/evidence and limit                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Correctness          | Actual header walk, complete-boundary checks, count invariants and independent mutation/removal/truncation expectations; owner audio convention is distinct from an unknown employer answer key.  |
| Code quality         | Small feature modules, unbound factory, typed DTOs/catalogue, strict application/test compilation, source lint, useful ASCII/JSDoc and generated docs; CI adoption is still a named prerequisite. |
| Error handling       | Typed domain reasons, closed safe status/code responses, unknown failure fallback, controlled raw/proxy parity, client outcome separation and recovery tests.                                     |
| Scalability          | Preserved byte/admission/connection/deadline bounds, forward traversal and bounded diagnostics; no database, worker, retained uploads or universal performance promise.                           |
| Approach             | Separate independent expectations/policy/product lanes, preserved historical evidence, exact-source provenance and explicit admission stop; no unauthorized remote work.                          |

Supported framing includes MPEG-1 Layer III table bitrates/sample rates/padding, flags-zero ID3v2.3.0/2.4.0 and an
allowed trailing ID3v1 record. Mono and two-channel leading Xing/Info markers use independently established offsets
21/36 for both tested CRC states; unsupported shifted CRC/encoder layouts fail explicitly. Other MPEG versions/layers,
free-format, unsupported tag flags/layouts and corruption recovery remain unsupported. VBRI does not receive Xing
subtraction. Payload/CRC/LAME-extension/audio decoding and general MediaInfo equivalence are out of scope.

## Local use

Follow the [top-level startup](../../README.md#run-locally) and [local handoff](../deployment/local-handoff.md).
`make up` starts both containers, waits for health and prints the UI/docs URLs; `make logs-backend` follows API logs. No
Terraform or cloud credentials are required. For separately provided sample bytes at the documented path:

```sh
curl --fail -H 'Content-Type: audio/mpeg' \
  --data-binary @docs/requirements/samples/assessment-sample.mp3 \
  http://127.0.0.1:8080/file-upload
curl --fail -H 'Content-Type: audio/mpeg' \
  --data-binary @docs/requirements/samples/assessment-sample.mp3 \
  'http://127.0.0.1:8080/file-upload?details=true'
```

The private MP3 is ignored and absent from a fresh clone/release. The portable nine-frame fixture provides an
alternative. The existing required `make e2e` command remains gated by actual successor admission; an unbound local
candidate pass cannot honestly be reported as its normal required CI result.

## Shipment preparation and independent oracle correction — 2026-10-11

The owner authorized normal commit/push, companion review and protected merges, followed by a product freeze and
README-discoverable handoff. During this preparation stage, CI prerequisite PR #62 was open; its scope preserved the
product, frozen acceptance and registry. The product was temporarily stacked on its reviewed feature head; this was not
protected-main adoption or suite binding.

A fresh independent candidate audit found four OpenAPI predicate omissions. Nine red mutation controls were added before
minimally correcting required DTO fields, finite error codes, mandatory upload HEAD and semantic header values. At this
preparation stage, the full candidate harness passed 41 recipes, 176 semantic rejections, 52 transport, 46 docs and 95
hosted owned controls, with unchanged 72/22/3 inventory and historical fixtures. Its preparation-stage acceptance
content digest was `522822eebad85da226b805d24277e4f8becdbf45d6907eb3af301cd5affc7886`; contract SHA-256 was
`5e42ee2d789d03e8510e58c486f643ed105e60202d61e1eb91e9a126d3698b7e`. The strengthened spec oracle accepts the existing
generated application specification. The earlier full product run retains its original candidate identity; that run is
not relabeled as proof against the later digest. Actual final-source required CI must establish that proof.

The [new network diagram](../architecture/diagrams/network.mmd) was explicitly rendered with the installed pinned
Mermaid/Chrome tooling while untracked. Existing 19-diagram validation is historical; final tracked rendering must
include this twentieth source. The root/handoff documentation covers every assessment evaluation question and maps
limits to provisional follow-up, while keeping current shipment/publication and production status distinct.

Final tracked diagram check after staging passed **20/20** with pinned Chrome 155.0.8059.39. Working policy and tracked
portability pass; frozen original owner capture hash is unchanged. Fresh read-only backend and frontend reviews found no
supported material defect. GitNexus staged analysis reports expected critical reach across parser, error mapping,
upload/lifecycle and browser response flows; direct route/factory ownership and meaningful unit/socket/external cases
were reviewed. Some parser calls through module facades are not resolved by the graph, so a zero graph edge count is not
proof of isolation. Product approval and required exact-source acceptance remain pending; this stack is a draft only.

## Prerequisite completion and remaining admission — 2026-10-11

These prerequisite outcomes are separate from the local product evidence and preparation snapshots above. Both PRs
merged through normal owner controls after automated companion approval of their exact heads.

- [PR #62](https://github.com/brobro10000/mp3-frame-counter/pull/62) merged at
  `e1616c52a3a0a777216678dc76403d293471a783` after
  [review 5484835840](https://github.com/brobro10000/mp3-frame-counter/pull/62#pullrequestreview-5484835840).
  [Protected-main CI 38172536686](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38172536686) succeeded
  and published [v0.3.61](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.3.61).
- [PR #65](https://github.com/brobro10000/mp3-frame-counter/pull/65) merged at
  `ccc5274bd823c5651a07cba013faf9c3b010ac2b` after
  [review 5484890799](https://github.com/brobro10000/mp3-frame-counter/pull/65#pullrequestreview-5484890799).
  [Protected-main CI 38173697596](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38173697596) succeeded
  and published [v0.4.62](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.4.62), GitHub release
  `409915883`, with ten assets.

The product branch includes the PR #65 merge. At this update, independent candidate
[PR #64](https://github.com/brobro10000/mp3-frame-counter/pull/64) is at `ab860273770ac7a0f95dbc4e0b414971ad034537`,
with [CI 38178258514](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38178258514) pending. Candidate
merge, actual suite binding and product review/adoption remain pending. The prerequisite releases do not establish
acceptance or publication of the audio-count implementation. Run `mp3-e2e-45286-140fd7c71318` retains its original
unrecorded source/suite revisions and is not relabeled as required CI evidence. Cloud delivery remains paused;
production v1.0.0 remains deferred.
