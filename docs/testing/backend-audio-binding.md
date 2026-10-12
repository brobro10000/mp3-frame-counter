# Backend audio successor binding

## Actual candidate evidence — 2026-10-12

The independently authored [backend-audio-v1 contract](contracts/backend-audio-v1.md) merged through
[PR #64](https://github.com/brobro10000/mp3-frame-counter/pull/64) as `9e2bcc99cb539564c615654b7458212dfc1022b1`. The
actual squash has one parent and its whole Git tree equals the reviewed head tree. Its parent diff contains candidate
suite/contract changes only; no application implementation is admitted by this binding.

The automated companion `brobro1000` submitted
[exact-head approval](https://github.com/brobro10000/mp3-frame-counter/pull/64#pullrequestreview-5485817569) for
`aaa2e692e777a8f4927d62662e05cf66f3351356`. This is automated review, not a human review claim. Authenticated GitHub
observations confirm the actual merge, reviewer, exact head/tree and current decisive approval.

| Identity                             | Value                                                              |
| ------------------------------------ | ------------------------------------------------------------------ |
| Predecessor                          | `hosted-health-v1`                                                 |
| Suite tree                           | `f3543e1b53342d6cb0f89d0bc289fec7e488020d`                         |
| Fixture manifest SHA-256             | `ef45e3d9183ed11798747d8fc17be0c81e3e6bc50db9cae887dd0c88d8943c51` |
| Contract SHA-256                     | `9791b60f88142d3cb637458a85d2809b923c1379fbaa4c64feff99225b0909d8` |
| Reviewed whole tree                  | `9d445975b2825f62826905528c54e1365ba863fb`                         |
| Candidate content digest (100 files) | `a4e0c48870704db9d9fd175c9ec5493063e1579a73f76cc6b5f3e7a6765f3c6e` |

## Owner-accepted checker limitation — 2026-10-12

Before approval, the owner explicitly deferred F-004 because of the submission timing constraint. The companion's prior
run `20261012T004650-a3af9404` classified this unchanged limitation at P2: the partial OpenAPI matcher ignores
`multipleOf`, so a contradictory schema can exclude supported odd flags without this checker rejecting it. The owner
accepted this risk for the bounded local MVP; it is not fixed or proved harmless. Passing checks do not establish
complete OpenAPI schema validation. The submitted review discloses the exception; earlier reports remain preserved. No
executable checker, mandatory CI requirement or branch protection is disabled. Future checker hardening is deferred
work, while actual bound product acceptance remains mandatory.

## Effect and remaining gates

The [registry](acceptance-transitions.json) appends this identity after the four existing transitions; prior entries,
genesis evidence, suite bytes and contract bytes remain unchanged. Binding alone retains hosted-health-v1 as required
product acceptance. The next product change must pass backend-audio-v1, and that applicability persists for descendants
and reverts. Candidate calibration/discovery is separate from product acceptance; the independent harness passed the
recorded semantic controls and exact 72 local / 22 stage / 3 production discovery.

This record does not establish product adoption, hosted acceptance or deployment. Final current-source CI, fresh
companion approval, normal owner merge and protected-main publication remain required for the backend refactor. Cloud
delivery remains paused, and production `v1.0.0` remains deferred. See the [transition guide](acceptance-transition.md)
and [policy amendment](backend-contract-policy.md).
