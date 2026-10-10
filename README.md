# MP3 frame counter

Count complete physical MPEG-1 Layer III frames from a browser. The application sends raw bytes to `POST /file-upload`
and returns exactly `{ "frameCount": <positive integer> }`. A static NGINX frontend and native Node HTTP API run in
separate non-root containers. Uploads are limited to **20 MiB**, processed in memory and never retained. The parser does
not decode audio or use a runtime parsing library.

The [five-phase implementation](docs/phases/README.md) is authorized. The integrated local application passed all **60
independent acceptance cases** and **75 parser/API unit tests**. See the
[tested revision and evidence](docs/validation/p4-integration.md). The current goal is **releases without deployment**;
the independent acceptance suite is now merged on protected main. The first automatic GitHub release remains
outstanding. The [execution status](docs/validation/execution-status.md) records each boundary and the remaining
actions.

## Local application

Install Docker with Compose. Both images build from source without host dependencies or generated output:

```sh
make up
# Open http://127.0.0.1:8080
make ps
make logs
make down
```

Set `FRONTEND_PORT=8081 make up` to choose another loopback port. The API remains private to the Compose network. Only
this project's containers and network are removed by `make down`. No global Docker cleanup is used. Runtime containers
have read-only filesystems and small temporary memory-backed mounts; no upload volumes are configured.

Select a file, then choose **Analyze MP3**. The interface prevents duplicate submissions while pending and supports
retry after a useful error. MPEG-2/2.5, other layers, free-format encoding and unsupported tag layouts are rejected.
Complete Xing/Info/VBRI-bearing frames count physically; metadata totals and duration estimates do not determine counts.
Read the [precise acceptance contract](docs/testing/acceptance-contract.md) for supported tags and error behavior.

## Development and verification

Use repository-pinned Node.js **24.20.0** and npm **11.19.0**, plus Git, tar and Docker Compose:

```sh
nvm install
nvm use
npm ci
npm run mermaid:install
make check
```

`make check` runs formatting, workflow lint, policy, portability, Mermaid rendering and tooling checks, then mandatory
phase checks: independent harness validation, application unit tests, TypeScript build and complete container/browser
acceptance. `make e2e` repeats the phase controller. It builds an isolated temporary Compose project, binds ephemeral
loopback ports, runs all frozen acceptance cases in Chromium, exercises controlled API faults and cleans up even after
failure. It may download pinned npm/browser dependencies and public base images. No private sample, GitHub login, Codex
or private plugin is required. Do not run the fault suite against production.

`make e2e-check` validates only the standalone harness, fixtures, negative controls and discovery; it is not an
application acceptance result. `npm run test:unit`, `npm run typecheck` and `npm run build` provide focused checks.
`make help` lists commands. Stage exact new files before index-based formatting/policy checks. See
[portable setup](docs/portability.md).

`npm run check:mermaid` renders all tracked Mermaid diagrams and reports their source locations. The explicit
`mermaid:install` command downloads the lockfile-selected Chrome for development validation; `npm ci` itself leaves
install scripts disabled. Browser files and rendered SVGs are ignored and do not enter application runtime images. See
[Mermaid validation](docs/validation/mermaid.md) for setup, results and the separate GitHub diagram-sync boundary.

Acceptance source is independently authored and frozen by [baseline identity](docs/testing/baseline.json). Product
implementers may read it but cannot change expected outcomes to pass. The CI controller extracts the recorded Git tree
outside the application checkout. The independent author bound the unchanged suite to P2’s actual protected-main commit
`a0a56d9` after PR #4 merged. Shipping CI verifies that ancestry and every frozen byte. Zero tests, skipped cases and
failed checks fail closed.

For a small local upload with an independently known count:

```sh
make smoke FILE="relative/path/to/audio.mp3" EXPECTED=9
make validate-sample
```

The latter requires the ignored supplied sample, verifies its recorded size/hash and compares the public upload to the
independent **6,090 physical-frame** baseline. MediaInfo reports 6,089 audio frames plus a complete Xing frame; the
[oracle record](docs/validation/sample-baseline.md) documents the distinction. A clone has permitted self-contained
fixtures instead of private sample bytes. Neither smoke command substitutes for complete acceptance.

## Requirements, CI and delivery

Start with [central requirements](docs/requirements/README.md), [MVP](docs/mvp.md),
[architecture](docs/architecture/v1.md), [acceptance](docs/testing/acceptance-contract.md),
[decisions](docs/architecture/decisions.md) and [release requirements](docs/requirements/release-process.md).
Cross-reference stable APP identifiers in future changes. Original source captures and historical agent outputs retain
their recorded bytes; [active agent metadata](agents/README.md) documents the ordinary CI handoff.

PR and main-push CI infer required validation from actual repository contents. The stable `control-plane` job rejects
missing, skipped, cancelled or failed mandatory dependencies; an earlier phase selector cannot bypass product tests.
`npm run verify:github` audits live repository controls and exact revision checks read-only. Main success also retains a
source archive for seven days; this archive is not a deployed service.

[APP-REL-001–006](docs/requirements/release-process.md) now separate repository releases from deferred deployment. After
an application-bearing push to protected `main` passes all mandatory checks, CI publishes a versioned private GitHub
release containing the exact tested frontend/API image archives, checksums and provenance. The release explicitly
records that nothing was deployed. See the [release-only process](docs/deployment/release-only.md) for gates and
retries. Provider setup, stage/production rollout, hosted smoke and recovery remain future work under the
[deployment runbook](docs/deployment/runbook.md).

After a complete clean-source acceptance run, `make prepare-release` verifies and archives the **exact tested local
images** into ignored `.artifacts/releases/`, with checksums, a provisional version, manifest and notes. It requires a
clean committed checkout, full Git history and the retained images; it does not rebuild, publish or deploy. See
[release preparation](docs/deployment/preparation.md) for inputs and retry behavior. CI publication adds stricter
protected-main and successful-run checks to that local preparation boundary.

The [owner-only review exception](docs/repository-controls.md) preserves core PR, CI and conversation protections.
GitHub does not allow authors to approve their own PRs. An agent needs explicit instruction to merge or invoke the owner
exception; agent review is not human approval. Production approval separately binds the tested release identity.
