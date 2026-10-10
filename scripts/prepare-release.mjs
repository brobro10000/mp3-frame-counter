/**
 * Prepare a local, nondeployable release bundle from an actual clean, fully passed application E2E report.
 *
 * Run `node scripts/prepare-release.mjs --report .artifacts/e2e-result.json` with the pinned runtime, full Git history,
 * a clean preparation checkout and Docker's exact tested linux/amd64 images still present. The report's source may
 * precede the preparation-tooling revision. No version override, rebuild, retag, push, provider call or publish exists.
 * Git source/baseline/configuration identities and Docker IDs are checked before exporting either image by immutable ID.
 *
 * Creates ignored .artifacts/releases/0.1.<source-first-parent-ordinal>/ with two Docker archives, checksums,
 * reservation, manifest and deterministic notes. Version previews remain provisional even when checks pass locally.
 * Creation reserves a new directory atomically. Existing complete identical bundles are checked and reused; a conflict
 * or incomplete prior attempt fails without overwriting its bytes. Export failure retains the incomplete reservation
 * for inspection. This command never changes Git refs, external state, runtime images or deployment credentials.
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { detectPhase } from "./phase-policy.mjs";
import {
  archiveIdentity,
  canonical,
  configurationFingerprint,
  createManifest,
  digest,
  localEvidence,
  preparationIdentity,
  releaseNotes,
  requireArtifactPath,
  services,
  sourceConfigurationPaths,
  verifyImageInspection,
  verifyPreparedDirectory,
} from "./release-manifest.mjs";

const root = process.cwd();
const git = (args, encoding = "utf8") =>
  execFileSync("git", args, { cwd: root, encoding, timeout: 30_000, maxBuffer: 16 * 1024 * 1024 });
const write = (path, value) => writeFileSync(path, value, { flag: "wx", mode: 0o600 });

try {
  const { values, tokens } = parseArgs({
    options: { report: { type: "string" } },
    tokens: true,
    allowPositionals: false,
  });
  assert(tokens.filter((token) => token.name === "report").length <= 1, "Report option must not repeat");
  const reportPath = requireArtifactPath(root, values.report ?? ".artifacts/e2e-result.json");
  assert(lstatSync(reportPath).isFile(), "Report must be a regular file");
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  const evidence = localEvidence(report);
  assert.equal(
    git(["rev-parse", "--is-shallow-repository"]).trim(),
    "false",
    "Full Git history is required for ordinal versioning",
  );
  assert.equal(
    git(["status", "--porcelain"]).trim(),
    "",
    "Commit reviewed preparation tooling before export; checkout must be clean",
  );
  const preparationRevision = git(["rev-parse", "HEAD"]).trim();
  git(["merge-base", "--is-ancestor", evidence.sourceRevision, preparationRevision]);
  git(["cat-file", "-e", `${evidence.sourceRevision}^{commit}`]);
  const ordinal = Number(git(["rev-list", "--first-parent", "--count", evidence.sourceRevision]).trim());
  const baseline = JSON.parse(git(["show", `${evidence.sourceRevision}:docs/testing/baseline.json`]));
  assert.equal(baseline.schemaVersion, 1, "Unsupported source baseline schema");
  assert.equal(baseline.suiteCommit, evidence.suiteCommit);
  assert.equal(baseline.suiteTree, evidence.suiteTree);
  assert.equal(baseline.manifestSha256, evidence.fixtureManifestSha256);
  assert.equal(baseline.contractRevision, evidence.contractRevision);
  assert.equal(
    baseline.publicationStatus,
    evidence.baselinePublication,
    "Baseline publication claim differs from tested source",
  );
  git(["merge-base", "--is-ancestor", baseline.suiteCommit, evidence.sourceRevision]);
  const baselinePaths = git(["ls-tree", "-r", "--name-only", "-z", baseline.suiteCommit]).split("\0").filter(Boolean);
  assert.equal(detectPhase(baselinePaths), "acceptance", "Initial baseline must precede product implementation");
  assert.equal(git(["rev-parse", `${baseline.suiteCommit}:tests/acceptance`]).trim(), baseline.suiteTree);
  assert.equal(
    git(["rev-parse", `${evidence.sourceRevision}:tests/acceptance`]).trim(),
    baseline.suiteTree,
    "Tested source changed frozen suite bytes",
  );
  assert.equal(
    digest(git(["show", `${baseline.suiteCommit}:tests/acceptance/fixtures/manifest.json`], null)),
    baseline.manifestSha256,
  );
  const sourceFiles = Object.fromEntries(
    sourceConfigurationPaths.map((path) => [path, git(["show", `${evidence.sourceRevision}:${path}`], null)]),
  );
  const identity = preparationIdentity(report, ordinal, configurationFingerprint(sourceFiles));
  for (const service of services) {
    const inspected = JSON.parse(
      execFileSync("docker", ["image", "inspect", evidence.images[service]], {
        encoding: "utf8",
        timeout: 30_000,
        maxBuffer: 4 * 1024 * 1024,
      }),
    );
    assert.equal(inspected.length, 1);
    verifyImageInspection(evidence.images[service], inspected[0]);
  }
  const parent = requireArtifactPath(root, ".artifacts/releases", { allowMissingLeaf: true });
  mkdirSync(parent, { recursive: true, mode: 0o700 });
  requireArtifactPath(root, ".artifacts/releases");
  const directory = requireArtifactPath(root, `.artifacts/releases/${identity.version}`, { allowMissingLeaf: true });
  let created = false;
  try {
    mkdirSync(directory, { mode: 0o700 });
    created = true;
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  let manifest;
  if (!created) {
    assert(
      existsSync(join(directory, "manifest.json")),
      "Existing release reservation is incomplete; preserve and inspect it before retrying",
    );
    manifest = await verifyPreparedDirectory(directory, identity);
  } else {
    write(join(directory, "reservation.json"), `${JSON.stringify(identity, null, 2)}\n`);
    const archives = {};
    for (const service of services) {
      const path = join(directory, `${service}.docker.tar`);
      assert(!existsSync(path), "Refusing to overwrite an existing image archive");
      execFileSync("docker", ["image", "save", "--output", path, evidence.images[service]], {
        timeout: 180_000,
        maxBuffer: 4 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      });
      archives[service] = await archiveIdentity(path);
    }
    manifest = createManifest(identity, preparationRevision, archives);
    write(
      join(directory, "SHA256SUMS"),
      services.map((service) => `${archives[service].sha256}  ${service}.docker.tar`).join("\n") + "\n",
    );
    write(join(directory, "release-notes.md"), releaseNotes(manifest));
    // The completed manifest is the final write; an interrupted earlier step remains visibly incomplete.
    write(join(directory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    await verifyPreparedDirectory(directory, identity);
  }
  console.log(
    JSON.stringify(
      {
        status: "prepared-local",
        deployable: false,
        version: identity.version,
        reused: !created,
        sourceRevision: manifest.sourceRevision,
        preparationRevision: manifest.preparationRevision,
        verifiedByRevision: preparationRevision,
        reservationSha256: digest(canonical(identity)),
        directory: `.artifacts/releases/${identity.version}`,
      },
      null,
      2,
    ),
  );
} catch (error) {
  // Keep filenames portable and command diagnostics out of evidence; Docker/Git stderr is never copied to manifests.
  const message = String(error.message)
    .replaceAll(root, "[repository]")
    .replace(/\/(?:Users|home)\/[^\s"'<>():]+/g, "[local-path]");
  console.error(`Local release preparation failed: ${message}`);
  process.exitCode = 1;
}
