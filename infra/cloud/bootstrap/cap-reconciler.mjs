#!/usr/bin/env node
/**
 * Purpose: create or verify one fixed USD 75/month Cloud Run spend cap for a dedicated application project.
 * Usage: GOOGLE_OAUTH_ACCESS_TOKEN supplied in process environment; node cap-reconciler.mjs --config FILE [--create].
 * Inputs: private noncredential Terraform identity JSON and the adjacent reviewed declarative template.
 * Side effects: default mode reads Budget API; --create permits one POST after complete absence discovery.
 * No patch, delete, cap lifting, limit increase, token persistence, application deployment or automatic retries.
 * Failures: sanitized error codes/nonzero exit; uncertain create outcomes get one read-only discovery pass.
 * Importing this module performs no I/O. Tests inject the request adapter and never contact Google.
 */
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

const API_ORIGIN = "https://billingbudgets.googleapis.com";
const RUN_SERVICE = "services/152E-C115-5142";
const ACCOUNT_PATTERN = /^[A-F0-9]{6}-[A-F0-9]{6}-[A-F0-9]{6}$/;
const BUDGET_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const MAX_PAGES = 20;
const MAX_BODY_BYTES = 1024 * 1024;

export class CapError extends Error {
  constructor(code) {
    super(code);
    this.name = "CapError";
    this.code = code;
  }
}

function requireValue(condition, code) {
  if (!condition) throw new CapError(code);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function onlyKeys(value, allowed, code) {
  requireValue(isObject(value) && Object.keys(value).every((key) => allowed.includes(key)), code);
}

function resourceName(config, value) {
  const prefix = `billingAccounts/${config.billingAccountId}/budgets/`;
  requireValue(typeof value === "string" && value.startsWith(prefix), "RESOURCE_SCOPE_MISMATCH");
  requireValue(BUDGET_ID_PATTERN.test(value.slice(prefix.length)), "INVALID_RESOURCE_NAME");
  return value;
}

/** Reject overrides, arbitrary destinations and malformed identities before any authenticated request. */
export function validateConfig(config) {
  onlyKeys(
    config,
    ["schemaVersion", "billingAccountId", "projectNumber", "quotaProjectId", "currencyCode", "resourceName"],
    "INVALID_CONFIG",
  );
  requireValue(config.schemaVersion === 1, "INVALID_CONFIG_VERSION");
  requireValue(
    typeof config.billingAccountId === "string" && ACCOUNT_PATTERN.test(config.billingAccountId),
    "INVALID_ACCOUNT",
  );
  requireValue(
    typeof config.projectNumber === "string" && /^[1-9][0-9]{0,19}$/.test(config.projectNumber),
    "INVALID_PROJECT_NUMBER",
  );
  requireValue(
    typeof config.quotaProjectId === "string" && /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(config.quotaProjectId),
    "INVALID_QUOTA_PROJECT",
  );
  requireValue(config.currencyCode === "USD", "UNVERIFIED_CURRENCY");
  if (config.resourceName !== undefined) resourceName(config, config.resourceName);
  return structuredClone(config);
}

function approvedTemplate() {
  return {
    displayName: "mp3-cloud-run-monthly-75-cap",
    budgetFilter: {
      projects: ["projects/PROJECT_NUMBER"],
      services: [RUN_SERVICE],
      calendarPeriod: "MONTH",
      creditTypesTreatment: "EXCLUDE_ALL_CREDITS",
    },
    amount: { specifiedAmount: { currencyCode: "USD", units: "75", nanos: 0 } },
    thresholdRules: [0.5, 0.8, 1].map((thresholdPercent) => ({ thresholdPercent, spendBasis: "CURRENT_SPEND" })),
    notificationsRule: { enableProjectLevelRecipients: true },
    ownershipScope: "ALL_USERS",
    spendCap: { inputState: "CONFIGURED" },
  };
}

/** The manifest is declarative but intentionally cannot silently expand this operation's fixed authority. */
export function renderDesiredCap(configInput, template) {
  const config = validateConfig(configInput);
  requireValue(isDeepStrictEqual(template, approvedTemplate()), "UNAPPROVED_TEMPLATE");
  const desired = structuredClone(template);
  desired.budgetFilter.projects = [`projects/${config.projectNumber}`];
  return desired;
}

function empty(value) {
  return (
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0) ||
    (isObject(value) && Object.keys(value).length === 0)
  );
}

