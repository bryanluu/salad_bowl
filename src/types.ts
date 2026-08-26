export type ScreenId = 'word-entry' | 'game-setup' | 'gameplay' | 'scoreboard'

export interface ScreenNavItem {
  id: ScreenId
  label: string
}

export type Word = string

export interface WordSource {
  // Adds a word to the bowl
  addWord(word: Word): void
  // Picks a word from the bowl
  removeWord(): Word
  // Returns all words in the bowl
  getWords(): readonly Word[]
  // Count words in the bowl
  count(): number
}
