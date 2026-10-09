import { execFileSync, spawnSync } from "node:child_process";
import { getFileInfo } from "prettier";

const mode = process.argv[2];
if (!["--check", "--write"].includes(mode)) throw new Error("Expected --check or --write");
const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const files = [];
for (const file of tracked) {
  const info = await getFileInfo(file, { ignorePath: ".prettierignore" });
  if (!info.ignored && info.inferredParser) files.push(file);
}
if (!files.length) throw new Error("No tracked formattable files");
const result = spawnSync(process.execPath, ["node_modules/prettier/bin/prettier.cjs", mode, ...files], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
