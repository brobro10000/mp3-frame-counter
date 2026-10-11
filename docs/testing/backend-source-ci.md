# Backend source CI prerequisite

**Independent expectation authoring — 2026-10-11, local and unbound.** This prerequisite defines the owner prompt's
source validation requirement within the existing separate workflow jobs. It grants no publication, binding, settings
change, merge, hosted execution or deployment. The author reviewed product fixes separately but derived these CI
expectations from the owner requirement, historical CI policy and fixed command spellings supplied by root, before the
source-CI implementation existed. No product implementation supplies an expected test result.

The original Linter, Base acceptance E2E, Application tests and Server tests caller/leaf identities remain unchanged.
Every executing worker retains its existing trusted preflight before npm installation, permissions, finite setup and
deadlines. Required acceptance and same-run image custody remain independent. This policy adds no worker or test runner.

## Narrow interfaces

The proposed pure `requireBackendSourceCi(input)` accepts exactly `sourceFiles`, `ancestorFiles`, `packageScripts`,
`linterCommands` and `toolingFiles`. Inventories contain canonical tracked relative paths without duplicates. Ancestry
is a list of path inventories from independently read, exact first-parent commits; it is not a caller-selected boolean
or fabricated binding. The helper does no I/O, mutation, installation, tool execution or acceptance selection.

The result is exactly `{ adopted, unitFiles, sourceChecks }`. Historical and prerequisite-only trees retain the original
five units: frontend response ownership in Application tests; docs build, docs, HTTP and MP3 ownership in Server tests.
The actual factory, its test, contract module, generation module or new source-validation scripts select adoption.
Adopted trees require all six unit files, adding only `tests/unit/app.test.ts` to Server tests. All prior units remain
owned exactly once. A deletion cannot downgrade adoption when a verified first-parent ancestor contains an adoption
marker. Prerequisite paths alone never claim that the product refactor is implemented. This local history obligation is
inventory governance; it never authorizes acceptance activation. A separately bound acceptance successor continues to
derive its obligations from the existing independently verified contract/binding ancestry.

`readBackendSourceCi(root, sourceRevision, baseRevision)` is the proposed bounded Node-only adapter. It must derive
current and first-parent inventories from exact regular Git objects and validate explicit commit identities and trusted
base ancestry. It cannot substitute moving HEAD, working-tree presence, environment skip flags or a caller-supplied
adoption result. The independent tests model pure inventory decisions without manufacturing Git identities; direct
review and real source-reader verification remain required for the adapter implementation.

The current Linter checks step has no `CI_BASE_REF` environment field. Its CLI may derive the explicit producing source
from `GITHUB_SHA` and base from the actual push event's `before` or pull-request event's `base.sha`. It must verify the
event, exact checkout and first-parent ancestry before passing source/base to the reader; no workflow step/environment
expansion is necessary. Existing preflight remains the authority for execution admission. Local working-file policy
checks may combine explicitly read working metadata with verified ancestry, but they cannot label uncommitted product
files an exact committed source or establish CI execution. A historical local reader may explicitly resolve HEAD first,
then pass its exact identity and report dormant behavior when that committed tree predates adoption.

`runBackendSourceChecks(input, execute)` is exported by `run-backend-source-checks.mjs`. It validates input before
invoking the callback and executes the helper's closed command/argv sequence, stopping and propagating the first
failure. The CLI must obtain actual source/base metadata through the reader and use this same export with a bounded
shell-free spawn. Importing it performs no command, socket, timer or process-hook work. Historical and prerequisite-only
product trees execute no new application checks. Adopted trees execute, in order:

```text
npm run typecheck
npm run lint:source
npm run build:server
npm run check:openapi
```

The selected application scripts are exact:

```text
typecheck: tsc --noEmit -p tsconfig.json && tsc --noEmit -p frontend/tsconfig.json && tsc --noEmit -p tsconfig.tests.json
lint:source: oxlint --deny-warnings server/src frontend/src tests/unit
build:server: tsc -p tsconfig.json && node dist/documentation/generate.js && node server/src/build-docs.mjs
check:openapi: redocly lint --config redocly.yaml dist/openapi.json
```

These retain the existing backend/browser configurations and add the already selected root test configuration. Source
lint checks actual backend, shared contracts, browser and unit sources. Generated OpenAPI precedes Redocly semantic
validation. Formatting, a local-reference-only check, empty command, swallowed error or missing source set cannot
replace these checks. Ordinary package/tool acquisition remains outside this pure policy.

## Compatible migration proposal

Keep `ci-visibility-policy.mjs`'s existing historical 46-file `ciToolingShards` export and known layout/job names. Add a
source-selected extended foundation shard containing exactly three new expectations beside those original 46:
`backend-contract-policy.test.mjs`, `ci-unit-inventory.test.mjs` and `backend-source-ci.test.mjs`. Match the root native
`test:tooling` declaration and actual shard execution to that 49-file union, with no omissions or duplicates. Preserve
all four shard identities. Earlier historical source metadata continues to select its original union; verified
prerequisite ancestry prevents deleting markers to downgrade it.

