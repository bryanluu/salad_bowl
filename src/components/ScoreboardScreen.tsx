// Static skeleton only, using stubbed scores — real per-round scoring
// will replace stubScores once the game loop exists. Matches the
// scoreboard wireframe, including the winning-team highlight.
interface TeamScore {
  id: string
  name: string
  rounds: [number, number, number]
}

const stubScores: TeamScore[] = [
  { id: 'team-1', name: 'Team 1', rounds: [4, 5, 6] },
  { id: 'team-2', name: 'Team 2', rounds: [3, 4, 5] },
]

function total(rounds: readonly number[]): number {
  return rounds.reduce((sum, score) => sum + score, 0)
}

function ScoreboardScreen() {
  const winnerId = stubScores.reduce((best, team) =>
    total(team.rounds) > total(best.rounds) ? team : best,
  ).id

  return (
    <section className="screen" aria-labelledby="scoreboard-title">
      <header className="screen__header">
        <h1 className="screen__title" id="scoreboard-title">
          Final score
        </h1>
      </header>

      <table className="score-table">
        <thead>
          <tr>
            <th scope="col">Team</th>
            <th scope="col">R1</th>
            <th scope="col">R2</th>
            <th scope="col">R3</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {stubScores.map((team) => (
            <tr key={team.id} className={team.id === winnerId ? 'is-winner' : undefined}>
              <td>{team.name}</td>
              {team.rounds.map((score, index) => (
                <td key={index}>{score}</td>
              ))}
              <td>{total(team.rounds)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="btn btn--primary" type="button">
        Play again
      </button>
    </section>
  )
}

export default ScoreboardScreen
