# Proposed external acceptance contract

Status: proposed for human review on 2026-10-09; **no executable acceptance tests exist**. This document operationalizes
APP-V1-001–005,007,009,013–015. P2 freezes a reviewed version before product implementation. Items marked proposal need
review, not an invented approval. See [baseline ownership](independence-and-baseline.md) and
[decision gates](../architecture/decisions.md).

## Browser and HTTP surface

The browser has a labeled file input, an **Analyze MP3** button and accessible pending/result/error text. Selection
alone does not submit. Disable duplicate submission while pending; restore the action after success, error or network
failure. Use safe text rendering. A real File is posted to relative `/file-upload` with `Content-Type: audio/mpeg`. The
user sees a count, a useful API error or a useful fallback for a network/non-JSON failure. No Docker hostname,
credential, stack trace or raw HTML error appears as rendered markup.

| Surface or input                                                                | Required response / proposed detail to freeze                                                                                                                                        |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Frontend GET /                                                                  | HTML and static assets; accessible controls and status. Static 404s need not follow the API JSON contract.                                                                           |
| Frontend /file-upload                                                           | Preserve request method and binary body to the environment's API; preserve API statuses and JSON; no cache.                                                                          |
| API POST /file-upload, valid supported file                                     | 200, application/json (optional charset), exactly one field: {"frameCount": positive integer}, equal to the reviewed expected value.                                                 |
| Accepted media                                                                  | audio/mpeg or application/octet-stream. Proposal: compare media type case-insensitively, tolerate media parameters; absent or other media type is 415. File extension is irrelevant. |
| Content encoding                                                                | Proposal: absent or identity only. gzip, br and other encodings produce 415; no decompression path.                                                                                  |
| Empty, malformed or truncated supported data                                    | 400, application/json and exactly {"error": nonempty readable string}; no partial count. Error wording need not match an exact English sentence.                                     |
| Actual body over 20,971,520 bytes                                               | 413 with usable JSON error on the upload path. A reset alone is insufficient evidence.                                                                                               |
| Unsupported MPEG version/layer or recognized unsupported tag/free-format layout | 415 JSON; distinguish unsupported input from malformed supported structure. Review this first-pass limitation.                                                                       |
| Unknown API pathname                                                            | Proposal: 404 JSON; query strings do not change pathname matching.                                                                                                                   |
| Known pathname, unsupported method                                              | Proposal: 405 JSON; Allow: POST on /file-upload and Allow: GET on /healthz. HEAD is not implicitly supported in this proposal.                                                       |
| Each service GET /healthz                                                       | Proposal: 200, application/json, exactly {"status":"ok"}; service-local health only, no upstream dependency or version/secret data.                                                  |
| Unexpected API failure                                                          | 500 JSON with readable generic message, no stack or input reflection. Do not create a public crash endpoint to test this.                                                            |
| Controlled proxy connection failure / upstream timeout                          | 502 / 504 with the same JSON error shape; frontend can recover. Provider-originated failures outside this controlled layer require explicit characterization.                        |

The semantic API order proposed for review is pathname → method → media/encoding → bounded body collection → empty check
→ parser. A trustworthy over-limit Content-Length may reject early, but the actual byte counter is authoritative.
Missing Content-Length does not exempt a request. Contradictory/invalid HTTP framing may be rejected by the HTTP server
or provider before application logic; do not claim a uniform JSON contract for every malformed wire request.

NGINX or managed ingress may reject body size before API media checks. Freeze isolated-invalid fixtures as mandatory
assertions; multi-invalid requests are diagnostic until actual ingress precedence is characterized. No claim of uniform
415-versus-413 order across independent layers. Align known limits so valid exact-limit requests pass and the smallest
over-limit request yields usable JSON. Test response readability before closing rejected requests, bounded draining or
termination, incomplete/aborted cleanup and a subsequent successful request. Stop accumulating immediately at the cap.

## Physical-frame and metadata policy

