/**
 * Check a same-attempt publisher handoff against independently supplied context, outputs and artifact metadata.
 * Call validateSameRunPublisherHandoff({ context, publisher, artifact, archiveBytes }) with the closed contract in
 * docs/deployment/same-run-handoff.md. This synchronous helper performs no I/O, credential lookup or deployment.
 * It bounds and hashes the actual archive, reads only the pinned one-file STORE layout in memory, reuses the publisher
 * schema, and returns detached frozen consistency evidence. Every refusal is a sanitized ERR_SAME_RUN_HANDOFF TypeError.
 * The caller must authenticate the inputs externally; this module cannot establish authority or replay acceptance.
 */
import { createHash } from "node:crypto";
import { crc32 } from "node:zlib";
import { createPublisherHandoff, createPublisherReceipt } from "./publisher-handoff.mjs";

const contextKeys = [
  "repository",
  "repositoryId",
  "repositoryOwnerId",
  "eventName",
  "ref",
  "sourceRevision",
  "baseRevision",
  "workflowRevision",
  "runId",
  "attempt",
];
const outputKeys = ["handoff-ready", "handoff-artifact-id", "handoff-artifact-sha256", "handoff-sha256"];
const handoffInputKeys = ["originalContext", "admissionSha256", "publisherContext", "repository", "release"];

/** Fail a consistency predicate; the public boundary replaces every internal error with the same safe diagnostic. */
function requireValue(condition) {
  if (!condition) throw new TypeError("ERR_SAME_RUN_HANDOFF");
}

/** Compare the entire string so a final newline cannot satisfy a regular expression's dollar anchor. */
function matches(value, expression) {
  return typeof value === "string" && expression.exec(value)?.[0] === value;
}

/** Accept exactly the named enumerable properties of an ordinary JSON record. */
function closed(value, keys) {
  requireValue(value !== null && typeof value === "object" && !Array.isArray(value));
  const actual = Object.keys(value);
  requireValue(actual.length === keys.length && keys.every((key) => actual.includes(key)));
}

/** Require a positive numeric identifier without coercion or loss of precision. */
function positive(value) {
  requireValue(Number.isSafeInteger(value) && value > 0);
}

/** Check all fixed-width fields in an already bounded record; offsets are local to that record. */
function fields(bytes, start, rows) {
  for (const [offset, width, expected] of rows) {
    const actual = width === 2 ? bytes.readUInt16LE(start + offset) : bytes.readUInt32LE(start + offset);
    requireValue(actual === expected);
  }
}

/** Read the single pinned STORE entry. Fixed framing gives exact disjoint offsets without searching untrusted bytes. */
function readPayload(bytes, length) {
  const descriptor = 42 + length;
  const central = descriptor + 16;
  const end = central + 58;
  fields(bytes, 0, [
    [0, 4, 0x04034b50],
    [4, 2, 20],
    [6, 2, 8],
    [8, 2, 0],
    [14, 4, 0],
    [18, 4, 0],
    [22, 4, 0],
    [26, 2, 12],
    [28, 2, 0],
  ]);
  requireValue(bytes.subarray(30, 42).equals(Buffer.from("handoff.json", "ascii")));
  const payload = bytes.subarray(42, descriptor);
  const crc = crc32(payload);
  fields(bytes, descriptor, [
    [0, 4, 0x08074b50],
    [4, 4, crc],
    [8, 4, length],
    [12, 4, length],
  ]);
  fields(bytes, central, [
    [0, 4, 0x02014b50],
    [4, 2, 0x032d],
    [6, 2, 20],
    [8, 2, 8],
    [10, 2, 0],
    [12, 2, bytes.readUInt16LE(10)],
    [14, 2, bytes.readUInt16LE(12)],
    [16, 4, crc],
    [20, 4, length],
    [24, 4, length],
    [28, 2, 12],
    [30, 2, 0],
    [32, 2, 0],
    [34, 2, 0],
    [36, 2, 0],
    [38, 4, 0x81800020],
    [42, 4, 0],
  ]);
  requireValue(bytes.subarray(central + 46, central + 58).equals(Buffer.from("handoff.json", "ascii")));
  fields(bytes, end, [
    [0, 4, 0x06054b50],
    [4, 2, 0],
    [6, 2, 0],
    [8, 2, 1],
    [10, 2, 1],
    [12, 4, 58],
    [16, 4, central],
    [20, 2, 0],
  ]);
  requireValue(end + 22 === bytes.byteLength);
  return payload;
}

