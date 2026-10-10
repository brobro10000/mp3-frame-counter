# Offline documentation build records

## Scope and source binding — 2026-10-10

These are the original local records referenced by the [implementation evidence](docs-implementation.md), followed by
readbacks that bind the retained images to committed product inputs. They are inspectable evidence for
DOCS-OFFLINE-BUILD, not CI admission, a published image pair or a deployment claim. Each `text` fence preserves the
record's exact UTF-8 bytes, including its final newline; its SHA-256 is given immediately above. The two `base64` fences
preserve build logs with trailing spaces: decode before hashing or reading. Commands in records are historical evidence,
not instructions to execute them during review. Build-dashboard identifiers are local Docker record identifiers, not
hosted application URLs or credentials.

Companion run `20261010T183230-6d14196e` reviewed head `a8aa5e4c03960e6233ac67a9802f97195e53d196` and all 29 changed
paths. It returned **incomplete**, with no established code defect, because these offline records were unavailable in
its snapshot. That report is preserved with SHA-256 `d726e46a7153dd7abdf7a75546be61de763c623d374ae3ee30cb99e805e18f2f`.
This evidence addition requires fresh review; it does not convert that verdict into approval.

The retained builder readback compares all fifteen copied build inputs to source
`46695d25ad38f919c66b9b0b750e2f3fb1d4c0d5` and confirms those inputs are identical at the reviewed head. It reads the
specific local builder image by immutable identity using only Node builtins, with networking disabled and a read-only
filesystem. This closes the copied-source binding; it does not claim that Docker copied its Dockerfile into the image.
The uncached builder log records the selected Dockerfile's actual denied-network build step and resulting image.

The two original generation manifests are byte-identical. The follow-up creates a fresh network-disabled container from
that retained builder, runs the normal build again, and records the exact command and all thirteen output hashes. The
generator removes its previous output before writing the fresh set. All thirteen path/size/hash identities match the
original manifests. This is an additional isolated generation, not a repeated network acquisition or image build.

The runtime readback independently reads all thirteen packaged files and verifies UID, runtime Fastify version and the
absence of installed Redoc, TypeScript, source, tests and npm. It exactly matches the original runtime inspection.
Runtime assembly reused the already generated build layer; only the control steps and original builder generation claim
uncached execution. Neither this assembly nor its inspection is the separately built E2E/release image pair.

The control probe has a ten-second overall deadline and four-second TCP deadline. It writes only its resolved test
address inside the disposable build, sends no application payload, and fails on unexpected DNS/TCP outcomes. The actual
negative observation was `EAI_AGAIN`/`ENETUNREACH`, between two successful counterparts. The finite control establishes
this builder's selected network mechanism, not universal protocol isolation or a macOS browser observation.

The new readbacks execute in disposable containers without credentials or host mounts. The existing local application
and acceptance sources are unchanged. Fresh exact-head PR CI, companion approval, main acceptance and publication remain
required.

## Control Dockerfile

SHA-256: `dfa7359dedb4d2fe49f48494200134bd4ba68dee98bd353560a3841f97ab3ebf`.

```text
FROM node:24.20.0-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf
COPY probe.mjs /probe.mjs
RUN node /probe.mjs positive
RUN --network=none node /probe.mjs denied
RUN node /probe.mjs positive
```

## Control probe

SHA-256: `ae603befdbfa94acd25c193863184e6143e676f4c15f4e1642df3d4968682f27`.

```text
/** Bounded inert TCP/DNS counterpart for BuildKit network isolation; writes only the resolved test IP. */
import { lookup } from 'node:dns/promises';
import { connect } from 'node:net';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const denied = process.argv[2] === 'denied';
const deadline = setTimeout(() => { console.error('probe timeout'); process.exit(2); }, 10000);
try {
  let dnsError;
  let address;
  try { address = (await lookup('registry.npmjs.org', {family:4})).address; }
  catch (e) { dnsError = e.code; }
  if (!denied) { assert(address); writeFileSync('/tmp/control-ip', address); }
  else { assert(dnsError); address = readFileSync('/tmp/control-ip','utf8'); }
  const result = await new Promise(resolve => {
    const socket = connect({host:address, port:443});
    socket.setTimeout(4000);
    socket.once('connect', () => { socket.destroy(); resolve('connected'); });
    socket.once('error', e => { socket.destroy(); resolve(e.code); });
    socket.once('timeout', () => { socket.destroy(); resolve('timeout'); });
  });
  if (denied) assert(['ENETUNREACH','EHOSTUNREACH','ECONNREFUSED'].includes(result), result);
  else assert.equal(result,'connected');
  console.log(JSON.stringify({network:denied?'none':'default',dns:denied?dnsError:'resolved',tcp:result,bytesSent:0}));
} finally { clearTimeout(deadline); }
```

## Control build log

SHA-256: `4a8ef5788c17d645c54f3343bf3ed3983df63d7498e535723ea5c34d87e76d88`.

```text
#0 building with "desktop-linux" instance using docker driver

#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 262B done
#1 DONE 0.0s

#2 [internal] load metadata for docker.io/library/node:24.20.0-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf
#2 ...

#3 [auth] library/node:pull token for registry-1.docker.io
#3 DONE 0.0s

#2 [internal] load metadata for docker.io/library/node:24.20.0-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf
#2 DONE 0.7s

#4 [internal] load .dockerignore
#4 transferring context: 2B done
#4 DONE 0.0s

#5 [1/5] FROM docker.io/library/node:24.20.0-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf
#5 resolve docker.io/library/node:24.20.0-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf 0.0s done
#5 CACHED

#6 [internal] load build context
#6 transferring context: 1.43kB done
#6 DONE 0.0s

#7 [2/5] COPY probe.mjs /probe.mjs
#7 DONE 0.0s

#8 [3/5] RUN node /probe.mjs positive
#8 0.493 {"network":"default","dns":"resolved","tcp":"connected","bytesSent":0}
#8 DONE 0.5s

#9 [4/5] RUN --network=none node /probe.mjs denied
#9 5.435 {"network":"none","dns":"EAI_AGAIN","tcp":"ENETUNREACH","bytesSent":0}
#9 DONE 5.5s

#10 [5/5] RUN node /probe.mjs positive
#10 0.468 {"network":"default","dns":"resolved","tcp":"connected","bytesSent":0}
#10 DONE 0.5s

#11 exporting to image
#11 exporting layers 0.0s done
#11 exporting manifest sha256:4e426f9433c3f955e1d0fd8033876502b71332015112b026d83817127f7fa6e9 done
#11 exporting config sha256:7ceca0e34b3e565054cbcbfa8b0aa9ddb10aee966e9c4b4844d31b3770741a16 done
#11 exporting attestation manifest sha256:40a9af4f888185393c9db547fc2999ce6b8b438b5564d2ac34cf069139371730 done
#11 exporting manifest list sha256:f2db4a30e4a8465f06095069d4ea9c08f9f01e6439f7171841b90d0ad461404c done
#11 naming to docker.io/library/mp3-docs-offline-control:local
#11 naming to docker.io/library/mp3-docs-offline-control:local done
#11 DONE 0.1s

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/igjsbv48xusq6e1ainb6hehws
```

