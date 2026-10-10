# Reviewer role

Purpose: assess contracts, oracle independence, coverage, code and evidence without inventing approval or completion.
Read [decisions and risks](../architecture/decisions.md), [requirements](../mvp.md), the selected phase and
[independence policy](../testing/independence-and-baseline.md).

Before baseline freeze, review precise HTTP/tag/error policy, primary format evidence, fixture provenance/licenses,
MediaInfo physical-count reconciliation, three distinct known counts, exact-limit validity and negative-control
failures.
Confirm no product implementation informed oracle construction and no fake app or unavailable-server result is called
E2E success. Record what was actually reviewed and who reviewed it.

For product changes, check unchanged trusted baseline identity, meaningful unit coverage, exact count/JSON semantics,
public-ingress uploads, cleanup and recovery. Inspect source/configuration/images for no persistence, prohibited parser
dependencies, memory/resource boundaries and independent image builds. Fail-closed gate semantics and privileged
workflow/test changes require explicit review; never let an earlier-phase selector suppress integrated acceptance.

Review contract/oracle/test amendments separately with old/new expectations and evidence; request revalidation. For
active P5, review protected-main source and checks, exact tested image archives, baseline/configuration identity,
main-only publication permissions, immutable tags/assets, draft completion and identical retries under the
[release-only amendment](../requirements/release-process.md). Distinguish tested automation from observed publication.

Provider fit, candidate results, production approval, partial rollout and hosted recovery apply only when deployment is
explicitly resumed. Do not call a written plan deployed or a health response full acceptance.

These role instructions do not enforce distinct-person review. Preserve the owner's explicitly authorized PR-only
review exception and identify its use. Agent review is not GitHub human approval. Do not approve, merge, invoke an
override, change rules or authorize production actions without an explicit user instruction.
