# MP3 frame counter

Private TypeScript assessment repository. PR #1's foundation is merged at `143498a`; the unified V1 planning documents
are ready for human review. There is no working parser, API, browser app, acceptance suite or managed deployment yet.

V1 will accept raw MP3 bytes at `POST /file-upload`, count physical MPEG Version 1 Audio Layer 3 frames in our own pure
TypeScript parser, and return exactly `{ "frameCount": <positive integer> }`. A static HTML/NGINX frontend and native
Node HTTP API run in separate images, with an inclusive 20 MiB limit and no retained uploads. Independent executable
Playwright acceptance must be reviewed before product code. A managed candidate, explicit production approval and
verified release/recovery cycle are required for the first functional MVP.

Start with the [MVP requirements](docs/mvp.md), [architecture and five diagrams](docs/architecture/v1.md),
[acceptance contract](docs/testing/acceptance-contract.md), [provider evaluation](docs/architecture/deployment.md),
[decisions/risks](docs/architecture/decisions.md) and [five-phase plan](docs/phases/README.md). The
[central source register](docs/requirements/README.md) preserves the assessment, release amendment and supplied briefs.
Cite stable APP IDs and actual tested revisions in future plans, code, tests and PRs.

The next proposed phase is [P1: verify/adapt the merged foundation](docs/phases/01-foundation.md), **not authorized by
this planning run**. P2 independently authors the test baseline; P3 implements the parser; P4 integrates the local app;
P5 handles managed deployment. Each needs its own authorization and reviewable handoff. The conditional hosting proposal
is Render frontend web service plus private API, with ingress-fit, account and budget gates still open.

## Existing foundation commands

Use the repository-pinned Node.js **24.20.0** and npm **11.19.0**. For a future authorized fresh setup with nvm:

```sh
nvm install
nvm use
npm ci
npm run validate
```

These commands cover foundation tooling only. No dependency installation ran in the unified planning pass. Validation
checks tracked-file formatting, checksum-pinned actionlint 1.7.12, repository policy, portability and 22 gate/tooling
tests. First actionlint use can download its official archive; Git and tar are prerequisites. Normal foundation checks
need no GitHub login, private sample or private plugin. See [portable setup](docs/portability.md).

Stage exact new/moved files before index-based checks. `npm run format` formats tracked files; AGENTS/agents and
original source captures retain their existing formatter exclusions. JSON/YAML/frontmatter under agents is still parsed
by policy. App typecheck/parser/E2E/build checks are not implemented. Future Make and deployment targets are described
only in the [runbook](docs/deployment/runbook.md); do not treat them as working commands.

`npm run verify:github` is read-only but still assumes an open foundation PR. P1 must update this obsolete assumption
before using it as fresh evidence. It resolves repository context from Git, with explicit repo/PR overrides available;
run under an appropriately authorized account. No audit is a reason to change controls implicitly.

## Existing CI and delivery

PRs into main and main pushes validate the foundation. The stable `control-plane` terminal job fails on missing, failed,
cancelled or skipped mandatory dependencies. Main success creates a tracked-source archive with commit identity and
checksums, retained seven days. This is a foundation archive, not a deployed service. The first merged-main run for
`143498a` succeeded in [run 37975629467](https://github.com/brobro10000/mp3-frame-counter/actions/runs/37975629467).

For a future local inspection of the committed checkout, `npm run artifact:foundation` packages HEAD into ignored
`.artifacts/`; it excludes private MP3 input, caches and untracked files. It does not include uncommitted planning work.
Deployment/versioning/tag/release/recovery automation remains pending under
[APP-REL-001–006](docs/requirements/release-process.md). P5 must demonstrate actual release and recovery evidence.

## Controls, history and review

The [merge controls](docs/repository-controls.md) preserve the user's owner-only PR review override. GitHub does not
allow authors to approve their own PRs; the owner may explicitly override the review rules when merging. The separate
core ruleset continues to require the PR, resolved conversations, CI and branch protections with no bypass. Agents must
never approve, merge or exercise the exception without an explicit instruction. Production approval is separate.

The installed MVP Orchestrator 1.3.0 was inspected through its supported planning route. Its approved-form generated
contracts cannot truthfully represent this unreviewed proposal. They await reviewed inputs as explained in
[agents/README.md](agents/README.md). Exact foundation and superseded V1-draft contracts remain archived; old outputs
are historical, not current readiness. Root AGENTS is an authored planning entrypoint. See
[actual planning validation and limitations](docs/validation/v1-planning.md).

The ignored private sample is `docs/requirements/samples/assessment-sample.mp3`; a clone contains only its
[identity record](docs/requirements/samples/README.md). Its MediaInfo count is still unobserved. Future CI must use
permitted self-contained fixtures, and ordinary users must be able to run the app without Codex or the private plugin.
