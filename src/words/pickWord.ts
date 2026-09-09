import type { Word } from "../types"

// pickWord.ts — pure, no mutation
export function pickWord(words: readonly Word[]): { word: Word | undefined; remaining: Word[] } {
  if (words.length === 0) return { word: undefined, remaining: [] }

  const index = Math.floor(Math.random() * words.length)
  const remaining = [...words.slice(0, index), ...words.slice(index + 1)]
  return { word: words[index], remaining }
}
