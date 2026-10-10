/**
 * Send external raw HTTP requests, including genuine chunked uploads with no Content-Length and deliberate aborts.
 * Inputs are validated target URLs, headers and test bytes; effects are network traffic only. Collects bounded
 * response bytes, preserves status/headers, and rejects timeout/transport failures unless a complete response exists.
 */
import http from "node:http";
import https from "node:https";
import type { ResponseData } from "./assertions.ts";

export async function rawRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: Buffer;
    chunked?: boolean;
    timeout?: number;
  } = {},
): Promise<ResponseData & { sentBytes: number; contentLengthSent: boolean; transferEncoding?: string }> {
  const parsed = new URL(url);
  const send = parsed.protocol === "https:" ? https.request : http.request;
  return new Promise((resolve, reject) => {
    let completeResponse = false;
    let sentBytes = 0;
    const headers = { ...options.headers };
    if (options.body && !options.chunked) headers["Content-Length"] = String(options.body.length);
    if (options.chunked) headers["Transfer-Encoding"] = "chunked";
    const request = send(parsed, { method: options.method ?? "GET", headers, agent: false }, (response) => {
      const chunks: Buffer[] = [];
      let bytes = 0;
      response.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > 64 * 1024) response.destroy(new Error("Acceptance response exceeded 64 KiB"));
        else chunks.push(chunk);
      });
      response.on("error", reject);
      response.on("end", () => {
        completeResponse = true;
        request.destroy();
        resolve({
          status: response.statusCode ?? 0,
          headers: response.headers,
          body: Buffer.concat(chunks).toString("utf8"),
          sentBytes,
          contentLengthSent: request.hasHeader("content-length"),
          transferEncoding: request.getHeader("transfer-encoding")?.toString(),
        });
      });
    });
    request.setTimeout(options.timeout ?? 70_000, () => request.destroy(new Error("Acceptance request timed out")));
    request.on("error", (error) => {
      if (!completeResponse) reject(error);
    });
    const body = options.body ?? Buffer.alloc(0);
    if (!options.chunked) {
      sentBytes = body.length;
      request.end(body);
      return;
    }
    let offset = 0;
    const write = () => {
      while (offset < body.length && !request.destroyed) {
        const chunk = body.subarray(offset, Math.min(offset + 64 * 1024, body.length));
        offset += chunk.length;
        sentBytes += chunk.length;
        if (!request.write(chunk)) {
          request.once("drain", write);
          return;
        }
      }
      if (!request.destroyed) request.end();
    };
    write();
  });
}

export async function abortUpload(url: string, validPrefix: Buffer): Promise<void> {
  const parsed = new URL(url);
  const send = parsed.protocol === "https:" ? https.request : http.request;
  await new Promise<void>((resolve, reject) => {
    let aborted = false;
    let observation: ReturnType<typeof setTimeout> | undefined;
    const request = send(
      parsed,
      {
        method: "POST",
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": String(1024 * 1024),
        },
        agent: false,
      },
      (response) => {
        response.resume();
        if (response.statusCode === 200) {
          clearTimeout(observation);
          request.destroy();
          reject(new Error("Incomplete upload produced partial success"));
        }
      },
    );
    request.setTimeout(10_000, () => request.destroy(new Error("Abort control timed out")));
    request.once("error", (error) => {
      clearTimeout(observation);
      if (!aborted) reject(error);
    });
    request.once("close", () => {
      if (!aborted) {
        clearTimeout(observation);
        reject(new Error("Incomplete request closed before the intentional abort"));
      }
    });
    request.write(validPrefix, () => {
      // A deliberate 500 ms fault-observation window leaves valid complete frames inside an incomplete request.
      // A server that counts each received chunk prematurely can now emit200 before the client deliberately aborts.
      // This bounded observation is not an arbitrary wait for successful application behavior.
      observation = setTimeout(() => {
        aborted = true;
        request.destroy();
        resolve();
      }, 500);
    });
  });
}
