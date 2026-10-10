# P4 API transport handoff

Observed on **2026-10-09** against local P3 commit `f7ad2f5458e27ff5349f6c3f1a7d481a46770764` plus the exact uncommitted
transport/test files identified below. The native API is locally validated; this API-only handoff does not establish
full P4 browser/container acceptance, shipping readiness or managed deployment.

Trace: APP-V1-002,003,007,008,010,013,016. The independent r3 suite remains read-only at local baseline commit
`28c2a9c548f872dac54d9395a8ca0ed852f82240`, tree `b789ffe426f4d0a303144338923748c9cdf424cf`, fixture manifest SHA-256
`2f56db4641f9e5c09b34c2bc0c630e85a46a010025c634375b110a35e2cb120a`. The definitive protected-main freeze remains the
distinct prerequisite recorded in [baseline.json](../testing/baseline.json).

## Implemented transport and lifecycle

`server/src/http.ts` exports `createApiServer()` returning an unbound native `node:http` server and idempotent
`shutdown()` promise. The factory accepts validated budget overrides for deterministic local tests; production uses the
fixed defaults. `server/src/index.ts` starts the compiled API on `0.0.0.0`, validates the sole runtime setting `PORT`
(default 3000, integer 1–65535), and handles SIGTERM/SIGINT. Tests bind factory servers to loopback ephemeral port zero.
Startup errors are fixed diagnostics with exit code 1, without reflecting configuration values.

Routing, methods, MIME/encoding, bounded collection and the unchanged parser run in contract order. Known-route 405
responses set `Allow`; HEAD carries JSON metadata and no body. Query strings preserve pathname matching. Service-local
health returns exactly `{"status":"ok"}`. Successful uploads return exactly `{"frameCount":number}`; typed parser
failures become 400/415 JSON. Unexpected parsing/allocation failures have a fixed generic 500 response. That defensive
500 branch was source-reviewed, not induced through a public crash endpoint or claimed as an observed unit case.

Every upload response is noncacheable JSON. Missing/unsupported media and encoded bodies are rejected. The inclusive
20,971,520-byte cap is independently checked on received chunks, even without Content-Length. A trustworthy over-limit
declared length is rejected before allocation. `100 Continue` is sent only after header checks and admission. All
headers within the 8,192-byte limit remain visible to policy checks: `maxHeadersCount` is zero because Node's
count-based setting silently truncates exposed fields rather than rejecting an oversized count.

| Resource or deadline          | Production default                            |
| ----------------------------- | --------------------------------------------- |
| Simultaneous admitted uploads | 2                                             |
| Total TCP connections         | 64                                            |
| Complete body deadline        | 30 seconds from admission, without extension  |
| Body inactivity deadline      | 10 seconds, refreshed only on received data   |
| Header deadline               | 10 seconds, native check interval up to 1 sec |
| Keepalive                     | 5 seconds                                     |
| Shutdown drain                | 5 seconds, then tracked sockets are destroyed |
| Rejected-body close deadline  | 1 second                                      |
| Header size                   | 8,192 bytes                                   |
| Stream high-water mark        | 65,536 bytes                                  |

The connection cap rejects excess sockets before application handling. Saturated/shutting-down upload admission returns
503 JSON with `Retry-After: 1`. Body deadlines return 408 JSON. These explicit operational responses supplement the
frozen malformed/unsupported/oversize cases; they are not substituted for a mandatory acceptance expectation. Malformed
HTTP wire framing or incomplete headers may be rejected by Node before application logic, as the contract allows.

Each admitted request owns one buffer with capacity equal to its valid declared length, or the fixed 20 MiB cap for an
unknown-length body. Chunks are copied into that buffer; no array of arbitrary tiny chunks accumulates. The parser sees
only an initialized received-byte view, without a second whole-upload concatenation. Completion, rejection, timeout,
response closure and abort all release the buffer reference, timers and admission slot exactly once. Bytes, filenames
and request bodies are never logged or written to disk. No runtime dependency was added.

