# Documentation build-tool policy: independent expectations

**Expectation-authoring status — 2026-10-10:** actual DOCS-BIND publication at
`cfafcbe3e0bd33af2c95ccd9b4aee4f0c07960e6` (PR #22, v0.2.22) precedes this separately scoped governance contract. The
[published card](../phases/next-iteration.md) and coordinator r14 authorize independent expectations before a separate
implementer writes the helper. No helper execution, test pass, review approval or policy publication is claimed here.
Transport-v1 remains required; docs-v1 remains the sole pending bound successor. No dependency is installed or declared.

## Frozen pure interface

Export `requireDocsToolPolicy(packageJson, packageLock)` from `scripts/docs-tool-policy.mjs`. Both inputs are parsed
metadata. Return `undefined` on success or throw a labeled assertion on rejection, without mutating either input. There
is no I/O, environment selection, configuration adapter, package/renderer execution or network access.

- Require ordinary or null-prototype package, lock, `packages`, lock-root and present root `devDependencies` records;
  reject arrays, primitives and inherited/custom prototypes. Require numeric npm lockfile version `3` and a lock root.
  Missing and empty development maps are equivalent for this narrow helper; the caller retains baseline tooling rules.
- Compare the own `redoc` declaration on both roots. Both may omit it; otherwise both must declare the string `2.5.4`
  exactly. Reject mismatched or missing sides, wrong synchronized pins, coercion, ranges/tags/prereleases, aliases and
  URL/file/Git/link/workspace syntax. Other tool-name admission belongs to the caller, not this helper.
- Declared Redoc requires an ordinary `packages["node_modules/redoc"]` record with version `2.5.4` and strict
  `dev: true`. `devOptional`, `optional` and `peer` must each be absent or strictly false. `link` must be absent even if
  false. Ordinary license, engines, dependency and peer metadata do not confer additional direct-root authority.
- Its exact resolved URL is `https://registry.npmjs.org/redoc/-/redoc-2.5.4.tgz`. Require one canonical `sha512-` SRI
  token decoding to exactly 64 bytes, with canonical base64 spelling and no suffix or additional token. This is syntax
  checking, not equality to an observed registry digest or authentication of downloaded bytes. Two synthetic digests
  must pass.
- An undeclared top-level installed Redoc record must be ordinary and explicitly development-only. Its transitive
  version/source checks remain with existing generic lock policy; do not impose the selected direct pin on it. Shared
  transitives can remain production-reachable through Fastify. Do not require the entire graph to be dev-only.

Pure-helper assertions identify the responsible boundary with these stable prefixes; explanatory suffixes remain free:

| Prefix                             | Responsible decision                                           |
| ---------------------------------- | -------------------------------------------------------------- |
| `DOCS-TOOL-POLICY record`          | Required metadata records and present declaration-map shape    |
| `DOCS-TOOL-POLICY lockfileVersion` | Numeric npm-v3 lock schema                                     |
| `DOCS-TOOL-POLICY declaration`     | Own selected declaration presence, equality and exact pin      |
| `DOCS-TOOL-POLICY installed`       | Required installed record shape and selected installed version |
| `DOCS-TOOL-POLICY dev`             | Strict development-only status, direct or undeclared           |
| `DOCS-TOOL-POLICY flags`           | Direct optional/peer/link exclusions                           |
| `DOCS-TOOL-POLICY resolved`        | Exact selected tarball URL                                     |
| `DOCS-TOOL-POLICY integrity`       | Canonical single SHA-512 SRI syntax/length                     |

These labels prevent unrelated failures from satisfying a negative control; they introduce no new package authority.

## Caller and unchanged owners

The actual `scripts/policy.mjs` must call the helper unconditionally after the unchanged runtime validator. Add only
`redoc` to its existing seven-name development-tool allowlist. Preserve declaration equality, required baseline tools,
exact development pins, workspace prohibition, generic transitive registry/integrity rules and existing test entries.
The new tooling test must be included in `scripts.test:tooling` and required by the policy CLI, with a
`Missing mandatory docs-tool-policy tests` assertion if omitted.

The caller rejects every other direct tool, including `redoc-cli`, `@redocly/cli`, alternate casing and alias names.
Redoc's transitive `@redocly/openapi-core` does not gain direct-root admission. The unchanged runtime helper owns
allowed Fastify and both roots' optional/peer/peer-meta/override/bundle channels. Existing diagnostic reasons retain
attribution to those owners. A valid dev Redoc declaration cannot legalize runtime Redoc or an alternate dependency
channel.

## Independent controls and usage

The [focused tests](../../scripts/docs-tool-policy.test.mjs) define synthetic metadata before implementation. Every pure
negative begins with a passing fresh counterpart, then checks the expected label and unchanged mutable inputs.
Deep-frozen positives cover ordinary/null records, explicit-false flags, both valid SRI values and shared graph
semantics. Mutation-then-throw and wrong-diagnostic test doubles must fail the negative oracle. Missing API guards
precede rejections. Wrong-version/source declarations are synchronized across both roots and the installed
version/tarball metadata, so mere disagreement cannot explain rejection. Forbidden CLI tool names have complete matching
installed records.

Real CLI fixtures locally reuse the existing `runtime-dependency-policy.test.mjs` pattern without importing that test
module or creating a shared framework. They clone source package metadata, remove evolving runtime/Redoc declarations
and reconstruct coherent synthetic graphs. No-runtime/Fastify and legacy/selected arrangements pass independently;
undeclared transitive Redoc and a production-reachable shared transitive record have separate positives. These model
checked metadata only, not actual package installability or an independently audited transitive distribution graph.

Each CLI negative requires a successful exit and real success marker before mutation, the responsible policy assertion
on failure, then a restored passing fixture. It covers selected-tool integration, undeclared Redoc integration, closed
names/channels, old pins/workspaces/transitive checks and mandatory tooling-test inclusion. Missing imports, tools,
signals, timeouts or an unrelated assertion are setup failures rather than evidence of policy rejection.

Run with the repository's pinned Node 24.20.0 and npm 11.19.0 on `PATH`:

```sh
node --test scripts/docs-tool-policy.test.mjs
```

The fixtures copy governance metadata only into temporary repositories with isolated Git configuration, disabled hooks
and synthetic identity. Git children have a ten-second/one-MiB bound; policy children have a twenty-second/one-MiB
bound. Test cleanup removes each owned directory on failure or success. The source repository's Git state remains
untouched. The helper/test contract has no product or frozen acceptance imports, install, network, Docker or credential
dependency.

Root owns the tooling-script append, test-first commit and retained red evidence, then separate implementation and fresh
focused/full checks. Actual counts, hashes, review and publication belong in the later validation record. This authoring
pass does not execute tests. Root/acceptance dependencies and lockfiles, frozen suites/contracts, runtime helper/tests,
workflows, path classifiers and product source remain unchanged. Policy admission cannot certify production-image
exclusion, offline artifact generation, CSP, rendering, downloaded bytes, docs activation or hosted deployment.
