# React build admission

The owner's October 11, 2026 priority change permits a minimal React/TypeScript browser build and defers Cloud Run
delivery. This policy PR admits the five pinned development tools and their build commands; it installs no browser
dependencies and changes no product or frozen acceptance expectations. The API runtime remains Fastify-only.

The local acceptance controller also needs to build the frontend from the shared root lockfile. It admits exactly the
repository root with `frontend/Dockerfile`, while retaining the historical frontend context with `Dockerfile`. Its other
build, container, network and cleanup guards remain required.

## Independent expectations and observed repair

The existing frontend-tool expectations were reused from commit `efe6936`. At initial PR authoring their original
independence was unverified; the recovered record below subsequently establishes it. For the controller repair, a
separate acceptance agent wrote seven test groups before the implementation changed. The first run had 43 tests: all 36
existing tests and five new negative/compatibility groups passed; the two new positive root-context groups failed
against the old controller as expected.

After the narrow implementation and historical fixture-copy repair, the unchanged controller expectations and the
stage-log-policy tests passed together: 50 passed, zero failed or skipped. The latter repair copies the newly imported
pure policy helper into the isolated fixture without changing its assertions.

The independent controller test file has SHA-256 `94ddba3fb8a25bfe39bc9e6c92b979021a3d9310026e7e0fdccbef6c97674fd3`. The
initial failure log has SHA-256 `6840c444f499aa149a71bb28d3cd37fd8f886def02eb817eed8941e7bfa98b94`. Development logs
remain in ignored `.artifacts/frontend-root-context-{red,green}.log`; final CI and exact-head companion review are
separate merge prerequisites. No hosted acceptance or production release is established here.

## Recovered original authoring record — 2026-10-11

The coordinator recovered the independent acceptance subtask's original file-add event at 05:12:27 UTC and its
pinned-Node missing-API run at 05:15:43 UTC: twelve failures, zero passed or skipped, before helper implementation.
Formatting that recorded original test content produces SHA-256
`93bfc39d1d1d07e764117b922338be53ffe78370a719c2a39a4da0cb8248e5c7`, identical to both `efe6936` and the reused file. The
retained raw failure log has SHA-256 `62ace615902ce8de0c490182f7e0db675a14b93ef8cdbf57d6e0a3d10cb9ef7c`. Neither
original evidence nor expectations were changed during recovery. These role/timing records establish independent
authorship; the passing required
[PR56 CI run](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38140688276) verifies the repaired source
separately. They do not prove hosted delivery or authorize production.
