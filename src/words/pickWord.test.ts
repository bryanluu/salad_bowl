// src/wordSources/LocalWordSource.test.ts
import { describe, it, expect } from 'vitest'
import type { Word } from '../types'
import { pickWord } from './pickWord'


describe('pickWord', () => {
  let words: Word[]

  it('returns and removes a word from the bag', () => {
    words = ['banana']
    const picked = pickWord(words)
    expect(picked).toBe('banana')
    expect(words.length).toBe(0)
  })

  it('only returns words that were in the bag', () => {
    words = ['banana', 'apple', 'cherry']
    expect(['banana', 'apple', 'cherry']).toContain(pickWord(words))
    expect(words.length).toBe(2)
  })

  it('returns null when the bag is empty', () => {
    words = []
    expect(pickWord(words)).toBeNull()
  })
})
