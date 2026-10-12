# Visible CI lanes

Ordinary CI uses four reusable workflows in the same run. The source-bound visibility and backend source/dependency
policies are adopted on protected main. The successor is bound and all nine validation checks passed on the product
merge. Main run `38193758092` failed only in the publisher because its `repository.private` assertion rejected the
now-public repository; it is not recorded as an overall successful run. At the verified 2026-10-12 delivery checkpoint,
reviewed PR #67 descendant source `8cc64d44fc12e0f8feea7fa4ddabfa38945c7544` passed all nine mandatory checks and
publication in main run `38196084304`, releasing `v0.4.66`. Stage delivery remained skipped. See the
[merge and publication record](../validation/backend-audio-refactor.md#product-merge-publication-and-freeze).

| Caller                | Reusable workflow                                                      | Mandatory work                                                                                                                                    |
| --------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validate-foundation` | [Linter](../../.github/workflows/linter.yml)                           | Formatting, workflow/policy/portability/Mermaid/gate checks, plus four tooling shards.                                                            |
| `validate-product`    | [Base acceptance E2E](../../.github/workflows/base-acceptance-e2e.yml) | Independent Playwright browser/HTTP acceptance against the real Docker pair, suite controls, image identity, cleanup and same-run release export. |
| `application-tests`   | [Application tests](../../.github/workflows/application-tests.yml)     | Strict frontend build and the response-contract unit tests.                                                                                       |
| `server-tests`        | [Server tests](../../.github/workflows/server-tests.yml)               | Server/docs build and the five localized factory, parser, HTTP, docs routing and docs-build unit files.                                           |

Every executing worker performs the original trusted-base admission preflight before installing or running head-owned
code. The unconditional `control-plane` job requires success from all four callers; failure, cancellation, missing or
skipped work blocks it. Reusable calls introduce no path filters, optional acceptance or separate release-event trust.

The adopted prerequisite extends the linter's closed tooling matrix to 49 files, each assigned exactly once: foundation
(11), acceptance (13), publication (9) and delivery (16). Historical 46-file inventories remain readable. Gate tests
remain a separate mandatory command. The foundation shard installs its own pinned Chrome for Mermaid renderer tests and
uses the Ubuntu runner's Chrome profile; the checks worker separately renders the actual repository diagrams. The
delivery shard installs pinned Terraform and initializes provider fixtures on its own runner, without credentials or a
live backend. It cannot depend on another runner's installations. The original credential-free Terraform validation
remains in linter checks too.

The ordinary actionlint wrapper checks every tracked workflow YAML file. Before new files are staged, validate them
explicitly with the checksum-verified pinned executable; an untracked file is not covered by the ordinary wrapper.

The acceptance lane delegates to [run-ci-phase.mjs](../../scripts/run-ci-phase.mjs), retaining phase monotonicity,
trusted suite extraction, candidate controls, browser preparation, E2E identity and cleanup. Only an admitted CI run
with the complete committed split-workflow policy delegates host builds and unit tests to the application/server lanes.
Local and historical two-job controller runs retain all original checks. There is no caller-selectable skip mode; all
four lanes remain mandatory for merge and publication. Docker image compilation remains part of acceptance's real image
build and does not repeat a host unit-test invocation.

The frontend lane runs Node response-service unit tests in `frontend/tests/`. They import application helpers and check
valid counts, malformed success values and useful error text; they are post-implementation regression coverage. They do
not mount React components or exercise a browser. The separate frozen acceptance package imports no application code and
uses independent fixtures against the running application. Its 72 required local Playwright cases include direct HTTP
tests and Chromium tests for accessible controls, real upload/results, pending-state duplicate prevention,
errors/retries, controlled API outages and offline Redoc/CSP. These suites cover different boundaries, so both remain
required.

The backend refactor localizes backend units in `server/tests/` and frontend units in `frontend/tests/`. Each lane
builds its application once through the root pinned toolchain, then invokes Node with an explicit owned test list from
that application's directory. There are no tests left in a shared product-unit directory. Source checks include both
application test directories. Independent acceptance remains in `tests/acceptance/`; tooling policy tests remain in
`scripts/`. The shared root lockfile is intentional, with the acceptance package retaining its independent lockfile.

The independently specified source/dependency prerequisite merged through PR #62 at
`e1616c52a3a0a777216678dc76403d293471a783`, preserving the other three shards and their job identities. It requires
strict application/test typechecking, actual source lint, same-app OpenAPI generation and semantic validation.
Historical source inventories remain readable; adopting the new layout cannot be undone by deleting tests or changing
directories. This prerequisite wiring alone did not bind the new audio-count/error acceptance contract or establish
product CI success. The independently authored successor was later bound through PR #66; actual product and descendant
checks are recorded separately in the
[merge and publication record](../validation/backend-audio-refactor.md#product-merge-publication-and-freeze).

Release bundle preparation and upload remain on the single acceptance runner, where the exact tested Docker image IDs
exist. The existing publisher consumes that same-run artifact only after the terminal gate succeeds; it does not rebuild
images. Workflow outputs preserve release readiness, artifact name and admission digest. Software releases continue
independently of deployment. Stage delivery remains gated by repository settings and is intentionally paused; production
still requires its existing human authorization. No cloud resource or credential changes belong to this CI activation.

For focused local checks after installing pinned dependencies:

```sh
node scripts/run-ci-lane.mjs application
node scripts/run-ci-lane.mjs server
CI_TOOLING_SHARD=foundation node scripts/run-tooling-shard.mjs
```

These commands require the actual committed acceptance history and validate its authority; they cannot claim CI
admission locally. `node scripts/run-ci-lane.mjs acceptance` runs the complete controller locally and needs the normal
Docker/browser prerequisites. Unknown lane/shard names or extra arguments fail instead of selecting less work.

`npm run test:server` and `npm run test:frontend` execute localized units without claiming acceptance admission. The
normal acceptance lane resolves the bound independent successor. Actual binding, the product merge's passing validation
checks and its failed publisher are recorded separately in the
[merge and publication record](../validation/backend-audio-refactor.md#product-merge-publication-and-freeze). The
`v0.4.66` checkpoint records the descendant's successful required main checks and verified publication. Future sources
still require their own checks and publication evidence.

See [independent acceptance](independence-and-baseline.md), [acceptance transitions](acceptance-transition.md) and the
[release process](../requirements/release-process.md) for the underlying evidence and publication boundaries.
