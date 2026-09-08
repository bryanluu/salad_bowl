// src/validation/validateBowl.test.ts
import { describe, it, expect } from 'vitest'
import { validateBowl } from './validateBowl'

describe('validateBowl', () => {
  it('accepts a bowl with exactly the required number of words', () => {
    const result = validateBowl(['banana', 'apple', 'cherry'], 3)
    expect(result.ok).toBe(true)
  })

  it('rejects a bowl with too few words', () => {
    const result = validateBowl(['banana', 'apple'], 3)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('not-enough-words')
    }
  })

  it('rejects a bowl with too many words', () => {
    const result = validateBowl(['banana', 'apple', 'cherry', 'kiwi'], 3)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('too-many-words')
    }
  })
})
