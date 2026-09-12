import type { Scores } from "../types"
import { copy } from "../copy/en"

function total(rounds: readonly number[]): number {
  return rounds.reduce((sum, score) => sum + score, 0)
}

function ScoreboardScreen({ scores }: { scores: Scores }) {
  const round = scores[0].rounds.length
  const winnerId = scores.reduce((best, team) =>
    total(team.rounds) > total(best.rounds) ? team : best,
  ).id

  return (
    <section className="screen" aria-labelledby="scoreboard-title">
      <header className="screen__header">
        <h1 className="screen__title" id="scoreboard-title">
          {copy.scoreboard.title(round)}
        </h1>
      </header>

      <table className="score-table">
        <thead>
          <tr>
            <th scope="col">Team</th>
            {scores[0].rounds.map((_score, idx) => {
              return <th scope="col" key={idx}>R{idx + 1}</th>
            })}
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((team) => (
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
        {
          // TODO: add onClick handlers for continue | playAgain actions
        }
        {round < 3 ? copy.scoreboard.button.continue : copy.scoreboard.button.playAgain}
      </button>
    </section>
  )
}

export default ScoreboardScreen
