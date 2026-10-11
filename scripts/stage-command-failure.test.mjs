/**
 * Independent privacy-safe Terraform failure-record expectations, authored before the diagnostic implementation.
 * Run: node --test scripts/stage-command-failure.test.mjs with pinned Node. Pure literal controls only: no subprocess,
 * network, provider, permission grant, source/controller mutation or acceptance claim. A missing export is explicit red.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const moduleUrl = new URL("./stage-command-failure.mjs", import.meta.url);
const api = existsSync(moduleUrl) ? await import(moduleUrl.href) : {};
const commands = ["terraform-init", "terraform-plan", "terraform-show", "terraform-apply"];
const resource = "projects/synthetic-private-project/locations/us-central1/operations/synthetic-private-operation";
const denial = `googleapi: Error 403: Permission 'run.operations.get' denied on resource '${resource}' (or it may not exist).`;

/** Require real availability before testing refusals; a missing implementation never satisfies a negative control. */
function subject() {
  assert.equal(typeof api.stageCommandFailure, "function", "Missing stageCommandFailure diagnostic export");
  return api.stageCommandFailure;
}

test("four fixed operations and bounded exit records expose exactly the closed detached fields", () => {
  const classify = subject();
  for (const operation of commands)
    for (const exitCode of [null, 0, 1, 2, 126, 127, 137, 255]) {
      const first = classify(operation, exitCode, "Unrelated diagnostic text");
      assert.deepEqual(first, { operation, exitCode, permission: null });
      assert.deepEqual(Reflect.ownKeys(first).sort(), ["exitCode", "operation", "permission"]);
      assert.equal(Object.getPrototypeOf(first), Object.prototype);
      assert.notEqual(classify(operation, exitCode, "Unrelated diagnostic text"), first);
    }
});

test("nonzero exits classify only the literal permission explicitly denied in normal provider errors", () => {
  const classify = subject();
  const messages = [
    denial,
    denial.replaceAll("'", '"'),
    `Error: Error waiting for Updating Service: Error code 7, message: Permission 'run.operations.get' denied on resource '${resource}' (or it may not exist).`,
    `╷\n│ Error: Error waiting for Updating Service: Error code 7, message: Permission "run.operations.get" denied on resource "${resource}" (or it may not exist).\n│\n╵`,
  ];
  for (const operation of commands)
    for (const stderr of messages)
      assert.deepEqual(classify(operation, 1, stderr), { operation, exitCode: 1, permission: "run.operations.get" });
});

test("success or signal-only exit records cannot establish permission denial from stderr", () => {
  const classify = subject();
  for (const operation of commands)
    for (const exitCode of [0, null])
      assert.deepEqual(classify(operation, exitCode, denial), { operation, exitCode, permission: null });
});

test("the exact provider polling wrapper classifies read denial only for nonzero exits", () => {
  const classify = subject();
  const wrapped = `Error: Error waiting for Updating Service: error while retrieving operation: ${denial}`;
  const messages = [wrapped, wrapped.replaceAll("'", '"'), `╷\n│ ${wrapped}\n│\n╵`];
  for (const operation of commands)
    for (const stderr of messages) {
      assert.deepEqual(classify(operation, 1, stderr), { operation, exitCode: 1, permission: "run.operations.get" });
      for (const exitCode of [0, null])
        assert.deepEqual(classify(operation, exitCode, stderr), { operation, exitCode, permission: null });
    }
});

