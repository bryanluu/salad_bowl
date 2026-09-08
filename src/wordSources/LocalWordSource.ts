// src/wordSources/LocalWordSource.ts
import { type Word, type WordSource, minWordLength, maxWordLength } from '../types'
import { normalizeWord } from '../words/normalizeWord'

export class LocalWordSource implements WordSource {
  private words: Word[] = []
  maxWords: number

  constructor(maxWords: number) {
    this.maxWords = maxWords
  }

  addWord(word: Word): boolean {
    const normalized = normalizeWord(word)
    if (normalized === '') return false
    const isDuplicate = this.words.some((w) => normalizeWord(w) === normalized)
    if (isDuplicate) return false
    const isShort = (normalized.length < minWordLength)
    if (isShort) return false
    const isLong = (normalized.length > maxWordLength)
    if (isLong) return false
    const isFull = (this.words.length >= this.maxWords)
    if (isFull) return false

    this.words.push(word)
    return true
  }

  removeWord(word: Word): boolean {
    const index = this.words.findIndex((w) => w === word)
    if (index === -1) return false
    this.words.splice(index, 1)
    return true
  }

  getWords(): readonly Word[] {
    // ensures state refresh on every call since this is always a new array
    return [...this.words]
  }

  count(): number {
    return this.words.length
  }
}

