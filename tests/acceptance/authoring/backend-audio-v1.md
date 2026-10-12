# Independent backend-audio-v1 authoring record

**2026-10-11, isolated unbound candidate.** The owner directly authorized the bounded backend refactor in
`mp3-backend-refactor-ascii-codex-prompt.md`, inspected at `93a7098c027b214b9b392b0f1408660097dd32f3`. This author
received that attachment, governing acceptance instructions, primary sources and independently authored fixture
evidence. Product server/frontend implementation and product unit-test source were not consulted. The active main suite,
transition registry, historical contracts, baseline and older independent worktrees were not edited.

The [r2 contract](contracts/backend-audio-v1.md) was frozen and its hash sent to the coordinator before product
authoring. The candidate package uses revision `backend-audio-v1` consistently, preserving the existing successor
conventions. It is a separately reviewable expectation set; no registry entry, admission, merged tree or review identity
is invented. Local implementation remains within the owner's authorization. Remote publication and binding remain
separate actions under the [transition guide](acceptance-transition.md).

## Independently fixed behavior

The default is exactly the walked audio count. The independent historical tone counts remain physical 9/16/21; the
successor audio counts are 9/15/21. The historical two-frame Xing fixture remains physical 2 with successor audio 1. The
identified private sample remains 6090 physical and becomes 6089 audio only after its preserved identity is checked. No
private audio, MediaInfo installation or product parser is needed by the portable candidate package.

The 41 new structural recipes cover all channel/marker/CRC combinations, all 16 known flag combinations, unsigned and
false declarations, complete removal/truncation, outer tags, carrier removal, carrier-only refusal, payload/ID3/later
marker decoys, VBRI, unsupported shifted CRC layouts, unknown flags and first-frame-bounded TOC/quality truncation.
Expectations come from literal byte construction and arithmetic, not a second parser or product result. Both raw media
types exercise default and detailed responses. The query matrix checks exact decoded opt-in and duplicate-name refusal.

Pinned FFmpeg n7.1 provides the independent channel-dependent Xing positions: frame-relative 21 for mono and 36 for the
other modes, including CRC protection. A CRC-shifted alternative at +2 with the expected marker absent returns
`MP3_UNSUPPORTED_METADATA`. Unknown flags do likewise. A recognized carrier with a truncated nonessential field stays
excluded and emits the first-field warning while omitting that and later fields. Full-frame validation precedes carrier
inspection. A flags-short fixture is unreachable through this public supported-frame model: the minimum complete frame
is 96 bytes, already beyond the flags end at 29 or 44. Real final truncation therefore tests `MP3_TRUNCATED_FRAME`.

Detail requires the audio/physical/exclusion equation, closed tagged Xing fields and closed bounded warnings. Offsets
are absolute zero-based file positions. Declared MPEG stream bytes are compared with the MPEG region including its
carrier and excluding accepted outer tags. Declarations are diagnostics and never supply a count or allocate a table.

The 21 coded errors retain their exact status/message catalogue. Existing malformed recipes receive explicit successor
codes: empty is `UPLOAD_EMPTY`; metadata-only is `MP3_NO_AUDIO_FRAMES`; malformed supported ID3 is
`MP3_INVALID_METADATA`; reserved headers and unexplained boundaries are `MP3_INVALID_HEADER`; incomplete final/header
derived spans are `MP3_TRUNCATED_FRAME`. The existing idle and total deadline cases require their distinct codes.

The independent OpenAPI fixture and predicates require binary media, closed disjoint success DTOs, safe scalar fields,
all named coded examples, standard controlled-ingress 502/504, query rules and response headers. Equivalent literal
schemas and oneOf/anyOf alternatives are admitted when their meanings match. Upload statuses are the attachment's
400/408/413/415/417/500/503/502/504 set; routing 404/405 examples may be in appropriate real API/health operations. HEAD
remains bodyless. No wildcard path is invented. The historical OpenAPI fixture remains byte-identical.

Actual owned Redoc 2.5.4 checks select rendered response tabs and named examples and compare visible JSON, including
both 200 representations and every 400/413/415/502/504 example. Nested detail JSON requires the actual Expand all
interaction; a collapsed empty display cannot satisfy the check. Both desktop and narrow owned views passed during
author calibration. The preserved CSP, asset, lifecycle and hostile-browser controls remain mandatory.

Real candidate UI observations require one details=true upload per explicit action, server-provided counts/equation,
metadata/warning disclosure and recovery from carrier-only failure. Local, stage and production inventory identities
remain exactly 72/22/3; new observations are submatrices in existing cases. No hosted case was run.

## Source identities and commands

| Identity                                               | SHA-256                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| Final formatted backend-audio-v1 r2 contract           | `5e42ee2d789d03e8510e58c486f643ed105e60202d61e1eb91e9a126d3698b7e` |
| Historical manifest with successor revision only       | `ef45e3d9183ed11798747d8fc17be0c81e3e6bc50db9cae887dd0c88d8943c51` |
| Separate new audio recipe/expectation manifest         | `22f1d14353d70f57a2b685b16e27dc337df3270db41545407556dcc30ad3ce26` |
| New independent OpenAPI fixture                        | `34445c5a2983d95fad96acb4cfa45360a598b3b3f55b721934534b39e00ca820` |
| Uncommitted acceptance source content digest, 98 files | `9f312a7f7f50608796b78cb0f36276aec9cff0f26d44198d49a1be404cbd146a` |

The initial pre-implementation r2 contract SHA-256 was
`ace7aba6d2ec564bdfe54db9e092f0d1632eaad934e97a7e0c22876c83fce26b`; its exact bytes remain in the ignored
`backend-audio-v1-r2-original.md` author artifact. Final Prettier formatting changed no requirement or wire semantics.
The initial OpenAPI fixture and source-content hashes are retained in `source-identity-before-final-formatting.json`.
Final formatting was completed before the coordinator froze the candidate for its initial product run. The separately
authorized harness correction below supersedes that first freeze.

The last digest is SHA-256 over sorted repository-relative path/NUL/file-SHA rows, joined with newlines. Its ignored
record is `tests/acceptance/.artifacts/backend-audio-authoring/source-identity.json`. It is deliberately not a Git suite
tree, committed revision or binding. The coordinator must derive those from the eventual real commit and review.

