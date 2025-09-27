// src/lib/brandIso.ts
import type { IsoDateString } from "../types";
/** undefined を必ず null に落としてブランド化 */
export function brandIso(input?: string | null): IsoDateString | null {
  return (input == null ? null : (input as IsoDateString));
}