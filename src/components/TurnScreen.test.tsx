// src/components/TurnScreen.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TurnScreen from './TurnScreen'
import { copy } from '../copy/en'
import type { Team } from '../types'

const team: Team = { id: 't1', name: 'Red Team', players: 3 }

describe('TurnScreen', () => {
  it('renders round, timer, turn indicator, word, and words-left count', () => {
    render(
      <TurnScreen
        round={1}
        team={team}
        timeLeft={90}
        currentWord="Banana"
        bowlLength={4}
        onSkip={vi.fn()}
        onWin={vi.fn()}
      />
    )

    expect(
      screen.getByText(copy.gameplay.roundLabel(1, copy.gameplay.round[1].label))
    ).toBeInTheDocument()
    expect(screen.getByText(copy.gameplay.turnIndicator('Red Team'))).toBeInTheDocument()
    expect(screen.getByText('1:30')).toHaveAttribute(
      'aria-label',
      copy.gameplay.timeRemainingLabel('1:30')
    )
    expect(screen.getByText('Banana')).toBeInTheDocument()
    // bowlLength (4) plus the word currently in play (1) = 5
    expect(screen.getByText(copy.gameplay.wordsLeft(5))).toBeInTheDocument()
  })

  it('enables both buttons mid-bowl and reports skip/win on click', () => {
    const onSkip = vi.fn()
    const onWin = vi.fn()

    render(
      <TurnScreen
        round={1}
        team={team}
        timeLeft={60}
        currentWord="Banana"
        bowlLength={4}
        onSkip={onSkip}
        onWin={onWin}
      />
    )

    const skipButton = screen.getByRole('button', { name: new RegExp(copy.gameplay.skipButton) })
    const gotItButton = screen.getByRole('button', { name: new RegExp(copy.gameplay.gotItButton) })

    expect(skipButton).toBeEnabled()
    expect(gotItButton).toBeEnabled()

    fireEvent.click(skipButton)
    expect(onSkip).toHaveBeenCalledTimes(1)

    fireEvent.click(gotItButton)
    expect(onWin).toHaveBeenCalledTimes(1)
  })

  it('disables the skip button on the last word but keeps got-it enabled', () => {
    render(
      <TurnScreen
        round={1}
        team={team}
        timeLeft={60}
        currentWord="Banana"
        bowlLength={0}
        onSkip={vi.fn()}
        onWin={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: new RegExp(copy.gameplay.skipButton) })).toBeDisabled()
    expect(screen.getByRole('button', { name: new RegExp(copy.gameplay.gotItButton) })).toBeEnabled()
  })

  it('disables both buttons once the bowl is empty and no word is in play', () => {
    render(
      <TurnScreen
        round={1}
        team={team}
        timeLeft={60}
        currentWord={undefined}
        bowlLength={0}
        onSkip={vi.fn()}
        onWin={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: new RegExp(copy.gameplay.skipButton) })).toBeDisabled()
    expect(screen.getByRole('button', { name: new RegExp(copy.gameplay.gotItButton) })).toBeDisabled()
    expect(screen.getByText(copy.gameplay.wordsLeft(0))).toBeInTheDocument()
  })

  describe('swipe tracking', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    // jsdom lays nothing out, so give the controls rail a real width.
    function mockRailWidth(width: number) {
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        width, height: 50, top: 0, left: 0, right: width, bottom: 50, x: 0, y: 0, toJSON: () => { },
      })
    }

    const touch = { pointerType: 'touch', isPrimary: true } as const

    it('forgets a touch that was cancelled before it moved', () => {
      mockRailWidth(300)
      render(
        <TurnScreen
          round={1}
          team={team}
          timeLeft={60}
          currentWord="Banana"
          bowlLength={4}
          onSkip={vi.fn()}
          onWin={vi.fn()}
        />
      )
      const stage = screen.getByRole('region', { name: copy.gameplay.title })
      const knob = document.getElementById('control-knob')!

      fireEvent.pointerDown(stage, { ...touch, clientX: 100 })
      fireEvent.pointerCancel(stage, touch)
      // A move arriving with no new pointerdown must not resume the old drag.
      fireEvent.pointerMove(stage, { ...touch, clientX: 200 })

      expect(knob.style.left).toBe('')
    })
  })
})
