/**
 * Closed hosted handoff types shared by the independent adapters, wrappers, reporters and owned controls.
 * Types alone confer no source, provider or deployment authority. Importing this module has no runtime effects.
 */
import type { ResponseData } from "./assertions.ts";
export type Profile = "stage" | "production";
export type CaseRef = { file: string; title: string };
export type SuiteIdentity = {
  commit: string;
  tree: string;
  fixtureManifestSha256: string;
  profilesSha256: string;
  inventorySha256: string;
};
export type Observation = {
  environment: Profile;
  origin: string;
  resourceId: string;
  revisionId: string;
  observedAt: string;
  configurationSha256: string;
  registryDigests: { api: string; frontend: string };
};
export type HostedSuiteInputV1 = {
  schemaVersion: 1;
  kind: "hosted-suite-input";
  profile: Profile;
  launchId: string;
  sourceRevision: string;
  suite: SuiteIdentity;
  target: Observation;
  audience: string;
  credential: { kind: "google-id-token"; value: string; expiresAt: string };
};
export type PublicInput = Readonly<Omit<HostedSuiteInputV1, "credential">>;
declare const issuedTarget: unique symbol;
export type HostedTarget = Readonly<{ [issuedTarget]: true; publicInput: PublicInput }>;
export type FailureCode =
  | "INPUT"
  | "IDENTITY"
  | "ENVIRONMENT"
  | "HTTP"
  | "TLS"
  | "RESPONSE_BOUND"
  | "FOREIGN_ATTEMPT"
  | "REDIRECT"
  | "UNOWNED_PAGE"
  | "WORKER"
  | "WEBSOCKET"
  | "CDP"
  | "PAUSED_TIMEOUT"
  | "OBSERVER"
  | "ASSERTION"
  | "OVERFLOW"
  | "CLEANUP";
export type Finalization = Readonly<{ cleanup: "passed" | "failed"; failures: readonly FailureCode[] }>;
export type Execution = CaseRef & {
  status: "passed" | "failed" | "skipped" | "timedOut" | "interrupted";
  expectedStatus: "passed" | "failed" | "skipped";
  retry: number;
  retries: number;
};
export type HostedSuiteResultV1 = {
  schemaVersion: 1;
  kind: "hosted-suite-result";
  profile: Profile;
  launchId: string;
  sourceRevision: string;
  suite: SuiteIdentity;
  inventory: CaseRef[];
  tests: Execution[];
  status: "passed" | "failed" | "blocked";
  cleanup: "passed" | "failed" | "not-run";
};
export type HostedRows = {
  schemaVersion: 1;
  kind: "hosted-suite-rows";
  profile: Profile;
  launchId: string;
  sourceRevision: string;
  suite: SuiteIdentity;
  inventory: CaseRef[];
  tests: Execution[];
  status: "passed" | "failed";
  finalizations: { case: CaseRef; cleanup: "passed" | "failed"; failures: FailureCode[] }[];
};
export type HostedDiscovery = {
  schemaVersion: 1;
  kind: "hosted-suite-discovery";
  contractRevision: "hosted-reasonless-v1";
  profile: Profile;
  status: "passed" | "failed";
  inventory: CaseRef[];
  tests: [];
};
export type RawHeader = { name: string; value: string };
export type DocsResponse = { status: number; headers: RawHeader[]; body: Buffer };
export type HostedResponse = ResponseData & {
  sentBytes: number;
  contentLengthSent: boolean;
  transferEncoding?: string;
};
export type ControlRow = {
  id: string;
  status: "passed" | "failed";
  cleanup: "passed" | "failed";
  codes: FailureCode[];
};
