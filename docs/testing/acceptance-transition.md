# Acceptance transition and admission guide

## Current status — 2026-10-10

GATE-01 implements dormant successor-admission support in this change. It remains pending integration validation,
independent review and merge; this document records neither approval nor protected-main activation. The
[implementation evidence](../validation/acceptance-transitions.md) records actual checks. The
[transition registry](acceptance-transitions.json) contains no entries. **r3 remains the only active acceptance suite**,
bound by the unchanged [genesis record](baseline.json) to `a0a56d94e5457101cd043b6055ab084782c3e16f`.

The [execution authorization](../phases/roadmap-execution-authorization.md) permits bounded roadmap work and the normal
companion-review/owner-merge process. It preserves independent expectations, prerequisite order and the human production
gate. Read the [independence policy](independence-and-baseline.md) and
[GATE-01 card](../phases/next-iteration.md#pr-card-1--gate-01-admit-independently-reviewed-successor-suites) together
with this guide. No successor tests or product capability are introduced by the dormant gate.

## Separate candidate, binding and implementation

The registry is an append-only schema-1 record with a `transitions` array. Genesis metadata, original r3 suite objects
and previously recorded successor contracts remain immutable. Resolve authority from exact Git objects; a label,
caller-selected suite, moving branch or edited release report cannot select an older requirement.

1. **Candidate:** an independent author changes only the acceptance suite and its unique contract under
   `docs/testing/contracts/<id>.md`. Run the existing required suite against the product. Candidate discovery, oracle
   checks and negative controls are separate evidence; future-behavior failures are not a product acceptance pass. Only
   one candidate or bound-but-unimplemented successor may be pending. Product changes must wait for binding.
2. **Binding:** after the test-only PR actually merges, a separate registry change with optional supporting
   documentation records its actual squash commit, suite tree, manifest and contract hashes, predecessor, and exact
   review identity. The full reviewed tree must equal the squash tree, and the squash parent diff must contain only the
   admitted candidate paths. Binding does not yet replace required product acceptance, so unchanged behavior may still
   release under its predecessor.
3. **Implementation:** the next product-affecting change requires the bound successor. That requirement persists for
   descendants, documentation changes and product reverts. Product changes cannot be combined with governance or
   registry changes to admit their own expectations. Runtime/build inputs and root lockfile changes are product changes;
   unknown paths and unsupported local dependency sources fail closed. The exact root `release-policy.json` path is
   reserved as governance for VER-01; this gate does not implement its schema or allocator. Other root/infrastructure
   JSON remains unclassified. Future path classes need a separately reviewed trusted-base migration first.

New binding admission verifies authenticated, same-repository GitHub observations: merged PR, actual squash, exact
reviewed head and Git tree, and a submitted approval by a reviewer other than the author. Bounded review-history
collection must establish that this is still the reviewer's current decisive approval. A later rejection, dismissal,
different-head decision or replacement approval cannot silently reuse an older review ID. Incomplete history blocks
admission. Historical bindings already admitted on the trusted base retain their observations' prior authority while
their committed identities and ancestry are revalidated; no synthetic fresh approval is invented.

## Trusted preflight and one-time bootstrap

Both validation jobs run the reviewed inline preflight before `npm ci` or any head-owned command. Checkout uses complete
history without persisted credentials. The step supplies a read-only review token only to preflight and clears
`NODE_OPTIONS`, `BASH_ENV` and `ENV` before Bash starts. Workflow/job environment overrides cannot replace interpreters
or inject startup code. The token is removed from the process environment before Git children run; only the bounded
GitHub review adapter uses it when a new binding needs observations.

Preflight checks GitHub server/API, repository, event payload, workflow identity, run and attempt, clean checkout and
exact source/base commits. A PR source is `GITHUB_SHA`'s synthetic merge, with parents matching the payload's main base
and head; a main push binds its payload's before/after commits. The event base stays the trusted base throughout.
Preflight extracts its modules from that base to a fresh directory outside the checkout, then executes the extracted
CLI. Proposed modules are never used as trusted tooling. Missing trusted modules after policy introduction fail closed.

The first GATE-01 change has a base without the new policy or preflight. Its inline bootstrap therefore extracts the old
baseline verifier and phase policy from that exact base. It verifies unchanged r3 evidence, requires a newly added empty
registry, and admits only the closed governance/documentation scope. Product, suite, original-contract and baseline
changes are forbidden. Package exemptions preserve runtime fields and require valid string commands. Bootstrap emits the
same admission record without executing proposed JavaScript. Historical policy introduction prevents its deletion from
reopening this legacy path.

An internal preflight cannot make replacement of its own workflow tamper-proof. Exact-head independent review and GitHub
protections remain required authority, including for changes to the gate itself.

## Admission record and report boundary

The closed admission record has `schemaVersion: 1`, `kind: "ci-acceptance-admission"`, `context`, `observedReviews` and
`resolution`. Context contains exactly these fields:

| Fields                            | Binding                                                          |
| --------------------------------- | ---------------------------------------------------------------- |
| `repository`, `eventName`, `ref`  | Exact GitHub repository and allowed main-push or PR-merge event. |
| `sourceRevision`, `sourceTree`    | Exact tested `GITHUB_SHA` and its committed tree.                |
| `baseRevision`, `toolingRevision` | Original event base; tooling revision equals that base.          |
| `workflowRevision`                | Exact source revision supplying the workflow.                    |
| `runId`, `attempt`                | Positive original producing-run identity and attempt.            |

Resolution records genesis and required identities, candidate/pending binding, admission decision, binding/activation
commits and policy SHA-256. Object keys are canonically sorted for hashing; array order remains significant. The record
file lives outside the checkout. Preflight emits `admission-path` and `admission-sha256` through `GITHUB_OUTPUT`.

`createAcceptanceAdmission` and `verifyAcceptanceAdmission` prove consistency with Git and the supplied context and
observations. They do not authenticate arbitrary caller arguments or confer GitHub authority. Verification re-runs the
resolver using the original base and observations and compares the complete decision and canonical digest. A caller must
not replace the original base with the source to bypass newly admitted binding checks.

Consumer integration must preserve the following distinction before this change is merge-ready:

| Report evidence                           | Meaning and permitted use                                                                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `acceptanceAdmission: { record, sha256 }` | CI evidence bound to preflight outputs and its producing context. Required after policy introduction for CI release preparation/publication.                                   |
| `localSelection`                          | Non-authoritative local selection from committed Git history. Supports ordinary local checks; cannot impersonate CI admission, authenticated review or publication provenance. |

CI, isolated extraction, E2E reporting, preparation and publication must agree on the required suite. Candidate evidence
cannot satisfy required acceptance. Ordinary local npm/Git/Docker checks remain available without Codex or credentials;
a new binding needing authenticated review evidence cannot be approved by local selection alone. Keep failed evidence
and distinguish inability to establish admission from an observed product failure.

## Release provenance, retries and future backfill

After policy introduction, the publisher requires the admission envelope in `e2e-result.json` and an independently
supplied digest from the product job's preflight output. It verifies original producing-run/attempt provenance,
successful mandatory jobs and preflight steps, exact source/configuration, required suite and image evidence. The
report's own claimed hash is insufficient authority. Publication retains its separate `contents: write` /
`actions: read` boundary; review-read credentials do not become publisher credentials or leak into head-owned
installation.

Historical releases keep their original manifest, reservation, origin and artifact bytes. Legacy source history uses
legacy verification; policy deletion after introduction cannot choose that fallback. An immutable retry reuses its
original bundle and producing-attempt context, rather than stamping evidence with the retry attempt or rebuilding
reserved images. Missing original reserved bytes block recovery.

The current same-run dependency can carry the independent admission digest. Future reconciliation/backfill must first
retain an independently verifiable original digest: ordinary workflow-run API metadata does not expose historical job
outputs. A digest recovered only from the untrusted bundle is not a substitute. Backfill and successor activation remain
separate work, with no implementation or deployment claim made here.
