// src/teams/splitPlayersEvenly.test.ts
import { describe, it, expect } from 'vitest'
import { splitPlayersEvenly } from './splitPlayersEvenly'

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
