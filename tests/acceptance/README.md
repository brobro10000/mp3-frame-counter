# Independent acceptance package

This package contains the independent `docs-v1` candidate: all 67 preserved transport-v1 cases plus five public docs
cases. Transport-v1 remains required until separate reviewed docs binding and product activation. The package receives
external URLs and independently characterized fixtures; it never imports product implementation, reads private samples
or uses a Docker socket. Application and acceptance lockfiles remain separate, without workspaces.

Use pinned Node 24.20.0/npm 11.19.0. From the repository root:

```sh
npm --prefix tests/acceptance ci
npm --prefix tests/acceptance run browser:install
npm --prefix tests/acceptance run check
```

The package-local `.npmrc` disables lifecycle scripts even when CI extracts the suite outside the repository. `check`
type-checks TypeScript and its imported JS interfaces, reconstructs the original fixtures, checks OpenAPI, runs original
transport and new actual-browser falsification controls, then enforces the complete 72-case discovery inventory. It
never contacts the application or establishes product acceptance. `browser:install` acquires only pinned Playwright's
Chromium; CI prepares and proves the selected suite's browser independently before `check`.

The trusted host controller starts the actual two application services and supplies:

| Variable                  | Meaning                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| BASE_URL                  | Public frontend origin; loopback for local runs, HTTPS for managed candidates.                         |
| API_BASE_URL              | Isolated direct API origin for service-local diagnostics.                                              |
| FAULT_CONTROL_URL         | Isolated controller origin implementing authenticated stop/start/pause/resume/state/signal-term POSTs. |
| ACCEPTANCE_TARGET_KIND    | Exactly local or candidate; there is no production mode.                                               |
| ACCEPTANCE_TARGET_ORIGIN  | Explicit origin binding, exactly equal to BASE_URL's origin.                                           |
| ACCEPTANCE_TARGET_ID      | Sanitized actual run/release identity using letters, numbers, underscore, dot, colon or hyphen.        |
| ACCEPTANCE_ALLOW_FAULTS   | Exactly 1; explicitly enables the complete suite's nonproduction fault operations.                     |
| ACCEPTANCE_FAULT_TOKEN    | Random nonwhitespace secret of at least 32 characters, supplied only to harness/controller.            |
| ACCEPTANCE_SUITE_REVISION | Full lowercase 40-hex suite commit, or unrecorded; the latter cannot establish a release baseline.     |

With those variables exported by the controller:

```sh
npm --prefix tests/acceptance run e2e
```

Never point the full suite at production or an arbitrary public service. The launcher refuses missing bindings, unknown
target kinds and CLI filters. Tests require isolated diagnostic/fault URLs. The controller origin must differ from both
product service origins, including loopback aliases. The controller authenticates `X-Acceptance-Control-Token`, checks
exact owned resources and never passes the token to product containers. The package requests only the fixed reviewed
operations; it has no shell or Docker access through that interface. TC-07 binds the initial controller
target/generation to the SIGTERM acknowledgment and every later state read. The controller, not a caller-supplied
selector, binds its fixed container to the tested images.

Browser traffic is confined to the approved frontend origin. The unchanged original upload tests retain their forwarding
guard. Additive docs cases use calibrated native CDP blocking, preserve real same-origin redirects/responses, and reject
attempted foreign HTTP assets even when blocked. Their fresh contexts observe CSP/page errors through actual response
expansion, screenshot and a 200 ms retained-document interval. No successful product response is invented.

The real API is stopped and paused in AC-12 and receives SIGTERM in TC-07, with restoration in `finally` blocks. The
outer controller must also restore or remove its resources after interruption. A failed restoration is a failed run. The
120-second case and ten-minute suite budgets bound the test process; they are not application throughput or provider SLA
claims.

The reporter writes ignored `.artifacts/result.json`: contract, fixture hash, declared suite identity, target identity
and actual pass/fail/skip counts. Full success requires exactly one passed result for every reviewed file/title
identity, with no retries or expected failures. Discovery instead writes `.artifacts/discovery.json`, explicitly labeled
`candidate-discovery`; it never writes a full result. The full launcher removes stale results before starting and
validates fresh inventory/target identity. The controller independently verifies target and suite identities before
treating this as release evidence. No trace/video/upload bytes or fault token are recorded. Before product availability,
only harness validity and intentional rejection controls can pass.

