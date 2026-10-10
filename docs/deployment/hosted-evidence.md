# Pure hosted evidence contract

Adopted 2026-10-10 for **HOSTED-EVIDENCE**, after PR27 published v0.3.27 from exact protected-main source
`a98a434570a934831c64a64d3231950f27574b43`. This dormant governance interface is implemented with independently authored
expectations; [validation records](../validation/hosted-evidence.md) distinguish local checks from pending integration
and publication. The existing [profile protocol](../testing/hosted-profile-policy.md) and
[delivery boundary](hosted-delivery-policy.md) remain authoritative. No schema, source reader, release consumer or
production permission changes here. Matching supplied facts proves consistency, never their authenticity.

Independent design review found no actionable contradiction under the following normative root decisions:

- Null expected target requires null suite result, wrapperOutcome=not-run and a nonpassing envelope. The suite-result
  validator always rejects null expected target; a failed wrapper with no result still requires a known target.
- A passing suite may yield a conservative failed envelope for an external failure. Preserve actual observations; do not
  add a reason field or claim that validation success means status=passed.
- Apply the matrix below with its overriding wrapper/cleanup rules. Aggregate cleanup exactly as failed, then not-run,
  then passed. Do not manufacture rows or a result for a missing output.
- Raw immutable declaration projection remains future trusted-launcher ownership; no source-reader API change is
  included. Source, provider, registry, lifecycle and human approval authentication remain outside these pure helpers.

## Files and API

This card owns only new scripts/hosted-evidence.mjs and scripts/hosted-evidence.test.mjs, plus package.json's explicit
tooling registration when the card is adopted. Existing resolver/profile modules, frozen suite, release-manifest.mjs,
publisher/preparation/retry paths and workflows remain unchanged. No CLI, filesystem, Git, network, process,
environment, clock, credential, callback or provider dependency. Both exports synchronously validate parsed JSON-data
objects, return fresh deeply frozen copies, preserve input arrays/values, and never mutate caller inputs:

```text
validateHostedSuiteResult({ result, expected, launchId }) -> HostedSuiteResultV1
validateHostedAcceptance({ record, suiteResult, expected, launchId,
                           wrapperOutcome, observations, parentCleanup }) -> HostedAcceptanceV1
```

All argument objects are closed. launchId is Hex64, bound to the one original admitted launch. suiteResult is the
original parsed result or explicit null; it is never reconstructed from record.tests. wrapperOutcome is exactly
"not-run" | "completed" | "failed", projected by the trusted launcher from actual process completion/reaping and output
custody. It is not the suite's self-reported status. observations is closed {before: Observation|null, after:
Observation|null}, supplied by separate actual authenticated provider reads. parentCleanup is exactly "passed" |
"failed" | "not-run". No approval, authorized, deployable or override boolean is accepted.

Use one sanitized TypeError code ERR_HOSTED_EVIDENCE for shape/identity/consistency violations, with a fixed message and
no supplied field/value, cause or native diagnostic. A valid failed/blocked record returns as data; successful
validation does not imply status=passed, release eligibility, promotion or human approval. Byte
decoding/size/EOF/file-custody limits remain a future I/O boundary, not invented promises of this parsed-data API.

## Concrete closed expected-data shape

```text
expected = {
  profile: "stage" | "production",
  sourceRevision: GitSha,
  suite: { commit: GitSha, tree: GitSha, fixtureManifestSha256: Sha256,
           profilesSha256: Sha256, inventorySha256: Sha256 },
  release: { reservationSha256: Sha256, publicationSha256: Sha256 },
  images: {
    api: { localImageId: ImageDigest, archiveSha256: Sha256, registryDigest: ImageDigest },
    frontend: { localImageId: ImageDigest, archiveSha256: Sha256, registryDigest: ImageDigest }
  },
  configurationSha256: Sha256,
  target: { origin: HttpsOrigin, resourceId: SafeId, revisionId: SafeId } | null,
  run: { id: SafeId, attempt: PositiveInteger, workflowRevision: GitSha },
  declarationInput: {
    metadata: ProfilesV1, inventories: {local: Inventory, stage: Inventory, production: Inventory},
    selectedContractRevision: ContractRevision, predecessorLocalInventory: Inventory
  }
}
```