/** Normalize only documented API defaults; changed scope, amount or notification behavior fails closed. */
export function inspectCap(config, desired, budget) {
  requireValue(isObject(budget), "INVALID_BUDGET_RESPONSE");
  resourceName(config, budget.name);
  requireValue(config.resourceName === undefined || budget.name === config.resourceName, "RESOURCE_IDENTITY_CHANGED");
  const filter = budget.budgetFilter;
  onlyKeys(
    filter,
    [
      "projects",
      "services",
      "calendarPeriod",
      "creditTypesTreatment",
      "resourceAncestors",
      "creditTypes",
      "subaccounts",
      "labels",
      "customPeriod",
    ],
    "FILTER_DRIFT",
  );
  for (const key of ["resourceAncestors", "creditTypes", "subaccounts", "labels", "customPeriod"]) {
    requireValue(empty(filter[key]), "FILTER_DRIFT");
  }
  for (const key of ["projects", "services", "calendarPeriod", "creditTypesTreatment"]) {
    requireValue(isDeepStrictEqual(filter[key], desired.budgetFilter[key]), "SCOPE_DRIFT");
  }
  onlyKeys(budget.amount, ["specifiedAmount"], "AMOUNT_DRIFT");
  onlyKeys(budget.amount.specifiedAmount, ["currencyCode", "units", "nanos"], "AMOUNT_DRIFT");
  requireValue(
    isDeepStrictEqual({ nanos: 0, ...budget.amount.specifiedAmount }, desired.amount.specifiedAmount),
    "AMOUNT_DRIFT",
  );
  requireValue(Array.isArray(budget.thresholdRules) && budget.thresholdRules.length === 3, "THRESHOLD_DRIFT");
  const thresholds = budget.thresholdRules
    .map((rule) => {
      onlyKeys(rule, ["thresholdPercent", "spendBasis"], "THRESHOLD_DRIFT");
      requireValue([undefined, "BASIS_UNSPECIFIED", "CURRENT_SPEND"].includes(rule.spendBasis), "THRESHOLD_DRIFT");
      return rule.thresholdPercent;
    })
    .sort((left, right) => left - right);
  requireValue(isDeepStrictEqual(thresholds, [0.5, 0.8, 1]), "THRESHOLD_DRIFT");
  const notifications = budget.notificationsRule;
  onlyKeys(
    notifications,
    [
      "enableProjectLevelRecipients",
      "disableDefaultIamRecipients",
      "monitoringNotificationChannels",
      "pubsubTopic",
      "schemaVersion",
    ],
    "NOTIFICATION_DRIFT",
  );
  requireValue(
    notifications.enableProjectLevelRecipients === true &&
      [undefined, false].includes(notifications.disableDefaultIamRecipients),
    "NOTIFICATION_DRIFT",
  );
  for (const key of ["monitoringNotificationChannels", "pubsubTopic", "schemaVersion"]) {
    requireValue(empty(notifications[key]), "NOTIFICATION_DRIFT");
  }
  requireValue(
    [undefined, "ALL_USERS", "OWNERSHIP_SCOPE_UNSPECIFIED"].includes(budget.ownershipScope),
    "OWNERSHIP_DRIFT",
  );
  requireValue(isObject(budget.spendCap), "NOT_A_SPEND_CAP");
  // Google's documented GET/create responses omit inputState: only mutations require it. Always require
  // the observed outputState below; an explicitly lifted/unknown input still invalidates protection.
  requireValue([undefined, "CONFIGURED"].includes(budget.spendCap.inputState), "CAP_LIFTED_OR_UNKNOWN");
  requireValue([undefined, false].includes(budget.spendCap.reconciling), "CAP_RECONCILING");
  requireValue(budget.spendCap.outputState !== "ENFORCED", "CAP_ENFORCED");
  requireValue(budget.spendCap.outputState === "CONFIGURED", "CAP_LIFTED_OR_UNKNOWN");
  return { status: "ready", resourceName: budget.name };
}

function collectionPath(config) {
  return `/v1/billingAccounts/${config.billingAccountId}/budgets`;
}

