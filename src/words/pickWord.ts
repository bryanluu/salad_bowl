import type { Word } from "../types"

// Mutating function that removes a word from random
export function pickWord(words: Word[]): Word | null {
  if (words.length === 0) return null
  const index = Math.floor(Math.random() * words.length)
  const [word] = words.splice(index, 1)
  return word
}
