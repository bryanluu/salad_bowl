// src/wordSources/LocalWordSource.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { LocalWordSource } from './LocalWordSource'

describe('LocalWordSource', () => {
  let source: LocalWordSource

  beforeEach(() => {
    source = new LocalWordSource(10)
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

    it('rejects a word once the bowl is full (at maxWords)', () => {
      const bounded = new LocalWordSource(2)
      expect(bounded.addWord('banana')).toBe(true)
      expect(bounded.addWord('apple')).toBe(true)
      expect(bounded.addWord('cherry')).toBe(false) // bowl full at 2
      expect(bounded.count()).toBe(2)
      expect(bounded.getWords()).toEqual(['banana', 'apple'])
    })

    it('accepts words up to the capacity limit', () => {
      const bounded = new LocalWordSource(1)
      expect(bounded.addWord('banana')).toBe(true)
      expect(bounded.addWord('apple')).toBe(false)
      expect(bounded.count()).toBe(1)
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