async function checkedRequest(request, options) {
  let response;
  try {
    response = await request(options);
  } catch (error) {
    throw error instanceof CapError ? error : new CapError("REQUEST_FAILED");
  }
  requireValue(isObject(response) && Number.isInteger(response.status), "INVALID_HTTP_RESPONSE");
  if (response.status < 200 || response.status > 299) throw new CapError(`HTTP_${response.status}`);
  return response.data;
}

/** List every bounded page before concluding absence; incomplete or ambiguous inventory can never authorize creation. */
async function discover(config, request) {
  const candidates = [];
  const seenTokens = new Set();
  const seenNames = new Set();
  let pageToken = "";
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const query = new URLSearchParams({ pageSize: "100" });
    if (pageToken) query.set("pageToken", pageToken);
    const data = await checkedRequest(request, { method: "GET", path: `${collectionPath(config)}?${query}` });
    requireValue(
      isObject(data) && (data.budgets === undefined || Array.isArray(data.budgets)),
      "INVALID_LIST_RESPONSE",
    );
    for (const budget of data.budgets ?? []) {
      requireValue(isObject(budget) && typeof budget.name === "string", "INVALID_LIST_RESPONSE");
      requireValue(!seenNames.has(budget.name), "DUPLICATE_LIST_ENTRY");
      seenNames.add(budget.name);
      // All-service alert budgets are intentionally separate. Matching or overlapping service-scoped objects
      // require inspection even if their cap field is missing: never silently convert an alerts-only object.
      const filter = budget.budgetFilter;
      const projects = filter?.projects;
      const services = filter?.services;
      requireValue(
        !budget.spendCap ||
          (Array.isArray(projects) && projects.length === 1 && Array.isArray(services) && services.length === 1),
        "INVALID_CAP_INVENTORY",
      );
      if (
        Array.isArray(projects) &&
        Array.isArray(services) &&
        projects.includes(`projects/${config.projectNumber}`) &&
        services.includes(RUN_SERVICE)
      )
        candidates.push(budget);
    }
    const next = data.nextPageToken;
    requireValue(next === undefined || typeof next === "string", "INVALID_PAGE_TOKEN");
    if (!next) {
      requireValue(candidates.length <= 1, "AMBIGUOUS_CAP_SCOPE");
      return candidates[0] ?? null;
    }
    requireValue(next.length <= 8192 && !seenTokens.has(next), "INVALID_PAGE_TOKEN");
    seenTokens.add(next);
    pageToken = next;
  }
  throw new CapError("INCOMPLETE_CAP_INVENTORY");
}

/** Create only during explicit initial bootstrap. A recorded resource disappearing is an incident, never absence. */
export async function reconcileCap({ config: input, template, request, allowCreate = false }) {
  const config = validateConfig(input);
  const desired = renderDesiredCap(config, template);
  requireValue(typeof request === "function" && typeof allowCreate === "boolean", "INVALID_ADAPTER");
  if (config.resourceName !== undefined) {
    const budget = await checkedRequest(request, { method: "GET", path: `/v1/${config.resourceName}` });
    return inspectCap(config, desired, budget);
  }
  const found = await discover(config, request);
  if (found) return inspectCap(config, desired, found);
  if (!allowCreate) return { status: "missing", action: "explicit-initial-create-required" };

  // Exactly one POST is permitted. On transport/server ambiguity, discover once without mutation.
  // If the object is not visible, an operator must resolve the outcome before another create invocation.
  let created;
  try {
    created = await checkedRequest(request, { method: "POST", path: collectionPath(config), body: desired });
  } catch (error) {
    const uncertain = [
      "REQUEST_FAILED",
      "INVALID_HTTP_RESPONSE",
      "INVALID_JSON_RESPONSE",
      "RESPONSE_TOO_LARGE",
      "HTTP_409",
      "HTTP_429",
      "HTTP_500",
      "HTTP_502",
      "HTTP_503",
      "HTTP_504",
    ].includes(error.code);
    if (!uncertain) throw error;
    const recovered = await discover(config, request);
    if (recovered) return { ...inspectCap(config, desired, recovered), action: "adopted-after-uncertain-create" };
    throw new CapError("CREATE_OUTCOME_UNRESOLVED_DO_NOT_RETRY_CREATE");
  }
  requireValue(isObject(created), "INVALID_CREATE_RESPONSE_DO_NOT_RETRY_CREATE");
  resourceName(config, created.name);
  const observed = await checkedRequest(request, { method: "GET", path: `/v1/${created.name}` });
  requireValue(observed?.name === created.name, "RESOURCE_IDENTITY_CHANGED");
  return { ...inspectCap(config, desired, observed), action: "created-and-verified" };
}

