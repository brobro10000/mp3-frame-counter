import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";

const version = "1.7.12";
const platforms = {
  "darwin-arm64": ["darwin_arm64", "aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f"],
  "linux-x64": ["linux_amd64", "8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8"],
};
const selected = platforms[`${process.platform}-${process.arch}`];
if (!selected) throw new Error("Use macOS arm64 or Linux x64 for the pinned actionlint distribution");
const [platform, checksum] = selected;
const dir = `.cache/actionlint/${version}/${platform}`;
const archive = `${dir}/release.tar.gz`;
await mkdir(dir, { recursive: true });
let bytes;
try {
  bytes = await readFile(archive);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  const url = `https://github.com/rhysd/actionlint/releases/download/v${version}/actionlint_${version}_${platform}.tar.gz`;
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`actionlint download failed: ${response.status}`);
  bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(archive, bytes);
}
if (createHash("sha256").update(bytes).digest("hex") !== checksum) throw new Error("actionlint checksum mismatch");
// Re-extract the verified archive every time, so a modified cached executable is never trusted.
execFileSync("tar", ["-xzf", archive, "-C", dir, "actionlint"]);
await chmod(`${dir}/actionlint`, 0o755);
console.log(execFileSync(`${dir}/actionlint`, ["-version"], { encoding: "utf8" }).trim());
// External shellcheck/pyflakes are not part of the pinned toolchain; actionlint still validates workflow syntax.
execFileSync(`${dir}/actionlint`, ["-shellcheck=", "-pyflakes=", ".github/workflows/ci.yml"], { stdio: "inherit" });
