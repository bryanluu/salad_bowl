// Static skeleton only — round/timer state, the word deck, and
// skip/got-it handling aren't wired up yet. Matches the turn/gameplay
// wireframe, including the swipe-pill affordance in the middle control.
function GameplayScreen() {
  return (
    <section className="screen" aria-label="Current turn">
      <div className="turn-meta">
        <span className="badge">Round 1 &middot; Taboo</span>
        <span className="timer">0:42</span>
      </div>

      <p className="turn-indicator">Team 1&rsquo;s turn</p>

      <div className="word-card">
        <p className="word-card__word">Guitar</p>
      </div>

      <div className="turn-controls">
        <button className="turn-controls__side turn-controls__side--skip" type="button">
          <span aria-hidden="true">&larr;</span> Skip
        </button>
        <button className="btn btn--secondary btn--icon" type="button" aria-label="Pass device">
          &harr;
        </button>
        <button className="turn-controls__side turn-controls__side--pass" type="button">
          Got it <span aria-hidden="true">&rarr;</span>
        </button>
      </div>

      <p className="words-left">14 words left</p>
    </section>
  )
}

export default GameplayScreen
