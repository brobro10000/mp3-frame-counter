/**
 * Fixed authenticated hosted HTTP/1.1 boundary. Inputs are issued targets, bounded relative paths and fixture bytes;
 * requests preserve TLS verification, raw response headers, actual client framing and owned abort behavior. No redirects,
 * pools or body retries occur. Fixed sanitized failures latch through idempotent cleanup; imports perform no I/O.
 */
import http from "node:http";
import https from "node:https";
import type { ClientRequest } from "node:http";
import { hostedFailure, hostedFailureCode, invocationHeaders } from "./hosted-target.ts";
import type { DocsResponse, FailureCode, Finalization, HostedResponse, HostedTarget } from "./hosted-types.ts";
export type HostedMethod = "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "OPTIONS" | "DELETE";
export interface HostedHttp {
  request(
    path: string,
    options?: { method?: HostedMethod; headers?: Record<string, string>; body?: Buffer; chunked?: boolean },
  ): Promise<HostedResponse>;
  docs(path: string, method?: HostedMethod): Promise<DocsResponse>;
  abortUpload(validPrefix: Buffer): Promise<void>;
  close(): Promise<Finalization>;
}
const methods = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "OPTIONS", "DELETE"]);
/** Open no connection until each operation validates its fixed-origin request; close owns every created socket. */
export function createHostedHttp(target: HostedTarget): HostedHttp {
  const origin = target?.publicInput?.target?.origin;
  if (typeof origin !== "string") throw hostedFailure("IDENTITY");
  invocationHeaders(target, `${origin}/`, {});
  const failures = new Set<FailureCode>(),
    active = new Set<ClientRequest>(),
    closing = new Set<Promise<void>>();
  let closed = false,
    finished: Promise<Finalization> | undefined;
  /** Retain a fixed failure until finalization, then throw a sanitized diagnostic to the caller. */
  const fail = (code: FailureCode): never => {
    failures.add(code);
    throw hostedFailure(code);
  };
  /** Resolve a bounded slash-relative path; reject closed use or any origin escape before adding credentials. */
  function destination(path: string): URL {
    if (
      closed ||
      typeof path !== "string" ||
      path.length > 2048 ||
      !path.startsWith("/") ||
      path.startsWith("//") ||
      /[\\\x00-\x20\x7f#]/.test(path)
    )
      return fail("HTTP");
    const url = new URL(path, origin);
    if (url.origin !== origin) return fail("FOREIGN_ATTEMPT");
    return url;
  }
  /** Own one nonpooled request, raw response bytes, fixed framing and an absolute deadline; never follow redirects. */
  function start(
    url: URL,
    method: HostedMethod,
    headers: Record<string, string>,
    limit: number,
    deadline: number,
    body: Buffer,
    chunked: boolean,
    abort = false,
  ): Promise<{ response: DocsResponse; sentBytes: number; contentLengthSent: boolean; transferEncoding?: string }> {
    if (!methods.has(method)) return Promise.reject(hostedFailure("HTTP"));
    const auth = invocationHeaders(target, url.href, headers);
    if (abort) auth["Content-Length"] = "1048576";
    else if (chunked) auth["Transfer-Encoding"] = "chunked";
    else if (body.length || method === "POST") auth["Content-Length"] = String(body.length);
    return new Promise((resolve, reject) => {
      let settled = false,
        intentional = false,
        sentBytes = 0,
        observation: ReturnType<typeof setTimeout> | undefined;
      let req!: ClientRequest;
      /** Complete once, cancel timers and destroy the owned request while retaining its actual-close obligation. */
      const settle = (code?: FailureCode, value?: DocsResponse) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        clearTimeout(observation);
        active.delete(req);
        if (code) {
          failures.add(code);
          reject(hostedFailure(code));
        } else
          resolve({
            response: value ?? { status: 0, headers: [], body: Buffer.alloc(0) },
            sentBytes,
            contentLengthSent: req.hasHeader("content-length"),
            transferEncoding: req.getHeader("transfer-encoding")?.toString(),
          });
        req.destroy();
      };
      const timer = setTimeout(() => settle("HTTP"), deadline);
      try {
        req = (url.protocol === "https:" ? https : http).request(
          url,
          { method, headers: auth, agent: false },
          (res) => {
            const chunks: Buffer[] = [];
            let size = 0;
            const raw = res.rawHeaders.flatMap((name, index) =>
              index % 2 ? [] : [{ name, value: res.rawHeaders[index + 1] }],
            );
            const locations = raw.filter(({ name }) => name.toLowerCase() === "location");
            if (locations.length) {
              const canonical =
                url.pathname === "/docs" &&
                (method === "GET" || method === "HEAD") &&
                res.statusCode === 308 &&
                locations.length === 1 &&
                locations[0].value === "/docs/";
              if (!canonical) {
                settle("REDIRECT");
                res.destroy();
                return;
              }
            }
            if (abort && res.statusCode === 200) {
              settle("ASSERTION");
              res.destroy();
              return;
            }
            res.on("data", (part: Buffer) => {
              size += part.length;
              if (size > limit) {
                settle("RESPONSE_BOUND");
                res.destroy();
              } else chunks.push(part);
            });
            res.once("error", () => settle("HTTP"));
            res.once("aborted", () => settle("HTTP"));
            res.once("end", () => {
              if (!abort) settle(undefined, { status: res.statusCode ?? 0, headers: raw, body: Buffer.concat(chunks) });
            });
          },
        );
        active.add(req);
        let resolveClose!: () => void;
        const closingPromise = new Promise<void>((done) => {
          resolveClose = done;
        });
        closing.add(closingPromise);
        req.once("close", () => {
          active.delete(req);
          closing.delete(closingPromise);
          resolveClose();
          if (!settled && !intentional) settle("HTTP");
        });
        req.once("error", (error: NodeJS.ErrnoException) => {
          if (intentional) return;
          const code = error.code ?? "";
          settle(/CERT|TLS|SSL|SELF_SIGNED|UNABLE_TO_VERIFY/.test(code) ? "TLS" : "HTTP");
        });
        if (abort) {
          sentBytes = body.length;
          req.write(body, () => {
            if (settled) return;
            observation = setTimeout(() => {
              intentional = true;
              settle();
            }, 500);
          });
        } else if (!chunked) {
          sentBytes = body.length;
          req.end(body);
        } else {
          let offset = 0;
          /** Write fixed 64 KiB chunks with real backpressure; stop on settlement or socket destruction. */
          const write = () => {
            while (offset < body.length && !req.destroyed && !settled) {
              const part = body.subarray(offset, Math.min(offset + 65536, body.length));
              offset += part.length;
              sentBytes += part.length;
              if (!req.write(part)) {
                req.once("drain", write);
                return;
              }
            }
            if (!req.destroyed && !settled) req.end();
          };
          write();
        }
      } catch {
        clearTimeout(timer);
        clearTimeout(observation);
        if (req!) req.destroy();
        failures.add("HTTP");
        reject(hostedFailure("HTTP"));
      }
    });
  }
  /** Validate closed caller options, preserve response fields and expose the actual framing sent by this client. */
  async function request(path: string, options: Parameters<HostedHttp["request"]>[1] = {}): Promise<HostedResponse> {
    try {
      if (
        !options ||
        typeof options !== "object" ||
        Array.isArray(options) ||
        Object.keys(options).some((k) => !["method", "headers", "body", "chunked"].includes(k))
      )
        return fail("HTTP");
      const url = destination(path),
        method = options.method ?? "GET";
      if (!methods.has(method)) return fail("HTTP");
      if (options.chunked !== undefined && typeof options.chunked !== "boolean") return fail("HTTP");
      const body = options.body ?? Buffer.alloc(0);
      if (!Buffer.isBuffer(body) || body.length > 20971521) return fail("HTTP");
      const headers = options.headers ?? {};
      if (!headers || typeof headers !== "object" || Array.isArray(headers) || Object.keys(headers).length > 20)
        return fail("HTTP");
      const seen = new Set<string>();
      for (const [name, value] of Object.entries(headers)) {
        const key = name.toLowerCase();
        if (
          seen.has(key) ||
          !/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name) ||
          typeof value !== "string" ||
          value.length > 2048 ||
          /[\r\n\x00]/.test(value) ||
          [
            "authorization",
            "x-serverless-authorization",
            "proxy-authorization",
            "host",
            "content-length",
            "transfer-encoding",
            "connection",
            "cookie",
            "expect",
          ].includes(key)
        )
          return fail("HTTP");
        seen.add(key);
      }
      const value = await start(url, method, headers, 65536, 70000, body, options.chunked ?? false);
      const projected: Record<string, string | string[] | undefined> = {};
      for (const { name, value: header } of value.response.headers) {
        const key = name.toLowerCase(),
          prior = projected[key];
        projected[key] = prior === undefined ? header : Array.isArray(prior) ? [...prior, header] : [prior, header];
      }
      return {
        headers: projected,
        status: value.response.status,
        body: value.response.body.toString("utf8"),
        sentBytes: value.sentBytes,
        contentLengthSent: value.contentLengthSent,
        transferEncoding: value.transferEncoding,
      };
    } catch (error) {
      const code = hostedFailureCode(error, "HTTP");
      failures.add(code);
      throw hostedFailure(code);
    }
  }
  /** Project the latest terminal latches even if a caller attempts invalid reuse after acknowledged cleanup. */
  const finalization = (): Finalization =>
    Object.freeze({
      cleanup: failures.has("CLEANUP") ? "failed" : "passed",
      failures: Object.freeze([...failures].sort()),
    });
  return {
    request,
    /** Fetch bounded docs bytes with duplicate headers intact, using the same authenticated transport boundary. */
    async docs(path, method = "GET") {
      try {
        return (await start(destination(path), method, {}, 2 * 1024 * 1024, 5000, Buffer.alloc(0), false)).response;
      } catch (error) {
        const code = hostedFailureCode(error, "HTTP");
        failures.add(code);
        throw hostedFailure(code);
      }
    },
    /** Hold a declared incomplete upload for 500 ms, reject premature success, then destroy only its owned request. */
    async abortUpload(prefix) {
      try {
        if (!Buffer.isBuffer(prefix) || prefix.length === 0 || prefix.length >= 1048576) return fail("HTTP");
        await start(
          destination("/file-upload"),
          "POST",
          { "Content-Type": "audio/mpeg" },
          65536,
          10000,
          prefix,
          false,
          true,
        );
      } catch (error) {
        const code = hostedFailureCode(error, "HTTP");
        failures.add(code);
        throw hostedFailure(code);
      }
    },
    /** Refuse new work, cancel unfinished requests and await actual closes; timeout or pending work cannot pass. */
    close() {
      if (finished) return finished.then(finalization);
      closed = true;
      finished = (async () => {
        if (active.size) {
          failures.add("CLEANUP");
          for (const req of active) req.destroy();
        }
        let timer: ReturnType<typeof setTimeout> | undefined;
        const complete = await Promise.race([
          Promise.all([...closing]).then(() => true),
          new Promise<boolean>((done) => {
            timer = setTimeout(() => done(false), 5000);
          }),
        ]);
        clearTimeout(timer);
        if (!complete) failures.add("CLEANUP");
        return finalization();
      })();
      return finished;
    },
  };
}
