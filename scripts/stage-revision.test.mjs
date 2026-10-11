/**
 * Independent regression expectations for Cloud Run's full readiness IDs and short observed traffic revision names.
 * Run with the pinned Node runtime: node --test scripts/stage-revision.test.mjs. Literal synthetic provider records
 * exercise only the pure policy export; there are no credentials, files, network, Terraform or cloud side effects.
 * Failures identify missing implementation or an incorrect identity/traffic decision, never hosted acceptance.
 */
import assert from "node:assert/strict";
import test from "node:test";
import * as policy from "./stage-delivery-policy.mjs";

const resourceId = "projects/synthetic-mp3/locations/us-central1/services/mp3-stage";
const shortRevision = "mp3-stage-00001-abc";
const fullRevision = `${resourceId}/revisions/${shortRevision}`;

/** Return fresh literal provider-shaped observations; expected identities do not come from the implementation. */
function fixture() {
  return {
    name: resourceId,
    latestReadyRevision: fullRevision,
    latestCreatedRevision: fullRevision,
    trafficStatuses: [{ type: "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST", revision: shortRevision, percent: 100 }],
  };
}

/** Assert availability separately so absent export failures cannot masquerade as intended refusal behavior. */
function subject() {
  assert.equal(typeof policy.requireStageServingRevision, "function", "Missing requireStageServingRevision export");
  return policy.requireStageServingRevision;
}

