# hosted-v1 independent candidate contract

Dated 2026-10-10, coordination r19. This candidate succeeds **docs-v1** only through separate protected-main candidate
publication, authenticated binding and genuine product activation under the
[transition guide](../acceptance-transition.md). It adds three complete profile declarations and independent hosted
cases; it grants no destination, credential, provisioning, deployment or production approval. Authoring is authorized;
no candidate freeze or hosted result is claimed.

The [hosted-profile protocol](../hosted-profile-policy.md) defines the closed declarations, immutable lineage and
HostedAcceptanceV1 envelope. The adopted [delivery boundary](../../deployment/hosted-delivery-policy.md) defines the
closed HostedSuiteInputV1/HostedSuiteResultV1 handoff and bounded authentication mechanism. Those schemas and value
types are incorporated without extension. The delivery-policy parent and PROFILE-DECLARATIONS must be published and
reconciled before dependent merge; a stacked branch or this contract is not prerequisite evidence.

## Preserved local obligations and independent oracle

Preserve all 72 predecessor `(file,title)` tuples: 60 in `acceptance.spec.ts`, seven in `transport.spec.ts`, five in
`docs.spec.ts`. Preserve their bodies, assertions, fixture bytes/recipes, timing, configuration, ordinary no-argument
launcher and report semantics. The predecessor inventory SHA256 is
`98681c1811ed3b54cf8c2994e9a24a4b2afd6a8e0f8c575d9db63cf095afc7f4`. In the new suite objects, only identity revision
fields/constants become `hosted-v1`; prior Git objects, contracts and genesis stay immutable. New hosted files cannot
enter the local `specs/` directory. Local execution remains complete even when hosted prerequisites are unavailable.

The [r3](../acceptance-contract.md), [transport-v1](transport-v1.md) and [docs-v1](docs-v1.md) contracts remain
normative for their unchanged local responsibilities. Their independent fixture manifest and literal construction
establish the oracles; no product parser, provider output, private sample, decoder invocation or observed server answer
creates an expectation. CBR/VBR/padded encoded counts remain 9/16/21. The structural Xing fixture remains two physical
frames, despite its false advertised count. Boundary recipes remain 1,152,000 bytes/3,000 frames; 6,291,456/16,384;
20,971,520/54,613 including the supported trailing tag; and 20,971,521 over-limit bytes.

`fixtures/profiles.json` and all three fixed inventories use revision `hosted-v1`. Local mappings expand the following
reviewed groups into every exact predecessor tuple; no range, prefix matcher or abbreviated ID is stored in JSON.
Requirement mappings describe responsibility, not proof that one case closes every aspect of a requirement.

| Existing literal case group | Exact requirement IDs for each tuple in that group |
| --------------------------- | -------------------------------------------------- |
| AC-01, AC-03, AC-11         | APP-V1-001, APP-V1-002, APP-V1-007                 |
| AC-02, AC-04                | APP-V1-002, APP-V1-004, APP-V1-005, APP-V1-009     |
| AC-05, AC-06                | APP-V1-002, APP-V1-004, APP-V1-005                 |
| AC-07, AC-08, AC-09         | APP-V1-003, APP-V1-007, APP-REL-005                |
| AC-10                       | APP-V1-002, APP-V1-007                             |
| AC-12                       | APP-V1-001, APP-V1-003, APP-V1-007, APP-V1-015     |
| TC-01, TC-02, TC-03         | APP-V1-002, APP-V1-003, APP-V1-007                 |
| TC-04, TC-05, TC-06         | APP-V1-003, APP-V1-007                             |
| TC-07                       | APP-V1-003, APP-V1-007, APP-V1-015                 |
| DC-01, DC-02                | APP-V1-002, APP-V1-008, APP-V1-016, APP-REL-005    |
| DC-03, DC-04                | APP-V1-001, APP-V1-016, APP-REL-005                |

Assessment trace remains APP-REQ-002/003/006 for upload/count/JSON and APP-REQ-004/005 through independent oracle and
separate source/dependency review. Only protocol-approved APP-V1 and APP-REL IDs enter profile declarations.

## Complete stage matrix

