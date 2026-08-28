/** Trim, collapse runs of separators (space/dash/underscore) to a single
 *  space, lowercase. So "Ice_Cream" ≡ "ice cream" ≡ "ice–cream". */
export function normalizeWord(raw: string): string {
  return raw
    .trim()
    .replace(/[\s_\-–—]+/g, ' ')
    .toLowerCase()
}
