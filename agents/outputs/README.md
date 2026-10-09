# Foundation evidence and orchestration limitation

Installed MVP Orchestrator version: **1.3.0**. Its specialist phase gate and project validator passed with the
documented Node/npm toolchain and existing GitHub authentication. The specialist recorded the one foundation phase
as complete. This means the foundation implementation and open PR were validated; approval, merge, main delivery
and application readiness remain outside that completion claim.

The higher-level router is **blocked**, not complete. It replays validators using an environment containing only
`LANG`, `LC_ALL`, `PYTHONDONTWRITEBYTECODE`, `PYTHONNOUSERSITE` and `TZ`. The project's direct Python adapter invokes
npm and the read-only GitHub verifier. Under that stripped environment, it fails with
`FileNotFoundError: No such file or directory: 'npm'`. The router correctly rejects the different observation.

No plugin code, environment-isolation contract or validation evidence was altered to manufacture acceptance.
The actual blocked provider observation was submitted to the installed router and its rendered summary remains
blocked at `phase.execution`. The independently requested read-only `validate-ai-project` check passed in the normal
configured environment; it was not falsely recorded as a completed router task.

| File | Evidence scope |
| --- | --- |
| `foundation-validation.json` | Actual installed completed-phase validator output in the configured environment. |
| `control-plane-validation.json` | Actual direct project validation: all six checks validated. |
| `github-verification.json` | Read-only GitHub snapshot for the explicitly recorded PR commit and run. |
| `router-provider-blocker.json` | Actual blocked output under the router's stripped environment. |
| `orchestration.md` | Installed router's rendered blocked state. |

These records are snapshots, not authorization or a substitute for current checks. The final evidence-only commit
must have its own successful CI run and current-head GitHub verification; those links are recorded in the PR body
and handoff. The evidence files are outside the phase's hashed implementation paths, so retaining them does not
change the implementation observation.

The installed orchestration skill says: "Stop on malformed or unsafe input, an unknown or unavailable capability,
plan/state/result disagreement, failed or blocked direct validation, unresolved dependencies, secret-like content,
or any request for hidden external work." This phase stops with that routing limitation explicitly recorded.
Resolving router replay would require a separately reviewed environment-compatible validation arrangement; the
plugin was neither upgraded nor modified during this run.

No end-to-end shipping operation, merge, auto-merge, PR approval or next application phase was performed.
