# Repository merge controls

Target: private `brobro10000/mp3-frame-counter`, default branch `main`. On 2026-10-09 the owner authorized a review
override because an eligible reviewer was unavailable at that time. A dedicated automated companion, `brobro1000`, now
provides eligible exact-commit GitHub reviews when explicitly requested and its checks pass. The owner exception remains
configured; no rules were changed for V1 closure. Automated review is not independent human review.

Administrative setup applies settings outside CI. The versioned ruleset files are documentation and read-only audit
inputs; a pull request never applies them automatically.

## Effective policy

Two active branch rulesets target exactly `refs/heads/main`. GitHub combines their requirements.

| Ruleset                                 | Versioned definition                       | Bypass policy                                         |
| --------------------------------------- | ------------------------------------------ | ----------------------------------------------------- |
| `main-pull-request-controls` (24803567) | [main-ruleset.json](main-ruleset.json)     | No bypass actors.                                     |
| `main-review-approval` (24804693)       | [review-ruleset.json](review-ruleset.json) | Only user `brobro10000` (82611798), during PR merges. |

The core ruleset requires a PR, resolved review conversations, the observed `control-plane` check from GitHub App 15368
and strict up-to-date status checks. It blocks deletion and non-fast-forward updates, requires linear history and
permits squash merges only. Its approval count is zero because approvals belong to the separate review ruleset. No
owner, administrator, app or automation can bypass these core rules through the configured bypass lists.

The review ruleset requires one eligible independent approval, dismisses stale approvals, requires approval of the most
recent reviewable push by someone other than its pusher, and retains extra approval for unattributed changes. Its
exception names one individual user, not an administrator role. It permits that user to bypass review requirements only
while merging a PR; it does not permit direct pushes. The exception covers that user's merges of any PR to main, not
only PRs they authored. Other users remain subject to the review requirements.

Repository settings allow squash merging only, disable auto-merge and delete merged branches automatically. There is no
blanket update restriction. Administrators can still edit repository settings; these controls are not immutable against
the owner.

Actions are enabled with SHA pinning required, default read-only permissions and permission to create/approve PRs
disabled. The validation workflow explicitly grants only `contents: read`, uses no repository-admin credentials or
deployment secrets, and does not use `pull_request_target`. Checkout credentials are not persisted.

## Companion review

The Docker companion is maintained in the private
[companion-reviewer repository](https://github.com/brobro10000/companion-reviewer), including setup, isolation,
credential recovery and approval checks. It uses a separate GitHub identity, inspects the exact PR source and only
publishes a qualifying approval after fresh CI, conversation and protection checks. It never merges. The owner granted
collaborator access; no code-owner gate was added.

For PR #5, [review 5477487545](https://github.com/brobro10000/mp3-frame-counter/pull/5#pullrequestreview-5477487545)
approved head `8f41b9f` as `brobro1000`; GitHub reported `APPROVED` and `CLEAN` before the owner merged it. New commits
require fresh review. The [V1 closure](validation/v1-closure.md) records the subsequent merge and release.

## Using the owner's override

GitHub does not allow authors to approve their own PRs. The configured exception allows an explicit merge override
instead. When signed in as `brobro10000`:

1. Open or refresh the PR and review its changes.
2. Ensure CI has passed, the branch is up to date and all review conversations are resolved.
3. Select **Merge without waiting for requirements to be met (bypass rules)** in the merge section.
4. Choose **Squash and merge**, then confirm when ready to merge.

The checkbox was observed enabled and unchecked on PR 1 after configuration. It was not selected and no merge was
attempted. The broad checkbox label does not grant a bypass of the separate core ruleset.

CODEOWNERS remains deferred: naming the sole owner would not create an eligible independent reviewer. The later
companion collaborator enables the normal approval path; it does not change CODEOWNERS or remove the explicit owner
exception. Agents must not exercise the override, approve, merge or enable auto-merge without a separate explicit
instruction.

## Safe read-only verification

Run from the checkout with GitHub CLI authenticated as `brobro10000`; never print or save credentials:

The commands below describe this repository. The reusable audit discovers its repository and current branch from the
checkout, or accepts `--repo OWNER/REPO --pr NUMBER`. It reads desired controls from the two versioned JSON files and
verifies the configured review actor against the actual personal repository owner. See [portability](portability.md)
before adapting the configuration for a fork.

```sh
npm run verify:github
gh api repos/brobro10000/mp3-frame-counter/rulesets/24803567
gh api repos/brobro10000/mp3-frame-counter/rulesets/24804693
gh api repos/brobro10000/mp3-frame-counter/rules/branches/main
gh api repos/brobro10000/mp3-frame-counter/actions/permissions
gh api repos/brobro10000/mp3-frame-counter/actions/permissions/workflow
gh pr view --repo brobro10000/mp3-frame-counter --json headRefOid,reviewDecision,mergeStateStatus,statusCheckRollup
```

The first successful run observed `control-plane` from the `github-actions` App, integration ID **15368**, on commit
`0b1d959b66f5cbe4e51a559ed138e00e26146146` in
[run 37965805668](https://github.com/brobro10000/mp3-frame-counter/actions/runs/37965805668). That observed identity was
then added to the active ruleset with strict up-to-date enforcement. The binding remains in the core ruleset.

Always verify the current head, not the earlier discovery revision. The verifier rejects missing protections, a wrong CI
integration, absent current-revision success or an incorrectly scoped owner exception. It checks that the current user
cannot bypass the core ruleset and can bypass the review ruleset only through PRs. It also rejects additional effective
main rulesets or classic protection that could obstruct that exception. It uses only read-only API requests and local
Git reads.

An unapproved PR can report `REVIEW_REQUIRED` and `BLOCKED` until it receives an eligible approval or the owner
explicitly chooses the configured exception. Those statuses do not by themselves establish readiness or remove other
requirements. The current read-only audit accepts the exact open-PR head or protected-main head and verifies the
corresponding successful CI run. It no longer assumes the original foundation PR remains open.

## Application-release audit limitation

The optional `npm run verify:github` helper currently requires `deliver-foundation` to succeed in protected-main mode.
The application-release workflow deliberately skips that job and runs `publish-release` instead. Therefore the helper
can reject an otherwise successful application main run at its delivery assertion. This is a known read-only audit
limitation, not a release gate: CI and the publisher do not invoke this helper. PR-head auditing remains supported.

Until the helper is adapted and independently reviewed, verify application main runs directly: all mandatory jobs and
`publish-release` must succeed for the exact merged SHA, and the release tag/assets/provenance must match the
[release-only process](deployment/release-only.md). Do not describe the helper's failure as a deployment or publication
failure without inspecting those actual results. This documentation audit does not modify the helper or weaken gates.

Private branch rules require an eligible GitHub plan. Ruleset creation and effective-rule readback succeeded here; there
was no observed plan or credential restriction. No forced push, branch deletion or merge attempt is used as a test of
enforcement.

Sources:
[individual-user bypass support](https://github.blog/changelog/2026-05-07-repository-rulesets-user-bypass-and-branch-renaming/),
[ruleset bypass API](https://docs.github.com/en/rest/repos/rules#create-a-repository-ruleset),
[combined ruleset enforcement](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets#about-rule-layering),
and
[required review eligibility](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews).
