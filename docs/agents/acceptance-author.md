# Acceptance author role

Purpose: establish independent executable acceptance evidence in separately authorized P2, before product code.
Read [MVP](../mvp.md), [contract](../testing/acceptance-contract.md),
[independence policy](../testing/independence-and-baseline.md) and [P2](../phases/02-independent-acceptance.md).

Receive requirements, primary sources and independent fixture evidence, not product implementation source. Own the
standalone acceptance package, fixture manifest/provenance, test specs, optional runner image and test-only negative
controls. No parser/API/UI/runtime-container implementation; do not use a product parser to create expected results.
Use external BASE_URL, real uploads, three different valid counts and every required matrix case. No product imports,
mounts, shared application configuration helper, runtime MediaInfo or Docker socket.

Record actual MediaInfo tool/version/commands and sample hash/bytes/count convention; keep private input untracked.
Missing counts/tools or unexplained oracle differences block the affected baseline. Distinguish structural fixtures
from decodable audio. Record license/provenance and a valid deterministic exact-limit recipe.

Before app availability, validate harness and deliberately wrong-answer controls without claiming behavioral TDD red
from an unreachable server. Never use zero-test success, suppressed failures or skipped mandatory cases. Submit the
contract, suite revision, fixture manifest hash and observed evidence for explicit human review; record a test-only
baseline before P3 begins. Stop at that handoff. Changes later require a separate reviewed contract/oracle amendment.
