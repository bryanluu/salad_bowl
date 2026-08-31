// src/wordSources/LocalWordSource.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { LocalWordSource } from './LocalWordSource'

describe('LocalWordSource', () => {
  let source: LocalWordSource

  beforeEach(() => {
    source = new LocalWordSource()
  })

  describe('addWord', () => {
    it('adds a word to the bag and returns true', () => {
      expect(source.addWord('banana')).toBe(true)
      expect(source.getWords()).toEqual(['banana'])
    })

    it('rejects a duplicate word (case/spacing-insensitive) and returns false', () => {
      source.addWord('Ice Cream')
      const success = source.addWord('ice_cream')
      expect(success).toBe(false)
      expect(source.count()).toBe(1)
    })

    it('rejects an empty or whitespace-only word', () => {
      expect(source.addWord('   ')).toBe(false)
      expect(source.count()).toBe(0)
    })

    it('rejects a short word', () => {
      expect(source.addWord('hi')).toBe(false)
      expect(source.count()).toBe(0)
    })

    it('rejects a long word', () => {
      expect(source.addWord('anunreachablepointattheendofaneverendinglinethatrepresentsanunreachablepoint...')).toBe(false)
      expect(source.count()).toBe(0)
    })
  })

  describe('removeWord', () => {
    it('removes the specified word and returns true', () => {
      source.addWord('banana')
      source.addWord('apple')
      const success = source.removeWord('banana')
      expect(success).toBe(true)
      expect(source.getWords()).toEqual(['apple'])
    })

    it('returns false when the word is not found', () => {
      source.addWord('banana')
      const success = source.removeWord('apple')
      expect(success).toBe(false)
      expect(source.getWords()).toEqual(['banana'])
    })

    it('returns false when removing from an empty bag', () => {
      expect(source.removeWord('banana')).toBe(false)
    })
  })

  describe('pickWord', () => {
    it('returns and removes a word from the bag', () => {
      source.addWord('banana')
      const picked = source.pickWord()
      expect(picked).toBe('banana')
      expect(source.count()).toBe(0)
    })

    it('only returns words that were in the bag', () => {
      source.addWord('banana')
      source.addWord('apple')
      source.addWord('cherry')
      expect(['banana', 'apple', 'cherry']).toContain(source.pickWord())
    })

    it('returns null when the bag is empty', () => {
      expect(source.pickWord()).toBeNull()
    })
  })

  describe('getWords', () => {
    it('returns an empty array for a new source', () => {
      expect(source.getWords()).toEqual([])
    })

    it('returns a new array reference on each call', () => {
      source.addWord('banana')
      const first = source.getWords()
      const second = source.getWords()
      expect(first).toEqual(second)
      expect(first).not.toBe(second) // different references, same content
    })
  })

  describe('count', () => {
    it('returns 0 for an empty bag', () => {
      expect(source.count()).toBe(0)
    })

    it('reflects additions and removals', () => {
      source.addWord('banana')
      source.addWord('apple')
      source.removeWord('banana')
      expect(source.count()).toBe(1)
    })
  })
})

