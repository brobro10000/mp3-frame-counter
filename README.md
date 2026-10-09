# MP3 frame counter

Private TypeScript assessment repository, currently at the repository-foundation phase. There is no running API, MP3
parser, application test suite or production build.

The future assessment will accept an MP3 at `POST /file-upload`, parse MPEG Version 1 Audio Layer 3 frames without an
MP3 frame-parsing package, and return `{ "frameCount": <number> }`. Implementation, application framework and
test-framework selection require a separately approved phase.

## Working commands

Use Node.js **24.20.0 LTS** and npm **11.19.0**. If using nvm:

```sh
nvm install
nvm use
npm ci
npm run validate
```

`npm run validate` checks formatting of tracked files, workflow syntax with checksum-pinned actionlint 1.7.12,
repository policy, and real terminal-gate negative tests. First use downloads the official actionlint archive; macOS
arm64 and Linux x64 are supported. Git and `tar` must be available. External shellcheck and pyflakes are disabled to
keep the local and CI toolchains identical; actionlint's own workflow validation remains enabled.

Stage newly created files before running formatting checks. `npm run format` formats tracked files. The canonical
orchestrator artifacts under `agents/` and `AGENTS.md` retain their validator-required bytes and are excluded from
Prettier; CI still parses their JSON, YAML and frontmatter. Application typechecking, parser tests, endpoint integration
tests and production builds are **not implemented**.

`npm run verify:github` uses your existing authenticated GitHub CLI for read-only checks of this phase's current PR and
repository controls. It fails if required protections, the bound CI integration, current-revision success or the
expected independent-review blocker are missing. It requires administrative read access; it is not a CI step and does
not modify settings. After merge, its phase-specific expectation of an open blocked PR no longer applies.

## Validation and delivery

Pull requests targeting `main` and pushes to `main` run the same validation. The stable terminal `control-plane` job
checks every mandatory dependency and fails on failure, cancellation, skipping or missing results. It has no matrix or
path filter. A PR's delivery job is always skipped.

After successful validation on a push to protected `main`, delivery creates a tracked-source archive named for the exact
commit, plus `COMMIT_SHA` and `SHA256SUMS`, retained in GitHub Actions for **7 days**. This is a foundation source
archive, not a deployable service. The workflow is configured; delivery has not executed on `main` because the
foundation PR must remain open. Container packaging, deployment, releases and package publishing are deferred.

For a local packaging inspection of the committed checkout:

```sh
npm run artifact:foundation
cd .artifacts
shasum -a 256 -c SHA256SUMS
```

This packages `HEAD`, excluding untracked files, `.git`, dependencies, caches and forbidden tracked inputs. It does not
upload or deploy anything.

## Review and boundaries

See [the phase plan and decisions](docs/foundation-plan.md), [merge controls](docs/repository-controls.md), and
[tool sources](docs/toolchain.md). Review changes to workflows, dependencies, permissions and merge rules carefully. The
foundation PR must not be merged or automatically approved by an agent.

The supplied MP3 remains outside this project and must not be committed. Normal local validation and GitHub CI do not
need the private MVP orchestrator plugin. Its version **1.3.0** generated and validated the bounded planning artifacts;
the artifacts' `0.1.0` fields describe their legacy schema contract, not the installed plugin version.
