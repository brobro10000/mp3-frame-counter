# Codex implementation prompt: MP3 backend, Fastify lifecycle, typed contracts, and inline ASCII maps

Updated from repository inspection on **2026-10-11** at
`93a7098c027b214b9b392b0f1408660097dd32f3` (`main` at inspection).

Implement a bounded backend refactor in `brobro10000/mp3-frame-counter`. Use the existing Fastify stack properly:
a testable application factory, scoped lifecycle hooks, one canonical contract/error catalogue, modeled request
normalization and response serialization, and generated OpenAPI that renders useful examples in the existing offline
Redoc. Extend the **already implemented React/TypeScript/Vite frontend**; do not migrate it again.

Retain the previous requested count correction: the identified sample's default response becomes exactly
`{"frameCount":6089}`, calculated by walking the file and excluding its recognized leading Xing carrier. Keep 6,090
as the physical-frame diagnostic. Keep all four inline ASCII byte maps in this prompt in actual backend source.

Start with a brief plan, then perform the authorized local implementation and verification. Do not stop at a proposal,
resume the cloud roadmap, or build a generic API framework. This is a small assessment application, not a platform.

## 1. Assignment requirements and permitted changes

The original assignment [R2] is the external requirement source. Preserve:

- TypeScript; `POST /file-upload`; support for the assessed MPEG-1 Layer III format; JSON content type and the exact
  default success shape `{ "frameCount": <number> }`.
- **Logical counting by handwritten parsing of actual frame boundaries.** An embedded total, file-size/duration
  estimate, package result, or MediaInfo invocation cannot substitute for this calculation.
- Appropriate errors, maintainable code, standardized formatting/linting/testing, bounded resource use, and a runnable,
  understandable Git repository with clear setup/test instructions.

The assignment permits HTTP frameworks and general-purpose packages; it prohibits packages that directly parse MP3
frame data. Use packages for transport, schemas, documentation and client calls, **not** MPEG/Xing parsing, decoding,
metadata extraction, or count retrieval. No runtime MediaInfo/FFmpeg process, WASM decoder, hosted analysis service,
or copied vendor parser. MediaInfo/FFprobe may be development oracles only.

Distinguish external requirements from owner-defined policies. The original brief does not explicitly settle the
Xing-carrier convention; this prompt implements the owner's requested convention, not a claim about an unobserved
employer answer key or universal MediaInfo equivalence.

Preserve the established raw upload transport, both accepted media types, inclusive **20,971,520-byte** limit,
admission/connection/deadline controls, no retained uploads, non-root two-container topology, same-origin proxy,
offline documentation, and scoped security headers. Do not add multipart, JSON/base64 uploads, new codecs, decoding,
a database, authentication, a queue, a worker pool, a second service, or unrelated infrastructure.

This prompt permits local implementation of the narrowly specified count, API/error, package, and documentation
changes. Where current instructions say physical-only counts, `{error}`-only errors, Fastify-only runtime dependencies,
or no new API fields, record this prompt as the narrow new target and use the existing independently reviewed
policy/contract transition. It is not permission to bypass gates or erase earlier evidence.

Preserve unrelated local changes and original source captures. Do not push, merge, publish, deploy, change repository
settings, resume cloud delivery, or incur cloud costs without separate explicit authority. Do not rewrite the assessment
text to match the implementation. Keep current format limitations visible; documentation alone does not make them
employer-approved exemptions.

## 2. Reconcile the actual repository before authoring

Refresh the exact checkout, worktree state, current branches/PRs, instructions, active/pending acceptance bindings,
package graph, and build commands. The following are **inspection facts, not execution evidence or future assumptions**:

| Inspected boundary | State at `93a7098c...` | Consequence for this task |
| --- | --- | --- |
| Dependencies [R3] | Fastify 5.12.5; React/ReactDOM 19.3.0; Vite 8.3.4; TypeScript 7.0.2; Redoc 2.5.4; pinned Node/npm | Retain working versions; choose only compatible missing packages. Do not repeat the React migration. |
| Backend [R4] | `server/src/http.ts` combines raw dispatch, upload admission, body collection, errors, routes, docs and lifecycle; no upload route schemas | Extract responsibilities incrementally, keeping behavior and resource ownership explicit. |
| Parser | `server/src/mp3.ts` is still the physical-frame counter; its Git blob matches the previously analyzed parser | Audio-count correction and Xing diagnostics are not already implemented. |
| Frontend [R5] | `frontend/src/services/mp3Analysis.ts` already owns raw Fetch calls; components, hooks and types exist | Extend this service and hook, not a second competing `api/` tree. |
| OpenAPI [R6] | Hand-maintained `server/src/docs/openapi.json`, OpenAPI 3.0.3; generic `{error}` schema; 502/504 only in `x-controlled-proxy-responses` | Replace duplicated contract definitions with generated ones; put externally visible errors in standard operation responses. |
| Docs build [R7] | `build-docs.mjs` packages reviewed, hash-verified offline assets into `dist/docs`; `docs.ts` loads a finite map | Keep the renderer/asset controls; change the specification producer, not the whole renderer. |
| Proxy [R8] | NGINX preserves raw upload URI/query and supplies its own 413/502/504 JSON | Update proxy errors too; server-only error normalization is insufficient. |
| CI [R9] | CI is split across `ci.yml`, `linter.yml`, `server-tests.yml`, `base-acceptance-e2e.yml`, `application-tests.yml` | Preserve the current jobs and same-run evidence. Do not restore the old single-workflow assumption. |
| Scope [R1] | Local assessment priority; cloud delivery deferred; production v1.0.0 pending | Do not make hosted completion a new local-refactor prerequisite. |
| Open PR [R10] | PR #55 is a deferred draft for hosted reasonless-browser-error observation | Leave it deferred; it is not this local API/error successor or permission to activate hosted work. |

Read the relevant source and tests, not only this table. In particular inspect `server/src/docs.ts`,
`server/src/docs/init.js`, the existing frontend cancellation hook and response guards, both Dockerfiles, Makefile,
compiler configurations, dependency policies, and current contract resolver. Resolve renamed paths instead of guessing.

Identify consumers of physical counts and exact error shapes: UI, unit/acceptance assertions, sample/smoke scripts,
OpenAPI, proxy fixtures, controller evidence and any dormant hosted declarations. Do not change a published/frozen
fixture's physical truth to 6,089; add the independently established audio expectation separately.

## 3. Architecture and package decisions

Use a small feature-organized backend:

```text
React hook -> existing MP3 HTTP service -> same-origin NGINX -> Fastify MP3 route
                                                          -> analyzeMp3(bytes)
                                                          -> MPEG/Xing helpers

Trusted schemas + public error catalogue
      |               |                 |
      v               v                 v
request/response   generated OpenAPI   frontend boundary validation
contracts         -> offline Redoc    and safe error presentation
```

### Package selection

