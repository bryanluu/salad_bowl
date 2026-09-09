// src/words/pickWord.test.ts
import { describe, it, expect } from 'vitest'
import type { Word } from '../types'
import { pickWord } from './pickWord'

describe('pickWord', () => {
  it('returns a word and the rest of the bag, leaving the bag untouched', () => {
    const words: Word[] = ['banana']
    const { word, remaining } = pickWord(words)

    expect(word).toBe('banana')
    expect(remaining).toEqual([])
    expect(words).toEqual(['banana']) // input is not mutated
  })

  it('only returns words that were in the bag', () => {
    const words: Word[] = ['banana', 'apple', 'cherry']
    const { word, remaining } = pickWord(words)

    expect(['banana', 'apple', 'cherry']).toContain(word)
    expect(remaining).toHaveLength(2)
    expect(remaining).not.toContain(word)
    expect(words).toHaveLength(3) // input is not mutated
  })

  it('returns undefined and an empty bag when the bag is empty', () => {
    const { word, remaining } = pickWord([])

    expect(word).toBeUndefined()
    expect(remaining).toEqual([])
  })
})
