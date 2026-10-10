# Independent fixture provenance

All committed encoded audio is newly generated mathematical sine waves, created for this repository. The base64 files
and structural fixture recipes are dedicated under **CC0-1.0**; no assessment audio, downloaded song, third-party
recording or private filename is included. Decoding the base64 yields the exact recorded bytes without requiring an
encoder in CI. The fixed [manifest](manifest.json) contains lengths, hashes and expectations; tests never infer answers
from application output.

Acquisition on 2026-10-09 used FFmpeg/FFprobe **9.0.2**, Homebrew formula revision 9.0.2_1, libmp3lame, and MediaInfoLib
**26.10**. The commands below were run with outputs in ignored scratch space; FILE refers to that particular output. The
encoder's `-frames:a` input bound does not equal the flushed MP3 packet count. Actual independently observed packet
counts below establish expectations.

```sh
ffmpeg -v error -f lavfi -i 'sine=frequency=440:sample_rate=48000' -frames:a 7 \
  -c:a libmp3lame -b:a 128k -reservoir 0 -write_xing 0 -id3v2_version 0 -map_metadata -1 tone-cbr.mp3
ffmpeg -v error -f lavfi -i 'sine=frequency=660:sample_rate=44100' -frames:a 13 \
  -c:a libmp3lame -q:a 4 -reservoir 0 -write_xing 1 -id3v2_version 0 -map_metadata -1 tone-vbr.mp3
ffmpeg -v error -f lavfi -i 'sine=frequency=880:sample_rate=44100' -frames:a 19 \
  -c:a libmp3lame -b:a 192k -reservoir 0 -write_xing 0 -id3v2_version 0 -map_metadata -1 tone-padded.mp3
mediainfo --Full --Output=JSON "$FILE"
mediainfo --Inform='Audio;%FrameCount%' "$FILE"
ffprobe -v error -select_streams a:0 -show_packets -show_entries packet=pos,size -of json "$FILE"
ffmpeg -v error -i "$FILE" -f null -
```

| Fixture     | Bytes  | MediaInfo | FFprobe audio packets | Complete metadata frames | Physical expectation |
| ----------- | ------ | --------- | --------------------- | ------------------------ | -------------------- |
| tone-cbr    | 3,456  | 9         | 9                     | 0                        | 9                    |
| tone-vbr    | 2,160  | 15        | 15                    | 1 Xing                   | 16                   |
| tone-padded | 13,165 | 21        | 21                    | 0                        | 21                   |

All three are MPEG-1 Layer III and decoded successfully with exit zero and no FFmpeg error output. CBR uses 48 kHz, nine
contiguous 384-byte packets from offset zero to EOF. The padded tone uses 44.1 kHz, contiguous 626/627-byte packets from
zero to EOF. VBR uses 44.1 kHz: its complete first MPEG frame is 182 bytes; the fifteen contiguous audio packets start
at offset 182, have lengths 104/261/365, total 1,978 bytes and end at byte 2,160. Its first header is `fffb40c0`, giving
`floor(144 * 56000 / 44100) = 182`; the frame contains Xing metadata.

[MediaInfo's versioned implementation](https://github.com/MediaArea/MediaInfoLib/blob/v26.10/Source/MediaInfo/Audio/File_Mpega.cpp)
explicitly excludes the Xing/Info frame from its reported metadata count. The physical contract includes every complete
MPEG frame. The extra one is established from packet offsets and bytes, not inferred from product behavior. No second
parser was written to determine fixture or sample expectations.

The remaining cases are **structural fixtures**, not claims of decodable audio. `lib/fixtures.ts` constructs literal
headers and explicit lengths; it does not parse headers or calculate answers from arbitrary inputs. For example,
`fffb9400` denotes a 384-byte MPEG-1 Layer III frame at 128 kb/s and 48 kHz. Different headers/lengths exercise bitrate,
padding, sample-rate, channel and protection changes. A payload containing header-like bytes remains one frame. Xing
metadata deliberately claiming 999 frames inside two complete frames must still produce two.

Large fixtures use repetition rather than committed large audio files:

- Above 1 MiB: `3,000 * 384 = 1,152,000` bytes, count 3,000.
- Exactly 6 MiB: `16,384 * 384 = 6,291,456` bytes, count 16,384.
- Exactly 20 MiB: `54,613 * 384 + 128 = 20,971,520` bytes, count 54,613; the last 128 bytes are ID3v1.
- Over limit: the exact-limit bytes plus one byte, which must yield 413 rather than a parser result.

Malformed and unsupported cases have fixed isolated constructions. The fixture checker verifies every SHA-256 and byte
length without changing the manifest. Any change to bytes, recipe, expected count/error or tolerances requires an
independently reviewed baseline amendment. See [CC0](https://creativecommons.org/publicdomain/zero/1.0/legalcode) for
the fixture dedication terms.
