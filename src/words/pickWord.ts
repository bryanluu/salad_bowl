import type { Word } from "../types"

// pickWord.ts — pure, no mutation
export function pickWord(words: readonly Word[]): { word: Word | undefined; remaining: Word[] } {
  if (words.length === 0) return { word: undefined, remaining: [] }

  const index = Math.floor(Math.random() * words.length)
  const remaining = [...words.slice(0, index), ...words.slice(index + 1)]
  return { word: words[index], remaining }
}

// Pure function that captures switchWord logic
// Picks a new word from the bowl, that's different from the currentWord, or returning undefined if the bowl is already empty
// Returns the previous picked word to the bowl
export function switchWord(currentWord: Word, bowl: readonly Word[]): { word: Word | undefined; remaining: Word[] } {
  // pick a new word from the bowl,
  // then put the previous word back into the bowl
  const { word: newWord, remaining } = pickWord(bowl)
  return { word: newWord, remaining: [...remaining, currentWord] }
}
