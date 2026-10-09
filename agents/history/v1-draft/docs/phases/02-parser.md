# Phase 2: standalone parser

Canonical ID: `phase-02-v1-parser`. Status: planned; depends on accepted Phase 1 and explicit Phase 2 authorization.

## Objective and prerequisites

Implement the pure TypeScript physical frame counter and prove known counts independently of HTTP and containers. Read
[the parser contract](../mvp.md#parser-contract), architecture decisions, implementer role and real Phase 1 sample
evidence. Research the required MPEG and ID3 details using the primary references in the preserved brief. Record exact
supported tag layouts and free-format limitations; do not make unsupported compatibility claims.

Trace: `APP-V1-004`, `005`, `009`, `010`; `APP-REQ-001`, `003`, `004`, `005`; `APP-OPEN-005`, `007`.

## Owned paths and deliverables

One serial task, `TASK-V1-02`, owned by the implementer role. Planned writes: `server/src/mp3.ts`, `tests/mp3.test.ts`,
`tests/fixtures/`, `tsconfig.json`, `package.json`, `package-lock.json`, `scripts/`, `.github/workflows/ci.yml`,
`README.md`, `docs/mvp.md`, relevant requirements/validation documentation and declared phase evidence. Synthetic
fixtures should be generated or stored as text/binary data compatible with the repository's MP3-input policy; do not add
the private sample or weaken that policy just to create test inputs.

- Add TypeScript checks and a genuine build for parser code only; use Node's built-in test runner/assertions.
- Implement header-based frame lengths, strict complete consumption and typed errors. Validate ID3 bounds and
  version-specific rules; explicitly handle invalid/reserved fields and unsupported formats.
- Test known counts, CBR/VBR and padding changes, metadata records, header-like payload bytes, truncation, zero frames,
  unexpected bytes and documented unsupported layouts. Fixture construction must establish counts independently.
- Compare the parser with Phase 1 MediaInfo evidence and investigate metadata-frame discrepancies from primary sources.
  Repeat sample verification without embedding MediaInfo in the parser or altering expected results to match it.
- Extend the terminal gate for real typecheck/test/build checks. Review the foundation policy assertions that currently
  forbid application files and allow only foundation dependencies/jobs; narrow those assertions to the authorized scope
  while preserving portability, dependency integrity, main-only delivery and the fail-closed gate.

## Acceptance and validation

Run `npm ci`, the expanded `npm run validate` and the actual typecheck/test/build commands introduced in this phase.
Record their final names and outputs; this plan does not pretend those commands exist now. Ordinary CI must run from a
clean clone with synthetic fixtures, without the local MP3, private orchestrator or MediaInfo as a runtime dependency.

The planned executor adapter identity is `python3 scripts/validate_v1_parser.py --project-root . --json`. It will run a
fixed reviewed command set and fail on missing evidence or any command failure. It is not implemented or executed in
planning. Update the sample baseline with the observed parser result and explained comparison.

## Human review and stop conditions

Review arithmetic/bounds, ID3 rules, physical-versus-reported count semantics, fixture independence, prohibited parser
dependencies and whether reduced format support is honestly described. Do not turn source tips into broader mandates.

Stop on unresolved sample discrepancies, unsupported required sample structure, unapproved compatibility reductions,
failed checks or missing independent expected counts. End with a scoped PR and evidence report. No HTTP/UI/container
work, phase advancement or merge occurs without explicit authorization.
