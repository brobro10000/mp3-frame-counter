/**
 * Independent per-case hosted resource ownership. Explicit fixture execution admits private input, lazily creates
 * fixed adapters and always attaches one sanitized finalization. Discovery imports create no target or resources.
 * Latches and cleanup errors fail the case; test code must never install routes or reuse the lease's context.
 */
import { test as base, type PlaywrightTestArgs, type PlaywrightWorkerArgs, type TestType } from "@playwright/test";
import { createHostedHttp, type HostedHttp } from "./hosted-http.ts";
import { loadHostedTarget, hostedFailure, hostedFailureCode } from "./hosted-target.ts";
import { openHostedBrowser, type HostedBrowserLease, type ViewportName } from "./hosted-browser.ts";
import type { FailureCode, Finalization, HostedTarget, Profile } from "./hosted-types.ts";
type PublicFixtures = {
  hostedTarget: HostedTarget;
  hostedHttp: HostedHttp;
  hostedBrowser: (viewport: ViewportName) => Promise<HostedBrowserLease>;
};
type State = { target: HostedTarget; http?: HostedHttp; leases: HostedBrowserLease[]; failures: Set<FailureCode> };
/** Compile a fixed role into one suite fixture set; the runtime input cannot choose its role or adapter mechanism. */
export function createHostedTest(role: Profile): TestType<PublicFixtures & PlaywrightTestArgs, PlaywrightWorkerArgs> {
  if (role !== "stage" && role !== "production") throw hostedFailure("INPUT");
  return base.extend<PublicFixtures & { _hostedState: State; _hostedFinalization: void }>({
    /** Re-admit the private file once per case; no case can reuse a prior case's credential handle or latches. */
    _hostedState: async ({}, use) => {
      await use({ target: await loadHostedTarget(role), leases: [], failures: new Set() });
    },
    hostedTarget: async ({ _hostedState }, use) => {
      await use(_hostedState.target);
    },
    /** Lazily create the single HTTP owner; automatic finalization retains cleanup responsibility. */
    hostedHttp: async ({ _hostedState }, use) => {
      _hostedState.http = createHostedHttp(_hostedState.target);
      await use(_hostedState.http);
    },
    /** Retain each successfully created browser lease and latch sanitized setup failures before test code sees them. */
    hostedBrowser: async ({ browser, _hostedState }, use) => {
      await use(async (viewport) => {
        try {
          const lease = await openHostedBrowser(browser, _hostedState.target, viewport);
          _hostedState.leases.push(lease);
          return lease;
        } catch (error) {
          const code = hostedFailureCode(error, "CDP");
          _hostedState.failures.add(code);
          throw hostedFailure(code);
        }
      });
    },
    /** Close all case resources, attach exactly one closed record, and fail on any transport/observer/cleanup latch. */
    _hostedFinalization: [
      async ({ _hostedState }, use, info) => {
        try {
          await use();
        } finally {
          const results: Finalization[] = [];
          for (const lease of _hostedState.leases) {
            try {
              results.push(await lease.close());
            } catch {
              results.push({ cleanup: "failed", failures: ["CLEANUP"] });
            }
          }
          if (_hostedState.http) {
            try {
              results.push(await _hostedState.http.close());
            } catch {
              results.push({ cleanup: "failed", failures: ["CLEANUP"] });
            }
          }
          for (const result of results) for (const code of result.failures) _hostedState.failures.add(code);
          if (info.status !== "passed") _hostedState.failures.add("ASSERTION");
          const cleanup = results.some((row) => row.cleanup !== "passed") ? "failed" : "passed";
          const final = { cleanup, failures: [..._hostedState.failures].sort() };
          await info.attach("hosted-finalization", {
            body: Buffer.from(JSON.stringify(final)),
            contentType: "application/json",
          });
          if (cleanup !== "passed" || final.failures.length)
            throw hostedFailure(cleanup !== "passed" ? "CLEANUP" : "ASSERTION");
        }
      },
      { auto: true },
    ],
  }) as TestType<PublicFixtures & PlaywrightTestArgs, PlaywrightWorkerArgs>;
}
