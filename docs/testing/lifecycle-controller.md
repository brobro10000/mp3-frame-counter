# Local lifecycle observation contract

TR-LIFECYCLE adds observation capability for the independently controlled local API container. It preserves original r3
stop/start/pause/resume behavior and does not activate a successor, change the application or prove graceful drain by
itself. Read the [phase card](../phases/next-iteration.md) and
[diagnostic evidence](../validation/lifecycle-controller.md).

This contract was fixed before implementation, after LINE-02's verified v0.2.13 publication. Independent expectations
cover the adapter and HTTP boundary; actual diagnostic outcomes remain separate from full product acceptance.

## Fixed authority and authentication

The host controller owns the randomly named isolated Compose project, exact 64-hex API container ID, tested image ID and
loopback ports. The test client cannot choose a container, image, signal, command, timeout or destination. No Docker
socket, application test hook, credentials or retained upload is added to the application or acceptance runner.

All control routes require bodyless POST, the fresh 256-bit token, exact loopback Host/peer and exact unencoded path.
Reject Origin, transfer encoding, queries, duplicate security/framing headers, nonzero/ambiguous Content-Length and more
than 16 total header fields before invoking an action. Retain the 4,096-byte parser bound; disable silent header-count
truncation and enforce the count explicitly so late security headers cannot disappear. Compare token digests in constant
time. Parser-level rejection may close a connection; it must never invoke Docker.

Original routes retain HTTP 200 and exactly `{ "status": "ok" }`. All routes share existing operation serialization:
concurrent calls receive 409; unauthorized calls receive 403; callback failures return a generic 500 with no raw error.
A state read may retry only within its caller's bounded observation window. No token appears in arguments or logs.

## New closed responses

`POST /state` returns HTTP 200:

```json
{
  "schemaVersion": 1,
  "kind": "api-lifecycle-state",
  "target": {
    "project": "mp3-e2e-example",
    "service": "api",
    "containerId": "<fixed 64 lowercase hex characters>",
    "imageId": "sha256:<fixed 64 lowercase hex characters>"
  },
  "generation": { "startedAt": "<actual nonzero Docker UTC timestamp>", "restartCount": 0 },
  "state": {
    "running": true,
    "paused": false,
    "restarting": false,
    "dead": false,
    "exitCode": 0,
    "oomKilled": false,
    "hasError": false
  }
}
```

`POST /signal-term` returns HTTP 202 after a verified daemon acknowledgment:

```json
{
  "schemaVersion": 1,
  "kind": "api-signal-acknowledgment",
  "signal": "SIGTERM",
  "target": "<same target object shape as state>",
  "generation": "<same generation object shape as state>"
}
```

The placeholders above explain the schema; they are not valid runtime identities. Both responses are closed records,
limited to 4 KiB UTF-8 JSON, and validated before writing. Require the exact target identity, a valid nonzero UTC start
timestamp with its original bytes, nonnegative safe restart count, strict state booleans and integer exit code 0–255.
Never return raw Docker JSON, environment, labels, mounts, paths, process IDs, command output or Docker error strings.
`hasError` reports only whether the validated Docker error string is nonempty.

A running process with exit code zero has not exited. Normal-exit evidence requires stopped, nonpaused, nonrestarting,
nondead, exit zero, no OOM and no error. Exit 137 is abnormal; the code alone does not establish which actor caused it.
The response contains no `drained`, `graceful` or deadline verdict.

## Adapter and uncertain delivery

`createApiLifecycle({ project, containerId, imageId, runDocker })` exposes only `state()` and `signalTerm()`. Validate
fixed constructor identities; project names use `mp3-e2e-[a-z0-9-]+` with at most 128 characters. The private runner
uses existing bounded asynchronous Docker commands without a shell:

```text
docker inspect <fixed-api-id>
docker kill --signal SIGTERM <fixed-api-id>
```

Inspection requires exactly one object and exact container/image/Compose-project/service identities. Inspect stdout is
limited to 1 MiB UTF-8. Kill stdout is limited to 1 KiB and, after whitespace trimming, must equal the same container
ID. Unknown Docker input fields may exist within that bound but cannot enter the response. Both commands retain a
five-second command limit inside the outer lifecycle budget; this limits the CLI, not application shutdown observation.

Before signaling, reject paused, stopped, restarting or dead targets, overlapping signals and an already attempted
process generation. Record the attempt before command execution. After the command, re-inspect and require unchanged
target and generation. A fast exit is allowed: post-inspection need not remain running. The acknowledgment establishes
daemon command completion with matching observations, not application-handler execution.

Command failure/timeout/cancellation, unexpected acknowledgment, failed post-inspection or changed generation makes
signal delivery uncertain. Latch all further signaling for this controller instance, even if a later generation appears;
state remains readable for diagnosis and cleanup. Do not clear uncertainty through start/resume or silently resend.
Inspection and signaling are not atomic; this rule prevents a detected generation race from becoming a duplicate signal
or a successful diagnostic.

After a successful acknowledged signal and explicit restoration, a genuinely new process generation can be signaled.
Every diagnostic state read must match the full target and generation from its own acknowledgment. The adapter reports
current state; it does not certify continuity across restarts. A changed generation invalidates the observation rather
than inheriting a prior success.

## Diagnostic acceptance boundary

A separate bounded diagnostic uses exact previously tested image IDs, a fresh owned project, reserved loopback ports and
an independently known-count fixture. Receiving 100 Continue establishes admission only. After SIGTERM acknowledgment,
require a justified external stopping transition while that admitted connection remains live, then its exact complete
response and eventual normal exit. The prior Docker Desktop reset is not an accepted stopping predicate. A fixed sleep
or acknowledgment alone is insufficient.

A separate straggler observation allows an eight-second window beyond the application's configured five-second intent,
before any forced cleanup. Record measured tolerance, socket closure and actual exit; forced cleanup cannot satisfy a
deadline assertion. Preserve both work and cleanup errors, verify resource absence and keep diagnostics separate from
the full acceptance report.

Independent controls must reject no-op acknowledgment, premature loss of the admitted response, absent deadline,
force-stop/137 substituted for normal exit and stale generation using the same observation predicates as the diagnostic.
An unavailable stopping predicate remains explicit operational uncertainty requiring coordinator/reviewer disposition
before successor authoring. A demonstrated application defect requires a separate product card; do not edit r3 or
reinterpret a failed diagnostic as a controller or application pass.
