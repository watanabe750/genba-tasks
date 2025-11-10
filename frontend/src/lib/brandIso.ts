// src/lib/brandIso.ts
import type { ISODateString } from "../types";
/** undefined を必ず null に落としてブランド化 */
export function brandIso(input?: string | null): ISODateString | null {
  return (input == null ? null : (input as ISODateString));
}