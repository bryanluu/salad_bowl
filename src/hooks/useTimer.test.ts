// src/hooks/useTimer.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimer } from './useTimer'

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not count down until started', () => {
    const { result } = renderHook(() => useTimer(5, vi.fn()))

    act(() => { vi.advanceTimersByTime(10000) })
    expect(result.current.timeLeft).toBe(5)
  })

  it('counts down one second at a time and clamps at zero', () => {
    const { result } = renderHook(() => useTimer(3, vi.fn()))

    act(() => result.current.startTimer())

    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.timeLeft).toBe(2)

    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.timeLeft).toBe(1)

    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.timeLeft).toBe(0)

    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.timeLeft).toBe(0) // stays at zero, never goes negative
  })

  it('fires onExpiry exactly once when the clock hits zero', () => {
    const onExpiry = vi.fn()
    const { result } = renderHook(() => useTimer(3, onExpiry))

    act(() => result.current.startTimer())

    act(() => { vi.advanceTimersByTime(2000) })
    expect(onExpiry).not.toHaveBeenCalled()

    act(() => { vi.advanceTimersByTime(1000) })
    expect(onExpiry).toHaveBeenCalledTimes(1)

    act(() => { vi.advanceTimersByTime(5000) })
    expect(onExpiry).toHaveBeenCalledTimes(1)
  })

  it('pauses on stopTimer and resumes from the same value', () => {
    const { result } = renderHook(() => useTimer(5, vi.fn()))

    act(() => result.current.startTimer())
    act(() => { vi.advanceTimersByTime(2000) })
    expect(result.current.timeLeft).toBe(3)

    act(() => result.current.stopTimer())
    act(() => { vi.advanceTimersByTime(30000) })
    expect(result.current.timeLeft).toBe(3) // frozen while stopped

    act(() => result.current.startTimer())
    act(() => { vi.advanceTimersByTime(2000) })
    expect(result.current.timeLeft).toBe(1)
  })

  it('resetTimer restarts from full without over-decrementing', () => {
    const onExpiry = vi.fn()
    const { result } = renderHook(() => useTimer(3, onExpiry))

    act(() => result.current.startTimer())
    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.timeLeft).toBe(2)

    act(() => result.current.resetTimer())
    expect(result.current.timeLeft).toBe(3)

    // Well past the original 3s horizon — a stale closure would have expired early.
    act(() => { vi.advanceTimersByTime(4000) })
    expect(result.current.timeLeft).toBe(0)
    expect(onExpiry).toHaveBeenCalledTimes(1)
  })

  it('re-arms the countdown when onExpiry restarts the timer in the same batch', () => {
    // Mirrors GameplayScreen.handleTimerExpiry: the expiry handler calls
    // resetTimer + startTimer synchronously, so all updates land in one
    // React batch (the production call stack the old boolean `running`
    // state collapsed through, leaving a cleared interval and no re-arm).
    const { result } = renderHook(() => useTimer(2, function restart() {
      result.current.resetTimer()
      result.current.startTimer()
    }))

    act(() => result.current.startTimer())
    act(() => { vi.advanceTimersByTime(2000) }) // expires; restart lands in the same batch
    expect(result.current.timeLeft).toBe(2)

    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.timeLeft).toBe(1) // with the stale-interval bug it stays 2
  })

  it('never fires expiry when timeInSeconds is zero', () => {
    const onExpiry = vi.fn()
    const { result } = renderHook(() => useTimer(0, onExpiry))

    act(() => result.current.startTimer())
    act(() => { vi.advanceTimersByTime(10000) })

    expect(result.current.timeLeft).toBe(0)
    expect(onExpiry).not.toHaveBeenCalled()
  })
})
