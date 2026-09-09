// src/components/ScoreboardScreen.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ScoreboardScreen from './ScoreboardScreen'

describe('ScoreboardScreen', () => {
  it('renders the final score heading and a play again button', () => {
    render(<ScoreboardScreen />)

    expect(screen.getByRole('heading', { name: 'Final score' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play again' })).toBeInTheDocument()
  })

  it('renders each team with their round scores and total', () => {
    render(<ScoreboardScreen />)

    const team1Row = screen.getByText('Team 1').closest('tr')
    expect(team1Row).not.toBeNull()
    expect(team1Row).toHaveTextContent('4')
    expect(team1Row).toHaveTextContent('5')
    expect(team1Row).toHaveTextContent('6')
    expect(team1Row).toHaveTextContent('15')

    const team2Row = screen.getByText('Team 2').closest('tr')
    expect(team2Row).not.toBeNull()
    expect(team2Row).toHaveTextContent('3')
    expect(team2Row).toHaveTextContent('4')
    expect(team2Row).toHaveTextContent('5')
    expect(team2Row).toHaveTextContent('12')
  })

  it('highlights the winning team only', () => {
    render(<ScoreboardScreen />)

    expect(screen.getByText('Team 1').closest('tr')).toHaveClass('is-winner')
    expect(screen.getByText('Team 2').closest('tr')).not.toHaveClass('is-winner')
  })
})
