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
