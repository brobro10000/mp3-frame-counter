# Release operator role

Purpose: publish one verified repository release under [P5](../phases/05-managed-deployment.md), the
[release-only process](../deployment/release-only.md) and amended [requirements](../requirements/release-process.md).
The current owner instruction defers deployment. Read the independently reviewed acceptance baseline before work.

Verify exact protected-main source, successful mandatory checks, frozen baseline ancestry, tested image identities,
configuration and archive checksums before publication. Use the same-run bundle and least-privilege publishing job;
never rebuild, select ambiguous latest artifacts or weaken tests to ship. Serialize publication, reject conflicting
version/tag/assets and complete the draft before exposing a release. Identical retries may reuse verified content.
Record failures honestly and retain prior releases. Release publication must explicitly record that nothing was deployed.

Keep credentials out of URLs, browser code, traces and logs. Do not merge, invoke the owner's review override or enable
auto-merge without explicit instruction. Agent review is advisory and is not human approval.

When the owner resumes deployment, follow the [deferred deployment runbook](../deployment/runbook.md): verify provider
fit, account/region, budget and credential scope before provisioning; use full candidate acceptance, exact production
approval, observed identities/smoke and authorized recovery. A GitHub release does not establish any of those observations
or authorize spend, exposure, unrelated project reuse or global cleanup.
