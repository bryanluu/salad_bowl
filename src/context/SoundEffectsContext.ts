// src/context/SoundEffectsContext.ts
import { createContext } from 'react'
import type { UseSoundEffects } from '../hooks/useSoundEffects'

// Split into its own (non-.tsx) file, away from both the Provider component
// and the useSound hook, because react-refresh/only-export-components
// requires a component file to export only components.
export const SoundEffectsContext = createContext<UseSoundEffects | undefined>(undefined)