| Responsibility | Selected approach | Boundary |
| --- | --- | --- |
| HTTP server and middleware behavior | Existing Fastify with native plugins/hooks | No Express, `@fastify/middie`, body-parser, NestJS, or framework migration. |
| API schemas and inferred DTOs | TypeBox with compatible `@fastify/type-provider-typebox` | One schema family. Verify the provider's actual peer package (`typebox` versus legacy `@sinclair/typebox`) and exports before pinning. |
| Request validation / response serialization | Fastify's existing Ajv and fast-json-stringify integration | No second validator/serializer stack or generic serializer classes. |
| OpenAPI generation | Compatible `@fastify/swagger`, dynamic route-schema mode | Register before routes. Keep Redoc; do not install Swagger UI, Scalar, or another docs frontend. |
| Frontend HTTP | Ky inside the existing service boundary, as previously requested | One client; disable retries explicitly and preserve raw File, deadline, signal, redirect and credential behavior. No server-to-self HTTP call. |
| Shared plugin utilities | Native registration first; `fastify-plugin` only if shared decorations/dependencies actually need it | Do not disable encapsulation on every feature plugin. |
| Source tooling | Existing tools; a minimal compatible ESLint/typescript-eslint setup if application lint is genuinely absent | No competing test runner, custom doc parser, broad dependency upgrade or style rewrite. |

Official compatibility tables currently associate `@fastify/swagger` 9.x+ and the TypeBox provider 5.x+ with Fastify 5
[P3] [P4]. These are selection guides, not safe upper bounds: inspect the exact release peer dependencies and lock a
tested combination. Direct imports require declared dependencies; do not rely on accidental transitive availability.

Use the root application lockfile plus the independent acceptance lockfile, without workspaces. Keep schema packages
needed by production available in the API runtime; keep Ky, React and Vite out of that runtime dependency set/image.
The browser still has runtime dependencies even when these are installed in the root development/build section.

Do not add `@fastify/multipart`, CORS, compression, rate limiting, Helmet, or sensible/http-errors just to populate a
middleware stack. Raw uploads, existing admission limits and NGINX's scoped headers already address those boundaries.
A requests-per-minute limiter is not a replacement for active-upload admission. No package may weaken existing CSP,
enable decompression, retry uploads, add body persistence, or change error semantics implicitly.

### File responsibilities

Use equivalent existing files when sensible. This tree describes ownership, not a quota of new modules:

```text
server/src/
  index.ts                       # process entry point: validated config, signals, listen/exit
  app.ts                         # create the unbound Fastify application; explicit registration order
  http.ts                        # temporary compatibility facade ONLY for verified existing callers
  contracts/
    mp3.ts                       # browser-safe wire schemas + inferred DTOs
    errors.ts                    # public error catalogue + schemas/examples; no server internals
  http/
    upload-transport.ts          # scoped admission, bounded Buffer collection, raw transport edge cases
    lifecycle.ts                 # startup/shutdown, sockets and one-time cleanup when extraction is useful
    errors.ts                    # typed domain/framework -> public code/status/DTO mapping and writers
  modules/mp3/
    routes.ts                    # schemas, request normalization, one analysis call, response projection
    analyze.ts                   # pure traversal and aggregate counting; whole-file ASCII map
    mpeg.ts                      # header/tag helpers; ID3 and MPEG ASCII maps
    xing.ts                      # bounded carrier inspection; Xing ASCII map
    types.ts                     # domain-only types where they differ from wire DTOs
    errors.ts                    # domain failure reasons, no HTTP statuses
  documentation/
    openapi.ts                   # Swagger registration + narrow documentation-only projections
    generate.ts                  # same application registration -> deterministic spec; never listen
  docs.ts                        # retain finite docs loader; avoid gratuitous move/path breakage
  build-docs.mjs                 # retain offline renderer packaging; consume generated specification
  docs/                          # retain renderer inputs, licenses and provenance
frontend/src/
  services/
    httpClient.ts                # small Ky configuration/error boundary if extraction earns its place
    mp3Analysis.ts               # EXTEND existing service, one upload, schema-checked outcome
    response.ts                  # adapt existing boundary guards; no parallel decoder
  hooks/, components/, types/    # extend existing implementation, preserve cancellation ownership
```

Placing browser-safe contracts under `server/src/contracts/` can retain the current backend `rootDir` and `dist/index.js`
layout. Import those files directly from the frontend with supported build settings; do not pull in server barrels.
If another placement is already established, use it and verify compilation, package resolution, Docker COPY/CMD,
`docs.ts` asset-root logic and test imports coherently. Do not create a shared npm package just for these DTOs.

Routes may call `analyzeMp3` directly. No controller/service/repository layers that just forward arguments, dependency
injection container, auto-discovery framework, generic base class or public physical-count endpoint. Parser code cannot
import Fastify, TypeBox runtime schemas, React, Ky, environment variables, HTTP status codes, or request objects.

## 4. Create the API through a testable application factory and scoped hooks

Separate **construct/register**, **ready**, and **listen**. Constructing/importing the application must not bind a port,
install process signal handlers, start background timers, perform network I/O, or depend on prebuilt Redoc assets.
`index.ts` owns process behavior. Preserve `createApiServer`/`ApiService` compatibility only where real consumers require
it; the facade delegates to the new construction/lifecycle implementation rather than retaining a second server.

Registration order must be explicit and tested:

1. Validate server configuration; create Fastify and the bounded raw transport where necessary.
2. Register shared schemas, root error/not-found policy and required common response policy.
3. Register Swagger before registering the feature routes it must discover.
4. Register the isolated upload plugin with its parser/hooks and MP3 routes; register health/docs responsibilities
   outside upload admission and body collection.
5. Await readiness/schema compilation. Production startup loads/verifies docs before binding; OpenAPI generation
   inspects the same route registration without loading the artifact it is about to generate.
6. Listen only through the lifecycle owner. Shutdown stops admission immediately and closes resources once.

Use explicit typed Fastify plugin functions. Apply the TypeBox provider in each encapsulated scope that needs its
inference; do not assume a type-provider selection magically propagates. Pass simple dependencies through plugin
options; avoid app-wide mutable singleton request state.

### Middleware means Fastify lifecycle hooks here

Use this map at the corresponding boundaries [P1] [P2] [P6] [P7]:

| Boundary | Responsibility | Important constraint |
| --- | --- | --- |
| Narrow raw transport/NGINX guard | Preserve actual path/method, Expect handling and safe early rejection | Retain only behavior native routing cannot yet replace under regression tests; do not silently normalize aliases. |
| Upload-scoped `onRequest` | Validate relevant headers/options and admit before allocating; initialize request state | `request.body` is not available here. Use shared-contract guards where earlier validation is needed. |
| `preParsing` / custom content-type parser | Accept the original stream and collect bounded raw bytes once | No second body reader, `parseAs` collector on top, decompression, unbounded chunk array, or Buffer-to-JSON conversion. Do not add a no-op hook. |
| `preValidation` and schema validation | Validate applicable normalized request data after parsing | Do not defer size admission to this stage or validate binary bytes as an OpenAPI string. |
| Handler | Analyze once and produce the selected response DTO | No bit-level parsing or English error policy in the handler. |
| Response schema / `preSerialization` if actually needed | Serialize the exact selected success/error contract | Do not wrap all successes, change counts, or rely on this hook for raw Buffer/string/hijacked paths. |
| `setErrorHandler` and `setNotFoundHandler` | Map known domain/transport/validation failures to public codes and safe messages | Not every error traverses this path; raw and proxy writers must share policy too. |
| `onError` | Optional sanitized observation only | Do not send/replace a response here. Do not add observability just to use the hook. |
| Response/abort/error/timeout + `preClose`/`onClose` | Release admission, references, timers and sockets once | A disconnected client cannot receive JSON. Socket timeout hooks cannot retroactively send an error after close. |

