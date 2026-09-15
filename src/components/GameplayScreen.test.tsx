// src/components/GameplayScreen.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import GameplayScreen from './GameplayScreen'
import { copy } from '../copy/en'
import type { GameConfig, Round, Team, Word, WordSource } from '../types'

const teamA: Team = { id: 'team-a', name: 'Red Team', players: 2 }
const teamB: Team = { id: 'team-b', name: 'Blue Team', players: 2 }

// Fixed word list, unaffected by GameplayScreen's own bowl bookkeeping —
// mirrors LocalWordSource.getWords(), which always returns the same
// stored words regardless of what a round does with them.
function buildSource(words: Word[]): WordSource {
  return {
    maxWords: words.length,
    addWord: () => false,
    removeWord: () => false,
    getWords: () => [...words],
    count: () => words.length,
  }
}

function buildConfig(timerSeconds: number): GameConfig {
  return {
    totalPlayers: 4,
    teams: [teamA, teamB],
    timerSeconds,
    wordsPerPlayer: 5,
    shuffleTeamOrder: false,
    hideWordsDuringEntry: false,
  }
}

const { turnCurtain, roundCurtain, gotItButton } = copy.gameplay

function beginRound() {
  fireEvent.click(screen.getByRole('button', { name: roundCurtain.beginButton }))
}

function winCurrentWord() {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(gotItButton) }))
}

function closeRoundEndCurtain() {
  fireEvent.click(screen.getByRole('button', { name: turnCurtain.goButton(true) }))
}

function continueScoreboard() {
  fireEvent.click(screen.getByRole('button', { name: copy.gameplay.scoreboard.button.continue }))
}

describe('GameplayScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // pickWord/switchWord draw via Math.random — pinning it to 0 always
    // selects the first word in the bowl, making every draw deterministic.
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('shows RoundIntroCurtain for round 1 while the bowl is full and untouched', () => {
    const source = buildSource(['Apple', 'Banana'])
    render(<GameplayScreen
      config={buildConfig(30)}
      source={source}
      onNewGame={vi.fn()}
    />)

    expect(screen.getByText(roundCurtain.roundLabel(1))).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: copy.gameplay.round[1].label })).toBeInTheDocument()
    expect(screen.getByText(roundCurtain.readyPrompt(teamA.name))).toBeInTheDocument()
  })

  it('starting the round via onBegin shows TurnScreen with a word in play', () => {
    const source = buildSource(['Apple', 'Banana'])
    render(<GameplayScreen
      config={buildConfig(30)}
      source={source}
      onNewGame={vi.fn()}
    />)

    beginRound()

    expect(screen.getByText(copy.gameplay.turnIndicator(teamA.name))).toBeInTheDocument()
    expect(screen.getByText('Apple')).toBeInTheDocument()
    // 'Banana' remains in the bowl, plus 'Apple' currently in play
    expect(screen.getByText(copy.gameplay.wordsLeft(2))).toBeInTheDocument()
  })

  it('shows TurnCurtain naming the next team when the turn timer expires mid-round', () => {
    const source = buildSource(['Apple', 'Banana'])
    render(<GameplayScreen
      config={buildConfig(3)}
      source={source}
      onNewGame={vi.fn()}
    />)

    beginRound()
    act(() => { vi.advanceTimersByTime(3000) })

    expect(screen.getByRole('heading', { name: turnCurtain.turnOverLabel })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(turnCurtain.resultLabel(0))
    expect(screen.getByText(turnCurtain.readyPrompt(teamB.name))).toBeInTheDocument()
    expect(screen.getByRole('button', { name: turnCurtain.goButton(false) })).toBeInTheDocument()
  })

  it('winning the last word ends the round and shows the round-summary TurnCurtain', () => {
    const source = buildSource(['Apple'])
    render(<GameplayScreen
      config={buildConfig(30)}
      source={source}
      onNewGame={vi.fn()}
    />)

    beginRound()
    winCurrentWord()

    expect(screen.getByRole('heading', { name: turnCurtain.roundOverLabel(1) })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(turnCurtain.resultLabel(1))
    expect(screen.getByRole('button', { name: turnCurtain.goButton(true) })).toBeInTheDocument()
  })

  it('closing the round-summary curtain shows the scoreboard with mid-game content', () => {
    const source = buildSource(['Apple'])
    render(<GameplayScreen
      config={buildConfig(30)}
      source={source}
      onNewGame={vi.fn()}
    />)

    beginRound()
    winCurrentWord()
    closeRoundEndCurtain()

    expect(screen.getByRole('heading', { name: copy.gameplay.scoreboard.title(1) })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: copy.gameplay.scoreboard.button.continue })).toBeInTheDocument()
    expect(screen.getByText(teamA.name)).toBeInTheDocument()
    expect(screen.getByText(teamB.name)).toBeInTheDocument()
  })

  it('shows final scores and a replay button after round 3', () => {
    const source = buildSource(['Apple'])
    render(<GameplayScreen
      config={buildConfig(30)}
      source={source}
      onNewGame={vi.fn()}
    />)

    // Play through all three rounds: begin, win the only word (ends the
    // round), close the summary curtain, continue past the scoreboard.
    for (let round = 1; round <= 3; round++) {
      beginRound()
      winCurrentWord()
      closeRoundEndCurtain()

      if (round < 3) {
        continueScoreboard()
      }
    }

    expect(screen.getByRole('heading', { name: copy.gameplay.scoreboard.title(3) })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: copy.gameplay.scoreboard.button.playAgain })).toBeInTheDocument()

  })

  it('labels each round-ending TurnCurtain with the round that just finished', () => {
    const source = buildSource(['Apple'])
    render(<GameplayScreen
      config={buildConfig(30)}
      source={source}
      onNewGame={vi.fn()}
    />)

    for (let round = 1; round <= 3; round++) {
      beginRound()
      winCurrentWord()

      expect(
        screen.getByRole('heading', { name: turnCurtain.roundOverLabel(round as Round) })
      ).toBeInTheDocument()

      closeRoundEndCurtain()
      if (round < 3) continueScoreboard()
    }
  })
})

