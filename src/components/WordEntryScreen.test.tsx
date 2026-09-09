// src/components/WordEntryScreen.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import WordEntryScreen from './WordEntryScreen'
import { LocalWordSource } from '../wordSources/LocalWordSource'
import type { GameConfig } from '../types'

function makeConfig(): GameConfig {
  return {
    totalPlayers: 2,
    teams: [
      { id: 'team-1', name: 'Team 1', players: 1 },
      { id: 'team-2', name: 'Team 2', players: 1 },
    ],
    timerSeconds: 60,
    wordsPerPlayer: 2,
    shuffleTeamOrder: false,
  }
}

function getInput() {
  return screen.getByPlaceholderText('Enter something for your team to guess')
}

describe('WordEntryScreen', () => {
  it('renders the initial, empty state', () => {
    render(<WordEntryScreen config={makeConfig()} source={new LocalWordSource(4)} />)

    expect(screen.getByRole('heading', { name: 'Toss in your prompts!' })).toBeInTheDocument()
    expect(getInput()).toBeInTheDocument()
    expect(screen.getByText('0 / 4 prompts')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add prompt' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Please add more prompts.')
  })

  it('adds a word, clears the input, and updates the counter', () => {
    render(<WordEntryScreen config={makeConfig()} source={new LocalWordSource(4)} />)

    fireEvent.change(getInput(), { target: { value: 'banana' } })
    expect(screen.getByRole('button', { name: 'Add prompt' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Add prompt' }))

    expect(screen.getByText('banana')).toBeInTheDocument()
    expect(screen.getByText('1 / 4 prompts')).toBeInTheDocument()
    expect(getInput()).toHaveValue('')
  })

  it('rejects a case-insensitive duplicate', () => {
    render(<WordEntryScreen config={makeConfig()} source={new LocalWordSource(4)} />)

    fireEvent.change(getInput(), { target: { value: 'banana' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add prompt' }))

    fireEvent.change(getInput(), { target: { value: 'BANANA' } })

    expect(screen.getByText('Already in the bowl.')).toBeInTheDocument()
    expect(getInput()).toBeInvalid()
    expect(screen.getByRole('button', { name: 'Add prompt' })).toBeDisabled()
  })

  it('leaves a word the source rejects in the input instead of adding it', () => {
    render(<WordEntryScreen config={makeConfig()} source={new LocalWordSource(4)} />)

    // "hi" passes the screen's own validation (not empty, not a duplicate)
    // but LocalWordSource rejects anything shorter than minWordLength.
    fireEvent.change(getInput(), { target: { value: 'hi' } })
    expect(screen.getByRole('button', { name: 'Add prompt' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Add prompt' }))

    expect(getInput()).toHaveValue('hi')
    expect(screen.queryByText('hi')).not.toBeInTheDocument()
  })

  it('removes a word from the list', () => {
    render(<WordEntryScreen config={makeConfig()} source={new LocalWordSource(4)} />)

    fireEvent.change(getInput(), { target: { value: 'banana' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add prompt' }))
    fireEvent.change(getInput(), { target: { value: 'apple' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add prompt' }))

    const bananaItem = screen.getByText('banana').closest('li')
    expect(bananaItem).not.toBeNull()
    fireEvent.click(within(bananaItem as HTMLElement).getByRole('button', { name: 'Remove prompt' }))

    expect(screen.queryByText('banana')).not.toBeInTheDocument()
    expect(screen.getByText('apple')).toBeInTheDocument()
    expect(screen.getByText('1 / 4 prompts')).toBeInTheDocument()
  })

  it('fills the bowl and enables Done with no error shown', () => {
    render(<WordEntryScreen config={makeConfig()} source={new LocalWordSource(4)} />)

    for (const word of ['banana', 'apple', 'cherry', 'durian']) {
      fireEvent.change(getInput(), { target: { value: word } })
      fireEvent.click(screen.getByRole('button', { name: 'Add prompt' }))
    }

    expect(screen.getByText('4 / 4 prompts')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add prompt' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Done' })).toBeEnabled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows words already in the source on first render', () => {
    const source = new LocalWordSource(4)
    source.addWord('banana')
    source.addWord('apple')

    render(<WordEntryScreen config={makeConfig()} source={source} />)

    expect(screen.getByText('banana')).toBeInTheDocument()
    expect(screen.getByText('apple')).toBeInTheDocument()
    expect(screen.getByText('2 / 4 prompts')).toBeInTheDocument()
  })
})
