// src/components/GameplayScreen.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from 'react'
import GameplayScreen from './GameplayScreen'
import { LocalWordSource } from '../wordSources/LocalWordSource'
import type { GameConfig } from '../types'

function makeConfig(overrides: Partial<GameConfig> = {}): GameConfig {
  return {
    totalPlayers: 4,
    teams: [
      { id: 'team-1', name: 'Team 1', players: 2 },
      { id: 'team-2', name: 'Team 2', players: 2 },
    ],
    timerSeconds: 60,
    wordsPerPlayer: 3,
    shuffleTeamOrder: false,
    ...overrides,
  }
}

function seededSource(...words: string[]) {
  const source = new LocalWordSource(words.length)
  for (const word of words) source.addWord(word)
  return source
}

describe('GameplayScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // pickWord and shuffle both use Math.random; pinning it to 0 makes
    // "the first item" the deterministic choice for both.
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders the initial turn state', () => {
    render(<GameplayScreen config={makeConfig()} source={seededSource('banana', 'apple', 'cherry')} />)

    expect(screen.getByText('Round 1 · Taboo')).toBeInTheDocument()
    expect(screen.getByText('1:00')).toBeInTheDocument()
    expect(screen.getByText("Team 1's turn")).toBeInTheDocument()
    expect(screen.getByText('banana')).toBeInTheDocument()
    expect(screen.getByText('3 prompts left')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Got it!' })).toBeInTheDocument()
  })

  it('counts down every second', () => {
    render(<GameplayScreen config={makeConfig()} source={seededSource('banana', 'apple', 'cherry')} />)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByText('0:59')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getByText('0:57')).toBeInTheDocument()
  })

  it('advances to the next team when the timer expires', () => {
    render(
      <GameplayScreen
        config={makeConfig({ timerSeconds: 1 })}
        source={seededSource('banana', 'apple', 'cherry')}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByText("Team 2's turn")).toBeInTheDocument()
    expect(screen.getByText('0:01')).toBeInTheDocument()
  })

  it('applies the shuffled team order and still advances turns on expiry', () => {
    render(
      <GameplayScreen
        config={makeConfig({ timerSeconds: 1, shuffleTeamOrder: true })}
        source={seededSource('banana', 'apple', 'cherry')}
      />,
    )

    expect(screen.getByText("Team 2's turn")).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByText("Team 1's turn")).toBeInTheDocument()
  })

  it('cycles skipped words back into the bowl without changing the remaining count', () => {
    render(<GameplayScreen config={makeConfig()} source={seededSource('banana', 'apple', 'cherry')} />)

    expect(screen.getByText('banana')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(screen.getByText('apple')).toBeInTheDocument()
    expect(screen.getByText('3 prompts left')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(screen.getByText('cherry')).toBeInTheDocument()
    expect(screen.getByText('3 prompts left')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(screen.getByText('banana')).toBeInTheDocument()
    expect(screen.getByText('3 prompts left')).toBeInTheDocument()
  })

  it('removes a word from the bowl permanently when marked as gotten', () => {
    render(<GameplayScreen config={makeConfig()} source={seededSource('banana', 'apple', 'cherry')} />)

    fireEvent.click(screen.getByRole('button', { name: 'Got it!' }))

    // unlike Skip, winWord does not return the previous word to the bowl,
    // so the remaining count drops from 3 to 2.
    expect(screen.getByText('apple')).toBeInTheDocument()
    expect(screen.getByText('2 prompts left')).toBeInTheDocument()
  })

  it('clears the word card and freezes the timer once the bowl is empty', () => {
    render(<GameplayScreen config={makeConfig()} source={seededSource('kiwi')} />)

    expect(screen.getByText('kiwi')).toBeInTheDocument()
    expect(screen.getByText('1 prompts left')).toBeInTheDocument()
    expect(screen.getByText('1:00')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Got it!' }))

    expect(screen.queryByText('kiwi')).not.toBeInTheDocument()
    expect(screen.getByText('0 prompts left')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.getByText('1:00')).toBeInTheDocument()
  })
})
