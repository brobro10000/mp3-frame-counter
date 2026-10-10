# P4 frontend implementation handoff

Observed on **2026-10-09**, based on the controller's reviewed P3 handoff at local revision `f7ad2f5`. This record binds
the uncommitted frontend source below. It establishes a frontend build and isolated runtime checks, not full P4
acceptance, managed deployment, protected-main baseline publication or release completion.

Trace: APP-V1-001,003,006,007,008,013,016; AC-01,03,08,10,11,12.

## Independent baseline and owned scope

Read the implementer role, P4 phase, architecture, requirements, acceptance r3, P2/P3 evidence and the frozen acceptance
source before implementation. The recorded test-only local suite is `28c2a9c548f872dac54d9395a8ca0ed852f82240`, tree
`b789ffe426f4d0a303144338923748c9cdf424cf`, with fixture manifest SHA-256
`2f56db4641f9e5c09b34c2bc0c630e85a46a010025c634375b110a35e2cb120a`. Its provisional local review permits local
implementation; the separate protected-main freeze remains a controller-owned shipping prerequisite.

This implementer changed only `frontend/` and this record. No acceptance source, fixtures, expected counts, baseline,
API, controller, Compose or gate was changed. Static browser previews were saved to ignored execution scratch at the
controller's request.

## Implementation and limits

The static page has a labeled file input, exact **Analyze MP3** action and an accessible status region. Selection alone
sends nothing. Submission uses the actual File as a raw relative `/file-upload` POST with `Content-Type: audio/mpeg`.
Both controls are disabled while pending and restored in `finally`. Responses use `textContent`; successful results must
contain exactly one positive safe-integer `frameCount`. API errors, unreadable JSON, network failures and the 45-second
browser deadline produce readable text and permit retry. The input explains the inclusive 20 MiB boundary; the client
size check is advisory, not a substitute for actual-byte enforcement at the API.

There are no frameworks, npm dependencies, remote fonts/assets, browser storage, upload history, player, progress
percentage or upload-on-selection behavior. Desktop and mobile layouts retain native file selection, visible keyboard
focus and readable error/status text.

The independent image uses the controller-selected immutable NGINX index:

```text
nginxinc/nginx-unprivileged:stable-alpine@sha256:15c994d10d6d78658721c3bcafff14cb281fba2a4bdf9d5ba92c416a472516e3
```

The Docker context is only `frontend/`, with an allowlist of six runtime/build inputs. The image starts directly as
`101:101`, installs no packages and renders a validated configuration into `/tmp`. It never invokes the base image's
startup configuration scripts. `PORT` defaults to 8080; local `API_UPSTREAM` defaults to `api:3000`. Managed
environments must explicitly supply their same-environment private upstream. Newlines, schemes, paths, directive
characters and out-of-range ports fail before rendering. DNS comes from runtime `/etc/resolv.conf`, including safely
bracketed IPv6 resolvers; the variable upstream uses one-second DNS validity for address changes.

