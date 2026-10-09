# MP3 frame counter

Count complete physical MPEG-1 Layer III frames from a browser. The application sends raw bytes to `POST /file-upload`
and returns exactly `{ "frameCount": <positive integer> }`. A static NGINX frontend and native Node HTTP API run in
separate non-root containers. Uploads are limited to **20 MiB**, processed in memory and never retained. The parser does
not decode audio or use a runtime parsing library.

The [five-phase implementation](docs/phases/README.md) is authorized. The independent acceptance baseline and parser
have passed local checks and review; local integration is being verified. Managed deployment is **not yet verified**.
See [phase evidence](docs/validation/) and [deployment preflight](docs/validation/deployment-preflight.md) for actual
results and remaining account, budget and release gates. Written configuration is not deployment evidence.

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
make check
```

`make check` runs formatting, workflow lint, policy, portability and tooling checks, then mandatory phase checks:
independent harness validation, application unit tests, TypeScript build and complete container/browser acceptance.
`make e2e` repeats the phase controller. It builds an isolated temporary Compose project, binds ephemeral loopback
ports, runs all frozen acceptance cases in Chromium, exercises controlled API faults and cleans up even after failure.
It may download pinned npm/browser dependencies and public base images. No private sample, GitHub login, Codex or
private plugin is required. Do not run the fault suite against production.

`make e2e-check` validates only the standalone harness, fixtures, negative controls and discovery; it is not an
application acceptance result. `npm run test:unit`, `npm run typecheck` and `npm run build` provide focused checks.
`make help` lists commands. Stage exact new files before index-based formatting/policy checks. See
[portable setup](docs/portability.md).

Acceptance source is independently authored and frozen by [baseline identity](docs/testing/baseline.json). Product
implementers may read it but cannot change expected outcomes to pass. The CI controller extracts the recorded Git tree
outside the application checkout. Shipping CI requires the separate acceptance baseline on the trusted base branch; the
current local record remains provisional until that merge. Zero tests, skipped cases and failed checks fail closed.

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

[APP-REL-001–006](docs/requirements/release-process.md) require actual candidate acceptance, exact artifact promotion,
production smoke, automatic release/version records and observed recovery. The conditional Render path and unresolved
fit/access gates are recorded in [provider evaluation](docs/architecture/deployment.md) and the
[release runbook](docs/deployment/runbook.md). Deployment is not complete until those observations exist.

The [owner-only review exception](docs/repository-controls.md) preserves core PR, CI and conversation protections.
GitHub does not allow authors to approve their own PRs. An agent needs explicit instruction to merge or invoke the owner
exception; agent review is not human approval. Production approval separately binds the tested release identity.
