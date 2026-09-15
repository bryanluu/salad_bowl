// src/components/ScoreboardScreen.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ScoreboardScreen from './ScoreboardScreen'
import { copy } from '../copy/en'
import type { Scores } from '../types'

describe('ScoreboardScreen', () => {
  it('shows mid-game content and highlights the leading team after round 1', () => {
    const scores: Scores = [
      { id: 'red', name: 'Red Team', rounds: [3] },
      { id: 'blue', name: 'Blue Team', rounds: [5] },
    ]

    render(<ScoreboardScreen
      scores={scores}
      onNext={vi.fn()}
    />)

    expect(screen.getByRole('heading', { name: copy.gameplay.scoreboard.title(1) })).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: copy.gameplay.scoreboard.tableHeader.team })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: copy.gameplay.scoreboard.tableHeader.round(1) })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: copy.gameplay.scoreboard.tableHeader.total })
    ).toBeInTheDocument()
    expect(screen.getByText('Red Team').closest('tr')).not.toHaveClass('is-winner')
    expect(screen.getByText('Blue Team').closest('tr')).toHaveClass('is-winner')
    expect(
      screen.getByRole('button', { name: copy.gameplay.scoreboard.button.continue })
    ).toBeInTheDocument()
  })

  it('shows final content and totals across all three rounds', () => {
    const scores: Scores = [
      { id: 'red', name: 'Red Team', rounds: [3, 2, 4] },
      { id: 'blue', name: 'Blue Team', rounds: [5, 1, 2] },
    ]

    render(<ScoreboardScreen
      scores={scores}
      onNext={vi.fn()}
    />)

    expect(screen.getByRole('heading', { name: copy.gameplay.scoreboard.title(3) })).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: copy.gameplay.scoreboard.tableHeader.round(1) })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: copy.gameplay.scoreboard.tableHeader.round(2) })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: copy.gameplay.scoreboard.tableHeader.round(3) })
    ).toBeInTheDocument()

    const redRow = screen.getByText('Red Team').closest('tr') as HTMLElement
    const blueRow = screen.getByText('Blue Team').closest('tr') as HTMLElement
    // Red's total (9) beats Blue's (8), so Red is the winner here — the
    // reverse of the mid-game test above, to make sure "winner" tracks the
    // total rather than always highlighting the same row.
    expect(redRow).toHaveTextContent('9')
    expect(blueRow).toHaveTextContent('8')
    expect(redRow).toHaveClass('is-winner')
    expect(blueRow).not.toHaveClass('is-winner')

    expect(
      screen.getByRole('button', { name: copy.gameplay.scoreboard.button.newGame })
    ).toBeInTheDocument()
  })

  it('shows when teams are tied', () => {
    const scores: Scores = [
      { id: 'red', name: 'Red Team', rounds: [3, 2, 4] },
      { id: 'blue', name: 'Blue Team', rounds: [5, 1, 2] },
      { id: 'green', name: "Green Team", rounds: [4, 2, 3] },
    ]

    render(<ScoreboardScreen
      scores={scores}
      onNext={vi.fn()}
    />)

    expect(screen.getByRole('heading', { name: copy.gameplay.scoreboard.title(3) })).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: copy.gameplay.scoreboard.tableHeader.round(1) })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: copy.gameplay.scoreboard.tableHeader.round(2) })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: copy.gameplay.scoreboard.tableHeader.round(3) })
    ).toBeInTheDocument()

    const redRow = screen.getByText('Red Team').closest('tr') as HTMLElement
    const blueRow = screen.getByText('Blue Team').closest('tr') as HTMLElement
    const greenRow = screen.getByText('Green Team').closest('tr') as HTMLElement
    expect(redRow).toHaveTextContent('9')
    expect(blueRow).toHaveTextContent('8')
    expect(greenRow).toHaveTextContent('9')
    expect(redRow).toHaveClass('is-tied')
    expect(blueRow).not.toHaveClass('is-tied')
    expect(greenRow).toHaveClass('is-tied')

    expect(
      screen.getByRole('button', { name: copy.gameplay.scoreboard.button.newGame })
    ).toBeInTheDocument()
  })


  it('calls onNext when the button is clicked', () => {
    const onNext = vi.fn()
    const scores: Scores = [
      { id: 'red', name: 'Red Team', rounds: [1] },
      { id: 'blue', name: 'Blue Team', rounds: [0] },
    ]

    render(<ScoreboardScreen scores={scores} onNext={onNext} />)

    fireEvent.click(screen.getByRole('button', { name: copy.gameplay.scoreboard.button.continue }))
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('autofocuses the button', () => {
    const scores: Scores = [
      { id: 'red', name: 'Red Team', rounds: [1] },
      { id: 'blue', name: 'Blue Team', rounds: [0] },
    ]

    render(<ScoreboardScreen scores={scores} onNext={vi.fn()} />)

    expect(screen.getByRole('button', { name: copy.gameplay.scoreboard.button.continue })).toHaveFocus()
  })
})

