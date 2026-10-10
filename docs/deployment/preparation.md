# Local release preparation

This provider-independent step supports APP-REL-003/004 without claiming a deployed release. It exports an already
tested pair and prepares versioned evidence locally. [CI publication](release-only.md) separately requires
protected-main eligibility and successful exact-source checks. Provider setup, candidate acceptance, production
approval, hosted smoke and recovery remain separate gates under the
[current execution amendment](../phases/roadmap-execution-authorization.md).

## Commands and prerequisites

Root npm wiring is `prepare:release: node scripts/prepare-release.mjs`. After reviewing and committing the preparation
tooling, run from a clean checkout with the pinned Node/npm versions, full Git history, Docker available and both exact
tested images retained locally:

```sh
npm run prepare:release -- --report .artifacts/e2e-result.json
```

Prefer the unique `.artifacts/mp3-e2e-<run-id>.json` when multiple test runs exist. The selected report must be inside
the checkout's ignored artifacts. No source/version/image override, provider option or promotion command exists. The
script never rebuilds, retags, loads or pushes an image; it runs `docker image inspect` and `docker image save` by
immutable local image ID. `DOCKER_CONFIG` remains caller-owned and is never copied into output.

The report must show clean source, a passed full local suite, zero failed/skipped cases and successful cleanup. The
script verifies that exact source Git object and its independently committed frozen suite tree/fixture hash, then
verifies both Docker image IDs and `linux/amd64`. The tested source may be an ancestor of the current tooling checkout.
`sourceRevision` identifies the tested product; `preparationRevision` identifies the committed preparation tooling.
Neither field is silently replaced with the other.

## Version preview and immutable local reservation

The routine preview uses the tested source's [release policy](version-policy.md):
`0.<approved minor>.<global first-parent source ordinal>`. VER-01 initially selects `0.1`; a separate reviewed
activation changes the line. Full history is mandatory. Policy never introduced on that source's history retains legacy
allocation; policy deletion after introduction fails. The source policy, not tooling HEAD or an override, supplies the
version. A feature branch's ordinal remains provisional and this command never publishes it. Root package version and
Git refs are unchanged.

Policy-bound reservations include the exact policy digest/line and use manifest schema 2. Pre-policy schema-1
identities, notes and retry bytes remain unchanged. Preparation resolves the report's source independently and rejects a
mismatched policy, schema or source before image inspection/export.

Before any output creation, the script rejects symlinks in `.artifacts`, `releases`, version-directory and report-parent
components, including links to other directories inside the repository. This keeps archive bytes in their ignored
artifact location and fails before creating children in a redirected target.

Preparation atomically creates `.artifacts/releases/<version>/` and writes:

| File                                    | Meaning                                                                             |
| --------------------------------------- | ----------------------------------------------------------------------------------- |
| `reservation.json`                      | Exact tested source, suite, image pair and configuration identity reserved locally. |
| `api.docker.tar`, `frontend.docker.tar` | Docker exports of the exact tested local image IDs.                                 |
| `SHA256SUMS`                            | SHA-256 for each exported archive.                                                  |
| `release-notes.md`                      | Deterministic local notes with identities and explicit undeployed status.           |
| `manifest.json`                         | Completion record written last; always `prepared-local`, `deployable: false`.       |

A completed identical reservation is reused after validating its metadata, notes, checksums and actual archive bytes.
The original preparation revision remains preserved; command output separately records the current verifying revision. A
changed source, ordinal, image, suite, configuration, archive or metadata fails. No existing file is overwritten or
re-exported. A failed/aborted export leaves an incomplete directory without a completed manifest; preserve and inspect
it before any separately chosen cleanup. Concurrent invocations cannot both reserve the same new directory.

These are local integrity records, not signed attestations or tamper-proof storage against the repository owner. Keep
the source report and bundle together. No retention service or registry policy has been configured, so local export
alone does not establish durable production recovery.

## Identities that must remain distinct

- `localImageId` is the immutable local Docker identifier observed by the acceptance controller. Do not infer its
  descriptor type from the hash alone: the current Docker 29 exports use OCI index blob identities, with distinct child
  image-configuration hashes. This field preserves the observed identity without claiming it is a config-object ID.
- `archiveSha256` identifies the exported Docker archive bytes. It is checked independently of the image ID.
- `registryDigest` remains `null` until a future authorized registry operation actually observes its published digest.
  It may legitimately equal `localImageId` when the same OCI index bytes are published; separate evidence is required,
  not unequal hash values.
- `localAcceptanceConfigurationSha256` identifies the specific local Compose test configuration, including its isolated
  names/ports. It is not a cloud configuration hash.
- The source configuration fingerprint hashes exact Git bytes for Compose, Dockerfiles, build ignore files and the NGINX
  template/entrypoint. Its inputs contain repository-relative paths only.
- `providerConfigurationSha256`, provider identity, candidate and production approval stay `null` in local preparation.

A rerun of application E2E can change its isolated local configuration and image IDs. Use the intended exact report; a
differently bound report cannot silently replace a prior reservation for the same version preview.

## Future evidence consistency checks

`release-manifest.mjs` also exports `validatePromotionEvidence`. It checks supplied records for complete protected-main
checks, a protected-main baseline, exact artifacts/configuration, provider fit/budget/access fields, unchanged full
candidate-suite identity/counts and explicit approval bound to the release pair plus production configuration.
Provisional baselines, missing/failed/skipped checks, stale ordinals and changed artifacts/configuration fail.

This pure function observes no remote state and grants no authority. Even synthetic records can satisfy its shape and
consistency rules; an operator must independently obtain authentic evidence and authorization. A successful return does
not modify the local manifest's `deployable: false`, perform promotion or establish deployment. There is deliberately no
placeholder successful deployment workflow or CLI action.

The independent baseline is already merged separately and bound to protected main at `a0a56d9`. For the active
release-only milestone, validate the eventual merged product revision and observe its automatic GitHub release with
exact tested archives. The stricter publication workflow is described in the [release-only process](release-only.md).
Future deployment still requires provider fit, access and budget, registry identities, full candidate acceptance, exact
production approval, hosted smoke and recovery; see the [deferred deployment runbook](runbook.md). Local preparation
establishes none of those remote observations.
