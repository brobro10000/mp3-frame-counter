# Portability and privacy

The shared foundation must validate from a fresh clone, regardless of the checkout's directory name or a developer's
home directory. `APP-EVAL-004` (repeatable tooling), `APP-EVAL-007` (Git use) and `APP-EVAL-008` (structured approach)
in the [requirements registry](requirements/assessment.md) motivate these foundation controls; they do not establish
application correctness.

## Fresh-clone prerequisites

Install the Node.js and npm versions pinned in `.nvmrc` and `package.json`, plus Git and `tar`. macOS and Linux on x64
and arm64 are supported by the pinned actionlint wrapper. Native Windows validation is not supported; use a supported
Linux environment such as WSL. Internet access to the npm registry and GitHub releases is needed for the first
dependency installation and actionlint download.

From the checkout root:

```sh
npm ci
npm run validate
npm run artifact:foundation
```

Ordinary validation requires no GitHub CLI login, private MVP plugin, personal shell configuration, preexisting cache or
sample MP3. The sample is intentionally local and ignored. Generated caches and source artifacts stay beneath the
checkout. Version pins are shared reproducibility requirements, not references to a local runtime installation.

`npm run validate` includes the tracked-content portability guard, terminal-gate tests and offline tooling tests. The
portability tests create a temporary Git checkout in a path containing spaces and verify that local-path leaks fail
without echoing the private contents. This is a targeted path check, not a comprehensive secret scanner.

## Reusing the repository controls

The optional authenticated audit is separate from ordinary validation:

```sh
npm run verify:github
npm run verify:github -- --repo OWNER/REPO --pr 1
```

Without overrides, GitHub CLI resolves the repository from its checkout context and Git supplies the current branch. An
explicit PR number also supports detached checkouts. The protected branch comes from the versioned ruleset targets;
repository and actor identity are checked against the GitHub API, not a hardcoded developer login in the script.

`docs/main-ruleset.json` and `docs/review-ruleset.json` describe this repository's desired controls. A fork must
explicitly adapt its own policy configuration and configure GitHub separately. In particular, the review exception must
name the actual personal repository owner; the audit will reject a copied exception naming someone else. It never grants
a bypass, modifies GitHub or copies permissions automatically. The offline policy checks the actor's shape and scope;
only the authenticated audit can prove the configured actor is the live owner.

The current policy intentionally uses private ownership, `main`, squash merges and this foundation workflow. To change
those conventions, update the related workflow, policy assertions, rulesets and documentation together. The audit is
still phase-specific: it expects an open owner-authored PR with passing CI, ordinary approval requirements outstanding,
and no protected-branch delivery run. It is not a general audit of a finished application or an organization repository.

The optional Python orchestrator adapter inherits tools and authentication from its caller. It does not search anyone's
home directory. `--timeout-seconds` accepts 1-600 seconds per command, defaulting to 300; missing tools and timeouts
return failed JSON. The historical stripped-environment router limitation remains unresolved.

## Keeping local information out

Use repository-relative references in documents and evidence. Resolve temporary directories, executable locations and
checkout paths at runtime. Editor state, dependencies, caches, local orchestration files, MP3 inputs and secrets remain
ignored. Do not paste raw tool output containing machine paths into tracked reports.

`npm run check:portability` scans all tracked content, including formatter-excluded evidence and source captures, for
recognizable home directories, Windows drive paths, local file URLs and common machine-local install/cache paths.
Diagnostics identify only the repository-relative file, line and category. New path conventions can be added with
positive and negative cases in `scripts/portability.test.mjs`.

Three historical reports had their `/project_root` field replaced with `.`. The
[redaction record](../agents/outputs/privacy-redactions.json) preserves original and sanitized file checksums; the
[evidence notes](../agents/outputs/README.md) explain the distinction from raw validation output. Historical outcomes
and embedded observation hashes were not recomputed. Supplied requirements sources and sample bytes were unchanged.

This cleanup applies to the current tracked content. Older Git commits still contain the original reports and Git
author/committer metadata. Purging that history would be a separate coordinated rewrite of published branches and
related references; no such rewrite or branch-protection change was performed.
