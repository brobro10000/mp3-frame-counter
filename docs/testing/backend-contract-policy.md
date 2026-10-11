# Independent backend contract tool-policy prerequisite

**2026-10-11, unbound local prerequisite.** The owner attachment's bounded refactor requires TypeBox/Fastify schemas,
generated OpenAPI and Ky within the existing client service. This prerequisite author supplies only independent pure
metadata tests; no policy implementation, lockfile, application source, workflow, binding or published graph changes.

The proposed API is requireBackendContractPolicy(packageJson, packageLock) from scripts/backend-contract-policy.mjs. It
returns undefined for valid parsed npm-v3 metadata and throws for refusal, without I/O or mutation. Missing API fails
before rejection assertions. Preserve the historical runtime helper and its existing Fastify-only decisions; route
narrowly to a successor helper only when the complete new set is selected.

The selected direct runtime set is exactly fastify 5.12.5, typebox 1.3.36, @fastify/type-provider-typebox 6.2.0 and
@fastify/swagger 9.9.2. Their declarations and installed direct records agree, use canonical registry.npmjs.org tarballs
and SHA512 integrity, and retain production flags. No partial/mixed/alias set, extra direct runtime,
optional/peer/override/bundle channel or local link is authorized. General dependencies remain subject to the
established parser prohibition and trusted-root policy. Synthetic direct-record hashes prove metadata shape rather than
the authenticity of a fetched package.

If declared, ky 2.2.0, @redocly/cli 2.62.1 and oxlint 1.87.0 are independently optional exact development-only
selections, with root/installed/source/integrity agreement. They do not enter the API runtime. Unrelated established
development tools and historical graphs remain under their existing policies. Oxlint is the separately selected source
linter: its official [CLI](https://oxc.rs/docs/guide/usage/linter/cli) and
[configuration](https://oxc.rs/docs/guide/usage/linter/config) documentation cover native TS/TSX parsing. Independently
queried npm metadata reports Node ^20.19.0 || >=22.12.0 with no TypeScript peer bound. Use a JSON configuration,
explicit backend/contracts/frontend/relevant unit-test coverage and errors/zero warnings; keep tsc checking separate. No
forced peer install or unsupported typescript-eslint/TypeScript7 combination is authorized. Actual shipped-source lint
must be run by the coordinator; metadata and synthetic cases do not establish that result.

Run `node --test scripts/backend-contract-policy.test.mjs` using Node 24.20.0. The 14 groups cover preserved historical
empty/Fastify-only graphs, complete exact selection, null-prototype/immutable input, missing members, all pin locations,
canonical sources/integrities, production flags, direct-runtime exclusions, closed channels, optional dev tools,
malformed metadata and preserved ordinary old dev graphs. Tests were authored before the implementation API existed.

Initial author execution under Node 24.20.0 failed all 14 groups at the explicit missing pure API assertion. This is
meaningful prerequisite red evidence, not a product failure/pass. The raw local log was written outside tracked source
at `/tmp/backend-contract-policy-author-red.log`; no private data or product output was consulted. Later implementation
and entrypoint integration checks belong to the coordinator and need their exact revision/results recorded separately.

No source linter compatibility, installed package combination, protected-main admission, review approval, publication,
remote binding or product acceptance is claimed. The prerequisite and candidate acceptance successor remain separately
reviewable; the coordinator owns Git actions and authenticated remote identities.

The unchanged first 14 groups subsequently passed 14/14 under pinned Node 24.20.0 after the coordinator supplied the
pure implementation. The author then independently added the exact development-only oxlint 1.87.0 pin and its
direct-runtime exclusion before installation or helper support; the revised table is a new local expectation, not a
rewritten initial red capture. Source-linter package acquisition and full-scope execution remain coordinator
responsibilities.

The revised policy tests produced 13 passing groups and one deliberate failure,
`Missing expected exception: package pin oxlint`, under Node 24.20.0 before the helper admitted that new pin. The raw
red log is `/tmp/backend-contract-policy-oxlint-author-red.log`.

The separately proposed pure `scripts/ci-unit-inventory.mjs` exports `requireUnitInventory(files):void` and an immutable
`unitFiles` lane map. Its exact six-file inventory is the existing frontend-response application test and the server
app/docs-build/docs/http/mp3 tests. The new app-factory file belongs to server; additional parser cases remain in mp3.
The caller preserves its regular-file/symlink checks. No new parser filename or workflow is admitted by this helper.
`node --test scripts/ci-unit-inventory.test.mjs` checks exact sorted/unsorted/frozen lists, exported lane ownership,
duplicate/missing/unknown/nonunit/path-alias refusal, malformed lists and preservation of input. Initial author
execution failed all six groups at `Missing CI-UNIT-INVENTORY pure API`; the meaningful raw red log is
`/tmp/backend-ci-unit-inventory-author-red.log`. The coordinator owns implementation and entrypoint wiring.
