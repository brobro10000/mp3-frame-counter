/**
 * Owned docs fixture server for candidate falsification only. Input is a named single fault; returns ephemeral origins,
 * received-request evidence and close(). Reads pinned test-only package/fixture files and transforms exact known bytes
 * using builtins; vendor code executes only in the normal browser. No product imports or writes. Caller must close in
 * finally; unexpected bundle/logo bytes, readiness or cleanup deadline rejects rather than falling back to remote assets.
 */
import http from "node:http";
import { readFileSync } from "node:fs";
import { stringify } from "yaml";
import {
  DOCS_POLICY,
  ROOT_POLICY,
  ORIGINAL_HASH,
  DERIVED_HASH,
  LOGO_HASH,
  sha256,
  same,
  expectedSpec,
  resources,
} from "./docs-contract.mjs";
import { within } from "./transport.ts";
/**
 * Build a fresh path-to-Buffer asset map from pinned local Redoc, logo and independent specification bytes.
 * Verifies the original bundle, exact two-operation derivative and logo identities before returning; unexpected
 * files/bytes or serialization failures throw. Reads local files only, executes no vendor code and writes no files.
 */
export function fixtureAssets() {
  const source = readFileSync(new URL("../node_modules/redoc/bundles/redoc.standalone.js", import.meta.url));
  same(sha256(source), ORIGINAL_HASH, "ORIGINAL_IDENTITY");
  const text = source.toString("utf8"),
    url = "https://cdn.redoc.ly/redoc/logo-mini.svg",
    tail = "\n//# sourceMappingURL=redoc.standalone.js.map";
  same(text.split(url).length, 2, "LOGO_REPLACEMENT_COUNT");
  same(text.endsWith(tail), true, "MAP_SUFFIX");
  const derived = Buffer.from(text.slice(0, -tail.length).replace(url, "/docs/assets/redoc-logo-mini.svg"));
  same(sha256(derived), DERIVED_HASH, "DERIVED_IDENTITY");
  const logo = readFileSync(new URL("../fixtures/docs/redoc-logo-mini.svg", import.meta.url));
  same(sha256(logo), LOGO_HASH, "LOGO_IDENTITY");
  const init =
    "Redoc.init('/docs/openapi.yaml',{sanitize:true,disableSearch:true,hideDownloadButtons:true,theme:{typography:{fontFamily:'system-ui, sans-serif',headings:{fontFamily:'system-ui, sans-serif'},code:{fontFamily:'monospace'}}}},document.getElementById('redoc'));";
  return new Map([
    [
      "/docs/",
      Buffer.from(
        '<!doctype html><html><head><meta charset="utf-8"><title>Independent docs control</title><link rel="stylesheet" href="/docs/assets/docs.css"></head><body><div id="redoc"></div><script src="/docs/assets/redoc.js"></script><script src="/docs/assets/init.js"></script></body></html>',
      ),
    ],
    ["/docs/openapi.yaml", Buffer.from(stringify(expectedSpec))],
    ["/docs/assets/redoc.js", derived],
    ["/docs/assets/init.js", Buffer.from(init)],
    ["/docs/assets/docs.css", Buffer.from("body { margin: 0; }\n")],
    ["/docs/assets/redoc-logo-mini.svg", logo],
  ]);
}
/**
 * Bind an owned Node HTTP server to an ephemeral 127.0.0.1 port and resolve its origin string within five seconds.
 * Rejects on listen error/deadline. A timeout does not cancel listen; caller must close the server even on failure.
 */
export async function listen(server) {
  await within(
    new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    }),
    5000,
    "FIXTURE_LISTEN",
  );
  return "http://127.0.0.1:" + server.address().port;
}
/**
 * Force-close an owned server's connections, request listener close and resolve when its callback fires.
 * API errors or the five-second observation deadline reject; timeout does not cancel the pending close operation.
 */
