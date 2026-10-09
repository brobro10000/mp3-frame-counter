# Requirements reference

This directory is the central reference for the MP3 File Analysis App assessment and its supplied sample. Start with the
[formalized assessment requirements](assessment.md) and the [first application MVP release process](release-process.md)
before planning or reviewing future work, then read the [V1 contract and choices](../mvp.md).

The assessment is captured, not implemented. Recording requirements does not authorize the application phase. The
current work is V1 planning documentation; implementation remains separately authorized by phase.

## Contents

| Reference                                                                  | Purpose                                                                                    |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [assessment.md](assessment.md)                                             | Stable requirement IDs, source references, acceptance evidence, status and open decisions. |
| [release-process.md](release-process.md)                                   | Required deployment, versioning, releases and recovery for the first application MVP.      |
| [V1 MVP contract](../mvp.md)                                               | APP-V1 requirement IDs, exact application choices and the phased delivery boundary.        |
| [Unified decisions](../architecture/decisions.md)                          | Source precedence, requirement mappings and remaining decisions.                           |
| [sources/assessment.html](sources/assessment.html)                         | Original supplied assessment HTML fragment, preserved byte for byte.                       |
| [sources/foundation-request.txt](sources/foundation-request.txt)           | Original user request defining the bounded foundation phase.                               |
| [sources/release-process-request.txt](sources/release-process-request.txt) | User conversation excerpt establishing the first application MVP release amendment.        |
| [sources/v1-planning-brief.md](sources/v1-planning-brief.md)               | Supplied planning brief, preserved byte for byte; apply the reconciliation record.         |
| [sources/unified-planning-brief.md](sources/unified-planning-brief.md)     | Latest supplied consolidated planning brief; apply explicit user-confirmed reconciliation. |
| [samples/README.md](samples/README.md)                                     | Sample identity, local path, integrity checks and expected-result status.                  |
| [repository controls](../repository-controls.md)                           | Current GitHub policy, including the later owner-authorized review exception.              |

The local sample is `samples/assessment-sample.mp3`. It is ignored by Git and excluded from source artifacts, so a fresh
clone will contain its metadata but not the MP3 bytes.

## Source register

The supplied source documents were archived here on **2026-10-09**. This is the intake date, not a claim about when the
candidate originally received the assessment. Preserve source bytes; do not reformat the HTML or replace originals.

| Source ID            | File                                  | Scope                                                                                                                     |
| -------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| SRC-ASSESSMENT       | `sources/assessment.html`             | Original application contract, evaluation criteria, guidance, submission expectations and time target.                    |
| SRC-FOUNDATION       | `sources/foundation-request.txt`      | Earlier authorized foundation work, implementation boundaries and initial repository policy.                              |
| SRC-RELEASE-DECISION | `sources/release-process-request.txt` | Later user instruction on 2026-10-09 requiring the release cycle in the first application MVP.                            |
| SRC-V1-BRIEF         | `sources/v1-planning-brief.md`        | Supplied V1 brief, captured on 2026-10-09; the user explicitly authorized planning and document creation.                 |
| SRC-UNIFIED-BRIEF    | `sources/unified-planning-brief.md`   | Latest planning requirements, captured 2026-10-09; user confirmed preserving merged foundation and owner review override. |

SHA-256 checksums:

```text
4a9df0982d20fdae6c561ee44f21a46f1ae20d11190940625ccf6543d0ed9a66  sources/assessment.html
e5e73a562bc008a383a2ed024b259c9fb71dbb28d43dac06f778ed5fa18617c2  sources/foundation-request.txt
2e8d9b87727c6662ad3675b1097edcaae512eb5629226ca2718c4277a3839cad  sources/release-process-request.txt
4bcb5110ef0065ffab4aa2c5487809dc227a27f45e4a44cdbe47d3f6b36ccb28  sources/v1-planning-brief.md
3e4960537de8eb5295e26d5af23b81e8270ab9ddf4e65d51e0b87f2eea111470  sources/unified-planning-brief.md
```

The release-process excerpt was recorded on the same date. Its normalized requirements are a later user amendment, not
content from the assessment HTML. They require execution evidence before the first application MVP is complete.

Later explicit user instructions take precedence. The user explicitly confirmed updating from the unified brief while
preserving the already-merged foundation and owner-only PR review override. Its contrary no-prior-execution/no-bypass
sentences do not override those confirmed facts. The original V1 brief remains a historical draft; no-cloud,
manual-browser-only, three-phase and one-lockfile-without-exception choices are superseded. APP-REL-001–006 remain
required alongside managed deployment and explicit production approval.

Use the assessment and release amendment for their stable requirements, the unified brief for current planning scope,
[docs/mvp.md](../mvp.md) for the normalized human-readable proposal, and [decisions](../architecture/decisions.md) for
edge proposals and blockers. No implementation is authorized by recording this plan. The previous draft's generated
contracts are archived under `agents/history/v1-draft/`; original foundation contracts remain under
`agents/history/foundation/`. There is no active generated execution plan pending required reviews;
[the orchestrator boundary](../../agents/README.md) explains why. If source and normalized wording disagree, correct the
transcription or explicitly record a justified later amendment; never invent a requirement.

## Cross-referencing future work

1. Cite relevant stable IDs from `assessment.md`, `release-process.md` and `../mvp.md` in plans, tasks, tests and PR
   descriptions. Use the existing foundation `REQ-001` and `REQ-002` only for that historical phase; application IDs use
   `APP-` prefixes.
2. Link each implemented requirement to its code and tests in the registry's evidence column. Record actual validation
   commands and results, including the tested revision, before marking it verified.
3. Keep evaluation criteria and submission expectations visible alongside mandatory behavior. Do not treat optional tips
   as required dependencies or invent numerical performance thresholds.
4. Record decisions for open items with their rationale, affected IDs and user authorization where needed. Keep
   requirement IDs stable; mark superseded items and link replacements instead of reusing or deleting their IDs.
5. Preserve raw sources and sample identity. New source versions need new provenance and an explicit reconciliation of
   affected requirements. Keep historical orchestrator outputs separate from current implementation evidence.
