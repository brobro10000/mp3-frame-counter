# Lifecycle controller evidence

## Pre-implementation diagnostic — 2026-10-10

This is failed diagnostic evidence supporting the [TR-LIFECYCLE prerequisite](../phases/next-iteration.md). No
controller change, successor test or product fix is implemented by LINE-02. The original r3 contract keeps shutdown
within source/configuration/operational evidence; its AC-12 outage/recovery tests remain unchanged.

The existing fixed-target `/stop` runs `docker stop --time 5` and then requires only `State.Running === false`. The
controller's `{ "status": "ok" }` therefore proves neither normal process exit nor graceful completion of an admitted
request. The cutoff overlaps the application's intended five-second shutdown deadline.

An independent agent ran two isolated diagnostics against the exact images from a clean, passing 60-case local run:

- Source: `d0da661f586070d4c050cd39a8e66c5a55a32985`.
- API: `sha256:1849e4ed11dedf4c539c5175c4384bbe0c56a36ad6da741a2c5507e919e421b6`.
- Frontend: `sha256:def2a8f4b045c3956443113cbc5053707d4cdf98ab265a06caf6a6506270aaef`.
- Independent fixture: `one-frame`, 384 bytes, expected frame count one; no product parser import.

Each diagnostic used a fresh uniquely named Compose project, reserved IPv4 loopback ports, fixed owned API container,
`up --no-build --pull never`, a 150-second work budget and 20-second finally cleanup. No existing service, image tag,
cloud resource or full acceptance report was changed. Node 24.20.0 executed the syntax check and both diagnostic runs.
The second run added logging; it did not relax the required stopping predicate.

| Observation           | Result                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| First diagnostic      | No new-upload 503 or ECONNREFUSED stopping boundary within three seconds; failed without a drain claim. |
| Second admission      | One incomplete upload received 100 Continue; that establishes admission only.                           |
| After initiating stop | New one-frame requests returned 200 around 5 and 28 ms, then ECONNRESET from about 50 ms.               |
| Held upload           | Not completed because no justified stopping boundary was established; ended with ECONNRESET.            |
| Controller result     | HTTP 200 and status ok after approximately 5,191 ms.                                                    |
| Container readback    | Stopped, exit 137, no OOM, empty Docker error, configured StopSignal SIGTERM.                           |
| Cleanup               | Passed for both projects; subsequent exact project-label queries returned no containers.                |

Root inspected both saved observations and independently confirmed cleanup. Raw diagnostics remain ignored local
evidence, not a portable automated test or signed attestation. This record preserves their relevant observations and
limits without exposing local paths or credentials.

**Conclusion:** the current control interface cannot distinguish graceful exit from the observed abnormal termination.
Exit 137 is consistent with forced termination, but no signal/event trace identified its sender. Docker Desktop's
connection reset alone does not prove that the application signal handler ran. Configured StopSignal and command
completion supply no handler timestamp. These results do not establish a product defect or successful graceful drain.

TR-LIFECYCLE will add a fixed SIGTERM-only request and narrowly projected lifecycle readback, preserving old actions. It
must characterize a trustworthy external stopping predicate, observe response and exit separately, and place forced
cleanup after the application observation window. If no predicate can be justified, retain graceful drain as explicit
operational evidence requiring disposition before successor authoring. Any demonstrated product defect needs a separate
implementation card; do not change the oracle or report diagnostic cleanup as acceptance.
