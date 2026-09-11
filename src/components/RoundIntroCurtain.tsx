import { copy } from '../copy/en'
import type { Round } from '../types'

type RoundIntroCurtainProps = {
  round: Round
  // Name of the team whose turn is about to start. Purely display — the
  // caller owns the actual turn/team state, this component doesn't touch it.
  nextTeamName: string
  // Fired when the player taps "Begin". The caller decides what that means
  // (close the curtain, start the timer, etc.) — no state transition is
  // wired up here.
  onBegin: () => void
}

// Full-screen-card interstitial shown before a round's turns begin. Names
// the round, restates its rule so players don't have to remember it from
// setup, and names who goes first. Swaps in for the gameplay screen's
// content rather than overlaying it, matching how the other `.screen`
// cards are composed.
function RoundIntroCurtain({ round, nextTeamName, onBegin }: RoundIntroCurtainProps) {
  const { label, instructions } = copy.gameplay.round[round]

  return (
    <section className="screen round-curtain" aria-labelledby="round-curtain-title">
      <div className="round-curtain__meta">
        <span className="badge">{copy.gameplay.curtain.roundLabel(round)}</span>
      </div>

      <h1 className="round-curtain__round-name" id="round-curtain-title">
        {label}
      </h1>

      <p className="round-curtain__instructions">{instructions}</p>

      <p className="round-curtain__ready" role="status">
        {copy.gameplay.curtain.readyPrompt(nextTeamName)}
      </p>

      <button className="btn btn--primary" type="button" onClick={onBegin} autoFocus>
        {copy.gameplay.curtain.beginButton}
      </button>
    </section>
  )
}

export default RoundIntroCurtain
