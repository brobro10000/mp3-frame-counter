# hosted-health-v1 independent candidate contract

Dated 2026-10-11. This candidate succeeds **hosted-v1** only through separate protected-main candidate publication,
authenticated binding and genuine product activation under the [transition guide](../acceptance-transition.md).
Authoring is authorized; this contract grants no target, credential, provisioning, deployment or production approval. It
claims no candidate freeze, product acceptance or hosted pass.

## Bounded health-path amendment

Google documents [reserved Cloud Run URL paths](https://docs.cloud.google.com/run/docs/known-issues#reserved-url-paths),
including some paths ending in `z`, and recommends avoiding that suffix. The coordinator observed through the official
authenticated proxy that the protected stage's frontend, documentation and known-count upload were reachable while its
public `/healthz` request received a Google frontend 404. That observation motivates this amendment; it is not a
hosted-suite result produced by this candidate.

HS-17 retains its exact file `hosted/stage/specs/stage-api.spec.ts` and title
`HS-17 public frontend health remains service-local`. Its sole behavioral change is the literal public request from
`GET /healthz` to `GET /health`. Require actual status 200, JSON Content-Type and exactly `{"status":"ok"}` using the
existing assertions. The route remains frontend-local and does not prove sidecar readiness, source or image identity.
All existing requirement mappings for this tuple remain unchanged: `APP-V1-007`, `APP-REL-005`.

The implementation must add `/health` while preserving each service's local `/healthz`. The existing local health
assertions, direct API behavior, independent OpenAPI fixture and served-specification obligations remain unchanged.
Internal startup probes can continue to use `/healthz`; this public-path amendment does not alter their obligations.

Use the actual launcher-approved canonical provider HTTPS origin, normal TLS verification and the existing authenticated
HTTP adapter. Preserve the original response status, headers and body. No localhost/profile proxy, alternate origin,
route substitution, response reconstruction, expected failure, skip, retry or provider-specific fallback may satisfy
HS-17. A reserved-path 404 remains a failure of the original hosted-v1 case, never a passing result. Failure or
incompatibility at `/health` remains a failure of this successor.

## Preserved complete profiles and independent oracle

The [hosted-v1 contract](hosted-v1.md), its normative predecessor contracts, the
[profile protocol](../hosted-profile-policy.md) and [delivery boundary](../../deployment/hosted-delivery-policy.md)
remain normative except for the public request literal and successor revision identities explicitly amended here.
Preserve every other test body, assertion, configuration, fixture recipe, byte sequence, count, size, timing, report
field, credential boundary and cleanup obligation.

Keep exactly the same complete tuple sets and requirement mappings: 72 local cases, 22 stage cases and three production
smoke cases. The predecessor local inventory SHA256 is
`e000044ee3bb6c466876e586c7692ad899c75898a5e0d0d532e1cf9efc65b4b5`. Every local tuple remains mandatory; each hosted
profile also retains its whole predecessor set. Counts do not replace tuple-set comparisons or executed evidence. Local
execution cannot satisfy hosted cases, and production smoke cannot satisfy the stage profile.

In the new suite objects only, manifest, profiles and all three inventories use revision `hosted-health-v1`; their fixed
identity constants and discovery/report revision fields use the same value. The original fixture entries and recipes
remain byte-identical apart from the manifest's revision field. All three discovery directories, fixed configurations,
no-argument local launcher, hosted wrappers, zero retries, timeouts and output paths remain unchanged. No dependency or
lockfile change is authorized by this amendment.

The independent encoded counts remain 9/16/21, and the Xing structural fixture remains two physical frames. Complete
boundary uploads retain the literal size/count expectations and inclusive 20 MiB limit from the predecessor. No product
parser, observed server answer, provider output or private sample creates an expectation.

## Candidate validation and activation boundary

Run the unchanged standalone `npm run check` under pinned Node 24.20.0/npm 11.19.0. Preserve fixture/OpenAPI checks,
original negative controls, transport/docs/hosted controls and exact 72/22/3 discovery. These checks establish candidate
calibration only, with `productAcceptance: false`; discovery executes no application case. Historical predecessor
captures remain original evidence and cannot be relabeled as successor validation.

An intended failure against the reachable old frontend may be observed through its approved local product origin, using
the same status/JSON assertions for `/health` and retaining readiness plus actual response evidence. Label such an
observation as a local candidate health diagnostic, never full product acceptance or hosted execution. An unreachable
target, setup failure or arbitrary hosted proxy cannot establish intended semantic failure. Missing execution
prerequisites remain explicit.

Merge the independent candidate without product, governance or registry changes. A separate authenticated binding must
record its actual squash commit, acceptance subtree, manifest/contract hashes, predecessor and independent reviewed
tree. Binding leaves hosted-v1 required; the next product-affecting change activates this successor. Current consumers
must already support the successor through separately reviewed governance on the trusted base. Candidate or pending
declarations never authorize hosted acceptance or publication.

Historical hosted-v1 source, contracts, manifests and result bytes remain immutable in their original Git objects.
Original release retries retain their original suite; they cannot adopt this amendment. Final V1 delivery requires a
fresh verified release whose original admission selects this successor, genuine complete stage execution, separately
authorized recovery and human approval before every production deployment, followed by complete production smoke and the
existing additive finalization checks. This amendment supplies none of those events.
