# Assessment sample

Asset ID: **APP-ASSET-001**. Requirements: [APP-REQ-003 and APP-REQ-006](../assessment.md).

The user supplied this file in the parent directory and authorized relocating it beside the requirements. It was moved
without changing its bytes on **2026-10-09**.

| Property                                        | Value                                                                       |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| Current local path, relative to repository root | `docs/requirements/samples/assessment-sample.mp3`                           |
| Original location                               | Parent directory of this repository, filename `sample (2).mp3`              |
| Size                                            | 1,458,172 bytes                                                             |
| SHA-256                                         | `97707a18a58ba75122b1668f5ed738f090121343432d9172a6409ddfa4fc5ab3`          |
| Expected frame count                            | Not supplied or independently verified.                                     |
| Git / delivery status                           | Ignored by `*.mp3`; not tracked or included in foundation source artifacts. |

The local `file` utility identified ID3 v2.4 metadata and MPEG Layer III, version 1 audio at 64 kbps, 44.1 kHz, stereo.
This is an initial file-identification observation, not validation of every frame or an expected frame count. The
[assessment source](../sources/assessment.html) also describes the supplied sample as MPEG Version 1 Audio Layer 3.

From the repository root, verify local identity with:

```sh
shasum -a 256 docs/requirements/samples/assessment-sample.mp3
git check-ignore -v docs/requirements/samples/assessment-sample.mp3
```

A fresh clone does not include the sample. Place a copy of the supplied file at the documented local path and check its
SHA-256 before using it as this asset. Do not commit it, overwrite it with generated fixtures, or infer a reference
frame count from the parser being tested. Record a separate independent count and method when available.
