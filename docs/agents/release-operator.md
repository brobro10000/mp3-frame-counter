# Release operator role

**Current authority — 2026-10-10:** the [roadmap execution amendment](../phases/roadmap-execution-authorization.md)
supersedes the historical deployment deferral and documentation-only PLAN-01 language below. Bounded stage automation
work is authorized; production application deployment remains a human gate. The shipped release-only behavior is not
evidence of stage deployment. Follow the [transition guide](../testing/acceptance-transition.md): transport-v1 is required
after PR #19/v0.2.19. Browser setup and the docs-v1 candidate are published in v0.2.20 and v0.2.21. The
[docs binding](../validation/docs-binding.md#protected-main-binding-completion--2026-10-10) published in
PR #22/v0.2.22. Intervening governance releases keep transport-v1 required and docs-v1 pending. Verify the actual
tool-policy source and unchanged selection before product adoption; candidate controls do not satisfy product
acceptance. Preserve original-base admission, exact source/run/suite/image identities and immutable retry evidence.

Purpose: publish one verified repository release under [P5](../phases/05-managed-deployment.md), the
[release-only process](../deployment/release-only.md) and amended [requirements](../requirements/release-process.md).
The current owner instruction defers deployment. Read the independently reviewed acceptance baseline before work.

Verify exact protected-main source, successful mandatory checks, frozen baseline ancestry, tested image identities,
configuration and archive checksums before publication. Use the same-run bundle and least-privilege publishing job;
never rebuild, select ambiguous latest artifacts or weaken tests to ship. Serialize publication, reject conflicting
version/tag/assets and complete the draft before exposing a release. Identical retries may reuse verified content.
Record failures honestly and retain prior releases. Release publication must explicitly record that nothing was
deployed.

Keep credentials out of URLs, browser code, traces and logs. Do not merge, invoke the owner's review override or enable
auto-merge without explicit instruction. Agent review is advisory and is not human approval.

When the owner resumes deployment, follow the [deferred deployment runbook](../deployment/runbook.md): verify provider
fit, account/region, budget and credential scope before provisioning; use full candidate acceptance, exact production
approval, observed identities/smoke and authorized recovery. A GitHub release does not establish any of those
observations or authorize spend, exposure, unrelated project reuse or global cleanup.

## Roadmap role extension — 2026-10-10

Read the [versioned roadmap](../roadmap/README.md) and separate [phase instructions](../phases/next-iteration.md).
PLAN-01 authorizes documentation only. The shipped publisher remains release-only; proposed allocation, registry,
deployment and finalization capabilities require their own bounded implementation and verification.

### Release operator

The existing CI publisher, `github-actions[bot]`, remains the single publication authority. Consume the exact tested
source, applicable suite, configuration, run attempt and image pair; never rebuild during publication. Preserve legacy
reservation/manifest bytes, immutable tags/assets and identical retry behavior. An automated companion review is not
human approval and does not itself publish, merge or authorize cloud operations.

After policy introduction, require CI `acceptanceAdmission` with its independent preflight job-output digest; reject
`localSelection` as publication authority. Re-resolve the original source/base and review observations using the
original producing attempt. Preserve legacy bundle bytes and retry identity. Future backfill requires a separately
retained, verifiable original digest; ordinary run metadata or the bundle's own claimed hash cannot supply that trust.

VER-01 must precede release-line activation. Read policy from the tested source, compare versions numerically and reject
ambiguous overrides or ordinary allocation of `1.*`. Extended queue syntax requires compatible tooling first; reconcile
missing publication while original bundles are available. Missing reserved bytes require blocked recovery, not a rebuild
that overwrites their identity. Software releases remain independent of deployment success.

### Deployment operator

After separate authority and cost/access gates, transfer the tested image content to a registry without rebuilding.
Distinguish archive checksums, local image IDs and registry digests. Deploy the compatible pair, validate trusted target
and environment identities, then run the required stage profile. Never use PR-supplied destinations or expose
credentials to unapproved origins. Production-intended configuration needs candidate verification and an approved
recovery path.

Verify production-intended configuration in nonproduction, then obtain human approval before any production application
deployment, including authenticated candidates. Owner `brobro10000` resolves billing, identity, sensitive access and
exact production deployment/exposure; request assistance for interactive authentication or consent without placing
secrets in evidence. Preserve scoped credentials and no retained uploads. Promotion and rollback are serialized,
separately authorized operations. Only observed production identity and passing smoke permit additive `v1.0.0`
finalization by the same publisher; preserve the original candidate provenance. If finalization alone fails, keep
healthy production running and retry metadata publication without redeployment.
