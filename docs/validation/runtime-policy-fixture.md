# Runtime policy fixture isolation

**Status — 2026-10-10:** the minimal governance test-fixture correction merged in PR #18 after exact-head companion
approval. Protected-main CI published **v0.2.18**. The runtime policy itself, product, dependencies and frozen
acceptance are unchanged; r3 remains required and transport-v1 remains pending. Earlier local observations below retain
their original scope; the completion section records subsequent verification.

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

## Protected-main completion

[PR #18](https://github.com/brobro10000/mp3-frame-counter/pull/18) reached reviewed head
`0edc3113a970df8126d12907b4c5aef963acc52e` on base `3e1851eaddb558f6c38eedc88334605212a7a153`. Required PR run
`38052332769`, attempt 1, passed on synthetic source `3623cfe11b6d457cc2368a896f5ce22214b5047a`: 425 tooling tests, 20
gate tests, 75 unit tests, 60 required r3 cases and 19 Mermaid renders. Pending transport-v1 discovery remained separate
candidate evidence; it did not replace product acceptance.

Actual Docker companion run `20261010T123503-444c5022` reviewed **2/2 files**, reported no findings and passed its
documentation gate. The coordinator read the complete report and matching receipt, then verified the posted
[automated approval](https://github.com/brobro10000/mp3-frame-counter/pull/18#pullrequestreview-5478964547) from
`brobro1000` against that exact head. The companion used source and captured CI evidence, not independent execution of
the local red/green logs; this was not human review.

Owner `brobro10000` merged normally at **2026-10-10T12:40:12Z**, producing `17b389e71fadb869150982e4b459e52b37d664b2`.
Its sole parent is the recorded base, and tree `e7d1c11f29c89ee61b737fd554165875fce494eb` matches the reviewed head. No
override or bypass was used.

[Main run 38052804356](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38052804356), attempt 1, passed
foundation, product, control-plane and publication. The E2E record has 60/60 required r3 cases and successful cleanup.
Admission digest `f10eb1695cba997e2f364536cfd132ee8930688d513ef97089c2a59faddc9859` binds the actual source, trusted
base and run; its decision is governance, with transport-v1 pending at binding `5645b050…` and no activation.

[v0.2.18](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.2.18), release ID **408946585**, published at
**2026-10-10T12:43:36Z** from that exact merged source with ten assets. Publisher job `114215717652` retained same-run
provenance. All eight downloaded metadata assets were rehashed against GitHub's SHA-256 digests; neither image archive
was downloaded or independently rehashed. The recorded tested images are:

- API: `sha256:b2966c174ff44401537411fd16a01695a1ded18ce3cdd5b2a3b77c9fcc84cdfd`.
- Frontend: `sha256:e8014471e10816d6d80a889a2ab0faadb43d542640e7f51541255eef5471ec53`.

Ignored observations are retained under `.artifacts/runtime-fixture-main-publication/`. No extra publisher retry or
deployment was performed. The prerequisite is complete; the separate Fastify implementation must still pass the bound
successor and obtain its own exact-head review and publication evidence.
