# MP3 API and parser

A Fastify/Node API calls a handwritten, synchronous TypeScript parser. The parser follows each complete MPEG-1 Layer III
frame's header-derived length. It does not decode audio, estimate from duration, trust a declared frame total or use an
MP3 parsing package. The separate NGINX container exposes the browser, upload API and offline Redoc on one local origin.

## Run and verify

From the **repository root**, install [Docker and local prerequisites](../README.md#prerequisites), then:

```sh
make up            # Build/start both containers, wait for health and require an HTTP 200 ping.
make health        # Repeat the two container health checks and public ping.
make logs-backend  # Follow the API's logs; Ctrl-C ends viewing only.
make down          # Stop this application's containers and network.
```

Open [the application](http://127.0.0.1:8080/) or [Redoc](http://127.0.0.1:8080/docs/). The API is private to Compose;
requests from the host use NGINX at port `8080`. See the [local handoff](../docs/deployment/local-handoff.md) for
another port, a known nine-frame fixture and startup from received release images. No Terraform or cloud account is
required.

For source checks, use Node **24.20.0** and npm **11.19.0** at the repository root; both applications share its
lockfile:

```sh
npm ci
npm run typecheck   # Check application and unit-test TypeScript.
npm run lint:source
npm run test:server # Build the API/docs; run localized server/tests/ from the server directory.
make e2e            # Run separate independent HTTP/browser acceptance through Docker ingress.
```

`npm run build:server` generates `dist/`, the registered OpenAPI specification and packaged Redoc. `npm run test:unit`
runs both server and frontend unit suites. The [CI guide](../docs/testing/ci-workflows.md) distinguishes those suites
from independent acceptance. Build the API image alone with:

```sh
docker build --platform linux/amd64 -f server/Dockerfile -t mp3-api .
```

## HTTP and counting contract

Send raw file bytes with `audio/mpeg` or `application/octet-stream`, without a multipart wrapper. For your selected MP3:

```sh
curl --fail -i -H 'Content-Type: audio/mpeg' \
  --data-binary @example.mp3 http://127.0.0.1:8080/file-upload
```

Success is HTTP 200 with `application/json` and exactly `{ "frameCount": <positive integer> }`. The
[committed synthetic fixture](../docs/deployment/local-handoff.md#optional-known-count-fixture) returns
`{"frameCount":9}`. The inclusive body limit is **20,971,520 bytes**. Uploads stay in memory and are not retained.

A supported leading Xing/Info carrier counts as one physical frame and zero audio frames; declarations never determine
the result. The [identified sample](../docs/requirements/samples/README.md) therefore has **6,089 audio frames = 6,090
physical frames − 1 carrier**. This owner-adopted audio convention is explicit; the employer's intended convention is
unconfirmed. VBRI, later markers and wrong-offset markers do not trigger exclusion.

Add exactly one decoded `details=true` query value for computed physical/carrier counts and bounded metadata warnings.
Missing, repeated, empty or other values select the default; unrelated options are ignored. Both representations use one
upload and one analysis pass. See [schemas](src/contracts/mp3.ts) and the
[served specification](http://127.0.0.1:8080/docs/openapi.yaml) for the exact detailed shape.

Failures use the closed `{ "code": "…", "error": "…" }` catalogue shape, for example `MP3_INVALID_HEADER` with HTTP 400.
[Canonical errors](src/contracts/errors.ts) define statuses and safe messages; Redoc documents controlled proxy errors
as well. HEAD emits no body. Invalid native HTTP framing or a disconnected client may receive no application JSON.

Supported tags are flag-zero ID3v2.3/2.4 at the beginning and terminal ID3v1. Other MPEG versions/layers, free-format
encoding and unsupported metadata layouts are rejected. CRC checking, decoding and corruption recovery are outside the
implemented parser. Invalid/truncated framing fails rather than returning a partial count.

The 417 `EXPECTATION_FAILED` entry in the generated specification describes the direct native API guard. NGINX consumes
`Expect`: an otherwise-valid upload with an unsupported expectation succeeds through the documented same-origin ingress.
Do not rely on ingress returning 417. This clarification preserves the frozen runtime/specification.

## Source and runtime boundaries

- [app.ts](src/app.ts): unbound Fastify factory, canonical schemas, Swagger, scoped upload and health plugins.
- [http.ts](src/http.ts) / [lifecycle](src/http/lifecycle.ts): explicit readiness, verified docs before listen and
  bounded shutdown. [index.ts](src/index.ts) alone owns process signals and listening.
- [Upload transport](src/http/upload-transport.ts) / [error writers](src/http/errors.ts): native URI/Expect handling,
  admission before allocation, actual-byte/deadline enforcement and once-only cleanup. Packaged docs bypass upload
  hooks.
- [analyze](src/modules/mp3/analyze.ts), [MPEG headers/tags](src/modules/mp3/mpeg.ts) and
  [Xing inspection](src/modules/mp3/xing.ts): pure domain logic, with inline byte maps beside the algorithm.
- [Routes](src/modules/mp3/routes.ts) project closed DTOs; [contracts](src/contracts/mp3.ts) validate count invariants.
- [OpenAPI registration](src/documentation/openapi.ts), [build](src/build-docs.mjs) and [docs loader](src/docs.ts):
  generate and package the offline reference from the same application registrations, with bounded resources and
  retained notices.

The non-root API image runs as UID/GID `1000:1000`, with `PORT=3000` by default. Each process admits two uploads and at
most 64 connections, with a 30-second collection deadline, 10-second body idle deadline and five-second shutdown bound.
Whole-body buffering and synchronous counting limit throughput; these controls are a bounded operating envelope, not a
scaling guarantee. NGINX health checks its own liveness; an upload verifies the complete path.

See [architecture and diagrams](../docs/architecture/v1.md),
[refactor evidence](../docs/validation/backend-audio-refactor.md), [evaluation](../docs/handoff/evaluation.md) and
[known gaps](../docs/handoff/known-gaps.md).
