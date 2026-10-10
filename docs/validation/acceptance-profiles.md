# Acceptance profile declaration validation

**In progress, 2026-10-10.** This records PROFILE-DECLARATIONS under the
[adopted protocol](../testing/hosted-profile-policy.md) and
[bounded card](../phases/next-iteration.md#pr-card-3--profile-declarations-validate-immutable-acceptance-profile-declarations).
The owner authorized stacked PRs and parallel domain work. This branch starts from protocol PR #25 head
`0e5e5ee1f4b7c5a06da3519c52e329cc1b6d541e`; its parent has not yet merged or published. Dependent publication requires
that actual result, reconciliation to its protected-main source and fresh CI/companion approval.

## Frozen expected-decision boundary

The pure validator interface and declaration semantics are specified in the protocol; the card fixes
`readAcceptanceProfileSource(root, { selection, sourceRevision, baseRevision })`. It validates all selected roles before
extraction, installation or standalone execution. The existing runtime selection and original CI/local source/base
authority remain unchanged. A consistency replay does not authenticate a caller-created CI record.

The reader's closed result has required/candidate/pending keys, using null for an absent role or the exact authenticated
historical genesis without inventories. Explicit null base is permitted only for the pre-policy local call whose
original optional base was omitted. It is never a post-policy or CI fallback. No role, profile, URL or path selector is
accepted. Current complete local acceptance and publication formats remain unchanged.

Clarified error attribution: absent stage/production blobs established from a valid Git tree become explicit null; the
pure validator then enforces atomic presence and raises `ERR_ACCEPTANCE_PROFILE_DECLARATION`. Missing local inventory
outside exact genesis, unreadable/nonregular blobs, invalid UTF-8/JSON and provenance/context/lineage errors raise
`ERR_ACCEPTANCE_PROFILE_SOURCE`. Valid decoded/parsed values with invalid declared schema retain the pure validator's
error. This distinguishes failures without relaxing a rejection.

## Ownership and status

- Independent author one owns `scripts/acceptance-profiles.test.mjs`, with no helper implementation access.
- Independent author two owns `scripts/acceptance-profile-source.test.mjs` and only the inert r4 local-inventory fixture
  addition in `scripts/acceptance-consumers.test.mjs`, preserving its existing expected outcomes.
- A separate reviewer checks those expectations before root commits their frozen test-first checkpoint.
- Separate implementation then owns the two new modules. Root integrates the controller, the two explicit `test:tooling`
  entries, scoped documentation, Git operations and final checks.

At this checkpoint tests are being authored; implementation has not started. No test pass, meaningful behavior red, CI
success, companion approval, merge or publication is claimed. Missing implementation is availability evidence, not a
successful negative control. Later entries will record actual revisions, commands, failures and results.

No frozen acceptance suite, contract, registry, product, dependency, workflow or infrastructure changes belong here. No
hosted execution is enabled, and every production application deployment remains a human gate.
