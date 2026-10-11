/**
 * Execute the finite source-validation plan after the existing trusted CI preflight and npm installation.
 * Usage: node scripts/run-backend-source-checks.mjs, without selectors. Reads exact source/event-base Git metadata;
 * historical sources are dormant. Tools may write ignored build artifacts; failures stop the lane immediately.
 * No credentials, acceptance selection, Git writes, cloud actions or deployment/publication are performed.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { readBackendSourceCi, requireBackendSourceCi } from "./backend-source-ci.mjs";

/** Validate before executing each exact command/argv pair, sequentially; propagate the first callback/tool failure. */
export function runBackendSourceChecks(input, execute) {
  assert.equal(typeof execute, "function", "Source checker needs an executor");
  const { sourceChecks } = requireBackendSourceCi(input);
  for (const [command, args] of sourceChecks) execute(command, args);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    assert.equal(process.argv.length, 2, "Source checks accept no selectors or skip flags");
    const root = process.cwd();
    const head = execFileSync("git", ["--no-replace-objects", "rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim();
    let source = head;
    let base = head;
    if (process.env.GITHUB_ACTIONS !== undefined || process.env.CI === "true") {
      assert.equal(process.env.GITHUB_ACTIONS, "true", "Require actual GitHub event metadata in CI");
      assert.equal(process.env.CI, "true");
      source = process.env.GITHUB_SHA;
      assert.equal(source, head, "Source checks must read the actual checked-out source");
      const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
      assert.equal(event.repository?.full_name, process.env.GITHUB_REPOSITORY);
      if (process.env.GITHUB_EVENT_NAME === "push") {
        assert.equal(event.after, source);
        assert.equal(event.ref, "refs/heads/main");
        base = event.before;
      } else {
        assert.equal(process.env.GITHUB_EVENT_NAME, "pull_request");
        base = event.pull_request?.base?.sha;
        assert.equal(event.pull_request?.base?.ref, "main");
        const parents = execFileSync("git", ["--no-replace-objects", "rev-list", "--parents", "-n", "1", source], {
          cwd: root,
          encoding: "utf8",
          timeout: 30_000,
          maxBuffer: 4096,
        })
          .trim()
          .split(" ");
        assert.deepEqual(parents, [source, base, event.pull_request?.head?.sha]);
      }
      if (process.env.CI_BASE_REF) assert.equal(process.env.CI_BASE_REF, base);
    }
    const input = readBackendSourceCi(root, source, base);
    runBackendSourceChecks(input, (command, args) => {
      const result = spawnSync(command, args, {
        cwd: root,
        env: process.env,
        stdio: "inherit",
        timeout: 5 * 60 * 1000,
      });
      if (result.error) throw result.error;
      assert.equal(result.status, 0, `Source check failed: ${command} ${args.join(" ")}`);
    });
    console.log(
      "Exact-source validation completed; historical sources may be dormant. This is not acceptance evidence.",
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
