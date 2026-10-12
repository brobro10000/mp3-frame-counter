# Assessment evaluation evidence

**Final independent assessment:** [submission-review.md](submission-review.md) records fresh candidate testing and
criterion statuses. Supported behavior passed; unrestricted MPEG-1 coverage is **partially met**, because independently
valid free-format and some ID3v2.4 layouts are rejected. Historical evidence below does not close that employer-scope
gap.

The questions below cover each supplied criterion in the preserved
[assessment source](../requirements/sources/assessment.html). Stable `APP-REQ`, `APP-EVAL` and `APP-SUB` IDs refer to
the [assessment registry](../requirements/assessment.md). Evidence is scoped to the supported local contract; this
document does not assign an employer score.

The [dated verification record](../validation/backend-audio-refactor.md) reports 269 server plus 70 frontend unit tests,
strict application/test type checks, source lint, generated OpenAPI validation and all 72 independent local acceptance
cases passing. Final run `mp3-e2e-45286-140fd7c71318` retained exact image/content identities and verified cleanup. Its
revision fields remain unrecorded. The later
[merge and publication record](../validation/backend-audio-refactor.md#product-merge-publication-and-freeze) separately
records exact-head review, the product merge, nine passing main validation checks and the publisher failure. The
separate 2026-10-12 delivery checkpoint records main run `38196084304` passing all nine mandatory checks and publication
of `v0.4.66` from reviewed visibility-fix source `8cc64d44fc12e0f8feea7fa4ddabfa38945c7544`, with 72 required
backend-audio cases and scoped cleanup passing.

## Correctness

- **Does the solution meet the requirements?** `APP-REQ-001–006`, `APP-EVAL-001`: TypeScript implements the exact raw
  upload endpoint, supported MPEG-1 Layer III structural count, no direct MP3 parsing dependency, and default JSON
  shape/headers. [Routes](../../server/src/modules/mp3/routes.ts), [schemas](../../server/src/contracts/mp3.ts) and
  [HTTP tests](../../server/tests/http.test.ts) make those boundaries reviewable. Opt-in diagnostics follow the separate
  owner amendment; unsupported formats and arbitrary metadata layouts are disclosed in [known gaps](known-gaps.md).
- **Does the solution determine the number of frames correctly?** `APP-REQ-003–004`, `APP-EVAL-001`: the
  [parser](../../server/src/modules/mp3/analyze.ts) advances by header-derived complete lengths, checks EOF and excludes
  only one recognized leading Xing/Info carrier. Declared counts never drive traversal. Independent fixtures and actual
  sample HTTP produced 6,089 audio / 6,090 physical / one excluded carrier. The original assignment leaves the
  definition ambiguous; the owner adopted audio counting. The employer oracle is unknown, and the historical physical
  result remains independently established.
- **Does the solution handle errors appropriately?** `APP-EVAL-001`, `APP-EVAL-005`: typed parser failures and transport
  refusals produce safe catalogue errors with agreed status/header behavior; failures never yield partial success. Real
  socket and independent browser/HTTP cases cover invalid/truncated data, limits, deadlines, abort, busy admission,
  upstream failure and recovery. Native protocol refusals or disconnected clients may have no JSON response.

## Code Quality

- **Is the code well-organised, readable and maintainable?** `APP-EVAL-002`: the unbound
  [Fastify factory](../../server/src/app.ts) separates feature routes, transport/lifecycle, pure MPEG/Xing analysis,
  canonical contracts and documentation. The existing frontend separates service, hook and components. Inline byte maps
  explain framing beside the code they describe. [Architecture diagrams](../architecture/diagrams/README.md) reference
  actual sources; historical planning diagrams remain historical.
- **Does the code follow TypeScript good practices?** `APP-REQ-001`, `APP-EVAL-003`: strict compilation covers server,
  frontend and localized test source. Unknown response JSON is validated before use; readonly data and typed domain
  reasons keep unsafe native errors outside public responses. The factory can be constructed and injected without
  listening or installing process signal handlers.
- **Does it utilise TypeScript's features effectively?** `APP-EVAL-003`: TypeBox schemas infer wire types, the Fastify
  type provider connects registered DTOs to routes, and discriminated browser outcomes distinguish success, pending,
  cancellation, timeout and server failures. Interpreted shared guards enforce closed objects and count/code/status
  invariants in the browser without code generation or unsafe-eval. Types support runtime validation rather than
  substituting for it.
- **Does it include standardised formatting, linting and testing tools?** `APP-EVAL-004`: pinned Prettier, Oxlint,
  TypeScript, Node's test runner and independent Playwright have documented commands in the
  [root README](../../README.md#verify-and-understand). Source lint covers TypeScript/TSX and tests; OpenAPI has
  semantic validation, and diagrams have a render check. The 339 localized unit and 72 external case results are local
  evidence; the product merge's validation passed while its publisher failed. The later `v0.4.66` checkpoint records
  successful descendant main checks, 72 required cases, cleanup and publication separately in the
  [merge and publication record](../validation/backend-audio-refactor.md#product-merge-publication-and-freeze).

## Error Handling

- **Is error handling implemented appropriately?** `APP-EVAL-005`: the
  [closed error catalogue](../../server/src/contracts/errors.ts) fixes code, status, safe message and action. Known
  identities map explicitly and unknown failures become `INTERNAL_ERROR`, without stack, body, filename or cause.
  API/raw writers and configured NGINX 413/502/504 mappings are parity-tested. Unrelated static 404s and native framing
  failures are outside the application JSON guarantee.
- **Does it handle errors gracefully?** `APP-EVAL-005`: rejection, completion, abort, timeout and shutdown converge on
  idempotent release of buffers, admission slots, timers and listeners. The
  [browser hook](../../frontend/src/hooks/useMp3Analysis.ts) restores controls, cancels obsolete requests and ignores
  stale completions. Ky has no automatic retry/body replay; the user can explicitly retry after a readable failure.
  Finite regression cases demonstrate recovery, not proof against every possible lifecycle defect.
- **Does it provide useful messages to the user?** `APP-EVAL-005`: known server codes have contextual safe messages;
  network, timeout, cancellation and unreadable/invalid response outcomes stay distinct. Local size feedback explains
  the 20 MiB ceiling while ingress and API enforce actual bytes. The brief live status is accessible and separate from
  diagnostic detail; untrusted response text renders literally. Broad assistive-technology certification is unclaimed.

## Scalability

- **Is it scalable and able to handle large files?** `APP-EVAL-006`: the inclusive 20,971,520-byte ceiling, two admitted
  uploads, 64 connections, 30-second body and 10-second idle/header budgets bound one instance. Admission precedes
  buffer allocation; NGINX streams without upload storage or upstream retry. Exact/over-limit and recovery tests passed
  in non-root resource-limited containers. Whole-body buffering and synchronous analysis constrain concurrency; support
  above 20 MiB, sustained-load capacity and hosted scaling are unclaimed.
- **Is it optimised for performance?** `APP-EVAL-006`: one forward frame traversal creates no whole-file copy or
  retained per-frame list; diagnostics are bounded and the browser makes one upload. The
  [warm-process measurement](../validation/backend-audio-refactor.md#bounded-resource-measurements-and-evaluation)
  recorded a 0.284 ms sample median and 8.382 ms for a 20 MiB synthetic input, versus 0.200/3.059 ms for the earlier
  physical-only parser. Added analysis was slower on those inputs. This is not a peak-memory, throughput or cold-start
  benchmark. Streaming/workers need agreed load targets and measurements before adoption; see
  [scalability gaps](known-gaps.md#capacity-and-platform-evidence).

## Approach

- **Has the candidate used Git effectively?** `APP-EVAL-007`, `APP-SUB-001`: the repository retains requirement source,
  independent baseline, ordered reviewed historical changes and immutable release evidence. This amendment uses separate
  product, independent expectation and prerequisite lanes. Exact-head review, merge and the failed publisher are
  recorded in the
  [merge and publication record](../validation/backend-audio-refactor.md#product-merge-publication-and-freeze). The
  separate `v0.4.66` delivery checkpoint records the reviewed visibility fix, successful main checks and descendant
  publication. Repository delivery does not establish employer submission or acceptance.
- **Is there evidence of a structured approach?** `APP-EVAL-008`, `APP-SUB-002–003`: stable requirement IDs, frozen
  contract semantics, explicit module ownership, meaningful unit/socket/browser tests and dated evidence connect the
  assignment to the implementation. Failed and interrupted runs remain recorded, with harness corrections explained
  separately from product fixes. Startup and a portable known-count example are documented. The receipt date, five-day
  deadline and external submission are unverified (`APP-TIME-001`). The
  [provisional roadmap](known-gaps.md#freeze-and-roadmap) is not a promise to expand the submitted scope.
