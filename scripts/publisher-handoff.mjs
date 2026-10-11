/**
 * Validate publisher handoffs and emit one fixed Actions receipt, without credentials or deployment authority.
 * Pure callers use createPublisherHandoff(input) or createPublisherReceipt({ handoffBytes, artifactId, artifactSha256 });
 * both synchronously reject inconsistent closed records and return detached deeply frozen consistency evidence.
 * The credential-free CLI `node scripts/publisher-handoff.mjs` accepts no arguments. It reads only the fixed private
 * handoff, binds the exact main publisher context and uploader outputs, then appends four GITHUB_OUTPUT values and emits
 * one receipt marker. It never rewrites handoff bytes, performs network/child operations or discovers credentials.
 * Failure emits a fixed diagnostic and no marker; a receipt still requires external job/log/artifact authentication.
 */
import { createHash } from "node:crypto";
import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const handoffKeys = ["originalContext", "admissionSha256", "publisherContext", "repository", "release"];
const originalKeys = [
  "repository",
  "eventName",
  "ref",
  "sourceRevision",
  "sourceTree",
  "baseRevision",
  "workflowRevision",
  "toolingRevision",
  "runId",
  "attempt",
];
const publisherKeys = [
  "schemaVersion",
  "repository",
  "sourceRevision",
  "baseRevision",
  "runId",
  "attempt",
  "workflow",
  "workflowRevision",
];
const releaseKeys = [
  "id",
  "version",
  "tag",
  "reservationSha256",
  "publicationSha256",
  "publicationBindingSha256",
  "assets",
];
const assetNames = [
  "SHA256SUMS",
  "api.docker.tar",
  "ci-origin.json",
  "e2e-result.json",
  "frontend.docker.tar",
  "manifest.json",
  "publication-notes.md",
  "publication.json",
  "release-notes.md",
  "reservation.json",
];
const maxHandoffBytes = 64 * 1024;

/** Refuse a failed consistency predicate without echoing caller-controlled values. */
function requireValue(condition) {
  if (!condition) throw new Error("INVALID_PUBLISHER_HANDOFF");
}

/** Match the complete string, including any final newline that a JavaScript dollar anchor otherwise permits. */
function matches(value, pattern) {
  return typeof value === "string" && pattern.exec(value)?.[0] === value;
}

/** Require exactly the enumerable fields of an ordinary parsed JSON record, never an array or null. */
function closed(value, keys) {
  requireValue(value !== null && typeof value === "object" && !Array.isArray(value));
  const actual = Object.keys(value);
  requireValue(actual.length === keys.length && keys.every((key) => Object.hasOwn(value, key) && actual.includes(key)));
}

/** Accept positive finite safe numeric IDs and sizes without coercing caller strings. */
function positive(value) {
  requireValue(Number.isSafeInteger(value) && value > 0);
}

/** Validate the exact lowercase digest grammar; no prefixed or whitespace-normalized identity is accepted. */
function hash(value) {
  requireValue(matches(value, /^[a-f0-9]{64}$/));
}

/** Copy only validated scalar fields in the contract's fixed order, preserving no input object references. */
function fields(value, keys) {
  return Object.fromEntries(keys.map((key) => [key, value[key]]));
}

