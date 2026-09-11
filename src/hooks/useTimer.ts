import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer(timeInSeconds: number, onExpiry: () => void = () => { }): {
  timeLeft: number,
  resetTimer: () => void,
  stopTimer: () => void,
  startTimer: () => void
} {
  const [timeLeft, setTimeLeft] = useState(timeInSeconds)
  const [running, setRunning] = useState(false)
  const timerRef = useRef<number | undefined>(undefined)
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

  // A chained setTimeout, not setInterval: each tick reads timeLeft from
  // this render's closure rather than a stale one captured when the
  // interval was created, so there's no separate "why is this off by one
  // sometimes" class of bug to guard against. The cost is one extra
  // render+effect cycle per second (the effect re-arms itself via the
  // timeLeft dependency below), which is negligible at a 1s cadence.
  useEffect(() => {
    if (timeInSeconds <= 0 || !running || timeLeft <= 0) return

    timerRef.current = setTimeout(() => {
      if (timeLeft > 1) {
        setTimeLeft(timeLeft - 1)
      } else {
        setTimeLeft(0)
        setRunning(false)
        onExpiryRef.current()
      }
    }, 1000)

    return () => clearTimeout(timerRef.current)
  }, [running, timeLeft, timeInSeconds])

  return { timeLeft, resetTimer, startTimer, stopTimer }
}
