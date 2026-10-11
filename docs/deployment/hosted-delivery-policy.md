# Hosted delivery boundary and dormant IaC admission

**V1 scope amendment, 2026-10-11:** [bounded delivery](v1-delivery.md) permits only the explicitly listed service-scoped
probe/stage IAM memberships in runtime. Federation and cost authority stay in access; product/governance admission
remains separate. Earlier exclusions below remain applicable outside that narrow amendment.

Dated 2026-10-10. This is the HOSTED-DELIVERY-POLICY / LINE-03 decision, under the owner's
[roadmap authority](../phases/roadmap-execution-authorization.md). It preserves the
[hosted-profile protocol](../testing/hosted-profile-policy.md), all 72 required local cases and separate human approval
for every production application deployment. It grants no target, credential or deploy authority to acceptance metadata.
The
[phase card](../phases/next-iteration.md#pr-card-1--hosted-delivery-policy--line-03-open-the-hosted-delivery-release-envelope)
fixes ownership, independent expectations and completion gates. PR #26's publication prerequisite is complete at
[v0.2.26](../phases/next-iteration.md#profile-declarations-protected-main-completion); this policy still requires its
own exact-head checks, review and actual-main publication.

## Release line and exact future IaC paths

Select line `0.3` through the existing source-bound `release-policy.json`; retain global first-parent ordinal
allocation, legacy retry bytes, numeric latest selection and refusal of ordinary `1.*`. This is the planned
hosted-delivery envelope, not a claim that the release is deployed. The publisher determines the actual version from
actual merged source.

Reserve only the following literal filenames in acceptance admission. No infrastructure file is created in this card.

| Exact future path                         | Admission class | Responsibility                                                                              |
| ----------------------------------------- | --------------- | ------------------------------------------------------------------------------------------- |
| `infra/cloud/access/versions.tf`          | governance      | Pinned providers and protected backend for access/registry resources.                       |
| `infra/cloud/access/variables.tf`         | governance      | Scoped project, identity and registry inputs.                                               |
| `infra/cloud/access/main.tf`              | governance      | Federation, scoped identities/IAM, registry and protected state resources; no app revision. |
| `infra/cloud/access/outputs.tf`           | governance      | Nonsecret resource/identity bindings.                                                       |
| `infra/cloud/access/.terraform.lock.hcl`  | governance      | Exact access-root provider lock.                                                            |
| `infra/cloud/runtime/versions.tf`         | product         | Pinned providers/backend for application revisions.                                         |
| `infra/cloud/runtime/variables.tf`        | product         | Exact image pair, configuration and environment inputs.                                     |
| `infra/cloud/runtime/main.tf`             | product         | NGINX/API service pair and configuration; no IAM/federation/cost policy.                    |
| `infra/cloud/runtime/outputs.tf`          | product         | Service/revision/configuration observations.                                                |
| `infra/cloud/runtime/.terraform.lock.hcl` | product         | Provider selection for application deployment.                                              |

Names are case-sensitive; no directory, extension or wildcard allowance. Extra files, modules, scripts, state, plans and
variable-value files remain unclassified/forbidden. Keep private inputs and state ignored. Historical cost-bootstrap
files retain their existing scope and evidence. A later additional filename needs its own reviewed amendment.

This classification cannot parse Terraform semantics. Later source/plan review must reject application configuration
hidden in access files and IAM/federation/cost authority hidden in runtime files. Product plus governance remains
forbidden in one admission. Access changes cannot activate a pending successor; genuine runtime changes do, and cannot
precede candidate binding. Candidate/binding-only restrictions and persistent successor applicability remain unchanged.

## Fixed commands and ownership

Ordinary standalone `e2e` remains complete local. The successor may add only fixed `e2e:stage` and `e2e:production`
commands mapped to `node scripts/run-stage.ts` and `node scripts/run-production.ts`; no arbitrary arguments, filters,
profiles, URLs or executable overrides. Fixed separate configurations discover local, stage and production inventories
without running test bodies or reading target credentials. Candidate controls are never product/hosted acceptance.

The trusted root launcher chooses the eligible immutable release/suite and approved environment from verified evidence,
observes provider identity and passes the fixed role input. It invokes pinned npm directly without a shell using
`--ignore-scripts run e2e:stage` or the fixed production counterpart. Verify package/script/lock identities, install the
approved suite and prepare its pinned browser before acquiring a token. Suppress npm pre/post hooks and inherited cloud,
GitHub, proxy, tracing/debug, `NODE_OPTIONS` and npm-override environment values.
[npm's run behavior](https://docs.npmjs.com/cli/v11/commands/npm-run/) distinguishes explicit scripts from lifecycle
hooks.

The suite owns behavior and complete execution rows. The launcher owns publisher/provider authentication, destination,
configuration projection, before/after observations, original-run provenance and final evidence assembly. A suite cannot
mint deployment or human approval, select an older contract or supply its own provider observation as trusted evidence.
Keep existing software publication and immutable retries unchanged; the later hosted consumer must replace the legacy
promotion helper's equal-count/self-asserted-approval assumptions coherently.

## Bounded launcher-to-suite interface

The following is the selected data/ownership interface, not an implemented launcher. Types retain the exact meanings in
HostedAcceptanceV1. All keys are required and objects closed; parsed JSON semantics apply, with no raw duplicate-key
claim. `Hex64` is 64 lowercase hexadecimal characters. `launchId` is random correlation, not authorization.

```text
HostedSuiteInputV1 = {
  schemaVersion: 1, kind: "hosted-suite-input", profile: "stage" | "production",
  launchId: Hex64, sourceRevision: GitSha,
  suite: { commit: GitSha, tree: GitSha, fixtureManifestSha256: Sha256,
           profilesSha256: Sha256, inventorySha256: Sha256 },
  target: Observation, audience: HttpsOrigin,
  credential: { kind: "google-id-token", value: BoundedJwt, expiresAt: UtcInstant }
}
HostedSuiteResultV1 = {
  schemaVersion: 1, kind: "hosted-suite-result", profile: "stage" | "production",
  launchId: Hex64, sourceRevision: GitSha,
  suite: { commit: GitSha, tree: GitSha, fixtureManifestSha256: Sha256,
           profilesSha256: Sha256, inventorySha256: Sha256 },
  inventory: CaseRef[], tests: Execution[],
  status: "passed" | "failed" | "blocked", cleanup: "passed" | "failed" | "not-run"
}
```

Each wrapper has its role compiled into its entrypoint. Validate that role against input profile/environment and the
actual extracted suite bytes before connecting. Accept one strict UTF-8 JSON object, without BOM/trailing data, at most
64 KiB actual stdin bytes and EOF within five seconds. Token value is at most 16 KiB, without whitespace/control
characters. Bound execution to 15 minutes plus 30 seconds cleanup; require lifetime through that interval plus 60
seconds. No refresh channel or retry that replays upload bodies. JWT decoding alone is not token provenance: the trusted
launcher acquires it from the authenticated minting response for the exact provider-derived receiving-service audience.

Initial destinations are canonical provider-returned HTTPS service origins only: no arbitrary URL, custom domain,
traffic-tag URL, localhost proxy or suffix-only identity check. Require approved revision, full intended traffic, paired
registry digests and reviewed configuration; observe before and after. Use scoped invocation identity and
`X-Serverless-Authorization`, never a Google API access token as the invocation token.
[Cloud Run invocation authentication](https://docs.cloud.google.com/run/docs/authenticating/service-to-service)
describes service-audience ID tokens and the separate invocation header. Never log even the header after provider
processing.

The parent creates an owned random 0700 directory outside checkout/artifact trees and passes only its nonsecret path.
Stdin carries the credential, never argv/environment values. The wrapper creates a fixed input file exclusively at 0600
without following symlinks; workers validate owned regular file/parent identity, permissions and bounds before reading.
No secret enters page JavaScript, cookies, storage, default reporters, raw exception output, trace/HAR/video or
artifacts. Bound and discard child output; retain only closed sanitized rows and fixed failure codes. Stop/reap children
before deleting private files. Parent cleanup failure prevents a passing envelope. Same-UID/root isolation is not
provided by file modes; execute on an isolated runner.

Write a bounded result through the wrapper's fixed owned result path in its extracted package, never a caller path. The
complete inventory must equal authenticated profile data. Passing requires each tuple exactly once, expected and actual
status passed, zero retries and cleanup passed. Failed results may contain a unique known subset; blocked results
contain no executions. A stale launch/source/suite, malformed/missing report or extra row cannot pass. The trusted
parent adds its own post-observation and combines parent/child cleanup before assembling HostedAcceptanceV1. The result
alone is never a valid hosted release gate. Preserve actual failed/drifting observations rather than inventing matching
ones.

## AUTH-ADAPTER: browser fidelity and credential confinement

Direct HTTP derives fixed relative paths from the approved origin, validates exact origin before attaching credentials,
uses normal TLS verification and refuses automatic redirects. Preserve real HTTP/1.1 chunked/abort capability and record
client framing without claiming the provider forwards chunks unchanged. Only a separately asserted canonical redirect
may be inspected; follow-up is an independent request to the known route, not the returned Location.

Browser helpers must own fresh contexts/pages and preserve actual response bodies, statuses and security headers,
including duplicate policies. No global auth headers, `bypassCSP`, TLS bypass or response rewriting. Block service
workers and WebSockets; detect foreign attempts before sending credentials, including redirects, iframes and popups.
Tests use canonical `/` and `/docs/`. Existing local docs helpers create their own contexts and HTTP requests; do not
silently reuse them as authenticated adapters. Reuse pure assertions behind the separately reviewed hosted boundary.

The first synthetic pinned npm/Playwright probe proved stdin/private-file transport and bounded cleanup, but the
proposed `route.fetch`/`fulfill` adapter collapsed duplicate CSP/security headers. Its combined CSP/service-worker
assertion also failed without enough captured detail to diagnose the cause. That adapter is not adopted. Retain those
failed records; no hosted acceptance or provider claim follows from them.

The separately reviewed CDP probe passed 26 bounded loopback controls with pinned Playwright 1.64.0 and Chromium
156.0.8078.4. Adopt its fixed, single-owned-page mechanism for candidate authoring: create a CDP session before
navigation, validate every request origin/ownership, replace authentication headers per request, intercept responses,
refuse redirects with Location, and continue original responses without replacement fields. A credential-free context
guard blocks foreign/unowned/unknown-owner requests; block service workers and every WebSocket. Fresh contexts are
required for isolated cases. Do not broaden this to arbitrary popups, workers or cross-origin frames.

[CDP Fetch](https://github.com/ChromeDevTools/devtools-protocol/blob/master/pdl/domains/Fetch.pdl) documents per-hop
request overrides and the experimental response-continuation command. The pinned protocol needs actual Linux and HTTPS
compatibility controls before candidate freeze; successful macOS loopback observations alone are insufficient.

The integration contract adds a sanitized terminal failure latch for guard/CDP errors and forbidden attempts, bounded
paused-request deadlines, and callback draining through cleanup before classification. A blocked foreign attempt still
fails a normal acceptance case. Owned negative controls may expect that failure but cannot become hosted acceptance.
Disable Node-parent and worker protocol debugging/custom loggers, inherited debug-file settings, HAR/tracing and raw
request/event/exception serialization: protocol messages contain injected headers. Browser-child environment filtering
alone is insufficient. Preserve response/header/CSP comparisons, explicit redirect-receiver counters, effective worker
controls, full upload/docs assertions and token-free failure artifacts. No unsupported provider capability may be
skipped.

AUTH-ADAPTER's design prerequisite is resolved for bounded candidate authoring, with these executable controls required
before freeze. Actual Google token provenance/audience/expiry, IAM, ingress and stable environment identity remain
separate ACCESS-01/HOST-01 gates. The [validation record](../validation/hosted-delivery-policy.md) preserves failed
probes and finite coverage; no hosted pass or credential-isolation guarantee is claimed.

## Later authority gates

This card changes no workflow, job, trigger, token permission or publisher command. Existing guards still reject extra
jobs/workflows/permissions. A later active delivery change must coherently migrate both workflow and publication guards
with independent expectations and exact source/run/admission handoff. Use a dependent path from verified publisher
output; a release created by GITHUB_TOKEN does not itself establish a new release-event workflow run.

Before billable resources, freshly verify the dedicated USD 75 shared Cloud Run cap and USD 100 project alert budget. A
later access/root state plan must pin provider/backend, numeric repository/owner and workflow/environment federation
conditions, narrowly scoped observer/invoker/deployer/runtime identities and protected recovery retention. No static
service-account key, production privilege on PR jobs, cost-control permission on deployers or cap increase is authorized
by these path reservations.
[Google federation guidance](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines)
requires reviewing actual external claims and conditions rather than trusting repository names alone.

Stage delivery is authorized only after exact-image handoff, configured access/cost controls and hosted launcher
readiness. Every production application deployment, including authenticated/no-traffic candidates, needs the separate
human event bound to source, pair, configuration, resource, exposure and recovery evidence. Verify native approval
entitlement; if unavailable, use the reviewed owner-invoked fallback and disclose its process limitation. The
coordinator and companion must not invoke that human operation. Hosted success and additive finalization remain
prerequisites for `v1.0.0`.
