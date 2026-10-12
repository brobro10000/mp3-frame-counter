/** Shared wire schemas and interpreted guards. These browser-safe modules contain no parser, HTTP server or I/O. */
import { Type } from "typebox";
import type { Static } from "typebox";
import { Check } from "typebox/value";

/** Inclusive actual-byte ceiling, shared by upload transport and its published request contract. */
export const MAX_UPLOAD_BYTES = 20_971_520;
const integer = (description: string, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) =>
  Type.Integer({ minimum, maximum, description });
const count = integer("Number of independently walked audio frames; leading recognized Xing/Info carrier excluded.", 1);
const uint32 = (description: string) => integer(description, 0, 0xffff_ffff);

/** Missing carrier fields stay absent; declarations and stored quality are unsigned metadata, not measurements. */
export const XingSchema = Type.Union([
  Type.Object({ status: Type.Literal("absent") }, { additionalProperties: false }),
  Type.Object(
    {
      status: Type.Literal("present"),
      marker: Type.Enum(["Xing", "Info"]),
      frameOffsetBytes: integer("Absolute zero-based file offset of the leading carrier.", 0, MAX_UPLOAD_BYTES),
      frameLengthBytes: integer("Complete header-derived carrier span in bytes.", 4, MAX_UPLOAD_BYTES),
      markerOffsetBytes: integer("Absolute zero-based file offset of the marker.", 0, MAX_UPLOAD_BYTES),
      flags: integer("Supported big-endian flags bitmask (0x01/0x02/0x04/0x08).", 0, 15),
      declaredAudioFrameCount: Type.Optional(uint32("Declared audio total; never used to calculate the result.")),
      declaredMpegStreamByteCount: Type.Optional(uint32("Declared MPEG stream size, excluding outer ID3 tags.")),
      seekTableEntryCount: Type.Optional(
        Type.Literal(100, { description: "Present only when all 100 bounded entries fit." }),
      ),
      qualityValue: Type.Optional(uint32("Stored quality value; not a percentage.")),
    },
    { additionalProperties: false },
  ),
]);
export type XingInspection = Static<typeof XingSchema>;

/** At most one warning of each kind, in truncation/count/stream order; successful framing remains fully walked. */
export const WarningSchema = Type.Union([
  Type.Object(
    { code: Type.Enum(["XING_DECLARED_FRAME_COUNT_MISMATCH", "XING_DECLARED_STREAM_BYTES_MISMATCH"]) },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      code: Type.Literal("XING_OPTIONAL_FIELD_TRUNCATED"),
      field: Type.Enum(["declaredAudioFrameCount", "declaredMpegStreamByteCount", "seekTable", "qualityValue"]),
    },
    { additionalProperties: false },
  ),
]);
export type AnalysisWarning = Static<typeof WarningSchema>;
const AnalysisSchema = Type.Object(
  {
    physicalFrameCount: integer("Every complete walked MPEG frame, including the carrier.", 1),
    excludedMetadataFrameCount: Type.Enum([0, 1], {
      description: "One only for a recognized supported leading Xing/Info carrier.",
    }),
    xing: XingSchema,
    warnings: Type.Array(WarningSchema, {
      maxItems: 3,
      description: "Bounded diagnostic metadata warnings; not partial counting.",
    }),
  },
  { additionalProperties: false },
);
/** Default representation remains exactly one positive safe-integer field. */
export const FrameCountSchema = Type.Object({ frameCount: count }, { $id: "FrameCount", additionalProperties: false });
/** Detailed representation is its own closed object; no closed-base allOf or accidental serializer field stripping. */
export const DetailedFrameCountSchema = Type.Object(
  { frameCount: count, analysis: AnalysisSchema },
  { $id: "DetailedFrameCount", additionalProperties: false },
);
const DomainAnalysisSchema = Type.Object(
  { frameCount: integer("Domain audio count, zero only for carrier-only input."), analysis: AnalysisSchema },
  { additionalProperties: false },
);
const DomainResultSchema = Type.Union([FrameCountSchema, DomainAnalysisSchema]);
export const UploadSuccessSchema = Type.Union([FrameCountSchema, DetailedFrameCountSchema]);
export type FrameCountResponse = Static<typeof FrameCountSchema>;
export type DetailedFrameCountResponse = Static<typeof DetailedFrameCountSchema>;
export type UploadSuccess = Static<typeof UploadSuccessSchema>;
export const HealthSchema = Type.Object({ status: Type.Literal("ok") }, { $id: "Health", additionalProperties: false });

