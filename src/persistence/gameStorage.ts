// src/persistence/gameStorage.ts
//
// Framework-agnostic save/load for a single in-progress game, backed by
// localStorage. The storage layer owns the on-disk shape: `currentWord` is
// `null` here (JSON has no `undefined`), and GameplayScreen is the boundary
// that turns `null` back into the `undefined` it uses for "no word in play"
// (see the `initialState` prop there). Everything else round-trips as-is.
//
// All localStorage access is wrapped in try/catch: private mode, quota
// pressure, and disabled storage all surface as throws, and none of them
// should ever take the game down. Saving and clearing fail silently;
// loading returns `null` (and clears a bad entry).
import type { GameConfig, Round, Scores, Team, Word } from '../types'

export const SAVE_VERSION = 1
const STORAGE_KEY = 'salad-bowl:game'

// The point in a game we can safely resume from — captured at a curtain,
// never mid-turn. `currentWord` is `null` (not `undefined`) for the JSON
// boundary, as noted above.
export type GameplaySnapshot = {
  // Play order, already shuffled (or in config order) for the game.
  teams: Team[]
  round: Round
  // Index into `teams` of the team whose turn is (or is about to be) in play.
  turn: number
  bowl: Word[]
  currentWord: Word | null
  // Per-team round tally plus the reserved "onTurn" key.
  wonWords: Record<string, Word[]>
  scores: Scores
  turnEnded: boolean
  roundJustEnded: boolean
}

// What's actually stored. `sourceWords` is `source.getWords()` at save time —
// every round refills the bowl from the source, so resuming needs the full
// word list back, not just what's left in the current bowl.
export type SavedGame = GameplaySnapshot & {
  version: number
  config: GameConfig
  sourceWords: Word[]
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isTeam(value: unknown): value is Team {
  if (typeof value !== 'object' || value === null) return false
  const team = value as Record<string, unknown>
  return typeof team.id === 'string'
    && typeof team.name === 'string'
    && typeof team.players === 'number'
}

function isTeamArray(value: unknown): value is Team[] {
  return Array.isArray(value) && value.every(isTeam)
}

function isScores(value: unknown): value is Scores {
  if (!Array.isArray(value)) return false
  return value.every((entry) => {
    if (typeof entry !== 'object' || entry === null) return false
    const score = entry as Record<string, unknown>
    return typeof score.id === 'string'
      && typeof score.name === 'string'
      && Array.isArray(score.rounds)
      && score.rounds.every((n) => typeof n === 'number')
  })
}

function isWonWords(value: unknown): value is Record<string, Word[]> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return Object.values(value).every(isStringArray)
}

function isConfig(value: unknown): value is GameConfig {
  if (typeof value !== 'object' || value === null) return false
  const config = value as Record<string, unknown>
  return typeof config.totalPlayers === 'number'
    && isTeamArray(config.teams)
    && typeof config.timerSeconds === 'number'
    && typeof config.wordsPerPlayer === 'number'
    && typeof config.shuffleTeamOrder === 'boolean'
    && typeof config.hideWordsDuringEntry === 'boolean'
    && typeof config.generateAllWords === 'boolean'
}

// Hand-written guard: no schema library. Anything that fails a single check
// is treated as foreign/corrupt and rejected wholesale.
function isSavedGame(value: unknown): value is SavedGame {
  if (typeof value !== 'object' || value === null) return false
  const game = value as Record<string, unknown>

  if (game.version !== SAVE_VERSION) return false
  if (!isConfig(game.config)) return false

  const teams = game.teams
  if (!isTeamArray(teams) || teams.length === 0) return false
  if (game.round !== 1 && game.round !== 2 && game.round !== 3) return false
  const turn = game.turn
  if (
    typeof turn !== 'number'
    || !Number.isInteger(turn)
    || turn < 0
    || turn >= teams.length
  ) return false
  if (!isStringArray(game.bowl)) return false
  if (!isStringArray(game.sourceWords)) return false
  if (!isWonWords(game.wonWords)) return false
  if (!isScores(game.scores)) return false
  if (typeof game.turnEnded !== 'boolean') return false
  if (typeof game.roundJustEnded !== 'boolean') return false
  if (game.currentWord !== null && typeof game.currentWord !== 'string') return false

  return true
}

export function saveGame(game: SavedGame): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
  } catch {
    // Storage unavailable or over quota — saving is best-effort, so a
    // failure just means there's nothing to resume to this session.
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Same as saveGame: clearing is best-effort.
  }
}

export function loadGame(): SavedGame | null {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (raw === null) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Unparseable — drop it so a fresh game can write over the slot.
    clearGame()
    return null
  }

  if (!isSavedGame(parsed)) {
    clearGame()
    return null
  }
  return parsed
}
