// src/components/TurnCurtain.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TurnCurtain from './TurnCurtain'
import { copy } from '../copy/en'

const { turnCurtain } = copy.gameplay

describe('TurnCurtain', () => {
  it('shows the turn-over title and next-player prompt mid-round', () => {
    render(
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
    render(
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

  it('calls onNext when the button is clicked', () => {
    const onNext = vi.fn()

    render(
      <TurnCurtain
        correctCount={0}
        nextTeamName="Red Team"
        roundEnded={false}
        round={1}
        onNext={onNext}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: turnCurtain.goButton(false) }))
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('autofocuses the button so pressing Enter advances immediately', () => {
    render(
      <TurnCurtain
        correctCount={0}
        nextTeamName="Red Team"
        roundEnded={false}
        round={1}
        onNext={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: turnCurtain.goButton(false) })).toHaveFocus()
  })
})
