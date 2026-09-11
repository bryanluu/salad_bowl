import { copy } from '../copy/en'

type TurnCurtainProps = {
  // How many words the team that just played won this turn.
  correctCount: number
  // Name of the team whose turn is about to start.
  nextTeamName: string
  // Fired when the player taps "Go". The caller decides what that means
  // (close the curtain, start the next turn's timer, etc.) — no state
  // transition is wired up here.
  onNext: () => void
}

// Interstitial shown between turns, after the timer expires and the active
// team changes. Recaps how many words the team that just played won, then
// names who's up next. Mirrors RoundIntroCurtain's structure and swaps in
// for the gameplay screen's content the same way, rather than overlaying it.
function TurnCurtain({ correctCount, nextTeamName, onNext }: TurnCurtainProps) {
  return (
    <section className="screen turn-curtain" aria-labelledby="turn-curtain-title">
      <h1 className="turn-curtain__title" id="turn-curtain-title">
        {copy.gameplay.turnCurtain.turnOverLabel}
      </h1>

      <p className="turn-curtain__result" role="status">
        {copy.gameplay.turnCurtain.resultLabel(correctCount)}
      </p>

      <p className="turn-curtain__ready">
        {copy.gameplay.turnCurtain.readyPrompt(nextTeamName)}
      </p>

      <button className="btn btn--primary" type="button" onClick={onNext} autoFocus>
        {copy.gameplay.turnCurtain.goButton}
      </button>
    </section>
  )
}

export default TurnCurtain
