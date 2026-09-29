import { useState } from 'react'
import type { Round } from '../types.ts'
import { copy } from '../copy/en'
import { useTimer } from '../hooks/useTimer'
import { useSoundEffects } from '../hooks/useSoundEffects'

// How long a player must hold the continue button before it fires. Chosen
// to comfortably outlast the stray follow-up tap that lands here right
// after a win-swipe release on TurnScreen — the bug this button redesign
// exists to fix.
const HOLD_SECONDS = 3

type TurnCurtainProps = {
  // How many words the team that just played won this turn.
  correctCount: number
  // Name of the team whose turn is about to start.
  nextTeamName: string
  // Whether this is a round-ending turn that just finished
  roundEnded: boolean,
  // The round number that just finished
  round: Round
  // Fired when the player taps "Go". The caller decides what that means
  // (close the curtain, start the next turn's timer, etc.) — no state
  // transition is wired up here.
  onNext: () => void
}

// Interstitial shown between turns, after the timer expires and the active
// team changes. Recaps how many words the team that just played won, then
// names who's up next. Mirrors RoundIntroCurtain's structure and swaps in
// for the gameplay screen's content the same way, rather than overlaying it.
function TurnCurtain({ correctCount, nextTeamName, round, roundEnded, onNext }: TurnCurtainProps) {
  const { play } = useSoundEffects()
  const [isHolding, setIsHolding] = useState(false)
  // 1s-granularity countdown reused as the hold's authoritative clock: the
  // fill's CSS transition is purely decorative, so onNext firing depends on
  // this timer, not on the animation completing (which prefers-reduced-motion
  // or a dropped frame could otherwise suppress).
  const { timeLeft, startTimer, stopTimer, resetTimer } = useTimer(HOLD_SECONDS, function holdComplete() {
    play('tap')
    onNext()
  })

  function beginHold(event: React.PointerEvent) {
    if (!event.isPrimary) return
    setIsHolding(true)
    startTimer()
  }

  // Releasing early resets rather than pauses — a half-charged button
  // carrying over to the next press would misrepresent how long *this*
  // hold has to go.
  function cancelHold(event: React.PointerEvent) {
    if (!event.isPrimary || !isHolding) return
    setIsHolding(false)
    stopTimer()
    resetTimer()
  }

  // Keyboard/screen-reader users never went through the swipe gesture that
  // causes the mis-tap this hold exists to prevent, and a fixed-duration
  // key-hold isn't a reliable or accessible interaction anyway — so Enter/
  // Space stay instant. A keyboard-activated click reports detail 0; a real
  // mouse or touch click always reports detail >= 1. That's the only signal
  // used here to tell them apart, so a quick pointer tap (which also cancels
  // its own hold via onPointerUp above) is never mistaken for a keyboard
  // confirm.
  function handleClick(event: React.MouseEvent) {
    if (event.detail === 0) {
      play('tap')
      onNext()
    }
  }

  const continueLabel = isHolding
    ? copy.gameplay.turnCurtain.holdingLabel(timeLeft)
    : copy.gameplay.turnCurtain.goButton(roundEnded)

  return (
    <section className="screen turn-curtain" aria-labelledby="turn-curtain-title">
      <h1 className="turn-curtain__title" id="turn-curtain-title">
        {roundEnded ?
          copy.gameplay.turnCurtain.roundOverLabel(round)
          :
          copy.gameplay.turnCurtain.turnOverLabel}
      </h1>

      <p className="turn-curtain__result" role="status">
        {copy.gameplay.turnCurtain.resultLabel(correctCount)}
      </p>

      {
        roundEnded || <p className="turn-curtain__ready">
          {copy.gameplay.turnCurtain.readyPrompt(nextTeamName)}
        </p>
      }

      <button
        className={`btn turn-curtain__continue${isHolding ? ' turn-curtain__continue--holding' : ''}`}
        style={{ '--hold-duration': `${HOLD_SECONDS * 1000}ms` } as React.CSSProperties}
        type="button"
        onPointerDown={beginHold}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onPointerLeave={cancelHold}
        onClick={handleClick}
        autoFocus
      >
        <span className="turn-curtain__continue-fill" aria-hidden="true" />
        <span className="turn-curtain__continue-label">{continueLabel}</span>
      </button>
    </section>
  )
}

export default TurnCurtain
