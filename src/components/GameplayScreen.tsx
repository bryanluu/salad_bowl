import { useState, useRef, useEffect } from "react"
import { useTimer } from "../hooks/useTimer"
import { type GameConfig, type Word, type WordSource, type Team } from "../types"
import { pickWord, switchWord } from "../words/pickWord"
import { shuffle } from "../teams/shuffle"
import { copy } from "../copy/en"
import { useKeyPress } from "../hooks/useKeyPress"

type Bowl = Word[]
type Round = 1 | 2 | 3
type Turn = number
type BowlState = { bowl: Bowl; currentWord: Word | undefined }

function GameplayScreen({ config, source }: { config: GameConfig, source: WordSource }) {
  const [round] = useState<Round>(1)
  const { timeLeft, resetTimer, startTimer, stopTimer } = useTimer(config.timerSeconds, handleTimerExpiry)
  const [teams] = useState<Team[]>(() => {
    return config.shuffleTeamOrder ? shuffle(config.teams) : [...config.teams]
  })
  const [turn, setTurn] = useState<Turn>(0)
  const [wonWords, setWonWords] = useState<Record<string, Word[]>>({})
  const [knobOffsetX, setKnobOffsetX] = useState<number | undefined>(undefined)
  const leftPressed = useKeyPress('ArrowLeft')
  const rightPressed = useKeyPress('ArrowRight')
  const controlsRef = useRef<HTMLDivElement>(null)
  const skipWordRef = useRef(skipWord)
  const winWordRef = useRef(() => winWord(team))

  function initBowlState(words: Word[]): BowlState {
    const { word, remaining } = pickWord(words)
    return { bowl: remaining, currentWord: word }
  }

  const [{ bowl, currentWord }, setBowlState] =
    useState<BowlState>(() => initBowlState([...source.getWords()]))

  // Display order follows the (possibly shuffled) team order, not the
  // original config order — the two can differ once shuffleTeamOrder is set.
  const team = teams[turn]

  useEffect(() => {
    skipWordRef.current = skipWord
    winWordRef.current = () => winWord(team)
  })

  const inPlay = Boolean(currentWord) // only false when bowl is empty

  useEffect(() => {
    if (inPlay) {
      startTimer()
    } else {
      stopTimer()
    }

    return () => stopTimer()
  }, [inPlay, startTimer, stopTimer])

  useEffect(() => {
    if (leftPressed) skipWordRef.current()
  }, [leftPressed])

  useEffect(() => {
    if (rightPressed) winWordRef.current()
  }, [rightPressed])

  function handleTimerExpiry() {
    if (currentWord) {
      moveToNextPlayer()
      resetTimer()
      startTimer()
    }
  }

  function followCursor(event: React.PointerEvent) {
    // Touch pointers only exist while a finger is in contact, so this
    // passes only real drags — desktop mouse hover (and pen) is ignored.
    // isPrimary keeps a second steadying finger from yanking the knob.
    if (event.pointerType !== "touch" || !event.isPrimary) return
    const container = controlsRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const relativeX = event.clientX - rect.left
    const horizontalGap = 25 // experimentally determined

    // Clamp so the knob can't be dragged past the pill's edges
    const clamped = Math.min(Math.max(relativeX, horizontalGap), rect.width - horizontalGap)
    setKnobOffsetX(clamped)
  }

  function releaseKnob(event: React.PointerEvent) {
    if (event.pointerType !== "touch" || !event.isPrimary) return
    const container = controlsRef.current
    if (!container || !knobOffsetX) return

    const rect = container.getBoundingClientRect()
    const threshold = 0.3 * rect.width
    const midpoint = rect.width * 0.5

    // Check if swipe was sufficient
    if (knobOffsetX >= midpoint + threshold) winWord(team)
    if (knobOffsetX <= midpoint - threshold) skipWord()

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

    if (word)
      setBowlState({ bowl: remaining, currentWord: word })

    // if it's the last word, do nothing
  }

  function endRound() {
    stopTimer()
    resetTimer()
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
        onPointerCancel={releaseKnob}
        onPointerLeave={releaseKnob}
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
      <pre>
        {
          // TODO: remove debug 
          JSON.stringify(knobOffsetX, null, "  ")
        }
      </pre>
    </section>
  )
}

export default GameplayScreen
