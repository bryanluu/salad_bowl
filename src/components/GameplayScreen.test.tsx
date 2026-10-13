// src/components/GameplayScreen.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, act } from '@testing-library/react'
import GameplayScreen from './GameplayScreen'
import { copy } from '../copy/en'
import type { GameConfig, Round, Team, Word, WordSource } from '../types'
import type { GameplaySnapshot } from '../persistence/gameStorage'
import { renderWithSound } from '../test/renderWithSound'
import { sounds } from '../sounds.ts'

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
    generateAllWords: false,
  }
}

const { turnCurtain, roundCurtain, gotItButton } = copy.gameplay

// A resumable mid-game state. Mirrors what GameplayScreen would hold at a
// curtain — the tests below only override the few fields that differ.
function buildSnapshot(overrides: Partial<GameplaySnapshot> = {}): GameplaySnapshot {
  return {
    teams: [teamA, teamB],
    round: 1,
    turn: 0,
    bowl: ['Banana', 'Cherry'],
    currentWord: 'Apple',
    wonWords: {},
    scores: [
      { id: 'team-a', name: 'Red Team', rounds: [] },
      { id: 'team-b', name: 'Blue Team', rounds: [] },
    ],
    turnEnded: false,
    roundJustEnded: false,
    ...overrides,
  }
}

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

// A stand-in for HTMLAudioElement that records plays per instance. The
// engine keeps one element per sound name (see useSoundEffects.tsx), so
// instances map 1:1 to sounds.
class MockAudio {
  static instances: MockAudio[] = []

  url: string
  currentTime = 0
  playCalls = 0

  constructor(url: string) {
    this.url = url
    MockAudio.instances.push(this)
  }

  play(): Promise<void> {
    this.playCalls += 1
    return Promise.resolve()
  }

  pause(): void { }
}

function bySound(name: keyof typeof sounds): MockAudio | undefined {
  return MockAudio.instances.find((instance) => instance.url === sounds[name])
}

// The engine withholds all sound until a user gesture (see
// useSoundEffects.tsx), and a synthetic click doesn't provide one — unlock
// explicitly for the tests that assert on playback. The gesture also
// primes every sound (a muted play→pause pass — see useSoundEffects.tsx),
// which would otherwise inflate the playCalls counts these tests assert on;
// flush that pass and zero the counters so it's invisible here (the hook's
// own test suite covers priming itself). Uses runAllTicks rather than real
// timers/awaits since this file runs under fake timers.
async function unlockAudio() {
  await act(async () => {
    fireEvent.pointerDown(window)
    await Promise.resolve()
    await Promise.resolve()
  })
  MockAudio.instances.forEach((instance) => { instance.playCalls = 0 })
}

