# Toolchain pins

Verified from official sources on 2026-10-09. Do not update pins without reviewing the upstream release and rerunning
local and CI validation.

| Tool                    | Selected version                    | Official source                                                                                                          |
| ----------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Node.js                 | 24.20.0, Krypton LTS                | [release](https://nodejs.org/en/blog/release/v24.20.0), [supported lines](https://nodejs.org/en/about/previous-releases) |
| npm                     | 11.19.0, bundled with selected Node | [Node distribution index](https://nodejs.org/dist/index.json)                                                            |
| Prettier                | 3.9.9                               | [npm registry](https://registry.npmjs.org/prettier/3.9.9)                                                                |
| YAML parser             | 2.9.1                               | [official repository](https://github.com/eemeli/yaml), [npm registry](https://registry.npmjs.org/yaml/2.9.1)             |
| actionlint              | 1.7.12                              | [release](https://github.com/rhysd/actionlint/releases/tag/v1.7.12)                                                      |
| actions/checkout        | 7.0.1                               | [release](https://github.com/actions/checkout/releases/tag/v7.0.1)                                                       |
| actions/setup-node      | 7.1.0                               | [release](https://github.com/actions/setup-node/releases/tag/v7.1.0)                                                     |
| actions/upload-artifact | 7.0.2                               | [release](https://github.com/actions/upload-artifact/releases/tag/v7.0.2)                                                |

Actions use full release commit SHAs with version comments in the workflow. All selected Actions run on Node 24.
GitHub-hosted runners supply their supported runner runtime; this project does not maintain self-hosted runners.
Dependabot covers the npm and GitHub Actions ecosystems actually used. Node, npm and the standalone actionlint binary
are reviewed manually; Dependabot does not update the actionlint checksum constants.

The actionlint wrapper supports macOS and Linux on x64 and arm64. It verifies official release SHA-256 values before
caching downloaded archives, extracting or running the executable. Cached archives are checked on every invocation; an
invalid cached archive fails with its path and a removal/retry instruction, without running its contents. Unsupported
platforms fail before creating a cache or downloading a binary.

```text
5b44c3bc2255115c9b69e30efc0fecdf498fdb63c5d58e17084fd5f16324c644  actionlint_1.7.12_darwin_amd64.tar.gz
aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f  actionlint_1.7.12_darwin_arm64.tar.gz
8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8  actionlint_1.7.12_linux_amd64.tar.gz
325e971b6ba9bfa504672e29be93c24981eeb1c07576d730e9f7c8805afff0c6  actionlint_1.7.12_linux_arm64.tar.gz
```

These were compared with the release API digests, the
[published checksum file](https://github.com/rhysd/actionlint/releases/download/v1.7.12/actionlint_1.7.12_checksums.txt),
and independently hashed archive downloads. npm package integrities are committed in `package-lock.json`.

The locally installed MVP Orchestrator version is **1.3.0**, read from its installed `.codex-plugin/plugin.json`. No
upgrade was performed. Its supported schema-v1 route emits `0.1.0` compatibility fields; those are deliberately
preserved. The private plugin's source, validators and templates are not vendored or required by ordinary CI.