The author used Node 24.20.0 and npm 11.19.0, the package's unchanged TypeScript 7.0.2/Playwright 1.64.0/Redoc 2.5.4
pins, and Prettier 3.9.9. Commands actually executed from the isolated checkout include:

```text
npm --prefix tests/acceptance ci --ignore-scripts
tests/acceptance/node_modules/.bin/tsc --noEmit -p tests/acceptance/tsconfig.json
node tests/acceptance/scripts/backend-audio-controls.ts
npm --prefix tests/acceptance run check
npm exec --yes --package=prettier@3.9.9 -- prettier --write <changed acceptance source files>
git diff --check
```

The install audited 126 packages with zero reported vulnerabilities and did not change the standalone lockfile. Strict
typechecking passed before full checks. Controls established the 41 recipe identities and 98 intentional semantic
rejections, including legacy error envelopes, wrong status/code/message, physical count mislabeled audio, malformed
detail, leaked fields, missing schemas/examples/headers and omitted routing/health documentation. Positive alternatives
also passed. Original controls retain count/shape/setup/launcher/premature-success rejection, 52 transport/inventory
rejections, 46 docs controls and 95 owned hosted-adapter/browser controls. These are owned calibration, not execution
against the application or a hosted target.

The full final check log is `tests/acceptance/.artifacts/backend-audio-authoring/check-final.log`. Earlier author runs
and fixes remain under the same ignored directory; they are not erased or described as product TDD. An added
docs-control calibration first found collapsed nested sample text, and later predicate/control setup fixes corrected
routing scope and strict typing. Final results must be read from the final log, not an earlier partial run.

A separate direct comparison with the inspected Git base verified all original 28 fixture files byte-identical,
historical manifest entries/counts/recipes unchanged, every 72/22/3 tuple unchanged and lockfile bytes unchanged. Only
successor revision fields change in the existing manifest/inventory/profile JSON. No original capture is rewritten.

## Separate prerequisite and remaining evidence

The independent prerequisite in the coordinator's separate policy worktree supplies only
`scripts/backend-contract-policy.test.mjs`, `scripts/ci-unit-inventory.test.mjs` and
`docs/testing/backend-contract-policy.md`. Missing API produced explicit initial red before implementation. The optional
Oxlint pin extension produced its own deliberate red before support. After the coordinator supplied the pure helpers,
all 20 groups passed under Node 24.20.0 without product imports. The prerequisite record preserves the exact pins,
development/runtime boundary, fixed six-file lane map, primary linter sources and original red logs. Synthetic npm
integrities establish metadata shape, not the authenticity of downloaded packages or actual source-lint coverage.

The author has not run the 72 cases against a product, hosted stage/production, private-sample acquisition or full
container resource comparison. Product unit tests and independent source review must establish factory instances,
schema/Swagger registration order, import/generation side-effect absence, resource bounds, startup failure, lifecycle
races, source maps/comments and dependency/runtime closure. Source inspection is intentionally outside this author's
acceptance-input boundary. Actual product conformance must pass every mandatory successor observation; discovery and
candidate controls cannot stand in for it.

Remote prerequisites are a separately reviewable candidate commit/PR, actual independent review, protected-main merge,
real suite tree/manifest/contract hashes, and a separate binding with authenticated review/squash/predecessor identity.
No commits, push, merge, release, admission, activation, settings/authentication change or remote binding occurred in
this author lane. Cloud execution remains deferred. This record stops at the independent local handoff and makes no
global completion claim.

## Authorized harness correction 1 — 2026-10-11

After an interrupted product run, the coordinator reported three harness failures and requested independent review. This
author did not inspect product source, unit tests or generated specification output. Owner prompt section 10 and the
unchanged r2 contract require labeled server counts, a count equation and honest metadata display. They do not require a
heading, digits-only operands, dt/dd/table markup or a native details disclosure. Owned paragraph/card pages
independently reproduced the old rejection and then passed the corrected visible-text predicates. Exact integer
quantities still need adjacent labels; the equation still requires the physical, excluded and audio values with minus
and equals operators. Wrong counts/equations, fractional values and a declaration substituted for the audio result
remain deliberate rejections. Metadata may be visible immediately or opened through an accessible disclosure.

