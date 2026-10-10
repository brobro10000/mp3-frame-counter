# GitHub releases without deployment

The owner explicitly deferred deployment in [SRC-RELEASE-ONLY](../requirements/sources/release-only-request.txt).
[APP-REL-001–006](../requirements/release-process.md) now require repository releases of tested artifacts. No provider,
registry, stage or production credentials are needed, and publishing a release does not expose the application.

## Eligibility and workflow

Only application-bearing pushes to protected `main` qualify. PRs and foundation/test-only main revisions never publish
an application release. The independent acceptance baseline must already be on protected main, with its actual merged
SHA recorded by the independent owner. Foundation, product and terminal `control-plane` checks remain mandatory; the
publisher cannot bypass them. It also verifies the exact source and successful original workflow attempt.

On the acceptance runner, `scripts/publish-release-bundle.mjs` validates the clean exact event SHA and passing E2E
report, then exports the exact tested `linux/amd64` images through local preparation. It uploads that versioned bundle
as an immutable artifact of the same workflow run. The separate `publish-release` job downloads that specific bundle,
checks source/configuration, acceptance and archive identities, and runs `npm run publish:release` to create/finish a
private GitHub release. The equivalent npm wrapper is `npm run publish:release`; the CI job needs no npm install.
Publication never rebuilds images. The bundle carries both Docker archives, `SHA256SUMS`, reservation/manifest/local
notes, `ci-origin.json` and `e2e-result.json`. The publisher adds `publication.json` and `publication-notes.md`. The
local `manifest.json` remains `prepared-local` and `deployable: false`; separate publication evidence records repository
release status and explicitly no deployment.

The default workflow token is read-only. Only the main-only publisher receives `contents: write` to create its tag,
release and assets, plus `actions: read` to verify original-run checks. It receives no provider secrets. The main merge
controls, owner-only review exception and frozen acceptance ownership are unchanged. A GitHub release neither authorizes
a merge nor counts as production approval.

## Version, retention and retries

Versions use `0.1.<first-parent Git ordinal of tested main source>` and tags use `v<version>`. Full Git history is
required. This is monotonic on protected linear main; feature-branch ordinals from local preparation remain provisional.
The root package version stays unchanged. Source ordinals may have gaps, and a new version does not imply deployment.

A release stays draft until every expected archive and evidence asset has been verified. The publisher rejects any
existing tag pointing elsewhere, changed body or conflicting asset. It reuses identical existing content; it never
force-moves a tag or replaces asset bytes. Retry a failed publisher job using its original same-run artifact. Rerunning
all jobs can produce different image/configuration identities and is not permission to overwrite a reserved version.
Keep incomplete drafts and failure evidence for investigation.

All mandatory checks must pass in the attempt that produced the bundle. Selectively rerunning failed validation jobs can
leave checks spread across attempts and will fail publication before any remote mutation. If no tag/draft/release was
reserved, rerun all jobs so one successful attempt produces the bundle and checks. Once publication has begun, retry
only the publisher with its original complete evidence; do not replace a reserved version with a new build.

Publication is serialized and running jobs are not cancelled.
[GitHub's default concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)
permits one pending job; a newer pending publisher can replace an older pending one. Such an intermediate revision may
have no release until its publisher is explicitly rerun while the original artifact remains available. The newest
successfully released revision is the normal delivery target. An older eligible main ancestor can be released later
without replacing a newer latest release. This bounded workflow does not promise a release for every queued intermediate
revision.

Published release assets remain available until an authorized repository action deletes them; this workflow performs no
release deletion. Same-run workflow artifacts have seven-day retention and are only a handoff/retry mechanism. Retain
prior release image archives and provenance. These hashes are integrity evidence, not signed attestations against a
malicious repository owner, and Docker archive hashes are distinct from image IDs and future registry digests.

The [validation record](../validation/release-only.md) separates passing local tests and source review from the pending
first remote publication.

## First release and deferred deployment

The first actual automatic release cannot occur until P1 and the separate P2 baseline merge, the baseline is bound to
its real protected-main commit, and the reviewed product/publisher scope passes CI and merges. See
[current execution status](../validation/execution-status.md). Local tests and a configured publisher do not prove this
first remote execution. No manual feature-branch publication is a substitute.

When deployment resumes, the [deployment runbook](runbook.md) still requires provider/account/budget approval, immutable
registry identities, full stage acceptance through real ingress, exact production approval, hosted smoke and recovery. A
repository release preserves candidate image bytes but supplies none of that hosted evidence.