test("the polling wrapper cannot turn other errors echoes or split text into read-denial evidence", () => {
  const classify = subject();
  assert.equal(classify("terraform-apply", 1, denial).permission, "run.operations.get");
  const wrapped = `Error: Error waiting for Updating Service: error while retrieving operation: ${denial}`;
  const messages = [
    ...["run.services.update", "run.operations.list", "run.operations.getIamPolicy", "RUN.OPERATIONS.GET"].map(
      (permission) => wrapped.replace("run.operations.get", permission),
    ),
    wrapped.replace(" denied ", " granted "),
    wrapped.replace("Error 403", "Error 401"),
    wrapped.replace("Error 403", "Error 404"),
    wrapped.replace("Updating Service", "Creating Service"),
    wrapped.replace("error while retrieving operation: ", ""),
    wrapped.replace("error while retrieving operation", "error while retrieving revision"),
    wrapped.replace("error while retrieving operation", "Error while retrieving operation"),
    wrapped.replace("googleapi: Error", "googleapi:\nError"),
    wrapped.replace("'run.operations.get' denied", "'run.operations.get'\ndenied"),
    wrapped.replace("'run.operations.get'", "'run.operations.get\""),
    `${wrapped} Additional diagnostic text.`,
    `"${wrapped}"`,
    `echo "${wrapped}"`,
    JSON.stringify({ printed: wrapped }),
    "Error: Error waiting for Updating Service: error while retrieving operation: https://synthetic.invalid/run.operations.get?status=denied",
    "Error: Error waiting for Updating Service: error while retrieving operation: Authorization: Bearer synthetic.run.operations.get.denied.token",
    "Error: Error waiting for Updating Service: error while retrieving operation: projects/synthetic-private-project/operations/run.operations.get-denied",
  ];
  for (const stderr of messages)
    assert.deepEqual(classify("terraform-apply", 1, stderr), {
      operation: "terraform-apply",
      exitCode: 1,
      permission: null,
    });
});

test("the exact resource-may-not-exist qualifier preserves the closed provider-denial record", () => {
  const classify = subject();
  const currentDenial = denial.replace("(or it may not exist).", "(or resource may not exist).");
  const wrapped = `Error: Error waiting for Updating Service: error while retrieving operation: ${currentDenial}`;
  const code7 = `Error: Error waiting for Updating Service: Error code 7, message: ${currentDenial.slice("googleapi: Error 403: ".length)}`;
  const messages = [currentDenial, wrapped, code7, wrapped.replaceAll("'", '"'), `╷\n│ ${wrapped}\n│\n╵`];
  for (const operation of commands)
    for (const stderr of messages) {
      for (const exitCode of [1, 255])
        assert.deepEqual(classify(operation, exitCode, stderr), {
          operation,
          exitCode,
          permission: "run.operations.get",
        });
      for (const exitCode of [0, null])
        assert.deepEqual(classify(operation, exitCode, stderr), { operation, exitCode, permission: null });
      const rendered = JSON.stringify(classify(operation, 1, stderr));
      assert.ok(!rendered.includes(resource));
      assert.ok(!rendered.includes(stderr));
    }
});

test("the resource qualifier extension rejects near misses other permissions echoes and split text", () => {
  const classify = subject();
  assert.equal(classify("terraform-apply", 1, denial).permission, "run.operations.get");
  const currentDenial = denial.replace("(or it may not exist).", "(or resource may not exist).");
  const wrapped = `Error: Error waiting for Updating Service: error while retrieving operation: ${currentDenial}`;
  const messages = [
    ...[
      "or the resource may not exist",
      "or resource might not exist",
      "or resource may exist",
      "or resource does not exist",
    ].map((qualifier) => wrapped.replace("or resource may not exist", qualifier)),
    ...["run.operations.list", "run.services.update", "run.operations.getIamPolicy", "RUN.OPERATIONS.GET"].map(
      (permission) => wrapped.replace("run.operations.get", permission),
    ),
    wrapped.replace(" denied ", " granted "),
    wrapped.replace("Error 403", "Error 401"),
    wrapped.replace("error while retrieving operation", "error while retrieving revision"),
    wrapped.replace("'run.operations.get' denied", "'run.operations.get'\ndenied"),
    wrapped.replace("or resource may not exist", "or resource may\nnot exist"),
    wrapped.replace(`'${resource}'`, "''"),
    wrapped.slice(0, -1),
    `${wrapped} Additional diagnostic text.`,
    `echo "${wrapped}"`,
    `"${wrapped}"`,
    JSON.stringify({ printed: wrapped }),
  ];
  for (const stderr of messages)
    assert.deepEqual(classify("terraform-apply", 1, stderr), {
      operation: "terraform-apply",
      exitCode: 1,
      permission: null,
    });
});

