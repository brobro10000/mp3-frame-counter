# P4 local acceptance controller

Status: independently authored controller handoff on 2026-10-09. Root integration subsequently ran the complete suite
and recorded 58/60 passed with successful cleanup. The two recovery failures exposed a controller port-lifecycle defect;
the repair below awaits a fresh complete run. Focused controller checks do not establish AC-01–12 or deployment success.

## Invocation and ownership

Root `test:e2e` invokes `node scripts/run-e2e.mjs`; root `test:tooling` includes `scripts/e2e-controller.test.mjs`. The
normal entry point is `npm run check:phase`, which verifies the independent baseline, extracts its suite outside the
product tree, runs its own package checks and supplies `TRUSTED_ACCEPTANCE_ROOT`. A direct E2E invocation without that
verified checkout fails. No command-line filters, caller-selected targets or skip switches are accepted.

The controller rechecks the baseline and every extracted suite path/byte against the frozen commit. Runtime package
outputs alone are excluded from this source comparison. The current baseline's publication status remains explicit; a
local ancestor does not imply a protected-main freeze. The independently owned acceptance package remains unchanged.

## Runtime boundary

Resolved `compose.yaml` is checked before any lifecycle action. Exactly `api` and `frontend` are permitted, with
read-only filesystems, numeric non-root users and their reviewed independent build contexts/Dockerfiles. Mounts,
privilege, host networking, external networks, additional services, multiple replicas and sensitive build inputs are
rejected. The controller gives the test project unique service image names and one private default network.

A temporary standalone Compose JSON replaces all published ports. The controller first asks the host OS for two distinct
ports bound only to `127.0.0.1`, keeps both reservations through image builds, and releases them immediately before
Compose startup. Frontend 8080 and diagnostic API 3000 publish those explicit fixed host ports throughout the lifecycle,
including API stop/start. Caller-selected ports are not accepted. If another process takes a port in the unavoidable
release/bind interval, startup fails without retries, replacement targets or interference with that process.
Reservations are also released on pre-start failures. The normal Compose configuration is unchanged. An explicitly empty
interpolation environment file avoids implicitly consuming local `.env` files. The caller's `DOCKER_CONFIG` can provide
Docker authentication without recording its path or copying it into the suite environment.

Both service images are built with `--no-cache`, started and checked for real readiness. Exact container IDs, Compose
ownership labels and image IDs bind the subsequent test. The acceptance suite runs as a host process outside the product
checkout, with no application mounts, imports or Docker socket.

A separate ephemeral loopback HTTP server implements authenticated POST `/stop`, `/start`, `/pause`, `/resume` for the
exact owned API container. Each run generates a 256-bit token, passes it only to the suite's `ACCEPTANCE_FAULT_TOKEN`,
and compares the `X-Acceptance-Control-Token` digest in constant time. Browser Origin headers, incorrect Host,
non-loopback peers, unexpected methods/routes and request bodies are rejected. Concurrent operations are rejected.
Successful responses follow observed container state; start/resume also require actual API health. Stop/start preserve
the original container and its image/network identity.

The full frozen suite receives `BASE_URL`, `API_BASE_URL`, `FAULT_CONTROL_URL`, `ACCEPTANCE_TARGET_KIND=local`, the
exact `ACCEPTANCE_TARGET_ORIGIN`, unique sanitized `ACCEPTANCE_TARGET_ID`, `ACCEPTANCE_ALLOW_FAULTS=1` and the verified
`ACCEPTANCE_SUITE_REVISION`. Public-ingress acceptance stays distinct from diagnostic API checks.

## Deadlines, installation and recovery

All child commands are asynchronous, allowing the in-process fault server to respond during browser execution. Commands
use argument arrays without a shell, bounded output, explicit timeouts and owned process-group termination. The complete
work budget is 1,100 seconds, followed by at most 30 seconds of scoped cleanup, within the outer phase controller's
20-minute command deadline. Individual ceilings are 600 seconds for clean builds, 70 seconds for startup, 180 seconds
for browser installation and 660 seconds for the suite; each is shortened by the remaining overall budget. The frozen
suite retains its own 600-second global timeout.