## Uncached product builder log

SHA-256: `f0f3fe8f0d8dfa0d0a7869663c4380500c7245c71b5d0a596258708203cb4bf6`.

```base64
IzAgYnVpbGRpbmcgd2l0aCAiZGVza3RvcC1saW51eCIgaW5zdGFuY2UgdXNpbmcgZG9ja2VyIGRy
aXZlcgoKIzEgW2ludGVybmFsXSBsb2FkIGJ1aWxkIGRlZmluaXRpb24gZnJvbSBEb2NrZXJmaWxl
CiMxIHRyYW5zZmVycmluZyBkb2NrZXJmaWxlOiAxLjU1a0IgZG9uZQojMSBET05FIDAuMHMKCiMy
IFtpbnRlcm5hbF0gbG9hZCBtZXRhZGF0YSBmb3IgZG9ja2VyLmlvL2xpYnJhcnkvbm9kZToyNC4y
MC4wLWFscGluZUBzaGEyNTY6ZTY3NTE0ZTVkMGY2YzQ2NjU2MDA1ZTFiNjkzYjJlYzlkNTJlODBi
NjQxMzA3ZGU2ODRkNGEwMTViYTdhNGVhZgojMiBET05FIDAuMHMKCiMzIFtpbnRlcm5hbF0gbG9h
ZCAuZG9ja2VyaWdub3JlCiMzIHRyYW5zZmVycmluZyBjb250ZXh0OiAyMjNCIGRvbmUKIzMgRE9O
RSAwLjBzCgojNCBbYnVpbGQgMS82XSBGUk9NIGRvY2tlci5pby9saWJyYXJ5L25vZGU6MjQuMjAu
MC1hbHBpbmVAc2hhMjU2OmU2NzUxNGU1ZDBmNmM0NjY1NjAwNWUxYjY5M2IyZWM5ZDUyZTgwYjY0
MTMwN2RlNjg0ZDRhMDE1YmE3YTRlYWYKIzQgcmVzb2x2ZSBkb2NrZXIuaW8vbGlicmFyeS9ub2Rl
OjI0LjIwLjAtYWxwaW5lQHNoYTI1NjplNjc1MTRlNWQwZjZjNDY2NTYwMDVlMWI2OTNiMmVjOWQ1
MmU4MGI2NDEzMDdkZTY4NGQ0YTAxNWJhN2E0ZWFmIGRvbmUKIzQgRE9ORSAwLjBzCgojNSBbYnVp
bGQgMi82XSBXT1JLRElSIC9idWlsZAojNSBDQUNIRUQKCiM2IFtpbnRlcm5hbF0gbG9hZCBidWls
ZCBjb250ZXh0CiM2IHRyYW5zZmVycmluZyBjb250ZXh0OiAyMzguODBrQiBkb25lCiM2IERPTkUg
MC4wcwoKIzcgW2J1aWxkIDMvNl0gQ09QWSBwYWNrYWdlLmpzb24gcGFja2FnZS1sb2NrLmpzb24g
dHNjb25maWcuanNvbiAuLwojNyBET05FIDAuMHMKCiM4IFtidWlsZCA0LzZdIFJVTiBucG0gY2kg
LS1pZ25vcmUtc2NyaXB0cwojOCAxMi43MiAKIzggMTIuNzIgYWRkZWQgMzY3IHBhY2thZ2VzLCBh
bmQgYXVkaXRlZCAzNjggcGFja2FnZXMgaW4gMTJzCiM4IDEyLjcyIAojOCAxMi43MiA3MyBwYWNr
YWdlcyBhcmUgbG9va2luZyBmb3IgZnVuZGluZwojOCAxMi43MiAgIHJ1biBgbnBtIGZ1bmRgIGZv
ciBkZXRhaWxzCiM4IDEyLjcyIAojOCAxMi43MiA0IGxvdyBzZXZlcml0eSB2dWxuZXJhYmlsaXRp
ZXMKIzggMTIuNzIgCiM4IDEyLjcyIFRvIGFkZHJlc3MgYWxsIGlzc3VlcyAoaW5jbHVkaW5nIGJy
ZWFraW5nIGNoYW5nZXMpLCBydW46CiM4IDEyLjcyICAgbnBtIGF1ZGl0IGZpeCAtLWZvcmNlCiM4
IDEyLjcyIAojOCAxMi43MiBSdW4gYG5wbSBhdWRpdGAgZm9yIGRldGFpbHMuCiM4IDEyLjczIG5w
bSBub3RpY2UKIzggMTIuNzMgbnBtIG5vdGljZSBOZXcgbWFqb3IgdmVyc2lvbiBvZiBucG0gYXZh
aWxhYmxlISAxMS4xOS4wIC0+IDEyLjIuMAojOCAxMi43MyBucG0gbm90aWNlIENoYW5nZWxvZzog
aHR0cHM6Ly9naXRodWIuY29tL25wbS9jbGkvcmVsZWFzZXMvdGFnL3YxMi4yLjAKIzggMTIuNzMg
bnBtIG5vdGljZSBUbyB1cGRhdGUgcnVuOiBucG0gaW5zdGFsbCAtZyBucG1AMTIuMi4wCiM4IDEy
LjczIG5wbSBub3RpY2UKIzggRE9ORSAxMy4ycwoKIzkgW2J1aWxkIDUvNl0gQ09QWSBzZXJ2ZXIv
c3JjIC4vc2VydmVyL3NyYwojOSBET05FIDAuMXMKCiMxMCBbYnVpbGQgNi82XSBSVU4gLS1uZXR3
b3JrPW5vbmUgbnBtIHJ1biBidWlsZAojMTAgMC43MzQgCiMxMCAwLjczNCA+IG1wMy1mcmFtZS1j
b3VudGVyQDAuMC4wIGJ1aWxkCiMxMCAwLjczNCA+IHRzYyAtcCB0c2NvbmZpZy5qc29uICYmIG5v
ZGUgc2VydmVyL3NyYy9idWlsZC1kb2NzLm1qcwojMTAgMC43MzQgCiMxMCAyLjI3MSBPZmZsaW5l
IGRvY3VtZW50YXRpb24gYXJ0aWZhY3RzIGdlbmVyYXRlZCBhbmQgdmVyaWZpZWQuCiMxMCBET05F
IDIuM3MKCiMxMSBleHBvcnRpbmcgdG8gaW1hZ2UKIzExIGV4cG9ydGluZyBsYXllcnMKIzExIGV4
cG9ydGluZyBsYXllcnMgMTIuM3MgZG9uZQojMTEgZXhwb3J0aW5nIG1hbmlmZXN0IHNoYTI1Njo0
NDQxM2MzOTIzMjUwNDg3NjM5MmM4ZjFhMDliYjVkMTBiOGFmZGJhYTc1NzVkNjhkYTJmY2I5ZGFl
MWI3MDA0IGRvbmUKIzExIGV4cG9ydGluZyBjb25maWcgc2hhMjU2OjFmM2Y1YmNkOTdlMjEzNDM1
N2NkMGIyZjhlMTRjYTA3NTQzNjNhZjI2NTgzZTdiMGIwNTUyNzQxNjk0MWRiYjYgZG9uZQojMTEg
ZXhwb3J0aW5nIGF0dGVzdGF0aW9uIG1hbmlmZXN0IHNoYTI1Njo3ZWIyNjcwMjNmNDViZDEwYWIx
ZTJjMjlmMjMyMTI0YTlmMmFiY2E0ZDE2NDkwODQwZmI4M2M3Yjg2NjFhOWIwIGRvbmUKIzExIGV4
cG9ydGluZyBtYW5pZmVzdCBsaXN0IHNoYTI1NjphMGVhYmJjNmUxZDdlZWY5NzU4NDkwZjk4YjE3
YmFjODBiN2UyNjViMGNlNWFmNGFkZDkyZDdlMzQ4MzNkNzNiIGRvbmUKIzExIG5hbWluZyB0byBk
b2NrZXIuaW8vbGlicmFyeS9tcDMtZG9jcy1idWlsZGVyOmxvY2FsIGRvbmUKIzExIERPTkUgMTIu
NHMKClZpZXcgYnVpbGQgZGV0YWlsczogZG9ja2VyLWRlc2t0b3A6Ly9kYXNoYm9hcmQvYnVpbGQv
ZGVza3RvcC1saW51eC9kZXNrdG9wLWxpbnV4L3hhc3dydTExZnN1aTljd3IzaHV4M250cDIK
```

