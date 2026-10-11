# React build admission

The owner's October 11, 2026 priority change permits a minimal React/TypeScript browser build and defers Cloud Run
delivery. This policy PR admits the five pinned development tools and their build commands; it installs no browser
dependencies and changes no product or frozen acceptance expectations. The API runtime remains Fastify-only.

The local acceptance controller also needs to build the frontend from the shared root lockfile. It admits exactly the
repository root with `frontend/Dockerfile`, while retaining the historical frontend context with `Dockerfile`. Its other
build, container, network and cleanup guards remain required.

## Independent expectations and observed repair

The existing frontend-tool expectations were reused from commit `efe6936`; this task does not establish their original
author independence. For the controller repair, a separate acceptance agent wrote seven test groups before the
implementation changed. The first run had 43 tests: all 36 existing tests and five new negative/compatibility groups
passed; the two new positive root-context groups failed against the old controller as expected.

After the narrow implementation and historical fixture-copy repair, the unchanged controller expectations and the
stage-log-policy tests passed together: 50 passed, zero failed or skipped. The latter repair copies the newly imported
pure policy helper into the isolated fixture without changing its assertions.

The independent controller test file has SHA-256 `94ddba3fb8a25bfe39bc9e6c92b979021a3d9310026e7e0fdccbef6c97674fd3`. The
initial failure log has SHA-256 `6840c444f499aa149a71bb28d3cd37fd8f886def02eb817eed8941e7bfa98b94`. Development logs
remain in ignored `.artifacts/frontend-root-context-{red,green}.log`; final CI and exact-head companion review are
separate merge prerequisites. No hosted acceptance or production release is established here.
