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

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [targetKey])

  return keyPressed
}
