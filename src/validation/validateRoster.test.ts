// src/validation/validateRoster.test.ts
import { describe, it, expect } from 'vitest'
import { validateRoster } from './validateRoster'

describe('validateRoster', () => {
  it('rejects a configuration with no teams', () => {
    const result = validateRoster([], 4)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('invalid-configuration')
    }
  })

  it('rejects a configuration with no players', () => {
    const result = validateRoster([{ id: '1', name: 'Alpha', players: 2 }], 0)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('invalid-configuration')
    }
  })

  it('rejects a roster where a team has fewer than the minimum players', () => {
    const result = validateRoster([{ id: '1', name: 'Alpha', players: 1 }], 1)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('insufficient-players-per-team')
    }
  })

  it('accepts a fully-assigned roster with unique team names', () => {
    const result = validateRoster(
      [{ id: '1', name: 'Alpha', players: 2 }, { id: '2', name: 'Beta', players: 2 }],
      4,
    )
    expect(result.ok).toBe(true)
  })

  it('rejects a roster with unassigned players', () => {
    const result = validateRoster(
      [{ id: '1', name: 'Alpha', players: 2 }, { id: '2', name: 'Beta', players: 2 }],
      6,
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('unassigned-players')
    }
  })

  it('rejects a roster with too many assigned players', () => {
    const result = validateRoster(
      [{ id: '1', name: 'Alpha', players: 3 }, { id: '2', name: 'Beta', players: 3 }],
      4,
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('too-many-players')
    }
  })

  it('rejects a roster with an empty team name', () => {
    const result = validateRoster(
      [{ id: '1', name: '', players: 2 }, { id: '2', name: 'Beta', players: 2 }],
      4,
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('invalid-team-name')
    }
  })

  it('rejects a roster with duplicate team names', () => {
    const result = validateRoster(
      [{ id: '1', name: 'Alpha', players: 2 }, { id: '2', name: 'Alpha', players: 2 }],
      4,
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('duplicate-team-name')
    }
  })
})