Both AC-11 cases created one callback for page.route and a different callback for page.unroute. The pinned Playwright
owned control showed that the equivalent new callback left the mock active; removing the original matcher restored the
real owned receiver. Each corrected case retains one matcher object for registration and removal. Error injection,
pending-state/duplicate checks, safe text and later real recovery remain unchanged. See the primary
[Playwright unroute API](https://playwright.dev/docs/api/class-page#page-unroute).

The docs predicate compared the entire Server Object with the exact object containing only url. OpenAPI 3.0.3 permits
the optional [Server Object description](https://spec.openapis.org/oas/v3.0.3.html#server-object), which does not change
its target. The corrected predicate still requires one literal same-origin root URL, validates annotation type and
rejects foreign URLs or variable-based targets. The original wrong-server negative control remains; added annotation and
wrong-type counterparts are within the existing YAML control identity. No docs asset, schema, example or CSP rule
changes.

Only these five acceptance input files change in this correction: lib/backend-audio-contract.ts, lib/docs-contract.mjs,
specs/acceptance.spec.ts, scripts/backend-audio-controls.ts and scripts/docs-controls.mjs. Their old/new hashes and
exact before bytes are retained under `tests/acceptance/.artifacts/backend-audio-authoring/harness-correction-1/`. The
initial frozen 98-file source digest remains `9f312a7f7f50608796b78cb0f36276aec9cff0f26d44198d49a1be404cbd146a` in the
preserved before-source identity. The corrected frozen 98-file digest is
`43fbaa130a02a5eebcbf8d5c61c87806db05a6ec824a3d7bc133213685884bc5`. The r2 contract hash, both manifests, OpenAPI
fixture hash, all 41 recipes and every 72/22/3 tuple remain unchanged.

Commands used Node 24.20.0 and the unchanged pinned Chromium/Playwright. Owned precheck/postcheck logs and their exact
scripts remain in that ignored correction directory. Strict acceptance typechecking, 41 recipe identities and all 104
semantic rejection controls passed after the correction, retaining the original 98 controls. The full package check was
rerun into the correction directory's check.log and passed, including the original 52 transport rejections, 46 docs
controls, 95 hosted owned controls and exact 72/22/3 discovery. These are candidate controls, with no product or hosted
acceptance claim. Prettier 3.9.9 formatted only changed files and git diff --check passed. The coordinator retains the
interrupted product evidence and owns the subsequent actual product run; earlier failed evidence is not erased.

For later prerequisite wiring, persistent factory-unit adoption should follow verified bound contract history. After
runtimeAcceptance validates exact source/base/admission, follow resolution.required's predecessor ancestry in the
verified source commit's append-only transition registry. Require six files once backend-audio-v1 enters that active
ancestry, including later successors and product reverts. A merely proposed candidate or pending binding before product
activation retains the historical five-file inventory. Current app.ts existence and an unverified working registry are
not adoption authority. This is a proposal only; no policy or caller implementation changes occur in this author lane.

## Authorized harness correction 2 — 2026-10-11

The coordinator reported a generated schema whose byte fields use the actual inclusive 20,971,520-byte upload cap. The
previous predicate required exactly Number.MAX_SAFE_INTEGER for those maxima. r2 requires safe integer file offsets and
a complete carrier span, and does not mandate that schema annotation. A finite safe integer maximum is valid when it
covers every attainable field value. The reported cap therefore satisfies all three byte fields. Count maxima remain
exactly Number.MAX_SAFE_INTEGER and declaration/quality maxima remain exactly 4,294,967,295, as explicitly requested.
The frozen r2 contract and all independently authored audio expectations remain unchanged.

The smallest supported physical frame is 96 bytes. A successful present carrier needs one carrier and at least one audio
frame, so a tag padded to fill an exact-limit upload can place its first carrier at byte 20,971,328. Its stereo marker
is at byte 20,971,364. The largest MPEG-1 Layer III frame is floor(144 * 320000 / 32000) + 1 = 1,441 bytes. The
attachment's formula and the pinned primary
[FFmpeg n7.1 tables](https://github.com/FFmpeg/FFmpeg/blob/n7.1/libavcodec/mpegaudiotabs.h) and
[header arithmetic](https://github.com/FFmpeg/FFmpeg/blob/n7.1/libavcodec/mpegaudiodecheader.c) support these extrema.
Maxima at or above those attainable endpoints and within the safe integer domain pass. Each one-byte-short endpoint
fails, as do unsafe, infinite, NaN, fractional, string, negative and missing maxima. No parser or product source was
read.

The read-only alignment audit also found binary schema whole-object equality and case-sensitive response header lookup.
Neither representation constraint follows from r2. The primary
[OAS3 schema rules](https://spec.openapis.org/oas/v3.0.3.html#schema-object) permit schema documentation annotations and
contained schema references; its [response rules](https://spec.openapis.org/oas/v3.0.3.html#response-object) preserve
case-insensitive header names. The predicate now resolves the binary schema and checks its string type/binary format,
allowing descriptions and titles. References remain local and resolvable. Allow and Retry-After lookup ignores casing.
Wrong binary types/formats, missing or external references, missing headers and different header names still fail.

The rest of backend-audio-openapi.mjs was reviewed against the attachment and r2. Its closed property/required sets,
tagged alternatives, literal values, warning bound, integer types, count/declaration limits, supported media, registered
operations, named coded examples and HEAD/proxy behavior remain substantive checks. An owned positive control added
harmless title/description annotations throughout every component schema and passed. This is a bounded predicate audit;
it does not claim to be a general validator for every equivalent OpenAPI composition.

“Only one exact decoded true value enables details. Duplicate, empty and other values use default.” expresses r2's
selector rule. The current lexical /once|exactly one/ check does not recognize that wording. Per the coordinator's
explicit direction, this check is unchanged while the product adopts clear “Exactly one” wording. No query
classification expectation or error/code expectation changes.

Exact before bytes, old predicate failures, a replay comparing the old and corrected predicate, prior source identity,
prior handoff and prior full check log are preserved under
`tests/acceptance/.artifacts/backend-audio-authoring/harness-correction-2/`. Only two acceptance input files change:
lib/backend-audio-openapi.mjs and scripts/backend-audio-controls.ts. The prior 98-file digest remains
`43fbaa130a02a5eebcbf8d5c61c87806db05a6ec824a3d7bc133213685884bc5`; the corrected frozen digest is
`7827283d043fc94ca25ff8874dd898768a62442866e58948ecb5435c93183e05`. R2, fixture manifests, OpenAPI fixture bytes,
historical physical counts, lockfile and all 72/22/3 identities remain unchanged. This record is the only additional
documentation edit; no active suite, registry, policy implementation or Git mutation occurs.

Node 24.20.0 strict acceptance typechecking and all 41 recipes/140 semantic rejection controls passed. The full
`npm --prefix tests/acceptance run check` with Node 24.20.0 selected on PATH passed into this correction's check.log,
preserving the original 104 semantic controls plus 36 new calibration rejections, all 52 transport rejections, 46 docs
controls, 95 hosted owned controls and exact 72/22/3 discovery. Prettier 3.9.9 formatted only the changed files;
whitespace validation passed. These are independently owned candidate controls with no product or hosted acceptance
execution. Earlier actual product evidence remains the coordinator's evidence for its exact prior source identity and is
not rewritten as passing evidence for this successor digest. All candidate input bytes are frozen after this correction
for the coordinator's next actual run.

## Authorized harness correction 3 — 2026-10-11

The coordinator reported that generated detailed examples reach SPEC_EXAMPLES because the interpreter rejects a valid
enum-only excludedMetadataFrameCount schema. Independent reproduction changed only the owned OpenAPI fixture's schema
annotation, leaving all example values and semantic inputs unchanged. The previous literal-set predicate already accepts
enum-only fields, while exampleMatches falls through to false when type is omitted. The referenced
[JSON Schema validation vocabulary](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.20)
defines enum equality independently of type. The
[OAS3 schema rules](https://spec.openapis.org/oas/v3.0.3.html#schema-object) incorporate that keyword. A matching finite
enum can therefore validate a literal without a redundant type annotation. Enum membership remains exact and does not
coerce strings, booleans, fractions or other values into expected integers or markers.

The interpreter now checks finite enum equality, including JSON structural equality, and applies its supported sibling
constraints. The related audit retains exactly-one oneOf matching, at-least-one anyOf matching and every allOf branch;
composition cannot bypass a sibling enum, explicit type or bound. Array minimum/maximum checks now include maximum zero.
Contained reference chains resolve to their target, with missing, foreign and cyclic references rejected. The health
status predicate permits enum-only "ok" with its same exact literal set; a contradictory explicit type still fails.
These calibrations retain the documented bounded subset and do not claim general OpenAPI validation support.

An owned positive matrix omits type from every finite literal field in the independent fixture: exclusion, marker,
present/absent tags, seek-table literal, warning codes/fields, error codes and health status. Every named JSON response
example still validates and the complete business predicate passes. Further positive and negative controls cover
primitive/structural enum equality, disjoint and overlapping alternatives, wrong member/case/type, composition sibling
constraints, array bounds and local reference chains. No audio recipe, count/classification, query rule, DTO field,
catalogue message, error code or fixture file changes.

Exact before bytes, before-source identity, prior handoff/check log, initial failed replay and corrected replay are
preserved under `tests/acceptance/.artifacts/backend-audio-authoring/harness-correction-3/`. The initial replay expected
the old chained-reference failure to occur at SPEC_SCHEMAS; it actually reached SPEC_EXAMPLES. Its script/log are
retained and the corrected replay checks the observed prior error without changing any test input or product evidence.
Earlier coordinator evidence remains associated with its original source identity.

Only lib/backend-audio-openapi.mjs and scripts/backend-audio-controls.ts change as acceptance inputs, plus this
authoring record. The prior 98-file digest remains `7827283d043fc94ca25ff8874dd898768a62442866e58948ecb5435c93183e05`;
the corrected frozen digest is `0027794106685554fc98cd2755dc5860730d0bac82a230317e28a366c52cd32c`. The original 140
controls are retained with 27 additional subset rejections, totaling 167. Strict typechecking and all 41 recipe
identities passed on Node 24.20.0. The full package check passed with the unchanged 52 transport rejections, 46 docs
controls, 95 hosted owned controls and exact 72/22/3 discovery. Prettier 3.9.9 and whitespace checks passed. R2 and all
immutable fixture inputs remain byte-identical. No product source or product unit test was read; no Git, registry,
policy implementation or hosted operation changed. Candidate controls remain distinct from the coordinator's actual
product run, and all candidate input bytes are frozen after this correction.

## Authorized harness correction 4 — 2026-10-11

The coordinator authorized minimal correction of four confirmed predicate gaps from an independent candidate audit.
Frozen r2 already requires both detailed fields, the absent carrier tag, catalogue code literals, documented bodyless
HEAD rejection and correct response headers. The predicate accepted schemas making the detailed count or absent tag
optional, unrestricted error-code strings, omitted HEAD operations and incorrect Allow/Retry-After values. No new
requirement, audio expectation, classification or feature decision was needed.

Nine owned rejection controls were added before correcting the predicate. The candidate control script failed on the
first optional-count mutation; a separate complete replay showed that all nine malformed specifications were accepted.
The replay subsequently confirmed nine semantic assertion failures, with no setup exception counted as a rejection.
Original controls remain intact, and the corrected script verifies all 41 structural recipes and 176 deliberate semantic
rejections. Positive controls preserve enum-only header literals and multiple positive Retry-After delays.

The corrected predicate checks the exact detailed/absent required sets and the complete independent error-code literal
set. Equivalent finite literal alternatives remain supported. Upload HEAD must document a bodyless 405 response. Allow
retains exact POST for upload and GET for health, with case-insensitive header lookup and contained schema references.
Retry-After preserves the original fixture's positive-integer delay pattern and accepts finite positive delay literals;
incorrect text and zero are rejected. This remains bounded contract validation rather than a general schema validator.

Before bytes, old/new input hashes, the previous control report and red/green replay scripts/logs are preserved under
`tests/acceptance/.artifacts/backend-audio-authoring/harness-correction-4/`. The full candidate check was run once after
the correction and passed; its complete output is that directory's `check.log`. Node 24.20.0 strict acceptance
typechecking passed, along with 41 recipes/176 semantic rejections, the original 52 transport rejections, 46 docs
controls, 95 hosted owned controls and exact 72/22/3 discovery. These are candidate controls and discovery, with no
product or hosted acceptance execution. The owned termination probe's intentional failure remains recorded in the log.

Only lib/backend-audio-openapi.mjs and scripts/backend-audio-controls.ts change as acceptance inputs, plus this
authoring record. The prior 98-file digest remains `0027794106685554fc98cd2755dc5860730d0bac82a230317e28a366c52cd32c`;
the corrected frozen digest is `522822eebad85da226b805d24277e4f8becdbf45d6907eb3af301cd5affc7886`. R2 remains
`5e42ee2d789d03e8510e58c486f643ed105e60202d61e1eb91e9a126d3698b7e`. Both manifests, independent OpenAPI fixture,
immutable baseline, historical bytes and every inventory tuple remain unchanged. No product source or product unit test
was read, and no Git mutation, registry edit or remote operation occurred. Earlier product results retain their original
source identity; the coordinator owns subsequent evidence against this corrected frozen candidate.

## Authorized harness correction 5: independent red controls — 2026-10-11

A separate read-only reviewer inspected candidate HEAD `f32d61231c5d3def75da1690a6d7923fac900796` against feature base
`cee84185598f712a0da2e1b6592f675bdbd9a7ef`; their merge-base is `5ec42f2facf55dc1f5b77af7de1fda805d3072db`. Coverage
comprised all 36 candidate acceptance/testing-document changes, emphasizing the new literal recipes, audio manifest,
response oracles, OpenAPI predicates, Redoc observations and correction-4 controls. The reverse release-diagram delta
against the newer feature base is a pending integration gap, excluded from this candidate review; this is not a clean
whole-tree recommendation against main.

The reviewer had previously performed a separate product-source review. No product source, product unit test or product
output was consulted during this candidate review or this correction's control authoring. The original candidate
author's independent input boundary remains recorded above. These controls follow existing r2 literal-code and non-null
safe-integer requirements; they introduce no new wire behavior or acceptance authorization.

Two concrete gaps were found. Catalogue property lookup coerces a singleton JSON array such as `["UPLOAD_EMPTY"]` to a
string key when the caller omits expectedCode, allowing a non-string code in a controlled error. Separately, adding
nullable:true to either success frameCount, physicalFrameCount, the admitted integer 0..1 exclusion representation or
the present carrier's nonliteral integer fields leaves the current business predicate satisfied, while widening the
documented scalar domain to null. Existing positive response examples do not expose that widening.

Eighteen owned rejection controls were added before any oracle change: six non-string JSON codes without expectedCode,
and twelve nullable numeric-schema mutations. The seek-table literal uses enum `[100, null]` plus nullable:true because
enum `[100]` still excludes null by itself. That mutation is already correctly rejected. Original controls and positive
examples remain intact. The new controls collect missing semantic refusals before one final assertion, and run before
the candidate report writer so a red run cannot publish a new passed report. Setup exceptions cannot become passes.

The exact isolated command, from tests/acceptance with Node 24.20.0, was:

```text
node scripts/backend-audio-controls.ts
```

It exited 1 after reaching the new block. The raw result records twelve missing refusals: the singleton code array and
eleven nullable numeric schemas. Five other non-string code inputs and the nullable seek-table literal were rejected.
The expected successful total after a separately authored predicate fix is 194 semantic refusals, preserving all 176
prior controls. No green predicate or full-package result is claimed in this handoff.

Exact before bytes, the previous passed candidate report, raw red.log and red.exit-status are retained in the ignored
`tests/acceptance/.artifacts/backend-audio-authoring/harness-correction-5/` directory. A first formatter invocation used
a wrong relative path and touched no files; the explicit absolute-path Prettier 3.9.9 check found the owned control file
already formatted. Its before SHA-256 is `d183b01093b898594fc8e13cb631cfb121a304e98e196e57078b66d0cb7897c0`; the frozen
red-control SHA-256 is `16c8bb647058cb7ff4e26b3ad2f8174262ba3f829a8adb1db7b4c484846a984b`. The raw red.log SHA-256 is
`5525bd23e852dbbb6f057d27d60356deea29658b822364e8447b319907c829cc`.

Only scripts/backend-audio-controls.ts and this append-only authoring record change in this lane, plus ignored evidence.
Oracle helpers remain untouched for another lane's correction. R2, both manifests, the independent OpenAPI fixture,
historical fixture bytes/counts/recipes, private acquisition evidence, lockfile and 72/22/3 inventory identities remain
unchanged. No product, governance, registry, Git or hosted action occurred. The coordinator owns the later predicate fix
review, exact-source checks and actual candidate publication/binding; these red controls claim no product pass.

### Correction 5 completion

A separate candidate predicate author added a string-type assertion before error catalogue membership and numeric
null-refusal probes at the existing type/bounds boundaries. Finite enum/literal semantics remain unchanged, as required
by [OpenAPI 3.0.3 nullable semantics](https://spec.openapis.org/oas/v3.0.3.html#schema-object). No control expectation,
contract, original fixture, lockfile, inventory, product or gate implementation changed. The frozen 18-control addition
remains SHA-256 `16c8bb647058cb7ff4e26b3ad2f8174262ba3f829a8adb1db7b4c484846a984b`.

The coordinator inspected both predicate diffs and ran `npm --prefix tests/acceptance run check` once with Node 24.20.0.
It exited 0: 41 recipes and all 194 semantic rejection controls passed, together with strict candidate typechecking, 46
original fixtures, 52 transport controls, 46 docs controls, 95 hosted owned controls and exact 72/22/3 discovery. Raw
check.log, exit status and final hashes remain in this correction's ignored evidence directory. These are harness
calibration/discovery results, not application or hosted acceptance.

The final 98-file candidate source-content digest is `ead081e7a8dca1d14fa97e30541e8622a391c0ec4e9aa701fb6c4b4d787ed3be`.
Errors predicate SHA-256: `8352597153e0ac8682c534a036f66e29685dc544a01e4625d60a8b34a1849c4c`. OpenAPI predicate:
`fca4f983cbac0e8582aeda1845eaa91e39652e3f3685ba8c55f4171ac7107320`. R2 retains its original contract identity. Actual
main integration, current CI, independent companion review, candidate merge and separate binding remain pending.

## Admission location note — 2026-10-11 (non-normative)

This authoring record moved from `docs/testing/backend-audio-authoring.md` to
`tests/acceptance/authoring/backend-audio-v1.md` to place it within the candidate suite admitted by the unchanged
trusted resolver. Every preceding authoring-record byte is preserved; the normative contract changes only the
authoring-record link destination.

The previously recorded 98-file source digest describes the suite before this move. Adding this record to the suite
produces a 99-file source inventory. The coordinator will record its current suite identity in an external manifest
using actual Git objects, without adding a self-referential hash to this record.

The original prefix retains links relative to its former `docs/testing/` location. From this file's current location,
use the [r2 contract](../../../docs/testing/contracts/backend-audio-v1.md) and
[transition guide](../../../docs/testing/acceptance-transition.md). These mappings repair navigation only; they do not
change contract authority, binding status or the preserved authoring history. The prerequisite's referenced repository
path `docs/testing/backend-contract-policy.md` remains available through the
[current policy guide](../../../docs/testing/backend-contract-policy.md).

## Harness correction 6 — 2026-10-11 (non-normative)

The exact-head companion review found that required response containers could admit `null` despite the recorded non-null
contract. An independent control author added 22 direct/reference mutation cases across count results, analysis, both
Xing variants, warnings and warning items, coded errors/message strings, and health. Valid title, description,
`nullable: false`, contained aliases, finite enums and non-null composition constraints remain accepted. Every preceding
control byte remains intact. The frozen control file SHA-256 is
`adf7b01bdba1e935223fb73eb68d5a3de3f8357157d2af615ea400cc100973f1`.

Before the predicate writer changed the checker, the coordinator ran the controls with Node 24.20.0: exit 1, all 22 new
mutations reported missing refusals, and the original 194 controls and positive preconditions passed. Raw RED log
SHA-256: `50d8b26799af4bf385ec2c867c40a4a5176e6d8cebdd395b71363f009168ec95`. A separate predicate writer then inserted
nine semantic null-refusal assertions, reusing the existing matcher without changing it, the controls or contract.
Referenced schemas and other constraining keywords retain their existing interpretation.

The coordinator inspected the accepted diff and ran `npm --prefix tests/acceptance run check` once: exit 0, 41 recipes,
216 semantic rejection controls, 46 original fixtures, 52 transport controls, 46 docs controls, 95 hosted owned controls
and exact 72/22/3 discovery, with strict candidate typechecking. The existing product-generated OpenAPI also passed the
revised predicate in a separate local check; this is schema consistency evidence, not runtime acceptance. The raw
RED/check logs, exit statuses and handoff remain in the ignored correction directory.

The relocated record's historical prefix remains byte-identical; the current navigation mappings above fix the
companion's second finding without rewriting that history. No normative contract, fixture, lockfile, case identity,
product or governance byte changed. Candidate integration, fresh CI/companion approval, actual merge and separate
binding remain pending; harness calibration does not establish application or hosted acceptance.

## Harness correction 7 — 2026-10-11 (non-normative)

The next exact-head companion review found that production HP-01 still required the historical minimal response even
though the amended browser contract requests `details=true`. Discovery cannot expose an assertion that never executes.
An independent control author added six loopback counterparts that capture and execute the actual HP-01 callback,
mocking only its fixed registration module. They exercise a valid detailed body, missing/duplicate selectors, a
minimal-only body, an incorrect physical count and missing warnings. Every counterpart must prove one complete frozen
CBR upload, one selection/click, a visible nine-frame result and owned browser/listener cleanup. Negative controls
require the intended assertion's exact actual/expected comparison; unrelated failures cannot calibrate the defect.

The frozen new control file is SHA-256 `162ca8a596e76206131fd2ea16a48161736473c2e0efeaeafa25344a40bb53a2`. The
coordinator added six planned IDs and fixed source identities to the existing bounded control runner. The public parent
still rejects runtime flags; its closed UUID child permits exactly the fixed `--experimental-test-module-mocks` flag. No
arbitrary command, destination or private input is admitted. Minimal environment, 360-second deadline, 1 MiB
discarded-output bound, exact child evidence checks and owned cleanup remain intact. The frozen runner SHA-256 is
`db8bf58b2dd4690a5390b94b89b33cada3a1b67e4b15dcdbd734dc3817b2c5e0`.

An initial coordinator diagnostic counted only literal IDs rather than the runner's generated IDs. A first execution
then failed before any controls because the existing environment guard rejected the fixed child flag. Its zero-row
failed report and reaped-process evidence are preserved separately as setup failure, not semantic RED. After repairing
only that closed runner seam, the coordinator froze both files and ran `node scripts/hosted-controls.ts` before the
consumer writer changed HP-01. Run `32324388-dc4b-40fa-beed-f0977f7623a6` exited 1: all 95 existing rows passed, all six
new rows failed assertions, all 101 rows completed with successful cleanup, and no forced termination/process failure
occurred. Raw RED log SHA-256: `13a675675afbb159d96203d2f70f5ba575f6db1a8616dcc23a5ee817e442f5ab`.

A separate consumer writer changed exactly four HP-01 sites: import the existing detailed oracle, require exactly one
decoded `details=true`, use the detailed-response assertion and expect the absent-Xing nine-frame detail. All three
literal production case identities, small-upload scope, request bytes/media/origin checks, visible count and enabled
controls remain unchanged. Production consumer SHA-256:
`a36c71721c26dd37a6eb9f930c85f2be3a0ce2f65b84cab6b3fa47f36771168d`. A separate read-only reviewer found no supported
issue in the consumer, six controls or bounded runner seam; they did not execute tests or consult product code.

The coordinator inspected the diff and ran `npm --prefix tests/acceptance run check` once: exit 0, strict typechecking,
46 original fixtures, 41 recipes, 216 semantic rejections, 52 transport controls, 46 docs controls, all 101 hosted owned
controls and exact 72 local / 22 stage / 3 production discovery. Raw full-check log SHA-256:
`2b61c1f40c42f30340041a0937bd35368db8d00500b33494fe4ad1c5dde5f573`. Before bytes, frozen handoff, setup failure,
RED/green reports, process cleanup and raw logs remain in the ignored correction directory. This is local harness
calibration and discovery, not hosted execution, product acceptance or deployment.

Every preceding authoring-record byte remains intact. Normative contract, original fixtures, manifest, inventory,
lockfile, existing 216 semantic controls, OpenAPI predicate, product and governance bytes remain unchanged. Current CI,
fresh companion approval, actual candidate merge and separate binding remain prerequisites to product adoption.

## Harness correction 8 — 2026-10-11 (non-normative)

The next exact-head companion review found that tagged Xing and warning schemas could declare the wrong JSON type while
their structural/literal checks still passed. Sparse present-Xing/empty-warning examples concealed those branches. An
independent control author added direct/reference object-domain mutations and valid absent/nonempty-warning, annotation,
alias and composition counterparts. Before the separate predicate writer changed the checker, the coordinator ran the
frozen controls: all 216 previous refusals and positive preconditions completed, then all 24 new mutations reported
missing refusals. Raw RED log SHA-256: `bee998f25bf4ef1ddf51da62bee354824d8efa511ab9ba6a0b156206e09a9375`.

A separate writer added resolved object-domain assertions and whole-Xing/whole-warning witnesses, preserving the
matcher, reference resolver and literal extraction. The first full local calibration passed 240 controls, but
independent review found the warning witness incorrectly selected field presence by branch. Two additional owned
grouping controls proved that defect before repair: all 240 previous controls passed and both new refusals were missing.
Raw RED SHA-256: `6f88166c3d169c0a7cee13f0ecc51a182dca6b96d8b0d95cc8919fa3668f0bf2`. The writer changed the witness to
use each individual warning code; mismatch DTOs omit field and truncation DTOs exercise every admitted field.

The next full local checkpoint passed strict types, 46 original fixtures, 41 recipes, 242 semantic refusals, 52
transport controls, 46 docs controls, 101 hosted owned controls and exact 72/22/3 discovery. Raw full-check SHA-256:
`ad5b5f6dceabe3f3a5d4c8601f7083fb14730332f26b0667e6a34d32023e65cd`. Its docs/hosted processes confirmed owned cleanup.
This checkpoint did not authorize shipment: the finite-literal review found present status/marker/seek types could still
escape behind an absent example, and health status could retain its enum while contradictory composition made the
documented response impossible.

Six independent present-literal mutations and two health-composition mutations reproduced those omissions before any
further predicate edit: all 242 previous controls passed, then eight new refusals were missing. Raw RED SHA-256:
`2bf005b84f1d9701e679584b824c147c49261e83a6abb5586ea6fb210b042161`. The separate writer added whole-Xing witnesses for
both Info/Xing using the independent r2 example values, including seek count 100, and a whole-health status-ok witness.
The finite-field review remains bounded; no general schema validator, mutable-example authority or new wire behavior was
introduced.

Final frozen controls SHA-256: `89833130964a420f77a30574f862dbf868633718aaf6119450e8d4219eb03291`. Removing the 312-line
insertion reproduces every original control byte. Final predicate SHA-256:
`e5e6209fc0146496ecd1cae79aa18ad727f523da8dd9c578b41b71dc4ffad096`. The coordinator inspected both diffs and ran
`node scripts/backend-audio-controls.ts` and strict candidate typechecking with Node 24.20.0: both exited 0; all 250
semantic refusals and positive counterparts passed. Raw focused GREEN SHA-256:
`929c151cd8a6e4cb51213578e7042e05eef0a3e68e354d75be8f2419b3149279`. The complete 250-control package was not rerun
locally; current-source CI must run it before review/merge. The earlier full checkpoints retain their exact scope.

Before bytes, three RED logs, intermediate/full checkpoints, focused GREEN, process cleanup and frozen identities remain
in the ignored correction directory. Every preceding authoring-record byte is intact. Normative contract, original
fixtures, manifests, inventories, lockfile, product and governance bytes are unchanged. These results calibrate the
independent harness; they are not product or hosted acceptance. Fresh current CI, companion approval, actual candidate
merge and separate binding remain prerequisites to backend adoption.

## Harness correction 9 — 2026-10-11 (non-normative)

The next exact-head companion review found an exclusion-domain gap: a schema could advertise enum values 0/1 while
restrictive bounds or composition rejected one of them. A valid example using the other value concealed that omission.
The complete preceding CI run 38181442817 passed 250 candidate controls, 101 owned hosted controls and all 72 required
predecessor cases; those results remain scoped to its recorded head and do not establish successor product adoption. The
companion's request-changes report is preserved; no approval was published.

An independent author added eight direct/reference controls for each value under restrictive bounds and allOf. Every
mutation proves the missing value is refused, the other value is admitted and its whole example DTO remains valid.
Enum-only, bounded-range, contained-alias and compatible-composition counterparts exercise both present/absent DTOs. The
coordinator formatted only the insertion, froze its bytes and reproduced RED before a separate checker writer acted: all
250 prior controls and positive setups completed, then all eight new semantic refusals were missing. Frozen RED SHA-256:
`7e8d3cc6651dc542298ce7b85c5cdff6b2468a5977016836dfff3feaaedcb720`. The earlier pre-format RED and its distinct input
hash remain preserved separately.

The separate writer retained the exact enum/bounded-range distinction and moved the existing 0/1/null witness outside
that conditional. Matcher, reference resolver, literal extraction and all predicate bytes outside that block are
unchanged. Pinned formatting produced final predicate SHA-256
`87cb78389c78c1721e9f103a1a3f59c502685cea971218218607dd89c03c266c`. The formatted controls SHA-256 is
`3c3e96715d1a6cec70900bf00d4529398729e269bbb9fe2c567a186b24cb1ed5`; removing its 81-line insertion restores all 250
previous control bytes.

The coordinator ran the focused controls and strict candidate typechecking with Node 24.20.0 against the final formatted
snapshot: both exited 0; all 258 semantic controls and valid counterparts passed. Raw focused GREEN SHA-256:
`14dcaf6de6ca6feb6be21b783cd35e443ed96fbb0351c046849f047b40065a54`. The complete 258-control package was not rerun
locally; current-source CI must run it before review/merge. Before identities, immutable review/receipt copies,
RED/GREEN logs and final snapshots remain in the ignored correction directory.

Every preceding authoring-record byte, original fixture, inventory, manifest, lockfile and normative contract remains
unchanged. No product or governance input was edited. These are independent harness calibration results, not product or
hosted acceptance. Fresh current CI, companion approval, actual candidate merge and separate binding remain required.

## Harness correction 10 — 2026-10-11 (non-normative)

Current-head [CI 38183278512](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38183278512), attempt 1,
passed every mandatory job at `74cd93799213cc1a0bda90fc600adbaa9148a8af`. The complete candidate package passed 258
semantic controls, 101/101 owned hosted controls and exact 72 local / 22 stage / 3 production discovery. Separately, 72
required predecessor cases passed with scoped cleanup. These observations do not activate the successor or prove hosted
execution; publication and delivery jobs were skipped on the PR.

The subsequent companion run `20261011T232158-0aea69a1` completed with `request_changes` for F-001: the numeric example
matcher ignored OpenAPI 3.0.3 exclusive bounds. The complete immutable report remains preserved with SHA-256
`05e0d82fadd6ce3fba1fde2126606335ccec7192f2e7aaf4ad847f93f5271e2c`. The report assessed all 38 changed paths and passed
its documentation gate. Its static finding was reproduced below; it is not a submitted approval.

An independent control author added 12 cases before the separate matcher writer acted: four integer/number endpoint
checks and eight exclusion-domain cases covering lower/upper endpoints, direct/reference schemas and composition. Valid
inclusive false flags, exclusive bounds outside 0–1, fractional number values and opposite-value whole DTO examples
preserve positive coverage. This correction used acceptance material and official standards only; prior product-review
context was disclosed rather than claimed absent. The control author did not inspect or edit the matcher or execute
checks in this correction. The matcher writer did not author the controls or read product implementation.

The coordinator froze the formatted controls at SHA-256
`8dfca1f5ab78a8a966628bbc9bdfd76abecc58123e16a6c6508e23929e7aba8f`; removing the 96-line insertion restores all 258
preceding control bytes. With unchanged matcher `87cb78389c78c1721e9f103a1a3f59c502685cea971218218607dd89c03c266c`,
focused execution exited 1 and reported all 12 missing refusals after completing prior controls and valid counterparts.
Raw RED SHA-256: `422d0ba5ba72aa7fbbc1aa0c4bc77cc4518d33c7f6fdbdb9e1cbe186fed90890`.

Only the four minimum/maximum comparisons in the integer/number matcher branches changed. Boolean true uses strict
comparison; false or absent preserves inclusive comparison. Resolver, literal extraction and contract predicates remain
unchanged. The final matcher SHA-256 is `0955bac6fc3a06491266107a8fe7a4fae5e35cb049f1f51d43a8996c75aa4304`. The
coordinator ran final focused controls and strict candidate typechecking with Node 24.20.0: both exited 0, with 270
semantic controls passing. Raw focused GREEN SHA-256:
`1d43fb18ef6aac5251c378713b11332272e905530b7feff57db4143142c78f24`. The complete 270-control package has not run
locally; fresh current-source CI remains required. Before identities, review/receipt copies and RED/GREEN evidence stay
in the ignored correction directory. Every preceding authoring byte and the other immutable inputs remain unchanged. No
product, governance or normative contract was edited. Calibration is not product or hosted acceptance, and actual
candidate merge, separate binding and subsequent product adoption remain pending.

## Candidate harness correction 11 — 2026-10-11 UTC

Full candidate CI [38185084282, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38185084282)
passed all 270 semantic controls for `f7955448f6438e2d467a0bd98469809851b85153`, with separate required predecessor
acceptance. It did not establish successor binding, product adoption, hosted execution or publication. Fresh companion
run `20261011T234655-f3e8c82c` requested changes in F-002: the OpenAPI predicate checked uint32 type and numeric bounds,
but could accept an exclusive endpoint that disagrees with the required declaration domain. Its complete receipt and
report are preserved; the review was not published as an approval.

A fresh independent acceptance author read only governing instructions, the normative contract, frozen fixture
expectations, the existing control runner and the finding. It did not read product code or the OpenAPI checker. It added
24 fixed mutation controls covering three optional uint32 fields, both endpoints, direct/allOf placement and
inline/local-reference schemas, with 12 inclusive counterparts. Existing 270-control bytes remain unchanged. The root
formatted and froze these controls before releasing the separate checker writer.

The frozen RED ran from `tests/acceptance` with Node 24.20.0 on 2026-10-11 at 23:57:29 UTC and exited 1. It recorded 20
missing endpoint refusals and four existing quality-zero refusals; all mutation setup, matcher preconditions and
inclusive counterparts passed. The original checker SHA-256 was
`0955bac6fc3a06491266107a8fe7a4fae5e35cb049f1f51d43a8996c75aa4304`; the frozen control SHA-256 was
`1c3b51adec0504731701be7175b310c8937502277fc9b47f020963026d9416c8`. Raw RED log SHA-256:
`5ee05107e4156586ad226ffd233d8f9c8999bbbd1c0d7a50ebcb776c3bf42ea2`.

After RED, the separate writer added one semantic endpoint assertion through the existing resolved-schema matcher inside
the three-field uint32 loop. It read no controls or product code and ran no tests or formatter. The resolver, C10
matcher and all other predicates remain unchanged. The checker SHA-256 is
`a68e6ffca09836887437cbaf907350e6e3f673df02fc4488985a90afa0d47338`.

Root execution of `node scripts/backend-audio-controls.ts` passed all 294 semantic controls at 23:58:20 UTC; raw log
SHA-256 is `1cbc5ca152e2d03ab5a9085735cbef28d9a272b7a864dcd4b6a457c9618762ce`.
`node node_modules/typescript/bin/tsc --noEmit` passed. An earlier attempted `npm run check:types` failed because that
script does not exist; its command-error output is retained separately and is not a failed type check. Explicit-file
Prettier and diff checks passed. The full 294-control package was not rerun locally; new complete CI and a fresh
companion review remain required. The ignored correction-11 journal retains original input hashes, frozen RED, focused
GREEN and command-error output. Other frozen inputs and requirement identities remain unchanged.

## Candidate harness correction 12 — 2026-10-12 UTC

Full candidate CI [38186465676, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38186465676)
passed all 294 semantic controls for `11538cd343c039f1e131c5c34c971275a104aa79`, with separate required predecessor
acceptance. Fresh companion run `20261012T001011-d21c75a8` requested changes in F-003: effective scalar constraints
could exclude supported flags, minimum/maximum frame lengths or attainable offsets while admitting the named examples.
The complete report and receipt remain preserved; this request-changes review was not published as an approval.

The independent acceptance author added 96 mutation controls before the separate checker writer began. They cover all 16
supported flags, minimum 96 and maximum 1441 frame spans, attainable frame/marker offsets, and count-one responses in
both published forms. Direct/allOf placement and inline/local-reference variants include valid counterparts and matcher
preconditions. Existing frozen successful DTOs supply count-one and flag witnesses; no expected output changed. All
64,649 prior control bytes remain identical. The root formatted and froze the insertion at SHA-256
`55199a3d2a6c8708edecc75491892f731f9afe71c23854565bc1bfcd6a3ec9cf` before releasing the checker writer.

The frozen RED ran `node scripts/backend-audio-controls.ts` with Node 24.20.0 from `tests/acceptance` at 00:29:45 UTC.
It exited 1 after reaching all 96 new controls: 88 missing semantic refusals and eight existing rejections. Valid
counterparts and matcher preconditions passed. The unchanged checker SHA-256 was
`a68e6ffca09836887437cbaf907350e6e3f673df02fc4488985a90afa0d47338`; raw RED log SHA-256 is
`873ebefa4d58fe2b73103d6573fede4ee18ab0501ef828fa410cf0a6d6178581`.

After RED, the separate writer added nine lines: effective scalar witnesses and all 36 frozen successful responses
checked against the published success schema in both minimal and detailed forms. It read only the checker, normative
contract and existing fixture JSON, without controls or product access, tests, formatting or Git writes. The matcher,
resolver, prior predicates and fixture bytes remain unchanged. Final checker SHA-256:
`cb802b442895c22167bc97effc1876157ee0a521b716e3539e0b40943af75fe7`.

Root focused execution at 00:31:25 UTC passed all 390 controls; raw GREEN log SHA-256 is
`4d38e3c5612d9c7fb812db2906111988c17cf24174a982c927908887e12fe554`. `node node_modules/typescript/bin/tsc --noEmit` and
explicit-file Prettier checks passed. The full 390-control package has not run locally; new complete CI and fresh
companion review remain required. Original inputs, report/receipt and timestamped RED/GREEN records remain in the
ignored correction-12 journal. No normative contract, fixture expectation, requirement inventory, product or governance
file changed. Candidate calibration is not product or hosted acceptance; actual merge, separate binding and product
adoption remain pending.
