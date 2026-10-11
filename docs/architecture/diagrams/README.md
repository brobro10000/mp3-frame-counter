# Source-linked architecture diagrams

These three `.mmd` files are the canonical implemented views linked from [V1 architecture](../v1.md):

| Diagram                    | Purpose                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| [runtime.mmd](runtime.mmd) | Local containers, Fastify factory/plugins/lifecycle, parser and independent acceptance runner. |
| [upload.mmd](upload.mmd)   | Raw guards, scoped admission/collection, audio analysis, DTO projection and browser recovery.  |
| [release.mmd](release.mmd) | Required checks, exact tested artifacts and GitHub publication without deployment.             |

The focused [network.mmd](network.mmd) is the canonical handoff view of loopback ports, the private API and the separate
host acceptance process. It complements the three views above and is outside their current external-sync allowlist.

Each file begins with Mermaid Chart YAML frontmatter: `query` describes its intended scope and `references` lists exact
source files as `"File: /repository/relative/path"`. The leading slash means repository root, not a local machine path.
Update references when a source moves; do not use absolute filesystem paths or globs. This matches the first-party
[metadata writer and resolver](https://github.com/Mermaid-Chart/vscode-mermaid-chart/blob/7ac3d0242002113af58e19515590b6ffaa3d39df/src/frontmatter.ts#L185-L307).

The installed [Mermaid Diagram Sync Assistant](https://mermaid.ai/docs/ai/github-app) can regenerate these files when a
PR changes a referenced source and commit its updates to that PR. Review every generated diff for semantic accuracy,
including handwritten audio counting and physical diagnostics and the release-only boundary, and require CI on the
resulting head. AI output does not modify requirements or establish approval, test results or deployment. Avoid parallel
edits while a sync is running.

Diagram-only edits do not exercise source-triggered regeneration. The observed controlled probe produced a successful
bot commit after a referenced Compose comment changed, but only refreshed metadata and retained the diagram placeholder.
That placeholder was restored manually. A successful app check proves neither a meaningful diagram change nor semantic
accuracy; compare its actual diff with the source. See the
[probe record](../../validation/mermaid.md#controlled-sync-probe).

In PR #59, bot commit `572d4ba` retained the new four-workflow query and references but restored the prior main release
graph. The diagram was corrected manually; this is observed stale output, not evidence of an internal app cause. The
release query now distinguishes the current head's four callers and nine leaf jobs from historical replay and logical
publication records, and references the current CI guide. These inputs improve review context; semantic accuracy still
requires comparing each bot diff with the exact source. The repository renderer never rewrites diagrams.

The October 11 current-source audit checked all three views. The runtime view now includes API-packaged offline Redoc
assets and the same-origin docs proxy. The upload view distinguishes mapped JSON proxy errors from other ingress
responses and fetch rejection, and renders only current request outcomes. The release view describes the prepared
four-workflow activation, with frozen acceptance and exact-image publication intact. Compare these implemented views
with their referenced source; historical and planned diagrams are not current runtime authority.

The local backend amendment makes the existing Fastify boundaries explicit. `runtime.mmd` shows the unbound factory,
root schemas/Swagger, sibling upload and health plugins, instance lifecycle and pure analyzer inside one API process.
The raw server adapter serves finite verified docs assets and early refusals before the application handler. The
build-only generator obtains OpenAPI from the same registered factory, then closes it; it is neither a runtime service
nor proof that Redoc examples have been rendered successfully. `upload.mmd` separates raw guards, admission before
allocation, bounded collection, one analysis, invariant-checked DTO projection and idempotent terminal release. The
historical physical-count and native-HTTP views retain their original evidence; these canonical diagrams describe the
current local audio target without claiming its independent successor is bound or published.

The root [`.mermaidignore`](../../../.mermaidignore) opts in only these three standalone diagrams. Other standalone
diagrams, original requirements, evidence, historical/generated agent artifacts and the frozen acceptance package are
excluded from regeneration. The manual phase-policy and deferred-hosting views remain in `v1.md`. Do not copy the
canonical diagram bodies into Markdown: a second editable copy would become stale after a bot update.

To view locally, run `npm ci`, `npm run mermaid:install` and `npm run check:mermaid` with the pinned toolchain. New
files must be Git-tracked first. The report at `.artifacts/mermaid/result.json` maps each source to its rendered SVG in
the same directory; open that SVG in a browser. A Mermaid editor can also open the `.mmd` directly. GitHub's plain file
view may show source instead of rendering standalone diagrams.

Docker boundaries are explicit: the runtime view nests the two Compose containers and the API's one Node process; the
upload sequence groups participants by container; the release view separates image builds, running test containers and
archived images. Browser JavaScript and the host acceptance processes sit outside those application containers.

The existing mandatory syntax/rendering check still validates **all** tracked diagrams, including excluded archives and
requirements Markdown. `.mermaidignore` controls only the external sync app and never suppresses repository validation.
See [validation evidence](../../validation/mermaid.md) for the distinction between local renders and observed app runs.
