/**
 * Package the committed repository foundation as a source archive with commit and integrity metadata.
 * Run `npm run artifact:foundation` from the repository root using the pinned Node.js runtime and `git` on PATH.
 * Uses `GITHUB_SHA` when set, otherwise HEAD; the selected value must be a full SHA matching the current checkout.
 * Writes `foundation-<sha>.tar.gz`, `COMMIT_SHA`, and `SHA256SUMS` under `.artifacts/`, overwriting matching files.
 * Prints the archive name and SHA-256; invalid commits, forbidden tracked paths, or command/write failures exit nonzero.
 * Archives committed content only: working-tree edits and untracked files are excluded. It does not build an app,
 * upload an artifact, or deploy anything; the CI workflow handles artifact upload separately.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const sha = process.env.GITHUB_SHA ?? head;
// Tie delivery metadata to the checked-out commit so CI cannot silently package a different revision.
if (!/^[a-f0-9]{40}$/.test(sha) || head !== sha) throw new Error("Checkout does not match the delivery commit");
const files = execFileSync("git", ["ls-tree", "-r", "--name-only", sha], { encoding: "utf8" }).trim().split("\n");
// Reject known private/cache/input paths before creating an archive; this path check is not a content secret scan.
const forbidden =
  /(^|\/)(\.git|node_modules|\.cache|\.mvp-workflow|\.mvp-orchestrator|\.codex|\.artifacts)(\/|$)|(^|\/)\.env($|\.)|\.(mp3|pem|key)$/i;
if (files.some((file) => forbidden.test(file))) throw new Error("Forbidden tracked path in archive source");
mkdirSync(".artifacts", { recursive: true });
const name = `foundation-${sha}.tar.gz`;
// Git reads the selected commit directly and places its archive contents under a commit-specific top-level directory.
execFileSync("git", ["archive", "--format=tar.gz", `--prefix=foundation-${sha}/`, `--output=.artifacts/${name}`, sha]);
const checksum = createHash("sha256")
  .update(readFileSync(`.artifacts/${name}`))
  .digest("hex");
// Sidecar files identify the source revision and allow consumers to verify the exact archive bytes.
writeFileSync(".artifacts/COMMIT_SHA", `${sha}\n`);
writeFileSync(".artifacts/SHA256SUMS", `${checksum}  ${name}\n`);
console.log(`Created ${name} with SHA-256 ${checksum}`);
