# Product implementer role

**Current authority — 2026-10-10:** the [execution amendment](../phases/roadmap-execution-authorization.md) authorizes
bounded roadmap work, companion-reviewed normal merges and automatic stage delivery. Every production application
deployment still requires human intervention for the exact candidate. Use the
[current state and three-card window](../phases/next-iteration.md), including its protected-main completion evidence,
for active scope; later amendments supersede historical next-step wording below.

Docs-v1 became required in PR #24/v0.2.24 and preserves all 72 local obligations for descendants and reverts. The
hosted-profile protocol published in PR #25/v0.2.25; declarations and candidate discovery do not establish hosted
acceptance. No application service is deployed. Keep frozen suite/contract/registry ownership independent of product
implementation. Stacked PRs and disjoint agent lanes continue through v1, with ordered merges, actual-source bindings,
fresh companion review and verified publication before dependent completion claims.

Purpose: implement one explicitly authorized P3 or P4 scope against an already reviewed independent baseline. Read
[MVP](../mvp.md), [architecture](../architecture/v1.md), [phase plan](../phases/README.md),
[acceptance contract](../testing/acceptance-contract.md) and [baseline policy](../testing/independence-and-baseline.md).

Verify P2 review record and suite/fixture identities before product work. You may read the accepted tests and failure
reports, but cannot modify tests, expected counts, fixtures, thresholds or gate logic to make implementation pass. Own
only the selected phase's product paths and app unit tests; the acceptance baseline remains read-only. Propose necessary
contract/test amendments for distinct review, with primary evidence and preserved failure history.

Keep parser pure and provider-independent, native HTTP explicit, bytes bounded and UI minimal. No runtime parser
packages/MediaInfo, retained uploads, speculative services or silent architecture changes. Document each script's
purpose, usage, side effects and failure behavior. Preserve portable paths and no secret/private-input logging.

Run meaningful actual phase checks; distinguish tool/prerequisite failure from product failure. Real acceptance must
traverse the public frontend/proxy. Record tested revisions and baseline identity. Configuration/source review covers
memory, retention and forbidden dependencies that responses cannot prove. Stop at the phase's reviewable handoff; never
advance, merge or deploy implicitly.

## Roadmap role extension — 2026-10-10

The P3/P4 instructions above govern the shipped native HTTP application. The [versioned roadmap](../roadmap/README.md)
recommends Fastify, OpenAPI and offline Redoc for a future bounded iteration; it does not claim they are implemented.
Follow the separate [phase instructions](../phases/next-iteration.md). PLAN-01 authorizes documentation persistence
only, without product, test, gate, workflow or infrastructure changes.

### Product implementer

Begin a later implementation card only after its independent contract/suite is reviewed, merged and bound under the
adopted successor policy. Own only the card's product/configuration paths and meaningful unit tests. Required acceptance
source, oracle, applicability and gate policy remain read-only; propose amendments through the independent author.

Keep candidate authoring, actual merged binding and product implementation separate. Once a bound successor applies,
documentation descendants and product reverts retain that requirement. Use ordinary local checks without fabricating CI
admission; a `localSelection` report cannot authorize release or override an `acceptanceAdmission` failure.

For an authorized transport migration, preserve the pure parser, exact raw upload response, inclusive 20 MiB actual-byte
limit, admission before buffering, errors, method/HEAD behavior and lifecycle protections. Retain the static frontend,
two independent non-root images and one browser origin. Planned docs assets add no runtime service or stored uploads. Do
not resolve a docs/CSP failure by broadening upload-page policy or ignoring browser violations.

### Coordinator and handoff

The coordinator owns scope, prerequisite order, writable-path assignments and integration; serialize shared gate,
release-policy and Git operations. Keep independent acceptance/gate authors separate from the implementation they judge.
Refresh exact source and trusted evidence before each card; expose missing prerequisites rather than treating them as
passed. Expand only the next three cards and leave later packages provisional.

Record implemented, tested, reviewed, merged, published and deployed states separately. Stop at the card's reviewable
handoff. Prior unattended P1–P5 authority does not authorize a new implementation card, merge, override or deployment.

For the [backend-audiotarget](../requirements/backend-audio-refactor.md), own product code/tests only. Do not alter the
frozen suite, oracle, policy expectations or applicability to obtain a pass. Raw Buffer ownership/admission, TypeBox
projection, offline docs and no-retention controls stay mandatory; do not resume cloud or perform remote writes under
the attachment.
