/**
 * Verify phase detection and mandatory-script selection independently of application or acceptance code.
 * Run `node --test scripts/phase-policy.test.mjs`; synthetic paths exercise omitted artifacts and downgrade attempts.
 * These tests perform no network calls, install no packages and do not claim application behavior was tested.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { detectPhase, requireMonotonicPhase, requiredRootScripts } from "./phase-policy.mjs";

const examples = {
  foundation: ["AGENTS.md", "scripts/policy.mjs", "docs/phases/04-local-end-to-end.md"],
  acceptance: ["tests/acceptance/package.json", "tests/acceptance/Dockerfile"],
  parser: ["tests/acceptance/package.json", "server/src/parser.ts"],
  integration: ["tests/acceptance/package.json", "server/src/parser.ts", "compose.yaml"],
};

test("phase detection uses actual artifacts and does not mistake plans or test-runner containers for product", () => {
  for (const [phase, files] of Object.entries(examples)) assert.equal(detectPhase(files), phase);
  for (const marker of [
    "frontend/index.html",
    "public/index.html",
    "src/server.ts",
    "src/api/upload.ts",
    "server/src/http.ts",
    "server/src/server.ts",
    "server/src/index.ts",
    "server/Dockerfile",
    "Dockerfile.api",
  ]) {
    assert.equal(detectPhase([marker]), "integration");
  }
  assert.throws(() => detectPhase(null));
});

test("removing integration or acceptance files cannot restore an earlier trusted-base phase", () => {
  assert.throws(() => requireMonotonicPhase(examples.parser, examples.integration), /Cannot downgrade/);
  assert.throws(() => requireMonotonicPhase(examples.foundation, examples.acceptance), /Cannot downgrade/);
  assert.equal(requireMonotonicPhase(examples.integration, examples.parser), "integration");
  assert.equal(requireMonotonicPhase(examples.integration, examples.integration), "integration");
});

test("parser and integrated product require real build, unit and E2E commands", () => {
  assert.deepEqual(requiredRootScripts("foundation"), []);
  assert.deepEqual(requiredRootScripts("acceptance"), []);
  assert.deepEqual(requiredRootScripts("parser"), ["test:unit", "build"]);
  assert.deepEqual(requiredRootScripts("integration"), ["test:unit", "build", "test:e2e"]);
  assert.throws(() => requiredRootScripts("skip"), /Unknown phase/);
});
