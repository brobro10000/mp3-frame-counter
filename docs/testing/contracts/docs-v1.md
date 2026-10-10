# docs-v1 independent candidate contract

This additive candidate succeeds transport-v1 only after a separate reviewed binding and product activation. The
existing 67 cases, transport specification and MP3 fixture identities/recipes remain unchanged. Candidate discovery,
fixture controls and source checks are not application acceptance. DOCS-01's independently reviewed R6 disposition
selects the bounded renderer arrangement below; this contract does not activate serving, policy or dependencies in
product.

DOCS-01 disposition, 2026-10-10: independent feasibility established the adopted renderer/artifact hashes and header
model. Before candidate freeze, the coordinator's R4/R7 scope decision replaced the earlier planning card's page-hiding
expectation with the finite live-document observation below; destructive teardown was not proved. Historical failed
arrangements remain in local experiment evidence. The candidate's controls are now reproducible through the pinned
standalone check, separate from product acceptance.

## Public routes and response decisions

All requests use the validated public BASE_URL origin, through NGINX. The docs namespace is closed:

| Resource                           | GET                                      | HEAD                        | Media type                                     |
| ---------------------------------- | ---------------------------------------- | --------------------------- | ---------------------------------------------- |
| `/docs`                            | 308, exact relative Location `/docs/`    | 308, same Location, no body | no prescribed redirect body                    |
| `/docs/`                           | 200, actual interactive Redoc page       | 200, no body                | text/html, optional UTF-8 charset              |
| `/docs/openapi.yaml`               | 200, parseable YAML 1.2 specification    | 200, no body                | application/yaml, optional UTF-8 charset       |
| `/docs/assets/redoc.js`            | 200, pinned localized derivative         | 200, no body                | application/javascript, optional UTF-8 charset |
| `/docs/assets/init.js`             | 200, same-origin external initialization | 200, no body                | application/javascript, optional UTF-8 charset |
| `/docs/assets/docs.css`            | 200, same-origin external CSS            | 200, no body                | text/css, optional UTF-8 charset               |
| `/docs/assets/redoc-logo-mini.svg` | 200, exact local image                   | 200, no body                | image/svg+xml, optional UTF-8 charset          |

The YAML response has `Content-Disposition: attachment; filename="openapi.yaml"`. JSON syntax is valid YAML;
serialization, key order and whitespace are not oracles. Every other contained `/docs/` path returns 404 readable JSON
`{error}`; it never falls back to the docs HTML. All valid application-level methods other than GET/HEAD (including
POST/PUT/PATCH/OPTIONS/DELETE) on known docs resources return 405 with `Allow: GET, HEAD` and readable JSON `{error}`.
Malformed HTTP framing is outside this uniform JSON promise. Unknown path takes precedence over method. HEAD on unknown
paths returns 404 headers without a body. Queries do not change resource identity; no docs endpoint accepts or reflects
request bytes. Existing upload/health methods, errors and precedence are unchanged. These public choices precede product
implementation.

## Specification and local artifacts

The served document has OpenAPI 3.0.3 and the independently reviewed transport API semantics: raw binary upload, both
media types, inclusive 20971520 actual bytes, two active uploads, exact positive-integer frameCount response, closed
error and health schemas, statuses/headers, no response body for HEAD and existing transport requirements/proxy errors.
Root servers are absent or the default relative `/`; global security is absent or empty (no authentication demand). Only
contained same-document JSON pointer references are admitted; all references must resolve. Metadata prose may vary, but
cannot replace or contradict these structural requirements. YAML parsing rejects duplicate keys, unknown/custom tags,
non-string map keys, multiple documents, non-JSON/nonfinite/cyclic values and excessive alias expansion before
resolution. YAML 1.2 core parsing is bounded to 256 KiB, strict, with merge keys disabled and at most 100 alias
expansions.

