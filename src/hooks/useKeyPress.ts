import { useState, useEffect } from 'react'

export function useKeyPress(targetKey: string) {
  const [keyPressed, setKeyPressed] = useState(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === targetKey) {
        setKeyPressed(true)
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key === targetKey) {
        setKeyPressed(false)
      }
    }

    // If the window loses focus while the key is held (alt-tab, devtools,
    // etc.), the browser never delivers a matching keyup. Without this,
    // keyPressed gets stuck true and the next real press/release cycle is
    // no longer seen as a transition, so release-triggered actions silently
    // stop firing until something else resets the state.
    function handleBlur() {
      setKeyPressed(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [targetKey])

  return keyPressed
}
