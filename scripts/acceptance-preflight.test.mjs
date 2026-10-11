/**
 * Independent GATE-01 preflight wiring and GitHub observation expectations, authored before implementation.
 * Run with pinned Node after integration: node --test scripts/acceptance-preflight.test.mjs.
 * Tests read the declared workflow and inject synthetic REST records. They perform no Git, HTTP, token, cloud or
 * companion operations. Structural workflow validation does not prove a replaced workflow is tamper-proof.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parse } from "yaml";
import { collectBindingObservations, requirePreflightWorkflow } from "./acceptance-preflight.mjs";

/** Project only the two legacy API roles from actual known leaves; the visibility suite checks the full family. */
const workflow = () => {
  const value = parse(readFileSync(".github/workflows/ci.yml", "utf8"));
  if (!Object.values(value.jobs).some((job) => Object.hasOwn(job, "uses"))) return value;
  const targets = {
    "validate-foundation": [".github/workflows/linter.yml", "checks"],
    "validate-product": [".github/workflows/base-acceptance-e2e.yml", "validate-product"],
  };
  const jobs = {};
  for (const [name, [path, leaf]] of Object.entries(targets)) {
    assert.equal(value.jobs[name]?.uses, `./${path}`, "Unknown local preflight caller");
    assert.equal(value.jobs[name].steps, undefined, "A reusable caller cannot also execute inline steps");
    const called = parse(readFileSync(path, "utf8"));
    assert.deepEqual(Object.keys(called.on ?? {}), ["workflow_call"], "Unexpected reusable preflight event");
    jobs[name] = called.jobs?.[leaf];
    assert(Array.isArray(jobs[name]?.steps), "Missing actual executing preflight leaf");
  }
  return { ...value, jobs };
};
const validationJobs = ["validate-foundation", "validate-product"];
const tokenExpression = "${{ github.token }}";
const preflight = (job) => {
  const found = job.steps.filter((step) => step.id === "acceptance-preflight");
  assert.equal(found.length, 1, "Each validation job must expose exactly one trusted preflight step");
  return found[0];
};

// The actual workflow is the reviewed positive fixture; mutations weaken one meaningful property at a time.
test("both validation jobs perform one trusted preflight before any head-owned run command", () => {
  const value = workflow();
  for (const name of validationJobs) {
    const job = value.jobs[name];
    const step = preflight(job);
    const at = job.steps.indexOf(step);
    assert.equal(job.steps.slice(0, at).filter((entry) => entry.run !== undefined).length, 0);
    assert(at < job.steps.findIndex((entry) => entry.run === "npm ci"));
    assert.equal(step.if, undefined, "Admission cannot be skipped through a conditional");
    assert.equal(step["continue-on-error"], undefined);
    assert.equal(job["continue-on-error"], undefined);
    for (const field of ["NODE_OPTIONS", "BASH_ENV", "ENV"])
      assert.equal(step.env?.[field], "", `${field} must be cleared before the trusted shell starts`);
    assert.equal(job.steps.find((entry) => entry.uses?.startsWith("actions/checkout@"))?.with?.["fetch-depth"], 0);
    assert.equal(
      job.steps.find((entry) => entry.uses?.startsWith("actions/checkout@"))?.with?.["persist-credentials"],
      false,
    );
  }
  assert.equal(requirePreflightWorkflow(value), true);
});

