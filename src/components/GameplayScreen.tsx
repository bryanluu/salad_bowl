import { useState, useEffect, useRef } from "react"
import { useTimer } from "../hooks/useTimer"
import { useWakeLock } from "../hooks/useWakeLock"
import type { GameConfig, Word, WordSource, Team, Round, Scores } from "../types"
import { pickWord, switchWord } from "../words/pickWord"
import { shuffle } from "../teams/shuffle"
import RoundIntroCurtain from "./RoundIntroCurtain"
import TurnScreen from "./TurnScreen"
import TurnCurtain from "./TurnCurtain"
import ScoreboardScreen from "./ScoreboardScreen"
import { useSoundEffects } from "../hooks/useSoundEffects"

type Bowl = Word[]
type Turn = number
type BowlState = { bowl: Bowl; currentWord: Word | undefined }
// Tracks per-round totals under each team's id, plus the words won during
// the turn currently in progress under the reserved "onTurn" key.
type WonWords = Record<string, Word[]>

// SB-50: how many seconds before expiry the tick sound starts playing.
// Infinity means "tick for the whole turn". Set this to something smaller
// (e.g. 5) for an urgency-ramp instead — an open design question, left at
// "always tick" for now; adjust here only, no call sites need to change.
const TICK_LAST_N_SECONDS = Infinity

