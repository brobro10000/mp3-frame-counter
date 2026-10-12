/**
 * Construct the unbound Fastify application. Registration and ready/inject never require docs or process hooks.
 *
 * raw URI/method guard -> onRequest: validate/admit -> bounded body parser
 *                                                     |
 *                                                     v
 *                                       normalize/validate -> analyze once
 *                                                     |
 *                          +--------------------------+---------------------+
 *                          |                                                |
 *                     project success                                classify failure
 *                          |                                                |
 *                  selected serializer                       public error DTO + writer
 *                          |                                                |
 *                          +------------> complete / abort <----------------+
 *                                             |
 *                                release slot/storage/timers ONCE
 */
import Fastify from "fastify";
import type { FastifyInstance, FastifyPluginCallback } from "fastify";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { ApiErrorSchema } from "./contracts/errors.ts";
import { DetailedFrameCountSchema, FrameCountSchema, HealthSchema, MAX_UPLOAD_BYTES } from "./contracts/mp3.ts";
import { registerOpenApi } from "./documentation/openapi.ts";
import { validateApiBudgets } from "./http/config.ts";
import type { ApiBudgets } from "./http/config.ts";
import { apiHeaders, classifyError, RequestValidationError } from "./http/errors.ts";
import { createUploadTransport, registerUploadTransport } from "./http/upload-transport.ts";
import type { UploadTransport } from "./http/upload-transport.ts";
import type { analyzeMp3 } from "./modules/mp3/analyze.ts";
import { registerMp3Routes } from "./modules/mp3/routes.ts";

/** Optional per-instance dependencies; construction performs no listening, docs reads or process registration. */
export interface AppOptions {
  /** Positive safe-integer resource overrides, independently validated for this instance. */
  readonly budgets?: Partial<ApiBudgets>;
  /** Pure analyzer dependency for controlled output/error verification. */
  readonly analyze?: typeof analyzeMp3;
  /** Per-instance transport for the compatibility lifecycle; do not combine with budget overrides. */
  readonly transport?: UploadTransport;
}

interface UploadPluginOptions {
  readonly transport: UploadTransport;
  readonly analyze?: typeof analyzeMp3;
}

/** Encapsulate admission and the original collector; health/docs remain outside this child scope. */
const uploadPlugin: FastifyPluginCallback<UploadPluginOptions> = (app, options, done) => {
  registerUploadTransport(app, options.transport);
  registerMp3Routes(app, options);
  done();
};

/** Register health after Swagger is installed, outside upload admission and byte collection. */
const healthPlugin: FastifyPluginCallback = (app, _options, done) => {
  app
    .withTypeProvider<TypeBoxTypeProvider>()
    .get(
      "/healthz",
      { schema: { operationId: "serviceHealth", response: { 200: { $ref: "Health#" } } } },
      (_request, reply) => reply.send({ status: "ok" }),
    );
  done();
};

/**
 * Return an independent unbound application; callers own ready/inject/close or use the production facade.
 * Invalid budgets or simultaneous transport/budget overrides throw before an application can accept requests.
 */
export function createApp(options: AppOptions = {}): FastifyInstance {
  if (options.transport && options.budgets) throw new Error("Pass transport or budget overrides, not both.");
  const transport = options.transport ?? createUploadTransport(validateApiBudgets(options.budgets));
  const app = Fastify({
    logger: false,
    exposeHeadRoutes: false,
    bodyLimit: MAX_UPLOAD_BYTES,
    return503OnClosing: false,
    forceCloseConnections: "idle",
    serverFactory: transport.serverFactory,
  });

  // Register each canonical ID once. Route refs prevent duplicate embedded ID compilation.
  for (const schema of [FrameCountSchema, DetailedFrameCountSchema, ApiErrorSchema, HealthSchema])
    app.addSchema(schema);
  app.setSchemaErrorFormatter(() => new RequestValidationError());
  app.setErrorHandler((error, request, reply) => transport.reject(request, reply, classifyError(error)));
  app.setNotFoundHandler((request, reply) => {
    const pathname = (request.raw.url ?? "").split("?", 1)[0];
    const allow = pathname === "/file-upload" ? "POST" : pathname === "/healthz" ? "GET" : undefined;
    if (allow) reply.header("Allow", allow);
    transport.reject(request, reply, allow ? "METHOD_NOT_ALLOWED" : "ROUTE_NOT_FOUND");
  });
  app.addHook("onRequest", (request, reply, done) => {
    apiHeaders(reply);
    // Injection bypasses serverFactory, so matched routes must also preserve exact raw spelling.
    const pathname = (request.raw.url ?? "").split("?", 1)[0];
    if (pathname !== "/file-upload" && pathname !== "/healthz") {
      transport.reject(request, reply, "ROUTE_NOT_FOUND");
      return;
    }
    const allowed = pathname === "/healthz" ? "GET" : "POST";
    if (request.raw.method !== allowed) {
      reply.header("Allow", allowed);
      // The raw dispatch owns this on sockets; injection must retain precedence before any parser too.
      transport.reject(request, reply, "METHOD_NOT_ALLOWED");
      return;
    }
    if (request.raw.method === "GET") {
      if (request.headers["transfer-encoding"] || Number(request.headers["content-length"] ?? 0) > 0) {
        reply.header("Connection", "close");
      }
      request.raw.on("error", () => {});
    }
    done();
  });
  app.addHook("preClose", (done) => {
    transport.lifecycle.beginClose();
    done();
  });
  app.addHook("onClose", (_instance, done) => {
    transport.lifecycle.completeClose();
    done();
  });

  // Swagger must observe these same registrations before routes are enqueued.
  registerOpenApi(app);
  app.register(uploadPlugin, {
    transport,
    ...(options.analyze === undefined ? {} : { analyze: options.analyze }),
  });
  app.register(healthPlugin);
  return app;
}
