/**
 * Read only the fixed hosted inventory/declaration files on explicit calls; imports are inert for discovery.
 * These exact-set predicates serve real reporting and owned negative controls. They reject malformed, incomplete,
 * duplicate or nonpassing rows with fixed diagnostics; they neither select a target nor authenticate Git provenance.
 */
import { readFileSync } from "node:fs";
import type { CaseRef, Execution, Profile } from "./hosted-types.ts";
/** Fail without echoing untrusted inventory or reporter content. */
const bad = (): never => {
  throw new Error("IDENTITY");
};
/** Test exact JSON object shape without modifying input records. */
const closed = (v: unknown, keys: string[]): v is Record<string, unknown> =>
  !!v &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  Object.getPrototypeOf(v) === Object.prototype &&
  Object.keys(v).length === keys.length &&
  keys.every((key) => Object.hasOwn(v, key));
/** Encode both identity fields unambiguously; titles remain literal data, never paths or selectors. */
const tuple = (row: CaseRef) => JSON.stringify([row.file, row.title]);
/** Validate a bounded identity set without interpreting titles or file strings as paths. */
export function requireHostedCases(value: unknown): CaseRef[] {
  if (!Array.isArray(value) || !value.length || value.length > 1000) return bad();
  const seen = new Set<string>();
  for (const row of value) {
    if (
      !closed(row, ["file", "title"]) ||
      typeof row.file !== "string" ||
      typeof row.title !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9_.-]*(?:\/[A-Za-z0-9][A-Za-z0-9_.-]*)*\.spec\.ts$/.test(row.file) ||
      !row.title.length ||
      row.title !== row.title.trim() ||
      /[\x00-\x1f\x7f]/.test(row.title)
    )
      return bad();
    const key = tuple(row as CaseRef);
    if (seen.has(key)) return bad();
    seen.add(key);
  }
  return structuredClone(value) as CaseRef[];
}
/** Load the fixed role inventory and validate its literal mapping; never consult target environment. */
export function hostedInventory(role: Profile): CaseRef[] {
  if (role !== "stage" && role !== "production") return bad();
  try {
    /** Decode one fixed package-relative metadata filename under a byte/UTF-8/BOM boundary. */
    const decode = (name: string) => {
      const raw = readFileSync(new URL(`../fixtures/${name}`, import.meta.url));
      if (raw.length > 1024 * 1024 || raw.subarray(0, 3).equals(Buffer.from([239, 187, 191]))) return bad();
      return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw));
    };
    const inventory = decode(`inventory.${role}.json`);
    const metadata = decode("profiles.json");
    if (
      !closed(inventory, ["contractRevision", "cases"]) ||
      inventory.contractRevision !== "hosted-health-v1" ||
      !closed(metadata, ["schemaVersion", "contractRevision", "profiles"]) ||
      metadata.schemaVersion !== 1 ||
      metadata.contractRevision !== "hosted-health-v1" ||
      !closed(metadata.profiles, ["local", "stage", "production"])
    )
      bad();
    const expected = requireHostedCases(inventory.cases);
    for (const profile of ["local", "stage", "production"]) {
      const mappings = (metadata.profiles as Record<string, unknown>)[profile];
      if (!Array.isArray(mappings) || !mappings.length) bad();
      const rows: CaseRef[] = [];
      for (const mapping of mappings as unknown[]) {
        if (
          !closed(mapping, ["case", "requirements"]) ||
          !Array.isArray(mapping.requirements) ||
          !mapping.requirements.length ||
          new Set(mapping.requirements).size !== mapping.requirements.length ||
          !mapping.requirements.every(
            (id) => typeof id === "string" && /^APP-(?:V1-00[1-9]|V1-01[0-6]|REL-00[1-6])$/.test(id),
          )
        )
          bad();
        rows.push((mapping as { case: CaseRef }).case);
      }
      requireHostedCases(rows);
      if (profile === role && JSON.stringify(rows.map(tuple).sort()) !== JSON.stringify(expected.map(tuple).sort()))
        bad();
    }
    return expected;
  } catch {
    return bad();
  }
}
/** Require precisely the complete role inventory, irrespective of input ordering. */
export function assertHostedInventory(role: Profile, rows: readonly CaseRef[]): void {
  const actual = requireHostedCases(rows);
  if (JSON.stringify(actual.map(tuple).sort()) !== JSON.stringify(hostedInventory(role).map(tuple).sort())) bad();
}
/** Validate unique known execution subsets; incomplete failures are retained but never promoted to passing. */
export function requireHostedExecutions(role: Profile, rows: unknown): Execution[] {
  if (!Array.isArray(rows) || rows.length > 1000) return bad();
  const known = new Set(hostedInventory(role).map(tuple));
  const seen = new Set<string>();
  for (const row of rows) {
    if (!closed(row, ["file", "title", "status", "expectedStatus", "retry", "retries"])) bad();
    const value = row as unknown as Execution;
    const key = tuple(value);
    if (
      !known.has(key) ||
      seen.has(key) ||
      !["passed", "failed", "skipped", "timedOut", "interrupted"].includes(value.status) ||
      !["passed", "failed", "skipped"].includes(value.expectedStatus) ||
      !Number.isSafeInteger(value.retry) ||
      value.retry < 0 ||
      !Number.isSafeInteger(value.retries) ||
      value.retries < 0
    )
      bad();
    seen.add(key);
  }
  return structuredClone(rows) as Execution[];
}
/** Full execution accepts no missing row, skip, retry or expected failure. */
export function assertHostedExecution(role: Profile, planned: readonly CaseRef[], rows: readonly Execution[]): void {
  assertHostedInventory(role, planned);
  const actual = requireHostedExecutions(role, rows);
  assertHostedInventory(
    role,
    actual.map(({ file, title }) => ({ file, title })),
  );
  if (actual.some((row) => row.status !== "passed" || row.expectedStatus !== "passed" || row.retry || row.retries))
    bad();
}
