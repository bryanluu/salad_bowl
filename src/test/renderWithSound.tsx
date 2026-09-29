// src/test/renderWithSound.tsx
import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { SoundProvider } from '../hooks/useSoundEffects'

// Component tests render inside a SoundProvider (useSoundEffects throws
// without one). The provider's play() calls stay inert in tests — no
// gesture fires, so the autoplay gate holds — but the context must exist.
export function renderWithSound(ui: ReactElement) {
  return render(
    <SoundProvider>
      {ui}
    </SoundProvider>,
  )
}