/** Reject non-JSON prototypes at public object boundaries even when a field could be inherited. */
function plain(value: object): boolean {
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/** Validate closed JSON and count/carrier invariants without eval, coercion, mutation or server-only dependencies. */
export function isUploadSuccess(value: unknown): value is UploadSuccess {
  return validateAnalysis(value, false);
}

/** Validate a domain-only zero count before classifying carrier-only input; this is never a success serializer. */
export function isZeroAudioAnalysis(value: unknown): boolean {
  return validateAnalysis(value, true);
}

/** Shared closed diagnostics/invariants; zero-mode accepts only the carrier-only domain result, never wire success. */
function validateAnalysis(value: unknown, zero: boolean): value is UploadSuccess {
  if (!Check(DomainResultSchema, value) || !plain(value) || !Object.hasOwn(value, "frameCount")) return false;
  if (zero ? value.frameCount !== 0 : value.frameCount < 1) return false;
  if (!("analysis" in value)) return !zero;
  if (!Check(DomainAnalysisSchema, value)) return false;
  const a = value.analysis;
  if (!Object.hasOwn(value, "analysis") || !plain(a) || !plain(a.xing)) return false;
  if (!["physicalFrameCount", "excludedMetadataFrameCount", "xing", "warnings"].every((key) => Object.hasOwn(a, key)))
    return false;
  if (!Object.hasOwn(a.xing, "status")) return false;
  if (a.physicalFrameCount !== value.frameCount + a.excludedMetadataFrameCount) return false;
  if (a.xing.status === "absent") return a.excludedMetadataFrameCount === 0 && a.warnings.length === 0;
  if (a.excludedMetadataFrameCount !== 1) return false;
  if (
    !["marker", "frameOffsetBytes", "frameLengthBytes", "markerOffsetBytes", "flags"].every((key) =>
      Object.hasOwn(a.xing, key),
    )
  )
    return false;
  const relativeMarker = a.xing.markerOffsetBytes - a.xing.frameOffsetBytes;
  if ((relativeMarker !== 21 && relativeMarker !== 36) || relativeMarker + 8 > a.xing.frameLengthBytes) return false;
  if (a.xing.frameOffsetBytes + a.xing.frameLengthBytes > MAX_UPLOAD_BYTES) return false;
  const fields = [
    ["declaredAudioFrameCount", 1],
    ["declaredMpegStreamByteCount", 2],
    ["seekTableEntryCount", 4],
    ["qualityValue", 8],
  ] as const;
  for (const [field, flag] of fields) if (Object.hasOwn(a.xing, field) && !(a.xing.flags & flag)) return false;
  const warningOrder = [
    "XING_OPTIONAL_FIELD_TRUNCATED",
    "XING_DECLARED_FRAME_COUNT_MISMATCH",
    "XING_DECLARED_STREAM_BYTES_MISMATCH",
  ];
  let previous = -1;
  for (const warning of a.warnings) {
    if (!plain(warning)) return false;
    const order = warningOrder.indexOf(warning.code);
    if (order <= previous) return false;
    previous = order;
    if (
      warning.code === "XING_DECLARED_FRAME_COUNT_MISMATCH" &&
      (a.xing.declaredAudioFrameCount === undefined || a.xing.declaredAudioFrameCount === value.frameCount)
    )
      return false;
    if (warning.code === "XING_DECLARED_STREAM_BYTES_MISMATCH" && a.xing.declaredMpegStreamByteCount === undefined)
      return false;
  }
  const xing = a.xing;
  const selectedFields = [
    ["declaredAudioFrameCount", 1, 4, "declaredAudioFrameCount"],
    ["declaredMpegStreamByteCount", 2, 4, "declaredMpegStreamByteCount"],
    ["seekTableEntryCount", 4, 100, "seekTable"],
    ["qualityValue", 8, 4, "qualityValue"],
  ] as const;
  let cursor = relativeMarker + 8;
  let truncated: string | undefined;
  for (const [field, flag, length, warningField] of selectedFields) {
    if (!(xing.flags & flag)) continue;
    if (truncated === undefined && cursor + length > xing.frameLengthBytes) truncated = warningField;
    if (truncated !== undefined) {
      if (Object.hasOwn(xing, field)) return false;
    } else {
      if (!Object.hasOwn(xing, field)) return false;
      cursor += length;
    }
  }
  const damage = a.warnings.find((warning) => warning.code === "XING_OPTIONAL_FIELD_TRUNCATED");
  if (truncated === undefined) {
    if (damage !== undefined) return false;
  } else if (damage?.code !== "XING_OPTIONAL_FIELD_TRUNCATED" || damage.field !== truncated) return false;
  const countMismatch = xing.declaredAudioFrameCount !== undefined && xing.declaredAudioFrameCount !== value.frameCount;
  if (countMismatch !== a.warnings.some((warning) => warning.code === "XING_DECLARED_FRAME_COUNT_MISMATCH"))
    return false;
  return true;
}
