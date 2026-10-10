# Hosted acceptance profile protocol

**Decision draft, 2026-10-10, coordination r16.2.** This is the documentation-only HOSTED-PROFILE-POLICY handoff. The
owner authorized parallel authoring while DOCS-IMPLEMENTATION completes. The inspected PR head
`155caf019c4745732a39c19846886d6ae39e6e9b` and actual squash `71e2cab6cdcac67675929563ed12db9d07ce227f` have the same
tree, `b76aed90de1b6d004a76c836d88f969f36d4485b`. Protected-main activation/publication remains a prerequisite for
dependent executable work; root owns its verification and adoption of this draft. No hosted suite or capability exists
because this document exists. See
[the card](../phases/next-iteration.md#pr-card-2--hosted-profile-policy-settle-the-reviewed-profile-protocol) and
[execution authority](../phases/roadmap-execution-authorization.md).

The five decisions below are selected together. They preserve all 72 docs-v1 local cases, predecessor obligations,
ordinary software publication, immutable release retries and every production deployment's exact-candidate human gate.
Profile data describes requirements. It grants no destination, credentials, fault, deployment or production authority.

## 1. Closed declaration schema and fixed ownership

A future independently authored successor may introduce exactly `tests/acceptance/fixtures/profiles.json`. Its existing
whole-suite tree binding authenticates these bytes; there is no transition-registry schema change. No file is added to
the current frozen suite. The following notation defines types, not example cases or executable TypeScript:

```text
ProfilesV1 = {
  schemaVersion: 1,
  contractRevision: ContractRevision,
  profiles: {
    local: Mapping[],
    stage: Mapping[],
    production: Mapping[]
  }
}
Mapping = { case: CaseRef, requirements: RequirementId[] }
CaseRef = { file: string, title: string }
Inventory = { contractRevision: ContractRevision, cases: CaseRef[] }
```

Every displayed key is required and every object is closed. All three mappings and every `requirements` array are
nonempty. There are no defaults, optional profile keys, disabled profiles, inheritance, selectors or extension fields.
`schemaVersion` is the JSON number `1`, never a string. `ContractRevision` is a nonempty string matching
`^[A-Za-z0-9][A-Za-z0-9._-]*$`, exactly equal to the resolver-selected contract revision and each inventory's revision.
`RequirementId` is exactly one of `APP-V1-001` through `APP-V1-016` or `APP-REL-001` through `APP-REL-006`; unknown IDs
fail. These stable IDs trace responsibility, including later roadmap amendments; they do not claim that a test alone
proves an entire requirement. A new requirement-ID family needs a reviewed protocol version.

A `CaseRef` retains the existing `(file, title)` identity. `file` is a package-relative POSIX spec identity: nonempty
slash-separated components matching `^[A-Za-z0-9][A-Za-z0-9_.-]*$`, with neither `.` nor `..` components and a final
`.spec.ts` suffix. It has no leading slash, backslash, drive prefix, query or fragment. `title` is a nonempty string,
equal to its trimmed value, with no U+0000–U+001F or U+007F characters. Both strings must equal the independently
declared inventory entry exactly; do not case-fold, normalize Unicode, rewrite paths or split titles. Compare tuples,
not an ambiguous delimiter-concatenated string. The reader never uses a case reference as an input path.

Reject duplicate case tuples within an inventory or profile and duplicate requirement IDs within a mapping. The same
case may trace several requirements; the same requirement may trace several cases or profiles. Cross-profile reuse of a
tuple is permitted only when independently discovered in each complete profile; it is never evidence reuse. Object-key
and declaration-array order have no selection meaning. Retain inventory order for output; inventories have unique
identities and comparisons use exact sets, not counts. No command, endpoint, credential, environment value, inventory
path or arbitrary configuration field is accepted. Literal test titles remain inert identity text.

Input is parsed JSON data: reject null where an object/array/string is required, wrong types, nonfinite numbers and
unknown fields. The source reader strictly decodes UTF-8 and uses one standard `JSON.parse` path; invalid encoding, BOM,
trailing data and malformed JSON fail. This protocol does not claim duplicate JSON object-key detection: `JSON.parse`
supplies the effective parsed members. No separate custom parser or alternate interpretation is permitted. Duplicate
array identities still fail as specified above. Do not coerce, repair or silently discard unknown fields.

## 2. Complete inventories and discovery

Inventory locations are constants in consumers, never fields in metadata:

| Profile      | Fixed path below `tests/acceptance/` | Obligation                                                                            |
| ------------ | ------------------------------------ | ------------------------------------------------------------------------------------- |
| `local`      | `fixtures/inventory.json`            | Complete local inventory, retaining every predecessor tuple and obligation.           |
| `stage`      | `fixtures/inventory.stage.json`      | Complete stage-functional inventory, independently authored for real managed ingress. |
| `production` | `fixtures/inventory.production.json` | Complete non-destructive production-smoke inventory.                                  |

All profile-bearing inventories use the closed `Inventory` shape above and are nonempty. Each profile's mapping case set
must equal its own complete inventory exactly. Stage and production inventories need not equal, contain or partition
local; no hosted count is derived from the local count. The validator requires the new local set to contain the complete
independently selected predecessor-local set. Independent contract review additionally preserves assertions, fixtures,
thresholds and fault obligations; matching names alone cannot prove semantic preservation. The current complete
inventory has 72 tuples and SHA-256 `98681c1811ed3b54cf8c2994e9a24a4b2afd6a8e0f8c575d9db63cf095afc7f4`. It is a
preservation floor, not a fixed future maximum or permission to leave added mandatory cases undiscovered.

Presence is atomic: absent `profiles.json` requires both hosted inventories absent and means legacy full local only.
Present metadata requires both hosted inventories and all three profiles. A missing, empty, malformed or unsupported
file fails closed; it is never equivalent to absence. A bound profile-bearing suite cannot lose metadata through a
working-tree edit or downgrade: suite identity and successor admission still apply. Any later successor must preserve
its predecessor's declared profile responsibilities through independent contract review. Once profiles exist on the
resolver-established predecessor lineage, an absent metadata file in a later successor is a rejected downgrade, not a
return to legacy-local mode. This check follows authenticated lineage, not merely the current tree's presence bit. The
original authenticated r3 genesis has no `inventory.json`; section 3 preserves that exact historical case without
inventing an inventory. Inventory absence for a non-genesis suite is an error, including every later docs-v1 descendant.

The successor's fixed standalone `npm run check` owns discovery of all three profiles without an application target,
credentials, Docker or test-body execution. It must compare each discovered tuple set with the matching inventory and
mapping; zero discovery, omissions, extras and duplicates fail. It also rejects undeclared executable cases and ensures
the ordinary no-argument local command discovers and executes only the complete local inventory. The successor author
owns the fixed discovery configuration and spec organization, with no caller-provided glob, grep, project or URL.
Discovery lists every declared profile even when only local is currently executable. Oracle and negative controls remain
separate candidate evidence with `productAcceptance: false`; their success cannot stand for hosted or local execution.

## 3. Pure validation and immutable source reader

The later root-tooling module `scripts/acceptance-profiles.mjs` exports exactly the public declaration validator:

```text
validateAcceptanceProfiles({ metadata, inventories, selectedContractRevision, predecessorLocalInventory })

metadata: ProfilesV1 | null
inventories: { local: Inventory, stage: Inventory | null, production: Inventory | null }
selectedContractRevision: ContractRevision
predecessorLocalInventory: Inventory | null

result: {
  schemaVersion: 1,
  kind: "acceptance-profile-declarations",
  mode: "legacy-local" | "profiles-v1",
  contractRevision: ContractRevision,
  profiles: {
    local: { inventory: Inventory, mappings: Mapping[] | null },
    stage: { inventory: Inventory, mappings: Mapping[] } | null,
    production: { inventory: Inventory, mappings: Mapping[] } | null
  }
}
```

The argument object and `inventories` object are closed with all keys required. Only explicit `null` represents absence;
missing arguments and `undefined` fail. The selected revision must equal local, metadata and hosted revisions when
present. A predecessor inventory has its own predecessor contract revision; do not require it to equal the successor.
For `profiles-v1`, predecessor inventory is required and its exact local set must be preserved. For `legacy-local`, both
hosted inventories must be null and `predecessorLocalInventory` must be null; preserve historical local behavior without
retrospectively requiring profile declarations from historical sources.

The synchronous validator applies sections 1–2 and returns a new deeply frozen JSON-data copy. Legacy output has null
local `mappings`, null stage/production and the complete local inventory. Profile output has all inventories and
mappings; mapping entries follow inventory order and requirement IDs are sorted by code point. It never mutates inputs.
Any invalid parsed declaration throws `TypeError` with `code: "ERR_ACCEPTANCE_PROFILE_DECLARATION"`; the diagnostic may
identify a schema field but must not echo raw supplied values. No success-shaped partial result, warning, fallback,
skipped case or repair is allowed. Callers propagate rejection as a failed prerequisite. The helper does not prove
discovery, test success, contract adequacy, source authenticity or authorization.

Importing and calling the helper perform no I/O. It accepts parsed values, not roots, paths, Git refs, raw bytes,
environment objects, selected-profile arguments, processes, callbacks, handles or URLs. No filesystem, environment,
process, clock, network or provider lookup belongs there. Decoding/parsing and byte authenticity belong to the separate
source reader; parsed values cannot establish those properties or detect duplicate raw JSON keys.

The first consumer is `scripts/run-ci-phase.mjs`, which already resolves and extracts the required suite plus a separate
candidate or pending binding. A new `scripts/acceptance-profile-source.mjs` owns reading and parsing declarations for
each of those resolver-selected identities before their standalone checks. It receives the actual resolver result and
its original source/base admission context from the controller, never a profile choice or metadata path from the
environment. Required, candidate and pending records retain their existing distinct roles and evidence authority.

The current resolver returns predecessor IDs, not a full lineage catalog. The reader obtains that catalog without a
resolver or registry-schema change: read the regular blob at the original exact
`sourceRevision:docs/testing/acceptance-transitions.json`, require its raw SHA-256 to equal the already verified
`resolution.policySha256`, and parse its existing closed registry shape. Build an ID lookup from its transition entries
and `resolution.genesis` keyed by the genesis contract revision. Add only the unbound `resolution.candidate` when
present; require all identity fields of required/pending records to match their registry entry or genesis, and every
candidate identity field to match the selected candidate record. Matching only the ID is insufficient. Follow each
selected record's `predecessor` IDs to genesis, rejecting missing, duplicate, cyclic, self-referencing or out-of-order
identities. The existing verified resolution supplies historical admission and new-binding review authority; these extra
reads never authenticate a caller-supplied registry or replace the original source/base context. Do not resolve with the
tested source substituted for its trusted base.

For each selected identity and predecessor, use replacement-disabled exact Git objects at its `suiteCommit`; verify
recorded suite tree, manifest and contract identity before inspecting that tree's four fixed declaration/inventory
paths. Read local preservation bytes from the immediate predecessor established above, never from metadata. The selected
contract revision comes from the verified selected identity. For absent metadata, verify that no predecessor tree has
profile metadata before permitting legacy behavior. Checking historical metadata presence does not require historical
inventories. Unknown or incomplete lineage is fatal, and raw-byte SHA-256 identities belong to this reader.

There is one historical exception to invoking the pure helper: when the selected suite is the exact authenticated
genesis identity and all four fixed files are absent in its immutable tree, the reader returns `null` (no profile
declaration result) and the controller continues the unchanged full legacy check/E2E path. It does not emit a successful
inventory validation, construct cases or modify historical reports. Before registry introduction, only the existing
verified legacy baseline result can establish this genesis identity; after introduction use `resolution.genesis`. No
other missing-local-inventory case may use this exception. Inventory-bearing legacy suites invoke the helper with the
explicit null arguments specified above, after the lineage absence check. Profile-bearing suites additionally require
their immediate predecessor's complete local inventory.

All present inputs must be regular blobs. If using the existing isolated extraction, verify its full path set and bytes
against those objects before any read; no symlink, working checkout, product configuration, alternate path or moving-ref
fallback is permitted. A missing Git object, unknown predecessor or failed byte comparison is fatal. Absence is
established in the Git tree, not by an arbitrary filesystem error.

Ordinary PR/main acceptance remains hardwired to full local. There is no `ACCEPTANCE_PROFILE` switch. The declaration
consumer validates dormant hosted data but cannot start a hosted target; `runtimeAcceptance` retains its existing
admission/local-selection distinction. The independent suite owns complete discovery; the root reader owns provenance.

### Required-profile projection amendment — 2026-10-10

HOSTED-SOURCE-PROJECTION adds the following dormant API to the existing source module, without changing the old
`readAcceptanceProfileSource` result or original-context requirements:

```text
readRequiredAcceptanceProfileProjection(root, { selection, sourceRevision, baseRevision })
  -> null | {
    required: NormalizedRequiredProfilesV1,
    declarationInput: {
      metadata, inventories: { local, stage, production },
      selectedContractRevision, predecessorLocalInventory
    },
    profilesSha256,
    inventorySha256: { stage, production }
  }
```

The same private validated read supplies both exports: one resolution/catalog/suite/lineage pass, atomic validation of
all selected roles, and one captured raw blob for each parsed declaration and its hash. The projection contains only
required profiles-v1 data. Successfully validated legacy-local or exact-genesis-null required declarations return null,
even if a newer candidate or pending hosted suite exists. The future hosted caller must reject null before execution.
Malformed context, source, lineage or any selected role still throws the existing sanitized source/declaration error; no
partial required result or null fallback can conceal a defect.

`declarationInput` retains fresh copies of the strictly decoded original bytes' values, including ordering and the
immediate predecessor inventory's own revision. It is not reconstructed from normalized mappings. Hashes use the exact
original regular Git blob bytes before parsing; semantically equal whitespace/member-order changes have distinct byte
identities. The closed result is fresh and deeply frozen on every call. There is no role, profile, path, ref, metadata
or older-suite override, and no provider, credential, execution, write or import-time I/O side effect.

This API checks source consistency only. Historical release consumers must first call existing
`verifyAcceptanceAdmission` with independently authenticated original publisher context and an external admission
digest, then retain that unchanged selection/source/base. A record's own context/digest cannot authenticate itself; the
new hosted run cannot impersonate the original publisher run. `runtimeAcceptance` remains tied to its actual
checkout/current CI context. Publisher handoff, exact registry transfer, provider observations and production authority
remain separate future launcher prerequisites.

## 4. Local compatibility and separate hosted evidence

Keep existing local commands, no-argument behavior, reports, preparation identity, manifest schemas, publication
provenance and immutable retry bytes unchanged. Do not add profile fields to historical records or relabel a local
result. `localEvidence` continues to require local target, clean exact source/images, complete passing acceptance and
cleanup. Candidate discovery remains non-acceptance. Current `target.ts` accepts only local/candidate, requires private
diagnostics and explicit faults, and has no production mode; its syntactic candidate option is not a hosted launcher.

A later trusted hosted launcher writes a separate envelope, `kind: "hosted-acceptance"`, `schemaVersion: 1`. The
following closed shape fixes its compatibility boundary without selecting a provider or credential mechanism:

```text
HostedAcceptanceV1 = {
  schemaVersion: 1,
  kind: "hosted-acceptance",
  profile: "stage" | "production",
  status: "passed" | "failed" | "blocked",
  sourceRevision: GitSha,
  contractRevision: ContractRevision,
  suite: {
    commit: GitSha, tree: GitSha, fixtureManifestSha256: Sha256,
    profilesSha256: Sha256, inventorySha256: Sha256
  },
  release: { reservationSha256: Sha256, publicationSha256: Sha256 },
  images: {
    api: { localImageId: ImageDigest, archiveSha256: Sha256, registryDigest: ImageDigest },
    frontend: { localImageId: ImageDigest, archiveSha256: Sha256, registryDigest: ImageDigest }
  },
  configurationSha256: Sha256,
  run: { id: SafeId, attempt: PositiveInteger, workflowRevision: GitSha },
  target: { before: Observation | null, after: Observation | null },
  inventory: CaseRef[],
  tests: Execution[],
  cleanup: "passed" | "failed" | "not-run"
}
Observation = {
  environment: "stage" | "production", origin: HttpsOrigin,
  resourceId: SafeId, revisionId: SafeId, observedAt: UtcInstant,
  configurationSha256: Sha256,
  registryDigests: { api: ImageDigest, frontend: ImageDigest }
}
Execution = {
  file: string, title: string, status: "passed" | "failed" | "skipped" | "timedOut" | "interrupted",
  expectedStatus: "passed" | "failed" | "skipped", retry: NonnegativeInteger, retries: NonnegativeInteger
}
```

All keys are required; only the two observations may be null, and only on a non-passing record. `GitSha` is 40 lowercase
hexadecimal characters; `Sha256` is 64; `ImageDigest` is `sha256:` plus 64. Integers are safe JSON integers in the named
range. `SafeId` matches `^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,255}$`; it holds only nonsecret observed identifiers, never a
credential. `HttpsOrigin` is a canonical HTTPS origin with no user information, path beyond `/`, query or fragment.
`UtcInstant` is a real UTC calendar instant in `YYYY-MM-DDTHH:mm:ss.sssZ` format. Case identities use section 1. Unknown
fields/versions, malformed JSON, wrong types and invalid identities are rejected. A malformed or unavailable
source/release identity prevents envelope creation; retain a separate sanitized launcher diagnostic, never fabricated
identity values.

The complete `inventory` must exactly match the selected profile's authenticated inventory, even on failure. Raw
metadata and inventory hashes bind the actual suite bytes. `release.reservationSha256` is the reservation identity
digest recorded by the verified software release manifest. `release.publicationSha256` hashes the exact bytes of that
release's verified `publication.json` publisher artifact, including its whitespace and terminal newline; it is not a
canonicalized reconstruction or a digest of an arbitrary API response. Passing requires exactly one execution per
inventory tuple, every status and expected status `passed`, all retry values zero, cleanup passed and both observations
present. Failure records may contain a partial unique execution set, but no unknown tuples; blocked records contain no
executions. Counts are derived, never authoritative. Only passing records require both observations to match the
profile, configuration and registry pair, and resource, revision and origin to remain stable, with
`after.observedAt >= before.observedAt`. Failed records retain actual differing observations so target drift can be
reported truthfully. Unexplained changes, missing observations or skipped requirements cannot pass. An observation is
measured target evidence, not a URL merely echoed from caller input. No private audio, sensitive headers, tokens or
unredacted browser traces belong in this record.

The launcher later binds these records to independently verified publisher output, exact source, admitted suite and
authenticated producing-run evidence; a record's self-asserted hashes are insufficient provenance. OCI digests, Docker
image IDs and archive hashes remain distinct and must all match the verified same-content registry handoff. Separate
stage and production runs produce separate envelopes even for an identical image pair. Neither contains an approval or
deployable flag. The human production-approval record is a separately authenticated, exact-candidate prerequisite.

The future promotion reader must consume the `stage` envelope and validate the complete stage identity set against the
same admitted successor, alongside the existing complete local release evidence. Finalization consumes the separate
`production` envelope. The existing `release-manifest.mjs:validatePromotionEvidence` instead accepts supplied legacy
candidate records and requires equal local/candidate planned counts. Replace that premise in a later independently
reviewed hosted-consumer change; do not loosen it now or silently accept this envelope through its old interface. That
validator currently checks consistency only: it observes neither hosting nor human approval. Existing software release
creation, preparation, publisher and retries do not depend on the new hosted envelope.

## 5. Requirement responsibilities and remaining execution gates

The independent successor author supplies exact cases and reviewed mappings later. These responsibilities cannot be
reduced to selecting local cases that happen to run remotely:

| Requirement boundary                       | Complete local responsibility                                                                                                                                  | Complete stage responsibility                                                                                                                                                                                           | Production smoke responsibility                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| APP-V1-001–005,009; behavioral APP-REL-005 | Preserve independent physical counts, UI/accessibility, raw media, errors, limits, fixture/oracle and format obligations.                                      | Real HTTPS UI/API behavior, multiple independent known counts, both media types, errors, above 1 MiB, around 6 MiB, exact 20 MiB and over-limit uploads; approved non-Content-Length behavior through actual ingress.   | Small known-count upload and usable UI; no boundary, concurrency or stress campaign.                    |
| APP-V1-001–003,008,016; docs/CSP roadmap   | Preserve all five docs-v1 additions and all transport/predecessor assertions, effective policy and same-origin assets.                                         | Real docs/spec/assets, interaction and effective CSP through managed ingress; retain upload-page protection and no foreign runtime dependence.                                                                          | Availability of UI, docs and spec at the approved origin.                                               |
| APP-V1-003,007,010,013                     | Full local admission, abort, idle/total deadlines, cleanup, pause/stop, shutdown and private fault diagnostics remain mandatory.                               | Non-destructive externally observable ingress/lifecycle behavior; any destructive or privileged fault requires a separately reviewed safe nonproduction equivalent and operator authorization.                          | No private diagnostics, outage injection, Docker controls, stress or destructive recovery.              |
| APP-V1-006,012,015; APP-REL-001–004        | Exact tested image pair, independent builds, source/configuration and existing publication provenance; source/build review remains separate from case results. | Observed deployed pair, environment/configuration and stable revision; same-content registry transfer is separate evidence.                                                                                             | Active approved revision, both digests, configuration and access/traffic convergence observations.      |
| APP-V1-014,015; hosted APP-REL-005,006     | Local evidence cannot close hosting or recovery obligations.                                                                                                   | Provider fit, startup/cold start, ingress buffering/framing, bounded resource headroom, abort/capacity recovery, configured timeouts, revision overlap, retention and actual recovery rehearsal need observed evidence. | Smoke after human-approved deployment; finalization also requires retained stage and recovery evidence. |

An unavailable safe hosted equivalent does not permit deleting a local fault requirement. Conversely, local fault
success cannot satisfy a separately mandatory hosted lifecycle observation. The hosted contract must identify which
stage assertions and separate operator observations close each obligation, with measured limits and explicit ingress
constraints. Unexecuted mandatory evidence blocks the corresponding gate. Any incompatibility with the 20 MiB or
unchanged response contract needs an explicit contract decision; no provider-driven silent relaxation is allowed.

The minimum next executable prerequisite is **PROFILE-DECLARATIONS**: independently written and reviewed expectations,
then `scripts/acceptance-profiles.mjs`, `scripts/acceptance-profile-source.mjs`, `scripts/acceptance-profiles.test.mjs`,
`scripts/acceptance-profile-source.test.mjs`, and the bounded `scripts/run-ci-phase.mjs` declaration call for
required/candidate/pending selections. The sixth allowed path is `package.json`, limited to adding those two test files
to the existing `test:tooling` command. Root policy requires every tracked `scripts/acceptance-*.test.mjs` file in that
explicit command list; naming the tests alone does not register them. The seventh path is
`scripts/acceptance-consumers.test.mjs`, limited to adding a complete inert local inventory to its synthetic r4
candidate fixture. That existing non-genesis fixture currently lacks the inventory required here; preserve every
existing expected outcome and the exact-genesis exception. No dependency, lockfile or other package-script change is
included. Root owns adoption and integration; an independent gate author owns the tests and this fixture adjustment
before a separate implementer changes the helper/reader/controller. No suite, registry, workflow, local report or
publication change belongs in that minimum card. If connecting the first consumer requires another writable path, root
must name and review that concrete expansion first.

Its expectations must cover unchanged legacy output including r3's absent inventory, valid dormant profile data, every
rejected shape/version/omission, malformed UTF-8/JSON, exact-set incompleteness, predecessor loss, metadata
deletion/downgrade along successor lineage, source/extraction substitution, exact registry-digest/lineage lookup,
candidate separation and caller/environment attempts to lower local execution. Freeze those expectations and retain
actual red before implementation; this document reports neither tests nor a red/green result. Independent successor
authoring, actual protected-main binding, fixed multi-profile discovery and later activation remain separate acceptance
work.

Concrete later dependencies remain:

- **Trusted launcher and ACCESS-01:** resolve allowlisted stage/production resources from trusted deployment evidence;
  authenticate environment identity before requests; scope HTTP and browser credentials to the approved origin and
  reject unapproved redirects/foreign destinations. Protect authenticated stage and prelaunch production, define the
  post-public-launch candidate exposure model, and keep PR inputs out of credentials and destinations. This protocol
  selects no authentication/provider mechanism and authorizes no launcher execution.
- **Delivery policy and registry handoff:** independently admit fixed IaC paths and delivery permissions, verified
  publisher-to-delivery provenance, and transfer the tested pair without rebuilding. Replace the legacy promotion reader
  coherently with hosted envelope verification. Reconciliation/backfill retains original admission authority.
- **COST-01 and HOST-01:** revalidate the dedicated project's shared USD 75 Cloud Run cap and USD 100 all-service alert
  budget before billable operations, current scoped account/region access, actual managed ingress and resource fit,
  retention and safe stage recovery. Earlier setup evidence is not standing readiness or measured application fit.
- **LAUNCH-01:** every production application deployment, including an authenticated/no-traffic candidate, needs human
  approval of the exact source, pair, configuration, service, exposure and recovery evidence. Changed inputs invalidate
  approval. Production smoke follows that deployment; verified smoke and additive finalization precede `v1.0.0`.

## Inspection and handoff limits

The source pass inspected the transition/runtime/admission selection, phase policy and CI controller, local E2E
controller, standalone package/inventory/report/target/launcher, release preparation/manifest/publication evidence and
root policy. It read the docs-v1 contract, freeze/transition guidance, requirements, roadmap and applicable
role/authority documents. The inspected acceptance tree is `f4704be065e181cff1257e1a8a641ada23124aa0`; docs-v1 contract
SHA-256 is `ca7d43af62d51a6a2eb051ce7681fc91def92b73f42a9768863e222b53955e44`. Those identities explain the
compatibility decision; they are not hosted results or an activation claim.

Only this policy document is authored in this lane. Root separately owns the related phase-card update, actual release
verification, documentation checks, exact-head review and publication. The independent reviewer checks these five
decisions before root adopts them. Stop before helpers, tests, successor cases, bindings, provider design, workflows,
IaC, credentials or target execution. Amend this decision transparently before changing its consumers; never reinterpret
historical evidence to make a new profile pass.
