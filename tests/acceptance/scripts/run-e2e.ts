/**
 * Usage: npm run e2e with the README's explicit target/environment binding. Validate nonproduction authority before
 * launching this package's pinned Playwright executable. No forwarded CLI filters or skip modes are supported.
 * Writes ignored Playwright/report artifacts; exits with the real child status or fails on setup/spawn errors.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { target, suiteRevision } from "../lib/target.ts";

target();
suiteRevision();
if (process.argv.length !== 2) throw new Error("Full acceptance does not permit test filters or additional arguments");
const executable = new URL("../node_modules/@playwright/test/cli.js", import.meta.url);
const result = spawnSync(process.execPath, [fileURLToPath(executable), "test"], { stdio: "inherit", env: process.env });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
