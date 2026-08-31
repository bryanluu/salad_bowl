import { copy } from "../copy/en"

// Static skeleton only — round/timer state, the word deck, and
// skip/got-it handling aren't wired up yet. Matches the turn/gameplay
// wireframe, including the swipe-pill affordance in the middle control.
function GameplayScreen() {
  return (
    <section className="screen" aria-label={copy.gameplay.title}>
      <div className="turn-meta">
        <span className="badge">{copy.gameplay.roundLabel(1, "Taboo")}</span>
        <span className="timer">0:42</span>
      </div>

      <p className="turn-indicator">{copy.gameplay.turnIndicator("Team 1")}</p>

      <div className="word-card">
        <p className="word-card__word">Guitar</p>
      </div>

      <div className="turn-controls">
        <button className="turn-controls__side turn-controls__side--skip" type="button">
          <span aria-hidden="true">&larr;</span> {copy.gameplay.skipButton}
        </button>
        <div className="turn-controls__knob" aria-hidden="true">
          &harr;
        </div>
        <button className="turn-controls__side turn-controls__side--pass" type="button">
          {copy.gameplay.gotItButton} <span aria-hidden="true">&rarr;</span>
        </button>
      </div>

      <p className="words-left">{copy.gameplay.wordsLeft(14)}</p>
    </section>
  )
}

export default GameplayScreen
