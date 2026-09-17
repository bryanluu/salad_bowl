// src/hooks/useWakeLock.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWakeLock } from './useWakeLock'

// Minimal stand-in for WakeLockSentinel: records explicit release() calls
// (what the hook calls) and lets tests fire the 'release' event the way
// the OS would when it revokes the lock.
class FakeSentinel {
  released = false
  releaseListeners: Array<() => void> = []

  addEventListener(type: string, listener: () => void) {
    if (type === 'release') this.releaseListeners.push(listener)
  }

  // The hook's explicit "we're done with the lock" call.
  release() {
    if (this.released) return
    this.released = true
    this.releaseListeners.forEach((listener) => listener())
    this.releaseListeners = []
  }

  // The OS revoking the lock (page backgrounded, etc.) — event only.
  osRelease() {
    this.releaseListeners.forEach((listener) => listener())
    this.releaseListeners = []
  }
}

// Installs a fake navigator.wakeLock and records every request. Pass
// `request` to customise resolution (rejection, pending promise).
function installWakeLock(request?: (type: string) => Promise<FakeSentinel>) {
  const requests: string[] = []
  const sentinels: FakeSentinel[] = []
  Object.defineProperty(navigator, 'wakeLock', {
    value: {
      request(type: string) {
        requests.push(type)
        if (request) return request(type)
        const sentinel = new FakeSentinel()
        sentinels.push(sentinel)
        return Promise.resolve(sentinel)
      },
    },
    configurable: true,
  })
  return { requests, sentinels }
}

type HookHandle = { unmount: () => void }

// Renders the hook and flushes the async request() promise before
// returning, so assertions see the adopted sentinel.
async function renderActive(active: boolean): Promise<HookHandle> {
  let hook: HookHandle | undefined
  await act(async () => {
    hook = renderHook(() => useWakeLock(active))
  })
  return hook as HookHandle
}

describe('useWakeLock', () => {
  afterEach(() => {
    // jsdom has no navigator.wakeLock by default; restore that.
    delete (navigator as unknown as { wakeLock?: unknown }).wakeLock
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  })

  it('requests a screen wake lock when active and the API is present', async () => {
    const { requests, sentinels } = installWakeLock()

    await renderActive(true)

    expect(requests).toEqual(['screen'])
    expect(sentinels[0].released).toBe(false)
  })

  it('does not request when inactive', async () => {
    const { requests } = installWakeLock()

    await renderActive(false)

    expect(requests).toEqual([])
  })

  it('is a silent no-op where the API is missing', () => {
    // jsdom does not implement navigator.wakeLock — the default state here.
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow()
  })

  it('releases the lock when the hook unmounts', async () => {
    const { sentinels } = installWakeLock()

    const hook = await renderActive(true)
    expect(sentinels[0].released).toBe(false)

    act(() => { hook.unmount() })

    expect(sentinels[0].released).toBe(true)
  })

  it('releases the lock when active flips from true to false', async () => {
    const { sentinels } = installWakeLock()

    let rerender: ((props: { active: boolean }) => void) | undefined
    await act(async () => {
      const hook = renderHook(({ active }: { active: boolean }) => useWakeLock(active),
        { initialProps: { active: true } })
      rerender = hook.rerender
    })
    expect(sentinels[0].released).toBe(false)

    act(() => { rerender?.({ active: false }) })

    expect(sentinels[0].released).toBe(true)
  })

  it('re-requests when the OS releases the lock while the page is visible', async () => {
    const { requests, sentinels } = installWakeLock()

    await renderActive(true)
    expect(requests).toHaveLength(1)

    await act(async () => { sentinels[0].osRelease() })

    expect(requests).toHaveLength(2)
    expect(sentinels[1].released).toBe(false)
  })

  it('re-requests when the page becomes visible, but not while hidden', async () => {
    const { requests, sentinels } = installWakeLock()

    await renderActive(true)

    // Page backgrounds: the OS revokes the lock, and a visibilitychange
    // while hidden must not re-request.
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    sentinels[0].osRelease()
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(requests).toHaveLength(1)

    // Coming back to the foreground re-acquires.
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(requests).toHaveLength(2)
  })

  it('does not throw when request() rejects (e.g. document not visible)', async () => {
    installWakeLock(() => Promise.reject(new Error('SecurityError')))

    let threw: unknown
    await act(async () => {
      try {
        renderHook(() => useWakeLock(true))
      } catch (err) {
        threw = err
      }
    })

    expect(threw).toBeUndefined()
  })

  it('releases a sentinel whose request resolves after unmount', async () => {
    let resolveRequest: (sentinel: FakeSentinel) => void = () => { }
    installWakeLock(() => new Promise<FakeSentinel>((resolve) => {
      resolveRequest = resolve
    }))

    const hook = await renderActive(true)
    act(() => { hook.unmount() })

    const orphan = new FakeSentinel()
    await act(async () => { resolveRequest(orphan) })

    expect(orphan.released).toBe(true)
  })
})
