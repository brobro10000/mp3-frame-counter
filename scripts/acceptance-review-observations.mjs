/**
 * Collect exact, nonsecret GitHub review observations for newly proposed acceptance bindings.
 *
 * Import collectBindingObservations(bindings, { repository, request }). The trusted caller supplies one OWNER/REPO
 * slug and an async request(method, relativePath) function returning parsed API JSON or rejecting on request failure.
 * Only GET requests to fixed routes below that repository are issued; no bindings means no requests. This module has
 * no HTTP adapter, credentials, environment lookup, Git access, file writes or command-line side effects.
 *
 * Validate every requested identity before collection, then verify the merged PR, submitted approval and reviewed Git
 * tree. Review history is read in pages of 100, ending at a short page within ten requests; an incomplete inventory
 * fails closed. The recorded approval must remain that reviewer's latest submitted decisive review on any head.
 * Missing, stale, mismatched or ineligible evidence throws; request errors propagate without default approval.
 * Returned records contain only the resolver's frozen observation fields, never the API response or request context.
 */

import assert from "node:assert/strict";

const sha = /^[a-f0-9]{40}$/;
const login = /^[A-Za-z0-9][A-Za-z0-9-]*$/;
const reviewFields = ["repository", "pullRequest", "reviewId", "reviewer", "reviewedHead", "reviewedTree"];

/** Validate plain input records and optionally close their fields before deriving any request route. */
function requireRecord(value, label, fields) {
  assert(value && typeof value === "object" && !Array.isArray(value), `Expected ${label} record`);
  assert([Object.prototype, null].includes(Object.getPrototypeOf(value)), `Invalid ${label} prototype`);
  if (fields) {
    assert(
      Reflect.ownKeys(value).every((field) => fields.includes(field)),
      `Unknown ${label} field`,
    );
    for (const field of fields) assert(Object.hasOwn(value, field), `Missing ${label} ${field}`);
  }
}

/** Admit literal repository slugs only; URLs, traversal and query parameters must never reach the adapter. */
function requireRepository(repository) {
  assert(
    typeof repository === "string" && /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(repository),
    "Trusted repository must be an OWNER/REPO slug",
  );
}

/** Require the exact private repository and protected branch observed from the trusted repository route. */
function requireRepositoryIdentity(value, repository) {
  assert.equal(value?.full_name, repository, "Observed repository differs from trusted repository");
  assert.equal(value.private, true, "Acceptance reviews must belong to the private repository");
  assert.equal(value.default_branch, "main", "Acceptance reviews require protected main");
}

/** Reduce an API review to validated identity fields; pending drafts have no submitted decision time. */
function reviewIdentity(value) {
  requireRecord(value, "observed review");
  assert(Number.isSafeInteger(value.id) && value.id > 0, "Invalid observed review ID");
  assert(
    ["APPROVED", "CHANGES_REQUESTED", "DISMISSED", "COMMENTED", "PENDING"].includes(value.state),
    "Unknown observed review state",
  );
  assert(typeof value.commit_id === "string" && sha.test(value.commit_id), "Invalid observed review commit");
  const reviewer = value.user?.login;
  assert(
    typeof reviewer === "string" && /^[A-Za-z0-9][A-Za-z0-9-]*(?:\[bot\])?$/.test(reviewer),
    "Missing or invalid observed reviewer",
  );
  let submittedAt = null;
  if (value.state === "PENDING") {
    assert(value.submitted_at === undefined || value.submitted_at === null, "Pending review cannot be submitted");
  } else {
    submittedAt = value.submitted_at;
    assert(
      typeof submittedAt === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(submittedAt) &&
        Number.isFinite(Date.parse(submittedAt)),
      "Submitted review requires a valid timestamp",
    );
    const canonicalTime = submittedAt.replace(
      /(?:\.(\d{1,3}))?Z$/,
      (_match, fraction = "") => `.${fraction.padEnd(3, "0")}Z`,
    );
    assert.equal(new Date(submittedAt).toISOString(), canonicalTime, "Submitted review timestamp is not a valid date");
  }
  return { id: value.id, state: value.state, commit: value.commit_id, reviewer, submittedAt };
}

/** Require a complete chronological inventory and the exact endpoint approval as its reviewer's latest decision. */
async function requireLatestApproval(request, pullPath, endpointReview) {
  const exact = reviewIdentity(endpointReview);
  const seen = new Set();
  let previousId = 0;
  let previousTime = -Infinity;
  let matched = false;
  let latestDecision;
  let complete = false;
  for (let page = 1; page <= 10; page++) {
    const reviews = await request("GET", `${pullPath}/reviews?per_page=100&page=${page}`);
    assert(Array.isArray(reviews) && reviews.length <= 100, "Malformed review history page");
    for (const entry of reviews) {
      const review = reviewIdentity(entry);
      assert(!seen.has(review.id), "Duplicate review in history");
      assert(review.id > previousId, "Review history IDs are out of chronological order");
      seen.add(review.id);
      previousId = review.id;
      if (review.submittedAt !== null) {
        const submittedTime = Date.parse(review.submittedAt);
        assert(submittedTime >= previousTime, "Review history submission times are out of order");
        previousTime = submittedTime;
      }
      if (review.id === exact.id) {
        assert.deepEqual(review, exact, "Exact review endpoint and history identity disagree");
        matched = true;
      }
      if (
        review.reviewer.toLowerCase() === exact.reviewer.toLowerCase() &&
        ["APPROVED", "CHANGES_REQUESTED", "DISMISSED"].includes(review.state)
      )
        latestDecision = review;
    }
    if (reviews.length < 100) {
      complete = true;
      break;
    }
  }
  assert(complete, "Review history exceeds the complete bounded inventory");
  assert(matched, "Recorded review is missing from complete history");
  assert.deepEqual(latestDecision, exact, "Recorded approval was replaced by a later decisive review");
}