Each row is one case and one inventory tuple. File aliases expand literally to `hosted/stage/specs/stage-ui.spec.ts`
(UI), `hosted/stage/specs/stage-api.spec.ts` (API) and `hosted/stage/specs/stage-docs.spec.ts` (DOCS). Titles below are
exact. Every member of a stated submatrix is mandatory; no dynamically omitted member, skip, retry, expected failure or
provider-specific fallback can pass the case.

All requests use the launcher-approved HTTPS ingress origin with normal TLS validation. Successful uploads require JSON
Content-Type and exactly `{ "frameCount": <expected positive integer> }`. Errors require the specified status, JSON
Content-Type and exactly a nonempty useful string `error`, with no partial count. Malformed HTTP framing is outside the
uniform application JSON guarantee. Never send a hosted request to a private API or fault-controller endpoint.

| File | Exact title                                                         | Required observation                                                                                                                                                                          | Requirement IDs                                 |
| ---- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| UI   | HS-01 accessible UI completes a real small MP3 upload               | Labeled file control and exact Analyze MP3 action; selection alone sends nothing during the fixed pre-action observation; real CBR browser upload yields exactly 9 in a usable status/result. | APP-V1-001, APP-V1-002, APP-REL-005             |
| UI   | HS-02 upload error permits a subsequent valid browser upload        | Frozen malformed fixture produces readable error; a later real CBR upload succeeds with exactly 9 and enabled usable controls.                                                                | APP-V1-001, APP-V1-002, APP-REL-005             |
| API  | HS-03 CBR count and accepted media survive managed ingress          | CBR yields exactly 9 with audio/mpeg and application/octet-stream, plus the fixed case/parameter normalization submatrix below.                                                               | APP-V1-002, APP-V1-004, APP-V1-009              |
| API  | HS-04 VBR physical count survives managed ingress                   | VBR yields exactly 16 with each accepted media type; do not subtract its complete metadata-bearing frame.                                                                                     | APP-V1-002, APP-V1-004, APP-V1-005, APP-V1-009  |
| API  | HS-05 padded physical count survives managed ingress                | Padded bytes yield exactly 21 with each accepted media type.                                                                                                                                  | APP-V1-002, APP-V1-004, APP-V1-009              |
| API  | HS-06 Xing-bearing physical frames remain counted                   | The frozen Xing structural fixture yields exactly 2, not its advertised count.                                                                                                                | APP-V1-002, APP-V1-004, APP-V1-005              |
| API  | HS-07 malformed and unsupported uploads retain readable JSON errors | Empty and truncated-frame each yield 400; MPEG-2 yields 415, with the required error-only shape.                                                                                              | APP-V1-002, APP-V1-005, APP-REL-005             |
| API  | HS-08 unsupported media and encoding remain isolated errors         | Missing Content-Type, text/plain, gzip and compound identity encoding each independently yield 415; one identity token remains accepted.                                                      | APP-V1-002, APP-V1-007                          |
| API  | HS-09 public upload paths and methods retain their contract         | Exact path/query succeeds; the fixed alias/method/HEAD matrix below rejects with preserved headers and body rules.                                                                            | APP-V1-002, APP-V1-007                          |
| API  | HS-10 upload above one MiB retains its complete count               | Send 1,152,000 actual bytes with declared length and receive exactly 3,000.                                                                                                                   | APP-V1-003, APP-V1-014                          |
| API  | HS-11 six MiB upload retains its complete count                     | Send 6,291,456 actual bytes with declared length and receive exactly 16,384.                                                                                                                  | APP-V1-003, APP-V1-014                          |
| API  | HS-12 exact twenty MiB upload is accepted                           | Send 20,971,520 actual bytes with declared length and receive exactly 54,613.                                                                                                                 | APP-V1-003, APP-V1-014                          |
| API  | HS-13 one byte over the limit yields readable error and recovery    | The 20,971,521-byte fixture yields readable JSON 413; a subsequent CBR upload yields exactly 9.                                                                                               | APP-V1-003, APP-V1-007, APP-V1-014              |
| API  | HS-14 valid upload without Content-Length is accepted               | Send genuine HTTP/1.1 chunked CBR bytes, record no Content-Length and chunked framing, receive exactly 9.                                                                                     | APP-V1-002, APP-V1-003, APP-V1-014              |
| API  | HS-15 actual-byte limit survives upload without Content-Length      | Send genuine chunked over-limit bytes without Content-Length; readable JSON 413 and a later valid count are mandatory. Record framing and actual sent bytes.                                  | APP-V1-003, APP-V1-014                          |
| API  | HS-16 externally aborted upload permits later complete upload       | Deliberately abort one owned incomplete request, observe no partial 200, then complete a new known-count upload.                                                                              | APP-V1-003, APP-V1-007, APP-V1-014              |
| API  | HS-17 public frontend health remains service-local                  | Public GET /healthz returns exactly {"status":"ok"}; it does not independently prove sidecar readiness or image identity.                                                                     | APP-V1-007, APP-REL-005                         |
| DOCS | HS-18 public docs routes assets errors and headers survive ingress  | Preserve the complete docs-v1 public route/method/HEAD/query/error matrix, exact derivative/logo bytes, media/disposition and single effective docs policy.                                   | APP-V1-002, APP-V1-008, APP-V1-016, APP-REL-005 |
| DOCS | HS-19 served specification retains local transport semantics        | Apply bounded strict YAML, semantic specification and same-document reference predicates from docs-v1.                                                                                        | APP-V1-002, APP-V1-008, APP-V1-016              |
| DOCS | HS-20 desktop docs render and interact under effective CSP          | At 1280x900, actual endpoint/schema rendering, local logo and real 400-schema expansion pass the finite browser predicates below.                                                             | APP-V1-001, APP-V1-016, APP-REL-005             |
| DOCS | HS-21 narrow docs render and interact under effective CSP           | At 390x844, the same actual schema-change, logo and finite observation pass; preserve reviewed responsive branding behavior.                                                                  | APP-V1-001, APP-V1-016, APP-REL-005             |
| DOCS | HS-22 upload-page policy remains isolated from docs exceptions      | Root policy retains docs-v1's original meaning and effective inline-style protection; docs-only exceptions must not leak.                                                                     | APP-V1-001, APP-V1-016, APP-REL-005             |

