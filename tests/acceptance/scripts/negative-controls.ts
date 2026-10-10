/**
 * Usage: node scripts/negative-controls.ts. Prove the same assertions used by E2E reject wrong counts and shapes,
 * and fixture/tool failures cannot be mistaken for behavioral success. Child processes import package code only;
 * no application or successful E2E stub exists. Exits nonzero unless the positive control passes and each deliberate
 * failure exits nonzero with its expected diagnostic. These controls are harness evidence, never product E2E.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const assertions = new URL("../lib/assertions.ts", import.meta.url).href;
const fixtures = new URL("../lib/fixtures.ts", import.meta.url).href;
const launcher = new URL("./run-e2e.ts", import.meta.url).href;
const httpHelpers = new URL("../lib/http.ts", import.meta.url).href;
const response = (body: string) =>
  `({status:200,headers:{'content-type':'application/json'},body:${JSON.stringify(body)}})`;
const prelude = `import {assertFrameResponse} from ${JSON.stringify(assertions)};`;
const controls = [
  { id: "positive", code: `${prelude}assertFrameResponse(${response('{"frameCount":3}')},3)`, exit: 0, marker: "" },
  {
    id: "wrong-count",
    code: `${prelude}assertFrameResponse(${response('{"frameCount":4}')},3)`,
    exit: 1,
    marker: "ERR_ASSERTION",
  },
  {
    id: "wrong-shape",
    code: `${prelude}assertFrameResponse(${response('{"frameCount":3,"extra":true}')},3)`,
    exit: 1,
    marker: "ERR_ASSERTION",
  },
  {
    id: "fixture-failure",
    code: `import {fixtureBytes} from ${JSON.stringify(fixtures)};fixtureBytes('missing-control')`,
    exit: 1,
    marker: "Unknown acceptance fixture: missing-control",
  },
  {
    id: "launcher-missing-target",
    code: `await import(${JSON.stringify(launcher)})`,
    exit: 1,
    marker: "BASE_URL is required",
  },
  {
    id: "premature-upload-success",
    // A disposable incorrect protocol responder proves the abort assertion, not application behavior or E2E success.
    code: `import {createServer} from 'node:http';
      import {abortUpload} from ${JSON.stringify(httpHelpers)};
      import {fixtureBytes} from ${JSON.stringify(fixtures)};
      const server=createServer((request,response)=>request.once('data',()=>response.end('incorrect premature success')));
      await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
      try { await abortUpload('http://127.0.0.1:'+server.address().port,fixtureBytes('three-frames')); }
      finally { server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }`,
    exit: 1,
    marker: "Incomplete upload produced partial success",
  },
];
for (const control of controls) {
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", control.code], {
    encoding: "utf8",
    env: {},
  });
  assert.equal(result.status, control.exit, `${control.id}: wrong subprocess result`);
  if (control.marker) assert.ok(result.stderr.includes(control.marker), `${control.id}: expected diagnostic missing`);
  console.log(
    `${control.id}: observed exit ${result.status}${control.exit ? " (intentional rejection)" : " (positive control)"}`,
  );
}