/** Fixed-origin, bounded HTTP adapter. It has no credential storage and never exposes HTTP bodies on failure. */
export function createGoogleRequest({ config: input, getAccessToken, fetchImpl = globalThis.fetch }) {
  const config = validateConfig(input);
  requireValue(typeof getAccessToken === "function" && typeof fetchImpl === "function", "INVALID_ADAPTER");
  const collection = collectionPath(config);
  return async ({ method, path, body }) => {
    requireValue(typeof path === "string" && path.startsWith(collection), "UNSAFE_REQUEST_PATH");
    const url = new URL(path, API_ORIGIN);
    requireValue(url.origin === API_ORIGIN && !url.hash && !url.username && !url.password, "UNSAFE_REQUEST_PATH");
    const isCollection = url.pathname === collection;
    const isItem =
      url.pathname.startsWith(`${collection}/`) && BUDGET_ID_PATTERN.test(url.pathname.slice(collection.length + 1));
    requireValue(
      (method === "GET" && (isCollection || isItem)) || (method === "POST" && isCollection),
      "UNSAFE_REQUEST_METHOD",
    );
    requireValue(
      [...url.searchParams.keys()].every((key) => ["pageSize", "pageToken"].includes(key)) &&
        (isCollection || !url.search),
      "UNSAFE_REQUEST_QUERY",
    );
    requireValue(method === "GET" ? body === undefined : !url.search && isObject(body), "UNSAFE_REQUEST_BODY");
    if (method === "POST") {
      requireValue(isDeepStrictEqual(body, renderDesiredCap(config, approvedTemplate())), "UNAPPROVED_CREATE_BODY");
    }
    let accessToken;
    try {
      accessToken = await getAccessToken();
    } catch {
      throw new CapError("CREDENTIAL_UNAVAILABLE");
    }
    requireValue(
      typeof accessToken === "string" && accessToken.length <= 8192 && /^[A-Za-z0-9._~+/-]+=*$/.test(accessToken),
      "INVALID_CREDENTIAL",
    );
    let response;
    try {
      response = await fetchImpl(url, {
        method,
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-goog-user-project": config.quotaProjectId,
          "Content-Type": "application/json",
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      accessToken = undefined;
      requireValue(Number.isInteger(response.status), "INVALID_HTTP_RESPONSE");
      if (response.status < 200 || response.status > 299) {
        await response.body?.cancel();
        return { status: response.status, data: null };
      }
      const chunks = [];
      let bytes = 0;
      if (response.body) {
        for await (const chunk of response.body) {
          bytes += chunk.byteLength;
          requireValue(bytes <= MAX_BODY_BYTES, "RESPONSE_TOO_LARGE");
          chunks.push(Buffer.from(chunk));
        }
      }
      let data;
      try {
        data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {
        throw new CapError("INVALID_JSON_RESPONSE");
      }
      return { status: response.status, data };
    } catch (error) {
      throw error instanceof CapError ? error : new CapError("REQUEST_FAILED");
    } finally {
      accessToken = undefined;
    }
  };
}

/** CLI defaults to read-only; its output contains resource identity but never credentials or response bodies. */
async function main(args) {
  requireValue(
    (args.length === 2 || args.length === 3) &&
      args[0] === "--config" &&
      args[1] &&
      (args.length === 2 || args[2] === "--create"),
    "USAGE_CONFIG_FILE_OPTIONAL_CREATE",
  );
  let config;
  let template;
  try {
    config = JSON.parse(await readFile(args[1], "utf8"));
    template = JSON.parse(await readFile(new URL("./cloud-run-cap.template.json", import.meta.url), "utf8"));
  } catch {
    throw new CapError("INVALID_INPUT_FILE");
  }
  const request = createGoogleRequest({ config, getAccessToken: () => process.env.GOOGLE_OAUTH_ACCESS_TOKEN });
  const result = await reconcileCap({ config, template, request, allowCreate: args[2] === "--create" });
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (result.status !== "ready") process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error instanceof CapError ? error.code : "UNEXPECTED_FAILURE"}\n`);
    process.exitCode = 1;
  });
}
