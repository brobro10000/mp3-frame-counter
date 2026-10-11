# Unit locality CI amendment

**Independent owner amendment — 2026-10-11, local and unbound.** The owner now requires backend tests inside `server`
and frontend tests inside `frontend`. Root supplied the command boundary before implementation: builds retain the
existing root package/lock and `npm run build:server` or `npm run build:frontend`; native unit execution changes its
working directory to the owning application. This amendment grants no acceptance activation, Git writes, publication or
cloud execution. The author did not read product tests or runtime implementation while defining the controls.

## Exact ownership and persistence

The localized map is exactly:

```text
application:
  frontend/tests/frontend-response.test.ts
server:
  server/tests/app.test.ts
  server/tests/docs-build.test.ts
  server/tests/docs.test.ts
  server/tests/http.test.ts
  server/tests/mp3.test.ts
```

Retain the historical five-unit and adopted six-unit `tests/unit` layouts before locality migration. Every localized
unit path is a migration marker. Current or independently verified exact first-parent ancestor inventories containing
any such marker require the complete localized map. Missing, extra, duplicate, mixed old/new or downgraded inventories
fail closed. Deleting all localized paths cannot restore either old layout. Existing factory/contract/generation
adoption markers retain the old six-unit obligation when locality has not begun. Acceptance remains at
`tests/acceptance`; its files never join application unit ownership. These history markers govern inventory and carry no
acceptance-binding authority.

## Narrow APIs

`backend-unit-layout.mjs` exports pure `requireBackendUnitLayout(input)`. The input has exactly `sourceFiles` and
`ancestorFiles`, matching the existing source reader's canonical unique relative path inventories. Ancestry contains
path arrays derived from verified exact first-parent objects; it is never a caller-selected migration flag. Return
exactly `{ layout, unitFiles }`, where layout is `historical`, `adopted` or `localized` and unit ownership uses the
corresponding literal map. Do no I/O, mutation, tool execution, acceptance selection or installation. Return fresh maps
and arrays without retaining caller arrays.

`run-ci-lane.mjs` exports synchronous `runCiUnitLane(root, lane, input, execute)`. Root is an absolute repository path;
lane is only `application` or `server`; input is the pure layout metadata above. Validate all input before calling
`execute(command, args, { cwd })`. Build first from repository root using `npm`, arguments `run` and the existing exact
`build:frontend` or `build:server`. Then invoke the current Node executable with `--test` and exact owned test paths.
Historical/adopted paths execute from root. Localized application execution uses `cwd = root/frontend` and
`tests/frontend-response.test.ts`; localized server execution uses `cwd = root/server` and the five `tests/*.test.ts`
names above, in listed order. No shell, `cd`, selector, skip flag or glob is needed. Propagate either callback failure
and execute no subsequent command. The actual application/server CLI must use this same seam with its bounded spawn.
Acceptance retains its existing native delegation to `run-ci-phase.mjs` through the separate acceptance lane.

Extend the existing source-CI selection to consume this layout without adding fields to its frozen three-field return
shape. Localized ownership still selects the four existing real source checks. Retain the existing exact typecheck,
build and OpenAPI script spellings. Localized source lint is exactly
`oxlint --deny-warnings server/src server/tests frontend/src frontend/tests`; stale `tests/unit` lint cannot pass after
migration. The exact-source reader must track localized markers in its verified first-parent history reads and require
regular source objects at the selected paths. Historical five/six-path replay stays unchanged.

## Append-only independent controls

Migration controls are appended to `scripts/backend-source-ci.test.mjs`, keeping the existing tooling inventory at 49
files and preserving every original assertion. The original **19,833-byte** prefix remains frozen at SHA-256
`636bae7c8126aa6e5d0f9fd7043db180379779e12fe90cc7c27ec0ba956523fd`. Its 22 original controls and original red evidence
remain intact. The append-only block independently specifies three maps, synthetic ancestry mutations, exact command and
cwd observations, failure propagation, source-CI integration and required acceptance delegation. No product parser, test
or runtime implementation supplies an expected value. Synthetic ancestry is never presented as real Git history.

Run the controls using pinned Node 24.20.0 with `node --test scripts/backend-source-ci.test.mjs`. Missing new APIs must
fail before rejection assertions; they cannot count as successful negative decisions. These controls execute no product
build, unit test, Git, Docker, browser, acceptance suite or cloud action. Real adapter history and actual CLI wiring
still need direct review after implementation. Passing local controls establishes neither hosted CI execution nor
acceptance binding.

The layout helper may be prepared in a historical five-unit prerequisite tree. Its path alone, including ancestry, does
not activate locality. The exact-source reader traverses the helper path and every localized unit path when collecting
history, but only a localized unit path activates the persistent migration. Once locality applies, source-CI requires
the current regular `scripts/backend-unit-layout.mjs` helper; deleting it fails closed.

## Initial amendment evidence

Before localization implementation, the pinned command exited **1** with **41 tests: 23 passed, 18 failed, 0 cancelled
and 0 skipped**. Every original control passed, as did the actual existing acceptance-delegation declaration. All 18 new
behavioral controls failed explicitly at the absent `requireBackendUnitLayout` API, before rejection assertions or
execution callbacks. The formatted original prefix retains the SHA-256 recorded above. Command output was captured by
the authoring tool and retained in the authoring session. The complete amended test is frozen at SHA-256
`f5b6bb20fb69af9cca810b85a471ae5b2ddc303ab4210b79b9865c933194246d`.

An earlier exploratory declaration assertion assumed the acceptance command was the final workflow step. Reading the
workflow metadata showed release publication and artifact steps follow it. Before freezing the amendment, the author
corrected that assertion to require the actual unique, unsuppressed acceptance command after installation. That
authoring correction was not counted as a product failure or acceptance result. Earlier red evidence remains retained.
