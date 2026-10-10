# VER-01 source-bound release allocation evidence

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

The unchanged r3 application acceptance, exact-head companion review, protected-main publication and retry must be
recorded separately before claiming their completion. No real GitHub release was created by the synthetic tests.
