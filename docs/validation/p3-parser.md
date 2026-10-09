# P3 parser handoff

Observed on **2026-10-09**. The pure parser and focused unit tests are locally validated against the independent r3
contract. This record describes the uncommitted P3 handoff built on local commit
`56bb520f6dcab647cc301cf456863d41fe782a66`; the source hashes below identify the exact tested files. Independent P3
review, protected-main baseline freeze, integration and shipping remain separate controller-owned gates.

Trace: APP-V1-004,005,009,010,013,016.

## Preserved independent baseline

Before creating parser source, the implementer read the baseline record and verified the existing acceptance Git tree
and fixture manifest:

- Reviewed test-only local commit: `28c2a9c548f872dac54d9395a8ca0ed852f82240`.
- Acceptance tree: `b789ffe426f4d0a303144338923748c9cdf424cf`.
- Fixture manifest SHA-256: `2f56db4641f9e5c09b34c2bc0c630e85a46a010025c634375b110a35e2cb120a`.
- Contract: [acceptance r3](../testing/acceptance-contract.md).

The controller's [baseline record](../testing/baseline.json) identifies the prior independent coverage and isolation
reviews. This local baseline is expressly provisional until the separate test-only scope merges and its unchanged tree
is bound to the actual trusted-main SHA. The P3 implementation does not establish that shipping prerequisite. No
acceptance source, count, fixture, contract, manifest, gate or baseline record was edited by the parser implementer.

## Implementation boundary

`server/src/mp3.ts` exports `countMp3Frames(bytes: Buffer): number`. It walks from the accepted starting offset to EOF
using each header's MPEG-1 Layer III bitrate, sample rate and padding. It requires complete frames and at least one
frame, counts complete Xing/Info/VBRI-bearing frames as ordinary physical frames, and never uses metadata totals,
duration estimates or corruption resynchronization. Payload and CRC bytes are opaque. Parameter changes follow r3.

One flags-zero ID3v2.3.0/v2.4.0 record may precede the frames. A single 128-byte ID3v1 record may follow the last frame.
ID3 version, revision, reserved flag bits, synchsafe size and bounds receive explicit checks. Recognized unsupported
versions/flags/layouts throw an unsupported failure. Reserved header values and incomplete supported data throw a
malformed failure. A `TAG` marker is recognized only at a walked frame boundary, so a marker inside a complete final
frame cannot cause truncation. Metadata alone never produces a successful zero-frame result.

`server/src/errors.ts` exports `Mp3ParseError` with a readonly `kind` of `malformed` or `unsupported`. Error messages
are fixed readable strings and never reflect input bytes. The parser has no transport, filesystem, network or external
parser dependency, does not mutate or copy the complete input, and keeps constant-sized traversal state. HTTP status and
the 20 MiB transport cap belong to P4; no API, UI, image or provider source is part of this parser handoff.

## Actual checks

Using Node **24.20.0**, npm **11.19.0** and the controller-installed TypeScript **7.0.2**:

```sh
node --test tests/unit/mp3.test.ts
npm run typecheck
npm run build
node node_modules/prettier/bin/prettier.cjs --write server/src/errors.ts server/src/mp3.ts tests/unit/mp3.test.ts
git diff -- tests/acceptance docs/testing/acceptance-contract.md docs/testing/baseline.json
```

All commands exited zero. Typecheck/build used the root strict compiler configuration. The formatter reported all three
files unchanged. The restricted Git diff was empty.

The unit run passed **56 tests**, with **0 failures, 0 skipped and 0 cancelled**:

- 45 independently frozen parser cases passed with exact fixture size/hash, expected count/error kind and unchanged
  input hash. The HTTP-only 413 fixture is deliberately outside this pure parser test matrix.
- The three independently characterized audio inputs produced physical counts **9, 16 and 21**.
- The complete exact-limit structural fixture produced **54,613** frames for **20,971,520** bytes. Other frozen cases
  exercised CBR/VBR, padding, parameter/protection changes, supported tags, payload sync bytes, metadata counts,
  malformed/truncated data and unsupported formats.
- Eleven additional focused cases exercised a false trailing `TAG` inside payload, other payload markers, empty
  supported tags, tag-only input, nonterminal/multiple tags, no corruption recovery, every synchsafe-size byte position,
  defined versus reserved flags, unsupported metadata boundaries, exact marker bytes and typed non-reflective errors.

No application HTTP or browser acceptance ran as part of P3. These tests establish framing behavior for the stated
subset, not audio decoding, CRC validity, aggregate memory budgets, service latency or managed-provider behavior.

## Supplied sample comparison

A local inline Node check read only the ignored repository-relative sample, rechecked its identity, and compared both
the TypeScript source export and compiled `dist/mp3.js` export against the existing independent expectation:

| Observation          | Actual result                                                    |
| -------------------- | ---------------------------------------------------------------- |
| Bytes                | 1,458,172                                                        |
| SHA-256              | 97707a18a58ba75122b1668f5ed738f090121343432d9172a6409ddfa4fc5ab3 |
| Independent expected | 6,090 physical frames                                            |
| TypeScript parser    | 6,090                                                            |
| Compiled parser      | 6,090                                                            |
| Assertion process    | Exit 0                                                           |

The [unchanged oracle record](sample-baseline.md) explains MediaInfo's 6,089 audio-frame result plus one complete
Xing-bearing frame. No adjustment or special case exists in the parser. Sample bytes remain ignored and are not a unit
test or CI dependency. P4 still needs the actual public upload comparison.

## Tested source identity

The following SHA-256 values were measured after the successful unit/build/typecheck runs and the unchanged formatter
result. Root tooling changes are owned and validated separately by the controller.

```text
3d0f27e2e3df5b81fbb73ee2f7c24ea9dd333ac4e55c01be37de921d2c22172d  server/src/errors.ts
b1a0182ae8437d234654b595846fa63765a232506ba6ff2ebd5ca5ae62ac5d41  server/src/mp3.ts
940961ef4b81fa2d662ace56297fda28f3c324b9c501f25949071584e45cbc0e  tests/unit/mp3.test.ts
```

Independent reviewer `review_unified_coverage` inspected the final files and verified these hashes with no actionable
findings. The controller then ran `node scripts/run-ci-phase.mjs`: extraction and checks of the frozen suite, all 56
unit tests and the build passed. This permits provisional local P4 integration. The protected-main baseline requirement
still blocks shipping CI and release. This record claims no GitHub approval, merge, deployment or full MVP completion.
