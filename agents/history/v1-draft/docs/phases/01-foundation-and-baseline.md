# Phase 1: foundation and baseline

Canonical ID: `phase-01-v1-foundation-baseline`. Status: planned; awaiting explicit execution authorization.

## Objective and prerequisites

Reuse the merged repository foundation and establish trustworthy sample/tool evidence before parser work. Read the
[MVP contract](../mvp.md), [implementer role](../agents/implementer.md) and canonical plan. Confirm the current
checkout, local sample identity, pinned Node/npm, GitHub read access and installed orchestrator contract. MediaInfo is
currently unavailable on PATH; installation or provision of that tool requires a separate authorized action.

Trace: `APP-V1-009`–`011`, `APP-ASSET-001`, `APP-OPEN-005`, `APP-EVAL-004`, `APP-EVAL-007`, `APP-EVAL-008`.

## Owned paths and deliverables

One serial task, `TASK-V1-01`, owned by the implementer role. Planned writes: `README.md`, `package.json`,
`package-lock.json`, `scripts/`, `.github/workflows/ci.yml`, `docs/mvp.md`, `docs/validation/`, `docs/requirements/`,
`docs/repository-controls.md`, `docs/portability.md` and the phase's declared evidence under `agents/outputs/`. Do not
rewrite source captures or unrelated historical output while updating status.

- Retain working pins and meaningful foundation checks; extend only for real Phase 1 needs. Do not recreate the repo,
  reset main or remove the approved review exception.
- Update the read-only GitHub audit's obsolete expectation of an open unapproved PR #1 and skipped main delivery. Verify
  the actual scoped PR and effective protections while recognizing the merged foundation and executed delivery.
- Populate [sample-baseline.md](../validation/sample-baseline.md) with real MediaInfo version, exact commands, sample
  hash/size, MPEG format, reported frame count and the counting-convention question. No parser-derived expected count.
- Review the existing Python adapter and the installed Python-only execution boundary. Implement only a minimal
  documented adapter for fixed npm validation and baseline checks if necessary. Keep npm authoritative, propagate
  failures/timeouts and address stripped tool environments without hard-coded installation paths or an arbitrary shell.
- Prepare the reviewed phase delta/expanded prompt through the installed capability when execution is authorized. Its
  metadata writes follow that capability's contract, separate from the implementation task's ownership.

## Acceptance and validation

Run the existing commands `npm ci` and `npm run validate` with pinned Node/npm. After the audit is updated, run its
read-only GitHub verification against the current scoped PR. Capture the actual revision, result and CI link.

Use MediaInfo's available CLI to verify and run the proposed commands in the sample baseline. An absent FrameCount is
not zero. If it is absent or the counting convention cannot be established, report the unresolved sample verification;
do not claim the baseline passed. Preserve raw host output in ignored local scratch space and commit only a portable
summary. Check the supplied sample's original checksum before and after inspection.

The planned executor adapter identity is `python3 scripts/validate_v1_foundation.py --project-root . --json`. It does
not exist yet and has not run. Its eventual successful result must be backed by real npm and baseline checks, not a
prewritten success envelope. No TypeScript build, parser/API tests or Docker build is claimed in this phase.

## Human review and stop conditions

Review sample evidence, tool discovery, fixed subprocess commands, timeout/error handling and CI/merge policy changes.
Use eligible approval or the existing owner review exception; core protections still apply.

Stop on missing MediaInfo/sample, checksum mismatch, missing count, unsupported executor behavior or failing checks.
Stop with the scoped PR/evidence report; no merge, parser, HTTP/UI, Dockerfile/Compose/Makefile or Phase 2 work follows
without the corresponding explicit instruction. An external prerequisite may leave this phase incomplete while
preserving the completed repository foundation.
