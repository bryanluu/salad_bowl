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
  muted = false
  playCalls = 0
  pauseCalls = 0

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

  // Fires the gesture and lets the muted priming pass (play → pause →
  // unmute, for every sound — see "primes every sound on the first
  // gesture" below) settle, then zeroes every instance's counters. The
  // rest of this suite is about steady-state play() behavior *after*
  // unlock, so priming — covered by its own test — is made invisible here
  // rather than asserted against in every other test.
  async function unlock() {
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

  function play(name: SoundName) {
    soundToPlay = name
    fireEvent.click(screen.getByTestId('play'))
  }

  it('plays nothing before a user gesture, and plays after one', async () => {
    renderControlPanel()

    play('tap') // no gesture yet
    expect(MockAudio.instances).toHaveLength(0)

    await unlock()

    play('tap')
    expect(byName('tap')?.playCalls).toBe(1)
  })

  it('also unlocks on a keyboard gesture', async () => {
    renderControlPanel()

    play('tap')
    expect(MockAudio.instances).toHaveLength(0)

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Enter' })
      await Promise.resolve()
      await Promise.resolve()
    })
    MockAudio.instances.forEach((instance) => { instance.playCalls = 0 })

    play('tap')
    expect(byName('tap')?.playCalls).toBe(1)
  })

  it('primes every sound on the first gesture, muted, then unmutes it', async () => {
    renderControlPanel()

    await act(async () => {
      fireEvent.pointerDown(window)
      await Promise.resolve()
      await Promise.resolve()
    })

    // Every sound got an element, played once (the prime) and paused, and
    // ended up unmuted — so the buzzer (first *real* play is from a timer
    // callback, never a click) is just as ready as a sound whose first
    // real play is a direct button tap.
    for (const name of Object.keys(sounds) as SoundName[]) {
      const instance = byName(name)
      expect(instance?.playCalls, `${name} playCalls`).toBe(1)
      expect(instance?.pauseCalls, `${name} pauseCalls`).toBe(1)
      expect(instance?.muted, `${name} muted`).toBe(false)
    }
  })

  it('is muted from the start when a previous session left it off', async () => {
    localStorage.setItem('salad-bowl:sound-on', 'off')
    renderControlPanel()
    await unlock()

    expect(screen.getByTestId('sound-on')).toHaveTextContent('false')

    play('win')
    // Priming already created and played win's element once (see the
    // dedicated priming test) — muted, before this. A real play() while
    // off doesn't add another.
    expect(byName('win')?.playCalls).toBe(0)
  })

  it('persists the mute choice across providers (reload)', async () => {
    const { unmount } = renderControlPanel()
    await unlock()

    fireEvent.click(screen.getByTestId('toggle'))
    expect(localStorage.getItem('salad-bowl:sound-on')).toBe('off')
    unmount()

    renderControlPanel()
    expect(screen.getByTestId('sound-on')).toHaveTextContent('false')
  })

  it('confirms turning sound on with a blip, and stays silent turning it off', async () => {
    renderControlPanel()
    await unlock()

    play('win')
    const win = byName('win')
    expect(win?.playCalls).toBe(1)

    fireEvent.click(screen.getByTestId('toggle')) // off
    expect(win?.pauseCalls).toBe(1) // whatever's playing stops

    fireEvent.click(screen.getByTestId('toggle')) // on
    expect(byName('tap')?.playCalls).toBe(1) // "on" confirms
  })

  // SB-50: no priority/interruption system — sounds are independent, so two
  // different sounds really can sound at once (e.g. a word won on the exact
  // second the buzzer fires). This is the deliberately-chosen behavior, not
  // an oversight — see the design note atop useSoundEffects.tsx.
  it('lets two different sounds play at the same time, unlike a priority system', async () => {
    renderControlPanel()
    await unlock()

    play('buzzer')
    play('win')

    expect(byName('buzzer')?.playCalls).toBe(1)
    expect(byName('win')?.playCalls).toBe(1)
    // Neither one paused the other.
    expect(byName('buzzer')?.pauseCalls).toBe(0)
    expect(byName('win')?.pauseCalls).toBe(0)
  })

  // The one case this design doesn't leave alone: retriggering the *same*
  // sound restarts it (one element per name, not cloned/pooled per-call).
  it('restarts a sound if it is requested again while still "playing"', async () => {
    renderControlPanel()
    await unlock()

    play('tap')
    play('tap')
    expect(byName('tap')?.playCalls).toBe(2)
  })

  it('warns every time a sound fails to play, not just the first', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => { })
    renderControlPanel()
    await unlock() // priming succeeds here — MockAudio.rejectPlay flips after

    MockAudio.rejectPlay = true
    // play() rejections settle in a microtask, so flush between attempts.
    await act(async () => { play('tick') })
    await act(async () => { play('tick') })
    expect(warn).toHaveBeenCalledTimes(2)

    // A missing sound doesn't block anything else from playing.
    MockAudio.rejectPlay = false
    play('tap')
    expect(byName('tap')?.playCalls).toBe(1)
  })
})