/** Freeze the input recursively to expose mutation while preserving ordinary parsed-JSON value semantics. */
function freeze(value) {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Require synchronous refusal for each independent mutation of an otherwise valid synthetic record. */
function refuses(check, cases) {
  for (const [label, change] of cases) {
    const service = fixture();
    change(service);
    assert.throws(() => check(service, resourceId), undefined, label);
  }
}

test("serving revision accepts a short LATEST traffic name and returns its exact full readiness ID", () => {
  const check = subject();
  assert.equal(check(fixture(), resourceId), fullRevision);
  const otherResource = "projects/another-synthetic/locations/europe-west1/services/mp3-stage";
  const otherFull = `${otherResource}/revisions/mp3-stage-00042-xyz`;
  const other = {
    name: otherResource,
    latestReadyRevision: otherFull,
    latestCreatedRevision: otherFull,
    trafficStatuses: [{ type: "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST", revision: "mp3-stage-00042-xyz", percent: 100 }],
  };
  assert.equal(check(other, otherResource), otherFull);
});

test("serving revision validation leaves a deeply frozen provider observation unchanged", () => {
  const check = subject();
  const service = fixture();
  const before = structuredClone(service);
  assert.equal(check(freeze(service), resourceId), fullRevision);
  assert.deepEqual(service, before);
});

test("serving revision refuses absent or malformed full readiness identities", () => {
  const check = subject();
  refuses(check, [
    ["missing ready", (s) => delete s.latestReadyRevision],
    ["null ready", (s) => (s.latestReadyRevision = null)],
    ["short readiness ID", (s) => (s.latestReadyRevision = s.latestCreatedRevision = shortRevision)],
    ["empty revision suffix", (s) => (s.latestReadyRevision = s.latestCreatedRevision = `${resourceId}/revisions/`)],
    [
      "foreign revision prefix",
      (s) => (s.latestReadyRevision = s.latestCreatedRevision = `${resourceId}/revisions/mp3-production-00001-abc`),
    ],
    [
      "stage prefix confusion",
      (s) => (s.latestReadyRevision = s.latestCreatedRevision = `${resourceId}/revisions/mp3-stagex-00001-abc`),
    ],
    [
      "traversal",
      (s) => (s.latestReadyRevision = s.latestCreatedRevision = `${resourceId}/revisions/../${shortRevision}`),
    ],
    ["newline suffix", (s) => (s.latestReadyRevision = s.latestCreatedRevision = `${fullRevision}\n`)],
  ]);
});

test("serving revision rejects another namespace even when its short revision basename is identical", () => {
  const check = subject();
  for (const other of [
    "projects/foreign-project/locations/us-central1/services/mp3-stage",
    "projects/synthetic-mp3/locations/europe-west1/services/mp3-stage",
    "projects/synthetic-mp3/locations/us-central1/services/mp3-production",
    `${resourceId}-other`,
  ]) {
    const service = fixture();
    service.latestReadyRevision = service.latestCreatedRevision = `${other}/revisions/${shortRevision}`;
    assert.throws(() => check(service, resourceId), undefined, other);
  }
});

test("serving revision refuses full paths, URLs and traversal in the observed short traffic name", () => {
  const check = subject();
  for (const revision of [
    fullRevision,
    `projects/foreign-project/locations/us-central1/services/mp3-stage/revisions/${shortRevision}`,
    `revisions/${shortRevision}`,
    `https://run.googleapis.com/v2/${fullRevision}`,
    `../${shortRevision}`,
    `${shortRevision}/..`,
    `%2e%2e%2f${shortRevision}`,
    `/${shortRevision}`,
    `${shortRevision}\n`,
  ]) {
    const service = fixture();
    service.trafficStatuses[0].revision = revision;
    assert.throws(() => check(service, resourceId), undefined, revision);
  }
});

test("serving revision refuses another short name or a matching prefix rather than exact equality", () => {
  const check = subject();
  for (const revision of [
    "mp3-stage-00002-abc",
    `${shortRevision}-extra`,
    "mp3-stage-00001-ab",
    "mp3-stagex-00001-abc",
  ]) {
    const service = fixture();
    service.trafficStatuses[0].revision = revision;
    assert.throws(() => check(service, resourceId), undefined, revision);
  }
});

test("serving revision refuses readiness and creation disagreement or missing creation identity", () => {
  const check = subject();
  refuses(check, [
    ["different created revision", (s) => (s.latestCreatedRevision = `${resourceId}/revisions/mp3-stage-00002-abc`)],
    ["missing created revision", (s) => delete s.latestCreatedRevision],
    ["created short name", (s) => (s.latestCreatedRevision = shortRevision)],
    ["null created revision", (s) => (s.latestCreatedRevision = null)],
  ]);
});

test("serving revision requires exactly one observed traffic entry", () => {
  const check = subject();
  refuses(check, [
    ["no statuses", (s) => (s.trafficStatuses = [])],
    ["duplicate statuses", (s) => s.trafficStatuses.push(structuredClone(s.trafficStatuses[0]))],
    [
      "split traffic",
      (s) => {
        s.trafficStatuses[0].percent = 50;
        s.trafficStatuses.push({
          type: "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST",
          revision: "mp3-stage-00002-abc",
          percent: 50,
        });
      },
    ],
  ]);
});

test("serving revision requires numeric full traffic, LATEST allocation and no traffic tag", () => {
  const check = subject();
  refuses(check, [
    ["partial traffic", (s) => (s.trafficStatuses[0].percent = 99)],
    ["excess traffic", (s) => (s.trafficStatuses[0].percent = 101)],
    ["string percentage", (s) => (s.trafficStatuses[0].percent = "100")],
    ["tagged traffic", (s) => (s.trafficStatuses[0].tag = "candidate")],
    ["pinned allocation", (s) => (s.trafficStatuses[0].type = "TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION")],
    ["unspecified allocation", (s) => (s.trafficStatuses[0].type = "TRAFFIC_TARGET_ALLOCATION_TYPE_UNSPECIFIED")],
  ]);
});

test("serving revision refuses missing or malformed observed traffic fields", () => {
  const check = subject();
  refuses(check, [
    ["missing statuses", (s) => delete s.trafficStatuses],
    ["null statuses", (s) => (s.trafficStatuses = null)],
    ["object instead of array", (s) => (s.trafficStatuses = { 0: s.trafficStatuses[0], length: 1 })],
    ["null entry", (s) => (s.trafficStatuses = [null])],
    ["missing revision", (s) => delete s.trafficStatuses[0].revision],
    ["missing type", (s) => delete s.trafficStatuses[0].type],
    ["missing percentage", (s) => delete s.trafficStatuses[0].percent],
  ]);
});
