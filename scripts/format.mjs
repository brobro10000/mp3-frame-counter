/**
 * Apply the same Prettier file selection locally and in CI using only files tracked by Git.
 *
 * Run `npm run format:check` to report formatting problems, or `npm run format` to rewrite selected files.
 * The repository root must be the working directory, and npm dependencies must already be installed.
 * Ignore rules and parser detection exclude canonical generated artifacts and unsupported file types.
 * Newly created files must be staged before this script can include them; Prettier's exit status is propagated.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { getFileInfo } from "prettier";

const mode = process.argv[2];
if (!["--check", "--write"].includes(mode)) throw new Error("Expected --check or --write");
// NUL-separated paths preserve filenames containing whitespace without involving shell argument expansion.
const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const files = [];
for (const file of tracked) {
  const info = await getFileInfo(file, { ignorePath: ".prettierignore" });
  if (!info.ignored && info.inferredParser) files.push(file);
}
if (!files.length) throw new Error("No tracked formattable files");
// Use the installed, lockfile-pinned Prettier CLI and the same Node executable that launched this script.
const result = spawnSync(process.execPath, ["node_modules/prettier/bin/prettier.cjs", mode, ...files], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
