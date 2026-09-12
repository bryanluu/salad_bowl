// src/components/TurnCurtain.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TurnCurtain from './TurnCurtain'

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

    expect(screen.getByRole('heading', { name: 'Turn over!' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('You got 4 correct.')
    expect(screen.getByText('Next player on Red Team, ready?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
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

    expect(screen.getByRole('heading', { name: 'Round 2 finished!' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('You got 7 correct.')
    expect(screen.queryByText('Next player on Blue Team, ready?')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
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

    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
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

    expect(screen.getByRole('button', { name: 'Go' })).toHaveFocus()
  })
})