Allow the original finite Linter checks block for historical sources and one exact successor block for prerequisite and
adopted sources. The successor preserves every original line and appends only
`node scripts/run-backend-source-checks.mjs`. It remains the final existing checks step after npm installation; the
current eight-step shape, trusted preflight and separate jobs stay intact. The runner is dormant before product
adoption. Do not broadly allow arbitrary commands, extra steps or unknown tooling lists to accommodate this migration.

Use the reader's ownership selection in `run-ci-lane.mjs` instead of testing only current factory existence. Keep the
application/server lane commands, builds, native runner and regular-file inventory checks. Invoke the pure source policy
from the actual policy path and source-reader path before selecting a layout or running tools. This is proposed wiring,
not implemented by the independently authored files.

Existing frozen CI controls need no weaker assertions: their literal historical 46-file commands and five-unit sources
remain valid. New controls independently require the extended wiring. A source graph/classification pass is not proof
that GitHub ran any command or that product acceptance passed.

## Evidence and limits

Run `node --test scripts/backend-source-ci.test.mjs` with pinned Node 24.20.0. The controls establish independent
literal inventories, marker persistence, real lint/typecheck/OpenAPI command selection, ordered execution callbacks and
failure propagation. Real package and workflow controls verify declaration wiring. They do not execute TypeScript,
Oxlint, Redocly, the product, Docker, frozen acceptance, GitHub or cloud resources. Missing APIs are explicit
availability failures before expected rejections; they cannot count as passing negative controls.

The initial command ran with Node **24.20.0** and exited **1**: **22 tests, 0 passed, 22 failed, 0 cancelled, 0
skipped**. Twenty groups failed explicitly at the missing `requireBackendSourceCi` API before rejection assertions. The
two actual wiring groups separately failed because the root tooling command omitted all three new prerequisites and the
Linter checks block omitted its source-runner line. Dependency installation completed before this run; missing YAML was
never counted as a useful red decision. Full raw output is retained in the authoring chat's tool result, with SHA-256
`5cd349e346a42bf4c488a3fedcd64b4ed3824ae6ed4e3b0d6a9aa6723ad290ba`.

The formatted independent expectation file is frozen at SHA-256
`636bae7c8126aa6e5d0f9fd7043db180379779e12fe90cc7c27ec0ba956523fd`. Earlier dependency-policy and unit-inventory failure
evidence remains unchanged. Passing these local controls later will not establish publication, remote binding or CI
execution. The source adapter still needs direct review and real exact-source/ancestry verification; synthetic ancestor
lists alone cannot establish its Git-object behavior.

## Observed implementation review

The first local implementation review ran the frozen source-CI command with Node **24.20.0** and observed exit **0**:
**22 passed, 0 failed, 0 cancelled and 0 skipped**. The expectation file still has the frozen SHA-256 above. A separate
read-only check selected **49 unique tooling files**, assigned exactly once: foundation 11, acceptance 13, publication 9
and delivery 16. The historical exported inventory remains 46 files. These observations do not replace the retained
initial failures and establish no acceptance binding or hosted execution.

Direct review found that the source runner validates metadata before its four sequential, bounded, shell-free tool calls
and propagates the first failure. The adapter takes explicit exact source/base commit identities, verifies first-parent
base ancestry and reads regular Git objects. Its local history markers govern inventories only. The Linter successor
appends one source-runner line after installation while preserving the existing worker identities and eight-step checks
structure. Real exact-source adapter execution was reported separately by root; this reviewer did not manufacture Git
history or independently repeat that Git execution.

One material compatibility issue remains in this first review: `policy.mjs` unconditionally invokes the product source
adapter for existing governance-only runtime and docs dependency CLI fixtures. Those fixtures intentionally copy only
package/workflow/control metadata and contain no product units or tooling files. Their prior successful controls would
therefore fail source-inventory validation before checking dependency policy. The finding was reported with the narrow
proposal to scope application source-inventory checks to the existing integration phase. This reviewer did not edit the
implementation or weaken the frozen fixture expectations.

The later compatibility re-review confirmed lazy helper imports and application inventory validation scoped to split
integration or verified first-parent source/prerequisite marker history. The historical metadata/clone fixtures no
longer require absent application helpers. New source, dependency graph or selected tool obligations still require the
backend contract helper, while historical graphs retain the original validator and diagnostics. Root separately reported
**69/69** focused contract/runtime/docs/stage-config controls passing; this reviewer did not repeat their Git fixture
execution. No further material compatibility defect was found in the reviewed correction.

The owner's subsequent test-locality amendment is independently specified in
[Unit locality CI amendment](backend-unit-paths-ci.md). It appends controls after the original frozen 19,833-byte test
prefix without changing those original assertions or the 49-file tooling union. The original initial-red evidence and
first-review findings above remain historical evidence; neither the compatibility correction nor locality preparation
establishes acceptance binding or hosted execution.

