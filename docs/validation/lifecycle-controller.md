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

## Independent expectations before implementation — 2026-10-10

The [frozen observation contract](../testing/lifecycle-controller.md) precedes implementation. An independent author
retained all eleven existing controller cases and added twenty-two groups covering fixed authority, signal uncertainty,
strict state projection, HTTP framing and old-action compatibility. The first pinned Node 24.20.0 run reported **33
cases: 13 passed, 20 failed, none skipped or canceled**. Failures exposed the absent factory/new routes and
duplicate-Host acceptance; they were not application acceptance failures.

The raw test source SHA-256 was `96db6688f30e366f41c939cad592cbbfae00ef07ff384240b8ef690783b60113`; the retained red log
SHA-256 was `4884293e67d9823db2fabee18fbc95c74d014e01bd27c9ebc4b63877ddc5538c`. The coordinator preserved both, applied
only the installed formatter, then committed the expectations and contract at `11c62c0` before adapter work. The
formatted commit is not byte-identical to the raw red source; no expectations were changed to obtain a pass.

A separate ignored diagnostic defines independent drain and straggler predicates. Its **12 synthetic control decisions
passed**, including rejection of no-op acknowledgment, premature held-response loss, absent deadline, exit 137, stale
generation and cleanup substituted for exit evidence. These fixture decisions neither execute Docker nor prove product
behavior. Actual adapter checks and exact-image observations must be recorded separately below.

## Integration review corrections — 2026-10-10

At `4f65a25d94a2d7d4db5a63bdbe255f6eb08929fd`, local `npm run validate` passed formatting, workflow, policy,
portability, 19 Mermaid renders, 20 terminal-gate cases and 395 tooling cases. `npm run check:phase` passed the
standalone harness, 75 unit cases, build and all 60 frozen external cases with cleanup. Those results did not reveal an
integration gap found by independent source review: `command()` trimmed stdout before the new adapter measured raw
Docker-output byte limits.

The independent author added three command-to-adapter regression groups. The actual red run reported **36 cases: 34
passed and two failed**; its retained log SHA-256 is `dd03dcfff49b82993174475e8e79aba1998fb506db4731cec7df724b95c0109b`.
Expectations were committed at `1d10dab` before correction. The revised contract adds private `preserveStdout: true`
behavior for lifecycle calls while preserving existing callers' trimming. Final validation after that correction is
recorded separately.

Independent diagnostic review also found that an HTTP 200 for an unsent held body could be mislabeled as an unavailable
stopping boundary. The shared diagnostic classifier now keeps that demonstrated partial-success case failed. Its
expanded **14/14 synthetic decisions passed**, including both the failure case and a genuinely unresolved boundary with
normal exit. Diagnostic SHA-256 is `53ede3d03ec8eee0f12fedc9ae32e2a51a476774a441dd856d0838a938070bc1`; control log
SHA-256 is `77cdc146de4ee079aa37c52de61238d6e2539e40e48705333bff7779458c344c`. These are retained local operator
artifacts, not portable CI acceptance or evidence of a successful real shutdown.

## Corrected implementation and actual observations — 2026-10-10

At clean `495d95710a36ed9b63d76b43381e2f0ac811deb2`, corrected validation passed **398 tooling cases, 20 gate cases and
19 Mermaid renders**, plus formatting, actionlint, policy and portability. The phase runner passed the standalone
harness, **75 unit cases and 60 frozen external cases**, with successful scoped cleanup. Independent source review
confirmed both earlier findings resolved and read the retained 36/36 focused-controller result; it did not rerun tests.

The first diagnostic stopped before provisioning: its image-architecture assertion found local ARM64 images rather than
required AMD64. It ran no cases and recorded passed cleanup; subsequent exact project-label container/network queries
returned empty. This was a diagnostic prerequisite failure, not a product result.

The coordinator reran the unchanged phase command with `DOCKER_DEFAULT_PLATFORM=linux/amd64`, then verified the clean
source, full passed report, exact image IDs and actual image architecture before diagnosing that pair without
rebuilding:

- API: `sha256:c165bb6b8e14194c0eb9bc807ac78e62ccd9c8722ca1b82dcd2670e73b314013`.
- Frontend: `sha256:86366189ac874d86402f8a45b6760a42c125420bd6ee8cd66393637c208f0598`.
- Independent fixture: one complete 384-byte frame, expected count one, unchanged original fixture hash.

The [portable operator record](artifacts/lifecycle-observations.json) preserves source/report/script hashes, image and
process-generation identities, timings, response observations and cleanup without credentials or local paths.

| Observation                 | Result                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Signal operation            | HTTP 202 acknowledgment around 52–54 ms; fixed target and generation matched before/after.                    |
| Drain boundary              | First new-upload probe reset around 68 ms while the held upload remained live; no accepted stopping boundary. |
| Held drain-case body        | Never completed because no boundary was established; socket reset around 5,036 ms.                            |
| Drain-case exit             | Normal exit observed around 5,193 ms; no OOM/error, paused/restarting/dead false.                             |
| Separate restored straggler | Body remained incomplete; socket closed around 5,046 ms and normal exit was observed around 5,217 ms.         |
| Forced cleanup              | No forced inter-case cleanup; case observations preceded final project removal.                               |
| Resource removal            | Cleanup passed; coordinator independently queried exact project labels and found no containers or networks.   |

The diagnostic returned nonzero with **operationally-unresolved** overall status. The straggler observation passed its
eight-second window; graceful admitted-response completion did not pass and is not inferred from daemon acknowledgment,
normal exit or reset. This removes the prior forced-stop ambiguity for the observed straggler, without attributing the
old exit 137 to a particular sender or proving an exact five-second deadline. The full 60-case r3 report remains
separate and passed. No application source or frozen acceptance bytes changed.

### Independent disposition

The independent reviewer inspected the raw observation, tested report and diagnostic configuration hashes and matched
both images to clean `495d957`. Source review of `server/src/index.ts`, `server/src/http.ts` and the direct Node Docker
entrypoint supports the intended signal-to-shutdown path: stop admission, close the listener, retain admitted callbacks
and close remaining sockets at the configured deadline. Source intent is not external proof of admitted-body completion
after handler entry.

The coordinator accepts the reviewer's bounded disposition: TR-LIFECYCLE may proceed through normal PR review, merge and
verified publication, then unlock independent transport authoring with graceful drain explicitly unresolved. Preserve
normal-exit/straggler evidence separately; no observation is promoted into a graceful-drain pass. The candidate and
binding must retain the operational limitation, require independent source/configuration review of shutdown during
migration, and independently test bounded straggler closure and normal exit through the reviewed controller against the
exact tested image pair. Preserve negative controls and identity checks. Any claimed stronger drain guarantee needs a
justified observable predicate and controls through separate independent contract work.