## First generated manifest

SHA-256: `f47353d31fc4163deb99e33e9abd31832fafec0380c865296123a3666e722d9a`.

```text
[{"path":"assets/docs.css","bytes":60,"sha256":"2d40e7d5ff1f79f56b47afe32cf2b573236a7cea4b856656e4567d44ab4c671b"},{"path":"assets/init.js","bytes":652,"sha256":"b8a885f675ca8ddbf075ac2307178c3dd12263968e4385adcc0828c449a13108"},{"path":"assets/redoc-logo-mini.svg","bytes":539,"sha256":"1dab4315f8de2177b2b2726b29e84a26314c69cd27d692228947c0058793d5a7"},{"path":"assets/redoc.js","bytes":1103418,"sha256":"21ce5beb19818927f12e2db16e1a332e4f0eac5b8538012b6ecd048585b8cdbf"},{"path":"index.html","bytes":580,"sha256":"5ecdeb2e9a610525488f00a45519f615dbceb0500e960970785d07f449fd6086"},{"path":"openapi.yaml","bytes":12302,"sha256":"a87daf46129f3e2a3c8affa1770d23f7fcc537be39d6900b5a999c56f6e7d46b"},{"path":"retained/generation.json","bytes":1959,"sha256":"68144208e1accb35c48ef00c5aa5993d472316b9b78092c6ac302b2116ec5a7f"},{"path":"retained/LICENSE","bytes":1091,"sha256":"d3026d549cf68ab7355bcfa85877bf8f845b3334a7efbfdc63936432fb34ff0e"},{"path":"retained/provenance.json","bytes":1828,"sha256":"50acd79ede11d9bfa4707df54368d3c98a0837eb6ecba06888d19a8e4442b72f"},{"path":"retained/redoc-package.json","bytes":7021,"sha256":"5293785435dcdc6b39273fbddf492abfa59cc3be2682ad93a357c30307605f0d"},{"path":"retained/redoc.standalone.js","bytes":1103471,"sha256":"dcaf76612bc4a3fbcc923a8966dee2f6146a5f32e5ce1b6f02dd60cbbf89500b"},{"path":"retained/redoc.standalone.js.LICENSE.txt","bytes":2729,"sha256":"eed602ec32e00b2b9df1984fbcc26a687b1b3193ec01961389c4b8439e6edf73"},{"path":"retained/redoc.standalone.js.map","bytes":3906825,"sha256":"2550d1c2e62c0640b2b4f4f49843433840fc291e001f3edb15ff66470e551476"}]
```

## Second generated manifest

SHA-256: `f47353d31fc4163deb99e33e9abd31832fafec0380c865296123a3666e722d9a`.

```text
[{"path":"assets/docs.css","bytes":60,"sha256":"2d40e7d5ff1f79f56b47afe32cf2b573236a7cea4b856656e4567d44ab4c671b"},{"path":"assets/init.js","bytes":652,"sha256":"b8a885f675ca8ddbf075ac2307178c3dd12263968e4385adcc0828c449a13108"},{"path":"assets/redoc-logo-mini.svg","bytes":539,"sha256":"1dab4315f8de2177b2b2726b29e84a26314c69cd27d692228947c0058793d5a7"},{"path":"assets/redoc.js","bytes":1103418,"sha256":"21ce5beb19818927f12e2db16e1a332e4f0eac5b8538012b6ecd048585b8cdbf"},{"path":"index.html","bytes":580,"sha256":"5ecdeb2e9a610525488f00a45519f615dbceb0500e960970785d07f449fd6086"},{"path":"openapi.yaml","bytes":12302,"sha256":"a87daf46129f3e2a3c8affa1770d23f7fcc537be39d6900b5a999c56f6e7d46b"},{"path":"retained/generation.json","bytes":1959,"sha256":"68144208e1accb35c48ef00c5aa5993d472316b9b78092c6ac302b2116ec5a7f"},{"path":"retained/LICENSE","bytes":1091,"sha256":"d3026d549cf68ab7355bcfa85877bf8f845b3334a7efbfdc63936432fb34ff0e"},{"path":"retained/provenance.json","bytes":1828,"sha256":"50acd79ede11d9bfa4707df54368d3c98a0837eb6ecba06888d19a8e4442b72f"},{"path":"retained/redoc-package.json","bytes":7021,"sha256":"5293785435dcdc6b39273fbddf492abfa59cc3be2682ad93a357c30307605f0d"},{"path":"retained/redoc.standalone.js","bytes":1103471,"sha256":"dcaf76612bc4a3fbcc923a8966dee2f6146a5f32e5ce1b6f02dd60cbbf89500b"},{"path":"retained/redoc.standalone.js.LICENSE.txt","bytes":2729,"sha256":"eed602ec32e00b2b9df1984fbcc26a687b1b3193ec01961389c4b8439e6edf73"},{"path":"retained/redoc.standalone.js.map","bytes":3906825,"sha256":"2550d1c2e62c0640b2b4f4f49843433840fc291e001f3edb15ff66470e551476"}]
```

## Second generation log

SHA-256: `7e3d99cc3ec01014f1d7bc8a116af697ad91ec41041c70b8d8590902cff5c123`.

```text
WARNING: The requested image's platform (linux/amd64) does not match the detected host platform (linux/arm64/v8) and no specific platform was requested

> mp3-frame-counter@0.0.0 build
> tsc -p tsconfig.json && node server/src/build-docs.mjs

Offline documentation artifacts generated and verified.
```

