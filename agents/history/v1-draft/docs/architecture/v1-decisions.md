# V1 planning decisions and reconciliation

Status: captured input decisions and proposed phase plan, for review on 2026-10-09. No implementation acceptance is
claimed. Sources are registered in [requirements](../requirements/README.md).

## Precedence decisions

| Topic                | Resolution                                                                                                                                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current task         | The user clarified that the goal is to plan and create the documents. No phase execution or GitHub mutation follows.                                                                                                                                                                   |
| Foundation           | PR #1 is merged at `143498a`. V1 Phase 1 reuses it and addresses remaining baseline work; it does not recreate the repository or report that PR as open.                                                                                                                               |
| Review rules         | Preserve the directly authorized owner-only PR review override and the separate core ruleset with no bypass. The brief's blanket no-bypass paragraph does not revoke this decision.                                                                                                    |
| Release cycle        | Preserve `APP-REL-001`–`006` as first application MVP completion criteria. The brief's local image delivery is part of that work, not a replacement for automatic versions, releases, deployed checks or recovery.                                                                     |
| Target               | Local Compose is fixed for running V1; cloud hosting remains excluded. The non-cloud release target and automated access remain an explicit decision before Phase 3 release work.                                                                                                      |
| Earlier architecture | The brief mentions a previous Node-served HTML design. The merged repository contains only a foundation system contract, with no approved application topology to migrate. Record the brief's conceptual change to separate NGINX/API containers; do not invent a historical approval. |
| Generated contracts  | Preserve the existing schema-v1 format. No schema-v2 architecture upgrade or project-profile migration is requested. Authored Mermaid views live under `docs/architecture/`; no generated `agents/architecture/` views are claimed.                                                    |
| Historical records   | Exact previous contracts and agent instructions are retained under `agents/history/foundation/`, with hashes. Existing outputs retain their historical meaning; their successes do not validate V1.                                                                                    |

The canonical active specifications remain at `agents/specs/`, with the plugin's required schema and metadata. Its fixed
`status: approved` field records the verified scope supplied for specification; it is not a claim that a human approved
the generated phase plan, any code, a PR, or deployment. This plan remains for review. The plugin's legacy `0.1.0`
envelope is not the installed plugin version or a chosen application release version.

## Traceability and fixed choices

| V1 / canonical ID    | Related assessment or release IDs                                            | Choice and source                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| APP-V1-001 / REQ-101 | APP-REQ-002, APP-EVAL-002, APP-EVAL-005                                      | Minimal accessible browser UI; brief §3.                                                                                        |
| APP-V1-002 / REQ-102 | APP-REQ-001, APP-REQ-002, APP-REQ-006, APP-OPEN-001, APP-OPEN-004            | TypeScript, native HTTP, raw bytes, exact JSON; brief §§2–3.                                                                    |
| APP-V1-003 / REQ-103 | APP-EVAL-005, APP-EVAL-006, APP-OPEN-002, APP-OPEN-003                       | Whole-file Buffer bounded at 20 MiB, actual-byte enforcement and cleanup; brief §3.                                             |
| APP-V1-004 / REQ-104 | APP-SCOPE-001, APP-REQ-003, APP-REQ-004, APP-REQ-005                         | Pure physical-frame parsing; no external result calculation; brief §4.                                                          |
| APP-V1-005 / REQ-105 | APP-REQ-003, APP-OPEN-005, APP-OPEN-007                                      | Validated tags and explicit metadata-frame convention; brief §4.                                                                |
| APP-V1-006 / REQ-106 | APP-SUB-002, APP-REL-001, APP-REL-004                                        | Separate frontend/API Dockerfiles, minimal non-root images; brief §5.                                                           |
| APP-V1-007 / REQ-107 | APP-REQ-002, APP-REQ-006, APP-EVAL-005, APP-REL-005                          | Two-service topology, loopback origin, health and proxy contract; brief §5.                                                     |
| APP-V1-008 / REQ-108 | APP-EVAL-004, APP-SUB-002, APP-SUB-003                                       | Make wrappers, explicit prerequisites and independent build instructions; brief §6.                                             |
| APP-V1-009 / REQ-109 | APP-ASSET-001, APP-REQ-003, APP-GUIDE-001, APP-OPEN-005                      | MediaInfo is now required by the V1 brief for independent verification, although optional in the original assessment; brief §7. |
| APP-V1-010 / REQ-110 | APP-EVAL-001, APP-EVAL-003, APP-EVAL-004, APP-GUIDE-002                      | Built-in Node tests and self-contained fixtures, progressive real CI; brief §7.                                                 |
| APP-V1-011 / REQ-111 | APP-EVAL-007, APP-EVAL-008, APP-SUB-001                                      | Three reviewed phases and explicit advancement, current owner exception retained; brief §§8, 10–12 and repository controls.     |
| APP-V1-012 / REQ-112 | APP-REL-001, APP-REL-002, APP-REL-003, APP-REL-004, APP-REL-005, APP-REL-006 | Protected-main local delivery plus required release and recovery cycle; brief §11 and release amendment.                        |

## Recorded choices versus unresolved prerequisites

`APP-OPEN-001` is resolved for V1 as raw-body upload. `APP-OPEN-002` has the documented error status/schema contract;
exact parser edge classifications remain implementation research. `APP-OPEN-003` has a per-file byte bound and an
explicit concurrency limitation, but no invented throughput target. `APP-OPEN-004` selects native HTTP, built-in tests,
separate containers and Make; it does not yet select an automated release target. `APP-OPEN-007` selects strict physical
parsing with tag handling but leaves the precise supported tag versions/layouts for verified format research.

MediaInfo availability/count (`APP-OPEN-005`), receipt date (`APP-OPEN-006`), image digests, timeouts and release-target
operations remain unverified. Each phase states which of these block its own acceptance. None is replaced by a guessed
value or a fake passing check.
