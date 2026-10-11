# Assessment handoff

This handoff describes the current local MPEG-1 Layer III audio-frame counter. Start the application with
[`make up`](../../README.md#run-locally), then open the UI or offline Redoc at the printed loopback URLs. Docker starts
exactly two application containers; no cloud account, database or host Node installation is required for startup.

| Read                                                                                                                  | Purpose                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [Root README](../../README.md)                                                                                        | Windows/WSL2, ARM macOS and Linux prerequisites, startup, URLs, logs and cleanup. |
| [Architecture](../architecture/v1.md)                                                                                 | Current design and responsibility boundaries.                                     |
| [Network diagram](../architecture/diagrams/network.mmd)                                                               | Host loopback port, private Compose API and independent host tests.               |
| [Runtime](../architecture/diagrams/runtime.mmd) and [upload sequence](../architecture/diagrams/upload.mmd)            | Factory/plugins, parser, response and cancellation lifecycle.                     |
| [Evaluation](evaluation.md)                                                                                           | Each supplied assessment criterion, implementation evidence and limits.           |
| [Known gaps](known-gaps.md)                                                                                           | Remaining uncertainty, measured constraints and provisional roadmap mapping.      |
| [Validation record](../validation/backend-audio-refactor.md)                                                          | Dated local checks, exact images, failures retained and evidence boundaries.      |
| [Assessment registry](../requirements/assessment.md) and [owner amendment](../requirements/backend-audio-refactor.md) | Original stable requirement IDs and the adopted audio-count convention.           |

## Implemented architecture

TypeScript spans the API, handwritten parser and browser. Lightweight Fastify constructs an unbound application with
canonical TypeBox schemas, a scoped upload plugin and a separate health plugin. The native transport adapter preserves
raw HTTP guards, bounded collection and lifecycle behavior. The pure parser walks complete frame boundaries once;
neither Fastify nor an NPM package determines the MP3 count. See the [API source guide](../../server/README.md).

React executes in the browser from Vite-built static assets served by NGINX. Its hook owns one active request and a
45-second deadline covering upload and response-body consumption. Ky sends the original File once with retries disabled;
shared interpreted guards validate the response. Components display server counts and bounded diagnostics without
parsing MPEG bytes or deriving a count from declarations. See the [frontend guide](../../frontend/README.md).

Normal Compose publishes only `127.0.0.1:FRONTEND_PORT` to NGINX container port 8080; the default host port is 8080 and
the recorded operator choice is 18084. NGINX serves browser assets and proxies uploads and packaged documentation to
private `api:3000`. UI, API requests and offline Redoc assets share one browser origin. The API has no normal published
host port. Independent Playwright/Chromium and its controller run on the host, against an isolated test project with
temporary loopback ports; they are not an application service or a third runtime container.

## Count interpretation and test example

The default raw `POST /file-upload` returns exactly `{ "frameCount": <positive integer> }`; exactly one decoded
`details=true` query value enables computed physical/excluded counts, Xing/Info fields and warnings. Declared totals are
diagnostic. A recognized leading metadata carrier contributes one physical frame and zero audio frames.

The original assignment does not specify this distinction or an employer numeric oracle. The owner adopted **6,089 audio
frames**, while the identified sample contains **6,090 physical frames**, including one Xing carrier. The independent
[sample baseline](../validation/sample-baseline.md) established that reconciliation before product parsing. Agreement
with the owner's convention is not confirmation of the employer's expected answer.

The private sample belongs at `docs/requirements/samples/assessment-sample.mp3` and is ignored, absent from fresh clones
and release assets. Verify its [recorded identity](../requirements/samples/README.md) if supplied separately. The
[portable nine-frame example](../deployment/local-handoff.md#optional-known-count-fixture) works without it. For exact
tested-image archives rather than source rebuilds, follow the [release-image handoff](../deployment/local-handoff.md).

## Reviewer checklist

1. Follow the root prerequisites and `make up`; require both healthy containers and the public health ping. Inspect
   `make ps`, `make logs-backend` or `make logs` if startup fails.
2. Upload the portable fixture or separately supplied identified sample. Check the default response, detailed counts and
   readable error/retry behavior against the documented contract.
3. Open `/docs/` at desktop and narrow widths. Inspect the upload schema, default/detailed examples and coded errors;
   assets should remain same-origin under the documented CSP.
4. With pinned Node/npm, run `npm run typecheck`, `npm run lint:source` and `npm run test:unit`. Server tests live in
   `server/tests/`; frontend response and real-HTTP service tests live in `frontend/tests/`.
5. Check the validation record's actual successor admission before treating `make e2e` as proof of this target. Review
   exact-head approval and protected-main CI/publication separately, then use `make down` for local cleanup.

## Evidence and freeze

The dated local record reports **339 passing unit tests** and **72 passing independent acceptance cases** in run
`mp3-e2e-45286-140fd7c71318`, with no acceptance retries or skips and verified scoped cleanup. Actual default/detail
sample HTTP, desktop/narrow Redoc and browser upload observations also passed. Ignored operator logs and screenshots
support those observations; they are not portable CI artifacts or a trusted release binding.

The owner has authorized review, commit/push and merge. This handoff still marks successor binding, exact-head companion
approval, merge and protected-main publication **pending** until live identities and outcomes are recorded in the
[validation record](../validation/backend-audio-refactor.md). Historical releases and local content hashes do not
establish shipment of this revision.

After merge, product behavior is frozen; only a blocking defect can reopen implementation through reviewed regression
work. Documentation may explain the frozen behavior. [Known gaps](known-gaps.md) and future roadmap options remain
provisional. Cloud delivery stays paused, and this handoff does not claim a verified production v1.0.0 or completed
external assessment submission.
