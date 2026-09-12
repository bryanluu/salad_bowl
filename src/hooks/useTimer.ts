import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer(timeInSeconds: number, onExpiry: () => void = () => { }): {
  timeLeft: number,
  resetTimer: () => void,
  stopTimer: () => void,
  startTimer: () => void
} {
  const [timeLeft, setTimeLeft] = useState(timeInSeconds)
  // Monotonic run-generation counter, not a boolean: a plain `running` flag
  // collapses through a same-batch stop→start (e.g. the expiry handler
  // calling startTimer synchronously) and never re-triggers the tick effect
  // below, leaving a cleared interval behind. Bumping a counter guarantees
  // a fresh effect dep on every start, so the interval is always re-armed.
  const [runId, setRunId] = useState(0)
  const onExpiryRef = useRef(onExpiry)

  // Keep the ref current without making the tick effect depend on onExpiry's identity
  useEffect(() => {
    onExpiryRef.current = onExpiry
  })

  const resetTimer = useCallback(() => {
    setTimeLeft(timeInSeconds)
  }, [timeInSeconds])

  const startTimer = useCallback(() => setRunId((id) => id + 1), [])
  const stopTimer = useCallback(() => setRunId(0), [])

  // Local variable, not a functional setState updater: updaters must stay
  // pure (StrictMode double-invokes them), but this needs side effects
  // (clearInterval/onExpiry) on reaching zero.
  useEffect(() => {
    if (timeInSeconds <= 0 || runId === 0) return

    let remaining = timeLeft

    const id = setInterval(() => {
      remaining = Math.max(remaining - 1, 0)
      setTimeLeft(remaining)

      if (remaining === 0) {
        clearInterval(id)
        onExpiryRef.current()
      }
    }, 1000)

    return () => clearInterval(id)
    // timeLeft is a start-of-interval snapshot only, not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, timeInSeconds])

  return { timeLeft, resetTimer, startTimer, stopTimer }
}
