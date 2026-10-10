# Assessment sample baseline

Status: independent P2 oracle recorded on **2026-10-09 before product code**. The physical-frame expectation is
**6,090**. MediaInfo's reported count is **6,089**, excluding the complete Xing-bearing first MPEG frame; the byte and
packet reconciliation below explains the difference without using application output.

| Field                          | Observed value                                                   |
| ------------------------------ | ---------------------------------------------------------------- |
| Requirement                    | APP-ASSET-001, APP-V1-009, APP-OPEN-005                          |
| Local repository-relative file | docs/requirements/samples/assessment-sample.mp3                  |
| Bytes                          | 1,458,172                                                        |
| SHA-256                        | 97707a18a58ba75122b1668f5ed738f090121343432d9172a6409ddfa4fc5ab3 |
| MediaInfoLib                   | 26.10                                                            |
| MPEG identity                  | MPEG Audio, Version 1, Layer 3, VBR, 44,100 Hz                   |
| MediaInfo FrameCount           | 6,089                                                            |
| MediaInfo Source_FrameCount    | Empty/not reported                                               |
| Independent physical count     | 6,090                                                            |
| FFprobe                        | 9.0.2                                                            |
| Product parser/upload result   | Not implemented or run at P2 baseline establishment.             |

The file remains ignored and excluded from source artifacts. A clone has this record rather than the private bytes. No
personal path or original private filename is required. Full oracle outputs are kept only in ignored scratch space.

## Actual acquisition commands

```sh
FILE="docs/requirements/samples/assessment-sample.mp3"
shasum -a 256 "$FILE"
wc -c < "$FILE"
mediainfo --Version
mediainfo --Full --Output=JSON "$FILE"
mediainfo --Inform='Audio;%FrameCount%' "$FILE"
ffprobe -v error -select_streams a:0 -show_packets -show_entries packet=pos,size -of json "$FILE"
ffmpeg -v error -i "$FILE" -f null -
```

MediaInfo and FFmpeg were installed using the explicitly authorized host-tool acquisition. The observed CLI versions are
pinned here as acquisition provenance; CI consumes independent committed fixtures without either executable. FFmpeg
decoded this identified sample with exit zero and no error output. Hash and size were also verified using the
standard-library SHA-256 and byte-length equivalents during acquisition.

## Physical-count reconciliation

The first ten bytes are `49443304000000000022`: ID3v2.4.0, flags zero, body size 34. Its ten-byte header and body occupy
44 bytes. The first MPEG header at offset 44 is `fffb5000`, indicating MPEG-1 Layer III, 64 kb/s, 44,100 Hz, no padding.
Its complete frame length is `floor(144 * 64000 / 44100) = 208` bytes. That frame contains Xing metadata and its
declared 6,089 audio-frame count.

FFprobe reports 6,089 audio packets beginning at offset 252 (`44 + 208`). The packets are contiguous, total 1,457,920
bytes and end at byte 1,458,172, exactly EOF. Their lengths are 104, 130, 156, 182, 208, 261, 313, 365, 417 and 522
bytes. The final packet begins at 1,458,068 and occupies 104 bytes. No trailing ID3v1 marker is present.

Thus `44 + 208 + 1,457,920 = 1,458,172` accounts for every byte, and `1 + 6,089 = 6,090` accounts for every complete
physical MPEG frame. This uses independent demuxer packet boundaries and a single directly inspected metadata frame; no
second product-style frame parser was authored as an oracle.

[MediaInfo 26.10's MPEG implementation](https://github.com/MediaArea/MediaInfoLib/blob/v26.10/Source/MediaInfo/Audio/File_Mpega.cpp)
records Xing/Info presence and explicitly excludes that metadata frame from its reported frame count. The application's
[frozen contract](../testing/acceptance-contract.md) includes complete metadata-bearing MPEG frames. No unconditional
sample-specific correction is permitted in application code.

## Later product comparison

P3 and P4 must compare their actual parser and public upload results against physical count 6,090 while preserving the
independently observed MediaInfo value 6,089. Record tested revisions and actual results in phase evidence; this P2
record itself does not claim application correctness. Portable CI relies on the separately characterized original tones
and structural fixtures in `tests/acceptance/`, not this private asset.
