# backend-audio-v1 independent candidate contract

**2026-10-11, revision r2, unbound.** The owner attachment `mp3-backend-refactor-ascii-codex-prompt.md` supplies the
narrow requirements for this candidate. Its inspected base is `93a7098c027b214b9b392b0f1408660097dd32f3`. The author
received requirements, primary sources and independently authored fixtures without reading product server/frontend
source or product unit tests. This document grants no publication, binding, review approval, deployment, credentials or
hosted execution. Follow the [transition guide](../acceptance-transition.md); the eventual predecessor and merged
identity must come from real Git history. Preserve all historical contracts, baseline objects and acquisition evidence.

## Count and request amendment

The external assessment still requires handwritten logical traversal and the exact default success object
`{"frameCount":<positive safe integer>}`. The owner now defines that number as complete walked MPEG-1 Layer III frames
minus one structurally recognized leading Xing/Info carrier. It is not read from a declaration, duration or file size. A
complete carrier contributes physical +1, excluded +1 and audio +0. Without a carrier the two counts are equal.
Carrier-only input returns 400 `MP3_NO_AUDIO_FRAMES`; it cannot return successful zero.

Historical `fixtures/manifest.json` frameCount entries remain physical truth: encoded tones 9/16/21 and the original
`xing-physical` fixture 2. The separate successor audio map is 9/15/21 and 1, respectively. Every other physical/audio
expectation remains equal. No historical byte sequence, hash, recipe or private sample record changes. The identified
private sample, only after its recorded identity is verified, has default `{"frameCount":6089}`, physical 6090 and
excluded 1. Ordinary CI never needs its bytes or MediaInfo.

Wire input remains one raw upload using audio/mpeg or application/octet-stream, including established case/parameter
semantics. Content-Encoding is absent or identity, no Content-Length is required, and pathname/method/media/encoding
precedence stays established. Standard URL decoding enables details only when getAll("details") contains exactly one
value equal to case-sensitive "true". Absent, other values and decoded duplicate names select the default. Unrelated
queries are ignored. Raw path spelling must remain unnormalized. Both representations preserve actual inclusive
20,971,520-byte collection, two-upload admission, 64-connection defaults, deadlines, Expect ordering, bounded readable
rejection, abort/shutdown cleanup, no retained uploads and later-request recovery.

## Frozen classification decisions

