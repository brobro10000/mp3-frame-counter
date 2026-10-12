/** Independent actual Redoc sample selection predicates shared by public and owned fixture observations. */
import assert from "node:assert/strict";

/** Select named examples in the rendered sample panel and compare its actual visible JSON with independent values. */
export async function checkBackendRedocExamples(page, spec) {
  const operation = page.locator('[data-section-id="operation/countFrames"]');
  /** Locate one selected response panel, never a matching description elsewhere in the document. */
  async function panel(status) {
    await operation.getByRole("tab", { name: status, exact: true }).click();
    return operation.getByRole("tabpanel", { name: status, exact: true });
  }
  /** Read the sample's rendered JSON, excluding its content selector and copy controls; invalid JSON fails. */
  async function select(status, example, multiple) {
    const output = await panel(status);
    if (multiple) await output.locator('select[aria-label="Example"]').selectOption({ label: example.summary });
    const lastKey = Object.hasOwn(example.value, "analysis")
      ? '"analysis"'
      : Object.hasOwn(example.value, "code")
        ? '"code"'
        : '"frameCount"';
    await output.getByText(lastKey, { exact: true }).waitFor({ state: "visible", timeout: 3000 });
    const expand = output.getByRole("button", { name: "Expand all", exact: true });
    if (await expand.count()) await expand.click();
    const text = await output.innerText();
    const start = text.indexOf("{"),
      end = text.lastIndexOf("}") + 1;
    assert.ok(start >= 0 && end > start, "RENDERED_EXAMPLE");
    assert.deepEqual(JSON.parse(text.slice(start, end)), example.value, "RENDERED_EXAMPLE");
  }
  const upload = spec.paths["/file-upload"].post;
  const success = Object.values(upload.responses["200"].content["application/json"].examples);
  const plain = success.find((example) => !Object.hasOwn(example.value, "analysis"));
  const detail = success.find((example) => Object.hasOwn(example.value, "analysis"));
  assert.ok(plain && detail, "RENDERED_ALTERNATIVES");
  await select("200", plain, true);
  await select("200", detail, true);
  for (const status of ["400", "413", "415", "502", "504"]) {
    const examples = Object.values(upload.responses[status].content["application/json"].examples);
    assert.ok(examples.length > 0, "RENDERED_ERRORS");
    for (const example of examples) await select(status, example, examples.length > 1);
  }
}
