import type { Team } from '../types.ts'

// TODO: should also be called every time totalPlayers changes below assignedPlayers
/** Split players evenly across teams; leftover players go to the first teams.
 *  Existing names are kept, with defaults filling any gaps. */
export function splitPlayersEvenly(totalPlayers: number, teamCount: number, existingNames: string[]): Team[] {
  const base = Math.floor(totalPlayers / teamCount)
  const remainder = totalPlayers % teamCount
  return Array.from({ length: teamCount }, (_, i) => ({
    id: `team-${i + 1}`,
    name: existingNames[i] ?? `Team ${i + 1}`,
    players: base + (i < remainder ? 1 : 0),
  }))
}
