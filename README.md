# MP3 frame counter

A small TypeScript application that counts **MPEG-1 Layer III audio frames** by walking complete frame boundaries.
Choose an MP3 in the browser, then click **Analyze MP3**. The API accepts raw bytes at `POST /file-upload` and returns
exactly `{ "frameCount": <positive integer> }`. One recognized leading Xing/Info carrier is excluded from the audio
count. Uploads are limited to **20 MiB**, processed in memory and never retained.

The React/TypeScript interface is compiled into static assets served by non-root NGINX. NGINX forwards same-origin
requests to a separate non-root Fastify/Node API container, which calls the pure TypeScript parser. Offline Redoc and
OpenAPI assets ship in the API image. There are exactly two runtime containers, no database and no MP3 parsing package.

Start with [Run locally](#run-locally). The [assessment handoff](docs/handoff/README.md) links the architecture,
[evaluation evidence](docs/handoff/evaluation.md) and [known gaps](docs/handoff/known-gaps.md).

## Run locally

### Prerequisites

Install **Docker with the Compose plugin** and start its engine before testing the application. The source commands also
require Git, Make and curl in a POSIX shell. A private clone needs repository access. Everything below runs locally;
Terraform, Google Cloud credentials and host Node/npm are not needed to start the application.

| System                    | Docker setup and terminal                                                                                                                                                                                                                                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Windows                   | Install [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/) with the WSL2 backend and Linux containers. Enable your distribution under **Settings → Resources → WSL Integration**, then use its WSL2 terminal for the commands below; see [Docker's WSL2 guide](https://docs.docker.com/desktop/features/wsl/). |
| Apple Silicon macOS (ARM) | Download **Docker Desktop for Mac with Apple silicon** from the [Mac installation guide](https://docs.docker.com/desktop/setup/install/mac-install/), move it to Applications and open it. Use Terminal after Docker Desktop is running. Choose the Intel download instead on an Intel Mac.                                                              |
| Linux                     | Follow the official [Docker Engine guide for your distribution](https://docs.docker.com/engine/install/) and install the [Compose plugin](https://docs.docker.com/compose/install/linux/). Start Docker and configure terminal access using the [Linux post-installation guide](https://docs.docker.com/engine/install/linux-postinstall/).              |

On macOS, `xcode-select --install` supplies Git and Make if they are missing; curl ships with the system. On Ubuntu or
Debian, including those WSL2 distributions, install the remaining tools with:

```sh
sudo apt-get update
sudo apt-get install git make curl
```

For another Linux distribution, use its package manager. Verify the tools and running engine in the same terminal:

```sh
git --version
make --version
curl --version
docker info
docker compose version
```

Docker Desktop includes Compose. Use a current Compose plugin that supports `up --wait`. Source builds use your local
container platform; received release images are `linux/amd64`, so ARM recipients need working Docker emulation as
described in the [release handoff](docs/deployment/local-handoff.md).

### Start the application and server

```sh
git clone https://github.com/brobro10000/mp3-frame-counter.git
cd mp3-frame-counter
make up
```

`make up` builds and starts **both** runtime containers: the NGINX frontend and Fastify API server. It waits up to 90
seconds for container readiness, verifies that both are running and healthy, then requires **HTTP 200** from a bounded
ping to `/healthz`. It prints the browser URLs and returns to the shell only after those checks pass; both services
continue running in the background. Initial builds need internet access to download locked dependencies and base images.

Open the [frontend](http://127.0.0.1:8080/), [Redoc](http://127.0.0.1:8080/docs/) or
[OpenAPI specification](http://127.0.0.1:8080/docs/openapi.yaml). The server stays private to the Compose network;
browser uploads reach it through the frontend's `/file-upload` route.

```sh
make health        # Repeat both container checks and the HTTP ping; fail if either is unavailable.
make ps            # Show this application's container status.
make logs-backend  # Follow API server logs; Ctrl-C stops viewing logs and leaves the app running.
make logs          # Show the latest 100 log lines from both containers.
make down          # Stop and remove this application's containers and network.
```

If port 8080 is occupied, run `FRONTEND_PORT=18084 make up` and open `http://127.0.0.1:18084/`, as in the recorded
operator setup. Use the same setting for follow-up checks, for example `FRONTEND_PORT=18084 make health`. On failure,
inspect `make ps` and `make logs`, correct the reported problem, then retry `make up`.

Follow the [local handoff](docs/deployment/local-handoff.md) for the nine-frame synthetic upload, exact tested-image
startup, checksums, development checks, troubleshooting and cleanup. Source startup rebuilds images; the release-image
path loads the tested archives and runs with `--no-build`.

### Provided sample MP3

The supplied assessment file belongs at **`docs/requirements/samples/assessment-sample.mp3`**, relative to the
repository root. Select it in the frontend and click **Analyze MP3**; expect **6,089 audio frames**, with **6,090
physical frames − 1 Xing carrier** in the diagnostic panel. Its [sample record](docs/requirements/samples/README.md)
contains the original identity, SHA-256 and count explanation.

The original assignment did not define whether a metadata carrier counts as a frame. The owner adopted the audio
convention above; the employer's expected answer is unconfirmed. Physical counting and the original sample evidence
remain documented in the [handoff evaluation](docs/handoff/evaluation.md#correctness).

The private MP3 is ignored by Git and is **not included in a fresh clone, source ZIP or release assets**. If it was
provided separately, copy it to that path and verify its recorded hash. Any supported MPEG-1 Layer III MP3 can be used;
the application does not require the assessment sample. A committed nine-frame synthetic fixture and decoding/upload
commands are available in the [local handoff](docs/deployment/local-handoff.md#optional-known-count-fixture).

## Verify and understand

Use Node.js **24.20.0** and npm **11.19.0** for development and acceptance:

```sh
npm ci
npm run typecheck  # Includes application and unit-test source types.
npm run lint:source
npm run test:unit  # Builds and tests the server, then the frontend, once each.
make e2e
```

The audio-count/error successor is bound through PR #66. `make e2e` resolves the independently required suite for the
checked-out source. The
[merge and publication record](docs/validation/backend-audio-refactor.md#product-merge-publication-and-freeze)
identifies its binding, reviewed product source, validation checks and verified descendant publication.

Use `npm run test:server` or `npm run test:frontend` for one application's build and localized tests. Server unit tests
live in `server/tests/`; frontend response and HTTP service tests live in `frontend/tests/`.

`make e2e` runs the independently frozen local HTTP/browser suite in an isolated Compose project and cleans it up. It
requires Docker, full Git history and the pinned browser prerequisites. It is separate from hosted acceptance. See
[browser setup](docs/testing/acceptance-browser-setup.md), [toolchain](docs/toolchain.md) and
[portability](docs/portability.md) for initial setup and full repository checks. The
[CI workflow guide](docs/testing/ci-workflows.md) explains the visible lint, application, server and acceptance lanes.

- [Frontend](frontend/README.md) and [API](server/README.md): source boundaries, upload behavior and parser limits.
- [Architecture](docs/architecture/v1.md), [network diagram](docs/architecture/diagrams/network.mmd),
  [runtime](docs/architecture/diagrams/runtime.mmd) and [upload sequence](docs/architecture/diagrams/upload.mmd).
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
exact-candidate human approval and production smoke pass. Each change requires its own checks, review, merge and
publication; historical release records do not establish those outcomes for a later revision.

PR #63 merged at `5c2197f67b1a2c74a7ab5680fe13abb0bfe973ba` after review `5485958132`. Main run `38193758092` passed all
nine validation checks, then failed publication because its `repository.private` assertion rejected the now-public
repository. PR #67 merged the visibility fix at `8cc64d44fc12e0f8feea7fa4ddabfa38945c7544`. At the verified 2026-10-12
delivery checkpoint, main run `38196084304` passed all nine mandatory checks and publication, releasing
[v0.4.66](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.4.66) from that descendant source. Earlier
binding release `v0.4.64` remains historical evidence for source `e6e2967ce0d32df2cbebeabe9749dc12dbcc350f`. See the
[merge and publication record](docs/validation/backend-audio-refactor.md#product-merge-publication-and-freeze). Product
code is frozen except for owner-authorized high-risk feedback addressed through review. Documentation may clarify the
frozen behavior. The [known gaps](docs/handoff/known-gaps.md), including accepted F-004, remain visible. Cloud delivery
stays paused and production v1.0.0 remains deferred.
