// src/wordSources/LocalWordSource.ts
import type { Word, WordSource } from '../types'
import { normalizeWord } from '../words/normalizeWord'

export class LocalWordSource implements WordSource {
  private words: Word[] = []

  addWord(word: Word): boolean {
    const normalized = normalizeWord(word)
    if (normalized === '') return false
    const isDuplicate = this.words.some((w) => normalizeWord(w) === normalized)
    if (isDuplicate) return false
    this.words.push(word)
    return true
  }

  removeWord(word: Word): boolean {
    const index = this.words.findIndex((w) => w === word)
    if (index === -1) return false
    this.words.splice(index, 1)
    return true
  }

  pickWord(): Word | null {
    if (this.words.length === 0) return null
    const index = Math.floor(Math.random() * this.words.length)
    const [word] = this.words.splice(index, 1)
    return word
  }

  getWords(): readonly Word[] {
    // ensures state refresh on every call since this is always a new array
    return [...this.words]
  }

  count(): number {
    return this.words.length
  }
}

