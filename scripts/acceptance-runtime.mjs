/**
 * Select required acceptance for legacy, trusted CI and ordinary local consumers without changing historical evidence.
 *
 * Import runtimeAcceptance(root, env) with an explicit checkout and environment object. Legacy sources use the original
 * baseline verifier. Post-policy CI requires a record-only GATE_ADMISSION_PATH outside the checkout and an independent
 * GATE_ADMISSION_SHA256, bound to complete GitHub context and actual HEAD. Local selection resolves committed HEAD
 * against explicit CI_BASE_REF or its merge base with origin/main and returns a localSelection, never CI admission.
 *
 * This module only reads Git objects, working suite files and the supplied admission file. It does not discover tokens,
 * contact services, write files, mutate Git or run the suite. Importing has no I/O. Missing history/context, unsafe paths,
 * malformed or inconsistent evidence, changed suite bytes and unobserved new bindings throw. CI authentication remains
 * the trusted preflight's responsibility; a local selection cannot replace that preflight or authorize publication.
 */

import assert from "node:assert/strict";
import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from "node:path";
import { git, resolveAcceptance, verifyBaseline } from "./acceptance-baseline.mjs";
import { acceptancePolicyIntroduced, verifyAcceptanceAdmission } from "./acceptance-admission.mjs";

const revisionPattern = /^[a-f0-9]{40}$/;
const digestPattern = /^[a-f0-9]{64}$/;
const suitePrefix = "tests/acceptance/";

/** Exclude checkout-controlled files using component ancestry, including the root itself. */
function inside(root, path) {
  const child = relative(root, path);
  return child === "" || (!isAbsolute(child) && child !== ".." && !child.startsWith(`..${sep}`));
}

/** Require actual directories for every component; realpath alone would conceal symlinked parent directories. */
function requireDirectories(path) {
  const { root } = parse(path);
  let current = root;
  for (const part of relative(root, path).split(sep).filter(Boolean)) {
    current = join(current, part);
    assert(lstatSync(current).isDirectory(), "Acceptance paths cannot contain symlinked or non-directory parents");
  }
}

/** Read one regular external JSON record without following a final symlink or accepting an embedded digest envelope. */
function readAdmission(root, path) {
  assert(typeof path === "string" && isAbsolute(path) && !/[\x00-\x1f\x7f]/.test(path), "Invalid admission path");
  assert.equal(path, resolve(path), "Admission path must be canonical");
  requireDirectories(dirname(path));
  assert(!inside(root, realpathSync(path)), "CI admission must be outside the checkout");
  assert(lstatSync(path).isFile(), "CI admission must be a regular file");
  const descriptor = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    assert(fstatSync(descriptor).isFile(), "CI admission must be a regular file");
    return JSON.parse(readFileSync(descriptor, "utf8"));
  } finally {
    closeSync(descriptor);
  }
}

/** Compare current nonignored acceptance paths and regular-file bytes to committed HEAD, including candidate suites. */
function requireCurrentSuite(root, sourceRevision) {
  const entries = git(root, ["--no-replace-objects", "ls-tree", "-r", "-z", sourceRevision, "--", "tests/acceptance"])
    .split("\0")
    .filter(Boolean)
    .map((entry) => {
      const separator = entry.indexOf("\t");
      const metadata = entry.slice(0, separator);
      const path = entry.slice(separator + 1);
      assert(/^100(?:644|755) blob [a-f0-9]{40}$/.test(metadata), "Committed suite requires regular files");
      assert(path.startsWith(suitePrefix), "Unexpected acceptance suite path");
      return path;
    })
    .sort();
  const current = [
    ...new Set(
      git(root, ["--no-replace-objects", "ls-files", "--cached", "--others", "--exclude-standard", "-z"])
        .split("\0")
        .filter((path) => path.startsWith(suitePrefix)),
    ),
  ].sort();
  assert.deepEqual(current, entries, "Working acceptance file set differs from committed source");
  for (const path of entries) {
    const absolute = join(root, path);
    requireDirectories(dirname(absolute));
    assert(lstatSync(absolute).isFile(), "Working acceptance requires regular files");
    assert.deepEqual(
      readFileSync(absolute),
      git(root, ["--no-replace-objects", "show", `${sourceRevision}:${path}`], null),
      "Working acceptance bytes differ from committed source",
    );
  }
}

/** Numeric runner identities are explicit positive decimal safe integers, never coerced fractions or defaults. */
function positiveInteger(value) {
  assert(typeof value === "string" && /^[1-9]\d*$/.test(value), "Missing or invalid CI run identity");
  const number = Number(value);
  assert(Number.isSafeInteger(number), "CI run identity exceeds the supported range");
  return number;
}