## Runtime image build log

SHA-256: `4cc50eac41d6dc6715ff1175a22f4cfda2758d6b0654d9c927102eedc2ef17d8`.

```base64
IzAgYnVpbGRpbmcgd2l0aCAiZGVza3RvcC1saW51eCIgaW5zdGFuY2UgdXNpbmcgZG9ja2VyIGRy
aXZlcgoKIzEgW2ludGVybmFsXSBsb2FkIGJ1aWxkIGRlZmluaXRpb24gZnJvbSBEb2NrZXJmaWxl
CiMxIHRyYW5zZmVycmluZyBkb2NrZXJmaWxlOiAxLjU1a0IgZG9uZQojMSBET05FIDAuMHMKCiMy
IFtpbnRlcm5hbF0gbG9hZCBtZXRhZGF0YSBmb3IgZG9ja2VyLmlvL2xpYnJhcnkvbm9kZToyNC4y
MC4wLWFscGluZUBzaGEyNTY6ZTY3NTE0ZTVkMGY2YzQ2NjU2MDA1ZTFiNjkzYjJlYzlkNTJlODBi
NjQxMzA3ZGU2ODRkNGEwMTViYTdhNGVhZgojMiBET05FIDAuMHMKCiMzIFtpbnRlcm5hbF0gbG9h
ZCAuZG9ja2VyaWdub3JlCiMzIHRyYW5zZmVycmluZyBjb250ZXh0OiAyMjNCIGRvbmUKIzMgRE9O
RSAwLjBzCgojNCBbaW50ZXJuYWxdIGxvYWQgYnVpbGQgY29udGV4dAojNCB0cmFuc2ZlcnJpbmcg
Y29udGV4dDogNzIwQiBkb25lCiM0IERPTkUgMC4wcwoKIzUgW3Byb2R1Y3Rpb24tZGVwZW5kZW5j
aWVzIDEvNF0gRlJPTSBkb2NrZXIuaW8vbGlicmFyeS9ub2RlOjI0LjIwLjAtYWxwaW5lQHNoYTI1
NjplNjc1MTRlNWQwZjZjNDY2NTYwMDVlMWI2OTNiMmVjOWQ1MmU4MGI2NDEzMDdkZTY4NGQ0YTAx
NWJhN2E0ZWFmCiM1IHJlc29sdmUgZG9ja2VyLmlvL2xpYnJhcnkvbm9kZToyNC4yMC4wLWFscGlu
ZUBzaGEyNTY6ZTY3NTE0ZTVkMGY2YzQ2NjU2MDA1ZTFiNjkzYjJlYzlkNTJlODBiNjQxMzA3ZGU2
ODRkNGEwMTViYTdhNGVhZiAwLjBzIGRvbmUKIzUgRE9ORSAwLjBzCgojNiBbYnVpbGQgNS82XSBD
T1BZIHNlcnZlci9zcmMgLi9zZXJ2ZXIvc3JjCiM2IENBQ0hFRAoKIzcgW2J1aWxkIDMvNl0gQ09Q
WSBwYWNrYWdlLmpzb24gcGFja2FnZS1sb2NrLmpzb24gdHNjb25maWcuanNvbiAuLwojNyBDQUNI
RUQKCiM4IFtidWlsZCA0LzZdIFJVTiBucG0gY2kgLS1pZ25vcmUtc2NyaXB0cwojOCBDQUNIRUQK
CiM5IFtidWlsZCAyLzZdIFdPUktESVIgL2J1aWxkCiM5IENBQ0hFRAoKIzEwIFtwcm9kdWN0aW9u
LWRlcGVuZGVuY2llcyAyLzRdIFdPUktESVIgL3Byb2R1Y3Rpb24KIzEwIENBQ0hFRAoKIzExIFti
dWlsZCA2LzZdIFJVTiAtLW5ldHdvcms9bm9uZSBucG0gcnVuIGJ1aWxkCiMxMSBDQUNIRUQKCiMx
MiBbcHJvZHVjdGlvbi1kZXBlbmRlbmNpZXMgMy80XSBDT1BZIHBhY2thZ2UuanNvbiBwYWNrYWdl
LWxvY2suanNvbiAuLwojMTIgRE9ORSAwLjBzCgojMTMgW3Byb2R1Y3Rpb24tZGVwZW5kZW5jaWVz
IDQvNF0gUlVOIG5wbSBjaSAtLW9taXQ9ZGV2IC0taWdub3JlLXNjcmlwdHMKIzEzIC4uLgoKIzE0
IFtydW50aW1lIDIvNl0gV09SS0RJUiAvYXBwCiMxNCBDQUNIRUQKCiMxNSBbcnVudGltZSAzLzZd
IFJVTiBybSAtcmYgL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzIC9vcHQveWFybi0qIC91c3Iv
bG9jYWwvYmluL25wbSAvdXNyL2xvY2FsL2Jpbi9ucHggICAgIC91c3IvbG9jYWwvYmluL3lhcm4g
L3Vzci9sb2NhbC9iaW4veWFybnBrZwojMTUgQ0FDSEVECgojMTYgW3J1bnRpbWUgNC82XSBDT1BZ
IC0tZnJvbT1idWlsZCAtLWNob3duPW5vZGU6bm9kZSAvYnVpbGQvZGlzdCAuL2Rpc3QKIzE2IERP
TkUgMC4wcwoKIzEzIFtwcm9kdWN0aW9uLWRlcGVuZGVuY2llcyA0LzRdIFJVTiBucG0gY2kgLS1v
bWl0PWRldiAtLWlnbm9yZS1zY3JpcHRzCiMxMyAyLjk3MyAKIzEzIDIuOTczIGFkZGVkIDQ4IHBh
Y2thZ2VzLCBhbmQgYXVkaXRlZCA0OSBwYWNrYWdlcyBpbiAycwojMTMgMi45NzMgCiMxMyAyLjk3
NCAxOSBwYWNrYWdlcyBhcmUgbG9va2luZyBmb3IgZnVuZGluZwojMTMgMi45NzQgICBydW4gYG5w
bSBmdW5kYCBmb3IgZGV0YWlscwojMTMgMi45NzUgCiMxMyAyLjk3NSBmb3VuZCAwIHZ1bG5lcmFi
aWxpdGllcwojMTMgMi45NzkgbnBtIG5vdGljZQojMTMgMi45NzkgbnBtIG5vdGljZSBOZXcgbWFq
b3IgdmVyc2lvbiBvZiBucG0gYXZhaWxhYmxlISAxMS4xOS4wIC0+IDEyLjIuMAojMTMgMi45Nzkg
bnBtIG5vdGljZSBDaGFuZ2Vsb2c6IGh0dHBzOi8vZ2l0aHViLmNvbS9ucG0vY2xpL3JlbGVhc2Vz
L3RhZy92MTIuMi4wCiMxMyAyLjk3OSBucG0gbm90aWNlIFRvIHVwZGF0ZSBydW46IG5wbSBpbnN0
YWxsIC1nIG5wbUAxMi4yLjAKIzEzIDIuOTc5IG5wbSBub3RpY2UKIzEzIERPTkUgMy4xcwoKIzE3
IFtydW50aW1lIDUvNl0gQ09QWSAtLWZyb209cHJvZHVjdGlvbi1kZXBlbmRlbmNpZXMgLS1jaG93
bj1ub2RlOm5vZGUgL3Byb2R1Y3Rpb24vbm9kZV9tb2R1bGVzIC4vbm9kZV9tb2R1bGVzCiMxNyBE
T05FIDAuMnMKCiMxOCBbcnVudGltZSA2LzZdIENPUFkgLS1jaG93bj1ub2RlOm5vZGUgcGFja2Fn
ZS5qc29uIC4vcGFja2FnZS5qc29uCiMxOCBET05FIDAuMHMKCiMxOSBleHBvcnRpbmcgdG8gaW1h
Z2UKIzE5IGV4cG9ydGluZyBsYXllcnMKIzE5IGV4cG9ydGluZyBsYXllcnMgMC4ycyBkb25lCiMx
OSBleHBvcnRpbmcgbWFuaWZlc3Qgc2hhMjU2OmI5Mzg3ZWZiM2ExOGFjNzEyZDE3ZWIyMmE3MmZl
YzI3NGVjZjBiMjBlZGY0YjIyMWU4NzhjMjk2MGQ4OTE2YjMgZG9uZQojMTkgZXhwb3J0aW5nIGNv
bmZpZyBzaGEyNTY6YjUyMTVkNjIxMWYyYjdlNjBkMGE5MDdjZmM3ZTVkZjRlMDQzMDUzNjI5MjFj
MGRiNjU2NTM1Y2U4MmNjM2FiYiBkb25lCiMxOSBleHBvcnRpbmcgYXR0ZXN0YXRpb24gbWFuaWZl
c3Qgc2hhMjU2OmM3MzY5ZjMyNDdjMTQwNGVjMzM4ODM4NDdlZjJkZTQzN2U3MjQ1MmQ4ZTNkMTg3
ODNhM2ZlNDA5ZTk2NDJhZDYgZG9uZQojMTkgZXhwb3J0aW5nIG1hbmlmZXN0IGxpc3Qgc2hhMjU2
OmIzYzcyNmJkZDI3NWM0MWVhM2IxY2NhMjYzNTI4MDNkYjQxYjkyZTVjYTBjMDAwMWFmZjZhZDMx
YTI1ZWE4ZDggZG9uZQojMTkgbmFtaW5nIHRvIGRvY2tlci5pby9saWJyYXJ5L21wMy1kb2NzLWFw
aTpsb2NhbCBkb25lCiMxOSBET05FIDAuM3MKClZpZXcgYnVpbGQgZGV0YWlsczogZG9ja2VyLWRl
c2t0b3A6Ly9kYXNoYm9hcmQvYnVpbGQvZGVza3RvcC1saW51eC9kZXNrdG9wLWxpbnV4L2R2aHd3
aXZpZTZ0ZmU5bGlrNXcwcHR0YWEK
```

