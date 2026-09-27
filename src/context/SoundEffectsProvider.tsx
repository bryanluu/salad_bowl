// src/context/SoundEffectsProvider.tsx
import type { ReactNode } from 'react'
import { useSoundEffects } from '../hooks/useSoundEffects'
import { SoundEffectsContext } from './SoundEffectsContext'

// Wraps the app once (see App.tsx) so every component shares one `enabled`
// setting and one pool of <audio> elements, instead of each component that
// calls useSound() getting its own independent copy — which would let, say,
// muting from GameSetupScreen fail to mute a sound played from Footer.
export function SoundEffectsProvider({ children }: { children: ReactNode }) {
  const soundEffects = useSoundEffects()
  return (
    <SoundEffectsContext.Provider value={soundEffects}>
      {children}
    </SoundEffectsContext.Provider>
  )
}
