/** Own startup readiness and bounded once-only shutdown; importing this module performs no process or socket work. */
import type { FastifyInstance } from "fastify";
import type { Server } from "node:http";
import type { Socket } from "node:net";
import { loadDocs } from "../docs.ts";
import type { UploadTransport } from "./upload-transport.ts";

export interface ApiService {
  readonly server: Server;
  /** Verify readiness and packaged docs before binding the caller-selected address; startup is one-shot. */
  listen(port: number, host: string): Promise<void>;
  /** Stop admission immediately and return the same bounded drain promise on every call. */
  shutdown(): Promise<void>;
}

export interface ShutdownController {
  /** Stop admission synchronously and start at most one socket drain deadline. */
  beginClose(): void;
  /** Clear the owned deadline and release request storage after the server has finished draining. */
  completeClose(): void;
}

/** Create a dormant per-instance shutdown owner; timers start only when closing is requested. */
export function createShutdownController(
  sockets: ReadonlySet<Socket>,
  timeoutMs: number,
  stopAdmission: () => void,
  releaseUploads: () => void,
): ShutdownController {
  let closing = false;
  let complete = false;
  let deadline: NodeJS.Timeout | undefined;
  return {
    beginClose(): void {
      stopAdmission();
      if (closing || complete) return;
      closing = true;
      deadline = setTimeout(() => {
        for (const socket of sockets) socket.destroy();
      }, timeoutMs);
      deadline.unref();
    },
    completeClose(): void {
      if (complete) return;
      complete = true;
      clearTimeout(deadline);
      releaseUploads();
    },
  };
}

/** Wrap one constructed application; docs loading is deliberately absent from ready/inject/OpenAPI generation. */
export function createApiService(app: FastifyInstance, transport: UploadTransport): ApiService {
  let startupPromise: Promise<void> | undefined;
  let shutdownPromise: Promise<void> | undefined;
  return {
    server: app.server,
    listen(port, host): Promise<void> {
      if (transport.isStopping())
        return Promise.reject(new Error("The API has begun shutdown and cannot start listening."));
      if (startupPromise) return Promise.reject(new Error("API startup has already been requested."));
      startupPromise = (async () => {
        await app.ready();
        transport.setDocs(await loadDocs());
        if (transport.isStopping()) throw new Error("The API shut down before readiness completed.");
        await app.listen({ port, host });
      })();
      return startupPromise;
    },
    shutdown(): Promise<void> {
      if (shutdownPromise) return shutdownPromise;
      transport.lifecycle.beginClose();
      shutdownPromise = (async () => {
        try {
          // A readiness race cannot open a listener after this shutdown has completed.
          await startupPromise?.catch(() => {});
          await app.close();
        } finally {
          transport.lifecycle.completeClose();
        }
      })();
      return shutdownPromise;
    },
  };
}
