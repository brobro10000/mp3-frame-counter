/**
 * Playwright reporter used by the pinned full-suite entry point. Writes only a sanitized package-local result JSON
 * with target binding, suite identity, fixture hash and actual pass/fail/skip counts. Never emits upload bytes,
 * credentials, source paths or private sample names. Skips, zero tests and unexpected statuses fail the run.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { FullResult, Reporter, Suite, TestCase, TestResult } from "@playwright/test/reporter";
import { suiteRevision, target } from "../lib/target.ts";

export default class AcceptanceReporter implements Reporter {
  private planned = 0;
  private results: { title: string; status: string }[] = [];
  onBegin(_config: unknown, suite: Suite) {
    this.planned = suite.allTests().length;
  }
  onTestEnd(test: TestCase, result: TestResult) {
    this.results.push({ title: test.title, status: result.status });
  }
  async onEnd(result: FullResult) {
    // --list is a discovery-only command and does not produce application execution evidence.
    if (this.results.length === 0 && result.status === "passed") return;
    const passed = this.results.filter((entry) => entry.status === "passed").length;
    const skipped = this.results.filter((entry) => entry.status === "skipped").length;
    const failed = this.results.length - passed - skipped;
    const status = result.status === "passed" && this.planned > 0 && passed === this.planned ? "passed" : "failed";
    const manifest = readFileSync(new URL("../fixtures/manifest.json", import.meta.url));
    let binding: ReturnType<typeof target> | undefined;
    try {
      binding = target();
    } catch {
      /* Invalid raw environment values must never enter an evidence artifact. */
    }
    const directory = new URL("../.artifacts/", import.meta.url);
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      new URL("result.json", directory),
      JSON.stringify(
        {
          contractRevision: "r3",
          status,
          planned: this.planned,
          passed,
          failed,
          skipped,
          targetKind: binding?.kind ?? "unknown",
          targetId: binding?.id ?? "unknown",
          targetOrigin: binding?.base ?? "unknown",
          suiteRevision: suiteRevision(),
          manifestSha256: createHash("sha256").update(manifest).digest("hex"),
          tests: this.results,
        },
        null,
        2,
      ) + "\n",
    );
    return { status: status as "passed" | "failed" };
  }
}