NGINX has one worker, 128 connections, ten-second keepalive and thirty-second body inactivity timeout. Its inclusive
`20m` upload cap aligns with the API. Upstream HTTP/1.1, disabled request/response buffering, zero proxy temp-file size,
disabled caching/storage/retry and unchanged API errors support the upload contract. Local 413/502/504 failures receive
JSON; health remains service-local. Five-second resolver/connect/read/send timeouts support the controlled fault suite.
These choices follow the [NGINX proxy documentation](https://nginx.org/en/docs/http/ngx_http_proxy_module.html) and
[runtime resolver documentation](https://nginx.org/en/docs/http/ngx_http_core_module.html#resolver), read 2026-10-09.
They do not establish managed-provider behavior or total upload-duration bounds.

## Actual checks

The scoped formatting, syntax and whitespace checks passed:

```sh
node node_modules/prettier/bin/prettier.cjs --write frontend/index.html frontend/styles.css frontend/app.js frontend/README.md
node --check frontend/app.js
sh -n frontend/entrypoint.sh
git diff --check -- frontend
```

Seven explicit bad runtime inputs were rejected with exit 1 before rendering: privileged/out-of-range/invalid PORT,
directive injection, a URL in place of host:port, newline injection and an out-of-range upstream port. The check used
the real entrypoint under `sh`, not a reimplementation of its validation.

Actual Chromium static checks used a disposable loopback static server with the real HTML/CSS/JavaScript. At desktop
1300×850 and mobile width 375, visual inspection found no clipping or horizontal overflow. Native accessible input and
button locators worked; empty submission produced an accessible message, and selecting a file sent **zero uploads**. No
successful upload response was mocked. Ignored previews are `.mvp-workflow/execution/frontend-desktop.png` and
`.mvp-workflow/execution/frontend-mobile.png`.

The independent build command was:

```sh
docker --config .mvp-workflow/execution/docker-public build --platform linux/amd64 -t mp3-frontend:p4 frontend
```

The first attempt exited 1 because Docker Hub's token endpoint returned HTTP 504 before executing source steps. One
bounded retry with the identical source and pin completed successfully. The first failure was an external acquisition
failure, not a product assertion failure; no dependency pin or credential was changed.

| Observation                 | Actual result                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| Built local image ID        | `sha256:057f897d9a01e583b38c12e6c6540a6043754f6d3ab053be37d79b34e5ca6689`                        |
| Platform                    | `linux/amd64`                                                                                    |
| NGINX                       | `1.30.5`                                                                                         |
| Image user and runtime UID  | `101:101`; UID/GID both `101`                                                                    |
| Isolated runtime            | Network `none`, read-only rootfs, `/tmp` tmpfs, all capabilities dropped                         |
| Runtime limits              | 64 MiB memory, 0.5 CPU, 32 PIDs                                                                  |
| Own health                  | GET 200 with exactly `{"status":"ok"}`, with no API available                                    |
| Own unsupported methods     | POST/HEAD 405, JSON Content-Type and `Allow: GET`; HEAD body empty                               |
| Declared oversized upload   | Content-Length `20971521` returned 413 with usable JSON                                          |
| Rendered configuration      | `nginx -T` passed and required worker/limit/streaming/no-retry/no-access-log settings were found |
| Runtime filesystem evidence | `docker diff` empty; only `/tmp/nginx.conf` and `/tmp/nginx.pid` regular files                   |
| Graceful stop               | SIGQUIT via Docker stop, exit 0, no OOM; observed command duration 0.069 seconds                 |

A second isolated container verified `PORT=9090`, upstream `[::1]:3000` and runtime IPv6 nameserver `2001:db8::53`.
Startup/configuration and exact health JSON passed. The rendered resolver was correctly bracketed. This check made no
DNS query or upstream request; it does not claim IPv6 network reachability. Both probe containers were removed.

## Remaining controller checks

The oversized probe used a Content-Length header; it does **not** establish actual-byte enforcement, chunked 413,
exact-limit success or rejection draining. Full AC-01–12 must exercise the real frontend/proxy/API pair, including
502/504 fault recovery, dynamic DNS/address recovery, pending/retry behavior, API method/status/byte preservation,
aborts, sample comparison, memory/admission behavior and temporary-path inspection under real uploads.

No application acceptance, provider fit, cloud resource, production approval, merge, human review or deployment is
claimed by this handoff. The independent reviewer and controller own those next observations.

## Source identity

SHA-256 values after scoped formatting and the successful image/runtime checks:

```text
131ad9cb902b77645bec16301812600c28407bc1fee6670f9458f33a6186cacd  frontend/.dockerignore
7292237886ecc37f2f60793b44343a4efc28426d594198d2f53fe500844a9a7b  frontend/Dockerfile
32cbde158dc7ecad1aefc989df81f6800ca749a3a893f74b91b71d100998db0a  frontend/README.md
a63fd353856820bd29bd0d9406ee23b646460b1bdc2faf056eaad1f8951ecd78  frontend/app.js
f26bd62bfab3d5e546defebc67f437387405efb9bc5f028b64156a52a4f1602c  frontend/entrypoint.sh
cfe257294dfadd0fcefb66b34c737eff3d35be42170730a764c660baef85f9e4  frontend/index.html
b0a3c984a236c2f6b8c54f7d5a825874512fa9b1d357a9cfe1a45f77befc9203  frontend/nginx.conf.template
ce81922b009767165e3dc401e4b9c176d5be5c44da860e7cf61ed643986efd0b  frontend/styles.css
```

## AC-12 timeout classification and active-shutdown correction

The controller's full run at clean revision `ff0d770d2474fa8a1493a93caaddb4aaaa4dbb16` passed 59 of 60 cases and failed
the stopped-API case: the proxy returned 504 where r3 requires 502. The original failed result remains
`.artifacts/mp3-e2e-70341-a97366c44d10.json`. That failure is not replaced by the narrower checks below; the controller
must rerun the complete unchanged suite against the repair.

The [NGINX upstream variable reference](https://nginx.org/en/docs/http/ngx_http_upstream_module.html#variables)
describes connection timing. Inspection of the
[exact 1.30.5 source](https://github.com/nginx/nginx/blob/release-1.30.5/src/http/ngx_http_upstream.c) showed that
timing starts unset, formats as `-`, and is populated at the request-send stage; both connection and response timeouts
enter the generic 504 path. A timed-out attempt to establish a connection therefore needed distinct local error
handling.

Before editing the template, an isolated real API/frontend pair using the failed run's exact images reproduced the
failure. Temporary diagnostic headers in that disposable frontend exposed actual NGINX values. A stopped API produced
504 after 5.022 seconds with `$upstream_connect_time` equal to `-`; a paused API produced 504 after 5.017 seconds with
connection timing `0.000`. Real warmup/recovery uploads returned the independent tone fixture's exact count of 9. The
diagnostics were not added to product source, image configuration or permanent logging.

The minimal repair maps absent connection timing to a local unavailable-service 502 inside the existing timeout handler.
Established-connection timeouts still return 504. The
[named error handler](https://nginx.org/en/docs/http/ngx_http_core_module.html#error_page) now chooses its response
code. No successful response is fabricated; upstream retry remains disabled, and `proxy_intercept_errors off` continues
to preserve actual API responses. No API, fixture, assertion, controller or frozen contract was changed.

At the controller's additional request, `worker_shutdown_timeout 5s` now bounds graceful active-client draining before
the seven-second container stop deadline. Its main-context behavior was checked against the
[official directive documentation](https://nginx.org/en/docs/ngx_core_module.html#worker_shutdown_timeout) and the
actual pinned NGINX image. This does not change the thirty-second request-body inactivity policy during normal service.

The final repair was built independently with:

```sh
docker --config .mvp-workflow/execution/docker-public build --platform linux/amd64 -t mp3-frontend:connect-timeout-repair frontend
```

An earlier repair build had captured its context before the extra shutdown change arrived. A source/image hash check
correctly rejected that stale template before fault testing; its temporary resources were removed. Rebuilding the final
source succeeded. The tested image is `sha256:a39e1b86831bc206e93f0352edd03f6365647417dd6dff43e0d71a7bb1011b18`
(`linux/amd64`), and its baked template hash exactly matched the working source.

Focused real fault checks ran in the unique isolated pair `mp3-repair-probe-6b0e7e4153`, with read-only root
filesystems, tmpfs, dropped capabilities and the assigned memory/PID limits. The API image remained the failed run's
unchanged `sha256:79bcf5f19430d3d514e20711bd8550e76245c241d1d06d45f2b1ed2265c34b38`.

| Actual observation                    | Internal upstream status / connection timing | Public result                                           |
| ------------------------------------- | -------------------------------------------- | ------------------------------------------------------- |
| API stopped, first cycle              | `504` / `-`                                  | 502 readable JSON, 5.012 seconds                        |
| API stopped, second cycle             | `504` / `-`                                  | 502 readable JSON, 5.009 seconds                        |
| API stopped, third cycle              | `504` / `-`                                  | 502 readable JSON, 5.008 seconds                        |
| API paused                            | `504` / `0.000`                              | 504 readable JSON, 5.010 seconds                        |
| Every restart/resume                  | `200` / numeric timing                       | Real fixture upload returned exactly `{"frameCount":9}` |
| SIGQUIT with incomplete upload active | 128 bytes sent, 1 MiB declared               | Exit 0 in 5.200 seconds; no OOM or partial-success 200  |

The incomplete-upload socket stayed open with no premature response before shutdown. Both timing paths retained their
intended error messages. All focused assertions and NGINX configuration checks passed. Each probe restored its paused
API in `finally`, removed only its captured container IDs/network, and subsequent scoped listings confirmed no probe
containers or networks remained. The default application and other projects were untouched.

Only the following frontend source hashes changed in this correction; the initial handoff hashes above remain historical
evidence rather than being overwritten:

```text
5787920ca621504bbe416741a5c73212cf4e04d14d348004df654317b1a52d67  frontend/nginx.conf.template
c2204f9abbd52383c6acbeeee8fdd47ef0abff427bfafbe0b3c1129b00ebb860  frontend/README.md
```

Independent repair review and full-suite validation remain controller-owned. These focused results do not claim full P4
acceptance, human approval, merge, managed release or provider-network behavior.

## Subsequent integrated result

Independent repair review returned PASS, then the full frozen suite at clean `2adf71b447bfee9b78e9bdfc2b29566af894d0fe`
passed **60/60 cases**, including stopped/paused upstream failures and recovery, with no skipped cases and successful
cleanup. See [integration evidence](p4-integration.md) and the
[exact sanitized result](artifacts/p4-local-acceptance.json). The source hashes above remain unchanged. This establishes
local integration after the recorded repair; provider behavior and release remain unverified.
