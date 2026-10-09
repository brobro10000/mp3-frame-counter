# First application MVP release process

Baseline: **2026-10-09**. Source: [SRC-RELEASE-DECISION](sources/release-process-request.txt), the user's instruction to
include a continuous deployment and release cycle in the first MVP process after reviewing the foundation's limits. This
is a later user amendment, separate from the [original assessment](assessment.md).

Here, **first application MVP** means the first functional browser/API product following repository foundation. Its
completion requires the release cycle below as well as its agreed application scope. These requirements must not be
silently deferred to a subsequent MVP. Capturing them now does not authorize application implementation, a merge,
provisioning, spending, credentials changes or a deployment.

The owner later [authorized P1–P5 execution](../phases/execution-authorization.md). The repository now contains the
locally verified two-container application, mandatory application checks and a seven-day main source archive. Clean
revision `2adf71b447bfee9b78e9bdfc2b29566af894d0fe` passed the full
[local acceptance boundary](../validation/p4-integration.md). A source archive and local image IDs do not establish
registry publication or deployment. All six release outcomes below remain **incomplete**: no authorized managed
candidate, automatic deployed release, production smoke or observed recovery has been established. Local release
preparation is in progress; no successful image export or remote action is claimed by this record.

The [unified MVP contract](../mvp.md) operationalizes this amendment with independent acceptance, a managed candidate
and explicit exact-release production approval. See [the release runbook](../deployment/runbook.md).

## Required outcomes

The acceptance criteria operationalize the user's request. Provider/account/budget and managed operational choices
remain unresolved. Local implementation choices and evidence are recorded separately; they are not requirements copied
from the assessment HTML.

| ID          | Required outcome                                                                                                           | Acceptance evidence                                                                                                                                                                                                                                                                                                                   | Status                                                                                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| APP-REL-001 | Select and document a deployment target, environment and reproducible application build/run configuration.                 | Record the target, setup prerequisites, environment-variable names without values, runtime/build commands and any cost or access decisions. Deploy successfully to the authorized target from the repository workflow.                                                                                                                | Incomplete: local build/run verified; managed target, account/budget, configuration and actual workflow deployment pending.                                                    |
| APP-REL-002 | Automate the release cycle for eligible changes on protected `main`, after all required validation succeeds.               | Link workflow configuration and an actual successful run from commit through deployment. Demonstrate that failed, cancelled, skipped or missing mandatory checks prevent deployment and successful release publication. PR validation must not deploy to the release environment or receive its credentials.                          | Pending: real protected-main deployment/release workflow and successful run are not established.                                                                               |
| APP-REL-003 | Automatically determine application versions and create corresponding Git tags and repository releases with release notes. | Document the versioning policy and triggering changes. Link a generated version, tag, release, source commit and deployment. Publish a successful release only after deployment verification; failed candidates remain clearly unsuccessful.                                                                                          | Pending: local preparation work is in progress; no successful application version/tag/private release publication.                                                             |
| APP-REL-004 | Build an identifiable artifact and deploy those exact bytes, retaining enough provenance and artifacts for recovery.       | Link the version, commit, artifact checksum or immutable digest, deployment identifier and workflow run. Document retention sufficient for the current and previous known-good release. A retry must not overwrite an existing version with different content or allow an older run to replace a newer release accidentally.          | Incomplete: exact tested local image IDs recorded in [P4 evidence](../validation/p4-integration.md); publication, deployment identity and approved recovery retention pending. |
| APP-REL-005 | Verify the deployed service before declaring release success and make failures visible.                                    | Run an automated health/readiness check and a deployed `POST /file-upload` smoke test with an independently verified fixture count and the required JSON response. Record actual results, the deployed revision and where the owner sees a failed run. Keep the local assessment MP3 and secrets out of logs and published artifacts. | Pending: local acceptance passed; no managed candidate or production deployed smoke observed.                                                                                  |
| APP-REL-006 | Provide a repeatable rollback or recovery procedure and verify it before first application MVP completion.                 | Document the trigger, operator command/workflow, previous known-good artifact and post-recovery checks. Record a controlled rehearsal on an authorized environment with before/after revisions and successful checks. Define first-deployment recovery when no previous release exists.                                               | Pending: written recovery plan exists; no authorized managed recovery rehearsal observed.                                                                                      |

All rows derive from `SRC-RELEASE-DECISION`. The deployed API checks also trace to `APP-REQ-002`, `APP-REQ-003` and
`APP-REQ-006`; operating instructions support `APP-SUB-002` and `APP-SUB-003`. The supplied sample remains a separate
assessment acceptance input under `APP-ASSET-001`; CI smoke tests need a reproducible, permitted fixture.

## Required MVP process

1. **Plan:** Read the central registry and include `APP-REL-001` through `APP-REL-006` in the first application MVP's
   definition, system specification, phase plan and completion checklist. Resolve the decisions below and assign
   implementation and verification work. Keep the historical foundation contracts intact.
2. **Implement:** Add the application build, required application tests and release workflow. Extend the terminal gate
   to cover all mandatory checks. Preserve the current merge controls and isolate deployment credentials from PR jobs;
   grant release jobs only the permissions they need. Document each new script's purpose and operation.
3. **Validate before release:** Run required local checks and PR CI for the candidate revision. Verify workflow failure
   handling, version calculation, artifact identity and retry/concurrency behavior with suitable tests or controlled
   runs. Document any necessary environment setup and permissions before seeking authorization for external actions.
4. **Exercise the cycle:** Once the relevant merge and deployment actions are authorized, observe a real automated
   deployment and release, run the deployed checks and perform the controlled recovery rehearsal. Existing owner review
   override permissions do not authorize agents to merge or deploy on their own.
5. **Audit completion:** Update each row with evidence links, commands, actual results and tested/deployed revisions.
   The first application MVP is ready only when its application criteria and all six release criteria are verified. If
   execution is awaiting access or authorization, report that gap and leave the affected criteria pending; a green
   foundation CI run, workflow YAML or local source archive does not establish deployment readiness.

## Decisions to record during application planning

Resolve these alongside `APP-OPEN-004`, with rationale and affected requirement IDs:

- Hosting provider, target environment, access and cost constraints, plus build/artifact format. The unified brief now
  fixes two runtime images, one candidate environment and managed hosting. Public package publication remains
  unnecessary.
- Versioning scheme, how changes determine versions, eligible release triggers and any environment approval gate. If
  approval is required, automate the remaining steps after that gate; do not represent this as unattended deployment.
- Deployment authentication, minimum workflow permissions, environment-variable configuration and secret storage.
- Artifact/release retention, handling overlapping runs and retries, and how failed candidates are labelled.
- Health/readiness checks, smoke fixture and its independent reference count, failure visibility and recovery steps.

Record routine implementation decisions without unnecessary approval requests. Obtain authorization where an action
requires it, including paid provisioning or changes to external accounts. Do not infer a provider or production access
from the presence of an installed plugin.
