import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer(timeInSeconds: number, onExpiry: () => void = () => { }): {
  timeLeft: number,
  resetTimer: () => void,
  stopTimer: () => void,
  startTimer: () => void
} {
  const [timeLeft, setTimeLeft] = useState(timeInSeconds)
  const [running, setRunning] = useState(false)
  const onExpiryRef = useRef(onExpiry)

  // Keep the ref current without making the tick effect depend on onExpiry's identity
  useEffect(() => {
    onExpiryRef.current = onExpiry
  })

  const resetTimer = useCallback(() => {
    setTimeLeft(timeInSeconds)
  }, [timeInSeconds])

  const startTimer = useCallback(() => setRunning(true), [])
  const stopTimer = useCallback(() => setRunning(false), [])

  // Local variable, not a functional setState updater: updaters must stay
  // pure (StrictMode double-invokes them), but this needs side effects
  // (clearInterval/setRunning/onExpiry) on reaching zero.
  useEffect(() => {
    if (timeInSeconds <= 0 || !running) return

    let remaining = timeLeft

    const id = setInterval(() => {
      remaining = Math.max(remaining - 1, 0)
      setTimeLeft(remaining)

      if (remaining === 0) {
        clearInterval(id)
        setRunning(false)
        onExpiryRef.current()
      }
    }, 1000)

    return () => clearInterval(id)
    // timeLeft is a start-of-interval snapshot only, not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, timeInSeconds])

  return { timeLeft, resetTimer, startTimer, stopTimer }
}
