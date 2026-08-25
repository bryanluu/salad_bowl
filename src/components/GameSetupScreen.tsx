import Stepper from './Stepper'

// Static skeleton only — total players, team roster, timer, and
// words-per-player aren't wired to real state yet. Handlers are no-ops
// until that lands. Matches the game-setup wireframe (mobile + desktop).
const noop = () => {}

interface StubTeam {
  id: string
  players: number
}

const stubTeams: StubTeam[] = [
  { id: 'team-1', players: 2 },
  { id: 'team-2', players: 2 },
]

function GameSetupScreen() {
  return (
    <section className="screen" aria-labelledby="game-setup-title">
      <header className="screen__header">
        <h1 className="screen__title" id="game-setup-title">
          Game setup
        </h1>
      </header>

      <div>
        <div className="field-row">
          <span className="field-row__label">Total players</span>
          <Stepper label="total players" value={8} onDecrement={noop} onIncrement={noop} />
        </div>
        <p className="field-row__help">Up to 4 teams &middot; min 2 players each</p>
      </div>

      <p className="setup-status">4 / 8 players assigned</p>

      <div className="teams">
        {stubTeams.map((team, index) => (
          <div className="team-row" key={team.id}>
            <input className="input" type="text" placeholder={`Team ${index + 1} name`} />
            <Stepper
              label={`team ${index + 1} players`}
              value={team.players}
              onDecrement={noop}
              onIncrement={noop}
            />
          </div>
        ))}
      </div>

      <button className="btn btn--secondary" type="button">
        + Add team
      </button>

      <div className="field-row">
        <span className="field-row__label">Timer</span>
        <Stepper label="timer" value="60s" onDecrement={noop} onIncrement={noop} />
      </div>

      <div className="field-row">
        <span className="field-row__label">Words / player</span>
        <Stepper label="words per player" value={5} onDecrement={noop} onIncrement={noop} />
      </div>

      <button className="btn btn--primary" type="button">
        Start game
      </button>
    </section>
  )
}

export default GameSetupScreen
