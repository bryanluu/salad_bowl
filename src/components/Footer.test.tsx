// src/components/Footer.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import Footer from './Footer'
import { copy } from '../copy/en.ts'
import { renderWithSound } from '../test/renderWithSound'

describe('Footer', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows only the SFX toggle before a game starts (no logo, no Quit)', () => {
    renderWithSound(<Footer showLogo={false} onQuit={() => { }} />)

    expect(screen.getByRole('button', { name: copy.footer.soundLabel(true) })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: copy.footer.quitLabel })).not.toBeInTheDocument()
    expect(document.querySelector('.footer__logo')).toBeNull()
  })

  it('toggles between "SFX: On" and "SFX: Off" when the label is clicked', () => {
    renderWithSound(<Footer showLogo={false} onQuit={() => { }} />)

    fireEvent.click(screen.getByRole('button', { name: 'SFX: On' }))
    expect(screen.getByRole('button', { name: 'SFX: Off' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'SFX: Off' }))
    expect(screen.getByRole('button', { name: 'SFX: On' })).toBeInTheDocument()
  })

  it('starts as "SFX: Off" when a previous session left sound muted', () => {
    localStorage.setItem('salad-bowl:sound-on', 'off')
    renderWithSound(<Footer showLogo={false} onQuit={() => { }} />)

    expect(screen.getByRole('button', { name: 'SFX: Off' })).toBeInTheDocument()
  })

  it('shows the logo, SFX toggle and Quit link (in that order) once a game is underway', () => {
    renderWithSound(<Footer showLogo={true} onQuit={() => { }} />)

    const group = document.querySelector('.footer__group') as HTMLElement
    const order = Array.from(group.children).map((el) => el.className)
    expect(order).toEqual([
      'footer__logo',
      'footer__link footer__sound',
      'footer__link footer__quit',
    ])
  })

  it('calls onQuit when the Quit link is clicked', () => {
    const onQuit = vi.fn()
    renderWithSound(<Footer showLogo={true} onQuit={onQuit} />)

    fireEvent.click(screen.getByRole('button', { name: copy.footer.quitLabel }))
    expect(onQuit).toHaveBeenCalledTimes(1)
  })

  it('does nothing when the logo is clicked — Quit is the only way out', () => {
    const onQuit = vi.fn()
    renderWithSound(<Footer showLogo={true} onQuit={onQuit} />)

    const logo = document.querySelector('.footer__logo') as HTMLElement
    fireEvent.click(logo)
    fireEvent.click(logo.querySelector('.logo--smile') as HTMLElement)

    expect(onQuit).not.toHaveBeenCalled()
    // and the logo isn't exposed as a control
    expect(logo).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })
})
