/** Usage: node scripts/check-openapi.ts. Read the local JSON fixture and run bounded consistency assertions; no network. */
import { readFileSync } from "node:fs";
import { assertOpenApi } from "../lib/openapi.ts";
assertOpenApi(JSON.parse(readFileSync(new URL("../fixtures/openapi.json", import.meta.url), "utf8")));
console.log(
  "Local OpenAPI 3.0.3 binary contract consistency passed; not runtime conformance or a general schema validator.",
);
