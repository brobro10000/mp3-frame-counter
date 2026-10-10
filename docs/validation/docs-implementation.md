# Offline API documentation implementation evidence

## Scope and prerequisite — 2026-10-10

This product change implements the immutable [docs-v1 contract](../testing/contracts/docs-v1.md) after its independent
candidate, actual binding and [tool-policy publication](docs-tool-policy.md#protected-main-completion--2026-10-10).
Trusted base is `2ca5a0b2e2eb2c9aa9160e950ec905bae24a1892`, released as v0.2.23 by main run 38073905847, attempt 1. The
suite remains bound to candidate `351d2e5b998f882287c4c5e4bb41427d4ad5c41e`, suite tree
`f4704be065e181cff1257e1a8a641ada23124aa0`, manifest `b787342ba7464b9bb0c3b47fe4a401d9bcc32b3c3d0c0828bfa0008487c75e26`.
Those bytes, prior 67 obligations, contract, genesis, registry and all gate/runner/release code are unchanged. Product
changes require all 72 docs-v1 cases and persistent activation; old-suite fallback is not allowed.

The coordinator owns package/lock, API Docker build and integration. Separate product implementers own deterministic
assets and API/NGINX routing; the independent candidate author receives no product implementation. Current guidance and
prior-publication completion are documentation changes only. No hosted infrastructure, registry or deployment is added.

## Normal build ordering

An independent source preflight found that existing units import source modules and run before the phase's standalone
build. Root admitted one explicit product-script amendment: `test:unit` now runs `npm run build` before its unchanged
`node --test tests/unit/*.test.ts`. Build compiles TypeScript then runs the builtin generator. The phase order, source
entrypoint, TypeScript configuration and old tests remain unchanged. Source and compiled readiness use the same real
`dist/docs` assets and fail closed before listening if required output is unavailable. Static typecheck remains free of
asset-generation side effects.

Preflight SHA-256: `30a4ef82c6596d423e340144e01e3b0adcfac59209889817613841f1ad95096e`. This design review is not runtime
test evidence.

## Acquisition and Linux isolation prerequisite

Pinned Node 24.20.0/npm 11.19.0 acquired development-only Redoc 2.5.4 using `--save-exact --ignore-scripts`; no CLI was
added. The lock adds 112 installed records, preserving every preexisting installed record and the exact Fastify runtime
pin. The root lock record adds only the selected development declaration. Build authentication separately checks the
original standalone bundle, map, derivative and logo identities specified by the bound contract; metadata admission
alone does not prove downloaded bytes.

Docker Engine 29.7.2/buildx 0.36.1 ran a fresh `linux/amd64` control build on the same pinned Node Alpine image. A
bounded inert probe resolved the npm registry and opened a TCP connection to port 443 without sending application bytes.
In the following `RUN --network=none` step, DNS failed with `EAI_AGAIN` and direct TCP to the same recorded address
failed with `ENETUNREACH`. A final default-network counterpart succeeded. All three steps ran without layer-cache reuse.
This establishes the selected BuildKit mechanism for this Linux builder; it is not a universal protocol or
host-isolation proof and does not transfer the earlier macOS experiment's claims.

Actual product generation under denied networking, repeat output identity, runtime-image inspection, unit/integration
checks, independent review, PR CI, companion approval, merge and protected-main publication remain pending. The separate
local preview is not application acceptance. Production remains a human-gated future operation.

## Focused execution

`npm run typecheck` passed. The first `npm run test:unit` stopped during generation, before any unit executed: the
authenticated original renderer contains two generic source-map marker strings, only one of which is the selected
terminal comment. The implementation had incorrectly counted both. The build author narrowed the predicate and new
product-unit assertion to that exact terminal comment, retaining the approved original/derivative hashes. No frozen
acceptance source or expected value changed. Failed log SHA-256:
`06e911247f0ffb7b0e118c7799b9ae5d1258d5ad2a26d7281c566198e02ff9f0`.

The corrected normal `npm run test:unit` completed generation and passed **120 tests**, zero failures, skips,
cancellations or todos, in 2.748 seconds. This includes all 82 prior units plus isolated generation mutation controls,
real source/compiled readiness and routing/body-close interactions. Passing log SHA-256:
`d74b9dcbf7b73c2ae24150dca7dd3037d5ca6de2652d8d6ce6d657d0af0c9f78`. Linux BuildKit control log SHA-256:
`4a8ef5788c17d645c54f3343bf3ed3983df63d7498e535723ea5c34d87e76d88`. Unit success does not establish NGINX policy, real
browser rendering or the required image-bound acceptance result.

## Actual offline generation and runtime inspection

A fresh uncached API builder ran `RUN --network=none npm run build` successfully on `linux/amd64` after its separate
locked acquisition. A second normal build ran in a disposable container from that builder with `--network none`; the
generator removed its previous output before recreating it. Both fresh output sets have identical thirteen-file
manifests, totaling **6,142,475 bytes**, including six public resources and seven retained records. Manifest SHA-256:
`f47353d31fc4163deb99e33e9abd31832fafec0380c865296123a3666e722d9a`. Only the pinned base-image content was reusable in
the uncached builder; successful generation did not come from a cached RUN layer.

The separately built runtime image `sha256:b3c726bdd275c41ea3b1cca26352803db41b92e5ca0c0001aff6ad31a25ea8d8` was
inspected in a read-only, network-disabled container. It runs as UID 1000, contains Fastify 5.12.5 and exactly the same
thirteen documentation files/hashes, and lacks installed Redoc, TypeScript, application source/tests and npm executable.
Retained vendor files are packaged evidence; they are not installed executable development dependencies or public
routes. Inspection SHA-256: `38ecfbb52229209b4daf9c330c8ebaacca7fe6e0740dc0a99e63eae7723b2c72`.

This inspection image is local source verification, not a published release or an E2E-selected pair. The unchanged
controller must still build its own pair and verify the complete external contract through NGINX.

## Source review and public ingress correction

The independent build/runtime/ingress review found one P2: docs initially inherited NGINX's 20 MiB upload-body limit,
which could return 413 before the required known-path 405 or unknown-path 404. The correction disables that limit only
inside the docs location, where the API responds immediately without collecting an upload and bounded rejection drain
remains active. Global/upload limits, disabled proxy buffering and storage remain unchanged. The new direct-API unit now
declares 20,971,521 bytes without sending them; all **17 docs units passed** after the correction. Log SHA-256:
`0a852a02dd0afed5308f76b21e53da171e83b3142b5e5d74bc863ea66f6bfa37`.

Root started the actual local Compose application and verified **nine public NGINX cases**: docs GET/HEAD, relative 308,
known/unknown POST with oversized declared length (405/404), two raw traversal rejections, the specification and root
page. Every checked response has exactly one appropriate CSP plus no-store/nosniff/no-referrer. Record SHA-256:
`5cd9b822bed582a9ba71447ce9a80d2f5916b47068997e4ba6f8320aeea53876`. Both containers are healthy; this local server is
not a stage deployment or full browser acceptance result.

`npm run validate` passed formatting, actionlint, policy, portability, **19 Mermaid renders, 20 gate tests and 480
tooling tests**, with zero failures/skips/cancellations. Log SHA-256:
`ec4a7d3f397d1a535208f946225c33e0ab42923a5cd4e61f6ea793394d66c484`. That run preceded only the narrow ingress/unit
correction and further evidence prose; affected docs units and real ingress checks were subsequently rerun. Final PR and
protected-main checks remain required, including full 72-case image-bound acceptance and publication.

## Complete local acceptance — implementation source 46695d2

`npm run check:phase` passed against clean committed source `46695d25ad38f919c66b9b0b750e2f3fb1d4c0d5`, trusted base
`2ca5a0b2e2eb2c9aa9160e950ec905bae24a1892`. The unchanged resolver selected docs-v1 for implementation with no pending
successor or candidate. This is explicitly local selection, not a CI admission grant. Standalone independent
controls/discovery and browser preparation ran separately from application acceptance; the normal build and all **120
units passed** before the real two-container test.

All **72 external cases passed**, zero failures/skips, including every prior transport case and both desktop/narrow
actual Redoc response expansion under effective CSP. The served specification, exact local renderer/logo, docs route/
method/header behavior and unchanged upload-page protection passed through NGINX. Scoped cleanup passed. The finite
live-document observation retains its contract limits; no hosted or destructive-navigation result is implied.

The actual tested image IDs were API `sha256:f8b39a536f6a1a25a9e2f5fac79b5312e228e54c8408a235b9ce172dca6cbd86` and
frontend `sha256:bb3d70b12763c04b562f7bd9d8a64d3c778cd36f78efb1afedffb06d1737afd9`; local configuration digest was
`fcfb3c8c372e4a3056ee92fdda9d55b107f3c7bf2fe4b28e453625affdbac562`.

Phase log SHA-256: `acda65a789a62f88c25d806205fe1b2c9430a14313a763cddb12f07998bb21f0`. Result SHA-256:
`1771bbee03b3291c6d1408d7d2fd03c0f5032f912fe8967534e38229ab5d57d9`.

The final independent source review preserves the ingress P2 and verified correction, with no remaining actionable
finding: SHA-256 `6150f5b91c04fc8f2cbbe4c1f904f4f19327d91936bc15b30de6a903ce141eed`. Root read the full memo, correction
and exact final hashes. Later edits only reconcile this evidence and current guidance; executable product,
configuration, dependencies and frozen acceptance remain identical to the tested source.

[PR #24](https://github.com/brobro10000/mp3-frame-counter/pull/24) requires fresh mandatory CI and actual Docker
companion review before an authorized normal owner merge. Protected-main acceptance/activation and publication remain
pending; none is inferred from these local results. Earlier pending statements above describe their pre-check snapshots.
