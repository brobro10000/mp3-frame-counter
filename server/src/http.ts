/**
 * Compatibility facade for the process entry point and existing real-socket tests.
 * Construct one unbound application and lifecycle; no listener, docs reads, process handlers or timers start here.
 */
import { createApp } from "./app.ts";
import { validateApiBudgets } from "./http/config.ts";
import type { ApiBudgets } from "./http/config.ts";
import { createApiService } from "./http/lifecycle.ts";
import type { ApiService } from "./http/lifecycle.ts";
import { createUploadTransport } from "./http/upload-transport.ts";

export { MAX_UPLOAD_BYTES } from "./contracts/mp3.ts";
export { DEFAULT_API_BUDGETS, parsePort } from "./http/config.ts";
export type { ApiBudgets } from "./http/config.ts";
export type { ApiService } from "./http/lifecycle.ts";

/** Preserve the synchronous factory and explicit readiness/listen/shutdown contract for verified callers. */
export function createApiServer(overrides: Partial<ApiBudgets> = {}): ApiService {
  const transport = createUploadTransport(validateApiBudgets(overrides));
  return createApiService(createApp({ transport }), transport);
}
