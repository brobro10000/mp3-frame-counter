/**
 * Fixed non-destructive production smoke wrapper. Usage: npm run e2e:production with the trusted parent's bounded
 * stdin/private-directory handoff. Delegates only the compiled production role; it neither deploys nor grants human
 * approval. Emits closed fixed-path evidence and a sanitized failure diagnostic, never credentials or child output.
 */
import { runHostedWrapper } from "./run-stage.ts";
import { fileURLToPath } from "node:url";
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  runHostedWrapper("production").catch(() => {
    console.error("Hosted production execution failed");
    process.exitCode = 1;
  });
