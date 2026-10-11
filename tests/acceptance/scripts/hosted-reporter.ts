/**
 * Fixed hosted discovery and execution reporter. Usage is only through the two checked-in configurations. Projects
 * known tuples/statuses and one closed finalization per case; raw errors, stdout, headers and other attachments are
 * never emitted. Discovery never reads private input. Failed attribution produces failure, not fabricated identities.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import type { FullResult, Reporter, Suite, TestCase, TestResult } from "@playwright/test/reporter";
import { assertHostedInventory } from "../lib/hosted-inventory.ts";
import { requireHostedFinalization, requireHostedRows } from "../lib/hosted-report.ts";
import { loadHostedTarget, hostedFailure } from "../lib/hosted-target.ts";
import type { CaseRef, Execution, HostedDiscovery, HostedRows, Profile } from "../lib/hosted-types.ts";
const root = fileURLToPath(new URL("..", import.meta.url));
export default class HostedReporter implements Reporter {
  private role: Profile;
  private planned: CaseRef[] = [];
  private results: Execution[] = [];
  private finals: HostedRows["finalizations"] = [];
  private invalid = false;
  /** Bind the fixed role and admit only metadata supplied by the pinned Playwright reporter constructor. */
  constructor(options: { profile: Profile; configDir: string; _mode: string; _commandHash: string }) {
    const keys = ["profile", "configDir", "_mode", "_commandHash"];
    if (
      !options ||
      Object.getPrototypeOf(options) !== Object.prototype ||
      Object.keys(options).length !== keys.length ||
      !keys.every((key) => Object.hasOwn(options, key)) ||
      !["stage", "production"].includes(options.profile) ||
      typeof options.configDir !== "string" ||
      !["list", "test"].includes(options._mode) ||
      typeof options._commandHash !== "string"
    )
      throw hostedFailure("INPUT");
    // Framework metadata grants no target, path, role or output authority; only the checked-in profile is retained.
    this.role = options.profile;
  }
  /** Project the package-relative file and literal test title without exposing error or request metadata. */
  private identity(test: TestCase): CaseRef {
    return { file: relative(root, test.location.file).split("\\").join("/"), title: test.title };
  }
  /** Record discovered identities before execution so filters or missing cases cannot produce a passing report. */
  onBegin(_config: unknown, suite: Suite) {
    this.planned = suite.allTests().map((test) => this.identity(test));
  }
  /** Latch runner errors without retaining native diagnostics that may contain request details. */
  onError() {
    this.invalid = true;
  }
  /** Retain only execution status and one bounded closed finalization attachment; all other attachments are ignored. */
  onTestEnd(test: TestCase, result: TestResult) {
    const row = this.identity(test);
    const expectedStatus = test.expectedStatus;
    if (expectedStatus !== "passed" && expectedStatus !== "failed" && expectedStatus !== "skipped") {
      this.invalid = true;
      return;
    }
    this.results.push({
      ...row,
      status: result.status,
      expectedStatus,
      retry: result.retry,
      retries: test.retries,
    });
    try {
      const attachments = result.attachments.filter((item) => item.name === "hosted-finalization");
      if (
        attachments.length !== 1 ||
        attachments[0].contentType !== "application/json" ||
        !attachments[0].body ||
        attachments[0].body.length > 4096
      )
        throw hostedFailure("IDENTITY");
      const value = requireHostedFinalization(
        JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(attachments[0].body)),
      );
      this.finals.push({ case: row, cleanup: value.cleanup, failures: [...value.failures] });
    } catch {
      this.invalid = true;
    }
  }
  /** Write fixed discovery without private input, or validate execution against freshly admitted identity before writing. */
  async onEnd(result: FullResult): Promise<{ status: "passed" | "failed" }> {
    const discovery = process.argv.includes("--list");
    try {
      assertHostedInventory(this.role, this.planned);
      const directory = new URL("../.artifacts/", import.meta.url);
      mkdirSync(directory, { recursive: true });
      if (discovery) {
        const status = result.status === "passed" && !this.invalid && this.results.length === 0 ? "passed" : "failed";
        const value: HostedDiscovery = {
          schemaVersion: 1,
          kind: "hosted-suite-discovery",
          contractRevision: "backend-audio-v1",
          profile: this.role,
          status,
          inventory: this.planned,
          tests: [],
        };
        writeFileSync(new URL(`hosted-${this.role}-discovery.json`, directory), JSON.stringify(value, null, 2) + "\n", {
          mode: 0o600,
        });
        return { status };
      }
      const input = (await loadHostedTarget(this.role)).publicInput;
      const value: HostedRows = {
        schemaVersion: 1,
        kind: "hosted-suite-rows",
        profile: this.role,
        launchId: input.launchId,
        sourceRevision: input.sourceRevision,
        suite: structuredClone(input.suite),
        inventory: this.planned,
        tests: this.results,
        finalizations: this.finals,
        status: result.status === "passed" && !this.invalid ? "passed" : "failed",
      };
      const checked = requireHostedRows(value, input);
      writeFileSync(new URL(`hosted-${this.role}-rows.json`, directory), JSON.stringify(checked, null, 2) + "\n", {
        mode: 0o600,
      });
      return { status: checked.status };
    } catch {
      return { status: "failed" as const };
    }
  }
}