Every key is required. expected.target is the independently approved destination/revision projection; explicit null is
allowed only before any wrapper execution, with no suite result and a nonpassing envelope. It is not populated from the
untrusted envelope. declarationInput is exactly the existing validateAcceptanceProfiles input, with hosted presence
required: metadata and all inventories/predecessor are non-null. Call that existing pure helper, require profiles-v1,
and use its selected profile's complete inventory/mappings; do not duplicate its tuple, requirement-ID, revision or
predecessor-containment rules. Preserve its independently authenticated predecessor's own revision, not the successor's.
No hardcoded 22/3/72 maximum or equal-count relation; those are the current immutable inventory counts.

The future launcher already must verify exact source bytes to supply profilesSha256/inventorySha256. It should retain
those decoded fixed blobs as declarationInput after runtimeAcceptance and readAcceptanceProfileSource have verified
original source/base and immutable required-suite lineage. Compare the reused pure result with that reader's required
projection. This is byte projection of an already selected identity, not a second history walk or suite selector. The
current source reader returns normalized declarations, not raw bytes/hashes; any narrow projection helper needed by the
future launcher must be separately adopted rather than silently changing that reader in HOSTED-EVIDENCE.

## What the caller authenticates; what this validator proves

| Input                         | Authenticated outside the pure module                                                                            | Pure module checks                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| source/suite/declarationInput | Original release source/base/admission; activated required suite and lineage; exact regular blobs and raw hashes | Closed types, exact identity equality, existing declaration semantics and complete selected tuple set |
| release                       | Verified reservation identity and exact raw publication.json bytes from original publisher/run/attempt           | Exact two digest values; no canonicalized publication reconstruction                                  |
| images                        | Verified archive bytes/local image IDs and separately authenticated same-content registry transfer               | Exact API/frontend roles and all three distinct digest representations                                |
| configuration/target          | Reviewed hosted configuration and approved provider destination/revision; no Compose or caller-URL substitute    | Passing target/configuration equality; valid failure drift is preserved                               |
| run                           | Actual hosted producing workflow/run/attempt, distinct from original publication run                             | Exact delivery-run identity; positive safe attempt                                                    |
| launchId/result               | Original launch and fixed output custody, fresh parse, subprocess completion/reaping                             | Original result's profile/launch/source/suite and full inventory binding                              |
| observations                  | Independent measured before/after target reads and approved destination/access                                   | Closed observation syntax, exact preservation, and passing stability/config/digest rules              |
| parentCleanup/wrapperOutcome  | Actual owned-resource completion and lifecycle facts                                                             | Status cannot be promoted; cleanup cannot conceal failure or nonexecution                             |

Matching supplied hashes cannot prove that parsed declarations came from those bytes, authenticate provider facts, prove
registry sameness or establish approval. The caller must do so before using the validator as a gate input. A
candidate/pending/legacy suite must never be projected as eligible required hosted authority. The pure module does not
accept a requested suite role or resolve a branch. Tests use clearly synthetic expectations, never labels claiming real
approval or observed publication.

## Exact result-to-envelope mapping

First export validates the existing closed HostedSuiteResultV1 without extensions: schemaVersion, kind, profile,
launchId, sourceRevision, suite, inventory, tests, status, cleanup. Compare identity to expected and launchId. Inventory
must be the complete selected authenticated tuple set even when failed. Execution rows are unique known tuples with
closed six-field shape and supported statuses/safe retry integers. Passed requires exact executions, actual/expected
passed, both retry values zero and cleanup passed. Failed permits a known partial subset; blocked requires tests=[].

Second export validates the existing closed HostedAcceptanceV1, unchanged:

- schemaVersion/kind are its fixed constants; profile/sourceRevision/suite/release/images/configurationSha256/run equal
  expected. contractRevision equals the validated declaration revision. All nested types use policy section 4 exactly.
- With suiteResult present, invoke the first export and require record.inventory and record.tests to preserve its
  original parsed arrays and every row field exactly, including order. Never fill omitted/failed rows from inventory.
  Without a result, use the authenticated complete inventory and tests=[]; never manufacture a HostedSuiteResultV1.
