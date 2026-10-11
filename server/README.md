# MP3 API and parser

The Fastify API runs on Node and calls a pure synchronous TypeScript parser. The parser walks complete MPEG-1 Layer III
frame boundaries using the header's bitrate, sample rate and padding. It does not decode audio, estimate from duration,
trust a Xing total or use an MP3 parsing package.

## Upload contract

```sh
curl --fail -i -H 'Content-Type: audio/mpeg' \
  --data-binary @example.mp3 http://127.0.0.1:8080/file-upload
```

Successful requests return HTTP 200 and JSON with exactly one property:

```json
{ "frameCount": 9 }
```

Send the file bytes directly, without a multipart wrapper. Accepted media types are `audio/mpeg` and
`application/octet-stream`. The inclusive limit is **20,971,520 bytes**. Unsupported formats, malformed input, oversized
bodies and unavailable upstreams produce useful JSON errors; a failure never becomes a partial successful count. See the
[full HTTP contract](../docs/testing/acceptance-contract.md) for statuses and error precedence.

Complete Xing/Info/VBRI-bearing MPEG frames count physically; supported separate ID3 records do not. MPEG-2/2.5, other
layers, free-format encoding and unsupported tag layouts are rejected. There is no decoding, CRC validation or
corruption recovery. The [sample oracle](../docs/validation/sample-baseline.md) explains why 6,090 physical frames
coexist with MediaInfo's 6,089 audio-frame report.

## Run and inspect

Prefer `make up` at the repository root: NGINX exposes one loopback origin and the API stays private. Open
[/docs/](http://127.0.0.1:8080/docs/) for offline Redoc and
[/docs/openapi.yaml](http://127.0.0.1:8080/docs/openapi.yaml) for OpenAPI.

The API image builds independently from the repository root:

```sh
docker build --platform linux/amd64 -f server/Dockerfile -t mp3-api .
```

The runtime contains compiled API modules, packaged docs and locked production dependencies, runs as UID/GID `1000:1000`
and listens on `PORT` (default `3000`). Builds use the pinned Node/npm toolchain; no host `dist/` is required. Two
admitted uploads, byte limits, deadlines and cleanup bound resource use. Uploads remain in memory and are never
retained. Whole-body buffering and synchronous counting constrain concurrency; no universal performance claim is made.

[Local handoff](../docs/deployment/local-handoff.md) covers the nine-frame test and exact release-image startup.
[Architecture](../docs/architecture/v1.md), [parser](src/mp3.ts), [transport](src/http.ts) and
[independent baseline policy](../docs/testing/independence-and-baseline.md) explain the boundaries and evidence.
