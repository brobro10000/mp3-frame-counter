# Required-profile source projection verification

Dated 2026-10-10. The
[selected API](../testing/hosted-profile-policy.md#required-profile-projection-amendment--2026-10-10) preserves the
existing immutable reader and adds original required declaration inputs/hashes for a future hosted consumer. Independent
expectations and implementation are complete; focused checks and independent review passed. Required CI, companion
approval, merge and publication remain pending. No publisher authority, hosted eligibility or deployment is established.

## Independent expectations before implementation

The acceptance author extended the existing source-reader test file while preserving its original 1,168 lines except the
explicitly adopted two-export assertion and a separator newline. Nineteen new groups cover original decoded values, raw
hashes/order, predecessor-own-revision, required-only projection, legacy null beside candidate/pending roles, all-role
atomic refusal, complete lineage/immutable identities, strict decoding/regular blobs, original-context consistency,
replacement-object refusal, fresh frozen copies and import purity. Expected normalized declarations are handwritten
separately from deliberately unsorted raw fixture strings; hashes derive from fixture-owned strings before subject
calls. The existing reader independently confirms the new fixture's validity.

A separate reviewer found no actionable issue. Before freeze, the author narrowed an overly restrictive import probe to
permit deterministic builtin/hash utilities while continuing to deny and latch ambient I/O attempts. This changed no
projection fixture or expected decision. Root read the complete appended expectations and that isolated correction,
verified retained evidence hashes, and froze tests plus the API amendment in commit `4feaaff` before implementation.

| Record                             | SHA-256                                                            |
| ---------------------------------- | ------------------------------------------------------------------ |
| Original reader tests              | `678ed1a584a9e684e2b0131fe0341ab0ced678a0c559a9f36c6d1c6740291f5c` |
| First-red test snapshot            | `b8daf09f52e84ca79d471e248725578c5b8f6253b02ba3f68951089dd37ab1b0` |
| Final independently reviewed tests | `43879b83bf33628a1597f1a6edd69131e4b7606a74c3a133f80b2e7885928aad` |
| Independent review                 | `088e69382952df3fdb149313625568c904f71f86f32b70401b9ae7e7f1b65a9f` |
| First-red log                      | `8a3a2bb6045457c20993e69f7cf86264e0d028181d9563f6d13843dda3ab2f88` |

Pinned Node 24.20.0 ran `node --test scripts/acceptance-profile-source.test.mjs` once before implementation: **55
groups, 37 passed, 18 failed, zero skips/cancellations/todo**. All 35 unchanged behavior groups plus new
fixture-validity and import-purity groups passed. Only the amended export assertion and 17 explicit availability guards
failed. This is missing-API evidence, not passing new semantic rejection evidence. After the isolated probe correction,
its named test passed 1/1; syntax and configured formatting passed. A second full red was not run.

## Implementation and release boundaries

The implementer owns only the existing reader. Both public exports must share one private validated read and immutable
suite cache, validate every selected role before returning, and preserve existing error distinctions and read-only
behavior. The final source review must check that structure; the tests intentionally do not prescribe a brittle exact
Git-command count. A later hosted consumer must independently authenticate original publisher context/digest before
using the unchanged selection. A self-consistent supplied run claim alone remains unauthenticated.

The first and only focused implementation run on pinned Node 24.20.0 passed all **55 groups**, with zero failures,
skips, cancellations or todo, in 267,359 ms. Syntax and explicit source formatting also passed. Source SHA-256 is
`52a7e4869c2eb064155815fe10ded03b8ca1d0b1b8b877b10059d608308da5f7`; complete focused log SHA-256 is
`d45128769206ecc3862f664624ba3765e1be474aa1744e737a506ab6fc74e81f`. A separate exact-source implementation review found
no actionable findings; its memo SHA-256 is `4161af822ee83d162ea4fee5ccaffce3548c81345eb4880529df032b9ba732b7`. Root
read the entire source diff, handoff, review and focused log, and rehashed all eight retained implementation records
plus current source and frozen tests. At reconciled source `29419a8`, pinned `npm run validate` passed all **564 tooling
tests**, **20 gate tests** and **19 Mermaid renders**, plus format, workflow lint, policy and portability. Complete log
SHA-256: `e0d18e55f4f495401a430cb93a84b9fcc31db4d784e428a6693e1cfe04b4d278`. This snapshot predates integration of the
separate HOSTED-EVIDENCE helper; its 38 tests are not included in this count. Fresh combined main-target CI, companion
approval and actual-main publication remain pending.

The helper must not select a candidate/pending suite as required, mint credentials, invoke a provider, start acceptance,
alter a binding or authorize production. Every production application deployment retains human intervention for its
exact candidate. Retained local diagnostic hashes are not signed attestations.
