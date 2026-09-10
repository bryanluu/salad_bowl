import { useState, useRef } from "react"
import { type GameConfig, type Word, type WordSource, type Team } from "../types"
import { pickWord, switchWord } from "../words/pickWord"
import { shuffle } from "../teams/shuffle"
import { copy } from "../copy/en"

type Bowl = Word[]
type Round = 1 | 2 | 3
type TimeInSeconds = number
type Turn = number
type BowlState = { bowl: Bowl; currentWord: Word | undefined }

function GameplayScreen({ config, source }: { config: GameConfig, source: WordSource }) {
  const [round] = useState<Round>(1)
  const [timeLeft, setTimeLeft] = useState<TimeInSeconds>(config.timerSeconds)
  const [teams] = useState<Team[]>(() => {
    return config.shuffleTeamOrder ? shuffle(config.teams) : [...config.teams]
  })
  const [turn, setTurn] = useState<Turn>(0)
  const [wonWords, setWonWords] = useState<Record<string, Word[]>>({})
  const [knobOffsetX, setKnobOffsetX] = useState<number | undefined>(undefined)
  const controlsRef = useRef<HTMLDivElement>(null)

  function initBowlState(words: Word[]): BowlState {
    const { word, remaining } = pickWord(words)
    return { bowl: remaining, currentWord: word }
  }

  const [{ bowl, currentWord }, setBowlState] =
    useState<BowlState>(() => initBowlState([...source.getWords()]))

  // Display order follows the (possibly shuffled) team order, not the
  // original config order — the two can differ once shuffleTeamOrder is set.
  const team = teams[turn]

  let timer: number | null = null
  if (currentWord) {
    if (timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else {
      moveToNextPlayer()
      setTimeLeft(config.timerSeconds)
    }
  }

  function followCursor(event: React.PointerEvent) {
    // TODO: guard against desktop cursor hovers, only match mobile app
    const container = controlsRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const relativeX = event.clientX - rect.left
    const knobRadius = 18 // half of the 36px knob

    // TODO: add thresholds for triggering skip/win

    // Clamp so the knob can't be dragged past the pill's edges
    const clamped = Math.min(Math.max(relativeX, knobRadius), rect.width - knobRadius)
    setKnobOffsetX(clamped)
  }

  function resetKnob() {
    setKnobOffsetX(undefined)
  }

  function formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  function moveToNextPlayer() {
    const nextTurn = (turn + 1) % teams.length
    setTurn(nextTurn)
  }

  function skipWord() {
    if (!currentWord) return

    const { word, remaining } = switchWord(currentWord, bowl)
    setBowlState({ bowl: remaining, currentWord: word })
  }

  function endRound() {
    if (timer !== null)
      clearTimeout(timer)
    // TODO: end round and transition screen
  }

  function winWord(team: Team) {
    if (!currentWord) return

    const teamWords = wonWords[team.id] ?? []
    setWonWords({ ...wonWords, [team.id]: [...teamWords, currentWord] })
    const { word, remaining } = pickWord(bowl)
    setBowlState({ bowl: remaining, currentWord: word })
    if (!word) {
      endRound()
    }
  }

  return (
    <section className="screen" aria-label={copy.gameplay.title}>
      <pre>
        {
          // TODO: remove debug 
          JSON.stringify(turn, null, "  ")
        }
      </pre>
      <div className="turn-meta">
        <span className="badge">{copy.gameplay.roundLabel(round, copy.gameplay.round[round].label)}</span>
        <span className="timer">{formatTime(timeLeft)}</span>
      </div>

      <p className="turn-indicator">{copy.gameplay.turnIndicator(team.name)}</p>

      <div className="word-card">
        <p className="word-card__word">{currentWord}</p>
      </div>

      <div
        className="turn-controls"
        ref={controlsRef}
        onPointerMove={followCursor}
        onPointerLeave={resetKnob}
      >
        <button
          className="turn-controls__side turn-controls__side--skip"
          type="button"
          onClick={skipWord}>
          <span aria-hidden="true">&larr;</span> {copy.gameplay.skipButton}
        </button>
        <div
          id="control-knob"
          className="turn-controls__knob"
          aria-hidden="true"
          style={
            knobOffsetX
              ? { left: `${knobOffsetX}px` }
              : undefined
          }
        >
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
