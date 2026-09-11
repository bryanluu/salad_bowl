import { useState, useEffect } from "react"
import { useTimer } from "../hooks/useTimer"
import type { GameConfig, Word, WordSource, Team, Round, Scores } from "../types"
import { pickWord, switchWord } from "../words/pickWord"
import { shuffle } from "../teams/shuffle"
import RoundIntroCurtain from "./RoundIntroCurtain"
import TurnScreen from "./TurnScreen"
import TurnCurtain from "./TurnCurtain"

type Bowl = Word[]
type Turn = number
type BowlState = { bowl: Bowl; currentWord: Word | undefined }
// Tracks per-round totals under each team's id, plus the words won during
// the turn currently in progress under the reserved "onTurn" key.
type WonWords = Record<string, Word[]>

function GameplayScreen({
  config,
  source,
  scores,
  updateScores }:
  {
    config: GameConfig,
    source: WordSource,
    scores: Scores,
    updateScores: (newScores: Scores) => void
  }) {
  // Resumes at whatever round scores says has actually been played, rather
  // than always starting at 1 — this component has no persistence of its
  // own, so it remounts fresh every time the player navigates back from
  // the scoreboard. Without this, `round` would reset to 1 on every visit
  // while `scores[i].rounds` kept growing, and endRound's `round === 3`
  // guard would never see round 3, letting rounds arrays grow past 3.
  const [round, setRound] = useState<Round>(function initRound(): Round {
    const roundsPlayed = scores[0]?.rounds.length ?? 0
    return Math.min(roundsPlayed + 1, 3) as Round
  })
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

  // Display order follows the (possibly shuffled) team order, not the
  // original config order — the two can differ once shuffleTeamOrder is set.
  const team = teams[turn]
  const roundReadyToStart = bowl.length > 0 && currentWord === undefined
  const inPlay = Boolean(currentWord) // only false when bowl is empty
  const turnIsDone = timeLeft === 0

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
    startTurn()
  }

  // Called by useTimer when the turn clock hits zero. Advances to the next
  // team and restarts the clock for them. Guarded on currentWord so a
  // trailing expiry firing after the bowl's already emptied (round end)
  // doesn't advance turns pointlessly.
  function handleTimerExpiry() {
    if (currentWord) {
      advanceTurn()

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
    updateScores(newScores)
  }

  // Stops the clock and resets it in preparation for the next round.
  function endRound(wonWordsToTally: WonWords) {
    stopTimer()
    resetTimer()
    tallyScores(wonWordsToTally)

    // TODO: show score for each round
    if (round === 3) return

    // Round totals live under each team's id in `wonWords`, and don't
    // reset between rounds on their own — clear them here so round 2's
    // tally doesn't include round 1's words.
    setWonWords({})
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

  return (
    roundReadyToStart ?
      <RoundIntroCurtain round={round} nextTeamName={team.name} onBegin={startRound} />
      :
      (turnIsDone ?
        <TurnCurtain
          correctCount={(wonWords.onTurn ?? []).length}
          nextTeamName={team.name}
          onNext={startTurn} />
        :
        <TurnScreen
          round={round}
          team={team}
          timeLeft={timeLeft}
          currentWord={currentWord}
          bowlLength={bowl.length}
          onSkip={skipWord}
          onWin={() => winWord(team)}
        />)
  )
}

export default GameplayScreen