Early rejection first writes the complete JSON body with Content-Length, then delays response termination while
discarding without retention. Discard pauses after 64 KiB, plus a possible already delivered chunk. Request completion
or the one-second deadline closes the response/socket. This permits a client still writing a large body to read the
error before the server closes. Response content is always fixed and small. The close deadline is bounded by ordinary
event-loop scheduling and output flushing, not a hard real-time guarantee.

Shutdown stops listening and new upload admission, permits an admitted complete request to finish, and destroys tracked
sockets after the deadline. It never treats a valid prefix of an incomplete request as a complete upload. Native close,
header-timing and `checkContinue` behavior were checked against the
[Node 24 HTTP documentation](https://nodejs.org/docs/latest-v24.x/api/http.html) and verified on pinned Node 24.20.0.

## Actual checks and repair history

```sh
node --test tests/unit/http.test.ts
npm run typecheck
npm run build
node node_modules/prettier/bin/prettier.cjs --check server/src/http.ts server/src/index.ts tests/unit/http.test.ts
```

The final run used Node **24.20.0**, npm **11.19.0** and TypeScript **7.0.2**. All **19 HTTP/TCP tests passed**, with
zero failures, skips or cancellations; strict application typecheck and compilation both exited zero. Tests create real
loopback connections and exercise:

- Health, unknown routes, method/Allow/HEAD semantics, query strings, MIME casing/parameters and identity encoding.
- More than 64 short headers followed by `Content-Encoding: gzip`: 415 JSON, preserving the unsupported-encoding policy.
  A supported Content-Type after those fields remains visible and yields the independently expected count.
- Empty, malformed and unsupported data with required JSON error shapes and exact valid counts.
- Exactly 20 MiB using declared length and chunked transfer: **54,613** physical frames in both cases.
- Declared oversize before a body and during a complete body write, plus chunked one-byte-over: readable 413 JSON and a
  later successful request.
- A held incomplete request containing valid frames: no premature success, then observed abort and restored admission.
- Two admitted requests versus a third 503, body inactivity and absolute complete-body deadline despite continuing data.
- Graceful shutdown completing an admitted body, idempotence, and force-closing an incomplete body.
- Actual extra-connection rejection, incomplete-header timeout, bounded `100 Continue`, invalid budget/PORT handling and
  a real child entrypoint exiting 1 without reflecting its invalid PORT value.

Initial local tests exposed a real early-413 `EPIPE` race while a client was still writing. The response-flush/drain
sequence above corrected it; the original failing scenario now passes. Two test observations were corrected without
changing product expectations: handled `checkContinue` suppresses Node's ordinary `request` event, and client TCP
connect completion can precede the server's connection event. The final observers bind those actual events. No frozen
test, fixture, count, gate, parser or error module was modified.

Independent review then found that the initial `maxHeadersCount = 64` setting could hide a late Content-Encoding field.
The repaired transport disables count-based truncation while preserving the fixed header-byte cap. The new real HTTP
regression sends 70 short fields before policy headers and verifies both the unsupported encoding and accepted MIME
cases. All 19 focused tests, strict typecheck and build passed after this repair; the hashes below supersede the earlier
API handoff.

## Exact files and remaining integration evidence

```text
f0e2e647dcabe057ec06bcb65d3d6e551505d3e7c02b15db8209b751060b984d  server/src/http.ts
aed37145cd24fcdffd392e4e089c45b6268279a5ad3883d4a48ba220581c348f  server/src/index.ts
e4591dd90fce58644504e206f8aecd2845ff5be148c4f593b5274c2a584c061b  tests/unit/http.test.ts
```

The source bounds retained active upload buffers to at most 40 MiB, apart from stream/socket/runtime overhead and
garbage-collection timing. This does not itself prove an RSS bound or throughput claim. The controller must measure the
two-service system under the proposed API container memory limit of 256 MiB, verify both images and signal behavior, and
run the unchanged full acceptance suite through real frontend ingress. Public-path private-sample comparison, proxy
413/502/504 behavior, UI recovery, resource measurements and deployment remain outside this API-only handoff.
