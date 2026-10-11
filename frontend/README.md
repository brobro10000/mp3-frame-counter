# Browser and NGINX frontend

The React/TypeScript interface lets a user choose one MP3, click **Analyze MP3**, read its physical frame count and
retry after an error. It sends the selected file as a raw same-origin `audio/mpeg` POST to `/file-upload`. Both controls
are disabled while pending; the browser waits for and reads the API response before showing a result. Its 45-second
deadline bounds a stalled request. Client size feedback is advisory; NGINX and the API enforce the inclusive 20 MiB
limit.

The build compiles React into static same-origin assets. NGINX serves those assets; React executes in the browser. No
development server, npm process or extra container runs in production. The root application lockfile owns the frontend
dependencies; the independent acceptance package keeps its separate lockfile.

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
