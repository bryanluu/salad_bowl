import { useState, useRef, useEffect } from "react"
import { useTimer } from "../hooks/useTimer"
import type { GameConfig, Word, WordSource, Team, Round } from "../types"
import { pickWord, switchWord } from "../words/pickWord"
import { shuffle } from "../teams/shuffle"
import { copy } from "../copy/en"
import { useKeyPress } from "../hooks/useKeyPress"
import { interpolateColor, colorToRgbString, hexToColor, type Color } from "../colors/interpolateColor"
import RoundIntroCurtain from "./RoundIntroCurtain"

type Bowl = Word[]
type Turn = number
type BowlState = { bowl: Bowl; currentWord: Word | undefined }

function GameplayScreen({ config, source }: { config: GameConfig, source: WordSource }) {
  const [round, setRound] = useState<Round>(1)
  const { timeLeft, resetTimer, startTimer, stopTimer } = useTimer(config.timerSeconds, handleTimerExpiry)
  const [teams] = useState<Team[]>(function initTeamOrder() {
    return config.shuffleTeamOrder ? shuffle(config.teams) : [...config.teams]
  })
  const [turn, setTurn] = useState<Turn>(0)
  const [wonWords, setWonWords] = useState<Record<string, Word[]>>({})
  const [knobOffsetX, setKnobOffsetX] = useState<number | undefined>(undefined)
  const leftPressed = useKeyPress('ArrowLeft')
  const rightPressed = useKeyPress('ArrowRight')
  const controlsRef = useRef<HTMLDivElement>(null)
  // Seeded with no-ops: the real handlers are assigned by syncActionRefs
  // below before any keyup can plausibly reach them, so these initial
  // values are never meant to be called themselves.
  const skipWordRef = useRef(() => { })
  const winWordRef = useRef(() => { })
  const [{ bowl, currentWord }, setBowlState] =
    useState<BowlState>(function initBowlState(): BowlState {
      return { bowl: [...source.getWords()], currentWord: undefined }
    })
  const wordCardRef = useRef<HTMLDivElement>(null)
  const prevLeftPressed = useRef(false)
  const prevRightPressed = useRef(false)
  // Resolved once from the CSS custom properties so the palette can't drift
  // out of sync with the stylesheet. Lazy initializer avoids re-reading
  // computed style on every render.
  const [palette] = useState<{ bg: Color; danger: Color; accent: Color }>(
    function initPalette() {
      const styles = getComputedStyle(document.documentElement)
      return {
        bg: hexToColor(styles.getPropertyValue('--color-bg')),
        danger: hexToColor(styles.getPropertyValue('--color-danger')),
        accent: hexToColor(styles.getPropertyValue('--color-accent')),
      }
    }
  )

  // Display order follows the (possibly shuffled) team order, not the
  // original config order — the two can differ once shuffleTeamOrder is set.
  const team = teams[turn]
  const roundReadyToStart = bowl.length > 0 && currentWord === undefined
  const inPlay = Boolean(currentWord) // only false when bowl is empty

  // Keep the ref-stored action handlers pointing at the latest skipWord/winWord
  // closures. Runs on every render (no deps) since skipWord/winWord capture
  // currentWord/bowl/team, which change often; the effects below read through
  // these refs instead of depending on skipWord/winWord directly, so they
  // don't need to re-run just because a closure was redefined.
  useEffect(function syncActionRefs() {
    skipWordRef.current = skipWord
    winWordRef.current = () => winWord(team)
  })

  // Start/stop the turn timer based on whether there's a word in play.
  // Deliberately keyed on the `inPlay` boolean rather than `currentWord` or
  // `timeLeft`, so swapping words within a turn (skip/win) or ticking down
  // doesn't restart the timer — only a true has-word/no-word transition does.
  useEffect(function syncTimerToPlayState() {
    if (inPlay) {
      startTimer()
    } else {
      stopTimer()
    }

    return () => stopTimer()
  }, [inPlay, startTimer, stopTimer])

  // Fires skipWord only when ArrowLeft is *released*, not pressed — so the
  // word-card can show the danger color while held without changing the
  // word underneath the player.
  useEffect(function handleSkipKeyRelease() {
    if (prevLeftPressed.current && !leftPressed) {
      skipWordRef.current()
    }
    prevLeftPressed.current = leftPressed
  }, [leftPressed])

  // Mirrors handleSkipKeyRelease above, for ArrowRight/winWord.
  useEffect(function handleWinKeyRelease() {
    if (prevRightPressed.current && !rightPressed) {
      winWordRef.current()
    }
    prevRightPressed.current = rightPressed
  }, [rightPressed])

  function startTurn() {
    resetTimer()
    startTimer()
  }

  function startRound() {
    const { word, remaining } = pickWord(source.getWords())

    setBowlState({ bowl: remaining, currentWord: word })
    startTurn()
  }

  // Returns a color string for the word-card to show swipe progress
  function computeColor(progress: number) {
    const target = progress > 0 ? palette.accent : palette.danger
    return colorToRgbString(interpolateColor(palette.bg, target, Math.abs(progress)))
  }

  // Called by useTimer when the turn clock hits zero. Advances to the next
  // team and restarts the clock for them. Guarded on currentWord so a
  // trailing expiry firing after the bowl's already emptied (round end)
  // doesn't advance turns pointlessly.
  function handleTimerExpiry() {
    if (currentWord) {
      advanceTurn()
      startTurn()
    }
  }

  function showSwipeProgress(progress: number) {
    if (!wordCardRef.current) return

    wordCardRef.current.style.backgroundColor = computeColor(progress)
  }

  function followCursor(event: React.PointerEvent) {
    if (!inPlay) return // disable swipe

    // Touch pointers only exist while a finger is in contact, so this
    // passes only real drags — desktop mouse hover (and pen) is ignored.
    // isPrimary keeps a second steadying finger from yanking the knob.
    if (event.pointerType !== "touch" || !event.isPrimary) return
    const container = controlsRef.current
    if (!container) return

    // Dragging should track the finger 1:1 with no easing — disable the
    // CSS transition for the duration of the drag.
    if (wordCardRef.current) wordCardRef.current.style.transition = 'none'

    const rect = container.getBoundingClientRect()
    const relativeX = event.clientX - rect.left
    const horizontalGap = 25 // experimentally determined
    // Clamp so the knob can't be dragged past the pill's edges
    const clamped = Math.min(Math.max(relativeX, horizontalGap), rect.width - horizontalGap)
    const threshold = 0.3 * rect.width
    const midpoint = rect.width * 0.5
    const knobX = clamped - midpoint
    const progress = Math.min(Math.max(knobX / threshold, -1), 1)
    const onLastWord = bowl.length === 0

    // if on last word, only enable right swipe
    setKnobOffsetX(clamped)
    showSwipeProgress(onLastWord ? Math.max(0, progress) : progress)
  }

  function releaseKnob(event: React.PointerEvent) {
    if (event.pointerType !== "touch" || !event.isPrimary) return
    const container = controlsRef.current
    if (!container || knobOffsetX === undefined) return

    // Re-enable the transition so the card eases back to its base color
    // instead of snapping.
    if (wordCardRef.current) wordCardRef.current.style.transition = ''

    const rect = container.getBoundingClientRect()
    const threshold = 0.3 * rect.width
    const midpoint = rect.width * 0.5

    // Check if swipe was sufficient to count as a deliberate gesture,
    // rather than firing on any small nudge of the knob.
    if (knobOffsetX >= midpoint + threshold) winWord(team)
    if (knobOffsetX <= midpoint - threshold) skipWord()

    setKnobOffsetX(undefined)
    showSwipeProgress(0)
  }

  // Renders a raw seconds count as M:SS for the on-screen timer display.
  function formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Advances turn order by one, wrapping back to the first team. Team order
  // was fixed once at mount (possibly shuffled), so this only ever walks
  // through that same fixed sequence.
  function advanceTurn() {
    const nextTurn = (turn + 1) % teams.length
    setTurn(nextTurn)
  }

  function advanceRound() {
    if (round < 3) {
      setRound((r) => r + 1 as Round)
    }
  }

  // Discards the current word back into the bowl (via switchWord, which
  // re-inserts it at a random later position so it can come up again) and
  // draws the next one. If switchWord reports no word available — the bowl
  // is down to just this one word — leave state untouched rather than
  // clearing currentWord, since a skip shouldn't be able to end the round;
  // only winWord should.
  function skipWord() {
    if (!currentWord) return

    const { word, remaining } = switchWord(currentWord, bowl)

    if (word)
      setBowlState({ bowl: remaining, currentWord: word })

    // if it's the last word, do nothing
  }

  // Stops the clock and resets it in preparation for the next round.
  // Actual round-transition UI/state (advancing `round`, refilling the
  // bowl, etc.) isn't implemented yet.
  function endRound() {
    stopTimer()
    resetTimer()

    // TODO: show score for each round
    if (round === 3) return

    setBowlState({ bowl: [...source.getWords()], currentWord: undefined })
    advanceRound()
    setTurn(0)
  }

  // Credits the current word to the given team's tally, then draws the next
  // word from the bowl. Unlike skipWord, this is the path that can actually
  // empty the bowl — pickWord returning no word means every word has been
  // won, so the round ends here.
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
    roundReadyToStart ?
      <RoundIntroCurtain round={round} nextTeamName={team.name} onBegin={startRound} />
      :
      <section className="screen" aria-label={copy.gameplay.title}>
        <div className="turn-meta">
          <span className="badge">{copy.gameplay.roundLabel(round, copy.gameplay.round[round].label)}</span>
          {/* Deliberately not an aria-live region: this updates every second,
            and a live region would re-announce the countdown to screen
            reader users every tick, which is disruptive rather than
            helpful. aria-label gives it a clear accessible name instead, so
            it reads sensibly if a user navigates to it directly. */}
          <span className="timer" aria-label={copy.gameplay.timeRemainingLabel(formatTime(timeLeft))}>{formatTime(timeLeft)}</span>
        </div>

        <p className="turn-indicator">{copy.gameplay.turnIndicator(team.name)}</p>

        <div
          className={`word-card${inPlay ? (
            ((leftPressed && bowl.length > 0) ? ' word-card--skip' : '') +
            (rightPressed ? ' word-card--correct' : '')
          ) : ''}`}
          ref={wordCardRef}
        >
          {/* role="status" (implies aria-live="polite" + aria-atomic) so a
            screen reader announces the new prompt whenever it changes on
            skip/win, without announcing anything on the color-only
            className changes above (those don't touch this text node). */}
          <p className="word-card__word" role="status">{currentWord}</p>
        </div>

        <div
          className="turn-controls"
          ref={controlsRef}
          onPointerMove={followCursor}
          onPointerCancel={releaseKnob}
          onPointerLeave={releaseKnob}
        >
          <button
            className={`turn-controls__side turn-controls__side--skip${inPlay && bowl.length > 0 && leftPressed ? ' turn-controls__side--active' : ''}`}
            type="button"
            onClick={skipWord}
            disabled={!inPlay || bowl.length === 0}
          >
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
            className={`turn-controls__side turn-controls__side--pass${inPlay && rightPressed ? ' turn-controls__side--active' : ''}`}
            type="button"
            onClick={() => winWord(team)}
            disabled={!inPlay}
          >
            {copy.gameplay.gotItButton} <span aria-hidden="true">&rarr;</span>
          </button>
        </div>

        <p className="words-left">
          {copy.gameplay.wordsLeft(bowl.length + (currentWord ? 1 : 0))}
        </p>
      </section>
  )
}

export default GameplayScreen
