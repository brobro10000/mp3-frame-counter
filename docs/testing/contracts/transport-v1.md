# Transport compatibility successor transport-v1

Status: independently authored candidate for TRANSPORT-CONTRACT, before Fastify implementation. The active predecessor
is r3. Candidate discovery and falsification controls do not activate this successor or prove application acceptance.
Binding requires a separate reviewed change recording the actual merged source, full tree, suite, manifest, contract and
review identities under the [transition guide](../acceptance-transition.md). No binding or implementation is claimed
here.

This contract adopts the bounded decisions in the [transport card](../../phases/next-iteration.md) after TR-LIFECYCLE's
reviewed capability and [independent disposition](../../validation/lifecycle-controller.md#independent-disposition). It
preserves the original [r3 contract](../acceptance-contract.md), parser scope, physical-frame oracle and all original 60
expanded case identities/assertions. The additional expectations below are transport compatibility decisions; they are
not newly attributed to the original assessment. No product implementation was used to derive the oracle.

## Preserved behavior and independent fixtures

Raw `POST /file-upload` accepts `audio/mpeg` and `application/octet-stream`, tolerates media parameters and compares
media tokens case-insensitively. Success is JSON with exactly one positive integer `frameCount`, equal to the
independent physical-frame expectation. The inclusive **20,971,520-byte** limit applies to actual bytes, including
chunked requests without Content-Length. Supported MPEG/tag layouts, malformed 400, unsupported 415, readable oversize
413 and controlled proxy 502/504 remain unchanged. HEAD keeps 405, Allow and JSON Content-Type headers with an empty
body. Each service's GET `/healthz` returns exactly `{"status":"ok"}` and remains service-local. No upload retention or
parser dependency is introduced.

The [fixture manifest](../../../tests/acceptance/fixtures/manifest.json) retains every original fixture entry, byte
hash, expected count/error and recipe. Its revision field identifies this candidate only in the new candidate objects;
original r3 Git objects and genesis remain immutable. Three encoded audio oracles still have counts 9, 16 and 21.
Structural fixtures retain explicit literal construction rather than a product-derived parser. Exact-limit construction
remains `54,613 * 384 + 128 = 20,971,520`; no sample file or local decoder is needed.

The [local OpenAPI JSON fixture](../../../tests/acceptance/fixtures/openapi.json) uses OpenAPI **3.0.3**. It describes
raw binary inputs, closed success/error/health schemas, required statuses and headers, actual-byte limits and wire/proxy
exceptions. HEAD responses have headers and no response content. Byte bounds are not represented as string maxLength.
All `$ref` values resolve inside that document; no remote reference or new dependency is required. The offline check is
bounded contract consistency, not a general OpenAPI validator or runtime conformance proof. `/docs/`, served YAML,
Redoc, assets and CSP belong to a later successor.

## Additional compatibility decisions and matrix

Semantic validation order is exact pathname, method, media/encoding, bounded body collection, empty check, then parser.
TC-01 deliberately combines faults only at the private direct API, where that order is specified. Public ingress may
reject oversized data earlier; no new uniform cross-layer precedence is claimed. Trailing slash, path case and encoded
path aliases are not accepted as `/file-upload`. Query strings retain existing r3 behavior. A single identity encoding
token is case-insensitive; compound encoding lists are unsupported. Malformed HTTP framing remains outside the uniform
JSON guarantee.

`Expect: 100-continue` is an observable admission boundary. Supported requests receive Continue only after route/header
validation and slot reservation. Invalid route/method/media/encoding or trustworthy oversized length must receive the
corresponding readable error before Continue and before the client sends any body bytes. Unsupported expectation tokens
receive readable 417. With two incomplete admitted uploads, another receives readable 503 with positive integer
Retry-After and no Continue. Cancellation, complete success, parser failure and timeout each release capacity. These
external observations establish admission behavior and slot recovery, not absence of internal allocations.

| Case  | Added observation                                                                                       | Requirements                 |
| ----- | ------------------------------------------------------------------------------------------------------- | ---------------------------- |
| TC-01 | Direct multi-fault 404/405/415 precedence, including Allow.                                             | APP-V1-002,007; APP-REQ-002  |
| TC-02 | Exact path matching and single case-insensitive identity encoding.                                      | APP-V1-002,007               |
| TC-03 | Header validation, oversized length and unsupported Expect reject before body transmission.             | APP-V1-002,003,007           |
| TC-04 | Two slots, early busy rejection, and release after abort, success and parser error.                     | APP-V1-003,007; APP-EVAL-006 |
| TC-05 | Idle accepted upload receives readable 408 and both slots become reusable.                              | APP-V1-003,007               |
| TC-06 | Periodically active upload reaches absolute deadline, receives readable 408 and releases capacity.      | APP-V1-003,007               |
| TC-07 | Admitted unfinished upload socket closes and the exact process generation exits normally after SIGTERM. | APP-V1-003,007,015           |

The [reviewed inventory](../../../tests/acceptance/fixtures/inventory.json) contains the unchanged 60 r3 cases and seven
additions. Actual pinned Playwright discovery during authoring found **67 cases in two files**. That is candidate
harness evidence; the separate complete product diagnostic and subsequent required execution must report their own
outcomes. No redundant parser fixture or extra case was added to reach a predicted count.

## Deadlines, cleanup and evidence limits

Use monotonic elapsed time and real configured behavior, with no runner option or shortened application timeout.
Configured intent remains ten seconds body idle, thirty seconds body total and five seconds shutdown. The observation
windows tolerate client scheduling and isolated container transport without claiming an exact millisecond guarantee:

| Observation                            | Mandatory window                                                             | Reason                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Header admission/rejection             | Within 3 seconds, with zero body bytes sent.                                 | Ends well before the ten-second idle deadline.                                                       |
| Idle body 408                          | 8–15 seconds from opening the request.                                       | Rejects immediate timeout and missing ten-second idle handling.                                      |
| Active body 408                        | 25–38 seconds from opening the request.                                      | Two-second prefix writes refresh idle activity; rejects idle-only or absent total handling.          |
| Abort slot recovery                    | Within 3 seconds, retrying only readable busy responses.                     | Allows cancellation propagation without assuming a sleep proves release.                             |
| SIGTERM socket closure and normal exit | Within 8 seconds from requesting SIGTERM, including acknowledgment/readback. | Preserves the reviewed five-second intent with measured scheduling tolerance, before forced cleanup. |

The total-deadline upload sends only a small valid fixture prefix and never completes its declared body. A reset cannot
satisfy either readable 408 assertion. Recovery admits two concurrent uploads and requires their independent exact
counts, so one leaked slot cannot hide behind one successful request. Every held socket has finally cleanup. Response
collection is bounded at 64 KiB; no request upload bytes enter artifacts. The existing 120-second per-case and
ten-minute suite budgets remain unchanged.

TC-07 reads the reviewed controller's initial `/state`, requires a running healthy process, then receives 100 Continue
for an incomplete upload. It sends only authenticated bodyless POST `/signal-term`, validates the closed 202
acknowledgment against the complete initial target and generation, and polls only POST `/state`. Every successful state
observation must preserve project, service, container, image, original start timestamp and restart count. Only explicit
controller 409 reads may retry within the same observation budget. The fixed controller owns the mapping to the exact
tested images; the acceptance client receives no arbitrary target, command, signal or Docker socket.

Actual socket closure is observed before client cleanup. Any 200 response to that unfinished upload is rejected. Normal
exit means running, paused, restarting and dead are all false; exitCode is zero, oomKilled and hasError are false. Exit
137, a restart, a changed identity, no-op acknowledgment, absent closure or an overrun fail. `/start` restoration and
subsequent health/two-slot recovery are mandatory; observation and cleanup errors remain failures. Original AC-12
stop/start/pause/resume checks remain unchanged.

**Graceful admitted-response drain remains unresolved.** Daemon acknowledgment, socket reset and normal exit do not
establish signal-handler entry or a complete admitted response after that boundary. There is no skipped mandatory drain
case and no inferred drain pass. Migration requires fresh independent shutdown source/configuration review and explicit
operational disposition. Any future claimed drain pass needs an independently justified stopping boundary before
completing the held body, its exact response, and normal exit. Connection/header limits, memory allocation/retention,
no-runtime-parser dependency, exact timer configuration and managed-host behavior also retain their separate
source/image/resource/operational evidence requirements.

## Completeness, controls and execution

Discovery compares exact stable file/title identities with the checked-in inventory, rejecting missing, duplicate,
renamed and extra cases. Full execution requires that same inventory and exactly one passed result per case, expected
status passed, zero retry attempts and zero configured retries. Skipped, failed, interrupted, timed-out,
expected-failure, zero and missing results fail. The existing no-filter launcher and forbid-only configuration remain;
stale full reports are removed before execution. No selector, skip mode, runner bypass or new environment input is
added.

`npm run check` performs standalone type/fixture/specification checks, original controls, added transport controls and
exact discovery. Discovery writes only `.artifacts/discovery.json`, labeled `candidate-discovery`. Full `npm run e2e`
requires the existing explicit target binding and writes `.artifacts/result.json`, labeled `application-execution`, with
contract, suite, manifest, target, inventory and actual outcome identities. The host controller independently validates
those identities. An unbound candidate diagnostic never substitutes for r3 required acceptance.

Controls use the same response/admission/timeout/identity/exit/inventory/specification predicates as candidate
execution. Deliberately wrong loopback responders reject premature Continue, waiting for body before busy rejection, a
leaked slot, reset instead of readable timeout, incorrect status and premature total timeout. Mutated records reject
wrong precedence, normalized aliases, missing/duplicate/skipped/zero results, external OpenAPI references, multipart
replacement, absent statuses, loose success schemas, HEAD response content, stale lifecycle identity/generation, forced
exit and no-op shutdown. Positive controls ensure those predicates can accept their documented input. Short control-only
timeout windows never change application-case windows. Controls close listeners in finally and report intentional
failures separately; they are not an application stub or product acceptance pass.

Authoring stops at this reviewable candidate. No baseline, registry, runtime configuration, root gate, product parser,
server, UI, image, dependency version, release or external environment change is part of this contract.
