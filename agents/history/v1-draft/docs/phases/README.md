# V1 phase entrypoint

Current authorization: **planning only**. The next eligible implementation request is Phase 1; no V1 phase has been
executed or accepted. Repository foundation PR #1 is already merged and is evidence to reuse within Phase 1.

Read [the MVP contract](../mvp.md), [architecture](../architecture/v1.md), the selected phase and the appropriate role:
[implementer](../agents/implementer.md) or [reviewer](../agents/reviewer.md). These role files must be loaded
explicitly.

The canonical machine plan is `agents/execution/mvp-plan.yaml`; these documents explain its scope and acceptance. Do not
maintain a second execution-state ledger here. The historical foundation execution state is archived. V1's canonical
execution state is created only by the installed executor during a later authorized phase, not by planning.

| Order | Canonical phase                    | Review document                                              | Depends on                                                                                           |
| ----- | ---------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 1     | phase-01-v1-foundation-baseline    | [Foundation and baseline](01-foundation-and-baseline.md)     | Reviewed planning documents and explicit Phase 1 authorization.                                      |
| 2     | phase-02-v1-parser                 | [Standalone parser](02-parser.md)                            | Phase 1 accepted and explicit Phase 2 authorization.                                                 |
| 3     | phase-03-v1-integration-containers | [End-to-end and containers](03-end-to-end-and-containers.md) | Phase 2 accepted and explicit Phase 3 authorization; resolve release prerequisites before that work. |

Each phase ends at its scoped PR and evidence report when those remote actions are authorized. Local validation,
current-revision CI, review, merge and successful main delivery are distinct observations. Stop between phases even
after every check passes. Never create a PR, merge or administer GitHub as a side effect of this planning task.

## Suggested next request

> Execute Phase 1 only using the installed MVP Orchestrator and `docs/phases/01-foundation-and-baseline.md`. Reuse the
> merged foundation, establish the actual MediaInfo baseline, refresh the foundation-only audit assumptions and review
> the fixed-command validation adapter. Create a scoped branch and PR with actual evidence when checks pass. Stop before
> parser, HTTP/UI, container implementation, merge or Phase 2. Report missing host tools instead of installing packages
> without authorization.

This text is a suggested future authorization, not an instruction to execute now.