/** Validate only consistency; trusted acquisition, original admission replay and deployment remain separate gates. */
export function validateSameRunPublisherHandoff(input) {
  try {
    closed(input, ["context", "publisher", "artifact", "archiveBytes"]);
    const { context, publisher, artifact, archiveBytes } = input;
    closed(context, contextKeys);
    closed(publisher, ["result", "outputs"]);
    closed(publisher.outputs, outputKeys);
    closed(artifact, ["id", "name", "sizeInBytes", "digest", "expired", "workflowRun"]);
    closed(artifact.workflowRun, ["id", "repositoryId", "headRepositoryId", "headBranch", "headSha"]);
    for (const key of ["repositoryId", "repositoryOwnerId", "runId", "attempt"]) positive(context[key]);
    requireValue(matches(context.repository, /^[\w.-]+\/[\w.-]+$/));
    for (const key of ["sourceRevision", "baseRevision", "workflowRevision"])
      requireValue(matches(context[key], /^[a-f0-9]{40}$/));
    requireValue(context.eventName === "push" && context.ref === "refs/heads/main");
    requireValue(context.workflowRevision === context.sourceRevision);
    const outputs = publisher.outputs;
    requireValue(publisher.result === "success" && outputs["handoff-ready"] === "true");
    requireValue(matches(outputs["handoff-artifact-id"], /^[1-9]\d*$/));
    const artifactId = Number(outputs["handoff-artifact-id"]);
    positive(artifactId);
    for (const key of ["handoff-artifact-sha256", "handoff-sha256"])
      requireValue(matches(outputs[key], /^[a-f0-9]{64}$/));
    positive(artifact.id);
    positive(artifact.sizeInBytes);
    requireValue(artifact.id === artifactId && artifact.expired === false);
    requireValue(artifact.digest === `sha256:${outputs["handoff-artifact-sha256"]}`);
    requireValue(artifact.sizeInBytes <= 256 * 1024);
    const run = artifact.workflowRun;
    for (const key of ["id", "repositoryId", "headRepositoryId"]) positive(run[key]);
    requireValue(run.id === context.runId && run.repositoryId === context.repositoryId);
    requireValue(run.headRepositoryId === context.repositoryId && run.headBranch === "main");
    requireValue(run.headSha === context.sourceRevision);
    requireValue(archiveBytes instanceof Uint8Array && archiveBytes.byteLength === artifact.sizeInBytes);
    // The accepted layout has exactly 138 framing bytes. Enforce both bounds before hashing or reading any header.
    const length = archiveBytes.byteLength - 138;
    requireValue(length > 0 && length <= 64 * 1024);
    const bytes = Buffer.from(archiveBytes.buffer, archiveBytes.byteOffset, archiveBytes.byteLength);
    const archiveSha256 = createHash("sha256").update(bytes).digest("hex");
    requireValue(archiveSha256 === outputs["handoff-artifact-sha256"]);
    const payload = readPayload(bytes, length);
    const receipt = createPublisherReceipt({ handoffBytes: payload, artifactId, artifactSha256: archiveSha256 });
    requireValue(receipt.handoffSha256 === outputs["handoff-sha256"]);
    requireValue(artifact.name === receipt.artifactName);
    // Receipt creation has already checked UTF-8, BOM and the complete closed schema against these exact bytes.
    const record = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(payload));
    const handoff = createPublisherHandoff(Object.fromEntries(handoffInputKeys.map((key) => [key, record[key]])));
    requireValue(
      handoff.repository.id === context.repositoryId && handoff.repository.ownerId === context.repositoryOwnerId,
    );
    for (const key of ["repository", "sourceRevision", "baseRevision", "workflowRevision", "runId"])
      requireValue(handoff.originalContext[key] === context[key] && handoff.publisherContext[key] === context[key]);
    requireValue(
      handoff.originalContext.eventName === context.eventName && handoff.originalContext.ref === context.ref,
    );
    requireValue(handoff.publisherContext.attempt === context.attempt);
    return Object.freeze({ schemaVersion: 1, kind: "same-run-publisher-handoff", handoff, receipt });
  } catch {
    const error = new TypeError("ERR_SAME_RUN_HANDOFF");
    error.code = "ERR_SAME_RUN_HANDOFF";
    throw error;
  }
}
