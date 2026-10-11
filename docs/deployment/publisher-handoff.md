# Publisher handoff contract and independent expectations

Technical contract adopted 2026-10-10 under the existing roadmap execution authority, after HOSTED-EVIDENCE published
v0.3.30. The active PUBLISHER-HANDOFF card owns emission and transport bindings only. Independent expectations must be
reviewed and frozen before separate implementation. This does not authorize deployment or a historical consumer. Root
adopts the exact receipt-log trust anchor, 90-day requested retention and fail-closed missing-evidence rules below.

## Recommended minimum and authority boundary

Add one publisher-only Actions artifact and one fixed receipt step after verified release publication. Preserve all ten
release assets, their existing bytes, reservation rules and publication order. Keep the current three mandatory jobs,
main-only publisher condition, contents:write/actions:read permissions and no-install publisher. There is no deployment
job.

Artifacts carry durable bytes; step/job outputs carry same-run locators. Neither a handoff's own hash nor its filename
establishes who produced it. The documented artifact response has run/head/repository identity and a digest, but no job
ID or attempt. Deletion/recreation under the same name therefore requires an exact ID binding from the publisher, even
when an expected upload step succeeded. This is an inference from the published response schema, not a claim that names
provide provenance. [GitHub artifact API](https://docs.github.com/en/rest/actions/artifacts?apiVersion=2022-11-28)

Recommended closure: a fixed receipt command reads only the exact upload-action outputs and original fixed handoff
bytes, then emits one bounded machine line in its own successful step. Historical authentication retrieves that exact
publisher attempt/job/step through authenticated GitHub APIs. The receipt binds artifact ID, archive digest and raw
handoff digest. A replacement artifact gets another ID and cannot inherit the receipt. This trusts the reviewed workflow
and pinned publisher code running under GitHub's job attribution; it is not an artifact attestation or protection
against GitHub/repo administrators compromising that trust. Do not add attestations/OIDC permissions or treat
actions:read as an assertion that other jobs lack artifact-runtime credentials.

## Closed records and APIs proposed for adoption

Use parsed ordinary JSON, exact own enumerable keys, finite safe integers and existing lowercase SHA grammars. Reject
unknown/missing fields, coercion and null substitutions. No custom JSON parser or object-prototype hardening project.
Both exports perform deterministic validation, return fresh deeply frozen data, mutate no input and do no ambient I/O.
No public API accepts authenticated/approved/deployable booleans, arbitrary URLs, CLI authority or a profile selector.

1. `createPublisherHandoff(input) -> PublisherHandoffV1`. Input is exactly
   `{ originalContext, admissionSha256, publisherContext, repository, release }`. Output contains exactly those five
   fields plus `schemaVersion:1`, `kind:"publisher-handoff"`, `status:"released-not-deployed"`, `deployed:false`. It is
   consistency evidence until externally authenticated.
2. `createPublisherReceipt({ handoffBytes, artifactId, artifactSha256 }) -> PublisherReceiptV1`. Require Uint8Array
   bytes (including Buffer), strict UTF-8 without BOM, at most 64 KiB, parse/validate the same handoff schema and
   compute SHA256 of those actual bytes. Require positive safe artifactId and lowercase 64-hex artifactSha256. Output is
   exactly
   `{ schemaVersion:1, kind:"publisher-handoff-receipt", repository, sourceRevision, runId, attempt, artifactId, artifactName, artifactSha256, handoffSha256 }`;
   repository here is the original OWNER/REPO string. All context/name fields derive from the validated handoff. No
   caller-provided digest can replace handoffSha256.

`originalContext` is the existing admission's complete closed context, copied without changing any value:
`repository,eventName,ref,sourceRevision,sourceTree,baseRevision,workflowRevision,toolingRevision,runId,attempt`.
Require push/main, workflowRevision=sourceRevision, toolingRevision=baseRevision. The admission digest comes from the
independent product-preflight handoff already checked by verifyReleaseBundle, never from record.sha256 alone.
`publisherContext` is the exact existing publicationContext result, including schemaVersion:1 and fixed workflow path;
all overlapping original fields must agree, with only publisherContext.attempt allowed to be >= originalContext.attempt.
The producing job is the fixed `publish-release` workflow job, verified externally; do not invent its numeric job ID
from env. `repository` is exactly `{ id, ownerId }`, positive safe IDs obtained from the existing authenticated
repository GET. The later consumer must pin expected repository identity in trusted configuration; these self-declared
IDs are not authority.

`release` is exactly `{ id, version, tag, reservationSha256, publicationSha256, publicationBindingSha256, assets }`.
Version/tag must match the verified manifest and existing version grammar; id is the observed published release ID.
reservationSha256 retains manifest.reservationSha256, the canonical reservation identity digest. The reservation.json
asset row separately binds that file's raw bytes. publicationSha256 hashes actual verified publication.json bytes;
publicationBindingSha256 retains the existing canonical-record binding. They are distinct representations, not aliases.
`assets` is exactly ten ASCII-name-sorted rows `{ id, name, bytes, sha256 }`, unique positive safe IDs, positive safe
byte counts and raw SHA256 values. Its exact name set is the current eight preparedAssetNames plus publication.json and
publication-notes.md. Each row comes from the verified GitHub uploaded asset object, cross-checked against expected
bytes; publication.json's row must equal publicationSha256. Do not embed archives, credentials, registry/deployment
claims or URLs.

The builder's source caller must also cross-check the full original context/digest against the already verified bundle,
reservation against the manifest, and all release fields against the observed final publication result. A parsed record
cannot establish these relationships merely by copying its own values. Do not rerun a second resolver or profile walk. A
future consumer obtains the admission record from the bound e2e-result.json, verifies it using this externally
established original context/digest, then calls the existing required projection with unchanged source/base. That
consumer and its authenticated network reader remain a separate card; this PR establishes emission and transport
bindings only.

## Publisher integration and exact outputs

Retain the verified repository numeric IDs and asset IDs during publishRelease's existing observations. Extend its final
success result narrowly with the metadata needed above; keep all existing result fields. Only after tag, ten assets and
published release metadata have passed existing checks may the CLI create the handoff and publish its outputs. A draft,
partial/mismatched upload or failed final publication must produce neither a handoff file nor readiness output. Existing
legacy/schema-1 publication byte goldens remain valid; do not retrofit a handoff onto releases without original
admission.

The existing three-argument `publishRelease(bundle, api, generatedDirectory)` API retains every existing result field
and adds exactly `repository:{id,ownerId}`, `reservationSha256`, `publicationSha256` and ASCII-name-sorted
`assets:[{id,name,bytes,sha256}]`. Repository/asset identities come from the already verified GitHub observations and
hashes from the actual fixed bytes; input claims cannot supply those observations. The CLI derives original context and
the independently checked admission digest from its verified bundle. No callback or new authority input is introduced.

Write exactly `.artifacts/publisher-handoff/handoff.json`, a regular owned file, no symlink traversal; exclusive
creation or byte-identical reuse only, mode0600 in a private directory. Serialize fixed-order pretty JSON with a
trailing newline; exclude generatedAt/current clock so an identical attempt creates identical JSON. Capture hashes from
actual bytes. Add publisher step id `publish-release` to the existing named publication step. Its GITHUB_OUTPUT entries
are exactly `handoff-ready=true`, `handoff-sha256=<raw hash>` and
`handoff-artifact-name=publisher-handoff-<sourceRevision>-<runId>-<publisherAttempt>`. Do not interpolate raw response
values into shell commands; only validated single-line types enter GITHUB_OUTPUT.

Add step id `upload-publisher-handoff`, name `Upload verified publisher handoff`, immediately afterward, guarded by
`${{ steps.publish-release.outputs.handoff-ready == 'true' }}`. Reuse the existing immutable upload-artifact SHA:
`cf430e030ddbb5b0abf93d22962f4752f3646cd9`. Exact inputs: the publisher's artifact-name output, the literal file path
above, archive:true, compression-level:0, if-no-files-found:error, overwrite:false, retention-days:90,
include-hidden-files:true. Only that file is uploaded; never `.artifacts/*` or a caller path. The action produces
artifact-id/artifact-digest; its pinned implementation obtains those outputs from the upload response.
[Pinned upload implementation](https://raw.githubusercontent.com/actions/upload-artifact/cf430e030ddbb5b0abf93d22962f4752f3646cd9/src/shared/upload-artifact.ts)

Add step id `publisher-handoff-receipt`, name `Record verified publisher handoff receipt`, immediately after upload with
normal success semantics, command `node scripts/publisher-handoff.mjs`, no arguments and no publication token. The CLI
requires the fixed job/main-push context, matches it exactly to the stored publisherContext and reads its fixed file.
HANDOFF_ARTIFACT_ID and HANDOFF_ARTIFACT_SHA256 come only from the upload step, HANDOFF_SHA256 only from the publication
step. Compare the latter to the actual file hash. Emit exactly one `PUBLISHER_HANDOFF_V1 <compact receipt JSON>` line
after all checks, and receipt step outputs `handoff-ready=true`, `handoff-artifact-id`, `handoff-artifact-sha256`,
`handoff-sha256`. No other step may emit this marker. The publisher job exposes exactly those four outputs from the
receipt step; absent/failed receipt yields no usable ready signal. Downstream execution must require the job's success
as well as these values, never ready alone.

The ZIP artifact digest differs from the inner JSON digest. Explicit archive:true avoids relying on the pinned action's
new single-file archive:false mode, which ignores name. overwrite:false refuses duplicate names; immutable content can
still be deleted, and a new upload then has another identity. The exact file under a hidden directory needs explicit
include-hidden-files:true.
[Pinned action contract](https://raw.githubusercontent.com/actions/upload-artifact/cf430e030ddbb5b0abf93d22962f4752f3646cd9/action.yml)

## Historical authentication, retries and expiry

The future trusted reader, not a CLI user or artifact body, supplies expected repository/source/release/run identity.
Authenticate official api.github.com responses and the exact reviewed workflow/script bytes at sourceRevision. Then:

1. Fetch the selected original validation attempt and its jobs, never unqualified latest jobs. Match original context,
   main push, repository/workflow/source; require all three existing mandatory jobs and both exact preflight steps to
   have succeeded. Replay admission later against original source/base/tree and original attempt. Require the original
   source to remain in the intended protected-main lineage; do not silently use current main as the original base.
2. Fetch the selected publisher attempt in the same run, its unique publish-release job and the exact publication,
   upload and receipt steps. Require completed/success and expected ordering; publisher attempt must not precede the
   original validation attempt. The publisher job/attempt being authenticated is the handoff's producing attempt, not
   necessarily the older attempt named in publication.json's ci origin. Reject another workflow/job or ambiguous steps.
3. Retrieve that receipt step's authenticated log and require one exact marker with closed bounded schema. Match its
   context to the publisher attempt and source. Authenticate the artifact by that exact receipt artifactId, not name
   search alone; check name, repository/head repository IDs, run ID, branch/head SHA, size bound, non-expiry and digest.
   Download/hash the <=256 KiB archive, then read exactly one regular `handoff.json` <=64 KiB; reject extra entries,
   traversal/symlinks/duplicate entries and malformed UTF-8/JSON. Compare raw JSON SHA to the receipt and replay its
   schema.
4. Re-observe release ID, exact tag target, non-draft/non-prerelease status and all ten current asset
   IDs/names/sizes/hashes. Fetch needed raw metadata and verify the recorded hashes, including publication.json,
   manifest/reservation and E2E admission. Replaced asset IDs, changed bytes or missing evidence fail. Metadata-only
   checks do not verify image archives or registry transfer; those remain explicit later gates, with no deployment
   readiness claim here.

The artifact digest binds contents, while the authenticated receipt binds producer and ID. Artifact create times may be
sanity checks, never the primary association. Historical job outputs are not documented in the jobs REST response;
outputs are useful for needs-based same-run transfer, but are insufficient as this historical record.
[Job outputs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/pass-job-outputs),
[attempt/job/step-log APIs](https://docs.github.com/en/rest/actions/workflow-jobs?apiVersion=2022-11-28)

Recommended retry rule: original validation attempt1 plus a successful publisher attempt3 is valid only after the latter
re-verifies the exact original bundle. Keep origin/admission/publication/reservation bytes at attempt1; handoff and
receipt accurately name publisher attempt3 and get a new attempt-specific artifact name. An earlier failed publisher
need not be relabeled successful. Same-attempt name collision fails; no delete/overwrite fallback. A release may already
be published when handoff upload/receipt fails; report publication separately and do not claim accepted handoff. A later
retry may create a new handoff after existing release re-verification without mutating its ten assets. Rebuilt/rebound
bundles remain forbidden. Do not manufacture a new origin to make a historical retry pass.

Require exact chosen attempt; no automatic search for a convenient successful/older attempt. A failed later rerun does
not rewrite a prior accepted receipt, but does not authorize selecting that prior attempt either. The trusted consumer
must explicitly pin which accepted receipt it uses. No historical handoff exists for sources predating this publisher.

Use explicit 90-day retention for the tiny artifact, subject to repository retention; no settings change is authorized.
GitHub's actual expires_at/expired and availability govern. Missing/expired/deleted artifact OR authenticated receipt
log means no accepted historical handoff. Do not reconstruct authority from release JSON or local saved output. Ordinary
same-run retry remains bounded by availability of the original prepared bundle (currently seven days); longer-term
reconciliation/backfill needs another adopted scope. The original ten release assets remain unchanged and independent of
Actions retention.
[Artifact expiry/download contract](https://docs.github.com/en/rest/actions/artifacts?apiVersion=2022-11-28)

## Minimum independent fixture matrix before implementation

Literal unequal hashes/IDs and two distinct attempts must be independently authored; positive counterparts reach every
intended decision. Synthetic GitHub observations establish test assumptions only. Preserve first real availability red.

| Boundary                                 | Minimum positive and negative controls                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Closed builder                           | Exact literal record; fresh deep freeze/nonmutation; unknown/missing/null/wrong types; unsafe IDs, invalid SHA/version/tag; no clock/env/files/network at import or pure calls.                                                                                                                                                         |
| Context/digest custody                   | Equal original/publisher attempt and original1/publisher3; wrong source/base/tree/workflow/repo/run, publisher older; coherent altered admission plus its own digest still refused by the external product digest at the caller.                                                                                                        |
| Publication material                     | All ten literal distinct asset rows and observed IDs; wrong/missing/extra/duplicate name or ID, partial state, mismatched size/hash; raw publication SHA versus canonical binding deliberately different; raw reservation versus canonical identity distinct.                                                                           |
| Publication ordering                     | Existing successful new release and exact-byte reuse; every existing failed draft/tag/asset/final-publication path has no handoff-ready/file; upload failure leaves release intact; no eleventh release asset or altered publication bytes.                                                                                             |
| Receipt and outputs                      | Actual raw file SHA, typed artifact ID/digest and fixed derivation; whitespace-sensitive hash; mutated file after publication, caller hash substitution, malformed/oversize UTF-8, bad IDs/newlines, missing output channel/job/context rejected before marker/ready.                                                                   |
| Workflow binding                         | Exactly one pinned uploader and receipt in publisher after publication; exact env/output references and fixed file; reject moved uploader, wider globs, overwrite/continue-on-error/always, mutable pin, token in receipt, new permissions/job or outputs from another step.                                                            |
| Retry and collisions                     | Same original ten bytes with publisher attempt3; different per-attempt handoff name; same-attempt conflict preserved; attempt/source replacement, new reserved bytes or stale file cannot become ready.                                                                                                                                 |
| Historical verifier contract, later card | Successful exact step receipt plus matching ID/digests; same-name replacement ID, other-job upload, swapped attempts, duplicate marker/steps, skipped publisher, expired/missing evidence, archive tricks and changed release assets all refuse. These are deferred executable reader tests, not this PR's claimed authentication pass. |

The emission tests must use the actual fixed receipt CLI in a credential-free subprocess as well as pure API calls. Use
recorded fake GitHub adapters for publisher failure ordering; no cloud/provider or real Actions artifact operations.
Existing publisher tests need only independent added observed-ID fields and new handoff assertions, preserving prior
assertions and literal publication goldens. Tests and workflow guard expectations freeze before separate implementation.

## Exact scope and remaining reader compatibility check

Proposed executable paths: new `scripts/publisher-handoff.mjs` and `.test.mjs`; existing `scripts/publish-release.mjs`,
`scripts/publish-release-evidence.mjs` (requireReleaseWorkflow only unless a shared small validator is justified),
`scripts/publish-release.test.mjs`, `.github/workflows/ci.yml`, and `package.json` (one explicit test:tooling entry
only). `scripts/policy.mjs` already delegates publisher details to requireReleaseWorkflow; no change is presently
necessary. Root owns adoption/phase/validation prose. No release-manifest/bundle/preparation schema or asset list
changes, resolver, source reader, suite, product, deployment consumer, new dependencies, runtime settings or
infrastructure changes.

The receipt-log trust anchor and 90-day/fail-closed expiry rule above are adopted for this unit. One official API detail
needs a narrow real compatibility check when a historical reader is separately scoped: the new step-log endpoint
describes step_number as zero-based, while the job examples show steps.number starting at one. Do not silently guess the
mapping or fall back to scanning arbitrary whole-run logs. Producer receipt emission does not depend on resolving that
indexing discrepancy. A bounded selected-job/step log adapter, signed redirect host policy (no credential forwarding),
archive reader and real authentication observations belong to that later reader scope. The receipt marker also avoids
depending on mutable human-readable upload-action log wording. This draft has not proven live retrieval.

This design derives from bounded source reads and primary documentation. Its historical-reader algorithm is proposed,
not implemented or live-verified by this card. No fixture, handoff or software release grants hosted target/credential
authority or production deployment approval.
