/**
 * Make the terminal control-plane check succeed only when every mandatory validation job has succeeded.
 *
 * CI runs `node scripts/ci-gate.mjs` with NEEDS_JSON containing GitHub Actions' serialized `needs` object.
 * Missing, extra, malformed or unsuccessful results produce a nonzero exit so skipped jobs cannot allow a merge.
 * Importing this module exposes the dependency list and validation function without running the command-line gate.
 */

// Keep this list aligned with the workflow's gate dependencies; policy.mjs checks that relationship.
export const mandatoryJobs = ["validate-foundation", "validate-product"];

/**
 * Require an exact dependency set and an explicit "success" result for each job.
 * @param {unknown} needs Parsed GitHub Actions dependency results.
 * @throws {Error} When the input is incomplete, unexpected or contains any result other than success.
 */
export function requireSuccess(needs) {
  if (!needs || typeof needs !== "object" || Array.isArray(needs)) throw new Error("Missing dependency results");
  const names = Object.keys(needs).sort();
  if (JSON.stringify(names) !== JSON.stringify([...mandatoryJobs].sort())) {
    throw new Error("Missing or unexpected mandatory dependency");
  }
  for (const name of mandatoryJobs) {
    if (needs[name]?.result !== "success") throw new Error(`${name} did not succeed`);
  }
}

if (import.meta.main) {
  // Reject absent or invalid environment data through the same nonzero exit as an unsuccessful dependency.
  try {
    requireSuccess(JSON.parse(process.env.NEEDS_JSON ?? "null"));
    console.log("Every mandatory validation succeeded.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
