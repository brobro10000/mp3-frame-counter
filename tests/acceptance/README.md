# Independent acceptance package

This package owns executable contract r3 and AC-01–AC-12. It receives external URLs and independently characterized
fixtures; it never imports application code, mounts product sources, reads private samples or uses a Docker socket. The
application and acceptance package have separate lockfiles. There are no npm workspaces.

Use the repository's pinned Node 24.20.0/npm 11.19.0. From the repository root:

```sh
npm --prefix tests/acceptance ci
npm --prefix tests/acceptance run check
npm --prefix tests/acceptance run browser:install
```

`check` type-checks TypeScript, reconstructs all fixed fixtures and checks their hashes, runs intentional negative
controls, and lists Playwright cases. It does not contact an application or prove real E2E success. Browser installation
downloads the Chromium revision selected by the exact Playwright lockfile.

The trusted host controller starts the actual two application services and supplies:

| Variable                  | Meaning                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| BASE_URL                  | Public frontend origin; loopback for local runs, HTTPS for managed candidates.                     |
| API_BASE_URL              | Isolated direct API origin for service-local diagnostics.                                          |
| FAULT_CONTROL_URL         | Isolated controller origin implementing authenticated stop/start/pause/resume POSTs.               |
| ACCEPTANCE_TARGET_KIND    | Exactly local or candidate; there is no production mode.                                           |
| ACCEPTANCE_TARGET_ORIGIN  | Explicit origin binding, exactly equal to BASE_URL's origin.                                       |
| ACCEPTANCE_TARGET_ID      | Sanitized actual run/release identity using letters, numbers, underscore, dot, colon or hyphen.    |
| ACCEPTANCE_ALLOW_FAULTS   | Exactly 1; explicitly enables the complete suite's nonproduction fault operations.                 |
| ACCEPTANCE_FAULT_TOKEN    | Random nonwhitespace secret of at least 32 characters, supplied only to harness/controller.        |
| ACCEPTANCE_SUITE_REVISION | Full lowercase 40-hex suite commit, or unrecorded; the latter cannot establish a release baseline. |

With those variables exported by the controller:

```sh
npm --prefix tests/acceptance run e2e
```

Never point the full suite at production or an arbitrary public service. The launcher refuses missing bindings, unknown
target kinds and CLI filters. Tests require isolated diagnostic/fault URLs. The controller origin must differ from both
product service origins, including loopback aliases. The controller authenticates `X-Acceptance-Control-Token`, checks
exact owned resources and never passes the token to product containers. The package can only request the four fixed
fault actions; it has no shell or Docker access through that interface.

Browser traffic is confined to the approved frontend origin. The guard forwards each real request once with redirects
disabled and relays the actual response unchanged; foreign origins and redirects fail. Delayed requests still traverse
this guard. No successful upload response is invented.

The real API is stopped and paused in AC-12, with restoration in `finally` blocks. The outer controller must also
restore or remove its resources after interruption. A failed restoration is a failed run. The 120-second case and
ten-minute suite budgets bound the test process; they are not application throughput or provider SLA claims.

The reporter writes ignored `.artifacts/result.json`: contract, fixture hash, declared suite identity, target identity
and actual pass/fail/skip counts. Full success requires every discovered test to pass. The controller independently
verifies target and suite identities before treating this as release evidence. No trace/video/upload bytes or fault
token are recorded. Before product availability, only harness validity and intentional rejection controls can pass.

See [fixtures](fixtures/README.md), [external contract](../../docs/testing/acceptance-contract.md) and
[baseline change policy](../../docs/testing/independence-and-baseline.md). Implementers may read this package but cannot
weaken it to make product changes pass; amendments need separate review and a newly recorded baseline.
