import { useState } from "react"
import { type GameConfig, type Word, type WordSource, type Team } from "../types"
import { pickWord } from "../words/pickWord"
import { copy } from "../copy/en"

type Bowl = Word[]
type Round = 1 | 2 | 3
type TimeInSeconds = number
type Turn = { teamIdx: number }
type BowlState = { bowl: Bowl; currentWord: Word | undefined }

function GameplayScreen({ config, source }: { config: GameConfig, source: WordSource }) {
  const [round, setRound] = useState<Round>(1)
  const [timeLeft, setTimeLeft] = useState<TimeInSeconds>(config.timerSeconds)
  const [turn, setTurn] = useState<Turn>(() => {
    // TODO: shuffle the order of the teams so every game is different
    const idx = Math.floor(Math.random() * config.teams.length)
    return { teamIdx: idx }
  })
  const [wonWords, setWonWords] = useState<Record<string, Word[]>>({})

  function initBowlState(words: Word[]): BowlState {
    const { word, remaining } = pickWord(words)
    return { bowl: remaining, currentWord: word }
  }

  const [{ bowl, currentWord }, setBowlState] =
    useState<BowlState>(() => initBowlState([...source.getWords()]))

  const team = config.teams[turn.teamIdx]

  function formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // TODO: switch players when timer is done
  function moveToNextPlayer() {
    const nextTeamIdx = (turn.teamIdx + 1) % config.teams.length
    setTurn({ teamIdx: nextTeamIdx })
  }

  function skipWord() {
    if (!currentWord) return

    // pick a new word from the bowl,
    // then put the previous word back into the bowl
    const { word, remaining } = pickWord(bowl)
    setBowlState({ bowl: [...remaining, currentWord], currentWord: word })
  }

  function winWord(team: Team) {
    if (!currentWord) return

    const teamWords = wonWords[team.id] ?? []
    setWonWords({ ...wonWords, [team.id]: [...teamWords, currentWord] })
    const { word, remaining } = pickWord(bowl)
    setBowlState({ bowl: remaining, currentWord: word })
  }

  // TODO: when timer is done or bowl is empty, moveToNextPlayer or change round

  return (
    <section className="screen" aria-label={copy.gameplay.title}>
      <div className="turn-meta">
        <span className="badge">{copy.gameplay.roundLabel(round, copy.gameplay.round[round].label)}</span>
        <span className="timer">{formatTime(timeLeft)}</span>
      </div>

      <p className="turn-indicator">{copy.gameplay.turnIndicator(team.name)}</p>

      <div className="word-card">
        <p className="word-card__word">{currentWord}</p>
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
        copy.gameplay.wordsLeft(bowl.length + (currentWord ? 1 : 0))
      }</p>
    </section>
  )
}

export default GameplayScreen
