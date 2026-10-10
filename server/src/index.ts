/**
 * Start the Fastify MP3 API with `node dist/index.js` after `npm run build`. PORT defaults to 3000 and must be 1–65535;
 * readiness completes before listening on 0.0.0.0. SIGTERM/SIGINT stop admission and force-close stragglers by five
 * seconds. Fixed startup/shutdown diagnostics set a failing exit code without reflecting uploads or configuration.
 */
import { createApiServer, parsePort } from "./http.ts";

let port: number | undefined;
try {
  port = parsePort(process.env.PORT);
} catch {
  process.stderr.write("The MP3 API configuration is invalid. PORT must be an integer between 1 and 65535.\n");
  process.exitCode = 1;
}

if (port !== undefined) {
  const service = createApiServer();
  let started = false;
  service.server.on("error", () => {
    if (started) {
      process.stderr.write("The MP3 API could not continue listening.\n");
      process.exitCode = 1;
    }
  });
  /** Both process signals share the idempotent service shutdown and fixed non-sensitive failure diagnostic. */
  const stop = () => {
    void service.shutdown().catch(() => {
      process.stderr.write("The MP3 API could not shut down cleanly.\n");
      process.exitCode = 1;
    });
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
  try {
    await service.listen(port, "0.0.0.0");
    started = true;
    process.stdout.write(`MP3 API listening on port ${port}.\n`);
  } catch {
    process.stderr.write("The MP3 API could not start listening.\n");
    process.exitCode = 1;
    await service.shutdown().catch(() => {});
    process.off("SIGTERM", stop);
    process.off("SIGINT", stop);
  }
}