## Original runtime inspection

SHA-256: `38ecfbb52229209b4daf9c330c8ebaacca7fe6e0740dc0a99e63eae7723b2c72`.

```text
{"uid":1000,"fastify":"5.12.5","files":[{"path":"assets/docs.css","bytes":60,"sha256":"2d40e7d5ff1f79f56b47afe32cf2b573236a7cea4b856656e4567d44ab4c671b"},{"path":"assets/init.js","bytes":652,"sha256":"b8a885f675ca8ddbf075ac2307178c3dd12263968e4385adcc0828c449a13108"},{"path":"assets/redoc-logo-mini.svg","bytes":539,"sha256":"1dab4315f8de2177b2b2726b29e84a26314c69cd27d692228947c0058793d5a7"},{"path":"assets/redoc.js","bytes":1103418,"sha256":"21ce5beb19818927f12e2db16e1a332e4f0eac5b8538012b6ecd048585b8cdbf"},{"path":"index.html","bytes":580,"sha256":"5ecdeb2e9a610525488f00a45519f615dbceb0500e960970785d07f449fd6086"},{"path":"openapi.yaml","bytes":12302,"sha256":"a87daf46129f3e2a3c8affa1770d23f7fcc537be39d6900b5a999c56f6e7d46b"},{"path":"retained/generation.json","bytes":1959,"sha256":"68144208e1accb35c48ef00c5aa5993d472316b9b78092c6ac302b2116ec5a7f"},{"path":"retained/LICENSE","bytes":1091,"sha256":"d3026d549cf68ab7355bcfa85877bf8f845b3334a7efbfdc63936432fb34ff0e"},{"path":"retained/provenance.json","bytes":1828,"sha256":"50acd79ede11d9bfa4707df54368d3c98a0837eb6ecba06888d19a8e4442b72f"},{"path":"retained/redoc-package.json","bytes":7021,"sha256":"5293785435dcdc6b39273fbddf492abfa59cc3be2682ad93a357c30307605f0d"},{"path":"retained/redoc.standalone.js","bytes":1103471,"sha256":"dcaf76612bc4a3fbcc923a8966dee2f6146a5f32e5ce1b6f02dd60cbbf89500b"},{"path":"retained/redoc.standalone.js.LICENSE.txt","bytes":2729,"sha256":"eed602ec32e00b2b9df1984fbcc26a687b1b3193ec01961389c4b8439e6edf73"},{"path":"retained/redoc.standalone.js.map","bytes":3906825,"sha256":"2550d1c2e62c0640b2b4f4f49843433840fc291e001f3edb15ff66470e551476"}],"excluded":["redoc","typescript","source","tests","npm"]}
```

## Original runtime identity

SHA-256: `817065788dc390e056ea61e2529f5c99698d45288d0b8bc2edec1cde03464bae`.

```text
{
  "id": "sha256:b3c726bdd275c41ea3b1cca26352803db41b92e5ca0c0001aff6ad31a25ea8d8",
  "architecture": "amd64",
  "os": "linux",
  "user": "node"
}
```

## Retained builder source binding

SHA-256: `4ee31b3c11ef3c0296c2314ad8728467cb5449bc701578a70dcfd7755cac4fa7`.