Do not combine `async`/Promise and `done` in a hook. An early reply must terminate its control flow. Do not mutate
shared request-decoration objects, call completion twice, or send again after headers/end. Preserve request-local
idempotent release across parsing, handler, serialization, errors, aborts and shutdown; `onResponse` alone is not enough.

Keep the current two-upload default and 64-connection default unless separately justified, along with total/idle/header
and drain deadlines. Preserve `Expect: 100-continue` ordering: validation/admission/allocation before Continue. Preserve
bounded readable rejection rather than immediately resetting a peer still sending an oversized body. Keep raw socket
checks that are needed for this; replacing custom code with a package is successful only when behavior is preserved.

The current `reply.hijack()`/raw `ServerResponse` rejection and raw docs dispatch bypass normal Fastify serialization.
Isolate and document that exception. Use the same public error DTO projector and catalogue in both normal replies and
the bounded raw writer. A carefully tested `JSON.stringify` of that closed DTO is sufficient for the raw writer; do not
build a generic second serializer or double-encode JSON. Preserve `Content-Length`, HEAD behavior, headers and draining.

Add a concise source-level lifecycle ASCII diagram near `app.ts`/transport ownership, in addition to the four byte maps:

```text
raw URI/method guard -> onRequest: validate/admit -> bounded body parser
                                                    |
                                                    v
                                      normalize/validate -> analyze once
                                                    |
                         +--------------------------+---------------------+
                         |                                                |
                    project success                                classify failure
                         |                                                |
                 selected serializer                       public error DTO + writer
                         |                                                |
                         +------------> complete / abort <----------------+
                                            |
                               release slot/storage/timers ONCE
```

This is a behavior map, not an excuse to add an empty middleware stage. Keep logging disabled by default as today;
any necessary diagnostic uses sanitized codes/statuses, never request bodies, filenames, auth headers or raw errors.

## 5. Model requests, DTOs and response serializers explicitly

Use one canonical TypeBox schema family with inferred transport types and stable schema IDs. Keep domain analysis types
separate only where their meaning differs. Do not maintain independent TypeBox, handwritten DTO and OpenAPI copies.

### Request model

Separate wire format from the internal validated command:

- Wire body is raw binary with `audio/mpeg` or `application/octet-stream`, not JSON, multipart, or base64. OpenAPI models
  it as `type: string, format: binary`; the runtime command carries a bounded `Buffer`, not a serialized Buffer object.
- Header normalization preserves existing case/parameter semantics, absence/identity-only encoding, real byte checks,
  and pathname -> method -> media/encoding -> body -> parser ordering. Do not require Content-Length.
- Normalize representation options into a typed `{ details: boolean }` command field. `details` opts in only when it
  occurs once with the exact decoded value `true`; absent, other values and repeats use the default. Ignore unrelated
  query options as before. Read query options without normalizing the raw route path.
- Document this exact option rule. Do not let default Ajv coercion, default insertion or stripping alter it; raw query
  strings/arrays and the normalized command are different models. Do not reject harmless extra HTTP headers.
- Compile trusted guards/schemas once at application construction where applicable. Never compile user-supplied schemas,
  perform async external validation, or allocate based on a declared metadata total.

Native header/protocol rejection may happen before application code. Do not invent a uniform application JSON guarantee
for every malformed HTTP message. Preserve clear error precedence for isolated-invalid tests, not arbitrary combinations
whose precedence differs between NGINX and the API.

### Success response models

Default: **exactly** `{ "frameCount": <positive safe integer> }`, where `frameCount` is the independently walked audio
count under the supported Xing/Info exclusion convention. Sample response: `{ "frameCount": 6089 }`.

Opt-in `POST /file-upload?details=true`: same `frameCount`, plus one `analysis` object containing
`physicalFrameCount`, `excludedMetadataFrameCount`, typed Xing/Info inspection and bounded diagnostic warnings. For the
sample those three counts are 6089, 6090 and 1 respectively. No second upload or analysis pass.

Use closed object schemas. If using an extended detailed schema, construct it without an `allOf`/closed-base conflict.
The default and detailed 200 alternatives must be distinguishable by the required `analysis` property; the default
schema must not accept it as an arbitrary extra property. Enforce:

```text
physicalFrameCount = frameCount + excludedMetadataFrameCount
excludedMetadataFrameCount is 0 or 1 for this supported leading-carrier rule
```

Use the framework's schema-compiled serialization, either with a proven closed union or an explicitly selected compiled
serializer supported by the installed version. **Test that detailed fields are not silently stripped by the default
schema branch.** No catch-all success envelope and no field injection in global `onSend`.

A serializer is not a complete validator: some values may be coerced or extra properties omitted. Before sending,
construct the DTO through a typed projector and check required count invariants. Test invalid/missing/nonfinite/fractional
counts and leaked fields, not just TypeScript compilation. Treat unexpected projection/serialization failures as a safe
500 and avoid recursive failure while serializing that error. Do not expose domain objects via object spread.

An input with only a recognized carrier has zero audio frames. Analysis may represent zero; the public route returns
the newly documented 400 `MP3_NO_AUDIO_FRAMES`, never an invalid successful zero. Record this intentional semantic edge
change in the successor contract rather than claiming historical tests already agreed.

## 6. Codify public errors once, including raw and proxy failures

Use a small typed catalogue keyed by stable machine code. Each entry owns the HTTP status, safe default message,
brief actionable description, applicable headers and producing layer. UI behavior must not parse English strings or
expose native `FST_ERR_*`, Ajv internals, stack traces, `cause`, buffer content or filesystem paths.

Preserve the existing readable `error` string while adding a required code in the revised error contract:

```json
{
  "code": "UPLOAD_TOO_LARGE",
  "error": "The upload exceeds the 20 MiB (20,971,520-byte) limit."
}
```

This is **not** backward-compatible with the current frozen exact `{error}` schema; include it in the explicit
independent contract transition. The assignment's exact one-field success shape remains unchanged. Do not add a generic
`statusCode`, `success`, timestamp, details list or correlation envelope without an actual requirement.

Use the following bounded catalogue as the target; preserve an already-established equivalent rather than two names for
one condition. Add a more specific code only when it changes caller action or a useful tested distinction.