HS-03 additionally sends CBR with `Audio/MPEG; charset=binary` and `Application/Octet-Stream; charset=binary`; each
returns 9. HS-08 isolates missing media, `text/plain`, `Content-Encoding: gzip` and
`Content-Encoding: identity, identity` using otherwise valid CBR input. One case-insensitive `IDENTITY` token with
`audio/mpeg` returns 9.

HS-09 sends CBR to `/file-upload?source=acceptance` and requires 9. POST aliases `/file-upload/`, `/FILE-UPLOAD` and
`/%66ile-upload` require readable 404. GET/PUT/OPTIONS on exact `/file-upload` require 405 and `Allow: POST`; HEAD
requires 405, the same Allow and JSON Content-Type, but an empty body. These are isolated public requests, not an
assertion of private multi-fault ordering or provider handling of malformed framing. A real managed-ingress
incompatibility fails.

HS-14/15 witness client HTTP/1.1 framing and actual bytes passed to the owned transport. They do not assert that the
provider forwards chunks unchanged. A browser-buffered or declared-length substitute cannot pass. HS-16 records actual
client abort and later recovery without claiming internal admission, two reusable slots, memory release or retention.
The complete local two-slot, Expect, idle/total deadline, proxy-fault and SIGTERM obligations remain mandatory; their
private timing or shutdown observations are not promised through an ingress that may buffer or queue.

### HS-01 selection-only observation amendment

Independent review found that an immediate zero-request snapshot could accept a delayed selection-triggered upload with
a no-op button. Before invoking the exact Analyze MP3 action, observe 500 ms after file selection resolves with the
upload-attempt listener continuously active from before navigation through the final one-submission assertion. Require
zero upload attempts throughout that interval, then retain the real response, raw selected bytes, count 9 and
usable-controls assertions after the explicit action. This proves the finite observation, not absence of every possible
arbitrarily delayed upload. An owned positive page uploads only on the button; its negative counterpart uploads after
100 ms from selection with a no-op button and must fail the same predicate. Both controls establish fixture readiness,
real request/response behavior and cleanup; setup failure cannot substitute for intended refusal. This additive
2026-10-10 amendment precedes the corrected helper implementation and changes no preserved local case.

