# DOCS-TOOL-POLICY execution evidence

## Scope and prerequisite — 2026-10-10

This separately scoped governance change admits metadata for root development-only `redoc` exactly `2.5.4`, with no CLI.
It installs no dependency and changes no lock, product, suite, contract, registry, workflow or cloud resource.
Transport-v1 remains required and docs-v1 remains the single pending bound successor. This policy cannot prove renderer,
CSP, downloaded bytes, offline generation, production-image exclusion, product docs acceptance or deployment.

The trusted base is `cfafcbe3e0bd33af2c95ccd9b4aee4f0c07960e6`. Its
[DOCS-BIND completion](docs-binding.md#protected-main-binding-completion--2026-10-10) verifies PR #22's actual squash,
authenticated exact-head automated approval and protected-main publication of v0.2.22, with 67 required transport cases
and separate pending docs controls/discovery. That actual publication precedes this card's expectation authoring. The
[phase card](../phases/next-iteration.md#pr-card-1--docs-tool-policy-admit-the-selected-redoc-build-dependency) defines
the sixteen-path scope and continuing owner authority; no new product allowance is inferred from it.

## Independent expectations and retained red

The independent author wrote [the policy contract](../testing/docs-tool-policy.md) and 21 test groups before a helper
existed. A different agent reviewed all groups and the existing caller/runtime boundaries, finding no actionable defect.
Its source-only memo SHA-256 is `af3f42863c317d9cc887fe622888725cbccb690a207b112fab62a933d211af5c`. Neither agent ran
checks or read product implementation. Root read both files and the complete review, adopted the eight diagnostic
prefixes, applied installed Prettier and appended only the new test to `scripts.test:tooling`.

Test-first commit `b8b934a8bf07468da0ab36c6a325aff4193f31cb` contains those three paths and precedes implementation. The
formatted test SHA-256 is `323cff56170d8b04d639bf486d215869ceca5309fef42b35483a55129f898673`; the contract hash is
`fb4db29fb723096dff1b1833e46a03142b4bfe560feaeb77396559c85fb34ed7`. The helper was still absent when root ran:

```sh
node --test scripts/docs-tool-policy.test.mjs
```

With pinned Node 24.20.0/npm 11.19.0, the command exited 1: **21 groups, 1 passed, 20 failed, zero skips or
cancellations**, in 1.756 seconds. The negative-oracle self-control passed. Two real-CLI positive groups reached the old
`Unreviewed development tool` rejection after their earlier legacy counterparts succeeded. These are meaningful
admission failures for the intended new allowance. The other eighteen groups stopped at the explicit missing-API guard;
those are interface-red, not proof that individual negative rules executed. No import/setup failure was counted as a
successful rejection. The raw red log SHA-256 is `c196583d8827cca424dea373cd7b0c9795238ec3bed876bb3cbd31e8b44766db`.

Expectations freeze at that commit. A separate implementer receives only the new pure helper and narrow policy caller;
root owns checks and integration. Any expectation defect requires a separately reviewed amendment with the original red
retained, rather than changing an oracle to fit implementation.

## Implementation and validation status

The separate implementer added the pure metadata helper and exactly four narrow caller integrations: import, mandatory
test-entry assertion, unconditional call after runtime validation and the single allowed development name. Root read the
complete helper/diff and ran the new expectations with the unchanged runtime-policy tests:

```sh
node --test scripts/docs-tool-policy.test.mjs scripts/runtime-dependency-policy.test.mjs
```

All **48 tests passed**, zero failures/skips/cancellations, in 19.429 seconds with the pinned runtime. Real CLI controls
exercised both legacy and selected metadata, attributable rejection and restored success. Focused log SHA-256:
`46076d0399101abcff68ccfa880a40b609178b3f99737d1d72606c6f4fa36ec4`.

Root verified the exact sixteen-path scope, frozen test/contract hashes, unchanged runtime helper/tests, locks,
registry/genesis and the sole package tooling-script append. All 127 checked relative file-link targets exist and the
phase document has exactly three detailed cards. Formatting preserves ignored agent files, whose new prose is wrapped
manually. New files were staged before tracked-file checker coverage.

`npm run validate` then passed formatting, actionlint 1.7.12, repository policy, portability, **19 Mermaid renders, 20
gate tests and 480 tooling tests**, with zero failures/skips/cancellations. The full log SHA-256 is
`890eaf29305dc28635e2bb267280f512213a074f450e074a71950185602213f1`. This local command does not rerun image-bound
application acceptance. Mandatory PR/main CI must still establish required transport behavior and pending docs checks.

PR CI, exact-head companion review, merge and protected-main publication remain pending. The local documentation preview
is separate and does not satisfy application acceptance.

## Independent final review

The independent reviewer read the complete helper, exact caller/package changes, frozen expectations and actual focused
log. It found no implementation defect or expanded dependency authority. Review SHA-256:
`d1b74f0dcd9eefc503613a2ac8033a21f2cd7a9ea7e5d3e219bb23e86decbabb`. The helper hash is
`7b5897e1af5fb10016372d53053632e9212705956fa3ce28c6f5532223bb9a52`; caller hash is
`506ce6f13ce8c0da5942d2bde3701ae8cd59bfcc696246a00b3cb41ae3a8c35f`.

Its documentation pass found one stale current GATE-REVIEW row claiming no pending successor. Root corrected it to
transport required/docs pending and reconciled the adjacent DOCS-01 row with the bound renderer/CSP disposition. The
reviewer verified the correction, exact three-card order, preserved historical evidence and human production gate; no
findings remain. Its review SHA-256 is `28a8dc11495c445cc47f3b1ef2555e5a161d357e97b8970b949dbb141f36bfc7`. The
reviewer's separate link pass found 128 existing relative file targets in its read scope. Counts describe each pass's
scope and do not imply every historical external link or anchor was validated.

These are automated source/evidence reviews, not duplicate test executions or posted companion approval. Root read both
memos in full. Only documentation changed after the complete validation run; focused formatting passed for those
updates. The implementation and frozen test identities remain unchanged. Mandatory GitHub checks, exact-head companion
review, actual merge and protected-main publication remain pending.
