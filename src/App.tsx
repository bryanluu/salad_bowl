import { useState } from 'react'
import StartScreen from './components/StartScreen'
import WordEntryScreen from './components/WordEntryScreen'
import GameSetupScreen from './components/GameSetupScreen'
import GameplayScreen from './components/GameplayScreen'
import Footer from './components/Footer'
import { LocalWordSource } from './wordSources/LocalWordSource'
import { copy } from './copy/en.ts'
import type {
  ScreenId,
  GameConfig,
  WordSource,
} from './types'
import {
  loadGame,
  clearGame,
  type SavedGame,
  type GameplaySnapshot,
} from './persistence/gameStorage'
import { generateWord } from './words/generateWord.ts'
import { useSoundEffects } from './hooks/useSoundEffects'

type ScreenProps = {
  source: WordSource
  config: GameConfig
  onCommitConfig: (newConfig: GameConfig) => void
  // The plain new-game route (the scoreboard's "New game").
  onNewGame: () => void
  // The start-screen Play button: confirms first if a save is present.
  onPlay: () => void
  // Present only when there's a save to resume from.
  onResume?: () => void
  onSubmitWords: () => void
  // The snapshot a resumed gameplay screen should start from, or undefined
  // for a fresh game.
  initialState?: GameplaySnapshot
}

function renderScreen(screenId: ScreenId,
  {
    source,
    config,
    onCommitConfig,
    onNewGame,
    onPlay,
    onResume,
    onSubmitWords,
    initialState,
  }: ScreenProps) {
  switch (screenId) {
    case 'start':
      return <StartScreen onStart={onPlay} onResume={onResume} />
    case 'game-setup':
      return <GameSetupScreen config={config} onSubmit={onCommitConfig} />
    case 'word-entry':
      return <WordEntryScreen config={config} source={source} onSubmitWords={onSubmitWords} />
    case 'gameplay':
      return <GameplayScreen
        config={config}
        source={source}
        onNewGame={onNewGame}
        initialState={initialState} />
  }
}

const defaultGameConfig: GameConfig = {
  totalPlayers: 4,
  teams: [
    { id: 'team-1', name: 'Team 1', players: 2 },
    { id: 'team-2', name: 'Team 2', players: 2 },
  ],
  timerSeconds: 60,
  wordsPerPlayer: 5,
  shuffleTeamOrder: true,
  hideWordsDuringEntry: true,
  generateAllWords: false,
}

function App() {
  const { play } = useSoundEffects()
  const [activeScreen, setActiveScreen] = useState<ScreenId>('start')
  const [gameConfig, setGameConfig] = useState<GameConfig>(defaultGameConfig)
  const [source, setSource] = useState(() => new LocalWordSource(gameConfig.totalPlayers * gameConfig.wordsPerPlayer))
  // The single save slot, re-read each time we land on the start screen: the
  // gameplay screen writes newer checkpoints than whatever we cached, so a
  // stale copy would let the Resume button offer an outdated game. Drives
  // whether StartScreen offers Resume at all.
  const [savedGame, setSavedGame] = useState<SavedGame | null>(() => loadGame())
  // Snapshot a freshly-mounted GameplayScreen should start from on a resume;
  // cleared to undefined on every non-resume route into gameplay so a new
  // game never begins from an old snapshot.
  const [resumeState, setResumeState] = useState<GameplaySnapshot | undefined>(undefined)
  const started = (activeScreen !== 'start')

  function resetSource() {
    setSource(() => new LocalWordSource(gameConfig.totalPlayers * gameConfig.wordsPerPlayer))
  }

  function switchScreen(newScreenId: ScreenId) {
    setActiveScreen(() => newScreenId)
  }

  // Shared by every fresh game (start-screen Play, scoreboard "New game"):
  // drop the in-progress save so a new game *replaces* it (rather than the
  // first checkpoint of the new game overwriting it), and clear the resume
  // snapshot so the fresh gameplay mount starts clean.
  function startNewGame() {
    clearGame()
    setSavedGame(null)
    setResumeState(undefined)
    resetSource()
    switchScreen('game-setup')
  }

  // Only the start-screen Play button asks to replace an existing save. The
  // confirm lives here (not in startNewGame) so the scoreboard's "New game",
  // which also routes through startNewGame, never prompts.
  function handlePlayFromStart() {
    if (savedGame && !window.confirm(copy.start.replaceSaveConfirm)) return
    startNewGame()
  }

  function handleSubmitConfig(newConfig: GameConfig) {
    // A non-resume route into gameplay: make sure no old snapshot lingers.
    setResumeState(undefined)
    setGameConfig(newConfig)
    setSource(() => {
      const source = new LocalWordSource(newConfig.totalPlayers * newConfig.wordsPerPlayer)
      if (newConfig.generateAllWords) {
        while (source.count() < source.maxWords) {
          const generated = generateWord()
          source.addWord(generated)
        }
      }
      return source
    })
    if (newConfig.generateAllWords && newConfig.hideWordsDuringEntry) {
      // we skip the word entry screen, because all words are generated and
      // nobody can see them
      switchScreen('gameplay')
    } else {
      switchScreen('word-entry')
    }
  }

  function handleSubmitWords() {
    setResumeState(undefined)
    switchScreen('gameplay')
  }

  function handleResume() {
    // Re-read rather than trust `savedGame`: gameplay may have written a
    // newer checkpoint since the start screen last rendered.
    const saved = loadGame()
    if (!saved) {
      setSavedGame(null)
      return
    }

    // Rebuild the word source from the saved words. A word that no longer
    // passes LocalWordSource's checks means the save is inconsistent — treat
    // it as invalid and drop it rather than resume a corrupt game.
    const source = new LocalWordSource(saved.config.totalPlayers * saved.config.wordsPerPlayer)
    const allAccepted = saved.sourceWords.every((word) => source.addWord(word))
    if (!allAccepted) {
      clearGame()
      setSavedGame(null)
      return
    }

    const snapshot: GameplaySnapshot = {
      teams: saved.teams,
      round: saved.round,
      turn: saved.turn,
      bowl: saved.bowl,
      currentWord: saved.currentWord,
      wonWords: saved.wonWords,
      scores: saved.scores,
      turnEnded: saved.turnEnded,
      roundJustEnded: saved.roundJustEnded,
    }
    setGameConfig(saved.config)
    setSource(source)
    setResumeState(snapshot)
    switchScreen('gameplay')
  }

  function handleQuit() {
    // A save now survives a quit — that's the point of resume — so the confirm
    // no longer warns that progress is lost, and quitting deliberately does
    // NOT clear the save.
    if (window.confirm(copy.footer.quitConfirm)) {
      // A distinct, lower-key sound than the generic tap — leaving is a
      // different event from acting.
      play('quit')
      // Gameplay just wrote newer checkpoints than the copy we cached; re-read
      // so the Resume button reflects the latest on the start screen.
      setSavedGame(loadGame())
      switchScreen('start')
    }
  }

  return (
    <main className="app">
      <div className="app__inner">
        {renderScreen(activeScreen,
          {
            source,
            config: gameConfig,
            onCommitConfig: handleSubmitConfig,
            onSubmitWords: handleSubmitWords,
            onPlay: handlePlayFromStart,
            onNewGame: startNewGame,
            onResume: savedGame ? handleResume : undefined,
            initialState: resumeState,
          })}
      </div>
      <Footer showLogo={started} onQuit={handleQuit} />
    </main>
  )
}

export default App
