# P5 provider-independent preparation evidence

Status: local preparation tooling implemented and focused checks passed on 2026-10-09. Actual image export has not been
run by this author. No provider integration, cloud resource, credential change, deployment, tag or hosted release was
created. P5 and APP-REL-001–006 remain incomplete.

## Input observed

The existing local evidence `.artifacts/mp3-e2e-88959-29ea5b218537.json` records a clean tested product revision
`2adf71b447bfee9b78e9bdfc2b29566af894d0fe`, 60 planned/passed acceptance cases, zero failed/skipped cases and successful
scoped cleanup. Its frozen suite is `28c2a9c548f872dac54d9395a8ca0ed852f82240`, explicitly `provisional-local-review`.
This was the root-owned actual P4 run, not an execution performed by the preparation author.

Its image pair is:

| Service  | Tested local image ID                                                     |
| -------- | ------------------------------------------------------------------------- |
| API      | `sha256:f720d77ebf4690fbb96092e4eea1fe32201ac22a5e713eb88acf68ff49534634` |
| Frontend | `sha256:d1b001b4f683d82177e65e20241b6b92ba47f1deb681f89d35a4ca69aabfa424` |

Read-only Git inspection found full history and first-parent ordinal 10 for that tested source. The resulting local
version preview is `0.1.10`. This is not protected-main eligibility, an external reservation or a published release. The
CLI will separately verify the current local image identities/platform before any actual export.

## Implemented boundary

The [preparation guide](../deployment/preparation.md) documents the exact invocation, local effects, version policy,
immutable reuse rules and unresolved gates. The script checks the tested source and frozen baseline directly from Git,
uses a separate committed preparation revision, exports exact existing images without rebuilding, and writes a local
manifest with `deployable: false`. Docker image IDs, archive checksums, local-test configuration, source-configuration
fingerprint and future registry/provider identities remain distinct.

A completed reservation cannot be overwritten by a retry. Different source/image/configuration or changed archive bytes
fail. Incomplete export reservations are retained for inspection. Pure future evidence validation checks only supplied
consistency; it neither observes provider state nor authorizes a release.

## Focused checks

Fifteen tests passed under pinned Node 24.20.0. They cover complete versus failed/missing/zero/skipped evidence; clean
source and immutable image shape; exact image/platform matching; ordinal validation; committed configuration changes;
local-only manifest/notes; unchanged retry provenance; conflicting reservations; actual disposable archive-byte
alteration; provisional baseline and mandatory-check rejection; changed candidate/artifact/configuration; missing exact
approval; and a fully consistent synthetic evidence fixture that remains nondeployable.

Independent review identified an artifact-parent symlink that could redirect archives into another repository directory.
The repair rejects every symlinked artifact/report parent before creation or export. A disposable regression covers
`.artifacts`, `releases` and nested report-directory links and verifies no child directory appears in the redirected
target. All fifteen focused tests passed after this repair.

Targeted formatting and CLI syntax checks passed. These tests use synthetic records and disposable local byte files.
They do not invoke Docker, contact a provider, export the actual images, prove GitHub main protection, validate deployed
ingress, approve production or rehearse recovery. Root integration owns package/Make wiring, independent review,
committing the preparation tooling and the later explicit local export run.

## Remaining release prerequisites

The current acceptance baseline has not landed separately on protected main. The tested application revision is local
and has no corresponding successful protected-main release run. Provider account creation/terms confirmation, budget,
region, fit/diagnostic access and scoped credentials remain unresolved as recorded in
[deployment preflight](deployment-preflight.md). Registry digests, candidate acceptance, exact production approval,
deployed smoke, successful version/tag/release publication and actual recovery rehearsal remain absent.

Provider-independent preparation preserves useful tested bytes while these prerequisites are pending. It does not
satisfy or defer them, and cannot be reported as a working automated deployment cycle.

## Root execution after independent review

