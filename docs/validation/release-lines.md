# VER-01 source-bound release allocation evidence

**Completion update, 2026-10-10:** VER-01 is merged and verified through protected-main publication and immutable retry.
See the [completion record](#protected-main-publication-and-retry). Earlier pending statements below preserve their
observation time. LINE-02 activates the next line separately; neither card deploys the application.

## Scope and prerequisite — 2026-10-10

VER-01 implements the owner-adopted [version policy](../deployment/version-policy.md) after GATE-01's protected-main
merge `bb8f9fd3cae2c5663af9fa9f891472363bf0abcd`, publication and immutable retry. The
[GATE completion record](acceptance-transitions.md#protected-main-publication-and-retry) preserves original admission
and metadata observations. The migration selects only line `0.1`; LINE-02 remains a separate activation.

One resolver reads exact tested-source Git objects and complete first-parent history. Preparation, bundle naming and
publication share its allocation; schema-2 identities bind the policy's exact bytes. Historical sources retain their
schema-1 bytes. Numeric stable-version comparison protects latest selection from delayed older lines. Original
acceptance source/base/run/attempt and independent digest checks remain mandatory.

This changes release tooling and its documentation, not product behavior, frozen r3 acceptance, dependencies, workflow
triggers, queue syntax, cloud resources or production authority. The application is not deployed. New-line activation,
registry handoff and verified-production `1.0.0` finalization remain outside this card.

## Independent expectations and observed failures

Two independent authors specified the allocator/preparation and publication expectations before the corresponding
implementation. Root inspected their actual failures and committed the tests separately:

- `099e4c8ec5b714126f08e1a41a2df402e8a25144`: 71 allocation/preparation cases; 17 passed and 54 failed against the old
  tooling. Literal legacy identities and notes passed; missing resolver/checkout behavior and schema-2 support failed.
- `992d310`: 20 publication cases; 11 passed and nine failed. The old publisher accepted a self-consistent policy
  downgrade, omitted source allocation and selected latest using only `0.1` ordinals. The actual bundle CLI selected
  `0.1.6` instead of the independently expected `0.2.6` fixture directory.

These are synthetic tooling regressions, not product acceptance failures. Disposable Git histories and injected fake
APIs exercise source-policy authority, deletion/downgrade, unsupported future contracts, actual squash-like histories,
legacy replay, policy-bound reservations, delayed/concurrent sources, partial publication and immutable retries. The
tests create no real tags, releases, registry objects or cloud resources. Private logs remain ignored.

## Implementation verification

The corresponding implementation was committed as `741ffa0`. On pinned Node 24.20.0/npm 11.19.0:

- The four focused allocation/preparation/publication files passed all 91 cases, with zero failures/skips.
- `npm run test:tooling` passed all 370 registered cases, with zero failures/skips.
- A separate read-only agent found no actionable defect in source authority, history repair/barriers, schema
  compatibility, original GATE provenance or the changed documentation. This is automated engineering review, not a
  companion approval or human review.

A subsequent independent integration audit identified missing actual-preparation CLI coverage. Its three additional
groups are a follow-up to the already written adapter, not a claim that those tests preceded it. The actual CLI rejects
invalid source policy before Docker or reservation creation; preserves historical source versions/configuration under a
newer preparation HEAD; and reuses complete schema-1/schema-2 reservations without changing bytes, modification times or
original preparation revision. Missing archives fail without reconstruction. A fixture-only HEAD substitution fails the
same source oracle before Docker.

With those tests registered, `npm run validate` passed formatting, actionlint, policy, portability, all 19 Mermaid
renders, all 20 terminal-gate tests and all 373 tooling tests with zero failures/skips. A separate changed-document
check resolved 147 local links/anchors across 17 Markdown files and confirmed exactly three detailed next cards. The
checks included staged new files; no omitted untracked document is claimed as checked.

## Real local application and export verification

Clean source `d0da661f586070d4c050cd39a8e66c5a55a32985` passed
`DOCKER_DEFAULT_PLATFORM=linux/amd64 CI_BASE_REF=<exact main base> npm run check:phase`: standalone r3 harness controls,
75/75 unit tests, TypeScript build and 60/60 external browser/HTTP cases against the two real application containers.
Cleanup passed, with no skipped acceptance case. The report records `sourceDirty: false`, unchanged genesis commit
`a0a56d94e5457101cd043b6055ab084782c3e16f` and local selection, not CI admission.

`npm run prepare:release` exported those exact tested AMD64 images under local preview `0.1.15`, with schema-2 policy
line `0.1` and policy SHA-256 `eceab8fb3706f7ad948b78f4ed60f10836d7842a17f58bb419370e53e8ffe7b2`. A second invocation
reported `reused: true`; all six file hashes and modification timestamps remained unchanged. Reservation SHA-256 is
`16e5c087b330631c0d1356c0c62de63dfb98e6503a6d2ac95323f700239ef501`.

This is local preparation, not a tag, future squash-version prediction, publication or deployment. The later
documentation-only commit records these results without relabeling their source. Exact-head companion review,
protected-main publication and its actual retry remain pending until observed. No real GitHub release was created by the
synthetic tests.

## Protected-main publication and retry

[PR #12](https://github.com/brobro10000/mp3-frame-counter/pull/12) merged as `cc2d9c80e7b04edd56d3109a55c3ed2e638cbf2b`
at 2026-10-10T09:20:06Z by `brobro10000`, without bypass. Companion run `20261010T091112-f6d875b1` reviewed all 31 paths
at `aaece0ee419c320d8d1837c12c18e7b521e10dfa`, returned `approve` with no findings and passed its documentation gate.
Its [automated approval](https://github.com/brobro10000/mp3-frame-counter/pull/12#pullrequestreview-5478444292) was
published and verified before merge. Final PR run `38040297750` passed the actual synthetic merge
`92a2ae4e0c55ca5e61c74cf5c505b2dcbf59aa74`; older canceled runs and the unused earlier-head collection were preserved.

[Main run 38041021204, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38041021204/attempts/1)
passed mandatory checks and published [v0.1.12](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.1.12),
release `408835934`, at 09:23:28Z with ten assets targeting the exact merge. Manifest and publication schema 2 bind line
`0.1`, global ordinal 12 and policy SHA-256 `eceab8fb3706f7ad948b78f4ed60f10836d7842a17f58bb419370e53e8ffe7b2`.
Reservation SHA-256 is `cee8962e4df7ca31dee7b1ef9a8b9fe04d68b2306a286f85604d173ffdce4341`. The registry remains empty
and r3 remains required, with 60 passing external cases. No application deployment occurred.

The publisher-only rerun of job `114181582228` succeeded as attempt 2 job `114182479992` at 09:28:40Z with
`reused: true`. Original admission digest `0f636a7a9111ae4ea7285bab109bd01b0f42bfe5f6571633ac198913a9bd0265`,
source/base/run/attempt, artifact `11665637677`, all ten asset IDs/digests/sizes/timestamps and original validator
execution records remained unchanged. The [portable observation](artifacts/release-line-retry.json) records exact
identities and verification limits.

Eight small metadata assets were downloaded and independently hashed before and after the retry. Both Docker archives
were compared using GitHub metadata; their bytes were not downloaded or independently rehashed. These observations are
not signed attestations or hosted evidence. The same explicit-attempt collector comparison used for GATE-01
distinguishes GitHub's carried-forward job records from new executions.

A separate read-only compatibility replay used the actual previously downloaded v0.1.10 and v0.1.11 metadata and exact
source Git objects. The new resolver retained each historical version/ordinal with no release policy, preserved its
source-configuration/reservation binding, and reproduced publication JSON/notes byte for byte. This replay downloaded no
archives, created no tags and did not rerun product acceptance or mutate either historical release.

## Historical VER-01 card

**Outcome:** deterministic allocation beyond v0.1 that preserves historical identities and immutable retries.

**Prerequisites:** PLAN-01's version policy adopted; GATE-01 updates to shared evidence readers completed and verified;
fresh trusted main. Keep this sequential after GATE-01 to avoid concurrent incompatible edits to release consumers.

### Owned implementation scope

- New root `release-policy.json`, initially selecting line `0.1` and the global first-parent-ordinal strategy.
- `scripts/release-manifest.mjs`, `scripts/prepare-release.mjs`, `scripts/publish-release-bundle.mjs`,
  `scripts/publish-release-evidence.mjs`.
- Existing `scripts/release-preparation.test.mjs` and `scripts/publish-release.test.mjs`.
- Narrow current-policy sections in release requirements, preparation and release-only documentation.

Keep the publisher entrypoint unchanged unless a necessary allocator-interface change requires it. The independent
version-design review also scopes an actual-source check in `scripts/policy.mjs` and registration of the new allocation
tooling tests. Validate the checked-out policy before merge; fixture success alone cannot admit a malformed real policy.

**Read-only/non-goals:** package version, product, acceptance source, historical release assets, workflow triggers,
queue syntax, cloud resources and deployment-finalization implementation. Do not rewrite tags or perform live
publication tests. Keep this implementation separate from the cost-bootstrap and acceptance-migration cards.

### Required allocation behavior

Retain one writer and allocate **`0.<approved minor>.<global tested-source first-parent ordinal>`**. Ordinal 18 on line
`0.2` therefore produces `0.2.18`; patch values do not reset. The policy comes from the exact tested source, never
moving main or the release-preparation checkout's HEAD.

- Make preparation, bundle naming, reservation validation, publication and latest-version selection use the same
  authority. Bind policy digest, selected line and ordinal into new reservation evidence.
- Accept missing policy only for pre-migration history; deletion after policy introduction fails closed.
- Preserve legacy decoding, published manifest/reservation bytes and byte-for-byte reuse of historical reservations.
- Reject downgrade, ambiguity, ordinary `1.*` or prerelease allocation. Compare versions numerically.
- Delayed runs retain their tested source's line and cannot displace a newer release as latest.
- Initially select `0.1`. Activate `0.2` in a separate reviewed change; that activation merge can produce the first
  release in the new line. Do not activate it in this PR.
- Reserve future `1.0.0` finalization for the same publisher implementation with a separately checked operation; this
  card does not implement that operation or claim production evidence.

### Independent tests before implementation

Independently specify historical ordinal 6/7 replay, unchanged legacy schema-1 retries, source-policy disagreement,
absent/deleted/malformed policy, `0.1 → 0.2`, downgrade rejection, numeric ordering, delayed old-line jobs, concurrent
distinct sources, interrupted upload recovery, immutable reservation conflicts and premature `1.0.0` refusal.

Run focused preparation/publication tests, complete tooling tests, policy/format checks and normal mandatory CI with
unchanged product acceptance. Use deterministic fixtures and no real tags.

### Review, rollback, release effect and stop

Require release-policy review and exact-head companion review. Owner adoption of the version rule is distinct from
publication authority. All release consumers must agree before the card completes.

The migration produces an ordinary v0.1.x release only after an authorized merge. Unmerged proposals may be discarded.
Once policy is introduced into protected-main history, recovery must preserve its valid policy and admitted line;
implementation-only rollback cannot delete policy. Repair forward without reinterpreting versions or reservations.

**Done:** release consumers agree, historical releases remain verifiable, and a later line-activation PR is possible.
**Stop before** line activation, Fastify implementation or production-finalization work. Continued authority applies
only within this card's scope and prerequisites.
