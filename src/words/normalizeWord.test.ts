// src/words/normalizeWord.test.ts
import { describe, it, expect } from 'vitest'
import { normalizeWord } from './normalizeWord'

describe('normalizeWord', () => {
  it('trims whitespace and lowercases', () => {
    expect(normalizeWord('  Ice Cream  ')).toBe('ice cream')
  })

  it('collapses separators to a single space', () => {
    expect(normalizeWord('Ice_Cream')).toBe('ice cream')
    expect(normalizeWord('Ice–Cream')).toBe('ice cream')
    expect(normalizeWord('Ice-Cream')).toBe('ice cream')
  })
})
