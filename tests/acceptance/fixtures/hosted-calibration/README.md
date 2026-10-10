# Inspectable hosted calibration evidence

This directory preserves synthetic Linux calibration performed on 2026-10-10. It adds review evidence only; no target
was executed while packaging these files. Candidate controls are not application acceptance, immutable binding,
publication, hosted wrapper cleanup, provider validation, or production authorization.

Original JSON is stored as `.json.txt`: the contents are valid JSON with unchanged original bytes, protected from
formatting changes. [Provenance](provenance.json) maps every payload to original paths, SHA-256 and byte lengths,
including deduplicated copies. Original record-internal `.json` filenames map to the corresponding `.json.txt` files.
[Diagnostic sources](diagnostic-sources.md) exposes the actual probes as inert text fences. The only redaction is one
synthetic token literal in the interruption source fence; all result fields remain unchanged. There are no credential
values, certificates, keys, raw sensitive logs or personal host paths here.

## Normal TLS and the positive counterpart

[Actual TLS result](tls/result.json.txt) records 15 passed checks, Node `v24.20.0`, Linux x64 and 72,532 ms. The full
TLS probe is inspectable in the first source fence: it first refuses an untrusted certificate through the actual Node
and browser adapters, with direct Chromium independently observing `ERR_CERT_AUTHORITY_INVALID`. It then trusts only an
ephemeral test CA in the disposable environment and succeeds with ordinary TLS verification. No HTTPS-error bypass is
used. Positive assertions compare exact response body hashes, both CSP header values, duplicate `nosniff` headers, and
authenticated receiver counts. Redirect and foreign-navigation attempts must leave the foreign receiver's request and
token counters at zero. Adapter/browser/listener closure and temporary key-directory removal are asserted.

The same probe also repeats [all 60 browser controls](tls/browser-rows.json.txt), each passed with passed cleanup and
empty codes. These expose individual control identities, including policy/header, foreign-request and suppression
counterexamples; their implementation remains in the candidate's existing source.

The separate [normal aggregate report](normal/report.json.txt) has 95 unique planned/executed passed controls, passed
cleanup, empty failures, and run ID `d95608ff-4f11-4fd1-afc1-ce760ccc7a30`. Its original child report is byte-identical
and maps to this one file. [Process output](normal/process.json.txt) records code 0, reaped true, forced/stopped false.
[Retained root verification](root-verification.json.txt) preserves the original association of full candidate checking,
this 95-control run, the TLS probe and 60 repeated browser controls; its omitted log references remain hash references.

## Actual aggregate-parent interruption and the retained failed attempt

[Attempt 1 result](interruption-1/result.json.txt) remains failed with `SETUP_READINESS` at 60,043 ms. Its detector
mistook emulated executable names for absent Node/Chromium. It did not establish the intended pre-signal readiness and
is not counted as successful interruption evidence. [Container output](interruption-1/container.json.txt) retains exit 1
and outer absence observations. The complete detector-only correction appears in the final source fence.

[Attempt 2 result](interruption-2/result.json.txt) records readiness at 4,379 ms: actual parent PID 15, direct child PID
22/start tick 8503834, four Chromium-role descendants and two descriptor-attributed loopback listener identities. The
actual driver parent receives SIGTERM at 4,380 ms and exits 1 without a terminating signal at 4,727 ms. All 15 harness
assertions pass in 5,011 ms. The harness's passed diagnostic means the expected failed run and cleanup were observed;
the interrupted controls remain failed.

[Direct-child process output](interruption-2/process.json.txt) retains reaped true, forced false, stopped true and
`ASSERTION`. [Original child report](interruption-2/child-report.json.txt) and
[final parent report](interruption-2/report.json.txt) share run ID `c5196e35-f5e9-45a0-9849-21307b1f6c2a`, failed
status, termination requested and passed cleanup. There are 95 planned identities but only 93 actual partial rows: 45
passed, 44 failed with `CDP`, and four failed with `ASSERTION`. The two unexecuted UI controls are absent. These
interruption-induced failures do not count as passed semantic negative controls.

Independent kernel readback records seven witnessed PID/start-time identities and both readiness listeners absent after
settling. Chromium's group/session 41 differs from direct-child group 22. These observations are separate from the
driver's reaped flag and subsequent [container absence](interruption-2/container.json.txt). The captured container uses
immutable image `sha256:56ddaf0edd4d0e102293ab5b05bd0d0f671b1660cba81347c06d2f35ea1b7ed3`, Linux amd64, `network=none`,
`init=true`, and a single diagnostic-directory mount. This identity is recorded for interruption only.

## Source binding and bounded conclusions

The [75-file input snapshot](source-inventory.json.txt) is byte-identical to both interruption attempts' before/after
snapshots. Both normal and interrupted reports retain the same 32 ordered input hashes and recomputed source digest
`9e6b08d598f03e0bb12712f3ede0f8e39063ef2ce77d3a3b88decece795552a5`. All those inputs match the copied sources and
current candidate during packaging. The unchanged driver SHA-256 is
`07639b48c06cb47f1c30e7c5678f2416059d12766286f16205125ec7611043fb`. Only README differs within the original 75-file
snapshot; these newly added evidence files are outside it. Neither snapshot claims the new full suite tree.

The TLS result itself has no embedded run ID, source digest or container metadata. Its source association is the
retained root-verification/source-inventory join, not an invented result identity or reused interruption container ID.
TLS records retain assertion statuses, not raw receiver events. Cleanup covers observed resources and finite polling;
unseen transient descendants, hostile detach, forced-kill fallback, or every interruption timing remain unproved.
`--init` may reap orphans. Actual stage/production wrapper failure-cleanup, cloud IAM/audience/provider identity, image
archives and live application acceptance are separate gates. No new execution or signed attestation is implied.
