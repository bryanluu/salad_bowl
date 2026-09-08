import type { Word } from "../types.ts"

export type Confirmation = { ok: true }

export type Rejection =
  | { ok: false; reason: 'not-enough-words' }
  | { ok: false; reason: 'too-many-words' }

export type ValidationResult = Confirmation | Rejection

export function validateWords(words: readonly Word[], maxWords: number): ValidationResult {
  if (words.length < maxWords) {
    return { ok: false, reason: 'not-enough-words' }
  }
  if (words.length > maxWords) {
    return { ok: false, reason: 'too-many-words' }
  }
  return { ok: true }
}
