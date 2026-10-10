# Source-bound release version policy

VER-01 extends the existing single publisher with a policy read from the exact tested source. VER-01 introduced line
`0.1`; the separate LINE-02 change selects `0.2` in this source. Actual publication remains unverified until its
protected merge and successful main release. The tooling package version, product contract, release triggers, queue
syntax and production gate remain unchanged. See the [active cards](../phases/next-iteration.md).

## Allocation and source identity

The root policy is a closed JSON object:

```json
{
  "schemaVersion": 1,
  "strategy": "global-first-parent-ordinal",
  "line": "0.2"
}
```

Ordinary releases use `0.<approved minor>.<global first-parent source ordinal>`. Source ordinal 18 on line `0.2`
therefore becomes `0.2.18`. Patch values never reset on a line change. The activation source itself uses its new line;
no future squash SHA, mutable counter or manually selected version is needed. Minor lines are positive safe integers;
ordinary major-1, prerelease, build metadata and ambiguous numeric forms are refused. Future production `1.0.0`
finalization remains a separate operation that VER-01 does not implement.

`resolveReleaseAllocation` in `scripts/release-manifest.mjs` supplies the source, version, ordinal and normalized policy
binding. It reads exact committed bytes with Git replacement objects disabled and complete first-parent history.
Changing the working tree, tooling HEAD, tags or moving main cannot change an older tested source's allocation. A
feature-branch result is a preview; existing protected-main eligibility and acceptance remain publication requirements.

The policy digest covers the exact committed bytes, including whitespace. Unknown or duplicate decoded keys, malformed
JSON/types, unsupported contracts, symlink/tree entries and missing Git history are refused. No caller argument or
release metadata can override the source's policy. Policy adoption still relies on reviewed protected merges; putting a
line in an unreviewed file does not approve publication.

## Introduction, monotonic lines and repair

Before policy first appears on the source's first-parent history, retain legacy `0.1.<ordinal>` allocation. First
presence permanently ends that fallback, even when the first record is invalid. The first admitted line must be `0.1`;
later admitted minors can stay equal or increase. An invalid record never changes the highest previously admitted line.
Side-branch commits do not count until they are incorporated into the source's first-parent history.

A deleted, malformed or downgraded source cannot release. A new descendant may restore a supported valid line at or
above the prior admitted high-water mark and release at its own ordinal. This does not rehabilitate the bad source or
rewrite a published identity. A first invalid `0.2` cannot establish a high-water mark or skip initial `0.1`.
Symlink/tree entries count as invalid presence and are never followed; later ordinary-file repair is possible.

Malformed JSON, duplicate keys, missing fields and wrong value types are invalid data. A uniquely parsed ordinary object
explicitly declaring an unsupported integer schema or string strategy is different: it creates a compatibility barrier
for its descendants until separately reviewed tooling understands that contract, even if other fields are invalid.
Restoring old bytes cannot silently discard unknown policy semantics. Unreadable/missing required Git objects and
shallow history are integrity failures, never a reason to reopen legacy allocation.

`scripts/policy.mjs` validates actual checked-out HEAD before other repository checks. GitHub CI must supply the
matching `GITHUB_SHA`. The local check also requires policy presence, ordinary-file type and bytes to match HEAD,
including a new untracked policy. Commit an intended policy change before claiming that exact-source check passed. This
adds no global dirty-tree restriction to unrelated files.

## Evidence schemas and retries

| Source history          | Preparation identity and manifest                     | Publication evidence                                          |
| ----------------------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| Policy never introduced | Preserve legacy identity and schema-1 manifest bytes. | Preserve schema-1 JSON and notes exactly.                     |
| Valid policy introduced | Add `identity.releasePolicy`; use manifest schema 2.  | Use schema 2 with the same policy binding and global ordinal. |

The policy binding contains schema, strategy, line and SHA-256. Existing source, suite, image pair and configuration
identity remain bound by the reservation hash. Policy-bound notes identify the line, ordinal and policy digest. Keep all
ten existing asset names; do not add null policy fields or new wording to legacy bytes. Manifest schema and source
allocation must agree independently, so changing a schema number or removing the binding cannot downgrade validation.

Acceptance admission and release versioning are separate requirements. A post-GATE/pre-VER schema-1 release still
requires its original CI admission and independently supplied digest. Schema 2 does not replace source/base/run/attempt
verification or make candidate/local evidence sufficient. The
[GATE completion](../validation/acceptance-transitions.md#protected-main-publication-and-retry) demonstrates that
original handoff and immutable retry before this migration.

An identical complete local reservation reuses every byte and its original preparation revision. A complete published
retry performs no release mutation; a partial draft can receive only its missing original assets. Missing reserved
bytes, changed policy/source/images or metadata conflicts remain blocked. Never rebuild different bytes over an existing
version, move a tag, or rewrite historical notes to fit new tooling.

## Latest selection and release-line activation

Compare stable versions numerically: `0.2.10 > 0.1.99`, `0.10.12 > 0.2.99`, and `1.0.0 > 0.10.12`. Supporting a version
for comparison does not authorize its allocation. Drafts and explicit prereleases do not determine stable latest. An
unexpected malformed stable release tag conservatively blocks a new latest assignment, while permitting an otherwise
valid release with `make_latest: false`.

An old delayed source retains its original policy line and cannot displace a newer stable release. New latest assignment
still requires the exact current-main source and the publisher's final branch/release refresh. Complete historical
retries do not reset latest.

After VER-01's merged release and retry are verified, LINE-02 changes only the selected line to `0.2` plus targeted
documentation. Use existing allocator tests and required CI; create no local tags. Unmerged proposals may be discarded.
After introduction or activation merges, committed history already forbids policy deletion or line downgrade, even
before publication. Repair forward while preserving the admitted policy; an implementation-only rollback must retain it.
Never delete or reinterpret published versions. Software release success remains separate from registry transfer, stage
acceptance and human-approved production.