for (const name of validationJobs) {
  for (const [label, change] of [
    [
      "missing preflight",
      (job, step) => {
        job.steps.splice(job.steps.indexOf(step), 1);
      },
    ],
    [
      "preflight after install",
      (job, step) => {
        job.steps.splice(job.steps.indexOf(step), 1);
        job.steps.splice(job.steps.findIndex((entry) => entry.run === "npm ci") + 1, 0, step);
      },
    ],
    [
      "head-owned module execution",
      (_job, step) => {
        step.run = "node scripts/acceptance-preflight.mjs";
      },
    ],
    [
      "moving trusted base",
      (_job, step) => {
        step.env = { ...step.env, CI_BASE_REF: "main" };
      },
    ],
    [
      "conditional admission",
      (_job, step) => {
        step.if = "${{ github.event_name == 'push' }}";
      },
    ],
    [
      "ignored admission failure",
      (_job, step) => {
        step["continue-on-error"] = true;
      },
    ],
    [
      "failure suppression",
      (_job, step) => {
        step.run += "\ntrue";
        step.shell = "bash {0}";
      },
    ],
    [
      "shallow base checkout",
      (job) => {
        job.steps.find((entry) => entry.uses?.startsWith("actions/checkout@")).with["fetch-depth"] = 1;
      },
    ],
    [
      "persisted checkout credentials",
      (job) => {
        job.steps.find((entry) => entry.uses?.startsWith("actions/checkout@")).with["persist-credentials"] = true;
      },
    ],
    [
      "write token permissions",
      (job) => {
        job.permissions = { contents: "write", "pull-requests": "read" };
      },
    ],
    [
      "job-wide observation token",
      (job) => {
        job.env = { ...job.env, GATE_REVIEW_TOKEN: tokenExpression };
      },
    ],
    [
      "token inherited by head installation",
      (job) => {
        job.steps.find((entry) => entry.run === "npm ci").env = { GATE_REVIEW_TOKEN: tokenExpression };
      },
    ],
    [
      "token persisted for later steps",
      (_job, step) => {
        step.run += '\nprintf "GATE_REVIEW_TOKEN=%s\\n" "$GATE_REVIEW_TOKEN" >> "$GITHUB_ENV"';
      },
    ],
  ]) {
    test(`${name} rejects ${label}`, () => {
      const value = workflow();
      const job = value.jobs[name];
      change(job, preflight(job));
      assert.throws(() => requirePreflightWorkflow(value));
    });
  }
}

test("publisher write privilege must not become a workflow-wide default", () => {
  const value = workflow();
  value.permissions = { contents: "write", "pull-requests": "read" };
  assert.throws(() => requirePreflightWorkflow(value));
});

for (const scope of ["workflow", ...validationJobs]) {
  for (const [field, value] of [
    ["NODE_OPTIONS", "--import=./scripts/startup-poison.mjs"],
    ["BASH_ENV", "./scripts/startup-poison.sh"],
    ["ENV", "./scripts/startup-poison.sh"],
    ["PATH", "./scripts:/usr/bin:/bin"],
  ]) {
    test(`${scope} refuses inherited ${field} interpreter or executable overrides`, () => {
      const data = workflow();
      const target = scope === "workflow" ? data : data.jobs[scope];
      target.env = { ...target.env, [field]: value };
      assert.throws(() => requirePreflightWorkflow(data));
    });
  }
}

function apiFixture() {
  const repository = "example/private-mp3";
  const prefix = `/repos/${repository}`;
  const reviewedHead = "1".repeat(40);
  const reviewedTree = "2".repeat(40);
  const mergeCommit = "3".repeat(40);
  const binding = {
    id: "transport-r4",
    predecessor: "r3",
    contractRevision: "r4",
    contractPath: "docs/testing/contracts/transport-r4.md",
    contractSha256: "4".repeat(64),
    suiteCommit: mergeCommit,
    suiteTree: "5".repeat(40),
    manifestSha256: "6".repeat(64),
    review: { repository, pullRequest: 12, reviewId: 34, reviewer: "independent-reviewer", reviewedHead, reviewedTree },
  };
  const repo = { full_name: repository, private: true, default_branch: "main" };
  const records = {
    [prefix]: repo,
    [`${prefix}/pulls/12`]: {
      number: 12,
      merged: true,
      state: "closed",
      merge_commit_sha: mergeCommit,
      user: { login: "product-owner" },
      base: { ref: "main", repo },
      head: { sha: reviewedHead, repo },
    },
    [`${prefix}/pulls/12/reviews/34`]: {
      id: 34,
      state: "APPROVED",
      commit_id: reviewedHead,
      user: { login: "independent-reviewer" },
      submitted_at: "2026-10-10T12:00:00Z",
    },
    [`${prefix}/git/commits/${reviewedHead}`]: { sha: reviewedHead, tree: { sha: reviewedTree } },
  };
  records[`${prefix}/pulls/12/reviews?per_page=100&page=1`] = [
    structuredClone(records[`${prefix}/pulls/12/reviews/34`]),
  ];
  const calls = [];
  const request = async (method, path) => {
    calls.push({ method, path });
    assert.equal(method, "GET", "Review observation cannot perform GitHub mutations");
    assert(path.startsWith(`${prefix}/`) || path === prefix, "Request escaped trusted repository");
    assert(Object.hasOwn(records, path), `Unexpected synthetic API route ${path}`);
    return structuredClone(records[path]);
  };
  const expected = {
    ...binding.review,
    author: "product-owner",
    baseRef: "main",
    merged: true,
    mergeCommit,
    state: "APPROVED",
  };
  return { repository, prefix, binding, records, calls, request, expected };
}

