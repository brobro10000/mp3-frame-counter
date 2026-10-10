# Acceptance browser preparation evidence

**Status — 2026-10-10:** independent expectations are committed before implementation. DOCS-HARNESS remains open; local
readiness, fresh Linux CI, companion review, merge and publication are not yet verified. No docs rendering, CSP or
hosted result is claimed. The [contract](../testing/acceptance-browser-setup.md) defines the bounded helper and
evidence.

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

## Remaining completion evidence

Record focused implementation results and actual bounded local readiness, then fresh Ubuntu CI setup before checks and
the complete unchanged 67-case required transport suite. Record exact-head automated companion approval, actual merge
and source-bound main publication separately. Setup evidence remains `productAcceptance: false`; no synthetic fixture,
warm cache, download success or later E2E pass substitutes for the required preparation observation.
