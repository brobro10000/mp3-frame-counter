# Empty project Editor binding validation — 2026-10-11

The [IAM correction contract](../deployment/bootstrap-iam.md) keeps the correction in the local project/bootstrap root.
It adds one empty `roles/editor` binding with a destruction safeguard and Resource Manager dependency. The original
seven resources, two sensitive outputs, provider aliases/pins/lock, APIs and cost controls remain unchanged. This source
amendment does not establish actual IAM removal, trusted remote state or deployment readiness.

## Independent expectations before implementation

A separate author wrote `scripts/cloud-bootstrap-iam.test.mjs` against the adopted contract before the source change. An
independent reviewer checked all 643 lines, original-source fingerprints and seventeen retained evidence records; no
actionable finding remained. Root read the review and froze the expectations in commit `12e046d` before adding the
binding. Test SHA256: `eebd288b027f763bb69951fa6271321fe062a187ab239bcc4db0143109c125a7`.

The first run had twelve groups, eight passing and four failing: two missing-binding failures and two output-buffer
failures. The author increased only the native-plan output bound from 16 MiB to 48 MiB. The second run exposed an
incorrect optional-field oracle: an omitted budget amount alternative is `null`, not `false`. After correcting that
expectation, the final red run had ten passing groups and two expected missing-binding failures, with no skips. All
earlier failures are retained. Final red log SHA256: `1217ef4f903d209692de49b60d373017c0e438d1c3df1ca9111c982488afda0b`.

Before implementation, only synthetic test-owned calibration supplied native positive plans. Actual-source plan checks
stopped at the missing-binding structural guard. That calibration was not represented as implemented behavior.

## Source result

Root added only the specified binding and purpose comment, registered the test in the mandatory tooling command and
policy, and updated narrow operator documentation. The original test bytes remained unchanged.

With Node 24.20.0, Terraform 1.13.3 and the verified installed Google 8.6.0 provider mirror,
`node --test --test-reporter=tap scripts/cloud-bootstrap-iam.test.mjs` passed all **12 groups**, with zero failures or
skips. Both synthetic identities now evaluate the actual source using native mocked plans. Assertions require exactly
eight resources, the unchanged two outputs, empty Editor membership and preserved cost/API protections. Source and plan
mutation controls reject added grants, incorrect targets, hidden configuration and original-resource drift. First
implementation log SHA256: `34726602399aa4fc3cc4cb2e9af49987b77bf9ac963a7309edc51d02e7f0e8b4`.
`terraform fmt -check infra/cloud/bootstrap` also passed. The unchanged cap and access tests ran together with
`node --test infra/cloud/bootstrap/cap-reconciler.test.mjs scripts/cloud-access-foundation.test.mjs`: all **42 groups**
passed, with no skips. Log SHA256: `eeccc29a005423e1ed2c0e5b891e5a14415fd4c8273b7f94fddaba5d415fe1aa`.

## Operational boundary

These isolated tests copy only public source/lock files, install from the verified filesystem mirror and pass no cloud
credentials. They do not establish live policy preservation, workload absence, cost readiness or convergence. Exact-head
CI, companion approval, merged publication, reviewed saved-plan application and independent IAM/no-drift readback are
separate pending gates. Every production application deployment still requires human intervention.

## State-migration ordering clarification

Independent operational review identified a sequencing conflict: the published access source already declares GCS, so
its final normal plan must follow backend initialization. The adopted clarification requires complete IAM convergence
and source/state/API reconciliation first, followed by a state-only migration to the verified empty destination and
immediate full parity, locking and no-change checks. It authorizes no access-resource mutation. Original failed
readbacks remain retained. Review memo SHA256: `42362f1c51cb8bbb9ae5953bd3e406637feb2422b77b0845950bcf07b3ff0fd1`. No
migration or new live observation occurred while preparing this source/documentation amendment.
