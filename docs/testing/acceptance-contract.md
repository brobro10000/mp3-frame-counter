# External acceptance contract r3

Status: executable P2 contract **r3**, prepared on 2026-10-09 under the owner's delegated P1–P5 execution instruction.
The controller accepted the format, HTTP and isolated fault-control decisions before any product code. Independent
review and the actual merged test-only revision are recorded separately in the [baseline record](baseline.json) and
[P2 evidence](../validation/p2-acceptance.md). This is agent-authored review evidence, not an eligible GitHub human
approval. Trace: APP-V1-001–005,007,009,013–015.

## Browser and HTTP surface

The browser has a labeled file input, an **Analyze MP3** button and accessible pending/result/error text. Selection
alone does not submit. Disable duplicate submission while pending; restore the action after success, error or network
failure. Use safe text rendering. A real File is posted to relative `/file-upload` with `Content-Type: audio/mpeg`. The
user sees a count, a useful API error or a useful fallback for a network/non-JSON failure. No Docker hostname,
credential, stack trace or raw HTML error appears as rendered markup.

| Surface or input                                                                | Frozen required response                                                                                                                                                   |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend GET /                                                                  | HTML and static assets; accessible controls and status. Static 404s need not follow the API JSON contract.                                                                 |
| Frontend /file-upload                                                           | Preserve request method and binary body to the environment's API; preserve API statuses and JSON; no cache.                                                                |
| API POST /file-upload, valid supported file                                     | 200, application/json (optional charset), exactly one field: {"frameCount": positive integer}, equal to the reviewed expected value.                                       |
| Accepted media                                                                  | audio/mpeg or application/octet-stream. compare media type case-insensitively, tolerate media parameters; absent or other media type is 415. File extension is irrelevant. |
| Content encoding                                                                | absent or identity only. gzip, br and other encodings produce 415; no decompression path.                                                                                  |
| Empty, malformed or truncated supported data                                    | 400, application/json and exactly {"error": nonempty readable string}; no partial count. Error wording need not match an exact English sentence.                           |
| Actual body over 20,971,520 bytes                                               | 413 with usable JSON error on the upload path. A reset alone is insufficient evidence.                                                                                     |
| Unsupported MPEG version/layer or recognized unsupported tag/free-format layout | 415 JSON; distinguish unsupported input from malformed supported structure. This is the explicit V1 first-pass limitation.                                                 |
| Unknown API pathname                                                            | 404 JSON; query strings do not change pathname matching.                                                                                                                   |
| Known pathname, unsupported method                                              | 405 JSON; Allow: POST on /file-upload and Allow: GET on /healthz. HEAD returns 405 with these headers and an empty body.                                                   |
| Each service GET /healthz                                                       | 200, application/json, exactly {"status":"ok"}; service-local health only, no upstream dependency or version/secret data.                                                  |
| Unexpected API failure                                                          | 500 JSON with readable generic message, no stack or input reflection. Do not create a public crash endpoint to test this.                                                  |
| Controlled proxy connection failure / upstream timeout                          | 502 / 504 with the same JSON error shape; frontend can recover. Provider-originated failures outside this controlled layer require explicit characterization.              |

The semantic API order is pathname → method → media/encoding → bounded body collection → empty check → parser. A
trustworthy over-limit Content-Length may reject early, but the actual byte counter is authoritative. Missing
Content-Length does not exempt a request. Contradictory/invalid HTTP framing may be rejected by the HTTP server or
provider before application logic; do not claim a uniform JSON contract for every malformed wire request.

NGINX or managed ingress may reject body size before API media checks. Use isolated-invalid fixtures as mandatory
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

Frozen first-pass layouts:

| Layout                                                                                                                              | Handling                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Untagged MPEG-1 Layer III stream                                                                                                    | Accept complete contiguous frames; require at least one. CBR/VBR and per-frame padding are supported.                                                                                                 |
| One leading ID3v2.3.0 or ID3v2.4.0 tag, flags zero, ten-byte header                                                                 | Validate the version, reserved bits, four synchsafe size bytes and bounds; skip exactly ten bytes plus declared body size. Treat metadata body as opaque; no semantic metadata validation is claimed. |
| One trailing 128-byte ID3v1 / v1.1 record with TAG marker                                                                           | Exclude that record; it cannot substitute for a valid MPEG frame. ID3v1/v1.1 changes do not change the record length.                                                                                 |
| v2.2, nonzero revision, extended-header/unsynchronisation/experimental flags, v2.4 footer/appended/multiple tags, APE/other layouts | Recognized unsupported layout: 415. Generic unexplained trailing/leading bytes: 400. These are limited first-pass choices, not assessment exemptions.                                                 |
| Free-format bitrate                                                                                                                 | 415; bitrate lookup cannot determine frame length. Reserved/invalid header fields or incomplete supported frames: 400.                                                                                |

