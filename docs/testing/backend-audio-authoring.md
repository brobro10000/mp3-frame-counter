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
