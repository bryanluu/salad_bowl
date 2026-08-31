import type { Word } from "../types.ts"
import { normalizeWord } from "../words/normalizeWord.ts";

export type Rejection =
  | { ok: false; reason: 'empty' }
  | { ok: false; reason: 'duplicate' }

export function validateWord(candidate: Word, existing: readonly Word[]): { ok: true } | Rejection {
  const normalized = normalizeWord(candidate)
  if (normalized === '') {
    return { ok: false, reason: 'empty' }
  }
  if (existing.some((word) => normalizeWord(word) === normalized)) {
    return { ok: false, reason: 'duplicate' }
  }
  return { ok: true }
}
