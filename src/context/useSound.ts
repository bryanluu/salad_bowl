// src/context/useSound.ts
import { useContext } from 'react'
import { SoundEffectsContext } from './SoundEffectsContext'
import type { UseSoundEffects } from '../hooks/useSoundEffects'

// Call this from any component under SoundEffectsProvider to get
// { enabled, toggle, play }. Throws if used outside the provider, so a
// missing <SoundEffectsProvider> in the tree fails loudly instead of
// silently no-op-ing every sound in the app.
export function useSound(): UseSoundEffects {
  const context = useContext(SoundEffectsContext)
  if (!context) {
    throw new Error('useSound must be used within a SoundEffectsProvider')
  }
  return context
}
