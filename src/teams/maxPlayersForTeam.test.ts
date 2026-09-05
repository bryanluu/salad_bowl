// src/teams/maxPlayersForTeam.test.ts
import { describe, it, expect } from 'vitest'
import { maxPlayersForTeam } from './maxPlayersForTeam'

describe('maxPlayersForTeam', () => {
  it('allows a team to grow only up to the remaining unassigned players', () => {
    // 10 total, 8 assigned, this team has 4 → 2 headroom → max 6
    expect(maxPlayersForTeam(10, 8, 4)).toBe(6)
  })

  it('caps a team at its own count once every player is assigned', () => {
    // 10 total, 10 assigned, this team has 6 → no headroom → max 6
    expect(maxPlayersForTeam(10, 10, 6)).toBe(6)
  })

  it('reflects each team’s own value within the same roster', () => {
    // 10 total, two teams of 3 (6 assigned): each could take all 4 remaining
    expect(maxPlayersForTeam(10, 6, 3)).toBe(7)
  })

  it('matches the formula totalPlayers - (assignedPlayers - teamPlayers)', () => {
    expect(maxPlayersForTeam(12, 9, 5)).toBe(12 - (9 - 5)) // 8
  })

  it('falls below the team’s count when the total is lowered under the assigned total', () => {
    // over-assigned: 10 total but 12 assigned, this team has 7 → max 5
    expect(maxPlayersForTeam(10, 12, 7)).toBe(5)
  })
})
