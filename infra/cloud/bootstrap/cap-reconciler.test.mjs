/**
 * Purpose: verify cost-control refusal and recovery decisions without credentials, cloud state or dependencies.
 * Usage: node --test cap-reconciler.test.mjs. Inputs are synthetic identities and scripted request adapters.
 * Side effects: reads the adjacent template only; no real network, environment secrets or filesystem writes.
 * Failure behavior: node:test reports a nonzero status for an unexpected decision or unauthorized request.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CapError,
  createGoogleRequest,
  inspectCap,
  reconcileCap,
  renderDesiredCap,
  validateConfig,
} from "./cap-reconciler.mjs";

const template = JSON.parse(await readFile(new URL("./cloud-run-cap.template.json", import.meta.url), "utf8"));
const config = {
  schemaVersion: 1,
  billingAccountId: "AAAAAA-BBBBBB-CCCCCC",
  projectNumber: "123456789012",
  quotaProjectId: "synthetic-cost-test",
  currencyCode: "USD",
};
const collection = "/v1/billingAccounts/AAAAAA-BBBBBB-CCCCCC/budgets";
const name = "billingAccounts/AAAAAA-BBBBBB-CCCCCC/budgets/synthetic-cap";
const desired = renderDesiredCap(config, template);

function budget() {
  return {
    ...structuredClone(desired),
    name,
    etag: "synthetic-etag",
    spendCap: { inputState: "CONFIGURED", outputState: "CONFIGURED", reconciling: false },
  };
}

function fake(steps) {
  const calls = [];
  const request = async (options) => {
    calls.push(structuredClone(options));
    const step = steps.shift();
    assert.ok(step, "unexpected request");
    assert.equal(options.method, step.method);
    if (step.path) assert.equal(options.path, step.path);
    if (step.throw) throw new Error(step.throw);
    return { status: step.status ?? 200, data: step.data };
  };
  return { request, calls, done: () => assert.equal(steps.length, 0) };
}

const failWith = (code) => (error) => error instanceof CapError && error.code === code;

test("fixed cap template renders one project with the shared $75 Run amount", () => {
  assert.equal(desired.amount.specifiedAmount.units, "75");
  assert.deepEqual(desired.budgetFilter.projects, ["projects/123456789012"]);
  assert.deepEqual(desired.budgetFilter.services, ["services/152E-C115-5142"]);
  assert.equal(template.budgetFilter.projects[0], "projects/PROJECT_NUMBER");
});

test("config and template cannot select a different limit, origin, currency or unsafe identity", () => {
  for (const replacement of [
    { apiOrigin: "https://invalid.example" },
    { amount: 100 },
    { currencyCode: "EUR" },
    { billingAccountId: "../other" },
    { projectNumber: "1/../../other" },
    { quotaProjectId: "bad\r\nheader" },
  ]) {
    assert.throws(() => validateConfig({ ...config, ...replacement }), CapError);
  }
  for (const units of ["100", "50"]) {
    const altered = structuredClone(template);
    altered.amount.specifiedAmount.units = units;
    assert.throws(() => renderDesiredCap(config, altered), failWith("UNAPPROVED_TEMPLATE"));
  }
});

test("default check reports missing after full inventory and never creates", async () => {
  const transport = fake([{ method: "GET", data: { budgets: [] } }]);
  assert.equal((await reconcileCap({ config, template, request: transport.request })).status, "missing");
  assert.equal(transport.calls.length, 1);
  transport.done();
});

test("initial creation issues one exact POST and independently reads back protection", async () => {
  const transport = fake([
    { method: "GET", data: {} },
    { method: "POST", path: collection, data: { name } },
    { method: "GET", path: `/v1/${name}`, data: budget() },
  ]);
  const result = await reconcileCap({ config, template, request: transport.request, allowCreate: true });
  assert.deepEqual(result, { status: "ready", resourceName: name, action: "created-and-verified" });
  assert.deepEqual(transport.calls[1].body, desired);
  transport.done();
});

test("existing ready cap is adopted without mutation, independently of its display name", async () => {
  const item = budget();
  item.displayName = "operator-friendly label";
  const transport = fake([{ method: "GET", data: { budgets: [item] } }]);
  assert.equal(
    (await reconcileCap({ config, template, request: transport.request, allowCreate: true })).status,
    "ready",
  );
  transport.done();
});

test("recorded identity gets exact GET, and cannot be silently replaced", async () => {
  const recorded = { ...config, resourceName: name };
  const transport = fake([{ method: "GET", path: `/v1/${name}`, data: budget() }]);
  assert.equal((await reconcileCap({ config: recorded, template, request: transport.request })).resourceName, name);
  transport.done();
  const deleted = fake([{ method: "GET", status: 404 }]);
  await assert.rejects(
    reconcileCap({ config: recorded, template, request: deleted.request, allowCreate: true }),
    failWith("HTTP_404"),
  );
  deleted.done();
  const wrong = budget();
  wrong.name = `${name}-replacement`;
  assert.throws(() => inspectCap(recorded, desired, wrong), failWith("RESOURCE_IDENTITY_CHANGED"));
});

test("scope discovery includes all pages and tolerates unrelated alerts", async () => {
  const alert = { name: `${name}-alert`, budgetFilter: { projects: desired.budgetFilter.projects } };
  const transport = fake([
    { method: "GET", data: { budgets: [alert], nextPageToken: "opaque+/=token" } },
    { method: "GET", path: `${collection}?pageSize=100&pageToken=opaque%2B%2F%3Dtoken`, data: { budgets: [budget()] } },
  ]);
  assert.equal((await reconcileCap({ config, template, request: transport.request })).status, "ready");
  transport.done();
});

test("duplicate scope and incomplete inventory never authorize creation", async () => {
  const second = budget();
  second.name = `${name}-second`;
  const duplicate = fake([{ method: "GET", data: { budgets: [budget(), second] } }]);
  await assert.rejects(
    reconcileCap({ config, template, request: duplicate.request, allowCreate: true }),
    failWith("AMBIGUOUS_CAP_SCOPE"),
  );
  duplicate.done();
  const cycle = fake([
    { method: "GET", data: { nextPageToken: "cycle" } },
    { method: "GET", data: { nextPageToken: "cycle" } },
  ]);
  await assert.rejects(
    reconcileCap({ config, template, request: cycle.request, allowCreate: true }),
    failWith("INVALID_PAGE_TOKEN"),
  );
  cycle.done();
  const tooMany = fake(
    Array.from({ length: 20 }, (_, index) => ({ method: "GET", data: { nextPageToken: `page-${index}` } })),
  );
  await assert.rejects(
    reconcileCap({ config, template, request: tooMany.request, allowCreate: true }),
    failWith("INCOMPLETE_CAP_INVENTORY"),
  );
  tooMany.done();
});

test("permission, transport and malformed discovery errors are never absence", async () => {
  for (const step of [{ status: 403 }, { throw: "sensitive response payload" }, { data: { budgets: "not-list" } }]) {
    const transport = fake([{ method: "GET", ...step }]);
    await assert.rejects(
      reconcileCap({ config, template, request: transport.request, allowCreate: true }),
      (error) => error instanceof CapError && !error.message.includes("sensitive"),
    );
    transport.done();
  }
});

test("configured amount drift cannot automatically increase or lower existing limits", async () => {
  for (const units of ["50", "100"]) {
    const item = budget();
    item.amount.specifiedAmount.units = units;
    const transport = fake([{ method: "GET", data: { budgets: [item] } }]);
    await assert.rejects(
      reconcileCap({ config, template, request: transport.request, allowCreate: true }),
      failWith("AMOUNT_DRIFT"),
    );
    transport.done();
  }
});

test("enforced, lifted, missing and reconciling state block ready status", () => {
  for (const [spendCap, code] of [
    [{ inputState: "CONFIGURED", outputState: "ENFORCED" }, "CAP_ENFORCED"],
    [{ inputState: "AWAITING_NEXT_PERIOD", outputState: "AWAITING_NEXT_PERIOD" }, "CAP_LIFTED_OR_UNKNOWN"],
    [{ inputState: "CONFIGURED", outputState: "CONFIGURED", reconciling: true }, "CAP_RECONCILING"],
    [{ inputState: "CONFIGURED" }, "CAP_LIFTED_OR_UNKNOWN"],
    [undefined, "NOT_A_SPEND_CAP"],
  ]) {
    assert.throws(() => inspectCap(config, desired, { ...budget(), spendCap }), failWith(code));
  }
});

test("scope, credits, thresholds, notifications and ownership cannot weaken protection", () => {
  const changes = [
    (item) => item.budgetFilter.projects.push("projects/987654321098"),
    (item) => {
      item.budgetFilter.creditTypesTreatment = "INCLUDE_ALL_CREDITS";
    },
    (item) => {
      item.budgetFilter.calendarPeriod = "YEAR";
    },
    (item) => {
      item.budgetFilter.labels = { environment: "stage" };
    },
    (item) => {
      item.amount.specifiedAmount.nanos = 1;
    },
    (item) => {
      item.thresholdRules[0].spendBasis = "FORECASTED_SPEND";
    },
    (item) => {
      item.notificationsRule.disableDefaultIamRecipients = true;
    },
    (item) => {
      item.notificationsRule.enableProjectLevelRecipients = false;
    },
    (item) => {
      item.ownershipScope = "BILLING_ACCOUNT";
    },
  ];
  for (const change of changes) {
    const item = budget();
    change(item);
    assert.throws(() => inspectCap(config, desired, item), CapError);
  }
});

test("documented omitted defaults and unordered thresholds remain acceptable", () => {
  const item = budget();
  delete item.amount.specifiedAmount.nanos;
  delete item.spendCap.reconciling;
  delete item.ownershipScope;
  item.notificationsRule.disableDefaultIamRecipients = false;
  item.notificationsRule.monitoringNotificationChannels = [];
  item.budgetFilter.labels = {};
  item.thresholdRules.reverse();
  delete item.thresholdRules[0].spendBasis;
  assert.equal(inspectCap(config, desired, item).status, "ready");
});

test("documented GET response omits inputState but requires observed CONFIGURED output", () => {
  const item = budget();
  item.spendCap = { outputState: "CONFIGURED" };
  assert.equal(inspectCap(config, desired, item).status, "ready");
  for (const outputState of ["ENFORCED", "AWAITING_NEXT_PERIOD", "STATE_UNSPECIFIED", undefined]) {
    item.spendCap = { outputState };
    assert.throws(() => inspectCap(config, desired, item), CapError);
  }
  for (const inputState of ["AWAITING_NEXT_PERIOD", "STATE_UNSPECIFIED", null]) {
    item.spendCap = { outputState: "CONFIGURED", inputState };
    assert.throws(() => inspectCap(config, desired, item), failWith("CAP_LIFTED_OR_UNKNOWN"));
  }
});

test("unknown create outcome adopts unique observed cap without a second POST", async () => {
  const transport = fake([
    { method: "GET", data: {} },
    { method: "POST", throw: "connection lost after possible create" },
    { method: "GET", data: { budgets: [budget()] } },
  ]);
  const result = await reconcileCap({ config, template, request: transport.request, allowCreate: true });
  assert.equal(result.action, "adopted-after-uncertain-create");
  assert.equal(transport.calls.filter((call) => call.method === "POST").length, 1);
  transport.done();
});

test("unresolved create stays blocked, while rejected create stops immediately", async () => {
  const transport = fake([
    { method: "GET", data: {} },
    { method: "POST", status: 503 },
    { method: "GET", data: {} },
  ]);
  await assert.rejects(
    reconcileCap({ config, template, request: transport.request, allowCreate: true }),
    failWith("CREATE_OUTCOME_UNRESOLVED_DO_NOT_RETRY_CREATE"),
  );
  transport.done();
  const denied = fake([
    { method: "GET", data: {} },
    { method: "POST", status: 403 },
  ]);
  await assert.rejects(
    reconcileCap({ config, template, request: denied.request, allowCreate: true }),
    failWith("HTTP_403"),
  );
  denied.done();
});

test("successful create response alone cannot claim convergence", async () => {
  const item = budget();
  item.spendCap.reconciling = true;
  const transport = fake([
    { method: "GET", data: {} },
    { method: "POST", data: { name } },
    { method: "GET", data: item },
  ]);
  await assert.rejects(
    reconcileCap({ config, template, request: transport.request, allowCreate: true }),
    failWith("CAP_RECONCILING"),
  );
  transport.done();
});

test("HTTP adapter uses only Google origin, fixed quota header, timeout and redirect refusal", async () => {
  const calls = [];
  const request = createGoogleRequest({
    config,
    getAccessToken: () => "synthetic-token",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return new Response(JSON.stringify({ budgets: [] }));
    },
  });
  assert.deepEqual(await request({ method: "GET", path: `${collection}?pageSize=100` }), {
    status: 200,
    data: { budgets: [] },
  });
  assert.equal(calls[0].url.origin, "https://billingbudgets.googleapis.com");
  assert.equal(calls[0].options.redirect, "error");
  assert.ok(calls[0].options.signal instanceof AbortSignal);
  assert.equal(calls[0].options.headers["x-goog-user-project"], config.quotaProjectId);
  assert.equal(calls[0].options.headers.Authorization, "Bearer synthetic-token");
});

test("HTTP adapter rejects arbitrary destination, mutation, query, limit and lift before credentials", async () => {
  let credentialReads = 0;
  const request = createGoogleRequest({
    config,
    getAccessToken: () => {
      credentialReads += 1;
      return "synthetic-token";
    },
    fetchImpl: () => assert.fail("network attempted"),
  });
  const lifted = structuredClone(desired);
  lifted.spendCap.inputState = "AWAITING_NEXT_PERIOD";
  const raised = structuredClone(desired);
  raised.amount.specifiedAmount.units = "100";
  for (const options of [
    { method: "GET", path: "https://invalid.example" },
    { method: "GET", path: `${collection}/../../other` },
    { method: "DELETE", path: `${collection}/synthetic-cap` },
    { method: "PATCH", path: `${collection}/synthetic-cap`, body: lifted },
    { method: "GET", path: `${collection}?destination=invalid` },
    { method: "POST", path: collection, body: lifted },
    { method: "POST", path: collection, body: raised },
  ])
    await assert.rejects(request(options), CapError);
  assert.equal(credentialReads, 0);
});

test("HTTP failures never reveal token, thrown details or response body", async () => {
  const request = createGoogleRequest({
    config,
    getAccessToken: () => "synthetic-secret",
    fetchImpl: () => {
      throw new Error("synthetic-secret backend details");
    },
  });
  await assert.rejects(request({ method: "GET", path: collection }), failWith("REQUEST_FAILED"));
  const denied = createGoogleRequest({
    config,
    getAccessToken: () => "synthetic-secret",
    fetchImpl: async () => new Response("synthetic-secret", { status: 403 }),
  });
  assert.deepEqual(await denied({ method: "GET", path: collection }), { status: 403, data: null });
});

test("HTTP response body size and malformed JSON fail closed", async () => {
  for (const [body, code] of [
    ["x".repeat(1024 * 1024 + 1), "RESPONSE_TOO_LARGE"],
    ["not-json", "INVALID_JSON_RESPONSE"],
  ]) {
    const request = createGoogleRequest({
      config,
      getAccessToken: () => "synthetic-token",
      fetchImpl: async () => new Response(body),
    });
    await assert.rejects(request({ method: "GET", path: collection }), failWith(code));
  }
});
