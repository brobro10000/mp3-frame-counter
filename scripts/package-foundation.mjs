import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const sha = process.env.GITHUB_SHA ?? head;
if (!/^[a-f0-9]{40}$/.test(sha) || head !== sha) throw new Error("Checkout does not match the delivery commit");
const files = execFileSync("git", ["ls-tree", "-r", "--name-only", sha], { encoding: "utf8" }).trim().split("\n");
const forbidden =
  /(^|\/)(\.git|node_modules|\.cache|\.mvp-workflow|\.mvp-orchestrator|\.codex|\.artifacts)(\/|$)|(^|\/)\.env($|\.)|\.(mp3|pem|key)$/i;
if (files.some((file) => forbidden.test(file))) throw new Error("Forbidden tracked path in archive source");
mkdirSync(".artifacts", { recursive: true });
const name = `foundation-${sha}.tar.gz`;
execFileSync("git", ["archive", "--format=tar.gz", `--prefix=foundation-${sha}/`, `--output=.artifacts/${name}`, sha]);
const checksum = createHash("sha256")
  .update(readFileSync(`.artifacts/${name}`))
  .digest("hex");
writeFileSync(".artifacts/COMMIT_SHA", `${sha}\n`);
writeFileSync(".artifacts/SHA256SUMS", `${checksum}  ${name}\n`);
console.log(`Created ${name} with SHA-256 ${checksum}`);
