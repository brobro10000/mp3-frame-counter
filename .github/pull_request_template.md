## Scope and non-goals

Describe the bounded change and what remains deferred.

## Requirements and traceability

List applicable stable IDs from the central `docs/requirements/README.md` registry and their source sections. Link
implementation and test evidence, update each affected requirement's status, and record decisions for any resolved open
items. For foundation-only work, reference its existing phase requirements and explain which application items remain
deferred.

For first application MVP work, account for `APP-REL-001` through `APP-REL-006` in
`docs/requirements/release-process.md`. Link tested artifacts, version/tag/release and retry evidence as available.
Deployment is deferred under SRC-RELEASE-ONLY; distinguish published releases from local preparation and hosted success.
Leave unexecuted active criteria pending and do not claim completion until they are verified.

## Validation

List commands, observed results, the tested commit and CI run links.

## Risks and limitations

Identify unresolved prerequisites and distinguish configured behavior from executed behavior.

## Human review

Identify files needing deeper review, especially workflows, dependencies, permissions and merge controls.

## Repository-control changes

Describe changes to CI, token permissions, required checks, review rules or delivery triggers.

Independent approval is required unless `brobro10000` explicitly uses the configured PR-only review override. CI,
resolved conversations and branch protections still apply. Agents must not merge, approve or enable auto-merge without a
separate explicit instruction.