test("exact PR, review and Git tree observations produce only the frozen nonsecret observation shape", async () => {
  const f = apiFixture();
  const actual = await collectBindingObservations([f.binding], { repository: f.repository, request: f.request });
  assert.deepEqual(actual, [f.expected]);
  for (const path of [
    `${f.prefix}/pulls/12`,
    `${f.prefix}/pulls/12/reviews/34`,
    `${f.prefix}/git/commits/${f.binding.review.reviewedHead}`,
  ])
    assert(
      f.calls.some((call) => call.path === path),
      `Missing independent observation of ${path}`,
    );
});

test("no newly bound successor requires no API access", async () => {
  const f = apiFixture();
  assert.deepEqual(await collectBindingObservations([], { repository: f.repository, request: f.request }), []);
  assert.equal(f.calls.length, 0);
});

for (const [label, mutate] of [
  [
    "wrong PR number",
    (f) => {
      f.records[`${f.prefix}/pulls/12`].number = 99;
    },
  ],
  [
    "unmerged PR",
    (f) => {
      f.records[`${f.prefix}/pulls/12`].merged = false;
    },
  ],
  [
    "wrong merge commit",
    (f) => {
      f.records[`${f.prefix}/pulls/12`].merge_commit_sha = "7".repeat(40);
    },
  ],
  [
    "wrong repository",
    (f) => {
      f.records[`${f.prefix}/pulls/12`].base.repo = { ...f.records[f.prefix], full_name: "other/repo" };
    },
  ],
  [
    "wrong target branch",
    (f) => {
      f.records[`${f.prefix}/pulls/12`].base.ref = "preview";
    },
  ],
  [
    "stale reviewed head",
    (f) => {
      f.records[`${f.prefix}/pulls/12`].head.sha = "7".repeat(40);
    },
  ],
  [
    "wrong review ID",
    (f) => {
      f.records[`${f.prefix}/pulls/12/reviews/34`].id = 99;
    },
  ],
  [
    "dismissed review",
    (f) => {
      f.records[`${f.prefix}/pulls/12/reviews/34`].state = "DISMISSED";
    },
  ],
  [
    "changes requested",
    (f) => {
      f.records[`${f.prefix}/pulls/12/reviews/34`].state = "CHANGES_REQUESTED";
    },
  ],
  [
    "wrong reviewer",
    (f) => {
      f.records[`${f.prefix}/pulls/12/reviews/34`].user.login = "another-reviewer";
    },
  ],
  [
    "review for a prior commit",
    (f) => {
      f.records[`${f.prefix}/pulls/12/reviews/34`].commit_id = "7".repeat(40);
    },
  ],
  [
    "self-review",
    (f) => {
      f.records[`${f.prefix}/pulls/12`].user.login = "independent-reviewer";
    },
  ],
  [
    "missing PR author",
    (f) => {
      delete f.records[`${f.prefix}/pulls/12`].user;
    },
  ],
  [
    "wrong observed commit",
    (f) => {
      f.records[`${f.prefix}/git/commits/${f.binding.review.reviewedHead}`].sha = "7".repeat(40);
    },
  ],
  [
    "different valid observed tree",
    (f) => {
      f.records[`${f.prefix}/git/commits/${f.binding.review.reviewedHead}`].tree.sha = "8".repeat(40);
    },
  ],
]) {
  test(`observation collector rejects ${label}`, async () => {
    const f = apiFixture();
    mutate(f);
    await assert.rejects(collectBindingObservations([f.binding], { repository: f.repository, request: f.request }));
  });
}

