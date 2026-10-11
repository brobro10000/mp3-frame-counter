# Visible CI lanes

The activation separates ordinary CI into four reusable workflows in the same run. It requires the protected merge of
the dormant CI visibility policy first. Preparing these files does not establish that merge or a successful live run.

| Caller                | Reusable workflow                                                      | Mandatory work                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `validate-foundation` | [Linter](../../.github/workflows/linter.yml)                           | Formatting, workflow/policy/portability/Mermaid/gate checks, plus four tooling shards.                                             |
| `validate-product`    | [Base acceptance E2E](../../.github/workflows/base-acceptance-e2e.yml) | The unchanged phase controller, frozen acceptance and real application lifecycle; exact tested images and same-run release export. |
| `application-tests`   | [Application tests](../../.github/workflows/application-tests.yml)     | Strict frontend build and the response-contract unit tests.                                                                        |
| `server-tests`        | [Server tests](../../.github/workflows/server-tests.yml)               | Server/docs build and all four parser, HTTP, docs routing and docs-build unit files.                                               |

Every executing worker performs the original trusted-base admission preflight before installing or running head-owned
code. The unconditional `control-plane` job requires success from all four callers; failure, cancellation, missing or
skipped work blocks it. Reusable calls introduce no path filters, optional acceptance or separate release-event trust.

The linter's closed tooling matrix assigns every existing tooling file exactly once: foundation (8), acceptance (13),
publication (9) and delivery (16). Gate tests remain a separate mandatory command. The delivery shard installs pinned
Terraform and initializes provider fixtures on its own runner, without credentials or a live backend. It cannot depend
on another runner's installations. The original credential-free Terraform validation remains in linter checks too.

The ordinary actionlint wrapper checks every tracked workflow YAML file. Before new files are staged, validate them
explicitly with the checksum-verified pinned executable; an untracked file is not covered by the ordinary wrapper.

The acceptance lane delegates to [run-ci-phase.mjs](../../scripts/run-ci-phase.mjs), retaining phase monotonicity,
trusted suite extraction, candidate controls, browser preparation, E2E identity and cleanup. This intentionally repeats
unit tests/builds already visible in the new application/server lanes. The small visibility change preserves that
controller; deduplicating its work would require a separately reviewed change. The new unit lane is post-implementation
regression coverage, not evidence that these frontend tests preceded product development.

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
admission locally. `node scripts/run-ci-lane.mjs acceptance` runs the complete existing controller and needs the normal
Docker/browser prerequisites. Unknown lane/shard names or extra arguments fail instead of selecting less work.

See [independent acceptance](independence-and-baseline.md), [acceptance transitions](acceptance-transition.md) and the
[release process](../requirements/release-process.md) for the underlying evidence and publication boundaries.
