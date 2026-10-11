# Local application and release handoff

This is the deadline-focused local MVP handoff. It preserves the raw upload API, pure physical-frame parser, two
non-root runtime containers and independent acceptance. Cloud deployment is paused; a local pass or repository release
does not establish production v1.0.0. See the
[delivery amendment](v1-delivery.md#local-mvp-handoff-and-cloud-pause--2026-10-11).

## Run a received release with Docker

Recipients need Docker with Compose, `tar` and a standard checksum utility; no Node/npm, Git, Make, GitHub CLI or cloud
login is needed when the files are supplied. Receive the **same-tag source directory** containing `compose.yaml` and
`compose.release.yaml`, plus all ten release assets. Alternatively, authorized recipients can download the assets and
GitHub's separate **Source code (zip)** from the selected
[release page](https://github.com/brobro10000/mp3-frame-counter/releases). That automatic source archive is separate
from the ten published assets. Keep its tag matched to `manifest.json`.

From the unzipped source directory, place the supplied assets in `.artifacts/received-release`. Verify both archive
checksums, then load the images. Stop if verification fails; do not rebuild or substitute a `latest` tag:

```sh
set -e
release_bundle="$PWD/.artifacts/received-release"
if command -v shasum >/dev/null 2>&1; then
  (cd "$release_bundle" && shasum -a 256 -c SHA256SUMS)
else
  (cd "$release_bundle" && sha256sum --check SHA256SUMS)
fi
docker load --input "$release_bundle/api.docker.tar"
docker load --input "$release_bundle/frontend.docker.tar"
```

Open `manifest.json` and copy the complete `artifacts.api.localImageId` and `artifacts.frontend.localImageId` values
into the two variables below, replacing both placeholders. These are the published immutable Docker configuration
identities, not archive checksums or guessed image names:

```sh
export API_IMAGE='sha256:REPLACE_WITH_EXACT_API_ID'
export FRONTEND_IMAGE='sha256:REPLACE_WITH_EXACT_FRONTEND_ID'
docker image inspect "$API_IMAGE" "$FRONTEND_IMAGE" --format '{{.Id}} {{.Os}}/{{.Architecture}}'
```

Confirm both inspections match the copied IDs and report `linux/amd64`; ARM hosts need working Docker emulation. If an
ID is unavailable or differs, **stop before Compose**. Some containerd image stores expose an OCI manifest identity
instead. Follow the [verified image-store fallback](image-store-compatibility.md#verify-a-containerd-loaded-image) for
both archives; a different ID printed by `docker load` alone is insufficient. Set `API_IMAGE` and `FRONTEND_IMAGE` only
to the identities that pass that verification, then start the exact pair with the matching source's canonical runtime
settings:

```sh
docker compose -p mp3-release -f compose.yaml -f compose.release.yaml \
  up --no-build --pull never --detach --wait --wait-timeout 90
```

The release override requires both IDs. Open [the application](http://127.0.0.1:8080/) or
[Redoc](http://127.0.0.1:8080/docs/). Choose an MP3 and click **Analyze MP3**. If port 8080 is occupied, stop the
earlier project or supply `FRONTEND_PORT=8081` to Compose. Stop only this release project with the same environment and
files:

```sh
docker compose -p mp3-release -f compose.yaml -f compose.release.yaml down --timeout 7 --remove-orphans
```

Cleanup retains loaded images and supplied assets. Checksums establish archive integrity, not a signature or production
approval. The optional fixture decoder and engineer walkthrough below need extra tools; running these images does not.

## Start from source

Use Git, Make and Docker with Compose. Clone with authorized access, then run from the repository root:

```sh
make up
make ps
```

`make up` builds both images, waits for readiness and exposes only the frontend at
[http://127.0.0.1:8080/](http://127.0.0.1:8080/). Redoc is at
[http://127.0.0.1:8080/docs/](http://127.0.0.1:8080/docs/), with its specification at
[http://127.0.0.1:8080/docs/openapi.yaml](http://127.0.0.1:8080/docs/openapi.yaml). Use `FRONTEND_PORT=8081 make up` for
a different host port, and adjust the browser/curl URLs accordingly.

Source builds initially need network access for locked npm packages and container base images. Host Node/npm is not
required for `make up`. No cloud account, private plugin, Codex or private MP3 sample is needed.

## Optional known-count fixture

For this fixture decoder, use Node.js **24.20.0**. Decode the committed synthetic file from the repository root:

```sh
mkdir -p .artifacts
node --input-type=module <<'JS'
import { readFileSync, writeFileSync } from 'node:fs';
const encoded = readFileSync('tests/acceptance/fixtures/tone-cbr.base64', 'utf8');
writeFileSync('.artifacts/tone-cbr.mp3', Buffer.from(encoded, 'base64'));
JS
curl --fail -i -H 'Content-Type: audio/mpeg' \
  --data-binary @.artifacts/tone-cbr.mp3 http://127.0.0.1:8080/file-upload
```

Expect HTTP 200, a JSON content type and exactly `{"frameCount":9}`. Select `.artifacts/tone-cbr.mp3` in the browser and
choose **Analyze MP3**; the page should show nine frames. The
[independent fixture record](../../tests/acceptance/fixtures/README.md) establishes nine physical frames in 3,456 bytes.
This smoke check does not replace full acceptance. `make smoke FILE=.artifacts/tone-cbr.mp3 EXPECTED=9` optionally
asserts the same result while the application is running.

## Optional engineer verification with Node and Git

Choose one verified published tag from [GitHub releases](https://github.com/brobro10000/mp3-frame-counter/releases). Use
a clean, full-history checkout of that tag and download all its release assets into an ignored directory. The commands
below require the pinned Node runtime, Docker, `shasum` and authenticated GitHub CLI access to the private repository.
Browser download is an alternative to the `gh release download` step. Replace `v0.x.y` with the selected tag:

```sh
set -e
release_tag='v0.x.y'
git checkout --detach "$release_tag"
release_bundle="$PWD/.artifacts/release-$release_tag"
mkdir -p "$release_bundle"
gh release download "$release_tag" --dir "$release_bundle"
(cd "$release_bundle" && shasum -a 256 -c SHA256SUMS)
```

Do not use an unverified draft, an incomplete asset set or a newly rebuilt image. Published releases contain the two
Docker archives plus preparation/publication evidence; see [asset provenance](release-only.md). Archive SHA-256 values,
local Docker image IDs and registry digests are distinct recorded identities. Checksums establish byte integrity, not a
signature or hosted approval.

The following snippet validates the original preparation bytes, requires its exact clean source, loads the two archives,
checks the loaded image IDs/platform and writes an ignored image override. It does not retag, rebuild or publish:

This optional engineer snippet expects the published configuration IDs to be inspectable. On a containerd store where
they are unavailable, it stops rather than creating an override. Preserve that failure and use the
[manual verified fallback](image-store-compatibility.md#verify-a-containerd-loaded-image), followed by the received
release's `compose.release.yaml` command above. Do not disable `verifyImageInspection` or alter release metadata.

```sh
set -e
node --input-type=module - "$release_bundle" <<'JS'
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { verifyImageInspection, verifyPreparedDirectory } from './scripts/release-manifest.mjs';
const directory = process.argv[2];
const initial = JSON.parse(readFileSync(join(directory, 'manifest.json'), 'utf8'));
const manifest = await verifyPreparedDirectory(directory, initial.identity);
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), manifest.sourceRevision);
assert.equal(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim(), '');
const services = {};
for (const service of ['api', 'frontend']) {
  const artifact = manifest.artifacts[service];
  execFileSync('docker', ['load', '--input', join(directory, artifact.archiveFile)], { stdio: 'inherit' });
  const inspected = JSON.parse(execFileSync('docker', ['image', 'inspect', artifact.localImageId], {
    encoding: 'utf8',
  }));
  assert.equal(inspected.length, 1);
  verifyImageInspection(artifact.localImageId, inspected[0]);
  services[service] = { image: artifact.localImageId, platform: 'linux/amd64', pull_policy: 'never' };
}
writeFileSync(join(directory, 'compose.images.json'), JSON.stringify({ services }, null, 2) + '\n');
JS
docker compose -p mp3-release -f compose.yaml -f "$release_bundle/compose.images.json" \
  up --no-build --pull never --detach --wait --wait-timeout 90
```

Compose inherits the same-source runtime settings, health checks, resource limits and private network. `--no-build` and
`--pull never` keep startup on the loaded tested pair. Published images are `linux/amd64`; ARM hosts need Docker's
working emulation. Stop an earlier source project with `make down` before reusing its port, or supply a different
`FRONTEND_PORT` to Compose. Apply the nine-frame smoke check above to this running pair. Stop only this release project
with:

```sh
docker compose -p mp3-release -f compose.yaml -f "$release_bundle/compose.images.json" \
  down --timeout 7 --remove-orphans
```

Loaded images and downloaded assets remain available for inspection; cleanup does not delete them. The manifest keeps
its original `prepared-local`/`deployable: false` meaning; publication and local startup do not rewrite that evidence.

## Development and full checks

Use Node.js **24.20.0**, npm **11.19.0**, full Git history, Make, Docker Compose and host `tar`. Initial verification
needs network access for pinned npm/browser dependencies and base images. On Linux, prepare Chromium's system libraries
using [browser setup](../testing/acceptance-browser-setup.md); local commands do not install OS packages or run sudo.

```sh
npm ci
npm run typecheck
npm run test:unit
make e2e
```

`make e2e` extracts the independently required suite, builds an isolated pair, runs all local HTTP/browser cases and
performs scoped cleanup. `make e2e-check` only validates the standalone harness and controls, so it is not application
acceptance. `make check` additionally runs formatting, workflow/policy checks, tooling tests and Mermaid rendering;
follow [toolchain setup](../toolchain.md) and [portability](../portability.md) for browser/platform prerequisites. Full
repository checks additionally require Terraform **1.13.3** on PATH. In a fresh checkout, initialize both pinned
provider roots without remote state or cloud credentials, then prepare the Mermaid browser:

```sh
terraform -chdir=infra/cloud/bootstrap init -backend=false -input=false -lockfile=readonly
terraform -chdir=infra/cloud/bootstrap validate -no-color
terraform -chdir=infra/cloud/access init -backend=false -input=false -lockfile=readonly
terraform -chdir=infra/cloud/access validate -no-color
npm run mermaid:install
make check
```

These checks use credential-free native mocks; initialization downloads locked provider packages and performs no live
plan or apply. Local verification does not confer CI publication authority.

## Troubleshooting and cleanup

| Symptom                                        | Check                                                                                                                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Port 8080 is occupied                          | Stop your earlier source/release project or choose `FRONTEND_PORT=8081`.                                                                                        |
| Startup times out                              | Source: `make ps`/`make logs`. Release: matching `mp3-release` Compose `ps`/`logs`; check both service health checks.                                           |
| Upload shows a JSON error                      | Use MPEG-1 Layer III, raw bytes and the supported metadata subset within 20 MiB.                                                                                |
| Inspector cannot display a response            | If the page shows a frame count, it received and parsed JSON. Inspector cache eviction is separate from API delivery.                                           |
| Release checksum/source/image mismatch         | Stop and retain the original evidence; do not rebuild over the selected release or replace its files.                                                           |
| Loaded release configuration ID is unavailable | Stop before startup; verify the [containerd identity chain](image-store-compatibility.md#verify-a-containerd-loaded-image) before using an alternate loaded ID. |
| A hosted URL returns Forbidden                 | Existing stage requires authenticated invocation; cloud access is outside this local handoff.                                                                   |

Use `make down` for the source project and the matching `mp3-release` command above for release images. Do not run
global Docker prune or remove unrelated projects. `.artifacts/tone-cbr.mp3` is an ignored local fixture copy; the
supplied assessment MP3 remains private and optional.

For release diagnostics, keep the startup command's project, environment and Compose files; replace `up` and its flags
with `ps` or `logs`. Use `docker compose -p mp3-release -f compose.yaml -f compose.release.yaml ps` (or `logs`) for the
received bundle. For the optional engineer override, retain its `-f "$release_bundle/compose.images.json"` instead.

This guide describes reproducible commands; a final handoff records the actual source, suite, image IDs and outcomes. Do
not infer fresh React acceptance, protected-main publication or production success from historical evidence.
