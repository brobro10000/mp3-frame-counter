# V1 closure: verified repository release

Observed **2026-10-10, America/New_York**. The first functional V1 milestone satisfies its active release-only scope:
the application is merged, protected-main acceptance passed, the exact tested images were published, and an identical
publisher retry preserved the release. This closure PR records those observations; its own review and merge are
separate. **Nothing is deployed.** Hosting remains deferred under
[SRC-RELEASE-ONLY](../requirements/release-process.md).

V1 names the functional milestone, not a required semantic version. The first published version is **`v0.1.6`**,
following the existing first-parent ordinal policy. Later releases do not change this dated closure baseline.

## Exact completion evidence

| Boundary          | Observed identity or result                                                                                                                                                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product review    | [PR #5 approval](https://github.com/brobro10000/mp3-frame-counter/pull/5#pullrequestreview-5477487545), automated companion `brobro1000`, reviewed head `8f41b9f4c93dbcdd00afc637f6a7be2daf59442b`; no blocking findings across 95 changed files.                                      |
| Product merge     | [PR #5](https://github.com/brobro10000/mp3-frame-counter/pull/5), squash source `ce50762b404e6b37ee10171fabd98db9aa06b265`, October 10 at 00:08:51 EDT.                                                                                                                                |
| Main validation   | [Run 38023037504, attempt 1](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38023037504/attempts/1): foundation, product and `control-plane` succeeded at that exact main source.                                                                                       |
| Test results      | 75 parser/API unit tests, 60/60 external browser/HTTP cases, 20 gate tests, 62 tooling tests and 16/16 Mermaid renders; no failing or skipped acceptance cases, clean source and successful scoped cleanup.                                                                            |
| First publication | [Release v0.1.6](https://github.com/brobro10000/mp3-frame-counter/releases/tag/v0.1.6), ID `408630914`, published October 10 at 00:11:49 EDT; non-draft, ten uploaded assets, tag resolves to the tested main source.                                                                  |
| Identical retry   | [Publisher job 114128858347, attempt 2](https://github.com/brobro10000/mp3-frame-counter/actions/runs/38023037504/job/114128858347) succeeded at 00:14:34 EDT using attempt 1's original bundle. Release identity and every asset ID, creation time, size and digest stayed unchanged. |

The [portable evidence record](artifacts/v1-release-closure.json) retains complete commit, image, archive,
configuration, baseline, job and asset identities. The independent baseline remains commit
`a0a56d94e5457101cd043b6055ab084782c3e16f`, suite tree `b789ffe426f4d0a303144338923748c9cdf424cf` and fixture manifest
SHA-256 `2f56db4641f9e5c09b34c2bc0c630e85a46a010025c634375b110a35e2cb120a`.

## Phase and release requirement closure

| Phase / requirements                                         | Completion evidence                                                                                                                                                                                                           |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1; APP-V1-011                                               | Foundation adaptation and controls merged in PR #3 at `60e51fb`; [phase history](execution-status.md).                                                                                                                        |
| P2; APP-V1-009,010,013                                       | Independently authored/reviewed r3 acceptance and sample oracle preceded product code; PR #4 merged the unchanged test-only baseline at `a0a56d9`.                                                                            |
| P3; APP-REQ-001,003–005; APP-V1-004,005                      | Native TypeScript physical-frame parser, 56 parser unit cases, independent fixtures and [sample reconciliation](sample-baseline.md).                                                                                          |
| P4; APP-REQ-002,006; APP-V1-001–003,006–008,016; APP-REL-001 | Native HTTP API, static browser UI, separate non-root images, documented Make interface and all 60 external cases passed locally and again on exact protected main.                                                           |
| P5; APP-V1-012, release portion of 015; APP-REL-002,003      | Automatic protected-main publication produced the matching version, tag, notes and private repository release, explicitly not deployed.                                                                                       |
| APP-REL-004,005                                              | Exact accepted API/frontend archives and source/suite/configuration provenance are retained as verified release assets; publication did not rebuild images.                                                                   |
| APP-REL-006                                                  | Draft-before-complete behavior was observed; publisher-only retry reused the published release and all assets. Deterministic tests cover interruption/conflict refusal and the documented correction path uses a new version. |

Assessment evaluation criteria are supported by the [requirements registry](../requirements/assessment.md), source
review and recorded observations; they are not an evaluator's score or a promise of universal MP3 compatibility. The
private sample's **6,090 physical frames** include a complete Xing-bearing frame; MediaInfo's **6,089** counts audio
frames. Its ignored bytes are not needed by ordinary CI.

## Verification method and limits

Read-only GitHub CLI/API checks inspected PR #5, both workflow attempts, the exact tag, release and immutable handoff
artifact. Eight small metadata assets were downloaded and independently SHA-256 checked. The two image archives'
GitHub-reported sizes/digests matched `SHA256SUMS`, the preparation manifest and `publication.json`; their large bytes
were not downloaded or independently rehashed locally during closure. Main CI's acceptance report binds the image IDs to
the published archive records. These checks are integrity evidence, not signed attestations.

The actual retry used `gh run rerun 38023037504 --job 114128350183 --repo brobro10000/mp3-frame-counter` after first
publication succeeded. GitHub's
[job-rerun API](https://docs.github.com/en/rest/actions/workflow-runs#re-run-a-job-from-a-workflow-run) repeats that job
and dependent jobs; this publisher has no dependent jobs. The three validation jobs retained their original execution
times. The same-run artifact ID `11659000497` and producing attempt 1 remained unchanged. No tag, asset or source was
replaced, and no live upload failure or conflicting content was injected. Those failure paths remain covered by
deterministic tests, not a claimed remote fault rehearsal.

The original local `manifest.json` intentionally retains `prepared-local`, provisional-version and missing-hosted-gate
fields. Repository publication is established by separate `publication.json`, verified GitHub state and this evidence;
do not rewrite the original preparation record to pretend it was deployed. Historical reports and generated orchestrator
contracts remain intact. No completed plugin phase result is claimed.

## Carryover into a separately scoped iteration

- **Hosting:** APP-V1-014, hosted APP-V1-015 and deferred APP-REL portions still require provider fit, account/budget,
  registry identity, managed ingress acceptance, exact production approval, smoke and recovery. A release grants no
  deployment authority.
- **Parser and resources:** retain the r3 supported-format/tag limitations, 20 MiB actual-byte cap, whole-buffer
  synchronous parser and measured local admission/resource budgets. New formats or throughput goals require an explicit
  contract and independent acceptance update; no decoding, CRC or corruption-recovery promise is added.
- **Operational maintenance:** the optional `verify:github` helper's application-main delivery assertion remains a
  [documented limitation](../repository-controls.md#application-release-audit-limitation). The publisher's single
  pending slot and seven-day original-bundle retry window remain [documented](../deployment/release-only.md).
- **Assessment handoff:** APP-SUB-001 has the repository and release ready; external submission is unobserved. The
  receipt date/deadline, APP-OPEN-006 and APP-TIME-001, remain unknown. No deadline or submission is invented.

Review and merge this closure PR before starting the next iteration. Define that iteration separately against the stable
APP IDs, preserving frozen acceptance ownership, mandatory checks, portable setup and dated evidence. The companion
reviewer is [separately documented](https://github.com/brobro10000/companion-reviewer); automated approval is not human
review. No new feature, infrastructure, baseline amendment, merge override or deployment is authorized by this record.
