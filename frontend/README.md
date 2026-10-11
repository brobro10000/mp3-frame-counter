# Browser and NGINX frontend

The React/TypeScript interface lets a user choose one MP3, click **Analyze MP3**, read its audio frame count and inspect
physical/carrier diagnostics from the same response. It sends the selected file once as a raw same-origin `audio/mpeg`
POST to `/file-upload?details=true`. Both controls are disabled while pending; the browser waits for and reads the API
response before showing a result. Its 45-second deadline covers upload, headers and response-body consumption. Client
size feedback is advisory; NGINX and the API enforce the inclusive 20 MiB limit.

The server walks complete MPEG frames and excludes one recognized leading Xing/Info carrier from the audio count. The
browser displays the server's three counts as an equation without subtracting, parsing MP3 bytes or retrieving a count
from a declaration. The carrier details label absolute byte offsets, frame size, flags, declared totals, seek-table
presence and stored quality. Missing fields say "Not present"; declaration mismatches and truncated optional fields
produce bounded warnings. No MediaInfo execution is implied.

The build compiles React into static same-origin assets. NGINX serves those assets; React executes in the browser. No
development server, npm process or extra container runs in production. The root application lockfile owns the frontend
dependencies; the independent acceptance package keeps its separate lockfile.

## Source boundaries

- [App](src/App.tsx) composes the page. [Components](src/components/UploadForm.tsx) render the form, introduction,
  navigation and accessible result without issuing requests.
- [useMp3Analysis](src/hooks/useMp3Analysis.ts) owns selection, byte feedback, duplicate admission, the 45-second
  deadline, cancellation, retry state and stale-result prevention. Selection alone never uploads.
- [The API service](src/services/mp3Analysis.ts) uses Ky with retries, separate timeouts and keepalive disabled. It
  sends the original raw File, preserves cache/credential/redirect policy and consumes each response once. Its optional
  controlled `baseUrl` lets native Node regression tests use real loopback HTTP.
- [Pure response helpers](src/services/response.ts) validate unknown JSON with the browser-safe canonical
  [MP3 schemas](../server/src/contracts/mp3.ts) and [error catalogue](../server/src/contracts/errors.ts). Their
  interpreted guards enforce closed objects, numeric/count/byte invariants and code/status/message consistency without
  unsafe-eval. [response.ts](src/response.ts) retains the existing helper entrypoint.
- [Shared types](src/types/analysis.ts) define the mutually exclusive idle, pending, success and error states. Typed
  client timeout, cancellation, network and invalid-response reasons remain distinct from validated server codes. Legacy
  errors remain safe text; non-JSON and unknown/invalid coded errors use a safe fallback.

The short count/state remains in the polite atomic live region. The diagnostic equation, carrier metadata and warnings
are outside it, available for normal screen-reader navigation. React renders all response text literally.

From the repository root, use `npm run build:frontend` for the strict TypeScript/static bundle build and
`npm run test:frontend` to build it and run the localized response and real-HTTP service regressions in
`frontend/tests/`. `npm run typecheck` includes both application boundaries and their test sources;
`npm run lint:source` checks the same source/test directories. `npm run test:unit` builds and tests the server and
frontend once each. Full browser/API acceptance remains a separate required check.

Run the complete application from the repository root with `make up`, then open
[http://127.0.0.1:8080/](http://127.0.0.1:8080/). Build the frontend image independently from the same root:

```sh
docker build --platform linux/amd64 -f frontend/Dockerfile -t mp3-frontend .
```

Use `make down` to stop the source Compose project. See the [local handoff](../docs/deployment/local-handoff.md) for
exact tested-image startup.

## Proxy configuration

The runtime uses UID/GID `101:101`, a read-only root filesystem and an ephemeral writable `/tmp`. Its entrypoint
validates configuration and writes `/tmp/nginx.conf` before starting NGINX in the foreground.

| Input          | Default    | Meaning                                                                            |
| -------------- | ---------- | ---------------------------------------------------------------------------------- |
| `PORT`         | `8080`     | Container listening port; integer `1024`–`65535`.                                  |
| `API_UPSTREAM` | `api:3000` | Private hostname/IPv4 plus port, or `[IPv6]:port`; no scheme, path or credentials. |

Compose supplies `api:3000`; another host must explicitly supply its matching private upstream. Runtime DNS comes from
`/etc/resolv.conf`. Upload forwarding preserves raw bytes, methods, query strings and API JSON. It disables buffering,
retry, caching and storage and uses HTTP/1.1 upstream forwarding. Local 413/502/504 ingress failures receive JSON. The
docs namespace proxies the API's packaged Redoc assets under its separate CSP.

No filename, upload or result is stored in browser persistence. Access logging is disabled. Resource limits, deadlines
and shutdown settings are bounded safeguards, not a throughput guarantee.

Read the [architecture](../docs/architecture/v1.md), [API guide](../server/README.md),
[raw acceptance contract](../docs/testing/acceptance-contract.md) and
[historical frontend evidence](../docs/validation/p4-frontend.md). The latter describes the earlier static
implementation; this React migration needs fresh acceptance and release evidence.
