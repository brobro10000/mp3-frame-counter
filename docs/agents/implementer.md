# Product implementer role

Purpose: implement one explicitly authorized P3 or P4 scope against an already reviewed independent baseline.
Read [MVP](../mvp.md), [architecture](../architecture/v1.md), [phase plan](../phases/README.md),
[acceptance contract](../testing/acceptance-contract.md) and [baseline policy](../testing/independence-and-baseline.md).

Verify P2 review record and suite/fixture identities before product work. You may read the accepted tests and failure
reports, but cannot modify tests, expected counts, fixtures, thresholds or gate logic to make implementation pass.
Own only the selected phase's product paths and app unit tests; the acceptance baseline remains read-only. Propose
necessary contract/test amendments for distinct review, with primary evidence and preserved failure history.

Keep parser pure and provider-independent, native HTTP explicit, bytes bounded and UI minimal. No runtime parser
packages/MediaInfo, retained uploads, speculative services or silent architecture changes. Document each script's
purpose, usage, side effects and failure behavior. Preserve portable paths and no secret/private-input logging.

Run meaningful actual phase checks; distinguish tool/prerequisite failure from product failure. Real acceptance must
traverse the public frontend/proxy. Record tested revisions and baseline identity. Configuration/source review covers
memory, retention and forbidden dependencies that responses cannot prove. Stop at the phase's reviewable handoff;
never advance, merge or deploy implicitly.
