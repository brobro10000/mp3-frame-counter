# Mermaid validation and repair

Date: 2026-10-09. Scope: all repository Mermaid diagrams, including supplied planning views and archived documentation.
This evidence concerns diagram syntax and rendering, not application acceptance, deployment or human approval. It
supports APP-EVAL-004/008 and APP-V1-008/010 through repeatable tooling, documented evidence and mandatory CI.

## Diagnosis and correction

The previous workflow validated Markdown formatting but did not run a Mermaid parser or renderer. The original
[planning record](v1-planning.md#mermaid-boundary) correctly left independent rendering unverified; a successful display
connector response was insufficient evidence.

The four sequence diagrams contained five literal semicolons in message or note text. Mermaid treats semicolons as
statement separators; the
[official sequence syntax](https://mermaid.js.org/syntax/sequenceDiagram.html#entity-codes-to-escape-characters)
requires `#59;` when displaying a semicolon. The correction preserves the displayed wording and changes no architecture
or requirement. Semicolons inside quoted flowchart labels remain unchanged.

| Document                                                                       | Diagram count | Corrected sequence text        |
| ------------------------------------------------------------------------------ | ------------- | ------------------------------ |
| [Active architecture](../architecture/v1.md)                                   | 5             | Retry message and ingress note |
| [V1 supplied brief](../requirements/sources/v1-planning-brief.md)              | 3             | Oversize note                  |
| [Unified supplied brief](../requirements/sources/unified-planning-brief.md)    | 5             | Oversize note                  |
| [Archived architecture](../../agents/history/v1-draft/docs/architecture/v1.md) | 3             | Aborted-body note              |

## Reproduction

The original Git revision `0e8d4726c331a65d64911e713b814252ae62fcb6` was extracted with `git show` and passed through
Mermaid CLI 12.0.0, locked Mermaid 12.1.0 and Puppeteer 25.13.0 with Chrome 155.0.8059.39. Of 16 discovered diagrams, 12
rendered and all four sequence diagrams produced parser errors. The
[before-repair report](artifacts/mermaid-before.json) records every diagram location, source hash and actual error.

## Repeatable check

From a checkout using pinned Node 24.20.0/npm 11.19.0:

```sh
npm ci
npm run mermaid:install
npm run check:mermaid
node --test scripts/mermaid.test.mjs
npm run validate
```

`check:mermaid` discovers Git-tracked Markdown fences with CommonMark, including nested/tilde fences, and standalone
`.mmd`/`.mermaid` files. Stage new diagram documents before running it. It renders each diagram with the pinned official
CLI in sandboxed Chrome, blocks non-package resource requests, reports file/line diagnostics and fails on zero
discovery, missing tools, invalid diagrams or render failures. It writes SVGs and `result.json` to ignored
`.artifacts/mermaid/`. No source rewriting or syntax normalization hides errors.
[Toolchain setup](../toolchain.md#mermaid-rendering-tools) describes the explicit browser installation and Ubuntu
AppArmor profile.

The corrected documents produced **16/16 SVGs**, including all four sequence diagrams, with no parse/render failures.
The [after-repair report](artifacts/mermaid-after.json) records each tested source hash. All four sequence SVGs were
also opened as browser-rendered images and visually checked for participants, nested alternatives, responses and the
restored semicolon text. GitHub uses its own Mermaid version; this is concrete local renderer evidence, not a claim that
its hosted preview was inspected.

The mandatory `validate-foundation` job installs the pinned browser and runs `npm run validate`, which now includes both
diagram rendering and its regression checks. A diagram failure therefore fails the existing required `control-plane`
gate. The separate product ancestry/acceptance gate is unchanged. This does not make the current product PR merge-ready
while the independent acceptance baseline is absent from protected main.

## Executed checks and review

- `npm ci` reproduced the locked development dependency graph. Its four low-severity upstream findings are recorded in
  [toolchain notes](../toolchain.md#mermaid-rendering-tools).
- `npm run validate` passed formatting, workflow lint, policy, portability, 16/16 diagram renders and all **72**
  gate/tooling cases (20 terminal-gate cases and 52 tooling cases, including eight new Mermaid cases), with no failures
  or skips.
- The first broad pass exposed a machine-path-looking literal in the new negative test. The test now constructs its
  remote-host URL from a temporary fixture at runtime. The portability guard stayed unchanged; the complete rerun
  passed.
- `npm run typecheck`, `npm run build` and all **75** application unit tests passed after the clean dependency install.
  Product source and the frozen independent acceptance package were unchanged; full container E2E was not repeated for
  this documentation/tooling repair.
- Independent read-only review passed for the validator, negative controls, workflow/policy binding and original-byte
  preservation. Agent review is not GitHub human approval. Hosted results must be checked on the exact
  [PR #5 head](https://github.com/brobro10000/mp3-frame-counter/pull/5/checks), separately from these local
  observations.

## Provenance

The three supplied/archived originals are retained byte-for-byte as adjacent `.original.txt` captures. The existing
Markdown paths are clearly labeled rendering derivatives, preserving existing links. Their only changes are the
provenance banner and semicolon escapes. The [source register](../requirements/README.md#source-register) retains the
original checksums. The [archive manifest](../../agents/history/v1-draft/manifest.json) retains its original path, hash
and mode, with `captured_path` identifying the original architecture bytes. Verification of all 17 archive hashes and
modes passed; all three captures matched their pre-repair Git blobs exactly.

Raw `.original.txt` captures remain historical input, not executable diagram documents. Every corrected Markdown fence
is subject to validation, including historical and supplied views; no invalid Markdown is grandfathered or skipped.

## Mermaid connection and GitHub check

The Mermaid Diagram Sync Assistant is installed. Its observed
[check on the P1 revision](https://github.com/brobro10000/mp3-frame-counter/commit/445e374f3410f43296b9508e28d5f8d0f375120b/checks)
completed as **skipped**, with “No Diagrams to Update”: no diagram referenced a changed source file. This repository
currently uses Markdown fences without linked standalone `.mmd` files. The app's
[documented purpose](https://mermaid.ai/docs/ai/github-app) is to regenerate source-linked diagrams and commit updates
to PRs. That is separate from syntax validation. No app settings, account credits or automatic rewriting were enabled by
this repair. The mandatory repository check runs without an account, connector, Codex or private plugin.
