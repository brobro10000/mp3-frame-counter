# Docker release image-store compatibility

The [received-release guide](local-handoff.md#run-a-received-release-with-docker) normally uses the published
`artifacts.<service>.localImageId`. This identifies the Docker image configuration. A containerd image store can expose
the loaded OCI manifest digest as `docker image inspect`'s `Id` instead. These are different content identities; the
release's configuration ID, archive checksum and any registry digest retain their original meanings.

Keep the normal path when both published IDs are inspectable and match `linux/amd64`. If inspection fails or differs,
stop before startup and verify the chain below. Do not guess an ID, use a mutable tag, rebuild, pull another image or
change the release evidence. Background references are Docker's
[containerd image-store documentation](https://docs.docker.com/engine/storage/containerd/) and Moby's
[containerd image inspection implementation](https://github.com/moby/moby/blob/master/daemon/containerd/image_inspect.go).

## Verify a containerd-loaded image

First verify both archive checksums and load them using the primary guide. `SHA256SUMS` covers the two Docker archives;
it is not an image identity or a signature. Keep the same-tag source directory and verified assets together. The steps
below use only Docker, `tar` and `shasum` or `sha256sum`; no Node, jq or Python is required.

Repeat this procedure for **each** service, API and frontend. Start with the API archive and copy its complete published
configuration ID from the release's `manifest.json`. The `docker load` output supplies a candidate loaded ID, which is
not trusted until every comparison below passes. Replace all placeholders with exact values:

```sh
set -e
archive="$release_bundle/api.docker.tar"
published_config='sha256:REPLACE_WITH_API_LOCAL_IMAGE_ID'
loaded_manifest='sha256:REPLACE_WITH_CANDIDATE_LOADED_ID'
tar -xOf "$archive" manifest.json
tar -xOf "$archive" index.json
```

The archive's `manifest.json` must contain exactly one image entry. Copy its `Config` member path into `config_member`
below. The archive's `index.json` must contain exactly one manifest descriptor, with its `digest` equal to
`loaded_manifest`. Stop if either is absent, ambiguous or mismatched. These archive metadata files are distinct from the
release's top-level `manifest.json`.

```sh
config_member='REPLACE_WITH_EXACT_ARCHIVE_CONFIG_MEMBER'
manifest_member="blobs/sha256/${loaded_manifest#sha256:}"
tar -xOf "$archive" "$manifest_member"
if command -v shasum >/dev/null 2>&1; then
  tar -xOf "$archive" "$config_member" | shasum -a 256
  tar -xOf "$archive" "$manifest_member" | shasum -a 256
else
  tar -xOf "$archive" "$config_member" | sha256sum
  tar -xOf "$archive" "$manifest_member" | sha256sum
fi
docker image inspect "$loaded_manifest" \
  --format '{{.Id}} {{.Descriptor.digest}} {{.Os}}/{{.Architecture}}'
```

Compare the printed values manually; **do not proceed on a failed command or comparison**:

1. The configuration member's SHA-256 must equal `published_config` without its `sha256:` prefix.
2. The OCI manifest blob's SHA-256 must equal `loaded_manifest` without its `sha256:` prefix. This authenticates the
   single descriptor's referenced content within the checksummed archive.
3. The printed OCI manifest's `config.digest` must equal the complete `published_config`.
4. Docker inspection's `Id` and `Descriptor.digest` must both equal the complete `loaded_manifest`, and its platform
   must be `linux/amd64`. ARM hosts still require working Docker emulation.

Only after all four checks pass, set `API_IMAGE` to this verified loaded manifest ID. Repeat with `frontend.docker.tar`,
the frontend's published configuration ID and its loaded manifest ID; then set `FRONTEND_IMAGE`. Keep both variables
exported. Use the primary guide's unchanged `compose.yaml` plus `compose.release.yaml` startup, diagnostics and cleanup
commands with `--no-build` and `--pull never`. The override accepts verified runtime references; it does not rewrite the
published configuration IDs.

The [optional engineer verifier](local-handoff.md#optional-engineer-verification-with-node-and-git) validates classic
configuration IDs. Its rejection on this image store remains valid evidence of that interface limitation. Use this
manual chain and the primary release override instead; do not silently weaken `verifyImageInspection`.

## Recorded local walkthrough — 2026-10-11

The operator verified all ten assets and same-tag source for
[v0.3.57](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.3.57), source
`c7a5ba6e878229579647c5dbefc44c80ae7b3039`. The original published-ID inspection failed on Docker's containerd store.
Retained archive checks established these mappings, including matching configuration hashes, OCI manifest bindings,
root-filesystem layer identities and loaded `linux/amd64` inspection:

| Service  | Published configuration ID                                                | Verified loaded OCI manifest ID                                           |
| -------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| API      | `sha256:3a90437c8bebde1d380eabb8b0a8e7263d332cffde7cd62be2a9d4b682b309a1` | `sha256:177344eac1ce82cf0d7bef202b6f5eebe6e6ec2ffea61b0905322896721df70f` |
| Frontend | `sha256:4cb06d96f4b1ec6779b99b0e493e900ad400d4468665949c6d0499c3721ae3ce` | `sha256:a98fad2a75455c505361c5c92cb771faa187dc81fd34a8eede821aa44e04aaa6` |

Using those verified references, the received images started without building or pulling. Both non-root containers
became healthy; the nine-frame fixture returned `{"frameCount":9}` and the UI showed nine frames. Redoc rendered and the
specification was available. No page errors, CSP violations or external requests were observed; an optional favicon
request returned 404. Scoped cleanup removed the release containers and retained assets/images.

The private operator records `image-store-compatibility.json`, `handoff-verification.json` and `browser-smoke.log`
preserve the original failure and successful mapped startup. The browser smoke alone does not verify release assets; the
separate archive/source checks provide that binding. This walkthrough did **not** rerun full acceptance or verify hosted
deployment or production v1.0.0. Its specific IDs are historical evidence, not defaults for another release.
