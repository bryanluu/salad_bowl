import type { Team } from "../types.ts"
import { minPlayersPerTeam } from "../teams/roster.ts";


export type Confirmation = { ok: true }

export type Rejection =
  | { ok: false; reason: 'invalid-configuration' }
  | { ok: false; reason: 'insufficient-players-per-team' }
  | { ok: false; reason: 'unassigned-players' }
  | { ok: false; reason: 'too-many-players' }
  | { ok: false; reason: 'invalid-team-name' }
  | { ok: false; reason: 'duplicate-team-name' }

export type ValidationResult = Confirmation | Rejection

export function validateRoster(teams: Team[], totalPlayers: number): ValidationResult {
  if (teams.length === 0 || totalPlayers === 0) {
    return { ok: false, reason: 'invalid-configuration' }
  }
  if (teams.some((t) => t.players < minPlayersPerTeam)) {
    return { ok: false, reason: 'insufficient-players-per-team' }
  }
  const assignedPlayers = teams.reduce((sum, t) => sum + t.players, 0)
  if (assignedPlayers < totalPlayers) {
    return { ok: false, reason: 'unassigned-players' }
  }
  if (assignedPlayers > totalPlayers) {
    return { ok: false, reason: 'too-many-players' }
  }
  if (teams.some((t) => {
    return t.name === ''
  })) {
    return { ok: false, reason: 'invalid-team-name' }
  }
  const existingNames: { [key: string]: boolean } = {}
  for (const t of teams) {
    if (existingNames[t.name])
      return { ok: false, reason: 'duplicate-team-name' }
    else
      existingNames[t.name] = true
  }
  return { ok: true }
}
