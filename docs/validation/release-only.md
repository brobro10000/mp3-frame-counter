# Release-only validation

Observed on 2026-10-09 after [SRC-RELEASE-ONLY](../requirements/sources/release-only-request.txt). Implementation
source: `dab51daeda4a2217c038fb2d067c194b526aa148`. The owner deferred deployment; this record does not claim a
published release.

## Implementation and independent review

The independent foundation/gate author added a main-only tested-image bundle and a separate private GitHub publisher.
Root integrated command wiring, current requirements, P5 and agent instructions. A separate read-only reviewer found no
blocking issues in source identity, frozen baseline ancestry, same-run artifacts, least privilege, immutable retries,
draft completion and latest-version handling. The reviewer also checked real read-only GitHub API responses for the
version and job fields consumed by the publisher. This was advisory agent review, not human GitHub approval.

Publication retains the local prepared manifest unchanged and adds separate undeployed provenance. No provider call,
registry push, production approval, service creation or rollout is part of the workflow. Frozen acceptance files,
baseline record, existing terminal gate and phase/E2E controllers are unchanged.

## Commands and observed results

Using pinned Node 24.20.0/npm 11.19.0:

- `npm run validate` passed formatting, workflow lint, policy, portability, all **16/16 Mermaid renders**, **20 gate
  tests** and **62 tooling tests**. The tooling total includes **10 new release-publication tests**.
- The new tests use disposable Git/bundle fixtures and an in-memory API. They cover untrusted events, protected baseline
  and source binding, archive tampering, symlinks, failed/skipped/mixed-attempt jobs, tag/body/asset conflicts, partial
  uploads and identical retries, older-version handling and workflow permission controls. No real release is created.
- `npm run test:unit`, `npm run typecheck` and `npm run build` passed **75 application tests** and TypeScript checks.
- At the clean committed source above, `node scripts/run-ci-phase.mjs` passed all harness/fixture/negative controls,
  **75 unit tests**, build, independent `linux/amd64` container builds and **60/60 real browser/HTTP acceptance cases**,
  with zero failures/skips and successful scoped cleanup. Docker used an ignored anonymous public-image configuration.
  The [exact result](artifacts/release-only-local-acceptance.json) records source, images, configuration and baseline.
- `git diff --check` passed. The independently frozen suite/tree/fixture hash remain unchanged.

The parser received explanatory comments only: the supplied sample's **6,090 physical MPEG frames** include its complete
Xing metadata frame; MediaInfo reports **6,089 audio frames**. The prior [independent sample record](sample-baseline.md)
is preserved. There is no sample-specific count adjustment.

## Remaining boundary at the recorded revision

The original local acceptance used the explicitly provisional P2 baseline. At that time PR #3 still needed to land,
followed by a refreshed and validated PR #4. Shipping CI required the independent owner to bind the unchanged baseline
to its actual protected-main squash commit. No guard was bypassed.

Subsequently, PR #3/#4 merged, the unchanged suite was bound to `a0a56d9`, and the reconciled product passed PR CI. See
[current progression](execution-status.md); the original source/report above retain their actual inputs.

The first main-only bundle export, private release publication, real upload retry and final remote assets have **not**
been observed. After the product merge, record the actual successful main run and tag/release URL before declaring
automatic publication complete. The workflow has seven-day handoff artifact retention, a single pending publisher slot
and conservative original-attempt checks; [operational guidance](../deployment/release-only.md) explains retries.
Deployment remains deferred. No merge, owner override, tag, release or cloud deployment was performed in this
validation.

## Subsequent protected-main completion

On 2026-10-10, PR #5 merged at `ce50762b`. Main CI published `v0.1.6` and an identical publisher-only retry preserved
its ten verified assets. The [V1 closure](v1-closure.md) records source, checks, images, assets and retry evidence. This
later observation resolves the first-publication boundary without changing the dated local results above. Deployment
remains deferred.