| HTTP | Public code | Safe default message | Ownership / behavior |
| --- | --- | --- | --- |
| 400 | `UPLOAD_EMPTY` | Choose a nonempty MP3 file. | Empty received upload. |
| 400 | `UPLOAD_INCOMPLETE` | The upload did not complete. Please try again. | Body/framing incomplete; emit only while the socket is writable. |
| 400 | `REQUEST_INVALID` | The request does not match the upload API contract. | Genuine request validation failure, not unknown server exceptions. |
| 400 | `MP3_INVALID_HEADER` | The MP3 contains an invalid frame header. | Invalid/reserved header or unexplained boundary. |
| 400 | `MP3_TRUNCATED_FRAME` | The MP3 ends before a complete frame. | Incomplete header-derived frame. |
| 400 | `MP3_INVALID_METADATA` | The MP3 contains malformed metadata. | Malformed supported outer tag or unresolved malformed carrier. |
| 400 | `MP3_NO_AUDIO_FRAMES` | The file contains no complete MPEG-1 Layer III audio frames. | Metadata-only/no audio result. |
| 404 | `ROUTE_NOT_FOUND` | The requested API resource does not exist. | API and finite docs resource lookup; ordinary static-site 404 is separate. |
| 405 | `METHOD_NOT_ALLOWED` | This method is not allowed for the requested resource. | Correct route-specific `Allow`; HEAD response has no body. |
| 408 | `UPLOAD_TIMEOUT` | The upload did not finish within the time limit. | Application body deadline; bounded cleanup. |
| 408 | `UPLOAD_IDLE_TIMEOUT` | The upload stopped sending data. | Application idle deadline, not a fabricated response after disconnect. |
| 413 | `UPLOAD_TOO_LARGE` | The upload exceeds the 20 MiB (20,971,520-byte) limit. | Both controlled NGINX/API upload size paths. |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Upload raw MP3 bytes using audio/mpeg or application/octet-stream. | Header media type before allocation. |
| 415 | `UNSUPPORTED_CONTENT_ENCODING` | Encoded request bodies are not supported. | No decompression. |
| 415 | `MP3_UNSUPPORTED_FORMAT` | Only supported MPEG-1 Layer III encoding is accepted. | Out-of-scope version/layer or unsupported free-format. |
| 415 | `MP3_UNSUPPORTED_METADATA` | This MP3 metadata layout is not supported. | Recognized unsupported tag/encoder layout. |
| 417 | `EXPECTATION_FAILED` | The request expectation is not supported. | Raw Expect path. |
| 500 | `INTERNAL_ERROR` | The MP3 could not be analyzed. Please try again. | Unknown exception or invalid server output; never expose its message. |
| 503 | `SERVICE_BUSY` | The service is busy. Please try again shortly. | Admission/stopping; preserve appropriate `Retry-After`. |
| 502 | `UPSTREAM_UNAVAILABLE` | Analysis service is unavailable. Please try again. | Controlled NGINX upstream connection failure. |
| 504 | `UPSTREAM_TIMEOUT` | Analysis service timed out. Please try again. | Controlled NGINX upstream read timeout. |

For distinct documentation-only proxy failures, retain appropriate documentation wording; represent contextual message
variants explicitly in the same catalogue/projection, not arbitrary runtime string interpolation. A catalogue may have
several tested messages for one code; code/status semantics remain stable. Do not manufacture one code per byte offset.

Domain errors carry typed reasons and optional private context, **not HTTP statuses**. The HTTP mapper translates domain
reasons and verified framework error identities to catalogue keys. Do not map by `error.message.includes(...)`, duck-type
any thrown `{statusCode}` as safe, or trust a user-controlled `code` string. Unknown failures map to `INTERNAL_ERROR`.

Normal Fastify replies, early raw dispatch, rejected bodies and not-found handling must project the same closed error
DTO. All required error statuses need a schema; do not accidentally serialize them through the success schema. The
catalogue, schemas, examples and per-status code lists should be derived from the same data rather than manually synced.

NGINX errors occur before or instead of Fastify. Update its 413/502/504 and applicable API method/docs error paths with
the same public code and intentional message. Prefer a tiny deterministic **build-time projection of fixed catalogue
literals** into the current NGINX template (safe JSON and NGINX escaping); a small parity-checked static subset is
acceptable when generation would expand the build materially. No dynamic user interpolation or runtime Node dependency
in the NGINX image. Verify output, not just template source. Keep upstream API errors unmodified.

Keep `Content-Type`, `Cache-Control: no-store`, `X-Content-Type-Options`, `Allow`, `Retry-After` and HEAD/no-body behavior
correct on paths that bypass hooks. Preserve CSP ownership in NGINX; do not stack a conflicting Helmet policy. Do not
claim controlled codes for third-party provider failures, arbitrary static 404s, or sockets already closed by Node.

Client-side timeout/network/abort/invalid-response failures are separate typed **client outcomes**, not invented server
codes or HTTP responses. Render a safe message even when a proxy returns HTML or an older `{error}` body. Reject invalid
server-code/status combinations; never branch on unvalidated raw JSON or render it as HTML.

## 7. Generate accurate OpenAPI and verify actual Redoc rendering

Make the trusted route schemas, public error catalogue and small operation metadata the source of truth [P3] [P5].
`@fastify/swagger` generates OpenAPI **3.0.3**, which is then packaged into the existing offline Redoc assets. This replaces
hand-maintained structural duplication in `server/src/docs/openapi.json`; keep one generated artifact or one generated
input, not competing specifications. Preserve frozen acceptance documents as independent historical evidence.

Register Swagger before MP3/health routes. Use stable operation IDs, tags, schema/component names and same-document
references. Generated docs must cover **actual registered routes plus explicitly modeled raw/proxy boundary behavior**;
Swagger cannot discover custom `serverFactory` dispatch or NGINX errors by itself. Do not register fake success routes
merely to make docs appear. Hide internal diagnostics and do not invent wildcard OpenAPI paths for arbitrary 404s.

Use a narrow, pure docs-only transformation where runtime/HTTP representations genuinely differ:

- Binary upload becomes `requestBody.required: true` with both accepted media types and `type: string, format: binary`.
  Describe the size limit and include the existing vendor limit extension as supplemental metadata, not as validation.
- Declare `details` and its exact opt-in rule. Do not suggest a JSON body, multipart fields, or required Content-Length.
  Document media through `requestBody.content`, not an ignored OpenAPI Content-Type header parameter.
- The 200 response documents default/detailed alternatives with unambiguous schemas, named examples and the shared
  audio-count meaning. Do not rely on a nonstandard query-in-path operation.
- Put each actual public failure in `paths./file-upload.post.responses` as appropriate: 400, 408, 413, 415, 417, 500,
  503 and the controlled ingress 502/504. Document 404 path and 405 method behavior in the appropriate real operations
  and operation description without claiming those arise after a successful handler match.
- The former `x-controlled-proxy-responses` may remain as provenance, but **cannot be the only location for 502/504**.
  Standard response entries must say these are produced by controlled ingress, not the MP3 handler.
- Reuse a closed `ApiError` schema and derive per-status supported code lists where practical. Add named examples at
  `responses.<status>.content.application/json.examples.<name>.value`, with summaries explaining triggers and recovery.
  Do not put OpenAPI Example Objects into JSON Schema's differently shaped `examples` property.
- Show `Allow` and `Retry-After` response headers where emitted. HEAD operations have no response content body; do not
  display a fictional JSON body just because other methods use `ApiError`.
- Use enum/nullable/reference forms supported by OpenAPI 3.0.3. TypeBox/JSON Schema `const`, null unions and schema IDs
  may need a tested narrow conversion; do not mutate the runtime schema to appease Redoc or install a second schema stack.

Representative **target generated fragment** (not a separate hand-maintained source):

```yaml
'413':
  description: The controlled ingress or API rejected an upload above 20 MiB.
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/ApiError'
      examples:
        uploadTooLarge:
          summary: Choose an MP3 of 20 MiB or less; do not retry the same oversized file.
          value:
            code: UPLOAD_TOO_LARGE
            error: The upload exceeds the 20 MiB (20,971,520-byte) limit.
```

### Avoid the docs-generation/startup dependency cycle

The current service loads `dist/docs` during `listen()` [R4] [R7]. Preserve the readiness guarantee while allowing:

```text
compile backend/contracts
          |
          v
construct same API registrations -> await ready -> export OpenAPI -> close (NO listen)
          |
          v
existing offline Redoc packager consumes generated specification
          |
          v
production listen path verifies packaged docs -> binds the service
```