```text
{
  "schemaVersion": 1,
  "kind": "local-build-input-readback",
  "sourceRevision": "46695d25ad38f919c66b9b0b750e2f3fb1d4c0d5",
  "comparisonHead": "a8aa5e4c03960e6233ac67a9802f97195e53d196",
  "observedAt": "2026-10-10T18:41:17Z",
  "images": [
    {
      "id": "sha256:a0eabbc6e1d7eef9758490f98b17bac80b7e265b0ce5af4add92d7e34833d73b",
      "os": "linux",
      "architecture": "amd64",
      "user": ""
    },
    {
      "id": "sha256:b3c726bdd275c41ea3b1cca26352803db41b92e5ca0c0001aff6ad31a25ea8d8",
      "os": "linux",
      "architecture": "amd64",
      "user": "node"
    }
  ],
  "command": [
    "docker",
    "run",
    "--rm",
    "--platform",
    "linux/amd64",
    "--network",
    "none",
    "--read-only",
    "--entrypoint",
    "node",
    "sha256:a0eabbc6e1d7eef9758490f98b17bac80b7e265b0ce5af4add92d7e34833d73b",
    "-e",
    "const fs=require('node:fs'),c=require('node:crypto'),p=JSON.parse(process.argv[1]);console.log(JSON.stringify(p.map(x=>({path:x.path,sha256:c.createHash('sha256').update(fs.readFileSync('/build/'+x.path)).digest('hex')}))));",
    "[{\"path\":\"server/src/build-docs.mjs\",\"sha256\":\"84b98549be54ac065beb3e2ba8f98e794568654f8418317a8f35b705ac69a764\"},{\"path\":\"server/src/docs.ts\",\"sha256\":\"790bf5f1a7b19b6fbfc02bcacaa0e3852b9cde70f92aad53295864a1cb5b30c4\"},{\"path\":\"server/src/docs/docs.css\",\"sha256\":\"2d40e7d5ff1f79f56b47afe32cf2b573236a7cea4b856656e4567d44ab4c671b\"},{\"path\":\"server/src/docs/index.html\",\"sha256\":\"5ecdeb2e9a610525488f00a45519f615dbceb0500e960970785d07f449fd6086\"},{\"path\":\"server/src/docs/init.js\",\"sha256\":\"b8a885f675ca8ddbf075ac2307178c3dd12263968e4385adcc0828c449a13108\"},{\"path\":\"server/src/docs/openapi.json\",\"sha256\":\"214fd528ac201db5ae67ae6bee41de05eed1008610439284fb8ebe7d0a6f6dec\"},{\"path\":\"server/src/docs/provenance.json\",\"sha256\":\"50acd79ede11d9bfa4707df54368d3c98a0837eb6ecba06888d19a8e4442b72f\"},{\"path\":\"server/src/docs/redoc-logo-mini.svg\",\"sha256\":\"1dab4315f8de2177b2b2726b29e84a26314c69cd27d692228947c0058793d5a7\"},{\"path\":\"server/src/errors.ts\",\"sha256\":\"3d0f27e2e3df5b81fbb73ee2f7c24ea9dd333ac4e55c01be37de921d2c22172d\"},{\"path\":\"server/src/http.ts\",\"sha256\":\"f1c5c748c6aacfc1428452ecced795d307be3e63e29ac739b2506f95c76436eb\"},{\"path\":\"server/src/index.ts\",\"sha256\":\"1a9617f0f72a8390bb8f94b29d8bedf81bba7455f2883dd30717485a72dd4d50\"},{\"path\":\"server/src/mp3.ts\",\"sha256\":\"186db29c210f244495154fbd69388395fd05a67fe33971fdc9107b9660e4f741\"},{\"path\":\"package.json\",\"sha256\":\"36faa7eb900fef97787da0281a9788932e5978299197b4a9fc508ef038eaed08\"},{\"path\":\"package-lock.json\",\"sha256\":\"a08315fb07a1d984844d60cdd43f72240f838a964b285da777ee12a1d2b21a31\"},{\"path\":\"tsconfig.json\",\"sha256\":\"29312a4b064e97f03bb38537eecef096187989212a6bc0429905ad1792ad3d20\"}]"
  ],
  "expectedFromGit": [
    {
      "path": "server/src/build-docs.mjs",
      "sha256": "84b98549be54ac065beb3e2ba8f98e794568654f8418317a8f35b705ac69a764"
    },
    {
      "path": "server/src/docs.ts",
      "sha256": "790bf5f1a7b19b6fbfc02bcacaa0e3852b9cde70f92aad53295864a1cb5b30c4"
    },
    {
      "path": "server/src/docs/docs.css",
      "sha256": "2d40e7d5ff1f79f56b47afe32cf2b573236a7cea4b856656e4567d44ab4c671b"
    },
    {
      "path": "server/src/docs/index.html",
      "sha256": "5ecdeb2e9a610525488f00a45519f615dbceb0500e960970785d07f449fd6086"
    },
    {
      "path": "server/src/docs/init.js",
      "sha256": "b8a885f675ca8ddbf075ac2307178c3dd12263968e4385adcc0828c449a13108"
    },
    {
      "path": "server/src/docs/openapi.json",
      "sha256": "214fd528ac201db5ae67ae6bee41de05eed1008610439284fb8ebe7d0a6f6dec"
    },
    {
      "path": "server/src/docs/provenance.json",
      "sha256": "50acd79ede11d9bfa4707df54368d3c98a0837eb6ecba06888d19a8e4442b72f"
    },
    {
      "path": "server/src/docs/redoc-logo-mini.svg",
      "sha256": "1dab4315f8de2177b2b2726b29e84a26314c69cd27d692228947c0058793d5a7"
    },
    {
      "path": "server/src/errors.ts",
      "sha256": "3d0f27e2e3df5b81fbb73ee2f7c24ea9dd333ac4e55c01be37de921d2c22172d"
    },
    {
      "path": "server/src/http.ts",
      "sha256": "f1c5c748c6aacfc1428452ecced795d307be3e63e29ac739b2506f95c76436eb"
    },
    {
      "path": "server/src/index.ts",
      "sha256": "1a9617f0f72a8390bb8f94b29d8bedf81bba7455f2883dd30717485a72dd4d50"
    },
    {
      "path": "server/src/mp3.ts",
      "sha256": "186db29c210f244495154fbd69388395fd05a67fe33971fdc9107b9660e4f741"
    },
    {
      "path": "package.json",
      "sha256": "36faa7eb900fef97787da0281a9788932e5978299197b4a9fc508ef038eaed08"
    },
    {
      "path": "package-lock.json",
      "sha256": "a08315fb07a1d984844d60cdd43f72240f838a964b285da777ee12a1d2b21a31"
    },
    {
      "path": "tsconfig.json",
      "sha256": "29312a4b064e97f03bb38537eecef096187989212a6bc0429905ad1792ad3d20"
    }
  ],
  "observedInBuilder": [
    {
      "path": "server/src/build-docs.mjs",
      "sha256": "84b98549be54ac065beb3e2ba8f98e794568654f8418317a8f35b705ac69a764"
    },
    {
      "path": "server/src/docs.ts",
      "sha256": "790bf5f1a7b19b6fbfc02bcacaa0e3852b9cde70f92aad53295864a1cb5b30c4"
    },
    {
      "path": "server/src/docs/docs.css",
      "sha256": "2d40e7d5ff1f79f56b47afe32cf2b573236a7cea4b856656e4567d44ab4c671b"
    },
    {
      "path": "server/src/docs/index.html",
      "sha256": "5ecdeb2e9a610525488f00a45519f615dbceb0500e960970785d07f449fd6086"
    },
    {
      "path": "server/src/docs/init.js",
      "sha256": "b8a885f675ca8ddbf075ac2307178c3dd12263968e4385adcc0828c449a13108"
    },
    {
      "path": "server/src/docs/openapi.json",
      "sha256": "214fd528ac201db5ae67ae6bee41de05eed1008610439284fb8ebe7d0a6f6dec"
    },
    {
      "path": "server/src/docs/provenance.json",
      "sha256": "50acd79ede11d9bfa4707df54368d3c98a0837eb6ecba06888d19a8e4442b72f"
    },
    {
      "path": "server/src/docs/redoc-logo-mini.svg",
      "sha256": "1dab4315f8de2177b2b2726b29e84a26314c69cd27d692228947c0058793d5a7"
    },
    {
      "path": "server/src/errors.ts",
      "sha256": "3d0f27e2e3df5b81fbb73ee2f7c24ea9dd333ac4e55c01be37de921d2c22172d"
    },
    {
      "path": "server/src/http.ts",
      "sha256": "f1c5c748c6aacfc1428452ecced795d307be3e63e29ac739b2506f95c76436eb"
    },
    {
      "path": "server/src/index.ts",
      "sha256": "1a9617f0f72a8390bb8f94b29d8bedf81bba7455f2883dd30717485a72dd4d50"
    },
    {
      "path": "server/src/mp3.ts",
      "sha256": "186db29c210f244495154fbd69388395fd05a67fe33971fdc9107b9660e4f741"
    },
    {
      "path": "package.json",
      "sha256": "36faa7eb900fef97787da0281a9788932e5978299197b4a9fc508ef038eaed08"
    },
    {
      "path": "package-lock.json",
      "sha256": "a08315fb07a1d984844d60cdd43f72240f838a964b285da777ee12a1d2b21a31"
    },
    {
      "path": "tsconfig.json",
      "sha256": "29312a4b064e97f03bb38537eecef096187989212a6bc0429905ad1792ad3d20"
    }
  ],
  "comparisonHeadInputsEqual": true,
  "limits": [
    "Readback observes retained local images; it is not CI or publication authority.",
    "Dockerfile and Docker ignore bytes are source inputs, not copied files inside the builder.",
    "Runtime generation may reuse the previously isolated builder layer; only the calibration and original builder generation claim fresh execution."
  ]
}
```