## Independent backend product admission amendment — 2026-10-11, contract r5

The shipment instruction now authorizes the coordinator's normal commit/push, companion review and owner merge, followed
by a code-freeze handoff. This independent author still edits only appended admission expectations and this rationale;
the tests do not perform real repository writes, authenticate reviews, select a binding or authorize publication.

The observed product package/smoke diff requires exactly two root product-config reservations, `.oxlintrc.json` and
`redocly.yaml`, and one exact product script path, `scripts/smoke-local.mjs`. Root neighboring config spellings remain
unclassified; neighboring scripts remain governance. The smoke change moves the private sample expectation from 6090
physical frames to 6089 audio frames, so it cannot be moved into a backward-compatible prerequisite. Treating this exact
local smoke path as a product input requires independently bound successor acceptance whenever its behavior changes.

Four new package script names require exact product command values:

```text
test:server: npm run build:server && cd server && node --test tests/*.test.ts
test:frontend: npm run build:frontend && cd frontend && node --test tests/*.test.ts
lint:source: oxlint --deny-warnings server/src server/tests frontend/src frontend/tests
check:openapi: redocly lint --config redocly.yaml dist/openapi.json
```

Adding or removing these reviewed exact values is a product delta. An altered command under the same name remains a
governance delta; a name-only reservation must not admit replacement gate execution. Existing product command names,
including `build:server`, `typecheck` and `test:unit`, retain historical classification. Their actual source execution
continues to be checked by the independently frozen source-CI controls. No new glob/prefix exemption or command parser
is needed.

`validate` and `test:tooling` remain governance. The coordinator will put their compatible prerequisite changes in the
separate governance diff. The prerequisite `validate` retains the original validation pipeline and appends only
`&& node scripts/run-backend-source-checks.mjs`: this runner is dormant before product adoption and strict afterward.
The later product must retain those governance command bytes, including the already selected 49-file tooling union, so
it does not combine product implementation with its own admission or gate change.

Eight append-only controls cover exact configs and command values, regular Git blobs, unknown neighbors, the smoke
reservation, continued product/governance separation, independent candidate/binding lanes, persistent successor
activation after product removal, and exact historical replay. Synthetic disposable Git fixtures model decisions only;
their commands, local smoke text and suite bytes are never executed as product or acceptance. They change no registry
schema, review identity, immutable genesis, candidate suite or trusted-base rule.

The original expectation prefix remains 56,420 bytes with SHA-256
`3fc2d896dc433bb051b4429c1387c20055fcfb8eb77691c09aacc1f062c4f629`. Run the bounded new controls with pinned Node:

```text
node --test --test-name-pattern='backend product admission r5:' scripts/acceptance-transitions.test.mjs
```

Then run the complete `node --test scripts/acceptance-transitions.test.mjs` after implementation. These tests establish
path/command classification and persistent suite selection; they do not establish hosted execution or replace actual
independent successor review and binding. An implementation that requires changes to that trust contract exceeds this
amendment and needs a separately reviewed proposal.

The initial targeted command used Node **24.20.0**, exited **1**, and observed **8 tests: 2 passed, 6 failed, 0
cancelled and 0 skipped**, in 10.45 seconds. The known failures were the unclassified `.oxlintrc.json` path, governance
classification of the new exact package commands, and governance classification of the exact smoke path. Three further
groups stopped at the missing config reservation before their intended mixed-lane, candidate/binding or persistence
decisions. Those availability failures were retained as failures, not counted as successful rejections. The unknown
neighbor/regular-blob controls and altered-command safeguards already passed. Raw failures remain in the authoring
chat's tool results.

The appended, formatted expectation file is frozen at SHA-256
`969f9f5cd318920917e5abeda13e987034620a2620eee44c01511dc34d69af82`; its original 56,420-byte prefix has the unchanged
hash above. Focused Prettier and `git diff --check` passed. Implementation, full-regression results, actual successor
binding and shipment remain separate coordinator-owned evidence.

## Coordinator shipment validation — 2026-10-11

The independently frozen eight admission controls initially had two passes and six expected failures. After exact
path/command reservations, the complete transition suite passed **124/124**, with zero failures or skipped tests. Pinned
Node 24.20.0 policy, workflow actionlint 1.7.12, tracked formatting and portability checks also passed on the staged
prerequisite. Original test prefixes and genesis/suite bytes remain unchanged. Independent implementation re-review
found no material defect. These are local prerequisite checks, not merged-main acceptance or publication.

GitNexus 1.6.9 indexed this exact worktree without injecting context files. Staged detection identifies the shared
acceptance resolver as a critical-impact hub: its direct caller is the existing history `advance` function, feeding
admission, runtime selection and release preparation. The complete transition tests cover those unchanged trust rules
plus the narrow additions. Source-checker callers are policy, unit-lane inventory and the bounded source runner. This
expected reach warrants exact-head companion review and normal required CI; the graph is not approval evidence.
