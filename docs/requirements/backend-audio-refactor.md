# Backend audio-count refactor: owner amendment — 2026-10-11

This is a narrow owner-defined successor target to the original assessment, which remains unchanged in
[sources/assessment.html](sources/assessment.html). The
[original implementation instruction](sources/backend-refactor-owner-prompt.md) is preserved verbatim; its SHA-256 is
`baa556d3b7288085697bdb621a55ca74af985f33c16d04b3a5c2d42bf0025335`.

The original assignment does not settle whether a leading Xing/Info carrier counts as audio. This amendment adopts
**computed audio frames**, excluding one recognized supported leading carrier. It does not claim an employer answer key,
universal MediaInfo equivalence or support for every valid encoder/tag layout. Historical physical-count evidence stays
valid under its original convention.

| Owner target                                   | Assessment mapping                        | Required observation                                                                                        |
| ---------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Handwritten MPEG-1 Layer III walk, audio count | APP-REQ-001/003/004/005/006, APP-EVAL-001 | Mutated declared totals do not change count; remove a complete frame and count drops; truncation fails.     |
| Exact default success, opt-in diagnostics      | APP-REQ-002/003/006, APP-EVAL-001         | Default `{frameCount}` only; exactly one decoded `details=true` adds closed analysis.                       |
| Canonical coded errors and raw/proxy parity    | APP-EVAL-001/005                          | Exact `{code,error}`, safe catalogue messages, correct statuses/headers and bodyless HEAD.                  |
| Testable Fastify factory and scoped lifecycle  | APP-EVAL-002/006                          | No listener/assets/signals on construction; bounded admission, deadlines, cleanup and production readiness. |
| Shared TypeBox DTOs and generated offline docs | APP-EVAL-002, APP-REQ-008                 | Strict compilation, schema serialization, deterministic OpenAPI, actual CSP-protected Redoc examples.       |
| Existing React service uses Ky once            | APP-EVAL-002/005                          | Raw File, no retry, hook deadline through body consumption, coded outcomes, accessible metadata.            |
| Two non-root containers and local handoff      | APP-EVAL-006/007, APP-REQ-007/008         | Independent builds, no retained uploads or cloud prerequisite; known-count local test.                      |

The sample's new default is `{"frameCount":6089}`. Diagnostics retain physical `6090`, excluded `1`, the independently
walked counts and separately labeled declarations. Preserve the original sample hash and fixture physical totals. VBRI
does not trigger this Xing exclusion. The supported MPEG/tag subset remains explicit in
[API guidance](../../server/README.md).

Observable count and error-envelope changes are **not backward compatible** with the frozen owner contract. Local code
and successor authoring do not activate it. The required sequence remains policy review/adoption, independent candidate
review/merge, actual protected-main binding, then the implementation with refreshed checks. No imaginary merge SHA,
label override or changed historical baseline may select this work. Use the actual source-bound release-line policy; a
separately adopted new line is needed before publishing changed semantics. Production `1.0.0` remains deferred.

Authority in this task is **local implementation and verification only**. Do not push, merge, publish, deploy, change
repository settings or resume cloud spending. See
[implementation/evidence handoff](../validation/backend-audio-refactor.md) and the independently authored successor
contract in its separate reviewable change.

## Later shipment and handoff authority — 2026-10-11

The owner's later direct instruction authorizes committing/pushing the completed refactor/docs, independent companion
review as `brobro1000`, and a normal owner merge as `brobro10000` after applicable checks and clean current review. This
supersedes only the earlier local-only Git boundary. The separately reviewed prerequisite, independent successor, actual
binding and source-bound release-line adoption still precede product publication. No gate waiver is authorized.

Treat this as the last major product change before code freeze. The handoff must link from the top-level README to
implemented architecture, network and sequence diagrams, assessment evaluation evidence, known gaps and long-term
roadmap responses. Hosting remains paused; production `1.0.0` still needs its verified deployment gates.
