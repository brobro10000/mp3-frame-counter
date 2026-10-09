# Foundation evidence and orchestration limitation

This page and its result files describe the original foundation run. V1 planning results are recorded separately in
`docs/validation/v1-planning.md`; original contract bytes are preserved under `agents/history/foundation/`. The unified
proposal awaits reviewed metadata inputs and does not invoke the old execution adapter or resolve its environment
limitation. The prior three-phase draft and its validation summary are archived under `agents/history/v1-draft/`.

## Privacy redaction

At the user's request, the top-level `/project_root` values in `foundation-validation.json`,
`control-plane-validation.json` and `router-provider-blocker.json` have been replaced with `.` to remove the
original machine's absolute checkout directory. These are sanitized historical copies, not verbatim tool outputs.
`privacy-redactions.json` records the exact field changes and original/sanitized file checksums. Results, errors,
commands and embedded hashes were not changed, and no validator was rerun to create these redacted copies.

Embedded report, observation and snapshot hashes still refer to their original historical observations. They do
not authenticate the sanitized file bytes or certify the current checkout. Earlier commits retain the original
copies; no Git history rewrite was performed. Any future evidence export must use repository-relative paths or
explicitly documented privacy redaction before it is committed.

These are historical outputs from the original foundation snapshot. The owner's 2026-10-09 review-policy amendment
is recorded in `AGENTS.md` and `docs/repository-controls.md`; it supersedes the no-bypass review policy in these
snapshots. Script documentation and the amendment changed hashed inputs. These outputs were not regenerated and
do not certify those later revisions; use current CI and the read-only GitHub verifier for current evidence.

Installed MVP Orchestrator version: **1.3.0**. Its specialist phase gate and project validator passed with the
documented Node/npm toolchain and existing GitHub authentication. The specialist recorded the one foundation phase
as complete. This means the foundation implementation and open PR were validated; approval, merge, main delivery
and application readiness remain outside that completion claim.

The higher-level router is **blocked**, not complete. It replays validators using an environment containing only
`LANG`, `LC_ALL`, `PYTHONDONTWRITEBYTECODE`, `PYTHONNOUSERSITE` and `TZ`. The project's direct Python adapter invokes
npm and the read-only GitHub verifier. Under that stripped environment, the original adapter failed with
`FileNotFoundError: No such file or directory: 'npm'`. The router correctly rejected the different observation.
The current adapter reports missing tools and bounded timeouts in failed JSON results; this improves diagnostics
but does not supply the stripped environment's missing tools or claim that router replay has been resolved.

No plugin code, environment-isolation contract or validation evidence was altered to manufacture acceptance.
The actual blocked provider observation was submitted to the installed router and its rendered summary remains
blocked at `phase.execution`. The independently requested read-only `validate-ai-project` check passed in the normal
configured environment; it was not falsely recorded as a completed router task.

| File | Evidence scope |
| --- | --- |
| `foundation-validation.json` | Sanitized historical completed-phase validator output in the configured environment. |
| `control-plane-validation.json` | Sanitized historical project validation: all six checks validated. |
| `github-verification.json` | Read-only GitHub snapshot for the explicitly recorded PR commit and run. |
| `router-provider-blocker.json` | Sanitized historical blocked output under the router's stripped environment. |
| `privacy-redactions.json` | Redacted fields and original/sanitized file checksums; no new validation claim. |
| `orchestration.md` | Installed router's rendered blocked state. |

These records are snapshots, not authorization or a substitute for current checks. Every later commit needs its own
successful CI run and current-head GitHub verification; those links are recorded in the PR body and handoff.
Retaining these historical outputs does not imply that later changes match their hashed implementation paths.

The installed orchestration skill says: "Stop on malformed or unsafe input, an unknown or unavailable capability,
plan/state/result disagreement, failed or blocked direct validation, unresolved dependencies, secret-like content,
or any request for hidden external work." This phase stops with that routing limitation explicitly recorded.
Resolving router replay would require a separately reviewed environment-compatible validation arrangement; the
plugin was neither upgraded nor modified during this run.

No end-to-end shipping operation, merge, auto-merge, PR approval or next application phase was performed.
