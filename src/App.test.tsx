// src/App.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import App from './App'
import { copy } from './copy/en'
import type { Team } from './types'
import {
  SAVE_VERSION,
  saveGame,
  type SavedGame,
} from './persistence/gameStorage'
import { renderWithSound } from './test/renderWithSound'

const STORAGE_KEY = 'salad-bowl:game'
const teamA: Team = { id: 'team-a', name: 'Red Team', players: 2 }
const teamB: Team = { id: 'team-b', name: 'Blue Team', players: 2 }

// A valid mid-game save: round 1, team A has just played (turn advanced to
// team B), team B's turn curtain is up. Used as the default resume fixture.
function buildSavedGame(overrides: Partial<SavedGame> = {}): SavedGame {
  return {
    version: SAVE_VERSION,
    config: {
      totalPlayers: 4,
      teams: [teamA, teamB],
      timerSeconds: 30,
      wordsPerPlayer: 5,
      shuffleTeamOrder: false,
      hideWordsDuringEntry: true,
      generateAllWords: false,
    },
    teams: [teamA, teamB],
    round: 1,
    turn: 1,
    bowl: ['Banana'],
    currentWord: 'Apple',
    wonWords: { 'team-a': ['Apple'], onTurn: ['Apple'] },
    scores: [
      { id: 'team-a', name: 'Red Team', rounds: [1] },
      { id: 'team-b', name: 'Blue Team', rounds: [0] },
    ],
    turnEnded: true,
    roundJustEnded: false,
    sourceWords: ['Apple', 'Banana', 'Cherry'],
    ...overrides,
  }
}

function click(name: string) {
  fireEvent.click(screen.getByRole('button', { name }))
}

describe('App save & resume', () => {
  beforeEach(() => {
    localStorage.clear()
    // Confirm dialogs are accepted by default; the "decline" test overrides.
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows no Resume button when there is no save', () => {
    renderWithSound(<App />)

    expect(screen.queryByRole('button', { name: copy.start.resumeButton })).toBeNull()
    expect(screen.getByRole('button', { name: copy.start.button })).toBeInTheDocument()
  })

  it('offers Resume with a valid save, and resuming shows the right curtain for the right team', () => {
    saveGame(buildSavedGame())
    renderWithSound(<App />)

    expect(screen.getByRole('button', { name: copy.start.resumeButton })).toBeInTheDocument()
    click(copy.start.resumeButton)

    expect(screen.getByRole('heading', { name: copy.gameplay.turnCurtain.turnOverLabel })).toBeInTheDocument()
    expect(screen.getByText(copy.gameplay.turnCurtain.readyPrompt(teamB.name))).toBeInTheDocument()
  })

  it('hides Resume and removes the entry for an invalid save', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 999, bogus: true }))
    renderWithSound(<App />)

    expect(screen.queryByRole('button', { name: copy.start.resumeButton })).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('keeps the save on quit, so Resume still works after a mid-game quit', () => {
    saveGame(buildSavedGame())
    renderWithSound(<App />)

    click(copy.start.resumeButton) // mid-game now, on team B's curtain
    click(copy.footer.quitLabel)

    // Quitting does not clear the save: Resume is back on the start screen.
    expect(screen.getByRole('button', { name: copy.start.resumeButton })).toBeInTheDocument()
    click(copy.start.resumeButton)

    expect(screen.getByText(copy.gameplay.turnCurtain.readyPrompt(teamB.name))).toBeInTheDocument()
  })

  it('Play with a save, declining the confirm, stays on the start screen with the save intact', () => {
    saveGame(buildSavedGame())
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderWithSound(<App />)

    click(copy.start.button)

    expect(screen.getByRole('button', { name: copy.start.resumeButton })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: copy.start.button })).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
  })

  it('Play with a save, accepted, replaces the save and opens game setup', () => {
    saveGame(buildSavedGame())
    renderWithSound(<App />)

    click(copy.start.button)

    expect(screen.getByRole('heading', { name: copy.gameSetup.title })).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('a new game started after a resume begins fresh, not from the old snapshot', () => {
    saveGame(buildSavedGame({ turn: 1, turnEnded: true }))
    renderWithSound(<App />)

    // Resume lands on team B's turn curtain (turn 1).
    click(copy.start.resumeButton)
    expect(screen.getByText(copy.gameplay.turnCurtain.readyPrompt(teamB.name))).toBeInTheDocument()

    // Quit, then start a new game (accept the replace-save confirm).
    click(copy.footer.quitLabel)
    click(copy.start.button)

    // Skip word entry by generating all words, then submit the setup form.
    fireEvent.click(screen.getByRole('checkbox', { name: copy.gameSetup.generateAllWordsLabel }))
    click(copy.gameSetup.startButton)

    // The fresh game opens on round 1's intro naming team A — not team B's
    // turn curtain from the snapshot we just resumed from.
    expect(screen.getByText(copy.gameplay.roundCurtain.roundLabel(1))).toBeInTheDocument()
    expect(screen.getByText(copy.gameplay.roundCurtain.readyPrompt(teamA.name))).toBeInTheDocument()
    expect(screen.queryByText(copy.gameplay.turnCurtain.turnOverLabel)).toBeNull()
  })
})