Do not have OpenAPI generation call the production `listen()` wrapper, require old docs output, or skip business routes
under a divergent docs-only server. Use the same registration functions. Generation must be deterministic, run from a
clean checkout without network/credentials, and fail on unresolved references/invalid output. Keep the existing renderer,
licenses, finite-resource loader, asset hashes and atomic failure cleanup; do not weaken them to work around a path move.

Validate OpenAPI semantics with an appropriate supported validator, preferably an already usable dev tool or a narrowly
pinned Redocly CLI check. Its generic style recommendations are not new assignment requirements. A local `$ref`
containment check alone is not semantic OpenAPI validation; a validator pass alone is not rendering evidence.

Open the actual locally built `/docs/` in the existing browser harness. Exercise response/example selection. Verify:
code and readable message are visible together, default/detailed 200 examples remain distinct, 400/413/415 and both
502/504 appear under the upload operation, headers are documented, and no broken refs or schema errors occur. Verify all
catalogue examples against their schemas and representative **real** API/proxy responses. A snapshot of source JSON is
not sufficient. Retain screenshots/logs as local evidence where supported.

Keep Redoc 2.5.4 and its existing initialization unless a tested compatibility need arises. Do not depend on custom
extension display settings, deprecated options, remote fonts/CDNs, unsafe-inline/unsafe-eval changes, or a presumed
Redoc CE "Try it" client. Provide correct curl examples with `--data-binary`; a docs UI is not the runtime validator.

## 8. Preserve logical parsing and implement the requested count convention

The public result must be derived from actual bytes, not retrieved from Xing. Retain forward-only parsing:
accepted outer tag -> header validation -> per-header length -> complete-span check -> eligible carrier classification
-> physical count -> next exact boundary -> accepted end. Continue to the end regardless of a declared total.

Use the existing MPEG-1 Layer III formula and explain it beside the code:

```ts
// MPEG-1 Layer III represents 1,152 samples per channel per frame.
// 1,152 / 8 = 144 converts bitrate (bits/s) and sample rate (samples/s)
// to bytes per frame. Padding adds one byte; header and CRC are included.
const frameLengthBytes =
  Math.floor((144 * bitrateBitsPerSecond) / sampleRateHz) + paddingBit;

// Increment only after the entire frame fits at this validated boundary.
// A recognized Xing/Info carrier is still one physical MPEG frame.
physicalFrameCount += 1;
offsetBytes += frameLengthBytes;

// The exclusion is detected from structure, never an unconditional -1.
// Xing's declared total is diagnostic and never participates in this sum.
const audioFrameCount = physicalFrameCount - excludedMetadataFrameCount;
```

Adapt snippets to real validated variables/control flow. Keep counts and offset advances separate from metadata-field
values. Do not add header/CRC size twice, divide total file size by one frame's length, subtract encoder delay/padding
samples, scan payload sync bytes, accept partial final frames, or resynchronize across corruption.

Recognize only a supported leading Xing/Info carrier in the first complete MPEG frame after accepted outer metadata.
Verify marker positions/structural rules for mono/stereo and supported CRC/encoder variants using primary source and
independent fixtures; do not use the sample's absolute byte 80 or blindly shift by two for CRC. Zero side-info alone is
not proof; arbitrary `Xing` text inside ID3, later frames or wrong payload positions is not a carrier. A recognized
carrier contributes physical +1, excluded +1, audio +0. No carrier means excluded zero.

Separate carrier recognition from optional metadata decoding. Read flags and selected big-endian fields in order within
that frame's bounds: 0x01 declared audio total, 0x02 declared stream byte size, 0x04 bounded 100-byte seek table, 0x08
stored quality. Missing is not zero. Include marker kind, byte offsets/frame length and flags, not payload dumps.
Do not allocate from declarations or invent quality percentages. Typed warnings distinguish a mismatched declaration
from a counting failure.

A confidently recognized carrier with a damaged nonessential field may still yield an accurate count with a warning.
If classification genuinely cannot establish the requested count, return a typed malformed/unsupported error, not a
physical count mislabeled audio. Freeze those decisions in independent tests. Do not apply Xing subtraction to VBRI or
promise complete MediaInfo parity for unverified variants. Keep LAME-extension decoding, CRC validation, side-info/audio
decoding, gapless duration and a general metadata browser out of scope.

Use the existing sample identity/evidence document. When its exact ignored bytes are available, verify hash/size before
checking 44-byte ID3 + 208-byte carrier + 1,457,920 audio bytes; count 6,090 physical and 6,089 audio. The declared
1,458,128 MPEG-stream bytes differ from the 1,458,172 total file bytes. Keep sample values in docs/fixtures only.

**Decisive compliance tests:** changing only a declared total must leave the calculated count unchanged; removing a
complete final audio frame must reduce it by one even with stale metadata; truncating that frame must fail. Removing
only ID3 leaves both counts unchanged; removing the carrier reduces physical count but leaves audio count unchanged.

## 9. Required inline ASCII documentation in the backend

Create real source comments next to the implementation. Use module-level `/** ... */` comments with a fenced `text` block where the existing tooling supports it, plus normal function JSDoc and short inline calculation comments. The examples below use comment blocks that can be copied into TypeScript.

Use ASCII characters inside diagrams, spaces rather than tabs, and roughly 100-120 columns. All byte offsets are zero-based decimal; all ranges are half-open `[start, end)`, so length is `end - start`. Bits are numbered 7 down to 0, most-significant first. Distinguish absolute file offsets from offsets relative to a frame or tag. Never mix inclusive end indexes with exclusive ends.

Place one canonical copy of each diagram at its owning boundary. Cross-reference helpers rather than repeating all four maps in every function. The sample is an explanatory fixture, not a universal MP3 layout. Account for every range, but label compressed/unknown contents as opaque instead of pretending to decode their individual bytes. This documentation adds no runtime tracing, per-frame array, or byte-dump API.

### A. Whole-file layout and counting contract: `modules/mp3/analyze.ts`

Use this map in the analysis module. Explain that one frame is the whole header-derived span, not one byte, one header field, or one metadata field.

```ts
/**
 * Logical counting model: traverse physical MPEG frames, then classify them.
 *
 * Generic supported layout (not to scale):
 *
 * +----------------+-------------------+-------------------+-----------+
 * | Optional ID3v2 | Optional leading  | MPEG audio frames | Optional  |
 * | outer tag      | Xing/Info carrier | 1, 2, ... N       | ID3v1 tag |
 * +----------------+-------------------+-------------------+-----------+
 * | Count: neither | Physical: +1      | Physical: +N      | Neither   |
 * |                | Audio:    +0      | Audio:    +N      |           |
 * +----------------+-------------------+-------------------+-----------+
 *
 * VERIFIED SAMPLE ONLY: zero-based file bytes; [start, end) excludes end.
 * The private sample identity is recorded in docs/validation/sample-baseline.md.
 *
 * +-------------+--------------------+-----------------------------+
 * | [0, 44)     | [44, 252)          | [252, 1458172)              |
 * | ID3v2.4 tag | Xing-bearing frame | 6,089 complete audio frames |
 * | 44 bytes    | 208 bytes          | 1,457,920 bytes             |
 * +-------------+--------------------+-----------------------------+
 * Skip the outer tag; walk/classify the carrier; walk every audio frame.
 *
 * Byte accounting: 44 + 208 + 1,457,920 = 1,458,172 bytes, exactly EOF.
 * Physical count:   1 + 6,089 = 6,090 complete MPEG frames.
 * Public count:     6,090 - 1 recognized carrier = 6,089 audio frames.
 *
 * Last sample frame: [1458068, 1458172), length 104 bytes. No trailing tag.
 *
 * Count invariant: physicalFrameCount = audioFrameCount + excludedCount.
 * Recognition determines excludedCount; Xing's declared total does not.
 * Invalid/truncated framing is an error, not partial successful counting.
 */
```