/** Collect approval evidence through injected read-only API access; never accept caller-selected API destinations. */
export async function collectBindingObservations(bindings, options) {
  requireRecord(options, "collector options", ["repository", "request"]);
  const { repository, request } = options;
  requireRepository(repository);
  assert(typeof request === "function", "Provide a read-only API request function");
  assert(Array.isArray(bindings), "Expected newly proposed binding records");
  const identities = new Set();
  const requested = [];
  for (const binding of bindings) {
    requireRecord(binding, "binding");
    requireRecord(binding.review, "binding review", reviewFields);
    const review = binding.review;
    assert.equal(review.repository, repository, "Binding cannot redirect the trusted repository");
    for (const field of ["pullRequest", "reviewId"]) {
      assert(Number.isSafeInteger(review[field]) && review[field] > 0, `Invalid binding ${field}`);
    }
    assert(typeof review.reviewer === "string" && login.test(review.reviewer), "Invalid binding reviewer");
    for (const field of ["reviewedHead", "reviewedTree"]) {
      assert(typeof review[field] === "string" && sha.test(review[field]), `Invalid binding ${field}`);
    }
    assert(typeof binding.suiteCommit === "string" && sha.test(binding.suiteCommit), "Invalid binding suite commit");
    const identity = `${review.pullRequest}/${review.reviewId}`;
    assert(!identities.has(identity), "Duplicate binding review identity");
    identities.add(identity);
    requested.push({
      suiteCommit: binding.suiteCommit,
      review: Object.fromEntries(reviewFields.map((field) => [field, review[field]])),
    });
  }
  if (bindings.length === 0) return [];
  const prefix = `/repos/${repository}`;
  requireRepositoryIdentity(await request("GET", prefix), repository);
  const observations = [];
  for (const binding of requested) {
    const expected = binding.review;
    const pullPath = `${prefix}/pulls/${expected.pullRequest}`;
    const pull = await request("GET", pullPath);
    assert.equal(pull?.number, expected.pullRequest, "Observed PR number mismatch");
    assert.equal(pull.merged, true, "Candidate PR must actually be merged");
    assert.equal(pull.state, "closed", "Merged candidate PR must be closed");
    assert.equal(pull.merge_commit_sha, binding.suiteCommit, "Observed actual squash differs from binding");
    requireRepositoryIdentity(pull.base?.repo, repository);
    assert.equal(pull.base.ref, "main", "Candidate PR must target protected main");
    assert.equal(pull.head?.sha, expected.reviewedHead, "Candidate PR head differs from reviewed head");
    const author = pull.user?.login;
    assert(typeof author === "string" && login.test(author), "Candidate PR author is missing or invalid");
    assert.notEqual(author.toLowerCase(), expected.reviewer.toLowerCase(), "Candidate author cannot self-approve");
    const [review, commit] = await Promise.all([
      request("GET", `${pullPath}/reviews/${expected.reviewId}`),
      request("GET", `${prefix}/git/commits/${expected.reviewedHead}`),
    ]);
    assert.equal(review?.id, expected.reviewId, "Observed review ID mismatch");
    assert.equal(review.state, "APPROVED", "Candidate review must remain approved");
    assert.equal(review.commit_id, expected.reviewedHead, "Approval must identify the exact reviewed head");
    assert.equal(review.user?.login, expected.reviewer, "Observed reviewer mismatch");
    assert(
      typeof review.submitted_at === "string" && Number.isFinite(Date.parse(review.submitted_at)),
      "Approval must be a submitted review",
    );
    assert.equal(commit?.sha, expected.reviewedHead, "Observed Git commit mismatch");
    assert.equal(commit.tree?.sha, expected.reviewedTree, "Observed reviewed Git tree mismatch");
    await requireLatestApproval(request, pullPath, review);
    observations.push({
      repository,
      pullRequest: pull.number,
      reviewId: review.id,
      reviewer: review.user.login,
      reviewedHead: commit.sha,
      reviewedTree: commit.tree.sha,
      author,
      baseRef: pull.base.ref,
      merged: pull.merged,
      mergeCommit: pull.merge_commit_sha,
      state: review.state,
    });
  }
  return observations;
}
