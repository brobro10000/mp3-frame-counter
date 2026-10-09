/**
 * Derive mandatory CI work from repository content and reject phase downgrades against a trusted base revision.
 *
 * Imported by run-ci-phase.mjs, policy.mjs and the focused policy tests. Inputs are repository-relative file paths;
 * no environment phase selector or caller-supplied "skip" flag can lower the work required by existing files.
 * This pure module performs no I/O. Malformed inputs and a removed phase boundary throw, which callers must propagate.
 */

import assert from "node:assert/strict";

export const phaseNames = ["foundation", "acceptance", "parser", "integration"];

/** Infer the highest phase whose implementation artifacts are present, rather than trusting a mutable phase label. */
export function detectPhase(files) {
  assert(Array.isArray(files) && files.every((file) => typeof file === "string"), "Expected repository file paths");
  if (
    files.some((file) =>
      /^(?:compose(?:\.[\w-]+)?\.ya?ml|docker-compose(?:\.[\w-]+)?\.ya?ml|Dockerfile(?:\..*)?|(?:frontend|public|docker)\/|(?:server\/)?src\/(?:api|server|http|index)(?:[./-]|$)|server\/Dockerfile(?:\..*)?)/.test(
        file,
      ),
    )
  )
    return "integration";
  if (files.some((file) => /^(?:src|app|server\/src)\//.test(file))) return "parser";
  if (files.some((file) => file.startsWith("tests/acceptance/"))) return "acceptance";
  return "foundation";
}

/** Reject deletion of later-phase artifacts as a way to suppress checks already mandatory on the trusted base. */
export function requireMonotonicPhase(currentFiles, baseFiles) {
  const phase = detectPhase(currentFiles);
  const basePhase = detectPhase(baseFiles);
  assert(phaseNames.indexOf(phase) >= phaseNames.indexOf(basePhase), `Cannot downgrade ${basePhase} CI to ${phase}`);
  return phase;
}

/** Require real commands only when the corresponding product phase exists; no absent-command success is allowed. */
export function requiredRootScripts(phase) {
  assert(phaseNames.includes(phase), "Unknown phase");
  return [
    ...(phaseNames.indexOf(phase) >= 2 ? ["test:unit", "build"] : []),
    ...(phase === "integration" ? ["test:e2e"] : []),
  ];
}
