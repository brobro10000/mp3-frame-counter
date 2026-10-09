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
