# Runtime dependency policy evidence

**Status — 2026-10-10:** independent expectations preceded a locally passing implementation. Required CI, companion
review, merge and publication remain pending. RUNTIME-POLICY follows the actual transport-v1 binding at
`5645b0501ca403750a2d894d6a492afa4b42185b`, released as v0.2.16. This governance change keeps r3 required and
transport-v1 pending; it neither declares Fastify nor changes the root lock graph.

Read the [predicate contract](../testing/runtime-dependency-policy.md),
[phase card](../phases/next-iteration.md#pr-card-1--runtime-policy-admit-one-explicitly-pinned-framework-dependency) and
[actual binding evidence](transport-binding.md#protected-main-binding-publication). Trace APP-V1-009,010,013 and the
assessment's parser-package restriction; preserve APP-REL-001–006 evidence boundaries.

## Independent expectations and correction

The independent author wrote the tests and contract without reading product or acceptance source. Initial commit
`61bd698de50cf311a23ce7b3cab90235a95e3200` preserves that test-first boundary. On pinned Node 24.20.0, the focused
command reported 22 groups: three passed, 19 failed, no skips or cancellations. Eighteen groups explicitly required the
missing helper; the remaining failure reached the existing blanket ban through a complete permitted-Fastify fixture. The
dependency-free CLI control and unchanged development/workspace/transitive-policy controls passed.

A second independent review found two test-sensitivity gaps before any implementation file was written. Invalid pin and
sole forbidden-package fixtures could reject unrelated lock inconsistencies; rejection cases did not prove that mutable
inputs stayed unchanged. The author strengthened synchronized negative graphs and post-rejection comparisons. These are
corrections to the evidence, not changes to the frozen predicate or relaxations of product acceptance. The original
failed evidence remains preserved; initial expectations were not declared independently approved.

Original test SHA-256: `1ac2092da70a9941818dac2e344cea5b43ce26957b17397ee437597f6170b49f`. Initial red-log SHA-256:
`9457f95d4b89445792ef2946aee7811e852c4fe03781a5c110213728abb472ab`, retained locally in
`.artifacts/runtime-policy-red.log`. The coordinator corrected only the contract's card link when advancing the window.

The corrected focused run reported **26 groups: four passed, 22 failed, no skips or cancellations**. Twenty-one failures
explicitly identify the absent API; the complete allowed-pin CLI still reaches the blanket ban. The synthetic
mutation-sensitivity control passes. Corrected test SHA-256 is
`3511c6bcb62aa462e4d2add8ebc71688350560167a3690b39b32a38a47a57db1`; corrected red-log SHA-256 is
`dcfd467fee6a1e7b7835953f6d82bddd03d13ff85ef96d1963b9a263e3b05c8c`, retained in `.artifacts/runtime-policy-red-r2.log`
separately from the original run.

Independent re-review found both correction families addressed, with no remaining actionable finding. Commit
`ec5b6a18616d9303ca1378614150260f656a6797` preserves the corrected expectations before helper/policy implementation. The
review inspected source and saved red evidence; it did not execute additional tests or claim mutation testing beyond the
explicit synthetic control.

## Local implementation

The pure helper now validates the frozen metadata contract; `policy.mjs` adds one import and replaces only the blanket
runtime-dependency assertion with its call. The implementer did not edit expectations. Focused execution on pinned Node
24.20.0 passed **26/26 groups**, with zero failures, skips or cancellations, including actual CLI positive/rejection
controls. The log SHA-256 is `4e5706fc92143a53ad4e91bd051d1c1decbd844827bf8ce69147a6d541c2fee7`, retained in
`.artifacts/runtime-policy-green.log`. Only comment wrapping followed that run; final integrated checks follow
separately.

Helper SHA-256: `da55540f31040400ae9f6a654bad88123b2e36b494705c2cf6d9b35ccd2b0423`. Policy entrypoint SHA-256:
`78974215c144011e29b69082fed3e12d7a3c2b7b1c18ed553570a06a298956f8`.

The first integrated `npm run validate` passed formatting, actionlint and policy, then stopped at the portability
scanner's two synthetic Windows-path literals. The author changed only their construction to the existing test
convention, `["C:", "fixture", "fastify"].join(String.fromCharCode(92))`, preserving the actual rejected strings and all
expectations. The checker and its scope were not weakened. That initial log remains
`.artifacts/runtime-policy-validate.log`; downstream checks from this attempt are not claimed as executed.

The corrected integrated `npm run validate` completed successfully: formatting, pinned actionlint, repository policy,
portability, all 19 Mermaid renders, 20 terminal-gate tests and **424 tooling tests** passed, with zero skips or
cancellations. This includes the 26 final focused groups. The preserved log is
`.artifacts/runtime-policy-validate-r2.log`. Independent policy/security source review found no actionable defect in the
helper or narrow integration; it inspected source and saved test evidence without executing additional tests. Product
acceptance remains a separate mandatory CI obligation; this local validation does not claim it was rerun.

## Immutable boundaries and remaining evidence

The root lock SHA-256 is `24f63ce1ca4ffb559d7d45e0c3335f102c919e9b3b1f7890b60d94588fa5e11c`. Runtime and development
declarations remain unchanged; the sole package command addition wires the focused policy tests into `test:tooling`. The
existing workspace, development-tool, transitive registry/integrity, workflow and GitHub-control checks retain their
original authority. Required acceptance source, contract, registry and genesis remain immutable.

Pure metadata checks cannot authenticate downloaded tarballs, establish graph reachability or prove absence of a parser
inside transitive package contents. Dependency/source review and the future exact-image transport acceptance remain
separate obligations. Local tests cannot establish CI admission, companion approval, merge, publication or deployment.
Those later observations must be recorded after they actually occur. No application service or production release is
established here.
