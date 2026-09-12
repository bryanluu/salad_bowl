import { useState, useRef, useEffect } from "react"
import type { Round, Team, Word } from "../types"
import { copy } from "../copy/en"
import { useKeyPress } from "../hooks/useKeyPress"
import { interpolateColor, colorToRgbString, hexToColor, type Color } from "../colors/interpolateColor"

type TurnScreenProps = {
  round: Round
  team: Team
  timeLeft: number
  currentWord: Word | undefined
  // Words remaining in the bowl, not counting currentWord. Drives the
  // "words left" count, the skip button's disabled state, and whether a
  // left-swipe is allowed (skipping on the last word isn't).
  bowlLength: number
  // GameplayScreen owns *what* skip/win mean for the bowl; TurnScreen only
  // decides *when* the player has triggered one, via swipe or arrow keys.
  onSkip: () => void
  onWin: () => void
}

// Renders a raw seconds count as M:SS for the on-screen timer display.
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// The active-turn half of GameplayScreen: word card, timer, and the
// skip/got-it swipe controls. Owns all of the turn's interaction state
// (swipe tracking, keyboard shortcuts, card color feedback) — none of it
// is game state, so none of it needs to live in GameplayScreen. Only the
// bowl/team/timer values to display, and onSkip/onWin to report a
// decision, cross the boundary.
function TurnScreen({ round, team, timeLeft, currentWord, bowlLength, onSkip, onWin }: TurnScreenProps) {
  const inPlay = Boolean(currentWord) // only false when bowl is empty
  const [knobOffsetX, setKnobOffsetX] = useState<number | undefined>(undefined)
  const leftPressed = useKeyPress('ArrowLeft')
  const rightPressed = useKeyPress('ArrowRight')
  const controlsRef = useRef<HTMLDivElement>(null)
  const wordCardRef = useRef<HTMLDivElement>(null)
  const prevLeftPressed = useRef(false)
  const prevRightPressed = useRef(false)
  // Seeded with no-ops: the real handlers are assigned by syncActionRefs
  // below before any keyup can plausibly reach them, so these initial
  // values are never meant to be called themselves.
  const skipRef = useRef(() => { })
  const winRef = useRef(() => { })
  // Resolved once from the CSS custom properties so the palette can't drift
  // out of sync with the stylesheet. Lazy initializer avoids re-reading
  // computed style on every render. Re-resolved each time a turn screen
  // mounts (i.e. once per round, since the curtain swaps this component
  // out between rounds) rather than once per game — cheap, and keeps the
  // palette honest if the stylesheet's custom properties ever change.
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

  // Keep the ref-stored handlers pointing at the latest onSkip/onWin props.
  // Runs on every render (no deps) since GameplayScreen passes a fresh
  // onWin closure each render; the effects below read through these refs
  // instead of depending on onSkip/onWin directly, so they don't need to
  // re-run just because the parent re-rendered.
  useEffect(function syncActionRefs() {
    skipRef.current = onSkip
    winRef.current = onWin
  })

  // Fires onSkip only when ArrowLeft is *released*, not pressed — so the
  // word-card can show the danger color while held without changing the
  // word underneath the player.
  useEffect(function handleSkipKeyRelease() {
    if (prevLeftPressed.current && !leftPressed) {
      skipRef.current()
    }
    prevLeftPressed.current = leftPressed
  }, [leftPressed])

  // Mirrors handleSkipKeyRelease above, for ArrowRight/onWin.
  useEffect(function handleWinKeyRelease() {
    if (prevRightPressed.current && !rightPressed) {
      winRef.current()
    }
    prevRightPressed.current = rightPressed
  }, [rightPressed])

  // Returns a color string for the word-card to show swipe progress
  function computeColor(progress: number) {
    const target = progress > 0 ? palette.accent : palette.danger
    return colorToRgbString(interpolateColor(palette.bg, target, Math.abs(progress)))
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
    const onLastWord = bowlLength === 0

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
    if (knobOffsetX >= midpoint + threshold) onWin()
    if (knobOffsetX <= midpoint - threshold) onSkip()

    setKnobOffsetX(undefined)
    showSwipeProgress(0)
  }

  return (
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
          ((leftPressed && bowlLength > 0) ? ' word-card--skip' : '') +
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
          className={`turn-controls__side turn-controls__side--skip${inPlay && bowlLength > 0 && leftPressed ? ' turn-controls__side--active' : ''}`}
          type="button"
          onClick={onSkip}
          disabled={!inPlay || bowlLength === 0}
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
          onClick={onWin}
          disabled={!inPlay}
        >
          {copy.gameplay.gotItButton} <span aria-hidden="true">&rarr;</span>
        </button>
      </div>

      <p className="words-left">
        {copy.gameplay.wordsLeft(bowlLength + (currentWord ? 1 : 0))}
      </p>
    </section>
  )
}

export default TurnScreen
