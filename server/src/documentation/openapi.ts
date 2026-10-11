/** Generate documentation from the same registered schemas; binary/query examples are docs-only projections. */
import swagger from "@fastify/swagger";
import type { FastifyInstance } from "fastify";
import { PUBLIC_ERRORS, projectPublicError, isPublicErrorCode } from "../contracts/errors.ts";
import { isUploadSuccess, MAX_UPLOAD_BYTES } from "../contracts/mp3.ts";

/** Narrow an ordinary JSON object for the finite documentation transform. No resolver, evaluation or runtime mutation. */
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Clone schemas before mapping TypeBox literal const to OpenAPI3 enum and dropping non-OpenAPI identifiers. */
function openApiProjection<T>(value: T): T {
  const clone = structuredClone(value);
  const visit = (child: unknown): void => {
    if (Array.isArray(child)) {
      child.forEach(visit);
      return;
    }
    if (!record(child)) return;
    if (Object.hasOwn(child, "const")) {
      child.enum = [child.const];
      delete child.const;
    }
    // TypeBox's finite enums already constrain values; explicit primitive types make Redoc's tables useful.
    if (child.type === undefined && Array.isArray(child.enum) && child.enum.length > 0) {
      const values: unknown[] = child.enum;
      if (values.every((value) => typeof value === "string")) child.type = "string";
      else if (values.every((value) => typeof value === "number" && Number.isSafeInteger(value)))
        child.type = "integer";
      else if (values.every((value) => typeof value === "boolean")) child.type = "boolean";
    }
    delete child.$id;
    delete child.$schema;
    Object.values(child).forEach(visit);
  };
  visit(clone);
  return clone;
}

/** Canonical examples validate through the same interpreted success guard; no sample value enters the analyzer. */
function examples() {
  const detailed = {
    frameCount: 6089,
    analysis: {
      physicalFrameCount: 6090,
      excludedMetadataFrameCount: 1,
      xing: {
        status: "present",
        marker: "Xing",
        frameOffsetBytes: 44,
        frameLengthBytes: 208,
        markerOffsetBytes: 80,
        flags: 15,
        declaredAudioFrameCount: 6089,
        declaredMpegStreamByteCount: 1458128,
        seekTableEntryCount: 100,
        qualityValue: 0,
      },
      warnings: [],
    },
  };
  if (!isUploadSuccess(detailed)) throw new Error("Invalid trusted documentation example.");
  return {
    default: { summary: "Default: walked audio count", value: { frameCount: 6089 } },
    detailed: { summary: "details=true: audio, physical and Xing diagnostics", value: detailed },
    withoutCarrier: {
      summary: "details=true: no metadata carrier",
      value: {
        frameCount: 2,
        analysis: { physicalFrameCount: 2, excludedMetadataFrameCount: 0, xing: { status: "absent" }, warnings: [] },
      },
    },
  };
}

