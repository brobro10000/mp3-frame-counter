/**
 * Report exact discovery separately from full execution. Only a complete passed inventory with valid target binding
 * can write a passed result.json. Writes sanitized package-local JSON; no secret, upload or private path is recorded.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import type { FullResult, Reporter, Suite, TestCase, TestResult } from "@playwright/test/reporter";
import type { Execution } from "../lib/inventory.ts";
import { buildReport } from "../lib/report.ts";

export default class AcceptanceReporter implements Reporter {
  private planned: { file: string; title: string }[] = [];
  private results: Execution[] = [];
  onBegin(_config: unknown, suite: Suite) {
    this.planned = suite.allTests().map((test) => ({ file: basename(test.location.file), title: test.title }));
  }
  onTestEnd(test: TestCase, result: TestResult) {
    this.results.push({
      file: basename(test.location.file),
      title: test.title,
      status: result.status,
      expectedStatus: test.expectedStatus,
      retry: result.retry,
      retries: test.retries,
    });
  }
  async onEnd(result: FullResult) {
    const discovery = process.argv.includes("--list");
    const report = buildReport(result.status, discovery, this.planned, this.results);
    if (report.status !== "passed") console.error("Acceptance inventory, execution or target validation failed");
    const directory = new URL("../.artifacts/", import.meta.url);
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      new URL(discovery ? "discovery.json" : "result.json", directory),
      JSON.stringify(report, null, 2) + "\n",
    );
    return { status: report.status };
  }
}
