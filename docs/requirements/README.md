# Requirements reference

This directory is the central reference for the MP3 File Analysis App assessment and its supplied sample. Start with the
[formalized assessment requirements](assessment.md) before planning or reviewing future work.

The assessment is captured, not implemented. Recording requirements does not authorize the application phase. The
current work remains repository foundation maintenance, requirements documentation and local sample organization.

## Contents

| Reference                                                        | Purpose                                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [assessment.md](assessment.md)                                   | Stable requirement IDs, source references, acceptance evidence, status and open decisions. |
| [sources/assessment.html](sources/assessment.html)               | Original supplied assessment HTML fragment, preserved byte for byte.                       |
| [sources/foundation-request.txt](sources/foundation-request.txt) | Original user request defining the bounded foundation phase.                               |
| [samples/README.md](samples/README.md)                           | Sample identity, local path, integrity checks and expected-result status.                  |
| [repository controls](../repository-controls.md)                 | Current GitHub policy, including the later owner-authorized review exception.              |

The local sample is `samples/assessment-sample.mp3`. It is ignored by Git and excluded from source artifacts, so a fresh
clone will contain its metadata but not the MP3 bytes.

## Source register

Both supplied documents were archived here on **2026-10-09**. This is the intake date, not a claim about when the
candidate originally received the assessment. Preserve source bytes; do not reformat the HTML or replace originals.

| Source ID      | File                             | Scope                                                                                                  |
| -------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| SRC-ASSESSMENT | `sources/assessment.html`        | Original application contract, evaluation criteria, guidance, submission expectations and time target. |
| SRC-FOUNDATION | `sources/foundation-request.txt` | Earlier authorized foundation work, implementation boundaries and initial repository policy.           |

SHA-256 checksums:

```text
4a9df0982d20fdae6c561ee44f21a46f1ae20d11190940625ccf6543d0ed9a66  sources/assessment.html
e5e73a562bc008a383a2ed024b259c9fb71dbb28d43dac06f778ed5fa18617c2  sources/foundation-request.txt
```

Later explicit user instructions take precedence. Use the assessment source for the application contract and current
`AGENTS.md` and repository controls for authorized work and merge policy. The existing `agents/specs/` documents
describe the original foundation phase; they are not a complete specification of the future application. If source
wording and its normalized requirement disagree, flag and correct the transcription against the source. Record justified
implementation choices for unspecified details. Ask when an ambiguity affects requirements, authorized scope or a
material user preference; do not silently invent requirements.

## Cross-referencing future work

1. Cite relevant stable IDs from `assessment.md` in plans, implementation tasks, tests and PR descriptions. Use the
   existing foundation `REQ-001` and `REQ-002` only for that historical phase; application IDs use `APP-` prefixes.
2. Link each implemented requirement to its code and tests in the registry's evidence column. Record actual validation
   commands and results, including the tested revision, before marking it verified.
3. Keep evaluation criteria and submission expectations visible alongside mandatory behavior. Do not treat optional tips
   as required dependencies or invent numerical performance thresholds.
4. Record decisions for open items with their rationale, affected IDs and user authorization where needed. Keep
   requirement IDs stable; mark superseded items and link replacements instead of reusing or deleting their IDs.
5. Preserve raw sources and sample identity. New source versions need new provenance and an explicit reconciliation of
   affected requirements. Keep historical orchestrator outputs separate from current implementation evidence.
