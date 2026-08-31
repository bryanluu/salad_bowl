// src/validation/validateWord.test.ts
import { describe, it, expect } from 'vitest'
import { validateWord } from './validateWord'

describe('validateWord', () => {
  it('rejects an empty candidate', () => {
    const result = validateWord('   ', [])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('empty')
    }
  })

  it('rejects a duplicate, ignoring case/spacing differences', () => {
    const result = validateWord('Ice_Cream', ['ice cream'])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('duplicate')
    }
  })

  it('accepts a valid, non-duplicate word', () => {
    const result = validateWord('banana', ['apple'])
    expect(result.ok).toBe(true)
  })
})
