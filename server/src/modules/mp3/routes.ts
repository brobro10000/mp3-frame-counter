/** Normalize representation options, analyze one complete buffer and project only the selected closed wire DTO. */
import type { FastifyInstance } from "fastify";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { ERROR_RESPONSES } from "../../contracts/errors.ts";
import { isUploadSuccess, isZeroAudioAnalysis } from "../../contracts/mp3.ts";
import type {
  AnalysisWarning,
  DetailedFrameCountResponse,
  UploadSuccess,
  XingInspection,
} from "../../contracts/mp3.ts";
import { UploadError } from "../../http/errors.ts";
import type { UploadTransport } from "../../http/upload-transport.ts";
import { analyzeMp3 } from "./analyze.ts";

/** Dependencies owned by the scoped upload plugin; analyzer replacement is a controlled verification seam. */
export interface Mp3RouteOptions {
  readonly transport: UploadTransport;
  /** Pure synchronous analyzer dependency; production uses the handwritten boundary walker. */
  readonly analyze?: typeof analyzeMp3;
}

/**
 * Select details only for one decoded value equal to "true"; missing, repeated and other values select default.
 * Standard decoding applies only to query options; raw route spelling remains guarded by transport.
 */
export function wantsDetails(rawUrl: string): boolean {
  const question = rawUrl.indexOf("?");
  const query = question === -1 ? "" : rawUrl.slice(question + 1);
  const values = new URLSearchParams(query).getAll("details");
  return values.length === 1 && values[0] === "true";
}

/** Project known metadata fields individually; declarations remain optional and never become computed counts. */
function projectXing(xing: XingInspection): XingInspection {
  if (xing.status === "absent") return { status: "absent" };
  if (xing.status !== "present") throw new UploadError("INTERNAL_ERROR");
  const projected: Extract<XingInspection, { status: "present" }> = {
    status: "present",
    marker: xing.marker,
    frameOffsetBytes: xing.frameOffsetBytes,
    frameLengthBytes: xing.frameLengthBytes,
    markerOffsetBytes: xing.markerOffsetBytes,
    flags: xing.flags,
  };
  if (xing.declaredAudioFrameCount !== undefined) projected.declaredAudioFrameCount = xing.declaredAudioFrameCount;
  if (xing.declaredMpegStreamByteCount !== undefined)
    projected.declaredMpegStreamByteCount = xing.declaredMpegStreamByteCount;
  if (xing.seekTableEntryCount !== undefined) projected.seekTableEntryCount = xing.seekTableEntryCount;
  if (xing.qualityValue !== undefined) projected.qualityValue = xing.qualityValue;
  return projected;
}

/** Project one diagnostic alternative without exposing private domain context or metadata bytes. */
function projectWarning(warning: AnalysisWarning): AnalysisWarning {
  switch (warning.code) {
    case "XING_OPTIONAL_FIELD_TRUNCATED":
      return { code: warning.code, field: warning.field };
    case "XING_DECLARED_FRAME_COUNT_MISMATCH":
    case "XING_DECLARED_STREAM_BYTES_MISMATCH":
      return { code: warning.code };
    default:
      throw new UploadError("INTERNAL_ERROR");
  }
}

/** Validate diagnostics before selecting default/detail; serializers alone do not validate count invariants. */
export function projectAnalysis(analysis: ReturnType<typeof analyzeMp3>, details: boolean): UploadSuccess {
  if (!Array.isArray(analysis.warnings) || analysis.warnings.length > 3) throw new UploadError("INTERNAL_ERROR");
  const projected: DetailedFrameCountResponse = {
    frameCount: analysis.audioFrameCount,
    analysis: {
      physicalFrameCount: analysis.physicalFrameCount,
      excludedMetadataFrameCount: analysis.excludedMetadataFrameCount,
      xing: projectXing(analysis.xing),
      warnings: analysis.warnings.map(projectWarning),
    },
  };
  if (projected.frameCount === 0) {
    if (!isZeroAudioAnalysis(projected)) throw new UploadError("INTERNAL_ERROR");
    throw new UploadError("MP3_NO_AUDIO_FRAMES");
  }
  if (!isUploadSuccess(projected)) throw new UploadError("INTERNAL_ERROR");
  return details ? projected : { frameCount: projected.frameCount };
}

/** Register upload in its admission/parser scope, applying provider inference locally and reusing canonical IDs. */
export function registerMp3Routes(app: FastifyInstance, options: Mp3RouteOptions): void {
  const scoped = app.withTypeProvider<TypeBoxTypeProvider>();
  const analyze = options.analyze ?? analyzeMp3;
  const errors = Object.fromEntries(Object.keys(ERROR_RESPONSES).map((status) => [status, { $ref: "ApiError#" }]));
  scoped.post<{ Body: Buffer | undefined }>(
    "/file-upload",
    {
      schema: {
        operationId: "countFrames",
        tags: ["MP3"],
        // Binary documentation is a docs-only projection; runtime receives an already bounded Buffer.
        response: {
          ...errors,
          200: { anyOf: [{ $ref: "FrameCount#" }, { $ref: "DetailedFrameCount#" }] },
        },
      },
    },
    (request, reply) => {
      try {
        if (!Buffer.isBuffer(request.body) || request.body.length === 0) throw new UploadError("UPLOAD_EMPTY");
        const result = analyze(request.body);
        return reply.send(projectAnalysis(result, wantsDetails(request.raw.url ?? "")));
      } finally {
        options.transport.release(request);
      }
    },
  );
}
