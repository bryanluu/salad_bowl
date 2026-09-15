// src/components/RoundIntroCurtain.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RoundIntroCurtain from './RoundIntroCurtain'
import { copy } from '../copy/en'

const { roundCurtain, round: roundCopy } = copy.gameplay

describe('RoundIntroCurtain', () => {
  it('shows the round name, instructions, and ready prompt for round 1', () => {
    render(
      <RoundIntroCurtain round={1} nextTeamName="Red Team" onBegin={vi.fn()} />
    )

    expect(screen.getByText(roundCurtain.roundLabel(1))).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: roundCopy[1].label })).toBeInTheDocument()
    expect(screen.getByText(roundCopy[1].instructions)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(roundCurtain.readyPrompt('Red Team'))
    expect(screen.getByRole('button', { name: roundCurtain.beginButton })).toBeInTheDocument()
  })

  it('swaps in round 3 (Password) content when given round 3', () => {
    render(
      <RoundIntroCurtain round={3} nextTeamName="Blue Team" onBegin={vi.fn()} />
    )

    expect(screen.getByText(roundCurtain.roundLabel(3))).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: roundCopy[3].label })).toBeInTheDocument()
    expect(screen.getByText(roundCopy[3].instructions)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(roundCurtain.readyPrompt('Blue Team'))
  })

  it('calls onBegin when the button is clicked', () => {
    const onBegin = vi.fn()

    render(
      <RoundIntroCurtain round={1} nextTeamName="Red Team" onBegin={onBegin} />
    )

    fireEvent.click(screen.getByRole('button', { name: roundCurtain.beginButton }))
    expect(onBegin).toHaveBeenCalledTimes(1)
  })

  it('autofocuses the button so pressing Enter starts the round immediately', () => {
    render(
      <RoundIntroCurtain round={1} nextTeamName="Red Team" onBegin={vi.fn()} />
    )

    expect(screen.getByRole('button', { name: roundCurtain.beginButton })).toHaveFocus()
  })
})
