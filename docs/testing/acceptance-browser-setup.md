# Browser preparation before acceptance controls

**DOCS-HARNESS contract — 2026-10-10:** independently specified before implementation, against trusted main
`f4fb747df8890511edde7878064bb9af79823138` and verified v0.2.19. This contract describes required behavior; completion
requires the
[phase card](../phases/next-iteration.md#pr-card-1--docs-harness-prepare-the-pinned-browser-before-standalone-acceptance-checks)
and actual validation evidence. It establishes browser availability, not docs rendering, CSP or product acceptance.

## Authority and ordering

Only the existing parser/integration path prepares browsers, after `runtimeAcceptance` validates original context and
selects exact Git objects. Preserve extraction, historical pre-product phases and the complete root command sequence.
For candidate/pending and required selections, run locked `npm ci`, preparation and the existing complete `check`, in
that order. Candidate controls remain separate from required acceptance; an activated suite retains preparation.

The helper exports asynchronous `prepareAcceptanceBrowser({ suiteRoot, ci, environment, deadline, signal }, adapters?)`.
`suiteRoot` is the absolute selected extraction, `ci` is the validated boolean, `deadline` is a shared absolute
monotonic deadline, and `signal` is an optional AbortSignal. Only tests may inject `run`, `platform` and `now`;
production fixes Node, platform and clock. There are no CLI/environment browser, executable, version, target, cache or
skip selectors.

Validate ordinary contained package, lock and installed metadata for the exact
`@playwright/test → playwright → playwright-core` chain, fixed CLI/module files and Chromium/headless-shell metadata.
Reject absent, inconsistent or escaping files before commands. Derive versions/revisions from selected metadata; current
observations of Playwright 1.64.0, revision 1248 and browser 156.0.8078.4 are not future hardcoded selectors. `npm ci`
checks tarball integrity; version comparison is not a second cryptographic installation attestation.

## Commands and environment

Use `process.execPath` and the absolute extraction-local `@playwright/test/cli.js`. Validated Linux CI runs
`install-deps chromium`, then `install chromium`. Local Linux and macOS run only the latter; other platforms fail. Local
execution never invokes apt/sudo. Probe the package-local Playwright module with fixed trusted code, normal launch
defaults and only `about:blank`. Observe the actual browser version and complete page/context/browser close before
success. No product URL or intentional remote navigation belongs to readiness.

Child keys are limited to PATH, HOME, TMPDIR, LANG, LC_ALL, XDG_RUNTIME_DIR and CI. Construct PATH from the pinned Node
directory plus `/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`; do not inherit arbitrary PATH entries.
Copy only usable allowed runtime values without mutating the parent; set CI from the validated boolean. Exclude
credentials, admission, NODE_OPTIONS/NODE_PATH, npm configuration, PLAYWRIGHT overrides, proxies and test controls. Do
not add XDG_CACHE_HOME: the unchanged later E2E setup uses the normal cache location.

## Deadlines and cleanup

One 360-second window starts before the first preparation and elapses through intervening checks/installs; never reset
it for another suite. Per-command ceilings are 120 seconds for dependencies, 180 for acquisition and 20 for readiness.
Allow at most ten additional seconds for first-failure owned-process cleanup. Failure stops later checks/root commands;
finally remove extracted suites after command cleanup. Keep the workflow's existing 30-minute bound.

The probe has a ten-second launch ceiling and a 15-second normal-exit deadline, leaving five seconds under its parent.
Reduce these with remaining time or fail before launch. Playwright creates a detached Chromium group; killing only the
Node group cannot confirm browser removal. Normal process exit permits its exit hooks to attempt cleanup, but the hooks
alone are not proof. Completed public close is the successful cleanup boundary. Forced termination, absent completed
close or uncertain cleanup fails with `cleanup: unverified`; never manufacture a readiness pass. Use no private browser
APIs, unrelated PID kills or broad process scans. Signal listeners apply only during active asynchronous preparation.

## Evidence interface

Successful probe output is one closed JSON object of at most 1 KiB: `schemaVersion: 1`,
`kind: acceptance-browser-readiness`, observed `browserVersion`, `closed: true`, `status: passed`. Require successful
exit and exact matching metadata; reject malformed/extra output, missing close, signals, timeout and abort.

The helper result contains only `schemaVersion: 1`, `kind: acceptance-browser-setup`, `productAcceptance: false`,
`status`, `platform`, `ci`, `metadata`, `steps`, `cleanup` and `failure`. Metadata contains only `playwrightVersion`,
`chromiumRevision`, `headlessShellRevision` and `browserVersion`. Each step has a fixed name, status and finite
nonnegative `durationMs`. Cleanup is `not-started`, `confirmed` or `unverified`; failure is null or `{ stage, code }`.

Stages are `input`, `metadata`, `install-deps`, `install`, `probe`. Codes are `metadata`, `platform`, `authority`,
`deadline`, `command`, `timeout`, `abort`, `output`, `readiness`, `cleanup`. Invalid platform/CI inputs report null for
that field. Argument/metadata failure starts no subprocess and retains null metadata with `cleanup: not-started`. Throw
a fixed sanitized Error carrying failed `setupResult`; include no raw environment, private paths or child output.

The caller writes `.artifacts/acceptance-browser-setup.json` with `schemaVersion: 1`,
`kind: acceptance-browser-preparation`, `productAcceptance: false`, exact `sourceRevision` and `entries`. Each attempted
entry carries `role: candidate|pending|required`, actual `suiteCommit`, `suiteTree`, `manifestSha256` and helper
`result`. Persist failure before propagating it; never invent an attempt for an earlier npm failure. Print a bounded
sanitized summary for CI logs. This adds no release-asset schema or workflow change.

## Independent verification and limits

Tests use injected commands or inert synthetic installed packages, never real apt, browser downloads, cache mutation or
product predicates. Real phase-runner histories exercise candidate, pending and activated selections, ordering, failure
attribution and extraction cleanup. Preserve existing provenance controls. The consumer fixture's NODE_OPTIONS network
blocker deliberately does not enter sanitized children; their generated programs must themselves remain inert.

An inert detached-child control observes its exact owned process and cleans it in test finally. It must expose the false
assumption that terminating a Node group necessarily terminates Chromium. Fresh Ubuntu CI must separately prove the
actual package-local browser installs, launches and closes before standalone checks. A warm local cache, synthetic pass
or Mermaid browser is not that evidence. The unchanged 67-case transport suite remains the required product gate.
