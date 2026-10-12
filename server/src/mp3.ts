/** Historical physical-count diagnostic facade; public routes use analyzeMp3's owner-defined audio convention. */
import { analyzeMp3 } from "./modules/mp3/analyze.ts";
export { analyzeMp3 } from "./modules/mp3/analyze.ts";

/** Return complete physical framing for existing internal callers, including the leading metadata carrier. No I/O. */
export function countMp3Frames(bytes: Buffer): number {
  return analyzeMp3(bytes).physicalFrameCount;
}