See [fixtures](fixtures/README.md), [external contract](../../docs/testing/acceptance-contract.md) and
[baseline change policy](../../docs/testing/independence-and-baseline.md). Implementers may read this package but cannot
weaken it to make product changes pass; amendments need separate review and a newly recorded baseline.

## Successor evidence and utility commands

The [transport contract](../../docs/testing/contracts/transport-v1.md) maps new cases and fixes observation windows. The
OpenAPI fixture is local JSON, not a served documentation endpoint or comprehensive OpenAPI validator. Transport-v1
added no product parser, new media oracle, external reference or dependency. This candidate adds only the reviewed test
packages. Original fixture entries and their recipes remain unchanged; only the candidate manifest's contract revision
changes.

From this package directory, the pinned Node runtime can run these standalone utilities:

- `node scripts/check-fixtures.ts`: reconstructs all 46 original inputs, checks fixed size/hash/count expectations and
  boundary arithmetic; writes nothing and fails on any mismatch.
- `node scripts/check-openapi.ts`: checks local references, raw binary operations, closed schemas, statuses and HEAD
  headers without content. Reads the local fixture only; fails on a mismatch. It does not certify runtime conformance.
- `node scripts/negative-controls.ts`: preserves the original subprocess wrong-count/shape/fixture/launcher/abort
  controls.
- `node scripts/transport-controls.ts`: uses disposable loopback responders and synthetic records to prove shared
  transport, inventory, OpenAPI and lifecycle assertions reject wrong behavior. Listeners are closed in `finally`.
  Positive controls use an explicitly test-only short timeout window; application cases retain the documented windows.
- `node scripts/check-discovery.ts`: launches only this package's pinned Playwright listing, removes stale discovery
  output and requires exactly the reviewed inventory. It never sends application requests.
- `node scripts/run-e2e.ts`: requires the existing target inputs, launches all cases and validates a fresh full result.
  Extra arguments, unavailable targets, missing/duplicate/skipped/zero executions and restoration failures fail the run.

Transport helpers send bounded real HTTP requests and retain at most 64 KiB per response. Unfinished uploads are closed
in `finally`; lifecycle observation additionally requires actual socket closure before client cleanup, strict normal
exit and a matching target/generation within eight seconds of requesting SIGTERM. No-op acknowledgments, forced exit 137
and stale generations fail. Graceful completion after signal-handler entry remains unproved and needs fresh independent
source/configuration/operational review during migration; there is no skipped drain case.

## Documentation candidate controls

The [docs contract](../../docs/testing/contracts/docs-v1.md) states the public routes, safe YAML semantics, adopted
local Redoc derivative, sole public header ownership and finite observation limits. Five docs cases retain all old
identities; only the current manifest/inventory contract revision and additive wiring change. The original transport
OpenAPI bytes remain unchanged. Root/schema scope and provenance are detailed in
[docs fixtures](fixtures/docs/README.md).

`node scripts/docs-controls.mjs` starts one bounded child and normal Chromium against owned ephemeral loopback fixtures.
It uses the same public YAML/header/artifact/browser predicates as docs.spec.ts. Guard calibration includes real owned
receipts, separate CSP/guard negatives and redirect/beacon paths. Controls exercise real rendering plus decorative
shells, CSP and foreign assets, schema/reference errors and fresh report accounting. It writes uniquely identified
evidence under `.artifacts/docs-controls/`, with a source digest and exact planned/executed control IDs. Failed attempts
remain failed. The parent enforces a four-minute/output bound and first requests graceful child cleanup on overrun. The
child closes its browser and every owned fixture; a bounded hard-kill fallback remains failed with cleanup unverified.
An induced termination control proves the graceful path closes the browser and both fixture listeners while retaining
failed status. There are no install steps, retries, skips or remote fixture assets in the command.

The new `.mjs` helpers document their own inputs/side effects/failure boundary. Their imported interfaces participate in
TypeScript checking; they use public Node, YAML and Playwright APIs. The old application reporter and launcher enforce
the complete 72-case inventory. Candidate control reports are a separate kind and cannot establish application
acceptance.
