// src/hooks/useSoundEffects.ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { sounds, type SoundName } from '../sounds/sounds'

const STORAGE_KEY = 'salad-bowl:sound-enabled'

// Sound is a user preference, not game state — the one deliberate exception
// to the app's no-persistence architecture (see decisions log). Defaults to
// enabled so new players get sound unless they turn it off.
function readStoredPreference(): boolean {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === null ? true : stored === 'true'
  } catch {
    // localStorage can throw in private-browsing/storage-blocked contexts.
    // Losing the persisted preference is fine; crashing the app over a
    // sound setting is not.
    return true
  }
}

// Sounds we've already warned about this session, so a sound that plays
// every second (tick) or every rapid tap doesn't spam the console once per
// play — one warning per missing/broken sound is plenty to point a
// developer at the TODO in sounds.ts. Module-level (not per-hook-instance)
// since SoundEffectsProvider only ever mounts the hook once anyway, but
// this also survives a component remounting mid-session.
const warnedSounds = new Set<SoundName>()

function warnMissing(name: SoundName) {
  if (warnedSounds.has(name)) return
  warnedSounds.add(name)
  console.warn(
    `[sound] "${name}" failed to play (${sounds[name]}) — ` +
    `see the TODO for it in src/sounds/sounds.ts`
  )
}

// Fires .play() and reports however it fails to play, instead of silently
// swallowing it: a real browser returns a Promise that rejects — expected
// right now, since every entry in sounds.ts is still a TODO with no file at
// that path — or a play() called before any user gesture has unlocked
// audio; jsdom (used by this repo's component tests) doesn't implement
// HTMLMediaElement.play() at all and returns undefined instead of a
// Promise, which Promise.resolve() here normalizes so `.catch` is always
// safe to call.
function safePlay(name: SoundName, audio: HTMLAudioElement) {
  try {
    Promise.resolve(audio.play()).catch(() => warnMissing(name))
  } catch {
    // some environments throw synchronously instead of rejecting
    warnMissing(name)
  }
}

export type UseSoundEffects = {
  enabled: boolean
  toggle: () => void
  play: (name: SoundName) => void
}

// Provides `play(name)` for one-shot sound effects, plus an `enabled` mute
// toggle that's persisted across sessions. Not meant to be called more than
// once — see SoundEffectsContext, which calls this a single time and shares
// the result app-wide so every component reads/toggles the same `enabled`
// state instead of drifting out of sync with each other.
export function useSoundEffects(): UseSoundEffects {
  const [enabled, setEnabled] = useState<boolean>(readStoredPreference)
  // One HTMLAudioElement per sound, created lazily on first play and reused
  // — avoids constructing (and re-fetching) a new Audio() on every call.
  const poolRef = useRef<Partial<Record<SoundName, HTMLAudioElement>>>({})

  useEffect(function persistPreference() {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(enabled))
    } catch {
      // see readStoredPreference above — same reasoning applies to writes.
    }
  }, [enabled])

  const play = useCallback(function play(name: SoundName) {
    if (!enabled) return

    let base = poolRef.current[name]
    if (!base) {
      base = new Audio(sounds[name])
      poolRef.current[name] = base
    }

    // Clone rather than play the pooled element directly, so two
    // overlapping plays of the same sound (e.g. a fast double-tap, or skip/
    // win firing in quick succession) don't cut each other off by
    // restarting one shared element. Each clone plays independently and is
    // garbage-collected once it ends.
    const instance = base.cloneNode(true) as HTMLAudioElement
    safePlay(name, instance)
  }, [enabled])

  const toggle = useCallback(function toggle() {
    setEnabled((prev) => {
      const next = !prev
      // Only the "on" transition gets a confirmation blip — see the
      // `toggleOn` entry in sounds.ts for why there's no "off" sound.
      if (next) {
        safePlay('toggleOn', new Audio(sounds.toggleOn))
      }
      return next
    })
  }, [])

  return { enabled, toggle, play }
}
