# MP3 frame counter

A small TypeScript application that counts complete physical **MPEG-1 Layer III** frames. Choose an MP3 in the browser,
then click **Analyze MP3**. The API accepts raw bytes at `POST /file-upload` and returns exactly
`{ "frameCount": <positive integer> }`. Uploads are limited to **20 MiB**, processed in memory and never retained.

The React/TypeScript interface is compiled into static assets served by non-root NGINX. NGINX forwards same-origin
requests to a separate non-root Fastify/Node API container, which calls the pure TypeScript parser. Offline Redoc and
OpenAPI assets ship in the API image. There are exactly two runtime containers, no database and no MP3 parsing package.

## Run locally

Requires Git, Make and Docker with Compose. A private clone needs repository access; running the app needs no cloud
account, Codex, private plugin or supplied assessment file.

```sh
git clone https://github.com/brobro10000/mp3-frame-counter.git
cd mp3-frame-counter
make up
```

Open the [application](http://127.0.0.1:8080/), [Redoc](http://127.0.0.1:8080/docs/) or
[OpenAPI specification](http://127.0.0.1:8080/docs/openapi.yaml). The API stays private to the Compose network. Use
`FRONTEND_PORT=8081 make up` if port 8080 is occupied. `make ps` shows readiness, `make logs` shows recent logs, and
`make down` removes this project's containers and network.

Follow the [local handoff](docs/deployment/local-handoff.md) for the nine-frame synthetic upload, exact tested-image
startup, checksums, development checks, troubleshooting and cleanup. Source startup rebuilds images; the release-image
path loads the tested archives and runs with `--no-build`.

## Verify and understand

Use Node.js **24.20.0** and npm **11.19.0** for development and acceptance:

```sh
npm ci
npm run typecheck
npm run test:unit
make e2e
```

`make e2e` runs the independently frozen local HTTP/browser suite in an isolated Compose project and cleans it up. It
requires Docker, full Git history and the pinned browser prerequisites. It is separate from hosted acceptance. See
[browser setup](docs/testing/acceptance-browser-setup.md), [toolchain](docs/toolchain.md) and
[portability](docs/portability.md) for initial setup and full repository checks.

- [Frontend](frontend/README.md): browser behavior, React assets and NGINX configuration.
- [API](server/README.md): raw upload contract, parser limits and API image.
- [Architecture](docs/architecture/v1.md) and [runtime diagram](docs/architecture/diagrams/runtime.mmd).
- [Requirements](docs/requirements/assessment.md), [acceptance contract](docs/testing/acceptance-contract.md) and
  [fixture provenance](tests/acceptance/fixtures/README.md).
- [Frame-count explanation](docs/validation/sample-baseline.md): the supplied sample has 6,090 physical frames;
  MediaInfo reports 6,089 audio frames because it excludes the complete Xing-bearing frame.
- [Release process](docs/deployment/release-only.md), [roadmap](docs/roadmap/README.md) and
  [historical closure evidence](docs/validation/v1-closure.md).

## Delivery status

**2026-10-11:** the owner prioritized a local React/TypeScript MVP and reproducible submission handoff to meet the
deadline. Cloud deployment work is paused. Protected-main CI still publishes tested image archives after mandatory
checks; automatic stage delivery is intentionally disabled. Existing authenticated stage and cloud resources remain; no
production application has been deployed. See the
[dated delivery amendment](docs/deployment/v1-delivery.md#local-mvp-handoff-and-cloud-pause--2026-10-11).

Local MVP closure is distinct from production **v1.0.0**, which remains deferred until hosted acceptance, recovery,
exact-candidate human approval and production smoke pass. This branch's React changes require their own checks, review,
merge and publication; the historical release records do not establish those outcomes.