Independent reviewer `release_preparation_review` found a path-safety issue before export: a symlink could redirect the
artifact parent into a tracked directory. The author repaired all artifact/report parent components and added a
disposable regression confirming rejection before creating anything in the redirected target. The reviewer then returned
advisory PASS for this local-only scope. Fifteen focused tests and syntax checks passed. Root's full `npm run validate`
passed formatting, actionlint, policy, portability and **64 gate/tooling tests**.

Root committed the reviewed tooling as `b99b292c55b5fc114911829a896d309c8c1900f6`, confirmed a clean checkout and ran:

```sh
npm run prepare:release -- --report .artifacts/mp3-e2e-88959-29ea5b218537.json
make prepare-release
# From .artifacts/releases/0.1.10/:
shasum -a 256 -c SHA256SUMS
```

All commands exited zero. The first run returned `prepared-local`, `reused: false`, `deployable: false`; the Make retry
returned the same identity with `reused: true`. Both independent archive checksum checks returned `OK`. No rebuild,
retag, push, image load, provider operation, Git tag or hosted release occurred.

The [exact portable manifest](artifacts/p5-local-preparation.json) preserves tested product source `2adf71b` separately
from preparation source `b99b292`. Its provisional version is **0.1.10**, platform `linux/amd64`, and reservation hash
is `15fcd28cb4d5f71dbb1b060c42751990d71a9c77af993112b1a6774a4575b60c`.

| Archive  | Bytes      | SHA-256                                                            |
| -------- | ---------- | ------------------------------------------------------------------ |
| API      | 58,523,648 | `b8b28e87a292a6d11a0c431760d01197f54cc0b424463b79577a7c2410e5dc88` |
| Frontend | 25,592,320 | `65be146fd4532a4efbe3ea0da07d957dd2cc86cc22509d799d8876dead033b11` |

The archives remain ignored in `.artifacts/releases/0.1.10/`; only portable identity evidence is tracked. They have no
registry digests, provider configuration, candidate result or production approval. This is an executed local preparation
step, not fulfillment of any complete APP-REL outcome. The remaining prerequisites above still apply.

## Independent archive inspection and identity correction

The independent reviewer subsequently opened both actual archives read-only with Python's standard `tarfile`/`json`
modules. Each `index.json` referenced the exact recorded tested local ID. The referenced blob was an OCI image index,
not a configuration object. The reviewer recursively verified every reachable index/manifest/config/layer blob against
its descriptor SHA-256: 14 blobs for API and 18 for frontend, including attestation descriptors. Each archive had one
Linux AMD64 runtime platform entry, whose configuration confirmed that platform.

| Runtime configuration object | SHA-256                                                            |
| ---------------------------- | ------------------------------------------------------------------ |
| API                          | `b34f30e23cb58dd05facd954a6e4dd4c21225d6e8182494f4078469ecd2ebadc` |
| Frontend                     | `f1252d2c9d26b77ed3f6b28d9bbbd7329641a4164e68ed76789673cb6e5180b3` |

This actual Docker-store behavior invalidated an overly narrow documentation assumption and a future consistency check
that required registry and local identifiers to differ. The author corrected the definition and removed that inequality;
an existing focused test now accepts a consistently recorded equal registry digest. Registry publication still requires
actual observation and remains unknown here. Neither the archives nor their correct observed `localImageId` fields
changed. Docker engine identity, archive checksum and registry identity describe different observations even when their
digest strings can match.

The reviewer also reconstructed the original identity from Git/source report, rehashed both archives through
`verifyPreparedDirectory`, checked notes/checksums/reservation, and confirmed that the tracked manifest copy is
byte-identical to the bundle manifest. This was read-only inspection, with no extraction, image loading or provider
operation.

After this correction, independent review again returned advisory PASS and root's complete `npm run validate` passed all
64 gate/tooling cases and policy checks. A clean-source `make prepare-release` at
`359aabae8b0229c330a0d96c349be57b0501507f` successfully reused the unchanged bundle. Its output preserved original
preparation revision `b99b292` and recorded `359aaba` separately as the verifying revision; no artifact was rewritten.
