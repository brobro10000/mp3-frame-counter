/**
 * Construct sanitized report data independently of writing it. Preserve valid target/suite attribution on failed runs;
 * invalid raw environment values never enter evidence. Shared by the Playwright reporter and falsification controls.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { assertExecution, assertInventory, CONTRACT, type Execution } from "./inventory.ts";
import { suiteRevision, target } from "./target.ts";

export function buildReport(
  overallStatus: string,
  discovery: boolean,
  planned: { file: string; title: string }[],
  results: Execution[],
) {
  let status: "passed" | "failed" = "failed";
  let binding: ReturnType<typeof target> | undefined;
  let revision = "unrecorded";
  let identityValid = discovery;
  // Attribute valid failures before evaluating the outcome. Neither invalid URLs nor secret values are projected.
  if (!discovery) {
    try {
      binding = target();
    } catch {
      /* Invalid binding remains unknown. */
    }
    try {
      revision = suiteRevision();
      identityValid = binding !== undefined;
    } catch {
      /* Invalid suite identity remains unrecorded and cannot pass. */
    }
  }
  const manifest = readFileSync(new URL("../fixtures/manifest.json", import.meta.url));
  try {
    if (overallStatus !== "passed" || !identityValid) throw new Error("Execution or binding did not pass");
    assertInventory(planned);
    if (JSON.parse(manifest.toString("utf8")).contractRevision !== CONTRACT)
      throw new Error("Fixture contract mismatch");
    if (discovery) {
      if (results.length !== 0) throw new Error("Discovery unexpectedly executed tests");
    } else assertExecution(planned, results);
    status = "passed";
  } catch {
    /* A rejected inventory, execution or binding is retained as failed evidence. */
  }
  return {
    contractRevision: CONTRACT,
    evidenceKind: discovery ? "candidate-discovery" : "application-execution",
    status,
    planned: planned.length,
    passed: results.filter((entry) => entry.status === "passed").length,
    failed: results.filter((entry) => !["passed", "skipped"].includes(entry.status)).length,
    skipped: results.filter((entry) => entry.status === "skipped").length,
    targetKind: binding?.kind ?? "unknown",
    targetId: binding?.id ?? "unknown",
    targetOrigin: binding?.base ?? "unknown",
    suiteRevision: revision,
    manifestSha256: createHash("sha256").update(manifest).digest("hex"),
    inventory: planned,
    tests: results,
  };
}