/** Derive the expected record context from caller-supplied CI fields and actual Git objects, never record claims. */
function ciContext(root, env, sourceRevision) {
  assert.equal(env.CI, "true", "Acceptance admission requires CI");
  assert.equal(env.GITHUB_ACTIONS, "true", "Acceptance admission requires GitHub Actions");
  assert.equal(env.GITHUB_SERVER_URL, "https://github.com", "Unsupported GitHub server");
  assert.equal(env.GITHUB_API_URL, "https://api.github.com", "Unsupported GitHub API");
  assert.equal(env.GITHUB_SHA, sourceRevision, "CI source differs from actual HEAD");
  assert.equal(env.GITHUB_WORKFLOW_SHA, sourceRevision, "Workflow differs from actual HEAD");
  assert.equal(
    env.GITHUB_WORKFLOW_REF,
    `${env.GITHUB_REPOSITORY}/.github/workflows/ci.yml@${env.GITHUB_REF}`,
    "Unexpected CI workflow identity",
  );
  assert(typeof env.CI_BASE_REF === "string" && revisionPattern.test(env.CI_BASE_REF), "Missing exact CI base");
  return {
    repository: env.GITHUB_REPOSITORY,
    eventName: env.GITHUB_EVENT_NAME,
    ref: env.GITHUB_REF,
    sourceRevision,
    sourceTree: git(root, ["--no-replace-objects", "rev-parse", `${sourceRevision}^{tree}`]).trim(),
    baseRevision: env.CI_BASE_REF,
    workflowRevision: env.GITHUB_WORKFLOW_SHA,
    toolingRevision: env.CI_BASE_REF,
    runId: positiveInteger(env.GITHUB_RUN_ID),
    attempt: positiveInteger(env.GITHUB_RUN_ATTEMPT),
  };
}

/** Resolve explicit local authority or origin/main ancestry; missing references must not default to HEAD. */
function localBase(root, env, sourceRevision) {
  if (env.CI_BASE_REF !== undefined) {
    assert(typeof env.CI_BASE_REF === "string" && env.CI_BASE_REF.length > 0, "Invalid explicit local base");
    return git(root, [
      "--no-replace-objects",
      "rev-parse",
      "--verify",
      "--end-of-options",
      `${env.CI_BASE_REF}^{commit}`,
    ]).trim();
  }
  return git(root, ["--no-replace-objects", "merge-base", "--all", sourceRevision, "refs/remotes/origin/main"]).trim();
}

/** Return baseline-only legacy evidence, a verified CI envelope, or an explicitly non-CI local resolution. */
export function runtimeAcceptance(root, env) {
  assert(env && typeof env === "object" && !Array.isArray(env), "Runtime acceptance requires explicit environment");
  const checkout = realpathSync(root);
  assert.equal(
    realpathSync(git(checkout, ["--no-replace-objects", "rev-parse", "--show-toplevel"]).trim()),
    checkout,
    "Runtime root must be the checkout root",
  );
  const sourceRevision = git(checkout, ["--no-replace-objects", "rev-parse", "HEAD"]).trim();
  const introduced = acceptancePolicyIntroduced(checkout, sourceRevision);
  if (!introduced) {
    assert.equal(env.GATE_ADMISSION_PATH, undefined, "Legacy acceptance cannot carry CI admission evidence");
    assert.equal(env.GATE_ADMISSION_SHA256, undefined, "Legacy acceptance cannot carry CI admission evidence");
    return { baseline: verifyBaseline(checkout, env.CI_BASE_REF) };
  }
  requireCurrentSuite(checkout, sourceRevision);
  if (env.CI === "true" || env.GITHUB_ACTIONS !== undefined) {
    const expectedContext = ciContext(checkout, env, sourceRevision);
    assert(
      typeof env.GATE_ADMISSION_SHA256 === "string" && digestPattern.test(env.GATE_ADMISSION_SHA256),
      "Missing independent CI admission digest",
    );
    const record = readAdmission(checkout, env.GATE_ADMISSION_PATH);
    const resolution = verifyAcceptanceAdmission(checkout, {
      record,
      expectedContext,
      expectedSha256: env.GATE_ADMISSION_SHA256,
    });
    assert(resolution.policySha256 !== null, "Introduced acceptance policy is missing");
    return {
      baseline: resolution.required,
      resolution,
      admission: { record, sha256: env.GATE_ADMISSION_SHA256 },
    };
  }
  assert(env.CI === undefined || env.CI === "false", "Unsupported CI indicator");
  assert.equal(env.GATE_ADMISSION_PATH, undefined, "Local acceptance cannot consume CI admission records");
  assert.equal(env.GATE_ADMISSION_SHA256, undefined, "Local acceptance cannot consume CI admission digests");
  const baseRevision = localBase(checkout, env, sourceRevision);
  const resolution = resolveAcceptance(checkout, { sourceRevision, trustedBase: baseRevision });
  assert(resolution.policySha256 !== null, "Introduced acceptance policy is missing");
  return {
    baseline: resolution.required,
    resolution,
    localSelection: { kind: "local-acceptance-resolution", sourceRevision, baseRevision, resolution },
  };
}
