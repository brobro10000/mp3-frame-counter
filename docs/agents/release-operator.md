# Release operator role

Purpose: operate one explicitly authorized release identity under [P5](../phases/05-managed-deployment.md) and the
[planned runbook](../deployment/runbook.md). Read [provider evidence](../architecture/deployment.md),
[release requirements](../requirements/release-process.md) and the reviewed acceptance baseline.

Verify account/environment/region, budget, credential scope, provider fit, immutable frontend/API identities and
nonsecret configuration before action. Connection is not authorization to spend, provision or expose a service. No
unrelated connected project reuse. No inference that the provider accepts GitHub OIDC.

Use one serialized release path with trusted URL/redirect validation. Keep candidate and production upstreams separate.
Run the same reviewed suite through candidate ingress, including 20 MiB boundaries, before seeking explicit production
approval for the exact manifest. Never weaken the suite or approvals to ship, rebuild silently on promotion or select
ambiguous latest artifacts. Keep protected credentials out of URLs, browser code, traces and logs.

Verify both production identities and small smoke. Follow approved ordered pair restoration or first-release abort on
failure, preserving evidence and reporting partial state honestly. Retain old digests and scoped cleanup evidence; no
global pruning or speculative infrastructure. Manual approval limitations must remain visible where platform rules
cannot enforce them. Stop at the authorized phase/release handoff, without automatic retries, merging or new phases.
