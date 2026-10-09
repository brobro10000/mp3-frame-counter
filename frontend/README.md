# MP3 browser and proxy

This directory is the complete frontend image build context. It contains static HTML/CSS/JavaScript and an unprivileged
NGINX proxy; it needs no npm install, bundler, sibling API files or external assets.

```sh
docker build --platform linux/amd64 -t mp3-frontend frontend
```

The root Compose configuration supplies the two-service environment. The image runs as UID/GID `101:101`, supports a
read-only root filesystem, and requires writable ephemeral `/tmp` (use tmpfs locally). Its entrypoint writes and checks
`/tmp/nginx.conf` before starting NGINX in the foreground. PID and temporary paths also remain under `/tmp`.

| Input          | Default    | Contract                                                                                           |
| -------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `PORT`         | `8080`     | Integer `1024`–`65535`; the host must route traffic to this container port.                        |
| `API_UPSTREAM` | `api:3000` | DNS hostname/IPv4 and port, or `[IPv6]:port`; no scheme, path, query, credentials or NGINX syntax. |

The upstream default is for local Compose only. Managed environments must explicitly provide the matching private API
host and port. DNS resolvers come from runtime `/etc/resolv.conf`, with IPv6 literals bracketed for NGINX; no Compose
resolver address is hardcoded. The variable upstream resolves dynamically with a one-second validity period. NGINX
startup and `GET /healthz` do not require a reachable API. Invalid configuration fails startup without printing its
values. DNS resolution and each upstream connect/read/send inactivity timeout are five seconds.

The browser submits only after **Analyze MP3**, sends the real File as a raw same-origin `audio/mpeg` POST, and uses
text rendering for every result and error. It disables both controls while pending and permits retry after every
outcome. A 45-second browser deadline bounds an otherwise stalled request. Client size feedback is advisory; NGINX and
the API enforce the inclusive 20 MiB actual-body limit. No filename, upload or result is stored in browser persistence.

The upload location preserves methods, bytes, query strings and API statuses/JSON. It disables request/response
buffering, upstream retry, caching and storage; HTTP/1.1 upstream forwarding keeps chunked uploads streaming. Local
ingress 413/502/504 failures receive JSON errors. Access logging is disabled, and error logs never include upload
bodies. NGINX uses one worker, 128 connections, ten-second keepalive and a thirty-second request-body inactivity
timeout. These are bounded local settings, not throughput guarantees or a total upload-duration deadline.

See [acceptance r3](../docs/testing/acceptance-contract.md) and [frontend evidence](../docs/validation/p4-frontend.md).
No source or configuration review alone establishes full local acceptance, managed ingress compatibility or release
completion; those require the controller's actual independent checks.
