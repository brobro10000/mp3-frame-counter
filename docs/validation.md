# Foundation validation evidence

This document records the original foundation validation snapshot. The owner's 2026-10-09 review-policy amendment
supersedes its original no-bypass configuration: see [current repository controls](repository-controls.md). The retained
orchestrator results were not regenerated for that amendment or the script documentation changes. Current CI and
read-only verification results are recorded on [PR 1](https://github.com/brobro10000/mp3-frame-counter/pull/1).

The installed MVP Orchestrator **1.3.0** was used from its existing cache without upgrading or editing its source. The
custom route contains definition, system, bootstrap, bounded plan, prompt, execution and validation, with exactly one
implementation phase. It does not invoke readiness or a shipping operation. Explicit Git/GitHub operations stop at an
open PR; an end-to-end shipping workflow has not completed.

## Commands and observations

| Command                       | Observed result                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                      | Reproduced the lockfile; two development dependencies installed; audit reported zero vulnerabilities.                 |
| `npm run validate`            | Prettier, actionlint 1.7.12, repository policy and all 13 gate cases passed.                                          |
| `npm run artifact:foundation` | Created a tracked-source archive, commit identifier and matching SHA-256 checksum locally. No upload.                 |
| `npm run verify:github`       | Effective rules and settings matched; successful bound gate; PR required review and was blocked; PR delivery skipped. |
| `git diff --cached --check`   | No whitespace errors.                                                                                                 |

The gate tests execute `scripts/ci-gate.mjs` with one successful result and negative cases for failure, cancellation,
skipping, pending, neutral, empty, missing, extra, malformed and absent inputs. These are synthetic local tests also run
by CI; they do not claim live cancelled or deliberately failed upstream GitHub jobs.

The initial local archive inspection used commit `0b1d959b66f5cbe4e51a559ed138e00e26146146`: 35 tracked files and a
matching SHA-256 checksum. A root-directory assertion in the inspection was corrected to account for tar's root entry;
the archive contents were then successfully inspected. The source archive excludes the supplied MP3, `.git`, untracked
files, installed dependencies and caches. It is not a deployable application.

Independent review identified upload-artifact's hidden-directory exclusion. The workflow now explicitly allows hidden
files only within its generated `.artifacts/*` input, and repository policy validates that setting.

## Direct orchestrator validation

These are installed specialist scripts, invoked with the explicit project root; no private implementation is copied into
this repository. The router re-runs the specialist validators when accepting and revisiting recorded results.

- `define-mvp/scripts/validate_mvp_spec.py --input agents/specs/mvp.md --json`
- `specify-system/scripts/validate_invariants.py --json`
- `specify-system/scripts/validate_traceability.py --json`
- `bootstrap-ai-project/scripts/validate_generated_project.py --context agents/context/bootstrap.json --json`
- `plan-mvp-phases/scripts/validate_ownership.py --context agents/context/planning.json --json`
- `expand-phase-prompt/scripts/validate_prompt_contract.py --phase-id phase-01-repository-foundation --delta agents/context/phase-01-delta.json --json`
- `execute-mvp-phase/scripts/validate_phase_gate.py --phase-id phase-01-repository-foundation --delta agents/context/phase-01-delta.json --json`
- `validate-ai-project/scripts/validate_control_plane.py --bootstrap-context agents/context/bootstrap.json --phase-delta phase-01-repository-foundation=agents/context/phase-01-delta.json --json`

Planning and application used the installed tools' returned target identities. Phase completion concerns this bounded
foundation's validation and open PR only; it grants no permission to merge or execute another phase. Retained direct
results are under `agents/outputs/`; local orchestration scratch files remain ignored.

## Remote evidence and limits

Discovery CI succeeded for `0b1d959b66f5cbe4e51a559ed138e00e26146146`:
[run 37965805668](https://github.com/brobro10000/mp3-frame-counter/actions/runs/37965805668). It established the real
`control-plane` check and `github-actions` integration ID 15368. Later revisions must pass their own runs; consult
[PR 1](https://github.com/brobro10000/mp3-frame-counter/pull/1) and rerun the current-head verifier.

Originally configured and read back: private repository, `main`, one active ruleset, one independent approval, stale
dismissal, latest-push approval, resolved conversations, strict CI, no bypasses, no force pushes or deletion, linear
history, squash-only merge, branch deletion after merge, disabled auto-merge, read-only Actions and disabled Actions
approvals. No plan or credential blocker was observed. No destructive probe, merge or approval was attempted.

Delivery is configured and statically validated; its packaging was inspected locally. Delivery has **not executed on
main**. There is no application typecheck, parser test, endpoint integration test, production build or deployment.

At setup, the remaining human prerequisite was an independent eligible reviewer: `brobro10000` authored and pushed the
PR and cannot approve it. No other collaborator was present, and no invitation or code-owner gate was added. The later
owner-authorized exception now permits an explicit PR-only review override while preserving core controls. The PR
remains open; configuration of that exception does not approve or merge it.
