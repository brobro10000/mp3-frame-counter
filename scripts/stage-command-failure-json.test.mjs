/**
 * Independently specify bounded Terraform JSON diagnostic proof before implementation. Run pinned Node with
 * node --test scripts/stage-command-failure-json.test.mjs. Literal events follow the provider-free Terraform 1.13.3
 * synthetic CLI evidence: JSON stdout preserves diagnostic.detail; native summaries omit the human Error prefix.
 * These pure controls do not reproduce the live cloud cause, run Terraform, grant permissions or retain raw messages.
 * Existing stderr remains independent; only a complete typed packet may supply additive JSON proof.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const moduleUrl = new URL("./stage-command-failure.mjs", import.meta.url);
const api = existsSync(moduleUrl) ? await import(moduleUrl.href) : {};
const commands = ["terraform-init", "terraform-plan", "terraform-show", "terraform-apply"];
const resource = "projects/synthetic-private-project/locations/us-central1/operations/synthetic-private-operation";
const denial = `googleapi: Error 403: Permission 'run.operations.get' denied on resource '${resource}' (or it may not exist).`;
const polling = `Error: Error waiting for Updating Service: error while retrieving operation: ${denial}`;
const nativeSummary = polling.slice("Error: ".length);
const expected = (operation, exitCode, permission = null) => ({ operation, exitCode, permission });
const packet = (...events) => events.map((event) => JSON.stringify(event)).join("\n") + "\n";

function subject() {
  assert.equal(typeof api.stageCommandFailure, "function", "Missing stageCommandFailure export; availability red only");
  return api.stageCommandFailure;
}

/** Required framing is explicit; unrelated message/timestamp/range fields are never a permission oracle. */
function diagnostic(summary = "Invalid value for variable", detail = polling) {
  return {
    "@level": "error",
    "@message": `Error: ${summary}`,
    "@module": "terraform.ui",
    "@timestamp": "2026-10-11T08:00:00.000Z",
    type: "diagnostic",
    diagnostic: { severity: "error", summary, detail },
  };
}

test("old three-argument stderr results remain identical with empty default or unrelated JSON stdout", () => {
  const classify = subject();
  const progress = packet({ type: "version", "@module": "terraform.ui", "@level": "info", terraform: "1.13.3" });
  for (const operation of commands)
    for (const exitCode of [null, 0, 1, 2, 137, 255])
      for (const stderr of ["", "Unrelated failure", denial, polling]) {
        const original = classify(operation, exitCode, stderr);
        for (const stdout of [undefined, "", progress, "malformed JSON"])
          assert.deepEqual(classify(operation, exitCode, stderr, stdout), original);
      }
});

test("complete typed error detail can prove only the existing literal operation-read denial", () => {
  const classify = subject();
  const messages = [
    denial,
    polling,
    polling.replaceAll("'", '"'),
    `${polling}\nThis was checked by the synthetic variable validation.`,
  ];
  for (const operation of commands)
    for (const detail of messages)
      assert.deepEqual(
        classify(operation, 1, "", packet(diagnostic("Invalid value for variable", detail))),
        expected(operation, 1, "run.operations.get"),
      );
});

test("typed native summary receives only its human Error prefix and detail never receives that prefix", () => {
  const classify = subject();
  const nativeCode7 = `Error waiting for Updating Service: Error code 7, message: Permission 'run.operations.get' denied on resource '${resource}' (or it may not exist).`;
  for (const summary of [nativeSummary, nativeCode7, denial, polling])
    assert.deepEqual(
      classify("terraform-apply", 1, "", packet(diagnostic(summary, ""))),
      expected("terraform-apply", 1, "run.operations.get"),
    );
  assert.deepEqual(
    classify("terraform-apply", 1, "", packet(diagnostic("Unrelated error", nativeSummary))),
    expected("terraform-apply", 1),
  );
});

test("typed native resource-may-not-exist denials retain exact framing and the closed record", () => {
  const classify = subject();
  const currentDenial = denial.replace("(or it may not exist).", "(or resource may not exist).");
  const wrapped = `Error: Error waiting for Updating Service: error while retrieving operation: ${currentDenial}`;
  const native = wrapped.slice("Error: ".length);
  const code7 = `Error waiting for Updating Service: Error code 7, message: ${currentDenial.slice("googleapi: Error 403: ".length)}`;
  const events = [
    diagnostic(native, ""),
    diagnostic(code7, ""),
    diagnostic("Unrelated summary", wrapped),
    diagnostic("Unrelated summary", currentDenial),
    diagnostic(native.replaceAll("'", '"'), ""),
  ];
  for (const operation of commands)
    for (const event of events) {
      const stdout = packet(event);
      for (const exitCode of [1, 255])
        assert.deepEqual(
          classify(operation, exitCode, "", stdout),
          expected(operation, exitCode, "run.operations.get"),
        );
      for (const exitCode of [0, null])
        assert.deepEqual(classify(operation, exitCode, "", stdout), expected(operation, exitCode));
      const rendered = JSON.stringify(classify(operation, 1, "", stdout));
      assert.ok(!rendered.includes(resource));
      assert.ok(!rendered.includes(stdout));
    }
});

