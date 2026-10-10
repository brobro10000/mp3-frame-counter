# Publisher handoff validation — 2026-10-10

This record covers the bounded [publisher handoff](../deployment/publisher-handoff.md). Software publication, same-run
handoff emission, historical authentication and deployment are separate outcomes.

## Prerequisites and independent expectations

HOSTED-EVIDENCE published [v0.3.30](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.3.30) from main
`bccea9eb285e467f98b028f4d7f5a895ec83ebd7` after
[run 38093092935](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38093092935) passed. The subsequent
source projection published [v0.3.31](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.3.31) from
`2289a80f6a0f35bab819d7057ac3b2029f09c10f` after
[run 38093943514](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38093943514) passed. Root checked the
original admission contexts and eight metadata hashes for each; image archives were not downloaded or rehashed.

A separate author added publisher expectations before implementation. The first focused run used Node 24.20.0 on the
main-30-based worktree: 45 groups, 13 passed, 32 failed, zero skipped/cancelled/todo. All twelve retained publisher
groups passed. Twenty-eight failures stopped at absent interfaces, two at absent workflow steps and two at missing
publisher behavior. Unreachable negative rows are not claimed as passing refusal controls. Syntax and configured
formatting passed. Original run SHA256: `f9c131330df09db1af504e635b271241148a66b49bc17d76d7bca45dee854c11`.

The credential-free CLI fixtures use real publisher algorithms with an explicitly synthetic bundle-verification and
GitHub adapter boundary. They do not authenticate real CI evidence. Existing publication byte goldens and their original
assertions remain intact; fake observed repository and asset IDs were added for the new result contract.

Independent review found two incomplete oracles before freeze: equality alone did not detect freezing or sharing
caller-owned nested objects, and CLI tests omitted symlink traversal through the fixed `.artifacts` ancestor. Both
corrections preserve the original red. A second focused run recorded 46 groups, 13 passed and 33 failed, with no skips;
its SHA256 is `cda94cb6c61e718c4e1b5922230ad0b46004348f032ee9b383c1a965c88b909e`. Independent readback then caught a
missing fixture-only `renameSync` import that absent implementation had masked. The import was repaired with passing
syntax/format checks; that final static-only change is not attributed to the preceding test run. Final review is
pending; implementation has not begun.

Final test hashes are `5f7898323768052a247f28a5fb28237646c76f6ba27053c4ebf032601d6d678a` for the new handoff suite and
`d55d287c3122e668aa287cf2a5e17f574c676d5c8aaf21897689f7fe86f9a024` for the additive publisher suite. Root read the
author handoffs and rehashed all 21 inventoried evidence records.

## Historical reader compatibility observation

A separate read-only probe inspected completed publisher job `114334424288` in main run `38093092935`, attempt 1. Its
publication step has API number 5. Authenticated requests to the documented step-log endpoint using both 4 and 5
returned 404 under API versions 2026-03-10 and 2022-11-28. The ordinary job-log endpoint returned 302; the probe did not
follow that redirect or retain its signed URL. Neither numbering interpretation is established by this observation.

Probe memo SHA256: `3acd48f2fa86f5a40be8ebb67d63d6ce682fa1c62779ee33fd3bcbaa24cc5985`. This is a retained diagnostic
reference, not a signed attestation. Receipt emission does not depend on historical retrieval. An authenticated reader
and its exact-step adapter still require their own reviewed contract and executable controls; no fallback was adopted.

## Implementation run and fixture portability correction

The first implementation run executed all 46 groups: 42 passed and four publisher CLI groups stopped at their positive
fixture setup with `Wrong independent digest handoff`. The injected verifier compared a temporary `/var` spelling with
macOS’s canonical `/private/var` working directory. A separate cwd observation confirmed the alias; production
`process.cwd()` behavior was unchanged. Original log SHA256:
`e144842fde7d7779f53a0f33bffa4fd2b93cfd2866a00dcf36f5d4c3fdeebc11`.

Root authorized the independent author to canonicalize only the temporary fixture root with `realpathSync`. Root read
the complete two-line logical diff and verified the new publisher-test hash
`091d46d868b8b3a8242e3aba3cf1ba2cb0821171513e3cdae6d1873a399d3e2c`; handoff tests remain `5f789832…`. No expected
digest, refusal decision or implementation changed. The prior frozen bytes and failure remain preserved. Static checks
passed; the corrected implementation run remains pending.

## Current limits

The emitter is implemented with partial focused evidence above. Actual artifact upload, historical authentication, cloud
delivery and production remain unverified. Final focused and CI evidence must be added when actually observed.