describe('GameplayScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // pickWord/switchWord draw via Math.random — pinning it to 0 always
    // selects the first word in the bowl, making every draw deterministic.
    vi.spyOn(Math, 'random').mockReturnValue(0)
    vi.stubGlobal('Audio', MockAudio)
    MockAudio.instances = []
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('shows RoundIntroCurtain for round 1 while the bowl is full and untouched', () => {
    const source = buildSource(['Apple', 'Banana'])
    renderWithSound(<GameplayScreen
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
    renderWithSound(<GameplayScreen
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
    renderWithSound(<GameplayScreen
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
    renderWithSound(<GameplayScreen
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
    renderWithSound(<GameplayScreen
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
    renderWithSound(<GameplayScreen
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
    expect(screen.getByRole('button', { name: copy.gameplay.scoreboard.button.newGame })).toBeInTheDocument()

  })

  it('labels each round-ending TurnCurtain with the round that just finished', () => {
    const source = buildSource(['Apple'])
    renderWithSound(<GameplayScreen
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

  describe('resume from a snapshot', () => {
    it('shows the turn-recap curtain naming the next team, and Go starts that turn with the saved word', () => {
      renderWithSound(<GameplayScreen
        config={buildConfig(30)}
        source={buildSource(['Apple', 'Banana', 'Cherry'])}
        onNewGame={vi.fn()}
        initialState={buildSnapshot({ turn: 1, turnEnded: true, currentWord: 'Apple' })}
      />)

      expect(screen.getByRole('heading', { name: turnCurtain.turnOverLabel })).toBeInTheDocument()
      expect(screen.getByText(turnCurtain.readyPrompt(teamB.name))).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: turnCurtain.goButton(false) }))

      expect(screen.getByText(copy.gameplay.turnIndicator(teamB.name))).toBeInTheDocument()
      expect(screen.getByText('Apple')).toBeInTheDocument()
    })

    it('shows the round-end recap curtain for the round that just finished', () => {
      renderWithSound(<GameplayScreen
        config={buildConfig(30)}
        source={buildSource(['Apple', 'Banana', 'Cherry'])}
        onNewGame={vi.fn()}
        initialState={buildSnapshot({
          round: 2,
          turn: 0,
          turnEnded: true,
          roundJustEnded: true,
          currentWord: null,
          bowl: ['Banana', 'Cherry'],
        })}
      />)

      // roundJustEnded means round-1 just ended, so the curtain names round 1
      // (GameplayScreen renders round - 1 for a non-final round recap).
      expect(screen.getByRole('heading', { name: turnCurtain.roundOverLabel(1) })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: turnCurtain.goButton(true) })).toBeInTheDocument()
    })

    it('shows the round-intro curtain naming the team that goes first, and Begin deals a word', () => {
      renderWithSound(<GameplayScreen
        config={buildConfig(30)}
        source={buildSource(['Apple', 'Banana', 'Cherry'])}
        onNewGame={vi.fn()}
        initialState={buildSnapshot({
          round: 1,
          turn: 0,
          currentWord: null,
          bowl: ['Apple', 'Banana', 'Cherry'],
        })}
      />)

      expect(screen.getByText(roundCurtain.roundLabel(1))).toBeInTheDocument()
      expect(screen.getByText(roundCurtain.readyPrompt(teamA.name))).toBeInTheDocument()

      beginRound()

      expect(screen.getByText(copy.gameplay.turnIndicator(teamA.name))).toBeInTheDocument()
      // startRound draws from the source (not the snapshot bowl); with
      // Math.random pinned to 0 that's the source's first word.
      expect(screen.getByText('Apple')).toBeInTheDocument()
    })
  })

  it('keeps the turn timer stopped while a resumed curtain is up (no skipped player)', async () => {
    // The resume shape that used to start the countdown behind the curtain:
    // a word already in play *and* the curtain up.
    renderWithSound(<GameplayScreen
      config={buildConfig(3)} // timerSeconds = 3
      source={buildSource(['Apple', 'Banana', 'Cherry'])}
      onNewGame={vi.fn()}
      initialState={buildSnapshot({ turn: 1, turnEnded: true, currentWord: 'Apple' })}
    />)

    await unlockAudio()

    // Several full turn periods. Without the !turnEnded guard this runs the
    // clock to zero, fires the buzzer, and hands the turn to team A.
    act(() => { vi.advanceTimersByTime(3 * 1000 * 5) })

    // Still the same curtain, still naming team B, and nothing sounded.
    expect(screen.getByRole('heading', { name: turnCurtain.turnOverLabel })).toBeInTheDocument()
    expect(screen.getByText(turnCurtain.readyPrompt(teamB.name))).toBeInTheDocument()
    expect(bySound('buzzer')?.playCalls ?? 0).toBe(0)
    expect(bySound('tick')?.playCalls ?? 0).toBe(0)
  })

  describe('sound effects', () => {
    it('ticks at the start of a turn (t=0), then once per second', async () => {
      const source = buildSource(['Apple', 'Banana'])
      renderWithSound(<GameplayScreen
        config={buildConfig(30)}
        source={source}
        onNewGame={vi.fn()}
      />)

      await unlockAudio()

      beginRound()
      expect(bySound('tick')?.playCalls).toBe(1) // the t=0 start-of-turn beat

      act(() => { vi.advanceTimersByTime(1000) })
      expect(bySound('tick')?.playCalls).toBe(2)

      act(() => { vi.advanceTimersByTime(1000) })
      expect(bySound('tick')?.playCalls).toBe(3)
    })

    it('plays the round sting as the last card is won, not when the scoreboard shows', async () => {
      const source = buildSource(['Apple'])
      renderWithSound(<GameplayScreen
        config={buildConfig(30)}
        source={source}
        onNewGame={vi.fn()}
      />)
      await unlockAudio()

      beginRound()
      winCurrentWord() // the only word — the round ends on this win

      expect(bySound('win')?.playCalls).toBe(1)
      expect(bySound('round')?.playCalls).toBe(1) // the moment of the win

      closeRoundEndCurtain() // scoreboard appears
      expect(bySound('round')?.playCalls).toBe(1) // ...and not repeated there
    })

    it('stings every round on its last card (the final one too), with the verdict only once the final scoreboard appears', async () => {
      const source = buildSource(['Apple'])
      renderWithSound(<GameplayScreen
        config={buildConfig(30)}
        source={source}
        onNewGame={vi.fn()}
      />)
      await unlockAudio()

      for (let round = 1; round <= 3; round++) {
        beginRound()
        winCurrentWord()

        // Every round ends with the sting the moment its last card is won —
        // round 3 included, so the player hears the same cue they've been
        // taught to expect at the end of a round.
        expect(bySound('round')?.playCalls).toBe(round)
        // ...but the game's verdict waits for the scoreboard, even after
        // the very last card.
        expect(bySound('celebration')?.playCalls).toBe(0)
        expect(bySound('tie')?.playCalls).toBe(0)

        closeRoundEndCurtain()
        if (round < 3) continueScoreboard()
      }

      // Team A plays first in rounds 1 and 3, so it takes the game — the
      // final scoreboard, the moment it appears, gets the celebration,
      // not a tie. The sting was not repeated there.
      expect(bySound('celebration')?.playCalls).toBe(1)
      expect(bySound('tie')?.playCalls).toBe(0)
      expect(bySound('round')?.playCalls).toBe(3)
    })
  })
})

