import { useState, useEffect } from "react"
import { useTimer } from "../hooks/useTimer"
import type { GameConfig, Word, WordSource, Team, Round, Scores } from "../types"
import { pickWord, switchWord } from "../words/pickWord"
import { shuffle } from "../teams/shuffle"
import RoundIntroCurtain from "./RoundIntroCurtain"
import TurnScreen from "./TurnScreen"
import TurnCurtain from "./TurnCurtain"
import ScoreboardScreen from "./ScoreboardScreen"

type Bowl = Word[]
type Turn = number
type BowlState = { bowl: Bowl; currentWord: Word | undefined }
// Tracks per-round totals under each team's id, plus the words won during
// the turn currently in progress under the reserved "onTurn" key.
type WonWords = Record<string, Word[]>

function GameplayScreen({
  config,
  source,
}: {
  config: GameConfig,
  source: WordSource,
}) {
  // Resumes at whatever round scores says has actually been played, rather
  // than always starting at 1 — this component has no persistence of its
  // own, so it remounts fresh every time the player navigates back from
  // the scoreboard. Without this, `round` would reset to 1 on every visit
  // while `scores[i].rounds` kept growing, and endRound's `round === 3`
  // guard would never see round 3, letting rounds arrays grow past 3.
  const [round, setRound] = useState<Round>(1)
  const { timeLeft, resetTimer, startTimer, stopTimer } = useTimer(config.timerSeconds, handleTimerExpiry)
  const [teams] = useState<Team[]>(function initTeamOrder() {
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

    if (word)
      setBowlState({ bowl: remaining, currentWord: word })

    // if it's the last word, do nothing
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

  // Closes the turn-summary curtain. If it was closing out a round,
  // bowl/currentWord are already primed for the next round (or, at round
  // 3, there's nowhere left to go yet — see the TODO in endRound) — either
  // way there's nothing left to do here. Otherwise it's an ordinary
  // mid-round handoff, so start the next turn's clock.
  function handleTurnCurtainNext() {
    setTurnEnded(false)
    if (!roundJustEnded) {
      startTurn()
    }
  }

  function handleScoreboardNext() {
    // TODO: fix wiring to handle replay and return to GameSetup
    setRoundJustEnded(false)
  }

  return (
    turnEnded ?
      <TurnCurtain
        correctCount={(wonWords.onTurn ?? []).length}
        nextTeamName={team.name}
        round={gameEnded ?
          round :
          /* NOTE: when game hasn't ended, round is the next round, so we decrement */
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