The [ID3v2.3 specification](https://id3.org/id3v2.3.0) and [ID3v2.4 structure](https://id3.org/id3v2.4.0-structure) were
read on 2026-10-09. Both have ten-byte headers and synchsafe tag sizes. v2.4 additionally permits a ten-byte footer
outside its declared size. The flags-zero subset avoids silently miscounting footer/extended forms. The supplied sample
is compatible. CRC-protected MPEG frames remain countable by full header-derived length; CRC validation and audio
decoding are outside V1.

Reserved MPEG version `01`, layer `00`, bitrate index `1111`, sample-rate index `11` and emphasis `10` are
malformed: 400. Valid MPEG-2/2.5, Layer I/II and free-format bitrate `0000` are unsupported: 415. Other header bits are
accepted; CRC is included in frame length but not verified. Per-frame bitrate, padding, sample rate, channel mode and
protection changes are accepted because this contract counts independent complete physical frames rather than decoding
audio. The bitrate/sample-rate tables and reserved emphasis value are corroborated by the
[MediaInfo 26.10 MPEG implementation](https://github.com/MediaArea/MediaInfoLib/blob/v26.10/Source/MediaInfo/Audio/File_Mpega.cpp).

For supported ID3 versions, reserved flag bits and invalid synchsafe sizes/bounds are malformed: 400. Recognized defined
nonzero flags, other major versions/revisions, and additional `ID3`, `3DI`, `TAG` or `APETAGEX` records at a boundary
where a frame is expected are unsupported: 415. An ID3 version/revision byte of `FF` is malformed. Metadata alone is
400; at least one complete MPEG frame is necessary. The ID3 body remains opaque, so this is structural framing support,
not validation of individual metadata fields. The [ID3v1 reference](https://id3.org/ID3v1) fixes its record at 128
bytes.

For HEAD, HTTP requires an empty response body even when the status is 405. Assert the status, Allow and JSON
Content-Type headers without attempting to parse an absent body; see
[RFC 9110 section 9.3.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.3.2).

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

## Oracle and fixed fixtures

The independent [sample baseline](../validation/sample-baseline.md) records MediaInfo 26.10 FrameCount 6,089 and a
physical expectation of **6,090**: 6,089 independently demuxed contiguous audio packets plus one complete Xing frame.
This is a documented counting convention, never a correction chosen to match product output.

The [fixture manifest](../../tests/acceptance/fixtures/manifest.json) fixes byte lengths, SHA-256 hashes, expected
counts/errors and recipes. Three original encoded tones have physical counts 9, 16 and 21. They were characterized by
MediaInfo/FFprobe and decoded successfully before product code existed. Their committed base64 bytes are portable;
MediaInfo/FFmpeg are acquisition tools, not CI or application runtime dependencies. The other fixtures are explicitly
structural framing inputs and do not claim decodable audio. Provenance and exact generation commands are in
[fixture documentation](../../tests/acceptance/fixtures/README.md).

The exact-limit recipe is `54,613 * 384 + 128 = 20,971,520`: complete 384-byte frames and one trailing ID3v1 tag. Its
count is known by construction. Fixed bytes/recipes are verified without parsing the resulting MP3 or importing product
code. The private assessment sample remains ignored and is not required by CI.

## Execution and isolated fault controls

The standalone package uses the [documented commands](../../tests/acceptance/README.md). `check` validates the harness
and discovers tests; `e2e` runs the complete suite with no selector/skip arguments. Missing target or fault inputs fail.
Every full run binds `BASE_URL`, `API_BASE_URL`, `FAULT_CONTROL_URL`, `ACCEPTANCE_TARGET_KIND`,
`ACCEPTANCE_TARGET_ORIGIN`, `ACCEPTANCE_TARGET_ID`, `ACCEPTANCE_ALLOW_FAULTS=1` and `ACCEPTANCE_FAULT_TOKEN`. The token
is random, at least 32 nonwhitespace characters, and never logged, recorded in results or passed to product containers.
Fault POSTs send it only to the isolated controller in `X-Acceptance-Control-Token`.

The controller endpoint must differ from both product endpoints, including loopback aliases. Browser traffic is confined
before transmission: real requests are forwarded once without following redirects, then actual responses are relayed
unchanged. Foreign origins and redirect responses fail; successful upload results are never invented.

The controller owns POST `/stop`, `/start`, `/pause` and `/resume`, returning 200 only after the requested operation. It
owns authorization, constant-time token checks, exact container identities and rejection of browser Origin headers,
unknown methods/routes and unauthorized requests. These are host operations, never application backdoors. API diagnostic
and fault URLs remain on loopback/isolated networks; local frontend URLs are loopback, candidate frontend URLs require
HTTPS and an exact explicit origin binding. Controller configuration supplies the actual resolved release identity.

AC-11 uses a held Playwright request to observe pending state, then continues the real upload. It also injects
explicitly labeled network/error responses to check safe text and retry; successful uploads are never mocked. AC-12
performs real abort/outage/timeout operations with restoration in `finally` blocks. Full-suite fault controls are never
run against production. Runner reports preserve failures and skips; a skipped required case cannot become a passing full
result.

## Checks outside the black-box suite

Source/image review establishes prohibited-dependency absence and parser independence. Configuration review plus
operational evidence addresses no retained uploads, proxy temp paths, provider buffering, bounded aggregate memory,
concurrency, timeouts, log redaction and shutdown. Review/protection evidence establishes process ownership. A passing
external response cannot prove these properties or distinct-human approval.
