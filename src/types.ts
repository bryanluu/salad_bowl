export type ScreenId = 'word-entry' | 'game-setup' | 'gameplay' | 'scoreboard'

export interface ScreenNavItem {
  id: ScreenId
  label: string
}

export type Word = string

export interface WordSource {
  // Adds a word to the bowl. Returns false if rejected (e.g. duplicate, empty).
  addWord(word: Word): boolean
  // Removes a word from the bowl. Returns false if the word wasn't found.
  removeWord(word: Word): boolean
  // Picks a word from the bowl. Returns null if the bowl is empty.
  pickWord(): Word | null
  // Returns all words in the bowl
  getWords(): readonly Word[]
  // Count words in the bowl
  count(): number
}
