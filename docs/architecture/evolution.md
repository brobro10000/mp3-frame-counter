# Evolution through explicit triggers

Status: provisional future options supporting APP-V1-016; no implementation is pending for this submission. V1
implements only the stateless two-image application. Preserve small boundaries now; do not create speculative
interfaces, provider SDK layers or infrastructure for future features.

| V1 choice                          | Boundary preserved now                                                    | Trigger for change                                                          | Possible later step                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Stateless Node API                 | HTTP contract, configurable port, health/shutdown, no local durable state | Measured concurrency, memory or latency exceeds the agreed operating budget | Tune resource limits first, then replicas; evaluate workers/streaming from evidence.        |
| Bounded whole-file parser          | Pure parser independent of transport/hosting                              | Approved larger-file need or measured memory pressure                       | Approved incremental parser; async jobs require a new/versioned contract.                   |
| React static bundle and one origin | Separate image and environment-selected upstream                          | Real UI complexity or additional routes                                     | Evolve frontend/routing independently with endpoint compatibility coverage.                 |
| No database/authentication         | No provider imports in parser; explicit trust/data boundaries             | Approved history, persistence or multi-user requirement                     | Evaluate Supabase or another managed data/auth service with policies, migrations and tests. |
| No storage/queues                  | Explicit upload lifecycle and no-retention promise                        | Approved durable or long-running processing                                 | Revise retention/access/deletion contract before storage/workers.                           |
| Compatible image pair              | Separate image identities and compact release manifest                    | Different release cadences cause measured friction                          | Separate releases after compatibility tests and rollout ordering.                           |
| Deferred candidate environment     | Runtime configuration outside images; external BASE_URL tests             | Concurrent work actually needs isolation                                    | Limited ephemeral previews with teardown, TTL and spend controls.                           |
| Deferred managed host              | OCI images, ordinary HTTP and explicit nonsecret configuration            | Cost, region, compliance or operating needs change                          | Migrate artifacts and rerun the same external suite; replace deployment configuration.      |

Future persistence adds migration, backup and restore duties. Prefer additive backward-compatible changes, explicitly
approve irreversible changes and rehearse recovery. Rolling back application images is not a data rollback. This policy
authorizes no schema, database, storage resource or migration today.

Supabase is a plausible later data/auth boundary, not a necessary V1 component or selected future vendor. No unrelated
connected project will be repurposed. Retain standard artifact and HTTP contracts rather than implementing a generic
multi-provider platform.
