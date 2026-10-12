# Final independent submission review

**Engineering verdict: Not ready to submit against the employer's full MPEG-1 requirement without resolving the
supported-format gap.** The supplied sample and advertised subset work. Valid MPEG-1 free-format and ID3v2.4
extended-header/footer inputs are rejected; documentation is not employer approval of that restriction.

Reviewed on **2026-10-12 UTC**: committed candidate `2971620040a0c5a89292de5e12e9132760508e9c`, tree
`f587c361e1ddb11fc430f531122f4178547b5540`. Its tree exactly matches merged main
`bd2442a2e9e123a27f37d36d973f572be65a9599`. The candidate stayed unchanged and clean; this final handoff changes
documentation/comments separately. No submitted artifact or employer acceptance is inferred. The preceding main
[CI run](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38199238234) passed and published
[v0.4.67](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.4.67); fresh local tests below are separate
evidence.

## What was independently verified

| Boundary                       | Result                                                                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing checks                | 269 server + 70 frontend unit cases; typecheck, source/workflow lint, builds, formatting and OpenAPI lint passed.                                                      |
| Required local acceptance      | 72/72 passed, zero skipped, using bound `backend-audio-v1`; exact source, suite and image identities retained.                                                         |
| Independent parser probes      | 101/101 supported structural cases and all COUNT-01–08 transformations passed; two negative controls detected faults.                                                  |
| Independent API/browser probes | 91 assertions passed across real ingress, native sockets, internal-result injection, browser, Redoc, limits, timeouts and controlled proxy faults.                     |
| Startup/handoff                | `make up`, `make health`, the documented nine-frame fixture/curl, `make smoke` and scoped `make down` passed on macOS ARM Docker.                                      |
| Count origin                   | Header-derived complete-frame traversal; declarations never determine counts, allocation or termination. No runtime parsing delegation.                                |
| Sample oracle                  | SHA-256 matches the sample record; FFprobe enumerated 6,089 contiguous audio packets. ID3 44 bytes + Xing carrier 208 bytes + audio 1,457,920 bytes = 1,458,172 bytes. |
| Documentation                  | Real Redoc response/example interactions, resolved local specification references, no external asset requests or CSP errors in the observed load.                      |

Counts are not additive proof of quality. `make e2e` also reruns the unit alias; those are the same 339 cases, not
another independent suite. A mistaken reviewer browser selector and initial package-import failure are preserved in raw
logs; the corrected actual Redoc tab interactions passed. The `Expect` discrepancy below remains a recorded failed claim
probe.

## Findings and decisions

1. **P2 requirement gap — supported MPEG-1 subset.** A LAME-encoded free-format tone decoded successfully but returned
   `MP3_UNSUPPORTED_FORMAT`; valid ID3v2.4 extended-header/footer wrappers decoded and exposed 11 audio packets but
   returned `MP3_UNSUPPORTED_METADATA`. Rejection occurs in `decodeMpegHeader` and `firstFrameOffset` in
   [mpeg.ts](../../server/src/modules/mp3/mpeg.ts). The employer excludes other MPEG versions/layers, not these valid
   MPEG-1 layouts. Resolve the scope with the employer or separately authorize a bounded implementation and independent
   regression cases. Product behavior is frozen in this handoff.
2. **P2 decision risk — metadata carrier convention.** The owner-selected result is 6,089 audio frames; the same sample
   has 6,090 physical frames. Both are independently explained. Employer agreement on exclusion remains unverified;
   neither value is automatically an arithmetic defect. See the [sample record](../requirements/samples/README.md).
3. **P3 documentation scope — `Expect`.** Unsupported expectations receive 417 from the native API but NGINX consumes
   the header and returns normal success for the same valid upload. The generated same-origin specification lists 417
   without that distinction. The [API README](../../server/README.md) now clarifies the boundary; executable OpenAPI
   source remains frozen. This does not block the employer's endpoint/count requirement.
4. **Accepted F-004 checker limitation.** The existing partial OpenAPI matcher does not enforce `multipleOf` completely.
   It was not repaired or waived anew.
   [The original exception](known-gaps.md#accepted-documentation-checker-limitation--2026-10-12) remains visible;
   passing checks are not proof of a complete schema validator.

All 14 evaluation questions are addressed in the [root README](../../README.md#evaluation-at-a-glance) and
[detailed evaluation](evaluation.md). The broad-format requirement remains partial; optional architecture or tooling
does not compensate for it. Receipt date, actual external submission, personal authorship and interview understanding
were not verified.

## Measured envelope and limits

The local API had one CPU and 256 MiB memory; NGINX had half a CPU and 64 MiB. Three exact-20-MiB dense uploads took
91.51, 100.50 and 100.10 ms end to end; two concurrent limit uploads completed in 169.74 and 176.45 ms. Two held uploads
caused a third to receive 503, then capacity recovered. Known-length and chunked exact-limit requests passed; one byte
over returned 413. Actual idle/total deadlines returned 408 around 10/30 seconds and allowed later successful uploads.

Process memory high-water was 163,024 KiB (~159.2 MiB); cgroup peak was 115,740,672 bytes, a different accounting
measure. These are short local observations including proxy/copy/parser overhead, not sustained throughput, isolated
parser latency, percentile targets or a leak study. Whole-body buffering and synchronous parsing remain explicit
tradeoffs.

Independent probes did not repeat every original test: no full tooling suite, malformed-wire matrix, 64-socket limit,
missing-docs startup fault, browser 45-second timer/unmount test, Windows/Linux host run or hosted fault test was added.
No production deployment was tested. [Cloud teardown](../deployment/decommission.md) is separate from application
correctness; ordinary startup needs no Terraform, cloud account or private sample.

## Evidence and reproducibility

The owner retains the external `mp3-independent-review/` bundle: `review.md` has the nine requirement rows and all 14
criterion verdicts; `test-plan.md` preserves pre-execution expectations; `results.json`, `performance.json`,
`reproduce.md`, `probes/` and `evidence/` retain commands, actual observations and reproduction recipes. Private sample
bytes, secrets and local filesystem paths are not published in this repository. Key immutable result hashes:

| Artifact              | SHA-256                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `parser-results.json` | `44e539861d0141569c70f9ed98d768c3d76ddc7b2a0e776d45e0dad7aa2464f9` |
| `api-results.json`    | `31f0159eccf6e766b562dbed9d0165a7679eaaa1e88b0df4e5697bf857a8e214` |
| `performance.json`    | `c0a78ea4407626867641263ad3356ba79cd1723cf7e1edb50985a6ee86da091e` |

Use the [local instructions](../deployment/local-handoff.md) to reproduce supported behavior. Before changing the
parser, freeze independent free-format/tag expectations and settle the metadata-carrier convention. Future scaling or
hosting work is provisional in the [roadmap](../roadmap/README.md), not a prerequisite added to the assessment.
