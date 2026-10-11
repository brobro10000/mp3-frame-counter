/**
 * Classify a failed fixed Terraform operation without retaining its provider text or private identifiers.
 * Import stageCommandFailure(operation, exitCode, stderr): one of four fixed labels, null or an integer 0–255,
 * and a primitive stderr string of at most 65536 UTF-8 bytes. Returns a detached operation/exitCode/permission record.
 * Only an anchored standard 403, pinned update-poll 403 or update-wait code-7 denial yields run.operations.get.
 * Success and signal-only exits carry no permission. Invalid inputs throw a fixed error without echoing values.
 * Pure: no environment, subprocess, network, logging, writes, permission grant or caller mutation.
 */
const operations = new Set(["terraform-init", "terraform-plan", "terraform-show", "terraform-apply"]);
const denial =
  /^[\t ]*(?:│[\t ]*)?(?:googleapi: Error 403: |Error: Error waiting for Updating Service: error while retrieving operation: googleapi: Error 403: |Error: Error waiting for Updating Service: Error code 7, message: )Permission (['"])run\.operations\.get\1 denied on resource (['"])[^'"\r\n]+\2 \(or it may not exist\)\.[\t ]*\r?$/m;

export function stageCommandFailure(operation, exitCode, stderr) {
  if (
    typeof operation !== "string" ||
    !operations.has(operation) ||
    !(exitCode === null || (Number.isInteger(exitCode) && exitCode >= 0 && exitCode <= 255)) ||
    typeof stderr !== "string" ||
    Buffer.byteLength(stderr, "utf8") > 65_536
  )
    throw new Error("INVALID_STAGE_COMMAND_DIAGNOSTIC");
  return {
    operation,
    exitCode,
    permission: exitCode !== null && exitCode !== 0 && denial.test(stderr) ? "run.operations.get" : null,
  };
}
