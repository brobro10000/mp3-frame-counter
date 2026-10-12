/**
 * Generate one deterministic OpenAPI3 document from createApp/ready without network, listen or prebuilt docs assets.
 * Run after compilation; overwrite only dist/openapi.json. Close the unbound app on success/failure, then propagate.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { createApp } from "../app.ts";

const app = createApp();
try {
  await app.ready();
  const specification = app.swagger();
  const target = new URL("../openapi.json", import.meta.url);
  await mkdir(new URL("../", target), { recursive: true });
  await writeFile(target, `${JSON.stringify(specification, null, 2)}\n`, { mode: 0o644 });
  console.log("OpenAPI generated from the unbound application.");
} finally {
  await app.close();
}
