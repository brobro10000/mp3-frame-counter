# Fastify transport migration evidence

**Status — 2026-10-10:** PR #19 is merged and **v0.2.19 publication is verified**. Protected-main CI passed 82 unit
tests and all 67 transport cases; transport-v1 is now required with no pending successor. The
[completion record](#protected-main-completion) supersedes the earlier pending wording below. Local test-first,
resource, failed-run and source-review observations remain historical. No deployment or production readiness is claimed.

The
[FASTIFY card](https://github.com/brobro10000/mp3-frame-counter/blob/f4fb747df8890511edde7878064bb9af79823138/docs/phases/next-iteration.md#pr-card-1--fastify-migrate-transport-under-the-bound-compatibility-contract)
follows actual RUNTIME-POLICY merge `3e1851eaddb558f6c38eedc88334605212a7a153` and verified v0.2.17 publication. The
[binding evidence](transport-binding.md) records the independently authored transport-v1 suite and exact review. This
next product change must activate that bound successor; it cannot choose r3 or edit acceptance to obtain a pass. Trace
APP-V1-001–005,007–010,013,015 and transport-v1 TC-01–07.

## Internal expectations before implementation

Commit `ec329a6b05e4366bb544fe48db9a58720b62b063` preserves 19 existing HTTP test bodies/assertions and adds seven
startup, admission and cleanup cases. The shared startup helper requires the new asynchronous `service.listen` readiness
boundary before use. Availability guards are outside expected-rejection assertions, so an absent API cannot masquerade
as a correct negative decision. These internal tests supplement the already frozen independent external suite; their
product implementer authored them before changing transport code.

The additions cover occupied-port rejection; shutdown before and racing readiness; refusal before Continue/body
transmission; busy admission with two held uploads; recovery beside an active anchor after success, parser failure and
abort; and timeout followed by connection close without leaking or over-releasing admission. Client deadlines and
finally cleanup bound held requests. Independent read-only review found no concrete blocker in this test diff, without
running tests or claiming implementation correctness.

Pinned Node 24.20.0 focused execution reported **26 tests: two passed, 24 failed, no skips or cancellations**. Every
failure was the explicit missing-readiness-API guard; the two unchanged nonlistener configuration/process checks passed.
This is interface-red evidence, not exercised migration behavior. Before the test commit, a harness correction made an
unexpected final response terminate held-admission waiting, installed cleanup before opening the second held request,
and accepted an already observed client close. The separate repeated red run had the same counts.

- Test source SHA-256: `ed1ac586f61175274bbe94631f01dc7cc5561d8d16aac9c2cbc496dc04cd5cc8`.
- Initial ignored log `.artifacts/fastify-http-red.log`: SHA-256
  `95d409355972b34c3389af11c6be4ccd20c7b285812272aa0308c480d7059c51`.
- Corrected ignored log `.artifacts/fastify-http-red-r2.log`: SHA-256
  `e661741dd1bb7854c5ed6d75a3e194fd0c34f84bbdeeb01aa369f8d0af9c259a`.

## Dependency selection and remaining verification

Bounded official registry metadata revalidation selected exact Fastify **5.12.5**, matching the prior feasibility
recommendation. Metadata reports MIT licensing, no deprecation field, 15 direct dependencies and SHA-512 integrity
`sha512-OB2k1dlxs5/NAABqeKV2FUHkSD2BbENsCak8yULVcymn3fHIPDVa9TI3SDnJSWYSllZmSYuZXy2gTnsT+Sut1A==`. The record is
retained in `.artifacts/fastify-metadata-revalidation.json`. Registry metadata alone does not prove downloaded package
contents, complete dependency safety, TypeScript compatibility or actual runtime behavior.

The implementation preserves the unchanged pure parser, actual-byte and aggregate resource protections, exact HTTP
contract, two non-root images and image-bound external acceptance. Successful uploads must execute through the framework
stream parser and route. A narrow raw refusal bridge may preserve wire-level ordering; forwarding every request into the
old handler would not establish a Fastify migration.

The [lifecycle disposition](lifecycle-controller.md) remains applicable: TC-07 establishes actual bounded straggler
closure and normal process exit. It does not establish graceful completion of an admitted response across operational
SIGTERM. Passing internal shutdown cases or a daemon signal acknowledgment cannot resolve that separate limitation.

No product acceptance, image, CI, review, release or cloud identity is inferred from the test-first commit. Record each
later observation only after it occurs, retaining failed runs and the immutable external expectations.

## Focused implementation and independent review

The first implementation passed `npm run typecheck`, `node --test tests/unit/http.test.ts` (**26/26**, zero failures,
skips or cancellations), `npm run build` and `npm run check:policy` on pinned Node 24.20.0. Logs are retained as
`.artifacts/fastify-typecheck-first.log`, `fastify-http-first.log`, `fastify-build.log` and `fastify-policy.log` under
`.artifacts/`. Only purpose/JSDoc comments changed after those checks; explicit-file formatting passed afterward. The
internal HTTP expectations remain byte-identical to their test-first commit, and all frozen external bytes remain
unchanged. These focused checks do not replace full application unit or container acceptance.

Independent read-only review covered actual transport, bootstrap and Dockerfile changes against the trusted base,
including framework internals relevant to raw server settings, error/lifecycle handling and shutdown. It found no
concrete blocker. It inspected source and saved evidence without running tests, containers or network requests.

The dependency diff adds exactly Fastify 5.12.5 at the package and lock roots and 48 reachable production records
covering 47 package names. All 236 preexisting lock records remain unchanged. Installed manifests matched names,
versions and dependency edges; each added record has canonical npm tarball/SHA-512 metadata and no lifecycle install
hook. The graph supplies HTTP routing, lifecycle, JSON validation/serialization, logging/streams and utilities; no MP3
parser package was identified. This was not an exhaustive transitive-code security audit or independent tarball hash
verification.

`npm audit --omit=dev --json` returned zero reported vulnerabilities. The complete audit returned four low-severity
entries in the unchanged development chain: KaTeX advisory
[GHSA-238p-pmpm-9mq7](https://github.com/advisories/GHSA-238p-pmpm-9mq7) propagated through Mermaid and its CLI. The
advisory concerns a trust-restriction bypass when prototype pollution already exists. No automatic fixes or unrelated
development pins changed. Saved audit results are `.artifacts/fastify-production-audit.json` and
`.artifacts/fastify-all-audit.json`; a point-in-time audit cannot guarantee absence of vulnerabilities.

Reviewed product SHA-256 identities:

| File                  | SHA-256                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `server/src/http.ts`  | `b988975be28474e00ddec2a9a33612f985904215ed05b52fd46ba22f9a582cb4` |
| `server/src/index.ts` | `1a9617f0f72a8390bb8f94b29d8bedf81bba7455f2883dd30717485a72dd4d50` |
| `server/Dockerfile`   | `2d8ac6958838712095e3070b1a8a8660ba6afe208b68794b35eac6189e1ee735` |
| `package.json`        | `8c9ad9ead59ede0d48b962a50d9bf6aae532906d16ca719aa68ac28559eb1ba9` |
| `package-lock.json`   | `69bf2b19ea49cc79777d3ac71345484f237213c7168fe4480fbcb6c9d5b47af9` |

## Integration prerequisite discovered

The first `npm run validate` passed formatting, workflow lint, actual repository policy, portability, all **19 Mermaid
renders** and **20 gate tests**, then reported **420 passing and four failing tooling tests**. The four failures were
CLI fixture positive controls in `scripts/runtime-dependency-policy.test.mjs`: the fixture copied the application
package's new Fastify declaration but constructed a dependency-free synthetic lock root. The actual package/lock passed
policy; no product acceptance result follows from this failed tooling run.

The coordinator opened a separate governance-only fixture-correction workstream on the trusted main base, preserving
`.artifacts/fastify-validate.log`. Independent regression expectations must precede the minimal fixture correction. The
predicate, policy, frozen acceptance and this product PR cannot be changed to conceal the failure. Fastify merge remains
blocked until the corrective prerequisite is independently reviewed, merged and verified, then integrated.

The correction subsequently merged separately in [PR #18](https://github.com/brobro10000/mp3-frame-counter/pull/18) as
`17b389e71fadb869150982e4b459e52b37d664b2`, after independent regression/review, all mandatory PR checks and exact-head
automated companion approval. The product branch merges that main commit without rewriting its test-first or measured
source identities. [Fixture evidence](runtime-policy-fixture.md) preserves the 26-pass/one-failure regression and
27-pass correction; the actual policy predicate and frozen acceptance remain unchanged.

After integrating the verified v0.2.18 prerequisite, `npm run validate` passed formatting, workflow lint, actual policy,
portability, all **19 Mermaid renders**, **20 gate tests** and **425 tooling tests**, with zero failures, skips or
cancellations. The ignored log is `.artifacts/fastify-validate-r2.log`. Product code, dependencies and the internal test
source were unchanged from the measured implementation; subsequent edits record evidence in documentation. Final CI must
still validate the submitted revision and build its exact image pair.

## First complete local image acceptance

Clean source `b0c707c0020fc8d13eb71a4366e14733c90fc0ba`, before integrating the separate fixture correction, passed
`DOCKER_DEFAULT_PLATFORM=linux/amd64 CI_BASE_REF=3e1851eaddb558f6c38eedc88334605212a7a153 npm run check:phase` on pinned
Node 24.20.0. The normal runner verified the immutable fixture controls and inventory, passed all **82 unit tests**,
built both images and passed **67/67 transport cases**, with zero failures, skips or retries. Cleanup passed; a separate
Docker query confirmed the run's project resources were absent. The E2E result duration was 93,425 ms.

- API image: `sha256:903dd4b19b97b0941ab9c951848863bc2adf08567f96ec0f8e5d7f36cf5f338f`.
- Frontend image: `sha256:c7027e1b329a5b5e75f20ad33dd6f2b87849467593381bf79fda792e9cfb089d`.
- Ignored result `.artifacts/fastify-first-e2e-result.json`, SHA-256
  `4b16b8e1d84ef36b58f75d41218c3fe9246557b41e3b2743e65682480841dd68`.

Local selection required transport-v1 at its actual bound suite commit, with this source as the implementation
activation. This is local resolver evidence, not trusted CI admission or protected-main activation. The later PR/main
must pass against its own exact source and images. TC-07 passed bounded straggler closure and normal exit; the separate
admitted-response drain limitation remains unresolved.

An ephemeral, read-only, unprivileged inspection of that exact API image verified linux/amd64, Node 24.20.0, UID 1000,
Fastify 5.12.5 and only the four compiled application modules in `dist`. Tests, frontend source, TypeScript, Prettier,
Mermaid CLI and npm/yarn executables were absent from their expected runtime paths. The frontend image remained
linux/amd64 and UID/GID 101. These images ran under Docker's amd64 emulation on the local ARM host.

## Supplemental resource observation

The [recorded observation](artifacts/fastify-resource-observation.json) uses the same source/API image and the bound
suite's independently counted one-frame fixture. It holds two valid **20,971,392-byte** uploads, refuses a third with
503 and zero Continue responses, then completes both with exactly **54,613 frames**. It retains the existing 256 MiB
container, 128 MiB V8 old-space setting, one CPU and 64 PID limits, non-root user, read-only filesystem, dropped
capabilities and 8 MiB temporary filesystem. No uploads are persisted.

The cgroup peak was **127,467,520 bytes (121.56 MiB)**, leaving 140,967,936 bytes below the container memory limit at
that observation. All three sampled swap counters were zero; Docker allowed swap, so this does not assert a no-swap
configuration or prove that no transient swap occurred. The API exited normally without an OOM flag. Client, container,
network and temporary fixture cleanup passed, and independent UUID-label queries found no remaining resources.

This measures the API plus short cgroup-reading processes, with container health checks disabled and readiness sent from
the host. The dedicated bridge exposed only an ephemeral loopback port; outbound routing existed, but the probe made no
external request. It is one bounded local observation, not sustained stress, universal headroom, hosted sizing or a
replacement acceptance gate. The fixed probe and raw reports remain under ignored `.artifacts/`.

The first probe failed at the container-start stage before any upload measurement. A direct diagnostic observed the
missing host-port mapping on its internal bridge, but the retained generic failure report cannot distinguish that
condition from a startup/inspection deadline. Its original failed report remains intact. Exact ownership/image checks
preceded manual cleanup, and absence was verified. The second probe used a dedicated ordinary bridge, a bounded startup
allowance and cleanup checks that remain valid after network teardown; the product image and workload expectations did
not change. These probe repairs do not establish a unique cause for the first failure.

## Protected-main completion

[PR #19](https://github.com/brobro10000/mp3-frame-counter/pull/19) merged as `f4fb747df8890511edde7878064bb9af79823138`
at **2026-10-10 13:05:41 UTC**, with sole parent `17b389e71fadb869150982e4b459e52b37d664b2`. Its tree
`9f61ce7116c5d5bc28c8952b9925f5f65b4f3121` equals the tree of reviewed head `bc0830ca3bf8fe2151a12c5f3eba6582bbc8cf83`.
The final companion reviewed all 23 changed files, reported no findings and passed its documentation check. Automated
reviewer `brobro1000` submitted
[approval 5479042121](https://github.com/brobro10000/mp3-frame-counter/pull/19#pullrequestreview-5479042121) for that
head; owner `brobro10000` performed the ordinary protected squash merge after fresh mandatory checks. This was
automated, not human, code review. An intermediate diagram-sync edit was corrected before final CI and review;
superseded runs were not substituted for the final head's result.

Final PR run `38053525087`, attempt 1, and actual
[main run 38054409309](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38054409309), attempt 1, passed
foundation, product and control-plane checks: **425 tooling tests, 20 gate tests, 82 unit tests, 19 Mermaid renders and
67 external transport cases**, with no failures, skips or retries and passed E2E cleanup. Main publication job
`114220477868` published [v0.2.19](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.2.19), release
`408960297`, at **13:10:05 UTC**, with ten assets.

Trusted main admission classifies this source as `implementation`, requires transport-v1, records activation
`f4fb747df8890511edde7878064bb9af79823138` and binding `5645b0501ca403750a2d894d6a492afa4b42185b`, and has no candidate
or pending binding. The canonical admission SHA-256 is
`f8d8c2259ca3f7faecf7dc69e6199694e89857826ec2d6e634a528ae63db9b34`. The required suite remains commit
`6c28382d71a014351311e63154ef1c8916b8a229`, tree `d905d3123623f74b029a94c61ca850e553af2c32`, with manifest SHA-256
`674bb8a49e895b283d828e965f3cd4c6e1567f9b38ec25fdf44dfe452085e3cc`. No frozen acceptance or gate bytes changed.

Actual main tested/released image identities:

- API: `sha256:d31496885ab865c77855f89815bc182ac5c68e1f8ea637ba99cf228097903bee`.
- Frontend: `sha256:d27373eca513b3f9a76340cd38ba6c26a5ad586780215b87165b64cc4a14012f`.

The ignored `.artifacts/fastify-main-publication/` capture retains CI logs, raw metadata and independent verification.
Root and a separate verifier cross-checked source/run/attempt, reviewed-tree equivalence, admission hash and selection,
result counts, image agreement and reservation/publication provenance. Eight metadata assets were downloaded and
independently rehashed against GitHub-reported digests. The two Docker archives were not downloaded or independently
rehashed; their integrity was checked through published metadata only. No extra publication retry was requested. These
observations are not signed attestations, hosted verification or proof of graceful admitted-response drain.

The next bounded work is DOCS-HARNESS, followed by independent DOCS-CONTRACT and actual DOCS-BIND. Required transport
acceptance persists for later descendants; each future source still needs its own validation. No browser documentation,
registry transfer, stage service or production deployment is established by this release.
