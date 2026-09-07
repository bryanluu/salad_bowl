import type { Team } from '../types.ts'

export const minPlayersPerTeam = 2 // need 1 player to prompt, at least 1 player to guess

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

/** Dynamic max for a single team's player Stepper.
 *  A team may grow only as far as the players still unassigned across the
 *  roster, so its cap is its current count plus that headroom:
 *
 *    max = totalPlayers - (assignedPlayers - teamPlayers)
 *        = teamPlayers + (totalPlayers - assignedPlayers)
 *
 *  When every player is already assigned (assignedPlayers === totalPlayers)
 *  this collapses to the team's own count, so the + button disables in place.
 *  If the total was lowered below the assigned total, the result can fall
 *  below the team's current count — signalling the roster must shrink. */
export function maxPlayersForTeam(totalPlayers: number, assignedPlayers: number, teamPlayers: number): number {
  return totalPlayers - (assignedPlayers - teamPlayers)
}