## Complete production smoke matrix

Every row uses exact file `hosted/production/specs/production-smoke.spec.ts` and the human-approved production origin.
Only functional smoke runs: no large upload, boundary/concurrency campaign, stress, outage injection or private probe.

| Exact title                                                  | Required observation                                                                                                                            | Requirement IDs                     |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| HP-01 usable UI completes one small known-count upload       | Real browser selection/action uploads frozen CBR and receives exactly 9 at the approved origin.                                                 | APP-V1-001, APP-V1-002, APP-REL-005 |
| HP-02 production docs are genuinely rendered and usable      | Desktop rendering, actual response-schema expansion, local logo and finite CSP/foreign-attempt checks; no error-triggering application request. | APP-V1-001, APP-V1-016, APP-REL-005 |
| HP-03 production specification remains available and correct | GET published YAML with exact media/disposition and bounded transport/reference semantics from docs-v1.                                         | APP-V1-002, APP-V1-008, APP-REL-005 |

HP-02 expands the documented 400 response; it does not send a malformed upload. Provider revision/digests/configuration,
access convergence and stable before/after identity belong to the trusted envelope, not always-passing smoke cases.

## Fixed discovery, execution and reports

| Profile    | Spec directory           | Configuration                   | Fixed wrapper                 | Complete inventory                                                 |
| ---------- | ------------------------ | ------------------------------- | ----------------------------- | ------------------------------------------------------------------ |
| local      | specs/                   | playwright.config.ts, unchanged | scripts/run-e2e.ts, unchanged | fixtures/inventory.json: preserved 72 tuples                       |
| stage      | hosted/stage/specs/      | playwright.stage.config.ts      | scripts/run-stage.ts          | fixtures/inventory.stage.json: the 22 literal tuples above         |
| production | hosted/production/specs/ | playwright.production.config.ts | scripts/run-production.ts     | fixtures/inventory.production.json: the three literal tuples above |

Hosted discovery writes only `.artifacts/hosted-stage-discovery.json` and `.artifacts/hosted-production-discovery.json`;
it never reads private input. Hosted execution writes only `.artifacts/hosted-stage-result.json` or
`.artifacts/hosted-production-result.json` for the compiled role. Local output paths remain unchanged; no caller output
path or environment selector is accepted.

All paths in this table are package-relative. Keep existing `e2e` and `browser:install` behavior; add only `e2e:stage` =
`node scripts/run-stage.ts` and `e2e:production` = `node scripts/run-production.ts`. `npm run check` discovers all three
fixed profiles sequentially without application targets, credentials or test-body execution, in addition to preserved
fixture/oracle/transport/docs controls and new owned hosted controls. Exact discovered tuple sets must equal inventories
and mappings; zero/duplicate/missing/extra cases and executable specs outside the three directories fail. Local
reporters retain their existing basename identities; hosted rows retain the full package-relative paths in these
matrices.

Hosted configurations use pinned Chromium, one worker, zero retries, forbid-only, blocked service workers, no trace/HAR,
video or automatic screenshot recording. Each case has a fixed 120-second budget; profile execution remains within the
15-minute wrapper bound. No caller glob, grep, project, config, role, URL or timeout override is accepted. Owned browser
predicate screenshots establish the retained-document boundary, not reusable raw browser/credential traces.

Wrappers compile their own role and reject arbitrary arguments. They remove stale owned results and validate the closed
input against that role, target environment, original source and actual immutable extracted suite before any connection.
The launcher installs/verifies the approved package and prepares its pinned browser before acquiring a token; it invokes
pinned npm without a shell, with `--ignore-scripts run e2e:stage` or its fixed production counterpart. Do not execute
npm pre/post hooks. Discovery and ordinary PR/main checks never acquire provider credentials.

HostedSuiteInputV1 is strictly bounded UTF-8 JSON on stdin: one object, no BOM/trailing data, at most 64 KiB actual
bytes, EOF within five seconds. Only its defined keys are admitted. The token is a maximum 16 KiB
whitespace/control-free Google ID token with lifetime through 15-minute execution, 30-second cleanup and a further 60
seconds. No refresh or body-replay retry exists. Decoding JWT claims proves neither minting provenance nor authority.

