// src/components/GameSetupScreen.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GameSetupScreen from './GameSetupScreen'
import type { GameConfig } from '../types'

function makeConfig(): GameConfig {
  return {
    totalPlayers: 4,
    teams: [
      { id: 'team-1', name: 'Team 1', players: 2 },
      { id: 'team-2', name: 'Team 2', players: 2 },
    ],
    timerSeconds: 60,
    wordsPerPlayer: 5,
    shuffleTeamOrder: true,
  }
}

// The stepper's numeric value has no accessible role of its own, so we
// reach it by scoping from its "Decrease <label>" button, per the note
// in the test spec.
function stepperFor(label: string) {
  return screen.getByRole('button', { name: `Decrease ${label}` }).closest('.stepper')
}

describe('GameSetupScreen', () => {
  describe('initial render', () => {
    it('renders the heading, field labels, and a checked shuffle checkbox', () => {
      render(<GameSetupScreen config={makeConfig()} updateConfig={vi.fn()} />)

      expect(screen.getByRole('heading', { name: 'Game setup' })).toBeInTheDocument()
      expect(screen.getByText('Total players')).toBeInTheDocument()
      expect(screen.getByText('Number of teams')).toBeInTheDocument()
      expect(screen.getByText('Timer')).toBeInTheDocument()
      expect(screen.getByText('Prompts / player')).toBeInTheDocument()
      expect(screen.getByLabelText('Random order?')).toBeChecked()
    })

    it('shows the initial stepper values, team names, and status line', () => {
      render(<GameSetupScreen config={makeConfig()} updateConfig={vi.fn()} />)

      expect(stepperFor('total players')).toHaveTextContent('4')
      expect(stepperFor('team 1 players')).toHaveTextContent('2')
      expect(stepperFor('team 2 players')).toHaveTextContent('2')
      expect(stepperFor('timer')).toHaveTextContent('60s')
      expect(stepperFor('words per player')).toHaveTextContent('5')

      expect(screen.getByPlaceholderText("Team 1's name")).toHaveValue('Team 1')
      expect(screen.getByPlaceholderText("Team 2's name")).toHaveValue('Team 2')

      expect(screen.getByText('4 out of 4 players assigned')).toBeInTheDocument()
    })

    it('enables "Start game" for a valid config', () => {
      render(<GameSetupScreen config={makeConfig()} updateConfig={vi.fn()} />)

      expect(screen.getByRole('button', { name: 'Start game' })).toBeEnabled()
    })
  })

  describe('total players and team count', () => {
    it('increasing total players updates the status line and re-splits the roster', () => {
      render(<GameSetupScreen config={makeConfig()} updateConfig={vi.fn()} />)

      fireEvent.click(screen.getByRole('button', { name: 'Increase total players' }))

      expect(screen.getByText('5 out of 5 players assigned')).toBeInTheDocument()
      expect(stepperFor('team 1 players')).toHaveTextContent('3')
      expect(stepperFor('team 2 players')).toHaveTextContent('2')
    })

    it('increasing the number of teams adds a team and can surface a roster error', () => {
      render(<GameSetupScreen config={makeConfig()} updateConfig={vi.fn()} />)

      fireEvent.click(screen.getByRole('button', { name: 'Increase number of teams' }))

      expect(screen.getByPlaceholderText("Team 3's name")).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent('Each team needs at least 2 players.')
      expect(screen.getByRole('button', { name: 'Start game' })).toBeDisabled()
    })
  })

  describe('stepper bounds', () => {
    it('disables "Decrease total players" at the minimum', () => {
      render(<GameSetupScreen config={makeConfig()} updateConfig={vi.fn()} />)

      expect(screen.getByRole('button', { name: 'Decrease total players' })).toBeDisabled()
    })

    it('steps the timer up and down by 15 seconds', () => {
      render(<GameSetupScreen config={makeConfig()} updateConfig={vi.fn()} />)

      fireEvent.click(screen.getByRole('button', { name: 'Increase timer' }))
      expect(stepperFor('timer')).toHaveTextContent('75s')

      fireEvent.click(screen.getByRole('button', { name: 'Decrease timer' }))
      fireEvent.click(screen.getByRole('button', { name: 'Decrease timer' }))
      expect(stepperFor('timer')).toHaveTextContent('45s')
    })
  })

  describe('team name validation', () => {
    it('shows an error for duplicate team names', () => {
      render(<GameSetupScreen config={makeConfig()} updateConfig={vi.fn()} />)

      fireEvent.change(screen.getByPlaceholderText("Team 2's name"), { target: { value: 'Team 1' } })

      expect(screen.getByRole('status')).toHaveTextContent('Team names must be unique.')
      expect(screen.getByRole('button', { name: 'Start game' })).toBeDisabled()
    })

    it('shows an error for a blank team name', () => {
      render(<GameSetupScreen config={makeConfig()} updateConfig={vi.fn()} />)

      fireEvent.change(screen.getByPlaceholderText("Team 1's name"), { target: { value: '' } })

      expect(screen.getByRole('status')).toHaveTextContent('Give every team a name.')
      expect(screen.getByRole('button', { name: 'Start game' })).toBeDisabled()
    })
  })

  describe('submitting', () => {
    it('submits the edited config', () => {
      const updateConfig = vi.fn()
      render(<GameSetupScreen config={makeConfig()} updateConfig={updateConfig} />)

      fireEvent.change(screen.getByPlaceholderText("Team 1's name"), { target: { value: 'Alpha' } })
      fireEvent.click(screen.getByLabelText('Random order?'))
      fireEvent.submit(screen.getByRole('form', { name: 'Game setup' }))

      expect(updateConfig).toHaveBeenCalledTimes(1)
      expect(updateConfig).toHaveBeenCalledWith({
        totalPlayers: 4,
        teams: [
          { id: 'team-1', name: 'Alpha', players: 2 },
          { id: 'team-2', name: 'Team 2', players: 2 },
        ],
        timerSeconds: 60,
        wordsPerPlayer: 5,
        shuffleTeamOrder: false,
      })
    })
  })
})
