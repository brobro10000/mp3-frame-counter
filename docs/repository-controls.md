# Repository merge controls

Target: private `brobro10000/mp3-frame-counter`, default branch `main`. The versioned desired ruleset is
[`main-ruleset.json`](main-ruleset.json). Administrative setup applies settings outside CI; the JSON is documentation
and audit input, never automatically applied by a pull request.

## Required policy

One active branch ruleset targets exactly `refs/heads/main`, with no bypass actors. Require a PR, one eligible
independent approval, stale-review dismissal, approval of the most recent reviewable push by someone other than its
pusher, and resolved review threads. Require the observed `control-plane` check from its observed GitHub App, with
strict up-to-date status checks. Block deletion and non-fast-forward updates, and require linear history.

Repository settings allow squash merging only, disable auto-merge and delete merged branches automatically. Do not add a
blanket update restriction. No owner, administrator, app or automation receives a bypass. Administrators can still edit
repository settings; this policy is not immutable against its owner.

Actions are enabled with SHA pinning required, default read-only permissions and permission to create/approve PRs
disabled. The validation workflow explicitly grants only `contents: read`, uses no repository-admin credentials or
deployment secrets, and does not use `pull_request_target`. Checkout credentials are not persisted.

## Review eligibility

The authenticated PR author and initial pusher is `brobro10000`. GitHub does not allow PR authors to approve their own
PRs. At setup, the collaborator API returned only that owner. An independent eligible reviewer with sufficient
repository access is therefore unavailable. Commit author names and email addresses cannot change this fact.

CODEOWNERS is deliberately deferred: naming the sole owner would not create an eligible independent reviewer. No
additional code-owner gate is enabled, and the mandatory one-review rule is preserved. No collaborator is invited by
this phase. The human owner must arrange eligible access separately before a later merge.

## Safe read-only verification

Run from the checkout using existing GitHub CLI authentication; never print or save credentials:

```sh
npm run verify:github
gh api repos/brobro10000/mp3-frame-counter/rulesets/24803567
gh api repos/brobro10000/mp3-frame-counter/rules/branches/main
gh api repos/brobro10000/mp3-frame-counter/actions/permissions
gh api repos/brobro10000/mp3-frame-counter/actions/permissions/workflow
gh pr view --repo brobro10000/mp3-frame-counter --json headRefOid,reviewDecision,mergeStateStatus,statusCheckRollup
```

Verify the check's integration against actual check-runs for the PR's current head, not a guessed App ID or an older
green revision. Before the first observed run, the status rule is intentionally absent from the discovery snapshot; the
final setup must add the observed binding and pass `verify:github` before claiming enforcement is complete. The verifier
fails if the status rule is absent. It makes only GET requests and local Git reads.

Private branch rules require an eligible GitHub plan. This repository's ruleset creation and effective-rule readback
succeeded; there was no observed plan or credential restriction. Do not infer the account's subscription name from that
observation.

No forced push, branch deletion or merge attempt is used as a test. A ready-for-review PR with successful current
checks, `REVIEW_REQUIRED` and `BLOCKED` provides the non-destructive approval-blocking evidence.

Sources:
[GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches),
[approving required reviews](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews),
and
[ruleset availability](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets).