The sole nonsecret path input is `HOSTED_PRIVATE_DIRECTORY`, an owned random 0700 parent outside checkout/artifact
trees. The wrapper exclusively creates `input.json` there at 0600 without following symlinks; workers read that fixed
regular file only after validating ownership, mode, parent and byte bounds. No separate caller input-file path is
accepted. Do not put secrets in argv, environment, page JavaScript, cookies/storage, default reporters, protocol logs,
exceptions, trace/HAR/video or artifacts. Sanitize parent and worker environment, including inherited
debug/proxy/cloud/GitHub/Node and npm overrides. Private file permissions do not isolate same-UID/root peers; the runner
must provide that isolation.

HostedSuiteResultV1 uses the policy's exact closed schema and a fixed wrapper-owned result path. Require launch/source/
suite/role parity and the complete authenticated inventory. A passing result has each tuple exactly once, actual and
expected status passed, zero retry values and cleanup passed. Failed results may contain a unique known subset; blocked
results contain no executions. Missing, stale, malformed, extra or duplicate rows cannot pass. Raw child output is
bounded and discarded; only sanitized closed rows/fixed failure codes remain. Drain callbacks and stop/reap owned
children before private-file deletion. Child or parent cleanup failure prevents a passing hosted envelope.

Invalid unauthenticated input produces no public result with invented identities. The suite result is consistency data,
not HostedAcceptanceV1 or deployment approval. The trusted launcher independently binds exact publisher/reservation
bytes, same-content image identities and original run, adds actual before/after provider observations and parent
cleanup, then assembles that separate envelope. Counts never replace exact sets. Ordinary software publication/local
reports/retries remain unchanged; a local pass cannot satisfy any hosted case.

## Authentication adapter and finite browser observation

Use only the canonical provider-returned HTTPS service origin and exact receiving-service audience established by the
trusted launcher. No arbitrary URL, custom/tag origin, localhost proxy or suffix-only match. Direct requests derive
fixed relative paths, validate exact origin before adding `X-Serverless-Authorization`, verify TLS normally and refuse
automatic redirects. Check canonical `/docs` redirects as responses; any later `/docs/` request is independently
constructed from the known route, never from an untrusted Location. Token provenance, IAM and target observations are
launcher obligations.

Hosted browser helpers own fresh single-page contexts and a CDP session installed before navigation. Validate origin and
ownership on every request/hop; remove and replace auth headers per request. Intercept responses, refuse redirects with
Location and continue original responses without replacement fields. Preserve original bytes, statuses and raw
security-header multiplicity. A credential-free context guard blocks foreign/unowned/unknown-owner requests; service
workers and every WebSocket are blocked. Do not broaden to arbitrary popups, workers or cross-origin frames. Never use
global auth headers, route.fetch/fulfill response reconstruction, TLS/CSP bypass or false successful responses.

All guard/CDP errors, forbidden attempts and paused-request deadline failures latch sanitized terminal failure. Drain
pending callbacks through cleanup before final classification. A blocked foreign attempt still fails an actual case;
only a separately labeled owned control may expect it. CDP protocol messages contain injected secrets, so parent, worker
and browser custom/debug loggers and raw event serialization must remain disabled.

Apply the existing docs-v1 strict YAML/specification, exact derivative/logo, effective CSP/header and browser predicates
through this separate hosted boundary. Preserve the two reviewed style hashes, embedded-image permission and strict
root-page isolation; introduce no policy relaxation, vendor change, auth requirement in OpenAPI or new response mock.
Desktop/narrow docs must show actual endpoint/request/response schemas, load the exact local logo and expand the real
400 schema from description to required string error. Decorative markup, a click or a fragment alone is insufficient.

Observe zero attributed foreign attempts, enforced CSP violations or page errors during initial rendering/interaction,
screenshot and a 200 ms retained live-document interval. Reject CSP meta/report-only policies, including late insertion.
Check liveness, close observation synchronously, then classify after cleanup; late owned controls inject only after the
actual screenshot boundary and must be observed before classification. Destructive navigation/close delivery and other
unobserved lifecycle/protocol families are not proved. Additional blocking of popups/workers/WebSockets protects the
credential boundary; it does not extend docs-v1's finite rendering claim into universal network or teardown coverage.

