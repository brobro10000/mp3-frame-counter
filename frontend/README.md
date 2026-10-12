# Frontend

React and strict TypeScript provide the MP3 upload screen. Vite builds static assets; a non-root NGINX container serves
those assets and proxies same-origin API/docs requests to the separate API container. React runs in the browser. The
runtime has no Vite server, Node frontend process, browser storage or cloud dependency.

## Run and test

From the **repository root**, with [Docker and local prerequisites](../README.md#prerequisites) installed:

```sh
make up            # Build/start both containers; return after both are healthy and the HTTP ping succeeds.
make logs-backend  # Follow API logs; Ctrl-C stops viewing, not the application.
make down          # Stop this application's containers and network.
```

Open [the upload screen](http://127.0.0.1:8080/) or [Redoc](http://127.0.0.1:8080/docs/). Select a supported MP3 and
click **Analyze MP3**. Selection alone never uploads. Use the
[committed nine-frame fixture](../docs/deployment/local-handoff.md#optional-known-count-fixture) for a reproducible
example; the [provided assessment sample](../docs/requirements/samples/README.md) is supplied separately.

For development, use Node **24.20.0** and npm **11.19.0**. Both applications share the root lockfile; run these commands
from the repository root:

```sh
npm ci
npm run typecheck     # Check both applications and their unit-test sources.
npm run lint:source   # Lint application and unit-test sources.
npm run test:frontend # Build the UI; run frontend/tests/ response and real-HTTP service tests.
make e2e              # Run the separate independent browser/API acceptance lifecycle through Docker ingress.
```

`npm run build:frontend` creates `frontend/dist/` without running tests. Frontend unit tests validate response handling
and the request service; independent Playwright acceptance exercises the rendered application through NGINX. See
[CI responsibilities](../docs/testing/ci-workflows.md) and
[received-release startup](../docs/deployment/local-handoff.md).

## Source map

- [App](src/App.tsx) and [components](src/components/UploadForm.tsx) compose the page and accessible form/result.
- [useMp3Analysis](src/hooks/useMp3Analysis.ts) owns selection, admission, cancellation, the 45-second deadline and
  stale result prevention. Controls stay disabled during a request; another explicit submission can recover after
  failure.
- [mp3Analysis service](src/services/mp3Analysis.ts) sends the original file once to `/file-upload?details=true` using
  Ky, with retries, separate timeouts and keepalive disabled. The hook's deadline includes reading the response body.
- [Response guards](src/services/response.ts) narrow unknown JSON using browser-safe
  [canonical schemas](../server/src/contracts/mp3.ts) and [error codes](../server/src/contracts/errors.ts). No server
  parser or transport code enters the browser. [Types](src/types/analysis.ts) distinguish request states and failure
  kinds.

The browser displays measured audio/physical/carrier counts from one response; it does not parse audio or calculate a
count from metadata declarations. Server text is rendered literally. The brief result is announced in a polite live
region; detailed metadata remains outside it for normal navigation. The 20 MiB client check is advisory; the server and
ingress enforce actual bytes. See the [API contract and limits](../server/README.md).

## NGINX boundary

[The container entrypoint](entrypoint.sh) validates `PORT` (default `8080`, allowed `1024`–`65535`) and `API_UPSTREAM`
(default `api:3000`, hostname/IPv4 or bracketed IPv6 plus port; no URL path or credentials). It writes its runtime
configuration under `/tmp`; the container runs as UID/GID `101:101` with a read-only root filesystem.

The [proxy template](nginx.conf.template) forwards raw uploads without buffering, retries, caching or storage.
Controlled 413/502/504 errors are JSON. Docs use a separate CSP, and access logging is disabled. Public `/healthz` and
`/health` check NGINX liveness; a successful upload checks the full path. For an independent frontend image build:

```sh
docker build --platform linux/amd64 -f frontend/Dockerfile -t mp3-frontend .
```

See the [current architecture](../docs/architecture/v1.md), [evaluation](../docs/handoff/evaluation.md) and
[known gaps](../docs/handoff/known-gaps.md). Earlier [frontend evidence](../docs/validation/p4-frontend.md) records the
historical static implementation; [current refactor evidence](../docs/validation/backend-audio-refactor.md) records the
shipped React/Fastify application and its acceptance/release boundaries.
