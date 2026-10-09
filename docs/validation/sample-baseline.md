# Assessment sample baseline

Status: sample identity recorded; **independent MediaInfo baseline is pending**. This planning pass did not run
MediaInfo or a parser. `mediainfo` was not found on PATH on 2026-10-09; no host package was installed.

| Field                                       | Observed value                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| Requirement                                 | APP-ASSET-001, APP-V1-009, APP-OPEN-005                                       |
| Repository-relative local path              | `docs/requirements/samples/assessment-sample.mp3`                             |
| Size                                        | 1,458,172 bytes; recheck in the execution environment.                        |
| SHA-256                                     | `97707a18a58ba75122b1668f5ed738f090121343432d9172a6409ddfa4fc5ab3`            |
| MediaInfo version                           | Not observed; executable unavailable.                                         |
| MediaInfo MPEG format                       | Not observed. Earlier file-identification metadata is not MediaInfo evidence. |
| MediaInfo reported FrameCount               | Not observed; do not substitute zero.                                         |
| Independently accepted physical frame count | Pending inspection and counting-convention reconciliation.                    |
| Parser / integrated result                  | Not implemented or measured.                                                  |

The MP3 is local and ignored. A clone contains this record, not the file. See the
[sample identity record](../requirements/samples/README.md); do not assume another machine has these bytes.

## P2 independent baseline procedure

After verifying tool availability and CLI support, use the same identified file for every comparison. Proposed commands
below are examples to verify against the available CLI, not evidence that they ran:

```sh
FILE="docs/requirements/samples/assessment-sample.mp3"
shasum -a 256 "$FILE"
wc -c < "$FILE"
mediainfo --Version
mediainfo --Full --Output=JSON "$FILE"
mediainfo --Inform='Audio;%FrameCount%' "$FILE"
```

Record the actual commands, tool version, MPEG identity, reported count and a compact portable summary. Keep full output
with absolute paths in ignored `.mvp-workflow/` scratch space. Preserve sample bytes; do not commit or embed them in
images. If output is absent or ambiguous, report a blocker rather than manufacturing a baseline.

## P3 parser and P4 integrated comparisons

Repeat the comparison after standalone parsing and through the frontend upload URL. Record the tested revision,
application result, MediaInfo result and any difference under the documented physical-frame convention. Investigate
Xing/Info or metadata differences using primary documentation/source. No sample-specific +1/-1 adjustment is acceptable.
Reviewed real-audio and clearly labeled structural fixtures form the independent basis for CI; MediaInfo never computes
the runtime answer. See the unified [acceptance plan](../testing/acceptance-contract.md).