At the real loop, describe the actual steps: find the supported start, validate each header, calculate and bound its complete span, inspect only an eligible leading carrier, count, and advance to the next exact boundary. Continue to the accepted end even when a metadata total is present. Do not count metadata fields as extra frames.

### B. Outer ID3 bytes and synchsafe length: `modules/mp3/mpeg.ts`

Place this by the ID3 boundary helper. The current flags-zero subset is intentional; this diagram does not authorize broader tag support.

```ts
/**
 * Supported leading ID3v2 tag: metadata outside the MPEG frame sequence.
 * Offsets here are relative to the beginning of the tag.
 *
 * Range      Bytes  Meaning                  Sample bytes / interpretation
 * [0, 3)       3   Identifier               49 44 33 = "ID3"
 * [3, 4)       1   Major version            04 = version 2.4
 * [4, 5)       1   Revision                 00
 * [5, 6)       1   Flags                    00 = supported flags-zero form
 * [6, 10)      4   Synchsafe body size       00 00 00 22 = 34 bytes
 * [10, 44)    34   Sample tag body           Metadata/padding; opaque here
 *
 * Size bytes contain seven data bits each, not eight:
 *
 *       byte 6     byte 7     byte 8     byte 9
 *     0aaaaaaa   0bbbbbbb   0ccccccc   0ddddddd
 *        |          |          |          |
 *      bits       bits       bits       bits
 *      27..21     20..14       13..7       6..0
 *
 * Validate every leading bit is zero BEFORE using the size bytes.
 * bodyBytes = b6 * (2 ** 21) + b7 * (2 ** 14) + b8 * (2 ** 7) + b9.
 * For flags zero: first MPEG byte = tagStart + 10 + bodyBytes.
 * Sample: 0 + 10 + 34 = byte 44. None of these bytes is an MPEG frame.
 *
 * ID3's internal metadata records may also be named "frames"; those are
 * NOT MPEG audio frames and are not included in this application's count.
 */
```

Do not mask invalid high bits and accept corrupted sizes. Bounds-check the tag before skipping it. Preserve actual version/flag/error policy. Optional trailing ID3v1 is a distinct 128-byte outer record recognized only at an allowed walked end boundary; its marker inside a payload is not an outer tag.

### C. Four MPEG header bytes and the counted span: `modules/mp3/mpeg.ts`

Place this by header decoding/frame-length logic. Match field names to the implementation and tie every mask/shift to the documented bits.

```ts
/**
 * MPEG header: four bytes at the CURRENT frame boundary (32 bits total).
 * Byte indexes below are relative to that frame. Bits run 7 -> 0.
 *
 * +----------+-------------+-------------+--------------+
 * | byte +0  | byte +1     | byte +2     | byte +3      |
 * +----------+-------------+-------------+--------------+
 * | 11111111 | 111 VV LL P | BBBB SS D U | CC XX K O EE |
 * +----------+-------------+-------------+--------------+
 *
 * 11111111 + 111 = 11-bit sync; it must occur at the walked boundary.
 * VV = version: 11 is MPEG-1.       LL = layer: 01 is Layer III.
 * P  = protection: 0 has CRC; 1 has no CRC. CRC is not validated here.
 * BBBB = bitrate table index.      SS = sample-rate table index.
 * D  = frame padding bit.          U  = private bit; not a count.
 * CC = channel mode: 11 mono, otherwise two channels.
 * XX = mode extension.             K = copyright. O = original.
 * EE = emphasis; preserve reserved-value validation.
 *
 * Sample FF FB 50 00:
 * 11111111 | 111 11 01 1 | 0101 00 0 0 | 00 00 0 0 00
 * MPEG-1, Layer III, no CRC, 64,000 bits/s, 44,100 Hz, no padding.
 *
 * Normal MPEG-1 Layer III frame (not to scale):
 * +---------+-------------+---------------------+------------------------+
 * | Header  | Optional    | Side information    | Main-data/ancillary    |
 * | 4 bytes | CRC 2 bytes | 17 mono / 32 stereo | remainder; opaque here |
 * +---------+-------------+---------------------+------------------------+
 * <------------- ONE complete header-derived physical frame ------------>
 *
 * Layer III main data can use a bit reservoir across frame boundaries.
 * This parser counts framing; it does not decode or assign each payload
 * byte to a standalone audio sample. No payload sync scanning is needed.
 *
 * L = floor(144 * bitrateBitsPerSecond / sampleRateHz) + paddingBit.
 * MPEG-1 Layer III has 1,152 samples/channel/frame; 1,152 / 8 = 144.
 * L already includes header, CRC when present, side info and remainder.
 * Do NOT add header or CRC bytes again. VBR requires recalculating L
 * from EACH frame's header, not dividing file size by the first frame.
 *
 * Sample first L = floor(144 * 64000 / 44100) + 0 = 208 bytes.
 * Frame span [44, 252); next frame starts at 44 + 208 = 252.
 */
```

The normal-frame sketch is not a universal recipe for Xing placement in every CRC/encoder variant. Keep the verified Xing positioning rule separate and documented. Parsing header fields is not audio decoding; do not expand scope to decode side-information bitfields or compressed audio just to fill in this sketch.

### D. Xing byte fields and exclusion: `modules/mp3/xing.ts`

Place this by the carrier-inspection helper. Use the sample map only after checking its documented identity. It illustrates flags `0x0f`, with all four common optional fields present.

```ts
/**
 * SAMPLE Xing carrier: [44, 252), 208 bytes total, MPEG-1 stereo, no CRC.
 * All spans use [start, end). The left column is absolute FILE position;
 * the second column is relative to the first MPEG FRAME, not the tag.
 *
 * File span    Frame span   Bytes  Meaning / counting responsibility
 * [44, 48)     [0, 4)          4   MPEG header: decode length and format
 * [48, 80)     [4, 36)        32   Side info: zeros in this sample
 * [80, 84)     [36, 40)        4   Marker: "Xing" ("Info" also recognized)
 * [84, 88)     [40, 44)        4   Flags: 00 00 00 0f, big-endian
 * [88, 92)     [44, 48)        4   Declared frames: 00 00 17 c9 = 6,089
 * [92, 96)     [48, 52)        4   Declared stream bytes: 1,458,128
 * [96, 196)    [52, 152)     100   Seek table: 100 one-byte entries
 * [196, 200)   [152, 156)      4   Stored quality: 0 in this sample
 * [200, 252)   [156, 208)     52   Remaining carrier bytes; opaque here
 *
 * The complete span [44, 252) contributes ONE physical frame and ZERO
 * audio frames after verified Xing/Info recognition. Fields above are
 * not separate frames. A zero-valued quality/side-info byte is not by
 * itself a reason to exclude anything; recognition is structural.
 *
 * Marker is frameStart + 36 = 80 for THIS unprotected stereo layout.
 * Do not assume this offset for mono or unverified CRC/encoder layouts.
 *
 * Xing field cursor starts immediately after its marker and flags.
 * Only fields selected by flags consume bytes, in this order:
 *   0x01 -> 4-byte declared frame count  [diagnostic; never the result]
 *   0x02 -> 4-byte declared stream size [diagnostic; not allocation size]
 *   0x04 -> 100-byte seek table          [bounded metadata; not audio]
 *   0x08 -> 4-byte stored quality        [not an invented percentage]
 * Bounds-check EACH read against the end of this frame, not only EOF.
 * The size/count fields are big-endian unsigned integers, not synchsafe.
 * Missing flags compact the layout; do not reuse these sample offsets.
 *
 * Declared stream bytes here include this carrier, exclude leading ID3:
 * 1,458,128 + 44 = 1,458,172 total file bytes.
 * The optional declaration of 6,089 is compared with our computed count;
 * it never controls loop termination or substitutes for counting.
 */
```