/** Freeze an already detached JSON tree recursively; callers' objects are never frozen or modified. */
function freeze(value) {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Construct fresh closed consistency evidence from verified publication inputs; it establishes no external authority. */
export function createPublisherHandoff(input) {
  closed(input, handoffKeys);
  const { originalContext: original, publisherContext: publisher, repository, release } = input;
  closed(original, originalKeys);
  closed(publisher, publisherKeys);
  closed(repository, ["id", "ownerId"]);
  closed(release, releaseKeys);
  for (const value of [original.repository, publisher.repository]) requireValue(matches(value, /^[\w.-]+\/[\w.-]+$/));
  for (const key of ["sourceRevision", "sourceTree", "baseRevision", "workflowRevision", "toolingRevision"])
    requireValue(matches(original[key], /^[a-f0-9]{40}$/));
  for (const key of ["sourceRevision", "baseRevision", "workflowRevision"])
    requireValue(matches(publisher[key], /^[a-f0-9]{40}$/));
  requireValue(original.eventName === "push" && original.ref === "refs/heads/main");
  requireValue(
    original.workflowRevision === original.sourceRevision && original.toolingRevision === original.baseRevision,
  );
  requireValue(publisher.schemaVersion === 1 && publisher.workflow === ".github/workflows/ci.yml");
  for (const key of ["repository", "sourceRevision", "baseRevision", "workflowRevision", "runId"])
    requireValue(publisher[key] === original[key]);
  for (const value of [
    original.runId,
    original.attempt,
    publisher.runId,
    publisher.attempt,
    repository.id,
    repository.ownerId,
    release.id,
  ])
    positive(value);
  requireValue(publisher.attempt >= original.attempt);
  hash(input.admissionSha256);
  for (const key of ["reservationSha256", "publicationSha256", "publicationBindingSha256"]) hash(release[key]);
  requireValue(matches(release.version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/));
  requireValue(release.version.split(".").every((part) => Number.isSafeInteger(Number(part))));
  requireValue(release.tag === `v${release.version}`);
  requireValue(Array.isArray(release.assets) && release.assets.length === assetNames.length);
  const ids = new Set();
  const assets = release.assets.map((asset, index) => {
    closed(asset, ["id", "name", "bytes", "sha256"]);
    positive(asset.id);
    positive(asset.bytes);
    hash(asset.sha256);
    requireValue(asset.name === assetNames[index] && !ids.has(asset.id));
    ids.add(asset.id);
    return fields(asset, ["id", "name", "bytes", "sha256"]);
  });
  requireValue(assets.find((asset) => asset.name === "publication.json").sha256 === release.publicationSha256);
  return freeze({
    schemaVersion: 1,
    kind: "publisher-handoff",
    status: "released-not-deployed",
    deployed: false,
    originalContext: fields(original, originalKeys),
    admissionSha256: input.admissionSha256,
    publisherContext: fields(publisher, publisherKeys),
    repository: fields(repository, ["id", "ownerId"]),
    release: { ...fields(release, releaseKeys.slice(0, -1)), assets },
  });
}

/** Decode bounded strict UTF-8 JSON and replay all closed handoff semantics without changing its raw bytes. */
function parseHandoff(bytes) {
  requireValue(bytes instanceof Uint8Array && bytes.byteLength > 0 && bytes.byteLength <= maxHandoffBytes);
  requireValue(!(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf));
  let record;
  try {
    record = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new Error("INVALID_PUBLISHER_HANDOFF");
  }
  closed(record, ["schemaVersion", "kind", "status", "deployed", ...handoffKeys]);
  requireValue(record.schemaVersion === 1 && record.kind === "publisher-handoff");
  requireValue(record.status === "released-not-deployed" && record.deployed === false);
  return createPublisherHandoff(fields(record, handoffKeys));
}

/** Bind an observed artifact ID/archive digest to actual raw handoff bytes; never accept a caller's inner digest. */
export function createPublisherReceipt(input) {
  closed(input, ["handoffBytes", "artifactId", "artifactSha256"]);
  positive(input.artifactId);
  hash(input.artifactSha256);
  const handoff = parseHandoff(input.handoffBytes);
  const { repository, sourceRevision, runId, attempt } = handoff.publisherContext;
  return freeze({
    schemaVersion: 1,
    kind: "publisher-handoff-receipt",
    repository,
    sourceRevision,
    runId,
    attempt,
    artifactId: input.artifactId,
    artifactName: `publisher-handoff-${sourceRevision}-${runId}-${attempt}`,
    artifactSha256: input.artifactSha256,
    handoffSha256: createHash("sha256").update(input.handoffBytes).digest("hex"),
  });
}

/** Read the one owned private handoff with no symlinked checkout-relative ancestor and no unbounded file read. */
function readFixedHandoff(root) {
  let current = root;
  for (const part of [".artifacts", "publisher-handoff"]) {
    current = join(current, part);
    const stat = lstatSync(current);
    requireValue(stat.isDirectory() && !stat.isSymbolicLink() && stat.uid === process.getuid());
    if (part === "publisher-handoff") requireValue((stat.mode & 0o777) === 0o700);
  }
  const fd = openSync(join(current, "handoff.json"), constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = fstatSync(fd);
    requireValue(stat.isFile() && stat.uid === process.getuid() && (stat.mode & 0o777) === 0o600);
    requireValue(stat.size > 0 && stat.size <= maxHandoffBytes);
    const bytes = readFileSync(fd);
    requireValue(bytes.byteLength <= maxHandoffBytes);
    return bytes;
  } finally {
    closeSync(fd);
  }
}

/** Validate fixed job/input/output bindings before publishing one bounded receipt and four safe output values. */
async function main() {
  requireValue(process.argv.length === 2 && process.env.GITHUB_JOB === "publish-release");
  const { publicationContext } = await import("./publish-release-evidence.mjs");
  const context = publicationContext(process.env);
  const bytes = readFixedHandoff(process.cwd());
  const handoff = parseHandoff(bytes);
  for (const key of publisherKeys) requireValue(context[key] === handoff.publisherContext[key]);
  requireValue(matches(process.env.HANDOFF_ARTIFACT_ID, /^[1-9]\d*$/));
  const receipt = createPublisherReceipt({
    handoffBytes: bytes,
    artifactId: Number(process.env.HANDOFF_ARTIFACT_ID),
    artifactSha256: process.env.HANDOFF_ARTIFACT_SHA256,
  });
  requireValue(process.env.HANDOFF_SHA256 === receipt.handoffSha256);
  requireValue(typeof process.env.GITHUB_OUTPUT === "string" && process.env.GITHUB_OUTPUT.length > 0);
  const output = openSync(process.env.GITHUB_OUTPUT, constants.O_WRONLY | constants.O_APPEND | constants.O_NOFOLLOW);
  try {
    const stat = fstatSync(output);
    requireValue(stat.isFile() && stat.uid === process.getuid());
    writeFileSync(
      output,
      `handoff-ready=true\nhandoff-artifact-id=${receipt.artifactId}\n` +
        `handoff-artifact-sha256=${receipt.artifactSha256}\nhandoff-sha256=${receipt.handoffSha256}\n`,
    );
  } finally {
    closeSync(output);
  }
  process.stdout.write(`PUBLISHER_HANDOFF_V1 ${JSON.stringify(receipt)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    process.stderr.write("Publisher handoff receipt failed: INVALID_PUBLISHER_HANDOFF\n");
    process.exitCode = 1;
  });
}
