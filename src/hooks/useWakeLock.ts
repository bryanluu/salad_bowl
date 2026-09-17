import { useEffect } from 'react'

// Holds a Screen Wake Lock (navigator.wakeLock) while `active` is true so
// the OS can't dim or lock the display mid-turn — a locked screen breaks
// the physical pass-the-phone flow. No-ops silently where the API is
// missing (Safari < 16.4, jsdom in tests): the game simply plays without
// the lock.
export function useWakeLock(active: boolean) {
  useEffect(function holdWakeLock() {
    if (!active || !('wakeLock' in navigator)) return

    let sentinel: WakeLockSentinel | undefined
    let disposed = false
    // Monotonic request counter: request() is async, so an older in-flight
    // response can land after a newer one (e.g. a re-request racing the
    // visibilitychange handler). Only the newest response is adopted;
    // stale ones are released so an active lock is never leaked.
    let requestSeq = 0

    async function requestLock() {
      const seq = ++requestSeq
      try {
        const s = await navigator.wakeLock.request('screen')

        // The promise can outlive this effect (StrictMode double-mount, or
        // `active` flipping false while it was in flight) — release the
        // orphaned sentinel instead of leaking an active lock.
        if (disposed || seq !== requestSeq) {
          s.release()
          return
        }

        sentinel = s
        // The OS releases the lock itself when the page is backgrounded,
        // signalling via this event. Re-acquire if we're still visible and
        // still want the lock. Only the *current* sentinel may trigger
        // this — a superseded sentinel's event is stale news.
        s.addEventListener('release', () => {
          if (!disposed && sentinel === s && document.visibilityState === 'visible') {
            requestLock()
          }
        })
      } catch {
        // request() rejects when the document isn't visible — nothing to
        // do now; the visibilitychange handler below covers the transition
        // back to visible.
      }
    }

    function handleVisibilityChange() {
      // The spec says the OS drops the lock when the page hides; re-acquire
      // when it comes back.
      if (document.visibilityState === 'visible') requestLock()
    }

    requestLock()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return function releaseWakeLock() {
      disposed = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      sentinel?.release()
    }
  }, [active])
}