## Fresh isolated generation readback

SHA-256: `56766789c87e1baa285eb0bdfbff5340bc3d5ff88d95ba8cbf8facd1d1829283`.

```text
{
  "kind": "fresh-isolated-generation-readback",
  "imageId": "sha256:a0eabbc6e1d7eef9758490f98b17bac80b7e265b0ce5af4add92d7e34833d73b",
  "sourceInputReadbackSha256": "4ee31b3c11ef3c0296c2314ad8728467cb5449bc701578a70dcfd7755cac4fa7",
  "command": [
    "docker",
    "run",
    "--rm",
    "--platform",
    "linux/amd64",
    "--network",
    "none",
    "--entrypoint",
    "sh",
    "sha256:a0eabbc6e1d7eef9758490f98b17bac80b7e265b0ce5af4add92d7e34833d73b",
    "-ec",
    "npm run build >&2\nnode -e \"$1\"",
    "sh",
    "const fs=require('node:fs'),c=require('node:crypto'),path=require('node:path');function walk(dir,prefix=''){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name),prefix+e.name+'/'):[prefix+e.name]);}console.log(JSON.stringify(walk('/build/dist/docs').sort().map(p=>{const b=fs.readFileSync('/build/dist/docs/'+p);return {path:p,bytes:b.length,sha256:c.createHash('sha256').update(b).digest('hex')}})));"
  ],
  "exitCode": 0,
  "stderr": "\n> mp3-frame-counter@0.0.0 build\n> tsc -p tsconfig.json && node server/src/build-docs.mjs\n\nOffline documentation artifacts generated and verified.\n",
  "manifest": [
    {
      "path": "assets/docs.css",
      "bytes": 60,
      "sha256": "2d40e7d5ff1f79f56b47afe32cf2b573236a7cea4b856656e4567d44ab4c671b"
    },
    {
      "path": "assets/init.js",
      "bytes": 652,
      "sha256": "b8a885f675ca8ddbf075ac2307178c3dd12263968e4385adcc0828c449a13108"
    },
    {
      "path": "assets/redoc-logo-mini.svg",
      "bytes": 539,
      "sha256": "1dab4315f8de2177b2b2726b29e84a26314c69cd27d692228947c0058793d5a7"
    },
    {
      "path": "assets/redoc.js",
      "bytes": 1103418,
      "sha256": "21ce5beb19818927f12e2db16e1a332e4f0eac5b8538012b6ecd048585b8cdbf"
    },
    {
      "path": "index.html",
      "bytes": 580,
      "sha256": "5ecdeb2e9a610525488f00a45519f615dbceb0500e960970785d07f449fd6086"
    },
    {
      "path": "openapi.yaml",
      "bytes": 12302,
      "sha256": "a87daf46129f3e2a3c8affa1770d23f7fcc537be39d6900b5a999c56f6e7d46b"
    },
    {
      "path": "retained/LICENSE",
      "bytes": 1091,
      "sha256": "d3026d549cf68ab7355bcfa85877bf8f845b3334a7efbfdc63936432fb34ff0e"
    },
    {
      "path": "retained/generation.json",
      "bytes": 1959,
      "sha256": "68144208e1accb35c48ef00c5aa5993d472316b9b78092c6ac302b2116ec5a7f"
    },
    {
      "path": "retained/provenance.json",
      "bytes": 1828,
      "sha256": "50acd79ede11d9bfa4707df54368d3c98a0837eb6ecba06888d19a8e4442b72f"
    },
    {
      "path": "retained/redoc-package.json",
      "bytes": 7021,
      "sha256": "5293785435dcdc6b39273fbddf492abfa59cc3be2682ad93a357c30307605f0d"
    },
    {
      "path": "retained/redoc.standalone.js",
      "bytes": 1103471,
      "sha256": "dcaf76612bc4a3fbcc923a8966dee2f6146a5f32e5ce1b6f02dd60cbbf89500b"
    },
    {
      "path": "retained/redoc.standalone.js.LICENSE.txt",
      "bytes": 2729,
      "sha256": "eed602ec32e00b2b9df1984fbcc26a687b1b3193ec01961389c4b8439e6edf73"
    },
    {
      "path": "retained/redoc.standalone.js.map",
      "bytes": 3906825,
      "sha256": "2550d1c2e62c0640b2b4f4f49843433840fc291e001f3edb15ff66470e551476"
    }
  ],
  "matchesOriginalManifestsByPath": true,
  "freshContainer": true,
  "network": "none",
  "rebuildsImage": false
}
```

## Runtime readback

SHA-256: `86e2b6c2e0fb33f8e2f38e9daf9801eab23dc1ae3584ce53293b36563fea3927`.

