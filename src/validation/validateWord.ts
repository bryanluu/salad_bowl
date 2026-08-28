import type { Word } from "../types.ts"
import { normalizeWord } from "../words/normalizeWord.ts";

export type Rejection =
  | { ok: false; reason: 'empty'; message: string }
  | { ok: false; reason: 'duplicate'; message: string }

export function validateWord(candidate: Word, existing: readonly Word[]): { ok: true } | Rejection {
  const normalized = normalizeWord(candidate)
  if (normalized === '') {
    return { ok: false, reason: 'empty', message: "That's not a word yet — type a few letters first." }
  }
  if (existing.some((word) => normalizeWord(word) === normalized)) {
    return { ok: false, reason: 'duplicate', message: 'Already in the bowl.' }
  }
  return { ok: true }
}
