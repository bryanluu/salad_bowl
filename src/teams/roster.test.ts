// src/teams/roster.test.ts
import { describe, it, expect } from 'vitest'
import { maxPlayersForTeam, splitPlayersEvenly } from './roster'

describe('splitPlayersEvenly', () => {
  it('splits players evenly when the total is divisible by the team count', () => {
    const teams = splitPlayersEvenly(6, 3, [])
    expect(teams.map(t => t.players)).toEqual([2, 2, 2])
  })

  it('gives the leftover players to the first teams', () => {
    expect(splitPlayersEvenly(5, 2, []).map(t => t.players)).toEqual([3, 2])
    expect(splitPlayersEvenly(8, 3, []).map(t => t.players)).toEqual([3, 3, 2])
    expect(splitPlayersEvenly(9, 4, []).map(t => t.players)).toEqual([3, 2, 2, 2])
  })

  it('always assigns every player exactly once', () => {
    const cases: [totalPlayers: number, teamCount: number][] = [
      [4, 2],
      [5, 2],
      [6, 3],
      [8, 3],
      [9, 4],
      [11, 3],
    ]
    for (const [totalPlayers, teamCount] of cases) {
      const teams = splitPlayersEvenly(totalPlayers, teamCount, [])
      const assigned = teams.reduce((sum, t) => sum + t.players, 0)
      expect(assigned).toBe(totalPlayers)
    }
  })

  it('keeps existing team names and fills gaps with defaults', () => {
    const teams = splitPlayersEvenly(6, 3, ['Alpha'])
    expect(teams.map(t => t.name)).toEqual(['Alpha', 'Team 2', 'Team 3'])
  })

  it('assigns sequential ids and default names for a fresh setup', () => {
    const teams = splitPlayersEvenly(4, 2, [])
    expect(teams).toEqual([
      { id: 'team-1', name: 'Team 1', players: 2 },
      { id: 'team-2', name: 'Team 2', players: 2 },
    ])
  })
})

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
