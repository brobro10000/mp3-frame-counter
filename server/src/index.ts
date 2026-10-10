/**
 * Start the native MP3 API with `node dist/index.js` after `npm run build`. PORT defaults to 3000 and must be 1–65535;
 * the listener binds 0.0.0.0 for container networking. SIGTERM/SIGINT stop admission, drain and force-close by five
 * seconds. Startup/shutdown failures print fixed diagnostics and set a failing exit code; uploads are never logged.
 */
import { createApiServer, parsePort } from "./http.ts";

try {
  const port = parsePort(process.env.PORT);
  const service = createApiServer();
  service.server.on("error", () => {
    process.stderr.write("The MP3 API could not start or continue listening.\n");
    process.exitCode = 1;
  });
  service.server.listen(port, "0.0.0.0", () => {
    process.stdout.write(`MP3 API listening on port ${port}.\n`);
  });
  const stop = () => {
    void service.shutdown().catch(() => {
      process.stderr.write("The MP3 API could not shut down cleanly.\n");
      process.exitCode = 1;
    });
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
} catch {
  process.stderr.write("The MP3 API configuration is invalid. PORT must be an integer between 1 and 65535.\n");
  process.exitCode = 1;
}