## Independent falsification and freeze prerequisites

Controls use the same input, transport, inventory/report and browser predicates as real hosted runs, with synthetic
credentials and owned bounded fixtures only. Preserve all original controls. Meaningful valid counterparts precede
rejection checks; missing exports, setup failure or an unreachable application cannot count as intended semantic red.

Required control families are closed input/role/identity/time/size refusal;
stale/missing/extra/duplicate/skipped/retried/ expected-failure results; omission of any one profile discovery; all
preserved local tuples; wrong count/status/error/ framing; abort/no-partial-success; credential-free foreign and
redirect receivers; every-hop header replacement; unknown ownership/popups/frames/worker/WebSocket refusal; duplicate
CSP/security-header and original response-body fidelity; effective CSP intersection in both header orders; docs
renderer/spec/logo/root-policy failures; finite late-error/meta attribution; paused-request deadlines, terminal-latch
propagation, cancellation, callback drainage and cleanup failure. No credential, invocation header, raw request/event or
unredacted exception may survive in control artifacts.

The delivery boundary records 26 passing finite macOS loopback CDP controls; this contract records adopted design input,
not a new run, Linux compatibility result, Google credential proof or hosted pass. The prior fetch/fulfill design lost
header fidelity and remains rejected. Before candidate freeze, actual pinned Linux and HTTPS controls must prove the
adopted mechanism, including normal certificate verification, response/header/CSP fidelity and intended foreign-receiver
refusal, then all integrated standalone checks/discovery must pass. An unsupported mechanism blocks freeze; do not skip
it, silently relax security, or turn the failure into a product acceptance result.

## Separate operator gates and stop point

| Gate outside executable case inventories             | Required actual evidence                                                                                                                                                                                             |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity/access: APP-V1-006,012,015; APP-REL-001–004 | Authenticated source/suite/release bytes, same-content registry transfer, approved resource/origin, exact active pair/configuration and stable before/after revision; credential and production-approval provenance. |
| Startup/readiness: APP-V1-007,014,015; APP-REL-005   | Real managed cold start/startup, configured probes/timeouts and ready pair identity; GET /healthz alone is insufficient.                                                                                             |
| Resource/retention: APP-V1-003,014,015; APP-REL-005  | Measured bounded workload/headroom, memory/CPU/concurrency/instance controls, buffering/abort effects and no retained uploads; no invented throughput guarantee.                                                     |
| Managed lifecycle: APP-V1-007,014,015; APP-REL-005   | Approved nonproduction termination/deadline/overlap and capacity-recovery observations; client abort or local Docker evidence cannot prove hosted process behavior.                                                  |
| Recovery: APP-V1-015; APP-REL-004,006                | Authorized stage rehearsal with both prior-good digests restored, observed convergence and retained candidate/recovery artifacts.                                                                                    |
| Cost/authority: APP-V1-014; APP-REL-001,002          | Fresh dedicated shared USD 75 Cloud Run cap and USD 100 project alert readiness, account/region/resource authority and reviewed protected IaC/state.                                                                 |

A passing stage inventory alone cannot close HOST-01 or recovery. Unperformed or failed operator evidence remains open;
never encode it as a skipped or always-passing case. Full local lifecycle/resource/source review remains required,
including the transport contract's explicitly unresolved graceful admitted-response drain.

Stage automation follows verified software publication, exact-image handoff, ready launcher and current cost/access
controls. **Every production application deployment, including an authenticated/no-traffic candidate, requires a real
human event for the exact source, pair, configuration, service, exposure and recovery policy.** Changed inputs
invalidate that approval. Companion/coordinator review and test success cannot supply it. Production smoke follows the
authorized deployment; successful stable identity/smoke and separate additive finalization precede `v1.0.0`.

Authoring owns only the independent acceptance package and this unique successor contract. No root registry, gate,
workflow, publisher, product, IaC, credential or provider change belongs to the candidate. Stop at the reviewable
contract and suite handoff; candidate publication, exact merged binding, product activation, trusted hosted-consumer
migration, provider operations and verified hosted results remain separate steps. This document reports no tests or
hosted run.