/** Register dynamic Swagger before features; constructing/ready never loads docs assets or binds a socket. */
export function registerOpenApi(app: FastifyInstance): void {
  app.register(swagger, {
    mode: "dynamic",
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "MP3 audio frame counter API",
        version: "backend-audio-v1",
        description:
          "Handwritten MPEG-1 Layer III boundary counting. A supported leading Xing/Info carrier is excluded " +
          "from the audio result and included in physical diagnostics. Raw bounded uploads are not retained. " +
          "Use POST /file-upload to analyze a file, or the [upload page](/) for an interactive client. " +
          "This is a reference, not an upload form. Health checks describe the responding container only; " +
          "method rejection entries document unsupported requests, not additional application features.",
      },
      servers: [{ url: "/", description: "Same-origin ingress" }],
      tags: [
        { name: "MP3", description: "Analyze a raw MP3 file without decoding its audio." },
        { name: "Health", description: "Container-local liveness; not an end-to-end analysis check." },
        { name: "Method rejections", description: "Unsupported methods return 405; HEAD has no response body." },
      ],
    },
    refResolver: {
      buildLocalReference: (json, _uri, _fragment, index) =>
        typeof json.$id === "string" ? json.$id : `schema${index}`,
    },
    transformObject: (input) => {
      if (!("openapiObject" in input)) throw new Error("OpenAPI3 generation is required.");
      const doc = openApiProjection(input.openapiObject);
      if (!doc.paths) throw new Error("Registered API paths were not discovered.");
      const operation = doc.paths?.["/file-upload"]?.post;
      if (!operation) throw new Error("Upload route was not discovered.");
      const health = doc.paths?.["/healthz"]?.get;
      if (!health) throw new Error("Health route was not discovered.");
      health.tags = ["Health"];
      health.summary = "Check the responding container";
      health.description =
        "At the browser origin, NGINX answers GET /healthz itself, even when the API is unavailable. " +
        "GET /health is its public alias. Directly inside the private API container, GET /healthz is the " +
        'Fastify liveness route. The exact body is {"status":"ok"}; neither endpoint validates analysis, ' +
        "documentation readiness, deployment identity or the other container.";
      operation.summary = "Count independently walked MP3 audio frames";
      // Preserve supplemental transport annotations; schemas do not enforce actual bytes or admission.
      Object.assign(operation, { "x-max-body-bytes": MAX_UPLOAD_BYTES, "x-active-upload-limit": 2 });
      operation.description =
        `Send raw bytes, never multipart/JSON. The inclusive ${MAX_UPLOAD_BYTES}-byte limit counts actual bytes; ` +
        "admission precedes buffering. MPEG-1 Layer III only, no free-format, supported flag-zero ID3v2.3/2.4 and " +
        "terminal ID3v1 only. A supported leading Xing/Info carrier contributes zero audio and one physical frame. " +
        "Declared totals are diagnostics, never the result. Exactly one decoded details=true selects details; other " +
        "values or duplicates use the default and unrelated parameters are ignored. HEAD is rejected without a body. " +
        "Disconnected clients and invalid native HTTP framing may not receive JSON.";
      Object.assign(operation, {
        "x-codeSamples": [
          {
            lang: "Shell",
            label: "Default count",
            source:
              "# Set BASE_URL to the origin printed by make up.\n" +
              "BASE_URL=http://127.0.0.1:8080\n" +
              "curl --fail-with-body -H 'Content-Type: audio/mpeg' \\\n" +
              '  --data-binary @example.mp3 "$BASE_URL/file-upload"',
          },
          {
            lang: "Shell",
            label: "Count with diagnostics",
            source:
              "BASE_URL=http://127.0.0.1:8080\n" +
              "curl --fail-with-body -H 'Content-Type: audio/mpeg' \\\n" +
              '  --data-binary @example.mp3 "$BASE_URL/file-upload?details=true"',
          },
        ],
      });
      operation.parameters = [
        {
          name: "details",
          in: "query",
          required: false,
          description: "Exactly one decoded true value enables details. Duplicate, empty and other values use default.",
          schema: { type: "string" },
          example: "true",
        },
      ];
      operation.requestBody = {
        required: true,
        content: Object.fromEntries(
          ["audio/mpeg", "application/octet-stream"].map((media) => [
            media,
            { schema: { type: "string", format: "binary" } },
          ]),
        ),
      };
      operation.responses = {
        200: {
          description: "Exact default one-field body or the requested detailed representation.",
          content: {
            "application/json": {
              schema: {
                anyOf: [
                  { $ref: "#/components/schemas/FrameCount" },
                  { $ref: "#/components/schemas/DetailedFrameCount" },
                ],
              },
              examples: examples(),
            },
          },
        },
      };
      for (const code of Object.keys(PUBLIC_ERRORS).filter(isPublicErrorCode)) {
        const entry = PUBLIC_ERRORS[code];
        const status = String(entry.status);
        if (entry.status === 404 || entry.status === 405) continue;
        const response = (operation.responses[status] ??= {
          description:
            entry.status === 502
              ? "Controlled NGINX ingress connection failure; the API was not reachable."
              : entry.status === 504
                ? "Controlled NGINX ingress read timeout after an upstream connection."
                : entry.status === 413
                  ? "Controlled API or NGINX ingress actual-byte/declaration limit rejection."
                  : "Closed safe API error; code determines status, message and recovery guidance.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" }, examples: {} } },
        });
        if (!("content" in response)) throw new Error("Unexpected reference response.");
        const media = response.content?.["application/json"];
        if (!media) throw new Error("Missing error media type.");
        media.examples ??= {};
        media.examples[code] = { summary: entry.action, value: projectPublicError(code) };
        if (entry.status === 503) response.headers = { "Retry-After": { schema: { type: "string", enum: ["1"] } } };
      }
      const methodError = {
        description: "Raw method guard, before body collection. Use the route-specific Allow method.",
        headers: { Allow: { schema: { type: "string" as const, enum: ["POST"] } } },
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiError" },
            examples: {
              METHOD_NOT_ALLOWED: {
                summary: PUBLIC_ERRORS.METHOD_NOT_ALLOWED.action,
                value: projectPublicError("METHOD_NOT_ALLOWED"),
              },
            },
          },
        },
      };
      const uploadPath = doc.paths?.["/file-upload"];
      const healthPath = doc.paths?.["/healthz"];
      if (!uploadPath || !healthPath || !health.responses) throw new Error("Missing discovered paths.");
      uploadPath.get = {
        operationId: "uploadWrongMethod",
        tags: ["Method rejections"],
        summary: "Unsupported GET: use POST to upload",
        responses: { 405: methodError },
      };
      uploadPath.head = {
        operationId: "uploadHeadRejected",
        tags: ["Method rejections"],
        summary: "HEAD upload is rejected without response bytes",
        description:
          "Raw method guard retains JSON Content-Type and error-body Content-Length metadata; HEAD emits no body.",
        responses: { 405: { description: "Bodyless method rejection", headers: methodError.headers } },
      };
      healthPath.post = {
        operationId: "healthWrongMethod",
        tags: ["Method rejections"],
        summary: "Health requires GET",
        responses: {
          405: {
            ...methodError,
            headers: { Allow: { schema: { type: "string", enum: ["GET"] } } },
          },
        },
      };
      healthPath.head = {
        operationId: "healthHeadRejected",
        tags: ["Method rejections"],
        summary: "HEAD health is rejected without response bytes",
        responses: {
          405: {
            description: "Bodyless raw method rejection; JSON headers describe an omitted error body.",
            headers: { Allow: { schema: { type: "string", enum: ["GET"] } } },
          },
        },
      };
      operation.responses[404] = {
        description:
          "Routing guard for upload-like aliases forwarded by NGINX: /file-upload/ or differently spelled raw " +
          "upload paths return this error before operation matching. Exact POST /file-upload does not return " +
          "404 from its analysis handler. Other unknown frontend paths can instead return an NGINX HTML 404.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiError" },
            examples: {
              ROUTE_NOT_FOUND: {
                summary: PUBLIC_ERRORS.ROUTE_NOT_FOUND.action,
                value: projectPublicError("ROUTE_NOT_FOUND"),
              },
            },
          },
        },
      };
      // This alias is served by the public NGINX ingress, not registered as a second private API route.
      doc.paths["/health"] = {
        get: {
          ...structuredClone(health),
          operationId: "ingressHealth",
          summary: "Check NGINX liveness",
          description:
            'NGINX returns {"status":"ok"} without contacting the API. This public alias of /healthz ' +
            "confirms the frontend container responds, not that an upload can be analyzed.",
        },
        post: { ...structuredClone(healthPath.post), operationId: "ingressHealthWrongMethod" },
        head: { ...structuredClone(healthPath.head), operationId: "ingressHealthHeadRejected" },
      };
      return doc;
    },
  });
}
