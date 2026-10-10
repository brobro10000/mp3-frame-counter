# Runtime dependency policy: independent expectations

**Expectation-authoring status — 2026-10-10:** this contract follows verified TRANSPORT-BIND publication at
`5645b0501ca403750a2d894d6a492afa4b42185b` (v0.2.16). It defines the separate governance prerequisite for Fastify. The
helper is not implemented by this test-first change. No runtime dependency, lockfile, product or acceptance byte is
changed. Required acceptance remains r3, with transport-v1 bound and pending its first product-affecting implementation.

Read the
[RUNTIME-POLICY card](../phases/next-iteration.md#pr-card-1--runtime-policy-admit-one-explicitly-pinned-framework-dependency),
[transition policy](acceptance-transition.md) and [acceptance-author role](../agents/acceptance-author.md). The separate
Fastify migration must validate the selected package, dependency graph, product behavior and exact image pair;
permission to declare a package does not establish those results.

## Pure predicate

`requireRuntimeDependencyPolicy(packageJson, packageLock)` returns `undefined` for admitted metadata and throws
otherwise. Inputs are parsed JSON records with Object or null prototypes. It performs no I/O, mutation, installation,
environment lookup or acceptance selection. Invalid arrays, primitives and custom prototypes are rejected at checked
boundaries.

- Direct runtime maps may be absent or empty in either package and lock-root metadata. These forms are equivalent for
  comparison only; historical bytes and input objects are never rewritten.
- A nonempty direct map contains exactly lowercase `fastify`, pinned to stable canonical `X.Y.Z` with nonnegative
  safe-integer components. Reject whitespace, leading zeros, unstable suffixes, ranges, tags, aliases and alternate
  sources. Synthetic test versions are not production recommendations.
- Require ordinary npm-v3 metadata, normalized package/lock-root declaration agreement and the matching normal
  production `node_modules/fastify` record. Its `dev`, `devOptional`, `optional` and `peer` flags must be absent or
  false; `link` must be absent. Undeclared installed Fastify requires explicit `dev: true`, preserving development
  transitive records without applying direct-pin syntax to them.
- Direct Fastify resolves to its exact canonical HTTPS npm tarball URL and has one canonical SHA-512 SRI token decoding
  to 64 bytes. Reject alternate hosts, credentials, query/fragment suffixes, malformed base64, noncanonical padding and
  wrong decoded lengths. This checks metadata; it does not authenticate downloaded tarball contents.
- Root optional/peer/peer-meta/override channels accept absent or empty ordinary maps. Both bundle spellings accept
  absent or empty arrays. Reject nonempty channels and malformed empty-looking aliases, including null and false, on
  package and lock roots.
- Preserve the existing development allowlist/exact pins, workspace prohibition and generic transitive registry and
  integrity checks. Do not impose a transitive package-name allowlist or direct-pin syntax on transitive version ranges.

## Independent executable evidence

The [focused expectations](../../scripts/runtime-dependency-policy.test.mjs) provide synthetic positive and negative
metadata tables plus the real `policy.mjs` entrypoint. Missing exports fail explicitly before rejection assertions.
Frozen positive inputs expose mutation. Invalid-data decisions do not depend on implementation-specific error wording.

CLI fixtures copy governance metadata only and create disposable Git histories with an initial `0.1` release policy,
isolated configuration/hooks and fixed synthetic identity. They run the actual policy script from its real path, with a
minimal environment and bounded child processes. A complete dependency-free positive control must pass before negative
decisions can count. A matching Fastify graph must also pass before its forbidden second runtime dependency is rejected;
this prevents an unchanged blanket prohibition from appearing to implement the new policy. Separate controls retain the
development allowlist, development pins, root workspace restriction and transitive source/integrity restrictions.

Run with the repository's pinned Node/npm on `PATH`:

```sh
node --test scripts/runtime-dependency-policy.test.mjs
```

No fixture executes product/acceptance code, installs dependencies, contacts a registry, accesses credentials, runs
Docker or mutates the source repository's Git state. Temporary repositories are removed by test cleanup even on failure.
Existing acceptance-classifier expectations already cover governance/product separation and are not duplicated here.
Root records the observed red result before the separate implementation and retains failed evidence.

Initial focused execution on pinned Node 24.20.0 produced **22 groups: 3 passed, 19 failed, no skips or cancellations**.
Eighteen groups fail explicitly because the pure helper is absent; the remaining red group reaches the old blanket
prohibition when its complete positive fixture declares the permitted Fastify pin. The dependency-free CLI control and
the existing development/workspace/transitive-policy controls passed. The ignored log is
`.artifacts/runtime-policy-red.log`; no missing fixture or import failure was interpreted as a passing rejection.

## Authority and limitations

The implementer may add the helper and its narrow call in `scripts/policy.mjs`; root separately wires the focused test
into `test:tooling`. Current dependency declarations and root lock bytes remain unchanged. Mandatory CI, independent
policy review, exact-head companion approval, owner merge and verified publication remain required before Fastify work.

A parsed-object predicate cannot recover duplicate JSON keys discarded by parsing, establish package provenance or
vulnerability status, prove complete graph reachability or inspect package contents. Independent dependency/source
review still enforces the MP3-parser-package prohibition. No acceptance exception, deployment authority, successor
activation or production readiness follows from a passing metadata predicate.
