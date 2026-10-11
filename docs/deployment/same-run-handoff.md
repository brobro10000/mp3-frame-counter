# SAME-RUN-HANDOFF: direct publisher artifact contract

Adopted by the coordinator under the owner’s roadmap authority, 2026-10-10. Independent expectations precede separate
implementation. This first unit is one dormant, deterministic, credential-free artifact validator. No workflow/job,
network adapter, release download, Git execution, target, registry transfer, federation, deployment or hosted envelope
here. Same-run custody removes any dependency on historical receipt-step log acquisition. It does not weaken original
admission authentication or authorize a CLI caller to manufacture trusted needs outputs.

## One closed API

```text
validateSameRunPublisherHandoff({ context, publisher, artifact, archiveBytes }) -> {
  schemaVersion: 1, kind: "same-run-publisher-handoff", handoff: PublisherHandoffV1,
  receipt: PublisherReceiptV1
}
context = {
  repository, repositoryId, repositoryOwnerId, eventName, ref,
  sourceRevision, baseRevision, workflowRevision, runId, attempt
}
publisher = {
  result, outputs: {
    "handoff-ready", "handoff-artifact-id", "handoff-artifact-sha256", "handoff-sha256"
  }
}
artifact = {
  id, name, sizeInBytes, digest, expired,
  workflowRun: { id, repositoryId, headRepositoryId, headBranch, headSha }
}
```

All records have exactly the listed own enumerable keys; ordinary parsed JSON semantics, no exotic-object project.
Context IDs/run/attempt are positive safe integers, Git revisions lowercase 40-hex, OWNER/REPO follows the existing
handoff grammar; require eventName=push, ref=refs/heads/main and workflowRevision=sourceRevision. Context comes from
trusted same-run GitHub values plus the original event's base, never the artifact or a requested branch/profile. The
future caller pins expected repository/owner numeric identities in reviewed configuration and cross-checks the actual
run; this helper cannot turn arbitrary caller-supplied context into an authenticated statement.

Require publisher.result="success" and all four output values to be strings: ready exactly "true", artifact ID a
canonical positive decimal safely representable as an integer, both hashes exactly lowercase 64-hex. The literal input
projection corresponds only to direct `needs.publish-release`; no generic job selector or receipt parameter. Artifact ID
equals that output; name equals the receipt-derived source/run/current-attempt name; size is a positive safe integer
<=256 KiB and equals actual ZIP bytes. Require expired=false and digest exactly `sha256:<output hash>`. Its workflowRun
IDs equal the current run/repository, both repository IDs match, branch="main", headSha=current source. Do not accept an
artifact-name lookup, URL, alternate ID, `authenticated` flag or caller-provided extracted JSON.

Require archiveBytes to be nonempty Uint8Array (Buffer allowed), <=256 KiB. Hash actual bytes and match both externally
supplied archive digests before decompression. Read exactly one regular `handoff.json`, nonempty and <=64 KiB. Reuse
`createPublisherReceipt` to enforce strict UTF-8/no BOM, the entire closed handoff schema and actual raw JSON SHA. Match
that SHA to the independent needs output. Obtain a fresh validated handoff through the existing builder; do not copy its
schema into another implementation or add an export/authority shortcut to the publisher module.

Match handoff repository IDs and every overlapping original/publisher field to context. Require fixed publisher workflow
`.github/workflows/ci.yml`; publisher.attempt must equal context.attempt, original.attempt may be earlier. Thus
original1/publisher3/current3 succeeds, original1/publisher2/current3 fails even when older outputs remain present.
Preserve original source tree/tooling/base/admission digest unchanged for later original-context replay. Never relabel
the admission with the current attempt. Output is fresh, deeply frozen JSON with no input aliases or mutation, clock,
I/O, callbacks or credential access; no ready/deployable status is added. One fixed sanitized TypeError with both
message and code `ERR_SAME_RUN_HANDOFF` is required for all refusals, with no cause, native ZIP error or supplied
values.

## Exact pinned archive format

The pinned upload action `cf430e030ddbb5b0abf93d22962f4752f3646cd9` bundles artifact 6.3.1. A credential-free probe
executed its unchanged writer with the actual single hidden-file specification, compression level zero and a regular
0600 synthetic file. It produced the format below with zero attempted network or child-process calls. This establishes
writer compatibility, not live Actions transport or artifact authority. Source and probe record:
`6a6225772f9584be5dfffc96f00231ab0f0c4bb69ae6e1186cb935d74f3e01d3`; bundled writer SHA256:
`c0e58b240360573e6d6c82ea1bb22deff4f85883e00211a52bd27822c3a22617`.

Use a bounded in-memory reader built from Node 24 byte operations and `node:zlib` CRC32. No extraction to disk,
subprocess, decompression or new dependency. Accept only this classic single-disk, single-entry STORE format:

- Local header starts at offset zero, signature `0x04034b50`, version-needed 20, flags exactly `0x0008`, method zero.
  Its CRC and both sizes are zero. Filename is exactly the twelve ASCII bytes `handoff.json`; extra length is zero.
- Nonempty stored payload is at most 65,536 bytes. Immediately afterward is a signed sixteen-byte descriptor:
  `0x08074b50`, actual CRC32, compressed size and uncompressed size. Both sizes equal payload length.
- Immediately afterward is one central entry, signature `0x02014b50`, made-by `0x032d`, needed 20, flags/method and DOS
  timestamp equal to the local header. CRC and both sizes equal the descriptor and actual payload. Filename is
  identical; extra/comment lengths, disk-start and internal attributes are zero, external attributes exactly
  `0x81800020` (regular 0600 plus archive bit), local offset zero.
