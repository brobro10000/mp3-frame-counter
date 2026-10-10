# Roadmap execution authorization — 2026-10-10

This is a normalized record of the owner's subsequent instruction to continue the
[versioned roadmap](../roadmap/README.md). It supersedes the earlier documentation-only stop point and resumes hosted
delivery work deferred by the [release-only amendment](../requirements/release-process.md). Historical evidence and
original requirement captures remain unchanged.

## Authorized operations

- Execute bounded cards in dependency order, starting with PLAN-01 publication, GATE-01 and VER-01. Expand later work
  only when prerequisites exist; preserve independent expectations before implementation and immutable r3 genesis.
- Create scoped commits and PRs. Invoke the Docker companion as `brobro1000`, publish qualifying automated reviews, fix
  supported findings and repeat review for each new head without asking for routine consent.
- Merge as owner `brobro10000` only after a clean, current companion approval, successful required checks and resolved
  conversations. Do not bypass protections or treat a local review report as a published approval.
- Run required shell commands and create scoped deployment credentials and dedicated Cloud Run stage/production
  resources. Prefer short-lived federation and existing owner-authorized account access; keep secrets and personal
  machine/account details out of tracked files and review output.
- The owner subsequently authorized activating cloud billing and requested infrastructure as code for cloud services,
  with reproducible setup and teardown. Use a narrowly scoped declarative configuration for dedicated resources,
  reviewed plans, protected state and explicit teardown safeguards; do not reuse unrelated projects.
- Implement automatic deployment of verified software releases to stage, including hosted acceptance and recovery
  evidence. Software artifact publication remains a distinct operation from deployment.

The roadmap's source-bound version policy and successor design are authorized directions, not evidence that either is
implemented or independently reviewed. The required gate-design review and fixture expectations still precede GATE-01
implementation. Provider eligibility, available billing access, region and measured resource fit remain execution
prerequisites. Target allowance-covered operation; no unlimited spending commitment is inferred from permission to set
up Cloud Run. Escalate a concrete unavailable account, billing consent or unavoidable paid resource decision.

## Monthly cost boundary

The owner subsequently set a **USD 100 per calendar month** application budget. First create a dedicated project and
link billing; then codify and verify a **USD 75 Cloud Run spend cap**, shared by stage and production, and a **USD 100
all-service project budget** with current-spend and forecast alerts. Complete those controls before provisioning
billable application resources. Reserve USD 25 for registry, logs, state storage and enforcement delay. Do not create a
separate USD 75 cap for each environment.

Cloud Run's service cap pauses new usage, but reporting delay, in-flight usage and ancillary services can still cause
overages. The all-service budget is an alert, not an enforced invoice ceiling. These controls do not guarantee a total
bill at or below USD 100 and do not govern unrelated projects or non-Google subscriptions. See
[Google's spend-cap limits](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps).

Manage supported resources with pinned IaC. If its provider lacks spend-cap support, use a separately owned declarative
Budget API reconciler and retain the exact resource identity. Read back scope, amount and enforcement readiness before
deployment. An unavailable, missing, lifted or unreconciled cap blocks deployment; never substitute alerts silently,
raise the limit or lift enforcement to complete a release. Keep cost-control permissions out of deployment identities.
These controls are required future setup, not a claim that a project or budget has already been created.

## Production remains a human gate

The owner explicitly requires human intervention for production deployment. Provisioning a protected production service
or configuring its approval workflow does not authorize deployment of an application candidate, traffic promotion or
public exposure there. Stage success must produce a reviewable candidate identifying source, both image digests,
configuration, acceptance and recovery evidence. A human must then approve that exact candidate through the production
gate before deployment or promotion.

Use an enforceable environment approval where the repository plan supports it; otherwise use an owner-invoked,
source-bound production operation and disclose that limitation. Do not have the companion or coordinator satisfy this
human gate. Account challenges, terms and billing consent also remain human assistance points when needed.

Continue all unblocked implementation and stage work while these gates are pending. Reserve `v1.0.0` for observed
production identity and passing smoke after human-approved deployment. Do not declare it achieved merely because code,
stage or release automation is ready.

## Evidence and handoff

Record each PR, reviewed head, companion run, merge SHA, CI attempt, published version and deployment result as they
occur. Preserve failed reviews and tests. The PLAN-01 verification section remains a dated record of documentation
authoring; it is not a restriction on the operations authorized here or proof that later checks passed.
