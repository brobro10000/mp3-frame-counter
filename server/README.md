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
[owner successor target](../docs/requirements/backend-audio-refactor.md) for statuses and error precedence.

A recognized leading Xing/Info carrier contributes one physical frame and zero audio frames. VBRI and later/wrong-offset
markers do not trigger exclusion. Supported separate ID3 records do not count. MPEG-2/2.5, other layers, free-format
encoding and unsupported tag layouts are rejected. There is no decoding, CRC validation or corruption recovery. The
[sample oracle](../docs/validation/sample-baseline.md) explains why 6,090 physical frames coexist with MediaInfo's 6,089
audio-frame report.

For diagnostics, add `?details=true` to the same POST. Exactly one decoded `true` value enables details; repeated, empty
or other values select default, and unrelated query options are ignored. Response analysis contains computed
physical/excluded counts, bounded Xing declarations and ordered warnings. No second upload or analysis pass occurs. The
identified sample returns 6,089 audio, 6,090 physical and one excluded carrier. Declared totals never supply count.

Errors return exactly `{ "code": "MP3_INVALID_HEADER", "error": "The MP3 contains an invalid frame header." }` with the
catalogue's status. HEAD has headers and no body. Native protocol failures/disconnected clients may receive no JSON.
[Canonical errors](src/contracts/errors.ts), [schemas](src/contracts/mp3.ts) and
[generated Redoc](http://127.0.0.1:8080/docs/) are the current source of status/example definitions; no hand-maintained
competing OpenAPI file exists.

## Responsibility map

- `app.ts`: unbound factory; schemas/errors → Swagger → scoped upload parser/hooks/routes → health.
- `http.ts` / `http/lifecycle.ts`: compatibility startup, verified docs before listen, sockets and one-time shutdown.
- `http/upload-transport.ts` / `http/errors.ts`: admission before allocation, bounded body/drain/deadlines and safe
  writers.
- `modules/mp3/analyze.ts`, `mpeg.ts`, `xing.ts`: pure walk, headers/tags and bounded leading-carrier inspection.
- `contracts/`: browser-safe TypeBox wire DTOs, interpreted invariants and fixed public error catalogue.
- `documentation/`: same factory registration → deterministic OpenAPI; never listen or depend on packaged docs.
- `build-docs.mjs` / `docs.ts`: retain pinned offline renderer/provenance and finite runtime resource loading.

All four inline byte maps sit beside the parser helpers; the request/release lifecycle map is in `app.ts`. Neither maps
nor schemas parse the uploaded audio. See the
[refactor evidence and boundaries](../docs/validation/backend-audio-refactor.md).

## Run and inspect

Prefer `make up` at the repository root: NGINX exposes one loopback origin and the API stays private. Open
[/docs/](http://127.0.0.1:8080/docs/) for offline Redoc and
[/docs/openapi.yaml](http://127.0.0.1:8080/docs/openapi.yaml) for OpenAPI.

For source verification, run `npm run test:server` at the repository root. It builds the API and generated docs, then
runs every unit test in `server/tests/` from the server directory. `npm run typecheck` includes those test sources and
`npm run lint:source` checks them alongside application code. `npm run test:unit` also builds and tests the frontend.

The API image builds independently from the repository root:

```sh
docker build --platform linux/amd64 -f server/Dockerfile -t mp3-api .
```

The runtime contains compiled API modules, packaged docs and locked production dependencies, runs as UID/GID `1000:1000`
and listens on `PORT` (default `3000`). Builds use the pinned Node/npm toolchain; no host `dist/` is required. Two
admitted uploads, byte limits, deadlines and cleanup bound resource use. Uploads remain in memory and are never
retained. Whole-body buffering and synchronous counting constrain concurrency; no universal performance claim is made.

[Local handoff](../docs/deployment/local-handoff.md) covers the nine-frame test and exact release-image startup.
[Architecture](../docs/architecture/v1.md), [parser](src/modules/mp3/analyze.ts),
[transport](src/http/upload-transport.ts) and
[independent baseline policy](../docs/testing/independence-and-baseline.md) explain the boundaries and evidence.
