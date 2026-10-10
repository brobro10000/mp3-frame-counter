# Fastify transport migration evidence

**Status — 2026-10-10:** Fastify implementation passes focused HTTP, type, build and policy checks following the
committed internal expectations. Independent source/dependency review found no actionable blocker. Required image-bound
transport acceptance, companion approval, merge and publication remain pending. No deployment or production readiness is
claimed.

The
[FASTIFY card](../phases/next-iteration.md#pr-card-1--fastify-migrate-transport-under-the-bound-compatibility-contract)
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
entries in the unchanged development chain: KaTeX advisory GHSA-238p-pmpm-9mq7 propagated through Mermaid and its CLI.
The advisory concerns a trust-restriction bypass when prototype pollution already exists. No automatic fixes or
unrelated development pins changed. Saved audit results are `.artifacts/fastify-production-audit.json` and
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