- Ordinary 22-byte EOCD immediately follows: signature `0x06054b50`, disk numbers zero, both entry counts one, central
  size 58, central offset matching the actual entry, comment length zero. EOF follows immediately.

The actual archive length is payload length plus 138 bytes; independently check each length/offset before reading. The
256 KiB outer bound applies before hashing or parsing, as does the independent 64 KiB plaintext bound. Reject every
other layout: compressed/encrypted entries, ZIP64, directories, links, duplicate/extra records, alternate permissions,
extras/comments, traversal, overlap, malformed/truncated headers, trailing or prepended bytes. SHA256 comparison against
both external identities precedes parsing; CRC32 is an additional consistency check and never authority.

A writer/platform/compression/framing change requires an explicit reviewed compatibility amendment. This narrow format
avoids introducing unused ZIP features. The independent test author must use literal structures and distinct integrity
values, include a known CRC vector or retained synthetic writer fixture, and exercise the actual bounds/refusals.

## Future trusted acquisition and original replay order

1. A later source-owned adapter must first enforce reviewed workflow/main-push context, direct successful publisher
   dependency and exact receipt-only output wiring. No workflow_dispatch inputs, arbitrary CLI/env override, previous
   successful attempt fallback or self-reported receipt is equivalent. Validate locators before any acquisition. No
   cloud token, WIF request, target execution or dependency installation is enabled by a shape-valid locator alone.
2. Authenticate repository/run/workflow identity and fetch the exact artifact ID through fixed api.github.com routes,
   using only the needed read-only GitHub credential. Project the literal metadata fields above; additionally enforce
   actual expires_at/availability and current observation freshness at this I/O boundary. Metadata expired=false alone
   is not proof of current availability. Missing/expired/deleted evidence stops; no name-based recreation fallback.
3. Bound metadata/ZIP bytes, time and redirects. A signed archive location gets a fresh credential-free HTTPS request
   under an explicitly adopted host policy; never forward Authorization, retain signed query strings or follow arbitrary
   subsequent redirects. Download into bounded owned memory/private custody and invoke the pure validator. Exact-ID
   binding defeats same-name replacement; raw SHA checks bind the received bytes. No historical job-log API is needed.
4. Before execution, re-observe release/tag/ten asset identities and required raw metadata bytes against the
   authenticated handoff. Preserve raw publication/reservation identities versus canonical bindings. The first pure card
   does not perform this re-observation or verify Docker archives; a metadata-only path cannot claim image/registry
   verification.
5. Obtain the original admission from hash-bound `e2e-result.json`; call
   `verifyAcceptanceAdmission(root,{record, expectedContext:handoff.originalContext,expectedSha256:handoff.admissionSha256})`.
   Build the existing closed selection
   `{baseline:resolution.required,resolution,admission:{record,sha256:handoff.admissionSha256}}` from that return. Then
   call `readRequiredAcceptanceProfileProjection(root,{selection,sourceRevision,baseRevision})` using the unchanged
   original source/base. Require non-null; the existing reader atomically validates every selected role and repeats its
   source-consistency replay. No localSelection, candidate/pending substitution or separately reconstructed inventory.
6. Only later gates establish archive/image provenance, same-content registry pair, provider/configuration identity,
   stage access, parent cleanup and execution custody. Feed the authenticated projection/raw hashes into the existing
   hosted-evidence expected-data shape only after those facts exist. This validator cannot fill registry digests, target
   observations, launchId or cleanup, and cannot mint a passing/blocked envelope with invented identities. Every
   production application deployment still requires its separate exact-candidate human authorization.

`verifyReleaseBundle` is useful later only when all eight prepared assets, including both Docker archives, are actually
available in its fixed directory with clean exact-source/full-history context. It is not a metadata-only validator.
Normal same-run authority inherits the reviewed publisher's successful checks/reverification; retaining the
authenticated original context/digest for admission replay avoids inventing a second product digest or requiring
historical step logs.

## Independent matrix and smallest writable scope

Use unequal literal hashes/IDs, exact expected outputs, equal-attempt and original1/current3 valid counterparts; ensure
each negative reaches its intended decision. Cover every closed-key/type/grammar error; failed/skipped/cancelled
publisher; ready without success; missing outputs; repository/owner/run/base/source/workflow or producer-attempt swaps;
artifact ID/name/size/digest/expiry/head mismatch; same-name replacement; coherent altered handoff with its own hash
still failing unchanged external needs SHA; distinct ZIP/JSON hashes; strict UTF-8/BOM/size errors. Archive controls
must include the actual supported STORE/descriptor valid counterpart and malformed
metadata/framing/CRC/expansion/extra-entry cases, with near-boundary byte sizes. Require fresh deep freeze,
mutable-input nonmutation, deterministic sanitized refusals, and import/call no-I/O. Synthetic consistent inputs can
pass; pure code cannot detect a forged authoritative caller. Future workflow tests must separately reject output
bindings from another job/step and stage-only rerun reuse; future acquisition/replay tests cover authenticated routes,
redirects, expiry and original-context/projection failure order.

This card writes only new `scripts/same-run-handoff.mjs`, its independent `.test.mjs`, root's explicit test:tooling
registration and adopted contract/phase prose. No existing publisher, admission, projection, hosted-evidence, frozen
suite, release asset, workflow or IaC mutation is needed. Independent tests freeze before a different implementer. Root
adopted the API, fixed refusal shape and observed STORE-only format above. Authenticated acquisition host policy,
freshness, workflow wiring and original-admission replay remain later integration decisions. This pure unit returns
consistency evidence only; the broader phase outcome is not complete until those required consumers exist.
