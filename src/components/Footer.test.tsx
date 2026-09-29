// src/components/Footer.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import Footer from './Footer'
import { copy } from '../copy/en.ts'
import { renderWithSound } from '../test/renderWithSound'

// The logo is decorative (aria-hidden, empty alt), so it's invisible to
// ordinary role queries by design — find its images by their `presentation`
// role instead of by class name, so the tests don't care how it's styled.
function logoImages(): HTMLElement[] {
  return screen.queryAllByRole('presentation', { hidden: true })
}

function comesBefore(first: Node, second: Node): boolean {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING)
}

describe('Footer', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows only the SFX toggle before a game starts (no logo, no Quit)', () => {
    renderWithSound(<Footer showLogo={false} onQuit={() => { }} />)

    expect(screen.getByRole('button', { name: copy.footer.soundLabel(true) })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: copy.footer.quitLabel })).not.toBeInTheDocument()
    expect(logoImages()).toHaveLength(0)
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

    const sfx = screen.getByRole('button', { name: copy.footer.soundLabel(true) })
    const quit = screen.getByRole('button', { name: copy.footer.quitLabel })

    expect(logoImages().length).toBeGreaterThan(0)
    for (const image of logoImages()) {
      expect(comesBefore(image, sfx)).toBe(true)
    }
    expect(comesBefore(sfx, quit)).toBe(true)
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

    for (const image of logoImages()) {
      fireEvent.click(image)
    }

    expect(onQuit).not.toHaveBeenCalled()
    // and the logo isn't exposed as an image or a control
    expect(screen.queryAllByRole('img')).toHaveLength(0)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })
})
