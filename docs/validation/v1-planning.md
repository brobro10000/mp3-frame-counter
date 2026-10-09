# Unified planning validation

Date: **2026-10-09**. Checkout: merged foundation `143498aae11ad2e874d1c1afa43897d6e6352794` plus local documentation
changes. This is P0 evidence only, not application tests, human approval, phase execution or deployment. No dependency
installation, product/test/adapter/configuration implementation, branch, commit, PR or service mutation ran in this
pass.

## Observed planning-tool boundary

Installed MVP Orchestrator **1.3.0** was inspected without upgrade, source edits or copying private code. Its pure
`resolve_tasks.py` and `decide_evidence.py` commands each exited 0 with status validated for a custom retrofit route:
project.mvp → project.system → project.bootstrap → project.phase-plan. The router identified project.mvp as next, with
zero completed capabilities; later steps are dependency-blocked. Routing readiness is not approval of inputs.

At the first authoring boundary, generated metadata is **withheld pending reviewed inputs**. The installed define-mvp
skill says, “Never convert an assumption or unresolved question into a product claim.” Its
`references/mvp-quality-rubric.md` requires exactly `status: approved`; the unified proposal is for human review and
contains explicitly proposed contract details. We did not reinterpret approved, force a draft into an unsupported
schema, fabricate validator results or record completion. See [the planning boundary](../../agents/README.md).

Portable forms of the commands actually run, resolving MVP_SKILLS_ROOT to the installed skills directory:

```sh
python3 "$MVP_SKILLS_ROOT/orchestrate-mvp-workflow/scripts/resolve_tasks.py" --project-root . --request .mvp-workflow/unified-planning/request.json --json
python3 "$MVP_SKILLS_ROOT/orchestrate-mvp-workflow/scripts/decide_evidence.py" --project-root . --plan .mvp-workflow/unified-planning/plan.json --json
```

The exact request and raw results remain in ignored `.mvp-workflow/unified-planning/`; absolute tool-result paths are
not committed. The old three-phase draft's 17 files are preserved with modes/hashes in
[the superseded archive](../../agents/history/v1-draft/README.md). Its successful specification/bootstrap/phase checks
are historical only. The original merged foundation archive and sanitized output JSONs retain their prior meaning.

The installed phase validator requires direct Python and has a 60-second validation subprocess timeout. Router replay
also restricts its environment; the old npm discovery blocker is not fixed by planning. No E2E adapter was created or
executed. P1 must review an ordinary CI handoff or separately scoped evidence adapter with genuine failure propagation.

## Read-only provider research

Vercel team/project tools returned one accessible team and no repository-filtered project; plan/role entitlement was not
exposed. Supabase organization inspection reported free plan and an unrelated inactive project; it was untouched. No
dedicated Render connector was exposed; account access remains unverified, not impossible. No secrets, database contents
or unrelated environment configuration were inspected or recorded.

Current official docs and Supabase documentation search support the dated
[three-provider comparison](../architecture/deployment.md). A failed browser fetch of the Supabase changelog was
recovered by a read-only curl fetch. Some Render pricing text and provider ingress details were unavailable or
unspecified; the comparison leaves those gates unresolved. Research is documented evidence, not a hosted upload probe.

## Documentation checks

The existing `npm run validate` completed with exit 0 using pinned Node 24.20.0/npm 11.19.0 and already available
dependencies/cached actionlint. Formatting, workflow syntax, repository policy, portability, all 13 terminal-gate cases
and all 9 tooling cases passed: **22 existing tests, no failures or skips**. No npm install/ci or application E2E ran.
These are foundation/document checks, not acceptance-baseline or product evidence.

Additional actual read-only checks passed: 129 relative Markdown file destinations; 16 unique APP-V1 requirement rows
and 12 unique AC rows; registered source hashes; all 12 foundation and 17 superseded-draft archive byte hashes/modes;
private sample size/hash and ignored status; absence of future application files and stale active execution metadata;
`git diff --check` and `git diff --cached --check`. The sample remains 1,458,172 bytes with its recorded SHA-256.
MediaInfo and mmdc remain unavailable on PATH. No MPEG format/count observation is inferred from the hash.

An independent read-only document review found no blocking coverage gap. Its role-link and prose-wrapping suggestions
were applied. This agent review is not human approval. Five phase documents, four role documents, the acceptance matrix,
provider gates and release/recovery sequence were checked for consistency.

The work remains local and staged for review; main HEAD is unchanged. Existing scripts, package/lockfiles, workflows,
ruleset JSON and historical output JSONs were not changed. The older foundation GitHub verifier was not rerun as a
current audit because its open-PR assumption is obsolete. No new remote CI run is claimed.

## Mermaid boundary

All five authored diagrams were submitted to the available Mermaid Chart display tool. Each returned a non-error
response saying it rendered, but no parser diagnostic or inspectable rendering was supplied to this validation record.
No local mmdc is available. Independent syntax validation and visual rendering inspection remain **unverified**; no
dependency/browser installation was performed to obtain them. Review source/previews and verify with an available
inspectable renderer later. Source consistency is reviewed separately from a renderer pass.

## Remaining gates

The acceptance contract still needs explicit edge-policy and independent oracle review before P2 freeze. MediaInfo's
sample count is unobserved. Provider fit/account/budget and production approval remain P5 gates. Resource/time budgets
and base-image pins need verified selection in P4. Generated unified metadata awaits reviewed required inputs; no active
execution plan remains. [Decisions and risks](../architecture/decisions.md) name owners and deadlines.

Next proposed scope is P1 foundation verification/adaptation only, requiring a separate instruction. Nothing here starts
P1 or grants authority to merge, provision, deploy, promote or roll back.
