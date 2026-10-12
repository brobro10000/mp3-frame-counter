/** Historical physical-count diagnostic facade; public routes use analyzeMp3's owner-defined audio convention. */
import { analyzeMp3 } from "./modules/mp3/analyze.ts";
export { analyzeMp3 } from "./modules/mp3/analyze.ts";

/**
 * Return the complete physical-frame count, including a recognized leading metadata carrier, for internal callers.
 * Pure and non-mutating; malformed or unsupported input propagates the analyzer's typed domain error.
 */
export function countMp3Frames(bytes: Buffer): number {
  return analyzeMp3(bytes).physicalFrameCount;
}
