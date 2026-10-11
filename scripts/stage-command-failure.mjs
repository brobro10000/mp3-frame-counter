/**
 * Classify a failed fixed Terraform operation without retaining its provider text or private identifiers.
 * Import stageCommandFailure(operation, exitCode, stderr, stdout = ""): one of four fixed labels, null or an integer
 * 0–255, and primitive stream strings of at most 65536 UTF-8 bytes each. Returns a detached closed failure record.
 * Only an anchored standard 403, pinned update-poll 403 or update-wait code-7 denial yields run.operations.get.
 * Complete typed Terraform JSON error records supply intact summary/detail separately; arbitrary messages never do.
 * Success and signal-only exits carry no permission. Invalid inputs throw a fixed error without echoing values.
 * Pure: no environment, subprocess, network, logging, writes, permission grant or caller mutation.
 */
const operations = new Set(["terraform-init", "terraform-plan", "terraform-show", "terraform-apply"]);
const denial =
  /^[\t ]*(?:│[\t ]*)?(?:googleapi: Error 403: |Error: Error waiting for Updating Service: error while retrieving operation: googleapi: Error 403: |Error: Error waiting for Updating Service: Error code 7, message: )Permission (['"])run\.operations\.get\1 denied on resource (['"])[^'"\r\n]+\2 \(or (?:it|resource) may not exist\)\.[\t ]*\r?$/m;

/** Parse the complete bounded UI packet before inspecting individual error fields; malformed packets prove nothing. */
function jsonDenial(stdout) {
  let events;
  try {
    events = stdout
      .split(/\r?\n/u)
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
    if (events.some((event) => event === null || typeof event !== "object" || Array.isArray(event))) return false;
  } catch {
    return false;
  }
  return events.some((event) => {
    if (
      !["type", "@module", "@level", "diagnostic"].every((field) => Object.hasOwn(event, field)) ||
      event.type !== "diagnostic" ||
      event["@module"] !== "terraform.ui" ||
      event["@level"] !== "error"
    )
      return false;
    const detail = event.diagnostic;
    if (
      detail === null ||
      typeof detail !== "object" ||
      Array.isArray(detail) ||
      !["severity", "summary", "detail"].every((field) => Object.hasOwn(detail, field)) ||
      detail.severity !== "error" ||
      typeof detail.summary !== "string" ||
      typeof detail.detail !== "string"
    )
      return false;
    return denial.test(detail.summary) || denial.test(`Error: ${detail.summary}`) || denial.test(detail.detail);
  });
}

export function stageCommandFailure(operation, exitCode, stderr, stdout = "") {
  if (
    typeof operation !== "string" ||
    !operations.has(operation) ||
    !(exitCode === null || (Number.isInteger(exitCode) && exitCode >= 0 && exitCode <= 255)) ||
    typeof stderr !== "string" ||
    Buffer.byteLength(stderr, "utf8") > 65_536 ||
    typeof stdout !== "string" ||
    Buffer.byteLength(stdout, "utf8") > 65_536
  )
    throw new Error("INVALID_STAGE_COMMAND_DIAGNOSTIC");
  return {
    operation,
    exitCode,
    permission:
      exitCode !== null && exitCode !== 0 && (denial.test(stderr) || jsonDenial(stdout)) ? "run.operations.get" : null,
  };
}