function GameplayScreen({
  config,
  source,
  onNewGame,
}: {
  config: GameConfig,
  source: WordSource,
  onNewGame: () => void,
}) {
  const { play } = useSoundEffects()
  const [round, setRound] = useState<Round>(1)
  const { timeLeft, resetTimer, startTimer, stopTimer } = useTimer(config.timerSeconds, handleTimerExpiry)
  const [teams] = useState<Team[]>(
    function initTeamOrder() {
      return config.shuffleTeamOrder ? shuffle(config.teams) : [...config.teams]
    })
  const [turn, setTurn] = useState<Turn>(0)
  const [wonWords, setWonWords] = useState<WonWords>({})
  const [{ bowl, currentWord }, setBowlState] =
    useState<BowlState>(function initBowlState(): BowlState {
      return { bowl: [...source.getWords()], currentWord: undefined }
    })
  // Whether the turn that just ended is waiting on TurnCurtain's "Go"
  // before the player moves on. Deliberately its own state rather than
  // derived from `timeLeft === 0` — both endRound and startTurn call
  // resetTimer(), which would otherwise flip this back to "not done"
  // before the curtain ever rendered.
  const [turnEnded, setTurnEnded] = useState(false)
  // Whether the pending TurnCurtain is closing out a whole round (true)
  // vs. an ordinary mid-round turn handoff (false). Determines what
  // handleTurnCurtainNext does once the player taps "Go".
  const [roundJustEnded, setRoundJustEnded] = useState(false)
  const [scores, setScores] = useState<Scores>(
    function initScores() {
      return config.teams.map((t) => {
        return { ...t, rounds: [] }
      })
    })

  // Display order follows the (possibly shuffled) team order, not the
  // original config order — the two can differ once shuffleTeamOrder is set.
  const team = teams[turn]
  const roundReadyToStart = bowl.length > 0 && currentWord === undefined
  const inPlay = Boolean(currentWord) // only false when bowl is empty
  const gameEnded = bowl.length === 0 && currentWord === undefined
  // Keep the screen awake while a word is in play — the live turn and the
  // between-turn curtain, where the phone is physically passed to the next
  // player (inPlay stays true through it). Drops during the round intro,
  // the scoreboard, and on unmount.
  useWakeLock(inPlay)

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

  // The urgency tick, driven by the same timeLeft the countdown displays —
  // exactly one tick per second. Guards against firing on timeLeft
  // increasing (shouldn't normally happen, but this way the effect only
  // reacts to genuine countdown ticks) and skips the final tick to zero —
  // that moment belongs to the expiry buzzer instead (see
  // handleTimerExpiry), so the two never overlap even without a priority
  // system to fall back on.
  const prevTimeLeftRef = useRef(timeLeft)
  useEffect(function playTickSound() {
    if (
      inPlay &&
      timeLeft < prevTimeLeftRef.current &&
      timeLeft > 0 &&
      timeLeft <= TICK_LAST_N_SECONDS
    ) {
      play('tick')
    }
    prevTimeLeftRef.current = timeLeft
  }, [timeLeft, inPlay, play])

  function startTurn() {
    resetTimer()
    startTimer()
    setWonWords({ ...wonWords, onTurn: [] })
  }

  function startRound() {
    const { word, remaining } = pickWord(source.getWords())

    setBowlState({ bowl: remaining, currentWord: word })
    // Full reset, not just onTurn: a new round means no team carries over
    // the previous round's per-round tally either. Safe to do here (rather
    // than in endRound) since TurnCurtain has already shown wonWords.onTurn
    // for the round-ending turn by the time this runs.
    setWonWords({})
    resetTimer()
    startTimer()
  }

  // Called by useTimer when the turn clock hits zero. Advances to the next
  // team and queues the turn-summary curtain. Guarded on currentWord so a
  // trailing expiry firing after the bowl's already emptied (round end)
  // doesn't advance turns pointlessly.
  function handleTimerExpiry() {
    if (currentWord) {
      // Plays regardless of whatever else might be sounding right now
      // (e.g. a word won on this exact second) — sounds are independent,
      // not priority-ranked, so this and a `win` sting really can overlap.
      // Acceptable per the ticket's design notes: expected to be rare.
      play('buzzer')
      advanceTurn()
      setTurnEnded(true)
      setRoundJustEnded(false)

      setBowlState((prev) => {
        if (!prev.currentWord) return prev
        // returns the currentWord to bowl then picks a fresh one,
        // not neccessarily a different word
        const { word, remaining } = pickWord([...prev.bowl, prev.currentWord])
        return { bowl: remaining, currentWord: word }
      })
    }
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

    // if it's the last word, do nothing — and don't play a skip for a
    // swap that never happened either.
    if (!word) return

    setBowlState({ bowl: remaining, currentWord: word })
    play('skip')
  }

  // Turns wonWordsToTally into this round's per-team counts and hands them
  // off to the parent. Takes the map as a parameter rather than reading the
  // `wonWords` state variable directly — see the comment in winWord for why.
  // Falls back to an empty array per team (`?? []`) since a team that won
  // nothing this round never gets a key in the map at all.
  function tallyScores(wonWordsToTally: WonWords) {
    const newScores = scores.map(
      function addWonWordsToScores(team) {
        const wordsWonByTeam = (wonWordsToTally[team.id] ?? []).length
        return { ...team, rounds: [...team.rounds, wordsWonByTeam] }
      })
    setScores(newScores)
  }

  function prepareRound() {
    setBowlState({ bowl: [...source.getWords()], currentWord: undefined })
    advanceTurn()
  }

  // Tallies the round's score and queues the turn-summary curtain. If
  // there's another round to play, its bowl/turn/round-number are prepped
  // now so RoundIntroCurtain is ready the moment the curtain closes.
  // Doesn't touch `wonWords` or the timer — TurnCurtain still needs
  // `wonWords.onTurn` for its recap, and startRound is what resets both
  // once the player actually continues.
  function endRound(wonWordsToTally: WonWords) {
    tallyScores(wonWordsToTally)
    setTurnEnded(true)
    setRoundJustEnded(true)

    if (round === 3) return

    advanceRound()
    prepareRound()
  }

  // Credits the current word to the given team's tally, then draws the next
  // word from the bowl. Unlike skipWord, this is the path that can actually
  // empty the bowl — pickWord returning no word means every word has been
  // won, so the round ends here.
  function winWord(team: Team) {
    if (!currentWord) return

    // Plays even on the round-ending word — the round/celebration sting
    // is a later moment (the scoreboard), reached via the player's tap.
    play('win')

    // tracks teamTotal this round
    const teamWords = wonWords[team.id] ?? []
    // tracks words won on current turn
    const wonOnTurn = wonWords.onTurn ?? []
    // Built as a local variable, not just passed straight to setWonWords,
    // because endRound (a few lines down) needs it too. setWonWords is
    // async — if endRound instead read the `wonWords` state variable, it
    // would see the *previous* render's value, missing the word just won
    // here. That's most visible on the very last word of a round: it can
    // be a team's first win, so the stale `wonWords` wouldn't even have an
    // entry for that team yet, compounding with the missing-key case above.
    const updatedWonWords: WonWords = {
      ...wonWords,
      [team.id]: [...teamWords, currentWord],
      onTurn: [...wonOnTurn, currentWord],
    }
    setWonWords(updatedWonWords)

    const { word, remaining } = pickWord(bowl)
    setBowlState({ bowl: remaining, currentWord: word })
    if (!word) {
      endRound(updatedWonWords)
    }
  }

  function handleTurnCurtainNext() {
    setTurnEnded(false)
    if (!roundJustEnded) {
      startTurn()
    }
  }

  function handleScoreboardNext() {
    setRoundJustEnded(false)
    if (gameEnded) {
      onNewGame()
    }
  }

  return (
    turnEnded ?
      <TurnCurtain
        correctCount={(wonWords.onTurn ?? []).length}
        nextTeamName={team.name}
        round={gameEnded ?
          round :
          /* when game hasn't ended, round is the next round, so we decrement */
          round - 1 as Round}
        roundEnded={roundJustEnded}
        onNext={handleTurnCurtainNext} />
      :
      (roundJustEnded ?
        <ScoreboardScreen
          scores={scores}
          onNext={handleScoreboardNext} />
        :
        (roundReadyToStart ?
          <RoundIntroCurtain round={round} nextTeamName={team.name} onBegin={startRound} />
          :
          <TurnScreen
            round={round}
            team={team}
            timeLeft={timeLeft}
            currentWord={currentWord}
            bowlLength={bowl.length}
            onSkip={skipWord}
            onWin={() => winWord(team)}
          />
        )))
}

export default GameplayScreen
