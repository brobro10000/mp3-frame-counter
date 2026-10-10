/**
 * Usage: node scripts/check-fixtures.ts (package root). Reconstruct every independent fixture and verify its fixed
 * size/hash plus count diversity and exact-boundary arithmetic. Reads package inputs only, writes nothing, exits
 * nonzero on any mismatch. It never calculates a frame count by parsing audio or updates expected values.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { fixture, fixtureBytes, LIMIT, manifest } from "../lib/fixtures.ts";

assert.equal(manifest.contractRevision, "hosted-v1");
assert.equal(new Set(manifest.fixtures.map((entry) => entry.id)).size, manifest.fixtures.length);
for (const entry of manifest.fixtures) {
  const bytes = fixtureBytes(entry.id);
  assert.equal(bytes.length, entry.bytes, `${entry.id}: byte length changed`);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), entry.sha256, `${entry.id}: fixture hash changed`);
  if (entry.status === 200) assert.ok(Number.isSafeInteger(entry.frameCount) && entry.frameCount! > 0);
}
assert.ok(
  new Set(manifest.fixtures.filter((entry) => entry.status === 200).map((entry) => entry.frameCount)).size >= 3,
);
assert.equal(fixture("exact-limit").bytes, LIMIT);
assert.equal(54_613 * 384 + 128, LIMIT);
assert.equal(fixture("over-limit").bytes, LIMIT + 1);
assert.equal(fixture("six-mib").bytes, 6 * 1024 * 1024);
console.log(
  `Verified ${manifest.fixtures.length} independent fixtures; fixed hashes/counts and exact 20 MiB construction.`,
);
