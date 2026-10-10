/**
 * Candidate-control report predicate, shared by the child-result consumer and real mutation controls. Inputs are an
 * untrusted parsed report and the caller's fresh run/source identity plus exact planned IDs. Pure, no I/O or mutation;
 * rejects partial, stale, duplicate, skipped/retried or failed evidence. Never constructs application acceptance.
 */
import assert from "node:assert/strict";
/**
 * Require a fresh, complete candidate-control report with passed single attempts and confirmed cleanup.
 * @param report - Parsed untrusted report; extra evidence fields are preserved but are not certified by this predicate.
 * @param runId - Fresh identity selected by the caller before launching the child.
 * @param sourceDigest - Digest computed from the caller's exact source inputs, never taken on trust from the report.
 * @param planned - Nonempty unique IDs in required execution order; both reported plan and outcomes must match exactly.
 * @returns Nothing on success; throws CONTROL assertions for stale/missing/duplicate/skipped/retried/failed evidence.
 * Pure and nonmutating; this checks candidate accounting, never application acceptance or actual resource state.
 */
export function assertControlReport(report, runId, sourceDigest, planned) {
  assert.ok(report && typeof report === "object", "CONTROL_REPORT_OBJECT");
  assert.equal(report.kind, "candidate-docs-controls", "CONTROL_KIND");
  assert.equal(report.productAcceptance, false, "CONTROL_KIND");
  assert.equal(report.runId, runId, "CONTROL_RUN_ID");
  assert.equal(report.sourceDigest, sourceDigest, "CONTROL_SOURCE");
  assert.equal(report.status, "passed", "CONTROL_STATUS");
  assert.equal(report.cleanup, "confirmed", "CONTROL_CLEANUP");
  assert.ok(planned.length > 0 && new Set(planned).size === planned.length, "CONTROL_PLAN");
  assert.deepEqual(report.planned, planned, "CONTROL_PLAN");
  assert.ok(Array.isArray(report.cases), "CONTROL_CASES");
  assert.deepEqual(
    report.cases.map((c) => c.id),
    planned,
    "CONTROL_INVENTORY",
  );
  for (const entry of report.cases) {
    assert.equal(entry.status, "passed", "CONTROL_OUTCOME");
    assert.equal(entry.attempts, 1, "CONTROL_ATTEMPTS");
    assert.equal(entry.skipped, false, "CONTROL_SKIPPED");
  }
}