```text
{
  "kind": "runtime-image-readback",
  "imageId": "sha256:b3c726bdd275c41ea3b1cca26352803db41b92e5ca0c0001aff6ad31a25ea8d8",
  "command": [
    "docker",
    "run",
    "--rm",
    "--platform",
    "linux/amd64",
    "--network",
    "none",
    "--read-only",
    "--entrypoint",
    "node",
    "sha256:b3c726bdd275c41ea3b1cca26352803db41b92e5ca0c0001aff6ad31a25ea8d8",
    "-e",
    "const fs=require('node:fs'),c=require('node:crypto'),assert=require('node:assert/strict'),a=JSON.parse(process.argv[1]);const files=a.map(x=>{const b=fs.readFileSync('/app/dist/docs/'+x.path);return {path:x.path,bytes:b.length,sha256:c.createHash('sha256').update(b).digest('hex')}});const missing={redoc:'/app/node_modules/redoc',typescript:'/app/node_modules/typescript',source:'/app/server/src',tests:'/app/tests',npm:'/usr/local/bin/npm'};for(const p of Object.values(missing))assert.equal(fs.existsSync(p),false);const out={uid:process.getuid(),fastify:JSON.parse(fs.readFileSync('/app/node_modules/fastify/package.json')).version,files,excluded:Object.keys(missing)};console.log(JSON.stringify(out));",
    "[{\"path\":\"assets/docs.css\",\"bytes\":60,\"sha256\":\"2d40e7d5ff1f79f56b47afe32cf2b573236a7cea4b856656e4567d44ab4c671b\"},{\"path\":\"assets/init.js\",\"bytes\":652,\"sha256\":\"b8a885f675ca8ddbf075ac2307178c3dd12263968e4385adcc0828c449a13108\"},{\"path\":\"assets/redoc-logo-mini.svg\",\"bytes\":539,\"sha256\":\"1dab4315f8de2177b2b2726b29e84a26314c69cd27d692228947c0058793d5a7\"},{\"path\":\"assets/redoc.js\",\"bytes\":1103418,\"sha256\":\"21ce5beb19818927f12e2db16e1a332e4f0eac5b8538012b6ecd048585b8cdbf\"},{\"path\":\"index.html\",\"bytes\":580,\"sha256\":\"5ecdeb2e9a610525488f00a45519f615dbceb0500e960970785d07f449fd6086\"},{\"path\":\"openapi.yaml\",\"bytes\":12302,\"sha256\":\"a87daf46129f3e2a3c8affa1770d23f7fcc537be39d6900b5a999c56f6e7d46b\"},{\"path\":\"retained/generation.json\",\"bytes\":1959,\"sha256\":\"68144208e1accb35c48ef00c5aa5993d472316b9b78092c6ac302b2116ec5a7f\"},{\"path\":\"retained/LICENSE\",\"bytes\":1091,\"sha256\":\"d3026d549cf68ab7355bcfa85877bf8f845b3334a7efbfdc63936432fb34ff0e\"},{\"path\":\"retained/provenance.json\",\"bytes\":1828,\"sha256\":\"50acd79ede11d9bfa4707df54368d3c98a0837eb6ecba06888d19a8e4442b72f\"},{\"path\":\"retained/redoc-package.json\",\"bytes\":7021,\"sha256\":\"5293785435dcdc6b39273fbddf492abfa59cc3be2682ad93a357c30307605f0d\"},{\"path\":\"retained/redoc.standalone.js\",\"bytes\":1103471,\"sha256\":\"dcaf76612bc4a3fbcc923a8966dee2f6146a5f32e5ce1b6f02dd60cbbf89500b\"},{\"path\":\"retained/redoc.standalone.js.LICENSE.txt\",\"bytes\":2729,\"sha256\":\"eed602ec32e00b2b9df1984fbcc26a687b1b3193ec01961389c4b8439e6edf73\"},{\"path\":\"retained/redoc.standalone.js.map\",\"bytes\":3906825,\"sha256\":\"2550d1c2e62c0640b2b4f4f49843433840fc291e001f3edb15ff66470e551476\"}]"
  ],
  "observed": {
    "uid": 1000,
    "fastify": "5.12.5",
    "files": [
      {
        "path": "assets/docs.css",
        "bytes": 60,
        "sha256": "2d40e7d5ff1f79f56b47afe32cf2b573236a7cea4b856656e4567d44ab4c671b"
      },
      {
        "path": "assets/init.js",
        "bytes": 652,
        "sha256": "b8a885f675ca8ddbf075ac2307178c3dd12263968e4385adcc0828c449a13108"
      },
      {
        "path": "assets/redoc-logo-mini.svg",
        "bytes": 539,
        "sha256": "1dab4315f8de2177b2b2726b29e84a26314c69cd27d692228947c0058793d5a7"
      },
      {
        "path": "assets/redoc.js",
        "bytes": 1103418,
        "sha256": "21ce5beb19818927f12e2db16e1a332e4f0eac5b8538012b6ecd048585b8cdbf"
      },
      {
        "path": "index.html",
        "bytes": 580,
        "sha256": "5ecdeb2e9a610525488f00a45519f615dbceb0500e960970785d07f449fd6086"
      },
      {
        "path": "openapi.yaml",
        "bytes": 12302,
        "sha256": "a87daf46129f3e2a3c8affa1770d23f7fcc537be39d6900b5a999c56f6e7d46b"
      },
      {
        "path": "retained/generation.json",
        "bytes": 1959,
        "sha256": "68144208e1accb35c48ef00c5aa5993d472316b9b78092c6ac302b2116ec5a7f"
      },
      {
        "path": "retained/LICENSE",
        "bytes": 1091,
        "sha256": "d3026d549cf68ab7355bcfa85877bf8f845b3334a7efbfdc63936432fb34ff0e"
      },
      {
        "path": "retained/provenance.json",
        "bytes": 1828,
        "sha256": "50acd79ede11d9bfa4707df54368d3c98a0837eb6ecba06888d19a8e4442b72f"
      },
      {
        "path": "retained/redoc-package.json",
        "bytes": 7021,
        "sha256": "5293785435dcdc6b39273fbddf492abfa59cc3be2682ad93a357c30307605f0d"
      },
      {
        "path": "retained/redoc.standalone.js",
        "bytes": 1103471,
        "sha256": "dcaf76612bc4a3fbcc923a8966dee2f6146a5f32e5ce1b6f02dd60cbbf89500b"
      },
      {
        "path": "retained/redoc.standalone.js.LICENSE.txt",
        "bytes": 2729,
        "sha256": "eed602ec32e00b2b9df1984fbcc26a687b1b3193ec01961389c4b8439e6edf73"
      },
      {
        "path": "retained/redoc.standalone.js.map",
        "bytes": 3906825,
        "sha256": "2550d1c2e62c0640b2b4f4f49843433840fc291e001f3edb15ff66470e551476"
      }
    ],
    "excluded": [
      "redoc",
      "typescript",
      "source",
      "tests",
      "npm"
    ]
  },
  "matchesOriginalRuntimeInspection": true
}
```
