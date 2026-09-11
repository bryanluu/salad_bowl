// src/words/pickWord.test.ts
import { describe, it, expect } from 'vitest'
import type { Word } from '../types'
import { pickWord, switchWord } from './pickWord'

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

describe('switchWord', () => {
  it('picks a word from the bowl and puts the previous word back', () => {
    const bowl: Word[] = ['banana']
    const { word, remaining } = switchWord('apple', bowl)

    expect(word).toBe('banana')
    expect(remaining).toEqual(['apple']) // the previous word goes back into the bowl
    expect(bowl).toEqual(['banana']) // input is not mutated
  })

  it('only returns words that were in the bowl', () => {
    const bowl: Word[] = ['banana', 'apple', 'cherry']
    const { word, remaining } = switchWord('fig', bowl)

    expect(bowl).toContain(word)
    expect(remaining).toHaveLength(3) // one picked out, one put back
    expect(remaining).toContain('fig')
    expect(remaining).not.toContain(word)
    expect(bowl).toHaveLength(3) // input is not mutated
  })

  it('still swaps when the previous word is also in the bowl', () => {
    const bowl: Word[] = ['apple', 'banana']
    const { word, remaining } = switchWord('apple', bowl)

    expect(bowl).toContain(word)
    expect(remaining).toHaveLength(2)
    expect(remaining).toContain('apple')
    expect(bowl).toEqual(['apple', 'banana']) // input is not mutated
  })

  it('handles duplicate words in the bowl', () => {
    const bowl: Word[] = ['apple', 'apple']
    const { word, remaining } = switchWord('banana', bowl)

    expect(word).toBe('apple')
    expect(remaining.sort()).toEqual(['apple', 'banana']) // one copy stays, one is picked
  })

  it('returns undefined and hands the word back when the bowl is empty', () => {
    const { word, remaining } = switchWord('apple', [])

    expect(word).toBeUndefined()
    expect(remaining).toEqual(['apple'])
  })
})