for (const repository of [
  "https://untrusted.invalid/repo",
  "example/private-mp3/../../other",
  "example/repo?token=x",
]) {
  test(`invalid trusted repository slug fails before API access: ${repository}`, async () => {
    const f = apiFixture();
    await assert.rejects(collectBindingObservations([f.binding], { repository, request: f.request }));
    assert.equal(f.calls.length, 0);
  });
}

test("binding cannot redirect collection to its own repository", async () => {
  const f = apiFixture();
  f.binding.review.repository = "other/repo";
  await assert.rejects(collectBindingObservations([f.binding], { repository: f.repository, request: f.request }));
  assert.equal(f.calls.length, 0);
});

test("API failure cannot become a missing or default-approved observation", async () => {
  const f = apiFixture();
  await assert.rejects(
    collectBindingObservations([f.binding], {
      repository: f.repository,
      request: async () => {
        throw new Error("Synthetic API unavailable");
      },
    }),
  );
});

/** Review history is separate API evidence; an exact old review may still say APPROVED after a later decision. */
function historyReview(f, id, state, submittedAt, overrides = {}) {
  return {
    id,
    state,
    commit_id: f.binding.review.reviewedHead,
    user: { login: f.binding.review.reviewer },
    ...(submittedAt === undefined ? {} : { submitted_at: submittedAt }),
    ...overrides,
  };
}

function reviewPages(f, pages) {
  for (const path of Object.keys(f.records)) {
    if (path.startsWith(`${f.prefix}/pulls/12/reviews?`)) delete f.records[path];
  }
  for (const [index, page] of pages.entries()) {
    f.records[`${f.prefix}/pulls/12/reviews?per_page=100&page=${index + 1}`] = structuredClone(page);
  }
}

function paginationFixture() {
  const f = apiFixture();
  const approval = structuredClone(f.records[`${f.prefix}/pulls/12/reviews/34`]);
  approval.id = 10001;
  f.binding.review.reviewId = approval.id;
  f.expected.reviewId = approval.id;
  f.records[`${f.prefix}/pulls/12/reviews/${approval.id}`] = approval;
  const older = (count) =>
    Array.from({ length: count }, (_, index) =>
      historyReview(f, index + 1, "COMMENTED", new Date(Date.UTC(2026, 9, 10, 8, 0, index)).toISOString(), {
        user: { login: "another-reviewer" },
      }),
    );
  return { ...f, approval, older };
}

test("a later same-head change request or dismissal invalidates the recorded old approval", async () => {
  for (const state of ["CHANGES_REQUESTED", "DISMISSED"]) {
    const f = apiFixture();
    reviewPages(f, [
      [f.records[`${f.prefix}/pulls/12/reviews/34`], historyReview(f, 35, state, "2026-10-10T12:01:00Z")],
    ]);
    await assert.rejects(collectBindingObservations([f.binding], { repository: f.repository, request: f.request }));
  }
});

test("a replacement decision on a later review page cannot be missed", async () => {
  const f = paginationFixture();
  reviewPages(f, [
    [...f.older(99), f.approval],
    [historyReview(f, 10002, "CHANGES_REQUESTED", "2026-10-10T12:01:00Z")],
  ]);
  await assert.rejects(collectBindingObservations([f.binding], { repository: f.repository, request: f.request }));
  assert(f.calls.some((call) => call.path.endsWith("reviews?per_page=100&page=2")));
});

