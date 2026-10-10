/**
 * Owned-control-only handle factory. Uses a public synthetic token and numeric loopback origins; never imported by
 * real wrappers, fixtures or specifications. It cannot validate provider identity or grant deployment authority.
 */
import { issueOwnedControlTarget } from "./hosted-target.ts";
import type { HostedTarget, Profile } from "./hosted-types.ts";
export const CONTROL_TOKEN = "owned.control.synthetic";
/** Mint a fresh synthetic handle for an already-owned loopback listener; production stdin has no path to this seam. */
export function createOwnedControlTarget(origin: string, role: Profile = "stage"): HostedTarget {
  return issueOwnedControlTarget({
    schemaVersion: 1,
    kind: "hosted-suite-input",
    profile: role,
    launchId: "a".repeat(64),
    sourceRevision: "b".repeat(40),
    suite: {
      commit: "c".repeat(40),
      tree: "d".repeat(40),
      fixtureManifestSha256: "e".repeat(64),
      profilesSha256: "f".repeat(64),
      inventorySha256: "1".repeat(64),
    },
    target: {
      environment: role,
      origin,
      resourceId: "owned/control",
      revisionId: "owned-revision",
      observedAt: new Date().toISOString(),
      configurationSha256: "2".repeat(64),
      registryDigests: { api: `sha256:${"3".repeat(64)}`, frontend: `sha256:${"4".repeat(64)}` },
    },
    audience: origin,
    credential: {
      kind: "google-id-token",
      value: CONTROL_TOKEN,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    },
  });
}
