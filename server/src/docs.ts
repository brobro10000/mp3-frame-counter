/**
 * Load the six generated documentation resources once during API readiness. The closed route map never resolves
 * request paths on disk, evaluates renderer code or exposes the separately retained vendor sources and notices.
 */
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { open } from "node:fs/promises";

interface DocsResource {
  readonly body: Buffer;
  readonly contentType: string;
  readonly contentDisposition?: string;
}

/** Finite exact-path resources held in memory after readiness; requests never trigger disk reads. */
export type DocsResources = ReadonlyMap<string, DocsResource>;

const resources = [
  { path: "/docs/", file: "index.html", contentType: "text/html; charset=utf-8", limit: 262_144 },
  {
    path: "/docs/openapi.yaml",
    file: "openapi.yaml",
    contentType: "application/yaml; charset=utf-8",
    contentDisposition: 'attachment; filename="openapi.yaml"',
    limit: 262_144,
  },
  {
    path: "/docs/assets/redoc.js",
    file: "assets/redoc.js",
    contentType: "application/javascript; charset=utf-8",
    limit: 2_097_152,
    sha256: "21ce5beb19818927f12e2db16e1a332e4f0eac5b8538012b6ecd048585b8cdbf",
  },
  {
    path: "/docs/assets/init.js",
    file: "assets/init.js",
    contentType: "application/javascript; charset=utf-8",
    limit: 262_144,
  },
  { path: "/docs/assets/docs.css", file: "assets/docs.css", contentType: "text/css; charset=utf-8", limit: 262_144 },
  {
    path: "/docs/assets/redoc-logo-mini.svg",
    file: "assets/redoc-logo-mini.svg",
    contentType: "image/svg+xml; charset=utf-8",
    limit: 65_536,
    sha256: "1dab4315f8de2177b2b2726b29e84a26314c69cd27d692228947c0058793d5a7",
  },
] as const;

/** Source imports and the compiled image deliberately consume the same normal build output, without probing. */
function assetRoot(): URL {
  const moduleUrl = new URL(import.meta.url);
  if (moduleUrl.protocol !== "file:") throw new Error("The documentation module layout is unsupported.");
  if (moduleUrl.pathname.endsWith("/server/src/docs.ts")) return new URL("../../dist/docs/", moduleUrl);
  if (moduleUrl.pathname.endsWith("/dist/docs.js")) return new URL("./docs/", moduleUrl);
  throw new Error("The documentation module layout is unsupported.");
}

/** Reject nonfiles and size changes while keeping every allocation and read within the declared resource bound. */
async function readResource(url: URL, limit: number): Promise<Buffer> {
  const handle = await open(url, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size === 0 || stat.size > limit) throw new Error("Invalid documentation resource size.");
    const bytes = Buffer.alloc(stat.size + 1);
    let length = 0;
    while (length < bytes.length) {
      const { bytesRead } = await handle.read(bytes, length, bytes.length - length, null);
      if (bytesRead === 0) break;
      length += bytesRead;
    }
    if (length !== stat.size) throw new Error("The documentation resource changed while loading.");
    return bytes.subarray(0, length);
  } finally {
    await handle.close();
  }
}

/** Fail readiness on missing, oversized, corrupt or incompatible output; a normal build is the only producer. */
export async function loadDocs(): Promise<DocsResources> {
  const root = assetRoot();
  const loaded = new Map<string, DocsResource>();
  for (const resource of resources) {
    const body = await readResource(new URL(resource.file, root), resource.limit);
    const text = new TextDecoder("utf-8", { fatal: true }).decode(body);
    if (!text.trim() || text.includes("\0")) throw new Error("Invalid documentation text.");
    if ("sha256" in resource && createHash("sha256").update(body).digest("hex") !== resource.sha256) {
      throw new Error("The documentation resource identity is invalid.");
    }
    if (resource.file === "index.html" && !/^<!doctype html>/i.test(text.trimStart())) {
      throw new Error("The documentation page is invalid.");
    }
    if (resource.file === "openapi.yaml") {
      const specification: unknown = JSON.parse(text);
      if (
        typeof specification !== "object" ||
        specification === null ||
        !("openapi" in specification) ||
        specification.openapi !== "3.0.3"
      ) {
        throw new Error("The documentation specification is invalid.");
      }
    }
    loaded.set(resource.path, {
      body,
      contentType: resource.contentType,
      ...("contentDisposition" in resource ? { contentDisposition: resource.contentDisposition } : {}),
    });
  }
  return loaded;
}