export async function closeServer(server) {
  server.closeAllConnections();
  await within(new Promise((resolve) => server.close(resolve)), 5000, "FIXTURE_CLOSE");
}
/**
 * Start an owned docs server and a second-loopback receipt sink for a positive fixture or one named fault.
 * @param fault - Control-runner fault name, default positive; caller must use a defined name, not an arbitrary string.
 * @returns Both origins, the live sink-receipts array and an async close method that attempts both server cleanups.
 * This factory does not validate the fault inventory. Artifact/readiness failures reject; failed startup attempts
 * cleanup of both servers, and cleanup rejection takes precedence. After success, caller must await close in finally.
 * No application target is contacted, vendor code is generated but not executed, and no files are written.
 */
export async function docsFixture(fault = "positive") {
  const assets = fixtureAssets(),
    receipts = [];
  let origin, sinkOrigin;
  const sink = http.createServer((req, res) => {
    receipts.push({ path: req.url, method: req.method });
    req.resume();
    res.end("Owned foreign destination");
  });
  const altered = structuredClone(expectedSpec);
  if (fault === "wrong-success") altered.components.schemas.FrameCount.properties.extra = { type: "string" };
  if (fault === "wrong-metadata-property")
    altered.components.schemas.FrameCount.properties.description = { type: "string" };
  if (fault === "wrong-server") altered.servers = [{ url: "https://invalid.example/api" }];
  if (fault === "wrong-security") altered.security = [{ bearerAuth: [] }];
  if (fault === "wrong-media")
    delete altered.paths["/file-upload"].post.requestBody.content["application/octet-stream"];
  if (fault === "wrong-limit") altered.paths["/file-upload"].post["x-max-body-bytes"] = 20971519;
  if (fault === "wrong-head")
    altered.paths["/healthz"].head.responses["405"].content = { "application/json": { schema: { type: "string" } } };
  if (fault.startsWith("wrong-")) assets.set("/docs/openapi.yaml", Buffer.from(stringify(altered)));
  if (fault === "missing-logo") assets.delete("/docs/assets/redoc-logo-mini.svg");
  if (fault === "wrong-logo")
    assets.set(
      "/docs/assets/redoc-logo-mini.svg",
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'),
    );
  if (fault === "missing-renderer")
    assets.set(
      "/docs/",
      Buffer.from(
        '<!doctype html><section data-section-id="operation/countFrames"><p>/file-upload /healthz audio/mpeg application/octet-stream frameCount 20971520</p><div><button>400</button><p>Description only</p></div></section>',
      ),
    );
  /**
   * Serve fixed public-contract routes with one selected fault; consume input without reflecting it into responses.
   * Raw duplicate-policy headers and HEAD body suppression are intentional evidence. Control-only script/style routes
   * support the named faults; their strings are generated here and run only later in the caller's owned browser.
   */
  const server = http.createServer((req, res) => {
    req.resume();
    const path = new URL(req.url, origin).pathname;
    let csp = path === "/" ? ROOT_POLICY : DOCS_POLICY;
    if (fault === "root-policy-leak" && path === "/") csp = DOCS_POLICY;
    if (fault === "bad-style-hash")
      csp = csp.replace("QMIg+bpjm3JdElJ388KYke01izlUW0UoNOeKjpMxdgc=", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
    const headers = {
      "Content-Security-Policy": csp,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    };
    if (path !== "/") {
      if (fault === "missing-csp") delete headers["Content-Security-Policy"];
      if (fault === "duplicate-csp") headers["Content-Security-Policy"] = [csp, csp];
      if (fault === "tighter-second") headers["Content-Security-Policy"] = [csp, "script-src 'none'"];
      if (fault === "looser-second") headers["Content-Security-Policy"] = ["script-src 'none'", csp];
      if (fault === "report-only") headers["Content-Security-Policy-Report-Only"] = csp;
      if (fault === "missing-header") delete headers["Cache-Control"];
    }
    const send = (status, body, type) => {
      headers["Content-Type"] = type;
      res.writeHead(status, headers);
      res.end(req.method === "HEAD" ? undefined : body);
    };
    if (path === "/") {
      send(200, "<!doctype html><title>Preserved upload policy sentinel</title><p>Owned fixture</p>", "text/html");
      return;
    }
    if (path === "/docs/control.js") {
      // Arm on the real response expansion; the helper signals only after the screenshot completes.
      const action =
        fault === "late-meta"
          ? "const m=document.createElement('meta');m.httpEquiv='Content-Security-Policy';m.content=\"default-src 'self'\";document.head.append(m)"
          : "throw Error('owned-late-page-error')";
      const script =
        "let armed=false;document.addEventListener('click',e=>{if(e.target.closest('button')?.textContent.trim().startsWith('400'))armed=true},{once:true});" +
        "document.addEventListener('docs-control-retained-window',()=>{if(!armed)return;armed=false;" +
        action +
        "},{once:true});";
      send(200, script, "application/javascript");
      return;
    }
    if (path === "/docs/control.css") {
      send(
        200,
        '@font-face{font-family:ForeignProbe;src:url("' +
          sinkOrigin +
          '/foreign-font")}#font-probe{font-family:ForeignProbe}',
        "text/css",
      );
      return;
    }
    const known = path === "/docs" || assets.has(path) || path === "/docs/assets/redoc-logo-mini.svg";
    if (!known || (fault === "missing-logo" && path.endsWith(".svg"))) {
      send(404, '{"error":"Documentation resource not found"}', "application/json");
      return;
    }
    if (!["GET", "HEAD"].includes(req.method)) {
      headers.Allow = "GET, HEAD";
      send(405, '{"error":"Documentation method not allowed"}', "application/json");
      return;
    }
    if (path === "/docs") {
      headers.Location = "/docs/";
      send(308, "", "text/plain");
      return;
    }
    if (path.endsWith(".yaml")) headers["Content-Disposition"] = 'attachment; filename="openapi.yaml"';
    let bytes = assets.get(path);
    const media = resources.find(([resource]) => resource === path)[1];
    if (fault === "foreign-reference" && path.endsWith(".yaml")) {
      const spec = structuredClone(expectedSpec);
      spec.components.schemas.FrameCount.$ref = sinkOrigin + "/foreign-reference";
      bytes = Buffer.from(stringify(spec));
    }
    if (path === "/docs/") {
      const extra =
        {
          "foreign-script": '<script src="' + sinkOrigin + '/foreign-script"></script>',
          "foreign-font": '<link rel="stylesheet" href="/docs/control.css"><div id="font-probe">Probe</div>',
          "style-element": "<style>body{outline:1px solid red}</style>",
          "style-attribute": '<div style="color:red">Probe</div>',
          "late-error": '<script src="/docs/control.js"></script>',
          "late-meta": '<script src="/docs/control.js"></script>',
          "meta-policy": '<meta http-equiv="Content-Security-Policy" content="script-src \'none\'">',
        }[fault] ?? "";
      bytes = Buffer.concat([bytes, Buffer.from(extra)]);
    }
    send(200, bytes, media);
  });
  try {
    sinkOrigin = await listen(sink);
    origin = await listen(server);
  } catch (error) {
    const outcomes = await Promise.allSettled([closeServer(server), closeServer(sink)]);
    const failed = outcomes.find((x) => x.status === "rejected");
    if (failed) throw failed.reason;
    throw error;
  }
  return {
    origin,
    sinkOrigin,
    receipts,
    /** Attempt both owned server closes even if one rejects; resolve without a value or rethrow a cleanup failure. */
    async close() {
      const outcomes = await Promise.allSettled([closeServer(server), closeServer(sink)]);
      const failed = outcomes.find((x) => x.status === "rejected");
      if (failed) throw failed.reason;
    },
  };
}