test("the JSON resource qualifier cannot become proof through other framing qualifiers permissions or echo", () => {
  const classify = subject();
  assert.equal(
    classify("terraform-apply", 1, "", packet(diagnostic(nativeSummary, ""))).permission,
    "run.operations.get",
  );
  const wrapped = polling.replace("(or it may not exist).", "(or resource may not exist).");
  const native = wrapped.slice("Error: ".length);
  const split = native.indexOf(" denied ");
  const packets = [
    ...[
      "or the resource may not exist",
      "or resource might not exist",
      "or resource may exist",
      "or resource does not exist",
    ].map((qualifier) => packet(diagnostic(native.replace("or resource may not exist", qualifier), ""))),
    ...["run.operations.list", "run.services.update", "run.operations.getIamPolicy", "RUN.OPERATIONS.GET"].map(
      (permission) => packet(diagnostic(native.replace("run.operations.get", permission), "")),
    ),
    packet({ ...diagnostic(native, wrapped), "@module": "terraform.provider" }),
    packet({ ...diagnostic(native, wrapped), "@level": "warn" }),
    packet({ ...diagnostic(native, wrapped), type: "change_summary" }),
    packet({ ...diagnostic(native, wrapped), diagnostic: { severity: "warning", summary: native, detail: wrapped } }),
    packet({ ...diagnostic("Unrelated", "Unrelated"), "@message": wrapped }),
    packet(diagnostic(native.slice(0, split), native.slice(split))),
    packet(diagnostic(native.slice(0, split), ""), diagnostic("Unrelated", native.slice(split))),
    packet(diagnostic("Unrelated", native)),
    packet(diagnostic("Unrelated", `echo "${wrapped}"`)),
    packet(diagnostic(`"${native}"`, "")),
    packet(diagnostic(`${native} Additional diagnostic text.`, "")),
    packet(diagnostic(native.replace("Error 403", "Error 401"), "")),
    packet(diagnostic(native.replace(" denied ", " granted "), "")),
    packet(diagnostic(native.slice(0, -1), "")),
    `${packet(diagnostic(native, wrapped))}{`,
  ];
  for (const stdout of packets)
    assert.deepEqual(classify("terraform-apply", 1, "", stdout), expected("terraform-apply", 1));
});

test("JSON denial cannot establish permission for success or signal-only exits", () => {
  const classify = subject();
  const stdout = packet(diagnostic(nativeSummary, polling));
  for (const operation of commands)
    for (const exitCode of [0, null])
      assert.deepEqual(classify(operation, exitCode, "", stdout), expected(operation, exitCode));
  assert.throws(() => classify("terraform-apply", "SIGTERM", "", stdout), Error);
});

test("only own typed Terraform error framing and primitive summary-detail fields supply JSON proof", () => {
  const classify = subject();
  const mutations = [
    (event) => {
      event.type = "change_summary";
    },
    (event) => {
      delete event.type;
    },
    (event) => {
      event.type = "Diagnostic";
    },
    (event) => {
      event["@module"] = "terraform.provider";
    },
    (event) => {
      delete event["@module"];
    },
    (event) => {
      event["@level"] = "warn";
    },
    (event) => {
      delete event["@level"];
    },
    (event) => {
      event.diagnostic.severity = "warning";
    },
    (event) => {
      delete event.diagnostic.severity;
    },
    (event) => {
      delete event.diagnostic;
    },
    (event) => {
      delete event.diagnostic.summary;
    },
    (event) => {
      delete event.diagnostic.detail;
    },
    (event) => {
      event.diagnostic.summary = null;
    },
    (event) => {
      event.diagnostic.summary = { text: nativeSummary };
    },
    (event) => {
      event.diagnostic.detail = [polling];
    },
    (event) => {
      event.diagnostic = { severity: "error", summary: "Unrelated", detail: "Unrelated" };
      event["@message"] = polling;
    },
    (event) => {
      event.payload = event.diagnostic;
      delete event.diagnostic;
    },
  ];
  for (const mutate of mutations) {
    const event = diagnostic(nativeSummary, polling);
    mutate(event);
    assert.deepEqual(classify("terraform-apply", 1, "", packet(event)), expected("terraform-apply", 1));
  }
  const inheritedOnly = `{"__proto__":${JSON.stringify(diagnostic(nativeSummary, polling))}}\n`;
  assert.deepEqual(classify("terraform-apply", 1, "", inheritedOnly), expected("terraform-apply", 1));
});