Pinned Chromium is installed through the frozen package's `browser:install`. On Linux with `CI=true`, the frozen
Playwright CLI additionally runs `install-deps chromium`, with a 120-second ceiling inside the shared budget. This may
install browser OS dependencies through apt/sudo on the ephemeral runner. Local execution never implicitly installs host
OS packages. Installation failure blocks acceptance.

Success, failure and SIGINT/SIGTERM all enter cleanup. Outstanding work is cancelled, the fault listener is closed, the
owned API is unpaused if necessary, and only the unique Compose project is stopped/removed. A final label-scoped
inspection rejects remaining containers. Cleanup errors retain a failing exit even when tests passed. The test project's
image tags/build cache can remain for diagnostic inspection; no global prune or unrelated-container operation runs.

## Evidence and observed checks

Before the temporary suite is removed, the controller verifies its reporter's suite, manifest, contract and target
identities. A pass requires a positive planned count, every planned case passed, and zero failed or skipped cases.
Missing reports, unknown results and zero tests fail. Ignored `.artifacts/e2e-result.json` and a unique per-run copy
retain source revision/dirty state, tracked-diff hash, suite/tree/manifest, configuration hash, image/container IDs,
actual result counts and cleanup outcome. Dirty local source and a provisional baseline remain labeled; this evidence is
not an exact production release approval. Tokens, private upload data and machine paths are excluded or redacted.

Observed before product integration:

- Eight focused tests passed: port replacement and service isolation; unsafe configuration rejection; loopback target
  parsing; real HTTP token/Origin/method/Host/body rejection; generic fault failure; async child responsiveness;
  deadline/nonzero propagation; failure-visible cleanup; and cancellation cleanup.
- A read-only probe of the actual root Compose configuration passed isolation checks. Both resulting bindings were
  loopback, and neither service had a bind or persistent mount; bounded tmpfs paths remain permitted.
- Targeted formatting passed for the controller files and this document.

Independent review also identified Compose `use_api_socket` as an implicit Docker-engine exposure. The controller now
explicitly rejects it, with regression coverage in the unsafe-configuration test. All eight focused tests passed after
that repair; the actual root Compose configuration does not request this feature. No Docker action was needed for the
repair.

The first complete root-owned run is preserved in ignored local evidence `.artifacts/mp3-e2e-48431-e154a9a75eb5.json`:
60 planned, 58 passed, two failed, zero skipped, cleanup passed, frozen suite
`28c2a9c548f872dac54d9395a8ca0ed852f82240`. The stop/start recovery and subsequent pause/resume cases failed because
Docker reassigned a published `0` host port after restarting the same API container, while the independently bound
`API_BASE_URL` remained unchanged. Root reproduced that reassignment separately and removed its diagnostic probe.

The controller repair replaces Docker-selected changing ports with OS-reserved ports fixed in the temporary config. All
eleven focused tests passed, including actual loopback reservation collisions, unique allocations, idempotent release,
cleanup after a pre-start failure, fixed publication and invalid-port rejection. Suite expectations, target binding
rules and acceptance timeouts were not changed. Full repaired product acceptance remains unverified until root's
subsequent complete run; the earlier failure remains retained.

The author did not build or run the changing product, alter acceptance expectations, edit root package/Compose/workflow
files, stage changes or commit. The next gate is independent review followed by the real unfiltered local suite after
all product files are ready. A successful controller unit test is not an application acceptance result.

## Subsequent integrated result

After independent controller review and the separately reviewed frontend correction, root executed the unchanged full
suite at clean `2adf71b447bfee9b78e9bdfc2b29566af894d0fe`: **60/60 passed**, zero failures/skips and successful scoped
cleanup. See [integration evidence](p4-integration.md) and the
[exact sanitized result](artifacts/p4-local-acceptance.json). This later local observation resolves the pending
integration check above without replacing its historical failed run. It does not establish protected-main baseline
publication or managed release.