Only the first complete supported MPEG frame after an accepted leading outer tag is eligible. The expected marker
position is frame-relative 21 bytes for mono and 36 for stereo/joint stereo/dual channel, independently of the CRC
protection bit. FFmpeg's pinned [n7.1 demuxer](https://github.com/FFmpeg/FFmpeg/blob/n7.1/libavformat/mp3dec.c) reads
the four-byte header then its channel-dependent side-information offset without a CRC shift. Previously independent LAME
writer evidence corroborates this rule; the primary
[LAME writer](https://github.com/lameproject/lame/blob/master/libmp3lame/VbrTag.c) is supplementary evidence, with no
copied parser or runtime dependency. The pinned FFmpeg rule establishes this candidate; the moving LAME link does not
establish a newly observed release identity. The rule is a supported owner convention, not a universal encoder or
MediaInfo promise.

Markers in ID3, later frames or wrong ordinary payload positions are absent. VBRI receives no Xing subtraction. Zero
side information, arbitrary text and false declared totals are not independent exclusion rules. For a CRC-protected
first frame, a Xing/Info marker at the speculative expected offset +2, with the expected marker absent, returns 415
`MP3_UNSUPPORTED_METADATA`: this recognized alternative cannot silently become physical count labeled audio.

A complete expected marker and four-byte flags word with no bits outside 0x0f confidently recognize one carrier. Decode
selected fields in order: 0x01 four-byte unsigned declared audio frames; 0x02 four-byte unsigned declared MPEG stream
bytes; 0x04 exactly 100 seek bytes; 0x08 four-byte unsigned stored quality. Bounds apply to the first frame, not file
EOF. Declarations never allocate storage, stop traversal or compute the result. Stream bytes compare against the
measured MPEG region including the carrier and excluding accepted leading ID3/trailing ID3v1.

If a selected nonessential field extends past that frame, retain recognition/exclusion, omit that field and every later
selected field, and emit one XING_OPTIONAL_FIELD_TRUNCATED warning naming the first damaged field. Values before the
failure remain available. Missing unselected fields are omitted, not zero. Unknown flags return 415
`MP3_UNSUPPORTED_METADATA`. An otherwise recognized marker without a complete flags word is malformed metadata, but a
supported complete MPEG-1 frame is at least 96 bytes and always has room through byte 44/29. Real final-frame truncation
therefore returns `MP3_TRUNCATED_FRAME` before inspection; no impossible partial-frame fixture claims flags coverage.

Continue exact-boundary traversal to the accepted end. Changed declared totals leave counts unchanged; removal of a
complete final audio frame decrements audio/physical by one; final truncation fails. Removing only outer ID3 changes
neither count; removing only the carrier decrements physical and leaves audio unchanged. Do not resynchronize, decode
side information/audio, validate CRC, interpret LAME extensions or subtract gapless samples.

## Closed detailed representation

`POST /file-upload?details=true` returns exactly frameCount and analysis. Analysis has exactly physicalFrameCount,
excludedMetadataFrameCount, xing and warnings. All counts/offsets/lengths are safe integers; successful frameCount is
positive, excludedMetadataFrameCount is 0 or 1, and physicalFrameCount equals frameCount plus
excludedMetadataFrameCount.

Xing is a closed tagged alternative: absent has exactly `{"status":"absent"}`. Present requires status "present", marker
"Xing" or "Info", frameOffsetBytes, frameLengthBytes, markerOffsetBytes and flags. Offsets are absolute zero-based file
bytes; length is the complete physical frame span. Optional fields are declaredAudioFrameCount,
declaredMpegStreamByteCount, seekTableEntryCount (literal 100) and qualityValue. Declarations, flags and stored quality
are unsigned 32-bit integers. Present implies excluded 1; absent implies excluded 0. No payload/table dump is returned.
The default and detailed alternatives are closed independently; neither a closed allOf conflict nor a serializer
silently dropping analysis is permitted.

Warnings is an array of at most three closed tagged objects, with no repeated code: frame-count mismatch has exactly
`{"code":"XING_DECLARED_FRAME_COUNT_MISMATCH"}`; stream-byte mismatch has exactly
`{"code":"XING_DECLARED_STREAM_BYTES_MISMATCH"}`; truncated optional field has exactly code
"XING_OPTIONAL_FIELD_TRUNCATED" and field, one of declaredAudioFrameCount, declaredMpegStreamByteCount, seekTable or
qualityValue. Mismatches are nonfatal and apply only to successfully decoded declarations. The array order is optional
truncation first, audio declaration mismatch second, stream declaration mismatch third. No warning message is a server
error code. Missing/nonfinite/fractional/unsafe counts, inconsistent equations and internal fields cannot produce a
successful response.

Independent encoded VBR detail example:

```json
{
  "frameCount": 15,
  "analysis": {
    "physicalFrameCount": 16,
    "excludedMetadataFrameCount": 1,
    "xing": {
      "status": "present",
      "marker": "Xing",
      "frameOffsetBytes": 0,
      "frameLengthBytes": 182,
      "markerOffsetBytes": 21,
      "flags": 15,
      "declaredAudioFrameCount": 15,
      "declaredMpegStreamByteCount": 2160,
      "seekTableEntryCount": 100,
      "qualityValue": 0
    },
    "warnings": []
  }
}
```

## Coded error amendment

Every controlled API/proxy JSON error contains exactly code and error. Code is a stable catalogue literal; error is the
safe catalogue message. No statusCode, stack/cause, native Fastify/Ajv internals, request data or filesystem paths
appear. The exact error-only historical envelope is superseded in this candidate, not claimed backward compatible. HEAD
has no body. Preserve JSON Content-Type, no-store, nosniff, correct Allow and appropriate Retry-After on raw/normal
paths.

| Status | Code                         | Default message                                                    |
| ------ | ---------------------------- | ------------------------------------------------------------------ |
| 400    | UPLOAD_EMPTY                 | Choose a nonempty MP3 file.                                        |
| 400    | UPLOAD_INCOMPLETE            | The upload did not complete. Please try again.                     |
| 400    | REQUEST_INVALID              | The request does not match the upload API contract.                |
| 400    | MP3_INVALID_HEADER           | The MP3 contains an invalid frame header.                          |
| 400    | MP3_TRUNCATED_FRAME          | The MP3 ends before a complete frame.                              |
| 400    | MP3_INVALID_METADATA         | The MP3 contains malformed metadata.                               |
| 400    | MP3_NO_AUDIO_FRAMES          | The file contains no complete MPEG-1 Layer III audio frames.       |
| 404    | ROUTE_NOT_FOUND              | The requested API resource does not exist.                         |
| 405    | METHOD_NOT_ALLOWED           | This method is not allowed for the requested resource.             |
| 408    | UPLOAD_TIMEOUT               | The upload did not finish within the time limit.                   |
| 408    | UPLOAD_IDLE_TIMEOUT          | The upload stopped sending data.                                   |
| 413    | UPLOAD_TOO_LARGE             | The upload exceeds the 20 MiB (20,971,520-byte) limit.             |
| 415    | UNSUPPORTED_MEDIA_TYPE       | Upload raw MP3 bytes using audio/mpeg or application/octet-stream. |
| 415    | UNSUPPORTED_CONTENT_ENCODING | Encoded request bodies are not supported.                          |
| 415    | MP3_UNSUPPORTED_FORMAT       | Only supported MPEG-1 Layer III encoding is accepted.              |
| 415    | MP3_UNSUPPORTED_METADATA     | This MP3 metadata layout is not supported.                         |
| 417    | EXPECTATION_FAILED           | The request expectation is not supported.                          |
| 500    | INTERNAL_ERROR               | The MP3 could not be analyzed. Please try again.                   |
| 503    | SERVICE_BUSY                 | The service is busy. Please try again shortly.                     |
| 502    | UPSTREAM_UNAVAILABLE         | Analysis service is unavailable. Please try again.                 |
| 504    | UPSTREAM_TIMEOUT             | Analysis service timed out. Please try again.                      |

Documentation-only proxy contextual variants must be declared/tested safe catalogue literals; arbitrary interpolation is
forbidden. Provider errors, arbitrary static 404s and already closed sockets have no uniform JSON promise. Unknown
exceptions/invalid output map to INTERNAL_ERROR; do not trust thrown statusCode/code or match English substrings. Client
cancellation, deadline, network and invalid response remain client outcomes, not invented server responses.

## Generated docs, frontend and retained obligations

Generate OpenAPI 3.0.3 from the same registered application schemas/catalogue without listening, network, process hooks,
prebuilt docs dependency or a competing specification. Preserve deterministic offline Redoc 2.5.4 assets, original
licenses/hashes, finite loader, semantic validation, same-document resolved references and startup integrity checks.
Upload has required binary content in both accepted media types, exact details rule, distinct named default/detail 200
examples and standard 400/408/413/415/417/500/503/502/504 responses. Controlled ingress ownership is explicit for
502/504; a vendor extension alone cannot expose them. Appropriate method operations document 405/Allow and bodyless
HEAD; 503 documents Retry-After. Examples contain validated code plus readable message and agree with real controlled
responses. Exercise the actual local Redoc response/example selection; source JSON and generic validator passes are
insufficient.

The existing frontend sends one raw File with details=true and zero automatic retries. Its bounded deadline includes
body consumption; caller cancellation/stale results and listeners/timers stay owned and cleaned. Validate unknown JSON,
code/status combinations and count/byte invariants through browser-safe trusted schemas without unsafe-eval. Display
server audio/physical/exclusion equation and valid metadata without browser MP3 parsing/subtraction; declarations and
missing fields are honestly labeled. Preserve accessibility, safe text, pending state and retry recovery.

Preserve every original local 72 tuple and stage 22/production 3 tuple. Add narrow submatrices within existing cases; no
hosted execution is authorized here. Resource/privacy/CSP/admission/shutdown obligations remain mandatory. The
application factory's independent instances, no import/construction/generation socket/timer/process effects, plugin
order, startup/docs failure and shutdown races need implementation tests by the product author; external acceptance
cannot prove these internals. Four byte maps and lifecycle source comment require direct independent review plus known
portable values, never a comment parser. Runtime package policy changes require a separately reviewable prerequisite.

## Review and execution stop point

This candidate is independently reviewable before implementation and is separate from the required suite in the main
checkout. Candidate oracle checks, owned negative controls and discovery are not product acceptance, hosted evidence,
review approval or activation. Record command/version/results, contract hash and exact suite/manifest identities in the
[authoring record](../backend-audio-authoring.md). Publication/binding need separately authorized remote actions and
actual protected-main squash/review identities. This document invents none of them.
