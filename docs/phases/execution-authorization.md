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

Phase completion and deployment evidence will be recorded separately in `docs/validation/`. This authorization record
does not itself claim that any implementation phase, release or automated deployment has completed.
