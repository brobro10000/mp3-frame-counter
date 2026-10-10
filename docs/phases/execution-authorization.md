# Execution authorization and evidence

On 2026-10-09, after planning PR #2 merged at `0c9f538`, the owner instructed Codex to execute all defined MVP phases,
complete each phase, verify automated deployment, run required shell commands, modify the UI and preload deployment
access while 1Password was unlocked. The owner requested unattended progress.

This instruction supersedes the earlier P0-only authorization and separate permission before starting each phase. P1–P5
remain ordered dependencies with distinct evidence and independent review. Agent review is identified as agent review;
it is not represented as a GitHub human approval. Passing checks never fabricate a deployment or oracle result.

The implementation follows the merged requirements and acceptance contract. Routine implementation and tool choices are
delegated to the executing agent. Account access, actual charges, release identities and production verification must
still be established from evidence. Missing external access blocks the affected operation, not unrelated local work.
Existing repository core protections and the owner's review exception remain intact.

## Work ownership

| Work                      | Owner                         | Dependencies                       | Owned paths                                            | Validation                                            |
| ------------------------- | ----------------------------- | ---------------------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| Authority and integration | Root                          | Merged planning baseline           | Active agents metadata, root tooling, integration docs | Installed metadata validators and cross-phase checks  |
| P1 foundation             | Foundation agent              | Merged baseline                    | scripts/, .github/, P1 evidence                        | Tooling/gate tests and live read-only GitHub audit    |
| Deployment preflight      | Access agent                  | Owner's deployment instruction     | Ignored scratch only                                   | Scoped session, account and runtime observations      |
| P2 acceptance             | Independent acceptance author | Reviewed P1 before executable work | tests/acceptance/, contract and P2/sample evidence     | Oracle, harness negative controls and baseline hashes |

Implementation agents cannot modify the frozen acceptance suite or gate logic. Any supported amendment returns to its
independent author and receives a separately recorded review. Later component ownership is assigned only after these
dependencies pass.

P3 was independently reviewed and locally validated at `f7ad2f5`. P4 proceeds provisionally against the unchanged local
P2 baseline; shipping CI still requires its separate protected-main merge. The additional exclusive assignments are:

| Work           | Owner                              | Owned paths                                                          | Validation                                                   |
| -------------- | ---------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| P3 parser      | Parser implementer                 | Parser/errors modules, parser unit tests, P3 evidence                | Frozen fixture matrix, unit/build, independent review        |
| P4 native API  | Parser implementer                 | HTTP/entrypoint modules, HTTP unit tests, API evidence               | Actual HTTP and lifecycle tests                              |
| P4 frontend    | Frontend implementer               | frontend/, frontend evidence                                         | Isolated image build, browser and ingress acceptance         |
| P4 controller  | Independent foundation/gate author | E2E lifecycle scripts/tests and controller evidence                  | Authentication, lifecycle failure, real frozen suite         |
| P4 integration | Root                               | API Dockerfile, Compose, Makefile, root tooling and integration docs | Independent clean builds, complete AC-01–12, resource review |

Phase completion and deployment evidence will be recorded separately in `docs/validation/`. This authorization record
does not itself claim that any implementation phase, release or automated deployment has completed.

The subsequent [execution status](../validation/execution-status.md) records the clean P4 result at `2adf71b`: 60/60
external cases and 75 unit cases passed. Local P5 preparation is assigned to the independent foundation/gate author
(`scripts/release-manifest.mjs`, `scripts/prepare-release.mjs`, their focused tests and preparation evidence); root owns
command wiring and central status. A separate reviewer checks release identity and failure handling before execution.
Provider actions, successful release publication and recovery remain distinct unexecuted work.

## Later amendment: releases without deployment

On 2026-10-09 the owner deferred deployment and requested releases without deploying; the exact instruction is retained
as [SRC-RELEASE-ONLY](../requirements/sources/release-only-request.txt). This narrows the active P5 completion boundary
to protected-main validation and GitHub publication of the exact tested artifacts. It does not authorize merges, review
overrides, auto-merge, provider actions or a manual release from a feature branch.

The independent foundation/gate author owns the main-only publisher, workflow and focused tests. Root owns command
wiring, requirements/status integration and the PR handoff. A separate reviewer examines release identity, least
privilege and retry behavior. Frozen acceptance expectations remain unchanged. Deployment criteria and prior
observations remain recorded as deferred work, without claiming their completion.
