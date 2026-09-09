import { useState } from "react"
import { type GameConfig, type Word, type WordSource, type Team } from "../types"
import { pickWord } from "../words/pickWord"
import { copy } from "../copy/en"

type Bowl = Word[]
type Round = 1 | 2 | 3
type TimeInSeconds = number
type Turn = { teamIdx: number, playerId: number }

function GameplayScreen({ config, source }: { config: GameConfig, source: WordSource }) {
  const [bowl, setBowl] = useState<Bowl>([...source.getWords()])
  const [round, setRound] = useState<Round>(1)
  const [timeLeft, setTimeLeft] = useState<TimeInSeconds>(config.timerSeconds)
  const [turn, setTurn] = useState<Turn>({ teamIdx: 0, playerId: 0 })
  const [wonWords, setWonWords] = useState<Record<string, Word[]>>({})

  const word = pickWord(bowl)
  const team = config.teams[turn.teamIdx]

  function formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  function skipWord() {
    if (!word) return

    setBowl([...bowl, word])
    moveToNextPlayer()
  }

  function winWord(team: Team) {
    if (!word) return

    const teamWords: Word[] = wonWords[team.id] ?? []
    setWonWords({ ...wonWords, [team.id]: [...teamWords, word] })
    moveToNextPlayer()
  }

  function moveToNextPlayer() {
    const nextTeamIdx = (turn.teamIdx + 1) % config.teams.length
    const nextPlayerId = (turn.playerId + 1) % config.totalPlayers
    setTurn({ teamIdx: nextTeamIdx, playerId: nextPlayerId })
  }


  return (
    <section className="screen" aria-label={copy.gameplay.title}>
      <div className="turn-meta">
        <span className="badge">{copy.gameplay.roundLabel(round, copy.gameplay.round[round].label)}</span>
        <span className="timer">{formatTime(timeLeft)}</span>
      </div>

      <p className="turn-indicator">{copy.gameplay.turnIndicator(team.name)}</p>

      <div className="word-card">
        <p className="word-card__word">{word}</p>
      </div>

      <div className="turn-controls">
        <button
          className="turn-controls__side turn-controls__side--skip"
          type="button"
          onClick={skipWord}>
          <span aria-hidden="true">&larr;</span> {copy.gameplay.skipButton}
        </button>
        <div className="turn-controls__knob" aria-hidden="true">
          &harr;
        </div>
        <button
          className="turn-controls__side turn-controls__side--pass"
          type="button"
          onClick={() => winWord(team)}>
          {copy.gameplay.gotItButton} <span aria-hidden="true">&rarr;</span>
        </button>
      </div>

      <p className="words-left">{
        copy.gameplay.wordsLeft(bowl.length) // TODO: fix bug where wordsLeft is incorrect
      }</p>
    </section>
  )
}

export default GameplayScreen
