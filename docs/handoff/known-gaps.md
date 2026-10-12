# Known gaps and provisional follow-up

These limits are disclosed against the current local target. A supported-scope limitation is not automatically a
blocking defect. The [evaluation](evaluation.md) and [dated verification](../validation/backend-audio-refactor.md)
describe what has actually been checked; historical roadmap records do not establish current behavior or new authority.

## Count interpretation and supported formats

`APP-REQ-003–006`, `APP-EVAL-001`: the original assignment provides no numeric employer oracle and does not distinguish
audio frames from complete metadata-bearing frames. The owner adopted 6,089 audio frames for the identified sample;
6,090 physical frames remain independently established. Employer agreement with that interpretation is unconfirmed.
Resolve an assessment-critical mismatch with the owner before changing the count contract; do not infer an answer key
from MediaInfo, product output or a sample-specific correction.

The parser supports MPEG-1 Layer III table bitrates/sample rates/padding, flags-zero ID3v2.3.0/2.4.0 and permitted
trailing ID3v1. MPEG-2/2.5, other layers, free-format, unsupported tag/encoder layouts and corruption recovery remain
unsupported. It does not decode audio or validate CRC/payload/LAME extensions. Only a correctly positioned leading
Xing/Info carrier is excluded; VBRI and later markers are not substitutes. General MediaInfo equivalence is unclaimed.
Any broader format support requires new independently agreed expectations.

The private assessment sample is ignored and unavailable in a fresh clone or release archive. Its identity is in the
[sample record](../requirements/samples/README.md); the
[portable nine-frame fixture](../deployment/local-handoff.md#optional-known-count-fixture) supplies a reproducible
example without distributing private audio (`APP-SUB-003`).

## Capacity and platform evidence

`APP-EVAL-006`: whole-body buffering and synchronous analysis limit concurrency despite byte, connection, admission and
deadline bounds. The measured parser medians and exact-limit cases are finite local observations. Peak memory, sustained
throughput, event-loop latency under production traffic and horizontal scaling are unverified. Files above 20 MiB are
intentionally rejected. The roadmap's
[measured memory/event-loop pressure track](../roadmap/README.md#provisional-v1x-and-v2-evolution) requires agreed
targets and independent tests before streaming or workers; it remains provisional.

`APP-EVAL-004–005`, `APP-SUB-002`: Docker source setup documents Windows/WSL2, ARM macOS and Linux prerequisites. This
does not certify every host version, CPU platform, screen reader or browser. Received `linux/amd64` archives require
working emulation on ARM. Desktop/narrow Chromium, useful status/error rendering and strict CSP were observed locally;
broader platform/accessibility coverage needs a concrete reviewer environment and regression scope.

Native protocol refusals, disconnected clients and unrelated NGINX static 404s are outside the fixed JSON error
guarantee. Recovery tests do not prove the absence of every leak or operational failure. Future work should respond to
an observed blocking defect rather than broaden error promises beyond the actual transport.

## Accepted documentation-checker limitation — 2026-10-12

The owner explicitly deferred companion finding F-004 in acceptance PR #64 because of the submission timing constraint.
The partial OpenAPI matcher ignores `multipleOf`, so a contradictory schema could exclude supported odd Xing flags
without the documentation checker rejecting it. This known P2 limitation remains unfixed; a passing check does not prove
complete OpenAPI schema validation. Earlier request-changes evidence is preserved, and the exception must remain visible
in the binding and approval records. No executable checker, required CI job or branch protection is disabled. Actual
product acceptance and exact-source review remain required; independent checker hardening is provisional follow-up after
the local handoff.

## Shipment and external evidence

`APP-EVAL-007–008`, `APP-SUB-001–003`: final local run `mp3-e2e-45286-140fd7c71318` passed 72 cases and supplemental
sample/docs/UI observations, with cleanup verified. Its source/suite revisions remain explicitly unrecorded; retained
content hashes and image IDs are not trusted release admission. Successor binding, exact-head companion approval, merge
and protected-main CI/publication remain pending until the [validation record](../validation/backend-audio-refactor.md)
identifies actual outcomes.

Evaluator repository access, assessment receipt date, the five-day target date and actual external submission remain
unverified (`APP-TIME-001`, `APP-SUB-001`). The roadmap's
[assessment submission track](../roadmap/README.md#assessment-submission-is-a-separate-track) separates these from
optional portfolio growth. Neither a local pass nor publication proves employer receipt or acceptance.

## Freeze and roadmap

The owner authorized reviewed shipment followed by a product code freeze. After merge, implementation changes are
reserved for blocking defects with focused regression evidence and review. Documentation can clarify frozen behavior;
unrequested features, refactoring, broader MPEG support and speculative infrastructure are not freeze work.

The [roadmap](../roadmap/README.md) and [next-iteration record](../phases/next-iteration.md) retain dated history and
provisional tracks. React and Fastify already exist in this target; older rows proposing them are historical, not new
gaps. Additional state/routing complexity, streaming/workers, separate release cadence, history/authentication or a
provider change require the roadmap's specific trigger and evidence before adoption. No database, retained uploads or
cloud dependency is needed for the current application.

Cloud delivery remains paused under the
[local-MVP amendment](../deployment/v1-delivery.md#local-mvp-handoff-and-cloud-pause--2026-10-11). This handoff neither
resumes it nor claims verified production v1.0.0. Hosted acceptance, recovery, exact-candidate human approval and
production smoke remain the separate [production gates](../roadmap/README.md#stage-to-production-delivery). Future
roadmap activation needs renewed scope and authorization; it is not a delivery commitment made by this assessment
handoff.
