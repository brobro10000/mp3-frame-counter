# Hosted health successor binding

This binding records the actual test-only protected-main squash of
[PR #43](https://github.com/brobro10000/mp3-frame-counter/pull/43), merged on 2026-10-11 UTC as
`09cbb2fc1ce2957b5cfc00439f81ff42e142ecbd`. Its complete tree equals the independently reviewed head
`42945dc06d10ba52cf6fec4639c5e9e4297f266e`; its parent diff contains only the new contract and acceptance files. The
[companion's automated approval](https://github.com/brobro10000/mp3-frame-counter/pull/43#pullrequestreview-5482006400)
names that exact head. The immutable identities are recorded in [the transition registry](acceptance-transitions.json).

The [hosted-health-v1 contract](contracts/hosted-health-v1.md) preserves all 72 local, 22 stage and three production
cases and their requirement mappings. Only the public hosted health request moves from `/healthz` to `/health`; its
status and exact JSON assertions remain unchanged. Historical hosted-v1 source and evidence stay readable.

This binding reserves the next product change for the successor. It does not activate product behavior or establish a
hosted pass: binding-only publication retains the prior required contract. The implementation must preserve internal
`/healthz`, add the public ingress alias, and pass the applicable independent suite on its exact images. Descendants
remain subject to the successor after activation. See [transition rules](acceptance-transition.md).

PR #42 published v0.3.42 and its real automatic stage job executed, but failed before the hosted launcher started. That
retained failed delivery is not a stage acceptance pass and is distinct from this independently identified health path
correction. No production deployment, exposure, finalization or human approval is established by this binding.
