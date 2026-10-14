// src/persistence/gameStorage.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  SAVE_VERSION,
  saveGame,
  loadGame,
  clearGame,
  type SavedGame,
} from './gameStorage'
import type { Team } from '../types'

const STORAGE_KEY = 'salad-bowl:game'

const teamA: Team = { id: 'team-a', name: 'Red Team', players: 2 }
const teamB: Team = { id: 'team-b', name: 'Blue Team', players: 2 }

// A fully valid saved game to mutate per test.
function buildSavedGame(overrides: Partial<SavedGame> = {}): SavedGame {
  return {
    version: SAVE_VERSION,
    config: {
      totalPlayers: 4,
      teams: [teamA, teamB],
      timerSeconds: 30,
      wordsPerPlayer: 5,
      shuffleTeamOrder: false,
      hideWordsDuringEntry: false,
      generateAllWords: false,
    },
    teams: [teamA, teamB],
    round: 1,
    turn: 0,
    bowl: ['Banana', 'Cherry'],
    currentWord: 'Apple',
    wonWords: { 'team-a': ['Grape'], onTurn: ['Fruit'] },
    scores: [
      { id: 'team-a', name: 'Red Team', rounds: [1] },
      { id: 'team-b', name: 'Blue Team', rounds: [0] },
    ],
    turnEnded: false,
    roundJustEnded: false,
    sourceWords: ['Apple', 'Banana', 'Cherry'],
    ...overrides,
  }
}

function expectClearedSlot() {
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
}

describe('gameStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('round trip', () => {
    it('saves and loads the same game back', () => {
      const game = buildSavedGame()
      saveGame(game)
      expect(loadGame()).toEqual(game)
    })

    it('round-trips a null currentWord as null (the undefined boundary is GameplayScreen’s)', () => {
      saveGame(buildSavedGame({ currentWord: null }))
      expect(loadGame()?.currentWord).toBeNull()
    })
  })

  describe('nothing saved', () => {
    it('returns null when there is no entry', () => {
      expect(loadGame()).toBeNull()
    })

    it('clearGame removes the entry', () => {
      saveGame(buildSavedGame())
      clearGame()
      expect(loadGame()).toBeNull()
    })
  })

  describe('invalid entries', () => {
    it('returns null and clears a corrupt JSON entry', () => {
      localStorage.setItem(STORAGE_KEY, '{ not json')
      expect(loadGame()).toBeNull()
      expectClearedSlot()
    })

    // These intentionally inject invalid shapes, so they work on a loosely
    // typed object and cast back once at the save call — that single cast is
    // the whole point of the suite.
    function expectRejected(mutate: (game: Record<string, unknown>) => void) {
      const game = { ...buildSavedGame() } as Record<string, unknown>
      mutate(game)
      saveGame(game as SavedGame)
      expect(loadGame()).toBeNull()
      expectClearedSlot()
    }

    it('rejects a wrong version', () => {
      expectRejected((game) => { game.version = SAVE_VERSION + 1 })
    })

    it('rejects an empty teams array', () => {
      expectRejected((game) => { game.teams = [] })
    })

    it('rejects a team missing a field', () => {
      expectRejected((game) => { game.teams = [{ id: 'team-a', name: 'Red' }, teamB] })
    })

    it('rejects a round that is not 1, 2, or 3', () => {
      expectRejected((game) => { game.round = 4 })
    })

    it('rejects a turn out of range', () => {
      expectRejected((game) => { game.turn = 2 }) // === teams.length
      expectRejected((game) => { game.turn = -1 })
    })

    it('rejects a non-integer turn', () => {
      expectRejected((game) => { game.turn = 0.5 })
    })

    it('rejects a bowl that is not a string array', () => {
      expectRejected((game) => { game.bowl = [42] })
    })

    it('rejects sourceWords that is not a string array', () => {
      expectRejected((game) => { game.sourceWords = [{}] })
    })

    it('rejects wonWords with a non-array value', () => {
      expectRejected((game) => { game.wonWords = { 'team-a': 'not-an-array' } })
    })

    it('rejects a scores entry missing its rounds array', () => {
      expectRejected((game) => { game.scores = [{ id: 'team-a', name: 'Red' }] })
    })

    it('rejects non-boolean turnEnded / roundJustEnded', () => {
      expectRejected((game) => { game.turnEnded = 'yes' })
      expectRejected((game) => { game.roundJustEnded = 0 })
    })

    it('rejects a currentWord that is neither a string nor null', () => {
      expectRejected((game) => { game.currentWord = 42 })
    })

    it('rejects a config missing a field', () => {
      expectRejected((game) => { game.config = { timerSeconds: 30 } })
    })
  })

  describe('storage that throws', () => {
    it('saveGame swallows a setItem throw', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('denied')
      })
      expect(() => saveGame(buildSavedGame())).not.toThrow()
    })

    it('clearGame swallows a removeItem throw', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('denied')
      })
      expect(() => clearGame()).not.toThrow()
    })

    it('loadGame returns null when getItem throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('denied')
      })
      expect(loadGame()).toBeNull()
    })
  })
})
