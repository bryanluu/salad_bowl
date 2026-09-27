// src/hooks/useSoundEffects.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SoundProvider, useSoundEffects } from './useSoundEffects'
import { sounds, type SoundName } from '../sounds.ts'

// A stand-in for HTMLAudioElement that records what happens to each
// instance. `rejectPlay` simulates a missing file: play() rejects the way
// a real element does when its src 404s ("no supported sources").
class MockAudio {
  static instances: MockAudio[] = []
  static rejectPlay = false

  url: string
  currentTime = 0
  playCalls = 0
  pauseCalls = 0
  private endedListeners: (() => void)[] = []

  constructor(url: string) {
    this.url = url
    MockAudio.instances.push(this)
  }

  play(): Promise<void> {
    this.playCalls += 1
    if (MockAudio.rejectPlay) return Promise.reject(new Error('no supported sources'))
    return Promise.resolve()
  }

  pause(): void {
    this.pauseCalls += 1
  }

  addEventListener(type: string, listener: () => void): void {
    if (type === 'ended') this.endedListeners.push(listener)
  }

  // Test-only: fire the 'ended' handlers the way the browser does.
  fireEnded(): void {
    this.endedListeners.forEach((listener) => listener())
  }
}

// The tests drive the hook through real buttons (read/write during the
// render pass is off-limits to eslint), pointing "play" at the sound under
// test via this module-level selector, which is only touched by tests.
let soundToPlay: SoundName = 'tap'

function ControlPanel() {
  const { play, setSoundOn, soundOn } = useSoundEffects()
  return (
    <>
      <span data-testid="sound-on">{String(soundOn)}</span>
      <button data-testid="play" type="button" onClick={() => play(soundToPlay)}>{soundToPlay}</button>
      <button data-testid="toggle" type="button" onClick={() => setSoundOn(!soundOn)}>toggle</button>
    </>
  )
}

function renderControlPanel() {
  soundToPlay = 'tap'
  return render(
    <SoundProvider>
      <ControlPanel />
    </SoundProvider>,
  )
}

function byName(name: string): MockAudio | undefined {
  return MockAudio.instances.find((instance) => instance.url === sounds[name as keyof typeof sounds])
}

describe('useSoundEffects', () => {
  beforeEach(() => {
    vi.stubGlobal('Audio', MockAudio)
    MockAudio.instances = []
    MockAudio.rejectPlay = false
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  function unlock() {
    fireEvent.pointerDown(window)
  }

  function play(name: SoundName) {
    soundToPlay = name
    fireEvent.click(screen.getByTestId('play'))
  }

  it('plays nothing before a user gesture, and plays after one', () => {
    renderControlPanel()

    play('tap') // no gesture yet
    expect(MockAudio.instances).toHaveLength(0)

    unlock()

    play('tap')
    expect(byName('tap')?.playCalls).toBe(1)
  })

  it('also unlocks on a keyboard gesture', () => {
    renderControlPanel()

    play('tap')
    expect(MockAudio.instances).toHaveLength(0)

    fireEvent.keyDown(window, { key: 'Enter' })

    play('tap')
    expect(byName('tap')?.playCalls).toBe(1)
  })

  it('is muted from the start when a previous session left it off', () => {
    localStorage.setItem('salad-bowl:sound-on', 'off')
    renderControlPanel()
    unlock()

    expect(screen.getByTestId('sound-on')).toHaveTextContent('false')

    play('win')
    expect(MockAudio.instances).toHaveLength(0)
  })

  it('persists the mute choice across providers (reload)', () => {
    const { unmount } = renderControlPanel()
    unlock()

    fireEvent.click(screen.getByTestId('toggle'))
    expect(localStorage.getItem('salad-bowl:sound-on')).toBe('off')
    unmount()

    renderControlPanel()
    expect(screen.getByTestId('sound-on')).toHaveTextContent('false')
  })

  it('confirms turning sound on with a blip, and stays silent turning it off', () => {
    renderControlPanel()
    unlock()

    play('win')
    const win = byName('win')
    expect(win?.playCalls).toBe(1)

    fireEvent.click(screen.getByTestId('toggle')) // off
    expect(win?.pauseCalls).toBe(1) // the active sound stops
    expect(MockAudio.instances).toHaveLength(1) // "off" plays nothing

    fireEvent.click(screen.getByTestId('toggle')) // on
    expect(byName('tap')?.playCalls).toBe(1) // "on" confirms
  })

  it('lets a higher-priority sound interrupt a lower one', () => {
    renderControlPanel()
    unlock()

    play('tick')
    play('buzzer')
    expect(byName('tick')?.pauseCalls).toBe(1)
    expect(byName('buzzer')?.playCalls).toBe(1)

    // And a lower-priority sound must not cut the buzzer off.
    play('tap')
    expect(byName('tap')).toBeUndefined()
  })

  it('a win does not cut in after the buzzer (won word vs. expiry race)', () => {
    renderControlPanel()
    unlock()

    play('buzzer')
    play('win')
    expect(byName('buzzer')?.playCalls).toBe(1)
    expect(byName('win')).toBeUndefined()
  })

  it('ignores a re-request of the sound that is already playing', () => {
    renderControlPanel()
    unlock()

    play('win')
    play('win')
    expect(byName('win')?.playCalls).toBe(1)
  })

  it('a finished sound releases its priority slot', () => {
    renderControlPanel()
    unlock()

    play('buzzer')
    const buzzer = byName('buzzer')
    expect(buzzer).toBeDefined()

    act(() => { buzzer?.fireEnded() })

    // A lower-priority sound that comes after can now play.
    play('round')
    expect(byName('round')?.playCalls).toBe(1)
  })

  it('degrades to silence when the file is missing, warning once per sound', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => { })
    MockAudio.rejectPlay = true
    renderControlPanel()
    unlock()

    // Two attempts, one warning — and play() rejections settle in a
    // microtask, so flush them between attempts.
    await act(async () => { play('tick') })
    await act(async () => { play('tick') })
    expect(warn).toHaveBeenCalledTimes(1)

    // The failed sound must not hold its priority slot either.
    MockAudio.rejectPlay = false
    play('tap')
    expect(byName('tap')?.playCalls).toBe(1)
  })
})