test("later comments and pending drafts do not replace the submitted approval decision", async () => {
  const f = apiFixture();
  reviewPages(f, [
    [
      f.records[`${f.prefix}/pulls/12/reviews/34`],
      historyReview(f, 35, "COMMENTED", "2026-10-10T12:01:00Z"),
      historyReview(f, 36, "PENDING", undefined),
    ],
  ]);
  assert.deepEqual(await collectBindingObservations([f.binding], { repository: f.repository, request: f.request }), [
    f.expected,
  ]);
});

test("a newer submitted approval requires its own exact recorded review identity", async () => {
  const f = apiFixture();
  const newer = historyReview(f, 35, "APPROVED", "2026-10-10T12:01:00Z");
  reviewPages(f, [[f.records[`${f.prefix}/pulls/12/reviews/34`], newer]]);
  await assert.rejects(collectBindingObservations([f.binding], { repository: f.repository, request: f.request }));
  f.binding.review.reviewId = 35;
  f.expected.reviewId = 35;
  f.records[`${f.prefix}/pulls/12/reviews/35`] = newer;
  assert.deepEqual(await collectBindingObservations([f.binding], { repository: f.repository, request: f.request }), [
    f.expected,
  ]);
});

test("malformed, duplicate, unordered or incomplete review inventories fail closed", async () => {
  for (const kind of [
    "not-array",
    "duplicate",
    "unordered",
    "unknown-state",
    "missing-time",
    "invalid-time",
    "full-cap",
  ]) {
    const f = paginationFixture();
    let pages = [[f.approval]];
    if (kind === "not-array") pages = [{ reviews: [f.approval] }];
    if (kind === "duplicate") pages = [[f.approval, structuredClone(f.approval)]];
    if (kind === "unordered") pages = [[f.approval, ...f.older(1)]];
    if (kind === "unknown-state") pages[0].push(historyReview(f, 10002, "UNKNOWN", "2026-10-10T12:01:00Z"));
    if (kind === "missing-time") pages[0].push(historyReview(f, 10002, "CHANGES_REQUESTED", undefined));
    if (kind === "invalid-time") pages[0].push(historyReview(f, 10002, "CHANGES_REQUESTED", "not-a-timestamp"));
    if (kind === "full-cap") {
      const older = f.older(1000);
      pages = Array.from({ length: 10 }, (_, index) => older.slice(index * 100, (index + 1) * 100));
    }
    reviewPages(f, pages);
    await assert.rejects(collectBindingObservations([f.binding], { repository: f.repository, request: f.request }));
    if (kind === "full-cap") {
      assert.equal(f.calls.filter((call) => call.path.includes("/reviews?per_page=100&page=")).length, 10);
    }
  }
});

test("the exact-review endpoint and review-history identity must agree", async () => {
  const f = apiFixture();
  const inconsistent = structuredClone(f.records[`${f.prefix}/pulls/12/reviews/34`]);
  inconsistent.user.login = "another-reviewer";
  reviewPages(f, [[inconsistent]]);
  await assert.rejects(collectBindingObservations([f.binding], { repository: f.repository, request: f.request }));
});

test("complete multi-page history admits only its latest exact reviewed approval", async () => {
  const f = paginationFixture();
  reviewPages(f, [f.older(100), [f.approval]]);
  assert.deepEqual(await collectBindingObservations([f.binding], { repository: f.repository, request: f.request }), [
    f.expected,
  ]);
  assert.deepEqual(
    f.calls.filter((call) => call.path.includes("/reviews?per_page=100&page=")).map((call) => call.path),
    [`${f.prefix}/pulls/12/reviews?per_page=100&page=1`, `${f.prefix}/pulls/12/reviews?per_page=100&page=2`],
  );
});

test("later decisive review for another head invalidates the old head approval", async () => {
  for (const state of ["APPROVED", "CHANGES_REQUESTED"]) {
    const f = apiFixture();
    reviewPages(f, [
      [
        f.records[`${f.prefix}/pulls/12/reviews/34`],
        historyReview(f, 35, state, "2026-10-10T12:01:00Z", { commit_id: "9".repeat(40) }),
      ],
    ]);
    await assert.rejects(collectBindingObservations([f.binding], { repository: f.repository, request: f.request }));
  }
});
