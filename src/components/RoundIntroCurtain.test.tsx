// src/components/RoundIntroCurtain.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RoundIntroCurtain from './RoundIntroCurtain'

describe('RoundIntroCurtain', () => {
  it('shows the round name, instructions, and ready prompt for round 1', () => {
    render(
      <RoundIntroCurtain round={1} nextTeamName="Red Team" onBegin={vi.fn()} />
    )

    expect(screen.getByText('Round 1')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Taboo' })).toBeInTheDocument()
    expect(
      screen.getByText('Describe the prompt without saying it.')
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Ready, Red Team?')
    expect(screen.getByRole('button', { name: 'Begin' })).toBeInTheDocument()
  })

  it('swaps in round 3 (Password) content when given round 3', () => {
    render(
      <RoundIntroCurtain round={3} nextTeamName="Blue Team" onBegin={vi.fn()} />
    )

    expect(screen.getByText('Round 3')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Password' })).toBeInTheDocument()
    expect(
      screen.getByText('Say a single-word clue that is not the prompt.')
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Ready, Blue Team?')
  })

  it('calls onBegin when the button is clicked', () => {
    const onBegin = vi.fn()

    render(
      <RoundIntroCurtain round={1} nextTeamName="Red Team" onBegin={onBegin} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Begin' }))
    expect(onBegin).toHaveBeenCalledTimes(1)
  })

  it('autofocuses the button so pressing Enter starts the round immediately', () => {
    render(
      <RoundIntroCurtain round={1} nextTeamName="Red Team" onBegin={vi.fn()} />
    )

    expect(screen.getByRole('button', { name: 'Begin' })).toHaveFocus()
  })
})
