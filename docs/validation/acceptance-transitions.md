# GATE-01 implementation evidence

**Completion update, 2026-10-10:** GATE-01 is merged and verified through protected-main publication and an immutable
publisher-only retry. See the [completion record](#protected-main-publication-and-retry). The authoring observations
below retain their original pending state; they do not override this later evidence. No successor is active.

## Scope and state — 2026-10-10

This change implements dormant acceptance succession after the owner-authorized roadmap. The registry is empty and r3
remains required. No successor test suite, product behavior, allocator, deployment or production approval is introduced.
Read the [transition guide](../testing/acceptance-transition.md) and
[historical GATE-01 card](#historical-gate-01-card).

The independent gate/acceptance author specified temporary Git-history decisions and expected records before the
implementer changed each corresponding boundary. Root coordinated commits and consumer integration; a separate agent
re-reviewed critical fixes. These are automated engineering reviews, not human approvals. Exact-head companion review,
protected merge and post-merge publication remain pending until recorded with actual GitHub evidence.

## Focused observations

Using pinned Node 24.20.0 and npm 11.19.0, actual focused runs established:

- Resolver and legacy-baseline tests: 93 passing cases after the exact `release-policy.json` governance reservation.
  Other root/infrastructure JSON remains unknown; mixed product/governance proposals fail. This only reserves the
  roadmap's known path and does not implement or activate a version policy.
- Preflight/bootstrap/review collection: 80 passing cases. Independent regressions first reproduced inherited startup
  code execution, missing workflow environment restrictions, wrong event/API admission and malformed package scripts.
  Both workflow copies now clear startup variables before Bash, check the same event origin and retain strict scripts.
- Runtime/admission/publication selection: 30 passing cases. Records remain tied to original source/base/run/attempt;
  local selection cannot impersonate CI. Legacy reports with unexpected admission claims are rejected.
- Original-source preparation plus release regressions: 42 passing cases across two focused commands. A newer tooling
  checkout cannot change an older report's required suite. Candidate/binding releases retain their predecessor; an
  activated successor persists. Legacy reservation bytes and retry checks remain unchanged.
- Actual consumer CLI regressions plus legacy baseline/publisher checks: 20 passing cases. Synthetic commands stop
  before real Docker/network operations. The initial regression extracted replacement-ref bytes and accepted missing
  admission mappings; corrected extraction, verification and preparation disable replacement refs, and workflow policy
  requires the exact preflight path/digest handoff. Candidate failure remains separate failure evidence and blocks
  product commands; temporary suites are removed.

These groups overlap and must not be summed as unique coverage. The preserved initial failures are tooling regressions,
not a product TDD claim. An earlier full tooling run passed 289 cases before the final preparation, reservation and
consumer cases were added. Final full validation and unchanged r3 application integration are pending below.

Local red/fixed logs remain in ignored `.artifacts/gate-*.log`; they contain no cloud credentials or application
uploads. No tests under `tests/acceptance/`, genesis `baseline.json`, original r3 contract or generated orchestrator
artifact was modified. No cloud call is needed by ordinary local selection or synthetic tooling tests.

## Trust and remaining boundaries

Trusted-base preflight precedes head-owned installs/commands, emits a canonical record outside the checkout and supplies
its digest independently to the existing same-run publisher. Initial introduction runs only the old trusted baseline
verifier and closed inline bootstrap, requiring an empty registry. Historical policy deletion cannot reopen fallback.
Workflow replacement itself still depends on exact-head review and repository controls.

The release artifact schema remains unchanged: the E2E report binds the new admission, while existing normalized
manifest/reservation identities retain historical compatibility. Future backfill needs retained independent digest
provenance; a digest copied solely from its own bundle is insufficient. Hosted profile mappings, new path classes,
release-line allocation and any cloud delivery remain separate reviewed work.

## Integrated local verification — 2026-10-10

After rebasing onto PR #10's protected-main merge `cdfd37be7d2f99a20df90b8bb1b42097f7a242ce`, clean source
`2921e31f4e83d91eff3fda8a1c4bfd063abed306` passed:

- `npm run validate`: formatting, actionlint 1.7.12, policy/portability, 19/19 Mermaid renders, 20/20 terminal-gate
  tests and 304/304 tooling tests, with no failures or skips.
- `CI_BASE_REF=<exact main base> npm run check:phase`: standalone r3 harness controls, 75/75 unit tests, TypeScript
  build, both real application containers and 60/60 browser/HTTP acceptance cases; scoped cleanup passed.
- The first local export refused native ARM images at the existing `linux/amd64` guard before reservation/export. This
  expected platform limitation was retained, not suppressed. Repeating the complete phase with
  `DOCKER_DEFAULT_PLATFORM=linux/amd64` passed all 75 unit and 60 acceptance cases on the intended image platform.
- `npm run prepare:release` exported the exact tested AMD64 image IDs. A second invocation reported `reused: true`;
  SHA-256 comparison of every prepared file confirmed unchanged bytes. The local preview is `0.1.34`, derived from the
  feature history; it is not the future squash release version, a tag, publication or deployment.

The local report records `sourceDirty: false`, required genesis commit `a0a56d94e5457101cd043b6055ab084782c3e16f`,
`localSelection.kind: local-acceptance-resolution` and no CI admission. Reservation SHA-256 is
`af6666227841c9fa877164450ab3c19af1251dd42012c60db716399542b88b4a`. The later documentation amendment does not relabel
these runs as tests of a newer source. CI will verify the actual PR merge source and trusted bootstrap separately.

PR #10's [main run 38035910679](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38035910679) passed and
published [v0.1.10](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.1.10), with ten assets targeting
the base above. Its companion
[automated approval](https://github.com/brobro10000/mp3-frame-counter/pull/10#pullrequestreview-5478201971) covered
exact head `3b1bf0b7a49b7eb6b543d71dcda355318b1efaff`; owner `brobro10000` merged without bypass. This predecessor
release is observed metadata; its archive bytes were not downloaded or rehashed here. GATE-01 publication remains
pending.

## First companion review and documentation correction — 2026-10-10

[PR #11 CI run 38036374535](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38036374535) passed for head
`de938711baf7afd0588d793f108f10ea117e74b4`, including both trusted bootstrap steps. Companion run
`20261010T080456-e4b70f4a` reviewed all 39 changed paths and returned `request_changes`: the roadmap retained an undated
claim that bootstrap declarations were unapplied, and the runbook linked to the retired COST-BOOTSTRAP card. No blocking
runtime defect was identified; that is a review result, not a guarantee of correctness.

The correction links the completed bootstrap observations consistently, preserves mandatory live cap rechecks and
replaces the runbook's stale CI-pending wording with its dated successful run. It adds no fourth active card. The
original report and receipt remain in the companion's durable records; no approval was published for that head.
Formatting and changed-link checks passed locally. Fresh CI and exact-head companion review remain required for this
documentation correction, followed by actual main publication and publisher-only retry verification.

## Protected-main publication and retry

[PR #11](https://github.com/brobro10000/mp3-frame-counter/pull/11) merged as `bb8f9fd3cae2c5663af9fa9f891472363bf0abcd`
at 2026-10-10T08:32:11Z by `brobro10000`, without bypass. Companion run `20261010T082043-6d22c7c4` reviewed all 41 paths
at `043ceb2df66df81f7895b180e58c9c6adceae931`, found no findings and passed the documentation gate. Its
[automated approval](https://github.com/brobro10000/mp3-frame-counter/pull/11#pullrequestreview-5478325011) was
published and freshly verified before the owner merge. The earlier request-changes report remains preserved.

[Main run 38038218010, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38038218010/attempts/1)
passed both trusted preflights and all mandatory checks. It published
[v0.1.11](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.1.11), release `408810693`, at 08:35:32Z with
ten assets targeting the exact merge. The registry is empty and the same r3 suite remains required.

The owner-authorized publisher-only rerun used job `114173465320`; attempt 2 publisher `114173819150` succeeded at
08:37:18Z with `reused: true`. The original admission digest
`d02dd37dc8aff659adece59c44cc5a452e4a781012b29dc49d6f55878cd7af8f` survived the dependency-output handoff. Release,
tag/source, all ten asset IDs/digests/sizes/timestamps, original workflow artifact `11664716422` and original validator
execution records remained unchanged. The [portable observation](artifacts/gate-release-retry.json) retains the exact
identities and verification limits.

Eight small metadata assets were downloaded and independently hashed before and after the retry; their bytes agree with
GitHub SHA-256. The two Docker archives were compared using GitHub metadata, not downloaded or independently rehashed.
These are observed integrity checks, not signed attestations or hosted verification.

The ignored observation collector initially mistook GitHub's new carried-forward job IDs for new validation execution
and read the latest publisher log without an explicit attempt. Its initial failure was retained. The corrected capture
reads logs by exact attempt and compares the original records plus all execution fields/steps/timestamps; the carried
records preserve original execution. No application, admission or publisher code was changed to obtain this result.

GATE-01's merged-source release/retry prerequisite is satisfied for VER-01. Actual successor binding/activation remains
future work, and this release establishes no registry handoff, stage or production deployment.

## Historical GATE-01 card

**Outcome:** backward-compatible acceptance transition support, dormant on merge, with r3 still active.

**Prerequisites:** PLAN-01 adopted; independent gate-design and expected-decision review; explicit authority for this
trust-policy change. Record the exact trusted base before implementation. Continued execution is authorized, but this
card is not completed by roadmap adoption or cost-control work.

### Owned implementation scope

- Acceptance selection/extraction: `scripts/acceptance-baseline.mjs`, `scripts/run-ci-phase.mjs`, `scripts/run-e2e.mjs`.
- Evidence consumers: `scripts/prepare-release.mjs`, `scripts/release-manifest.mjs`,
  `scripts/publish-release-evidence.mjs`.
- Trusted preflight wiring: `.github/workflows/ci.yml`, `scripts/policy.mjs`.
- Existing focused tooling tests: `scripts/acceptance-baseline.test.mjs`, `scripts/release-preparation.test.mjs`,
  `scripts/publish-release.test.mjs`; directly affected phase-policy tests where necessary.
- New `docs/testing/acceptance-transitions.json` and `docs/testing/acceptance-transition.md`; narrow independence and
  acceptance-role documentation updates.

**Read-only:** `tests/acceptance/**`, genesis `docs/testing/baseline.json`, original r3 contract/evidence, product code,
version allocation, queue syntax, phase monotonicity, mandatory job set and the E2E lifecycle controller. Review the
whole compatibility boundary together; do not leave CI and publisher interpreting different suite identities.

### Required transition behavior

Use the roadmap's **single pending successor** process. The genesis freeze remains immutable; a separate transition
registry records successor identity, predecessor and applicability. Resolve authority from exact source/base Git objects
and independently reviewed merge evidence, not caller-selected labels or a mutable branch tip.

1. Add dormant support and compatible readers without modifying r3 source or expectation bytes.
2. A later candidate suite PR admits only the closed test/contract path class. Existing active acceptance still gates
   the application; candidate discovery, oracle and negative controls remain a distinct evidence role. Visible
   future-behavior failures cannot masquerade as product acceptance.
3. A separate binding PR records the actual protected-main squash commit, suite tree, manifest hash, predecessor and
   reviewed tree. Check the merged parent diff is test/contract-only; a successor can exist after product code exists.
4. Binding reserves the next product-affecting change. That implementation must pass the successor; no old-suite
   selection through a label, argument or release-metadata edit. Allow only one pending successor.
5. After actual implementation merge, revalidate source/image identity and require the successor on all descendants,
   including documentation changes and product reverts. Applicability cannot reset on each PR's changed paths.

Candidate and binding-only merges can release unchanged behavior under the previous contract. Introduce transport, docs
and hosted successors separately. Reviewed hosted profile mappings distinguish local PR/main acceptance, stage promotion
acceptance and production-finalization smoke; unexecuted hosted requirements cannot become local passes.

Treat runtime, build and transport configuration changes as product-affecting. Unknown paths fail closed; documentation
exemptions must not hide executable changes. Reject mixed implementation/policy/test admissions. One shared resolver
must supply identity and applicability to CI, isolated extraction, E2E reporting, preparation and publication.

### Trusted-base bootstrap

Execute admission preflight from trusted-base code before head-owned tooling. Bootstrap the first transition merge
through existing r3 verification with an **empty transition registry**. Keep successor admission disabled until the new
preflight exists on the trusted base. After policy introduction, missing/deleted policy cannot reopen the legacy
fallback. Preserve required job names, phase monotonicity and release permissions.

Internal preflight does not make a replaced workflow tamper-proof. Workflow/governance changes require independent
exact-head review and existing GitHub controls as well as automated checks.

### Independent tests before implementation

An independent author specifies temporary Git-history fixture expectations before gate implementation.

Positive cases:

- Historical r3 replay and unchanged retries retain their existing identities and semantics.
- Candidate controls work in a repository that already contains product code.
- Binding uses the actual reviewed squash result; binding-only publication retains the old contract.
- The first applicable implementation and every descendant require the successor.
- CI, preparation and publication resolve the same identity/applicability and distinguish candidate evidence.

Negative cases:

- Unauthorized suite/manifest edits, mixed product/test proposals, invented or nonancestor SHAs and stale reviews.
- A second pending successor, unsafe extraction paths, policy downgrade and deleted-policy fallback.
- Old-suite selection, candidate evidence reported as application acceptance, skipped or missing mandatory tests.
- Stale source/image/run evidence and documentation exceptions that conceal product-affecting changes.

Run focused tooling tests first, then affected workflow/policy checks and the unchanged full r3 product acceptance. All
evidence consumers must agree before merge; no half-migrated publisher is acceptable.

### Review, rollback, release effect and stop

Require an independent acceptance/gate reviewer plus exact-head companion review. Product implementers cannot author
their own expected gate decisions or approve a weakening exception. Record policy authority separately from review.

This remains v0.1.x and adds no product capability. Before any successor binding, revert dormant support coherently if
needed. After activation, recovery must preserve readable evidence and a coherent policy across all consumers.

**Done:** transition support merged and actual post-merge checks establish readiness for a future independent successor
PR. **Stop before** adding successor tests or activating a new contract. Use the execution amendment's review/merge
path; its authority does not waive independent expectations or any required check.
