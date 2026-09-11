import { useState, useEffect } from "react"
import { useTimer } from "../hooks/useTimer"
import type { GameConfig, Word, WordSource, Team, Round } from "../types"
import { pickWord, switchWord } from "../words/pickWord"
import { shuffle } from "../teams/shuffle"
import RoundIntroCurtain from "./RoundIntroCurtain"
import TurnScreen from "./TurnScreen"

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
  const [{ bowl, currentWord }, setBowlState] =
    useState<BowlState>(function initBowlState(): BowlState {
      return { bowl: [...source.getWords()], currentWord: undefined }
    })

  // Display order follows the (possibly shuffled) team order, not the
  // original config order — the two can differ once shuffleTeamOrder is set.
  const team = teams[turn]
  const roundReadyToStart = bowl.length > 0 && currentWord === undefined
  const inPlay = Boolean(currentWord) // only false when bowl is empty

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
      startTurn()

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
      <TurnScreen
        round={round}
        team={team}
        timeLeft={timeLeft}
        currentWord={currentWord}
        bowlLength={bowl.length}
        onSkip={skipWord}
        onWin={() => winWord(team)}
      />
  )
}

export default GameplayScreen
