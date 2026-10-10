# Application releases without deployment

**Later amendment, 2026-10-10:** [roadmap execution](../phases/roadmap-execution-authorization.md) resumes hosted work
and authorizes automatic stage deployment with human intervention for production. Software releases remain independent
of deployment. The release-only policy and evidence below describe the earlier milestone and retain their historical
scope.

Current authority: **2026-10-09 release-only amendment**, [SRC-RELEASE-ONLY](sources/release-only-request.txt). After
reviewing deployment readiness, the owner explicitly deferred deployment and requested releases without deploying. This
supersedes the earlier requirement to deploy before publishing a successful application release. The earlier
[release request](sources/release-process-request.txt) and [unified brief](sources/unified-planning-brief.original.txt)
remain immutable historical sources.

A release now means a Git tag and private GitHub repository release containing the tested application artifacts,
checksums, notes and provenance. It does not mean a running service, hosted acceptance, production approval or
successful deployment. No provider account, hosting budget or deployment credential is needed for this publication
boundary.

The owner asked whether merging is safe; this is not an instruction for an agent to merge, use the owner review override
or enable auto-merge. Core merge controls and the independently frozen acceptance baseline remain mandatory. Publishing
from eligible protected-main pushes is the requested automation; PR validation must never publish a release.

## Later source-bound version-policy amendment — 2026-10-10

The owner-adopted roadmap selects [VER-01](../deployment/version-policy.md): ordinary versions become
`0.<approved minor>.<global first-parent ordinal>` from the exact tested source's root policy. Initial migration selects
`0.1`; separate LINE-02 activation selects `0.2`. Preserve historical schema-1 identities/bytes, immutable retries and
all APP-REL provenance requirements. The earlier fixed-`0.1` wording below records the original policy and is superseded
only for sources with an introduced valid policy. Policy deletion/downgrade cannot restore legacy behavior. Version
allocation grants no deployment authority; verified production `1.0.0` finalization remains separate future work.

## Current and deferred requirements

Stable IDs are retained. The table explicitly distinguishes the active release portion from deferred deployment work;
deferral is not completion. The original assessment itself does not require a hosting provider or managed deployment.

| ID          | Active release-only requirement                                                                                   | Evidence needed                                                                                                               | Deferred deployment portion                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| APP-REL-001 | Reproducible local build/run configuration for the two independently built application images.                    | Documented setup, clean builds and complete local acceptance against the identified images.                                   | Provider selection, account/region/budget, managed configuration and successful hosting.        |
| APP-REL-002 | Automatically publish eligible application releases from protected main after every mandatory check succeeds.     | Main-only workflow, failure controls and an observed successful publication run. PRs receive no release write token.          | Automatic deployment to a candidate or production service.                                      |
| APP-REL-003 | Determine versions automatically and publish matching tags, notes and private repository releases.                | Version policy, exact source/tag binding, real release URL and explicit undeployed status.                                    | Deployment verification as a prerequisite for publication; it is no longer a release-only gate. |
| APP-REL-004 | Retain the exact tested image pair, archive checksums and source/suite/configuration provenance.                  | Published image archives, validated manifests and conflict-safe retries. Never rebuild after acceptance for the same release. | Registry promotion, provider deployment identities and managed rollback artifact retention.     |
| APP-REL-005 | Verify the local application before publication and expose release failures through GitHub Actions.               | Full unchanged acceptance suite with zero failures/skips, clean source, successful cleanup and verified release assets.       | Hosted health, public-ingress acceptance and production smoke checks.                           |
| APP-REL-006 | Preserve prior published artifacts and handle failed publication or corrections without replacing released bytes. | Draft-until-complete publication, identical retry behavior, mismatch rejection and a documented new-version correction path.  | Managed rollback, first-deployment abort and candidate recovery rehearsal.                      |

No GitHub application release has been observed at this amendment's intake. Existing
[local preparation evidence](../validation/p5-preparation.md) and the
[60-case application result](../validation/p4-integration.md) establish local behavior only. Implementation, passing
tests, protected-main execution and actual release publication must each be recorded separately in the
[execution status](../validation/execution-status.md).

## Release eligibility and identity

1. Land the foundation and independently authored test-only baseline through the existing PR controls. Record the
   baseline's actual protected-main squash SHA with unchanged suite tree and fixture manifest. A feature-branch SHA or
   provisional local freeze cannot satisfy shipping eligibility.
2. Validate the actual application revision. Foundation checks and product checks remain mandatory, including the
   complete external local suite through NGINX and the API. Missing, failed, skipped or cancelled checks block release.
3. On an eligible application-bearing push to protected `main`, export the exact tested `linux/amd64` API/frontend
   images and retain their checksums and evidence. Foundation-only and test-only commits retain source delivery but do
   not become application releases.
4. Publish the matching version, tag, release notes and complete verified assets using a dedicated trusted job with
   `contents: write` and `actions: read` for verifying CI evidence. All validation jobs retain `contents: read`;
   deployment credentials are unnecessary.
5. Clearly label the release **not deployed**. Record the CI run, tested source, suite, fixture hash, configuration and
   both image/archive identities. A successful API call requesting publication is insufficient without checking the
   resulting release and assets.

Keep the existing version policy: `0.1.<first-parent ordinal of the tested main commit>`, with tag `v<version>`. Full
history and protected linear main make the ordinal deterministic; gaps are allowed for ineligible commits.
Feature-branch versions from `make prepare-release` remain previews and cannot be published by that local command. The
root tooling package version is not the application release version. No npm package or public container publication is
required.

## Failure, retry and retention

Serialize publication without cancelling a run after it may have created a tag or draft release. Bind each version to
one source revision and one set of bytes. Reuse an identical complete result; reject conflicting tags, source, manifests
or assets. Never force-update a tag or overwrite a different asset to make a retry succeed. An older queued run must not
replace a newer release as the latest release.

Keep incomplete publication as a draft until all required assets are verified. A retained tag or draft alone is not a
successful release. Inspect a failed run and retry the same identity; if content needs correction, merge the correction
and publish a new version. Preserve previously published releases and their artifacts rather than repointing them.
GitHub release assets remain available until deliberately removed; short-lived Actions artifacts are transfer evidence,
not the sole retention mechanism. No automated deletion of old releases is authorized.

The documented local setup and release artifacts provide a reproducible execution path. They do not establish managed
capacity, provider ingress behavior or production safety. Private assessment audio, credentials and local machine paths
must never enter tags, notes, manifests or release assets.

## Deferred managed deployment

APP-V1-014 and the hosted promotion/recovery portion of APP-V1-015 are deferred. The
[provider evaluation](../architecture/deployment.md) and [deployment runbook](../deployment/runbook.md) remain plans for
later work; their requirements do not block the current merge or release-only milestone. Before any future deployment,
revalidate provider fit, credentials, costs, exact artifacts/configuration, full candidate acceptance, production
approval and recovery. Release publication alone never grants that deployment authority.

## Observed V1 completion

The [V1 closure record](../validation/v1-closure.md) verifies all active APP-REL-001–006 criteria at source `ce50762b`
and release `v0.1.6`, including protected-main checks, exact tested assets and an actual identical publisher retry on
2026-10-10. The amendment-intake statements above remain historical. Every future release must satisfy the same checks;
[ongoing triggers and retries](../deployment/release-only.md) document the automatic process. Deferred criteria remain
unexecuted, and no deployment is authorized by this completion record.
