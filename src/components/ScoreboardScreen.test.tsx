// src/components/ScoreboardScreen.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, act, render } from '@testing-library/react'
import ScoreboardScreen from './ScoreboardScreen'
import { copy } from '../copy/en'
import type { Scores } from '../types'
import { renderWithSound } from '../test/renderWithSound'
import { SoundProvider } from '../hooks/useSoundEffects'
import { sounds } from '../sounds'

// A stand-in for HTMLAudioElement that records plays/pauses per instance.
class MockAudio {
  static instances: MockAudio[] = []

  url: string
  currentTime = 0
  muted = false
  playCalls = 0
  pauseCalls = 0

  constructor(url: string) {
    this.url = url
    MockAudio.instances.push(this)
  }

  play(): Promise<void> {
    this.playCalls += 1
    return Promise.resolve()
  }

  pause(): void {
    this.pauseCalls += 1
  }
}

function bySound(name: keyof typeof sounds): MockAudio | undefined {
  return MockAudio.instances.find((instance) => instance.url === sounds[name])
}

// Unlock the engine with a gesture and let its muted priming pass settle,
// then zero the counters so assertions only see what happens afterwards.
async function unlockAudio() {
  await act(async () => {
    fireEvent.pointerDown(window)
    await Promise.resolve()
    await Promise.resolve()
  })
  MockAudio.instances.forEach((instance) => {
    instance.playCalls = 0
    instance.pauseCalls = 0
  })
}

describe('ScoreboardScreen', () => {
  it('shows mid-game content and highlights the leading team after round 1', () => {
    const scores: Scores = [
      { id: 'red', name: 'Red Team', rounds: [3] },
      { id: 'blue', name: 'Blue Team', rounds: [5] },
    ]

    renderWithSound(<ScoreboardScreen
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

    renderWithSound(<ScoreboardScreen
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

    renderWithSound(<ScoreboardScreen
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


  it('always displays teams in descending score order, regardless of input order', () => {
    const scores: Scores = [
      { id: 'blue', name: 'Blue Team', rounds: [1] },
      { id: 'red', name: 'Red Team', rounds: [5] },
      { id: 'green', name: 'Green Team', rounds: [3] },
    ]

    renderWithSound(<ScoreboardScreen scores={scores} onNext={vi.fn()} />)

    const rows = screen.getAllByRole('row').slice(1) // drop the header row
    expect(rows[0]).toHaveTextContent('Red Team')
    expect(rows[1]).toHaveTextContent('Green Team')
    expect(rows[2]).toHaveTextContent('Blue Team')
  })

  it('keeps tied teams in their original relative order', () => {
    const scores: Scores = [
      { id: 'blue', name: 'Blue Team', rounds: [5] },
      { id: 'red', name: 'Red Team', rounds: [5] },
    ]

    renderWithSound(<ScoreboardScreen scores={scores} onNext={vi.fn()} />)

    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('Blue Team')
    expect(rows[1]).toHaveTextContent('Red Team')
  })

  it('calls onNext when the button is clicked', () => {
    const onNext = vi.fn()
    const scores: Scores = [
      { id: 'red', name: 'Red Team', rounds: [1] },
      { id: 'blue', name: 'Blue Team', rounds: [0] },
    ]

    renderWithSound(<ScoreboardScreen scores={scores} onNext={onNext} />)

    fireEvent.click(screen.getByRole('button', { name: copy.gameplay.scoreboard.button.continue }))
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('autofocuses the button', () => {
    const scores: Scores = [
      { id: 'red', name: 'Red Team', rounds: [1] },
      { id: 'blue', name: 'Blue Team', rounds: [0] },
    ]

    renderWithSound(<ScoreboardScreen scores={scores} onNext={vi.fn()} />)

    expect(screen.getByRole('button', { name: copy.gameplay.scoreboard.button.continue })).toHaveFocus()
  })

  describe('verdict sound lifetime', () => {
    beforeEach(() => {
      vi.stubGlobal('Audio', MockAudio)
      MockAudio.instances = []
      localStorage.clear()
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    // Mirrors the real app: the SoundProvider lives for the whole session
    // (and is unlocked by an earlier tap long before the final scoreboard
    // appears), while the scoreboard itself mounts and unmounts inside it.
    function Harness({ scores, show, onNext = vi.fn() }:
      { scores: Scores, show: boolean, onNext?: () => void }) {
      return (
        <SoundProvider>
          {show ? <ScoreboardScreen scores={scores} onNext={onNext} /> : null}
        </SoundProvider>
      )
    }

    async function showScoreboardInUnlockedApp(scores: Scores) {
      const view = render(<Harness scores={scores} show={false} />)
      await unlockAudio()
      view.rerender(<Harness scores={scores} show={true} />)
      return {
        hideScoreboard: () => view.rerender(<Harness scores={scores} show={false} />),
      }
    }

    const winnerScores: Scores = [
      { id: 'red', name: 'Red Team', rounds: [3, 2, 4] },
      { id: 'blue', name: 'Blue Team', rounds: [1, 2, 3] },
    ]
    const tiedScores: Scores = [
      { id: 'red', name: 'Red Team', rounds: [3, 2, 4] },
      { id: 'blue', name: 'Blue Team', rounds: [4, 2, 3] },
    ]

    it('stops the celebration when the final scoreboard goes away', async () => {
      const { hideScoreboard } = await showScoreboardInUnlockedApp(winnerScores)

      const celebration = bySound('celebration')
      expect(celebration?.playCalls).toBe(1)
      celebration!.currentTime = 3 // still playing

      hideScoreboard() // New game / Quit both unmount the scoreboard
      expect(celebration?.pauseCalls).toBe(1)
      expect(celebration?.currentTime).toBe(0)
      expect(bySound('tie')?.pauseCalls).toBe(0)
    })

    it('stops the tie sound when the final scoreboard goes away', async () => {
      const { hideScoreboard } = await showScoreboardInUnlockedApp(tiedScores)

      const tie = bySound('tie')
      expect(tie?.playCalls).toBe(1)

      hideScoreboard()
      expect(tie?.pauseCalls).toBe(1)
      expect(bySound('celebration')?.pauseCalls).toBe(0)
    })

    it('leaves the sound playing while the scoreboard is still showing', async () => {
      await showScoreboardInUnlockedApp(winnerScores)

      expect(bySound('celebration')?.playCalls).toBe(1)
      expect(bySound('celebration')?.pauseCalls).toBe(0)
    })

    it('has nothing to stop when a between-round scoreboard goes away', async () => {
      const midGame: Scores = [
        { id: 'red', name: 'Red Team', rounds: [3] },
        { id: 'blue', name: 'Blue Team', rounds: [5] },
      ]
      const { hideScoreboard } = await showScoreboardInUnlockedApp(midGame)

      hideScoreboard()
      for (const instance of MockAudio.instances) {
        expect(instance.playCalls).toBe(0)
        expect(instance.pauseCalls).toBe(0)
      }
    })
  })
})
