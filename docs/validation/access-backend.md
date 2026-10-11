# Protected access backend validation — 2026-10-10

The [access contract amendment](../deployment/cloud-access-foundation.md#protected-gcs-backend-amendment--2026-10-10)
adds one empty GCS declaration to the existing root. The initial published access root creates the operations bucket
using private local state; actual state migration waits for its resource readback and this amendment's publication.

## Independent expectations and implementation

A separate author amended only the existing structural expectation guard, preserving its original semantic and mutation
tests. The new valid synthetic counterpart and sixteen structural refusals cover the exact direct-child, empty GCS block
and reject misplaced, duplicate or populated declarations. The original pre-implementation run had twenty groups: four
passed, sixteen failed at the absent declaration before provider initialization, with no skipped cases. Red log SHA256:
`07782c77aeca6834f78efa7fbf38304ac16c6ea1b4ecffca6f15aa2d98781a8a`.

An independent reviewer found no actionable defect. Root read the full review/diff and rehashed all eight author records
before freezing test SHA256 `4de8947fd1dba523253c929856ad89e1fe6f15afe048fcf076f2efc616a46515` in commit `9faded5`. Root
then added only the empty backend block and explanatory comments to `infra/cloud/access/versions.tf`. The other four
access files, provider pins, resource scope, IAM and deletion guards remained unchanged.

`terraform fmt -check infra/cloud/access` passed. With Node 24.20.0 and Terraform 1.13.3,
`node --test scripts/cloud-access-foundation.test.mjs` passed all twenty groups with zero skips. This includes native
mock plans and valid-plan mutation controls. Log SHA256:
`6fc55c97b9c38896671cac48930fdfc2bb33ce3ff6642885adf264b702127b03`. Independent source review found no actionable
finding; memo SHA256: `53585013a5ee9106a66d31fb96b60c22341d4acfe2d7ca8c5e8059581873172a`.

## Evidence limits

The tests explicitly initialize with `-backend=false`. These source/mock checks do not execute GCS initialization, state
migration, locking or cloud IAM propagation. Exact-head CI, companion approval, actual main publication and the private
operational migration/readback remain separate pending evidence. No application service or production candidate is
deployed by this source amendment.

## Registry-default correction after actual provider readback

The original published access root created all 23 declared resources. The first real Terraform readback failed its
no-change criterion: zero creates, one in-place update and zero destroys, solely re-adding the optional false Docker
configuration. An independent authenticated GET confirmed the registry omits `dockerConfig`. Pinned provider-source
review explained the representation mismatch; no speculative update or ignored-change exception was applied.

Root adopted a narrow omission amendment. An independent author changed only the exact Docker-list oracle and added one
native-plan control group. Its first full run had 21 groups: twelve passed, eight failed at the newly required empty
list and one exposed the author's incorrect expectation for an empty mock block. That nullable-field fixture correction
was retained separately; the named control then passed, proving an omitted valid counterpart, false/true/empty override
refusals and two ignored-change refusals. Both original failures remain preserved. Independent review found no
actionable expectation defect; final test SHA256: `7dc50f99c67bcceb99b0a279f2c1231eec497cfc6e2478468b45264cdec9c0ee`.

After freeze `56d5fae`, root removed the optional source block and added its purpose comment. All twenty-one focused
tests then passed, with no skips; log SHA256: `fd51aa56a16a36f4ebb51d68f6f4d748275bcc904c62944c37b9cf3e96f1d41d`.
Independent source review found no actionable finding; memo SHA256:
`4828d903c657bbab775539193dfc9becfc2a70d15b7e4a2ae24ca48751c1d5b3`.

The actual API/IAM inventory made 28 successful reads and passed 111 of 112 checks. New resource identities, seven
declared direct grants and five outputs matched. Its project-IAM check found the default Compute Editor grant and
additional Google service-agent roles, so the original audit remains failed pending **ACCESS-IAM-DEFAULTS**. Source
normalization does not establish a fresh no-change plan or fix inherited IAM. These operational gates still precede
remote-state migration; no application deployment is claimed.