The 52-byte remainder must not be labeled entirely padding, silence, or a fully parsed encoder extension. We do not interpret it in this scope. A single MPEG carrier may contain multiple metadata fields; exclude the carrier once, not one frame per field.

Add short `@see` references to the existing sample-baseline document and pinned primary format/source references. Do not paste copied vendor implementation into the code or add private filenames/audio dumps.

### Documentation and logical-counting acceptance

Add small assertions to existing unit/fixture tests for the documented header fields, ranges, flags, frame-length formula, and boundary/exclusion semantics. Validate diagrams through those known values plus direct review; do not build a diagram generator or a comment-text parser.

All shown sample spans must be contiguous and account for the full claimed range. Generic maps must identify optional regions. Independently constructed portable fixtures prove the generic rules; optional private-sample checks confirm this particular map. Sample-only values are allowed in comments/fixtures, never production branches.

Require the following evidence: change only the Xing declared count and the calculated count stays unchanged; remove a complete final audio frame and the calculated count decreases by one; truncate that frame and parsing fails. No new header total is needed for any of those outcomes. This is the decisive proof that we are logically counting rather than retrieving a number.

## 10. Extend the existing frontend service, not the frontend architecture

The current `services/mp3Analysis.ts` already separates transport from React state. Keep that boundary. Put the Ky
configuration there or in one small adjacent client file, not a competing `api/` directory. Reuse the hook that already
owns cancellation, deadlines, pending state and stale-result prevention. Inspect it before moving ownership.

Send the raw `File` once with `details=true`, current media type, `cache: no-store`, existing credential policy and
`redirect: error`. Explicitly disable automatic retries and body replay. Preserve a bounded total deadline through body
consumption as well as upload/response headers; verify the selected Ky version's behavior rather than assuming its
option covers everything. Use caller cancellation, clean timers/listeners, and read each response body once.

Validate JSON from `unknown` using the shared schema and count/code/status invariants. A Ky generic response type is not
runtime validation. Use an interpreter/non-code-generating browser validation path so CSP needs no `unsafe-eval`.
Project into the existing UI outcome type; components should not depend on Ky errors or parse raw response objects.
Keep separate safe outcomes for network, timeout, intentional cancellation and invalid/non-JSON server responses.

Show the **server's** audio count, physical count, exclusion and metadata values. React must not subtract or parse MPEG
bytes. For the sample, display 6,089 audio frames and the equation 6,090 - 1 = 6,089, plus declared total/stream bytes,
carrier size/offset, flags, seek-table presence and stored quality when valid. Label declaration mismatches and missing
fields honestly; do not say MediaInfo ran for the upload. For no carrier, show zero excluded and equal counts.

Retain accessible labels, keyboard/focus behavior, safe React text rendering, singular/plural wording, pending status,
one submission per action and retry after error. Never render untrusted HTML or flood a live region with metadata.
Keep local component state, existing styles and component layout; no router, query cache, new design system or redesign.

Maintain the existing Vite/static NGINX build and explicit frontend typecheck. Update only necessary contract imports,
service tests, Docker inputs and script wiring. No second frontend build migration or new lockfile.

## 11. JSDoc, TypeScript and verification requirements

Use inferred wire DTOs, clear domain types, discriminated states, meaningful `readonly`, safe indexing/narrowing and
type-only imports. Avoid `any`, blind `as` casts, unproved non-null assertions and generic `object` response contracts.
Do not duplicate TypeScript types in JSDoc braces; use `@typedef` only in JavaScript that actually remains.

Every changed public/nontrivial function, public contract field and operational script needs useful JSDoc: purpose,
units/accepted values, return meaning, failures, mutation/I/O, and lifecycle obligations. Document unknown/absent
metadata and the distinction between declaration and measurement. Inline comments explain masks, byte bounds,
classification, hook placement and why a raw writer remains. Keep sample maps concise and full acquisition/release
history in the existing evidence document. Do not add a comment parser or require boilerplate on obvious callbacks.

Extend verified formatting, source lint and typecheck paths to cover the changed backend, browser-safe contracts,
frontend and relevant tests. Workflow lint and a workflow named `linter` do not establish TypeScript-source lint.
Running `.ts` tests under Node does not by itself type-check those test files. Preserve `node:test` and the existing
independent browser harness; no new testing framework is necessary. Avoid unrelated repository-wide style churn.

Execute the relevant tests and final required suite from a clean isolated checkout, using pinned versions and actual
current commands. Do not weaken snapshots/assertions to accept both semantics. Minimum evidence:

| Area | Required observations |
| --- | --- |
| Parser independence | Handwritten header walk; tampered declarations leave count unchanged; complete-frame removal decrements count; final truncation fails; no runtime parser dependency. |
| Structural cases | CBR/VBR, supported bitrate/rate/padding/tag variants, mono/stereo/verified CRC handling, wrong/nonleading markers, Xing/Info optional flags, bounded reads, absent/damaged declarations, metadata-only and distinct VBRI behavior. |
| Sample/ASCII | Verify documented header fields, byte ranges, flags, lengths and exclusion invariant with portable independent fixtures; optional identified private sample corroborates exact map. No product parser in the oracle or diagram-text parser. |
| Application factory | Two independent app instances share no counters/state; construction/generation binds no socket; correct plugin/schema order; docs-generation cycle absent; startup fails safely for missing/corrupt docs; shutdown/startup races covered. |
| Request models | Accepted raw media types and parameters; encoding checks; exact `details`/duplicate handling; unknown query policy; no JSON/multipart conversion; admission precedes collection. |
| Response serializers | Exact default one-field body; all detail fields survive; closed alternatives; required safe integers/invariants; no accidental envelope or internal data; error body never serialized as success. |
| Error contract | Cover each reachable catalogue code/status, safe message and applicable headers; known framework mapping, unknown error fallback, raw early errors and normal handler errors; HEAD has no body. |
| Real transport | Exact inclusive 20 MiB and one byte over, actual bytes without Content-Length, slow upload/idle timeouts, Expect, bounded admission/overload, abort/disconnect, readable rejection, cleanup and a later successful request. |
| Proxy | Preserve raw spelling/query aliases and API status/body; verify NGINX 413/502/504 code/message parity, correct connect/read classification, no header/CSP duplication, no upload persistence. |
| OpenAPI/Redoc | Clean deterministic generation, semantic validation, resolved refs, schemas/examples/status-code consistency; actual local Redoc example selection and error visibility; no external assets, CSP regression or startup dependency cycle. |
| Frontend | One real request per action, retries disabled, deadline/cancellation preserved, valid/unknown codes and legacy/non-JSON errors handled, audio/physical/metadata values shown correctly, safe accessible state/recovery. |
| Build/scale | Independent clean API/frontend Docker builds, preserved startup commands, runtime dependency separation, explicit typechecks/lint; no additional whole-file copy/pass, unbounded frame array or unexplained large-file regression. |

