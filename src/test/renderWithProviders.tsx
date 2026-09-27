// src/test/renderWithProviders.tsx
import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { SoundEffectsProvider } from '../context/SoundEffectsProvider'

// SB-50: most component tests don't care about sound at all, but every
// screen now reads from SoundEffectsContext via useSound() — which throws
// if there's no <SoundEffectsProvider> above it (see useSound.ts, and the
// SoundEffectsContext design note on why that's deliberate: a silently
// missing provider would be a confusing bug to chase). This is a drop-in
// replacement for RTL's `render` that supplies one, so existing tests don't
// need to know sound exists at all.
export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: SoundEffectsProvider, ...options })
}