`countMp3Frames(bytes: Buffer): number` is pure and synchronous. Count each complete valid MPEG-1 Layer III frame,
including a complete Xing/Info/VBRI-bearing frame. Separate ID3 records never count. Walk from the accepted start to
accepted end using `floor(144 * bitrateBitsPerSecond / sampleRateHz) + paddingBit`, read each header, require complete
frame bytes, and reject any unsupported/malformed remainder. Header-like bytes inside payload are irrelevant. Do not use
duration/file-size estimates, trust metadata totals or search forward to recover corrupt frames. Header-driven length
arithmetic is corroborated by
[FFmpeg's implementation](https://ffmpeg.org/doxygen/trunk/mpegaudiodecheader_8c_source.html) (read 2026-10-09); it is a
reference for review, not a runtime dependency or code to copy.

Proposed first-pass layouts, **pending P2 format/fixture review**:

| Layout                                                                                                                              | Proposed handling                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Untagged MPEG-1 Layer III stream                                                                                                    | Accept complete contiguous frames; require at least one. CBR/VBR and per-frame padding are supported.                                                                                                 |
| One leading ID3v2.3.0 or ID3v2.4.0 tag, flags zero, ten-byte header                                                                 | Validate the version, reserved bits, four synchsafe size bytes and bounds; skip exactly ten bytes plus declared body size. Treat metadata body as opaque; no semantic metadata validation is claimed. |
| One trailing 128-byte ID3v1 / v1.1 record with TAG marker                                                                           | Exclude that record; it cannot substitute for a valid MPEG frame. Verify the format reference before freeze.                                                                                          |
| v2.2, nonzero revision, extended-header/unsynchronisation/experimental flags, v2.4 footer/appended/multiple tags, APE/other layouts | Recognized unsupported layout: 415. Generic unexplained trailing/leading bytes: 400. These are limited first-pass choices, not assessment exemptions.                                                 |
| Free-format bitrate                                                                                                                 | 415; bitrate lookup cannot determine frame length. Reserved/invalid header fields or incomplete supported frames: 400.                                                                                |

The [ID3v2.3 specification](https://id3.org/id3v2.3.0) and [ID3v2.4 structure](https://id3.org/id3v2.4.0-structure) were
read on 2026-10-09. Both have ten-byte headers and synchsafe tag sizes. v2.4 additionally permits a ten-byte footer
outside its declared size. The proposed flags-zero subset avoids silently miscounting footer/extended forms; reviewer
acceptance and sample compatibility still gate freeze. CRC-protected MPEG frames remain countable by full header-derived
length; CRC validation and audio decoding are outside V1.

Before freezing, resolve reserved emphasis/header policy, acceptable stream parameter changes, detailed tag recognition
and fixture coverage against primary evidence. If the assessment sample requires an excluded layout, explicitly amend
the contract or record the assessment gap; never hide it by changing the expected count.

## Minimum external matrix

Every case binds an independent fixture manifest and a trusted suite revision. Portable functional expectations are the
same locally and on the nonproduction candidate. AC-12 fault injection requires explicit control of the target.

| ID    | Scenario and required observation                                                                                                          | APP-V1 trace    | Evidence                                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------ |
| AC-01 | GET / exposes labeled input, Analyze MP3 and accessible status/result.                                                                     | 001,007         | Browser role/label assertions, no login-page false positive.                                           |
| AC-02 | Both accepted MIME types return exact JSON shape and independent counts; at least three distinct positive expectations across valid cases. | 002,004,009     | Real public-path HTTP uploads; response headers, shape and exact count.                                |
| AC-03 | Browser selects a real file, submits through frontend/API and displays expected count.                                                     | 001,002,007     | Real upload, no success-response mocking.                                                              |
| AC-04 | CBR, VBR, padding, each supported tag form and header-like payload bytes produce correct physical counts.                                  | 004,005         | Characterized real audio plus clearly labeled structural fixtures.                                     |
| AC-05 | Empty, malformed and truncated supported inputs return 400 JSON; never partial success.                                                    | 002,004         | Isolated faults, final-frame truncation and trailing junk.                                             |
| AC-06 | Isolated unsupported MIME, encoding, MPEG version/layer and approved first-pass limitations produce 415 JSON.                              | 002,005         | No unrelated invalid condition masking the expected failure.                                           |
| AC-07 | Valid file above 1 MiB and around 6 MiB succeeds through complete ingress. Add a case above any relevant candidate lower limit.            | 003,014         | Exact byte lengths and expected counts; not just health/tiny uploads.                                  |
| AC-08 | A valid supported file of exactly 20,971,520 bytes succeeds; the one-byte-over variant produces usable 413 JSON.                           | 003,014         | Reviewed deterministic construction, actual sizes and response readability.                            |
| AC-09 | An external controlled client sends over-limit bytes without Content-Length and receives usable 413 JSON.                                  | 003,014         | Record transfer framing and actual sent bytes; no header-only enforcement.                             |
| AC-10 | Known routes, unknown API route, unsupported methods and both service health paths match the frozen contract.                              | 002,007         | Public upload/route checks; API-only diagnostics separately labeled where API is private.              |
| AC-11 | Pending state blocks duplicates; invalid input shows error; a later valid upload succeeds.                                                 | 001,003         | Bounded controlled delay if needed, observed request count, isolated browser context.                  |
| AC-12 | Abort/unavailable API causes no partial success; documented 502/504/UI recovery and subsequent health/upload succeed.                      | 001,003,007,014 | Fault injection only in explicitly controlled local/candidate environments; preserve outcome evidence. |

A private API's unknown-route and health checks may require a separately labeled same-network diagnostic; this does not
replace browser and upload-path acceptance through public ingress. Fault controls are host/provider operations owned by
the controller, never an application backdoor. Record explicit blocked cases if the approved environment cannot support
required fault control; do not count skipped mandatory cases as a full pass.

Production smoke is deliberately smaller: confirm both release identities, UI availability and one small known-count
upload. Never send boundary/stress probes to arbitrary URLs or stop production services for AC-12.

## Oracle and fixture acquisition: P2 only

The private sample's identity is recorded in [sample-baseline](../validation/sample-baseline.md). MediaInfo is currently
unavailable and no frame count has been observed. A missing count is not zero. Locate the actual file; never assume a
personal path exists on another machine. Proposed future commands:

```sh
mediainfo --Version
mediainfo --Full --Output=JSON "$FILE"
mediainfo --Inform='Audio;%FrameCount%' "$FILE"
```

Record tool/version, exact portable command, bytes/SHA-256, MPEG version/layer, bitrate mode, reported fields and
reviewed physical count. The [MediaInfo fields reference](https://mediaarea.net/en/MediaInfo/Support/Fields)
distinguishes FrameCount and Source_FrameCount. Where Xing/Info totals differ, examine the relevant primary
implementation and file structure; explain the convention before accepting an expectation. No unexplained +1/-1
correction or adjustment to match product output. A missing tool/sample or unresolved count blocks its oracle, not
unrelated planning.

Plan a small manifest with fixture ID, provenance/license, byte length, hash, expected count/error, construction recipe
where relevant, supporting evidence and review reference. Use permitted public/self-generated real encoded audio
cross-checked by MediaInfo, plus tiny independently specified structural cases explicitly labeled non-decodable where
appropriate. No second production-style oracle parser or product imports in generators. CI consumes fixed reviewed
expectations without MediaInfo. Keep the private sample untracked unless redistribution is explicitly authorized.

Large fixtures should use reviewed deterministic recipes rather than committed large binaries. Exact-limit success must
be structurally valid under the frozen contract, with auditable arithmetic and expected count; random padding of invalid
bytes is insufficient. Freeze at least three distinct known valid counts to expose hardcoded answers.

## Checks outside the black-box suite

Source/image review establishes prohibited-dependency absence and parser independence. Configuration review plus
operational evidence addresses no retained uploads, proxy temp paths, provider buffering, bounded aggregate memory,
concurrency, timeouts, log redaction and shutdown. Review/protection evidence establishes process ownership. A passing
external response cannot prove these properties or distinct-human approval.
