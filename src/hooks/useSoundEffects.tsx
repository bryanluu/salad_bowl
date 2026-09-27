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

// Priority decides collisions, not loudness. A sound that is already
// playing is only interrupted by a sound of equal or higher priority, so
// whichever fires first, the buzzer owns the "word won on the exact second
// the clock ran out" moment — and nothing, not even the urgency tick it
// replaces, can talk over it while it sounds.
const PRIORITY: Record<SoundName, number> = {
  buzzer: 100,
  celebration: 90,
  tie: 90,
  win: 80,
  round: 70,
  skip: 60,
  quit: 50,
  tap: 40,
  tick: 30,
}

type SoundApi = {
  soundOn: boolean
  setSoundOn: (on: boolean) => void
  play: (name: SoundName) => void
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

// One audio element per sound, created lazily on first play and kept for
// the provider's lifetime: replaying is a seek-to-zero + play(), which
// avoids re-fetching the (often still missing) file for every tap.
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
  const activeRef = useRef<{ name: SoundName; element: HTMLAudioElement } | null>(null)
  // A missing stub file would otherwise warn on every attempt (the tick
  // fires every second) — warn once per sound name instead.
  const warnedRef = useRef(new Set<SoundName>())

  useEffect(function unlockOnFirstGesture() {
    function unlock() {
      unlockedRef.current = true
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return function removeUnlockListeners() {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  // If the provider unmounts mid-sound (dev HMR of all things), release
  // the sound rather than letting it outlive the app.
  useEffect(function pauseOnUnmount() {
    return function stopActiveSound() {
      activeRef.current?.element.pause()
      activeRef.current = null
    }
  }, [])

  const getAudio = useCallback(function getAudioElement(name: SoundName): HTMLAudioElement {
    let element = audioMapRef.current.get(name)
    if (!element) {
      element = new Audio(sounds[name])
      // A sound that finishes releases its priority slot — otherwise the
      // win sting from a few seconds ago would still count as "playing"
      // and block the scoreboard sting that follows it.
      element.addEventListener('ended', function releasePrioritySlot() {
        if (activeRef.current?.element === element) activeRef.current = null
      })
      audioMapRef.current.set(name, element)
    }
    return element
  }, [])

  const play = useCallback(function playSound(name: SoundName) {
    if (!unlockedRef.current || !soundOnRef.current) return

    const active = activeRef.current
    // Idempotent: re-requesting the sound that is already playing (e.g. a
    // mount effect double-firing under StrictMode) doesn't restart it.
    if (active?.name === name) return
    // Never interrupt a more important sound that is still audible.
    if (active && PRIORITY[active.name] > PRIORITY[name]) return

    if (active) {
      active.element.pause()
      active.element.currentTime = 0
    }

    const element = getAudio(name)
    element.currentTime = 0
    const playing = element.play()
    if (playing) {
      playing.catch(function onPlayRejected() {
        // play() rejects where the file is still a stub (404 → no supported
        // sources) or the browser withholds autoplay. Degrade to silence,
        // release the priority slot, and warn once per missing file.
        if (activeRef.current?.element === element) activeRef.current = null
        if (!warnedRef.current.has(name)) {
          warnedRef.current.add(name)
          console.warn(
            `[sound] "${name}" is silent — no audio file at ${sounds[name]} yet (TODO in src/sounds.ts).`,
          )
        }
      })
    }
    activeRef.current = { name, element }
  }, [getAudio])

  const handleSetSoundOn = useCallback(function setSoundOnAndPersist(on: boolean) {
    soundOnRef.current = on
    setSoundOnState(on)
    try {
      localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
    } catch {
      // Storage unavailable — the preference applies for this session only.
    }
    if (on) {
      // Only the "on" state confirms with a blip; "off" stays silent.
      play('tap')
    } else {
      // Muting also stops whatever is sounding right now.
      const active = activeRef.current
      if (active) {
        active.element.pause()
        activeRef.current = null
      }
    }
  }, [play])

  const value = useMemo(
    function buildSoundApi() {
      return { soundOn, setSoundOn: handleSetSoundOn, play }
    },
    [soundOn, handleSetSoundOn, play],
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
