// src/components/TurnCurtain.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, act } from '@testing-library/react'
import TurnCurtain from './TurnCurtain'
import { copy } from '../copy/en'
import { renderWithSound } from '../test/renderWithSound'

const { turnCurtain } = copy.gameplay

describe('TurnCurtain', () => {
  it('shows the turn-over title and next-player prompt mid-round', () => {
    renderWithSound(
      <TurnCurtain
        correctCount={4}
        nextTeamName="Red Team"
        roundEnded={false}
        round={1}
        onNext={vi.fn()}
      />
    )

    expect(screen.getByRole('heading', { name: turnCurtain.turnOverLabel })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(turnCurtain.resultLabel(4))
    expect(screen.getByText(turnCurtain.readyPrompt('Red Team'))).toBeInTheDocument()
    expect(screen.getByRole('button', { name: turnCurtain.goButton(false) })).toBeInTheDocument()
  })

  it('shows the round-over title and hides the next-player prompt when the round ended', () => {
    renderWithSound(
      <TurnCurtain
        correctCount={7}
        nextTeamName="Blue Team"
        roundEnded={true}
        round={2}
        onNext={vi.fn()}
      />
    )

    expect(screen.getByRole('heading', { name: turnCurtain.roundOverLabel(2) })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(turnCurtain.resultLabel(7))
    expect(screen.queryByText(turnCurtain.readyPrompt('Blue Team'))).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: turnCurtain.goButton(true) })).toBeInTheDocument()
  })

  it('does not call onNext on a quick pointer tap', () => {
    const onNext = vi.fn()

    renderWithSound(
      <TurnCurtain
        correctCount={0}
        nextTeamName="Red Team"
        roundEnded={false}
        round={1}
        onNext={onNext}
      />
    )

    const button = screen.getByRole('button', { name: turnCurtain.goButton(false) })
    fireEvent.pointerDown(button, { isPrimary: true })
    fireEvent.pointerUp(button, { isPrimary: true })
    // A quick tap also dispatches a real click (detail >= 1), which must
    // not be mistaken for the keyboard-instant path.
    fireEvent.click(button, { detail: 1 })
    expect(onNext).not.toHaveBeenCalled()
  })

  it('calls onNext once the button has been held for the full duration', () => {
    vi.useFakeTimers()
    const onNext = vi.fn()

    renderWithSound(
      <TurnCurtain
        correctCount={0}
        nextTeamName="Red Team"
        roundEnded={false}
        round={1}
        onNext={onNext}
      />
    )

    const button = screen.getByRole('button', { name: turnCurtain.goButton(false) })
    fireEvent.pointerDown(button, { isPrimary: true })
    expect(screen.getByRole('button', { name: turnCurtain.holdingLabel(3) })).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(3000) })
    expect(onNext).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('resets the hold instead of pausing it when released early', () => {
    vi.useFakeTimers()
    const onNext = vi.fn()

    renderWithSound(
      <TurnCurtain
        correctCount={0}
        nextTeamName="Red Team"
        roundEnded={false}
        round={1}
        onNext={onNext}
      />
    )

    const button = screen.getByRole('button', { name: turnCurtain.goButton(false) })
    fireEvent.pointerDown(button, { isPrimary: true })
    act(() => { vi.advanceTimersByTime(1000) })
    fireEvent.pointerUp(button, { isPrimary: true })
    expect(screen.getByRole('button', { name: turnCurtain.goButton(false) })).toBeInTheDocument()

    fireEvent.pointerDown(button, { isPrimary: true })
    act(() => { vi.advanceTimersByTime(2000) })
    expect(onNext).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: turnCurtain.holdingLabel(1) })).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('advances instantly on a keyboard-activated click (detail 0), autofocused for Enter', () => {
    const onNext = vi.fn()

    renderWithSound(
      <TurnCurtain
        correctCount={0}
        nextTeamName="Red Team"
        roundEnded={false}
        round={1}
        onNext={onNext}
      />
    )

    const button = screen.getByRole('button', { name: turnCurtain.goButton(false) })
    expect(button).toHaveFocus()

    fireEvent.click(button, { detail: 0 })
    expect(onNext).toHaveBeenCalledTimes(1)
  })
})
