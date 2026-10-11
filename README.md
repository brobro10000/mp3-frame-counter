# MP3 frame counter

Count complete physical MPEG-1 Layer III frames from a browser. The application sends raw bytes to `POST /file-upload`
and returns exactly `{ "frameCount": <positive integer> }`. A static NGINX frontend and Fastify API on Node run in
separate non-root containers. Uploads are limited to **20 MiB**, processed in memory and never retained. The parser does
not decode audio or use a runtime parsing library.

**Current published candidate:** [v0.3.37](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.3.37),
source `07c020c40f4a0238da937b82f24e4ef50cb37824`. Its existing
[main CI, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38103007563/attempts/1) passed 120
application unit tests and all 72 required docs-v1 local acceptance cases with cleanup. Fastify and offline Redoc are
shipped; hosted-v1 is bound but pending product activation. No application deployment or hosted acceptance is claimed.
These results do not establish a new walkthrough of the instructions below or a later source revision. Final
clean-checkout verification, evaluator access and external submission remain pending.

See the [implemented tradeoffs](docs/architecture/decisions.md#submission-tradeoffs--2026-10-11-utc),
[assessment requirements](docs/requirements/assessment.md) and [current roadmap](docs/roadmap/README.md). Hosting and a
`1.0.0` release are separate from the assessment submission.

## Historical release milestones

The [V1 release-only milestone](docs/validation/v1-closure.md) is verified at merged source `ce50762b`: **60 independent
acceptance cases**, **75 parser/API unit tests** and all mandatory checks passed on protected main. CI published
[release `v0.1.6`](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.1.6), and a publisher-only retry
reused its ten verified assets unchanged. **Nothing is deployed.** The
[execution status](docs/validation/execution-status.md) records the phase history; the closure record preserves known
limits and the boundary for the next iteration.

**Roadmap update, 2026-10-10:** PR #7 has merged at `92807357`; protected-main CI published
[v0.1.7](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.1.7). The
[versioned roadmap](docs/roadmap/README.md) and [next three PR cards](docs/phases/next-iteration.md) preserve this
assessment snapshot and plan the prerequisites for Fastify, API documentation and a conditional hosted release. The
roadmap is documentation, not deployed functionality; `v1.0.0` is reserved for verified production.

**Transport release, 2026-10-10:** PR #19 introduced Fastify under the independently bound
[transport-v1 contract](docs/testing/contracts/transport-v1.md). Protected-main CI passed **82 unit tests and 67
external cases** and published [v0.2.19](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.2.19). The
[completion evidence](docs/validation/fastify-transport.md#protected-main-completion) records exact source, automated
companion approval, images and publication. Documentation rendering and hosting were still future work at that transport
milestone.

**Documentation release, 2026-10-10:** v0.2.24 shipped offline Redoc at `/docs/` and OpenAPI 3.0.3 at
`/docs/openapi.yaml`. The renderer is packaged in the API image; NGINX applies its scoped policy through the same
origin. Protected-main CI passed 120 units and all 72 required docs-v1 external cases. A subsequent milestone was
[v0.3.28](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.3.28), containing the independent hosted
acceptance candidate. Its separate binding was then under verification; stage and production execution remain future
work. Read the [current phase record](docs/phases/next-iteration.md) and
[binding evidence](docs/validation/hosted-binding.md) for current prerequisites. The
[dormant hosted evidence validator](docs/deployment/hosted-evidence.md) has passed local checks;
[its validation record](docs/validation/hosted-evidence.md) separates those results from pending CI and publication. No
application service is deployed.

## Local application

Use Git, Make and Docker with Compose. Both images build from source without host Node/npm or generated output. A
private-repository clone requires access granted by the owner. Start from a full-history checkout of the published
candidate:

```sh
git clone https://github.com/brobro10000/mp3-frame-counter.git
cd mp3-frame-counter
git checkout --detach v0.3.37
make up
# Open http://127.0.0.1:8080 and http://127.0.0.1:8080/docs/
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

For application acceptance, use Node.js **24.20.0** and npm **11.19.0**, Git with full history, Make, host `tar` and
Docker Compose. The upload example below also uses `curl`. Local acceptance supports macOS/Linux; Linux must already
have Chromium's system libraries. The controller downloads its pinned browser but does not install local OS packages or
run sudo. See [browser preparation](docs/testing/acceptance-browser-setup.md#commands-and-environment). Initial setup
needs network access for npm packages, browsers and container base images; no cloud credentials, private sample, Codex
or private plugin is required.

Install the pinned runtime first; nvm is one option. If its npm differs, install npm 11.19.0 before `npm ci`:

```sh
nvm install
nvm use
npm install --global npm@11.19.0
npm ci
make e2e
```

`make e2e` runs the unchanged phase controller: independent harness validation, application unit tests, TypeScript build
and complete container/browser acceptance. It builds an isolated temporary Compose project, binds ephemeral loopback
ports, runs all frozen acceptance cases in Chromium, exercises controlled API faults and cleans up even after failure.
It may download pinned npm/browser dependencies and public base images. No private sample, GitHub login, Codex or
private plugin is required. Do not run the fault suite against production.

`make e2e-check` validates only the standalone harness, fixtures, negative controls and discovery; it is not an
application acceptance result. `npm run test:unit`, `npm run typecheck` and `npm run build` provide focused checks.
`npm run test:unit` first performs the normal build so source-based tests use the same generated docs assets as the
compiled service. Direct `node --test` usage needs a successful prior build. `make help` lists commands. Stage exact new
files before index-based formatting/policy checks. See [portable setup](docs/portability.md).

For product phases, the controller prepares each selected suite's locked Chromium before standalone controls, with a
bounded launch/close check. Only validated Linux CI installs OS prerequisites; local execution does not run apt/sudo.
Read the [browser preparation contract](docs/testing/acceptance-browser-setup.md) for supported hosts and evidence
limits.

`npm run check:mermaid` renders all tracked Mermaid diagrams and reports their source locations. The explicit
`mermaid:install` command downloads the lockfile-selected Chrome for development validation; `npm ci` itself leaves
install scripts disabled. Browser files and rendered SVGs are ignored and do not enter application runtime images. See
[Mermaid validation](docs/validation/mermaid.md) for setup, results and the separate GitHub diagram-sync boundary.

Acceptance source is independently authored. The immutable [r3 genesis](docs/testing/baseline.json) records P2's actual
protected-main commit `a0a56d9`; its original evidence remains preserved. The
[transition policy](docs/testing/acceptance-transition.md) binds separately reviewed successor suites to actual merged
Git objects. Docs-v1 is now required: all original 67 transport cases plus five documentation cases persist after
activation. Candidate discovery and dormant hosted declarations cannot substitute for complete local acceptance. Product
implementers cannot change expected outcomes or select an older suite to pass. The CI controller extracts the required
Git tree outside the application checkout and verifies ancestry and every frozen byte. Zero tests, skipped cases and
failed checks fail closed.

### Known-count upload without a private sample

After the pinned Node setup above, start the local application and decode the committed synthetic fixture:

```sh
make up
mkdir -p .artifacts
node --input-type=module <<'JS'
import { readFileSync, writeFileSync } from 'node:fs';
const text = readFileSync('tests/acceptance/fixtures/tone-cbr.base64', 'utf8');
writeFileSync('.artifacts/tone-cbr.mp3', Buffer.from(text, 'base64'));
JS
curl --fail -i -H 'Content-Type: audio/mpeg' \
  --data-binary @.artifacts/tone-cbr.mp3 http://127.0.0.1:8080/file-upload
# Expected: HTTP 200, JSON content type, {"frameCount":9}
# Also select .artifacts/tone-cbr.mp3 at http://127.0.0.1:8080/ and choose Analyze MP3.
make down
```

The independent [fixture provenance](tests/acceptance/fixtures/README.md) records nine physical frames in 3,456 bytes;
the expected answer is not inferred from the application. `make smoke FILE=.artifacts/tone-cbr.mp3 EXPECTED=9` is an
optional command-line assertion while the application is running. Adjust the URLs if using another frontend port.

Optional `make validate-sample` requires the ignored supplied sample, verifies its recorded size/hash and compares the
public upload to **6,090 physical frames**. MediaInfo excludes its complete Xing-bearing frame and reports 6,089 audio
frames; the [oracle record](docs/validation/sample-baseline.md) accounts for both. Neither smoke example replaces full
acceptance. Supported metadata is limited by the [r3 contract](docs/testing/acceptance-contract.md); there is no audio
decoding, CRC verification or corruption recovery. The inclusive 20,971,520-byte cap and two admitted uploads bound
resource use; they are not a general throughput guarantee.

### Full repository governance checks

`make check` additionally runs formatting, workflow lint, policy, portability, Mermaid rendering and tooling tests.
Install Terraform **1.13.3** on PATH. Initialize both pinned Google-provider roots as CI does so native mocked tests can
use the installed provider, including the bootstrap filesystem mirror:

```sh
terraform -chdir=infra/cloud/bootstrap init -backend=false -input=false -lockfile=readonly
terraform -chdir=infra/cloud/bootstrap validate -no-color
terraform -chdir=infra/cloud/access init -backend=false -input=false -lockfile=readonly
terraform -chdir=infra/cloud/access validate -no-color
npm run mermaid:install
make check
```

Use this setup only in a fresh checkout; it downloads the locked providers without accessing remote state. The tests use
credential-free native mocks, not live plans or applies. Provider installation needs Terraform registry/download access.
Do not supply cloud credentials or initialize an operational backend for these checks.

Mermaid uses its separately pinned Chrome and requires its system libraries and a working browser sandbox. On Ubuntu
with the documented AppArmor restriction, use `aa-exec --profile=chrome npm run validate`, then `make e2e`, instead of
`make check`; the existing Chrome profile must be installed. See
[toolchain setup](docs/toolchain.md#mermaid-rendering-tools). Neither local browser installer installs OS libraries.
These full-governance prerequisites do not apply to Docker-only application use.

## Requirements, CI and delivery

Start with [central requirements](docs/requirements/README.md), [MVP](docs/mvp.md),
[architecture](docs/architecture/v1.md), [acceptance](docs/testing/acceptance-contract.md),
[decisions](docs/architecture/decisions.md) and [release requirements](docs/requirements/release-process.md).
Cross-reference stable APP identifiers in future changes. Original source captures and historical agent outputs retain
their recorded bytes; [active agent metadata](agents/README.md) documents the ordinary CI handoff.

PR and main-push CI infer required validation from actual repository contents. The stable `control-plane` job rejects
missing, skipped, cancelled or failed mandatory dependencies; an earlier phase selector cannot bypass product tests.
`npm run verify:github` audits live repository controls and exact PR revision checks read-only; its
[application-main limitation](docs/repository-controls.md#application-release-audit-limitation) is documented.
Successful foundation/test-only main pushes retain a source archive for seven days. Application main pushes instead
retain a same-run tested-image bundle for seven days and publish verified assets to a GitHub release; those release
assets remain until deliberately removed. Neither artifact path deploys a service.

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
exception; agent review is not human approval. Exact-release production approval applies when deployment resumes.
