/**
 * Export the exact images from successful main-push acceptance for a later release-only publication job.
 * CI runs `node scripts/publish-release-bundle.mjs` after run-ci-phase.mjs, with ordinary GitHub context and
 * CI_BASE_REF. Foundation/acceptance-only commits emit ready=false and require no application bundle. Integrated
 * commits require clean exact source and a protected-main baseline, then call existing preparation (Docker inspect/save,
 * never rebuild). Writes only ignored prepared artifacts plus immutable producing-attempt/report metadata and
 * GITHUB_OUTPUT ready/version/directory/artifact-name. No token, tag, release, provider or deployment mutation occurs.
 * Missing evidence, changed source/baseline, failed export or a conflicting retry exits nonzero.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { repositoryFiles } from "./acceptance-baseline.mjs";
import { detectPhase } from "./phase-policy.mjs";
import { publicationContext, verifyReleaseBundle, verifyReleaseSource } from "./publish-release-evidence.mjs";
import { requireArtifactPath, versionForOrdinal } from "./release-manifest.mjs";

try {
  assert.equal(process.argv.length, 2, "Release bundle accepts no overrides");
  const context = publicationContext(process.env);
  assert(process.env.GITHUB_OUTPUT, "Missing GitHub output channel");
  const root = process.cwd();
  const phase = detectPhase(repositoryFiles(root, context.sourceRevision));
  if (["foundation", "acceptance"].includes(phase)) {
    appendFileSync(process.env.GITHUB_OUTPUT, "ready=false\n");
    console.log("Source-only phase: no application release bundle.");
  } else {
    assert.equal(phase, "integration", "Application release requires both independently tested images");
    const report = readFileSync(requireArtifactPath(root, ".artifacts/e2e-result.json"));
    const { ordinal } = verifyReleaseSource(root, context, {
      admission: JSON.parse(report).acceptanceAdmission,
      expectedAdmissionSha256: process.env.GATE_ADMISSION_SHA256,
    });
    const version = versionForOrdinal(ordinal);
    execFileSync(process.execPath, ["scripts/prepare-release.mjs"], { stdio: "inherit", timeout: 420000 });
    const relativeDirectory = `.artifacts/releases/${version}`;
    const directory = requireArtifactPath(root, relativeDirectory);
    for (const [name, bytes] of [
      ["ci-origin.json", Buffer.from(`${JSON.stringify(context, null, 2)}\n`)],
      ["e2e-result.json", report],
    ]) {
      const path = join(directory, name);
      if (existsSync(path))
        assert.deepEqual(readFileSync(requireArtifactPath(root, path)), bytes, "Conflicting CI bundle");
      else writeFileSync(path, bytes, { flag: "wx", mode: 0o600 });
    }
    await verifyReleaseBundle(root, relativeDirectory, context, {
      expectedAdmissionSha256: process.env.GATE_ADMISSION_SHA256,
    });
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `ready=true\nversion=${version}\ndirectory=${relativeDirectory}\n` +
        `artifact-name=release-${context.sourceRevision}-${context.runId}-${context.attempt}\n`,
    );
    console.log(`Prepared ${version} from tested images for release-only publication; not deployed.`);
  }
} catch (error) {
  console.error(`Release bundle failed: ${String(error.message).replaceAll(process.cwd(), "[repository]")}`);
  process.exitCode = 1;
}