- record.target equals observations exactly, including actual valid differences/nulls. Passing additionally requires
  both observations, profile/configuration/registry-pair equality to expected, exact expected target identity, and
  after.observedAt >= before.observedAt. Apply canonical HTTPS/SafeId/real UTC syntax on nonpassing observations too,
  but do not reject valid drift merely because it differs from expected. Do not add unadopted staleness/traffic rules.
- launchId is checked against the original result but has no HostedAcceptanceV1 field. The launcher retains that join
  and result bytes separately; do not squeeze it into run.id or invent an envelope extension.

Required conservative status matrix:

| Original result / wrapper outcome                            | Allowed envelope status                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Passed result + completed wrapper                            | passed only with every envelope passing condition; failed may preserve an external failure |
| Failed result                                                | failed only                                                                                |
| Blocked result                                               | blocked or failed; never passed                                                            |
| Null result + not-run wrapper                                | blocked or failed, tests empty                                                             |
| Null result + failed wrapper                                 | failed only, tests empty                                                                   |
| Null result + completed wrapper, or result + not-run wrapper | Reject inconsistent evidence                                                               |

wrapperOutcome=failed requires failed status; parentCleanup!=passed always forbids pass, even with a complete passing
suite result. These constraints override the table. Treat completed as normal acknowledged wrapper completion/output
custody, not test success. Required cleanup aggregation: combine suiteResult.cleanup and parentCleanup with failed
dominating not-run, and not-run dominating passed. For absent result, use child contribution not-run only when
wrapperOutcome=not-run, otherwise failed (unverified child cleanup). Record that exact aggregate; do not rewrite a
failed child cleanup because the parent/container later disappears. Failed and blocked records remain nonpassing
regardless of cleanup. Missing/malformed source/release identity permits only a separate sanitized launcher diagnostic;
malformed result bytes are retained outside the envelope and supplied here as null only after the trusted launcher
classifies that absence as failed, never as a passing replacement report.

## Independent expected decisions before implementation

Define ordinary complete stage and production counterparts from literal independent inventories, with unequal lengths,
then one-axis negatives: every unknown/missing field/version/type; wrong profile/launch/source/suite/hash/run/attempt;
API/frontend swaps and digest conflation; altered mapping, predecessor omission and legacy-null declarations; missing,
extra, duplicate, skipped, timedOut, interrupted, expected-failed or retried rows; complete-count substitution and
control/discovery/local result kinds; null completed result and fabricated rows. Freeze expectations before helper code.

Valid nonpassing counterparts must retain partial known rows, blocked empty rows, null observations and actual target
drift. Pair them with attempted promotion to passed, timestamp reversal, missing post-read, cleanup downgrade, stale
launch/result substitution and rewritten failed observations. Also require fresh frozen outputs, caller immutability,
fixed diagnostics, import/call no-I/O and deterministic outcomes without Date.now. The independent expectations cover
these categories; the validation record preserves their freeze, initial availability failure, later test-harness
correction and focused implementation result. Original publication and local-required-acceptance bytes stay unchanged.

## Ownership, verification and limits

An independent author owns the test expectations before implementation. A separate implementer owns the helper only;
root owns explicit test registration, documentation and integration. Existing declaration validation is reused, not
copied. Required local acceptance, candidate and bound suite bytes, publisher/preparation/retry behavior and workflows
remain unchanged. Tests use synthetic identities and independently constructed expected records.

The design proposal SHA256 is `42a7862593cc4b7297d6dab6e79d9f149c913b8768d8c04416d37aa3a2040025`; independent design
review SHA256 is `12f403e156c8f887f0aaf7f4da9f09cf7e492eb8bd1cdfd482540a37d81de958`. These are retained local review
records, not attestations, executed tests or a human production decision. Root adopted their bounded design under the
existing execution delegation. Independent expectation and implementation reviews are recorded separately; normal CI,
companion approval and prerequisite publication still apply.

Authenticated publisher handoff, same-content registry proof, provider/configuration projection, freshness/convergence,
production human-event verification and workflow permissions remain later launcher/consumer work. Preserve the legacy
promotion helper until its separate coherent migration; never accept a new envelope through its equal-count or supplied
approval interface. No I/O launcher or deployed service is provided by this card.
