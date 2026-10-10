# P2 independent acceptance author handoff

Observed on **2026-10-09** under the owner's delegated P1–P5 execution instruction. P1's committed handoff
`7bc83102ca1c6537fc9993f7d3bcdc246a806ee8` preceded creation of this test-only package. No product parser, API, UI or
runtime image source was supplied to the acceptance author. Requirements, primary format references and independently
observed oracle evidence established every expected result.

## Executable scope and identity

- Contract: [external acceptance r3](../testing/acceptance-contract.md).
- Standalone package: `tests/acceptance/`, with its own exact manifest and npm lockfile; no workspaces.
- Suite: **60 discovered Chromium/HTTP tests**, covering AC-01–AC-12.
- Fixtures: **46 fixed entries**, including three original encoded tones, explicit structural cases and exact limits.
- Fixture manifest SHA-256: `2f56db4641f9e5c09b34c2bc0c630e85a46a010025c634375b110a35e2cb120a`.
- Acceptance lockfile SHA-256: `e9b5abe1791e8465de066ce7638351d7630beb1aa24a2c5c8f3d01bee6313acd`.
- Reviewed local suite commit: recorded by the controller in `docs/testing/baseline.json` after independent review,
  explicitly marked provisional until the test-only PR merges. It can establish test-first independence for local
  product work, but cannot establish protected-main CI or release readiness.
- Definitive CI/release suite commit: the actual separately merged test-only main revision, verified by the controller.
  A local commit is not substituted for GitHub's squash-merged revision or trusted-main ancestry.

The author does not create or self-approve the baseline record. Parent/reviewer path ownership and the later recorded
Git tree protect change attribution; these are process safeguards, not separate authenticated human reviewers. The
repository owner's existing GitHub review override remains distinct from advisory agent review.

## Observed checks

Using Node **24.20.0**, npm **11.19.0**, Playwright **1.64.0**, TypeScript **7.0.2** and Node types **24.19.2**:

```sh
npm install --prefix tests/acceptance --ignore-scripts
npm --prefix tests/acceptance run check
npm --prefix tests/acceptance run browser:install
```

The install resolved the exact standalone lockfile and reported zero audit vulnerabilities at acquisition. `check`
passed TypeScript, all 46 byte/hash/expectation checks, the controls below, and discovery of 60 tests. Discovery is not
test execution. Chromium **156.0.8078.4**, Playwright browser revision **1248**, installed and launched successfully;
the launch/close probe contacted no application.

| Harness control          | Actual child exit | Interpretation                                                        |
| ------------------------ | ----------------- | --------------------------------------------------------------------- |
| Correct count and shape  | 0                 | Shared response assertions accept the specified valid value.          |
| Wrong frame count        | 1                 | Same assertions used by E2E reject the incorrect count.               |
| Extra response field     | 1                 | Same assertions reject a noncontractual success shape.                |
| Missing fixture          | 1                 | Fixture acquisition failure propagates rather than producing success. |
| Launcher missing target  | 1                 | Full E2E cannot execute with absent target bindings.                  |
| Premature upload success | 1                 | Abort assertion rejects a deliberately incorrect early 200 response.  |

The last control is an ephemeral loopback protocol responder that returns 200 after only a valid prefix of an incomplete
request. It intentionally violates the upload contract; it is not an application implementation or a successful E2E
target. The real abort test sends three complete frames while declaring a 1 MiB body, observes a bounded 500 ms
incomplete-request window, then aborts and checks actual service recovery. The observation window is a deliberate fault
control, not a sleep used to manufacture successful application behavior. Source/resource review remains necessary to
establish cleanup properties a black-box request cannot measure.

No application acceptance was run in P2. An unavailable product would be a prerequisite failure, not behavioral TDD red.
The first real product assertions belong to P3/P4 evidence.

## Oracle evidence

The [original fixture provenance](../../tests/acceptance/fixtures/README.md) records exact generation commands, tool
versions, packet accounting and a CC0 dedication. MediaInfo/FFprobe independently establish physical expectations **9,
16 and 21**. All three tones decoded successfully. The VBR fixture has fifteen reported audio frames plus a complete
Xing frame, with all bytes accounted for. Structural fixture counts are known from literal construction, without a
second parser or product imports.

The [private sample baseline](sample-baseline.md) records unchanged SHA-256 and size, MediaInfo count **6,089**, and
physical expectation **6,090**. Its complete 208-byte Xing frame plus 6,089 contiguous FFprobe packets explains the
counting convention. Sample bytes remain ignored and are never a CI prerequisite.

The exact 20 MiB fixture contains `54,613 * 384 + 128 = 20,971,520` bytes: complete frames and a trailing ID3v1 record.
Its one-byte-over derivative tests actual upload bounds. Other fixtures cover exactly 6 MiB and above 1 MiB.

## Isolation, review corrections and remaining gates

The runner requires explicit frontend/API/controller origins, nonproduction kind, exact origin and target identity,
fault authorization and a random fault token. It rejects product/controller endpoint equality, including loopback
aliases. The token is sent only to the isolated controller. Full suite revision evidence accepts only a complete commit
SHA or the explicit unrecorded sentinel; invalid environment fields are not copied into result artifacts.

Browser requests are confined before transmission. The forwarding guard sends each approved real request once with
automatic redirects disabled and relays its real response unchanged; foreign origins and redirect responses fail the
case. This is necessary because Playwright routing does not intercept every subsequent redirect request. The controlled
AC-11 delay falls through that guard. There are no fabricated successful upload responses, third-party assets or service
workers. See the [Playwright routing reference](https://playwright.dev/docs/api/class-page#page-route) and
[redirect option](https://playwright.dev/docs/api/class-route#route-fetch).

Review corrections before freeze also put stop/pause inside restoration `try/finally`, strengthened the valid-prefix
abort observation, and made executable URL conversion work in checkout paths containing spaces. No fixture expectation
was derived from a product failure or modified to make implementation pass.

The controller must independently verify and record the reviewed test-only local commit, suite Git tree and manifest
hash before local P3 work. Under the owner's unattended phase-execution instruction, that explicitly provisional local
baseline permits local product work while the test-only PR awaits merge authorization. Tests, fixtures and gate logic
remain immutable to product implementers. This preserves the independently reviewed baseline-before-product ordering
without claiming protected-main freeze, completed P2 shipping, main CI readiness or release readiness.

The definitive CI/release freeze still requires a separately merged test-only main commit with the identical reviewed
suite tree and manifest. CI verifies ancestry against its trusted main base; the local provisional check is not a
substitute. P4/P5 must run every applicable test through the actual frontend, record exact target/artifact identities
and verify controller authorization/restoration. A skipped, missing or failed mandatory case is not a full pass. This
handoff does not establish deployed behavior, resource limits, image contents, no-persistence operation, cloud fit,
release approval or recovery; those retain their phase-specific evidence requirements.

## Root integration and independent review

The acceptance-coverage reviewer and isolation/provenance reviewer both returned advisory PASS after the final source
handoff. Root verified all 24 author-owned file hashes against that handoff and independently ran the ordinary phase
controller. Its fresh standalone `npm ci`, TypeScript/fixture/control checks and 60-case discovery passed. No
application implementation existed during these observations, and no discovered case is claimed as a passed product E2E
test.

The local test-only commit will be retained as the provisional review baseline. Required main CI rejects that local
commit until the independently reviewed test-only scope has landed on the trusted main base and the definitive freeze
record identifies its actual merged SHA. This remains an explicit shipping prerequisite.
