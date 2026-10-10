# Acceptance browser preparation evidence

**Status — 2026-10-10:** corrected implementation passes all 38 independent focused groups after committed behavioral
regressions. DOCS-HARNESS remains open: real local readiness, fresh Linux CI, companion review, merge and publication
are not yet verified. No docs rendering, CSP or hosted result is claimed. The
[contract](../testing/acceptance-browser-setup.md) defines the bounded helper and evidence.

## Prerequisite and independent expectations

Trusted main is `f4fb747df8890511edde7878064bb9af79823138`, with verified v0.2.19 publication, transport-v1 required and
no pending successor; see [Fastify completion](fastify-transport.md#protected-main-completion). Read-only inspection
identified that standalone acceptance controls ran before the later E2E browser installation. This separate governance
change prepares the exact selected browser without editing product or frozen acceptance.

Independent author `gate_design` specified the two test files from the root-owned contract. Root inspected the full
expectation diff and preserved existing consumer controls before committing `fc950c615cc362f762884da11de85d9987d2a574`.
A separate implementer owns the helper and narrow phase-runner integration; it cannot edit expected decisions. The
test-first commit contains only the two tooling tests and `test:tooling` wiring, without dependencies, locks, product,
acceptance or workflow changes.

Pinned Node 24.20.0 command
`node --test scripts/acceptance-browser-setup.test.mjs scripts/acceptance-consumers.test.mjs` reported **35 groups: five
passed, 30 failed, zero skipped or cancelled** in 18,106 ms. All four original consumer controls and the
historical-phase control passed. Twenty-two helper groups failed the explicit missing-export guard; eight real
phase-runner groups exposed missing preparation, ordering or evidence. Those helper failures are interface-red, not
exercised negative decisions. Inert detached-child tests are authored but have not yet executed their mechanisms.

- `scripts/acceptance-browser-setup.test.mjs` SHA-256:
  `85c102b6c7a2ae1775c85faa374347b53fabfe5072e363d17c6755136efd932c`.
- `scripts/acceptance-consumers.test.mjs` SHA-256: `992b80303822d2376d7a1afc4041a51ee01087cffc9dc7617668e1f4a06aa07a`.
- Ignored `.artifacts/docs-harness-final-red.log` SHA-256:
  `c564caaaf8f7c7040f17e6bbfb472ed3ec95c776d2db772bc05a8c21d1b77b7d`.

Explicit-file formatting and syntax checks passed. Earlier red logs remain preserved. Fixture cleanup was tightened
before this commit to await exact owned detached-child exit and avoid re-killing a confirmed exited PID; expected
decisions were not relaxed. Root independently rehashed the files/log and inspected failures rather than treating an
author summary as proof. No real browser, package installation, apt, Docker or cache mutation occurred in these tests.

## Documentation reconciliation

Current guidance records verified Fastify activation, retains dated native-transport/release-only observations and
advances exactly three cards: DOCS-HARNESS, DOCS-CONTRACT and DOCS-BIND. Independent Markdown review confirmed the
completion identities and caught one tree-versus-commit wording ambiguity, corrected before submission. This review is
not companion approval or proof of helper behavior. Formatting explicitly covers new documents; ignored role files and
AGENTS.md retain manually wrapped prose.

## First implementation and independent findings

Initial implementation `7c63166cae68b07f0e4080fc91bcf9f862cb87ec` ran the same focused command and reported **34/35
passing groups**, with no skipped or cancelled cases. The failure was the actual macOS child environment comparison: the
runtime generated `__CF_USER_TEXT_ENCODING` beyond the explicitly supplied keys. Two bounded inert pinned-Node probes
with synthetic HOME/PATH/CI reproduced this one extra key, including when an own undefined suppression was supplied. The
contract now distinguishes this exact platform field from forbidden inherited environment. No real host value is
recorded here, and the strict adapter-visible allowlist remains unchanged.

Both detached-child mechanisms executed: the normal-exit hook terminated the exact owned inert child while cleanup
remained unverified without public close; the blocked probe demonstrated that a separate child survives forced
Node-group termination, and fixture teardown removed that exact child. This is process-control evidence, not real
browser readiness. The first-pass log remains ignored at `.artifacts/docs-harness-implementation-first-pass.log`,
SHA-256 `5204e1872b11cc305e63b1a15215ea9ae275e24c0ee6e1bc3e0a96d6c519fca1`.

Independent source review found a P2 stale-evidence path: if the first npm install of a same-source rerun failed, the
previous passing setup report survived because new evidence was only written after a helper attempt. Contract r2
requires an empty fresh report immediately after validated selection. Node source inspection also identified automatic
host coverage propagation and permission-model NODE_OPTIONS synthesis; the selected response is explicit coverage
suppression and early refusal of an active permission model, preserving security. Independent regressions precede these
corrections. Retain this failed run; no global pass follows from the other 34 groups.

## Corrective expectations before fixes

Independent test amendment `3f806fd991d34b398389a0a997b1c189e38f2f7d` preserves the earlier controls and adds three
behavioral regressions. The same focused command reported **38 groups: 35 passed and three failed**, with no skipped or
cancelled cases, in 25,727 ms. Failures separately reproduced host coverage reaching actual inert children, an active
permission model proceeding instead of refusing, and the same-source first-install failure retaining a prior passing
entry. The platform-specific environment correction passed without relaxing the explicit child allowlist.

The coverage test first demonstrates Node's automatic inheritance in a positive control. The permission test runs under
the actual permission flag with read access but no child permission; guards distinguish import/fixture errors from the
required refusal before metadata or adapters. The stale-record test first obtains an actual passing synthetic report,
then fails the first install on the same source. All resources and coverage output remain fixture-owned; no real parent
environment, product, browser cache or external service is modified.

- Setup-test SHA-256: `477fbc534c100361a31a7af1b1b101ef9302403db9eb2be61f1739e817baaecc`.
- Consumer-test SHA-256: `0fa343bc559435237408248d9e3e25835974b7f3ac6a7e94586ec80e8b103bf2`.
- Ignored `.artifacts/docs-harness-r2-red.log` SHA-256:
  `46ccce2a3c04bf6be6e7cc04b31f9855e79b72cddb7dfc6f02704568919a3da7`.

Root inspected and rehashed this diff/evidence before committing it and releasing the separate implementer to correct
only the helper and runner. The failed implementation remains recorded as `7c63166`; no expected decision was changed to
conceal those three failures. The platform investigation is separately retained at
`.artifacts/docs-harness-implementation-platform-investigation.log`, SHA-256
`3ca71a7e81f6eed901e70bddf00c49c476512d048bece793b7e5031beaab002a`.

## Corrected focused implementation

The separate implementer changed only the helper and phase runner. Spawn-local suppression prevents automatic host
coverage propagation; active permission mode fails before metadata/processes; validated selection writes a fresh empty
report before extraction or npm. Probe signals shorten the remaining absolute internal deadline instead of resetting it.
The independently committed r2 test bytes remain unchanged.

The focused command passed **38/38 groups**, with zero failures, skips or cancellations, in 25,280 ms. Both source
syntax checks and explicit-file formatting passed. Root inspected the correction diff and rehashed the actual files and
log:

- Helper SHA-256: `67056495554a0ef7ae0ab63d8b979cb12f87f5f6f62d33347d93961bc6a8e097`.
- Runner SHA-256: `ebc89b43cc4ec11f34b3141e79875166c9497eda6e81a76a60ec7c185e0f5e38`.
- Ignored `.artifacts/docs-harness-implementation-r2-final.log` SHA-256:
  `c4709892fee5fa4ff7d0ae7766187246817fabd13fc37218686fde84d8808bd3`.

Independent source re-review found the stale-evidence issue resolved and no actionable defect in the correction delta;
its before/after hashes matched the above. All focused execution used injected commands or inert installed-package and
process fixtures. No actual browser/package installation, network, Docker or product execution occurred in that handoff.
Broader verification remains required; green inert tests do not establish fresh Linux browser availability.

## Remaining completion evidence

Record focused implementation results and actual bounded local readiness, then fresh Ubuntu CI setup before checks and
the complete unchanged 67-case required transport suite. Record exact-head automated companion approval, actual merge
and source-bound main publication separately. Setup evidence remains `productAcceptance: false`; no synthetic fixture,
warm cache, download success or later E2E pass substitutes for the required preparation observation.
