/**
 * Reject machine-specific paths in tracked repository content before they enter CI or source artifacts.
 *
 * Run `npm run check:portability` with Git and Node available. The checkout root is resolved from this script,
 * so neither the current directory nor a developer's home directory is hardcoded. All tracked files are scanned,
 * including preserved source captures and historical evidence; ignored caches and the local MP3 are excluded.
 * Reports only repository-relative filenames, line numbers and categories, never the matched private text.
 * This focused portability check is not a general-purpose credential or secret scanner.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const patterns = [
  ["user home directory", /(?:^|[\s"'`=(\[:])(?:file:\/\/)?\/(?:Users|home)\/[^/\s"'`<>]+/i],
  ["Windows absolute path", /(?:^|[\s"'`=(\[:])(?:file:\/\/\/)?[a-z]:[\\/][^\s"'`<>]+/i],
  [
    "machine-local directory",
    /(?:^|[\s"'`=(\[:])\/(?:private\/(?:var|tmp)|var\/folders|opt\/homebrew|usr\/local\/(?:Cellar|opt))(?:\/|$)/i,
  ],
  ["local file URL", /\bfile:\/{2,3}(?:[a-z]:[\\/]|\/*[a-z0-9_.~-])/i],
];

export function findLocalPaths(content) {
  // Decode slash escaping used by JSON reports before checking each line, without evaluating file contents.
  return content.split(/\r?\n/).flatMap((line, index) => {
    const normalized = line.replaceAll("\\/", "/").replaceAll("\\\\", "\\");
    const matches = patterns.filter(([, pattern]) => pattern.test(normalized));
    return matches.map(([category]) => ({ line: index + 1, category }));
  });
}

export function checkTrackedFiles(root) {
  const files = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
  return files.flatMap((file) =>
    findLocalPaths(readFileSync(join(root, file), "utf8")).map((finding) => ({ file, ...finding })),
  );
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const findings = checkTrackedFiles(root);
  for (const finding of findings) console.error(`${finding.file}:${finding.line}: ${finding.category}`);
  if (findings.length) {
    console.error("Use repository-relative paths or resolve local tool locations at runtime.");
    process.exitCode = 1;
  } else {
    console.log("Tracked files contain no recognized machine-specific paths.");
  }
}