Use Fastify injection for route/schema tests, but real sockets and NGINX for custom dispatch, framing, byte limits,
timeouts and early errors. Use real uploads for acceptance, not mocked successful response counts. Fault injection runs
only against controlled local/nonproduction targets, never production.

Independent fixtures must establish their own expected counts/bytes without product imports. Generated OpenAPI and
catalogue-parity tests validate consistency, **not independent business correctness**; retain independent expected
behavior as well. MediaInfo/FFprobe output is supplementary and must identify version/count convention. Do not invent
results for missing sample/tools, treat a declaration as a scan, or infer zero leaks from one finite workload.

## 12. Implement through the existing contract transition, without scope expansion

The current physical count, one-field error envelope, and Fastify-only runtime policy are still active constraints in
repository files. The requested target changes them narrowly. Keep the external default success shape, but explicitly
amend the current owner-contract for audio-count semantics, detailed representation, coded errors and required schema/docs
packages. Updating prose alone does not migrate executable gates.

Use the existing independent test-authoring/review/binding process. Reconcile the actual resolver, required suites,
pending transitions and split CI workflows. Preserve unaffected cases and original baseline objects. Do not reuse PR #55,
activate a deferred hosted candidate, invent an actual merge/binding SHA, or weaken resource/privacy/review protections.
Keep cloud delivery deferred; a local API change is not permission to run hosted tests or claim production v1.0.0.

Keep the work dependency-ordered and small:

1. Establish revised contract/error/schema expectations and the narrow dependency-policy prerequisite independently.
2. Extract the API construction/lifecycle boundaries and implement handwritten counting plus schema/error projection.
3. Generate OpenAPI, update the existing frontend/proxy consumer, and complete local end-to-end/schema/Redoc verification.

These are logical work stages, not an instruction to produce three giant PRs or merge independently owned work. Preserve
separately reviewable structural moves and behavior changes. Freeze edge decisions before adjusting their tests.

Where review/binding needs a remote action outside local authority, prepare isolated reviewable work and report that
specific prerequisite; do not pretend integration passed and do not stop all useful work at planning. Apply the repository's
actual release/version policy for observable count/error changes. Do not label them compatible just because `frameCount`
is still a number, re-tag history, or ship a silent live behavior change.

Update current README/curl examples, requirement mappings, API source metadata and documented error catalogue once.
Label old physical-count observations as historical, without rewriting the original assessment or acquisition evidence.
Preserve the recent local startup/Compose prerequisite improvements; verify the documented fresh-clone path remains usable
without private audio, Codex, private plugins or cloud credentials after ordinary package/image acquisition.

## 13. Done means observed evidence, not a completed plan

Return the changed file tree and responsibility map, explicit application registration/hook order, canonical schemas
and public error contract, default/detailed examples, exact locations of the four ASCII byte maps and lifecycle comment,
and representative inline-counting source. Summarize the five assessment criteria with concrete code/test evidence.

Record actual commands, versions, revision and outcomes, schema/Redoc checks, relevant screenshots/log locations,
resource-comparison limits, and exact unexecuted or blocked work. Distinguish local tests from retrieved CI/history;
harness discovery is not acceptance execution. Do not claim human approval, merged changes, publication or deployment
unless those separately authorized actions actually happened.

Perform one final consolidation pass: remove duplicate DTOs, error strings, response logic, obsolete frontend clients,
redundant wrappers and competing OpenAPI sources. Keep useful boundaries, independent tests and historical evidence.
Deliver the smallest working refactor that satisfies the assignment and these explicit owner changes.

## Source references and verification boundary

The snapshot above was inspected to update this prompt. No application test run, installed package combination, generated
OpenAPI, Redoc rendering result or new repository implementation is asserted by this document. Codex must establish those
results for the revision it actually changes. Consult primary sources for selected versions; do not copy their parsers.

### Repository sources at the inspected revision

[R1]: https://github.com/brobro10000/mp3-frame-counter/blob/93a7098c027b214b9b392b0f1408660097dd32f3/AGENTS.md
[R2]: https://github.com/brobro10000/mp3-frame-counter/blob/93a7098c027b214b9b392b0f1408660097dd32f3/docs/requirements/sources/assessment.html
[R3]: https://github.com/brobro10000/mp3-frame-counter/blob/93a7098c027b214b9b392b0f1408660097dd32f3/package.json
[R4]: https://github.com/brobro10000/mp3-frame-counter/blob/93a7098c027b214b9b392b0f1408660097dd32f3/server/src/http.ts
[R5]: https://github.com/brobro10000/mp3-frame-counter/blob/93a7098c027b214b9b392b0f1408660097dd32f3/frontend/src/services/mp3Analysis.ts
[R6]: https://github.com/brobro10000/mp3-frame-counter/blob/93a7098c027b214b9b392b0f1408660097dd32f3/server/src/docs/openapi.json
[R7]: https://github.com/brobro10000/mp3-frame-counter/blob/93a7098c027b214b9b392b0f1408660097dd32f3/server/src/build-docs.mjs
[R8]: https://github.com/brobro10000/mp3-frame-counter/blob/93a7098c027b214b9b392b0f1408660097dd32f3/frontend/nginx.conf.template
[R9]: https://github.com/brobro10000/mp3-frame-counter/tree/93a7098c027b214b9b392b0f1408660097dd32f3/.github/workflows
[R10]: https://github.com/brobro10000/mp3-frame-counter/pull/55

### Primary implementation references

- [Fastify lifecycle hooks][P1] and [middleware versus native hooks][P2].
- [Swagger route-schema generation, ordering and Fastify compatibility][P3].
- [TypeBox type provider and peer compatibility][P4].
- [Fastify validation and serialization][P5], [raw content-type parsing][P6], and [reply/hijack semantics][P7].
- [OpenAPI 3.0.3 response, schema and example definitions][P8]; [Redoc CE configuration][P9].
- [Ky request, retry, timeout and response behavior][P10].
- [ID3v2.4 structure][P11]; [MPEG header arithmetic][P12]; [Xing/demuxer conventions][P13].
- [Versioned MediaInfo MPEG implementation][P14]; [TypeScript JSDoc conventions][P15].

[P1]: https://fastify.dev/docs/latest/Reference/Hooks/
[P2]: https://fastify.dev/docs/latest/Reference/Middleware/
[P3]: https://github.com/fastify/fastify-swagger
[P4]: https://github.com/fastify/fastify-type-provider-typebox
[P5]: https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/
[P6]: https://fastify.dev/docs/latest/Reference/ContentTypeParser/
[P7]: https://fastify.dev/docs/latest/Reference/Reply/
[P8]: https://spec.openapis.org/oas/v3.0.3.html
[P9]: https://redocly.com/docs/redoc/config
[P10]: https://github.com/sindresorhus/ky
[P11]: https://id3.org/id3v2.4.0-structure
[P12]: https://ffmpeg.org/doxygen/7.1/mpegaudiodecheader_8c_source.html
[P13]: https://ffmpeg.org/doxygen/7.1/mp3dec_8c_source.html
[P14]: https://github.com/MediaArea/MediaInfoLib/blob/v26.10/Source/MediaInfo/Audio/File_Mpega.cpp
[P15]: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
