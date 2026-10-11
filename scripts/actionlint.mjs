/**
 * Validate the foundation workflow with a pinned, checksum-verified actionlint release.
 * Run `npm run lint:workflows` from the repository root using the pinned Node.js runtime and `tar` on PATH.
 * Reads every Git-tracked YAML file under `.github/workflows/`; new untracked files need separate explicit validation.
 * Supports macOS and Linux on x64 and arm64. On a cache miss, downloads from GitHub with a 30-second timeout, verifies
 * the bytes, then caches the archive and executable under `.cache/actionlint/`.
 * Prints the tool version and lint diagnostics; download, integrity, extraction, or lint failures exit nonzero.
 * Validates workflow syntax and expressions, but does not run jobs or external shellcheck/pyflakes checks.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";

const version = "1.7.12";
// Each supported platform is paired with the expected SHA-256 of its exact release archive.
const platforms = {
  "darwin-x64": ["darwin_amd64", "5b44c3bc2255115c9b69e30efc0fecdf498fdb63c5d58e17084fd5f16324c644"],
  "darwin-arm64": ["darwin_arm64", "aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f"],
  "linux-x64": ["linux_amd64", "8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8"],
  "linux-arm64": ["linux_arm64", "325e971b6ba9bfa504672e29be93c24981eeb1c07576d730e9f7c8805afff0c6"],
};
const selected = platforms[`${process.platform}-${process.arch}`];
if (!selected) throw new Error("Use macOS or Linux on x64 or arm64 for the pinned actionlint distribution");
const [platform, checksum] = selected;
const dir = `.cache/actionlint/${version}/${platform}`;
const archive = `${dir}/release.tar.gz`;
await mkdir(dir, { recursive: true });
let bytes;
let downloaded = false;
try {
  bytes = await readFile(archive);
} catch (error) {
  // Only a missing archive triggers a download; other cache read failures remain visible to the caller.
  if (error.code !== "ENOENT") throw error;
  const url = `https://github.com/rhysd/actionlint/releases/download/v${version}/actionlint_${version}_${platform}.tar.gz`;
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`actionlint download failed: ${response.status}`);
  bytes = Buffer.from(await response.arrayBuffer());
  downloaded = true;
}
// Reject invalid downloads before caching them, and never extract or run an archive that fails verification.
if (createHash("sha256").update(bytes).digest("hex") !== checksum) {
  const source = downloaded ? "downloaded archive" : `cached archive ${archive}; remove it and retry`;
  throw new Error(`actionlint checksum mismatch: ${source}`);
}
if (downloaded) await writeFile(archive, bytes);
// Re-extract the verified archive every time, so a modified cached executable is never trusted.
execFileSync("tar", ["-xzf", archive, "-C", dir, "actionlint"]);
await chmod(`${dir}/actionlint`, 0o755);
console.log(execFileSync(`${dir}/actionlint`, ["-version"], { encoding: "utf8" }).trim());
// Discover tracked files without a shell; NUL separation preserves path boundaries and cannot interpolate filenames.
const workflows = execFileSync("git", ["--no-replace-objects", "ls-files", "-z", "--", ".github/workflows"], {
  encoding: "utf8",
  timeout: 30000,
  maxBuffer: 1024 * 1024,
})
  .split("\0")
  .filter((file) => file.startsWith(".github/workflows/") && /\.ya?ml$/.test(file))
  .sort();
if (!workflows.length) throw new Error("No tracked workflow YAML files to validate");
// External shellcheck/pyflakes are not part of the pinned toolchain; every discovered workflow remains mandatory.
execFileSync(`${dir}/actionlint`, ["-shellcheck=", "-pyflakes=", ...workflows], { stdio: "inherit" });
