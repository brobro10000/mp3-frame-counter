# Runtime policy fixture isolation

**Status — 2026-10-10:** the minimal governance test-fixture correction passes all 27 focused groups locally. Required
CI, companion approval, merge and publication remain pending. The runtime policy itself, product, dependencies and
frozen acceptance are unchanged; r3 remains required and transport-v1 remains pending.

## Failure and independent regression

The later Fastify product implementation exposed a fixture defect after its real package/lock metadata passed policy.
The first full tooling run reported 420 passes and four failed CLI positive controls: the fixture copied the
application's new runtime declaration but constructed a dependency-free synthetic lock. The policy correctly rejected
that inconsistent fixture. This does not justify changing admission policy or acceptance from the product PR.

On the actual main base `3e1851eaddb558f6c38eedc88334605212a7a153`, the independent expectation author added an optional
source-metadata argument to the local fixture factory and cloned that input before use. A new real-CLI regression feeds
a synthetic allowed Fastify declaration, requires successful construction of the intended dependency-free fixture,
preserves every other package field and development declaration, and checks that the supplied input is unchanged. The
existing positive-before-negative controls and all 26 original expectations remain intact.

Pinned Node 24.20.0 execution before the fixture fix reported **27 groups: 26 passed, one failed, no skips or
cancellations**. The new test reached the actual policy CLI and failed specifically at package/lock runtime declaration
agreement. It did not mistake setup/import failure for successful rejection. Commit
`960c5d39a32752a81677862a9edb0052506cd809` preserves this regression before the fixture correction.

Red source SHA-256: `afd91f41cdf72ab2925f864cc740c75be576c96aa54eb1256b801d7b093a2b68`. Ignored
`.artifacts/runtime-fixture-red.log` SHA-256: `1c565ec9989fc898724de0a13eef66ed0c9568751e74f6ba29415ac54f17e85f`.

## Minimal correction and boundaries

The fix removes only copied `dependencies` from the cloned package metadata before constructing its synthetic
dependency-free lock. It does not mutate the source package. The separate allowed-pin CLI test still explicitly adds
matching runtime declarations and a lock entry, proves they pass, then introduces the forbidden graph and proves
rejection. Policy decisions and real application dependencies are unaffected.

`node --test scripts/runtime-dependency-policy.test.mjs` then passed **27/27 groups**, with zero failures, skips or
cancellations. Explicit-file Prettier formatting passed. Corrected test SHA-256 is
`a4ccff73b1d64cfe5eaf1b878f0e84bb80566ea83c20d724c090515f04597a32`; the ignored green log
`.artifacts/runtime-fixture-green.log` has SHA-256 `5df8000c09b01a5c41ae53190563f4ae8dadec9f7fa038f8168c272ac8f81220`.

This correction is a separate prerequisite to the [Fastify card](../phases/next-iteration.md), not a new application
capability or a relaxation of the [runtime metadata contract](../testing/runtime-dependency-policy.md). Trace
APP-V1-009,010,013 and preserve the assessment's parser-package restriction. Complete normal CI and exact-head automated
companion review before owner merge, then verify the actual main release. Fastify must integrate the merged correction
and still pass the unchanged bound transport suite. No release, deployment or production result is claimed by the
focused test pass.

## Integrated local validation

Independent read-only review found no blocker in the regression or two-line fixture correction. It verified that the
allowed-pin and forbidden-runtime controls still construct their own matching graphs after fixture creation; it ran no
tests or external operations. Root inspected the diff, actual red/green counts and hashes.

`npm run validate` passed formatting, pinned workflow lint, actual policy, portability, **19 Mermaid renders**, **20
gate tests** and **425 tooling tests**, with no failures, skips or cancellations. The ignored log is
`.artifacts/runtime-fixture-validate.log`. This tooling-only correction leaves product and acceptance bytes unchanged;
normal PR/main application validation and exact-head companion approval remain required before publication.
