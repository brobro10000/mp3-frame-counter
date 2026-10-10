# Acceptance browser preparation evidence

**Completion amendment — 2026-10-10:** DOCS-HARNESS is complete at PR #20/v0.2.20. The
[protected-main completion](#protected-main-completion--2026-10-10) below supersedes earlier pending-CI/review/merge
statements while preserving their dated scope and failures. Read the [docs candidate record](docs-binding.md) for the
separate PR #21/v0.2.21 controls; browser readiness is never documentation product acceptance.

**Status — 2026-10-10:** corrected implementation passes focused and full local validation, actual local browser
readiness, 82 unit tests and all 67 image-bound transport cases. DOCS-HARNESS remains open pending fresh Linux CI,
companion approval, merge and protected-main publication. No docs rendering, CSP or hosted result is claimed. The
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

## Complete local validation

Clean source `378155bf01750d2a4e4f90b1b96204ff0bb39a15` passed `npm run validate` on pinned Node 24.20.0: formatting,
workflow lint, policy, portability, **19 Mermaid renders, 20 gate tests and 459 tooling tests**, with no failures, skips
or cancellations. Log `.artifacts/docs-harness-validate.log` SHA-256:
`018f119b3e51989a2b2cb66c8761582117b81429b163e964ecb2c398e60de882`.

The same clean source passed
`DOCKER_DEFAULT_PLATFORM=linux/amd64 CI_BASE_REF=f4fb747df8890511edde7878064bb9af79823138 npm run check:phase`. The
normal runner selected the immutable transport-v1 suite, executed package-local browser preparation **before** its
standalone checks, passed **82 unit tests**, built both images and passed **67/67 external cases** with zero skips or
retries. The E2E result duration was 93,170 ms. Cleanup passed; separate exact Compose-project queries confirmed no
remaining containers or network. Existing fixture/oracle, product, workflow, lock, registry and cloud bytes remain
unchanged from the trusted base.

Actual local readiness used Playwright 1.64.0, Chromium/headless-shell revision 1248 and observed browser 156.0.8078.4.
The install command completed in approximately 287 ms and the about:blank probe in 342 ms, with completed close and
confirmed cleanup. The macOS run did not execute `install-deps`. This is real launch evidence using an available local
cache, not proof of fresh acquisition or Linux OS setup. The separate later E2E controller retains its cached setup.

- API image: `sha256:d0e49aa8cffbefaec3ff547709012a8e2c4f61b9b83bc4d8111556035da79a8d`.
- Frontend image: `sha256:f8c521d4d6e71273d7f6e680d9fccb635a87fd4a814f80299f1ca08e0899ac8d`.
- Ignored `.artifacts/docs-harness-local-browser-setup.json` SHA-256:
  `f1b26ef3f8c77a6c9c94557b3dd71df3f6cc9ccf85395bcccde0d7fda5c3a780`.
- Ignored `.artifacts/docs-harness-local-e2e-result.json` SHA-256:
  `fe346b3ab27ac6c468c7be8e71c89ecf7e3321f2078ca63f7c68bedd1231bd6a`.
- Ignored `.artifacts/docs-harness-phase.log` SHA-256:
  `a89dbefd30cb9afb997e90b4a1a9af3bf280cc6a5e091e5cbec7708b09749d58`.

Local resolution classifies this as governance, keeps transport-v1 required with activation `f4fb747` and binding
`5645b05`, and reports no candidate/pending successor. It is not trusted CI admission. Candidate/pending branch behavior
is covered by inert histories; no real docs candidate exists. Subsequent evidence-only documentation commits do not
change the measured helper, runner or product bytes, but final PR/main CI must validate their own source and image pair.

## Remaining completion evidence

Obtain fresh Ubuntu setup before standalone checks and complete unchanged required acceptance against the final source.
Record exact-head automated companion approval, actual merge and source-bound main publication separately. Setup records
always remain `productAcceptance: false`; no warm cache, synthetic pass or download alone substitutes for the required
fresh Linux preparation observation. No documentation renderer or hosted capability is established here.

## PR diagram correction — 2026-10-10

PR #20's diagram assistant added preparation as a detached leaf in `9f9226d`. The coordinator corrected the canonical
release diagram to place exact suite selection, locked installation, browser readiness and standalone controls before
product build/E2E, and added the helper as a source reference. No executable behavior changed. `npm run check:mermaid`
rendered all 19 tracked diagrams successfully. The superseded initial PR run `38057257304` was canceled when the bot
updated the head; canceled work is not passing evidence. Final-head CI and companion review remain required.

## Protected-main completion — 2026-10-10

[PR #20](https://github.com/brobro10000/mp3-frame-counter/pull/20) merged at 14:03:37 UTC as
`c39de309867d63fc04fe1d12647680b34ee178d5`, sole parent `f4fb747df8890511edde7878064bb9af79823138`. The merged tree
`bcd85adbc7476c240fc084d307d5e03e19c9b015` equals reviewed head `32edb57ef52dd003daae8cf2e1f1fa3c3a25769c`'s tree.
Companion run `20261010T135532-bf5f3f5e` approved all 24 changed paths, with no findings and a passing documentation
gate. The actual
[automated approval 5479213786](https://github.com/brobro10000/mp3-frame-counter/pull/20#pullrequestreview-5479213786)
by `brobro1000` was verified before the normal owner squash merge. This is not human review or a protection override.

[Final PR CI 38057332726](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38057332726) tested synthetic
merge `25919486725e9279cdee1f53fcc215266071381f`. Actual protected-main
[run 38058120765, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38058120765/attempts/1) then
passed and published [v0.2.20](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.2.20), release
408988920, ten assets, at 14:07:26Z. Both reported 459 tooling tests, 20 gate tests, 82 unit tests, all 67 required
transport cases and 19 rendered diagrams, with no test failures/skips and passed scoped cleanup.

Main Linux setup recorded `install-deps` in 12.765 seconds, installation in 9.002 seconds and launch probe in 0.861
seconds: Playwright 1.64.0, Chromium/headless-shell revision 1248 and browser 156.0.8078.4. Close and cleanup completed
before standalone checks. Readiness remains `productAcceptance: false`. No cache-before inventory proves a cache miss;
these observations establish actual Ubuntu 24.04 preparation and launch, not newly acquired bytes. Real candidate
preparation was subsequently observed in PR #21's separate [candidate evidence](docs-binding.md#actual-ci-results).

The v0.2.20 admission remains governance, with transport-v1 required, binding `5645b05`, activation `f4fb747` and no
candidate/pending binding at that historical source. Root read the embedded admission and verified its digest:
`aa44e18f58073f2d0e889f489347aedb7b929d2490576494539f9b6aa7a3d10f`. Required suite identities remain unchanged: commit
`6c28382d71a014351311e63154ef1c8916b8a229`, tree `d905d3123623f74b029a94c61ca850e553af2c32`, manifest
`674bb8a49e895b283d828e965f3cd4c6e1567f9b38ec25fdf44dfe452085e3cc`.

The release records API image `sha256:85b0eec1702a4a5a27a05dcdf6714e92a3273f42d9bebc55578d9525a56e6072` and frontend
image `sha256:90d99e9bab3fdf9bb7abadc5ba152fb085bf970adfb8fb14c43da8237f81001e`. Root independently rehashed eight
metadata assets against GitHub digests and compared source/tag/run/context/suite/images and publication outcome. Zero
image archives were downloaded/rehashed; no retry or deployment occurred. An initial observer assertion confused
`release-only-provenance` with the publisher's distinct `released-not-deployed` field; the assertion was corrected
without changing source or evidence.

Ignored local publication verification SHA-256 is `97439c8b71740895037f9c366a4d1620a5f94aebef569c29be684fd3824ff683`;
main-CI verification is `467fe91b589695d00438d2eef55263460e76e44bb9bc19d567e88ef975572492`. These retained records are
not portable published artifacts; the durable run/release links identify repository evidence. DOCS-HARNESS completion
establishes browser readiness before standalone checks, with no docs route, CSP, hosted service or production claim.
