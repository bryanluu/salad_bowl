import type { Scores, TeamScore } from "../types"
import { copy } from "../copy/en"

function total(rounds: readonly number[]): number {
  return rounds.reduce((sum, score) => sum + score, 0)
}

function computeWinners(scores: Scores) {
  return scores.reduce((best: TeamScore[], team: TeamScore) => {
    if (best.length === 0) return [team]

    const teamTotal = total(team.rounds)
    const bestTotal = total(best[0].rounds)
    if (teamTotal > bestTotal)
      return [team]
    else if (teamTotal === bestTotal)
      return [...best, team]
    else
      return best
  }, [])
}

function ScoreboardScreen({ scores, onNext = () => { } }:
  {
    scores: Scores,
    onNext: () => void,
  }) {
  const round = scores[0].rounds.length
  const winners = computeWinners(scores)

  function hasTopScore(team: TeamScore) {
    return winners.find((t) => t.id === team.id)
  }

  function isTied() {
    return winners.length > 1
  }

  return (
    <section className="screen" aria-labelledby="scoreboard-title">
      <header className="screen__header">
        <h1 className="screen__title" id="scoreboard-title">
          {copy.gameplay.scoreboard.title(round)}
        </h1>
      </header>

      <table className="score-table">
        <thead>
          <tr>
            <th scope="col">{copy.gameplay.scoreboard.tableHeader.team}</th>
            {scores[0].rounds.map((_score, idx) => {
              return <th scope="col" key={idx}>{copy.gameplay.scoreboard.tableHeader.round(idx + 1)}</th>
            })}
            <th scope="col">{copy.gameplay.scoreboard.tableHeader.total}</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((team) => (
            <tr key={team.id}
              className={hasTopScore(team) ?
                (isTied() ? 'is-tied' : 'is-winner') : undefined}>
              <td>{team.name}</td>
              {team.rounds.map((score, index) => (
                <td key={index}>{score}</td>
              ))}
              <td>{total(team.rounds)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        {round < 3 ?
          copy.gameplay.scoreboard.results.preliminary(winners.map((t) => t.name)) :
          copy.gameplay.scoreboard.results.final(winners.map((t) => t.name))}
      </p>

      <button className="btn btn--primary" onClick={onNext} type="button" autoFocus>
        {round < 3 ? copy.gameplay.scoreboard.button.continue : copy.gameplay.scoreboard.button.newGame}
      </button>
    </section>
  )
}

export default ScoreboardScreen