test("progress nested strings other permissions echoed or split fields never become JSON denial proof", () => {
  const classify = subject();
  const atPermission = nativeSummary.indexOf(" denied ");
  const packets = [
    packet({
      type: "change_summary",
      "@module": "terraform.ui",
      "@level": "error",
      diagnostic: diagnostic(nativeSummary, polling).diagnostic,
    }),
    packet(diagnostic("Unrelated", JSON.stringify(diagnostic(nativeSummary, polling)))),
    ...["run.services.update", "run.operations.list", "run.operations.getIamPolicy", "RUN.OPERATIONS.GET"].map(
      (permission) => packet(diagnostic("Unrelated", polling.replace("run.operations.get", permission))),
    ),
    packet(diagnostic("Unrelated", polling.replace(" denied ", " granted "))),
    packet(diagnostic(nativeSummary.slice(0, atPermission), nativeSummary.slice(atPermission))),
    packet(
      diagnostic(nativeSummary.slice(0, atPermission), ""),
      diagnostic("Unrelated", nativeSummary.slice(atPermission)),
    ),
    packet(diagnostic("Unrelated", polling.replace("'run.operations.get' denied", "'run.operations.get'\ndenied"))),
    packet(diagnostic("Unrelated", polling.replace("googleapi: Error", "googleapi:\nError"))),
    packet(diagnostic("Unrelated", polling.slice(0, -1))),
    packet(diagnostic("Unrelated", `echo "${polling}"`)),
    packet(diagnostic("Unrelated", `"${polling}"`)),
  ];
  for (const stdout of packets)
    assert.deepEqual(classify("terraform-apply", 1, "", stdout), expected("terraform-apply", 1));
});

test("one malformed row invalidates the entire JSON packet without suppressing independent legacy stderr", () => {
  const classify = subject();
  const valid = packet(diagnostic(nativeSummary, polling));
  const malformed = [
    `${valid}{`,
    `{\n${valid}`,
    `${valid}not-json\n`,
    valid.slice(0, -3),
    `${valid}[]\n`,
    `${valid}null\n`,
    `${valid}"text"\n`,
    `${valid}42\n`,
  ];
  for (const stdout of malformed) {
    assert.deepEqual(classify("terraform-apply", 1, "", stdout), expected("terraform-apply", 1));
    assert.deepEqual(
      classify("terraform-apply", 1, denial, stdout),
      expected("terraform-apply", 1, "run.operations.get"),
    );
  }
});

test("an inclusive 65536-byte stdout packet preserves the complete typed proof without truncation", () => {
  const classify = subject();
  for (const stdout of ["x".repeat(65_536), "é".repeat(32_768)])
    assert.deepEqual(classify("terraform-apply", 1, "", stdout), expected("terraform-apply", 1));
  const event = diagnostic(nativeSummary, polling);
  event.padding = "";
  const base = packet(event);
  event.padding = "x".repeat(65_536 - Buffer.byteLength(base));
  const exact = packet(event);
  assert.equal(Buffer.byteLength(exact), 65_536);
  assert.deepEqual(classify("terraform-apply", 1, "", exact), expected("terraform-apply", 1, "run.operations.get"));
});

test("invalid stdout types or excessive UTF8 bytes fail with the fixed private-safe input error", () => {
  const classify = subject();
  assert.equal(classify("terraform-apply", 1, denial, "").permission, "run.operations.get");
  const canary = "synthetic-private-json-canary";
  for (const stdout of [
    null,
    false,
    0,
    [],
    {},
    Buffer.from("text"),
    new String("text"),
    "x".repeat(65_537),
    "é".repeat(32_769),
    canary.repeat(3000),
  ]) {
    assert.throws(
      () => classify("terraform-apply", 1, "", stdout),
      (error) => {
        assert(error instanceof Error);
        assert.equal(error.message, "INVALID_STAGE_COMMAND_DIAGNOSTIC");
        assert(!error.message.includes(canary));
        return true;
      },
    );
  }
  assert.throws(() => classify("terraform-apply", 1, "x".repeat(65_537), ""), Error);
});

test("unknown valid progress is ignored and records never expose raw packet tokens URLs or identifiers", () => {
  const classify = subject();
  const canaries = [
    "synthetic-private-project",
    "synthetic-private-operation",
    "synthetic-secret-token",
    "https://synthetic.invalid/private",
    "synthetic-private-account@example.invalid",
  ];
  const progress = {
    type: "unknown_valid_progress",
    "@module": "terraform.ui",
    "@level": "info",
    "@message": canaries.join(" "),
  };
  const event = diagnostic("Invalid value for variable", `${polling}\n${canaries.join(" ")}`);
  event.diagnostic.range = { filename: "synthetic-private-path", source: canaries.join(" ") };
  const stdout = packet(progress, event, { type: "change_summary", changes: { add: 0, change: 0, remove: 0 } });
  const result = classify("terraform-apply", 1, "", stdout);
  assert.deepEqual(result, expected("terraform-apply", 1, "run.operations.get"));
  assert.deepEqual(Reflect.ownKeys(result).sort(), ["exitCode", "operation", "permission"]);
  const rendered = JSON.stringify(result);
  for (const canary of [...canaries, resource, "synthetic-private-path"]) assert(!rendered.includes(canary));
  assert(!rendered.includes(stdout));
  assert.notEqual(classify("terraform-apply", 1, "", stdout), result);
  assert.deepEqual(classify("terraform-apply", 1, "", packet(progress)), expected("terraform-apply", 1));
  assert.deepEqual(classify("terraform-apply", 1, "", stdout.replaceAll("\n", "\r\n")), result);
});
