/**
 * Candidate-control report predicate, shared by the child-result consumer and real mutation controls. Inputs are an
 * untrusted parsed report and the caller's fresh run/source identity plus exact planned IDs. Pure, no I/O or mutation;
 * rejects partial, stale, duplicate, skipped/retried or failed evidence. Never constructs application acceptance.
 */
import assert from "node:assert/strict";
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
