// src/hooks/useSoundEffects.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { sounds, type SoundName } from '../sounds.ts'

// The one deliberate exception to the no-persistence architecture (see the
// comment on App's handleQuit): sound on/off is a user preference, not game
// state, so — and only so — it survives a reload.
const STORAGE_KEY = 'salad-bowl:sound-on'

type SoundApi = {
  soundOn: boolean
  setSoundOn: (on: boolean) => void
  play: (name: SoundName) => void
  // Cuts a sound off mid-play and rewinds it. For long stings (the game
  // verdict) that would otherwise outlive the screen that triggered them.
  stop: (name: SoundName) => void
}

const SoundContext = createContext<SoundApi | null>(null)

function readStoredSoundOn(): boolean {
  try {
    // On by default; only an explicit 'off' mutes.
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    // Storage unavailable (blocked, private mode) — fall back to the default.
    return true
  }
}

// One audio element per sound, created (and primed — see unlockOnFirstGesture
// below) during the first user gesture, then kept for the provider's
// lifetime: replaying is a seek-to-zero + play(), which avoids re-fetching
// the (often still missing) file for every tap.
//
// SB-50: sounds are independent of each other — no priority system, no
// single "active" slot — so two different sounds CAN play at once (e.g. a
// word won on the exact second the buzzer fires). That's a deliberate
// simplicity trade-off: collisions like that are expected to be rare and
// brief enough not to be worth a priority/interruption system. Revisit if
// that assumption turns out wrong in practice. Retriggering the *same*
// sound while it's still playing does restart it from the top (one element
// per name, not cloned) — the one case this design doesn't leave alone.
export function SoundProvider({ children }: { children: ReactNode }) {
  const [soundOn, setSoundOnState] = useState(readStoredSoundOn)
  // Ref mirror, kept current inside handleSetSoundOn so play() sees the
  // latest value even before the re-render has landed.
  const soundOnRef = useRef(soundOn)
  // Browser autoplay policy (iOS Safari is the strictest) withholds audio
  // until the user has interacted with the page. This gate is deliberately
  // stricter than the policy requires: nothing may sound before a gesture,
  // so the first sound — the Start screen's tap blip — always traces back
  // to a user action, never to a mount.
  const unlockedRef = useRef(false)
  const audioMapRef = useRef(new Map<SoundName, HTMLAudioElement>())

  const getAudio = useCallback(function getAudioElement(name: SoundName): HTMLAudioElement {
    let element = audioMapRef.current.get(name)
    if (!element) {
      element = new Audio(sounds[name])
      audioMapRef.current.set(name, element)
    }
    return element
  }, [])

  useEffect(function unlockOnFirstGesture() {
    function unlock() {
      unlockedRef.current = true
      // Prime every sound during this real gesture — muted, played, then
      // immediately paused and rewound — rather than just flipping the
      // flag above. iOS (Safari and Chrome alike, both WebKit under the
      // hood) grants the "may autoplay" exemption per <audio> element, not
      // to the page as a whole. Without this, any element that's first
      // *created* later from a non-gesture callback (the buzzer, fired
      // from a timer) can still be silently refused even though a gesture
      // already happened — which is exactly the failure mode reported on
      // iOS Chrome, where several elements are never touched during this
      // unlock because their sounds haven't played yet.
      for (const name of Object.keys(sounds) as SoundName[]) {
        const element = getAudio(name)
        element.muted = true
        const priming = element.play()
        // jsdom's HTMLMediaElement.play() isn't implemented and returns
        // undefined instead of a Promise (see the component tests, which
        // render through the real SoundProvider); a real browser always
        // returns one.
        if (!priming) {
          element.muted = false
          continue
        }
        priming
          .then(function primed() {
            element.pause()
            element.currentTime = 0
            element.muted = false
          })
          .catch(function primeFailed() {
            // Still missing/blocked even muted-in-a-gesture — leave muted
            // off so a later real play() attempt surfaces its own warning
            // normally, rather than staying silently muted forever.
            element.muted = false
          })
      }
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return function removeUnlockListeners() {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [getAudio])

  // If the provider unmounts mid-sound (dev HMR of all things), stop
  // whatever's still playing rather than letting it outlive the app.
  useEffect(function pauseAllOnUnmount() {
    const audioMap = audioMapRef.current
    return function stopEverything() {
      audioMap.forEach((element) => element.pause())
    }
  }, [])

  const play = useCallback(function playSound(name: SoundName) {
    if (!unlockedRef.current || !soundOnRef.current) return

    const element = getAudio(name)
    element.currentTime = 0
    const playing = element.play()
    if (playing) {
      playing.catch(function onPlayRejected() {
        // play() rejects where the file is still a stub (404 → no supported
        // sources) or the browser withholds autoplay. Warns every time,
        // deliberately not deduped to once-per-sound — a quieter version of
        // this warning would be a confusing outlier among the browser's own
        // per-attempt console errors for the same failure.
        console.warn(
          `[sound] "${name}" is silent — no audio file at ${sounds[name]} yet (TODO in src/sounds.ts).`,
        )
      })
    }
  }, [getAudio])

  const stop = useCallback(function stopSound(name: SoundName) {
    // No-op for a sound that was never created (nothing to stop). Not
    // gated on the gesture/mute flags: stopping is always safe, and it
    // must still work if the player mutes mid-sound.
    const element = audioMapRef.current.get(name)
    if (!element) return
    element.pause()
    element.currentTime = 0
  }, [])

  const handleSetSoundOn = useCallback(function setSoundOnAndPersist(on: boolean) {
    soundOnRef.current = on
    setSoundOnState(on)
    try {
      localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
    } catch {
      // Storage unavailable — the preference applies for this session only.
    }
    if (on) {
      // Only the "on" state confirms with a blip; "off" stays silent. Not a
      // functional setState updater above (setSoundOnState(on) takes the
      // caller-computed value, not a `prev => ...` callback), so this side
      // effect running in the same function body is safe — see useTimer.ts
      // for why a *functional* updater is the wrong place for one
      // (StrictMode double-invokes those, but not this function).
      play('tap')
    } else {
      // Muting also stops whatever is sounding right now.
      audioMapRef.current.forEach((element) => element.pause())
    }
  }, [play])

  const value = useMemo(
    function buildSoundApi() {
      return { soundOn, setSoundOn: handleSetSoundOn, play, stop }
    },
    [soundOn, handleSetSoundOn, play, stop],
  )

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  )
}

// Shares the file with SoundProvider on purpose — the hook is the whole
// consumer-facing API, and fast refresh's component-only preference is the
// lesser evil here (it's a dev-HMR nicety, not a correctness rule).
// eslint-disable-next-line react-refresh/only-export-components
export function useSoundEffects(): SoundApi {
  const api = useContext(SoundContext)
  if (!api) {
    throw new Error('useSoundEffects must be used inside <SoundProvider>')
  }
  return api
}
