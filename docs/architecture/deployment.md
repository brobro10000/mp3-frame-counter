# Managed deployment evaluation

Status: **documented research and conditional proposal**, retrieved **2026-10-09**. No provider selection is approved,
no new service exists and no hosted upload was tested. Scope is three concrete paths only. The recommendation is to
advance **Render: one frontend web service plus one private API service per environment**, subject to the fit/access/
budget gates below. Vercel and Supabase were inspected first through their actual connected read-only tools.

## Account observations

| Provider | Observed metadata                                                                                           | Limits of the observation                                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Vercel   | One accessible team; repository-filtered project query returned zero matches.                               | Team response did not expose plan or membership entitlement. No conclusion about every project or billing eligibility.  |
| Supabase | One organization reports free plan; one unrelated project is INACTIVE.                                      | Do not activate or reuse it. Connection is not authority to deploy or spend. No database/key/secret contents inspected. |
| Render   | No dedicated Render connector was exposed in the available tool inventory. Official docs/API are available. | No account/session/CLI credentials inspected; access is unverified, not impossible. No resources or billing changes.    |

Identifiers and unrelated project names are deliberately omitted from tracked research. The
[Supabase changelog](https://supabase.com/changelog.md) was fetched read-only after the browser fetch failed; the recent
entries included scoped personal access tokens and a status-page change, with no evidence changing the runtime-fit
conclusion below. This is not an exhaustive historical compatibility audit.

## Three-path comparison

| Dimension              | Vercel Services / container Functions                                                                                                                              | Supabase hosted Edge Functions                                                                                                                   | Render prebuilt-image services                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime and images     | OCI/container support now exists; Services combines separately built services. Function limits still apply.                                                        | Hosted Deno-compatible isolate/ESZip function deployment; no documented unchanged Node server plus NGINX image-pair path.                        | Prebuilt Docker images on web/private services; linux/amd64 and immutable image digests supported.                                                                                |
| Upload hops            | Edge → service/function → API function; documented 4.5 MB function body ceiling already fails 20 MiB. Extra service hops do not remove it.                         | Gateway → Edge function; no verified full-path 20 MiB/error-preservation guarantee in reviewed docs. Runtime mismatch already rejects this path. | TLS ingress → NGINX web container → private network → Node container. Provider ingress byte/idle limits and error/buffering behavior remain a P5 fit gate.                        |
| CPU/memory/time        | Function table: Hobby 2 GB/1 vCPU; Pro/Enterprise up to 4 GB/2 vCPU; duration depends on plan. Actual entitlement/idle behavior unverified.                        | 256 MB; CPU 2 seconds/request; free worker wall limit 150 seconds, paid 400; request idle 150 seconds.                                           | Ordinary service resource tiers; size must be approved and measured. Provider article lists Starter 0.5 vCPU/512 MB; no measured workload budget yet.                             |
| Private communication  | Services offers private bindings; custom container Secure Compute/Static IP support remains limited. Not equivalent to a verified two-image private topology here. | Managed gateway/function execution is not the specified private Node container connection.                                                       | Same-region private networking; private API has no public URL. Verify environment isolation, reachability and approved region.                                                    |
| Buffer/temp storage    | No end-to-end no-buffer/no-retention proof obtained; rejected without upload probe.                                                                                | No end-to-end buffering/retention proof obtained; rejected without porting or storage workarounds.                                               | Default service filesystem is ephemeral across deploys; this does not prove request bodies never touch disk/provider buffers. Verify temp paths/memory-backed options and policy. |
| Binary/error behavior  | Function-level 413 can precede app JSON and blocks required valid files.                                                                                           | Gateway behavior and 415/413/502/504 preservation not validated.                                                                                 | NGINX can forward binary requests and normalize controlled errors; real ingress AC-02,07–09,12 must prove it.                                                                     |
| TLS/candidate/recovery | Deployment URLs and promotion exist. Preview promotion can rebuild with production configuration; not proof of same bytes.                                         | Function URLs exist, but the required paired container rollout/rollback contract is not established.                                             | Managed TLS and onrender.com URL for frontend; use one candidate pair and separate production pair. Per-service health/rollback is not atomic pair promotion.                     |
| Eligibility/cost       | Connected plan not returned. Usage-based function costs and spend controls need account verification if reconsidered.                                              | Observed free organization, unrelated inactive project; no V1 component recommended.                                                             | Account, payment, service entitlement and budget unverified. Paid always-on pair is the proposal; no claim of a free private API.                                                 |
| Decision               | Reject unchanged V1 due to payload ceiling.                                                                                                                        | Reject unchanged V1 due to runtime/image mismatch; possible future data/auth only.                                                               | Conditional preferred candidate; approve only after unresolved gates are addressed.                                                                                               |

Primary evidence, read 2026-10-09:

- Vercel [container support and inherited limits](https://vercel.com/kb/guide/does-vercel-support-docker-deployments),
  [function limits](https://vercel.com/docs/functions/limitations), [Services](https://vercel.com/docs/services), and
  [promotion behavior](https://vercel.com/docs/deployments/promoting-a-deployment).
- Supabase [runtime limits](https://supabase.com/docs/guides/functions/limits) and
  [hosted architecture](https://supabase.com/docs/guides/functions/architecture), also retrieved through documentation
  search. No request-body ceiling is inferred from the separate 20 MB bundled-function-size limit.
- Render [prebuilt images](https://render.com/docs/deploying-an-image),
  [web service/TLS/ports](https://render.com/docs/web-services),
  [private service](https://render.com/docs/private-services),
  [private networking](https://render.com/docs/private-network),
  [deployment lifecycle](https://render.com/docs/deploys), [rollbacks](https://render.com/docs/rollbacks), and
  [free-service constraints](https://render.com/docs/free).

Vercel static hosting plus an external API is not the selected path: it would depart from deploying both runtime images
and needs a separately reviewed same-origin forwarding or CORS design. Do not silently insert a function-sized upload
gateway. No provider may be made to fit by reducing 20 MiB, chunking to storage, changing runtime, parsing in the
browser or adding a framework.

## Render fit and cost gates

The reviewed official Render pages did not establish an authoritative per-hop request-body ceiling, request idle limit
or no-buffering guarantee for this exact topology. Absence of a documented ceiling is not evidence of unlimited size.
Before cloud-specific implementation, obtain account/region/price eligibility and an authoritative ingress assessment;
if a contract-critical property cannot be documented, seek explicit authorization for a bounded candidate probe under an
approved budget. No production approval follows from that probe authorization.

Before accepting the provider, the controlled candidate must demonstrate valid >1 MiB, around 6 MiB and exact 20 MiB
uploads, usable +1 and chunked over-limit 413s, raw-byte fidelity, JSON preservation, abort cleanup, controlled 502/504,
timeouts, private upstream routing and resource behavior. Inspect configuration/operations for buffering/temp storage,
redacted logs and no retained uploads; external success alone cannot prove them. Reject a failed mandatory contract.

For budgeting only, Render's [published compute example](https://render.com/articles/render-vs-railway) lists Starter at
$7/month for 0.5 vCPU/512 MB. Four always-on instances (two candidate, two production) would be **$28/month compute
only**, an arithmetic estimate, not an approved quote or measured sizing recommendation. Verify current
[pricing](https://render.com/pricing), private-service eligibility, workspace fees, egress, build/registry charges and
taxes before spending. The pricing page's retrieved text did not expose its complete rate table. Keep one replica per
service initially, no automatic scaling, bounded candidate lifetime and owner-approved cost alerts/stop procedure.
Platform build spend controls are not assumed to cap every category of service cost.

## Environment bindings

| Environment | Frontend binding                                              | API binding                                                                              | Identity and checks                                                                            |
| ----------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Local       | Loopback host port → NGINX :8080                              | Compose api:3000, no default host port                                                   | Local image IDs/digests and reviewed baseline; full applicable acceptance.                     |
| Candidate   | Trusted provider-returned HTTPS URL for candidate web service | Explicit private candidate service hostname/PORT in the same approved region/environment | Both artifact/deployment IDs, config identity, full suite including boundary cases.            |
| Production  | Explicit approved production frontend URL                     | Explicit private production API hostname/PORT                                            | Exact tested artifacts, reviewed environment differences, production approval and small smoke. |

Never populate candidate upstream with production DNS or vice versa. Browser requests stay relative; provider-specific
hostnames/configuration never enter parsing code. Set the frontend listen port explicitly for the provider (Render
expects PORT and can be configured); do not rely on accidental port detection. Restrict peer network access where the
plan supports it; private service reachability is not application authentication.

## Artifact, rollout and recovery policy

Identify both images by immutable digest, plus actual provider service/deployment IDs and nonsecret configuration
revision. Source SHA alone is not binary identity. Retain current and prior-good images: Render pulls from the registry
again for deployment/recovery and cannot restore deleted images. Registry credentials are scoped and private, not in
image URLs or Git.

No atomic two-service switch is assumed. [The runbook](../deployment/runbook.md) proposes backward-compatible API-first,
frontend-second promotion and reverse restoration, with a stop after any partial failure. Both API versions must support
old/new frontend overlap; otherwise promotion is blocked until an explicitly reviewed maintenance/switch procedure. A
first release has no prior-good pair: withdraw exposure and stop safely, rather than claim rollback succeeded.
