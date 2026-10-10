/**
 * Read bounded GitHub JSON for acceptance review observations using an explicitly supplied repository and token.
 * Import createGithubReviewRequest({ repository, token, fetchImpl? }), then call the returned request("GET", path).
 * Only the collector's repository, PR, exact review, bounded review-list and Git commit routes are allowed at
 * https://api.github.com. Review-list queries require exactly per_page=100&page=<1 through 10> in that order.
 * Requests have a 30-second timeout, reject redirects and stop after 1 MiB of actual response bytes. There are no
 * retries, mutations, environment/credential discovery, file writes or import-time I/O. Tokens remain in memory.
 * Invalid input, failed HTTP/transport, oversized bodies and invalid JSON reject with sanitized local diagnostics.
 * Tests inject fetchImpl; production callers must obtain authority and credentials outside this transport module.
 */

const origin = "https://api.github.com";
const maxResponseBytes = 1024 * 1024;
const requestTimeoutMs = 30_000;
const repositoryPattern = /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/;
const tokenPattern = /^[A-Za-z0-9._~+/-]+=*$/;

/** Local diagnostics never include input values, response bodies, transport causes or credential-bearing objects. */
class ReviewHttpError extends Error {
  constructor(message) {
    super(message);
    this.name = "ReviewHttpError";
  }
}

function requireCondition(condition, message) {
  if (!condition) throw new ReviewHttpError(message);
}

/** Validate literal routes before URL parsing can normalize traversal or discard credential-bearing components. */
function requireRoute(repository, method, path) {
  requireCondition(method === "GET", "GitHub review access requires GET");
  requireCondition(typeof path === "string", "Invalid GitHub review route");
  const prefix = `/repos/${repository}`;
  if (path === prefix) return;
  requireCondition(path.startsWith(`${prefix}/`), "GitHub review route is outside the trusted repository");
  const suffix = path.slice(prefix.length);
  const pull = /^\/pulls\/([1-9][0-9]*)(?:\/reviews\/([1-9][0-9]*))?$/.exec(suffix);
  const reviewPage = /^\/pulls\/([1-9][0-9]*)\/reviews\?per_page=100&page=([1-9][0-9]*)$/.exec(suffix);
  const commit = /^\/git\/commits\/[a-f0-9]{40}$/.test(suffix);
  requireCondition(
    commit ||
      (pull && pull.slice(1).every((id) => id === undefined || Number.isSafeInteger(Number(id)))) ||
      (reviewPage &&
        reviewPage.slice(1).every((id) => Number.isSafeInteger(Number(id))) &&
        Number(reviewPage[2]) <= 10),
    "Unsupported GitHub review route",
  );
}

/** Count bytes as the stream arrives; Content-Length is neither necessary nor trusted for this limit. */
async function readBoundedJson(response) {
  requireCondition(response.body && typeof response.body.getReader === "function", "Missing GitHub JSON body");
  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  let completed = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        completed = true;
        break;
      }
      requireCondition(value instanceof Uint8Array, "Invalid GitHub response stream");
      bytes += value.byteLength;
      requireCondition(bytes <= maxResponseBytes, "GitHub review response exceeds the byte limit");
      chunks.push(value);
    }
    // Strict decoding rejects malformed UTF-8 rather than changing identity-bearing response strings silently.
    const text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks, bytes));
    return JSON.parse(text);
  } finally {
    if (!completed) {
      try {
        await reader.cancel();
      } catch {
        // Cancellation failure must not expose stream internals or replace the original rejection.
      }
    }
    reader.releaseLock();
  }
}

/** Build the narrow authenticated adapter without obtaining credentials or accessing the network during creation. */
export function createGithubReviewRequest({ repository, token, fetchImpl = globalThis.fetch }) {
  requireCondition(
    typeof repository === "string" && repositoryPattern.test(repository),
    "Provide a trusted OWNER/REPO identity",
  );
  requireCondition(
    typeof token === "string" && token.length <= 8192 && tokenPattern.test(token),
    "Provide an explicit header-safe GitHub credential",
  );
  requireCondition(typeof fetchImpl === "function", "Provide a GitHub fetch transport");

  return async (method, path) => {
    requireRoute(repository, method, path);
    const url = new URL(path, origin);
    requireCondition(
      url.origin === origin && `${url.pathname}${url.search}` === path && !url.username && !url.password && !url.hash,
      "Invalid GitHub review destination",
    );
    try {
      const response = await fetchImpl(url, {
        method: "GET",
        redirect: "error",
        signal: AbortSignal.timeout(requestTimeoutMs),
        headers: {
          authorization: `Bearer ${token}`,
          accept: "application/vnd.github+json",
          "x-github-api-version": "2022-11-28",
        },
      });
      if (!Number.isInteger(response?.status) || response.status < 200 || response.status > 299) {
        try {
          await response?.body?.cancel();
        } catch {
          // HTTP rejection remains authoritative even if closing its unread body fails.
        }
        throw new ReviewHttpError("GitHub review HTTP request was rejected");
      }
      return await readBoundedJson(response);
    } catch (error) {
      if (error instanceof ReviewHttpError) throw error;
      // Fetch and JSON errors may contain the credential or raw server text; never retain their message or cause.
      throw new ReviewHttpError("GitHub review transport or JSON response failed");
    }
  };
}
