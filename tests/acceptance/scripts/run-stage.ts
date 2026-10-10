/**
 * Fixed stage wrapper; production imports the inert shared driver with its own compiled role. Usage: npm run e2e:stage,
 * bounded JSON stdin and the parent-owned HOSTED_PRIVATE_DIRECTORY only. Sanitizes worker environment, kills/reaps its
 * owned child on timeout/output overflow, removes private input and emits only a closed result/fixed diagnostic. No
 * provider, credential minting, arbitrary command, target option, test filter or deployment operation exists here.
 */
import { spawn } from "node:child_process";
import { lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { buildHostedResult, requireHostedRows } from "../lib/hosted-report.ts";
import { hostedFailure, receiveHostedInput, removeHostedInput } from "../lib/hosted-target.ts";
import type { Execution, FailureCode, Finalization, Profile } from "../lib/hosted-types.ts";
const root = fileURLToPath(new URL("..", import.meta.url));
/** Construct a minimal child environment before any Playwright import; existing startup injection is refused. */
function cleanEnvironment(): NodeJS.ProcessEnv {
  if (
    process.execArgv.length ||
    process.permission ||
    [
      "NODE_OPTIONS",
      "NODE_V8_COVERAGE",
      "DEBUG",
      "DEBUG_FILE",
      "PWDEBUG",
      "PLAYWRIGHT_DEBUG",
      "PLAYWRIGHT_DEBUG_FILE",
      "NODE_DEBUG",
      "NODE_DEBUG_NATIVE",
    ].some((key) => process.env[key])
  )
    throw hostedFailure("ENVIRONMENT");
  const home = process.env.HOME,
    privateDirectory = process.env.HOSTED_PRIVATE_DIRECTORY;
  if (!home || !isAbsolute(home) || !privateDirectory) throw hostedFailure("ENVIRONMENT");
  const env: NodeJS.ProcessEnv = {
    HOME: home,
    PATH: `${dirname(process.execPath)}:/usr/bin:/bin`,
    LANG: "en_US.UTF-8",
    LC_ALL: "en_US.UTF-8",
    TZ: "UTC",
    HOSTED_PRIVATE_DIRECTORY: privateDirectory,
  };
  if (process.env.TMPDIR && isAbsolute(process.env.TMPDIR)) env.TMPDIR = process.env.TMPDIR;
  return env;
}
/** Wait for the fixed pinned Playwright process; no child output is retained or forwarded. */
async function child(
  role: Profile,
  env: NodeJS.ProcessEnv,
  remaining: number,
): Promise<{ passed: boolean; cleanup: boolean; reaped: boolean; codes: FailureCode[] }> {
  return new Promise((resolve) => {
    let done = false,
      total = 0,
      terminating = false,
      forced = false,
      reaped = false,
      killTimer: ReturnType<typeof setTimeout> | undefined;
    let finalTimer: ReturnType<typeof setTimeout> | undefined;
    const codes = new Set<FailureCode>();
    const processChild = spawn(
      process.execPath,
      [
        fileURLToPath(new URL("../node_modules/@playwright/test/cli.js", import.meta.url)),
        "test",
        "--config",
        `playwright.${role}.config.ts`,
      ],
      { cwd: root, env: { ...env, NODE_V8_COVERAGE: undefined }, detached: true, stdio: ["ignore", "pipe", "pipe"] },
    );
    /** Signal only the child process group created here; unknown outcomes remain cleanup failures. */
    const kill = (signal: NodeJS.Signals) => {
      try {
        if (processChild.pid) process.kill(-processChild.pid, signal);
      } catch {
        codes.add("CLEANUP");
      }
    };
    /** Resolve once after observed exit or the hard cleanup bound, clearing handlers without claiming unobserved reaping. */
    const finish = (passed: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(deadline);
      clearTimeout(killTimer);
      clearTimeout(finalTimer);
      process.off("SIGTERM", interrupt);
      process.off("SIGINT", interrupt);
      if (!reaped) {
        processChild.stdout.destroy();
        processChild.stderr.destroy();
        processChild.unref();
      }
      resolve({
        passed: passed && !terminating && codes.size === 0,
        cleanup: reaped && !forced && !codes.has("CLEANUP"),
        reaped,
        codes: [...codes],
      });
    };
    /** Request graceful owned cleanup once, then mark forced termination or missing reaping as failure. */
    const stop = (code: FailureCode) => {
      codes.add(code);
      if (terminating) return;
      terminating = true;
      kill("SIGTERM");
      killTimer = setTimeout(() => {
        forced = true;
        codes.add("CLEANUP");
        kill("SIGKILL");
      }, 25000);
      finalTimer = setTimeout(() => {
        codes.add("CLEANUP");
        finish(false);
      }, 30000);
    };
    /** Convert parent interruption into the same bounded failure-and-cleanup path, without extending a running stop. */
    const interrupt = () => stop("HTTP");
    process.on("SIGTERM", interrupt);
    process.on("SIGINT", interrupt);
    const deadline = setTimeout(() => stop("HTTP"), Math.max(1, remaining));
    for (const stream of [processChild.stdout, processChild.stderr])
      stream.on("data", (bytes: Buffer) => {
        total += bytes.length;
        if (total > 1048576) stop("OVERFLOW");
      });
    processChild.once("error", () => {
      codes.add("ENVIRONMENT");
      reaped = !processChild.pid;
      finish(false);
    });
    processChild.once("close", (code, signal) => {
      if (signal) codes.add("CLEANUP");
      reaped = true;
      finish(code === 0);
    });
  });
}
/** Execute only a compiled role; this is shared code, not a caller-facing profile selector. */
export async function runHostedWrapper(role: Profile): Promise<void> {
  if (process.argv.length !== 2 || !["stage", "production"].includes(role)) throw hostedFailure("INPUT");
  const started = Date.now();
  const env = cleanEnvironment();
  process.env = env;
  const report = new URL(`../.artifacts/hosted-${role}-result.json`, import.meta.url);
  const intermediate = new URL(`../.artifacts/hosted-${role}-rows.json`, import.meta.url);
  mkdirSync(new URL("../.artifacts/", import.meta.url), { recursive: true });
  for (const path of [report, intermediate]) rmSync(path, { force: true });
  let target: Awaited<ReturnType<typeof receiveHostedInput>> | undefined;
  let reaped = true;
  let rows: Execution[] = [],
    outcome: "passed" | "failed" | "blocked" = "failed",
    finish: Finalization = { cleanup: "passed", failures: [] };
  try {
    target = await receiveHostedInput(role, process.stdin);
    const execution = await child(role, env, 900000 - (Date.now() - started));
    reaped = execution.reaped;
    finish = { cleanup: execution.cleanup ? "passed" : "failed", failures: execution.codes };
    try {
      const stat = lstatSync(intermediate);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1048576) throw hostedFailure("IDENTITY");
      const value = requireHostedRows(
        JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(intermediate))),
        target.publicInput,
      );
      rows = value.tests;
      const finals = value.finalizations.flatMap((row) => row.failures);
      finish = {
        cleanup:
          finish.cleanup === "passed" && value.finalizations.every((row) => row.cleanup === "passed")
            ? "passed"
            : "failed",
        failures: [...new Set([...finish.failures, ...finals])],
      };
      if (execution.passed && value.status === "passed" && finish.cleanup === "passed" && !finish.failures.length)
        outcome = "passed";
    } catch {
      finish = { cleanup: finish.cleanup, failures: [...new Set<FailureCode>([...finish.failures, "IDENTITY"])] };
    }
  } finally {
    const cleanup: Finalization = reaped ? await removeHostedInput() : { cleanup: "failed", failures: ["CLEANUP"] };
    finish = {
      cleanup: finish.cleanup === "passed" && cleanup.cleanup === "passed" ? "passed" : "failed",
      failures: [...new Set([...finish.failures, ...cleanup.failures])],
    };
    if (finish.cleanup !== "passed" || finish.failures.length) outcome = "failed";
    if (target) {
      const value = buildHostedResult(target.publicInput, rows, finish, outcome);
      writeFileSync(report, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
    }
  }
  if (outcome !== "passed") throw hostedFailure("ASSERTION");
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runHostedWrapper("stage").catch(() => {
    console.error("Hosted stage execution failed");
    process.exitCode = 1;
  });
}