Redoc CE 2.5.4 standalone original SHA256 is `dcaf76612bc4a3fbcc923a8966dee2f6146a5f32e5ce1b6f02dd60cbbf89500b`. Its
only approved derivative changes replace exactly one `https://cdn.redoc.ly/redoc/logo-mini.svg` with
`/docs/assets/redoc-logo-mini.svg` and remove the exact terminal source map comment. The derivative SHA256 is
`21ce5beb19818927f12e2db16e1a332e4f0eac5b8538012b6ecd048585b8cdbf`. Preserve the original package/map, license/notices,
desktop-visible branding/link and original responsive sidebar behavior (the narrow sidebar may be hidden); never present
the old map as accurate for the derivative. The unchanged 539-byte local SVG SHA256 is
`1dab4315f8de2177b2b2726b29e84a26314c69cd27d692228947c0058793d5a7`. Retain its recorded source provenance without
inventing a separate license grant. Build-time deterministic transformation remains separate product work.

Search is disabled, fonts are system fonts, initialization is external and same-origin. No remote runtime resolution,
font service, CDN, fallback, worker, hidden failed-logo fetch, nonce, unsafe-inline/eval or vendor changes beyond the
two above. The local logo must return exact bytes and actually load; renderer onError hiding is insufficient.

## Effective policy and meaningful rendering

NGINX is the sole public header owner. Its reviewed later configuration must explicitly handle upstream security headers
so multiple policies cannot intersect. External tests require exactly one enforced CSP and no CSP meta/report-only
policy:

```text
default-src 'none'; script-src 'self'; style-src 'self' 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=' 'sha256-QMIg+bpjm3JdElJ388KYke01izlUW0UoNOeKjpMxdgc='; style-src-attr 'none'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; worker-src 'none'
```

Directive/token order is immaterial; duplicate directives or extra permissions are rejected. Apply docs policy only to
`/docs`, `/docs/` and contained docs resources, redirects and errors. All those responses retain no-store, nosniff and
no-referrer. GET `/` retains its independently supplied original policy exactly in meaning:

```text
default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'
```

The empty style hash permits trusted-script CSSOM generation; it does not hash final rules. Data-image permission is
scheme-wide. Neither exception reaches `/`. Literal inline style element/attribute controls remain rejected.

Fresh Chromium contexts block service workers. Before page scripts execute, bounded CDP Network/Audits/Log and DOM
instrumentation observe the live document and prevent foreign HTTP requests without rewriting same-origin responses.
Check desktop 1280x900 and narrow 390x844: actual endpoint/request/response schema content, loaded logo and a real
existing 400-response expansion from description-only to required string error schema. Decorative HTML, a click or URL
fragment alone cannot pass. Observe zero foreign attempts even if blocked, zero enforced CSP violations and zero page
errors. No CSP meta policy is permitted, including policies inserted during interaction or the retained interval. The
page remains alive through screenshot and a 200 ms retained-document interval; then liveness is checked and observation
closes synchronously before classification. This finite claim excludes teardown, destructive navigation, popups,
workers, WebSockets and unrelated protocol families. Cleanup is separately mandatory.

## Candidate evidence and future checks

Owned positive/negative fixtures use the same public response, YAML, artifact, browser and policy predicates as real
tests. Controls include decorative shell, incompatible/mismatched CSP, script/font/reference attempts, changed served
schema, missing/wrong logo, duplicate/tighter/looser policies, root-policy leakage and a late page error. Native guard
calibration requires actual owned destination receipts for positives and zero receipts plus attribution for independent
CSP/guard negatives across direct, redirect/two-hop and live-document beacon cases. No successful response is invented
for product.

Standalone checks enforce exact complete discovery and real inventory/report mutation controls (missing, duplicate,
zero, skipped, failed, retries, expected failure and stale attribution). Browser controls write package-local evidence
with unique run identity and source hashes; bounded children/servers/contexts close in finally. No skip, retry or
expected-failure case can pass application reporting. The required transport suite remains authoritative until actual
docs binding/activation. Actual product headers, routes, artifacts, YAML and renderer behavior must later pass this
external candidate at the public origin; source/configuration review must additionally establish sole header ownership
and deterministic offline packaging. No local fixture result substitutes for Linux CI, protected-main admission, release
publication or hosted acceptance.
