// src/hooks/useSoundEffects.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSoundEffects } from './useSoundEffects'

const STORAGE_KEY = 'salad-bowl:sound-enabled'

describe('useSoundEffects', () => {
  let playSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    window.localStorage.clear()
    // jsdom doesn't implement HTMLMediaElement.play(); stub it so play()
    // resolves instead of throwing "not implemented".
    playSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'play')
      .mockImplementation(() => Promise.resolve())
  })

  afterEach(() => {
    playSpy.mockRestore()
  })

  it('defaults to enabled when nothing is stored', () => {
    const { result } = renderHook(() => useSoundEffects())
    expect(result.current.enabled).toBe(true)
  })

  it('reads a previously stored preference', () => {
    window.localStorage.setItem(STORAGE_KEY, 'false')
    const { result } = renderHook(() => useSoundEffects())
    expect(result.current.enabled).toBe(false)
  })

  it('plays a sound when enabled', () => {
    const { result } = renderHook(() => useSoundEffects())
    act(() => result.current.play('win'))
    expect(playSpy).toHaveBeenCalledTimes(1)
  })

  it('does not play when disabled', () => {
    const { result } = renderHook(() => useSoundEffects())
    act(() => result.current.toggle()) // on -> off, no confirmation blip
    act(() => result.current.play('skip'))
    expect(playSpy).not.toHaveBeenCalled()
  })

  it('persists the preference to localStorage', () => {
    const { result } = renderHook(() => useSoundEffects())
    act(() => result.current.toggle())
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('false')
  })

  it('plays a confirmation blip only when turning sound back on', () => {
    const { result } = renderHook(() => useSoundEffects())
    act(() => result.current.toggle()) // on -> off: no blip
    expect(playSpy).not.toHaveBeenCalled()
    act(() => result.current.toggle()) // off -> on: blip
    expect(playSpy).toHaveBeenCalledTimes(1)
  })

  describe('when a sound fails to play', () => {
    // Every sounds.ts entry is currently a TODO with no file behind it
    // (see public/sounds/README.md), so this is the expected day-to-day
    // path in dev right now — it should be loud, not silent.
    let warnSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      playSpy.mockImplementation(() => Promise.reject(new Error('404')))
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })
    })

    afterEach(() => {
      warnSpy.mockRestore()
    })

    it('logs a console warning naming the sound', async () => {
      const { result } = renderHook(() => useSoundEffects())
      act(() => result.current.play('buzzer'))

      await waitFor(() => expect(warnSpy).toHaveBeenCalledTimes(1))
      expect(warnSpy.mock.calls[0][0]).toContain('buzzer')
    })

    it('warns every time it fails, not just the first (deliberately not deduped)', async () => {
      const { result } = renderHook(() => useSoundEffects())
      act(() => result.current.play('celebrate'))
      act(() => result.current.play('celebrate'))
      act(() => result.current.play('celebrate'))

      await waitFor(() => expect(warnSpy).toHaveBeenCalledTimes(3))
    })
  })
})
