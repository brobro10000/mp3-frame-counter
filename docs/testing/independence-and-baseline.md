# Independent acceptance baseline and change control

Status: proposed P2 process; no package, fixtures, runner or test-only baseline has been implemented or reviewed. Trace:
APP-V1-009,010,013 and [acceptance contract](acceptance-contract.md).

## Ownership and order

P1 verifies/adapts existing foundation only. P2's acceptance author receives requirements, primary format sources and
independent fixture evidence, without parser/API/frontend implementation source. The resulting executable test-only
baseline is reviewed and recorded before P3 parser work. Foundation configuration already exists and is not product
implementation. Never manufacture historical TDD evidence.

The implementer can read accepted tests and debug observed failures, but cannot change acceptance tests, fixtures,
expected counts, thresholds, runner semantics or gate logic to make the product pass. A reviewer considers contract and
oracle amendments separately from implementation. The release operator consumes an exact approved release and cannot
weaken its baseline. Read the four [role documents](../agents/acceptance-author.md).

Separate task contexts and path ownership are process safeguards. They do not create distinct authenticated humans or
immutable/tamper-proof tests. The repository owner may explicitly use the existing review override when an independent
eligible reviewer is unavailable; record that limitation. An agent-generated review is never an eligible GitHub human
approval. Workflow/test changes deserve explicit human review even when the owner is the only person.

## Standalone harness boundary

Future `tests/acceptance/` is one TypeScript Playwright package with its own manifest/lockfile, Chromium only, fixture
manifest, specs and optional runner Dockerfile. The root application retains its own lockfile; no npm workspaces or
second repository. Pin verified versions and matching browser image later, without guessing tags/digests now.

The runner receives external `BASE_URL`, reviewed fixture inputs and nonsecret target identity. No imports or mounts of
server, parser, frontend or application configuration helpers. No runtime MediaInfo. Its Docker context is only the
acceptance directory; no Docker socket or application source. A trusted host/CI controller starts/stops app containers;
the runner is short-lived and not a third default Compose service.

Use accessible role/label locators, independent browser contexts, bounded waits and real file uploads. Do not mock
successful upload responses or use arbitrary sleeps to manufacture E2E success. See
[Playwright practices](https://playwright.dev/docs/best-practices) (read 2026-10-09). A controlled delay for a
pending-state case is fault tooling in the authorized environment and must be labeled accordingly.

## Freeze record and implementation CI

P2 review records the contract revision, suite commit SHA, fixture manifest SHA-256, oracle/provenance evidence,
executed harness checks and targeted negative-control observations, reviewer/owner identity and the explicit review
outcome. Reference this baseline from trusted CI configuration after approval; do not let a product PR freely choose a
weakened suite ref, fixture manifest, phase selector, target URL or environment credentials.

For implementation CI, use a reviewed baseline revision and a trusted controller that validates its local/candidate URL.
Product changes to acceptance/workflow paths require a distinct amendment review. Once P4 integration begins, mandatory
E2E cannot be bypassed by declaring P1/P2 mode or reporting harness checks as product acceptance. The stable terminal
gate fails for missing, skipped, cancelled or failed mandatory dependencies.

A small result artifact should contain suite revision, fixture manifest hash, target environment and resolved
deployment/artifact identities, passed/failed/blocked counts, run ID and sanitized evidence references. Preserve failed
runs. Unknown deployment identity stays unknown and cannot satisfy a release gate. Do not record credentials, filenames
from private uploads, raw audio, sensitive headers or unredacted screenshots/traces.

## Honest red evidence and amendments

Before product code exists, an unavailable app is a prerequisite failure, not meaningful behavioral TDD red. P2 creates
disposable test-only negative controls that intentionally produce wrong counts/shapes to prove the relevant assertions
fail. They are not a stub application or an E2E pass. Separate four claims: harness valid; negative controls observed;
baseline reviewed; real application acceptance blocked/not run. Later record actual product assertion failures and
fixes.

No zero-test success, unconditional expected-failure mode, caught-and-suppressed errors or skipped mandatory cases. A
tool failure, missing fixture, unreachable app and observed incorrect behavior are different outcomes.

An amendment records the requirement/primary evidence, old and new expectation, reason, affected cases, independent
review outcome and new baseline identity. Review it separately; rerun harness controls and affected local/candidate
acceptance. Never silently update expected counts from product output. If disagreement cannot be reconciled, stop the
affected phase with evidence instead of relaxing its gate.
