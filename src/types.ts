export type ScreenId = 'word-entry' | 'game-setup' | 'gameplay' | 'scoreboard'

export interface ScreenNavItem {
  id: ScreenId
  label: string
}

export type Word = string

export const minWordLength = 3
export const maxWordLength = 50

export interface WordSource {
  // The maximum number of words this bowl can hold
  maxWords: number
  // Adds a word to the bowl. Returns false if rejected (e.g. duplicate, empty).
  addWord(word: Word): boolean
  // Removes a word from the bowl. Returns false if the word wasn't found.
  removeWord(word: Word): boolean
  // Returns all words in the bowl
  getWords(): readonly Word[]
  // Count words in the bowl
  count(): number
}

export interface Team {
  id: string
  name: string
  players: number
}

export interface GameConfig {
  totalPlayers: number
  teams: Team[]
  timerSeconds: number
  wordsPerPlayer: number
}