test("unrelated grants other permissions quoted echoes and split messages do not prove read denial", () => {
  const classify = subject();
  const messages = [
    "",
    " \n\t",
    "Permission 'run.operations.get' granted.",
    "Permission 'run.operations.get' allowed.",
    "run.operations.get is required, but the request was denied for another reason.",
    denial.replace("run.operations.get", "run.services.update"),
    denial.replace("run.operations.get", "run.operations.list"),
    denial.replace("run.operations.get", "run.operations.getIamPolicy"),
    denial.replace("run.operations.get", "RUN.OPERATIONS.GET"),
    `Permission 'run.operations.get' granted.\n${denial.replace("run.operations.get", "run.services.update")}`,
    "Permission 'run.operations.get'\nPermission 'run.services.update' denied.",
    `echo "${denial}"`,
    `"${denial}"`,
    JSON.stringify({ printed: denial }),
    "Error: an unrelated tool echoed \"Permission 'run.operations.get' denied\".",
    `https://synthetic.invalid/error?permission=run.operations.get&status=denied`,
    "Authorization: Bearer synthetic.run.operations.get.denied.token",
    "projects/synthetic-private-project/operations/run.operations.get-denied",
  ];
  for (const stderr of messages)
    assert.deepEqual(
      classify("terraform-apply", 1, stderr),
      {
        operation: "terraform-apply",
        exitCode: 1,
        permission: null,
      },
      stderr,
    );
});

test("records never contain provider text tokens URLs project IDs operation IDs or credentials", () => {
  const classify = subject();
  const sensitive = [
    "synthetic-private-project",
    "synthetic-private-operation",
    "synthetic-token-canary-123456789",
    "https://synthetic-private.invalid/sensitive/path",
    "synthetic-account@synthetic-private-project.invalid",
  ];
  for (const stderr of [sensitive.join(" "), `${denial}\n${sensitive.join(" ")}`]) {
    const result = classify("terraform-apply", 1, stderr);
    assert.deepEqual(Object.keys(result).sort(), ["exitCode", "operation", "permission"]);
    const json = JSON.stringify(result);
    for (const value of sensitive)
      assert.ok(!json.includes(value), "Diagnostic JSON leaked a synthetic sensitive value");
    assert.ok(!json.includes(resource));
    assert.ok(!json.includes(stderr));
  }
});

test("unrecognized operations and non-string operation values fail closed without coercion", () => {
  const classify = subject();
  for (const operation of [
    "terraform",
    "init",
    "terraform-destroy",
    "terraform-plan --production",
    "",
    null,
    undefined,
    1,
    [],
    {},
    new String("terraform-plan"),
  ])
    assert.throws(() => classify(operation, 1, denial), Error);
});

test("invalid nonintegral out-of-range or coerced exit codes fail closed", () => {
  const classify = subject();
  for (const exitCode of [
    -1,
    256,
    1.5,
    NaN,
    Infinity,
    -Infinity,
    Number.MAX_SAFE_INTEGER,
    "1",
    undefined,
    false,
    [],
    {},
  ])
    assert.throws(() => classify("terraform-plan", exitCode, denial), Error);
});

test("stderr is a primitive string with an inclusive 65536-byte UTF-8 bound", () => {
  const classify = subject();
  for (const stderr of ["x".repeat(65_536), "é".repeat(32_768)])
    assert.deepEqual(classify("terraform-plan", 1, stderr), {
      operation: "terraform-plan",
      exitCode: 1,
      permission: null,
    });
  for (const stderr of [
    null,
    undefined,
    false,
    0,
    [],
    {},
    Buffer.from("text"),
    new String("text"),
    "x".repeat(65_537),
    "é".repeat(32_769),
  ])
    assert.throws(() => classify("terraform-plan", 1, stderr), Error);
});

test("invalid input errors also avoid echoing synthetic sensitive input", () => {
  const classify = subject();
  const canary = "synthetic-private-error-canary";
  for (const invoke of [
    () => classify(`terraform-${canary}`, 1, denial),
    () => classify("terraform-plan", canary, denial),
    () => classify("terraform-plan", 1, canary.repeat(3_000)),
  ]) {
    let caught;
    try {
      invoke();
    } catch (error) {
      caught = error;
    }
    assert.ok(caught instanceof Error);
    assert.ok(!caught.message.includes(canary), "Invalid-input error exposed raw diagnostic input");
  }
});
