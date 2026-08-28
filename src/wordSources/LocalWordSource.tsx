import type { Word, WordSource } from '../types'

export class LocalWordSource implements WordSource {
  private words: Word[] = []

  addWord(word: Word): void {
    this.words.push(word)
  }

  removeWord(): Word {
    const index = Math.floor(Math.random() * this.words.length)
    const [word] = this.words.splice(index, 1)
    return word
  }

  getWords(): readonly Word[] {
    return this.words
  }

  count(): number {
    return this.words.length
  }
}
